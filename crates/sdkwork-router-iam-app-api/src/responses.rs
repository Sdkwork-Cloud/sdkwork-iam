use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use sdkwork_web_core::{new_request_id, WebRequestContext};
use serde_json::{json, Value};
use sqlx::PgPool;

use crate::state::LocalIamConfig;

fn next_request_id() -> String {
    new_request_id()
}

pub(crate) fn appbase_ok(data: Value) -> Response {
    Json(json!({
        "code": "2000",
        "data": data,
        "message": "success",
        "requestId": next_request_id()
    }))
    .into_response()
}

pub(crate) fn appbase_error(status: StatusCode, code: &str, message: &str) -> Response {
    (
        status,
        Json(json!({
            "code": code,
            "data": Value::Null,
            "message": message,
            "requestId": next_request_id()
        })),
    )
        .into_response()
}

pub(crate) fn iam_session_required_error() -> Response {
    appbase_error(
        StatusCode::UNAUTHORIZED,
        "iam_session_required",
        "current IAM session is required",
    )
}

pub(crate) fn iam_permission_forbidden_error() -> Response {
    appbase_error(
        StatusCode::FORBIDDEN,
        "iam_permission_forbidden",
        "required IAM permission is missing from the current session",
    )
}

#[allow(dead_code)]
pub(crate) fn password_credential_unavailable_error() -> Response {
    appbase_error(
        StatusCode::INTERNAL_SERVER_ERROR,
        "iam_password_credential_unavailable",
        "password credential could not be processed",
    )
}

pub(crate) fn password_policy_violation_error(config: &LocalIamConfig) -> Response {
    appbase_error(
        StatusCode::BAD_REQUEST,
        "iam_password_policy_violation",
        &crate::passwords::password_policy_description(config),
    )
}

pub(crate) fn oauth_unavailable_error() -> Response {
    appbase_error(
        StatusCode::SERVICE_UNAVAILABLE,
        "iam_oauth_unavailable",
        "OAuth login requires a configured provider verification service",
    )
}

pub(crate) fn require_credential_entry_tenant_id(
    ctx: &WebRequestContext,
) -> Result<&str, Response> {
    ctx.require_tenant_id().map_err(|_| {
        appbase_error(
            StatusCode::UNAUTHORIZED,
            "iam_access_token_required",
            "credential entry routes require a valid Access-Token JWT for tenant isolation",
        )
    })
}

pub(crate) fn require_credential_entry_runtime_app_id(
    ctx: &WebRequestContext,
) -> Result<&str, Response> {
    ctx.require_app_id().map_err(|_| {
        appbase_error(
            StatusCode::UNAUTHORIZED,
            "iam_runtime_app_id_required",
            "credential entry routes require a bootstrap Access-Token with runtime appId",
        )
    })
}

pub(crate) async fn resolve_credential_entry_runtime_app(
    pg: &PgPool,
    ctx: &WebRequestContext,
    tenant_id: &str,
) -> Result<String, Response> {
    let runtime_app_id = require_credential_entry_runtime_app_id(ctx)?;
    sdkwork_iam_web_adapter::validate_enabled_tenant_runtime_app(pg, tenant_id, runtime_app_id)
        .await
        .map_err(|error| {
            appbase_error(
                StatusCode::UNAUTHORIZED,
                "iam_runtime_app_id_invalid",
                &error,
            )
        })?;
    Ok(runtime_app_id.to_owned())
}

pub(crate) fn invalid_credentials_error() -> Response {
    appbase_error(
        StatusCode::UNAUTHORIZED,
        "iam_invalid_credentials",
        "invalid username or password",
    )
}

pub(crate) fn account_locked_error() -> Response {
    appbase_error(
        StatusCode::LOCKED,
        "iam_account_locked",
        "account is temporarily locked due to too many failed login attempts",
    )
}

pub(crate) fn invalid_password_reset_error() -> Response {
    appbase_error(
        StatusCode::UNAUTHORIZED,
        "iam_invalid_password_reset_challenge",
        "invalid or expired password reset request",
    )
}
