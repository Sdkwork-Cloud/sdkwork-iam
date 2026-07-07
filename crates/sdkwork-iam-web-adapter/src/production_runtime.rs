//! Production deployment detection and fail-closed hardening gates.

/// Returns true when IAM is running under a production SaaS or cloud deployment profile.
pub fn is_production_iam_deployment() -> bool {
    if matches_im_production_environment() {
        return true;
    }

    let env = read_env_value(&["SDKWORK_ENV", "SDKWORK_ENVIRONMENT"])
        .map(|value| value.to_ascii_lowercase());
    if matches!(
        env.as_deref(),
        Some("prod") | Some("production") | Some("staging")
    ) {
        return true;
    }

    let deployment_mode =
        read_env_value(&["SDKWORK_DEPLOYMENT_MODE", "SDKWORK_IM_DEPLOYMENT_MODE"])
            .map(|value| value.to_ascii_lowercase());
    matches!(
        deployment_mode.as_deref(),
        Some("cloud") | Some("saas") | Some("production")
    )
}

/// Returns true only when the deployment explicitly opts into local development behavior.
///
/// Unset environment variables do **not** qualify — IAM defaults to hardened production posture.
pub fn is_explicit_development_iam_deployment() -> bool {
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
    matches!(
        deployment_mode.as_deref(),
        Some("local") | Some("private") | Some("desktop")
    )
}

fn matches_im_production_environment() -> bool {
    matches!(
        read_env_value(&["SDKWORK_IM_ENVIRONMENT"])
            .map(|value| value.to_ascii_lowercase())
            .as_deref(),
        Some("prod") | Some("production")
    )
}

fn matches_im_dev_or_test_environment() -> bool {
    matches!(
        read_env_value(&["SDKWORK_IM_ENVIRONMENT"])
            .map(|value| value.to_ascii_lowercase())
            .as_deref(),
        Some("dev") | Some("development") | Some("test") | Some("testing")
    )
}

/// Fail closed when unsafe shortcuts are enabled outside an explicit development profile.
pub fn assert_production_hardening() -> Result<(), String> {
    if is_explicit_development_iam_deployment() {
        return Ok(());
    }

    if read_env_value(&["SDKWORK_IAM_ALLOW_DEV_AUTH_FALLBACK"])
        .is_some_and(|value| matches!(value.as_str(), "1" | "true" | "TRUE" | "yes" | "YES"))
    {
        return Err(
            "SDKWORK_IAM_ALLOW_DEV_AUTH_FALLBACK is forbidden outside explicit development IAM deployments"
                .to_string(),
        );
    }

    if read_env_value(&["SDKWORK_IAM_DEV_FIXED_VERIFY_CODE"])
        .filter(|value| !value.is_empty())
        .is_some()
    {
        return Err(
            "SDKWORK_IAM_DEV_FIXED_VERIFY_CODE is forbidden outside explicit development IAM deployments"
                .to_string(),
        );
    }

    if read_env_value(&[
        "SDKWORK_IAM_SUPER_ADMIN_PASSWORD",
        "SDKWORK_IAM_BOOTSTRAP_PASSWORD",
    ])
    .is_some()
    {
        return Err(
            "automatic super-admin password bootstrap is forbidden outside explicit development IAM deployments"
                .to_string(),
        );
    }

    if env_flag_enabled(&["SDKWORK_IAM_ALLOW_SUPER_ADMIN_DB_AUTH"]) {
        return Err(
            "SDKWORK_IAM_ALLOW_SUPER_ADMIN_DB_AUTH is forbidden outside explicit development IAM deployments"
                .to_string(),
        );
    }

    if oauth_client_secret_env_override_present() {
        return Err(
            "OAuth client secret environment overrides are forbidden outside explicit development IAM deployments"
                .to_string(),
        );
    }

    if env_flag_enabled(&["SDKWORK_IAM_EMAIL_VERIFICATION_REQUIRED"])
        && !env_flag_enabled(&["SDKWORK_IAM_MESSAGING_VERIFICATION_ENABLED"])
    {
        return Err(
            "email verification requires SDKWORK_IAM_MESSAGING_VERIFICATION_ENABLED outside explicit development IAM deployments"
                .to_string(),
        );
    }

    if read_env_value(&[
        "SDKWORK_IAM_OAUTH_WEBHOOK_VERIFICATION_TOKEN",
        "SDKWORK_IAM_OAUTH_WEBHOOK_VERIFY_TOKEN",
    ])
    .is_some()
    {
        return Err(
            "OAuth webhook verification env overrides are forbidden outside explicit development IAM deployments"
                .to_string(),
        );
    }

    if read_env_value(&["SDKWORK_IAM_SIGNING_MASTER_SECRET"]).is_none() {
        return Err(
            "SDKWORK_IAM_SIGNING_MASTER_SECRET is required outside explicit development IAM deployments"
                .to_string(),
        );
    }

    Ok(())
}

/// Returns true when OAuth inbound client secrets may be read from environment variables.
pub fn allows_oauth_client_secret_env_override() -> bool {
    is_explicit_development_iam_deployment()
}

fn oauth_client_secret_env_override_present() -> bool {
    if read_env_value(&["SDKWORK_IAM_OAUTH_CLIENT_SECRET"]).is_some() {
        return true;
    }

    std::env::vars().any(|(key, value)| {
        key.starts_with("SDKWORK_IAM_OAUTH_")
            && key.ends_with("_CLIENT_SECRET")
            && !value.trim().is_empty()
    })
}

fn env_flag_enabled(keys: &[&str]) -> bool {
    read_env_value(keys).is_some_and(|value| {
        matches!(
            value.as_str(),
            "1" | "true" | "TRUE" | "yes" | "YES" | "on" | "ON"
        )
    })
}

fn read_env_value(keys: &[&str]) -> Option<String> {
    keys.iter()
        .find_map(|key| std::env::var(key).ok())
        .map(|value| value.trim().to_string())
        .filter(|value| !value.is_empty())
}

#[cfg(test)]
mod tests {
    use super::{
        assert_production_hardening, is_explicit_development_iam_deployment,
        is_production_iam_deployment,
    };

    fn clear_deployment_env_keys() {
        for (key, _) in std::env::vars() {
            if key.starts_with("SDKWORK_IAM_OAUTH_") && key.ends_with("_CLIENT_SECRET") {
                std::env::remove_var(&key);
            }
        }
        for key in [
            "SDKWORK_IM_ENVIRONMENT",
            "SDKWORK_ENV",
            "SDKWORK_ENVIRONMENT",
            "SDKWORK_DEPLOYMENT_MODE",
            "SDKWORK_IM_DEPLOYMENT_MODE",
            "SDKWORK_IAM_ALLOW_DEV_AUTH_FALLBACK",
            "SDKWORK_IAM_DEV_FIXED_VERIFY_CODE",
            "SDKWORK_IAM_SIGNING_MASTER_SECRET",
            "SDKWORK_IAM_ALLOW_SUPER_ADMIN_DB_AUTH",
            "SDKWORK_IAM_OAUTH_CLIENT_SECRET",
        ] {
            std::env::remove_var(key);
        }
    }

    #[test]
    fn production_profile_detects_im_environment() {
        let _env_lock = crate::test_env_lock::lock();
        std::env::set_var("SDKWORK_IM_ENVIRONMENT", "production");
        assert!(is_production_iam_deployment());
        assert!(!is_explicit_development_iam_deployment());
        std::env::remove_var("SDKWORK_IM_ENVIRONMENT");
    }

    #[test]
    fn production_posture_requires_hardening_configuration() {
        let _env_lock = crate::test_env_lock::lock();
        clear_deployment_env_keys();
        std::env::set_var("SDKWORK_IM_ENVIRONMENT", "production");
        std::env::remove_var("SDKWORK_IAM_SIGNING_MASTER_SECRET");
        assert!(
            assert_production_hardening().is_err(),
            "production posture must fail closed without hardened configuration"
        );
        clear_deployment_env_keys();
    }

    #[test]
    fn explicit_development_skips_hardening_requirements() {
        let _env_lock = crate::test_env_lock::lock();
        clear_deployment_env_keys();
        std::env::set_var("SDKWORK_IM_ENVIRONMENT", "development");
        assert!(is_explicit_development_iam_deployment());
        assert!(assert_production_hardening().is_ok());
        clear_deployment_env_keys();
    }

    #[test]
    fn production_hardening_rejects_dev_auth_fallback_override() {
        let _env_lock = crate::test_env_lock::lock();
        clear_deployment_env_keys();
        std::env::set_var("SDKWORK_IAM_SIGNING_MASTER_SECRET", "test-secret");
        std::env::set_var("SDKWORK_IAM_ALLOW_DEV_AUTH_FALLBACK", "1");
        let error = assert_production_hardening().expect_err("must reject dev auth fallback");
        assert!(error.contains("DEV_AUTH_FALLBACK"));
        clear_deployment_env_keys();
    }

    #[test]
    fn production_hardening_rejects_email_verification_without_messaging() {
        let _env_lock = crate::test_env_lock::lock();
        clear_deployment_env_keys();
        std::env::set_var("SDKWORK_IAM_SIGNING_MASTER_SECRET", "test-secret");
        std::env::set_var("SDKWORK_IAM_EMAIL_VERIFICATION_REQUIRED", "true");
        let error = assert_production_hardening()
            .expect_err("must reject email verification without messaging integration");
        assert!(error.contains("MESSAGING_VERIFICATION_ENABLED"));
        clear_deployment_env_keys();
    }

    #[test]
    fn production_hardening_rejects_oauth_client_secret_env_override() {
        let _env_lock = crate::test_env_lock::lock();
        clear_deployment_env_keys();
        std::env::set_var("SDKWORK_IAM_SIGNING_MASTER_SECRET", "test-secret");
        std::env::set_var("SDKWORK_IAM_OAUTH_CLIENT_SECRET", "secret");
        let error = assert_production_hardening()
            .expect_err("must reject oauth client secret env override");
        assert!(error.contains("OAuth client secret"));
        clear_deployment_env_keys();
    }
}
