use std::path::Path;

use sdkwork_database_config::workspace_database::{
    normalize_workspace_postgres_url, resolve_workspace_database_url,
    workspace_database_env_is_configured,
};

/// Load and validate the selected application root's workspace PostgreSQL profile.
pub fn apply_workspace_postgres_env(app_root: &Path) {
    if !workspace_database_env_is_configured() {
        let path = app_root.join(".env.postgres");
        if path.is_file() {
            apply_env_file(&path);
        }
    }
    materialize_workspace_database_url();
}

fn materialize_workspace_database_url() {
    let url = resolve_workspace_database_url()
        .unwrap_or_else(|error| panic!("resolve workspace database URL failed: {error}"));
    let url = if url.starts_with("postgres://") || url.starts_with("postgresql://") {
        normalize_workspace_postgres_url(&url)
            .unwrap_or_else(|error| panic!("normalize workspace PostgreSQL URL failed: {error}"))
    } else {
        url
    };
    // SAFETY: database CLI and bootstrap entrypoints run sequentially on the main thread.
    unsafe { std::env::set_var("SDKWORK_DATABASE_URL", url) };
}

fn apply_env_file(path: &Path) {
    let content = std::fs::read_to_string(path).unwrap_or_else(|error| {
        panic!(
            "read workspace postgres env {} failed: {error}",
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
                "invalid workspace postgres env line {} in {}: {raw_line}",
                line_number + 1,
                path.display()
            );
        };
        let name = name.trim();
        if !name.starts_with("SDKWORK_DATABASE_") {
            panic!(
                "non-canonical database key {name} in {} at line {}",
                path.display(),
                line_number + 1
            );
        }
        let value = strip_optional_quotes(value.trim());
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
    use std::sync::{Mutex, OnceLock};

    static ENV_LOCK: OnceLock<Mutex<()>> = OnceLock::new();

    #[test]
    fn explicit_runtime_database_is_not_overwritten_by_profile_file() {
        let _lock = ENV_LOCK.get_or_init(|| Mutex::new(())).lock().unwrap();
        let app_root = std::env::temp_dir().join(format!(
            "sdkwork-iam-workspace-database-env-{}",
            std::process::id()
        ));
        std::fs::create_dir_all(&app_root).unwrap();
        std::fs::write(
            app_root.join(".env.postgres"),
            "SDKWORK_DATABASE_URL=postgresql://ignored/ignored\n",
        )
        .unwrap();

        let previous = std::env::var("SDKWORK_DATABASE_URL").ok();
        unsafe {
            std::env::set_var(
                "SDKWORK_DATABASE_URL",
                "sqlite://target/dev/iam-client-local.sqlite",
            );
        }
        apply_workspace_postgres_env(&app_root);
        assert_eq!(
            std::env::var("SDKWORK_DATABASE_URL").unwrap(),
            "sqlite://target/dev/iam-client-local.sqlite"
        );
        unsafe {
            match previous {
                Some(value) => std::env::set_var("SDKWORK_DATABASE_URL", value),
                None => std::env::remove_var("SDKWORK_DATABASE_URL"),
            }
        }
        std::fs::remove_dir_all(app_root).unwrap();
    }
}
