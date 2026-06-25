import type { SdkworkIamService } from "@sdkwork/iam-service";

export interface SdkworkIamH5UserProfile {
  displayName?: string;
  email?: string;
  id: string;
  nickname?: string;
  phone?: string;
  userId: string;
  username?: string;
}

export interface SdkworkIamH5UserProfileDraft {
  displayName?: string;
  nickname?: string;
}

export interface SdkworkIamH5PasswordDraft {
  confirmPassword: string;
  newPassword: string;
  oldPassword: string;
}

export interface SdkworkIamH5VerificationPolicy {
  emailVerificationRequired?: boolean;
  phoneVerificationRequired?: boolean;
}

export interface SdkworkIamH5UserState {
  lastError?: string;
  profile?: SdkworkIamH5UserProfile;
  status: "idle" | "loading" | "ready" | "error";
  verificationPolicy?: SdkworkIamH5VerificationPolicy;
}

export interface CreateSdkworkIamH5UserControllerInput {
  service: SdkworkIamService;
}

export interface SdkworkIamH5UserController {
  getState(): SdkworkIamH5UserState;
  loadProfile(): Promise<SdkworkIamH5UserProfile>;
  loadVerificationPolicy(): Promise<SdkworkIamH5VerificationPolicy>;
  updatePassword(body: SdkworkIamH5PasswordDraft): Promise<void>;
  updateProfile(body: SdkworkIamH5UserProfileDraft): Promise<SdkworkIamH5UserProfile>;
}

export interface SdkworkIamH5UserProfileScreenProps {
  controller: SdkworkIamH5UserController;
  title?: string;
}

export const IAM_H5_USER_ROUTES = {
  moduleId: "iam-h5-user",
  profilePath: "/user/profile",
} as const;
