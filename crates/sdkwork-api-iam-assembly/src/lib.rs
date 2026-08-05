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
    bootstrap_iam_app_for_application, bootstrap_iam_for_application, ApiAssembly,
    ApiAssemblyContribution,
};

pub fn assembly_route_count() -> usize {
    generated::ROUTE_CRATE_COUNT
}
