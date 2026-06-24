mod handlers;
mod manifest;
mod paths;
mod routes;
mod web_bootstrap;

pub use manifest::{open_routes, sdkwork_appbase_open_api_routes};
pub use paths::OPEN_API_PREFIX;
pub use routes::{
    build_sdkwork_appbase_open_api_router, build_sdkwork_appbase_open_api_router_from_env,
};
pub use sdkwork_web_contract::{HttpMethod, HttpRoute, HttpRoute as IamHttpRoute};
