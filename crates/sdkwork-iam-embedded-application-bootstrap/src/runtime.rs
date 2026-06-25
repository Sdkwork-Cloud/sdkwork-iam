use std::path::{Path, PathBuf};

use sdkwork_database_config::claw_database::{
    postgres_url_with_search_path, resolve_unified_database_url,
};
use sdkwork_iam_bootstrap::upsert_postgres_default_subject;
use sdkwork_iam_web_adapter::ensure_tenant_application_runtime;
use sqlx::postgres::PgPoolOptions;
use sqlx::PgPool;

use crate::manifest::{
    load_manifest_from_app_root, manifest_to_ensure_commands, SdkworkAppManifest,
};
use crate::{EmbeddedApplicationBootstrapOptions, EmbeddedApplicationRuntimeBinding};

const TENANT_APPLICATION_BOOTSTRAP_POOL_CONNECTIONS: u32 = 2;

pub fn resolve_application_app_root() -> Option<PathBuf> {
    for key in [
        "SDKWORK_APP_ROOT",
        "SDKWORK_CLAW_ROUTER_APP_ROOT",
        "SDKWORK_IM_APP_ROOT",
        "SDKWORK_DRIVE_APP_ROOT",
        "SDKWORK_BIRDCODER_APP_ROOT",
        "SDKWORK_GITHUB_APP_ROOT",
        "SDKWORK_NOTES_APP_ROOT",
        "SDKWORK_MAIL_APP_ROOT",
        "SDKWORK_RTC_APP_ROOT",
        "SDKWORK_KNOWLEDGEBASE_APP_ROOT",
        "SDKWORK_DOCUMENTS_APP_ROOT",
        "SDKWORK_TERMINAL_APP_ROOT",
        "SDKWORK_IAM_APP_ROOT",
        "SDKWORK_APPBASE_APP_ROOT",
    ] {
        if let Ok(path) = std::env::var(key) {
            let trimmed = path.trim();
            if !trimmed.is_empty() {
                return Some(PathBuf::from(trimmed));
            }
        }
    }
    None
}

pub fn resolve_application_app_root_with_fallback(fallback_app_root: PathBuf) -> PathBuf {
    resolve_application_app_root().unwrap_or(fallback_app_root)
}

pub fn resolve_bootstrap_environment() -> String {
    for key in [
        "SDKWORK_CLAW_ENVIRONMENT",
        "SDKWORK_CLAW_INSTALL_ENVIRONMENT",
        "SDKWORK_ENVIRONMENT",
        "NODE_ENV",
    ] {
        if let Ok(value) = std::env::var(key) {
            let trimmed = value.trim();
            if !trimmed.is_empty() {
                return trimmed.to_owned();
            }
        }
    }
    "development".to_owned()
}

pub async fn connect_iam_postgres_bootstrap_pool(database_url: &str) -> Result<PgPool, String> {
    let database_url = postgres_url_with_search_path(database_url, "SDKWORK_IAM");
    let pool = PgPoolOptions::new()
        .max_connections(TENANT_APPLICATION_BOOTSTRAP_POOL_CONNECTIONS)
        .connect(database_url.as_str())
        .await
        .map_err(|error| {
            format!("connect postgres IAM database for tenant application bootstrap failed: {error}")
        })?;
    Ok(pool)
}

pub async fn postgres_iam_foundation_schema_ready(pg: &PgPool) -> Result<bool, String> {
    let row = sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(*) FROM information_schema.tables \
         WHERE table_schema = current_schema() \
           AND table_name IN ('iam_application_template', 'iam_tenant_application')",
    )
    .fetch_one(pg)
    .await
    .map_err(|error| format!("probe IAM foundation schema failed: {error}"))?;

    Ok(row >= 2)
}

pub async fn ensure_tenant_applications_on_pool(
    pg: &PgPool,
    manifest: &SdkworkAppManifest,
    options: &EmbeddedApplicationBootstrapOptions,
    primary_runtime: Option<&EmbeddedApplicationRuntimeBinding>,
    additional_runtimes: &[EmbeddedApplicationRuntimeBinding],
) -> Result<(), String> {
    upsert_postgres_default_subject(pg)
        .await
        .map_err(|error| format!("ensure default IAM subject failed: {error}"))?;

    let commands = manifest_to_ensure_commands(
        manifest,
        options,
        primary_runtime,
        additional_runtimes,
    )
    .map_err(|error| {
        format!("build embedded IAM tenant application bootstrap commands failed: {error}")
    })?;

    for command in commands {
        ensure_tenant_application_runtime(pg, &command).await.map_err(|error| {
            format!(
                "ensure IAM tenant application runtime for {} failed: {error}",
                command.runtime_app_id
            )
        })?;
    }

    Ok(())
}

pub async fn ensure_tenant_application_from_app_root(
    app_root: &Path,
    options: &EmbeddedApplicationBootstrapOptions,
    primary_runtime: Option<&EmbeddedApplicationRuntimeBinding>,
    additional_runtimes: &[EmbeddedApplicationRuntimeBinding],
) -> Result<(), String> {
    let manifest = load_manifest_from_app_root(app_root)?;
    let database_url = resolve_unified_database_url("SDKWORK_IAM").map_err(|error| {
        format!("resolve unified postgres IAM database URL failed: {error}")
    })?;
    if database_url.starts_with("sqlite:") {
        return Ok(());
    }

    let pool = connect_iam_postgres_bootstrap_pool(database_url.as_str()).await?;
    if !postgres_iam_foundation_schema_ready(&pool).await? {
        return Ok(());
    }

    ensure_tenant_applications_on_pool(
        &pool,
        &manifest,
        options,
        primary_runtime,
        additional_runtimes,
    )
    .await
}

pub async fn ensure_tenant_application_from_app_root_if_configured(
    pg: &PgPool,
    primary_runtime: Option<&EmbeddedApplicationRuntimeBinding>,
    additional_runtimes: &[EmbeddedApplicationRuntimeBinding],
) -> Result<(), String> {
    let Some(app_root) = resolve_application_app_root() else {
        return Ok(());
    };
    if !app_root.join("sdkwork.app.config.json").is_file() {
        return Ok(());
    }

    let manifest = load_manifest_from_app_root(app_root.as_path())?;
    let options = EmbeddedApplicationBootstrapOptions {
        environment: resolve_bootstrap_environment(),
        ..EmbeddedApplicationBootstrapOptions::default()
    };
    ensure_tenant_applications_on_pool(
        pg,
        &manifest,
        &options,
        primary_runtime,
        additional_runtimes,
    )
    .await
}

pub async fn ensure_tenant_application_from_app_root_with_env(
    environment: &str,
    primary_runtime: Option<&EmbeddedApplicationRuntimeBinding>,
    additional_runtimes: &[EmbeddedApplicationRuntimeBinding],
) -> Result<(), String> {
    let Some(app_root) = resolve_application_app_root() else {
        return Ok(());
    };
    ensure_tenant_application_from_app_root(
        app_root.as_path(),
        &EmbeddedApplicationBootstrapOptions {
            environment: environment.to_owned(),
            ..EmbeddedApplicationBootstrapOptions::default()
        },
        primary_runtime,
        additional_runtimes,
    )
    .await
}

pub async fn ensure_tenant_application_from_app_root_with_env_and_fallback(
    environment: &str,
    fallback_app_root: PathBuf,
    primary_runtime: Option<&EmbeddedApplicationRuntimeBinding>,
    additional_runtimes: &[EmbeddedApplicationRuntimeBinding],
) -> Result<(), String> {
    let app_root = resolve_application_app_root_with_fallback(fallback_app_root);
    ensure_tenant_application_from_app_root(
        app_root.as_path(),
        &EmbeddedApplicationBootstrapOptions {
            environment: environment.to_owned(),
            ..EmbeddedApplicationBootstrapOptions::default()
        },
        primary_runtime,
        additional_runtimes,
    )
    .await
}
