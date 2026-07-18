use argon2::{
    password_hash::{PasswordHash, PasswordHasher, PasswordVerifier, SaltString},
    Argon2,
};
use rand_core::OsRng;
use sdkwork_iam_context_service::{AuthLevel, DeploymentMode, Environment, IamAppContext};
use serde_json::{json, Value};
use sqlx::{types::Json, PgPool, Row};

use crate::access_token_issue::{
    auth_level_to_string, deployment_mode_to_string, ensure_tenant_signing_key,
    environment_to_string, generate_opaque_token, hash_token, login_scope_to_string,
    sign_local_session_token_with_ttl,
};
use crate::application_registry::{intersect_permission_scopes, resolve_tenant_application};

pub const IAM_SERVICE_ACCOUNT_CREDENTIALS_CREATE_PERMISSION: &str =
    "iam.service_account_credentials.create";
pub const IAM_SERVICE_ACCOUNT_CREDENTIALS_REVOKE_PERMISSION: &str =
    "iam.service_account_credentials.revoke";

const SERVICE_ACCOUNT_TOKEN_TTL_SECONDS: u128 = 15 * 60;

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ServiceAccountCredentialCreateRequest {
    pub tenant_application_id: String,
    pub expires_at: Option<chrono::DateTime<chrono::Utc>>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct CreatedServiceAccountCredential {
    pub credential_id: String,
    pub client_id: String,
    pub client_secret: String,
    pub tenant_id: String,
    pub organization_id: Option<String>,
    pub service_account_id: String,
    pub tenant_application_id: String,
    pub app_id: String,
    pub expires_at: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ServiceAccountTokenExchangeRequest {
    pub client_id: String,
    pub client_secret: String,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct IssuedServiceAccountTokens {
    pub access_token: String,
    pub auth_token: String,
    pub token_type: String,
    pub expires_in: u64,
    pub expires_at: String,
    pub session_id: String,
    pub tenant_id: String,
    pub organization_id: Option<String>,
    pub service_account_id: String,
    pub app_id: String,
}

struct StoredCredential {
    id: String,
    tenant_id: String,
    organization_id: Option<String>,
    service_account_id: String,
    tenant_application_id: String,
    app_id: String,
    secret_hash: String,
    environment: String,
}

pub fn parse_service_account_credential_create_request(
    body: &Value,
) -> Result<ServiceAccountCredentialCreateRequest, String> {
    let tenant_application_id = required_string(body, "tenantApplicationId")?;
    let expires_at = optional_string(body, "expiresAt")
        .map(|value| {
            chrono::DateTime::parse_from_rfc3339(&value)
                .map(|value| value.with_timezone(&chrono::Utc))
                .map_err(|_| "expiresAt must be an RFC 3339 timestamp".to_string())
        })
        .transpose()?;
    if expires_at.is_some_and(|value| value <= chrono::Utc::now()) {
        return Err("expiresAt must be in the future".to_string());
    }
    Ok(ServiceAccountCredentialCreateRequest {
        tenant_application_id,
        expires_at,
    })
}

pub fn parse_service_account_token_exchange_request(
    body: &Value,
) -> Result<ServiceAccountTokenExchangeRequest, String> {
    for forbidden in [
        "tenantId",
        "tenant_id",
        "organizationId",
        "organization_id",
        "appId",
        "app_id",
        "tenantApplicationId",
        "tenant_application_id",
        "serviceAccountId",
        "service_account_id",
    ] {
        if body.get(forbidden).is_some() {
            return Err(format!(
                "{forbidden} is not accepted during credential exchange"
            ));
        }
    }
    Ok(ServiceAccountTokenExchangeRequest {
        client_id: required_string(body, "clientId")?,
        client_secret: required_string(body, "clientSecret")?,
    })
}

pub async fn create_service_account_credential(
    pg: &PgPool,
    tenant_id: &str,
    service_account_id: &str,
    created_by: &str,
    request: &ServiceAccountCredentialCreateRequest,
) -> Result<CreatedServiceAccountCredential, String> {
    let service_account = sqlx::query(
        "SELECT organization_id FROM iam_service_account \
         WHERE tenant_id = $1 AND id = $2 AND status = 'active' LIMIT 1",
    )
    .bind(tenant_id)
    .bind(service_account_id)
    .fetch_optional(pg)
    .await
    .map_err(|error| format!("load service account failed: {error}"))?
    .ok_or_else(|| "service account was not found or is inactive".to_string())?;
    let organization_id: Option<String> = service_account.get(0);

    let tenant_application = resolve_tenant_application(
        pg,
        tenant_id,
        Some(&request.tenant_application_id),
        None,
        None,
    )
    .await?
    .ok_or_else(|| "tenant application was not found".to_string())?;
    if tenant_application.status != "enabled" {
        return Err("tenant application must be enabled".to_string());
    }
    let normalized_account_org = organization_id.as_deref().unwrap_or("0");
    if tenant_application.organization_id != normalized_account_org {
        return Err("service account organization does not match tenant application".to_string());
    }

    let credential_id = uuid::Uuid::now_v7().to_string();
    let client_id = generate_opaque_token("client");
    let client_secret = generate_opaque_token("secret");
    let secret_hash = hash_secret(&client_secret)?;
    let now = chrono::Utc::now();

    sqlx::query(
        "INSERT INTO iam_service_account_credential \
         (id, tenant_id, organization_id, service_account_id, tenant_application_id, app_id, \
          client_id, secret_hash, secret_version, status, expires_at, created_by, created_at, updated_at) \
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 1, 'active', $9, $10, $11, $11)",
    )
    .bind(&credential_id)
    .bind(tenant_id)
    .bind(&organization_id)
    .bind(service_account_id)
    .bind(&tenant_application.id)
    .bind(&tenant_application.app_id)
    .bind(&client_id)
    .bind(&secret_hash)
    .bind(request.expires_at)
    .bind(created_by)
    .bind(now)
    .execute(pg)
    .await
    .map_err(|error| format!("create service account credential failed: {error}"))?;

    Ok(CreatedServiceAccountCredential {
        credential_id,
        client_id,
        client_secret,
        tenant_id: tenant_id.to_string(),
        organization_id,
        service_account_id: service_account_id.to_string(),
        tenant_application_id: tenant_application.id,
        app_id: tenant_application.app_id,
        expires_at: request.expires_at.map(|value| value.to_rfc3339()),
    })
}

pub async fn revoke_service_account_credential(
    pg: &PgPool,
    tenant_id: &str,
    credential_id: &str,
) -> Result<bool, String> {
    let mut transaction = pg
        .begin()
        .await
        .map_err(|error| format!("begin credential revocation failed: {error}"))?;
    let now = chrono::Utc::now();
    let updated = sqlx::query(
        "UPDATE iam_service_account_credential \
         SET status = 'revoked', revoked_at = $3, updated_at = $3 \
         WHERE tenant_id = $1 AND id = $2 AND status = 'active'",
    )
    .bind(tenant_id)
    .bind(credential_id)
    .bind(now)
    .execute(&mut *transaction)
    .await
    .map_err(|error| format!("revoke service account credential failed: {error}"))?;
    if updated.rows_affected() == 0 {
        transaction
            .rollback()
            .await
            .map_err(|error| format!("rollback credential revocation failed: {error}"))?;
        return Ok(false);
    }
    sqlx::query(
        "UPDATE iam_session SET revoked_at = $2, updated_at = $2 \
         WHERE credential_id = $1 AND revoked_at IS NULL",
    )
    .bind(credential_id)
    .bind(now)
    .execute(&mut *transaction)
    .await
    .map_err(|error| format!("revoke credential sessions failed: {error}"))?;
    transaction
        .commit()
        .await
        .map_err(|error| format!("commit credential revocation failed: {error}"))?;
    Ok(true)
}

pub async fn exchange_service_account_credential(
    pg: &PgPool,
    request: &ServiceAccountTokenExchangeRequest,
) -> Result<IssuedServiceAccountTokens, String> {
    let credential = load_active_credential(pg, &request.client_id).await?;
    verify_secret(&credential.secret_hash, &request.client_secret)?;

    let tenant_application = resolve_tenant_application(
        pg,
        &credential.tenant_id,
        Some(&credential.tenant_application_id),
        None,
        None,
    )
    .await?
    .ok_or_else(|| "bound tenant application was not found".to_string())?;
    if tenant_application.status != "enabled"
        || tenant_application.app_id != credential.app_id
        || tenant_application.organization_id
            != credential.organization_id.as_deref().unwrap_or("0")
    {
        return Err("bound tenant application is unavailable or no longer matches".to_string());
    }

    let (mut data_scope, service_permission_scope) = sdkwork_iam_bootstrap::resolve_session_scopes(
        pg,
        &credential.tenant_id,
        &credential.service_account_id,
        credential.organization_id.as_deref(),
    )
    .await?;
    data_scope.retain(|scope| !scope.starts_with("user:"));
    data_scope.push(format!("service_account:{}", credential.service_account_id));
    data_scope.sort();
    data_scope.dedup();
    let permission_scope = intersect_permission_scopes(
        &service_permission_scope,
        &tenant_application.access_permissions,
    )?;

    let environment = environment_from_string(&credential.environment);
    let session_id = generate_opaque_token("session");
    let context = IamAppContext::new(
        credential.tenant_id.clone(),
        credential.organization_id.as_deref(),
        credential.service_account_id.clone(),
        session_id.clone(),
        credential.app_id.clone(),
        environment,
        DeploymentMode::Saas,
        AuthLevel::System,
        data_scope,
        permission_scope,
    )
    .as_service_account(credential.service_account_id.clone());

    let signing_key = ensure_tenant_signing_key(pg, &credential.tenant_id).await?;
    let access_token = sign_local_session_token_with_ttl(
        &signing_key,
        "access",
        &context,
        SERVICE_ACCOUNT_TOKEN_TTL_SECONDS,
    );
    let auth_token = sign_local_session_token_with_ttl(
        &signing_key,
        "auth",
        &context,
        SERVICE_ACCOUNT_TOKEN_TTL_SECONDS,
    );
    let now = chrono::Utc::now();
    let expires_at = now + chrono::Duration::seconds(SERVICE_ACCOUNT_TOKEN_TTL_SECONDS as i64);

    let mut transaction = pg
        .begin()
        .await
        .map_err(|error| format!("begin token exchange failed: {error}"))?;
    sqlx::query(
        "INSERT INTO iam_session \
         (id, tenant_id, organization_id, login_scope, user_id, principal_kind, principal_id, \
          credential_id, app_id, environment, deployment_mode, auth_level, auth_token_hash, \
          auth_token_kid, access_token_hash, access_token_kid, sharding_key, sharding_strategy, \
          data_scope_json, permission_scope_json, expires_at, created_at, updated_at) \
         VALUES ($1, $2, $3, $4, NULL, 'service_account', $5, $6, $7, $8, $9, $10, \
                 $11, $12, $13, $12, $2, 'tenant', $14, $15, $16, $17, $17)",
    )
    .bind(&session_id)
    .bind(&credential.tenant_id)
    .bind(&credential.organization_id)
    .bind(login_scope_to_string(&context.login_scope))
    .bind(&credential.service_account_id)
    .bind(&credential.id)
    .bind(&credential.app_id)
    .bind(environment_to_string(&context.environment))
    .bind(deployment_mode_to_string(&context.deployment_mode))
    .bind(auth_level_to_string(&context.auth_level))
    .bind(hash_token(&auth_token))
    .bind(&signing_key.kid)
    .bind(hash_token(&access_token))
    .bind(Json(&context.data_scope))
    .bind(Json(&context.permission_scope))
    .bind(expires_at)
    .bind(now)
    .execute(&mut *transaction)
    .await
    .map_err(|error| format!("insert service account session failed: {error}"))?;
    sqlx::query(
        "UPDATE iam_service_account_credential SET last_used_at = $2, updated_at = $2 \
         WHERE id = $1 AND status = 'active'",
    )
    .bind(&credential.id)
    .bind(now)
    .execute(&mut *transaction)
    .await
    .map_err(|error| format!("update credential usage failed: {error}"))?;
    transaction
        .commit()
        .await
        .map_err(|error| format!("commit token exchange failed: {error}"))?;

    Ok(IssuedServiceAccountTokens {
        access_token,
        auth_token,
        token_type: "SDKWorkDualToken".to_string(),
        expires_in: SERVICE_ACCOUNT_TOKEN_TTL_SECONDS as u64,
        expires_at: expires_at.to_rfc3339(),
        session_id,
        tenant_id: credential.tenant_id,
        organization_id: credential.organization_id,
        service_account_id: credential.service_account_id,
        app_id: credential.app_id,
    })
}

pub fn created_service_account_credential_to_json(
    credential: &CreatedServiceAccountCredential,
) -> Value {
    json!({
        "credentialId": credential.credential_id,
        "clientId": credential.client_id,
        "clientSecret": credential.client_secret,
        "tenantId": credential.tenant_id,
        "organizationId": credential.organization_id,
        "serviceAccountId": credential.service_account_id,
        "tenantApplicationId": credential.tenant_application_id,
        "appId": credential.app_id,
        "expiresAt": credential.expires_at,
    })
}

pub fn issued_service_account_tokens_to_json(tokens: &IssuedServiceAccountTokens) -> Value {
    json!({
        "accessToken": tokens.access_token,
        "authToken": tokens.auth_token,
        "tokenType": tokens.token_type,
        "expiresIn": tokens.expires_in,
        "expiresAt": tokens.expires_at,
        "sessionId": tokens.session_id,
        "tenantId": tokens.tenant_id,
        "organizationId": tokens.organization_id,
        "serviceAccountId": tokens.service_account_id,
        "appId": tokens.app_id,
    })
}

async fn load_active_credential(pg: &PgPool, client_id: &str) -> Result<StoredCredential, String> {
    let row = sqlx::query(
        "SELECT c.id, c.tenant_id, c.organization_id, c.service_account_id, \
                c.tenant_application_id, c.app_id, c.secret_hash, ta.environment \
         FROM iam_service_account_credential c \
         JOIN iam_service_account sa ON sa.id = c.service_account_id \
           AND sa.tenant_id = c.tenant_id AND sa.status = 'active' \
         JOIN iam_tenant_application ta ON ta.id = c.tenant_application_id \
           AND ta.tenant_id = c.tenant_id AND ta.status = 'enabled' \
         WHERE c.client_id = $1 AND c.status = 'active' \
           AND (c.expires_at IS NULL OR c.expires_at > $2) LIMIT 1",
    )
    .bind(client_id)
    .bind(chrono::Utc::now())
    .fetch_optional(pg)
    .await
    .map_err(|error| format!("load service account credential failed: {error}"))?
    .ok_or_else(|| "invalid, expired, or revoked service account credential".to_string())?;
    Ok(StoredCredential {
        id: row.get(0),
        tenant_id: row.get(1),
        organization_id: row.get(2),
        service_account_id: row.get(3),
        tenant_application_id: row.get(4),
        app_id: row.get(5),
        secret_hash: row.get(6),
        environment: row.get(7),
    })
}

fn hash_secret(secret: &str) -> Result<String, String> {
    let salt = SaltString::generate(&mut OsRng);
    Argon2::default()
        .hash_password(secret.as_bytes(), &salt)
        .map(|hash| hash.to_string())
        .map_err(|error| format!("hash service account secret failed: {error}"))
}

fn verify_secret(secret_hash: &str, candidate: &str) -> Result<(), String> {
    let parsed = PasswordHash::new(secret_hash)
        .map_err(|_| "invalid, expired, or revoked service account credential".to_string())?;
    Argon2::default()
        .verify_password(candidate.as_bytes(), &parsed)
        .map_err(|_| "invalid, expired, or revoked service account credential".to_string())
}

fn required_string(body: &Value, field: &str) -> Result<String, String> {
    optional_string(body, field).ok_or_else(|| format!("{field} is required"))
}

fn optional_string(body: &Value, field: &str) -> Option<String> {
    body.get(field)
        .and_then(Value::as_str)
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .map(str::to_owned)
}

fn environment_from_string(value: &str) -> Environment {
    match value.trim().to_ascii_lowercase().as_str() {
        "prod" | "production" => Environment::Prod,
        "test" | "testing" => Environment::Test,
        _ => Environment::Dev,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn exchange_rejects_tenant_selector() {
        let result = parse_service_account_token_exchange_request(&json!({
            "clientId": "client",
            "clientSecret": "secret",
            "tenantId": "tenant-2"
        }));
        assert!(result.is_err());
    }

    #[test]
    fn secret_hash_never_contains_plaintext() {
        let secret = "sdkwork-secret-test-value";
        let hash = hash_secret(secret).expect("hash secret");
        assert!(!hash.contains(secret));
        assert!(verify_secret(&hash, secret).is_ok());
        assert!(verify_secret(&hash, "wrong").is_err());
    }
}
