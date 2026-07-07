//! Business-only assembly export for consumer embedding.

use axum::body::Body;
use axum::http::{Request, StatusCode};
use sdkwork_iam_gateway_assembly::assemble_application_business_router;
use tower::ServiceExt;

#[tokio::test]
async fn business_router_exposes_iam_backend_routes_without_infra_routes() {
    let backend = sdkwork_routes_iam_backend_api::gateway_mount().await;

    let users = backend
        .clone()
        .oneshot(
            Request::builder()
                .method("GET")
                .uri("/backend/v3/api/iam/users")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("backend users route");
    assert_ne!(
        users.status(),
        StatusCode::NOT_FOUND,
        "backend gateway_mount must register directory admin routes"
    );
}

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
