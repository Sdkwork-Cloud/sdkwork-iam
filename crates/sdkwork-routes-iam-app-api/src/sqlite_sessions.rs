use std::collections::BTreeSet;

use sdkwork_iam_bootstrap::rbac_scope::{
    resolve_effective_permission_codes, BindingPermissionRow, RoleExclusionRule,
};
use sdkwork_iam_context_service::{
    AuthLevel, DeploymentMode, IamAppContext, IamUserSurface, IAM_STANDARD_ROLE_CODES,
};
use sqlx::{Row, SqlitePool};

use crate::{
    authorization::enrich_app_context,
    passwords::verify_password_async,
    state::{LocalIamConfig, LocalIamUser, LocalSession},
    tokens::{
        generate_opaque_token, hash_token, read_access_token, read_bearer_header,
        sign_local_session_token, LocalTenantSigningKey, LOCAL_TOKEN_TTL_SECONDS,
    },
    utils::{canonical_identity, current_timestamp_utc, environment_from_config},
};

pub(crate) enum SqlitePasswordSessionOutcome {
    Authenticated(LocalSession),
    AccountLocked,
    InvalidCredentials,
    Failed(String),
}

pub(crate) async fn authenticate_password_and_create_session(
    sqlite: &SqlitePool,
    config: &LocalIamConfig,
    tenant_id: &str,
    runtime_app_id: &str,
    account: &str,
    password: &str,
) -> SqlitePasswordSessionOutcome {
    let account_key = canonical_identity(account);
    let row = match sqlx::query(
        "SELECT u.id, u.tenant_id, u.username, u.display_name, u.email, u.phone, \
                COALESCE(u.email_verified, 0), COALESCE(u.phone_verified, 0), \
                u.last_login_at, u.password_changed_at, c.credential_hash, \
                COALESCE(c.failed_attempts, 0), c.locked_until \
         FROM iam_user u \
         JOIN iam_credential c ON c.tenant_id = u.tenant_id AND c.user_id = u.id \
           AND c.credential_type = 'password' AND c.status = 'active' \
         JOIN iam_tenant_member m ON m.tenant_id = u.tenant_id AND m.user_id = u.id \
           AND m.status = 'active' \
         WHERE u.tenant_id = ? AND \
           (LOWER(u.username) = ? OR LOWER(u.email) = ? OR u.phone = ?) \
           AND u.status = 'active' AND u.is_deleted = 0 LIMIT 2",
    )
    .bind(tenant_id)
    .bind(&account_key)
    .bind(&account_key)
    .bind(&account_key)
    .fetch_all(sqlite)
    .await
    {
        Ok(rows) if rows.len() == 1 => rows.into_iter().next().expect("one row"),
        Ok(_) => return SqlitePasswordSessionOutcome::InvalidCredentials,
        Err(error) => {
            return SqlitePasswordSessionOutcome::Failed(format!(
                "load SQLite IAM password credential failed: {error}"
            ))
        }
    };

    let user = local_user_from_row(&row);
    let password_hash: String = row.get(10);
    let failed_attempts: i32 = row.get(11);
    let locked_until = row
        .try_get::<Option<String>, _>(12)
        .ok()
        .flatten()
        .and_then(|value| chrono::DateTime::parse_from_rfc3339(&value).ok())
        .map(|value| value.with_timezone(&chrono::Utc));
    let password_valid = verify_password_async(password_hash, password.to_owned()).await;
    if locked_until.is_some_and(|value| value > current_timestamp_utc()) {
        return if password_valid {
            SqlitePasswordSessionOutcome::AccountLocked
        } else {
            SqlitePasswordSessionOutcome::InvalidCredentials
        };
    }
    if !password_valid {
        record_failed_password_attempt(sqlite, config, &user, failed_attempts).await;
        return SqlitePasswordSessionOutcome::InvalidCredentials;
    }

    finalize_successful_password_login(sqlite, &user).await;
    let organization_id = match resolve_login_organization(sqlite, tenant_id, &user.id).await {
        Ok(value) => value,
        Err(error) => return SqlitePasswordSessionOutcome::Failed(error),
    };
    match create_session(sqlite, config, &user, organization_id, runtime_app_id).await {
        Ok(session) => SqlitePasswordSessionOutcome::Authenticated(session),
        Err(error) => SqlitePasswordSessionOutcome::Failed(error),
    }
}

pub(crate) async fn resolve_session_from_headers(
    pool: &sdkwork_database_sqlx::DatabasePool,
    sqlite: &SqlitePool,
    headers: &axum::http::HeaderMap,
) -> Option<LocalSession> {
    let auth_token = read_bearer_header(headers)?;
    let access_token = read_access_token(headers)?;
    let context = sdkwork_iam_web_adapter::resolve_iam_app_context_from_dual_tokens_pool(
        pool,
        &auth_token,
        &access_token,
    )
    .await?;
    let user = load_user(sqlite, &context.tenant_id, &context.user_id).await?;
    Some(LocalSession {
        access_token,
        auth_token,
        refresh_token: String::new(),
        session_id: context.session_id.clone(),
        context,
        user,
    })
}

pub(crate) async fn revoke_session(
    sqlite: &SqlitePool,
    session_id: &str,
    tenant_id: &str,
    user_id: &str,
) -> Result<(), String> {
    let now = current_timestamp_utc().to_rfc3339();
    sqlx::query(
        "UPDATE iam_session SET revoked_at = ?, updated_at = ? \
         WHERE id = ? AND tenant_id = ? AND user_id = ? AND revoked_at IS NULL",
    )
    .bind(&now)
    .bind(&now)
    .bind(session_id)
    .bind(tenant_id)
    .bind(user_id)
    .execute(sqlite)
    .await
    .map_err(|error| format!("revoke SQLite IAM session failed: {error}"))?;
    Ok(())
}

async fn create_session(
    sqlite: &SqlitePool,
    config: &LocalIamConfig,
    user: &LocalIamUser,
    organization_id: Option<String>,
    runtime_app_id: &str,
) -> Result<LocalSession, String> {
    let runtime_app_id = runtime_app_id.trim();
    if runtime_app_id.is_empty() {
        return Err("runtime appId is required for session creation".to_owned());
    }
    let now = current_timestamp_utc();
    let now_text = now.to_rfc3339();
    sqlx::query(
        "UPDATE iam_session SET revoked_at = ?, updated_at = ? \
         WHERE tenant_id = ? AND user_id = ? AND revoked_at IS NULL",
    )
    .bind(&now_text)
    .bind(&now_text)
    .bind(&user.tenant_id)
    .bind(&user.id)
    .execute(sqlite)
    .await
    .map_err(|error| format!("revoke active SQLite IAM sessions failed: {error}"))?;

    let (data_scope, permission_scope, user_surface, standard_role_codes) =
        resolve_session_authorization(
            sqlite,
            &user.tenant_id,
            &user.id,
            organization_id.as_deref(),
        )
        .await?;
    let session_id = generate_opaque_token("session");
    let context = enrich_app_context(
        IamAppContext::new(
            user.tenant_id.clone(),
            organization_id.as_deref(),
            user.id.clone(),
            session_id.clone(),
            runtime_app_id.to_owned(),
            environment_from_config(&config.environment),
            DeploymentMode::Local,
            AuthLevel::Password,
            data_scope,
            permission_scope,
        ),
        user_surface,
        standard_role_codes,
    );
    let signing_key = ensure_signing_key(sqlite, &user.tenant_id).await?;
    let access_token = sign_local_session_token(&signing_key, "access", &context);
    let auth_token = sign_local_session_token(&signing_key, "auth", &context);
    let refresh_token = generate_opaque_token("refresh");
    let expires_at = (now + chrono::Duration::seconds(LOCAL_TOKEN_TTL_SECONDS as i64)).to_rfc3339();
    sqlx::query(
        "INSERT INTO iam_session \
         (id, tenant_id, organization_id, login_scope, user_id, app_id, environment, \
          deployment_mode, auth_level, auth_token_hash, auth_token_kid, access_token_hash, \
          access_token_kid, refresh_token_hash, refresh_token_kid, sharding_key, \
          sharding_strategy, data_scope_json, permission_scope_json, expires_at, created_at, updated_at) \
         VALUES (?, ?, ?, ?, ?, ?, ?, 'local', 'password', ?, ?, ?, ?, ?, ?, ?, 'tenant', ?, ?, ?, ?, ?)",
    )
    .bind(&session_id)
    .bind(&user.tenant_id)
    .bind(&organization_id)
    .bind(if organization_id.is_some() { "ORGANIZATION" } else { "TENANT" })
    .bind(&user.id)
    .bind(runtime_app_id)
    .bind(&config.environment)
    .bind(hash_token(&auth_token))
    .bind(&signing_key.kid)
    .bind(hash_token(&access_token))
    .bind(&signing_key.kid)
    .bind(hash_token(&refresh_token))
    .bind(&signing_key.kid)
    .bind(&user.tenant_id)
    .bind(serde_json::to_string(&context.data_scope).unwrap_or_else(|_| "[]".to_owned()))
    .bind(serde_json::to_string(&context.permission_scope).unwrap_or_else(|_| "[]".to_owned()))
    .bind(&expires_at)
    .bind(&now_text)
    .bind(&now_text)
    .execute(sqlite)
    .await
    .map_err(|error| format!("insert SQLite IAM session failed: {error}"))?;

    Ok(LocalSession {
        access_token,
        auth_token,
        context,
        refresh_token,
        session_id,
        user: user.clone(),
    })
}

async fn resolve_session_authorization(
    sqlite: &SqlitePool,
    tenant_id: &str,
    user_id: &str,
    organization_id: Option<&str>,
) -> Result<(Vec<String>, Vec<String>, IamUserSurface, Vec<String>), String> {
    let organization_id = organization_id.unwrap_or("");
    let rows = sqlx::query(
        "SELECT r.code, b.effect, p.code FROM iam_role_binding b \
         JOIN iam_role r ON r.id = b.role_id AND r.tenant_id = b.tenant_id AND r.status = 'active' \
         JOIN iam_role_permission rp ON rp.role_id = r.id AND rp.tenant_id = b.tenant_id \
         JOIN iam_permission p ON p.id = rp.permission_id \
         WHERE b.tenant_id = ? AND b.status = 'active' AND b.effect IN ('allow', 'deny') \
           AND ((b.principal_kind = 'user' AND b.principal_id = ?) \
             OR (b.principal_kind = 'organization_membership' AND b.principal_id IN ( \
               SELECT id FROM iam_organization_membership \
               WHERE tenant_id = ? AND user_id = ? AND status = 'active'))) \
           AND (b.scope_kind = 'tenant' OR (? <> '' AND b.scope_kind = 'organization' AND b.scope_id = ?)) \
         ORDER BY r.code, b.effect, p.code LIMIT 10001",
    )
    .bind(tenant_id)
    .bind(user_id)
    .bind(tenant_id)
    .bind(user_id)
    .bind(organization_id)
    .bind(organization_id)
    .fetch_all(sqlite)
    .await
    .map_err(|error| format!("load SQLite IAM permission scope failed: {error}"))?;
    let permission_rows = rows
        .iter()
        .map(|row| BindingPermissionRow {
            role_code: row.get(0),
            effect: row.get(1),
            permission_code: row.get(2),
        })
        .collect::<Vec<_>>();
    let exclusions = load_role_exclusions(sqlite, tenant_id).await?;
    let mut permission_scope = resolve_effective_permission_codes(&permission_rows, &exclusions);
    if permission_scope.is_empty() {
        permission_scope.push("iam:self".to_owned());
    }
    let standard_role_codes = permission_rows
        .iter()
        .filter(|row| row.effect == "allow")
        .map(|row| row.role_code.clone())
        .filter(|code| IAM_STANDARD_ROLE_CODES.contains(&code.as_str()))
        .collect::<BTreeSet<_>>()
        .into_iter()
        .collect();
    let mut data_scope = vec![format!("tenant:{tenant_id}")];
    if organization_id.is_empty() {
        data_scope.push(format!("user:{user_id}"));
    } else {
        data_scope.push(format!("organization:{organization_id}"));
    }
    let app = sqlx::query_scalar::<_, i32>(
        "SELECT EXISTS(SELECT 1 FROM iam_tenant_member WHERE tenant_id = ? AND user_id = ? AND status = 'active')",
    )
    .bind(tenant_id)
    .bind(user_id)
    .fetch_one(sqlite)
    .await
    .map_err(|error| format!("resolve SQLite IAM app surface failed: {error}"))?
        != 0;
    Ok((
        data_scope,
        permission_scope,
        IamUserSurface {
            app,
            organization_member: !organization_id.is_empty(),
        },
        standard_role_codes,
    ))
}

async fn load_role_exclusions(
    sqlite: &SqlitePool,
    tenant_id: &str,
) -> Result<Vec<RoleExclusionRule>, String> {
    let rows = sqlx::query(
        "SELECT r.code, er.code FROM iam_role_exclusion e \
         JOIN iam_role r ON r.id = e.role_id AND r.tenant_id = e.tenant_id \
         JOIN iam_role er ON er.id = e.excludes_role_id AND er.tenant_id = e.tenant_id \
         WHERE e.tenant_id = ? AND e.status = 'active' AND r.status = 'active' AND er.status = 'active' \
         LIMIT 1001",
    )
    .bind(tenant_id)
    .fetch_all(sqlite)
    .await
    .map_err(|error| format!("load SQLite IAM role exclusions failed: {error}"))?;
    Ok(rows
        .into_iter()
        .map(|row| RoleExclusionRule {
            role_code: row.get(0),
            excludes_role_code: row.get(1),
        })
        .collect())
}

async fn resolve_login_organization(
    sqlite: &SqlitePool,
    tenant_id: &str,
    user_id: &str,
) -> Result<Option<String>, String> {
    let rows = sqlx::query(
        "SELECT organization_id, is_primary FROM iam_organization_membership \
         WHERE tenant_id = ? AND user_id = ? AND status = 'active' AND organization_id <> '0' \
         ORDER BY is_primary DESC, organization_id LIMIT 201",
    )
    .bind(tenant_id)
    .bind(user_id)
    .fetch_all(sqlite)
    .await
    .map_err(|error| format!("load SQLite IAM login organizations failed: {error}"))?;
    if rows.is_empty() {
        return Ok(None);
    }
    if rows.len() == 1 || rows[0].get::<i32, _>(1) != 0 {
        return Ok(Some(rows[0].get(0)));
    }
    Err(
        "multiple active organizations require an explicit primary organization for SQLite login"
            .to_owned(),
    )
}

async fn ensure_signing_key(
    sqlite: &SqlitePool,
    tenant_id: &str,
) -> Result<LocalTenantSigningKey, String> {
    sdkwork_iam_bootstrap::ensure_sqlite_tenant_signing_key(sqlite, tenant_id)
        .await
        .map_err(|error| format!("provision SQLite IAM signing key failed: {error}"))?;
    let material = sdkwork_iam_bootstrap::load_sqlite_active_tenant_signing_key(sqlite, tenant_id)
        .await
        .map_err(|error| format!("load SQLite IAM signing key failed: {error}"))?
        .ok_or_else(|| format!("tenant signing key not provisioned for tenant {tenant_id}"))?;
    Ok(LocalTenantSigningKey {
        tenant_id: material.tenant_id,
        kid: material.kid,
        secret: material.secret,
    })
}

async fn load_user(sqlite: &SqlitePool, tenant_id: &str, user_id: &str) -> Option<LocalIamUser> {
    let row = sqlx::query(
        "SELECT id, tenant_id, username, display_name, email, phone, \
                COALESCE(email_verified, 0), COALESCE(phone_verified, 0), \
                last_login_at, password_changed_at \
         FROM iam_user WHERE tenant_id = ? AND id = ? AND status = 'active' AND is_deleted = 0",
    )
    .bind(tenant_id)
    .bind(user_id)
    .fetch_optional(sqlite)
    .await
    .ok()??;
    Some(local_user_from_row(&row))
}

fn local_user_from_row(row: &sqlx::sqlite::SqliteRow) -> LocalIamUser {
    LocalIamUser {
        id: row.get(0),
        tenant_id: row.get(1),
        username: row.get(2),
        display_name: row.get(3),
        email: row.get(4),
        phone: row.get(5),
        email_verified: row.get::<i32, _>(6) != 0,
        phone_verified: row.get::<i32, _>(7) != 0,
        last_login_at: row.get(8),
        password_changed_at: row.get(9),
    }
}

async fn finalize_successful_password_login(sqlite: &SqlitePool, user: &LocalIamUser) {
    let now = current_timestamp_utc().to_rfc3339();
    let _ = sqlx::query(
        "UPDATE iam_credential SET failed_attempts = 0, locked_until = NULL, last_used_at = ?, updated_at = ? \
         WHERE tenant_id = ? AND user_id = ? AND credential_type = 'password'",
    )
    .bind(&now)
    .bind(&now)
    .bind(&user.tenant_id)
    .bind(&user.id)
    .execute(sqlite)
    .await;
    let _ = sqlx::query(
        "UPDATE iam_user SET last_login_at = ?, updated_at = ? WHERE tenant_id = ? AND id = ?",
    )
    .bind(&now)
    .bind(&now)
    .bind(&user.tenant_id)
    .bind(&user.id)
    .execute(sqlite)
    .await;
}

async fn record_failed_password_attempt(
    sqlite: &SqlitePool,
    config: &LocalIamConfig,
    user: &LocalIamUser,
    failed_attempts: i32,
) {
    let now = current_timestamp_utc();
    let attempts = failed_attempts + 1;
    let locked_until = (attempts >= config.login_max_attempts as i32)
        .then(|| now + chrono::Duration::minutes(i64::from(config.login_lockout_minutes)))
        .map(|value| value.to_rfc3339());
    let _ = sqlx::query(
        "UPDATE iam_credential SET failed_attempts = ?, locked_until = ?, updated_at = ? \
         WHERE tenant_id = ? AND user_id = ? AND credential_type = 'password'",
    )
    .bind(attempts)
    .bind(locked_until)
    .bind(now.to_rfc3339())
    .bind(&user.tenant_id)
    .bind(&user.id)
    .execute(sqlite)
    .await;
}
