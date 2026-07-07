//! Development-only authentication shortcuts gated by explicit environment policy.

use crate::production_runtime::{
    is_explicit_development_iam_deployment, is_production_iam_deployment,
};

/// Returns true only when local development shortcuts (inline open-api credentials,
/// JWT fallback without IAM database session resolution) are explicitly allowed.
pub fn allows_dev_authentication_fallback() -> bool {
    if is_production_iam_deployment() {
        return false;
    }

    if is_explicit_development_iam_deployment() {
        return true;
    }

    read_env_value(&["SDKWORK_IAM_ALLOW_DEV_AUTH_FALLBACK"])
        .is_some_and(|value| matches!(value.as_str(), "1" | "true" | "TRUE" | "yes" | "YES"))
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

    fn clear_deployment_env_keys() {
        for key in [
            "SDKWORK_IM_ENVIRONMENT",
            "SDKWORK_ENV",
            "SDKWORK_ENVIRONMENT",
            "SDKWORK_DEPLOYMENT_MODE",
            "SDKWORK_IM_DEPLOYMENT_MODE",
            "SDKWORK_IAM_ALLOW_DEV_AUTH_FALLBACK",
            "SDKWORK_IAM_DEV_FIXED_VERIFY_CODE",
        ] {
            std::env::remove_var(key);
        }
    }

    #[test]
    fn im_development_environment_allows_authentication_fallback() {
        let _env_lock = crate::test_env_lock::lock();
        clear_deployment_env_keys();
        std::env::set_var("SDKWORK_IM_ENVIRONMENT", "development");
        assert!(allows_dev_authentication_fallback());
        clear_deployment_env_keys();
    }

    #[test]
    fn dev_environment_allows_authentication_fallback() {
        let _env_lock = crate::test_env_lock::lock();
        clear_deployment_env_keys();
        std::env::set_var("SDKWORK_ENV", "dev");
        assert!(allows_dev_authentication_fallback());
        clear_deployment_env_keys();
    }

    #[test]
    fn unset_environment_disallows_authentication_fallback() {
        let _env_lock = crate::test_env_lock::lock();
        clear_deployment_env_keys();
        assert!(!allows_dev_authentication_fallback());
        clear_deployment_env_keys();
    }
}
