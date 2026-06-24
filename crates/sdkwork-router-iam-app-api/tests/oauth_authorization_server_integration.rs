//! PostgreSQL integration coverage for SDKWork OAuth authorization-server flows.
//!
//! Run with `--test-threads 1` alongside other IAM app-api integration tests.

use axum::body::Body;
use axum::http::{Method, Request, StatusCode};
use base64::{engine::general_purpose::URL_SAFE_NO_PAD, Engine as _};
use http_body_util::BodyExt;
use sdkwork_iam_context_service::{AuthLevel, DeploymentMode, Environment, IamAppContext};
use sdkwork_iam_web_adapter::{
    build_userinfo_claims, complete_authorization_state, create_pending_authorization_state,
    exchange_authorization_code, load_oauth_bearer_scopes, parse_relying_party_config,
    platform_runtime_app_id_for_tenant, resolve_relying_party_client, revoke_oauth_token,
    seed_builtin_oauth_provider_catalog, validate_authorize_request, AuthorizeRequest,
    PLATFORM_APPLICATION_TEMPLATE_ID,
};
use sdkwork_web_core::bootstrap_access_token_jwt;
use serde_json::{json, Value};
use sha2::{Digest, Sha256};
use sqlx::PgPool;
use std::sync::{Mutex, MutexGuard, OnceLock};
use tower::ServiceExt;

#[path = "unified_database_env.rs"]
mod unified_database_env;

const OAUTH_E2E_TENANT_ID: &str = "tenant_oauth_pkce_e2e";
const OAUTH_E2E_CLIENT_APP_ID: &str = "app_oauth_partner_e2e";
const OAUTH_E2E_USERNAME: &str = "oauth-pkce-e2e@sdkwork-iam.test";
const OAUTH_E2E_PASSWORD: &str = "OAuthPkce#2026";
const OAUTH_E2E_REDIRECT_URI: &str = "https://partner.sdkwork.test/oauth/callback";
const SIGNING_MASTER_SECRET_ENV: &str = "SDKWORK_IAM_TENANT_SIGNING_MASTER_SECRET";

fn local_iam_env_lock() -> &'static Mutex<()> {
    static ENV_LOCK: OnceLock<Mutex<()>> = OnceLock::new();
    ENV_LOCK.get_or_init(|| Mutex::new(()))
}

fn lock_local_iam_env() -> MutexGuard<'static, ()> {
    local_iam_env_lock()
        .lock()
        .unwrap_or_else(|poisoned| poisoned.into_inner())
}

fn configure_integration_signing_env() {
    if std::env::var(SIGNING_MASTER_SECRET_ENV).is_err()
        && std::env::var("SDKWORK_CLAW_APP_SESSION_SECRET").is_err()
    {
        unsafe {
            std::env::set_var(
                SIGNING_MASTER_SECRET_ENV,
                "integration-test-signing-master-secret",
            );
        }
    }
    unsafe {
        std::env::set_var("SDKWORK_IAM_RATE_LIMIT_MAX_REQUESTS", "10000");
        std::env::set_var("SDKWORK_IAM_RATE_LIMIT_WINDOW_SECONDS", "60");
    }
}

async fn postgres_pool_for_tests() -> PgPool {
    unified_database_env::apply_unified_claw_postgres_env();
    let pool = sdkwork_database_sqlx::create_pool_from_env("IAM")
        .await
        .expect("create IAM pool for oauth integration tests")
        .expect("OAuth integration tests require PostgreSQL configuration");
    pool.as_postgres()
        .expect("OAuth integration tests require PostgreSQL")
        .clone()
}

async fn cleanup_oauth_e2e_fixtures() {
    let pg = postgres_pool_for_tests().await;
    for statement in [
        "DELETE FROM iam_oauth_callback_event WHERE tenant_id = $1",
        "DELETE FROM iam_oauth_grant WHERE tenant_id = $1",
        "DELETE FROM iam_oauth_authorization_state WHERE tenant_id = $1",
        "DELETE FROM iam_session WHERE tenant_id = $1",
        "DELETE FROM iam_credential WHERE tenant_id = $1",
        "DELETE FROM iam_tenant_member WHERE tenant_id = $1",
        "DELETE FROM iam_user WHERE tenant_id = $1",
        "DELETE FROM iam_tenant_signing_key WHERE tenant_id = $1",
        "DELETE FROM iam_tenant_application WHERE tenant_id = $1",
        "DELETE FROM iam_tenant WHERE id = $1",
    ] {
        let _ = sqlx::query(statement)
            .bind(OAUTH_E2E_TENANT_ID)
            .execute(&pg)
            .await;
    }
}

async fn seed_oauth_e2e_fixtures() {
    use argon2::password_hash::{rand_core::OsRng, PasswordHasher, SaltString};
    use argon2::Argon2;

    let pg = postgres_pool_for_tests().await;
    cleanup_oauth_e2e_fixtures().await;

    let now = chrono::Utc::now();
    let user_id = format!("iamu_{}", uuid::Uuid::now_v7());
    let member_id = format!("iamtm_{}", uuid::Uuid::now_v7());
    let password_hash = Argon2::default()
        .hash_password(OAUTH_E2E_PASSWORD.as_bytes(), &SaltString::generate(&mut OsRng))
        .expect("hash oauth e2e password")
        .to_string();
    let runtime_config = json!({
        "oauth": {
            "relyingParty": {
                "enabled": true,
                "redirectUris": [OAUTH_E2E_REDIRECT_URI],
                "allowedScopes": ["openid", "profile", "email"],
                "confidential": false
            }
        }
    });

    sqlx::query(
        "INSERT INTO iam_tenant (id, code, name, status, created_at, updated_at) \
         VALUES ($1, $2, $3, 'active', $4, $4)",
    )
    .bind(OAUTH_E2E_TENANT_ID)
    .bind(OAUTH_E2E_TENANT_ID)
    .bind("OAuth PKCE E2E Tenant")
    .bind(&now)
    .execute(&pg)
    .await
    .expect("insert oauth e2e tenant");

    sqlx::query(
        "INSERT INTO iam_user (id, tenant_id, username, display_name, email, phone, \
                email_verified, phone_verified, status, created_at, updated_at) \
         VALUES ($1, $2, $3, $4, $5, NULL, 1, 0, 'active', $6, $6)",
    )
    .bind(&user_id)
    .bind(OAUTH_E2E_TENANT_ID)
    .bind(OAUTH_E2E_USERNAME)
    .bind("OAuth PKCE E2E User")
    .bind(OAUTH_E2E_USERNAME)
    .bind(&now)
    .execute(&pg)
    .await
    .expect("insert oauth e2e user");

    sqlx::query(
        "INSERT INTO iam_credential (id, tenant_id, user_id, credential_type, credential_hash, \
                failed_attempts, status, created_at, updated_at) \
         VALUES ($1, $2, $3, 'password', $4, 0, 'active', $5, $5)",
    )
    .bind(format!("iamc_{}", uuid::Uuid::now_v7()))
    .bind(OAUTH_E2E_TENANT_ID)
    .bind(&user_id)
    .bind(&password_hash)
    .bind(&now)
    .execute(&pg)
    .await
    .expect("insert oauth e2e credential");

    sqlx::query(
        "INSERT INTO iam_tenant_member (id, tenant_id, user_id, member_kind, status, joined_at, created_at, updated_at) \
         VALUES ($1, $2, $3, 'member', 'active', $4, $4, $4)",
    )
    .bind(&member_id)
    .bind(OAUTH_E2E_TENANT_ID)
    .bind(&user_id)
    .bind(&now)
    .execute(&pg)
    .await
    .expect("insert oauth e2e tenant member");

    sdkwork_iam_web_adapter::ensure_platform_tenant_application(&pg, OAUTH_E2E_TENANT_ID)
        .await
        .expect("ensure platform tenant application for oauth e2e tenant");

    seed_builtin_oauth_provider_catalog(&pg)
        .await
        .expect("seed builtin oauth provider catalog for oauth e2e tenant");

    let catalog_count = sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(*) FROM iam_oauth_provider_catalog \
         WHERE owner_tenant_id = '0' AND provider_code = 'sdkwork' AND status = 'active'",
    )
    .fetch_one(&pg)
    .await
    .expect("count sdkwork oauth provider catalog row");
    assert_eq!(catalog_count, 1, "sdkwork provider catalog entry must exist");

    sqlx::query(
        "INSERT INTO iam_tenant_application (id, app_id, tenant_id, organization_id, template_id, \
         template_version, instance_key, display_name, environment, status, primary_domain, \
         domain_config_json, access_permissions_json, runtime_config_json, provisioned_at, activated_at, \
         created_at, updated_at) \
         VALUES ($1, $2, $3, '0', $4, '1.0.0', 'oauth-partner', 'OAuth Partner', 'prod', 'enabled', \
         'partner.sdkwork.test', '{}'::jsonb, '[\"iam.self\"]'::jsonb, $5::jsonb, $6, $6, $6, $6) \
         ON CONFLICT (id) DO UPDATE SET runtime_config_json = EXCLUDED.runtime_config_json, \
         status = 'enabled', updated_at = EXCLUDED.updated_at",
    )
    .bind(format!("tapp_{OAUTH_E2E_TENANT_ID}_oauth_partner"))
    .bind(OAUTH_E2E_CLIENT_APP_ID)
    .bind(OAUTH_E2E_TENANT_ID)
    .bind(PLATFORM_APPLICATION_TEMPLATE_ID)
    .bind(runtime_config.to_string())
    .bind(&now)
    .execute(&pg)
    .await
    .expect("insert oauth relying party tenant application");

    let parsed = parse_relying_party_config(&runtime_config);
    assert!(parsed.enabled, "oauth relying party fixture must be enabled");
}

async fn login_oauth_e2e_session(app: &axum::Router) -> Value {
    let access_token = bootstrap_access_token_jwt(
        OAUTH_E2E_TENANT_ID,
        platform_runtime_app_id_for_tenant(OAUTH_E2E_TENANT_ID).as_str(),
    );
    let response = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/app/v3/api/auth/sessions")
                .header("content-type", "application/json")
                .header("access-token", access_token)
                .body(Body::from(
                    json!({
                        "grantType": "password",
                        "username": OAUTH_E2E_USERNAME,
                        "password": OAUTH_E2E_PASSWORD
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .expect("oauth e2e login request");
    assert_eq!(response.status(), StatusCode::OK, "oauth e2e login failed");
    let body = read_json(response).await;
    assert_eq!(body["code"], "2000");
    body["data"].clone()
}

fn iam_context_from_login_data(data: &Value) -> IamAppContext {
    let context = &data["context"];
    IamAppContext::new(
        context["tenantId"].as_str().expect("tenantId"),
        context.get("organizationId").and_then(Value::as_str),
        context["userId"].as_str().expect("userId"),
        context["sessionId"].as_str().expect("sessionId"),
        context["appId"].as_str().expect("appId"),
        Environment::Prod,
        DeploymentMode::Saas,
        AuthLevel::Password,
        vec![],
        vec!["iam.self".to_string()],
    )
}

fn pkce_pair(verifier: &str) -> (String, String) {
    let challenge = URL_SAFE_NO_PAD.encode(Sha256::digest(verifier.as_bytes()));
    (verifier.to_string(), challenge)
}

async fn read_json(response: axum::response::Response) -> Value {
    let body = response.into_body().collect().await.unwrap().to_bytes();
    serde_json::from_slice(&body).expect("json response")
}

#[tokio::test]
async fn oauth_authorization_code_pkce_exchange_userinfo_and_revocation() {
    let _guard = lock_local_iam_env();
    configure_integration_signing_env();
    seed_oauth_e2e_fixtures().await;

    let app = sdkwork_router_iam_app_api::build_sdkwork_iam_app_api_router()
        .await
        .expect("oauth e2e router should build");
    let login_data = login_oauth_e2e_session(&app).await;
    let session = iam_context_from_login_data(&login_data);
    let pg = postgres_pool_for_tests().await;

    let client = resolve_relying_party_client(&pg, OAUTH_E2E_CLIENT_APP_ID, Some(OAUTH_E2E_TENANT_ID))
        .await
        .expect("resolve oauth relying party client");
    let (code_verifier, code_challenge) = pkce_pair("oauth-pkce-verifier-with-sufficient-length");
    let authorize_request = AuthorizeRequest {
        client_id: OAUTH_E2E_CLIENT_APP_ID.to_string(),
        redirect_uri: OAUTH_E2E_REDIRECT_URI.to_string(),
        response_type: "code".to_string(),
        scope: "openid profile email".to_string(),
        state: Some("oauth-e2e-state".to_string()),
        code_challenge: Some(code_challenge),
        code_challenge_method: Some("S256".to_string()),
        tenant_id: Some(OAUTH_E2E_TENANT_ID.to_string()),
    };
    let scopes = validate_authorize_request(&authorize_request, &client).expect("authorize request");
    let (authorization_state_id, _login_url) =
        create_pending_authorization_state(&pg, &client, &authorize_request, &scopes)
            .await
            .expect("create pending authorization state");

    let completion = complete_authorization_state(&pg, &authorization_state_id, &session)
        .await
        .expect("complete authorization state");
    assert!(completion.redirect_url.contains("code="));
    assert!(completion.redirect_url.contains("state=oauth-e2e-state"));

    let token_response = exchange_authorization_code(
        &pg,
        &client,
        &completion.authorization_code,
        OAUTH_E2E_REDIRECT_URI,
        Some(code_verifier.as_str()),
        None,
    )
    .await
    .expect("exchange authorization code");
    let access_token = token_response["access_token"]
        .as_str()
        .expect("access token");
    assert_eq!(token_response["token_type"], "Bearer");
    assert!(token_response.get("refresh_token").and_then(Value::as_str).is_some());

    let bearer = format!("Bearer {access_token}");
    let oauth_context =
        sdkwork_iam_web_adapter::resolve_iam_app_context_from_oauth_bearer(&pg, &bearer)
            .await
            .expect("oauth bearer should resolve to IAM context");
    assert_eq!(oauth_context.user_id, session.user_id);
    assert_eq!(oauth_context.tenant_id, session.tenant_id);

    let loaded_scopes = load_oauth_bearer_scopes(&pg, &bearer).await;
    assert!(loaded_scopes.iter().any(|scope| scope == "openid"));
    assert!(loaded_scopes.iter().any(|scope| scope == "email"));

    let userinfo = build_userinfo_claims(&pg, &session, &loaded_scopes)
        .await
        .expect("build userinfo claims");
    assert_eq!(userinfo["sub"], session.user_id);
    assert_eq!(userinfo["email"], OAUTH_E2E_USERNAME);
    assert!(userinfo.get("name").is_some());

    let profile_only = build_userinfo_claims(
        &pg,
        &session,
        &["openid".to_string(), "profile".to_string()],
    )
    .await
    .expect("build profile-only userinfo");
    assert!(profile_only.get("email").is_none());
    assert!(profile_only.get("name").is_some());

    revoke_oauth_token(
        &pg,
        access_token,
        Some(OAUTH_E2E_CLIENT_APP_ID),
        Some(OAUTH_E2E_TENANT_ID),
        None,
    )
    .await
    .expect("revoke oauth access token");

    let reused = exchange_authorization_code(
        &pg,
        &client,
        &completion.authorization_code,
        OAUTH_E2E_REDIRECT_URI,
        Some(code_verifier.as_str()),
        None,
    )
    .await;
    assert!(reused.is_err(), "authorization code must be one-time consumable");
}

#[tokio::test]
async fn oauth_open_api_http_token_and_userinfo_endpoints_exchange_pkce_flow() {
    let _guard = lock_local_iam_env();
    configure_integration_signing_env();
    seed_oauth_e2e_fixtures().await;

    let app = sdkwork_router_iam_app_api::build_sdkwork_iam_app_api_router()
        .await
        .expect("oauth e2e router should build");
    let login_data = login_oauth_e2e_session(&app).await;
    let session = iam_context_from_login_data(&login_data);
    let pg = postgres_pool_for_tests().await;

    let client = resolve_relying_party_client(&pg, OAUTH_E2E_CLIENT_APP_ID, Some(OAUTH_E2E_TENANT_ID))
        .await
        .expect("resolve oauth relying party client");
    let (code_verifier, code_challenge) = pkce_pair("oauth-pkce-verifier-with-sufficient-length");
    let authorize_request = AuthorizeRequest {
        client_id: OAUTH_E2E_CLIENT_APP_ID.to_string(),
        redirect_uri: OAUTH_E2E_REDIRECT_URI.to_string(),
        response_type: "code".to_string(),
        scope: "openid profile email".to_string(),
        state: Some("oauth-http-e2e".to_string()),
        code_challenge: Some(code_challenge),
        code_challenge_method: Some("S256".to_string()),
        tenant_id: Some(OAUTH_E2E_TENANT_ID.to_string()),
    };
    let scopes = validate_authorize_request(&authorize_request, &client).expect("authorize request");
    let (authorization_state_id, _) =
        create_pending_authorization_state(&pg, &client, &authorize_request, &scopes)
            .await
            .expect("create pending authorization state");
    let completion = complete_authorization_state(&pg, &authorization_state_id, &session)
        .await
        .expect("complete authorization state");

    let open_router =
        sdkwork_router_iam_open_api::build_sdkwork_iam_open_api_router_from_env().await;
    let token_response = open_router
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/iam/v3/api/oauth/token")
                .header("content-type", "application/json")
                .body(Body::from(
                    json!({
                        "grant_type": "authorization_code",
                        "client_id": OAUTH_E2E_CLIENT_APP_ID,
                        "code": completion.authorization_code,
                        "redirect_uri": OAUTH_E2E_REDIRECT_URI,
                        "code_verifier": code_verifier,
                        "tenant_id": OAUTH_E2E_TENANT_ID
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .expect("open-api token request");
    let token_status = token_response.status();
    let token_body = read_json(token_response).await;
    assert_eq!(token_status, StatusCode::OK, "token body: {token_body}");
    let access_token = token_body["access_token"]
        .as_str()
        .expect("open-api token response access_token");

    let userinfo_response = open_router
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/iam/v3/api/oauth/userinfo")
                .header("Authorization", format!("Bearer {access_token}"))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("open-api userinfo request");
    let userinfo_status = userinfo_response.status();
    let userinfo_body = read_json(userinfo_response).await;
    assert_eq!(userinfo_status, StatusCode::OK, "userinfo body: {userinfo_body}");
    assert_eq!(userinfo_body["sub"], session.user_id);
    assert_eq!(userinfo_body["email"], OAUTH_E2E_USERNAME);
}

#[tokio::test]
async fn oauth_public_client_token_exchange_rejects_invalid_pkce_verifier() {
    let _guard = lock_local_iam_env();
    configure_integration_signing_env();
    seed_oauth_e2e_fixtures().await;

    let app = sdkwork_router_iam_app_api::build_sdkwork_iam_app_api_router()
        .await
        .expect("oauth e2e router should build");
    let login_data = login_oauth_e2e_session(&app).await;
    let session = iam_context_from_login_data(&login_data);
    let pg = postgres_pool_for_tests().await;

    let client = resolve_relying_party_client(&pg, OAUTH_E2E_CLIENT_APP_ID, Some(OAUTH_E2E_TENANT_ID))
        .await
        .expect("resolve oauth relying party client");
    let (_code_verifier, code_challenge) = pkce_pair("oauth-pkce-verifier-with-sufficient-length");
    let authorize_request = AuthorizeRequest {
        client_id: OAUTH_E2E_CLIENT_APP_ID.to_string(),
        redirect_uri: OAUTH_E2E_REDIRECT_URI.to_string(),
        response_type: "code".to_string(),
        scope: "openid".to_string(),
        state: None,
        code_challenge: Some(code_challenge),
        code_challenge_method: Some("S256".to_string()),
        tenant_id: Some(OAUTH_E2E_TENANT_ID.to_string()),
    };
    let scopes = validate_authorize_request(&authorize_request, &client).expect("authorize request");
    let (authorization_state_id, _) =
        create_pending_authorization_state(&pg, &client, &authorize_request, &scopes)
            .await
            .expect("create pending authorization state");
    let completion = complete_authorization_state(&pg, &authorization_state_id, &session)
        .await
        .expect("complete authorization state");

    let err = exchange_authorization_code(
        &pg,
        &client,
        &completion.authorization_code,
        OAUTH_E2E_REDIRECT_URI,
        Some("wrong-pkce-verifier-with-sufficient-length"),
        None,
    )
    .await
    .expect_err("invalid pkce verifier must fail");
    assert!(err.contains("PKCE") || err.contains("pkce") || err.contains("verifier"));
}
