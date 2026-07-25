use axum::Router;

use sdkwork_iam_web_adapter::{
    iam_web_request_context_resolver_from_env, wrap_router_with_iam_open_api_web_framework,
};

use crate::handlers::build_sdkwork_iam_open_api_routes_with_state;
use crate::manifest::open_route_manifest;
use crate::state::OpenIamState;
use crate::web_bootstrap::wrap_router_with_web_framework;

/// Builds a fail-closed `sdkwork-iam-open-api` router with no database pool.
///
/// # Deprecated
///
/// This fail-closed constructor mounts the open-api surface without a database
/// pool or env-resolved resolver, so OAuth authorization-server endpoints cannot
/// load tenant signing keys or persist authorization records. Integration
/// applications must use [`build_sdkwork_iam_open_api_router_from_env`] (or the
/// assembly-level [`sdkwork_api_iam_assembly::bootstrap_iam_for_application`])
/// so the open-api surface resolves the IAM database pool and web resolver from
/// the environment.
#[deprecated(
    since = "0.1.0",
    note = "use build_sdkwork_iam_open_api_router_from_env or bootstrap_iam_for_application; the fail-closed variant cannot load tenant signing keys"
)]
pub fn build_sdkwork_iam_open_api_router() -> Router {
    wrap_router_with_web_framework(build_sdkwork_iam_open_api_routes_with_state(
        OpenIamState::empty(),
    ))
}

pub async fn build_sdkwork_iam_open_api_router_from_env() -> Router {
    let resolver = iam_web_request_context_resolver_from_env().await;
    let state = OpenIamState::from_env().await;
    wrap_router_with_iam_open_api_web_framework(
        build_sdkwork_iam_open_api_routes_with_state(state),
        resolver,
        open_route_manifest(),
    )
}

/// Builds the IAM Open API business router without Web Framework or infrastructure layers.
pub fn build_sdkwork_iam_open_api_business_router_with_pool(
    pool: sdkwork_database_sqlx::DatabasePool,
) -> Result<Router, String> {
    let state = OpenIamState::from_pool(pool)?;
    Ok(build_sdkwork_iam_open_api_routes_with_state(state))
}
