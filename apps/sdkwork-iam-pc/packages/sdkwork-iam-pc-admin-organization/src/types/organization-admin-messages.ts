export interface SdkworkIamOrganizationAdminMessages {
  common: {
    cancel: string;
    create: string;
    edit: string;
    operationError: string;
    save: string;
  };
  departments: {
    create: string;
    delete: string;
    deleteDescriptionTemplate: string;
    deleteTitle: string;
    emptyDescription: string;
    emptyTitle: string;
    loadedMore: string;
    table: { code: string; department: string; parent: string; status: string };
    titleTemplate: string;
  };
  drawers: {
    department: {
      code: string;
      createDescription: string;
      createTitle: string;
      editDescription: string;
      editTitle: string;
      name: string;
      parentId: string;
      status: string;
    };
    membership: {
      createDescription: string;
      createTitle: string;
      editDescription: string;
      editTitle: string;
      kind: string;
      roleCode: string;
      status: string;
      userId: string;
    };
    organization: {
      code: string;
      createDescription: string;
      createTitle: string;
      editDescription: string;
      editTitle: string;
      name: string;
      parentId: string;
      status: string;
    };
  };
  memberships: {
    add: string;
    emptyDescription: string;
    emptyTitle: string;
    loadedMore: string;
    table: { kind: string; member: string; role: string; status: string };
    titleTemplate: string;
  };
  notices: {
    departmentCreated: string;
    departmentDeleted: string;
    departmentUpdated: string;
    loadDepartmentsError: string;
    loadMembershipsError: string;
    loadOrganizationError: string;
    loadOrganizationsError: string;
    loadPositionsError: string;
    loadRoleBindingsError: string;
    membershipCreated: string;
    membershipUpdated: string;
    organizationCreated: string;
    organizationDeleted: string;
    organizationUpdated: string;
  };
  organizations: {
    create: string;
    delete: string;
    deleteDescriptionTemplate: string;
    deleteTitle: string;
    description: string;
    edit: string;
    emptyDescription: string;
    emptyTitle: string;
    loadedMore: string;
    manage: string;
    searchAction: string;
    searchLabel: string;
    searchPlaceholder: string;
    selectedDescriptionTemplate: string;
    selectedTitleTemplate: string;
    structure: string;
    table: { code: string; organization: string; parent: string; status: string };
    title: string;
  };
  positions: {
    emptyDescription: string;
    emptyTitle: string;
    loadedMore: string;
    table: { department: string; position: string; status: string };
    titleTemplate: string;
  };
  roleBindings: {
    emptyDescription: string;
    emptyTitle: string;
    loadedMore: string;
    table: { principal: string; role: string; scope: string; status: string };
    titleTemplate: string;
  };
  structure: {
    back: string;
    descriptionTemplate: string;
    departmentDrawer: {
      code: string;
      createDescription: string;
      createTitle: string;
      editDescription: string;
      editTitle: string;
      name: string;
      parent: string;
      status: string;
    };
    members: {
      actions: string;
      add: string;
      addDescriptionTemplate: string;
      addTitle: string;
      emptyDescription: string;
      emptyTitle: string;
      isPrimary: string;
      loadedMore: string;
      member: string;
      noAvailableMembers: string;
      organizationMember: string;
      position: string;
      primary: string;
      searchAction: string;
      searchLabel: string;
      searchPlaceholder: string;
      setPrimary: string;
      status: string;
      userId: string;
    };
    notices: {
      assignmentCreated: string;
      assignmentUpdated: string;
      departmentCreated: string;
      departmentDeleted: string;
      departmentUpdated: string;
      loadError: string;
      operationError: string;
    };
    titleTemplate: string;
    tree: {
      addChild: string;
      createRoot: string;
      delete: string;
      deleteDescriptionTemplate: string;
      deleteTitle: string;
      edit: string;
      emptyDescription: string;
      emptyTitle: string;
      title: string;
    };
  };
  tabs: { departments: string; memberships: string; positions: string; roleBindings: string };
}
