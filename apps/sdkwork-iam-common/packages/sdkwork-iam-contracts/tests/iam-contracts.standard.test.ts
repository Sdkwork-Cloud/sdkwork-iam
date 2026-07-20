import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import {
  SDKWORK_IAM_API_ROUTES,
  SDKWORK_IAM_CAPABILITIES,
  SDKWORK_IAM_DOMAIN_MODELS,
  SDKWORK_IAM_HEADERS,
  SDKWORK_IAM_OPERATION_IDS,
  SDKWORK_IAM_STANDARD,
  SDKWORK_IAM_TABLES,
  SDKWORK_STANDARD_PAGE_QUERY_PARAMS,
  createIamAppContext,
  createIamShardingContext,
  isSdkworkQueryParameterName,
  type IamAppContext,
} from "../src/index";

describe("SDKWork IAM standard contracts", () => {
  it("keeps app and backend API prefixes aligned with the v3 standard", () => {
    expect(SDKWORK_IAM_STANDARD.api.appPrefix).toBe("/app/v3/api");
    expect(SDKWORK_IAM_STANDARD.api.backendPrefix).toBe("/backend/v3/api");
    expect(SDKWORK_IAM_STANDARD.api.openapi).toBe("3.1.2");
    expect(SDKWORK_IAM_STANDARD.sdkNamespaces).toContain("oauth");
    expect(SDKWORK_IAM_API_ROUTES.auth.sessions.create.path).toBe("/app/v3/api/auth/sessions");
    expect(SDKWORK_IAM_API_ROUTES.auth.registrations.create.path).toBe("/app/v3/api/auth/registrations");
    expect(SDKWORK_IAM_API_ROUTES.oauth.deviceAuthorizations.create.path).toBe(
      "/app/v3/api/oauth/device_authorizations",
    );
    expect(SDKWORK_IAM_API_ROUTES.oauth.deviceAuthorizations.retrieve.path).toBe(
      "/app/v3/api/oauth/device_authorizations/{deviceAuthorizationId}",
    );
    expect(SDKWORK_IAM_API_ROUTES.oauth.deviceAuthorizations.scans.create.path).toBe(
      "/app/v3/api/oauth/device_authorizations/{deviceAuthorizationId}/scans",
    );
    expect(SDKWORK_IAM_API_ROUTES.oauth.deviceAuthorizations.passwordCompletions.create.path).toBe(
      "/app/v3/api/oauth/device_authorizations/{deviceAuthorizationId}/password_completions",
    );
    expect(SDKWORK_IAM_API_ROUTES.oauth.deviceAuthorizations.sessionExchanges.create.path).toBe(
      "/app/v3/api/oauth/device_authorizations/{deviceAuthorizationId}/session_exchanges",
    );
    expect(SDKWORK_IAM_API_ROUTES.oauth.authorizations.completions.create.path).toBe(
      "/app/v3/api/oauth/authorizations/{authorizationStateId}/completions",
    );
    expect(Object.prototype.hasOwnProperty.call(SDKWORK_IAM_API_ROUTES, "openPlatform")).toBe(false);
    expect(SDKWORK_IAM_API_ROUTES.auth.sessions.current.retrieve.path).toBe("/app/v3/api/auth/sessions/current");
    expect(SDKWORK_IAM_API_ROUTES.system.iam.runtime.retrieve.path).toBe("/app/v3/api/system/iam/runtime");
    expect(SDKWORK_IAM_API_ROUTES.system.iam.verificationPolicy.retrieve.path).toBe("/app/v3/api/system/iam/verification_policy");
    expect(SDKWORK_IAM_API_ROUTES.system.iam.accountBindingPolicy.retrieve.path).toBe("/app/v3/api/system/iam/account_binding_policy");
    expect(SDKWORK_IAM_API_ROUTES.iam.accountBindingPolicy.retrieve.path).toBe("/backend/v3/api/iam/account_binding_policy");
    expect(SDKWORK_IAM_API_ROUTES.iam.users.current.retrieve.path).toBe("/app/v3/api/iam/users/current");
    expect(SDKWORK_IAM_API_ROUTES.iam.organizations.list.path).toBe("/app/v3/api/iam/organizations");
    expect(SDKWORK_IAM_API_ROUTES.iam.organizations.tree.retrieve.path).toBe("/app/v3/api/iam/organizations/tree");
    expect(SDKWORK_IAM_API_ROUTES.iam.organizationMemberships.list.path).toBe("/app/v3/api/iam/organization_memberships");
    expect(SDKWORK_IAM_API_ROUTES.iam.departments.list.path).toBe("/app/v3/api/iam/departments");
    expect(SDKWORK_IAM_API_ROUTES.iam.departments.tree.retrieve.path).toBe("/app/v3/api/iam/departments/tree");
    expect(SDKWORK_IAM_API_ROUTES.iam.departmentAssignments.list.path).toBe("/app/v3/api/iam/department_assignments");
    expect(SDKWORK_IAM_API_ROUTES.iam.positions.list.path).toBe("/app/v3/api/iam/positions");
    expect(SDKWORK_IAM_API_ROUTES.iam.positionAssignments.list.path).toBe("/app/v3/api/iam/position_assignments");
    expect(SDKWORK_IAM_API_ROUTES.iam.roleBindings.list.path).toBe("/app/v3/api/iam/role_bindings");
    expect(SDKWORK_IAM_API_ROUTES.iam.users.list.path).toBe("/backend/v3/api/iam/users");
    expect(Object.prototype.hasOwnProperty.call(SDKWORK_IAM_API_ROUTES.iam.users, "roles")).toBe(false);
  });

  it("uses lower_snake_case URL segments without double underscores", () => {
    const paths = Object.values(SDKWORK_IAM_OPERATION_IDS).map((operation) => operation.path);

    for (const path of paths) {
      expect(path).not.toContain("__");
      expect(path).not.toContain("userCenter");
      expect(path).not.toContain("/auth/login");
      expect(path).not.toContain("qr_login_codes");
      expect(path).not.toContain("/open_platform/qr_auth");
      expect(path).not.toContain("{organization_id}");
    }

    expect(paths).toContain("/backend/v3/api/iam/api_keys");
    expect(paths).toContain("/backend/v3/api/iam/security_events");
    expect(paths).toContain("/backend/v3/api/iam/audit_events");
    expect(paths).toContain("/backend/v3/api/iam/audit_events/{auditEventId}");
    expect(paths).toContain("/backend/v3/api/iam/security_events/{securityEventId}");
    expect(paths).toContain("/app/v3/api/iam/departments");
    expect(paths).toContain("/app/v3/api/iam/department_assignments");
    expect(paths.join("\n")).not.toMatch(/iam_accounts|iam_department_members|\/iam\/users\/\{userId\}\/roles/);
  });

  it("uses dotted lowerCamelCase operationIds that generate nested SDK resources", () => {
    const operationIds = Object.values(SDKWORK_IAM_OPERATION_IDS).map((operation) => operation.operationId);
    const uniqueOperationIds = new Set(operationIds);

    expect(uniqueOperationIds.size).toBe(operationIds.length);
    expect(operationIds).toContain("sessions.create");
    expect(operationIds).toContain("sessions.loginContextSelection.create");
    expect(operationIds).toContain("sessions.organizationSelection.create");
    expect(operationIds).toContain("registrations.create");
    expect(operationIds).toContain("sessions.current.retrieve");
    expect(operationIds).toContain("iam.runtime.retrieve");
    expect(operationIds).toContain("iam.verificationPolicy.retrieve");
    expect(operationIds).toContain("iam.accountBindingPolicy.retrieve");
    expect(operationIds).toContain("accountBindingPolicy.retrieve");
    expect(operationIds).toContain("accountBindingPolicy.update");
    expect(operationIds).not.toContain("runtimeSettings.retrieve");
    expect(operationIds).not.toContain("verificationPolicy.retrieve");
    expect(operationIds).not.toContain("verificationCodes.create");
    expect(operationIds).not.toContain("verificationCodes.verify");
    expect(operationIds).toContain("passwordResetRequests.create");
    expect(operationIds).toContain("oauth.deviceAuthorizations.create");
    expect(operationIds).toContain("oauth.deviceAuthorizations.retrieve");
    expect(operationIds).toContain("oauth.deviceAuthorizations.scans.create");
    expect(operationIds).toContain("oauth.deviceAuthorizations.passwordCompletions.create");
    expect(operationIds).toContain("oauth.deviceAuthorizations.sessionExchanges.create");
    expect(operationIds).toContain("oauth.authorizations.completions.create");
    expect(operationIds).not.toContain("qrAuth.sessions.create");
    expect(operationIds).not.toContain("qrAuth.sessions.retrieve");
    expect(operationIds).not.toContain("qrAuth.sessions.scans.create");
    expect(operationIds).not.toContain("qrAuth.sessions.passwords.create");
    expect(operationIds).toContain("apiKeys.list");
    expect(operationIds).toContain("applications.register");
    expect(operationIds).toContain("tenantApplications.create");
    expect(operationIds).toContain("tenantApplications.management.create");
    expect(operationIds).toContain("tenantApplications.retrieve");
    expect(operationIds).toContain("tenantApplications.update");
    expect(operationIds).toContain("accessCredentials.create");
    expect(operationIds).toContain("securityEvents.list");
    expect(operationIds).toContain("auditEvents.list");
    expect(operationIds).toContain("organizations.list");
    expect(operationIds).toContain("organizations.tree.retrieve");
    expect(operationIds).toContain("organizationMemberships.list");
    expect(operationIds).toContain("organizationMemberships.create");
    expect(operationIds).toContain("organizationMemberships.update");
    expect(operationIds).not.toContain("organizations.members.create");
    expect(operationIds).not.toContain("organizations.members.delete");
    expect(operationIds).not.toContain("organizations.members.list");
    expect(operationIds).not.toContain("organizations.members.update");
    expect(operationIds).toContain("departments.list");
    expect(operationIds).toContain("departments.tree.retrieve");
    expect(operationIds).toContain("departments.create");
    expect(operationIds).toContain("departments.update");
    expect(operationIds).toContain("departmentAssignments.list");
    expect(operationIds).toContain("positions.list");
    expect(operationIds).toContain("positionAssignments.list");
    expect(operationIds).toContain("roleBindings.list");
    expect(operationIds).toContain("roleBindings.create");
    expect(operationIds).toContain("roleBindings.delete");
    expect(operationIds).not.toContain("users.roles.create");
    expect(operationIds).not.toContain("users.roles.delete");
    expect(operationIds).not.toContain("users.roles.list");
    expect(operationIds).not.toContain("departmentMembers.list");
    expect(operationIds).not.toContain("loginQrCodeCallbacks.create");
    expect(operationIds).not.toContain("loginQrCodes.confirm");
    expect(operationIds).not.toContain("loginQrCodes.create");
    expect(operationIds).not.toContain("loginQrCodes.retrieve");

    for (const operation of Object.values(SDKWORK_IAM_OPERATION_IDS)) {
      const operationId = operation.operationId;
      expect(operationId).toMatch(/^[a-z][a-zA-Z0-9]*(\.[a-z][a-zA-Z0-9]*)+$/);
      if (operation.tag !== "oauth" && !(operation.tag === "iam" && operationId.startsWith("iam.oauth."))) {
        expect(operationId).not.toMatch(new RegExp(`^${operation.tag}\\.`));
      }
      expect(operationId).not.toMatch(/[_\-/{}:\s]/);
    }
  });

  it("marks anonymous IAM entry operations so generated SDKs skip stored auth tokens", () => {
    const anonymousOperations = [
      SDKWORK_IAM_API_ROUTES.oauth.authorizationUrls.create,
      SDKWORK_IAM_API_ROUTES.oauth.sessions.create,
      SDKWORK_IAM_API_ROUTES.auth.passwordResetRequests.create,
      SDKWORK_IAM_API_ROUTES.auth.passwordResets.create,
      SDKWORK_IAM_API_ROUTES.auth.registrations.create,
      SDKWORK_IAM_API_ROUTES.auth.sessions.create,
      SDKWORK_IAM_API_ROUTES.auth.sessions.loginContextSelection.create,
      SDKWORK_IAM_API_ROUTES.auth.sessions.organizationSelection.create,
      SDKWORK_IAM_API_ROUTES.oauth.deviceAuthorizations.create,
      SDKWORK_IAM_API_ROUTES.oauth.deviceAuthorizations.retrieve,
      SDKWORK_IAM_API_ROUTES.oauth.deviceAuthorizations.scans.create,
      SDKWORK_IAM_API_ROUTES.oauth.deviceAuthorizations.passwordCompletions.create,
      SDKWORK_IAM_API_ROUTES.oauth.deviceAuthorizations.sessionExchanges.create,
      SDKWORK_IAM_API_ROUTES.system.iam.runtime.retrieve,
      SDKWORK_IAM_API_ROUTES.system.iam.verificationPolicy.retrieve,
    ];

    for (const operation of anonymousOperations) {
      expect(operation.security).toBe("public");
      expect(operation.authMode).toBe("anonymous");
    }

    expect(SDKWORK_IAM_API_ROUTES.auth.sessions.current.retrieve.authMode).toBe("dual-token");
    expect(SDKWORK_IAM_API_ROUTES.auth.sessions.current.retrieve.forbidCredentialHeaders).toBe(false);
    expect(SDKWORK_IAM_API_ROUTES.auth.sessions.refresh.authMode).toBe("refresh-token");
    expect(SDKWORK_IAM_API_ROUTES.auth.sessions.refresh.forbidCredentialHeaders).toBe(false);
  });

  it("marks credential-free auth commands that must reject inbound token and context headers", () => {
    const credentialFreeOperationIds = [
      "oauth.sessions.create",
      "passwordResetRequests.create",
      "passwordResets.create",
      "registrations.create",
      "sessions.create",
      "sessions.loginContextSelection.create",
      "sessions.organizationSelection.create",
      "oauth.deviceAuthorizations.create",
      "oauth.deviceAuthorizations.passwordCompletions.create",
    ];

    for (const operationId of credentialFreeOperationIds) {
      expect(SDKWORK_IAM_OPERATION_IDS[operationId]).toMatchObject({
        authMode: "anonymous",
        forbidCredentialHeaders: true,
        security: "public",
      });
    }

    expect(SDKWORK_IAM_OPERATION_IDS["oauth.deviceAuthorizations.retrieve"].forbidCredentialHeaders).toBe(false);
    expect(SDKWORK_IAM_OPERATION_IDS["oauth.deviceAuthorizations.scans.create"].forbidCredentialHeaders).toBe(false);
    expect(SDKWORK_IAM_OPERATION_IDS["oauth.deviceAuthorizations.sessionExchanges.create"].forbidCredentialHeaders).toBe(false);
    expect(SDKWORK_IAM_OPERATION_IDS["iam.runtime.retrieve"].forbidCredentialHeaders).toBe(false);
  });

  it("defines dual token security headers with canonical access token naming", () => {
    expect(SDKWORK_IAM_HEADERS.authToken).toEqual({
      header: "Authorization",
      scheme: "Bearer",
    });
    expect(SDKWORK_IAM_HEADERS.accessToken).toBe("Access-Token");
  });

  it("keeps OpenAPI query parameter wire names stable and prevents SDK alias feedback loops", () => {
    expect(SDKWORK_STANDARD_PAGE_QUERY_PARAMS).toEqual(["page", "page_size", "cursor", "sort", "q"]);

    for (const queryName of SDKWORK_STANDARD_PAGE_QUERY_PARAMS) {
      expect(isSdkworkQueryParameterName(queryName)).toBe(true);
    }

    for (const forbiddenName of ["search_query", "keyword", "search", "pageNo", "pageSize", "searchQuery", "size", "page_no"]) {
      expect(isSdkworkQueryParameterName(forbiddenName)).toBe(false);
    }

    for (const operation of Object.values(SDKWORK_IAM_OPERATION_IDS)) {
      for (const queryName of operation.queryParameters ?? []) {
        expect(isSdkworkQueryParameterName(queryName)).toBe(true);
      }
    }
  });

  it("keeps foundation IAM table names aligned with database contract registry", () => {
    const registry = JSON.parse(
      readFileSync(path.join(process.cwd(), "database/contract/table-registry.json"), "utf8"),
    ) as { tables: Array<{ table_name: string }> };
    const storageTables = new Set(registry.tables.map((entry) => entry.table_name));

    expect(registry.tables).toHaveLength(57);

    for (const tableName of Object.values(SDKWORK_IAM_TABLES)) {
      expect(storageTables.has(tableName)).toBe(true);
    }
  });

  it("owns complete iam-prefixed database table names for shared IAM foundation", () => {
    expect(SDKWORK_IAM_TABLES).toMatchObject({
      tenant: "iam_tenant",
      organization: "iam_organization",
      organizationClosure: "iam_organization_closure",
      organizationMembership: "iam_organization_membership",
      department: "iam_department",
      departmentClosure: "iam_department_closure",
      departmentAssignment: "iam_department_assignment",
      position: "iam_position",
      positionAssignment: "iam_position_assignment",
      roleBinding: "iam_role_binding",
      user: "iam_user",
      userIdentity: "iam_user_identity",
      credential: "iam_credential",
      session: "iam_session",
      mfaFactor: "iam_mfa_factor",
      device: "iam_device",
      role: "iam_role",
      permission: "iam_permission",
      policy: "iam_policy",
      rolePermission: "iam_role_permission",
      apiKey: "iam_api_key",
      securityEvent: "iam_security_event",
      auditEvent: "iam_audit_event",
    });

    for (const tableName of Object.values(SDKWORK_IAM_TABLES)) {
      expect(tableName).toMatch(/^iam_[a-z0-9_]+$/);
      expect(tableName).not.toContain("__");
      expect(tableName).not.toBe("iam_account");
      expect(tableName).not.toBe("iam_accounts");
      expect(tableName).not.toBe("iam_department_member");
      expect(tableName).not.toBe("iam_department_members");
      expect(tableName).not.toBe("iam_user_role");
    }
  });

  it("defines a complete composable IAM domain model catalog", () => {
    expect(SDKWORK_IAM_DOMAIN_MODELS.map((model) => model.name)).toEqual([
      "tenant",
      "organization",
      "organizationClosure",
      "organizationMembership",
      "department",
      "departmentClosure",
      "departmentAssignment",
      "position",
      "positionAssignment",
      "roleBinding",
      "user",
      "userIdentity",
      "credential",
      "session",
      "mfaFactor",
      "device",
      "role",
      "permission",
      "policy",
      "rolePermission",
      "apiKey",
      "securityEvent",
      "auditEvent",
    ]);

    for (const model of SDKWORK_IAM_DOMAIN_MODELS) {
      expect(model.domain).toBe("iam");
      expect(model.table).toBe(SDKWORK_IAM_TABLES[model.name]);
      expect(model.fields).toContain("id");
      expect(model.capabilities.length).toBeGreaterThan(0);
      expect(model.ownership).toMatch(/^(tenant|global)$/);

      if (model.ownership === "tenant") {
        expect(model.fields).toContain("tenant_id");
      }
    }

    expect(SDKWORK_IAM_DOMAIN_MODELS.find((model) => model.name === "permission")?.ownership).toBe("global");
    expect(SDKWORK_IAM_DOMAIN_MODELS.find((model) => model.name === "permission")?.fields).toContain("code");
    expect(SDKWORK_IAM_DOMAIN_MODELS.find((model) => model.name === "permission")?.fields).not.toContain("tenant_id");
    expect(SDKWORK_IAM_DOMAIN_MODELS.find((model) => model.name === "organization")?.fields).toEqual([
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
    ]);
    expect(SDKWORK_IAM_DOMAIN_MODELS.find((model) => model.name === "organizationClosure")?.fields).toEqual([
      "id",
      "tenant_id",
      "ancestor_organization_id",
      "descendant_organization_id",
      "depth",
      "created_at",
    ]);
    expect(SDKWORK_IAM_DOMAIN_MODELS.find((model) => model.name === "organizationMembership")?.fields).toEqual([
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
    ]);
    expect(SDKWORK_IAM_DOMAIN_MODELS.find((model) => model.name === "department")?.fields).toEqual([
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
    ]);
    expect(SDKWORK_IAM_DOMAIN_MODELS.find((model) => model.name === "departmentAssignment")?.fields).toEqual([
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
    ]);
    expect(SDKWORK_IAM_DOMAIN_MODELS.find((model) => model.name === "roleBinding")?.fields).toEqual([
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
    ]);
    expect(SDKWORK_IAM_DOMAIN_MODELS.find((model) => model.name === "user")?.fields).toEqual([
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
    ]);
    expect(SDKWORK_IAM_DOMAIN_MODELS.find((model) => model.name === "session")?.fields).toEqual(
      expect.arrayContaining([
        "organization_id",
        "auth_token_hash",
        "access_token_hash",
        "sharding_key",
        "sharding_strategy",
        "data_scope_json",
        "permission_scope_json",
      ]),
    );
    expect(SDKWORK_IAM_DOMAIN_MODELS.find((model) => model.name === "apiKey")?.fields).toEqual(
      expect.arrayContaining(["tenant_id", "organization_id", "user_id", "permission_scope_json"]),
    );
    expect(SDKWORK_IAM_DOMAIN_MODELS.find((model) => model.name === "securityEvent")?.fields).toEqual(
      expect.arrayContaining(["tenant_id", "organization_id", "user_id", "session_id"]),
    );
    expect(SDKWORK_IAM_DOMAIN_MODELS.find((model) => model.name === "auditEvent")?.fields).toEqual(
      expect.arrayContaining(["tenant_id", "organization_id", "actor_user_id", "request_id"]),
    );
  });

  it("defines capability blocks that can be assembled by applications", () => {
    expect(SDKWORK_IAM_CAPABILITIES.map((capability) => capability.name)).toEqual([
      "tenantManagement",
      "organizationManagement",
      "departmentManagement",
      "positionManagement",
      "userDirectory",
      "accountIdentity",
      "sessionSecurity",
      "accessControl",
      "apiAccess",
      "securityAudit",
      "oauthManagement",
    ]);

    for (const capability of SDKWORK_IAM_CAPABILITIES) {
      expect(capability.domain).toBe("iam");
      expect(capability.sdkNamespaces.length).toBeGreaterThan(0);
      expect(capability.models.length).toBeGreaterThan(0);
      expect(capability.operations.length).toBeGreaterThan(0);

      for (const operationId of capability.operations) {
        expect(SDKWORK_IAM_OPERATION_IDS[operationId]).toBeDefined();
      }
    }

    expect(SDKWORK_IAM_CAPABILITIES.find((capability) => capability.name === "accountIdentity")).toMatchObject({
      sdkNamespaces: ["auth", "iam", "system"],
      operations: expect.arrayContaining([
        "iam.runtime.retrieve",
        "iam.verificationPolicy.retrieve",
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
      ]),
    });
    expect(SDKWORK_IAM_CAPABILITIES.find((capability) => capability.name === "sessionSecurity")).toMatchObject({
      sdkNamespaces: ["auth", "oauth"],
      operations: expect.arrayContaining([
        "oauth.authorizationUrls.create",
        "oauth.sessions.create",
        "oauth.deviceAuthorizations.create",
        "oauth.deviceAuthorizations.passwordCompletions.create",
        "oauth.deviceAuthorizations.retrieve",
        "oauth.deviceAuthorizations.scans.create",
        "sessions.create",
        "sessions.loginContextSelection.create",
        "sessions.organizationSelection.create",
        "sessions.current.delete",
        "sessions.current.retrieve",
        "sessions.current.update",
        "sessions.refresh",
      ]),
    });
    expect(SDKWORK_IAM_CAPABILITIES.find((capability) => capability.name === "sessionSecurity")?.operations).not.toEqual(
      expect.arrayContaining([
        "loginQrCodeCallbacks.create",
        "loginQrCodes.confirm",
        "loginQrCodes.create",
        "loginQrCodes.retrieve",
      ]),
    );
    expect(SDKWORK_IAM_CAPABILITIES.find((capability) => capability.name === "sessionSecurity")?.operations).not.toContain(
      "registrations.create",
    );
    expect(SDKWORK_IAM_CAPABILITIES.find((capability) => capability.name === "accessControl")).toMatchObject({
      sdkNamespaces: ["iam"],
      operations: expect.arrayContaining([
        "roleBindings.create",
        "roleBindings.delete",
        "roleBindings.list",
        "roles.permissions.create",
        "permissions.list",
        "policies.list",
      ]),
    });
    expect(SDKWORK_IAM_CAPABILITIES.find((capability) => capability.name === "accessControl")?.operations).not.toEqual(
      expect.arrayContaining(["users.roles.create", "users.roles.delete", "users.roles.list"]),
    );
  });

  it("assigns every operation to exactly one composable capability block", () => {
    const operationIds = Object.keys(SDKWORK_IAM_OPERATION_IDS).sort();
    const capabilityOperationIds = SDKWORK_IAM_CAPABILITIES.flatMap((capability) => capability.operations).sort();

    expect(capabilityOperationIds).toEqual(operationIds);
    expect(new Set(capabilityOperationIds).size).toBe(operationIds.length);
  });

  it("creates explicit AppContext and ShardingContext from access token claims", () => {
    const appContext = createIamAppContext({
      appId: "sdkwork-router",
      authLevel: "mfa",
      dataScope: ["tenant:t1", "organization:o1"],
      deploymentMode: "saas",
      environment: "dev",
      organizationId: "o1",
      permissionScope: ["iam.users.read"],
      sessionId: "s1",
      tenantId: "t1",
      userId: "u1",
    });

    expect(appContext).toEqual({
      appId: "sdkwork-router",
      authLevel: "mfa",
      dataScope: ["tenant:t1", "organization:o1"],
      deploymentMode: "saas",
      environment: "dev",
      organizationId: "o1",
      permissionScope: ["iam.users.read"],
      sessionId: "s1",
      tenantId: "t1",
      userId: "u1",
    });

    expect(createIamShardingContext(appContext)).toEqual({
      shardingKey: "o1",
      shardingStrategy: "organization",
    });
  });

  it("keeps ShardingContext as a derived internal context instead of copying duplicate AppContext fields", () => {
    const remoteContext: IamAppContext & Record<string, unknown> = {
      appId: "sdkwork-router",
      authLevel: "password",
      dataScope: ["tenant:t1"],
      deploymentMode: "saas",
      environment: "test",
      permissionScope: ["iam.users.read"],
      sessionId: "s1",
      tenantId: "t1",
      userId: "u1",
      extraContext: "must-not-leak",
      shardingContext: {
        shardingKey: "wrong",
        shardingStrategy: "single",
      },
    };
    const appContext = createIamAppContext(remoteContext);

    expect(appContext).toEqual({
      appId: "sdkwork-router",
      authLevel: "password",
      dataScope: ["tenant:t1"],
      deploymentMode: "saas",
      environment: "test",
      permissionScope: ["iam.users.read"],
      sessionId: "s1",
      tenantId: "t1",
      userId: "u1",
    });
    expect(createIamShardingContext(appContext)).toEqual({
      shardingKey: "t1",
      shardingStrategy: "tenant",
    });
  });
});
