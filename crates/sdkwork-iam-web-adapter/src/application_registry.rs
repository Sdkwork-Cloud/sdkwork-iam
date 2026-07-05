//! Registered applications and tenant applications for IAM bootstrap flows.

use serde_json::{json, Value};
use sqlx::{types::Json, PgPool, Row};
use std::collections::BTreeSet;

pub const IAM_APPLICATIONS_REGISTER_PERMISSION: &str = "iam.applications.register";
pub const IAM_TENANT_APPLICATIONS_PROVISION_PERMISSION: &str = "iam.tenant_applications.provision";
pub const IAM_TENANT_APPLICATIONS_UPDATE_PERMISSION: &str = "iam.tenant_applications.update";
pub const IAM_TENANT_APPLICATIONS_ENABLE_PERMISSION: &str = "iam.tenant_applications.enable";

pub const PLATFORM_APPLICATION_TEMPLATE_ID: &str = "tmpl_sdkwork_platform";
pub const PLATFORM_APPLICATION_KEY: &str = "sdkwork-platform";

/// Deterministic runtime app id for a tenant's default platform instance.
pub fn platform_runtime_app_id_for_tenant(tenant_id: &str) -> String {
    format!("app_{}", tenant_id.trim())
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ApplicationRegisterCommand {
    pub owner_tenant_id: String,
    pub app_key: String,
    pub name: String,
    pub display_name: String,
    pub app_type: String,
    pub package_name: Option<String>,
    pub bundle_id: Option<String>,
    pub desktop_app_id: Option<String>,
    pub version: String,
    pub channel: String,
    pub default_access_permissions: Vec<String>,
    pub runtime_config: Value,
    pub artifacts_config: Value,
    pub packages: Vec<ApplicationPackageSyncCommand>,
    pub manifest_hash: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TenantApplicationProvisionCommand {
    pub tenant_id: String,
    pub organization_id: String,
    pub template_id: Option<String>,
    pub app_key: Option<String>,
    pub instance_key: String,
    pub display_name: String,
    pub environment: String,
    pub primary_domain: Option<String>,
    pub access_permissions: Vec<String>,
    pub runtime_config: Value,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TenantApplicationUpdateCommand {
    pub primary_domain: Option<String>,
    pub domain_config: Option<Value>,
    pub access_permissions: Option<Vec<String>>,
    pub runtime_config: Option<Value>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ApplicationPackageSyncCommand {
    pub package_id: String,
    pub platform: String,
    pub architecture: Option<String>,
    pub language: Option<String>,
    pub runtime_target: String,
    pub deployment_profile: String,
    pub package_format: String,
    pub version: Option<String>,
    pub config: Value,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct RegisteredApplicationTemplate {
    pub id: String,
    pub app_key: String,
    pub name: String,
    pub package_name: Option<String>,
    pub version: String,
    pub default_access_permissions: Vec<String>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TenantApplication {
    pub id: String,
    pub app_id: String,
    pub tenant_id: String,
    pub organization_id: String,
    pub template_id: String,
    pub template_version: String,
    pub instance_key: String,
    pub display_name: String,
    pub environment: String,
    pub status: String,
    pub primary_domain: Option<String>,
    pub access_permissions: Vec<String>,
    pub runtime_config: Value,
}

pub async fn validate_enabled_tenant_runtime_app(
    pg: &PgPool,
    tenant_id: &str,
    runtime_app_id: &str,
) -> Result<(), String> {
    if crate::is_blank(Some(runtime_app_id)) {
        return Err("runtime appId is required".to_string());
    }

    let row = sqlx::query(
        "SELECT status FROM iam_tenant_application \
         WHERE tenant_id = $1 AND app_id = $2 \
         LIMIT 1",
    )
    .bind(tenant_id)
    .bind(runtime_app_id)
    .fetch_optional(pg)
    .await
    .map_err(|error| format!("load tenant runtime application failed: {error}"))?;

    let Some(row) = row else {
        return Err(format!(
            "runtime appId {runtime_app_id} is not provisioned for tenant {tenant_id}"
        ));
    };

    let status: String = row.get(0);
    if status != "enabled" {
        return Err(format!(
            "tenant application {runtime_app_id} must be enabled before use (status={status})"
        ));
    }

    Ok(())
}

pub async fn ensure_platform_tenant_application(
    pg: &PgPool,
    tenant_id: &str,
) -> Result<String, String> {
    let runtime_app_id = platform_runtime_app_id_for_tenant(tenant_id);
    let now = chrono::Utc::now();

    sqlx::query(
        "INSERT INTO iam_application_template (id, owner_tenant_id, app_key, name, display_name, app_type, \
         version, channel, status, runtime_config_json, artifacts_config_json, default_access_permissions_json, \
         created_at, updated_at) \
         VALUES ($1, '0', $2, $2, 'SDKWork Platform', 'WEB', '1.0.0', 'stable', 'active', '{}'::jsonb, '{}'::jsonb, \
         '[\"iam:self\"]'::jsonb, $3, $3) \
         ON CONFLICT (id) DO UPDATE SET status = 'active', updated_at = EXCLUDED.updated_at",
    )
    .bind(PLATFORM_APPLICATION_TEMPLATE_ID)
    .bind(PLATFORM_APPLICATION_KEY)
    .bind(&now)
    .execute(pg)
    .await
    .map_err(|error| format!("ensure platform application template failed: {error}"))?;

    let tenant_application_id =
        tenant_application_row_id(tenant_id, "0", PLATFORM_APPLICATION_TEMPLATE_ID);
    sqlx::query("DELETE FROM iam_tenant_application WHERE app_id = $1")
        .bind(&runtime_app_id)
        .execute(pg)
        .await
        .map_err(|error| format!("reset platform tenant application app_id failed: {error}"))?;
    sqlx::query(
        "DELETE FROM iam_tenant_application \
         WHERE tenant_id = $1 AND organization_id = '0' AND template_id = $2",
    )
    .bind(tenant_id)
    .bind(PLATFORM_APPLICATION_TEMPLATE_ID)
    .execute(pg)
    .await
    .map_err(|error| format!("reset platform tenant application rows failed: {error}"))?;
    let primary_domain = resolve_tenant_application_primary_domain(
        pg,
        tenant_id,
        &tenant_application_id,
        "localhost",
        &runtime_app_id,
    )
    .await?;
    sqlx::query(
        "INSERT INTO iam_tenant_application (id, app_id, tenant_id, organization_id, template_id, \
         template_version, instance_key, display_name, environment, status, primary_domain, \
         domain_config_json, access_permissions_json, runtime_config_json, provisioned_at, activated_at, \
         created_at, updated_at) \
         VALUES ($1, $2, $3, '0', $4, '1.0.0', 'default', 'SDKWork Platform', 'prod', 'enabled', $5, \
         '{}'::jsonb, '[\"iam:self\"]'::jsonb, '{}'::jsonb, $6, $6, $6, $6) \
         ON CONFLICT (id) DO UPDATE SET app_id = EXCLUDED.app_id, status = 'enabled', primary_domain = EXCLUDED.primary_domain, \
         access_permissions_json = EXCLUDED.access_permissions_json, activated_at = EXCLUDED.activated_at, updated_at = EXCLUDED.updated_at",
    )
    .bind(&tenant_application_id)
    .bind(&runtime_app_id)
    .bind(tenant_id)
    .bind(PLATFORM_APPLICATION_TEMPLATE_ID)
    .bind(&primary_domain)
    .bind(&now)
    .execute(pg)
    .await
    .map_err(|error| format!("ensure platform tenant application failed: {error}"))?;

    reconcile_postgres_tenant_application_org_template_rows(pg).await?;

    Ok(runtime_app_id)
}

pub fn parse_application_register_command(
    body: &Value,
) -> Result<ApplicationRegisterCommand, String> {
    let owner_tenant_id = read_optional_string(body, &["ownerTenantId", "owner_tenant_id"])
        .unwrap_or_else(|| "0".to_owned());
    let app_key = read_required_string(body, &["appKey", "app_key"])?;
    let name = read_required_string(body, &["name", "appName", "app_name"])?;
    let display_name = read_optional_string(body, &["displayName", "display_name"])
        .unwrap_or_else(|| name.clone());
    let app_type = read_required_string(body, &["appType", "app_type"])?;
    let version = read_required_string(body, &["version", "appVersion", "app_version"])?;
    let channel = read_optional_string(body, &["channel"]).unwrap_or_else(|| "stable".to_owned());
    let package_name = read_optional_string(body, &["packageName", "package_name"]);
    let bundle_id = read_optional_string(body, &["bundleId", "bundle_id"]);
    let desktop_app_id = read_optional_string(body, &["desktopAppId", "desktop_app_id"]);
    let manifest_hash = read_optional_string(body, &["manifestHash", "manifest_hash"]);
    let default_access_permissions = read_string_array(
        body,
        &[
            "defaultAccessPermissions",
            "default_access_permissions",
            "accessTokenPermissionScope",
            "access_token_permission_scope",
        ],
    )
    .unwrap_or_default();
    if default_access_permissions.is_empty() {
        return Err("defaultAccessPermissions is required and must not be empty".to_string());
    }

    let runtime_config = body
        .get("runtimeConfig")
        .or_else(|| body.get("runtime_config"))
        .or_else(|| body.get("config"))
        .or_else(|| body.get("configJson"))
        .cloned()
        .unwrap_or_else(|| json!({}));

    let artifacts_config = body
        .get("artifactsConfig")
        .or_else(|| body.get("artifacts_config"))
        .cloned()
        .unwrap_or_else(|| json!({}));

    let packages = body
        .get("packages")
        .and_then(Value::as_array)
        .map(|items| {
            items
                .iter()
                .filter_map(parse_application_package_sync_command)
                .collect::<Vec<_>>()
        })
        .unwrap_or_default();

    Ok(ApplicationRegisterCommand {
        owner_tenant_id,
        app_key,
        name,
        display_name,
        app_type,
        package_name,
        bundle_id,
        desktop_app_id,
        version,
        channel,
        default_access_permissions,
        runtime_config,
        artifacts_config,
        packages,
        manifest_hash,
    })
}

pub fn parse_tenant_application_provision_command(
    body: &Value,
) -> Result<TenantApplicationProvisionCommand, String> {
    let tenant_id = read_required_string(body, &["tenantId", "tenant_id"])?;
    let organization_id = read_required_string(body, &["organizationId", "organization_id"])?;
    let template_id = read_optional_string(body, &["templateId", "template_id"]);
    let app_key = read_optional_string(body, &["appKey", "app_key"]);
    if template_id.is_none() && app_key.is_none() {
        return Err("templateId or appKey is required".to_string());
    }
    let instance_key = read_required_string(body, &["instanceKey", "instance_key"])?;
    let display_name = read_optional_string(body, &["displayName", "display_name"])
        .unwrap_or_else(|| instance_key.clone());
    let environment = read_required_string(body, &["environment", "env"])?;
    let primary_domain = read_optional_string(body, &["primaryDomain", "primary_domain", "domain"]);
    let access_permissions = read_string_array(
        body,
        &[
            "accessPermissions",
            "access_permissions",
            "accessTokenPermissionScope",
            "access_token_permission_scope",
        ],
    )
    .unwrap_or_default();
    let runtime_config = body
        .get("runtimeConfig")
        .or_else(|| body.get("runtime_config"))
        .or_else(|| body.get("config"))
        .cloned()
        .unwrap_or_else(|| json!({}));

    Ok(TenantApplicationProvisionCommand {
        tenant_id,
        organization_id,
        template_id,
        app_key,
        instance_key,
        display_name,
        environment,
        primary_domain,
        access_permissions,
        runtime_config,
    })
}

pub fn parse_tenant_application_update_command(
    body: &Value,
) -> Result<TenantApplicationUpdateCommand, String> {
    Ok(TenantApplicationUpdateCommand {
        primary_domain: read_optional_string(body, &["primaryDomain", "primary_domain", "domain"]),
        domain_config: body
            .get("domainConfig")
            .or_else(|| body.get("domain_config"))
            .cloned(),
        access_permissions: read_string_array(
            body,
            &[
                "accessPermissions",
                "access_permissions",
                "accessTokenPermissionScope",
                "access_token_permission_scope",
            ],
        ),
        runtime_config: body
            .get("runtimeConfig")
            .or_else(|| body.get("runtime_config"))
            .or_else(|| body.get("config"))
            .cloned(),
    })
}

pub async fn register_application_template(
    pg: &PgPool,
    command: &ApplicationRegisterCommand,
) -> Result<RegisteredApplicationTemplate, String> {
    if let Some(package_name) = command.package_name.as_deref() {
        ensure_unique_template_package_name(pg, package_name, command.app_key.as_str()).await?;
    }

    let existing = find_template_by_app_key(pg, &command.app_key).await?;
    let now = chrono::Utc::now();
    let template_id = existing
        .as_ref()
        .map(|template| template.id.clone())
        .unwrap_or_else(|| format!("tmpl_{}", uuid::Uuid::now_v7()));

    if existing.is_some() {
        sqlx::query(
            "UPDATE iam_application_template SET owner_tenant_id = $2, app_key = $3, name = $4, \
             display_name = $5, app_type = $6, package_name = $7, bundle_id = $8, desktop_app_id = $9, \
             version = $10, channel = $11, runtime_config_json = $12, artifacts_config_json = $13, \
             default_access_permissions_json = $14, manifest_hash = $15, last_synced_at = $16, \
             updated_at = $17, status = 'active' \
             WHERE id = $1",
        )
        .bind(&template_id)
        .bind(&command.owner_tenant_id)
        .bind(&command.app_key)
        .bind(&command.name)
        .bind(&command.display_name)
        .bind(&command.app_type)
        .bind(&command.package_name)
        .bind(&command.bundle_id)
        .bind(&command.desktop_app_id)
        .bind(&command.version)
        .bind(&command.channel)
        .bind(Json(&command.runtime_config))
        .bind(Json(&command.artifacts_config))
        .bind(Json(&command.default_access_permissions))
        .bind(&command.manifest_hash)
        .bind(&now)
        .bind(&now)
        .execute(pg)
        .await
        .map_err(|error| format!("update application template failed: {error}"))?;
    } else {
        sqlx::query(
            "INSERT INTO iam_application_template (id, owner_tenant_id, app_key, name, display_name, \
             app_type, package_name, bundle_id, desktop_app_id, version, channel, status, \
             runtime_config_json, artifacts_config_json, default_access_permissions_json, \
             manifest_hash, last_synced_at, created_at, updated_at) \
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'active', $12, $13, $14, $15, $16, $17, $18)",
        )
        .bind(&template_id)
        .bind(&command.owner_tenant_id)
        .bind(&command.app_key)
        .bind(&command.name)
        .bind(&command.display_name)
        .bind(&command.app_type)
        .bind(&command.package_name)
        .bind(&command.bundle_id)
        .bind(&command.desktop_app_id)
        .bind(&command.version)
        .bind(&command.channel)
        .bind(Json(&command.runtime_config))
        .bind(Json(&command.artifacts_config))
        .bind(Json(&command.default_access_permissions))
        .bind(&command.manifest_hash)
        .bind(&now)
        .bind(&now)
        .bind(&now)
        .execute(pg)
        .await
        .map_err(|error| format!("insert application template failed: {error}"))?;
    }

    replace_template_packages(pg, &template_id, &command.packages, &now).await?;

    find_template_by_app_key(pg, &command.app_key)
        .await?
        .ok_or_else(|| "application template register completed but lookup failed".to_string())
}

pub async fn provision_tenant_application(
    pg: &PgPool,
    command: &TenantApplicationProvisionCommand,
) -> Result<TenantApplication, String> {
    let template = resolve_template_reference(
        pg,
        command.template_id.as_deref(),
        command.app_key.as_deref(),
    )
    .await?
    .ok_or_else(|| "registered application template was not found".to_string())?;

    let access_permissions = if command.access_permissions.is_empty() {
        template.default_access_permissions.clone()
    } else {
        command.access_permissions.clone()
    };

    let now = chrono::Utc::now();
    let existing = find_tenant_application_by_organization_template(
        pg,
        &command.tenant_id,
        &command.organization_id,
        &template.id,
    )
    .await?
    .or(
        find_tenant_application_by_instance_key(pg, &command.tenant_id, &command.instance_key)
            .await?,
    );
    let tenant_application_id = existing
        .as_ref()
        .map(|app| app.id.clone())
        .unwrap_or_else(|| {
            tenant_application_row_id(&command.tenant_id, &command.organization_id, &template.id)
        });
    let runtime_app_id = existing
        .as_ref()
        .map(|app| app.app_id.clone())
        .unwrap_or_else(|| format!("app_{}", uuid::Uuid::now_v7()));

    if existing.is_some() {
        sqlx::query(
            "UPDATE iam_tenant_application SET organization_id = $2, template_id = $3, \
             template_version = $4, display_name = $5, environment = $6, primary_domain = $7, \
             access_permissions_json = $8, runtime_config_json = $9, last_synced_at = $10, \
             updated_at = $11 \
             WHERE id = $1",
        )
        .bind(&tenant_application_id)
        .bind(&command.organization_id)
        .bind(&template.id)
        .bind(&template.version)
        .bind(&command.display_name)
        .bind(&command.environment)
        .bind(&command.primary_domain)
        .bind(Json(&access_permissions))
        .bind(Json(&command.runtime_config))
        .bind(&now)
        .bind(&now)
        .execute(pg)
        .await
        .map_err(|error| format!("update tenant application failed: {error}"))?;
    } else {
        sqlx::query(
            "INSERT INTO iam_tenant_application (id, app_id, tenant_id, organization_id, template_id, \
             template_version, instance_key, display_name, environment, status, primary_domain, \
             domain_config_json, access_permissions_json, runtime_config_json, provisioned_at, \
             last_synced_at, created_at, updated_at) \
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending_config', $10, '{}'::jsonb, $11, $12, $13, $14, $15, $16)",
        )
        .bind(&tenant_application_id)
        .bind(&runtime_app_id)
        .bind(&command.tenant_id)
        .bind(&command.organization_id)
        .bind(&template.id)
        .bind(&template.version)
        .bind(&command.instance_key)
        .bind(&command.display_name)
        .bind(&command.environment)
        .bind(&command.primary_domain)
        .bind(Json(&access_permissions))
        .bind(Json(&command.runtime_config))
        .bind(&now)
        .bind(&now)
        .bind(&now)
        .bind(&now)
        .execute(pg)
        .await
        .map_err(|error| format!("insert tenant application failed: {error}"))?;
    }

    resolve_tenant_application(
        pg,
        &command.tenant_id,
        Some(&tenant_application_id),
        None,
        None,
    )
    .await?
    .ok_or_else(|| "tenant application provision completed but lookup failed".to_string())
}

pub async fn update_tenant_application(
    pg: &PgPool,
    tenant_id: &str,
    tenant_application_id: &str,
    command: &TenantApplicationUpdateCommand,
) -> Result<TenantApplication, String> {
    let existing =
        resolve_tenant_application(pg, tenant_id, Some(tenant_application_id), None, None)
            .await?
            .ok_or_else(|| "tenant application was not found".to_string())?;

    let primary_domain = command
        .primary_domain
        .clone()
        .or(existing.primary_domain.clone());
    let access_permissions = command
        .access_permissions
        .clone()
        .unwrap_or(existing.access_permissions.clone());
    let domain_config = command.domain_config.clone().unwrap_or_else(|| json!({}));
    let runtime_config = command.runtime_config.clone().unwrap_or_else(|| json!({}));
    let merged_runtime_config =
        merge_runtime_config_patch(&existing.runtime_config, &runtime_config);
    let now = chrono::Utc::now();

    sqlx::query(
        "UPDATE iam_tenant_application SET primary_domain = $2, domain_config_json = $3, \
         access_permissions_json = $4, runtime_config_json = $5::jsonb, \
         updated_at = $6 \
         WHERE id = $1 AND tenant_id = $7",
    )
    .bind(tenant_application_id)
    .bind(&primary_domain)
    .bind(Json(&domain_config))
    .bind(Json(&access_permissions))
    .bind(Json(&merged_runtime_config))
    .bind(&now)
    .bind(tenant_id)
    .execute(pg)
    .await
    .map_err(|error| format!("update tenant application failed: {error}"))?;

    resolve_tenant_application(pg, tenant_id, Some(tenant_application_id), None, None)
        .await?
        .ok_or_else(|| "tenant application update completed but lookup failed".to_string())
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct EnsureTenantApplicationCommand {
    pub owner_tenant_id: String,
    pub app_key: String,
    pub name: String,
    pub display_name: String,
    pub app_type: String,
    pub version: String,
    pub channel: String,
    pub default_access_permissions: Vec<String>,
    pub tenant_id: String,
    pub organization_id: String,
    pub instance_key: String,
    pub environment: String,
    pub primary_domain: String,
    pub runtime_app_id: String,
}

pub fn tenant_application_template_id(app_key: &str) -> String {
    format!("tmpl_{}", app_key.replace('-', "_"))
}

pub fn tenant_application_row_id(
    tenant_id: &str,
    organization_id: &str,
    template_id: &str,
) -> String {
    let suffix = template_id
        .strip_prefix("tmpl_")
        .unwrap_or(template_id)
        .replace('-', "_");
    format!("tapp_{tenant_id}_{organization_id}_{suffix}")
}

pub fn tenant_application_instance_key(app_key: &str, environment: &str) -> String {
    let normalized = app_key.trim().replace('-', "_");
    let env_suffix = if environment.eq_ignore_ascii_case("development")
        || environment.eq_ignore_ascii_case("dev")
    {
        "dev"
    } else if environment.eq_ignore_ascii_case("production")
        || environment.eq_ignore_ascii_case("prod")
    {
        "prod"
    } else {
        let trimmed = environment.trim();
        if trimmed.is_empty() {
            "default"
        } else {
            return format!("{normalized}_{}", trimmed.replace('-', "_"));
        }
    };
    format!("{normalized}_{env_suffix}")
}

pub fn derive_tenant_application_primary_domain_candidate(
    requested: &str,
    runtime_app_id: &str,
    attempt: u32,
) -> String {
    let requested = requested.trim();
    if requested.is_empty() {
        return String::new();
    }
    if attempt == 0 {
        return requested.to_owned();
    }
    if attempt == 1 {
        return format!("{runtime_app_id}.{requested}");
    }
    format!("{runtime_app_id}-{attempt}.{requested}")
}

async fn find_tenant_application_id_by_primary_domain(
    pg: &PgPool,
    tenant_id: &str,
    primary_domain: &str,
) -> Result<Option<String>, String> {
    let row = sqlx::query_scalar::<_, String>(
        "SELECT id FROM iam_tenant_application \
         WHERE tenant_id = $1 AND primary_domain = $2 \
         LIMIT 1",
    )
    .bind(tenant_id)
    .bind(primary_domain)
    .fetch_optional(pg)
    .await
    .map_err(|error| format!("load tenant application by primary domain failed: {error}"))?;
    Ok(row)
}

async fn resolve_tenant_application_primary_domain(
    pg: &PgPool,
    tenant_id: &str,
    tenant_application_id: &str,
    requested_primary_domain: &str,
    runtime_app_id: &str,
) -> Result<String, String> {
    let requested = requested_primary_domain.trim();
    if requested.is_empty() {
        return Err("primaryDomain is required for tenant application bootstrap".to_string());
    }

    for attempt in 0..8 {
        let candidate =
            derive_tenant_application_primary_domain_candidate(requested, runtime_app_id, attempt);
        let existing_id =
            find_tenant_application_id_by_primary_domain(pg, tenant_id, &candidate).await?;
        match existing_id {
            None => return Ok(candidate),
            Some(existing_id) if existing_id == tenant_application_id => return Ok(candidate),
            Some(_) => continue,
        }
    }

    Err(format!(
        "unable to resolve unique primaryDomain for tenant {tenant_id} runtimeAppId {runtime_app_id}"
    ))
}

pub async fn dedupe_postgres_tenant_application_org_template_rows(
    pg: &PgPool,
) -> Result<u64, String> {
    reconcile_postgres_tenant_application_org_template_rows(pg).await
}

pub async fn reconcile_postgres_tenant_application_org_template_rows(
    pg: &PgPool,
) -> Result<u64, String> {
    let mut total_deleted = 0_u64;
    for _ in 0..8 {
        let deleted = delete_duplicate_postgres_tenant_application_org_template_rows(pg).await?;
        if deleted == 0 {
            break;
        }
        total_deleted += deleted;
    }
    Ok(total_deleted)
}

async fn delete_duplicate_postgres_tenant_application_org_template_rows(
    pg: &PgPool,
) -> Result<u64, String> {
    let result = sqlx::query(
        "WITH ranked AS ( \
            SELECT id, \
                   ROW_NUMBER() OVER ( \
                     PARTITION BY tenant_id, organization_id, template_id \
                     ORDER BY \
                       CASE \
                         WHEN id = 'tapp_' || tenant_id || '_' || organization_id || '_' || \
                              replace(replace(template_id, 'tmpl_', ''), '-', '_') THEN 0 \
                         WHEN id = 'tapp_' || tenant_id || '_default' \
                              AND template_id = 'tmpl_sdkwork_platform' THEN 1 \
                         ELSE 2 \
                       END, \
                       CASE status WHEN 'enabled' THEN 0 WHEN 'pending_config' THEN 1 ELSE 2 END, \
                       updated_at DESC NULLS LAST, \
                       id ASC \
                   ) AS row_rank \
            FROM iam_tenant_application \
         ) \
         DELETE FROM iam_tenant_application \
         WHERE id IN (SELECT id FROM ranked WHERE row_rank > 1)",
    )
    .execute(pg)
    .await
    .map_err(|error| {
        format!("delete duplicate tenant application org-template rows failed: {error}")
    })?;

    Ok(result.rows_affected())
}

async fn count_postgres_tenant_application_org_template_duplicate_groups(
    pg: &PgPool,
) -> Result<i64, String> {
    sqlx::query_scalar(
        "SELECT COUNT(*) FROM ( \
            SELECT 1 \
            FROM iam_tenant_application \
            GROUP BY tenant_id, organization_id, template_id \
            HAVING COUNT(*) > 1 \
         ) duplicate_groups",
    )
    .fetch_one(pg)
    .await
    .map_err(|error| {
        format!("count tenant application org-template duplicate groups failed: {error}")
    })
}

async fn describe_postgres_tenant_application_org_template_duplicate_groups(
    pg: &PgPool,
) -> Result<String, String> {
    let rows = sqlx::query(
        "SELECT tenant_id, organization_id, template_id, COUNT(*) AS row_count, \
                string_agg(id || ':' || app_id, ', ' ORDER BY id) AS rows \
         FROM iam_tenant_application \
         GROUP BY tenant_id, organization_id, template_id \
         HAVING COUNT(*) > 1 \
         ORDER BY tenant_id, organization_id, template_id \
         LIMIT 3",
    )
    .fetch_all(pg)
    .await
    .map_err(|error| {
        format!("describe tenant application org-template duplicate groups failed: {error}")
    })?;

    if rows.is_empty() {
        return Ok("no duplicate samples returned".to_owned());
    }

    Ok(rows
        .iter()
        .map(|row| {
            format!(
                "tenant={}:org={}:template={}:count={}:rows={}",
                row.get::<String, _>("tenant_id"),
                row.get::<String, _>("organization_id"),
                row.get::<String, _>("template_id"),
                row.get::<i64, _>("row_count"),
                row.get::<String, _>("rows"),
            )
        })
        .collect::<Vec<_>>()
        .join("; "))
}

async fn postgres_unique_index_is_valid(
    pg: &PgPool,
    table_name: &str,
    index_name: &str,
) -> Result<bool, String> {
    sqlx::query_scalar(
        "SELECT COALESCE(bool_or(i.indisvalid), false) \
         FROM pg_index i \
         JOIN pg_class table_class ON table_class.oid = i.indrelid \
         JOIN pg_class index_class ON index_class.oid = i.indexrelid \
         JOIN pg_namespace namespace ON namespace.oid = table_class.relnamespace \
         WHERE namespace.nspname = current_schema() \
           AND table_class.relname = $1 \
           AND index_class.relname = $2",
    )
    .bind(table_name)
    .bind(index_name)
    .fetch_one(pg)
    .await
    .map_err(|error| {
        format!("probe tenant application org-template index validity failed: {error}")
    })
}

pub async fn ensure_postgres_tenant_application_org_template_unique_index(
    pg: &PgPool,
) -> Result<(), String> {
    reconcile_postgres_tenant_application_org_template_rows(pg).await?;

    if postgres_unique_index_is_valid(
        pg,
        "iam_tenant_application",
        "uk_iam_tenant_application_org_template",
    )
    .await?
        && count_postgres_tenant_application_org_template_duplicate_groups(pg).await? == 0
    {
        return Ok(());
    }

    sqlx::query("DROP INDEX IF EXISTS uk_iam_tenant_application_org_template")
        .execute(pg)
        .await
        .map_err(|error| {
            format!("drop tenant application org-template unique index failed: {error}")
        })?;

    reconcile_postgres_tenant_application_org_template_rows(pg).await?;

    let duplicate_groups =
        count_postgres_tenant_application_org_template_duplicate_groups(pg).await?;
    if duplicate_groups > 0 {
        let sample = describe_postgres_tenant_application_org_template_duplicate_groups(pg)
            .await
            .unwrap_or_else(|error| error);
        return Err(format!(
            "tenant application org-template duplicates remain after reconcile (groups={duplicate_groups}; {sample})"
        ));
    }

    if let Err(error) = sqlx::query(
        "CREATE UNIQUE INDEX uk_iam_tenant_application_org_template \
         ON iam_tenant_application (tenant_id, organization_id, template_id)",
    )
    .execute(pg)
    .await
    {
        let sample = describe_postgres_tenant_application_org_template_duplicate_groups(pg)
            .await
            .unwrap_or_else(|describe_error| describe_error);
        return Err(format!(
            "ensure tenant application org-template unique index failed: {error}; duplicates={sample}"
        ));
    }
    Ok(())
}

async fn clear_postgres_tenant_application_competing_rows(
    pg: &PgPool,
    command: &EnsureTenantApplicationCommand,
    template_id: &str,
    keep_id: &str,
) -> Result<u64, String> {
    let result = sqlx::query(
        "DELETE FROM iam_tenant_application \
         WHERE tenant_id = $1 \
           AND id <> $2 \
           AND ( \
             app_id = $3 OR \
             (organization_id = $4 AND template_id = $5) OR \
             (instance_key = $6 AND (app_id = $3 OR template_id = $5)) \
           )",
    )
    .bind(&command.tenant_id)
    .bind(keep_id)
    .bind(&command.runtime_app_id)
    .bind(&command.organization_id)
    .bind(template_id)
    .bind(&command.instance_key)
    .execute(pg)
    .await
    .map_err(|error| format!("clear competing tenant application rows failed: {error}"))?;

    Ok(result.rows_affected())
}

async fn upsert_tenant_application_row(
    pg: &PgPool,
    command: &EnsureTenantApplicationCommand,
    template_version: &str,
    template_id: &str,
) -> Result<String, String> {
    let tenant_application_id = resolve_tenant_application_row_id(pg, command, template_id).await?;
    clear_postgres_tenant_application_competing_rows(
        pg,
        command,
        template_id,
        tenant_application_id.as_str(),
    )
    .await?;
    let primary_domain = resolve_tenant_application_primary_domain(
        pg,
        &command.tenant_id,
        tenant_application_id.as_str(),
        &command.primary_domain,
        &command.runtime_app_id,
    )
    .await?;
    let now = chrono::Utc::now();

    sqlx::query(
        "INSERT INTO iam_tenant_application (id, app_id, tenant_id, organization_id, template_id, \
         template_version, instance_key, display_name, environment, status, primary_domain, \
         domain_config_json, access_permissions_json, runtime_config_json, provisioned_at, \
         last_synced_at, created_at, updated_at) \
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending_config', $10, '{}'::jsonb, $11, '{}'::jsonb, $12, $13, $14, $15) \
         ON CONFLICT (id) DO UPDATE SET \
           app_id = EXCLUDED.app_id, \
           tenant_id = EXCLUDED.tenant_id, \
           organization_id = EXCLUDED.organization_id, \
           template_id = EXCLUDED.template_id, \
           template_version = EXCLUDED.template_version, \
           instance_key = EXCLUDED.instance_key, \
           display_name = EXCLUDED.display_name, \
           environment = EXCLUDED.environment, \
           primary_domain = EXCLUDED.primary_domain, \
           access_permissions_json = EXCLUDED.access_permissions_json, \
           last_synced_at = EXCLUDED.last_synced_at, \
           updated_at = EXCLUDED.updated_at",
    )
    .bind(&tenant_application_id)
    .bind(&command.runtime_app_id)
    .bind(&command.tenant_id)
    .bind(&command.organization_id)
    .bind(template_id)
    .bind(template_version)
    .bind(&command.instance_key)
    .bind(&command.display_name)
    .bind(&command.environment)
    .bind(&primary_domain)
    .bind(Json(&command.default_access_permissions))
    .bind(&now)
    .bind(&now)
    .bind(&now)
    .bind(&now)
    .execute(pg)
    .await
    .map_err(|error| format!("upsert tenant application failed: {error}"))?;

    Ok(tenant_application_id)
}

async fn resolve_tenant_application_row_id(
    pg: &PgPool,
    command: &EnsureTenantApplicationCommand,
    template_id: &str,
) -> Result<String, String> {
    let canonical_id =
        tenant_application_row_id(&command.tenant_id, &command.organization_id, template_id);

    if let Some(existing) =
        find_tenant_application_by_runtime_app_id(pg, &command.tenant_id, &command.runtime_app_id)
            .await?
    {
        return Ok(existing.id);
    }

    if let Some(existing) = find_tenant_application_by_organization_template(
        pg,
        &command.tenant_id,
        &command.organization_id,
        template_id,
    )
    .await?
    {
        return Ok(existing.id);
    }

    if let Some(existing) =
        find_tenant_application_by_instance_key(pg, &command.tenant_id, &command.instance_key)
            .await?
    {
        return Ok(existing.id);
    }

    Ok(canonical_id)
}

pub async fn ensure_tenant_application_runtime(
    pg: &PgPool,
    command: &EnsureTenantApplicationCommand,
) -> Result<TenantApplication, String> {
    if command.default_access_permissions.is_empty() {
        return Err("defaultAccessPermissions is required and must not be empty".to_string());
    }
    if crate::is_blank(Some(command.runtime_app_id.as_str())) {
        return Err("runtime appId is required".to_string());
    }

    let template_id = tenant_application_template_id(&command.app_key);
    let register = ApplicationRegisterCommand {
        owner_tenant_id: command.owner_tenant_id.clone(),
        app_key: command.app_key.clone(),
        name: command.name.clone(),
        display_name: command.display_name.clone(),
        app_type: command.app_type.clone(),
        package_name: None,
        bundle_id: None,
        desktop_app_id: None,
        version: command.version.clone(),
        channel: command.channel.clone(),
        default_access_permissions: command.default_access_permissions.clone(),
        runtime_config: json!({}),
        artifacts_config: json!({}),
        packages: Vec::new(),
        manifest_hash: None,
    };
    let template = upsert_application_template_with_id(pg, &template_id, &register).await?;
    let resolved_template_id = template.id;

    reconcile_postgres_tenant_application_org_template_rows(pg).await?;
    ensure_postgres_tenant_application_org_template_unique_index(pg).await?;
    let tenant_application_id =
        upsert_tenant_application_row(pg, command, &template.version, &resolved_template_id)
            .await?;

    let enabled = enable_tenant_application(pg, &command.tenant_id, &tenant_application_id).await?;
    resolve_tenant_application(
        pg,
        &command.tenant_id,
        Some(&tenant_application_id),
        None,
        None,
    )
    .await?
    .ok_or_else(|| {
        format!(
            "tenant application {tenant_application_id} was not found after bootstrap enable (status={})",
            enabled.status
        )
    })
}

pub async fn enable_tenant_application(
    pg: &PgPool,
    tenant_id: &str,
    tenant_application_id: &str,
) -> Result<TenantApplication, String> {
    let existing =
        resolve_tenant_application(pg, tenant_id, Some(tenant_application_id), None, None)
            .await?
            .ok_or_else(|| "tenant application was not found".to_string())?;

    if existing
        .primary_domain
        .as_deref()
        .is_none_or(|value| crate::is_blank(Some(value)))
    {
        return Err(
            "primaryDomain must be configured before enabling tenant application".to_string(),
        );
    }
    if existing.access_permissions.is_empty() {
        return Err(
            "accessPermissions must be configured before enabling tenant application".to_string(),
        );
    }

    let now = chrono::Utc::now();
    sqlx::query(
        "UPDATE iam_tenant_application SET status = 'enabled', activated_at = $2, updated_at = $2 \
         WHERE id = $1 AND tenant_id = $3",
    )
    .bind(tenant_application_id)
    .bind(&now)
    .bind(tenant_id)
    .execute(pg)
    .await
    .map_err(|error| format!("enable tenant application failed: {error}"))?;

    resolve_tenant_application(pg, tenant_id, Some(tenant_application_id), None, None)
        .await?
        .ok_or_else(|| "tenant application enable completed but lookup failed".to_string())
}

pub async fn resolve_tenant_application(
    pg: &PgPool,
    tenant_id: &str,
    tenant_application_id: Option<&str>,
    runtime_app_id: Option<&str>,
    instance_key: Option<&str>,
) -> Result<Option<TenantApplication>, String> {
    let row = if let Some(id) = tenant_application_id.filter(|value| !crate::is_blank(Some(value))) {
        sqlx::query(
            "SELECT id, app_id, tenant_id, organization_id, template_id, template_version, \
                    instance_key, display_name, environment, status, primary_domain, access_permissions_json, runtime_config_json \
             FROM iam_tenant_application \
             WHERE tenant_id = $1 AND id = $2 \
             LIMIT 1",
        )
        .bind(tenant_id)
        .bind(id)
        .fetch_optional(pg)
        .await
    } else if let Some(app_id) = runtime_app_id.filter(|value| !crate::is_blank(Some(value))) {
        sqlx::query(
            "SELECT id, app_id, tenant_id, organization_id, template_id, template_version, \
                    instance_key, display_name, environment, status, primary_domain, access_permissions_json, runtime_config_json \
             FROM iam_tenant_application \
             WHERE tenant_id = $1 AND app_id = $2 \
             LIMIT 1",
        )
        .bind(tenant_id)
        .bind(app_id)
        .fetch_optional(pg)
        .await
    } else if let Some(key) = instance_key.filter(|value| !crate::is_blank(Some(value))) {
        sqlx::query(
            "SELECT id, app_id, tenant_id, organization_id, template_id, template_version, \
                    instance_key, display_name, environment, status, primary_domain, access_permissions_json, runtime_config_json \
             FROM iam_tenant_application \
             WHERE tenant_id = $1 AND instance_key = $2 \
             LIMIT 1",
        )
        .bind(tenant_id)
        .bind(key)
        .fetch_optional(pg)
        .await
    } else {
        return Ok(None);
    }
    .map_err(|error| format!("load tenant application failed: {error}"))?;

    Ok(row.map(map_tenant_application_row))
}

pub fn intersect_permission_scopes(
    actor_scope: &[String],
    app_scope: &[String],
) -> Result<Vec<String>, String> {
    if app_scope.is_empty() {
        return Err(
            "tenant application accessPermissions is required before issuing credentials"
                .to_string(),
        );
    }

    let actor = actor_scope.iter().collect::<BTreeSet<_>>();
    let mut granted = Vec::new();
    for permission in app_scope {
        if actor.contains(permission) {
            granted.push(permission.clone());
        }
    }

    if granted.is_empty() {
        return Err(
            "super admin does not hold any configured tenant application access permissions"
                .to_string(),
        );
    }

    Ok(granted)
}

pub fn registered_application_template_to_json(template: &RegisteredApplicationTemplate) -> Value {
    json!({
        "templateId": template.id,
        "appKey": template.app_key,
        "name": template.name,
        "packageName": template.package_name,
        "version": template.version,
        "defaultAccessPermissions": template.default_access_permissions,
    })
}

pub fn tenant_application_to_json(app: &TenantApplication) -> Value {
    json!({
        "tenantApplicationId": app.id,
        "appId": app.app_id,
        "tenantId": app.tenant_id,
        "organizationId": app.organization_id,
        "templateId": app.template_id,
        "templateVersion": app.template_version,
        "instanceKey": app.instance_key,
        "displayName": app.display_name,
        "environment": app.environment,
        "status": app.status,
        "primaryDomain": app.primary_domain,
        "accessPermissions": app.access_permissions,
        "runtimeConfig": redact_runtime_config_for_response(&app.runtime_config),
    })
}

pub fn redact_runtime_config_for_response(runtime_config: &Value) -> Value {
    let mut redacted = runtime_config.clone();
    if let Some(relying_party) = redacted.pointer_mut("/oauth/relyingParty") {
        if let Some(object) = relying_party.as_object_mut() {
            if object.contains_key("clientSecretHash") {
                object.insert("clientSecretHash".to_string(), json!("[redacted]"));
            }
        }
    }
    redacted
}

async fn resolve_template_reference(
    pg: &PgPool,
    template_id: Option<&str>,
    app_key: Option<&str>,
) -> Result<Option<RegisteredApplicationTemplate>, String> {
    if let Some(template_id) = template_id.filter(|value| !crate::is_blank(Some(value))) {
        let row = sqlx::query(
            "SELECT id, app_key, name, package_name, version, default_access_permissions_json \
             FROM iam_application_template WHERE id = $1 AND status = 'active' LIMIT 1",
        )
        .bind(template_id)
        .fetch_optional(pg)
        .await
        .map_err(|error| format!("load application template by id failed: {error}"))?;
        return Ok(row.map(map_template_row));
    }

    if let Some(app_key) = app_key.filter(|value| !crate::is_blank(Some(value))) {
        return find_template_by_app_key(pg, app_key).await;
    }

    Ok(None)
}

async fn find_template_by_app_key(
    pg: &PgPool,
    app_key: &str,
) -> Result<Option<RegisteredApplicationTemplate>, String> {
    let row = sqlx::query(
        "SELECT id, app_key, name, package_name, version, default_access_permissions_json \
         FROM iam_application_template WHERE app_key = $1 AND status = 'active' LIMIT 1",
    )
    .bind(app_key)
    .fetch_optional(pg)
    .await
    .map_err(|error| format!("load application template by app_key failed: {error}"))?;
    Ok(row.map(map_template_row))
}

async fn find_tenant_application_by_instance_key(
    pg: &PgPool,
    tenant_id: &str,
    instance_key: &str,
) -> Result<Option<TenantApplication>, String> {
    resolve_tenant_application(pg, tenant_id, None, None, Some(instance_key)).await
}

async fn find_tenant_application_by_runtime_app_id(
    pg: &PgPool,
    tenant_id: &str,
    runtime_app_id: &str,
) -> Result<Option<TenantApplication>, String> {
    let row = sqlx::query(
        "SELECT id, app_id, tenant_id, organization_id, template_id, template_version, \
                instance_key, display_name, environment, status, primary_domain, access_permissions_json, runtime_config_json \
         FROM iam_tenant_application \
         WHERE tenant_id = $1 AND app_id = $2 \
         ORDER BY updated_at DESC NULLS LAST, id ASC \
         LIMIT 1",
    )
    .bind(tenant_id)
    .bind(runtime_app_id)
    .fetch_optional(pg)
    .await
    .map_err(|error| format!("load tenant application by runtime app id failed: {error}"))?;
    Ok(row.map(map_tenant_application_row))
}

async fn find_tenant_application_by_organization_template(
    pg: &PgPool,
    tenant_id: &str,
    organization_id: &str,
    template_id: &str,
) -> Result<Option<TenantApplication>, String> {
    let row = sqlx::query(
        "SELECT id, app_id, tenant_id, organization_id, template_id, template_version, \
                instance_key, display_name, environment, status, primary_domain, access_permissions_json, runtime_config_json \
         FROM iam_tenant_application \
         WHERE tenant_id = $1 AND organization_id = $2 AND template_id = $3 \
         ORDER BY \
           CASE \
             WHEN id = 'tapp_' || $1 || '_' || $2 || '_' || \
                  replace(replace($3, 'tmpl_', ''), '-', '_') THEN 0 \
             ELSE 1 \
           END, \
           CASE status WHEN 'enabled' THEN 0 WHEN 'pending_config' THEN 1 ELSE 2 END, \
           updated_at DESC NULLS LAST, \
           id ASC \
         LIMIT 1",
    )
    .bind(tenant_id)
    .bind(organization_id)
    .bind(template_id)
    .fetch_optional(pg)
    .await
    .map_err(|error| format!("load tenant application by org-template failed: {error}"))?;
    Ok(row.map(map_tenant_application_row))
}

async fn upsert_application_template_with_id(
    pg: &PgPool,
    template_id: &str,
    command: &ApplicationRegisterCommand,
) -> Result<RegisteredApplicationTemplate, String> {
    if let Some(package_name) = command.package_name.as_deref() {
        ensure_unique_template_package_name(pg, package_name, command.app_key.as_str()).await?;
    }

    let now = chrono::Utc::now();
    let existing = find_template_by_app_key(pg, &command.app_key).await?;
    let resolved_template_id = existing
        .as_ref()
        .map(|template| template.id.clone())
        .unwrap_or_else(|| template_id.to_owned());

    if existing.is_some() {
        sqlx::query(
            "UPDATE iam_application_template SET owner_tenant_id = $2, app_key = $3, name = $4, \
             display_name = $5, app_type = $6, package_name = $7, bundle_id = $8, desktop_app_id = $9, \
             version = $10, channel = $11, runtime_config_json = $12, artifacts_config_json = $13, \
             default_access_permissions_json = $14, manifest_hash = $15, last_synced_at = $16, \
             updated_at = $17, status = 'active' \
             WHERE id = $1",
        )
        .bind(&resolved_template_id)
        .bind(&command.owner_tenant_id)
        .bind(&command.app_key)
        .bind(&command.name)
        .bind(&command.display_name)
        .bind(&command.app_type)
        .bind(&command.package_name)
        .bind(&command.bundle_id)
        .bind(&command.desktop_app_id)
        .bind(&command.version)
        .bind(&command.channel)
        .bind(Json(&command.runtime_config))
        .bind(Json(&command.artifacts_config))
        .bind(Json(&command.default_access_permissions))
        .bind(&command.manifest_hash)
        .bind(&now)
        .bind(&now)
        .execute(pg)
        .await
        .map_err(|error| format!("update application template failed: {error}"))?;
    } else {
        sqlx::query(
            "INSERT INTO iam_application_template (id, owner_tenant_id, app_key, name, display_name, \
             app_type, package_name, bundle_id, desktop_app_id, version, channel, status, \
             runtime_config_json, artifacts_config_json, default_access_permissions_json, \
             manifest_hash, last_synced_at, created_at, updated_at) \
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'active', $12, $13, $14, $15, $16, $17, $18)",
        )
        .bind(&resolved_template_id)
        .bind(&command.owner_tenant_id)
        .bind(&command.app_key)
        .bind(&command.name)
        .bind(&command.display_name)
        .bind(&command.app_type)
        .bind(&command.package_name)
        .bind(&command.bundle_id)
        .bind(&command.desktop_app_id)
        .bind(&command.version)
        .bind(&command.channel)
        .bind(Json(&command.runtime_config))
        .bind(Json(&command.artifacts_config))
        .bind(Json(&command.default_access_permissions))
        .bind(&command.manifest_hash)
        .bind(&now)
        .bind(&now)
        .bind(&now)
        .execute(pg)
        .await
        .map_err(|error| format!("insert application template failed: {error}"))?;
    }

    replace_template_packages(pg, &resolved_template_id, &command.packages, &now).await?;

    find_template_by_app_key(pg, &command.app_key)
        .await?
        .ok_or_else(|| "application template bootstrap completed but lookup failed".to_string())
}

async fn ensure_unique_template_package_name(
    pg: &PgPool,
    package_name: &str,
    app_key: &str,
) -> Result<(), String> {
    let row = sqlx::query(
        "SELECT app_key FROM iam_application_template \
         WHERE package_name = $1 AND status = 'active' LIMIT 1",
    )
    .bind(package_name)
    .fetch_optional(pg)
    .await
    .map_err(|error| format!("check template package name uniqueness failed: {error}"))?;

    if let Some(existing) = row {
        let existing_key: String = existing.get(0);
        if existing_key != app_key {
            return Err(format!(
                "packageName {package_name} is already registered by application {existing_key}"
            ));
        }
    }
    Ok(())
}

async fn replace_template_packages(
    pg: &PgPool,
    template_id: &str,
    packages: &[ApplicationPackageSyncCommand],
    now: &chrono::DateTime<chrono::Utc>,
) -> Result<(), String> {
    sqlx::query("DELETE FROM iam_application_template_package WHERE template_id = $1")
        .bind(template_id)
        .execute(pg)
        .await
        .map_err(|error| format!("clear application template packages failed: {error}"))?;

    for package in packages {
        sqlx::query(
            "INSERT INTO iam_application_template_package (id, template_id, package_id, platform, architecture, \
             language, runtime_target, deployment_profile, package_format, version, config_json, status, \
             created_at, updated_at) \
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'active', $12, $13)",
        )
        .bind(format!("tmplpkg_{}", uuid::Uuid::now_v7()))
        .bind(template_id)
        .bind(&package.package_id)
        .bind(&package.platform)
        .bind(&package.architecture)
        .bind(&package.language)
        .bind(&package.runtime_target)
        .bind(&package.deployment_profile)
        .bind(&package.package_format)
        .bind(&package.version)
        .bind(Json(&package.config))
        .bind(now)
        .bind(now)
        .execute(pg)
        .await
        .map_err(|error| format!("insert application template package failed: {error}"))?;
    }

    Ok(())
}

fn map_template_row(row: sqlx::postgres::PgRow) -> RegisteredApplicationTemplate {
    RegisteredApplicationTemplate {
        id: row.get(0),
        app_key: row.get(1),
        name: row.get(2),
        package_name: row.get(3),
        version: row.get(4),
        default_access_permissions: json_string_vec_from_row(&row, 5),
    }
}

fn map_tenant_application_row(row: sqlx::postgres::PgRow) -> TenantApplication {
    TenantApplication {
        id: row.get(0),
        app_id: row.get(1),
        tenant_id: row.get(2),
        organization_id: row.get(3),
        template_id: row.get(4),
        template_version: row.get(5),
        instance_key: row.get(6),
        display_name: row.get(7),
        environment: row.get(8),
        status: row.get(9),
        primary_domain: row.get(10),
        access_permissions: json_string_vec_from_row(&row, 11),
        runtime_config: json_value_from_row(&row, 12),
    }
}

fn json_value_from_row(row: &sqlx::postgres::PgRow, index: usize) -> Value {
    row.try_get::<Json<Value>, _>(index)
        .map(|Json(value)| value)
        .unwrap_or_else(|_| json!({}))
}

fn json_string_vec_from_row(row: &sqlx::postgres::PgRow, index: usize) -> Vec<String> {
    row.try_get::<Json<Vec<String>>, _>(index)
        .map(|Json(values)| values)
        .or_else(|_| {
            row.try_get::<Json<Value>, _>(index)
                .map(|Json(value)| match value {
                    Value::Array(items) => items
                        .iter()
                        .filter_map(|item| item.as_str().map(str::to_owned))
                        .collect(),
                    Value::String(text) => text
                        .split(',')
                        .map(str::trim)
                        .filter(|part| !part.is_empty())
                        .map(str::to_owned)
                        .collect(),
                    _ => Vec::new(),
                })
        })
        .unwrap_or_default()
}

fn parse_application_package_sync_command(value: &Value) -> Option<ApplicationPackageSyncCommand> {
    let package_id = read_optional_string(value, &["packageId", "package_id", "id"])?;
    Some(ApplicationPackageSyncCommand {
        package_id,
        platform: read_required_string(value, &["platform"]).ok()?,
        architecture: read_optional_string(value, &["architecture"]),
        language: read_optional_string(value, &["language"]),
        runtime_target: read_required_string(value, &["runtimeTarget", "runtime_target"]).ok()?,
        deployment_profile: read_required_string(
            value,
            &["deploymentProfile", "deployment_profile"],
        )
        .ok()?,
        package_format: read_required_string(value, &["packageFormat", "package_format"]).ok()?,
        version: read_optional_string(value, &["version"]),
        config: value
            .get("config")
            .cloned()
            .or_else(|| value.get("metadata").cloned())
            .unwrap_or_else(|| json!({})),
    })
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

fn read_string_array(body: &Value, keys: &[&str]) -> Option<Vec<String>> {
    keys.iter()
        .find_map(|key| body.get(*key))
        .and_then(|value| match value {
            Value::Array(items) => Some(
                items
                    .iter()
                    .filter_map(|item| item.as_str().map(str::to_owned))
                    .collect(),
            ),
            Value::String(text) => Some(
                text.split(',')
                    .map(str::trim)
                    .filter(|part| !part.is_empty())
                    .map(str::to_owned)
                    .collect(),
            ),
            _ => None,
        })
}

/// Deep-merge runtime config patches so partial updates (e.g. `oauth.relyingParty`) do not
/// replace sibling keys such as `auth.*` or wipe `clientSecretHash` when omitted.
pub(crate) fn merge_runtime_config_patch(existing: &Value, patch: &Value) -> Value {
    if !patch.is_object() {
        return existing.clone();
    }
    if !existing.is_object() {
        return patch.clone();
    }

    let mut merged = existing.clone();
    let Some(merged_obj) = merged.as_object_mut() else {
        return patch.clone();
    };
    let Some(patch_obj) = patch.as_object() else {
        return merged;
    };

    for (key, patch_value) in patch_obj {
        if key == "oauth" {
            let existing_oauth = merged_obj
                .get("oauth")
                .cloned()
                .unwrap_or_else(|| json!({}));
            merged_obj.insert(
                key.clone(),
                merge_oauth_runtime_config(&existing_oauth, patch_value),
            );
            continue;
        }
        merged_obj.insert(key.clone(), patch_value.clone());
    }

    merged
}

fn merge_oauth_runtime_config(existing_oauth: &Value, patch_oauth: &Value) -> Value {
    if !patch_oauth.is_object() {
        return existing_oauth.clone();
    }
    if !existing_oauth.is_object() {
        return patch_oauth.clone();
    }

    let mut merged = existing_oauth.clone();
    let Some(merged_obj) = merged.as_object_mut() else {
        return patch_oauth.clone();
    };
    let Some(patch_obj) = patch_oauth.as_object() else {
        return merged;
    };

    for (key, patch_value) in patch_obj {
        if key == "relyingParty" {
            let existing_rp = merged_obj
                .get("relyingParty")
                .cloned()
                .unwrap_or_else(|| json!({}));
            merged_obj.insert(
                key.clone(),
                merge_relying_party_config(&existing_rp, patch_value),
            );
            continue;
        }
        merged_obj.insert(key.clone(), patch_value.clone());
    }

    merged
}

fn merge_relying_party_config(existing: &Value, patch: &Value) -> Value {
    if !patch.is_object() {
        return existing.clone();
    }
    if !existing.is_object() {
        return patch.clone();
    }

    let mut merged = existing.clone();
    let Some(merged_obj) = merged.as_object_mut() else {
        return patch.clone();
    };
    let Some(patch_obj) = patch.as_object() else {
        return merged;
    };

    for (key, patch_value) in patch_obj {
        if key == "clientSecretHash" {
            let patch_text = patch_value.as_str().unwrap_or("").trim();
            if patch_text.is_empty() {
                continue;
            }
        }
        merged_obj.insert(key.clone(), patch_value.clone());
    }

    merged
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parse_application_register_command_requires_default_permissions() {
        let body = json!({
            "appKey": "demo-app",
            "name": "demo-app",
            "appType": "DESKTOP",
            "version": "1.0.0"
        });
        let error = parse_application_register_command(&body).expect_err("missing permissions");
        assert!(error.contains("defaultAccessPermissions"));
    }

    #[test]
    fn parse_application_register_command_accepts_default_permissions() {
        let body = json!({
            "appKey": "demo-app",
            "name": "demo-app",
            "appType": "DESKTOP",
            "version": "1.0.0",
            "defaultAccessPermissions": ["iam.users.read"]
        });
        let command = parse_application_register_command(&body).expect("parse register");
        assert_eq!(
            command.default_access_permissions,
            vec!["iam.users.read".to_owned()]
        );
    }

    #[test]
    fn tenant_application_template_id_normalizes_app_key() {
        assert_eq!(
            "tmpl_sdkwork_clawrouter",
            tenant_application_template_id("sdkwork-clawrouter")
        );
    }

    #[test]
    fn tenant_application_instance_key_scopes_by_app_and_environment() {
        assert_eq!(
            "sdkwork_clawrouter_dev",
            tenant_application_instance_key("sdkwork-clawrouter", "development")
        );
        assert_eq!(
            "sdkwork_clawrouter_prod",
            tenant_application_instance_key("sdkwork-clawrouter", "production")
        );
        assert_ne!(
            tenant_application_instance_key("sdkwork-clawrouter", "production"),
            "default"
        );
    }

    #[test]
    fn tenant_application_row_id_is_deterministic() {
        assert_eq!(
            "tapp_100001_0_sdkwork_clawrouter",
            tenant_application_row_id("100001", "0", "tmpl_sdkwork_clawrouter")
        );
        assert_eq!(
            "tapp_tenant_configured_0_sdkwork_platform",
            tenant_application_row_id("tenant_configured", "0", PLATFORM_APPLICATION_TEMPLATE_ID)
        );
    }

    #[test]
    fn parse_tenant_application_provision_requires_template_reference() {
        let body = json!({
            "tenantId": "100001",
            "organizationId": "0",
            "instanceKey": "prod",
            "environment": "prod"
        });
        let error =
            parse_tenant_application_provision_command(&body).expect_err("missing template");
        assert!(error.contains("templateId or appKey"));
    }

    #[test]
    fn intersect_permission_scopes_requires_overlap() {
        let error = intersect_permission_scopes(
            &["iam.users.read".to_owned()],
            &["iam.access_credentials.create".to_owned()],
        )
        .expect_err("no overlap");
        assert!(error.contains("does not hold"));
    }

    #[test]
    fn redact_runtime_config_for_response_masks_relying_party_secret_hash() {
        let runtime_config = json!({
            "auth": { "oauthLoginEnabled": true },
            "oauth": {
                "relyingParty": {
                    "clientSecretHash": "hash-keep",
                    "enabled": true
                }
            }
        });
        let redacted = redact_runtime_config_for_response(&runtime_config);
        assert_eq!(
            redacted["oauth"]["relyingParty"]["clientSecretHash"],
            json!("[redacted]")
        );
        assert_eq!(redacted["oauth"]["relyingParty"]["enabled"], json!(true));
    }

    #[test]
    fn merge_runtime_config_patch_preserves_auth_and_oauth_siblings() {
        let existing = json!({
            "auth": { "oauthLoginEnabled": true },
            "oauth": {
                "relyingParty": {
                    "enabled": true,
                    "clientSecretHash": "hash-keep",
                    "redirectUris": ["https://old.example/callback"]
                },
                "legacyFlag": true
            }
        });
        let patch = json!({
            "oauth": {
                "relyingParty": {
                    "enabled": false,
                    "redirectUris": ["https://new.example/callback"],
                    "allowedScopes": ["openid"]
                }
            }
        });
        let merged = merge_runtime_config_patch(&existing, &patch);
        assert_eq!(merged["auth"]["oauthLoginEnabled"], json!(true));
        assert_eq!(merged["oauth"]["legacyFlag"], json!(true));
        assert_eq!(merged["oauth"]["relyingParty"]["enabled"], json!(false));
        assert_eq!(
            merged["oauth"]["relyingParty"]["clientSecretHash"],
            json!("hash-keep")
        );
        assert_eq!(
            merged["oauth"]["relyingParty"]["redirectUris"],
            json!(["https://new.example/callback"])
        );
    }

    #[test]
    fn derive_tenant_application_primary_domain_candidate_avoids_shared_localhost_conflicts() {
        assert_eq!(
            derive_tenant_application_primary_domain_candidate("localhost", "sdkwork-im-pc", 0),
            "localhost"
        );
        assert_eq!(
            derive_tenant_application_primary_domain_candidate("localhost", "sdkwork-im-pc", 1),
            "sdkwork-im-pc.localhost"
        );
        assert_eq!(
            derive_tenant_application_primary_domain_candidate("localhost", "sdkwork-im-pc", 2),
            "sdkwork-im-pc-2.localhost"
        );
    }
}
