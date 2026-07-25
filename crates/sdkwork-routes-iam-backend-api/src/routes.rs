use axum::Router;

use crate::handlers;

pub fn build_sdkwork_iam_backend_api_business_router_with_pool(
    pool: sdkwork_database_sqlx::DatabasePool,
) -> Result<Router, String> {
    handlers::build_sdkwork_iam_backend_api_business_router_with_pool(pool)
}

#[allow(deprecated)]
pub fn build_sdkwork_iam_backend_api_router() -> Router {
    handlers::build_sdkwork_iam_backend_api_router()
}
