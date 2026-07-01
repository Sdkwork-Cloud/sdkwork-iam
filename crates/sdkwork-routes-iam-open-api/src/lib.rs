mod handlers;
mod manifest;
mod oauth_authorization_handlers;
mod paths;
mod routes;
mod state;
mod web_bootstrap;

use axum::Router;
pub use manifest::{open_route_manifest, open_routes, sdkwork_iam_open_api_routes};
pub use paths::OPEN_API_PREFIX;
pub use routes::{build_sdkwork_iam_open_api_router, build_sdkwork_iam_open_api_router_from_env};
pub use sdkwork_web_contract::{HttpMethod, HttpRoute, HttpRoute as IamHttpRoute};
use sdkwork_web_core::HttpRouteManifest;

pub(crate) use sdkwork_utils_rust::is_blank;

pub fn gateway_route_manifest() -> HttpRouteManifest {
    open_route_manifest()
}

pub async fn gateway_mount() -> Router {
    build_sdkwork_iam_open_api_router_from_env().await
}
