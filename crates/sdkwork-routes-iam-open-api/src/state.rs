use sqlx::PgPool;
use std::sync::Arc;

#[derive(Clone)]
pub struct OpenIamState {
    pub pool: Option<Arc<PgPool>>,
    pub rate_limit_max_requests: u32,
    pub rate_limit_window_seconds: u32,
}

impl OpenIamState {
    pub fn empty() -> Self {
        Self {
            pool: None,
            rate_limit_max_requests: 20,
            rate_limit_window_seconds: 60,
        }
    }

    pub async fn from_env() -> Self {
        let pool = sdkwork_database_sqlx::create_pool_from_env("IAM")
            .await
            .ok()
            .flatten()
            .and_then(|pool| pool.as_postgres().cloned().map(Arc::new));
        let rate_limit_max_requests = std::env::var("SDKWORK_IAM_OPEN_API_RATE_LIMIT_MAX_REQUESTS")
            .ok()
            .and_then(|value| value.parse().ok())
            .unwrap_or(20);
        let rate_limit_window_seconds =
            std::env::var("SDKWORK_IAM_OPEN_API_RATE_LIMIT_WINDOW_SECONDS")
                .ok()
                .and_then(|value| value.parse().ok())
                .unwrap_or(60);
        Self {
            pool,
            rate_limit_max_requests,
            rate_limit_window_seconds,
        }
    }

    pub fn require_pool(&self) -> Result<&PgPool, String> {
        self.pool
            .as_deref()
            .ok_or_else(|| "IAM database pool is not configured".to_string())
    }
}
