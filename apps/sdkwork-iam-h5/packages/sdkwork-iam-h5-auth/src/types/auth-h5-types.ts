import type { IamLoginContextSelectionChallenge } from "@sdkwork/iam-contracts";
import type { SdkworkIamService } from "@sdkwork/iam-service";

/** Verification-code delivery channel supported by the mobile auth surface. */
export type SdkworkIamH5VerifyType = "PHONE" | "EMAIL";

/** Verification-code business scene used by IAM verification clients. */
export type SdkworkIamH5VerificationScene =
  | "LOGIN"
  | "REGISTER"
  | "RESET_PASSWORD";

/**
 * Verification-code delivery/verification port. The host injects the
 * generated messaging app SDK surface or an approved appbase wrapper that
 * delegates to an injected messaging client (APP_MOBILE_REACT_UI_SPEC §4).
 * When the host has no verification surface yet, code flows fail closed.
 */
export interface SdkworkIamH5VerificationCodeClient {
  send(input: {
    scene: SdkworkIamH5VerificationScene;
    target: string;
    verifyType: SdkworkIamH5VerifyType;
  }): Promise<void>;
  verify?(input: {
    code: string;
    scene: SdkworkIamH5VerificationScene;
    target: string;
    verifyType: SdkworkIamH5VerifyType;
  }): Promise<boolean>;
}

/** Authentication modes of the mobile login/register surface. */
export type SdkworkIamH5AuthMode = "login-pwd" | "login-code" | "register" | "forgot";

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

/** Phone- or email-code login credentials (验证码登录). */
export interface SdkworkIamH5CodeLoginInput {
  code: string;
  target: string;
}

/** Registration credentials collected by the register mode (手机号注册). */
export interface SdkworkIamH5RegisterInput {
  account: string;
  code: string;
  password: string;
}

/** Password-recovery credentials collected by the forgot mode (找回密码). */
export interface SdkworkIamH5ResetPasswordInput {
  account: string;
  code: string;
  newPassword: string;
}

export interface SdkworkIamH5SendVerificationCodeInput {
  scene: SdkworkIamH5VerificationScene;
  target: string;
  verifyType: SdkworkIamH5VerifyType;
}

export interface CreateSdkworkIamH5AuthControllerInput {
  service: SdkworkIamService;
  /** Optional verification-code client injected by the host (fail-closed when absent). */
  verificationCodeClient?: SdkworkIamH5VerificationCodeClient;
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
  loginWithCode(input: SdkworkIamH5CodeLoginInput): Promise<SdkworkIamH5LoginResult>;
  loginWithOAuth(input: SdkworkIamH5OAuthLoginInput): Promise<SdkworkIamH5AuthSession>;
  loginWithMiniProgram(input: SdkworkIamH5MiniProgramLoginInput): Promise<SdkworkIamH5AuthSession>;
  logout(): Promise<void>;
  register(input: SdkworkIamH5RegisterInput): Promise<SdkworkIamH5LoginResult>;
  resetPassword(input: SdkworkIamH5ResetPasswordInput): Promise<void>;
  resolveScanLoginContext(): SdkworkIamH5ScanLoginContext | undefined;
  selectOrganization(input: {
    continuationToken: string;
    organizationId: string;
  }): Promise<SdkworkIamH5AuthSession>;
  selectPersonalLogin(input: {
    continuationToken: string;
  }): Promise<SdkworkIamH5AuthSession>;
  sendVerificationCode(input: SdkworkIamH5SendVerificationCodeInput): Promise<void>;
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
