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

export interface SdkworkIamTenantState {
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
  getSelectedTenant(): SdkworkIamTenant | undefined;
  getState(): SdkworkIamTenantState;
  listTenantMembers(tenantId: string, params?: Record<string, unknown>): Promise<readonly SdkworkIamTenantMember[]>;
  listTenants(params?: Record<string, unknown>): Promise<readonly SdkworkIamTenant[]>;
  selectTenant(tenantId: string, params?: Record<string, unknown>): Promise<SdkworkIamTenant | undefined>;
}

export function createSdkworkIamTenantController(
  input: SdkworkIamService | CreateSdkworkIamTenantControllerInput,
): SdkworkIamTenantController {
  const resolved = resolveInput(input);
  let state: SdkworkIamTenantState = {
    members: [],
    selectedTenant: undefined,
    status: "idle",
    tenants: [],
  };

  const setState = (patch: Partial<SdkworkIamTenantState>) => {
    state = {
      ...state,
      ...patch,
    };
  };

  const controller: SdkworkIamTenantController = {
    getSelectedTenant: () => state.selectedTenant,
    getState: () => ({
      ...state,
      members: [...state.members],
      selectedTenant: state.selectedTenant ? { ...state.selectedTenant } : undefined,
      tenants: [...state.tenants],
    }),
    listTenantMembers: async (tenantId, params) => {
      const normalizedTenantId = requireId(tenantId, "tenantId");
      setState({ status: "loading" });
      try {
        const members = extractList(await resolved.service.iam.tenants.members.list(normalizedTenantId, params))
          .map(toTenantMember)
          .filter(Boolean) as SdkworkIamTenantMember[];
        setState({ members, status: "ready" });
        return members;
      } catch (error) {
        setState({ status: "error" });
        throw error;
      }
    },
    listTenants: async (params) => {
      setState({ status: "loading" });
      try {
        const tenants = extractList(await resolved.service.iam.tenants.list(params))
          .map(toTenant)
          .filter(Boolean) as SdkworkIamTenant[];
        const selectedTenant = state.selectedTenant
          ? tenants.find((tenant) => tenant.tenantId === state.selectedTenant?.tenantId) ?? state.selectedTenant
          : tenants.find((tenant) => tenant.tenantId === resolved.selectedTenantId);
        setState({ selectedTenant, status: "ready", tenants });
        return tenants;
      } catch (error) {
        setState({ status: "error" });
        throw error;
      }
    },
    selectTenant: async (tenantId, params) => {
      const normalizedTenantId = requireId(tenantId, "tenantId");
      const tenants = state.tenants.length > 0 ? state.tenants : await controller.listTenants(params);
      const selectedTenant = tenants.find((tenant) => tenant.tenantId === normalizedTenantId || tenant.id === normalizedTenantId);
      setState({ selectedTenant });
      return selectedTenant;
    },
  };

  return controller;
}

function resolveInput(
  input: SdkworkIamService | CreateSdkworkIamTenantControllerInput,
): CreateSdkworkIamTenantControllerInput {
  if ("service" in input) {
    return input;
  }

  return { service: input };
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

function toTenant(value: unknown): SdkworkIamTenant | undefined {
  const record = toRecord(value);
  const tenantId = optionalString(record.tenantId) || optionalString(record.tenant_id) || optionalString(record.id);
  if (!tenantId) {
    return undefined;
  }

  return {
    code: optionalString(record.code),
    id: optionalString(record.id) || tenantId,
    name: optionalString(record.name) || optionalString(record.tenantName) || tenantId,
    status: optionalString(record.status),
    tenantId,
  };
}

function toTenantMember(value: unknown): SdkworkIamTenantMember | undefined {
  const record = toRecord(value);
  const userId = optionalString(record.userId) || optionalString(record.user_id) || optionalString(record.id);
  if (!userId) {
    return undefined;
  }

  return {
    displayName: optionalString(record.displayName) || optionalString(record.name) || optionalString(record.nickname),
    email: optionalString(record.email),
    id: optionalString(record.id) || userId,
    roleCode: optionalString(record.roleCode) || optionalString(record.role_code),
    status: optionalString(record.status),
    tenantId: optionalString(record.tenantId) || optionalString(record.tenant_id),
    userId,
    username: optionalString(record.username),
  };
}

function toRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? value as Record<string, unknown> : {};
}

function optionalString(value: unknown): string | undefined {
  const normalized = typeof value === "string" ? value.trim() : value === undefined || value === null ? "" : String(value).trim();
  return normalized || undefined;
}

function requireId(value: unknown, name: string): string {
  const normalized = optionalString(value);
  if (!normalized) {
    throw new Error(`SDKWork IAM tenant controller requires ${name}`);
  }

  return normalized;
}
