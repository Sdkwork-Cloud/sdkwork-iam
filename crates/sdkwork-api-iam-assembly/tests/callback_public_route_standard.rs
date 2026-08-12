//! External callback auth regression tests through the composed IAM gateway.
//!
//! PSP-style callbacks (WeChat Pay OAuth redirect, QR/device OAuth) arrive in
//! the browser WITHOUT platform credentials — they must never require
//! dual-token or login. This composes the real framework (IAM resolver +
//! web framework + route manifest) and proves the callback endpoints are
//! anonymous while session-bound entry points stay protected.

use axum::body::Body;
use axum::http::{Request, StatusCode};
use sdkwork_api_iam_assembly::assemble_owner_api_surfaces;
use sdkwork_iam_web_adapter::{build_web_framework_builder, IamWebRequestContextResolver};
use sdkwork_web_bootstrap::{ComposedApiAssembly, HostedApiAssembly};
use tower::ServiceExt;

/// The owner-surface bootstrap touches the process env and the IAM database;
/// build the composed gateway once per test process so parallel tests never
/// race the bootstrap (or each other's Tokio runtimes).
static COMPOSED_GATEWAY: tokio::sync::OnceCell<axum::Router> = tokio::sync::OnceCell::const_new();

async fn composed_iam_gateway_router() -> axum::Router {
    COMPOSED_GATEWAY
        .get_or_init(|| async {
            // The IAM adapter resolves the web environment from process env
            // and applies production defaults when unset; the test pins Dev so
            // the assembly builds without a production audit emitter.
            std::env::set_var("SDKWORK_ENVIRONMENT", "dev");
            let previous_app_root = std::env::var_os("SDKWORK_APP_ROOT");
            std::env::set_var(
                "SDKWORK_APP_ROOT",
                std::path::Path::new(env!("CARGO_MANIFEST_DIR"))
                    .join("tests/fixtures/embedded-application"),
            );
            let assembly = assemble_owner_api_surfaces()
                .await
                .expect("assemble IAM owner surfaces");
            match previous_app_root {
                Some(value) => std::env::set_var("SDKWORK_APP_ROOT", value),
                None => std::env::remove_var("SDKWORK_APP_ROOT"),
            }
            let manifest = assembly.route_manifest.clone();
            let framework = build_web_framework_builder(
                IamWebRequestContextResolver::from_database_pool(None),
                manifest,
                Vec::new(),
            );
            let hosted: HostedApiAssembly =
                ComposedApiAssembly::try_compose("SDKWork IAM Test API", vec![assembly])
                    .expect("assembly must compose")
                    .into_hosted(framework);
            hosted.router
        })
        .await
        .clone()
}

#[tokio::test]
async fn wechat_payment_oauth_callback_is_anonymous_without_dual_token_or_login() {
    let app = composed_iam_gateway_router().await;
    // WeChat redirects the payer browser here with `code` + `state` only.
    // Auth must pass (no 401/403); the handler then rejects the bogus code
    // with a 4xx application error, which proves the framework let it through.
    let response = app
        .oneshot(
            Request::builder()
                .method("GET")
                .uri("/app/v3/api/oauth/wechat/payment/callback?code=test-code&state=test-state")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("wechat payment callback must not be blocked by the framework");
    assert_ne!(
        response.status(),
        StatusCode::UNAUTHORIZED,
        "WeChat payment OAuth callback must not require platform login or dual tokens"
    );
    assert_ne!(
        response.status(),
        StatusCode::FORBIDDEN,
        "WeChat payment OAuth callback must not require platform login or dual tokens"
    );
}

#[tokio::test]
async fn wechat_payment_oauth_start_keeps_requiring_dual_token() {
    let app = composed_iam_gateway_router().await;
    let response = app
        .oneshot(
            Request::builder()
                .method("GET")
                .uri("/app/v3/api/oauth/wechat/payment/start")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("start request must reach the framework");
    assert_eq!(
        response.status(),
        StatusCode::UNAUTHORIZED,
        "the payment OAuth start entry runs in the logged-in cashier session and must keep dual-token auth"
    );
}

#[tokio::test]
async fn qr_device_oauth_public_routes_stay_anonymous() {
    let app = composed_iam_gateway_router().await;
    let response = app
        .oneshot(
            Request::builder()
                .method("POST")
                .uri("/app/v3/api/oauth/device_authorizations")
                .header("content-type", "application/json")
                .body(Body::from("{}"))
                .unwrap(),
        )
        .await
        .expect("device authorization must not be blocked by the framework");
    assert_ne!(response.status(), StatusCode::UNAUTHORIZED);
    assert_ne!(response.status(), StatusCode::FORBIDDEN);
}
