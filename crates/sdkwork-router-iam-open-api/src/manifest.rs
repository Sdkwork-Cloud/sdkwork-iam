use sdkwork_web_contract::{HttpMethod, HttpRoute};
use sdkwork_web_core::HttpRouteManifest;

const IAM_OPEN_API_ROUTES: &[HttpRoute] = &[
    HttpRoute::open_api_flexible(
        HttpMethod::Get,
        "/iam/v3/api/oauth/provider_callbacks/{callbackPublicId}",
        "iam.oauth",
        "iam.oauth.providerCallbacks.handleGet",
    ),
    HttpRoute::open_api_flexible(
        HttpMethod::Post,
        "/iam/v3/api/oauth/provider_callbacks/{callbackPublicId}",
        "iam.oauth",
        "iam.oauth.providerCallbacks.handlePost",
    ),
];

/// Returns the current IAM-owned `sdkwork-appbase-open-api` route metadata.
///
/// IAM login/session routes belong to `sdkwork-appbase-app-api`. The open-api
/// surface owns only provider callback ingress for OAuth resource accounts.
pub fn sdkwork_appbase_open_api_routes() -> Vec<HttpRoute> {
    IAM_OPEN_API_ROUTES.to_vec()
}

pub fn open_routes() -> Vec<HttpRoute> {
    sdkwork_appbase_open_api_routes()
}

pub fn open_route_manifest() -> HttpRouteManifest {
    HttpRouteManifest::new(IAM_OPEN_API_ROUTES)
}
