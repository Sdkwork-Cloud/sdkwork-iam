import { describe, expect, it, vi } from "vitest";

import { createSdkworkIamConsoleAccountBindingController } from "../src/index";

describe("@sdkwork/iam-pc-console-account-binding", () => {
  it("loads policy and account links through the app IAM service", async () => {
    const service = {
      system: {
        iam: {
          accountBindingPolicy: {
            retrieve: vi.fn().mockResolvedValue({
              contactBinding: { enabled: true, emailEnabled: true },
              oauthBinding: { selfServiceLinkEnabled: true },
            }),
          },
        },
      },
      oauth: {
        accountLinks: {
          list: vi.fn().mockResolvedValue({ items: [{ id: "link-1", provider: "github" }] }),
        },
      },
      iam: {
        users: {
          current: {
            emailBindings: {
              create: vi.fn(),
              delete: vi.fn(),
            },
          },
        },
      },
    };

    const controller = createSdkworkIamConsoleAccountBindingController({ service: service as never });

    await expect(controller.refreshWorkspace()).resolves.toMatchObject({
      policy: { contactBinding: { enabled: true } },
      accountLinks: [{ id: "link-1", provider: "github" }],
    });
  });
});
