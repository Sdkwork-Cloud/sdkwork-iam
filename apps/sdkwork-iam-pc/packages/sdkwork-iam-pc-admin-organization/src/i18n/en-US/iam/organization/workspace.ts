import type { SdkworkIamOrganizationAdminMessages } from "../../../../types/organization-admin-messages";

export const sdkworkIamOrganizationAdminMessages: SdkworkIamOrganizationAdminMessages = {
  common: { cancel: "Cancel", create: "Create", edit: "Edit", operationError: "The operation could not be completed.", save: "Save changes" },
  departments: {
    create: "Create department",
    delete: "Delete",
    deleteDescriptionTemplate: "Delete {name}? This action cannot be undone.",
    deleteTitle: "Delete department",
    emptyDescription: "Create departments to model reporting lines and access scope.",
    emptyTitle: "No departments",
    loadedMore: "More departments loaded.",
    table: { code: "Code", department: "Department", parent: "Parent department", status: "Status" },
    titleTemplate: "{name} departments",
  },
  drawers: {
    department: {
      code: "Code", createDescription: "Create a department within the selected organization.", createTitle: "Create department",
      editDescription: "Update the selected department hierarchy node.", editTitle: "Edit department", name: "Name", parentId: "Parent department ID", status: "Status",
    },
    membership: {
      createDescription: "Assign a user to this organization and configure membership attributes.", createTitle: "Add organization member",
      editDescription: "Update this user's organization membership.", editTitle: "Edit membership", kind: "Membership type", roleCode: "Role code", status: "Status", userId: "User ID",
    },
    organization: {
      code: "Code", createDescription: "Create an organization hierarchy node.", createTitle: "Create organization",
      editDescription: "Update the selected organization.", editTitle: "Edit organization", name: "Name", parentId: "Parent organization ID", status: "Status",
    },
  },
  memberships: {
    add: "Add member", emptyDescription: "Add users to this organization and assign their organization role.", emptyTitle: "No organization members",
    loadedMore: "More memberships loaded.", table: { kind: "Membership type", member: "Member", role: "Role", status: "Status" }, titleTemplate: "{name} members",
  },
  notices: {
    departmentCreated: "Department created.", departmentDeleted: "Department deleted.", departmentUpdated: "Department updated.",
    loadDepartmentsError: "Departments could not be loaded.", loadMembershipsError: "Organization members could not be loaded.",
    loadOrganizationError: "The organization details could not be loaded.", loadOrganizationsError: "Organizations could not be loaded.",
    loadPositionsError: "Positions could not be loaded.", loadRoleBindingsError: "Role bindings could not be loaded.",
    membershipCreated: "Member added.", membershipUpdated: "Membership updated.", organizationCreated: "Organization created.",
    organizationDeleted: "Organization deleted.", organizationUpdated: "Organization updated.",
  },
  organizations: {
    create: "Create organization", delete: "Delete", deleteDescriptionTemplate: "Delete {name}? This action cannot be undone.", deleteTitle: "Delete organization",
    description: "Manage organization boundaries, departments, members, positions, and scoped role assignments.", edit: "Edit organization",
    emptyDescription: "Create an organization to model operational ownership within a tenant.", emptyTitle: "No organizations found", loadedMore: "More organizations loaded.",
    manage: "View details", searchAction: "Search", searchLabel: "Search organizations", searchPlaceholder: "Search organization name, code, or ID",
    selectedDescriptionTemplate: "Organization ID {id} · Review its structure and access assignments.", selectedTitleTemplate: "Managing {name}",
    structure: "Organization structure",
    table: { code: "Code", organization: "Organization", parent: "Parent", status: "Status" }, title: "Organization administration",
  },
  positions: {
    emptyDescription: "Positions created for this organization will appear here.", emptyTitle: "No positions", loadedMore: "More positions loaded.",
    table: { department: "Department ID", position: "Position", status: "Status" }, titleTemplate: "{name} positions",
  },
  roleBindings: {
    emptyDescription: "Scoped role assignments for this organization will appear here.", emptyTitle: "No role bindings", loadedMore: "More role bindings loaded.",
    table: { principal: "Principal", role: "Role ID", scope: "Scope", status: "Status" }, titleTemplate: "{name} role bindings",
  },
  structure: {
    back: "Back to organizations",
    descriptionTemplate: "Manage the department hierarchy and department membership for {name}.",
    departmentDrawer: {
      code: "Code", createDescription: "Create a department under the selected hierarchy node.", createTitle: "Create department",
      editDescription: "Update this department without changing its organization boundary.", editTitle: "Edit department", name: "Name",
      parent: "Parent department ID", status: "Status",
    },
    members: {
      actions: "Actions", add: "Add department member", addDescriptionTemplate: "Assign an existing {name} organization member to this department.", addTitle: "Add department member",
      emptyDescription: "Assign organization members to the selected department.", emptyTitle: "No department members", isPrimary: "Primary department",
      loadedMore: "More department members loaded.", member: "Member", noAvailableMembers: "Every available organization member is already assigned to this department.",
      organizationMember: "Organization member", position: "Position", primary: "Primary", searchAction: "Search", searchLabel: "Search department members",
      searchPlaceholder: "Search member name or user ID", setPrimary: "Set as primary department", status: "Status", userId: "User ID",
    },
    notices: {
      assignmentCreated: "Department member added.", assignmentUpdated: "Department membership updated.", departmentCreated: "Department created.",
      departmentDeleted: "Department deleted.", departmentUpdated: "Department updated.", loadError: "The organization structure could not be loaded.",
      operationError: "The organization structure operation could not be completed.",
    },
    titleTemplate: "{name} organization structure",
    tree: {
      addChild: "Add child department", createRoot: "Create top-level department", delete: "Delete department",
      deleteDescriptionTemplate: "Delete {name}? Child departments or member assignments may prevent this operation.", deleteTitle: "Delete department",
      edit: "Edit department", emptyDescription: "Create the first department for this organization.", emptyTitle: "No departments", title: "Department structure",
    },
  },
  tabs: { departments: "Departments", memberships: "Members", positions: "Positions", roleBindings: "Role bindings" },
};
