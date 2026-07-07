import type { SdkWorkPageInfo } from "@sdkwork/iam-contracts";
import type { SdkworkIamService } from "@sdkwork/iam-service";

export interface SdkworkIamH5AccountBindingPolicy {
  contactBinding: {
    emailChangeEnabled: boolean;
    emailEnabled: boolean;
    enabled: boolean;
    phoneChangeEnabled: boolean;
    phoneEnabled: boolean;
  };
  oauthBinding: {
    enabled: boolean;
    selfServiceLinkEnabled: boolean;
    selfServiceUnlinkEnabled: boolean;
  };
}

export interface SdkworkIamH5OAuthAccountLink {
  accountLinkId: string;
  id: string;
  provider?: string;
  providerUserId?: string;
}

export interface SdkworkIamH5AccountBindingState {
  accountLinks: readonly SdkworkIamH5OAuthAccountLink[];
  lastError?: string;
  listPageInfo?: SdkWorkPageInfo;
  policy?: SdkworkIamH5AccountBindingPolicy;
  status: "idle" | "loading" | "ready" | "error";
}

export interface CreateSdkworkIamH5AccountBindingControllerInput {
  service: SdkworkIamService;
}

export interface SdkworkIamH5AccountBindingController {
  bindEmail(body: Record<string, unknown>): Promise<unknown>;
  getState(): SdkworkIamH5AccountBindingState;
  listAccountLinks(params?: Record<string, unknown>): Promise<readonly SdkworkIamH5OAuthAccountLink[]>;
  loadMoreAccountLinks(): Promise<readonly SdkworkIamH5OAuthAccountLink[]>;
  loadPolicy(): Promise<SdkworkIamH5AccountBindingPolicy>;
  unbindEmail(body: Record<string, unknown>): Promise<unknown>;
}

export interface SdkworkIamH5AccountBindingScreenProps {
  controller: SdkworkIamH5AccountBindingController;
  title?: string;
}

export const IAM_H5_ACCOUNT_BINDING_ROUTES = {
  moduleId: "iam-h5-account-binding",
  settingsPath: "/user/account-binding",
} as const;

export const DEFAULT_H5_ACCOUNT_BINDING_POLICY: SdkworkIamH5AccountBindingPolicy = {
  contactBinding: {
    emailChangeEnabled: true,
    emailEnabled: true,
    enabled: true,
    phoneChangeEnabled: true,
    phoneEnabled: true,
  },
  oauthBinding: {
    enabled: false,
    selfServiceLinkEnabled: false,
    selfServiceUnlinkEnabled: false,
  },
};
