//! IAM database session resolution for dual-token WebFramework integration.

use base64::{engine::general_purpose::URL_SAFE_NO_PAD, Engine as _};
use hmac::{Hmac, Mac};
use sdkwork_iam_context_service::{
    AuthLevel, DeploymentMode, Environment, IamAppContext, IamUserSurface, LoginScope,
};
use sdkwork_web_core::{validate_token_version_json, TokenVersionPolicy};
use serde_json::Value;
use sha2::{Digest, Sha256};
use sqlx::{types::Json, PgPool, Row};
use std::time::{SystemTime, UNIX_EPOCH};

type HmacSha256 = Hmac<Sha256>;

pub(crate) const IAM_SESSION_CONTEXT_SELECT: &str =
    "s.id, s.tenant_id, s.organization_id, s.login_scope, s.user_id, s.app_id, \
     s.environment, s.deployment_mode, s.auth_level, \
     s.data_scope_json, s.permission_scope_json, \
     COALESCE(u.display_name, '') AS user_display_name, \
     COALESCE(u.email, '') AS user_email, \
     COALESCE(u.email_verified, false) AS user_email_verified";

pub(crate) fn user_profile_from_session_row(row: &sqlx::postgres::PgRow) -> (String, String, bool) {
    let display_name: String = row.try_get(11).unwrap_or_default();
    let email: String = row.try_get(12).unwrap_or_default();
    let email_verified = row.try_get::<bool, _>(13).unwrap_or_else(|_| {
        row.try_get::<i32, _>(13)
            .map(|value| value != 0)
            .unwrap_or(false)
    });
    (display_name, email, email_verified)
}

pub async fn resolve_iam_app_context_from_auth_token(
    pg: &PgPool,
    raw_auth_token: &str,
) -> Option<IamAppContext> {
    let auth_token = strip_optional_bearer_prefix(raw_auth_token)?;
    find_iam_context_from_auth_token(pg, &auth_token).await
}

pub async fn resolve_iam_app_context_from_dual_tokens(
    pg: &PgPool,
    raw_auth_token: &str,
    raw_access_token: &str,
) -> Option<IamAppContext> {
    let auth_token = strip_optional_bearer_prefix(raw_auth_token)?;
    find_iam_context_from_dual_tokens(pg, &auth_token, raw_access_token.trim()).await
}

pub async fn resolve_iam_app_context_from_access_token(
    pg: &PgPool,
    raw_access_token: &str,
) -> Option<IamAppContext> {
    let access_token = strip_optional_bearer_prefix(raw_access_token)?;
    find_iam_context_from_access_token(pg, &access_token).await
}

/// Resolves IAM context from a single OAuth bearer token on open-api.
pub async fn resolve_iam_app_context_from_oauth_bearer(
    pg: &PgPool,
    raw_bearer_token: &str,
) -> Option<IamAppContext> {
    let token = strip_optional_bearer_prefix(raw_bearer_token)?;
    if let Some(context) = find_iam_context_from_access_token(pg, &token).await {
        return Some(context);
    }
    find_iam_context_from_oauth_jwt(pg, &token).await
}

async fn find_iam_context_from_dual_tokens(
    pg: &PgPool,
    auth_token: &str,
    access_token: &str,
) -> Option<IamAppContext> {
    if auth_token.is_empty() || access_token.is_empty() {
        return None;
    }
    let kid = jwt_header_kid(auth_token).or_else(|| jwt_header_kid(access_token))?;
    let signing_key = load_signing_key_by_kid(pg, &kid).await?;
    let now_unix = (current_millis() / 1000) as i64;
    let auth_claims = verify_local_session_token(&signing_key, auth_token, "auth", now_unix)?;
    let access_claims = verify_local_session_token(&signing_key, access_token, "access", now_unix)?;
    if !session_token_claims_match(&auth_claims, &access_claims) {
        return None;
    }

    let auth_hash = hash_token(auth_token);
    let access_hash = hash_token(access_token);

    let row = sqlx::query(&format!(
        "SELECT {IAM_SESSION_CONTEXT_SELECT} \
         FROM iam_session s \
         JOIN iam_user u ON u.id = s.user_id AND u.tenant_id = s.tenant_id \
         WHERE s.auth_token_hash = $1 AND s.access_token_hash = $2 \
           AND s.revoked_at IS NULL AND s.expires_at::timestamptz > $3::timestamptz \
           AND u.status = 'active' AND u.is_deleted = 0 \
         LIMIT 1"
    ))
    .bind(&auth_hash)
    .bind(&access_hash)
    .bind(current_timestamp_utc())
    .fetch_optional(pg)
    .await
    .ok()??;

    let context = iam_context_from_session_row(&row)?;
    if !session_claims_match_context(&auth_claims, &context)
        || !session_claims_match_context(&access_claims, &context)
        || !signing_key_matches_claims(&signing_key, &auth_claims)
    {
        return None;
    }
    Some(context)
}

async fn find_iam_context_from_auth_token(pg: &PgPool, auth_token: &str) -> Option<IamAppContext> {
    if auth_token.is_empty() {
        return None;
    }
    let auth_hash = hash_token(auth_token);
    let row = sqlx::query(&format!(
        "SELECT {IAM_SESSION_CONTEXT_SELECT} \
         FROM iam_session s \
         JOIN iam_user u ON u.id = s.user_id AND u.tenant_id = s.tenant_id \
         WHERE s.auth_token_hash = $1 \
           AND s.revoked_at IS NULL AND s.expires_at::timestamptz > $2::timestamptz \
           AND u.status = 'active' AND u.is_deleted = 0 \
         LIMIT 1"
    ))
    .bind(&auth_hash)
    .bind(current_timestamp_utc())
    .fetch_optional(pg)
    .await
    .ok()??;

    let context = iam_context_from_session_row(&row)?;
    if auth_token.contains('.') {
        let kid = jwt_header_kid(auth_token)?;
        let signing_key = load_signing_key_by_kid(pg, &kid).await?;
        let now_unix = (current_millis() / 1000) as i64;
        let claims = verify_local_session_token(&signing_key, auth_token, "auth", now_unix)?;
        if !session_claims_match_context(&claims, &context)
            || !signing_key_matches_claims(&signing_key, &claims)
        {
            return None;
        }
    }
    Some(context)
}

async fn find_iam_context_from_access_token(
    pg: &PgPool,
    access_token: &str,
) -> Option<IamAppContext> {
    if access_token.is_empty() {
        return None;
    }
    let access_hash = hash_token(access_token);
    let row = sqlx::query(&format!(
        "SELECT {IAM_SESSION_CONTEXT_SELECT} \
         FROM iam_session s \
         JOIN iam_user u ON u.id = s.user_id AND u.tenant_id = s.tenant_id \
         WHERE s.access_token_hash = $1 \
           AND s.revoked_at IS NULL AND s.expires_at::timestamptz > $2::timestamptz \
           AND u.status = 'active' AND u.is_deleted = 0 \
         LIMIT 1"
    ))
    .bind(&access_hash)
    .bind(current_timestamp_utc())
    .fetch_optional(pg)
    .await
    .ok()??;

    let context = iam_context_from_session_row(&row)?;
    if access_token.contains('.') {
        let kid = jwt_header_kid(access_token)?;
        let signing_key = load_signing_key_by_kid(pg, &kid).await?;
        let now_unix = (current_millis() / 1000) as i64;
        let claims = verify_local_session_token_flexible(
            &signing_key,
            access_token,
            &["access", "oauth", "oauth_access", "bearer"],
            now_unix,
        )?;
        if !session_claims_match_context(&claims, &context)
            || !signing_key_matches_claims(&signing_key, &claims)
        {
            return None;
        }
    }
    Some(context)
}

async fn find_iam_context_from_oauth_jwt(pg: &PgPool, token: &str) -> Option<IamAppContext> {
    if !token.contains('.') {
        return None;
    }
    let kid = jwt_header_kid(token)?;
    let signing_key = load_signing_key_by_kid(pg, &kid).await?;
    let now_unix = (current_millis() / 1000) as i64;
    let claims = verify_oauth_access_token_claims(&signing_key, token, now_unix)?;
    let context = iam_context_from_token_claims(&claims)?;
    if !oauth_jwt_session_is_active(pg, &context).await {
        return None;
    }
    if !oauth_access_token_grant_is_active(pg, &hash_token(token)).await {
        return None;
    }
    Some(context)
}

async fn oauth_access_token_grant_is_active(pg: &PgPool, access_token_hash: &str) -> bool {
    sqlx::query_scalar::<_, i32>(
        "SELECT 1 FROM iam_oauth_grant \
         WHERE access_token_hash = $1 AND status = 'active' \
           AND token_expires_at::timestamptz > $2::timestamptz \
         LIMIT 1",
    )
    .bind(access_token_hash)
    .bind(current_timestamp_utc())
    .fetch_optional(pg)
    .await
    .ok()
    .flatten()
    .is_some()
}

fn oauth_issuer_base_url() -> String {
    std::env::var("SDKWORK_IAM_OAUTH_ISSUER")
        .ok()
        .map(|value| value.trim().trim_end_matches('/').to_string())
        .filter(|value| !value.is_empty())
        .unwrap_or_else(|| "https://iam.sdkwork.local".to_string())
}

fn verify_oauth_access_token_claims(
    signing_key: &TenantSigningKey,
    token: &str,
    now_unix: i64,
) -> Option<Value> {
    let parts: Vec<&str> = token.split('.').collect();
    if parts.len() != 3 {
        return None;
    }
    let header = decode_jwt_json(parts[0])?;
    let payload = decode_jwt_json(parts[1])?;
    let kid = header.get("kid").and_then(Value::as_str)?;
    if kid != signing_key.kid {
        return None;
    }
    let signing_input = format!("{}.{}", parts[0], parts[1]);
    let mut mac = HmacSha256::new_from_slice(signing_key.secret.as_slice()).ok()?;
    mac.update(signing_input.as_bytes());
    let expected_signature = URL_SAFE_NO_PAD.encode(mac.finalize().into_bytes());
    if expected_signature != parts[2] {
        return None;
    }
    let token_type = payload.get("token_type").and_then(Value::as_str)?;
    if !token_type.eq_ignore_ascii_case("oauth") {
        return None;
    }
    let exp = payload.get("exp").and_then(Value::as_i64)?;
    if exp < now_unix {
        return None;
    }
    let iss = payload.get("iss").and_then(Value::as_str)?;
    if iss != oauth_issuer_base_url() {
        return None;
    }
    if claim_string_value(&payload, &["app_id"]).is_none() {
        return None;
    }
    if !claims_login_scope_organization_consistent(&payload) {
        return None;
    }
    if validate_token_version_json(&payload, &TokenVersionPolicy::standard()).is_err() {
        return None;
    }
    if !signing_key_matches_claims(signing_key, &payload) {
        return None;
    }
    Some(payload)
}

async fn oauth_jwt_session_is_active(pg: &PgPool, context: &IamAppContext) -> bool {
    if context.session_id.starts_with("oauth:") {
        return false;
    }
    sqlx::query_scalar::<_, i32>(
        "SELECT 1 FROM iam_session \
         WHERE id = $1 AND tenant_id = $2 AND revoked_at IS NULL \
           AND expires_at::timestamptz > $3::timestamptz \
         LIMIT 1",
    )
    .bind(&context.session_id)
    .bind(&context.tenant_id)
    .bind(current_timestamp_utc())
    .fetch_optional(pg)
    .await
    .ok()
    .flatten()
    .is_some()
}

fn iam_context_from_token_claims(claims: &Value) -> Option<IamAppContext> {
    let tenant_id = claim_string_value(claims, &["tenant_id"])?;
    let user_id = claim_string_value(claims, &["user_id", "sub"])?;
    let session_id = claim_string_value(claims, &["session_id", "sid", "jti"])
        .unwrap_or_else(|| format!("oauth:{user_id}"));
    let app_id = claim_string_value(claims, &["app_id"])?;
    let organization_id = claim_string_value(claims, &["organization_id"]);
    let login_scope = login_scope_from_string(
        claim_string_value(claims, &["login_scope"])
            .unwrap_or_else(|| "TENANT".to_owned())
            .as_str(),
    );
    let environment = environment_from_config(
        claim_string_value(claims, &["environment"])
            .unwrap_or_else(|| "prod".to_owned())
            .as_str(),
    );
    let deployment_mode = match claim_string_value(claims, &["deployment_mode"])
        .unwrap_or_else(|| "saas".to_owned())
        .to_ascii_lowercase()
        .as_str()
    {
        "local" => DeploymentMode::Local,
        "private" => DeploymentMode::Private,
        _ => DeploymentMode::Saas,
    };
    let auth_level = match claim_string_value(claims, &["auth_level"])
        .unwrap_or_else(|| "password".to_owned())
        .to_ascii_lowercase()
        .as_str()
    {
        "mfa" => AuthLevel::Mfa,
        "system" => AuthLevel::System,
        _ => AuthLevel::Password,
    };
    let data_scope = claims
        .get("data_scope")
        .and_then(json_value_to_string_vec)
        .unwrap_or_default();
    let permission_scope = claims
        .get("permission_scope")
        .and_then(json_value_to_string_vec)
        .unwrap_or_default();
    let normalized_organization_id = organization_id.and_then(|value| {
        if crate::is_blank(Some(value.as_str())) {
            None
        } else {
            Some(value.trim().to_owned())
        }
    });

    Some(IamAppContext {
        tenant_id,
        organization_id: normalized_organization_id.clone(),
        login_scope,
        user_id,
        session_id,
        app_id,
        environment,
        deployment_mode,
        auth_level,
        data_scope,
        permission_scope,
        user_surface: IamUserSurface {
            app: true,
            organization_member: normalized_organization_id.is_some(),
        },
        standard_role_codes: Vec::new(),
        display_name: claim_string_value(claims, &["display_name", "displayName", "name"])
            .unwrap_or_default(),
        email: claim_string_value(claims, &["email"]).unwrap_or_default(),
        email_verified: claims
            .get("email_verified")
            .or_else(|| claims.get("emailVerified"))
            .and_then(|value| value.as_bool())
            .unwrap_or(false),
    })
}

fn json_value_to_string_vec(value: &Value) -> Option<Vec<String>> {
    match value {
        Value::Array(items) => Some(
            items
                .iter()
                .filter_map(|item| item.as_str().map(str::to_owned))
                .collect(),
        ),
        Value::String(text) => Some(
            text.split(',')
                .map(str::trim)
                .filter(|part| !part.is_empty())
                .map(str::to_owned)
                .collect(),
        ),
        _ => None,
    }
}

fn verify_local_session_token_flexible(
    signing_key: &TenantSigningKey,
    token: &str,
    accepted_token_types: &[&str],
    now_unix: i64,
) -> Option<Value> {
    let parts: Vec<&str> = token.split('.').collect();
    if parts.len() != 3 {
        return None;
    }
    let header = decode_jwt_json(parts[0])?;
    let payload = decode_jwt_json(parts[1])?;
    let kid = header.get("kid").and_then(Value::as_str)?;
    if kid != signing_key.kid {
        return None;
    }
    let signing_input = format!("{}.{}", parts[0], parts[1]);
    let mut mac = HmacSha256::new_from_slice(signing_key.secret.as_slice()).ok()?;
    mac.update(signing_input.as_bytes());
    let expected_signature = URL_SAFE_NO_PAD.encode(mac.finalize().into_bytes());
    if expected_signature != parts[2] {
        return None;
    }
    let token_type = payload.get("token_type").and_then(Value::as_str)?;
    if !accepted_token_types
        .iter()
        .any(|candidate| token_type.eq_ignore_ascii_case(candidate))
    {
        return None;
    }
    let exp = payload.get("exp").and_then(Value::as_i64)?;
    if exp < now_unix {
        return None;
    }
    let iss = payload.get("iss").and_then(Value::as_str)?;
    if iss != "sdkwork-iam-local" {
        return None;
    }
    let aud = payload.get("aud").and_then(Value::as_str)?;
    let app_id = payload.get("app_id").and_then(Value::as_str)?;
    if aud != app_id {
        return None;
    }
    if !claims_login_scope_organization_consistent(&payload) {
        return None;
    }
    if validate_token_version_json(&payload, &TokenVersionPolicy::standard()).is_err() {
        return None;
    }
    if !signing_key_matches_claims(signing_key, &payload) {
        return None;
    }
    Some(payload)
}

struct TenantSigningKey {
    tenant_id: String,
    kid: String,
    secret: Vec<u8>,
}

fn iam_context_from_session_row(row: &sqlx::postgres::PgRow) -> Option<IamAppContext> {
    let session_id: String = row.get(0);
    let tenant_id: String = row.get(1);
    let organization_id: Option<String> = row.get(2);
    let login_scope: String = row.get(3);
    let user_id: String = row.get(4);
    let app_id: String = row.get(5);
    let environment: String = row.get(6);
    let deployment_mode: String = row.get(7);
    let auth_level: String = row.get(8);
    let data_scope = json_string_vec_from_row(row, 9);
    let permission_scope = json_string_vec_from_row(row, 10);
    let organization_member = organization_id.is_some();

    let (display_name, email, email_verified) = user_profile_from_session_row(row);

    Some(IamAppContext {
        tenant_id,
        organization_id,
        user_id,
        session_id,
        app_id,
        environment: environment_from_config(&environment),
        deployment_mode: match deployment_mode.as_str() {
            "local" => DeploymentMode::Local,
            "private" => DeploymentMode::Private,
            _ => DeploymentMode::Saas,
        },
        auth_level: match auth_level.as_str() {
            "password" => AuthLevel::Password,
            "mfa" => AuthLevel::Mfa,
            "system" => AuthLevel::System,
            _ => AuthLevel::Anonymous,
        },
        login_scope: login_scope_from_string(&login_scope),
        data_scope,
        permission_scope,
        user_surface: IamUserSurface {
            app: true,
            organization_member,
        },
        standard_role_codes: Vec::new(),
        display_name,
        email,
        email_verified,
    })
}

fn json_string_vec_from_row(row: &sqlx::postgres::PgRow, index: usize) -> Vec<String> {
    if let Ok(Json(value)) = row.try_get::<Json<Value>, _>(index) {
        return serde_json::from_value(value).unwrap_or_default();
    }
    if let Ok(text) = row.try_get::<String, _>(index) {
        return serde_json::from_str(&text).unwrap_or_default();
    }
    Vec::new()
}

pub(crate) fn hash_token(token: &str) -> String {
    let digest = Sha256::digest(token.as_bytes());
    format!("{:x}", digest)
}

fn strip_optional_bearer_prefix(value: &str) -> Option<String> {
    let trimmed = value.trim();
    if trimmed.is_empty() {
        return None;
    }
    let token = trimmed
        .strip_prefix("Bearer ")
        .or_else(|| trimmed.strip_prefix("bearer "))
        .unwrap_or(trimmed)
        .trim();
    if token.is_empty() {
        None
    } else {
        Some(token.to_owned())
    }
}

fn jwt_header_kid(token: &str) -> Option<String> {
    let header_part = token.split('.').next()?;
    let header = decode_jwt_json(header_part)?;
    header
        .get("kid")
        .and_then(Value::as_str)
        .map(str::to_string)
}

fn decode_jwt_json(part: &str) -> Option<Value> {
    let decoded = URL_SAFE_NO_PAD.decode(part).ok()?;
    serde_json::from_slice(&decoded).ok()
}

async fn load_signing_key_by_kid(pg: &PgPool, kid: &str) -> Option<TenantSigningKey> {
    sdkwork_iam_bootstrap::resolve_postgres_tenant_signing_key_by_kid(pg, kid)
        .await
        .ok()
        .flatten()
        .map(|material| TenantSigningKey {
            tenant_id: material.tenant_id,
            kid: material.kid,
            secret: material.secret,
        })
}

fn verify_local_session_token(
    signing_key: &TenantSigningKey,
    token: &str,
    expected_token_type: &str,
    now_unix: i64,
) -> Option<Value> {
    let parts: Vec<&str> = token.split('.').collect();
    if parts.len() != 3 {
        return None;
    }
    let header = decode_jwt_json(parts[0])?;
    let payload = decode_jwt_json(parts[1])?;
    let kid = header.get("kid").and_then(Value::as_str)?;
    if kid != signing_key.kid {
        return None;
    }
    let signing_input = format!("{}.{}", parts[0], parts[1]);
    let mut mac = HmacSha256::new_from_slice(signing_key.secret.as_slice()).ok()?;
    mac.update(signing_input.as_bytes());
    let expected_signature = URL_SAFE_NO_PAD.encode(mac.finalize().into_bytes());
    if expected_signature != parts[2] {
        return None;
    }
    let token_type = payload.get("token_type").and_then(Value::as_str)?;
    if !token_type.eq_ignore_ascii_case(expected_token_type) {
        return None;
    }
    let exp = payload.get("exp").and_then(Value::as_i64)?;
    if exp < now_unix {
        return None;
    }
    let iss = payload.get("iss").and_then(Value::as_str)?;
    if iss != "sdkwork-iam-local" {
        return None;
    }
    let aud = payload.get("aud").and_then(Value::as_str)?;
    let app_id = payload.get("app_id").and_then(Value::as_str)?;
    if aud != app_id {
        return None;
    }
    if !claims_login_scope_organization_consistent(&payload) {
        return None;
    }
    if validate_token_version_json(&payload, &TokenVersionPolicy::standard()).is_err() {
        return None;
    }
    Some(payload)
}

fn signing_key_matches_claims(signing_key: &TenantSigningKey, claims: &Value) -> bool {
    claims
        .get("tenant_id")
        .and_then(Value::as_str)
        .is_some_and(|tenant_id| tenant_id == signing_key.tenant_id)
}

fn claims_login_scope_organization_consistent(claims: &Value) -> bool {
    let login_scope = claims
        .get("login_scope")
        .and_then(Value::as_str)
        .map(|value| value.trim().to_ascii_uppercase())
        .unwrap_or_else(|| "TENANT".to_string());
    let organization_id = claims
        .get("organization_id")
        .and_then(Value::as_str)
        .unwrap_or("0");
    let has_organization = !crate::is_blank(Some(organization_id)) && organization_id != "0";
    match login_scope.as_str() {
        "ORGANIZATION" => has_organization,
        _ => !has_organization,
    }
}

fn claim_string_value(claims: &Value, keys: &[&str]) -> Option<String> {
    keys.iter()
        .find_map(|key| claims.get(*key).and_then(Value::as_str).map(str::to_string))
}

fn session_token_claims_match(auth_claims: &Value, access_claims: &Value) -> bool {
    for keys in [
        &["tenant_id"][..],
        &["user_id", "sub"][..],
        &["session_id", "sid"][..],
        &["organization_id"][..],
        &["login_scope"][..],
        &["app_id"][..],
    ] {
        if claim_string_value(auth_claims, keys) != claim_string_value(access_claims, keys) {
            return false;
        }
    }
    true
}

fn session_claims_match_context(claims: &Value, context: &IamAppContext) -> bool {
    let organization_id = context
        .organization_id
        .as_deref()
        .filter(|value| !crate::is_blank(Some(value)))
        .unwrap_or("0");
    claim_string_value(claims, &["tenant_id"]) == Some(context.tenant_id.clone())
        && claim_string_value(claims, &["user_id", "sub"]) == Some(context.user_id.clone())
        && claim_string_value(claims, &["session_id", "sid"]) == Some(context.session_id.clone())
        && claim_string_value(claims, &["app_id"]) == Some(context.app_id.clone())
        && claim_string_value(claims, &["login_scope"])
            == Some(login_scope_to_string(&context.login_scope).to_string())
        && claim_string_value(claims, &["organization_id"]) == Some(organization_id.to_string())
}

fn login_scope_to_string(login_scope: &LoginScope) -> &'static str {
    match login_scope {
        LoginScope::Tenant => "TENANT",
        LoginScope::Organization => "ORGANIZATION",
    }
}

fn login_scope_from_string(value: &str) -> LoginScope {
    match value.trim().to_ascii_uppercase().as_str() {
        "ORGANIZATION" => LoginScope::Organization,
        _ => LoginScope::Tenant,
    }
}

fn environment_from_config(environment: &str) -> Environment {
    match environment.trim().to_ascii_lowercase().as_str() {
        "prod" | "production" => Environment::Prod,
        "test" | "testing" => Environment::Test,
        _ => Environment::Dev,
    }
}

fn current_millis() -> u128 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|duration| duration.as_millis())
        .unwrap_or(0)
}

fn current_timestamp_utc() -> chrono::DateTime<chrono::Utc> {
    chrono::Utc::now()
}
