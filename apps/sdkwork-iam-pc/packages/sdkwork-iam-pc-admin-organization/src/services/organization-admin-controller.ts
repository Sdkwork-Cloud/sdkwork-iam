import type { SdkworkIamService } from "@sdkwork/iam-service";

import type {
  CreateSdkworkIamOrganizationControllerInput,
  SdkworkIamDepartment,
  SdkworkIamDepartmentAssignment,
  SdkworkIamDepartmentDraft,
  SdkworkIamDepartmentNode,
  SdkworkIamOrganization,
  SdkworkIamOrganizationController,
  SdkworkIamOrganizationDraft,
  SdkworkIamOrganizationMembership,
  SdkworkIamOrganizationMembershipDraft,
  SdkworkIamOrganizationNode,
  SdkworkIamOrganizationState,
  SdkworkIamPosition,
  SdkworkIamRoleBinding,
} from "../types/organization-admin-types";
export function createSdkworkIamOrganizationController(
  input: SdkworkIamService | CreateSdkworkIamOrganizationControllerInput,
): SdkworkIamOrganizationController {
  const resolved = resolveInput(input);
  let state: SdkworkIamOrganizationState = {
    departmentAssignments: [],
    departments: [],
    departmentTree: [],
    memberships: [],
    organizations: [],
    positions: [],
    roleBindings: [],
    selectedOrganization: undefined,
    status: "idle",
    tree: [],
  };

  const setState = (patch: Partial<SdkworkIamOrganizationState>) => {
    state = {
      ...state,
      ...patch,
    };
  };

  const controller: SdkworkIamOrganizationController = {
    addMembership: async (organizationId, body) => {
      const normalizedOrganizationId = requireId(organizationId, "organizationId");
      const membership = toOrganizationMembership(
        await resolved.service.iam.organizationMemberships.create({
          ...body,
          organizationId: normalizedOrganizationId,
        }),
      );
      if (!membership) {
        throw new Error("SDKWork IAM organization membership response is missing userId");
      }

      const nextMemberships = [
        ...state.memberships.filter((item) => item.id !== membership.id),
        membership,
      ];
      setState({ memberships: nextMemberships, status: "ready" });
      return membership;
    },
    createDepartment: async (body) => {
      requireId(body.name, "name");
      requireId(body.organizationId, "organizationId");
      setState({ status: "loading" });
      try {
        const department = toDepartment(
          await resolved.service.iam.departments.create(body as unknown as Record<string, unknown>),
        );
        if (!department) {
          throw new Error("SDKWork IAM department create response is missing departmentId");
        }
        const departments = [...state.departments.filter((item) => item.departmentId !== department.departmentId), department];
        const departmentTree = buildDepartmentTree(departments);
        setState({ departments, departmentTree, status: "ready" });
        return department;
      } catch (error) {
        setState({ status: "error" });
        throw error;
      }
    },
    createOrganization: async (body) => {
      requireId(body.name, "name");
      setState({ status: "loading" });
      try {
        const organization = toOrganization(
          await resolved.service.iam.organizations.create(body as unknown as Record<string, unknown>),
        );
        if (!organization) {
          throw new Error("SDKWork IAM organization create response is missing organizationId");
        }
        const organizations = [...state.organizations.filter((item) => item.organizationId !== organization.organizationId), organization];
        const tree = buildTree(organizations);
        setState({ organizations, selectedOrganization: organization, status: "ready", tree });
        return organization;
      } catch (error) {
        setState({ status: "error" });
        throw error;
      }
    },
    deleteDepartment: async (departmentId) => {
      const normalizedDepartmentId = requireId(departmentId, "departmentId");
      setState({ status: "loading" });
      try {
        await resolved.service.iam.departments.delete(normalizedDepartmentId);
        const departments = state.departments.filter((department) => department.departmentId !== normalizedDepartmentId);
        const departmentTree = buildDepartmentTree(departments);
        setState({ departments, departmentTree, status: "ready" });
      } catch (error) {
        setState({ status: "error" });
        throw error;
      }
    },
    deleteOrganization: async (organizationId) => {
      const normalizedOrganizationId = requireId(organizationId, "organizationId");
      setState({ status: "loading" });
      try {
        await resolved.service.iam.organizations.delete(normalizedOrganizationId);
        const organizations = state.organizations.filter((organization) => organization.organizationId !== normalizedOrganizationId);
        const selectedOrganization = state.selectedOrganization?.organizationId === normalizedOrganizationId
          ? undefined
          : state.selectedOrganization;
        const tree = buildTree(organizations);
        setState({
          departments: selectedOrganization ? state.departments : [],
          departmentTree: selectedOrganization ? state.departmentTree : [],
          memberships: selectedOrganization ? state.memberships : [],
          organizations,
          selectedOrganization,
          status: "ready",
          tree,
        });
      } catch (error) {
        setState({ status: "error" });
        throw error;
      }
    },
    buildDepartmentTree: (departments = state.departments) => {
      const departmentTree = buildDepartmentTree(departments);
      if (departments === state.departments) {
        setState({ departmentTree });
      }
      return departmentTree;
    },
    buildOrganizationTree: (organizations = state.organizations) => {
      const tree = buildTree(organizations);
      if (organizations === state.organizations) {
        setState({ tree });
      }
      return tree;
    },
    getState: () => ({
      ...state,
      departmentAssignments: [...state.departmentAssignments],
      departments: [...state.departments],
      departmentTree: cloneDepartmentTree(state.departmentTree),
      memberships: [...state.memberships],
      organizations: [...state.organizations],
      positions: [...state.positions],
      roleBindings: [...state.roleBindings],
      selectedOrganization: state.selectedOrganization ? { ...state.selectedOrganization } : undefined,
      tree: cloneTree(state.tree),
    }),
    listDepartmentAssignments: async (departmentId, params) => {
      const normalizedDepartmentId = requireId(departmentId, "departmentId");
      setState({ status: "loading" });
      try {
        const departmentAssignments = extractList(
          await resolved.service.iam.departmentAssignments.list({
            ...params,
            departmentId: normalizedDepartmentId,
          }),
        )
          .map(toDepartmentAssignment)
          .filter(Boolean) as SdkworkIamDepartmentAssignment[];
        setState({ departmentAssignments, status: "ready" });
        return departmentAssignments;
      } catch (error) {
        setState({ status: "error" });
        throw error;
      }
    },
    listDepartments: async (organizationId, params) => {
      const normalizedOrganizationId = requireId(organizationId, "organizationId");
      setState({ status: "loading" });
      try {
        const departments = extractList(
          await resolved.service.iam.departments.list({
            ...params,
            organizationId: normalizedOrganizationId,
          }),
        )
          .map(toDepartment)
          .filter(Boolean) as SdkworkIamDepartment[];
        const departmentTree = buildDepartmentTree(departments);
        setState({ departments, departmentTree, status: "ready" });
        return departments;
      } catch (error) {
        setState({ status: "error" });
        throw error;
      }
    },
    listMemberships: async (organizationId, params) => {
      const normalizedOrganizationId = requireId(organizationId, "organizationId");
      setState({ status: "loading" });
      try {
        const memberships = extractList(
          await resolved.service.iam.organizationMemberships.list({
            ...params,
            organizationId: normalizedOrganizationId,
          }),
        )
          .map(toOrganizationMembership)
          .filter(Boolean) as SdkworkIamOrganizationMembership[];
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
        const organizations = extractList(await resolved.service.iam.organizations.list(params))
          .map(toOrganization)
          .filter(Boolean) as SdkworkIamOrganization[];
        const selectedOrganization = state.selectedOrganization
          ? organizations.find((organization) => organization.organizationId === state.selectedOrganization?.organizationId) ?? state.selectedOrganization
          : organizations.find((organization) => organization.organizationId === resolved.selectedOrganizationId);
        const tree = buildTree(organizations);
        setState({ organizations, selectedOrganization, status: "ready", tree });
        return organizations;
      } catch (error) {
        setState({ status: "error" });
        throw error;
      }
    },
    listPositions: async (params) => {
      setState({ status: "loading" });
      try {
        const positions = extractList(await resolved.service.iam.positions.list(params))
          .map(toPosition)
          .filter(Boolean) as SdkworkIamPosition[];
        setState({ positions, status: "ready" });
        return positions;
      } catch (error) {
        setState({ status: "error" });
        throw error;
      }
    },
    listRoleBindings: async (params) => {
      setState({ status: "loading" });
      try {
        const roleBindings = extractList(await resolved.service.iam.roleBindings.list(params))
          .map(toRoleBinding)
          .filter(Boolean) as SdkworkIamRoleBinding[];
        setState({ roleBindings, status: "ready" });
        return roleBindings;
      } catch (error) {
        setState({ status: "error" });
        throw error;
      }
    },
    selectOrganization: async (organizationId, params) => {
      const normalizedOrganizationId = requireId(organizationId, "organizationId");
      const organizations = state.organizations.length > 0 ? state.organizations : await controller.listOrganizations(params);
      const selectedOrganization = organizations.find(
        (organization) => organization.organizationId === normalizedOrganizationId || organization.id === normalizedOrganizationId,
      );
      setState({ selectedOrganization });
      return selectedOrganization;
    },
    updateDepartment: async (departmentId, body) => {
      const normalizedDepartmentId = requireId(departmentId, "departmentId");
      setState({ status: "loading" });
      try {
        const department = toDepartment(
          await resolved.service.iam.departments.update(normalizedDepartmentId, body as unknown as Record<string, unknown>),
        );
        if (!department) {
          throw new Error("SDKWork IAM department update response is missing departmentId");
        }
        const departments = [...state.departments.filter((item) => item.departmentId !== department.departmentId), department];
        const departmentTree = buildDepartmentTree(departments);
        setState({ departments, departmentTree, status: "ready" });
        return department;
      } catch (error) {
        setState({ status: "error" });
        throw error;
      }
    },
    updateMembership: async (membershipId, body) => {
      const normalizedMembershipId = requireId(membershipId, "membershipId");
      setState({ status: "loading" });
      try {
        const membership = toOrganizationMembership(
          await resolved.service.iam.organizationMemberships.update(
            normalizedMembershipId,
            body as unknown as Record<string, unknown>,
          ),
        );
        if (!membership) {
          throw new Error("SDKWork IAM organization membership update response is missing userId");
        }
        const memberships = [...state.memberships.filter((item) => item.id !== membership.id), membership];
        setState({ memberships, status: "ready" });
        return membership;
      } catch (error) {
        setState({ status: "error" });
        throw error;
      }
    },
    updateOrganization: async (organizationId, body) => {
      const normalizedOrganizationId = requireId(organizationId, "organizationId");
      setState({ status: "loading" });
      try {
        const organization = toOrganization(
          await resolved.service.iam.organizations.update(normalizedOrganizationId, body as unknown as Record<string, unknown>),
        );
        if (!organization) {
          throw new Error("SDKWork IAM organization update response is missing organizationId");
        }
        const organizations = [...state.organizations.filter((item) => item.organizationId !== organization.organizationId), organization];
        const selectedOrganization = state.selectedOrganization?.organizationId === organization.organizationId
          ? organization
          : state.selectedOrganization;
        const tree = buildTree(organizations);
        setState({ organizations, selectedOrganization, status: "ready", tree });
        return organization;
      } catch (error) {
        setState({ status: "error" });
        throw error;
      }
    },
  };

  return controller;
}

export function buildSdkworkIamOrganizationTree(
  organizations: readonly SdkworkIamOrganization[],
): readonly SdkworkIamOrganizationNode[] {
  return buildTree(organizations);
}

export function buildSdkworkIamDepartmentTree(
  departments: readonly SdkworkIamDepartment[],
): readonly SdkworkIamDepartmentNode[] {
  return buildDepartmentTree(departments);
}

function resolveInput(
  input: SdkworkIamService | CreateSdkworkIamOrganizationControllerInput,
): CreateSdkworkIamOrganizationControllerInput {
  if ("service" in input) {
    return input;
  }

  return { service: input };
}

function buildTree(organizations: readonly SdkworkIamOrganization[]): SdkworkIamOrganizationNode[] {
  const nodes = new Map<string, SdkworkIamOrganizationNode>();
  const roots: SdkworkIamOrganizationNode[] = [];

  for (const organization of organizations) {
    nodes.set(organization.organizationId, {
      ...organization,
      children: [],
      depth: 0,
    });
  }

  for (const node of nodes.values()) {
    const parentId = node.parentId;
    const parent = parentId ? nodes.get(parentId) : undefined;
    if (parent && parent.organizationId !== node.organizationId) {
      node.depth = parent.depth + 1;
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  }

  normalizeDepth(roots, 0);
  return roots;
}

function buildDepartmentTree(departments: readonly SdkworkIamDepartment[]): SdkworkIamDepartmentNode[] {
  const nodes = new Map<string, SdkworkIamDepartmentNode>();
  const roots: SdkworkIamDepartmentNode[] = [];

  for (const department of departments) {
    nodes.set(department.departmentId, {
      ...department,
      children: [],
      depth: 0,
    });
  }

  for (const node of nodes.values()) {
    const parentId = node.parentDepartmentId;
    const parent = parentId ? nodes.get(parentId) : undefined;
    if (parent && parent.departmentId !== node.departmentId) {
      node.depth = parent.depth + 1;
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  }

  normalizeDepartmentDepth(roots, 0);
  return roots;
}

function normalizeDepth(nodes: SdkworkIamOrganizationNode[], depth: number) {
  for (const node of nodes) {
    node.depth = depth;
    normalizeDepth(node.children, depth + 1);
  }
}

function normalizeDepartmentDepth(nodes: SdkworkIamDepartmentNode[], depth: number) {
  for (const node of nodes) {
    node.depth = depth;
    normalizeDepartmentDepth(node.children, depth + 1);
  }
}

function cloneTree(nodes: readonly SdkworkIamOrganizationNode[]): SdkworkIamOrganizationNode[] {
  return nodes.map((node) => ({
    ...node,
    children: cloneTree(node.children),
  }));
}

function cloneDepartmentTree(nodes: readonly SdkworkIamDepartmentNode[]): SdkworkIamDepartmentNode[] {
  return nodes.map((node) => ({
    ...node,
    children: cloneDepartmentTree(node.children),
  }));
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

function toOrganization(value: unknown): SdkworkIamOrganization | undefined {
  const record = toRecord(value);
  const organizationId = optionalString(record.organizationId) || optionalString(record.organization_id) || optionalString(record.id);
  if (!organizationId) {
    return undefined;
  }

  return {
    code: optionalString(record.code),
    id: optionalString(record.id) || organizationId,
    name: optionalString(record.name) || optionalString(record.organizationName) || organizationId,
    organizationId,
    parentId: optionalString(record.parentId) || optionalString(record.parent_id) || optionalString(record.parentOrganizationId),
    path: optionalString(record.path),
    status: optionalString(record.status),
    tenantId: optionalString(record.tenantId) || optionalString(record.tenant_id),
  };
}

function toDepartment(value: unknown): SdkworkIamDepartment | undefined {
  const record = toRecord(value);
  const departmentId = optionalString(record.departmentId) || optionalString(record.department_id) || optionalString(record.id);
  const organizationId = optionalString(record.organizationId) || optionalString(record.organization_id);
  if (!departmentId || !organizationId) {
    return undefined;
  }

  return {
    code: optionalString(record.code),
    departmentId,
    id: optionalString(record.id) || departmentId,
    name: optionalString(record.name) || optionalString(record.departmentName) || departmentId,
    organizationId,
    parentDepartmentId: optionalString(record.parentDepartmentId) || optionalString(record.parent_department_id),
    path: optionalString(record.path),
    status: optionalString(record.status),
    tenantId: optionalString(record.tenantId) || optionalString(record.tenant_id),
  };
}

function toDepartmentAssignment(value: unknown): SdkworkIamDepartmentAssignment | undefined {
  const record = toRecord(value);
  const assignmentId =
    optionalString(record.assignmentId)
    || optionalString(record.departmentAssignmentId)
    || optionalString(record.department_assignment_id)
    || optionalString(record.id);
  const departmentId = optionalString(record.departmentId) || optionalString(record.department_id);
  const userId = optionalString(record.userId) || optionalString(record.user_id);
  if (!assignmentId || !departmentId || !userId) {
    return undefined;
  }

  return {
    assignmentId,
    departmentId,
    displayName: optionalString(record.displayName) || optionalString(record.name) || optionalString(record.nickname),
    id: optionalString(record.id) || assignmentId,
    organizationId: optionalString(record.organizationId) || optionalString(record.organization_id),
    organizationMembershipId:
      optionalString(record.organizationMembershipId)
      || optionalString(record.organization_membership_id)
      || optionalString(record.membershipId),
    positionName: optionalString(record.positionName) || optionalString(record.position_name),
    status: optionalString(record.status),
    userId,
  };
}

function toPosition(value: unknown): SdkworkIamPosition | undefined {
  const record = toRecord(value);
  const positionId = optionalString(record.positionId) || optionalString(record.position_id) || optionalString(record.id);
  if (!positionId) {
    return undefined;
  }

  return {
    departmentId: optionalString(record.departmentId) || optionalString(record.department_id),
    id: optionalString(record.id) || positionId,
    name: optionalString(record.name) || optionalString(record.positionName) || positionId,
    organizationId: optionalString(record.organizationId) || optionalString(record.organization_id),
    positionId,
    status: optionalString(record.status),
  };
}

function toRoleBinding(value: unknown): SdkworkIamRoleBinding | undefined {
  const record = toRecord(value);
  const roleBindingId = optionalString(record.roleBindingId) || optionalString(record.role_binding_id) || optionalString(record.id);
  const roleId = optionalString(record.roleId) || optionalString(record.role_id);
  if (!roleBindingId && !roleId) {
    return undefined;
  }

  return {
    id: optionalString(record.id) || roleBindingId || roleId || "",
    principalId: optionalString(record.principalId) || optionalString(record.principal_id),
    principalKind: optionalString(record.principalKind) || optionalString(record.principal_kind),
    roleBindingId,
    roleId,
    scopeId: optionalString(record.scopeId) || optionalString(record.scope_id),
    scopeKind: optionalString(record.scopeKind) || optionalString(record.scope_kind),
    status: optionalString(record.status),
  };
}

function toOrganizationMembership(value: unknown): SdkworkIamOrganizationMembership | undefined {
  const record = toRecord(value);
  const userId = optionalString(record.userId) || optionalString(record.user_id) || optionalString(record.id);
  if (!userId) {
    return undefined;
  }

  return {
    displayName: optionalString(record.displayName) || optionalString(record.name) || optionalString(record.nickname),
    email: optionalString(record.email),
    id: optionalString(record.id) || optionalString(record.membershipId) || userId,
    membershipId: optionalString(record.membershipId) || optionalString(record.membership_id) || optionalString(record.id),
    membershipKind: optionalString(record.membershipKind) || optionalString(record.membership_kind),
    organizationId: optionalString(record.organizationId) || optionalString(record.organization_id),
    ...(optionalString(record.roleCode) || optionalString(record.role_code)
      ? { roleCode: optionalString(record.roleCode) || optionalString(record.role_code) }
      : {}),
    status: optionalString(record.status),
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
    throw new Error(`SDKWork IAM organization controller requires ${name}`);
  }

  return normalized;
}
