import type { SdkWorkPageInfo } from "@sdkwork/iam-contracts";
import type { SdkworkIamService } from "@sdkwork/iam-service";

export interface SdkworkIamConsoleRuntimeContext {
  deploymentMode?: string;
  environment?: string;
  tenantId?: string;
  userId?: string;
}

export interface SdkworkIamConsoleOrganization {
  id: string;
  name: string;
  organizationId: string;
  status?: string;
}

export interface SdkworkIamConsoleMembership {
  displayName?: string;
  id: string;
  organizationId?: string;
  roleCode?: string;
  userId: string;
}

export interface SdkworkIamConsoleTenantState {
  listPageInfo?: {
    memberships?: SdkWorkPageInfo;
    organizations?: SdkWorkPageInfo;
  };
  memberships: readonly SdkworkIamConsoleMembership[];
  organizations: readonly SdkworkIamConsoleOrganization[];
  runtime?: SdkworkIamConsoleRuntimeContext;
  status: "idle" | "loading" | "ready" | "error";
}

export interface CreateSdkworkIamConsoleTenantControllerInput {
  service: SdkworkIamService;
}

export interface SdkworkIamConsoleTenantController {
  getState(): SdkworkIamConsoleTenantState;
  listMemberships(params?: Record<string, unknown>): Promise<readonly SdkworkIamConsoleMembership[]>;
  listOrganizations(params?: Record<string, unknown>): Promise<readonly SdkworkIamConsoleOrganization[]>;
  loadMoreMemberships(): Promise<readonly SdkworkIamConsoleMembership[]>;
  loadMoreOrganizations(): Promise<readonly SdkworkIamConsoleOrganization[]>;
  loadRuntimeContext(): Promise<SdkworkIamConsoleRuntimeContext>;
  refreshWorkspace(params?: Record<string, unknown>): Promise<{
    memberships: readonly SdkworkIamConsoleMembership[];
    organizations: readonly SdkworkIamConsoleOrganization[];
    runtime: SdkworkIamConsoleRuntimeContext;
  }>;
}

export interface SdkworkIamConsoleTenantWorkspaceProps {
  controller: SdkworkIamConsoleTenantController;
  description?: string;
  title?: string;
}

export const IAM_PC_CONSOLE_TENANT_ROUTES = {
  basePath: "/console/iam/tenant",
  defaultPath: "/console/iam/tenant",
  moduleId: "iam-console-tenant",
  permissionPrefix: "iam.tenant_console",
} as const;
