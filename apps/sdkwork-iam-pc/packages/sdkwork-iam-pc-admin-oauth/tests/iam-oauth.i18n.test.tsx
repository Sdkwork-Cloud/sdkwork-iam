import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { assertSdkworkCatalogLocaleParity } from "@sdkwork/i18n-pc-react";

import { SDKWORK_IAM_OAUTH_ADMIN_I18N_CATALOG } from "../src/i18n";
import { SdkworkIamOauthAdminWorkspace } from "../src/pages/OauthAdminWorkspace";
import type { SdkworkIamOauthAdminController } from "../src/types/oauth-admin-types";

const EMPTY_STATE = {
  accountLinks: [],
  callbackEvents: [],
  claimMappings: [],
  clients: [],
  diagnosticRuns: [],
  flowConfigs: [],
  grants: [],
  integrations: [],
  operationalResources: [],
  operatorPlatforms: [],
  policies: [],
  providerCatalog: [],
  resourceAccounts: [],
  resourceAuthorizations: [],
  scopeProfiles: [],
  secrets: [],
  status: "ready",
  surfaces: [],
  tenantBindings: [],
  webhookConfigs: [],
};

const controller = {
  getState: () => EMPTY_STATE,
} as SdkworkIamOauthAdminController;

describe("SDKWork IAM OAuth admin i18n contract", () => {
  it("exports a complete IAM OAuth admin namespace catalog", () => {
    expect(SDKWORK_IAM_OAUTH_ADMIN_I18N_CATALOG.namespace).toBe("iam.oauth.admin");
    expect(SDKWORK_IAM_OAUTH_ADMIN_I18N_CATALOG.defaultLocale).toBe("en-US");
  });

  it("keeps en-US and zh-CN message keys in parity", () => {
    expect(() => assertSdkworkCatalogLocaleParity(SDKWORK_IAM_OAUTH_ADMIN_I18N_CATALOG)).not.toThrow();
  });

  it("resolves locale-specific copy", () => {
    const en = SDKWORK_IAM_OAUTH_ADMIN_I18N_CATALOG.resolveMessages("en-US");
    const zh = SDKWORK_IAM_OAUTH_ADMIN_I18N_CATALOG.resolveMessages("zh-CN");
    expect(en.integrations.saveButton).toBe("Save connection");
    expect(zh.integrations.saveButton).toBe("保存连接");
    expect(en.tabs.inbound.label).toBe("Inbound IdP");
    expect(zh.tabs.inbound.label).toBe("入站 IdP");
  });

  it("falls back to the default locale without an i18n provider", () => {
    const html = renderToStaticMarkup(
      <SdkworkIamOauthAdminWorkspace controller={controller} />,
    );
    expect(html).toContain("Inbound IdP");
    expect(html).toContain("OAuth integrations");
    expect(html).toContain("Add provider connection");
  });
});
