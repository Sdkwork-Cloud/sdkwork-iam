import { describe, expect, it } from "vitest";

import * as userCenterCore from "../src/index.ts";

function requireExport<T>(name: string): T {
  return (userCenterCore as Record<string, unknown>)[name] as T;
}

describe("user-center seed contract catalog", () => {
  it("publishes governed seed domains without default login credential fields", () => {
    const createUserCenterSeedContractCatalog = requireExport<
      (() => {
        authority: {
          domains: string[];
          exportable: boolean;
          fields: Array<{ name: string; required: boolean; secret?: boolean }>;
          idempotent: boolean;
          inspectable: boolean;
          replaySafe: boolean;
        };
        authDevelopment: {
          domains: string[];
          exportable: boolean;
          fields: Array<{ name: string; required: boolean; secret?: boolean }>;
          idempotent: boolean;
          inspectable: boolean;
          replaySafe: boolean;
        };
        catalog: {
          domains: string[];
          exportable: boolean;
          fields: Array<{ name: string; required: boolean; secret?: boolean }>;
          idempotent: boolean;
          inspectable: boolean;
          replaySafe: boolean;
        };
        workspace: {
          domains: string[];
          exportable: boolean;
          fields: Array<{ name: string; required: boolean; secret?: boolean }>;
          idempotent: boolean;
          inspectable: boolean;
          replaySafe: boolean;
        };
      })
      | undefined
    >("createUserCenterSeedContractCatalog");

    expect(createUserCenterSeedContractCatalog).toBeTypeOf("function");

    const catalog = createUserCenterSeedContractCatalog?.();
    expect(catalog).toBeDefined();

    expect(catalog?.authority).toMatchObject({
      domains: ["sqlite", "postgresql", "upstream-bridge"],
      exportable: true,
      idempotent: true,
      inspectable: true,
      replaySafe: true,
    });
    expect(catalog?.authDevelopment).toMatchObject({
      domains: ["sqlite", "postgresql", "upstream-bridge"],
      exportable: true,
      idempotent: true,
      inspectable: true,
      replaySafe: true,
    });
    expect(catalog?.catalog).toMatchObject({
      domains: ["sqlite", "postgresql", "upstream-bridge"],
      exportable: true,
      idempotent: true,
      inspectable: true,
      replaySafe: true,
    });
    expect(catalog?.workspace).toMatchObject({
      domains: ["sqlite", "postgresql", "upstream-bridge"],
      exportable: true,
      idempotent: true,
      inspectable: true,
      replaySafe: true,
    });

    expect(catalog?.authority.fields.map((field) => field.name)).toEqual([
      "tenantRecords",
      "userRecords",
      "profileRecords",
      "providerMetadataRecords",
      "oauthProviderMetadata",
    ]);
    expect(catalog?.authDevelopment.fields).toEqual([
      { name: "explicitPrefillAccount", required: false },
      { name: "explicitPrefillEmail", required: false },
      { name: "explicitPrefillPhone", required: false },
      { name: "explicitPrefillPassword", required: false, secret: true },
      { name: "explicitPrefillLoginMethod", required: false },
    ]);
    expect(catalog?.catalog.fields.map((field) => field.name)).toEqual([
      "skillCatalogRecords",
      "templateCatalogRecords",
      "modelCatalogRecords",
      "providerCatalogRecords",
    ]);
    expect(catalog?.workspace.fields.map((field) => field.name)).toEqual([
      "workspaceRecords",
      "projectRecords",
      "runtimeConfigurationRecords",
      "policyRecords",
    ]);
    const serialized = JSON.stringify(catalog);
    expect(serialized).not.toMatch(/default|starter|builtin-local/i);
  });
});
