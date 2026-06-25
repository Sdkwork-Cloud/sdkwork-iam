import type { SdkworkIamService } from "@sdkwork/iam-service";

export interface SdkworkIamConsoleUserProfile {
  displayName?: string;
  email?: string;
  id: string;
  nickname?: string;
  phone?: string;
  userId: string;
  username?: string;
}

export interface SdkworkIamConsoleUserProfileDraft {
  displayName?: string;
  nickname?: string;
}

export interface SdkworkIamConsolePasswordDraft {
  confirmPassword: string;
  newPassword: string;
  oldPassword: string;
}

export interface SdkworkIamConsoleVerificationPolicy {
  emailVerificationRequired?: boolean;
  phoneVerificationRequired?: boolean;
}

export interface SdkworkIamConsoleUserState {
  lastError?: string;
  profile?: SdkworkIamConsoleUserProfile;
  status: "idle" | "loading" | "ready" | "error";
  verificationPolicy?: SdkworkIamConsoleVerificationPolicy;
}

export interface CreateSdkworkIamConsoleUserControllerInput {
  service: SdkworkIamService;
}

export interface SdkworkIamConsoleUserController {
  getState(): SdkworkIamConsoleUserState;
  loadProfile(): Promise<SdkworkIamConsoleUserProfile>;
  loadVerificationPolicy(): Promise<SdkworkIamConsoleVerificationPolicy>;
  refreshWorkspace(): Promise<{
    profile: SdkworkIamConsoleUserProfile;
    verificationPolicy: SdkworkIamConsoleVerificationPolicy;
  }>;
  updatePassword(body: SdkworkIamConsolePasswordDraft): Promise<void>;
  updateProfile(body: SdkworkIamConsoleUserProfileDraft): Promise<SdkworkIamConsoleUserProfile>;
}

export interface SdkworkIamConsoleUserWorkspaceProps {
  controller: SdkworkIamConsoleUserController;
  description?: string;
  title?: string;
}

export const IAM_PC_CONSOLE_USER_ROUTES = {
  basePath: "/console/iam/user",
  defaultPath: "/console/iam/user",
  moduleId: "iam-console-user",
  permissionPrefix: "iam.user_console",
} as const;
