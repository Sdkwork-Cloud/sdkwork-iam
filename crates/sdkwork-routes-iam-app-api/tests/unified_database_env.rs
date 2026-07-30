use std::path::PathBuf;

use sdkwork_database_config::workspace_database::{
    normalize_workspace_postgres_url, resolve_workspace_database_url,
};
use sdkwork_database_config::{DatabaseConfig, DatabaseEngine, DeploymentMode};
use sdkwork_database_sqlx::{DatabasePool, PoolContext};
use tokio::sync::OnceCell;

static INTEGRATION_PG_POOL: OnceCell<sqlx::PgPool> = OnceCell::const_new();
static INTEGRATION_ROUTER_DATABASE_POOL: OnceCell<DatabasePool> = OnceCell::const_new();

fn iam_root() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../..")
}

/// Load the IAM root's canonical workspace PostgreSQL profile for integration tests.
pub fn apply_workspace_postgres_env() {
    sdkwork_iam_database_host::unified_postgres_env::apply_workspace_postgres_env(&iam_root());
    configure_integration_test_database_pool();
}

/// Cap the process pool for sequential integration suites.
pub fn configure_integration_test_database_pool() {
    // SAFETY: test setup runs single-threaded under the IAM env mutex.
    unsafe {
        std::env::set_var("SDKWORK_DATABASE_MAX_CONNECTIONS", "2");
        std::env::set_var("SDKWORK_DATABASE_MIN_CONNECTIONS", "0");
        std::env::set_var("SDKWORK_DATABASE_ACQUIRE_TIMEOUT", "60");
    }
}

fn workspace_database_url() -> String {
    let url = resolve_workspace_database_url()
        .unwrap_or_else(|error| panic!("resolve workspace database URL failed: {error}"));
    normalize_workspace_postgres_url(&url)
        .unwrap_or_else(|error| panic!("normalize workspace PostgreSQL URL failed: {error}"))
}

/// Shared PostgreSQL pool for integration test seeding helpers (one pool per test binary).
pub async fn postgres_pool_for_integration_tests() -> sqlx::PgPool {
    INTEGRATION_PG_POOL
        .get_or_init(|| async {
            sqlx::postgres::PgPoolOptions::new()
                .max_connections(2)
                .min_connections(0)
                .acquire_timeout(std::time::Duration::from_secs(60))
                .connect(&workspace_database_url())
                .await
                .expect(
                    "connect IAM integration test pool failed; on PoolTimedOut restart PostgreSQL or release idle dev-database connections (see deployments/runbooks/local-iam-rust.md)",
                )
        })
        .await
        .clone()
}

/// Shared initialized `DatabasePool` for HTTP integration tests.
#[allow(dead_code)]
pub async fn integration_database_pool_for_router() -> DatabasePool {
    let pool = INTEGRATION_ROUTER_DATABASE_POOL
        .get_or_init(|| async {
            let pg = postgres_pool_for_integration_tests().await;
            let config = DatabaseConfig {
                engine: DatabaseEngine::Postgres,
                url: workspace_database_url(),
                mode: DeploymentMode::Integrated,
                table_prefix: "iam_".to_owned(),
                max_connections: 8,
                min_connections: 0,
                acquire_timeout_secs: 60,
                ..DatabaseConfig::default()
            };
            let pool = DatabasePool::Postgres(pg, PoolContext { config });
            sdkwork_iam_database_host::bootstrap_iam_database(pool)
                .await
                .expect("bootstrap shared IAM integration database")
                .pool()
                .clone()
        })
        .await
        .clone();
    sdkwork_iam_database_host::ensure_iam_id_generator_initialized(&pool)
        .await
        .expect("refresh shared IAM integration ID generator lease");
    pool
}

/// True when the IAM root has a local PostgreSQL profile for integration suites.
#[allow(dead_code)]
pub fn iam_postgres_profile_configured() -> bool {
    iam_root().join(".env.postgres").is_file()
}

/// Tenants that must stay active across open-registration HTTP standard tests so
/// PostgreSQL integration suites in the same crate are not polluted.
#[allow(dead_code)]
pub const OPEN_REGISTRATION_TENANT_ID: &str = "100001";

#[allow(dead_code)]
pub const INTEGRATION_FIXTURE_TENANT_IDS: &[&str] = &[
    OPEN_REGISTRATION_TENANT_ID,
    "tenant_configured",
    "tenant_secondary_login",
    "tenant_tertiary_login",
    "tenant_oauth_pkce_e2e",
];

/// Deactivate every active tenant except canonical open registration and governed
/// integration fixture tenants used by `iam_local_app_router_test` / OAuth AS tests.
#[allow(dead_code)]
pub async fn deactivate_non_fixture_tenants_for_open_registration(
    pg: &sqlx::PgPool,
) -> Result<(), sqlx::Error> {
    let preserve: Vec<String> = INTEGRATION_FIXTURE_TENANT_IDS
        .iter()
        .map(|tenant_id| (*tenant_id).to_string())
        .collect();
    sqlx::query(
        "UPDATE iam_tenant SET status = 'inactive', updated_at = CURRENT_TIMESTAMP \
         WHERE status = 'active' AND NOT (id = ANY($1))",
    )
    .bind(&preserve)
    .execute(pg)
    .await?;
    Ok(())
}
