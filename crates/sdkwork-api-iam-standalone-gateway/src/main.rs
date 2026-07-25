use sdkwork_api_iam_standalone_gateway::build_standalone_router;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    sdkwork_web_bootstrap::init_tracing_from_env();
    let bind_address = std::env::var("SDKWORK_IAM_APPLICATION_PUBLIC_INGRESS_BIND")
        .unwrap_or_else(|_| "127.0.0.1:8080".to_owned());
    let app = build_standalone_router().await.map_err(
        |error| -> Box<dyn std::error::Error + Send + Sync> {
            format!("IAM application bootstrap failed: {error}").into()
        },
    )?;
    let bind_address = bind_address.parse()?;
    println!("sdkwork-api-iam-standalone-gateway listening on http://{bind_address}");
    sdkwork_web_bootstrap::serve(app, bind_address).await?;
    Ok(())
}
