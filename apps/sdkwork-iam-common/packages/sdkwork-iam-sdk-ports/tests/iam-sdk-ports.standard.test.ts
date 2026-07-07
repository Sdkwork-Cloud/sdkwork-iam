import { describe, expect, it, vi } from "vitest";

import { SDKWORK_IAM_OPERATION_IDS } from "@sdkwork/iam-contracts";

import {
  SDKWORK_IAM_APP_SDK_REQUIRED_METHODS,
  SDKWORK_IAM_BACKEND_SDK_REQUIRED_METHODS,
  assertIamAppSdkClient,
  assertIamBackendSdkClient,
  getIamSdkSurface,
} from "../src/index";
import { createGeneratedBackendOauthClient } from "../../sdkwork-iam-sdk-adapter/tests/backend-oauth-test-resources";

describe("SDKWork IAM SDK port contracts", () => {
  it("derives required SDK methods from the canonical IAM OpenAPI operation contracts", () => {
    const appOperationIds = Object.values(SDKWORK_IAM_OPERATION_IDS)
      .filter((operation) => operation.path.startsWith("/app/v3/api"))
      .map((operation) => operation.operationId)
      .sort();
    const backendOperationIds = Object.values(SDKWORK_IAM_OPERATION_IDS)
      .filter((operation) => operation.path.startsWith("/backend/v3/api"))
      .map((operation) => operation.operationId)
      .sort();

    expect([...SDKWORK_IAM_APP_SDK_REQUIRED_METHODS].sort()).toEqual(
      Object.values(SDKWORK_IAM_OPERATION_IDS)
        .filter((operation) => operation.path.startsWith("/app/v3/api"))
        .map(toRequiredSdkMethod)
        .sort(),
    );
    expect([...SDKWORK_IAM_BACKEND_SDK_REQUIRED_METHODS].sort()).toEqual(
      Object.values(SDKWORK_IAM_OPERATION_IDS)
        .filter((operation) => operation.path.startsWith("/backend/v3/api"))
        .map(toRequiredSdkMethod)
        .sort(),
    );
    expect(SDKWORK_IAM_APP_SDK_REQUIRED_METHODS).toEqual(
      expect.arrayContaining([
        "iam.organizations.list",
        "iam.organizations.tree.retrieve",
        "iam.organizationMemberships.list",
        "iam.departments.list",
        "iam.departments.tree.retrieve",
        "iam.departmentAssignments.list",
        "iam.positions.list",
        "iam.positionAssignments.list",
        "iam.roleBindings.list",
        "oauth.authorizationUrls.create",
        "oauth.authorizations.completions.create",
        "oauth.deviceAuthorizations.create",
        "oauth.deviceAuthorizations.retrieve",
        "oauth.deviceAuthorizations.scans.create",
        "oauth.deviceAuthorizations.passwordCompletions.create",
        "oauth.deviceAuthorizations.sessionExchanges.create",
        "oauth.sessions.create",
      ]),
    );
    expect(SDKWORK_IAM_APP_SDK_REQUIRED_METHODS).not.toContain("oauth.oauth.deviceAuthorizations.create");
    expect(SDKWORK_IAM_APP_SDK_REQUIRED_METHODS).not.toContain("openPlatform.qrAuth.sessions.create");
    expect(SDKWORK_IAM_BACKEND_SDK_REQUIRED_METHODS).toEqual(
      expect.arrayContaining([
        "iam.organizations.create",
        "iam.organizations.retrieve",
        "iam.organizationMemberships.create",
        "iam.organizationMemberships.update",
        "iam.departments.create",
        "iam.departments.retrieve",
        "iam.departmentAssignments.create",
        "iam.positions.create",
        "iam.positionAssignments.create",
        "iam.roleBindings.create",
      ]),
    );
    expect(SDKWORK_IAM_BACKEND_SDK_REQUIRED_METHODS).not.toContain("iam.users.current.retrieve");
    expect(SDKWORK_IAM_BACKEND_SDK_REQUIRED_METHODS).not.toContain("iam.organizations.list");
    expect(SDKWORK_IAM_BACKEND_SDK_REQUIRED_METHODS).not.toContain("iam.departments.list");
    expect(SDKWORK_IAM_BACKEND_SDK_REQUIRED_METHODS).not.toContain("iam.users.roles.create");
    expect(SDKWORK_IAM_BACKEND_SDK_REQUIRED_METHODS).not.toContain("iam.users.roles.delete");
    expect(SDKWORK_IAM_BACKEND_SDK_REQUIRED_METHODS).not.toContain("iam.users.roles.list");
    expect(SDKWORK_IAM_BACKEND_SDK_REQUIRED_METHODS).not.toContain("iam.organizations.members.create");
    expect(SDKWORK_IAM_BACKEND_SDK_REQUIRED_METHODS).not.toContain("iam.organizations.members.delete");
    expect(SDKWORK_IAM_BACKEND_SDK_REQUIRED_METHODS).not.toContain("iam.organizations.members.list");
    expect(SDKWORK_IAM_BACKEND_SDK_REQUIRED_METHODS).not.toContain("iam.organizations.members.update");
  });

  it("accepts generated app SDK clients with resource-oriented auth and iam namespaces", () => {
    const appClient = {
      auth: {
        passwordResetRequests: {
          create: vi.fn(),
        },
        passwordResets: {
          create: vi.fn(),
        },
        registrations: {
          create: vi.fn(),
        },
        sessions: {
          create: vi.fn(),
          loginContextSelection: {
            create: vi.fn(),
          },
          organizationSelection: {
            create: vi.fn(),
          },
          current: {
            delete: vi.fn(),
            retrieve: vi.fn(),
            update: vi.fn(),
          },
          refresh: vi.fn(),
        },
      },
      oauth: createAppOAuthResources(),
      system: {
        iam: {
          runtime: {
            retrieve: vi.fn(),
          },
          verificationPolicy: {
            retrieve: vi.fn(),
          },
          accountBindingPolicy: {
            retrieve: vi.fn(),
          },
        },
      },
      iam: createAppIamDirectoryResources(),
    };

    expect(() => assertIamAppSdkClient(appClient)).not.toThrow();
    expect(getIamSdkSurface(appClient)).toContain("auth.sessions.create");
    expect(getIamSdkSurface(appClient)).not.toContain("auth.loginQrCodeCallbacks.create");
    expect(getIamSdkSurface(appClient)).not.toContain("auth.loginQrCodes.confirm");
    expect(getIamSdkSurface(appClient)).not.toContain("auth.loginQrCodes.create");
    expect(getIamSdkSurface(appClient)).not.toContain("auth.loginQrCodes.retrieve");
    expect(getIamSdkSurface(appClient)).toContain("oauth.deviceAuthorizations.create");
    expect(getIamSdkSurface(appClient)).toContain("oauth.deviceAuthorizations.retrieve");
    expect(getIamSdkSurface(appClient)).toContain("oauth.deviceAuthorizations.scans.create");
    expect(getIamSdkSurface(appClient)).toContain("oauth.deviceAuthorizations.passwordCompletions.create");
    expect(getIamSdkSurface(appClient)).toContain("oauth.deviceAuthorizations.sessionExchanges.create");
    expect(getIamSdkSurface(appClient)).not.toContain("openPlatform.qrAuth.sessions.create");
    expect(getIamSdkSurface(appClient)).toContain("auth.registrations.create");
    expect(getIamSdkSurface(appClient)).toContain("auth.sessions.current.retrieve");
    expect(getIamSdkSurface(appClient)).not.toContain("auth.verificationPolicy.retrieve");
    expect(getIamSdkSurface(appClient)).toContain("system.iam.runtime.retrieve");
    expect(getIamSdkSurface(appClient)).toContain("system.iam.verificationPolicy.retrieve");
    expect(getIamSdkSurface(appClient)).not.toContain("auth.verificationCodes.create");
    expect(getIamSdkSurface(appClient)).toContain("auth.passwordResetRequests.create");
    expect(getIamSdkSurface(appClient)).toContain("oauth.authorizationUrls.create");
    expect(getIamSdkSurface(appClient)).toContain("oauth.authorizations.completions.create");
    expect(getIamSdkSurface(appClient)).toContain("oauth.sessions.create");
    expect(getIamSdkSurface(appClient)).toContain("iam.users.current.retrieve");
    expect(getIamSdkSurface(appClient)).toContain("iam.organizations.list");
    expect(getIamSdkSurface(appClient)).toContain("iam.organizations.tree.retrieve");
    expect(getIamSdkSurface(appClient)).toContain("iam.organizationMemberships.list");
    expect(getIamSdkSurface(appClient)).toContain("iam.departments.list");
    expect(getIamSdkSurface(appClient)).toContain("iam.departments.tree.retrieve");
    expect(getIamSdkSurface(appClient)).toContain("iam.departmentAssignments.list");
    expect(getIamSdkSurface(appClient)).toContain("iam.positions.list");
    expect(getIamSdkSurface(appClient)).toContain("iam.positionAssignments.list");
    expect(getIamSdkSurface(appClient)).toContain("iam.roleBindings.list");
    expect(getIamSdkSurface(appClient)).not.toContain("iam.departmentMembers.list");
  });

  it("accepts generated app SDK clients whose operation methods live on class prototypes", () => {
    class OperationResource {
      async confirm() {
        return {};
      }

      async list() {
        return {};
      }

      async create() {
        return {};
      }

      async retrieve() {
        return {};
      }

      async update() {
        return {};
      }

      async delete() {
        return {};
      }

      async refresh() {
        return {};
      }

      async verify() {
        return {};
      }

      async handleGet() {
        return {};
      }

      async handlePost() {
        return {};
      }
    }

    const appClient = {
      auth: {
        passwordResetRequests: new OperationResource(),
        passwordResets: new OperationResource(),
        registrations: new OperationResource(),
        sessions: {
          create: new OperationResource().create,
          loginContextSelection: {
            create: new OperationResource().create,
          },
          organizationSelection: {
            create: new OperationResource().create,
          },
          current: new OperationResource(),
          refresh: new OperationResource().refresh,
        },
      },
      oauth: createAppOAuthResources(() => new OperationResource()),
      system: {
        iam: {
          runtime: new OperationResource(),
          verificationPolicy: new OperationResource(),
          accountBindingPolicy: new OperationResource(),
        },
      },
      iam: createAppIamDirectoryResources(
        () => new OperationResource() as unknown as Record<string, unknown>,
      ),
    };

    expect(() => assertIamAppSdkClient(appClient)).not.toThrow();
    expect(getIamSdkSurface(appClient)).toContain("auth.sessions.current.retrieve");
    expect(getIamSdkSurface(appClient)).toContain("system.iam.runtime.retrieve");
    expect(getIamSdkSurface(appClient)).toContain("system.iam.verificationPolicy.retrieve");
    expect(getIamSdkSurface(appClient)).toContain("iam.users.current.retrieve");
    expect(getIamSdkSurface(appClient)).toContain("iam.departments.list");
    expect(getIamSdkSurface(appClient)).toContain("iam.departmentAssignments.list");
  });

  it("rejects retired IAM QR login resources because OAuth device authorization owns QR login", () => {
    const appClient = {
      auth: {
        loginQrCodeCallbacks: {
          create: vi.fn(),
        },
        loginQrCodes: {
          confirm: vi.fn(),
          create: vi.fn(),
          retrieve: vi.fn(),
        },
        passwordResetRequests: {
          create: vi.fn(),
        },
        passwordResets: {
          create: vi.fn(),
        },
        registrations: {
          create: vi.fn(),
        },
        sessions: {
          create: vi.fn(),
          current: {
            delete: vi.fn(),
            retrieve: vi.fn(),
            update: vi.fn(),
          },
          refresh: vi.fn(),
        },
      },
      oauth: createAppOAuthResources(),
      system: {
        iam: {
          runtime: {
            retrieve: vi.fn(),
          },
          verificationPolicy: {
            retrieve: vi.fn(),
          },
          accountBindingPolicy: {
            retrieve: vi.fn(),
          },
        },
      },
      iam: createAppIamDirectoryResources(),
    };

    expect(() => assertIamAppSdkClient(appClient)).toThrow(/retired IAM QR login resources/i);
  });

  it("rejects legacy flat app SDK methods that would produce client.auth.createSession", () => {
    const legacyAppClient = {
      auth: {
        createSession: vi.fn(),
      },
    };

    expect(() => assertIamAppSdkClient(legacyAppClient)).toThrow(
      /forbidden legacy IAM methods.*auth\.createSession/i,
    );
  });

  it("rejects app SDK clients that expose legacy user profile methods", () => {
    const legacyAppClient = {
      auth: {
        passwordResetRequests: { create: vi.fn() },
        passwordResets: { create: vi.fn() },
        registrations: { create: vi.fn() },
        sessions: {
          create: vi.fn(),
          current: {
            delete: vi.fn(),
            retrieve: vi.fn(),
            update: vi.fn(),
          },
          refresh: vi.fn(),
        },
      },
      oauth: createAppOAuthResources(),
      system: {
        iam: {
          runtime: {
            retrieve: vi.fn(),
          },
          verificationPolicy: {
            retrieve: vi.fn(),
          },
          accountBindingPolicy: {
            retrieve: vi.fn(),
          },
        },
      },
      iam: createAppIamDirectoryResources(),
      user: {
        getUserProfile: vi.fn(),
      },
    };

    expect(() => assertIamAppSdkClient(legacyAppClient)).toThrow(
      /forbidden legacy IAM methods.*user\.getUserProfile/i,
    );
  });

  it("rejects retired open platform QR auth resources before runtime integration", () => {
    const retiredQrAppClient = {
      auth: {
        passwordResetRequests: {
          create: vi.fn(),
        },
        passwordResets: {
          create: vi.fn(),
        },
        registrations: {
          create: vi.fn(),
        },
        sessions: {
          create: vi.fn(),
          current: {
            delete: vi.fn(),
            retrieve: vi.fn(),
            update: vi.fn(),
          },
          refresh: vi.fn(),
        },
      },
      oauth: createAppOAuthResources(),
      openPlatform: {
        qrAuth: {
          sessions: {
            create: vi.fn(),
            retrieve: vi.fn(),
            passwords: {
              create: vi.fn(),
            },
            scans: {
              create: vi.fn(),
            },
          },
        },
      },
      system: {
        iam: {
          runtime: {
            retrieve: vi.fn(),
          },
          verificationPolicy: {
            retrieve: vi.fn(),
          },
          accountBindingPolicy: {
            retrieve: vi.fn(),
          },
        },
      },
      iam: createAppIamDirectoryResources(),
    };

    expect(() => assertIamAppSdkClient(retiredQrAppClient)).toThrow(
      /retired openPlatform QR auth resources.*openPlatform\.qrAuth\.sessions\.create/i,
    );
  });

  it("rejects incomplete generated app SDK clients before application integration", () => {
    const incompleteAppClient = {
      auth: {
        sessions: {
          create: vi.fn(),
        },
      },
      iam: {
        users: {
          current: {
            retrieve: vi.fn(),
          },
        },
      },
    };

    expect(() => assertIamAppSdkClient(incompleteAppClient)).toThrow(
      /auth\.sessions\.current\.retrieve/,
    );
  });

  it("rejects backend SDK clients that expose login or session creation", () => {
    const invalidBackendClient = {
      auth: {
        sessions: {
          create: vi.fn(),
        },
      },
      iam: {
        users: {
          list: vi.fn(),
        },
      },
    };

    expect(() => assertIamBackendSdkClient(invalidBackendClient)).toThrow(/backend.*auth namespace/i);
  });

  it("rejects backend SDK clients that expose a legacy auth namespace even without methods", () => {
    const invalidBackendClient = {
      auth: {},
      iam: createBackendIamManagementResources().iam,
    };

    expect(() => assertIamBackendSdkClient(invalidBackendClient)).toThrow(/backend.*auth namespace/i);
  });

  it("rejects backend SDK clients with any auth namespace to keep login only in app API", () => {
    const invalidBackendClient = {
      auth: {
        verificationCodes: {
          create: vi.fn(),
        },
      },
      iam: {
        users: {
          list: vi.fn(),
        },
      },
    };

    expect(() => assertIamBackendSdkClient(invalidBackendClient)).toThrow(/backend.*auth namespace/i);
  });

  it("rejects backend SDK clients that expose legacy management namespaces", () => {
    const invalidBackendClient = {
      iam: createBackendIamManagementResources().iam,
      tenant: {},
    };

    expect(() => assertIamBackendSdkClient(invalidBackendClient)).toThrow(
      /forbidden legacy IAM namespaces.*tenant/i,
    );
  });

  it("rejects backend SDK clients that expose app-only IAM self-service resources", () => {
    const invalidBackendClient = {
      iam: {
        apiKeys: { list: vi.fn(), revoke: vi.fn() },
        auditEvents: { list: vi.fn() },
        organizations: {
          list: vi.fn(),
          tree: {
            retrieve: vi.fn(),
          },
          members: { create: vi.fn(), list: vi.fn() },
        },
        organizationMemberships: { list: vi.fn() },
        departments: {
          list: vi.fn(),
          tree: {
            retrieve: vi.fn(),
          },
        },
        departmentAssignments: { list: vi.fn() },
        permissions: { list: vi.fn() },
        positions: { list: vi.fn() },
        positionAssignments: { list: vi.fn() },
        policies: { list: vi.fn() },
        roles: {
          list: vi.fn(),
          permissions: { create: vi.fn(), delete: vi.fn(), list: vi.fn() },
        },
        roleBindings: { list: vi.fn() },
        securityEvents: { list: vi.fn() },
        tenants: {
          list: vi.fn(),
          members: { list: vi.fn() },
        },
        users: {
          current: {
            retrieve: vi.fn(),
          },
          list: vi.fn(),
          retrieve: vi.fn(),
        },
      },
    };

    expect(() => assertIamBackendSdkClient(invalidBackendClient)).toThrow(
      /app-only IAM resource.*iam\.organizations\.list/i,
    );
  });

  it("rejects backend SDK clients that expose retired organization member subresources", () => {
    const invalidBackendClient = {
      iam: {
        organizations: {
          create: vi.fn(),
          delete: vi.fn(),
          retrieve: vi.fn(),
          update: vi.fn(),
          members: {
            create: vi.fn(),
          },
        },
      },
    };

    expect(() => assertIamBackendSdkClient(invalidBackendClient)).toThrow(
      /retired IAM organization member resource.*iam\.organizations\.members\.create/i,
    );
  });

  it("rejects backend SDK clients that expose retired direct user role resources", () => {
    const invalidBackendClient = createBackendIamManagementResources({
      usersRoles: true,
    });

    expect(() => assertIamBackendSdkClient(invalidBackendClient)).toThrow(
      /retired IAM direct user role resource.*iam\.users\.roles\.create/i,
    );
  });

  it("accepts backend SDK clients that only manage IAM resources", () => {
    const backendClient = createBackendIamManagementResources();

    expect(() => assertIamBackendSdkClient(backendClient)).not.toThrow();
    expect(getIamSdkSurface(backendClient)).toContain("iam.organizationMemberships.create");
    expect(getIamSdkSurface(backendClient)).toContain("iam.departments.retrieve");
    expect(getIamSdkSurface(backendClient)).toContain("iam.departmentAssignments.update");
    expect(getIamSdkSurface(backendClient)).toContain("iam.positions.update");
    expect(getIamSdkSurface(backendClient)).toContain("iam.positionAssignments.create");
    expect(getIamSdkSurface(backendClient)).toContain("iam.roleBindings.delete");
    expect(getIamSdkSurface(backendClient)).not.toContain("iam.organizations.members.create");
    expect(getIamSdkSurface(backendClient)).not.toContain("iam.organizations.members.delete");
    expect(getIamSdkSurface(backendClient)).not.toContain("iam.organizations.members.list");
    expect(getIamSdkSurface(backendClient)).not.toContain("iam.organizations.members.update");
    expect(getIamSdkSurface(backendClient)).not.toContain("iam.users.roles.create");
    expect(getIamSdkSurface(backendClient)).not.toContain("iam.users.roles.delete");
    expect(getIamSdkSurface(backendClient)).not.toContain("iam.users.roles.list");
    expect(getIamSdkSurface(backendClient)).not.toContain("iam.organizations.tree.retrieve");
    expect(getIamSdkSurface(backendClient)).not.toContain("iam.departments.list");
    expect(getIamSdkSurface(backendClient)).toContain("iam.roles.permissions.delete");
    expect(getIamSdkSurface(backendClient)).toContain("iam.tenants.members.update");
  });

  it("rejects incomplete backend SDK clients before administrative IAM integration", () => {
    const incompleteBackendClient = {
      iam: {
        users: {
          list: vi.fn(),
        },
      },
    };

    expect(() => assertIamBackendSdkClient(incompleteBackendClient)).toThrow(
      /iam\.apiKeys\.list/,
    );
  });
});

function toRequiredSdkMethod(operation: { operationId: string; tag: string }): string {
  return operation.operationId.startsWith(`${operation.tag}.`)
    ? operation.operationId
    : `${operation.tag}.${operation.operationId}`;
}

function createAppOAuthResources(createResource?: () => object) {
  const resource = () => createResource?.() ?? {};
  return {
    providers: Object.assign(resource(), {
      list: vi.fn(),
    }),
    authorizationUrls: Object.assign(resource(), {
      create: vi.fn(),
    }),
    authorizations: Object.assign(resource(), {
      completions: {
        create: vi.fn(),
      },
    }),
    deviceAuthorizations: Object.assign(resource(), {
      create: vi.fn(),
      retrieve: vi.fn(),
      scans: {
        create: vi.fn(),
      },
      passwordCompletions: {
        create: vi.fn(),
      },
      sessionExchanges: {
        create: vi.fn(),
      },
    }),
    callbacks: Object.assign(resource(), {
      handleGet: vi.fn(),
      handlePost: vi.fn(),
    }),
    miniProgramSessions: Object.assign(resource(), {
      create: vi.fn(),
    }),
    sessions: Object.assign(resource(), {
      create: vi.fn(),
    }),
    accountLinks: Object.assign(resource(), {
      delete: vi.fn(),
      list: vi.fn(),
    }),
    grants: Object.assign(resource(), {
      delete: vi.fn(),
      list: vi.fn(),
    }),
  };
}

function createAppIamDirectoryResources(createResource?: () => Record<string, unknown>) {
  const listResource = () => createResource?.() ?? { list: vi.fn() };
  const retrieveResource = () => createResource?.() ?? { retrieve: vi.fn() };
  const withTree = (resource: Record<string, unknown>) => Object.assign(resource, {
    tree: retrieveResource(),
  });
  const currentResource = createResource?.() ?? { retrieve: vi.fn() };

  return {
    organizations: withTree(listResource()),
    organizationMemberships: listResource(),
    departments: withTree(listResource()),
    departmentAssignments: listResource(),
    positions: listResource(),
    positionAssignments: listResource(),
    roleBindings: listResource(),
    users: {
      current: {
        retrieve: typeof currentResource.retrieve === "function" ? currentResource.retrieve : vi.fn(),
        update: typeof currentResource.update === "function" ? currentResource.update : vi.fn(),
        emailBindings: {
          create: typeof currentResource.create === "function" ? currentResource.create : vi.fn(),
          delete: typeof currentResource.delete === "function" ? currentResource.delete : vi.fn(),
        },
        phoneBindings: {
          create: typeof currentResource.create === "function" ? currentResource.create : vi.fn(),
          delete: typeof currentResource.delete === "function" ? currentResource.delete : vi.fn(),
        },
        password: {
          update: typeof currentResource.update === "function" ? currentResource.update : vi.fn(),
        },
      },
    },
  };
}

function createBackendIamManagementResources(options?: { usersRoles?: boolean }) {
  return {
    iam: {
      accessCredentials: {
        create: vi.fn(),
      },
      applications: {
        register: vi.fn(),
      },
      apiKeys: {
        list: vi.fn(),
        revoke: vi.fn(),
      },
      auditEvents: {
        list: vi.fn(),
        retrieve: vi.fn(),
      },
      organizations: {
        create: vi.fn(),
        delete: vi.fn(),
        retrieve: vi.fn(),
        update: vi.fn(),
      },
      organizationMemberships: {
        create: vi.fn(),
        update: vi.fn(),
      },
      departments: {
        create: vi.fn(),
        delete: vi.fn(),
        retrieve: vi.fn(),
        update: vi.fn(),
      },
      departmentAssignments: {
        create: vi.fn(),
        update: vi.fn(),
      },
      permissions: {
        create: vi.fn(),
        delete: vi.fn(),
        list: vi.fn(),
        retrieve: vi.fn(),
        update: vi.fn(),
      },
      policies: {
        create: vi.fn(),
        delete: vi.fn(),
        list: vi.fn(),
        retrieve: vi.fn(),
        update: vi.fn(),
      },
      accountBindingPolicy: {
        retrieve: vi.fn(),
        update: vi.fn(),
      },
      positions: {
        create: vi.fn(),
        delete: vi.fn(),
        update: vi.fn(),
      },
      positionAssignments: {
        create: vi.fn(),
        update: vi.fn(),
      },
      roles: {
        create: vi.fn(),
        delete: vi.fn(),
        list: vi.fn(),
        retrieve: vi.fn(),
        update: vi.fn(),
        permissions: {
          create: vi.fn(),
          delete: vi.fn(),
          list: vi.fn(),
        },
      },
      roleBindings: {
        create: vi.fn(),
        delete: vi.fn(),
      },
      securityEvents: {
        list: vi.fn(),
        retrieve: vi.fn(),
      },
      tenantApplications: {
        enable: vi.fn(),
        provision: vi.fn(),
        retrieve: vi.fn(),
        update: vi.fn(),
      },
      tenants: {
        create: vi.fn(),
        delete: vi.fn(),
        list: vi.fn(),
        retrieve: vi.fn(),
        update: vi.fn(),
        members: {
          create: vi.fn(),
          delete: vi.fn(),
          list: vi.fn(),
          update: vi.fn(),
        },
      },
      users: {
        create: vi.fn(),
        delete: vi.fn(),
        list: vi.fn(),
        retrieve: vi.fn(),
        update: vi.fn(),
        ...(options?.usersRoles
          ? {
              roles: {
                create: vi.fn(),
                delete: vi.fn(),
                list: vi.fn(),
              },
            }
          : {}),
      },
      oauth: createGeneratedBackendOauthClient(),
    },
  };
}
