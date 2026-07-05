import type {
  IamUserSurface,
  SdkworkStandardRoleCode,
  SdkWorkPageInfo,
} from "@sdkwork/iam-contracts";
import type { SdkworkIamService } from "@sdkwork/iam-service";

export interface SdkworkIamRoleDraft {
  code?: string;
  name: string;
  status?: string;
  tenantId?: string;
}

export interface SdkworkIamPermissionDraft {
  action?: string;
  code: string;
  name: string;
  resource?: string;
}

export interface SdkworkIamPolicyDraft {
  code?: string;
  name: string;
  status?: string;
  tenantId?: string;
}

export interface SdkworkIamRoleBindingDraft {
  principalId: string;
  principalKind: string;
  roleId: string;
  scopeId: string;
  scopeKind: string;
  effect?: string;
  status?: string;
}

export interface SdkworkIamRole {
  code?: string;
  id: string;
  name: string;
  roleId: string;
  status?: string;
  tenantId?: string;
}

export interface SdkworkIamPermission {
  action?: string;
  code: string;
  id: string;
  name: string;
  permissionId: string;
  resource?: string;
}

export interface SdkworkIamPolicy {
  code?: string;
  id: string;
  name: string;
  policyId: string;
  status?: string;
  tenantId?: string;
}

export interface SdkworkIamRoleBinding {
  effect?: string;
  id: string;
  principalId: string;
  principalKind: string;
  roleId: string;
  scopeId: string;
  scopeKind: string;
  status?: string;
  tenantId?: string;
}

export interface SdkworkAuthorizationHint {
  action?: string;
  mode?: "all" | "any";
  permissionCode?: string;
  permissionCodes?: readonly string[];
  resource?: string;
  roleIds?: readonly string[];
}

export interface SdkworkIamPermissionListPageInfo {
  permissions?: SdkWorkPageInfo;
  policies?: SdkWorkPageInfo;
  roleBindings?: SdkWorkPageInfo;
  rolePermissions?: Readonly<Record<string, SdkWorkPageInfo | undefined>>;
  roles?: SdkWorkPageInfo;
}

export interface SdkworkIamPermissionState {
  lastPrincipalId?: string;
  listPageInfo?: SdkworkIamPermissionListPageInfo;
  permissionScope: readonly string[];
  permissions: readonly SdkworkIamPermission[];
  policies: readonly SdkworkIamPolicy[];
  roleBindings: readonly SdkworkIamRoleBinding[];
  rolePermissions: Readonly<Record<string, readonly SdkworkIamPermission[]>>;
  roles: readonly SdkworkIamRole[];
  standardRoleCodes: readonly string[];
  status: "idle" | "loading" | "ready" | "error";
  userSurface: IamUserSurface;
}

export interface CreateSdkworkIamPermissionControllerInput {
  permissionScope?: readonly string[];
  service: SdkworkIamService;
  standardRoleCodes?: readonly string[];
  userSurface?: IamUserSurface;
}

export interface SdkworkIamPermissionController {
  assignRoleBinding(body: SdkworkIamRoleBindingDraft | Record<string, unknown>): Promise<SdkworkIamRoleBinding>;
  assignRolePermission(roleId: string, permissionId: string): Promise<unknown>;
  can(hint: string | SdkworkAuthorizationHint): boolean;
  canAccessBackend(): boolean;
  createPermission(body: SdkworkIamPermissionDraft): Promise<SdkworkIamPermission>;
  createPolicy(body: SdkworkIamPolicyDraft): Promise<SdkworkIamPolicy>;
  createRole(body: SdkworkIamRoleDraft): Promise<SdkworkIamRole>;
  deletePermission(permissionId: string): Promise<void>;
  deletePolicy(policyId: string): Promise<void>;
  deleteRole(roleId: string): Promise<void>;
  getState(): SdkworkIamPermissionState;
  hasRole(roleCode: SdkworkStandardRoleCode | string): boolean;
  isOrganizationMember(): boolean;
  listPermissions(params?: Record<string, unknown>): Promise<readonly SdkworkIamPermission[]>;
  listPolicies(params?: Record<string, unknown>): Promise<readonly SdkworkIamPolicy[]>;
  listRoleBindings(params?: Record<string, unknown>): Promise<readonly SdkworkIamRoleBinding[]>;
  listRolePermissions(roleId: string, params?: Record<string, unknown>): Promise<readonly SdkworkIamPermission[]>;
  listRoles(params?: Record<string, unknown>): Promise<readonly SdkworkIamRole[]>;
  loadMorePermissions(): Promise<readonly SdkworkIamPermission[]>;
  loadMorePolicies(): Promise<readonly SdkworkIamPolicy[]>;
  loadMoreRoleBindings(): Promise<readonly SdkworkIamRoleBinding[]>;
  loadMoreRolePermissions(roleId: string): Promise<readonly SdkworkIamPermission[]>;
  loadMoreRoles(): Promise<readonly SdkworkIamRole[]>;
  revokeRoleBinding(roleBindingId: string): Promise<unknown>;
  revokeRolePermission(roleId: string, permissionId: string): Promise<unknown>;
  updatePermission(permissionId: string, body: Partial<SdkworkIamPermissionDraft>): Promise<SdkworkIamPermission>;
  updatePolicy(policyId: string, body: Partial<SdkworkIamPolicyDraft>): Promise<SdkworkIamPolicy>;
  updateRole(roleId: string, body: Partial<SdkworkIamRoleDraft>): Promise<SdkworkIamRole>;
}

export interface SdkworkIamPermissionAdminWorkspaceProps {
  controller: SdkworkIamPermissionController;
  description?: string;
  title?: string;
}
