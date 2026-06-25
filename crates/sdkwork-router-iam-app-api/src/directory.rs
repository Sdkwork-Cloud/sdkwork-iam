use axum::http::HeaderMap;
use serde_json::{json, Value};
use sqlx::{PgPool, Row};
use std::collections::HashMap;

use crate::{state::*, utils::*};
use sdkwork_iam_bootstrap::{
    DEFAULT_IAM_ORGANIZATION_CODE, DEFAULT_IAM_ORGANIZATION_ID, DEFAULT_IAM_ORGANIZATION_NAME,
    DEFAULT_IAM_ORGANIZATION_PATH, DEFAULT_IAM_TENANT_CODE, DEFAULT_IAM_TENANT_ID,
    DEFAULT_IAM_TENANT_NAME,
};
use sdkwork_iam_context_service::{
    APP_USER_ROLE_CODE, ORG_ADMIN_ROLE_CODE, PLATFORM_SUPER_ADMIN_ROLE_CODE,
};

#[derive(Clone)]
pub(crate) struct DirectorySeedContext {
    pub(crate) tenant_id: String,
    pub(crate) organization_id: String,
    pub(crate) organization_name: String,
    pub(crate) department_id: String,
    pub(crate) department_name: String,
    pub(crate) position_id: String,
    pub(crate) position_name: String,
    pub(crate) extra_organizations: Vec<LocalConfiguredOrganization>,
}

impl DirectorySeedContext {
    pub(crate) async fn resolve_for_registration(
        pg: &PgPool,
        user_tenant_id: &str,
    ) -> Result<Self, String> {
        if let Some((organization_id, _organization_code, organization_name)) =
            primary_organization_for_tenant(pg, user_tenant_id).await?
        {
            let department_id = format!("dept-{organization_id}-general");
            let position_id = format!("pos-{organization_id}-member");
            return Ok(Self {
                tenant_id: user_tenant_id.to_string(),
                organization_id,
                organization_name,
                department_id,
                department_name: "General".to_string(),
                position_id,
                position_name: "Member".to_string(),
                extra_organizations: Vec::new(),
            });
        }

        let organization_id = if user_tenant_id == DEFAULT_IAM_TENANT_ID {
            DEFAULT_IAM_ORGANIZATION_ID.to_string()
        } else {
            stable_local_id("org", &[user_tenant_id, "primary"])
        };
        let organization_name = if user_tenant_id == DEFAULT_IAM_TENANT_ID {
            DEFAULT_IAM_ORGANIZATION_NAME.to_string()
        } else {
            "Primary Organization".to_string()
        };
        Ok(Self {
            tenant_id: user_tenant_id.to_string(),
            organization_id: organization_id.clone(),
            organization_name,
            department_id: format!("dept-{organization_id}-general"),
            department_name: "General".to_string(),
            position_id: format!("pos-{organization_id}-member"),
            position_name: "Member".to_string(),
            extra_organizations: Vec::new(),
        })
    }
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub(crate) enum OpenRegistrationTenantResolution {
    Resolved(String),
}

pub(crate) async fn list_active_tenant_ids(pg: &PgPool) -> Result<Vec<String>, String> {
    sqlx::query_scalar::<_, String>("SELECT id FROM iam_tenant WHERE status = 'active' ORDER BY id")
        .fetch_all(pg)
        .await
        .map_err(|error| format!("list active tenants failed: {error}"))
}

pub(crate) async fn resolve_bootstrap_registration_tenant(
    pg: &PgPool,
    bootstrap_tenant_id: &str,
    requested_tenant_id: Option<&str>,
) -> Result<String, String> {
    let bootstrap_tenant_id = bootstrap_tenant_id.trim();
    if bootstrap_tenant_id.is_empty() {
        return Err("bootstrap access token tenant is required for registration".to_string());
    }
    if let Some(requested_tenant_id) = requested_tenant_id
        .map(str::trim)
        .filter(|value| !value.is_empty())
    {
        if requested_tenant_id != bootstrap_tenant_id {
            return Err(
                "requested tenant does not match bootstrap Access-Token tenant".to_string(),
            );
        }
    }
    let tenant_active = sqlx::query_scalar::<_, bool>(
        "SELECT EXISTS(SELECT 1 FROM iam_tenant WHERE id = $1 AND status = 'active')",
    )
    .bind(bootstrap_tenant_id)
    .fetch_one(pg)
    .await
    .map_err(|error| format!("verify bootstrap registration tenant failed: {error}"))?;
    if !tenant_active {
        return Err(format!(
            "tenant {bootstrap_tenant_id} is not available for registration"
        ));
    }
    Ok(bootstrap_tenant_id.to_string())
}

pub(crate) async fn resolve_open_registration_tenant(
    pg: &PgPool,
    requested_tenant_id: Option<&str>,
) -> Result<OpenRegistrationTenantResolution, String> {
    let tenant_ids = list_active_tenant_ids(pg).await?;

    match tenant_ids.len() {
        0 => Ok(OpenRegistrationTenantResolution::Resolved(
            provision_initial_tenant(pg).await?,
        )),
        1 => Ok(OpenRegistrationTenantResolution::Resolved(
            tenant_ids[0].clone(),
        )),
        _ => {
            if let Some(tenant_id) = requested_tenant_id
                .map(str::trim)
                .filter(|value| !value.is_empty())
            {
                if tenant_ids.iter().any(|candidate| candidate == tenant_id) {
                    return Ok(OpenRegistrationTenantResolution::Resolved(
                        tenant_id.to_string(),
                    ));
                }
                return Err(format!(
                    "tenant {tenant_id} is not available for open registration"
                ));
            }
            Ok(OpenRegistrationTenantResolution::Resolved(
                default_open_registration_tenant_id(&tenant_ids),
            ))
        }
    }
}

fn default_open_registration_tenant_id(tenant_ids: &[String]) -> String {
    tenant_ids
        .iter()
        .find(|candidate| candidate.as_str() == DEFAULT_IAM_TENANT_ID)
        .cloned()
        .unwrap_or_else(|| tenant_ids[0].clone())
}

pub(crate) async fn resolve_open_registration_tenant_id(pg: &PgPool) -> Result<String, String> {
    match resolve_open_registration_tenant(pg, None).await? {
        OpenRegistrationTenantResolution::Resolved(tenant_id) => Ok(tenant_id),
    }
}

async fn provision_initial_tenant(pg: &PgPool) -> Result<String, String> {
    sdkwork_iam_bootstrap::upsert_postgres_default_subject(pg)
        .await
        .map_err(|error| format!("provision initial tenant failed: {error}"))?;
    Ok(DEFAULT_IAM_TENANT_ID.to_string())
}

async fn primary_organization_for_tenant(
    pg: &PgPool,
    tenant_id: &str,
) -> Result<Option<(String, String, String)>, String> {
    let row = sqlx::query(
        "SELECT id, code, name FROM iam_organization \
         WHERE tenant_id = $1 AND status = 'active' \
         ORDER BY organization_kind, id LIMIT 1",
    )
    .bind(tenant_id)
    .fetch_optional(pg)
    .await
    .map_err(|error| format!("load primary organization failed: {error}"))?;
    Ok(row.map(|row| (row.get(0), row.get(1), row.get(2))))
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct SdkworkIamLocalIamUserProfile {
    pub tenant_id: String,
    pub user_id: String,
    pub username: String,
    pub display_name: String,
    pub email: Option<String>,
    pub phone: Option<String>,
    pub inactive: bool,
}

#[derive(Clone)]
pub struct SdkworkIamLocalIamDirectory {
    pub(crate) state: LocalIamState,
}

impl SdkworkIamLocalIamDirectory {
    pub async fn get_user_profile(
        &self,
        tenant_id: &str,
        user_id: &str,
    ) -> Option<SdkworkIamLocalIamUserProfile> {
        let pg = self.state.pool.as_postgres()?;
        let row = sqlx::query("SELECT id, username, display_name, email, phone, status FROM iam_user WHERE id = $1 AND tenant_id = $2 AND is_deleted = 0 LIMIT 1")
            .bind(user_id).bind(tenant_id).fetch_optional(pg).await.ok()??;
        Some(SdkworkIamLocalIamUserProfile {
            tenant_id: tenant_id.to_string(),
            user_id: row.get(0),
            username: row.get(1),
            display_name: row.get(2),
            email: row.get(3),
            phone: row.get(4),
            inactive: row.get::<String, _>(5) != "active",
        })
    }
    pub async fn search_user_profiles(
        &self,
        tenant_id: &str,
        keyword: &str,
    ) -> Vec<SdkworkIamLocalIamUserProfile> {
        let pg = match self.state.pool.as_postgres() {
            Some(p) => p,
            None => return Vec::new(),
        };
        let pattern = format!("%{}%", keyword.trim().to_ascii_lowercase());
        let rows = sqlx::query("SELECT id, username, display_name, email, phone, status FROM iam_user WHERE tenant_id = $1 AND (LOWER(username) LIKE $2 OR LOWER(display_name) LIKE $2 OR LOWER(email) LIKE $2) AND is_deleted = 0 AND status = 'active' ORDER BY display_name, id")
            .bind(tenant_id).bind(&pattern).fetch_all(pg).await.unwrap_or_default();
        rows.into_iter()
            .map(|r| SdkworkIamLocalIamUserProfile {
                tenant_id: tenant_id.to_string(),
                user_id: r.get(0),
                username: r.get(1),
                display_name: r.get(2),
                email: r.get(3),
                phone: r.get(4),
                inactive: r.get::<String, _>(5) != "active",
            })
            .collect()
    }
}

// ── User construction ──────────────────────────────────────────────

pub(crate) fn local_user_with_contacts(
    username: &str,
    email: Option<String>,
    phone: Option<String>,
) -> Option<LocalIamUser> {
    let normalized = canonical_identity(username);
    if normalized.is_empty() {
        return None;
    }
    let display_name = normalized
        .split('@')
        .next()
        .map(|v| v.replace(['.', '_', '-'], " "))
        .filter(|v| !crate::is_blank(Some(v)))
        .unwrap_or_else(|| "Local User".to_string());
    let has_email = email
        .as_deref()
        .map(canonical_identity)
        .filter(|v| v.contains('@'))
        .or_else(|| normalized.contains('@').then(|| normalized.clone()));
    Some(LocalIamUser {
        display_name: title_case_words(&display_name),
        email: has_email.clone(),
        email_verified: false,
        id: new_iam_user_id(),
        last_login_at: None,
        password_changed_at: None,
        phone: phone
            .as_deref()
            .map(canonical_identity)
            .filter(|v| !v.is_empty()),
        phone_verified: false,
        tenant_id: String::new(),
        username: normalized,
    })
}

// ── Database-driven directory seeding ──────────────────────────────

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub(crate) enum UserDirectoryGrant {
    BootstrapOwner,
    RegisteredMember,
}

pub(crate) async fn resolve_registration_directory_grant(
    pg: &PgPool,
    tenant_id: &str,
) -> Result<UserDirectoryGrant, String> {
    if tenant_lacks_bootstrap_owner(pg, tenant_id).await? {
        Ok(UserDirectoryGrant::BootstrapOwner)
    } else {
        Ok(UserDirectoryGrant::RegisteredMember)
    }
}

async fn tenant_lacks_bootstrap_owner(pg: &PgPool, tenant_id: &str) -> Result<bool, String> {
    let owner_count: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM iam_organization_membership \
         WHERE tenant_id = $1 AND membership_kind = 'owner' AND status = 'active'",
    )
    .bind(tenant_id)
    .fetch_one(pg)
    .await
    .map_err(|error| format!("count bootstrap owners failed: {error}"))?;
    Ok(owner_count == 0)
}

pub(crate) async fn ensure_user_directory_db(
    pg: &PgPool,
    seed: &DirectorySeedContext,
    config: &LocalIamConfig,
    user: &LocalIamUser,
    grant: UserDirectoryGrant,
) -> Result<(), String> {
    let now = current_timestamp_utc();
    let (tenant_code, tenant_name) = if seed.tenant_id == DEFAULT_IAM_TENANT_ID {
        (
            DEFAULT_IAM_TENANT_CODE.to_string(),
            DEFAULT_IAM_TENANT_NAME.to_string(),
        )
    } else {
        (seed.tenant_id.clone(), format!("Tenant {}", seed.tenant_id))
    };
    sqlx::query("INSERT INTO iam_tenant (id, code, name, status, created_at, updated_at) VALUES ($1,$2,$3,'active',$4,$5) ON CONFLICT (id) DO UPDATE SET code = excluded.code, name = excluded.name, status = excluded.status, updated_at = excluded.updated_at")
        .bind(&seed.tenant_id).bind(&tenant_code).bind(&tenant_name).bind(&now).bind(&now).execute(pg).await.map_err(|e| format!("ensure tenant: {e}"))?;
    ensure_tenant_member_db(pg, &seed.tenant_id, &user.id, grant, &now).await?;
    let (organization_code, organization_path) =
        if seed.organization_id == DEFAULT_IAM_ORGANIZATION_ID {
            (
                DEFAULT_IAM_ORGANIZATION_CODE.to_string(),
                DEFAULT_IAM_ORGANIZATION_PATH.to_string(),
            )
        } else {
            (
                seed.organization_id.clone(),
                format!("/{}", seed.organization_id),
            )
        };
    ensure_configured_organization_db(
        pg,
        &seed.tenant_id,
        &seed.organization_id,
        &organization_code,
        &seed.organization_name,
        &organization_path,
        0,
        &now,
    )
    .await?;
    for (index, organization) in seed.extra_organizations.iter().enumerate() {
        ensure_configured_organization_db(
            pg,
            &seed.tenant_id,
            &organization.id,
            &organization.id,
            &organization.name,
            &format!("/{}", organization.id),
            (index as i64) + 1,
            &now,
        )
        .await?;
    }
    let dept_code = "general".to_string();
    sqlx::query("INSERT INTO iam_department (id,tenant_id,organization_id,code,name,department_kind,path,status,created_at,updated_at) VALUES ($1,$2,$3,$4,$5,'general',$6,'active',$7,$8) ON CONFLICT (tenant_id,organization_id,code) DO NOTHING")
        .bind(&seed.department_id).bind(&seed.tenant_id).bind(&seed.organization_id).bind(&dept_code).bind(&seed.department_name).bind(&format!("/{}/{}", seed.organization_id, dept_code)).bind(&now).bind(&now).execute(pg).await.map_err(|e| format!("ensure dept: {e}"))?;
    let position_code = "member".to_string();
    sqlx::query("INSERT INTO iam_position (id,tenant_id,organization_id,code,name,position_kind,status,created_at,updated_at) VALUES ($1,$2,$3,$4,$5,'member','active',$6,$7) ON CONFLICT (tenant_id,organization_id,code) DO NOTHING")
        .bind(&seed.position_id).bind(&seed.tenant_id).bind(&seed.organization_id).bind(&position_code).bind(&seed.position_name).bind(&now).bind(&now).execute(pg).await.map_err(|e| format!("ensure pos: {e}"))?;
    let membership_id = local_membership_id(&seed.organization_id, &user.id);
    let (membership_kind, is_primary) = match grant {
        UserDirectoryGrant::BootstrapOwner => ("owner", 1),
        UserDirectoryGrant::RegisteredMember => ("member", 1),
    };
    sqlx::query("INSERT INTO iam_organization_membership (id,tenant_id,organization_id,user_id,membership_kind,is_primary,status,joined_at,created_at,updated_at) VALUES ($1,$2,$3,$4,$5,$6,'active',$7,$8,$9) ON CONFLICT (tenant_id,organization_id,user_id,membership_kind) DO NOTHING")
        .bind(&membership_id).bind(&seed.tenant_id).bind(&seed.organization_id).bind(&user.id).bind(membership_kind).bind(is_primary).bind(&now).bind(&now).bind(&now).execute(pg).await.map_err(|e| format!("ensure membership: {e}"))?;
    for organization in &seed.extra_organizations {
        let membership_id = local_membership_id(&organization.id, &user.id);
        sqlx::query("INSERT INTO iam_organization_membership (id,tenant_id,organization_id,user_id,membership_kind,is_primary,status,joined_at,created_at,updated_at) VALUES ($1,$2,$3,$4,'member',0,'active',$5,$6,$7) ON CONFLICT (tenant_id,organization_id,user_id,membership_kind) DO NOTHING")
            .bind(&membership_id).bind(&seed.tenant_id).bind(&organization.id).bind(&user.id).bind(&now).bind(&now).bind(&now).execute(pg).await.map_err(|e| format!("ensure extra membership: {e}"))?;
    }
    let dept_assign_id = local_department_assignment_id(&seed.department_id, &user.id);
    sqlx::query("INSERT INTO iam_department_assignment (id,tenant_id,organization_id,organization_membership_id,department_id,user_id,assignment_kind,is_primary,effective_from,status,created_at,updated_at) VALUES ($1,$2,$3,$4,$5,$6,'primary',1,$7,'active',$8,$9) ON CONFLICT (tenant_id,organization_id,organization_membership_id,department_id,assignment_kind) DO NOTHING")
        .bind(&dept_assign_id).bind(&seed.tenant_id).bind(&seed.organization_id).bind(&membership_id).bind(&seed.department_id).bind(&user.id).bind(&now).bind(&now).bind(&now).execute(pg).await.map_err(|e| format!("ensure dept assign: {e}"))?;
    let pos_assign_id = local_position_assignment_id(&dept_assign_id, &seed.position_id);
    sqlx::query("INSERT INTO iam_position_assignment (id,tenant_id,organization_id,department_assignment_id,position_id,user_id,is_primary,effective_from,status,created_at,updated_at) VALUES ($1,$2,$3,$4,$5,$6,1,$7,'active',$8,$9) ON CONFLICT (tenant_id,organization_id,department_assignment_id,position_id) DO NOTHING")
        .bind(&pos_assign_id).bind(&seed.tenant_id).bind(&seed.organization_id).bind(&dept_assign_id).bind(&seed.position_id).bind(&user.id).bind(&now).bind(&now).bind(&now).execute(pg).await.map_err(|e| format!("ensure pos assign: {e}"))?;
    if grant == UserDirectoryGrant::BootstrapOwner {
        ensure_bootstrap_admin_role_bindings_db(
            pg,
            &seed.tenant_id,
            &seed.organization_id,
            &membership_id,
            &user.id,
            &now,
        )
        .await?;
    } else {
        sdkwork_iam_bootstrap::upsert_postgres_standard_roles(pg, &seed.tenant_id)
            .await
            .map_err(|error| format!("upsert standard roles: {error}"))?;
        ensure_tenant_user_role_binding_db(pg, &seed.tenant_id, &user.id, APP_USER_ROLE_CODE, &now)
            .await?;
    }
    let _ = config;
    Ok(())
}

pub(crate) async fn ensure_tenant_member_db(
    pg: &PgPool,
    tenant_id: &str,
    user_id: &str,
    grant: UserDirectoryGrant,
    now: &chrono::DateTime<chrono::Utc>,
) -> Result<(), String> {
    let member_kind = match grant {
        UserDirectoryGrant::BootstrapOwner => "owner",
        UserDirectoryGrant::RegisteredMember => "member",
    };
    let member_id = stable_local_id("iamtenantmember", &[tenant_id, user_id, member_kind]);
    sqlx::query(
        "INSERT INTO iam_tenant_member (id, tenant_id, user_id, member_kind, status, joined_at, created_at, updated_at) \
         VALUES ($1, $2, $3, $4, 'active', $5, $6, $7) \
         ON CONFLICT (tenant_id, user_id, member_kind) DO UPDATE SET \
           status = 'active', updated_at = EXCLUDED.updated_at",
    )
    .bind(&member_id)
    .bind(tenant_id)
    .bind(user_id)
    .bind(member_kind)
    .bind(now)
    .bind(now)
    .bind(now)
    .execute(pg)
    .await
    .map_err(|error| format!("ensure tenant member: {error}"))?;
    Ok(())
}

#[allow(dead_code)]
pub(crate) async fn has_active_tenant_member(
    pg: &PgPool,
    tenant_id: &str,
    user_id: &str,
) -> Result<bool, String> {
    let exists = sqlx::query_scalar::<_, bool>(
        "SELECT EXISTS( \
            SELECT 1 FROM iam_tenant_member \
            WHERE tenant_id = $1 AND user_id = $2 AND status = 'active' \
         )",
    )
    .bind(tenant_id)
    .bind(user_id)
    .fetch_one(pg)
    .await
    .map_err(|error| format!("check tenant member failed: {error}"))?;
    Ok(exists)
}

pub(crate) async fn backfill_tenant_members(pg: &PgPool, tenant_id: &str) -> Result<(), String> {
    if tenant_id.is_empty() {
        return Ok(());
    }
    let rows = sqlx::query(
        "SELECT u.id \
         FROM iam_user u \
         WHERE u.tenant_id = $1 AND u.status = 'active' AND u.is_deleted = 0 \
           AND NOT EXISTS ( \
             SELECT 1 FROM iam_tenant_member m \
             WHERE m.tenant_id = u.tenant_id AND m.user_id = u.id AND m.status = 'active' \
           )",
    )
    .bind(tenant_id)
    .fetch_all(pg)
    .await
    .map_err(|error| format!("list users for tenant member backfill failed: {error}"))?;
    let now = current_timestamp_utc();
    for row in rows {
        let user_id: String = row.get(0);
        let member_id = stable_local_id("iamtenantmember", &[tenant_id, &user_id, "member"]);
        sqlx::query(
            "INSERT INTO iam_tenant_member (id, tenant_id, user_id, member_kind, status, joined_at, created_at, updated_at) \
             VALUES ($1, $2, $3, 'member', 'active', $4, $4, $4) \
             ON CONFLICT (tenant_id, user_id, member_kind) DO NOTHING",
        )
        .bind(&member_id)
        .bind(tenant_id)
        .bind(&user_id)
        .bind(&now)
        .execute(pg)
        .await
        .map_err(|error| format!("backfill tenant member failed: {error}"))?;
    }
    Ok(())
}

const LEGACY_OWNER_ROLE_CODE: &str = "owner";

async fn ensure_bootstrap_admin_role_bindings_db(
    pg: &PgPool,
    tenant_id: &str,
    organization_id: &str,
    membership_id: &str,
    user_id: &str,
    now: &chrono::DateTime<chrono::Utc>,
) -> Result<(), String> {
    sdkwork_iam_bootstrap::upsert_postgres_standard_roles(pg, tenant_id)
        .await
        .map_err(|error| format!("upsert standard roles: {error}"))?;

    ensure_organization_role_binding_db(
        pg,
        tenant_id,
        organization_id,
        membership_id,
        ORG_ADMIN_ROLE_CODE,
        now,
    )
    .await?;
    ensure_organization_role_binding_db(
        pg,
        tenant_id,
        organization_id,
        membership_id,
        PLATFORM_SUPER_ADMIN_ROLE_CODE,
        now,
    )
    .await?;
    ensure_tenant_user_role_binding_db(pg, tenant_id, user_id, APP_USER_ROLE_CODE, now).await?;

    // Deprecated alias retained for one migration generation.
    let legacy_role_id = stable_local_id("iamrole", &[tenant_id, LEGACY_OWNER_ROLE_CODE]);
    sqlx::query(
        "INSERT INTO iam_role (id, tenant_id, code, name, status, created_at, updated_at) \
         VALUES ($1, $2, $3, $4, 'active', $5, $6) \
         ON CONFLICT (tenant_id, code) DO NOTHING",
    )
    .bind(&legacy_role_id)
    .bind(tenant_id)
    .bind(LEGACY_OWNER_ROLE_CODE)
    .bind("Organization Owner (deprecated)")
    .bind(now)
    .bind(now)
    .execute(pg)
    .await
    .map_err(|error| format!("ensure legacy owner role: {error}"))?;

    Ok(())
}

async fn ensure_organization_role_binding_db(
    pg: &PgPool,
    tenant_id: &str,
    organization_id: &str,
    membership_id: &str,
    role_code: &str,
    now: &chrono::DateTime<chrono::Utc>,
) -> Result<(), String> {
    sdkwork_iam_bootstrap::ensure_role_assignment_allowed(
        pg,
        tenant_id,
        "organization_membership",
        membership_id,
        "organization",
        organization_id,
        role_code,
    )
    .await?;

    let role_id = sdkwork_iam_bootstrap::standard_role_id(tenant_id, role_code);
    let binding_id =
        local_role_binding_id(membership_id, "organization", organization_id, role_code);
    sqlx::query(
        "INSERT INTO iam_role_binding (id, tenant_id, organization_id, role_id, principal_kind, \
         principal_id, scope_kind, scope_id, effect, status, created_at, updated_at) \
         VALUES ($1, $2, $3, $4, 'organization_membership', $5, 'organization', $6, 'allow', \
         'active', $7, $8) \
         ON CONFLICT (tenant_id, role_id, principal_kind, principal_id, scope_kind, scope_id) DO NOTHING",
    )
    .bind(&binding_id)
    .bind(tenant_id)
    .bind(organization_id)
    .bind(&role_id)
    .bind(membership_id)
    .bind(organization_id)
    .bind(now)
    .bind(now)
    .execute(pg)
    .await
    .map_err(|error| format!("ensure organization role binding: {error}"))?;
    Ok(())
}

async fn ensure_tenant_user_role_binding_db(
    pg: &PgPool,
    tenant_id: &str,
    user_id: &str,
    role_code: &str,
    now: &chrono::DateTime<chrono::Utc>,
) -> Result<(), String> {
    let role_id = sdkwork_iam_bootstrap::standard_role_id(tenant_id, role_code);
    let binding_id = local_role_binding_id(user_id, "tenant", tenant_id, role_code);
    sqlx::query(
        "INSERT INTO iam_role_binding (id, tenant_id, organization_id, role_id, principal_kind, \
         principal_id, scope_kind, scope_id, effect, status, created_at, updated_at) \
         VALUES ($1, $2, '0', $3, 'user', $4, 'tenant', $5, 'allow', 'active', $6, $7) \
         ON CONFLICT (tenant_id, role_id, principal_kind, principal_id, scope_kind, scope_id) DO NOTHING",
    )
    .bind(&binding_id)
    .bind(tenant_id)
    .bind(&role_id)
    .bind(user_id)
    .bind(tenant_id)
    .bind(now)
    .bind(now)
    .execute(pg)
    .await
    .map_err(|error| format!("ensure tenant user role binding: {error}"))?;
    Ok(())
}

async fn ensure_configured_organization_db(
    pg: &PgPool,
    tenant_id: &str,
    organization_id: &str,
    organization_code: &str,
    organization_name: &str,
    organization_path: &str,
    _sort_order: i64,
    now: &chrono::DateTime<chrono::Utc>,
) -> Result<(), String> {
    sqlx::query("INSERT INTO iam_organization (id,tenant_id,code,name,organization_kind,tenant_boundary_kind,data_boundary_kind,app_boundary_enabled,verification_status,path,status,created_at,updated_at) VALUES ($1,$2,$3,$4,'team','exclusive','tenant',0,'verified',$5,'active',$6,$7) ON CONFLICT (tenant_id,code) DO NOTHING")
        .bind(organization_id)
        .bind(tenant_id)
        .bind(organization_code)
        .bind(organization_name)
        .bind(organization_path)
        .bind(now)
        .bind(now)
        .execute(pg)
        .await
        .map_err(|e| format!("ensure org: {e}"))?;
    sqlx::query("UPDATE iam_organization SET updated_at = $3 WHERE tenant_id = $1 AND id = $2 AND status = 'active'")
        .bind(tenant_id)
        .bind(organization_id)
        .bind(now)
        .execute(pg)
        .await
        .map_err(|e| format!("touch org: {e}"))?;
    Ok(())
}

// ── JSON serialization ─────────────────────────────────────────────

pub(crate) fn session_to_json(session: &LocalSession) -> Value {
    let mut v = json!({
        "accessToken": session.access_token, "authToken": session.auth_token,
        "sessionId": session.session_id,
        "context": app_context_to_json(&session.context),
        "user": user_to_json(&session.user),
    });
    if !session.refresh_token.is_empty() {
        v["refreshToken"] = json!(session.refresh_token);
    }
    v
}

pub(crate) fn user_to_json(user: &LocalIamUser) -> Value {
    let (first, last) = split_display_name(&user.display_name);
    let mut v = json!({
        "displayName": user.display_name,
        "emailVerified": user.email_verified,
        "firstName": first,
        "id": user.id,
        "lastName": last,
        "name": user.display_name,
        "nickname": user.display_name,
        "phoneVerified": user.phone_verified,
        "tenantId": user.tenant_id,
        "userId": user.id,
        "username": user.username
    });
    if let Some(e) = &user.email {
        v["email"] = json!(e);
    }
    if let Some(p) = &user.phone {
        v["phone"] = json!(p);
    }
    v
}

pub(crate) fn app_context_to_json(ctx: &sdkwork_iam_context_service::IamAppContext) -> Value {
    json!({
        "appId": ctx.app_id, "authLevel": auth_level_to_string(&ctx.auth_level), "dataScope": ctx.data_scope,
        "deploymentMode": deployment_mode_to_string(&ctx.deployment_mode), "environment": environment_to_string(&ctx.environment),
        "loginScope": login_scope_to_string(&ctx.login_scope),
        "organizationId": sdkwork_iam_context_service::serialize_session_organization_id(
            ctx.organization_id.as_deref(),
            &ctx.login_scope,
        ),
        "permissionScope": ctx.permission_scope, "sessionId": ctx.session_id, "tenantId": ctx.tenant_id, "userId": ctx.user_id
    })
}

pub(crate) fn organization_to_json(o: &LocalOrganization) -> Value {
    json!({
        "appBoundaryEnabled": o.app_boundary_enabled, "dataBoundaryKind": o.data_boundary_kind, "displayName": o.name,
        "id": o.id, "name": o.name, "order": o.order, "organizationId": o.id, "organizationKind": o.organization_kind,
        "parentOrganizationId": o.parent_organization_id, "status": o.status, "tenantBoundaryKind": o.tenant_boundary_kind,
        "tenantId": o.tenant_id, "verificationStatus": o.verification_status
    })
}

pub(crate) fn organization_membership_to_json(m: &LocalOrganizationMembership) -> Value {
    let mut v = json!({"displayName": m.user.display_name, "id": m.id, "isPrimary": m.primary,
        "membershipId": m.id, "membershipType": m.membership_type, "order": m.order, "organizationId": m.organization_id,
        "primary": m.primary, "status": m.status, "tenantId": m.tenant_id, "userId": m.user_id, "user": user_to_json(&m.user)});
    if let Some(e) = &m.user.email {
        v["email"] = json!(e);
    }
    v
}

pub(crate) fn department_to_json(d: &LocalDepartment) -> Value {
    json!({
        "departmentId": d.id, "displayName": d.name, "id": d.id, "name": d.name, "order": d.order,
        "organizationId": d.organization_id, "parentDepartmentId": d.parent_department_id,
        "parentId": d.parent_department_id, "status": d.status, "tenantId": d.tenant_id
    })
}

pub(crate) fn position_to_json(p: &LocalPosition) -> Value {
    json!({
        "displayName": p.name, "id": p.id, "name": p.name, "order": p.order, "organizationId": p.organization_id,
        "positionId": p.id, "positionName": p.name, "status": p.status, "tenantId": p.tenant_id
    })
}

pub(crate) fn department_assignment_to_json(a: &LocalDepartmentAssignment) -> Value {
    json!({
        "assignmentType": a.assignment_type,
        "departmentAssignmentId": a.id,
        "departmentId": a.department_id,
        "displayName": a.user.display_name,
        "id": a.id,
        "order": a.order,
        "organizationId": a.organization_id,
        "organizationMembershipId": a.organization_membership_id,
        "status": a.status,
        "tenantId": a.tenant_id,
        "user": user_to_json(&a.user),
        "userId": a.user_id
    })
}

pub(crate) fn position_assignment_to_json(a: &LocalPositionAssignment) -> Value {
    json!({
        "departmentAssignmentId": a.department_assignment_id,
        "departmentId": a.department_id,
        "id": a.id,
        "order": a.order,
        "organizationId": a.organization_id,
        "positionId": a.position_id,
        "positionName": a.position_name,
        "status": a.status,
        "tenantId": a.tenant_id,
        "userId": a.user_id
    })
}

pub(crate) fn role_binding_to_json(b: &LocalRoleBinding) -> Value {
    json!({
        "id": b.id,
        "order": b.order,
        "principalId": b.principal_id,
        "roleCode": b.role_code,
        "scopeId": b.scope_id,
        "scopeKind": b.scope_kind,
        "status": b.status,
        "tenantId": b.tenant_id
    })
}

// ── Tree building ──────────────────────────────────────────────────

pub(crate) fn organization_roots(
    orgs: &[LocalOrganization],
    query: &HashMap<String, String>,
) -> Vec<LocalOrganization> {
    if let Some(oid) = query_value(query, &["organizationId", "organization_id", "id"]) {
        return orgs.iter().filter(|o| o.id == oid).cloned().collect();
    }
    if let Some(pid) = query_value(
        query,
        &[
            "parentOrganizationId",
            "parent_organization_id",
            "parentId",
            "parent_id",
        ],
    ) {
        return orgs
            .iter()
            .filter(|o| o.parent_organization_id.as_deref() == Some(pid))
            .cloned()
            .collect();
    }
    orgs.iter()
        .filter(|o| {
            o.parent_organization_id
                .as_deref()
                .is_none_or(|pid| !orgs.iter().any(|c| c.id == pid))
        })
        .cloned()
        .collect()
}

pub(crate) fn department_roots(
    deps: &[LocalDepartment],
    query: &HashMap<String, String>,
) -> Vec<LocalDepartment> {
    if let Some(did) = query_value(query, &["departmentId", "department_id", "id"]) {
        return deps.iter().filter(|d| d.id == did).cloned().collect();
    }
    if let Some(pid) = query_value(
        query,
        &[
            "parentDepartmentId",
            "parent_department_id",
            "parentId",
            "parent_id",
        ],
    ) {
        return deps
            .iter()
            .filter(|d| d.parent_department_id.as_deref() == Some(pid))
            .cloned()
            .collect();
    }
    deps.iter()
        .filter(|d| {
            d.parent_department_id
                .as_deref()
                .is_none_or(|pid| !deps.iter().any(|c| c.id == pid))
        })
        .cloned()
        .collect()
}

pub(crate) fn organization_node_to_json(
    o: &LocalOrganization,
    orgs: &[LocalOrganization],
) -> Value {
    let mut node = organization_to_json(o);
    let children: Vec<Value> = orgs
        .iter()
        .filter(|c| c.parent_organization_id.as_deref() == Some(o.id.as_str()))
        .map(|c| organization_node_to_json(c, orgs))
        .collect();
    node["children"] = json!(children);
    node
}

pub(crate) fn department_node_to_json(d: &LocalDepartment, deps: &[LocalDepartment]) -> Value {
    let mut node = department_to_json(d);
    let children: Vec<Value> = deps
        .iter()
        .filter(|c| c.parent_department_id.as_deref() == Some(d.id.as_str()))
        .map(|c| department_node_to_json(c, deps))
        .collect();
    node["children"] = json!(children);
    node
}

// ── QR session ─────────────────────────────────────────────────────

fn qr_session_base_json(s: &LocalQrSession) -> Value {
    json!({
        "expireTime": s.expire_time,
        "expiresAt": s.expire_time.to_string(),
        "fallbackUrl": s.fallback_url,
        "purpose": s.purpose,
        "qrContent": {"content": s.qr_content, "mode": s.qr_content_mode},
        "sessionKey": s.session_key,
        "status": s.status,
        "type": s.purpose,
    })
}

fn apply_qr_login_challenge_fields(v: &mut Value, s: &LocalQrSession) {
    if let Some(ch) = &s.organization_selection {
        v["accessToken"] = Value::Null;
        v["authToken"] = Value::Null;
        v["challengeType"] = ch["challengeType"].clone();
        v["continuationToken"] = ch["continuationToken"].clone();
        v["session"] = Value::Null;
        if ch["challengeType"] == "LOGIN_CONTEXT_SELECTION" {
            v["loginContextSelection"] = ch.clone();
            v["options"] = ch["options"].clone();
            v["organizations"] = ch["organizations"].clone();
        } else {
            v["organizationSelection"] = ch.clone();
            v["organizations"] = ch["organizations"].clone();
        }
    }
}

/// Public poll payload: never includes session tokens.
pub(crate) fn qr_session_poll_json(s: &LocalQrSession) -> Value {
    let mut v = qr_session_base_json(s);
    if s.status == "completed" && s.completed_session.is_some() && !s.session_exchanged {
        v["sessionReady"] = json!(true);
    }
    apply_qr_login_challenge_fields(&mut v, s);
    v
}

/// Creator payload: includes the poll secret required to exchange completed sessions.
pub(crate) fn qr_session_create_json(s: &LocalQrSession) -> Value {
    let mut v = qr_session_poll_json(s);
    v["pollSecret"] = json!(s.poll_secret);
    v
}

/// Completion payload for authenticated mobile password completion flows.
pub(crate) fn qr_session_completion_json(s: &LocalQrSession) -> Value {
    let mut v = qr_session_poll_json(s);
    if let Some(sess) = &s.completed_session {
        v["session"] = session_to_json(sess);
    }
    apply_qr_login_challenge_fields(&mut v, s);
    v
}

#[allow(dead_code)]
pub(crate) fn qr_session_to_json(s: &LocalQrSession) -> Value {
    qr_session_completion_json(s)
}

pub(crate) fn secure_compare_secrets(expected: &str, actual: &str) -> bool {
    if expected.len() != actual.len() {
        return false;
    }
    let mut diff = 0u8;
    for (left, right) in expected.bytes().zip(actual.bytes()) {
        diff |= left ^ right;
    }
    diff == 0
}

// ── QR entry URL ───────────────────────────────────────────────────

pub(crate) fn build_oauth_device_authorization_entry_url(
    headers: &HeaderMap,
    session_key: &str,
    purpose: &str,
    poll_secret: &str,
) -> String {
    let origin = resolve_oauth_device_authorization_entry_origin(headers);
    let base = format!(
        "{origin}/auth/qr/{}?session_key={}&purpose={}&scan_source=browser",
        percent_encode_path_segment(session_key),
        percent_encode_query_component(session_key),
        percent_encode_query_component(purpose),
    );
    if poll_secret.trim().is_empty() {
        return base;
    }
    format!(
        "{base}#poll_secret={}",
        percent_encode_query_component(poll_secret),
    )
}

pub(crate) fn resolve_oauth_device_authorization_entry_origin(headers: &HeaderMap) -> String {
    if let Some(o) = first_env_value(&[
        "SDKWORK_IAM_QR_ENTRY_ORIGIN",
        "SDKWORK_AUTH_QR_ENTRY_ORIGIN",
        "SDKWORK_PUBLIC_APP_ORIGIN",
        "SDKWORK_PUBLIC_BASE_URL",
    ]) {
        return trim_trailing_slash(&o);
    }
    let origin_parts = header_value(headers, "origin")
        .and_then(first_forwarded_header_value)
        .and_then(parse_http_origin);
    let forwarded_proto = header_value(headers, "x-forwarded-proto")
        .and_then(first_forwarded_header_value)
        .filter(|v| is_http_scheme(v))
        .or_else(|| origin_parts.as_ref().map(|(s, _)| s.clone()));
    let forwarded_host = header_value(headers, "x-forwarded-host")
        .and_then(first_forwarded_header_value)
        .or_else(|| header_value(headers, "host").map(|v| v.to_string()))
        .or_else(|| origin_parts.map(|(_, h)| h));
    match forwarded_host {
        Some(host) if is_safe_host(&host) => format!(
            "{}://{}",
            forwarded_proto.unwrap_or_else(|| "http".to_string()),
            trim_trailing_slash(&host)
        ),
        _ => "http://127.0.0.1:18079".to_string(),
    }
}

fn header_value<'a>(headers: &'a HeaderMap, name: &str) -> Option<&'a str> {
    headers.get(name).and_then(|v| v.to_str().ok())
}
fn first_forwarded_header_value(v: &str) -> Option<String> {
    v.split(',')
        .next()
        .map(str::trim)
        .filter(|v| !v.is_empty())
        .map(|v| v.to_string())
}
fn is_http_scheme(v: &str) -> bool {
    matches!(v, "http" | "https")
}
fn parse_http_origin(v: String) -> Option<(String, String)> {
    let (scheme, rest) = v.split_once("://")?;
    if !is_http_scheme(scheme) {
        return None;
    }
    let host = rest
        .split('/')
        .next()
        .map(str::trim)
        .filter(|h| is_safe_host(h))?;
    Some((scheme.to_string(), host.to_string()))
}
fn is_safe_host(v: &str) -> bool {
    !crate::is_blank(Some(v)) && !v.contains('/') && !v.contains('\\') && !v.contains('@')
}
fn trim_trailing_slash(v: &str) -> String {
    v.trim().trim_end_matches('/').to_string()
}
fn percent_encode_query_component(v: &str) -> String {
    percent_encode(v, false)
}
fn percent_encode_path_segment(v: &str) -> String {
    percent_encode(v, true)
}
fn percent_encode(v: &str, keep_colon: bool) -> String {
    let mut e = String::new();
    for b in v.bytes() {
        let unreserved = b.is_ascii_alphanumeric()
            || matches!(b, b'-' | b'.' | b'_' | b'~')
            || (keep_colon && b == b':');
        if unreserved {
            e.push(b as char);
        } else {
            e.push_str(&format!("%{b:02X}"));
        }
    }
    e
}
