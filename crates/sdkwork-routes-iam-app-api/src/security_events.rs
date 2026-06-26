use serde_json::{json, Value};
use sqlx::{types::Json, PgPool};

use crate::utils::current_timestamp_utc;

pub(crate) async fn record_security_event(
    pg: &PgPool,
    tenant_id: &str,
    organization_id: Option<&str>,
    user_id: Option<&str>,
    session_id: Option<&str>,
    event_type: &str,
    severity: &str,
    detail: Value,
) {
    let organization_id = organization_id
        .filter(|value| !crate::is_blank(Some(value)))
        .unwrap_or("0");
    let now = current_timestamp_utc();
    let event_id = uuid::Uuid::now_v7().to_string();
    let _ = sqlx::query(
        "INSERT INTO iam_security_event \
         (id, tenant_id, organization_id, user_id, session_id, event_type, severity, detail_json, created_at) \
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)",
    )
    .bind(&event_id)
    .bind(tenant_id)
    .bind(organization_id)
    .bind(user_id)
    .bind(session_id)
    .bind(event_type)
    .bind(severity)
    .bind(Json(detail))
    .bind(&now)
    .execute(pg)
    .await;
}

pub(crate) async fn record_session_created(
    pg: &PgPool,
    tenant_id: &str,
    organization_id: Option<&str>,
    user_id: &str,
    session_id: &str,
    auth_level: &str,
) {
    record_security_event(
        pg,
        tenant_id,
        organization_id,
        Some(user_id),
        Some(session_id),
        "sessions.create",
        "info",
        json!({
            "authLevel": auth_level,
            "result": "success",
        }),
    )
    .await;
}

pub(crate) async fn record_session_revoked(
    pg: &PgPool,
    tenant_id: &str,
    organization_id: Option<&str>,
    user_id: &str,
    session_id: &str,
) {
    record_security_event(
        pg,
        tenant_id,
        organization_id,
        Some(user_id),
        Some(session_id),
        "sessions.revoke",
        "info",
        json!({ "result": "success" }),
    )
    .await;
}

pub(crate) async fn record_session_updated(
    pg: &PgPool,
    tenant_id: &str,
    organization_id: Option<&str>,
    user_id: &str,
    session_id: &str,
    detail: Value,
) {
    record_security_event(
        pg,
        tenant_id,
        organization_id,
        Some(user_id),
        Some(session_id),
        "sessions.update",
        "info",
        detail,
    )
    .await;
}

pub(crate) async fn record_session_refreshed(
    pg: &PgPool,
    tenant_id: &str,
    organization_id: Option<&str>,
    user_id: &str,
    previous_session_id: &str,
    next_session_id: &str,
) {
    record_security_event(
        pg,
        tenant_id,
        organization_id,
        Some(user_id),
        Some(next_session_id),
        "sessions.refresh",
        "info",
        json!({
            "previousSessionId": previous_session_id,
            "result": "success",
        }),
    )
    .await;
}

pub(crate) async fn record_login_failed(pg: &PgPool, tenant_id: &str, account: &str, reason: &str) {
    record_security_event(
        pg,
        tenant_id,
        None,
        None,
        None,
        "auth.login.failed",
        "warning",
        json!({
            "account": account,
            "reason": reason,
        }),
    )
    .await;
}

pub(crate) async fn record_login_success(
    pg: &PgPool,
    tenant_id: &str,
    user_id: &str,
    account: &str,
    method: &str,
) {
    record_security_event(
        pg,
        tenant_id,
        None,
        Some(user_id),
        None,
        "auth.login.success",
        "info",
        json!({
            "account": account,
            "method": method,
            "result": "success",
        }),
    )
    .await;
}

pub(crate) async fn record_refresh_token_reuse(
    pg: &PgPool,
    tenant_id: &str,
    organization_id: Option<&str>,
    user_id: &str,
    session_id: &str,
) {
    record_security_event(
        pg,
        tenant_id,
        organization_id,
        Some(user_id),
        Some(session_id),
        "sessions.refresh.reuse",
        "critical",
        json!({
            "result": "revoked_all_sessions",
        }),
    )
    .await;
}

pub(crate) async fn record_account_locked(
    pg: &PgPool,
    tenant_id: &str,
    user_id: &str,
    account: &str,
) {
    record_security_event(
        pg,
        tenant_id,
        None,
        Some(user_id),
        None,
        "auth.account.locked",
        "warning",
        json!({
            "account": account,
            "result": "locked",
        }),
    )
    .await;
}

pub(crate) async fn record_password_reset_completed(
    pg: &PgPool,
    tenant_id: &str,
    user_id: &str,
    account: &str,
) {
    record_security_event(
        pg,
        tenant_id,
        None,
        Some(user_id),
        None,
        "password_resets.create",
        "info",
        json!({
            "account": account,
            "result": "success",
        }),
    )
    .await;
}
