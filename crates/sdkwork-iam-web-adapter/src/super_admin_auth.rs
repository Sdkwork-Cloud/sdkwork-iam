//! Super-admin authentication for backend access-token bootstrap flows.

use argon2::{Argon2, PasswordHash, PasswordVerifier};
use sdkwork_iam_context_service::{DeploymentMode, Environment, IamAppContext};
use serde_json::Value;
use sqlx::{PgPool, Row};
use std::path::{Path, PathBuf};

use crate::access_token_issue::IAM_ACCESS_CREDENTIALS_CREATE_PERMISSION;
use crate::application_registry::{
    IAM_APPLICATIONS_REGISTER_PERMISSION, IAM_TENANT_APPLICATIONS_ENABLE_PERMISSION,
    IAM_TENANT_APPLICATIONS_PROVISION_PERMISSION, IAM_TENANT_APPLICATIONS_UPDATE_PERMISSION,
};
use crate::iam_session::resolve_iam_app_context_from_auth_token;

const BOOTSTRAP_PERMISSIONS: &[&str] = &[
    IAM_ACCESS_CREDENTIALS_CREATE_PERMISSION,
    IAM_APPLICATIONS_REGISTER_PERMISSION,
    IAM_TENANT_APPLICATIONS_PROVISION_PERMISSION,
    IAM_TENANT_APPLICATIONS_UPDATE_PERMISSION,
    IAM_TENANT_APPLICATIONS_ENABLE_PERMISSION,
];

pub const SDKWORK_USERS_DIR_ENV: &str = "SDKWORK_USERS_DIR";
pub const SDKWORK_SUPER_ADMIN_PROFILE_ENV: &str = "SDKWORK_SUPER_ADMIN_PROFILE";
pub const SDKWORK_IAM_SUPER_ADMIN_PASSWORD_ENV: &str = "SDKWORK_IAM_SUPER_ADMIN_PASSWORD";
pub const SDKWORK_IAM_BOOTSTRAP_PASSWORD_ENV: &str = "SDKWORK_IAM_BOOTSTRAP_PASSWORD";

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct SuperAdminCredentials {
    pub account: String,
    pub password: String,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct AccessTokenActor {
    pub user_id: String,
    pub tenant_id: String,
    pub environment: Environment,
    pub deployment_mode: DeploymentMode,
}

impl AccessTokenActor {
    pub fn from_iam_context(context: &IamAppContext) -> Self {
        Self {
            user_id: context.user_id.clone(),
            tenant_id: context.tenant_id.clone(),
            environment: context.environment.clone(),
            deployment_mode: context.deployment_mode.clone(),
        }
    }
}

pub async fn resolve_bootstrap_actor(
    pg: &PgPool,
    body: &Value,
) -> Result<AccessTokenActor, String> {
    let actor = resolve_authenticated_actor(pg, body).await?;
    ensure_bootstrap_operator(pg, &actor).await?;
    Ok(actor)
}

pub async fn resolve_access_token_actor(
    pg: &PgPool,
    body: &Value,
) -> Result<AccessTokenActor, String> {
    resolve_bootstrap_actor(pg, body).await
}

async fn resolve_authenticated_actor(
    pg: &PgPool,
    body: &Value,
) -> Result<AccessTokenActor, String> {
    if let Some(auth_token) = read_optional_string(body, &["authToken", "auth_token"]) {
        let context = resolve_iam_app_context_from_auth_token(pg, &auth_token)
            .await
            .ok_or_else(|| "invalid or expired super admin auth token".to_string())?;
        return Ok(AccessTokenActor::from_iam_context(&context));
    }

    let credentials = resolve_super_admin_credentials(pg, body).await?;
    let user = authenticate_super_admin_password(pg, &credentials).await?;
    Ok(AccessTokenActor {
        user_id: user.id,
        tenant_id: user.tenant_id,
        environment: environment_from_env(),
        deployment_mode: deployment_mode_from_env(),
    })
}

async fn resolve_super_admin_credentials(
    pg: &PgPool,
    body: &Value,
) -> Result<SuperAdminCredentials, String> {
    if let (Some(account), Some(password)) = (
        read_optional_string(body, &["username", "email", "phone"]),
        read_optional_string(body, &["password"]),
    ) {
        return Ok(SuperAdminCredentials { account, password });
    }

    if let Some(password) = read_optional_string(body, &["password"]) {
        let owner = load_bootstrap_owner_account(pg).await?;
        return Ok(SuperAdminCredentials {
            account: owner,
            password,
        });
    }

    if let Some(stored) = load_super_admin_credentials_from_home()? {
        if stored.password.is_empty() {
            return Err("super admin password is empty in ~/.sdkwork/users profile".to_string());
        }
        let account = if crate::is_blank(Some(stored.account.as_str())) {
            load_bootstrap_owner_account(pg).await?
        } else {
            stored.account
        };
        return Ok(SuperAdminCredentials {
            account,
            password: stored.password,
        });
    }

    if allows_automatic_super_admin_auth() {
        if let Some(password) = super_admin_password_from_env() {
            let owner = load_bootstrap_owner_account(pg).await?;
            return Ok(SuperAdminCredentials {
                account: owner,
                password,
            });
        }
    }

    Err(
        "super admin authToken or username/password is required (or configure ~/.sdkwork/users in dev/deploy)"
            .to_string(),
    )
}

pub fn allows_automatic_super_admin_auth() -> bool {
    if crate::production_runtime::is_production_iam_deployment() {
        return false;
    }

    if crate::production_runtime::is_explicit_development_iam_deployment() {
        return true;
    }

    read_env_value(&["SDKWORK_IAM_ALLOW_SUPER_ADMIN_DB_AUTH"])
        .is_some_and(|value| matches!(value.as_str(), "1" | "true" | "TRUE" | "yes" | "YES"))
}

fn super_admin_password_from_env() -> Option<String> {
    read_env_value(&[
        SDKWORK_IAM_SUPER_ADMIN_PASSWORD_ENV,
        SDKWORK_IAM_BOOTSTRAP_PASSWORD_ENV,
    ])
}

fn environment_from_env() -> Environment {
    match read_env_value(&["SDKWORK_ENV"]).as_deref() {
        Some("dev") | Some("local") => Environment::Dev,
        Some("test") => Environment::Test,
        _ => Environment::Prod,
    }
}

fn deployment_mode_from_env() -> DeploymentMode {
    match read_env_value(&["SDKWORK_DEPLOYMENT_MODE"]).as_deref() {
        Some("local") => DeploymentMode::Local,
        Some("private") => DeploymentMode::Private,
        _ => DeploymentMode::Saas,
    }
}

struct StoredSuperAdminProfile {
    account: String,
    password: String,
}

fn load_super_admin_credentials_from_home() -> Result<Option<StoredSuperAdminProfile>, String> {
    let users_dir = sdkwork_users_dir()?;
    if !users_dir.is_dir() {
        return Ok(None);
    }

    let profile_name = read_env_value(&[SDKWORK_SUPER_ADMIN_PROFILE_ENV])
        .unwrap_or_else(|| "super-admin".to_owned());
    let profile_path = users_dir.join(format!("{profile_name}.json"));
    if profile_path.is_file() {
        return parse_super_admin_profile_file(&profile_path).map(Some);
    }

    let mut candidates = Vec::new();
    for entry in std::fs::read_dir(&users_dir)
        .map_err(|error| format!("read {} failed: {error}", users_dir.display()))?
    {
        let entry = entry.map_err(|error| format!("read users dir entry failed: {error}"))?;
        let path = entry.path();
        if path.extension().and_then(|ext| ext.to_str()) == Some("json") {
            candidates.push(path);
        }
    }
    candidates.sort();
    for path in candidates {
        if let Ok(profile) = parse_super_admin_profile_file(&path) {
            return Ok(Some(profile));
        }
    }
    Ok(None)
}

fn parse_super_admin_profile_file(path: &Path) -> Result<StoredSuperAdminProfile, String> {
    let raw = std::fs::read_to_string(path).map_err(|error| {
        format!(
            "read super admin profile {} failed: {error}",
            path.display()
        )
    })?;
    let value: Value = serde_json::from_str(&raw).map_err(|error| {
        format!(
            "parse super admin profile {} failed: {error}",
            path.display()
        )
    })?;
    let account = read_optional_string(&value, &["username", "email", "phone", "account"])
        .unwrap_or_default();
    let password = read_optional_string(&value, &["password"])
        .ok_or_else(|| format!("super admin profile {} is missing password", path.display()))?;
    Ok(StoredSuperAdminProfile { account, password })
}

fn sdkwork_users_dir() -> Result<PathBuf, String> {
    if let Some(path) = read_env_value(&[SDKWORK_USERS_DIR_ENV]) {
        return Ok(PathBuf::from(path));
    }
    let home = home_directory().ok_or_else(|| {
        "home directory is unavailable; set SDKWORK_USERS_DIR for super admin profiles".to_string()
    })?;
    Ok(home.join(".sdkwork").join("users"))
}

fn home_directory() -> Option<PathBuf> {
    if let Ok(home) = std::env::var("HOME") {
        if !crate::is_blank(Some(home.as_str())) {
            return Some(PathBuf::from(home));
        }
    }
    if let Ok(profile) = std::env::var("USERPROFILE") {
        if !crate::is_blank(Some(profile.as_str())) {
            return Some(PathBuf::from(profile));
        }
    }
    None
}

#[derive(Debug, Clone, PartialEq, Eq)]
struct AuthenticatedSuperAdmin {
    id: String,
    tenant_id: String,
}

async fn authenticate_super_admin_password(
    pg: &PgPool,
    credentials: &SuperAdminCredentials,
) -> Result<AuthenticatedSuperAdmin, String> {
    let account_key = credentials.account.trim().to_ascii_lowercase();
    if account_key.is_empty() || credentials.password.is_empty() {
        return Err("super admin account and password are required".to_string());
    }

    let rows = sqlx::query(
        "SELECT u.id, u.tenant_id, c.credential_hash \
         FROM iam_user u \
         JOIN iam_credential c ON c.user_id = u.id AND c.credential_type = 'password' AND c.status = 'active' \
         JOIN iam_tenant_member m ON m.tenant_id = u.tenant_id AND m.user_id = u.id AND m.status = 'active' \
         WHERE (LOWER(u.username) = $1 OR LOWER(u.email) = $1 OR u.phone = $1) \
           AND u.status = 'active' AND u.is_deleted = 0 \
         LIMIT $2",
    )
    .bind(&account_key)
    .bind(sdkwork_iam_bootstrap::limits::IAM_SUPER_ADMIN_AUTH_USER_ROW_LIMIT + 1)
    .fetch_all(pg)
    .await
    .map_err(|error| format!("load super admin credentials failed: {error}"))?;

    if rows.len() > sdkwork_iam_bootstrap::limits::IAM_SUPER_ADMIN_AUTH_USER_ROW_LIMIT as usize {
        return Err(format!(
            "super admin credential lookup exceeds limit of {}",
            sdkwork_iam_bootstrap::limits::IAM_SUPER_ADMIN_AUTH_USER_ROW_LIMIT
        ));
    }

    for row in rows {
        let user_id: String = row.get(0);
        let tenant_id: String = row.get(1);
        let password_hash: String = row.get(2);
        if verify_password(&password_hash, &credentials.password) {
            return Ok(AuthenticatedSuperAdmin {
                id: user_id,
                tenant_id,
            });
        }
    }

    Err("invalid super admin account or password".to_string())
}

async fn load_bootstrap_owner_account(pg: &PgPool) -> Result<String, String> {
    let row = sqlx::query(
        "SELECT COALESCE(NULLIF(TRIM(u.email), ''), NULLIF(TRIM(u.username), ''), u.id) AS account \
         FROM iam_user u \
         JOIN iam_organization_membership m \
           ON m.tenant_id = u.tenant_id AND m.user_id = u.id AND m.status = 'active' \
         WHERE u.status = 'active' AND u.is_deleted = 0 AND m.membership_kind = 'owner' \
         ORDER BY m.sort_order ASC, u.created_at ASC \
         LIMIT 1",
    )
    .fetch_optional(pg)
    .await
    .map_err(|error| format!("load bootstrap owner account failed: {error}"))?;

    row.map(|row| row.get::<String, _>(0))
        .filter(|account| !crate::is_blank(Some(account)))
        .ok_or_else(|| "bootstrap owner account was not found in IAM database".to_string())
}

pub fn ensure_actor_tenant_scope(
    actor: &AccessTokenActor,
    target_tenant_id: &str,
) -> Result<(), String> {
    if actor.tenant_id.trim() != target_tenant_id.trim() {
        return Err("bootstrap actor tenant does not match target tenant".to_string());
    }
    Ok(())
}

pub async fn ensure_bootstrap_permission(
    pg: &PgPool,
    actor: &AccessTokenActor,
    permission_code: &str,
) -> Result<(), String> {
    if user_is_owner(pg, &actor.tenant_id, &actor.user_id).await? {
        return Ok(());
    }
    if user_has_permission_code(pg, &actor.tenant_id, &actor.user_id, permission_code).await? {
        return Ok(());
    }
    Err(format!(
        "authenticated principal lacks bootstrap permission {permission_code}"
    ))
}

async fn ensure_bootstrap_operator(pg: &PgPool, actor: &AccessTokenActor) -> Result<(), String> {
    if user_is_owner(pg, &actor.tenant_id, &actor.user_id).await? {
        return Ok(());
    }
    for permission_code in BOOTSTRAP_PERMISSIONS {
        if user_has_permission_code(pg, &actor.tenant_id, &actor.user_id, permission_code).await? {
            return Ok(());
        }
    }
    Err("authenticated principal is not a bootstrap operator".to_string())
}

pub async fn ensure_super_admin_sync_actor(
    pg: &PgPool,
    actor: &AccessTokenActor,
) -> Result<(), String> {
    ensure_bootstrap_permission(pg, actor, IAM_APPLICATIONS_REGISTER_PERMISSION).await
}

async fn user_has_permission_code(
    pg: &PgPool,
    tenant_id: &str,
    user_id: &str,
    permission_code: &str,
) -> Result<bool, String> {
    sdkwork_iam_bootstrap::user_has_permission_code(pg, tenant_id, user_id, permission_code).await
}

async fn user_is_owner(pg: &PgPool, tenant_id: &str, user_id: &str) -> Result<bool, String> {
    let row = sqlx::query(
        "SELECT EXISTS ( \
           SELECT 1 FROM iam_organization_membership \
           WHERE tenant_id = $1 AND user_id = $2 AND status = 'active' AND membership_kind = 'owner' \
         ) AS is_owner",
    )
    .bind(tenant_id)
    .bind(user_id)
    .fetch_one(pg)
    .await
    .map_err(|error| format!("check owner membership failed: {error}"))?;

    Ok(row.get::<bool, _>(0))
}

fn verify_password(password_hash: &str, password: &str) -> bool {
    PasswordHash::new(password_hash).ok().is_some_and(|parsed| {
        Argon2::default()
            .verify_password(password.as_bytes(), &parsed)
            .is_ok()
    })
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

fn read_env_value(names: &[&str]) -> Option<String> {
    names.iter().find_map(|name| {
        std::env::var(name)
            .ok()
            .map(|value| value.trim().to_string())
            .filter(|value| !value.is_empty())
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use sdkwork_iam_context_service::{DeploymentMode, Environment};

    #[test]
    fn allows_automatic_super_admin_auth_in_dev_env() {
        let _env_lock = crate::test_env_lock::lock();
        std::env::remove_var("SDKWORK_IM_ENVIRONMENT");
        std::env::set_var("SDKWORK_ENV", "dev");
        assert!(allows_automatic_super_admin_auth());
        std::env::remove_var("SDKWORK_ENV");
    }

    #[test]
    fn ensure_actor_tenant_scope_rejects_cross_tenant_access() {
        let actor = AccessTokenActor {
            user_id: "1".to_owned(),
            tenant_id: "100001".to_owned(),
            environment: Environment::Dev,
            deployment_mode: DeploymentMode::Local,
        };
        let error = ensure_actor_tenant_scope(&actor, "100002").expect_err("cross tenant");
        assert!(error.contains("does not match"));
    }

    #[test]
    fn parses_super_admin_profile_json() {
        let dir = std::env::temp_dir().join(format!("sdkwork-users-test-{}", uuid::Uuid::now_v7()));
        std::fs::create_dir_all(&dir).expect("create temp users dir");
        let profile_path = dir.join("super-admin.json");
        std::fs::write(
            &profile_path,
            r#"{"username":"admin@sdkwork.com","password":"ConfiguredPass#2026"}"#,
        )
        .expect("write profile");

        let profile = parse_super_admin_profile_file(&profile_path).expect("parse profile");
        assert_eq!(profile.account, "admin@sdkwork.com");
        assert_eq!(profile.password, "ConfiguredPass#2026");

        let _ = std::fs::remove_dir_all(&dir);
    }
}
