use std::{
    sync::OnceLock,
    time::{Duration, SystemTime, UNIX_EPOCH},
};

use sdkwork_id_core::{SnowflakeIdError, SnowflakeIdGenerator};

mod user_center_authority;
mod user_center_validation;

pub(crate) use sdkwork_utils_rust::is_blank;

pub use user_center_authority::{
    ensure_sqlite_user_center_bootstrap_user, ensure_sqlite_user_center_schema,
    UpdateUserCenterProfileRequest, UserCenterEmailCodeLoginRequest, UserCenterLoginQrCodePayload,
    UserCenterLoginQrConfirmRequest, UserCenterLoginQrStatusPayload, UserCenterLoginRequest,
    UserCenterMetadataPayload, UserCenterOAuthAuthorizationRequest, UserCenterOAuthLoginRequest,
    UserCenterOAuthUrlPayload, UserCenterPasswordResetChallengeRequest,
    UserCenterPasswordResetRequest, UserCenterPhoneCodeLoginRequest, UserCenterProfilePayload,
    UserCenterRegisterRequest, UserCenterSessionExchangeRequest, UserCenterSessionPayload,
    UserCenterState,
};

pub const USER_CENTER_DEFAULT_LOCAL_API_BASE_PATH: &str = "/app/v3/api";
pub const USER_CENTER_DEFAULT_SQLITE_FILENAME: &str = "user-center.db";
pub const USER_CENTER_CANONICAL_LOCAL_API_BASE_PATH: &str = "/app/v3/api";
pub const USER_CENTER_AUTH_CONFIG_PATH: &str = "/app/v3/api/auth/config";
pub const USER_CENTER_AUTH_SESSION_PATH: &str = "/app/v3/api/auth/sessions/current";
pub const USER_CENTER_AUTH_LOGIN_PATH: &str = "/app/v3/api/auth/sessions";
pub const USER_CENTER_AUTH_EMAIL_LOGIN_PATH: &str = "/app/v3/api/auth/sessions";
pub const USER_CENTER_AUTH_PHONE_LOGIN_PATH: &str = "/app/v3/api/auth/sessions";
pub const USER_CENTER_AUTH_REGISTER_PATH: &str = "/app/v3/api/auth/registrations";
pub const USER_CENTER_AUTH_REFRESH_PATH: &str = "/app/v3/api/auth/sessions/refresh";
pub const USER_CENTER_AUTH_LOGOUT_PATH: &str = "/app/v3/api/auth/sessions/current";
pub const USER_CENTER_AUTH_SESSION_EXCHANGE_PATH: &str = "/app/v3/api/auth/sessions";
pub const USER_CENTER_AUTH_PASSWORD_RESET_REQUEST_PATH: &str =
    "/app/v3/api/auth/password_reset_requests";
pub const USER_CENTER_AUTH_PASSWORD_RESET_PATH: &str = "/app/v3/api/auth/password_resets";
pub const USER_CENTER_USER_PROFILE_PATH: &str = "/app/v3/api/iam/users/current";
pub const USER_CENTER_USER_SETTINGS_PATH: &str = "/app/v3/api/iam/users/current";
pub const USER_CENTER_TENANT_ROOT_PATH: &str = "/app/v3/api/iam/tenants/current";
pub const USER_CENTER_HEALTH_PATH: &str = "/app/v3/api/health";
pub const USER_CENTER_TABLE_PREFIX: &str = "iam_";
pub const USER_CENTER_AUTHORIZATION_HEADER_NAME: &str = "Authorization";
pub const USER_CENTER_AUTHORIZATION_SCHEME: &str = "Bearer";
pub const USER_CENTER_ACCESS_TOKEN_HEADER_NAME: &str = "Access-Token";
pub const USER_CENTER_REFRESH_TOKEN_HEADER_NAME: &str = "Refresh-Token";
pub const USER_CENTER_SESSION_HEADER_NAME: &str = "x-sdkwork-user-center-session-id";
pub const USER_CENTER_STANDARD_HANDSHAKE_MODE: &str = "provider-shared-secret";
pub const USER_CENTER_HANDSHAKE_MODE_HEADER_NAME: &str = "x-sdkwork-user-center-handshake-mode";
pub const USER_CENTER_APP_ID_HEADER_NAME: &str = "x-sdkwork-app-id";
pub const USER_CENTER_PROVIDER_KEY_HEADER_NAME: &str = "x-sdkwork-user-center-provider-key";
pub const USER_CENTER_SECRET_ID_HEADER_NAME: &str = "x-sdkwork-user-center-secret-id";
pub const USER_CENTER_SIGNATURE_HEADER_NAME: &str = "x-sdkwork-user-center-signature";
pub const USER_CENTER_SIGNED_AT_HEADER_NAME: &str = "x-sdkwork-user-center-signed-at";
pub const USER_CENTER_DEFAULT_SECRET_RESOLUTION_SCOPE: &str = "organization-preferred";
pub const USER_CENTER_DEFAULT_TENANT_CLAIM_KEY: &str = "tenantId";
pub const USER_CENTER_DEFAULT_ORGANIZATION_CLAIM_KEY: &str = "organizationId";
pub const USER_CENTER_DEFAULT_UNVERIFIED_CLAIMS_TTL_MS: u64 = 30_000;
pub const USER_CENTER_DEFAULT_VERIFIED_TOKEN_TTL_MS: u64 = 30_000;
pub const USER_CENTER_DEFAULT_SECRET_RESOLUTION_TTL_MS: u64 = 300_000;
pub const USER_CENTER_DEFAULT_HANDSHAKE_FRESHNESS_WINDOW_MS: u64 = 30_000;

const USER_CENTER_SNOWFLAKE_NODE_ID: u16 = 1;
static USER_CENTER_ID_GENERATOR: OnceLock<SnowflakeIdGenerator> = OnceLock::new();

pub fn create_identifier(entity_kind: &str) -> String {
    let generator = USER_CENTER_ID_GENERATOR.get_or_init(|| {
        SnowflakeIdGenerator::new(USER_CENTER_SNOWFLAKE_NODE_ID)
            .expect("user center snowflake node id must be valid")
    });

    match generator.generate() {
        Ok(identifier) => identifier.to_string(),
        Err(SnowflakeIdError::SequenceExhausted { .. }) => {
            std::thread::sleep(Duration::from_millis(1));
            generator
                .generate()
                .unwrap_or_else(|error| {
                    panic!("generate {entity_kind} snowflake id failed: {error:?}")
                })
                .to_string()
        }
        Err(error) => panic!("generate {entity_kind} snowflake id failed: {error:?}"),
    }
}

pub fn sqlite_table_exists(
    connection: &rusqlite::Connection,
    table_name: &str,
) -> Result<bool, String> {
    let mut statement = connection
        .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?1")
        .map_err(|error| format!("prepare sqlite table probe for {table_name} failed: {error}"))?;
    let mut rows = statement
        .query([table_name])
        .map_err(|error| format!("query sqlite table probe for {table_name} failed: {error}"))?;

    rows.next()
        .map(|row| row.is_some())
        .map_err(|error| format!("read sqlite table probe for {table_name} failed: {error}"))
}

fn sqlite_column_exists(
    connection: &rusqlite::Connection,
    table_name: &str,
    column_name: &str,
) -> Result<bool, String> {
    let pragma = format!("PRAGMA table_info({table_name})");
    let mut statement = connection
        .prepare(&pragma)
        .map_err(|error| format!("prepare sqlite table info for {table_name} failed: {error}"))?;
    let rows = statement
        .query_map([], |row| row.get::<_, String>(1))
        .map_err(|error| format!("query sqlite table info for {table_name} failed: {error}"))?;

    for row in rows {
        let existing_column_name = row
            .map_err(|error| format!("read sqlite table info for {table_name} failed: {error}"))?;
        if existing_column_name == column_name {
            return Ok(true);
        }
    }

    Ok(false)
}

fn ensure_sqlite_table_column(
    connection: &rusqlite::Connection,
    table_name: &str,
    column_name: &str,
    column_sql: &str,
) -> Result<(), String> {
    if sqlite_column_exists(connection, table_name, column_name)? {
        return Ok(());
    }

    connection
        .execute(
            &format!("ALTER TABLE {table_name} ADD COLUMN {column_sql}"),
            [],
        )
        .map_err(|error| {
            format!("alter sqlite table {table_name} add column {column_name} failed: {error}")
        })?;

    Ok(())
}

pub fn ensure_sqlite_table_columns(
    connection: &rusqlite::Connection,
    table_name: &str,
    columns: &[(&str, &str)],
) -> Result<(), String> {
    for (column_name, column_sql) in columns {
        ensure_sqlite_table_column(connection, table_name, column_name, column_sql)?;
    }
    Ok(())
}

pub fn parse_storage_timestamp_millis(timestamp: &str) -> Option<i64> {
    let normalized = timestamp.trim();
    if normalized.is_empty() {
        return None;
    }

    let numeric = normalized.strip_prefix('-').unwrap_or(normalized);
    if !numeric.is_empty() && numeric.chars().all(|character| character.is_ascii_digit()) {
        let parsed = normalized.parse::<i128>().ok()?;
        let absolute = parsed.abs();
        let milliseconds = if absolute >= 1_000_000_000_000_000_000 {
            parsed / 1_000_000
        } else if absolute >= 1_000_000_000_000_000 {
            parsed / 1_000
        } else if absolute >= 1_000_000_000_000 {
            parsed
        } else if absolute >= 1_000_000_000 {
            parsed * 1_000
        } else {
            parsed
        };

        return i64::try_from(milliseconds).ok();
    }

    let parsed =
        time::OffsetDateTime::parse(normalized, &time::format_description::well_known::Rfc3339)
            .ok()?;
    Some((parsed.unix_timestamp_nanos() / 1_000_000) as i64)
}

pub fn storage_timestamp_from_millis(value: i64) -> String {
    let seconds = value.div_euclid(1_000);
    let milliseconds = value.rem_euclid(1_000) as u16;
    let datetime = time::OffsetDateTime::from_unix_timestamp(seconds)
        .unwrap_or(time::OffsetDateTime::UNIX_EPOCH)
        .replace_millisecond(milliseconds)
        .unwrap_or(time::OffsetDateTime::UNIX_EPOCH);
    datetime
        .format(&time::format_description::well_known::Rfc3339)
        .unwrap_or_else(|_| "1970-01-01T00:00:00Z".to_owned())
}

pub fn current_storage_timestamp() -> String {
    let milliseconds = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .expect("system clock before unix epoch")
        .as_millis();
    storage_timestamp_from_millis(i64::try_from(milliseconds).unwrap_or(i64::MAX))
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct UserCenterProviderConfig {
    pub base_url: Option<String>,
    pub headers: Vec<(String, String)>,
    pub kind: String,
    pub provider_key: String,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct UserCenterRoutes {
    pub auth_base_path: String,
    pub user_route_path: String,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct UserCenterStoragePlan {
    pub access_token_key: String,
    pub auth_token_key: String,
    pub preferences_key: String,
    pub profile_key: String,
    pub refresh_token_key: String,
    pub runtime_state_key: String,
    pub session_header_name: String,
    pub session_token_key: String,
    pub storage_scope: String,
    pub token_type_key: String,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct UserCenterLocalApiRoutes {
    pub auth_config: String,
    pub auth_email_login: String,
    pub auth_login: String,
    pub auth_logout: String,
    pub auth_oauth_login: String,
    pub auth_oauth_url: String,
    pub auth_password_reset: String,
    pub auth_password_reset_request: String,
    pub auth_phone_login: String,
    pub auth_qr_callback_pattern: String,
    pub auth_qr_confirm: String,
    pub auth_qr_entry_pattern: String,
    pub auth_qr_generate: String,
    pub auth_qr_status_pattern: String,
    pub auth_refresh: String,
    pub auth_register: String,
    pub auth_session: String,
    pub auth_session_exchange: String,
    pub health: String,
    pub preferences: String,
    pub profile: String,
    pub session_bootstrap: String,
    pub session_login: String,
    pub session_logout: String,
    pub session_refresh: String,
    pub tenant: String,
    pub tenant_root: String,
    pub user_profile: String,
    pub user_settings: String,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct UserCenterStorageEntityBinding {
    pub primary_key_column_name: String,
    pub standard_entity_name: String,
    pub table_name: String,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct UserCenterStorageTopology {
    pub database_key: String,
    pub entity_bindings: Vec<UserCenterStorageEntityBinding>,
    pub migration_namespace: String,
    pub schema_name: Option<String>,
    pub table_prefix: String,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct UserCenterTokenHeaders {
    pub access_token_header_name: String,
    pub authorization_header_name: String,
    pub authorization_scheme: String,
    pub refresh_token_header_name: String,
    pub session_header_name: String,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct UserCenterHandshakeHeaderNames {
    pub app_id_header_name: String,
    pub provider_key_header_name: String,
    pub secret_id_header_name: String,
    pub signature_header_name: String,
    pub signed_at_header_name: String,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct UserCenterHandshakeSignature {
    pub secret_id: String,
    pub signature: String,
    pub signed_at: String,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct UserCenterHandshakeRequestHeaders {
    pub app_id: String,
    pub handshake_mode: String,
    pub provider_key: String,
    pub secret_id: String,
    pub signature: String,
    pub signed_at: String,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct UserCenterHandshakeVerificationContext {
    pub age_ms: u64,
    pub handshake: UserCenterHandshakeRequestHeaders,
    pub signed_at_epoch_ms: i64,
    pub signing_message: String,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct UserCenterAuthCachePolicy {
    pub bundle_memory_cache: bool,
    pub secret_resolution_ttl_ms: u64,
    pub unverified_claims_ttl_ms: u64,
    pub verified_token_ttl_ms: u64,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct UserCenterSecretResolution {
    pub organization_claim_key: String,
    pub resolver_kind: String,
    pub scope: String,
    pub tenant_claim_key: String,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct UserCenterAuthHandshake {
    pub enabled: bool,
    pub freshness_window_ms: u64,
    pub header_names: UserCenterHandshakeHeaderNames,
    pub mode: String,
    pub static_headers: Vec<(String, String)>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct UserCenterAuthProfile {
    pub cache_policy: UserCenterAuthCachePolicy,
    pub handshake: UserCenterAuthHandshake,
    pub mode: String,
    pub secret_resolution: UserCenterSecretResolution,
    pub token_headers: UserCenterTokenHeaders,
    pub validation_strategy: String,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct UserCenterBuiltinLocalIntegrationProfile {
    pub auth_mode: String,
    pub enabled: bool,
    pub handshake_enabled: bool,
    pub kind: String,
    pub local_api_base_path: String,
    pub secret_resolver_kind: String,
    pub session_transport: String,
    pub user_system_scope: String,
    pub validation_strategy: String,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct UserCenterExternalAppApiIntegrationProfile {
    pub auth_mode: String,
    pub enabled: bool,
    pub handshake_enabled: bool,
    pub kind: String,
    pub provider_key: String,
    pub secret_resolver_kind: String,
    pub session_transport: String,
    pub upstream_base_url: Option<String>,
    pub validation_strategy: String,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct UserCenterIntegrationProfileSet {
    pub active_kind: String,
    pub builtin_local: UserCenterBuiltinLocalIntegrationProfile,
    pub external_app_api: UserCenterExternalAppApiIntegrationProfile,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct UserCenterRuntimeConfig {
    pub auth: UserCenterAuthProfile,
    pub capability: String,
    pub integration: UserCenterIntegrationProfileSet,
    pub local_api: UserCenterLocalApiRoutes,
    pub mode: String,
    pub namespace: String,
    pub provider: UserCenterProviderConfig,
    pub routes: UserCenterRoutes,
    pub schema_version: u32,
    pub storage_topology: UserCenterStorageTopology,
    pub storage_plan: UserCenterStoragePlan,
}

fn normalize_namespace(value: &str) -> String {
    let mut buffer = String::new();
    let mut previous_was_separator = false;

    for character in value.trim().to_lowercase().chars() {
        if character.is_ascii_alphanumeric() {
            buffer.push(character);
            previous_was_separator = false;
        } else if !previous_was_separator {
            buffer.push('-');
            previous_was_separator = true;
        }
    }

    let normalized = buffer.trim_matches('-').to_string();
    if normalized.is_empty() {
        "sdkwork-app".to_string()
    } else {
        normalized
    }
}

fn normalize_path(value: Option<&str>, fallback: &str) -> String {
    let normalized = value.unwrap_or(fallback).trim().trim_end_matches('/');

    if normalized.is_empty() || normalized == "/" {
        fallback.to_string()
    } else if normalized.starts_with('/') {
        normalized.to_string()
    } else {
        format!("/{normalized}")
    }
}

fn require_non_empty_text(value: &str, field_name: &str) -> Result<String, String> {
    let normalized = value.trim();

    if normalized.is_empty() {
        Err(format!(
            "User center {field_name} must be a non-empty string."
        ))
    } else {
        Ok(normalized.to_string())
    }
}

fn resolve_header_value(headers: &[(String, String)], header_name: &str) -> Option<String> {
    let expected_header_name = header_name.to_lowercase();

    headers
        .iter()
        .find(|(candidate_header_name, _)| {
            candidate_header_name.to_lowercase() == expected_header_name
        })
        .and_then(|(_, value)| {
            let normalized = value.trim();
            if normalized.is_empty() {
                None
            } else {
                Some(normalized.to_string())
            }
        })
}

fn parse_rfc3339_timestamp_ms(value: &str, field_name: &str) -> Result<i64, String> {
    let raw = require_non_empty_text(value, field_name)?;
    let Some((date_part, time_part)) = raw.split_once('T') else {
        return Err(format!(
            "User center {field_name} must resolve to a valid RFC3339 timestamp."
        ));
    };

    let time_part = time_part.strip_suffix('Z').ok_or_else(|| {
        format!("User center {field_name} must resolve to a valid RFC3339 timestamp.")
    })?;
    let mut date_iter = date_part.split('-');
    let year = date_iter
        .next()
        .and_then(|segment| segment.parse::<i32>().ok())
        .ok_or_else(|| {
            format!("User center {field_name} must resolve to a valid RFC3339 timestamp.")
        })?;
    let month = date_iter
        .next()
        .and_then(|segment| segment.parse::<u32>().ok())
        .ok_or_else(|| {
            format!("User center {field_name} must resolve to a valid RFC3339 timestamp.")
        })?;
    let day = date_iter
        .next()
        .and_then(|segment| segment.parse::<u32>().ok())
        .ok_or_else(|| {
            format!("User center {field_name} must resolve to a valid RFC3339 timestamp.")
        })?;

    if date_iter.next().is_some() {
        return Err(format!(
            "User center {field_name} must resolve to a valid RFC3339 timestamp."
        ));
    }

    let mut time_iter = time_part.split(':');
    let hour = time_iter
        .next()
        .and_then(|segment| segment.parse::<u32>().ok())
        .ok_or_else(|| {
            format!("User center {field_name} must resolve to a valid RFC3339 timestamp.")
        })?;
    let minute = time_iter
        .next()
        .and_then(|segment| segment.parse::<u32>().ok())
        .ok_or_else(|| {
            format!("User center {field_name} must resolve to a valid RFC3339 timestamp.")
        })?;
    let second = time_iter
        .next()
        .and_then(|segment| segment.parse::<u32>().ok())
        .ok_or_else(|| {
            format!("User center {field_name} must resolve to a valid RFC3339 timestamp.")
        })?;

    if time_iter.next().is_some() {
        return Err(format!(
            "User center {field_name} must resolve to a valid RFC3339 timestamp."
        ));
    }

    if !(1..=12).contains(&month)
        || !(1..=31).contains(&day)
        || hour > 23
        || minute > 59
        || second > 59
    {
        return Err(format!(
            "User center {field_name} must resolve to a valid RFC3339 timestamp."
        ));
    }

    fn days_from_civil(year: i32, month: u32, day: u32) -> i64 {
        let year = year - if month <= 2 { 1 } else { 0 };
        let era = if year >= 0 { year } else { year - 399 } / 400;
        let year_of_era = year - era * 400;
        let month = month as i32;
        let day = day as i32;
        let day_of_year = (153 * (month + if month > 2 { -3 } else { 9 }) + 2) / 5 + day - 1;
        let day_of_era = year_of_era * 365 + year_of_era / 4 - year_of_era / 100 + day_of_year;

        era as i64 * 146_097 + day_of_era as i64 - 719_468
    }

    let total_seconds = days_from_civil(year, month, day) * 86_400
        + hour as i64 * 3_600
        + minute as i64 * 60
        + second as i64;

    Ok(total_seconds * 1_000)
}

fn resolve_static_handshake_header(
    auth: &UserCenterAuthProfile,
    header_name: &str,
) -> Option<String> {
    auth.handshake
        .static_headers
        .iter()
        .find(|(key, _)| key == header_name)
        .and_then(|(_, value)| {
            let normalized = value.trim();
            if normalized.is_empty() {
                None
            } else {
                Some(normalized.to_string())
            }
        })
}

fn default_entity_bindings(table_prefix: &str) -> Vec<UserCenterStorageEntityBinding> {
    vec![
        UserCenterStorageEntityBinding {
            primary_key_column_name: "id".to_string(),
            standard_entity_name: "IamUser".to_string(),
            table_name: format!("{table_prefix}user"),
        },
        UserCenterStorageEntityBinding {
            primary_key_column_name: "id".to_string(),
            standard_entity_name: "IamTenant".to_string(),
            table_name: format!("{table_prefix}tenant"),
        },
        UserCenterStorageEntityBinding {
            primary_key_column_name: "id".to_string(),
            standard_entity_name: "IamOrganizationMembership".to_string(),
            table_name: format!("{table_prefix}organization_membership"),
        },
        UserCenterStorageEntityBinding {
            primary_key_column_name: "id".to_string(),
            standard_entity_name: "IamDepartmentAssignment".to_string(),
            table_name: format!("{table_prefix}department_assignment"),
        },
        UserCenterStorageEntityBinding {
            primary_key_column_name: "id".to_string(),
            standard_entity_name: "IamPositionAssignment".to_string(),
            table_name: format!("{table_prefix}position_assignment"),
        },
        UserCenterStorageEntityBinding {
            primary_key_column_name: "id".to_string(),
            standard_entity_name: "IamRoleBinding".to_string(),
            table_name: format!("{table_prefix}role_binding"),
        },
    ]
}

pub fn create_user_center_storage_plan(namespace: &str) -> UserCenterStoragePlan {
    let normalized_namespace = normalize_namespace(namespace);
    let storage_scope = format!("{normalized_namespace}.user-center");

    UserCenterStoragePlan {
        access_token_key: format!("{storage_scope}.Access-Token"),
        auth_token_key: format!("{storage_scope}.auth-token"),
        preferences_key: format!("{storage_scope}.preferences.v1"),
        profile_key: format!("{storage_scope}.profile.v1"),
        refresh_token_key: format!("{storage_scope}.refresh-token"),
        runtime_state_key: format!("{storage_scope}.runtime-state.v1"),
        session_header_name: USER_CENTER_SESSION_HEADER_NAME.to_string(),
        session_token_key: format!("{storage_scope}.session-token"),
        storage_scope: storage_scope.clone(),
        token_type_key: format!("{storage_scope}.token-type"),
    }
}

pub fn create_user_center_local_api_routes(base_path: Option<&str>) -> UserCenterLocalApiRoutes {
    let normalized_base_path = normalize_path(base_path, USER_CENTER_CANONICAL_LOCAL_API_BASE_PATH);
    let auth_base_path = format!("{normalized_base_path}/auth");
    let open_platform_qr_auth_sessions_path =
        format!("{normalized_base_path}/open_platform/qr_auth/sessions");
    let iam_base_path = format!("{normalized_base_path}/iam");
    let user_profile_path = format!("{iam_base_path}/users/current");
    let user_settings_path = user_profile_path.clone();
    let tenant_root_path = format!("{iam_base_path}/tenants/current");
    let auth_config_path = format!("{auth_base_path}/config");
    let auth_session_path = format!("{auth_base_path}/sessions/current");
    let auth_session_exchange_path = format!("{auth_base_path}/sessions");
    let auth_login_path = format!("{auth_base_path}/sessions");
    let auth_email_login_path = auth_login_path.clone();
    let auth_phone_login_path = auth_login_path.clone();
    let auth_register_path = format!("{auth_base_path}/registrations");
    let auth_refresh_path = format!("{auth_base_path}/sessions/refresh");
    let auth_logout_path = format!("{auth_base_path}/sessions/current");
    let auth_password_reset_request_path = format!("{auth_base_path}/password_reset_requests");
    let auth_password_reset_path = format!("{auth_base_path}/password_resets");
    let auth_qr_generate_path = open_platform_qr_auth_sessions_path.clone();
    let auth_qr_status_pattern = format!("{open_platform_qr_auth_sessions_path}/:sessionKey");
    let auth_qr_entry_pattern = format!("{open_platform_qr_auth_sessions_path}/:sessionKey/scans");
    let auth_qr_callback_pattern = auth_qr_entry_pattern.clone();
    let auth_qr_confirm_path =
        format!("{open_platform_qr_auth_sessions_path}/:sessionKey/passwords");
    let oauth_base_path = format!("{normalized_base_path}/oauth");
    let auth_oauth_url_path = format!("{oauth_base_path}/authorization_urls");
    let auth_oauth_login_path = format!("{oauth_base_path}/sessions");

    UserCenterLocalApiRoutes {
        auth_config: auth_config_path,
        auth_email_login: auth_email_login_path,
        auth_login: auth_login_path.clone(),
        auth_logout: auth_logout_path.clone(),
        auth_oauth_login: auth_oauth_login_path,
        auth_oauth_url: auth_oauth_url_path,
        auth_password_reset: auth_password_reset_path,
        auth_password_reset_request: auth_password_reset_request_path,
        auth_phone_login: auth_phone_login_path,
        auth_qr_callback_pattern,
        auth_qr_confirm: auth_qr_confirm_path,
        auth_qr_entry_pattern,
        auth_qr_generate: auth_qr_generate_path,
        auth_qr_status_pattern,
        auth_refresh: auth_refresh_path.clone(),
        auth_register: auth_register_path,
        auth_session: auth_session_path,
        auth_session_exchange: auth_session_exchange_path.clone(),
        health: format!("{normalized_base_path}/health"),
        preferences: user_settings_path.clone(),
        profile: user_profile_path.clone(),
        session_bootstrap: auth_session_exchange_path,
        session_login: auth_login_path,
        session_logout: auth_logout_path,
        session_refresh: auth_refresh_path,
        tenant: tenant_root_path.clone(),
        tenant_root: tenant_root_path,
        user_profile: user_profile_path,
        user_settings: user_settings_path,
    }
}

pub fn create_default_user_center_routes() -> UserCenterRoutes {
    UserCenterRoutes {
        auth_base_path: "/auth".to_string(),
        user_route_path: "/user".to_string(),
    }
}

pub fn create_default_user_center_storage_topology(namespace: &str) -> UserCenterStorageTopology {
    UserCenterStorageTopology {
        database_key: format!("{namespace}-user-center"),
        entity_bindings: default_entity_bindings(USER_CENTER_TABLE_PREFIX),
        migration_namespace: format!("{namespace}.user-center"),
        schema_name: None,
        table_prefix: USER_CENTER_TABLE_PREFIX.to_string(),
    }
}

pub fn create_user_center_standard_token_headers(
    storage_plan: &UserCenterStoragePlan,
) -> UserCenterTokenHeaders {
    UserCenterTokenHeaders {
        access_token_header_name: USER_CENTER_ACCESS_TOKEN_HEADER_NAME.to_string(),
        authorization_header_name: USER_CENTER_AUTHORIZATION_HEADER_NAME.to_string(),
        authorization_scheme: USER_CENTER_AUTHORIZATION_SCHEME.to_string(),
        refresh_token_header_name: USER_CENTER_REFRESH_TOKEN_HEADER_NAME.to_string(),
        session_header_name: storage_plan.session_header_name.clone(),
    }
}

pub fn create_default_user_center_auth_cache_policy() -> UserCenterAuthCachePolicy {
    UserCenterAuthCachePolicy {
        bundle_memory_cache: true,
        secret_resolution_ttl_ms: USER_CENTER_DEFAULT_SECRET_RESOLUTION_TTL_MS,
        unverified_claims_ttl_ms: USER_CENTER_DEFAULT_UNVERIFIED_CLAIMS_TTL_MS,
        verified_token_ttl_ms: USER_CENTER_DEFAULT_VERIFIED_TOKEN_TTL_MS,
    }
}

pub fn create_default_user_center_handshake_header_names() -> UserCenterHandshakeHeaderNames {
    UserCenterHandshakeHeaderNames {
        app_id_header_name: USER_CENTER_APP_ID_HEADER_NAME.to_string(),
        provider_key_header_name: USER_CENTER_PROVIDER_KEY_HEADER_NAME.to_string(),
        secret_id_header_name: USER_CENTER_SECRET_ID_HEADER_NAME.to_string(),
        signature_header_name: USER_CENTER_SIGNATURE_HEADER_NAME.to_string(),
        signed_at_header_name: USER_CENTER_SIGNED_AT_HEADER_NAME.to_string(),
    }
}

pub fn create_user_center_auth_profile(
    namespace: &str,
    provider: &UserCenterProviderConfig,
    mode: &str,
    storage_plan: &UserCenterStoragePlan,
) -> UserCenterAuthProfile {
    let auth_mode = if mode == "app-api-hub" {
        "upstream-app-api-token-bridge".to_string()
    } else {
        "dual-token".to_string()
    };
    let resolver_kind = if auth_mode == "upstream-app-api-token-bridge" {
        "upstream-secret-bridge".to_string()
    } else {
        "local-static".to_string()
    };
    let handshake_enabled = auth_mode == "upstream-app-api-token-bridge";
    let header_names = create_default_user_center_handshake_header_names();
    let static_headers = if handshake_enabled {
        vec![
            (
                header_names.app_id_header_name.clone(),
                namespace.to_string(),
            ),
            (
                USER_CENTER_HANDSHAKE_MODE_HEADER_NAME.to_string(),
                USER_CENTER_STANDARD_HANDSHAKE_MODE.to_string(),
            ),
            (
                header_names.provider_key_header_name.clone(),
                provider.provider_key.clone(),
            ),
        ]
    } else {
        Vec::new()
    };

    UserCenterAuthProfile {
        cache_policy: create_default_user_center_auth_cache_policy(),
        handshake: UserCenterAuthHandshake {
            enabled: handshake_enabled,
            freshness_window_ms: USER_CENTER_DEFAULT_HANDSHAKE_FRESHNESS_WINDOW_MS,
            header_names,
            mode: if handshake_enabled {
                USER_CENTER_STANDARD_HANDSHAKE_MODE.to_string()
            } else {
                "disabled".to_string()
            },
            static_headers,
        },
        mode: auth_mode,
        secret_resolution: UserCenterSecretResolution {
            organization_claim_key: USER_CENTER_DEFAULT_ORGANIZATION_CLAIM_KEY.to_string(),
            resolver_kind,
            scope: USER_CENTER_DEFAULT_SECRET_RESOLUTION_SCOPE.to_string(),
            tenant_claim_key: USER_CENTER_DEFAULT_TENANT_CLAIM_KEY.to_string(),
        },
        token_headers: create_user_center_standard_token_headers(storage_plan),
        validation_strategy: "dual-token".to_string(),
    }
}

pub fn create_user_center_integration_profiles(
    namespace: &str,
    provider: &UserCenterProviderConfig,
    local_api_base_path: &str,
    mode: &str,
    builtin_local_auth: &UserCenterAuthProfile,
    external_app_api_auth: &UserCenterAuthProfile,
) -> UserCenterIntegrationProfileSet {
    let external_provider_key = if provider.kind == "sdkwork-cloud-app-api" {
        provider.provider_key.clone()
    } else {
        format!("{namespace}-app-api")
    };
    let external_enabled = mode == "app-api-hub" || provider.kind == "sdkwork-cloud-app-api";

    UserCenterIntegrationProfileSet {
        active_kind: if mode == "local-native" {
            "builtin-local".to_string()
        } else {
            "sdkwork-cloud-app-api".to_string()
        },
        builtin_local: UserCenterBuiltinLocalIntegrationProfile {
            auth_mode: builtin_local_auth.mode.clone(),
            enabled: true,
            handshake_enabled: builtin_local_auth.handshake.enabled,
            kind: "builtin-local".to_string(),
            local_api_base_path: local_api_base_path.to_string(),
            secret_resolver_kind: builtin_local_auth.secret_resolution.resolver_kind.clone(),
            session_transport: "header".to_string(),
            user_system_scope: "application".to_string(),
            validation_strategy: builtin_local_auth.validation_strategy.clone(),
        },
        external_app_api: UserCenterExternalAppApiIntegrationProfile {
            auth_mode: external_app_api_auth.mode.clone(),
            enabled: external_enabled,
            handshake_enabled: external_enabled && external_app_api_auth.handshake.enabled,
            kind: "sdkwork-cloud-app-api".to_string(),
            provider_key: external_provider_key,
            secret_resolver_kind: external_app_api_auth
                .secret_resolution
                .resolver_kind
                .clone(),
            session_transport: "header".to_string(),
            upstream_base_url: provider.base_url.clone(),
            validation_strategy: external_app_api_auth.validation_strategy.clone(),
        },
    }
}

pub fn is_user_center_upstream_integration_active(
    integration: &UserCenterIntegrationProfileSet,
) -> bool {
    integration.active_kind == "sdkwork-cloud-app-api"
}

pub fn create_user_center_standard_handshake_headers(
    auth: &UserCenterAuthProfile,
) -> Vec<(String, String)> {
    if !auth.handshake.enabled {
        return Vec::new();
    }

    auth.handshake.static_headers.clone()
}

pub fn create_user_center_handshake_signing_message(
    auth: &UserCenterAuthProfile,
    method: &str,
    path: &str,
    signed_at: &str,
) -> Result<String, String> {
    if !auth.handshake.enabled {
        return Err(
            "User center handshake signing is unavailable when handshake is disabled.".to_string(),
        );
    }

    let app_id =
        resolve_static_handshake_header(auth, &auth.handshake.header_names.app_id_header_name)
            .ok_or_else(|| "User center handshake app id header is missing.".to_string())?;
    let provider_key = resolve_static_handshake_header(
        auth,
        &auth.handshake.header_names.provider_key_header_name,
    )
    .ok_or_else(|| "User center handshake provider key header is missing.".to_string())?;
    let handshake_mode =
        resolve_static_handshake_header(auth, USER_CENTER_HANDSHAKE_MODE_HEADER_NAME)
            .unwrap_or_else(|| auth.handshake.mode.trim().to_string());
    let normalized_handshake_mode = require_non_empty_text(&handshake_mode, "handshake mode")?;
    let normalized_method = require_non_empty_text(method, "handshake method")?.to_uppercase();
    let normalized_path = normalize_path(Some(path), "/");
    let normalized_signed_at = require_non_empty_text(signed_at, "handshake signed_at")?;

    Ok(vec![
        app_id,
        provider_key,
        normalized_handshake_mode,
        normalized_method,
        normalized_path,
        normalized_signed_at,
    ]
    .join("\n"))
}

pub fn create_user_center_signed_handshake_headers(
    auth: &UserCenterAuthProfile,
    signature: &UserCenterHandshakeSignature,
) -> Result<Vec<(String, String)>, String> {
    if !auth.handshake.enabled {
        return Ok(Vec::new());
    }

    let mut headers = create_user_center_standard_handshake_headers(auth);
    headers.push((
        auth.handshake.header_names.secret_id_header_name.clone(),
        require_non_empty_text(&signature.secret_id, "handshake secret_id")?,
    ));
    headers.push((
        auth.handshake.header_names.signature_header_name.clone(),
        require_non_empty_text(&signature.signature, "handshake signature")?,
    ));
    headers.push((
        auth.handshake.header_names.signed_at_header_name.clone(),
        require_non_empty_text(&signature.signed_at, "handshake signed_at")?,
    ));

    Ok(headers)
}

pub fn create_user_center_governed_header_names(auth: &UserCenterAuthProfile) -> Vec<String> {
    let mut governed_header_names = vec![
        auth.token_headers.authorization_header_name.to_lowercase(),
        auth.token_headers.access_token_header_name.to_lowercase(),
        auth.token_headers.refresh_token_header_name.to_lowercase(),
        auth.token_headers.session_header_name.to_lowercase(),
    ];

    if auth.handshake.enabled {
        governed_header_names.push(
            auth.handshake
                .header_names
                .app_id_header_name
                .to_lowercase(),
        );
        governed_header_names.push(USER_CENTER_HANDSHAKE_MODE_HEADER_NAME.to_lowercase());
        governed_header_names.push(
            auth.handshake
                .header_names
                .provider_key_header_name
                .to_lowercase(),
        );
        governed_header_names.push(
            auth.handshake
                .header_names
                .secret_id_header_name
                .to_lowercase(),
        );
        governed_header_names.push(
            auth.handshake
                .header_names
                .signature_header_name
                .to_lowercase(),
        );
        governed_header_names.push(
            auth.handshake
                .header_names
                .signed_at_header_name
                .to_lowercase(),
        );
    }

    governed_header_names
}

pub fn filter_user_center_governed_headers(
    auth: &UserCenterAuthProfile,
    headers: &[(String, String)],
) -> Vec<(String, String)> {
    let governed_header_names = create_user_center_governed_header_names(auth);

    headers
        .iter()
        .filter(|(header_name, _)| !governed_header_names.contains(&header_name.to_lowercase()))
        .cloned()
        .collect()
}

pub fn create_user_center_handshake_verification_context(
    auth: &UserCenterAuthProfile,
    headers: &[(String, String)],
    method: &str,
    path: &str,
    now_epoch_ms: i64,
    max_signed_at_age_ms: Option<u64>,
) -> Result<UserCenterHandshakeVerificationContext, String> {
    if !auth.handshake.enabled {
        return Err(
            "User center handshake verification is unavailable when handshake is disabled."
                .to_string(),
        );
    }

    let handshake = UserCenterHandshakeRequestHeaders {
        app_id: require_non_empty_text(
            &resolve_header_value(headers, &auth.handshake.header_names.app_id_header_name)
                .ok_or_else(|| {
                    "User center handshake app id must be a non-empty string.".to_string()
                })?,
            "handshake app id",
        )?,
        handshake_mode: require_non_empty_text(
            &resolve_header_value(headers, USER_CENTER_HANDSHAKE_MODE_HEADER_NAME).ok_or_else(
                || "User center handshake mode must be a non-empty string.".to_string(),
            )?,
            "handshake mode",
        )?,
        provider_key: require_non_empty_text(
            &resolve_header_value(
                headers,
                &auth.handshake.header_names.provider_key_header_name,
            )
            .ok_or_else(|| {
                "User center handshake provider key must be a non-empty string.".to_string()
            })?,
            "handshake provider key",
        )?,
        secret_id: require_non_empty_text(
            &resolve_header_value(headers, &auth.handshake.header_names.secret_id_header_name)
                .ok_or_else(|| {
                    "User center handshake secretId must be a non-empty string.".to_string()
                })?,
            "handshake secretId",
        )?,
        signature: require_non_empty_text(
            &resolve_header_value(headers, &auth.handshake.header_names.signature_header_name)
                .ok_or_else(|| {
                    "User center handshake signature must be a non-empty string.".to_string()
                })?,
            "handshake signature",
        )?,
        signed_at: require_non_empty_text(
            &resolve_header_value(headers, &auth.handshake.header_names.signed_at_header_name)
                .ok_or_else(|| {
                    "User center handshake signedAt must be a non-empty string.".to_string()
                })?,
            "handshake signedAt",
        )?,
    };

    let expected_app_id =
        resolve_static_handshake_header(auth, &auth.handshake.header_names.app_id_header_name)
            .ok_or_else(|| "User center handshake app id header is missing.".to_string())?;
    let expected_provider_key = resolve_static_handshake_header(
        auth,
        &auth.handshake.header_names.provider_key_header_name,
    )
    .ok_or_else(|| "User center handshake provider key header is missing.".to_string())?;
    let expected_handshake_mode =
        resolve_static_handshake_header(auth, USER_CENTER_HANDSHAKE_MODE_HEADER_NAME)
            .unwrap_or_else(|| auth.handshake.mode.trim().to_string());

    if handshake.app_id != expected_app_id {
        return Err(format!(
            "User center handshake app id mismatch: expected {}, received {}.",
            expected_app_id, handshake.app_id
        ));
    }
    if handshake.provider_key != expected_provider_key {
        return Err(format!(
            "User center handshake provider key mismatch: expected {}, received {}.",
            expected_provider_key, handshake.provider_key
        ));
    }
    if handshake.handshake_mode != expected_handshake_mode {
        return Err(format!(
            "User center handshake mode mismatch: expected {}, received {}.",
            expected_handshake_mode, handshake.handshake_mode
        ));
    }

    let signed_at_epoch_ms =
        parse_rfc3339_timestamp_ms(&handshake.signed_at, "handshake signedAt")?;
    let max_signed_at_age_ms = max_signed_at_age_ms.unwrap_or(auth.handshake.freshness_window_ms);
    let age_ms = now_epoch_ms.abs_diff(signed_at_epoch_ms);
    if age_ms > max_signed_at_age_ms {
        return Err(format!(
            "User center handshake signed-at freshness window exceeded: age {}ms > {}ms.",
            age_ms, max_signed_at_age_ms
        ));
    }

    Ok(UserCenterHandshakeVerificationContext {
        age_ms,
        handshake: handshake.clone(),
        signed_at_epoch_ms,
        signing_message: create_user_center_handshake_signing_message(
            auth,
            method,
            path,
            &handshake.signed_at,
        )?,
    })
}

pub fn create_default_user_center_runtime_config(namespace: &str) -> UserCenterRuntimeConfig {
    let normalized_namespace = normalize_namespace(namespace);
    let provider = UserCenterProviderConfig {
        base_url: None,
        headers: Vec::new(),
        kind: "local".to_string(),
        provider_key: format!("{normalized_namespace}-local"),
    };
    let mode = "local-native".to_string();
    let local_api_base_path = USER_CENTER_CANONICAL_LOCAL_API_BASE_PATH.to_string();
    let storage_plan = create_user_center_storage_plan(&normalized_namespace);
    let builtin_local_auth = create_user_center_auth_profile(
        &normalized_namespace,
        &provider,
        "local-native",
        &storage_plan,
    );
    let external_provider = UserCenterProviderConfig {
        base_url: provider.base_url.clone(),
        headers: provider.headers.clone(),
        kind: "sdkwork-cloud-app-api".to_string(),
        provider_key: format!("{normalized_namespace}-app-api"),
    };
    let external_app_api_auth = create_user_center_auth_profile(
        &normalized_namespace,
        &external_provider,
        "app-api-hub",
        &storage_plan,
    );

    UserCenterRuntimeConfig {
        auth: builtin_local_auth.clone(),
        capability: "user-center".to_string(),
        integration: create_user_center_integration_profiles(
            &normalized_namespace,
            &provider,
            &local_api_base_path,
            &mode,
            &builtin_local_auth,
            &external_app_api_auth,
        ),
        local_api: create_user_center_local_api_routes(Some(&local_api_base_path)),
        mode,
        namespace: normalized_namespace.clone(),
        provider,
        routes: create_default_user_center_routes(),
        schema_version: 1,
        storage_topology: create_default_user_center_storage_topology(&normalized_namespace),
        storage_plan,
    }
}
