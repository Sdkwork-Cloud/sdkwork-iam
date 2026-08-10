import { vi } from "vitest";

/**
 * Shared IAM oauth backend service mock for controller and page tests.
 * Mirrors the `SdkworkIamService.iam.oauth.*` and
 * `tenantApplications.retrieve/update` port surface used by the admin
 * controller; individual tests override resolved values per case.
 */
export function createOauthServiceMock() {
  return {
    iam: {
      oauth: {
        integrations: {
          list: vi.fn().mockResolvedValue({ items: [] }),
          create: vi.fn().mockResolvedValue({ id: "iamoi-1" }),
          update: vi.fn().mockResolvedValue({ id: "iamoi-1" }),
          delete: vi.fn().mockResolvedValue({ id: "iamoi-1" }),
          retrieve: vi.fn().mockResolvedValue({ id: "iamoi-1" }),
        },
        providerCatalog: {
          list: vi.fn().mockResolvedValue({ items: [] }),
          create: vi.fn().mockResolvedValue({ id: "iamopc-1" }),
          update: vi.fn().mockResolvedValue({ id: "iamopc-1" }),
          retrieve: vi.fn().mockResolvedValue({ id: "iamopc-1", providerCode: "sdkwork" }),
        },
        clients: {
          list: vi.fn().mockResolvedValue({ items: [] }),
          create: vi.fn().mockResolvedValue({ id: "iamoc-1" }),
          update: vi.fn().mockResolvedValue({ id: "iamoc-1" }),
          delete: vi.fn().mockResolvedValue({ id: "iamoc-1" }),
          retrieve: vi.fn().mockResolvedValue({ id: "iamoc-1" }),
        },
        secrets: { list: vi.fn().mockResolvedValue({ items: [] }), create: vi.fn(), delete: vi.fn() },
        scopeProfiles: { list: vi.fn().mockResolvedValue({ items: [] }), create: vi.fn(), update: vi.fn() },
        claimMappings: { list: vi.fn().mockResolvedValue({ items: [] }), create: vi.fn(), update: vi.fn() },
        webhookConfigs: {
          list: vi.fn().mockResolvedValue({ items: [] }),
          create: vi.fn(),
          update: vi.fn(),
          verifications: { create: vi.fn() },
        },
        flowConfigs: { list: vi.fn().mockResolvedValue({ items: [] }), create: vi.fn(), update: vi.fn() },
        surfaces: { list: vi.fn().mockResolvedValue({ items: [] }), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
        policies: { list: vi.fn().mockResolvedValue({ items: [] }), create: vi.fn(), update: vi.fn() },
        tenantBindings: { list: vi.fn().mockResolvedValue({ items: [] }), create: vi.fn(), update: vi.fn() },
        operatorPlatforms: {
          list: vi.fn().mockResolvedValue({ items: [] }),
          create: vi.fn(),
          update: vi.fn(),
          preAuthorizations: { create: vi.fn() },
        },
        diagnosticRuns: {
          list: vi.fn().mockResolvedValue({ items: [] }),
          create: vi.fn(),
          retrieve: vi.fn().mockResolvedValue({ id: "iamodr-1", resultCode: "ok" }),
        },
        resourceAccounts: {
          list: vi.fn().mockResolvedValue({ items: [] }),
          create: vi.fn().mockResolvedValue({ id: "iamora-1" }),
          update: vi.fn().mockResolvedValue({ id: "iamora-1" }),
          delete: vi.fn().mockResolvedValue(undefined),
          verifications: { create: vi.fn() },
          authorizationRefreshes: { create: vi.fn() },
          miniProgramLoginChecks: { create: vi.fn() },
          followQrCodes: { create: vi.fn() },
        },
        resourceAuthorizations: { list: vi.fn().mockResolvedValue({ items: [] }), create: vi.fn(), update: vi.fn() },
        operationalResources: {
          list: vi.fn().mockResolvedValue({ items: [] }),
          create: vi.fn(),
          update: vi.fn(),
          delete: vi.fn(),
          publishes: { create: vi.fn() },
        },
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
