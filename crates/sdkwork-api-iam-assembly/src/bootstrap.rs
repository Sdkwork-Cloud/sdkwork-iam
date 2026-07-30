//! Host-neutral IAM API assembly and application bootstrap.
//!
//! Owner contributions contain business routes and their executable contract only.
//! The consuming gateway owns process middleware and infrastructure routes.

use std::path::PathBuf;
use std::sync::Arc;

use axum::Router;
use sdkwork_database_sqlx::DatabasePool;
use sdkwork_iam_database_host::{
    bootstrap_iam_database, bootstrap_iam_database_from_env, IamDatabaseHost,
};
use sdkwork_iam_embedded_application_bootstrap::{
    ensure_tenant_application_from_app_root_with_env_and_fallback, resolve_bootstrap_environment,
};
use sdkwork_iam_web_adapter::IamAppContextInjector;
pub use sdkwork_web_bootstrap::ApiAssemblyContribution;
use sdkwork_web_bootstrap::{ReadinessCheck, ReadinessFuture};
use sdkwork_web_core::HttpRouteManifest;

pub type ApiAssembly = ApiAssemblyContribution;

#[derive(Clone)]
struct IamDatabaseReadinessCheck {
    host: IamDatabaseHost,
}

impl IamDatabaseReadinessCheck {
    fn new(host: IamDatabaseHost) -> Self {
        Self { host }
    }
}

impl ReadinessCheck for IamDatabaseReadinessCheck {
    fn check(&self) -> ReadinessFuture<'_> {
        let host = self.host.clone();
        Box::pin(async move {
            let connected = host
                .pool()
                .test_connection()
                .await
                .map_err(|error| format!("IAM database readiness check failed: {error}"))?;
            if connected {
                Ok(())
            } else {
                Err("IAM database readiness check failed".to_owned())
            }
        })
    }
}

/// Deprecated generated entrypoint retained for downstream migration.
#[deprecated(
    since = "0.1.0",
    note = "use assemble_owner_api_surfaces for IAM standalone or assemble_app_api_contribution for an App API dependency mount"
)]
pub async fn assemble_api_router() -> ApiAssembly {
    assemble_owner_api_surfaces()
        .await
        .expect("initialize IAM owner API surfaces")
}

/// Assembles all IAM-owned HTTP surfaces as one raw standalone contribution.
///
/// No Web Framework layer, CORS middleware, or infrastructure route is mounted.
pub async fn assemble_owner_api_surfaces() -> Result<ApiAssembly, String> {
    let host = bootstrap_iam_application_state().await?;
    assemble_owner_api_surfaces_with_host(host).await
}

/// Assembles all IAM surfaces from the final host's process-shared database pool.
pub async fn assemble_owner_api_surfaces_with_pool(
    pool: DatabasePool,
) -> Result<ApiAssembly, String> {
    let host = bootstrap_iam_application_state_with_pool(pool).await?;
    assemble_owner_api_surfaces_with_host(host).await
}

async fn assemble_owner_api_surfaces_with_host(
    host: IamDatabaseHost,
) -> Result<ApiAssembly, String> {
    let mut router = Router::new();
    router = router.merge(
        sdkwork_routes_iam_app_api::build_sdkwork_iam_app_api_business_router_with_initialized_pool(
            host.pool().clone(),
        )
        .await?,
    );
    router = router.merge(
        sdkwork_routes_iam_backend_api::build_sdkwork_iam_backend_api_business_router_with_pool(
            host.pool().clone(),
        )?,
    );
    router = router.merge(
        sdkwork_routes_iam_open_api::build_sdkwork_iam_open_api_business_router_with_pool(
            host.pool().clone(),
        )?,
    );

    let mut routes = Vec::new();
    routes.extend_from_slice(sdkwork_routes_iam_app_api::iam_app_api_route_manifest().routes());
    routes.extend_from_slice(
        sdkwork_routes_iam_backend_api::iam_backend_api_route_manifest().routes(),
    );
    routes.extend_from_slice(sdkwork_routes_iam_open_api::open_route_manifest().routes());
    let route_manifest = HttpRouteManifest::from_owned_routes(routes);
    ApiAssemblyContribution::from_manifest(
        "sdkwork-iam",
        "SDKWork IAM Owner API Surfaces",
        router,
        route_manifest,
        vec![Arc::new(IamAppContextInjector)],
        Arc::new(IamDatabaseReadinessCheck::new(host)),
    )
}

/// Builds the IAM App API contribution from one initialized database host.
pub async fn assemble_app_api_contribution() -> Result<ApiAssemblyContribution, String> {
    assemble_app_api_contribution_with_module_manifests(&[]).await
}

/// Builds the IAM App API contribution after materializing consumer-owned IAM modules.
pub async fn assemble_app_api_contribution_with_module_manifests(
    manifest_paths: &[PathBuf],
) -> Result<ApiAssemblyContribution, String> {
    let host = bootstrap_iam_application_state().await?;
    assemble_app_api_contribution_with_host(host, manifest_paths).await
}

/// Builds the IAM App API contribution from the final host's process-shared pool.
pub async fn assemble_app_api_contribution_with_pool(
    pool: DatabasePool,
) -> Result<ApiAssemblyContribution, String> {
    let host = bootstrap_iam_application_state_with_pool(pool).await?;
    assemble_app_api_contribution_with_host(host, &[]).await
}

async fn assemble_app_api_contribution_with_host(
    host: IamDatabaseHost,
    manifest_paths: &[PathBuf],
) -> Result<ApiAssemblyContribution, String> {
    sdkwork_iam_database_host::materialize_iam_application_modules(host.pool(), manifest_paths)
        .await
        .map_err(|error| format!("materialize consumer IAM modules failed: {error}"))?;
    let route_manifest = sdkwork_routes_iam_app_api::iam_app_api_route_manifest();
    let router =
        sdkwork_routes_iam_app_api::build_sdkwork_iam_app_api_business_router_with_initialized_pool(
            host.pool().clone(),
        )
        .await?;
    ApiAssemblyContribution::from_manifest(
        "sdkwork-iam",
        "SDKWork IAM App API",
        router,
        route_manifest,
        vec![Arc::new(IamAppContextInjector)],
        Arc::new(IamDatabaseReadinessCheck::new(host)),
    )
}

/// Initializes IAM persistence and tenant-application state, then assembles all
/// IAM-owned HTTP surfaces for the IAM standalone binary.
pub async fn bootstrap_iam_for_application() -> Result<(ApiAssembly, IamDatabaseHost), String> {
    let host = bootstrap_iam_application_state().await?;
    let assembly = assemble_owner_api_surfaces_with_host(host.clone()).await?;
    Ok((assembly, host))
}

/// Initializes IAM persistence and tenant-application state, then exports only
/// the App API contribution selected by an application gateway.
pub async fn bootstrap_iam_app_for_application() -> Result<(ApiAssembly, IamDatabaseHost), String> {
    let host = bootstrap_iam_application_state().await?;
    let assembly = assemble_app_api_contribution_with_host(host.clone(), &[]).await?;
    Ok((assembly, host))
}

async fn bootstrap_iam_application_state() -> Result<IamDatabaseHost, String> {
    let host = bootstrap_iam_database_from_env().await?;
    finalize_iam_application_state(host).await
}

async fn bootstrap_iam_application_state_with_pool(
    pool: DatabasePool,
) -> Result<IamDatabaseHost, String> {
    let host = bootstrap_iam_database(pool).await?;
    finalize_iam_application_state(host).await
}

async fn finalize_iam_application_state(host: IamDatabaseHost) -> Result<IamDatabaseHost, String> {
    let environment = resolve_bootstrap_environment();
    let fallback_app_root = default_iam_application_root();
    ensure_tenant_application_from_app_root_with_env_and_fallback(
        &environment,
        fallback_app_root,
        None,
        &[],
    )
    .await
    .map_err(|error| format!("provision IAM tenant application failed: {error}"))?;

    Ok(host)
}

fn default_iam_application_root() -> std::path::PathBuf {
    std::env::current_dir()
        .ok()
        .and_then(|current_dir| {
            current_dir
                .ancestors()
                .find(|candidate| candidate.join("sdkwork.app.config.json").is_file())
                .map(std::path::Path::to_path_buf)
        })
        .unwrap_or_else(|| std::path::PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../.."))
}

#[cfg(test)]
mod tests {
    use super::*;
    use sdkwork_web_contract::{route_inventory_from_openapi, route_inventory_from_routes};

    #[test]
    fn default_application_root_resolves_the_iam_manifest() {
        assert!(
            default_iam_application_root()
                .join("sdkwork.app.config.json")
                .is_file(),
            "IAM application root must contain sdkwork.app.config.json"
        );
    }

    #[test]
    fn app_api_manifest_openapi_and_auth_inventories_match() {
        let manifest = sdkwork_routes_iam_app_api::iam_app_api_route_manifest();
        let openapi =
            sdkwork_web_contract::build_openapi_document("SDKWork IAM App API", manifest.routes());

        assert_eq!(
            route_inventory_from_routes(manifest.routes()),
            route_inventory_from_openapi(&openapi).expect("valid IAM App API OpenAPI inventory")
        );
    }

    #[test]
    fn app_api_permission_catalog_is_the_manifest_permission_union() {
        let manifest = sdkwork_routes_iam_app_api::iam_app_api_route_manifest();
        let catalog = sdkwork_web_bootstrap::permission_catalog(manifest.routes());
        let mut expected = manifest
            .routes()
            .iter()
            .flat_map(|route| {
                route
                    .required_permission
                    .into_iter()
                    .chain(route.alternate_permissions.into_iter().flatten().copied())
            })
            .collect::<Vec<_>>();
        expected.sort_unstable();
        expected.dedup();

        assert_eq!(expected, catalog);
    }
}
