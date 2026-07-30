use std::path::PathBuf;

/// Load the IAM root's canonical workspace PostgreSQL profile for integration tests.
pub fn apply_workspace_postgres_env() {
    let iam_root = PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../..");
    sdkwork_iam_database_host::unified_postgres_env::apply_workspace_postgres_env(&iam_root);
}
