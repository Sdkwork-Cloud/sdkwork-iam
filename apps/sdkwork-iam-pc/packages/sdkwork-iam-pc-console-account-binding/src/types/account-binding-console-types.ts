import type { SdkworkIamService } from "@sdkwork/iam-service";

export interface SdkworkIamConsoleAccountBindingPolicy {
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

export interface SdkworkIamConsoleOAuthAccountLink {
  accountLinkId: string;
  id: string;
  provider?: string;
  providerUserId?: string;
}

export interface SdkworkIamConsoleAccountBindingState {
  accountLinks: readonly SdkworkIamConsoleOAuthAccountLink[];
  lastError?: string;
  policy?: SdkworkIamConsoleAccountBindingPolicy;
  status: "idle" | "loading" | "ready" | "error";
}

export interface CreateSdkworkIamConsoleAccountBindingControllerInput {
  service: SdkworkIamService;
}

export interface SdkworkIamConsoleAccountBindingController {
  bindEmail(body: Record<string, unknown>): Promise<unknown>;
  getState(): SdkworkIamConsoleAccountBindingState;
  listAccountLinks(params?: Record<string, unknown>): Promise<readonly SdkworkIamConsoleOAuthAccountLink[]>;
  loadPolicy(): Promise<SdkworkIamConsoleAccountBindingPolicy>;
  refreshWorkspace(params?: Record<string, unknown>): Promise<{
    accountLinks: readonly SdkworkIamConsoleOAuthAccountLink[];
    policy: SdkworkIamConsoleAccountBindingPolicy;
  }>;
  unbindEmail(body: Record<string, unknown>): Promise<unknown>;
}

export interface SdkworkIamConsoleAccountBindingWorkspaceProps {
  controller: SdkworkIamConsoleAccountBindingController;
  description?: string;
  title?: string;
}

export const IAM_PC_CONSOLE_ACCOUNT_BINDING_ROUTES = {
  basePath: "/console/iam/account-binding",
  defaultPath: "/console/iam/account-binding",
  moduleId: "iam-console-account-binding",
  permissionPrefix: "iam.account_binding_console",
} as const;

export const DEFAULT_CONSOLE_ACCOUNT_BINDING_POLICY: SdkworkIamConsoleAccountBindingPolicy = {
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
