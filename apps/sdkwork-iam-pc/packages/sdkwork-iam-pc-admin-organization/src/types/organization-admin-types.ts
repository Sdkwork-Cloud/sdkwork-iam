import type { SdkworkIamService } from "@sdkwork/iam-service";

export interface SdkworkIamOrganizationDraft {
  code?: string;
  name: string;
  parentId?: string;
  status?: string;
  tenantId?: string;
}

export interface SdkworkIamDepartmentDraft {
  code?: string;
  name: string;
  organizationId: string;
  parentDepartmentId?: string;
  status?: string;
}

export interface SdkworkIamOrganizationMembershipDraft {
  membershipKind?: string;
  roleCode?: string;
  status?: string;
  userId: string;
}

export interface SdkworkIamOrganization {
  code?: string;
  id: string;
  name: string;
  organizationId: string;
  parentId?: string;
  path?: string;
  status?: string;
  tenantId?: string;
}

export interface SdkworkIamOrganizationMembership {
  displayName?: string;
  email?: string;
  id: string;
  membershipId?: string;
  membershipKind?: string;
  organizationId?: string;
  roleCode?: string;
  status?: string;
  userId: string;
  username?: string;
}

export interface SdkworkIamDepartment {
  code?: string;
  departmentId: string;
  id: string;
  name: string;
  organizationId: string;
  parentDepartmentId?: string;
  path?: string;
  status?: string;
  tenantId?: string;
}

export interface SdkworkIamDepartmentNode extends SdkworkIamDepartment {
  children: SdkworkIamDepartmentNode[];
  depth: number;
}

export interface SdkworkIamDepartmentAssignment {
  assignmentId: string;
  departmentId: string;
  displayName?: string;
  id: string;
  organizationId?: string;
  organizationMembershipId?: string;
  positionName?: string;
  status?: string;
  userId: string;
}

export interface SdkworkIamPosition {
  departmentId?: string;
  id: string;
  name: string;
  organizationId?: string;
  positionId: string;
  status?: string;
}

export interface SdkworkIamRoleBinding {
  id: string;
  principalId?: string;
  principalKind?: string;
  roleBindingId?: string;
  roleId?: string;
  scopeId?: string;
  scopeKind?: string;
  status?: string;
}

export interface SdkworkIamOrganizationNode extends SdkworkIamOrganization {
  children: SdkworkIamOrganizationNode[];
  depth: number;
}

export interface SdkworkIamOrganizationState {
  departmentAssignments: readonly SdkworkIamDepartmentAssignment[];
  departments: readonly SdkworkIamDepartment[];
  departmentTree: readonly SdkworkIamDepartmentNode[];
  memberships: readonly SdkworkIamOrganizationMembership[];
  organizations: readonly SdkworkIamOrganization[];
  positions: readonly SdkworkIamPosition[];
  roleBindings: readonly SdkworkIamRoleBinding[];
  selectedOrganization?: SdkworkIamOrganization;
  status: "idle" | "loading" | "ready" | "error";
  tree: readonly SdkworkIamOrganizationNode[];
}

export interface CreateSdkworkIamOrganizationControllerInput {
  selectedOrganizationId?: string;
  service: SdkworkIamService;
}

export interface SdkworkIamOrganizationController {
  addMembership(organizationId: string, body: SdkworkIamOrganizationMembershipDraft | Record<string, unknown>): Promise<SdkworkIamOrganizationMembership>;
  buildDepartmentTree(departments?: readonly SdkworkIamDepartment[]): readonly SdkworkIamDepartmentNode[];
  buildOrganizationTree(organizations?: readonly SdkworkIamOrganization[]): readonly SdkworkIamOrganizationNode[];
  createDepartment(body: SdkworkIamDepartmentDraft): Promise<SdkworkIamDepartment>;
  createOrganization(body: SdkworkIamOrganizationDraft): Promise<SdkworkIamOrganization>;
  deleteDepartment(departmentId: string): Promise<void>;
  deleteOrganization(organizationId: string): Promise<void>;
  getState(): SdkworkIamOrganizationState;
  listDepartmentAssignments(departmentId: string, params?: Record<string, unknown>): Promise<readonly SdkworkIamDepartmentAssignment[]>;
  listDepartments(organizationId: string, params?: Record<string, unknown>): Promise<readonly SdkworkIamDepartment[]>;
  listMemberships(organizationId: string, params?: Record<string, unknown>): Promise<readonly SdkworkIamOrganizationMembership[]>;
  listOrganizations(params?: Record<string, unknown>): Promise<readonly SdkworkIamOrganization[]>;
  listPositions(params?: Record<string, unknown>): Promise<readonly SdkworkIamPosition[]>;
  listRoleBindings(params?: Record<string, unknown>): Promise<readonly SdkworkIamRoleBinding[]>;
  selectOrganization(organizationId: string, params?: Record<string, unknown>): Promise<SdkworkIamOrganization | undefined>;
  updateDepartment(departmentId: string, body: Partial<SdkworkIamDepartmentDraft>): Promise<SdkworkIamDepartment>;
  updateMembership(membershipId: string, body: Partial<SdkworkIamOrganizationMembershipDraft>): Promise<SdkworkIamOrganizationMembership>;
  updateOrganization(organizationId: string, body: Partial<SdkworkIamOrganizationDraft>): Promise<SdkworkIamOrganization>;
}

export interface SdkworkIamOrganizationAdminWorkspaceProps {
  controller: SdkworkIamOrganizationController;
  description?: string;
  title?: string;
}
