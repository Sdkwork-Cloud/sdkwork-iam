//! Database-engine aware ephemeral artifact storage for IAM pre-auth flows.

use chrono::{DateTime, Utc};
use sdkwork_database_sqlx::DatabasePool;
use serde_json::{json, Value};
use sqlx::{Row, SqlitePool};

use crate::{directory::session_to_json, state::*, utils::*};

const KIND_QR_SESSION: &str = "qr_session";

fn artifact_key(tenant_id: &str, kind: &str, key: &str) -> String {
    format!("{tenant_id}:{kind}:{key}")
}

fn millis_to_timestamp(millis: u128) -> DateTime<Utc> {
    let seconds = (millis / 1000) as i64;
    let nanos = ((millis % 1000) * 1_000_000) as u32;
    DateTime::from_timestamp(seconds, nanos).unwrap_or_else(Utc::now)
}

pub(crate) async fn cleanup_expired_artifacts(pool: &DatabasePool) -> Result<(), String> {
    match pool {
        DatabasePool::Postgres(pg, _) => crate::ephemeral::cleanup_expired_artifacts(pg).await,
        DatabasePool::Sqlite(sqlite, _) => {
            sqlx::query("DELETE FROM iam_ephemeral_artifact WHERE expires_at <= ?")
                .bind(current_timestamp_utc().to_rfc3339())
                .execute(sqlite)
                .await
                .map_err(|error| format!("cleanup ephemeral artifacts failed: {error}"))?;
            Ok(())
        }
    }
}

pub(crate) async fn check_rate_limit(
    pool: &DatabasePool,
    tenant_id: &str,
    key: &str,
    max_requests: u32,
    window_seconds: u32,
) -> Result<bool, String> {
    match pool {
        DatabasePool::Postgres(pg, _) => {
            crate::ephemeral::check_rate_limit(pg, tenant_id, key, max_requests, window_seconds)
                .await
        }
        DatabasePool::Sqlite(sqlite, _) => {
            sdkwork_iam_web_adapter::check_rate_limit_sqlite(
                sqlite,
                tenant_id,
                key,
                max_requests,
                window_seconds,
            )
            .await
        }
    }
}

pub(crate) async fn upsert_qr_session(
    pool: &DatabasePool,
    tenant_id: &str,
    session: &LocalQrSession,
) -> Result<(), String> {
    match pool {
        DatabasePool::Postgres(pg, _) => {
            crate::ephemeral::upsert_qr_session(pg, tenant_id, session).await
        }
        DatabasePool::Sqlite(sqlite, _) => {
            upsert_qr_session_sqlite(sqlite, tenant_id, session).await
        }
    }
}

pub(crate) async fn get_qr_session(
    pool: &DatabasePool,
    tenant_id: &str,
    session_key: &str,
) -> Result<Option<LocalQrSession>, String> {
    match pool {
        DatabasePool::Postgres(pg, _) => {
            crate::ephemeral::get_qr_session(pg, tenant_id, session_key).await
        }
        DatabasePool::Sqlite(sqlite, _) => {
            get_qr_session_sqlite(sqlite, tenant_id, session_key).await
        }
    }
}

pub(crate) async fn qr_session_exists(
    pool: &DatabasePool,
    tenant_id: &str,
    session_key: &str,
) -> Result<bool, String> {
    match pool {
        DatabasePool::Postgres(pg, _) => {
            crate::ephemeral::qr_session_exists(pg, tenant_id, session_key).await
        }
        DatabasePool::Sqlite(sqlite, _) => {
            qr_session_exists_sqlite(sqlite, tenant_id, session_key).await
        }
    }
}

pub(crate) async fn mutate_qr_session(
    pool: &DatabasePool,
    tenant_id: &str,
    session_key: &str,
    mutate: impl FnOnce(&mut LocalQrSession),
) -> Result<Option<LocalQrSession>, String> {
    match pool {
        DatabasePool::Postgres(pg, _) => {
            crate::ephemeral::mutate_qr_session(pg, tenant_id, session_key, mutate).await
        }
        DatabasePool::Sqlite(sqlite, _) => {
            mutate_qr_session_sqlite(sqlite, tenant_id, session_key, mutate).await
        }
    }
}

async fn upsert_qr_session_sqlite(
    sqlite: &SqlitePool,
    tenant_id: &str,
    session: &LocalQrSession,
) -> Result<(), String> {
    let storage_key = artifact_key(tenant_id, KIND_QR_SESSION, &session.session_key);
    let payload = qr_session_to_payload(session);
    let timestamp = current_timestamp_utc().to_rfc3339();
    let expires_at = millis_to_timestamp(session.expire_time).to_rfc3339();
    sqlx::query(
        "INSERT INTO iam_ephemeral_artifact \
         (artifact_key, tenant_id, artifact_kind, payload_json, expires_at, created_at, updated_at) \
         VALUES (?, ?, ?, ?, ?, ?, ?) \
         ON CONFLICT (artifact_key) DO UPDATE SET \
           payload_json = excluded.payload_json, \
           expires_at = excluded.expires_at, \
           updated_at = excluded.updated_at",
    )
    .bind(&storage_key)
    .bind(tenant_id)
    .bind(KIND_QR_SESSION)
    .bind(payload.to_string())
    .bind(&expires_at)
    .bind(&timestamp)
    .bind(&timestamp)
    .execute(sqlite)
    .await
    .map_err(|error| format!("upsert qr session artifact failed: {error}"))?;
    Ok(())
}

async fn get_qr_session_sqlite(
    sqlite: &SqlitePool,
    tenant_id: &str,
    session_key: &str,
) -> Result<Option<LocalQrSession>, String> {
    let storage_key = artifact_key(tenant_id, KIND_QR_SESSION, session_key);
    let row = sqlx::query(
        "SELECT payload_json FROM iam_ephemeral_artifact \
         WHERE artifact_key = ? AND expires_at > ?",
    )
    .bind(&storage_key)
    .bind(current_timestamp_utc().to_rfc3339())
    .fetch_optional(sqlite)
    .await
    .map_err(|error| format!("load qr session artifact failed: {error}"))?;
    Ok(row.and_then(|row| {
        let payload: String = row.get(0);
        let payload = serde_json::from_str::<Value>(&payload).ok()?;
        qr_session_from_payload(&payload, session_key)
    }))
}

async fn qr_session_exists_sqlite(
    sqlite: &SqlitePool,
    tenant_id: &str,
    session_key: &str,
) -> Result<bool, String> {
    let storage_key = artifact_key(tenant_id, KIND_QR_SESSION, session_key);
    let exists = sqlx::query_scalar::<_, i32>(
        "SELECT EXISTS( \
           SELECT 1 FROM iam_ephemeral_artifact \
           WHERE artifact_key = ? AND expires_at > ? \
         )",
    )
    .bind(&storage_key)
    .bind(current_timestamp_utc().to_rfc3339())
    .fetch_one(sqlite)
    .await
    .map_err(|error| format!("check qr session artifact failed: {error}"))?;
    Ok(exists != 0)
}

async fn mutate_qr_session_sqlite(
    sqlite: &SqlitePool,
    tenant_id: &str,
    session_key: &str,
    mutate: impl FnOnce(&mut LocalQrSession),
) -> Result<Option<LocalQrSession>, String> {
    let storage_key = artifact_key(tenant_id, KIND_QR_SESSION, session_key);
    let mut tx = sqlite
        .begin()
        .await
        .map_err(|error| format!("begin qr session transaction failed: {error}"))?;
    let row = sqlx::query(
        "SELECT payload_json FROM iam_ephemeral_artifact \
         WHERE artifact_key = ? AND expires_at > ?",
    )
    .bind(&storage_key)
    .bind(current_timestamp_utc().to_rfc3339())
    .fetch_optional(&mut *tx)
    .await
    .map_err(|error| format!("load qr session artifact failed: {error}"))?;
    let Some(row) = row else {
        tx.rollback()
            .await
            .map_err(|error| format!("rollback empty qr session failed: {error}"))?;
        return Ok(None);
    };
    let payload: String = row.get(0);
    let payload = serde_json::from_str::<Value>(&payload)
        .map_err(|error| format!("qr session payload is invalid: {error}"))?;
    let mut session = qr_session_from_payload(&payload, session_key)
        .ok_or_else(|| "qr session payload is invalid".to_string())?;
    mutate(&mut session);
    let next_payload = qr_session_to_payload(&session);
    let timestamp = current_timestamp_utc().to_rfc3339();
    let expires_at = millis_to_timestamp(session.expire_time).to_rfc3339();
    sqlx::query(
        "UPDATE iam_ephemeral_artifact \
         SET payload_json = ?, expires_at = ?, updated_at = ? \
         WHERE artifact_key = ?",
    )
    .bind(next_payload.to_string())
    .bind(&expires_at)
    .bind(&timestamp)
    .bind(&storage_key)
    .execute(&mut *tx)
    .await
    .map_err(|error| format!("update qr session artifact failed: {error}"))?;
    tx.commit()
        .await
        .map_err(|error| format!("commit qr session transaction failed: {error}"))?;
    Ok(Some(session))
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

pub(crate) fn local_session_from_json(value: &Value) -> Option<LocalSession> {
    session_from_json(value)
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
