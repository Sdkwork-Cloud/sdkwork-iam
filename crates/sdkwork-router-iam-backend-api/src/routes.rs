use axum::Router;

use crate::handlers;

pub fn build_sdkwork_iam_backend_api_router() -> Router {
    handlers::build_sdkwork_iam_backend_api_router()
}
