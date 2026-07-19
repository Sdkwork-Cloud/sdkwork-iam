use std::collections::{BTreeSet, HashMap, VecDeque};
use std::path::Path;

use chrono::{DateTime, Utc};
use sdkwork_iam_context_service::{
    expand_permission_patterns, IamRoleSurface, IAM_STANDARD_ROLE_DEFINITIONS,
};
use serde_json::json;
use sha2::{Digest, Sha256};
use sqlx::{PgPool, SqlitePool};

use crate::bootstrap_subject::{
    DEFAULT_IAM_ORGANIZATION_CODE, DEFAULT_IAM_ORGANIZATION_DATA_BOUNDARY_KIND,
    DEFAULT_IAM_ORGANIZATION_ID, DEFAULT_IAM_ORGANIZATION_KIND, DEFAULT_IAM_ORGANIZATION_NAME,
    DEFAULT_IAM_ORGANIZATION_PATH, DEFAULT_IAM_ORGANIZATION_TENANT_BOUNDARY_KIND,
    DEFAULT_IAM_ORGANIZATION_VERIFICATION_STATUS, DEFAULT_IAM_TENANT_CODE, DEFAULT_IAM_TENANT_ID,
    DEFAULT_IAM_TENANT_NAME,
};
use crate::discover::{
    discover_modules, discover_modules_with_manifests, load_registry_config, merge_discovered,
};
use crate::manifest::DepartmentTemplate;
use crate::validate::validate_catalog;

#[derive(Debug, Clone)]
pub struct MaterializeReport {
    pub profile: String,
    pub permission_count: usize,
    pub role_count: usize,
    pub directory_node_count: usize,
    pub lock_sha256: String,
}

pub fn permission_id(code: &str) -> String {
    let normalized = code
        .chars()
        .map(|ch| match ch {
            'a'..='z' | '0'..='9' => ch,
            _ => '-',
        })
        .collect::<String>();
    truncate_iam_artifact_id(format!("iam-permission-{normalized}"))
}

const MAX_IAM_ARTIFACT_ID_LEN: usize = 128;

fn truncate_iam_artifact_id(raw: String) -> String {
    if raw.len() <= MAX_IAM_ARTIFACT_ID_LEN {
        return raw;
    }
    use std::collections::hash_map::DefaultHasher;
    use std::hash::{Hash, Hasher};
    let mut hasher = DefaultHasher::new();
    raw.hash(&mut hasher);
    format!("iam-id-{:016x}", hasher.finish())
}

pub fn standard_role_id(tenant_id: &str, code: &str) -> String {
    let normalized = code
        .chars()
        .map(|ch| match ch {
            'a'..='z' | '0'..='9' => ch,
            _ => '-',
        })
        .collect::<String>();
    truncate_iam_artifact_id(format!("iam-role-{tenant_id}-{normalized}"))
}

pub fn standard_role_permission_id(tenant_id: &str, role_id: &str, permission_id: &str) -> String {
    truncate_iam_artifact_id(format!(
        "iam-role-perm-{tenant_id}-{role_id}-{permission_id}"
    ))
}

pub fn resolve_app_root(app_root: Option<&Path>) -> std::path::PathBuf {
    app_root.map(Path::to_path_buf).unwrap_or_else(|| {
        std::env::var("SDKWORK_IAM_APP_ROOT")
            .or_else(|_| std::env::var("SDKWORK_APPBASE_APP_ROOT"))
            .map(std::path::PathBuf::from)
            .unwrap_or_else(|_| {
                std::path::PathBuf::from(env!("CARGO_MANIFEST_DIR"))
                    .join("../..")
                    .canonicalize()
                    .unwrap_or_else(|_| {
                        std::path::PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../..")
                    })
            })
    })
}

pub async fn materialize_postgres_catalog(
    pool: &PgPool,
    app_root: Option<&Path>,
    profile: &str,
) -> Result<MaterializeReport, String> {
    materialize_postgres_catalog_with_manifests(pool, app_root, profile, &[]).await
}

pub async fn materialize_postgres_catalog_with_manifests(
    pool: &PgPool,
    app_root: Option<&Path>,
    profile: &str,
    additional_manifest_paths: &[std::path::PathBuf],
) -> Result<MaterializeReport, String> {
    let root = resolve_app_root(app_root);
    let config = load_registry_config(&root)?;
    let modules =
        discover_modules_with_manifests(&root, &config.enabled_modules, additional_manifest_paths)?;
    validate_catalog(&modules)?;
    let merged = merge_discovered(&modules);

    let mut tx = pool
        .begin()
        .await
        .map_err(|error| format!("begin materialize transaction failed: {error}"))?;

    upsert_postgres_default_subject(&mut tx).await?;
    ensure_organization_closure_postgres(
        &mut tx,
        DEFAULT_IAM_TENANT_ID,
        DEFAULT_IAM_ORGANIZATION_ID,
    )
    .await?;
    upsert_postgres_permissions_from_catalog(&mut tx, &merged).await?;
    upsert_postgres_roles(&mut tx, DEFAULT_IAM_TENANT_ID, &merged).await?;
    upsert_postgres_role_exclusions(&mut tx, DEFAULT_IAM_TENANT_ID, &modules).await?;
    let directory_node_count = materialize_directory_postgres(&mut tx, profile, &modules).await?;
    upsert_registry_metadata_postgres(&mut tx, profile, &merged, directory_node_count).await?;

    tx.commit()
        .await
        .map_err(|error| format!("commit materialize transaction failed: {error}"))?;

    write_lock_file(&root, profile, &merged)?;

    Ok(MaterializeReport {
        profile: profile.to_string(),
        permission_count: merged.permissions.len(),
        role_count: IAM_STANDARD_ROLE_DEFINITIONS.len() + merged.domain_roles.len(),
        directory_node_count,
        lock_sha256: merged_lock_sha256(profile, &merged),
    })
}

pub async fn materialize_sqlite_catalog(
    pool: &SqlitePool,
    app_root: Option<&Path>,
    profile: &str,
) -> Result<MaterializeReport, String> {
    materialize_sqlite_catalog_with_manifests(pool, app_root, profile, &[]).await
}

pub async fn materialize_sqlite_catalog_with_manifests(
    pool: &SqlitePool,
    app_root: Option<&Path>,
    profile: &str,
    additional_manifest_paths: &[std::path::PathBuf],
) -> Result<MaterializeReport, String> {
    let root = resolve_app_root(app_root);
    let config = load_registry_config(&root)?;
    let modules =
        discover_modules_with_manifests(&root, &config.enabled_modules, additional_manifest_paths)?;
    validate_catalog(&modules)?;
    let merged = merge_discovered(&modules);

    upsert_sqlite_default_subject(pool).await?;
    upsert_sqlite_permissions_from_catalog(pool, &merged).await?;
    upsert_sqlite_roles(pool, DEFAULT_IAM_TENANT_ID, &merged).await?;

    Ok(MaterializeReport {
        profile: profile.to_string(),
        permission_count: merged.permissions.len(),
        role_count: IAM_STANDARD_ROLE_DEFINITIONS.len() + merged.domain_roles.len(),
        directory_node_count: 0,
        lock_sha256: merged_lock_sha256(profile, &merged),
    })
}

fn permission_domain(code: &str) -> String {
    if code == "*" {
        return "iam".to_string();
    }
    if let Some((prefix, _)) = code.split_once(':') {
        return prefix.to_string();
    }
    code.split('.').next().unwrap_or(code).to_string()
}

fn role_surface(surface: &IamRoleSurface) -> &'static str {
    match surface {
        IamRoleSurface::App => "app",
        IamRoleSurface::Organization => "organization",
        IamRoleSurface::Platform => "platform",
    }
}

async fn upsert_postgres_default_subject(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
) -> Result<(), String> {
    sqlx::query(
        r#"
        INSERT INTO iam_tenant (id, code, name, status, created_at, updated_at)
        VALUES ($1, $2, $3, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT(id) DO UPDATE SET code = excluded.code, name = excluded.name, status = excluded.status, updated_at = CURRENT_TIMESTAMP
        "#,
    )
    .bind(DEFAULT_IAM_TENANT_ID)
    .bind(DEFAULT_IAM_TENANT_CODE)
    .bind(DEFAULT_IAM_TENANT_NAME)
    .execute(&mut **tx)
    .await
    .map_err(|error| format!("upsert tenant failed: {error}"))?;

    sqlx::query(
        r#"
        INSERT INTO iam_organization
            (id, tenant_id, parent_organization_id, code, name, path, status, organization_kind, tenant_boundary_kind, data_boundary_kind, app_boundary_enabled, verification_status, created_at, updated_at)
        VALUES
            ($1, $2, NULL, $3, $4, $5, 'active', $6, $7, $8, 0, $9, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT(id) DO UPDATE SET
            tenant_id = excluded.tenant_id,
            code = excluded.code,
            name = excluded.name,
            path = excluded.path,
            status = excluded.status,
            updated_at = CURRENT_TIMESTAMP
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
    .execute(&mut **tx)
    .await
    .map_err(|error| format!("upsert organization failed: {error}"))?;
    Ok(())
}

async fn upsert_sqlite_default_subject(pool: &SqlitePool) -> Result<(), String> {
    let now = Utc::now().to_rfc3339();
    sqlx::query(
        r#"
        INSERT INTO iam_tenant (id, code, name, status, created_at, updated_at)
        VALUES (?, ?, ?, 'active', ?, ?)
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
    .await
    .map_err(|error| format!("upsert tenant failed: {error}"))?;
    sqlx::query(
        r#"
        INSERT INTO iam_organization
            (id, tenant_id, parent_organization_id, code, name, path, status, organization_kind, tenant_boundary_kind, data_boundary_kind, app_boundary_enabled, verification_status, created_at, updated_at)
        VALUES
            (?, ?, NULL, ?, ?, ?, 'active', ?, ?, ?, 0, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
            tenant_id = excluded.tenant_id,
            code = excluded.code,
            name = excluded.name,
            path = excluded.path,
            status = excluded.status,
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
    .await
    .map_err(|error| format!("upsert organization failed: {error}"))?;
    Ok(())
}

async fn upsert_postgres_permissions_from_catalog(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    merged: &crate::merge::MergedIamCatalog,
) -> Result<(), String> {
    for (entry, module_id) in merged.permissions.values() {
        sqlx::query(
            r#"
            INSERT INTO iam_permission
                (id, code, name, resource, action, module_id, domain, catalog_version, status, replacement_code, created_at, updated_at)
            VALUES
                ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            ON CONFLICT(code) DO UPDATE SET
                name = excluded.name,
                resource = excluded.resource,
                action = excluded.action,
                module_id = excluded.module_id,
                domain = excluded.domain,
                catalog_version = excluded.catalog_version,
                status = excluded.status,
                replacement_code = excluded.replacement_code,
                updated_at = CURRENT_TIMESTAMP
            "#,
        )
        .bind(permission_id(&entry.code))
        .bind(&entry.code)
        .bind(&entry.name)
        .bind(&entry.resource)
        .bind(&entry.action)
        .bind(module_id)
        .bind(permission_domain(&entry.code))
        .bind("1.0.0")
        .bind(&entry.status)
        .bind(&entry.replacement_code)
        .execute(&mut **tx)
        .await
        .map_err(|error| format!("upsert permission {} failed: {error}", entry.code))?;
    }
    Ok(())
}

async fn upsert_sqlite_permissions_from_catalog(
    pool: &SqlitePool,
    merged: &crate::merge::MergedIamCatalog,
) -> Result<(), String> {
    let now = Utc::now().to_rfc3339();
    for (entry, module_id) in merged.permissions.values() {
        sqlx::query(
            r#"
            INSERT INTO iam_permission (id, code, name, resource, action, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT(code) DO UPDATE SET
                name = excluded.name,
                resource = excluded.resource,
                action = excluded.action
            "#,
        )
        .bind(permission_id(&entry.code))
        .bind(&entry.code)
        .bind(&entry.name)
        .bind(&entry.resource)
        .bind(&entry.action)
        .bind(&now)
        .execute(pool)
        .await
        .map_err(|error| format!("upsert sqlite permission {} failed: {error}", entry.code))?;
        let _ = module_id;
    }
    Ok(())
}

pub async fn upsert_tenant_roles_postgres(
    pool: &PgPool,
    tenant_id: &str,
    app_root: Option<&Path>,
) -> Result<(), String> {
    let root = resolve_app_root(app_root);
    let config = load_registry_config(&root)?;
    let modules = discover_modules(&root, &config.enabled_modules)?;
    validate_catalog(&modules)?;
    let merged = merge_discovered(&modules);
    let mut tx = pool
        .begin()
        .await
        .map_err(|error| format!("begin tenant roles transaction failed: {error}"))?;
    upsert_postgres_roles(&mut tx, tenant_id, &merged).await?;
    tx.commit()
        .await
        .map_err(|error| format!("commit tenant roles transaction failed: {error}"))
}

pub async fn upsert_tenant_roles_sqlite(
    pool: &SqlitePool,
    tenant_id: &str,
    app_root: Option<&Path>,
) -> Result<(), String> {
    let root = resolve_app_root(app_root);
    let config = load_registry_config(&root)?;
    let modules = discover_modules(&root, &config.enabled_modules)?;
    validate_catalog(&modules)?;
    let merged = merge_discovered(&modules);
    upsert_sqlite_roles(pool, tenant_id, &merged).await
}

async fn upsert_postgres_roles(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    tenant_id: &str,
    merged: &crate::merge::MergedIamCatalog,
) -> Result<(), String> {
    let catalog_codes = merged.permission_code_refs();
    for definition in IAM_STANDARD_ROLE_DEFINITIONS {
        let role_id = standard_role_id(tenant_id, definition.code);
        sqlx::query(
            r#"
            INSERT INTO iam_role
                (id, tenant_id, code, name, status, role_class, module_id, surface, assignable, standard, binding_principal_kind, created_at, updated_at)
            VALUES
                ($1, $2, $3, $4, 'active', 'platform_standard', 'iam-kernel', $5, 1, 1, 'organization_membership', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            ON CONFLICT(tenant_id, code) DO UPDATE SET
                name = excluded.name,
                status = 'active',
                role_class = excluded.role_class,
                module_id = excluded.module_id,
                surface = excluded.surface,
                assignable = excluded.assignable,
                standard = excluded.standard,
                binding_principal_kind = excluded.binding_principal_kind,
                updated_at = CURRENT_TIMESTAMP
            "#,
        )
        .bind(&role_id)
        .bind(tenant_id)
        .bind(definition.code)
        .bind(definition.name)
        .bind(role_surface(&definition.surface))
        .execute(&mut **tx)
        .await
        .map_err(|error| format!("upsert platform role {} failed: {error}", definition.code))?;

        let patterns = merged
            .role_patterns
            .get(definition.code)
            .cloned()
            .unwrap_or_default();
        upsert_role_permissions_postgres(tx, tenant_id, &role_id, &patterns, &catalog_codes)
            .await?;
    }

    for (role, module_id) in &merged.domain_roles {
        let role_id = standard_role_id(tenant_id, &role.code);
        sqlx::query(
            r#"
            INSERT INTO iam_role
                (id, tenant_id, code, name, status, role_class, module_id, surface, assignable, standard, binding_principal_kind, created_at, updated_at)
            VALUES
                ($1, $2, $3, $4, 'active', 'domain_standard', $5, $6, $7, 1, $8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            ON CONFLICT(tenant_id, code) DO UPDATE SET
                name = excluded.name,
                status = 'active',
                role_class = excluded.role_class,
                module_id = excluded.module_id,
                surface = excluded.surface,
                assignable = excluded.assignable,
                standard = excluded.standard,
                binding_principal_kind = excluded.binding_principal_kind,
                updated_at = CURRENT_TIMESTAMP
            "#,
        )
        .bind(&role_id)
        .bind(tenant_id)
        .bind(&role.code)
        .bind(&role.name)
        .bind(module_id)
        .bind(&role.surface)
        .bind(i32::from(role.assignable))
        .bind(&role.binding_principal_kind)
        .execute(&mut **tx)
        .await
        .map_err(|error| format!("upsert domain role {} failed: {error}", role.code))?;

        let patterns = merged
            .role_patterns
            .get(&role.code)
            .cloned()
            .unwrap_or_default();
        upsert_role_permissions_postgres(tx, tenant_id, &role_id, &patterns, &catalog_codes)
            .await?;
    }
    Ok(())
}

async fn upsert_sqlite_roles(
    pool: &SqlitePool,
    tenant_id: &str,
    merged: &crate::merge::MergedIamCatalog,
) -> Result<(), String> {
    let now = Utc::now().to_rfc3339();
    let catalog_codes = merged.permission_code_refs();
    for definition in IAM_STANDARD_ROLE_DEFINITIONS {
        let role_id = standard_role_id(tenant_id, definition.code);
        sqlx::query(
            "INSERT INTO iam_role (id, tenant_id, code, name, status, created_at, updated_at) VALUES (?, ?, ?, ?, 'active', ?, ?) ON CONFLICT(tenant_id, code) DO UPDATE SET name = excluded.name, status = excluded.status, updated_at = excluded.updated_at",
        )
        .bind(&role_id)
        .bind(tenant_id)
        .bind(definition.code)
        .bind(definition.name)
        .bind(&now)
        .bind(&now)
        .execute(pool)
        .await
        .map_err(|error| format!("upsert sqlite role {} failed: {error}", definition.code))?;

        let patterns = merged
            .role_patterns
            .get(definition.code)
            .cloned()
            .unwrap_or_default();
        let pattern_refs: Vec<&str> = patterns.iter().map(String::as_str).collect();
        let expanded = expand_permission_patterns(&pattern_refs, &catalog_codes);
        for permission_code in expanded {
            let permission_key = permission_id(&permission_code);
            let role_permission_id =
                standard_role_permission_id(tenant_id, &role_id, &permission_key);
            sqlx::query(
                "INSERT INTO iam_role_permission (id, tenant_id, role_id, permission_id, created_at) VALUES (?, ?, ?, ?, ?) ON CONFLICT(tenant_id, role_id, permission_id) DO NOTHING",
            )
            .bind(&role_permission_id)
            .bind(tenant_id)
            .bind(&role_id)
            .bind(&permission_key)
            .bind(&now)
            .execute(pool)
            .await
            .map_err(|error| format!("upsert sqlite role permission failed: {error}"))?;
        }
    }
    Ok(())
}

async fn upsert_role_permissions_postgres(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    tenant_id: &str,
    role_id: &str,
    patterns: &std::collections::BTreeSet<String>,
    catalog_codes: &[&str],
) -> Result<(), String> {
    let pattern_refs: Vec<&str> = patterns.iter().map(String::as_str).collect();
    let expanded = expand_permission_patterns(&pattern_refs, catalog_codes);
    for permission_code in expanded {
        let permission_key = permission_id(&permission_code);
        let role_permission_id = standard_role_permission_id(tenant_id, role_id, &permission_key);
        sqlx::query(
            r#"
            INSERT INTO iam_role_permission (id, tenant_id, role_id, permission_id, created_at)
            VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
            ON CONFLICT(tenant_id, role_id, permission_id) DO NOTHING
            "#,
        )
        .bind(&role_permission_id)
        .bind(tenant_id)
        .bind(role_id)
        .bind(&permission_key)
        .execute(&mut **tx)
        .await
        .map_err(|error| format!("upsert role permission failed: {error}"))?;
    }
    Ok(())
}

async fn upsert_registry_metadata_postgres(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    profile: &str,
    merged: &crate::merge::MergedIamCatalog,
    directory_node_count: usize,
) -> Result<(), String> {
    let now = Utc::now();
    for (module_id, domain, owner, catalog_version, manifest_sha256) in &merged.registry_entries {
        sqlx::query(
            r#"
            INSERT INTO iam_module_registry_entry
                (id, module_id, domain, owner, catalog_version, manifest_sha256, status, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, 'active', $7, $7)
            ON CONFLICT(module_id) DO UPDATE SET
                domain = excluded.domain,
                owner = excluded.owner,
                catalog_version = excluded.catalog_version,
                manifest_sha256 = excluded.manifest_sha256,
                status = 'active',
                updated_at = excluded.updated_at
            "#,
        )
        .bind(format!("registry-entry-{module_id}"))
        .bind(module_id)
        .bind(domain)
        .bind(owner)
        .bind(catalog_version)
        .bind(manifest_sha256)
        .bind(now)
        .execute(&mut **tx)
        .await
        .map_err(|error| format!("upsert registry entry for {module_id} failed: {error}"))?;
    }

    let lock_sha256 = merged_lock_sha256(profile, merged);
    let snapshot_json = serde_json::to_string(&json!({
        "profile": profile,
        "permissionCount": merged.permissions.len(),
        "modules": merged.registry_entries.iter().map(|entry| json!({
            "moduleId": entry.0,
            "catalogVersion": entry.3,
            "manifestSha256": entry.4,
        })).collect::<Vec<_>>(),
    }))
    .map_err(|error| format!("serialize snapshot failed: {error}"))?;

    sqlx::query(
        r#"
        INSERT INTO iam_module_registry_snapshot
            (id, profile, lock_sha256, snapshot_json, materialized_at, created_at)
        VALUES ($1, $2, $3, $4, $5, $5)
        ON CONFLICT (id) DO UPDATE SET
            profile = excluded.profile,
            lock_sha256 = excluded.lock_sha256,
            snapshot_json = excluded.snapshot_json,
            materialized_at = excluded.materialized_at,
            created_at = excluded.created_at
        "#,
    )
    .bind(format!("registry-snapshot-{lock_sha256}"))
    .bind(profile)
    .bind(&lock_sha256)
    .bind(&snapshot_json)
    .bind(now)
    .execute(&mut **tx)
    .await
    .map_err(|error| format!("insert registry snapshot failed: {error}"))?;

    sqlx::query(
        r#"
        INSERT INTO iam_catalog_materialization
            (id, profile, permission_count, role_count, directory_node_count, diff_json, materialized_at, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $7)
        ON CONFLICT (id) DO UPDATE SET
            profile = excluded.profile,
            permission_count = excluded.permission_count,
            role_count = excluded.role_count,
            directory_node_count = excluded.directory_node_count,
            diff_json = excluded.diff_json,
            materialized_at = excluded.materialized_at,
            created_at = excluded.created_at
        "#,
    )
    .bind(format!("catalog-materialization-{lock_sha256}"))
    .bind(profile)
    .bind(i32::try_from(merged.permissions.len()).unwrap_or(i32::MAX))
    .bind(
        i32::try_from(IAM_STANDARD_ROLE_DEFINITIONS.len() + merged.domain_roles.len())
            .unwrap_or(i32::MAX),
    )
    .bind(i32::try_from(directory_node_count).unwrap_or(i32::MAX))
    .bind(&snapshot_json)
    .bind(now)
    .execute(&mut **tx)
    .await
    .map_err(|error| format!("insert catalog materialization failed: {error}"))?;
    Ok(())
}

async fn materialize_directory_postgres(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    profile: &str,
    modules: &[crate::discover::DiscoveredModule],
) -> Result<usize, String> {
    if profile == "minimal" {
        return Ok(0);
    }

    let mut node_count = 0usize;
    let tenant_id = DEFAULT_IAM_TENANT_ID;
    let now = Utc::now();

    for module in modules {
        for org in &module.manifest.directory.organization_templates {
            let org_id = org.seed_id.clone().unwrap_or_else(|| org.code.clone());
            sqlx::query(
                r#"
                UPDATE iam_organization
                SET template_ref = $1,
                    module_id = $2,
                    seed_profile = $3,
                    sort_order = $4,
                    updated_at = CURRENT_TIMESTAMP
                WHERE tenant_id = $5 AND id = $6
                "#,
            )
            .bind(&org.r#ref)
            .bind(&module.module_id)
            .bind(profile)
            .bind(org.sort_order)
            .bind(tenant_id)
            .bind(&org_id)
            .execute(&mut **tx)
            .await
            .map_err(|error| format!("tag organization template failed: {error}"))?;
            node_count += 1;
        }
    }

    if profile == "standard" || profile == "operational" {
        let planned = collect_department_templates(modules);
        let sorted = sort_department_templates(&planned)?;
        let mut dept_ref_to_id: HashMap<String, String> = HashMap::new();
        let mut dept_ref_to_path: HashMap<String, String> = HashMap::new();

        for planned_dept in sorted {
            let dept = &planned_dept.template;
            let org_id = DEFAULT_IAM_ORGANIZATION_ID.to_string();
            let dept_id = format!("dept-{org_id}-{}", dept.code);
            let parent_department_id =
                resolve_department_parent_id(&dept.parent_ref, &dept_ref_to_id);
            let path = if let Some(parent_ref) = department_parent_ref(&dept.parent_ref) {
                let parent_path = dept_ref_to_path.get(&parent_ref).ok_or_else(|| {
                    format!(
                        "department {} parent path missing for ref {parent_ref}",
                        dept.r#ref
                    )
                })?;
                format!("{parent_path}/{}", dept.code)
            } else {
                format!("/{org_id}/{}", dept.code)
            };

            sqlx::query(
                r#"
                INSERT INTO iam_department
                    (id, tenant_id, organization_id, parent_department_id, code, name, department_kind, path, status, template_ref, module_id, seed_profile, created_at, updated_at)
                VALUES
                    ($1, $2, $3, $4, $5, $6, $7, $8, 'active', $9, $10, $11, $12, $12)
                ON CONFLICT (tenant_id, organization_id, code) DO UPDATE SET
                    name = excluded.name,
                    parent_department_id = excluded.parent_department_id,
                    department_kind = excluded.department_kind,
                    path = excluded.path,
                    template_ref = excluded.template_ref,
                    module_id = excluded.module_id,
                    seed_profile = excluded.seed_profile,
                    updated_at = excluded.updated_at
                "#,
            )
            .bind(&dept_id)
            .bind(tenant_id)
            .bind(&org_id)
            .bind(&parent_department_id)
            .bind(&dept.code)
            .bind(&dept.name)
            .bind(&dept.department_kind)
            .bind(&path)
            .bind(&dept.r#ref)
            .bind(&planned_dept.module_id)
            .bind(profile)
            .bind(now)
            .execute(&mut **tx)
            .await
            .map_err(|error| format!("upsert department {} failed: {error}", dept.code))?;
            node_count += 1;
            ensure_department_closure_postgres_tx(
                tx,
                tenant_id,
                &org_id,
                &dept_id,
                parent_department_id.as_deref(),
                now,
            )
            .await?;
            dept_ref_to_id.insert(dept.r#ref.clone(), dept_id);
            dept_ref_to_path.insert(dept.r#ref.clone(), path);
        }

        for module in modules {
            for position in &module.manifest.directory.position_templates {
                let org_id = DEFAULT_IAM_ORGANIZATION_ID.to_string();
                let position_id = format!("pos-{org_id}-{}", position.code);
                sqlx::query(
                    r#"
                    INSERT INTO iam_position
                        (id, tenant_id, organization_id, department_id, code, name, position_kind, status, template_ref, module_id, seed_profile, created_at, updated_at)
                    VALUES
                        ($1, $2, $3, NULL, $4, $5, $6, 'active', $7, $8, $9, $10, $10)
                    ON CONFLICT (tenant_id, organization_id, code) DO UPDATE SET
                        name = excluded.name,
                        position_kind = excluded.position_kind,
                        template_ref = excluded.template_ref,
                        module_id = excluded.module_id,
                        seed_profile = excluded.seed_profile,
                        updated_at = excluded.updated_at
                    "#,
                )
                .bind(&position_id)
                .bind(tenant_id)
                .bind(&org_id)
                .bind(&position.code)
                .bind(&position.name)
                .bind(&position.position_kind)
                .bind(&position.r#ref)
                .bind(&module.module_id)
                .bind(profile)
                .bind(now)
                .execute(&mut **tx)
                .await
                .map_err(|error| format!("upsert position {} failed: {error}", position.code))?;
                node_count += 1;
            }
        }
    }

    Ok(node_count)
}

async fn upsert_postgres_role_exclusions(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    tenant_id: &str,
    modules: &[crate::discover::DiscoveredModule],
) -> Result<(), String> {
    let now = Utc::now();
    for module in modules {
        for exclusion in &module.manifest.roles.role_exclusions {
            let role_id = standard_role_id(tenant_id, &exclusion.role_code);
            let excludes_role_id = standard_role_id(tenant_id, &exclusion.excludes_role_code);
            let exclusion_id = format!(
                "iam-role-exclusion-{tenant_id}-{}-{}",
                exclusion.role_code, exclusion.excludes_role_code
            );
            sqlx::query(
                r#"
                INSERT INTO iam_role_exclusion
                    (id, tenant_id, role_id, excludes_role_id, reason, module_id, status, created_at, updated_at)
                VALUES
                    ($1, $2, $3, $4, NULL, $5, 'active', $6, $7)
                ON CONFLICT (tenant_id, role_id, excludes_role_id) DO UPDATE SET
                    module_id = excluded.module_id,
                    status = 'active',
                    updated_at = excluded.updated_at
                "#,
            )
            .bind(&exclusion_id)
            .bind(tenant_id)
            .bind(&role_id)
            .bind(&excludes_role_id)
            .bind(&module.module_id)
            .bind(now)
            .bind(now)
            .execute(&mut **tx)
            .await
            .map_err(|error| format!("upsert role exclusion failed: {error}"))?;
        }
    }
    Ok(())
}

async fn ensure_organization_closure_postgres(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    tenant_id: &str,
    organization_id: &str,
) -> Result<(), String> {
    let now = Utc::now();
    let closure_id = format!("iam-org-closure-{tenant_id}-{organization_id}-self");
    sqlx::query(
        r#"
        INSERT INTO iam_organization_closure
            (id, tenant_id, ancestor_organization_id, descendant_organization_id, depth, created_at)
        VALUES
            ($1, $2, $3, $3, 0, $4)
        ON CONFLICT (tenant_id, ancestor_organization_id, descendant_organization_id) DO NOTHING
        "#,
    )
    .bind(&closure_id)
    .bind(tenant_id)
    .bind(organization_id)
    .bind(now)
    .execute(&mut **tx)
    .await
    .map_err(|error| format!("ensure organization closure failed: {error}"))?;
    Ok(())
}

async fn ensure_department_closure_postgres_tx(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    tenant_id: &str,
    organization_id: &str,
    department_id: &str,
    parent_department_id: Option<&str>,
    now: DateTime<Utc>,
) -> Result<(), String> {
    let self_id = format!("iam-dept-closure-{tenant_id}-{organization_id}-{department_id}-self");
    sqlx::query(
        r#"
        INSERT INTO iam_department_closure
            (id, tenant_id, organization_id, ancestor_department_id, descendant_department_id, depth, created_at)
        VALUES
            ($1, $2, $3, $4, $4, 0, $5)
        ON CONFLICT (tenant_id, organization_id, ancestor_department_id, descendant_department_id) DO NOTHING
        "#,
    )
    .bind(&self_id)
    .bind(tenant_id)
    .bind(organization_id)
    .bind(department_id)
    .bind(now)
    .execute(&mut **tx)
    .await
    .map_err(|error| format!("ensure department self-closure failed: {error}"))?;

    if let Some(parent_id) = parent_department_id {
        sqlx::query(
            r#"
            INSERT INTO iam_department_closure
                (id, tenant_id, organization_id, ancestor_department_id, descendant_department_id, depth, created_at)
            SELECT
                'iam-dept-closure-' || $2 || '-' || $3 || '-' || c.ancestor_department_id || '-' || $4 || '-' || (c.depth + 1)::text,
                $2,
                $3,
                c.ancestor_department_id,
                $4,
                c.depth + 1,
                $5
            FROM iam_department_closure c
            WHERE c.tenant_id = $2
              AND c.organization_id = $3
              AND c.descendant_department_id = $1
            ON CONFLICT (tenant_id, organization_id, ancestor_department_id, descendant_department_id) DO NOTHING
            "#,
        )
        .bind(parent_id)
        .bind(tenant_id)
        .bind(organization_id)
        .bind(department_id)
        .bind(now)
        .execute(&mut **tx)
        .await
        .map_err(|error| format!("ensure department ancestor closures failed: {error}"))?;
    }

    Ok(())
}

pub async fn ensure_department_closure_postgres(
    pool: &PgPool,
    tenant_id: &str,
    organization_id: &str,
    department_id: &str,
    parent_department_id: Option<&str>,
    now: DateTime<Utc>,
) -> Result<(), String> {
    let self_id = format!("iam-dept-closure-{tenant_id}-{organization_id}-{department_id}-self");
    sqlx::query(
        r#"
        INSERT INTO iam_department_closure
            (id, tenant_id, organization_id, ancestor_department_id, descendant_department_id, depth, created_at)
        VALUES
            ($1, $2, $3, $4, $4, 0, $5)
        ON CONFLICT (tenant_id, organization_id, ancestor_department_id, descendant_department_id) DO NOTHING
        "#,
    )
    .bind(&self_id)
    .bind(tenant_id)
    .bind(organization_id)
    .bind(department_id)
    .bind(now)
    .execute(pool)
    .await
    .map_err(|error| format!("ensure department self closure failed: {error}"))?;

    if let Some(parent_id) = parent_department_id {
        sqlx::query(
            r#"
            INSERT INTO iam_department_closure
                (id, tenant_id, organization_id, ancestor_department_id, descendant_department_id, depth, created_at)
            SELECT
                'iam-dept-closure-' || $2 || '-' || $3 || '-' || c.ancestor_department_id || '-' || $4 || '-' || (c.depth + 1)::text,
                $2,
                $3,
                c.ancestor_department_id,
                $4,
                c.depth + 1,
                $5
            FROM iam_department_closure c
            WHERE c.tenant_id = $2
              AND c.organization_id = $3
              AND c.descendant_department_id = $1
            ON CONFLICT (tenant_id, organization_id, ancestor_department_id, descendant_department_id) DO NOTHING
            "#,
        )
        .bind(parent_id)
        .bind(tenant_id)
        .bind(organization_id)
        .bind(department_id)
        .bind(now)
        .execute(pool)
        .await
        .map_err(|error| format!("ensure department ancestor closures failed: {error}"))?;
    }

    Ok(())
}

#[derive(Clone)]
struct PlannedDepartment {
    module_id: String,
    template: DepartmentTemplate,
}

fn collect_department_templates(
    modules: &[crate::discover::DiscoveredModule],
) -> Vec<PlannedDepartment> {
    modules
        .iter()
        .flat_map(|module| {
            module
                .manifest
                .directory
                .department_templates
                .iter()
                .cloned()
                .map(|template| PlannedDepartment {
                    module_id: module.module_id.clone(),
                    template,
                })
        })
        .collect()
}

pub fn department_parent_ref(parent_ref: &str) -> Option<String> {
    let trimmed = parent_ref.trim();
    if trimmed.is_empty()
        || trimmed.starts_with("$orgref:")
        || trimmed.starts_with("$org:")
        || trimmed == "$root"
    {
        return None;
    }
    if let Some(rest) = trimmed.strip_prefix("$deptref:") {
        return Some(rest.to_string());
    }
    Some(trimmed.to_string())
}

fn resolve_department_parent_id(
    parent_ref: &str,
    dept_ref_to_id: &HashMap<String, String>,
) -> Option<String> {
    department_parent_ref(parent_ref)
        .and_then(|parent_template_ref| dept_ref_to_id.get(&parent_template_ref).cloned())
}

fn sort_department_templates(
    departments: &[PlannedDepartment],
) -> Result<Vec<PlannedDepartment>, String> {
    let refs: BTreeSet<String> = departments
        .iter()
        .map(|dept| dept.template.r#ref.clone())
        .collect();
    let mut indegree: HashMap<String, usize> = refs.iter().map(|key| (key.clone(), 0)).collect();
    let mut children: HashMap<String, Vec<String>> = HashMap::new();

    for dept in departments {
        if let Some(parent_ref) = department_parent_ref(&dept.template.parent_ref) {
            if !refs.contains(&parent_ref) {
                return Err(format!(
                    "department {} parentRef {parent_ref} not found in merged templates",
                    dept.template.r#ref
                ));
            }
            *indegree.entry(dept.template.r#ref.clone()).or_insert(0) += 1;
            children
                .entry(parent_ref)
                .or_default()
                .push(dept.template.r#ref.clone());
        }
    }

    let mut queue: VecDeque<String> = indegree
        .iter()
        .filter_map(|(key, count)| if *count == 0 { Some(key.clone()) } else { None })
        .collect();
    let mut ordered_refs = Vec::new();
    while let Some(current) = queue.pop_front() {
        ordered_refs.push(current.clone());
        if let Some(next_refs) = children.get(&current) {
            for next in next_refs {
                if let Some(count) = indegree.get_mut(next) {
                    *count -= 1;
                    if *count == 0 {
                        queue.push_back(next.clone());
                    }
                }
            }
        }
    }

    if ordered_refs.len() != departments.len() {
        return Err("department template parentRef graph contains a cycle".to_string());
    }

    let by_ref: HashMap<String, PlannedDepartment> = departments
        .iter()
        .map(|dept| (dept.template.r#ref.clone(), dept.clone()))
        .collect();
    ordered_refs
        .into_iter()
        .map(|dept_ref| {
            by_ref
                .get(&dept_ref)
                .cloned()
                .ok_or_else(|| format!("department template {dept_ref} missing during sort"))
        })
        .collect()
}

fn merged_lock_sha256(profile: &str, merged: &crate::merge::MergedIamCatalog) -> String {
    let mut hasher = Sha256::new();
    hasher.update(profile.as_bytes());
    for code in merged.permissions.keys() {
        hasher.update(code.as_bytes());
    }
    format!("{:x}", hasher.finalize())
}

fn write_lock_file(
    app_root: &Path,
    profile: &str,
    merged: &crate::merge::MergedIamCatalog,
) -> Result<(), String> {
    let lock = json!({
        "schemaVersion": 1,
        "kind": "sdkwork.iam.registry.lock",
        "materializedAt": Utc::now().to_rfc3339(),
        "profile": profile,
        "modules": merged.registry_entries.iter().map(|entry| json!({
            "moduleId": entry.0,
            "catalogVersion": entry.3,
            "manifestSha256": entry.4,
        })).collect::<Vec<_>>(),
        "permissionCount": merged.permissions.len(),
        "roleCount": IAM_STANDARD_ROLE_DEFINITIONS.len() + merged.domain_roles.len(),
    });
    let serialized = serde_json::to_string_pretty(&lock)
        .map_err(|error| format!("serialize lock file failed: {error}"))?;
    let path = app_root.join("iam/registry/iam-registry.lock.json");
    std::fs::write(&path, format!("{serialized}\n"))
        .map_err(|error| format!("write lock file {path:?} failed: {error}"))?;
    Ok(())
}

#[cfg(test)]
mod directory_template_tests {
    use super::{department_parent_ref, sort_department_templates, PlannedDepartment};
    use crate::manifest::DepartmentTemplate;

    fn dept(ref_name: &str, code: &str, parent_ref: &str) -> PlannedDepartment {
        PlannedDepartment {
            module_id: "test".to_string(),
            template: DepartmentTemplate {
                r#ref: ref_name.to_string(),
                code: code.to_string(),
                name: code.to_string(),
                parent_ref: parent_ref.to_string(),
                department_kind: "general".to_string(),
                sort_order: 0,
                default_positions: Vec::new(),
            },
        }
    }

    #[test]
    fn department_parent_ref_resolves_org_and_dept_references() {
        assert_eq!(department_parent_ref("$orgref:root"), None);
        assert_eq!(
            department_parent_ref("$deptref:dept.commerce"),
            Some("dept.commerce".to_string())
        );
    }

    #[test]
    fn sort_department_templates_orders_parents_before_children() {
        let planned = vec![
            dept("dept.finance", "finance", "$deptref:dept.commerce"),
            dept("dept.commerce", "commerce", "$orgref:root"),
        ];
        let sorted = sort_department_templates(&planned).expect("sort");
        assert_eq!(sorted[0].template.r#ref, "dept.commerce");
        assert_eq!(sorted[1].template.r#ref, "dept.finance");
    }
}
