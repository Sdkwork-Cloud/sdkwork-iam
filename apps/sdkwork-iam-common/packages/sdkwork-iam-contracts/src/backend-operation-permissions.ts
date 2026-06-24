export function resolveIamBackendOperationPermission(operationId: string): string | undefined {
  const explicit = explicitBootstrapPermission(operationId);
  if (explicit) {
    return explicit;
  }
  if (operationId.startsWith("iam.oauth.")) {
    return oauthPermissionForOperation(operationId);
  }
  const parsed = parseCoreOperation(operationId);
  if (!parsed) {
    return undefined;
  }
  return permissionCode(parsed.resource, parsed.action);
}

function explicitBootstrapPermission(operationId: string): string | undefined {
  switch (operationId) {
    case "applications.register":
      return "iam.applications.register";
    case "tenantApplications.provision":
      return "iam.tenant_applications.provision";
    case "tenantApplications.update":
      return "iam.tenant_applications.update";
    case "tenantApplications.retrieve":
      return "iam.tenant_applications.update";
    case "tenantApplications.enable":
      return "iam.tenant_applications.enable";
    case "accessCredentials.create":
      return "iam.access_credentials.create";
    default:
      return undefined;
  }
}

function oauthPermissionForOperation(operationId: string): string {
  if (
    operationId.endsWith(".list")
    || operationId.endsWith(".retrieve")
    || operationId.endsWith("callbackEvents.list")
  ) {
    return "iam.oauth.read";
  }
  return "iam.oauth.manage";
}

type IamResource =
  | "tenants"
  | "tenantMembers"
  | "organizations"
  | "memberships"
  | "departments"
  | "assignments"
  | "positions"
  | "roleBindings"
  | "users"
  | "roles"
  | "rolePermissions"
  | "permissions"
  | "policies"
  | "apiKeys"
  | "securityEvents"
  | "auditEvents"
  | "accountBindingPolicy";

type IamAction = "read" | "create" | "update" | "delete" | "revoke" | "deactivate";

function parseCoreOperation(operationId: string): { resource: IamResource; action: IamAction } | undefined {
  const parts = operationId.split(".");
  if (parts.length === 0) {
    return undefined;
  }

  if (parts.length >= 3 && parts[0] === "roles" && parts[1] === "permissions") {
    const action = parseAction(parts.at(-1));
    return action ? { resource: "rolePermissions", action } : undefined;
  }
  if (parts.length >= 3 && parts[0] === "tenants" && parts[1] === "members") {
    const action = parseAction(parts.at(-1));
    return action ? { resource: "tenantMembers", action } : undefined;
  }

  const action = parseAction(parts.at(-1));
  if (!action) {
    return undefined;
  }

  switch (parts[0]) {
    case "tenants":
      return { resource: "tenants", action };
    case "organizations":
      return { resource: "organizations", action };
    case "organizationMemberships":
      return { resource: "memberships", action };
    case "departments":
      return { resource: "departments", action };
    case "departmentAssignments":
    case "positionAssignments":
      return { resource: "assignments", action };
    case "positions":
      return { resource: "positions", action };
    case "roleBindings":
      return { resource: "roleBindings", action };
    case "users":
      return { resource: "users", action };
    case "roles":
      return { resource: "roles", action };
    case "permissions":
      return { resource: "permissions", action };
    case "policies":
      return { resource: "policies", action };
    case "apiKeys":
      return { resource: "apiKeys", action };
    case "securityEvents":
      return { resource: "securityEvents", action };
    case "auditEvents":
      return { resource: "auditEvents", action };
    case "accountBindingPolicy":
      return { resource: "accountBindingPolicy", action };
    default:
      return undefined;
  }
}

function parseAction(action: string | undefined): IamAction | undefined {
  switch (action) {
    case "list":
    case "retrieve":
    case "tree":
      return "read";
    case "create":
      return "create";
    case "update":
      return "update";
    case "delete":
      return "delete";
    case "revoke":
      return "revoke";
    case "deactivate":
      return "deactivate";
    default:
      return undefined;
  }
}

function permissionCode(resource: IamResource, action: IamAction): string {
  switch (resource) {
    case "tenants":
      return `iam.tenants.${action === "read" ? "read" : action}`;
    case "tenantMembers":
      return `iam.tenant_members.${action === "read" ? "read" : action}`;
    case "organizations":
      return `iam.organizations.${action === "read" ? "read" : action}`;
    case "memberships":
      return action === "deactivate" ? "iam.memberships.deactivate" : `iam.memberships.${action}`;
    case "departments":
      return `iam.departments.${action === "read" ? "read" : action}`;
    case "assignments":
      return action === "deactivate" ? "iam.assignments.deactivate" : `iam.assignments.${action}`;
    case "positions":
      return `iam.positions.${action === "read" ? "read" : action}`;
    case "roleBindings":
      return `iam.role_bindings.${action === "read" ? "read" : action === "delete" ? "delete" : "create"}`;
    case "users":
      return `iam.users.${action === "read" ? "read" : action}`;
    case "roles":
      return `iam.roles.${action === "read" ? "read" : action}`;
    case "rolePermissions":
      return `iam.role_permissions.${action === "read" ? "read" : action === "delete" ? "delete" : "create"}`;
    case "permissions":
      return `iam.permissions.${action === "read" ? "read" : action}`;
    case "policies":
      return `iam.policies.${action === "read" ? "read" : action}`;
    case "apiKeys":
      return action === "revoke" || action === "delete" ? "iam.api_keys.revoke" : "iam.api_keys.read";
    case "securityEvents":
      return "iam.security_events.read";
    case "auditEvents":
      return "iam.audit_events.read";
    case "accountBindingPolicy":
      return action === "update" ? "iam.account_binding_policy.update" : "iam.account_binding_policy.read";
    default:
      return "iam.permissions.manage";
  }
}

export function permissionMatches(granted: string, required: string): boolean {
  const normalizedGranted = granted.trim().toLowerCase();
  const normalizedRequired = required.trim().toLowerCase();
  if (!normalizedGranted || !normalizedRequired) {
    return false;
  }
  if (normalizedGranted === "*" || normalizedGranted === normalizedRequired) {
    return true;
  }
  if (normalizedGranted.endsWith(".*")) {
    const prefix = normalizedGranted.slice(0, -2).replace(/\.$/, "");
    return normalizedRequired === prefix || normalizedRequired.startsWith(`${prefix}.`);
  }
  if (normalizedGranted.startsWith("*.")) {
    const action = normalizedGranted.slice(2).replace(/^\./, "");
    return normalizedRequired.endsWith(action) && normalizedRequired.split(".").at(-1) === action;
  }
  return false;
}

export function hasPermissionInScope(grantedCodes: readonly string[], required: string): boolean {
  return grantedCodes.some((granted) => permissionMatches(granted, required));
}
