use sqlx::PgPool;
use std::sync::Arc;

#[derive(Clone)]
pub struct OpenIamState {
    pub pool: Option<Arc<PgPool>>,
}

impl OpenIamState {
    pub fn empty() -> Self {
        Self { pool: None }
    }

    pub async fn from_env() -> Self {
        let pool = sdkwork_database_sqlx::create_pool_from_env("IAM")
            .await
            .ok()
            .flatten()
            .and_then(|pool| pool.as_postgres().cloned().map(Arc::new));
        Self { pool }
    }

    pub fn require_pool(&self) -> Result<&PgPool, String> {
        self.pool
            .as_deref()
            .ok_or_else(|| "IAM database pool is not configured".to_string())
    }
}
