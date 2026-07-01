//! IAM PostgreSQL pool resolution shared by application integration and realtime auth.

use std::sync::{Arc, OnceLock};

use sqlx::PgPool;

static IAM_POSTGRES_POOL: OnceLock<Arc<PgPool>> = OnceLock::new();

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

/// Bridges `SDKWORK_IM_DATABASE_URL` into `SDKWORK_IAM_DATABASE_URL` for PostgreSQL dev topologies.
pub fn bridge_iam_database_env_from_im() {
    if std::env::var("SDKWORK_IAM_DATABASE_URL")
        .ok()
        .is_some_and(|value| !value.trim().is_empty())
    {
        return;
    }

    let Ok(im_database_url) = std::env::var("SDKWORK_IM_DATABASE_URL") else {
        return;
    };
    let trimmed = im_database_url.trim();
    if trimmed.starts_with("postgres://") || trimmed.starts_with("postgresql://") {
        // SAFETY: bootstrap and resolver factories run sequentially on the main runtime thread.
        unsafe {
            std::env::set_var("SDKWORK_IAM_DATABASE_URL", trimmed);
        }
    }
}

/// Resolves the IAM PostgreSQL pool from environment variables.
pub async fn resolve_iam_postgres_pool_from_env() -> Option<Arc<PgPool>> {
    if let Some(pool) = installed_iam_postgres_pool_for_process() {
        return Some(pool);
    }
    bridge_iam_database_env_from_im();
    sdkwork_database_sqlx::create_pool_from_env("IAM")
        .await
        .ok()
        .flatten()
        .and_then(|pool| pool.as_postgres().cloned().map(Arc::new))
}

#[cfg(test)]
mod tests {
    use super::bridge_iam_database_env_from_im;

    #[test]
    fn bridges_postgres_im_database_url_into_iam_database_url() {
        std::env::set_var(
            "SDKWORK_IM_DATABASE_URL",
            "postgresql://chat_user:chat_pass@127.0.0.1:5432/chat",
        );
        std::env::remove_var("SDKWORK_IAM_DATABASE_URL");
        bridge_iam_database_env_from_im();
        assert_eq!(
            std::env::var("SDKWORK_IAM_DATABASE_URL").expect("iam database url"),
            "postgresql://chat_user:chat_pass@127.0.0.1:5432/chat"
        );
        std::env::remove_var("SDKWORK_IM_DATABASE_URL");
        std::env::remove_var("SDKWORK_IAM_DATABASE_URL");
    }
}
