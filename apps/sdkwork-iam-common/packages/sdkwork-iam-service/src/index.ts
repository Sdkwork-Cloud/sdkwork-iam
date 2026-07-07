import { isBlank, isSdkWorkSuccessCode, trim } from "@sdkwork/utils";
import { createIamAppContext, type IamAppContext, extractSdkWorkTreeNodes, resolveSdkWorkListQuery } from "@sdkwork/iam-contracts";
import {
  buildTenantCurrentSessionUpdateBody,
  isIamLoginContextSelectionChallenge,
} from "@sdkwork/iam-contracts";
import type { IamAppSdkClient, IamBackendIamResourceClient, IamBackendSdkClient, IamSdkResourceClient } from "@sdkwork/iam-sdk-ports";
import { createIamBackendOauthService, type IamBackendOauthService } from "./iam-backend-oauth-service";

export type { IamBackendOauthService } from "./iam-backend-oauth-service";
import {
  readSdkworkMediaResource,
  type SdkworkMediaResource,
} from "@sdkwork/runtime-bootstrap";

function iamListQuery(params?: Record<string, unknown>): Record<string, string | number> {
  return resolveSdkWorkListQuery(params);
}

export interface IamUser {
  avatar?: SdkworkMediaResource;
  displayName: string;
  email?: string;
  id?: string;
  username?: string;
}

export interface IamSession {
  accessToken: string;
  authToken: string;
  context?: IamAppContext;
  expiresAt?: number | string;
  refreshToken?: string;
  sessionId?: string;
  user?: IamUser;
}

export type { IamLoginContextSelectionChallenge } from "@sdkwork/iam-contracts";
export {
  buildOrganizationLoginContextSelectionBody,
  buildPersonalLoginContextSelectionBody,
  buildTenantCurrentSessionUpdateBody,
  isIamLoginContextSelectionChallenge,
  normalizeIamLoginContextSelectionChallenge,
} from "@sdkwork/iam-contracts";

export interface IamStoredSession {
  accessToken?: string;
  authToken?: string;
  expiresAt?: number | string;
  refreshToken?: string;
}

export interface IamSessionCommitOptions {
  preserveRefreshToken?: boolean;
}

export interface IamCreateSessionInput {
  password?: string;
  username?: string;
  [key: string]: unknown;
}

export interface IamRefreshSessionInput {
  refreshToken?: string;
}

export interface IamCreateRegistrationInput {
  password: string;
  username: string;
  verificationCode?: string;
  [key: string]: unknown;
}

export interface CreateSdkworkIamServiceInput {
  appbaseAppClient: IamAppSdkClient;
  appbaseBackendClient?: IamBackendSdkClient;
  clearSession?: () => Promise<unknown> | unknown;
  commitSession?: (session: IamSession, options?: IamSessionCommitOptions) => Promise<unknown> | unknown;
}

export interface SdkworkIamService {
  auth: {
    passwordResetRequests: {
      create(body: Record<string, unknown>): Promise<unknown>;
    };
    passwordResets: {
      create(body: Record<string, unknown>): Promise<unknown>;
    };
    registrations: {
      create(body: IamCreateRegistrationInput): Promise<IamSession>;
    };
    sessions: {
      create(body: IamCreateSessionInput): Promise<IamSession>;
      loginContextSelection: {
        create(body: Record<string, unknown>): Promise<IamSession>;
      };
      organizationSelection: {
        create(body: Record<string, unknown>): Promise<IamSession>;
      };
      current: {
        delete(): Promise<void>;
        retrieve(): Promise<IamSession>;
        update(body?: Record<string, unknown>): Promise<IamSession>;
      };
      refresh(body: IamRefreshSessionInput): Promise<IamSession>;
    };
  };
  oauth: {
    providers: {
      list(params?: Record<string, unknown>): Promise<unknown>;
    };
    authorizationUrls: {
      create(params?: Record<string, unknown>): Promise<unknown>;
    };
    deviceAuthorizations: {
      create(body: Record<string, unknown>): Promise<unknown>;
      retrieve(deviceAuthorizationId: string): Promise<unknown>;
      scans: {
        create(deviceAuthorizationId: string, body?: Record<string, unknown>): Promise<unknown>;
      };
      passwordCompletions: {
        create(deviceAuthorizationId: string, body: Record<string, unknown>): Promise<unknown>;
      };
      sessionExchanges: {
        create(deviceAuthorizationId: string, body: Record<string, unknown>): Promise<unknown>;
      };
    };
    callbacks: {
      handleGet(params?: Record<string, unknown>): Promise<unknown>;
      handlePost(body?: Record<string, unknown>): Promise<unknown>;
    };
    miniProgramSessions: {
      create(body: Record<string, unknown>): Promise<unknown>;
    };
    authorizations: {
      completions: {
        create(authorizationStateId: string, body?: Record<string, unknown>): Promise<unknown>;
      };
    };
    sessions: {
      create(body: Record<string, unknown>): Promise<IamSession>;
    };
    accountLinks: {
      delete(accountLinkId: string): Promise<unknown>;
      list(params?: Record<string, unknown>): Promise<unknown>;
    };
    grants: {
      delete(grantId: string): Promise<unknown>;
      list(params?: Record<string, unknown>): Promise<unknown>;
    };
  };
  system: {
    iam: {
      runtime: {
        retrieve(params?: Record<string, unknown>): Promise<unknown>;
      };
      verificationPolicy: {
        retrieve(): Promise<unknown>;
      };
      accountBindingPolicy: {
        retrieve(): Promise<unknown>;
      };
    };
  };
  iam: {
    apiKeys: {
      list(params?: Record<string, unknown>): Promise<unknown>;
      revoke(apiKeyId: string): Promise<unknown>;
    };
    auditEvents: {
      list(params?: Record<string, unknown>): Promise<unknown>;
      retrieve(auditEventId: string): Promise<unknown>;
    };
    organizations: {
      create(body: Record<string, unknown>): Promise<unknown>;
      delete(organizationId: string): Promise<unknown>;
      list(params?: Record<string, unknown>): Promise<unknown>;
      retrieve(organizationId: string): Promise<unknown>;
      tree: {
        retrieve(params?: Record<string, unknown>): Promise<unknown>;
      };
      update(organizationId: string, body: Record<string, unknown>): Promise<unknown>;
    };
    organizationMemberships: {
      create(body: Record<string, unknown>): Promise<unknown>;
      list(params?: Record<string, unknown>): Promise<unknown>;
      update(membershipId: string, body: Record<string, unknown>): Promise<unknown>;
    };
    departments: {
      create(body: Record<string, unknown>): Promise<unknown>;
      delete(departmentId: string): Promise<unknown>;
      list(params?: Record<string, unknown>): Promise<unknown>;
      retrieve(departmentId: string): Promise<unknown>;
      tree: {
        retrieve(params?: Record<string, unknown>): Promise<unknown>;
      };
      update(departmentId: string, body: Record<string, unknown>): Promise<unknown>;
    };
    departmentAssignments: {
      create(body: Record<string, unknown>): Promise<unknown>;
      list(params?: Record<string, unknown>): Promise<unknown>;
      update(assignmentId: string, body: Record<string, unknown>): Promise<unknown>;
    };
    permissions: {
      create(body: Record<string, unknown>): Promise<unknown>;
      delete(permissionId: string): Promise<unknown>;
      list(params?: Record<string, unknown>): Promise<unknown>;
      retrieve(permissionId: string): Promise<unknown>;
      update(permissionId: string, body: Record<string, unknown>): Promise<unknown>;
    };
    positions: {
      create(body: Record<string, unknown>): Promise<unknown>;
      delete(positionId: string): Promise<unknown>;
      list(params?: Record<string, unknown>): Promise<unknown>;
      update(positionId: string, body: Record<string, unknown>): Promise<unknown>;
    };
    positionAssignments: {
      create(body: Record<string, unknown>): Promise<unknown>;
      list(params?: Record<string, unknown>): Promise<unknown>;
      update(assignmentId: string, body: Record<string, unknown>): Promise<unknown>;
    };
    policies: {
      create(body: Record<string, unknown>): Promise<unknown>;
      delete(policyId: string): Promise<unknown>;
      list(params?: Record<string, unknown>): Promise<unknown>;
      retrieve(policyId: string): Promise<unknown>;
      update(policyId: string, body: Record<string, unknown>): Promise<unknown>;
    };
    accountBindingPolicy: {
      retrieve(): Promise<unknown>;
      update(body: Record<string, unknown>): Promise<unknown>;
    };
    oauth: IamBackendOauthService;
    roles: {
      create(body: Record<string, unknown>): Promise<unknown>;
      delete(roleId: string): Promise<unknown>;
      list(params?: Record<string, unknown>): Promise<unknown>;
      retrieve(roleId: string): Promise<unknown>;
      update(roleId: string, body: Record<string, unknown>): Promise<unknown>;
      permissions: {
        create(roleId: string, permissionId: string): Promise<unknown>;
        delete(roleId: string, permissionId: string): Promise<unknown>;
        list(roleId: string, params?: Record<string, unknown>): Promise<unknown>;
      };
    };
    roleBindings: {
      create(body: Record<string, unknown>): Promise<unknown>;
      delete(roleBindingId: string): Promise<unknown>;
      list(params?: Record<string, unknown>): Promise<unknown>;
    };
    securityEvents: {
      list(params?: Record<string, unknown>): Promise<unknown>;
      retrieve(securityEventId: string): Promise<unknown>;
    };
    accessCredentials: {
      create(body: Record<string, unknown>): Promise<unknown>;
    };
    applications: {
      register(body: Record<string, unknown>): Promise<unknown>;
    };
    tenantApplications: {
      enable(tenantApplicationId: string, body?: Record<string, unknown>): Promise<unknown>;
      provision(body: Record<string, unknown>): Promise<unknown>;
      retrieve(tenantApplicationId: string): Promise<unknown>;
      update(tenantApplicationId: string, body?: Record<string, unknown>): Promise<unknown>;
    };
    tenants: {
      create(body: Record<string, unknown>): Promise<unknown>;
      delete(tenantId: string): Promise<unknown>;
      list(params?: Record<string, unknown>): Promise<unknown>;
      retrieve(tenantId: string): Promise<unknown>;
      update(tenantId: string, body: Record<string, unknown>): Promise<unknown>;
      members: {
        create(tenantId: string, body: Record<string, unknown>): Promise<unknown>;
        delete(tenantId: string, userId: string): Promise<unknown>;
        list(tenantId: string, params?: Record<string, unknown>): Promise<unknown>;
        update(tenantId: string, userId: string, body: Record<string, unknown>): Promise<unknown>;
      };
    };
    users: {
      current: {
        retrieve(): Promise<IamUser>;
        update(body: Record<string, unknown>): Promise<IamUser>;
        emailBindings: {
          create(body: Record<string, unknown>): Promise<IamUser>;
          delete(body: Record<string, unknown>): Promise<IamUser>;
        };
        phoneBindings: {
          create(body: Record<string, unknown>): Promise<IamUser>;
          delete(body: Record<string, unknown>): Promise<IamUser>;
        };
        password: {
          update(body: Record<string, unknown>): Promise<void>;
        };
      };
      create(body: Record<string, unknown>): Promise<unknown>;
      delete(userId: string): Promise<unknown>;
      list(params?: Record<string, unknown>): Promise<unknown>;
      retrieve(userId: string): Promise<IamUser>;
      update(userId: string, body: Record<string, unknown>): Promise<unknown>;
    };
  };
}

interface Envelope<T> {
  code?: number | string;
  data?: T;
  message?: string;
  msg?: string;
}

interface RemoteSession {
  accessToken?: string;
  authToken?: string;
  context?: IamAppContext;
  expiresAt?: string;
  refreshToken?: string;
  sessionId?: string;
  user?: unknown;
}

interface RemoteUser {
  avatar?: unknown;
  displayName?: string;
  email?: string;
  id?: string;
  name?: string;
  nickname?: string;
  userId?: string;
  username?: string;
}

export function createSdkworkIamService(input: CreateSdkworkIamServiceInput): SdkworkIamService {
  const appSessions = input.appbaseAppClient.auth?.sessions;
  const appOauth = input.appbaseAppClient.oauth;
  const appSystem = input.appbaseAppClient.system;
  const backendIam = input.appbaseBackendClient?.iam;
  const backendOauth = input.appbaseBackendClient?.iamOauth?.iam?.oauth;
  const appIam = input.appbaseAppClient.iam;

  return {
    auth: {
      passwordResetRequests: {
        create: (body) => callRaw(input.appbaseAppClient.auth?.passwordResetRequests, "create", "appbaseAppClient.auth.passwordResetRequests.create", body),
      },
      passwordResets: {
        create: (body) => callRaw(input.appbaseAppClient.auth?.passwordResets, "create", "appbaseAppClient.auth.passwordResets.create", body),
      },
      registrations: {
        create: async (body) => {
          await input.clearSession?.();
          return handleAuthSession(
            await callResourceMethod(
              input.appbaseAppClient.auth?.registrations,
              "create",
              "appbaseAppClient.auth.registrations.create",
              body,
            ),
            input,
          );
        },
      },
      sessions: {
        create: async (body) => {
          await input.clearSession?.();
          return handleAuthSession(
            await callResourceMethod(appSessions, "create", "appbaseAppClient.auth.sessions.create", body),
            input,
          );
        },
        loginContextSelection: {
          create: async (body) => {
            await input.clearSession?.();
            return handleAuthSession(
              await callResourceMethod(
                appSessions?.loginContextSelection,
                "create",
                "appbaseAppClient.auth.sessions.loginContextSelection.create",
                body,
              ),
              input,
            );
          },
        },
        organizationSelection: {
          create: async (body) => {
            await input.clearSession?.();
            return handleAuthSession(
              await callResourceMethod(
                appSessions?.organizationSelection,
                "create",
                "appbaseAppClient.auth.sessions.organizationSelection.create",
                body,
              ),
              input,
            );
          },
        },
        current: {
          delete: async () => {
            try {
              await callRaw(appSessions?.current, "delete", "appbaseAppClient.auth.sessions.current.delete");
            } finally {
              await input.clearSession?.();
            }
          },
          retrieve: async () => handleSession(
            await callResourceMethod(appSessions?.current, "retrieve", "appbaseAppClient.auth.sessions.current.retrieve"),
            input,
            { preserveRefreshToken: true },
          ),
          update: async (body) => handleSession(
            await callResourceMethod(
              appSessions?.current,
              "update",
              "appbaseAppClient.auth.sessions.current.update",
              normalizeCurrentSessionUpdateBody(body),
            ),
            input,
            { preserveRefreshToken: true },
          ),
        },
        refresh: async (body) => handleSession(
          await callResourceMethod(appSessions, "refresh", "appbaseAppClient.auth.sessions.refresh", body),
          input,
          { preserveRefreshToken: true },
        ),
      },
    },
    oauth: {
      providers: {
        list: (params) => callRaw(appOauth?.providers, "list", "appbaseAppClient.oauth.providers.list", iamListQuery(params)),
      },
      authorizationUrls: {
        create: (params) =>
          callOAuthAuthorizationUrlCreate(
            appOauth?.authorizationUrls,
            "appbaseAppClient.oauth.authorizationUrls.create",
            params,
          ),
      },
      deviceAuthorizations: {
        create: (body) => callRaw(appOauth?.deviceAuthorizations, "create", "appbaseAppClient.oauth.deviceAuthorizations.create", body),
        retrieve: (deviceAuthorizationId) => callRaw(
          appOauth?.deviceAuthorizations,
          "retrieve",
          "appbaseAppClient.oauth.deviceAuthorizations.retrieve",
          deviceAuthorizationId,
        ),
        scans: {
          create: (deviceAuthorizationId, body) => callRaw(
            appOauth?.deviceAuthorizations?.scans,
            "create",
            "appbaseAppClient.oauth.deviceAuthorizations.scans.create",
            deviceAuthorizationId,
            body,
          ),
        },
        passwordCompletions: {
          create: (deviceAuthorizationId, body) => callRaw(
            appOauth?.deviceAuthorizations?.passwordCompletions,
            "create",
            "appbaseAppClient.oauth.deviceAuthorizations.passwordCompletions.create",
            deviceAuthorizationId,
            body,
          ),
        },
        sessionExchanges: {
          create: (deviceAuthorizationId, body) => callRaw(
            appOauth?.deviceAuthorizations?.sessionExchanges,
            "create",
            "appbaseAppClient.oauth.deviceAuthorizations.sessionExchanges.create",
            deviceAuthorizationId,
            body,
          ),
        },
      },
      callbacks: {
        handleGet: (params) => callRaw(appOauth?.callbacks, "handleGet", "appbaseAppClient.oauth.callbacks.handleGet", params),
        handlePost: (body) => callRaw(appOauth?.callbacks, "handlePost", "appbaseAppClient.oauth.callbacks.handlePost", body),
      },
      miniProgramSessions: {
        create: (body) => callRaw(appOauth?.miniProgramSessions, "create", "appbaseAppClient.oauth.miniProgramSessions.create", body),
      },
      authorizations: {
        completions: {
          create: (authorizationStateId, body) => callRaw(
            appOauth?.authorizations?.completions,
            "create",
            "appbaseAppClient.oauth.authorizations.completions.create",
            authorizationStateId,
            body,
          ),
        },
      },
      sessions: {
        create: async (body) => {
          await input.clearSession?.();
          return handleSession(await callResourceMethod(appOauth?.sessions, "create", "appbaseAppClient.oauth.sessions.create", body), input);
        },
      },
      accountLinks: {
        delete: (accountLinkId) => callRaw(appOauth?.accountLinks, "delete", "appbaseAppClient.oauth.accountLinks.delete", accountLinkId),
        list: (params) => callRaw(appOauth?.accountLinks, "list", "appbaseAppClient.oauth.accountLinks.list", iamListQuery(params)),
      },
      grants: {
        delete: (grantId) => callRaw(appOauth?.grants, "delete", "appbaseAppClient.oauth.grants.delete", grantId),
        list: (params) => callRaw(appOauth?.grants, "list", "appbaseAppClient.oauth.grants.list", iamListQuery(params)),
      },
    },
    system: {
      iam: {
        runtime: {
          retrieve: (params) => callRaw(appSystem?.iam?.runtime, "retrieve", "appbaseAppClient.system.iam.runtime.retrieve", params),
        },
        verificationPolicy: {
          retrieve: () => callRaw(appSystem?.iam?.verificationPolicy, "retrieve", "appbaseAppClient.system.iam.verificationPolicy.retrieve"),
        },
        accountBindingPolicy: {
          retrieve: () => callRaw(appSystem?.iam?.accountBindingPolicy, "retrieve", "appbaseAppClient.system.iam.accountBindingPolicy.retrieve"),
        },
      },
    },
    iam: {
      apiKeys: {
        list: (params) => callBackendIam(backendIam, (iam) => iam.apiKeys, "list", "iam.apiKeys.list", iamListQuery(params)),
        revoke: (apiKeyId) => callBackendIam(backendIam, (iam) => iam.apiKeys, "revoke", "iam.apiKeys.revoke", apiKeyId),
      },
      auditEvents: {
        list: (params) => callBackendIam(backendIam, (iam) => iam.auditEvents, "list", "iam.auditEvents.list", iamListQuery(params)),
        retrieve: (auditEventId) => callBackendIam(backendIam, (iam) => iam.auditEvents, "retrieve", "iam.auditEvents.retrieve", auditEventId),
      },
      organizations: {
        create: (body) => callBackendIam(backendIam, (iam) => iam.organizations, "create", "iam.organizations.create", body),
        delete: (organizationId) => callBackendIam(backendIam, (iam) => iam.organizations, "delete", "iam.organizations.delete", organizationId),
        list: (params) => callRaw(appIam?.organizations, "list", "appbaseAppClient.iam.organizations.list", iamListQuery(params)),
        retrieve: (organizationId) => callBackendIam(backendIam, (iam) => iam.organizations, "retrieve", "iam.organizations.retrieve", organizationId),
        tree: {
          retrieve: async (params) =>
            extractSdkWorkTreeNodes(
              await callRaw(
                appIam?.organizations?.tree,
                "retrieve",
                "appbaseAppClient.iam.organizations.tree.retrieve",
                params,
              ),
            ),
        },
        update: (organizationId, body) => callBackendIam(backendIam, (iam) => iam.organizations, "update", "iam.organizations.update", organizationId, body),
      },
      organizationMemberships: {
        create: (body) => callBackendIam(backendIam, (iam) => iam.organizationMemberships, "create", "iam.organizationMemberships.create", body),
        list: (params) => callRaw(appIam?.organizationMemberships, "list", "appbaseAppClient.iam.organizationMemberships.list", iamListQuery(params)),
        update: (membershipId, body) => callBackendIam(backendIam, (iam) => iam.organizationMemberships, "update", "iam.organizationMemberships.update", membershipId, body),
      },
      departments: {
        create: (body) => callBackendIam(backendIam, (iam) => iam.departments, "create", "iam.departments.create", body),
        delete: (departmentId) => callBackendIam(backendIam, (iam) => iam.departments, "delete", "iam.departments.delete", departmentId),
        list: (params) => callRaw(appIam?.departments, "list", "appbaseAppClient.iam.departments.list", iamListQuery(params)),
        retrieve: (departmentId) => callBackendIam(backendIam, (iam) => iam.departments, "retrieve", "iam.departments.retrieve", departmentId),
        tree: {
          retrieve: async (params) =>
            extractSdkWorkTreeNodes(
              await callRaw(
                appIam?.departments?.tree,
                "retrieve",
                "appbaseAppClient.iam.departments.tree.retrieve",
                params,
              ),
            ),
        },
        update: (departmentId, body) => callBackendIam(backendIam, (iam) => iam.departments, "update", "iam.departments.update", departmentId, body),
      },
      departmentAssignments: {
        create: (body) => callBackendIam(backendIam, (iam) => iam.departmentAssignments, "create", "iam.departmentAssignments.create", body),
        list: (params) => callRaw(appIam?.departmentAssignments, "list", "appbaseAppClient.iam.departmentAssignments.list", iamListQuery(params)),
        update: (assignmentId, body) => callBackendIam(backendIam, (iam) => iam.departmentAssignments, "update", "iam.departmentAssignments.update", assignmentId, body),
      },
      permissions: {
        create: (body) => callBackendIam(backendIam, (iam) => iam.permissions, "create", "iam.permissions.create", body),
        delete: (permissionId) => callBackendIam(backendIam, (iam) => iam.permissions, "delete", "iam.permissions.delete", permissionId),
        list: (params) => callBackendIam(backendIam, (iam) => iam.permissions, "list", "iam.permissions.list", iamListQuery(params)),
        retrieve: (permissionId) => callBackendIam(backendIam, (iam) => iam.permissions, "retrieve", "iam.permissions.retrieve", permissionId),
        update: (permissionId, body) => callBackendIam(backendIam, (iam) => iam.permissions, "update", "iam.permissions.update", permissionId, body),
      },
      positions: {
        create: (body) => callBackendIam(backendIam, (iam) => iam.positions, "create", "iam.positions.create", body),
        delete: (positionId) => callBackendIam(backendIam, (iam) => iam.positions, "delete", "iam.positions.delete", positionId),
        list: (params) => callRaw(appIam?.positions, "list", "appbaseAppClient.iam.positions.list", iamListQuery(params)),
        update: (positionId, body) => callBackendIam(backendIam, (iam) => iam.positions, "update", "iam.positions.update", positionId, body),
      },
      positionAssignments: {
        create: (body) => callBackendIam(backendIam, (iam) => iam.positionAssignments, "create", "iam.positionAssignments.create", body),
        list: (params) => callRaw(appIam?.positionAssignments, "list", "appbaseAppClient.iam.positionAssignments.list", iamListQuery(params)),
        update: (assignmentId, body) => callBackendIam(backendIam, (iam) => iam.positionAssignments, "update", "iam.positionAssignments.update", assignmentId, body),
      },
      policies: {
        create: (body) => callBackendIam(backendIam, (iam) => iam.policies, "create", "iam.policies.create", body),
        delete: (policyId) => callBackendIam(backendIam, (iam) => iam.policies, "delete", "iam.policies.delete", policyId),
        list: (params) => callBackendIam(backendIam, (iam) => iam.policies, "list", "iam.policies.list", iamListQuery(params)),
        retrieve: (policyId) => callBackendIam(backendIam, (iam) => iam.policies, "retrieve", "iam.policies.retrieve", policyId),
        update: (policyId, body) => callBackendIam(backendIam, (iam) => iam.policies, "update", "iam.policies.update", policyId, body),
      },
      accountBindingPolicy: {
        retrieve: () => callBackendIam(backendIam, (iam) => iam.accountBindingPolicy, "retrieve", "iam.accountBindingPolicy.retrieve"),
        update: (body) => callBackendIam(backendIam, (iam) => iam.accountBindingPolicy, "update", "iam.accountBindingPolicy.update", body),
      },
      oauth: createIamBackendOauthService(backendOauth),
      roles: {
        create: (body) => callBackendIam(backendIam, (iam) => iam.roles, "create", "iam.roles.create", body),
        delete: (roleId) => callBackendIam(backendIam, (iam) => iam.roles, "delete", "iam.roles.delete", roleId),
        list: (params) => callBackendIam(backendIam, (iam) => iam.roles, "list", "iam.roles.list", iamListQuery(params)),
        retrieve: (roleId) => callBackendIam(backendIam, (iam) => iam.roles, "retrieve", "iam.roles.retrieve", roleId),
        update: (roleId, body) => callBackendIam(backendIam, (iam) => iam.roles, "update", "iam.roles.update", roleId, body),
        permissions: {
          create: (roleId, permissionId) => callBackendIam(backendIam, (iam) => iam.roles?.permissions, "create", "iam.roles.permissions.create", roleId, permissionId),
          delete: (roleId, permissionId) => callBackendIam(backendIam, (iam) => iam.roles?.permissions, "delete", "iam.roles.permissions.delete", roleId, permissionId),
          list: (roleId, params) => callBackendIam(backendIam, (iam) => iam.roles?.permissions, "list", "iam.roles.permissions.list", roleId, iamListQuery(params)),
        },
      },
      roleBindings: {
        create: (body) => callBackendIam(backendIam, (iam) => iam.roleBindings, "create", "iam.roleBindings.create", body),
        delete: (roleBindingId) => callBackendIam(backendIam, (iam) => iam.roleBindings, "delete", "iam.roleBindings.delete", roleBindingId),
        list: (params) => callRaw(appIam?.roleBindings, "list", "appbaseAppClient.iam.roleBindings.list", iamListQuery(params)),
      },
      securityEvents: {
        list: (params) => callBackendIam(backendIam, (iam) => iam.securityEvents, "list", "iam.securityEvents.list", iamListQuery(params)),
        retrieve: (securityEventId) => callBackendIam(backendIam, (iam) => iam.securityEvents, "retrieve", "iam.securityEvents.retrieve", securityEventId),
      },
      accessCredentials: {
        create: (body) => callBackendIam(backendIam, (iam) => iam.accessCredentials, "create", "iam.accessCredentials.create", body),
      },
      applications: {
        register: (body) => callBackendIam(backendIam, (iam) => iam.applications, "register", "iam.applications.register", body),
      },
      tenantApplications: {
        provision: (body) => callBackendIam(backendIam, (iam) => iam.tenantApplications, "provision", "iam.tenantApplications.provision", body),
        retrieve: (tenantApplicationId) => callBackendIam(backendIam, (iam) => iam.tenantApplications, "retrieve", "iam.tenantApplications.retrieve", tenantApplicationId),
        update: (tenantApplicationId, body) => callBackendIam(backendIam, (iam) => iam.tenantApplications, "update", "iam.tenantApplications.update", tenantApplicationId, body),
        enable: (tenantApplicationId, body) => callBackendIam(backendIam, (iam) => iam.tenantApplications, "enable", "iam.tenantApplications.enable", tenantApplicationId, body),
      },
      tenants: {
        create: (body) => callBackendIam(backendIam, (iam) => iam.tenants, "create", "iam.tenants.create", body),
        delete: (tenantId) => callBackendIam(backendIam, (iam) => iam.tenants, "delete", "iam.tenants.delete", tenantId),
        list: (params) => callBackendIam(backendIam, (iam) => iam.tenants, "list", "iam.tenants.list", iamListQuery(params)),
        retrieve: (tenantId) => callBackendIam(backendIam, (iam) => iam.tenants, "retrieve", "iam.tenants.retrieve", tenantId),
        update: (tenantId, body) => callBackendIam(backendIam, (iam) => iam.tenants, "update", "iam.tenants.update", tenantId, body),
        members: {
          create: (tenantId, body) => callBackendIam(backendIam, (iam) => iam.tenants?.members, "create", "iam.tenants.members.create", tenantId, body),
          delete: (tenantId, userId) => callBackendIam(backendIam, (iam) => iam.tenants?.members, "delete", "iam.tenants.members.delete", tenantId, userId),
          list: (tenantId, params) => callBackendIam(backendIam, (iam) => iam.tenants?.members, "list", "iam.tenants.members.list", tenantId, iamListQuery(params)),
          update: (tenantId, userId, body) => callBackendIam(backendIam, (iam) => iam.tenants?.members, "update", "iam.tenants.members.update", tenantId, userId, body),
        },
      },
      users: {
        current: {
          retrieve: async () => toUser(unwrap(await callResourceMethod(appIam?.users?.current, "retrieve", "appbaseAppClient.iam.users.current.retrieve"), "appbaseAppClient.iam.users.current.retrieve")),
          update: async (body) => toUser(unwrap(await callResourceMethod(appIam?.users?.current, "update", "appbaseAppClient.iam.users.current.update", body), "appbaseAppClient.iam.users.current.update")),
          emailBindings: {
            create: async (body) => toUser(unwrap(await callRaw(appIam?.users?.current?.emailBindings, "create", "appbaseAppClient.iam.users.current.emailBindings.create", body), "appbaseAppClient.iam.users.current.emailBindings.create")),
            delete: async (body) => toUser(unwrap(await callRaw(appIam?.users?.current?.emailBindings, "delete", "appbaseAppClient.iam.users.current.emailBindings.delete", body), "appbaseAppClient.iam.users.current.emailBindings.delete")),
          },
          phoneBindings: {
            create: async (body) => toUser(unwrap(await callRaw(appIam?.users?.current?.phoneBindings, "create", "appbaseAppClient.iam.users.current.phoneBindings.create", body), "appbaseAppClient.iam.users.current.phoneBindings.create")),
            delete: async (body) => toUser(unwrap(await callRaw(appIam?.users?.current?.phoneBindings, "delete", "appbaseAppClient.iam.users.current.phoneBindings.delete", body), "appbaseAppClient.iam.users.current.phoneBindings.delete")),
          },
          password: {
            update: async (body) => {
              await callRaw(appIam?.users?.current?.password, "update", "appbaseAppClient.iam.users.current.password.update", body);
            },
          },
        },
        create: (body) => callBackendIam(backendIam, (iam) => iam.users, "create", "iam.users.create", body),
        delete: (userId) => callBackendIam(backendIam, (iam) => iam.users, "delete", "iam.users.delete", userId),
        list: (params) => callBackendIam(backendIam, (iam) => iam.users, "list", "iam.users.list", iamListQuery(params)),
        retrieve: async (userId) => toUser(unwrap(await callBackendIam(backendIam, (iam) => iam.users, "retrieve", "iam.users.retrieve", userId), "iam.users.retrieve")),
        update: (userId, body) => callBackendIam(backendIam, (iam) => iam.users, "update", "iam.users.update", userId, body),
      },
    },
  };
}

async function handleSession(
  value: unknown,
  input: CreateSdkworkIamServiceInput,
  options?: IamSessionCommitOptions,
): Promise<IamSession> {
  const session = toSession(unwrap<RemoteSession>(value, "iam.session"));
  if (options) {
    await input.commitSession?.(session, options);
  } else {
    await input.commitSession?.(session);
  }
  return session;
}

async function handleAuthSession(
  value: unknown,
  input: CreateSdkworkIamServiceInput,
  options?: IamSessionCommitOptions,
): Promise<IamSession> {
  const payload = unwrap<RemoteSession>(value, "iam.session");
  if (isAuthSelectionChallenge(payload)) {
    return payload as IamSession;
  }

  return handleSession(value, input, options);
}

function isAuthSelectionChallenge(value: unknown): value is RemoteSession {
  return isIamLoginContextSelectionChallenge(value);
}

async function callRaw(
  resource: object | undefined,
  key: string,
  name: string,
  ...args: unknown[]
): Promise<unknown> {
  return unwrap(await callResourceMethod(resource, key, name, ...args), name);
}

async function callOAuthAuthorizationUrlCreate(
  resource: NonNullable<NonNullable<IamAppSdkClient["oauth"]>["authorizationUrls"]> | undefined,
  name: string,
  params?: Record<string, unknown>,
): Promise<unknown> {
  const create = requireResourceMethod(resource, "create", name);
  if (create.length > 1) {
    return unwrap(
      await create.call(
        resource,
        params?.provider,
        params?.redirectUri,
        params?.state,
        params?.scope,
      ),
      name,
    );
  }

  return unwrap(await create.call(resource, params), name);
}

async function callBackendIam(
  backendIam: IamBackendIamResourceClient | undefined,
  selectResource: (iam: IamBackendIamResourceClient) => object | undefined,
  key: string,
  name: string,
  ...args: unknown[]
): Promise<unknown> {
  return callRaw(backendIam ? selectResource(backendIam) : undefined, key, name, ...args);
}

async function callResourceMethod(
  resource: object | undefined,
  key: string,
  name: string,
  ...args: unknown[]
): Promise<unknown> {
  return requireResourceMethod(resource, key, name).call(resource, ...args);
}

function requireResourceMethod(
  resource: object | undefined,
  key: string,
  name: string,
): (...args: unknown[]) => Promise<unknown> {
  const method = resource && (resource as Record<string, unknown>)[key];
  if (typeof method !== "function") {
    return (async () => {
      throw new Error(`Missing SDKWork IAM SDK resource: ${name}`);
    }) as (...args: unknown[]) => Promise<unknown>;
  }

  return method as (...args: unknown[]) => Promise<unknown>;
}

function unwrap<T>(value: unknown, name: string): T {
  if (!value || typeof value !== "object") {
    return value as T;
  }

  if (!("data" in value) && !("code" in value)) {
    return value as T;
  }

  const envelope = value as Envelope<T>;
  if (!isSuccessCode(envelope.code)) {
    throw new Error(String(envelope.message || envelope.msg || `${name} failed`));
  }

  return envelope.data as T;
}

function isSuccessCode(code: number | string | undefined): boolean {
  if (code === undefined || code === null) {
    return true;
  }

  const parsed = Number(trim(String(code)));
  return Number.isFinite(parsed) && isSdkWorkSuccessCode(parsed);
}

function toSession(value: unknown): IamSession {
  const remote = value && typeof value === "object" ? value as RemoteSession : {};
  const accessToken = optionalString(remote.accessToken);
  const authToken = optionalString(remote.authToken);

  if (!accessToken) {
    throw new Error("SDKWork IAM session is missing accessToken");
  }

  if (!authToken) {
    throw new Error("SDKWork IAM session is missing authToken");
  }

  return {
    accessToken,
    authToken,
    ...(remote.context ? { context: createIamAppContext(remote.context) } : {}),
    ...(optionalString(remote.expiresAt) ? { expiresAt: optionalString(remote.expiresAt) } : {}),
    ...(optionalString(remote.refreshToken) ? { refreshToken: optionalString(remote.refreshToken) } : {}),
    ...(optionalString(remote.sessionId) ? { sessionId: optionalString(remote.sessionId) } : {}),
    ...(remote.user ? { user: toUser(remote.user) } : {}),
  };
}

function toUser(value: unknown): IamUser {
  const remote = value && typeof value === "object" ? value as RemoteUser : {};
  const displayName =
    optionalString(remote.displayName)
    || optionalString(remote.nickname)
    || optionalString(remote.name)
    || optionalString(remote.username)
    || optionalString(remote.email)
    || "SDKWork User";

  return {
    avatar: readSdkworkMediaResource(remote.avatar),
    displayName,
    ...(optionalString(remote.email) ? { email: optionalString(remote.email) } : {}),
    ...(optionalString(remote.userId) || optionalString(remote.id) ? { id: optionalString(remote.userId) || optionalString(remote.id) } : {}),
    ...(optionalString(remote.username) ? { username: optionalString(remote.username) } : {}),
  };
}

function optionalString(value: unknown): string | undefined {
  const normalized = typeof value === "string" ? trim(value) : "";
  return isBlank(normalized) ? undefined : normalized;
}

function normalizeCurrentSessionUpdateBody(
  body?: Record<string, unknown>,
): Record<string, unknown> | undefined {
  if (!body) {
    return body;
  }

  const loginScope = optionalString(body.loginScope)?.toUpperCase();
  if (loginScope === "TENANT") {
    return {
      ...body,
      ...buildTenantCurrentSessionUpdateBody(),
    };
  }

  return body;
}

export type { IamAppSdkClient, IamBackendSdkClient, IamSdkResourceClient };
