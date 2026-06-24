import { describe, expect, it } from "vitest";
import { createSdkworkUserService } from "../src";

const avatar = {
  kind: "image",
  publicUrl: "https://cdn.sdkwork.ai/avatar.png",
  source: "external_url",
  url: "https://cdn.sdkwork.ai/avatar.png",
} as const;

describe("sdkwork-user-pc-react service", () => {
  it("maps remote profile and notification settings into reusable user-center preferences", async () => {
    const storage = new Map<string, string>();
    const client = {
      notification: {
        getNotificationSettings: async () => ({
          code: "2000",
          data: {
            enableEmail: true,
            enableInApp: true,
            typeSettings: {
              ALERT: {
                enableEmail: true,
              },
              MESSAGE: {
                enableInApp: false,
              },
              TASK: {
                enableEmail: false,
                enableInApp: true,
              },
            },
          },
        }),
      },
      iam: {
        users: {
          current: {
            retrieve: async () => ({
              code: "2000",
              data: {
                avatar,
                displayName: "Sdkwork Operator",
                email: "sdkwork@sdkwork.ai",
              },
            }),
          },
        },
      },
    };

    const service = createSdkworkUserService({
      getClient: () => client,
      storage: {
        getItem: (key) => storage.get(key) ?? null,
        removeItem: (key) => {
          storage.delete(key);
        },
        setItem: (key, value) => {
          storage.set(key, value);
        },
      },
    });

    await expect(service.getProfile()).resolves.toEqual({
      avatar,
      email: "sdkwork@sdkwork.ai",
      emailVerified: false,
      firstName: "Sdkwork",
      lastName: "Operator",
      phone: "",
      phoneVerified: false,
    });

    await expect(service.getPreferences()).resolves.toEqual({
      general: {
        compactModelSelector: true,
        launchOnStartup: false,
        startMinimized: false,
      },
      notifications: {
        newMessages: false,
        securityAlerts: true,
        systemUpdates: true,
        taskCompletions: true,
        taskFailures: false,
      },
      privacy: {
        personalizedRecommendations: false,
        shareUsageData: false,
      },
      security: {
        loginAlerts: true,
        twoFactorAuth: false,
      },
    });
  });
});
