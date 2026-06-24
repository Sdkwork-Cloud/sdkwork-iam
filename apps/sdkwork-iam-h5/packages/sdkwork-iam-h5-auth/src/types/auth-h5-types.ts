import type { SdkworkIamService } from "@sdkwork/iam-service";

export interface SdkworkIamH5AuthSession {
  accessToken?: string;
  refreshToken?: string;
  sessionId?: string;
  userId?: string;
}

export interface SdkworkIamH5AuthState {
  lastError?: string;
  session?: SdkworkIamH5AuthSession;
  status: "idle" | "loading" | "ready" | "error";
}

export interface SdkworkIamH5LoginCredentials {
  password: string;
  username: string;
}

export interface CreateSdkworkIamH5AuthControllerInput {
  service: SdkworkIamService;
}

export interface SdkworkIamH5AuthController {
  getState(): SdkworkIamH5AuthState;
  login(credentials: SdkworkIamH5LoginCredentials): Promise<SdkworkIamH5AuthSession>;
  logout(): Promise<void>;
}

export interface SdkworkIamH5AuthLoginScreenProps {
  controller: SdkworkIamH5AuthController;
  onAuthenticated?: (session: SdkworkIamH5AuthSession) => void;
  title?: string;
}

export const IAM_H5_AUTH_ROUTES = {
  loginPath: "/auth/login",
  moduleId: "iam-h5-auth",
} as const;
