import { describe, expect, it, vi } from "vitest";

import { createSdkworkIamOauthAdminController } from "../src/services/oauth-admin-controller";

function createOauthServiceMock() {
  return {
    iam: {
      oauth: {
        integrations: { list: vi.fn().mockResolvedValue({ items: [] }), create: vi.fn(), update: vi.fn(), delete: vi.fn(), retrieve: vi.fn().mockResolvedValue({ id: "iamoi-1" }) },
        providerCatalog: { list: vi.fn().mockResolvedValue({ items: [] }), create: vi.fn(), update: vi.fn(), retrieve: vi.fn().mockResolvedValue({ id: "iamopc-1", providerCode: "sdkwork" }) },
        clients: { list: vi.fn().mockResolvedValue({ items: [] }), create: vi.fn(), update: vi.fn(), delete: vi.fn(), retrieve: vi.fn().mockResolvedValue({ id: "iamoc-1" }) },
        secrets: { list: vi.fn().mockResolvedValue({ items: [] }), create: vi.fn(), delete: vi.fn() },
        scopeProfiles: { list: vi.fn().mockResolvedValue({ items: [] }), create: vi.fn(), update: vi.fn() },
        claimMappings: { list: vi.fn().mockResolvedValue({ items: [] }), create: vi.fn(), update: vi.fn() },
        webhookConfigs: { list: vi.fn().mockResolvedValue({ items: [] }), create: vi.fn(), update: vi.fn(), verifications: { create: vi.fn() } },
        flowConfigs: { list: vi.fn().mockResolvedValue({ items: [] }), create: vi.fn(), update: vi.fn() },
        surfaces: { list: vi.fn().mockResolvedValue({ items: [] }), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
        policies: { list: vi.fn().mockResolvedValue({ items: [] }), create: vi.fn(), update: vi.fn() },
        tenantBindings: { list: vi.fn().mockResolvedValue({ items: [] }), create: vi.fn(), update: vi.fn() },
        operatorPlatforms: { list: vi.fn().mockResolvedValue({ items: [] }), create: vi.fn(), update: vi.fn(), preAuthorizations: { create: vi.fn() } },
        diagnosticRuns: { list: vi.fn().mockResolvedValue({ items: [] }), create: vi.fn(), retrieve: vi.fn().mockResolvedValue({ id: "iamodr-1", resultCode: "ok" }) },
        resourceAccounts: { list: vi.fn().mockResolvedValue({ items: [] }), create: vi.fn(), update: vi.fn(), verifications: { create: vi.fn() }, authorizationRefreshes: { create: vi.fn() }, miniProgramLoginChecks: { create: vi.fn() } },
        resourceAuthorizations: { list: vi.fn().mockResolvedValue({ items: [] }), create: vi.fn(), update: vi.fn() },
        operationalResources: { list: vi.fn().mockResolvedValue({ items: [] }), create: vi.fn(), update: vi.fn(), delete: vi.fn(), publishes: { create: vi.fn() } },
        accountLinks: { list: vi.fn().mockResolvedValue({ items: [] }), update: vi.fn() },
        grants: { list: vi.fn().mockResolvedValue({ items: [] }), delete: vi.fn() },
        callbackEvents: { list: vi.fn().mockResolvedValue({ items: [] }) },
      },
      tenantApplications: {
        retrieve: vi.fn().mockResolvedValue({
          tenantApplicationId: "iamta-1",
          tenantId: "iamt-1",
          appId: "iam-app-1",
          runtimeConfig: {
            oauth: {
              relyingParty: {
                enabled: true,
                redirectUris: ["https://forum.example.com/callback"],
                allowedScopes: ["openid", "profile"],
                confidential: true,
                clientSecretHash: "[redacted]",
              },
            },
          },
        }),
        update: vi.fn().mockResolvedValue({}),
      },
    },
  };
}

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
});
