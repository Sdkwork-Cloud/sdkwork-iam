//! WeChat payment-scoped lightweight OAuth flow.
//!
//! The H5 cashier needs the payer's WeChat `openid` to run JSAPI payment
//! inside the WeChat app. This flow performs a silent `snsapi_base`
//! authorization (`code` → `openid`) without creating an IAM session or
//! linking an OAuth identity — unlike the full login OAuth flow.
//!
//! Flow:
//!   1. `GET /app/v3/api/oauth/wechat/payment/start?redirect=...`
//!      (authenticated) returns the WeChat authorize URL and stores
//!      state/redirect/tenant in short-lived HttpOnly cookies.
//!   2. WeChat redirects the payer to
//!      `GET /app/v3/api/oauth/wechat/payment/callback?code=...&state=...`;
//!      after CSRF state verification the code is exchanged for the
//!      payer's openid and the payer is redirected back to the cashier
//!      URL with `openid` appended (the cashier runs on a hash router, so
//!      the parameter lands in the hash-internal query).

use axum::{
    extract::{Query, State},
    http::{header, HeaderMap, HeaderValue, StatusCode},
    response::{IntoResponse, Response},
};
use serde_json::json;
use std::collections::HashMap;

use sdkwork_iam_web_adapter::{
    builtin_authorization_endpoint, exchange_oauth_authorization_code,
    load_oauth_integration_exchange_context_for_app,
};
use sdkwork_web_core::WebRequestContext;

use crate::{
    handlers::postgres_pool_or_error,
    responses::{appbase_error, appbase_ok, iam_session_required_error},
    state::LocalIamState,
    tokens::{generate_opaque_token, resolve_session_from_context},
};

/// Cookie path is scoped to the payment OAuth endpoints only.
const PAYMENT_OAUTH_COOKIE_PATH: &str = "/app/v3/api/oauth/wechat/payment";
const STATE_COOKIE: &str = "sdkwork_wpoauth_state";
const REDIRECT_COOKIE: &str = "sdkwork_wpoauth_redirect";
const TENANT_COOKIE: &str = "sdkwork_wpoauth_tenant";
const STATE_TTL_SECONDS: i64 = 10 * 60;
/// Silent authorization scope: only the openid is returned, no consent page.
const WECHAT_PAYMENT_SCOPE: &str = "snsapi_base";
const MAX_REDIRECT_LENGTH: usize = 512;

/// Starts the WeChat payment OAuth flow for the signed-in user.
///
/// The `redirect` parameter must be a relative path (the cashier route);
/// it is stored in an HttpOnly cookie together with the CSRF state and the
/// tenant id so the unauthenticated callback can restore them.
pub(crate) async fn start_wechat_payment_oauth(
    State(state): State<LocalIamState>,
    ctx: WebRequestContext,
    headers: HeaderMap,
    Query(query): Query<HashMap<String, String>>,
) -> Response {
    let pg = match postgres_pool_or_error(&state) {
        Ok(pg) => pg,
        Err(response) => return response,
    };
    let session = match resolve_session_from_context(pg, &ctx).await {
        Some(session) => session,
        None => return iam_session_required_error(),
    };
    let redirect = match query
        .get("redirect")
        .map(String::as_str)
        .and_then(|value| normalize_payment_oauth_redirect(value).ok())
    {
        Some(redirect) => redirect,
        None => {
            return appbase_error(
                StatusCode::BAD_REQUEST,
                "iam_wechat_payment_oauth_redirect_invalid",
                "wechat payment oauth redirect must be a non-empty relative path",
            );
        }
    };
    let provider_ctx = match load_oauth_integration_exchange_context_for_app(
        pg,
        &session.user.tenant_id,
        "wechat",
        Some(&session.context.app_id),
        None,
    )
    .await
    {
        Ok(Some(ctx)) => ctx,
        Ok(None) => {
            return appbase_error(
                StatusCode::SERVICE_UNAVAILABLE,
                "iam_wechat_payment_oauth_not_configured",
                "WeChat OAuth is not configured for this tenant",
            );
        }
        Err(error) => {
            return appbase_error(
                StatusCode::SERVICE_UNAVAILABLE,
                "iam_wechat_payment_oauth_lookup_failed",
                &error,
            );
        }
    };
    let state = generate_opaque_token("wpoauth");
    let callback_url = payment_oauth_callback_url(&headers);
    let authorize_url = build_wechat_authorize_url(
        &provider_ctx.provider_client_id,
        &callback_url,
        &state,
    );

    let mut response = appbase_ok(json!({
        "authorizeUrl": authorize_url,
        "state": state,
        "redirectUri": callback_url,
    }));
    append_payment_oauth_cookie(&mut response, STATE_COOKIE, &state, STATE_TTL_SECONDS);
    append_payment_oauth_cookie(&mut response, REDIRECT_COOKIE, &redirect, STATE_TTL_SECONDS);
    append_payment_oauth_cookie(
        &mut response,
        TENANT_COOKIE,
        &session.user.tenant_id,
        STATE_TTL_SECONDS,
    );
    response
}

/// Handles the WeChat authorize redirect: verifies the CSRF state,
/// exchanges the code for the payer's openid and redirects the payer back
/// to the cashier URL with `openid` appended.
pub(crate) async fn handle_wechat_payment_oauth_callback(
    State(state): State<LocalIamState>,
    headers: HeaderMap,
    Query(query): Query<HashMap<String, String>>,
) -> Response {
    let pg = match postgres_pool_or_error(&state) {
        Ok(pg) => pg,
        Err(response) => return response,
    };
    let code = match query
        .get("code")
        .map(String::as_str)
        .map(str::trim)
        .filter(|value| !value.is_empty())
    {
        Some(code) => code.to_owned(),
        None => {
            return appbase_error(
                StatusCode::BAD_REQUEST,
                "iam_wechat_payment_oauth_code_required",
                "WeChat payment authorization code is required",
            );
        }
    };
    let state_param = match query
        .get("state")
        .map(String::as_str)
        .map(str::trim)
        .filter(|value| !value.is_empty())
    {
        Some(state) => state.to_owned(),
        None => {
            return appbase_error(
                StatusCode::BAD_REQUEST,
                "iam_wechat_payment_oauth_state_required",
                "WeChat payment authorization state is required",
            );
        }
    };
    let Some(redirect) = read_payment_oauth_cookie(&headers, REDIRECT_COOKIE) else {
        return appbase_error(
            StatusCode::BAD_REQUEST,
            "iam_wechat_payment_oauth_context_missing",
            "WeChat payment oauth context cookie is missing or expired",
        );
    };
    let cookie_state = read_payment_oauth_cookie(&headers, STATE_COOKIE);
    if cookie_state.as_deref() != Some(state_param.as_str()) {
        return payment_oauth_redirect_response(&redirect, "error", "invalid_state");
    }
    let tenant_id = match read_payment_oauth_cookie(&headers, TENANT_COOKIE) {
        Some(tenant_id) if !tenant_id.is_empty() => tenant_id,
        _ => return payment_oauth_redirect_response(&redirect, "error", "context_missing"),
    };
    let callback_url = payment_oauth_callback_url(&headers);
    let provider_ctx = match load_oauth_integration_exchange_context_for_app(
        pg,
        &tenant_id,
        "wechat",
        None,
        None,
    )
    .await
    {
        Ok(Some(ctx)) => ctx,
        Ok(None) => {
            return payment_oauth_redirect_response(&redirect, "error", "not_configured");
        }
        Err(_) => return payment_oauth_redirect_response(&redirect, "error", "lookup_failed"),
    };
    let profile = match exchange_oauth_authorization_code(&provider_ctx, &code, &callback_url, None)
        .await
    {
        Ok(profile) => profile,
        Err(_) => {
            return payment_oauth_redirect_response(&redirect, "error", "exchange_failed");
        }
    };
    payment_oauth_redirect_response(&redirect, "openid", &profile.subject)
}

/// Builds the WeChat web authorization URL with silent `snsapi_base` scope.
fn build_wechat_authorize_url(app_id: &str, redirect_uri: &str, state: &str) -> String {
    let endpoint = builtin_authorization_endpoint("wechat")
        .expect("builtin wechat authorization endpoint");
    format!(
        "{endpoint}?appid={}&redirect_uri={}&response_type=code&scope={}&state={}#wechat_redirect",
        percent_encode_component(app_id),
        percent_encode_component(redirect_uri),
        WECHAT_PAYMENT_SCOPE,
        percent_encode_component(state),
    )
}

/// Derives the payment OAuth callback URL from the request host. The host
/// must match the WeChat official-account authorized web domain
/// (domain-level configuration; the path is free-form).
fn payment_oauth_callback_url(headers: &HeaderMap) -> String {
    let host = headers
        .get("x-forwarded-host")
        .and_then(|value| value.to_str().ok())
        .filter(|value| is_safe_host(value))
        .or_else(|| {
            headers
                .get(header::HOST)
                .and_then(|value| value.to_str().ok())
                .filter(|value| is_safe_host(value))
        })
        .unwrap_or("localhost");
    format!("https://{host}{PAYMENT_OAUTH_COOKIE_PATH}/callback")
}

/// Host values must be a plain `host[:port]` pair — no path, credentials
/// or whitespace — so they cannot smuggle an external target into the
/// authorize redirect_uri.
fn is_safe_host(value: &str) -> bool {
    let value = value.trim();
    !value.is_empty()
        && value.len() <= 253
        && !value.contains('/')
        && !value.contains('@')
        && !value.contains(char::is_whitespace)
}

/// Redirect paths must be relative so the OAuth callback cannot be used as
/// an open redirector.
fn normalize_payment_oauth_redirect(value: &str) -> Result<String, &'static str> {
    let trimmed = value.trim();
    if trimmed.is_empty() || trimmed.len() > MAX_REDIRECT_LENGTH {
        return Err("redirect must be a non-empty relative path");
    }
    if !trimmed.starts_with('/') || trimmed.starts_with("//") || trimmed.contains("://") {
        return Err("redirect must be a relative path");
    }
    if trimmed.contains(['\r', '\n', '\t']) {
        return Err("redirect must not contain control characters");
    }
    Ok(trimmed.to_owned())
}

/// Appends a query component to a location string, honoring an existing
/// query (hash-router locations keep their `#` intact).
fn append_query_component(location: &str, key: &str, value: &str) -> String {
    let separator = if location.contains('?') { '&' } else { '?' };
    format!(
        "{location}{separator}{key}={}",
        percent_encode_component(value)
    )
}

/// Percent-encodes a value for use as a single query component (RFC 3986
/// unreserved characters stay literal).
fn percent_encode_component(value: &str) -> String {
    let mut encoded = String::with_capacity(value.len());
    for byte in value.bytes() {
        match byte {
            b'A'..=b'Z' | b'a'..=b'z' | b'0'..=b'9' | b'-' | b'.' | b'_' | b'~' => {
                encoded.push(byte as char);
            }
            _ => encoded.push_str(&format!("%{byte:02X}")),
        }
    }
    encoded
}

fn payment_oauth_cookie(name: &str, value: &str, max_age: i64) -> String {
    format!(
        "{name}={value}; Path={PAYMENT_OAUTH_COOKIE_PATH}; Max-Age={max_age}; HttpOnly; SameSite=Lax"
    )
}

fn append_payment_oauth_cookie(
    response: &mut Response,
    name: &str,
    value: &str,
    max_age: i64,
) {
    response.headers_mut().append(
        header::SET_COOKIE,
        HeaderValue::from_str(&payment_oauth_cookie(name, value, max_age))
            .expect("payment oauth cookie header"),
    );
}

fn read_payment_oauth_cookie(headers: &HeaderMap, name: &str) -> Option<String> {
    let cookie_header = headers.get(header::COOKIE)?.to_str().ok()?;
    for pair in cookie_header.split(';') {
        let pair = pair.trim();
        if let Some((key, value)) = pair.split_once('=') {
            if key.trim() == name {
                return Some(value.trim().to_string());
            }
        }
    }
    None
}

/// 302 back to the cashier with the openid (or an `error` code) appended,
/// clearing the state cookies.
fn payment_oauth_redirect_response(location: &str, key: &str, value: &str) -> Response {
    let target = append_query_component(location, key, value);
    let mut response = (
        StatusCode::FOUND,
        [
            (header::LOCATION, target),
            (header::CACHE_CONTROL, "no-store".to_string()),
        ],
    )
        .into_response();
    for name in [STATE_COOKIE, REDIRECT_COOKIE, TENANT_COOKIE] {
        append_payment_oauth_cookie(&mut response, name, "", 0);
    }
    response
}

#[cfg(test)]
mod tests {
    use super::{
        append_query_component, build_wechat_authorize_url, is_safe_host,
        normalize_payment_oauth_redirect, percent_encode_component, WECHAT_PAYMENT_SCOPE,
    };

    #[test]
    fn normalize_redirect_accepts_relative_paths() {
        assert_eq!(
            normalize_payment_oauth_redirect("/#/orders/123/cashier"),
            Ok("/#/orders/123/cashier".to_owned())
        );
        assert_eq!(
            normalize_payment_oauth_redirect("/orders/123/cashier?scene=recharge"),
            Ok("/orders/123/cashier?scene=recharge".to_owned())
        );
    }

    #[test]
    fn normalize_redirect_rejects_open_redirectors() {
        assert!(normalize_payment_oauth_redirect("https://evil.example").is_err());
        assert!(normalize_payment_oauth_redirect("//evil.example/path").is_err());
        assert!(normalize_payment_oauth_redirect("javascript:alert(1)").is_err());
        assert!(normalize_payment_oauth_redirect("").is_err());
        assert!(normalize_payment_oauth_redirect("   ").is_err());
        assert!(normalize_payment_oauth_redirect(&"a".repeat(600)).is_err());
    }

    #[test]
    fn append_query_honors_existing_query() {
        assert_eq!(
            append_query_component("/#/orders/1/cashier", "openid", "o_abc"),
            "/#/orders/1/cashier?openid=o_abc"
        );
        assert_eq!(
            append_query_component("/#/orders/1/cashier?scene=recharge", "openid", "o_abc"),
            "/#/orders/1/cashier?scene=recharge&openid=o_abc"
        );
    }

    #[test]
    fn percent_encoding_keeps_unreserved_characters() {
        assert_eq!(percent_encode_component("abc-._~123"), "abc-._~123");
        assert_eq!(percent_encode_component("https://im.sdkwork.com/cb"), "https%3A%2F%2Fim.sdkwork.com%2Fcb");
        assert_eq!(percent_encode_component("o_中文"), "o_%E4%B8%AD%E6%96%87");
    }

    #[test]
    fn authorize_url_uses_snsapi_base_scope_and_wechat_redirect_fragment() {
        let url = build_wechat_authorize_url("wxappid", "https://im.sdkwork.com/cb", "state1");
        assert!(url.starts_with("https://open.weixin.qq.com/connect/oauth2/authorize?"));
        assert!(url.contains("appid=wxappid"));
        assert!(url.contains("redirect_uri=https%3A%2F%2Fim.sdkwork.com%2Fcb"));
        assert!(url.contains("response_type=code"));
        assert!(url.contains(&format!("scope={}", WECHAT_PAYMENT_SCOPE)));
        assert!(url.contains("state=state1"));
        assert!(url.ends_with("#wechat_redirect"));
    }

    #[test]
    fn safe_host_rejects_paths_and_credentials() {
        assert!(is_safe_host("im.sdkwork.com"));
        assert!(is_safe_host("im.sdkwork.com:8443"));
        assert!(!is_safe_host("im.sdkwork.com/evil"));
        assert!(!is_safe_host("user@im.sdkwork.com"));
        assert!(!is_safe_host("im.sdkwork.com/path"));
        assert!(!is_safe_host(""));
    }
}
