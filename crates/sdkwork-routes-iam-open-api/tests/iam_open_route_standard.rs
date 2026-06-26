use axum::body::Body;
use axum::http::{Method, Request, StatusCode};
use http_body_util::BodyExt;
use sdkwork_routes_iam_open_api::{
    build_sdkwork_iam_open_api_router, open_routes, HttpMethod, HttpRoute,
};
use sdkwork_iam_web_adapter::build_openid_configuration_document;
use serde_json::Value;
use tower::ServiceExt;

#[test]
fn exposes_surface_named_rust_integration_entrypoints() {
    let _open_api_router = build_sdkwork_iam_open_api_router();

    assert!(
        !open_routes().is_empty(),
        "sdkwork-iam-open-api must expose OAuth provider and authorization-server ingress metadata",
    );
}

#[test]
fn open_routes_expose_oauth_provider_and_authorization_server_ingress() {
    let routes = open_routes();

    for route in [
        HttpRoute::public(
            HttpMethod::Get,
            "/.well-known/openid-configuration",
            "iam.oauth",
            "iam.oauth.wellKnown.openidConfiguration.retrieve",
        ),
        HttpRoute::public(
            HttpMethod::Get,
            "/.well-known/oauth-authorization-server",
            "iam.oauth",
            "iam.oauth.wellKnown.authorizationServerMetadata.retrieve",
        ),
        HttpRoute::public(
            HttpMethod::Get,
            "/iam/v3/api/system/oauth/openid_configuration",
            "iam.oauth",
            "iam.oauth.openidConfiguration.retrieve",
        ),
        HttpRoute::public(
            HttpMethod::Get,
            "/iam/v3/api/oauth/authorize",
            "iam.oauth",
            "iam.oauth.authorize.handleGet",
        ),
        HttpRoute::public(
            HttpMethod::Post,
            "/iam/v3/api/oauth/token",
            "iam.oauth",
            "iam.oauth.token.create",
        ),
        HttpRoute::public(
            HttpMethod::Post,
            "/iam/v3/api/oauth/revoke",
            "iam.oauth",
            "iam.oauth.revoke.create",
        ),
        HttpRoute::public(
            HttpMethod::Post,
            "/iam/v3/api/oauth/introspect",
            "iam.oauth",
            "iam.oauth.introspect.create",
        ),
        HttpRoute::public(
            HttpMethod::Get,
            "/iam/v3/api/oauth/jwks",
            "iam.oauth",
            "iam.oauth.jwks.retrieve",
        ),
        HttpRoute::open_api_flexible(
            HttpMethod::Get,
            "/iam/v3/api/oauth/userinfo",
            "iam.oauth",
            "iam.oauth.userinfo.retrieve",
        ),
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
            "missing OAuth open-api route: {route:?}",
        );
    }
}

#[test]
fn openid_configuration_document_matches_manifest_issuer() {
    let doc = build_openid_configuration_document();
    assert_eq!(
        doc.get("authorization_endpoint").and_then(Value::as_str),
        Some("https://iam.sdkwork.local/iam/v3/oauth/authorize")
    );
}

#[tokio::test]
async fn open_router_accepts_dev_inline_oauth_bearer_before_handler() {
    std::env::set_var("SDKWORK_ENV", "dev");
    let router = build_sdkwork_iam_open_api_router();
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
    std::env::remove_var("SDKWORK_ENV");
}

#[tokio::test]
async fn open_router_serves_oidc_discovery_without_database() {
    let router = build_sdkwork_iam_open_api_router();
    let response = router
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/iam/v3/api/system/oauth/openid_configuration")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(StatusCode::OK, response.status());
    let body = response.into_body().collect().await.unwrap().to_bytes();
    let payload: Value = serde_json::from_slice(&body).expect("json");
    assert!(payload.get("token_endpoint").is_some());
}

#[tokio::test]
async fn open_router_serves_well_known_oidc_discovery_without_database() {
    let router = build_sdkwork_iam_open_api_router();
    let response = router
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/.well-known/openid-configuration")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(StatusCode::OK, response.status());
    let body = response.into_body().collect().await.unwrap().to_bytes();
    let payload: Value = serde_json::from_slice(&body).expect("json");
    assert_eq!(
        payload.get("authorization_endpoint").and_then(Value::as_str),
        Some("https://iam.sdkwork.local/iam/v3/oauth/authorize")
    );
}
