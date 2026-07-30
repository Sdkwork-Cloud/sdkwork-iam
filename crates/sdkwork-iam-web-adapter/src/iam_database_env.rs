//! IAM database pool resolution shared by application integration and realtime auth.

use std::sync::{Arc, OnceLock};

use sdkwork_database_sqlx::DatabasePool;
use sqlx::PgPool;

static IAM_DATABASE_POOL: OnceLock<DatabasePool> = OnceLock::new();
static IAM_POSTGRES_POOL: OnceLock<Arc<PgPool>> = OnceLock::new();

/// Registers the canonical process-wide IAM pool after lifecycle bootstrap.
pub fn install_iam_database_pool_for_process(pool: DatabasePool) -> Result<(), String> {
    IAM_DATABASE_POOL
        .set(pool)
        .map_err(|_| "IAM database pool is already installed for this process".to_owned())
}

/// Returns the installed canonical IAM pool when lifecycle bootstrap already ran.
pub fn installed_iam_database_pool_for_process() -> Option<DatabasePool> {
    IAM_DATABASE_POOL.get().cloned()
}

/// Registers the process-wide IAM PostgreSQL pool after lifecycle bootstrap.
pub fn install_iam_postgres_pool_for_process(pool: Arc<PgPool>) -> Result<(), String> {
    IAM_POSTGRES_POOL
        .set(pool)
        .map_err(|_| "IAM postgres pool is already installed for this process".to_owned())
}

/// Returns the installed IAM PostgreSQL pool when lifecycle bootstrap already ran.
pub fn installed_iam_postgres_pool_for_process() -> Option<Arc<PgPool>> {
    IAM_POSTGRES_POOL.get().cloned()
}

/// Resolves the IAM PostgreSQL pool from the canonical process database profile.
pub async fn resolve_iam_postgres_pool_from_env() -> Option<Arc<PgPool>> {
    if let Some(pool) = installed_iam_postgres_pool_for_process() {
        return Some(pool);
    }
    sdkwork_database_sqlx::create_pool_from_env("IAM")
        .await
        .ok()
        .flatten()
        .and_then(|pool| pool.as_postgres().cloned().map(Arc::new))
}

/// Resolves the canonical IAM pool without narrowing the configured database engine.
pub async fn resolve_iam_database_pool_from_env() -> Option<DatabasePool> {
    if let Some(pool) = installed_iam_database_pool_for_process() {
        return Some(pool);
    }
    sdkwork_database_sqlx::create_pool_from_env("IAM")
        .await
        .ok()
        .flatten()
}
