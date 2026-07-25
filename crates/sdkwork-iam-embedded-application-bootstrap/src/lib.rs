//! Embedded IAM tenant application bootstrap for unified-process and installer runtimes.
//!
//! This crate is a compatibility facade. The canonical implementation lives in
//! `sdkwork_iam_web_adapter`, next to the IAM tenant application registry and web resolver
//! bootstrap path, so startup provisioning and explicit installer provisioning cannot diverge.

pub use sdkwork_iam_web_adapter::{
    connect_iam_postgres_bootstrap_pool, discover_application_manifest_roots,
    ensure_tenant_application_from_app_root, ensure_tenant_application_from_app_root_if_configured,
    ensure_tenant_application_from_app_root_with_env,
    ensure_tenant_application_from_app_root_with_env_and_fallback,
    ensure_tenant_applications_from_app_root_on_pool, ensure_tenant_applications_on_pool,
    load_manifest_from_app_root, load_manifest_from_path, manifest_runtime_bindings,
    manifest_to_ensure_command, manifest_to_ensure_commands, normalize_bootstrap_environment,
    postgres_iam_foundation_schema_ready, resolve_application_app_root,
    resolve_application_app_root_with_fallback, resolve_bootstrap_environment,
    resolve_manifest_runtime_app_bindings, validate_manifest_for_embedded_bootstrap,
    EmbeddedApplicationBootstrapOptions, EmbeddedApplicationRuntimeBinding, ManifestAppSection,
    ManifestBackendSection, ManifestReleaseNote, ManifestReleaseSection, SdkworkAppManifest,
};
