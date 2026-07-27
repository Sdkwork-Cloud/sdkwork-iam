//! Business-only assembly export for consumer embedding.

use axum::body::Body;
use axum::http::{Request, StatusCode};
use sdkwork_api_iam_assembly::assemble_owner_api_surfaces;
use tower::ServiceExt;

#[tokio::test]
async fn business_router_exposes_iam_owner_routes_without_infra_routes() {
    let previous_app_root = std::env::var_os("SDKWORK_APP_ROOT");
    std::env::set_var(
        "SDKWORK_APP_ROOT",
        std::path::Path::new(env!("CARGO_MANIFEST_DIR"))
            .join("tests/fixtures/embedded-application"),
    );
    let assembly = assemble_owner_api_surfaces().await;
    match previous_app_root {
        Some(value) => std::env::set_var("SDKWORK_APP_ROOT", value),
        None => std::env::remove_var("SDKWORK_APP_ROOT"),
    }
    let app = assembly.expect("assemble IAM owner surfaces").router;

    let users = app
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
        "owner assembly must register directory admin routes"
    );

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
