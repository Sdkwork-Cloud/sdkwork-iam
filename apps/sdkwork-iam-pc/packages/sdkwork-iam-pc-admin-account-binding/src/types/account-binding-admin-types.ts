import type { SdkworkIamService } from "@sdkwork/iam-service";

export interface SdkworkIamContactBindingPolicy {
  enabled: boolean;
  emailEnabled: boolean;
  phoneEnabled: boolean;
  emailChangeEnabled: boolean;
  phoneChangeEnabled: boolean;
  emailUnbindEnabled: boolean;
  phoneUnbindEnabled: boolean;
  requireVerification: boolean;
}

export interface SdkworkIamOauthLoginPolicy {
  allowedProviders: readonly string[];
  autoRegistrationEnabled: boolean;
  enabled: boolean;
}

export interface SdkworkIamOauthBindingPolicy {
  allowedProviders: readonly string[];
  enabled: boolean;
  selfServiceLinkEnabled: boolean;
  selfServiceUnlinkEnabled: boolean;
}

export interface SdkworkIamAccountBindingPolicy {
  contactBinding: SdkworkIamContactBindingPolicy;
  oauthLogin: SdkworkIamOauthLoginPolicy;
  oauthBinding: SdkworkIamOauthBindingPolicy;
}

export interface SdkworkIamAccountBindingPolicyState {
  policy: SdkworkIamAccountBindingPolicy;
  status: "idle" | "loading" | "ready" | "saving" | "error";
  lastError?: string;
}

export interface CreateSdkworkIamAccountBindingControllerInput {
  service: SdkworkIamService;
}

export interface SdkworkIamAccountBindingController {
  getState(): SdkworkIamAccountBindingPolicyState;
  load(): Promise<SdkworkIamAccountBindingPolicy>;
  save(policy: SdkworkIamAccountBindingPolicy): Promise<SdkworkIamAccountBindingPolicy>;
}

export interface SdkworkIamAccountBindingSettingsProps {
  controller: SdkworkIamAccountBindingController;
  description?: string;
  title?: string;
}

export const DEFAULT_ACCOUNT_BINDING_POLICY: SdkworkIamAccountBindingPolicy = {
  contactBinding: {
    enabled: true,
    emailEnabled: true,
    phoneEnabled: true,
    emailChangeEnabled: true,
    phoneChangeEnabled: true,
    emailUnbindEnabled: false,
    phoneUnbindEnabled: false,
    requireVerification: true,
  },
  oauthLogin: {
    allowedProviders: [],
    autoRegistrationEnabled: true,
    enabled: false,
  },
  oauthBinding: {
    allowedProviders: [],
    enabled: false,
    selfServiceLinkEnabled: false,
    selfServiceUnlinkEnabled: false,
  },
};
