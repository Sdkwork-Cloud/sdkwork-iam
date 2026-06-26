use base64::{engine::general_purpose::URL_SAFE_NO_PAD, Engine as _};
use sdkwork_user_center_tauri_host::{
    create_default_user_center_runtime_config, create_user_center_auth_profile,
    create_user_center_integration_profiles, create_user_center_local_api_routes,
    create_user_center_storage_plan, ensure_sqlite_user_center_bootstrap_user,
    ensure_sqlite_user_center_schema, is_user_center_upstream_integration_active,
    UserCenterProviderConfig, UserCenterRegisterRequest, UserCenterState,
    USER_CENTER_DEFAULT_LOCAL_API_BASE_PATH, USER_CENTER_DEFAULT_SQLITE_FILENAME,
    USER_CENTER_TABLE_PREFIX,
};
use serde_json::Value;
use std::sync::{Mutex, MutexGuard, OnceLock};

const USER_CENTER_APP_ID_ENV: &str = "SDKWORK_USER_CENTER_APP_ID";
const CONFIGURED_USER_CENTER_APP_ID: &str = "sdkwork-user-center-contract-app";
const CONFIGURED_USER_CENTER_TENANT_ID: &str = "200000000000000001";
const CONFIGURED_USER_CENTER_ORGANIZATION_ID: &str = "200000000000000101";

fn user_center_contract_env_lock() -> &'static Mutex<()> {
    static ENV_LOCK: OnceLock<Mutex<()>> = OnceLock::new();
    ENV_LOCK.get_or_init(|| Mutex::new(()))
}

fn lock_user_center_contract_env() -> MutexGuard<'static, ()> {
    user_center_contract_env_lock()
        .lock()
        .unwrap_or_else(|poisoned| poisoned.into_inner())
}

struct EnvSnapshot {
    values: Vec<(&'static str, Option<String>)>,
}

impl EnvSnapshot {
    fn capture(names: &[&'static str]) -> Self {
        Self {
            values: names
                .iter()
                .map(|name| (*name, std::env::var(name).ok()))
                .collect(),
        }
    }
}

impl Drop for EnvSnapshot {
    fn drop(&mut self) {
        for (name, value) in &self.values {
            match value {
                Some(value) => std::env::set_var(name, value),
                None => std::env::remove_var(name),
            }
        }
    }
}

fn set_optional_env(name: &str, value: Option<&str>) {
    match value {
        Some(value) => std::env::set_var(name, value),
        None => std::env::remove_var(name),
    }
}

fn set_deprecated_user_center_bootstrap_env_for_regression_test() {
    std::env::set_var(
        "SDKWORK_USER_CENTER_BOOTSTRAP_EMAIL",
        "local-owner@sdkwork.test",
    );
    std::env::set_var("SDKWORK_USER_CENTER_BOOTSTRAP_PHONE", "13900000000");
    std::env::set_var(
        "SDKWORK_USER_CENTER_BOOTSTRAP_PASSWORD",
        "configured-local-password",
    );
    std::env::set_var(
        "SDKWORK_USER_CENTER_BOOTSTRAP_TENANT_ID",
        CONFIGURED_USER_CENTER_TENANT_ID,
    );
    std::env::set_var(
        "SDKWORK_USER_CENTER_BOOTSTRAP_ORGANIZATION_ID",
        CONFIGURED_USER_CENTER_ORGANIZATION_ID,
    );
}

fn clear_deprecated_user_center_bootstrap_env() {
    for name in [
        "SDKWORK_USER_CENTER_BOOTSTRAP_EMAIL",
        "SDKWORK_USER_CENTER_BOOTSTRAP_PHONE",
        "SDKWORK_USER_CENTER_BOOTSTRAP_PASSWORD",
        "SDKWORK_USER_CENTER_BOOTSTRAP_TENANT_ID",
        "SDKWORK_USER_CENTER_BOOTSTRAP_ORGANIZATION_ID",
    ] {
        std::env::remove_var(name);
    }
}

fn insert_real_bootstrap_scope(
    connection: &mut rusqlite::Connection,
    tenant_id: &str,
    organization_id: Option<&str>,
) {
    let now = "2026-05-21T05:00:00.000Z";
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
                'Contract-provided IAM tenant.', NULL, NULL, NULL, NULL,
                NULL, NULL, 0
            )
            "#,
            rusqlite::params![
                tenant_id,
                format!("tenant-uuid-{tenant_id}"),
                now,
                now,
                format!("Tenant {tenant_id}"),
                format!("tenant-{tenant_id}"),
                format!("contract-signing-secret-{tenant_id}"),
            ],
        )
        .expect("insert contract tenant");

    if let Some(organization_id) = organization_id {
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
                    'Contract-provided IAM organization.', NULL, NULL, NULL, NULL, NULL,
                    NULL, NULL, NULL,
                    ?7, ?8, 0, 0
                )
                "#,
                rusqlite::params![
                    organization_id,
                    format!("organization-uuid-{organization_id}"),
                    tenant_id,
                    format!("Organization {organization_id}"),
                    format!("contract-organization-secret-{organization_id}"),
                    format!("organization-{organization_id}"),
                    now,
                    now,
                ],
            )
            .expect("insert contract organization");
    }
}

fn decode_jwt_payload(token: &str) -> Value {
    let parts = token.split('.').collect::<Vec<_>>();
    assert_eq!(
        parts.len(),
        3,
        "SDKWork user-center session tokens must use JWT-style header.payload.signature format.",
    );
    let payload = URL_SAFE_NO_PAD
        .decode(parts[1].as_bytes())
        .expect("decode JWT-style token payload");
    serde_json::from_slice::<Value>(&payload).expect("parse JWT-style token payload")
}

#[test]
fn creates_the_canonical_default_runtime_config() {
    let config = create_default_user_center_runtime_config("sdkwork-routes-portal");

    assert_eq!(USER_CENTER_DEFAULT_SQLITE_FILENAME, "user-center.db");
    assert_eq!(USER_CENTER_TABLE_PREFIX, "iam_");
    assert_eq!(config.namespace, "sdkwork-routes-portal");
    assert_eq!(config.mode, "local-native");
    assert_eq!(config.provider.kind, "local");
    assert_eq!(config.provider.provider_key, "sdkwork-routes-portal-local");
    assert_eq!(config.integration.active_kind, "builtin-local");
    assert_eq!(
        config.integration.builtin_local.user_system_scope,
        "application"
    );
    assert!(!config.integration.external_app_api.enabled);
    assert_eq!(
        config.storage_topology.database_key,
        "sdkwork-routes-portal-user-center"
    );
    assert_eq!(config.storage_topology.table_prefix, "iam_");
    assert_eq!(
        config.storage_topology.entity_bindings[0].standard_entity_name,
        "IamUser"
    );
    assert_eq!(
        config.storage_topology.entity_bindings[0].table_name,
        "iam_user"
    );
    assert_eq!(
        config.storage_plan.session_token_key,
        "sdkwork-routes-portal.user-center.session-token"
    );
    assert_eq!(config.local_api.profile, "/app/v3/api/iam/users/current");
}

#[test]
fn creates_the_canonical_local_api_routes() {
    let routes = create_user_center_local_api_routes(Some("/app/v3/api"));

    assert_eq!(USER_CENTER_DEFAULT_LOCAL_API_BASE_PATH, "/app/v3/api");
    assert_eq!(routes.auth_config, "/app/v3/api/auth/config");
    assert_eq!(routes.auth_login, "/app/v3/api/auth/sessions");
    assert_eq!(routes.auth_email_login, "/app/v3/api/auth/sessions");
    assert_eq!(routes.auth_phone_login, "/app/v3/api/auth/sessions");
    assert_eq!(routes.auth_register, "/app/v3/api/auth/registrations");
    assert_eq!(routes.auth_refresh, "/app/v3/api/auth/sessions/refresh");
    assert_eq!(routes.auth_logout, "/app/v3/api/auth/sessions/current");
    assert_eq!(
        routes.auth_qr_confirm,
        "/app/v3/api/open_platform/qr_auth/sessions/:sessionKey/passwords"
    );
    assert_eq!(
        routes.auth_qr_generate,
        "/app/v3/api/open_platform/qr_auth/sessions"
    );
    assert_eq!(
        routes.auth_qr_status_pattern,
        "/app/v3/api/open_platform/qr_auth/sessions/:sessionKey"
    );
    assert_eq!(
        routes.auth_qr_entry_pattern,
        "/app/v3/api/open_platform/qr_auth/sessions/:sessionKey/scans"
    );
    assert_eq!(
        routes.auth_qr_callback_pattern,
        routes.auth_qr_entry_pattern
    );
    assert_eq!(routes.auth_session_exchange, "/app/v3/api/auth/sessions");
    assert!(
        !routes
            .auth_qr_generate
            .contains("/auth/qr_login_codes"),
        "user center must expose the standard open-platform QR auth path, not the retired QR login code path",
    );
    assert_eq!(routes.health, "/app/v3/api/health");
}

#[test]
fn creates_the_canonical_upstream_integration_shape_for_seed_disabled_modes() {
    let storage_plan = create_user_center_storage_plan("sdkwork-routes-portal");
    let local_provider = UserCenterProviderConfig {
        base_url: None,
        headers: Vec::new(),
        kind: "local".to_string(),
        provider_key: "sdkwork-routes-portal-local".to_string(),
    };
    let builtin_local_auth = create_user_center_auth_profile(
        "sdkwork-routes-portal",
        &local_provider,
        "local-native",
        &storage_plan,
    );
    let upstream_provider = UserCenterProviderConfig {
        base_url: Some("https://cloud.sdkwork.test/app".to_string()),
        headers: Vec::new(),
        kind: "sdkwork-cloud-app-api".to_string(),
        provider_key: "sdkwork-routes-portal-app-api".to_string(),
    };
    let upstream_auth = create_user_center_auth_profile(
        "sdkwork-routes-portal",
        &upstream_provider,
        "app-api-hub",
        &storage_plan,
    );
    let integration = create_user_center_integration_profiles(
        "sdkwork-routes-portal",
        &upstream_provider,
        USER_CENTER_DEFAULT_LOCAL_API_BASE_PATH,
        "app-api-hub",
        &builtin_local_auth,
        &upstream_auth,
    );

    assert_eq!(integration.active_kind, "sdkwork-cloud-app-api");
    assert_eq!(
        is_user_center_upstream_integration_active(&integration),
        true
    );
    assert_eq!(integration.external_app_api.enabled, true);
    assert_eq!(integration.external_app_api.handshake_enabled, true);
    assert_eq!(
        integration.external_app_api.upstream_base_url.as_deref(),
        Some("https://cloud.sdkwork.test/app")
    );
}

#[test]
fn creates_the_canonical_iam_sqlite_authority_tables() {
    let _env_guard = lock_user_center_contract_env();
    clear_deprecated_user_center_bootstrap_env();

    let mut connection =
        rusqlite::Connection::open_in_memory().expect("open in-memory user center authority");

    ensure_sqlite_user_center_schema(&mut connection).expect("create canonical user-center schema");
    ensure_sqlite_user_center_bootstrap_user(&mut connection)
        .expect("skip unconfigured user-center bootstrap user");

    for table_name in ["iam_tenant", "iam_organization", "iam_user"] {
        let count: i64 = connection
            .query_row(
                format!("SELECT COUNT(*) FROM {table_name} WHERE is_deleted = 0").as_str(),
                [],
                |row| row.get(0),
            )
            .unwrap_or_else(|error| panic!("count {table_name} failed: {error}"));
        assert_eq!(
            count, 0,
            "{table_name} must not be populated by schema creation or unconfigured bootstrap."
        );
    }

    for table_name in [
        "iam_tenant",
        "iam_organization",
        "iam_organization_membership",
        "iam_department_assignment",
        "iam_position_assignment",
        "iam_role_binding",
        "iam_role",
        "iam_permission",
        "iam_role_permission",
        "iam_user",
        "iam_user_identity",
        "iam_credential",
        "iam_api_key",
        "iam_session",
        "iam_login_qr",
    ] {
        let exists: i64 = connection
            .query_row(
                "SELECT EXISTS(SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?1)",
                [table_name],
                |row| row.get(0),
            )
            .unwrap_or_else(|error| panic!("probe {table_name} failed: {error}"));
        assert_eq!(exists, 1, "{table_name} must be created as an iam_* table.");
    }
    for column_name in ["tenant_id", "organization_id", "data_scope"] {
        let exists: i64 = connection
            .query_row(
                "SELECT COUNT(*) FROM pragma_table_info('iam_role_permission') WHERE name = ?1",
                [column_name],
                |row| row.get(0),
            )
            .unwrap_or_else(|error| {
                panic!("inspect iam_role_permission.{column_name} failed: {error}")
            });
        assert_eq!(
            exists, 1,
            "iam_role_permission must declare {column_name} so local IAM role-permission links keep AppContext scope.",
        );
    }
    let scoped_role_permission_index_count: i64 = connection
        .query_row(
            r#"
            SELECT COUNT(*)
            FROM pragma_index_info('idx_role_permission1')
            WHERE seqno = 0 AND name = 'tenant_id'
               OR seqno = 1 AND name = 'organization_id'
               OR seqno = 2 AND name = 'role_id'
               OR seqno = 3 AND name = 'permission_id'
            "#,
            [],
            |row| row.get(0),
        )
        .expect("inspect iam_role_permission scoped index");
    assert_eq!(
        scoped_role_permission_index_count, 4,
        "iam_role_permission unique index must be ordered by tenant_id, organization_id, role_id, permission_id.",
    );
    for (index_name, expected_columns) in [
        (
            "idx_iam_role_binding_principal",
            [
                "tenant_id",
                "organization_id",
                "principal_kind",
                "principal_id",
            ],
        ),
        (
            "idx_iam_role_binding_scope",
            ["tenant_id", "organization_id", "scope_kind", "scope_id"],
        ),
        (
            "idx_iam_api_key_tenant_user_status",
            ["tenant_id", "organization_id", "user_id", "status"],
        ),
    ] {
        for (seqno, column_name) in expected_columns.iter().enumerate() {
            let exists: i64 = connection
                .query_row(
                    "SELECT COUNT(*) FROM pragma_index_info(?1) WHERE seqno = ?2 AND name = ?3",
                    rusqlite::params![index_name, seqno as i64, column_name],
                    |row| row.get(0),
                )
                .unwrap_or_else(|error| {
                    panic!("inspect {index_name}.{column_name} failed: {error}")
                });
            assert_eq!(
                exists, 1,
                "{index_name} must keep {column_name} at index position {seqno}.",
            );
        }
    }

    let retired_plus_table_count: i64 = connection
        .query_row(
            "SELECT COUNT(*) FROM sqlite_master WHERE type = 'table' AND name LIKE 'plus_%'",
            [],
            |row| row.get(0),
        )
        .expect("count retired plus tables");
    assert_eq!(
        retired_plus_table_count, 0,
        "canonical IAM authority schema must not create retired plus_* business tables.",
    );
    let retired_vip_membership_table_exists: i64 = connection
        .query_row(
            "SELECT EXISTS(SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'iam_vip_membership')",
            [],
            |row| row.get(0),
        )
        .expect("probe retired iam_vip_membership table");
    assert_eq!(
        retired_vip_membership_table_exists, 0,
        "canonical IAM authority schema must not create retired iam_vip_membership.",
    );
    let commercial_membership_table_name = "iam_".to_string() + "membership";
    let commercial_membership_table_exists: i64 = connection
        .query_row(
            "SELECT EXISTS(SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?1)",
            [commercial_membership_table_name.as_str()],
            |row| row.get(0),
        )
        .expect("probe removed commercial membership table");
    assert_eq!(
        commercial_membership_table_exists, 0,
        "appbase user-center must not create commercial membership projection tables.",
    );
    let verification_code_table_exists: i64 = connection
        .query_row(
            "SELECT EXISTS(SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'iam_verification_code')",
            [],
            |row| row.get(0),
        )
        .expect("probe removed iam_verification_code table");
    assert_eq!(
        verification_code_table_exists, 0,
        "appbase user-center must not create messaging-owned verification-code tables.",
    );
    for retired_table_name in [
        "iam_organization_member",
        "iam_member_relation",
        "iam_account",
        "iam_accounts",
        "iam_department_member",
        "iam_department_members",
        "iam_user_role",
    ] {
        let exists: i64 = connection
            .query_row(
                "SELECT EXISTS(SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?1)",
                [retired_table_name],
                |row| row.get(0),
            )
            .unwrap_or_else(|error| panic!("probe {retired_table_name} failed: {error}"));
        assert_eq!(
            exists, 0,
            "{retired_table_name} must not be created by the user-center IAM authority schema.",
        );
    }

    let user_count: i64 = connection
        .query_row(
            "SELECT COUNT(*) FROM iam_user WHERE is_deleted = 0",
            [],
            |row| row.get(0),
        )
        .expect("count canonical iam_user rows");
    let session_count: i64 = connection
        .query_row(
            "SELECT COUNT(*) FROM iam_session WHERE is_deleted = 0",
            [],
            |row| row.get(0),
        )
        .expect("count canonical iam_session rows");

    assert_eq!(
        user_count, 0,
        "bootstrap must not seed a default iam_user without explicit credentials."
    );
    let user_password_column_exists: i64 = connection
        .query_row(
            "SELECT COUNT(*) FROM pragma_table_info('iam_user') WHERE name = 'password'",
            [],
            |row| row.get(0),
        )
        .expect("inspect canonical iam_user columns");
    assert_eq!(
        user_password_column_exists, 0,
        "password credentials must live in iam_credential, not iam_user.",
    );
    let credential_count: i64 = connection
        .query_row(
            "SELECT COUNT(*) FROM iam_credential WHERE credential_type = 'password' AND status = 'active'",
            [],
            |row| row.get(0),
        )
        .expect("count canonical iam_credential rows");
    assert_eq!(
        credential_count, 0,
        "bootstrap must not seed password credentials without explicit credentials.",
    );
    assert_eq!(
        session_count, 0,
        "bootstrap must not create an implicit active session.",
    );
    let tenant_secret_default_count: i64 = connection
        .query_row(
            "SELECT COUNT(*) FROM pragma_table_info('iam_tenant') WHERE name = 'jwt_secret_key' AND dflt_value IS NOT NULL",
            [],
            |row| row.get(0),
        )
        .expect("inspect iam_tenant jwt_secret_key default");
    assert_eq!(
        tenant_secret_default_count, 0,
        "iam_tenant.jwt_secret_key must not define a shared SQL default secret.",
    );
    let commercial_membership_table_name = "iam_".to_string() + "membership";
    let commercial_membership_table_exists: i64 = connection
        .query_row(
            "SELECT EXISTS(SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?1)",
            [commercial_membership_table_name.as_str()],
            |row| row.get(0),
        )
        .expect("probe removed commercial membership table after bootstrap");
    assert_eq!(
        commercial_membership_table_exists, 0,
        "bootstrap must not recreate commercial membership projections.",
    );
}

#[test]
fn user_center_bootstrap_env_seeding_is_disabled() {
    let _env_guard = lock_user_center_contract_env();
    let _env_snapshot = EnvSnapshot::capture(&[
        "SDKWORK_USER_CENTER_BOOTSTRAP_EMAIL",
        "SDKWORK_USER_CENTER_BOOTSTRAP_PASSWORD",
        "SDKWORK_USER_CENTER_BOOTSTRAP_PHONE",
        "SDKWORK_USER_CENTER_BOOTSTRAP_TENANT_ID",
        "SDKWORK_USER_CENTER_BOOTSTRAP_ORGANIZATION_ID",
    ]);
    set_deprecated_user_center_bootstrap_env_for_regression_test();

    let mut connection =
        rusqlite::Connection::open_in_memory().expect("open in-memory user center authority");

    ensure_sqlite_user_center_schema(&mut connection).expect("create canonical user-center schema");
    insert_real_bootstrap_scope(
        &mut connection,
        CONFIGURED_USER_CENTER_TENANT_ID,
        Some(CONFIGURED_USER_CENTER_ORGANIZATION_ID),
    );
    ensure_sqlite_user_center_bootstrap_user(&mut connection)
        .expect("bootstrap env seeding should remain a no-op");

    let user_count: i64 = connection
        .query_row(
            "SELECT COUNT(*) FROM iam_user WHERE is_deleted = 0",
            [],
            |row| row.get(0),
        )
        .expect("count users after disabled bootstrap seeding");

    assert_eq!(
        user_count, 0,
        "user-center must not seed accounts from bootstrap environment variables.",
    );
}

#[test]
fn local_user_center_registration_returns_tenant_bound_dual_tokens() {
    let _env_guard = lock_user_center_contract_env();
    let _env_snapshot = EnvSnapshot::capture(&[
        USER_CENTER_APP_ID_ENV,
        "SDKWORK_USER_CENTER_MODE",
        "SDKWORK_USER_CENTER_APP_API_BASE_URL",
    ]);
    set_optional_env(USER_CENTER_APP_ID_ENV, Some(CONFIGURED_USER_CENTER_APP_ID));
    std::env::remove_var("SDKWORK_USER_CENTER_MODE");
    std::env::remove_var("SDKWORK_USER_CENTER_APP_API_BASE_URL");

    let mut connection =
        rusqlite::Connection::open_in_memory().expect("open in-memory user center authority");
    ensure_sqlite_user_center_schema(&mut connection).expect("create canonical user-center schema");
    insert_real_bootstrap_scope(
        &mut connection,
        CONFIGURED_USER_CENTER_TENANT_ID,
        Some(CONFIGURED_USER_CENTER_ORGANIZATION_ID),
    );

    let state = UserCenterState::from_env();
    let session = state
        .register(
            &mut connection,
            &UserCenterRegisterRequest {
                channel: Some("EMAIL".to_string()),
                confirm_password: Some("configured-local-password".to_string()),
                email: Some("tenant-token-user@sdkwork.test".to_string()),
                name: Some("Tenant Token User".to_string()),
                password: Some("configured-local-password".to_string()),
                phone: None,
                tenant_id: None,
                username: Some("tenant-token-user".to_string()),
                verification_code: None,
            },
        )
        .expect("register local user with tenant-bound session tokens");

    assert_ne!(
        session.auth_token, session.session_id,
        "authToken must not be the iam_session id.",
    );
    assert_ne!(
        session.access_token, session.session_id,
        "accessToken must not be the iam_session id.",
    );
    assert_ne!(
        session.auth_token, session.access_token,
        "authToken and accessToken must be separate token types.",
    );

    let auth_claims = decode_jwt_payload(&session.auth_token);
    let access_claims = decode_jwt_payload(&session.access_token);

    let membership_count: i64 = connection
        .query_row(
            "SELECT COUNT(*) FROM iam_organization_membership WHERE tenant_id = ?1 AND organization_id = ?2 AND user_id = ?3 AND status = 'active' AND is_deleted = 0",
            [
                session.user.tenant_id.as_deref().unwrap_or_default(),
                session.user.organization_id.as_deref().unwrap_or_default(),
                session.user.id.as_str(),
            ],
            |row| row.get(0),
        )
        .expect("count active organization membership for registered user");

    assert_eq!(
        membership_count, 1,
        "local registration must create a canonical iam_organization_membership row for the session user.",
    );
    assert_eq!(auth_claims["token_type"], "auth");
    assert_eq!(access_claims["token_type"], "access");
    assert_eq!(auth_claims["app_id"], CONFIGURED_USER_CENTER_APP_ID);
    assert_eq!(access_claims["app_id"], CONFIGURED_USER_CENTER_APP_ID);
    assert_eq!(auth_claims["aud"], CONFIGURED_USER_CENTER_APP_ID);
    assert_eq!(access_claims["aud"], CONFIGURED_USER_CENTER_APP_ID);
    assert_eq!(auth_claims["tenant_id"], CONFIGURED_USER_CENTER_TENANT_ID);
    assert_eq!(access_claims["tenant_id"], CONFIGURED_USER_CENTER_TENANT_ID);
    assert_ne!(auth_claims["organization_id"], "0");
    assert_ne!(access_claims["organization_id"], "0");
    let organization_id = session
        .user
        .organization_id
        .as_deref()
        .expect("registered user must have organization binding");
    assert_eq!(auth_claims["organization_id"], organization_id);
    assert_eq!(access_claims["organization_id"], organization_id);
    assert_eq!(auth_claims["login_scope"], "ORGANIZATION");
    assert_eq!(access_claims["login_scope"], "ORGANIZATION");
    assert_eq!(auth_claims["user_id"], session.user.id);
    assert_eq!(access_claims["user_id"], session.user.id);
    assert_eq!(auth_claims["session_id"], session.session_id);
    assert_eq!(access_claims["session_id"], session.session_id);
}

#[test]
fn local_user_center_refuses_sessions_without_configured_app_id() {
    let _env_guard = lock_user_center_contract_env();
    let _env_snapshot = EnvSnapshot::capture(&[
        USER_CENTER_APP_ID_ENV,
        "SDKWORK_USER_CENTER_MODE",
        "SDKWORK_USER_CENTER_APP_API_BASE_URL",
    ]);
    set_optional_env(USER_CENTER_APP_ID_ENV, None);
    std::env::remove_var("SDKWORK_USER_CENTER_MODE");
    std::env::remove_var("SDKWORK_USER_CENTER_APP_API_BASE_URL");

    let mut connection =
        rusqlite::Connection::open_in_memory().expect("open in-memory user center authority");
    ensure_sqlite_user_center_schema(&mut connection).expect("create canonical user-center schema");

    let state = UserCenterState::from_env();
    let error = match state.register(
        &mut connection,
        &UserCenterRegisterRequest {
            channel: Some("EMAIL".to_string()),
            confirm_password: Some("configured-local-password".to_string()),
            email: Some("missing-app-id-user@sdkwork.test".to_string()),
            name: Some("Missing App Id User".to_string()),
            password: Some("configured-local-password".to_string()),
            phone: None,
            tenant_id: None,
            username: Some("missing-app-id-user".to_string()),
            verification_code: None,
        },
    ) {
        Ok(_) => panic!("local user-center must not issue session tokens without app id"),
        Err(error) => error,
    };

    assert!(
        error.contains(USER_CENTER_APP_ID_ENV),
        "configuration error should name the required app id env: {error}",
    );
}

#[test]
fn user_center_authority_source_has_no_default_local_credentials_or_oauth_identity() {
    let authority_source = include_str!("../src/user_center_authority.rs");

    for forbidden_fragment in [
        "local-default",
        "dev123456",
        "sample-user",
        "sdkwork-user-center-local-tenant-secret",
        "let synthetic_token = session_id.clone()",
        "SDKWORK_USER_CENTER_BOOTSTRAP_",
        "SDKWORK_USER_CENTER_LOCAL_TENANT_ID",
        "SDKWORK_USER_CENTER_LOCAL_ORGANIZATION_ID",
        "SDKWORK_USER_CENTER_LOCAL_BOOTSTRAP_",
        "USER_CENTER_DEFAULT_APP_ID",
        "allow_authorization_fallback_to_access_token",
        "EXTERNAL_ACCOUNT_SHADOW_EMAIL_SUFFIX",
        "build_local_phone_shadow_email",
        "build_external_account_shadow_email",
        "build_avatar_resource",
        "api.dicebear.com",
        "DEFAULT_PROFILE_BIO",
        "DEFAULT_PROFILE_COMPANY",
        "DEFAULT_PROFILE_LOCATION",
        "DEFAULT_PROFILE_WEBSITE",
        "SDKWork User Center User",
    ] {
        assert!(
            !authority_source.contains(forbidden_fragment),
            "{forbidden_fragment} must not be embedded in appbase user-center authority source.",
        );
    }
}

#[test]
fn user_center_authority_keeps_iam_organization_membership_without_commercial_membership() {
    let authority_source = include_str!("../src/user_center_authority.rs");

    for required_symbol in [
        "iam_organization_membership",
        "membership_kind",
        "organization_membership_id",
    ] {
        assert!(
            authority_source.contains(required_symbol),
            "{required_symbol} must remain in the IAM organization membership authority.",
        );
    }

    for retired_symbol in [
        "VipUserRecord",
        "VipMembershipRecord",
        "UpdateUserCenterVipMembershipRequest",
        "UserCenterVipMembershipPayload",
        "load_vip_user_record",
        "load_vip_membership_record",
        "upsert_vip_user_shadow",
        "upsert_vip_membership_shadow",
        "read_vip_membership",
        "update_vip_membership",
        "request_vip_info_with_state",
        "iam_vip_membership",
        "vip_level_id",
        "/vip/info",
        "\"vip-user\"",
        "\"vip-membership\"",
    ] {
        assert!(
            !authority_source.contains(retired_symbol),
            "{retired_symbol} must be retired from appbase user-center authority.",
        );
    }

    for retired_symbol in [
        "MembershipRecord".to_string(),
        "UpdateUserCenter".to_string() + "MembershipRequest",
        "UserCenter".to_string() + "MembershipPayload",
        "load_".to_string() + "membership_record",
        "upsert_".to_string() + "membership_shadow",
        "read_".to_string() + "membership",
        "update_".to_string() + "membership",
        "request_".to_string() + "membership_with_state",
        "iam_".to_string() + "membership",
        "membership_".to_string() + "level_id",
        "point_".to_string() + "balance",
        "total_recharged_".to_string() + "points",
        "/".to_string() + "memberships/current",
    ] {
        assert!(
            !authority_source.contains(&retired_symbol),
            "{retired_symbol} must be retired from appbase user-center authority.",
        );
    }
}

#[test]
fn user_center_authority_has_no_retired_schema_migration_or_plus_table_debt() {
    let authority_source = include_str!("../src/user_center_authority.rs");

    for retired_fragment in [
        "CREATE TABLE IF NOT EXISTS plus_",
        "ON plus_",
        "idx_plus_",
        "legacy_plus_",
        "migrate_legacy_iam_user_password_credentials",
        "rebuild_iam_user_without_legacy_password_column",
        "ensure_sqlite_user_center_integer_identifier_upgrade",
        "upgrade_sqlite_user_center_integer_identifier_table",
        "USER_CENTER_INTEGER_IDENTIFIER_TABLE_RULES",
        "__legacy_integer_identifiers",
        "__legacy_password_column",
    ] {
        assert!(
            !authority_source.contains(retired_fragment),
            "{retired_fragment} must not exist in the new-app user-center authority baseline.",
        );
    }
}
