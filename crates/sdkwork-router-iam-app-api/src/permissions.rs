use chrono::{DateTime, Utc};
use sqlx::PgPool;

use crate::utils::*;

#[derive(Debug, Clone, Copy)]
struct LocalIamPermissionSeed {
    code: &'static str,
    name: &'static str,
    resource: &'static str,
    action: &'static str,
}

/// IAM directory permissions granted to the local `owner` role (aligned with claw seeds).
const OWNER_ROLE_PERMISSION_SEEDS: &[LocalIamPermissionSeed] = &[
    LocalIamPermissionSeed {
        code: "iam.users.read",
        name: "Read IAM users",
        resource: "iam.users",
        action: "read",
    },
    LocalIamPermissionSeed {
        code: "iam.users.create",
        name: "Create IAM users",
        resource: "iam.users",
        action: "create",
    },
    LocalIamPermissionSeed {
        code: "iam.users.update",
        name: "Update IAM users",
        resource: "iam.users",
        action: "update",
    },
    LocalIamPermissionSeed {
        code: "iam.users.delete",
        name: "Delete IAM users",
        resource: "iam.users",
        action: "delete",
    },
    LocalIamPermissionSeed {
        code: "iam.organizations.read",
        name: "Read organizations",
        resource: "iam.organizations",
        action: "read",
    },
    LocalIamPermissionSeed {
        code: "iam.organizations.create",
        name: "Create organizations",
        resource: "iam.organizations",
        action: "create",
    },
    LocalIamPermissionSeed {
        code: "iam.organizations.update",
        name: "Update organizations",
        resource: "iam.organizations",
        action: "update",
    },
    LocalIamPermissionSeed {
        code: "iam.organizations.delete",
        name: "Delete organizations",
        resource: "iam.organizations",
        action: "delete",
    },
    LocalIamPermissionSeed {
        code: "iam.departments.read",
        name: "Read departments",
        resource: "iam.departments",
        action: "read",
    },
    LocalIamPermissionSeed {
        code: "iam.departments.create",
        name: "Create departments",
        resource: "iam.departments",
        action: "create",
    },
    LocalIamPermissionSeed {
        code: "iam.departments.update",
        name: "Update departments",
        resource: "iam.departments",
        action: "update",
    },
    LocalIamPermissionSeed {
        code: "iam.departments.delete",
        name: "Delete departments",
        resource: "iam.departments",
        action: "delete",
    },
    LocalIamPermissionSeed {
        code: "iam.departments.manage",
        name: "Manage departments",
        resource: "iam.departments",
        action: "manage",
    },
    LocalIamPermissionSeed {
        code: "iam.memberships.read",
        name: "Read organization memberships",
        resource: "iam.memberships",
        action: "read",
    },
    LocalIamPermissionSeed {
        code: "iam.memberships.create",
        name: "Create organization memberships",
        resource: "iam.memberships",
        action: "create",
    },
    LocalIamPermissionSeed {
        code: "iam.memberships.update",
        name: "Update organization memberships",
        resource: "iam.memberships",
        action: "update",
    },
    LocalIamPermissionSeed {
        code: "iam.memberships.deactivate",
        name: "Deactivate organization memberships",
        resource: "iam.memberships",
        action: "deactivate",
    },
    LocalIamPermissionSeed {
        code: "iam.positions.read",
        name: "Read positions",
        resource: "iam.positions",
        action: "read",
    },
    LocalIamPermissionSeed {
        code: "iam.positions.create",
        name: "Create positions",
        resource: "iam.positions",
        action: "create",
    },
    LocalIamPermissionSeed {
        code: "iam.positions.update",
        name: "Update positions",
        resource: "iam.positions",
        action: "update",
    },
    LocalIamPermissionSeed {
        code: "iam.positions.delete",
        name: "Delete positions",
        resource: "iam.positions",
        action: "delete",
    },
    LocalIamPermissionSeed {
        code: "iam.assignments.read",
        name: "Read department and position assignments",
        resource: "iam.assignments",
        action: "read",
    },
    LocalIamPermissionSeed {
        code: "iam.assignments.create",
        name: "Create department and position assignments",
        resource: "iam.assignments",
        action: "create",
    },
    LocalIamPermissionSeed {
        code: "iam.assignments.update",
        name: "Update department and position assignments",
        resource: "iam.assignments",
        action: "update",
    },
    LocalIamPermissionSeed {
        code: "iam.assignments.deactivate",
        name: "Deactivate department and position assignments",
        resource: "iam.assignments",
        action: "deactivate",
    },
    LocalIamPermissionSeed {
        code: "iam.roles.read",
        name: "Read IAM roles",
        resource: "iam.roles",
        action: "read",
    },
    LocalIamPermissionSeed {
        code: "iam.roles.create",
        name: "Create IAM roles",
        resource: "iam.roles",
        action: "create",
    },
    LocalIamPermissionSeed {
        code: "iam.roles.update",
        name: "Update IAM roles",
        resource: "iam.roles",
        action: "update",
    },
    LocalIamPermissionSeed {
        code: "iam.roles.delete",
        name: "Delete IAM roles",
        resource: "iam.roles",
        action: "delete",
    },
    LocalIamPermissionSeed {
        code: "iam.roles.manage",
        name: "Manage IAM roles",
        resource: "iam.roles",
        action: "manage",
    },
    LocalIamPermissionSeed {
        code: "iam.permissions.read",
        name: "Read IAM permissions",
        resource: "iam.permissions",
        action: "read",
    },
    LocalIamPermissionSeed {
        code: "iam.permissions.create",
        name: "Create IAM permissions",
        resource: "iam.permissions",
        action: "create",
    },
    LocalIamPermissionSeed {
        code: "iam.permissions.update",
        name: "Update IAM permissions",
        resource: "iam.permissions",
        action: "update",
    },
    LocalIamPermissionSeed {
        code: "iam.permissions.delete",
        name: "Delete IAM permissions",
        resource: "iam.permissions",
        action: "delete",
    },
    LocalIamPermissionSeed {
        code: "iam.permissions.manage",
        name: "Manage IAM permissions",
        resource: "iam.permissions",
        action: "manage",
    },
    LocalIamPermissionSeed {
        code: "iam.role_permissions.read",
        name: "Read role permissions",
        resource: "iam.role_permissions",
        action: "read",
    },
    LocalIamPermissionSeed {
        code: "iam.role_permissions.create",
        name: "Grant role permissions",
        resource: "iam.role_permissions",
        action: "create",
    },
    LocalIamPermissionSeed {
        code: "iam.role_permissions.delete",
        name: "Revoke role permissions",
        resource: "iam.role_permissions",
        action: "delete",
    },
    LocalIamPermissionSeed {
        code: "iam.role_permissions.manage",
        name: "Manage role permissions",
        resource: "iam.role_permissions",
        action: "manage",
    },
    LocalIamPermissionSeed {
        code: "iam.role_bindings.read",
        name: "Read role bindings",
        resource: "iam.role_bindings",
        action: "read",
    },
    LocalIamPermissionSeed {
        code: "iam.role_bindings.create",
        name: "Create role bindings",
        resource: "iam.role_bindings",
        action: "create",
    },
    LocalIamPermissionSeed {
        code: "iam.role_bindings.delete",
        name: "Delete role bindings",
        resource: "iam.role_bindings",
        action: "delete",
    },
    LocalIamPermissionSeed {
        code: "iam.role_bindings.manage",
        name: "Manage role bindings",
        resource: "iam.role_bindings",
        action: "manage",
    },
    LocalIamPermissionSeed {
        code: "iam.access_credentials.create",
        name: "Create delegated access credentials",
        resource: "iam.access_credentials",
        action: "create",
    },
    LocalIamPermissionSeed {
        code: "iam.applications.register",
        name: "Register applications",
        resource: "iam.applications",
        action: "register",
    },
    LocalIamPermissionSeed {
        code: "iam.tenant_applications.provision",
        name: "Provision tenant applications",
        resource: "iam.tenant_applications",
        action: "provision",
    },
    LocalIamPermissionSeed {
        code: "iam.tenant_applications.update",
        name: "Update tenant applications",
        resource: "iam.tenant_applications",
        action: "update",
    },
    LocalIamPermissionSeed {
        code: "iam.tenant_applications.enable",
        name: "Enable tenant applications",
        resource: "iam.tenant_applications",
        action: "enable",
    },
];

pub(crate) fn default_iam_permission_id(code: &str) -> String {
    let normalized = code
        .chars()
        .map(|ch| match ch {
            'a'..='z' | '0'..='9' => ch,
            _ => '-',
        })
        .collect::<String>();
    format!("iam-permission-{normalized}")
}

pub(crate) async fn ensure_owner_role_permissions_db(
    pg: &PgPool,
    tenant_id: &str,
    role_id: &str,
    now: &DateTime<Utc>,
) -> Result<(), String> {
    for permission in OWNER_ROLE_PERMISSION_SEEDS {
        let permission_id = default_iam_permission_id(permission.code);
        sqlx::query(
            "INSERT INTO iam_permission (id, code, name, resource, action, created_at) \
             VALUES ($1, $2, $3, $4, $5, $6) \
             ON CONFLICT (code) DO NOTHING",
        )
        .bind(&permission_id)
        .bind(permission.code)
        .bind(permission.name)
        .bind(permission.resource)
        .bind(permission.action)
        .bind(now)
        .execute(pg)
        .await
        .map_err(|error| format!("ensure permission {}: {error}", permission.code))?;

        let role_permission_id = stable_local_id("roleperm", &[tenant_id, role_id, &permission_id]);
        sqlx::query(
            "INSERT INTO iam_role_permission (id, tenant_id, role_id, permission_id, created_at) \
             VALUES ($1, $2, $3, $4, $5) \
             ON CONFLICT (tenant_id, role_id, permission_id) DO NOTHING",
        )
        .bind(&role_permission_id)
        .bind(tenant_id)
        .bind(role_id)
        .bind(&permission_id)
        .bind(now)
        .execute(pg)
        .await
        .map_err(|error| format!("ensure owner role permission {}: {error}", permission.code))?;
    }
    Ok(())
}
