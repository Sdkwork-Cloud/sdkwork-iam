use axum::body::{to_bytes, Body};
use axum::http::{Request, StatusCode};
use sdkwork_api_iam_standalone_gateway::build_standalone_runtime;
use sdkwork_web_contract::{route_inventory_from_openapi, route_inventory_from_routes};
use tokio::io::{AsyncReadExt, AsyncWriteExt};
use tower::ServiceExt;

#[tokio::test]
async fn runtime_http_openapi_matches_bound_manifest() {
    let previous_app_root = std::env::var_os("SDKWORK_APP_ROOT");
    std::env::set_var(
        "SDKWORK_APP_ROOT",
        std::path::Path::new(env!("CARGO_MANIFEST_DIR"))
            .join("../sdkwork-api-iam-assembly/tests/fixtures/embedded-application"),
    );
    let runtime = build_standalone_runtime().await;
    match previous_app_root {
        Some(value) => std::env::set_var("SDKWORK_APP_ROOT", value),
        None => std::env::remove_var("SDKWORK_APP_ROOT"),
    }
    let runtime = runtime.expect("build IAM standalone runtime");
    let expected = route_inventory_from_routes(runtime.route_manifest.routes());
    assert!(
        !expected.is_empty(),
        "IAM standalone manifest must serve routes"
    );

    let health = runtime
        .router
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

    let ready = runtime
        .router
        .clone()
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

    let listener = tokio::net::TcpListener::bind("127.0.0.1:0")
        .await
        .expect("bind runtime probe listener");
    let address = listener.local_addr().expect("runtime probe address");
    let server = tokio::spawn(async move {
        axum::serve(listener, runtime.router)
            .await
            .expect("serve IAM runtime probe")
    });

    let mut stream = tokio::net::TcpStream::connect(address)
        .await
        .expect("connect to IAM runtime probe");
    stream
        .write_all(
            format!("GET /openapi.json HTTP/1.1\r\nHost: {address}\r\nConnection: close\r\n\r\n")
                .as_bytes(),
        )
        .await
        .expect("write runtime OpenAPI request");
    let mut response = Vec::new();
    stream
        .read_to_end(&mut response)
        .await
        .expect("read runtime OpenAPI response");
    server.abort();

    let separator = response
        .windows(4)
        .position(|window| window == b"\r\n\r\n")
        .expect("HTTP response header separator");
    let headers = String::from_utf8_lossy(&response[..separator]);
    assert!(
        headers.starts_with("HTTP/1.1 200"),
        "runtime OpenAPI request failed: {headers}"
    );
    let served: serde_json::Value =
        serde_json::from_slice(&response[separator + 4..]).expect("runtime OpenAPI JSON response");

    assert_eq!(
        route_inventory_from_openapi(&served).expect("served OpenAPI inventory"),
        expected
    );
}
