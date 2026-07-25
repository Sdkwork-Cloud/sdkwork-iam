use sdkwork_api_iam_standalone_gateway::build_standalone_runtime;
use sdkwork_web_contract::{route_inventory_from_openapi, route_inventory_from_routes};
use tokio::io::{AsyncReadExt, AsyncWriteExt};

#[tokio::test]
async fn runtime_http_openapi_matches_bound_manifest() {
    let runtime = build_standalone_runtime()
        .await
        .expect("build IAM standalone runtime");
    let expected = route_inventory_from_routes(runtime.route_manifest.routes());
    assert!(
        !expected.is_empty(),
        "IAM standalone manifest must serve routes"
    );

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
