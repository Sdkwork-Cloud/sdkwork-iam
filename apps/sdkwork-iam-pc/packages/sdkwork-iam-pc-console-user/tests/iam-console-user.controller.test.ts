import { describe, expect, it, vi } from "vitest";

import { createSdkworkIamConsoleUserController } from "../src/index";

describe("@sdkwork/iam-pc-console-user", () => {
  it("loads profile and verification policy through the app IAM service", async () => {
    const service = {
      iam: {
        users: {
          current: {
            retrieve: vi.fn().mockResolvedValue({
              userId: "1",
              displayName: "Alice",
              email: "alice@example.com",
            }),
            update: vi.fn().mockResolvedValue({
              userId: "1",
              displayName: "Alice Updated",
            }),
            password: {
              update: vi.fn().mockResolvedValue(undefined),
            },
          },
        },
      },
      system: {
        iam: {
          verificationPolicy: {
            retrieve: vi.fn().mockResolvedValue({
              emailVerificationRequired: true,
            }),
          },
        },
      },
    };

    const controller = createSdkworkIamConsoleUserController({ service: service as never });

    await expect(controller.refreshWorkspace()).resolves.toMatchObject({
      profile: { userId: "1", displayName: "Alice" },
      verificationPolicy: { emailVerificationRequired: true },
    });
    await expect(controller.updateProfile({ displayName: "Alice Updated" })).resolves.toMatchObject({
      displayName: "Alice Updated",
    });
    await controller.updatePassword({
      confirmPassword: "NextPass#2026",
      newPassword: "NextPass#2026",
      oldPassword: "CurrentPass#2026",
    });

    expect(service.iam.users.current.retrieve).toHaveBeenCalled();
    expect(service.system.iam.verificationPolicy.retrieve).toHaveBeenCalled();
    expect(service.iam.users.current.password.update).toHaveBeenCalledWith({
      confirmPassword: "NextPass#2026",
      newPassword: "NextPass#2026",
      oldPassword: "CurrentPass#2026",
    });
  });
});
