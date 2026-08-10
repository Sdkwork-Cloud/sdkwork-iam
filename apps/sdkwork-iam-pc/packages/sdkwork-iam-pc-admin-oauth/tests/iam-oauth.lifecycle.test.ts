import { describe, expect, it } from "vitest";

import { createSdkworkIamOauthAdminController } from "../src/services/oauth-admin-controller";

/**
 * Stateful in-memory IAM OAuth backend that mirrors the real backend's
 * observable behaviour for the quick-setup surface:
 * - `integrations.create` provisions a client + secret (echoed back as
 *   `providerClientSecret` on account rows, like the read enrichment);
 * - `resourceAccounts.create/list/update` round-trip every profile column
 *   (AppID, type, original id, config JSON, enabled);
 * - `webhookConfigs` rows bind to a `resourceAccountId`.
 *
 * Used to prove the full create -> list -> edit -> save -> re-edit lifecycle
 * keeps the complete account record visible to the operator.
 */
function createStatefulOauthBackend() {
  const integrations = new Map<string, Record<string, unknown>>();
  const accounts = new Map<string, Record<string, unknown>>();
  const webhooks: Array<Record<string, unknown>> = [];
  const secretsByIntegration = new Map<string, string>();
  let integrationSeq = 1;
  let accountSeq = 1;
  let webhookSeq = 1;

  const listAccounts = async (query?: Record<string, unknown>) => {
    let rows = [...accounts.values()];
    const q = typeof query?.q === "string" ? query.q.trim().toLowerCase() : "";
    if (q) {
      rows = rows.filter((row) =>
        String(row.providerAccountId ?? "").toLowerCase().includes(q)
        || String(row.providerAccountOriginalId ?? "").toLowerCase().includes(q)
        || String(row.displayName ?? "").toLowerCase().includes(q));
    }
    return { items: rows.map((row) => ({ ...row })) };
  };

  const accountRow = (body: Record<string, unknown>): Record<string, unknown> => {
    const config = body.config && typeof body.config === "object"
      ? { ...(body.config as Record<string, unknown>) }
      : {};
    return {
      id: `iamora-${accountSeq++}`,
      integrationId: body.integrationId,
      providerCode: body.providerCode,
      resourceAccountCode: body.resourceAccountCode,
      resourceAccountKind: body.resourceAccountKind,
      displayName: body.displayName,
      providerAccountId: body.providerAccountId,
      ...(body.providerAccountType ? { providerAccountType: body.providerAccountType } : {}),
      ...(body.providerAccountOriginalId ? { providerAccountOriginalId: body.providerAccountOriginalId } : {}),
      providerConfigJson: JSON.stringify(config),
      enabled: body.enabled ?? true,
      authorizationStatus: "pending",
      // The read enrichment echoes the linked client secret back on rows.
      providerClientSecret: secretsByIntegration.get(String(body.integrationId)),
    };
  };

  return {
    secretsByIntegration,
    webhooks,
    service: {
      iam: {
        oauth: {
          integrations: {
            list: async () => ({ items: [...integrations.values()].map((row) => ({ ...row })) }),
            create: async (body: Record<string, unknown>) => {
              const row = {
                id: `iamoi-${integrationSeq++}`,
                integrationCode: body.integrationCode,
                providerCode: body.providerCode,
                providerClientId: body.providerClientId,
                displayName: body.displayName,
                enabled: body.enabled ?? true,
                ...(body.redirectUri ? { redirectUri: body.redirectUri } : {}),
              };
              integrations.set(String(row.id), row);
              if (typeof body.providerClientSecret === "string") {
                secretsByIntegration.set(String(row.id), body.providerClientSecret);
              }
              return { ...row };
            },
            update: async (id: string, patch: Record<string, unknown>) => {
              const row = integrations.get(id);
              if (row) {
                Object.assign(row, patch);
              }
              return { ...(row ?? { id }) };
            },
            delete: async () => undefined,
            retrieve: async (id: string) => ({ ...(integrations.get(id) ?? { id }) }),
          },
          resourceAccounts: {
            list: listAccounts,
            create: async (body: Record<string, unknown>) => {
              const row = accountRow(body);
              accounts.set(String(row.id), row);
              return { ...row };
            },
            update: async (id: string, patch: Record<string, unknown>) => {
              const row = accounts.get(id);
              if (!row) {
                return { id };
              }
              if (patch.config && typeof patch.config === "object") {
                row.providerConfigJson = JSON.stringify(patch.config);
              }
              if (patch.providerAccountId !== undefined) {
                row.providerAccountId = patch.providerAccountId;
              }
              if (patch.providerAccountType !== undefined) {
                if (patch.providerAccountType === "") {
                  delete row.providerAccountType;
                } else {
                  row.providerAccountType = patch.providerAccountType;
                }
              }
              if (patch.providerAccountOriginalId !== undefined) {
                if (patch.providerAccountOriginalId === "") {
                  delete row.providerAccountOriginalId;
                } else {
                  row.providerAccountOriginalId = patch.providerAccountOriginalId;
                }
              }
              if (patch.providerClientSecret !== undefined) {
                secretsByIntegration.set(String(row.integrationId), String(patch.providerClientSecret));
                row.providerClientSecret = patch.providerClientSecret;
              }
              if (patch.enabled !== undefined) {
                row.enabled = patch.enabled;
              }
              if (patch.qrDefaultEnabled !== undefined) {
                row.qrDefaultEnabled = patch.qrDefaultEnabled;
              }
              if (patch.displayName !== undefined) {
                row.displayName = patch.displayName;
              }
              return { ...row };
            },
            delete: async (id: string) => {
              accounts.delete(id);
              return undefined;
            },
            verifications: { create: async () => ({}) },
            authorizationRefreshes: { create: async () => ({}) },
            miniProgramLoginChecks: { create: async () => ({}) },
            followQrCodes: {
              create: async () => ({
                expireSeconds: 0,
                permanent: true,
                qrCode: "https://mp.weixin.qq.com/cgi-bin/showqrcode?ticket=t",
                qrContent: "https://mp.weixin.qq.com/cgi-bin/showqrcode?ticket=t",
                qrMode: "official_account",
                scene: "follow:iamora-1",
                ticket: "t",
              }),
            },
          },
          webhookConfigs: {
            list: async () => ({ items: webhooks.map((row) => ({ ...row })) }),
            create: async (body: Record<string, unknown>) => {
              const row = {
                id: `iamowh-${webhookSeq++}`,
                ...body,
              };
              webhooks.push(row);
              return { ...row };
            },
            update: async (id: string, patch: Record<string, unknown>) => {
              const row = webhooks.find((item) => item.id === id);
              if (row) {
                Object.assign(row, patch);
              }
              return { ...(row ?? { id }) };
            },
          },
          // Unused by the quick-setup lifecycle but present so resource
          // sessions created by `controller.load` never hit a missing key.
          accountLinks: { list: async () => ({ items: [] }), update: async () => ({}) },
          callbackEvents: { list: async () => ({ items: [] }) },
          claimMappings: { list: async () => ({ items: [] }), create: async () => ({}), update: async () => ({}) },
          clients: { list: async () => ({ items: [] }), create: async () => ({}), update: async () => ({}), delete: async () => ({}), retrieve: async () => ({}) },
          diagnosticRuns: { list: async () => ({ items: [] }), create: async () => ({}), retrieve: async () => ({}) },
          flowConfigs: { list: async () => ({ items: [] }), create: async () => ({}), update: async () => ({}) },
          grants: { list: async () => ({ items: [] }), delete: async () => ({}) },
          operationalResources: { list: async () => ({ items: [] }), create: async () => ({}), update: async () => ({}), delete: async () => ({}), publishes: { create: async () => ({}) } },
          operatorPlatforms: { list: async () => ({ items: [] }), create: async () => ({}), update: async () => ({}), preAuthorizations: { create: async () => ({}) } },
          policies: { list: async () => ({ items: [] }), create: async () => ({}), update: async () => ({}) },
          providerCatalog: { list: async () => ({ items: [] }), create: async () => ({}), update: async () => ({}), retrieve: async () => ({}) },
          resourceAuthorizations: { list: async () => ({ items: [] }), create: async () => ({}), update: async () => ({}) },
          scopeProfiles: { list: async () => ({ items: [] }), create: async () => ({}), update: async () => ({}) },
          scanLoginPreviews: { create: async () => ({}) },
          scanLoginSettings: { retrieve: async () => ({}), update: async () => ({}) },
          secrets: { list: async () => ({ items: [] }), create: async () => ({}), delete: async () => ({}) },
          surfaces: { list: async () => ({ items: [] }), create: async () => ({}), update: async () => ({}), delete: async () => ({}) },
          tenantBindings: { list: async () => ({ items: [] }), create: async () => ({}), update: async () => ({}) },
        },
        tenantApplications: {
          retrieve: async () => ({ runtimeConfig: {} }),
          update: async () => ({}),
        },
      },
    },
  };
}

describe("SDKWork IAM OAuth account lifecycle (create -> list -> edit -> save)", () => {
  it("round-trips the complete official account record and only rotates a changed secret", async () => {
    const backend = createStatefulOauthBackend();
    const controller = createSdkworkIamOauthAdminController(backend.service as never);

    // 1. Create an official account with every profile field filled.
    await controller.createAccountSetup("official_account", {
      accountType: "subscription",
      appId: "wx-oa-001",
      appSecret: "oa-secret-1",
      displayName: "My subscription account",
      enabled: true,
      originalId: "gh_abc123",
      redirectUri: "https://app.example.com/auth/oauth/callback",
      config: {
        webDomain: "app.example.com",
        logoUrl: "data:image/png;base64,AAAA",
        notify: { url: "https://app.example.com/wechat/notify" },
      },
    });

    // 2. The list row echoes the complete record — the edit drawer reads
    //    exactly this row, so every field is visible when editing.
    await controller.load(["resourceAccounts"]);
    const row = controller.getState().resourceAccounts[0];
    expect(row).toMatchObject({
      displayName: "My subscription account",
      enabled: true,
      providerAccountId: "wx-oa-001",
      providerAccountOriginalId: "gh_abc123",
      providerAccountType: "subscription",
      providerClientSecret: "oa-secret-1",
      resourceAccountKind: "official_account",
    });
    expect(JSON.parse(String(row.providerConfigJson))).toMatchObject({
      logoUrl: "data:image/png;base64,AAAA",
      notify: { url: "https://app.example.com/wechat/notify" },
      redirectUri: "https://app.example.com/auth/oauth/callback",
      webDomain: "app.example.com",
    });

    // 3. Saving the developer config without touching the secret never
    //    rotates it, and the webhook row binds to the account.
    await controller.updateAccountConfig("iamora-1", {
      webDomain: "app.example.com",
      redirectUri: "https://app.example.com/auth/oauth/callback",
      logoUrl: "data:image/png;base64,AAAA",
      notify: { url: "https://app.example.com/wechat/notify" },
    });
    expect(backend.secretsByIntegration.get("iamoi-1")).toBe("oa-secret-1");
    expect(backend.webhooks).toHaveLength(1);
    expect(backend.webhooks[0]).toMatchObject({
      callbackUrl: "https://app.example.com/wechat/notify",
      resourceAccountId: "iamora-1",
    });

    // 4. Rotating the secret persists and the next read echoes the new value.
    await controller.updateAccountCredentials("iamora-1", { appSecret: "oa-secret-2" });
    expect(backend.secretsByIntegration.get("iamoi-1")).toBe("oa-secret-2");
    await controller.load(["resourceAccounts"]);
    expect(controller.getState().resourceAccounts[0].providerClientSecret).toBe("oa-secret-2");

    // 5. Clearing the original id persists (the explicit empty value wins).
    await controller.updateAccountProfile("iamora-1", "iamoi-1", {
      accountType: "subscription",
      displayName: "My subscription account",
      originalId: "",
    });
    await controller.load(["resourceAccounts"]);
    expect(controller.getState().resourceAccounts[0].providerAccountOriginalId).toBeUndefined();
  });

  it("round-trips the complete mini program record without a callback URL", async () => {
    const backend = createStatefulOauthBackend();
    const controller = createSdkworkIamOauthAdminController(backend.service as never);

    // 1. Create a mini program account — the callback URL stays optional.
    await controller.createAccountSetup("mini_program", {
      accountType: "enterprise",
      appId: "wx-mini-001",
      appSecret: "mini-secret-1",
      displayName: "My mini program",
      enabled: true,
      originalId: "gh_mini_001",
      redirectUri: "",
      config: {
        domains: {
          request: ["https://api.example.com"],
          downloadFile: ["https://dl.example.com"],
        },
      },
    });

    // 2. The complete record is visible on the list row (edit source).
    await controller.load(["resourceAccounts"]);
    const row = controller.getState().resourceAccounts[0];
    expect(row).toMatchObject({
      displayName: "My mini program",
      enabled: true,
      providerAccountId: "wx-mini-001",
      providerAccountOriginalId: "gh_mini_001",
      providerAccountType: "enterprise",
      providerClientSecret: "mini-secret-1",
      resourceAccountKind: "mini_program",
    });
    expect(JSON.parse(String(row.providerConfigJson))).toMatchObject({
      domains: {
        request: ["https://api.example.com"],
        downloadFile: ["https://dl.example.com"],
      },
    });

    // 3. Saving mini program developer config (no notify) touches no webhooks.
    await controller.updateAccountConfig("iamora-1", {
      domains: {
        request: ["https://api.example.com"],
        downloadFile: ["https://dl.example.com"],
        socket: ["https://socket.example.com"],
      },
    });
    expect(backend.webhooks).toHaveLength(0);
    expect(backend.secretsByIntegration.get("iamoi-1")).toBe("mini-secret-1");

    // 4. Rotating the mini program secret echoes back on the next read.
    await controller.updateAccountCredentials("iamora-1", { appSecret: "mini-secret-2" });
    await controller.load(["resourceAccounts"]);
    expect(controller.getState().resourceAccounts[0].providerClientSecret).toBe("mini-secret-2");
  });
});
