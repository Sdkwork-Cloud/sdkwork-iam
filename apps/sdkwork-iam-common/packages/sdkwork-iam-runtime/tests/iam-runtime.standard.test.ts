import { describe, expect, it, vi } from "vitest";

import { createTokenManager } from "@sdkwork/sdk-common";
import { createTestJwt } from "@sdkwork/runtime-bootstrap";

import {
  createIamRuntime,
  createMemoryIamTokenStore,
  createPersistentIamTokenStore,
  DEFAULT_IAM_SESSION_RETENTION_DAYS,
  isSdkworkIamSessionAuthenticated,
  requireSdkworkIamAuthenticatedSession,
} from "../src/index";
import { BACKEND_OAUTH_RESOURCE_TREE } from "../../sdkwork-iam-sdk-adapter/src/backend-oauth-resource-tree.ts";

const DEFAULT_ACCESS_TOKEN = createTestJwt({
  tenant_id: "100001",
  session_id: "s1",
  app_id: "sdkwork-router",
  environment: "test",
  deployment_mode: "saas",
});
const DEFAULT_AUTH_TOKEN = createTestJwt({
  tenant_id: "100001",
  user_id: "1",
  session_id: "s1",
  app_id: "sdkwork-router",
  auth_level: "password",
});

function sessionAccessToken(marker = "default"): string {
  return createTestJwt({
    tenant_id: "100001",
    session_id: "s1",
    app_id: "sdkwork-router",
    environment: "test",
    deployment_mode: "saas",
    marker,
  });
}

function sessionAuthToken(marker = "default"): string {
  return createTestJwt({
    tenant_id: "100001",
    user_id: "1",
    session_id: "s1",
    app_id: "sdkwork-router",
    auth_level: "password",
    marker,
  });
}

const OLD_ACCESS_TOKEN = sessionAccessToken("old");
const OLD_AUTH_TOKEN = sessionAuthToken("old");
const NEW_ACCESS_TOKEN = sessionAccessToken("new");
const NEW_AUTH_TOKEN = sessionAuthToken("new");
const NEXT_ACCESS_TOKEN = sessionAccessToken("next");
const NEXT_AUTH_TOKEN = sessionAuthToken("next");
const ACCESS_TOKEN_ONLY = sessionAccessToken("only");
const AUTH_TOKEN_ONLY = sessionAuthToken("only");

describe("SDKWork IAM runtime", () => {
  it("uses one dual-token predicate for reusable authenticated-session guards", () => {
    expect(isSdkworkIamSessionAuthenticated({
      accessToken: "access-token",
      authToken: "auth-token",
    })).toBe(true);
    expect(isSdkworkIamSessionAuthenticated({ authToken: "auth-token" })).toBe(false);
    expect(isSdkworkIamSessionAuthenticated({ accessToken: "access-token" })).toBe(false);
    expect(isSdkworkIamSessionAuthenticated({
      accessToken: "  ",
      authToken: "auth-token",
    })).toBe(false);

    expect(() => requireSdkworkIamAuthenticatedSession({
      authToken: "auth-token",
    }, "Sign in required")).toThrow("Sign in required");
  });

  it("bootstraps SaaS deployments through injected app and backend SDK clients", () => {
    const runtime = createIamRuntime({
      clients: {
        appbaseApp: createStandardAppClient(),
        appbaseBackend: {
          iam: createStandardBackendIamClient(),
        },
      },
      config: {
        appApiBaseUrl: "https://api.example.com",
        appId: "sdkwork-router",
        backendApiBaseUrl: "https://admin-api.example.com",
        deploymentMode: "saas",
        environment: "dev",
      },
      tokenStore: createMemoryIamTokenStore(),
    });

    expect(runtime.config).toEqual({
      appApiBaseUrl: "https://api.example.com/app/v3/api",
      appId: "sdkwork-router",
      backendApiBaseUrl: "https://admin-api.example.com/backend/v3/api",
      deploymentMode: "saas",
      environment: "dev",
    });
    expect(runtime.service).toBeDefined();
  });

  it("persists dual tokens and exposes standard auth headers without client request ids", async () => {
    const runtime = createIamRuntime({
      clients: {
        appbaseApp: createStandardAppClient({
          accessToken: DEFAULT_ACCESS_TOKEN,
          authLevel: "password",
          authToken: DEFAULT_AUTH_TOKEN,
          dataScope: ["tenant:100001"],
          deploymentMode: "saas",
          environment: "test",
          permissionScope: ["iam.users.read"],
          refreshToken: "refresh-token",
          sessionId: "s1",
          tenantId: "100001",
          userId: "1",
        }),
      },
      config: {
        appId: "sdkwork-router",
        deploymentMode: "saas",
        environment: "test",
      },
      localeProvider: () => "zh-CN",
      tokenStore: createMemoryIamTokenStore(),
    });

    await runtime.service.auth.sessions.create({
      password: "secret",
      username: "alice",
    });

    expect(await runtime.tokenStore.get()).toEqual({
      accessToken: DEFAULT_ACCESS_TOKEN,
      authToken: DEFAULT_AUTH_TOKEN,
      refreshToken: "refresh-token",
    });
    expect(await runtime.getAuthHeaders()).toEqual({
      "Accept-Language": "zh-CN",
      Authorization: `Bearer ${DEFAULT_AUTH_TOKEN}`,
      "Access-Token": DEFAULT_ACCESS_TOKEN,
    });
  });

  it("does not expose protected auth headers unless authToken and accessToken are both available", async () => {
    const accessTokenOnlyRuntime = createIamRuntime({
      clients: {
        appbaseApp: createStandardAppClient(),
      },
      config: {
        appId: "sdkwork-router",
        deploymentMode: "saas",
        environment: "test",
      },
      localeProvider: () => "zh-CN",
      tokenStore: createMemoryIamTokenStore({
        accessToken: ACCESS_TOKEN_ONLY,
      }),
    });
    const authTokenOnlyRuntime = createIamRuntime({
      clients: {
        appbaseApp: createStandardAppClient(),
      },
      config: {
        appId: "sdkwork-router",
        deploymentMode: "saas",
        environment: "test",
      },
      tokenStore: createMemoryIamTokenStore({
        authToken: AUTH_TOKEN_ONLY,
      }),
    });

    expect(await accessTokenOnlyRuntime.getAuthHeaders()).toEqual({
      "Accept-Language": "zh-CN",
    });
    expect(await authTokenOnlyRuntime.getAuthHeaders()).toEqual({});
  });

  it("stores AppContext and derives ShardingContext after session creation", async () => {
    const runtime = createIamRuntime({
      clients: {
        appbaseApp: createStandardAppClient({
          accessToken: DEFAULT_ACCESS_TOKEN,
          authLevel: "mfa",
          authToken: DEFAULT_AUTH_TOKEN,
          dataScope: ["tenant:100001", "organization:o1"],
          deploymentMode: "saas",
          environment: "prod",
          organizationId: "o1",
          permissionScope: ["iam.organizations.read"],
          sessionId: "s1",
          tenantId: "100001",
          userId: "1",
        }),
      },
      config: {
        appId: "sdkwork-router",
        deploymentMode: "saas",
        environment: "prod",
      },
      tokenStore: createMemoryIamTokenStore(),
    });

    await runtime.service.auth.sessions.create({
      password: "secret",
      username: "alice",
    });

    expect(await runtime.contextStore.getAppContext()).toMatchObject({
      organizationId: "o1",
      tenantId: "100001",
      userId: "1",
    });
    expect(await runtime.contextStore.getShardingContext()).toEqual({
      shardingKey: "o1",
      shardingStrategy: "organization",
    });
  });

  it("clears local token and context stores after current session deletion", async () => {
    const runtime = createIamRuntime({
      clients: {
        appbaseApp: createStandardAppClient({
          accessToken: DEFAULT_ACCESS_TOKEN,
          authToken: DEFAULT_AUTH_TOKEN,
          dataScope: ["tenant:100001"],
          permissionScope: ["iam.users.read"],
          tenantId: "100001",
          userId: "1",
        }),
      },
      config: {
        appId: "sdkwork-router",
        deploymentMode: "saas",
        environment: "test",
      },
      tokenStore: createMemoryIamTokenStore(),
    });

    await runtime.service.auth.sessions.create({
      password: "secret",
      username: "alice",
    });
    await runtime.service.auth.sessions.current.delete();

    expect(await runtime.tokenStore.get()).toEqual({});
    expect(await runtime.contextStore.getAppContext()).toBeUndefined();
    expect(await runtime.contextStore.getShardingContext()).toBeUndefined();
    expect(await runtime.getAuthHeaders()).toEqual({});
    expect(runtime.tokenManager.getTokens()).toEqual({});
  });

  it("clears local token and context stores even when remote current session deletion fails", async () => {
    const appbaseApp = createStandardAppClient({
      accessToken: DEFAULT_ACCESS_TOKEN,
      authToken: DEFAULT_AUTH_TOKEN,
      dataScope: ["tenant:100001"],
      permissionScope: ["iam.users.read"],
      tenantId: "100001",
      userId: "1",
    });
    appbaseApp.auth.sessions.current.delete = vi.fn().mockRejectedValue(new Error("remote logout unavailable"));
    const runtime = createIamRuntime({
      clients: {
        appbaseApp,
      },
      config: {
        appId: "sdkwork-router",
        deploymentMode: "saas",
        environment: "test",
      },
      tokenStore: createMemoryIamTokenStore(),
    });

    await runtime.service.auth.sessions.create({
      password: "secret",
      username: "alice",
    });
    await expect(runtime.service.auth.sessions.current.delete()).rejects.toThrow("remote logout unavailable");

    expect(await runtime.tokenStore.get()).toEqual({});
    expect(await runtime.contextStore.getAppContext()).toBeUndefined();
    expect(await runtime.getAuthHeaders()).toEqual({});
    expect(runtime.tokenManager.getTokens()).toEqual({});
  });

  it("does not update the global token manager when session persistence fails", async () => {
    const tokenManager = createTokenManager();
    const tokenStore = {
      clear: vi.fn(),
      get: vi.fn().mockReturnValue({}),
      set: vi.fn().mockRejectedValue(new Error("cannot persist session")),
    };
    const runtime = createIamRuntime({
      clients: {
        appbaseApp: createStandardAppClient({
          accessToken: DEFAULT_ACCESS_TOKEN,
          authToken: DEFAULT_AUTH_TOKEN,
          refreshToken: "refresh-token",
        }),
      },
      config: {
        appId: "sdkwork-router",
        deploymentMode: "saas",
        environment: "test",
      },
      tokenManager,
      tokenStore,
    });

    await expect(runtime.service.auth.sessions.create({
      password: "secret",
      username: "alice",
    })).rejects.toThrow("cannot persist session");

    expect(tokenManager.getTokens()).toEqual({});
  });

  it("does not carry an old refresh token into a new appbase session", async () => {
    const runtime = createIamRuntime({
      clients: {
        appbaseApp: createStandardAppClient({
          accessToken: NEW_ACCESS_TOKEN,
          authToken: NEW_AUTH_TOKEN,
        }),
      },
      config: {
        appId: "sdkwork-router",
        deploymentMode: "saas",
        environment: "test",
      },
      tokenStore: createMemoryIamTokenStore({
        accessToken: OLD_ACCESS_TOKEN,
        authToken: OLD_AUTH_TOKEN,
        refreshToken: "old-refresh-token",
      }),
    });

    await runtime.service.auth.sessions.create({
      password: "secret",
      username: "alice",
    });

    expect(await runtime.tokenStore.get()).toEqual({
      accessToken: NEW_ACCESS_TOKEN,
      authToken: NEW_AUTH_TOKEN,
    });
    expect(runtime.tokenManager.getTokens()).toEqual({
      accessToken: NEW_ACCESS_TOKEN,
      authToken: NEW_AUTH_TOKEN,
    });
  });

  it("preserves the stored refresh token for current-session continuation responses without a rotated refresh token", async () => {
    const tokenStore = createMemoryIamTokenStore({
      accessToken: OLD_ACCESS_TOKEN,
      authToken: OLD_AUTH_TOKEN,
      refreshToken: "old-refresh-token",
    });
    const runtime = createIamRuntime({
      clients: {
        appbaseApp: createStandardAppClient({
          accessToken: NEXT_ACCESS_TOKEN,
          authToken: NEXT_AUTH_TOKEN,
        }),
      },
      config: {
        appId: "sdkwork-router",
        deploymentMode: "saas",
        environment: "test",
      },
      tokenStore,
    });
    runtime.tokenManager.clearTokens();

    await runtime.service.auth.sessions.refresh({
      refreshToken: "old-refresh-token",
    });

    expect(await runtime.tokenStore.get()).toEqual({
      accessToken: NEXT_ACCESS_TOKEN,
      authToken: NEXT_AUTH_TOKEN,
      refreshToken: "old-refresh-token",
    });
    expect(runtime.tokenManager.getTokens()).toEqual({
      accessToken: NEXT_ACCESS_TOKEN,
      authToken: NEXT_AUTH_TOKEN,
      refreshToken: "old-refresh-token",
    });
  });

  it("clears stale AppContext when the next committed session has no context", async () => {
    const appbaseApp = createStandardAppClient({
      accessToken: DEFAULT_ACCESS_TOKEN,
      authToken: DEFAULT_AUTH_TOKEN,
      dataScope: ["tenant:100001"],
      permissionScope: ["iam.users.read"],
      refreshToken: "refresh-token",
      tenantId: "100001",
      userId: "1",
    });
    const runtime = createIamRuntime({
      clients: {
        appbaseApp,
      },
      config: {
        appId: "sdkwork-router",
        deploymentMode: "saas",
        environment: "test",
      },
      tokenStore: createMemoryIamTokenStore(),
    });

    await runtime.service.auth.sessions.create({
      password: "secret",
      username: "alice",
    });
    expect(await runtime.contextStore.getAppContext()).toMatchObject({
      tenantId: "100001",
      userId: "1",
    });

    appbaseApp.auth.sessions.refresh = vi.fn().mockResolvedValue({
      data: {
        accessToken: NEXT_ACCESS_TOKEN,
        authToken: NEXT_AUTH_TOKEN,
        refreshToken: "next-refresh-token",
      },
    });

    await runtime.service.auth.sessions.refresh({
      refreshToken: "refresh-token",
    });

    expect(await runtime.contextStore.getAppContext()).toBeUndefined();
    expect(await runtime.contextStore.getShardingContext()).toBeUndefined();
    expect(runtime.tokenManager.getTokens()).toEqual({
      accessToken: NEXT_ACCESS_TOKEN,
      authToken: NEXT_AUTH_TOKEN,
      refreshToken: "next-refresh-token",
    });
  });

  it("rolls back stored tokens when context propagation fails during session commit", async () => {
    const tokenManager = createTokenManager();
    const tokenStore = createMemoryIamTokenStore();
    const contextStore = {
      clear: vi.fn(),
      getAppContext: vi.fn(),
      getShardingContext: vi.fn(),
      setAppContext: vi.fn().mockRejectedValue(new Error("cannot persist context")),
    };
    const runtime = createIamRuntime({
      clients: {
        appbaseApp: createStandardAppClient({
          accessToken: DEFAULT_ACCESS_TOKEN,
          authToken: DEFAULT_AUTH_TOKEN,
          dataScope: ["tenant:100001"],
          permissionScope: ["iam.users.read"],
          refreshToken: "refresh-token",
          tenantId: "100001",
          userId: "1",
        }),
      },
      config: {
        appId: "sdkwork-router",
        deploymentMode: "saas",
        environment: "test",
      },
      contextStore,
      tokenManager,
      tokenStore,
    });

    await expect(runtime.service.auth.sessions.create({
      password: "secret",
      username: "alice",
    })).rejects.toThrow("cannot persist context");

    expect(await tokenStore.get()).toEqual({});
    expect(tokenManager.getTokens()).toEqual({});
    expect(contextStore.clear).toHaveBeenCalledTimes(2);
  });

  it("binds one global token manager to appbase and downstream SDK clients", async () => {
    const tokenManager = createTokenManager();
    const appbaseAppClient = createStandardAppClient({
      accessToken: DEFAULT_ACCESS_TOKEN,
      authToken: DEFAULT_AUTH_TOKEN,
      refreshToken: "refresh-token",
      dataScope: ["tenant:100001"],
      permissionScope: ["iam.users.read"],
      tenantId: "100001",
      userId: "1",
    });
    const appbaseBackendClient = {
      iam: createStandardBackendIamClient(),
      setTokenManager: vi.fn(),
    };
    const downstreamAppClient = { setTokenManager: vi.fn() };
    const downstreamBackendClient = { setTokenManager: vi.fn() };

    const runtime = createIamRuntime({
      clients: {
        appbaseApp: appbaseAppClient,
        appbaseBackend: appbaseBackendClient,
        sdkClients: [downstreamAppClient, downstreamBackendClient],
      },
      config: {
        appId: "sdkwork-router",
        deploymentMode: "saas",
        environment: "test",
      },
      tokenManager,
      tokenStore: createMemoryIamTokenStore(),
    });

    expect(appbaseAppClient.setTokenManager).toHaveBeenCalledWith(tokenManager);
    expect(appbaseBackendClient.setTokenManager).toHaveBeenCalledWith(tokenManager);
    expect(downstreamAppClient.setTokenManager).toHaveBeenCalledWith(tokenManager);
    expect(downstreamBackendClient.setTokenManager).toHaveBeenCalledWith(tokenManager);
    expect(runtime.tokenManager).toBe(tokenManager);

    await runtime.service.auth.sessions.create({
      password: "secret",
      username: "alice",
    });

    expect(tokenManager.getTokens()).toEqual({
      accessToken: DEFAULT_ACCESS_TOKEN,
      authToken: DEFAULT_AUTH_TOKEN,
      refreshToken: "refresh-token",
    });
    expect(await runtime.getAuthHeaders()).toEqual({
      Authorization: `Bearer ${DEFAULT_AUTH_TOKEN}`,
      "Access-Token": DEFAULT_ACCESS_TOKEN,
    });

    await runtime.service.auth.sessions.current.delete();

    expect(tokenManager.getTokens()).toEqual({});
  });

  it("validates generated app and backend SDK clients during runtime bootstrap", () => {
    expect(() =>
      createIamRuntime({
        clients: {
          appbaseApp: {
            auth: {
              sessions: {
                create: vi.fn(),
              },
            },
          },
        },
        config: {
          appId: "sdkwork-router",
          deploymentMode: "saas",
          environment: "prod",
        },
        tokenStore: createMemoryIamTokenStore(),
      }),
    ).toThrow(/auth\.sessions\.current\.retrieve/);

    expect(() =>
      createIamRuntime({
        clients: {
          appbaseApp: createStandardAppClient(),
          appbaseBackend: {
            auth: {
              sessions: {
                create: vi.fn(),
              },
            },
            iam: createStandardBackendIamClient(),
          } as any,
        },
        config: {
          appId: "sdkwork-router",
          deploymentMode: "saas",
          environment: "prod",
        },
        tokenStore: createMemoryIamTokenStore(),
      }),
    ).toThrow(/backend SDK client must not expose an auth namespace/);
  });
});

describe("persistent IAM token store", () => {
  it("retains the complete rotating session across runtime recreation", async () => {
    const values = new Map<string, string>();
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      removeItem: (key: string) => {
        values.delete(key);
      },
      setItem: (key: string, value: string) => {
        values.set(key, value);
      },
    };
    const session = {
      accessToken: DEFAULT_ACCESS_TOKEN,
      authToken: DEFAULT_AUTH_TOKEN,
      expiresAt: Date.now() + DEFAULT_IAM_SESSION_RETENTION_DAYS * 24 * 60 * 60 * 1000,
      refreshToken: "rotating-refresh-token",
    };

    await createPersistentIamTokenStore({ appId: "birdcoder", storage }).set(session);
    const restored = await createPersistentIamTokenStore({ appId: "birdcoder", storage }).get();

    expect(restored).toEqual(session);
    expect([...values.keys()]).toEqual(["sdkwork.birdcoder.iamSession.v1"]);
  });

  it("clears malformed persisted sessions instead of authenticating from them", async () => {
    const removeItem = vi.fn();
    const store = createPersistentIamTokenStore({
      appId: "birdcoder",
      storage: {
        getItem: () => "{not-json",
        removeItem,
        setItem: vi.fn(),
      },
    });

    await expect(store.get()).resolves.toEqual({});
    expect(removeItem).toHaveBeenCalledWith("sdkwork.birdcoder.iamSession.v1");
  });
});

interface StandardSessionOptions {
  accessToken?: string;
  authLevel?: "anonymous" | "password" | "mfa" | "system";
  authToken?: string;
  dataScope?: string[];
  deploymentMode?: "saas" | "local" | "private";
  environment?: "dev" | "test" | "prod";
  organizationId?: string;
  permissionScope?: string[];
  refreshToken?: string;
  sessionId?: string;
  tenantId?: string;
  userId?: string;
}

function createStandardAppClient(session: StandardSessionOptions = {}) {
  const sessionData = {
    accessToken: session.accessToken ?? DEFAULT_ACCESS_TOKEN,
    authToken: session.authToken ?? DEFAULT_AUTH_TOKEN,
    context: {
      appId: "sdkwork-router",
      authLevel: session.authLevel ?? "password",
      dataScope: session.dataScope ?? [],
      deploymentMode: session.deploymentMode ?? "saas",
      environment: session.environment ?? "test",
      ...(session.organizationId ? { organizationId: session.organizationId } : {}),
      permissionScope: session.permissionScope ?? [],
      sessionId: session.sessionId ?? "session-id",
      tenantId: session.tenantId ?? "tenant-id",
      userId: session.userId ?? "user-id",
    },
    ...(session.refreshToken ? { refreshToken: session.refreshToken } : {}),
    sessionId: session.sessionId ?? "session-id",
  };

  return {
    setTokenManager: vi.fn(),
    auth: {
      passwordResetRequests: {
        create: vi.fn(),
      },
      passwordResets: {
        create: vi.fn(),
      },
      registrations: {
        create: vi.fn().mockResolvedValue({ data: sessionData }),
      },
      sessions: {
        create: vi.fn().mockResolvedValue({ data: sessionData }),
        loginContextSelection: {
          create: vi.fn().mockResolvedValue({ data: sessionData }),
        },
        organizationSelection: {
          create: vi.fn().mockResolvedValue({ data: sessionData }),
        },
        current: {
          delete: vi.fn().mockResolvedValue({ data: undefined }),
          retrieve: vi.fn().mockResolvedValue({ data: sessionData }),
          update: vi.fn().mockResolvedValue({ data: sessionData }),
        },
        refresh: vi.fn().mockResolvedValue({ data: sessionData }),
      },
    },
    oauth: {
      providers: {
        list: vi.fn(),
      },
      authorizationUrls: {
        create: vi.fn(),
      },
      authorizations: {
        completions: {
          create: vi.fn(),
        },
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
    iam: {
      organizations: {
        list: vi.fn(),
        tree: {
          retrieve: vi.fn(),
        },
      },
      organizationMemberships: {
        list: vi.fn(),
      },
      departments: {
        list: vi.fn(),
        tree: {
          retrieve: vi.fn(),
        },
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
}

function createStandardBackendIamClient() {
  return {
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
    },
    oauth: createBackendOauthResourceMocks(),
  };
}

function createBackendOauthResourceMocks(
  tree: Record<string, unknown> = BACKEND_OAUTH_RESOURCE_TREE,
): Record<string, unknown> {
  const mocks: Record<string, unknown> = {};
  for (const [key, spec] of Object.entries(tree)) {
    if (Array.isArray(spec)) {
      mocks[key] = vi.fn().mockResolvedValue({ data: null });
      continue;
    }
    mocks[key] = createBackendOauthResourceMocks(spec as Record<string, unknown>);
  }
  return mocks;
}
