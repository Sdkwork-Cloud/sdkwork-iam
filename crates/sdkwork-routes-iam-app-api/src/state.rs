use std::sync::Arc;

use sdkwork_database_sqlx::DatabasePool;
use serde_json::Value;

use crate::password_session_bridge::PasswordSessionBridge;
use crate::utils::*;

/// Deployment configuration for the embedded local IAM router.
#[derive(Clone)]
pub(crate) struct LocalIamConfig {
    pub(crate) environment: String,
    pub(crate) dev_fixed_verify_code: Option<String>,
    // Security policies (configurable via env vars)
    pub(crate) password_min_length: usize,
    pub(crate) password_max_length: usize,
    pub(crate) password_require_complexity: bool,
    pub(crate) password_history_count: usize,
    pub(crate) login_max_attempts: u32,
    pub(crate) login_lockout_minutes: u32,
    pub(crate) rate_limit_window_seconds: u32,
    pub(crate) rate_limit_max_requests: u32,
    pub(crate) email_verification_required: bool,
    #[allow(dead_code)]
    pub(crate) email_verification_code_ttl_minutes: u32,
    pub(crate) contact_binding_enabled: Option<bool>,
    pub(crate) oauth_binding_enabled: Option<bool>,
    pub(crate) oauth_login_enabled: Option<bool>,
}

#[derive(Clone)]
pub(crate) struct LocalConfiguredOrganization {
    pub(crate) id: String,
    pub(crate) name: String,
}

// ── Data types ────────────────────────────────────────────────────

#[derive(Clone)]
pub(crate) struct LocalIamUser {
    pub(crate) display_name: String,
    pub(crate) email: Option<String>,
    pub(crate) email_verified: bool,
    pub(crate) id: String,
    #[allow(dead_code)]
    pub(crate) last_login_at: Option<String>,
    #[allow(dead_code)]
    pub(crate) password_changed_at: Option<String>,
    pub(crate) phone: Option<String>,
    pub(crate) phone_verified: bool,
    pub(crate) tenant_id: String,
    pub(crate) username: String,
}

#[derive(Clone)]
pub(crate) struct LocalSession {
    pub(crate) access_token: String,
    pub(crate) auth_token: String,
    pub(crate) context: sdkwork_iam_context_service::IamAppContext,
    pub(crate) refresh_token: String,
    pub(crate) session_id: String,
    pub(crate) user: LocalIamUser,
}

#[derive(Clone)]
#[allow(dead_code)]
pub(crate) struct LocalCredential {
    pub(crate) password_hash: String,
    pub(crate) user: LocalIamUser,
}

#[derive(Clone)]
pub(crate) struct LocalOrganization {
    pub(crate) app_boundary_enabled: bool,
    pub(crate) data_boundary_kind: String,
    pub(crate) id: String,
    pub(crate) name: String,
    pub(crate) order: i64,
    pub(crate) organization_kind: String,
    pub(crate) parent_organization_id: Option<String>,
    pub(crate) status: String,
    pub(crate) tenant_boundary_kind: String,
    pub(crate) tenant_id: String,
    pub(crate) verification_status: String,
}

#[derive(Clone)]
pub(crate) struct LocalOrganizationMembership {
    pub(crate) id: String,
    pub(crate) membership_type: String,
    pub(crate) order: i64,
    pub(crate) organization_id: String,
    pub(crate) primary: bool,
    pub(crate) status: String,
    pub(crate) tenant_id: String,
    pub(crate) user: LocalIamUser,
    pub(crate) user_id: String,
}

#[derive(Clone)]
pub(crate) struct LocalDepartment {
    pub(crate) id: String,
    pub(crate) name: String,
    pub(crate) order: i64,
    pub(crate) organization_id: String,
    pub(crate) parent_department_id: Option<String>,
    pub(crate) status: String,
    pub(crate) tenant_id: String,
}

#[derive(Clone)]
pub(crate) struct LocalDepartmentAssignment {
    pub(crate) assignment_type: String,
    pub(crate) department_id: String,
    pub(crate) id: String,
    pub(crate) order: i64,
    pub(crate) organization_id: String,
    pub(crate) organization_membership_id: String,
    pub(crate) status: String,
    pub(crate) tenant_id: String,
    pub(crate) user: LocalIamUser,
    pub(crate) user_id: String,
}

#[derive(Clone)]
pub(crate) struct LocalPosition {
    pub(crate) id: String,
    pub(crate) name: String,
    pub(crate) order: i64,
    pub(crate) organization_id: String,
    pub(crate) status: String,
    pub(crate) tenant_id: String,
}

#[derive(Clone)]
pub(crate) struct LocalPositionAssignment {
    pub(crate) department_assignment_id: String,
    pub(crate) department_id: String,
    pub(crate) id: String,
    pub(crate) order: i64,
    pub(crate) organization_id: String,
    pub(crate) position_id: String,
    pub(crate) position_name: String,
    pub(crate) status: String,
    pub(crate) tenant_id: String,
    pub(crate) user_id: String,
}

#[derive(Clone)]
pub(crate) struct LocalRoleBinding {
    pub(crate) id: String,
    pub(crate) order: i64,
    pub(crate) principal_id: String,
    pub(crate) role_code: String,
    pub(crate) scope_id: String,
    pub(crate) scope_kind: String,
    pub(crate) status: String,
    pub(crate) tenant_id: String,
}

#[derive(Clone)]
pub(crate) struct LocalPasswordResetRequest {
    pub(crate) code: String,
    pub(crate) expire_time: u128,
    pub(crate) username: String,
}

#[derive(Clone)]
pub(crate) struct LocalLoginContinuation {
    pub(crate) continuation_kind: String,
    pub(crate) expire_time: u128,
    pub(crate) organization_ids: Vec<String>,
    pub(crate) qr_session_key: Option<String>,
    pub(crate) runtime_app_id: String,
    pub(crate) tenant_id: String,
    pub(crate) user: LocalIamUser,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub(crate) enum SessionContextSwitch {
    Personal,
    Organization(String),
}

#[derive(Clone)]
pub(crate) struct LocalQrSession {
    pub(crate) completed_session: Option<LocalSession>,
    pub(crate) expire_time: u128,
    pub(crate) fallback_url: String,
    pub(crate) organization_selection: Option<Value>,
    pub(crate) poll_secret: String,
    pub(crate) purpose: String,
    pub(crate) qr_content: String,
    pub(crate) qr_content_mode: String,
    pub(crate) session_exchanged: bool,
    pub(crate) session_key: String,
    pub(crate) status: String,
}

// ── State ──────────────────────────────────────────────────────────

/// Fully database-driven IAM state.
///
/// Persistent data and short-lived ephemeral artifacts (login continuations,
/// password reset challenges, QR sessions, rate limits) are stored in PostgreSQL.
#[derive(Clone)]
pub(crate) struct LocalIamState {
    pub(crate) pool: DatabasePool,
    pub(crate) config: LocalIamConfig,
    pub(crate) oauth_login: crate::oauth_login::OAuthLoginContext,
    pub(crate) password_session_bridge: Option<Arc<dyn PasswordSessionBridge>>,
}

impl LocalIamState {
    fn new(
        pool: DatabasePool,
        config: LocalIamConfig,
        password_session_bridge: Option<Arc<dyn PasswordSessionBridge>>,
    ) -> Self {
        let oauth_login = crate::oauth_login::OAuthLoginContext::new();
        Self {
            pool,
            config,
            oauth_login,
            password_session_bridge,
        }
    }

    pub async fn from_env() -> Result<Self, String> {
        let config = LocalIamConfig::from_env();
        let host = sdkwork_iam_database_host::bootstrap_iam_database_from_env().await?;
        backfill_tenant_members(host.pool()).await?;
        repair_legacy_opaque_user_ids(host.pool()).await?;
        Ok(Self::new(host.pool().clone(), config, None))
    }

    pub async fn from_pool(pool: DatabasePool) -> Result<Self, String> {
        let config = LocalIamConfig::from_env();
        let host = sdkwork_iam_database_host::bootstrap_iam_database(pool).await?;
        backfill_tenant_members(host.pool()).await?;
        repair_legacy_opaque_user_ids(host.pool()).await?;
        Ok(Self::new(host.pool().clone(), config, None))
    }

    /// Lightweight IAM state for product runtimes that already installed IAM schema
    /// (for example Claw Router SQLite) and only need ephemeral/device-authorization routes.
    pub async fn from_pool_for_oauth_device_routes(pool: DatabasePool) -> Result<Self, String> {
        Self::from_pool_for_oauth_device_routes_with_password_session_bridge(pool, None).await
    }

    pub async fn from_pool_for_oauth_device_routes_with_password_session_bridge(
        pool: DatabasePool,
        password_session_bridge: Option<Arc<dyn PasswordSessionBridge>>,
    ) -> Result<Self, String> {
        ensure_ephemeral_artifact_table(&pool).await?;
        Ok(Self::new(
            pool,
            LocalIamConfig::from_env(),
            password_session_bridge,
        ))
    }
}

async fn ensure_ephemeral_artifact_table(pool: &DatabasePool) -> Result<(), String> {
    match pool {
        DatabasePool::Postgres(pg, _) => {
            sqlx::query("SELECT 1 FROM iam_ephemeral_artifact WHERE artifact_key = $1 LIMIT 1")
                .bind("__schema_probe__")
                .fetch_optional(pg)
                .await
                .map_err(|error| {
                    format!("iam_ephemeral_artifact table is unavailable on postgres: {error}")
                })?;
        }
        DatabasePool::Sqlite(sqlite, _) => {
            sqlx::query("SELECT 1 FROM iam_ephemeral_artifact WHERE artifact_key = ? LIMIT 1")
                .bind("__schema_probe__")
                .fetch_optional(sqlite)
                .await
                .map_err(|error| {
                    format!("iam_ephemeral_artifact table is unavailable on sqlite: {error}")
                })?;
        }
    }
    Ok(())
}

// ── Tenant backfill ───────────────────────────────────────────────

async fn repair_legacy_opaque_user_ids(pool: &DatabasePool) -> Result<(), String> {
    match pool {
        DatabasePool::Postgres(pg, _) => {
            sdkwork_iam_bootstrap::repair_postgres_legacy_opaque_iam_user_ids(pg)
                .await
                .map_err(|error| format!("repair legacy IAM user ids failed: {error}"))?;
        }
        DatabasePool::Sqlite(sqlite, _) => {
            sdkwork_iam_bootstrap::repair_sqlite_legacy_opaque_iam_user_ids(sqlite)
                .await
                .map_err(|error| format!("repair legacy IAM user ids failed: {error}"))?;
        }
    }
    Ok(())
}

async fn backfill_tenant_members(pool: &DatabasePool) -> Result<(), String> {
    let Some(pg) = pool.as_postgres() else {
        return Ok(());
    };
    let tenant_ids = sqlx::query_scalar::<_, String>(
        "SELECT id FROM iam_tenant WHERE status = 'active' ORDER BY id",
    )
    .fetch_all(pg)
    .await
    .map_err(|error| format!("list active tenants failed: {error}"))?;
    for tenant_id in tenant_ids {
        crate::directory::backfill_tenant_members(pg, &tenant_id).await?;
        crate::tokens::maintain_tenant_signing_keys(pg, &tenant_id).await?;
    }
    Ok(())
}

// ── Config ─────────────────────────────────────────────────────────

impl LocalIamConfig {
    fn from_env() -> Self {
        let environment = first_env_value(&[
            "SDKWORK_ENVIRONMENT",
            "SDKWORK_LIFECYCLE_ENVIRONMENT",
            "CRAW_CHAT_ENVIRONMENT",
        ])
        .unwrap_or_else(|| "dev".to_string());
        let dev_fixed_verify_code = first_env_value(&["SDKWORK_IAM_DEV_FIXED_VERIFY_CODE"]);

        Self {
            environment,
            dev_fixed_verify_code,
            // Security policies
            password_min_length: env_parse::<usize>("SDKWORK_IAM_PASSWORD_MIN_LENGTH", 8),
            password_max_length: env_parse::<usize>("SDKWORK_IAM_PASSWORD_MAX_LENGTH", 64),
            password_require_complexity: env_parse("SDKWORK_IAM_PASSWORD_REQUIRE_COMPLEXITY", true),
            password_history_count: env_parse::<usize>("SDKWORK_IAM_PASSWORD_HISTORY_COUNT", 3),
            login_max_attempts: env_parse::<u32>("SDKWORK_IAM_LOGIN_MAX_ATTEMPTS", 5),
            login_lockout_minutes: env_parse::<u32>("SDKWORK_IAM_LOGIN_LOCKOUT_MINUTES", 15),
            rate_limit_window_seconds: env_parse::<u32>(
                "SDKWORK_IAM_RATE_LIMIT_WINDOW_SECONDS",
                60,
            ),
            rate_limit_max_requests: env_parse::<u32>("SDKWORK_IAM_RATE_LIMIT_MAX_REQUESTS", 10),
            email_verification_required: env_parse(
                "SDKWORK_IAM_EMAIL_VERIFICATION_REQUIRED",
                false,
            ),
            email_verification_code_ttl_minutes: env_parse::<u32>(
                "SDKWORK_IAM_EMAIL_VERIFICATION_CODE_TTL_MINUTES",
                10,
            ),
            contact_binding_enabled: parse_optional_env_bool("SDKWORK_IAM_CONTACT_BINDING_ENABLED"),
            oauth_binding_enabled: parse_optional_env_bool("SDKWORK_IAM_OAUTH_BINDING_ENABLED"),
            oauth_login_enabled: parse_optional_env_bool("SDKWORK_IAM_OAUTH_LOGIN_ENABLED"),
        }
    }

    pub(crate) fn account_binding_policy_overrides(
        &self,
    ) -> sdkwork_iam_web_adapter::AccountBindingPolicyOverrides {
        sdkwork_iam_web_adapter::AccountBindingPolicyOverrides {
            contact_binding_enabled: self.contact_binding_enabled,
            oauth_binding_enabled: self.oauth_binding_enabled,
            oauth_login_enabled: self.oauth_login_enabled,
        }
    }
}
