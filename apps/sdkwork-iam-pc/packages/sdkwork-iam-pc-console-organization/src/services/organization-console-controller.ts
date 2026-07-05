import { extractSdkWorkListItems, resolveSdkWorkListQuery } from "@sdkwork/iam-contracts";
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
    memberships: [],
    organizations: [],
    status: "idle",
  };

  const setState = (patch: Partial<SdkworkIamConsoleOrganizationState>) => {
    state = { ...state, ...patch };
  };

  const controller: SdkworkIamConsoleOrganizationController = {
    getState: () => ({
      ...state,
      departments: [...state.departments],
      memberships: [...state.memberships],
      organizations: [...state.organizations],
      selectedOrganization: state.selectedOrganization ? { ...state.selectedOrganization } : undefined,
    }),
    listDepartments: async (organizationId, params) => {
      const normalizedOrganizationId = requireId(organizationId, "organizationId");
      setState({ status: "loading" });
      try {
        const departments = extractSdkWorkListItems(
          await service.iam.departments.list(
            resolveSdkWorkListQuery({ ...params, organizationId: normalizedOrganizationId }),
          ),
        )
          .map(toDepartment)
          .filter(Boolean) as SdkworkIamConsoleDepartmentRecord[];
        setState({ departments, status: "ready" });
        return departments;
      } catch (error) {
        setState({ status: "error" });
        throw error;
      }
    },
    listMemberships: async (params) => {
      setState({ status: "loading" });
      try {
        const memberships = extractSdkWorkListItems(
          await service.iam.organizationMemberships.list(resolveSdkWorkListQuery(params)),
        )
          .map(toMembership)
          .filter(Boolean) as SdkworkIamConsoleOrganizationMembership[];
        setState({ memberships, status: "ready" });
        return memberships;
      } catch (error) {
        setState({ status: "error" });
        throw error;
      }
    },
    listOrganizations: async (params) => {
      setState({ status: "loading" });
      try {
        const organizations = extractSdkWorkListItems(
          await service.iam.organizations.list(resolveSdkWorkListQuery(params)),
        )
          .map(toOrganization)
          .filter(Boolean) as SdkworkIamConsoleOrganizationRecord[];
        setState({ organizations, status: "ready" });
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
          ? resolveSdkWorkListQuery({ ...params, organizationId: selectedOrganizationId })
          : resolveSdkWorkListQuery(params),
      );
      const departments = selectedOrganizationId
        ? await controller.listDepartments(selectedOrganizationId, params)
        : [];
      return { departments, memberships, organizations };
    },
    selectOrganization: async (organizationId) => {
      const normalizedOrganizationId = requireId(organizationId, "organizationId");
      const organizations = state.organizations.length > 0
        ? state.organizations
        : await controller.listOrganizations();
      const selectedOrganization = organizations.find(
        (organization) => organization.organizationId === normalizedOrganizationId,
      );
      setState({ selectedOrganization });
      if (selectedOrganization) {
        await controller.listDepartments(normalizedOrganizationId);
        await controller.listMemberships(
          resolveSdkWorkListQuery({ organizationId: normalizedOrganizationId }),
        );
      }
      return selectedOrganization;
    },
  };

  return controller;
}

function toOrganization(value: unknown): SdkworkIamConsoleOrganizationRecord | undefined {
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

function toDepartment(value: unknown): SdkworkIamConsoleDepartmentRecord | undefined {
  const record = toRecord(value);
  const departmentId = optionalString(record.departmentId) || optionalString(record.department_id) || optionalString(record.id);
  const organizationId = optionalString(record.organizationId) || optionalString(record.organization_id);
  if (!departmentId || !organizationId) {
    return undefined;
  }
  return {
    departmentId,
    id: optionalString(record.id) || departmentId,
    name: optionalString(record.name) || optionalString(record.departmentName) || departmentId,
    organizationId,
    parentDepartmentId: optionalString(record.parentDepartmentId) || optionalString(record.parent_department_id),
  };
}

function toMembership(value: unknown): SdkworkIamConsoleOrganizationMembership | undefined {
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

function requireId(value: unknown, name: string): string {
  const normalized = optionalString(value);
  if (!normalized) {
    throw new Error(`SDKWork IAM console organization controller requires ${name}`);
  }
  return normalized;
}
