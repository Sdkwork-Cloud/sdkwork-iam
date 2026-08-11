import { describe, expect, it, vi } from "vitest";

import {
  assertSdkworkIamH5AuthI18nCatalogParity,
  blockWechatAutoAuthorization,
  clearOAuthFlowContext,
  clearWechatAutoAuthorizationBlock,
  createSdkworkIamH5AuthController,
  createSdkworkIamH5AuthMessages,
  isWechatAutoAuthorizationBlocked,
  readOAuthFlowContext,
  resolveSdkworkIamH5VerifyType,
  storeOAuthFlowContext,
} from "../src/index";

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

    expect(service.auth.sessions.create).toHaveBeenCalledWith({
      grantType: "password",
      password: "secret",
      username: "alice",
    });
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

  it("parses provider scan-login OAuth states with and without poll secret", async () => {
    const {
      readScanLoginPollSecretFromOAuthState,
      readScanLoginProviderFromOAuthState,
      readScanLoginSessionKeyFromOAuthState,
    } = await import("../src/index");

    // New provider-mode format: p:<provider>:<sessionKey>:<pollSecret>
    const providerState = "p:wechat_open:qr-session-1:qr-poll-secret-1";
    expect(readScanLoginProviderFromOAuthState(providerState)).toBe("wechat_open");
    expect(readScanLoginSessionKeyFromOAuthState(providerState)).toBe("qr-session-1");
    expect(readScanLoginPollSecretFromOAuthState(providerState)).toBe("qr-poll-secret-1");

    // Legacy provider-mode format (no poll secret) stays parseable.
    const legacyProviderState = "p:dingtalk:qr-session-2";
    expect(readScanLoginProviderFromOAuthState(legacyProviderState)).toBe("dingtalk");
    expect(readScanLoginSessionKeyFromOAuthState(legacyProviderState)).toBe("qr-session-2");
    expect(readScanLoginPollSecretFromOAuthState(legacyProviderState)).toBeUndefined();

    // Legacy WeChat URL-mode format: scan:<sessionKey>
    const wechatState = "scan:qr-session-3";
    expect(readScanLoginProviderFromOAuthState(wechatState)).toBe("wechat");
    expect(readScanLoginSessionKeyFromOAuthState(wechatState)).toBe("qr-session-3");
    expect(readScanLoginPollSecretFromOAuthState(wechatState)).toBeUndefined();

    // Server-generated opaque states carry no scan-login context.
    expect(readScanLoginSessionKeyFromOAuthState("oauthstate_abc")).toBeUndefined();
    expect(readScanLoginProviderFromOAuthState(undefined)).toBeUndefined();
    expect(readScanLoginPollSecretFromOAuthState(undefined)).toBeUndefined();
  });

  it("logs in with a phone or email verification code through sessions.create", async () => {
    const service = {
      auth: {
        sessions: {
          create: vi.fn().mockResolvedValue({
            accessToken: "token",
            authToken: "auth-token",
            sessionId: "sess-code",
            userId: "1",
          }),
        },
      },
    };

    const controller = createSdkworkIamH5AuthController({ service: service as never });
    const phoneResult = await controller.loginWithCode({ target: "13800138000", code: "8888" });
    expect(phoneResult).toMatchObject({ kind: "session", session: { sessionId: "sess-code" } });
    expect(service.auth.sessions.create).toHaveBeenLastCalledWith({
      code: "8888",
      grantType: "phone_code",
      phone: "13800138000",
    });

    const emailResult = await controller.loginWithCode({ target: "a@example.com", code: "8888" });
    expect(emailResult).toMatchObject({ kind: "session", session: { sessionId: "sess-code" } });
    expect(service.auth.sessions.create).toHaveBeenLastCalledWith({
      code: "8888",
      grantType: "email_code",
      email: "a@example.com",
    });
  });

  it("returns login context selection challenge for code login", async () => {
    const service = {
      auth: {
        sessions: {
          create: vi.fn().mockResolvedValue({
            challengeType: "LOGIN_CONTEXT_SELECTION",
            continuationToken: "continue-code",
            options: [{ loginScope: "TENANT", organizationId: "0", displayName: "Personal account" }],
            organizations: [],
          }),
        },
      },
    };

    const controller = createSdkworkIamH5AuthController({ service: service as never });
    const result = await controller.loginWithCode({ target: "13800138000", code: "8888" });
    expect(result.kind).toBe("loginContextSelectionRequired");
    expect(controller.getState().status).toBe("loginContextSelectionRequired");
    expect(controller.getState().session).toBeUndefined();
  });

  it("registers an account through registrations.create with a verification code", async () => {
    const service = {
      auth: {
        registrations: {
          create: vi.fn().mockResolvedValue({
            accessToken: "token",
            authToken: "auth-token",
            sessionId: "sess-register",
            userId: "1",
          }),
        },
      },
    };

    const controller = createSdkworkIamH5AuthController({ service: service as never });
    await expect(controller.register({
      account: "13800138000",
      code: "8888",
      password: "secret",
    })).resolves.toMatchObject({ kind: "session", session: { sessionId: "sess-register" } });
    expect(service.auth.registrations.create).toHaveBeenCalledWith({
      channel: "PHONE",
      password: "secret",
      username: "13800138000",
      verificationCode: "8888",
    });
  });

  it("resets the password through passwordResetRequests and passwordResets", async () => {
    const service = {
      auth: {
        passwordResetRequests: {
          create: vi.fn().mockResolvedValue(undefined),
        },
        passwordResets: {
          create: vi.fn().mockResolvedValue(undefined),
        },
      },
    };

    const controller = createSdkworkIamH5AuthController({ service: service as never });
    await controller.resetPassword({
      account: "a@example.com",
      code: "8888",
      newPassword: "new-secret",
    });
    expect(service.auth.passwordResetRequests.create).toHaveBeenCalledWith({
      account: "a@example.com",
      channel: "EMAIL",
    });
    expect(service.auth.passwordResets.create).toHaveBeenCalledWith({
      account: "a@example.com",
      code: "8888",
      confirmPassword: "new-secret",
      newPassword: "new-secret",
    });
    expect(controller.getState().session).toBeUndefined();
  });

  it("sends verification codes through the injected verification code client", async () => {
    const service = { auth: {} };
    const verificationCodeClient = {
      send: vi.fn().mockResolvedValue(undefined),
    };
    const controller = createSdkworkIamH5AuthController({
      service: service as never,
      verificationCodeClient,
    });

    await controller.sendVerificationCode({
      scene: "LOGIN",
      target: "13800138000",
      verifyType: "PHONE",
    });
    expect(verificationCodeClient.send).toHaveBeenCalledWith({
      scene: "LOGIN",
      target: "13800138000",
      verifyType: "PHONE",
    });
  });

  it("fails closed when no verification code client is injected", async () => {
    const controller = createSdkworkIamH5AuthController({ service: { auth: {} } as never });
    await expect(controller.sendVerificationCode({
      scene: "REGISTER",
      target: "13800138000",
      verifyType: "PHONE",
    })).rejects.toThrow(/unavailable/i);
  });

  it("resolves the verification channel from the account value", () => {
    expect(resolveSdkworkIamH5VerifyType("13800138000")).toBe("PHONE");
    expect(resolveSdkworkIamH5VerifyType("a@example.com")).toBe("EMAIL");
    expect(resolveSdkworkIamH5VerifyType("  user@corp.cn ")).toBe("EMAIL");
  });

  it("keeps en-US and zh-CN auth message catalogs in parity", () => {
    expect(() => assertSdkworkIamH5AuthI18nCatalogParity()).not.toThrow();
    const zh = createSdkworkIamH5AuthMessages("zh-CN");
    const en = createSdkworkIamH5AuthMessages("en-US");
    expect(zh.modes.loginPwd).toBe("密码登录");
    expect(zh.actions.agreeAndLogin).toBe("同意并登录");
    expect(zh.toasts.agreeTermsFirst).toBe("请先阅读并同意条款");
    expect(en.modes.loginPwd).toBe("Password sign in");
    expect(en.actions.agreeAndLogin).toBe("Agree & Sign in");
    expect(Object.keys(zh).sort()).toEqual(Object.keys(en).sort());
    expect(zh.oauth.authorizeWithWechat).toBe("微信授权登录");
    expect(en.oauth.authorizeWithWechat).toBe("Authorize with WeChat");
    expect(zh.oauth.silentSigningIn).toContain("静默");
    expect(en.oauth.silentSigningIn).toContain("silent");
  });

  it("forwards the WeChat OAuth scope to authorizationUrls.create", async () => {
    const service = {
      oauth: {
        authorizationUrls: {
          create: vi.fn().mockResolvedValue({ authUrl: "https://open.weixin.qq.com/auth" }),
        },
      },
    };
    const controller = createSdkworkIamH5AuthController({ service: service as never });

    await expect(controller.createOAuthAuthorizationUrl({
      provider: "wechat",
      redirectUri: "https://example.com/auth/oauth/callback",
      scope: "snsapi_base",
      state: "scan:qr-1",
    })).resolves.toBe("https://open.weixin.qq.com/auth");

    expect(service.oauth.authorizationUrls.create).toHaveBeenCalledWith({
      provider: "wechat",
      redirectUri: "https://example.com/auth/oauth/callback",
      scope: "snsapi_base",
      state: "scan:qr-1",
    });
  });

  it("begins a silent WeChat authorization: snsapi_base scope and stored flow context", async () => {
    const service = {
      oauth: {
        authorizationUrls: {
          create: vi.fn().mockResolvedValue({ authUrl: "https://open.weixin.qq.com/auth" }),
        },
      },
    };
    const controller = createSdkworkIamH5AuthController({ service: service as never });

    await expect(controller.beginOAuthAuthorization({
      mode: "silent",
      provider: "wechat",
      redirectUri: "https://example.com/auth/oauth/callback",
    })).resolves.toBeUndefined();

    expect(service.oauth.authorizationUrls.create).toHaveBeenCalledWith({
      provider: "wechat",
      redirectUri: "https://example.com/auth/oauth/callback",
      scope: "snsapi_base",
    });
    // Navigation to the provider page never completes inside jsdom, so the
    // flow stays pending with the context stored for the callback screen.
    expect(controller.getState().status).toBe("loading");
    expect(readOAuthFlowContext()).toEqual({
      mode: "silent",
      provider: "wechat",
      redirectUri: "https://example.com/auth/oauth/callback",
    });
    clearOAuthFlowContext();
  });

  it("begins an explicit WeChat authorization with snsapi_userinfo (点击授权)", async () => {
    const service = {
      oauth: {
        authorizationUrls: {
          create: vi.fn().mockResolvedValue({ url: "https://open.weixin.qq.com/consent" }),
        },
      },
    };
    const controller = createSdkworkIamH5AuthController({ service: service as never });

    await expect(controller.beginOAuthAuthorization({
      mode: "explicit",
      provider: "wechat",
      redirectUri: "https://example.com/auth/oauth/callback",
      state: "scan:qr-1",
    })).resolves.toBeUndefined();

    expect(service.oauth.authorizationUrls.create).toHaveBeenCalledWith({
      provider: "wechat",
      redirectUri: "https://example.com/auth/oauth/callback",
      scope: "snsapi_userinfo",
      state: "scan:qr-1",
    });
    expect(readOAuthFlowContext()?.mode).toBe("explicit");
    clearOAuthFlowContext();
  });

  it("clears the stored flow context when beginning authorization fails", async () => {
    storeOAuthFlowContext({
      mode: "explicit",
      provider: "wechat",
      redirectUri: "https://example.com/auth/oauth/callback",
    });
    const service = {
      oauth: {
        authorizationUrls: {
          create: vi.fn().mockRejectedValue(new Error("provider is not configured")),
        },
      },
    };
    const controller = createSdkworkIamH5AuthController({ service: service as never });

    await expect(controller.beginOAuthAuthorization({
      mode: "silent",
      provider: "wechat",
      redirectUri: "https://example.com/auth/oauth/callback",
    })).rejects.toThrow("provider is not configured");

    expect(controller.getState().status).toBe("error");
    expect(readOAuthFlowContext()).toBeUndefined();
  });

  it("round-trips the OAuth flow context through sessionStorage", () => {
    expect(readOAuthFlowContext()).toBeUndefined();
    storeOAuthFlowContext({
      mode: "silent",
      provider: "wechat",
      redirectUri: "https://example.com/auth/oauth/callback",
    });
    expect(readOAuthFlowContext()).toEqual({
      mode: "silent",
      provider: "wechat",
      redirectUri: "https://example.com/auth/oauth/callback",
    });
    clearOAuthFlowContext();
    expect(readOAuthFlowContext()).toBeUndefined();

    // Invalid or partial records are rejected instead of half-read.
    storeOAuthFlowContext({
      mode: "silent",
      provider: "wechat",
      redirectUri: "https://example.com/auth/oauth/callback",
    });
    window.sessionStorage.setItem(
      "sdkwork.iam.h5.oauthFlow",
      JSON.stringify({ mode: "mystery", provider: "wechat", redirectUri: "x" }),
    );
    expect(readOAuthFlowContext()).toBeUndefined();
    clearOAuthFlowContext();
  });

  it("round-trips the WeChat auto-authorization block", () => {
    expect(isWechatAutoAuthorizationBlocked()).toBe(false);
    blockWechatAutoAuthorization();
    expect(isWechatAutoAuthorizationBlocked()).toBe(true);
    clearWechatAutoAuthorizationBlock();
    expect(isWechatAutoAuthorizationBlocked()).toBe(false);
  });

  it("clears the WeChat auto-authorization block when an authorization begins", async () => {
    blockWechatAutoAuthorization();
    const service = {
      oauth: {
        authorizationUrls: {
          create: vi.fn().mockResolvedValue({ authUrl: "https://open.weixin.qq.com/auth" }),
        },
      },
    };
    const controller = createSdkworkIamH5AuthController({ service: service as never });

    await controller.beginOAuthAuthorization({
      mode: "explicit",
      provider: "wechat",
      redirectUri: "https://example.com/auth/oauth/callback",
    });

    // Beginning an authorization is explicit user intent; the deny-loop
    // guard no longer applies.
    expect(isWechatAutoAuthorizationBlocked()).toBe(false);
    clearOAuthFlowContext();
  });
});
