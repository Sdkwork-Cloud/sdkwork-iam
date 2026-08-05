import type { SdkworkIamAccountBindingAdminMessages } from "../../../../types/account-binding-admin-messages";

export const sdkworkIamAccountBindingAdminMessages: SdkworkIamAccountBindingAdminMessages = {
  common: {
    loadError: "The account binding policy could not be loaded.",
    saveError: "The account binding policy could not be saved.",
    savePolicy: "Save policy",
  },
  contactBinding: {
    allowEmailBinding: "Allow email binding",
    allowEmailChange: "Allow email change",
    allowEmailUnbind: "Allow email unbind",
    allowPhoneBinding: "Allow phone binding",
    allowPhoneChange: "Allow phone change",
    allowPhoneUnbind: "Allow phone unbind",
    description: "Control whether end users can bind or unbind email and phone identities.",
    enableContactBinding: "Enable contact binding",
    requireVerification: "Require verification code for bind/change",
    title: "Contact binding",
  },
  oauthBinding: {
    allowSelfServiceLink: "Allow self-service OAuth link",
    allowSelfServiceUnlink: "Allow self-service OAuth unlink",
    allowedProvidersLabel: "Allowed provider codes",
    allowedProvidersPlaceholder: "github, wechat, google",
    description: "OAuth linking uses provider authorization flows. Users can list linked accounts when OAuth binding is enabled.",
    enableOauthBinding: "Enable OAuth account binding",
    title: "OAuth binding",
  },
  oauthLogin: {
    allowAutoRegistration: "Allow auto registration for new OAuth users",
    allowedProvidersLabel: "Allowed login provider codes",
    allowedProvidersPlaceholder: "wechat, google, twitter (empty = all configured providers)",
    description: "OAuth login exposes third-party sign-in buttons on the auth page. Providers must also be configured in IAM OAuth integrations or local OAuth env.",
    enableOauthLogin: "Enable OAuth login",
    title: "OAuth login",
  },
};
