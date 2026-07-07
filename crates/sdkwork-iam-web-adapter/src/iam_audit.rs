//! Shared IAM audit and security-event writers for app-api and backend-api.

use serde_json::Value;
use sha2::{Digest, Sha256};
use sqlx::{types::Json, Executor, PgPool};

pub async fn record_audit_event(
    pg: &PgPool,
    tenant_id: &str,
    organization_id: Option<&str>,
    actor_user_id: Option<&str>,
    action: &str,
    resource_type: &str,
    resource_id: Option<&str>,
    request_id: Option<&str>,
    environment: &str,
    detail: Value,
) -> Result<(), String> {
    let organization_id = organization_id
        .filter(|value| !value.trim().is_empty())
        .unwrap_or("0");
    let now = chrono::Utc::now().to_rfc3339();
    let event_id = uuid::Uuid::now_v7().to_string();
    sqlx::query(
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
    .bind(environment)
    .bind(tenant_id)
    .bind(Json(detail))
    .bind(&now)
    .execute(pg)
    .await
    .map_err(|error| format!("insert iam audit event failed: {error}"))?;
    Ok(())
}

pub async fn record_audit_event_tx<'e, E>(
    executor: E,
    tenant_id: &str,
    organization_id: Option<&str>,
    actor_user_id: Option<&str>,
    action: &str,
    resource_type: &str,
    resource_id: Option<&str>,
    request_id: Option<&str>,
    environment: &str,
    detail: Value,
) -> Result<(), String>
where
    E: Executor<'e, Database = sqlx::Postgres>,
{
    let organization_id = organization_id
        .filter(|value| !value.trim().is_empty())
        .unwrap_or("0");
    let now = chrono::Utc::now().to_rfc3339();
    let event_id = uuid::Uuid::now_v7().to_string();
    sqlx::query(
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
    .bind(environment)
    .bind(tenant_id)
    .bind(Json(detail))
    .bind(&now)
    .execute(executor)
    .await
    .map_err(|error| format!("insert iam audit event failed: {error}"))?;
    Ok(())
}

pub async fn record_security_event(
    pg: &PgPool,
    tenant_id: &str,
    organization_id: Option<&str>,
    user_id: Option<&str>,
    event_type: &str,
    severity: &str,
    environment: &str,
    detail: Value,
) -> Result<(), String> {
    let organization_id = organization_id
        .filter(|value| !value.trim().is_empty())
        .unwrap_or("0");
    let now = chrono::Utc::now().to_rfc3339();
    let event_id = uuid::Uuid::now_v7().to_string();
    sqlx::query(
        "INSERT INTO iam_security_event \
         (id, tenant_id, organization_id, user_id, event_type, severity, environment, detail_json, created_at) \
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)",
    )
    .bind(&event_id)
    .bind(tenant_id)
    .bind(organization_id)
    .bind(user_id)
    .bind(event_type)
    .bind(severity)
    .bind(environment)
    .bind(Json(detail))
    .bind(&now)
    .execute(pg)
    .await
    .map_err(|error| format!("insert iam security event failed: {error}"))?;
    Ok(())
}

pub fn hash_session_id(session_id: &str) -> String {
    let digest = Sha256::digest(session_id.as_bytes());
    digest.iter().map(|byte| format!("{byte:02x}")).collect()
}

pub fn backend_environment_from_context(environment: Option<&str>) -> String {
    environment
        .filter(|value| !value.trim().is_empty())
        .unwrap_or("prod")
        .to_string()
}
