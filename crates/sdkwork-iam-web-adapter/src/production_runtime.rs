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

fn matches_im_production_environment() -> bool {
    matches!(
        read_env_value(&["SDKWORK_IM_ENVIRONMENT"])
            .map(|value| value.to_ascii_lowercase())
            .as_deref(),
        Some("prod") | Some("production")
    )
}

/// Fail closed when production-only unsafe shortcuts are enabled.
pub fn assert_production_hardening() -> Result<(), String> {
    if !is_production_iam_deployment() {
        return Ok(());
    }

    if read_env_value(&["SDKWORK_IAM_ALLOW_DEV_AUTH_FALLBACK"])
        .is_some_and(|value| matches!(value.as_str(), "1" | "true" | "TRUE" | "yes" | "YES"))
    {
        return Err(
            "SDKWORK_IAM_ALLOW_DEV_AUTH_FALLBACK is forbidden in production IAM deployments"
                .to_string(),
        );
    }

    if read_env_value(&["SDKWORK_IAM_DEV_FIXED_VERIFY_CODE"])
        .filter(|value| !value.is_empty())
        .is_some()
    {
        return Err(
            "SDKWORK_IAM_DEV_FIXED_VERIFY_CODE is forbidden in production IAM deployments"
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
            "automatic super-admin password bootstrap is forbidden in production IAM deployments"
                .to_string(),
        );
    }

    if env_flag_enabled(&["SDKWORK_IAM_EMAIL_VERIFICATION_REQUIRED"])
        && !env_flag_enabled(&["SDKWORK_IAM_MESSAGING_VERIFICATION_ENABLED"])
    {
        return Err(
            "email verification requires SDKWORK_IAM_MESSAGING_VERIFICATION_ENABLED in production IAM deployments"
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
            "OAuth webhook verification env overrides are forbidden in production IAM deployments"
                .to_string(),
        );
    }

    Ok(())
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
    use super::{assert_production_hardening, is_production_iam_deployment};

    #[test]
    fn production_profile_detects_im_environment() {
        std::env::set_var("SDKWORK_IM_ENVIRONMENT", "production");
        assert!(is_production_iam_deployment());
        std::env::remove_var("SDKWORK_IM_ENVIRONMENT");
    }

    #[test]
    fn production_hardening_rejects_dev_auth_fallback_override() {
        std::env::set_var("SDKWORK_IM_ENVIRONMENT", "production");
        std::env::set_var("SDKWORK_IAM_ALLOW_DEV_AUTH_FALLBACK", "1");
        let error = assert_production_hardening().expect_err("must reject dev auth fallback");
        assert!(error.contains("DEV_AUTH_FALLBACK"));
        std::env::remove_var("SDKWORK_IAM_ALLOW_DEV_AUTH_FALLBACK");
        std::env::remove_var("SDKWORK_IM_ENVIRONMENT");
    }

    #[test]
    fn production_hardening_rejects_email_verification_without_messaging() {
        std::env::set_var("SDKWORK_IM_ENVIRONMENT", "production");
        std::env::set_var("SDKWORK_IAM_EMAIL_VERIFICATION_REQUIRED", "true");
        let error = assert_production_hardening()
            .expect_err("must reject email verification without messaging integration");
        assert!(error.contains("MESSAGING_VERIFICATION_ENABLED"));
        std::env::remove_var("SDKWORK_IAM_EMAIL_VERIFICATION_REQUIRED");
        std::env::remove_var("SDKWORK_IM_ENVIRONMENT");
    }
}
