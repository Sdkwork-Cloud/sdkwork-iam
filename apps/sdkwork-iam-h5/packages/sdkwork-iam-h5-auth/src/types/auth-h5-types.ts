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

export interface SdkworkIamH5OAuthLoginInput {
  code: string;
  provider: string;
  redirectUri?: string;
  state: string;
}

export interface SdkworkIamH5MiniProgramLoginInput {
  jsCode: string;
  surfaceCode?: string;
}

/**
 * Scan-login context carried by a URL scan-login QR code
 * (`{h5Origin}/auth/login?session_key=...&purpose=login&scan_source=qr#poll_secret=...`).
 * The H5 page completes the QR session with `completeScanLogin` after a
 * successful password or WeChat authorization login.
 */
export interface SdkworkIamH5ScanLoginContext {
  pollSecret?: string;
  purpose?: string;
  sessionKey: string;
}

export interface SdkworkIamH5OAuthProvider {
  displayName?: string;
  providerCode: string;
  supportsLogin?: boolean;
}

export type SdkworkIamH5LoginResult =
  | { challenge: IamLoginContextSelectionChallenge; kind: "loginContextSelectionRequired" }
  | { kind: "session"; session: SdkworkIamH5AuthSession };

export interface CreateSdkworkIamH5AuthControllerInput {
  service: SdkworkIamService;
}

export interface SdkworkIamH5AuthController {
  completeScanLogin(input: {
    pollSecret: string;
    sessionKey: string;
  }): Promise<void>;
  createOAuthAuthorizationUrl(input: { provider: string; redirectUri: string; state?: string }): Promise<string>;
  getState(): SdkworkIamH5AuthState;
  listOAuthProviders(): Promise<SdkworkIamH5OAuthProvider[]>;
  login(credentials: SdkworkIamH5LoginCredentials): Promise<SdkworkIamH5LoginResult>;
  loginWithOAuth(input: SdkworkIamH5OAuthLoginInput): Promise<SdkworkIamH5AuthSession>;
  loginWithMiniProgram(input: SdkworkIamH5MiniProgramLoginInput): Promise<SdkworkIamH5AuthSession>;
  logout(): Promise<void>;
  resolveScanLoginContext(): SdkworkIamH5ScanLoginContext | undefined;
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
  /** Invoked when a scan-login QR session was completed on this device. */
  onScanLoginCompleted?: () => void;
  title?: string;
}

export interface SdkworkIamH5AuthOAuthCallbackScreenProps {
  controller: SdkworkIamH5AuthController;
  onAuthenticated?: (session: SdkworkIamH5AuthSession) => void;
  /** Invoked when a scan-login QR session was completed after OAuth login. */
  onScanLoginCompleted?: () => void;
  title?: string;
}

export const IAM_H5_AUTH_ROUTES = {
  /** Mobile H5 login screen; also the URL scan-login QR target. */
  loginPath: "/auth/login",
  /** WeChat web-authorization callback screen (`code`/`state` exchange). */
  callbackPath: "/auth/oauth/callback",
  moduleId: "iam-h5-auth",
} as const;
