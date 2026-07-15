use std::net::SocketAddr;

use sdkwork_iam_gateway_assembly::assemble_application_router;

fn bind_address() -> Result<SocketAddr, String> {
    let value = std::env::var("SDKWORK_IAM_APPLICATION_PUBLIC_INGRESS_BIND")
        .unwrap_or_else(|_| "127.0.0.1:3901".to_owned());
    value.parse().map_err(|error| {
        format!("invalid SDKWORK_IAM_APPLICATION_PUBLIC_INGRESS_BIND {value:?}: {error}")
    })
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    tracing_subscriber::fmt::init();
    let address = bind_address()?;
    let assembly = assemble_application_router().await;
    let listener = tokio::net::TcpListener::bind(address).await?;
    tracing::info!(%address, "sdkwork IAM gateway listening");
    axum::serve(listener, assembly.router)
        .with_graceful_shutdown(async {
            if let Err(error) = tokio::signal::ctrl_c().await {
                tracing::error!(%error, "failed to install Ctrl-C handler");
            }
        })
        .await?;
    Ok(())
}
