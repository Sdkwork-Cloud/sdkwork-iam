import { createSdkWorkPagedListSession, hasPermissionInScope } from "@sdkwork/iam-contracts";
import type { SdkworkIamService } from "@sdkwork/iam-service";

import type {
  CreateSdkworkIamTenantControllerInput,
  SdkworkIamTenant,
  SdkworkIamTenantController,
  SdkworkIamTenantDraft,
  SdkworkIamTenantApplication,
  SdkworkIamTenantApplicationDraft,
  SdkworkIamTenantApplicationSummary,
  SdkworkIamTenantApplicationUpdateDraft,
  SdkworkIamTenantMember,
  SdkworkIamTenantMemberDraft,
  SdkworkIamTenantState,
} from "../types/tenant-admin-types";

export function createSdkworkIamTenantController(
  input: SdkworkIamService | CreateSdkworkIamTenantControllerInput,
): SdkworkIamTenantController {
  const resolved = resolveInput(input);
  let state: SdkworkIamTenantState = {
    applications: [],
    applicationSummary: emptyApplicationSummary(),
    listPageInfo: undefined,
    members: [],
    selectedTenant: undefined,
    status: "idle",
    tenants: [],
  };

  const tenantsSession = createSdkWorkPagedListSession({
    fetchPage: (query) => resolved.service.iam.tenants.list(query),
    mapItem: toTenant,
  });

  let membersSessionTenantId = "";
  let membersSession = createMembersSession("");
  let applicationsSessionTenantId = "";
  let applicationsSession = createApplicationsSession("");

  function createMembersSession(tenantId: string) {
    return createSdkWorkPagedListSession({
      fetchPage: (query) => resolved.service.iam.tenants.members.list(tenantId, query),
      mapItem: toTenantMember,
    });
  }

  function createApplicationsSession(tenantId: string) {
    return createSdkWorkPagedListSession({
      fetchPage: (query) => resolved.service.iam.tenantApplications.list(tenantId, query),
      mapItem: toTenantApplication,
    });
  }

  function syncTenantsListPageInfo() {
    return { tenants: tenantsSession.getPageInfo() };
  }

  function syncMembersListPageInfo() {
    return { members: membersSession.getPageInfo() };
  }

  function syncApplicationsListPageInfo() {
    return { applications: applicationsSession.getPageInfo() };
  }

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
        tenantsSession.setItems(tenants);
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
        membersSession.setItems(members);
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
        tenantsSession.setItems(tenants);
        const selectedTenant = state.selectedTenant?.tenantId === normalizedTenantId ? undefined : state.selectedTenant;
        setState({
          applications: selectedTenant ? state.applications : [],
          applicationSummary: selectedTenant ? state.applicationSummary : emptyApplicationSummary(),
          members: selectedTenant ? state.members : [],
          selectedTenant,
          status: "ready",
          tenants,
        });
      } catch (error) {
        setState({ status: "error" });
        throw error;
      }
    },
    getApplicationCapabilities: () => {
      const permissionScope = resolved.permissionScope;
      const hasPermission = (permission: string) =>
        permissionScope === undefined || hasPermissionInScope(permissionScope, permission);
      return {
        canEnable: hasPermission("iam.tenant_applications.enable"),
        canProvision: hasPermission("iam.tenant_applications.provision"),
        canUpdate: hasPermission("iam.tenant_applications.update"),
      };
    },
    getSelectedTenant: () => state.selectedTenant,
    getState: () => ({
      ...state,
      listPageInfo: state.listPageInfo
        ? {
            applications: state.listPageInfo.applications ? { ...state.listPageInfo.applications } : undefined,
            members: state.listPageInfo.members ? { ...state.listPageInfo.members } : undefined,
            tenants: state.listPageInfo.tenants ? { ...state.listPageInfo.tenants } : undefined,
          }
        : undefined,
      applications: state.applications.map((application) => ({
        ...application,
        accessPermissions: [...application.accessPermissions],
      })),
      applicationSummary: { ...state.applicationSummary },
      members: [...state.members],
      selectedTenant: state.selectedTenant ? { ...state.selectedTenant } : undefined,
      tenants: [...state.tenants],
    }),
    listTenantApplications: async (tenantId, params) => {
      const normalizedTenantId = requireId(tenantId, "tenantId");
      if (applicationsSessionTenantId !== normalizedTenantId) {
        applicationsSessionTenantId = normalizedTenantId;
        applicationsSession = createApplicationsSession(normalizedTenantId);
      }
      setState({ status: "loading" });
      try {
        const applications = await applicationsSession.list(params) as SdkworkIamTenantApplication[];
        setState({
          applications,
          listPageInfo: { ...state.listPageInfo, ...syncApplicationsListPageInfo() },
          status: "ready",
        });
        return applications;
      } catch (error) {
        setState({ status: "error" });
        throw error;
      }
    },
    listTenantMembers: async (tenantId, params) => {
      const normalizedTenantId = requireId(tenantId, "tenantId");
      if (membersSessionTenantId !== normalizedTenantId) {
        membersSessionTenantId = normalizedTenantId;
        membersSession = createMembersSession(normalizedTenantId);
      }
      setState({ status: "loading" });
      try {
        const members = await membersSession.list(params) as SdkworkIamTenantMember[];
        setState({
          listPageInfo: { ...state.listPageInfo, ...syncMembersListPageInfo() },
          members,
          status: "ready",
        });
        return members;
      } catch (error) {
        setState({ status: "error" });
        throw error;
      }
    },
    listTenants: async (params) => {
      setState({ status: "loading" });
      try {
        const tenants = await tenantsSession.list(params) as SdkworkIamTenant[];
        const selectedTenant = state.selectedTenant
          ? tenants.find((tenant) => tenant.tenantId === state.selectedTenant?.tenantId) ?? state.selectedTenant
          : tenants.find((tenant) => tenant.tenantId === resolved.selectedTenantId);
        setState({
          listPageInfo: { ...state.listPageInfo, ...syncTenantsListPageInfo() },
          selectedTenant,
          status: "ready",
          tenants,
        });
        return tenants;
      } catch (error) {
        setState({ status: "error" });
        throw error;
      }
    },
    loadMoreTenantApplications: async (tenantId) => {
      const normalizedTenantId = requireId(tenantId, "tenantId");
      if (applicationsSessionTenantId !== normalizedTenantId) {
        return controller.listTenantApplications(normalizedTenantId);
      }
      setState({ status: "loading" });
      try {
        const applications = await applicationsSession.loadMore() as SdkworkIamTenantApplication[];
        setState({
          applications,
          listPageInfo: { ...state.listPageInfo, ...syncApplicationsListPageInfo() },
          status: "ready",
        });
        return applications;
      } catch (error) {
        setState({ status: "error" });
        throw error;
      }
    },
    loadMoreTenantMembers: async (tenantId) => {
      const normalizedTenantId = requireId(tenantId, "tenantId");
      if (membersSessionTenantId !== normalizedTenantId) {
        return controller.listTenantMembers(normalizedTenantId);
      }
      setState({ status: "loading" });
      try {
        const members = await membersSession.loadMore() as SdkworkIamTenantMember[];
        setState({
          listPageInfo: { ...state.listPageInfo, ...syncMembersListPageInfo() },
          members,
          status: "ready",
        });
        return members;
      } catch (error) {
        setState({ status: "error" });
        throw error;
      }
    },
    loadMoreTenants: async () => {
      setState({ status: "loading" });
      try {
        const tenants = await tenantsSession.loadMore() as SdkworkIamTenant[];
        const selectedTenant = state.selectedTenant
          ? tenants.find((tenant) => tenant.tenantId === state.selectedTenant?.tenantId) ?? state.selectedTenant
          : state.selectedTenant;
        setState({
          listPageInfo: { ...state.listPageInfo, ...syncTenantsListPageInfo() },
          selectedTenant,
          status: "ready",
          tenants,
        });
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
        const members = state.members.filter((member) => member.userId !== normalizedUserId);
        membersSession.setItems(members);
        setState({
          members,
          status: "ready",
        });
      } catch (error) {
        setState({ status: "error" });
        throw error;
      }
    },
    provisionTenantApplication: async (tenantId, body) => {
      const normalizedTenantId = requireId(tenantId, "tenantId");
      validateApplicationDraft(body);
      setState({ status: "loading" });
      try {
        const application = toTenantApplication(
          await resolved.service.iam.tenantApplications.management.provision(
            normalizedTenantId,
            applicationDraftToRecord(body),
          ),
        );
        if (!application) {
          throw new Error("SDKWork IAM tenant application provision response is missing tenantApplicationId");
        }
        const applications = [
          application,
          ...state.applications.filter((item) => item.tenantApplicationId !== application.tenantApplicationId),
        ];
        applicationsSession.setItems(applications);
        setState({ applications, status: "ready" });
        return application;
      } catch (error) {
        setState({ status: "error" });
        throw error;
      }
    },
    retrieveTenantApplicationSummary: async (tenantId) => {
      const normalizedTenantId = requireId(tenantId, "tenantId");
      setState({ status: "loading" });
      try {
        const summary = toTenantApplicationSummary(
          await resolved.service.iam.tenantApplications.summary.retrieve(normalizedTenantId),
        );
        setState({ applicationSummary: summary, status: "ready" });
        return summary;
      } catch (error) {
        setState({ status: "error" });
        throw error;
      }
    },
    setTenantApplicationEnabled: async (tenantId, tenantApplicationId, enabled) => {
      const normalizedTenantId = requireId(tenantId, "tenantId");
      const normalizedApplicationId = requireId(tenantApplicationId, "tenantApplicationId");
      setState({ status: "loading" });
      try {
        const resource = resolved.service.iam.tenantApplications.management;
        const application = toTenantApplication(
          enabled
            ? await resource.enable(normalizedTenantId, normalizedApplicationId)
            : await resource.disable(normalizedTenantId, normalizedApplicationId),
        );
        if (!application) {
          throw new Error("SDKWork IAM tenant application status response is missing tenantApplicationId");
        }
        replaceApplicationInState(application);
        return application;
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
        tenantsSession.setItems(tenants);
        const selectedTenant = state.selectedTenant?.tenantId === tenant.tenantId ? tenant : state.selectedTenant;
        setState({ selectedTenant, status: "ready", tenants });
        return tenant;
      } catch (error) {
        setState({ status: "error" });
        throw error;
      }
    },
    updateTenantApplication: async (tenantId, tenantApplicationId, body) => {
      const normalizedTenantId = requireId(tenantId, "tenantId");
      const normalizedApplicationId = requireId(tenantApplicationId, "tenantApplicationId");
      setState({ status: "loading" });
      try {
        const application = toTenantApplication(
          await resolved.service.iam.tenantApplications.management.update(
            normalizedTenantId,
            normalizedApplicationId,
            applicationUpdateDraftToRecord(body),
          ),
        );
        if (!application) {
          throw new Error("SDKWork IAM tenant application update response is missing tenantApplicationId");
        }
        replaceApplicationInState(application);
        return application;
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
        membersSession.setItems(members);
        setState({ members, status: "ready" });
        return member;
      } catch (error) {
        setState({ status: "error" });
        throw error;
      }
    },
  };

  function replaceApplicationInState(application: SdkworkIamTenantApplication) {
    const applications = state.applications.map((item) =>
      item.tenantApplicationId === application.tenantApplicationId ? application : item,
    );
    applicationsSession.setItems(applications);
    setState({ applications, status: "ready" });
  }

  return controller;
}

function emptyApplicationSummary(): SdkworkIamTenantApplicationSummary {
  return { disabled: 0, enabled: 0, pending: 0, total: 0 };
}

function applicationDraftToRecord(body: SdkworkIamTenantApplicationDraft): Record<string, unknown> {
  return {
    accessPermissions: body.accessPermissions,
    appKey: body.appKey.trim(),
    displayName: body.displayName.trim(),
    environment: body.environment.trim(),
    instanceKey: body.instanceKey.trim(),
    organizationId: body.organizationId.trim(),
    primaryDomain: body.primaryDomain.trim(),
  };
}

function applicationUpdateDraftToRecord(body: SdkworkIamTenantApplicationUpdateDraft): Record<string, unknown> {
  return {
    accessPermissions: body.accessPermissions,
    primaryDomain: body.primaryDomain.trim(),
  };
}

function validateApplicationDraft(body: SdkworkIamTenantApplicationDraft) {
  requireId(body.appKey, "appKey");
  requireId(body.displayName, "displayName");
  requireId(body.environment, "environment");
  requireId(body.instanceKey, "instanceKey");
  requireId(body.organizationId, "organizationId");
}

function resolveInput(
  input: SdkworkIamService | CreateSdkworkIamTenantControllerInput,
): CreateSdkworkIamTenantControllerInput {
  if ("service" in input) {
    return input;
  }

  return { service: input };
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

function toTenantApplication(value: unknown): SdkworkIamTenantApplication | undefined {
  const record = toRecord(value);
  const tenantApplicationId = optionalString(record.tenantApplicationId)
    || optionalString(record.tenant_application_id)
    || optionalString(record.id);
  const appId = optionalString(record.appId) || optionalString(record.app_id);
  const tenantId = optionalString(record.tenantId) || optionalString(record.tenant_id);
  if (!tenantApplicationId || !appId || !tenantId) {
    return undefined;
  }

  return {
    accessPermissions: toStringArray(record.accessPermissions ?? record.access_permissions),
    appId,
    createdAt: optionalString(record.createdAt) || optionalString(record.created_at),
    displayName: optionalString(record.displayName) || optionalString(record.display_name) || appId,
    environment: optionalString(record.environment) || "unknown",
    instanceKey: optionalString(record.instanceKey) || optionalString(record.instance_key) || appId,
    organizationId: optionalString(record.organizationId) || optionalString(record.organization_id) || "0",
    primaryDomain: optionalString(record.primaryDomain) || optionalString(record.primary_domain),
    status: optionalString(record.status) || "pending_config",
    templateId: optionalString(record.templateId) || optionalString(record.template_id) || "",
    templateVersion: optionalString(record.templateVersion) || optionalString(record.template_version),
    tenantApplicationId,
    tenantId,
    updatedAt: optionalString(record.updatedAt) || optionalString(record.updated_at),
  };
}

function toTenantApplicationSummary(value: unknown): SdkworkIamTenantApplicationSummary {
  const record = toRecord(value);
  return {
    disabled: toNonNegativeNumber(record.disabled),
    enabled: toNonNegativeNumber(record.enabled),
    pending: toNonNegativeNumber(record.pending),
    total: toNonNegativeNumber(record.total),
  };
}

function toNonNegativeNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.map(optionalString).filter((item): item is string => Boolean(item));
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
