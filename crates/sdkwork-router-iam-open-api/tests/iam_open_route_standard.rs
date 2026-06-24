use axum::body::Body;
use axum::http::{Method, Request, StatusCode};
use http_body_util::BodyExt;
use sdkwork_router_iam_open_api::{
    build_sdkwork_appbase_open_api_router, open_routes, HttpMethod, HttpRoute,
};
use serde_json::Value;
use tower::ServiceExt;

#[test]
fn exposes_surface_named_rust_integration_entrypoints() {
    let _open_api_router = build_sdkwork_appbase_open_api_router();

    assert!(
        !open_routes().is_empty(),
        "sdkwork-appbase-open-api must expose OAuth provider callback ingress metadata",
    );
}

#[test]
fn open_routes_expose_oauth_provider_callback_ingress_only() {
    let routes = open_routes();

    for route in [
        HttpRoute::open_api_flexible(
            HttpMethod::Get,
            "/iam/v3/api/oauth/provider_callbacks/{callbackPublicId}",
            "iam.oauth",
            "iam.oauth.providerCallbacks.handleGet",
        ),
        HttpRoute::open_api_flexible(
            HttpMethod::Post,
            "/iam/v3/api/oauth/provider_callbacks/{callbackPublicId}",
            "iam.oauth",
            "iam.oauth.providerCallbacks.handlePost",
        ),
    ] {
        assert!(
            routes.contains(&route),
            "missing OAuth provider ingress route: {route:?}",
        );
    }
    assert!(
        routes.iter().all(|route| route
            .path
            .starts_with("/iam/v3/api/oauth/provider_callbacks/")),
        "appbase IAM open-api must expose only provider callback ingress for OAuth",
    );
    assert!(
        routes
            .iter()
            .all(|route| !route.path.contains("/open_platform")),
        "provider ingress must not expose open_platform legacy paths",
    );
}

#[tokio::test]
async fn open_router_accepts_dev_inline_oauth_bearer_before_handler() {
    let router = build_sdkwork_appbase_open_api_router();
    let response = router
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/iam/v3/api/oauth/provider_callbacks/callback_test")
                .header(
                    "Authorization",
                    "Bearer token_id=tok-1;tenant_id=tenant-oauth;user_id=user-oauth;app_id=appbase",
                )
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(
        StatusCode::SERVICE_UNAVAILABLE,
        response.status(),
        "OAuth-authenticated open-api request should reach handler fail-closed response"
    );
}

#[tokio::test]
async fn open_router_from_env_bootstrap_applies_open_api_auth_before_handler() {
    use sdkwork_router_iam_open_api::build_sdkwork_appbase_open_api_router_from_env;

    let router = build_sdkwork_appbase_open_api_router_from_env().await;

    let unauthenticated = router
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/iam/v3/api/oauth/provider_callbacks/callback_test")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(StatusCode::UNAUTHORIZED, unauthenticated.status());

    let authenticated = router
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/iam/v3/api/oauth/provider_callbacks/callback_test")
                .header(
                    "x-api-key",
                    "api_key_id=key-1;tenant_id=tenant-1;user_id=user-1;app_id=appbase",
                )
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert!(
        authenticated.status() == StatusCode::SERVICE_UNAVAILABLE
            || authenticated.status() == StatusCode::UNAUTHORIZED,
        "authenticated open-api request must pass auth layer before handler: {}",
        authenticated.status()
    );
}

#[tokio::test]
async fn open_router_accepts_dev_inline_api_key_before_handler() {
    let router = build_sdkwork_appbase_open_api_router();
    let response = router
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/iam/v3/api/oauth/provider_callbacks/callback_test")
                .header(
                    "x-api-key",
                    "api_key_id=key-1;tenant_id=tenant-1;user_id=user-1;app_id=appbase",
                )
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(
        StatusCode::SERVICE_UNAVAILABLE,
        response.status(),
        "authenticated open-api request should reach handler fail-closed response"
    );
}

#[tokio::test]
async fn open_router_fails_closed_without_provider_callback_store() {
    let router = build_sdkwork_appbase_open_api_router();

    for (method, path, body) in [
        (
            Method::GET,
            "/iam/v3/api/oauth/provider_callbacks/callback_test",
            None,
        ),
        (
            Method::POST,
            "/iam/v3/api/oauth/provider_callbacks/callback_test",
            Some(r#"{"code":"oauth-code"}"#),
        ),
    ] {
        let (status, body_text, _payload) =
            request_open_route(router.clone(), method, path, body).await;

        assert_eq!(
            StatusCode::UNAUTHORIZED,
            status,
            "{path} must reject unauthenticated open-api ingress before handler logic: {body_text}"
        );
    }
}

async fn request_open_route(
    router: axum::Router,
    method: Method,
    path: &str,
    body: Option<&str>,
) -> (StatusCode, String, Value) {
    let response = router
        .oneshot(
            Request::builder()
                .method(method)
                .uri(path)
                .header("content-type", "application/json")
                .body(Body::from(body.unwrap_or_default().to_owned()))
                .unwrap(),
        )
        .await
        .unwrap();
    let status = response.status();
    let bytes = response.into_body().collect().await.unwrap().to_bytes();
    let body_text = String::from_utf8(bytes.to_vec()).unwrap();
    let payload = serde_json::from_str(&body_text).unwrap_or(Value::Null);
    (status, body_text, payload)
}
