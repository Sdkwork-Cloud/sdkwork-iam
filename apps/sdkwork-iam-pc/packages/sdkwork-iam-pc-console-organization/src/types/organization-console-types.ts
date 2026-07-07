import type { SdkWorkPageInfo } from "@sdkwork/iam-contracts";
import type { SdkworkIamService } from "@sdkwork/iam-service";

export interface SdkworkIamConsoleOrganizationRecord {
  id: string;
  name: string;
  organizationId: string;
  status?: string;
}

export interface SdkworkIamConsoleDepartmentRecord {
  departmentId: string;
  id: string;
  name: string;
  organizationId: string;
  parentDepartmentId?: string;
}

export interface SdkworkIamConsoleOrganizationMembership {
  displayName?: string;
  id: string;
  organizationId?: string;
  roleCode?: string;
  userId: string;
}

export interface SdkworkIamConsoleOrganizationListPageInfo {
  departments?: SdkWorkPageInfo;
  memberships?: SdkWorkPageInfo;
  organizations?: SdkWorkPageInfo;
}

export interface SdkworkIamConsoleOrganizationState {
  departments: readonly SdkworkIamConsoleDepartmentRecord[];
  listPageInfo?: SdkworkIamConsoleOrganizationListPageInfo;
  memberships: readonly SdkworkIamConsoleOrganizationMembership[];
  organizations: readonly SdkworkIamConsoleOrganizationRecord[];
  selectedOrganization?: SdkworkIamConsoleOrganizationRecord;
  status: "idle" | "loading" | "ready" | "error";
}

export interface CreateSdkworkIamConsoleOrganizationControllerInput {
  service: SdkworkIamService;
}

export interface SdkworkIamConsoleOrganizationController {
  getState(): SdkworkIamConsoleOrganizationState;
  listDepartments(organizationId: string, params?: Record<string, unknown>): Promise<readonly SdkworkIamConsoleDepartmentRecord[]>;
  listMemberships(params?: Record<string, unknown>): Promise<readonly SdkworkIamConsoleOrganizationMembership[]>;
  listOrganizations(params?: Record<string, unknown>): Promise<readonly SdkworkIamConsoleOrganizationRecord[]>;
  loadMoreDepartments(organizationId: string): Promise<readonly SdkworkIamConsoleDepartmentRecord[]>;
  loadMoreMemberships(): Promise<readonly SdkworkIamConsoleOrganizationMembership[]>;
  loadMoreOrganizations(): Promise<readonly SdkworkIamConsoleOrganizationRecord[]>;
  refreshWorkspace(organizationId?: string, params?: Record<string, unknown>): Promise<{
    departments: readonly SdkworkIamConsoleDepartmentRecord[];
    memberships: readonly SdkworkIamConsoleOrganizationMembership[];
    organizations: readonly SdkworkIamConsoleOrganizationRecord[];
  }>;
  selectOrganization(organizationId: string): Promise<SdkworkIamConsoleOrganizationRecord | undefined>;
}

export interface SdkworkIamConsoleOrganizationWorkspaceProps {
  controller: SdkworkIamConsoleOrganizationController;
  description?: string;
  title?: string;
}

export const IAM_PC_CONSOLE_ORGANIZATION_ROUTES = {
  basePath: "/console/iam/organizations",
  defaultPath: "/console/iam/organizations",
  moduleId: "iam-console-organization",
  permissionPrefix: "iam.organization_console",
} as const;
