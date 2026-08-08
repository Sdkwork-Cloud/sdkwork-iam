//! Admin-scoped delegated access token issuance for backend IAM operators.

use crate::application_registry::{intersect_permission_scopes, resolve_tenant_application};
use crate::iam_database_env::resolve_iam_database_pool_from_env;
use crate::is_blank;
use crate::super_admin_auth::AccessTokenActor;
use base64::{engine::general_purpose::URL_SAFE_NO_PAD, Engine as _};
use hmac::{Hmac, Mac};
use rand_core::{OsRng, RngCore};
use sdkwork_iam_context_service::{
    AuthLevel, DeploymentMode, Environment, IamAppContext, LoginScope,
};
use sdkwork_web_core::stamp_token_version;
use serde_json::{json, Value};
use sha2::{Digest, Sha256};
use sqlx::{types::Json, PgPool};

use sdkwork_iam_bootstrap::resolve_session_scopes as bootstrap_resolve_session_scopes;

pub const IAM_ACCESS_CREDENTIALS_CREATE_PERMISSION: &str = "iam.access_credentials.create";

const LOCAL_TOKEN_TTL_SECONDS: u128 = 60 * 60;

type HmacSha256 = Hmac<Sha256>;

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct AccessCredentialCreateRequest {
    pub tenant_id: String,
    pub organization_id: String,
    pub tenant_application_id: Option<String>,
    pub app_id: Option<String>,
    pub instance_key: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct IssuedAccessCredential {
    pub access_credential: String,
    pub auth_token: String,
    pub session_id: String,
    pub tenant_id: String,
    pub organization_id: String,
    pub app_id: String,
    pub tenant_application_id: String,
    pub expires_at: String,
}

#[derive(Clone)]
pub(crate) struct TenantSigningKey {
    pub(crate) kid: String,
    pub(crate) secret: Vec<u8>,
}

pub fn principal_has_permission(permission_scope: &[String], permission: &str) -> bool {
    sdkwork_iam_context_service::has_permission_in_scope(permission_scope, permission)
}

pub fn parse_access_credential_create_request(
    body: &Value,
) -> Result<AccessCredentialCreateRequest, String> {
    let tenant_id = read_required_string(body, &["tenantId", "tenant_id"])?;
    let organization_id = read_required_string(body, &["organizationId", "organization_id"])?;
    let tenant_application_id =
        read_optional_string(body, &["tenantApplicationId", "tenant_application_id"]);
    let app_id = read_optional_string(body, &["appId", "app_id"]);
    let instance_key = read_optional_string(body, &["instanceKey", "instance_key"]);

    if tenant_application_id.is_none() && app_id.is_none() && instance_key.is_none() {
        return Err("tenantApplicationId, appId, or instanceKey is required".to_string());
    }

    Ok(AccessCredentialCreateRequest {
        tenant_id,
        organization_id,
        tenant_application_id,
        app_id,
        instance_key,
    })
}

pub fn resolve_runtime_app_id(
    request: &AccessCredentialCreateRequest,
    tenant_app: &crate::application_registry::TenantApplication,
) -> String {
    let _ = request;
    tenant_app.app_id.clone()
}

pub async fn issue_delegated_access_credential(
    pg: &PgPool,
    actor: &AccessTokenActor,
    request: &AccessCredentialCreateRequest,
) -> Result<IssuedAccessCredential, String> {
    ensure_tenant_exists(pg, &request.tenant_id).await?;
    ensure_organization_exists(pg, &request.tenant_id, &request.organization_id).await?;

    let tenant_application = resolve_tenant_application(
        pg,
        &request.tenant_id,
        request.tenant_application_id.as_deref(),
        request.app_id.as_deref(),
        request.instance_key.as_deref(),
    )
    .await?
    .ok_or_else(|| {
        "tenant application was not found; register application and provision tenant application before issuing access credential".to_string()
    })?;

    if tenant_application.status != "enabled" {
        return Err(
            "tenant application must be enabled before issuing access credential".to_string(),
        );
    }
    if tenant_application.organization_id != request.organization_id {
        return Err("organizationId does not match tenant application".to_string());
    }

    let organization_id = Some(request.organization_id.clone());
    let (data_scope, actor_permission_scope) = resolve_session_scopes(
        pg,
        &request.tenant_id,
        &actor.user_id,
        organization_id.as_deref(),
    )
    .await?;
    let permission_scope = intersect_permission_scopes(
        &actor_permission_scope,
        &tenant_application.access_permissions,
    )?;
    let app_id = tenant_application.app_id.clone();

    let session_id = generate_opaque_token("session");
    let now = chrono::Utc::now();
    let expires_at = now + chrono::Duration::seconds(LOCAL_TOKEN_TTL_SECONDS as i64);

    let context = IamAppContext::new(
        request.tenant_id.clone(),
        organization_id.as_deref(),
        actor.user_id.clone(),
        session_id.clone(),
        app_id.clone(),
        actor.environment.clone(),
        actor.deployment_mode.clone(),
        AuthLevel::System,
        data_scope,
        permission_scope,
    );

    let signing_key = ensure_tenant_signing_key(pg, &request.tenant_id).await?;
    let access_token = sign_local_session_token(&signing_key, "access", &context);
    let auth_token = sign_local_session_token(&signing_key, "auth", &context);
    let refresh_token = generate_opaque_token("refresh");

    let auth_token_hash = hash_token(&auth_token);
    let access_token_hash = hash_token(&access_token);
    let refresh_token_hash = hash_token(&refresh_token);

    persist_signed_session(
        pg,
        &context,
        &signing_key,
        &auth_token_hash,
        &access_token_hash,
        &refresh_token_hash,
        &expires_at,
        &now,
    )
    .await?;

    Ok(IssuedAccessCredential {
        access_credential: access_token,
        auth_token,
        session_id,
        tenant_id: request.tenant_id.clone(),
        organization_id: request.organization_id.clone(),
        app_id,
        tenant_application_id: tenant_application.id.clone(),
        expires_at: expires_at.to_rfc3339(),
    })
}

/// Issues a signed bootstrap Access-Token for standalone/container deployments.
///
/// Deployment order is executed here so first boot is fully automatic:
/// 1. the tenant application must be provisioned and enabled (the installer
///    creates it), 2. the bootstrap system user is ensured, 3. the **tenant
///    signing key is ensured** — created on first boot, which is the "update
///    the tenant secret" step, 4. a signed JWT is issued with the tenant
///    application's access permissions as the token scope, 5. the session is
///    persisted. The gateway then resolves the token through the verified
///    database path (signature + tenant binding + scope), never through the
///    payload-only development fallback.
pub async fn issue_standalone_bootstrap_access_credential(
    pg: &PgPool,
    tenant_id: &str,
    app_id: &str,
    ttl_seconds: Option<u64>,
) -> Result<IssuedAccessCredential, String> {
    ensure_tenant_exists(pg, tenant_id).await?;

    let tenant_application = resolve_tenant_application(pg, tenant_id, None, Some(app_id), None)
        .await?
        .ok_or_else(|| {
            format!("tenant application {app_id} is not provisioned for tenant {tenant_id}")
        })?;
    if tenant_application.status != "enabled" {
        return Err(format!(
            "tenant application {app_id} must be enabled before issuing a bootstrap access credential"
        ));
    }
    ensure_bootstrap_system_user(pg, tenant_id).await?;

    let organization_id = tenant_application.organization_id.clone();
    let session_id = generate_opaque_token("session");
    let now = chrono::Utc::now();
    let ttl = ttl_seconds.unwrap_or(LOCAL_TOKEN_TTL_SECONDS as u64);
    let expires_at = now + chrono::Duration::seconds(ttl as i64);

    let environment = bootstrap_environment();
    let context = IamAppContext::new(
        tenant_id.to_owned(),
        Some(organization_id.as_str()),
        "system",
        session_id.clone(),
        app_id.to_owned(),
        environment,
        DeploymentMode::Local,
        AuthLevel::System,
        vec![format!("tenant:{tenant_id}"), "user:system".to_owned()],
        tenant_application.access_permissions.clone(),
    );

    // Step 3 above: ensure (or rotate on request) the tenant signing key
    // before signing, so the issued token is always bound to the tenant
    // secret and the database session.
    let signing_key = ensure_tenant_signing_key(pg, tenant_id).await?;
    let access_token =
        sign_local_session_token_with_ttl(&signing_key, "access", &context, ttl as u128);
    let auth_token = sign_local_session_token_with_ttl(&signing_key, "auth", &context, ttl as u128);
    let refresh_token = generate_opaque_token("refresh");

    let auth_token_hash = hash_token(&auth_token);
    let access_token_hash = hash_token(&access_token);
    let refresh_token_hash = hash_token(&refresh_token);
    persist_signed_session(
        pg,
        &context,
        &signing_key,
        &auth_token_hash,
        &access_token_hash,
        &refresh_token_hash,
        &expires_at,
        &now,
    )
    .await?;

    Ok(IssuedAccessCredential {
        access_credential: access_token,
        auth_token,
        session_id,
        tenant_id: tenant_id.to_owned(),
        organization_id,
        app_id: app_id.to_owned(),
        tenant_application_id: tenant_application.id.clone(),
        expires_at: expires_at.to_rfc3339(),
    })
}

/// Resolves the deployment environment for bootstrap issuance with the same
/// semantics as the Cloud Router web environment parser: unset or unknown
/// values default to production.
fn bootstrap_environment() -> Environment {
    let value = std::env::var("SDKWORK_CLOUDROUTER_ROUTER_ENVIRONMENT")
        .or_else(|_| std::env::var("SDKWORK_CLOUDROUTER_ENVIRONMENT"))
        .map(|value| value.trim().to_ascii_lowercase())
        .unwrap_or_default();
    match value.as_str() {
        "dev" | "development" => Environment::Dev,
        "test" | "testing" => Environment::Test,
        _ => Environment::Prod,
    }
}

/// Resolves the deployment bootstrap Access-Token for packaged deployments.
///
/// Priority:
/// 1. an explicitly configured `SDKWORK_ACCESS_TOKEN` wins unchanged;
/// 2. otherwise a signed tenant-bound token is issued through
///    [`issue_standalone_bootstrap_access_credential`] (tenant signing key
///    ensured first — the "update the tenant secret" step on first boot —
///    then a signed JWT persisted as an IAM session);
/// 3. `Ok(None)` when no IAM database is configured, letting the caller fall
///    back to a development-only token.
///
/// `tenant_id`/`app_id` default to the installer-provisioned tenant runtime
/// app (`SDKWORK_WEB_FRAMEWORK_JWT_BOOTSTRAP_TENANT_ID` /
/// `SDKWORK_WEB_FRAMEWORK_JWT_BOOTSTRAP_APP_ID` env overrides apply).
pub async fn resolve_deployment_bootstrap_access_token(
    tenant_id: Option<&str>,
    app_id: Option<&str>,
) -> Result<Option<String>, String> {
    if let Some(token) = std::env::var("SDKWORK_ACCESS_TOKEN")
        .ok()
        .filter(|value| !value.trim().is_empty())
    {
        return Ok(Some(token));
    }

    let Some(pool) = resolve_iam_database_pool_from_env().await else {
        tracing::debug!("IAM database pool unavailable; bootstrap token resolution deferred to caller fallback");
        return Ok(None);
    };
    let Some(pg) = pool.as_postgres() else {
        tracing::debug!("IAM database pool is not PostgreSQL; bootstrap token resolution deferred to caller fallback");
        return Ok(None);
    };

    let tenant_id = tenant_id
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .map(str::to_owned)
        .or_else(|| {
            std::env::var("SDKWORK_WEB_FRAMEWORK_JWT_BOOTSTRAP_TENANT_ID")
                .ok()
                .filter(|value| !value.trim().is_empty())
        })
        .unwrap_or_else(|| "100001".to_owned());
    let app_id = app_id
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .map(str::to_owned)
        .or_else(|| {
            std::env::var("SDKWORK_WEB_FRAMEWORK_JWT_BOOTSTRAP_APP_ID")
                .ok()
                .filter(|value| !value.trim().is_empty())
        })
        .unwrap_or_else(|| "sdkwork-cloudrouter".to_owned());

    let issued =
        issue_standalone_bootstrap_access_credential(pg, &tenant_id, &app_id, None).await?;
    tracing::info!(
        tenant_id = %issued.tenant_id,
        app_id = %issued.app_id,
        session_id = %issued.session_id,
        expires_at = %issued.expires_at,
        "issued signed bootstrap access credential for portal login",
    );
    Ok(Some(issued.access_credential))
}

/// Ensures the synthetic `system` user used as the bootstrap principal.
///
/// `find_iam_context_from_access_token` joins `iam_user` and requires an
/// active row, so the bootstrap session needs this user to resolve through
/// the verified database path.
async fn ensure_bootstrap_system_user(pg: &PgPool, tenant_id: &str) -> Result<(), String> {    let now = chrono::Utc::now().to_rfc3339();
    sqlx::query(
        "INSERT INTO iam_user \
         (id, tenant_id, username, display_name, email, status, created_at, updated_at, \
          locale, timezone, source, is_deleted) \
         VALUES ('system', $1, 'system', 'System', 'system@localhost', 'active', $2, $2, \
                 'en-US', 'UTC', 'bootstrap', 0) \
         ON CONFLICT (id, tenant_id) DO NOTHING",
    )
    .bind(tenant_id)
    .bind(&now)
    .execute(pg)
    .await
    .map_err(|error| format!("ensure bootstrap system user failed: {error}"))?;
    Ok(())
}

/// Persists an issued session row with the signed token hashes and the
/// tenant-bound signing key id. Shared by delegated and bootstrap issuance.
#[allow(clippy::too_many_arguments)]
async fn persist_signed_session(
    pg: &PgPool,
    context: &IamAppContext,
    signing_key: &TenantSigningKey,
    auth_token_hash: &str,
    access_token_hash: &str,
    refresh_token_hash: &str,
    expires_at: &chrono::DateTime<chrono::Utc>,
    now: &chrono::DateTime<chrono::Utc>,
) -> Result<(), String> {
    sqlx::query(
        "INSERT INTO iam_session (id, tenant_id, organization_id, login_scope, user_id, \
         principal_kind, principal_id, app_id, environment, deployment_mode, auth_level, \
         auth_token_hash, auth_token_kid, access_token_hash, access_token_kid, \
         refresh_token_hash, refresh_token_kid, sharding_key, sharding_strategy, \
         data_scope_json, permission_scope_json, expires_at, created_at, updated_at) \
         VALUES ($1, $2, $3, $4, $5, 'user', $5, $6, $7, $8, $9, \
                 $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)",
    )
    .bind(&context.session_id)
    .bind(&context.tenant_id)
    .bind(context.organization_id.as_deref().unwrap_or("0"))
    .bind(login_scope_to_string(&context.login_scope))
    .bind(&context.user_id)
    .bind(&context.app_id)
    .bind(environment_to_string(&context.environment))
    .bind(deployment_mode_to_string(&context.deployment_mode))
    .bind(auth_level_to_string(&context.auth_level))
    .bind(auth_token_hash)
    .bind(&signing_key.kid)
    .bind(access_token_hash)
    .bind(&signing_key.kid)
    .bind(refresh_token_hash)
    .bind(&signing_key.kid)
    .bind(&context.tenant_id)
    .bind("tenant")
    .bind(Json(&context.data_scope))
    .bind(Json(&context.permission_scope))
    .bind(expires_at)
    .bind(now)
    .bind(now)
    .execute(pg)
    .await
    .map_err(|error| format!("insert issued session failed: {error}"))?;
    Ok(())
}

pub fn issued_access_credential_to_json(issued: &IssuedAccessCredential) -> Value {
    json!({
        "accessCredential": issued.access_credential,
        "accessToken": issued.access_credential,
        "authToken": issued.auth_token,
        "sessionId": issued.session_id,
        "tenantId": issued.tenant_id,
        "organizationId": issued.organization_id,
        "appId": issued.app_id,
        "tenantApplicationId": issued.tenant_application_id,
        "expiresAt": issued.expires_at,
    })
}

async fn ensure_tenant_exists(pg: &PgPool, tenant_id: &str) -> Result<(), String> {
    let row = sqlx::query("SELECT id FROM iam_tenant WHERE id = $1 AND status = 'active' LIMIT 1")
        .bind(tenant_id)
        .fetch_optional(pg)
        .await
        .map_err(|error| format!("load tenant failed: {error}"))?;

    if row.is_some() {
        Ok(())
    } else {
        Err(format!("tenant {tenant_id} was not found or is inactive"))
    }
}

async fn ensure_organization_exists(
    pg: &PgPool,
    tenant_id: &str,
    organization_id: &str,
) -> Result<(), String> {
    let row = sqlx::query(
        "SELECT id FROM iam_organization \
         WHERE tenant_id = $1 AND id = $2 AND status = 'active' LIMIT 1",
    )
    .bind(tenant_id)
    .bind(organization_id)
    .fetch_optional(pg)
    .await
    .map_err(|error| format!("load organization failed: {error}"))?;

    if row.is_some() {
        Ok(())
    } else {
        Err(format!(
            "organization {organization_id} was not found for tenant {tenant_id}"
        ))
    }
}

async fn resolve_session_scopes(
    pg: &PgPool,
    tenant_id: &str,
    user_id: &str,
    organization_id: Option<&str>,
) -> Result<(Vec<String>, Vec<String>), String> {
    bootstrap_resolve_session_scopes(pg, tenant_id, user_id, organization_id).await
}

pub(crate) async fn ensure_tenant_signing_key(
    pg: &PgPool,
    tenant_id: &str,
) -> Result<TenantSigningKey, String> {
    sdkwork_iam_bootstrap::ensure_postgres_tenant_signing_key(pg, tenant_id)
        .await
        .map_err(|error| format!("provision tenant signing key failed: {error}"))?;

    let material = sdkwork_iam_bootstrap::load_postgres_active_tenant_signing_key(pg, tenant_id)
        .await
        .map_err(|error| format!("load signing key failed: {error}"))?
        .ok_or_else(|| format!("tenant signing key not provisioned for tenant {tenant_id}"))?;

    Ok(TenantSigningKey {
        kid: material.kid,
        secret: material.secret,
    })
}

fn sign_local_session_token(
    signing_key: &TenantSigningKey,
    token_type: &str,
    context: &IamAppContext,
) -> String {
    sign_local_session_token_with_ttl(signing_key, token_type, context, LOCAL_TOKEN_TTL_SECONDS)
}

pub(crate) fn sign_local_session_token_with_ttl(
    signing_key: &TenantSigningKey,
    token_type: &str,
    context: &IamAppContext,
    ttl_seconds: u128,
) -> String {
    let issued_at = current_millis() / 1000;
    let expires_at = issued_at + ttl_seconds;
    let organization_id = context
        .organization_id
        .as_deref()
        .filter(|value| !is_blank(Some(value)))
        .unwrap_or("0");
    let header = json!({
        "alg": "HS256",
        "kid": signing_key.kid,
        "typ": "JWT"
    });
    let payload = json!({
        "app_id": context.app_id,
        "aud": context.app_id,
        "auth_level": auth_level_to_string(&context.auth_level),
        "data_scope": context.data_scope,
        "deployment_mode": deployment_mode_to_string(&context.deployment_mode),
        "environment": environment_to_string(&context.environment),
        "exp": expires_at,
        "iat": issued_at,
        "iss": "sdkwork-iam-local",
        "login_scope": login_scope_to_string(&context.login_scope),
        "organization_id": organization_id,
        "permission_scope": context.permission_scope,
        "session_id": context.session_id,
        "sid": context.session_id,
        "sub": context.user_id,
        "principal_kind": match context.principal_kind {
            sdkwork_iam_context_service::IamPrincipalKind::User => "user",
            sdkwork_iam_context_service::IamPrincipalKind::ServiceAccount => "service_account",
        },
        "principal_id": context.principal_id,
        "tenant_id": context.tenant_id,
        "token_type": token_type,
        "token_version": stamp_token_version(),
        "user_id": context.user_id
    });
    let signing_input = format!("{}.{}", encode_jwt_json(&header), encode_jwt_json(&payload));
    let mut mac = HmacSha256::new_from_slice(signing_key.secret.as_slice())
        .expect("HS256 signing key length should be valid");
    mac.update(signing_input.as_bytes());
    let signature = URL_SAFE_NO_PAD.encode(mac.finalize().into_bytes());
    format!("{signing_input}.{signature}")
}

fn encode_jwt_json(value: &Value) -> String {
    URL_SAFE_NO_PAD.encode(serde_json::to_vec(value).expect("JWT JSON should serialize"))
}

pub(crate) fn hash_token(token: &str) -> String {
    let digest = Sha256::digest(token.as_bytes());
    format!("{:x}", digest)
}

pub(crate) fn generate_opaque_token(kind: &str) -> String {
    let mut bytes = [0u8; 32];
    OsRng.fill_bytes(&mut bytes);
    format!("sdkwork-{kind}-{}", URL_SAFE_NO_PAD.encode(bytes))
}

fn current_millis() -> u128 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|duration| duration.as_millis())
        .unwrap_or_default()
}

fn read_required_string(body: &Value, keys: &[&str]) -> Result<String, String> {
    read_optional_string(body, keys).ok_or_else(|| format!("{} is required", keys[0]))
}

fn read_optional_string(body: &Value, keys: &[&str]) -> Option<String> {
    keys.iter().find_map(|key| {
        body.get(*key)
            .and_then(Value::as_str)
            .map(str::trim)
            .filter(|value| !value.is_empty())
            .map(str::to_owned)
    })
}

pub(crate) fn login_scope_to_string(scope: &LoginScope) -> &'static str {
    match scope {
        LoginScope::Tenant => "TENANT",
        LoginScope::Organization => "ORGANIZATION",
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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parse_access_credential_create_request_accepts_camel_case_fields() {
        let body = json!({
            "tenantId": "100001",
            "organizationId": "org-1",
            "tenantApplicationId": "tapp-1"
        });
        let request = parse_access_credential_create_request(&body).expect("parse request");
        assert_eq!(request.tenant_id, "100001");
        assert_eq!(request.organization_id, "org-1");
        assert_eq!(request.tenant_application_id.as_deref(), Some("tapp-1"));
    }

    #[test]
    fn principal_has_permission_checks_permission_scope() {
        assert!(principal_has_permission(
            &[IAM_ACCESS_CREDENTIALS_CREATE_PERMISSION.to_owned()],
            IAM_ACCESS_CREDENTIALS_CREATE_PERMISSION
        ));
        assert!(!principal_has_permission(
            &["iam.users.read".to_owned()],
            IAM_ACCESS_CREDENTIALS_CREATE_PERMISSION
        ));
    }
}
