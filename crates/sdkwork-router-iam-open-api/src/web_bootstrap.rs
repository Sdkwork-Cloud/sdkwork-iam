use axum::Router;

use sdkwork_iam_web_adapter::{
    iam_database_resolver_from_env, wrap_router_with_iam_open_api_web_framework,
    IamDatabaseWebRequestContextResolver,
};

use crate::handlers::build_sdkwork_appbase_open_api_routes;
use crate::manifest::open_route_manifest;

pub(crate) fn wrap_router_with_web_framework(router: Router) -> Router {
    let resolver = IamDatabaseWebRequestContextResolver::new(None);
    wrap_router_with_iam_open_api_web_framework(router, resolver, open_route_manifest())
}

pub async fn build_sdkwork_appbase_open_api_router_from_env() -> Router {
    let resolver = iam_database_resolver_from_env().await;
    wrap_router_with_iam_open_api_web_framework(
        build_sdkwork_appbase_open_api_routes(),
        resolver,
        open_route_manifest(),
    )
}
