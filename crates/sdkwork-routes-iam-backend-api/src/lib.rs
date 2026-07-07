mod backend_audit;
mod backend_sql;
mod handlers;
mod management;
mod manifest;
mod oauth_management;
mod operation_permissions;
mod paths;
mod routes;
mod web_bootstrap;

pub use handlers::build_sdkwork_iam_backend_api_router_from_env;
pub use manifest::{
    backend_routes, iam_backend_api_route_manifest, iam_backend_enriched_routes,
    sdkwork_iam_backend_api_routes,
};
pub use operation_permissions::iam_backend_permission_for_operation;
pub use paths::BACKEND_API_PREFIX;
pub use routes::build_sdkwork_iam_backend_api_router;
pub use sdkwork_web_contract::{HttpMethod, HttpRoute, HttpRoute as IamHttpRoute};

pub(crate) use sdkwork_utils_rust::is_blank;

use axum::Router;
use sdkwork_web_core::HttpRouteManifest;

pub fn gateway_route_manifest() -> HttpRouteManifest {
    iam_backend_api_route_manifest()
}

pub async fn gateway_mount() -> Router {
    build_sdkwork_iam_backend_api_router_from_env().await
}
