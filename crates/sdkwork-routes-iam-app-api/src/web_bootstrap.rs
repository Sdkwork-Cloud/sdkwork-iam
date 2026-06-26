use axum::Router;
use sdkwork_iam_web_adapter::{
    wrap_router_with_iam_app_web_framework_resolver, IamWebRequestContextResolver,
};
use sdkwork_web_core::WebRequestContextResolver;

use crate::manifest::iam_app_api_route_manifest;
use crate::state::LocalIamState;

pub(crate) fn wrap_router_with_web_framework(state: &LocalIamState, router: Router) -> Router {
    let pool = state.pool.as_postgres().cloned().map(std::sync::Arc::new);
    let resolver = IamWebRequestContextResolver::new(pool);
    wrap_router_with_web_framework_resolver(router, resolver)
}

pub(crate) fn wrap_router_with_web_framework_resolver<R>(router: Router, resolver: R) -> Router
where
    R: WebRequestContextResolver + Clone + Send + Sync + 'static,
{
    wrap_router_with_iam_app_web_framework_resolver(router, resolver, iam_app_api_route_manifest())
}
