import { describe, expect, it, vi } from "vitest";
import {
  createUserCenterAppSdkRuntimeClient,
  hasUserCenterAppSdkClient,
} from "../src/domain/userCenterAppSdkRuntimeClient.ts";
import { createDefaultUserCenterConfig } from "../src/domain/userCenterConfig.ts";

describe("user-center app SDK runtime client", () => {
  it("routes profile and session operations through generated app SDK resources", async () => {
    const appSdkClient = {
      auth: {
        sessions: {
          create: vi.fn().mockResolvedValue({
            code: 0,
            data: {
              accessToken: "access-token",
              authToken: "auth-token",
            },
          }),
          refresh: vi.fn().mockResolvedValue({ code: 0, data: { accessToken: "next-access" } }),
          current: {
            delete: vi.fn().mockResolvedValue({ code: 0, data: true }),
            retrieve: vi.fn().mockResolvedValue({ code: 0, data: { tenantId: "100001" } }),
            update: vi.fn(),
          },
        },
      },
      iam: {
        users: {
          current: {
            retrieve: vi.fn().mockResolvedValue({
              code: 0,
              data: {
                displayName: "Sdkwork Operator",
                id: "1",
              },
            }),
            update: vi.fn().mockResolvedValue({
              code: 0,
              data: {
                displayName: "Updated Operator",
                id: "1",
              },
            }),
          },
        },
      },
    };

    expect(hasUserCenterAppSdkClient(appSdkClient)).toBe(true);

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
    const client = createUserCenterAppSdkRuntimeClient(runtimeConfig, {
      appSdkClient,
    });

    await expect(client.getProfile()).resolves.toEqual({
      displayName: "Sdkwork Operator",
      id: "1",
    });
    await expect(client.loginSession({ password: "secret", username: "alice" })).resolves.toEqual({
      accessToken: "access-token",
      authToken: "auth-token",
    });
    expect(appSdkClient.auth.sessions.create).toHaveBeenCalledWith({
      password: "secret",
      username: "alice",
    });
  });
});
