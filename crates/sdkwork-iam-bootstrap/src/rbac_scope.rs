//! Canonical RBAC permission-scope resolution for IAM kernel.
//! Implements allow/deny binding precedence and role-exclusion (SoD) per IMF spec.

use std::collections::BTreeSet;

use sdkwork_iam_context_service::{
    has_permission_in_scope, permission_matches, IAM_STANDARD_ROLE_CODES,
};
use sqlx::{PgPool, Row};

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct BindingPermissionRow {
    pub role_code: String,
    pub effect: String,
    pub permission_code: String,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct RoleExclusionRule {
    pub role_code: String,
    pub excludes_role_code: String,
}

const BINDING_SCOPE_SQL: &str = " \
  AND ( \
    $3::text IS NULL \
    OR ($3::text <> '' AND $3::text <> '0' AND b.scope_kind = 'organization' AND b.scope_id = $3) \
    OR b.scope_kind = 'tenant' \
  )";

const PRINCIPAL_MATCH_SQL: &str = " \
  ( \
    (b.principal_kind = 'organization_membership' AND b.principal_id IN ( \
      SELECT id FROM iam_organization_membership \
      WHERE tenant_id = $1 AND user_id = $2 AND status = 'active' \
    )) \
    OR (b.principal_kind = 'user' AND b.principal_id = $2) \
    OR (b.principal_kind = 'group' AND b.principal_id IN ( \
      SELECT gm.group_id FROM iam_group_member gm \
      JOIN iam_group g ON g.id = gm.group_id AND g.tenant_id = gm.tenant_id AND g.status = 'active' \
      WHERE gm.tenant_id = $1 AND gm.principal_kind = 'user' AND gm.principal_id = $2 AND gm.status = 'active' \
    )) \
    OR (b.principal_kind = 'service_account' AND b.principal_id = $2) \
  )";

pub fn violates_role_exclusion(
    active_role_codes: &BTreeSet<String>,
    new_role_code: &str,
    exclusions: &[RoleExclusionRule],
) -> Option<String> {
    for rule in exclusions {
        let (assigned_role, counterpart) = if new_role_code == rule.role_code {
            (rule.role_code.as_str(), rule.excludes_role_code.as_str())
        } else if new_role_code == rule.excludes_role_code {
            (rule.excludes_role_code.as_str(), rule.role_code.as_str())
        } else {
            continue;
        };

        if active_role_codes.contains(counterpart) {
            return Some(format!(
                "role assignment violates separation of duties between {} and {}",
                assigned_role, counterpart
            ));
        }
    }
    None
}

pub async fn load_active_allow_role_codes_for_principal(
    pg: &PgPool,
    tenant_id: &str,
    principal_kind: &str,
    principal_id: &str,
    scope_kind: &str,
    scope_id: &str,
) -> Result<Vec<String>, String> {
    let rows = sqlx::query(
        "SELECT DISTINCT r.code \
         FROM iam_role_binding b \
         JOIN iam_role r ON r.id = b.role_id AND r.tenant_id = b.tenant_id AND r.status = 'active' \
         WHERE b.tenant_id = $1 AND b.status = 'active' AND b.effect = 'allow' \
           AND b.principal_kind = $2 AND b.principal_id = $3 \
           AND b.scope_kind = $4 AND b.scope_id = $5 \
         ORDER BY r.code",
    )
    .bind(tenant_id)
    .bind(principal_kind)
    .bind(principal_id)
    .bind(scope_kind)
    .bind(scope_id)
    .fetch_all(pg)
    .await
    .map_err(|error| format!("load active role codes failed: {error}"))?;

    Ok(rows
        .into_iter()
        .map(|row| row.get::<String, _>(0))
        .collect())
}

pub async fn ensure_role_assignment_allowed(
    pg: &PgPool,
    tenant_id: &str,
    principal_kind: &str,
    principal_id: &str,
    scope_kind: &str,
    scope_id: &str,
    new_role_code: &str,
) -> Result<(), String> {
    if new_role_code.trim().is_empty() {
        return Err("role code is required for assignment validation".to_string());
    }

    let active_roles = load_active_allow_role_codes_for_principal(
        pg,
        tenant_id,
        principal_kind,
        principal_id,
        scope_kind,
        scope_id,
    )
    .await?;
    let active_set = active_roles.into_iter().collect::<BTreeSet<_>>();
    let exclusions = load_role_exclusion_rules(pg, tenant_id).await?;
    if let Some(message) = violates_role_exclusion(&active_set, new_role_code, &exclusions) {
        return Err(message);
    }
    Ok(())
}

/// Resolve effective permission codes from binding rows, applying deny precedence and SoD exclusions.
pub fn resolve_effective_permission_codes(
    rows: &[BindingPermissionRow],
    exclusions: &[RoleExclusionRule],
) -> Vec<String> {
    let active_roles = rows
        .iter()
        .map(|row| row.role_code.as_str())
        .collect::<BTreeSet<_>>();
    let stripped_roles = roles_suppressed_by_exclusions(&active_roles, exclusions);

    let mut allowed = BTreeSet::new();
    let mut denied = BTreeSet::new();
    for row in rows {
        if stripped_roles.contains(row.role_code.as_str()) {
            continue;
        }
        if row.effect == "deny" {
            denied.insert(row.permission_code.clone());
        } else if row.effect == "allow" {
            allowed.insert(row.permission_code.clone());
        }
    }

    let mut effective: Vec<String> = allowed
        .into_iter()
        .filter(|code| !denied.iter().any(|deny| permission_matches(deny, code)))
        .collect();
    effective.sort();
    effective.dedup();
    effective
}

fn roles_suppressed_by_exclusions<'a>(
    active_roles: &'a BTreeSet<&'a str>,
    exclusions: &[RoleExclusionRule],
) -> BTreeSet<String> {
    let mut suppressed = BTreeSet::new();
    for rule in exclusions {
        if active_roles.contains(rule.role_code.as_str())
            && active_roles.contains(rule.excludes_role_code.as_str())
        {
            suppressed.insert(rule.excludes_role_code.clone());
        }
    }
    suppressed
}

pub async fn load_role_permission_codes(
    pg: &PgPool,
    tenant_id: &str,
    role_id: &str,
) -> Result<Vec<String>, String> {
    let rows = sqlx::query(
        "SELECT DISTINCT p.code \
         FROM iam_role_permission rp \
         JOIN iam_permission p ON p.id = rp.permission_id \
         WHERE rp.tenant_id = $1 AND rp.role_id = $2 \
           AND COALESCE(p.status, 'active') <> 'retired' \
         ORDER BY p.code",
    )
    .bind(tenant_id)
    .bind(role_id)
    .fetch_all(pg)
    .await
    .map_err(|error| format!("load role permission codes failed: {error}"))?;

    Ok(rows
        .into_iter()
        .map(|row| row.get::<String, _>(0))
        .collect())
}

pub fn ensure_assigner_covers_role_permissions(
    assigner_scope: &[String],
    role_permission_codes: &[String],
) -> Result<(), String> {
    if role_permission_codes.iter().any(|code| code == "*") {
        if !has_permission_in_scope(assigner_scope, "*") {
            return Err(
                "assigner lacks global wildcard permission required to grant this role".to_string(),
            );
        }
        return Ok(());
    }

    for required in role_permission_codes {
        if !has_permission_in_scope(assigner_scope, required) {
            return Err(format!(
                "assigner lacks permission {required} required to grant this role"
            ));
        }
    }
    Ok(())
}

pub async fn ensure_role_grant_within_assigner_scope(
    pg: &PgPool,
    tenant_id: &str,
    role_id: &str,
    assigner_scope: &[String],
) -> Result<(), String> {
    if has_permission_in_scope(assigner_scope, "*") {
        return Ok(());
    }
    let role_permissions = load_role_permission_codes(pg, tenant_id, role_id).await?;
    ensure_assigner_covers_role_permissions(assigner_scope, &role_permissions)
}

pub fn ensure_permission_grant_within_assigner_scope(
    assigner_scope: &[String],
    permission_code: &str,
) -> Result<(), String> {
    if has_permission_in_scope(assigner_scope, permission_code) {
        Ok(())
    } else {
        Err(format!(
            "assigner lacks permission {permission_code} required to grant it to a role"
        ))
    }
}

pub async fn load_binding_permission_rows(
    pg: &PgPool,
    tenant_id: &str,
    user_id: &str,
    organization_id: Option<&str>,
) -> Result<Vec<BindingPermissionRow>, String> {
    let sql = format!(
        "SELECT r.code, b.effect, p.code \
         FROM iam_role_binding b \
         JOIN iam_role r ON r.id = b.role_id AND r.tenant_id = b.tenant_id AND r.status = 'active' \
         JOIN iam_role_permission rp ON rp.role_id = r.id AND rp.tenant_id = b.tenant_id \
         JOIN iam_permission p ON p.id = rp.permission_id \
         WHERE b.tenant_id = $1 AND b.status = 'active' \
           AND COALESCE(p.status, 'active') <> 'retired' \
           AND b.effect IN ('allow', 'deny') \
           AND {PRINCIPAL_MATCH_SQL} \
           {BINDING_SCOPE_SQL} \
         ORDER BY r.code, b.effect, p.code \
         LIMIT $4"
    );
    let rows = sqlx::query(&sql)
        .bind(tenant_id)
        .bind(user_id)
        .bind(organization_id.unwrap_or(""))
        .bind(crate::limits::IAM_RBAC_BINDING_ROW_LIMIT + 1)
        .fetch_all(pg)
        .await
        .map_err(|error| format!("load binding permission rows failed: {error}"))?;

    if rows.len() > crate::limits::IAM_RBAC_BINDING_ROW_LIMIT as usize {
        return Err(format!(
            "RBAC binding permission rows exceed limit of {}",
            crate::limits::IAM_RBAC_BINDING_ROW_LIMIT
        ));
    }

    Ok(rows
        .into_iter()
        .map(|row| BindingPermissionRow {
            role_code: row.get(0),
            effect: row.get(1),
            permission_code: row.get(2),
        })
        .collect())
}

pub async fn load_role_exclusion_rules(
    pg: &PgPool,
    tenant_id: &str,
) -> Result<Vec<RoleExclusionRule>, String> {
    let rows = sqlx::query(
        "SELECT r.code, er.code \
         FROM iam_role_exclusion e \
         JOIN iam_role r ON r.id = e.role_id AND r.tenant_id = e.tenant_id \
         JOIN iam_role er ON er.id = e.excludes_role_id AND er.tenant_id = e.tenant_id \
         WHERE e.tenant_id = $1 AND e.status = 'active' \
           AND r.status = 'active' AND er.status = 'active'",
    )
    .bind(tenant_id)
    .fetch_all(pg)
    .await
    .map_err(|error| format!("load role exclusion rules failed: {error}"))?;

    Ok(rows
        .into_iter()
        .map(|row| RoleExclusionRule {
            role_code: row.get(0),
            excludes_role_code: row.get(1),
        })
        .collect())
}

pub async fn resolve_user_permission_scope(
    pg: &PgPool,
    tenant_id: &str,
    user_id: &str,
    organization_id: Option<&str>,
) -> Result<Vec<String>, String> {
    let rows = load_binding_permission_rows(pg, tenant_id, user_id, organization_id).await?;
    let exclusions = load_role_exclusion_rules(pg, tenant_id).await?;
    Ok(resolve_effective_permission_codes(&rows, &exclusions))
}

pub async fn user_has_permission_code(
    pg: &PgPool,
    tenant_id: &str,
    user_id: &str,
    permission_code: &str,
) -> Result<bool, String> {
    let scope = resolve_user_permission_scope(pg, tenant_id, user_id, None).await?;
    Ok(has_permission_in_scope(&scope, permission_code))
}

pub async fn load_binding_data_scopes(
    pg: &PgPool,
    tenant_id: &str,
    user_id: &str,
    organization_id: Option<&str>,
) -> Result<Vec<String>, String> {
    let sql = format!(
        "SELECT DISTINCT b.scope_kind, b.scope_id \
         FROM iam_role_binding b \
         WHERE b.tenant_id = $1 AND b.status = 'active' AND b.effect = 'allow' \
           AND {PRINCIPAL_MATCH_SQL} \
           {BINDING_SCOPE_SQL}"
    );
    let rows = sqlx::query(&sql)
        .bind(tenant_id)
        .bind(user_id)
        .bind(organization_id.unwrap_or(""))
        .fetch_all(pg)
        .await
        .map_err(|error| format!("load binding data scopes failed: {error}"))?;

    Ok(rows
        .into_iter()
        .filter_map(|row| {
            let scope_kind: String = row.get(0);
            let scope_id: String = row.get(1);
            if scope_kind.is_empty() || scope_id.is_empty() {
                None
            } else {
                Some(format!("{scope_kind}:{scope_id}"))
            }
        })
        .collect())
}

pub async fn resolve_session_scopes(
    pg: &PgPool,
    tenant_id: &str,
    user_id: &str,
    organization_id: Option<&str>,
) -> Result<(Vec<String>, Vec<String>), String> {
    let mut data_scope = BTreeSet::new();
    data_scope.insert(format!("tenant:{tenant_id}"));
    if let Some(organization_id) =
        organization_id.filter(|value| !value.is_empty() && *value != "0")
    {
        data_scope.insert(format!("organization:{organization_id}"));
    } else {
        data_scope.insert(format!("user:{user_id}"));
    }
    data_scope.extend(load_binding_data_scopes(pg, tenant_id, user_id, organization_id).await?);

    let mut permission_scope =
        resolve_user_permission_scope(pg, tenant_id, user_id, organization_id).await?;
    if permission_scope.is_empty() {
        permission_scope.push("iam:self".to_string());
    }

    Ok((
        data_scope.into_iter().collect(),
        dedupe_sorted(permission_scope),
    ))
}

pub async fn resolve_standard_role_codes(
    pg: &PgPool,
    tenant_id: &str,
    user_id: &str,
    organization_id: Option<&str>,
) -> Result<Vec<String>, String> {
    let sql = format!(
        "SELECT DISTINCT r.code \
         FROM iam_role_binding b \
         JOIN iam_role r ON r.id = b.role_id AND r.tenant_id = b.tenant_id AND r.status = 'active' \
         WHERE b.tenant_id = $1 AND b.status = 'active' AND b.effect = 'allow' \
           AND r.code = ANY($4) \
           AND {PRINCIPAL_MATCH_SQL} \
           {BINDING_SCOPE_SQL} \
         ORDER BY r.code"
    );
    let rows = sqlx::query(&sql)
        .bind(tenant_id)
        .bind(user_id)
        .bind(organization_id.unwrap_or(""))
        .bind(IAM_STANDARD_ROLE_CODES)
        .fetch_all(pg)
        .await
        .map_err(|error| format!("resolve standard role codes failed: {error}"))?;

    Ok(rows
        .into_iter()
        .map(|row| row.get::<String, _>(0))
        .collect())
}

fn dedupe_sorted(mut values: Vec<String>) -> Vec<String> {
    values.sort();
    values.dedup();
    values
}

#[cfg(test)]
mod tests {
    use super::*;

    fn row(role: &str, effect: &str, permission: &str) -> BindingPermissionRow {
        BindingPermissionRow {
            role_code: role.to_string(),
            effect: effect.to_string(),
            permission_code: permission.to_string(),
        }
    }

    #[test]
    fn deny_binding_removes_allowed_permission() {
        let rows = vec![
            row("org_admin", "allow", "iam.users.read"),
            row("org_admin", "deny", "iam.users.read"),
        ];
        let effective = resolve_effective_permission_codes(&rows, &[]);
        assert!(!effective.contains(&"iam.users.read".to_string()));
    }

    #[test]
    fn deny_wildcard_suppresses_domain_permissions() {
        let rows = vec![
            row("org_admin", "allow", "iam.users.read"),
            row("org_admin", "allow", "iam.users.create"),
            row("custom", "deny", "iam.*"),
        ];
        let effective = resolve_effective_permission_codes(&rows, &[]);
        assert!(effective.is_empty());
    }

    #[test]
    fn role_exclusion_strips_conflicting_role_permissions() {
        let rows = vec![
            row("org_finance", "allow", "commerce.payments.read"),
            row("org_auditor", "allow", "iam.audit_events.read"),
        ];
        let exclusions = vec![RoleExclusionRule {
            role_code: "org_finance".to_string(),
            excludes_role_code: "org_auditor".to_string(),
        }];
        let effective = resolve_effective_permission_codes(&rows, &exclusions);
        assert!(effective.contains(&"commerce.payments.read".to_string()));
        assert!(!effective.contains(&"iam.audit_events.read".to_string()));
    }

    #[test]
    fn assignment_validation_blocks_conflicting_roles() {
        let mut active = BTreeSet::from(["org_finance".to_string()]);
        let exclusions = vec![RoleExclusionRule {
            role_code: "org_finance".to_string(),
            excludes_role_code: "org_auditor".to_string(),
        }];
        assert!(violates_role_exclusion(&active, "org_auditor", &exclusions).is_some());
        assert!(violates_role_exclusion(&active, "org_admin", &exclusions).is_none());
        active.insert("org_auditor".to_string());
        assert!(violates_role_exclusion(&active, "org_assistant", &exclusions).is_none());
    }

    #[test]
    fn assigner_must_cover_role_permissions() {
        let assigner = vec!["iam.*".to_string()];
        assert!(ensure_assigner_covers_role_permissions(
            &assigner,
            &["iam.users.read".to_string()]
        )
        .is_ok());
        assert!(ensure_assigner_covers_role_permissions(
            &assigner,
            &["commerce.orders.read".to_string()]
        )
        .is_err());
        let super_admin = vec!["*".to_string()];
        assert!(ensure_assigner_covers_role_permissions(&super_admin, &["*".to_string()]).is_ok());
    }
}
