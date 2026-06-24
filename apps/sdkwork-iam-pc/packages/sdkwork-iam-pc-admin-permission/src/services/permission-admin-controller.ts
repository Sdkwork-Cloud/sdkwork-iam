import type { SdkworkIamService } from "@sdkwork/iam-service";
import {
  canAccessBackendApi,
  hasPermissionInScope,
  type IamAppContext,
  type IamUserSurface,
  type SdkworkStandardRoleCode,
} from "@sdkwork/iam-contracts";

import type {
  CreateSdkworkIamPermissionControllerInput,
  SdkworkAuthorizationHint,
  SdkworkIamPermission,
  SdkworkIamPermissionController,
  SdkworkIamPermissionDraft,
  SdkworkIamPermissionState,
  SdkworkIamPolicy,
  SdkworkIamPolicyDraft,
  SdkworkIamRole,
  SdkworkIamRoleBinding,
  SdkworkIamRoleDraft,
} from "../types/permission-admin-types";
export function createSdkworkIamPermissionController(
  input: SdkworkIamService | CreateSdkworkIamPermissionControllerInput,
): SdkworkIamPermissionController {
  const resolved = resolveInput(input);
  let state: SdkworkIamPermissionState = {
    lastPrincipalId: undefined,
    permissionScope: [...new Set((resolved.permissionScope ?? []).map(normalizeRequiredCode))],
    permissions: [],
    policies: [],
    roleBindings: [],
    rolePermissions: {},
    roles: [],
    standardRoleCodes: [...new Set((resolved.standardRoleCodes ?? []).map(normalizeRequiredCode))],
    status: "idle",
    userSurface: resolved.userSurface ?? { app: true, organizationMember: false },
  };

  const setState = (patch: Partial<SdkworkIamPermissionState>) => {
    state = {
      ...state,
      ...patch,
    };
  };

  return {
    assignRoleBinding: async (body) => {      const roleBinding = toRoleBinding(await resolved.service.iam.roleBindings.create(body as unknown as Record<string, unknown>));
      if (!roleBinding) {
        throw new Error("SDKWork IAM permission controller received an invalid role binding response");
      }
      setState({
        lastPrincipalId: roleBinding.principalId,
        roleBindings: upsertById(state.roleBindings, roleBinding),
      });
      return roleBinding;
    },
    assignRolePermission: async (roleId, permissionId) => {
      const result = await resolved.service.iam.roles.permissions.create(
        requireId(roleId, "roleId"),
        requireId(permissionId, "permissionId"),
      );
      return result;
    },
    createPermission: async (body) => {
      requireId(body.code, "code");
      requireId(body.name, "name");
      setState({ status: "loading" });
      try {
        const permission = toPermission(
          await resolved.service.iam.permissions.create(body as unknown as Record<string, unknown>),
        );
        if (!permission) {
          throw new Error("SDKWork IAM permission create response is missing permissionId");
        }
        setState({
          permissions: upsertById(state.permissions, permission),
          status: "ready",
        });
        return permission;
      } catch (error) {
        setState({ status: "error" });
        throw error;
      }
    },
    createPolicy: async (body) => {
      requireId(body.name, "name");
      setState({ status: "loading" });
      try {
        const policy = toPolicy(
          await resolved.service.iam.policies.create(body as unknown as Record<string, unknown>),
        );
        if (!policy) {
          throw new Error("SDKWork IAM policy create response is missing policyId");
        }
        setState({
          policies: upsertById(state.policies, policy),
          status: "ready",
        });
        return policy;
      } catch (error) {
        setState({ status: "error" });
        throw error;
      }
    },
    createRole: async (body) => {
      requireId(body.name, "name");
      setState({ status: "loading" });
      try {
        const role = toRole(
          await resolved.service.iam.roles.create(body as unknown as Record<string, unknown>),
        );
        if (!role) {
          throw new Error("SDKWork IAM role create response is missing roleId");
        }
        setState({
          roles: upsertById(state.roles, role),
          status: "ready",
        });
        return role;
      } catch (error) {
        setState({ status: "error" });
        throw error;
      }
    },
    can: (hint) => evaluateAuthorization(state, hint),
    canAccessBackend: () => canAccessBackendApi(toIamAppContext(state)),
    getState: () => ({
      ...state,
      permissionScope: [...state.permissionScope],
      permissions: [...state.permissions],
      policies: [...state.policies],
      roleBindings: [...state.roleBindings],
      rolePermissions: Object.fromEntries(
        Object.entries(state.rolePermissions).map(([roleId, permissions]) => [roleId, [...permissions]]),
      ),
      roles: [...state.roles],
      standardRoleCodes: [...state.standardRoleCodes],
      userSurface: { ...state.userSurface },
    }),
    hasRole: (roleCode) => hasStandardRole(state, roleCode),
    deletePermission: async (permissionId) => {
      const normalizedPermissionId = requireId(permissionId, "permissionId");
      setState({ status: "loading" });
      try {
        await resolved.service.iam.permissions.delete(normalizedPermissionId);
        setState({
          permissions: state.permissions.filter((permission) => permission.permissionId !== normalizedPermissionId),
          status: "ready",
        });
      } catch (error) {
        setState({ status: "error" });
        throw error;
      }
    },
    deletePolicy: async (policyId) => {
      const normalizedPolicyId = requireId(policyId, "policyId");
      setState({ status: "loading" });
      try {
        await resolved.service.iam.policies.delete(normalizedPolicyId);
        setState({
          policies: state.policies.filter((policy) => policy.policyId !== normalizedPolicyId),
          status: "ready",
        });
      } catch (error) {
        setState({ status: "error" });
        throw error;
      }
    },
    deleteRole: async (roleId) => {
      const normalizedRoleId = requireId(roleId, "roleId");
      setState({ status: "loading" });
      try {
        await resolved.service.iam.roles.delete(normalizedRoleId);
        setState({
          roles: state.roles.filter((role) => role.roleId !== normalizedRoleId),
          status: "ready",
        });
      } catch (error) {
        setState({ status: "error" });
        throw error;
      }
    },
    isOrganizationMember: () => state.userSurface.organizationMember,
    listPermissions: async (params) => {
      setState({ status: "loading" });
      try {
        const permissions = extractList(await resolved.service.iam.permissions.list(params))
          .map(toPermission)
          .filter(Boolean) as SdkworkIamPermission[];
        setState({ permissions, status: "ready" });
        return permissions;
      } catch (error) {
        setState({ status: "error" });
        throw error;
      }
    },
    listPolicies: async (params) => {
      setState({ status: "loading" });
      try {
        const policies = extractList(await resolved.service.iam.policies.list(params))
          .map(toPolicy)
          .filter(Boolean) as SdkworkIamPolicy[];
        setState({ policies, status: "ready" });
        return policies;
      } catch (error) {
        setState({ status: "error" });
        throw error;
      }
    },
    listRoleBindings: async (params) => {
      setState({ status: "loading" });
      try {
        const roleBindings = extractList(await resolved.service.iam.roleBindings.list(params))
          .map(toRoleBinding)
          .filter(Boolean) as SdkworkIamRoleBinding[];
        setState({
          lastPrincipalId: optionalString(params?.principalId) || optionalString(params?.principal_id),
          roleBindings,
          status: "ready",
        });
        return roleBindings;
      } catch (error) {
        setState({ status: "error" });
        throw error;
      }
    },
    listRolePermissions: async (roleId, params) => {
      const normalizedRoleId = requireId(roleId, "roleId");
      setState({ status: "loading" });
      try {
        const permissions = extractList(await resolved.service.iam.roles.permissions.list(normalizedRoleId, params))
          .map(toPermission)
          .filter(Boolean) as SdkworkIamPermission[];
        setState({
          rolePermissions: {
            ...state.rolePermissions,
            [normalizedRoleId]: permissions,
          },
          status: "ready",
        });
        return permissions;
      } catch (error) {
        setState({ status: "error" });
        throw error;
      }
    },
    listRoles: async (params) => {
      setState({ status: "loading" });
      try {
        const roles = extractList(await resolved.service.iam.roles.list(params))
          .map(toRole)
          .filter(Boolean) as SdkworkIamRole[];
        setState({ roles, status: "ready" });
        return roles;
      } catch (error) {
        setState({ status: "error" });
        throw error;
      }
    },
    revokeRoleBinding: async (roleBindingId) => {
      const normalizedRoleBindingId = requireId(roleBindingId, "roleBindingId");
      const result = await resolved.service.iam.roleBindings.delete(normalizedRoleBindingId);
      setState({
        roleBindings: state.roleBindings.filter((binding) => binding.id !== normalizedRoleBindingId),
      });
      return result;
    },
    revokeRolePermission: async (roleId, permissionId) => resolved.service.iam.roles.permissions.delete(
      requireId(roleId, "roleId"),
      requireId(permissionId, "permissionId"),
    ),
    updatePermission: async (permissionId, body) => {
      const normalizedPermissionId = requireId(permissionId, "permissionId");
      setState({ status: "loading" });
      try {
        const permission = toPermission(
          await resolved.service.iam.permissions.update(normalizedPermissionId, body as unknown as Record<string, unknown>),
        );
        if (!permission) {
          throw new Error("SDKWork IAM permission update response is missing permissionId");
        }
        setState({
          permissions: upsertById(state.permissions, permission),
          status: "ready",
        });
        return permission;
      } catch (error) {
        setState({ status: "error" });
        throw error;
      }
    },
    updatePolicy: async (policyId, body) => {
      const normalizedPolicyId = requireId(policyId, "policyId");
      setState({ status: "loading" });
      try {
        const policy = toPolicy(
          await resolved.service.iam.policies.update(normalizedPolicyId, body as unknown as Record<string, unknown>),
        );
        if (!policy) {
          throw new Error("SDKWork IAM policy update response is missing policyId");
        }
        setState({
          policies: upsertById(state.policies, policy),
          status: "ready",
        });
        return policy;
      } catch (error) {
        setState({ status: "error" });
        throw error;
      }
    },
    updateRole: async (roleId, body) => {
      const normalizedRoleId = requireId(roleId, "roleId");
      setState({ status: "loading" });
      try {
        const role = toRole(
          await resolved.service.iam.roles.update(normalizedRoleId, body as unknown as Record<string, unknown>),
        );
        if (!role) {
          throw new Error("SDKWork IAM role update response is missing roleId");
        }
        setState({
          roles: upsertById(state.roles, role),
          status: "ready",
        });
        return role;
      } catch (error) {
        setState({ status: "error" });
        throw error;
      }
    },
  };
}

function resolveInput(
  input: SdkworkIamService | CreateSdkworkIamPermissionControllerInput,
): CreateSdkworkIamPermissionControllerInput {
  if ("service" in input) {
    return input;
  }

  return { service: input };
}

function toIamAppContext(state: SdkworkIamPermissionState): IamAppContext {
  return {
    appId: "sdkwork-admin",
    authLevel: "password",
    dataScope: [],
    deploymentMode: "saas",
    environment: "dev",
    permissionScope: [...state.permissionScope],
    sessionId: "ui",
    tenantId: "tenant",
    userId: state.lastPrincipalId ?? "user",
    userSurface: { ...state.userSurface },
    standardRoleCodes: [...state.standardRoleCodes],
  };
}

function hasStandardRole(state: SdkworkIamPermissionState, roleCode: string): boolean {
  const normalized = normalizeRequiredCode(roleCode);
  if (state.standardRoleCodes.some((code) => normalizeRequiredCode(code) === normalized)) {
    return true;
  }

  return state.roles.some((role) => normalizeRequiredCode(role.code) === normalized);
}

function evaluateAuthorization(
  state: SdkworkIamPermissionState,
  hint: string | SdkworkAuthorizationHint,
): boolean {
  const normalizedHint = typeof hint === "string" ? { permissionCode: hint } : hint;
  const requiredCodes = getRequiredPermissionCodes(state.permissions, normalizedHint);
  if (requiredCodes.length === 0) {
    return false;
  }

  const grantedCodes = new Set(state.permissionScope.map(normalizeRequiredCode));
  const roleIds = new Set([
    ...state.roleBindings
      .filter((binding) => normalizeRequiredCode(binding.effect || "allow") !== "deny")
      .filter((binding) => !["disabled", "inactive", "revoked"].includes(normalizeRequiredCode(binding.status)))
      .map((binding) => binding.roleId),
    ...(normalizedHint.roleIds ?? []).map(normalizeRequiredCode),
  ]);

  for (const roleId of roleIds) {
    for (const permission of state.rolePermissions[roleId] ?? []) {
      grantedCodes.add(normalizeRequiredCode(permission.code));
    }
  }

  if (grantedCodes.has("*")) {
    return true;
  }

  const mode = normalizedHint.mode ?? "any";
  const checks = requiredCodes.map((code) => isGranted(grantedCodes, code));
  return mode === "all" ? checks.every(Boolean) : checks.some(Boolean);
}

function getRequiredPermissionCodes(
  knownPermissions: readonly SdkworkIamPermission[],
  hint: SdkworkAuthorizationHint,
): string[] {
  const codes = new Set<string>();

  if (hint.permissionCode) {
    codes.add(normalizeRequiredCode(hint.permissionCode));
  }

  for (const code of hint.permissionCodes ?? []) {
    codes.add(normalizeRequiredCode(code));
  }

  if (hint.resource && hint.action) {
    const resource = normalizeRequiredCode(hint.resource);
    const action = normalizeRequiredCode(hint.action);
    codes.add(`${resource}.${action}`);
    codes.add(`${resource}:${action}`);

    for (const permission of knownPermissions) {
      if (
        normalizeRequiredCode(permission.resource) === resource
        && normalizeRequiredCode(permission.action) === action
      ) {
        codes.add(normalizeRequiredCode(permission.code));
      }
    }
  }

  return [...codes].filter(Boolean);
}

function isGranted(grantedCodes: ReadonlySet<string>, requiredCode: string): boolean {
  return hasPermissionInScope([...grantedCodes], requiredCode);
}

function extractList(value: unknown): unknown[] {
  if (Array.isArray(value)) {
    return value;
  }

  if (!value || typeof value !== "object") {
    return [];
  }

  const record = value as Record<string, unknown>;
  for (const key of ["records", "items", "list", "rows", "content", "data"]) {
    const nested = record[key];
    if (Array.isArray(nested)) {
      return nested;
    }
  }

  return [];
}

function toRole(value: unknown): SdkworkIamRole | undefined {
  const record = toRecord(value);
  const roleId = optionalString(record.roleId) || optionalString(record.role_id) || optionalString(record.id);
  if (!roleId) {
    return undefined;
  }

  return {
    code: optionalString(record.code),
    id: optionalString(record.id) || roleId,
    name: optionalString(record.name) || optionalString(record.roleName) || roleId,
    roleId,
    status: optionalString(record.status),
    tenantId: optionalString(record.tenantId) || optionalString(record.tenant_id),
  };
}

function toPermission(value: unknown): SdkworkIamPermission | undefined {
  const record = toRecord(value);
  const permissionId = optionalString(record.permissionId) || optionalString(record.permission_id) || optionalString(record.id) || optionalString(record.code);
  const code = optionalString(record.code) || optionalString(record.permissionCode);
  if (!permissionId || !code) {
    return undefined;
  }

  return {
    action: optionalString(record.action),
    code,
    id: optionalString(record.id) || permissionId,
    name: optionalString(record.name) || optionalString(record.permissionName) || code,
    permissionId,
    resource: optionalString(record.resource),
  };
}

function toPolicy(value: unknown): SdkworkIamPolicy | undefined {
  const record = toRecord(value);
  const policyId = optionalString(record.policyId) || optionalString(record.policy_id) || optionalString(record.id);
  if (!policyId) {
    return undefined;
  }

  return {
    code: optionalString(record.code),
    id: optionalString(record.id) || policyId,
    name: optionalString(record.name) || optionalString(record.policyName) || policyId,
    policyId,
    status: optionalString(record.status),
    tenantId: optionalString(record.tenantId) || optionalString(record.tenant_id),
  };
}

function toRoleBinding(value: unknown): SdkworkIamRoleBinding | undefined {
  const record = toRecord(value);
  const id = optionalString(record.id) || optionalString(record.roleBindingId) || optionalString(record.role_binding_id);
  const roleId = optionalString(record.roleId) || optionalString(record.role_id) || optionalString(record.id);
  const principalKind = optionalString(record.principalKind) || optionalString(record.principal_kind);
  const principalId = optionalString(record.principalId) || optionalString(record.principal_id);
  const scopeKind = optionalString(record.scopeKind) || optionalString(record.scope_kind);
  const scopeId = optionalString(record.scopeId) || optionalString(record.scope_id);
  if (!id || !roleId || !principalKind || !principalId || !scopeKind || !scopeId) {
    return undefined;
  }

  return {
    effect: optionalString(record.effect),
    id,
    principalId,
    principalKind,
    roleId,
    scopeId,
    scopeKind,
    status: optionalString(record.status),
    tenantId: optionalString(record.tenantId) || optionalString(record.tenant_id),
  };
}

function upsertById<T extends { id: string }>(items: readonly T[], item: T): T[] {
  const next = items.filter((candidate) => candidate.id !== item.id);
  next.push(item);
  return next;
}

function toRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? value as Record<string, unknown> : {};
}

function optionalString(value: unknown): string | undefined {
  const normalized = typeof value === "string" ? value.trim() : value === undefined || value === null ? "" : String(value).trim();
  return normalized || undefined;
}

function normalizeRequiredCode(value: unknown): string {
  return optionalString(value)?.replace(/\s+/gu, "").toLowerCase() ?? "";
}

function requireId(value: unknown, name: string): string {
  const normalized = optionalString(value);
  if (!normalized) {
    throw new Error(`SDKWork IAM permission controller requires ${name}`);
  }

  return normalized;
}

