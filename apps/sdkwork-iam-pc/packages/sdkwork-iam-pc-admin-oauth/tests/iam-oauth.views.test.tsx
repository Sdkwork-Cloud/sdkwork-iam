import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { SdkworkIamOauthAdminSettings } from "../src/pages/OauthAdminSettings";
import type {
  SdkworkIamOauthAdminController,
  SdkworkIamOauthAdminState,
  SdkworkIamOauthAdminView,
} from "../src/types/oauth-admin-types";

const EMPTY_STATE: SdkworkIamOauthAdminState = {
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

function renderView(view: SdkworkIamOauthAdminView): string {
  return renderToStaticMarkup(
    <SdkworkIamOauthAdminSettings
      controller={controller}
      description="Focused OAuth administration"
      title="Focused view"
      view={view}
    />,
  );
}

describe("SDKWork IAM OAuth focused admin views", () => {
  it("separates provider, application, and login configuration workflows", () => {
    const providers = renderView("providers");
    expect(providers).toContain("Focused view");
    expect(providers).toContain("Provider catalog");
    expect(providers).not.toContain("OAuth clients");

    const applications = renderView("applications");
    expect(applications).toContain("SDKWork OAuth relying party");
    expect(applications).toContain("OAuth clients");
    expect(applications).toContain("OAuth secrets");
    expect(applications).not.toContain("Provider catalog");

    const loginConfiguration = renderView("login-configuration");
    for (const title of ["Scope profiles", "Claim mappings", "Flow configs", "OAuth surfaces"]) {
      expect(loginConfiguration).toContain(title);
    }
    expect(loginConfiguration).not.toContain("OAuth secrets");
    expect(loginConfiguration).not.toContain("Webhook configs");
  });

  it("separates governance, authorization, resources, and operations", () => {
    const governance = renderView("governance");
    expect(governance).toContain("OAuth policies");
    expect(governance).toContain("Tenant bindings");
    expect(governance).not.toContain("Operator platforms");

    const authorizations = renderView("authorizations");
    expect(authorizations).toContain("OAuth account links");
    expect(authorizations).toContain("OAuth grants");
    expect(authorizations).not.toContain("Tenant bindings");

    const resources = renderView("resources");
    expect(resources).toContain("Operator platforms");
    expect(resources).toContain("OAuth resource accounts");
    expect(resources).toContain("OAuth operational resources");
    expect(resources).not.toContain("OAuth policies");

    const activity = renderView("activity");
    expect(activity).toContain("Webhook configs");
    expect(activity).toContain("Diagnostic runs");
    expect(activity).toContain("OAuth callback events");
    expect(activity).not.toContain("OAuth grants");
  });
});
