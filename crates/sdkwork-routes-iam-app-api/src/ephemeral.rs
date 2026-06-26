use chrono::{DateTime, Utc};
use serde_json::{json, Value};
use sqlx::{types::Json, PgPool, Row};

use crate::{
    directory::{session_to_json, user_to_json},
    state::*,
    utils::*,
};

const KIND_LOGIN_CONTINUATION: &str = "login_continuation";
const KIND_PASSWORD_RESET: &str = "password_reset";
const KIND_CONTACT_BIND: &str = "contact_bind";
const KIND_QR_SESSION: &str = "qr_session";
const KIND_OAUTH_STATE: &str = "oauth_state";

pub(crate) const OAUTH_STATE_TTL_MILLIS: u128 = 10 * 60 * 1000;

fn artifact_key(tenant_id: &str, kind: &str, key: &str) -> String {
    format!("{tenant_id}:{kind}:{key}")
}

fn millis_to_timestamp(millis: u128) -> DateTime<Utc> {
    let seconds = (millis / 1000) as i64;
    let nanos = ((millis % 1000) * 1_000_000) as u32;
    DateTime::from_timestamp(seconds, nanos).unwrap_or_else(Utc::now)
}

pub(crate) async fn cleanup_expired_artifacts(pg: &PgPool) -> Result<(), String> {
    sqlx::query("DELETE FROM iam_ephemeral_artifact WHERE expires_at <= $1")
        .bind(current_timestamp_utc())
        .execute(pg)
        .await
        .map_err(|error| format!("cleanup ephemeral artifacts failed: {error}"))?;
    Ok(())
}

pub(crate) async fn check_rate_limit(
    pg: &PgPool,
    tenant_id: &str,
    key: &str,
    max_requests: u32,
    window_seconds: u32,
) -> Result<bool, String> {
    sdkwork_iam_web_adapter::check_rate_limit(pg, tenant_id, key, max_requests, window_seconds)
        .await
}

pub(crate) async fn upsert_password_reset_request(
    pg: &PgPool,
    tenant_id: &str,
    account_key: &str,
    request: &LocalPasswordResetRequest,
) -> Result<(), String> {
    let storage_key = artifact_key(tenant_id, KIND_PASSWORD_RESET, account_key);
    let payload = json!({
        "code": request.code,
        "expireTimeMs": request.expire_time,
        "username": request.username,
    });
    let timestamp = current_timestamp_utc();
    sqlx::query(
        "INSERT INTO iam_ephemeral_artifact \
         (artifact_key, tenant_id, artifact_kind, payload_json, expires_at, created_at, updated_at) \
         VALUES ($1, $2, $3, $4, $5, $6, $7) \
         ON CONFLICT (artifact_key) DO UPDATE SET \
           payload_json = EXCLUDED.payload_json, \
           expires_at = EXCLUDED.expires_at, \
           updated_at = EXCLUDED.updated_at",
    )
    .bind(&storage_key)
    .bind(tenant_id)
    .bind(KIND_PASSWORD_RESET)
    .bind(Json(payload))
    .bind(millis_to_timestamp(request.expire_time))
    .bind(&timestamp)
    .bind(&timestamp)
    .execute(pg)
    .await
    .map_err(|error| format!("upsert password reset artifact failed: {error}"))?;
    Ok(())
}

pub(crate) async fn get_password_reset_request(
    pg: &PgPool,
    tenant_id: &str,
    account_key: &str,
) -> Result<Option<LocalPasswordResetRequest>, String> {
    let storage_key = artifact_key(tenant_id, KIND_PASSWORD_RESET, account_key);
    let row = sqlx::query(
        "SELECT payload_json FROM iam_ephemeral_artifact \
         WHERE artifact_key = $1 AND expires_at > $2",
    )
    .bind(&storage_key)
    .bind(current_timestamp_utc())
    .fetch_optional(pg)
    .await
    .map_err(|error| format!("load password reset artifact failed: {error}"))?;
    Ok(row.and_then(|row| password_reset_request_from_payload(row.get(0))))
}

pub(crate) async fn delete_password_reset_request(
    pg: &PgPool,
    tenant_id: &str,
    account_key: &str,
) -> Result<(), String> {
    let storage_key = artifact_key(tenant_id, KIND_PASSWORD_RESET, account_key);
    sqlx::query("DELETE FROM iam_ephemeral_artifact WHERE artifact_key = $1")
        .bind(&storage_key)
        .execute(pg)
        .await
        .map_err(|error| format!("delete password reset artifact failed: {error}"))?;
    Ok(())
}

#[allow(dead_code)]
pub(crate) async fn upsert_contact_bind_verification(
    pg: &PgPool,
    tenant_id: &str,
    user_id: &str,
    scene: &str,
    verification: &crate::contacts::LocalContactBindVerification,
) -> Result<(), String> {
    let storage_key = artifact_key(tenant_id, KIND_CONTACT_BIND, &format!("{user_id}:{scene}"));
    let payload = json!({
        "code": verification.code,
        "expireTime": verification.expire_time,
        "target": verification.target,
    });
    let timestamp = current_timestamp_utc();
    sqlx::query(
        "INSERT INTO iam_ephemeral_artifact \
         (artifact_key, tenant_id, artifact_kind, payload_json, expires_at, created_at, updated_at) \
         VALUES ($1, $2, $3, $4, $5, $6, $7) \
         ON CONFLICT (artifact_key) DO UPDATE SET \
           payload_json = EXCLUDED.payload_json, \
           expires_at = EXCLUDED.expires_at, \
           updated_at = EXCLUDED.updated_at",
    )
    .bind(&storage_key)
    .bind(tenant_id)
    .bind(KIND_CONTACT_BIND)
    .bind(Json(payload))
    .bind(millis_to_timestamp(verification.expire_time))
    .bind(&timestamp)
    .bind(&timestamp)
    .execute(pg)
    .await
    .map_err(|error| format!("upsert contact bind artifact failed: {error}"))?;
    Ok(())
}

pub(crate) async fn get_contact_bind_verification(
    pg: &PgPool,
    tenant_id: &str,
    user_id: &str,
    scene: &str,
) -> Result<Option<crate::contacts::LocalContactBindVerification>, String> {
    let storage_key = artifact_key(tenant_id, KIND_CONTACT_BIND, &format!("{user_id}:{scene}"));
    let row = sqlx::query(
        "SELECT payload_json FROM iam_ephemeral_artifact \
         WHERE artifact_key = $1 AND expires_at > $2",
    )
    .bind(&storage_key)
    .bind(current_timestamp_utc())
    .fetch_optional(pg)
    .await
    .map_err(|error| format!("load contact bind artifact failed: {error}"))?;
    Ok(row.and_then(|row| {
        let payload: Json<Value> = row.get(0);
        Some(crate::contacts::LocalContactBindVerification {
            code: payload.0["code"].as_str()?.to_string(),
            expire_time: payload.0["expireTime"].as_u64()? as u128,
            target: payload.0["target"].as_str()?.to_string(),
        })
    }))
}

pub(crate) async fn delete_contact_bind_verification(
    pg: &PgPool,
    tenant_id: &str,
    user_id: &str,
    scene: &str,
) -> Result<(), String> {
    let storage_key = artifact_key(tenant_id, KIND_CONTACT_BIND, &format!("{user_id}:{scene}"));
    sqlx::query("DELETE FROM iam_ephemeral_artifact WHERE artifact_key = $1")
        .bind(&storage_key)
        .execute(pg)
        .await
        .map_err(|error| format!("delete contact bind artifact failed: {error}"))?;
    Ok(())
}

pub(crate) async fn insert_login_continuation(
    pg: &PgPool,
    tenant_id: &str,
    token: &str,
    continuation: &LocalLoginContinuation,
) -> Result<(), String> {
    let storage_key = artifact_key(tenant_id, KIND_LOGIN_CONTINUATION, token);
    let payload = login_continuation_to_json(continuation);
    let timestamp = current_timestamp_utc();
    sqlx::query(
        "INSERT INTO iam_ephemeral_artifact \
         (artifact_key, tenant_id, artifact_kind, payload_json, expires_at, created_at, updated_at) \
         VALUES ($1, $2, $3, $4, $5, $6, $7) \
         ON CONFLICT (artifact_key) DO UPDATE SET \
           payload_json = EXCLUDED.payload_json, \
           expires_at = EXCLUDED.expires_at, \
           updated_at = EXCLUDED.updated_at",
    )
    .bind(&storage_key)
    .bind(tenant_id)
    .bind(KIND_LOGIN_CONTINUATION)
    .bind(Json(payload))
    .bind(millis_to_timestamp(continuation.expire_time))
    .bind(&timestamp)
    .bind(&timestamp)
    .execute(pg)
    .await
    .map_err(|error| format!("insert login continuation artifact failed: {error}"))?;
    Ok(())
}

pub(crate) async fn take_login_continuation(
    pg: &PgPool,
    tenant_id: &str,
    token: &str,
) -> Result<Option<LocalLoginContinuation>, String> {
    let storage_key = artifact_key(tenant_id, KIND_LOGIN_CONTINUATION, token);
    let mut tx = pg
        .begin()
        .await
        .map_err(|error| format!("begin login continuation transaction failed: {error}"))?;
    let row = sqlx::query(
        "SELECT payload_json FROM iam_ephemeral_artifact \
         WHERE artifact_key = $1 AND expires_at > $2 \
         FOR UPDATE",
    )
    .bind(&storage_key)
    .bind(current_timestamp_utc())
    .fetch_optional(&mut *tx)
    .await
    .map_err(|error| format!("load login continuation artifact failed: {error}"))?;
    let Some(row) = row else {
        tx.rollback()
            .await
            .map_err(|error| format!("rollback empty login continuation failed: {error}"))?;
        return Ok(None);
    };
    let payload: Json<Value> = row.get(0);
    sqlx::query("DELETE FROM iam_ephemeral_artifact WHERE artifact_key = $1")
        .bind(&storage_key)
        .execute(&mut *tx)
        .await
        .map_err(|error| format!("delete login continuation artifact failed: {error}"))?;
    tx.commit()
        .await
        .map_err(|error| format!("commit login continuation transaction failed: {error}"))?;
    Ok(login_continuation_from_json(&payload.0))
}

pub(crate) async fn upsert_qr_session(
    pg: &PgPool,
    tenant_id: &str,
    session: &LocalQrSession,
) -> Result<(), String> {
    let storage_key = artifact_key(tenant_id, KIND_QR_SESSION, &session.session_key);
    let payload = qr_session_to_payload(session);
    let timestamp = current_timestamp_utc();
    sqlx::query(
        "INSERT INTO iam_ephemeral_artifact \
         (artifact_key, tenant_id, artifact_kind, payload_json, expires_at, created_at, updated_at) \
         VALUES ($1, $2, $3, $4, $5, $6, $7) \
         ON CONFLICT (artifact_key) DO UPDATE SET \
           payload_json = EXCLUDED.payload_json, \
           expires_at = EXCLUDED.expires_at, \
           updated_at = EXCLUDED.updated_at",
    )
    .bind(&storage_key)
    .bind(tenant_id)
    .bind(KIND_QR_SESSION)
    .bind(Json(payload))
    .bind(millis_to_timestamp(session.expire_time))
    .bind(&timestamp)
    .bind(&timestamp)
    .execute(pg)
    .await
    .map_err(|error| format!("upsert qr session artifact failed: {error}"))?;
    Ok(())
}

pub(crate) async fn get_qr_session(
    pg: &PgPool,
    tenant_id: &str,
    session_key: &str,
) -> Result<Option<LocalQrSession>, String> {
    let storage_key = artifact_key(tenant_id, KIND_QR_SESSION, session_key);
    let row = sqlx::query(
        "SELECT payload_json FROM iam_ephemeral_artifact \
         WHERE artifact_key = $1 AND expires_at > $2",
    )
    .bind(&storage_key)
    .bind(current_timestamp_utc())
    .fetch_optional(pg)
    .await
    .map_err(|error| format!("load qr session artifact failed: {error}"))?;
    Ok(row.and_then(|row| {
        let payload: Json<Value> = row.get(0);
        qr_session_from_payload(&payload.0, session_key)
    }))
}

pub(crate) async fn qr_session_exists(
    pg: &PgPool,
    tenant_id: &str,
    session_key: &str,
) -> Result<bool, String> {
    let storage_key = artifact_key(tenant_id, KIND_QR_SESSION, session_key);
    let exists = sqlx::query_scalar::<_, bool>(
        "SELECT EXISTS( \
           SELECT 1 FROM iam_ephemeral_artifact \
           WHERE artifact_key = $1 AND expires_at > $2 \
         )",
    )
    .bind(&storage_key)
    .bind(current_timestamp_utc())
    .fetch_one(pg)
    .await
    .map_err(|error| format!("check qr session artifact failed: {error}"))?;
    Ok(exists)
}

pub(crate) async fn mutate_qr_session(
    pg: &PgPool,
    tenant_id: &str,
    session_key: &str,
    mutate: impl FnOnce(&mut LocalQrSession),
) -> Result<Option<LocalQrSession>, String> {
    let storage_key = artifact_key(tenant_id, KIND_QR_SESSION, session_key);
    let mut tx = pg
        .begin()
        .await
        .map_err(|error| format!("begin qr session transaction failed: {error}"))?;
    let row = sqlx::query(
        "SELECT payload_json FROM iam_ephemeral_artifact \
         WHERE artifact_key = $1 AND expires_at > $2 \
         FOR UPDATE",
    )
    .bind(&storage_key)
    .bind(current_timestamp_utc())
    .fetch_optional(&mut *tx)
    .await
    .map_err(|error| format!("load qr session artifact failed: {error}"))?;
    let Some(row) = row else {
        tx.rollback()
            .await
            .map_err(|error| format!("rollback empty qr session failed: {error}"))?;
        return Ok(None);
    };
    let payload: Json<Value> = row.get(0);
    let mut session = qr_session_from_payload(&payload.0, session_key)
        .ok_or_else(|| "qr session payload is invalid".to_string())?;
    mutate(&mut session);
    let next_payload = qr_session_to_payload(&session);
    let timestamp = current_timestamp_utc();
    sqlx::query(
        "UPDATE iam_ephemeral_artifact \
         SET payload_json = $2, expires_at = $3, updated_at = $4 \
         WHERE artifact_key = $1",
    )
    .bind(&storage_key)
    .bind(Json(next_payload))
    .bind(millis_to_timestamp(session.expire_time))
    .bind(&timestamp)
    .execute(&mut *tx)
    .await
    .map_err(|error| format!("update qr session artifact failed: {error}"))?;
    tx.commit()
        .await
        .map_err(|error| format!("commit qr session transaction failed: {error}"))?;
    Ok(Some(session))
}

fn password_reset_request_from_payload(payload: Json<Value>) -> Option<LocalPasswordResetRequest> {
    let code = optional_string(payload.0.get("code"))?;
    let expire_time = payload.0["expireTimeMs"].as_u64()? as u128;
    let username = optional_string(payload.0.get("username"))?;
    Some(LocalPasswordResetRequest {
        code,
        expire_time,
        username,
    })
}

fn login_continuation_to_json(continuation: &LocalLoginContinuation) -> Value {
    json!({
        "continuationKind": continuation.continuation_kind,
        "expireTimeMs": continuation.expire_time,
        "organizationIds": continuation.organization_ids,
        "qrSessionKey": continuation.qr_session_key,
        "runtimeAppId": continuation.runtime_app_id,
        "tenantId": continuation.tenant_id,
        "user": user_to_json(&continuation.user),
    })
}

fn login_continuation_from_json(payload: &Value) -> Option<LocalLoginContinuation> {
    let expire_time = payload["expireTimeMs"].as_u64()? as u128;
    let continuation_kind = optional_string(payload.get("continuationKind"))
        .unwrap_or_else(|| "organization".to_string());
    let organization_ids = payload
        .get("organizationIds")
        .and_then(Value::as_array)
        .map(|values| {
            values
                .iter()
                .filter_map(|value| value.as_str().map(str::to_string))
                .collect()
        })
        .unwrap_or_default();
    let qr_session_key = optional_string(payload.get("qrSessionKey"));
    let runtime_app_id = optional_string(payload.get("runtimeAppId"))
        .or_else(|| optional_string(payload.get("runtime_app_id")))
        .unwrap_or_default();
    let tenant_id = optional_string(payload.get("tenantId")).unwrap_or_default();
    let user = user_from_json(payload.get("user")?)?;
    Some(LocalLoginContinuation {
        continuation_kind,
        expire_time,
        organization_ids,
        qr_session_key,
        runtime_app_id,
        tenant_id,
        user,
    })
}

fn qr_session_to_payload(session: &LocalQrSession) -> Value {
    json!({
        "completedSession": session.completed_session.as_ref().map(session_to_json),
        "expireTimeMs": session.expire_time,
        "fallbackUrl": session.fallback_url,
        "organizationSelection": session.organization_selection.clone(),
        "pollSecret": session.poll_secret,
        "purpose": session.purpose,
        "qrContent": session.qr_content,
        "qrContentMode": session.qr_content_mode,
        "sessionExchanged": session.session_exchanged,
        "sessionKey": session.session_key,
        "status": session.status,
    })
}

fn qr_session_from_payload(payload: &Value, session_key: &str) -> Option<LocalQrSession> {
    let completed_session = payload.get("completedSession").and_then(session_from_json);
    Some(LocalQrSession {
        completed_session,
        expire_time: payload["expireTimeMs"].as_u64()? as u128,
        fallback_url: optional_string(payload.get("fallbackUrl"))?,
        organization_selection: payload.get("organizationSelection").cloned(),
        poll_secret: optional_string(payload.get("pollSecret"))?,
        purpose: optional_string(payload.get("purpose"))?,
        qr_content: optional_string(payload.get("qrContent"))?,
        qr_content_mode: optional_string(payload.get("qrContentMode"))?,
        session_exchanged: payload["sessionExchanged"].as_bool().unwrap_or(false),
        session_key: optional_string(payload.get("sessionKey"))
            .unwrap_or_else(|| session_key.to_string()),
        status: optional_string(payload.get("status"))?,
    })
}

fn user_from_json(value: &Value) -> Option<LocalIamUser> {
    let tenant_id = optional_string(value.get("tenantId"))
        .or_else(|| optional_string(value.get("tenant_id")))?;
    Some(LocalIamUser {
        display_name: optional_string(value.get("displayName"))
            .or_else(|| optional_string(value.get("name")))?,
        email: optional_string(value.get("email")),
        email_verified: value["emailVerified"].as_bool().unwrap_or(false),
        id: optional_string(value.get("id")).or_else(|| optional_string(value.get("userId")))?,
        last_login_at: optional_string(value.get("lastLoginAt")),
        password_changed_at: optional_string(value.get("passwordChangedAt")),
        phone: optional_string(value.get("phone")),
        phone_verified: value["phoneVerified"].as_bool().unwrap_or(false),
        tenant_id,
        username: optional_string(value.get("username"))?,
    })
}

fn session_from_json(value: &Value) -> Option<LocalSession> {
    use sdkwork_iam_context_service::{AuthLevel, DeploymentMode, IamAppContext, IamUserSurface};

    let access_token = optional_string(value.get("accessToken"))?;
    let auth_token = optional_string(value.get("authToken"))?;
    let refresh_token = optional_string(value.get("refreshToken")).unwrap_or_default();
    let session_id = optional_string(value.get("sessionId"))?;
    let context = value.get("context")?;
    let user = user_from_json(value.get("user")?)?;
    let auth_level = match optional_string(context.get("authLevel"))?.as_str() {
        "mfa" => AuthLevel::Mfa,
        "system" => AuthLevel::System,
        "password" => AuthLevel::Password,
        _ => AuthLevel::Anonymous,
    };
    let deployment_mode = match optional_string(context.get("deploymentMode"))?.as_str() {
        "local" => DeploymentMode::Local,
        "private" => DeploymentMode::Private,
        _ => DeploymentMode::Saas,
    };
    let data_scope = context["dataScope"]
        .as_array()?
        .iter()
        .filter_map(|entry| entry.as_str().map(str::to_string))
        .collect();
    let permission_scope = context["permissionScope"]
        .as_array()?
        .iter()
        .filter_map(|entry| entry.as_str().map(str::to_string))
        .collect();
    let organization_id = optional_string(context.get("organizationId"));
    Some(LocalSession {
        access_token,
        auth_token,
        context: IamAppContext {
            app_id: optional_string(context.get("appId"))?,
            auth_level,
            data_scope,
            deployment_mode,
            environment: environment_from_config(
                &optional_string(context.get("environment")).unwrap_or_else(|| "local".to_string()),
            ),
            login_scope: login_scope_from_string(
                &optional_string(context.get("loginScope")).unwrap_or_else(|| "TENANT".to_string()),
            ),
            organization_id: organization_id.clone(),
            permission_scope,
            session_id: optional_string(context.get("sessionId"))
                .unwrap_or_else(|| session_id.clone()),
            tenant_id: optional_string(context.get("tenantId"))?,
            user_id: optional_string(context.get("userId")).unwrap_or_else(|| user.id.clone()),
            user_surface: IamUserSurface {
                app: true,
                organization_member: organization_id.is_some(),
            },
            standard_role_codes: Vec::new(),
        },
        refresh_token,
        session_id,
        user,
    })
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub(crate) struct OAuthStateRecord {
    pub(crate) provider: String,
    pub(crate) redirect_uri: String,
    pub(crate) state: String,
    pub(crate) tenant_id: String,
    pub(crate) runtime_app_id: String,
}

pub(crate) async fn upsert_oauth_state(
    pg: &PgPool,
    tenant_id: &str,
    record: &OAuthStateRecord,
) -> Result<(), String> {
    let storage_key = artifact_key(tenant_id, KIND_OAUTH_STATE, &record.state);
    let payload = json!({
        "provider": record.provider,
        "redirectUri": record.redirect_uri,
        "state": record.state,
        "tenantId": record.tenant_id,
        "runtimeAppId": record.runtime_app_id,
    });
    let expires_at = millis_to_timestamp(current_millis() + OAUTH_STATE_TTL_MILLIS);
    let timestamp = current_timestamp_utc();
    sqlx::query(
        "INSERT INTO iam_ephemeral_artifact \
         (artifact_key, tenant_id, artifact_kind, payload_json, expires_at, created_at, updated_at) \
         VALUES ($1, $2, $3, $4, $5, $6, $7) \
         ON CONFLICT (artifact_key) DO UPDATE SET \
           payload_json = EXCLUDED.payload_json, \
           expires_at = EXCLUDED.expires_at, \
           updated_at = EXCLUDED.updated_at",
    )
    .bind(&storage_key)
    .bind(tenant_id)
    .bind(KIND_OAUTH_STATE)
    .bind(Json(payload))
    .bind(expires_at)
    .bind(&timestamp)
    .bind(&timestamp)
    .execute(pg)
    .await
    .map_err(|error| format!("upsert oauth state artifact failed: {error}"))?;
    Ok(())
}

pub(crate) async fn take_oauth_state(
    pg: &PgPool,
    tenant_id: &str,
    state: &str,
) -> Result<Option<OAuthStateRecord>, String> {
    let storage_key = artifact_key(tenant_id, KIND_OAUTH_STATE, state);
    let mut tx = pg
        .begin()
        .await
        .map_err(|error| format!("begin oauth state transaction failed: {error}"))?;
    let row = sqlx::query(
        "SELECT payload_json FROM iam_ephemeral_artifact \
         WHERE artifact_key = $1 AND expires_at > $2 \
         FOR UPDATE",
    )
    .bind(&storage_key)
    .bind(current_timestamp_utc())
    .fetch_optional(&mut *tx)
    .await
    .map_err(|error| format!("load oauth state artifact failed: {error}"))?;
    let Some(row) = row else {
        tx.rollback()
            .await
            .map_err(|error| format!("rollback empty oauth state failed: {error}"))?;
        return Ok(None);
    };
    let payload: Json<Value> = row.get(0);
    sqlx::query("DELETE FROM iam_ephemeral_artifact WHERE artifact_key = $1")
        .bind(&storage_key)
        .execute(&mut *tx)
        .await
        .map_err(|error| format!("delete oauth state artifact failed: {error}"))?;
    tx.commit()
        .await
        .map_err(|error| format!("commit oauth state transaction failed: {error}"))?;
    let provider = payload
        .0
        .get("provider")
        .and_then(|value| value.as_str())
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .map(str::to_string)
        .ok_or_else(|| "stored oauth state is missing provider".to_string())?;
    let redirect_uri = payload
        .0
        .get("redirectUri")
        .or_else(|| payload.0.get("redirect_uri"))
        .and_then(|value| value.as_str())
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .map(str::to_string)
        .ok_or_else(|| "stored oauth state is missing redirectUri".to_string())?;
    let tenant_id = payload
        .0
        .get("tenantId")
        .or_else(|| payload.0.get("tenant_id"))
        .and_then(|value| value.as_str())
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .map(str::to_string)
        .unwrap_or_default();
    let runtime_app_id = payload
        .0
        .get("runtimeAppId")
        .or_else(|| payload.0.get("runtime_app_id"))
        .and_then(|value| value.as_str())
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .map(str::to_string)
        .unwrap_or_default();
    Ok(Some(OAuthStateRecord {
        provider,
        redirect_uri,
        state: state.to_string(),
        tenant_id,
        runtime_app_id,
    }))
}
