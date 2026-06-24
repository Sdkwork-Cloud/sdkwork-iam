mod audit_events;
mod authorization;
mod contacts;
mod directory;
mod ephemeral;
mod ephemeral_pool;
#[allow(dead_code)]
mod handlers;
mod manifest;
mod oauth_login;
mod password_session_bridge;
#[allow(dead_code)]
mod passwords;
mod paths;
#[allow(dead_code)]
mod permissions;
mod responses;
mod routes;
mod security_events;
#[allow(dead_code)]
mod state;
mod tokens;
#[allow(dead_code)]
mod utils;
mod web_bootstrap;

pub(crate) use sdkwork_utils_rust::is_blank;

pub use directory::{SdkworkIamLocalIamDirectory, SdkworkIamLocalIamUserProfile};
pub use manifest::{
    app_routes, iam_app_api_route_manifest, sdkwork_iam_app_api_routes,
    IAM_ANONYMOUS_BOOTSTRAP_OPERATION_IDS, IAM_CREDENTIAL_ENTRY_OPERATION_IDS,
    IAM_HANDLER_SESSION_OPERATION_IDS,
};
pub use password_session_bridge::{PasswordSessionBridge, PasswordSessionBridgeResult};
pub use paths::APP_API_PREFIX;
pub use routes::{
    build_sdkwork_iam_app_api_router,
    build_sdkwork_iam_app_api_router_with_local_directory,
    build_sdkwork_iam_app_api_router_with_pool,
    build_sdkwork_iam_app_api_router_with_web_resolver,
    build_sdkwork_iam_oauth_device_authorization_router_with_pool,
    build_sdkwork_iam_oauth_device_authorization_router_with_pool_and_password_session_bridge,
};
pub use sdkwork_iam_web_adapter::{
    web_request_principal_from_iam, IamDatabaseWebRequestContextResolver,
};
pub use sdkwork_web_contract::{HttpMethod, HttpRoute, HttpRoute as IamHttpRoute, RouteAuth};
pub use tokens::resolve_iam_app_context_from_dual_tokens;

pub fn required_dual_token_headers() -> [&'static str; 2] {
    ["Authorization", "Access-Token"]
}
