import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import {
  clearSdkworkAuthRuntimeConfig,
  buildSdkworkAuthQrEntryPath,
  buildSdkworkAuthQrEntryUrl,
  createAuthEntryDigest,
  createAuthRouteCatalog,
  createAuthRouteIntent,
  createAuthWorkspaceManifest,
  createSdkworkAuthAppbaseIntegration,
  evaluateAuthEntryReadiness,
  isConfiguredSdkworkAuthOAuthProvider,
  isSdkworkAuthOAuthLoginEnabled,
  normalizeSdkworkAuthThirdPartyLoginErrorMessage,
  readSdkworkIdentityErrorMessage,
  resolveSdkworkAuthRuntimeConfigFromMetadata,
  resolveSdkworkAuthOAuthProviderRegion,
  resolveSdkworkAuthOAuthProviders,
  isAuthRoute,
  normalizeSdkworkAuthOAuthProvider,
  resolveAuthRedirectTarget,
  resolveAuthAccess,
  resolveAuthStatus,
  resolveSdkworkAuthFlowMode,
  resolveSdkworkAuthMode,
  resolveSdkworkAuthPageMode,
  SDKWORK_AUTH_FLOW_QUERY_KEY,
  resolveSdkworkAuthLoginMethods,
  summarizeAuthEntryDigests,
  resolveSdkworkAuthVerificationPolicy,
  setSdkworkAuthRuntimeConfig,
} from "../src";

describe("sdkwork-auth-pc-react", () => {
  afterEach(() => {
    clearSdkworkAuthRuntimeConfig();
    vi.unstubAllEnvs();
  });

  it("creates a predictable auth route catalog", () => {
    const routes = createAuthRouteCatalog("/auth");

    expect(routes.map((route) => route.path)).toEqual([
      "/auth/login",
      "/auth/register",
      "/auth/forgot-password",
      "/auth/oauth/callback/:provider",
      "/auth/qr-login",
      "/auth/qr/:sessionKey",
    ]);
    expect(isAuthRoute(routes, "/auth/oauth/callback/github")).toBe(true);
    expect(isAuthRoute(routes, "/auth/qr/qr_abc123")).toBe(true);
    expect(isAuthRoute(routes, "/dashboard")).toBe(false);
  });

  it("resolves register and forgot flows from dedicated paths or login flow query", () => {
    expect(resolveSdkworkAuthMode("/auth/register", "/auth")).toBe("register");
    expect(resolveSdkworkAuthMode("/auth/forgot-password", "/auth")).toBe("forgot");
    expect(resolveSdkworkAuthMode("/auth/login", "/auth")).toBe("login");

    const registerFlow = new URLSearchParams({ [SDKWORK_AUTH_FLOW_QUERY_KEY]: "register" });
    const forgotFlow = new URLSearchParams({ [SDKWORK_AUTH_FLOW_QUERY_KEY]: "forgot-password" });

    expect(resolveSdkworkAuthFlowMode(registerFlow)).toBe("register");
    expect(resolveSdkworkAuthFlowMode(forgotFlow)).toBe("forgot");
    expect(resolveSdkworkAuthPageMode("/auth/login", registerFlow, "/auth")).toBe("register");
    expect(resolveSdkworkAuthPageMode("/auth/login", forgotFlow, "/auth")).toBe("forgot");
    expect(resolveSdkworkAuthPageMode("/auth/register", registerFlow, "/auth")).toBe("register");
  });

  it("creates appbase auth integration metadata from minimal app identity", () => {
    const integration = createSdkworkAuthAppbaseIntegration({
      app: {
        id: "sdkwork-chat-pc",
        title: "SDKWork Chat PC",
      },
      basePath: "/auth",
      extraPackageNames: ["@sdkwork/example-product-pc-react"],
    });

    expect(integration.routes.map((route) => route.path)).toEqual([
      "/auth/login",
      "/auth/register",
      "/auth/forgot-password",
      "/auth/oauth/callback/:provider",
      "/auth/qr-login",
      "/auth/qr/:sessionKey",
    ]);
    expect(integration.manifest).toMatchObject({
      architecture: "pc-react",
      id: "sdkwork-chat-pc",
      title: "SDKWork Chat PC",
    });
    expect(integration.manifest.packageNames).toContain("@sdkwork/auth-pc-react");
    expect(integration.manifest.packageNames).toContain("@sdkwork/example-product-pc-react");
    expect(integration.appbaseMeta).toMatchObject({
      authPackageMeta: expect.objectContaining({
        package: "@sdkwork/auth-pc-react",
      }),
      appbasePackageMeta: expect.objectContaining({
        package: "@sdkwork/appbase-pc-react",
      }),
      manifest: integration.manifest,
    });
  });

  it("builds concise browser-facing QR login entry URLs", () => {
    expect(buildSdkworkAuthQrEntryPath(" qr_abc123 ")).toBe("/auth/qr/qr_abc123");
    expect(buildSdkworkAuthQrEntryPath("qr_abc123", {
      basePath: "/workspace/auth",
    })).toBe("/workspace/auth/qr/qr_abc123");
    expect(buildSdkworkAuthQrEntryUrl("qr_abc123", {
      origin: "https://app.sdkwork.test/",
    })).toBe("https://app.sdkwork.test/auth/qr/qr_abc123");
    expect(buildSdkworkAuthQrEntryPath("")).toBe("/auth/qr");
  });

  it("resolves auth state and route access decisions from runtime session tokens", () => {
    const routes = createAuthRouteCatalog("/auth");

    expect(resolveAuthStatus({ accessToken: "access-token", authToken: "auth-token" })).toBe("authenticated");
    expect(resolveAuthStatus({ authToken: "auth-token" })).toBe("anonymous");
    expect(resolveAuthStatus({ accessToken: "access-token" })).toBe("anonymous");
    expect(resolveAuthStatus(
      { accessToken: "access-token", authToken: "auth-token" },
      { expiresAt: "2025-01-01T00:00:00.000Z" },
    )).toBe("expired");
    expect(resolveAuthStatus(undefined)).toBe("anonymous");

    expect(
      resolveAuthAccess({
        currentPath: "/settings/profile",
        protectedPrefixes: [
          "/settings",
        ],
        routes,
        session: undefined,
      }),
    ).toEqual({
      allowed: false,
      reason: "login-required",
      redirectTo: "/auth/login?redirect=%2Fsettings%2Fprofile",
      status: "anonymous",
    });

    expect(
      resolveAuthAccess({
        currentPath: "/auth/login",
        homePath: "/dashboard",
        routes,
        session: {
          accessToken: "access-token",
          authToken: "auth-token",
        },
      }),
    ).toEqual({
      allowed: false,
      reason: "already-authenticated",
      redirectTo: "/dashboard",
        status: "authenticated",
      });
  });

  it("creates auth entry digests and summarizes enabled auth capability surfaces", () => {
    const digests = [
      createAuthEntryDigest(
        {
          enabled: true,
          flow: "login",
          id: "password-login",
          kind: "method",
          method: "password",
          route: "/auth/login",
        },
        {
          activeFlow: "login",
          currentEntryId: "password-login",
          entryKindFilter: "method",
        },
      ),
      createAuthEntryDigest(
        {
          callbackRoute: "/auth/oauth/callback/github",
          enabled: true,
          flow: "login",
          id: "github-oauth",
          kind: "oauth-provider",
          launchHref: "https://accounts.sdkwork.ai/oauth/github",
          provider: "github",
          route: "/auth/login",
        },
        {
          activeFlow: "login",
        },
      ),
      createAuthEntryDigest(
        {
          enabled: true,
          flow: "login",
          id: "qr-login",
          kind: "qr-login",
          route: "/auth/qr-login",
        },
        {
          activeFlow: "login",
        },
      ),
      createAuthEntryDigest(
        {
          enabled: true,
          flow: "register",
          id: "phone-register",
          kind: "method",
          method: "phone",
          route: "/auth/register",
        },
        {
          activeFlow: "login",
        },
      ),
      createAuthEntryDigest(
        {
          enabled: false,
          flow: "forgot-password",
          id: "email-recovery",
          kind: "method",
          method: "email",
          route: "/auth/forgot-password",
        },
        {
          activeFlow: "login",
        },
      ),
    ];

    expect(digests[0]).toEqual({
      digestStatus: "current",
      entryId: "password-login",
      entryKind: "method",
      flow: "login",
      isAvailable: true,
      isCurrent: true,
      isEnabled: true,
      isExternal: false,
      matchesFlow: true,
      matchesKind: true,
      method: "password",
      route: "/auth/login",
    });

    expect(digests[1]).toEqual({
      callbackRoute: "/auth/oauth/callback/github",
      digestStatus: "external",
      entryId: "github-oauth",
      entryKind: "oauth-provider",
      flow: "login",
      hasCallbackRoute: true,
      hasLaunchHref: true,
      isAvailable: true,
      isCurrent: false,
      isEnabled: true,
      isExternal: true,
      launchHref: "https://accounts.sdkwork.ai/oauth/github",
      matchesFlow: true,
      matchesKind: true,
      provider: "github",
      route: "/auth/login",
    });

    expect(summarizeAuthEntryDigests(digests)).toEqual({
      currentEntries: 1,
      enabledEntries: 4,
      externalEntries: 1,
      loginEntries: 3,
      oauthEntries: 1,
      qrEntries: 1,
      recoveryEntries: 1,
      registerEntries: 1,
      restrictedEntries: 1,
      totalEntries: 5,
    });
  });

  it("evaluates auth entry readiness for normal, degraded, and blocked entry actions", () => {
    const passwordDigest = createAuthEntryDigest(
      {
        enabled: true,
        flow: "login",
        id: "password-login",
        kind: "method",
        method: "password",
        route: "/auth/login",
      },
      {
        activeFlow: "login",
        entryKindFilter: "method",
      },
    );
    const githubDigest = createAuthEntryDigest(
      {
        callbackRoute: "/auth/oauth/callback/github",
        enabled: true,
        flow: "login",
        id: "github-oauth",
        kind: "oauth-provider",
        launchHref: "https://accounts.sdkwork.ai/oauth/github",
        provider: "github",
        route: "/auth/login",
      },
      {
        activeFlow: "register",
        entryKindFilter: "oauth-provider",
      },
    );
    const disabledRecoveryDigest = createAuthEntryDigest(
      {
        enabled: false,
        flow: "forgot-password",
        id: "email-recovery",
        kind: "method",
        method: "email",
        route: "/auth/forgot-password",
      },
      {
        activeFlow: "login",
      },
    );
    const brokenProviderDigest = createAuthEntryDigest(
      {
        enabled: true,
        flow: "login",
        id: "google-oauth",
        kind: "oauth-provider",
        provider: "google",
        route: "/auth/login",
      },
      {
        activeFlow: "login",
      },
    );

    expect(evaluateAuthEntryReadiness(passwordDigest)).toEqual({
      capabilities: {
        canOpenEntry: true,
        canStartOAuth: false,
      },
      checklist: {
        hasCallbackRoute: false,
        hasLaunchHref: false,
        hasRoute: true,
        isAvailable: true,
        isEnabled: true,
        isExternal: false,
        matchesFlow: true,
        matchesKind: true,
      },
      degraded: false,
      issues: [],
      ready: true,
    });

    expect(
      evaluateAuthEntryReadiness(githubDigest, {
        action: "start-oauth",
      }),
    ).toEqual({
      capabilities: {
        canOpenEntry: true,
        canStartOAuth: true,
      },
      checklist: {
        hasCallbackRoute: true,
        hasLaunchHref: true,
        hasRoute: true,
        isAvailable: true,
        isEnabled: true,
        isExternal: true,
        matchesFlow: false,
        matchesKind: true,
      },
      degraded: true,
      issues: ["flow-mismatch"],
      ready: true,
    });

    expect(evaluateAuthEntryReadiness(disabledRecoveryDigest)).toEqual({
      capabilities: {
        canOpenEntry: false,
        canStartOAuth: false,
      },
      checklist: {
        hasCallbackRoute: false,
        hasLaunchHref: false,
        hasRoute: true,
        isAvailable: false,
        isEnabled: false,
        isExternal: false,
        matchesFlow: false,
        matchesKind: true,
      },
      degraded: true,
      issues: ["flow-mismatch", "entry-disabled"],
      ready: false,
    });

    expect(
      evaluateAuthEntryReadiness(brokenProviderDigest, {
        action: "start-oauth",
      }),
    ).toEqual({
      capabilities: {
        canOpenEntry: true,
        canStartOAuth: false,
      },
      checklist: {
        hasCallbackRoute: false,
        hasLaunchHref: false,
        hasRoute: true,
        isAvailable: true,
        isEnabled: true,
        isExternal: true,
        matchesFlow: true,
        matchesKind: true,
      },
      degraded: false,
      issues: ["launch-href-missing", "callback-route-missing"],
      ready: false,
    });
  });

  it("defaults third-party login providers to mainland and overseas catalogs", () => {
    expect(resolveSdkworkAuthOAuthProviderRegion()).toBe("mainland");
    expect(resolveSdkworkAuthOAuthProviders()).toEqual([
      "wechat",
      "alipay",
      "douyin",
      "qq",
      "weibo",
    ]);
    expect(resolveSdkworkAuthOAuthProviders(undefined, "overseas")).toEqual([
      "google",
      "github",
      "twitter",
      "facebook",
      "microsoft",
      "apple",
      "linkedin",
      "line",
      "tiktok",
      "discord",
    ]);
    expect(resolveSdkworkAuthOAuthProviders(["github", "wechat", "github"])).toEqual([
      "github",
      "wechat",
    ]);
    expect(resolveSdkworkAuthOAuthProviders([])).toEqual([]);
  });

  it("keeps third-party login disabled until runtime config explicitly enables it", () => {
    expect(isSdkworkAuthOAuthLoginEnabled()).toBe(false);
    expect(isSdkworkAuthOAuthLoginEnabled(true)).toBe(true);
    expect(isSdkworkAuthOAuthLoginEnabled(false)).toBe(false);
  });

  it("normalizes common OAuth provider aliases before checking configuration", () => {
    expect(resolveSdkworkAuthOAuthProviders([
      "WECHAT",
      "ali-pay",
      "tik_tok",
      "google-oauth2",
      "github.com",
    ])).toEqual([
      "wechat",
      "alipay",
      "tiktok",
      "google",
      "github",
    ]);
    expect(normalizeSdkworkAuthOAuthProvider("WeChat")).toBe("wechat");
    expect(normalizeSdkworkAuthOAuthProvider("ALI_PAY")).toBe("alipay");
    expect(normalizeSdkworkAuthOAuthProvider("dou-yin")).toBe("douyin");
    expect(normalizeSdkworkAuthOAuthProvider("tik tok")).toBe("tiktok");

    const configuredProviders = resolveSdkworkAuthOAuthProviders([
      "WECHAT",
      "ali-pay",
      "tik_tok",
      "google-oauth2",
      "github.com",
    ]);
    expect(isConfiguredSdkworkAuthOAuthProvider("wechat", configuredProviders)).toBe(true);
    expect(isConfiguredSdkworkAuthOAuthProvider("alipay", configuredProviders)).toBe(true);
    expect(isConfiguredSdkworkAuthOAuthProvider("tiktok", configuredProviders)).toBe(true);
    expect(isConfiguredSdkworkAuthOAuthProvider("google", configuredProviders)).toBe(true);
    expect(isConfiguredSdkworkAuthOAuthProvider("github", configuredProviders)).toBe(true);
  });

  it("normalizes third-party login errors into product-facing copy", () => {
    const copy = {
      genericProviderError: "第三方登录未能完成。",
      invalidProvider: "该第三方登录方式暂不可用。",
      providerDenied: "第三方登录已取消或未授权。",
    };

    expect(
      normalizeSdkworkAuthThirdPartyLoginErrorMessage(
        "OAuth provider is not configured",
        copy,
      ),
    ).toBe("该第三方登录方式暂不可用。");
    expect(
      normalizeSdkworkAuthThirdPartyLoginErrorMessage("access_denied", copy),
    ).toBe("第三方登录已取消或未授权。");
    expect(
      normalizeSdkworkAuthThirdPartyLoginErrorMessage("用户取消授权", copy),
    ).toBe("第三方登录已取消或未授权。");
    expect(
      normalizeSdkworkAuthThirdPartyLoginErrorMessage("provider handshake failed", copy),
    ).toBe("第三方登录未能完成。");
    expect(
      normalizeSdkworkAuthThirdPartyLoginErrorMessage("当前租户未开启该第三方登录", copy),
    ).toBe("该第三方登录方式暂不可用。");
    expect(
      normalizeSdkworkAuthThirdPartyLoginErrorMessage("Network timeout", copy),
    ).toBe("Network timeout");
  });

  it("normalizes duplicate registration account errors into product-facing copy", () => {
    expect(
      readSdkworkIdentityErrorMessage(
        new Error("account already exists"),
        "Failed to complete registration.",
      ),
    ).toBe("account already exists");

    expect(
      readSdkworkIdentityErrorMessage(
        new Error("account already exists"),
        "Failed to complete registration.",
        {
          accountAlreadyExists: "This account already exists. Sign in or use a different account.",
        },
      ),
    ).toBe("This account already exists. Sign in or use a different account.");

    expect(
      readSdkworkIdentityErrorMessage(
        new Error(JSON.stringify({
          code: "iam_account_already_exists",
          data: null,
          message: "account already exists",
          requestId: "request-1",
        })),
        "\u6ce8\u518c\u5931\u8d25\u3002",
        {
          accountAlreadyExists: "\u8d26\u53f7\u5df2\u5b58\u5728\uff0c\u8bf7\u76f4\u63a5\u767b\u5f55\u6216\u66f4\u6362\u8d26\u53f7\u3002",
        },
      ),
    ).toBe("\u8d26\u53f7\u5df2\u5b58\u5728\uff0c\u8bf7\u76f4\u63a5\u767b\u5f55\u6216\u66f4\u6362\u8d26\u53f7\u3002");
  });

  it("preserves OAuth provider region from canonical auth metadata", () => {
    expect(
      resolveSdkworkAuthRuntimeConfigFromMetadata({
        oauthLoginEnabled: true,
        oauthProviderRegion: "overseas",
        supportsLocalCredentials: true,
      }),
    ).toMatchObject({
      oauthLoginEnabled: true,
      oauthProviderRegion: "overseas",
      oauthProviders: [],
    });
  });

  it("ignores QR login type metadata because OAuth device authorization owns QR entry selection", () => {
    expect(
      resolveSdkworkAuthRuntimeConfigFromMetadata({
        qrLoginType: "wechat-mini-program",
      } as never),
    ).not.toHaveProperty("qrLoginType");
  });

  it("uses metadata verification policy to hide disabled verification-code login tabs", () => {
    expect(
      resolveSdkworkAuthRuntimeConfigFromMetadata({
        loginMethods: ["password", "emailCode", "phoneCode"],
        verificationPolicy: {
          emailCodeLoginEnabled: true,
          phoneCodeLoginEnabled: false,
        },
      }).loginMethods,
    ).toEqual([
      "password",
      "emailCode",
    ]);
  });

  it("defaults verification policy to password-only login and registration without verification codes", () => {
    expect(resolveSdkworkAuthVerificationPolicy()).toEqual({
      emailCodeLoginEnabled: false,
      emailRegistrationVerificationRequired: false,
      phoneCodeLoginEnabled: false,
      phoneRegistrationVerificationRequired: false,
    });
    expect(resolveSdkworkAuthLoginMethods()).toEqual([
      "password",
    ]);
  });

  it("uses verification policy to add email and phone code login when no explicit login methods are configured", () => {
    expect(resolveSdkworkAuthLoginMethods(undefined, {
      emailCodeLoginEnabled: true,
      phoneCodeLoginEnabled: true,
    })).toEqual([
      "password",
      "emailCode",
      "phoneCode",
    ]);

    expect(resolveSdkworkAuthLoginMethods([
      "password",
      "emailCode",
    ], {
      phoneCodeLoginEnabled: true,
    })).toEqual([
      "password",
      "emailCode",
    ]);
  });

  it("resolves verification policy from runtime config and environment flags", () => {
    setSdkworkAuthRuntimeConfig({
      verificationPolicy: {
        emailRegistrationVerificationRequired: true,
        phoneCodeLoginEnabled: true,
      },
    });

    expect(resolveSdkworkAuthVerificationPolicy()).toEqual({
      emailCodeLoginEnabled: false,
      emailRegistrationVerificationRequired: true,
      phoneCodeLoginEnabled: true,
      phoneRegistrationVerificationRequired: false,
    });
    expect(resolveSdkworkAuthLoginMethods()).toEqual([
      "password",
      "phoneCode",
    ]);

    clearSdkworkAuthRuntimeConfig();
    vi.stubEnv("VITE_SDKWORK_AUTH_EMAIL_CODE_LOGIN_ENABLED", "true");
    vi.stubEnv("VITE_SDKWORK_AUTH_PHONE_REGISTER_VERIFICATION_REQUIRED", "yes");

    expect(resolveSdkworkAuthVerificationPolicy()).toEqual({
      emailCodeLoginEnabled: true,
      emailRegistrationVerificationRequired: false,
      phoneCodeLoginEnabled: false,
      phoneRegistrationVerificationRequired: true,
    });
    expect(resolveSdkworkAuthLoginMethods()).toEqual([
      "password",
      "emailCode",
    ]);
  });

  it("creates auth manifests and route intents with redirect-safe routing", () => {
    const routes = createAuthRouteCatalog("/auth");

    expect(resolveAuthRedirectTarget(null)).toBe("/dashboard");
    expect(resolveAuthRedirectTarget("/login")).toBe("/dashboard");
    expect(resolveAuthRedirectTarget("/settings/profile")).toBe("/settings/profile");
    expect(resolveAuthRedirectTarget("//evil.com")).toBe("/dashboard");
    expect(resolveAuthRedirectTarget("/\\evil.com")).toBe("/dashboard");
    expect(resolveAuthRedirectTarget("https://evil.com/path")).toBe("/dashboard");
    expect(
      resolveAuthRedirectTarget(
        "/workspace/auth/login",
        "/dashboard",
        "/workspace/auth",
      ),
    ).toBe("/dashboard");
    expect(
      resolveAuthRedirectTarget(
        "/workspace/auth/oauth/callback/github",
        "/dashboard",
        "/workspace/auth",
      ),
    ).toBe("/dashboard");
    expect(
      resolveAuthRedirectTarget(
        "/workspace/auth/qr/qr_abc123",
        "/dashboard",
        "/workspace/auth",
      ),
    ).toBe("/dashboard");

    const manifest = createAuthWorkspaceManifest({
      packageNames: ["@sdkwork/auth-pc-react", "@sdkwork/user-pc-react"],
      title: "Auth",
    });

    expect(manifest).toMatchObject({
      capability: "auth",
      forgotPasswordRoutePath: "/auth/forgot-password",
      loginRoutePath: "/auth/login",
      oauthCallbackRoutePattern: "/auth/oauth/callback/:provider",
      qrRoutePath: "/auth/qr-login",
      registerRoutePath: "/auth/register",
      title: "Auth",
    });
    expect(manifest.packageNames).toEqual([
      "@sdkwork/auth-pc-react",
      "@sdkwork/user-pc-react",
    ]);

    expect(
      createAuthRouteIntent("login", {
        redirectTo: "/settings/profile",
        routes,
      }),
    ).toEqual({
      focusWindow: true,
      redirectTo: "/settings/profile",
      route: "/auth/login?redirect=%2Fsettings%2Fprofile",
      routeId: "login",
      source: "auth-workspace",
      type: "auth-route-intent",
    });

    expect(
      createAuthRouteIntent("oauth-callback", {
        provider: "github",
        redirectTo: "/settings/profile",
        routes,
      }),
    ).toEqual({
      focusWindow: true,
      provider: "github",
      redirectTo: "/settings/profile",
      route: "/auth/oauth/callback/github?redirect=%2Fsettings%2Fprofile",
      routeId: "oauth-callback",
      source: "auth-workspace",
      type: "auth-route-intent",
    });
  });
});
