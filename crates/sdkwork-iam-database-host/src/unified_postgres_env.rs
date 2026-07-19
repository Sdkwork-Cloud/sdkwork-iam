use std::path::{Path, PathBuf};

/// Load the unified claw-router PostgreSQL profile for appbase database tooling.
///
/// Resolution order:
/// 1. `<app_root>/.env.postgres`
/// 2. `<app_root>/../sdkwork-clawrouter/.env.postgres`
/// 3. `<app_root>/../sdkwork-claw-router/.env.postgres`
pub fn apply_unified_claw_postgres_env(app_root: &Path) {
    let _ = dotenvy::dotenv();

    let has_runtime_database =
        sdkwork_database_config::claw_database::resolve_claw_router_database_url_from_env()
            .unwrap_or_else(|error| panic!("resolve Claw Router database URL failed: {error}"))
            .is_some();
    if !has_runtime_database {
        for path in unified_database_env_candidates(app_root) {
            if path.is_file() {
                apply_env_file(&path);
                break;
            }
        }
    }
    materialize_iam_database_url_from_unified_profile();
}

fn materialize_iam_database_url_from_unified_profile() {
    let url = sdkwork_database_config::claw_database::resolve_unified_database_url("SDKWORK_IAM")
        .unwrap_or_else(|error| {
            panic!("resolve IAM database URL from unified postgres profile failed: {error}")
        });
    let url = if url.starts_with("postgres://") || url.starts_with("postgresql://") {
        sdkwork_database_config::claw_database::postgres_url_with_search_path(
            url.as_str(),
            "SDKWORK_IAM",
        )
    } else {
        url
    };
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
    use std::sync::{Mutex, OnceLock};

    static ENV_LOCK: OnceLock<Mutex<()>> = OnceLock::new();

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

    #[test]
    fn explicit_runtime_database_is_not_overwritten_by_postgres_profile() {
        let _lock = ENV_LOCK.get_or_init(|| Mutex::new(())).lock().unwrap();
        let app_root = std::env::temp_dir().join(format!(
            "sdkwork-iam-unified-database-env-{}",
            std::process::id()
        ));
        std::fs::create_dir_all(&app_root).unwrap();
        std::fs::write(
            app_root.join(".env.postgres"),
            "SDKWORK_CLAW_DATABASE_URL=postgresql://ignored/ignored\n",
        )
        .unwrap();

        let keys = [
            "SDKWORK_CLAW_DATABASE_URL",
            "SDKWORK_IAM_DATABASE_URL",
            "SDKWORK_DATABASE_URL",
            "DATABASE_URL",
        ];
        let previous = keys.map(|key| (key, std::env::var(key).ok()));
        unsafe {
            std::env::set_var(
                "SDKWORK_CLAW_DATABASE_URL",
                "sqlite://target/dev/clawrouter.sqlite",
            );
            std::env::remove_var("SDKWORK_IAM_DATABASE_URL");
            std::env::remove_var("SDKWORK_DATABASE_URL");
            std::env::remove_var("DATABASE_URL");
        }

        apply_unified_claw_postgres_env(&app_root);

        assert_eq!(
            std::env::var("SDKWORK_CLAW_DATABASE_URL").unwrap(),
            "sqlite://target/dev/clawrouter.sqlite"
        );
        assert_eq!(
            std::env::var("SDKWORK_IAM_DATABASE_URL").unwrap(),
            "sqlite://target/dev/clawrouter.sqlite"
        );

        for (key, value) in previous {
            unsafe {
                match value {
                    Some(value) => std::env::set_var(key, value),
                    None => std::env::remove_var(key),
                }
            }
        }
        std::fs::remove_dir_all(app_root).unwrap();
    }
}
