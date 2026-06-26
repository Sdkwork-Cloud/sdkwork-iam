use axum::Router;

use sdkwork_iam_web_adapter::{
    iam_web_request_context_resolver_from_env, wrap_router_with_iam_open_api_web_framework,
};

use crate::handlers::build_sdkwork_iam_open_api_routes_with_state;
use crate::manifest::open_route_manifest;
use crate::state::OpenIamState;
use crate::web_bootstrap::wrap_router_with_web_framework;

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
