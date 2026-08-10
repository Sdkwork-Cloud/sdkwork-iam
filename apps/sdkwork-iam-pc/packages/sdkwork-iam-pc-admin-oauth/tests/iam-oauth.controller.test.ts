import { describe, expect, it, vi } from "vitest";

import { createSdkworkIamOauthAdminController } from "../src/services/oauth-admin-controller";
import { createOauthServiceMock } from "./fixtures/oauth-service-mock";



describe("SDKWork IAM OAuth PC admin controller", () => {
  it("loads all iam.oauth admin resource lists", async () => {
    const service = createOauthServiceMock();
    const controller = createSdkworkIamOauthAdminController({ service: service as never });
    await controller.load();

    expect(service.iam.oauth.policies.list).toHaveBeenCalledOnce();
    expect(service.iam.oauth.tenantBindings.list).toHaveBeenCalledOnce();
    expect(service.iam.oauth.operatorPlatforms.list).toHaveBeenCalledOnce();
    expect(service.iam.oauth.diagnosticRuns.list).toHaveBeenCalledOnce();
    expect(service.iam.oauth.resourceAccounts.list).toHaveBeenCalledOnce();
    expect(service.iam.oauth.resourceAuthorizations.list).toHaveBeenCalledOnce();
    expect(service.iam.oauth.operationalResources.list).toHaveBeenCalledOnce();
    expect(service.iam.oauth.accountLinks.list).toHaveBeenCalledOnce();
    expect(service.iam.oauth.grants.list).toHaveBeenCalledOnce();
    expect(service.iam.oauth.callbackEvents.list).toHaveBeenCalledOnce();
  });

  it("loads only the resource lists requested by a focused admin view", async () => {
    const service = createOauthServiceMock();
    const controller = createSdkworkIamOauthAdminController({ service: service as never });

    await controller.load(["integrations", "providerCatalog"]);

    expect(service.iam.oauth.integrations.list).toHaveBeenCalledOnce();
    expect(service.iam.oauth.providerCatalog.list).toHaveBeenCalledOnce();
    expect(service.iam.oauth.clients.list).not.toHaveBeenCalled();
    expect(service.iam.oauth.grants.list).not.toHaveBeenCalled();
    expect(service.iam.oauth.callbackEvents.list).not.toHaveBeenCalled();
  });

  it("creates operational OAuth resources through iam.oauth backend service methods", async () => {
    const service = createOauthServiceMock();
    const controller = createSdkworkIamOauthAdminController({ service: service as never });

    await controller.createClient({
      clientCode: "mini-program",
      displayName: "WeChat Mini Program",
      integrationId: "i1",
      providerClientId: "wx-mini-1",
      providerCode: "wechat_mini_program",
      providerTenantId: "wx-open-platform-1",
    });
    expect(service.iam.oauth.clients.create).toHaveBeenCalledWith({
      clientCode: "mini-program",
      displayName: "WeChat Mini Program",
      integrationId: "i1",
      providerClientId: "wx-mini-1",
      providerCode: "wechat_mini_program",
      providerTenantId: "wx-open-platform-1",
      enabled: true,
    });

    await controller.createPolicy({
      displayName: "Default",
      integrationId: "",
      policyCode: "default-login",
    });
    expect(service.iam.oauth.policies.create).toHaveBeenCalledWith({
      displayName: "Default",
      policyCode: "default-login",
    });

    await controller.createTenantBinding({
      bindingKind: "tenant_map",
      integrationId: "i1",
      providerCode: "wechat",
    });
    expect(service.iam.oauth.tenantBindings.create).toHaveBeenCalled();

    await controller.createOperatorPlatform({
      displayName: "WeChat OP",
      integrationId: "i1",
      operatorMode: "third_party",
      platformCode: "wechat-open",
      providerCode: "wechat",
      providerPlatformId: "wx-platform-1",
    });
    expect(service.iam.oauth.operatorPlatforms.create).toHaveBeenCalled();

    await controller.createDiagnosticRun({
      integrationId: "i1",
      providerCode: "wechat",
      runKind: "manual",
    });
    expect(service.iam.oauth.diagnosticRuns.create).toHaveBeenCalledWith({
      integrationId: "i1",
      providerCode: "wechat",
      runKind: "manual",
    });
  });

  it("provisions a complete enabled provider connection without exposing the secret again", async () => {
    const service = createOauthServiceMock();
    const controller = createSdkworkIamOauthAdminController({ service: service as never });

    await controller.createIntegration({
      appId: "iam-app-1",
      displayName: "Google login",
      enabled: true,
      integrationCode: "login-google",
      providerCatalogId: "catalog:0:google",
      providerClientId: "google-client-id",
      providerClientSecret: "write-only-secret",
      providerCode: "google",
      providerTenantId: "",
      redirectUri: "https://app.example.com/auth/oauth/callback",
      surfaceKind: "web",
    });

    expect(service.iam.oauth.integrations.create).toHaveBeenCalledWith({
      appId: "iam-app-1",
      displayName: "Google login",
      enabled: true,
      integrationCode: "login-google",
      providerCatalogId: "catalog:0:google",
      providerClientId: "google-client-id",
      providerClientSecret: "write-only-secret",
      providerCode: "google",
      redirectUri: "https://app.example.com/auth/oauth/callback",
      surfaceKind: "web",
    });
  });

  it("registers resource accounts, relying-party runtime config, grant revocation, and account-link updates", async () => {
    const service = createOauthServiceMock();
    const controller = createSdkworkIamOauthAdminController({ service: service as never });

    await controller.createResourceAccount({
      accessMode: "operator_managed",
      displayName: "Official account",
      integrationId: "i1",
      providerAccountId: "wx-oa-1",
      providerCode: "wechat",
      resourceAccountCode: "default-oa",
      resourceAccountKind: "official_account",
    });
    expect(service.iam.oauth.resourceAccounts.create).toHaveBeenCalled();

    await controller.createOperationalResource({
      displayName: "Home page",
      integrationId: "i1",
      providerCode: "wechat",
      resourceAccountId: "iamora-1",
      resourceCode: "home",
      resourceKind: "mini_program_page",
    });
    expect(service.iam.oauth.operationalResources.create).toHaveBeenCalled();

    await controller.updateRelyingParty({
      allowedScopesText: "openid, profile",
      clientIdHint: "",
      clientSecretHash: "$argon2id$v=19$hash",
      confidential: true,
      enabled: true,
      hasExistingSecret: false,
      redirectUrisText: "https://forum.example.com/callback",
      tenantApplicationId: "iamta-1",
      tenantId: "iamt-1",
    });
    expect(service.iam.tenantApplications.update).toHaveBeenCalledWith("iamta-1", {
      tenantId: "iamt-1",
      runtimeConfig: {
        oauth: {
          relyingParty: {
            enabled: true,
            redirectUris: ["https://forum.example.com/callback"],
            allowedScopes: ["openid", "profile"],
            confidential: true,
            clientSecretHash: "$argon2id$v=19$hash",
          },
        },
      },
    });

    await controller.revokeGrant("iamog-1");
    expect(service.iam.oauth.grants.delete).toHaveBeenCalledWith("iamog-1");

    await controller.updateAccountLink({ accountLinkId: "iamoal-1", status: "suspended" });
    expect(service.iam.oauth.accountLinks.update).toHaveBeenCalledWith("iamoal-1", { status: "suspended" });

    await controller.updateIntegration("iamoi-1", false);
    expect(service.iam.oauth.integrations.update).toHaveBeenCalledWith("iamoi-1", { enabled: false });

    await controller.deleteIntegration("iamoi-1");
    expect(service.iam.oauth.integrations.delete).toHaveBeenCalledWith("iamoi-1");

    await controller.deleteClient("iamoc-1");
    expect(service.iam.oauth.clients.delete).toHaveBeenCalledWith("iamoc-1");

    await controller.deleteSecret("iamos-1");
    expect(service.iam.oauth.secrets.delete).toHaveBeenCalledWith("iamos-1");

    await controller.updateSurface("iamosf-1", false);
    expect(service.iam.oauth.surfaces.update).toHaveBeenCalledWith("iamosf-1", { enabled: false });

    await controller.deleteSurface("iamosf-1");
    expect(service.iam.oauth.surfaces.delete).toHaveBeenCalledWith("iamosf-1");

    await controller.deleteOperationalResource("iamoor-1");
    expect(service.iam.oauth.operationalResources.delete).toHaveBeenCalledWith("iamoor-1");
  });

  it("runs lifecycle updates and operational verification queues through iam.oauth backend methods", async () => {
    const service = createOauthServiceMock();
    const controller = createSdkworkIamOauthAdminController({ service: service as never });

    await controller.updateClient("iamoc-1", false);
    expect(service.iam.oauth.clients.update).toHaveBeenCalledWith("iamoc-1", { enabled: false });

    await controller.updateFlowConfig("iamofc-1", true);
    expect(service.iam.oauth.flowConfigs.update).toHaveBeenCalledWith("iamofc-1", { enabled: true });

    await controller.updateWebhookConfig("iamowc-1", true);
    expect(service.iam.oauth.webhookConfigs.update).toHaveBeenCalledWith("iamowc-1", { enabled: true });

    await controller.updateScopeProfileStatus("iamosp-1", false);
    expect(service.iam.oauth.scopeProfiles.update).toHaveBeenCalledWith("iamosp-1", { status: "inactive" });

    await controller.runWebhookVerification("iamowc-1");
    expect(service.iam.oauth.webhookConfigs.verifications.create).toHaveBeenCalledWith("iamowc-1", {});

    await controller.runResourceAccountVerification("iamora-1");
    expect(service.iam.oauth.resourceAccounts.verifications.create).toHaveBeenCalledWith("iamora-1", {});

    await controller.runOperatorPlatformPreAuthorization("iamoop-1");
    expect(service.iam.oauth.operatorPlatforms.preAuthorizations.create).toHaveBeenCalledWith("iamoop-1", {});

    await controller.publishOperationalResource("iamoor-1");
    expect(service.iam.oauth.operationalResources.publishes.create).toHaveBeenCalledWith("iamoor-1", {});

    await controller.retrieveDiagnosticRun("iamodr-1");
    expect(service.iam.oauth.diagnosticRuns.retrieve).toHaveBeenCalledWith("iamodr-1");
    expect(controller.getState().lastDiagnosticRunDetail).toBeDefined();

    await controller.runResourceAccountMiniProgramLoginCheck("iamora-1");
    expect(service.iam.oauth.resourceAccounts.miniProgramLoginChecks.create).toHaveBeenCalledWith("iamora-1", {});

    await controller.retrieveIntegration("iamoi-1");
    expect(service.iam.oauth.integrations.retrieve).toHaveBeenCalledWith("iamoi-1");
    expect(controller.getState().lastResourceDetail?.label).toBe("OAuth integration");

    await controller.retrieveClient("iamoc-1");
    expect(service.iam.oauth.clients.retrieve).toHaveBeenCalledWith("iamoc-1");

    await controller.retrieveProviderCatalogEntry("iamopc-1");
    expect(service.iam.oauth.providerCatalog.retrieve).toHaveBeenCalledWith("iamopc-1");
  });

  it("creates and updates provider catalog entries through iam.oauth.providerCatalog", async () => {
    const service = createOauthServiceMock();
    const controller = createSdkworkIamOauthAdminController({ service: service as never });

    await controller.createProviderCatalog({
      providerCode: "custom_oidc",
      providerDisplayName: "Custom OIDC",
      providerName: "Custom OIDC Provider",
    });
    expect(service.iam.oauth.providerCatalog.create).toHaveBeenCalledWith({
      providerCode: "custom_oidc",
      providerDisplayName: "Custom OIDC",
      providerName: "Custom OIDC Provider",
    });

    await controller.updateProviderCatalogStatus("iamopc-2", false);
    expect(service.iam.oauth.providerCatalog.update).toHaveBeenCalledWith("iamopc-2", { status: "inactive" });
  });

  it("loads relying party runtime config through tenantApplications.retrieve", async () => {
    const service = createOauthServiceMock();
    const controller = createSdkworkIamOauthAdminController({ service: service as never });

    const draft = await controller.loadRelyingPartyConfig("iamt-1", "iamta-1");
    expect(service.iam.tenantApplications.retrieve).toHaveBeenCalledWith("iamta-1");
    expect(draft.tenantId).toBe("iamt-1");
    expect(draft.tenantApplicationId).toBe("iamta-1");
    expect(draft.clientIdHint).toBe("iam-app-1");
    expect(draft.hasExistingSecret).toBe(true);
    expect(draft.redirectUrisText).toBe("https://forum.example.com/callback");
    expect(draft.allowedScopesText).toBe("openid\nprofile");
    expect(draft.clientSecretHash).toBe("");
  });

  it("derives the standardized callback URL from the primary domain on account setup", async () => {
    const service = createOauthServiceMock();
    const controller = createSdkworkIamOauthAdminController({ service: service as never });

    await controller.createAccountSetup("mini_program", {
      appId: "wx-mini-1",
      appSecret: "secret-1",
      displayName: "Mini program",
      enabled: true,
      redirectUri: "",
      config: {
        webDomain: "app.example.com",
        domains: { request: ["https://api.example.com"] },
      },
    });

    const createCall = (service.iam.oauth.integrations.create as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(createCall.redirectUri).toBe("https://app.example.com/auth/oauth/callback");

    const accountCall = (service.iam.oauth.resourceAccounts.create as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(accountCall.config).toEqual({
      webDomain: "app.example.com",
      domains: { request: ["https://api.example.com"] },
      redirectUri: "https://app.example.com/auth/oauth/callback",
    });
  });

  it("saves the full account developer configuration and queues domain verification", async () => {
    const service = createOauthServiceMock();
    const controller = createSdkworkIamOauthAdminController({ service: service as never });

    const config = {
      webDomain: "app.example.com",
      redirectUri: "https://app.example.com/auth/oauth/callback",
      domains: {
        business: ["https://open.example.com"],
        downloadFile: ["https://dl.example.com"],
        request: ["https://api.example.com"],
        socket: ["wss://ws.example.com"],
        uploadFile: ["https://up.example.com"],
      },
      notify: {
        dataFormat: "json",
        encodingAesKey: "abcdefghijklmnopqrstuvwxyz0123456789ABCDEFG",
        encryptMode: "safe",
        token: "wechat-token",
        url: "https://app.example.com/wechat/notify",
      },
      verifyFile: {
        content: "wx-verification-content",
        fileName: "MP_verify_abc123.txt",
      },
    } as const;

    // State must expose the account so its login integration can be kept in sync.
    const serviceWithAccount = createOauthServiceMock();
    serviceWithAccount.iam.oauth.resourceAccounts.list = (async () => ({
      items: [{
        id: "iamora-1",
        integrationId: "iamoi-1",
        providerCode: "wechat",
        resourceAccountCode: "mini-wx",
        resourceAccountKind: "mini_program",
        displayName: "Mini",
        providerAccountId: "wx-1",
      }],
    })) as never;
    const syncingController = createSdkworkIamOauthAdminController({ service: serviceWithAccount as never });
    await syncingController.load(["resourceAccounts"]);

    await syncingController.updateAccountConfig("iamora-1", config);
    expect(serviceWithAccount.iam.oauth.resourceAccounts.update).toHaveBeenCalledWith("iamora-1", { config });
    expect(serviceWithAccount.iam.oauth.integrations.update).toHaveBeenCalledWith("iamoi-1", {
      redirectUri: "https://app.example.com/auth/oauth/callback",
    });

    await syncingController.runResourceAccountVerification("iamora-1");
    expect(serviceWithAccount.iam.oauth.resourceAccounts.verifications.create).toHaveBeenCalled();
  });

  it("rotates account credentials through resourceAccounts.update patches", async () => {
    const service = createOauthServiceMock();
    const controller = createSdkworkIamOauthAdminController({ service: service as never });

    // AppID + new secret: both patch fields are sent to the backend, which
    // cascades them to the linked OAuth client and secret rows.
    await controller.updateAccountCredentials("iamora-1", {
      appId: "wx-new-appid",
      appSecret: "new-secret",
    });
    expect(service.iam.oauth.resourceAccounts.update).toHaveBeenLastCalledWith("iamora-1", {
      providerAccountId: "wx-new-appid",
      providerClientSecret: "new-secret",
    });

    // Secret only: the untouched AppID is not part of the patch.
    await controller.updateAccountCredentials("iamora-1", { appSecret: "rotated-secret" });
    expect(service.iam.oauth.resourceAccounts.update).toHaveBeenLastCalledWith("iamora-1", {
      providerClientSecret: "rotated-secret",
    });

    // AppID only: the empty secret is omitted so the stored secret is kept.
    await controller.updateAccountCredentials("iamora-1", { appId: "wx-again" });
    expect(service.iam.oauth.resourceAccounts.update).toHaveBeenLastCalledWith("iamora-1", {
      providerAccountId: "wx-again",
    });
  });

  it("carries the official account type and original id on quick setup", async () => {
    const service = createOauthServiceMock();
    const controller = createSdkworkIamOauthAdminController({ service: service as never });

    await controller.createAccountSetup("official_account", {
      accountType: "subscription",
      appId: "wx-oa-2",
      appSecret: "secret-2",
      displayName: "My subscription account",
      enabled: true,
      originalId: "gh_abc123",
      redirectUri: "https://app.example.com/auth/oauth/callback",
    });

    expect(service.iam.oauth.resourceAccounts.create).toHaveBeenCalledWith(expect.objectContaining({
      providerAccountType: "subscription",
      providerAccountOriginalId: "gh_abc123",
    }));
  });

  it("updates the account profile and keeps the integration name in sync", async () => {
    const service = createOauthServiceMock();
    const controller = createSdkworkIamOauthAdminController({ service: service as never });

    await controller.updateAccountProfile("iamora-1", "iamoi-1", {
      accountType: "service",
      displayName: "Renamed account",
      originalId: "gh_renamed",
    });
    expect(service.iam.oauth.resourceAccounts.update).toHaveBeenCalledWith("iamora-1", {
      displayName: "Renamed account",
      providerAccountType: "service",
      providerAccountOriginalId: "gh_renamed",
    });
    expect(service.iam.oauth.integrations.update).toHaveBeenCalledWith("iamoi-1", {
      displayName: "Renamed account",
    });

    // Profile update without an integration only touches the account row.
    await controller.updateAccountProfile("iamora-1", "", {
      displayName: "No integration",
    });
    expect(service.iam.oauth.integrations.update).not.toHaveBeenCalledWith(
      "",
      expect.anything(),
    );

    // An explicit empty type/original id clears the stored profile fields.
    await controller.updateAccountProfile("iamora-1", "iamoi-1", {
      accountType: "",
      displayName: "Cleared profile",
      originalId: "",
    });
    expect(service.iam.oauth.resourceAccounts.update).toHaveBeenLastCalledWith("iamora-1", {
      displayName: "Cleared profile",
      providerAccountType: "",
      providerAccountOriginalId: "",
    });
  });

  it("deletes a resource account through resourceAccounts.delete", async () => {
    const service = createOauthServiceMock();
    const controller = createSdkworkIamOauthAdminController({ service: service as never });

    await controller.deleteResourceAccount("iamora-1");
    expect(service.iam.oauth.resourceAccounts.delete).toHaveBeenCalledWith("iamora-1");
  });

  it("generates the official account follow QR through resourceAccounts.followQrCodes.create", async () => {
    const service = createOauthServiceMock();
    const controller = createSdkworkIamOauthAdminController({ service: service as never });
    service.iam.oauth.resourceAccounts.followQrCodes.create = vi.fn().mockResolvedValue({
      expireSeconds: 0,
      permanent: true,
      qrCode: "https://mp.weixin.qq.com/cgi-bin/showqrcode?ticket=abc",
      qrContent: "https://mp.weixin.qq.com/cgi-bin/showqrcode?ticket=abc",
      qrMode: "official_account",
      scene: "follow:iamora-1",
      ticket: "abc",
    });

    const qr = await controller.createAccountFollowQrCode("iamora-1");

    expect(service.iam.oauth.resourceAccounts.followQrCodes.create).toHaveBeenCalledWith(
      "iamora-1",
      {},
    );
    expect(qr).toEqual({
      expireSeconds: 0,
      permanent: true,
      qrCode: "https://mp.weixin.qq.com/cgi-bin/showqrcode?ticket=abc",
      qrContent: "https://mp.weixin.qq.com/cgi-bin/showqrcode?ticket=abc",
      qrMode: "official_account",
      scene: "follow:iamora-1",
      ticket: "abc",
    });
  });

  it("surfaces follow QR generation failures on the controller state", async () => {
    const service = createOauthServiceMock();
    const controller = createSdkworkIamOauthAdminController({ service: service as never });
    service.iam.oauth.resourceAccounts.followQrCodes.create = vi
      .fn()
      .mockRejectedValue(new Error("WeChat QR create failed: 40001"));

    await expect(controller.createAccountFollowQrCode("iamora-1")).rejects.toThrow(
      "WeChat QR create failed: 40001",
    );
    expect(controller.getState().status).toBe("error");
    expect(controller.getState().lastError).toContain("40001");
  });

  it("creates a mini program account setup without a callback URL", async () => {
    const service = createOauthServiceMock();
    const controller = createSdkworkIamOauthAdminController({ service: service as never });

    await controller.createAccountSetup("mini_program", {
      appId: "wx-mini-001",
      appSecret: "secret-001",
      displayName: "My mini program",
      enabled: true,
      redirectUri: "",
    });

    // Mini programs sign in through jscode2session; the callback URL stays
    // optional and is forwarded as an empty value, never required.
    expect(service.iam.oauth.integrations.create).toHaveBeenCalledWith(
      expect.objectContaining({
        providerCode: "wechat_mini_program",
        redirectUri: "",
        surfaceKind: "mini_program",
      }),
    );
    expect(service.iam.oauth.resourceAccounts.create).toHaveBeenCalledWith(
      expect.objectContaining({
        resourceAccountKind: "mini_program",
        providerAccountId: "wx-mini-001",
      }),
    );
  });

  it("syncs the official account server config to the bound message-push webhook", async () => {
    const service = createOauthServiceMock();
    (service.iam.oauth.resourceAccounts.list as ReturnType<typeof vi.fn>).mockResolvedValue({
      items: [{
        id: "iamora-1",
        integrationId: "iamoi-1",
        providerCode: "wechat",
        resourceAccountKind: "official_account",
        displayName: "My official account",
        providerAccountId: "wx-oa-001",
        enabled: true,
      }],
    });
    const controller = createSdkworkIamOauthAdminController({ service: service as never });
    await controller.load(["resourceAccounts"]);

    // No webhook row yet -> create one bound to the account.
    await controller.updateAccountConfig("iamora-1", {
      notify: { url: "https://app.example.com/wechat/notify" },
    });
    expect(service.iam.oauth.webhookConfigs.create).toHaveBeenCalledWith({
      callbackUrl: "https://app.example.com/wechat/notify",
      displayName: "My official account",
      encodingAesKeyStatus: "missing",
      integrationId: "iamoi-1",
      providerCode: "wechat",
      resourceAccountId: "iamora-1",
      verificationTokenStatus: "missing",
      webhookCode: "oa-notify-iamora-1",
      webhookKind: "message_push",
    });

    // Token and AES key filled -> the push security fields count as
    // configured on the bound webhook.
    await controller.updateAccountConfig("iamora-1", {
      notify: { url: "https://app.example.com/wechat/notify", token: "t", encodingAesKey: "k" },
    });
    expect(service.iam.oauth.webhookConfigs.create).toHaveBeenLastCalledWith(
      expect.objectContaining({
        encodingAesKeyStatus: "configured",
        verificationTokenStatus: "configured",
      }),
    );

    // Existing row -> update its callback URL instead of creating another.
    (service.iam.oauth.webhookConfigs.list as ReturnType<typeof vi.fn>).mockResolvedValue({
      items: [{ id: "iamowh-1", resourceAccountId: "iamora-1" }],
    });
    await controller.updateAccountConfig("iamora-1", {
      notify: { url: "https://app.example.com/wechat/notify-v2" },
    });
    expect(service.iam.oauth.webhookConfigs.update).toHaveBeenCalledWith("iamowh-1", {
      callbackUrl: "https://app.example.com/wechat/notify-v2",
      encodingAesKeyStatus: "missing",
      verificationTokenStatus: "missing",
    });
    expect(service.iam.oauth.webhookConfigs.create).toHaveBeenCalledTimes(2);

    // Saving without a server URL never touches the webhook surface (the
    // three previous saves with a notify URL are the only list calls).
    await controller.updateAccountConfig("iamora-1", { webDomain: "app.example.com" });
    expect(service.iam.oauth.webhookConfigs.list).toHaveBeenCalledTimes(3);
  });

  it("refuses a duplicate account for an existing provider AppID", async () => {
    const service = createOauthServiceMock();
    (service.iam.oauth.resourceAccounts.list as ReturnType<typeof vi.fn>).mockResolvedValue({
      items: [{
        id: "iamora-existing",
        integrationId: "iamoi-1",
        providerCode: "wechat",
        resourceAccountKind: "official_account",
        displayName: "Existing account",
        providerAccountId: "wx-oa-001",
      }],
    });
    const controller = createSdkworkIamOauthAdminController({ service: service as never });

    await expect(controller.createAccountSetup("official_account", {
      appId: "wx-oa-001",
      appSecret: "secret-001",
      displayName: "Duplicate",
      enabled: true,
      redirectUri: "https://app.example.com/auth/oauth/callback",
    })).rejects.toThrow("An official account with AppID wx-oa-001 already exists");
    expect(service.iam.oauth.resourceAccounts.create).not.toHaveBeenCalled();
  });

  it("persists the scan-login default account flag through resourceAccounts.update", async () => {
    const service = createOauthServiceMock();
    const controller = createSdkworkIamOauthAdminController({ service: service as never });

    await controller.setResourceAccountQrLogin("iamora-1", true);
    expect(service.iam.oauth.resourceAccounts.update).toHaveBeenCalledWith("iamora-1", {
      enabled: true,
      qrDefaultEnabled: true,
    });

    // Disabling QR login must never re-enable a deliberately disabled account.
    await controller.setResourceAccountQrLogin("iamora-1", false);
    expect(service.iam.oauth.resourceAccounts.update).toHaveBeenLastCalledWith("iamora-1", {
      qrDefaultEnabled: false,
    });
  });

  it("edits an integration setup and only re-submits changed credentials", async () => {
    const service = createOauthServiceMock();
    const controller = createSdkworkIamOauthAdminController({ service: service as never });

    // Secret untouched -> only profile/callback/enabled fields are patched.
    await controller.updateIntegrationSetup("iamoi-1", {
      displayName: "WeChat login",
      enabled: true,
      integrationCode: "",
      providerClientId: "wx-oa-001",
      providerClientSecret: "",
      providerCode: "wechat",
      redirectUri: "https://app.example.com/auth/oauth/callback",
    });
    expect(service.iam.oauth.integrations.update).toHaveBeenLastCalledWith("iamoi-1", {
      displayName: "WeChat login",
      enabled: true,
      redirectUri: "https://app.example.com/auth/oauth/callback",
      providerClientId: "wx-oa-001",
    });

    // Rotated secret is forwarded for the backend credential cascade.
    await controller.updateIntegrationSetup("iamoi-1", {
      displayName: "WeChat login",
      enabled: true,
      integrationCode: "",
      providerClientId: "wx-oa-001",
      providerClientSecret: "rotated-secret",
      providerCode: "wechat",
      redirectUri: "https://app.example.com/auth/oauth/callback",
    });
    expect(service.iam.oauth.integrations.update).toHaveBeenLastCalledWith("iamoi-1", {
      displayName: "WeChat login",
      enabled: true,
      redirectUri: "https://app.example.com/auth/oauth/callback",
      providerClientId: "wx-oa-001",
      providerClientSecret: "rotated-secret",
    });
  });

  it("deletes and edits webhook configs through the backend service", async () => {
    const service = createOauthServiceMock();
    const controller = createSdkworkIamOauthAdminController({ service: service as never });

    await controller.deleteWebhookConfig("iamowh-1");
    expect(service.iam.oauth.webhookConfigs.delete).toHaveBeenCalledWith("iamowh-1");

    await controller.updateWebhookConfigSetup("iamowh-1", {
      callbackUrl: "https://app.example.com/wechat/notify-v2",
      resourceAccountId: "iamora-1",
    });
    expect(service.iam.oauth.webhookConfigs.update).toHaveBeenCalledWith("iamowh-1", {
      callbackUrl: "https://app.example.com/wechat/notify-v2",
      resourceAccountId: "iamora-1",
    });

    // Creating a webhook forwards the optional account binding.
    await controller.createWebhookConfig({
      callbackUrl: "https://app.example.com/wechat/notify",
      displayName: "Message push",
      integrationId: "iamoi-1",
      providerCode: "wechat",
      resourceAccountId: "iamora-1",
      webhookCode: "oa-notify-iamora-1",
      webhookKind: "message_push",
    });
    expect(service.iam.oauth.webhookConfigs.create).toHaveBeenCalledWith({
      callbackUrl: "https://app.example.com/wechat/notify",
      displayName: "Message push",
      integrationId: "iamoi-1",
      providerCode: "wechat",
      resourceAccountId: "iamora-1",
      webhookCode: "oa-notify-iamora-1",
      webhookKind: "message_push",
    });
  });
});
