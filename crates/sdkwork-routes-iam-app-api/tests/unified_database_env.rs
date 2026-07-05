use std::path::{Path, PathBuf};
use tokio::sync::OnceCell;

use sdkwork_database_config::{DatabaseConfig, DatabaseEngine, DeploymentMode};
use sdkwork_database_sqlx::{DatabasePool, PoolContext};

static INTEGRATION_PG_POOL: OnceCell<sqlx::PgPool> = OnceCell::const_new();
static INTEGRATION_ROUTER_DATABASE_POOL: OnceCell<DatabasePool> = OnceCell::const_new();

/// Load the unified claw-router PostgreSQL profile for integration tests.
///
/// Resolution order:
/// 1. `sdkwork-iam/.env.postgres`
/// 2. `../sdkwork-clawrouter/.env.postgres`
/// 3. `../sdkwork-claw-router/.env.postgres`
pub fn apply_unified_claw_postgres_env() {
    for path in unified_database_env_candidates() {
        if path.is_file() {
            apply_env_file(&path);
            materialize_iam_database_url_from_unified_profile();
            configure_integration_test_database_pool();
            return;
        }
    }
}

/// Cap IAM SQLx pool size for sequential integration suites so router rebuilds do not exhaust PostgreSQL.
pub fn configure_integration_test_database_pool() {
    // SAFETY: test setup runs single-threaded under the IAM env mutex.
    unsafe {
        std::env::set_var("SDKWORK_IAM_DATABASE_MAX_CONNECTIONS", "2");
        std::env::set_var("SDKWORK_IAM_DATABASE_MIN_CONNECTIONS", "0");
        std::env::set_var("SDKWORK_IAM_DATABASE_ACQUIRE_TIMEOUT", "60");
    }
}

/// Shared PostgreSQL pool for integration test seeding helpers (one pool per test binary).
pub async fn postgres_pool_for_integration_tests() -> sqlx::PgPool {
    INTEGRATION_PG_POOL
        .get_or_init(|| async {
            let database_url =
                sdkwork_database_config::claw_database::resolve_unified_database_url("SDKWORK_IAM")
                    .unwrap_or_else(|error| {
                        panic!(
                            "resolve IAM database URL from unified postgres profile failed: {error}"
                        )
                    });
            sqlx::postgres::PgPoolOptions::new()
                .max_connections(2)
                .min_connections(0)
                .acquire_timeout(std::time::Duration::from_secs(60))
                .connect(&database_url)
                .await
                .expect(
                    "connect IAM integration test pool failed; on PoolTimedOut restart PostgreSQL or release idle dev-database connections (see deployments/runbooks/local-iam-rust.md)",
                )
        })
        .await
        .clone()
}

/// Shared `DatabasePool` for HTTP integration tests so router rebuilds do not open new PostgreSQL pools.
pub async fn integration_database_pool_for_router() -> DatabasePool {
    INTEGRATION_ROUTER_DATABASE_POOL
        .get_or_init(|| async {
            let pg = postgres_pool_for_integration_tests().await;
            let url =
                sdkwork_database_config::claw_database::resolve_unified_database_url("SDKWORK_IAM")
                    .unwrap_or_else(|error| {
                        panic!(
                            "resolve IAM database URL from unified postgres profile failed: {error}"
                        )
                    });
            let config = DatabaseConfig {
                engine: DatabaseEngine::Postgres,
                url,
                mode: DeploymentMode::Integrated,
                table_prefix: "iam_".to_owned(),
                max_connections: 2,
                min_connections: 0,
                acquire_timeout_secs: 60,
                ..DatabaseConfig::default()
            };
            DatabasePool::Postgres(pg, PoolContext { config })
        })
        .await
        .clone()
}

/// Pin the IAM service database URL after loading the claw-router profile so
/// `dotenv()` during router bootstrap cannot redirect tests to a different database.
fn materialize_iam_database_url_from_unified_profile() {
    let url = sdkwork_database_config::claw_database::resolve_unified_database_url("SDKWORK_IAM")
        .unwrap_or_else(|error| {
            panic!("resolve IAM database URL from unified postgres profile failed: {error}")
        });
    // SAFETY: test setup runs single-threaded under the IAM env mutex.
    unsafe { std::env::set_var("SDKWORK_IAM_DATABASE_URL", url) };
}

fn unified_database_env_candidates() -> Vec<PathBuf> {
    let manifest_dir = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
    let iam_root = manifest_dir.join("../..");
    vec![
        iam_root.join(".env.postgres"),
        iam_root.join("../sdkwork-clawrouter/.env.postgres"),
        iam_root.join("../sdkwork-claw-router/.env.postgres"),
    ]
}

fn apply_env_file(path: &Path) {
    let content = std::fs::read_to_string(path).unwrap_or_else(|error| {
        panic!(
            "read unified postgres env {} failed: {error}",
            path.display()
        )
    });
    for (line_number, raw_line) in content.lines().enumerate() {
        let line = raw_line.trim();
        if line.is_empty() || line.starts_with('#') {
            continue;
        }
        let normalized = line.strip_prefix("export ").map(str::trim).unwrap_or(line);
        let Some((name, value)) = normalized.split_once('=') else {
            panic!(
                "invalid unified postgres env line {} in {}: {raw_line}",
                line_number + 1,
                path.display()
            );
        };
        let name = name.trim();
        let value = strip_optional_quotes(value.trim());
        if name.is_empty() {
            continue;
        }
        // SAFETY: test setup runs single-threaded under the IAM env mutex.
        unsafe { std::env::set_var(name, value) };
    }
}

fn strip_optional_quotes(value: &str) -> String {
    if (value.starts_with('"') && value.ends_with('"'))
        || (value.starts_with('\'') && value.ends_with('\''))
    {
        value[1..value.len().saturating_sub(1)].to_string()
    } else {
        value.to_string()
    }
}

/// True when a unified PostgreSQL profile file exists for local integration suites.
pub fn iam_postgres_profile_configured() -> bool {
    unified_database_env_candidates()
        .iter()
        .any(|path| path.is_file())
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
