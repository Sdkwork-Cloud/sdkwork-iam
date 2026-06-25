import type { IamLoginContextSelectionChallenge } from "@sdkwork/iam-contracts";
import type { SdkworkIamService } from "@sdkwork/iam-service";

export interface SdkworkIamH5AuthSession {
  accessToken?: string;
  authToken?: string;
  refreshToken?: string;
  sessionId?: string;
  userId?: string;
}

export interface SdkworkIamH5AuthState {
  challenge?: IamLoginContextSelectionChallenge;
  lastError?: string;
  session?: SdkworkIamH5AuthSession;
  status: "idle" | "loading" | "loginContextSelectionRequired" | "ready" | "error";
}

export interface SdkworkIamH5LoginCredentials {
  password: string;
  username: string;
}

export type SdkworkIamH5LoginResult =
  | { challenge: IamLoginContextSelectionChallenge; kind: "loginContextSelectionRequired" }
  | { kind: "session"; session: SdkworkIamH5AuthSession };

export interface CreateSdkworkIamH5AuthControllerInput {
  service: SdkworkIamService;
}

export interface SdkworkIamH5AuthController {
  getState(): SdkworkIamH5AuthState;
  login(credentials: SdkworkIamH5LoginCredentials): Promise<SdkworkIamH5LoginResult>;
  logout(): Promise<void>;
  selectOrganization(input: {
    continuationToken: string;
    organizationId: string;
  }): Promise<SdkworkIamH5AuthSession>;
  selectPersonalLogin(input: {
    continuationToken: string;
  }): Promise<SdkworkIamH5AuthSession>;
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
