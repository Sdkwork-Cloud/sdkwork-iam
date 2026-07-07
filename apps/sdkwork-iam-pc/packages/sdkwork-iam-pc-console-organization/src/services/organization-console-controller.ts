import { createSdkWorkPagedListSession } from "@sdkwork/iam-contracts";
import type { SdkworkIamService } from "@sdkwork/iam-service";

import type {
  CreateSdkworkIamConsoleOrganizationControllerInput,
  SdkworkIamConsoleDepartmentRecord,
  SdkworkIamConsoleOrganizationController,
  SdkworkIamConsoleOrganizationMembership,
  SdkworkIamConsoleOrganizationRecord,
  SdkworkIamConsoleOrganizationState,
} from "../types/organization-console-types";

export function createSdkworkIamConsoleOrganizationController(
  input: SdkworkIamService | CreateSdkworkIamConsoleOrganizationControllerInput,
): SdkworkIamConsoleOrganizationController {
  const service = "service" in input ? input.service : input;
  let state: SdkworkIamConsoleOrganizationState = {
    departments: [],
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
  const departmentsSession = createSdkWorkPagedListSession({
    fetchPage: (query) => service.iam.departments.list(query),
    mapItem: toDepartment,
  });

  const setState = (patch: Partial<SdkworkIamConsoleOrganizationState>) => {
    state = { ...state, ...patch };
  };

  const controller: SdkworkIamConsoleOrganizationController = {
    getState: () => ({
      ...state,
      departments: [...state.departments],
      listPageInfo: state.listPageInfo
        ? {
            departments: state.listPageInfo.departments
              ? { ...state.listPageInfo.departments }
              : undefined,
            memberships: state.listPageInfo.memberships
              ? { ...state.listPageInfo.memberships }
              : undefined,
            organizations: state.listPageInfo.organizations
              ? { ...state.listPageInfo.organizations }
              : undefined,
          }
        : undefined,
      memberships: [...state.memberships],
      organizations: [...state.organizations],
      selectedOrganization: state.selectedOrganization
        ? { ...state.selectedOrganization }
        : undefined,
    }),
    listDepartments: async (organizationId, params) => {
      const normalizedOrganizationId = requireId(organizationId, "organizationId");
      setState({ status: "loading" });
      try {
        const departments = (await departmentsSession.list({
          ...params,
          organizationId: normalizedOrganizationId,
        })) as SdkworkIamConsoleDepartmentRecord[];
        setState({
          departments,
          listPageInfo: {
            ...state.listPageInfo,
            departments: departmentsSession.getPageInfo(),
          },
          status: "ready",
        });
        return departments;
      } catch (error) {
        setState({ status: "error" });
        throw error;
      }
    },
    listMemberships: async (params) => {
      setState({ status: "loading" });
      try {
        const memberships = (await membershipsSession.list(params)) as SdkworkIamConsoleOrganizationMembership[];
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
        const organizations = (await organizationsSession.list(params)) as SdkworkIamConsoleOrganizationRecord[];
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
    loadMoreDepartments: async (organizationId) => {
      const normalizedOrganizationId = requireId(organizationId, "organizationId");
      setState({ status: "loading" });
      try {
        const departments = (await departmentsSession.loadMore({
          organizationId: normalizedOrganizationId,
        })) as SdkworkIamConsoleDepartmentRecord[];
        setState({
          departments,
          listPageInfo: {
            ...state.listPageInfo,
            departments: departmentsSession.getPageInfo(),
          },
          status: "ready",
        });
        return departments;
      } catch (error) {
        setState({ status: "error" });
        throw error;
      }
    },
    loadMoreMemberships: async () => {
      setState({ status: "loading" });
      try {
        const memberships = (await membershipsSession.loadMore()) as SdkworkIamConsoleOrganizationMembership[];
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
        const organizations = (await organizationsSession.loadMore()) as SdkworkIamConsoleOrganizationRecord[];
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
    refreshWorkspace: async (organizationId, params) => {
      const organizations = await controller.listOrganizations(params);
      const selectedOrganizationId = organizationId || organizations[0]?.organizationId;
      if (selectedOrganizationId) {
        await controller.selectOrganization(selectedOrganizationId);
      }
      const memberships = await controller.listMemberships(
        selectedOrganizationId
          ? { ...params, organizationId: selectedOrganizationId }
          : params,
      );
      const departments = selectedOrganizationId
        ? await controller.listDepartments(selectedOrganizationId, params)
        : [];
      return { departments, memberships, organizations };
    },
    selectOrganization: async (organizationId) => {
      const normalizedOrganizationId = requireId(organizationId, "organizationId");
      const organizations =
        state.organizations.length > 0
          ? state.organizations
          : await controller.listOrganizations();
      const selectedOrganization = organizations.find(
        (organization) => organization.organizationId === normalizedOrganizationId,
      );
      setState({ selectedOrganization });
      if (selectedOrganization) {
        await controller.listDepartments(normalizedOrganizationId);
        await controller.listMemberships({ organizationId: normalizedOrganizationId });
      }
      return selectedOrganization;
    },
  };

  return controller;
}

function requireId(value: string, field: string): string {
  const normalized = value.trim();
  if (!normalized) {
    throw new Error(`${field} is required`);
  }
  return normalized;
}

function toOrganization(record: unknown): SdkworkIamConsoleOrganizationRecord | undefined {
  if (!record || typeof record !== "object") {
    return undefined;
  }
  const item = record as Record<string, unknown>;
  const organizationId = readString(item.organizationId ?? item.id);
  const name = readString(item.name);
  if (!organizationId || !name) {
    return undefined;
  }
  return {
    id: organizationId,
    name,
    organizationId,
    status: readString(item.status),
  };
}

function toDepartment(record: unknown): SdkworkIamConsoleDepartmentRecord | undefined {
  if (!record || typeof record !== "object") {
    return undefined;
  }
  const item = record as Record<string, unknown>;
  const departmentId = readString(item.departmentId ?? item.id);
  const organizationId = readString(item.organizationId ?? item.organization_id);
  const name = readString(item.name);
  if (!departmentId || !organizationId || !name) {
    return undefined;
  }
  return {
    departmentId,
    id: departmentId,
    name,
    organizationId,
    parentDepartmentId: readString(item.parentDepartmentId ?? item.parent_department_id),
  };
}

function toMembership(record: unknown): SdkworkIamConsoleOrganizationMembership | undefined {
  if (!record || typeof record !== "object") {
    return undefined;
  }
  const item = record as Record<string, unknown>;
  const userId = readString(item.userId ?? item.user_id);
  const id = readString(item.id) ?? userId;
  if (!userId || !id) {
    return undefined;
  }
  return {
    displayName: readString(item.displayName ?? item.display_name),
    id,
    organizationId: readString(item.organizationId ?? item.organization_id),
    roleCode: readString(item.roleCode ?? item.role_code),
    userId,
  };
}

function readString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}
