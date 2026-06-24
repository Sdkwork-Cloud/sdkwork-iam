import { SDKWORK_IAM_OPERATION_IDS, SDKWORK_IAM_STANDARD } from "@sdkwork/iam-contracts";
import type { IamBackendOAuthResourceClient } from "./backend-oauth-ports";

export type { IamBackendOAuthResourceClient } from "./backend-oauth-ports";

export type IamSdkMethod = (...args: any[]) => Promise<unknown>;

export interface IamAppSdkClient {
  auth?: {
    passwordResetRequests?: {
      create?: IamSdkMethod;
    };
    passwordResets?: {
      create?: IamSdkMethod;
    };
    registrations?: {
      create?: IamSdkMethod;
    };
    sessions?: {
      create?: IamSdkMethod;
      loginContextSelection?: {
        create?: IamSdkMethod;
      };
      organizationSelection?: {
        create?: IamSdkMethod;
      };
      current?: {
        delete?: IamSdkMethod;
        retrieve?: IamSdkMethod;
        update?: IamSdkMethod;
      };
      refresh?: IamSdkMethod;
    };
  };
  oauth?: IamAppOAuthResourceClient;
  system?: IamAppSystemResourceClient;
  iam?: IamAppIamResourceClient;
}

export interface IamBackendSdkClient {
  iam?: IamBackendIamResourceClient;
  iamOauth?: {
    iam?: {
      oauth?: IamBackendOAuthResourceClient;
    };
  };
}

export interface IamAppIamResourceClient {
  organizations?: {
    list?: IamSdkMethod;
    tree?: {
      retrieve?: IamSdkMethod;
    };
  };
  organizationMemberships?: {
    list?: IamSdkMethod;
  };
  departments?: {
    list?: IamSdkMethod;
    tree?: {
      retrieve?: IamSdkMethod;
    };
  };
  departmentAssignments?: {
    list?: IamSdkMethod;
  };
  positions?: {
    list?: IamSdkMethod;
  };
  positionAssignments?: {
    list?: IamSdkMethod;
  };
  roleBindings?: {
    list?: IamSdkMethod;
  };
  users?: {
    current?: {
      retrieve?: IamSdkMethod;
      update?: IamSdkMethod;
      emailBindings?: {
        create?: IamSdkMethod;
        delete?: IamSdkMethod;
      };
      phoneBindings?: {
        create?: IamSdkMethod;
        delete?: IamSdkMethod;
      };
      password?: {
        update?: IamSdkMethod;
      };
    };
  };
}

export interface IamAppSystemResourceClient {
  iam?: {
    runtime?: {
      retrieve?: IamSdkMethod;
    };
    verificationPolicy?: {
      retrieve?: IamSdkMethod;
    };
    accountBindingPolicy?: {
      retrieve?: IamSdkMethod;
    };
  };
}

export interface IamAppOAuthResourceClient {
  providers?: {
    list?: IamSdkMethod;
  };
  authorizationUrls?: {
    create?: IamSdkMethod;
  };
  authorizations?: {
    completions?: {
      create?: IamSdkMethod;
    };
  };
  deviceAuthorizations?: {
    create?: IamSdkMethod;
    retrieve?: IamSdkMethod;
    scans?: {
      create?: IamSdkMethod;
    };
    passwordCompletions?: {
      create?: IamSdkMethod;
    };
    sessionExchanges?: {
      create?: IamSdkMethod;
    };
  };
  callbacks?: {
    handleGet?: IamSdkMethod;
    handlePost?: IamSdkMethod;
  };
  miniProgramSessions?: {
    create?: IamSdkMethod;
  };
  sessions?: {
    create?: IamSdkMethod;
  };
  accountLinks?: {
    list?: IamSdkMethod;
    delete?: IamSdkMethod;
  };
  grants?: {
    list?: IamSdkMethod;
    delete?: IamSdkMethod;
  };
}

export interface IamBackendIamResourceClient {
  accessCredentials?: {
    create?: IamSdkMethod;
  };
  applications?: {
    register?: IamSdkMethod;
  };
  apiKeys?: {
    list?: IamSdkMethod;
    revoke?: IamSdkMethod;
  };
  auditEvents?: {
    list?: IamSdkMethod;
  };
  organizations?: {
    create?: IamSdkMethod;
    delete?: IamSdkMethod;
    retrieve?: IamSdkMethod;
    update?: IamSdkMethod;
  };
  organizationMemberships?: {
    create?: IamSdkMethod;
    update?: IamSdkMethod;
  };
  departments?: {
    create?: IamSdkMethod;
    delete?: IamSdkMethod;
    retrieve?: IamSdkMethod;
    update?: IamSdkMethod;
  };
  departmentAssignments?: {
    create?: IamSdkMethod;
    update?: IamSdkMethod;
  };
  permissions?: {
    create?: IamSdkMethod;
    delete?: IamSdkMethod;
    list?: IamSdkMethod;
    retrieve?: IamSdkMethod;
    update?: IamSdkMethod;
  };
  policies?: {
    create?: IamSdkMethod;
    delete?: IamSdkMethod;
    list?: IamSdkMethod;
    retrieve?: IamSdkMethod;
    update?: IamSdkMethod;
  };
  accountBindingPolicy?: {
    retrieve?: IamSdkMethod;
    update?: IamSdkMethod;
  };
  positions?: {
    create?: IamSdkMethod;
    delete?: IamSdkMethod;
    update?: IamSdkMethod;
  };
  positionAssignments?: {
    create?: IamSdkMethod;
    update?: IamSdkMethod;
  };
  roles?: {
    create?: IamSdkMethod;
    delete?: IamSdkMethod;
    list?: IamSdkMethod;
    retrieve?: IamSdkMethod;
    update?: IamSdkMethod;
    permissions?: {
      create?: IamSdkMethod;
      delete?: IamSdkMethod;
      list?: IamSdkMethod;
    };
  };
  roleBindings?: {
    create?: IamSdkMethod;
    delete?: IamSdkMethod;
  };
  securityEvents?: {
    list?: IamSdkMethod;
  };
  tenantApplications?: {
    enable?: IamSdkMethod;
    provision?: IamSdkMethod;
    retrieve?: IamSdkMethod;
    update?: IamSdkMethod;
  };
  tenants?: {
    create?: IamSdkMethod;
    delete?: IamSdkMethod;
    list?: IamSdkMethod;
    retrieve?: IamSdkMethod;
    update?: IamSdkMethod;
    members?: {
      create?: IamSdkMethod;
      delete?: IamSdkMethod;
      list?: IamSdkMethod;
      update?: IamSdkMethod;
    };
  };
  users?: {
    create?: IamSdkMethod;
    delete?: IamSdkMethod;
    list?: IamSdkMethod;
    retrieve?: IamSdkMethod;
    update?: IamSdkMethod;
  };
  oauth?: IamBackendOAuthResourceClient;
}

export interface IamSdkResourceClient {
  apiKeys?: IamBackendIamResourceClient["apiKeys"];
  accessCredentials?: IamBackendIamResourceClient["accessCredentials"];
  applications?: IamBackendIamResourceClient["applications"];
  auditEvents?: IamBackendIamResourceClient["auditEvents"];
  organizations?: NonNullable<IamAppIamResourceClient["organizations"]> & NonNullable<IamBackendIamResourceClient["organizations"]>;
  organizationMemberships?: NonNullable<IamAppIamResourceClient["organizationMemberships"]> & NonNullable<IamBackendIamResourceClient["organizationMemberships"]>;
  departments?: NonNullable<IamAppIamResourceClient["departments"]> & NonNullable<IamBackendIamResourceClient["departments"]>;
  departmentAssignments?: NonNullable<IamAppIamResourceClient["departmentAssignments"]> & NonNullable<IamBackendIamResourceClient["departmentAssignments"]>;
  permissions?: IamBackendIamResourceClient["permissions"];
  positions?: NonNullable<IamAppIamResourceClient["positions"]> & NonNullable<IamBackendIamResourceClient["positions"]>;
  positionAssignments?: NonNullable<IamAppIamResourceClient["positionAssignments"]> & NonNullable<IamBackendIamResourceClient["positionAssignments"]>;
  policies?: IamBackendIamResourceClient["policies"];
  roles?: IamBackendIamResourceClient["roles"];
  roleBindings?: NonNullable<IamAppIamResourceClient["roleBindings"]> & NonNullable<IamBackendIamResourceClient["roleBindings"]>;
  securityEvents?: IamBackendIamResourceClient["securityEvents"];
  tenantApplications?: IamBackendIamResourceClient["tenantApplications"];
  tenants?: IamBackendIamResourceClient["tenants"];
  users?: NonNullable<IamAppIamResourceClient["users"]> & NonNullable<IamBackendIamResourceClient["users"]>;
  oauth?: IamBackendOAuthResourceClient;
}

export const SDKWORK_IAM_APP_SDK_REQUIRED_METHODS = [
  ...requiredSdkMethodsForPrefix(SDKWORK_IAM_STANDARD.api.appPrefix),
] as const;

export const SDKWORK_IAM_BACKEND_SDK_REQUIRED_METHODS = [
  ...requiredSdkMethodsForPrefix(SDKWORK_IAM_STANDARD.api.backendPrefix),
] as const;

export const SDKWORK_IAM_BACKEND_SDK_FORBIDDEN_METHODS = [
  ...requiredSdkMethodsForPrefix(SDKWORK_IAM_STANDARD.api.appPrefix).filter((method) => method.startsWith("iam.")),
] as const;

export const SDKWORK_IAM_APP_SDK_FORBIDDEN_LEGACY_METHODS = [
  "auth.createSendSmsCode",
  "auth.createSession",
  "auth.createVerifySmsCode",
  "auth.getCurrentUser",
  "auth.getOauthUrl",
  "auth.login",
  "auth.logout",
  "auth.oauthAuthorizationUrls",
  "auth.oauthLogin",
  "auth.oauthSessions",
  "auth.refreshToken",
  "auth.register",
  "auth.requestPasswordResetChallenge",
  "auth.resetPassword",
  "auth.sendSmsCode",
  "auth.verificationCodes",
  "auth.verifySmsCode",
  "user",
  "user.getUserProfile",
  "user.updateUserProfile",
] as const;

export const SDKWORK_IAM_BACKEND_SDK_FORBIDDEN_LEGACY_NAMESPACES = [
  "apiKey",
  "apikey",
  "auth",
  "permission",
  "policy",
  "role",
  "security",
  "tenant",
  "user",
] as const;

export const SDKWORK_IAM_RETIRED_BACKEND_SDK_METHODS = [
  "iam.organizations.members.create",
  "iam.organizations.members.delete",
  "iam.organizations.members.list",
  "iam.organizations.members.update",
  "iam.users.roles.create",
  "iam.users.roles.delete",
  "iam.users.roles.list",
] as const;

const SDKWORK_IAM_RETIRED_ORGANIZATION_MEMBER_METHODS = [
  "iam.organizations.members.create",
  "iam.organizations.members.delete",
  "iam.organizations.members.list",
  "iam.organizations.members.update",
] as const;

const SDKWORK_IAM_RETIRED_DIRECT_USER_ROLE_METHODS = [
  "iam.users.roles.create",
  "iam.users.roles.delete",
  "iam.users.roles.list",
] as const;

export function assertIamAppSdkClient(client: unknown): asserts client is IamAppSdkClient {
  const surface = getIamSdkSurface(client);
  const paths = getIamSdkPaths(client);
  const retiredQrMethods = surface.filter((method) =>
    method.startsWith("auth.loginQrCodes.") || method.startsWith("auth.loginQrCodeCallbacks.")
  );
  if (retiredQrMethods.length > 0) {
    throw new Error(
      `Generated app SDK client exposes retired IAM QR login resources: ${retiredQrMethods.join(", ")}. Use oauth.deviceAuthorizations methods.`,
    );
  }

  const retiredOpenPlatformQrMethods = surface.filter((method) => method.startsWith("openPlatform.qrAuth.sessions."));
  if (retiredOpenPlatformQrMethods.length > 0) {
    throw new Error(
      `Generated app SDK client exposes retired openPlatform QR auth resources: ${retiredOpenPlatformQrMethods.join(", ")}. Use oauth.deviceAuthorizations methods.`,
    );
  }

  const forbiddenLegacyMethods = findForbiddenMethods(paths, SDKWORK_IAM_APP_SDK_FORBIDDEN_LEGACY_METHODS);
  if (forbiddenLegacyMethods.length > 0) {
    throw new Error(`Generated app SDK client exposes forbidden legacy IAM methods: ${forbiddenLegacyMethods.join(", ")}`);
  }

  const missingMethods = findMissingMethods(surface, SDKWORK_IAM_APP_SDK_REQUIRED_METHODS);

  if (missingMethods.length > 0) {
    throw new Error(`Generated app SDK client is missing standard IAM methods: ${missingMethods.join(", ")}`);
  }

}

export function assertIamBackendSdkClient(client: unknown): asserts client is IamBackendSdkClient {
  const surface = getIamSdkSurface(client);
  const paths = getIamSdkPaths(client);
  const missingMethods = findMissingMethods(surface, SDKWORK_IAM_BACKEND_SDK_REQUIRED_METHODS);

  if (paths.some((method) => method === "auth" || method.startsWith("auth."))) {
    throw new Error("Generated backend SDK client must not expose an auth namespace; login and session APIs belong to app API only");
  }

  const forbiddenLegacyNamespaces = findForbiddenMethods(paths, SDKWORK_IAM_BACKEND_SDK_FORBIDDEN_LEGACY_NAMESPACES);
  if (forbiddenLegacyNamespaces.length > 0) {
    throw new Error(`Generated backend SDK client exposes forbidden legacy IAM namespaces: ${forbiddenLegacyNamespaces.join(", ")}`);
  }

  const forbiddenMethods = surface.filter((method) => SDKWORK_IAM_BACKEND_SDK_FORBIDDEN_METHODS.includes(method));
  if (forbiddenMethods.length > 0) {
    throw new Error(`Generated backend SDK client must not expose app-only IAM resources: ${forbiddenMethods.join(", ")}`);
  }

  const retiredOrganizationMemberMethods = surface.filter((method) =>
    SDKWORK_IAM_RETIRED_ORGANIZATION_MEMBER_METHODS.includes(method as (typeof SDKWORK_IAM_RETIRED_ORGANIZATION_MEMBER_METHODS)[number])
  );
  if (retiredOrganizationMemberMethods.length > 0) {
    throw new Error(
      `Generated backend SDK client exposes retired IAM organization member resources: ${retiredOrganizationMemberMethods.join(", ")}. Use iam.organizationMemberships methods.`,
    );
  }

  const retiredDirectUserRoleMethods = surface.filter((method) =>
    SDKWORK_IAM_RETIRED_DIRECT_USER_ROLE_METHODS.includes(method as (typeof SDKWORK_IAM_RETIRED_DIRECT_USER_ROLE_METHODS)[number])
  );
  if (retiredDirectUserRoleMethods.length > 0) {
    throw new Error(
      `Generated backend SDK client exposes retired IAM direct user role resources: ${retiredDirectUserRoleMethods.join(", ")}. Use iam.roleBindings for scoped role assignment.`,
    );
  }

  if (missingMethods.length > 0) {
    throw new Error(`Generated backend SDK client is missing standard IAM methods: ${missingMethods.join(", ")}`);
  }
}

export function getIamSdkSurface(client: unknown): string[] {
  return getIamSdkPaths(client, { functionsOnly: true });
}

function getIamSdkPaths(
  client: unknown,
  options: { functionsOnly?: boolean } = {},
): string[] {
  const methods = new Set<string>();
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
      if (typeof value === "function") {
        methods.add(next.join("."));
      } else {
        if (!options.functionsOnly) {
          methods.add(next.join("."));
        }
        visit(value, next);
      }
    }

    const prototype = Object.getPrototypeOf(node);
    if (!prototype || prototype === Object.prototype) {
      return;
    }

    for (const key of Object.getOwnPropertyNames(prototype)) {
      if (key === "constructor") {
        continue;
      }
      const descriptor = Object.getOwnPropertyDescriptor(prototype, key);
      if (typeof descriptor?.value === "function") {
        methods.add([...path, key].join("."));
      }
    }
  }

  visit(client, []);
  return [...methods].sort();
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

function requiredSdkMethodsForPrefix(prefix: string): string[] {
  return Object.values(SDKWORK_IAM_OPERATION_IDS)
    .filter((operation) => operation.path.startsWith(prefix))
    .map((operation) => operation.operationId.startsWith(`${operation.tag}.`)
      ? operation.operationId
      : `${operation.tag}.${operation.operationId}`)
    .sort();
}
