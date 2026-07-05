import type { SdkWorkPageInfo } from "@sdkwork/iam-contracts";
import type { SdkworkIamService } from "@sdkwork/iam-service";

export interface SdkworkIamTenant {
  code?: string;
  id: string;
  name: string;
  status?: string;
  tenantId: string;
}

export interface SdkworkIamTenantMember {
  displayName?: string;
  email?: string;
  id: string;
  roleCode?: string;
  status?: string;
  tenantId?: string;
  userId: string;
  username?: string;
}

export interface SdkworkIamTenantDraft {
  code?: string;
  name: string;
  status?: string;
}

export interface SdkworkIamTenantMemberDraft {
  roleCode?: string;
  userId: string;
}

export interface SdkworkIamTenantState {
  listPageInfo?: {
    members?: SdkWorkPageInfo;
    tenants?: SdkWorkPageInfo;
  };
  members: readonly SdkworkIamTenantMember[];
  selectedTenant?: SdkworkIamTenant;
  status: "idle" | "loading" | "ready" | "error";
  tenants: readonly SdkworkIamTenant[];
}

export interface CreateSdkworkIamTenantControllerInput {
  selectedTenantId?: string;
  service: SdkworkIamService;
}

export interface SdkworkIamTenantController {
  createTenant(body: SdkworkIamTenantDraft): Promise<SdkworkIamTenant>;
  createTenantMember(tenantId: string, body: SdkworkIamTenantMemberDraft): Promise<SdkworkIamTenantMember>;
  deleteTenant(tenantId: string): Promise<void>;
  getSelectedTenant(): SdkworkIamTenant | undefined;
  getState(): SdkworkIamTenantState;
  listTenantMembers(tenantId: string, params?: Record<string, unknown>): Promise<readonly SdkworkIamTenantMember[]>;
  listTenants(params?: Record<string, unknown>): Promise<readonly SdkworkIamTenant[]>;
  loadMoreTenantMembers(tenantId: string): Promise<readonly SdkworkIamTenantMember[]>;
  loadMoreTenants(): Promise<readonly SdkworkIamTenant[]>;
  removeTenantMember(tenantId: string, userId: string): Promise<void>;
  selectTenant(tenantId: string, params?: Record<string, unknown>): Promise<SdkworkIamTenant | undefined>;
  updateTenant(tenantId: string, body: Partial<SdkworkIamTenantDraft>): Promise<SdkworkIamTenant>;
  updateTenantMember(
    tenantId: string,
    userId: string,
    body: Partial<SdkworkIamTenantMemberDraft>,
  ): Promise<SdkworkIamTenantMember>;
}

export interface SdkworkIamTenantAdminWorkspaceProps {
  controller: SdkworkIamTenantController;
  description?: string;
  title?: string;
}
