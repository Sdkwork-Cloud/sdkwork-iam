import {
  describe,
  expect,
  it,
  vi,
} from "vitest";
import {
  createCanonicalUserCenterRuntimeBridge,
} from "../src/domain/userCenterRuntimeBridge.ts";
import {
  createDefaultUserCenterConfig,
} from "../src/domain/userCenterConfig.ts";
import {
  createUserCenterRuntimeClient,
} from "../src/domain/userCenterRuntimeClient.ts";
import type {
  UserCenterRuntimeHeaders,
  UserCenterTokenBundle,
  UserCenterTokenStore,
} from "../src/index.ts";

describe("canonical user-center runtime bridge", () => {
  it("creates a runtime client for builtin-local providers", () => {
    const bridge = createCanonicalUserCenterRuntimeBridge({
      namespace: "sdkwork-test",
      provider: {
        kind: "builtin-local",
      },
      storage: {
        dialect: "sqlite",
        sqlitePath: "app://sdkwork-test/user-center.db",
      },
    });

    expect(bridge.apiBaseUrl).toBeNull();
    expect(bridge.runtimeConfig.provider.kind).toBe("builtin-local");
    expect(bridge.runtimeClient).not.toBeNull();
    expect(typeof bridge.runtimeClient?.getProfile).toBe("function");
    expect(typeof bridge.runtimeClient?.updateProfile).toBe("function");
    expect(Object.hasOwn(bridge.runtimeClient ?? {}, "update" + "Membership")).toBe(false);
  });

  it("does not use accessToken as an Authorization fallback for protected requests", async () => {
    const capturedHeaders: UserCenterRuntimeHeaders[] = [];
    const runtimeConfig = createDefaultUserCenterConfig({
      namespace: "sdkwork-test",
      mode: "app-api-hub",
      provider: {
        kind: "sdkwork-cloud-app-api",
      },
      storage: {
        dialect: "sqlite",
        sqlitePath: "app://sdkwork-test/user-center.db",
      },
    });
    expect(runtimeConfig.auth).not.toHaveProperty("allowAuthorizationFallbackToAccessToken");
    const tokenStore = createStaticTokenStore({
      accessToken: "access-token-only",
    });
    const client = createUserCenterRuntimeClient(runtimeConfig, {
      async fetch(_input, init) {
        capturedHeaders.push(init?.headers ?? {});

        return {
          headers: {
            get() {
              return null;
            },
          },
          async json() {
            return { code: 0, data: { id: "profile-1" } };
          },
          ok: true,
          status: 200,
        };
      },
      tokenStore,
    });

    await client.getProfile();

    expect(capturedHeaders).toHaveLength(1);
    expect(capturedHeaders[0]).toMatchObject({
      "Access-Token": "access-token-only",
    });
    expect(capturedHeaders[0]).not.toHaveProperty("Authorization");
  });

  it("uses the app SDK runtime client for sdkwork-cloud-app-api providers when appSdkClient is supplied", async () => {
    const appSdkClient = {
      auth: {
        sessions: {
          create: vi.fn(),
          refresh: vi.fn(),
          current: {
            delete: vi.fn(),
            retrieve: vi.fn().mockResolvedValue({ code: 0, data: { tenantId: "100001" } }),
            update: vi.fn(),
          },
        },
      },
      iam: {
        users: {
          current: {
            retrieve: vi.fn().mockResolvedValue({ code: 0, data: { id: "profile-1" } }),
            update: vi.fn(),
          },
        },
      },
    };
    const bridge = createCanonicalUserCenterRuntimeBridge({
      namespace: "sdkwork-test",
      provider: {
        kind: "sdkwork-cloud-app-api",
      },
      runtimeClientOptions: {
        appSdkClient,
      },
      storage: {
        dialect: "sqlite",
        sqlitePath: "app://sdkwork-test/user-center.db",
      },
    });

    await expect(bridge.runtimeClient?.getProfile()).resolves.toEqual({ id: "profile-1" });
    expect(appSdkClient.iam.users.current.retrieve).toHaveBeenCalledTimes(1);
  });
});

function createStaticTokenStore(bundle: UserCenterTokenBundle): UserCenterTokenStore {
  return {
    clearTokenBundle() {},
    persistTokenBundle() {
      return true;
    },
    readTokenBundle() {
      return bundle;
    },
  };
}
