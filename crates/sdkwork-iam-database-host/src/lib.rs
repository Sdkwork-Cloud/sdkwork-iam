mod iam_database_module;
pub mod unified_postgres_env;

use std::path::PathBuf;
use std::sync::Arc;

pub use iam_database_module::IamDatabaseModule;
use sdkwork_database_lifecycle::{lifecycle_options_from_env, LifecycleOrchestrator};
use sdkwork_database_spi::{DatabaseAssetProvider, DatabaseManifest};
use sdkwork_database_sqlx::DatabasePool;
use sqlx::PgPool;
use unified_postgres_env::apply_unified_claw_postgres_env;

pub struct IamDatabaseHost {
    pool: DatabasePool,
    module: Arc<IamDatabaseModule>,
}

impl IamDatabaseHost {
    pub fn pool(&self) -> &DatabasePool {
        &self.pool
    }

    pub fn module(&self) -> Arc<IamDatabaseModule> {
        self.module.clone()
    }

    pub fn postgres_pool(&self) -> Result<&PgPool, String> {
        self.pool
            .as_postgres()
            .ok_or_else(|| "IAM database pool must provide a PostgreSQL connection.".to_string())
    }
}

pub fn resolve_iam_app_root() -> PathBuf {
    if let Ok(app_root) = std::env::var("SDKWORK_IAM_APP_ROOT") {
        return PathBuf::from(app_root);
    }
    if let Ok(app_root) = std::env::var("SDKWORK_APPBASE_APP_ROOT") {
        return PathBuf::from(app_root);
    }
    PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("../..")
        .canonicalize()
        .unwrap_or_else(|_| PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../.."))
}

pub async fn bootstrap_iam_database(pool: DatabasePool) -> Result<IamDatabaseHost, String> {
    let app_root = resolve_iam_app_root();
    let module = Arc::new(
        IamDatabaseModule::from_app_root(&app_root)
            .map_err(|error| format!("load IAM database module failed: {error}"))?,
    );
    let manifest = DatabaseManifest::from_file(module.manifest_path())
        .map_err(|error| format!("read IAM database manifest failed: {error}"))?;
    let options = lifecycle_options_from_env("IAM", &manifest);
    let orchestrator =
        LifecycleOrchestrator::new(pool.clone(), module.clone()).with_applied_by("sdkwork-iam");

    orchestrator
        .init()
        .await
        .map_err(|error| format!("IAM database init failed: {error}"))?;

    if options.auto_migrate {
        orchestrator
            .migrate()
            .await
            .map_err(|error| format!("IAM database migrate failed: {error}"))?;
    }

    run_post_bootstrap_hooks(&pool).await?;

    Ok(IamDatabaseHost { pool, module })
}

pub async fn bootstrap_iam_database_from_env() -> Result<IamDatabaseHost, String> {
    let app_root = resolve_iam_app_root();
    apply_unified_claw_postgres_env(&app_root);
    let pool = sdkwork_database_sqlx::create_pool_from_env("IAM")
        .await
        .map_err(|error| format!("create IAM database pool failed: {error}"))?
        .ok_or_else(|| {
            "PostgreSQL database configuration is required. Set SDKWORK_IAM_DATABASE_URL or the unified claw-router profile.".to_string()
        })?;
    bootstrap_iam_database(pool).await
}

async fn run_post_bootstrap_hooks(pool: &DatabasePool) -> Result<(), String> {
    let Some(pg) = pool.as_postgres() else {
        tracing::info!("skipping postgres-only IAM post-bootstrap hooks for sqlite pool");
        return Ok(());
    };

    sdkwork_iam_web_adapter::prime_signing_master_secret();
    sdkwork_iam_web_adapter::seed_builtin_oauth_provider_catalog(pg)
        .await
        .map_err(|error| format!("seed oauth provider catalog failed: {error}"))?;
    let app_root = resolve_iam_app_root();
    sdkwork_iam_module_registry::materialize_postgres_catalog(pg, Some(&app_root), "operational")
        .await
        .map_err(|error| format!("materialize iam module catalog failed: {error}"))?;
    Ok(())
}
