use argon2::{
    password_hash::{PasswordHash, PasswordVerifier},
    Argon2,
};
use base64::{engine::general_purpose::URL_SAFE_NO_PAD, Engine as _};
use hmac::{Hmac, Mac};
use rand_core::{OsRng, RngCore};
use sdkwork_iam_context_service::{AuthLevel, DeploymentMode, Environment, IamAppContext};
use sdkwork_web_core::stamp_token_version;
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use sha2::{Digest, Sha256};
use sqlx::{PgPool, Row};

type HmacSha256 = Hmac<Sha256>;

const SDKWORK_OAUTH_PROVIDER_CODE: &str = "sdkwork";
const AUTHORIZATION_CODE_TTL_SECONDS: i64 = 300;
const OAUTH_ACCESS_TOKEN_TTL_SECONDS: i64 = 3600;
const OAUTH_REFRESH_TOKEN_TTL_SECONDS: i64 = 60 * 60 * 24 * 30;

#[derive(Clone, Debug, Default, Deserialize, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct RelyingPartyConfig {
    #[serde(default)]
    pub enabled: bool,
    #[serde(default)]
    pub redirect_uris: Vec<String>,
    #[serde(default)]
    pub allowed_scopes: Vec<String>,
    #[serde(default)]
    pub confidential: bool,
    #[serde(default)]
    pub client_secret_hash: Option<String>,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct ResolvedRelyingParty {
    pub tenant_id: String,
    pub app_id: String,
    pub config: RelyingPartyConfig,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct AuthorizeRequest {
    pub client_id: String,
    pub redirect_uri: String,
    pub response_type: String,
    pub scope: String,
    pub state: Option<String>,
    pub code_challenge: Option<String>,
    pub code_challenge_method: Option<String>,
    pub tenant_id: Option<String>,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct AuthorizationCompletion {
    pub redirect_url: String,
    pub authorization_code: String,
}

pub fn oauth_issuer_base_url() -> String {
    std::env::var("SDKWORK_IAM_OAUTH_ISSUER")
        .ok()
        .map(|value| value.trim().trim_end_matches('/').to_string())
        .filter(|value| !value.is_empty())
        .unwrap_or_else(|| "https://iam.sdkwork.local".to_string())
}

pub fn oauth_login_base_url() -> String {
    std::env::var("SDKWORK_IAM_LOGIN_BASE_URL")
        .ok()
        .map(|value| value.trim().trim_end_matches('/').to_string())
        .filter(|value| !value.is_empty())
        .unwrap_or_else(|| "/auth".to_string())
}

pub fn build_openid_configuration_document() -> Value {
    let issuer = oauth_issuer_base_url();
    json!({
        "issuer": issuer,
        "authorization_endpoint": format!("{issuer}/iam/v3/oauth/authorize"),
        "token_endpoint": format!("{issuer}/iam/v3/oauth/token"),
        "userinfo_endpoint": format!("{issuer}/iam/v3/oauth/userinfo"),
        "revocation_endpoint": format!("{issuer}/iam/v3/oauth/revoke"),
        "introspection_endpoint": format!("{issuer}/iam/v3/oauth/introspect"),
        "jwks_uri": format!("{issuer}/iam/v3/oauth/jwks"),
        "response_types_supported": ["code"],
        "grant_types_supported": ["authorization_code", "refresh_token"],
        "token_endpoint_auth_methods_supported": ["client_secret_post", "client_secret_basic", "none"],
        "code_challenge_methods_supported": ["S256"],
        "scopes_supported": [
            "openid",
            "profile",
            "email",
            "phone",
            "tenant",
            "organization",
            "offline_access"
        ],
        "subject_types_supported": ["public"],
        "id_token_signing_alg_values_supported": ["HS256"]
    })
}

pub fn parse_relying_party_config(runtime_config: &Value) -> RelyingPartyConfig {
    runtime_config
        .pointer("/oauth/relyingParty")
        .and_then(|value| serde_json::from_value(value.clone()).ok())
        .unwrap_or_default()
}

pub async fn resolve_relying_party_client(
    pg: &PgPool,
    client_id: &str,
    tenant_hint: Option<&str>,
) -> Result<ResolvedRelyingParty, String> {
    let rows = if let Some(tenant_id) = tenant_hint.filter(|value| !value.is_empty()) {
        sqlx::query(
            "SELECT tenant_id, app_id, runtime_config_json \
             FROM iam_tenant_application \
             WHERE app_id = $1 AND tenant_id = $2 AND status = 'enabled' \
             LIMIT 1",
        )
        .bind(client_id)
        .bind(tenant_id)
        .fetch_all(pg)
        .await
    } else {
        sqlx::query(
            "SELECT tenant_id, app_id, runtime_config_json \
             FROM iam_tenant_application \
             WHERE app_id = $1 AND status = 'enabled'",
        )
        .bind(client_id)
        .fetch_all(pg)
        .await
    }
    .map_err(|error| format!("load relying party client failed: {error}"))?;

    if rows.is_empty() {
        return Err("OAuth client_id is not registered or enabled".to_string());
    }
    if rows.len() > 1 && tenant_hint.is_none() {
        return Err("OAuth tenant_id is required because client_id is not globally unique".to_string());
    }

    let row = &rows[0];
    let tenant_id: String = row.get(0);
    let app_id: String = row.get(1);
    let runtime_config = runtime_config_json_from_row(row, 2);
    let config = parse_relying_party_config(&runtime_config);
    if !config.enabled {
        return Err("OAuth relying party is disabled for this application".to_string());
    }

    Ok(ResolvedRelyingParty {
        tenant_id,
        app_id,
        config,
    })
}

pub fn validate_authorize_request(request: &AuthorizeRequest, client: &ResolvedRelyingParty) -> Result<Vec<String>, String> {
    if request.response_type != "code" {
        return Err("OAuth response_type must be code".to_string());
    }
    if !redirect_uri_allowed(&client.config.redirect_uris, &request.redirect_uri) {
        return Err("OAuth redirect_uri is not registered for this client".to_string());
    }

    let scopes = normalize_scopes(&request.scope);
    if scopes.is_empty() || !scopes.iter().any(|scope| scope == "openid") {
        return Err("OAuth scope must include openid".to_string());
    }
    for scope in &scopes {
        if !scope_allowed(&client.config.allowed_scopes, scope) {
            return Err(format!("OAuth scope {scope} is not allowed for this client"));
        }
    }

    if !client.config.confidential {
        let challenge = request
            .code_challenge
            .as_deref()
            .map(str::trim)
            .filter(|value| !value.is_empty())
            .ok_or_else(|| "OAuth code_challenge is required for public clients".to_string())?;
        let method = request
            .code_challenge_method
            .as_deref()
            .unwrap_or("plain");
        if method != "S256" {
            return Err("OAuth code_challenge_method must be S256".to_string());
        }
        if challenge.len() < 43 {
            return Err("OAuth code_challenge is invalid".to_string());
        }
    }

    Ok(scopes)
}

pub async fn create_pending_authorization_state(
    pg: &PgPool,
    client: &ResolvedRelyingParty,
    request: &AuthorizeRequest,
    scopes: &[String],
) -> Result<(String, String), String> {
    let state_id = generate_opaque_token("oauth_state");
    let now = chrono::Utc::now();
    let expires_at = now + chrono::Duration::seconds(AUTHORIZATION_CODE_TTL_SECONDS);
    let requested_scopes_json =
        serde_json::to_string(scopes).map_err(|error| format!("serialize scopes failed: {error}"))?;

    sqlx::query(
        "INSERT INTO iam_oauth_authorization_state (\
            id, uuid, tenant_id, organization_id, app_id, environment, provider_code, \
            integration_id, oauth_client_id, surface_id, surface_kind, flow_kind, state_hash, \
            nonce_hash, pkce_challenge, pkce_challenge_method, redirect_uri, redirect_uri_hash, \
            requested_scopes_json, return_path, status, expires_at, created_at\
         ) VALUES ($1, $2, $3, '0', $4, 'prod', $5, $6, $7, NULL, 'web', 'authorization_code', \
                   $8, NULL, $9, $10, $11, $12, $13, $14, 'pending', $15, $16)",
    )
    .bind(&state_id)
    .bind(uuid::Uuid::now_v7().to_string())
    .bind(&client.tenant_id)
    .bind(&client.app_id)
    .bind(SDKWORK_OAUTH_PROVIDER_CODE)
    .bind(format!("integration:{}:{}", client.tenant_id, SDKWORK_OAUTH_PROVIDER_CODE))
    .bind(&client.app_id)
    .bind(
        request
            .state
            .as_deref()
            .map(hash_value)
            .unwrap_or_default(),
    )
    .bind(request.code_challenge.as_deref().unwrap_or(""))
    .bind(request.code_challenge_method.as_deref().unwrap_or("S256"))
    .bind(&request.redirect_uri)
    .bind(hash_value(&request.redirect_uri))
    .bind(&requested_scopes_json)
    .bind(build_return_path(request.state.as_deref()))
    .bind(expires_at.to_rfc3339())
    .bind(now.to_rfc3339())
    .execute(pg)
    .await
    .map_err(|error| format!("create oauth authorization state failed: {error}"))?;

    let login_url = format!(
        "{}/login?oauthAuthorizationStateId={}",
        oauth_login_base_url(),
        urlencoding::encode(&state_id)
    );
    Ok((state_id, login_url))
}

pub async fn complete_authorization_state(
    pg: &PgPool,
    authorization_state_id: &str,
    session: &IamAppContext,
) -> Result<AuthorizationCompletion, String> {
    let row = sqlx::query(
        "SELECT tenant_id, app_id, redirect_uri, requested_scopes_json, pkce_challenge, \
                pkce_challenge_method, status, return_path, expires_at::timestamptz \
         FROM iam_oauth_authorization_state \
         WHERE id = $1 \
         LIMIT 1",
    )
    .bind(authorization_state_id)
    .fetch_optional(pg)
    .await
    .map_err(|error| format!("load oauth authorization state failed: {error}"))?
    .ok_or_else(|| "OAuth authorization state was not found".to_string())?;

    let tenant_id: String = row.get(0);
    let client_app_id: String = row.get(1);
    let redirect_uri: String = row.get(2);
    let status: String = row.get(6);
    let return_path: String = row.get(7);
    let expires_at: chrono::DateTime<chrono::Utc> = row.get(8);

    if status != "pending" {
        return Err("OAuth authorization state is no longer pending".to_string());
    }
    if expires_at <= chrono::Utc::now() {
        return Err("OAuth authorization state has expired".to_string());
    }
    if tenant_id != session.tenant_id {
        return Err("OAuth authorization tenant does not match the authenticated session".to_string());
    }

    let authorization_code = generate_opaque_token("oauth_code");
    let code_hash = hash_value(&authorization_code);
    let now = chrono::Utc::now();
    let scopes_json: String = row.get(3);

    let grant_id = generate_opaque_token("oauth_grant");
    sqlx::query(
        "INSERT INTO iam_oauth_grant (\
            id, uuid, tenant_id, organization_id, grant_owner_kind, user_id, provider_code, \
            integration_id, oauth_client_id, surface_id, flow_kind, authorized_scopes_json, \
            access_token_hash, refresh_token_hash, token_expires_at, refresh_token_expires_at, \
            issued_at, status, created_at, updated_at\
         ) VALUES ($1, $2, $3, $4, 'user', $5, $6, $7, $8, NULL, 'authorization_code', $9, \
                   NULL, NULL, NULL, NULL, $10, 'pending', $10, $10)",
    )
    .bind(&grant_id)
    .bind(uuid::Uuid::now_v7().to_string())
    .bind(&tenant_id)
    .bind(session.organization_id.as_deref().unwrap_or("0"))
    .bind(&session.user_id)
    .bind(SDKWORK_OAUTH_PROVIDER_CODE)
    .bind(format!("integration:{}:{}", tenant_id, SDKWORK_OAUTH_PROVIDER_CODE))
    .bind(&client_app_id)
    .bind(&scopes_json)
    .bind(now.to_rfc3339())
    .execute(pg)
    .await
    .map_err(|error| format!("create oauth grant failed: {error}"))?;

    sqlx::query(
        "UPDATE iam_oauth_authorization_state \
         SET status = 'approved', nonce_hash = $2, return_path = $3, consumed_at = NULL \
         WHERE id = $1 AND status = 'pending'",
    )
    .bind(authorization_state_id)
    .bind(&code_hash)
    .bind(compose_grant_return_path(&return_path, &grant_id))
    .execute(pg)
    .await
    .map_err(|error| format!("approve oauth authorization state failed: {error}"))?;

    let mut redirect_url = format!(
        "{redirect_uri}?code={}",
        urlencoding::encode(&authorization_code)
    );
    if let Some(state) = parse_oauth_state_from_return_path(&return_path) {
        redirect_url.push_str("&state=");
        redirect_url.push_str(&urlencoding::encode(&state));
    }

    Ok(AuthorizationCompletion {
        redirect_url,
        authorization_code,
    })
}

pub async fn exchange_authorization_code(
    pg: &PgPool,
    client: &ResolvedRelyingParty,
    code: &str,
    redirect_uri: &str,
    code_verifier: Option<&str>,
    client_secret: Option<&str>,
) -> Result<Value, String> {
    if client.config.confidential {
        verify_client_secret(client, client_secret)?;
    }

    let code_hash = hash_value(code);
    let row = sqlx::query(
        "SELECT id, tenant_id, redirect_uri, pkce_challenge, pkce_challenge_method, \
                requested_scopes_json, return_path \
         FROM iam_oauth_authorization_state \
         WHERE nonce_hash = $1 AND provider_code = $2 AND status = 'approved' \
         LIMIT 1",
    )
    .bind(&code_hash)
    .bind(SDKWORK_OAUTH_PROVIDER_CODE)
    .fetch_optional(pg)
    .await
    .map_err(|error| format!("load oauth authorization code failed: {error}"))?
    .ok_or_else(|| "OAuth authorization code is invalid".to_string())?;

    let state_id: String = row.get(0);
    let tenant_id: String = row.get(1);
    let stored_redirect_uri: String = row.get(2);
    let pkce_challenge: String = row.get(3);
    let pkce_method: String = row.get(4);
    let scopes_json: String = row.get(5);
    let return_path: String = row.get(6);
    let grant_id = parse_grant_id_from_return_path(&return_path)
        .ok_or_else(|| "OAuth authorization grant reference is missing".to_string())?;
    let user_id: String = sqlx::query_scalar(
        "SELECT user_id FROM iam_oauth_grant WHERE id = $1 LIMIT 1",
    )
    .bind(&grant_id)
    .fetch_optional(pg)
    .await
    .map_err(|error| format!("load oauth grant owner failed: {error}"))?
    .ok_or_else(|| "OAuth authorization grant was not found".to_string())?;

    if stored_redirect_uri != redirect_uri {
        return Err("OAuth redirect_uri does not match the authorization request".to_string());
    }
    if !client.config.confidential {
        validate_pkce(code_verifier, &pkce_challenge, &pkce_method)?;
    }

    let session_row = sqlx::query(
        "SELECT s.id, s.tenant_id, s.organization_id, s.login_scope, s.user_id, s.app_id, \
                s.environment, s.deployment_mode, s.auth_level, s.data_scope_json, s.permission_scope_json \
         FROM iam_session s \
         JOIN iam_user u ON u.id = s.user_id AND u.tenant_id = s.tenant_id \
         WHERE s.tenant_id = $1 AND s.user_id = $2 AND s.revoked_at IS NULL \
           AND s.expires_at::timestamptz > $3::timestamptz \
           AND u.status = 'active' AND u.is_deleted = 0 \
         ORDER BY s.updated_at DESC \
         LIMIT 1",
    )
    .bind(&tenant_id)
    .bind(&user_id)
    .bind(chrono::Utc::now().to_rfc3339())
    .fetch_optional(pg)
    .await
    .map_err(|error| format!("load oauth session for token issue failed: {error}"))?;

    let context = if let Some(session_row) = session_row {
        iam_context_from_session_row(&session_row)?
    } else {
        return Err("OAuth authorization code cannot be exchanged without an active IAM session".to_string());
    };

    let access_token = sign_oauth_access_token(pg, &context, &client.app_id).await?;
    let refresh_token = generate_opaque_token("oauth_refresh");
    let refresh_hash = hash_value(&refresh_token);
    let access_hash = hash_value(&access_token);
    let now = chrono::Utc::now();
    let access_expires = now + chrono::Duration::seconds(OAUTH_ACCESS_TOKEN_TTL_SECONDS);
    let refresh_expires = now + chrono::Duration::seconds(OAUTH_REFRESH_TOKEN_TTL_SECONDS);

    sqlx::query(
        "UPDATE iam_oauth_grant \
         SET access_token_hash = $2, refresh_token_hash = $3, token_expires_at = $4, \
             refresh_token_expires_at = $5, issued_at = $6, status = 'active', updated_at = $6 \
         WHERE id = $1 AND status IN ('pending', 'active')",
    )
    .bind(&grant_id)
    .bind(&access_hash)
    .bind(&refresh_hash)
    .bind(access_expires.to_rfc3339())
    .bind(refresh_expires.to_rfc3339())
    .bind(now.to_rfc3339())
    .execute(pg)
    .await
    .map_err(|error| format!("update oauth grant tokens failed: {error}"))?;

    sqlx::query(
        "UPDATE iam_oauth_authorization_state SET status = 'consumed', consumed_at = $2 WHERE id = $1",
    )
    .bind(&state_id)
    .bind(now.to_rfc3339())
    .execute(pg)
    .await
    .map_err(|error| format!("finalize oauth authorization code failed: {error}"))?;

    Ok(json!({
        "access_token": access_token,
        "token_type": "Bearer",
        "expires_in": OAUTH_ACCESS_TOKEN_TTL_SECONDS,
        "refresh_token": refresh_token,
        "scope": parse_scope_json(&scopes_json).join(" "),
    }))
}

pub async fn exchange_refresh_token(
    pg: &PgPool,
    client: &ResolvedRelyingParty,
    refresh_token: &str,
    client_secret: Option<&str>,
) -> Result<Value, String> {
    if client.config.confidential {
        verify_client_secret(client, client_secret)?;
    }

    let refresh_hash = hash_value(refresh_token);
    let row = sqlx::query(
        "SELECT id, tenant_id, organization_id, user_id, oauth_client_id, authorized_scopes_json, \
                refresh_token_expires_at, status \
         FROM iam_oauth_grant \
         WHERE refresh_token_hash = $1 AND provider_code = $2 \
         LIMIT 1",
    )
    .bind(&refresh_hash)
    .bind(SDKWORK_OAUTH_PROVIDER_CODE)
    .fetch_optional(pg)
    .await
    .map_err(|error| format!("load oauth refresh grant failed: {error}"))?
    .ok_or_else(|| "OAuth refresh token is invalid".to_string())?;

    let grant_id: String = row.get(0);
    let tenant_id: String = row.get(1);
    let _organization_id: String = row.get(2);
    let user_id: String = row.get(3);
    let oauth_client_id: String = row.get(4);
    let scopes_json: String = row.get(5);
    let refresh_expires_at: Option<String> = row.get(6);
    let status: String = row.get(7);

    if status != "active" {
        return Err("OAuth refresh token is revoked".to_string());
    }
    if oauth_client_id != client.app_id {
        return Err("OAuth refresh token client mismatch".to_string());
    }
    if refresh_expires_at
        .as_ref()
        .and_then(|value| chrono::DateTime::parse_from_rfc3339(value).ok())
        .is_some_and(|value| value <= chrono::Utc::now())
    {
        return Err("OAuth refresh token has expired".to_string());
    }

    let session_row = sqlx::query(
        "SELECT s.id, s.tenant_id, s.organization_id, s.login_scope, s.user_id, s.app_id, \
                s.environment, s.deployment_mode, s.auth_level, s.data_scope_json, s.permission_scope_json \
         FROM iam_session s \
         JOIN iam_user u ON u.id = s.user_id AND u.tenant_id = s.tenant_id \
         WHERE s.tenant_id = $1 AND s.user_id = $2 AND s.revoked_at IS NULL \
           AND s.expires_at::timestamptz > $3::timestamptz \
           AND u.status = 'active' AND u.is_deleted = 0 \
         ORDER BY s.updated_at DESC \
         LIMIT 1",
    )
    .bind(&tenant_id)
    .bind(&user_id)
    .bind(chrono::Utc::now().to_rfc3339())
    .fetch_optional(pg)
    .await
    .map_err(|error| format!("load oauth session for refresh failed: {error}"))?
    .ok_or_else(|| "OAuth refresh token cannot be exchanged without an active IAM session".to_string())?;

    let context = iam_context_from_session_row(&session_row)?;
    let access_token = sign_oauth_access_token(pg, &context, &client.app_id).await?;
    let next_refresh_token = generate_opaque_token("oauth_refresh");
    let access_hash = hash_value(&access_token);
    let refresh_hash = hash_value(&next_refresh_token);
    let now = chrono::Utc::now();
    let access_expires = now + chrono::Duration::seconds(OAUTH_ACCESS_TOKEN_TTL_SECONDS);
    let refresh_expires = now + chrono::Duration::seconds(OAUTH_REFRESH_TOKEN_TTL_SECONDS);

    sqlx::query(
        "UPDATE iam_oauth_grant \
         SET access_token_hash = $2, refresh_token_hash = $3, token_expires_at = $4, \
             refresh_token_expires_at = $5, last_refreshed_at = $6, updated_at = $6 \
         WHERE id = $1 AND status = 'active'",
    )
    .bind(&grant_id)
    .bind(&access_hash)
    .bind(&refresh_hash)
    .bind(access_expires.to_rfc3339())
    .bind(refresh_expires.to_rfc3339())
    .bind(now.to_rfc3339())
    .execute(pg)
    .await
    .map_err(|error| format!("rotate oauth refresh token failed: {error}"))?;

    Ok(json!({
        "access_token": access_token,
        "token_type": "Bearer",
        "expires_in": OAUTH_ACCESS_TOKEN_TTL_SECONDS,
        "refresh_token": next_refresh_token,
        "scope": parse_scope_json(&scopes_json).join(" "),
    }))
}

pub async fn load_oauth_bearer_scopes(pg: &PgPool, bearer_token: &str) -> Vec<String> {
    let token = strip_optional_bearer_prefix(bearer_token);
    if token.is_empty() {
        return vec!["openid".to_string()];
    }

    if let Ok(scopes) = load_grant_scopes_by_access_token_hash(pg, &hash_value(token)).await {
        if !scopes.is_empty() {
            return scopes;
        }
    }

    if let Some(scope_claim) = jwt_scope_claim(token) {
        return scope_claim;
    }

    vec!["openid".to_string()]
}

pub async fn build_userinfo_claims(pg: &PgPool, context: &IamAppContext, scopes: &[String]) -> Result<Value, String> {
    let user_row = sqlx::query(
        "SELECT id, email, phone, display_name, avatar_resource_snapshot \
         FROM iam_user \
         WHERE id = $1 AND tenant_id = $2 AND status = 'active' AND is_deleted = 0 \
         LIMIT 1",
    )
    .bind(&context.user_id)
    .bind(&context.tenant_id)
    .fetch_optional(pg)
    .await
    .map_err(|error| format!("load oauth userinfo user failed: {error}"))?
    .ok_or_else(|| "OAuth userinfo subject was not found".to_string())?;

    let mut claims = json!({
        "sub": context.user_id,
    });
    if scopes.iter().any(|scope| scope == "profile") {
        claims["name"] = json!(user_row.get::<Option<String>, _>(3));
        claims["picture"] = json!(user_row.get::<Option<String>, _>(4));
    }
    if scopes.iter().any(|scope| scope == "email") {
        claims["email"] = json!(user_row.get::<Option<String>, _>(1));
    }
    if scopes.iter().any(|scope| scope == "phone") {
        claims["phone_number"] = json!(user_row.get::<Option<String>, _>(2));
    }
    if scopes.iter().any(|scope| scope == "tenant") {
        claims["tenant_id"] = json!(context.tenant_id);
    }
    if scopes.iter().any(|scope| scope == "organization") {
        claims["organization_id"] = json!(context.organization_id);
    }
    Ok(claims)
}

pub fn build_oauth_jwks_document() -> Value {
    json!({ "keys": [] })
}

pub async fn revoke_oauth_token(
    pg: &PgPool,
    token: &str,
    client_id: Option<&str>,
    tenant_hint: Option<&str>,
    client_secret: Option<&str>,
) -> Result<(), String> {
    let token = token.trim();
    if token.is_empty() {
        return Err("token is required".to_string());
    }

    if let Some(client_id) = client_id.filter(|value| !value.is_empty()) {
        let client = resolve_relying_party_client(pg, client_id, tenant_hint).await?;
        if client.config.confidential {
            verify_client_secret(&client, client_secret)?;
        }
    }

    let token_hash = hash_value(token);
    sqlx::query(
        "UPDATE iam_oauth_grant \
         SET status = 'revoked', updated_at = $2 \
         WHERE (access_token_hash = $1 OR refresh_token_hash = $1) AND status = 'active'",
    )
    .bind(&token_hash)
    .bind(chrono::Utc::now().to_rfc3339())
    .execute(pg)
    .await
    .map_err(|error| format!("revoke oauth token failed: {error}"))?;

    Ok(())
}

pub async fn introspect_oauth_token(
    pg: &PgPool,
    token: &str,
    client_id: Option<&str>,
    tenant_hint: Option<&str>,
    client_secret: Option<&str>,
) -> Result<Value, String> {
    let token = token.trim();
    if token.is_empty() {
        return Err("token is required".to_string());
    }

    let client_app_id = if let Some(client_id) = client_id.filter(|value| !value.is_empty()) {
        let client = resolve_relying_party_client(pg, client_id, tenant_hint).await?;
        if client.config.confidential {
            verify_client_secret(&client, client_secret)?;
        }
        Some(client.app_id)
    } else {
        None
    };

    if let Some(context) = crate::iam_session::resolve_iam_app_context_from_oauth_bearer(pg, token).await {
        return Ok(json!({
            "active": true,
            "sub": context.user_id,
            "client_id": client_app_id,
            "token_type": "Bearer",
            "scope": "openid profile email",
            "tenant_id": context.tenant_id,
        }));
    }

    let token_hash = hash_value(token);
    let row = sqlx::query(
        "SELECT user_id, oauth_client_id, authorized_scopes_json, token_expires_at, status \
         FROM iam_oauth_grant \
         WHERE refresh_token_hash = $1 \
         LIMIT 1",
    )
    .bind(&token_hash)
    .fetch_optional(pg)
    .await
    .map_err(|error| format!("introspect oauth token failed: {error}"))?;

    if let Some(row) = row {
        let status: String = row.get(4);
        let expires_at: Option<String> = row.get(3);
        let active = status == "active"
            && expires_at
                .as_ref()
                .and_then(|value| chrono::DateTime::parse_from_rfc3339(value).ok())
                .is_some_and(|value| value > chrono::Utc::now());
        if active {
            return Ok(json!({
                "active": true,
                "sub": row.get::<String, _>(0),
                "client_id": row.get::<String, _>(1),
                "token_type": "refresh_token",
                "scope": row.get::<String, _>(2),
            }));
        }
    }

    Ok(json!({ "active": false }))
}

fn redirect_uri_allowed(registered: &[String], candidate: &str) -> bool {
    registered
        .iter()
        .any(|value| redirect_uris_match(value, candidate))
}

fn redirect_uris_match(expected: &str, actual: &str) -> bool {
    expected.trim() == actual.trim()
}

fn scope_allowed(allowed: &[String], scope: &str) -> bool {
    allowed.is_empty() || allowed.iter().any(|candidate| candidate == scope)
}

fn normalize_scopes(raw: &str) -> Vec<String> {
    raw.split_whitespace()
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .map(str::to_string)
        .collect()
}

fn verify_client_secret(client: &ResolvedRelyingParty, provided: Option<&str>) -> Result<(), String> {
    let Some(expected_hash) = client
        .config
        .client_secret_hash
        .as_deref()
        .filter(|value| !value.is_empty())
    else {
        return Err("OAuth client_secret is required for confidential clients".to_string());
    };
    let provided = provided
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .ok_or_else(|| "OAuth client_secret is required".to_string())?;
    let parsed = PasswordHash::new(expected_hash)
        .map_err(|_| "OAuth client_secret hash is invalid".to_string())?;
    Argon2::default()
        .verify_password(provided.as_bytes(), &parsed)
        .map_err(|_| "OAuth client_secret is invalid".to_string())
}

fn runtime_config_json_from_row(row: &sqlx::postgres::PgRow, index: usize) -> Value {
    if let Ok(sqlx::types::Json(value)) = row.try_get::<sqlx::types::Json<Value>, _>(index) {
        return value;
    }
    if let Ok(text) = row.try_get::<String, _>(index) {
        return serde_json::from_str(&text).unwrap_or_else(|_| json!({}));
    }
    json!({})
}

fn validate_pkce(code_verifier: Option<&str>, challenge: &str, method: &str) -> Result<(), String> {
    let verifier = code_verifier
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .ok_or_else(|| "OAuth code_verifier is required".to_string())?;
    let expected = if method == "S256" {
        let digest = Sha256::digest(verifier.as_bytes());
        URL_SAFE_NO_PAD.encode(digest)
    } else {
        verifier.to_string()
    };
    if expected != challenge {
        return Err("OAuth PKCE verification failed".to_string());
    }
    Ok(())
}

fn parse_grant_id_from_return_path(return_path: &str) -> Option<String> {
    return_path
        .split('|')
        .find_map(|segment| segment.strip_prefix("grant:").map(str::to_string))
        .filter(|value| !value.is_empty())
}

fn build_return_path(oauth_state: Option<&str>) -> String {
    match oauth_state.filter(|value| !value.is_empty()) {
        Some(state) => format!("state:{state}"),
        None => String::new(),
    }
}

fn compose_grant_return_path(existing: &str, grant_id: &str) -> String {
    if existing.is_empty() {
        format!("grant:{grant_id}")
    } else {
        format!("{existing}|grant:{grant_id}")
    }
}

fn parse_oauth_state_from_return_path(return_path: &str) -> Option<String> {
    return_path
        .split('|')
        .find_map(|segment| segment.strip_prefix("state:").map(str::to_string))
        .filter(|value| !value.is_empty())
}

async fn sign_oauth_access_token(
    pg: &PgPool,
    context: &IamAppContext,
    audience: &str,
) -> Result<String, String> {
    let signing_key = load_active_signing_key(pg, &context.tenant_id).await?;
    let issued_at = current_unix_seconds();
    let expires_at = issued_at + OAUTH_ACCESS_TOKEN_TTL_SECONDS;
    let header = json!({"alg":"HS256","kid":signing_key.kid,"typ":"JWT"});
    let payload = json!({
        "app_id": context.app_id,
        "aud": audience,
        "auth_level": auth_level_to_string(&context.auth_level),
        "deployment_mode": deployment_mode_to_string(&context.deployment_mode),
        "environment": environment_to_string(&context.environment),
        "exp": expires_at,
        "iat": issued_at,
        "iss": oauth_issuer_base_url(),
        "login_scope": login_scope_to_string(&context.login_scope),
        "organization_id": context.organization_id.clone().unwrap_or_else(|| "0".to_string()),
        "permission_scope": context.permission_scope,
        "scope": "openid profile email",
        "session_id": context.session_id,
        "sub": context.user_id,
        "tenant_id": context.tenant_id,
        "token_type": "oauth",
        "token_version": stamp_token_version(),
        "user_id": context.user_id,
    });
    sign_jwt(&signing_key.secret, &header, &payload)
}

struct TenantSigningKey {
    kid: String,
    secret: Vec<u8>,
}

async fn load_active_signing_key(
    pg: &PgPool,
    tenant_id: &str,
) -> Result<TenantSigningKey, String> {
    let material = sdkwork_iam_bootstrap::load_postgres_active_tenant_signing_key(pg, tenant_id)
        .await
        .map_err(|error| format!("load tenant signing key failed: {error}"))?
        .ok_or_else(|| "tenant signing key is not configured".to_string())?;
    Ok(TenantSigningKey {
        kid: material.kid,
        secret: material.secret,
    })
}

fn iam_context_from_session_row(row: &sqlx::postgres::PgRow) -> Result<IamAppContext, String> {
    let session_id: String = row.get(0);
    let tenant_id: String = row.get(1);
    let organization_id: Option<String> = row.get(2);
    let user_id: String = row.get(4);
    let app_id: String = row.get(5);
    let environment_raw: String = row.get(6);
    let deployment_mode_raw: String = row.get(7);
    let auth_level_raw: String = row.get(8);
    let data_scope: Vec<String> = row
        .try_get::<sqlx::types::Json<Vec<String>>, _>(9)
        .map(|value| value.0)
        .unwrap_or_default();
    let permission_scope: Vec<String> = row
        .try_get::<sqlx::types::Json<Vec<String>>, _>(10)
        .map(|value| value.0)
        .unwrap_or_default();

    Ok(IamAppContext::new(
        tenant_id,
        organization_id.as_deref(),
        user_id,
        session_id,
        app_id,
        parse_environment(&environment_raw),
        parse_deployment_mode(&deployment_mode_raw),
        parse_auth_level(&auth_level_raw),
        data_scope,
        permission_scope,
    ))
}

fn sign_jwt(secret: &[u8], header: &Value, payload: &Value) -> Result<String, String> {
    let signing_input = format!(
        "{}.{}",
        encode_jwt_json(header),
        encode_jwt_json(payload)
    );
    let mut mac = HmacSha256::new_from_slice(secret)
        .map_err(|error| format!("jwt signing key is invalid: {error}"))?;
    mac.update(signing_input.as_bytes());
    let signature = URL_SAFE_NO_PAD.encode(mac.finalize().into_bytes());
    Ok(format!("{signing_input}.{signature}"))
}

fn encode_jwt_json(value: &Value) -> String {
    URL_SAFE_NO_PAD.encode(serde_json::to_vec(value).expect("jwt json should serialize"))
}

fn hash_value(value: &str) -> String {
    let digest = Sha256::digest(value.as_bytes());
    format!("{:x}", digest)
}

fn generate_opaque_token(kind: &str) -> String {
    let mut bytes = [0u8; 32];
    OsRng.fill_bytes(&mut bytes);
    format!("sdkwork-{kind}-{}", URL_SAFE_NO_PAD.encode(bytes))
}

fn current_unix_seconds() -> i64 {
    chrono::Utc::now().timestamp()
}

fn auth_level_to_string(level: &AuthLevel) -> &'static str {
    match level {
        AuthLevel::Anonymous => "anonymous",
        AuthLevel::Password => "password",
        AuthLevel::Mfa => "mfa",
        AuthLevel::System => "system",
    }
}

fn environment_to_string(environment: &Environment) -> &'static str {
    match environment {
        Environment::Dev => "dev",
        Environment::Test => "test",
        Environment::Prod => "prod",
    }
}

fn deployment_mode_to_string(mode: &DeploymentMode) -> &'static str {
    match mode {
        DeploymentMode::Saas => "saas",
        DeploymentMode::Local => "local",
        DeploymentMode::Private => "private",
    }
}

fn login_scope_to_string(scope: &sdkwork_iam_context_service::LoginScope) -> &'static str {
    use sdkwork_iam_context_service::LoginScope;
    match scope {
        LoginScope::Tenant => "TENANT",
        LoginScope::Organization => "ORGANIZATION",
    }
}

fn parse_environment(raw: &str) -> Environment {
    match raw.trim().to_ascii_lowercase().as_str() {
        "prod" | "production" => Environment::Prod,
        "test" | "testing" => Environment::Test,
        _ => Environment::Dev,
    }
}

fn parse_deployment_mode(raw: &str) -> DeploymentMode {
    match raw.trim().to_ascii_lowercase().as_str() {
        "local" => DeploymentMode::Local,
        "private" => DeploymentMode::Private,
        _ => DeploymentMode::Saas,
    }
}

fn parse_scope_json(raw: &str) -> Vec<String> {
    serde_json::from_str::<Vec<String>>(raw).unwrap_or_else(|_| normalize_scopes(raw))
}

async fn load_grant_scopes_by_access_token_hash(
    pg: &PgPool,
    access_token_hash: &str,
) -> Result<Vec<String>, String> {
    let scopes_json: Option<String> = sqlx::query_scalar(
        "SELECT authorized_scopes_json FROM iam_oauth_grant \
         WHERE access_token_hash = $1 AND status = 'active' \
         LIMIT 1",
    )
    .bind(access_token_hash)
    .fetch_optional(pg)
    .await
    .map_err(|error| format!("load oauth grant scopes failed: {error}"))?;

    Ok(scopes_json
        .map(|value| parse_scope_json(&value))
        .unwrap_or_default())
}

fn jwt_scope_claim(token: &str) -> Option<Vec<String>> {
    let payload = token.split('.').nth(1)?;
    let bytes = URL_SAFE_NO_PAD.decode(payload).ok()?;
    let value: Value = serde_json::from_slice(&bytes).ok()?;
    value
        .get("scope")
        .and_then(|scope| {
            if let Some(raw) = scope.as_str() {
                return Some(normalize_scopes(raw));
            }
            scope
                .as_array()
                .map(|items| {
                    items
                        .iter()
                        .filter_map(|item| item.as_str().map(str::to_string))
                        .collect()
                })
        })
        .filter(|scopes| !scopes.is_empty())
}

fn strip_optional_bearer_prefix(raw_token: &str) -> &str {
    raw_token
        .trim()
        .strip_prefix("Bearer ")
        .or_else(|| raw_token.trim().strip_prefix("bearer "))
        .unwrap_or_else(|| raw_token.trim())
}

fn parse_auth_level(raw: &str) -> AuthLevel {
    match raw.trim().to_ascii_lowercase().as_str() {
        "password" => AuthLevel::Password,
        "mfa" => AuthLevel::Mfa,
        "system" => AuthLevel::System,
        _ => AuthLevel::Anonymous,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn authorize_request_requires_openid_scope() {
        let client = ResolvedRelyingParty {
            tenant_id: "tenant-1".to_string(),
            app_id: "app_forum".to_string(),
            config: RelyingPartyConfig {
                enabled: true,
                redirect_uris: vec!["https://forum.example.com/callback".to_string()],
                allowed_scopes: vec!["openid".to_string(), "profile".to_string()],
                confidential: false,
                client_secret_hash: None,
            },
        };
        let err = validate_authorize_request(
            &AuthorizeRequest {
                client_id: "app_forum".to_string(),
                redirect_uri: "https://forum.example.com/callback".to_string(),
                response_type: "code".to_string(),
                scope: "profile".to_string(),
                state: Some("xyz".to_string()),
                code_challenge: Some("eVpBbm5ub3QtZXQtc2VjcmV0".to_string()),
                code_challenge_method: Some("S256".to_string()),
                tenant_id: None,
            },
            &client,
        )
        .expect_err("missing openid");
        assert!(err.contains("openid"));
    }

    #[test]
    fn discovery_document_declares_core_endpoints() {
        let doc = build_openid_configuration_document();
        assert!(doc.get("authorization_endpoint").is_some());
        assert!(doc.get("token_endpoint").is_some());
        assert!(doc.get("userinfo_endpoint").is_some());
    }

    #[test]
    fn pkce_validation_requires_matching_verifier() {
        let verifier = "challenge";
        let challenge = {
            let digest = Sha256::digest(verifier.as_bytes());
            URL_SAFE_NO_PAD.encode(digest)
        };
        validate_pkce(Some(verifier), &challenge, "S256").expect("pkce");
        assert!(validate_pkce(Some("wrong"), &challenge, "S256").is_err());
    }

    #[test]
    fn public_client_authorize_request_requires_pkce() {
        let client = sample_public_relying_party();
        let err = validate_authorize_request(
            &sample_authorize_request(None, None),
            &client,
        )
        .expect_err("missing pkce");
        assert!(err.contains("code_challenge"));
    }

    #[test]
    fn public_client_authorize_request_accepts_s256_pkce() {
        let client = sample_public_relying_party();
        let verifier = "pkce-verifier-with-sufficient-length";
        let challenge = {
            let digest = Sha256::digest(verifier.as_bytes());
            URL_SAFE_NO_PAD.encode(digest)
        };
        validate_authorize_request(
            &sample_authorize_request(Some(challenge), Some("S256".to_string())),
            &client,
        )
        .expect("valid public client authorize request");
    }

    #[test]
    fn confidential_client_authorize_request_allows_missing_pkce() {
        let client = ResolvedRelyingParty {
            tenant_id: "tenant-1".to_string(),
            app_id: "app_forum".to_string(),
            config: RelyingPartyConfig {
                enabled: true,
                redirect_uris: vec!["https://forum.example.com/callback".to_string()],
                allowed_scopes: vec!["openid".to_string(), "profile".to_string()],
                confidential: true,
                client_secret_hash: Some("hash".to_string()),
            },
        };
        validate_authorize_request(
            &sample_authorize_request(None, None),
            &client,
        )
        .expect("confidential client may omit pkce at authorize time");
    }

    fn sample_public_relying_party() -> ResolvedRelyingParty {
        ResolvedRelyingParty {
            tenant_id: "tenant-1".to_string(),
            app_id: "app_forum".to_string(),
            config: RelyingPartyConfig {
                enabled: true,
                redirect_uris: vec!["https://forum.example.com/callback".to_string()],
                allowed_scopes: vec!["openid".to_string(), "profile".to_string()],
                confidential: false,
                client_secret_hash: None,
            },
        }
    }

    fn sample_authorize_request(
        code_challenge: Option<String>,
        code_challenge_method: Option<String>,
    ) -> AuthorizeRequest {
        AuthorizeRequest {
            client_id: "app_forum".to_string(),
            redirect_uri: "https://forum.example.com/callback".to_string(),
            response_type: "code".to_string(),
            scope: "openid profile".to_string(),
            state: Some("xyz".to_string()),
            code_challenge,
            code_challenge_method,
            tenant_id: None,
        }
    }
}
