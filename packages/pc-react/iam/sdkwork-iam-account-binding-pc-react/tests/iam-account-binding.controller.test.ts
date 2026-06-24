import { describe, expect, it } from "vitest";

import {
  createSdkworkIamAccountBindingController,
  type SdkworkIamAccountBindingPolicy,
} from "../src/index.tsx";

const samplePolicy: SdkworkIamAccountBindingPolicy = {
  contactBinding: {
    enabled: true,
    emailEnabled: true,
    phoneEnabled: false,
    emailChangeEnabled: true,
    phoneChangeEnabled: true,
    emailUnbindEnabled: false,
    phoneUnbindEnabled: false,
    requireVerification: true,
  },
  oauthLogin: {
    allowedProviders: ["wechat", "google"],
    autoRegistrationEnabled: true,
    enabled: true,
  },
  oauthBinding: {
    allowedProviders: ["github"],
    enabled: true,
    selfServiceLinkEnabled: true,
    selfServiceUnlinkEnabled: false,
  },
};

describe("sdkwork-iam-account-binding-pc-react", () => {
  it("loads and saves account binding policy through iam service", async () => {
    const service = {
      iam: {
        accountBindingPolicy: {
          retrieve: async () => samplePolicy,
          update: async (body: Record<string, unknown>) => body,
        },
      },
    };

    const controller = createSdkworkIamAccountBindingController(service as never);
    const loaded = await controller.load();

    expect(loaded.contactBinding.phoneEnabled).toBe(false);
    expect(loaded.oauthBinding.allowedProviders).toEqual(["github"]);

    const saved = await controller.save({
      ...loaded,
      contactBinding: {
        ...loaded.contactBinding,
        phoneEnabled: true,
      },
    });

    expect(saved.contactBinding.phoneEnabled).toBe(true);
    expect(controller.getState().status).toBe("ready");
  });
});
