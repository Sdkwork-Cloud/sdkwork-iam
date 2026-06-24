use axum::Router;

use crate::handlers;
use crate::web_bootstrap;

pub fn build_sdkwork_appbase_open_api_router() -> Router {
    handlers::build_sdkwork_appbase_open_api_router()
}

pub use web_bootstrap::build_sdkwork_appbase_open_api_router_from_env;
