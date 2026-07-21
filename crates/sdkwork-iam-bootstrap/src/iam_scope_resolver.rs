use sqlx::{Executor, PgPool, Postgres, Row, Sqlite, SqlitePool};

use crate::constants::{DEFAULT_IAM_ORGANIZATION_CODE, DEFAULT_IAM_TENANT_CODE};
use crate::iam_sql_subject::{parse_iam_sql_organization_id, parse_iam_sql_tenant_id};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub struct IamScopeResolveOptions {
    pub exclude_soft_deleted: bool,
}

impl IamScopeResolveOptions {
    pub const AUTH_SETTINGS: Self = Self {
        exclude_soft_deleted: true,
    };
}

pub fn effective_iam_tenant_code(tenant_code: Option<&str>) -> &str {
    tenant_code
        .map(str::trim)
        .filter(|code| !code.is_empty())
        .unwrap_or(DEFAULT_IAM_TENANT_CODE)
}

pub fn effective_iam_organization_code(organization_code: Option<&str>) -> &str {
    organization_code
        .map(str::trim)
        .filter(|code| !code.is_empty())
        .unwrap_or(DEFAULT_IAM_ORGANIZATION_CODE)
}

pub async fn resolve_sqlite_iam_scope(
    pool: &SqlitePool,
    tenant_code: Option<&str>,
    organization_code: Option<&str>,
    options: IamScopeResolveOptions,
) -> Result<(i64, i64), sqlx::Error> {
    let tenant_id_string = resolve_sqlite_iam_tenant_id_string(pool, tenant_code, options).await?;
    let tenant_id = parse_iam_sql_tenant_id(&tenant_id_string)
        .map_err(|_| sqlx::Error::Protocol(iam_tenant_not_found_message()))?;
    let organization_id_string = resolve_sqlite_iam_organization_id_string(
        pool,
        &tenant_id_string,
        organization_code,
        options,
    )
    .await?;
    Ok((
        tenant_id,
        parse_iam_sql_organization_id(&organization_id_string)
            .map_err(|_| sqlx::Error::Protocol(iam_organization_not_found_message()))?,
    ))
}

pub async fn resolve_postgres_iam_scope(
    pool: &PgPool,
    tenant_code: Option<&str>,
    organization_code: Option<&str>,
    options: IamScopeResolveOptions,
) -> Result<(i64, i64), sqlx::Error> {
    let tenant_id_string =
        resolve_postgres_iam_tenant_id_string(pool, tenant_code, options).await?;
    let tenant_id = parse_iam_sql_tenant_id(&tenant_id_string)
        .map_err(|_| sqlx::Error::Protocol(iam_tenant_not_found_message()))?;
    let organization_id_string = resolve_postgres_iam_organization_id_string(
        pool,
        &tenant_id_string,
        organization_code,
        options,
    )
    .await?;
    Ok((
        tenant_id,
        parse_iam_sql_organization_id(&organization_id_string)
            .map_err(|_| sqlx::Error::Protocol(iam_organization_not_found_message()))?,
    ))
}

pub async fn resolve_sqlite_iam_tenant_id_string<'e, E>(
    executor: E,
    tenant_code: Option<&str>,
    options: IamScopeResolveOptions,
) -> Result<String, sqlx::Error>
where
    E: Executor<'e, Database = Sqlite>,
{
    let tenant_code = effective_iam_tenant_code(tenant_code);
    let tenant_deleted_filter = tenant_deleted_filter_sqlite(options);
    let tenant_row = sqlx::query(&format!(
        "SELECT id FROM iam_tenant WHERE code = ? AND status = 'active'{tenant_deleted_filter} ORDER BY id LIMIT 1"
    ))
    .bind(tenant_code)
    .fetch_optional(executor)
    .await?;
    tenant_row
        .map(|row| sqlite_string_cell(&row, "id"))
        .filter(|value| !value.is_empty())
        .ok_or_else(|| sqlx::Error::Protocol(iam_tenant_not_found_message()))
}

pub async fn resolve_postgres_iam_tenant_id_string<'e, E>(
    executor: E,
    tenant_code: Option<&str>,
    options: IamScopeResolveOptions,
) -> Result<String, sqlx::Error>
where
    E: Executor<'e, Database = Postgres>,
{
    let tenant_code = effective_iam_tenant_code(tenant_code);
    let tenant_deleted_filter = tenant_deleted_filter_postgres(options);
    let tenant_row = sqlx::query(&format!(
        "SELECT id FROM iam_tenant WHERE code = $1 AND status = 'active'{tenant_deleted_filter} ORDER BY id LIMIT 1"
    ))
    .bind(tenant_code)
    .fetch_optional(executor)
    .await?;
    tenant_row
        .map(|row| postgres_string_cell(&row, "id"))
        .filter(|value| !value.is_empty())
        .ok_or_else(|| sqlx::Error::Protocol(iam_tenant_not_found_message()))
}

pub async fn resolve_sqlite_iam_organization_id_string<'e, E>(
    executor: E,
    tenant_id: &str,
    organization_code: Option<&str>,
    options: IamScopeResolveOptions,
) -> Result<String, sqlx::Error>
where
    E: Executor<'e, Database = Sqlite>,
{
    let organization_code = effective_iam_organization_code(organization_code);
    let organization_deleted_filter = organization_deleted_filter_sqlite(options);
    let organization_row = sqlx::query(&format!(
        "SELECT id FROM iam_organization WHERE tenant_id = ? AND code = ? AND status = 'active'{organization_deleted_filter} ORDER BY id LIMIT 1"
    ))
    .bind(tenant_id)
    .bind(organization_code)
    .fetch_optional(executor)
    .await?;
    organization_row
        .map(|row| sqlite_string_cell(&row, "id"))
        .filter(|value| !value.is_empty())
        .ok_or_else(|| sqlx::Error::Protocol(iam_organization_not_found_message()))
}

pub async fn resolve_postgres_iam_organization_id_string<'e, E>(
    executor: E,
    tenant_id: &str,
    organization_code: Option<&str>,
    options: IamScopeResolveOptions,
) -> Result<String, sqlx::Error>
where
    E: Executor<'e, Database = Postgres>,
{
    let organization_code = effective_iam_organization_code(organization_code);
    let organization_deleted_filter = organization_deleted_filter_postgres(options);
    let organization_row = sqlx::query(&format!(
        "SELECT id FROM iam_organization WHERE tenant_id = $1 AND code = $2 AND status = 'active'{organization_deleted_filter} ORDER BY id LIMIT 1"
    ))
    .bind(tenant_id)
    .bind(organization_code)
    .fetch_optional(executor)
    .await?;
    organization_row
        .map(|row| postgres_string_cell(&row, "id"))
        .filter(|value| !value.is_empty())
        .ok_or_else(|| sqlx::Error::Protocol(iam_organization_not_found_message()))
}

fn tenant_deleted_filter_sqlite(options: IamScopeResolveOptions) -> &'static str {
    if options.exclude_soft_deleted {
        " AND deleted_at IS NULL"
    } else {
        ""
    }
}

fn tenant_deleted_filter_postgres(options: IamScopeResolveOptions) -> &'static str {
    if options.exclude_soft_deleted {
        " AND deleted_at IS NULL"
    } else {
        ""
    }
}

fn organization_deleted_filter_sqlite(options: IamScopeResolveOptions) -> &'static str {
    if options.exclude_soft_deleted {
        " AND deleted_at IS NULL"
    } else {
        ""
    }
}

fn organization_deleted_filter_postgres(options: IamScopeResolveOptions) -> &'static str {
    if options.exclude_soft_deleted {
        " AND deleted_at IS NULL"
    } else {
        ""
    }
}

fn iam_tenant_not_found_message() -> String {
    "active IAM tenant was not found or has a non-numeric id".to_owned()
}

fn iam_organization_not_found_message() -> String {
    "active IAM organization was not found or has a non-numeric id".to_owned()
}

fn sqlite_string_cell(row: &sqlx::sqlite::SqliteRow, column: &str) -> String {
    row.try_get::<String, _>(column)
        .ok()
        .or_else(|| {
            row.try_get::<i64, _>(column)
                .ok()
                .map(|value| value.to_string())
        })
        .or_else(|| {
            row.try_get::<i32, _>(column)
                .ok()
                .map(|value| value.to_string())
        })
        .unwrap_or_default()
}

fn postgres_string_cell(row: &sqlx::postgres::PgRow, column: &str) -> String {
    row.try_get::<String, _>(column)
        .ok()
        .or_else(|| {
            row.try_get::<i64, _>(column)
                .ok()
                .map(|value| value.to_string())
        })
        .or_else(|| {
            row.try_get::<i32, _>(column)
                .ok()
                .map(|value| value.to_string())
        })
        .unwrap_or_default()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn effective_codes_default_to_bootstrap_subject() {
        assert_eq!(DEFAULT_IAM_TENANT_CODE, effective_iam_tenant_code(None));
        assert_eq!(
            DEFAULT_IAM_ORGANIZATION_CODE,
            effective_iam_organization_code(None)
        );
        assert_eq!(DEFAULT_IAM_TENANT_CODE, effective_iam_tenant_code(Some("")));
        assert_eq!(
            DEFAULT_IAM_ORGANIZATION_CODE,
            effective_iam_organization_code(Some("   "))
        );
        assert_eq!("custom", effective_iam_tenant_code(Some("custom")));
        assert_eq!("branch", effective_iam_organization_code(Some("branch")));
    }
}
