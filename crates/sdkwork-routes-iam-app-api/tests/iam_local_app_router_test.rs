use axum::body::Body;
use axum::http::{Method, Request, StatusCode};
use http_body_util::BodyExt;
use sdkwork_iam_web_adapter::{ensure_platform_tenant_application, platform_runtime_app_id_for_tenant};
use sdkwork_web_core::bootstrap_access_token_jwt;
use serde_json::{json, Value};
use std::sync::{Mutex, MutexGuard, OnceLock};
use tower::ServiceExt;

#[path = "unified_database_env.rs"]
mod unified_database_env;

// PostgreSQL integration tests share one configured tenant fixture.
// Run this crate's integration suite with `--test-threads 1` (see run-iam-standard-contracts.mjs).

const VERIFY_CODE_ENV: &str = "SDKWORK_IAM_DEV_FIXED_VERIFY_CODE";
const SIGNING_MASTER_SECRET_ENV: &str = "SDKWORK_IAM_TENANT_SIGNING_MASTER_SECRET";
const SIGNING_KEY_ROTATE_ENV: &str = "SDKWORK_IAM_TENANT_SIGNING_KEY_ROTATE";
const RUNTIME_ENV_KEYS: &[&str] = &[
    VERIFY_CODE_ENV,
    SIGNING_MASTER_SECRET_ENV,
    SIGNING_KEY_ROTATE_ENV,
];
const CONFIGURED_BOOTSTRAP_USERNAME: &str = "configured-local-owner@sdkwork-iam.test";
const CONFIGURED_BOOTSTRAP_PASSWORD: &str = "ConfiguredPass#2026";
const CONFIGURED_RESET_CODE: &str = "654321";
const CONFIGURED_TENANT_ID: &str = "tenant_configured";
const CONFIGURED_ORGANIZATION_ID: &str = "org_configured";
const CONFIGURED_DEPARTMENT_ID: &str = "dept_configured";
const CONFIGURED_POSITION_ID: &str = "pos_configured";
const SECONDARY_ORGANIZATION_ID: &str = "org_secondary";

fn local_iam_env_lock() -> &'static Mutex<()> {
    static ENV_LOCK: OnceLock<Mutex<()>> = OnceLock::new();
    ENV_LOCK.get_or_init(|| Mutex::new(()))
}

fn lock_local_iam_env() -> MutexGuard<'static, ()> {
    local_iam_env_lock()
        .lock()
        .unwrap_or_else(|poisoned| poisoned.into_inner())
}

fn jwt_json_part(token: &str, index: usize) -> Value {
    let part = token
        .split('.')
        .nth(index)
        .expect("jwt token part should exist");
    let decoded = decode_base64url(part);
    serde_json::from_slice(&decoded).expect("jwt part should be JSON")
}

fn decode_base64url(input: &str) -> Vec<u8> {
    let mut output = Vec::with_capacity(input.len() * 3 / 4);
    let mut buffer: u32 = 0;
    let mut bits: u8 = 0;

    for byte in input.bytes() {
        if byte == b'=' {
            break;
        }
        let value = match byte {
            b'A'..=b'Z' => byte - b'A',
            b'a'..=b'z' => byte - b'a' + 26,
            b'0'..=b'9' => byte - b'0' + 52,
            b'-' => 62,
            b'_' => 63,
            _ => panic!("invalid base64url byte"),
        } as u32;
        buffer = (buffer << 6) | value;
        bits += 6;
        while bits >= 8 {
            bits -= 8;
            output.push(((buffer >> bits) & 0xff) as u8);
        }
    }

    output
}

fn encode_base64url_json(value: &Value) -> String {
    encode_base64url(
        serde_json::to_vec(value)
            .expect("JWT JSON should serialize")
            .as_slice(),
    )
}

fn encode_base64url(bytes: &[u8]) -> String {
    const ALPHABET: &[u8; 64] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
    let mut output = String::with_capacity(bytes.len().div_ceil(3) * 4);
    for chunk in bytes.chunks(3) {
        let first = chunk[0];
        let second = chunk.get(1).copied().unwrap_or(0);
        let third = chunk.get(2).copied().unwrap_or(0);
        output.push(ALPHABET[(first >> 2) as usize] as char);
        output.push(ALPHABET[(((first & 0x03) << 4) | (second >> 4)) as usize] as char);
        if chunk.len() > 1 {
            output.push(ALPHABET[(((second & 0x0f) << 2) | (third >> 6)) as usize] as char);
        }
        if chunk.len() > 2 {
            output.push(ALPHABET[(third & 0x3f) as usize] as char);
        }
    }
    output
}

fn replace_jwt_payload_without_resigning(token: &str, payload: Value) -> String {
    let mut parts = token.split('.');
    let header = parts.next().expect("JWT header should exist");
    let _old_payload = parts.next().expect("JWT payload should exist");
    let signature = parts.next().expect("JWT signature should exist");
    format!("{header}.{}.{signature}", encode_base64url_json(&payload))
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

async fn build_router_with_env(
    seed_credentials: Option<(&str, &str, &str)>,
    verify_code: Option<&str>,
) -> axum::Router {
    build_router_with_env_internal(seed_credentials, verify_code, true).await
}

async fn build_router_with_env_without_fixture_cleanup(
    seed_credentials: Option<(&str, &str, &str)>,
    verify_code: Option<&str>,
) -> axum::Router {
    build_router_with_env_internal(seed_credentials, verify_code, false).await
}

async fn build_router_with_env_internal(
    seed_credentials: Option<(&str, &str, &str)>,
    verify_code: Option<&str>,
    cleanup_fixtures: bool,
) -> axum::Router {
    let _guard = lock_local_iam_env();
    if cleanup_fixtures {
        cleanup_configured_tenant_integration_fixtures().await;
    }
    unified_database_env::apply_unified_claw_postgres_env();
    let _snapshot = EnvSnapshot::capture(RUNTIME_ENV_KEYS);

    configure_real_local_runtime_env();
    set_optional_env(VERIFY_CODE_ENV, verify_code);

    if let Some((tenant_id, username, password)) = seed_credentials {
        if tenant_id == CONFIGURED_TENANT_ID && username == CONFIGURED_BOOTSTRAP_USERNAME {
            seed_configured_owner_account_with_extra_organizations(&[]).await;
        } else {
            seed_ephemeral_login_account(tenant_id, username, password).await;
        }
    }

    sdkwork_routes_iam_app_api::build_sdkwork_iam_app_api_router()
        .await
        .expect("router should build")
}

async fn build_router_with_configured_owner(extra_organizations: &[(&str, &str)]) -> axum::Router {
    let _guard = lock_local_iam_env();
    cleanup_configured_tenant_integration_fixtures().await;
    unified_database_env::apply_unified_claw_postgres_env();
    let _snapshot = EnvSnapshot::capture(RUNTIME_ENV_KEYS);

    configure_real_local_runtime_env();
    set_optional_env(VERIFY_CODE_ENV, None);
    seed_configured_owner_account_with_extra_organizations(extra_organizations).await;

    sdkwork_routes_iam_app_api::build_sdkwork_iam_app_api_router()
        .await
        .expect("router should build")
}

async fn seed_configured_owner_account() {
    seed_configured_owner_account_with_extra_organizations(&[]).await;
}

async fn build_router_with_bootstrap() -> axum::Router {
    build_router_with_configured_owner(&[]).await
}

async fn build_router_with_multiple_organizations() -> axum::Router {
    build_router_with_configured_owner(&[(SECONDARY_ORGANIZATION_ID, "Secondary Workspace")]).await
}

async fn build_router_without_bootstrap() -> axum::Router {
    build_router_with_env(None, None).await
}

async fn build_router_for_open_registration() -> axum::Router {
    {
        let _guard = lock_local_iam_env();
        prepare_open_registration_database().await;
        unified_database_env::apply_unified_claw_postgres_env();
    }
    build_router_with_env_without_fixture_cleanup(None, None).await
}

async fn build_router_with_credentials_without_bootstrap_scope() -> axum::Router {
    build_router_without_bootstrap().await
}

async fn build_router_and_directory_without_bootstrap() -> (
    axum::Router,
    sdkwork_routes_iam_app_api::SdkworkIamLocalIamDirectory,
) {
    let _guard = lock_local_iam_env();
    cleanup_configured_tenant_integration_fixtures().await;
    unified_database_env::apply_unified_claw_postgres_env();
    let _snapshot = EnvSnapshot::capture(RUNTIME_ENV_KEYS);

    configure_real_local_runtime_env();
    set_optional_env(VERIFY_CODE_ENV, None);

    sdkwork_routes_iam_app_api::build_sdkwork_iam_app_api_router_with_local_directory()
        .await
        .expect("router and directory should build")
}

fn configure_real_local_runtime_env() {
    set_optional_env("SDKWORK_IAM_RATE_LIMIT_MAX_REQUESTS", Some("10000"));
    set_optional_env("SDKWORK_IAM_RATE_LIMIT_WINDOW_SECONDS", Some("60"));
}

async fn build_router_with_bootstrap_and_reset_code() -> axum::Router {
    build_router_with_env(
        Some((
            CONFIGURED_TENANT_ID,
            CONFIGURED_BOOTSTRAP_USERNAME,
            CONFIGURED_BOOTSTRAP_PASSWORD,
        )),
        Some(CONFIGURED_RESET_CODE),
    )
    .await
}

async fn request_json(
    app: &axum::Router,
    method: Method,
    path: &str,
    body: Body,
) -> axum::response::Response {
    request_json_with_auth(
        app,
        method,
        path,
        body,
        None,
        Some(test_bootstrap_access_token().as_str()),
    )
    .await
}

async fn request_open_registration_json(
    app: &axum::Router,
    method: Method,
    path: &str,
    body: Body,
) -> axum::response::Response {
    request_json_with_auth(
        app,
        method,
        path,
        body,
        None,
        Some(test_open_registration_bootstrap_access_token().as_str()),
    )
    .await
}

fn test_bootstrap_access_token() -> String {
    bootstrap_access_token_jwt(
        CONFIGURED_TENANT_ID,
        platform_runtime_app_id_for_tenant(CONFIGURED_TENANT_ID).as_str(),
    )
}

fn test_open_registration_bootstrap_access_token() -> String {
    bootstrap_access_token_jwt(
        "100001",
        platform_runtime_app_id_for_tenant("100001").as_str(),
    )
}

fn test_bootstrap_access_token_for_tenant(tenant_id: &str) -> String {
    bootstrap_access_token_jwt(
        tenant_id,
        platform_runtime_app_id_for_tenant(tenant_id).as_str(),
    )
}

async fn request_json_with_auth(
    app: &axum::Router,
    method: Method,
    path: &str,
    body: Body,
    auth_token: Option<&str>,
    access_token: Option<&str>,
) -> axum::response::Response {
    let mut request = Request::builder()
        .method(method)
        .uri(path)
        .header("content-type", "application/json");
    if let Some(auth_token) = auth_token {
        request = request.header("authorization", format!("Bearer {auth_token}"));
    }
    if let Some(access_token) = access_token {
        request = request.header("access-token", access_token);
    }

    app.clone()
        .oneshot(request.body(body).expect("request should build"))
        .await
        .expect("local IAM app router should return response")
}

async fn read_json(response: axum::response::Response) -> serde_json::Value {
    let bytes = response
        .into_body()
        .collect()
        .await
        .expect("response body should collect")
        .to_bytes();
    serde_json::from_slice(&bytes).expect("response body should be valid json")
}

async fn complete_auth_session_data(
    app: &axum::Router,
    data: serde_json::Value,
    login_scope: &str,
    organization_id: Option<&str>,
) -> serde_json::Value {
    complete_auth_session_data_with_access_token(
        app,
        data,
        login_scope,
        organization_id,
        test_bootstrap_access_token().as_str(),
    )
    .await
}

async fn complete_auth_session_data_with_access_token(
    app: &axum::Router,
    mut data: serde_json::Value,
    login_scope: &str,
    organization_id: Option<&str>,
    access_token: &str,
) -> serde_json::Value {
    loop {
        if data["authToken"].is_string() && data["accessToken"].is_string() {
            return data;
        }

        if data["challengeType"] == "TENANT_SELECTION" {
            panic!("tenant selection challenges are no longer supported");
        }

        if data["challengeType"] == "LOGIN_CONTEXT_SELECTION"
            || data["challengeType"] == "ORGANIZATION_SELECTION"
        {
            let continuation_token = data["continuationToken"]
                .as_str()
                .expect("login context selection should include continuation token");
            let selection_body_value = if login_scope.eq_ignore_ascii_case("TENANT") {
                json!({
                    "continuationToken": continuation_token,
                    "loginScope": "TENANT",
                    "organizationId": "0"
                })
            } else {
                let organization_id = organization_id
                    .or_else(|| {
                        data["organizations"]
                            .as_array()
                            .and_then(|organizations| organizations.first())
                            .and_then(|organization| organization["id"].as_str())
                    })
                    .unwrap_or(CONFIGURED_ORGANIZATION_ID);
                json!({
                    "continuationToken": continuation_token,
                    "loginScope": "ORGANIZATION",
                    "organizationId": organization_id
                })
            };
            let selection_response = request_json_with_auth(
                app,
                Method::POST,
                "/app/v3/api/auth/sessions/login_context_selection",
                Body::from(selection_body_value.to_string()),
                None,
                Some(access_token),
            )
            .await;
            let selection_body = read_json(selection_response).await;
            assert_eq!(
                selection_body["code"], "2000",
                "login context selection failed: {selection_body}"
            );
            data = selection_body["data"].clone();
            continue;
        }

        panic!("unexpected auth response without session tokens: {data}");
    }
}

async fn create_bootstrap_login_session(app: &axum::Router) -> serde_json::Value {
    cleanup_secondary_tenant_login_fixtures().await;
    let response = request_json(
        app,
        Method::POST,
        "/app/v3/api/auth/sessions",
        Body::from(
            json!({
                "grantType": "password",
                "username": CONFIGURED_BOOTSTRAP_USERNAME,
                "password": CONFIGURED_BOOTSTRAP_PASSWORD
            })
            .to_string(),
        ),
    )
    .await;
    let status = response.status();
    let body = read_json(response).await;
    assert_eq!(status, StatusCode::OK, "password login failed: {body}");
    assert_eq!(body["code"], "2000", "password login rejected: {body}");

    complete_auth_session_data(
        app,
        body["data"].clone(),
        "ORGANIZATION",
        Some(CONFIGURED_ORGANIZATION_ID),
    )
    .await
}

fn unique_registration_username(prefix: &str) -> String {
    let unique = format!(
        "{:x}",
        std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .expect("clock should be after unix epoch")
            .as_nanos()
    );
    format!("{prefix}-{unique}")
}

#[tokio::test]
async fn local_appbase_directory_reads_registered_iam_users_without_fixture_rows() {
    let (app, directory) = build_router_and_directory_without_bootstrap().await;
    let directory_username = unique_registration_username("directory-user");
    let directory_email = format!("{directory_username}@sdkwork-iam.local");
    let registration = request_json(
        &app,
        Method::POST,
        "/app/v3/api/auth/registrations",
        Body::from(
            json!({
                "channel": "EMAIL",
                "confirmPassword": "dev123456",
                "email": directory_email,
                "password": "dev123456",
                "username": directory_username
            })
            .to_string(),
        ),
    )
    .await;
    assert_eq!(registration.status(), StatusCode::OK);
    let registration = read_json(registration).await;
    let user_id = registration["data"]["user"]["userId"]
        .as_str()
        .expect("registration should return user id");
    let tenant_id = registration["data"]["user"]["tenantId"]
        .as_str()
        .expect("registration should return tenant id");
    assert!(
        user_id.starts_with("iamu_"),
        "registered IAM user id must be an opaque IAM id: {user_id}"
    );
    assert_ne!(
        user_id, "user_directory_user",
        "registered IAM user id must not be derived from the username"
    );

    let profile = directory
        .get_user_profile(tenant_id, user_id)
        .await
        .expect("registered user should be visible in the shared IAM directory");
    assert_eq!(profile.tenant_id, tenant_id);
    assert_eq!(profile.user_id, user_id);
    assert_eq!(profile.username, directory_username);
    assert_eq!(profile.email.as_deref(), Some(directory_email.as_str()));
    assert!(profile.display_name.contains("Directory"));

    let matches = directory
        .search_user_profiles(tenant_id, &directory_username)
        .await;
    assert_eq!(matches.len(), 1);
    assert_eq!(matches[0].user_id, user_id);
    assert!(
        directory
            .search_user_profiles("t_demo", &directory_username)
            .await
            .is_empty(),
        "directory search must stay tenant-scoped"
    );
}

#[tokio::test]
async fn local_app_router_issues_tokens_from_persisted_user_without_env_runtime_ids() {
    let seeded_tenant_id = "tenant_envless_login";
    let seeded_username = unique_registration_username("envless-login");
    let seeded_email = format!("{seeded_username}@sdkwork-iam.test");
    let seeded_password = "EnvlessLogin#2026";

    seed_login_account_for_tenant(
        seeded_tenant_id,
        &seeded_email,
        &seeded_username,
        &seeded_password,
    )
    .await;

    let app = build_router_with_credentials_without_bootstrap_scope().await;

    let response = request_json_with_auth(
        &app,
        Method::POST,
        "/app/v3/api/auth/sessions",
        Body::from(
            json!({
                "grantType": "password",
                "username": seeded_email,
                "password": seeded_password
            })
            .to_string(),
        ),
        None,
        Some(test_bootstrap_access_token_for_tenant(seeded_tenant_id).as_str()),
    )
    .await;

    assert_eq!(response.status(), StatusCode::OK);
    let body = read_json(response).await;
    assert_eq!(body["code"], "2000");
    assert_eq!(body["data"]["context"]["tenantId"], seeded_tenant_id);
    assert!(body["data"]["authToken"].is_string());
    assert!(body["data"]["accessToken"].is_string());

    let access_claims = jwt_json_part(
        body["data"]["accessToken"]
            .as_str()
            .expect("access token should be present"),
        1,
    );
    assert_eq!(access_claims["tenant_id"].as_str(), Some(seeded_tenant_id));
}

#[tokio::test]
async fn local_app_router_login_rejects_inbound_auth_or_context_headers() {
    let app = build_router_with_bootstrap().await;

    let dirty_login_response = request_json_with_auth(
        &app,
        Method::POST,
        "/app/v3/api/auth/sessions",
        Body::from(
            json!({
                "grantType": "password",
                "username": CONFIGURED_BOOTSTRAP_USERNAME,
                "password": CONFIGURED_BOOTSTRAP_PASSWORD
            })
            .to_string(),
        ),
        Some("old-auth-token"),
        Some("old-access-token"),
    )
    .await;

    assert_eq!(dirty_login_response.status(), StatusCode::BAD_REQUEST);
    let dirty_login_body = read_json(dirty_login_response).await;
    assert_credential_entry_header_rejection(&dirty_login_body);

    let context_header_request = Request::builder()
        .method(Method::POST)
        .uri("/app/v3/api/auth/sessions")
        .header("content-type", "application/json")
        .header("x-sdkwork-tenant-id", "t_demo")
        .header("x-sdkwork-organization-id", "org_demo")
        .header("x-sdkwork-user-id", "user_test006_a_com")
        .body(Body::from(
            json!({
                "grantType": "password",
                "username": CONFIGURED_BOOTSTRAP_USERNAME,
                "password": CONFIGURED_BOOTSTRAP_PASSWORD
            })
            .to_string(),
        ))
        .expect("request should build");
    let context_header_response = app
        .oneshot(context_header_request)
        .await
        .expect("local IAM app router should return response");

    assert_eq!(context_header_response.status(), StatusCode::BAD_REQUEST);
    let context_header_body = read_json(context_header_response).await;
    assert_credential_entry_header_rejection(&context_header_body);
}

fn assert_credential_entry_header_rejection(payload: &serde_json::Value) {
    if payload.get("code").and_then(serde_json::Value::as_str)
        == Some("iam_login_credential_headers_forbidden")
    {
        return;
    }
    assert_eq!(
        payload.get("status").and_then(serde_json::Value::as_u64),
        Some(400)
    );
    let detail = payload
        .get("detail")
        .and_then(serde_json::Value::as_str)
        .unwrap_or_default();
    assert!(
        detail.contains("authorization")
            || detail.contains("x-sdkwork-tenant-id")
            || detail.contains("credential-entry"),
        "expected credential-entry rejection, got: {payload}"
    );
}

#[tokio::test]
async fn local_app_router_error_responses_emit_unique_request_ids() {
    let app = build_router_with_bootstrap().await;

    let first = request_json(
        &app,
        Method::POST,
        "/app/v3/api/auth/sessions",
        Body::from(
            json!({
                "grantType": "password",
                "username": CONFIGURED_BOOTSTRAP_USERNAME,
                "password": "definitely-wrong-password"
            })
            .to_string(),
        ),
    )
    .await;
    let second = request_json(
        &app,
        Method::POST,
        "/app/v3/api/auth/sessions",
        Body::from(
            json!({
                "grantType": "password",
                "username": CONFIGURED_BOOTSTRAP_USERNAME,
                "password": "another-wrong-password"
            })
            .to_string(),
        ),
    )
    .await;

    let first_body = read_json(first).await;
    let second_body = read_json(second).await;
    let first_request_id = first_body["requestId"]
        .as_str()
        .expect("first error response must include requestId");
    let second_request_id = second_body["requestId"]
        .as_str()
        .expect("second error response must include requestId");

    assert!(!first_request_id.trim().is_empty());
    assert!(!second_request_id.trim().is_empty());
    assert_ne!(
        first_request_id, second_request_id,
        "local IAM responses must emit unique requestId values instead of a fixed placeholder"
    );
}

#[tokio::test]
async fn local_app_router_reports_deployment_runtime_without_identity_injection() {
    let app = build_router_without_bootstrap().await;

    let response = request_json(
        &app,
        Method::GET,
        "/app/v3/api/system/iam/runtime",
        Body::empty(),
    )
    .await;

    assert_eq!(response.status(), StatusCode::OK);
    let body = read_json(response).await;
    assert_eq!(body["code"], "2000");
    assert_eq!(body["data"]["deploymentMode"], "saas");
    assert_eq!(body["data"]["runtime"], "embedded");
    assert_eq!(body["data"]["mode"], "private");
    assert!(body["data"].get("appId").is_none());
    assert!(body["data"].get("tenantId").is_none());
    assert!(body["data"].get("organizationId").is_none());
}

fn response_items(payload: &Value) -> Vec<Value> {
    payload["data"]["items"]
        .as_array()
        .or_else(|| payload["data"].as_array())
        .cloned()
        .unwrap_or_default()
}

#[tokio::test]
async fn local_app_router_serves_oauth_device_authorization_creation() {
    let app = build_router_without_bootstrap().await;

    let response = request_json(
        &app,
        Method::POST,
        "/app/v3/api/oauth/device_authorizations",
        Body::from(json!({ "purpose": "login" }).to_string()),
    )
    .await;

    assert_eq!(response.status(), StatusCode::OK);
    let body = read_json(response).await;
    assert_eq!(body["code"], "2000");
    assert_eq!(body["data"]["status"], "pending");
    assert_eq!(body["data"]["type"], "login");
    let session_key = body["data"]["sessionKey"]
        .as_str()
        .expect("OAuth device authorization response must include sessionKey");
    assert!(
        !session_key.starts_with("sdkwork-local-qr-"),
        "OAuth device authorization key must be opaque production logic instead of a local sequence"
    );
    let qr_content = body["data"]["qrContent"]["content"]
        .as_str()
        .expect("OAuth device authorization response must include web QR content");
    assert_eq!(body["data"]["qrContent"]["mode"], "fallback_url");
    assert_eq!(body["data"]["fallbackUrl"], qr_content);
    assert!(
        qr_content.starts_with("http://") || qr_content.starts_with("https://"),
        "OAuth device authorization content must be a mobile-openable web URL: {qr_content}"
    );
    assert!(qr_content.contains("/auth/qr/"));
    assert!(
        body["data"]["pollSecret"]
            .as_str()
            .is_some_and(|value| !value.trim().is_empty()),
        "OAuth device authorization response must include pollSecret for desktop exchange"
    );
    assert!(qr_content.contains(&format!("session_key={session_key}")));
    assert!(qr_content.contains("purpose=login"));
    assert!(
        !qr_content.contains("/app/v3/api/oauth/device_authorizations"),
        "OAuth device authorization content must not point at the status API: {qr_content}"
    );
}

#[tokio::test]
async fn local_app_router_builds_oauth_device_entry_from_request_origin() {
    let app = build_router_without_bootstrap().await;

    let response = app
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/app/v3/api/oauth/device_authorizations")
                .header("content-type", "application/json")
                .header("origin", "https://chat.example.test")
                .header("Access-Token", test_bootstrap_access_token())
                .body(Body::from(json!({ "purpose": "login" }).to_string()))
                .expect("request should build"),
        )
        .await
        .expect("router should respond");

    assert_eq!(response.status(), StatusCode::OK);
    let body = read_json(response).await;
    let qr_content = body["data"]["qrContent"]["content"]
        .as_str()
        .expect("OAuth device authorization response must include web QR content");
    assert!(
        qr_content.starts_with("https://chat.example.test/auth/qr/"),
        "OAuth device authorization content must use the browser origin when available: {qr_content}"
    );
    assert!(
        !qr_content.contains("poll_secret=") || qr_content.contains("#poll_secret="),
        "OAuth device authorization content must not expose poll_secret in query params: {qr_content}"
    );
}

#[tokio::test]
async fn local_app_router_does_not_emit_oauth_device_display_copy() {
    let app = build_router_without_bootstrap().await;

    let response = request_json(
        &app,
        Method::POST,
        "/app/v3/api/oauth/device_authorizations",
        Body::from(json!({ "purpose": "login" }).to_string()),
    )
    .await;

    assert_eq!(response.status(), StatusCode::OK);
    let body = read_json(response).await;
    assert_eq!(body["code"], "2000");
    assert!(body["data"]["title"].is_null());
    assert!(body["data"]["description"].is_null());
}

#[tokio::test]
async fn local_app_router_serves_password_login_with_app_context() {
    let app = build_router_with_bootstrap().await;
    let body = create_bootstrap_login_session(&app).await;

    assert_eq!(body["user"]["username"], CONFIGURED_BOOTSTRAP_USERNAME);
    assert!(body.get("userInfo").is_none());
    assert!(body.get("shardingContext").is_none());
    assert!(body.get("token").is_none());
    assert_eq!(body["context"]["appId"], "app_tenant_configured");
    assert_eq!(body["context"]["tenantId"], CONFIGURED_TENANT_ID);
    assert_eq!(
        body["context"]["organizationId"],
        CONFIGURED_ORGANIZATION_ID
    );
    assert_eq!(body["context"]["deploymentMode"], "saas");
    assert_eq!(body["context"]["loginScope"], "ORGANIZATION");
    let tenant_id = body["context"]["tenantId"].as_str().expect("tenant id");
    let session_id = body["sessionId"].as_str().expect("session id");
    let auth_token = body["authToken"].as_str().expect("auth token");
    let access_token = body["accessToken"].as_str().expect("access token");
    let refresh_token = body["refreshToken"].as_str().expect("refresh token");
    assert_ne!(refresh_token, session_id);
    assert!(!refresh_token.contains(session_id));
    assert!(!refresh_token.starts_with("sdkwork-local-refresh-"));
    assert!(!session_id.starts_with("sdkwork-local-session-"));
    assert_ne!(auth_token, access_token);
    assert_ne!(auth_token, refresh_token);
    assert_ne!(access_token, refresh_token);
    let auth_header = jwt_json_part(auth_token, 0);
    let auth_payload = jwt_json_part(auth_token, 1);
    let access_header = jwt_json_part(access_token, 0);
    let access_payload = jwt_json_part(access_token, 1);

    assert_eq!(auth_header["alg"], "HS256");
    assert!(auth_header["kid"]
        .as_str()
        .is_some_and(|kid| kid.starts_with(tenant_id)));
    assert_eq!(access_header["alg"], "HS256");
    assert!(access_header["kid"]
        .as_str()
        .is_some_and(|kid| kid.starts_with(tenant_id)));
    assert_eq!(auth_payload["token_type"], "auth");
    assert_eq!(access_payload["token_type"], "access");
    for payload in [auth_payload, access_payload] {
        assert_eq!(payload["tenant_id"], tenant_id);
        assert_eq!(payload["session_id"], session_id);
        assert_eq!(payload["login_scope"], "ORGANIZATION");
        assert_eq!(payload["user_id"], body["context"]["userId"]);
        assert_eq!(payload["app_id"], "");
        assert_eq!(payload["organization_id"], CONFIGURED_ORGANIZATION_ID);
    }

    let refresh_response = request_json(
        &app,
        Method::POST,
        "/app/v3/api/auth/sessions/refresh",
        Body::from(json!({ "refreshToken": refresh_token }).to_string()),
    )
    .await;

    assert_eq!(refresh_response.status(), StatusCode::OK);
    let refresh_body = read_json(refresh_response).await;
    assert_eq!(refresh_body["code"], "2000");
    let refreshed_session_id = refresh_body["data"]["sessionId"]
        .as_str()
        .expect("refresh should return a session id");
    let refreshed_refresh_token = refresh_body["data"]["refreshToken"]
        .as_str()
        .expect("refresh should rotate refresh token");
    assert_ne!(refreshed_session_id, session_id);
    assert_ne!(refreshed_refresh_token, refresh_token);
    assert!(!refreshed_refresh_token.contains(refreshed_session_id));
    assert!(refresh_body["data"].get("userInfo").is_none());
    assert!(refresh_body["data"].get("shardingContext").is_none());
}

#[tokio::test]
async fn local_app_router_owner_session_includes_directory_permission_scope() {
    let app = build_router_with_bootstrap().await;
    let body = create_bootstrap_login_session(&app).await;

    let access_token = body["accessToken"].as_str().expect("access token");
    let access_payload = jwt_json_part(access_token, 1);
    let permission_scope = access_payload["permission_scope"]
        .as_array()
        .expect("access token should include permission_scope");
    let codes: Vec<&str> = permission_scope
        .iter()
        .filter_map(|value| value.as_str())
        .collect();

    assert!(
        codes.iter().any(|code| *code == "iam.users.read"),
        "owner session should include iam.users.read, got: {codes:?}"
    );
    assert!(
        codes.iter().any(|code| *code == "iam.organizations.read"),
        "owner session should include iam.organizations.read, got: {codes:?}"
    );
    assert!(
        codes.iter().any(|code| *code == "iam.departments.read"),
        "owner session should include iam.departments.read, got: {codes:?}"
    );
    assert!(
        codes.len() > 1 || !codes.iter().any(|code| *code == "iam:self"),
        "owner session should not fall back to iam:self only, got: {codes:?}"
    );
}

#[tokio::test]
async fn local_app_router_requires_login_context_selection_for_multi_membership_login() {
    let app = build_router_with_multiple_organizations().await;

    let login_response = request_json(
        &app,
        Method::POST,
        "/app/v3/api/auth/sessions",
        Body::from(
            json!({
                "grantType": "password",
                "username": CONFIGURED_BOOTSTRAP_USERNAME,
                "password": CONFIGURED_BOOTSTRAP_PASSWORD
            })
            .to_string(),
        ),
    )
    .await;

    assert_eq!(login_response.status(), StatusCode::OK);
    let login_body = read_json(login_response).await;
    assert_eq!(login_body["code"], "2000");
    assert_eq!(
        login_body["data"]["challengeType"],
        "LOGIN_CONTEXT_SELECTION"
    );
    assert!(login_body["data"]["options"].is_array());
    let continuation_token = login_body["data"]["continuationToken"]
        .as_str()
        .expect("login context challenge should return a continuation token");
    let organizations = login_body["data"]["organizations"]
        .as_array()
        .cloned()
        .expect("login context challenge should return organization choices");
    assert_eq!(organizations.len(), 2);
    assert!(organizations
        .iter()
        .any(|organization| organization["organizationId"] == "org_secondary"));

    let selection_response = request_json(
        &app,
        Method::POST,
        "/app/v3/api/auth/sessions/login_context_selection",
        Body::from(
            json!({
                "continuationToken": continuation_token,
                "loginScope": "ORGANIZATION",
                "organizationId": "org_secondary"
            })
            .to_string(),
        ),
    )
    .await;

    assert_eq!(selection_response.status(), StatusCode::OK);
    let selection_body = read_json(selection_response).await;
    assert_eq!(selection_body["code"], "2000");
    assert_eq!(
        selection_body["data"]["context"]["organizationId"],
        "org_secondary"
    );
    assert_eq!(
        selection_body["data"]["context"]["loginScope"],
        "ORGANIZATION"
    );
    assert!(selection_body["data"]["authToken"].as_str().is_some());
    assert!(selection_body["data"]["accessToken"].as_str().is_some());
}

#[tokio::test]
async fn local_app_router_requires_login_context_selection_for_single_membership_login() {
    let app = build_router_with_bootstrap().await;

    let login_response = request_json(
        &app,
        Method::POST,
        "/app/v3/api/auth/sessions",
        Body::from(
            json!({
                "grantType": "password",
                "username": CONFIGURED_BOOTSTRAP_USERNAME,
                "password": CONFIGURED_BOOTSTRAP_PASSWORD
            })
            .to_string(),
        ),
    )
    .await;

    assert_eq!(login_response.status(), StatusCode::OK);
    let login_body = read_json(login_response).await;
    assert_eq!(login_body["code"], "2000");
    assert_eq!(
        login_body["data"]["challengeType"],
        "LOGIN_CONTEXT_SELECTION"
    );
    let organizations = login_body["data"]["organizations"]
        .as_array()
        .cloned()
        .expect("login context challenge should return organization choices");
    assert_eq!(organizations.len(), 1);
    assert_eq!(
        organizations[0]["organizationId"],
        CONFIGURED_ORGANIZATION_ID
    );
}

#[tokio::test]
async fn local_app_router_personal_login_via_login_context_selection() {
    let app = build_router_with_bootstrap().await;

    let login_response = request_json(
        &app,
        Method::POST,
        "/app/v3/api/auth/sessions",
        Body::from(
            json!({
                "grantType": "password",
                "username": CONFIGURED_BOOTSTRAP_USERNAME,
                "password": CONFIGURED_BOOTSTRAP_PASSWORD
            })
            .to_string(),
        ),
    )
    .await;
    assert_eq!(login_response.status(), StatusCode::OK);
    let login_body = read_json(login_response).await;
    let continuation_token = login_body["data"]["continuationToken"]
        .as_str()
        .expect("login context challenge should return a continuation token");

    let selection_response = request_json(
        &app,
        Method::POST,
        "/app/v3/api/auth/sessions/login_context_selection",
        Body::from(
            json!({
                "continuationToken": continuation_token,
                "loginScope": "TENANT"
            })
            .to_string(),
        ),
    )
    .await;

    assert_eq!(selection_response.status(), StatusCode::OK);
    let selection_body = read_json(selection_response).await;
    assert_eq!(selection_body["code"], "2000");
    assert_eq!(selection_body["data"]["context"]["loginScope"], "TENANT");
    assert_eq!(
        selection_body["data"]["context"]["organizationId"],
        "0"
    );
    assert!(selection_body["data"]["authToken"].as_str().is_some());
}

#[tokio::test]
async fn local_app_router_direct_tenant_login_when_only_platform_organization_membership() {
    let app = build_router_for_open_registration().await;
    let username = unique_registration_username("platform-login");
    let email = format!("{username}@sdkwork-iam.local");
    let registration = request_open_registration_json(
        &app,
        Method::POST,
        "/app/v3/api/auth/registrations",
        Body::from(
            json!({
                "channel": "EMAIL",
                "confirmPassword": "dev123456",
                "email": email,
                "password": "dev123456",
                "username": username
            })
            .to_string(),
        ),
    )
    .await;
    assert_eq!(registration.status(), StatusCode::OK);

    let login_response = request_open_registration_json(
        &app,
        Method::POST,
        "/app/v3/api/auth/sessions",
        Body::from(
            json!({
                "grantType": "password",
                "username": username,
                "password": "dev123456"
            })
            .to_string(),
        ),
    )
    .await;
    assert_eq!(login_response.status(), StatusCode::OK);
    let login_body = read_json(login_response).await;
    assert_eq!(login_body["code"], "2000");
    assert!(login_body["data"]["authToken"].as_str().is_some());
    assert!(login_body["data"]["accessToken"].as_str().is_some());
    assert_eq!(login_body["data"]["context"]["loginScope"], "TENANT");
    assert_eq!(login_body["data"]["context"]["organizationId"], "0");
}

#[tokio::test]
async fn local_app_router_rejects_organization_selection_for_platform_organization_id() {
    let app = build_router_with_bootstrap().await;
    let login_response = request_json(
        &app,
        Method::POST,
        "/app/v3/api/auth/sessions",
        Body::from(
            json!({
                "grantType": "password",
                "username": CONFIGURED_BOOTSTRAP_USERNAME,
                "password": CONFIGURED_BOOTSTRAP_PASSWORD
            })
            .to_string(),
        ),
    )
    .await;
    assert_eq!(login_response.status(), StatusCode::OK);
    let login_body = read_json(login_response).await;
    let continuation_token = login_body["data"]["continuationToken"]
        .as_str()
        .expect("login context challenge should return a continuation token");

    let selection_response = request_json(
        &app,
        Method::POST,
        "/app/v3/api/auth/sessions/login_context_selection",
        Body::from(
            json!({
                "continuationToken": continuation_token,
                "loginScope": "ORGANIZATION",
                "organizationId": "0"
            })
            .to_string(),
        ),
    )
    .await;

    assert_eq!(selection_response.status(), StatusCode::BAD_REQUEST);
}

#[tokio::test]
async fn local_app_router_current_session_requires_matching_dual_tokens() {
    let app = build_router_with_bootstrap().await;
    let login_data = create_bootstrap_login_session(&app).await;
    let auth_token = login_data["authToken"]
        .as_str()
        .expect("login should include auth token");
    let access_token = login_data["accessToken"]
        .as_str()
        .expect("login should include access token");

    let auth_only_response = request_json_with_auth(
        &app,
        Method::GET,
        "/app/v3/api/auth/sessions/current",
        Body::empty(),
        Some(auth_token),
        None,
    )
    .await;

    assert_eq!(auth_only_response.status(), StatusCode::UNAUTHORIZED);

    let mismatched_access_response = request_json_with_auth(
        &app,
        Method::GET,
        "/app/v3/api/auth/sessions/current",
        Body::empty(),
        Some(auth_token),
        Some("sdkwork-local-access-mismatched"),
    )
    .await;

    assert_eq!(
        mismatched_access_response.status(),
        StatusCode::UNAUTHORIZED
    );

    let valid_response = request_json_with_auth(
        &app,
        Method::GET,
        "/app/v3/api/auth/sessions/current",
        Body::empty(),
        Some(auth_token),
        Some(access_token),
    )
    .await;

    assert_eq!(valid_response.status(), StatusCode::OK);
}

#[tokio::test]
async fn local_app_router_current_session_rejects_tampered_dual_token_claims() {
    let app = build_router_with_bootstrap().await;
    let login_data = create_bootstrap_login_session(&app).await;
    let auth_token = login_data["authToken"]
        .as_str()
        .expect("login should include auth token");
    let access_token = login_data["accessToken"]
        .as_str()
        .expect("login should include access token");

    let mut tampered_auth_payload = jwt_json_part(auth_token, 1);
    tampered_auth_payload["exp"] = json!(1);
    let expired_auth_token =
        replace_jwt_payload_without_resigning(auth_token, tampered_auth_payload);
    let expired_auth_response = request_json_with_auth(
        &app,
        Method::GET,
        "/app/v3/api/auth/sessions/current",
        Body::empty(),
        Some(expired_auth_token.as_str()),
        Some(access_token),
    )
    .await;
    assert_eq!(expired_auth_response.status(), StatusCode::UNAUTHORIZED);

    let mut tampered_access_payload = jwt_json_part(access_token, 1);
    tampered_access_payload["token_type"] = json!("auth");
    let wrong_type_access_token =
        replace_jwt_payload_without_resigning(access_token, tampered_access_payload);
    let wrong_type_response = request_json_with_auth(
        &app,
        Method::GET,
        "/app/v3/api/auth/sessions/current",
        Body::empty(),
        Some(auth_token),
        Some(wrong_type_access_token.as_str()),
    )
    .await;
    assert_eq!(wrong_type_response.status(), StatusCode::UNAUTHORIZED);
}

#[tokio::test]
async fn local_app_router_refresh_requires_explicit_refresh_token() {
    let app = build_router_with_bootstrap().await;
    let login_data = create_bootstrap_login_session(&app).await;
    let auth_token = login_data["authToken"]
        .as_str()
        .expect("login should include auth token");
    let access_token = login_data["accessToken"]
        .as_str()
        .expect("login should include access token");

    let missing_refresh_response = request_json_with_auth(
        &app,
        Method::POST,
        "/app/v3/api/auth/sessions/refresh",
        Body::from(json!({}).to_string()),
        Some(auth_token),
        Some(access_token),
    )
    .await;

    assert_eq!(missing_refresh_response.status(), StatusCode::UNAUTHORIZED);
    let missing_refresh_body = read_json(missing_refresh_response).await;
    assert_eq!(missing_refresh_body["code"], "iam_refresh_token_required");
}

#[tokio::test]
async fn local_app_router_rejects_wrong_bootstrap_password() {
    let app = build_router_with_bootstrap().await;

    let response = request_json(
        &app,
        Method::POST,
        "/app/v3/api/auth/sessions",
        Body::from(
            json!({
                "grantType": "password",
                "username": CONFIGURED_BOOTSTRAP_USERNAME,
                "password": "wrong-password"
            })
            .to_string(),
        ),
    )
    .await;

    assert_eq!(response.status(), StatusCode::UNAUTHORIZED);
    let body = read_json(response).await;
    assert_eq!(body["code"], "iam_invalid_credentials");
    assert!(body["data"].is_null());
    assert!(!body.to_string().contains("wrong-password"));
}

#[tokio::test]
async fn local_app_router_rotates_signing_keys_with_overlapping_validation_window() {
    let _guard = lock_local_iam_env();
    cleanup_configured_tenant_integration_fixtures().await;
    unified_database_env::apply_unified_claw_postgres_env();
    let _snapshot = EnvSnapshot::capture(RUNTIME_ENV_KEYS);

    configure_real_local_runtime_env();
    seed_configured_owner_account().await;
    let app = sdkwork_routes_iam_app_api::build_sdkwork_iam_app_api_router()
        .await
        .expect("router should build");
    let login_data = create_bootstrap_login_session(&app).await;
    let auth_token = login_data["authToken"]
        .as_str()
        .expect("auth token")
        .to_string();
    let access_token = login_data["accessToken"]
        .as_str()
        .expect("access token")
        .to_string();
    let old_kid = jwt_json_part(&auth_token, 0)["kid"]
        .as_str()
        .expect("auth kid")
        .to_string();

    set_optional_env(SIGNING_KEY_ROTATE_ENV, Some("true"));
    let rotated_app = sdkwork_routes_iam_app_api::build_sdkwork_iam_app_api_router()
        .await
        .expect("router should rotate signing key");
    set_optional_env(SIGNING_KEY_ROTATE_ENV, None);

    let current_session_response = request_json_with_auth(
        &rotated_app,
        Method::GET,
        "/app/v3/api/auth/sessions/current",
        Body::empty(),
        Some(&auth_token),
        Some(&access_token),
    )
    .await;
    assert_eq!(current_session_response.status(), StatusCode::OK);

    let rotated_login = create_bootstrap_login_session(&rotated_app).await;
    let new_kid = jwt_json_part(rotated_login["authToken"].as_str().expect("auth token"), 0)["kid"]
        .as_str()
        .expect("rotated auth kid")
        .to_string();
    assert_ne!(old_kid, new_kid);
}

#[tokio::test]
async fn local_app_router_registers_password_credentials_and_rejects_mismatched_confirmation() {
    let app = build_router_for_open_registration().await;
    let registered_username = unique_registration_username("registered-user");

    let missing_confirmation_response = request_open_registration_json(
        &app,
        Method::POST,
        "/app/v3/api/auth/registrations",
        Body::from(
            json!({
                "username": "missing-confirmation@sdkwork-iam.local",
                "password": "NewPass#2026"
            })
            .to_string(),
        ),
    )
    .await;

    assert_eq!(
        missing_confirmation_response.status(),
        StatusCode::BAD_REQUEST
    );
    let missing_confirmation_body = read_json(missing_confirmation_response).await;
    assert_eq!(
        missing_confirmation_body["code"],
        "iam_password_confirmation_required"
    );
    assert!(!missing_confirmation_body
        .to_string()
        .contains("NewPass#2026"));

    let mismatch_response = request_open_registration_json(
        &app,
        Method::POST,
        "/app/v3/api/auth/registrations",
        Body::from(
            json!({
                "username": "mismatch-user@sdkwork-iam.local",
                "password": "NewPass#2026",
                "confirmPassword": "DifferentPass#2026"
            })
            .to_string(),
        ),
    )
    .await;

    assert_eq!(mismatch_response.status(), StatusCode::BAD_REQUEST);
    let mismatch_body = read_json(mismatch_response).await;
    assert_eq!(mismatch_body["code"], "iam_password_confirmation_mismatch");
    assert!(!mismatch_body.to_string().contains("NewPass#2026"));

    let register_response = request_open_registration_json(
        &app,
        Method::POST,
        "/app/v3/api/auth/registrations",
        Body::from(
            json!({
                "username": registered_username,
                "password": "NewPass#2026",
                "confirmPassword": "NewPass#2026"
            })
            .to_string(),
        ),
    )
    .await;

    assert_eq!(register_response.status(), StatusCode::OK);
    let register_body = read_json(register_response).await;
    assert_eq!(
        register_body["data"]["user"]["username"],
        registered_username
    );
    assert!(!register_body.to_string().contains("NewPass#2026"));

    let wrong_login_response = request_open_registration_json(
        &app,
        Method::POST,
        "/app/v3/api/auth/sessions",
        Body::from(
            json!({
                "grantType": "password",
                "username": registered_username,
                "password": "wrong-password"
            })
            .to_string(),
        ),
    )
    .await;

    assert_eq!(wrong_login_response.status(), StatusCode::UNAUTHORIZED);

    let valid_login_response = request_open_registration_json(
        &app,
        Method::POST,
        "/app/v3/api/auth/sessions",
        Body::from(
            json!({
                "grantType": "password",
                "username": registered_username,
                "password": "NewPass#2026"
            })
            .to_string(),
        ),
    )
    .await;

    assert_eq!(valid_login_response.status(), StatusCode::OK);
}

#[tokio::test]
async fn local_app_router_does_not_synthesize_missing_contact_identity() {
    let app = build_router_for_open_registration().await;
    let username_only_account = unique_registration_username("username-only-local-account");

    let register_response = request_open_registration_json(
        &app,
        Method::POST,
        "/app/v3/api/auth/registrations",
        Body::from(
            json!({
                "username": username_only_account,
                "password": "NewPass#2026",
                "confirmPassword": "NewPass#2026"
            })
            .to_string(),
        ),
    )
    .await;

    assert_eq!(register_response.status(), StatusCode::OK);
    let register_body = read_json(register_response).await;
    assert_eq!(
        register_body["data"]["user"]["username"],
        username_only_account
    );
    assert!(
        register_body["data"]["user"].get("email").is_none()
            || register_body["data"]["user"]["email"].is_null(),
        "local registration must not synthesize a fake email contact"
    );
    assert!(
        !register_body.to_string().contains("@sdkwork-iam.local"),
        "local IAM responses must not expose generated local contact identities"
    );

    let generated_email_login_response = request_open_registration_json(
        &app,
        Method::POST,
        "/app/v3/api/auth/sessions",
        Body::from(
            json!({
                "grantType": "password",
                "username": format!("{username_only_account}@sdkwork-iam.local"),
                "password": "NewPass#2026"
            })
            .to_string(),
        ),
    )
    .await;

    assert_eq!(
        generated_email_login_response.status(),
        StatusCode::UNAUTHORIZED
    );
    let generated_email_body = read_json(generated_email_login_response).await;
    assert_eq!(generated_email_body["code"], "iam_invalid_credentials");
}

#[tokio::test]
async fn local_app_router_serves_directory_records_from_registered_local_store() {
    let _guard = lock_local_iam_env();
    cleanup_configured_tenant_integration_fixtures().await;
    unified_database_env::apply_unified_claw_postgres_env();
    let app = build_router_with_bootstrap().await;
    let directory_member = unique_registration_username("directory-member");
    let directory_member_email = format!("{directory_member}@sdkwork-iam.local");

    let register_response = request_json(
        &app,
        Method::POST,
        "/app/v3/api/auth/registrations",
        Body::from(
            json!({
                "username": directory_member_email,
                "email": directory_member_email,
                "password": "DirectoryPass#2026",
                "confirmPassword": "DirectoryPass#2026"
            })
            .to_string(),
        ),
    )
    .await;

    assert_eq!(register_response.status(), StatusCode::OK);
    let register_body = read_json(register_response).await;
    assert_eq!(register_body["code"], "2000");
    let session_data =
        complete_auth_session_data(&app, register_body["data"].clone(), "TENANT", None).await;
    let auth_token = session_data["authToken"]
        .as_str()
        .expect("registration should return auth token");
    let access_token = session_data["accessToken"]
        .as_str()
        .expect("registration should return access token");
    let user_id = session_data["user"]["id"]
        .as_str()
        .expect("registration should return user id");

    let organizations_response = request_json_with_auth(
        &app,
        Method::GET,
        "/app/v3/api/iam/organizations",
        Body::empty(),
        Some(auth_token),
        Some(access_token),
    )
    .await;
    assert_eq!(organizations_response.status(), StatusCode::FORBIDDEN);
    let organizations_body = read_json(organizations_response).await;
    assert_eq!(organizations_body["code"], "iam_permission_forbidden");

    let memberships_response = request_json_with_auth(
        &app,
        Method::GET,
        "/app/v3/api/iam/organization_memberships",
        Body::empty(),
        Some(auth_token),
        Some(access_token),
    )
    .await;
    assert_eq!(memberships_response.status(), StatusCode::OK);
    let memberships_body = read_json(memberships_response).await;
    assert_eq!(memberships_body["code"], "2000");
    let memberships = response_items(&memberships_body);
    assert_eq!(memberships.len(), 1);
    let _organization_id = memberships[0]["organizationId"]
        .as_str()
        .expect("membership should expose organization id");
    assert_eq!(memberships[0]["userId"], user_id);
    assert_eq!(memberships[0]["status"], "active");
    assert_eq!(memberships[0]["membershipType"], "member");
    assert_ne!(memberships[0]["id"], "membership_demo");

    let departments_response = request_json_with_auth(
        &app,
        Method::GET,
        "/app/v3/api/iam/departments",
        Body::empty(),
        Some(auth_token),
        Some(access_token),
    )
    .await;
    assert_eq!(departments_response.status(), StatusCode::FORBIDDEN);
    let departments_body = read_json(departments_response).await;
    assert_eq!(departments_body["code"], "iam_permission_forbidden");
}

async fn assert_database_dual_token_resolution(auth_token: &str, access_token: &str, label: &str) {
    let pg = postgres_pool_for_tests().await;
    let resolved = sdkwork_iam_web_adapter::resolve_iam_app_context_from_dual_tokens(
        &pg,
        auth_token,
        access_token,
    )
    .await;
    assert!(
        resolved.is_some(),
        "{label} should resolve through IAM database dual-token adapter"
    );
}

#[tokio::test]
async fn local_app_router_owner_reads_directory_records_from_local_store() {
    let app = build_router_with_bootstrap().await;
    let login_data = create_bootstrap_login_session(&app).await;
    let auth_token = login_data["authToken"]
        .as_str()
        .expect("login should return auth token");
    let access_token = login_data["accessToken"]
        .as_str()
        .expect("login should return access token");
    let tenant_id = login_data["context"]["tenantId"]
        .as_str()
        .expect("login should return tenant context");
    let user_id = login_data["user"]["id"]
        .as_str()
        .expect("login should return user id");

    assert_database_dual_token_resolution(
        auth_token,
        access_token,
        "bootstrap owner login session",
    )
    .await;

    let organizations_response = request_json_with_auth(
        &app,
        Method::GET,
        "/app/v3/api/iam/organizations",
        Body::empty(),
        Some(auth_token),
        Some(access_token),
    )
    .await;
    let organizations_status = organizations_response.status();
    let organizations_body = read_json(organizations_response).await;
    assert_eq!(
        organizations_status,
        StatusCode::OK,
        "organizations response: {organizations_body}"
    );
    assert_eq!(organizations_body["code"], "2000");
    let organizations = response_items(&organizations_body);
    assert_eq!(organizations.len(), 1);
    assert_eq!(organizations[0]["tenantId"], tenant_id);
    assert_ne!(organizations[0]["id"], "org_demo");
    let organization_id = organizations[0]["organizationId"]
        .as_str()
        .expect("organization should expose organization id");

    let organization_tree_response = request_json_with_auth(
        &app,
        Method::GET,
        "/app/v3/api/iam/organizations/tree",
        Body::empty(),
        Some(auth_token),
        Some(access_token),
    )
    .await;
    assert_eq!(organization_tree_response.status(), StatusCode::OK);
    let organization_tree_body = read_json(organization_tree_response).await;
    assert_eq!(organization_tree_body["code"], "2000");
    let organization_tree = response_items(&organization_tree_body);
    assert_eq!(organization_tree.len(), 1);
    assert_eq!(organization_tree[0]["organizationId"], organization_id);

    let memberships_response = request_json_with_auth(
        &app,
        Method::GET,
        "/app/v3/api/iam/organization_memberships",
        Body::empty(),
        Some(auth_token),
        Some(access_token),
    )
    .await;
    assert_eq!(memberships_response.status(), StatusCode::OK);
    let memberships_body = read_json(memberships_response).await;
    assert_eq!(memberships_body["code"], "2000");
    let memberships = response_items(&memberships_body);
    assert_eq!(memberships.len(), 1);
    assert_eq!(memberships[0]["organizationId"], organization_id);
    assert_eq!(memberships[0]["userId"], user_id);
    assert_eq!(memberships[0]["status"], "active");
    let membership_id = memberships[0]["membershipId"]
        .as_str()
        .expect("membership should expose membership id");

    let departments_response = request_json_with_auth(
        &app,
        Method::GET,
        "/app/v3/api/iam/departments",
        Body::empty(),
        Some(auth_token),
        Some(access_token),
    )
    .await;
    assert_eq!(departments_response.status(), StatusCode::OK);
    let departments_body = read_json(departments_response).await;
    assert_eq!(departments_body["code"], "2000");
    let departments = response_items(&departments_body);
    assert_eq!(departments.len(), 1);
    assert_eq!(departments[0]["organizationId"], organization_id);
    let department_id = departments[0]["departmentId"]
        .as_str()
        .expect("department should expose department id");

    let department_assignments_response = request_json_with_auth(
        &app,
        Method::GET,
        &format!("/app/v3/api/iam/department_assignments?departmentId={department_id}"),
        Body::empty(),
        Some(auth_token),
        Some(access_token),
    )
    .await;
    assert_eq!(department_assignments_response.status(), StatusCode::OK);
    let department_assignments_body = read_json(department_assignments_response).await;
    assert_eq!(department_assignments_body["code"], "2000");
    let department_assignments = response_items(&department_assignments_body);
    assert_eq!(department_assignments.len(), 1);
    assert_eq!(department_assignments[0]["userId"], user_id);
    let department_assignment_id = department_assignments[0]["departmentAssignmentId"]
        .as_str()
        .expect("department assignment should expose assignment id");

    let positions_response = request_json_with_auth(
        &app,
        Method::GET,
        "/app/v3/api/iam/positions",
        Body::empty(),
        Some(auth_token),
        Some(access_token),
    )
    .await;
    assert_eq!(positions_response.status(), StatusCode::OK);
    let positions_body = read_json(positions_response).await;
    assert_eq!(positions_body["code"], "2000");
    let positions = response_items(&positions_body);
    assert_eq!(positions.len(), 1);
    let position_id = positions[0]["positionId"]
        .as_str()
        .expect("position should expose position id");

    let position_assignments_response = request_json_with_auth(
        &app,
        Method::GET,
        &format!(
            "/app/v3/api/iam/position_assignments?departmentAssignmentId={department_assignment_id}"
        ),
        Body::empty(),
        Some(auth_token),
        Some(access_token),
    )
    .await;
    assert_eq!(position_assignments_response.status(), StatusCode::OK);
    let position_assignments_body = read_json(position_assignments_response).await;
    assert_eq!(position_assignments_body["code"], "2000");
    let position_assignments = response_items(&position_assignments_body);
    assert_eq!(position_assignments.len(), 1);
    assert_eq!(position_assignments[0]["positionId"], position_id);

    let role_bindings_response = request_json_with_auth(
        &app,
        Method::GET,
        &format!(
            "/app/v3/api/iam/role_bindings?principalId={membership_id}&scopeKind=organization&scopeId={organization_id}"
        ),
        Body::empty(),
        Some(auth_token),
        Some(access_token),
    )
    .await;
    assert_eq!(role_bindings_response.status(), StatusCode::OK);
    let role_bindings_body = read_json(role_bindings_response).await;
    assert_eq!(role_bindings_body["code"], "2000");
    let role_bindings = response_items(&role_bindings_body);
    assert!(
        !role_bindings.is_empty(),
        "bootstrap owner should expose organization role bindings"
    );
}

#[tokio::test]
async fn local_app_router_updates_current_session_organization_context() {
    let app = build_router_with_multiple_organizations().await;
    let login_data = create_bootstrap_login_session(&app).await;
    let session_id = login_data["sessionId"]
        .as_str()
        .expect("login should return session id");
    let auth_token = login_data["authToken"]
        .as_str()
        .expect("login should return auth token");
    let access_token = login_data["accessToken"]
        .as_str()
        .expect("login should return access token");
    assert_eq!(
        login_data["context"]["organizationId"],
        CONFIGURED_ORGANIZATION_ID
    );

    let update_response = request_json_with_auth(
        &app,
        Method::PATCH,
        "/app/v3/api/auth/sessions/current",
        Body::from(
            json!({
                "organizationId": "org_secondary"
            })
            .to_string(),
        ),
        Some(auth_token),
        Some(access_token),
    )
    .await;
    assert_eq!(update_response.status(), StatusCode::OK);
    let update_body = read_json(update_response).await;
    assert_eq!(update_body["code"], "2000");
    assert_eq!(update_body["data"]["sessionId"], session_id);
    assert_eq!(
        update_body["data"]["context"]["organizationId"],
        "org_secondary"
    );
    assert_eq!(update_body["data"]["context"]["loginScope"], "ORGANIZATION");
    let updated_auth_token = update_body["data"]["authToken"]
        .as_str()
        .expect("organization update should rotate auth token");
    let updated_access_token = update_body["data"]["accessToken"]
        .as_str()
        .expect("organization update should rotate access token");

    let stale_current_response = request_json_with_auth(
        &app,
        Method::GET,
        "/app/v3/api/auth/sessions/current",
        Body::empty(),
        Some(auth_token),
        Some(access_token),
    )
    .await;
    assert_eq!(stale_current_response.status(), StatusCode::UNAUTHORIZED);

    let current_response = request_json_with_auth(
        &app,
        Method::GET,
        "/app/v3/api/auth/sessions/current",
        Body::empty(),
        Some(updated_auth_token),
        Some(updated_access_token),
    )
    .await;
    assert_eq!(current_response.status(), StatusCode::OK);
    let current_body = read_json(current_response).await;
    assert_eq!(
        current_body["data"]["context"]["organizationId"],
        "org_secondary"
    );
}

#[tokio::test]
async fn local_app_router_current_session_switches_to_personal_login_scope() {
    let app = build_router_with_bootstrap().await;
    let login_data = create_bootstrap_login_session(&app).await;
    let auth_token = login_data["authToken"]
        .as_str()
        .expect("login should return auth token");
    let access_token = login_data["accessToken"]
        .as_str()
        .expect("login should return access token");
    assert_eq!(login_data["context"]["loginScope"], "ORGANIZATION");
    assert_eq!(
        login_data["context"]["organizationId"],
        CONFIGURED_ORGANIZATION_ID
    );

    let update_response = request_json_with_auth(
        &app,
        Method::PATCH,
        "/app/v3/api/auth/sessions/current",
        Body::from(json!({ "loginScope": "TENANT" }).to_string()),
        Some(auth_token),
        Some(access_token),
    )
    .await;
    let update_status = update_response.status();
    let update_body = read_json(update_response).await;
    assert_eq!(
        update_status,
        StatusCode::OK,
        "personal login scope switch failed: {update_body}"
    );
    assert_eq!(update_body["code"], "2000");
    assert_eq!(update_body["data"]["context"]["loginScope"], "TENANT");
    assert_eq!(update_body["data"]["context"]["organizationId"], "0");
    let updated_auth_token = update_body["data"]["authToken"]
        .as_str()
        .expect("personal context switch should rotate auth token");
    let updated_access_token = update_body["data"]["accessToken"]
        .as_str()
        .expect("personal context switch should rotate access token");
    assert_ne!(updated_auth_token, auth_token);
    assert_ne!(updated_access_token, access_token);

    let data_scope = update_body["data"]["context"]["dataScope"]
        .as_array()
        .cloned()
        .expect("personal session should include data scope");
    let user_id = login_data["context"]["userId"]
        .as_str()
        .expect("login should return user id");
    assert!(
        data_scope
            .iter()
            .any(|scope| scope.as_str() == Some(&format!("user:{user_id}"))),
        "personal session should include user data scope, got: {data_scope:?}"
    );
}

#[tokio::test]
async fn local_app_router_ephemeral_password_reset_survives_router_rebuild() {
    let reset_username = format!(
        "{}@sdkwork-iam.test",
        unique_registration_username("ephemeral-reset")
    );
    let original_password = "EphemeralReset#2026";
    let reset_password = "EphemeralResetNew#2026";
    let tenant_id = format!("tenant_{}", uuid::Uuid::now_v7());
    let seed_credentials = (
        tenant_id.as_str(),
        reset_username.as_str(),
        original_password,
    );

    let app_a = build_router_with_env(Some(seed_credentials), Some(CONFIGURED_RESET_CODE)).await;
    let request_response = request_json(
        &app_a,
        Method::POST,
        "/app/v3/api/auth/password_reset_requests",
        Body::from(
            json!({
                "account": reset_username
            })
            .to_string(),
        ),
    )
    .await;
    assert_eq!(request_response.status(), StatusCode::OK);

    let app_b =
        build_router_with_env_without_fixture_cleanup(None, Some(CONFIGURED_RESET_CODE)).await;
    let reset_response = request_json(
        &app_b,
        Method::POST,
        "/app/v3/api/auth/password_resets",
        Body::from(
            json!({
                "account": reset_username,
                "code": CONFIGURED_RESET_CODE,
                "newPassword": reset_password,
                "confirmPassword": reset_password
            })
            .to_string(),
        ),
    )
    .await;
    assert_eq!(reset_response.status(), StatusCode::OK);

    let login_response = request_json_with_auth(
        &app_b,
        Method::POST,
        "/app/v3/api/auth/sessions",
        Body::from(
            json!({
                "grantType": "password",
                "username": reset_username,
                "password": reset_password
            })
            .to_string(),
        ),
        None,
        Some(
            bootstrap_access_token_jwt(
                tenant_id.as_str(),
                platform_runtime_app_id_for_tenant(&tenant_id).as_str(),
            )
            .as_str(),
        ),
    )
    .await;
    assert_eq!(login_response.status(), StatusCode::OK);
}

#[tokio::test]
async fn local_app_router_registered_member_session_falls_back_to_self_permission_scope() {
    let app = build_router_for_open_registration().await;
    let username = unique_registration_username("member-scope");
    let email = format!("{username}@sdkwork-iam.local");

    let register_response = request_open_registration_json(
        &app,
        Method::POST,
        "/app/v3/api/auth/registrations",
        Body::from(
            json!({
                "username": email,
                "email": email,
                "password": "MemberPass#2026",
                "confirmPassword": "MemberPass#2026"
            })
            .to_string(),
        ),
    )
    .await;
    assert_eq!(register_response.status(), StatusCode::OK);
    let register_body = read_json(register_response).await;
    let session_data = complete_auth_session_data_with_access_token(
        &app,
        register_body["data"].clone(),
        "TENANT",
        None,
        test_open_registration_bootstrap_access_token().as_str(),
    )
    .await;
    let access_token = session_data["accessToken"].as_str().expect("access token");
    let access_payload = jwt_json_part(access_token, 1);
    let permission_scope = access_payload["permission_scope"]
        .as_array()
        .expect("permission scope");
    let codes: Vec<&str> = permission_scope
        .iter()
        .filter_map(|value| value.as_str())
        .collect();
    assert!(
        codes.contains(&"iam:self"),
        "tenant login should retain iam:self baseline scope: {codes:?}"
    );
    assert!(
        codes.iter().any(|code| code.starts_with("iam.")),
        "registered members should receive IMF baseline IAM permissions: {codes:?}"
    );
}

#[tokio::test]
async fn local_app_router_rejects_passwords_outside_policy() {
    let app = build_router_for_open_registration().await;
    let short_password_user = unique_registration_username("short-password");
    let max_password_user = unique_registration_username("max-password");
    let long_password_user = unique_registration_username("long-password");

    let short_password_response = request_open_registration_json(
        &app,
        Method::POST,
        "/app/v3/api/auth/registrations",
        Body::from(
            json!({
                "username": format!("{short_password_user}@sdkwork-iam.local"),
                "password": "short",
                "confirmPassword": "short"
            })
            .to_string(),
        ),
    )
    .await;

    assert_eq!(short_password_response.status(), StatusCode::BAD_REQUEST);
    let short_password_body = read_json(short_password_response).await;
    assert_eq!(short_password_body["code"], "iam_password_policy_violation");

    let max_length_password = "A1".repeat(32);
    let max_length_password_response = request_open_registration_json(
        &app,
        Method::POST,
        "/app/v3/api/auth/registrations",
        Body::from(
            json!({
                "username": format!("{max_password_user}@sdkwork-iam.local"),
                "password": max_length_password,
                "confirmPassword": max_length_password
            })
            .to_string(),
        ),
    )
    .await;

    assert_eq!(max_length_password_response.status(), StatusCode::OK);

    let too_long_password = "A".repeat(65);
    let too_long_password_response = request_open_registration_json(
        &app,
        Method::POST,
        "/app/v3/api/auth/registrations",
        Body::from(
            json!({
                "username": format!("{long_password_user}@sdkwork-iam.local"),
                "password": too_long_password,
                "confirmPassword": too_long_password
            })
            .to_string(),
        ),
    )
    .await;

    assert_eq!(too_long_password_response.status(), StatusCode::BAD_REQUEST);
    let too_long_password_body = read_json(too_long_password_response).await;
    assert_eq!(
        too_long_password_body["code"],
        "iam_password_policy_violation"
    );
    assert!(!too_long_password_body.to_string().contains(&"A".repeat(65)));
}

#[tokio::test]
async fn local_app_router_disables_external_login_modes_without_real_verification() {
    let app = build_router_without_bootstrap().await;

    for (grant_type, account_field) in [
        (
            "email_code",
            json!({ "email": "code-login@sdkwork-iam.test" }),
        ),
        ("phone_code", json!({ "phone": "13800000000" })),
        (
            "session_bridge",
            json!({ "email": "bridge-login@sdkwork-iam.test" }),
        ),
    ] {
        let mut payload = account_field;
        payload["grantType"] = json!(grant_type);
        payload["code"] = json!("987654");

        let response = request_json(
            &app,
            Method::POST,
            "/app/v3/api/auth/sessions",
            Body::from(payload.to_string()),
        )
        .await;
        assert_eq!(response.status(), StatusCode::BAD_REQUEST);
        let body = read_json(response).await;
        assert_eq!(body["code"], "iam_unsupported_grant_type");
        assert!(body["data"].is_null());
        assert!(body["data"]["authToken"].is_null());
    }
}

#[tokio::test]
async fn local_app_router_oauth_fails_closed_without_configured_provider() {
    let app = build_router_without_bootstrap().await;

    let auth_url_response = request_json(
        &app,
        Method::POST,
        "/app/v3/api/oauth/authorization_urls",
        Body::from(
            json!({
                "provider": "github",
                "redirectUri": "https://app.sdkwork.ai/auth/callback"
            })
            .to_string(),
        ),
    )
    .await;

    assert_eq!(auth_url_response.status(), StatusCode::FORBIDDEN);
    let auth_url_body = read_json(auth_url_response).await;
    assert_eq!(auth_url_body["code"], "iam_oauth_login_disabled");
    assert!(!auth_url_body.to_string().contains("127.0.0.1"));

    let oauth_session_response = request_json(
        &app,
        Method::POST,
        "/app/v3/api/oauth/sessions",
        Body::from(
            json!({
                "code": "oauth-code",
                "provider": "github",
                "state": "state-1"
            })
            .to_string(),
        ),
    )
    .await;

    assert_eq!(oauth_session_response.status(), StatusCode::FORBIDDEN);
    let oauth_session_body = read_json(oauth_session_response).await;
    assert_eq!(oauth_session_body["code"], "iam_oauth_login_disabled");
    assert!(oauth_session_body["data"].is_null());
    assert!(oauth_session_body["data"]["authToken"].is_null());
}

#[tokio::test]
async fn local_app_router_preserves_password_whitespace() {
    let app = build_router_for_open_registration().await;
    let space_password_user = format!(
        "{}@sdkwork-iam.local",
        unique_registration_username("space-password")
    );

    let register_response = request_open_registration_json(
        &app,
        Method::POST,
        "/app/v3/api/auth/registrations",
        Body::from(
            json!({
                "username": space_password_user,
                "password": " SpacePass#2026 ",
                "confirmPassword": " SpacePass#2026 "
            })
            .to_string(),
        ),
    )
    .await;

    assert_eq!(register_response.status(), StatusCode::OK);

    let trimmed_password_response = request_open_registration_json(
        &app,
        Method::POST,
        "/app/v3/api/auth/sessions",
        Body::from(
            json!({
                "grantType": "password",
                "username": space_password_user,
                "password": "SpacePass#2026"
            })
            .to_string(),
        ),
    )
    .await;

    assert_eq!(trimmed_password_response.status(), StatusCode::UNAUTHORIZED);

    let original_password_response = request_open_registration_json(
        &app,
        Method::POST,
        "/app/v3/api/auth/sessions",
        Body::from(
            json!({
                "grantType": "password",
                "username": space_password_user,
                "password": " SpacePass#2026 "
            })
            .to_string(),
        ),
    )
    .await;

    assert_eq!(original_password_response.status(), StatusCode::OK);
}

#[tokio::test]
async fn local_app_router_resets_password_only_with_valid_reset_token_and_code() {
    let reset_username = format!(
        "{}@sdkwork-iam.test",
        unique_registration_username("reset-user")
    );
    let original_password = "ResetUserPass#2026";
    let reset_password = "ResetPass#2026";
    let tenant_id = format!("tenant_{}", uuid::Uuid::now_v7());
    let app = build_router_with_env(
        Some((
            tenant_id.as_str(),
            reset_username.as_str(),
            original_password,
        )),
        Some(CONFIGURED_RESET_CODE),
    )
    .await;

    let unknown_request_response = request_json(
        &app,
        Method::POST,
        "/app/v3/api/auth/password_reset_requests",
        Body::from(
            json!({
                "account": "unknown-user@sdkwork-iam.local"
            })
            .to_string(),
        ),
    )
    .await;

    assert_eq!(unknown_request_response.status(), StatusCode::OK);
    let unknown_request_body = read_json(unknown_request_response).await;
    assert_eq!(unknown_request_body["data"]["accepted"], true);
    assert!(unknown_request_body["data"]["resetToken"].is_null());

    let request_response = request_json(
        &app,
        Method::POST,
        "/app/v3/api/auth/password_reset_requests",
        Body::from(
            json!({
                "account": reset_username
            })
            .to_string(),
        ),
    )
    .await;

    assert_eq!(request_response.status(), StatusCode::OK);
    let request_body = read_json(request_response).await;
    assert_eq!(request_body["data"]["accepted"], true);
    assert!(request_body["data"]["resetToken"].is_null());

    let bad_code_response = request_json(
        &app,
        Method::POST,
        "/app/v3/api/auth/password_resets",
        Body::from(
            json!({
                "account": reset_username,
                "code": "000000",
                "newPassword": reset_password,
                "confirmPassword": reset_password
            })
            .to_string(),
        ),
    )
    .await;

    assert_eq!(bad_code_response.status(), StatusCode::UNAUTHORIZED);

    let missing_confirmation_response = request_json(
        &app,
        Method::POST,
        "/app/v3/api/auth/password_resets",
        Body::from(
            json!({
                "account": reset_username,
                "code": CONFIGURED_RESET_CODE,
                "newPassword": reset_password
            })
            .to_string(),
        ),
    )
    .await;

    assert_eq!(
        missing_confirmation_response.status(),
        StatusCode::BAD_REQUEST
    );
    let missing_confirmation_body = read_json(missing_confirmation_response).await;
    assert_eq!(
        missing_confirmation_body["code"],
        "iam_password_confirmation_required"
    );
    assert!(!missing_confirmation_body
        .to_string()
        .contains(reset_password));

    let reset_response = request_json(
        &app,
        Method::POST,
        "/app/v3/api/auth/password_resets",
        Body::from(
            json!({
                "account": reset_username,
                "code": CONFIGURED_RESET_CODE,
                "newPassword": reset_password,
                "confirmPassword": reset_password
            })
            .to_string(),
        ),
    )
    .await;

    assert_eq!(reset_response.status(), StatusCode::OK);

    let old_password_response = request_json_with_auth(
        &app,
        Method::POST,
        "/app/v3/api/auth/sessions",
        Body::from(
            json!({
                "grantType": "password",
                "username": reset_username,
                "password": original_password
            })
            .to_string(),
        ),
        None,
        Some(
            bootstrap_access_token_jwt(
                tenant_id.as_str(),
                platform_runtime_app_id_for_tenant(&tenant_id).as_str(),
            )
            .as_str(),
        ),
    )
    .await;

    assert_eq!(old_password_response.status(), StatusCode::UNAUTHORIZED);

    let new_password_response = request_json_with_auth(
        &app,
        Method::POST,
        "/app/v3/api/auth/sessions",
        Body::from(
            json!({
                "grantType": "password",
                "username": reset_username,
                "password": reset_password
            })
            .to_string(),
        ),
        None,
        Some(
            bootstrap_access_token_jwt(
                tenant_id.as_str(),
                platform_runtime_app_id_for_tenant(&tenant_id).as_str(),
            )
            .as_str(),
        ),
    )
    .await;

    assert_eq!(new_password_response.status(), StatusCode::OK);

    let reused_token_response = request_json(
        &app,
        Method::POST,
        "/app/v3/api/auth/password_resets",
        Body::from(
            json!({
                "account": reset_username,
                "code": CONFIGURED_RESET_CODE,
                "newPassword": "AnotherPass#2026",
                "confirmPassword": "AnotherPass#2026"
            })
            .to_string(),
        ),
    )
    .await;

    assert_eq!(reused_token_response.status(), StatusCode::UNAUTHORIZED);
}

#[tokio::test]
async fn local_app_router_oauth_device_password_completion_requires_valid_credentials() {
    let app = build_router_for_open_registration().await;
    let oauth_username = format!(
        "{}@sdkwork-iam.local",
        unique_registration_username("oauth-device-user")
    );
    let oauth_password = "OAuthDevicePass#2026";

    let register_response = request_open_registration_json(
        &app,
        Method::POST,
        "/app/v3/api/auth/registrations",
        Body::from(
            json!({
                "username": oauth_username,
                "email": oauth_username,
                "password": oauth_password,
                "confirmPassword": oauth_password
            })
            .to_string(),
        ),
    )
    .await;
    assert_eq!(register_response.status(), StatusCode::OK);

    let device_response = request_json(
        &app,
        Method::POST,
        "/app/v3/api/oauth/device_authorizations",
        Body::from(json!({ "purpose": "login" }).to_string()),
    )
    .await;
    let device_body = read_json(device_response).await;
    let session_key = device_body["data"]["sessionKey"]
        .as_str()
        .expect("OAuth device authorization should include a session key");
    let poll_secret = device_body["data"]["pollSecret"]
        .as_str()
        .expect("OAuth device authorization should include a poll secret");

    let wrong_password_response = request_open_registration_json(
        &app,
        Method::POST,
        &format!("/app/v3/api/oauth/device_authorizations/{session_key}/password_completions"),
        Body::from(
            json!({
                "username": oauth_username,
                "password": "wrong-password"
            })
            .to_string(),
        ),
    )
    .await;

    assert_eq!(wrong_password_response.status(), StatusCode::UNAUTHORIZED);

    let missing_account_response = request_open_registration_json(
        &app,
        Method::POST,
        &format!("/app/v3/api/oauth/device_authorizations/{session_key}/password_completions"),
        Body::from(
            json!({
                "password": oauth_password
            })
            .to_string(),
        ),
    )
    .await;

    assert_eq!(missing_account_response.status(), StatusCode::BAD_REQUEST);
    let missing_account_body = read_json(missing_account_response).await;
    assert_eq!(missing_account_body["code"], "iam_login_account_required");

    let valid_password_response = request_open_registration_json(
        &app,
        Method::POST,
        &format!("/app/v3/api/oauth/device_authorizations/{session_key}/password_completions"),
        Body::from(
            json!({
                "username": oauth_username,
                "password": oauth_password
            })
            .to_string(),
        ),
    )
    .await;

    assert_eq!(valid_password_response.status(), StatusCode::OK);
    let valid_body = read_json(valid_password_response).await;
    assert_eq!(
        valid_body["data"]["status"],
        "login_context_selection_required"
    );
    assert_eq!(
        valid_body["data"]["challengeType"],
        "LOGIN_CONTEXT_SELECTION"
    );
    assert!(valid_body["data"]["session"].is_null());
    let continuation_token = valid_body["data"]["continuationToken"]
        .as_str()
        .expect("OAuth device authorization challenge should return a continuation token");

    let selection_response = request_open_registration_json(
        &app,
        Method::POST,
        "/app/v3/api/auth/sessions/login_context_selection",
        Body::from(
            json!({
                "continuationToken": continuation_token,
                "loginScope": "TENANT"
            })
            .to_string(),
        ),
    )
    .await;
    assert_eq!(selection_response.status(), StatusCode::OK);
    let selection_body = read_json(selection_response).await;
    assert_eq!(selection_body["data"]["user"]["username"], oauth_username);
    assert!(selection_body["data"]["authToken"].as_str().is_some());

    let completed_device_response = request_json(
        &app,
        Method::GET,
        &format!("/app/v3/api/oauth/device_authorizations/{session_key}"),
        Body::empty(),
    )
    .await;
    assert_eq!(completed_device_response.status(), StatusCode::OK);
    let completed_device_body = read_json(completed_device_response).await;
    assert_eq!(completed_device_body["data"]["status"], "completed");
    assert_eq!(completed_device_body["data"]["sessionReady"], true);

    let exchange_response = request_json(
        &app,
        Method::POST,
        &format!("/app/v3/api/oauth/device_authorizations/{session_key}/session_exchanges"),
        Body::from(json!({ "pollSecret": poll_secret }).to_string()),
    )
    .await;
    assert_eq!(exchange_response.status(), StatusCode::OK);
    let exchange_body = read_json(exchange_response).await;
    assert_eq!(exchange_body["data"]["user"]["username"], oauth_username);
    assert!(exchange_body["data"]["authToken"].as_str().is_some());
}

#[tokio::test]
async fn local_app_router_oauth_device_password_completion_requires_organization_selection_for_multi_membership_login(
) {
    let app = build_router_with_multiple_organizations().await;

    let device_response = request_json(
        &app,
        Method::POST,
        "/app/v3/api/oauth/device_authorizations",
        Body::from(json!({ "purpose": "login" }).to_string()),
    )
    .await;
    let device_body = read_json(device_response).await;
    let session_key = device_body["data"]["sessionKey"]
        .as_str()
        .expect("OAuth device authorization should include a session key");
    let poll_secret = device_body["data"]["pollSecret"]
        .as_str()
        .expect("OAuth device authorization should include a poll secret");

    let password_response = request_json(
        &app,
        Method::POST,
        &format!("/app/v3/api/oauth/device_authorizations/{session_key}/password_completions"),
        Body::from(
            json!({
                "username": CONFIGURED_BOOTSTRAP_USERNAME,
                "password": CONFIGURED_BOOTSTRAP_PASSWORD
            })
            .to_string(),
        ),
    )
    .await;

    assert_eq!(password_response.status(), StatusCode::OK);
    let password_body = read_json(password_response).await;
    assert_eq!(password_body["code"], "2000");
    assert_eq!(
        password_body["data"]["status"],
        "login_context_selection_required"
    );
    assert_eq!(
        password_body["data"]["challengeType"],
        "LOGIN_CONTEXT_SELECTION"
    );
    assert!(password_body["data"]["authToken"].is_null());
    assert!(password_body["data"]["accessToken"].is_null());
    assert!(password_body["data"]["session"].is_null());
    let continuation_token = password_body["data"]["continuationToken"]
        .as_str()
        .expect("OAuth device authorization challenge should return a continuation token");
    let organizations = password_body["data"]["organizations"]
        .as_array()
        .cloned()
        .expect("OAuth device authorization challenge should return organization choices");
    assert_eq!(organizations.len(), 2);

    let selection_response = request_json(
        &app,
        Method::POST,
        "/app/v3/api/auth/sessions/login_context_selection",
        Body::from(
            json!({
                "continuationToken": continuation_token,
                "loginScope": "ORGANIZATION",
                "organizationId": "org_secondary"
            })
            .to_string(),
        ),
    )
    .await;

    assert_eq!(selection_response.status(), StatusCode::OK);
    let selection_body = read_json(selection_response).await;
    assert_eq!(
        selection_body["data"]["context"]["organizationId"],
        "org_secondary"
    );
    assert!(selection_body["data"]["authToken"].as_str().is_some());

    let completed_device_response = request_json(
        &app,
        Method::GET,
        &format!("/app/v3/api/oauth/device_authorizations/{session_key}"),
        Body::empty(),
    )
    .await;

    assert_eq!(completed_device_response.status(), StatusCode::OK);
    let completed_device_body = read_json(completed_device_response).await;
    assert_eq!(completed_device_body["data"]["status"], "completed");
    assert_eq!(completed_device_body["data"]["sessionReady"], true);
    assert!(completed_device_body["data"]["session"].is_null());
    assert!(completed_device_body["data"]["authToken"].is_null());

    let exchange_response = request_json(
        &app,
        Method::POST,
        &format!("/app/v3/api/oauth/device_authorizations/{session_key}/session_exchanges"),
        Body::from(json!({ "pollSecret": poll_secret }).to_string()),
    )
    .await;
    assert_eq!(exchange_response.status(), StatusCode::OK);
    let exchange_body = read_json(exchange_response).await;
    assert_eq!(
        exchange_body["data"]["context"]["organizationId"],
        "org_secondary"
    );
    assert!(exchange_body["data"]["authToken"].as_str().is_some());

    let replay_exchange_response = request_json(
        &app,
        Method::POST,
        &format!("/app/v3/api/oauth/device_authorizations/{session_key}/session_exchanges"),
        Body::from(json!({ "pollSecret": poll_secret }).to_string()),
    )
    .await;
    assert_eq!(replay_exchange_response.status(), StatusCode::UNAUTHORIZED);
}

#[tokio::test]
async fn local_app_router_oauth_device_scan_requires_poll_secret() {
    let app = build_router_with_bootstrap().await;

    let device_response = request_json(
        &app,
        Method::POST,
        "/app/v3/api/oauth/device_authorizations",
        Body::from(json!({ "purpose": "login" }).to_string()),
    )
    .await;
    let device_body = read_json(device_response).await;
    let session_key = device_body["data"]["sessionKey"]
        .as_str()
        .expect("OAuth device authorization should include a session key");
    let poll_secret = device_body["data"]["pollSecret"]
        .as_str()
        .expect("OAuth device authorization should include a poll secret");

    let missing_secret_response = request_json(
        &app,
        Method::POST,
        &format!("/app/v3/api/oauth/device_authorizations/{session_key}/scans"),
        Body::from(json!({}).to_string()),
    )
    .await;
    assert_eq!(missing_secret_response.status(), StatusCode::BAD_REQUEST);
    let missing_secret_body = read_json(missing_secret_response).await;
    assert_eq!(missing_secret_body["code"], "iam_poll_secret_required");

    let invalid_secret_response = request_json(
        &app,
        Method::POST,
        &format!("/app/v3/api/oauth/device_authorizations/{session_key}/scans"),
        Body::from(json!({ "pollSecret": "invalid-secret" }).to_string()),
    )
    .await;
    assert_eq!(invalid_secret_response.status(), StatusCode::UNAUTHORIZED);
    let invalid_secret_body = read_json(invalid_secret_response).await;
    assert_eq!(invalid_secret_body["code"], "iam_poll_secret_invalid");

    let scan_response = request_json(
        &app,
        Method::POST,
        &format!("/app/v3/api/oauth/device_authorizations/{session_key}/scans"),
        Body::from(json!({ "pollSecret": poll_secret }).to_string()),
    )
    .await;
    assert_eq!(scan_response.status(), StatusCode::OK);
    let scan_body = read_json(scan_response).await;
    assert_eq!(scan_body["data"]["status"], "scanned");
}

#[tokio::test]
async fn local_app_router_locks_account_after_repeated_failed_logins() {
    let _guard = lock_local_iam_env();
    prepare_open_registration_database().await;
    unified_database_env::apply_unified_claw_postgres_env();
    let _snapshot = EnvSnapshot::capture(RUNTIME_ENV_KEYS);
    configure_real_local_runtime_env();
    set_optional_env("SDKWORK_IAM_LOGIN_MAX_ATTEMPTS", Some("3"));
    set_optional_env("SDKWORK_IAM_LOGIN_LOCKOUT_MINUTES", Some("15"));

    let app = sdkwork_routes_iam_app_api::build_sdkwork_iam_app_api_router()
        .await
        .expect("router should build");

    let username = unique_registration_username("lockout-user");
    let password = "LockoutTest#2026";
    let registration_response = request_open_registration_json(
        &app,
        Method::POST,
        "/app/v3/api/auth/registrations",
        Body::from(
            json!({
                "username": username,
                "password": password,
                "confirmPassword": password
            })
            .to_string(),
        ),
    )
    .await;
    assert_eq!(registration_response.status(), StatusCode::OK);
    let registration_body = read_json(registration_response).await;
    assert_ne!(
        registration_body["data"]["challengeType"].as_str(),
        Some("TENANT_SELECTION"),
        "open registration should provision the account when a single tenant is active"
    );

    for _ in 0..3 {
        let response = request_open_registration_json(
            &app,
            Method::POST,
            "/app/v3/api/auth/sessions",
            Body::from(
                json!({
                    "grantType": "password",
                    "username": username,
                    "password": "WrongPassword#2026"
                })
                .to_string(),
            ),
        )
        .await;
        assert_eq!(response.status(), StatusCode::UNAUTHORIZED);
    }

    let locked_response = request_open_registration_json(
        &app,
        Method::POST,
        "/app/v3/api/auth/sessions",
        Body::from(
            json!({
                "grantType": "password",
                "username": username,
                "password": password
            })
            .to_string(),
        ),
    )
    .await;
    assert_eq!(locked_response.status(), StatusCode::LOCKED);
    let locked_body = read_json(locked_response).await;
    assert_eq!(locked_body["code"], "iam_account_locked");
}

#[tokio::test]
async fn local_app_router_refresh_token_reuse_revokes_active_sessions() {
    let app = build_router_with_bootstrap().await;
    let login_data = create_bootstrap_login_session(&app).await;
    let auth_token = login_data["authToken"]
        .as_str()
        .expect("login should include auth token");
    let access_token = login_data["accessToken"]
        .as_str()
        .expect("login should include access token");
    let refresh_token = login_data["refreshToken"]
        .as_str()
        .expect("login should include refresh token");

    let refresh_response = request_json(
        &app,
        Method::POST,
        "/app/v3/api/auth/sessions/refresh",
        Body::from(json!({ "refreshToken": refresh_token }).to_string()),
    )
    .await;
    assert_eq!(refresh_response.status(), StatusCode::OK);
    let refresh_body = read_json(refresh_response).await;
    let rotated_auth_token = refresh_body["data"]["authToken"]
        .as_str()
        .expect("refresh should return auth token");
    let rotated_access_token = refresh_body["data"]["accessToken"]
        .as_str()
        .expect("refresh should return access token");

    let reuse_response = request_json(
        &app,
        Method::POST,
        "/app/v3/api/auth/sessions/refresh",
        Body::from(json!({ "refreshToken": refresh_token }).to_string()),
    )
    .await;
    assert_eq!(reuse_response.status(), StatusCode::UNAUTHORIZED);

    let rotated_session_response = request_json_with_auth(
        &app,
        Method::GET,
        "/app/v3/api/auth/sessions/current",
        Body::empty(),
        Some(rotated_auth_token),
        Some(rotated_access_token),
    )
    .await;
    assert_eq!(rotated_session_response.status(), StatusCode::UNAUTHORIZED);

    let original_session_response = request_json_with_auth(
        &app,
        Method::GET,
        "/app/v3/api/auth/sessions/current",
        Body::empty(),
        Some(auth_token),
        Some(access_token),
    )
    .await;
    assert_eq!(original_session_response.status(), StatusCode::UNAUTHORIZED);
}

#[tokio::test]
async fn local_app_router_current_session_rejects_inconsistent_login_scope_claims() {
    let app = build_router_with_bootstrap().await;
    let login_data = create_bootstrap_login_session(&app).await;
    let auth_token = login_data["authToken"]
        .as_str()
        .expect("login should include auth token");
    let access_token = login_data["accessToken"]
        .as_str()
        .expect("login should include access token");

    let mut inconsistent_access_payload = jwt_json_part(access_token, 1);
    inconsistent_access_payload["login_scope"] = json!("TENANT");
    let inconsistent_access_token =
        replace_jwt_payload_without_resigning(access_token, inconsistent_access_payload);

    let response = request_json_with_auth(
        &app,
        Method::GET,
        "/app/v3/api/auth/sessions/current",
        Body::empty(),
        Some(auth_token),
        Some(&inconsistent_access_token),
    )
    .await;

    assert_eq!(response.status(), StatusCode::UNAUTHORIZED);
}

const SECONDARY_TENANT_ID: &str = "tenant_secondary_login";
const TERTIARY_TENANT_ID: &str = "tenant_tertiary_login";

async fn postgres_pool_for_tests() -> sqlx::PgPool {
    unified_database_env::apply_unified_claw_postgres_env();
    let pool = sdkwork_database_sqlx::create_pool_from_env("IAM")
        .await
        .expect("create IAM pool for tests")
        .expect("IAM integration tests require PostgreSQL configuration");
    pool.as_postgres()
        .expect("IAM integration tests require PostgreSQL")
        .clone()
}

async fn prepare_open_registration_database() {
    const DEFAULT_OPEN_REGISTRATION_TENANT_ID: &str = "100001";
    let pg = postgres_pool_for_tests().await;
    cleanup_configured_tenant_integration_fixtures().await;
    cleanup_secondary_tenant_login_fixtures().await;
    let _ = sqlx::query(
        "UPDATE iam_tenant SET status = 'inactive', updated_at = CURRENT_TIMESTAMP \
         WHERE status = 'active' AND id <> $1",
    )
    .bind(DEFAULT_OPEN_REGISTRATION_TENANT_ID)
    .execute(&pg)
    .await;
    sdkwork_iam_bootstrap::upsert_postgres_default_subject(&pg)
        .await
        .expect("default IAM subject should be available for open registration tests");
    ensure_platform_tenant_application(&pg, DEFAULT_OPEN_REGISTRATION_TENANT_ID)
        .await
        .expect("platform tenant application should be available for open registration tests");
}

async fn cleanup_secondary_tenant_login_fixtures() {
    let pg = postgres_pool_for_tests().await;
    for tenant_id in [SECONDARY_TENANT_ID, TERTIARY_TENANT_ID] {
        let _ = sqlx::query("DELETE FROM iam_session WHERE tenant_id = $1")
            .bind(tenant_id)
            .execute(&pg)
            .await;
        let _ = sqlx::query("DELETE FROM iam_credential WHERE tenant_id = $1")
            .bind(tenant_id)
            .execute(&pg)
            .await;
        let _ = sqlx::query("DELETE FROM iam_tenant_member WHERE tenant_id = $1")
            .bind(tenant_id)
            .execute(&pg)
            .await;
        let _ = sqlx::query("DELETE FROM iam_user WHERE tenant_id = $1")
            .bind(tenant_id)
            .execute(&pg)
            .await;
        let _ = sqlx::query("DELETE FROM iam_tenant WHERE id = $1")
            .bind(tenant_id)
            .execute(&pg)
            .await;
    }
}

async fn cleanup_configured_tenant_integration_fixtures() {
    let pg = postgres_pool_for_tests().await;
    let tenant_id = CONFIGURED_TENANT_ID;
    for statement in [
        "DELETE FROM iam_session WHERE tenant_id = $1",
        "DELETE FROM iam_ephemeral_artifact WHERE tenant_id = $1",
        "DELETE FROM iam_security_event WHERE tenant_id = $1",
        "DELETE FROM iam_audit_event WHERE tenant_id = $1",
        "DELETE FROM iam_role_binding WHERE tenant_id = $1",
        "DELETE FROM iam_role_permission WHERE tenant_id = $1",
        "DELETE FROM iam_role WHERE tenant_id = $1",
        "DELETE FROM iam_position_assignment WHERE tenant_id = $1",
        "DELETE FROM iam_department_assignment WHERE tenant_id = $1",
        "DELETE FROM iam_organization_membership WHERE tenant_id = $1",
        "DELETE FROM iam_department WHERE tenant_id = $1",
        "DELETE FROM iam_position WHERE tenant_id = $1",
        "DELETE FROM iam_organization WHERE tenant_id = $1",
        "DELETE FROM iam_password_history WHERE tenant_id = $1",
        "DELETE FROM iam_credential WHERE tenant_id = $1",
        "DELETE FROM iam_tenant_member WHERE tenant_id = $1",
        "DELETE FROM iam_user WHERE tenant_id = $1",
        "DELETE FROM iam_tenant_signing_key WHERE tenant_id = $1",
        "DELETE FROM iam_tenant WHERE id = $1",
    ] {
        let _ = sqlx::query(statement).bind(tenant_id).execute(&pg).await;
    }
}

async fn seed_ephemeral_login_account(tenant_id: &str, username: &str, password: &str) {
    seed_login_account_for_tenant(tenant_id, username, username, password).await;
}

async fn seed_configured_owner_account_with_extra_organizations(
    extra_organizations: &[(&str, &str)],
) {
    seed_login_account_for_tenant(
        CONFIGURED_TENANT_ID,
        CONFIGURED_BOOTSTRAP_USERNAME,
        CONFIGURED_BOOTSTRAP_USERNAME,
        CONFIGURED_BOOTSTRAP_PASSWORD,
    )
    .await;
    seed_owner_directory_for_tenant(
        CONFIGURED_TENANT_ID,
        CONFIGURED_BOOTSTRAP_USERNAME,
        CONFIGURED_ORGANIZATION_ID,
        "Configured Organization",
        CONFIGURED_DEPARTMENT_ID,
        CONFIGURED_POSITION_ID,
        extra_organizations,
    )
    .await;
}

async fn seed_owner_directory_for_tenant(
    tenant_id: &str,
    username: &str,
    organization_id: &str,
    organization_name: &str,
    department_id: &str,
    position_id: &str,
    extra_organizations: &[(&str, &str)],
) {
    let pg = postgres_pool_for_tests().await;
    let now = chrono::Utc::now();
    let account_key = username.trim().to_ascii_lowercase();
    let user_id = sqlx::query_scalar::<_, String>(
        "SELECT id FROM iam_user WHERE tenant_id = $1 AND username = $2 LIMIT 1",
    )
    .bind(tenant_id)
    .bind(&account_key)
    .fetch_one(&pg)
    .await
    .expect("load seeded user id");

    for (org_id, org_name) in std::iter::once((organization_id, organization_name))
        .chain(extra_organizations.iter().copied())
    {
        sqlx::query(
            "INSERT INTO iam_organization (id, tenant_id, code, name, organization_kind, \
             tenant_boundary_kind, data_boundary_kind, app_boundary_enabled, verification_status, \
             path, status, created_at, updated_at) \
             VALUES ($1, $2, $3, $4, 'team', 'exclusive', 'tenant', 0, 'verified', $5, 'active', $6, $7) \
             ON CONFLICT (tenant_id, code) DO NOTHING",
        )
        .bind(org_id)
        .bind(tenant_id)
        .bind(org_id)
        .bind(org_name)
        .bind(format!("/{org_id}"))
        .bind(&now)
        .bind(&now)
        .execute(&pg)
        .await
        .expect("insert seeded organization");

        let membership_kind = if org_id == organization_id {
            "owner"
        } else {
            "member"
        };
        let is_primary = if org_id == organization_id {
            1_i16
        } else {
            0_i16
        };
        let membership_id = format!("iamom_{}_{}", org_id, user_id);
        sqlx::query(
            "INSERT INTO iam_organization_membership (id, tenant_id, organization_id, user_id, \
             membership_kind, is_primary, status, joined_at, created_at, updated_at) \
             VALUES ($1, $2, $3, $4, $5, $6, 'active', $7, $8, $9) \
             ON CONFLICT (tenant_id, organization_id, user_id, membership_kind) DO NOTHING",
        )
        .bind(&membership_id)
        .bind(tenant_id)
        .bind(org_id)
        .bind(&user_id)
        .bind(membership_kind)
        .bind(is_primary)
        .bind(&now)
        .bind(&now)
        .bind(&now)
        .execute(&pg)
        .await
        .expect("insert seeded organization membership");

        if org_id == organization_id {
            let role_id = format!("iamrole_owner_{tenant_id}");
            sqlx::query(
                "INSERT INTO iam_role (id, tenant_id, code, name, status, created_at, updated_at) \
                 VALUES ($1, $2, 'owner', 'Organization Owner', 'active', $3, $4) \
                 ON CONFLICT (tenant_id, code) DO NOTHING",
            )
            .bind(&role_id)
            .bind(tenant_id)
            .bind(&now)
            .bind(&now)
            .execute(&pg)
            .await
            .expect("insert owner role");

            let binding_id = format!("iamrb_{membership_id}");
            sqlx::query(
                "INSERT INTO iam_role_binding (id, tenant_id, organization_id, role_id, \
                 principal_kind, principal_id, scope_kind, scope_id, effect, status, created_at, updated_at) \
                 VALUES ($1, $2, $3, $4, 'organization_membership', $5, 'organization', $6, 'allow', \
                 'active', $7, $8) \
                 ON CONFLICT (tenant_id, role_id, principal_kind, principal_id, scope_kind, scope_id) DO NOTHING",
            )
            .bind(&binding_id)
            .bind(tenant_id)
            .bind(org_id)
            .bind(&role_id)
            .bind(&membership_id)
            .bind(org_id)
            .bind(&now)
            .bind(&now)
            .execute(&pg)
            .await
            .expect("insert owner role binding");

            for permission_code in [
                "iam.users.read",
                "iam.organizations.read",
                "iam.memberships.read",
                "iam.departments.read",
                "iam.assignments.read",
                "iam.positions.read",
                "iam.role_bindings.read",
            ] {
                let permission_id = match sqlx::query_scalar::<_, String>(
                    "SELECT id FROM iam_permission WHERE code = $1 LIMIT 1",
                )
                .bind(permission_code)
                .fetch_optional(&pg)
                .await
                .expect("load permission id")
                {
                    Some(existing_id) => existing_id,
                    None => {
                        let permission_id = format!("iamp_{permission_code}");
                        sqlx::query(
                            "INSERT INTO iam_permission (id, code, name, resource, action, created_at) \
                             VALUES ($1, $2, $3, $4, $5, $6)",
                        )
                        .bind(&permission_id)
                        .bind(permission_code)
                        .bind(permission_code)
                        .bind(permission_code)
                        .bind("read")
                        .bind(&now)
                        .execute(&pg)
                        .await
                        .expect("insert permission");
                        permission_id
                    }
                };
                sqlx::query(
                    "INSERT INTO iam_role_permission (id, tenant_id, role_id, permission_id, created_at) \
                     VALUES ($1, $2, $3, $4, $5) ON CONFLICT DO NOTHING",
                )
                .bind(format!("iamrp_{role_id}_{permission_id}"))
                .bind(tenant_id)
                .bind(&role_id)
                .bind(&permission_id)
                .bind(&now)
                .execute(&pg)
                .await
                .expect("insert role permission");
            }

            let dept_code = format!("{organization_id}/{department_id}");
            sqlx::query(
                "INSERT INTO iam_department (id, tenant_id, organization_id, code, name, department_kind, \
                 path, status, created_at, updated_at) \
                 VALUES ($1, $2, $3, $4, $5, 'general', $6, 'active', $7, $8) \
                 ON CONFLICT (tenant_id, organization_id, code) DO NOTHING",
            )
            .bind(department_id)
            .bind(tenant_id)
            .bind(organization_id)
            .bind(&dept_code)
            .bind("Configured Department")
            .bind(format!("/{organization_id}/{department_id}"))
            .bind(&now)
            .bind(&now)
            .execute(&pg)
            .await
            .expect("insert department");

            sqlx::query(
                "INSERT INTO iam_position (id, tenant_id, organization_id, code, name, position_kind, \
                 status, created_at, updated_at) \
                 VALUES ($1, $2, $3, $4, $5, 'member', 'active', $6, $7) \
                 ON CONFLICT (tenant_id, organization_id, code) DO NOTHING",
            )
            .bind(position_id)
            .bind(tenant_id)
            .bind(organization_id)
            .bind(position_id)
            .bind("Configured Position")
            .bind(&now)
            .bind(&now)
            .execute(&pg)
            .await
            .expect("insert position");

            let dept_assign_id = format!("iamda_{department_id}_{user_id}");
            sqlx::query(
                "INSERT INTO iam_department_assignment (id, tenant_id, organization_id, \
                 organization_membership_id, department_id, user_id, assignment_kind, is_primary, \
                 effective_from, status, created_at, updated_at) \
                 VALUES ($1, $2, $3, $4, $5, $6, 'primary', 1, $7, 'active', $8, $9) \
                 ON CONFLICT (tenant_id, organization_id, organization_membership_id, department_id, assignment_kind) DO NOTHING",
            )
            .bind(&dept_assign_id)
            .bind(tenant_id)
            .bind(organization_id)
            .bind(&membership_id)
            .bind(department_id)
            .bind(&user_id)
            .bind(&now)
            .bind(&now)
            .bind(&now)
            .execute(&pg)
            .await
            .expect("insert department assignment");

            let pos_assign_id = format!("iampa_{dept_assign_id}_{position_id}");
            sqlx::query(
                "INSERT INTO iam_position_assignment (id, tenant_id, organization_id, \
                 department_assignment_id, position_id, user_id, is_primary, effective_from, status, \
                 created_at, updated_at) \
                 VALUES ($1, $2, $3, $4, $5, $6, 1, $7, 'active', $8, $9) \
                 ON CONFLICT (tenant_id, organization_id, department_assignment_id, position_id) DO NOTHING",
            )
            .bind(&pos_assign_id)
            .bind(tenant_id)
            .bind(organization_id)
            .bind(&dept_assign_id)
            .bind(position_id)
            .bind(&user_id)
            .bind(&now)
            .bind(&now)
            .bind(&now)
            .execute(&pg)
            .await
            .expect("insert position assignment");
        }
    }
}

async fn seed_login_account_for_tenant(
    tenant_id: &str,
    email: &str,
    username: &str,
    password: &str,
) {
    use argon2::password_hash::{rand_core::OsRng, PasswordHasher, SaltString};
    use argon2::Argon2;

    let pg = postgres_pool_for_tests().await;
    ensure_platform_tenant_application(&pg, tenant_id)
        .await
        .expect("platform tenant application should be available for login tests");
    let password_hash = Argon2::default()
        .hash_password(password.as_bytes(), &SaltString::generate(&mut OsRng))
        .expect("hash password for tenant login seed")
        .to_string();
    let now = chrono::Utc::now();
    let account_key = username.trim().to_ascii_lowercase();
    let user_id = format!("iamu_{}", uuid::Uuid::now_v7());
    let member_id = format!("iamtm_{}", uuid::Uuid::now_v7());

    sqlx::query(
        "INSERT INTO iam_tenant (id, code, name, status, created_at, updated_at) \
         VALUES ($1, $2, $3, 'active', $4, $4) \
         ON CONFLICT (id) DO NOTHING",
    )
    .bind(tenant_id)
    .bind(tenant_id)
    .bind(format!("{tenant_id} tenant"))
    .bind(&now)
    .execute(&pg)
    .await
    .expect("insert tenant login tenant");

    sdkwork_iam_bootstrap::ensure_postgres_tenant_signing_key(pg, tenant_id)
        .await
        .expect("provision tenant login signing key");

    sqlx::query(
        "INSERT INTO iam_user (id, tenant_id, username, display_name, email, phone, \
                email_verified, phone_verified, status, created_at, updated_at) \
         VALUES ($1, $2, $3, $4, $5, NULL, 1, 0, 'active', $6, $6)",
    )
    .bind(&user_id)
    .bind(tenant_id)
    .bind(&account_key)
    .bind(&account_key)
    .bind(email)
    .bind(&now)
    .execute(&pg)
    .await
    .expect("insert tenant login user");

    sqlx::query(
        "INSERT INTO iam_credential (id, tenant_id, user_id, credential_type, credential_hash, \
                failed_attempts, status, created_at, updated_at) \
         VALUES ($1, $2, $3, 'password', $4, 0, 'active', $5, $5)",
    )
    .bind(format!("iamc_{}", uuid::Uuid::now_v7()))
    .bind(tenant_id)
    .bind(&user_id)
    .bind(&password_hash)
    .bind(&now)
    .execute(&pg)
    .await
    .expect("insert tenant login credential");

    sqlx::query(
        "INSERT INTO iam_tenant_member (id, tenant_id, user_id, member_kind, status, joined_at, created_at, updated_at) \
         VALUES ($1, $2, $3, 'member', 'active', $4, $4, $4)",
    )
    .bind(&member_id)
    .bind(tenant_id)
    .bind(&user_id)
    .bind(&now)
    .execute(&pg)
    .await
    .expect("insert tenant login member");
}

async fn seed_cross_tenant_login_account(email: &str, password: &str) {
    use argon2::password_hash::{rand_core::OsRng, PasswordHasher, SaltString};
    use argon2::Argon2;

    let pg = postgres_pool_for_tests().await;
    let password_hash = Argon2::default()
        .hash_password(password.as_bytes(), &SaltString::generate(&mut OsRng))
        .expect("hash password for cross-tenant seed")
        .to_string();
    let now = chrono::Utc::now();
    let account_key = email.trim().to_ascii_lowercase();

    for (tenant_id, tenant_name) in [
        (SECONDARY_TENANT_ID, "Secondary Login Tenant"),
        (TERTIARY_TENANT_ID, "Tertiary Login Tenant"),
    ] {
        let user_id = format!("iamu_{}", uuid::Uuid::now_v7());
        let member_id = format!("iamtm_{}", uuid::Uuid::now_v7());
        sqlx::query(
            "INSERT INTO iam_tenant (id, code, name, status, created_at, updated_at) \
             VALUES ($1, $2, $3, 'active', $4, $4) \
             ON CONFLICT (id) DO NOTHING",
        )
        .bind(tenant_id)
        .bind(tenant_id)
        .bind(tenant_name)
        .bind(&now)
        .execute(&pg)
        .await
        .expect("insert cross-tenant login tenant");

        sdkwork_iam_bootstrap::ensure_postgres_tenant_signing_key(&pg, tenant_id)
            .await
            .expect("provision cross-tenant login signing key");

        ensure_platform_tenant_application(&pg, tenant_id)
            .await
            .expect("platform tenant application should be available for cross-tenant login tests");

        sqlx::query(
            "INSERT INTO iam_user (id, tenant_id, username, display_name, email, phone, \
                    email_verified, phone_verified, status, created_at, updated_at) \
             VALUES ($1, $2, $3, $4, $5, NULL, 1, 0, 'active', $6, $6)",
        )
        .bind(&user_id)
        .bind(tenant_id)
        .bind(&account_key)
        .bind(&account_key)
        .bind(email)
        .bind(&now)
        .execute(&pg)
        .await
        .expect("insert cross-tenant login user");

        sqlx::query(
            "INSERT INTO iam_credential (id, tenant_id, user_id, credential_type, credential_hash, \
                    failed_attempts, status, created_at, updated_at) \
             VALUES ($1, $2, $3, 'password', $4, 0, 'active', $5, $5)",
        )
        .bind(format!("iamc_{}", uuid::Uuid::now_v7()))
        .bind(tenant_id)
        .bind(&user_id)
        .bind(&password_hash)
        .bind(&now)
        .execute(&pg)
        .await
        .expect("insert cross-tenant login credential");

        sqlx::query(
            "INSERT INTO iam_tenant_member (id, tenant_id, user_id, member_kind, status, joined_at, created_at, updated_at) \
             VALUES ($1, $2, $3, 'member', 'active', $4, $4, $4)",
        )
        .bind(&member_id)
        .bind(tenant_id)
        .bind(&user_id)
        .bind(&now)
        .execute(&pg)
        .await
        .expect("insert cross-tenant login member");
    }
}

#[tokio::test]
async fn local_app_router_open_registration_defaults_to_canonical_tenant_with_multiple_active_tenants(
) {
    const DEFAULT_OPEN_REGISTRATION_TENANT_ID: &str = "100001";
    cleanup_secondary_tenant_login_fixtures().await;
    let _guard = lock_local_iam_env();
    prepare_open_registration_database().await;
    unified_database_env::apply_unified_claw_postgres_env();
    let _snapshot = EnvSnapshot::capture(RUNTIME_ENV_KEYS);
    configure_real_local_runtime_env();
    let app = sdkwork_routes_iam_app_api::build_sdkwork_iam_app_api_router()
        .await
        .expect("router should build");
    let pg = postgres_pool_for_tests().await;
    let now = chrono::Utc::now();
    for (tenant_id, tenant_name) in [
        (SECONDARY_TENANT_ID, "Secondary Registration Tenant"),
        (TERTIARY_TENANT_ID, "Tertiary Registration Tenant"),
    ] {
        sqlx::query(
            "INSERT INTO iam_tenant (id, code, name, status, created_at, updated_at) \
             VALUES ($1, $2, $3, 'active', $4, $4) \
             ON CONFLICT (id) DO UPDATE SET status = 'active', name = EXCLUDED.name, updated_at = EXCLUDED.updated_at",
        )
        .bind(tenant_id)
        .bind(tenant_id)
        .bind(tenant_name)
        .bind(&now)
        .execute(&pg)
        .await
        .expect("insert open registration tenant");

        sdkwork_iam_bootstrap::ensure_postgres_tenant_signing_key(&pg, tenant_id)
            .await
            .expect("provision open registration tenant signing key");
    }

    let default_username = unique_registration_username("open-registration-default");
    let default_email = format!("{default_username}@sdkwork-iam.local");
    let password = "OpenRegistration#2026";

    let default_register_response = request_open_registration_json(
        &app,
        Method::POST,
        "/app/v3/api/auth/registrations",
        Body::from(
            json!({
                "username": default_email,
                "email": default_email,
                "password": password,
                "confirmPassword": password
            })
            .to_string(),
        ),
    )
    .await;
    assert_eq!(default_register_response.status(), StatusCode::OK);
    let default_register_body = read_json(default_register_response).await;
    assert_ne!(
        default_register_body["data"]["challengeType"].as_str(),
        Some("TENANT_SELECTION"),
        "open registration should default to the canonical tenant instead of tenant selection"
    );
    let default_session_data = complete_auth_session_data_with_access_token(
        &app,
        default_register_body["data"].clone(),
        "TENANT",
        None,
        test_open_registration_bootstrap_access_token().as_str(),
    )
    .await;
    assert_eq!(
        default_session_data["context"]["tenantId"],
        DEFAULT_OPEN_REGISTRATION_TENANT_ID
    );

    let invited_username = unique_registration_username("open-registration-invited");
    let invited_email = format!("{invited_username}@sdkwork-iam.local");
    let mismatched_register_response = request_open_registration_json(
        &app,
        Method::POST,
        "/app/v3/api/auth/registrations",
        Body::from(
            json!({
                "username": invited_email,
                "email": invited_email,
                "password": password,
                "confirmPassword": password,
                "tenantId": SECONDARY_TENANT_ID
            })
            .to_string(),
        ),
    )
    .await;
    assert_eq!(mismatched_register_response.status(), StatusCode::BAD_REQUEST);
    let mismatched_register_body = read_json(mismatched_register_response).await;
    assert_eq!(
        mismatched_register_body["code"],
        "iam_registration_tenant_unavailable"
    );

    let invited_register_response = request_json_with_auth(
        &app,
        Method::POST,
        "/app/v3/api/auth/registrations",
        Body::from(
            json!({
                "username": invited_email,
                "email": invited_email,
                "password": password,
                "confirmPassword": password
            })
            .to_string(),
        ),
        None,
        Some(
            bootstrap_access_token_jwt(
                SECONDARY_TENANT_ID,
                platform_runtime_app_id_for_tenant(SECONDARY_TENANT_ID).as_str(),
            )
            .as_str(),
        ),
    )
    .await;
    assert_eq!(invited_register_response.status(), StatusCode::OK);
    let invited_register_body = read_json(invited_register_response).await;
    let invited_session_data = complete_auth_session_data_with_access_token(
        &app,
        invited_register_body["data"].clone(),
        "TENANT",
        None,
        bootstrap_access_token_jwt(
            SECONDARY_TENANT_ID,
            platform_runtime_app_id_for_tenant(SECONDARY_TENANT_ID).as_str(),
        )
        .as_str(),
    )
    .await;
    assert_eq!(
        invited_session_data["context"]["tenantId"],
        SECONDARY_TENANT_ID
    );
    assert!(invited_session_data["authToken"].as_str().is_some());
}

#[tokio::test]
async fn local_app_router_rejects_cross_tenant_duplicate_account_without_bootstrap_tenant_match(
) {
    cleanup_secondary_tenant_login_fixtures().await;
    let app = build_router_with_bootstrap().await;
    let email = unique_registration_username("cross-tenant");
    let password = "CrossTenant#2026";
    seed_cross_tenant_login_account(&email, password).await;

    let login_response = request_json(
        &app,
        Method::POST,
        "/app/v3/api/auth/sessions",
        Body::from(
            json!({
                "grantType": "password",
                "username": email,
                "password": password
            })
            .to_string(),
        ),
    )
    .await;
    assert_eq!(login_response.status(), StatusCode::UNAUTHORIZED);
    let login_body = read_json(login_response).await;
    assert_eq!(login_body["code"], "iam_invalid_credentials");

    let scoped_login_response = request_json_with_auth(
        &app,
        Method::POST,
        "/app/v3/api/auth/sessions",
        Body::from(
            json!({
                "grantType": "password",
                "username": email,
                "password": password
            })
            .to_string(),
        ),
        None,
        Some(
            bootstrap_access_token_jwt(
                SECONDARY_TENANT_ID,
                platform_runtime_app_id_for_tenant(SECONDARY_TENANT_ID).as_str(),
            )
            .as_str(),
        ),
    )
    .await;
    assert_eq!(scoped_login_response.status(), StatusCode::OK);
    let scoped_login_body = read_json(scoped_login_response).await;
    assert_eq!(scoped_login_body["code"], "2000");
    assert_eq!(
        scoped_login_body["data"]["context"]["tenantId"],
        SECONDARY_TENANT_ID
    );
    assert!(scoped_login_body["data"]["authToken"].as_str().is_some());
}

#[tokio::test]
async fn local_app_router_current_session_resigns_refreshed_permission_scopes() {
    let app = build_router_for_open_registration().await;
    let username = unique_registration_username("scope-refresh");
    let email = format!("{username}@sdkwork-iam.local");
    let password = "ScopeRefresh#2026";

    let register_response = request_open_registration_json(
        &app,
        Method::POST,
        "/app/v3/api/auth/registrations",
        Body::from(
            json!({
                "username": email,
                "email": email,
                "password": password,
                "confirmPassword": password
            })
            .to_string(),
        ),
    )
    .await;
    assert_eq!(register_response.status(), StatusCode::OK);
    let register_body = read_json(register_response).await;
    let session_data = complete_auth_session_data_with_access_token(
        &app,
        register_body["data"].clone(),
        "TENANT",
        None,
        test_open_registration_bootstrap_access_token().as_str(),
    )
    .await;
    let auth_token = session_data["authToken"]
        .as_str()
        .expect("registration should include auth token");
    let access_token = session_data["accessToken"]
        .as_str()
        .expect("registration should include access token");
    let session_id = session_data["sessionId"]
        .as_str()
        .expect("registration should include session id");
    let user_id = session_data["user"]["id"]
        .as_str()
        .expect("registration should include user id");
    let tenant_id = session_data["context"]["tenantId"]
        .as_str()
        .or_else(|| session_data["user"]["tenantId"].as_str())
        .expect("registration should include tenant id");
    let stale_payload = jwt_json_part(access_token, 1);
    let permission_scopes = stale_payload["permission_scope"]
        .as_array()
        .expect("registration access token should include permission_scope");
    assert!(
        permission_scopes
            .iter()
            .any(|scope| scope.as_str() == Some("iam:self")),
        "registered member should include iam:self baseline scope: {permission_scopes:?}"
    );

    let pg = postgres_pool_for_tests().await;
    let now = chrono::Utc::now();
    let role_id = format!("iamr_{}", uuid::Uuid::now_v7());
    let role_permission_id = format!("iamrp_{}", uuid::Uuid::now_v7());
    let binding_id = format!("iamrb_{}", uuid::Uuid::now_v7());
    let permission_id = match sqlx::query_scalar::<_, String>(
        "SELECT id FROM iam_permission WHERE code = 'iam.users.read' LIMIT 1",
    )
    .fetch_optional(&pg)
    .await
    .expect("load users.read permission")
    {
        Some(existing_id) => existing_id,
        None => {
            let permission_id = format!("iamp_{}", uuid::Uuid::now_v7());
            sqlx::query(
                "INSERT INTO iam_permission (id, code, name, resource, action, created_at) \
                 VALUES ($1, 'iam.users.read', 'Read Users', 'users', 'read', $2)",
            )
            .bind(&permission_id)
            .bind(&now)
            .execute(&pg)
            .await
            .expect("insert users.read permission");
            permission_id
        }
    };
    sqlx::query(
        "INSERT INTO iam_role (id, tenant_id, code, name, status, created_at, updated_at) \
         VALUES ($1, $2, $3, 'Scope Refresh Reader', 'active', $4, $4)",
    )
    .bind(&role_id)
    .bind(tenant_id)
    .bind(format!("scope_refresh_reader_{role_id}"))
    .bind(&now)
    .execute(&pg)
    .await
    .expect("insert scope refresh role");
    sqlx::query(
        "INSERT INTO iam_role_permission (id, tenant_id, role_id, permission_id, created_at) \
         VALUES ($1, $2, $3, $4, $5)",
    )
    .bind(&role_permission_id)
    .bind(tenant_id)
    .bind(&role_id)
    .bind(&permission_id)
    .bind(&now)
    .execute(&pg)
    .await
    .expect("insert scope refresh role permission");
    sqlx::query(
        "INSERT INTO iam_role_binding (id, tenant_id, organization_id, role_id, principal_kind, principal_id, \
                scope_kind, scope_id, effect, status, created_at, updated_at) \
         VALUES ($1, $2, '0', $3, 'user', $4, 'tenant', $2, 'allow', 'active', $5, $5)",
    )
    .bind(&binding_id)
    .bind(tenant_id)
    .bind(&role_id)
    .bind(user_id)
    .bind(&now)
    .execute(&pg)
    .await
    .expect("bind scope refresh role to user");
    sqlx::query(
        "UPDATE iam_session SET permission_scope_json = $2, data_scope_json = $3 \
         WHERE id = $1 AND revoked_at IS NULL",
    )
    .bind(session_id)
    .bind(serde_json::json!(["iam:self"]))
    .bind(serde_json::json!([format!("tenant:{tenant_id}")]))
    .execute(&pg)
    .await
    .expect("stale session scopes for refresh test");

    let current_response = request_json_with_auth(
        &app,
        Method::GET,
        "/app/v3/api/auth/sessions/current",
        Body::empty(),
        Some(auth_token),
        Some(access_token),
    )
    .await;
    assert_eq!(current_response.status(), StatusCode::OK);
    let current_body = read_json(current_response).await;
    let refreshed_access_token = current_body["data"]["accessToken"]
        .as_str()
        .expect("current session should return refreshed access token");
    assert_ne!(refreshed_access_token, access_token);
    let refreshed_payload = jwt_json_part(refreshed_access_token, 1);
    let permission_scope = refreshed_payload["permission_scope"]
        .as_array()
        .expect("refreshed access token should include permission_scope");
    assert!(
        permission_scope
            .iter()
            .any(|scope| scope.as_str() == Some("iam.users.read")),
        "refreshed access token should restore live RBAC permission scopes"
    );
}

#[tokio::test]
async fn local_app_router_supports_current_user_contact_binding_and_unbind() {
    let _guard = lock_local_iam_env();
    let app = build_router_with_bootstrap_and_reset_code().await;
    let login_data = create_bootstrap_login_session(&app).await;
    let auth_token = login_data["authToken"].as_str().expect("auth token");
    let access_token = login_data["accessToken"].as_str().expect("access token");

    let current_response = request_json_with_auth(
        &app,
        Method::GET,
        "/app/v3/api/iam/users/current",
        Body::empty(),
        Some(auth_token),
        Some(access_token),
    )
    .await;
    assert_eq!(current_response.status(), StatusCode::OK);
    let current_body = read_json(current_response).await;
    assert_eq!(current_body["code"], "2000");
    assert!(current_body["data"]["emailVerified"].is_boolean());
    assert!(current_body["data"]["phoneVerified"].is_boolean());

    let bind_email_response = request_json_with_auth(
        &app,
        Method::POST,
        "/app/v3/api/iam/users/current/email_bindings",
        Body::from(
            json!({
                "email": "bound-user@sdkwork-iam.test",
                "verificationCode": CONFIGURED_RESET_CODE
            })
            .to_string(),
        ),
        Some(auth_token),
        Some(access_token),
    )
    .await;
    assert_eq!(bind_email_response.status(), StatusCode::OK);
    let bind_email_body = read_json(bind_email_response).await;
    assert_eq!(bind_email_body["code"], "2000");
    assert_eq!(
        bind_email_body["data"]["email"],
        "bound-user@sdkwork-iam.test"
    );
    assert_eq!(bind_email_body["data"]["emailVerified"], true);

    let bind_phone_response = request_json_with_auth(
        &app,
        Method::POST,
        "/app/v3/api/iam/users/current/phone_bindings",
        Body::from(
            json!({
                "phone": "13800138000",
                "verificationCode": CONFIGURED_RESET_CODE
            })
            .to_string(),
        ),
        Some(auth_token),
        Some(access_token),
    )
    .await;
    assert_eq!(bind_phone_response.status(), StatusCode::OK);
    let bind_phone_body = read_json(bind_phone_response).await;
    assert_eq!(bind_phone_body["code"], "2000");
    assert_eq!(bind_phone_body["data"]["phone"], "13800138000");
    assert_eq!(bind_phone_body["data"]["phoneVerified"], true);

    let change_email_response = request_json_with_auth(
        &app,
        Method::POST,
        "/app/v3/api/iam/users/current/email_bindings",
        Body::from(
            json!({
                "email": "rebound-user@sdkwork-iam.test",
                "verificationCode": CONFIGURED_RESET_CODE
            })
            .to_string(),
        ),
        Some(auth_token),
        Some(access_token),
    )
    .await;
    assert_eq!(change_email_response.status(), StatusCode::OK);
    let change_email_body = read_json(change_email_response).await;
    assert_eq!(
        change_email_body["data"]["email"],
        "rebound-user@sdkwork-iam.test"
    );

    let unbind_email_response = request_json_with_auth(
        &app,
        Method::DELETE,
        "/app/v3/api/iam/users/current/email_bindings",
        Body::from(json!({ "password": CONFIGURED_BOOTSTRAP_PASSWORD }).to_string()),
        Some(auth_token),
        Some(access_token),
    )
    .await;
    assert_eq!(unbind_email_response.status(), StatusCode::OK);
    let unbind_email_body = read_json(unbind_email_response).await;
    assert!(unbind_email_body["data"]["email"].is_null());
    assert_eq!(unbind_email_body["data"]["emailVerified"], false);
}
