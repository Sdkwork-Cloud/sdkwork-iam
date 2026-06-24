type IamSdkMethod = (...args: any[]) => Promise<unknown>;

export interface IamBackendOAuthResourceClient {
  accountLinks?: {
    list?: IamSdkMethod;
    update?: IamSdkMethod;
  };
  callbackEvents?: {
    list?: IamSdkMethod;
  };
  claimMappings?: {
    create?: IamSdkMethod;
    list?: IamSdkMethod;
    update?: IamSdkMethod;
  };
  clients?: {
    create?: IamSdkMethod;
    delete?: IamSdkMethod;
    list?: IamSdkMethod;
    retrieve?: IamSdkMethod;
    update?: IamSdkMethod;
  };
  diagnosticRuns?: {
    create?: IamSdkMethod;
    list?: IamSdkMethod;
    retrieve?: IamSdkMethod;
  };
  flowConfigs?: {
    create?: IamSdkMethod;
    list?: IamSdkMethod;
    update?: IamSdkMethod;
  };
  grants?: {
    delete?: IamSdkMethod;
    list?: IamSdkMethod;
  };
  integrations?: {
    create?: IamSdkMethod;
    delete?: IamSdkMethod;
    list?: IamSdkMethod;
    retrieve?: IamSdkMethod;
    update?: IamSdkMethod;
  };
  operationalResources?: {
    create?: IamSdkMethod;
    delete?: IamSdkMethod;
    list?: IamSdkMethod;
    publishes?: {
      create?: IamSdkMethod;
    };
    update?: IamSdkMethod;
  };
  operatorPlatforms?: {
    create?: IamSdkMethod;
    list?: IamSdkMethod;
    preAuthorizations?: {
      create?: IamSdkMethod;
    };
    update?: IamSdkMethod;
  };
  policies?: {
    create?: IamSdkMethod;
    list?: IamSdkMethod;
    update?: IamSdkMethod;
  };
  providerCatalog?: {
    create?: IamSdkMethod;
    list?: IamSdkMethod;
    retrieve?: IamSdkMethod;
    update?: IamSdkMethod;
  };
  resourceAccounts?: {
    authorizationRefreshes?: {
      create?: IamSdkMethod;
    };
    create?: IamSdkMethod;
    list?: IamSdkMethod;
    miniProgramLoginChecks?: {
      create?: IamSdkMethod;
    };
    update?: IamSdkMethod;
    verifications?: {
      create?: IamSdkMethod;
    };
  };
  resourceAuthorizations?: {
    create?: IamSdkMethod;
    list?: IamSdkMethod;
    update?: IamSdkMethod;
  };
  scopeProfiles?: {
    create?: IamSdkMethod;
    list?: IamSdkMethod;
    update?: IamSdkMethod;
  };
  secrets?: {
    create?: IamSdkMethod;
    delete?: IamSdkMethod;
    list?: IamSdkMethod;
  };
  surfaces?: {
    create?: IamSdkMethod;
    delete?: IamSdkMethod;
    list?: IamSdkMethod;
    update?: IamSdkMethod;
  };
  tenantBindings?: {
    create?: IamSdkMethod;
    list?: IamSdkMethod;
    update?: IamSdkMethod;
  };
  webhookConfigs?: {
    create?: IamSdkMethod;
    list?: IamSdkMethod;
    update?: IamSdkMethod;
    verifications?: {
      create?: IamSdkMethod;
    };
  };
}
