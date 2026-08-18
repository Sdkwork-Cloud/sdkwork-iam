//! API assembly for sdkwork-iam.
//! Application bootstrap lives in `bootstrap.rs`; route inventory is in `assembly-manifest.json`.
// SDKWORK-ASSEMBLY-LIB-CUSTOM: preserve owner contribution and application bootstrap exports.

mod bootstrap;
mod generated;

#[allow(deprecated)]
pub use bootstrap::{
    assemble_api_router, assemble_app_api_contribution,
    assemble_app_api_contribution_with_module_manifests, assemble_app_api_contribution_with_pool,
    assemble_backend_api_contribution, assemble_backend_api_contribution_with_pool,
    assemble_owner_api_surfaces, assemble_owner_api_surfaces_with_pool,
    bootstrap_database_with_pool, bootstrap_iam_app_for_application, bootstrap_iam_for_application,
    ApiAssembly, ApiAssemblyContribution,
};

pub fn assembly_route_count() -> usize {
    generated::ROUTE_CRATE_COUNT
}

/// App-api surface route manifest owned by the IAM dependency assembly.
///
/// Consuming hosts compose this into the process Web Framework route
/// manifest so IAM public and credential-entry routes keep their declared
/// `RouteAuth` instead of falling through to dual-token
/// (`missing-auth-token`) on unmatched app-api paths.
pub fn app_api_route_manifest() -> sdkwork_web_core::HttpRouteManifest {
    sdkwork_routes_iam_app_api::iam_app_api_route_manifest()
}

/// Backend-api surface route manifest owned by the IAM dependency assembly.
///
/// Consuming hosts compose this into the process Web Framework route
/// manifest so IAM backend bootstrap-body and dual-token routes keep their
/// declared `RouteAuth` instead of falling through to dual-token defaults
/// on unmatched backend-api paths.
pub fn backend_api_route_manifest() -> sdkwork_web_core::HttpRouteManifest {
    sdkwork_routes_iam_backend_api::iam_backend_api_route_manifest()
}
