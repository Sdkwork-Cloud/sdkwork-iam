use serde_json::{json, Value};
use sha2::{Digest, Sha256};
use sqlx::{types::Json, PgPool};

use crate::{state::LocalIamConfig, utils::*};

pub(crate) async fn record_audit_event(
    pg: &PgPool,
    tenant_id: &str,
    organization_id: Option<&str>,
    actor_user_id: Option<&str>,
    action: &str,
    resource_type: &str,
    resource_id: Option<&str>,
    request_id: Option<&str>,
    config: &LocalIamConfig,
    detail: Value,
) {
    let organization_id = organization_id
        .filter(|value| !crate::is_blank(Some(value)))
        .unwrap_or("0");
    let now = current_timestamp_utc();
    let event_id = uuid::Uuid::now_v7().to_string();
    let _ = sqlx::query(
        "INSERT INTO iam_audit_event \
         (id, tenant_id, organization_id, actor_user_id, action, resource_type, resource_id, \
          request_id, app_id, environment, sharding_key, detail_json, created_at) \
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)",
    )
    .bind(&event_id)
    .bind(tenant_id)
    .bind(organization_id)
    .bind(actor_user_id)
    .bind(action)
    .bind(resource_type)
    .bind(resource_id)
    .bind(request_id)
    .bind("")
    .bind(environment_to_string(&environment_from_config(
        &config.environment,
    )))
    .bind(tenant_id)
    .bind(Json(detail))
    .bind(&now)
    .execute(pg)
    .await;
}

pub(crate) async fn record_session_created(
    pg: &PgPool,
    config: &LocalIamConfig,
    tenant_id: &str,
    organization_id: Option<&str>,
    user_id: &str,
    session_id: &str,
    auth_level: &str,
    data_scope: &[String],
    permission_scope: &[String],
) {
    let session_id_hash = hash_session_id(session_id);
    record_audit_event(
        pg,
        tenant_id,
        organization_id,
        Some(user_id),
        "sessions.create",
        "iam_session",
        Some(session_id),
        None,
        config,
        json!({
            "authLevel": auth_level,
            "dataScope": data_scope,
            "permissionScope": permission_scope,
            "sessionIdHash": session_id_hash,
        }),
    )
    .await;
}

pub(crate) async fn record_session_revoked(
    pg: &PgPool,
    config: &LocalIamConfig,
    tenant_id: &str,
    organization_id: Option<&str>,
    user_id: &str,
    session_id: &str,
) {
    record_audit_event(
        pg,
        tenant_id,
        organization_id,
        Some(user_id),
        "sessions.revoke",
        "iam_session",
        Some(session_id),
        None,
        config,
        json!({
            "sessionIdHash": hash_session_id(session_id),
            "result": "success",
        }),
    )
    .await;
}

pub(crate) async fn record_login_success(
    pg: &PgPool,
    config: &LocalIamConfig,
    tenant_id: &str,
    user_id: &str,
    account: &str,
    method: &str,
) {
    record_audit_event(
        pg,
        tenant_id,
        None,
        Some(user_id),
        "auth.login",
        "iam_user",
        Some(user_id),
        None,
        config,
        json!({
            "account": account,
            "method": method,
            "result": "success",
        }),
    )
    .await;
}

pub(crate) async fn record_registration(
    pg: &PgPool,
    config: &LocalIamConfig,
    tenant_id: &str,
    user_id: &str,
    username: &str,
    email: Option<&str>,
    phone: Option<&str>,
) {
    record_audit_event(
        pg,
        tenant_id,
        None,
        Some(user_id),
        "registrations.create",
        "iam_user",
        Some(user_id),
        None,
        config,
        json!({
            "username": username,
            "email": email,
            "phone": phone,
            "result": "success",
        }),
    )
    .await;
}

pub(crate) async fn record_session_updated(
    pg: &PgPool,
    config: &LocalIamConfig,
    tenant_id: &str,
    organization_id: Option<&str>,
    user_id: &str,
    session_id: &str,
    data_scope: &[String],
    permission_scope: &[String],
    detail: Value,
) {
    let session_id_hash = hash_session_id(session_id);
    let mut audit_detail = detail;
    if let Some(object) = audit_detail.as_object_mut() {
        object.insert("dataScope".to_string(), json!(data_scope));
        object.insert("permissionScope".to_string(), json!(permission_scope));
        object.insert("sessionIdHash".to_string(), json!(session_id_hash));
    }
    record_audit_event(
        pg,
        tenant_id,
        organization_id,
        Some(user_id),
        "sessions.update",
        "iam_session",
        Some(session_id),
        None,
        config,
        audit_detail,
    )
    .await;
}

fn hash_session_id(session_id: &str) -> String {
    let digest = Sha256::digest(session_id.as_bytes());
    format!("{:x}", digest)
}
