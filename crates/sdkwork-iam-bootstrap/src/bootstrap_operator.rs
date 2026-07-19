//! Bootstrap operator (platform super-admin) provisioning for IAM database initialization.
//!
//! Creates the canonical default admin user when an explicit bootstrap password is configured.
//! Passwords must never be embedded in SQL seeds; use `SDKWORK_IAM_SUPER_ADMIN_PASSWORD` or
//! `SDKWORK_IAM_BOOTSTRAP_PASSWORD`.

use argon2::password_hash::{rand_core::OsRng, PasswordHasher, SaltString};
use argon2::Argon2;
use chrono::Utc;
use sdkwork_iam_context_service::{
    APP_USER_ROLE_CODE, ORG_ADMIN_ROLE_CODE, PLATFORM_SUPER_ADMIN_ROLE_CODE,
};
use sqlx::{PgPool, SqlitePool};

use crate::{
    ensure_role_assignment_allowed, standard_role_id, upsert_postgres_standard_roles,
    upsert_sqlite_standard_roles, DEFAULT_BOOTSTRAP_ADMIN_DISPLAY_NAME,
    DEFAULT_BOOTSTRAP_ADMIN_EMAIL, DEFAULT_BOOTSTRAP_ADMIN_ORGANIZATION_CODE,
    DEFAULT_BOOTSTRAP_ADMIN_ORGANIZATION_ID, DEFAULT_BOOTSTRAP_ADMIN_ORGANIZATION_MEMBERSHIP_ID,
    DEFAULT_BOOTSTRAP_ADMIN_ORGANIZATION_NAME, DEFAULT_BOOTSTRAP_ADMIN_ORGANIZATION_PATH,
    DEFAULT_BOOTSTRAP_ADMIN_ORGANIZATION_ROOT_CLOSURE_ID,
    DEFAULT_BOOTSTRAP_ADMIN_ORGANIZATION_SELF_CLOSURE_ID, DEFAULT_BOOTSTRAP_ADMIN_USERNAME,
    DEFAULT_BOOTSTRAP_ADMIN_USER_ID, DEFAULT_BOOTSTRAP_MANAGER_DISPLAY_NAME,
    DEFAULT_BOOTSTRAP_MANAGER_EMAIL, DEFAULT_BOOTSTRAP_MANAGER_ORGANIZATION_MEMBERSHIP_ID,
    DEFAULT_BOOTSTRAP_MANAGER_USERNAME, DEFAULT_BOOTSTRAP_MANAGER_USER_ID,
    DEFAULT_IAM_ORGANIZATION_ID, DEFAULT_IAM_TENANT_ID,
};

pub const SDKWORK_IAM_SUPER_ADMIN_PASSWORD_ENV: &str = "SDKWORK_IAM_SUPER_ADMIN_PASSWORD";
pub const SDKWORK_IAM_BOOTSTRAP_PASSWORD_ENV: &str = "SDKWORK_IAM_BOOTSTRAP_PASSWORD";
pub const SDKWORK_IAM_MANAGER_PASSWORD_ENV: &str = "SDKWORK_IAM_MANAGER_PASSWORD";

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum BootstrapAdminUserOutcome {
    Created,
    SkippedExistingOwner,
    /// The admin subject and authorization were provisioned, but no password credential was set.
    SkippedMissingPassword,
}

pub fn resolve_bootstrap_admin_password_from_env() -> Option<String> {
    read_env_trimmed(SDKWORK_IAM_SUPER_ADMIN_PASSWORD_ENV)
        .or_else(|| read_env_trimmed(SDKWORK_IAM_BOOTSTRAP_PASSWORD_ENV))
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum BootstrapManagerUserOutcome {
    Created,
    SkippedExistingManager,
    SkippedMissingPassword,
}

pub fn resolve_bootstrap_manager_password_from_env() -> Option<String> {
    read_env_trimmed(SDKWORK_IAM_MANAGER_PASSWORD_ENV)
        .or_else(|| read_env_trimmed(SDKWORK_IAM_BOOTSTRAP_PASSWORD_ENV))
}

pub async fn ensure_postgres_bootstrap_admin_user(
    pool: &PgPool,
) -> Result<BootstrapAdminUserOutcome, sqlx::Error> {
    let password = resolve_bootstrap_admin_password_from_env();
    if postgres_bootstrap_admin_is_fully_provisioned(pool, DEFAULT_IAM_TENANT_ID).await? {
        return Ok(BootstrapAdminUserOutcome::SkippedExistingOwner);
    }

    let now = Utc::now();
    let root_membership_id = bootstrap_owner_membership_id(DEFAULT_BOOTSTRAP_ADMIN_USER_ID);
    let admin_membership_id = DEFAULT_BOOTSTRAP_ADMIN_ORGANIZATION_MEMBERSHIP_ID;

    upsert_postgres_standard_roles(pool, DEFAULT_IAM_TENANT_ID).await?;
    ensure_postgres_bootstrap_admin_organization(pool, &now).await?;

    sqlx::query(
        "INSERT INTO iam_user (id, tenant_id, username, display_name, email, phone, \
         email_verified, phone_verified, status, is_deleted, created_at, updated_at) \
         VALUES ($1, $2, $3, $4, $5, NULL, 1, 0, 'active', 0, $6, $6) \
         ON CONFLICT (tenant_id, username) DO UPDATE SET \
           display_name = EXCLUDED.display_name, \
           email = EXCLUDED.email, \
           status = 'active', \
           is_deleted = 0, \
           updated_at = EXCLUDED.updated_at",
    )
    .bind(DEFAULT_BOOTSTRAP_ADMIN_USER_ID)
    .bind(DEFAULT_IAM_TENANT_ID)
    .bind(DEFAULT_BOOTSTRAP_ADMIN_USERNAME)
    .bind(DEFAULT_BOOTSTRAP_ADMIN_DISPLAY_NAME)
    .bind(DEFAULT_BOOTSTRAP_ADMIN_EMAIL)
    .bind(&now)
    .execute(pool)
    .await?;

    if let Some(password) = password.as_deref() {
        let password_hash = hash_password(password);
        sqlx::query(
            "INSERT INTO iam_credential (id, tenant_id, user_id, credential_type, credential_hash, \
             failed_attempts, status, created_at, updated_at) \
             VALUES ($1, $2, $3, 'password', $4, 0, 'active', $5, $5) \
             ON CONFLICT (tenant_id, user_id, credential_type) DO UPDATE SET \
               credential_hash = EXCLUDED.credential_hash, \
               status = 'active', \
               updated_at = EXCLUDED.updated_at",
        )
        .bind(bootstrap_credential_id(DEFAULT_BOOTSTRAP_ADMIN_USER_ID))
        .bind(DEFAULT_IAM_TENANT_ID)
        .bind(DEFAULT_BOOTSTRAP_ADMIN_USER_ID)
        .bind(&password_hash)
        .bind(&now)
        .execute(pool)
        .await?;
    }

    sqlx::query(
        "INSERT INTO iam_tenant_member (id, tenant_id, user_id, member_kind, status, joined_at, created_at, updated_at) \
         VALUES ($1, $2, $3, 'owner', 'active', $4, $4, $4) \
         ON CONFLICT (tenant_id, user_id, member_kind) DO UPDATE SET \
           status = 'active', updated_at = EXCLUDED.updated_at",
    )
    .bind(bootstrap_tenant_member_id(DEFAULT_BOOTSTRAP_ADMIN_USER_ID))
    .bind(DEFAULT_IAM_TENANT_ID)
    .bind(DEFAULT_BOOTSTRAP_ADMIN_USER_ID)
    .bind(&now)
    .execute(pool)
    .await?;

    sqlx::query(
        "INSERT INTO iam_organization_membership (id, tenant_id, organization_id, user_id, \
         membership_kind, is_primary, status, joined_at, created_at, updated_at) \
         VALUES ($1, $2, $3, $4, 'owner', 0, 'active', $5, $5, $5) \
         ON CONFLICT (tenant_id, organization_id, user_id, membership_kind) DO UPDATE SET \
           status = 'active', is_primary = 0, updated_at = EXCLUDED.updated_at",
    )
    .bind(&root_membership_id)
    .bind(DEFAULT_IAM_TENANT_ID)
    .bind(DEFAULT_IAM_ORGANIZATION_ID)
    .bind(DEFAULT_BOOTSTRAP_ADMIN_USER_ID)
    .bind(&now)
    .execute(pool)
    .await?;

    ensure_postgres_bootstrap_admin_membership(
        pool,
        admin_membership_id,
        DEFAULT_BOOTSTRAP_ADMIN_USER_ID,
        &now,
    )
    .await?;

    ensure_postgres_bootstrap_role_bindings(
        pool,
        DEFAULT_IAM_TENANT_ID,
        DEFAULT_BOOTSTRAP_ADMIN_ORGANIZATION_ID,
        admin_membership_id,
        DEFAULT_BOOTSTRAP_ADMIN_USER_ID,
        &now,
    )
    .await
    .map_err(|error| sqlx::Error::Protocol(error))?;

    Ok(if password.is_some() {
        BootstrapAdminUserOutcome::Created
    } else {
        BootstrapAdminUserOutcome::SkippedMissingPassword
    })
}

pub async fn ensure_sqlite_bootstrap_admin_user(
    pool: &SqlitePool,
) -> Result<BootstrapAdminUserOutcome, sqlx::Error> {
    let password = resolve_bootstrap_admin_password_from_env();
    if sqlite_bootstrap_admin_is_fully_provisioned(pool, DEFAULT_IAM_TENANT_ID).await? {
        return Ok(BootstrapAdminUserOutcome::SkippedExistingOwner);
    }

    let now = Utc::now().to_rfc3339();
    let root_membership_id = bootstrap_owner_membership_id(DEFAULT_BOOTSTRAP_ADMIN_USER_ID);
    let admin_membership_id = DEFAULT_BOOTSTRAP_ADMIN_ORGANIZATION_MEMBERSHIP_ID;

    upsert_sqlite_standard_roles(pool, DEFAULT_IAM_TENANT_ID).await?;
    ensure_sqlite_bootstrap_admin_organization(pool, &now).await?;

    sqlx::query(
        "INSERT INTO iam_user (id, tenant_id, username, display_name, email, phone, \
         email_verified, phone_verified, status, is_deleted, created_at, updated_at) \
         VALUES (?, ?, ?, ?, ?, NULL, 1, 0, 'active', 0, ?, ?) \
         ON CONFLICT(tenant_id, username) DO UPDATE SET \
           display_name = excluded.display_name, \
           email = excluded.email, \
           status = 'active', \
           is_deleted = 0, \
           updated_at = excluded.updated_at",
    )
    .bind(DEFAULT_BOOTSTRAP_ADMIN_USER_ID)
    .bind(DEFAULT_IAM_TENANT_ID)
    .bind(DEFAULT_BOOTSTRAP_ADMIN_USERNAME)
    .bind(DEFAULT_BOOTSTRAP_ADMIN_DISPLAY_NAME)
    .bind(DEFAULT_BOOTSTRAP_ADMIN_EMAIL)
    .bind(&now)
    .bind(&now)
    .execute(pool)
    .await?;

    if let Some(password) = password.as_deref() {
        let password_hash = hash_password(password);
        sqlx::query(
            "INSERT INTO iam_credential (id, tenant_id, user_id, credential_type, credential_hash, \
             failed_attempts, status, created_at, updated_at) \
             VALUES (?, ?, ?, 'password', ?, 0, 'active', ?, ?) \
             ON CONFLICT(tenant_id, user_id, credential_type) DO UPDATE SET \
               credential_hash = excluded.credential_hash, \
               status = 'active', \
               updated_at = excluded.updated_at",
        )
        .bind(bootstrap_credential_id(DEFAULT_BOOTSTRAP_ADMIN_USER_ID))
        .bind(DEFAULT_IAM_TENANT_ID)
        .bind(DEFAULT_BOOTSTRAP_ADMIN_USER_ID)
        .bind(&password_hash)
        .bind(&now)
        .bind(&now)
        .execute(pool)
        .await?;
    }

    sqlx::query(
        "INSERT INTO iam_tenant_member (id, tenant_id, user_id, member_kind, status, joined_at, created_at, updated_at) \
         VALUES (?, ?, ?, 'owner', 'active', ?, ?, ?) \
         ON CONFLICT(tenant_id, user_id, member_kind) DO UPDATE SET \
           status = 'active', updated_at = excluded.updated_at",
    )
    .bind(bootstrap_tenant_member_id(DEFAULT_BOOTSTRAP_ADMIN_USER_ID))
    .bind(DEFAULT_IAM_TENANT_ID)
    .bind(DEFAULT_BOOTSTRAP_ADMIN_USER_ID)
    .bind(&now)
    .bind(&now)
    .bind(&now)
    .execute(pool)
    .await?;

    sqlx::query(
        "INSERT INTO iam_organization_membership (id, tenant_id, organization_id, user_id, \
         membership_kind, is_primary, status, joined_at, created_at, updated_at) \
         VALUES (?, ?, ?, ?, 'owner', 0, 'active', ?, ?, ?) \
         ON CONFLICT(tenant_id, organization_id, user_id, membership_kind) DO UPDATE SET \
           status = 'active', is_primary = 0, updated_at = excluded.updated_at",
    )
    .bind(&root_membership_id)
    .bind(DEFAULT_IAM_TENANT_ID)
    .bind(DEFAULT_IAM_ORGANIZATION_ID)
    .bind(DEFAULT_BOOTSTRAP_ADMIN_USER_ID)
    .bind(&now)
    .bind(&now)
    .bind(&now)
    .execute(pool)
    .await?;

    ensure_sqlite_bootstrap_admin_membership(
        pool,
        admin_membership_id,
        DEFAULT_BOOTSTRAP_ADMIN_USER_ID,
        &now,
    )
    .await?;

    ensure_sqlite_bootstrap_role_bindings(
        pool,
        DEFAULT_IAM_TENANT_ID,
        DEFAULT_BOOTSTRAP_ADMIN_ORGANIZATION_ID,
        admin_membership_id,
        DEFAULT_BOOTSTRAP_ADMIN_USER_ID,
        &now,
    )
    .await
    .map_err(|error| sqlx::Error::Protocol(error))?;

    Ok(if password.is_some() {
        BootstrapAdminUserOutcome::Created
    } else {
        BootstrapAdminUserOutcome::SkippedMissingPassword
    })
}

pub async fn ensure_postgres_bootstrap_manager_user(
    pool: &PgPool,
) -> Result<BootstrapManagerUserOutcome, sqlx::Error> {
    let Some(password) = resolve_bootstrap_manager_password_from_env() else {
        return Ok(BootstrapManagerUserOutcome::SkippedMissingPassword);
    };
    let manager_exists = postgres_tenant_has_bootstrap_manager(pool, DEFAULT_IAM_TENANT_ID).await?;

    let now = Utc::now();
    let password_hash = hash_password(&password);
    let root_membership_id = bootstrap_member_membership_id(DEFAULT_BOOTSTRAP_MANAGER_USER_ID);

    upsert_postgres_standard_roles(pool, DEFAULT_IAM_TENANT_ID).await?;
    ensure_postgres_bootstrap_admin_organization(pool, &now).await?;

    sqlx::query(
        "INSERT INTO iam_user (id, tenant_id, username, display_name, email, phone, \
         email_verified, phone_verified, status, is_deleted, created_at, updated_at) \
         VALUES ($1, $2, $3, $4, $5, NULL, 1, 0, 'active', 0, $6, $6) \
         ON CONFLICT (tenant_id, username) DO UPDATE SET \
           display_name = EXCLUDED.display_name, \
           email = EXCLUDED.email, \
           status = 'active', \
           is_deleted = 0, \
           updated_at = EXCLUDED.updated_at",
    )
    .bind(DEFAULT_BOOTSTRAP_MANAGER_USER_ID)
    .bind(DEFAULT_IAM_TENANT_ID)
    .bind(DEFAULT_BOOTSTRAP_MANAGER_USERNAME)
    .bind(DEFAULT_BOOTSTRAP_MANAGER_DISPLAY_NAME)
    .bind(DEFAULT_BOOTSTRAP_MANAGER_EMAIL)
    .bind(&now)
    .execute(pool)
    .await?;

    sqlx::query(
        "INSERT INTO iam_credential (id, tenant_id, user_id, credential_type, credential_hash, \
         failed_attempts, status, created_at, updated_at) \
         VALUES ($1, $2, $3, 'password', $4, 0, 'active', $5, $5) \
         ON CONFLICT (tenant_id, user_id, credential_type) DO UPDATE SET \
           credential_hash = EXCLUDED.credential_hash, \
           status = 'active', \
           updated_at = EXCLUDED.updated_at",
    )
    .bind(bootstrap_credential_id(DEFAULT_BOOTSTRAP_MANAGER_USER_ID))
    .bind(DEFAULT_IAM_TENANT_ID)
    .bind(DEFAULT_BOOTSTRAP_MANAGER_USER_ID)
    .bind(&password_hash)
    .bind(&now)
    .execute(pool)
    .await?;

    sqlx::query(
        "INSERT INTO iam_tenant_member (id, tenant_id, user_id, member_kind, status, joined_at, created_at, updated_at) \
         VALUES ($1, $2, $3, 'member', 'active', $4, $4, $4) \
         ON CONFLICT (tenant_id, user_id, member_kind) DO UPDATE SET \
           status = 'active', updated_at = EXCLUDED.updated_at",
    )
    .bind(bootstrap_member_tenant_member_id(DEFAULT_BOOTSTRAP_MANAGER_USER_ID))
    .bind(DEFAULT_IAM_TENANT_ID)
    .bind(DEFAULT_BOOTSTRAP_MANAGER_USER_ID)
    .bind(&now)
    .execute(pool)
    .await?;

    sqlx::query(
        "INSERT INTO iam_organization_membership (id, tenant_id, organization_id, user_id, \
         membership_kind, is_primary, status, joined_at, created_at, updated_at) \
         VALUES ($1, $2, $3, $4, 'member', 0, 'active', $5, $5, $5) \
         ON CONFLICT (tenant_id, organization_id, user_id, membership_kind) DO UPDATE SET \
           status = 'active', updated_at = EXCLUDED.updated_at",
    )
    .bind(&root_membership_id)
    .bind(DEFAULT_IAM_TENANT_ID)
    .bind(DEFAULT_IAM_ORGANIZATION_ID)
    .bind(DEFAULT_BOOTSTRAP_MANAGER_USER_ID)
    .bind(&now)
    .execute(pool)
    .await?;

    ensure_postgres_bootstrap_manager_membership(
        pool,
        DEFAULT_BOOTSTRAP_MANAGER_ORGANIZATION_MEMBERSHIP_ID,
        DEFAULT_BOOTSTRAP_MANAGER_USER_ID,
        &now,
    )
    .await?;
    retire_postgres_legacy_manager_tenant_org_admin_binding(
        pool,
        DEFAULT_IAM_TENANT_ID,
        DEFAULT_BOOTSTRAP_MANAGER_USER_ID,
        &now,
    )
    .await?;
    ensure_postgres_bootstrap_manager_role_bindings(
        pool,
        DEFAULT_IAM_TENANT_ID,
        DEFAULT_BOOTSTRAP_ADMIN_ORGANIZATION_ID,
        DEFAULT_BOOTSTRAP_MANAGER_ORGANIZATION_MEMBERSHIP_ID,
        DEFAULT_BOOTSTRAP_MANAGER_USER_ID,
        &now,
    )
    .await
    .map_err(|error| sqlx::Error::Protocol(error))?;

    Ok(if manager_exists {
        BootstrapManagerUserOutcome::SkippedExistingManager
    } else {
        BootstrapManagerUserOutcome::Created
    })
}

pub async fn ensure_sqlite_bootstrap_manager_user(
    pool: &SqlitePool,
) -> Result<BootstrapManagerUserOutcome, sqlx::Error> {
    let Some(password) = resolve_bootstrap_manager_password_from_env() else {
        return Ok(BootstrapManagerUserOutcome::SkippedMissingPassword);
    };
    let manager_exists = sqlite_tenant_has_bootstrap_manager(pool, DEFAULT_IAM_TENANT_ID).await?;

    let now = Utc::now().to_rfc3339();
    let password_hash = hash_password(&password);
    let root_membership_id = bootstrap_member_membership_id(DEFAULT_BOOTSTRAP_MANAGER_USER_ID);

    upsert_sqlite_standard_roles(pool, DEFAULT_IAM_TENANT_ID).await?;
    ensure_sqlite_bootstrap_admin_organization(pool, &now).await?;

    sqlx::query(
        "INSERT INTO iam_user (id, tenant_id, username, display_name, email, phone, \
         email_verified, phone_verified, status, is_deleted, created_at, updated_at) \
         VALUES (?, ?, ?, ?, ?, NULL, 1, 0, 'active', 0, ?, ?) \
         ON CONFLICT(tenant_id, username) DO UPDATE SET \
           display_name = excluded.display_name, \
           email = excluded.email, \
           status = 'active', \
           is_deleted = 0, \
           updated_at = excluded.updated_at",
    )
    .bind(DEFAULT_BOOTSTRAP_MANAGER_USER_ID)
    .bind(DEFAULT_IAM_TENANT_ID)
    .bind(DEFAULT_BOOTSTRAP_MANAGER_USERNAME)
    .bind(DEFAULT_BOOTSTRAP_MANAGER_DISPLAY_NAME)
    .bind(DEFAULT_BOOTSTRAP_MANAGER_EMAIL)
    .bind(&now)
    .bind(&now)
    .execute(pool)
    .await?;

    sqlx::query(
        "INSERT INTO iam_credential (id, tenant_id, user_id, credential_type, credential_hash, \
         failed_attempts, status, created_at, updated_at) \
         VALUES (?, ?, ?, 'password', ?, 0, 'active', ?, ?) \
         ON CONFLICT(tenant_id, user_id, credential_type) DO UPDATE SET \
           credential_hash = excluded.credential_hash, \
           status = 'active', \
           updated_at = excluded.updated_at",
    )
    .bind(bootstrap_credential_id(DEFAULT_BOOTSTRAP_MANAGER_USER_ID))
    .bind(DEFAULT_IAM_TENANT_ID)
    .bind(DEFAULT_BOOTSTRAP_MANAGER_USER_ID)
    .bind(&password_hash)
    .bind(&now)
    .bind(&now)
    .execute(pool)
    .await?;

    sqlx::query(
        "INSERT INTO iam_tenant_member (id, tenant_id, user_id, member_kind, status, joined_at, created_at, updated_at) \
         VALUES (?, ?, ?, 'member', 'active', ?, ?, ?) \
         ON CONFLICT(tenant_id, user_id, member_kind) DO UPDATE SET \
           status = 'active', updated_at = excluded.updated_at",
    )
    .bind(bootstrap_member_tenant_member_id(DEFAULT_BOOTSTRAP_MANAGER_USER_ID))
    .bind(DEFAULT_IAM_TENANT_ID)
    .bind(DEFAULT_BOOTSTRAP_MANAGER_USER_ID)
    .bind(&now)
    .bind(&now)
    .bind(&now)
    .execute(pool)
    .await?;

    sqlx::query(
        "INSERT INTO iam_organization_membership (id, tenant_id, organization_id, user_id, \
         membership_kind, is_primary, status, joined_at, created_at, updated_at) \
         VALUES (?, ?, ?, ?, 'member', 0, 'active', ?, ?, ?) \
         ON CONFLICT(tenant_id, organization_id, user_id, membership_kind) DO UPDATE SET \
           status = 'active', updated_at = excluded.updated_at",
    )
    .bind(&root_membership_id)
    .bind(DEFAULT_IAM_TENANT_ID)
    .bind(DEFAULT_IAM_ORGANIZATION_ID)
    .bind(DEFAULT_BOOTSTRAP_MANAGER_USER_ID)
    .bind(&now)
    .bind(&now)
    .bind(&now)
    .execute(pool)
    .await?;

    ensure_sqlite_bootstrap_manager_membership(
        pool,
        DEFAULT_BOOTSTRAP_MANAGER_ORGANIZATION_MEMBERSHIP_ID,
        DEFAULT_BOOTSTRAP_MANAGER_USER_ID,
        &now,
    )
    .await?;
    retire_sqlite_legacy_manager_tenant_org_admin_binding(
        pool,
        DEFAULT_IAM_TENANT_ID,
        DEFAULT_BOOTSTRAP_MANAGER_USER_ID,
        &now,
    )
    .await?;
    ensure_sqlite_bootstrap_manager_role_bindings(
        pool,
        DEFAULT_IAM_TENANT_ID,
        DEFAULT_BOOTSTRAP_ADMIN_ORGANIZATION_ID,
        DEFAULT_BOOTSTRAP_MANAGER_ORGANIZATION_MEMBERSHIP_ID,
        DEFAULT_BOOTSTRAP_MANAGER_USER_ID,
        &now,
    )
    .await
    .map_err(|error| sqlx::Error::Protocol(error))?;

    Ok(if manager_exists {
        BootstrapManagerUserOutcome::SkippedExistingManager
    } else {
        BootstrapManagerUserOutcome::Created
    })
}

async fn postgres_tenant_has_bootstrap_manager(
    pool: &PgPool,
    tenant_id: &str,
) -> Result<bool, sqlx::Error> {
    let count: i64 = sqlx::query_scalar(
        "SELECT COUNT(*)::bigint FROM iam_organization_membership \
         WHERE tenant_id = $1 AND user_id = $2 AND membership_kind = 'member' AND status = 'active'",
    )
    .bind(tenant_id)
    .bind(DEFAULT_BOOTSTRAP_MANAGER_USER_ID)
    .fetch_one(pool)
    .await?;
    Ok(count > 0)
}

async fn sqlite_tenant_has_bootstrap_manager(
    pool: &SqlitePool,
    tenant_id: &str,
) -> Result<bool, sqlx::Error> {
    let count: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM iam_organization_membership \
         WHERE tenant_id = ? AND user_id = ? AND membership_kind = 'member' AND status = 'active'",
    )
    .bind(tenant_id)
    .bind(DEFAULT_BOOTSTRAP_MANAGER_USER_ID)
    .fetch_one(pool)
    .await?;
    Ok(count > 0)
}

async fn ensure_postgres_bootstrap_admin_organization(
    pool: &PgPool,
    now: &chrono::DateTime<chrono::Utc>,
) -> Result<(), sqlx::Error> {
    sqlx::query(
        "INSERT INTO iam_organization \
         (id, tenant_id, parent_organization_id, code, name, path, status, organization_kind, \
          tenant_boundary_kind, data_boundary_kind, app_boundary_enabled, verification_status, \
          created_at, updated_at) \
         VALUES ($1, $2, $3, $4, $5, $6, 'active', 'team', 'exclusive', 'organization', 0, \
          'verified', $7, $7) \
         ON CONFLICT (id) DO UPDATE SET tenant_id = EXCLUDED.tenant_id, \
          parent_organization_id = EXCLUDED.parent_organization_id, code = EXCLUDED.code, \
          name = EXCLUDED.name, path = EXCLUDED.path, status = 'active', \
          organization_kind = EXCLUDED.organization_kind, \
          tenant_boundary_kind = EXCLUDED.tenant_boundary_kind, \
          data_boundary_kind = EXCLUDED.data_boundary_kind, \
          verification_status = EXCLUDED.verification_status, updated_at = EXCLUDED.updated_at",
    )
    .bind(DEFAULT_BOOTSTRAP_ADMIN_ORGANIZATION_ID)
    .bind(DEFAULT_IAM_TENANT_ID)
    .bind(DEFAULT_IAM_ORGANIZATION_ID)
    .bind(DEFAULT_BOOTSTRAP_ADMIN_ORGANIZATION_CODE)
    .bind(DEFAULT_BOOTSTRAP_ADMIN_ORGANIZATION_NAME)
    .bind(DEFAULT_BOOTSTRAP_ADMIN_ORGANIZATION_PATH)
    .bind(now)
    .execute(pool)
    .await?;

    for (closure_id, ancestor_id, depth) in [
        (
            DEFAULT_BOOTSTRAP_ADMIN_ORGANIZATION_ROOT_CLOSURE_ID,
            DEFAULT_IAM_ORGANIZATION_ID,
            1_i32,
        ),
        (
            DEFAULT_BOOTSTRAP_ADMIN_ORGANIZATION_SELF_CLOSURE_ID,
            DEFAULT_BOOTSTRAP_ADMIN_ORGANIZATION_ID,
            0_i32,
        ),
    ] {
        sqlx::query(
            "INSERT INTO iam_organization_closure \
             (id, tenant_id, ancestor_organization_id, descendant_organization_id, depth, created_at) \
             VALUES ($1, $2, $3, $4, $5, $6) \
             ON CONFLICT (tenant_id, ancestor_organization_id, descendant_organization_id) \
             DO UPDATE SET depth = EXCLUDED.depth",
        )
        .bind(closure_id)
        .bind(DEFAULT_IAM_TENANT_ID)
        .bind(ancestor_id)
        .bind(DEFAULT_BOOTSTRAP_ADMIN_ORGANIZATION_ID)
        .bind(depth)
        .bind(now)
        .execute(pool)
        .await?;
    }
    Ok(())
}

async fn ensure_sqlite_bootstrap_admin_organization(
    pool: &SqlitePool,
    now: &str,
) -> Result<(), sqlx::Error> {
    sqlx::query(
        "INSERT INTO iam_organization \
         (id, tenant_id, parent_organization_id, code, name, path, status, organization_kind, \
          tenant_boundary_kind, data_boundary_kind, app_boundary_enabled, verification_status, \
          created_at, updated_at) \
         VALUES (?, ?, ?, ?, ?, ?, 'active', 'team', 'exclusive', 'organization', 0, \
          'verified', ?, ?) \
         ON CONFLICT(id) DO UPDATE SET tenant_id = excluded.tenant_id, \
          parent_organization_id = excluded.parent_organization_id, code = excluded.code, \
          name = excluded.name, path = excluded.path, status = 'active', \
          organization_kind = excluded.organization_kind, \
          tenant_boundary_kind = excluded.tenant_boundary_kind, \
          data_boundary_kind = excluded.data_boundary_kind, \
          verification_status = excluded.verification_status, updated_at = excluded.updated_at",
    )
    .bind(DEFAULT_BOOTSTRAP_ADMIN_ORGANIZATION_ID)
    .bind(DEFAULT_IAM_TENANT_ID)
    .bind(DEFAULT_IAM_ORGANIZATION_ID)
    .bind(DEFAULT_BOOTSTRAP_ADMIN_ORGANIZATION_CODE)
    .bind(DEFAULT_BOOTSTRAP_ADMIN_ORGANIZATION_NAME)
    .bind(DEFAULT_BOOTSTRAP_ADMIN_ORGANIZATION_PATH)
    .bind(now)
    .bind(now)
    .execute(pool)
    .await?;

    for (closure_id, ancestor_id, depth) in [
        (
            DEFAULT_BOOTSTRAP_ADMIN_ORGANIZATION_ROOT_CLOSURE_ID,
            DEFAULT_IAM_ORGANIZATION_ID,
            1_i32,
        ),
        (
            DEFAULT_BOOTSTRAP_ADMIN_ORGANIZATION_SELF_CLOSURE_ID,
            DEFAULT_BOOTSTRAP_ADMIN_ORGANIZATION_ID,
            0_i32,
        ),
    ] {
        sqlx::query(
            "INSERT INTO iam_organization_closure \
             (id, tenant_id, ancestor_organization_id, descendant_organization_id, depth, created_at) \
             VALUES (?, ?, ?, ?, ?, ?) \
             ON CONFLICT(tenant_id, ancestor_organization_id, descendant_organization_id) \
             DO UPDATE SET depth = excluded.depth",
        )
        .bind(closure_id)
        .bind(DEFAULT_IAM_TENANT_ID)
        .bind(ancestor_id)
        .bind(DEFAULT_BOOTSTRAP_ADMIN_ORGANIZATION_ID)
        .bind(depth)
        .bind(now)
        .execute(pool)
        .await?;
    }
    Ok(())
}

async fn ensure_postgres_bootstrap_admin_membership(
    pool: &PgPool,
    membership_id: &str,
    user_id: &str,
    now: &chrono::DateTime<chrono::Utc>,
) -> Result<(), sqlx::Error> {
    sqlx::query(
        "INSERT INTO iam_organization_membership (id, tenant_id, organization_id, user_id, \
         membership_kind, is_primary, status, joined_at, created_at, updated_at) \
         VALUES ($1, $2, $3, $4, 'owner', 1, 'active', $5, $5, $5) \
         ON CONFLICT (tenant_id, organization_id, user_id, membership_kind) DO UPDATE SET \
         status = 'active', is_primary = 1, updated_at = EXCLUDED.updated_at",
    )
    .bind(membership_id)
    .bind(DEFAULT_IAM_TENANT_ID)
    .bind(DEFAULT_BOOTSTRAP_ADMIN_ORGANIZATION_ID)
    .bind(user_id)
    .bind(now)
    .execute(pool)
    .await?;
    Ok(())
}

async fn ensure_sqlite_bootstrap_admin_membership(
    pool: &SqlitePool,
    membership_id: &str,
    user_id: &str,
    now: &str,
) -> Result<(), sqlx::Error> {
    sqlx::query(
        "INSERT INTO iam_organization_membership (id, tenant_id, organization_id, user_id, \
         membership_kind, is_primary, status, joined_at, created_at, updated_at) \
         VALUES (?, ?, ?, ?, 'owner', 1, 'active', ?, ?, ?) \
         ON CONFLICT(tenant_id, organization_id, user_id, membership_kind) DO UPDATE SET \
         status = 'active', is_primary = 1, updated_at = excluded.updated_at",
    )
    .bind(membership_id)
    .bind(DEFAULT_IAM_TENANT_ID)
    .bind(DEFAULT_BOOTSTRAP_ADMIN_ORGANIZATION_ID)
    .bind(user_id)
    .bind(now)
    .bind(now)
    .bind(now)
    .execute(pool)
    .await?;
    Ok(())
}

async fn ensure_postgres_bootstrap_manager_membership(
    pool: &PgPool,
    membership_id: &str,
    user_id: &str,
    now: &chrono::DateTime<chrono::Utc>,
) -> Result<(), sqlx::Error> {
    sqlx::query(
        "INSERT INTO iam_organization_membership (id, tenant_id, organization_id, user_id, \
         membership_kind, is_primary, status, joined_at, created_at, updated_at) \
         VALUES ($1, $2, $3, $4, 'admin', 1, 'active', $5, $5, $5) \
         ON CONFLICT (tenant_id, organization_id, user_id, membership_kind) DO UPDATE SET \
         status = 'active', is_primary = 1, updated_at = EXCLUDED.updated_at",
    )
    .bind(membership_id)
    .bind(DEFAULT_IAM_TENANT_ID)
    .bind(DEFAULT_BOOTSTRAP_ADMIN_ORGANIZATION_ID)
    .bind(user_id)
    .bind(now)
    .execute(pool)
    .await?;
    Ok(())
}

async fn ensure_sqlite_bootstrap_manager_membership(
    pool: &SqlitePool,
    membership_id: &str,
    user_id: &str,
    now: &str,
) -> Result<(), sqlx::Error> {
    sqlx::query(
        "INSERT INTO iam_organization_membership (id, tenant_id, organization_id, user_id, \
         membership_kind, is_primary, status, joined_at, created_at, updated_at) \
         VALUES (?, ?, ?, ?, 'admin', 1, 'active', ?, ?, ?) \
         ON CONFLICT(tenant_id, organization_id, user_id, membership_kind) DO UPDATE SET \
         status = 'active', is_primary = 1, updated_at = excluded.updated_at",
    )
    .bind(membership_id)
    .bind(DEFAULT_IAM_TENANT_ID)
    .bind(DEFAULT_BOOTSTRAP_ADMIN_ORGANIZATION_ID)
    .bind(user_id)
    .bind(now)
    .bind(now)
    .bind(now)
    .execute(pool)
    .await?;
    Ok(())
}

async fn retire_postgres_legacy_manager_tenant_org_admin_binding(
    pool: &PgPool,
    tenant_id: &str,
    user_id: &str,
    now: &chrono::DateTime<chrono::Utc>,
) -> Result<(), sqlx::Error> {
    sqlx::query(
        "UPDATE iam_role_binding SET status = 'inactive', updated_at = $1 \
         WHERE tenant_id = $2 AND principal_kind = 'user' AND principal_id = $3 \
           AND scope_kind = 'tenant' AND scope_id = $2 AND role_id = $4",
    )
    .bind(now)
    .bind(tenant_id)
    .bind(user_id)
    .bind(standard_role_id(tenant_id, ORG_ADMIN_ROLE_CODE))
    .execute(pool)
    .await?;
    sqlx::query(
        "UPDATE iam_role_binding SET status = 'inactive', updated_at = $1 \
         WHERE tenant_id = $2 AND principal_kind = 'organization_membership' \
           AND principal_id IN (SELECT id FROM iam_organization_membership \
             WHERE tenant_id = $2 AND user_id = $3 AND organization_id = $4) \
           AND scope_kind = 'organization' AND scope_id = $4 AND role_id = $5",
    )
    .bind(now)
    .bind(tenant_id)
    .bind(user_id)
    .bind(DEFAULT_IAM_ORGANIZATION_ID)
    .bind(standard_role_id(tenant_id, ORG_ADMIN_ROLE_CODE))
    .execute(pool)
    .await?;
    Ok(())
}

async fn retire_sqlite_legacy_manager_tenant_org_admin_binding(
    pool: &SqlitePool,
    tenant_id: &str,
    user_id: &str,
    now: &str,
) -> Result<(), sqlx::Error> {
    sqlx::query(
        "UPDATE iam_role_binding SET status = 'inactive', updated_at = ? \
         WHERE tenant_id = ? AND principal_kind = 'user' AND principal_id = ? \
           AND scope_kind = 'tenant' AND scope_id = ? AND role_id = ?",
    )
    .bind(now)
    .bind(tenant_id)
    .bind(user_id)
    .bind(tenant_id)
    .bind(standard_role_id(tenant_id, ORG_ADMIN_ROLE_CODE))
    .execute(pool)
    .await?;
    sqlx::query(
        "UPDATE iam_role_binding SET status = 'inactive', updated_at = ? \
         WHERE tenant_id = ? AND principal_kind = 'organization_membership' \
           AND principal_id IN (SELECT id FROM iam_organization_membership \
             WHERE tenant_id = ? AND user_id = ? AND organization_id = ?) \
           AND scope_kind = 'organization' AND scope_id = ? AND role_id = ?",
    )
    .bind(now)
    .bind(tenant_id)
    .bind(tenant_id)
    .bind(user_id)
    .bind(DEFAULT_IAM_ORGANIZATION_ID)
    .bind(DEFAULT_IAM_ORGANIZATION_ID)
    .bind(standard_role_id(tenant_id, ORG_ADMIN_ROLE_CODE))
    .execute(pool)
    .await?;
    Ok(())
}

async fn ensure_postgres_bootstrap_manager_role_bindings(
    pool: &PgPool,
    tenant_id: &str,
    organization_id: &str,
    membership_id: &str,
    user_id: &str,
    now: &chrono::DateTime<chrono::Utc>,
) -> Result<(), String> {
    for role_code in [ORG_ADMIN_ROLE_CODE, APP_USER_ROLE_CODE] {
        if role_code == APP_USER_ROLE_CODE || organization_id == DEFAULT_IAM_ORGANIZATION_ID {
            ensure_postgres_tenant_user_role_binding(pool, tenant_id, user_id, role_code, now)
                .await?;
            continue;
        }
        ensure_postgres_organization_role_binding(
            pool,
            tenant_id,
            organization_id,
            membership_id,
            role_code,
            now,
        )
        .await?;
    }
    Ok(())
}

async fn ensure_sqlite_bootstrap_manager_role_bindings(
    pool: &SqlitePool,
    tenant_id: &str,
    organization_id: &str,
    membership_id: &str,
    user_id: &str,
    now: &str,
) -> Result<(), String> {
    for role_code in [ORG_ADMIN_ROLE_CODE, APP_USER_ROLE_CODE] {
        if role_code == APP_USER_ROLE_CODE || organization_id == DEFAULT_IAM_ORGANIZATION_ID {
            ensure_sqlite_tenant_user_role_binding(pool, tenant_id, user_id, role_code, now)
                .await?;
            continue;
        }
        ensure_sqlite_organization_role_binding(
            pool,
            tenant_id,
            organization_id,
            membership_id,
            role_code,
            now,
        )
        .await?;
    }
    Ok(())
}

async fn postgres_bootstrap_admin_is_fully_provisioned(
    pool: &PgPool,
    tenant_id: &str,
) -> Result<bool, sqlx::Error> {
    let count: i64 = sqlx::query_scalar(
        "SELECT COUNT(*)::bigint \
         FROM iam_user u \
         JOIN iam_tenant_member tm \
           ON tm.tenant_id = u.tenant_id AND tm.user_id = u.id \
          AND tm.member_kind = 'owner' AND tm.status = 'active' \
         JOIN iam_organization_membership om \
           ON om.tenant_id = u.tenant_id AND om.user_id = u.id \
          AND om.organization_id = $3 AND om.membership_kind = 'owner' AND om.status = 'active' \
         JOIN iam_role_binding orb \
           ON orb.tenant_id = u.tenant_id AND orb.organization_id = om.organization_id \
          AND orb.principal_kind = 'organization_membership' AND orb.principal_id = om.id \
          AND orb.scope_kind = 'organization' AND orb.scope_id = om.organization_id \
          AND orb.effect = 'allow' AND orb.status = 'active' \
         JOIN iam_role organization_role \
           ON organization_role.id = orb.role_id AND organization_role.tenant_id = u.tenant_id \
          AND organization_role.code = $6 AND organization_role.status = 'active' \
         JOIN iam_credential c \
           ON c.tenant_id = u.tenant_id AND c.user_id = u.id \
          AND c.credential_type = 'password' AND c.status = 'active' \
         JOIN iam_role_binding rb \
           ON rb.tenant_id = u.tenant_id AND rb.principal_kind = 'user' \
          AND rb.principal_id = u.id AND rb.scope_kind = 'tenant' \
          AND rb.scope_id = u.tenant_id AND rb.effect = 'allow' AND rb.status = 'active' \
         JOIN iam_role r \
           ON r.id = rb.role_id AND r.tenant_id = u.tenant_id \
          AND r.code = $4 AND r.status = 'active' \
         JOIN iam_role_permission rp ON rp.tenant_id = u.tenant_id AND rp.role_id = r.id \
         JOIN iam_permission p ON p.id = rp.permission_id AND p.code = '*' \
         WHERE u.tenant_id = $1 AND u.id = $2 AND lower(u.email) = lower($5) \
           AND u.status = 'active' AND u.is_deleted = 0",
    )
    .bind(tenant_id)
    .bind(DEFAULT_BOOTSTRAP_ADMIN_USER_ID)
    .bind(DEFAULT_BOOTSTRAP_ADMIN_ORGANIZATION_ID)
    .bind(PLATFORM_SUPER_ADMIN_ROLE_CODE)
    .bind(DEFAULT_BOOTSTRAP_ADMIN_EMAIL)
    .bind(ORG_ADMIN_ROLE_CODE)
    .fetch_one(pool)
    .await?;
    Ok(count > 0)
}

async fn sqlite_bootstrap_admin_is_fully_provisioned(
    pool: &SqlitePool,
    tenant_id: &str,
) -> Result<bool, sqlx::Error> {
    let count: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) \
         FROM iam_user u \
         JOIN iam_tenant_member tm \
           ON tm.tenant_id = u.tenant_id AND tm.user_id = u.id \
          AND tm.member_kind = 'owner' AND tm.status = 'active' \
         JOIN iam_organization_membership om \
           ON om.tenant_id = u.tenant_id AND om.user_id = u.id \
          AND om.organization_id = ? AND om.membership_kind = 'owner' AND om.status = 'active' \
         JOIN iam_role_binding orb \
           ON orb.tenant_id = u.tenant_id AND orb.organization_id = om.organization_id \
          AND orb.principal_kind = 'organization_membership' AND orb.principal_id = om.id \
          AND orb.scope_kind = 'organization' AND orb.scope_id = om.organization_id \
          AND orb.effect = 'allow' AND orb.status = 'active' \
         JOIN iam_role organization_role \
           ON organization_role.id = orb.role_id AND organization_role.tenant_id = u.tenant_id \
          AND organization_role.code = ? AND organization_role.status = 'active' \
         JOIN iam_credential c \
           ON c.tenant_id = u.tenant_id AND c.user_id = u.id \
          AND c.credential_type = 'password' AND c.status = 'active' \
         JOIN iam_role_binding rb \
           ON rb.tenant_id = u.tenant_id AND rb.principal_kind = 'user' \
          AND rb.principal_id = u.id AND rb.scope_kind = 'tenant' \
          AND rb.scope_id = u.tenant_id AND rb.effect = 'allow' AND rb.status = 'active' \
         JOIN iam_role r \
           ON r.id = rb.role_id AND r.tenant_id = u.tenant_id \
          AND r.code = ? AND r.status = 'active' \
         JOIN iam_role_permission rp ON rp.tenant_id = u.tenant_id AND rp.role_id = r.id \
         JOIN iam_permission p ON p.id = rp.permission_id AND p.code = '*' \
         WHERE u.tenant_id = ? AND u.id = ? AND lower(u.email) = lower(?) \
           AND u.status = 'active' AND u.is_deleted = 0",
    )
    .bind(DEFAULT_BOOTSTRAP_ADMIN_ORGANIZATION_ID)
    .bind(ORG_ADMIN_ROLE_CODE)
    .bind(PLATFORM_SUPER_ADMIN_ROLE_CODE)
    .bind(tenant_id)
    .bind(DEFAULT_BOOTSTRAP_ADMIN_USER_ID)
    .bind(DEFAULT_BOOTSTRAP_ADMIN_EMAIL)
    .fetch_one(pool)
    .await?;
    Ok(count > 0)
}

async fn ensure_postgres_bootstrap_role_bindings(
    pool: &PgPool,
    tenant_id: &str,
    organization_id: &str,
    membership_id: &str,
    user_id: &str,
    now: &chrono::DateTime<chrono::Utc>,
) -> Result<(), String> {
    for role_code in [
        ORG_ADMIN_ROLE_CODE,
        PLATFORM_SUPER_ADMIN_ROLE_CODE,
        APP_USER_ROLE_CODE,
    ] {
        if role_code == APP_USER_ROLE_CODE || role_code == PLATFORM_SUPER_ADMIN_ROLE_CODE {
            ensure_postgres_tenant_user_role_binding(pool, tenant_id, user_id, role_code, now)
                .await?;
            continue;
        }
        ensure_postgres_organization_role_binding(
            pool,
            tenant_id,
            organization_id,
            membership_id,
            role_code,
            now,
        )
        .await?;
    }
    Ok(())
}

async fn ensure_sqlite_bootstrap_role_bindings(
    pool: &SqlitePool,
    tenant_id: &str,
    organization_id: &str,
    membership_id: &str,
    user_id: &str,
    now: &str,
) -> Result<(), String> {
    for role_code in [
        ORG_ADMIN_ROLE_CODE,
        PLATFORM_SUPER_ADMIN_ROLE_CODE,
        APP_USER_ROLE_CODE,
    ] {
        if role_code == APP_USER_ROLE_CODE || role_code == PLATFORM_SUPER_ADMIN_ROLE_CODE {
            ensure_sqlite_tenant_user_role_binding(pool, tenant_id, user_id, role_code, now)
                .await?;
            continue;
        }
        ensure_sqlite_organization_role_binding(
            pool,
            tenant_id,
            organization_id,
            membership_id,
            role_code,
            now,
        )
        .await?;
    }
    Ok(())
}

async fn ensure_postgres_organization_role_binding(
    pool: &PgPool,
    tenant_id: &str,
    organization_id: &str,
    membership_id: &str,
    role_code: &str,
    now: &chrono::DateTime<chrono::Utc>,
) -> Result<(), String> {
    ensure_role_assignment_allowed(
        pool,
        tenant_id,
        "organization_membership",
        membership_id,
        "organization",
        organization_id,
        role_code,
    )
    .await?;

    let role_id = standard_role_id(tenant_id, role_code);
    let binding_id =
        bootstrap_role_binding_id(membership_id, "organization", organization_id, role_code);
    sqlx::query(
        "INSERT INTO iam_role_binding (id, tenant_id, organization_id, role_id, principal_kind, \
         principal_id, scope_kind, scope_id, effect, status, created_at, updated_at) \
         VALUES ($1, $2, $3, $4, 'organization_membership', $5, 'organization', $6, 'allow', \
         'active', $7, $8) \
         ON CONFLICT (tenant_id, role_id, principal_kind, principal_id, scope_kind, scope_id) \
         DO UPDATE SET organization_id = EXCLUDED.organization_id, effect = 'allow', \
           status = 'active', updated_at = EXCLUDED.updated_at",
    )
    .bind(&binding_id)
    .bind(tenant_id)
    .bind(organization_id)
    .bind(&role_id)
    .bind(membership_id)
    .bind(organization_id)
    .bind(now)
    .bind(now)
    .execute(pool)
    .await
    .map_err(|error| format!("ensure organization role binding failed: {error}"))?;
    Ok(())
}

async fn ensure_postgres_tenant_user_role_binding(
    pool: &PgPool,
    tenant_id: &str,
    user_id: &str,
    role_code: &str,
    now: &chrono::DateTime<chrono::Utc>,
) -> Result<(), String> {
    let role_id = standard_role_id(tenant_id, role_code);
    let binding_id = bootstrap_role_binding_id(user_id, "tenant", tenant_id, role_code);
    sqlx::query(
        "INSERT INTO iam_role_binding (id, tenant_id, organization_id, role_id, principal_kind, \
         principal_id, scope_kind, scope_id, effect, status, created_at, updated_at) \
         VALUES ($1, $2, '0', $3, 'user', $4, 'tenant', $5, 'allow', 'active', $6, $7) \
         ON CONFLICT (tenant_id, role_id, principal_kind, principal_id, scope_kind, scope_id) \
         DO UPDATE SET organization_id = EXCLUDED.organization_id, effect = 'allow', \
           status = 'active', updated_at = EXCLUDED.updated_at",
    )
    .bind(&binding_id)
    .bind(tenant_id)
    .bind(&role_id)
    .bind(user_id)
    .bind(tenant_id)
    .bind(now)
    .bind(now)
    .execute(pool)
    .await
    .map_err(|error| format!("ensure tenant user role binding failed: {error}"))?;
    Ok(())
}

async fn ensure_sqlite_organization_role_binding(
    pool: &SqlitePool,
    tenant_id: &str,
    organization_id: &str,
    membership_id: &str,
    role_code: &str,
    now: &str,
) -> Result<(), String> {
    let role_id = standard_role_id(tenant_id, role_code);
    let binding_id =
        bootstrap_role_binding_id(membership_id, "organization", organization_id, role_code);
    sqlx::query(
        "INSERT INTO iam_role_binding (id, tenant_id, organization_id, role_id, principal_kind, \
         principal_id, scope_kind, scope_id, effect, status, created_at, updated_at) \
         VALUES (?, ?, ?, ?, 'organization_membership', ?, 'organization', ?, 'allow', \
         'active', ?, ?) \
         ON CONFLICT(tenant_id, role_id, principal_kind, principal_id, scope_kind, scope_id) \
         DO UPDATE SET organization_id = excluded.organization_id, effect = 'allow', \
           status = 'active', updated_at = excluded.updated_at",
    )
    .bind(&binding_id)
    .bind(tenant_id)
    .bind(organization_id)
    .bind(&role_id)
    .bind(membership_id)
    .bind(organization_id)
    .bind(now)
    .bind(now)
    .execute(pool)
    .await
    .map_err(|error| format!("ensure organization role binding failed: {error}"))?;
    Ok(())
}

async fn ensure_sqlite_tenant_user_role_binding(
    pool: &SqlitePool,
    tenant_id: &str,
    user_id: &str,
    role_code: &str,
    now: &str,
) -> Result<(), String> {
    let role_id = standard_role_id(tenant_id, role_code);
    let binding_id = bootstrap_role_binding_id(user_id, "tenant", tenant_id, role_code);
    sqlx::query(
        "INSERT INTO iam_role_binding (id, tenant_id, organization_id, role_id, principal_kind, \
         principal_id, scope_kind, scope_id, effect, status, created_at, updated_at) \
         VALUES (?, ?, '0', ?, 'user', ?, 'tenant', ?, 'allow', 'active', ?, ?) \
         ON CONFLICT(tenant_id, role_id, principal_kind, principal_id, scope_kind, scope_id) \
         DO UPDATE SET organization_id = excluded.organization_id, effect = 'allow', \
           status = 'active', updated_at = excluded.updated_at",
    )
    .bind(&binding_id)
    .bind(tenant_id)
    .bind(&role_id)
    .bind(user_id)
    .bind(tenant_id)
    .bind(now)
    .bind(now)
    .execute(pool)
    .await
    .map_err(|error| format!("ensure tenant user role binding failed: {error}"))?;
    Ok(())
}

fn hash_password(password: &str) -> String {
    Argon2::default()
        .hash_password(password.as_bytes(), &SaltString::generate(&mut OsRng))
        .expect("hash bootstrap admin password")
        .to_string()
}

fn bootstrap_owner_membership_id(user_id: &str) -> String {
    format!("iamom_owner_{user_id}")
}

fn bootstrap_credential_id(user_id: &str) -> String {
    format!("iamc_bootstrap_{user_id}")
}

fn bootstrap_tenant_member_id(user_id: &str) -> String {
    format!("iamtm_owner_{user_id}")
}

fn bootstrap_role_binding_id(
    principal_id: &str,
    scope_kind: &str,
    scope_id: &str,
    role_code: &str,
) -> String {
    format!("iamb_{principal_id}_{scope_kind}_{scope_id}_{role_code}")
}

fn bootstrap_member_membership_id(user_id: &str) -> String {
    format!("iamom_member_{user_id}")
}

fn bootstrap_member_tenant_member_id(user_id: &str) -> String {
    format!("iamtm_member_{user_id}")
}

fn read_env_trimmed(name: &str) -> Option<String> {
    std::env::var(name)
        .ok()
        .map(|value| value.trim().to_owned())
        .filter(|value| !value.is_empty())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn resolve_bootstrap_admin_password_prefers_super_admin_env() {
        let _lock = crate::test_env_lock::lock();
        std::env::set_var(SDKWORK_IAM_SUPER_ADMIN_PASSWORD_ENV, "super-secret");
        std::env::set_var(SDKWORK_IAM_BOOTSTRAP_PASSWORD_ENV, "bootstrap-secret");
        assert_eq!(
            resolve_bootstrap_admin_password_from_env().as_deref(),
            Some("super-secret")
        );
        std::env::remove_var(SDKWORK_IAM_SUPER_ADMIN_PASSWORD_ENV);
        std::env::remove_var(SDKWORK_IAM_BOOTSTRAP_PASSWORD_ENV);
    }

    #[test]
    fn resolve_bootstrap_admin_password_falls_back_to_bootstrap_env() {
        let _lock = crate::test_env_lock::lock();
        std::env::remove_var(SDKWORK_IAM_SUPER_ADMIN_PASSWORD_ENV);
        std::env::set_var(SDKWORK_IAM_BOOTSTRAP_PASSWORD_ENV, "bootstrap-secret");
        assert_eq!(
            resolve_bootstrap_admin_password_from_env().as_deref(),
            Some("bootstrap-secret")
        );
        std::env::remove_var(SDKWORK_IAM_BOOTSTRAP_PASSWORD_ENV);
    }

    #[test]
    fn bootstrap_admin_ids_are_stable() {
        assert_eq!(bootstrap_owner_membership_id("1"), "iamom_owner_1");
        assert_eq!(DEFAULT_BOOTSTRAP_ADMIN_ORGANIZATION_ID, "100002");
        assert_eq!(DEFAULT_BOOTSTRAP_ADMIN_ORGANIZATION_MEMBERSHIP_ID, "100003");
        assert_eq!(
            DEFAULT_BOOTSTRAP_MANAGER_ORGANIZATION_MEMBERSHIP_ID,
            "100006"
        );
        assert_eq!(
            DEFAULT_BOOTSTRAP_ADMIN_ORGANIZATION_ROOT_CLOSURE_ID,
            "100004"
        );
        assert_eq!(
            DEFAULT_BOOTSTRAP_ADMIN_ORGANIZATION_SELF_CLOSURE_ID,
            "100005"
        );
        assert_eq!(bootstrap_credential_id("1"), "iamc_bootstrap_1");
    }

    #[tokio::test]
    async fn sqlite_bootstrap_admin_organization_is_login_eligible_and_idempotent() {
        let pool = SqlitePool::connect("sqlite::memory:")
            .await
            .expect("connect in-memory sqlite");
        sqlx::query(
            "CREATE TABLE iam_organization (\
             id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, parent_organization_id TEXT, \
             code TEXT NOT NULL, name TEXT NOT NULL, path TEXT NOT NULL, status TEXT NOT NULL, \
             organization_kind TEXT NOT NULL, tenant_boundary_kind TEXT NOT NULL, \
             data_boundary_kind TEXT NOT NULL, app_boundary_enabled INTEGER NOT NULL, \
             verification_status TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, \
             UNIQUE (tenant_id, code))",
        )
        .execute(&pool)
        .await
        .expect("create organization table");
        sqlx::query(
            "CREATE TABLE iam_organization_closure (\
             id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, ancestor_organization_id TEXT NOT NULL, \
             descendant_organization_id TEXT NOT NULL, depth INTEGER NOT NULL, created_at TEXT NOT NULL, \
             UNIQUE (tenant_id, ancestor_organization_id, descendant_organization_id))",
        )
        .execute(&pool)
        .await
        .expect("create organization closure table");
        sqlx::query(
            "CREATE TABLE iam_organization_membership (\
             id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, organization_id TEXT NOT NULL, \
             user_id TEXT NOT NULL, membership_kind TEXT NOT NULL, is_primary INTEGER NOT NULL, \
             status TEXT NOT NULL, joined_at TEXT NOT NULL, created_at TEXT NOT NULL, \
             updated_at TEXT NOT NULL, \
             UNIQUE (tenant_id, organization_id, user_id, membership_kind))",
        )
        .execute(&pool)
        .await
        .expect("create organization membership table");

        let now = "2026-07-15T00:00:00Z";
        for _ in 0..2 {
            ensure_sqlite_bootstrap_admin_organization(&pool, now)
                .await
                .expect("ensure bootstrap admin organization");
            ensure_sqlite_bootstrap_admin_membership(
                &pool,
                DEFAULT_BOOTSTRAP_ADMIN_ORGANIZATION_MEMBERSHIP_ID,
                DEFAULT_BOOTSTRAP_ADMIN_USER_ID,
                now,
            )
            .await
            .expect("ensure bootstrap admin membership");
        }

        let organization: (String, String, String) = sqlx::query_as(
            "SELECT id, parent_organization_id, code FROM iam_organization WHERE id = ?",
        )
        .bind(DEFAULT_BOOTSTRAP_ADMIN_ORGANIZATION_ID)
        .fetch_one(&pool)
        .await
        .expect("load bootstrap admin organization");
        assert_eq!(DEFAULT_BOOTSTRAP_ADMIN_ORGANIZATION_ID, organization.0);
        assert_eq!(DEFAULT_IAM_ORGANIZATION_ID, organization.1);
        assert_eq!(DEFAULT_BOOTSTRAP_ADMIN_ORGANIZATION_CODE, organization.2);

        let membership: (String, i64, String) = sqlx::query_as(
            "SELECT organization_id, is_primary, membership_kind \
             FROM iam_organization_membership WHERE id = ?",
        )
        .bind(DEFAULT_BOOTSTRAP_ADMIN_ORGANIZATION_MEMBERSHIP_ID)
        .fetch_one(&pool)
        .await
        .expect("load bootstrap admin membership");
        assert_ne!(DEFAULT_IAM_ORGANIZATION_ID, membership.0);
        assert_eq!(1, membership.1);
        assert_eq!("owner", membership.2);

        let closure_count: i64 = sqlx::query_scalar(
            "SELECT COUNT(*) FROM iam_organization_closure \
             WHERE descendant_organization_id = ?",
        )
        .bind(DEFAULT_BOOTSTRAP_ADMIN_ORGANIZATION_ID)
        .fetch_one(&pool)
        .await
        .expect("count bootstrap admin organization closure");
        assert_eq!(2, closure_count);
    }
}
