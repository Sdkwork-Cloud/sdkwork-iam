import { describe, expect, it, vi } from "vitest";
import { createSdkworkUserController } from "../src";

describe("sdkwork-user-pc-react controller", () => {
  it("loads profile and preferences and tracks the active section", async () => {
    const service = {
      getPreferences: vi.fn().mockResolvedValue({
        general: {
          compactModelSelector: true,
          launchOnStartup: false,
          startMinimized: false,
        },
        notifications: {
          newMessages: true,
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
      }),
      getProfile: vi.fn().mockResolvedValue({
        avatar: {
          kind: "image",
          publicUrl: "https://cdn.sdkwork.ai/avatar.png",
          source: "external_url",
          url: "https://cdn.sdkwork.ai/avatar.png",
        },
        email: "sdkwork@sdkwork.ai",
        firstName: "Sdkwork",
        lastName: "Operator",
      }),
      refreshAccountBindingPolicy: vi.fn().mockResolvedValue({
        profile: {
          avatarEditable: false,
          contactBindingEnabled: false,
          emailEditable: false,
          emailUnbindEnabled: false,
          oauthBindingEnabled: false,
          phoneEditable: false,
          phoneUnbindEnabled: false,
          profileEditable: false,
        },
        security: {
          passwordChangeEnabled: true,
        },
      }),
      updatePassword: vi.fn(),
      updatePreferences: vi.fn(),
      updateProfile: vi.fn(),
    };

    const controller = createSdkworkUserController({ service });

    await controller.load();
    controller.selectSection("security");

    expect(controller.getState()).toMatchObject({
      activeSectionId: "security",
      profile: {
        email: "sdkwork@sdkwork.ai",
        firstName: "Sdkwork",
      },
      preferences: {
        notifications: {
          newMessages: true,
        },
      },
    });
  });
});
