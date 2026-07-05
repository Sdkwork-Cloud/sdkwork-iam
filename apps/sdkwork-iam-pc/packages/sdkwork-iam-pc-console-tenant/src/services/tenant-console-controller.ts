import { createSdkWorkPagedListSession } from "@sdkwork/iam-contracts";
import type { SdkworkIamService } from "@sdkwork/iam-service";

import type {
  CreateSdkworkIamConsoleTenantControllerInput,
  SdkworkIamConsoleMembership,
  SdkworkIamConsoleOrganization,
  SdkworkIamConsoleRuntimeContext,
  SdkworkIamConsoleTenantController,
  SdkworkIamConsoleTenantState,
} from "../types/tenant-console-types";

export function createSdkworkIamConsoleTenantController(
  input: SdkworkIamService | CreateSdkworkIamConsoleTenantControllerInput,
): SdkworkIamConsoleTenantController {
  const service = "service" in input ? input.service : input;
  let state: SdkworkIamConsoleTenantState = {
    listPageInfo: undefined,
    memberships: [],
    organizations: [],
    status: "idle",
  };

  const organizationsSession = createSdkWorkPagedListSession({
    fetchPage: (query) => service.iam.organizations.list(query),
    mapItem: toOrganization,
  });
  const membershipsSession = createSdkWorkPagedListSession({
    fetchPage: (query) => service.iam.organizationMemberships.list(query),
    mapItem: toMembership,
  });

  const setState = (patch: Partial<SdkworkIamConsoleTenantState>) => {
    state = { ...state, ...patch };
  };

  const controller: SdkworkIamConsoleTenantController = {
    getState: () => ({
      ...state,
      listPageInfo: state.listPageInfo
        ? {
            memberships: state.listPageInfo.memberships ? { ...state.listPageInfo.memberships } : undefined,
            organizations: state.listPageInfo.organizations ? { ...state.listPageInfo.organizations } : undefined,
          }
        : undefined,
      memberships: [...state.memberships],
      organizations: [...state.organizations],
      runtime: state.runtime ? { ...state.runtime } : undefined,
    }),
    listMemberships: async (params) => {
      setState({ status: "loading" });
      try {
        const memberships = await membershipsSession.list(params) as SdkworkIamConsoleMembership[];
        setState({
          listPageInfo: {
            ...state.listPageInfo,
            memberships: membershipsSession.getPageInfo(),
          },
          memberships,
          status: "ready",
        });
        return memberships;
      } catch (error) {
        setState({ status: "error" });
        throw error;
      }
    },
    listOrganizations: async (params) => {
      setState({ status: "loading" });
      try {
        const organizations = await organizationsSession.list(params) as SdkworkIamConsoleOrganization[];
        setState({
          listPageInfo: {
            ...state.listPageInfo,
            organizations: organizationsSession.getPageInfo(),
          },
          organizations,
          status: "ready",
        });
        return organizations;
      } catch (error) {
        setState({ status: "error" });
        throw error;
      }
    },
    loadMoreMemberships: async () => {
      setState({ status: "loading" });
      try {
        const memberships = await membershipsSession.loadMore() as SdkworkIamConsoleMembership[];
        setState({
          listPageInfo: {
            ...state.listPageInfo,
            memberships: membershipsSession.getPageInfo(),
          },
          memberships,
          status: "ready",
        });
        return memberships;
      } catch (error) {
        setState({ status: "error" });
        throw error;
      }
    },
    loadMoreOrganizations: async () => {
      setState({ status: "loading" });
      try {
        const organizations = await organizationsSession.loadMore() as SdkworkIamConsoleOrganization[];
        setState({
          listPageInfo: {
            ...state.listPageInfo,
            organizations: organizationsSession.getPageInfo(),
          },
          organizations,
          status: "ready",
        });
        return organizations;
      } catch (error) {
        setState({ status: "error" });
        throw error;
      }
    },
    loadRuntimeContext: async () => {
      setState({ status: "loading" });
      try {
        const runtime = toRuntime(await service.system.iam.runtime.retrieve());
        setState({ runtime, status: "ready" });
        return runtime;
      } catch (error) {
        setState({ status: "error" });
        throw error;
      }
    },
    refreshWorkspace: async (params) => {
      const [runtime, organizations, memberships] = await Promise.all([
        controller.loadRuntimeContext(),
        controller.listOrganizations(params),
        controller.listMemberships(params),
      ]);
      return { memberships, organizations, runtime };
    },
  };

  return controller;
}

function toRuntime(value: unknown): SdkworkIamConsoleRuntimeContext {
  const record = toRecord(value);
  return {
    deploymentMode: optionalString(record.deploymentMode) || optionalString(record.deployment_mode),
    environment: optionalString(record.environment),
    tenantId: optionalString(record.tenantId) || optionalString(record.tenant_id),
    userId: optionalString(record.userId) || optionalString(record.user_id),
  };
}

function toOrganization(value: unknown): SdkworkIamConsoleOrganization | undefined {
  const record = toRecord(value);
  const organizationId = optionalString(record.organizationId) || optionalString(record.organization_id) || optionalString(record.id);
  if (!organizationId) {
    return undefined;
  }
  return {
    id: optionalString(record.id) || organizationId,
    name: optionalString(record.name) || optionalString(record.organizationName) || organizationId,
    organizationId,
    status: optionalString(record.status),
  };
}

function toMembership(value: unknown): SdkworkIamConsoleMembership | undefined {
  const record = toRecord(value);
  const userId = optionalString(record.userId) || optionalString(record.user_id) || optionalString(record.id);
  if (!userId) {
    return undefined;
  }
  return {
    displayName: optionalString(record.displayName) || optionalString(record.name),
    id: optionalString(record.id) || optionalString(record.membershipId) || userId,
    organizationId: optionalString(record.organizationId) || optionalString(record.organization_id),
    roleCode: optionalString(record.roleCode) || optionalString(record.role_code),
    userId,
  };
}

function toRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? value as Record<string, unknown> : {};
}

function optionalString(value: unknown): string | undefined {
  const normalized = typeof value === "string" ? value.trim() : value === undefined || value === null ? "" : String(value).trim();
  return normalized || undefined;
}
