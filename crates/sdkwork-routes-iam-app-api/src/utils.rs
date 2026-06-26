use rand_core::{OsRng, RngCore};
use sdkwork_iam_context_service::{AuthLevel, DeploymentMode, Environment};
use serde_json::Value;
use sqlx::Row;
use std::collections::HashMap;
use std::time::{SystemTime, UNIX_EPOCH};

use crate::state::LocalConfiguredOrganization;

pub(crate) const PASSWORD_RESET_TTL_MILLIS: u128 = 10 * 60 * 1000;

pub(crate) const LOGIN_CONTINUATION_TTL_MILLIS: u128 = 5 * 60 * 1000;

pub(crate) fn query_value<'a>(
    query: &'a HashMap<String, String>,
    keys: &[&str],
) -> Option<&'a str> {
    keys.iter().find_map(|key| {
        query
            .get(*key)
            .map(String::as_str)
            .map(str::trim)
            .filter(|value| !value.is_empty())
    })
}

pub(crate) fn query_matches(query: &HashMap<String, String>, keys: &[&str], value: &str) -> bool {
    query_value(query, keys).is_none_or(|expected| expected == value)
}

pub(crate) fn query_matches_optional(
    query: &HashMap<String, String>,
    keys: &[&str],
    value: Option<&str>,
) -> bool {
    query_value(query, keys).is_none_or(|expected| value == Some(expected))
}

pub(crate) fn login_scope_to_string(
    scope: &sdkwork_iam_context_service::LoginScope,
) -> &'static str {
    match scope {
        sdkwork_iam_context_service::LoginScope::Tenant => "TENANT",
        sdkwork_iam_context_service::LoginScope::Organization => "ORGANIZATION",
    }
}

pub(crate) fn login_scope_from_string(value: &str) -> sdkwork_iam_context_service::LoginScope {
    match value.trim().to_ascii_uppercase().as_str() {
        "ORGANIZATION" => sdkwork_iam_context_service::LoginScope::Organization,
        _ => sdkwork_iam_context_service::LoginScope::Tenant,
    }
}

pub(crate) fn new_iam_user_id() -> String {
    format!("iamu_{}", uuid::Uuid::now_v7())
}

pub(crate) fn new_iam_tenant_id() -> String {
    format!("iamt_{}", uuid::Uuid::now_v7())
}

pub(crate) fn optional_string(value: Option<&Value>) -> Option<String> {
    value
        .and_then(Value::as_str)
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .map(str::to_string)
}

/// Shared ephemeral artifact scope for pre-auth flows that are not tenant-bound.
pub(crate) const LOCAL_EPHEMERAL_SCOPE: &str = "__local__";

pub(crate) fn first_env_value(names: &[&str]) -> Option<String> {
    names.iter().find_map(|name| {
        std::env::var(name)
            .ok()
            .map(|value| value.trim().to_string())
            .filter(|value| !value.is_empty())
    })
}

/// Parse an optional boolean environment variable.
pub(crate) fn parse_optional_env_bool(name: &str) -> Option<bool> {
    std::env::var(name)
        .ok()
        .and_then(|value| match value.trim().to_ascii_lowercase().as_str() {
            "1" | "true" | "yes" | "on" => Some(true),
            "0" | "false" | "no" | "off" => Some(false),
            _ => None,
        })
}

/// Parse an environment variable to type T with a default value.
pub(crate) fn env_parse<T: std::str::FromStr>(name: &str, default: T) -> T {
    std::env::var(name)
        .ok()
        .and_then(|v| v.trim().parse().ok())
        .unwrap_or(default)
}

pub(crate) fn parse_configured_organizations(
    value: Option<&str>,
) -> Vec<LocalConfiguredOrganization> {
    value
        .map(|value| {
            value
                .split([',', ';'])
                .filter_map(|entry| {
                    let entry = entry.trim();
                    if entry.is_empty() {
                        return None;
                    }
                    let (id, name) = entry.split_once(':').unwrap_or((entry, entry));
                    let id = id.trim();
                    if id.is_empty() {
                        return None;
                    }
                    let name = name.trim();
                    Some(LocalConfiguredOrganization {
                        id: id.to_string(),
                        name: if name.is_empty() {
                            id.to_string()
                        } else {
                            name.to_string()
                        },
                    })
                })
                .collect::<Vec<_>>()
        })
        .unwrap_or_default()
}

pub(crate) fn canonical_identity(value: &str) -> String {
    value.trim().to_ascii_lowercase()
}

pub(crate) fn is_local_dev_profile(environment: &str) -> bool {
    matches!(
        environment.trim().to_ascii_lowercase().as_str(),
        "dev" | "development" | "local" | "test" | "testing"
    )
}

pub(crate) fn fixed_verification_code_allowed(config: &crate::state::LocalIamConfig) -> bool {
    config
        .dev_fixed_verify_code
        .as_ref()
        .is_some_and(|_| is_local_dev_profile(&config.environment))
}

pub(crate) fn normalize_identifier(value: &str) -> String {
    value
        .chars()
        .map(|ch| {
            if ch.is_ascii_alphanumeric() {
                ch.to_ascii_lowercase()
            } else {
                '_'
            }
        })
        .collect::<String>()
        .split('_')
        .filter(|part| !part.is_empty())
        .collect::<Vec<_>>()
        .join("_")
}

pub(crate) fn stable_local_id(prefix: &str, parts: &[&str]) -> String {
    let suffix = parts
        .iter()
        .map(|part| normalize_identifier(part))
        .filter(|part| !part.is_empty())
        .collect::<Vec<_>>()
        .join("_");
    let raw = if suffix.is_empty() {
        prefix.to_string()
    } else {
        format!("{prefix}_{suffix}")
    };
    const MAX_LOCAL_ID_LEN: usize = 128;
    if raw.len() <= MAX_LOCAL_ID_LEN {
        return raw;
    }

    use std::collections::hash_map::DefaultHasher;
    use std::hash::{Hash, Hasher};
    let mut hasher = DefaultHasher::new();
    raw.hash(&mut hasher);
    let digest = format!("{:016x}", hasher.finish());
    let head_budget = MAX_LOCAL_ID_LEN.saturating_sub(prefix.len() + 2 + digest.len());
    if head_budget > 0 && !suffix.is_empty() {
        format!(
            "{prefix}_{}_{digest}",
            &suffix[..suffix.len().min(head_budget)]
        )
    } else {
        format!("{prefix}_{digest}")
    }
}

pub(crate) fn local_membership_id(organization_id: &str, user_id: &str) -> String {
    stable_local_id("orgmem", &[organization_id, user_id])
}

pub(crate) fn local_department_assignment_id(department_id: &str, user_id: &str) -> String {
    stable_local_id("deptassign", &[department_id, user_id])
}

pub(crate) fn local_position_assignment_id(
    department_assignment_id: &str,
    position_id: &str,
) -> String {
    stable_local_id("posassign", &[department_assignment_id, position_id])
}

pub(crate) fn local_role_binding_id(
    principal_id: &str,
    scope_kind: &str,
    scope_id: &str,
    role_code: &str,
) -> String {
    stable_local_id("rolebind", &[principal_id, scope_kind, scope_id, role_code])
}

pub(crate) fn title_case_identifier(value: &str) -> String {
    title_case_words(&value.replace(['.', '_', '-'], " "))
}

pub(crate) fn title_case_words(value: &str) -> String {
    value
        .split_whitespace()
        .map(|word| {
            let mut chars = word.chars();
            match chars.next() {
                Some(first) => format!("{}{}", first.to_ascii_uppercase(), chars.as_str()),
                None => String::new(),
            }
        })
        .collect::<Vec<_>>()
        .join(" ")
}

pub(crate) fn generate_verification_code() -> String {
    format!("{:06}", OsRng.next_u32() % 1_000_000)
}

pub(crate) fn split_display_name(value: &str) -> (String, String) {
    let parts = value
        .split_whitespace()
        .filter(|part| !part.is_empty())
        .collect::<Vec<_>>();
    match parts.as_slice() {
        [] => ("Local".to_string(), "User".to_string()),
        [first] => ((*first).to_string(), String::new()),
        [first, rest @ ..] => ((*first).to_string(), rest.join(" ")),
    }
}

pub(crate) fn environment_from_config(environment: &str) -> Environment {
    match environment.trim().to_ascii_lowercase().as_str() {
        "prod" | "production" => Environment::Prod,
        "test" | "testing" => Environment::Test,
        _ => Environment::Dev,
    }
}

pub(crate) fn environment_to_string(environment: &Environment) -> &'static str {
    match environment {
        Environment::Dev => "dev",
        Environment::Test => "test",
        Environment::Prod => "prod",
    }
}

pub(crate) fn deployment_mode_to_string(deployment_mode: &DeploymentMode) -> &'static str {
    match deployment_mode {
        DeploymentMode::Saas => "saas",
        DeploymentMode::Local => "local",
        DeploymentMode::Private => "private",
    }
}

pub(crate) fn auth_level_to_string(auth_level: &AuthLevel) -> &'static str {
    match auth_level {
        AuthLevel::Anonymous => "anonymous",
        AuthLevel::Password => "password",
        AuthLevel::Mfa => "mfa",
        AuthLevel::System => "system",
    }
}

pub(crate) fn current_millis() -> u128 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|duration| duration.as_millis())
        .unwrap_or_default()
}

pub(crate) fn current_timestamp_utc() -> chrono::DateTime<chrono::Utc> {
    chrono::Utc::now()
}

/// Returns the current UTC timestamp as an ISO-8601 string (e.g. "2026-06-16T12:34:56Z").
pub(crate) fn current_timestamp_str() -> String {
    current_timestamp_utc().to_rfc3339()
}

/// Parse a timestamp column stored as TIMESTAMPTZ or RFC3339 TEXT.
pub(crate) fn parse_optional_timestamp_from_row(
    row: &sqlx::postgres::PgRow,
    index: usize,
) -> Option<chrono::DateTime<chrono::Utc>> {
    if let Ok(value) = row.try_get::<Option<chrono::DateTime<chrono::Utc>>, _>(index) {
        return value;
    }
    let text: Option<String> = row.try_get(index).ok()?;
    let text = text?;
    chrono::DateTime::parse_from_rfc3339(text.trim())
        .ok()
        .map(|value| value.with_timezone(&chrono::Utc))
}
