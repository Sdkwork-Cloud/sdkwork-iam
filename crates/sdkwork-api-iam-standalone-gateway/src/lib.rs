use std::sync::Arc;

use axum::Router;
use sdkwork_api_iam_assembly::bootstrap_iam_for_application;
use sdkwork_iam_web_adapter::{build_web_framework_layer, IamWebRequestContextResolver};
use sdkwork_web_axum::with_web_request_context;
use sdkwork_web_bootstrap::{
    mount_openapi_json, service_router, OpenApiMount, ServiceRouterConfig,
};
use sdkwork_web_core::HttpMetricsRegistry;
use sdkwork_web_core::HttpRouteManifest;

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
    let metrics = HttpMetricsRegistry::new();
    let route_manifest = assembly.route_manifest.clone();
    let openapi = assembly.openapi.clone();
    let resolver = IamWebRequestContextResolver::from_database_pool(Some(host.pool().clone()));
    let layer = build_web_framework_layer(
        resolver,
        assembly.route_manifest.clone(),
        Vec::new(),
    )
    .with_metrics(metrics.clone());
    let router = with_web_request_context(assembly.router, layer);
    let router = mount_openapi_json(
        router,
        &[OpenApiMount {
            path: "/openapi.json",
            document: Arc::new(assembly.openapi),
        }],
    );

    let router = service_router(
        router,
        ServiceRouterConfig::default()
            .with_readiness_check(assembly.readiness_check)
            .with_metrics(metrics),
    );

    Ok(StandaloneRuntime {
        router,
        route_manifest,
        openapi,
    })
}
