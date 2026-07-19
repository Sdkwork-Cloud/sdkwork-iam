use axum::{
    http::{HeaderMap, StatusCode},
    response::Response,
};
use base64::{engine::general_purpose::URL_SAFE_NO_PAD, Engine as _};
use hmac::{Hmac, Mac};
use rand_core::{OsRng, RngCore};
use sdkwork_iam_context_service::{AuthLevel, DeploymentMode, IamAppContext, IamUserSurface};
use sdkwork_web_core::{stamp_token_version, validate_token_version_json, TokenVersionPolicy};
use serde_json::{json, Value};
use sha2::{Digest, Sha256};
use sqlx::{types::Json, PgPool, Row};

use crate::{responses::*, state::*, utils::*};

pub(crate) const DEFAULT_SESSION_TTL_DAYS: u128 = 30;
pub(crate) const LOCAL_TOKEN_TTL_SECONDS: u128 = DEFAULT_SESSION_TTL_DAYS * 24 * 60 * 60;
pub(crate) const SIGNING_KEY_ROTATION_OVERLAP_SECONDS: i64 = LOCAL_TOKEN_TTL_SECONDS as i64;

pub(crate) const LOGIN_CREATION_FORBIDDEN_HEADERS: &[&str] = &["authorization", "x-api-key"];

pub(crate) type HmacSha256 = Hmac<Sha256>;

pub(crate) fn hash_token(token: &str) -> String {
    let digest = Sha256::digest(token.as_bytes());
    format!("{:x}", digest)
}

// ── Session lifecycle (database-driven) ────────────────────────────

pub(crate) async fn revoke_active_sessions_for_user(
    pg: &PgPool,
    tenant_id: &str,
    user_id: &str,
) -> Result<(), String> {
    let batch_size = sdkwork_iam_bootstrap::limits::IAM_ACTIVE_SESSION_REVOKE_BATCH_SIZE;
    loop {
        let now = current_timestamp_utc();
        let rows = sqlx::query(
            "UPDATE iam_session SET revoked_at = $3, updated_at = $4 \
             WHERE id IN ( \
               SELECT id FROM iam_session \
               WHERE tenant_id = $1 AND user_id = $2 AND revoked_at IS NULL \
               ORDER BY id \
               LIMIT $5 \
             ) \
             RETURNING id, organization_id",
        )
        .bind(tenant_id)
        .bind(user_id)
        .bind(&now)
        .bind(&now)
        .bind(batch_size)
        .fetch_all(pg)
        .await
        .map_err(|error| format!("revoke active sessions for user failed: {error}"))?;

        if rows.is_empty() {
            break;
        }

        let row_count = rows.len();
        for row in rows {
            let session_id: String = row.get(0);
            let organization_id: Option<String> = row.get(1);
            crate::security_events::record_session_revoked(
                pg,
                tenant_id,
                organization_id.as_deref(),
                user_id,
                &session_id,
            )
            .await;
        }

        if row_count < batch_size as usize {
            break;
        }
    }

    Ok(())
}

pub(crate) async fn create_session_record(
    pg: &PgPool,
    config: &LocalIamConfig,
    user: &LocalIamUser,
    organization_id: Option<String>,
    runtime_app_id: &str,
) -> Result<LocalSession, String> {
    if runtime_app_id.trim().is_empty() {
        return Err("runtime appId is required for session creation".to_string());
    }

    sdkwork_iam_web_adapter::validate_enabled_tenant_runtime_app(
        pg,
        &user.tenant_id,
        runtime_app_id,
    )
    .await?;

    revoke_active_sessions_for_user(pg, &user.tenant_id, &user.id).await?;

    let app_id = runtime_app_id.trim().to_string();
    let session_id = generate_opaque_token("session");
    let now = current_timestamp_utc();
    let expires_at = now + chrono::Duration::seconds(LOCAL_TOKEN_TTL_SECONDS as i64);

    let (data_scope, permission_scope, user_surface, standard_role_codes) =
        crate::authorization::resolve_session_authorization(
            pg,
            &user.tenant_id,
            &user.id,
            organization_id.as_deref(),
        )
        .await
        .unwrap_or_else(|_error| {
            (
                vec![format!("tenant:{}", user.tenant_id)],
                vec!["iam:self".to_string()],
                IamUserSurface::authenticated_app_user(),
                Vec::new(),
            )
        });

    let context = crate::authorization::enrich_app_context(
        IamAppContext::new(
            user.tenant_id.clone(),
            organization_id.as_deref(),
            user.id.clone(),
            session_id.clone(),
            app_id.clone(),
            environment_from_config(&config.environment),
            DeploymentMode::Saas,
            AuthLevel::Password,
            data_scope,
            permission_scope,
        ),
        user_surface,
        standard_role_codes,
    );

    // Generate signing key (stored in iam_tenant_signing_key)
    let signing_key = ensure_tenant_signing_key(pg, &user.tenant_id).await?;
    let access_token = sign_local_session_token(&signing_key, "access", &context);
    let auth_token = sign_local_session_token(&signing_key, "auth", &context);
    let refresh_token = generate_opaque_token("refresh");

    let auth_token_hash = hash_token(&auth_token);
    let access_token_hash = hash_token(&access_token);
    let refresh_token_hash = hash_token(&refresh_token);

    sqlx::query(
        "INSERT INTO iam_session (id, tenant_id, organization_id, login_scope, user_id, \
         principal_kind, principal_id, app_id, environment, deployment_mode, auth_level, \
         auth_token_hash, auth_token_kid, access_token_hash, access_token_kid, \
         refresh_token_hash, refresh_token_kid, sharding_key, sharding_strategy, \
         data_scope_json, permission_scope_json, expires_at, created_at, updated_at) \
         VALUES ($1, $2, $3, $4, $5, 'user', $5, $6, $7, $8, $9, \
                 $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)",
    )
    .bind(&session_id)
    .bind(&user.tenant_id)
    .bind(&organization_id)
    .bind(login_scope_to_string(&context.login_scope))
    .bind(&user.id)
    .bind(&app_id)
    .bind(environment_to_string(&context.environment))
    .bind(deployment_mode_to_string(&context.deployment_mode))
    .bind(auth_level_to_string(&context.auth_level))
    .bind(&auth_token_hash)
    .bind(&signing_key.kid)
    .bind(&access_token_hash)
    .bind(&signing_key.kid)
    .bind(&refresh_token_hash)
    .bind(&signing_key.kid)
    .bind(&user.tenant_id)
    .bind("tenant")
    .bind(Json(&context.data_scope))
    .bind(Json(&context.permission_scope))
    .bind(&expires_at)
    .bind(&now)
    .bind(&now)
    .execute(pg)
    .await
    .map_err(|e| format!("insert session failed: {e}"))?;

    crate::security_events::record_session_created(
        pg,
        &user.tenant_id,
        organization_id.as_deref(),
        &user.id,
        &session_id,
        auth_level_to_string(&context.auth_level),
    )
    .await;

    crate::audit_events::record_session_created(
        pg,
        config,
        &user.tenant_id,
        organization_id.as_deref(),
        &user.id,
        &session_id,
        auth_level_to_string(&context.auth_level),
        &context.data_scope,
        &context.permission_scope,
    )
    .await;

    Ok(LocalSession {
        access_token,
        auth_token,
        context,
        refresh_token,
        session_id,
        user: user.clone(),
    })
}

pub(crate) async fn remove_session(
    pg: &PgPool,
    config: &LocalIamConfig,
    session: &LocalSession,
) -> Result<(), String> {
    let now = current_timestamp_utc();
    sqlx::query("UPDATE iam_session SET revoked_at = $2, updated_at = $3 WHERE id = $1 AND revoked_at IS NULL")
        .bind(&session.session_id)
        .bind(&now)
        .bind(&now)
        .execute(pg)
        .await
        .map_err(|e| format!("revoke session failed: {e}"))?;
    crate::security_events::record_session_revoked(
        pg,
        &session.context.tenant_id,
        session.context.organization_id.as_deref(),
        &session.user.id,
        &session.session_id,
    )
    .await;
    crate::audit_events::record_session_revoked(
        pg,
        config,
        &session.context.tenant_id,
        session.context.organization_id.as_deref(),
        &session.user.id,
        &session.session_id,
    )
    .await;
    Ok(())
}

pub(crate) async fn revoke_sessions_for_username(
    pg: &PgPool,
    tenant_id: &str,
    username: &str,
) -> Result<(), String> {
    let batch_size = sdkwork_iam_bootstrap::limits::IAM_ACTIVE_SESSION_REVOKE_BATCH_SIZE;
    loop {
        let now = current_timestamp_utc();
        let rows = sqlx::query(
            "UPDATE iam_session SET revoked_at = $3, updated_at = $4 \
             WHERE id IN ( \
               SELECT s.id FROM iam_session s \
               JOIN iam_user u ON u.id = s.user_id \
               WHERE u.tenant_id = $1 AND u.username = $2 AND u.is_deleted = 0 \
                 AND s.revoked_at IS NULL \
               ORDER BY s.id \
               LIMIT $5 \
             ) \
             RETURNING id, organization_id, user_id",
        )
        .bind(tenant_id)
        .bind(username)
        .bind(&now)
        .bind(&now)
        .bind(batch_size)
        .fetch_all(pg)
        .await
        .map_err(|error| format!("revoke sessions for user failed: {error}"))?;

        if rows.is_empty() {
            break;
        }

        let row_count = rows.len();
        for row in rows {
            let session_id: String = row.get(0);
            let organization_id: Option<String> = row.get(1);
            let user_id: String = row.get(2);
            crate::security_events::record_session_revoked(
                pg,
                tenant_id,
                organization_id.as_deref(),
                &user_id,
                &session_id,
            )
            .await;
        }

        if row_count < batch_size as usize {
            break;
        }
    }

    Ok(())
}

// ── Session resolution from headers ────────────────────────────────

pub(crate) async fn resolve_session_from_headers(
    pg: &PgPool,
    headers: &HeaderMap,
) -> Option<LocalSession> {
    find_session_from_headers(pg, headers).await
}

#[allow(dead_code)]
pub(crate) async fn require_session(pg: &PgPool, headers: &HeaderMap) -> Option<LocalSession> {
    resolve_session_from_headers(pg, headers).await
}

pub(crate) async fn require_session_from_context(
    pg: &PgPool,
    ctx: &sdkwork_web_core::WebRequestContext,
) -> Option<LocalSession> {
    resolve_session_from_context(pg, ctx).await
}

pub(crate) async fn resolve_session_from_context(
    pg: &PgPool,
    ctx: &sdkwork_web_core::WebRequestContext,
) -> Option<LocalSession> {
    let principal = ctx.principal.as_ref()?;
    let session_id = principal.session_id()?;
    find_session_by_id(pg, session_id, principal.user_id(), principal.tenant_id()).await
}

pub async fn resolve_iam_app_context_from_dual_tokens(
    pg: &PgPool,
    raw_auth_token: &str,
    raw_access_token: &str,
) -> Option<IamAppContext> {
    sdkwork_iam_web_adapter::resolve_iam_app_context_from_dual_tokens(
        pg,
        raw_auth_token,
        raw_access_token,
    )
    .await
}

async fn find_session_from_headers(pg: &PgPool, headers: &HeaderMap) -> Option<LocalSession> {
    let auth_token = read_bearer_header(headers)?;
    let access_token = read_access_token(headers)?;
    find_session_from_dual_tokens(pg, &auth_token, &access_token).await
}

async fn find_session_from_dual_tokens(
    pg: &PgPool,
    auth_token: &str,
    access_token: &str,
) -> Option<LocalSession> {
    if auth_token.is_empty() || access_token.is_empty() {
        eprintln!("find_session_from_dual_tokens: empty token");
        return None;
    }
    let kid = jwt_header_kid(auth_token).or_else(|| jwt_header_kid(access_token))?;
    let signing_key = load_signing_key_by_kid(pg, &kid).await?;
    let now_unix = (current_millis() / 1000) as i64;
    let auth_claims = verify_local_session_token(&signing_key, auth_token, "auth", now_unix)?;
    let access_claims = verify_local_session_token(&signing_key, access_token, "access", now_unix)?;
    if !session_token_claims_match(&auth_claims, &access_claims) {
        eprintln!("find_session_from_dual_tokens: auth/access claims mismatch");
        return None;
    }

    let auth_hash = hash_token(auth_token);
    let access_hash = hash_token(access_token);

    let row = sqlx::query(
        "SELECT s.id, s.tenant_id, s.organization_id, s.login_scope, s.user_id, s.app_id, \
                s.environment, s.deployment_mode, s.auth_level, \
                s.data_scope_json, s.permission_scope_json, \
                u.username, u.display_name, u.email, u.phone, \
                u.email_verified, u.phone_verified, u.last_login_at, u.password_changed_at, \
                (SELECT EXISTS(SELECT 1 FROM iam_tenant_member tm \
                    WHERE tm.tenant_id = s.tenant_id AND tm.user_id = s.user_id AND tm.status = 'active')) AS app_member, \
                (SELECT EXISTS(SELECT 1 FROM iam_organization_membership om \
                    WHERE om.tenant_id = s.tenant_id AND om.user_id = s.user_id AND om.status = 'active')) AS organization_member \
         FROM iam_session s \
         JOIN iam_user u ON u.id = s.user_id AND u.tenant_id = s.tenant_id \
         WHERE s.auth_token_hash = $1 AND s.access_token_hash = $2 \
           AND s.revoked_at IS NULL AND s.expires_at::timestamptz > $3::timestamptz \
           AND u.status = 'active' AND u.is_deleted = 0 \
         LIMIT 1",
    )
    .bind(&auth_hash)
    .bind(&access_hash)
    .bind(current_timestamp_utc())
    .fetch_optional(pg)
    .await
    .map_err(|error| {
        eprintln!("find_session_from_dual_tokens sql error: {error}");
        error
    })
    .ok()??;

    let mut session = build_session_from_row(
        row,
        auth_token.to_string(),
        access_token.to_string(),
        String::new(),
    )?;
    hydrate_session_authorization_context(pg, &mut session).await;
    if !session_claims_match_context(&auth_claims, &session.context)
        || !session_claims_match_context(&access_claims, &session.context)
        || !signing_key_matches_claims(&signing_key, &auth_claims)
    {
        eprintln!(
            "find_session_from_dual_tokens: claims/context mismatch auth={} access={} signing={}",
            session_claims_match_context(&auth_claims, &session.context),
            session_claims_match_context(&access_claims, &session.context),
            signing_key_matches_claims(&signing_key, &auth_claims),
        );
        return None;
    }
    Some(session)
}

fn json_string_vec_from_row(row: &sqlx::postgres::PgRow, index: usize) -> Vec<String> {
    if let Ok(Json(value)) = row.try_get::<Json<Value>, _>(index) {
        return serde_json::from_value(value).unwrap_or_default();
    }
    if let Ok(text) = row.try_get::<String, _>(index) {
        return serde_json::from_str(&text).unwrap_or_default();
    }
    Vec::new()
}

fn build_session_from_row(
    row: sqlx::postgres::PgRow,
    auth_token: String,
    access_token: String,
    refresh_token: String,
) -> Option<LocalSession> {
    let session_id: String = row.get(0);
    let tenant_id: String = row.get(1);
    let organization_id: Option<String> = row.get(2);
    let login_scope: String = row.get(3);
    let user_id: String = row.get(4);
    let app_id: String = row.get(5);
    let environment: String = row.get(6);
    let deployment_mode: String = row.get(7);
    let auth_level: String = row.get(8);
    let data_scope = json_string_vec_from_row(&row, 9);
    let permission_scope = json_string_vec_from_row(&row, 10);
    let username: String = row.get(11);
    let display_name: String = row.get(12);
    let email: Option<String> = row.get(13);
    let phone: Option<String> = row.get(14);
    let email_verified: i32 = row.get(15);
    let phone_verified: i32 = row.get(16);
    let last_login_at: Option<String> = row.get(17);
    let password_changed_at: Option<String> = row.get(18);
    let app_member: bool = row.try_get::<bool, _>(19).unwrap_or(true);
    let organization_member: bool = row.try_get::<bool, _>(20).unwrap_or(false);

    let context = IamAppContext {
        app_id,
        tenant_id: tenant_id.clone(),
        organization_id,
        user_id: user_id.clone(),
        principal_kind: sdkwork_iam_context_service::IamPrincipalKind::User,
        principal_id: user_id.clone(),
        session_id: session_id.clone(),
        environment: environment_from_config(&environment),
        deployment_mode: match deployment_mode.as_str() {
            "local" => DeploymentMode::Local,
            "private" => DeploymentMode::Private,
            _ => DeploymentMode::Saas,
        },
        auth_level: match auth_level.as_str() {
            "password" => AuthLevel::Password,
            "mfa" => AuthLevel::Mfa,
            "system" => AuthLevel::System,
            _ => AuthLevel::Anonymous,
        },
        login_scope: login_scope_from_string(&login_scope),
        data_scope,
        permission_scope,
        user_surface: IamUserSurface {
            app: app_member,
            organization_member,
        },
        standard_role_codes: Vec::new(),
        display_name: display_name.clone(),
        email: email.clone().unwrap_or_default(),
        email_verified: email_verified != 0,
    };

    Some(LocalSession {
        access_token,
        auth_token,
        context,
        refresh_token,
        session_id,
        user: LocalIamUser {
            display_name,
            email,
            email_verified: email_verified != 0,
            id: user_id,
            last_login_at,
            password_changed_at,
            phone,
            phone_verified: phone_verified != 0,
            tenant_id: tenant_id.clone(),
            username,
        },
    })
}

async fn hydrate_session_authorization_context(pg: &PgPool, session: &mut LocalSession) {
    if let Ok((_, _, _, standard_role_codes)) = crate::authorization::resolve_session_authorization(
        pg,
        &session.context.tenant_id,
        &session.user.id,
        session.context.organization_id.as_deref(),
    )
    .await
    {
        session.context.standard_role_codes = standard_role_codes;
    }
}

// ── Refresh token lookup ───────────────────────────────────────────

const SESSION_REFRESH_SELECT: &str =
    "SELECT s.id, s.tenant_id, s.organization_id, s.login_scope, s.user_id, s.app_id, \
            s.environment, s.deployment_mode, s.auth_level, \
            s.data_scope_json, s.permission_scope_json, \
            u.username, u.display_name, u.email, u.phone, \
            u.email_verified, u.phone_verified, u.last_login_at, u.password_changed_at, \
            (SELECT EXISTS(SELECT 1 FROM iam_tenant_member tm \
                WHERE tm.tenant_id = s.tenant_id AND tm.user_id = s.user_id AND tm.status = 'active')) AS app_member, \
            (SELECT EXISTS(SELECT 1 FROM iam_organization_membership om \
                WHERE om.tenant_id = s.tenant_id AND om.user_id = s.user_id AND om.status = 'active')) AS organization_member \
     FROM iam_session s \
     JOIN iam_user u ON u.id = s.user_id AND u.tenant_id = s.tenant_id";

#[allow(dead_code)]
pub(crate) async fn find_session_by_refresh_token(
    pg: &PgPool,
    refresh_token: &str,
) -> Option<LocalSession> {
    let refresh_hash = hash_token(refresh_token);
    let row = sqlx::query(&format!(
        "{SESSION_REFRESH_SELECT} \
         WHERE s.refresh_token_hash = $1 AND s.revoked_at IS NULL AND s.expires_at::timestamptz > $2::timestamptz \
           AND u.status = 'active' AND u.is_deleted = 0 \
         LIMIT 1"
    ))
    .bind(&refresh_hash)
    .bind(current_timestamp_utc())
    .fetch_optional(pg)
    .await
    .ok()??;

    build_session_from_row(row, String::new(), String::new(), refresh_token.to_string())
}

pub(crate) async fn find_session_by_id(
    pg: &PgPool,
    session_id: &str,
    user_id: &str,
    tenant_id: &str,
) -> Option<LocalSession> {
    let row = sqlx::query(&format!(
        "{SESSION_REFRESH_SELECT} \
         WHERE s.id = $1 AND s.user_id = $2 AND s.tenant_id = $3 \
           AND s.revoked_at IS NULL AND s.expires_at::timestamptz > $4::timestamptz \
           AND u.status = 'active' AND u.is_deleted = 0 \
         LIMIT 1"
    ))
    .bind(session_id)
    .bind(user_id)
    .bind(tenant_id)
    .bind(current_timestamp_utc())
    .fetch_optional(pg)
    .await
    .ok()??;

    let mut session = build_session_from_row(row, String::new(), String::new(), String::new())?;
    hydrate_session_authorization_context(pg, &mut session).await;
    Some(session)
}

pub(crate) async fn claim_session_for_refresh(
    pg: &PgPool,
    refresh_token: &str,
) -> Result<Option<LocalSession>, String> {
    let refresh_hash = hash_token(refresh_token);
    let now = current_timestamp_utc();
    let mut tx = pg
        .begin()
        .await
        .map_err(|error| format!("begin refresh claim transaction failed: {error}"))?;

    let row = sqlx::query(&format!(
        "{SESSION_REFRESH_SELECT} \
         WHERE s.refresh_token_hash = $1 AND s.revoked_at IS NULL AND s.expires_at::timestamptz > $2::timestamptz \
           AND u.status = 'active' AND u.is_deleted = 0 \
         FOR UPDATE OF s \
         LIMIT 1"
    ))
    .bind(&refresh_hash)
    .bind(&now)
    .fetch_optional(&mut *tx)
    .await
    .map_err(|error| format!("load refresh session failed: {error}"))?;

    let Some(row) = row else {
        tx.rollback()
            .await
            .map_err(|error| format!("rollback empty refresh claim failed: {error}"))?;
        return Ok(None);
    };

    let mut session =
        build_session_from_row(row, String::new(), String::new(), refresh_token.to_string())
            .ok_or_else(|| "refresh session row could not be parsed".to_string())?;
    hydrate_session_authorization_context(pg, &mut session).await;

    let revoked = sqlx::query(
        "UPDATE iam_session SET revoked_at = $2, updated_at = $3 \
         WHERE id = $1 AND revoked_at IS NULL",
    )
    .bind(&session.session_id)
    .bind(&now)
    .bind(&now)
    .execute(&mut *tx)
    .await
    .map_err(|error| format!("revoke refresh session failed: {error}"))?;
    if revoked.rows_affected() == 0 {
        tx.rollback()
            .await
            .map_err(|error| format!("rollback refresh claim race failed: {error}"))?;
        return Ok(None);
    }

    tx.commit()
        .await
        .map_err(|error| format!("commit refresh claim failed: {error}"))?;

    crate::security_events::record_session_revoked(
        pg,
        &session.context.tenant_id,
        session.context.organization_id.as_deref(),
        &session.user.id,
        &session.session_id,
    )
    .await;

    Ok(Some(session))
}

pub(crate) async fn handle_refresh_token_reuse(pg: &PgPool, refresh_token: &str) -> bool {
    let refresh_hash = hash_token(refresh_token);
    let row = match sqlx::query(
        "SELECT s.tenant_id, s.organization_id, s.user_id, s.id \
         FROM iam_session s \
         JOIN iam_user u ON u.id = s.user_id AND u.tenant_id = s.tenant_id \
         WHERE s.refresh_token_hash = $1 \
           AND u.status = 'active' AND u.is_deleted = 0 \
         ORDER BY s.revoked_at DESC NULLS LAST, s.created_at DESC \
         LIMIT 1",
    )
    .bind(&refresh_hash)
    .fetch_optional(pg)
    .await
    {
        Ok(row) => row,
        Err(_) => return false,
    };

    let Some(row) = row else {
        return false;
    };

    let tenant_id: String = row.get(0);
    let organization_id: Option<String> = row.get(1);
    let user_id: String = row.get(2);
    let session_id: String = row.get(3);
    let now = current_timestamp_utc();
    let _ = sqlx::query(
        "UPDATE iam_session SET revoked_at = $2, updated_at = $3 \
         WHERE tenant_id = $1 AND user_id = $4 AND revoked_at IS NULL",
    )
    .bind(&tenant_id)
    .bind(&now)
    .bind(&now)
    .bind(&user_id)
    .execute(pg)
    .await;

    crate::security_events::record_refresh_token_reuse(
        pg,
        &tenant_id,
        organization_id.as_deref(),
        &user_id,
        &session_id,
    )
    .await;
    true
}

pub(crate) async fn rotate_current_session_context(
    pg: &PgPool,
    config: &LocalIamConfig,
    session: &LocalSession,
    target: crate::state::SessionContextSwitch,
) -> Result<LocalSession, String> {
    let target_organization_id = match target {
        crate::state::SessionContextSwitch::Personal => None,
        crate::state::SessionContextSwitch::Organization(organization_id) => Some(organization_id),
    };
    let (data_scope, permission_scope, user_surface, standard_role_codes) =
        crate::authorization::resolve_session_authorization(
            pg,
            &session.user.tenant_id,
            &session.user.id,
            target_organization_id.as_deref(),
        )
        .await?;

    let context = crate::authorization::enrich_app_context(
        IamAppContext::new(
            session.user.tenant_id.clone(),
            target_organization_id.as_deref(),
            session.user.id.clone(),
            session.session_id.clone(),
            session.context.app_id.clone(),
            session.context.environment.clone(),
            session.context.deployment_mode.clone(),
            session.context.auth_level.clone(),
            data_scope.clone(),
            permission_scope.clone(),
        ),
        user_surface,
        standard_role_codes,
    );

    let signing_key = ensure_tenant_signing_key(pg, &session.user.tenant_id).await?;
    let access_token = sign_local_session_token(&signing_key, "access", &context);
    let auth_token = sign_local_session_token(&signing_key, "auth", &context);
    let refresh_token = generate_opaque_token("refresh");
    let auth_token_hash = hash_token(&auth_token);
    let access_token_hash = hash_token(&access_token);
    let refresh_token_hash = hash_token(&refresh_token);
    let expected_auth_hash = hash_token(&session.auth_token);
    let expected_access_hash = hash_token(&session.access_token);
    let now = current_timestamp_utc();

    let updated = sqlx::query(
        "UPDATE iam_session SET organization_id = $2, login_scope = $3, \
         auth_token_hash = $4, access_token_hash = $5, refresh_token_hash = $6, \
         auth_token_kid = $7, access_token_kid = $7, refresh_token_kid = $7, \
         data_scope_json = $8, permission_scope_json = $9, updated_at = $10 \
         WHERE id = $1 AND revoked_at IS NULL AND expires_at::timestamptz > $10::timestamptz \
           AND auth_token_hash = $11 AND access_token_hash = $12",
    )
    .bind(&session.session_id)
    .bind(&target_organization_id)
    .bind(login_scope_to_string(&context.login_scope))
    .bind(&auth_token_hash)
    .bind(&access_token_hash)
    .bind(&refresh_token_hash)
    .bind(&signing_key.kid)
    .bind(Json(&context.data_scope))
    .bind(Json(&context.permission_scope))
    .bind(&now)
    .bind(&expected_auth_hash)
    .bind(&expected_access_hash)
    .execute(pg)
    .await
    .map_err(|error| format!("rotate session failed: {error}"))?;

    if updated.rows_affected() == 0 {
        return Err("session rotation rejected stale or revoked tokens".to_string());
    }

    crate::security_events::record_session_updated(
        pg,
        &session.user.tenant_id,
        target_organization_id.as_deref(),
        &session.user.id,
        &session.session_id,
        json!({
            "organizationId": target_organization_id,
            "result": "success",
        }),
    )
    .await;
    crate::audit_events::record_session_updated(
        pg,
        config,
        &session.context.tenant_id,
        target_organization_id.as_deref(),
        &session.user.id,
        &session.session_id,
        &data_scope,
        &permission_scope,
        json!({
            "organizationId": target_organization_id,
            "result": "success",
        }),
    )
    .await;

    Ok(LocalSession {
        access_token,
        auth_token,
        context,
        refresh_token,
        session_id: session.session_id.clone(),
        user: session.user.clone(),
    })
}

pub(crate) async fn refresh_session_scopes_from_rbac(
    pg: &PgPool,
    _config: &LocalIamConfig,
    session: &mut LocalSession,
) -> Result<(), String> {
    let (data_scope, permission_scope, user_surface, standard_role_codes) =
        crate::authorization::resolve_session_authorization(
            pg,
            &session.user.tenant_id,
            &session.user.id,
            session.context.organization_id.as_deref(),
        )
        .await?;
    let jwt_data_scope = jwt_claim_string_vectors(&session.access_token, "data_scope");
    let jwt_permission_scope = jwt_claim_string_vectors(&session.access_token, "permission_scope");
    if sorted_string_vectors_equal(&data_scope, &jwt_data_scope)
        && sorted_string_vectors_equal(&permission_scope, &jwt_permission_scope)
        && sorted_string_vectors_equal(&data_scope, &session.context.data_scope)
        && sorted_string_vectors_equal(&permission_scope, &session.context.permission_scope)
    {
        return Ok(());
    }

    let context = crate::authorization::enrich_app_context(
        IamAppContext::new(
            session.user.tenant_id.clone(),
            session.context.organization_id.as_deref(),
            session.user.id.clone(),
            session.session_id.clone(),
            session.context.app_id.clone(),
            session.context.environment.clone(),
            session.context.deployment_mode.clone(),
            session.context.auth_level.clone(),
            data_scope.clone(),
            permission_scope.clone(),
        ),
        user_surface,
        standard_role_codes,
    );

    let signing_key = ensure_tenant_signing_key(pg, &session.user.tenant_id).await?;
    let access_token = sign_local_session_token(&signing_key, "access", &context);
    let auth_token = sign_local_session_token(&signing_key, "auth", &context);
    let auth_token_hash = hash_token(&auth_token);
    let access_token_hash = hash_token(&access_token);
    let expected_auth_hash = hash_token(&session.auth_token);
    let expected_access_hash = hash_token(&session.access_token);
    let now = current_timestamp_utc();

    let updated = sqlx::query(
        "UPDATE iam_session SET data_scope_json = $2, permission_scope_json = $3, \
         auth_token_hash = $4, access_token_hash = $5, auth_token_kid = $6, access_token_kid = $6, \
         updated_at = $7 \
         WHERE id = $1 AND revoked_at IS NULL AND expires_at::timestamptz > $7::timestamptz \
           AND auth_token_hash = $8 AND access_token_hash = $9",
    )
    .bind(&session.session_id)
    .bind(Json(&context.data_scope))
    .bind(Json(&context.permission_scope))
    .bind(&auth_token_hash)
    .bind(&access_token_hash)
    .bind(&signing_key.kid)
    .bind(&now)
    .bind(&expected_auth_hash)
    .bind(&expected_access_hash)
    .execute(pg)
    .await
    .map_err(|error| format!("refresh session scopes failed: {error}"))?;

    if updated.rows_affected() == 0 {
        return Err("session scope refresh rejected stale or revoked tokens".to_string());
    }

    session.context = context;
    session.auth_token = auth_token;
    session.access_token = access_token;
    Ok(())
}

// ── Signing key ────────────────────────────────────────────────────

pub(crate) async fn maintain_tenant_signing_keys(
    pg: &PgPool,
    tenant_id: &str,
) -> Result<(), String> {
    if tenant_id.is_empty() {
        return Ok(());
    }
    prune_expired_rotating_signing_keys(pg, tenant_id).await?;
    if signing_key_rotation_requested() {
        rotate_tenant_signing_key(pg, tenant_id).await?;
    }
    Ok(())
}

fn signing_key_rotation_requested() -> bool {
    crate::utils::env_parse("SDKWORK_IAM_TENANT_SIGNING_KEY_ROTATE", false)
}

async fn prune_expired_rotating_signing_keys(pg: &PgPool, tenant_id: &str) -> Result<(), String> {
    let now = current_timestamp_utc();
    let now_text = now.to_rfc3339();
    sqlx::query(
        "UPDATE iam_tenant_signing_key SET status = 'revoked', updated_at = $3 \
         WHERE tenant_id = $1 AND status = 'rotating' \
           AND active_until IS NOT NULL AND active_until <= $2",
    )
    .bind(tenant_id)
    .bind(&now_text)
    .bind(&now)
    .execute(pg)
    .await
    .map_err(|error| format!("prune rotating signing keys failed: {error}"))?;
    Ok(())
}

async fn rotate_tenant_signing_key(pg: &PgPool, tenant_id: &str) -> Result<(), String> {
    let now = current_timestamp_utc();
    let now_text = now.to_rfc3339();
    let current = sqlx::query(
        "SELECT id, kid FROM iam_tenant_signing_key \
         WHERE tenant_id = $1 AND status = 'active' \
         ORDER BY active_from DESC LIMIT 1",
    )
    .bind(tenant_id)
    .fetch_optional(pg)
    .await
    .map_err(|error| format!("load active signing key for rotation failed: {error}"))?;

    let Some(current) = current else {
        return Ok(());
    };

    let current_id: String = current.get(0);
    let overlap_until =
        (now + chrono::Duration::seconds(SIGNING_KEY_ROTATION_OVERLAP_SECONDS)).to_rfc3339();

    let mut secret = vec![0u8; 64];
    OsRng.fill_bytes(&mut secret);
    let kid = format!("{tenant_id}:local-hs256:{}", uuid::Uuid::now_v7());
    let secret_ref = sdkwork_iam_web_adapter::encode_signing_secret_ref(&secret);
    let secret_hash = hash_token(&secret_ref);

    let mut tx = pg
        .begin()
        .await
        .map_err(|error| format!("begin signing key rotation failed: {error}"))?;

    sqlx::query(
        "UPDATE iam_tenant_signing_key \
         SET status = 'rotating', active_until = $3, rotated_at = $4, updated_at = $4 \
         WHERE id = $1 AND tenant_id = $2 AND status = 'active'",
    )
    .bind(&current_id)
    .bind(tenant_id)
    .bind(&overlap_until)
    .bind(&now)
    .execute(&mut *tx)
    .await
    .map_err(|error| format!("mark signing key rotating failed: {error}"))?;

    sqlx::query(
        "INSERT INTO iam_tenant_signing_key (id, tenant_id, kid, alg, secret_ref, secret_hash, status, active_from, created_at, updated_at) \
         VALUES ($1, $2, $3, 'HS256', $4, $5, 'active', $6, $7, $8)",
    )
    .bind(&uuid::Uuid::now_v7().to_string())
    .bind(tenant_id)
    .bind(&kid)
    .bind(&secret_ref)
    .bind(&secret_hash)
    .bind(&now_text)
    .bind(&now_text)
    .bind(&now_text)
    .execute(&mut *tx)
    .await
    .map_err(|error| format!("insert rotated signing key failed: {error}"))?;

    tx.commit()
        .await
        .map_err(|error| format!("commit signing key rotation failed: {error}"))?;
    Ok(())
}

async fn ensure_tenant_signing_key(
    pg: &PgPool,
    tenant_id: &str,
) -> Result<LocalTenantSigningKey, String> {
    sdkwork_iam_bootstrap::ensure_postgres_tenant_signing_key(pg, tenant_id)
        .await
        .map_err(|error| format!("provision tenant signing key failed: {error}"))?;

    let material = sdkwork_iam_bootstrap::load_postgres_active_tenant_signing_key(pg, tenant_id)
        .await
        .map_err(|error| format!("load signing key failed: {error}"))?
        .ok_or_else(|| format!("tenant signing key not provisioned for tenant {tenant_id}"))?;

    Ok(LocalTenantSigningKey {
        tenant_id: material.tenant_id,
        kid: material.kid,
        secret: material.secret,
    })
}

#[derive(Clone)]
pub(crate) struct LocalTenantSigningKey {
    pub(crate) tenant_id: String,
    pub(crate) kid: String,
    pub(crate) secret: Vec<u8>,
}

// ── JWT signing ────────────────────────────────────────────────────

pub(crate) fn sign_local_session_token(
    signing_key: &LocalTenantSigningKey,
    token_type: &str,
    context: &IamAppContext,
) -> String {
    let issued_at = current_millis() / 1000;
    let expires_at = issued_at + LOCAL_TOKEN_TTL_SECONDS;
    let organization_id = context
        .organization_id
        .as_deref()
        .filter(|value| !crate::is_blank(Some(value)))
        .unwrap_or("0");
    let header = json!({
        "alg": "HS256",
        "kid": signing_key.kid,
        "typ": "JWT"
    });
    let payload = json!({
        "app_id": context.app_id,
        "aud": context.app_id,
        "auth_level": auth_level_to_string(&context.auth_level),
        "data_scope": context.data_scope,
        "deployment_mode": deployment_mode_to_string(&context.deployment_mode),
        "environment": environment_to_string(&context.environment),
        "exp": expires_at,
        "iat": issued_at,
        "iss": "sdkwork-iam-local",
        "login_scope": login_scope_to_string(&context.login_scope),
        "organization_id": organization_id,
        "permission_scope": context.permission_scope,
        "session_id": context.session_id,
        "sid": context.session_id,
        "sub": context.user_id,
        "tenant_id": context.tenant_id,
        "token_type": token_type,
        "token_version": stamp_token_version(),
        "user_id": context.user_id
    });
    let signing_input = format!("{}.{}", encode_jwt_json(&header), encode_jwt_json(&payload));
    let mut mac = HmacSha256::new_from_slice(signing_key.secret.as_slice())
        .expect("HS256 signing key length should be valid");
    mac.update(signing_input.as_bytes());
    let signature = URL_SAFE_NO_PAD.encode(mac.finalize().into_bytes());
    format!("{signing_input}.{signature}")
}

pub(crate) fn encode_jwt_json(value: &Value) -> String {
    URL_SAFE_NO_PAD.encode(serde_json::to_vec(value).expect("JWT JSON should serialize"))
}

fn decode_jwt_json(part: &str) -> Option<Value> {
    let bytes = URL_SAFE_NO_PAD.decode(part).ok()?;
    serde_json::from_slice(&bytes).ok()
}

fn jwt_claim_string_vectors(token: &str, claim_key: &str) -> Vec<String> {
    let payload_part = token.split('.').nth(1).unwrap_or_default();
    let payload = decode_jwt_json(payload_part).unwrap_or(Value::Null);
    payload
        .get(claim_key)
        .and_then(|value| serde_json::from_value(value.clone()).ok())
        .unwrap_or_default()
}

fn sorted_string_vectors_equal(left: &[String], right: &[String]) -> bool {
    let mut normalized_left = left.to_vec();
    let mut normalized_right = right.to_vec();
    normalized_left.sort();
    normalized_right.sort();
    normalized_left == normalized_right
}

pub(crate) fn jwt_header_kid(token: &str) -> Option<String> {
    let header_part = token.split('.').next()?;
    let header = decode_jwt_json(header_part)?;
    header
        .get("kid")
        .and_then(Value::as_str)
        .map(str::to_string)
}

async fn load_signing_key_by_kid(pg: &PgPool, kid: &str) -> Option<LocalTenantSigningKey> {
    sdkwork_iam_bootstrap::resolve_postgres_tenant_signing_key_by_kid(pg, kid)
        .await
        .ok()
        .flatten()
        .map(|material| LocalTenantSigningKey {
            tenant_id: material.tenant_id,
            kid: material.kid,
            secret: material.secret,
        })
}

fn signing_key_matches_claims(signing_key: &LocalTenantSigningKey, claims: &Value) -> bool {
    claims
        .get("tenant_id")
        .and_then(Value::as_str)
        .is_some_and(|tenant_id| tenant_id == signing_key.tenant_id)
}

pub(crate) fn verify_local_session_token(
    signing_key: &LocalTenantSigningKey,
    token: &str,
    expected_token_type: &str,
    now_unix: i64,
) -> Option<Value> {
    let parts: Vec<&str> = token.split('.').collect();
    if parts.len() != 3 {
        return None;
    }
    let header = decode_jwt_json(parts[0])?;
    let payload = decode_jwt_json(parts[1])?;
    let kid = header.get("kid").and_then(Value::as_str)?;
    if kid != signing_key.kid {
        return None;
    }
    let signing_input = format!("{}.{}", parts[0], parts[1]);
    let mut mac = HmacSha256::new_from_slice(signing_key.secret.as_slice()).ok()?;
    mac.update(signing_input.as_bytes());
    let expected_signature = URL_SAFE_NO_PAD.encode(mac.finalize().into_bytes());
    if expected_signature != parts[2] {
        return None;
    }
    let token_type = payload.get("token_type").and_then(Value::as_str)?;
    if !token_type.eq_ignore_ascii_case(expected_token_type) {
        return None;
    }
    let exp = payload.get("exp").and_then(Value::as_i64)?;
    if exp < now_unix {
        return None;
    }
    let iss = payload.get("iss").and_then(Value::as_str)?;
    if iss != "sdkwork-iam-local" {
        return None;
    }
    let aud = payload.get("aud").and_then(Value::as_str)?;
    let app_id = payload.get("app_id").and_then(Value::as_str)?;
    if aud != app_id {
        return None;
    }
    if !claims_login_scope_organization_consistent(&payload) {
        return None;
    }
    if validate_token_version_json(&payload, &TokenVersionPolicy::standard()).is_err() {
        return None;
    }
    Some(payload)
}

fn claims_login_scope_organization_consistent(claims: &Value) -> bool {
    let login_scope = claims
        .get("login_scope")
        .and_then(Value::as_str)
        .map(|value| value.trim().to_ascii_uppercase())
        .unwrap_or_else(|| "TENANT".to_string());
    let organization_id = claims
        .get("organization_id")
        .and_then(Value::as_str)
        .unwrap_or("0");
    let has_organization = !crate::is_blank(Some(organization_id)) && organization_id != "0";
    match login_scope.as_str() {
        "ORGANIZATION" => has_organization,
        _ => !has_organization,
    }
}

fn claim_string_value(claims: &Value, keys: &[&str]) -> Option<String> {
    keys.iter()
        .find_map(|key| claims.get(*key).and_then(Value::as_str).map(str::to_string))
}

fn session_token_claims_match(auth_claims: &Value, access_claims: &Value) -> bool {
    for keys in [
        &["tenant_id"][..],
        &["user_id", "sub"][..],
        &["session_id", "sid"][..],
        &["organization_id"][..],
        &["login_scope"][..],
        &["app_id"][..],
    ] {
        if claim_string_value(auth_claims, keys) != claim_string_value(access_claims, keys) {
            return false;
        }
    }
    true
}

fn session_claims_match_context(claims: &Value, context: &IamAppContext) -> bool {
    let organization_id = context
        .organization_id
        .as_deref()
        .filter(|value| !crate::is_blank(Some(value)))
        .unwrap_or("0");
    claim_string_value(claims, &["tenant_id"]) == Some(context.tenant_id.clone())
        && claim_string_value(claims, &["user_id", "sub"]) == Some(context.user_id.clone())
        && claim_string_value(claims, &["session_id", "sid"]) == Some(context.session_id.clone())
        && claim_string_value(claims, &["app_id"]) == Some(context.app_id.clone())
        && claim_string_value(claims, &["login_scope"])
            == Some(login_scope_to_string(&context.login_scope).to_string())
        && claim_string_value(claims, &["organization_id"]) == Some(organization_id.to_string())
}

pub(crate) fn generate_opaque_token(kind: &str) -> String {
    let mut bytes = [0u8; 32];
    OsRng.fill_bytes(&mut bytes);
    format!("sdkwork-{kind}-{}", URL_SAFE_NO_PAD.encode(bytes))
}

// ── Header helpers ─────────────────────────────────────────────────

pub(crate) fn read_access_token(headers: &HeaderMap) -> Option<String> {
    read_header(headers, "access-token").or_else(|| read_header(headers, "x-sdkwork-access-token"))
}

pub(crate) fn read_bearer_header(headers: &HeaderMap) -> Option<String> {
    let value = read_header(headers, "authorization")?;
    strip_optional_bearer_prefix(&value)
}

fn strip_optional_bearer_prefix(value: &str) -> Option<String> {
    let trimmed = value.trim();
    if trimmed.is_empty() {
        return None;
    }
    let token = trimmed
        .strip_prefix("Bearer ")
        .or_else(|| trimmed.strip_prefix("bearer "))
        .unwrap_or(trimmed)
        .trim();
    if token.is_empty() {
        None
    } else {
        Some(token.to_string())
    }
}

pub(crate) fn read_header(headers: &HeaderMap, name: &str) -> Option<String> {
    headers
        .get(name)
        .and_then(|value| value.to_str().ok())
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .map(str::to_string)
}

pub(crate) fn reject_login_credential_headers(headers: &HeaderMap) -> Option<Response> {
    LOGIN_CREATION_FORBIDDEN_HEADERS
        .iter()
        .find(|name| headers.contains_key(**name))
        .map(|_name| {
            appbase_error(
                StatusCode::BAD_REQUEST,
                "iam_login_credential_headers_forbidden",
                "login session creation requests must not include credential or context headers",
            )
        })
}

pub(crate) fn resolve_login_username(body: &Value) -> String {
    optional_string(body.get("username"))
        .or_else(|| optional_string(body.get("email")))
        .or_else(|| optional_string(body.get("phone")))
        .unwrap_or_default()
}
