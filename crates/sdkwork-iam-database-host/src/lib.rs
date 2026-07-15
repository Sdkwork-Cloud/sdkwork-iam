mod iam_database_module;
pub mod unified_postgres_env;

use std::path::PathBuf;
use std::sync::{Arc, OnceLock};

pub use iam_database_module::IamDatabaseModule;
use sdkwork_database_id::{NodeAllocatorConfig, SnowflakeNodeAllocator};
use sdkwork_database_lifecycle::{LifecycleOrchestrator, lifecycle_options_from_env};
use sdkwork_database_spi::{DatabaseAssetProvider, DatabaseManifest};
use sdkwork_database_sqlx::DatabasePool;
use sqlx::PgPool;
use unified_postgres_env::apply_unified_claw_postgres_env;

static IAM_DATABASE_HOST: OnceLock<Arc<IamDatabaseHost>> = OnceLock::new();

#[derive(Clone)]
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

pub fn installed_iam_database_host() -> Option<Arc<IamDatabaseHost>> {
    IAM_DATABASE_HOST.get().cloned()
}

pub fn ensure_iam_database_host_installed(host: IamDatabaseHost) -> Arc<IamDatabaseHost> {
    IAM_DATABASE_HOST.get_or_init(|| Arc::new(host)).clone()
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
    if let Err(error) = allocate_and_init_iam_snowflake_node(&pool).await {
        if sdkwork_iam_web_adapter::is_production_iam_deployment() {
            return Err(error);
        }
        tracing::warn!(%error, "continuing with development IAM snowflake fallback");
    }

    if let Some(pg_pool) = pool.as_postgres() {
        let _ = sdkwork_iam_web_adapter::install_iam_postgres_pool_for_process(Arc::new(
            pg_pool.clone(),
        ));
    }

    Ok(
        ensure_iam_database_host_installed(IamDatabaseHost { pool, module })
            .as_ref()
            .clone(),
    )
}

pub async fn bootstrap_iam_database_from_env() -> Result<IamDatabaseHost, String> {
    if let Some(host) = installed_iam_database_host() {
        return Ok(host.as_ref().clone());
    }

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

/// Allocate a Snowflake node_id from the database and initialize the IAM ID generator.
///
/// Node allocation is mandatory in production; a fallback is only permitted for development.
async fn allocate_and_init_iam_snowflake_node(pool: &DatabasePool) -> Result<(), String> {
    let config = NodeAllocatorConfig::from_service_name("iam-service");
    match SnowflakeNodeAllocator::allocate_process_generator(pool, &config).await {
        Ok((generator, lease)) => {
            let node_id = generator.node_id();
            tracing::info!(
                node_id,
                "IAM snowflake node_id allocated from database registry"
            );
            sdkwork_iam_bootstrap::init_iam_id_generator(generator, Some(lease));
            Ok(())
        }
        Err(error) => Err(format!("IAM snowflake node_id allocation failed: {error}")),
    }
}

async fn run_post_bootstrap_hooks(pool: &DatabasePool) -> Result<(), String> {
    let Some(pg) = pool.as_postgres() else {
        tracing::info!("skipping postgres-only IAM post-bootstrap hooks for sqlite pool");
        return Ok(());
    };

    sdkwork_iam_web_adapter::seed_builtin_oauth_provider_catalog(pg)
        .await
        .map_err(|error| format!("seed oauth provider catalog failed: {error}"))?;
    let app_root = resolve_iam_app_root();
    sdkwork_iam_module_registry::materialize_postgres_catalog(pg, Some(&app_root), "operational")
        .await
        .map_err(|error| format!("materialize iam module catalog failed: {error}"))?;
    sdkwork_iam_embedded_application_bootstrap::ensure_tenant_application_from_app_root_if_configured(
        pg,
        None,
        &[],
    )
    .await
        .map_err(|error| format!("ensure embedded IAM tenant application bootstrap failed: {error}"))?;
    match sdkwork_iam_bootstrap::ensure_postgres_bootstrap_admin_user(pg).await {
        Ok(outcome) => tracing::info!(?outcome, "IAM bootstrap admin user seed finished"),
        Err(error) => return Err(format!("ensure bootstrap admin user failed: {error}")),
    }
    match sdkwork_iam_bootstrap::ensure_postgres_bootstrap_manager_user(pg).await {
        Ok(outcome) => tracing::info!(?outcome, "IAM bootstrap manager user seed finished"),
        Err(error) => return Err(format!("ensure bootstrap manager user failed: {error}")),
    }
    Ok(())
}
