import {
  isPlatformOrganizationId,
  resolveSessionOrganizationId,
  type IamLoginScope,
} from './login-context.ts';

export type IamEnvironment = "dev" | "test" | "prod";
export type IamDeploymentMode = "saas" | "local" | "private";
export type IamAuthLevel = "anonymous" | "password" | "mfa" | "system";
export type IamShardingStrategy = "tenant" | "organization" | "user" | "single";
export type IamDomainModelName = keyof typeof SDKWORK_IAM_TABLES;
export type IamDomainModelOwnership = "tenant" | "global";
export type IamCapabilityName =
  | "accountIdentity"
  | "accessControl"
  | "apiAccess"
  | "departmentManagement"
  | "oauthManagement"
  | "organizationManagement"
  | "positionManagement"
  | "securityAudit"
  | "sessionSecurity"
  | "tenantManagement"
  | "userDirectory";

export interface IamUserSurface {
  app: boolean;
  organizationMember: boolean;
}

export interface IamAppContext {
  appId: string;
  authLevel: IamAuthLevel;
  dataScope: string[];
  deploymentMode: IamDeploymentMode;
  environment: IamEnvironment;
  loginScope?: IamLoginScope;
  organizationId?: string;
  permissionScope: string[];
  sessionId: string;
  standardRoleCodes?: readonly string[];
  tenantId: string;
  userId: string;
  userSurface?: IamUserSurface;
}

export interface IamShardingContext {
  databaseKey?: string;
  schema?: string;
  shardingKey: string;
  shardingStrategy: IamShardingStrategy;
  tablePartition?: string;
}

export interface IamOperationContract {
  authMode: "anonymous" | "dual-token" | "refresh-token";
  forbidCredentialHeaders: boolean;
  method: "DELETE" | "GET" | "PATCH" | "POST" | "PUT";
  operationId: string;
  path: string;
  queryParameters?: readonly string[];
  security: "dualToken" | "public" | "refreshToken";
  tag: "auth" | "iam" | "oauth" | "system";
}

export interface IamDomainModelContract {
  capabilities: readonly IamCapabilityName[];
  domain: "iam";
  fields: readonly string[];
  name: IamDomainModelName;
  ownership: IamDomainModelOwnership;
  table: (typeof SDKWORK_IAM_TABLES)[IamDomainModelName];
}

export interface IamCapabilityContract {
  domain: "iam";
  models: readonly IamDomainModelName[];
  name: IamCapabilityName;
  operations: readonly string[];
  sdkNamespaces: readonly ("auth" | "iam" | "oauth" | "system")[];
}

export const SDKWORK_IAM_STANDARD = {
  api: {
    appPrefix: "/app/v3/api",
    backendPrefix: "/backend/v3/api",
    openapi: "3.1.2",
  },
  databasePrefix: "iam",
  domain: "iam",
  sdkNamespaces: ["auth", "iam", "oauth", "system"],
} as const;

export const SDKWORK_STANDARD_ROLE_CODES = {
  APP_USER: "app_user",
  ORG_ADMIN: "org_admin",
  ORG_ASSISTANT: "org_assistant",
  ORG_AUDITOR: "org_auditor",
  ORG_FINANCE: "org_finance",
  ORG_OPERATIONS: "org_operations",
  PLATFORM_SYSTEM_ADMIN: "platform_system_admin",
  PLATFORM_SUPER_ADMIN: "platform_super_admin",
  LEGACY_OWNER: "owner",
} as const;

export type SdkworkStandardRoleCode =
  typeof SDKWORK_STANDARD_ROLE_CODES[keyof typeof SDKWORK_STANDARD_ROLE_CODES];

export const SDKWORK_STANDARD_ROLE_CODE_LIST: readonly SdkworkStandardRoleCode[] = [
  SDKWORK_STANDARD_ROLE_CODES.APP_USER,
  SDKWORK_STANDARD_ROLE_CODES.ORG_ADMIN,
  SDKWORK_STANDARD_ROLE_CODES.ORG_ASSISTANT,
  SDKWORK_STANDARD_ROLE_CODES.ORG_AUDITOR,
  SDKWORK_STANDARD_ROLE_CODES.ORG_FINANCE,
  SDKWORK_STANDARD_ROLE_CODES.ORG_OPERATIONS,
  SDKWORK_STANDARD_ROLE_CODES.PLATFORM_SYSTEM_ADMIN,
  SDKWORK_STANDARD_ROLE_CODES.PLATFORM_SUPER_ADMIN,
] as const;

export const SDKWORK_IAM_HEADERS = {
  accessToken: "Access-Token",
  authToken: {
    header: "Authorization",
    scheme: "Bearer",
  },
} as const;

export * from "./list-page.ts";

export const SDKWORK_STANDARD_PAGE_QUERY_PARAMS = ["page", "page_size", "cursor", "sort", "q"] as const;

export function isSdkworkQueryParameterName(name: string): boolean {
  if (!/^[a-z][a-z0-9]*(?:_[a-z0-9]+)*$/.test(name)) {
    return false;
  }
  return !["search_query", "keyword", "search", "pageNo", "pageSize", "searchQuery", "size", "page_no"].includes(name);
}

export const SDKWORK_IAM_TABLES = {
  apiKey: "iam_api_key",
  auditEvent: "iam_audit_event",
  credential: "iam_credential",
  device: "iam_device",
  mfaFactor: "iam_mfa_factor",
  department: "iam_department",
  departmentAssignment: "iam_department_assignment",
  departmentClosure: "iam_department_closure",
  organization: "iam_organization",
  organizationClosure: "iam_organization_closure",
  organizationMembership: "iam_organization_membership",
  permission: "iam_permission",
  policy: "iam_policy",
  position: "iam_position",
  positionAssignment: "iam_position_assignment",
  role: "iam_role",
  roleBinding: "iam_role_binding",
  rolePermission: "iam_role_permission",
  securityEvent: "iam_security_event",
  session: "iam_session",
  tenant: "iam_tenant",
  user: "iam_user",
  userIdentity: "iam_user_identity",
  oauthIntegration: "iam_oauth_integration",
  oauthClient: "iam_oauth_client",
  oauthSecret: "iam_oauth_secret",
  oauthSurface: "iam_oauth_surface",
  oauthWebhookConfig: "iam_oauth_webhook_config",
} as const;

export const SDKWORK_IAM_DOMAIN_MODELS = [
  model("tenant", "tenant", ["tenantManagement"], [
    "id",
    "tenant_id",
    "code",
    "name",
    "status",
    "created_at",
    "updated_at",
  ]),
  model("organization", "tenant", ["organizationManagement"], [
    "id",
    "tenant_id",
    "parent_organization_id",
    "code",
    "name",
    "organization_kind",
    "tenant_boundary_kind",
    "data_boundary_kind",
    "app_boundary_enabled",
    "verification_status",
    "path",
    "status",
    "created_at",
    "updated_at",
  ]),
  model("organizationClosure", "tenant", ["organizationManagement"], [
    "id",
    "tenant_id",
    "ancestor_organization_id",
    "descendant_organization_id",
    "depth",
    "created_at",
  ]),
  model("organizationMembership", "tenant", ["organizationManagement", "userDirectory"], [
    "id",
    "tenant_id",
    "organization_id",
    "user_id",
    "membership_kind",
    "employee_no",
    "display_name",
    "status",
    "joined_at",
    "left_at",
    "remark",
  ]),
  model("department", "tenant", ["departmentManagement", "organizationManagement"], [
    "id",
    "tenant_id",
    "organization_id",
    "parent_department_id",
    "code",
    "name",
    "path",
    "status",
    "created_at",
    "updated_at",
  ]),
  model("departmentClosure", "tenant", ["departmentManagement", "organizationManagement"], [
    "id",
    "tenant_id",
    "organization_id",
    "ancestor_department_id",
    "descendant_department_id",
    "depth",
    "created_at",
  ]),
  model("departmentAssignment", "tenant", ["departmentManagement", "userDirectory"], [
    "id",
    "tenant_id",
    "organization_id",
    "organization_membership_id",
    "department_id",
    "user_id",
    "assignment_kind",
    "is_primary",
    "effective_from",
    "effective_to",
    "status",
    "created_at",
    "updated_at",
  ]),
  model("position", "tenant", ["positionManagement", "departmentManagement"], [
    "id",
    "tenant_id",
    "organization_id",
    "department_id",
    "code",
    "name",
    "position_kind",
    "rank_level",
    "status",
    "created_at",
    "updated_at",
  ]),
  model("positionAssignment", "tenant", ["positionManagement", "departmentManagement", "userDirectory"], [
    "id",
    "tenant_id",
    "organization_id",
    "department_assignment_id",
    "position_id",
    "user_id",
    "is_primary",
    "effective_from",
    "effective_to",
    "status",
    "created_at",
    "updated_at",
  ]),
  model("roleBinding", "tenant", ["accessControl", "organizationManagement", "departmentManagement"], [
    "id",
    "tenant_id",
    "organization_id",
    "role_id",
    "principal_kind",
    "principal_id",
    "scope_kind",
    "scope_id",
    "effect",
    "condition_json",
    "status",
    "created_at",
    "updated_at",
  ]),
  model("user", "tenant", ["userDirectory", "accountIdentity"], [
    "id",
    "tenant_id",
    "username",
    "display_name",
    "email",
    "phone",
    "avatar_media_resource_id",
    "avatar_object_blob_id",
    "avatar_resource_snapshot",
    "status",
    "created_at",
    "updated_at",
  ]),
  model("userIdentity", "tenant", ["accountIdentity"], [
    "id",
    "tenant_id",
    "user_id",
    "provider",
    "subject",
    "email",
    "created_at",
  ]),
  model("credential", "tenant", ["accountIdentity", "sessionSecurity"], [
    "id",
    "tenant_id",
    "user_id",
    "credential_type",
    "credential_hash",
    "status",
    "expires_at",
    "created_at",
    "updated_at",
  ]),
  model("session", "tenant", ["sessionSecurity"], [
    "id",
    "tenant_id",
    "organization_id",
    "user_id",
    "app_id",
    "environment",
    "deployment_mode",
    "auth_level",
    "auth_token_hash",
    "access_token_hash",
    "refresh_token_hash",
    "sharding_key",
    "sharding_strategy",
    "data_scope_json",
    "permission_scope_json",
    "expires_at",
    "revoked_at",
    "created_at",
    "updated_at",
  ]),
  model("mfaFactor", "tenant", ["sessionSecurity"], [
    "id",
    "tenant_id",
    "user_id",
    "factor_type",
    "secret_ref",
    "status",
    "created_at",
    "updated_at",
  ]),
  model("device", "tenant", ["sessionSecurity"], [
    "id",
    "tenant_id",
    "user_id",
    "device_fingerprint",
    "name",
    "trusted",
    "last_seen_at",
    "created_at",
  ]),
  model("role", "tenant", ["accessControl"], [
    "id",
    "tenant_id",
    "code",
    "name",
    "status",
    "created_at",
    "updated_at",
  ]),
  model("permission", "global", ["accessControl"], [
    "id",
    "code",
    "name",
    "resource",
    "action",
    "created_at",
  ]),
  model("policy", "tenant", ["accessControl"], [
    "id",
    "tenant_id",
    "code",
    "name",
    "policy_json",
    "status",
    "created_at",
    "updated_at",
  ]),
  model("rolePermission", "tenant", ["accessControl"], [
    "id",
    "tenant_id",
    "role_id",
    "permission_id",
    "created_at",
  ]),
  model("apiKey", "tenant", ["apiAccess"], [
    "id",
    "tenant_id",
    "organization_id",
    "user_id",
    "name",
    "key_hash",
    "permission_scope_json",
    "status",
    "expires_at",
    "created_at",
    "updated_at",
  ]),
  model("securityEvent", "tenant", ["securityAudit"], [
    "id",
    "tenant_id",
    "organization_id",
    "user_id",
    "session_id",
    "event_type",
    "severity",
    "detail_json",
    "created_at",
  ]),
  model("auditEvent", "tenant", ["securityAudit"], [
    "id",
    "tenant_id",
    "organization_id",
    "actor_user_id",
    "action",
    "resource_type",
    "resource_id",
    "request_id",
    "app_id",
    "environment",
    "sharding_key",
    "detail_json",
    "created_at",
  ]),
] as const satisfies readonly IamDomainModelContract[];

const app = SDKWORK_IAM_STANDARD.api.appPrefix;
const backend = SDKWORK_IAM_STANDARD.api.backendPrefix;

export const SDKWORK_IAM_API_ROUTES = {
  auth: {
    passwordResetRequests: {
      create: operation("POST", `${app}/auth/password_reset_requests`, "auth", "passwordResetRequests.create", "public", {
        forbidCredentialHeaders: true,
      }),
    },
    passwordResets: {
      create: operation("POST", `${app}/auth/password_resets`, "auth", "passwordResets.create", "public", {
        forbidCredentialHeaders: true,
      }),
    },
    registrations: {
      create: operation("POST", `${app}/auth/registrations`, "auth", "registrations.create", "public", {
        forbidCredentialHeaders: true,
      }),
    },
    sessions: {
      create: operation("POST", `${app}/auth/sessions`, "auth", "sessions.create", "public", {
        forbidCredentialHeaders: true,
      }),
      organizationSelection: {
        create: operation(
          "POST",
          `${app}/auth/sessions/organization_selection`,
          "auth",
          "sessions.organizationSelection.create",
          "public",
          { forbidCredentialHeaders: true },
        ),
      },
      loginContextSelection: {
        create: operation(
          "POST",
          `${app}/auth/sessions/login_context_selection`,
          "auth",
          "sessions.loginContextSelection.create",
          "public",
          { forbidCredentialHeaders: true },
        ),
      },
      current: {
        delete: operation("DELETE", `${app}/auth/sessions/current`, "auth", "sessions.current.delete", "dualToken"),
        retrieve: operation("GET", `${app}/auth/sessions/current`, "auth", "sessions.current.retrieve", "dualToken"),
        update: operation("PATCH", `${app}/auth/sessions/current`, "auth", "sessions.current.update", "dualToken"),
      },
      refresh: operation("POST", `${app}/auth/sessions/refresh`, "auth", "sessions.refresh", "refreshToken"),
    },
  },
  oauth: {
    providers: {
      list: operation("GET", `${app}/oauth/providers`, "oauth", "oauth.providers.list", "public"),
    },
    authorizationUrls: {
      create: operation("POST", `${app}/oauth/authorization_urls`, "oauth", "oauth.authorizationUrls.create", "public", {
        forbidCredentialHeaders: true,
      }),
    },
    authorizations: {
      completions: {
        create: operation(
          "POST",
          `${app}/oauth/authorizations/{authorizationStateId}/completions`,
          "oauth",
          "oauth.authorizations.completions.create",
          "dualToken",
        ),
      },
    },
    deviceAuthorizations: {
      create: operation(
        "POST",
        `${app}/oauth/device_authorizations`,
        "oauth",
        "oauth.deviceAuthorizations.create",
        "public",
        { forbidCredentialHeaders: true },
      ),
      retrieve: operation(
        "GET",
        `${app}/oauth/device_authorizations/{deviceAuthorizationId}`,
        "oauth",
        "oauth.deviceAuthorizations.retrieve",
        "public",
      ),
      scans: {
        create: operation(
          "POST",
          `${app}/oauth/device_authorizations/{deviceAuthorizationId}/scans`,
          "oauth",
          "oauth.deviceAuthorizations.scans.create",
          "public",
        ),
      },
      passwordCompletions: {
        create: operation(
          "POST",
          `${app}/oauth/device_authorizations/{deviceAuthorizationId}/password_completions`,
          "oauth",
          "oauth.deviceAuthorizations.passwordCompletions.create",
          "public",
          { forbidCredentialHeaders: true },
        ),
      },
      sessionExchanges: {
        create: operation(
          "POST",
          `${app}/oauth/device_authorizations/{deviceAuthorizationId}/session_exchanges`,
          "oauth",
          "oauth.deviceAuthorizations.sessionExchanges.create",
          "public",
        ),
      },
    },
    callbacks: {
      retrieve: operation("GET", `${app}/oauth/callbacks/{providerCode}`, "oauth", "oauth.callbacks.retrieve", "public", {
        forbidCredentialHeaders: true,
      }),
      create: operation("POST", `${app}/oauth/callbacks/{providerCode}`, "oauth", "oauth.callbacks.create", "public", {
        forbidCredentialHeaders: true,
      }),
    },
    miniProgramSessions: {
      create: operation("POST", `${app}/oauth/mini_program_sessions`, "oauth", "oauth.miniProgramSessions.create", "public", {
        forbidCredentialHeaders: true,
      }),
    },
    sessions: {
      create: operation("POST", `${app}/oauth/sessions`, "oauth", "oauth.sessions.create", "public", {
        forbidCredentialHeaders: true,
      }),
    },
    accountLinks: {
      list: operation("GET", `${app}/oauth/account_links`, "oauth", "oauth.accountLinks.list", "dualToken"),
      delete: operation("DELETE", `${app}/oauth/account_links/{accountLinkId}`, "oauth", "oauth.accountLinks.delete", "dualToken"),
    },
    grants: {
      list: operation("GET", `${app}/oauth/grants`, "oauth", "oauth.grants.list", "dualToken"),
      delete: operation("DELETE", `${app}/oauth/grants/{grantId}`, "oauth", "oauth.grants.delete", "dualToken"),
    },
  },
  system: {
    iam: {
      runtime: {
        retrieve: operation("GET", `${app}/system/iam/runtime`, "system", "iam.runtime.retrieve", "public"),
      },
      verificationPolicy: {
        retrieve: operation("GET", `${app}/system/iam/verification_policy`, "system", "iam.verificationPolicy.retrieve", "public"),
      },
      accountBindingPolicy: {
        retrieve: operation("GET", `${app}/system/iam/account_binding_policy`, "system", "iam.accountBindingPolicy.retrieve", "public"),
      },
    },
  },
  iam: {
    apiKeys: {
      list: operation("GET", `${backend}/iam/api_keys`, "iam", "apiKeys.list", "dualToken"),
      revoke: operation("POST", `${backend}/iam/api_keys/{apiKeyId}/revoke`, "iam", "apiKeys.revoke", "dualToken"),
    },
    accessCredentials: {
      create: operation("POST", `${backend}/iam/access_credentials`, "iam", "accessCredentials.create", "public"),
    },
    applications: {
      register: operation("POST", `${backend}/iam/applications/register`, "iam", "applications.register", "public"),
    },
    tenantApplications: {
      list: operation("GET", `${backend}/iam/tenants/{tenantId}/applications`, "iam", "tenantApplications.list", "dualToken"),
      create: operation("POST", `${backend}/iam/tenant_applications`, "iam", "tenantApplications.create", "public"),
      retrieve: operation("GET", `${backend}/iam/tenant_applications/{tenantApplicationId}`, "iam", "tenantApplications.retrieve", "dualToken"),
      enable: operation("POST", `${backend}/iam/tenant_applications/{tenantApplicationId}/enable`, "iam", "tenantApplications.enable", "public"),
      update: operation("PATCH", `${backend}/iam/tenant_applications/{tenantApplicationId}`, "iam", "tenantApplications.update", "public"),
      management: {
        create: operation("POST", `${backend}/iam/tenants/{tenantId}/applications`, "iam", "tenantApplications.management.create", "dualToken"),
        update: operation("PATCH", `${backend}/iam/tenants/{tenantId}/applications/{tenantApplicationId}`, "iam", "tenantApplications.management.update", "dualToken"),
        enable: operation("POST", `${backend}/iam/tenants/{tenantId}/applications/{tenantApplicationId}/enable`, "iam", "tenantApplications.management.enable", "dualToken"),
        disable: operation("POST", `${backend}/iam/tenants/{tenantId}/applications/{tenantApplicationId}/disable`, "iam", "tenantApplications.management.disable", "dualToken"),
      },
      summary: {
        retrieve: operation("GET", `${backend}/iam/tenants/{tenantId}/applications/summary`, "iam", "tenantApplications.summary.retrieve", "dualToken"),
      },
    },
    auditEvents: {
      list: operation("GET", `${backend}/iam/audit_events`, "iam", "auditEvents.list", "dualToken"),
      retrieve: operation("GET", `${backend}/iam/audit_events/{auditEventId}`, "iam", "auditEvents.retrieve", "dualToken"),
    },
    organizations: {
      create: operation("POST", `${backend}/iam/organizations`, "iam", "organizations.create", "dualToken"),
      delete: operation("DELETE", `${backend}/iam/organizations/{organizationId}`, "iam", "organizations.delete", "dualToken"),
      list: operation("GET", `${app}/iam/organizations`, "iam", "organizations.list", "dualToken"),
      retrieve: operation("GET", `${backend}/iam/organizations/{organizationId}`, "iam", "organizations.retrieve", "dualToken"),
      tree: {
        retrieve: operation("GET", `${app}/iam/organizations/tree`, "iam", "organizations.tree.retrieve", "dualToken"),
      },
      update: operation("PATCH", `${backend}/iam/organizations/{organizationId}`, "iam", "organizations.update", "dualToken"),
    },
    organizationMemberships: {
      create: operation("POST", `${backend}/iam/organization_memberships`, "iam", "organizationMemberships.create", "dualToken"),
      list: operation("GET", `${app}/iam/organization_memberships`, "iam", "organizationMemberships.list", "dualToken"),
      update: operation("PATCH", `${backend}/iam/organization_memberships/{membershipId}`, "iam", "organizationMemberships.update", "dualToken"),
    },
    departments: {
      create: operation("POST", `${backend}/iam/departments`, "iam", "departments.create", "dualToken"),
      delete: operation("DELETE", `${backend}/iam/departments/{departmentId}`, "iam", "departments.delete", "dualToken"),
      list: operation("GET", `${app}/iam/departments`, "iam", "departments.list", "dualToken"),
      retrieve: operation("GET", `${backend}/iam/departments/{departmentId}`, "iam", "departments.retrieve", "dualToken"),
      tree: {
        retrieve: operation("GET", `${app}/iam/departments/tree`, "iam", "departments.tree.retrieve", "dualToken"),
      },
      update: operation("PATCH", `${backend}/iam/departments/{departmentId}`, "iam", "departments.update", "dualToken"),
    },
    departmentAssignments: {
      create: operation("POST", `${backend}/iam/department_assignments`, "iam", "departmentAssignments.create", "dualToken"),
      list: operation("GET", `${app}/iam/department_assignments`, "iam", "departmentAssignments.list", "dualToken"),
      update: operation("PATCH", `${backend}/iam/department_assignments/{assignmentId}`, "iam", "departmentAssignments.update", "dualToken"),
    },
    permissions: {
      create: operation("POST", `${backend}/iam/permissions`, "iam", "permissions.create", "dualToken"),
      delete: operation("DELETE", `${backend}/iam/permissions/{permissionId}`, "iam", "permissions.delete", "dualToken"),
      list: operation("GET", `${backend}/iam/permissions`, "iam", "permissions.list", "dualToken"),
      retrieve: operation("GET", `${backend}/iam/permissions/{permissionId}`, "iam", "permissions.retrieve", "dualToken"),
      update: operation("PATCH", `${backend}/iam/permissions/{permissionId}`, "iam", "permissions.update", "dualToken"),
    },
    positions: {
      create: operation("POST", `${backend}/iam/positions`, "iam", "positions.create", "dualToken"),
      delete: operation("DELETE", `${backend}/iam/positions/{positionId}`, "iam", "positions.delete", "dualToken"),
      list: operation("GET", `${app}/iam/positions`, "iam", "positions.list", "dualToken"),
      update: operation("PATCH", `${backend}/iam/positions/{positionId}`, "iam", "positions.update", "dualToken"),
    },
    positionAssignments: {
      create: operation("POST", `${backend}/iam/position_assignments`, "iam", "positionAssignments.create", "dualToken"),
      list: operation("GET", `${app}/iam/position_assignments`, "iam", "positionAssignments.list", "dualToken"),
      update: operation("PATCH", `${backend}/iam/position_assignments/{assignmentId}`, "iam", "positionAssignments.update", "dualToken"),
    },
    policies: {
      create: operation("POST", `${backend}/iam/policies`, "iam", "policies.create", "dualToken"),
      delete: operation("DELETE", `${backend}/iam/policies/{policyId}`, "iam", "policies.delete", "dualToken"),
      list: operation("GET", `${backend}/iam/policies`, "iam", "policies.list", "dualToken"),
      retrieve: operation("GET", `${backend}/iam/policies/{policyId}`, "iam", "policies.retrieve", "dualToken"),
      update: operation("PATCH", `${backend}/iam/policies/{policyId}`, "iam", "policies.update", "dualToken"),
    },
    accountBindingPolicy: {
      retrieve: operation("GET", `${backend}/iam/account_binding_policy`, "iam", "accountBindingPolicy.retrieve", "dualToken"),
      update: operation("PATCH", `${backend}/iam/account_binding_policy`, "iam", "accountBindingPolicy.update", "dualToken"),
    },
    roles: {
      create: operation("POST", `${backend}/iam/roles`, "iam", "roles.create", "dualToken"),
      delete: operation("DELETE", `${backend}/iam/roles/{roleId}`, "iam", "roles.delete", "dualToken"),
      list: operation("GET", `${backend}/iam/roles`, "iam", "roles.list", "dualToken"),
      retrieve: operation("GET", `${backend}/iam/roles/{roleId}`, "iam", "roles.retrieve", "dualToken"),
      update: operation("PATCH", `${backend}/iam/roles/{roleId}`, "iam", "roles.update", "dualToken"),
      permissions: {
        create: operation("POST", `${backend}/iam/roles/{roleId}/permissions`, "iam", "roles.permissions.create", "dualToken"),
        delete: operation("DELETE", `${backend}/iam/roles/{roleId}/permissions/{permissionId}`, "iam", "roles.permissions.delete", "dualToken"),
        list: operation("GET", `${backend}/iam/roles/{roleId}/permissions`, "iam", "roles.permissions.list", "dualToken"),
      },
    },
    roleBindings: {
      create: operation("POST", `${backend}/iam/role_bindings`, "iam", "roleBindings.create", "dualToken"),
      delete: operation("DELETE", `${backend}/iam/role_bindings/{roleBindingId}`, "iam", "roleBindings.delete", "dualToken"),
      list: operation("GET", `${app}/iam/role_bindings`, "iam", "roleBindings.list", "dualToken"),
    },
    securityEvents: {
      list: operation("GET", `${backend}/iam/security_events`, "iam", "securityEvents.list", "dualToken"),
      retrieve: operation("GET", `${backend}/iam/security_events/{securityEventId}`, "iam", "securityEvents.retrieve", "dualToken"),
    },
    tenants: {
      create: operation("POST", `${backend}/iam/tenants`, "iam", "tenants.create", "dualToken"),
      delete: operation("DELETE", `${backend}/iam/tenants/{tenantId}`, "iam", "tenants.delete", "dualToken"),
      list: operation("GET", `${backend}/iam/tenants`, "iam", "tenants.list", "dualToken"),
      retrieve: operation("GET", `${backend}/iam/tenants/{tenantId}`, "iam", "tenants.retrieve", "dualToken"),
      update: operation("PATCH", `${backend}/iam/tenants/{tenantId}`, "iam", "tenants.update", "dualToken"),
      members: {
        create: operation("POST", `${backend}/iam/tenants/{tenantId}/members`, "iam", "tenants.members.create", "dualToken"),
        delete: operation("DELETE", `${backend}/iam/tenants/{tenantId}/members/{userId}`, "iam", "tenants.members.delete", "dualToken"),
        list: operation("GET", `${backend}/iam/tenants/{tenantId}/members`, "iam", "tenants.members.list", "dualToken"),
        update: operation("PATCH", `${backend}/iam/tenants/{tenantId}/members/{userId}`, "iam", "tenants.members.update", "dualToken"),
      },
    },
    oauth: {
      accountLinks: {
        list: operation("GET", `${backend}/iam/oauth/account_links`, "iam", "iam.oauth.accountLinks.list", "dualToken"),
        update: operation("PATCH", `${backend}/iam/oauth/account_links/{accountLinkId}`, "iam", "iam.oauth.accountLinks.update", "dualToken"),
      },
      callbackEvents: {
        list: operation("GET", `${backend}/iam/oauth/callback_events`, "iam", "iam.oauth.callbackEvents.list", "dualToken"),
      },
      claimMappings: {
        create: operation("POST", `${backend}/iam/oauth/claim_mappings`, "iam", "iam.oauth.claimMappings.create", "dualToken"),
        list: operation("GET", `${backend}/iam/oauth/claim_mappings`, "iam", "iam.oauth.claimMappings.list", "dualToken"),
        update: operation("PATCH", `${backend}/iam/oauth/claim_mappings/{mappingId}`, "iam", "iam.oauth.claimMappings.update", "dualToken"),
      },
      clients: {
        create: operation("POST", `${backend}/iam/oauth/clients`, "iam", "iam.oauth.clients.create", "dualToken"),
        delete: operation("DELETE", `${backend}/iam/oauth/clients/{oauthClientId}`, "iam", "iam.oauth.clients.delete", "dualToken"),
        list: operation("GET", `${backend}/iam/oauth/clients`, "iam", "iam.oauth.clients.list", "dualToken"),
        retrieve: operation("GET", `${backend}/iam/oauth/clients/{oauthClientId}`, "iam", "iam.oauth.clients.retrieve", "dualToken"),
        update: operation("PATCH", `${backend}/iam/oauth/clients/{oauthClientId}`, "iam", "iam.oauth.clients.update", "dualToken"),
      },
      diagnosticRuns: {
        create: operation("POST", `${backend}/iam/oauth/diagnostic_runs`, "iam", "iam.oauth.diagnosticRuns.create", "dualToken"),
        list: operation("GET", `${backend}/iam/oauth/diagnostic_runs`, "iam", "iam.oauth.diagnosticRuns.list", "dualToken"),
        retrieve: operation("GET", `${backend}/iam/oauth/diagnostic_runs/{diagnosticRunId}`, "iam", "iam.oauth.diagnosticRuns.retrieve", "dualToken"),
      },
      flowConfigs: {
        create: operation("POST", `${backend}/iam/oauth/flow_configs`, "iam", "iam.oauth.flowConfigs.create", "dualToken"),
        list: operation("GET", `${backend}/iam/oauth/flow_configs`, "iam", "iam.oauth.flowConfigs.list", "dualToken"),
        update: operation("PATCH", `${backend}/iam/oauth/flow_configs/{flowConfigId}`, "iam", "iam.oauth.flowConfigs.update", "dualToken"),
      },
      grants: {
        delete: operation("DELETE", `${backend}/iam/oauth/grants/{grantId}`, "iam", "iam.oauth.grants.delete", "dualToken"),
        list: operation("GET", `${backend}/iam/oauth/grants`, "iam", "iam.oauth.grants.list", "dualToken"),
      },
      integrations: {
        create: operation("POST", `${backend}/iam/oauth/integrations`, "iam", "iam.oauth.integrations.create", "dualToken"),
        delete: operation("DELETE", `${backend}/iam/oauth/integrations/{integrationId}`, "iam", "iam.oauth.integrations.delete", "dualToken"),
        list: operation("GET", `${backend}/iam/oauth/integrations`, "iam", "iam.oauth.integrations.list", "dualToken"),
        retrieve: operation("GET", `${backend}/iam/oauth/integrations/{integrationId}`, "iam", "iam.oauth.integrations.retrieve", "dualToken"),
        update: operation("PATCH", `${backend}/iam/oauth/integrations/{integrationId}`, "iam", "iam.oauth.integrations.update", "dualToken"),
      },
      operationalResources: {
        create: operation("POST", `${backend}/iam/oauth/operational_resources`, "iam", "iam.oauth.operationalResources.create", "dualToken"),
        delete: operation("DELETE", `${backend}/iam/oauth/operational_resources/{resourceId}`, "iam", "iam.oauth.operationalResources.delete", "dualToken"),
        list: operation("GET", `${backend}/iam/oauth/operational_resources`, "iam", "iam.oauth.operationalResources.list", "dualToken"),
        publishes: {
          create: operation("POST", `${backend}/iam/oauth/operational_resources/{resourceId}/publishes`, "iam", "iam.oauth.operationalResources.publishes.create", "dualToken"),
        },
        update: operation("PATCH", `${backend}/iam/oauth/operational_resources/{resourceId}`, "iam", "iam.oauth.operationalResources.update", "dualToken"),
      },
      operatorPlatforms: {
        create: operation("POST", `${backend}/iam/oauth/operator_platforms`, "iam", "iam.oauth.operatorPlatforms.create", "dualToken"),
        list: operation("GET", `${backend}/iam/oauth/operator_platforms`, "iam", "iam.oauth.operatorPlatforms.list", "dualToken"),
        preAuthorizations: {
          create: operation("POST", `${backend}/iam/oauth/operator_platforms/{operatorPlatformId}/pre_authorizations`, "iam", "iam.oauth.operatorPlatforms.preAuthorizations.create", "dualToken"),
        },
        update: operation("PATCH", `${backend}/iam/oauth/operator_platforms/{operatorPlatformId}`, "iam", "iam.oauth.operatorPlatforms.update", "dualToken"),
      },
      policies: {
        create: operation("POST", `${backend}/iam/oauth/policies`, "iam", "iam.oauth.policies.create", "dualToken"),
        list: operation("GET", `${backend}/iam/oauth/policies`, "iam", "iam.oauth.policies.list", "dualToken"),
        update: operation("PATCH", `${backend}/iam/oauth/policies/{policyId}`, "iam", "iam.oauth.policies.update", "dualToken"),
      },
      providerCatalog: {
        create: operation("POST", `${backend}/iam/oauth/provider_catalog`, "iam", "iam.oauth.providerCatalog.create", "dualToken"),
        list: operation("GET", `${backend}/iam/oauth/provider_catalog`, "iam", "iam.oauth.providerCatalog.list", "dualToken"),
        retrieve: operation("GET", `${backend}/iam/oauth/provider_catalog/{providerCatalogId}`, "iam", "iam.oauth.providerCatalog.retrieve", "dualToken"),
        update: operation("PATCH", `${backend}/iam/oauth/provider_catalog/{providerCatalogId}`, "iam", "iam.oauth.providerCatalog.update", "dualToken"),
      },
      resourceAccounts: {
        authorizationRefreshes: {
          create: operation("POST", `${backend}/iam/oauth/resource_accounts/{resourceAccountId}/authorization_refreshes`, "iam", "iam.oauth.resourceAccounts.authorizationRefreshes.create", "dualToken"),
        },
        create: operation("POST", `${backend}/iam/oauth/resource_accounts`, "iam", "iam.oauth.resourceAccounts.create", "dualToken"),
        list: operation("GET", `${backend}/iam/oauth/resource_accounts`, "iam", "iam.oauth.resourceAccounts.list", "dualToken"),
        miniProgramLoginChecks: {
          create: operation("POST", `${backend}/iam/oauth/resource_accounts/{resourceAccountId}/mini_program_login_checks`, "iam", "iam.oauth.resourceAccounts.miniProgramLoginChecks.create", "dualToken"),
        },
        update: operation("PATCH", `${backend}/iam/oauth/resource_accounts/{resourceAccountId}`, "iam", "iam.oauth.resourceAccounts.update", "dualToken"),
        verifications: {
          create: operation("POST", `${backend}/iam/oauth/resource_accounts/{resourceAccountId}/verifications`, "iam", "iam.oauth.resourceAccounts.verifications.create", "dualToken"),
        },
      },
      resourceAuthorizations: {
        create: operation("POST", `${backend}/iam/oauth/resource_authorizations`, "iam", "iam.oauth.resourceAuthorizations.create", "dualToken"),
        list: operation("GET", `${backend}/iam/oauth/resource_authorizations`, "iam", "iam.oauth.resourceAuthorizations.list", "dualToken"),
        update: operation("PATCH", `${backend}/iam/oauth/resource_authorizations/{authorizationId}`, "iam", "iam.oauth.resourceAuthorizations.update", "dualToken"),
      },
      scopeProfiles: {
        create: operation("POST", `${backend}/iam/oauth/scope_profiles`, "iam", "iam.oauth.scopeProfiles.create", "dualToken"),
        list: operation("GET", `${backend}/iam/oauth/scope_profiles`, "iam", "iam.oauth.scopeProfiles.list", "dualToken"),
        update: operation("PATCH", `${backend}/iam/oauth/scope_profiles/{scopeProfileId}`, "iam", "iam.oauth.scopeProfiles.update", "dualToken"),
      },
      secrets: {
        create: operation("POST", `${backend}/iam/oauth/secrets`, "iam", "iam.oauth.secrets.create", "dualToken"),
        delete: operation("DELETE", `${backend}/iam/oauth/secrets/{secretId}`, "iam", "iam.oauth.secrets.delete", "dualToken"),
        list: operation("GET", `${backend}/iam/oauth/secrets`, "iam", "iam.oauth.secrets.list", "dualToken"),
      },
      surfaces: {
        create: operation("POST", `${backend}/iam/oauth/surfaces`, "iam", "iam.oauth.surfaces.create", "dualToken"),
        delete: operation("DELETE", `${backend}/iam/oauth/surfaces/{surfaceId}`, "iam", "iam.oauth.surfaces.delete", "dualToken"),
        list: operation("GET", `${backend}/iam/oauth/surfaces`, "iam", "iam.oauth.surfaces.list", "dualToken"),
        update: operation("PATCH", `${backend}/iam/oauth/surfaces/{surfaceId}`, "iam", "iam.oauth.surfaces.update", "dualToken"),
      },
      tenantBindings: {
        create: operation("POST", `${backend}/iam/oauth/tenant_bindings`, "iam", "iam.oauth.tenantBindings.create", "dualToken"),
        list: operation("GET", `${backend}/iam/oauth/tenant_bindings`, "iam", "iam.oauth.tenantBindings.list", "dualToken"),
        update: operation("PATCH", `${backend}/iam/oauth/tenant_bindings/{bindingId}`, "iam", "iam.oauth.tenantBindings.update", "dualToken"),
      },
      webhookConfigs: {
        create: operation("POST", `${backend}/iam/oauth/webhook_configs`, "iam", "iam.oauth.webhookConfigs.create", "dualToken"),
        list: operation("GET", `${backend}/iam/oauth/webhook_configs`, "iam", "iam.oauth.webhookConfigs.list", "dualToken"),
        update: operation("PATCH", `${backend}/iam/oauth/webhook_configs/{webhookConfigId}`, "iam", "iam.oauth.webhookConfigs.update", "dualToken"),
        verifications: {
          create: operation("POST", `${backend}/iam/oauth/webhook_configs/{webhookConfigId}/verifications`, "iam", "iam.oauth.webhookConfigs.verifications.create", "dualToken"),
        },
      },
    },
    users: {
      current: {
        retrieve: operation("GET", `${app}/iam/users/current`, "iam", "users.current.retrieve", "dualToken"),
        update: operation("PATCH", `${app}/iam/users/current`, "iam", "users.current.update", "dualToken"),
        password: {
          update: operation("PATCH", `${app}/iam/users/current/password`, "iam", "users.current.password.update", "dualToken"),
        },
        emailBindings: {
          create: operation("POST", `${app}/iam/users/current/email_bindings`, "iam", "users.current.emailBindings.create", "dualToken"),
          delete: operation("DELETE", `${app}/iam/users/current/email_bindings`, "iam", "users.current.emailBindings.delete", "dualToken"),
        },
        phoneBindings: {
          create: operation("POST", `${app}/iam/users/current/phone_bindings`, "iam", "users.current.phoneBindings.create", "dualToken"),
          delete: operation("DELETE", `${app}/iam/users/current/phone_bindings`, "iam", "users.current.phoneBindings.delete", "dualToken"),
        },
      },
      create: operation("POST", `${backend}/iam/users`, "iam", "users.create", "dualToken"),
      delete: operation("DELETE", `${backend}/iam/users/{userId}`, "iam", "users.delete", "dualToken"),
      list: operation("GET", `${backend}/iam/users`, "iam", "users.list", "dualToken"),
      retrieve: operation("GET", `${backend}/iam/users/{userId}`, "iam", "users.retrieve", "dualToken"),
      update: operation("PATCH", `${backend}/iam/users/{userId}`, "iam", "users.update", "dualToken"),
    },
  },
} as const;

export const SDKWORK_IAM_OPERATION_IDS = flattenOperations(SDKWORK_IAM_API_ROUTES);

export const SDKWORK_IAM_CAPABILITIES = [
  capability(
    "tenantManagement",
    ["iam"],
    ["tenant"],
    [
      "tenants.create",
      "tenants.delete",
      "tenants.list",
      "tenants.members.create",
      "tenants.members.delete",
      "tenants.members.list",
      "tenants.members.update",
      "tenants.retrieve",
      "tenants.update",
    ],
  ),
  capability(
    "organizationManagement",
    ["iam"],
    ["organization", "organizationClosure", "organizationMembership"],
    [
      "organizations.create",
      "organizations.delete",
      "organizations.list",
      "organizationMemberships.create",
      "organizationMemberships.list",
      "organizationMemberships.update",
      "organizations.retrieve",
      "organizations.tree.retrieve",
      "organizations.update",
    ],
  ),
  capability(
    "departmentManagement",
    ["iam"],
    ["department", "departmentClosure", "departmentAssignment"],
    [
      "departmentAssignments.create",
      "departmentAssignments.list",
      "departmentAssignments.update",
      "departments.create",
      "departments.delete",
      "departments.list",
      "departments.retrieve",
      "departments.tree.retrieve",
      "departments.update",
    ],
  ),
  capability(
    "positionManagement",
    ["iam"],
    ["position", "positionAssignment"],
    [
      "positionAssignments.create",
      "positionAssignments.list",
      "positionAssignments.update",
      "positions.create",
      "positions.delete",
      "positions.list",
      "positions.update",
    ],
  ),
  capability(
    "userDirectory",
    ["iam"],
    ["user", "organizationMembership", "departmentAssignment", "positionAssignment"],
    ["users.create", "users.delete", "users.list", "users.retrieve", "users.update"],
  ),
  capability(
    "accountIdentity",
    ["auth", "iam", "system"],
    ["user", "userIdentity", "credential"],
    [
      "iam.runtime.retrieve",
      "iam.verificationPolicy.retrieve",
      "iam.accountBindingPolicy.retrieve",
      "passwordResetRequests.create",
      "passwordResets.create",
      "registrations.create",
      "users.current.emailBindings.create",
      "users.current.emailBindings.delete",
      "users.current.password.update",
      "users.current.phoneBindings.create",
      "users.current.phoneBindings.delete",
      "users.current.retrieve",
      "users.current.update",
    ],
  ),
  capability(
    "sessionSecurity",
    ["auth", "oauth"],
    ["session", "credential", "mfaFactor", "device"],
    [
      "oauth.accountLinks.delete",
      "oauth.accountLinks.list",
      "oauth.authorizationUrls.create",
      "oauth.authorizations.completions.create",
      "oauth.callbacks.retrieve",
      "oauth.callbacks.create",
      "oauth.deviceAuthorizations.create",
      "oauth.deviceAuthorizations.passwordCompletions.create",
      "oauth.deviceAuthorizations.retrieve",
      "oauth.deviceAuthorizations.scans.create",
      "oauth.deviceAuthorizations.sessionExchanges.create",
      "oauth.grants.delete",
      "oauth.grants.list",
      "oauth.miniProgramSessions.create",
      "oauth.providers.list",
      "oauth.sessions.create",
      "sessions.create",
      "sessions.loginContextSelection.create",
      "sessions.organizationSelection.create",
      "sessions.current.delete",
      "sessions.current.retrieve",
      "sessions.current.update",
      "sessions.refresh",
    ],
  ),
  capability(
    "accessControl",
    ["iam"],
    ["role", "roleBinding", "permission", "policy", "rolePermission"],
    [
      "permissions.create",
      "permissions.delete",
      "permissions.list",
      "permissions.retrieve",
      "permissions.update",
      "policies.create",
      "policies.delete",
      "policies.list",
      "policies.retrieve",
      "policies.update",
      "accountBindingPolicy.retrieve",
      "accountBindingPolicy.update",
      "roles.create",
      "roles.delete",
      "roles.list",
      "roles.retrieve",
      "roles.permissions.create",
      "roles.permissions.delete",
      "roles.permissions.list",
      "roles.update",
      "roleBindings.create",
      "roleBindings.delete",
      "roleBindings.list",
    ],
  ),
  capability(
    "apiAccess",
    ["iam"],
    ["apiKey"],
    ["apiKeys.list", "apiKeys.revoke", "accessCredentials.create", "applications.register", "tenantApplications.list", "tenantApplications.create", "tenantApplications.retrieve", "tenantApplications.update", "tenantApplications.enable", "tenantApplications.management.create", "tenantApplications.management.update", "tenantApplications.management.enable", "tenantApplications.management.disable", "tenantApplications.summary.retrieve"],
  ),
  capability(
    "securityAudit",
    ["iam"],
    ["securityEvent", "auditEvent"],
    ["securityEvents.list", "auditEvents.list", "securityEvents.retrieve", "auditEvents.retrieve"],
  ),
  capability(
    "oauthManagement",
    ["iam"],
    ["oauthIntegration", "oauthClient", "oauthSecret", "oauthSurface", "oauthWebhookConfig"],
    [
      "iam.oauth.accountLinks.list",
      "iam.oauth.accountLinks.update",
      "iam.oauth.callbackEvents.list",
      "iam.oauth.claimMappings.create",
      "iam.oauth.claimMappings.list",
      "iam.oauth.claimMappings.update",
      "iam.oauth.clients.create",
      "iam.oauth.clients.delete",
      "iam.oauth.clients.list",
      "iam.oauth.clients.retrieve",
      "iam.oauth.clients.update",
      "iam.oauth.diagnosticRuns.create",
      "iam.oauth.diagnosticRuns.list",
      "iam.oauth.diagnosticRuns.retrieve",
      "iam.oauth.flowConfigs.create",
      "iam.oauth.flowConfigs.list",
      "iam.oauth.flowConfigs.update",
      "iam.oauth.grants.delete",
      "iam.oauth.grants.list",
      "iam.oauth.integrations.create",
      "iam.oauth.integrations.delete",
      "iam.oauth.integrations.list",
      "iam.oauth.integrations.retrieve",
      "iam.oauth.integrations.update",
      "iam.oauth.operationalResources.create",
      "iam.oauth.operationalResources.delete",
      "iam.oauth.operationalResources.list",
      "iam.oauth.operationalResources.publishes.create",
      "iam.oauth.operationalResources.update",
      "iam.oauth.operatorPlatforms.create",
      "iam.oauth.operatorPlatforms.list",
      "iam.oauth.operatorPlatforms.preAuthorizations.create",
      "iam.oauth.operatorPlatforms.update",
      "iam.oauth.policies.create",
      "iam.oauth.policies.list",
      "iam.oauth.policies.update",
      "iam.oauth.providerCatalog.create",
      "iam.oauth.providerCatalog.list",
      "iam.oauth.providerCatalog.retrieve",
      "iam.oauth.providerCatalog.update",
      "iam.oauth.resourceAccounts.authorizationRefreshes.create",
      "iam.oauth.resourceAccounts.create",
      "iam.oauth.resourceAccounts.list",
      "iam.oauth.resourceAccounts.miniProgramLoginChecks.create",
      "iam.oauth.resourceAccounts.update",
      "iam.oauth.resourceAccounts.verifications.create",
      "iam.oauth.resourceAuthorizations.create",
      "iam.oauth.resourceAuthorizations.list",
      "iam.oauth.resourceAuthorizations.update",
      "iam.oauth.scopeProfiles.create",
      "iam.oauth.scopeProfiles.list",
      "iam.oauth.scopeProfiles.update",
      "iam.oauth.secrets.create",
      "iam.oauth.secrets.delete",
      "iam.oauth.secrets.list",
      "iam.oauth.surfaces.create",
      "iam.oauth.surfaces.delete",
      "iam.oauth.surfaces.list",
      "iam.oauth.surfaces.update",
      "iam.oauth.tenantBindings.create",
      "iam.oauth.tenantBindings.list",
      "iam.oauth.tenantBindings.update",
      "iam.oauth.webhookConfigs.create",
      "iam.oauth.webhookConfigs.list",
      "iam.oauth.webhookConfigs.update",
      "iam.oauth.webhookConfigs.verifications.create",
    ],
  ),
] as const satisfies readonly IamCapabilityContract[];

export function createIamAppContext(input: IamAppContext): IamAppContext {
  const hasLoginOrganizationHint =
    input.loginScope !== undefined
    || input.organizationId !== undefined;
  const organizationId = hasLoginOrganizationHint
    ? resolveSessionOrganizationId({
        loginScope: input.loginScope,
        organizationId: input.organizationId,
      })
    : undefined;

  return {
    appId: input.appId,
    authLevel: input.authLevel,
    dataScope: [...input.dataScope],
    deploymentMode: input.deploymentMode,
    environment: input.environment,
    permissionScope: [...input.permissionScope],
    sessionId: input.sessionId,
    tenantId: input.tenantId,
    userId: input.userId,
    ...(organizationId !== undefined ? { organizationId } : {}),
    ...(input.loginScope ? { loginScope: input.loginScope } : {}),
    ...(input.userSurface ? { userSurface: { ...input.userSurface } } : {}),
    ...(input.standardRoleCodes ? { standardRoleCodes: [...input.standardRoleCodes] } : {}),
  };
}

export function createIamUserSurface(input: IamUserSurface): IamUserSurface {
  return {
    app: input.app,
    organizationMember: input.organizationMember,
  };
}

export function canAccessBackendApi(context: IamAppContext): boolean {
  return context.userSurface?.organizationMember === true;
}

export {
  hasPermissionInScope,
  permissionMatches,
  resolveIamBackendOperationPermission,
} from "./backend-operation-permissions.ts";

export {
  isSdkworkAuthLoginMethod,
  isSdkworkAuthOAuthProviderRegion,
  isSdkworkAuthRecoveryMethod,
  isSdkworkAuthRegisterMethod,
  resolveSdkworkAuthRuntimeConfigFromMetadata,
  type SdkworkAuthLoginMethod,
  type SdkworkAuthOAuthProviderRegion,
  type SdkworkAuthRecoveryMethod,
  type SdkworkAuthRegisterMethod,
  type SdkworkAuthRuntimeConfig,
  type SdkworkAuthVerificationPolicyConfig,
  type SdkworkCanonicalAuthMetadataLike,
} from "./auth-runtime-metadata.ts";

export function createIamShardingContext(input: IamAppContext): IamShardingContext {
  if (
    input.organizationId
    && input.loginScope !== 'TENANT'
    && !isPlatformOrganizationId(input.organizationId)
  ) {
    return {
      shardingKey: input.organizationId,
      shardingStrategy: "organization",
    };
  }

  if (input.tenantId) {
    return {
      shardingKey: input.tenantId,
      shardingStrategy: "tenant",
    };
  }

  return {
    shardingKey: input.userId || input.appId,
    shardingStrategy: input.userId ? "user" : "single",
  };
}

function operation(
  method: IamOperationContract["method"],
  path: string,
  tag: IamOperationContract["tag"],
  operationId: string,
  security: IamOperationContract["security"],
  options: { forbidCredentialHeaders?: boolean } = {},
): IamOperationContract {
  return {
    authMode: authModeForSecurity(security),
    forbidCredentialHeaders: options.forbidCredentialHeaders === true,
    method,
    operationId,
    path,
    security,
    tag,
  };
}

function authModeForSecurity(security: IamOperationContract["security"]): IamOperationContract["authMode"] {
  if (security === "public") {
    return "anonymous";
  }
  if (security === "refreshToken") {
    return "refresh-token";
  }
  return "dual-token";
}

function model(
  name: IamDomainModelName,
  ownership: IamDomainModelOwnership,
  capabilities: readonly IamCapabilityName[],
  fields: readonly string[],
): IamDomainModelContract {
  return {
    capabilities,
    domain: "iam",
    fields,
    name,
    ownership,
    table: SDKWORK_IAM_TABLES[name],
  };
}

function capability(
  name: IamCapabilityName,
  sdkNamespaces: readonly ("auth" | "iam" | "oauth" | "system")[],
  models: readonly IamDomainModelName[],
  operations: readonly string[],
): IamCapabilityContract {
  return {
    domain: "iam",
    models,
    name,
    operations,
    sdkNamespaces,
  };
}

function flattenOperations(value: unknown): Record<string, IamOperationContract> {
  const result: Record<string, IamOperationContract> = {};

  function visit(node: unknown) {
    if (!node || typeof node !== "object") {
      return;
    }

    if ("operationId" in node && "path" in node) {
      const operation = node as IamOperationContract;
      result[operation.operationId] = operation;
      return;
    }

    for (const child of Object.values(node)) {
      visit(child);
    }
  }

  visit(value);
  return result;
}

export {
  isLoginEligibleOrganizationId,
  isPlatformOrganizationId,
  normalizeLoginOrganizationClaim,
  PLATFORM_ORGANIZATION_ID,
  resolveSessionOrganizationId,
} from './login-context.ts';
export type { IamLoginScope } from './login-context.ts';
export {
  buildOrganizationLoginContextSelectionBody,
  buildPersonalLoginContextSelectionBody,
  buildTenantCurrentSessionUpdateBody,
  isIamLoginContextSelectionChallenge,
  normalizeIamLoginContextSelectionChallenge,
} from './login-context-challenge.ts';
export type {
  IamLoginContextOrganizationChoice,
  IamLoginContextSelectionChallenge,
  IamLoginContextSelectionChallengeType,
  IamLoginContextSelectionOption,
} from './login-context-challenge.ts';
