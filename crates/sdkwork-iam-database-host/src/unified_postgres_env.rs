use std::path::{Path, PathBuf};

/// Load the unified claw-router PostgreSQL profile for appbase database tooling.
///
/// Resolution order:
/// 1. `<app_root>/.env.postgres`
/// 2. `<app_root>/../sdkwork-clawrouter/.env.postgres`
/// 3. `<app_root>/../sdkwork-claw-router/.env.postgres`
pub fn apply_unified_claw_postgres_env(app_root: &Path) {
    let _ = dotenvy::dotenv();

    for path in unified_database_env_candidates(app_root) {
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
    let url = sdkwork_database_config::claw_database::postgres_url_with_search_path(
        url.as_str(),
        "SDKWORK_IAM",
    );
    // SAFETY: database CLI and bootstrap entrypoints run sequentially on the main thread.
    unsafe { std::env::set_var("SDKWORK_IAM_DATABASE_URL", url) };
}

fn unified_database_env_candidates(app_root: &Path) -> Vec<PathBuf> {
    vec![
        app_root.join(".env.postgres"),
        app_root.join("../sdkwork-clawrouter/.env.postgres"),
        app_root.join("../sdkwork-claw-router/.env.postgres"),
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
        // SAFETY: database CLI and bootstrap entrypoints run sequentially on the main thread.
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

#[cfg(test)]
mod tests {
    use super::*;
    use std::path::PathBuf;

    #[test]
    fn unified_database_env_candidates_prefer_app_root_profile() {
        let app_root = PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../..");
        let candidates = unified_database_env_candidates(&app_root);
        assert_eq!(candidates.len(), 3);
        assert_eq!(candidates[0], app_root.join(".env.postgres"));
        assert_eq!(
            candidates[1],
            app_root.join("../sdkwork-clawrouter/.env.postgres")
        );
        assert_eq!(
            candidates[2],
            app_root.join("../sdkwork-claw-router/.env.postgres")
        );
    }
}
