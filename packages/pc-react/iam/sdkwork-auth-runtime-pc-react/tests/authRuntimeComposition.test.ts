import { describe, expect, it, vi } from "vitest";

import * as authRuntimePackage from "../src/index.ts";
import {
  SDKWORK_IAM_APP_SDK_REQUIRED_METHODS,
} from "@sdkwork/iam-sdk-ports";
import { createTestJwt } from "@sdkwork/runtime-bootstrap";

const ACCESS_TOKEN = createTestJwt({
  tenant_id: "t_demo",
  user_id: "alice",
  app_id: "sdkwork-chat-pc",
  marker: "access",
});
const AUTH_TOKEN = createTestJwt({
  tenant_id: "t_demo",
  user_id: "alice",
  app_id: "sdkwork-chat-pc",
  auth_level: "password",
  marker: "auth",
});
const OLD_ACCESS_TOKEN = createTestJwt({ tenant_id: "t_demo", user_id: "alice", marker: "old-access" });
const OLD_AUTH_TOKEN = createTestJwt({
  tenant_id: "t_demo",
  user_id: "alice",
  auth_level: "password",
  marker: "old-auth",
});
const NEW_ACCESS_TOKEN = createTestJwt({ tenant_id: "t_demo", user_id: "alice", marker: "new-access" });
const NEW_AUTH_TOKEN = createTestJwt({
  tenant_id: "t_demo",
  user_id: "alice",
  auth_level: "password",
  marker: "new-auth",
});
const REGISTERED_ACCESS_TOKEN = createTestJwt({ tenant_id: "t_demo", marker: "registered-access" });
const REGISTERED_AUTH_TOKEN = createTestJwt({
  tenant_id: "t_demo",
  auth_level: "password",
  marker: "registered-auth",
});
const PARTIAL_AUTH_TOKEN = createTestJwt({
  tenant_id: "t_demo",
  auth_level: "password",
  marker: "partial-auth",
});

function requireExport<T>(name: string): T {
  return (authRuntimePackage as Record<string, unknown>)[name] as T;
}

describe("auth-runtime composition", () => {
  it("creates a standard appbase PC auth runtime with one token manager and app-owned hooks", async () => {
    const createSdkworkAppbasePcAuthRuntime = requireExport<
      ((options: {
        app: {
          appId: string;
          deploymentMode: "local" | "private" | "saas";
          environment: "dev" | "prod" | "test";
          platform?: string;
        };
        baseUrls: {
          appbaseAppApiBaseUrl: string;
        };
        createAppbaseAppClient: (config: Record<string, unknown>) => any;
        hooks?: {
          onSessionChanged?: (session: Record<string, string> | null) => void | Promise<void>;
        };
        sdkClients?: readonly { setTokenManager(manager: unknown): unknown }[];
        tokenStore?: {
          clear(): void;
          get(): Record<string, string>;
          set(session: Record<string, string>): void;
        };
      }) => {
        appbaseApp: ReturnType<typeof createStandardAppClient>;
        getRuntime(): {
          service: {
            auth: {
              sessions: {
                create(body: Record<string, unknown>): Promise<Record<string, unknown>>;
                current: {
                  delete(): Promise<void>;
                };
              };
            };
          };
          tokenManager: {
            getTokens(): Record<string, string>;
          };
          tokenStore: {
            set(session: Record<string, string>): void;
          };
        };
        runtime: {
          service: {
            auth: {
              sessions: {
                create(body: Record<string, unknown>): Promise<Record<string, unknown>>;
                current: {
                  delete(): Promise<void>;
                };
              };
            };
          };
          tokenManager: {
            getTokens(): Record<string, string>;
          };
          tokenStore: {
            set(session: Record<string, string>): void;
          };
        };
        tokenManager: unknown;
      })
      | undefined
    >("createSdkworkAppbasePcAuthRuntime");
    const appbaseApp = createStandardAppClient();
    const downstreamAppClient = { setTokenManager: vi.fn() };
    const createAppbaseAppClient = vi.fn(() => appbaseApp);
    const onSessionChanged = vi.fn();

    expect(createSdkworkAppbasePcAuthRuntime).toBeTypeOf("function");

    const composition = createSdkworkAppbasePcAuthRuntime?.({
      app: {
        appId: "sdkwork-chat-pc",
        deploymentMode: "saas",
        environment: "dev",
        platform: "pc",
      },
      baseUrls: {
        appbaseAppApiBaseUrl: "http://127.0.0.1:18079",
      },
      createAppbaseAppClient,
      hooks: {
        onSessionChanged,
      },
      sdkClients: [
        downstreamAppClient,
      ],
    });

    expect(composition?.runtime).toBe(composition?.getRuntime());
    expect(createAppbaseAppClient).toHaveBeenCalledWith(expect.objectContaining({
      baseUrl: "http://127.0.0.1:18079",
      platform: "pc",
      tokenManager: composition?.tokenManager,
    }));
    expect(composition).not.toHaveProperty("appbaseBackend");
    expect(appbaseApp.setTokenManager).toHaveBeenCalledWith(composition?.tokenManager);
    expect(downstreamAppClient.setTokenManager).toHaveBeenCalledWith(composition?.tokenManager);

    await composition?.runtime.service.auth.sessions.create({
      password: "correct-password",
      username: "alice",
    });
    await composition?.runtime.tokenStore.set({
      accessToken: ACCESS_TOKEN,
      authToken: AUTH_TOKEN,
      refreshToken: "refresh-token",
    });

    expect(onSessionChanged).toHaveBeenCalledTimes(1);
    expect(onSessionChanged).toHaveBeenNthCalledWith(1, {
      accessToken: ACCESS_TOKEN,
      authToken: AUTH_TOKEN,
      refreshToken: "refresh-token",
    });
    expect(composition?.runtime.tokenManager.getTokens()).toEqual({
      accessToken: ACCESS_TOKEN,
      authToken: AUTH_TOKEN,
      refreshToken: "refresh-token",
    });

    await composition?.runtime.service.auth.sessions.current.delete();
    expect(onSessionChanged).toHaveBeenCalledTimes(2);
    expect(onSessionChanged).toHaveBeenNthCalledWith(2, null);
  });

  it("creates a product session bridge for app-owned session storage", async () => {
    const createSdkworkAppbasePcAuthSessionBridge = requireExport<
      ((options: {
        clearSession(): void;
        commitSession(session: Record<string, unknown>): Record<string, unknown>;
        readSession(): Record<string, unknown> | null;
      }) => {
        contextStore: {
          clear(): void | Promise<void>;
          getAppContext(): unknown;
          getShardingContext(): unknown;
          setAppContext(context: Record<string, unknown>): void | Promise<void>;
        };
        tokenStore: {
          clear(): void | Promise<void>;
          get(): Record<string, unknown> | Promise<Record<string, unknown>>;
          set(session: Record<string, unknown>): void | Promise<void>;
        };
      })
      | undefined
    >("createSdkworkAppbasePcAuthSessionBridge");
    const appContext = {
      appId: "sdkwork-chat-pc",
      authLevel: "password",
      dataScope: ["tenant:t_demo"],
      deploymentMode: "saas",
      environment: "dev",
      organizationId: "org_demo",
      permissionScope: ["*"],
      sessionId: "session-id",
      tenantId: "t_demo",
      userId: "alice",
    };
    let storedSession: Record<string, unknown> | null = {
      accessToken: OLD_ACCESS_TOKEN,
      authToken: OLD_AUTH_TOKEN,
      context: appContext,
      refreshToken: "old-refresh-token",
      sessionId: "old-session-id",
      user: {
        userId: "alice",
      },
    };
    const clearSession = vi.fn(() => {
      storedSession = null;
    });
    const commitSession = vi.fn((session: Record<string, unknown>) => {
      storedSession = { ...session };
      return storedSession;
    });

    expect(createSdkworkAppbasePcAuthSessionBridge).toBeTypeOf("function");

    const bridge = createSdkworkAppbasePcAuthSessionBridge?.({
      clearSession,
      commitSession,
      readSession: () => storedSession,
    });

    expect(await bridge?.tokenStore.get()).toEqual({
      accessToken: OLD_ACCESS_TOKEN,
      authToken: OLD_AUTH_TOKEN,
      refreshToken: "old-refresh-token",
    });

    await bridge?.tokenStore.set({
      accessToken: NEW_ACCESS_TOKEN,
      authToken: NEW_AUTH_TOKEN,
    });

    expect(commitSession).toHaveBeenLastCalledWith(expect.objectContaining({
      accessToken: NEW_ACCESS_TOKEN,
      authToken: NEW_AUTH_TOKEN,
    }));
    expect(storedSession?.refreshToken).toBeUndefined();

    await bridge?.contextStore.setAppContext(appContext);
    expect(storedSession?.context).toEqual(appContext);
    expect(await bridge?.contextStore.getAppContext()).toEqual(appContext);
    expect(await bridge?.contextStore.getShardingContext()).toEqual({
      shardingKey: "org_demo",
      shardingStrategy: "organization",
    });

    await bridge?.contextStore.clear();
    expect(storedSession?.context).toBeUndefined();

    await bridge?.tokenStore.clear();
    expect(clearSession).toHaveBeenCalledOnce();
  });

  it("does not synthesize missing dual tokens in the product session bridge", async () => {
    const createSdkworkAppbasePcAuthSessionBridge = requireExport<
      ((options: {
        clearSession(): void;
        commitSession(session: Record<string, unknown>): Record<string, unknown>;
        readSession(): Record<string, unknown> | null;
      }) => {
        tokenStore: {
          get(): Record<string, unknown> | Promise<Record<string, unknown>>;
          set(session: Record<string, unknown>): void | Promise<void>;
        };
      })
      | undefined
    >("createSdkworkAppbasePcAuthSessionBridge");
    let storedSession: Record<string, unknown> | null = {
      authToken: OLD_AUTH_TOKEN,
      refreshToken: "old-refresh-token",
      user: {
        userId: "alice",
      },
    };
    const clearSession = vi.fn(() => {
      storedSession = null;
    });
    const commitSession = vi.fn((session: Record<string, unknown>) => {
      storedSession = { ...session };
      return storedSession;
    });

    const bridge = createSdkworkAppbasePcAuthSessionBridge?.({
      clearSession,
      commitSession,
      readSession: () => storedSession,
    });

    expect(await bridge?.tokenStore.get()).toEqual({
      authToken: OLD_AUTH_TOKEN,
      refreshToken: "old-refresh-token",
    });

    await bridge?.tokenStore.set({
      authToken: NEW_AUTH_TOKEN,
    });

    expect(clearSession).toHaveBeenCalledOnce();
    expect(commitSession).not.toHaveBeenCalled();
  });

  it("does not carry stale identity context when replacing tokens in the product session bridge", async () => {
    const createSdkworkAppbasePcAuthSessionBridge = requireExport<
      ((options: {
        clearSession(): void;
        commitSession(session: Record<string, unknown>): Record<string, unknown>;
        readSession(): Record<string, unknown> | null;
      }) => {
        tokenStore: {
          set(session: Record<string, unknown>): void | Promise<void>;
        };
      })
      | undefined
    >("createSdkworkAppbasePcAuthSessionBridge");
    const staleAppContext = {
      appId: "sdkwork-chat-pc",
      authLevel: "password",
      dataScope: ["tenant:t_demo"],
      deploymentMode: "saas",
      environment: "dev",
      permissionScope: ["*"],
      sessionId: "stale-session-id",
      tenantId: "t_demo",
      userId: "user_test006_a_com",
    };
    let storedSession: Record<string, unknown> | null = {
      accessToken: OLD_ACCESS_TOKEN,
      authToken: OLD_AUTH_TOKEN,
      context: staleAppContext,
      sessionId: "stale-session-id",
      user: {
        displayName: "user_test006_a_com",
        userId: "user_test006_a_com",
      },
    };
    const clearSession = vi.fn(() => {
      storedSession = null;
    });
    const commitSession = vi.fn((session: Record<string, unknown>) => {
      storedSession = { ...session };
      return storedSession;
    });

    const bridge = createSdkworkAppbasePcAuthSessionBridge?.({
      clearSession,
      commitSession,
      readSession: () => storedSession,
    });

    await bridge?.tokenStore.set({
      accessToken: NEW_ACCESS_TOKEN,
      authToken: NEW_AUTH_TOKEN,
    });

    expect(clearSession).not.toHaveBeenCalled();
    expect(storedSession).toEqual({
      accessToken: NEW_ACCESS_TOKEN,
      authToken: NEW_AUTH_TOKEN,
    });
  });

  it("commits a replacement session with new identity details when the IAM runtime provides them", async () => {
    const createSdkworkAppbasePcAuthSessionBridge = requireExport<
      ((options: {
        clearSession(): void;
        commitSession(session: Record<string, unknown>): Record<string, unknown>;
        readSession(): Record<string, unknown> | null;
      }) => {
        tokenStore: {
          set(session: Record<string, unknown>): void | Promise<void>;
        };
      })
      | undefined
    >("createSdkworkAppbasePcAuthSessionBridge");
    const newContext = {
      appId: "sdkwork-chat-pc",
      authLevel: "password",
      dataScope: ["tenant:t_demo"],
      deploymentMode: "saas",
      environment: "dev",
      permissionScope: ["*"],
      sessionId: "registered-session-id",
      tenantId: "t_demo",
      userId: "registered-user-1",
    };
    let storedSession: Record<string, unknown> | null = {
      accessToken: OLD_ACCESS_TOKEN,
      authToken: OLD_AUTH_TOKEN,
      context: {
        ...newContext,
        sessionId: "old-session-id",
        userId: "old-user-1",
      },
      refreshToken: "old-refresh-token",
      sessionId: "old-session-id",
      user: {
        displayName: "Old Operator",
        userId: "old-user-1",
      },
    };
    const clearSession = vi.fn(() => {
      storedSession = null;
    });
    const commitSession = vi.fn((session: Record<string, unknown>) => {
      storedSession = { ...session };
      return storedSession;
    });

    const bridge = createSdkworkAppbasePcAuthSessionBridge?.({
      clearSession,
      commitSession,
      readSession: () => storedSession,
    });

    await bridge?.tokenStore.set({
      accessToken: REGISTERED_ACCESS_TOKEN,
      authToken: REGISTERED_AUTH_TOKEN,
      context: newContext,
      sessionId: "registered-session-id",
      user: {
        displayName: "Registered Operator",
        userId: "registered-user-1",
      },
    });

    expect(clearSession).not.toHaveBeenCalled();
    expect(storedSession).toEqual({
      accessToken: REGISTERED_ACCESS_TOKEN,
      authToken: REGISTERED_AUTH_TOKEN,
      context: newContext,
      sessionId: "registered-session-id",
      user: {
        displayName: "Registered Operator",
        userId: "registered-user-1",
      },
    });
  });

  it("does not emit incomplete dual-token sessions through runtime hooks", async () => {
    const createSdkworkAppbasePcAuthRuntime = requireExport<
      ((options: {
        app: {
          appId: string;
          deploymentMode: "local" | "private" | "saas";
          environment: "dev" | "prod" | "test";
        };
        baseUrls: {
          appbaseAppApiBaseUrl: string;
        };
        createAppbaseAppClient: (config: Record<string, unknown>) => any;
        hooks?: {
          onSessionChanged?: (session: Record<string, string> | null) => void | Promise<void>;
        };
      }) => {
        runtime: {
          service: {
            auth: {
              sessions: {
                create(body: Record<string, unknown>): Promise<Record<string, unknown>>;
              };
            };
          };
        };
      })
      | undefined
    >("createSdkworkAppbasePcAuthRuntime");
    const appbaseApp = createStandardAppClient();
    appbaseApp.auth.sessions.create = vi.fn().mockResolvedValue({
      data: {
        authToken: PARTIAL_AUTH_TOKEN,
      },
    });
    const onSessionChanged = vi.fn();

    const composition = createSdkworkAppbasePcAuthRuntime?.({
      app: {
        appId: "sdkwork-chat-pc",
        deploymentMode: "saas",
        environment: "dev",
      },
      baseUrls: {
        appbaseAppApiBaseUrl: "http://127.0.0.1:18079",
      },
      createAppbaseAppClient: () => appbaseApp,
      hooks: {
        onSessionChanged,
      },
    });

    await expect(composition?.runtime.service.auth.sessions.create({
      password: "correct-password",
      username: "alice",
    })).rejects.toThrow(/accessToken/i);

    expect(onSessionChanged).not.toHaveBeenCalled();
  });

  it("does not derive builtin-local development prefill without explicit credentials", () => {
    const createCanonicalAuthRuntimeComposition = requireExport<
      ((options: {
        authConfig?: Record<string, unknown> | null;
        developmentPrefill?: Record<string, unknown>;
        namespace: string;
        surface?: "desktop" | "server" | "web";
      }) => {
        authRuntimeConfig: {
          developmentPrefill?: {
            account?: string;
            email?: string;
            enabled?: boolean;
            loginMethod?: string;
            password?: string;
          };
          loginMethods?: string[];
        };
        developmentPrefill?: {
          account?: string;
          email?: string;
          enabled?: boolean;
          loginMethod?: string;
          password?: string;
        };
        identityDeploymentProfile: {
          identityMode: string;
          providerKind: string;
          surface: string;
          transportKind: string;
        };
        userCenterDeploymentProfile: {
          kind: string;
          providerKind: string;
        };
      })
      | undefined
    >("createCanonicalAuthRuntimeComposition");

    expect(createCanonicalAuthRuntimeComposition).toBeTypeOf("function");

    const runtime = createCanonicalAuthRuntimeComposition?.({
      authConfig: {
        loginMethods: ["password", "emailCode"],
        supportsLocalCredentials: true,
      },
      namespace: "sdkwork-example",
      surface: "desktop",
    });

    expect(runtime?.identityDeploymentProfile).toEqual({
      identityMode: "desktop-local",
      providerKind: "builtin-local",
      surface: "desktop",
      transportKind: "local-api",
    });
    expect(runtime?.userCenterDeploymentProfile).toMatchObject({
      kind: "builtin-local",
      providerKind: "builtin-local",
    });
    expect(runtime?.developmentPrefill).toBeUndefined();
    expect(runtime?.authRuntimeConfig.developmentPrefill).toBeUndefined();
    expect(runtime?.authRuntimeConfig.loginMethods).toEqual(["password", "emailCode"]);
  });

  it("uses explicit development prefill values without synthesizing local defaults", () => {
    const createCanonicalAuthRuntimeComposition = requireExport<
      ((options: {
        authConfig?: Record<string, unknown> | null;
        developmentPrefill?: Record<string, unknown>;
        namespace: string;
        surface?: "desktop" | "server" | "web";
      }) => {
        authRuntimeConfig: {
          developmentPrefill?: {
            account?: string;
            email?: string;
            enabled?: boolean;
            loginMethod?: string;
            password?: string;
          };
        };
        developmentPrefill?: {
          account?: string;
          email?: string;
          enabled?: boolean;
          loginMethod?: string;
          password?: string;
        };
      })
      | undefined
    >("createCanonicalAuthRuntimeComposition");

    const runtime = createCanonicalAuthRuntimeComposition?.({
      authConfig: {
        supportsLocalCredentials: true,
      },
      developmentPrefill: {
        email: "operator@sdkwork-example.test",
        enabled: true,
        loginMethod: "password",
        password: "configured-test-password",
      },
      namespace: "sdkwork-example",
      surface: "desktop",
    });

    expect(runtime?.developmentPrefill).toEqual({
      email: "operator@sdkwork-example.test",
      enabled: true,
      loginMethod: "password",
      password: "configured-test-password",
    });
    expect(runtime?.authRuntimeConfig.developmentPrefill).toEqual(
      runtime?.developmentPrefill,
    );
  });

  it("does not leak builtin-local defaults into cloud mode unless explicitly configured", () => {
    const createCanonicalAuthRuntimeComposition = requireExport<
      ((options: {
        authConfig?: Record<string, unknown> | null;
        developmentPrefill?: Record<string, unknown>;
        mode?: string;
        namespace: string;
        provider?: {
          baseUrl?: string;
          kind: string;
          providerKey?: string;
        };
        surface?: "desktop" | "server" | "web";
      }) => {
        authRuntimeConfig: {
          developmentPrefill?: {
            account?: string;
            enabled?: boolean;
            loginMethod?: string;
            password?: string;
          };
          loginMethods?: string[];
        };
        developmentPrefill?: {
          account?: string;
          enabled?: boolean;
          loginMethod?: string;
          password?: string;
        };
        identityDeploymentProfile: {
          identityMode: string;
          providerKind: string;
          surface: string;
          transportKind: string;
        };
        userCenterDeploymentProfile: {
          kind: string;
          providerKind: string;
        };
      })
      | undefined
    >("createCanonicalAuthRuntimeComposition");

    expect(createCanonicalAuthRuntimeComposition).toBeTypeOf("function");

    const cloudRuntime = createCanonicalAuthRuntimeComposition?.({
      authConfig: {
        supportsLocalCredentials: false,
        supportsSessionExchange: true,
      },
      mode: "app-api-hub",
      namespace: "sdkwork-example",
      provider: {
        baseUrl: "https://app-api.sdkwork.local/app",
        kind: "sdkwork-cloud-app-api",
        providerKey: "example-cloud",
      },
      surface: "web",
    });

    expect(cloudRuntime?.identityDeploymentProfile).toEqual({
      identityMode: "cloud-saas",
      providerKind: "sdkwork-cloud-app-api",
      surface: "web",
      transportKind: "remote-http",
    });
    expect(cloudRuntime?.userCenterDeploymentProfile).toMatchObject({
      kind: "sdkwork-cloud-app-api",
      providerKind: "sdkwork-cloud-app-api",
    });
    expect(cloudRuntime?.developmentPrefill).toBeUndefined();
    expect(cloudRuntime?.authRuntimeConfig.developmentPrefill).toBeUndefined();
    expect(cloudRuntime?.authRuntimeConfig.loginMethods).toEqual(["sessionBridge"]);

    const explicitCloudRuntime = createCanonicalAuthRuntimeComposition?.({
      developmentPrefill: {
        account: "qa-cloud@sdkwork-example.local",
        enabled: true,
        loginMethod: "emailCode",
      },
      mode: "app-api-hub",
      namespace: "sdkwork-example",
      provider: {
        baseUrl: "https://app-api.sdkwork.local/app",
        kind: "sdkwork-cloud-app-api",
        providerKey: "example-cloud",
      },
      surface: "web",
    });

    expect(explicitCloudRuntime?.developmentPrefill).toEqual({
      account: "qa-cloud@sdkwork-example.local",
      enabled: true,
      loginMethod: "emailCode",
    });
    expect(explicitCloudRuntime?.authRuntimeConfig.developmentPrefill).toEqual({
      account: "qa-cloud@sdkwork-example.local",
      enabled: true,
      loginMethod: "emailCode",
    });
  });
});

function createStandardAppClient() {
  const client = createMethodTree(SDKWORK_IAM_APP_SDK_REQUIRED_METHODS, {
    "auth.sessions.create": vi.fn().mockResolvedValue({
      data: standardSession(),
    }),
    "auth.sessions.current.delete": vi.fn().mockResolvedValue({ data: {} }),
    "auth.sessions.current.retrieve": vi.fn().mockResolvedValue({
      data: standardSession(),
    }),
    "auth.sessions.current.update": vi.fn().mockResolvedValue({
      data: standardSession(),
    }),
    "auth.sessions.refresh": vi.fn().mockResolvedValue({
      data: standardSession(),
    }),
    "auth.registrations.create": vi.fn().mockResolvedValue({
      data: standardSession(),
    }),
    "iam.users.current.retrieve": vi.fn().mockResolvedValue({
      data: {
        displayName: "Alice",
        email: "alice@example.com",
        userId: "alice",
      },
    }),
  }) as ReturnType<typeof createMethodTree> & {
    setTokenManager: ReturnType<typeof vi.fn>;
  };
  client.setTokenManager = vi.fn();
  return client;
}

function createMethodTree(
  methods: readonly string[],
  overrides: Record<string, ReturnType<typeof vi.fn>> = {},
): Record<string, any> {
  const root: Record<string, any> = {};
  for (const method of methods) {
    setPath(root, method, overrides[method] ?? vi.fn().mockResolvedValue({ data: {} }));
  }
  return root;
}

function setPath(root: Record<string, any>, path: string, value: ReturnType<typeof vi.fn>): void {
  const segments = path.split(".");
  let target = root;
  for (const segment of segments.slice(0, -1)) {
    target[segment] ??= {};
    target = target[segment];
  }
  target[segments.at(-1) ?? ""] = value;
}

function standardSession() {
  return {
    accessToken: ACCESS_TOKEN,
    authToken: AUTH_TOKEN,
    context: {
      appId: "sdkwork-chat-pc",
      authLevel: "password",
      dataScope: ["tenant:t_demo"],
      deploymentMode: "saas",
      environment: "dev",
      permissionScope: ["*"],
      sessionId: "session-id",
      tenantId: "t_demo",
      userId: "alice",
    },
    refreshToken: "refresh-token",
    sessionId: "session-id",
    user: {
      displayName: "Alice",
      email: "alice@example.com",
      userId: "alice",
    },
  };
}
