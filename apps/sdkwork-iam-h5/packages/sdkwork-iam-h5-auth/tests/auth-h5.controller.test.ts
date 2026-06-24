import { describe, expect, it, vi } from "vitest";

import { createSdkworkIamH5AuthController } from "../src/index";

describe("@sdkwork/iam-h5-auth", () => {
  it("creates sessions and clears them on logout through the IAM service", async () => {
    const service = {
      auth: {
        sessions: {
          create: vi.fn().mockResolvedValue({ sessionId: "sess-1", userId: "user-1", accessToken: "token" }),
          current: {
            delete: vi.fn().mockResolvedValue(undefined),
          },
        },
      },
    };

    const controller = createSdkworkIamH5AuthController({ service: service as never });
    await expect(controller.login({ username: "alice", password: "secret" })).resolves.toMatchObject({
      sessionId: "sess-1",
      userId: "user-1",
    });
    await controller.logout();

    expect(service.auth.sessions.create).toHaveBeenCalledWith({ username: "alice", password: "secret" });
    expect(service.auth.sessions.current.delete).toHaveBeenCalled();
    expect(controller.getState().session).toBeUndefined();
  });
});
