use std::path::{Path, PathBuf};

/// Load the unified claw-router PostgreSQL profile for integration tests.
pub fn apply_unified_claw_postgres_env() {
    for path in unified_database_env_candidates() {
        if path.is_file() {
            apply_env_file(&path);
            materialize_iam_database_url_from_unified_profile();
            return;
        }
    }
}

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
