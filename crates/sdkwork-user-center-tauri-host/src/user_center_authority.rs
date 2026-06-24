use std::{collections::BTreeMap, sync::Arc, time::Duration};

use crate::user_center_validation::{
    build_external_app_api_request_headers, resolve_external_app_api_handshake_config,
    ExternalAppApiConfig, ExternalAppApiRequestContext, PersistedUpstreamSessionState,
    USER_CENTER_ACCESS_TOKEN_HEADER_NAME,
};
use crate::{
    USER_CENTER_AUTHORIZATION_HEADER_NAME, USER_CENTER_AUTHORIZATION_SCHEME,
    USER_CENTER_SESSION_HEADER_NAME,
};
use argon2::{
    password_hash::{PasswordHash, PasswordHasher, PasswordVerifier, SaltString},
    Argon2,
};
use axum::http::HeaderMap;
use base64::{engine::general_purpose::URL_SAFE_NO_PAD, Engine as _};
use hmac::{Hmac, Mac};
use rusqlite::{params, types::ValueRef, Connection, OptionalExtension};
use serde::{de::DeserializeOwned, Deserialize, Serialize};
use serde_json::{Map, Value};
use sha2::Sha256;
use std::time::{SystemTime, UNIX_EPOCH};

const SDKWORK_USER_CENTER_MODE_ENV: &str = "SDKWORK_USER_CENTER_MODE";
const SDKWORK_USER_CENTER_PROVIDER_KEY_ENV: &str = "SDKWORK_USER_CENTER_PROVIDER_KEY";
const SDKWORK_USER_CENTER_EXTERNAL_ID_HEADER_ENV: &str = "SDKWORK_USER_CENTER_EXTERNAL_ID_HEADER";
const SDKWORK_USER_CENTER_EXTERNAL_EMAIL_HEADER_ENV: &str =
    "SDKWORK_USER_CENTER_EXTERNAL_EMAIL_HEADER";
const SDKWORK_USER_CENTER_EXTERNAL_NAME_HEADER_ENV: &str =
    "SDKWORK_USER_CENTER_EXTERNAL_NAME_HEADER";
const SDKWORK_USER_CENTER_EXTERNAL_AVATAR_HEADER_ENV: &str =
    "SDKWORK_USER_CENTER_EXTERNAL_AVATAR_HEADER";
const SDKWORK_USER_CENTER_APP_API_BASE_URL_ENV: &str = "SDKWORK_USER_CENTER_APP_API_BASE_URL";
const SDKWORK_USER_CENTER_APP_API_TIMEOUT_MS_ENV: &str = "SDKWORK_USER_CENTER_APP_API_TIMEOUT_MS";
const SDKWORK_USER_CENTER_APP_ID_ENV: &str = "SDKWORK_USER_CENTER_APP_ID";
const SDKWORK_USER_CENTER_SECRET_ID_ENV: &str = "SDKWORK_USER_CENTER_SECRET_ID";
const SDKWORK_USER_CENTER_SHARED_SECRET_ENV: &str = "SDKWORK_USER_CENTER_SHARED_SECRET";
const SDKWORK_USER_CENTER_APP_API_OAUTH_PROVIDERS_ENV: &str =
    "SDKWORK_USER_CENTER_APP_API_OAUTH_PROVIDERS";
const SDKWORK_USER_CENTER_OAUTH_PROVIDERS_ENV: &str = "SDKWORK_USER_CENTER_OAUTH_PROVIDERS";
const SDKWORK_USER_CENTER_OAUTH_CODE_SECRET_ENV: &str = "SDKWORK_USER_CENTER_OAUTH_CODE_SECRET";
const SDKWORK_USER_CENTER_OAUTH_CODE_TTL_SECONDS_ENV: &str =
    "SDKWORK_USER_CENTER_OAUTH_CODE_TTL_SECONDS";
const SDKWORK_USER_CENTER_EXTERNAL_TENANT_HEADER_ENV: &str =
    "SDKWORK_USER_CENTER_EXTERNAL_TENANT_HEADER";
const SDKWORK_USER_CENTER_EXTERNAL_ORGANIZATION_HEADER_ENV: &str =
    "SDKWORK_USER_CENTER_EXTERNAL_ORGANIZATION_HEADER";

const USER_CENTER_SQLITE_SCHEMA: &str = r#"
CREATE TABLE IF NOT EXISTS iam_tenant (
    id INTEGER PRIMARY KEY,
    uuid TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    version INTEGER NOT NULL DEFAULT 0,
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL DEFAULT 'PLATFORM',
    biz_type TEXT NULL,
    biz_id INTEGER NULL,
    jwt_secret_key TEXT NOT NULL,
    token_expiration_ms INTEGER NULL,
    refresh_token_expiration_ms INTEGER NULL,
    status TEXT NOT NULL,
    description TEXT NULL,
    admin_user_id INTEGER NULL,
    install_app_list TEXT NULL,
    expire_time TEXT NULL,
    metadata TEXT NULL,
    contact_person TEXT NULL,
    contact_phone TEXT NULL,
    is_deleted INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS iam_organization (
    id INTEGER PRIMARY KEY,
    uuid TEXT NOT NULL UNIQUE,
    tenant_id INTEGER NOT NULL DEFAULT 0,
    organization_id INTEGER NOT NULL DEFAULT 0,
    data_scope INTEGER NOT NULL DEFAULT 1,
    parent_id INTEGER NULL,
    parent_uuid TEXT NULL,
    parent_metadata TEXT NULL,
    name TEXT NOT NULL,
    jwt_secret_key TEXT NOT NULL UNIQUE,
    token_expiration_ms INTEGER NULL,
    refresh_token_expiration_ms INTEGER NULL,
    code TEXT NOT NULL UNIQUE,
    install_app_list TEXT NULL,
    status INTEGER NOT NULL DEFAULT 1,
    metadata TEXT NULL,
    description TEXT NULL,
    contact_person TEXT NULL,
    contact_phone TEXT NULL,
    contact_email TEXT NULL,
    address TEXT NULL,
    website TEXT NULL,
    logo_media_resource_id TEXT NULL,
    logo_object_blob_id INTEGER NULL,
    logo_resource_snapshot TEXT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    version INTEGER NOT NULL DEFAULT 0,
    is_deleted INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_iam_organization_status
ON iam_organization(status, is_deleted);

CREATE INDEX IF NOT EXISTS idx_iam_organization_parent_id
ON iam_organization(parent_id, is_deleted);

CREATE TABLE IF NOT EXISTS iam_organization_membership (
    id INTEGER PRIMARY KEY,
    uuid TEXT NOT NULL UNIQUE,
    tenant_id INTEGER NOT NULL DEFAULT 0,
    organization_id INTEGER NOT NULL DEFAULT 0,
    data_scope INTEGER NOT NULL DEFAULT 1,
    user_id INTEGER NOT NULL,
    membership_kind TEXT NOT NULL DEFAULT 'employee',
    employee_no TEXT NULL,
    display_name TEXT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    joined_at TEXT NULL,
    left_at TEXT NULL,
    remark TEXT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    version INTEGER NOT NULL DEFAULT 0,
    is_deleted INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_iam_org_membership_user
ON iam_organization_membership(tenant_id, user_id, status, is_deleted);

CREATE INDEX IF NOT EXISTS idx_iam_org_membership_org
ON iam_organization_membership(tenant_id, organization_id, status, is_deleted);

CREATE UNIQUE INDEX IF NOT EXISTS idx_iam_org_membership_org_user
ON iam_organization_membership(tenant_id, organization_id, user_id);

CREATE TABLE IF NOT EXISTS iam_department_assignment (
    id INTEGER PRIMARY KEY,
    uuid TEXT NOT NULL UNIQUE,
    tenant_id INTEGER NOT NULL DEFAULT 0,
    organization_id INTEGER NOT NULL DEFAULT 0,
    data_scope INTEGER NOT NULL DEFAULT 1,
    organization_membership_id INTEGER NOT NULL,
    department_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    assignment_kind TEXT NOT NULL DEFAULT 'member',
    is_primary INTEGER NOT NULL DEFAULT 0,
    effective_from TEXT NULL,
    effective_to TEXT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    sort_order INTEGER NULL,
    remark TEXT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    version INTEGER NOT NULL DEFAULT 0,
    is_deleted INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_iam_department_assignment_membership
ON iam_department_assignment(tenant_id, organization_membership_id, status, is_deleted);

CREATE INDEX IF NOT EXISTS idx_iam_department_assignment_department
ON iam_department_assignment(tenant_id, organization_id, department_id, status, is_deleted);

CREATE INDEX IF NOT EXISTS idx_iam_department_assignment_user
ON iam_department_assignment(tenant_id, user_id, status, is_deleted);

CREATE TABLE IF NOT EXISTS iam_position_assignment (
    id INTEGER PRIMARY KEY,
    uuid TEXT NOT NULL UNIQUE,
    tenant_id INTEGER NOT NULL DEFAULT 0,
    organization_id INTEGER NOT NULL DEFAULT 0,
    data_scope INTEGER NOT NULL DEFAULT 1,
    department_assignment_id INTEGER NOT NULL,
    position_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    is_primary INTEGER NOT NULL DEFAULT 0,
    effective_from TEXT NULL,
    effective_to TEXT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    remark TEXT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    version INTEGER NOT NULL DEFAULT 0,
    is_deleted INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_iam_position_assignment_department
ON iam_position_assignment(tenant_id, department_assignment_id, status, is_deleted);

CREATE INDEX IF NOT EXISTS idx_iam_position_assignment_position
ON iam_position_assignment(tenant_id, organization_id, position_id, status, is_deleted);

CREATE INDEX IF NOT EXISTS idx_iam_position_assignment_user
ON iam_position_assignment(tenant_id, user_id, status, is_deleted);

CREATE TABLE IF NOT EXISTS iam_role_binding (
    id INTEGER PRIMARY KEY,
    uuid TEXT NOT NULL UNIQUE,
    tenant_id INTEGER NOT NULL DEFAULT 0,
    organization_id INTEGER NOT NULL DEFAULT 0,
    data_scope INTEGER NOT NULL DEFAULT 1,
    role_id INTEGER NOT NULL,
    principal_kind TEXT NOT NULL,
    principal_id INTEGER NOT NULL,
    scope_kind TEXT NOT NULL,
    scope_id INTEGER NOT NULL,
    effect TEXT NOT NULL DEFAULT 'allow',
    condition_json TEXT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    version INTEGER NOT NULL DEFAULT 0,
    is_deleted INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_iam_role_binding_principal
ON iam_role_binding(tenant_id, organization_id, principal_kind, principal_id, status, is_deleted);

CREATE INDEX IF NOT EXISTS idx_iam_role_binding_scope
ON iam_role_binding(tenant_id, organization_id, scope_kind, scope_id, status, is_deleted);

CREATE INDEX IF NOT EXISTS idx_iam_role_binding_role
ON iam_role_binding(tenant_id, organization_id, role_id, status, is_deleted);

CREATE TABLE IF NOT EXISTS iam_role (
    id INTEGER PRIMARY KEY,
    uuid TEXT NOT NULL UNIQUE,
    tenant_id INTEGER NOT NULL DEFAULT 0,
    organization_id INTEGER NOT NULL DEFAULT 0,
    data_scope INTEGER NOT NULL DEFAULT 1,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT NULL,
    status INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    version INTEGER NOT NULL DEFAULT 0,
    is_deleted INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS iam_permission (
    id INTEGER PRIMARY KEY,
    uuid TEXT NOT NULL UNIQUE,
    tenant_id INTEGER NOT NULL DEFAULT 0,
    organization_id INTEGER NOT NULL DEFAULT 0,
    data_scope INTEGER NOT NULL DEFAULT 1,
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    description TEXT NULL,
    status INTEGER NOT NULL,
    sort_order INTEGER NULL,
    resource_url TEXT NULL,
    http_method TEXT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    version INTEGER NOT NULL DEFAULT 0,
    is_deleted INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS iam_role_permission (
    id INTEGER PRIMARY KEY,
    uuid TEXT NULL,
    tenant_id INTEGER NOT NULL DEFAULT 0,
    organization_id INTEGER NOT NULL DEFAULT 0,
    data_scope INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    role_id INTEGER NOT NULL,
    role_uuid TEXT NOT NULL,
    permission_id INTEGER NOT NULL,
    permission_uuid TEXT NOT NULL,
    status INTEGER NOT NULL DEFAULT 1,
    description TEXT NULL,
    operator_id INTEGER NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_role_permission1
ON iam_role_permission(tenant_id, organization_id, role_id, permission_id);

CREATE TABLE IF NOT EXISTS iam_user (
    id INTEGER PRIMARY KEY,
    uuid TEXT NOT NULL UNIQUE,
    tenant_id INTEGER NOT NULL DEFAULT 0,
    organization_id INTEGER NOT NULL DEFAULT 0,
    data_scope INTEGER NOT NULL DEFAULT 1,
    username TEXT NOT NULL UNIQUE,
    nickname TEXT NOT NULL,
    salt TEXT NULL,
    platform TEXT NOT NULL,
    type TEXT NOT NULL,
    gender TEXT NULL,
    face_image TEXT NULL,
    face_video TEXT NULL,
    scene TEXT NULL,
    email TEXT NULL UNIQUE,
    phone TEXT NULL,
    country_code TEXT NULL,
    province_code TEXT NULL,
    city_code TEXT NULL,
    district_code TEXT NULL,
    address TEXT NULL,
    bio TEXT NULL,
    birth_date TEXT NULL,
    oauth_user_info TEXT NULL,
    metadata TEXT NULL,
    social_info_list TEXT NULL,
    avatar_resource_snapshot TEXT NULL,
    provider_key TEXT NOT NULL,
    external_subject TEXT NULL,
    metadata_json TEXT NULL,
    status TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    version INTEGER NOT NULL DEFAULT 0,
    is_deleted INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS iam_credential (
    id INTEGER PRIMARY KEY,
    uuid TEXT NOT NULL UNIQUE,
    tenant_id INTEGER NOT NULL DEFAULT 0,
    organization_id INTEGER NOT NULL DEFAULT 0,
    data_scope INTEGER NOT NULL DEFAULT 1,
    user_id INTEGER NOT NULL,
    credential_type TEXT NOT NULL,
    credential_hash TEXT NOT NULL,
    status TEXT NOT NULL,
    expires_at TEXT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    version INTEGER NOT NULL DEFAULT 0,
    is_deleted INTEGER NOT NULL DEFAULT 0,
    UNIQUE (tenant_id, user_id, credential_type)
);

CREATE INDEX IF NOT EXISTS idx_iam_credential_tenant_user_type
ON iam_credential(tenant_id, user_id, credential_type, status);

CREATE TABLE IF NOT EXISTS iam_user_identity (
    id INTEGER PRIMARY KEY,
    uuid TEXT NOT NULL UNIQUE,
    tenant_id INTEGER NOT NULL DEFAULT 0,
    organization_id INTEGER NOT NULL DEFAULT 0,
    data_scope INTEGER NOT NULL DEFAULT 1,
    user_id INTEGER NOT NULL,
    oauth_provider TEXT NOT NULL,
    open_id TEXT NOT NULL,
    union_id TEXT NULL,
    app_id TEXT NULL,
    channel_account_id INTEGER NULL,
    access_token_expires_at TEXT NULL,
    oauth_user_info TEXT NULL,
    oauth_user_info_json TEXT NULL,
    status TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    version INTEGER NOT NULL DEFAULT 0,
    is_deleted INTEGER NOT NULL DEFAULT 0,
    UNIQUE (oauth_provider, open_id),
    UNIQUE (oauth_provider, union_id)
);

CREATE TABLE IF NOT EXISTS iam_api_key (
    id INTEGER PRIMARY KEY,
    uuid TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    v INTEGER NOT NULL DEFAULT 0,
    tenant_id INTEGER NOT NULL DEFAULT 0,
    organization_id INTEGER NOT NULL DEFAULT 0,
    data_scope INTEGER NOT NULL DEFAULT 1,
    user_id INTEGER NULL,
    name TEXT NOT NULL,
    key_value TEXT NOT NULL,
    key_type INTEGER NOT NULL,
    owner INTEGER NULL,
    status INTEGER NOT NULL,
    expire_time TEXT NULL,
    description TEXT NULL,
    last_used_time TEXT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS uk_iam_api_key_key_value
ON iam_api_key(key_value);

CREATE INDEX IF NOT EXISTS idx_iam_api_key_user
ON iam_api_key(user_id);

CREATE INDEX IF NOT EXISTS idx_iam_api_key_status
ON iam_api_key(status);

CREATE INDEX IF NOT EXISTS idx_iam_api_key_tenant_user_status
ON iam_api_key(tenant_id, organization_id, user_id, status);

CREATE TABLE IF NOT EXISTS iam_session (
    id INTEGER PRIMARY KEY,
    uuid TEXT NOT NULL UNIQUE,
    tenant_id INTEGER NOT NULL DEFAULT 0,
    organization_id INTEGER NOT NULL DEFAULT 0,
    user_id INTEGER NOT NULL,
    provider_key TEXT NOT NULL,
    provider_mode TEXT NOT NULL,
    upstream_auth_token TEXT NULL,
    upstream_access_token TEXT NULL,
    upstream_refresh_token TEXT NULL,
    upstream_token_type TEXT NULL,
    upstream_user_id TEXT NULL,
    upstream_payload_json TEXT NULL,
    status TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    version INTEGER NOT NULL DEFAULT 0,
    is_deleted INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS iam_login_qr (
    id INTEGER PRIMARY KEY,
    uuid TEXT NOT NULL UNIQUE,
    tenant_id INTEGER NOT NULL DEFAULT 0,
    organization_id INTEGER NOT NULL DEFAULT 0,
    provider_key TEXT NOT NULL,
    qr_key TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL,
    session_id INTEGER NULL,
    user_id INTEGER NULL,
    scanned_at TEXT NULL,
    confirmed_at TEXT NULL,
    expires_at TEXT NOT NULL,
    metadata_json TEXT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    version INTEGER NOT NULL DEFAULT 0,
    is_deleted INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_iam_login_qr_lookup
ON iam_login_qr(qr_key, status, expires_at, is_deleted);
"#;

const DEFAULT_EXTERNAL_APP_API_TIMEOUT_MS: u64 = 8_000;
const DEFAULT_EXTERNAL_APP_API_OAUTH_PROVIDERS: &[&str] = &["wechat", "douyin", "github"];
const DEFAULT_LOCAL_TENANT_ID: &str = "0";
const DEFAULT_LOCAL_ORGANIZATION_ID: &str = "0";
const CANONICAL_IAM_TENANT_ID: &str = "100001";
const CANONICAL_IAM_TENANT_CODE: &str = "SDKWORK";
const CANONICAL_IAM_TENANT_NAME: &str = "SDKWork";
const CANONICAL_IAM_ORGANIZATION_ID: &str = "0";
const CANONICAL_IAM_ORGANIZATION_CODE: &str = "root";
const CANONICAL_IAM_ORGANIZATION_NAME: &str = "Root Organization";
const DEFAULT_LOGIN_QR_TTL_SECONDS: u64 = 300;
const DEFAULT_LOCAL_OAUTH_CODE_TTL_SECONDS: u64 = 300;
const LOCAL_USER_CENTER_TOKEN_ENVIRONMENT: &str = "local";
const LOCAL_USER_CENTER_TOKEN_DEPLOYMENT_MODE: &str = "local";
const LOCAL_USER_CENTER_TOKEN_ISSUER: &str = "sdkwork-user-center-local";
const LOCAL_USER_CENTER_TOKEN_TTL_SECONDS: i64 = 7 * 24 * 60 * 60;
const LEGACY_LOCAL_PHONE_SHADOW_EMAIL_SUFFIX: &str = "@sms.sdkwork-user-center.local";

#[derive(Clone)]
enum UserCenterMode {
    Local,
    External,
}

#[derive(Clone)]
enum ExternalUserCenterIntegrationKind {
    Headers,
    SdkworkCloudAppApi,
}

fn resolve_user_center_public_mode(
    mode: &UserCenterMode,
    external_integration: &ExternalUserCenterIntegrationKind,
) -> &'static str {
    match mode {
        UserCenterMode::Local => "builtin-local",
        UserCenterMode::External => match external_integration {
            ExternalUserCenterIntegrationKind::Headers => "external-user-center",
            ExternalUserCenterIntegrationKind::SdkworkCloudAppApi => "sdkwork-cloud-app-api",
        },
    }
}

#[derive(Clone)]
struct ExternalHeaderConfig {
    avatar_header: String,
    email_header: String,
    id_header: String,
    name_header: String,
    organization_header: String,
    tenant_header: String,
}

#[derive(Clone)]
struct UserCenterResolvedConfig {
    app_id: String,
    configuration_error: Option<String>,
    external_app_api: Option<ExternalAppApiConfig>,
    external_headers: ExternalHeaderConfig,
    external_integration: ExternalUserCenterIntegrationKind,
    mode: UserCenterMode,
    provider_key: String,
}

#[derive(Clone, Debug, PartialEq, Eq)]
struct LocalBootstrapScope {
    organization_id: Option<String>,
    tenant_id: String,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct UserCenterMediaResource {
    pub kind: String,
    pub source: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub public_url: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub uri: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub url: Option<String>,
}

#[derive(Clone)]
struct UserRecord {
    avatar: Option<UserCenterMediaResource>,
    created_at: String,
    display_name: String,
    email: Option<String>,
    external_subject: Option<String>,
    id: String,
    metadata_json: Option<String>,
    organization_id: Option<String>,
    phone: Option<String>,
    provider_key: String,
    status: String,
    tenant_id: Option<String>,
    updated_at: String,
    uuid: String,
}

#[derive(Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
struct LocalOAuthAuthorizationCodeClaims {
    avatar: Option<UserCenterMediaResource>,
    email: String,
    expires_at: i64,
    issued_at: i64,
    name: String,
    phone: Option<String>,
    provider: String,
    subject: String,
}

#[derive(Clone)]
struct LocalOAuthProviderProfile {
    avatar: Option<UserCenterMediaResource>,
    email: String,
    name: String,
    phone: Option<String>,
    provider: String,
    subject: String,
}

#[derive(Clone)]
struct LocalOAuthAuthority {
    code_secret: String,
    code_ttl: Duration,
    provider_order: Vec<String>,
    providers: BTreeMap<String, LocalOAuthProviderProfile>,
}

#[derive(Clone)]
struct UserSessionRecord {
    created_at: String,
    id: String,
    provider_mode: String,
    provider_key: String,
    status: String,
    upstream_access_token: Option<String>,
    upstream_auth_token: Option<String>,
    upstream_payload_json: Option<String>,
    upstream_refresh_token: Option<String>,
    upstream_token_type: Option<String>,
    upstream_user_id: Option<String>,
    updated_at: String,
    user_id: String,
}

#[derive(Clone)]
struct LocalCredentialRecord {
    password_hash: String,
    status: String,
}

#[derive(Clone)]
struct UserProfileRecord {
    bio: Option<String>,
    company: Option<String>,
    location: Option<String>,
    website: Option<String>,
}

#[derive(Clone)]
struct LoginQrRecord {
    expires_at: String,
    id: String,
    qr_key: String,
    session_id: Option<String>,
    status: String,
    user_id: Option<String>,
}

#[derive(Clone)]
struct UserCenterSessionTokens {
    access_token: String,
    auth_token: String,
    refresh_token: Option<String>,
    token_type: String,
}

#[derive(Serialize)]
struct UserCenterTokenHeader {
    alg: &'static str,
    kid: String,
    typ: &'static str,
}

#[derive(Serialize)]
struct UserCenterTokenClaims {
    aud: String,
    app_id: String,
    deployment_mode: String,
    exp: i64,
    iat: i64,
    iss: String,
    login_scope: String,
    organization_id: String,
    session_id: String,
    sid: String,
    sub: String,
    tenant_id: String,
    token_type: String,
    token_version: u32,
    user_id: String,
    environment: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    data_scope: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    permission_scope: Option<String>,
}

#[derive(Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UserCenterLoginRequest {
    pub account: Option<String>,
    pub email: Option<String>,
    pub password: Option<String>,
}

#[derive(Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UserCenterRegisterRequest {
    pub channel: Option<String>,
    pub confirm_password: Option<String>,
    pub email: Option<String>,
    pub name: Option<String>,
    pub password: Option<String>,
    pub phone: Option<String>,
    pub tenant_id: Option<String>,
    pub username: Option<String>,
    pub verification_code: Option<String>,
}

#[derive(Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UserCenterEmailCodeLoginRequest {
    pub app_version: Option<String>,
    pub code: String,
    pub device_id: Option<String>,
    pub device_name: Option<String>,
    pub device_type: Option<String>,
    pub email: String,
}

#[derive(Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UserCenterPhoneCodeLoginRequest {
    pub app_version: Option<String>,
    pub code: String,
    pub device_id: Option<String>,
    pub device_name: Option<String>,
    pub device_type: Option<String>,
    pub phone: String,
}

#[derive(Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UserCenterPasswordResetChallengeRequest {
    pub account: String,
    pub channel: String,
}

#[derive(Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UserCenterPasswordResetRequest {
    pub account: String,
    pub code: String,
    pub confirm_password: Option<String>,
    pub new_password: String,
}

#[derive(Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UserCenterOAuthAuthorizationRequest {
    pub provider: String,
    pub redirect_uri: String,
    pub scope: Option<String>,
    pub state: Option<String>,
}

#[derive(Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UserCenterOAuthLoginRequest {
    pub code: String,
    pub device_id: Option<String>,
    pub device_type: Option<String>,
    pub provider: String,
    pub state: Option<String>,
}

#[derive(Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UserCenterSessionExchangeRequest {
    pub avatar: Option<UserCenterMediaResource>,
    pub email: String,
    pub organization_id: Option<String>,
    pub tenant_id: Option<String>,
    pub user_id: Option<String>,
    pub name: Option<String>,
    pub provider_key: Option<String>,
    pub subject: Option<String>,
}

#[derive(Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UserCenterLoginQrConfirmRequest {
    pub qr_key: String,
}

#[derive(Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateUserCenterProfileRequest {
    pub avatar: Option<UserCenterMediaResource>,
    pub bio: Option<String>,
    pub company: Option<String>,
    pub display_name: Option<String>,
    pub location: Option<String>,
    pub website: Option<String>,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct UserCenterUserPayload {
    pub uuid: String,
    pub tenant_id: Option<String>,
    pub organization_id: Option<String>,
    pub created_at: String,
    pub updated_at: String,
    pub avatar: Option<UserCenterMediaResource>,
    pub email: String,
    pub id: String,
    pub name: String,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct UserCenterTenantChoicePayload {
    pub tenant_id: String,
    pub name: String,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct UserCenterSessionPayload {
    pub access_token: String,
    pub auth_token: String,
    pub uuid: String,
    pub tenant_id: Option<String>,
    pub organization_id: Option<String>,
    pub created_at: String,
    pub provider_key: String,
    pub provider_mode: String,
    pub refresh_token: Option<String>,
    pub session_id: String,
    pub token_type: String,
    pub updated_at: String,
    pub user: UserCenterUserPayload,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub challenge_type: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub continuation_token: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub expires_at: Option<i64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tenants: Option<Vec<UserCenterTenantChoicePayload>>,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct UserCenterLoginQrCodePayload {
    pub description: Option<String>,
    pub expire_time: Option<i64>,
    pub qr_content: Option<String>,
    pub qr_key: String,
    pub qr_url: Option<String>,
    pub title: Option<String>,
    #[serde(rename = "type")]
    pub qr_type: Option<String>,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct UserCenterLoginQrStatusPayload {
    pub session: Option<UserCenterSessionPayload>,
    pub status: String,
    pub user: Option<UserCenterUserPayload>,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct UserCenterOAuthUrlPayload {
    pub auth_url: String,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct UserCenterVerificationPolicyPayload {
    pub email_code_login_enabled: bool,
    pub email_registration_verification_required: bool,
    pub phone_code_login_enabled: bool,
    pub phone_registration_verification_required: bool,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct UserCenterMetadataPayload {
    pub integration_kind: String,
    pub login_methods: Vec<String>,
    pub mode: String,
    pub oauth_login_enabled: bool,
    pub oauth_providers: Vec<String>,
    pub provider_key: String,
    pub qr_login_enabled: bool,
    pub recovery_methods: Vec<String>,
    pub register_methods: Vec<String>,
    pub session_header_name: &'static str,
    pub supports_local_credentials: bool,
    pub supports_profile_write: bool,
    pub supports_session_exchange: bool,
    pub upstream_base_url: Option<String>,
    pub verification_policy: UserCenterVerificationPolicyPayload,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct UserCenterProfilePayload {
    pub uuid: String,
    pub tenant_id: Option<String>,
    pub organization_id: Option<String>,
    pub created_at: String,
    pub updated_at: String,
    pub avatar: Option<UserCenterMediaResource>,
    pub bio: String,
    pub company: String,
    pub display_name: String,
    pub email: String,
    pub user_id: String,
    pub location: String,
    pub website: String,
}

#[derive(Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
struct UpstreamPlusApiEnvelope<T> {
    code: Option<String>,
    data: Option<T>,
    error_name: Option<String>,
    msg: Option<String>,
}

#[derive(Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
struct UpstreamAppApiLoginPayload {
    access_token: Option<String>,
    auth_token: Option<String>,
    expires_in: Option<i64>,
    refresh_token: Option<String>,
    token_type: Option<String>,
    user_info: Option<UpstreamAppApiUserInfoPayload>,
}

#[derive(Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
struct UpstreamAppApiUserInfoPayload {
    avatar: Option<String>,
    email: Option<String>,
    id: Option<Value>,
    nickname: Option<String>,
    phone: Option<String>,
    status: Option<String>,
    username: Option<String>,
}

#[derive(Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
struct UpstreamAppApiUserProfilePayload {
    avatar: Option<String>,
    bio: Option<String>,
    email: Option<String>,
    interests: Option<String>,
    nickname: Option<String>,
    occupation: Option<String>,
    phone: Option<String>,
    region: Option<String>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct UpstreamAppApiLoginRequestPayload {
    password: String,
    username: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct UpstreamAppApiRefreshRequestPayload {
    refresh_token: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct UpstreamAppApiRegisterRequestPayload {
    confirm_password: String,
    email: Option<String>,
    password: String,
    phone: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    tenant_id: Option<String>,
    #[serde(rename = "type")]
    user_type: String,
    username: String,
    verification_code: Option<String>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct UpstreamAppApiUpdateProfileRequestPayload {
    avatar: Option<String>,
    bio: Option<String>,
    email: Option<String>,
    nickname: Option<String>,
    region: Option<String>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct UpstreamAppApiEmailCodeLoginRequestPayload {
    app_version: Option<String>,
    code: String,
    device_id: Option<String>,
    device_name: Option<String>,
    device_type: Option<String>,
    email: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct UpstreamAppApiPhoneCodeLoginRequestPayload {
    app_version: Option<String>,
    code: String,
    device_id: Option<String>,
    device_name: Option<String>,
    device_type: Option<String>,
    phone: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct UpstreamAppApiPasswordResetChallengeRequestPayload {
    account: String,
    channel: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct UpstreamAppApiPasswordResetRequestPayload {
    account: String,
    code: String,
    confirm_password: Option<String>,
    new_password: String,
}

#[derive(Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
struct UpstreamAppApiOAuthUrlPayload {
    auth_url: Option<String>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct UpstreamAppApiOAuthAuthorizationRequestPayload {
    provider: String,
    redirect_uri: String,
    scope: Option<String>,
    state: Option<String>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct UpstreamAppApiOAuthLoginRequestPayload {
    code: String,
    device_id: Option<String>,
    device_type: Option<String>,
    provider: String,
    state: Option<String>,
}

trait UserCenterProvider: Send + Sync {
    fn exchange_session(
        &self,
        connection: &mut Connection,
        request: &UserCenterSessionExchangeRequest,
    ) -> Result<UserCenterSessionPayload, String>;

    fn get_oauth_authorization_url(
        &self,
        _request: &UserCenterOAuthAuthorizationRequest,
    ) -> Result<UserCenterOAuthUrlPayload, String> {
        Err("OAuth authorization is not enabled for the configured user center.".to_owned())
    }

    fn login_with_email_code(
        &self,
        _connection: &mut Connection,
        _request: &UserCenterEmailCodeLoginRequest,
    ) -> Result<UserCenterSessionPayload, String> {
        Err(
            "Email verification-code login is not enabled for the configured user center."
                .to_owned(),
        )
    }

    fn login_with_oauth(
        &self,
        _connection: &mut Connection,
        _request: &UserCenterOAuthLoginRequest,
    ) -> Result<UserCenterSessionPayload, String> {
        Err("OAuth login is not enabled for the configured user center.".to_owned())
    }

    fn login_with_phone_code(
        &self,
        _connection: &mut Connection,
        _request: &UserCenterPhoneCodeLoginRequest,
    ) -> Result<UserCenterSessionPayload, String> {
        Err(
            "Phone verification-code login is not enabled for the configured user center."
                .to_owned(),
        )
    }

    fn login(
        &self,
        connection: &mut Connection,
        request: &UserCenterLoginRequest,
    ) -> Result<UserCenterSessionPayload, String>;

    fn logout(&self, connection: &mut Connection, session_id: Option<&str>) -> Result<(), String>;

    fn metadata(&self) -> UserCenterMetadataPayload;

    fn request_password_reset(
        &self,
        _connection: &mut Connection,
        _request: &UserCenterPasswordResetChallengeRequest,
    ) -> Result<(), String> {
        Err("Password reset is not enabled for the configured user center.".to_owned())
    }

    fn read_profile(
        &self,
        connection: &mut Connection,
        session: &UserCenterSessionPayload,
    ) -> Result<UserCenterProfilePayload, String>;

    fn register(
        &self,
        connection: &mut Connection,
        request: &UserCenterRegisterRequest,
    ) -> Result<UserCenterSessionPayload, String>;

    fn reset_password(
        &self,
        _connection: &mut Connection,
        _request: &UserCenterPasswordResetRequest,
    ) -> Result<(), String> {
        Err("Password reset confirmation is not enabled for the configured user center.".to_owned())
    }

    fn resolve_session(
        &self,
        connection: &Connection,
        headers: &HeaderMap,
    ) -> Result<Option<UserCenterSessionPayload>, String>;

    fn update_profile(
        &self,
        connection: &mut Connection,
        session: &UserCenterSessionPayload,
        request: &UpdateUserCenterProfileRequest,
    ) -> Result<UserCenterProfilePayload, String>;
}

#[derive(Clone)]
pub struct UserCenterState {
    provider: Arc<dyn UserCenterProvider>,
}

impl UserCenterState {
    pub fn from_env() -> Self {
        let resolved = resolve_user_center_config_from_env();
        if let Some(configuration_error) = resolved.configuration_error.clone() {
            return Self {
                provider: Arc::new(MisconfiguredUserCenterProvider::new(
                    resolved.mode,
                    resolved.external_integration,
                    resolved.provider_key,
                    configuration_error,
                )),
            };
        }

        let provider: Arc<dyn UserCenterProvider> = match resolved.mode {
            UserCenterMode::Local => Arc::new(LocalUserCenterProvider::new(
                resolved.app_id.clone(),
                resolved.provider_key.clone(),
            )),
            UserCenterMode::External => match resolved.external_integration {
                ExternalUserCenterIntegrationKind::Headers => {
                    Arc::new(HeaderExternalUserCenterProvider::new(
                        resolved.app_id.clone(),
                        resolved.provider_key.clone(),
                        resolved.external_headers.clone(),
                    ))
                }
                ExternalUserCenterIntegrationKind::SdkworkCloudAppApi => {
                    if let Some(config) = resolved.external_app_api.clone() {
                        Arc::new(SdkworkCloudAppApiExternalUserCenterProvider::new(
                            resolved.provider_key.clone(),
                            config,
                        ))
                    } else {
                        Arc::new(MisconfiguredUserCenterProvider::new(
                            UserCenterMode::External,
                            ExternalUserCenterIntegrationKind::SdkworkCloudAppApi,
                            resolved.provider_key.clone(),
                            format!(
                                "{} is required when sdkwork-cloud-app-api integration is enabled.",
                                SDKWORK_USER_CENTER_APP_API_BASE_URL_ENV
                            ),
                        ))
                    }
                }
            },
        };

        Self { provider }
    }

    pub fn exchange_session(
        &self,
        connection: &mut Connection,
        request: &UserCenterSessionExchangeRequest,
    ) -> Result<UserCenterSessionPayload, String> {
        self.provider.exchange_session(connection, request)
    }

    pub fn get_oauth_authorization_url(
        &self,
        request: &UserCenterOAuthAuthorizationRequest,
    ) -> Result<UserCenterOAuthUrlPayload, String> {
        self.provider.get_oauth_authorization_url(request)
    }

    pub fn login(
        &self,
        connection: &mut Connection,
        request: &UserCenterLoginRequest,
    ) -> Result<UserCenterSessionPayload, String> {
        self.provider.login(connection, request)
    }

    pub fn login_with_email_code(
        &self,
        connection: &mut Connection,
        request: &UserCenterEmailCodeLoginRequest,
    ) -> Result<UserCenterSessionPayload, String> {
        self.provider.login_with_email_code(connection, request)
    }

    pub fn login_with_oauth(
        &self,
        connection: &mut Connection,
        request: &UserCenterOAuthLoginRequest,
    ) -> Result<UserCenterSessionPayload, String> {
        self.provider.login_with_oauth(connection, request)
    }

    pub fn login_with_phone_code(
        &self,
        connection: &mut Connection,
        request: &UserCenterPhoneCodeLoginRequest,
    ) -> Result<UserCenterSessionPayload, String> {
        self.provider.login_with_phone_code(connection, request)
    }

    pub fn logout(
        &self,
        connection: &mut Connection,
        session_id: Option<&str>,
    ) -> Result<(), String> {
        self.provider.logout(connection, session_id)
    }

    pub fn metadata(&self) -> UserCenterMetadataPayload {
        self.provider.metadata()
    }

    pub fn generate_login_qr_code(
        &self,
        connection: &mut Connection,
        request_base_url: Option<&str>,
    ) -> Result<UserCenterLoginQrCodePayload, String> {
        let metadata = self.metadata();
        let record = create_login_qr_record(
            connection,
            &metadata.provider_key,
            Duration::from_secs(DEFAULT_LOGIN_QR_TTL_SECONDS),
        )?;
        Ok(build_login_qr_code_payload(&record, request_base_url))
    }

    pub fn resolve_login_qr_status(
        &self,
        connection: &mut Connection,
        qr_key: &str,
    ) -> Result<UserCenterLoginQrStatusPayload, String> {
        resolve_login_qr_status_payload(connection, qr_key)
    }

    pub fn mark_login_qr_scanned(
        &self,
        connection: &mut Connection,
        qr_key: &str,
    ) -> Result<UserCenterLoginQrStatusPayload, String> {
        let normalized_qr_key = normalize_login_qr_key(qr_key)?;
        let Some(record) = load_login_qr_record(connection, &normalized_qr_key)? else {
            return Err(format!("Login QR code {normalized_qr_key} was not found."));
        };

        if record.status != "confirmed" {
            let expires_at_millis =
                crate::parse_storage_timestamp_millis(&record.expires_at).unwrap_or_default();
            if expires_at_millis < current_epoch_millis()? {
                expire_login_qr_record(connection, &record.id)?;
                return Ok(UserCenterLoginQrStatusPayload {
                    session: None,
                    status: "expired".to_owned(),
                    user: None,
                });
            }

            touch_login_qr_scanned(connection, &record.id)?;
        }

        let refreshed_record = load_login_qr_record(connection, &normalized_qr_key)?
            .ok_or_else(|| format!("Login QR code {normalized_qr_key} was not found."))?;
        build_login_qr_status_payload(connection, &refreshed_record)
    }

    pub fn confirm_login_qr(
        &self,
        connection: &mut Connection,
        headers: &HeaderMap,
        qr_key: &str,
    ) -> Result<UserCenterLoginQrStatusPayload, String> {
        let session = self
            .resolve_session(connection, headers)?
            .ok_or_else(|| "A valid signed-in user-center session is required.".to_owned())?;
        let normalized_qr_key = normalize_login_qr_key(qr_key)?;
        let Some(record) = load_login_qr_record(connection, &normalized_qr_key)? else {
            return Err(format!("Login QR code {normalized_qr_key} was not found."));
        };

        if record.status != "confirmed" {
            let expires_at_millis =
                crate::parse_storage_timestamp_millis(&record.expires_at).unwrap_or_default();
            if expires_at_millis < current_epoch_millis()? {
                expire_login_qr_record(connection, &record.id)?;
                return Err("Login QR code has expired.".to_owned());
            }
        }

        if record.status == "confirmed" {
            return build_login_qr_status_payload(connection, &record);
        }

        confirm_login_qr_record(connection, &record.id, &session)?;
        let refreshed_record = load_login_qr_record(connection, &normalized_qr_key)?
            .ok_or_else(|| format!("Login QR code {normalized_qr_key} was not found."))?;
        build_login_qr_status_payload(connection, &refreshed_record)
    }

    pub fn request_password_reset(
        &self,
        connection: &mut Connection,
        request: &UserCenterPasswordResetChallengeRequest,
    ) -> Result<(), String> {
        self.provider.request_password_reset(connection, request)
    }

    pub fn ensure_user_account(
        &self,
        connection: &mut Connection,
        user_id: Option<&str>,
        email: Option<&str>,
        name: Option<&str>,
        avatar: Option<UserCenterMediaResource>,
    ) -> Result<UserCenterUserPayload, String> {
        let normalized_user_id = normalize_optional_text(user_id);
        let normalized_email = normalize_optional_text(email).map(|value| normalize_email(&value));

        if normalized_user_id.is_none() && normalized_email.is_none() {
            return Err("userId or email is required.".to_owned());
        }

        if let (Some(existing_user_id), None) =
            (normalized_user_id.as_deref(), normalized_email.as_deref())
        {
            let user = load_user_by_id(connection, existing_user_id)?
                .ok_or_else(|| format!("User {existing_user_id} was not found."))?;
            ensure_default_profile(connection, &user.id)?;
            return Ok(map_user_record_to_user_payload(user));
        }

        let normalized_email = normalized_email.ok_or_else(|| {
            "email is required when userId cannot be resolved directly.".to_owned()
        })?;
        let metadata = self.metadata();
        let preferred_user_id =
            normalized_user_id.unwrap_or_else(|| crate::create_identifier("user"));
        let resolved_display_name = resolve_display_name(name);
        let registration_scope = require_resolved_registration_scope(connection, None)?;
        let user = upsert_user_shadow(
            connection,
            &preferred_user_id,
            &normalized_email,
            &resolved_display_name,
            avatar.as_ref(),
            &metadata.provider_key,
            None,
            Some(registration_scope.tenant_id.as_str()),
            registration_scope.organization_id.as_deref(),
        )?;
        ensure_default_profile(connection, &user.id)?;
        Ok(map_user_record_to_user_payload(user))
    }

    pub fn read_profile(
        &self,
        connection: &mut Connection,
        session: &UserCenterSessionPayload,
    ) -> Result<UserCenterProfilePayload, String> {
        self.provider.read_profile(connection, session)
    }

    pub fn register(
        &self,
        connection: &mut Connection,
        request: &UserCenterRegisterRequest,
    ) -> Result<UserCenterSessionPayload, String> {
        self.provider.register(connection, request)
    }

    pub fn reset_password(
        &self,
        connection: &mut Connection,
        request: &UserCenterPasswordResetRequest,
    ) -> Result<(), String> {
        self.provider.reset_password(connection, request)
    }

    pub fn resolve_session(
        &self,
        connection: &Connection,
        headers: &HeaderMap,
    ) -> Result<Option<UserCenterSessionPayload>, String> {
        self.provider.resolve_session(connection, headers)
    }

    pub fn update_profile(
        &self,
        connection: &mut Connection,
        session: &UserCenterSessionPayload,
        request: &UpdateUserCenterProfileRequest,
    ) -> Result<UserCenterProfilePayload, String> {
        self.provider.update_profile(connection, session, request)
    }
}

pub fn ensure_sqlite_user_center_schema(connection: &mut Connection) -> Result<(), String> {
    connection
        .execute_batch(USER_CENTER_SQLITE_SCHEMA)
        .map_err(|error| format!("create sqlite user center schema failed: {error}"))?;
    Ok(())
}

pub fn ensure_sqlite_user_center_bootstrap_user(
    _connection: &mut Connection,
) -> Result<(), String> {
    Ok(())
}

fn read_env_trimmed(name: &str) -> Option<String> {
    std::env::var(name)
        .ok()
        .map(|value| value.trim().to_owned())
        .filter(|value| !value.is_empty())
}

fn list_distinct_active_user_tenant_ids(connection: &Connection) -> Result<Vec<String>, String> {
    let mut statement = connection
        .prepare(
            "SELECT DISTINCT tenant_id FROM iam_user \
             WHERE is_deleted = 0 AND tenant_id IS NOT NULL AND tenant_id != '' AND tenant_id != ?1",
        )
        .map_err(|error| format!("prepare distinct user tenant ids failed: {error}"))?;
    let tenant_ids = statement
        .query_map(params![DEFAULT_LOCAL_TENANT_ID], |row| row.get(0))
        .map_err(|error| format!("query distinct user tenant ids failed: {error}"))?
        .collect::<Result<Vec<String>, _>>()
        .map_err(|error| format!("read distinct user tenant ids failed: {error}"))?;
    Ok(tenant_ids)
}

fn resolve_primary_organization_for_tenant(
    connection: &Connection,
    tenant_id: &str,
) -> Result<Option<String>, String> {
    connection
        .query_row(
            "SELECT CAST(id AS TEXT) FROM iam_organization \
             WHERE tenant_id = ?1 AND status = 1 AND is_deleted = 0 \
             ORDER BY id LIMIT 1",
            [tenant_id],
            |row| row.get(0),
        )
        .optional()
        .map_err(|error| {
            format!("load primary organization for tenant {tenant_id} failed: {error}")
        })
}

#[derive(Clone, Debug, Eq, PartialEq)]
enum RegistrationTenantResolution {
    Resolved(LocalBootstrapScope),
}

fn provision_canonical_bootstrap_tenant(connection: &Connection) -> Result<(), String> {
    let tenant_numeric_id: i64 = CANONICAL_IAM_TENANT_ID
        .parse()
        .map_err(|error| format!("canonical tenant id must be numeric: {error}"))?;
    let organization_numeric_id: i64 = CANONICAL_IAM_ORGANIZATION_ID
        .parse()
        .map_err(|error| format!("canonical organization id must be numeric: {error}"))?;
    let now = crate::current_storage_timestamp();
    connection
        .execute(
            "INSERT INTO iam_tenant (id, uuid, created_at, updated_at, version, name, code, type, jwt_secret_key, status, is_deleted) \
             VALUES (?1, ?2, ?3, ?4, 0, ?5, ?6, 'PLATFORM', ?7, 'active', 0) \
             ON CONFLICT(id) DO UPDATE SET \
                code = excluded.code, \
                name = excluded.name, \
                status = excluded.status, \
                updated_at = excluded.updated_at, \
                is_deleted = 0",
            params![
                tenant_numeric_id,
                stable_entity_uuid("iam_tenant", CANONICAL_IAM_TENANT_ID),
                &now,
                &now,
                CANONICAL_IAM_TENANT_NAME,
                CANONICAL_IAM_TENANT_CODE,
                format!("{CANONICAL_IAM_TENANT_ID}-signing-secret"),
            ],
        )
        .map_err(|error| format!("provision canonical tenant failed: {error}"))?;
    connection
        .execute(
            "INSERT INTO iam_organization (
                id, uuid, tenant_id, organization_id, data_scope, parent_id, parent_uuid,
                parent_metadata, name, jwt_secret_key, token_expiration_ms,
                refresh_token_expiration_ms, code, install_app_list, status, metadata,
                description, contact_person, contact_phone, contact_email, address, website,
                logo_media_resource_id, logo_object_blob_id, logo_resource_snapshot,
                created_at, updated_at, version, is_deleted
            )
            VALUES (
                ?1, ?2, ?3, ?1, 1, NULL, NULL,
                NULL, ?4, ?5, NULL,
                NULL, ?6, NULL, 1, NULL,
                ?7, NULL, NULL, NULL, NULL, NULL,
                NULL, NULL, NULL,
                ?8, ?9, 0, 0
            )
            ON CONFLICT(code) DO UPDATE SET
                tenant_id = excluded.tenant_id,
                name = excluded.name,
                status = excluded.status,
                updated_at = excluded.updated_at,
                is_deleted = 0",
            params![
                organization_numeric_id,
                stable_entity_uuid("iam_organization", CANONICAL_IAM_ORGANIZATION_ID),
                tenant_numeric_id,
                CANONICAL_IAM_ORGANIZATION_NAME,
                format!("{CANONICAL_IAM_ORGANIZATION_ID}-signing-secret"),
                CANONICAL_IAM_ORGANIZATION_CODE,
                CANONICAL_IAM_ORGANIZATION_NAME,
                &now,
                &now,
            ],
        )
        .map_err(|error| format!("provision canonical organization failed: {error}"))?;
    Ok(())
}

fn resolve_registration_tenant_scope(
    connection: &Connection,
    requested_tenant_id: Option<&str>,
) -> Result<RegistrationTenantResolution, String> {
    let tenant_ids = list_distinct_active_user_tenant_ids(connection)?;
    if tenant_ids.len() == 1 {
        let tenant_id = tenant_ids[0].clone();
        return Ok(RegistrationTenantResolution::Resolved(
            LocalBootstrapScope {
                organization_id: resolve_primary_organization_for_tenant(connection, &tenant_id)?,
                tenant_id,
            },
        ));
    }

    let tenant_ids = list_active_tenant_ids(connection)?;
    if tenant_ids.len() == 1 {
        let tenant_id = tenant_ids[0].clone();
        return Ok(RegistrationTenantResolution::Resolved(
            LocalBootstrapScope {
                organization_id: resolve_primary_organization_for_tenant(connection, &tenant_id)?,
                tenant_id,
            },
        ));
    }

    if tenant_ids.is_empty() {
        provision_canonical_bootstrap_tenant(connection)?;
        return Ok(RegistrationTenantResolution::Resolved(
            LocalBootstrapScope {
                organization_id: Some(CANONICAL_IAM_ORGANIZATION_ID.to_string()),
                tenant_id: CANONICAL_IAM_TENANT_ID.to_string(),
            },
        ));
    }

    if let Some(tenant_id) = requested_tenant_id
        .map(str::trim)
        .filter(|value| !value.is_empty())
    {
        if tenant_ids.iter().any(|candidate| candidate == tenant_id) {
            return Ok(RegistrationTenantResolution::Resolved(
                LocalBootstrapScope {
                    organization_id: resolve_primary_organization_for_tenant(
                        connection, tenant_id,
                    )?,
                    tenant_id: tenant_id.to_string(),
                },
            ));
        }
        return Err(format!(
            "tenant {tenant_id} is not available for open registration"
        ));
    }

    let default_tenant_id = default_registration_tenant_id(&tenant_ids);
    Ok(RegistrationTenantResolution::Resolved(
        LocalBootstrapScope {
            organization_id: resolve_primary_organization_for_tenant(
                connection,
                default_tenant_id.as_str(),
            )?,
            tenant_id: default_tenant_id,
        },
    ))
}

fn default_registration_tenant_id(tenant_ids: &[String]) -> String {
    tenant_ids
        .iter()
        .find(|candidate| candidate.as_str() == CANONICAL_IAM_TENANT_ID)
        .cloned()
        .unwrap_or_else(|| tenant_ids[0].clone())
}

fn require_resolved_registration_scope(
    connection: &Connection,
    requested_tenant_id: Option<&str>,
) -> Result<LocalBootstrapScope, String> {
    match resolve_registration_tenant_scope(connection, requested_tenant_id)? {
        RegistrationTenantResolution::Resolved(scope) => Ok(scope),
    }
}

fn list_active_tenant_ids(connection: &Connection) -> Result<Vec<String>, String> {
    let mut statement = connection
        .prepare(
            "SELECT CAST(id AS TEXT) FROM iam_tenant \
             WHERE status = 'active' AND is_deleted = 0 \
             ORDER BY id",
        )
        .map_err(|error| format!("prepare active tenant ids failed: {error}"))?;
    let tenant_ids = statement
        .query_map([], |row| row.get(0))
        .map_err(|error| format!("query active tenant ids failed: {error}"))?
        .collect::<Result<Vec<String>, _>>()
        .map_err(|error| format!("read active tenant ids failed: {error}"))?;
    Ok(tenant_ids)
}

fn resolve_default_provider_key(
    mode: &UserCenterMode,
    external_integration: &ExternalUserCenterIntegrationKind,
) -> &'static str {
    match mode {
        UserCenterMode::Local => "sdkwork-user-center-local",
        UserCenterMode::External => match external_integration {
            ExternalUserCenterIntegrationKind::Headers => "sdkwork-user-center-header",
            ExternalUserCenterIntegrationKind::SdkworkCloudAppApi => "sdkwork-user-center-remote",
        },
    }
}

fn resolve_external_app_api_base_url_from_env() -> Option<String> {
    read_env_trimmed(SDKWORK_USER_CENTER_APP_API_BASE_URL_ENV)
        .map(|value| value.trim_end_matches('/').to_owned())
        .filter(|value| !value.is_empty())
}

fn resolve_user_center_config_from_env() -> UserCenterResolvedConfig {
    let external_app_api_base_url = resolve_external_app_api_base_url_from_env();
    let configured_login_provider = std::env::var(SDKWORK_USER_CENTER_MODE_ENV)
        .ok()
        .map(|value| value.trim().to_ascii_lowercase())
        .filter(|value| !value.is_empty());

    let explicit_provider_error =
        configured_login_provider
            .as_deref()
            .and_then(|value| match value {
                "builtin-local" | "sdkwork-cloud-app-api" | "external-user-center" => None,
                _ => Some(format!(
                "{} must be one of: builtin-local, sdkwork-cloud-app-api, external-user-center.",
                SDKWORK_USER_CENTER_MODE_ENV
            )),
            });

    let (mode, external_integration) = match configured_login_provider
        .as_deref()
        .filter(|_| explicit_provider_error.is_none())
    {
        Some("builtin-local") => (
            UserCenterMode::Local,
            ExternalUserCenterIntegrationKind::Headers,
        ),
        Some("sdkwork-cloud-app-api") => (
            UserCenterMode::External,
            ExternalUserCenterIntegrationKind::SdkworkCloudAppApi,
        ),
        Some("external-user-center") => (
            UserCenterMode::External,
            ExternalUserCenterIntegrationKind::Headers,
        ),
        _ if external_app_api_base_url.is_some() => (
            UserCenterMode::External,
            ExternalUserCenterIntegrationKind::SdkworkCloudAppApi,
        ),
        _ => (
            UserCenterMode::Local,
            ExternalUserCenterIntegrationKind::Headers,
        ),
    };

    let provider_key = std::env::var(SDKWORK_USER_CENTER_PROVIDER_KEY_ENV)
        .ok()
        .map(|value| value.trim().to_owned())
        .filter(|value| !value.is_empty())
        .unwrap_or_else(|| resolve_default_provider_key(&mode, &external_integration).to_owned());
    let app_id = read_env_trimmed(SDKWORK_USER_CENTER_APP_ID_ENV);
    let app_id_error = app_id
        .as_ref()
        .is_none()
        .then(|| format!("{SDKWORK_USER_CENTER_APP_ID_ENV} is required for user-center session and handshake context."));

    let (external_app_api, external_app_api_error) = if matches!(mode, UserCenterMode::External)
        && matches!(
            external_integration,
            ExternalUserCenterIntegrationKind::SdkworkCloudAppApi
        ) {
        match resolve_external_app_api_config_from_env(
            app_id.as_deref().unwrap_or_default(),
            external_app_api_base_url,
        ) {
            Ok(config) => (Some(config), None),
            Err(error) => (None, Some(error)),
        }
    } else {
        (None, None)
    };
    let configuration_error = explicit_provider_error
        .or(app_id_error)
        .or(external_app_api_error);

    UserCenterResolvedConfig {
        app_id: app_id.unwrap_or_default(),
        configuration_error,
        external_app_api,
        external_headers: ExternalHeaderConfig {
            avatar_header: std::env::var(SDKWORK_USER_CENTER_EXTERNAL_AVATAR_HEADER_ENV)
                .ok()
                .map(|value| value.trim().to_owned())
                .filter(|value| !value.is_empty())
                .unwrap_or_else(|| "x-sdkwork-user-center-avatar".to_owned()),
            email_header: std::env::var(SDKWORK_USER_CENTER_EXTERNAL_EMAIL_HEADER_ENV)
                .ok()
                .map(|value| value.trim().to_owned())
                .filter(|value| !value.is_empty())
                .unwrap_or_else(|| "x-sdkwork-user-center-email".to_owned()),
            id_header: std::env::var(SDKWORK_USER_CENTER_EXTERNAL_ID_HEADER_ENV)
                .ok()
                .map(|value| value.trim().to_owned())
                .filter(|value| !value.is_empty())
                .unwrap_or_else(|| "x-sdkwork-user-center-user-id".to_owned()),
            name_header: std::env::var(SDKWORK_USER_CENTER_EXTERNAL_NAME_HEADER_ENV)
                .ok()
                .map(|value| value.trim().to_owned())
                .filter(|value| !value.is_empty())
                .unwrap_or_else(|| "x-sdkwork-user-center-name".to_owned()),
            organization_header: std::env::var(
                SDKWORK_USER_CENTER_EXTERNAL_ORGANIZATION_HEADER_ENV,
            )
            .ok()
            .map(|value| value.trim().to_owned())
            .filter(|value| !value.is_empty())
            .unwrap_or_else(|| "x-sdkwork-organization-id".to_owned()),
            tenant_header: std::env::var(SDKWORK_USER_CENTER_EXTERNAL_TENANT_HEADER_ENV)
                .ok()
                .map(|value| value.trim().to_owned())
                .filter(|value| !value.is_empty())
                .unwrap_or_else(|| "x-sdkwork-tenant-id".to_owned()),
        },
        external_integration,
        mode,
        provider_key,
    }
}

fn resolve_external_app_api_config_from_env(
    app_id: &str,
    base_url: Option<String>,
) -> Result<ExternalAppApiConfig, String> {
    let app_id = normalize_optional_text(Some(app_id)).ok_or_else(|| {
        format!(
            "{SDKWORK_USER_CENTER_APP_ID_ENV} is required for sdkwork-cloud-app-api integration."
        )
    })?;
    let resolved_base_url = base_url.ok_or_else(|| {
        format!(
            "{} is required when sdkwork-cloud-app-api integration is enabled.",
            SDKWORK_USER_CENTER_APP_API_BASE_URL_ENV
        )
    })?;
    let timeout_ms = std::env::var(SDKWORK_USER_CENTER_APP_API_TIMEOUT_MS_ENV)
        .ok()
        .and_then(|value| value.trim().parse::<u64>().ok())
        .filter(|value| *value > 0)
        .unwrap_or(DEFAULT_EXTERNAL_APP_API_TIMEOUT_MS);
    let handshake = resolve_external_app_api_handshake_config(
        Some(app_id.as_str()),
        read_env_trimmed(SDKWORK_USER_CENTER_SECRET_ID_ENV).as_deref(),
        read_env_trimmed(SDKWORK_USER_CENTER_SHARED_SECRET_ENV).as_deref(),
        "",
        SDKWORK_USER_CENTER_SECRET_ID_ENV,
        SDKWORK_USER_CENTER_SHARED_SECRET_ENV,
    )?;

    Ok(ExternalAppApiConfig {
        app_id,
        base_url: resolved_base_url,
        handshake,
        timeout: Duration::from_millis(timeout_ms),
    })
}

fn normalize_email(value: &str) -> String {
    value.trim().to_ascii_lowercase()
}

fn normalize_optional_text(value: Option<&str>) -> Option<String> {
    value
        .map(|entry| entry.trim().to_owned())
        .filter(|entry| !entry.is_empty())
}

fn resolve_local_organization_id(value: Option<&str>) -> String {
    normalize_optional_text(value).unwrap_or_else(|| DEFAULT_LOCAL_ORGANIZATION_ID.to_owned())
}

fn sqlite_value_ref_to_string(value: ValueRef<'_>) -> Option<String> {
    match value {
        ValueRef::Null => None,
        ValueRef::Integer(integer) => Some(integer.to_string()),
        ValueRef::Real(real) => {
            if real.fract() == 0.0 {
                Some((real as i64).to_string())
            } else {
                Some(real.to_string())
            }
        }
        ValueRef::Text(text) => Some(String::from_utf8_lossy(text).into_owned()),
        ValueRef::Blob(_) => None,
    }
}

fn sqlite_row_required_string_value(
    row: &rusqlite::Row<'_>,
    index: usize,
    column_name: &str,
) -> rusqlite::Result<String> {
    let value = row.get_ref(index)?;
    let data_type = value.data_type();
    sqlite_value_ref_to_string(value).ok_or_else(|| {
        rusqlite::Error::FromSqlConversionFailure(
            index,
            data_type,
            Box::new(std::io::Error::new(
                std::io::ErrorKind::InvalidData,
                format!("sqlite column {column_name} could not be normalized as string"),
            )),
        )
    })
}

fn sqlite_row_optional_string_value(
    row: &rusqlite::Row<'_>,
    index: usize,
    column_name: &str,
) -> rusqlite::Result<Option<String>> {
    let value = row.get_ref(index)?;
    let data_type = value.data_type();
    match value {
        ValueRef::Null => Ok(None),
        _ => sqlite_value_ref_to_string(value).map(Some).ok_or_else(|| {
            rusqlite::Error::FromSqlConversionFailure(
                index,
                data_type,
                Box::new(std::io::Error::new(
                    std::io::ErrorKind::InvalidData,
                    format!(
                        "sqlite column {column_name} could not be normalized as optional string"
                    ),
                )),
            )
        }),
    }
}

fn resolve_primary_active_organization_membership(
    connection: &Connection,
    tenant_id: &str,
    user_id: &str,
) -> Result<Option<String>, String> {
    connection
        .query_row(
            r#"
            SELECT organization_id
            FROM iam_organization_membership
            WHERE CAST(tenant_id AS TEXT) = ?1
              AND CAST(user_id AS TEXT) = ?2
              AND status = 'active'
              AND is_deleted = 0
              AND CAST(organization_id AS TEXT) <> ?3
            ORDER BY updated_at DESC, id ASC
            LIMIT 1
            "#,
            params![tenant_id, user_id, DEFAULT_LOCAL_ORGANIZATION_ID],
            |row| {
                sqlite_row_required_string_value(
                    row,
                    0,
                    "iam_organization_membership.organization_id",
                )
            },
        )
        .optional()
        .map_err(|error| {
            format!("load active organization membership for user {user_id} failed: {error}")
        })
}

fn apply_active_organization_membership_context(
    connection: &Connection,
    user: &UserRecord,
) -> Result<UserRecord, String> {
    let Some(tenant_id) = normalize_optional_text(user.tenant_id.as_deref()) else {
        return Ok(user.clone());
    };
    let Some(organization_id) =
        resolve_primary_active_organization_membership(connection, &tenant_id, &user.id)?
    else {
        return Ok(user.clone());
    };
    if user.organization_id.as_deref() == Some(organization_id.as_str()) {
        return Ok(user.clone());
    }

    let mut resolved_user = user.clone();
    resolved_user.organization_id = Some(organization_id);
    Ok(resolved_user)
}

fn ensure_user_default_organization_membership(
    connection: &mut Connection,
    user: &UserRecord,
) -> Result<(), String> {
    let tenant_id = normalize_optional_text(user.tenant_id.as_deref()).ok_or_else(|| {
        format!(
            "User {} does not have a real tenant binding for organization membership.",
            user.id
        )
    })?;
    let Some(organization_id) = normalize_optional_text(user.organization_id.as_deref())
        .filter(|value| value != DEFAULT_LOCAL_ORGANIZATION_ID)
    else {
        return Ok(());
    };
    let now = crate::current_storage_timestamp();
    let membership_identity = format!("{tenant_id}:{organization_id}:{}", user.id);
    let display_name = normalize_optional_text(Some(user.display_name.as_str())).or_else(|| {
        user.email
            .as_deref()
            .and_then(|email| normalize_optional_text(Some(email)))
    });

    connection
        .execute(
            r#"
            INSERT INTO iam_organization_membership (
                id, uuid, tenant_id, organization_id, data_scope, user_id, membership_kind,
                employee_no, display_name, status, joined_at, left_at, remark,
                created_at, updated_at, version, is_deleted
            )
            VALUES (
                ?1, ?2, ?3, ?4, 1, ?5, 'employee',
                NULL, ?6, 'active', ?7, NULL, NULL,
                ?8, ?9, 0, 0
            )
            ON CONFLICT(tenant_id, organization_id, user_id) DO UPDATE SET
                membership_kind = excluded.membership_kind,
                display_name = excluded.display_name,
                status = 'active',
                left_at = NULL,
                updated_at = excluded.updated_at,
                is_deleted = 0
            "#,
            params![
                crate::create_identifier("organization-membership"),
                stable_entity_uuid("iam_organization_membership", &membership_identity),
                &tenant_id,
                &organization_id,
                &user.id,
                &display_name,
                &now,
                &now,
                &now,
            ],
        )
        .map_err(|error| {
            format!(
                "upsert organization membership for user {} failed: {error}",
                user.id
            )
        })?;

    connection
        .execute(
            r#"
            UPDATE iam_user
            SET tenant_id = ?2, organization_id = ?3, updated_at = ?4, status = 'active', is_deleted = 0
            WHERE id = ?1 AND is_deleted = 0
            "#,
            params![&user.id, &tenant_id, &organization_id, &now],
        )
        .map_err(|error| {
            format!("sync user {} organization membership context failed: {error}", user.id)
        })?;

    Ok(())
}

fn is_active_status(value: &str) -> bool {
    value.trim().eq_ignore_ascii_case("active")
}

fn stable_entity_uuid(entity_name: &str, id: &str) -> String {
    let normalized = sanitize_identifier_segment(id);
    if normalized.is_empty() {
        uuid::Uuid::new_v4().to_string()
    } else {
        let identity_seed = format!("sdkwork-user-center:{entity_name}:{normalized}");
        uuid::Uuid::new_v5(&uuid::Uuid::NAMESPACE_OID, identity_seed.as_bytes()).to_string()
    }
}

fn local_tenant_signing_key_id(tenant_id: &str) -> String {
    format!("sdkwork-user-center-local-tenant-{tenant_id}")
}

fn hmac_sha256_base64url(secret: &str, message: &str) -> Result<String, String> {
    type HmacSha256 = Hmac<Sha256>;

    let normalized_secret = normalize_optional_text(Some(secret))
        .ok_or_else(|| "Tenant signing secret is required.".to_owned())?;
    let normalized_message = normalize_optional_text(Some(message))
        .ok_or_else(|| "Token signing message is required.".to_owned())?;
    let mut signer = HmacSha256::new_from_slice(normalized_secret.as_bytes())
        .map_err(|error| format!("initialize tenant token signer failed: {error}"))?;
    signer.update(normalized_message.as_bytes());
    Ok(URL_SAFE_NO_PAD.encode(signer.finalize().into_bytes()))
}

fn sign_user_center_token(
    secret: &str,
    kid: &str,
    claims: &UserCenterTokenClaims,
) -> Result<String, String> {
    let header = UserCenterTokenHeader {
        alg: "HS256",
        kid: kid.to_owned(),
        typ: "JWT",
    };
    let encoded_header = URL_SAFE_NO_PAD.encode(
        serde_json::to_vec(&header)
            .map_err(|error| format!("serialize user-center token header failed: {error}"))?,
    );
    let encoded_payload = URL_SAFE_NO_PAD.encode(
        serde_json::to_vec(claims)
            .map_err(|error| format!("serialize user-center token claims failed: {error}"))?,
    );
    let signing_input = format!("{encoded_header}.{encoded_payload}");
    let signature = hmac_sha256_base64url(secret, &signing_input)?;
    Ok(format!("{signing_input}.{signature}"))
}

fn load_tenant_signing_secret(connection: &Connection, tenant_id: &str) -> Result<String, String> {
    connection
        .query_row(
            r#"
            SELECT jwt_secret_key
            FROM iam_tenant
            WHERE CAST(id AS TEXT) = ?1
              AND status = 'active'
              AND is_deleted = 0
            LIMIT 1
            "#,
            params![tenant_id],
            |row| row.get::<_, String>(0),
        )
        .optional()
        .map_err(|error| format!("load tenant signing secret for {tenant_id} failed: {error}"))?
        .and_then(|secret| normalize_optional_text(Some(secret.as_str())))
        .ok_or_else(|| format!("Tenant {tenant_id} does not have active signing material."))
}

fn issue_local_user_center_session_tokens(
    app_id: &str,
    connection: &Connection,
    session_id: &str,
    user: &UserCenterUserPayload,
) -> Result<UserCenterSessionTokens, String> {
    let app_id = normalize_optional_text(Some(app_id)).ok_or_else(|| {
        format!(
            "{SDKWORK_USER_CENTER_APP_ID_ENV} is required for local user-center session tokens."
        )
    })?;
    let tenant_id = normalize_optional_text(user.tenant_id.as_deref())
        .ok_or_else(|| format!("User {} does not have a tenant binding.", user.id))?;
    let organization_id = resolve_local_organization_id(user.organization_id.as_deref());
    let login_scope = if organization_id == DEFAULT_LOCAL_ORGANIZATION_ID {
        "TENANT"
    } else {
        "ORGANIZATION"
    };
    let issued_at = current_unix_timestamp_seconds();
    let expires_at = issued_at.saturating_add(LOCAL_USER_CENTER_TOKEN_TTL_SECONDS);
    let signing_secret = load_tenant_signing_secret(connection, &tenant_id)?;
    let key_id = local_tenant_signing_key_id(&tenant_id);
    let base_claims =
        |token_type: &str, data_scope: Option<String>, permission_scope: Option<String>| {
            UserCenterTokenClaims {
                aud: app_id.clone(),
                app_id: app_id.clone(),
                deployment_mode: LOCAL_USER_CENTER_TOKEN_DEPLOYMENT_MODE.to_owned(),
                exp: expires_at,
                iat: issued_at,
                iss: LOCAL_USER_CENTER_TOKEN_ISSUER.to_owned(),
                login_scope: login_scope.to_owned(),
                organization_id: organization_id.clone(),
                session_id: session_id.to_owned(),
                sid: session_id.to_owned(),
                sub: user.id.clone(),
                tenant_id: tenant_id.clone(),
                token_type: token_type.to_owned(),
                token_version: 1,
                user_id: user.id.clone(),
                environment: LOCAL_USER_CENTER_TOKEN_ENVIRONMENT.to_owned(),
                data_scope,
                permission_scope,
            }
        };

    let auth_claims = base_claims("auth", None, None);
    let access_claims = base_claims(
        "access",
        Some(login_scope.to_ascii_lowercase()),
        Some("iam.users.current.read".to_owned()),
    );

    Ok(UserCenterSessionTokens {
        access_token: sign_user_center_token(&signing_secret, &key_id, &access_claims)?,
        auth_token: sign_user_center_token(&signing_secret, &key_id, &auth_claims)?,
        refresh_token: None,
        token_type: USER_CENTER_AUTHORIZATION_SCHEME.to_owned(),
    })
}

fn resolve_user_center_session_tokens(
    app_id: &str,
    connection: &Connection,
    session_id: &str,
    user: &UserCenterUserPayload,
    upstream_state: Option<&PersistedUpstreamSessionState>,
) -> Result<UserCenterSessionTokens, String> {
    if let Some(upstream_state) = upstream_state {
        match (&upstream_state.auth_token, &upstream_state.access_token) {
            (Some(auth_token), Some(access_token))
                if !crate::is_blank(Some(auth_token.as_str()))
                    && !crate::is_blank(Some(access_token.as_str())) =>
            {
                return Ok(UserCenterSessionTokens {
                    access_token: access_token.clone(),
                    auth_token: auth_token.clone(),
                    refresh_token: upstream_state.refresh_token.clone(),
                    token_type: upstream_state
                        .token_type
                        .clone()
                        .unwrap_or_else(|| USER_CENTER_AUTHORIZATION_SCHEME.to_owned()),
                });
            }
            (None, None) => {}
            _ => {
                return Err(
                    "Upstream user-center session must include both authToken and accessToken."
                        .to_owned(),
                );
            }
        }
    }

    issue_local_user_center_session_tokens(app_id, connection, session_id, user)
}

fn parse_metadata_object(metadata_json: Option<&str>) -> Result<Map<String, Value>, String> {
    let Some(raw_value) = metadata_json
        .map(str::trim)
        .filter(|value| !value.is_empty())
    else {
        return Ok(Map::new());
    };
    serde_json::from_str::<Map<String, Value>>(raw_value)
        .map_err(|error| format!("parse iam_user.metadata_json failed: {error}"))
}

fn metadata_string_value(metadata: &Map<String, Value>, key: &str) -> Option<String> {
    metadata.get(key).and_then(|value| match value {
        Value::String(inner) => normalize_optional_text(Some(inner.as_str())),
        Value::Number(inner) => Some(inner.to_string()),
        Value::Bool(inner) => Some(inner.to_string()),
        _ => None,
    })
}

fn merge_local_user_metadata_json(
    existing_metadata_json: Option<&str>,
    company: Option<&str>,
    location: Option<&str>,
    website: Option<&str>,
) -> Result<Option<String>, String> {
    let mut metadata = parse_metadata_object(existing_metadata_json)?;

    for (key, value) in [
        ("company", company),
        ("location", location),
        ("website", website),
    ] {
        if let Some(normalized_value) = normalize_optional_text(value) {
            metadata.insert(key.to_owned(), Value::String(normalized_value));
        }
    }

    if metadata.is_empty() {
        return Ok(None);
    }

    serde_json::to_string(&metadata)
        .map(Some)
        .map_err(|error| format!("serialize iam_user.metadata_json failed: {error}"))
}

fn project_profile_record_from_user(
    bio: Option<String>,
    metadata_json: Option<String>,
) -> Result<UserProfileRecord, String> {
    let metadata = parse_metadata_object(metadata_json.as_deref())?;
    Ok(UserProfileRecord {
        bio,
        company: metadata_string_value(&metadata, "company"),
        location: metadata_string_value(&metadata, "location"),
        website: metadata_string_value(&metadata, "website"),
    })
}

fn resolve_display_name(explicit_name: Option<&str>) -> String {
    normalize_optional_text(explicit_name).unwrap_or_default()
}

fn resolve_phone_display_name(explicit_name: Option<&str>) -> String {
    normalize_optional_text(explicit_name).unwrap_or_default()
}

fn sanitize_identifier_segment(value: &str) -> String {
    let mut normalized = String::with_capacity(value.len());
    let mut previous_was_separator = false;

    for character in value.chars() {
        let lower = character.to_ascii_lowercase();
        if lower.is_ascii_alphanumeric() {
            normalized.push(lower);
            previous_was_separator = false;
        } else if !previous_was_separator {
            normalized.push('-');
            previous_was_separator = true;
        }
    }

    normalized.trim_matches('-').to_owned()
}

fn resolve_shadow_email_for_account(
    email_hint: Option<&str>,
    _phone_hint: Option<&str>,
    _account_hint: Option<&str>,
) -> String {
    if let Some(normalized_email) = email_hint
        .map(normalize_email)
        .filter(|value| !value.is_empty())
    {
        return normalized_email;
    }

    String::new()
}

fn build_external_user_id(provider_key: &str, subject: Option<&str>, email: &str) -> String {
    let _ = (provider_key, subject, email);
    crate::create_identifier("user")
}

fn external_url_media_resource(value: &str, kind: &str) -> Option<UserCenterMediaResource> {
    let url = normalize_optional_text(Some(value))?;
    Some(UserCenterMediaResource {
        kind: kind.to_owned(),
        public_url: Some(url.clone()),
        source: if url.starts_with("data:") {
            "data_url".to_owned()
        } else {
            "external_url".to_owned()
        },
        uri: None,
        url: Some(url),
    })
}

fn media_resource_from_snapshot(value: Option<String>) -> Option<UserCenterMediaResource> {
    let snapshot = normalize_optional_text(value.as_deref())?;
    let resource = serde_json::from_str::<UserCenterMediaResource>(&snapshot).ok()?;
    if crate::is_blank(Some(resource.kind.as_str()))
        || crate::is_blank(Some(resource.source.as_str()))
    {
        return None;
    }
    Some(resource)
}

fn media_resource_to_snapshot(resource: &UserCenterMediaResource) -> Result<String, String> {
    serde_json::to_string(resource)
        .map_err(|error| format!("serialize user center media resource failed: {error}"))
}

fn media_resource_delivery_url(resource: &UserCenterMediaResource) -> Option<String> {
    normalize_optional_text(resource.public_url.as_deref())
        .or_else(|| normalize_optional_text(resource.url.as_deref()))
        .or_else(|| normalize_optional_text(resource.uri.as_deref()))
}

fn normalize_phone(phone: &str) -> String {
    let trimmed = phone.trim();
    if trimmed.is_empty() {
        return String::new();
    }

    let mut normalized = String::with_capacity(trimmed.len());
    for (index, character) in trimmed.chars().enumerate() {
        if character.is_ascii_digit() {
            normalized.push(character);
            continue;
        }

        if index == 0 && character == '+' {
            normalized.push(character);
        }
    }

    if normalized.starts_with('+') && normalized.len() == 1 {
        return String::new();
    }

    normalized
}

fn is_local_phone_shadow_email(email: &str) -> bool {
    normalize_email(email).ends_with(LEGACY_LOCAL_PHONE_SHADOW_EMAIL_SUFFIX)
}

fn resolve_user_public_identity(email: Option<&str>, phone: Option<&str>) -> String {
    let Some(email) = email.and_then(|value| normalize_optional_text(Some(value))) else {
        return String::new();
    };

    if is_local_phone_shadow_email(email.as_str()) {
        if let Some(normalized_phone) = phone.map(normalize_phone).filter(|value| !value.is_empty())
        {
            return normalized_phone;
        }
    }

    email
}

fn user_record_public_email(user: &UserRecord) -> String {
    resolve_user_public_identity(user.email.as_deref(), user.phone.as_deref())
}

fn require_normalized_phone(phone: &str) -> Result<String, String> {
    let normalized_phone = normalize_phone(phone);
    let digit_count = normalized_phone
        .chars()
        .filter(|character| character.is_ascii_digit())
        .count();
    if digit_count < 6 {
        return Err("Phone is required.".to_owned());
    }
    Ok(normalized_phone)
}

fn looks_like_phone_account(account: &str) -> bool {
    !account.contains('@') && require_normalized_phone(account).is_ok()
}

fn normalize_oauth_provider_identifier(provider: &str) -> Result<String, String> {
    let normalized = provider.trim().replace('_', "-").to_lowercase();
    if normalized.is_empty() {
        return Err("OAuth provider is required.".to_owned());
    }

    if normalized
        .chars()
        .all(|character| character.is_ascii_alphanumeric() || character == '-')
    {
        return Ok(normalized);
    }

    Err("OAuth provider contains unsupported characters.".to_owned())
}

fn collect_normalized_oauth_provider_identifiers(raw_value: &str) -> Vec<String> {
    raw_value
        .split(|character: char| character == ',' || character == ';' || character.is_whitespace())
        .filter_map(|segment| normalize_oauth_provider_identifier(segment).ok())
        .fold(Vec::new(), |mut providers, provider| {
            if !providers.contains(&provider) {
                providers.push(provider);
            }
            providers
        })
}

fn resolve_default_oauth_provider_identifiers(providers: &[&str]) -> Vec<String> {
    providers
        .iter()
        .filter_map(|provider| normalize_oauth_provider_identifier(provider).ok())
        .collect()
}

fn resolve_cloud_app_api_oauth_providers_from_env() -> Vec<String> {
    match std::env::var(SDKWORK_USER_CENTER_APP_API_OAUTH_PROVIDERS_ENV) {
        Ok(value) => collect_normalized_oauth_provider_identifiers(&value),
        Err(_) => {
            resolve_default_oauth_provider_identifiers(DEFAULT_EXTERNAL_APP_API_OAUTH_PROVIDERS)
        }
    }
}

fn map_oauth_provider_to_upstream(provider: &str) -> Result<String, String> {
    Ok(normalize_oauth_provider_identifier(provider)?
        .replace('-', "_")
        .to_ascii_uppercase())
}

fn resolve_local_oauth_providers_from_env() -> Vec<String> {
    match std::env::var(SDKWORK_USER_CENTER_OAUTH_PROVIDERS_ENV) {
        Ok(value) => collect_normalized_oauth_provider_identifiers(&value),
        Err(_) => Vec::new(),
    }
}

fn resolve_local_oauth_code_secret(provider_key: &str) -> String {
    read_env_trimmed(SDKWORK_USER_CENTER_OAUTH_CODE_SECRET_ENV)
        .unwrap_or_else(|| format!("{provider_key}:local-oauth"))
}

fn resolve_local_oauth_code_ttl() -> Duration {
    std::env::var(SDKWORK_USER_CENTER_OAUTH_CODE_TTL_SECONDS_ENV)
        .ok()
        .and_then(|value| value.trim().parse::<u64>().ok())
        .filter(|value| *value > 0)
        .map(Duration::from_secs)
        .unwrap_or_else(|| Duration::from_secs(DEFAULT_LOCAL_OAUTH_CODE_TTL_SECONDS))
}

fn current_unix_timestamp_seconds() -> i64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|duration| duration.as_secs() as i64)
        .unwrap_or(0)
}

fn encode_uri_query_component(value: &str) -> String {
    let mut encoded = String::with_capacity(value.len());
    for byte in value.bytes() {
        let character = byte as char;
        if character.is_ascii_alphanumeric() || matches!(character, '-' | '_' | '.' | '~') {
            encoded.push(character);
        } else {
            encoded.push('%');
            encoded.push_str(format!("{byte:02X}").as_str());
        }
    }
    encoded
}

fn append_query_parameters_to_url(base_url: &str, params: &[(String, String)]) -> String {
    if params.is_empty() {
        return base_url.to_owned();
    }

    let (before_fragment, fragment_suffix) = match base_url.split_once('#') {
        Some((url, fragment)) => (url, Some(fragment)),
        None => (base_url, None),
    };
    let separator = if before_fragment.contains('?') {
        if before_fragment.ends_with('?') || before_fragment.ends_with('&') {
            ""
        } else {
            "&"
        }
    } else {
        "?"
    };
    let query_suffix = params
        .iter()
        .enumerate()
        .map(|(index, (key, value))| {
            format!(
                "{}{}={}",
                if index == 0 { "" } else { "&" },
                encode_uri_query_component(key),
                encode_uri_query_component(value),
            )
        })
        .collect::<String>();
    let mut resolved_url = format!("{before_fragment}{separator}{query_suffix}");
    if let Some(fragment) = fragment_suffix {
        resolved_url.push('#');
        resolved_url.push_str(fragment);
    }
    resolved_url
}

fn local_oauth_provider_env_key(provider: &str, suffix: &str) -> Result<String, String> {
    let normalized_provider = normalize_oauth_provider_identifier(provider)?;
    let provider_segment = normalized_provider.replace('-', "_").to_ascii_uppercase();
    Ok(format!(
        "SDKWORK_USER_CENTER_OAUTH_{provider_segment}_{suffix}"
    ))
}

fn read_local_oauth_provider_profile(provider: &str) -> Result<LocalOAuthProviderProfile, String> {
    let normalized_provider = normalize_oauth_provider_identifier(provider)?;
    let subject_env = local_oauth_provider_env_key(&normalized_provider, "SUBJECT")?;
    let email_env = local_oauth_provider_env_key(&normalized_provider, "EMAIL")?;
    let phone_env = local_oauth_provider_env_key(&normalized_provider, "PHONE")?;
    let name_env = local_oauth_provider_env_key(&normalized_provider, "NAME")?;
    let avatar_env = local_oauth_provider_env_key(&normalized_provider, "AVATAR_URL")?;

    let subject = read_env_trimmed(&subject_env)
        .ok_or_else(|| format!("{subject_env} is required for local OAuth provider identity."))?;
    let phone = read_env_trimmed(&phone_env)
        .map(|value| normalize_phone(&value))
        .filter(|value| !value.is_empty());
    let email = read_env_trimmed(&email_env)
        .map(|value| normalize_email(&value))
        .filter(|value| !value.is_empty())
        .unwrap_or_default();
    if email.is_empty() && phone.is_none() {
        return Err(format!(
            "{email_env} or {phone_env} is required for local OAuth provider identity."
        ));
    }
    let name = read_env_trimmed(&name_env).unwrap_or_else(|| subject.clone());
    let avatar = read_env_trimmed(&avatar_env)
        .and_then(|value| external_url_media_resource(&value, "image"));

    Ok(LocalOAuthProviderProfile {
        avatar,
        email,
        name,
        phone,
        provider: normalized_provider,
        subject,
    })
}

fn sign_local_oauth_authorization_code(
    secret: &str,
    claims: &LocalOAuthAuthorizationCodeClaims,
) -> Result<String, String> {
    type HmacSha256 = Hmac<Sha256>;

    let normalized_secret = normalize_optional_text(Some(secret))
        .ok_or_else(|| "Local OAuth code secret is required.".to_owned())?;
    let payload_json = serde_json::to_vec(claims)
        .map_err(|error| format!("serialize local OAuth authorization payload failed: {error}"))?;
    let encoded_payload = URL_SAFE_NO_PAD.encode(payload_json);
    let mut signer = HmacSha256::new_from_slice(normalized_secret.as_bytes())
        .map_err(|error| format!("initialize local OAuth signer failed: {error}"))?;
    signer.update(encoded_payload.as_bytes());
    let signature = URL_SAFE_NO_PAD.encode(signer.finalize().into_bytes());
    Ok(format!("{encoded_payload}.{signature}"))
}

fn verify_local_oauth_authorization_code(
    secret: &str,
    code: &str,
) -> Result<LocalOAuthAuthorizationCodeClaims, String> {
    type HmacSha256 = Hmac<Sha256>;

    let normalized_secret = normalize_optional_text(Some(secret))
        .ok_or_else(|| "Local OAuth code secret is required.".to_owned())?;
    let normalized_code =
        normalize_optional_text(Some(code)).ok_or_else(|| "OAuth code is required.".to_owned())?;
    let (encoded_payload, encoded_signature) = normalized_code
        .split_once('.')
        .ok_or_else(|| "OAuth authorization code is invalid.".to_owned())?;
    let signature = URL_SAFE_NO_PAD
        .decode(encoded_signature.as_bytes())
        .map_err(|_| "OAuth authorization code signature is invalid.".to_owned())?;
    let mut signer = HmacSha256::new_from_slice(normalized_secret.as_bytes())
        .map_err(|error| format!("initialize local OAuth signer failed: {error}"))?;
    signer.update(encoded_payload.as_bytes());
    signer
        .verify_slice(signature.as_slice())
        .map_err(|_| "OAuth authorization code signature is invalid.".to_owned())?;
    let payload = URL_SAFE_NO_PAD
        .decode(encoded_payload.as_bytes())
        .map_err(|_| "OAuth authorization code payload is invalid.".to_owned())?;
    let claims = serde_json::from_slice::<LocalOAuthAuthorizationCodeClaims>(&payload)
        .map_err(|error| format!("parse local OAuth authorization payload failed: {error}"))?;
    if claims.expires_at < current_unix_timestamp_seconds() {
        return Err("OAuth authorization code has expired.".to_owned());
    }
    Ok(claims)
}

impl LocalOAuthAuthority {
    fn new(provider_key: &str) -> Self {
        let mut provider_order = Vec::new();
        let providers = resolve_local_oauth_providers_from_env()
            .into_iter()
            .filter_map(|provider| {
                read_local_oauth_provider_profile(&provider)
                    .ok()
                    .map(|profile| {
                        provider_order.push(provider.clone());
                        (provider, profile)
                    })
            })
            .collect();

        Self {
            code_secret: resolve_local_oauth_code_secret(provider_key),
            code_ttl: resolve_local_oauth_code_ttl(),
            provider_order,
            providers,
        }
    }

    fn enabled_provider_ids(&self) -> Vec<String> {
        self.provider_order.clone()
    }

    fn require_provider_profile(
        &self,
        provider: &str,
    ) -> Result<&LocalOAuthProviderProfile, String> {
        let normalized_provider = normalize_oauth_provider_identifier(provider)?;
        self.providers.get(&normalized_provider).ok_or_else(|| {
            format!(
                "OAuth provider {} is not enabled for the configured local user center.",
                normalized_provider
            )
        })
    }

    fn issue_authorization_code(
        &self,
        profile: &LocalOAuthProviderProfile,
    ) -> Result<String, String> {
        let issued_at = current_unix_timestamp_seconds();
        let expires_at = issued_at + self.code_ttl.as_secs() as i64;
        sign_local_oauth_authorization_code(
            &self.code_secret,
            &LocalOAuthAuthorizationCodeClaims {
                avatar: profile.avatar.clone(),
                email: profile.email.clone(),
                expires_at,
                issued_at,
                name: profile.name.clone(),
                phone: profile.phone.clone(),
                provider: profile.provider.clone(),
                subject: profile.subject.clone(),
            },
        )
    }

    fn build_authorization_url(
        &self,
        request: &UserCenterOAuthAuthorizationRequest,
    ) -> Result<UserCenterOAuthUrlPayload, String> {
        let redirect_uri = normalize_optional_text(Some(request.redirect_uri.as_str()))
            .ok_or_else(|| "OAuth redirectUri is required.".to_owned())?;
        let profile = self.require_provider_profile(&request.provider)?;
        let code = self.issue_authorization_code(profile)?;
        let mut query_params = vec![("code".to_owned(), code)];
        if let Some(state) = normalize_optional_text(request.state.as_deref()) {
            query_params.push(("state".to_owned(), state));
        }

        Ok(UserCenterOAuthUrlPayload {
            auth_url: append_query_parameters_to_url(&redirect_uri, &query_params),
        })
    }

    fn resolve_authorization_code(
        &self,
        code: &str,
        expected_provider: &str,
    ) -> Result<LocalOAuthAuthorizationCodeClaims, String> {
        let claims = verify_local_oauth_authorization_code(&self.code_secret, code)?;
        let normalized_provider = normalize_oauth_provider_identifier(expected_provider)?;
        if claims.provider != normalized_provider {
            return Err("OAuth authorization code provider does not match the request.".to_owned());
        }
        self.require_provider_profile(&normalized_provider)?;
        Ok(claims)
    }
}

fn hash_local_password(password: &str) -> Result<String, String> {
    let normalized_password = password.trim();
    if normalized_password.is_empty() {
        return Err("Password is required.".to_owned());
    }
    let salt = SaltString::encode_b64(uuid::Uuid::new_v4().as_bytes())
        .map_err(|error| format!("create password salt failed: {error}"))?;
    Argon2::default()
        .hash_password(normalized_password.as_bytes(), &salt)
        .map(|value| value.to_string())
        .map_err(|error| format!("hash local password failed: {error}"))
}

fn verify_local_password(password_hash: &str, candidate_password: &str) -> Result<bool, String> {
    let parsed_hash = PasswordHash::new(password_hash)
        .map_err(|error| format!("parse local password hash failed: {error}"))?;
    Ok(Argon2::default()
        .verify_password(candidate_password.trim().as_bytes(), &parsed_hash)
        .is_ok())
}

fn map_user_record_to_user_payload(user: UserRecord) -> UserCenterUserPayload {
    let email = user_record_public_email(&user);
    UserCenterUserPayload {
        uuid: user.uuid,
        tenant_id: user.tenant_id,
        organization_id: user.organization_id,
        created_at: user.created_at,
        updated_at: user.updated_at,
        avatar: user.avatar,
        email,
        id: user.id,
        name: user.display_name,
    }
}

fn read_header_value(headers: &HeaderMap, header_name: &str) -> Option<String> {
    headers
        .get(header_name)
        .and_then(|value| value.to_str().ok())
        .and_then(|value| normalize_optional_text(Some(value)))
}

fn read_authorization_token(headers: &HeaderMap) -> Option<String> {
    let authorization_value = read_header_value(headers, USER_CENTER_AUTHORIZATION_HEADER_NAME)?;
    let mut authorization_parts = authorization_value.split_whitespace();
    let scheme_or_token = authorization_parts.next()?;
    let token = authorization_parts.next();

    if scheme_or_token.eq_ignore_ascii_case(USER_CENTER_AUTHORIZATION_SCHEME) {
        return token.and_then(|value| normalize_optional_text(Some(value)));
    }

    normalize_optional_text(Some(scheme_or_token))
}

fn read_session_header(headers: &HeaderMap) -> Option<String> {
    read_header_value(headers, USER_CENTER_SESSION_HEADER_NAME)
        .or_else(|| read_authorization_token(headers))
        .or_else(|| read_header_value(headers, USER_CENTER_ACCESS_TOKEN_HEADER_NAME))
}

fn build_user_center_session_payload(
    access_token: String,
    auth_token: String,
    created_at: String,
    provider_key: String,
    provider_mode: String,
    refresh_token: Option<String>,
    session_id: String,
    token_type: Option<String>,
    updated_at: String,
    user: UserCenterUserPayload,
) -> UserCenterSessionPayload {
    let session_uuid = stable_entity_uuid("iam_session", &session_id);

    UserCenterSessionPayload {
        access_token,
        auth_token,
        uuid: session_uuid,
        tenant_id: user.tenant_id.clone(),
        organization_id: user.organization_id.clone(),
        created_at,
        provider_key,
        provider_mode,
        refresh_token,
        session_id,
        token_type: token_type.unwrap_or_else(|| USER_CENTER_AUTHORIZATION_SCHEME.to_owned()),
        updated_at,
        user,
        challenge_type: None,
        continuation_token: None,
        expires_at: None,
        tenants: None,
    }
}

fn load_user_by_id(connection: &Connection, user_id: &str) -> Result<Option<UserRecord>, String> {
    connection
        .query_row(
            r#"
            SELECT
                id,
                uuid,
                tenant_id,
                organization_id,
                created_at,
                updated_at,
                email,
                phone,
                nickname,
                avatar_resource_snapshot,
                provider_key,
                external_subject,
                status,
                metadata_json
            FROM iam_user
            WHERE id = ?1 AND is_deleted = 0
            LIMIT 1
            "#,
            params![user_id],
            |row| {
                Ok(UserRecord {
                    id: sqlite_row_required_string_value(row, 0, "iam_user.id")?,
                    uuid: row.get(1)?,
                    tenant_id: sqlite_row_optional_string_value(row, 2, "iam_user.tenant_id")?,
                    organization_id: sqlite_row_optional_string_value(
                        row,
                        3,
                        "iam_user.organization_id",
                    )?,
                    created_at: row.get(4)?,
                    updated_at: row.get(5)?,
                    email: row.get::<_, Option<String>>(6)?,
                    phone: row.get(7)?,
                    display_name: row.get(8)?,
                    avatar: media_resource_from_snapshot(row.get(9)?),
                    provider_key: row.get(10)?,
                    external_subject: row.get(11)?,
                    status: row.get(12)?,
                    metadata_json: row.get(13)?,
                })
            },
        )
        .optional()
        .map_err(|error| format!("load user {user_id} failed: {error}"))
}

fn load_user_by_email(connection: &Connection, email: &str) -> Result<Option<UserRecord>, String> {
    connection
        .query_row(
            r#"
            SELECT
                id,
                uuid,
                tenant_id,
                organization_id,
                created_at,
                updated_at,
                email,
                phone,
                nickname,
                avatar_resource_snapshot,
                provider_key,
                external_subject,
                status,
                metadata_json
            FROM iam_user
            WHERE (email = ?1 OR username = ?1) AND is_deleted = 0
            LIMIT 1
            "#,
            params![email],
            |row| {
                Ok(UserRecord {
                    id: sqlite_row_required_string_value(row, 0, "iam_user.id")?,
                    uuid: row.get(1)?,
                    tenant_id: sqlite_row_optional_string_value(row, 2, "iam_user.tenant_id")?,
                    organization_id: sqlite_row_optional_string_value(
                        row,
                        3,
                        "iam_user.organization_id",
                    )?,
                    created_at: row.get(4)?,
                    updated_at: row.get(5)?,
                    email: row.get::<_, Option<String>>(6)?,
                    phone: row.get(7)?,
                    display_name: row.get(8)?,
                    avatar: media_resource_from_snapshot(row.get(9)?),
                    provider_key: row.get(10)?,
                    external_subject: row.get(11)?,
                    status: row.get(12)?,
                    metadata_json: row.get(13)?,
                })
            },
        )
        .optional()
        .map_err(|error| format!("load user by email {email} failed: {error}"))
}

fn load_user_by_phone(connection: &Connection, phone: &str) -> Result<Option<UserRecord>, String> {
    connection
        .query_row(
            r#"
            SELECT
                id,
                uuid,
                tenant_id,
                organization_id,
                created_at,
                updated_at,
                email,
                phone,
                nickname,
                avatar_resource_snapshot,
                provider_key,
                external_subject,
                status,
                metadata_json
            FROM iam_user
            WHERE phone = ?1 AND is_deleted = 0
            LIMIT 1
            "#,
            params![phone],
            |row| {
                Ok(UserRecord {
                    id: sqlite_row_required_string_value(row, 0, "iam_user.id")?,
                    uuid: row.get(1)?,
                    tenant_id: sqlite_row_optional_string_value(row, 2, "iam_user.tenant_id")?,
                    organization_id: sqlite_row_optional_string_value(
                        row,
                        3,
                        "iam_user.organization_id",
                    )?,
                    created_at: row.get(4)?,
                    updated_at: row.get(5)?,
                    email: row.get::<_, Option<String>>(6)?,
                    phone: row.get(7)?,
                    display_name: row.get(8)?,
                    avatar: media_resource_from_snapshot(row.get(9)?),
                    provider_key: row.get(10)?,
                    external_subject: row.get(11)?,
                    status: row.get(12)?,
                    metadata_json: row.get(13)?,
                })
            },
        )
        .optional()
        .map_err(|error| format!("load user by phone {phone} failed: {error}"))
}

fn load_user_by_oauth_account(
    connection: &Connection,
    oauth_provider: &str,
    open_id: &str,
) -> Result<Option<UserRecord>, String> {
    connection
        .query_row(
            r#"
            SELECT
                iam_user.id,
                iam_user.uuid,
                iam_user.tenant_id,
                iam_user.organization_id,
                iam_user.created_at,
                iam_user.updated_at,
                iam_user.email,
                iam_user.phone,
                iam_user.nickname,
                iam_user.avatar_resource_snapshot,
                iam_user.provider_key,
                iam_user.external_subject,
                iam_user.status,
                iam_user.metadata_json
            FROM iam_user_identity
            INNER JOIN iam_user ON iam_user.id = iam_user_identity.user_id
            WHERE iam_user_identity.oauth_provider = ?1
              AND iam_user_identity.open_id = ?2
              AND iam_user_identity.is_deleted = 0
              AND iam_user.is_deleted = 0
            LIMIT 1
            "#,
            params![oauth_provider, open_id],
            |row| {
                Ok(UserRecord {
                    id: sqlite_row_required_string_value(row, 0, "iam_user.id")?,
                    uuid: row.get(1)?,
                    tenant_id: sqlite_row_optional_string_value(row, 2, "iam_user.tenant_id")?,
                    organization_id: sqlite_row_optional_string_value(
                        row,
                        3,
                        "iam_user.organization_id",
                    )?,
                    created_at: row.get(4)?,
                    updated_at: row.get(5)?,
                    email: row.get::<_, Option<String>>(6)?,
                    phone: row.get(7)?,
                    display_name: row.get(8)?,
                    avatar: media_resource_from_snapshot(row.get(9)?),
                    provider_key: row.get(10)?,
                    external_subject: row.get(11)?,
                    status: row.get(12)?,
                    metadata_json: row.get(13)?,
                })
            },
        )
        .optional()
        .map_err(|error| format!("load OAuth account {oauth_provider}:{open_id} failed: {error}"))
}

fn resolve_existing_external_user(
    connection: &Connection,
    provider_key: &str,
    external_subject: Option<&str>,
    email: &str,
) -> Result<Option<UserRecord>, String> {
    if let Some(normalized_subject) = normalize_optional_text(external_subject) {
        if let Some(user) =
            load_user_by_oauth_account(connection, provider_key, normalized_subject.as_str())?
        {
            return Ok(Some(user));
        }
    }

    load_user_by_email(connection, email)
}

fn load_local_credentials(
    connection: &Connection,
    user_id: &str,
) -> Result<Option<LocalCredentialRecord>, String> {
    let record = connection
        .query_row(
            r#"
            SELECT credential_hash, status
            FROM iam_credential
            WHERE user_id = ?1
              AND credential_type = 'password'
              AND is_deleted = 0
            ORDER BY updated_at DESC
            LIMIT 1
            "#,
            params![user_id],
            |row| {
                Ok(LocalCredentialRecord {
                    password_hash: row.get(0)?,
                    status: row.get(1)?,
                })
            },
        )
        .optional()
        .map_err(|error| format!("load local credentials for {user_id} failed: {error}"))?;

    Ok(record.and_then(|record| {
        normalize_optional_text(Some(record.password_hash.as_str())).map(|password_hash| {
            LocalCredentialRecord {
                password_hash,
                status: record.status,
            }
        })
    }))
}

fn load_session_record(
    connection: &Connection,
    session_id: &str,
) -> Result<Option<UserSessionRecord>, String> {
    connection
        .query_row(
            r#"
            SELECT
                id,
                user_id,
                provider_key,
                provider_mode,
                status,
                created_at,
                updated_at,
                upstream_auth_token,
                upstream_access_token,
                upstream_refresh_token,
                upstream_token_type,
                upstream_user_id,
                upstream_payload_json
            FROM iam_session
            WHERE id = ?1 AND is_deleted = 0
            LIMIT 1
            "#,
            params![session_id],
            |row| {
                Ok(UserSessionRecord {
                    id: sqlite_row_required_string_value(row, 0, "iam_session.id")?,
                    user_id: sqlite_row_required_string_value(row, 1, "iam_session.user_id")?,
                    provider_key: row.get(2)?,
                    provider_mode: row.get(3)?,
                    status: row.get(4)?,
                    created_at: row.get(5)?,
                    updated_at: row.get(6)?,
                    upstream_auth_token: row.get(7)?,
                    upstream_access_token: row.get(8)?,
                    upstream_refresh_token: row.get(9)?,
                    upstream_token_type: row.get(10)?,
                    upstream_user_id: row.get(11)?,
                    upstream_payload_json: row.get(12)?,
                })
            },
        )
        .optional()
        .map_err(|error| format!("load user session {session_id} failed: {error}"))
}

fn load_profile_record(
    connection: &Connection,
    user_id: &str,
) -> Result<Option<UserProfileRecord>, String> {
    let record = connection
        .query_row(
            r#"
            SELECT bio, metadata_json
            FROM iam_user
            WHERE id = ?1 AND is_deleted = 0
            LIMIT 1
            "#,
            params![user_id],
            |row| {
                Ok((
                    row.get::<_, Option<String>>(0)?,
                    row.get::<_, Option<String>>(1)?,
                ))
            },
        )
        .optional()
        .map_err(|error| format!("load user profile {user_id} failed: {error}"))?;

    record
        .map(|(bio, metadata_json)| project_profile_record_from_user(bio, metadata_json))
        .transpose()
}

fn upsert_user_shadow(
    connection: &mut Connection,
    preferred_user_id: &str,
    email: &str,
    display_name: &str,
    avatar: Option<&UserCenterMediaResource>,
    provider_key: &str,
    external_subject: Option<&str>,
    tenant_id: Option<&str>,
    organization_id: Option<&str>,
) -> Result<UserRecord, String> {
    upsert_user_shadow_with_phone(
        connection,
        preferred_user_id,
        email,
        None,
        display_name,
        avatar,
        provider_key,
        external_subject,
        tenant_id,
        organization_id,
    )
}

fn upsert_user_shadow_with_phone(
    connection: &mut Connection,
    preferred_user_id: &str,
    email: &str,
    phone: Option<&str>,
    display_name: &str,
    avatar: Option<&UserCenterMediaResource>,
    provider_key: &str,
    external_subject: Option<&str>,
    tenant_id: Option<&str>,
    organization_id: Option<&str>,
) -> Result<UserRecord, String> {
    let normalized_email = normalize_email(email);
    let normalized_phone = phone.and_then(|value| {
        let normalized = normalize_phone(value);
        if normalized.is_empty() {
            None
        } else {
            Some(normalized)
        }
    });
    let normalized_subject = normalize_optional_text(external_subject);
    if normalized_email.is_empty()
        && normalized_phone.is_none()
        && normalized_subject.is_none()
        && crate::is_blank(Some(preferred_user_id))
    {
        return Err("A real user identifier is required.".to_owned());
    }
    let resolved_username = normalized_phone
        .clone()
        .or_else(|| {
            if normalized_email.is_empty() {
                None
            } else {
                Some(normalized_email.clone())
            }
        })
        .or_else(|| normalized_subject.clone())
        .unwrap_or_else(|| preferred_user_id.trim().to_owned());

    let existing_user = if let Some(user) = load_user_by_id(connection, preferred_user_id)? {
        Some(user)
    } else if let Some(phone_value) = normalized_phone.as_deref() {
        load_user_by_phone(connection, phone_value)?
    } else if !normalized_email.is_empty() {
        load_user_by_email(connection, &normalized_email)?
    } else {
        None
    };
    let resolved_user_id = existing_user
        .as_ref()
        .map(|user| user.id.clone())
        .unwrap_or_else(|| preferred_user_id.to_owned());
    let now = crate::current_storage_timestamp();
    let resolved_display_name = normalize_optional_text(Some(display_name)).unwrap_or_default();
    let resolved_avatar = avatar
        .cloned()
        .or_else(|| existing_user.as_ref().and_then(|user| user.avatar.clone()));
    let resolved_avatar_snapshot = resolved_avatar
        .as_ref()
        .map(media_resource_to_snapshot)
        .transpose()?;
    let resolved_provider_key = existing_user
        .as_ref()
        .and_then(|user| normalize_optional_text(Some(user.provider_key.as_str())))
        .unwrap_or_else(|| provider_key.trim().to_owned());
    let resolved_tenant_id = existing_user
        .as_ref()
        .and_then(|user| user.tenant_id.clone())
        .or_else(|| normalize_optional_text(tenant_id))
        .ok_or_else(|| {
            "A real tenant binding is required before creating a user-center user.".to_owned()
        })?;
    if resolved_tenant_id == DEFAULT_LOCAL_TENANT_ID {
        return Err("A real tenant binding must not use the tenant-scope placeholder.".to_owned());
    }
    let resolved_organization_id = existing_user
        .as_ref()
        .and_then(|user| user.organization_id.clone())
        .filter(|value| value != DEFAULT_LOCAL_ORGANIZATION_ID)
        .or_else(|| normalize_optional_text(organization_id))
        .unwrap_or_else(|| DEFAULT_LOCAL_ORGANIZATION_ID.to_owned());

    connection
        .execute(
            r#"
            INSERT INTO iam_user (
                id, uuid, tenant_id, organization_id, username, nickname, salt,
                platform, type, scene, email, phone, country_code, province_code, city_code,
                district_code, address, bio, avatar_resource_snapshot, provider_key, external_subject,
                metadata_json, status, created_at, updated_at, version, is_deleted
            )
            VALUES (
                ?1, ?2, ?3, ?4, ?5, ?6, NULL, 'default', 'default', 'birdcoder',
                ?7, ?8, NULL, NULL, NULL, NULL, NULL, NULL, ?9, ?10, ?11, ?12, 'active',
                ?13, ?14, 0, 0
            )
            ON CONFLICT(id) DO UPDATE SET
                tenant_id = excluded.tenant_id,
                organization_id = excluded.organization_id,
                updated_at = excluded.updated_at,
                is_deleted = 0,
                username = excluded.username,
                email = excluded.email,
                phone = COALESCE(excluded.phone, iam_user.phone),
                nickname = excluded.nickname,
                avatar_resource_snapshot = excluded.avatar_resource_snapshot,
                provider_key = COALESCE(NULLIF(iam_user.provider_key, ''), excluded.provider_key),
                external_subject = COALESCE(excluded.external_subject, iam_user.external_subject),
                metadata_json = COALESCE(iam_user.metadata_json, excluded.metadata_json),
                status = 'active'
            "#,
            params![
                &resolved_user_id,
                stable_entity_uuid("iam_user", &resolved_user_id),
                &resolved_tenant_id,
                &resolved_organization_id,
                &resolved_username,
                &resolved_display_name,
                &normalize_optional_text(Some(normalized_email.as_str())),
                &normalized_phone,
                &resolved_avatar_snapshot,
                &resolved_provider_key,
                &normalized_subject,
                existing_user
                    .as_ref()
                    .and_then(|user| user.metadata_json.clone()),
                &now,
                &now,
            ],
        )
        .map_err(|error| format!("upsert user {resolved_user_id} failed: {error}"))?;

    if let Some(normalized_subject) = normalize_optional_text(external_subject) {
        connection
            .execute(
                r#"
                INSERT INTO iam_user_identity (
                    id, uuid, tenant_id, organization_id, user_id, oauth_provider, open_id, union_id, app_id,
                    oauth_user_info_json, status, created_at, updated_at, version, is_deleted
                )
                VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, NULL, NULL, NULL, 'active', ?8, ?9, 0, 0)
                ON CONFLICT(oauth_provider, open_id) DO UPDATE SET
                    tenant_id = excluded.tenant_id,
                    organization_id = excluded.organization_id,
                    user_id = excluded.user_id,
                    status = 'active',
                    updated_at = excluded.updated_at,
                    is_deleted = 0
                "#,
                params![
                    crate::create_identifier("oauth-account"),
                    stable_entity_uuid(
                        "iam_user_identity",
                        format!("{provider_key}:{normalized_subject}").as_str(),
                    ),
                    &resolved_tenant_id,
                    &resolved_organization_id,
                    &resolved_user_id,
                    provider_key,
                    &normalized_subject,
                    &now,
                    &now,
                ],
            )
            .map_err(|error| {
                format!(
                    "upsert iam_user_identity for {resolved_user_id} failed: {error}"
                )
            })?;
    }

    let user = load_user_by_id(connection, &resolved_user_id)?
        .ok_or_else(|| format!("user {resolved_user_id} was not found after upsert"))?;
    ensure_user_default_organization_membership(connection, &user)?;
    load_user_by_id(connection, &resolved_user_id)?
        .ok_or_else(|| format!("user {resolved_user_id} was not found after membership upsert"))
}

fn upsert_oauth_account_record(
    connection: &mut Connection,
    user_id: &str,
    oauth_provider: &str,
    open_id: &str,
    union_id: Option<&str>,
    app_id: Option<&str>,
    oauth_user_info_json: Option<&str>,
) -> Result<(), String> {
    let normalized_provider = normalize_oauth_provider_identifier(oauth_provider)?;
    let normalized_open_id = normalize_optional_text(Some(open_id))
        .ok_or_else(|| "OAuth openId is required.".to_owned())?;
    let normalized_union_id = normalize_optional_text(union_id);
    let normalized_app_id = normalize_optional_text(app_id);
    let normalized_user_info_json = normalize_optional_text(oauth_user_info_json);
    let user = load_user_by_id(connection, user_id)?
        .ok_or_else(|| format!("user {user_id} was not found for oauth account upsert"))?;
    let record_id = crate::create_identifier("oauth-account");
    let now = crate::current_storage_timestamp();

    connection
        .execute(
            r#"
            INSERT INTO iam_user_identity (
                id, uuid, tenant_id, organization_id, user_id, oauth_provider, open_id, union_id, app_id,
                oauth_user_info_json, status, created_at, updated_at, version, is_deleted
            )
            VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, 'active', ?11, ?12, 0, 0)
            ON CONFLICT(oauth_provider, open_id) DO UPDATE SET
                tenant_id = excluded.tenant_id,
                organization_id = excluded.organization_id,
                user_id = excluded.user_id,
                union_id = COALESCE(excluded.union_id, iam_user_identity.union_id),
                app_id = COALESCE(excluded.app_id, iam_user_identity.app_id),
                oauth_user_info_json =
                    COALESCE(excluded.oauth_user_info_json, iam_user_identity.oauth_user_info_json),
                status = 'active',
                updated_at = excluded.updated_at,
                is_deleted = 0
            "#,
            params![
                &record_id,
                stable_entity_uuid(
                    "iam_user_identity",
                    format!("{normalized_provider}:{normalized_open_id}").as_str(),
                ),
                user.tenant_id.clone().ok_or_else(|| {
                    format!("User {user_id} does not have a tenant binding for OAuth account.")
                })?,
                resolve_local_organization_id(user.organization_id.as_deref()),
                user_id,
                &normalized_provider,
                &normalized_open_id,
                &normalized_union_id,
                &normalized_app_id,
                &normalized_user_info_json,
                &now,
                &now,
            ],
        )
        .map_err(|error| {
            format!(
                "upsert OAuth account {normalized_provider}:{normalized_open_id} failed: {error}"
            )
        })?;

    Ok(())
}

fn ensure_default_profile(connection: &mut Connection, user_id: &str) -> Result<(), String> {
    upsert_profile_shadow(connection, user_id, None, None, None, None)?;
    Ok(())
}

fn ensure_local_credentials(
    connection: &mut Connection,
    user_id: &str,
    password: &str,
    overwrite_existing: bool,
) -> Result<(), String> {
    let existing = load_local_credentials(connection, user_id)?;
    if existing.as_ref().is_some() && !overwrite_existing {
        return Ok(());
    }
    let now = crate::current_storage_timestamp();
    let password_hash = hash_local_password(password)?;
    connection
        .execute(
            r#"
            INSERT INTO iam_credential (
                id, uuid, tenant_id, organization_id, data_scope, user_id, credential_type,
                credential_hash, status, expires_at, created_at, updated_at, version, is_deleted
            )
            SELECT
                ?2, ?3, u.tenant_id, COALESCE(u.organization_id, ?4), 1,
                u.id, 'password', ?5, 'active', NULL, ?6, ?7, 0, 0
            FROM iam_user u
            WHERE u.id = ?1 AND u.is_deleted = 0 AND u.tenant_id IS NOT NULL
            ON CONFLICT(tenant_id, user_id, credential_type) DO UPDATE SET
                organization_id = excluded.organization_id,
                credential_hash = excluded.credential_hash,
                status = 'active',
                updated_at = excluded.updated_at,
                is_deleted = 0
            "#,
            params![
                user_id,
                crate::create_identifier("iam-credential"),
                stable_entity_uuid("iam_credential", user_id),
                DEFAULT_LOCAL_ORGANIZATION_ID,
                &password_hash,
                &now,
                &now,
            ],
        )
        .map_err(|error| format!("upsert local credentials for {user_id} failed: {error}"))?;
    connection
        .execute(
            r#"
            UPDATE iam_user
            SET updated_at = ?2, status = 'active', is_deleted = 0
            WHERE id = ?1 AND is_deleted = 0
            "#,
            params![user_id, &now],
        )
        .map_err(|error| format!("mark credential user {user_id} active failed: {error}"))?;
    Ok(())
}

fn create_persisted_session(
    app_id: &str,
    connection: &mut Connection,
    user: &UserRecord,
    provider_mode: &str,
    provider_key: &str,
    upstream_state: Option<&PersistedUpstreamSessionState>,
) -> Result<UserCenterSessionPayload, String> {
    let session_id = crate::create_identifier("user-session");
    let now = crate::current_storage_timestamp();
    let upstream_auth_token = upstream_state.and_then(|state| state.auth_token.clone());
    let upstream_access_token = upstream_state.and_then(|state| state.access_token.clone());
    let upstream_refresh_token = upstream_state.and_then(|state| state.refresh_token.clone());
    let upstream_token_type = upstream_state.and_then(|state| state.token_type.clone());
    let upstream_user_id = upstream_state.and_then(|state| state.user_id.clone());
    let upstream_payload_json = upstream_state.and_then(|state| state.payload_json.clone());
    let user = apply_active_organization_membership_context(connection, user)?;
    let user_payload = map_user_record_to_user_payload(user.clone());
    let tenant_id = normalize_optional_text(user_payload.tenant_id.as_deref())
        .ok_or_else(|| format!("User {} does not have a tenant binding.", user.id))?;
    let organization_id = resolve_local_organization_id(user_payload.organization_id.as_deref());

    connection
        .execute(
            r#"
            INSERT INTO iam_session (
                id, uuid, tenant_id, organization_id, user_id, provider_key, provider_mode,
                upstream_auth_token, upstream_access_token, upstream_refresh_token,
                upstream_token_type, upstream_user_id, upstream_payload_json, status,
                created_at, updated_at, version, is_deleted
            )
            VALUES (
                ?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, 'active',
                ?14, ?15, 0, 0
            )
            "#,
            params![
                &session_id,
                stable_entity_uuid("iam_session", &session_id),
                &tenant_id,
                &organization_id,
                &user.id,
                provider_key,
                provider_mode,
                &upstream_auth_token,
                &upstream_access_token,
                &upstream_refresh_token,
                &upstream_token_type,
                &upstream_user_id,
                &upstream_payload_json,
                &now,
                &now,
            ],
        )
        .map_err(|error| format!("create user session {session_id} failed: {error}"))?;

    let tokens = resolve_user_center_session_tokens(
        app_id,
        connection,
        &session_id,
        &user_payload,
        upstream_state,
    )?;
    Ok(build_user_center_session_payload(
        tokens.access_token,
        tokens.auth_token,
        now.clone(),
        provider_key.to_owned(),
        provider_mode.to_owned(),
        tokens.refresh_token,
        session_id,
        Some(tokens.token_type),
        now,
        user_payload,
    ))
}

fn session_record_to_upstream_state(
    session: &UserSessionRecord,
) -> Option<PersistedUpstreamSessionState> {
    if session.upstream_auth_token.is_none()
        && session.upstream_access_token.is_none()
        && session.upstream_refresh_token.is_none()
        && session.upstream_token_type.is_none()
        && session.upstream_user_id.is_none()
        && session.upstream_payload_json.is_none()
    {
        return None;
    }

    Some(PersistedUpstreamSessionState {
        access_token: session.upstream_access_token.clone(),
        auth_token: session.upstream_auth_token.clone(),
        payload_json: session.upstream_payload_json.clone(),
        refresh_token: session.upstream_refresh_token.clone(),
        token_type: session.upstream_token_type.clone(),
        user_id: session.upstream_user_id.clone(),
    })
}

fn update_session_upstream_state(
    connection: &mut Connection,
    session_id: &str,
    upstream_state: &PersistedUpstreamSessionState,
) -> Result<(), String> {
    let now = crate::current_storage_timestamp();
    connection
        .execute(
            r#"
            UPDATE iam_session
            SET
                updated_at = ?2,
                upstream_auth_token = ?3,
                upstream_access_token = ?4,
                upstream_refresh_token = ?5,
                upstream_token_type = ?6,
                upstream_user_id = ?7,
                upstream_payload_json = ?8
            WHERE id = ?1 AND is_deleted = 0
            "#,
            params![
                session_id,
                &now,
                &upstream_state.auth_token,
                &upstream_state.access_token,
                &upstream_state.refresh_token,
                &upstream_state.token_type,
                &upstream_state.user_id,
                &upstream_state.payload_json,
            ],
        )
        .map_err(|error| format!("update upstream session state {session_id} failed: {error}"))?;
    Ok(())
}

fn require_normalized_email(email: &str) -> Result<String, String> {
    let normalized_email = normalize_email(email);
    if normalized_email.is_empty() {
        return Err("Email is required.".to_owned());
    }
    Ok(normalized_email)
}

fn normalize_password_reset_channel(value: &str) -> Result<&'static str, String> {
    match value.trim().to_ascii_uppercase().as_str() {
        "EMAIL" => Ok("EMAIL"),
        "SMS" => Ok("SMS"),
        _ => Err("channel must be EMAIL or SMS.".to_owned()),
    }
}

fn require_password_confirmation(
    password: &str,
    confirm_password: Option<&str>,
) -> Result<(), String> {
    if let Some(normalized_confirmation) = normalize_optional_text(confirm_password) {
        if normalized_confirmation != password {
            return Err("Password confirmation does not match.".to_owned());
        }
    }
    Ok(())
}

fn resolve_login_account(request: &UserCenterLoginRequest) -> Result<String, String> {
    normalize_optional_text(request.account.as_deref())
        .or_else(|| normalize_optional_text(request.email.as_deref()))
        .ok_or_else(|| "Account is required.".to_owned())
}

fn resolve_user_by_account(
    connection: &Connection,
    account: &str,
) -> Result<Option<UserRecord>, String> {
    if looks_like_phone_account(account) {
        let normalized_phone = require_normalized_phone(account)?;
        return load_user_by_phone(connection, &normalized_phone);
    }

    let normalized_email = require_normalized_email(account)?;
    load_user_by_email(connection, &normalized_email)
}

fn require_password_input(password: Option<&str>, operation_name: &str) -> Result<String, String> {
    let normalized_password = normalize_optional_text(password)
        .ok_or_else(|| format!("Password is required to {operation_name}."))?;
    if normalized_password.len() < 6 {
        return Err("Password must be at least 6 characters.".to_owned());
    }
    Ok(normalized_password)
}

fn build_user_center_metadata(
    mode: &UserCenterMode,
    external_integration: &ExternalUserCenterIntegrationKind,
    provider_key: &str,
    login_methods: &[&str],
    register_methods: &[&str],
    recovery_methods: &[&str],
    oauth_login_enabled: bool,
    qr_login_enabled: bool,
    oauth_providers: &[&str],
    supports_local_credentials: bool,
    supports_session_exchange: bool,
    supports_profile_write: bool,
    upstream_base_url: Option<String>,
) -> UserCenterMetadataPayload {
    let verification_policy = UserCenterVerificationPolicyPayload {
        email_code_login_enabled: login_methods.iter().any(|method| *method == "emailCode"),
        email_registration_verification_required: false,
        phone_code_login_enabled: login_methods.iter().any(|method| *method == "phoneCode"),
        phone_registration_verification_required: false,
    };

    UserCenterMetadataPayload {
        integration_kind: resolve_user_center_public_mode(mode, external_integration).to_owned(),
        login_methods: login_methods
            .iter()
            .map(|value| value.to_string())
            .collect(),
        mode: resolve_user_center_public_mode(mode, external_integration).to_owned(),
        oauth_login_enabled,
        oauth_providers: oauth_providers
            .iter()
            .map(|value| value.to_string())
            .collect(),
        provider_key: provider_key.to_owned(),
        qr_login_enabled,
        recovery_methods: recovery_methods
            .iter()
            .map(|value| value.to_string())
            .collect(),
        register_methods: register_methods
            .iter()
            .map(|value| value.to_string())
            .collect(),
        session_header_name: USER_CENTER_SESSION_HEADER_NAME,
        supports_local_credentials,
        supports_profile_write,
        supports_session_exchange,
        upstream_base_url,
        verification_policy,
    }
}

fn normalize_value_string(value: Option<&Value>) -> Option<String> {
    match value {
        Some(Value::String(inner)) => normalize_optional_text(Some(inner.as_str())),
        Some(Value::Number(inner)) => Some(inner.to_string()),
        Some(Value::Bool(inner)) => Some(inner.to_string()),
        _ => None,
    }
}

fn format_upstream_http_error(body: &str) -> String {
    let trimmed = body.trim();
    if trimmed.is_empty() {
        return "The upstream user-center request failed.".to_owned();
    }

    if let Ok(parsed) = serde_json::from_str::<UpstreamPlusApiEnvelope<Value>>(trimmed) {
        return parsed
            .msg
            .or(parsed.error_name)
            .or_else(|| normalize_value_string(parsed.data.as_ref()))
            .unwrap_or_else(|| trimmed.to_owned());
    }

    trimmed.to_owned()
}

fn is_upstream_success_code(code: Option<&str>) -> bool {
    let Some(normalized_code) = code.map(str::trim) else {
        return true;
    };
    normalized_code.is_empty()
        || normalized_code == "2000"
        || normalized_code == "200"
        || normalized_code == "0"
        || normalized_code.starts_with('2')
}

fn build_external_app_api_url(base_url: &str, path: &str) -> String {
    let normalized_base_url = base_url.trim_end_matches('/');
    if normalized_base_url.ends_with("/app/v3/api") {
        return format!("{normalized_base_url}{path}");
    }
    if normalized_base_url.ends_with("/app/v3") {
        return format!("{normalized_base_url}/api{path}");
    }
    if normalized_base_url.ends_with("/api") {
        return format!("{normalized_base_url}{path}");
    }
    format!("{normalized_base_url}/app/v3/api{path}")
}

fn upstream_request_json<TResponse: DeserializeOwned>(
    config: &ExternalAppApiConfig,
    method: &str,
    path: &str,
    headers: &BTreeMap<String, String>,
    body: Option<Value>,
) -> Result<Option<TResponse>, String> {
    let url = build_external_app_api_url(&config.base_url, path);
    let agent = ureq::agent();
    let request = match method {
        "GET" => agent.get(url.as_str()),
        "POST" => agent.post(url.as_str()),
        "PUT" => agent.put(url.as_str()),
        _ => {
            return Err(format!(
                "Unsupported upstream app-api method \"{method}\" for {path}."
            ))
        }
    };
    let request = headers.iter().fold(
        request.set("Accept", "application/json"),
        |request, (header_name, header_value)| {
            request.set(header_name.as_str(), header_value.as_str())
        },
    );

    let response = match body {
        Some(body) => {
            let serialized_body = body.to_string();
            request
                .set("Content-Type", "application/json")
                .send_string(serialized_body.as_str())
        }
        None => request.call(),
    };

    match response {
        Ok(response) => {
            let response_body = response.into_string().map_err(|error| {
                format!("read upstream user-center response body for {path} failed: {error}")
            })?;
            if crate::is_blank(Some(response_body.as_str())) {
                return Ok(None);
            }
            let envelope =
                serde_json::from_str::<UpstreamPlusApiEnvelope<TResponse>>(response_body.as_str())
                    .map_err(|error| {
                        format!(
                            "parse upstream user-center response body for {path} failed: {error}"
                        )
                    })?;
            if !is_upstream_success_code(envelope.code.as_deref()) {
                return Err(envelope
                    .msg
                    .or(envelope.error_name)
                    .unwrap_or_else(|| format!("Upstream user center rejected {method} {path}.")));
            }
            Ok(envelope.data)
        }
        Err(ureq::Error::Status(status, response)) => {
            let response_body = response.into_string().unwrap_or_default();
            Err(format!(
                "Upstream user center request {method} {path} failed with status {status}: {}",
                format_upstream_http_error(response_body.as_str())
            ))
        }
        Err(ureq::Error::Transport(error)) => Err(format!(
            "Upstream user center request {method} {path} failed after {:?}: {error}",
            config.timeout
        )),
    }
}

fn upsert_profile_shadow(
    connection: &mut Connection,
    user_id: &str,
    bio: Option<&str>,
    company: Option<&str>,
    location: Option<&str>,
    website: Option<&str>,
) -> Result<UserProfileRecord, String> {
    let now = crate::current_storage_timestamp();
    let existing = load_profile_record(connection, user_id)?;
    let resolved_bio = normalize_optional_text(bio)
        .or_else(|| existing.as_ref().and_then(|record| record.bio.clone()));
    let resolved_company = normalize_optional_text(company)
        .or_else(|| existing.as_ref().and_then(|record| record.company.clone()));
    let resolved_location = normalize_optional_text(location)
        .or_else(|| existing.as_ref().and_then(|record| record.location.clone()));
    let resolved_website = normalize_optional_text(website)
        .or_else(|| existing.as_ref().and_then(|record| record.website.clone()));
    let existing_metadata_json =
        load_user_by_id(connection, user_id)?.and_then(|user| user.metadata_json);
    let metadata_json = merge_local_user_metadata_json(
        existing_metadata_json.as_deref(),
        resolved_company.as_deref(),
        resolved_location.as_deref(),
        resolved_website.as_deref(),
    )?;

    connection
        .execute(
            r#"
            UPDATE iam_user
            SET
                updated_at = ?2,
                bio = ?3,
                metadata_json = ?4,
                status = 'active',
                is_deleted = 0
            WHERE id = ?1 AND is_deleted = 0
            "#,
            params![user_id, &now, &resolved_bio, &metadata_json,],
        )
        .map_err(|error| format!("upsert profile shadow {user_id} failed: {error}"))?;

    load_profile_record(connection, user_id)?
        .ok_or_else(|| format!("profile shadow {user_id} was not found after upsert"))
}

fn build_profile_payload_from_user(
    user: &UserRecord,
    profile: Option<UserProfileRecord>,
) -> UserCenterProfilePayload {
    UserCenterProfilePayload {
        uuid: user.uuid.clone(),
        tenant_id: user.tenant_id.clone(),
        organization_id: user.organization_id.clone(),
        created_at: user.created_at.clone(),
        updated_at: user.updated_at.clone(),
        avatar: user.avatar.clone(),
        bio: profile
            .as_ref()
            .and_then(|record| record.bio.clone())
            .filter(|value| !value.is_empty())
            .unwrap_or_default(),
        company: profile
            .as_ref()
            .and_then(|record| record.company.clone())
            .filter(|value| !value.is_empty())
            .unwrap_or_default(),
        display_name: user.display_name.clone(),
        email: user_record_public_email(user),
        user_id: user.id.clone(),
        location: profile
            .as_ref()
            .and_then(|record| record.location.clone())
            .filter(|value| !value.is_empty())
            .unwrap_or_default(),
        website: profile
            .and_then(|record| record.website)
            .filter(|value| !value.is_empty())
            .unwrap_or_default(),
    }
}

fn read_persisted_session_payload(
    app_id: &str,
    connection: &Connection,
    session_id: &str,
    provider_mode: &str,
) -> Result<Option<UserCenterSessionPayload>, String> {
    let Some(session) = load_session_record(connection, session_id)? else {
        return Ok(None);
    };
    if !is_active_status(&session.status) {
        return Ok(None);
    }

    let Some(user) = load_user_by_id(connection, &session.user_id)? else {
        return Ok(None);
    };
    if !is_active_status(&user.status) {
        return Ok(None);
    }

    let user = apply_active_organization_membership_context(connection, &user)?;
    let user_payload = map_user_record_to_user_payload(user);
    let upstream_state = session_record_to_upstream_state(&session);
    let tokens = resolve_user_center_session_tokens(
        app_id,
        connection,
        &session.id,
        &user_payload,
        upstream_state.as_ref(),
    )?;
    Ok(Some(build_user_center_session_payload(
        tokens.access_token,
        tokens.auth_token,
        session.created_at,
        session.provider_key,
        provider_mode.to_owned(),
        tokens.refresh_token,
        session.id,
        Some(tokens.token_type),
        session.updated_at,
        user_payload,
    )))
}

fn current_epoch_millis() -> Result<i64, String> {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map_err(|error| format!("read system time failed: {error}"))
        .map(|duration| duration.as_millis() as i64)
}

fn normalize_login_qr_key(qr_key: &str) -> Result<String, String> {
    normalize_optional_text(Some(qr_key)).ok_or_else(|| "qrKey is required.".to_owned())
}

fn join_base_url_path(base_url: Option<&str>, path: &str) -> String {
    let normalized_path = if path.starts_with('/') {
        path.to_owned()
    } else {
        format!("/{path}")
    };

    match base_url.and_then(|value| normalize_optional_text(Some(value))) {
        Some(base_url) => format!("{}{}", base_url.trim_end_matches('/'), normalized_path),
        None => normalized_path,
    }
}

fn create_login_qr_record(
    connection: &mut Connection,
    provider_key: &str,
    ttl: Duration,
) -> Result<LoginQrRecord, String> {
    let registration_scope = require_resolved_registration_scope(connection, None)?;
    let qr_key = crate::create_identifier("user-login-qr");
    let now_millis = current_epoch_millis()?;
    let now = crate::storage_timestamp_from_millis(now_millis);
    let expires_at =
        crate::storage_timestamp_from_millis(now_millis.saturating_add(ttl.as_millis() as i64));

    connection
        .execute(
            r#"
            INSERT INTO iam_login_qr (
                id, uuid, tenant_id, organization_id, provider_key, qr_key, status, session_id, user_id,
                scanned_at, confirmed_at, expires_at, metadata_json,
                created_at, updated_at, version, is_deleted
            )
            VALUES (
                ?1, ?2, ?3, ?4, ?5, ?6, 'pending', NULL, NULL,
                NULL, NULL, ?7, NULL,
                ?8, ?9, 0, 0
            )
            "#,
            params![
                &qr_key,
                stable_entity_uuid("iam_login_qr", &qr_key),
                registration_scope.tenant_id.as_str(),
                registration_scope
                    .organization_id
                    .as_deref()
                    .unwrap_or(DEFAULT_LOCAL_ORGANIZATION_ID),
                provider_key,
                &qr_key,
                &expires_at,
                &now,
                &now,
            ],
        )
        .map_err(|error| format!("create login qr {qr_key} failed: {error}"))?;

    Ok(LoginQrRecord {
        expires_at,
        id: qr_key.clone(),
        qr_key,
        session_id: None,
        status: "pending".to_owned(),
        user_id: None,
    })
}

fn load_login_qr_record(
    connection: &Connection,
    qr_key: &str,
) -> Result<Option<LoginQrRecord>, String> {
    connection
        .query_row(
            r#"
            SELECT
                id,
                qr_key,
                status,
                session_id,
                user_id,
                scanned_at,
                confirmed_at,
                expires_at,
                created_at,
                updated_at
            FROM iam_login_qr
            WHERE qr_key = ?1 AND is_deleted = 0
            LIMIT 1
            "#,
            params![qr_key],
            |row| {
                Ok(LoginQrRecord {
                    id: sqlite_row_required_string_value(row, 0, "iam_login_qr.id")?,
                    qr_key: row.get(1)?,
                    status: row.get(2)?,
                    session_id: sqlite_row_optional_string_value(
                        row,
                        3,
                        "iam_login_qr.session_id",
                    )?,
                    user_id: sqlite_row_optional_string_value(row, 4, "iam_login_qr.user_id")?,
                    expires_at: row.get(7)?,
                })
            },
        )
        .optional()
        .map_err(|error| format!("load login qr {qr_key} failed: {error}"))
}

fn expire_login_qr_record(connection: &mut Connection, record_id: &str) -> Result<(), String> {
    let now = crate::current_storage_timestamp();
    connection
        .execute(
            r#"
            UPDATE iam_login_qr
            SET updated_at = ?2, status = 'expired'
            WHERE id = ?1 AND is_deleted = 0
            "#,
            params![record_id, &now],
        )
        .map_err(|error| format!("expire login qr {record_id} failed: {error}"))?;
    Ok(())
}

fn touch_login_qr_scanned(connection: &mut Connection, record_id: &str) -> Result<(), String> {
    let now = crate::current_storage_timestamp();
    connection
        .execute(
            r#"
            UPDATE iam_login_qr
            SET
                updated_at = ?2,
                status = CASE WHEN status = 'pending' THEN 'scanned' ELSE status END,
                scanned_at = COALESCE(scanned_at, ?2)
            WHERE id = ?1 AND is_deleted = 0
            "#,
            params![record_id, &now],
        )
        .map_err(|error| format!("mark login qr {record_id} scanned failed: {error}"))?;
    Ok(())
}

fn confirm_login_qr_record(
    connection: &mut Connection,
    record_id: &str,
    session: &UserCenterSessionPayload,
) -> Result<(), String> {
    let now = crate::current_storage_timestamp();
    connection
        .execute(
            r#"
            UPDATE iam_login_qr
            SET
                updated_at = ?2,
                status = 'confirmed',
                session_id = ?3,
                user_id = ?4,
                scanned_at = COALESCE(scanned_at, ?2),
                confirmed_at = ?2
            WHERE id = ?1 AND is_deleted = 0
            "#,
            params![record_id, &now, &session.session_id, &session.user.id],
        )
        .map_err(|error| format!("confirm login qr {record_id} failed: {error}"))?;
    Ok(())
}

fn build_login_qr_code_payload(
    record: &LoginQrRecord,
    request_base_url: Option<&str>,
) -> UserCenterLoginQrCodePayload {
    UserCenterLoginQrCodePayload {
        description: Some(
            "Scan with another signed-in SDKWork User Center session to confirm login quickly."
                .to_owned(),
        ),
        expire_time: crate::parse_storage_timestamp_millis(&record.expires_at),
        qr_content: Some(join_base_url_path(
            request_base_url,
            &format!("/auth/qr/{}", record.qr_key),
        )),
        qr_key: record.qr_key.clone(),
        qr_url: None,
        title: Some("Scan To Sign In".to_owned()),
        qr_type: Some("session-transfer".to_owned()),
    }
}

fn build_login_qr_status_payload(
    connection: &Connection,
    record: &LoginQrRecord,
) -> Result<UserCenterLoginQrStatusPayload, String> {
    let session = if record.status == "confirmed" {
        let Some(session_id) = record.session_id.as_deref() else {
            return Ok(UserCenterLoginQrStatusPayload {
                session: None,
                status: "expired".to_owned(),
                user: None,
            });
        };
        let Some(session_record) = load_session_record(connection, session_id)? else {
            return Ok(UserCenterLoginQrStatusPayload {
                session: None,
                status: "expired".to_owned(),
                user: None,
            });
        };
        read_persisted_session_payload(
            read_env_trimmed(SDKWORK_USER_CENTER_APP_ID_ENV)
                .as_deref()
                .unwrap_or_default(),
            connection,
            session_id,
            session_record.provider_mode.as_str(),
        )?
    } else {
        None
    };

    let user = match session.as_ref() {
        Some(session) => Some(session.user.clone()),
        None => match record.user_id.as_deref() {
            Some(user_id) => {
                load_user_by_id(connection, user_id)?.map(map_user_record_to_user_payload)
            }
            None => None,
        },
    };

    Ok(UserCenterLoginQrStatusPayload {
        session,
        status: record.status.clone(),
        user,
    })
}

fn resolve_login_qr_status_payload(
    connection: &mut Connection,
    qr_key: &str,
) -> Result<UserCenterLoginQrStatusPayload, String> {
    let normalized_qr_key = normalize_login_qr_key(qr_key)?;
    let Some(record) = load_login_qr_record(connection, &normalized_qr_key)? else {
        return Err(format!("Login QR code {normalized_qr_key} was not found."));
    };

    if record.status != "confirmed" {
        let expires_at_millis =
            crate::parse_storage_timestamp_millis(&record.expires_at).unwrap_or_default();
        if expires_at_millis < current_epoch_millis()? {
            expire_login_qr_record(connection, &record.id)?;
            return Ok(UserCenterLoginQrStatusPayload {
                session: None,
                status: "expired".to_owned(),
                user: None,
            });
        }
    }

    build_login_qr_status_payload(connection, &record)
}

fn build_profile_payload(
    session: &UserCenterSessionPayload,
    profile: Option<UserProfileRecord>,
) -> UserCenterProfilePayload {
    UserCenterProfilePayload {
        uuid: session.user.uuid.clone(),
        tenant_id: session.user.tenant_id.clone(),
        organization_id: session.user.organization_id.clone(),
        created_at: session.user.created_at.clone(),
        updated_at: session.user.updated_at.clone(),
        avatar: session.user.avatar.clone(),
        bio: profile
            .as_ref()
            .and_then(|record| record.bio.clone())
            .filter(|value| !value.is_empty())
            .unwrap_or_default(),
        company: profile
            .as_ref()
            .and_then(|record| record.company.clone())
            .filter(|value| !value.is_empty())
            .unwrap_or_default(),
        display_name: session.user.name.clone(),
        email: session.user.email.clone(),
        user_id: session.user.id.clone(),
        location: profile
            .as_ref()
            .and_then(|record| record.location.clone())
            .filter(|value| !value.is_empty())
            .unwrap_or_default(),
        website: profile
            .and_then(|record| record.website)
            .filter(|value| !value.is_empty())
            .unwrap_or_default(),
    }
}

fn revoke_session(connection: &mut Connection, session_id: &str) -> Result<(), String> {
    let now = crate::current_storage_timestamp();
    connection
        .execute(
            r#"
            UPDATE iam_session
            SET updated_at = ?2, is_deleted = 1, status = 'revoked'
            WHERE id = ?1 AND is_deleted = 0
            "#,
            params![session_id, &now],
        )
        .map_err(|error| format!("revoke user auth session {session_id} failed: {error}"))?;
    Ok(())
}

fn upsert_profile_record(
    connection: &mut Connection,
    session: &UserCenterSessionPayload,
    request: &UpdateUserCenterProfileRequest,
) -> Result<UserCenterProfilePayload, String> {
    let now = crate::current_storage_timestamp();
    let display_name = normalize_optional_text(request.display_name.as_deref())
        .unwrap_or_else(|| session.user.name.clone());
    let avatar = request
        .avatar
        .clone()
        .or_else(|| session.user.avatar.clone());
    let avatar_snapshot = avatar
        .as_ref()
        .map(media_resource_to_snapshot)
        .transpose()?;

    connection
        .execute(
            r#"
            UPDATE iam_user
            SET updated_at = ?2, nickname = ?3, avatar_resource_snapshot = ?4, is_deleted = 0, status = 'active'
            WHERE id = ?1
            "#,
            params![&session.user.id, &now, &display_name, &avatar_snapshot],
        )
        .map_err(|error| {
            format!(
                "update user profile shell {} failed: {error}",
                session.user.id
            )
        })?;

    upsert_profile_shadow(
        connection,
        &session.user.id,
        request.bio.as_deref(),
        request.company.as_deref(),
        request.location.as_deref(),
        request.website.as_deref(),
    )?;

    let updated_session = build_user_center_session_payload(
        session.access_token.clone(),
        session.auth_token.clone(),
        session.created_at.clone(),
        session.provider_key.clone(),
        session.provider_mode.clone(),
        session.refresh_token.clone(),
        session.session_id.clone(),
        Some(session.token_type.clone()),
        now,
        UserCenterUserPayload {
            uuid: session.user.uuid.clone(),
            tenant_id: session.user.tenant_id.clone(),
            organization_id: session.user.organization_id.clone(),
            created_at: session.user.created_at.clone(),
            updated_at: session.user.updated_at.clone(),
            avatar,
            email: session.user.email.clone(),
            id: session.user.id.clone(),
            name: display_name,
        },
    );

    Ok(build_profile_payload(
        &updated_session,
        load_profile_record(connection, &session.user.id)?,
    ))
}

#[derive(Clone)]
struct MisconfiguredUserCenterProvider {
    message: String,
    metadata: UserCenterMetadataPayload,
}

impl MisconfiguredUserCenterProvider {
    fn new(
        mode: UserCenterMode,
        external_integration: ExternalUserCenterIntegrationKind,
        provider_key: String,
        message: String,
    ) -> Self {
        Self {
            message,
            metadata: build_user_center_metadata(
                &mode,
                &external_integration,
                &provider_key,
                &[],
                &[],
                &[],
                false,
                false,
                &[],
                false,
                false,
                false,
                None,
            ),
        }
    }
}

impl UserCenterProvider for MisconfiguredUserCenterProvider {
    fn exchange_session(
        &self,
        _connection: &mut Connection,
        _request: &UserCenterSessionExchangeRequest,
    ) -> Result<UserCenterSessionPayload, String> {
        Err(self.message.clone())
    }

    fn login(
        &self,
        _connection: &mut Connection,
        _request: &UserCenterLoginRequest,
    ) -> Result<UserCenterSessionPayload, String> {
        Err(self.message.clone())
    }

    fn logout(
        &self,
        _connection: &mut Connection,
        _session_id: Option<&str>,
    ) -> Result<(), String> {
        Ok(())
    }

    fn metadata(&self) -> UserCenterMetadataPayload {
        self.metadata.clone()
    }

    fn read_profile(
        &self,
        _connection: &mut Connection,
        _session: &UserCenterSessionPayload,
    ) -> Result<UserCenterProfilePayload, String> {
        Err(self.message.clone())
    }

    fn register(
        &self,
        _connection: &mut Connection,
        _request: &UserCenterRegisterRequest,
    ) -> Result<UserCenterSessionPayload, String> {
        Err(self.message.clone())
    }

    fn resolve_session(
        &self,
        _connection: &Connection,
        _headers: &HeaderMap,
    ) -> Result<Option<UserCenterSessionPayload>, String> {
        Ok(None)
    }

    fn update_profile(
        &self,
        _connection: &mut Connection,
        _session: &UserCenterSessionPayload,
        _request: &UpdateUserCenterProfileRequest,
    ) -> Result<UserCenterProfilePayload, String> {
        Err(self.message.clone())
    }
}

#[derive(Clone)]
struct LocalUserCenterProvider {
    app_id: String,
    oauth_authority: LocalOAuthAuthority,
    provider_key: String,
}

impl LocalUserCenterProvider {
    fn new(app_id: String, provider_key: String) -> Self {
        Self {
            app_id,
            oauth_authority: LocalOAuthAuthority::new(provider_key.as_str()),
            provider_key,
        }
    }

    fn create_local_session(
        &self,
        connection: &mut Connection,
        user: &UserRecord,
    ) -> Result<UserCenterSessionPayload, String> {
        ensure_default_profile(connection, &user.id)?;
        create_persisted_session(
            &self.app_id,
            connection,
            user,
            resolve_user_center_public_mode(
                &UserCenterMode::Local,
                &ExternalUserCenterIntegrationKind::Headers,
            ),
            &self.provider_key,
            None,
        )
    }

    fn register_local_email_user(
        &self,
        connection: &mut Connection,
        email: &str,
        explicit_name: Option<&str>,
        password: &str,
        requested_tenant_id: Option<&str>,
    ) -> Result<UserRecord, String> {
        let normalized_email = require_normalized_email(email)?;
        if let Some(existing_user) = load_user_by_email(connection, &normalized_email)? {
            if existing_user.provider_key != self.provider_key {
                return Err(format!(
                    "The account {normalized_email} is already managed by provider {}.",
                    existing_user.provider_key
                ));
            }
            if load_local_credentials(connection, &existing_user.id)?.is_some() {
                return Err(format!("The account {normalized_email} already exists."));
            }
        }

        let preferred_user_id = load_user_by_email(connection, &normalized_email)?
            .map(|user| user.id)
            .unwrap_or_else(|| crate::create_identifier("user"));
        let display_name = resolve_display_name(explicit_name);
        let registration_scope =
            require_resolved_registration_scope(connection, requested_tenant_id)?;
        let user = upsert_user_shadow(
            connection,
            &preferred_user_id,
            &normalized_email,
            &display_name,
            None,
            &self.provider_key,
            None,
            Some(registration_scope.tenant_id.as_str()),
            registration_scope.organization_id.as_deref(),
        )?;
        ensure_default_profile(connection, &user.id)?;
        ensure_local_credentials(connection, &user.id, password, false)?;
        Ok(user)
    }

    fn register_local_phone_user(
        &self,
        connection: &mut Connection,
        phone: &str,
        explicit_name: Option<&str>,
        password: &str,
        requested_tenant_id: Option<&str>,
    ) -> Result<UserRecord, String> {
        let normalized_phone = require_normalized_phone(phone)?;
        let existing_user = load_user_by_phone(connection, &normalized_phone)?;

        if let Some(existing_user) = existing_user.as_ref() {
            if existing_user.provider_key != self.provider_key {
                return Err(format!(
                    "The account {normalized_phone} is already managed by provider {}.",
                    existing_user.provider_key
                ));
            }
            if load_local_credentials(connection, &existing_user.id)?.is_some() {
                return Err(format!("The account {normalized_phone} already exists."));
            }
        }

        let preferred_user_id = existing_user
            .as_ref()
            .map(|user| user.id.clone())
            .unwrap_or_else(|| crate::create_identifier("user"));
        let resolved_email = existing_user.as_ref().and_then(|user| user.email.clone());
        let display_name = resolve_phone_display_name(explicit_name);
        let registration_scope =
            require_resolved_registration_scope(connection, requested_tenant_id)?;
        let user = upsert_user_shadow_with_phone(
            connection,
            &preferred_user_id,
            resolved_email.as_deref().unwrap_or_default(),
            Some(&normalized_phone),
            &display_name,
            None,
            &self.provider_key,
            None,
            Some(registration_scope.tenant_id.as_str()),
            registration_scope.organization_id.as_deref(),
        )?;
        ensure_default_profile(connection, &user.id)?;
        ensure_local_credentials(connection, &user.id, password, false)?;
        Ok(user)
    }

    fn resolve_or_create_oauth_user(
        &self,
        connection: &mut Connection,
        claims: &LocalOAuthAuthorizationCodeClaims,
    ) -> Result<UserRecord, String> {
        let normalized_provider = normalize_oauth_provider_identifier(&claims.provider)?;
        let normalized_subject = normalize_optional_text(Some(claims.subject.as_str()))
            .ok_or_else(|| "OAuth subject is required.".to_owned())?;
        let normalized_phone = claims
            .phone
            .as_deref()
            .map(normalize_phone)
            .filter(|value| !value.is_empty());
        let normalized_email = resolve_shadow_email_for_account(
            Some(claims.email.as_str()),
            normalized_phone.as_deref(),
            Some(normalized_subject.as_str()),
        );

        let existing_user = if let Some(bound_user) = load_user_by_oauth_account(
            connection,
            normalized_provider.as_str(),
            normalized_subject.as_str(),
        )? {
            Some(bound_user)
        } else if let Some(phone) = normalized_phone.as_deref() {
            match load_user_by_phone(connection, phone)? {
                Some(user) => Some(user),
                None if !normalized_email.is_empty() => {
                    load_user_by_email(connection, normalized_email.as_str())?
                }
                None => None,
            }
        } else if !normalized_email.is_empty() {
            load_user_by_email(connection, normalized_email.as_str())?
        } else {
            None
        };

        if let Some(existing_user) = existing_user.as_ref() {
            if existing_user.provider_key != self.provider_key {
                return Err(format!(
                    "The OAuth account {} is already managed by provider {}.",
                    normalized_provider, existing_user.provider_key
                ));
            }
            if !is_active_status(&existing_user.status) {
                return Err("The OAuth account is not active.".to_owned());
            }
        }

        let preferred_user_id = existing_user
            .as_ref()
            .map(|user| user.id.clone())
            .unwrap_or_else(|| crate::create_identifier("user"));
        let display_name = match normalized_phone.as_deref() {
            Some(_phone) => resolve_phone_display_name(Some(claims.name.as_str())),
            None => resolve_display_name(Some(claims.name.as_str())),
        };
        let registration_scope = require_resolved_registration_scope(connection, None)?;
        let user = upsert_user_shadow_with_phone(
            connection,
            preferred_user_id.as_str(),
            normalized_email.as_str(),
            normalized_phone.as_deref(),
            &display_name,
            claims.avatar.as_ref(),
            &self.provider_key,
            None,
            Some(registration_scope.tenant_id.as_str()),
            registration_scope.organization_id.as_deref(),
        )?;
        let oauth_user_info_json = serde_json::to_string(claims)
            .map_err(|error| format!("serialize local OAuth user info failed: {error}"))?;
        upsert_oauth_account_record(
            connection,
            user.id.as_str(),
            normalized_provider.as_str(),
            normalized_subject.as_str(),
            None,
            None,
            Some(oauth_user_info_json.as_str()),
        )?;
        ensure_default_profile(connection, &user.id)?;
        Ok(user)
    }
}

impl UserCenterProvider for LocalUserCenterProvider {
    fn exchange_session(
        &self,
        _connection: &mut Connection,
        _request: &UserCenterSessionExchangeRequest,
    ) -> Result<UserCenterSessionPayload, String> {
        Err("Session exchange is not supported for local user center mode.".to_owned())
    }

    fn get_oauth_authorization_url(
        &self,
        request: &UserCenterOAuthAuthorizationRequest,
    ) -> Result<UserCenterOAuthUrlPayload, String> {
        self.oauth_authority.build_authorization_url(request)
    }

    fn login_with_email_code(
        &self,
        _connection: &mut Connection,
        _request: &UserCenterEmailCodeLoginRequest,
    ) -> Result<UserCenterSessionPayload, String> {
        Err("Email verification-code login is owned by messaging and is not enabled in local user center mode.".to_owned())
    }

    fn login_with_oauth(
        &self,
        connection: &mut Connection,
        request: &UserCenterOAuthLoginRequest,
    ) -> Result<UserCenterSessionPayload, String> {
        let normalized_provider = normalize_oauth_provider_identifier(&request.provider)?;
        let claims = self
            .oauth_authority
            .resolve_authorization_code(request.code.as_str(), normalized_provider.as_str())?;
        let user = self.resolve_or_create_oauth_user(connection, &claims)?;
        self.create_local_session(connection, &user)
    }

    fn login_with_phone_code(
        &self,
        _connection: &mut Connection,
        _request: &UserCenterPhoneCodeLoginRequest,
    ) -> Result<UserCenterSessionPayload, String> {
        Err("Phone verification-code login is owned by messaging and is not enabled in local user center mode.".to_owned())
    }

    fn login(
        &self,
        connection: &mut Connection,
        request: &UserCenterLoginRequest,
    ) -> Result<UserCenterSessionPayload, String> {
        let account = resolve_login_account(request)?;
        let password = require_password_input(request.password.as_deref(), "sign in")?;
        let invalid_credentials_error = || "Invalid account or password.".to_owned();
        let user =
            resolve_user_by_account(connection, &account)?.ok_or_else(invalid_credentials_error)?;
        let credentials =
            load_local_credentials(connection, &user.id)?.ok_or_else(invalid_credentials_error)?;
        if !is_active_status(&user.status) || !is_active_status(&credentials.status) {
            return Err(invalid_credentials_error());
        }
        if !verify_local_password(&credentials.password_hash, &password)? {
            return Err(invalid_credentials_error());
        }
        self.create_local_session(connection, &user)
    }

    fn logout(&self, connection: &mut Connection, session_id: Option<&str>) -> Result<(), String> {
        if let Some(normalized_session_id) = session_id
            .map(|value| value.trim())
            .filter(|value| !value.is_empty())
        {
            revoke_session(connection, normalized_session_id)?;
        }
        Ok(())
    }

    fn metadata(&self) -> UserCenterMetadataPayload {
        let oauth_providers = self.oauth_authority.enabled_provider_ids();
        build_user_center_metadata(
            &UserCenterMode::Local,
            &ExternalUserCenterIntegrationKind::Headers,
            &self.provider_key,
            &["password"],
            &["email", "phone"],
            &[],
            !oauth_providers.is_empty(),
            true,
            oauth_providers
                .iter()
                .map(String::as_str)
                .collect::<Vec<_>>()
                .as_slice(),
            true,
            false,
            true,
            None,
        )
    }

    fn read_profile(
        &self,
        connection: &mut Connection,
        session: &UserCenterSessionPayload,
    ) -> Result<UserCenterProfilePayload, String> {
        Ok(build_profile_payload(
            session,
            load_profile_record(connection, &session.user.id)?,
        ))
    }

    fn register(
        &self,
        connection: &mut Connection,
        request: &UserCenterRegisterRequest,
    ) -> Result<UserCenterSessionPayload, String> {
        let password = require_password_input(request.password.as_deref(), "register")?;
        require_password_confirmation(&password, request.confirm_password.as_deref())?;
        let explicit_name = request.name.as_deref().or(request.username.as_deref());
        let normalized_channel = normalize_optional_text(request.channel.as_deref())
            .map(|value| value.to_ascii_uppercase());
        let requested_tenant_id = normalize_optional_text(request.tenant_id.as_deref());

        let user = match normalized_channel.as_deref() {
            Some("PHONE") | Some("SMS") => {
                let normalized_phone = request
                    .phone
                    .as_deref()
                    .ok_or_else(|| "Phone is required for phone registration.".to_owned())
                    .and_then(require_normalized_phone)?;
                self.register_local_phone_user(
                    connection,
                    &normalized_phone,
                    explicit_name,
                    &password,
                    requested_tenant_id.as_deref(),
                )?
            }
            Some("EMAIL") => {
                let normalized_email = request
                    .email
                    .as_deref()
                    .ok_or_else(|| "Email is required for email registration.".to_owned())
                    .and_then(require_normalized_email)?;
                self.register_local_email_user(
                    connection,
                    &normalized_email,
                    explicit_name,
                    &password,
                    requested_tenant_id.as_deref(),
                )?
            }
            Some(_) => {
                return Err("channel must be EMAIL, PHONE, or SMS.".to_owned());
            }
            None if request.phone.is_some() && request.email.is_none() => {
                let normalized_phone = request
                    .phone
                    .as_deref()
                    .ok_or_else(|| "Phone is required for phone registration.".to_owned())
                    .and_then(require_normalized_phone)?;
                self.register_local_phone_user(
                    connection,
                    &normalized_phone,
                    explicit_name,
                    &password,
                    requested_tenant_id.as_deref(),
                )?
            }
            None => {
                let normalized_email = request
                    .email
                    .as_deref()
                    .ok_or_else(|| "Email is required for email registration.".to_owned())
                    .and_then(require_normalized_email)?;
                self.register_local_email_user(
                    connection,
                    &normalized_email,
                    explicit_name,
                    &password,
                    requested_tenant_id.as_deref(),
                )?
            }
        };
        self.create_local_session(connection, &user)
    }

    fn request_password_reset(
        &self,
        _connection: &mut Connection,
        _request: &UserCenterPasswordResetChallengeRequest,
    ) -> Result<(), String> {
        Err("Password-reset verification-code delivery is owned by messaging and is not enabled in local user center mode.".to_owned())
    }

    fn reset_password(
        &self,
        connection: &mut Connection,
        request: &UserCenterPasswordResetRequest,
    ) -> Result<(), String> {
        let password =
            require_password_input(Some(request.new_password.as_str()), "reset password")?;
        require_password_confirmation(&password, request.confirm_password.as_deref())?;
        let account = normalize_optional_text(Some(request.account.as_str()))
            .ok_or_else(|| "Account is required.".to_owned())?;
        let user = resolve_user_by_account(connection, &account)?
            .ok_or_else(|| "The account was not found.".to_owned())?;
        let _ = user;

        Err("Password reset by verification code is owned by messaging and is not enabled in local user center mode.".to_owned())
    }

    fn resolve_session(
        &self,
        connection: &Connection,
        headers: &HeaderMap,
    ) -> Result<Option<UserCenterSessionPayload>, String> {
        let Some(session_id) = read_session_header(headers) else {
            return Ok(None);
        };
        read_persisted_session_payload(
            &self.app_id,
            connection,
            &session_id,
            resolve_user_center_public_mode(
                &UserCenterMode::Local,
                &ExternalUserCenterIntegrationKind::Headers,
            ),
        )
    }

    fn update_profile(
        &self,
        connection: &mut Connection,
        session: &UserCenterSessionPayload,
        request: &UpdateUserCenterProfileRequest,
    ) -> Result<UserCenterProfilePayload, String> {
        upsert_profile_record(connection, session, request)
    }
}

#[derive(Clone)]
struct HeaderExternalUserCenterProvider {
    app_id: String,
    external_headers: ExternalHeaderConfig,
    provider_key: String,
}

impl HeaderExternalUserCenterProvider {
    fn new(app_id: String, provider_key: String, external_headers: ExternalHeaderConfig) -> Self {
        Self {
            app_id,
            external_headers,
            provider_key,
        }
    }

    fn resolve_header_backed_session(
        &self,
        connection: &Connection,
        headers: &HeaderMap,
    ) -> Result<Option<UserCenterSessionPayload>, String> {
        let Some(email) = read_header_value(headers, &self.external_headers.email_header) else {
            return Ok(None);
        };
        let tenant_id = read_header_value(headers, &self.external_headers.tenant_header)
            .ok_or_else(|| "External user-center tenant header is required.".to_owned())?;
        let organization_id =
            read_header_value(headers, &self.external_headers.organization_header)
                .unwrap_or_else(|| DEFAULT_LOCAL_ORGANIZATION_ID.to_owned());
        let external_subject = read_header_value(headers, &self.external_headers.id_header);
        let existing_user = resolve_existing_external_user(
            connection,
            &self.provider_key,
            external_subject.as_deref(),
            &email,
        )?;
        let user_id = existing_user
            .as_ref()
            .map(|user| user.id.clone())
            .unwrap_or_else(|| {
                build_external_user_id(&self.provider_key, external_subject.as_deref(), &email)
            });
        let name = read_header_value(headers, &self.external_headers.name_header)
            .or_else(|| existing_user.as_ref().map(|user| user.display_name.clone()))
            .unwrap_or_default();
        let avatar = read_header_value(headers, &self.external_headers.avatar_header)
            .and_then(|value| external_url_media_resource(&value, "image"));
        let now = crate::current_storage_timestamp();
        let user_timestamp = now.clone();
        let session_id = format!("external-header:{user_id}");
        let user_payload = UserCenterUserPayload {
            uuid: stable_entity_uuid("iam_user", &user_id),
            tenant_id: Some(tenant_id),
            organization_id: Some(organization_id),
            created_at: user_timestamp.clone(),
            updated_at: user_timestamp,
            avatar,
            email,
            id: user_id,
            name,
        };
        let tokens = resolve_user_center_session_tokens(
            &self.app_id,
            connection,
            &session_id,
            &user_payload,
            None,
        )?;

        Ok(Some(build_user_center_session_payload(
            tokens.access_token,
            tokens.auth_token,
            now.clone(),
            self.provider_key.clone(),
            resolve_user_center_public_mode(
                &UserCenterMode::External,
                &ExternalUserCenterIntegrationKind::Headers,
            )
            .to_owned(),
            tokens.refresh_token,
            session_id,
            Some(tokens.token_type),
            now,
            user_payload,
        )))
    }

    fn ensure_shadow_user_for_session(
        &self,
        connection: &mut Connection,
        session: &UserCenterSessionPayload,
    ) -> Result<(), String> {
        upsert_user_shadow(
            connection,
            &session.user.id,
            &session.user.email,
            &session.user.name,
            session.user.avatar.as_ref(),
            &self.provider_key,
            None,
            session.user.tenant_id.as_deref(),
            session.user.organization_id.as_deref(),
        )?;
        ensure_default_profile(connection, &session.user.id)?;
        Ok(())
    }
}

impl UserCenterProvider for HeaderExternalUserCenterProvider {
    fn exchange_session(
        &self,
        connection: &mut Connection,
        request: &UserCenterSessionExchangeRequest,
    ) -> Result<UserCenterSessionPayload, String> {
        let normalized_email = require_normalized_email(&request.email)?;
        let provider_key = normalize_optional_text(request.provider_key.as_deref())
            .unwrap_or_else(|| self.provider_key.clone());
        let external_subject = normalize_optional_text(request.subject.as_deref())
            .or_else(|| normalize_optional_text(request.user_id.as_deref()));
        let existing_user = resolve_existing_external_user(
            connection,
            provider_key.as_str(),
            external_subject.as_deref(),
            normalized_email.as_str(),
        )?;
        let preferred_user_id = existing_user
            .as_ref()
            .map(|user| user.id.clone())
            .unwrap_or_else(|| {
                build_external_user_id(
                    provider_key.as_str(),
                    external_subject.as_deref(),
                    normalized_email.as_str(),
                )
            });
        let display_name = resolve_display_name(request.name.as_deref());
        let tenant_id = normalize_optional_text(request.tenant_id.as_deref()).ok_or_else(|| {
            "tenantId is required for external user-center session exchange.".to_owned()
        })?;
        let user = upsert_user_shadow(
            connection,
            &preferred_user_id,
            &normalized_email,
            &display_name,
            request.avatar.as_ref(),
            provider_key.as_str(),
            external_subject.as_deref(),
            Some(tenant_id.as_str()),
            request.organization_id.as_deref(),
        )?;
        ensure_default_profile(connection, &user.id)?;
        create_persisted_session(
            &self.app_id,
            connection,
            &user,
            resolve_user_center_public_mode(
                &UserCenterMode::External,
                &ExternalUserCenterIntegrationKind::Headers,
            ),
            provider_key.as_str(),
            None,
        )
    }

    fn login(
        &self,
        _connection: &mut Connection,
        _request: &UserCenterLoginRequest,
    ) -> Result<UserCenterSessionPayload, String> {
        Err("Login is delegated to the configured third-party header-based user center.".to_owned())
    }

    fn logout(&self, connection: &mut Connection, session_id: Option<&str>) -> Result<(), String> {
        if let Some(normalized_session_id) = session_id
            .map(|value| value.trim())
            .filter(|value| !value.is_empty())
        {
            revoke_session(connection, normalized_session_id)?;
        }
        Ok(())
    }

    fn metadata(&self) -> UserCenterMetadataPayload {
        build_user_center_metadata(
            &UserCenterMode::External,
            &ExternalUserCenterIntegrationKind::Headers,
            &self.provider_key,
            &["sessionBridge"],
            &[],
            &[],
            false,
            true,
            &[],
            false,
            true,
            true,
            None,
        )
    }

    fn read_profile(
        &self,
        connection: &mut Connection,
        session: &UserCenterSessionPayload,
    ) -> Result<UserCenterProfilePayload, String> {
        Ok(build_profile_payload(
            session,
            load_profile_record(connection, &session.user.id)?,
        ))
    }

    fn register(
        &self,
        _connection: &mut Connection,
        _request: &UserCenterRegisterRequest,
    ) -> Result<UserCenterSessionPayload, String> {
        Err(
            "Registration is delegated to the configured third-party header-based user center."
                .to_owned(),
        )
    }

    fn resolve_session(
        &self,
        connection: &Connection,
        headers: &HeaderMap,
    ) -> Result<Option<UserCenterSessionPayload>, String> {
        if let Some(session_id) = read_session_header(headers) {
            if let Some(persisted_session) = read_persisted_session_payload(
                &self.app_id,
                connection,
                &session_id,
                resolve_user_center_public_mode(
                    &UserCenterMode::External,
                    &ExternalUserCenterIntegrationKind::Headers,
                ),
            )? {
                return Ok(Some(persisted_session));
            }
        }
        self.resolve_header_backed_session(connection, headers)
    }

    fn update_profile(
        &self,
        connection: &mut Connection,
        session: &UserCenterSessionPayload,
        request: &UpdateUserCenterProfileRequest,
    ) -> Result<UserCenterProfilePayload, String> {
        self.ensure_shadow_user_for_session(connection, session)?;
        upsert_profile_record(connection, session, request)
    }
}

#[derive(Clone)]
struct SdkworkCloudAppApiExternalUserCenterProvider {
    config: ExternalAppApiConfig,
    oauth_providers: Vec<String>,
    provider_key: String,
}

impl SdkworkCloudAppApiExternalUserCenterProvider {
    fn new(provider_key: String, config: ExternalAppApiConfig) -> Self {
        Self {
            config,
            oauth_providers: resolve_cloud_app_api_oauth_providers_from_env(),
            provider_key,
        }
    }

    fn require_enabled_oauth_provider(&self, provider: &str) -> Result<String, String> {
        let normalized_provider = normalize_oauth_provider_identifier(provider)?;
        if self.oauth_providers.contains(&normalized_provider) {
            return Ok(normalized_provider);
        }

        Err(format!(
            "OAuth provider {} is not enabled for the configured sdkwork-cloud-app-api integration.",
            normalized_provider
        ))
    }

    fn build_request_headers(
        &self,
        method: &str,
        path: &str,
        session_id: Option<&str>,
        upstream_state: Option<&PersistedUpstreamSessionState>,
    ) -> Result<BTreeMap<String, String>, String> {
        build_external_app_api_request_headers(
            &self.config,
            &ExternalAppApiRequestContext {
                method,
                path,
                provider_key: self.provider_key.as_str(),
                session_id,
                signed_at: None,
                upstream_state,
            },
        )
    }

    fn build_upstream_session_state(
        &self,
        login_payload: &UpstreamAppApiLoginPayload,
    ) -> PersistedUpstreamSessionState {
        PersistedUpstreamSessionState {
            access_token: login_payload.access_token.clone(),
            auth_token: login_payload.auth_token.clone(),
            payload_json: serde_json::to_string(login_payload).ok(),
            refresh_token: login_payload.refresh_token.clone(),
            token_type: login_payload
                .token_type
                .clone()
                .or_else(|| Some("Bearer".to_owned())),
            user_id: login_payload
                .user_info
                .as_ref()
                .and_then(|user_info| normalize_value_string(user_info.id.as_ref())),
        }
    }

    fn provider_mode(&self) -> &'static str {
        resolve_user_center_public_mode(
            &UserCenterMode::External,
            &ExternalUserCenterIntegrationKind::SdkworkCloudAppApi,
        )
    }

    fn create_persisted_session_from_login_payload(
        &self,
        connection: &mut Connection,
        account_hint: &str,
        display_name_hint: Option<&str>,
        login_payload: &UpstreamAppApiLoginPayload,
    ) -> Result<UserCenterSessionPayload, String> {
        let user = self.sync_user_from_login_payload(
            connection,
            account_hint,
            display_name_hint,
            login_payload,
        )?;
        let upstream_state = self.build_upstream_session_state(login_payload);
        create_persisted_session(
            &self.config.app_id,
            connection,
            &user,
            self.provider_mode(),
            &self.provider_key,
            Some(&upstream_state),
        )
    }

    fn request_login(
        &self,
        account: &str,
        password: &str,
    ) -> Result<UpstreamAppApiLoginPayload, String> {
        let headers = self.build_request_headers("POST", "/auth/login", None, None)?;

        upstream_request_json::<UpstreamAppApiLoginPayload>(
            &self.config,
            "POST",
            "/auth/login",
            &headers,
            Some(
                serde_json::to_value(UpstreamAppApiLoginRequestPayload {
                    password: password.to_owned(),
                    username: account.to_owned(),
                })
                .map_err(|error| format!("serialize upstream login request failed: {error}"))?,
            ),
        )?
        .ok_or_else(|| "Upstream user center returned an empty login payload.".to_owned())
    }

    fn request_email_code_login(
        &self,
        request: &UserCenterEmailCodeLoginRequest,
    ) -> Result<UpstreamAppApiLoginPayload, String> {
        let headers = self.build_request_headers("POST", "/auth/email/login", None, None)?;

        upstream_request_json::<UpstreamAppApiLoginPayload>(
            &self.config,
            "POST",
            "/auth/email/login",
            &headers,
            Some(
                serde_json::to_value(UpstreamAppApiEmailCodeLoginRequestPayload {
                    app_version: normalize_optional_text(request.app_version.as_deref()),
                    code: request.code.trim().to_owned(),
                    device_id: normalize_optional_text(request.device_id.as_deref()),
                    device_name: normalize_optional_text(request.device_name.as_deref()),
                    device_type: normalize_optional_text(request.device_type.as_deref()),
                    email: request.email.trim().to_owned(),
                })
                .map_err(|error| {
                    format!("serialize upstream email-code login request failed: {error}")
                })?,
            ),
        )?
        .ok_or_else(|| {
            "Upstream user center returned an empty email-code login payload.".to_owned()
        })
    }

    fn request_phone_code_login(
        &self,
        request: &UserCenterPhoneCodeLoginRequest,
    ) -> Result<UpstreamAppApiLoginPayload, String> {
        let headers = self.build_request_headers("POST", "/auth/phone/login", None, None)?;

        upstream_request_json::<UpstreamAppApiLoginPayload>(
            &self.config,
            "POST",
            "/auth/phone/login",
            &headers,
            Some(
                serde_json::to_value(UpstreamAppApiPhoneCodeLoginRequestPayload {
                    app_version: normalize_optional_text(request.app_version.as_deref()),
                    code: request.code.trim().to_owned(),
                    device_id: normalize_optional_text(request.device_id.as_deref()),
                    device_name: normalize_optional_text(request.device_name.as_deref()),
                    device_type: normalize_optional_text(request.device_type.as_deref()),
                    phone: request.phone.trim().to_owned(),
                })
                .map_err(|error| {
                    format!("serialize upstream phone-code login request failed: {error}")
                })?,
            ),
        )?
        .ok_or_else(|| {
            "Upstream user center returned an empty phone-code login payload.".to_owned()
        })
    }

    fn request_oauth_authorization_url(
        &self,
        request: &UserCenterOAuthAuthorizationRequest,
    ) -> Result<UserCenterOAuthUrlPayload, String> {
        let normalized_provider = self.require_enabled_oauth_provider(&request.provider)?;
        let redirect_uri = normalize_optional_text(Some(request.redirect_uri.as_str()))
            .ok_or_else(|| "OAuth redirectUri is required.".to_owned())?;
        let headers = self.build_request_headers("POST", "/auth/oauth/url", None, None)?;
        let oauth_payload = upstream_request_json::<UpstreamAppApiOAuthUrlPayload>(
            &self.config,
            "POST",
            "/auth/oauth/url",
            &headers,
            Some(
                serde_json::to_value(UpstreamAppApiOAuthAuthorizationRequestPayload {
                    provider: map_oauth_provider_to_upstream(&normalized_provider)?,
                    redirect_uri,
                    scope: normalize_optional_text(request.scope.as_deref()),
                    state: normalize_optional_text(request.state.as_deref()),
                })
                .map_err(|error| {
                    format!("serialize upstream oauth authorization request failed: {error}")
                })?,
            ),
        )?
        .ok_or_else(|| {
            "Upstream user center returned an empty OAuth authorization payload.".to_owned()
        })?;
        let auth_url =
            normalize_optional_text(oauth_payload.auth_url.as_deref()).ok_or_else(|| {
                "Upstream user center did not return an OAuth authorization URL.".to_owned()
            })?;

        Ok(UserCenterOAuthUrlPayload { auth_url })
    }

    fn request_oauth_login(
        &self,
        request: &UserCenterOAuthLoginRequest,
    ) -> Result<UpstreamAppApiLoginPayload, String> {
        let normalized_provider = self.require_enabled_oauth_provider(&request.provider)?;
        let code = normalize_optional_text(Some(request.code.as_str()))
            .ok_or_else(|| "OAuth code is required.".to_owned())?;
        let headers = self.build_request_headers("POST", "/auth/oauth/login", None, None)?;
        upstream_request_json::<UpstreamAppApiLoginPayload>(
            &self.config,
            "POST",
            "/auth/oauth/login",
            &headers,
            Some(
                serde_json::to_value(UpstreamAppApiOAuthLoginRequestPayload {
                    code,
                    device_id: normalize_optional_text(request.device_id.as_deref()),
                    device_type: normalize_optional_text(request.device_type.as_deref()),
                    provider: map_oauth_provider_to_upstream(&normalized_provider)?,
                    state: normalize_optional_text(request.state.as_deref()),
                })
                .map_err(|error| {
                    format!("serialize upstream oauth login request failed: {error}")
                })?,
            ),
        )?
        .ok_or_else(|| "Upstream user center returned an empty OAuth login payload.".to_owned())
    }

    fn request_password_reset_challenge(
        &self,
        request: &UserCenterPasswordResetChallengeRequest,
    ) -> Result<(), String> {
        let headers =
            self.build_request_headers("POST", "/auth/password/reset/request", None, None)?;
        let account = normalize_optional_text(Some(request.account.as_str()))
            .ok_or_else(|| "Account is required.".to_owned())?;
        let channel = normalize_password_reset_channel(&request.channel)?;

        let _ = upstream_request_json::<Value>(
            &self.config,
            "POST",
            "/auth/password/reset/request",
            &headers,
            Some(
                serde_json::to_value(UpstreamAppApiPasswordResetChallengeRequestPayload {
                    account,
                    channel: channel.to_owned(),
                })
                .map_err(|error| {
                    format!("serialize upstream password-reset challenge request failed: {error}")
                })?,
            ),
        )?;

        Ok(())
    }

    fn request_password_reset(
        &self,
        request: &UserCenterPasswordResetRequest,
    ) -> Result<(), String> {
        let headers = self.build_request_headers("POST", "/auth/password/reset", None, None)?;
        let account = normalize_optional_text(Some(request.account.as_str()))
            .ok_or_else(|| "Account is required.".to_owned())?;
        let code = normalize_optional_text(Some(request.code.as_str()))
            .ok_or_else(|| "Verification code is required.".to_owned())?;
        let new_password =
            require_password_input(Some(request.new_password.as_str()), "reset password")?;
        require_password_confirmation(&new_password, request.confirm_password.as_deref())?;

        let _ = upstream_request_json::<Value>(
            &self.config,
            "POST",
            "/auth/password/reset",
            &headers,
            Some(
                serde_json::to_value(UpstreamAppApiPasswordResetRequestPayload {
                    account,
                    code,
                    confirm_password: request.confirm_password.clone(),
                    new_password,
                })
                .map_err(|error| {
                    format!(
                        "serialize upstream password-reset confirmation request failed: {error}"
                    )
                })?,
            ),
        )?;

        Ok(())
    }

    fn refresh_session_state(
        &self,
        connection: &mut Connection,
        session_record: &UserSessionRecord,
    ) -> Result<PersistedUpstreamSessionState, String> {
        let refresh_token = session_record
            .upstream_refresh_token
            .as_deref()
            .map(str::trim)
            .filter(|value| !value.is_empty())
            .ok_or_else(|| {
                "The external user-center session cannot be refreshed because no refresh token is stored.".to_owned()
            })?;
        let current_state = session_record_to_upstream_state(session_record).ok_or_else(|| {
            "The external user-center session cannot be refreshed because no upstream token state is stored.".to_owned()
        })?;
        let headers = self.build_request_headers(
            "POST",
            "/auth/refresh",
            Some(session_record.id.as_str()),
            Some(&current_state),
        )?;
        let refreshed = upstream_request_json::<UpstreamAppApiLoginPayload>(
            &self.config,
            "POST",
            "/auth/refresh",
            &headers,
            Some(
                serde_json::to_value(UpstreamAppApiRefreshRequestPayload {
                    refresh_token: refresh_token.to_owned(),
                })
                .map_err(|error| format!("serialize upstream refresh request failed: {error}"))?,
            ),
        )?
        .ok_or_else(|| "Upstream user center returned an empty refresh payload.".to_owned())?;
        let refreshed_state = self.build_upstream_session_state(&refreshed);
        update_session_upstream_state(connection, &session_record.id, &refreshed_state)?;
        Ok(refreshed_state)
    }

    fn request_profile_with_state(
        &self,
        session_id: Option<&str>,
        upstream_state: &PersistedUpstreamSessionState,
    ) -> Result<UpstreamAppApiUserProfilePayload, String> {
        let headers =
            self.build_request_headers("GET", "/user/profile", session_id, Some(upstream_state))?;
        upstream_request_json::<UpstreamAppApiUserProfilePayload>(
            &self.config,
            "GET",
            "/user/profile",
            &headers,
            None,
        )?
        .ok_or_else(|| "Upstream user center returned an empty profile payload.".to_owned())
    }

    fn update_profile_with_state(
        &self,
        session_id: Option<&str>,
        upstream_state: &PersistedUpstreamSessionState,
        request: &UpdateUserCenterProfileRequest,
    ) -> Result<UpstreamAppApiUserProfilePayload, String> {
        let headers =
            self.build_request_headers("PUT", "/user/profile", session_id, Some(upstream_state))?;
        upstream_request_json::<UpstreamAppApiUserProfilePayload>(
            &self.config,
            "PUT",
            "/user/profile",
            &headers,
            Some(
                serde_json::to_value(UpstreamAppApiUpdateProfileRequestPayload {
                    avatar: request
                        .avatar
                        .as_ref()
                        .and_then(media_resource_delivery_url),
                    bio: normalize_optional_text(request.bio.as_deref()),
                    email: None,
                    nickname: normalize_optional_text(request.display_name.as_deref()),
                    region: normalize_optional_text(request.location.as_deref()),
                })
                .map_err(|error| {
                    format!("serialize upstream profile update request failed: {error}")
                })?,
            ),
        )?
        .ok_or_else(|| "Upstream user center returned an empty updated profile payload.".to_owned())
    }

    fn sync_user_from_login_payload(
        &self,
        connection: &mut Connection,
        account_fallback: &str,
        display_name_hint: Option<&str>,
        login_payload: &UpstreamAppApiLoginPayload,
    ) -> Result<UserRecord, String> {
        let user_info = login_payload.user_info.as_ref();
        let resolved_phone = user_info
            .and_then(|payload| payload.phone.as_deref())
            .map(normalize_phone)
            .filter(|value| !value.is_empty());
        let resolved_email = resolve_shadow_email_for_account(
            user_info.and_then(|payload| payload.email.as_deref()),
            resolved_phone.as_deref(),
            Some(account_fallback),
        );
        let resolved_subject = user_info
            .and_then(|payload| normalize_value_string(payload.id.as_ref()))
            .or_else(|| {
                user_info.and_then(|payload| normalize_optional_text(payload.username.as_deref()))
            });
        let existing_user = resolve_existing_external_user(
            connection,
            &self.provider_key,
            resolved_subject.as_deref(),
            &resolved_email,
        )?;
        let preferred_user_id = existing_user
            .as_ref()
            .map(|user| user.id.clone())
            .unwrap_or_else(|| {
                build_external_user_id(
                    &self.provider_key,
                    resolved_subject.as_deref(),
                    &resolved_email,
                )
            });
        let display_name = match resolved_phone.as_deref() {
            Some(_phone) => resolve_phone_display_name(
                user_info
                    .and_then(|payload| payload.nickname.as_deref())
                    .or(display_name_hint),
            ),
            None => resolve_display_name(
                user_info
                    .and_then(|payload| payload.nickname.as_deref())
                    .or(display_name_hint),
            ),
        };
        let avatar = user_info
            .and_then(|payload| payload.avatar.as_deref())
            .and_then(|value| external_url_media_resource(value, "image"));
        let user = upsert_user_shadow_with_phone(
            connection,
            &preferred_user_id,
            &resolved_email,
            resolved_phone.as_deref(),
            &display_name,
            avatar.as_ref(),
            &self.provider_key,
            resolved_subject.as_deref(),
            existing_user
                .as_ref()
                .and_then(|user| user.tenant_id.as_deref()),
            existing_user
                .as_ref()
                .and_then(|user| user.organization_id.as_deref()),
        )?;
        ensure_default_profile(connection, &user.id)?;
        Ok(user)
    }

    fn resolve_oauth_account_hint(
        &self,
        provider: &str,
        login_payload: &UpstreamAppApiLoginPayload,
    ) -> String {
        let user_info = login_payload.user_info.as_ref();
        if let Some(email) = user_info
            .and_then(|payload| payload.email.as_deref())
            .and_then(|value| normalize_optional_text(Some(value)))
        {
            return email;
        }

        if let Some(phone) = user_info
            .and_then(|payload| payload.phone.as_deref())
            .map(normalize_phone)
            .filter(|value| !value.is_empty())
        {
            return phone;
        }

        let stable_identity = user_info
            .and_then(|payload| normalize_value_string(payload.id.as_ref()))
            .or_else(|| {
                user_info.and_then(|payload| normalize_optional_text(payload.username.as_deref()))
            })
            .unwrap_or_else(|| "user".to_owned());

        format!("{provider}-{stable_identity}")
    }

    fn sync_user_from_profile_payload(
        &self,
        connection: &mut Connection,
        existing_user: &UserRecord,
        profile_payload: &UpstreamAppApiUserProfilePayload,
        upstream_state: &PersistedUpstreamSessionState,
    ) -> Result<UserRecord, String> {
        let resolved_phone = profile_payload
            .phone
            .as_deref()
            .map(normalize_phone)
            .filter(|value| !value.is_empty())
            .or_else(|| existing_user.phone.clone());
        let resolved_email = resolve_shadow_email_for_account(
            profile_payload.email.as_deref(),
            resolved_phone.as_deref(),
            existing_user.email.as_deref(),
        );
        let display_name = match resolved_phone.as_deref() {
            Some(_phone) => resolve_phone_display_name(
                profile_payload
                    .nickname
                    .as_deref()
                    .or(Some(existing_user.display_name.as_str())),
            ),
            None => resolve_display_name(
                profile_payload
                    .nickname
                    .as_deref()
                    .or(Some(existing_user.display_name.as_str())),
            ),
        };
        let avatar = profile_payload
            .avatar
            .as_deref()
            .and_then(|value| external_url_media_resource(value, "image"))
            .or_else(|| existing_user.avatar.clone());
        let user = upsert_user_shadow_with_phone(
            connection,
            &existing_user.id,
            &resolved_email,
            resolved_phone.as_deref(),
            &display_name,
            avatar.as_ref(),
            &self.provider_key,
            upstream_state
                .user_id
                .as_deref()
                .or(existing_user.external_subject.as_deref()),
            existing_user.tenant_id.as_deref(),
            existing_user.organization_id.as_deref(),
        )?;
        ensure_default_profile(connection, &user.id)?;
        Ok(user)
    }
}

impl UserCenterProvider for SdkworkCloudAppApiExternalUserCenterProvider {
    fn exchange_session(
        &self,
        _connection: &mut Connection,
        _request: &UserCenterSessionExchangeRequest,
    ) -> Result<UserCenterSessionPayload, String> {
        Err("Session exchange is not supported for sdkwork-cloud-app-api integration.".to_owned())
    }

    fn get_oauth_authorization_url(
        &self,
        request: &UserCenterOAuthAuthorizationRequest,
    ) -> Result<UserCenterOAuthUrlPayload, String> {
        self.request_oauth_authorization_url(request)
    }

    fn login(
        &self,
        connection: &mut Connection,
        request: &UserCenterLoginRequest,
    ) -> Result<UserCenterSessionPayload, String> {
        let account = resolve_login_account(request)?;
        let password = require_password_input(request.password.as_deref(), "sign in")?;
        let login_payload = self.request_login(&account, &password)?;
        self.create_persisted_session_from_login_payload(connection, &account, None, &login_payload)
    }

    fn login_with_email_code(
        &self,
        connection: &mut Connection,
        request: &UserCenterEmailCodeLoginRequest,
    ) -> Result<UserCenterSessionPayload, String> {
        let normalized_email = require_normalized_email(&request.email)?;
        let normalized_request = UserCenterEmailCodeLoginRequest {
            app_version: request.app_version.clone(),
            code: request.code.trim().to_owned(),
            device_id: request.device_id.clone(),
            device_name: request.device_name.clone(),
            device_type: request.device_type.clone(),
            email: normalized_email.clone(),
        };
        let login_payload = self.request_email_code_login(&normalized_request)?;
        self.create_persisted_session_from_login_payload(
            connection,
            &normalized_email,
            None,
            &login_payload,
        )
    }

    fn login_with_oauth(
        &self,
        connection: &mut Connection,
        request: &UserCenterOAuthLoginRequest,
    ) -> Result<UserCenterSessionPayload, String> {
        let normalized_provider = self.require_enabled_oauth_provider(&request.provider)?;
        let login_payload = self.request_oauth_login(request)?;
        let account_hint = self.resolve_oauth_account_hint(&normalized_provider, &login_payload);
        self.create_persisted_session_from_login_payload(
            connection,
            &account_hint,
            None,
            &login_payload,
        )
    }

    fn login_with_phone_code(
        &self,
        connection: &mut Connection,
        request: &UserCenterPhoneCodeLoginRequest,
    ) -> Result<UserCenterSessionPayload, String> {
        let normalized_phone = require_normalized_phone(&request.phone)?;
        let normalized_request = UserCenterPhoneCodeLoginRequest {
            app_version: request.app_version.clone(),
            code: request.code.trim().to_owned(),
            device_id: request.device_id.clone(),
            device_name: request.device_name.clone(),
            device_type: request.device_type.clone(),
            phone: normalized_phone.clone(),
        };
        let login_payload = self.request_phone_code_login(&normalized_request)?;
        self.create_persisted_session_from_login_payload(
            connection,
            &normalized_phone,
            None,
            &login_payload,
        )
    }

    fn logout(&self, connection: &mut Connection, session_id: Option<&str>) -> Result<(), String> {
        let Some(normalized_session_id) = session_id
            .map(|value| value.trim())
            .filter(|value| !value.is_empty())
        else {
            return Ok(());
        };

        if let Some(session_record) = load_session_record(connection, normalized_session_id)? {
            if let Some(upstream_state) = session_record_to_upstream_state(&session_record) {
                if let Ok(headers) = self.build_request_headers(
                    "POST",
                    "/auth/logout",
                    Some(session_record.id.as_str()),
                    Some(&upstream_state),
                ) {
                    let _ = upstream_request_json::<Value>(
                        &self.config,
                        "POST",
                        "/auth/logout",
                        &headers,
                        None,
                    );
                }
            }
        }

        revoke_session(connection, normalized_session_id)?;
        Ok(())
    }

    fn metadata(&self) -> UserCenterMetadataPayload {
        build_user_center_metadata(
            &UserCenterMode::External,
            &ExternalUserCenterIntegrationKind::SdkworkCloudAppApi,
            &self.provider_key,
            &["password", "emailCode"],
            &["email", "phone"],
            &["email", "phone"],
            !self.oauth_providers.is_empty(),
            true,
            self.oauth_providers
                .iter()
                .map(String::as_str)
                .collect::<Vec<_>>()
                .as_slice(),
            false,
            false,
            true,
            Some(self.config.base_url.clone()),
        )
    }

    fn read_profile(
        &self,
        connection: &mut Connection,
        session: &UserCenterSessionPayload,
    ) -> Result<UserCenterProfilePayload, String> {
        let session_record = load_session_record(connection, &session.session_id)?
            .ok_or_else(|| format!("Session {} was not found.", session.session_id))?;
        let existing_user = load_user_by_id(connection, &session_record.user_id)?
            .ok_or_else(|| format!("User {} was not found.", session_record.user_id))?;
        let mut upstream_state =
            session_record_to_upstream_state(&session_record).ok_or_else(|| {
                "The external user-center session does not contain upstream token state.".to_owned()
            })?;

        let profile_payload = match self
            .request_profile_with_state(Some(session_record.id.as_str()), &upstream_state)
        {
            Ok(profile_payload) => profile_payload,
            Err(error) if error.contains("status 401") || error.contains("status 403") => {
                upstream_state = self.refresh_session_state(connection, &session_record)?;
                self.request_profile_with_state(Some(session_record.id.as_str()), &upstream_state)?
            }
            Err(error) => return Err(error),
        };

        let user = self.sync_user_from_profile_payload(
            connection,
            &existing_user,
            &profile_payload,
            &upstream_state,
        )?;
        let profile = upsert_profile_shadow(
            connection,
            &user.id,
            profile_payload.bio.as_deref(),
            None,
            profile_payload.region.as_deref(),
            None,
        )?;
        Ok(build_profile_payload_from_user(&user, Some(profile)))
    }

    fn register(
        &self,
        connection: &mut Connection,
        request: &UserCenterRegisterRequest,
    ) -> Result<UserCenterSessionPayload, String> {
        let password = require_password_input(request.password.as_deref(), "register")?;
        require_password_confirmation(&password, request.confirm_password.as_deref())?;
        let verification_code = normalize_optional_text(request.verification_code.as_deref());
        let normalized_channel = normalize_optional_text(request.channel.as_deref())
            .map(|value| value.to_ascii_uppercase());
        let normalized_optional_email = request
            .email
            .as_deref()
            .map(require_normalized_email)
            .transpose()?;
        let normalized_optional_phone = request
            .phone
            .as_deref()
            .map(require_normalized_phone)
            .transpose()?;
        let normalized_username = normalize_optional_text(request.username.as_deref());
        let display_name_hint = request.name.as_deref().or(request.username.as_deref());
        let (account_for_login, user_type, resolved_email, resolved_phone, resolved_username) =
            match normalized_channel.as_deref() {
                Some("PHONE") | Some("SMS") => {
                    let normalized_phone = normalized_optional_phone
                        .clone()
                        .ok_or_else(|| "Phone is required for phone registration.".to_owned())?;
                    (
                        normalized_phone.clone(),
                        "PHONE",
                        normalized_optional_email.clone(),
                        Some(normalized_phone.clone()),
                        normalized_username
                            .clone()
                            .unwrap_or_else(|| normalized_phone.clone()),
                    )
                }
                Some("EMAIL") => {
                    let normalized_email = normalized_optional_email
                        .clone()
                        .ok_or_else(|| "Email is required for email registration.".to_owned())?;
                    (
                        normalized_email.clone(),
                        "EMAIL",
                        Some(normalized_email.clone()),
                        normalized_optional_phone.clone(),
                        normalized_username
                            .clone()
                            .unwrap_or_else(|| normalized_email.clone()),
                    )
                }
                Some(_) => {
                    return Err("channel must be EMAIL, PHONE, or SMS.".to_owned());
                }
                None if normalized_optional_phone.is_some()
                    && normalized_optional_email.is_none() =>
                {
                    let normalized_phone = normalized_optional_phone
                        .clone()
                        .ok_or_else(|| "Phone is required for phone registration.".to_owned())?;
                    (
                        normalized_phone.clone(),
                        "PHONE",
                        None,
                        Some(normalized_phone.clone()),
                        normalized_username
                            .clone()
                            .unwrap_or_else(|| normalized_phone.clone()),
                    )
                }
                None => {
                    let normalized_email = normalized_optional_email
                        .clone()
                        .ok_or_else(|| "Email is required for email registration.".to_owned())?;
                    (
                        normalized_email.clone(),
                        "EMAIL",
                        Some(normalized_email.clone()),
                        normalized_optional_phone.clone(),
                        normalized_username
                            .clone()
                            .unwrap_or_else(|| normalized_email.clone()),
                    )
                }
            };
        let headers = self.build_request_headers("POST", "/auth/register", None, None)?;
        let requested_tenant_id = normalize_optional_text(request.tenant_id.as_deref());
        let _ = upstream_request_json::<UpstreamAppApiUserInfoPayload>(
            &self.config,
            "POST",
            "/auth/register",
            &headers,
            Some(
                serde_json::to_value(UpstreamAppApiRegisterRequestPayload {
                    confirm_password: password.clone(),
                    email: resolved_email.clone(),
                    phone: resolved_phone.clone(),
                    password: password.clone(),
                    tenant_id: requested_tenant_id.clone(),
                    user_type: user_type.to_owned(),
                    username: resolved_username,
                    verification_code,
                })
                .map_err(|error| format!("serialize upstream register request failed: {error}"))?,
            ),
        )?;
        let login_payload = self.request_login(&account_for_login, &password)?;
        self.create_persisted_session_from_login_payload(
            connection,
            &account_for_login,
            display_name_hint,
            &login_payload,
        )
    }

    fn request_password_reset(
        &self,
        _connection: &mut Connection,
        request: &UserCenterPasswordResetChallengeRequest,
    ) -> Result<(), String> {
        self.request_password_reset_challenge(request)
    }

    fn reset_password(
        &self,
        _connection: &mut Connection,
        request: &UserCenterPasswordResetRequest,
    ) -> Result<(), String> {
        self.request_password_reset(request)
    }

    fn resolve_session(
        &self,
        connection: &Connection,
        headers: &HeaderMap,
    ) -> Result<Option<UserCenterSessionPayload>, String> {
        let Some(session_id) = read_session_header(headers) else {
            return Ok(None);
        };
        read_persisted_session_payload(
            &self.config.app_id,
            connection,
            &session_id,
            resolve_user_center_public_mode(
                &UserCenterMode::External,
                &ExternalUserCenterIntegrationKind::SdkworkCloudAppApi,
            ),
        )
    }

    fn update_profile(
        &self,
        connection: &mut Connection,
        session: &UserCenterSessionPayload,
        request: &UpdateUserCenterProfileRequest,
    ) -> Result<UserCenterProfilePayload, String> {
        let session_record = load_session_record(connection, &session.session_id)?
            .ok_or_else(|| format!("Session {} was not found.", session.session_id))?;
        let existing_user = load_user_by_id(connection, &session_record.user_id)?
            .ok_or_else(|| format!("User {} was not found.", session_record.user_id))?;
        let mut upstream_state =
            session_record_to_upstream_state(&session_record).ok_or_else(|| {
                "The external user-center session does not contain upstream token state.".to_owned()
            })?;

        let updated_profile_payload = match self.update_profile_with_state(
            Some(session_record.id.as_str()),
            &upstream_state,
            request,
        ) {
            Ok(updated_profile_payload) => updated_profile_payload,
            Err(error) if error.contains("status 401") || error.contains("status 403") => {
                upstream_state = self.refresh_session_state(connection, &session_record)?;
                self.update_profile_with_state(
                    Some(session_record.id.as_str()),
                    &upstream_state,
                    request,
                )?
            }
            Err(error) => return Err(error),
        };

        let user = self.sync_user_from_profile_payload(
            connection,
            &existing_user,
            &updated_profile_payload,
            &upstream_state,
        )?;
        let profile = upsert_profile_shadow(
            connection,
            &user.id,
            updated_profile_payload
                .bio
                .as_deref()
                .or(request.bio.as_deref()),
            request.company.as_deref(),
            updated_profile_payload
                .region
                .as_deref()
                .or(request.location.as_deref()),
            request.website.as_deref(),
        )?;
        Ok(build_profile_payload_from_user(&user, Some(profile)))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::sync::Mutex;
    use uuid::Uuid;

    static ENV_LOCK: Mutex<()> = Mutex::new(());
    const SDKWORK_SNOWFLAKE_EPOCH_MILLIS: u64 = 1_704_067_200_000;
    const SDKWORK_SNOWFLAKE_TIMESTAMP_SHIFT: u8 = 22;
    const TEST_LOCAL_TENANT_ID: &str = "200000000000000001";
    const TEST_LOCAL_ORGANIZATION_ID: &str = "200000000000000101";

    fn insert_test_local_authority_context(connection: &mut Connection) {
        let now = crate::current_storage_timestamp();
        connection
            .execute(
                r#"
                INSERT INTO iam_tenant (
                    id, uuid, created_at, updated_at, version, name, code, type, biz_type, biz_id,
                    jwt_secret_key, token_expiration_ms, refresh_token_expiration_ms, status,
                    description, admin_user_id, install_app_list, expire_time, metadata,
                    contact_person, contact_phone, is_deleted
                )
                VALUES (
                    ?1, ?2, ?3, ?4, 0, ?5, ?6, 'PLATFORM', NULL, NULL,
                    ?7, 604800000, 2592000000, 'active',
                    'Test-provided IAM tenant.', NULL, NULL, NULL, NULL,
                    NULL, NULL, 0
                )
                "#,
                params![
                    TEST_LOCAL_TENANT_ID,
                    stable_entity_uuid("iam_tenant", TEST_LOCAL_TENANT_ID),
                    &now,
                    &now,
                    "Test Local Tenant",
                    "test-local-tenant",
                    "test-local-tenant-signing-secret",
                ],
            )
            .expect("insert test tenant");
        connection
            .execute(
                r#"
                INSERT INTO iam_organization (
                    id, uuid, tenant_id, organization_id, data_scope, parent_id, parent_uuid,
                    parent_metadata, name, jwt_secret_key, token_expiration_ms,
                    refresh_token_expiration_ms, code, install_app_list, status, metadata,
                    description, contact_person, contact_phone, contact_email, address, website,
                    logo_media_resource_id, logo_object_blob_id, logo_resource_snapshot,
                    created_at, updated_at, version, is_deleted
                )
                VALUES (
                    ?1, ?2, ?3, ?1, 1, NULL, NULL,
                    NULL, ?4, ?5, NULL,
                    NULL, ?6, NULL, 1, NULL,
                    'Test-provided IAM organization.', NULL, NULL, NULL, NULL, NULL,
                    NULL, NULL, NULL,
                    ?7, ?8, 0, 0
                )
                "#,
                params![
                    TEST_LOCAL_ORGANIZATION_ID,
                    stable_entity_uuid("iam_organization", TEST_LOCAL_ORGANIZATION_ID),
                    TEST_LOCAL_TENANT_ID,
                    "Test Local Organization",
                    "test-local-organization-signing-secret",
                    "test-local-organization",
                    &now,
                    &now,
                ],
            )
            .expect("insert test organization");
    }

    fn assert_snowflake_id_in_window(
        label: &str,
        value: &str,
        issued_before_millis: u64,
        issued_after_millis: u64,
    ) {
        assert!(
            value.chars().all(|character| character.is_ascii_digit()),
            "{label} must be a numeric internal database id, got {value}"
        );
        assert!(
            !value.contains("test005")
                && !value.contains("a_com")
                && !value.contains('@')
                && !value.contains('_')
                && !value.contains('.'),
            "{label} must not contain account or email fragments, got {value}"
        );

        let parsed = value
            .parse::<u64>()
            .unwrap_or_else(|error| panic!("parse {label} snowflake id failed: {error}"));
        let decoded_millis =
            (parsed >> SDKWORK_SNOWFLAKE_TIMESTAMP_SHIFT) + SDKWORK_SNOWFLAKE_EPOCH_MILLIS;

        assert!(
            decoded_millis >= issued_before_millis
                && decoded_millis <= issued_after_millis.saturating_add(1),
            "{label} must decode to the registration time window; id {value} decoded to {decoded_millis}, expected {issued_before_millis}..={issued_after_millis}"
        );
    }

    #[test]
    fn resolve_default_provider_key_matches_user_center_standard_namespace_convention() {
        assert_eq!(
            resolve_default_provider_key(
                &UserCenterMode::Local,
                &ExternalUserCenterIntegrationKind::Headers,
            ),
            "sdkwork-user-center-local"
        );
        assert_eq!(
            resolve_default_provider_key(
                &UserCenterMode::External,
                &ExternalUserCenterIntegrationKind::Headers,
            ),
            "sdkwork-user-center-header"
        );
        assert_eq!(
            resolve_default_provider_key(
                &UserCenterMode::External,
                &ExternalUserCenterIntegrationKind::SdkworkCloudAppApi,
            ),
            "sdkwork-user-center-remote"
        );
    }

    #[test]
    fn resolve_user_center_public_mode_uses_canonical_selectors() {
        assert_eq!(
            resolve_user_center_public_mode(
                &UserCenterMode::Local,
                &ExternalUserCenterIntegrationKind::Headers,
            ),
            "builtin-local"
        );
        assert_eq!(
            resolve_user_center_public_mode(
                &UserCenterMode::External,
                &ExternalUserCenterIntegrationKind::SdkworkCloudAppApi,
            ),
            "sdkwork-cloud-app-api"
        );
        assert_eq!(
            resolve_user_center_public_mode(
                &UserCenterMode::External,
                &ExternalUserCenterIntegrationKind::Headers,
            ),
            "external-user-center"
        );
    }

    #[test]
    fn local_user_center_registers_email_without_verification_code_by_default() {
        let _guard = ENV_LOCK.lock().expect("lock env");
        let mut connection = Connection::open_in_memory().expect("open sqlite memory database");
        ensure_sqlite_user_center_schema(&mut connection).expect("create user center schema");
        insert_test_local_authority_context(&mut connection);
        let provider = LocalUserCenterProvider::new(
            "sdkwork-test-app".to_owned(),
            "sdkwork-test-local".to_owned(),
        );

        let session = provider
            .register(
                &mut connection,
                &UserCenterRegisterRequest {
                    channel: Some("EMAIL".to_owned()),
                    confirm_password: Some("configured-test-password".to_owned()),
                    email: Some("new-user@sdkwork.test".to_owned()),
                    name: Some("New User".to_owned()),
                    password: Some("configured-test-password".to_owned()),
                    phone: None,
                    tenant_id: None,
                    username: Some("new-user".to_owned()),
                    verification_code: None,
                },
            )
            .expect("register email user without verification code");

        assert_eq!(session.user.email, "new-user@sdkwork.test");
        assert_eq!(session.user.name, "New User");
        assert_eq!(session.provider_key, "sdkwork-test-local");
    }

    #[test]
    fn local_user_center_registration_uses_snowflake_database_ids() {
        let _guard = ENV_LOCK.lock().expect("lock env");
        let mut connection = Connection::open_in_memory().expect("open sqlite memory database");
        ensure_sqlite_user_center_schema(&mut connection).expect("create user center schema");
        insert_test_local_authority_context(&mut connection);
        let provider = LocalUserCenterProvider::new(
            "sdkwork-test-app".to_owned(),
            "sdkwork-test-local".to_owned(),
        );

        let issued_before_millis = current_epoch_millis()
            .expect("read time before registration")
            .try_into()
            .expect("time before registration must be positive");
        let session = provider
            .register(
                &mut connection,
                &UserCenterRegisterRequest {
                    channel: Some("EMAIL".to_owned()),
                    confirm_password: Some("configured-test-password".to_owned()),
                    email: Some("test005@a.com".to_owned()),
                    name: Some("Test 005".to_owned()),
                    password: Some("configured-test-password".to_owned()),
                    phone: None,
                    tenant_id: None,
                    username: Some("test005".to_owned()),
                    verification_code: None,
                },
            )
            .expect("register email user");
        let issued_after_millis = current_epoch_millis()
            .expect("read time after registration")
            .try_into()
            .expect("time after registration must be positive");

        assert_ne!(session.user.id, "user_test005_a_com");
        assert_snowflake_id_in_window(
            "iam_user.id",
            &session.user.id,
            issued_before_millis,
            issued_after_millis,
        );
        assert_snowflake_id_in_window(
            "iam_session.id",
            &session.session_id,
            issued_before_millis,
            issued_after_millis,
        );

        let persisted_user_id = connection
            .query_row(
                "SELECT id FROM iam_user WHERE email = ?1",
                params!["test005@a.com"],
                |row| sqlite_row_required_string_value(row, 0, "iam_user.id"),
            )
            .expect("load persisted iam_user.id");
        assert_eq!(persisted_user_id, session.user.id);

        let credential_id = connection
            .query_row(
                "SELECT id FROM iam_credential WHERE user_id = ?1 AND credential_type = 'password'",
                params![&session.user.id],
                |row| sqlite_row_required_string_value(row, 0, "iam_credential.id"),
            )
            .expect("load persisted iam_credential.id");
        assert_snowflake_id_in_window(
            "iam_credential.id",
            &credential_id,
            issued_before_millis,
            issued_after_millis,
        );
    }

    #[test]
    fn session_exchange_treats_external_user_id_as_subject_not_internal_database_id() {
        let mut connection = Connection::open_in_memory().expect("open sqlite memory database");
        ensure_sqlite_user_center_schema(&mut connection).expect("create user center schema");
        insert_test_local_authority_context(&mut connection);
        let provider = HeaderExternalUserCenterProvider::new(
            "sdkwork-test-app".to_owned(),
            "sdkwork-test-header".to_owned(),
            ExternalHeaderConfig {
                avatar_header: "x-avatar".to_owned(),
                email_header: "x-email".to_owned(),
                id_header: "x-user-id".to_owned(),
                name_header: "x-name".to_owned(),
                organization_header: "x-organization-id".to_owned(),
                tenant_header: "x-tenant-id".to_owned(),
            },
        );

        let issued_before_millis = current_epoch_millis()
            .expect("read time before session exchange")
            .try_into()
            .expect("time before session exchange must be positive");
        let session = provider
            .exchange_session(
                &mut connection,
                &UserCenterSessionExchangeRequest {
                    avatar: None,
                    email: "test005@a.com".to_owned(),
                    organization_id: Some(TEST_LOCAL_ORGANIZATION_ID.to_owned()),
                    tenant_id: Some(TEST_LOCAL_TENANT_ID.to_owned()),
                    user_id: Some("user_test005_a_com".to_owned()),
                    name: Some("Test 005".to_owned()),
                    provider_key: None,
                    subject: None,
                },
            )
            .expect("exchange external session");
        let issued_after_millis = current_epoch_millis()
            .expect("read time after session exchange")
            .try_into()
            .expect("time after session exchange must be positive");

        assert_snowflake_id_in_window(
            "external exchange iam_user.id",
            &session.user.id,
            issued_before_millis,
            issued_after_millis,
        );

        let (persisted_user_id, external_subject) = connection
            .query_row(
                "SELECT id, external_subject FROM iam_user WHERE email = ?1",
                params!["test005@a.com"],
                |row| {
                    Ok((
                        sqlite_row_required_string_value(row, 0, "iam_user.id")?,
                        row.get::<_, Option<String>>(1)?,
                    ))
                },
            )
            .expect("load exchanged iam_user");
        assert_eq!(persisted_user_id, session.user.id);
        assert_eq!(external_subject.as_deref(), Some("user_test005_a_com"));
    }

    #[test]
    fn login_qr_payload_uses_short_browser_entry_url_instead_of_api_path() {
        let payload = build_login_qr_code_payload(
            &LoginQrRecord {
                expires_at: "2026-05-15T10:00:00.000Z".to_owned(),
                id: "qr-test-1".to_owned(),
                qr_key: "qr-test-1".to_owned(),
                session_id: None,
                status: "pending".to_owned(),
                user_id: None,
            },
            Some("https://app.sdkwork.test/"),
        );

        assert_eq!(
            payload.qr_content.as_deref(),
            Some("https://app.sdkwork.test/auth/qr/qr-test-1")
        );
        assert!(!payload
            .qr_content
            .as_deref()
            .unwrap_or_default()
            .contains("/app/v3/api/"));
    }

    #[test]
    fn default_metadata_does_not_advertise_local_verification_code_login() {
        let local_metadata = LocalUserCenterProvider::new(
            "sdkwork-test-app".to_owned(),
            "sdkwork-test-local".to_owned(),
        )
        .metadata();
        assert_eq!(local_metadata.login_methods, vec!["password".to_owned()]);
        assert_eq!(
            local_metadata.verification_policy.email_code_login_enabled,
            false
        );
        assert_eq!(
            local_metadata.verification_policy.phone_code_login_enabled,
            false
        );
        assert!(!local_metadata
            .login_methods
            .iter()
            .any(|method| method == "emailCode"));
        assert!(!local_metadata
            .login_methods
            .iter()
            .any(|method| method == "phoneCode"));

        let cloud_metadata = SdkworkCloudAppApiExternalUserCenterProvider::new(
            "sdkwork-test-cloud".to_owned(),
            ExternalAppApiConfig {
                app_id: "sdkwork-test-cloud-app".to_owned(),
                base_url: "https://cloud.sdkwork.test/app".to_owned(),
                handshake: None,
                timeout: Duration::from_secs(30),
            },
        )
        .metadata();
        assert_eq!(
            cloud_metadata.login_methods,
            vec!["password".to_owned(), "emailCode".to_owned()]
        );
        assert_eq!(
            cloud_metadata.verification_policy.email_code_login_enabled,
            true
        );
        assert_eq!(
            cloud_metadata.verification_policy.phone_code_login_enabled,
            false
        );
        assert!(!cloud_metadata
            .login_methods
            .iter()
            .any(|method| method == "phoneCode"));
    }

    #[test]
    fn resolve_user_center_config_from_env_rejects_retired_login_provider_aliases() {
        let _guard = ENV_LOCK.lock().expect("lock env");
        std::env::set_var(SDKWORK_USER_CENTER_MODE_ENV, "local");
        std::env::remove_var(SDKWORK_USER_CENTER_APP_API_BASE_URL_ENV);

        let resolved = resolve_user_center_config_from_env();

        std::env::remove_var(SDKWORK_USER_CENTER_MODE_ENV);

        assert_eq!(
            resolved.configuration_error,
            Some(
                "SDKWORK_USER_CENTER_MODE must be one of: builtin-local, sdkwork-cloud-app-api, external-user-center."
                    .to_owned()
            )
        );
    }

    #[test]
    fn stable_entity_uuid_returns_deterministic_rfc4122_v5_uuid() {
        let first = stable_entity_uuid("iam_user", "100000000000000001");
        let second = stable_entity_uuid("iam_user", "100000000000000001");
        let parsed = Uuid::parse_str(first.as_str()).expect("stable entity uuid should parse");

        assert_eq!(first, second);
        assert_eq!(parsed.get_version_num(), 5);
        assert_eq!(parsed.to_string(), first);
    }
}
