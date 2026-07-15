use sdkwork_web_contract::{HttpMethod, HttpRoute};
use sdkwork_web_core::HttpRouteManifest;

const IAM_OPEN_API_ROUTES: &[HttpRoute] = &[
    HttpRoute::public(
        HttpMethod::Get,
        "/.well-known/openid-configuration",
        "iam.oauth",
        "iam.oauth.wellKnown.openidConfiguration.retrieve",
    ),
    HttpRoute::public(
        HttpMethod::Get,
        "/.well-known/oauth-authorization-server",
        "iam.oauth",
        "iam.oauth.wellKnown.authorizationServerMetadata.retrieve",
    ),
    HttpRoute::public(
        HttpMethod::Get,
        "/iam/v3/api/system/oauth/openid_configuration",
        "iam.oauth",
        "iam.oauth.openidConfiguration.retrieve",
    ),
    HttpRoute::public(
        HttpMethod::Get,
        "/iam/v3/api/system/oauth/authorization_server_metadata",
        "iam.oauth",
        "iam.oauth.authorizationServerMetadata.retrieve",
    ),
    HttpRoute::public(
        HttpMethod::Get,
        "/iam/v3/api/oauth/authorize",
        "iam.oauth",
        "iam.oauth.authorize.handleGet",
    ),
    HttpRoute::public(
        HttpMethod::Post,
        "/iam/v3/api/oauth/token",
        "iam.oauth",
        "iam.oauth.token.create",
    ),
    HttpRoute::public(
        HttpMethod::Post,
        "/iam/v3/api/oauth/revoke",
        "iam.oauth",
        "iam.oauth.revoke.create",
    ),
    HttpRoute::public(
        HttpMethod::Post,
        "/iam/v3/api/oauth/introspect",
        "iam.oauth",
        "iam.oauth.introspect.create",
    ),
    HttpRoute::public(
        HttpMethod::Get,
        "/iam/v3/api/oauth/jwks",
        "iam.oauth",
        "iam.oauth.jwks.retrieve",
    ),
    HttpRoute::open_api_flexible(
        HttpMethod::Get,
        "/iam/v3/api/oauth/userinfo",
        "iam.oauth",
        "iam.oauth.userinfo.retrieve",
    ),
    HttpRoute::open_api_flexible(
        HttpMethod::Get,
        "/iam/v3/api/oauth/provider_callbacks/{callbackPublicId}",
        "iam.oauth",
        "iam.oauth.providerCallbacks.retrieve",
    ),
    HttpRoute::open_api_flexible(
        HttpMethod::Post,
        "/iam/v3/api/oauth/provider_callbacks/{callbackPublicId}",
        "iam.oauth",
        "iam.oauth.providerCallbacks.create",
    ),
];

/// Returns the current IAM-owned `sdkwork-iam-open-api` route metadata.
pub fn sdkwork_iam_open_api_routes() -> Vec<HttpRoute> {
    IAM_OPEN_API_ROUTES.to_vec()
}

pub fn open_routes() -> Vec<HttpRoute> {
    sdkwork_iam_open_api_routes()
}

pub fn open_route_manifest() -> HttpRouteManifest {
    HttpRouteManifest::new(IAM_OPEN_API_ROUTES)
}
