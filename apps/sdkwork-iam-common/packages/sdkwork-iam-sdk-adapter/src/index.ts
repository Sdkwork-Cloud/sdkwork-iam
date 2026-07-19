import { isSdkWorkSuccessCode, trim } from "@sdkwork/utils";
import type { IamAppSdkClient, IamBackendSdkClient, IamSdkMethod } from "@sdkwork/iam-sdk-ports";
import {
  SDKWORK_IAM_BACKEND_SDK_FORBIDDEN_LEGACY_NAMESPACES,
  SDKWORK_IAM_BACKEND_SDK_REQUIRED_METHODS,
  SDKWORK_IAM_RETIRED_BACKEND_SDK_METHODS,
  assertIamAppSdkClient,
  assertIamBackendSdkClient,
  getIamSdkSurface,
} from "@sdkwork/iam-sdk-ports";
import { BACKEND_OAUTH_RESOURCE_TREE } from "./backend-oauth-resource-tree";

export interface CreateIamSdkAdaptersInput {
  appbaseApp: unknown;
  appbaseBackend?: unknown;
}

export interface IamSdkAdapters {
  appbaseApp: IamAppSdkClient;
  appbaseBackend?: IamBackendSdkClient;
}

type AnyRecord = Record<string, any>;

export interface IamSdkResponseEnvelope<T = unknown> {
  code?: number | string;
  data?: T;
  message?: string;
  msg?: string;
}

export function createIamSdkAdapters(input: CreateIamSdkAdaptersInput): IamSdkAdapters {
  return {
    appbaseApp: createIamAppSdkAdapter(input.appbaseApp),
    ...(input.appbaseBackend ? { appbaseBackend: createIamBackendSdkAdapter(input.appbaseBackend) } : {}),
  };
}

export function unwrapIamSdkResponse<T = unknown>(
  value: unknown,
  fallbackMessage = "SDKWork IAM request failed.",
): T {
  if (!value || typeof value !== "object") {
    return value as T;
  }

  if (!("data" in value) && !("code" in value)) {
    return value as T;
  }

  const envelope = value as IamSdkResponseEnvelope<T>;
  if (!isSuccessCode(envelope.code)) {
    throw new Error(trim(String(envelope.message || envelope.msg || fallbackMessage)));
  }

  return (envelope.data ?? null) as T;
}

export function createIamAppSdkAdapter(client: unknown): IamAppSdkClient {
  assertIamAppSdkClient(client);

  const source = toRecord(client);
  const auth = toRecord(source.auth);
  const authPasswordResetRequests = toRecord(auth.passwordResetRequests);
  const authPasswordResets = toRecord(auth.passwordResets);
  const authRegistrations = toRecord(auth.registrations);
  const authSessions = toRecord(auth.sessions);
  const authSessionsLoginContextSelection = toRecord(authSessions.loginContextSelection);
  const authSessionsOrganizationSelection = toRecord(authSessions.organizationSelection);
  const authSessionsCurrent = toRecord(authSessions.current);
  const oauth = toRecord(source.oauth);
  const oauthProviders = toRecord(oauth.providers);
  const oauthAuthorizationUrls = toRecord(oauth.authorizationUrls);
  const oauthDeviceAuthorizations = toRecord(oauth.deviceAuthorizations);
  const oauthDeviceAuthorizationScans = toRecord(oauthDeviceAuthorizations.scans);
  const oauthDeviceAuthorizationPasswordCompletions = toRecord(oauthDeviceAuthorizations.passwordCompletions);
  const oauthDeviceAuthorizationSessionExchanges = toRecord(oauthDeviceAuthorizations.sessionExchanges);
  const oauthCallbacks = toRecord(oauth.callbacks);
  const oauthMiniProgramSessions = toRecord(oauth.miniProgramSessions);
  const oauthSessions = toRecord(oauth.sessions);
  const oauthAuthorizations = toRecord(oauth.authorizations);
  const oauthAuthorizationCompletions = toRecord(oauthAuthorizations.completions);
  const oauthAccountLinks = toRecord(oauth.accountLinks);
  const oauthGrants = toRecord(oauth.grants);
  const system = toRecord(source.system);
  const systemIam = toRecord(system.iam);
  const systemIamRuntime = toRecord(systemIam.runtime);
  const systemIamVerificationPolicy = toRecord(systemIam.verificationPolicy);
  const systemIamAccountBindingPolicy = toRecord(systemIam.accountBindingPolicy);
  const iam = toRecord(source.iam);
  const iamOrganizations = toRecord(iam.organizations);
  const iamOrganizationsTree = toRecord(iamOrganizations.tree);
  const iamOrganizationMemberships = toRecord(iam.organizationMemberships);
  const iamDepartments = toRecord(iam.departments);
  const iamDepartmentsTree = toRecord(iamDepartments.tree);
  const iamDepartmentAssignments = toRecord(iam.departmentAssignments);
  const iamPositions = toRecord(iam.positions);
  const iamPositionAssignments = toRecord(iam.positionAssignments);
  const iamRoleBindings = toRecord(iam.roleBindings);
  const iamUsers = toRecord(iam.users);
  const iamUsersCurrent = toRecord(iamUsers.current);
  const iamUsersCurrentEmailBindings = toRecord(iamUsersCurrent.emailBindings);
  const iamUsersCurrentPhoneBindings = toRecord(iamUsersCurrent.phoneBindings);
  const iamUsersCurrentPassword = toRecord(iamUsersCurrent.password);

  return {
    auth: {
      passwordResetRequests: {
        create: standardResourceMethod(authPasswordResetRequests, "create", "appbaseApp.auth.passwordResetRequests.create"),
      },
      passwordResets: {
        create: standardResourceMethod(authPasswordResets, "create", "appbaseApp.auth.passwordResets.create"),
      },
      registrations: {
        create: standardResourceMethod(authRegistrations, "create", "appbaseApp.auth.registrations.create"),
      },
      sessions: {
        create: standardResourceMethod(authSessions, "create", "appbaseApp.auth.sessions.create"),
        loginContextSelection: {
          create: standardResourceMethod(
            authSessionsLoginContextSelection,
            "create",
            "appbaseApp.auth.sessions.loginContextSelection.create",
          ),
        },
        organizationSelection: {
          create: standardResourceMethod(
            authSessionsOrganizationSelection,
            "create",
            "appbaseApp.auth.sessions.organizationSelection.create",
          ),
        },
        current: {
          delete: standardResourceMethod(authSessionsCurrent, "delete", "appbaseApp.auth.sessions.current.delete"),
          retrieve: standardResourceMethod(authSessionsCurrent, "retrieve", "appbaseApp.auth.sessions.current.retrieve"),
          update: standardResourceMethod(authSessionsCurrent, "update", "appbaseApp.auth.sessions.current.update"),
        },
        refresh: standardResourceMethod(authSessions, "refresh", "appbaseApp.auth.sessions.refresh"),
      },
    },
    oauth: {
      providers: {
        list: standardResourceMethod(oauthProviders, "list", "appbaseApp.oauth.providers.list"),
      },
      authorizationUrls: {
        create: standardResourceMethod(oauthAuthorizationUrls, "create", "appbaseApp.oauth.authorizationUrls.create"),
      },
      deviceAuthorizations: {
        create: standardResourceMethod(oauthDeviceAuthorizations, "create", "appbaseApp.oauth.deviceAuthorizations.create"),
        retrieve: pathResourceMethod(
          oauthDeviceAuthorizations,
          "retrieve",
          "appbaseApp.oauth.deviceAuthorizations.retrieve",
          "deviceAuthorizationId",
        ),
        scans: {
          create: pathResourceMethod(
            oauthDeviceAuthorizationScans,
            "create",
            "appbaseApp.oauth.deviceAuthorizations.scans.create",
            "deviceAuthorizationId",
          ),
        },
        passwordCompletions: {
          create: pathResourceMethod(
            oauthDeviceAuthorizationPasswordCompletions,
            "create",
            "appbaseApp.oauth.deviceAuthorizations.passwordCompletions.create",
            "deviceAuthorizationId",
          ),
        },
        sessionExchanges: {
          create: pathResourceMethod(
            oauthDeviceAuthorizationSessionExchanges,
            "create",
            "appbaseApp.oauth.deviceAuthorizations.sessionExchanges.create",
            "deviceAuthorizationId",
          ),
        },
      },
      callbacks: {
        retrieve: standardResourceMethod(oauthCallbacks, "retrieve", "appbaseApp.oauth.callbacks.retrieve"),
        create: standardResourceMethod(oauthCallbacks, "create", "appbaseApp.oauth.callbacks.create"),
      },
      miniProgramSessions: {
        create: standardResourceMethod(oauthMiniProgramSessions, "create", "appbaseApp.oauth.miniProgramSessions.create"),
      },
      sessions: {
        create: standardResourceMethod(oauthSessions, "create", "appbaseApp.oauth.sessions.create"),
      },
      authorizations: {
        completions: {
          create: pathResourceMethod(
            oauthAuthorizationCompletions,
            "create",
            "appbaseApp.oauth.authorizations.completions.create",
            "authorizationStateId",
          ),
        },
      },
      accountLinks: {
        delete: standardResourceMethod(oauthAccountLinks, "delete", "appbaseApp.oauth.accountLinks.delete"),
        list: standardResourceMethod(oauthAccountLinks, "list", "appbaseApp.oauth.accountLinks.list"),
      },
      grants: {
        delete: standardResourceMethod(oauthGrants, "delete", "appbaseApp.oauth.grants.delete"),
        list: standardResourceMethod(oauthGrants, "list", "appbaseApp.oauth.grants.list"),
      },
    },
    system: {
      iam: {
        runtime: {
          retrieve: standardResourceMethod(systemIamRuntime, "retrieve", "appbaseApp.system.iam.runtime.retrieve"),
        },
        verificationPolicy: {
          retrieve: standardResourceMethod(systemIamVerificationPolicy, "retrieve", "appbaseApp.system.iam.verificationPolicy.retrieve"),
        },
        accountBindingPolicy: {
          retrieve: standardResourceMethod(systemIamAccountBindingPolicy, "retrieve", "appbaseApp.system.iam.accountBindingPolicy.retrieve"),
        },
      },
    },
    iam: {
      organizations: {
        list: standardResourceMethod(iamOrganizations, "list", "appbaseApp.iam.organizations.list"),
        tree: {
          retrieve: standardResourceMethod(iamOrganizationsTree, "retrieve", "appbaseApp.iam.organizations.tree.retrieve"),
        },
      },
      organizationMemberships: {
        list: standardResourceMethod(iamOrganizationMemberships, "list", "appbaseApp.iam.organizationMemberships.list"),
      },
      departments: {
        list: standardResourceMethod(iamDepartments, "list", "appbaseApp.iam.departments.list"),
        tree: {
          retrieve: standardResourceMethod(iamDepartmentsTree, "retrieve", "appbaseApp.iam.departments.tree.retrieve"),
        },
      },
      departmentAssignments: {
        list: standardResourceMethod(iamDepartmentAssignments, "list", "appbaseApp.iam.departmentAssignments.list"),
      },
      positions: {
        list: standardResourceMethod(iamPositions, "list", "appbaseApp.iam.positions.list"),
      },
      positionAssignments: {
        list: standardResourceMethod(iamPositionAssignments, "list", "appbaseApp.iam.positionAssignments.list"),
      },
      roleBindings: {
        list: standardResourceMethod(iamRoleBindings, "list", "appbaseApp.iam.roleBindings.list"),
      },
      users: {
        current: {
          retrieve: standardResourceMethod(iamUsersCurrent, "retrieve", "appbaseApp.iam.users.current.retrieve"),
          update: standardResourceMethod(iamUsersCurrent, "update", "appbaseApp.iam.users.current.update"),
          emailBindings: {
            create: standardResourceMethod(iamUsersCurrentEmailBindings, "create", "appbaseApp.iam.users.current.emailBindings.create"),
            delete: standardResourceMethod(iamUsersCurrentEmailBindings, "delete", "appbaseApp.iam.users.current.emailBindings.delete"),
          },
          phoneBindings: {
            create: standardResourceMethod(iamUsersCurrentPhoneBindings, "create", "appbaseApp.iam.users.current.phoneBindings.create"),
            delete: standardResourceMethod(iamUsersCurrentPhoneBindings, "delete", "appbaseApp.iam.users.current.phoneBindings.delete"),
          },
          password: {
            update: standardResourceMethod(iamUsersCurrentPassword, "update", "appbaseApp.iam.users.current.password.update"),
          },
        },
      },
    },
  };
}

export function createIamBackendSdkAdapter(client: unknown): IamBackendSdkClient {
  assertGeneratedIamBackendSdkSourceClient(client);

  const source = toRecord(client);
  const iam = toRecord(source.iam);
  const iamOrganizations = toRecord(iam.organizations);
  const iamOrganizationMemberships = toRecord(iam.organizationMemberships);
  const iamDepartments = toRecord(iam.departments);
  const iamDepartmentAssignments = toRecord(iam.departmentAssignments);
  const iamPositions = toRecord(iam.positions);
  const iamPositionAssignments = toRecord(iam.positionAssignments);
  const iamRoleBindings = toRecord(iam.roleBindings);
  const iamTenantApplications = toRecord(iam.tenantApplications);

  const iamOauthRoot = toRecord(source.iamOauth);
  const iamOauthIam = toRecord(iamOauthRoot.iam);
  const iamOauthOauth = toRecord(iamOauthIam.oauth);
  const oauthAdapted = walkBackendOauthResourceTree(iamOauthOauth, BACKEND_OAUTH_RESOURCE_TREE, "");

  const adapter: IamBackendSdkClient = {
    iam: {
      accessCredentials: {
        create: standardResourceMethod(toRecord(iam.accessCredentials), "create", "appbaseBackend.iam.accessCredentials.create"),
      },
      applications: {
        register: standardResourceMethod(toRecord(iam.applications), "register", "appbaseBackend.iam.applications.register"),
      },
      apiKeys: {
        list: standardResourceMethod(toRecord(iam.apiKeys), "list", "appbaseBackend.iam.apiKeys.list"),
        revoke: standardResourceMethod(toRecord(iam.apiKeys), "revoke", "appbaseBackend.iam.apiKeys.revoke"),
      },
      auditEvents: {
        list: standardResourceMethod(toRecord(iam.auditEvents), "list", "appbaseBackend.iam.auditEvents.list"),
        retrieve: standardResourceMethod(toRecord(iam.auditEvents), "retrieve", "appbaseBackend.iam.auditEvents.retrieve"),
      },
      organizations: {
        create: standardResourceMethod(iamOrganizations, "create", "appbaseBackend.iam.organizations.create"),
        delete: standardResourceMethod(iamOrganizations, "delete", "appbaseBackend.iam.organizations.delete"),
        retrieve: standardResourceMethod(iamOrganizations, "retrieve", "appbaseBackend.iam.organizations.retrieve"),
        update: standardResourceMethod(iamOrganizations, "update", "appbaseBackend.iam.organizations.update"),
      },
      organizationMemberships: {
        create: standardResourceMethod(iamOrganizationMemberships, "create", "appbaseBackend.iam.organizationMemberships.create"),
        update: standardResourceMethod(iamOrganizationMemberships, "update", "appbaseBackend.iam.organizationMemberships.update"),
      },
      departments: {
        create: standardResourceMethod(iamDepartments, "create", "appbaseBackend.iam.departments.create"),
        delete: standardResourceMethod(iamDepartments, "delete", "appbaseBackend.iam.departments.delete"),
        retrieve: standardResourceMethod(iamDepartments, "retrieve", "appbaseBackend.iam.departments.retrieve"),
        update: standardResourceMethod(iamDepartments, "update", "appbaseBackend.iam.departments.update"),
      },
      departmentAssignments: {
        create: standardResourceMethod(iamDepartmentAssignments, "create", "appbaseBackend.iam.departmentAssignments.create"),
        update: standardResourceMethod(iamDepartmentAssignments, "update", "appbaseBackend.iam.departmentAssignments.update"),
      },
      permissions: {
        create: standardResourceMethod(toRecord(iam.permissions), "create", "appbaseBackend.iam.permissions.create"),
        delete: standardResourceMethod(toRecord(iam.permissions), "delete", "appbaseBackend.iam.permissions.delete"),
        list: standardResourceMethod(toRecord(iam.permissions), "list", "appbaseBackend.iam.permissions.list"),
        retrieve: standardResourceMethod(toRecord(iam.permissions), "retrieve", "appbaseBackend.iam.permissions.retrieve"),
        update: standardResourceMethod(toRecord(iam.permissions), "update", "appbaseBackend.iam.permissions.update"),
      },
      policies: {
        create: standardResourceMethod(toRecord(iam.policies), "create", "appbaseBackend.iam.policies.create"),
        delete: standardResourceMethod(toRecord(iam.policies), "delete", "appbaseBackend.iam.policies.delete"),
        list: standardResourceMethod(toRecord(iam.policies), "list", "appbaseBackend.iam.policies.list"),
        retrieve: standardResourceMethod(toRecord(iam.policies), "retrieve", "appbaseBackend.iam.policies.retrieve"),
        update: standardResourceMethod(toRecord(iam.policies), "update", "appbaseBackend.iam.policies.update"),
      },
      accountBindingPolicy: {
        retrieve: standardResourceMethod(toRecord(iam.accountBindingPolicy), "retrieve", "appbaseBackend.iam.accountBindingPolicy.retrieve"),
        update: standardResourceMethod(toRecord(iam.accountBindingPolicy), "update", "appbaseBackend.iam.accountBindingPolicy.update"),
      },
      positions: {
        create: standardResourceMethod(iamPositions, "create", "appbaseBackend.iam.positions.create"),
        delete: standardResourceMethod(iamPositions, "delete", "appbaseBackend.iam.positions.delete"),
        update: standardResourceMethod(iamPositions, "update", "appbaseBackend.iam.positions.update"),
      },
      positionAssignments: {
        create: standardResourceMethod(iamPositionAssignments, "create", "appbaseBackend.iam.positionAssignments.create"),
        update: standardResourceMethod(iamPositionAssignments, "update", "appbaseBackend.iam.positionAssignments.update"),
      },
      roles: {
        create: standardResourceMethod(toRecord(iam.roles), "create", "appbaseBackend.iam.roles.create"),
        delete: standardResourceMethod(toRecord(iam.roles), "delete", "appbaseBackend.iam.roles.delete"),
        list: standardResourceMethod(toRecord(iam.roles), "list", "appbaseBackend.iam.roles.list"),
        retrieve: standardResourceMethod(toRecord(iam.roles), "retrieve", "appbaseBackend.iam.roles.retrieve"),
        update: standardResourceMethod(toRecord(iam.roles), "update", "appbaseBackend.iam.roles.update"),
        permissions: {
          create: standardResourceMethod(toRecord(iam.roles?.permissions), "create", "appbaseBackend.iam.roles.permissions.create"),
          delete: standardResourceMethod(toRecord(iam.roles?.permissions), "delete", "appbaseBackend.iam.roles.permissions.delete"),
          list: standardResourceMethod(toRecord(iam.roles?.permissions), "list", "appbaseBackend.iam.roles.permissions.list"),
        },
      },
      roleBindings: {
        create: standardResourceMethod(iamRoleBindings, "create", "appbaseBackend.iam.roleBindings.create"),
        delete: standardResourceMethod(iamRoleBindings, "delete", "appbaseBackend.iam.roleBindings.delete"),
      },
      securityEvents: {
        list: standardResourceMethod(toRecord(iam.securityEvents), "list", "appbaseBackend.iam.securityEvents.list"),
        retrieve: standardResourceMethod(toRecord(iam.securityEvents), "retrieve", "appbaseBackend.iam.securityEvents.retrieve"),
      },
      tenantApplications: {
        enable: standardResourceMethod(iamTenantApplications, "enable", "appbaseBackend.iam.tenantApplications.enable"),
        list: standardResourceMethod(iamTenantApplications, "list", "appbaseBackend.iam.tenantApplications.list"),
        provision: standardResourceMethod(iamTenantApplications, "provision", "appbaseBackend.iam.tenantApplications.provision"),
        retrieve: standardResourceMethod(iamTenantApplications, "retrieve", "appbaseBackend.iam.tenantApplications.retrieve"),
        update: standardResourceMethod(iamTenantApplications, "update", "appbaseBackend.iam.tenantApplications.update"),
        management: {
          disable: standardResourceMethod(toRecord(iamTenantApplications.management), "disable", "appbaseBackend.iam.tenantApplications.management.disable"),
          enable: standardResourceMethod(toRecord(iamTenantApplications.management), "enable", "appbaseBackend.iam.tenantApplications.management.enable"),
          provision: standardResourceMethod(toRecord(iamTenantApplications.management), "provision", "appbaseBackend.iam.tenantApplications.management.provision"),
          update: standardResourceMethod(toRecord(iamTenantApplications.management), "update", "appbaseBackend.iam.tenantApplications.management.update"),
        },
        summary: {
          retrieve: standardResourceMethod(toRecord(iamTenantApplications.summary), "retrieve", "appbaseBackend.iam.tenantApplications.summary.retrieve"),
        },
      },
      tenants: {
        create: standardResourceMethod(toRecord(iam.tenants), "create", "appbaseBackend.iam.tenants.create"),
        delete: standardResourceMethod(toRecord(iam.tenants), "delete", "appbaseBackend.iam.tenants.delete"),
        list: standardResourceMethod(toRecord(iam.tenants), "list", "appbaseBackend.iam.tenants.list"),
        retrieve: standardResourceMethod(toRecord(iam.tenants), "retrieve", "appbaseBackend.iam.tenants.retrieve"),
        update: standardResourceMethod(toRecord(iam.tenants), "update", "appbaseBackend.iam.tenants.update"),
        members: {
          create: standardResourceMethod(toRecord(iam.tenants?.members), "create", "appbaseBackend.iam.tenants.members.create"),
          delete: standardResourceMethod(toRecord(iam.tenants?.members), "delete", "appbaseBackend.iam.tenants.members.delete"),
          list: standardResourceMethod(toRecord(iam.tenants?.members), "list", "appbaseBackend.iam.tenants.members.list"),
          update: standardResourceMethod(toRecord(iam.tenants?.members), "update", "appbaseBackend.iam.tenants.members.update"),
        },
      },
      users: {
        create: standardResourceMethod(toRecord(iam.users), "create", "appbaseBackend.iam.users.create"),
        delete: standardResourceMethod(toRecord(iam.users), "delete", "appbaseBackend.iam.users.delete"),
        list: standardResourceMethod(toRecord(iam.users), "list", "appbaseBackend.iam.users.list"),
        retrieve: standardResourceMethod(toRecord(iam.users), "retrieve", "appbaseBackend.iam.users.retrieve"),
        update: standardResourceMethod(toRecord(iam.users), "update", "appbaseBackend.iam.users.update"),
      },
      oauth: oauthAdapted,
    },
    iamOauth: {
      iam: {
        oauth: oauthAdapted,
      },
    },
  };

  assertIamBackendSdkClient(adapter);
  return adapter;
}

function walkBackendOauthResourceTree(source: AnyRecord, tree: AnyRecord, prefix: string): AnyRecord {
  const adapted: AnyRecord = {};
  for (const [key, spec] of Object.entries(tree)) {
    if (Array.isArray(spec)) {
      adapted[key] = standardResourceMethod(source, key, `appbaseBackend.iamOauth.iam.oauth${prefix}.${key}`);
      continue;
    }
    adapted[key] = walkBackendOauthResourceTree(toRecord(source[key]), spec as AnyRecord, `${prefix}.${key}`);
  }
  return adapted;
}

function assertGeneratedIamBackendSdkSourceClient(client: unknown): void {
  const surface = getIamSdkSurface(client);
  const paths = getIamSdkObjectPaths(client);
  const missingMethods = findMissingBackendSourceMethods(surface, SDKWORK_IAM_BACKEND_SDK_REQUIRED_METHODS);

  if (paths.some((method) => method === "auth" || method.startsWith("auth."))) {
    throw new Error("Generated backend SDK client must not expose an auth namespace; login and session APIs belong to app API only");
  }

  const forbiddenLegacyNamespaces = findForbiddenMethods(paths, SDKWORK_IAM_BACKEND_SDK_FORBIDDEN_LEGACY_NAMESPACES);
  if (forbiddenLegacyNamespaces.length > 0) {
    throw new Error(`Generated backend SDK client exposes forbidden legacy IAM namespaces: ${forbiddenLegacyNamespaces.join(", ")}`);
  }

  const retiredMethods = surface.filter((method) =>
    SDKWORK_IAM_RETIRED_BACKEND_SDK_METHODS.includes(method as (typeof SDKWORK_IAM_RETIRED_BACKEND_SDK_METHODS)[number])
  );
  if (retiredMethods.length > 0) {
    throw new Error(
      `Generated backend SDK client exposes retired IAM backend resources: ${retiredMethods.join(", ")}`,
    );
  }

  if (missingMethods.length > 0) {
    throw new Error(`Generated backend SDK client is missing standard IAM methods: ${missingMethods.join(", ")}`);
  }
}

function standardResourceMethod(
  target: AnyRecord,
  methodName: string,
  resourceName: string,
): IamSdkMethod {
  const method = getBoundMethod(target, methodName);
  return async (...args: any[]) => {
    if (!method) {
      throw new Error(`Missing standard SDKWork IAM SDK resource: ${resourceName}`);
    }
    return unwrapIamSdkResponse(await method(...args));
  };
}

function pathResourceMethod(
  target: AnyRecord,
  methodName: string,
  resourceName: string,
  pathParamName: string,
): IamSdkMethod {
  return async (pathParamValue: string, ...args: any[]) => {
    const result = await callPathResourceMethod(target, methodName, pathParamName, pathParamValue, ...args);
    if (result === undefined) {
      throw new Error(`Missing standard SDKWork IAM SDK resource: ${resourceName}`);
    }
    return unwrapIamSdkResponse(result);
  };
}

function getBoundMethod(target: AnyRecord, methodName: string): IamSdkMethod | undefined {
  const method = target[methodName];
  if (typeof method !== "function") {
    return undefined;
  }

  return (...args: any[]) => method.call(target, ...args);
}

function getIamSdkObjectPaths(client: unknown): string[] {
  const paths = new Set<string>();
  const visited = new WeakSet<object>();

  function visit(node: unknown, path: string[]) {
    if (!node || typeof node !== "object") {
      return;
    }
    if (visited.has(node)) {
      return;
    }
    visited.add(node);

    for (const [key, value] of Object.entries(node)) {
      const next = [...path, key];
      paths.add(next.join("."));
      if (value && typeof value === "object") {
        visit(value, next);
      }
    }

    const prototype = Object.getPrototypeOf(node);
    if (!prototype || prototype === Object.prototype) {
      return;
    }

    for (const key of Object.getOwnPropertyNames(prototype)) {
      if (key !== "constructor") {
        paths.add([...path, key].join("."));
      }
    }
  }

  visit(client, []);
  return [...paths].sort();
}

function findMissingBackendSourceMethods(
  surface: readonly string[],
  requiredMethods: readonly string[],
): string[] {
  const surfaceSet = new Set(surface);
  return requiredMethods.filter((method) => {
    if (surfaceSet.has(method)) {
      return false;
    }
    if (method.startsWith("iam.oauth.")) {
      const alias = `iamOauth.iam.${method.slice("iam.".length)}`;
      if (surfaceSet.has(alias)) {
        return false;
      }
    }
    return true;
  });
}

function findMissingMethods(
  surface: readonly string[],
  requiredMethods: readonly string[],
): string[] {
  const surfaceSet = new Set(surface);
  return requiredMethods.filter((method) => !surfaceSet.has(method));
}

function findForbiddenMethods(
  surface: readonly string[],
  forbiddenMethods: readonly string[],
): string[] {
  const forbiddenSet = new Set(forbiddenMethods);
  return surface.filter((method) =>
    forbiddenSet.has(method) || forbiddenMethods.some((forbiddenMethod) => method.startsWith(`${forbiddenMethod}.`))
  );
}

function callPathResourceMethod(
  target: AnyRecord,
  methodName: string,
  pathParamName: string,
  pathParamValue: string,
  ...args: any[]
): Promise<unknown> | unknown {
  const method = target[methodName];
  if (typeof method !== "function") {
    return undefined;
  }

  if (prefersPathParamsObject(method)) {
    return method.call(target, { [pathParamName]: pathParamValue }, ...args);
  }

  try {
    return method.call(target, pathParamValue, ...args);
  } catch (error) {
    if (isPathParameterShapeError(error)) {
      return method.call(target, { [pathParamName]: pathParamValue }, ...args);
    }
    throw error;
  }
}

function prefersPathParamsObject(method: (...args: any[]) => unknown): boolean {
  return /\bpathParams\b/.test(String(method));
}

function isPathParameterShapeError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? "");
  return /path parameter|pathParams|deviceAuthorizationId/i.test(message);
}

function isSuccessCode(code: number | string | undefined): boolean {
  if (code === undefined || code === null) {
    return true;
  }

  const parsed = Number(trim(String(code)));
  return Number.isFinite(parsed) && isSdkWorkSuccessCode(parsed);
}

function toRecord(value: unknown): AnyRecord {
  return value && typeof value === "object" ? value as AnyRecord : {};
}
