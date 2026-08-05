export interface SdkworkIamAccountBindingAdminMessages {
  common: {
    loadError: string;
    saveError: string;
    savePolicy: string;
  };
  contactBinding: {
    allowEmailBinding: string;
    allowEmailChange: string;
    allowEmailUnbind: string;
    allowPhoneBinding: string;
    allowPhoneChange: string;
    allowPhoneUnbind: string;
    description: string;
    enableContactBinding: string;
    requireVerification: string;
    title: string;
  };
  oauthBinding: {
    allowSelfServiceLink: string;
    allowSelfServiceUnlink: string;
    allowedProvidersLabel: string;
    allowedProvidersPlaceholder: string;
    description: string;
    enableOauthBinding: string;
    title: string;
  };
  oauthLogin: {
    allowAutoRegistration: string;
    allowedProvidersLabel: string;
    allowedProvidersPlaceholder: string;
    description: string;
    enableOauthLogin: string;
    title: string;
  };
}
