//! Repairs legacy opaque IAM user ids (`iamu_*`, UUID strings) into numeric snowflake ids.

use sqlx::{PgPool, SqlitePool};

use crate::iam_entity_ids::new_iam_user_id;
use crate::iam_sql_subject::is_legacy_opaque_iam_subject_id;
use crate::DEFAULT_BOOTSTRAP_ADMIN_USER_ID;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct LegacyIamSubjectRepairReport {
    pub repaired_users: u32,
}

pub async fn repair_postgres_legacy_opaque_iam_user_ids(
    pool: &PgPool,
) -> Result<LegacyIamSubjectRepairReport, sqlx::Error> {
    let legacy_users: Vec<(String, String)> = sqlx::query_as(
        "SELECT tenant_id, id FROM iam_user \
         WHERE status = 'active' AND is_deleted = 0",
    )
    .fetch_all(pool)
    .await?
    .into_iter()
    .filter_map(|(tenant_id, user_id): (String, String)| {
        if user_id == DEFAULT_BOOTSTRAP_ADMIN_USER_ID {
            return None;
        }
        is_legacy_opaque_iam_subject_id(&user_id)
            .then_some((tenant_id, user_id))
    })
    .collect();

    let mut repaired_users = 0_u32;
    for (tenant_id, old_user_id) in legacy_users {
        let new_user_id = new_iam_user_id();
        repair_postgres_iam_user_id_references(pool, &tenant_id, &old_user_id, &new_user_id).await?;
        repaired_users += 1;
    }

    Ok(LegacyIamSubjectRepairReport { repaired_users })
}

pub async fn repair_sqlite_legacy_opaque_iam_user_ids(
    pool: &SqlitePool,
) -> Result<LegacyIamSubjectRepairReport, sqlx::Error> {
    let legacy_users: Vec<(String, String)> = sqlx::query_as(
        "SELECT tenant_id, id FROM iam_user \
         WHERE status = 'active' AND is_deleted = 0",
    )
    .fetch_all(pool)
    .await?
    .into_iter()
    .filter_map(|(tenant_id, user_id): (String, String)| {
        if user_id == DEFAULT_BOOTSTRAP_ADMIN_USER_ID {
            return None;
        }
        is_legacy_opaque_iam_subject_id(&user_id)
            .then_some((tenant_id, user_id))
    })
    .collect();

    let mut repaired_users = 0_u32;
    for (tenant_id, old_user_id) in legacy_users {
        let new_user_id = new_iam_user_id();
        repair_sqlite_iam_user_id_references(pool, &tenant_id, &old_user_id, &new_user_id).await?;
        repaired_users += 1;
    }

    Ok(LegacyIamSubjectRepairReport { repaired_users })
}

async fn repair_postgres_iam_user_id_references(
    pool: &PgPool,
    tenant_id: &str,
    old_user_id: &str,
    new_user_id: &str,
) -> Result<(), sqlx::Error> {
    let mut tx = pool.begin().await?;
    for sql in postgres_user_id_reference_updates() {
        sqlx::query(sql)
            .bind(new_user_id)
            .bind(tenant_id)
            .bind(old_user_id)
            .execute(&mut *tx)
            .await?;
    }
    tx.commit().await
}

async fn repair_sqlite_iam_user_id_references(
    pool: &SqlitePool,
    tenant_id: &str,
    old_user_id: &str,
    new_user_id: &str,
) -> Result<(), sqlx::Error> {
    let mut tx = pool.begin().await?;
    for sql in sqlite_user_id_reference_updates() {
        sqlx::query(sql)
            .bind(new_user_id)
            .bind(tenant_id)
            .bind(old_user_id)
            .execute(&mut *tx)
            .await?;
    }
    tx.commit().await
}

fn postgres_user_id_reference_updates() -> [&'static str; 8] {
    [
        "UPDATE iam_session SET user_id = $1 WHERE tenant_id = $2 AND user_id = $3",
        "UPDATE iam_credential SET user_id = $1 WHERE tenant_id = $2 AND user_id = $3",
        "UPDATE iam_user_identity SET user_id = $1 WHERE tenant_id = $2 AND user_id = $3",
        "UPDATE iam_organization_membership SET user_id = $1 WHERE tenant_id = $2 AND user_id = $3",
        "UPDATE iam_tenant_member SET user_id = $1 WHERE tenant_id = $2 AND user_id = $3",
        "UPDATE iam_group_member SET principal_id = $1 WHERE tenant_id = $2 AND principal_kind = 'user' AND principal_id = $3",
        "UPDATE iam_role_binding SET principal_id = $1 WHERE tenant_id = $2 AND principal_kind = 'user' AND principal_id = $3",
        "UPDATE iam_user SET id = $1 WHERE tenant_id = $2 AND id = $3",
    ]
}

fn sqlite_user_id_reference_updates() -> [&'static str; 8] {
    [
        "UPDATE iam_session SET user_id = ?1 WHERE tenant_id = ?2 AND user_id = ?3",
        "UPDATE iam_credential SET user_id = ?1 WHERE tenant_id = ?2 AND user_id = ?3",
        "UPDATE iam_user_identity SET user_id = ?1 WHERE tenant_id = ?2 AND user_id = ?3",
        "UPDATE iam_organization_membership SET user_id = ?1 WHERE tenant_id = ?2 AND user_id = ?3",
        "UPDATE iam_tenant_member SET user_id = ?1 WHERE tenant_id = ?2 AND user_id = ?3",
        "UPDATE iam_group_member SET principal_id = ?1 WHERE tenant_id = ?2 AND principal_kind = 'user' AND principal_id = ?3",
        "UPDATE iam_role_binding SET principal_id = ?1 WHERE tenant_id = ?2 AND principal_kind = 'user' AND principal_id = ?3",
        "UPDATE iam_user SET id = ?1 WHERE tenant_id = ?2 AND id = ?3",
    ]
}
