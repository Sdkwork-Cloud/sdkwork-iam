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

export interface SdkworkIamTenantApplication {
  accessPermissions: readonly string[];
  appId: string;
  createdAt?: string;
  displayName: string;
  environment: string;
  instanceKey: string;
  organizationId: string;
  primaryDomain?: string;
  status: string;
  templateId: string;
  templateVersion?: string;
  tenantApplicationId: string;
  tenantId: string;
  updatedAt?: string;
}

export interface SdkworkIamTenantApplicationDraft {
  accessPermissions: string[];
  appKey: string;
  displayName: string;
  environment: string;
  instanceKey: string;
  organizationId: string;
  primaryDomain: string;
}

export interface SdkworkIamTenantApplicationUpdateDraft {
  accessPermissions: string[];
  primaryDomain: string;
}

export interface SdkworkIamTenantApplicationSummary {
  disabled: number;
  enabled: number;
  pending: number;
  total: number;
}

export interface SdkworkIamTenantApplicationCapabilities {
  canEnable: boolean;
  canProvision: boolean;
  canUpdate: boolean;
}

export interface SdkworkIamTenantState {
  listPageInfo?: {
    applications?: SdkWorkPageInfo;
    members?: SdkWorkPageInfo;
    tenants?: SdkWorkPageInfo;
  };
  applications: readonly SdkworkIamTenantApplication[];
  applicationSummary: SdkworkIamTenantApplicationSummary;
  members: readonly SdkworkIamTenantMember[];
  selectedTenant?: SdkworkIamTenant;
  status: "idle" | "loading" | "ready" | "error";
  tenants: readonly SdkworkIamTenant[];
}

export interface CreateSdkworkIamTenantControllerInput {
  permissionScope?: readonly string[];
  selectedTenantId?: string;
  service: SdkworkIamService;
}

export interface SdkworkIamTenantController {
  createTenant(body: SdkworkIamTenantDraft): Promise<SdkworkIamTenant>;
  createTenantMember(tenantId: string, body: SdkworkIamTenantMemberDraft): Promise<SdkworkIamTenantMember>;
  deleteTenant(tenantId: string): Promise<void>;
  getApplicationCapabilities(): SdkworkIamTenantApplicationCapabilities;
  getSelectedTenant(): SdkworkIamTenant | undefined;
  getState(): SdkworkIamTenantState;
  listTenantMembers(tenantId: string, params?: Record<string, unknown>): Promise<readonly SdkworkIamTenantMember[]>;
  listTenantApplications(tenantId: string, params?: Record<string, unknown>): Promise<readonly SdkworkIamTenantApplication[]>;
  loadMoreTenantApplications(tenantId: string): Promise<readonly SdkworkIamTenantApplication[]>;
  listTenants(params?: Record<string, unknown>): Promise<readonly SdkworkIamTenant[]>;
  loadMoreTenantMembers(tenantId: string): Promise<readonly SdkworkIamTenantMember[]>;
  loadMoreTenants(): Promise<readonly SdkworkIamTenant[]>;
  removeTenantMember(tenantId: string, userId: string): Promise<void>;
  provisionTenantApplication(tenantId: string, body: SdkworkIamTenantApplicationDraft): Promise<SdkworkIamTenantApplication>;
  retrieveTenantApplicationSummary(tenantId: string): Promise<SdkworkIamTenantApplicationSummary>;
  setTenantApplicationEnabled(tenantId: string, tenantApplicationId: string, enabled: boolean): Promise<SdkworkIamTenantApplication>;
  selectTenant(tenantId: string, params?: Record<string, unknown>): Promise<SdkworkIamTenant | undefined>;
  updateTenant(tenantId: string, body: Partial<SdkworkIamTenantDraft>): Promise<SdkworkIamTenant>;
  updateTenantApplication(tenantId: string, tenantApplicationId: string, body: SdkworkIamTenantApplicationUpdateDraft): Promise<SdkworkIamTenantApplication>;
  updateTenantMember(
    tenantId: string,
    userId: string,
    body: Partial<SdkworkIamTenantMemberDraft>,
  ): Promise<SdkworkIamTenantMember>;
}

export interface SdkworkIamTenantAdminWorkspaceProps {
  controller: SdkworkIamTenantController;
  description?: string;
  permissions?: {
    members: {
      create: boolean;
      delete: boolean;
      read: boolean;
      update: boolean;
    };
    tenants: {
      create: boolean;
      delete: boolean;
      update: boolean;
    };
  };
  title?: string;
}
