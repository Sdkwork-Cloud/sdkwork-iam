import { describe, expect, it, vi } from "vitest";
import {
  assertIamAppSdkClient,
  assertIamBackendSdkClient,
  createSdkworkIamService,
  SDKWORK_IAM_CAPABILITIES,
  SDKWORK_IAM_CORE_DOMAIN_RECORD,
  SDKWORK_IAM_CORE_MODULE,
  SDKWORK_IAM_DOMAIN_MODELS,
} from "../src";

describe("sdkwork-iam-core-pc-react", () => {
  it("exposes a canonical iam module record", () => {
    expect(SDKWORK_IAM_CORE_DOMAIN_RECORD).toMatchObject({
      apiTags: ["auth", "iam"],
      databasePrefix: "iam",
      domain: "iam",
      sdkNamespaces: ["auth", "iam"],
    });

    expect(SDKWORK_IAM_CORE_MODULE).toMatchObject({
      architecture: "pc-react",
      capability: "iam-core",
      domain: "iam",
      name: "@sdkwork/iam-core-pc-react",
    });
  });

  it("re-exports composable IAM domain models and capability blocks", () => {
    expect(SDKWORK_IAM_DOMAIN_MODELS.map((model) => model.name)).toContain("tenant");
    expect(SDKWORK_IAM_DOMAIN_MODELS.map((model) => model.name)).toContain("session");
    expect(SDKWORK_IAM_CAPABILITIES.map((capability) => capability.name)).toEqual(
      expect.arrayContaining(["tenantManagement", "sessionSecurity", "accessControl", "securityAudit"]),
    );
  });

  it("creates sessions through the standard resource-style app sdk surface", async () => {
    const commitSession = vi.fn();
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
          create: vi.fn().mockResolvedValue({
            accessToken: "access-token-1",
            authToken: "auth-token-1",
            expiresAt: "2026-05-11T12:00:00Z",
            refreshToken: "refresh-token-1",
            sessionId: "session-1",
            tenantId: "100001",
            user: {
              displayName: "Sdkwork Operator",
              email: "operator@sdkwork.ai",
              userId: "1",
              username: "sdkwork",
            },
          }),
          current: {
            retrieve: vi.fn().mockResolvedValue({
              accessToken: "access-token-2",
              authToken: "auth-token-2",
              sessionId: "session-2",
              tenantId: "tenant-2",
              user: {
                displayName: "Current User",
                userId: "user-2",
              },
            }),
            delete: vi.fn().mockResolvedValue(undefined),
          },
          refresh: vi.fn().mockResolvedValue({
            accessToken: "access-token-3",
            authToken: "auth-token-3",
            refreshToken: "refresh-token-3",
            sessionId: "session-3",
            tenantId: "tenant-3",
          }),
        },
      },
      oauth: createStandardOauthClient(),
      system: {
        iam: {
          runtime: {
            retrieve: vi.fn(),
          },
          verificationPolicy: {
            retrieve: vi.fn(),
          },
        },
      },
      iam: {
        users: {
          current: {
            retrieve: vi.fn().mockResolvedValue({
              displayName: "Current User",
              userId: "user-2",
            }),
          },
        },
      },
    };

    const service = createSdkworkIamService({
      appbaseAppClient: appClient,
      commitSession,
    });

    const session = await service.auth.sessions.create({
      password: "secret",
      username: "sdkwork",
    });
    const current = await service.auth.sessions.current.retrieve();
    const refreshed = await service.auth.sessions.refresh({
      refreshToken: "refresh-token-1",
    });
    await service.auth.sessions.current.delete();

    expect(appClient.auth.sessions.create).toHaveBeenCalledWith({
      password: "secret",
      username: "sdkwork",
    });
    expect(commitSession).toHaveBeenNthCalledWith(1, expect.objectContaining({
      accessToken: "access-token-1",
      authToken: "auth-token-1",
      refreshToken: "refresh-token-1",
    }));
    expect(commitSession).toHaveBeenNthCalledWith(3, expect.objectContaining({
      accessToken: "access-token-3",
      authToken: "auth-token-3",
      refreshToken: "refresh-token-3",
    }), { preserveRefreshToken: true });
    expect(appClient.auth.sessions.current.retrieve).toHaveBeenCalledOnce();
    expect(appClient.auth.sessions.current.delete).toHaveBeenCalledOnce();
    expect(session).toMatchObject({
      accessToken: "access-token-1",
      authToken: "auth-token-1",
      user: {
        displayName: "Sdkwork Operator",
        id: "1",
      },
    });
    expect(current).toMatchObject({
      authToken: "auth-token-2",
      user: {
        displayName: "Current User",
        id: "user-2",
      },
    });
    expect(refreshed).toMatchObject({
      accessToken: "access-token-3",
      authToken: "auth-token-3",
    });
  });

  it("routes backend IAM resources to backend SDK and current user self-service to app SDK", async () => {
    const appClient = {
      iam: {
        users: {
          current: {
            retrieve: vi.fn().mockResolvedValue({
              displayName: "App Current User",
              userId: "app-user",
            }),
          },
        },
      },
    };
    const backendClient = {
      iam: {
        organizations: {
          retrieve: vi.fn().mockResolvedValue({ organizationId: "org-1", name: "Platform" }),
        },
        organizationMemberships: {
          create: vi.fn().mockResolvedValue({ membershipId: "membership-1" }),
        },
        permissions: {
          list: vi.fn().mockResolvedValue([{ code: "iam.users.read" }]),
        },
        roles: {
          permissions: {
            delete: vi.fn().mockResolvedValue(undefined),
          },
        },
        tenants: {
          list: vi.fn().mockResolvedValue([{ name: "Default", tenantId: "100001" }]),
          members: {
            list: vi.fn().mockResolvedValue([{ tenantId: "100001", userId: "1" }]),
          },
        },
        users: {
          list: vi.fn().mockResolvedValue([{ userId: "1" }]),
          retrieve: vi.fn().mockResolvedValue({
            displayName: "Backend User",
            userId: "backend-user",
          }),
        },
      },
    };

    const service = createSdkworkIamService({
      appbaseAppClient: appClient,
      appbaseBackendClient: backendClient,
    });

    await expect(service.iam.tenants.list({ page_size: 20 })).resolves.toEqual([
      {
        name: "Default",
        tenantId: "100001",
      },
    ]);
    await expect(service.iam.users.current.retrieve()).resolves.toMatchObject({
      displayName: "App Current User",
      id: "app-user",
    });
    await expect(service.iam.organizationMemberships.create({ organizationId: "org-1", userId: "1" })).resolves.toEqual({
      membershipId: "membership-1",
    });
    await expect(service.iam.roles.permissions.delete("role-1", "iam.users.read")).resolves.toBeUndefined();

    expect(backendClient.iam.tenants.list).toHaveBeenCalledWith({ page_size: 20 });
    expect(backendClient.iam.organizationMemberships.create).toHaveBeenCalledWith({
      organizationId: "org-1",
      userId: "1",
    });
    expect(backendClient.iam.roles.permissions.delete).toHaveBeenCalledWith(
      "role-1",
      "iam.users.read",
    );
    expect(appClient.iam.users.current.retrieve).toHaveBeenCalledOnce();
  });

  it("re-exports strict generated SDK surface validators for app and backend IAM clients", () => {
    const appClient = {
      auth: {
        passwordResetRequests: { create: vi.fn() },
        passwordResets: { create: vi.fn() },
        registrations: { create: vi.fn() },
        sessions: {
          create: vi.fn(),
          organizationSelection: {
            create: vi.fn(),
          },
          loginContextSelection: {
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
      oauth: createStandardOauthClient(),
      system: {
        iam: {
          runtime: { retrieve: vi.fn() },
          verificationPolicy: { retrieve: vi.fn() },
          accountBindingPolicy: { retrieve: vi.fn() },
        },
      },
      iam: {
        organizations: {
          list: vi.fn(),
          tree: { retrieve: vi.fn() },
        },
        organizationMemberships: {
          list: vi.fn(),
        },
        departments: {
          list: vi.fn(),
          tree: { retrieve: vi.fn() },
        },
        departmentAssignments: {
          list: vi.fn(),
        },
        positions: {
          list: vi.fn(),
        },
        positionAssignments: {
          list: vi.fn(),
        },
        roleBindings: {
          list: vi.fn(),
        },
        users: {
          current: {
            retrieve: vi.fn(),
            update: vi.fn(),
            emailBindings: {
              create: vi.fn(),
              delete: vi.fn(),
            },
            phoneBindings: {
              create: vi.fn(),
              delete: vi.fn(),
            },
            password: {
              update: vi.fn(),
            },
          },
        },
      },
    };
    const backendClient = {
      iam: {
        accessCredentials: {
          create: vi.fn(),
        },
        applications: {
          register: vi.fn(),
        },
        apiKeys: { list: vi.fn(), revoke: vi.fn() },
        auditEvents: { list: vi.fn(), retrieve: vi.fn() },
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
          permissions: { create: vi.fn(), delete: vi.fn(), list: vi.fn() },
        },
        roleBindings: {
          create: vi.fn(),
          delete: vi.fn(),
        },
        securityEvents: { list: vi.fn(), retrieve: vi.fn() },
        tenantApplications: {
          enable: vi.fn(),
          provision: vi.fn(),
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
        },
      },
    };

    expect(() => assertIamAppSdkClient(appClient)).not.toThrow();
    expect(() => assertIamBackendSdkClient(backendClient)).not.toThrow();
  });

  it("fails with a clear standard error when a required sdk resource is missing", async () => {
    const service = createSdkworkIamService({
      appbaseAppClient: {},
    });

    await expect(service.auth.sessions.create({ username: "sdkwork", password: "secret" })).rejects.toThrow(
      "Missing SDKWork IAM SDK resource: appbaseAppClient.auth.sessions.create",
    );
    await expect(service.iam.tenants.list()).rejects.toThrow(
      "Missing SDKWork IAM SDK resource: iam.tenants.list",
    );
  });
});

function createStandardOauthClient() {
  return {
    providers: {
      list: vi.fn(),
    },
    authorizationUrls: {
      create: vi.fn(),
    },
    deviceAuthorizations: {
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
    },
    callbacks: {
      create: vi.fn(),
      retrieve: vi.fn(),
    },
    miniProgramSessions: {
      create: vi.fn(),
    },
    sessions: {
      create: vi.fn(),
    },
    accountLinks: {
      delete: vi.fn(),
      list: vi.fn(),
    },
    grants: {
      delete: vi.fn(),
      list: vi.fn(),
    },
  };
}
