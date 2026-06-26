//! PostgreSQL integration coverage for SDKWork IAM backend-api management routes.
//!
//! Run with `--test-threads 1` alongside other IAM backend integration tests.

use axum::body::Body;
use axum::http::{Method, Request, StatusCode};
use http_body_util::BodyExt;
use sdkwork_iam_bootstrap::DEFAULT_IAM_TENANT_ID;
use sdkwork_routes_iam_backend_api::build_sdkwork_iam_backend_api_router_from_env;
use serde_json::Value;
use sqlx::{PgPool, Row};
use std::sync::{Mutex, MutexGuard, OnceLock};
use tower::ServiceExt;
use uuid::Uuid;

#[path = "unified_database_env.rs"]
mod unified_database_env;

#[path = "backend_postgres_bootstrap.rs"]
mod backend_postgres_bootstrap;

fn local_iam_env_lock() -> &'static Mutex<()> {
    static ENV_LOCK: OnceLock<Mutex<()>> = OnceLock::new();
    ENV_LOCK.get_or_init(|| Mutex::new(()))
}

fn lock_local_iam_env() -> MutexGuard<'static, ()> {
    local_iam_env_lock()
        .lock()
        .unwrap_or_else(|poisoned| poisoned.into_inner())
}

fn iam_postgres_url() -> Option<String> {
    unified_database_env::apply_unified_claw_postgres_env();
    std::env::var("SDKWORK_IAM_DATABASE_URL")
        .ok()
        .map(|value| value.trim().to_string())
        .filter(|value| !value.is_empty())
}

async fn connect_iam_postgres() -> PgPool {
    let database_url = iam_postgres_url().expect("IAM postgres URL must be configured for integration tests");
    sqlx::postgres::PgPoolOptions::new()
        .max_connections(2)
        .connect(&database_url)
        .await
        .expect("connect postgres for backend IAM integration tests")
}

#[tokio::test]
async fn backend_postgres_router_wires_database_pool_for_user_list() {
    let _guard = lock_local_iam_env();
    let Some(_database_url) = iam_postgres_url() else {
        eprintln!("SKIP backend_postgres_router_wires_database_pool_for_user_list: IAM postgres URL not configured");
        return;
    };

    unified_database_env::apply_unified_claw_postgres_env();
    let pg = connect_iam_postgres().await;
    sdkwork_iam_bootstrap::upsert_postgres_default_subject(&pg)
        .await
        .expect("seed default IAM tenant and organization");

    let router = build_sdkwork_iam_backend_api_router_from_env().await;
    let (status, body_text, _payload) = request_backend_route(router, Method::GET, "/backend/v3/api/iam/users", None).await;

    assert_ne!(
        StatusCode::SERVICE_UNAVAILABLE,
        status,
        "backend user list must not fail with missing postgres pool: {body_text}"
    );
    assert_eq!(
        StatusCode::UNAUTHORIZED,
        status,
        "backend user list must require authenticated principal when postgres is wired: {body_text}"
    );
    assert!(
        body_text.contains("iam_principal_required")
            || body_text.contains("missing-credentials")
            || body_text.contains("Unauthorized"),
        "backend user list must fail closed on missing principal: {body_text}"
    );
}

#[tokio::test]
async fn backend_postgres_user_list_query_reads_seeded_directory_rows() {
    let _guard = lock_local_iam_env();
    let Some(_database_url) = iam_postgres_url() else {
        eprintln!("SKIP backend_postgres_user_list_query_reads_seeded_directory_rows: IAM postgres URL not configured");
        return;
    };

    unified_database_env::apply_unified_claw_postgres_env();
    let pg = connect_iam_postgres().await;
    sdkwork_iam_bootstrap::upsert_postgres_default_subject(&pg)
        .await
        .expect("seed default IAM tenant and organization");

    let unique = Uuid::now_v7().to_string();
    let user_id = format!("iamu_{unique}");
    let username = format!("backend-integration-{unique}");

    sqlx::query(
        "INSERT INTO iam_user (id, tenant_id, username, display_name, email, status, is_deleted, created_at, updated_at) \
         VALUES ($1, $2, $3, $4, $5, 'active', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)",
    )
    .bind(&user_id)
    .bind(DEFAULT_IAM_TENANT_ID)
    .bind(&username)
    .bind("Backend Integration User")
    .bind(format!("{username}@sdkwork-iam.test"))
    .execute(&pg)
    .await
    .expect("insert integration test user");

    let rows = sqlx::query(
        "SELECT id, tenant_id, username, display_name, email, phone, status \
         FROM iam_user \
         WHERE tenant_id = $1 AND COALESCE(is_deleted, 0) = 0 AND username = $2 \
         LIMIT 1",
    )
    .bind(DEFAULT_IAM_TENANT_ID)
    .bind(&username)
    .fetch_all(&pg)
    .await
    .expect("query seeded backend user rows");

    assert_eq!(1, rows.len(), "seeded user must be readable through postgres directory query");
    assert_eq!(user_id, rows[0].get::<String, _>("id"));

    let _ = sqlx::query("DELETE FROM iam_user WHERE id = $1")
        .bind(&user_id)
        .execute(&pg)
        .await;
}

#[tokio::test]
async fn backend_postgres_authenticated_user_list_roundtrip() {
    use backend_postgres_bootstrap::{
        configure_backend_integration_runtime_env, integration_access_credential_request_body,
        seed_backend_integration_bootstrap_owner, INTEGRATION_BOOTSTRAP_EMAIL,
    };

    let _guard = lock_local_iam_env();
    let Some(_database_url) = iam_postgres_url() else {
        eprintln!("SKIP backend_postgres_authenticated_user_list_roundtrip: IAM postgres URL not configured");
        return;
    };

    unified_database_env::apply_unified_claw_postgres_env();
    configure_backend_integration_runtime_env();

    let pg = connect_iam_postgres().await;
    let seeded_user_id = seed_backend_integration_bootstrap_owner(&pg).await;

    let router = build_sdkwork_iam_backend_api_router_from_env().await;
    let credential_body = integration_access_credential_request_body();
    let (credential_status, credential_text, credential_payload) = request_backend_route(
        router.clone(),
        Method::POST,
        "/backend/v3/api/iam/access_credentials",
        Some(&credential_body),
    )
    .await;

    assert_eq!(
        StatusCode::OK,
        credential_status,
        "bootstrap access credential issuance must succeed: {credential_text}"
    );
    let access_token = credential_payload["data"]["accessToken"]
        .as_str()
        .or_else(|| credential_payload["data"]["accessCredential"].as_str())
        .expect("access credential response must include accessToken");
    let auth_token = credential_payload["data"]["authToken"]
        .as_str()
        .expect("access credential response must include authToken");

    let response = router
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/backend/v3/api/iam/users")
                .header("content-type", "application/json")
                .header("authorization", format!("Bearer {auth_token}"))
                .header("access-token", access_token)
                .body(Body::from(String::new()))
                .unwrap(),
        )
        .await
        .unwrap();
    let list_status = response.status();
    let bytes = response.into_body().collect().await.unwrap().to_bytes();
    let list_text = String::from_utf8(bytes.to_vec()).unwrap();
    let list_payload = serde_json::from_str(&list_text).unwrap_or(Value::Null);

    assert_eq!(
        StatusCode::OK,
        list_status,
        "authenticated backend user list must succeed: {list_text}"
    );
    assert_eq!(
        list_payload["code"], 0,
        "authenticated backend user list must return appbase success envelope: {list_text}"
    );

    let items = list_payload["data"]["items"]
        .as_array()
        .or_else(|| list_payload["data"]["records"].as_array())
        .or_else(|| list_payload["data"].as_array())
        .expect("authenticated backend user list must return page items");

    assert!(
        items.iter().any(|item| {
            item["id"].as_str() == Some(seeded_user_id.as_str())
                || item["email"].as_str() == Some(INTEGRATION_BOOTSTRAP_EMAIL)
        }),
        "authenticated backend user list must include seeded bootstrap owner: {list_text}"
    );
}

async fn request_backend_route(
    router: axum::Router,
    method: Method,
    path: &str,
    body: Option<&str>,
) -> (StatusCode, String, Value) {
    let response = router
        .oneshot(
            Request::builder()
                .method(method)
                .uri(path)
                .header("content-type", "application/json")
                .body(Body::from(body.unwrap_or_default().to_owned()))
                .unwrap(),
        )
        .await
        .unwrap();
    let status = response.status();
    let bytes = response.into_body().collect().await.unwrap().to_bytes();
    let body_text = String::from_utf8(bytes.to_vec()).unwrap();
    let payload = serde_json::from_str(&body_text).unwrap_or(Value::Null);
    (status, body_text, payload)
}
