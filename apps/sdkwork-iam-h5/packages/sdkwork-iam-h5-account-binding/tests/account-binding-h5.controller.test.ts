import { describe, expect, it, vi } from "vitest";

import { createSdkworkIamH5AccountBindingController } from "../src/index";

describe("@sdkwork/iam-h5-account-binding", () => {
  it("loads policy and account links through the IAM app service", async () => {
    const service = {
      system: {
        iam: {
          accountBindingPolicy: {
            retrieve: vi.fn().mockResolvedValue({
              contactBinding: { enabled: true, emailEnabled: true, phoneEnabled: false },
              oauthBinding: { enabled: true, selfServiceLinkEnabled: true, selfServiceUnlinkEnabled: false },
            }),
          },
        },
      },
      oauth: {
        accountLinks: {
          list: vi.fn().mockResolvedValue({
            items: [{ id: "link-1", accountLinkId: "link-1", provider: "github" }],
          }),
        },
      },
      iam: {
        users: {
          current: {
            emailBindings: {
              create: vi.fn().mockResolvedValue({ userId: "1" }),
              delete: vi.fn().mockResolvedValue({ userId: "1" }),
            },
          },
        },
      },
    };

    const controller = createSdkworkIamH5AccountBindingController({ service: service as never });

    await expect(controller.loadPolicy()).resolves.toMatchObject({
      contactBinding: { enabled: true, emailEnabled: true },
      oauthBinding: { selfServiceLinkEnabled: true },
    });
    await expect(controller.listAccountLinks()).resolves.toEqual([
      { accountLinkId: "link-1", id: "link-1", provider: "github", providerUserId: undefined },
    ]);
    await controller.bindEmail({ email: "alice@example.com", verificationCode: "123456" });
    await controller.unbindEmail({ password: "secret" });

    expect(service.system.iam.accountBindingPolicy.retrieve).toHaveBeenCalled();
    expect(service.oauth.accountLinks.list).toHaveBeenCalled();
    expect(service.iam.users.current.emailBindings.create).toHaveBeenCalledWith({
      email: "alice@example.com",
      verificationCode: "123456",
    });
  });
});
