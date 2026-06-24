import { describe, expect, it, vi } from "vitest";

import { createSdkworkIamH5UserController } from "../src/index";

describe("@sdkwork/iam-h5-user", () => {
  it("loads and updates the current user profile through the IAM service", async () => {
    const service = {
      iam: {
        users: {
          current: {
            retrieve: vi.fn().mockResolvedValue({
              userId: "user-1",
              displayName: "Alice",
              email: "alice@example.com",
            }),
            update: vi.fn().mockResolvedValue({
              userId: "user-1",
              displayName: "Alice Updated",
              nickname: "ali",
            }),
          },
        },
      },
    };

    const controller = createSdkworkIamH5UserController({ service: service as never });

    await expect(controller.loadProfile()).resolves.toMatchObject({
      userId: "user-1",
      displayName: "Alice",
      email: "alice@example.com",
    });
    await expect(controller.updateProfile({ displayName: "Alice Updated", nickname: "ali" })).resolves.toMatchObject({
      displayName: "Alice Updated",
      nickname: "ali",
    });

    expect(service.iam.users.current.retrieve).toHaveBeenCalled();
    expect(service.iam.users.current.update).toHaveBeenCalledWith({
      displayName: "Alice Updated",
      nickname: "ali",
    });
  });
});
