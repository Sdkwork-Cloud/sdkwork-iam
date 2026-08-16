use std::sync::Arc;

use axum::Router;
use sdkwork_api_iam_assembly::bootstrap_iam_for_application;
use sdkwork_iam_web_adapter::{
    build_web_framework_builder, iam_web_request_context_resolver_from_database_pool_for_audiences,
    IamAuditEmitter, IamSecurityEventEmitter,
};
use sdkwork_web_bootstrap::{infra_public_path_prefixes, ComposedApiAssembly};
use sdkwork_web_core::HttpRouteManifest;

const APPLICATION_ID: &str = "sdkwork-iam";

pub struct StandaloneRuntime {
    pub router: Router,
    pub route_manifest: HttpRouteManifest,
    pub openapi: serde_json::Value,
}

pub async fn build_standalone_router() -> Result<Router, String> {
    Ok(build_standalone_runtime().await?.router)
}

pub async fn build_standalone_runtime() -> Result<StandaloneRuntime, String> {
    let (assembly, host) = bootstrap_iam_for_application().await?;
    let environment = std::env::var("SDKWORK_ENVIRONMENT")
        .or_else(|_| std::env::var("SDKWORK_IAM_ENVIRONMENT"))
        .unwrap_or_else(|_| "production".to_owned());
    let production = matches!(
        environment.trim().to_ascii_lowercase().as_str(),
        "prod" | "production"
    );
    let resolver = iam_web_request_context_resolver_from_database_pool_for_audiences(
        host.pool().clone(),
        &[APPLICATION_ID, "iam"],
    )
    .await?;
    let mut framework = build_web_framework_builder(
        resolver,
        assembly.route_manifest.clone(),
        infra_public_path_prefixes(),
    );
    if production {
        let postgres_pool = host
            .pool()
            .as_postgres()
            .cloned()
            .ok_or_else(|| "production IAM gateway requires PostgreSQL".to_owned())?;
        framework = framework
            .audit_emitter(Arc::new(IamAuditEmitter::new(
                postgres_pool.clone(),
                APPLICATION_ID,
                environment.clone(),
            )))
            .security_event_emitter(Arc::new(IamSecurityEventEmitter::new(
                postgres_pool,
                environment,
            )));
    }

    let hosted =
        ComposedApiAssembly::try_compose("SDKWork IAM API", vec![assembly])?.into_hosted(framework);

    Ok(StandaloneRuntime {
        router: hosted.router,
        route_manifest: hosted.route_manifest,
        openapi: hosted.openapi,
    })
}
