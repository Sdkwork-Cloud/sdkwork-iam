//! Embedded IAM tenant application bootstrap for unified-process and installer runtimes.
//!
//! Maps `sdkwork.app.config.json` to `ensure_tenant_application_runtime` using the same
//! manifest fields as `@sdkwork/iam-application-bootstrap`, without raw SQL or per-app copies.

mod manifest;
mod runtime;

#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct EmbeddedApplicationBootstrapOptions {
    pub environment: String,
    pub primary_domain_override: Option<String>,
    pub version_override: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct EmbeddedApplicationRuntimeBinding {
    pub runtime_app_id: String,
    pub display_name: Option<String>,
    pub app_key_override: Option<String>,
    pub instance_key_override: Option<String>,
}

pub use manifest::{
    load_manifest_from_app_root, load_manifest_from_path, manifest_to_ensure_command,
    manifest_to_ensure_commands, normalize_bootstrap_environment,
    validate_manifest_for_embedded_bootstrap, ManifestAppSection, ManifestBackendSection,
    SdkworkAppManifest,
};
pub use runtime::{
    connect_iam_postgres_bootstrap_pool, ensure_tenant_application_from_app_root,
    ensure_tenant_application_from_app_root_if_configured,
    ensure_tenant_application_from_app_root_with_env,
    ensure_tenant_application_from_app_root_with_env_and_fallback,
    ensure_tenant_applications_on_pool, postgres_iam_foundation_schema_ready,
    resolve_application_app_root, resolve_application_app_root_with_fallback,
    resolve_bootstrap_environment,
};
