//! Infrastructure route smoke tests for IAM gateway assembly.

use axum::body::{to_bytes, Body};
use axum::http::{Request, StatusCode};
use axum::Router;
use sdkwork_web_bootstrap::{assemble_multi_surface_router, ServiceRouterConfig};
use tower::ServiceExt;

#[tokio::test]
async fn assemble_multi_surface_router_mounts_healthz_and_readyz() {
    let router = assemble_multi_surface_router(
        [Router::new()],
        ServiceRouterConfig::default().with_always_ready(),
    );

    let health = router
        .clone()
        .oneshot(Request::get("/healthz").body(Body::empty()).unwrap())
        .await
        .expect("healthz request");
    assert_eq!(health.status(), StatusCode::OK);
    let health_body = to_bytes(health.into_body(), usize::MAX)
        .await
        .expect("healthz body");
    assert!(health_body
        .as_ref()
        .windows(b"\"status\":\"ok\"".len())
        .any(|window| window == b"\"status\":\"ok\""));

    let ready = router
        .oneshot(Request::get("/readyz").body(Body::empty()).unwrap())
        .await
        .expect("readyz request");
    assert_eq!(ready.status(), StatusCode::OK);
    let ready_body = to_bytes(ready.into_body(), usize::MAX)
        .await
        .expect("readyz body");
    assert!(ready_body
        .as_ref()
        .windows(b"\"status\":\"ready\"".len())
        .any(|window| window == b"\"status\":\"ready\""));
}
