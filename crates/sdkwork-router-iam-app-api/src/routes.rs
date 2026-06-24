use std::sync::Arc;

use axum::Router;
use sdkwork_database_sqlx::DatabasePool;

use crate::{
    directory::SdkworkAppbaseLocalIamDirectory, handlers,
    password_session_bridge::PasswordSessionBridge, state::LocalIamState,
};

pub async fn build_sdkwork_appbase_app_api_router() -> Result<Router, String> {
    handlers::build_sdkwork_appbase_app_api_router().await
}

pub async fn build_sdkwork_appbase_app_api_router_with_web_resolver<R>(
    resolver: R,
) -> Result<Router, String>
where
    R: sdkwork_web_core::WebRequestContextResolver + Clone + Send + Sync + 'static,
{
    handlers::build_sdkwork_appbase_app_api_router_with_web_resolver(resolver).await
}

pub async fn build_sdkwork_appbase_app_api_router_with_local_directory(
) -> Result<(Router, SdkworkAppbaseLocalIamDirectory), String> {
    handlers::build_sdkwork_appbase_app_api_router_with_local_directory().await
}

pub async fn build_sdkwork_appbase_app_api_router_with_pool(
    pool: sdkwork_database_sqlx::DatabasePool,
) -> Result<Router, String> {
    handlers::build_sdkwork_appbase_app_api_router_with_pool(pool).await
}

/// Mounts only appbase-owned OAuth device-authorization routes for product runtimes
/// that already host the remaining `/app/v3/api/auth/*` surface locally.
pub async fn build_sdkwork_appbase_oauth_device_authorization_router_with_pool(
    pool: DatabasePool,
) -> Result<Router, String> {
    build_sdkwork_appbase_oauth_device_authorization_router_with_pool_and_password_session_bridge(
        pool, None,
    )
    .await
}

pub async fn build_sdkwork_appbase_oauth_device_authorization_router_with_pool_and_password_session_bridge(
    pool: DatabasePool,
    password_session_bridge: Option<Arc<dyn PasswordSessionBridge>>,
) -> Result<Router, String> {
    let state = LocalIamState::from_pool_for_oauth_device_routes_with_password_session_bridge(
        pool,
        password_session_bridge,
    )
    .await?;
    Ok(handlers::oauth_device_authorization_routes().with_state(state))
}
