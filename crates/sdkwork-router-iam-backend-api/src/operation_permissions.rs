//! Maps backend-api `operation_id` values to stable IAM permission codes.
//!
//! Convention (aligned with Google Cloud IAM / AWS action naming):
//! - `*.list`, `*.retrieve`, `*.tree.retrieve` → `{domain}.read`
//! - `*.create` → `{domain}.create`
//! - `*.update` → `{domain}.update`
//! - `*.delete`, `*.revoke` → `{domain}.delete` or `{domain}.revoke`
//! - OAuth admin namespace → `iam.oauth.read` / `iam.oauth.manage`

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
enum IamResource {
    Tenants,
    TenantMembers,
    Organizations,
    Memberships,
    Departments,
    Assignments,
    Positions,
    Groups,
    GroupMembers,
    ServiceAccounts,
    RoleBindings,
    Users,
    Roles,
    RolePermissions,
    Permissions,
    Policies,
    ApiKeys,
    SecurityEvents,
    AuditEvents,
    AccountBindingPolicy,
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
enum IamAction {
    Read,
    Create,
    Update,
    Delete,
    Revoke,
    Deactivate,
    Enable,
    Provision,
    Register,
}

pub fn iam_backend_permission_for_operation(operation_id: &str) -> Option<&'static str> {
    if let Some(code) = explicit_bootstrap_permission(operation_id) {
        return Some(code);
    }
    if operation_id.starts_with("iam.oauth.") {
        return Some(oauth_permission_for_operation(operation_id));
    }
    let (resource, action) = parse_core_operation(operation_id)?;
    Some(permission_code(resource, action))
}

fn explicit_bootstrap_permission(operation_id: &str) -> Option<&'static str> {
    match operation_id {
        "applications.register" => Some("iam.applications.register"),
        "tenantApplications.provision" => Some("iam.tenant_applications.provision"),
        "tenantApplications.update" => Some("iam.tenant_applications.update"),
        "tenantApplications.enable" => Some("iam.tenant_applications.enable"),
        "accessCredentials.create" => Some("iam.access_credentials.create"),
        _ => None,
    }
}

fn oauth_permission_for_operation(operation_id: &str) -> &'static str {
    if operation_id.ends_with(".list")
        || operation_id.ends_with(".retrieve")
        || operation_id.ends_with("callbackEvents.list")
    {
        "iam.oauth.read"
    } else {
        "iam.oauth.manage"
    }
}

fn parse_core_operation(operation_id: &str) -> Option<(IamResource, IamAction)> {
    let parts: Vec<&str> = operation_id.split('.').collect();
    if parts.is_empty() {
        return None;
    }

    if parts.len() >= 3 && parts[0] == "roles" && parts[1] == "permissions" {
        return Some((IamResource::RolePermissions, parse_action(parts.last()?)?));
    }
    if parts.len() >= 3 && parts[0] == "groups" && parts[1] == "members" {
        return Some((IamResource::GroupMembers, parse_action(parts.last()?)?));
    }
    if parts.len() >= 3 && parts[0] == "tenants" && parts[1] == "members" {
        return Some((IamResource::TenantMembers, parse_action(parts.last()?)?));
    }

    let action = parse_action(parts.last()?)?;
    let resource = match parts[0] {
        "tenants" => IamResource::Tenants,
        "organizations" => IamResource::Organizations,
        "organizationMemberships" => IamResource::Memberships,
        "departments" => IamResource::Departments,
        "departmentAssignments" | "positionAssignments" => IamResource::Assignments,
        "positions" => IamResource::Positions,
        "groups" => IamResource::Groups,
        "serviceAccounts" => IamResource::ServiceAccounts,
        "roleBindings" => IamResource::RoleBindings,
        "users" => IamResource::Users,
        "roles" => IamResource::Roles,
        "permissions" => IamResource::Permissions,
        "policies" => IamResource::Policies,
        "apiKeys" => IamResource::ApiKeys,
        "securityEvents" => IamResource::SecurityEvents,
        "auditEvents" => IamResource::AuditEvents,
        "accountBindingPolicy" => IamResource::AccountBindingPolicy,
        _ => return None,
    };

    Some((resource, action))
}

fn parse_action(action: &str) -> Option<IamAction> {
    Some(match action {
        "list" | "retrieve" | "tree" => IamAction::Read,
        "create" => IamAction::Create,
        "update" => IamAction::Update,
        "delete" => IamAction::Delete,
        "revoke" => IamAction::Revoke,
        "deactivate" => IamAction::Deactivate,
        "enable" => IamAction::Enable,
        "provision" => IamAction::Provision,
        "register" => IamAction::Register,
        _ => return None,
    })
}

fn permission_code(resource: IamResource, action: IamAction) -> &'static str {
    match (resource, action) {
        (IamResource::Tenants, IamAction::Read) => "iam.tenants.read",
        (IamResource::Tenants, IamAction::Create) => "iam.tenants.create",
        (IamResource::Tenants, IamAction::Update) => "iam.tenants.update",
        (IamResource::Tenants, IamAction::Delete) => "iam.tenants.delete",
        (IamResource::TenantMembers, IamAction::Read) => "iam.tenant_members.read",
        (IamResource::TenantMembers, IamAction::Create) => "iam.tenant_members.create",
        (IamResource::TenantMembers, IamAction::Update) => "iam.tenant_members.update",
        (IamResource::TenantMembers, IamAction::Delete) => "iam.tenant_members.delete",
        (IamResource::Organizations, IamAction::Read) => "iam.organizations.read",
        (IamResource::Organizations, IamAction::Create) => "iam.organizations.create",
        (IamResource::Organizations, IamAction::Update) => "iam.organizations.update",
        (IamResource::Organizations, IamAction::Delete) => "iam.organizations.delete",
        (IamResource::Memberships, IamAction::Read) => "iam.memberships.read",
        (IamResource::Memberships, IamAction::Create) => "iam.memberships.create",
        (IamResource::Memberships, IamAction::Update) => "iam.memberships.update",
        (IamResource::Memberships, IamAction::Delete | IamAction::Deactivate) => {
            "iam.memberships.deactivate"
        }
        (IamResource::Departments, IamAction::Read) => "iam.departments.read",
        (IamResource::Departments, IamAction::Create) => "iam.departments.create",
        (IamResource::Departments, IamAction::Update) => "iam.departments.update",
        (IamResource::Departments, IamAction::Delete) => "iam.departments.delete",
        (IamResource::Assignments, IamAction::Read) => "iam.assignments.read",
        (IamResource::Assignments, IamAction::Create) => "iam.assignments.create",
        (IamResource::Assignments, IamAction::Update) => "iam.assignments.update",
        (IamResource::Assignments, IamAction::Delete | IamAction::Deactivate) => {
            "iam.assignments.deactivate"
        }
        (IamResource::Positions, IamAction::Read) => "iam.positions.read",
        (IamResource::Positions, IamAction::Create) => "iam.positions.create",
        (IamResource::Positions, IamAction::Update) => "iam.positions.update",
        (IamResource::Positions, IamAction::Delete) => "iam.positions.delete",
        (IamResource::Groups, IamAction::Read) => "iam.groups.read",
        (IamResource::Groups, IamAction::Create) => "iam.groups.create",
        (IamResource::Groups, IamAction::Update) => "iam.groups.update",
        (IamResource::Groups, IamAction::Delete) => "iam.groups.delete",
        (IamResource::GroupMembers, IamAction::Read) => "iam.group_members.read",
        (IamResource::GroupMembers, IamAction::Create) => "iam.group_members.create",
        (IamResource::GroupMembers, IamAction::Delete) => "iam.group_members.delete",
        (IamResource::ServiceAccounts, IamAction::Read) => "iam.service_accounts.read",
        (IamResource::ServiceAccounts, IamAction::Create) => "iam.service_accounts.create",
        (IamResource::ServiceAccounts, IamAction::Update) => "iam.service_accounts.update",
        (IamResource::ServiceAccounts, IamAction::Delete) => "iam.service_accounts.delete",
        (IamResource::RoleBindings, IamAction::Read) => "iam.role_bindings.read",
        (IamResource::RoleBindings, IamAction::Create) => "iam.role_bindings.create",
        (IamResource::RoleBindings, IamAction::Delete) => "iam.role_bindings.delete",
        (IamResource::Users, IamAction::Read) => "iam.users.read",
        (IamResource::Users, IamAction::Create) => "iam.users.create",
        (IamResource::Users, IamAction::Update) => "iam.users.update",
        (IamResource::Users, IamAction::Delete) => "iam.users.delete",
        (IamResource::Roles, IamAction::Read) => "iam.roles.read",
        (IamResource::Roles, IamAction::Create) => "iam.roles.create",
        (IamResource::Roles, IamAction::Update) => "iam.roles.update",
        (IamResource::Roles, IamAction::Delete) => "iam.roles.delete",
        (IamResource::RolePermissions, IamAction::Read) => "iam.role_permissions.read",
        (IamResource::RolePermissions, IamAction::Create) => "iam.role_permissions.create",
        (IamResource::RolePermissions, IamAction::Delete) => "iam.role_permissions.delete",
        (IamResource::Permissions, IamAction::Read) => "iam.permissions.read",
        (IamResource::Permissions, IamAction::Create) => "iam.permissions.create",
        (IamResource::Permissions, IamAction::Update) => "iam.permissions.update",
        (IamResource::Permissions, IamAction::Delete) => "iam.permissions.delete",
        (IamResource::Policies, IamAction::Read) => "iam.policies.read",
        (IamResource::Policies, IamAction::Create) => "iam.policies.create",
        (IamResource::Policies, IamAction::Update) => "iam.policies.update",
        (IamResource::Policies, IamAction::Delete) => "iam.policies.delete",
        (IamResource::ApiKeys, IamAction::Read) => "iam.api_keys.read",
        (IamResource::ApiKeys, IamAction::Revoke | IamAction::Delete) => "iam.api_keys.revoke",
        (IamResource::SecurityEvents, IamAction::Read) => "iam.security_events.read",
        (IamResource::AuditEvents, IamAction::Read) => "iam.audit_events.read",
        (IamResource::AccountBindingPolicy, IamAction::Read) => "iam.account_binding_policy.read",
        (IamResource::AccountBindingPolicy, IamAction::Update) => {
            "iam.account_binding_policy.update"
        }
        _ => "iam.permissions.manage",
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn maps_directory_reads_to_read_permissions() {
        assert_eq!(
            iam_backend_permission_for_operation("users.list"),
            Some("iam.users.read")
        );
        assert_eq!(
            iam_backend_permission_for_operation("roleBindings.list"),
            Some("iam.role_bindings.read")
        );
    }

    #[test]
    fn maps_oauth_mutations_to_manage_permission() {
        assert_eq!(
            iam_backend_permission_for_operation("iam.oauth.integrations.create"),
            Some("iam.oauth.manage")
        );
        assert_eq!(
            iam_backend_permission_for_operation("iam.oauth.providerCatalog.list"),
            Some("iam.oauth.read")
        );
    }

    #[test]
    fn maps_bootstrap_operations_to_platform_permissions() {
        assert_eq!(
            iam_backend_permission_for_operation("applications.register"),
            Some("iam.applications.register")
        );
    }
}
