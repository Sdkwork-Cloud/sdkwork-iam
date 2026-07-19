export interface SdkworkIamTenantAdminMessages {
  applications: {
    actions: {
      copyAppId: string;
      edit: string;
      register: string;
    };
    description: string;
    drawer: {
      accessPermissions: string;
      accessPermissionsHint: string;
      appKey: string;
      appKeyHint: string;
      displayName: string;
      editDescription: string;
      editTitle: string;
      environment: string;
      instanceKey: string;
      instanceKeyHint: string;
      organizationId: string;
      primaryDomain: string;
      registerDescription: string;
      registerTitle: string;
    };
    emptyDescription: string;
    emptyTitle: string;
    filters: {
      allEnvironments: string;
      allStatuses: string;
      apply: string;
      environment: string;
      searchLabel: string;
      searchPlaceholder: string;
      status: string;
    };
    notices: {
      copyFailed: string;
      copied: string;
      loadError: string;
      loadMoreSuccess: string;
      provisionError: string;
      provisionSuccess: string;
      statusError: string;
      statusSuccess: string;
      updateError: string;
      updateSuccess: string;
    };
    permissionDenied: string;
    statusDialog: {
      disableAction: string;
      disableDescriptionTemplate: string;
      disableTitle: string;
      enableAction: string;
      enableDescriptionTemplate: string;
      enableTitle: string;
    };
    statuses: {
      disabled: string;
      enabled: string;
      pendingConfig: string;
      unknown: string;
    };
    summary: {
      disabled: string;
      enabled: string;
      pending: string;
      total: string;
    };
    table: {
      appId: string;
      application: string;
      domain: string;
      environment: string;
      status: string;
    };
    title: string;
  };
  common: {
    cancel: string;
    close: string;
    edit: string;
    save: string;
  };
  members: {
    add: string;
    emptyDescription: string;
    emptyTitle: string;
    loadedMore: string;
    remove: string;
    titleTemplate: string;
  };
  tenants: {
    create: string;
    delete: string;
    description: string;
    edit: string;
    emptyDescription: string;
    emptyTitle: string;
    loadedMore: string;
    manage: string;
    selectedDescriptionTemplate: string;
    selectedTitleTemplate: string;
    table: {
      code: string;
      name: string;
      status: string;
      tenantId: string;
    };
    title: string;
  };
  tabs: {
    applications: string;
    members: string;
  };
}
