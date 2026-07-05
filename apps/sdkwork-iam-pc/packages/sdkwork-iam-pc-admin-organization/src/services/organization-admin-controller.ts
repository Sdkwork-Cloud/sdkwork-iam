import {
  buildNextSdkWorkListQuery,
  extractSdkWorkListItems,
  extractSdkWorkListPage,
  mergeSdkWorkListPage,
  resolveSdkWorkListQuery,
  type SdkWorkPageInfo,
} from "@sdkwork/iam-contracts";
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

  let lastOrganizationListParams: Record<string, unknown> | undefined;
  let lastDepartmentListParams: Record<string, unknown> | undefined;
  let lastMembershipListParams: Record<string, unknown> | undefined;
  let lastPositionListParams: Record<string, unknown> | undefined;
  let lastRoleBindingListParams: Record<string, unknown> | undefined;

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
        const departmentTree = await refreshDepartmentTree(
          resolved.service,
          department.organizationId,
          undefined,
          departments,
        );
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
        const tree = await refreshOrganizationTree(resolved.service, undefined, organizations);
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
        const organizationId = state.selectedOrganization?.organizationId ?? departments[0]?.organizationId ?? "";
        const departmentTree = organizationId
          ? await refreshDepartmentTree(resolved.service, organizationId, undefined, departments)
          : [];
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
        const tree = await refreshOrganizationTree(resolved.service, undefined, organizations);
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
      departmentListPageInfo: state.departmentListPageInfo ? { ...state.departmentListPageInfo } : undefined,
      departmentTree: cloneDepartmentTree(state.departmentTree),
      memberships: [...state.memberships],
      membershipListPageInfo: state.membershipListPageInfo ? { ...state.membershipListPageInfo } : undefined,
      organizations: [...state.organizations],
      organizationListPageInfo: state.organizationListPageInfo ? { ...state.organizationListPageInfo } : undefined,
      positions: [...state.positions],
      positionListPageInfo: state.positionListPageInfo ? { ...state.positionListPageInfo } : undefined,
      roleBindings: [...state.roleBindings],
      roleBindingListPageInfo: state.roleBindingListPageInfo ? { ...state.roleBindingListPageInfo } : undefined,
      selectedOrganization: state.selectedOrganization ? { ...state.selectedOrganization } : undefined,
      tree: cloneTree(state.tree),
    }),
    listDepartmentAssignments: async (departmentId, params) => {
      const normalizedDepartmentId = requireId(departmentId, "departmentId");
      setState({ status: "loading" });
      try {
        const departmentAssignments = extractSdkWorkListItems(
          await resolved.service.iam.departmentAssignments.list(
            resolveSdkWorkListQuery({ ...params, departmentId: normalizedDepartmentId }),
          ),
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
    listDepartments: async (organizationId, params, options) => {
      const normalizedOrganizationId = requireId(organizationId, "organizationId");
      const append = options?.append === true;
      if (!append) {
        lastDepartmentListParams = { ...params, organizationId: normalizedOrganizationId };
      }
      setState({ status: "loading" });
      try {
        const page = extractSdkWorkListPage(
          await resolved.service.iam.departments.list(
            resolveSdkWorkListQuery(lastDepartmentListParams),
          ),
        );
        const mapped = page.items.map(toDepartment).filter(Boolean) as SdkworkIamDepartment[];
        const merged = mergeSdkWorkListPage(append ? state.departments : [], { ...page, items: mapped }, append ? "append" : "replace");
        const departmentTree = await refreshDepartmentTree(
          resolved.service,
          normalizedOrganizationId,
          lastDepartmentListParams,
          merged.items,
        );
        setState({ departments: merged.items, departmentListPageInfo: merged.pageInfo, departmentTree, status: "ready" });
        return merged.items;
      } catch (error) {
        setState({ status: "error" });
        throw error;
      }
    },
    loadMoreDepartments: async (organizationId) => {
      const nextQuery = buildNextSdkWorkListQuery(lastDepartmentListParams, state.departmentListPageInfo);
      if (!nextQuery) {
        return state.departments;
      }
      lastDepartmentListParams = { ...nextQuery };
      return controller.listDepartments(organizationId, lastDepartmentListParams, { append: true });
    },
    listMemberships: async (organizationId, params, options) => {
      const normalizedOrganizationId = requireId(organizationId, "organizationId");
      const append = options?.append === true;
      if (!append) {
        lastMembershipListParams = { ...params, organizationId: normalizedOrganizationId };
      }
      setState({ status: "loading" });
      try {
        const page = extractSdkWorkListPage(
          await resolved.service.iam.organizationMemberships.list(
            resolveSdkWorkListQuery(lastMembershipListParams),
          ),
        );
        const mapped = page.items.map(toOrganizationMembership).filter(Boolean) as SdkworkIamOrganizationMembership[];
        const merged = mergeSdkWorkListPage(append ? state.memberships : [], { ...page, items: mapped }, append ? "append" : "replace");
        setState({ memberships: merged.items, membershipListPageInfo: merged.pageInfo, status: "ready" });
        return merged.items;
      } catch (error) {
        setState({ status: "error" });
        throw error;
      }
    },
    loadMoreMemberships: async (organizationId) => {
      const nextQuery = buildNextSdkWorkListQuery(lastMembershipListParams, state.membershipListPageInfo);
      if (!nextQuery) {
        return state.memberships;
      }
      lastMembershipListParams = { ...nextQuery };
      return controller.listMemberships(organizationId, lastMembershipListParams, { append: true });
    },
    listOrganizations: async (params, options) => {
      const append = options?.append === true;
      if (!append) {
        lastOrganizationListParams = params ? { ...params } : undefined;
      }
      setState({ status: "loading" });
      try {
        const page = extractSdkWorkListPage(
          await resolved.service.iam.organizations.list(resolveSdkWorkListQuery(lastOrganizationListParams)),
        );
        const mapped = page.items.map(toOrganization).filter(Boolean) as SdkworkIamOrganization[];
        const merged = mergeSdkWorkListPage(append ? state.organizations : [], { ...page, items: mapped }, append ? "append" : "replace");
        const organizations = merged.items;
        const selectedOrganization = state.selectedOrganization
          ? organizations.find((organization) => organization.organizationId === state.selectedOrganization?.organizationId) ?? state.selectedOrganization
          : organizations.find((organization) => organization.organizationId === resolved.selectedOrganizationId);
        const tree = await refreshOrganizationTree(resolved.service, lastOrganizationListParams, organizations);
        setState({
          organizationListPageInfo: merged.pageInfo,
          organizations,
          selectedOrganization,
          status: "ready",
          tree,
        });
        return organizations;
      } catch (error) {
        setState({ status: "error" });
        throw error;
      }
    },
    loadMoreOrganizations: async () => {
      const nextQuery = buildNextSdkWorkListQuery(lastOrganizationListParams, state.organizationListPageInfo);
      if (!nextQuery) {
        return state.organizations;
      }
      lastOrganizationListParams = { ...nextQuery };
      return controller.listOrganizations(lastOrganizationListParams, { append: true });
    },
    listPositions: async (params, options) => {
      const append = options?.append === true;
      if (!append) {
        lastPositionListParams = params ? { ...params } : undefined;
      }
      setState({ status: "loading" });
      try {
        const page = extractSdkWorkListPage(
          await resolved.service.iam.positions.list(resolveSdkWorkListQuery(lastPositionListParams)),
        );
        const mapped = page.items.map(toPosition).filter(Boolean) as SdkworkIamPosition[];
        const merged = mergeSdkWorkListPage(append ? state.positions : [], { ...page, items: mapped }, append ? "append" : "replace");
        setState({ positionListPageInfo: merged.pageInfo, positions: merged.items, status: "ready" });
        return merged.items;
      } catch (error) {
        setState({ status: "error" });
        throw error;
      }
    },
    loadMorePositions: async () => {
      const nextQuery = buildNextSdkWorkListQuery(lastPositionListParams, state.positionListPageInfo);
      if (!nextQuery) {
        return state.positions;
      }
      lastPositionListParams = { ...nextQuery };
      return controller.listPositions(lastPositionListParams, { append: true });
    },
    listRoleBindings: async (params, options) => {
      const append = options?.append === true;
      if (!append) {
        lastRoleBindingListParams = params ? { ...params } : undefined;
      }
      setState({ status: "loading" });
      try {
        const page = extractSdkWorkListPage(
          await resolved.service.iam.roleBindings.list(resolveSdkWorkListQuery(lastRoleBindingListParams)),
        );
        const mapped = page.items.map(toRoleBinding).filter(Boolean) as SdkworkIamRoleBinding[];
        const merged = mergeSdkWorkListPage(append ? state.roleBindings : [], { ...page, items: mapped }, append ? "append" : "replace");
        setState({ roleBindingListPageInfo: merged.pageInfo, roleBindings: merged.items, status: "ready" });
        return merged.items;
      } catch (error) {
        setState({ status: "error" });
        throw error;
      }
    },
    loadMoreRoleBindings: async () => {
      const nextQuery = buildNextSdkWorkListQuery(lastRoleBindingListParams, state.roleBindingListPageInfo);
      if (!nextQuery) {
        return state.roleBindings;
      }
      lastRoleBindingListParams = { ...nextQuery };
      return controller.listRoleBindings(lastRoleBindingListParams, { append: true });
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
        const departmentTree = await refreshDepartmentTree(
          resolved.service,
          department.organizationId,
          undefined,
          departments,
        );
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
        const tree = await refreshOrganizationTree(resolved.service, undefined, organizations);
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

function treeScopeParams(params?: Record<string, unknown>): Record<string, unknown> | undefined {
  if (!params) {
    return undefined;
  }
  const scoped: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(params)) {
    if (["page", "page_size", "pageSize", "cursor", "sort", "q"].includes(key)) {
      continue;
    }
    if (value !== undefined && value !== null) {
      scoped[key] = value;
    }
  }
  return Object.keys(scoped).length > 0 ? scoped : undefined;
}

async function refreshOrganizationTree(
  service: SdkworkIamService,
  params: Record<string, unknown> | undefined,
  fallbackOrganizations: readonly SdkworkIamOrganization[],
): Promise<readonly SdkworkIamOrganizationNode[]> {
  if (service.iam.organizations.tree?.retrieve) {
    try {
      const nodes = await service.iam.organizations.tree.retrieve(treeScopeParams(params));
      if (Array.isArray(nodes) && nodes.length > 0) {
        return normalizeOrganizationTreeNodes(nodes);
      }
    } catch {
      // fall back to locally materialized page data
    }
  }
  return buildTree(fallbackOrganizations);
}

async function refreshDepartmentTree(
  service: SdkworkIamService,
  organizationId: string,
  params: Record<string, unknown> | undefined,
  fallbackDepartments: readonly SdkworkIamDepartment[],
): Promise<readonly SdkworkIamDepartmentNode[]> {
  if (service.iam.departments.tree?.retrieve) {
    try {
      const nodes = await service.iam.departments.tree.retrieve({
        ...treeScopeParams(params),
        organizationId,
      });
      if (Array.isArray(nodes) && nodes.length > 0) {
        return normalizeDepartmentTreeNodes(nodes);
      }
    } catch {
      // fall back to locally materialized page data
    }
  }
  return buildDepartmentTree(fallbackDepartments);
}

function normalizeOrganizationTreeNodes(
  nodes: readonly unknown[],
  depth = 0,
): SdkworkIamOrganizationNode[] {
  return nodes
    .map((node) => normalizeOrganizationTreeNode(node, depth))
    .filter(Boolean) as SdkworkIamOrganizationNode[];
}

function normalizeOrganizationTreeNode(value: unknown, depth: number): SdkworkIamOrganizationNode | undefined {
  const organization = toOrganization(value);
  if (!organization) {
    return undefined;
  }
  const record = toRecord(value);
  const children = normalizeOrganizationTreeNodes(
    Array.isArray(record.children) ? record.children : [],
    depth + 1,
  );
  return {
    ...organization,
    children,
    depth,
  };
}

function normalizeDepartmentTreeNodes(
  nodes: readonly unknown[],
  depth = 0,
): SdkworkIamDepartmentNode[] {
  return nodes
    .map((node) => normalizeDepartmentTreeNode(node, depth))
    .filter(Boolean) as SdkworkIamDepartmentNode[];
}

function normalizeDepartmentTreeNode(value: unknown, depth: number): SdkworkIamDepartmentNode | undefined {
  const department = toDepartment(value);
  if (!department) {
    return undefined;
  }
  const record = toRecord(value);
  const children = normalizeDepartmentTreeNodes(
    Array.isArray(record.children) ? record.children : [],
    depth + 1,
  );
  return {
    ...department,
    children,
    depth,
  };
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
