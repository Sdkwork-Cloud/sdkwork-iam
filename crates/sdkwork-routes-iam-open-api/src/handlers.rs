use axum::{
    body::Bytes,
    extract::{Path, Query, State},
    http::{header, HeaderMap, StatusCode},
    response::{IntoResponse, Response},
    routing::{get, post},
    Router,
};
use sdkwork_iam_web_adapter::{
    handle_provider_callback_get as process_provider_callback_get,
    handle_provider_callback_post as process_provider_callback_post, iam_api_error,
    ProviderCallbackHttpResponse, ProviderCallbackRequestMeta,
};
use std::collections::HashMap;

use crate::is_blank;
use crate::oauth_authorization_handlers::{
    enforce_open_api_rate_limit, handle_oauth_authorize, handle_oauth_introspect,
    handle_oauth_revoke, handle_oauth_token, handle_oauth_userinfo, retrieve_oauth_jwks,
    retrieve_openid_configuration,
};
use crate::state::OpenIamState;

pub(crate) fn build_sdkwork_iam_open_api_routes(state: OpenIamState) -> Router {
    Router::new()
        .route(
            "/.well-known/openid-configuration",
            get(retrieve_openid_configuration),
        )
        .route(
            "/.well-known/oauth-authorization-server",
            get(retrieve_openid_configuration),
        )
        .route(
            "/iam/v3/api/system/oauth/openid_configuration",
            get(retrieve_openid_configuration),
        )
        .route(
            "/iam/v3/api/system/oauth/authorization_server_metadata",
            get(retrieve_openid_configuration),
        )
        .route("/iam/v3/oauth/authorize", get(handle_oauth_authorize))
        .route("/iam/v3/api/oauth/authorize", get(handle_oauth_authorize))
        .route("/iam/v3/oauth/token", post(handle_oauth_token))
        .route("/iam/v3/api/oauth/token", post(handle_oauth_token))
        .route("/iam/v3/oauth/revoke", post(handle_oauth_revoke))
        .route("/iam/v3/api/oauth/revoke", post(handle_oauth_revoke))
        .route("/iam/v3/oauth/introspect", post(handle_oauth_introspect))
        .route(
            "/iam/v3/api/oauth/introspect",
            post(handle_oauth_introspect),
        )
        .route("/iam/v3/oauth/jwks", get(retrieve_oauth_jwks))
        .route("/iam/v3/api/oauth/jwks", get(retrieve_oauth_jwks))
        .route("/iam/v3/oauth/userinfo", get(handle_oauth_userinfo))
        .route("/iam/v3/api/oauth/userinfo", get(handle_oauth_userinfo))
        .route(
            "/iam/v3/api/oauth/provider_callbacks/{callback_public_id}",
            get(handle_provider_callback_get).post(handle_provider_callback_post),
        )
        .with_state(state)
}

/// Builds route definitions without web-framework wrapping (for env-based bootstrap).
pub(crate) fn build_sdkwork_iam_open_api_routes_with_state(state: OpenIamState) -> Router {
    build_sdkwork_iam_open_api_routes(state)
}

async fn handle_provider_callback_get(
    State(state): State<OpenIamState>,
    Path(callback_public_id): Path<String>,
    Query(query): Query<HashMap<String, String>>,
) -> Response {
    let Ok(pg) = state.require_pool() else {
        return oauth_provider_callback_unavailable_error();
    };
    if let Some(response) = enforce_open_api_rate_limit(
        &state,
        pg,
        &format!("oauth:provider_callback:{callback_public_id}"),
    )
    .await
    {
        return response;
    }

    match process_provider_callback_get(pg, &callback_public_id, &query).await {
        Ok(response) => provider_callback_response(response),
        Err(message) => provider_callback_error(message),
    }
}

async fn handle_provider_callback_post(
    State(state): State<OpenIamState>,
    headers: HeaderMap,
    Path(callback_public_id): Path<String>,
    Query(query): Query<HashMap<String, String>>,
    body: Bytes,
) -> Response {
    let Ok(pg) = state.require_pool() else {
        return oauth_provider_callback_unavailable_error();
    };
    if let Some(response) = enforce_open_api_rate_limit(
        &state,
        pg,
        &format!("oauth:provider_callback:{callback_public_id}"),
    )
    .await
    {
        return response;
    }

    let meta = provider_callback_request_meta(&headers);
    let content_type = headers
        .get(header::CONTENT_TYPE)
        .and_then(|value| value.to_str().ok());
    match process_provider_callback_post(
        pg,
        &callback_public_id,
        &query,
        &body,
        content_type,
        &meta,
    )
    .await
    {
        Ok(response) => provider_callback_response(response),
        Err(message) => provider_callback_error(message),
    }
}

fn provider_callback_request_meta(headers: &HeaderMap) -> ProviderCallbackRequestMeta {
    ProviderCallbackRequestMeta {
        request_ip: headers
            .get("x-forwarded-for")
            .or_else(|| headers.get("x-real-ip"))
            .and_then(|value| value.to_str().ok())
            .map(str::trim)
            .filter(|value| !is_blank(Some(value)))
            .map(str::to_owned),
        user_agent: headers
            .get(header::USER_AGENT)
            .and_then(|value| value.to_str().ok())
            .map(str::trim)
            .filter(|value| !is_blank(Some(value)))
            .map(str::to_owned),
    }
}

fn provider_callback_response(response: ProviderCallbackHttpResponse) -> Response {
    let status =
        StatusCode::from_u16(response.status_code).unwrap_or(StatusCode::INTERNAL_SERVER_ERROR);
    let mut builder = axum::response::Response::builder().status(status);
    if let Some(content_type) = response.content_type {
        builder = builder.header(header::CONTENT_TYPE, content_type);
    }
    builder
        .body(axum::body::Body::from(response.body))
        .unwrap_or_else(|_| StatusCode::INTERNAL_SERVER_ERROR.into_response())
}

fn provider_callback_error(message: String) -> Response {
    let (status, code) = if message.contains("was not found") {
        (
            StatusCode::NOT_FOUND,
            "iam_oauth_provider_callback_not_found",
        )
    } else if message.contains("verification failed") || message.contains("is invalid") {
        (
            StatusCode::FORBIDDEN,
            "iam_oauth_provider_callback_verification_failed",
        )
    } else if message.contains("is not configured") {
        (
            StatusCode::SERVICE_UNAVAILABLE,
            "iam_oauth_provider_callback_unavailable",
        )
    } else {
        (
            StatusCode::BAD_REQUEST,
            "iam_oauth_provider_callback_failed",
        )
    };

    iam_api_error(status, code, &message)
}

fn oauth_provider_callback_unavailable_error() -> Response {
    iam_api_error(
        StatusCode::SERVICE_UNAVAILABLE,
        "iam_oauth_provider_callback_unavailable",
        "OAuth provider callback processing is not configured",
    )
}
