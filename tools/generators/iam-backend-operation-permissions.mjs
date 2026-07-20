export function resolveIamBackendOperationPermission(operationId) {
  const explicit = explicitBootstrapPermission(operationId);
  if (explicit) {
    return explicit;
  }
  if (operationId.startsWith('iam.oauth.')) {
    return oauthPermissionForOperation(operationId);
  }
  const parsed = parseCoreOperation(operationId);
  if (!parsed) {
    return undefined;
  }
  return permissionCode(parsed.resource, parsed.action);
}

function explicitBootstrapPermission(operationId) {
  switch (operationId) {
    case 'users.current.retrieve':
      return 'iam:self';
    case 'users.current.update':
    case 'users.current.password.update':
    case 'users.current.emailBindings.create':
    case 'users.current.emailBindings.delete':
    case 'users.current.phoneBindings.create':
    case 'users.current.phoneBindings.delete':
      return 'iam.profile.update';
    case 'applications.register':
      return 'iam.applications.register';
    case 'tenantApplications.create':
      return 'iam.tenant_applications.provision';
    case 'tenantApplications.list':
    case 'tenantApplications.summary.retrieve':
      return 'iam.tenant_applications.update';
    case 'tenantApplications.management.create':
      return 'iam.tenant_applications.provision';
    case 'tenantApplications.management.update':
    case 'tenantApplications.management.disable':
      return 'iam.tenant_applications.update';
    case 'tenantApplications.management.enable':
      return 'iam.tenant_applications.enable';
    case 'tenantApplications.update':
      return 'iam.tenant_applications.update';
    case 'tenantApplications.enable':
      return 'iam.tenant_applications.enable';
    case 'accessCredentials.create':
      return 'iam.access_credentials.create';
    case 'serviceAccounts.credentials.create':
      return 'iam.service_account_credentials.create';
    case 'serviceAccountCredentials.revoke':
      return 'iam.service_account_credentials.revoke';
    default:
      return undefined;
  }
}

function oauthPermissionForOperation(operationId) {
  if (
    operationId.endsWith('.list')
    || operationId.endsWith('.retrieve')
    || operationId.endsWith('callbackEvents.list')
  ) {
    return 'iam.oauth.read';
  }
  return 'iam.oauth.manage';
}

function parseCoreOperation(operationId) {
  const parts = operationId.split('.');
  if (parts.length === 0) {
    return undefined;
  }

  if (parts.length >= 3 && parts[0] === 'roles' && parts[1] === 'permissions') {
    const action = parseAction(parts.at(-1));
    return action ? { resource: 'rolePermissions', action } : undefined;
  }
  if (parts.length >= 3 && parts[0] === 'tenants' && parts[1] === 'members') {
    const action = parseAction(parts.at(-1));
    return action ? { resource: 'tenantMembers', action } : undefined;
  }

  const action = parseAction(parts.at(-1));
  if (!action) {
    return undefined;
  }

  switch (parts[0]) {
    case 'tenants':
      return { resource: 'tenants', action };
    case 'organizations':
      return { resource: 'organizations', action };
    case 'organizationMemberships':
      return { resource: 'memberships', action };
    case 'departments':
      return { resource: 'departments', action };
    case 'departmentAssignments':
    case 'positionAssignments':
      return { resource: 'assignments', action };
    case 'positions':
      return { resource: 'positions', action };
    case 'roleBindings':
      return { resource: 'roleBindings', action };
    case 'users':
      return { resource: 'users', action };
    case 'roles':
      return { resource: 'roles', action };
    case 'permissions':
      return { resource: 'permissions', action };
    case 'policies':
      return { resource: 'policies', action };
    case 'apiKeys':
      return { resource: 'apiKeys', action };
    case 'securityEvents':
      return { resource: 'securityEvents', action };
    case 'auditEvents':
      return { resource: 'auditEvents', action };
    case 'accountBindingPolicy':
      return { resource: 'accountBindingPolicy', action };
    default:
      return undefined;
  }
}

function parseAction(action) {
  switch (action) {
    case 'list':
    case 'retrieve':
    case 'tree':
      return 'read';
    case 'create':
      return 'create';
    case 'update':
      return 'update';
    case 'delete':
      return 'delete';
    case 'revoke':
      return 'revoke';
    case 'deactivate':
      return 'deactivate';
    default:
      return undefined;
  }
}

function permissionCode(resource, action) {
  switch (resource) {
    case 'tenants':
      return `iam.tenants.${action === 'read' ? 'read' : action}`;
    case 'tenantMembers':
      return `iam.tenant_members.${action === 'read' ? 'read' : action}`;
    case 'organizations':
      return `iam.organizations.${action === 'read' ? 'read' : action}`;
    case 'memberships':
      return action === 'deactivate' ? 'iam.memberships.deactivate' : `iam.memberships.${action}`;
    case 'departments':
      return `iam.departments.${action === 'read' ? 'read' : action}`;
    case 'assignments':
      return action === 'deactivate' ? 'iam.assignments.deactivate' : `iam.assignments.${action}`;
    case 'positions':
      return `iam.positions.${action === 'read' ? 'read' : action}`;
    case 'roleBindings':
      return `iam.role_bindings.${action === 'read' ? 'read' : action === 'delete' ? 'delete' : 'create'}`;
    case 'users':
      return `iam.users.${action === 'read' ? 'read' : action}`;
    case 'roles':
      return `iam.roles.${action === 'read' ? 'read' : action}`;
    case 'rolePermissions':
      return `iam.role_permissions.${action === 'read' ? 'read' : action === 'delete' ? 'delete' : 'create'}`;
    case 'permissions':
      return `iam.permissions.${action === 'read' ? 'read' : action}`;
    case 'policies':
      return `iam.policies.${action === 'read' ? 'read' : action}`;
    case 'apiKeys':
      return action === 'revoke' || action === 'delete' ? 'iam.api_keys.revoke' : 'iam.api_keys.read';
    case 'securityEvents':
      return 'iam.security_events.read';
    case 'auditEvents':
      return 'iam.audit_events.read';
    case 'accountBindingPolicy':
      return action === 'update' ? 'iam.account_binding_policy.update' : 'iam.account_binding_policy.read';
    default:
      return 'iam.permissions.manage';
  }
}
