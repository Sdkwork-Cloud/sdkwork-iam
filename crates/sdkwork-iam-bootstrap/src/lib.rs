pub mod constants;
pub mod permission_catalog;
pub mod rbac_scope;
pub mod role_catalog;

pub use constants::*;
pub use rbac_scope::{
    ensure_assigner_covers_role_permissions, ensure_permission_grant_within_assigner_scope,
    ensure_role_assignment_allowed, ensure_role_grant_within_assigner_scope,
    load_binding_permission_rows, load_role_permission_codes, resolve_effective_permission_codes,
    resolve_session_scopes, resolve_standard_role_codes, resolve_user_permission_scope,
    user_has_permission_code, violates_role_exclusion, BindingPermissionRow, RoleExclusionRule,
};
pub use role_catalog::{
    expanded_role_permission_codes, standard_role_id, standard_role_permission_id,
};

use chrono::Utc;
use sqlx::{PgPool, SqlitePool};

use crate::permission_catalog::IAM_STANDARD_PERMISSION_SEEDS;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct PermissionSeed {
    pub code: &'static str,
    pub name: &'static str,
    pub resource: &'static str,
    pub action: &'static str,
}

pub fn permission_id(code: &str) -> String {
    let normalized = code
        .chars()
        .map(|ch| match ch {
            'a'..='z' | '0'..='9' => ch,
            _ => '-',
        })
        .collect::<String>();
    format!("iam-permission-{normalized}")
}

pub async fn upsert_sqlite_default_subject(pool: &SqlitePool) -> Result<(), sqlx::Error> {
    let now = Utc::now().to_rfc3339();
    sqlx::query(
        r#"
        INSERT INTO iam_tenant
            (id, code, name, status, created_at, updated_at)
        VALUES
            (?, ?, ?, 'active', ?, ?)
        ON CONFLICT(id) DO UPDATE SET
            code = excluded.code,
            name = excluded.name,
            status = excluded.status,
            updated_at = excluded.updated_at
        "#,
    )
    .bind(DEFAULT_IAM_TENANT_ID)
    .bind(DEFAULT_IAM_TENANT_CODE)
    .bind(DEFAULT_IAM_TENANT_NAME)
    .bind(&now)
    .bind(&now)
    .execute(pool)
    .await?;

    sqlx::query(
        r#"
        INSERT INTO iam_organization
            (
                id,
                tenant_id,
                parent_organization_id,
                code,
                name,
                path,
                status,
                organization_kind,
                tenant_boundary_kind,
                data_boundary_kind,
                app_boundary_enabled,
                verification_status,
                created_at,
                updated_at
            )
        VALUES
            (?, ?, NULL, ?, ?, ?, 'active', ?, ?, ?, 0, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
            tenant_id = excluded.tenant_id,
            parent_organization_id = excluded.parent_organization_id,
            code = excluded.code,
            name = excluded.name,
            path = excluded.path,
            status = excluded.status,
            organization_kind = excluded.organization_kind,
            tenant_boundary_kind = excluded.tenant_boundary_kind,
            data_boundary_kind = excluded.data_boundary_kind,
            app_boundary_enabled = excluded.app_boundary_enabled,
            verification_status = excluded.verification_status,
            updated_at = excluded.updated_at
        "#,
    )
    .bind(DEFAULT_IAM_ORGANIZATION_ID)
    .bind(DEFAULT_IAM_TENANT_ID)
    .bind(DEFAULT_IAM_ORGANIZATION_CODE)
    .bind(DEFAULT_IAM_ORGANIZATION_NAME)
    .bind(DEFAULT_IAM_ORGANIZATION_PATH)
    .bind(DEFAULT_IAM_ORGANIZATION_KIND)
    .bind(DEFAULT_IAM_ORGANIZATION_TENANT_BOUNDARY_KIND)
    .bind(DEFAULT_IAM_ORGANIZATION_DATA_BOUNDARY_KIND)
    .bind(DEFAULT_IAM_ORGANIZATION_VERIFICATION_STATUS)
    .bind(&now)
    .bind(&now)
    .execute(pool)
    .await?;
    Ok(())
}

pub async fn upsert_postgres_default_subject(pool: &PgPool) -> Result<(), sqlx::Error> {
    sqlx::query(
        r#"
        INSERT INTO iam_tenant
            (id, code, name, status, created_at, updated_at)
        VALUES
            ($1, $2, $3, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT(id) DO UPDATE SET
            code = excluded.code,
            name = excluded.name,
            status = excluded.status,
            updated_at = excluded.updated_at
        "#,
    )
    .bind(DEFAULT_IAM_TENANT_ID)
    .bind(DEFAULT_IAM_TENANT_CODE)
    .bind(DEFAULT_IAM_TENANT_NAME)
    .execute(pool)
    .await?;

    sqlx::query(
        r#"
        INSERT INTO iam_organization
            (
                id,
                tenant_id,
                parent_organization_id,
                code,
                name,
                path,
                status,
                organization_kind,
                tenant_boundary_kind,
                data_boundary_kind,
                app_boundary_enabled,
                verification_status,
                created_at,
                updated_at
            )
        VALUES
            (
                $1,
                $2,
                NULL,
                $3,
                $4,
                $5,
                'active',
                $6,
                $7,
                $8,
                0,
                $9,
                CURRENT_TIMESTAMP,
                CURRENT_TIMESTAMP
            )
        ON CONFLICT(id) DO UPDATE SET
            tenant_id = excluded.tenant_id,
            parent_organization_id = excluded.parent_organization_id,
            code = excluded.code,
            name = excluded.name,
            path = excluded.path,
            status = excluded.status,
            organization_kind = excluded.organization_kind,
            tenant_boundary_kind = excluded.tenant_boundary_kind,
            data_boundary_kind = excluded.data_boundary_kind,
            app_boundary_enabled = excluded.app_boundary_enabled,
            verification_status = excluded.verification_status,
            updated_at = excluded.updated_at
        "#,
    )
    .bind(DEFAULT_IAM_ORGANIZATION_ID)
    .bind(DEFAULT_IAM_TENANT_ID)
    .bind(DEFAULT_IAM_ORGANIZATION_CODE)
    .bind(DEFAULT_IAM_ORGANIZATION_NAME)
    .bind(DEFAULT_IAM_ORGANIZATION_PATH)
    .bind(DEFAULT_IAM_ORGANIZATION_KIND)
    .bind(DEFAULT_IAM_ORGANIZATION_TENANT_BOUNDARY_KIND)
    .bind(DEFAULT_IAM_ORGANIZATION_DATA_BOUNDARY_KIND)
    .bind(DEFAULT_IAM_ORGANIZATION_VERIFICATION_STATUS)
    .execute(pool)
    .await?;
    Ok(())
}

pub async fn upsert_sqlite_permissions(
    pool: &SqlitePool,
    seeds: &[PermissionSeed],
) -> Result<(), sqlx::Error> {
    let now = Utc::now().to_rfc3339();
    for permission in seeds {
        sqlx::query(
            r#"
            INSERT INTO iam_permission
                (id, code, name, resource, action, created_at)
            VALUES
                (?, ?, ?, ?, ?, ?)
            ON CONFLICT(code) DO UPDATE SET
                name = excluded.name,
                resource = excluded.resource,
                action = excluded.action
            "#,
        )
        .bind(permission_id(permission.code))
        .bind(permission.code)
        .bind(permission.name)
        .bind(permission.resource)
        .bind(permission.action)
        .bind(&now)
        .execute(pool)
        .await?;
    }
    Ok(())
}

pub async fn upsert_postgres_permissions(
    pool: &PgPool,
    seeds: &[PermissionSeed],
) -> Result<(), sqlx::Error> {
    for permission in seeds {
        sqlx::query(
            r#"
            INSERT INTO iam_permission
                (id, code, name, resource, action, created_at)
            VALUES
                ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
            ON CONFLICT(code) DO UPDATE SET
                name = excluded.name,
                resource = excluded.resource,
                action = excluded.action
            "#,
        )
        .bind(permission_id(permission.code))
        .bind(permission.code)
        .bind(permission.name)
        .bind(permission.resource)
        .bind(permission.action)
        .execute(pool)
        .await?;
    }
    Ok(())
}

pub async fn sqlite_default_subject_seed_complete(pool: &SqlitePool) -> Result<bool, sqlx::Error> {
    let count: i64 = sqlx::query_scalar(
        r#"
        SELECT COUNT(1)
        FROM iam_tenant t
        JOIN iam_organization o ON o.tenant_id = t.id
        WHERE t.id = ?
          AND t.code = ?
          AND t.status = 'active'
          AND o.id = ?
          AND o.code = ?
          AND o.status = 'active'
        "#,
    )
    .bind(DEFAULT_IAM_TENANT_ID)
    .bind(DEFAULT_IAM_TENANT_CODE)
    .bind(DEFAULT_IAM_ORGANIZATION_ID)
    .bind(DEFAULT_IAM_ORGANIZATION_CODE)
    .fetch_one(pool)
    .await?;
    Ok(count == 1)
}

pub async fn postgres_default_subject_seed_complete(pool: &PgPool) -> Result<bool, sqlx::Error> {
    let count: i64 = sqlx::query_scalar(
        r#"
        SELECT (COUNT(1))::bigint
        FROM iam_tenant t
        JOIN iam_organization o ON o.tenant_id = t.id
        WHERE t.id = $1
          AND t.code = $2
          AND t.status = 'active'
          AND o.id = $3
          AND o.code = $4
          AND o.status = 'active'
        "#,
    )
    .bind(DEFAULT_IAM_TENANT_ID)
    .bind(DEFAULT_IAM_TENANT_CODE)
    .bind(DEFAULT_IAM_ORGANIZATION_ID)
    .bind(DEFAULT_IAM_ORGANIZATION_CODE)
    .fetch_one(pool)
    .await?;
    Ok(count == 1)
}

async fn sqlite_permission_seed_complete(
    pool: &SqlitePool,
    seeds: &[PermissionSeed],
) -> Result<bool, sqlx::Error> {
    for permission in seeds {
        let count: i64 = sqlx::query_scalar(
            r#"
            SELECT COUNT(1)
            FROM iam_permission
            WHERE code = ?
              AND resource = ?
              AND action = ?
            "#,
        )
        .bind(permission.code)
        .bind(permission.resource)
        .bind(permission.action)
        .fetch_one(pool)
        .await?;
        if count != 1 {
            return Ok(false);
        }
    }
    Ok(true)
}

async fn postgres_permission_seed_complete(
    pool: &PgPool,
    seeds: &[PermissionSeed],
) -> Result<bool, sqlx::Error> {
    for permission in seeds {
        let count: i64 = sqlx::query_scalar(
            r#"
            SELECT (COUNT(1))::bigint
            FROM iam_permission
            WHERE code = $1
              AND resource = $2
              AND action = $3
            "#,
        )
        .bind(permission.code)
        .bind(permission.resource)
        .bind(permission.action)
        .fetch_one(pool)
        .await?;
        if count != 1 {
            return Ok(false);
        }
    }
    Ok(true)
}

pub async fn sqlite_standard_permission_seed_complete(
    pool: &SqlitePool,
) -> Result<bool, sqlx::Error> {
    let materialized: Option<i64> = sqlx::query_scalar(
        "SELECT permission_count FROM iam_catalog_materialization \
         WHERE profile IN ('operational', 'standard') \
         ORDER BY materialized_at DESC LIMIT 1",
    )
    .fetch_optional(pool)
    .await?;
    if let Some(count) = materialized {
        return Ok(count >= 100);
    }
    sqlite_permission_seed_complete(pool, IAM_STANDARD_PERMISSION_SEEDS).await
}

pub async fn postgres_standard_permission_seed_complete(
    pool: &PgPool,
) -> Result<bool, sqlx::Error> {
    let materialized: Option<i32> = sqlx::query_scalar(
        "SELECT permission_count FROM iam_catalog_materialization \
         WHERE profile IN ('operational', 'standard') \
         ORDER BY materialized_at DESC LIMIT 1",
    )
    .fetch_optional(pool)
    .await?;
    if let Some(count) = materialized {
        return Ok(i64::from(count) >= 100);
    }
    postgres_permission_seed_complete(pool, IAM_STANDARD_PERMISSION_SEEDS).await
}

pub async fn sqlite_default_iam_seed_complete(pool: &SqlitePool) -> Result<bool, sqlx::Error> {
    if !sqlite_default_subject_seed_complete(pool).await? {
        return Ok(false);
    }
    sqlite_standard_permission_seed_complete(pool).await
}

pub async fn postgres_default_iam_seed_complete(pool: &PgPool) -> Result<bool, sqlx::Error> {
    if !postgres_default_subject_seed_complete(pool).await? {
        return Ok(false);
    }
    postgres_standard_permission_seed_complete(pool).await
}

pub async fn import_postgres_default_iam_seed(pool: &PgPool) -> Result<(), sqlx::Error> {
    sdkwork_iam_module_registry::materialize_postgres_catalog(pool, None, "operational")
        .await
        .map_err(|error| sqlx::Error::Protocol(error))?;
    Ok(())
}

pub async fn import_sqlite_default_iam_seed(pool: &SqlitePool) -> Result<(), sqlx::Error> {
    sdkwork_iam_module_registry::materialize_sqlite_catalog(pool, None, "operational")
        .await
        .map_err(|error| sqlx::Error::Protocol(error))?;
    Ok(())
}

pub async fn upsert_postgres_standard_roles(
    pool: &PgPool,
    tenant_id: &str,
) -> Result<(), sqlx::Error> {
    sdkwork_iam_module_registry::materialize::upsert_tenant_roles_postgres(pool, tenant_id, None)
        .await
        .map_err(|error| sqlx::Error::Protocol(error))
}

pub async fn upsert_sqlite_standard_roles(
    pool: &SqlitePool,
    tenant_id: &str,
) -> Result<(), sqlx::Error> {
    sdkwork_iam_module_registry::materialize::upsert_tenant_roles_sqlite(pool, tenant_id, None)
        .await
        .map_err(|error| sqlx::Error::Protocol(error))
}

pub fn iam_baseline_postgres_sql() -> &'static str {
    include_str!("../../../database/ddl/baseline/postgres/0001_iam_baseline.sql")
}

pub fn iam_rbac_federation_postgres_sql() -> &'static str {
    include_str!("../../../database/migrations/postgres/0008_iam_rbac_federation.up.sql")
}
