/**
 * Typed message tree for the IAM OAuth admin workspace.
 *
 * Each resource group mirrors one settings section; en/zh key parity is
 * enforced by `assertSdkworkCatalogLocaleParity` in the module tests.
 */
export interface SdkworkIamOauthAdminMessages {
  accountLinks: {
    activate: string;
    description: string;
    emptyLabel: string;
    listLabelTemplate: string;
    notice: string;
    revoke: string;
    revokeConfirm: string;
    suspend: string;
    title: string;
  };
  callbackEvents: {
    description: string;
    emptyLabel: string;
    listLabelTemplate: string;
    title: string;
  };
  claimMappings: {
    addButton: string;
    addDescription: string;
    addTrigger: string;
    description: string;
    emptyLabel: string;
    fields: {
      externalClaim: string;
      externalClaimPlaceholder: string;
      integrationId: string;
      integrationIdPlaceholder: string;
      providerCode: string;
      providerCodePlaceholder: string;
      targetField: string;
      targetFieldPlaceholder: string;
      targetKind: string;
      targetKindPlaceholder: string;
    };
    listLabelTemplate: string;
    title: string;
  };
  clients: {
    addButton: string;
    addDescription: string;
    addTrigger: string;
    deleteConfirm: string;
    description: string;
    emptyLabel: string;
    fields: {
      clientCode: string;
      clientCodePlaceholder: string;
      displayName: string;
      displayNamePlaceholder: string;
      integrationId: string;
      integrationIdPlaceholder: string;
      providerClientId: string;
      providerClientIdPlaceholder: string;
      providerCode: string;
      providerCodePlaceholder: string;
      providerTenantId: string;
      providerTenantIdPlaceholder: string;
    };
    listLabelTemplate: string;
    retrieve: string;
    title: string;
  };
  common: {
    activate: string;
    all: string;
    booleanFalse: string;
    booleanTrue: string;
    cancel: string;
    confirm: string;
    connected: string;
    connectionStatus: string;
    connectionStatusHint: string;
    copied: string;
    copy: string;
    deactivate: string;
    delete: string;
    disable: string;
    disabled: string;
    enable: string;
    enabled: string;
    hideSecret: string;
    logo: string;
    noResourcesFound: string;
    notConnected: string;
    resource: string;
    showSecret: string;
    status: string;
    statusHint: string;
    statuses: {
      active: string;
      archived: string;
      disabled: string;
      enabled: string;
      error: string;
      pending: string;
      revoked: string;
      suspended: string;
      unknown: string;
    };
    unconfiguredStatus: string;
  };
  diagnosticRuns: {
    addButton: string;
    addDescription: string;
    addTrigger: string;
    description: string;
    emptyLabel: string;
    emptyTitle: string;
    fields: {
      integrationId: string;
      providerCode: string;
      runKind: string;
    };
    latestDetailLabel: string;
    listLabelTemplate: string;
    retrieve: string;
    title: string;
  };
  flowConfigs: {
    addButton: string;
    addDescription: string;
    addTrigger: string;
    description: string;
    emptyLabel: string;
    fields: {
      flowKind: string;
      flowKindPlaceholder: string;
      flowPurpose: string;
      flowPurposePlaceholder: string;
      integrationId: string;
      integrationIdPlaceholder: string;
      oauthClientId: string;
      oauthClientIdPlaceholder: string;
    };
    listLabelTemplate: string;
    title: string;
  };
  grants: {
    description: string;
    emptyLabel: string;
    listLabelTemplate: string;
    revoke: string;
    revokeConfirm: string;
    title: string;
  };
  integrations: {
    addDescription: string;
    addTrigger: string;
    appIdLabel: string;
    appIdPlaceholder: string;
    autoDisplayNameTemplate: string;
    autoIntegrationCodeTemplate: string;
    clientIdLabel: string;
    clientKeyLabel: string;
    clientSecretLabel: string;
    deleteConfirm: string;
    description: string;
    displayNameLabel: string;
    displayNamePlaceholder: string;
    editButton: string;
    editDescription: string;
    editTitle: string;
    emptyLabel: string;
    enabledLabel: string;
    integrationCodeLabel: string;
    integrationCodePlaceholder: string;
    listLabelTemplate: string;
    providerCodeLabel: string;
    providerCodePlaceholder: string;
    providerSelectPlaceholder: string;
    providerTenantIdLabel: string;
    redirectUriLabel: string;
    redirectUriPlaceholder: string;
    webDomainLabel: string;
    webDomainPlaceholder: string;
    retrieve: string;
    saveButton: string;
    secretNotice: string;
    surfaceLabel: string;
    surfaceOptions: {
      android: string;
      desktop: string;
      h5: string;
      ios: string;
      web: string;
    };
    title: string;
  };
  managedList: {
    dialogTitleTemplate: string;
  };
  operatorPlatforms: {
    addButton: string;
    addDescription: string;
    addTrigger: string;
    description: string;
    emptyLabel: string;
    fields: {
      displayName: string;
      integrationId: string;
      operatorMode: string;
      platformCode: string;
      providerCode: string;
      providerPlatformId: string;
    };
    listLabelTemplate: string;
    preAuthorize: string;
    title: string;
  };
  operationalResources: {
    addButton: string;
    addDescription: string;
    addTrigger: string;
    deleteConfirm: string;
    description: string;
    emptyLabel: string;
    fields: {
      displayName: string;
      integrationId: string;
      providerCode: string;
      resourceAccountId: string;
      resourceCode: string;
      resourceKind: string;
    };
    listLabelTemplate: string;
    publish: string;
    title: string;
  };
  policies: {
    addButton: string;
    addDescription: string;
    addTrigger: string;
    description: string;
    emptyLabel: string;
    fields: {
      displayName: string;
      displayNamePlaceholder: string;
      integrationId: string;
      integrationIdPlaceholder: string;
      policyCode: string;
      policyCodePlaceholder: string;
    };
    listLabelTemplate: string;
    title: string;
  };
  pagination: {
    next: string;
    pageSize: string;
    previous: string;
    total: string;
  };
  scanLogin: {
    accounts: {
      addDescription: string;
      addServiceAccount: string;
      addSuccess: string;
      disableLogin: string;
      emptyLabel: string;
      enableHint: string;
      enableLogin: string;
      generateLabel: string;
      listTitle: string;
      mutualExclusiveHint: string;
      noAccountHint: string;
      stopLogin: string;
      title: string;
      webhookCallbackHint: string;
      webhookMissing: string;
      webhookReady: string;
    };
    modes: {
      add: string;
      addKindLabel: string;
      addKindOfficialAccount: string;
      addKindPlaceholder: string;
      addKindProvider: string;
      addKindUrl: string;
      addProvider: string;
      addProviderPlaceholder: string;
      defaultHint: string;
      disable: string;
      emptyHint: string;
      enable: string;
      moveDown: string;
      moveUp: string;
      providerModeLabel: string;
      remove: string;
      removeConfirm: string;
      removeDescriptionTemplate: string;
      removeTitle: string;
      title: string;
    };
    common: {
      error: string;
      loading: string;
      refresh: string;
      save: string;
      saveSuccess: string;
    };
    currentActiveBadge: string;
    currentModeLabel: string;
    modeNotEnabledBadge: string;
    help: {
      description: string;
      title: string;
    };
    modeCardDescriptions: {
      officialAccount: string;
      provider: string;
      url: string;
    };
    preview: {
      copy: string;
      copied: string;
      expireTemplate: string;
      officialAccountHint: string;
      title: string;
      urlHint: string;
    };
    providerModeHint: string;
    providerSelectLabel: string;
    providerSelectPlaceholder: string;
    quickSetupOfficialAccountFields: {
      appId: string;
      appIdPlaceholder: string;
      appSecret: string;
      appSecretPlaceholder: string;
      displayName: string;
      displayNamePlaceholder: string;
    };
    quickSetupOriginalIdLabel: string;
    quickSetupOriginalIdPlaceholder: string;
    title: string;
    url: {
      domainLabel: string;
      domainPlaceholder: string;
      enabledLabel: string;
      generateLabel: string;
      h5LoginOrigin: string;
      h5LoginOriginHint: string;
      h5LoginOriginPlaceholder: string;
      loginUrlPreview: string;
      protocolLabel: string;
      save: string;
      title: string;
      titleHint: string;
    };
  };
  quickSetup: {
    accountType: {
      enterprise: string;
      label: string;
      personal: string;
      service: string;
      subjectLabel: string;
      subscription: string;
    };
    originalId: {
      label: string;
      placeholder: string;
    };
    tabs: {
      basic: string;
      config: string;
      server: string;
      status: string;
    };
    createStatusHint: string;
    deleteAccountConfirmTemplate: string;
    searchPlaceholder: string;
    webhookVerifyStatus: string;
    accountConfig: {
      basic: {
        appId: string;
        appSecret: string;
        appSecretPlaceholder: string;
        callbackUrl: string;
        callbackUrlHint: string;
        displayName: string;
        miniCallbackHint: string;
        webDomain: string;
        webDomainPlaceholder: string;
      };
      domains: {
        addDomain: string;
        business: string;
        businessDomains: string;
        businessHint: string;
        description: string;
        domainPlaceholder: string;
        downloadFile: string;
        jsSecureDomains: string;
        miniDescription: string;
        officialDescription: string;
        officialTitle: string;
        request: string;
        requestHint: string;
        socket: string;
        title: string;
        uploadFile: string;
      };
      editDescription: string;
      editTitle: string;
      logo: {
        choose: string;
        hint: string;
        invalidType: string;
        remove: string;
        title: string;
        tooLarge: string;
      };
      notify: {
        dataFormat: string;
        dataFormatJson: string;
        dataFormatXml: string;
        description: string;
        encodingAesKey: string;
        encodingAesKeyPlaceholder: string;
        encryptMode: string;
        generateAesKey: string;
        generateToken: string;
        encryptModeCompatible: string;
        encryptModePlain: string;
        encryptModeSafe: string;
        syncHint: string;
        title: string;
        token: string;
        tokenPlaceholder: string;
        url: string;
        urlPlaceholder: string;
      };
      notices: {
        copied: string;
        saveError: string;
        saveSuccess: string;
        verifyQueued: string;
      };
      save: string;
      verifyFile: {
        content: string;
        contentPlaceholder: string;
        copyContent: string;
        deployHint: string;
        description: string;
        download: string;
        fileName: string;
        fileNamePlaceholder: string;
        invalidType: string;
        noDomains: string;
        status: string;
        statusFailed: string;
        statusPending: string;
        statusUnknown: string;
        statusVerified: string;
        title: string;
        tooLarge: string;
        upload: string;
        uploaded: string;
        verify: string;
        verifyHint: string;
      };
    };
    accountSwitch: {
      enable: string;
      enableHint: string;
      enabled: string;
      notEnabled: string;
    };
    miniProgramAccounts: {
      actions: string;
      addButton: string;
      addDescription: string;
      addTrigger: string;
      description: string;
      emptyLabel: string;
      fields: {
        appId: string;
        appIdPlaceholder: string;
        appSecret: string;
        appSecretPlaceholder: string;
        displayName: string;
        displayNamePlaceholder: string;
        redirectUri: string;
        redirectUriPlaceholder: string;
      };
      listLabelTemplate: string;
      title: string;
    };
    officialAccounts: {
      actions: string;
      addButton: string;
      addDescription: string;
      addTrigger: string;
      description: string;
      emptyLabel: string;
      fields: {
        appId: string;
        appIdPlaceholder: string;
        appSecret: string;
        appSecretPlaceholder: string;
        displayName: string;
        displayNamePlaceholder: string;
        redirectUri: string;
        redirectUriPlaceholder: string;
      };
      followQrCode: {
        close: string;
        description: string;
        download: string;
        failure: string;
        generate: string;
        loading: string;
        permanentHint: string;
        sceneLabel: string;
        title: string;
      };
      listLabelTemplate: string;
      title: string;
    };
    customMenus: {
      actions: string;
      openButton: string;
      title: string;
      description: string;
      close: string;
      phonePreviewTitle: string;
      deviceSelectorLabel: string;
      undo: string;
      redo: string;
      savedStatus: string;
      unsavedStatus: string;
      phoneEmptyHint: string;
      addTopMenu: string;
      addSubMenu: string;
      topMenuLabel: string;
      subMenuLabel: string;
      parentContentHint: string;
      cancel: string;
      discardChanges: string;
      deleteConfirmation: string;
      deleteMenu: string;
      deleteSubMenu: string;
      moveUp: string;
      moveDown: string;
      menuName: string;
      menuNamePlaceholder: string;
      nameUnitHint: string;
      actionTitle: string;
      actionUnset: string;
      actionUnsetHint: string;
      unsupportedActionTemplate: string;
      actionTypes: {
        click: string;
        clickDescription: string;
        view: string;
        viewDescription: string;
        miniprogram: string;
        miniprogramDescription: string;
      };
      messageLabel: string;
      messagePlaceholder: string;
      messageHint: string;
      urlLabel: string;
      urlPlaceholder: string;
      appIdLabel: string;
      appIdPlaceholder: string;
      pagePathLabel: string;
      pagePathPlaceholder: string;
      fallbackUrlLabel: string;
      fallbackUrlPlaceholder: string;
      fallbackUrlHint: string;
      rules: string;
      rulesText: string;
      rulesText2: string;
      loading: string;
      loadFailed: string;
      selectHint: string;
      saveDraft: string;
      saveAndPublish: string;
      publishConfirmTitle: string;
      publishConfirmDescription: string;
      publishConfirmAction: string;
      saved: string;
      publishSuccess: string;
      publishUnavailable: string;
      publishFailedTemplate: string;
      unsavedTitle: string;
      unsavedDescription: string;
      validation: {
        atLeastOneTop: string;
        tooManyTop: string;
        tooManySub: string;
        nestedSubMenuNotAllowed: string;
        nameRequired: string;
        nameTooLongTop: string;
        nameTooLongSub: string;
        actionRequired: string;
        unsupportedAction: string;
        messageRequired: string;
        messageTooLong: string;
        urlRequired: string;
        urlInvalid: string;
        urlTooLong: string;
        appIdRequired: string;
        pagePathRequired: string;
      };
    };
    providerConnections: {
      actions: string;
      addDescription: string;
      addPlatform: string;
      allPlatformsAdded: string;
      configuredListTitle: string;
      deleteConfirm: string;
      disable: string;
      disabled: string;
      emptyDescription: string;
      emptyTitle: string;
      enable: string;
      enabled: string;
      platformLabel: string;
      platformPlaceholder: string;
      saveAndEnable: string;
    };
  };
  providerCatalog: {
    addButton: string;
    description: string;
    displayNameLabel: string;
    displayNamePlaceholder: string;
    emptyLabel: string;
    listLabelTemplate: string;
    providerCodeLabel: string;
    providerCodePlaceholder: string;
    providerNameLabel: string;
    providerNamePlaceholder: string;
    retrieve: string;
    title: string;
  };
  relyingParty: {
    clientIdNoticeTemplate: string;
    confidentialLabel: string;
    description: string;
    enabledLabel: string;
    fields: {
      allowedScopes: string;
      allowedScopesPlaceholder: string;
      clientSecretHash: string;
      redirectUris: string;
      redirectUrisPlaceholder: string;
      tenantApplicationId: string;
      tenantApplicationIdPlaceholder: string;
      tenantId: string;
      tenantIdPlaceholder: string;
    };
    loadButton: string;
    notice: string;
    preserveHashNotice: string;
    preserveHashPlaceholder: string;
    saveButton: string;
    title: string;
  };
  resourceAccounts: {
    addButton: string;
    addDescription: string;
    addTrigger: string;
    description: string;
    emptyLabel: string;
    fields: {
      accessMode: string;
      displayName: string;
      integrationId: string;
      providerAccountId: string;
      providerCode: string;
      resourceAccountCode: string;
      resourceAccountKind: string;
    };
    listLabelTemplate: string;
    miniLoginCheck: string;
    refreshAuth: string;
    title: string;
    verify: string;
  };
  resourceAuthorizations: {
    addButton: string;
    addDescription: string;
    addTrigger: string;
    description: string;
    emptyLabel: string;
    fields: {
      authorizationMode: string;
      integrationId: string;
      providerCode: string;
      resourceAccountId: string;
    };
    listLabelTemplate: string;
    title: string;
  };
  scopeProfiles: {
    addButton: string;
    addDescription: string;
    addTrigger: string;
    description: string;
    emptyLabel: string;
    fields: {
      displayName: string;
      displayNamePlaceholder: string;
      integrationId: string;
      integrationIdPlaceholder: string;
      providerCode: string;
      providerCodePlaceholder: string;
      purpose: string;
      purposePlaceholder: string;
      scopeProfileCode: string;
      scopeProfileCodePlaceholder: string;
    };
    listLabelTemplate: string;
    title: string;
  };
  secrets: {
    addButton: string;
    addDescription: string;
    addTrigger: string;
    deleteConfirm: string;
    description: string;
    emptyLabel: string;
    fields: {
      secretKind: string;
      secretKindPlaceholder: string;
      secretOwnerId: string;
      secretOwnerIdPlaceholder: string;
      secretOwnerKind: string;
      secretOwnerKindPlaceholder: string;
      secretValue: string;
    };
    listLabelTemplate: string;
    notice: string;
    registerButton: string;
    title: string;
  };
  settings: {
    detailLabelTemplate: string;
  };
  surfaces: {
    addButton: string;
    addDescription: string;
    addTrigger: string;
    description: string;
    emptyLabel: string;
    fields: {
      displayName: string;
      displayNamePlaceholder: string;
      integrationId: string;
      integrationIdPlaceholder: string;
      oauthClientId: string;
      oauthClientIdPlaceholder: string;
      redirectUri: string;
      surfaceCode: string;
      surfaceCodePlaceholder: string;
      surfaceKind: string;
      surfaceKindPlaceholder: string;
    };
    listLabelTemplate: string;
    title: string;
  };
  tabs: {
    audit: {
      label: string;
      summary: string;
    };
    extended: {
      label: string;
      summary: string;
    };
    inbound: {
      label: string;
      summary: string;
    };
    provider: {
      label: string;
      summary: string;
    };
  };
  tenantBindings: {
    addButton: string;
    addDescription: string;
    addTrigger: string;
    bindingKindLabel: string;
    description: string;
    emptyLabel: string;
    integrationIdLabel: string;
    listLabelTemplate: string;
    providerCodeLabel: string;
    title: string;
  };
  webhookConfigs: {
    accountLabel: string;
    accountUnbound: string;
    addButton: string;
    addDescription: string;
    addTrigger: string;
    deleteConfirm: string;
    description: string;
    editButton: string;
    editDescription: string;
    editTitle: string;
    emptyLabel: string;
    fields: {
      callbackUrl: string;
      callbackUrlPlaceholder: string;
      displayName: string;
      displayNamePlaceholder: string;
      integrationId: string;
      integrationIdPlaceholder: string;
      providerCode: string;
      providerCodePlaceholder: string;
      webhookCode: string;
      webhookCodePlaceholder: string;
      webhookKind: string;
      webhookKindPlaceholder: string;
    };
    listLabelTemplate: string;
    saveButton: string;
    title: string;
    verify: string;
  };
}
