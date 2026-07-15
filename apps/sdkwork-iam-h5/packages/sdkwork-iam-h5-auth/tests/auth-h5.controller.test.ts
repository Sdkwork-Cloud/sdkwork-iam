import { describe, expect, it, vi } from "vitest";

import { createSdkworkIamH5AuthController } from "../src/index";

describe("@sdkwork/iam-h5-auth", () => {
  it("creates sessions and clears them on logout through the IAM service", async () => {
    const service = {
      auth: {
        sessions: {
          create: vi.fn().mockResolvedValue({
            accessToken: "token",
            authToken: "auth-token",
            sessionId: "sess-1",
            userId: "1",
          }),
          current: {
            delete: vi.fn().mockResolvedValue(undefined),
          },
        },
      },
    };

    const controller = createSdkworkIamH5AuthController({ service: service as never });
    const result = await controller.login({ username: "alice", password: "secret" });
    expect(result).toMatchObject({
      kind: "session",
      session: {
        sessionId: "sess-1",
        userId: "1",
      },
    });
    await controller.logout();

    expect(service.auth.sessions.create).toHaveBeenCalledWith({ username: "alice", password: "secret" });
    expect(service.auth.sessions.current.delete).toHaveBeenCalled();
    expect(controller.getState().session).toBeUndefined();
  });

  it("returns login context selection challenge without committing a session", async () => {
    const service = {
      auth: {
        sessions: {
          create: vi.fn().mockResolvedValue({
            challengeType: "LOGIN_CONTEXT_SELECTION",
            continuationToken: "continue-1",
            options: [{ loginScope: "TENANT", organizationId: "0", displayName: "Personal account" }],
            organizations: [{ organizationId: "org-1", displayName: "Org One" }],
          }),
          loginContextSelection: {
            create: vi.fn().mockResolvedValue({
              accessToken: "token",
              authToken: "auth-token",
              sessionId: "sess-2",
              userId: "1",
            }),
          },
        },
      },
    };

    const controller = createSdkworkIamH5AuthController({ service: service as never });
    const result = await controller.login({ username: "alice", password: "secret" });

    expect(result.kind).toBe("loginContextSelectionRequired");
    expect(controller.getState().status).toBe("loginContextSelectionRequired");
    expect(controller.getState().session).toBeUndefined();

    await expect(controller.selectPersonalLogin({ continuationToken: "continue-1" })).resolves.toMatchObject({
      sessionId: "sess-2",
    });
    expect(service.auth.sessions.loginContextSelection.create).toHaveBeenCalledWith({
      continuationToken: "continue-1",
      loginScope: "TENANT",
      organizationId: "0",
    });
  });

  it("creates typed WeChat mini program and OAuth sessions", async () => {
    const service = {
      oauth: {
        authorizationUrls: {
          create: vi.fn().mockResolvedValue({ authUrl: "https://open.weixin.qq.com/auth" }),
        },
        miniProgramSessions: {
          create: vi.fn().mockResolvedValue({ authToken: "mini-auth", accessToken: "mini-access" }),
        },
        sessions: {
          create: vi.fn().mockResolvedValue({ authToken: "oauth-auth", accessToken: "oauth-access" }),
        },
      },
    };
    const controller = createSdkworkIamH5AuthController({ service: service as never });

    await expect(controller.loginWithMiniProgram({
      jsCode: "wx-code",
      surfaceCode: "consumer-mini",
    })).resolves.toMatchObject({ authToken: "mini-auth" });
    await expect(controller.loginWithOAuth({
      code: "oauth-code",
      provider: "wechat",
      redirectUri: "https://example.com/auth/callback",
      state: "oauth-state",
    })).resolves.toMatchObject({ authToken: "oauth-auth" });
    await expect(controller.createOAuthAuthorizationUrl({
      provider: "wechat",
      redirectUri: "https://example.com/auth/callback",
    })).resolves.toBe("https://open.weixin.qq.com/auth");

    expect(service.oauth.miniProgramSessions.create).toHaveBeenCalledWith({
      jsCode: "wx-code",
      surfaceCode: "consumer-mini",
    });
  });
});
