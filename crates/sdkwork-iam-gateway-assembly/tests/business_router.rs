//! Business-only assembly export for consumer embedding.

use axum::body::Body;
use axum::http::{Request, StatusCode};
use sdkwork_iam_gateway_assembly::assemble_application_business_router;
use tower::ServiceExt;

#[tokio::test]
async fn business_router_exposes_iam_app_routes_without_infra_routes() {
    let app = assemble_application_business_router().await.router;

    let oauth = app
        .clone()
        .oneshot(
            Request::builder()
                .method("POST")
                .uri("/app/v3/api/oauth/device_authorizations")
                .header("content-type", "application/json")
                .body(Body::from("{}"))
                .unwrap(),
        )
        .await
        .expect("oauth route");
    assert_ne!(oauth.status(), StatusCode::NOT_FOUND);

    let health = app
        .oneshot(Request::get("/healthz").body(Body::empty()).unwrap())
        .await
        .expect("healthz route");
    assert_ne!(
        health.status(),
        StatusCode::OK,
        "business-only assembly must not mount /healthz"
    );
}
