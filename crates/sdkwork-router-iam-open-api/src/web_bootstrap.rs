use axum::Router;

use sdkwork_iam_web_adapter::{
    wrap_router_with_iam_open_api_web_framework, IamDatabaseWebRequestContextResolver,
};

use crate::manifest::open_route_manifest;

pub(crate) fn wrap_router_with_web_framework(router: Router) -> Router {
    let resolver = IamDatabaseWebRequestContextResolver::new(None);
    wrap_router_with_iam_open_api_web_framework(router, resolver, open_route_manifest())
}
