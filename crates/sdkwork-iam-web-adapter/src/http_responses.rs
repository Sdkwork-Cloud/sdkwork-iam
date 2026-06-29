use axum::{
    http::{header, HeaderName, HeaderValue, StatusCode},
    response::{IntoResponse, Response},
    Json,
};
use sdkwork_utils_rust::{SdkWorkApiResponse, SdkWorkProblemDetail, SdkWorkResultCode};
use sdkwork_web_core::new_request_id;
use serde_json::Value;

fn next_trace_id() -> String {
    new_request_id()
}

fn attach_trace_header(response: &mut Response, trace_id: &str) {
    if let Ok(value) = HeaderValue::from_str(trace_id) {
        response
            .headers_mut()
            .insert(HeaderName::from_static("x-sdkwork-trace-id"), value);
    }
}

pub fn iam_api_success(data: Value) -> Response {
    let trace_id = next_trace_id();
    let envelope = SdkWorkApiResponse::success(data, trace_id.clone());
    let mut response = (StatusCode::OK, Json(envelope)).into_response();
    attach_trace_header(&mut response, &trace_id);
    response
}

fn result_code_from_status(status: StatusCode) -> SdkWorkResultCode {
    match status.as_u16() {
        400 => SdkWorkResultCode::ValidationError,
        401 => SdkWorkResultCode::AuthenticationRequired,
        403 => SdkWorkResultCode::PermissionRequired,
        404 => SdkWorkResultCode::NotFound,
        405 => SdkWorkResultCode::MethodNotAllowed,
        409 => SdkWorkResultCode::Conflict,
        423 => SdkWorkResultCode::Locked,
        429 => SdkWorkResultCode::RateLimitExceeded,
        503 => SdkWorkResultCode::ServiceUnavailable,
        _ => SdkWorkResultCode::InternalError,
    }
}

pub fn iam_wire_result_code(status: StatusCode, wire_code: &str) -> SdkWorkResultCode {
    match wire_code {
        "iam_session_required" | "iam_access_token_required" | "iam_runtime_app_id_required" => {
            SdkWorkResultCode::AuthenticationRequired
        }
        "iam_invalid_credentials"
        | "iam_runtime_app_id_invalid"
        | "iam_invalid_password_reset_challenge" => SdkWorkResultCode::InvalidToken,
        "iam_permission_forbidden" | "iam_login_credential_headers_forbidden" => {
            SdkWorkResultCode::PermissionRequired
        }
        "iam_account_locked" => SdkWorkResultCode::Locked,
        "iam_password_policy_violation"
        | "iam_password_reused"
        | "iam_password_unchanged"
        | "iam_email_invalid"
        | "iam_phone_invalid" => SdkWorkResultCode::ValidationError,
        "iam_oauth_unavailable" => SdkWorkResultCode::ServiceUnavailable,
        "iam_contact_already_bound" => SdkWorkResultCode::Conflict,
        code if code.ends_with("_not_found") => SdkWorkResultCode::NotFound,
        code if code.contains("forbidden") => SdkWorkResultCode::PermissionRequired,
        code if code.contains("invalid") => SdkWorkResultCode::ValidationError,
        _ => result_code_from_status(status),
    }
}

pub fn iam_api_error(status: StatusCode, wire_code: &str, message: &str) -> Response {
    let trace_id = next_trace_id();
    let result_code = iam_wire_result_code(status, wire_code);
    let problem = SdkWorkProblemDetail::platform(result_code, message, trace_id.clone());
    let response_status =
        StatusCode::from_u16(problem.status).unwrap_or(StatusCode::INTERNAL_SERVER_ERROR);
    let mut response = (
        response_status,
        [(header::CONTENT_TYPE, "application/problem+json")],
        Json(problem),
    )
        .into_response();
    attach_trace_header(&mut response, &trace_id);
    response
}
