use axum::{
    extract::{Query, State},
    http::{header, HeaderMap, StatusCode},
    response::{IntoResponse, Redirect, Response},
    Json,
};
use sdkwork_iam_web_adapter::{
    build_oauth_jwks_document, build_openid_configuration_document, build_userinfo_claims,
    create_pending_authorization_state, exchange_authorization_code, exchange_refresh_token,
    introspect_oauth_token, load_oauth_bearer_scopes, resolve_iam_app_context_from_oauth_bearer,
    resolve_relying_party_client, revoke_oauth_token, validate_authorize_request, AuthorizeRequest,
};
use serde_json::{json, Value};
use std::collections::HashMap;

use crate::state::OpenIamState;

pub async fn retrieve_openid_configuration() -> Json<Value> {
    Json(build_openid_configuration_document())
}

pub async fn handle_oauth_authorize(
    State(state): State<OpenIamState>,
    Query(query): Query<HashMap<String, String>>,
) -> Response {
    let Ok(pg) = state.require_pool() else {
        return oauth_error(
            StatusCode::SERVICE_UNAVAILABLE,
            "iam_oauth_authorization_server_unavailable",
            "OAuth authorization server database is not configured",
        );
    };

    let request = match parse_authorize_request(&query) {
        Ok(request) => request,
        Err(message) => {
            return oauth_error(
                StatusCode::BAD_REQUEST,
                "iam_oauth_authorize_invalid",
                &message,
            );
        }
    };

    let client =
        match resolve_relying_party_client(pg, &request.client_id, request.tenant_id.as_deref())
            .await
        {
            Ok(client) => client,
            Err(message) => {
                return oauth_error(
                    StatusCode::BAD_REQUEST,
                    "iam_oauth_client_invalid",
                    &message,
                );
            }
        };

    let scopes = match validate_authorize_request(&request, &client) {
        Ok(scopes) => scopes,
        Err(message) => {
            return oauth_error(
                StatusCode::BAD_REQUEST,
                "iam_oauth_authorize_invalid",
                &message,
            );
        }
    };

    match create_pending_authorization_state(pg, &client, &request, &scopes).await {
        Ok((_state_id, login_url)) => Redirect::temporary(&login_url).into_response(),
        Err(message) => oauth_error(
            StatusCode::INTERNAL_SERVER_ERROR,
            "iam_oauth_authorize_failed",
            &message,
        ),
    }
}

pub async fn handle_oauth_token(
    State(state): State<OpenIamState>,
    headers: HeaderMap,
    Json(body): Json<Value>,
) -> Response {
    let Ok(pg) = state.require_pool() else {
        return oauth_error(
            StatusCode::SERVICE_UNAVAILABLE,
            "iam_oauth_authorization_server_unavailable",
            "OAuth authorization server database is not configured",
        );
    };

    let grant_type = read_string(&body, &["grantType", "grant_type"])
        .unwrap_or_else(|| "authorization_code".to_string());

    let client_id = match read_string(&body, &["clientId", "client_id"]) {
        Some(value) => value,
        None => {
            return oauth_error(
                StatusCode::BAD_REQUEST,
                "iam_oauth_client_invalid",
                "client_id is required",
            );
        }
    };
    let tenant_id = read_string(&body, &["tenantId", "tenant_id"]);
    let client_secret = read_client_secret(&headers, &body);

    let client = match resolve_relying_party_client(pg, &client_id, tenant_id.as_deref()).await {
        Ok(client) => client,
        Err(message) => {
            return oauth_error(
                StatusCode::BAD_REQUEST,
                "iam_oauth_client_invalid",
                &message,
            );
        }
    };

    if grant_type == "refresh_token" {
        let refresh_token = match read_string(&body, &["refreshToken", "refresh_token"]) {
            Some(value) => value,
            None => {
                return oauth_error(
                    StatusCode::BAD_REQUEST,
                    "iam_oauth_refresh_token_required",
                    "refresh_token is required",
                );
            }
        };
        match exchange_refresh_token(pg, &client, &refresh_token, client_secret.as_deref()).await {
            Ok(token_response) => return (StatusCode::OK, Json(token_response)).into_response(),
            Err(message) => {
                return oauth_error(
                    StatusCode::BAD_REQUEST,
                    "iam_oauth_token_refresh_failed",
                    &message,
                );
            }
        }
    }

    if grant_type != "authorization_code" {
        return oauth_error(
            StatusCode::BAD_REQUEST,
            "iam_oauth_token_grant_unsupported",
            "Only authorization_code and refresh_token grant_type values are supported",
        );
    }

    let code = match read_string(&body, &["code"]) {
        Some(value) => value,
        None => {
            return oauth_error(
                StatusCode::BAD_REQUEST,
                "iam_oauth_code_required",
                "code is required",
            );
        }
    };
    let redirect_uri = match read_string(&body, &["redirectUri", "redirect_uri"]) {
        Some(value) => value,
        None => {
            return oauth_error(
                StatusCode::BAD_REQUEST,
                "iam_oauth_redirect_uri_required",
                "redirect_uri is required",
            );
        }
    };
    let code_verifier = read_string(&body, &["codeVerifier", "code_verifier"]);

    match exchange_authorization_code(
        pg,
        &client,
        &code,
        &redirect_uri,
        code_verifier.as_deref(),
        client_secret.as_deref(),
    )
    .await
    {
        Ok(token_response) => (StatusCode::OK, Json(token_response)).into_response(),
        Err(message) => oauth_error(
            StatusCode::BAD_REQUEST,
            "iam_oauth_token_exchange_failed",
            &message,
        ),
    }
}

pub async fn retrieve_oauth_jwks() -> Json<Value> {
    Json(build_oauth_jwks_document())
}

pub async fn handle_oauth_revoke(
    State(state): State<OpenIamState>,
    headers: HeaderMap,
    Json(body): Json<Value>,
) -> Response {
    let Ok(pg) = state.require_pool() else {
        return oauth_error(
            StatusCode::SERVICE_UNAVAILABLE,
            "iam_oauth_authorization_server_unavailable",
            "OAuth authorization server database is not configured",
        );
    };

    let token = match read_string(&body, &["token"]) {
        Some(value) => value,
        None => {
            return oauth_error(
                StatusCode::BAD_REQUEST,
                "iam_oauth_token_required",
                "token is required",
            );
        }
    };
    let client_id = read_string(&body, &["clientId", "client_id"]);
    let tenant_id = read_string(&body, &["tenantId", "tenant_id"]);
    let client_secret = read_client_secret(&headers, &body);

    match revoke_oauth_token(
        pg,
        &token,
        client_id.as_deref(),
        tenant_id.as_deref(),
        client_secret.as_deref(),
    )
    .await
    {
        Ok(()) => StatusCode::OK.into_response(),
        Err(message) => oauth_error(StatusCode::BAD_REQUEST, "iam_oauth_revoke_failed", &message),
    }
}

pub async fn handle_oauth_introspect(
    State(state): State<OpenIamState>,
    headers: HeaderMap,
    Json(body): Json<Value>,
) -> Response {
    let Ok(pg) = state.require_pool() else {
        return oauth_error(
            StatusCode::SERVICE_UNAVAILABLE,
            "iam_oauth_authorization_server_unavailable",
            "OAuth authorization server database is not configured",
        );
    };

    let token = match read_string(&body, &["token"]) {
        Some(value) => value,
        None => {
            return oauth_error(
                StatusCode::BAD_REQUEST,
                "iam_oauth_token_required",
                "token is required",
            );
        }
    };
    let client_id = read_string(&body, &["clientId", "client_id"]);
    let tenant_id = read_string(&body, &["tenantId", "tenant_id"]);
    let client_secret = read_client_secret(&headers, &body);

    match introspect_oauth_token(
        pg,
        &token,
        client_id.as_deref(),
        tenant_id.as_deref(),
        client_secret.as_deref(),
    )
    .await
    {
        Ok(claims) => (StatusCode::OK, Json(claims)).into_response(),
        Err(message) => oauth_error(
            StatusCode::BAD_REQUEST,
            "iam_oauth_introspect_failed",
            &message,
        ),
    }
}

pub async fn handle_oauth_userinfo(
    State(state): State<OpenIamState>,
    headers: HeaderMap,
) -> Response {
    let Ok(pg) = state.require_pool() else {
        return oauth_error(
            StatusCode::SERVICE_UNAVAILABLE,
            "iam_oauth_authorization_server_unavailable",
            "OAuth authorization server database is not configured",
        );
    };

    let bearer = headers
        .get(header::AUTHORIZATION)
        .and_then(|value| value.to_str().ok())
        .unwrap_or_default();

    let Some(context) = resolve_iam_app_context_from_oauth_bearer(pg, bearer).await else {
        return oauth_error(
            StatusCode::UNAUTHORIZED,
            "iam_oauth_userinfo_unauthorized",
            "OAuth bearer token is invalid",
        );
    };

    let scopes = load_oauth_bearer_scopes(pg, bearer).await;
    match build_userinfo_claims(pg, &context, &scopes).await {
        Ok(claims) => (StatusCode::OK, Json(claims)).into_response(),
        Err(message) => oauth_error(
            StatusCode::INTERNAL_SERVER_ERROR,
            "iam_oauth_userinfo_failed",
            &message,
        ),
    }
}

fn parse_authorize_request(query: &HashMap<String, String>) -> Result<AuthorizeRequest, String> {
    Ok(AuthorizeRequest {
        client_id: read_query(query, "client_id")?,
        redirect_uri: read_query(query, "redirect_uri")?,
        response_type: read_query(query, "response_type")?,
        scope: read_query(query, "scope").unwrap_or_else(|_| "openid".to_string()),
        state: query.get("state").cloned(),
        code_challenge: query.get("code_challenge").cloned(),
        code_challenge_method: query.get("code_challenge_method").cloned(),
        tenant_id: query.get("tenant_id").cloned(),
    })
}

fn read_query(query: &HashMap<String, String>, key: &str) -> Result<String, String> {
    query
        .get(key)
        .map(|value| value.trim().to_string())
        .filter(|value| !crate::is_blank(Some(value.as_str())))
        .ok_or_else(|| format!("{key} is required"))
}

fn read_string(body: &Value, keys: &[&str]) -> Option<String> {
    keys.iter().find_map(|key| {
        body.get(*key)
            .and_then(Value::as_str)
            .map(str::trim)
            .filter(|value| !crate::is_blank(Some(value)))
            .map(str::to_owned)
    })
}

fn read_client_secret(headers: &HeaderMap, body: &Value) -> Option<String> {
    if let Some(value) = read_string(body, &["clientSecret", "client_secret"]) {
        return Some(value);
    }
    headers
        .get(header::AUTHORIZATION)
        .and_then(|value| value.to_str().ok())
        .and_then(|value| value.strip_prefix("Basic "))
        .and_then(|encoded| {
            base64_decode(encoded).ok().and_then(|decoded| {
                decoded
                    .split_once(':')
                    .map(|(_, secret)| secret.to_string())
            })
        })
}

fn base64_decode(input: &str) -> Result<String, String> {
    use base64::{engine::general_purpose::STANDARD, Engine as _};
    let bytes = STANDARD
        .decode(input)
        .map_err(|error| format!("basic auth decode failed: {error}"))?;
    String::from_utf8(bytes).map_err(|error| format!("basic auth utf8 failed: {error}"))
}

fn oauth_error(status: StatusCode, code: &str, message: &str) -> Response {
    (
        status,
        Json(json!({
            "code": code,
            "data": Value::Null,
            "message": message,
        })),
    )
        .into_response()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn openid_configuration_uses_configured_issuer() {
        std::env::set_var("SDKWORK_IAM_OAUTH_ISSUER", "https://iam.example.com");
        let doc = build_openid_configuration_document();
        assert_eq!(doc["issuer"], json!("https://iam.example.com"));
        std::env::remove_var("SDKWORK_IAM_OAUTH_ISSUER");
    }
}
