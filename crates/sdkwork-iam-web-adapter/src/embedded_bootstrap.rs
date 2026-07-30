//! Embedded IAM tenant application bootstrap from `sdkwork.app.config.json`.
//!
//! Provides automatic provisioning of tenant applications when the IAM web request
//! context resolver is initialized. Applications that call
//! [`crate::iam_web_request_context_resolver_from_env`] get auto-provisioning for free
//! without per-app bootstrap code.

use std::collections::BTreeSet;
use std::path::{Path, PathBuf};

use sdkwork_database_config::workspace_database::{
    normalize_workspace_postgres_url, resolve_workspace_database_url,
};
use sdkwork_iam_bootstrap::upsert_postgres_default_subject;
use sqlx::postgres::PgPoolOptions;
use sqlx::PgPool;

use crate::app_manifest::{
    load_manifest_from_app_root, manifest_to_ensure_commands, EmbeddedApplicationBootstrapOptions,
    EmbeddedApplicationRuntimeBinding, SdkworkAppManifest,
};
use crate::application_registry::ensure_tenant_application_runtime;

const TENANT_APPLICATION_BOOTSTRAP_POOL_CONNECTIONS: u32 = 2;

/// Resolves the consuming application root from the generic SDKWork contract.
pub fn resolve_application_app_root() -> Option<PathBuf> {
    std::env::var("SDKWORK_APP_ROOT").ok().and_then(|path| {
        let trimmed = path.trim();
        (!trimmed.is_empty()).then(|| PathBuf::from(trimmed))
    })
}

/// Resolves the application root with a fallback path.
pub fn resolve_application_app_root_with_fallback(fallback_app_root: PathBuf) -> PathBuf {
    resolve_application_app_root().unwrap_or(fallback_app_root)
}

/// Resolves the bootstrap environment from known environment variables.
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

/// Connects a short-lived PostgreSQL pool for tenant application bootstrap.
pub async fn connect_iam_postgres_bootstrap_pool(database_url: &str) -> Result<PgPool, String> {
    let database_url = normalize_workspace_postgres_url(database_url)
        .map_err(|error| format!("normalize workspace PostgreSQL URL failed: {error}"))?;
    let pool = PgPoolOptions::new()
        .max_connections(TENANT_APPLICATION_BOOTSTRAP_POOL_CONNECTIONS)
        .connect(database_url.as_str())
        .await
        .map_err(|error| {
            format!(
                "connect postgres IAM database for tenant application bootstrap failed: {error}"
            )
        })?;
    Ok(pool)
}

/// Checks whether the IAM foundation schema tables are present.
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

/// Ensures tenant applications from a manifest on a specific pool.
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

    let commands =
        manifest_to_ensure_commands(manifest, options, primary_runtime, additional_runtimes)
            .map_err(|error| {
                format!("build embedded IAM tenant application bootstrap commands failed: {error}")
            })?;

    for command in commands {
        ensure_tenant_application_runtime(pg, &command)
            .await
            .map_err(|error| {
                format!(
                    "ensure IAM tenant application runtime for {} failed: {error}",
                    command.runtime_app_id
                )
            })?;
    }

    Ok(())
}

/// Loads the manifest from the app root and provisions tenant applications.
pub async fn ensure_tenant_application_from_app_root(
    app_root: &Path,
    options: &EmbeddedApplicationBootstrapOptions,
    primary_runtime: Option<&EmbeddedApplicationRuntimeBinding>,
    additional_runtimes: &[EmbeddedApplicationRuntimeBinding],
) -> Result<(), String> {
    let database_url = resolve_workspace_database_url()
        .map_err(|error| format!("resolve workspace database URL failed: {error}"))?;
    if database_url.starts_with("sqlite:") {
        return Ok(());
    }

    let pool = connect_iam_postgres_bootstrap_pool(database_url.as_str()).await?;
    if !postgres_iam_foundation_schema_ready(&pool).await? {
        return Ok(());
    }

    for manifest_root in discover_application_manifest_roots(app_root)? {
        let (manifest_primary_runtime, manifest_additional_runtimes) =
            runtime_bindings_for_manifest_root(
                app_root,
                manifest_root.as_path(),
                primary_runtime,
                additional_runtimes,
            );
        ensure_one_manifest_root_on_pool(
            &pool,
            manifest_root.as_path(),
            options,
            manifest_primary_runtime,
            manifest_additional_runtimes,
        )
        .await?;
    }
    Ok(())
}

/// Ensures every application manifest under an application root using an existing pool.
pub async fn ensure_tenant_applications_from_app_root_on_pool(
    pg: &PgPool,
    app_root: &Path,
    options: &EmbeddedApplicationBootstrapOptions,
    primary_runtime: Option<&EmbeddedApplicationRuntimeBinding>,
    additional_runtimes: &[EmbeddedApplicationRuntimeBinding],
) -> Result<(), String> {
    for manifest_root in discover_application_manifest_roots(app_root)? {
        let (manifest_primary_runtime, manifest_additional_runtimes) =
            runtime_bindings_for_manifest_root(
                app_root,
                manifest_root.as_path(),
                primary_runtime,
                additional_runtimes,
            );
        ensure_one_manifest_root_on_pool(
            pg,
            manifest_root.as_path(),
            options,
            manifest_primary_runtime,
            manifest_additional_runtimes,
        )
        .await?;
    }
    Ok(())
}

/// Ensures tenant applications from the configured app root environment variable.
pub async fn ensure_tenant_application_from_app_root_if_configured(
    pg: &PgPool,
    primary_runtime: Option<&EmbeddedApplicationRuntimeBinding>,
    additional_runtimes: &[EmbeddedApplicationRuntimeBinding],
) -> Result<(), String> {
    let Some(app_root) = resolve_application_app_root() else {
        return Ok(());
    };
    let manifest_roots = match discover_application_manifest_roots(app_root.as_path()) {
        Ok(roots) => roots,
        Err(_) => return Ok(()),
    };
    let options = EmbeddedApplicationBootstrapOptions {
        environment: resolve_bootstrap_environment(),
        ..EmbeddedApplicationBootstrapOptions::default()
    };
    for manifest_root in manifest_roots {
        let (manifest_primary_runtime, manifest_additional_runtimes) =
            runtime_bindings_for_manifest_root(
                app_root.as_path(),
                manifest_root.as_path(),
                primary_runtime,
                additional_runtimes,
            );
        ensure_one_manifest_root_on_pool(
            pg,
            manifest_root.as_path(),
            &options,
            manifest_primary_runtime,
            manifest_additional_runtimes,
        )
        .await?;
    }
    Ok(())
}

/// Ensures tenant applications from the configured app root with an environment override.
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

pub fn discover_application_manifest_roots(app_root: &Path) -> Result<Vec<PathBuf>, String> {
    let mut roots = Vec::new();
    let mut seen = BTreeSet::new();
    push_manifest_root(&mut roots, &mut seen, app_root.to_path_buf());

    let apps_root = app_root.join("apps");
    if apps_root.is_dir() {
        let entries = std::fs::read_dir(&apps_root).map_err(|error| {
            format!(
                "read application surfaces {} failed: {error}",
                apps_root.display()
            )
        })?;
        let mut surface_roots = Vec::new();
        for entry in entries {
            let entry =
                entry.map_err(|error| format!("read application surface entry failed: {error}"))?;
            let path = entry.path();
            if path.is_dir() {
                surface_roots.push(path);
            }
        }
        surface_roots.sort();
        for surface_root in surface_roots {
            push_manifest_root(&mut roots, &mut seen, surface_root);
        }
    }

    if roots.is_empty() {
        return Err(format!(
            "sdkwork.app.config.json not found under application root {}",
            app_root.display()
        ));
    }

    Ok(roots)
}

fn push_manifest_root(roots: &mut Vec<PathBuf>, seen: &mut BTreeSet<String>, root: PathBuf) {
    if !root.join("sdkwork.app.config.json").is_file() {
        return;
    }
    let key = root.to_string_lossy().replace('\\', "/");
    if seen.insert(key) {
        roots.push(root);
    }
}

async fn ensure_one_manifest_root_on_pool(
    pg: &PgPool,
    app_root: &Path,
    options: &EmbeddedApplicationBootstrapOptions,
    primary_runtime: Option<&EmbeddedApplicationRuntimeBinding>,
    additional_runtimes: &[EmbeddedApplicationRuntimeBinding],
) -> Result<(), String> {
    let manifest = load_manifest_from_app_root(app_root)?;
    ensure_tenant_applications_on_pool(pg, &manifest, options, primary_runtime, additional_runtimes)
        .await
}

fn runtime_bindings_for_manifest_root<'a>(
    application_root: &Path,
    manifest_root: &Path,
    primary_runtime: Option<&'a EmbeddedApplicationRuntimeBinding>,
    additional_runtimes: &'a [EmbeddedApplicationRuntimeBinding],
) -> (
    Option<&'a EmbeddedApplicationRuntimeBinding>,
    &'a [EmbeddedApplicationRuntimeBinding],
) {
    if manifest_root == application_root {
        (primary_runtime, additional_runtimes)
    } else {
        (None, &[])
    }
}

/// Ensures tenant applications from the configured app root with an environment override and fallback.
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

/// Attempts auto-provisioning of the local tenant application from `sdkwork.app.config.json`.
///
/// This is called during IAM web request context resolver initialization so that
/// applications do not need to manually call provisioning in their gateway startup code.
/// Failures are non-fatal — credential entry routes will still validate at request time.
pub(crate) async fn try_auto_provision_tenant_application(pg: &PgPool) {
    if let Err(error) = ensure_tenant_application_from_app_root_if_configured(pg, None, &[]).await {
        eprintln!(
            "[sdkwork-iam-web-adapter] tenant application auto-provisioning skipped: {error}"
        );
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::application_registry::tenant_application_template_id;

    const CLIENT_ARCHITECTURES: [&str; 7] = [
        "pc",
        "h5",
        "flutter-mobile",
        "ios",
        "android",
        "harmony",
        "mini-program",
    ];

    fn write_surface_manifest(root: &Path, architecture: &str) -> PathBuf {
        let app_id = format!("sdkwork-example-{architecture}");
        let surface_root = root.join("apps").join(&app_id);
        std::fs::create_dir_all(&surface_root).expect("create architecture surface root");
        let manifest = serde_json::json!({
            "app": {
                "key": app_id,
                "name": format!("SDKWork Example {architecture}"),
                "appType": "APP_REACT"
            },
            "backend": {
                "appId": app_id,
                "tenantId": "100001",
                "organizationId": "0",
                "accessTokenPermissionScope": ["iam.credential_entry"]
            },
            "runtime": {
                "family": "descriptive-only",
                "framework": architecture
            }
        });
        std::fs::write(
            surface_root.join("sdkwork.app.config.json"),
            serde_json::to_vec_pretty(&manifest).expect("serialize surface manifest"),
        )
        .expect("write surface manifest");
        surface_root
    }

    #[test]
    fn discover_application_manifest_roots_includes_surface_manifests() {
        let root = std::env::temp_dir().join(format!(
            "sdkwork-iam-bootstrap-{}",
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .expect("system time")
                .as_nanos()
        ));
        let pc_root = root.join("apps").join("sdkwork-example-pc");
        std::fs::create_dir_all(&pc_root).expect("create temp app roots");
        std::fs::write(root.join("sdkwork.app.config.json"), "{}").expect("write root manifest");
        std::fs::write(pc_root.join("sdkwork.app.config.json"), "{}").expect("write pc manifest");

        let roots = discover_application_manifest_roots(root.as_path()).expect("discover roots");
        let normalized = roots
            .iter()
            .map(|path| {
                path.strip_prefix(root.as_path())
                    .unwrap_or(path.as_path())
                    .to_string_lossy()
                    .replace('\\', "/")
            })
            .collect::<Vec<_>>();

        assert_eq!(normalized, vec!["", "apps/sdkwork-example-pc"]);

        let _ = std::fs::remove_dir_all(root);
    }

    #[test]
    fn additional_runtime_bindings_apply_only_to_the_application_root_manifest() {
        let application_root = Path::new("sdkwork-im");
        let surface_root = application_root.join("apps").join("sdkwork-im-h5");
        let primary = EmbeddedApplicationRuntimeBinding {
            runtime_app_id: "sdkwork-im-pc".to_owned(),
            display_name: None,
            app_key_override: None,
            instance_key_override: None,
        };
        let additional = [EmbeddedApplicationRuntimeBinding {
            runtime_app_id: "sdkwork-im-h5".to_owned(),
            display_name: None,
            app_key_override: None,
            instance_key_override: None,
        }];

        let root_bindings = runtime_bindings_for_manifest_root(
            application_root,
            application_root,
            Some(&primary),
            &additional,
        );
        assert_eq!(
            root_bindings
                .0
                .map(|binding| binding.runtime_app_id.as_str()),
            Some("sdkwork-im-pc")
        );
        assert_eq!(root_bindings.1, additional.as_slice());

        let surface_bindings = runtime_bindings_for_manifest_root(
            application_root,
            surface_root.as_path(),
            Some(&primary),
            &additional,
        );
        assert!(surface_bindings.0.is_none());
        assert!(surface_bindings.1.is_empty());
    }

    #[test]
    fn architecture_matrix_uses_declared_runtime_identity_without_suffix_inference() {
        let root = std::env::temp_dir().join(format!(
            "sdkwork-iam-architecture-matrix-{}",
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .expect("system time")
                .as_nanos()
        ));
        for architecture in CLIENT_ARCHITECTURES {
            write_surface_manifest(root.as_path(), architecture);
        }

        let manifest_roots = discover_application_manifest_roots(root.as_path())
            .expect("discover architecture roots");
        assert_eq!(manifest_roots.len(), CLIENT_ARCHITECTURES.len());

        let options = EmbeddedApplicationBootstrapOptions {
            environment: "development".to_owned(),
            ..EmbeddedApplicationBootstrapOptions::default()
        };
        let mut runtime_app_ids = BTreeSet::new();
        let mut template_ids = BTreeSet::new();
        for manifest_root in manifest_roots {
            let manifest = load_manifest_from_app_root(manifest_root.as_path())
                .expect("load architecture manifest");
            let commands = manifest_to_ensure_commands(&manifest, &options, None, &[])
                .expect("map architecture manifest");
            let repeated_commands = manifest_to_ensure_commands(&manifest, &options, None, &[])
                .expect("map architecture manifest repeatedly");
            assert_eq!(commands, repeated_commands);
            assert_eq!(commands.len(), 1);

            let command = &commands[0];
            assert_eq!(command.runtime_app_id, command.app_key);
            assert!(!command.runtime_app_id.contains("-pc-pc"));
            assert!(!command.runtime_app_id.contains("-h5-pc"));
            assert!(!command.runtime_app_id.contains("-flutter-mobile-ios"));
            runtime_app_ids.insert(command.runtime_app_id.clone());
            template_ids.insert(tenant_application_template_id(&command.app_key));
        }

        assert_eq!(runtime_app_ids.len(), CLIENT_ARCHITECTURES.len());
        assert_eq!(template_ids.len(), CLIENT_ARCHITECTURES.len());
        let _ = std::fs::remove_dir_all(root);
    }
}
