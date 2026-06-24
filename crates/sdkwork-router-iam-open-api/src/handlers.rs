use axum::{
    extract::{Path, Query},
    http::StatusCode,
    response::{IntoResponse, Response},
    routing::get,
    Json, Router,
};
use serde_json::{json, Value};
use std::collections::HashMap;

use crate::web_bootstrap::wrap_router_with_web_framework;

/// Builds route definitions without web-framework wrapping (for env-based bootstrap).
pub(crate) fn build_sdkwork_appbase_open_api_routes() -> Router {
    Router::new().route(
        "/iam/v3/api/oauth/provider_callbacks/{callback_public_id}",
        get(handle_provider_callback_get).post(handle_provider_callback_post),
    )
}

/// Builds the executable local/private `sdkwork-appbase-open-api` router.
///
/// Provider ingress is fail-closed until a configured OAuth webhook store is
/// attached by the appbase runtime.
pub fn build_sdkwork_appbase_open_api_router() -> Router {
    wrap_router_with_web_framework(build_sdkwork_appbase_open_api_routes())
}

async fn handle_provider_callback_get(
    Path(_callback_public_id): Path<String>,
    Query(_query): Query<HashMap<String, String>>,
) -> Response {
    oauth_provider_callback_unavailable_error()
}

async fn handle_provider_callback_post(
    Path(_callback_public_id): Path<String>,
    Json(_body): Json<Value>,
) -> Response {
    oauth_provider_callback_unavailable_error()
}

fn oauth_provider_callback_unavailable_error() -> Response {
    (
        StatusCode::SERVICE_UNAVAILABLE,
        Json(json!({
            "code": "iam_oauth_provider_callback_unavailable",
            "data": Value::Null,
            "message": "OAuth provider callback processing is not configured"
        })),
    )
        .into_response()
}
