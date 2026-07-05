import type { IamBackendOAuthResourceClient } from "@sdkwork/iam-sdk-ports";
import { resolveSdkWorkListQuery } from "@sdkwork/iam-contracts";

function iamOauthListQuery(params?: Record<string, unknown>): Record<string, string | number> {
  return resolveSdkWorkListQuery(params);
}

export type IamBackendOauthService = {
    accountLinks: {
      list(params?: Record<string, unknown>): Promise<unknown>;
      update(...args: unknown[]): Promise<unknown>;
    };
    callbackEvents: {
      list(params?: Record<string, unknown>): Promise<unknown>;
    };
    claimMappings: {
      create(...args: unknown[]): Promise<unknown>;
      list(params?: Record<string, unknown>): Promise<unknown>;
      update(...args: unknown[]): Promise<unknown>;
    };
    clients: {
      create(...args: unknown[]): Promise<unknown>;
      delete(...args: unknown[]): Promise<unknown>;
      list(params?: Record<string, unknown>): Promise<unknown>;
      retrieve(...args: unknown[]): Promise<unknown>;
      update(...args: unknown[]): Promise<unknown>;
    };
    diagnosticRuns: {
      create(...args: unknown[]): Promise<unknown>;
      list(params?: Record<string, unknown>): Promise<unknown>;
      retrieve(...args: unknown[]): Promise<unknown>;
    };
    flowConfigs: {
      create(...args: unknown[]): Promise<unknown>;
      list(params?: Record<string, unknown>): Promise<unknown>;
      update(...args: unknown[]): Promise<unknown>;
    };
    grants: {
      delete(...args: unknown[]): Promise<unknown>;
      list(params?: Record<string, unknown>): Promise<unknown>;
    };
    integrations: {
      create(...args: unknown[]): Promise<unknown>;
      delete(...args: unknown[]): Promise<unknown>;
      list(params?: Record<string, unknown>): Promise<unknown>;
      retrieve(...args: unknown[]): Promise<unknown>;
      update(...args: unknown[]): Promise<unknown>;
    };
    operationalResources: {
      create(...args: unknown[]): Promise<unknown>;
      delete(...args: unknown[]): Promise<unknown>;
      list(params?: Record<string, unknown>): Promise<unknown>;
      publishes: {
        create(...args: unknown[]): Promise<unknown>;
      };
      update(...args: unknown[]): Promise<unknown>;
    };
    operatorPlatforms: {
      create(...args: unknown[]): Promise<unknown>;
      list(params?: Record<string, unknown>): Promise<unknown>;
      preAuthorizations: {
        create(...args: unknown[]): Promise<unknown>;
      };
      update(...args: unknown[]): Promise<unknown>;
    };
    policies: {
      create(...args: unknown[]): Promise<unknown>;
      list(params?: Record<string, unknown>): Promise<unknown>;
      update(...args: unknown[]): Promise<unknown>;
    };
    providerCatalog: {
      create(...args: unknown[]): Promise<unknown>;
      list(params?: Record<string, unknown>): Promise<unknown>;
      retrieve(...args: unknown[]): Promise<unknown>;
      update(...args: unknown[]): Promise<unknown>;
    };
    resourceAccounts: {
      authorizationRefreshes: {
        create(...args: unknown[]): Promise<unknown>;
      };
      create(...args: unknown[]): Promise<unknown>;
      list(params?: Record<string, unknown>): Promise<unknown>;
      miniProgramLoginChecks: {
        create(...args: unknown[]): Promise<unknown>;
      };
      update(...args: unknown[]): Promise<unknown>;
      verifications: {
        create(...args: unknown[]): Promise<unknown>;
      };
    };
    resourceAuthorizations: {
      create(...args: unknown[]): Promise<unknown>;
      list(params?: Record<string, unknown>): Promise<unknown>;
      update(...args: unknown[]): Promise<unknown>;
    };
    scopeProfiles: {
      create(...args: unknown[]): Promise<unknown>;
      list(params?: Record<string, unknown>): Promise<unknown>;
      update(...args: unknown[]): Promise<unknown>;
    };
    secrets: {
      create(...args: unknown[]): Promise<unknown>;
      delete(...args: unknown[]): Promise<unknown>;
      list(params?: Record<string, unknown>): Promise<unknown>;
    };
    surfaces: {
      create(...args: unknown[]): Promise<unknown>;
      delete(...args: unknown[]): Promise<unknown>;
      list(params?: Record<string, unknown>): Promise<unknown>;
      update(...args: unknown[]): Promise<unknown>;
    };
    tenantBindings: {
      create(...args: unknown[]): Promise<unknown>;
      list(params?: Record<string, unknown>): Promise<unknown>;
      update(...args: unknown[]): Promise<unknown>;
    };
    webhookConfigs: {
      create(...args: unknown[]): Promise<unknown>;
      list(params?: Record<string, unknown>): Promise<unknown>;
      update(...args: unknown[]): Promise<unknown>;
      verifications: {
        create(...args: unknown[]): Promise<unknown>;
      };
    };
};

export function createIamBackendOauthService(
  backendOauth: IamBackendOAuthResourceClient | undefined,
): IamBackendOauthService {
  return {
      accountLinks: {
        list: (params?: Record<string, unknown>) => callBackendOauth(backendOauth, (oauth) => oauth?.accountLinks, "list", "iam.oauth.accountLinks.list", iamOauthListQuery(params)),
        update: (...args: unknown[]) => callBackendOauth(backendOauth, (oauth) => oauth?.accountLinks, "update", "iam.oauth.accountLinks.update", ...args),
      },
      callbackEvents: {
        list: (params?: Record<string, unknown>) => callBackendOauth(backendOauth, (oauth) => oauth?.callbackEvents, "list", "iam.oauth.callbackEvents.list", iamOauthListQuery(params)),
      },
      claimMappings: {
        create: (...args: unknown[]) => callBackendOauth(backendOauth, (oauth) => oauth?.claimMappings, "create", "iam.oauth.claimMappings.create", ...args),
        list: (params?: Record<string, unknown>) => callBackendOauth(backendOauth, (oauth) => oauth?.claimMappings, "list", "iam.oauth.claimMappings.list", iamOauthListQuery(params)),
        update: (...args: unknown[]) => callBackendOauth(backendOauth, (oauth) => oauth?.claimMappings, "update", "iam.oauth.claimMappings.update", ...args),
      },
      clients: {
        create: (...args: unknown[]) => callBackendOauth(backendOauth, (oauth) => oauth?.clients, "create", "iam.oauth.clients.create", ...args),
        delete: (...args: unknown[]) => callBackendOauth(backendOauth, (oauth) => oauth?.clients, "delete", "iam.oauth.clients.delete", ...args),
        list: (params?: Record<string, unknown>) => callBackendOauth(backendOauth, (oauth) => oauth?.clients, "list", "iam.oauth.clients.list", iamOauthListQuery(params)),
        retrieve: (...args: unknown[]) => callBackendOauth(backendOauth, (oauth) => oauth?.clients, "retrieve", "iam.oauth.clients.retrieve", ...args),
        update: (...args: unknown[]) => callBackendOauth(backendOauth, (oauth) => oauth?.clients, "update", "iam.oauth.clients.update", ...args),
      },
      diagnosticRuns: {
        create: (...args: unknown[]) => callBackendOauth(backendOauth, (oauth) => oauth?.diagnosticRuns, "create", "iam.oauth.diagnosticRuns.create", ...args),
        list: (params?: Record<string, unknown>) => callBackendOauth(backendOauth, (oauth) => oauth?.diagnosticRuns, "list", "iam.oauth.diagnosticRuns.list", iamOauthListQuery(params)),
        retrieve: (...args: unknown[]) => callBackendOauth(backendOauth, (oauth) => oauth?.diagnosticRuns, "retrieve", "iam.oauth.diagnosticRuns.retrieve", ...args),
      },
      flowConfigs: {
        create: (...args: unknown[]) => callBackendOauth(backendOauth, (oauth) => oauth?.flowConfigs, "create", "iam.oauth.flowConfigs.create", ...args),
        list: (params?: Record<string, unknown>) => callBackendOauth(backendOauth, (oauth) => oauth?.flowConfigs, "list", "iam.oauth.flowConfigs.list", iamOauthListQuery(params)),
        update: (...args: unknown[]) => callBackendOauth(backendOauth, (oauth) => oauth?.flowConfigs, "update", "iam.oauth.flowConfigs.update", ...args),
      },
      grants: {
        delete: (...args: unknown[]) => callBackendOauth(backendOauth, (oauth) => oauth?.grants, "delete", "iam.oauth.grants.delete", ...args),
        list: (params?: Record<string, unknown>) => callBackendOauth(backendOauth, (oauth) => oauth?.grants, "list", "iam.oauth.grants.list", iamOauthListQuery(params)),
      },
      integrations: {
        create: (...args: unknown[]) => callBackendOauth(backendOauth, (oauth) => oauth?.integrations, "create", "iam.oauth.integrations.create", ...args),
        delete: (...args: unknown[]) => callBackendOauth(backendOauth, (oauth) => oauth?.integrations, "delete", "iam.oauth.integrations.delete", ...args),
        list: (params?: Record<string, unknown>) => callBackendOauth(backendOauth, (oauth) => oauth?.integrations, "list", "iam.oauth.integrations.list", iamOauthListQuery(params)),
        retrieve: (...args: unknown[]) => callBackendOauth(backendOauth, (oauth) => oauth?.integrations, "retrieve", "iam.oauth.integrations.retrieve", ...args),
        update: (...args: unknown[]) => callBackendOauth(backendOauth, (oauth) => oauth?.integrations, "update", "iam.oauth.integrations.update", ...args),
      },
      operationalResources: {
        create: (...args: unknown[]) => callBackendOauth(backendOauth, (oauth) => oauth?.operationalResources, "create", "iam.oauth.operationalResources.create", ...args),
        delete: (...args: unknown[]) => callBackendOauth(backendOauth, (oauth) => oauth?.operationalResources, "delete", "iam.oauth.operationalResources.delete", ...args),
        list: (params?: Record<string, unknown>) => callBackendOauth(backendOauth, (oauth) => oauth?.operationalResources, "list", "iam.oauth.operationalResources.list", iamOauthListQuery(params)),
        publishes: {
          create: (...args: unknown[]) => callBackendOauth(backendOauth, (oauth) => oauth?.operationalResources?.publishes, "create", "iam.oauth.operationalResources.publishes.create", ...args),
        },
        update: (...args: unknown[]) => callBackendOauth(backendOauth, (oauth) => oauth?.operationalResources, "update", "iam.oauth.operationalResources.update", ...args),
      },
      operatorPlatforms: {
        create: (...args: unknown[]) => callBackendOauth(backendOauth, (oauth) => oauth?.operatorPlatforms, "create", "iam.oauth.operatorPlatforms.create", ...args),
        list: (params?: Record<string, unknown>) => callBackendOauth(backendOauth, (oauth) => oauth?.operatorPlatforms, "list", "iam.oauth.operatorPlatforms.list", iamOauthListQuery(params)),
        preAuthorizations: {
          create: (...args: unknown[]) => callBackendOauth(backendOauth, (oauth) => oauth?.operatorPlatforms?.preAuthorizations, "create", "iam.oauth.operatorPlatforms.preAuthorizations.create", ...args),
        },
        update: (...args: unknown[]) => callBackendOauth(backendOauth, (oauth) => oauth?.operatorPlatforms, "update", "iam.oauth.operatorPlatforms.update", ...args),
      },
      policies: {
        create: (...args: unknown[]) => callBackendOauth(backendOauth, (oauth) => oauth?.policies, "create", "iam.oauth.policies.create", ...args),
        list: (params?: Record<string, unknown>) => callBackendOauth(backendOauth, (oauth) => oauth?.policies, "list", "iam.oauth.policies.list", iamOauthListQuery(params)),
        update: (...args: unknown[]) => callBackendOauth(backendOauth, (oauth) => oauth?.policies, "update", "iam.oauth.policies.update", ...args),
      },
      providerCatalog: {
        create: (...args: unknown[]) => callBackendOauth(backendOauth, (oauth) => oauth?.providerCatalog, "create", "iam.oauth.providerCatalog.create", ...args),
        list: (params?: Record<string, unknown>) => callBackendOauth(backendOauth, (oauth) => oauth?.providerCatalog, "list", "iam.oauth.providerCatalog.list", iamOauthListQuery(params)),
        retrieve: (...args: unknown[]) => callBackendOauth(backendOauth, (oauth) => oauth?.providerCatalog, "retrieve", "iam.oauth.providerCatalog.retrieve", ...args),
        update: (...args: unknown[]) => callBackendOauth(backendOauth, (oauth) => oauth?.providerCatalog, "update", "iam.oauth.providerCatalog.update", ...args),
      },
      resourceAccounts: {
        authorizationRefreshes: {
          create: (...args: unknown[]) => callBackendOauth(backendOauth, (oauth) => oauth?.resourceAccounts?.authorizationRefreshes, "create", "iam.oauth.resourceAccounts.authorizationRefreshes.create", ...args),
        },
        create: (...args: unknown[]) => callBackendOauth(backendOauth, (oauth) => oauth?.resourceAccounts, "create", "iam.oauth.resourceAccounts.create", ...args),
        list: (params?: Record<string, unknown>) => callBackendOauth(backendOauth, (oauth) => oauth?.resourceAccounts, "list", "iam.oauth.resourceAccounts.list", iamOauthListQuery(params)),
        miniProgramLoginChecks: {
          create: (...args: unknown[]) => callBackendOauth(backendOauth, (oauth) => oauth?.resourceAccounts?.miniProgramLoginChecks, "create", "iam.oauth.resourceAccounts.miniProgramLoginChecks.create", ...args),
        },
        update: (...args: unknown[]) => callBackendOauth(backendOauth, (oauth) => oauth?.resourceAccounts, "update", "iam.oauth.resourceAccounts.update", ...args),
        verifications: {
          create: (...args: unknown[]) => callBackendOauth(backendOauth, (oauth) => oauth?.resourceAccounts?.verifications, "create", "iam.oauth.resourceAccounts.verifications.create", ...args),
        },
      },
      resourceAuthorizations: {
        create: (...args: unknown[]) => callBackendOauth(backendOauth, (oauth) => oauth?.resourceAuthorizations, "create", "iam.oauth.resourceAuthorizations.create", ...args),
        list: (params?: Record<string, unknown>) => callBackendOauth(backendOauth, (oauth) => oauth?.resourceAuthorizations, "list", "iam.oauth.resourceAuthorizations.list", iamOauthListQuery(params)),
        update: (...args: unknown[]) => callBackendOauth(backendOauth, (oauth) => oauth?.resourceAuthorizations, "update", "iam.oauth.resourceAuthorizations.update", ...args),
      },
      scopeProfiles: {
        create: (...args: unknown[]) => callBackendOauth(backendOauth, (oauth) => oauth?.scopeProfiles, "create", "iam.oauth.scopeProfiles.create", ...args),
        list: (params?: Record<string, unknown>) => callBackendOauth(backendOauth, (oauth) => oauth?.scopeProfiles, "list", "iam.oauth.scopeProfiles.list", iamOauthListQuery(params)),
        update: (...args: unknown[]) => callBackendOauth(backendOauth, (oauth) => oauth?.scopeProfiles, "update", "iam.oauth.scopeProfiles.update", ...args),
      },
      secrets: {
        create: (...args: unknown[]) => callBackendOauth(backendOauth, (oauth) => oauth?.secrets, "create", "iam.oauth.secrets.create", ...args),
        delete: (...args: unknown[]) => callBackendOauth(backendOauth, (oauth) => oauth?.secrets, "delete", "iam.oauth.secrets.delete", ...args),
        list: (params?: Record<string, unknown>) => callBackendOauth(backendOauth, (oauth) => oauth?.secrets, "list", "iam.oauth.secrets.list", iamOauthListQuery(params)),
      },
      surfaces: {
        create: (...args: unknown[]) => callBackendOauth(backendOauth, (oauth) => oauth?.surfaces, "create", "iam.oauth.surfaces.create", ...args),
        delete: (...args: unknown[]) => callBackendOauth(backendOauth, (oauth) => oauth?.surfaces, "delete", "iam.oauth.surfaces.delete", ...args),
        list: (params?: Record<string, unknown>) => callBackendOauth(backendOauth, (oauth) => oauth?.surfaces, "list", "iam.oauth.surfaces.list", iamOauthListQuery(params)),
        update: (...args: unknown[]) => callBackendOauth(backendOauth, (oauth) => oauth?.surfaces, "update", "iam.oauth.surfaces.update", ...args),
      },
      tenantBindings: {
        create: (...args: unknown[]) => callBackendOauth(backendOauth, (oauth) => oauth?.tenantBindings, "create", "iam.oauth.tenantBindings.create", ...args),
        list: (params?: Record<string, unknown>) => callBackendOauth(backendOauth, (oauth) => oauth?.tenantBindings, "list", "iam.oauth.tenantBindings.list", iamOauthListQuery(params)),
        update: (...args: unknown[]) => callBackendOauth(backendOauth, (oauth) => oauth?.tenantBindings, "update", "iam.oauth.tenantBindings.update", ...args),
      },
      webhookConfigs: {
        create: (...args: unknown[]) => callBackendOauth(backendOauth, (oauth) => oauth?.webhookConfigs, "create", "iam.oauth.webhookConfigs.create", ...args),
        list: (params?: Record<string, unknown>) => callBackendOauth(backendOauth, (oauth) => oauth?.webhookConfigs, "list", "iam.oauth.webhookConfigs.list", iamOauthListQuery(params)),
        update: (...args: unknown[]) => callBackendOauth(backendOauth, (oauth) => oauth?.webhookConfigs, "update", "iam.oauth.webhookConfigs.update", ...args),
        verifications: {
          create: (...args: unknown[]) => callBackendOauth(backendOauth, (oauth) => oauth?.webhookConfigs?.verifications, "create", "iam.oauth.webhookConfigs.verifications.create", ...args),
        },
      },
  };
}

async function callBackendOauth(
  backendOauth: IamBackendOAuthResourceClient | undefined,
  selectResource: (oauth: IamBackendOAuthResourceClient) => object | undefined,
  key: string,
  name: string,
  ...args: unknown[]
): Promise<unknown> {
  const resource = backendOauth ? selectResource(backendOauth) : undefined;
  const method = resource && (resource as Record<string, unknown>)[key];
  if (typeof method !== "function") {
    throw new Error(`Missing SDKWork IAM SDK resource: ${name}`);
  }
  return method.call(resource, ...args);
}
