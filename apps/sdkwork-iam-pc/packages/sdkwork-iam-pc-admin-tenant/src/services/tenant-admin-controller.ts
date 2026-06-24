import type { SdkworkIamService } from "@sdkwork/iam-service";

import type {
  CreateSdkworkIamTenantControllerInput,
  SdkworkIamTenant,
  SdkworkIamTenantController,
  SdkworkIamTenantDraft,
  SdkworkIamTenantMember,
  SdkworkIamTenantMemberDraft,
  SdkworkIamTenantState,
} from "../types/tenant-admin-types";

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
    createTenant: async (body) => {
      requireId(body.name, "name");
      setState({ status: "loading" });
      try {
        const tenant = toTenant(await resolved.service.iam.tenants.create(body as unknown as Record<string, unknown>));
        if (!tenant) {
          throw new Error("SDKWork IAM tenant create response is missing tenantId");
        }
        const tenants = [...state.tenants.filter((item) => item.tenantId !== tenant.tenantId), tenant];
        setState({ selectedTenant: tenant, status: "ready", tenants });
        return tenant;
      } catch (error) {
        setState({ status: "error" });
        throw error;
      }
    },
    createTenantMember: async (tenantId, body) => {
      const normalizedTenantId = requireId(tenantId, "tenantId");
      requireId(body.userId, "userId");
      setState({ status: "loading" });
      try {
        const member = toTenantMember(
          await resolved.service.iam.tenants.members.create(normalizedTenantId, body as unknown as Record<string, unknown>),
        );
        if (!member) {
          throw new Error("SDKWork IAM tenant member create response is missing userId");
        }
        const members = [...state.members.filter((item) => item.userId !== member.userId), member];
        setState({ members, status: "ready" });
        return member;
      } catch (error) {
        setState({ status: "error" });
        throw error;
      }
    },
    deleteTenant: async (tenantId) => {
      const normalizedTenantId = requireId(tenantId, "tenantId");
      setState({ status: "loading" });
      try {
        await resolved.service.iam.tenants.delete(normalizedTenantId);
        const tenants = state.tenants.filter((tenant) => tenant.tenantId !== normalizedTenantId);
        const selectedTenant = state.selectedTenant?.tenantId === normalizedTenantId ? undefined : state.selectedTenant;
        setState({ members: selectedTenant ? state.members : [], selectedTenant, status: "ready", tenants });
      } catch (error) {
        setState({ status: "error" });
        throw error;
      }
    },
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
    removeTenantMember: async (tenantId, userId) => {
      const normalizedTenantId = requireId(tenantId, "tenantId");
      const normalizedUserId = requireId(userId, "userId");
      setState({ status: "loading" });
      try {
        await resolved.service.iam.tenants.members.delete(normalizedTenantId, normalizedUserId);
        setState({
          members: state.members.filter((member) => member.userId !== normalizedUserId),
          status: "ready",
        });
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
    updateTenant: async (tenantId, body) => {
      const normalizedTenantId = requireId(tenantId, "tenantId");
      setState({ status: "loading" });
      try {
        const tenant = toTenant(await resolved.service.iam.tenants.update(normalizedTenantId, body))
          ?? toTenant(await resolved.service.iam.tenants.retrieve(normalizedTenantId));
        if (!tenant) {
          throw new Error("SDKWork IAM tenant update response is missing tenantId");
        }
        const tenants = state.tenants.map((item) => (item.tenantId === tenant.tenantId ? tenant : item));
        const selectedTenant = state.selectedTenant?.tenantId === tenant.tenantId ? tenant : state.selectedTenant;
        setState({ selectedTenant, status: "ready", tenants });
        return tenant;
      } catch (error) {
        setState({ status: "error" });
        throw error;
      }
    },
    updateTenantMember: async (tenantId, userId, body) => {
      const normalizedTenantId = requireId(tenantId, "tenantId");
      const normalizedUserId = requireId(userId, "userId");
      setState({ status: "loading" });
      try {
        const member = toTenantMember(
          await resolved.service.iam.tenants.members.update(normalizedTenantId, normalizedUserId, body),
        );
        if (!member) {
          throw new Error("SDKWork IAM tenant member update response is missing userId");
        }
        const members = state.members.map((item) => (item.userId === member.userId ? member : item));
        setState({ members, status: "ready" });
        return member;
      } catch (error) {
        setState({ status: "error" });
        throw error;
      }
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

  const dataRecord = record.data;
  if (dataRecord && typeof dataRecord === "object") {
    return extractList(dataRecord);
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
