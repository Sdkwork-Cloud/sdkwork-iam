pub mod bootstrap_subject;
pub mod discover;
pub mod manifest;
pub mod materialize;
pub mod merge;
pub mod validate;

pub use bootstrap_subject::{
    DEFAULT_BOOTSTRAP_ADMIN_DISPLAY_NAME, DEFAULT_BOOTSTRAP_ADMIN_EMAIL,
    DEFAULT_BOOTSTRAP_ADMIN_USERNAME, DEFAULT_BOOTSTRAP_ADMIN_USER_ID,
    DEFAULT_IAM_ORGANIZATION_CODE, DEFAULT_IAM_ORGANIZATION_DATA_BOUNDARY_KIND,
    DEFAULT_IAM_ORGANIZATION_ID, DEFAULT_IAM_ORGANIZATION_KIND, DEFAULT_IAM_ORGANIZATION_NAME,
    DEFAULT_IAM_ORGANIZATION_PATH, DEFAULT_IAM_ORGANIZATION_TENANT_BOUNDARY_KIND,
    DEFAULT_IAM_ORGANIZATION_VERIFICATION_STATUS, DEFAULT_IAM_TENANT_CODE, DEFAULT_IAM_TENANT_ID,
    DEFAULT_IAM_TENANT_NAME,
};
pub use discover::{discover_modules, load_registry_config, merge_discovered, DiscoveredModule};
pub use manifest::IamModuleManifest;
pub use materialize::{
    ensure_department_closure_postgres, materialize_postgres_catalog, materialize_sqlite_catalog,
    upsert_tenant_roles_postgres, upsert_tenant_roles_sqlite, MaterializeReport,
};
pub use merge::MergedIamCatalog;
pub use validate::validate_catalog;

#[cfg(test)]
mod federation_tests {
    use std::path::PathBuf;

    use crate::discover::{discover_modules, load_registry_config, merge_discovered};
    use crate::validate::validate_catalog;

    fn app_root() -> PathBuf {
        PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../..")
    }

    #[test]
    fn discovers_and_validates_bundled_modules() {
        let root = app_root();
        let config = load_registry_config(&root).expect("registry config");
        let modules = discover_modules(&root, &config.enabled_modules).expect("discover");
        validate_catalog(&modules).expect("validate");
        let merged = merge_discovered(&modules);
        assert!(merged.permissions.len() >= 140);
        assert!(merged.role_patterns.contains_key("platform_super_admin"));
    }
}
