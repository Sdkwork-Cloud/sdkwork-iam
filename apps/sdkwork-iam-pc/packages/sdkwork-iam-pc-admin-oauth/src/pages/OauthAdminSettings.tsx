
import type {
  SdkworkIamOauthAdminSettingsProps,
} from "../types/oauth-admin-types";
import { OauthAllAdminSections } from "./OauthAllAdminSections";
import {
  OauthApplicationsAdminPage,
  OauthInboundAdminPage,
  OauthLoginConfigurationAdminPage,
  OauthProvidersAdminPage,
} from "./oauth-inbound-pages";
import {
  OauthAuthorizationsAdminPage,
  OauthProviderAdminPage,
} from "./oauth-provider-pages";
import {
  OauthExtendedAdminPage,
  OauthGovernanceAdminPage,
  OauthResourcesAdminPage,
} from "./oauth-extended-pages";
import {
  OauthActivityAdminPage,
  OauthAuditAdminPage,
} from "./oauth-audit-pages";

/**
 * IAM OAuth admin settings surface.
 *
 * - With `view`, renders the focused section group for that workflow.
 * - With `tab`, renders the section group for that administration tab.
 * - With neither, renders the complete OAuth administration surface
 *   (backward-compatible with the original all-sections layout).
 */
export function SdkworkIamOauthAdminSettings({
  controller,
  tab,
  view,
}: SdkworkIamOauthAdminSettingsProps) {
  const props = { controller };
  if (view === "providers") {
    return <OauthProvidersAdminPage {...props} />;
  }
  if (view === "applications") {
    return <OauthApplicationsAdminPage {...props} />;
  }
  if (view === "login-configuration") {
    return <OauthLoginConfigurationAdminPage {...props} />;
  }
  if (view === "governance") {
    return <OauthGovernanceAdminPage {...props} />;
  }
  if (view === "authorizations") {
    return <OauthAuthorizationsAdminPage {...props} />;
  }
  if (view === "resources") {
    return <OauthResourcesAdminPage {...props} />;
  }
  if (view === "activity") {
    return <OauthActivityAdminPage {...props} />;
  }
  if (tab === "provider") {
    return <OauthProviderAdminPage {...props} />;
  }
  if (tab === "extended") {
    return <OauthExtendedAdminPage {...props} />;
  }
  if (tab === "audit") {
    return <OauthAuditAdminPage {...props} />;
  }
  if (tab === "inbound") {
    return <OauthInboundAdminPage {...props} />;
  }
  return <OauthAllAdminSections {...props} />;
}


