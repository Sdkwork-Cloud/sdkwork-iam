use axum::Router;
use sdkwork_iam_web_adapter::{
    wrap_router_with_iam_backend_web_framework, IamDatabaseWebRequestContextResolver,
};

use crate::manifest::iam_backend_api_route_manifest;

pub(crate) fn wrap_router_with_web_framework(router: Router) -> Router {
    let resolver = IamDatabaseWebRequestContextResolver::new(None);
    wrap_router_with_iam_backend_web_framework(router, resolver, iam_backend_api_route_manifest())
}
