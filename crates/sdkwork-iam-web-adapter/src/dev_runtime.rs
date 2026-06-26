//! Development-only authentication shortcuts gated by explicit environment policy.

/// Returns true only when local development shortcuts (inline open-api credentials,
/// JWT fallback without IAM database session resolution) are explicitly allowed.
pub fn allows_dev_authentication_fallback() -> bool {
    if matches_im_dev_or_test_environment() {
        return true;
    }

    let env = read_env_value(&["SDKWORK_ENV", "SDKWORK_ENVIRONMENT"])
        .map(|value| value.to_ascii_lowercase());
    if matches!(env.as_deref(), Some("dev") | Some("test") | Some("local")) {
        return true;
    }

    let deployment_mode =
        read_env_value(&["SDKWORK_DEPLOYMENT_MODE", "SDKWORK_IM_DEPLOYMENT_MODE"])
            .map(|value| value.to_ascii_lowercase());
    if matches!(
        deployment_mode.as_deref(),
        Some("local") | Some("private") | Some("desktop")
    ) {
        return true;
    }

    read_env_value(&["SDKWORK_IAM_ALLOW_DEV_AUTH_FALLBACK"])
        .is_some_and(|value| matches!(value.as_str(), "1" | "true" | "TRUE" | "yes" | "YES"))
}

fn matches_im_dev_or_test_environment() -> bool {
    matches!(
        read_env_value(&["SDKWORK_IM_ENVIRONMENT"])
            .map(|value| value.to_ascii_lowercase())
            .as_deref(),
        Some("dev") | Some("development") | Some("test") | Some("testing")
    )
}

fn read_env_value(keys: &[&str]) -> Option<String> {
    keys.iter()
        .find_map(|key| std::env::var(key).ok())
        .map(|value| value.trim().to_string())
        .filter(|value| !value.is_empty())
}

#[cfg(test)]
mod tests {
    use super::allows_dev_authentication_fallback;

    #[test]
    fn im_development_environment_allows_authentication_fallback() {
        std::env::set_var("SDKWORK_IM_ENVIRONMENT", "development");
        assert!(allows_dev_authentication_fallback());
        std::env::remove_var("SDKWORK_IM_ENVIRONMENT");
    }

    #[test]
    fn dev_environment_allows_authentication_fallback() {
        std::env::set_var("SDKWORK_ENV", "dev");
        assert!(allows_dev_authentication_fallback());
        std::env::remove_var("SDKWORK_ENV");
    }
}
