import {
  clearPcReactRuntimeSession,
  getAppClientWithSession,
  persistPcReactRuntimeSession,
  readPcReactRuntimeSession,
} from "@sdkwork/core-pc-react";
import {
  assertSdkworkJwtCredential,
  readSdkworkMediaResource,
  type SdkworkMediaResource,
} from "@sdkwork/runtime-bootstrap";
import { isBlank } from "@sdkwork/utils";
import { unwrapIamSdkResponse } from "@sdkwork/iam-sdk-adapter";
import {
  createSdkworkAuthMessages,
  formatSdkworkAuthTemplate,
} from "./auth-copy.ts";
import {
  DEFAULT_SDKWORK_AUTH_VERIFICATION_POLICY,
  normalizeSdkworkAuthOAuthProvider,
  type SdkworkAuthResolvedVerificationPolicy,
} from "./auth-runtime-config.ts";

export type SdkworkAuthVerifyType = "EMAIL" | "PHONE";
export type SdkworkAuthScene = "BIND_EMAIL" | "BIND_PHONE" | "LOGIN" | "REGISTER" | "RESET_PASSWORD";
export type SdkworkAuthPasswordResetChannel = "EMAIL" | "SMS";
export type SdkworkAuthOAuthDeviceType = "android" | "desktop" | "ios" | "web";
export type SdkworkAuthSocialProvider = string;
export type SdkworkAuthLoginQrCodeStatus =
  | "bindRequired"
  | "confirmed"
  | "expired"
  | "failed"
  | "organizationSelectionRequired"
  | "passwordRequired"
  | "pending"
  | "scanned";

export interface SdkworkAuthUser {
  avatar?: SdkworkMediaResource;
  displayName: string;
  email: string;
  firstName: string;
  id?: string;
  initials: string;
  lastName: string;
  username?: string;
}

export interface SdkworkAuthAppContext {
  appId?: string;
  authLevel?: string;
  dataScope?: string[];
  deploymentMode?: string;
  environment?: string;
  loginScope?: string;
  organizationId?: string | null;
  permissionScope?: string[];
  sessionId?: string;
  tenantId?: string;
  userId?: string;
}

interface SdkworkRemoteAuthAppContext {
  appId?: unknown;
  app_id?: unknown;
  authLevel?: unknown;
  auth_level?: unknown;
  dataScope?: unknown;
  data_scope?: unknown;
  deploymentMode?: unknown;
  deployment_mode?: unknown;
  environment?: unknown;
  loginScope?: unknown;
  login_scope?: unknown;
  organizationId?: unknown;
  organization_id?: unknown;
  permissionScope?: unknown;
  permission_scope?: unknown;
  sessionId?: unknown;
  session_id?: unknown;
  tenantId?: unknown;
  tenant_id?: unknown;
  userId?: unknown;
  user_id?: unknown;
}

export interface SdkworkAuthOrganizationChoice {
  displayName?: string;
  id?: string;
  membershipId?: string;
  membershipKind?: string;
  name?: string;
  organizationId: string;
  tenantId?: string;
  [key: string]: unknown;
}

export interface SdkworkAuthOrganizationSelectionChallenge {
  challengeType: "ORGANIZATION_SELECTION" | "LOGIN_CONTEXT_SELECTION";
  continuationToken: string;
  expiresAt?: number | string;
  organizations: SdkworkAuthOrganizationChoice[];
  options?: Array<{
    loginScope: "TENANT" | "ORGANIZATION";
    organizationId?: string;
    displayName?: string;
    requiresOrganizationSelection?: boolean;
  }>;
}

export interface SdkworkAuthLoginContextSelectionInput {
  continuationToken: string;
  loginScope: "TENANT" | "ORGANIZATION";
  organizationId?: string;
}

export interface SdkworkAuthOrganizationSelectionInput {
  continuationToken: string;
  organizationId: string;
}

export class SdkworkAuthOrganizationSelectionRequiredError extends Error {
  challenge: SdkworkAuthOrganizationSelectionChallenge;

  constructor(challenge: SdkworkAuthOrganizationSelectionChallenge) {
    super("Organization selection is required to complete login.");
    this.name = "SdkworkAuthOrganizationSelectionRequiredError";
    this.challenge = challenge;
  }
}

export interface SdkworkAuthStoredSession {
  accessToken?: string;
  authToken?: string;
  context?: SdkworkAuthAppContext;
  expiresAt?: number | string;
  refreshToken?: string;
  sessionId?: string;
}

export interface SdkworkAuthSession extends Required<Pick<SdkworkAuthStoredSession, "accessToken" | "authToken">> {
  context?: SdkworkAuthAppContext;
  expiresAt?: number | string;
  refreshToken?: string;
  sessionId?: string;
  user?: SdkworkAuthUser;
}

export const SDKWORK_AUTH_SESSION_REQUIRED_MESSAGE = "Valid IAM auth session is required.";

function normalizeAuthSessionToken(value: unknown): string | undefined {
  const normalized = typeof value === "string" ? value.trim() : "";
  return normalized || undefined;
}

export function isSdkworkAuthSession(value: unknown): value is SdkworkAuthSession {
  return Boolean(value)
    && typeof value === "object"
    && Boolean(normalizeAuthSessionToken((value as SdkworkAuthSession).accessToken))
    && Boolean(normalizeAuthSessionToken((value as SdkworkAuthSession).authToken));
}

export function assertSdkworkAuthSession(
  value: unknown,
  message = SDKWORK_AUTH_SESSION_REQUIRED_MESSAGE,
): SdkworkAuthSession {
  if (!isSdkworkAuthSession(value)) {
    throw new Error(message);
  }

  return value;
}

export interface SdkworkAuthSessionCommitOptions {
  preserveRefreshToken?: boolean;
}

export interface SdkworkAuthIdentityInput {
  avatar?: SdkworkMediaResource;
  displayName?: string;
  email?: string;
  firstName?: string;
  id?: string;
  initials?: string;
  lastName?: string;
  username?: string;
}

export interface SdkworkAuthLoginInput {
  password: string;
  username: string;
}

export interface SdkworkAuthRegisterInput {
  channel?: "EMAIL" | "PHONE";
  confirmPassword?: string;
  email?: string;
  password: string;
  phone?: string;
  tenantId?: string;
  username: string;
  verificationCode?: string;
}

export interface SdkworkAuthPhoneLoginInput {
  appVersion?: string;
  code: string;
  deviceId?: string;
  deviceName?: string;
  deviceType?: SdkworkAuthOAuthDeviceType;
  phone: string;
}

export interface SdkworkAuthEmailLoginInput {
  appVersion?: string;
  code: string;
  deviceId?: string;
  deviceName?: string;
  deviceType?: SdkworkAuthOAuthDeviceType;
  email: string;
}

export interface SdkworkAuthSessionBridgeLoginInput {
  bridgeToken?: string;
  email: string;
  name?: string;
  subject?: string;
}

export interface SdkworkAuthRefreshSessionInput {
  refreshToken?: string;
}

export interface SdkworkAuthUpdateCurrentSessionInput {
  loginScope?: "TENANT" | "ORGANIZATION";
  organizationId?: string;
  organizationCode?: string;
  [key: string]: unknown;
}

export interface SdkworkAuthSendVerifyCodeInput {
  scene: SdkworkAuthScene;
  target: string;
  verifyType: SdkworkAuthVerifyType;
}

export interface SdkworkAuthVerifyCodeInput extends SdkworkAuthSendVerifyCodeInput {
  code: string;
}

export interface SdkworkAuthPasswordResetRequestInput {
  account: string;
  channel: SdkworkAuthPasswordResetChannel;
}

export interface SdkworkAuthPasswordResetInput {
  account: string;
  code: string;
  confirmPassword?: string;
  newPassword: string;
}

export interface SdkworkAuthOAuthAuthorizationInput {
  provider: SdkworkAuthSocialProvider;
  redirectUri: string;
  scope?: string;
  state?: string;
}

export interface SdkworkAuthOAuthLoginInput {
  code: string;
  deviceId?: string;
  deviceType?: SdkworkAuthOAuthDeviceType;
  provider: SdkworkAuthSocialProvider;
  redirectUri?: string;
  state?: string;
}

export interface SdkworkAuthOAuthAuthorizationCompletion {
  authorizationCode?: string;
  redirectUrl: string;
}

export interface SdkworkAuthLoginQrCodeCreateInput {
  purpose?: "login" | "register";
}

export interface SdkworkAuthLoginQrCodeConfirmInput {
  channel?: "EMAIL" | "PHONE" | string;
  confirmPassword?: string;
  email?: string;
  password?: string;
  phone?: string;
  sessionKey: string;
  username?: string;
  verificationCode?: string;
}

export interface SdkworkAuthLoginQrCodeCallbackInput {
  accountId?: string;
  event?: "bindRequired" | "failed" | "passwordRequired" | "scanned" | string;
  entryId?: string;
  externalUserId?: string;
  ipHash?: string;
  pollSecret?: string;
  scanSource?: "app" | "browser" | "mini_app" | "official_account" | "webhook" | string;
  sessionKey: string;
  status?: "bindRequired" | "failed" | "passwordRequired" | "scanned" | string;
  userAgent?: string;
}

export interface SdkworkAuthLoginQrCode {
  description?: string;
  expireTime?: number;
  pollSecret?: string;
  qrCode?: SdkworkMediaResource;
  qrContent?: string;
  sessionKey: string;
  title?: string;
  type?: string;
}

export interface SdkworkAuthLoginQrCodeCheckOptions {
  pollSecret?: string;
}

export interface SdkworkAuthLoginQrCodeStatusResult {
  organizationSelection?: SdkworkAuthOrganizationSelectionChallenge;
  session?: SdkworkAuthSession;
  status: SdkworkAuthLoginQrCodeStatus;
  user?: SdkworkAuthUser;
}

export interface SdkworkAuthClient {
  auth: {
    passwordResetRequests?: {
      create?: (payload: Record<string, unknown>) => Promise<unknown>;
    };
    passwordResets?: {
      create?: (payload: Record<string, unknown>) => Promise<unknown>;
    };
    registrations?: {
      create?: (payload: Record<string, unknown>) => Promise<unknown>;
    };
    sessions?: {
      create?: (payload: Record<string, unknown>) => Promise<unknown>;
      current?: {
        delete?: () => Promise<unknown>;
        retrieve?: () => Promise<unknown>;
        update?: (payload: Record<string, unknown>) => Promise<unknown>;
      };
      organizationSelection?: {
        create?: (payload: Record<string, unknown>) => Promise<unknown>;
      };
      loginContextSelection?: {
        create?: (payload: Record<string, unknown>) => Promise<unknown>;
      };
      refresh?: (payload: Record<string, unknown>) => Promise<unknown>;
    };
  };
  oauth?: {
    authorizationUrls?: {
      create?: (payload: Record<string, unknown>) => Promise<unknown>;
    };
    sessions?: {
      create?: (payload: Record<string, unknown>) => Promise<unknown>;
    };
    deviceAuthorizations?: {
      create?: (payload?: Record<string, unknown>) => Promise<unknown>;
      retrieve?: (deviceAuthorizationId: string) => Promise<unknown>;
      passwordCompletions?: {
        create?: (deviceAuthorizationId: string, payload: Record<string, unknown>) => Promise<unknown>;
      };
      scans?: {
        create?: (deviceAuthorizationId: string, payload?: Record<string, unknown>) => Promise<unknown>;
      };
      sessionExchanges?: {
        create?: (deviceAuthorizationId: string, payload: Record<string, unknown>) => Promise<unknown>;
      };
    };
    providers?: {
      list?: () => Promise<unknown>;
    };
    authorizations?: {
      completions?: {
        create?: (
          authorizationStateId: string,
          payload?: Record<string, unknown>,
        ) => Promise<unknown>;
      };
    };
  };
  messaging?: {
    verificationCodes?: {
      create?: (payload: Record<string, unknown>) => Promise<unknown>;
      verify?: (payload: Record<string, unknown>) => Promise<unknown>;
    };
  };
  system?: {
    iam?: {
      verificationPolicy?: {
        retrieve?: () => Promise<unknown>;
      };
    };
  };
  iam?: {
    users?: {
      current?: {
        retrieve?: () => Promise<unknown>;
      };
    };
  };
}

export interface CreateSdkworkAuthServiceOptions {
  clearSession?: () => Promise<void> | void;
  commitSession?: (
    session: SdkworkAuthStoredSession,
    options?: SdkworkAuthSessionCommitOptions,
  ) => Promise<SdkworkAuthStoredSession | void> | SdkworkAuthStoredSession | void;
  getClient?: () => SdkworkAuthClient;
  readSession?: () => Promise<SdkworkAuthStoredSession> | SdkworkAuthStoredSession;
  /**
   * @deprecated Access-token fallback synthesis is forbidden. Current-session
   * bootstrap requires a stored dual-token session and, when available, a
   * successful appbase current-session SDK validation.
   */
  resolveAccessToken?: () => string;
}

export interface SdkworkAuthService {
  callbackLoginQrCode(input: SdkworkAuthLoginQrCodeCallbackInput): Promise<SdkworkAuthLoginQrCodeStatusResult>;
  checkLoginQrCodeStatus(
    sessionKey: string,
    options?: SdkworkAuthLoginQrCodeCheckOptions,
  ): Promise<SdkworkAuthLoginQrCodeStatusResult>;
  confirmLoginQrCode(input: SdkworkAuthLoginQrCodeConfirmInput): Promise<SdkworkAuthLoginQrCodeStatusResult>;
  completeOAuthAuthorization(authorizationStateId: string): Promise<SdkworkAuthOAuthAuthorizationCompletion>;
  generateLoginQrCode(input?: SdkworkAuthLoginQrCodeCreateInput): Promise<SdkworkAuthLoginQrCode>;
  getCurrentSession(): Promise<SdkworkAuthSession | null>;
  getCurrentUser(): Promise<SdkworkAuthUser | null>;
  getVerificationPolicy(): Promise<SdkworkAuthResolvedVerificationPolicy>;
  listOAuthProviders(): Promise<string[]>;
  getOAuthAuthorizationUrl(input: SdkworkAuthOAuthAuthorizationInput): Promise<string>;
  register(input: SdkworkAuthRegisterInput): Promise<SdkworkAuthSession>;
  requestPasswordReset(input: SdkworkAuthPasswordResetRequestInput): Promise<void>;
  resetPassword(input: SdkworkAuthPasswordResetInput): Promise<void>;
  refreshSession(input?: SdkworkAuthRefreshSessionInput): Promise<SdkworkAuthSession>;
  selectOrganization(input: SdkworkAuthOrganizationSelectionInput): Promise<SdkworkAuthSession>;
  selectLoginContext(input: SdkworkAuthLoginContextSelectionInput): Promise<SdkworkAuthSession>;
  selectPersonalLogin(input: Pick<SdkworkAuthLoginContextSelectionInput, "continuationToken">): Promise<SdkworkAuthSession>;
  sendVerifyCode(input: SdkworkAuthSendVerifyCodeInput): Promise<void>;
  signIn(input: SdkworkAuthLoginInput): Promise<SdkworkAuthSession>;
  signInWithEmailCode(input: SdkworkAuthEmailLoginInput): Promise<SdkworkAuthSession>;
  signInWithOAuth(input: SdkworkAuthOAuthLoginInput): Promise<SdkworkAuthSession>;
  signInWithPhoneCode(input: SdkworkAuthPhoneLoginInput): Promise<SdkworkAuthSession>;
  signInWithSessionBridge(input: SdkworkAuthSessionBridgeLoginInput): Promise<SdkworkAuthSession>;
  signOut(): Promise<void>;
  updateCurrentSession(input?: SdkworkAuthUpdateCurrentSessionInput): Promise<SdkworkAuthSession>;
  verifyCode(input: SdkworkAuthVerifyCodeInput): Promise<boolean>;
}

interface SdkworkRemoteIdentity {
  avatar?: unknown;
  displayName?: string;
  email?: string;
  firstName?: string;
  id?: string;
  lastName?: string;
  name?: string;
  nickname?: string;
  userId?: string;
  username?: string;
}

interface SdkworkRemoteLoginData {
  accessToken?: string;
  authToken?: string;
  challengeType?: string;
  context?: unknown;
  continuationToken?: string;
  expiresAt?: number | string;
  options?: unknown;
  organizations?: unknown;
  refreshToken?: string;
  sessionId?: string;
  user?: SdkworkRemoteIdentity;
  userId?: string;
}

interface SdkworkRemoteQrCode {
  description?: string;
  expireTime?: number;
  qrCode?: unknown;
  qrContent?: string;
  title?: string;
  type?: string;
}

interface SdkworkRemoteQrCodeStatus {
  session?: SdkworkRemoteLoginData;
  status?: string;
  user?: SdkworkRemoteIdentity;
}

interface SdkworkRemotePlatformQrContent {
  content?: string;
  mode?: string;
}

interface SdkworkRemotePlatformQrAuthSession extends SdkworkRemoteQrCodeStatus {
  completedAt?: string | null;
  description?: string;
  deviceAuthorizationId?: unknown;
  expireTime?: number;
  expiresAt?: string;
  fallbackUrl?: string;
  id?: unknown;
  pollSecret?: string;
  qrCode?: unknown;
  qrContent?: SdkworkRemotePlatformQrContent | string;
  sessionKey?: string;
  sessionReady?: boolean;
  title?: string;
  type?: string;
}

interface SdkworkRemoteVerificationPolicy {
  accountBinding?: {
    oauthLogin?: {
      enabled?: boolean;
    };
    oauth_login?: {
      enabled?: boolean;
    };
  };
  emailCodeLoginEnabled?: boolean;
  emailRegisterVerificationRequired?: boolean;
  emailRegistrationVerificationRequired?: boolean;
  oauthLoginEnabled?: boolean;
  phoneCodeLoginEnabled?: boolean;
  phoneRegisterVerificationRequired?: boolean;
  phoneRegistrationVerificationRequired?: boolean;
}

function unwrapAppSdkResponse<T>(
  payload: unknown,
  fallbackMessage: string,
): T {
  return unwrapIamSdkResponse<T>(payload, fallbackMessage);
}

function isExpiredQrLoginCodeError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error || "");
  return /invalid or expired qr login code/i.test(message);
}

function normalizeOptionalString(value: unknown): string | undefined {
  const normalized = typeof value === "string" ? value.trim() : "";
  return normalized || undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizeAuthAppContext(value: unknown): SdkworkAuthAppContext | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const remote = value as SdkworkRemoteAuthAppContext;
  const context: SdkworkAuthAppContext = {
    ...(normalizeOptionalString(remote.appId) || normalizeOptionalString(remote.app_id)
      ? { appId: normalizeOptionalString(remote.appId) || normalizeOptionalString(remote.app_id) }
      : {}),
    ...(normalizeOptionalString(remote.authLevel) || normalizeOptionalString(remote.auth_level)
      ? { authLevel: normalizeOptionalString(remote.authLevel) || normalizeOptionalString(remote.auth_level) }
      : {}),
    ...(normalizeStringArray(remote.dataScope).length > 0 || normalizeStringArray(remote.data_scope).length > 0
      ? {
          dataScope:
            normalizeStringArray(remote.dataScope).length > 0
              ? normalizeStringArray(remote.dataScope)
              : normalizeStringArray(remote.data_scope),
        }
      : {}),
    ...(normalizeOptionalString(remote.deploymentMode) || normalizeOptionalString(remote.deployment_mode)
      ? {
          deploymentMode:
            normalizeOptionalString(remote.deploymentMode)
            || normalizeOptionalString(remote.deployment_mode),
        }
      : {}),
    ...(normalizeOptionalString(remote.environment)
      ? { environment: normalizeOptionalString(remote.environment) }
      : {}),
    ...(normalizeOptionalString(remote.loginScope) || normalizeOptionalString(remote.login_scope)
      ? {
          loginScope:
            normalizeOptionalString(remote.loginScope)
            || normalizeOptionalString(remote.login_scope),
        }
      : {}),
    ...(normalizeNullableString(remote.organizationId) !== undefined
      || normalizeNullableString(remote.organization_id) !== undefined
      ? {
          organizationId:
            normalizeNullableString(remote.organizationId)
            ?? normalizeNullableString(remote.organization_id)
            ?? null,
        }
      : {}),
    ...(normalizeStringArray(remote.permissionScope).length > 0
      || normalizeStringArray(remote.permission_scope).length > 0
      ? {
          permissionScope:
            normalizeStringArray(remote.permissionScope).length > 0
              ? normalizeStringArray(remote.permissionScope)
              : normalizeStringArray(remote.permission_scope),
        }
      : {}),
    ...(normalizeOptionalString(remote.sessionId) || normalizeOptionalString(remote.session_id)
      ? { sessionId: normalizeOptionalString(remote.sessionId) || normalizeOptionalString(remote.session_id) }
      : {}),
    ...(normalizeOptionalString(remote.tenantId) || normalizeOptionalString(remote.tenant_id)
      ? { tenantId: normalizeOptionalString(remote.tenantId) || normalizeOptionalString(remote.tenant_id) }
      : {}),
    ...(normalizeOptionalString(remote.userId) || normalizeOptionalString(remote.user_id)
      ? { userId: normalizeOptionalString(remote.userId) || normalizeOptionalString(remote.user_id) }
      : {}),
  };

  return Object.keys(context).length > 0 ? context : undefined;
}

function readContextString(
  context: SdkworkAuthAppContext | undefined,
  ...keys: readonly (keyof SdkworkAuthAppContext)[]
): string | undefined {
  if (!context) {
    return undefined;
  }

  for (const key of keys) {
    const value = normalizeOptionalString(context[key]);
    if (value) {
      return value;
    }
  }

  return undefined;
}

function parseJwtPayload(token: string): Record<string, unknown> | undefined {
  const parts = token.split(".");
  if (parts.length < 2) {
    return undefined;
  }

  try {
    const normalized = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(
      normalized.length + ((4 - (normalized.length % 4 || 4)) % 4),
      "=",
    );
    const json = atob(padded);
    const parsed = JSON.parse(json) as unknown;
    return isRecord(parsed) ? parsed : undefined;
  } catch {
    return undefined;
  }
}

function readJwtClaimString(
  claims: Record<string, unknown>,
  ...keys: string[]
): string | undefined {
  for (const key of keys) {
    const value = normalizeOptionalString(claims[key]);
    if (value) {
      return value;
    }
  }

  return undefined;
}

function normalizeOrganizationClaim(value?: string | null): string {
  if (!value || value === "0") {
    return "";
  }
  return value;
}

function assertSessionTokenContextCoherence(
  authToken: string,
  accessToken: string,
  context: SdkworkAuthAppContext | undefined,
): void {
  if (!context) {
    return;
  }

  const authClaims = parseJwtPayload(authToken);
  const accessClaims = parseJwtPayload(accessToken);
  if (!authClaims || !accessClaims) {
    return;
  }

  const claimPairs: Array<[string | undefined, string | undefined]> = [
    [readJwtClaimString(authClaims, "tenant_id"), context.tenantId],
    [readJwtClaimString(accessClaims, "tenant_id"), context.tenantId],
    [readJwtClaimString(authClaims, "user_id", "sub"), context.userId],
    [readJwtClaimString(accessClaims, "user_id", "sub"), context.userId],
    [readJwtClaimString(authClaims, "session_id", "sid"), context.sessionId],
    [readJwtClaimString(accessClaims, "session_id", "sid"), context.sessionId],
    [readJwtClaimString(authClaims, "app_id"), context.appId],
    [readJwtClaimString(accessClaims, "app_id"), context.appId],
    [readJwtClaimString(authClaims, "login_scope"), context.loginScope],
    [readJwtClaimString(accessClaims, "login_scope"), context.loginScope],
  ];

  if (
    normalizeOrganizationClaim(readJwtClaimString(authClaims, "organization_id"))
    !== normalizeOrganizationClaim(context.organizationId)
    || normalizeOrganizationClaim(readJwtClaimString(accessClaims, "organization_id"))
      !== normalizeOrganizationClaim(context.organizationId)
  ) {
    throw new Error("auth session context does not match token claims");
  }

  for (const [claimValue, contextValue] of claimPairs) {
    if (claimValue && contextValue && claimValue !== contextValue) {
      throw new Error("auth session context does not match token claims");
    }
  }
}

function normalizeNullableString(value: unknown): string | null | undefined {
  if (value === null) {
    return null;
  }

  return normalizeOptionalString(value);
}

function normalizeStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.map(normalizeOptionalString).filter((item): item is string => Boolean(item))
    : [];
}

function normalizeOrganizationChoice(value: unknown): SdkworkAuthOrganizationChoice | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const organizationId =
    normalizeOptionalString(value.organizationId)
    || normalizeOptionalString(value.organization_id)
    || normalizeOptionalString(value.id);
  if (!organizationId) {
    return undefined;
  }

  return {
    ...value,
    organizationId,
    ...(normalizeOptionalString(value.displayName) || normalizeOptionalString(value.display_name)
      ? {
          displayName:
            normalizeOptionalString(value.displayName)
            || normalizeOptionalString(value.display_name),
        }
      : {}),
    ...(normalizeOptionalString(value.membershipId) || normalizeOptionalString(value.membership_id)
      ? {
          membershipId:
            normalizeOptionalString(value.membershipId)
            || normalizeOptionalString(value.membership_id),
        }
      : {}),
    ...(normalizeOptionalString(value.membershipKind) || normalizeOptionalString(value.membership_kind)
      ? {
          membershipKind:
            normalizeOptionalString(value.membershipKind)
            || normalizeOptionalString(value.membership_kind),
        }
      : {}),
    ...(normalizeOptionalString(value.name) ? { name: normalizeOptionalString(value.name) } : {}),
    ...(normalizeOptionalString(value.tenantId) || normalizeOptionalString(value.tenant_id)
      ? {
          tenantId:
            normalizeOptionalString(value.tenantId)
            || normalizeOptionalString(value.tenant_id),
        }
      : {}),
  };
}

function normalizeOrganizationSelectionChallenge(
  value: SdkworkRemoteLoginData,
): SdkworkAuthOrganizationSelectionChallenge | undefined {
  const challengeType = normalizeOptionalString(value.challengeType);
  if (challengeType !== "ORGANIZATION_SELECTION" && challengeType !== "LOGIN_CONTEXT_SELECTION") {
    return undefined;
  }

  const continuationToken = normalizeOptionalString(value.continuationToken);
  if (!continuationToken) {
    return undefined;
  }

  const organizations = Array.isArray(value.organizations)
    ? value.organizations
        .map(normalizeOrganizationChoice)
        .filter((organization): organization is SdkworkAuthOrganizationChoice => Boolean(organization))
    : [];

  const options = Array.isArray(value.options)
    ? value.options
        .map((option: unknown) => {
          if (!option || typeof option !== "object" || Array.isArray(option)) {
            return undefined;
          }
          const record = option as Record<string, unknown>;
          const loginScope = normalizeOptionalString(record.loginScope)
            || normalizeOptionalString(record.login_scope);
          if (loginScope !== "TENANT" && loginScope !== "ORGANIZATION") {
            return undefined;
          }
          return {
            loginScope: loginScope as 'TENANT' | 'ORGANIZATION',
            ...(normalizeOptionalString(record.organizationId) || normalizeOptionalString(record.organization_id)
              ? {
                  organizationId:
                    normalizeOptionalString(record.organizationId)
                    || normalizeOptionalString(record.organization_id),
                }
              : {}),
            ...(normalizeOptionalString(record.displayName) || normalizeOptionalString(record.display_name)
              ? {
                  displayName:
                    normalizeOptionalString(record.displayName)
                    || normalizeOptionalString(record.display_name),
                }
              : {}),
            ...(record.requiresOrganizationSelection === true
              || record.requires_organization_selection === true
              ? { requiresOrganizationSelection: true }
              : {}),
          };
        })
        .filter((option): option is NonNullable<typeof option> => Boolean(option))
    : undefined;

  return {
    challengeType,
    continuationToken,
    ...(typeof value.expiresAt === "number" || typeof value.expiresAt === "string"
      ? { expiresAt: value.expiresAt }
      : {}),
    organizations,
    ...(options && options.length > 0 ? { options } : {}),
  };
}

function throwIfLegacyTenantSelectionChallenge(value: SdkworkRemoteLoginData): void {
  if (normalizeOptionalString(value.challengeType) === "TENANT_SELECTION") {
    throw new Error(
      "tenant selection is no longer supported; tenant is bound by the bootstrap Access-Token",
    );
  }
}

export function readSdkworkAuthOrganizationSelectionChallenge(
  value: unknown,
): SdkworkAuthOrganizationSelectionChallenge | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  return normalizeOrganizationSelectionChallenge(value as SdkworkRemoteLoginData);
}

function readFirstAuthMediaResource(...values: unknown[]): SdkworkMediaResource | undefined {
  for (const value of values) {
    const resource = readSdkworkMediaResource(value);
    if (resource) {
      return resource;
    }
  }

  return undefined;
}

function splitDisplayName(name: string) {
  const normalized = name.trim().replace(/\s+/g, " ");
  if (!normalized) {
    return {
      firstName: "",
      lastName: "",
    };
  }

  const [firstName, ...rest] = normalized.split(" ");
  return {
    firstName,
    lastName: rest.join(" "),
  };
}

function buildInitials(firstName: string, lastName: string): string {
  const initials = [firstName, lastName]
    .map((value) => value.trim().charAt(0))
    .filter(Boolean)
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return initials;
}

export function createSdkworkAuthUserFromIdentity(
  identity: SdkworkAuthIdentityInput,
): SdkworkAuthUser {
  const displayName =
    normalizeOptionalString(identity.displayName)
    || [
      normalizeOptionalString(identity.firstName),
      normalizeOptionalString(identity.lastName),
    ]
      .filter(Boolean)
      .join(" ")
      .trim()
    || normalizeOptionalString(identity.username)
    || normalizeOptionalString(identity.email)
    || "";
  const firstName = normalizeOptionalString(identity.firstName);
  const lastName = normalizeOptionalString(identity.lastName);
  const nameParts = firstName
    ? {
        firstName,
        lastName: lastName || "",
      }
    : splitDisplayName(displayName);

  return {
    avatar: readSdkworkMediaResource(identity.avatar),
    displayName,
    email: normalizeOptionalString(identity.email) || "",
    firstName: nameParts.firstName,
    id:
      normalizeOptionalString(identity.id)
      || normalizeOptionalString(identity.username)
      || normalizeOptionalString(identity.email),
    initials:
      normalizeOptionalString(identity.initials)
      || buildInitials(nameParts.firstName, nameParts.lastName),
    lastName: nameParts.lastName,
    ...(normalizeOptionalString(identity.username)
      ? { username: normalizeOptionalString(identity.username) }
      : {}),
  };
}

function mergeIdentity(
  primary?: SdkworkRemoteIdentity | null,
  secondary?: SdkworkRemoteIdentity | null,
): SdkworkRemoteIdentity {
  return {
    avatar: readFirstAuthMediaResource(primary?.avatar, secondary?.avatar),
    displayName:
      normalizeOptionalString(primary?.displayName)
      || normalizeOptionalString(primary?.name)
      || normalizeOptionalString(primary?.nickname)
      || normalizeOptionalString(secondary?.displayName)
      || normalizeOptionalString(secondary?.name)
      || normalizeOptionalString(secondary?.nickname),
    email: normalizeOptionalString(primary?.email) || normalizeOptionalString(secondary?.email),
    firstName:
      normalizeOptionalString(primary?.firstName) || normalizeOptionalString(secondary?.firstName),
    id: normalizeOptionalString(primary?.id) || normalizeOptionalString(secondary?.id),
    lastName:
      normalizeOptionalString(primary?.lastName) || normalizeOptionalString(secondary?.lastName),
    name:
      normalizeOptionalString(primary?.name)
      || normalizeOptionalString(primary?.displayName)
      || normalizeOptionalString(primary?.nickname)
      || normalizeOptionalString(secondary?.name)
      || normalizeOptionalString(secondary?.displayName)
      || normalizeOptionalString(secondary?.nickname),
    nickname:
      normalizeOptionalString(primary?.nickname)
      || normalizeOptionalString(primary?.displayName)
      || normalizeOptionalString(primary?.name)
      || normalizeOptionalString(secondary?.nickname)
      || normalizeOptionalString(secondary?.displayName)
      || normalizeOptionalString(secondary?.name),
    userId:
      normalizeOptionalString(primary?.userId) || normalizeOptionalString(secondary?.userId),
    username:
      normalizeOptionalString(primary?.username) || normalizeOptionalString(secondary?.username),
  };
}

function toAuthUser(identity?: SdkworkRemoteIdentity | null): SdkworkAuthUser | undefined {
  if (!identity) {
    return undefined;
  }

  const nickname = normalizeOptionalString(identity.nickname);
  const displayName = normalizeOptionalString(identity.displayName);
  const name = normalizeOptionalString(identity.name);
  const firstName = normalizeOptionalString(identity.firstName);
  const lastName = normalizeOptionalString(identity.lastName);
  const username = normalizeOptionalString(identity.username);
  const email = normalizeOptionalString(identity.email) || "";
  return createSdkworkAuthUserFromIdentity({
    avatar: readSdkworkMediaResource(identity.avatar),
    displayName: displayName || name || nickname || [firstName, lastName].filter(Boolean).join(" ").trim(),
    email,
    firstName,
    id:
      normalizeOptionalString(identity.userId)
      || normalizeOptionalString(identity.id)
      || username
      || email,
    lastName,
    username,
  });
}

function resolveLoginDataIdentity(loginData: SdkworkRemoteLoginData): SdkworkRemoteIdentity | undefined {
  return loginData.user
    ?? (normalizeOptionalString(loginData.userId)
      ? { userId: normalizeOptionalString(loginData.userId) }
      : undefined);
}

function hasQrAuthSessionData(value: SdkworkRemoteLoginData | undefined | null): value is SdkworkRemoteLoginData {
  return Boolean(
    value
    && normalizeOptionalString(value.accessToken)
    && normalizeOptionalString(value.authToken),
  );
}

function resolveQrAuthSessionData(
  value: SdkworkRemotePlatformQrAuthSession | SdkworkRemoteLoginData | undefined | null,
): SdkworkRemoteLoginData | undefined {
  if (!value) {
    return undefined;
  }

  if (hasQrAuthSessionData(value as SdkworkRemoteLoginData)) {
    return value as SdkworkRemoteLoginData;
  }

  const statusValue = value as SdkworkRemotePlatformQrAuthSession;
  if (hasQrAuthSessionData(statusValue.session)) {
    return statusValue.session;
  }

  return undefined;
}

function mapScene(scene: SdkworkAuthScene): string {
  if (scene === "REGISTER") {
    return "REGISTER";
  }

  if (scene === "RESET_PASSWORD") {
    return "RESET_PASSWORD";
  }

  if (scene === "BIND_EMAIL") {
    return "BIND_EMAIL";
  }

  if (scene === "BIND_PHONE") {
    return "BIND_PHONE";
  }

  return "LOGIN";
}

function mapVerifyType(type: SdkworkAuthVerifyType): string {
  return type === "EMAIL" ? "EMAIL" : "PHONE";
}

function mapSocialProvider(provider: string, missingProviderMessage: string): string {
  const normalized = provider.trim().replace(/[\s-]+/g, "_").toUpperCase();
  if (!normalized) {
    throw new Error(missingProviderMessage);
  }

  return normalized;
}

function mapQrStatus(status: string | undefined): SdkworkAuthLoginQrCodeStatus {
  if (
    status === "bindRequired"
    || status === "confirmed"
    || status === "expired"
    || status === "failed"
    || status === "organizationSelectionRequired"
    || status === "passwordRequired"
    || status === "scanned"
  ) {
    return status;
  }

  return "pending";
}

function mapPlatformQrStatus(status: string | undefined): SdkworkAuthLoginQrCodeStatus {
  if (status === "completed") {
    return "confirmed";
  }

  if (status === "cancelled") {
    return "failed";
  }

  if (
    status === "login_context_selection_required"
    || status === "organization_selection_required"
  ) {
    return "organizationSelectionRequired";
  }

  return mapQrStatus(status);
}

function resolveQrAuthPurpose(
  input: SdkworkAuthLoginQrCodeCreateInput,
): "login" | "register" {
  const purpose = normalizeOptionalString(input.purpose);
  if (!purpose) {
    return "login";
  }
  if (purpose === "login" || purpose === "register") {
    return purpose;
  }
  throw new Error("QR auth purpose must be login or register");
}

function resolveQrScanSource(value: unknown): string {
  const normalized = normalizeOptionalString(value);
  if (!normalized) {
    return "browser";
  }
  if (
    normalized === "app"
    || normalized === "browser"
    || normalized === "mini_app"
    || normalized === "official_account"
    || normalized === "webhook"
  ) {
    return normalized;
  }

  throw new Error("QR auth scan source must be app, browser, mini_app, official_account, or webhook");
}

function normalizeQrCredential(value: unknown, label: "password" | "username"): string {
  if (typeof value !== "string") {
    throw new Error(`QR auth ${label} is required`);
  }
  if (label === "password") {
    if (isBlank(value)) {
      throw new Error("QR auth password is required");
    }
    return value;
  }
  const normalized = value.trim();
  if (!normalized) {
    throw new Error("QR auth username is required");
  }
  return normalized;
}

function resolvePlatformQrContent(
  session: SdkworkRemotePlatformQrAuthSession | undefined | null,
): string | undefined {
  const qrContent = session?.qrContent;
  let content: string | undefined;
  if (typeof qrContent === "string") {
    content = normalizeOptionalString(qrContent);
  } else {
    content = normalizeOptionalString(qrContent?.content)
      || normalizeOptionalString(session?.fallbackUrl);
  }

  if (content && !isUserOpenableQrAuthContent(content)) {
    throw new Error("QR auth content must be a mobile-openable login entry URL");
  }

  return content;
}

function isUserOpenableQrAuthContent(value: string): boolean {
  if (isQrAuthSessionStatusApiUrl(value)) {
    return false;
  }

  return true;
}

function isQrAuthSessionStatusApiUrl(value: string): boolean {
  try {
    const parsed = new URL(value, "http://sdkwork.local");
    return parsed.pathname.startsWith("/app/v3/api/oauth/device_authorizations");
  } catch {
    return value.includes("/app/v3/api/oauth/device_authorizations");
  }
}

function resolvePlatformQrContentMode(
  session: SdkworkRemotePlatformQrAuthSession | undefined | null,
): string | undefined {
  const qrContent = session?.qrContent;
  return typeof qrContent === "string"
    ? normalizeOptionalString(session?.type)
    : normalizeOptionalString(qrContent?.mode) || normalizeOptionalString(session?.type);
}

function resolveQrExpireTime(
  qrCode: SdkworkRemoteQrCode | SdkworkRemotePlatformQrAuthSession | undefined | null,
): number | undefined {
  if (typeof qrCode?.expireTime === "number") {
    return qrCode.expireTime;
  }

  const expiresAt = normalizeOptionalString((qrCode as SdkworkRemotePlatformQrAuthSession | undefined)?.expiresAt);
  if (!expiresAt) {
    return undefined;
  }

  const timestamp = Date.parse(expiresAt);
  return Number.isFinite(timestamp) ? timestamp : undefined;
}

function toPlatformLoginQrCode(
  session: SdkworkRemotePlatformQrAuthSession,
  fallbackType?: SdkworkAuthLoginQrCode["type"],
): SdkworkAuthLoginQrCode {
  const sessionKey =
    normalizeOptionalString(session?.sessionKey)
    || normalizeOptionalString(session?.deviceAuthorizationId)
    || normalizeOptionalString(session?.id);

  if (!sessionKey) {
    throw new Error(createSdkworkAuthMessages().service.qrCodeKeyMissing);
  }

  return {
    description: normalizeOptionalString(session.description),
    expireTime: resolveQrExpireTime(session),
    pollSecret: normalizeOptionalString(session.pollSecret),
    qrCode: readSdkworkMediaResource(session.qrCode),
    qrContent: resolvePlatformQrContent(session),
    sessionKey,
    title: normalizeOptionalString(session.title),
    type: resolvePlatformQrContentMode(session) || fallbackType,
  };
}

function toPlatformLoginQrCodeStatus(
  session: SdkworkRemotePlatformQrAuthSession,
  fallbackStatus: SdkworkAuthLoginQrCodeStatus = "pending",
): SdkworkAuthLoginQrCodeStatusResult {
  const status = normalizeOptionalString(session?.status);
  const organizationSelection = normalizeOrganizationSelectionChallenge(session as SdkworkRemoteLoginData);
  return {
    ...(organizationSelection ? { organizationSelection } : {}),
    status: status
      ? mapPlatformQrStatus(status)
      : organizationSelection
        ? "organizationSelectionRequired"
        : fallbackStatus,
    user: toAuthUser(session?.user),
  };
}

function callRequiredMethod<TArgs extends unknown[], TResult>(
  method: ((...args: TArgs) => Promise<TResult>) | undefined,
  _name: string,
  methodUnavailableMessage: string,
  receiver?: unknown,
): (...args: TArgs) => Promise<TResult> {
  if (!method) {
    return async () => {
      throw new Error(methodUnavailableMessage);
    };
  }

  return (...args: TArgs) => method.apply(receiver, args);
}

function buildOAuthAuthorizationUrlCreatePayload(
  input: SdkworkAuthOAuthAuthorizationInput,
  missingProviderMessage: string,
): Record<string, unknown> {
  return {
    provider: mapSocialProvider(input.provider, missingProviderMessage),
    redirectUri: input.redirectUri.trim(),
    scope: normalizeOptionalString(input.scope),
    state: normalizeOptionalString(input.state),
  };
}

function normalizeBooleanSetting(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}

function normalizeVerificationPolicy(
  policy?: SdkworkRemoteVerificationPolicy | null,
): SdkworkAuthResolvedVerificationPolicy {
  const accountBinding = policy?.accountBinding;
  const oauthLogin = accountBinding?.oauthLogin ?? accountBinding?.oauth_login;
  const remoteOauthLoginEnabled = normalizeBooleanSetting(policy?.oauthLoginEnabled)
    ?? normalizeBooleanSetting(oauthLogin?.enabled);

  return {
    emailCodeLoginEnabled:
      normalizeBooleanSetting(policy?.emailCodeLoginEnabled)
      ?? DEFAULT_SDKWORK_AUTH_VERIFICATION_POLICY.emailCodeLoginEnabled,
    emailRegistrationVerificationRequired:
      normalizeBooleanSetting(policy?.emailRegistrationVerificationRequired)
      ?? normalizeBooleanSetting(policy?.emailRegisterVerificationRequired)
      ?? DEFAULT_SDKWORK_AUTH_VERIFICATION_POLICY.emailRegistrationVerificationRequired,
    phoneCodeLoginEnabled:
      normalizeBooleanSetting(policy?.phoneCodeLoginEnabled)
      ?? DEFAULT_SDKWORK_AUTH_VERIFICATION_POLICY.phoneCodeLoginEnabled,
    phoneRegistrationVerificationRequired:
      normalizeBooleanSetting(policy?.phoneRegistrationVerificationRequired)
      ?? normalizeBooleanSetting(policy?.phoneRegisterVerificationRequired)
      ?? DEFAULT_SDKWORK_AUTH_VERIFICATION_POLICY.phoneRegistrationVerificationRequired,
    ...(typeof remoteOauthLoginEnabled === "boolean"
      ? { oauthLoginEnabled: remoteOauthLoginEnabled }
      : {}),
  };
}

function normalizeOAuthProviderListItem(value: unknown): string | null {
  if (typeof value === "string") {
    return normalizeSdkworkAuthOAuthProvider(value);
  }

  if (!isRecord(value)) {
    return null;
  }

  const providerCode = normalizeOptionalString(value.providerCode)
    ?? normalizeOptionalString(value.provider_code)
    ?? normalizeOptionalString(value.provider);
  return providerCode ? normalizeSdkworkAuthOAuthProvider(providerCode) : null;
}

function assertMatchingPasswordConfirmation(
  password: string,
  confirmPassword: string | undefined,
  message: string,
): void {
  if (typeof confirmPassword === "string" && confirmPassword !== password) {
    throw new Error(message);
  }
}

export function createSdkworkAuthService(
  options: CreateSdkworkAuthServiceOptions = {},
): SdkworkAuthService {
  const copy = createSdkworkAuthMessages();
  const getClient = options.getClient ?? (() => getAppClientWithSession() as unknown as SdkworkAuthClient);
  const clearSession = options.clearSession ?? (() => clearPcReactRuntimeSession());
  const readSession: () => Promise<SdkworkAuthStoredSession> | SdkworkAuthStoredSession =
    options.readSession ?? (() => normalizeStoredSession(readPcReactRuntimeSession()));
  const commitSession = options.commitSession;
  const formatMethodUnavailable = (name: string) => formatSdkworkAuthTemplate(
    copy.service.methodUnavailableTemplate,
    {
      name,
    },
  );

  async function enrichSessionWithProfile(
    client: SdkworkAuthClient,
    loginData: SdkworkRemoteLoginData,
    commitOptions?: SdkworkAuthSessionCommitOptions,
  ): Promise<SdkworkAuthSession> {
    throwIfLegacyTenantSelectionChallenge(loginData);

    const organizationSelectionChallenge = normalizeOrganizationSelectionChallenge(loginData);
    if (organizationSelectionChallenge) {
      throw new SdkworkAuthOrganizationSelectionRequiredError(organizationSelectionChallenge);
    }

    const accessToken = normalizeOptionalString(loginData.accessToken);
    const authToken = normalizeOptionalString(loginData.authToken);
    if (!accessToken) {
      throw new Error(copy.service.accessTokenMissing);
    }

    if (!authToken) {
      throw new Error(copy.service.authTokenMissing);
    }

    assertSdkworkJwtCredential(accessToken, "Access-Token");
    assertSdkworkJwtCredential(authToken, "Authorization");

    const context = normalizeAuthAppContext(loginData.context);
    assertSessionTokenContextCoherence(authToken, accessToken, context);
    const sessionTokens = normalizeStoredSession({
      accessToken,
      authToken,
      context,
      refreshToken: normalizeOptionalString(loginData.refreshToken),
      sessionId:
        normalizeOptionalString(loginData.sessionId)
        || readContextString(context, "sessionId"),
    });

    const committedSession = commitSession
      ? await commitCustomSessionWithFallback(commitSession, sessionTokens, readSession, commitOptions)
      : await commitPcReactRuntimeSession(sessionTokens, readSession, commitOptions);

    let profileIdentity: SdkworkRemoteIdentity | null = null;
    if (client.iam?.users?.current?.retrieve) {
      try {
        profileIdentity = unwrapAppSdkResponse<SdkworkRemoteIdentity>(
          await client.iam.users.current.retrieve(),
          copy.service.currentUserProfileLoadFailed,
        );
      } catch {
        profileIdentity = null;
      }
    }

    return {
      accessToken: committedSession.accessToken || "",
      authToken: committedSession.authToken || "",
      ...(committedSession.context ? { context: committedSession.context } : {}),
      ...(committedSession.refreshToken ? { refreshToken: committedSession.refreshToken } : {}),
      ...(committedSession.sessionId ? { sessionId: committedSession.sessionId } : {}),
      user: toAuthUser(mergeIdentity(profileIdentity, resolveLoginDataIdentity(loginData))),
    };
  }

  async function signIn(input: SdkworkAuthLoginInput): Promise<SdkworkAuthSession> {
    const client = getClient();
    const createSession = callRequiredMethod(
      client.auth.sessions?.create,
      "auth.sessions.create",
      formatMethodUnavailable("auth.sessions.create"),
      client.auth.sessions,
    );
    const loginData = unwrapAppSdkResponse<SdkworkRemoteLoginData>(
      await createSession({
        grantType: "password",
        password: input.password,
        username: input.username.trim(),
      }),
      copy.service.signInFailed,
    );

    return enrichSessionWithProfile(client, loginData);
  }

  async function selectLoginContext(
    input: SdkworkAuthLoginContextSelectionInput,
  ): Promise<SdkworkAuthSession> {
    const continuationToken = normalizeOptionalString(input.continuationToken);
    const loginScope = normalizeOptionalString(input.loginScope)?.toUpperCase();
    if (!continuationToken || (loginScope !== "TENANT" && loginScope !== "ORGANIZATION")) {
      throw new Error(copy.service.signInFailed);
    }

    const client = getClient();
    const createLoginContextSelection = callRequiredMethod(
      client.auth.sessions?.loginContextSelection?.create,
      "auth.sessions.loginContextSelection.create",
      formatMethodUnavailable("auth.sessions.loginContextSelection.create"),
      client.auth.sessions?.loginContextSelection,
    );
    const body: Record<string, unknown> = {
      continuationToken,
      loginScope,
    };
    if (loginScope === "ORGANIZATION") {
      const organizationId = normalizeOptionalString(input.organizationId);
      if (!organizationId) {
        throw new Error(copy.service.signInFailed);
      }
      body.organizationId = organizationId;
    }

    const loginData = unwrapAppSdkResponse<SdkworkRemoteLoginData>(
      await createLoginContextSelection(body),
      copy.service.signInFailed,
    );

    return enrichSessionWithProfile(client, loginData);
  }

  async function selectOrganization(
    input: SdkworkAuthOrganizationSelectionInput,
  ): Promise<SdkworkAuthSession> {
    return selectLoginContext({
      continuationToken: input.continuationToken,
      loginScope: "ORGANIZATION",
      organizationId: input.organizationId,
    });
  }

  async function selectPersonalLogin(
    input: Pick<SdkworkAuthLoginContextSelectionInput, "continuationToken">,
  ): Promise<SdkworkAuthSession> {
    return selectLoginContext({
      continuationToken: input.continuationToken,
      loginScope: "TENANT",
    });
  }

  async function signInWithPhoneCode(
    input: SdkworkAuthPhoneLoginInput,
  ): Promise<SdkworkAuthSession> {
    const client = getClient();
    await ensureVerificationCodeAccepted(client, {
      code: input.code,
      scene: "LOGIN",
      target: input.phone,
      verifyType: "PHONE",
    });
    const createSession = callRequiredMethod(
      client.auth.sessions?.create,
      "auth.sessions.create",
      formatMethodUnavailable("auth.sessions.create"),
      client.auth.sessions,
    );
    const loginData = unwrapAppSdkResponse<SdkworkRemoteLoginData>(
      await createSession({
        appVersion: normalizeOptionalString(input.appVersion),
        code: input.code.trim(),
        deviceId: normalizeOptionalString(input.deviceId),
        deviceName: normalizeOptionalString(input.deviceName),
        deviceType: normalizeOptionalString(input.deviceType),
        grantType: "phone_code",
        phone: input.phone.trim(),
      }),
      copy.service.completePhoneCodeLoginFailed,
    );

    return enrichSessionWithProfile(client, loginData);
  }

  async function signInWithEmailCode(
    input: SdkworkAuthEmailLoginInput,
  ): Promise<SdkworkAuthSession> {
    const client = getClient();
    await ensureVerificationCodeAccepted(client, {
      code: input.code,
      scene: "LOGIN",
      target: input.email,
      verifyType: "EMAIL",
    });
    const createSession = callRequiredMethod(
      client.auth.sessions?.create,
      "auth.sessions.create",
      formatMethodUnavailable("auth.sessions.create"),
      client.auth.sessions,
    );
    const loginData = unwrapAppSdkResponse<SdkworkRemoteLoginData>(
      await createSession({
        appVersion: normalizeOptionalString(input.appVersion),
        code: input.code.trim(),
        deviceId: normalizeOptionalString(input.deviceId),
        deviceName: normalizeOptionalString(input.deviceName),
        deviceType: normalizeOptionalString(input.deviceType),
        email: input.email.trim(),
        grantType: "email_code",
      }),
      copy.service.completeEmailCodeLoginFailed,
    );

    return enrichSessionWithProfile(client, loginData);
  }

  async function register(input: SdkworkAuthRegisterInput): Promise<SdkworkAuthSession> {
    assertMatchingPasswordConfirmation(
      input.password,
      input.confirmPassword,
      copy.validation.passwordsDoNotMatch,
    );

    const client = getClient();
    const createRegistration = callRequiredMethod(
      client.auth.registrations?.create,
      "auth.registrations.create",
      formatMethodUnavailable("auth.registrations.create"),
      client.auth.registrations,
    );
    const verificationCode = normalizeOptionalString(input.verificationCode);
    if (verificationCode) {
      await ensureVerificationCodeAccepted(
        client,
        resolveRegistrationVerificationRequest(input, verificationCode),
      );
    }
    const loginData = unwrapAppSdkResponse<SdkworkRemoteLoginData>(
      await createRegistration({
        channel: input.channel,
        confirmPassword: input.confirmPassword,
        email: normalizeOptionalString(input.email),
        password: input.password,
        phone: normalizeOptionalString(input.phone),
        username: input.username.trim(),
        ...(normalizeOptionalString(input.tenantId)
          ? { tenantId: normalizeOptionalString(input.tenantId) }
          : {}),
        ...(verificationCode ? { verificationCode } : {}),
      }),
      copy.service.registerFailed,
    );

    return enrichSessionWithProfile(client, loginData);
  }

  async function getVerificationPolicy(): Promise<SdkworkAuthResolvedVerificationPolicy> {
    const client = getClient();
    const retrieveVerificationPolicy = client.system?.iam?.verificationPolicy?.retrieve;
    if (!retrieveVerificationPolicy) {
      return { ...DEFAULT_SDKWORK_AUTH_VERIFICATION_POLICY };
    }

    const policy = unwrapAppSdkResponse<SdkworkRemoteVerificationPolicy>(
      await retrieveVerificationPolicy(),
      copy.common.requestFailed,
    );

    return normalizeVerificationPolicy(policy);
  }

  async function listOAuthProviders(): Promise<string[]> {
    const client = getClient();
    const listOAuthProvidersMethod = client.oauth?.providers?.list;
    if (!listOAuthProvidersMethod) {
      return [];
    }

    const payload = unwrapAppSdkResponse<{ items?: unknown[] } | unknown[]>(
      await listOAuthProvidersMethod(),
      copy.common.requestFailed,
    );
    const items = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.items)
        ? payload.items
        : [];

    const providers: string[] = [];
    const seen = new Set<string>();
    for (const item of items) {
      const provider = normalizeOAuthProviderListItem(item);
      if (!provider || seen.has(provider)) {
        continue;
      }
      seen.add(provider);
      providers.push(provider);
    }

    return providers;
  }

  async function signOut(): Promise<void> {
    const client = getClient();
    const deleteCurrentSession = callRequiredMethod(
      client.auth.sessions?.current?.delete,
      "auth.sessions.current.delete",
      formatMethodUnavailable("auth.sessions.current.delete"),
      client.auth.sessions?.current,
    );

    try {
      await deleteCurrentSession();
    } finally {
      await clearSession();
    }
  }

  async function refreshSession(
    input: SdkworkAuthRefreshSessionInput = {},
  ): Promise<SdkworkAuthSession> {
    const client = getClient();
    const refreshSessionResource = callRequiredMethod(
      client.auth.sessions?.refresh,
      "auth.sessions.refresh",
      formatMethodUnavailable("auth.sessions.refresh"),
      client.auth.sessions,
    );
    const storedSession = await readSession();
    const refreshToken = normalizeOptionalString(input.refreshToken)
      || normalizeOptionalString(storedSession.refreshToken);
    try {
      const loginData = unwrapAppSdkResponse<SdkworkRemoteLoginData>(
        await refreshSessionResource(refreshToken ? { refreshToken } : {}),
        copy.service.signInFailed,
      );

      return enrichSessionWithProfile(client, loginData, { preserveRefreshToken: true });
    } catch (error) {
      await clearSession();
      throw error;
    }
  }

  async function updateCurrentSession(
    input: SdkworkAuthUpdateCurrentSessionInput = {},
  ): Promise<SdkworkAuthSession> {
    const client = getClient();
    const updateCurrentSessionResource = callRequiredMethod(
      client.auth.sessions?.current?.update,
      "auth.sessions.current.update",
      formatMethodUnavailable("auth.sessions.current.update"),
      client.auth.sessions?.current,
    );
    const loginData = unwrapAppSdkResponse<SdkworkRemoteLoginData>(
      await updateCurrentSessionResource(input),
      copy.service.signInFailed,
    );

    return enrichSessionWithProfile(client, loginData, { preserveRefreshToken: true });
  }

  async function sendVerifyCode(input: SdkworkAuthSendVerifyCodeInput): Promise<void> {
    const client = getClient();
    const createVerificationCode = callRequiredMethod(
      client.messaging?.verificationCodes?.create,
      "messaging.verificationCodes.create",
      formatMethodUnavailable("messaging.verificationCodes.create"),
      client.messaging?.verificationCodes,
    );
    await createVerificationCode({
      scene: mapScene(input.scene),
      target: input.target.trim(),
      verifyType: mapVerifyType(input.verifyType),
    });
  }

  async function verifyCode(input: SdkworkAuthVerifyCodeInput): Promise<boolean> {
    const client = getClient();
    return verifyCodeWithClient(client, input);
  }

  async function verifyCodeWithClient(
    client: SdkworkAuthClient,
    input: SdkworkAuthVerifyCodeInput,
  ): Promise<boolean> {
    const verifyVerificationCode = callRequiredMethod(
      client.messaging?.verificationCodes?.verify,
      "messaging.verificationCodes.verify",
      formatMethodUnavailable("messaging.verificationCodes.verify"),
      client.messaging?.verificationCodes,
    );
    const result = unwrapAppSdkResponse<{ valid?: boolean; verified?: boolean }>(
      await verifyVerificationCode({
        code: input.code.trim(),
        scene: mapScene(input.scene),
        target: input.target.trim(),
        verifyType: mapVerifyType(input.verifyType),
      }),
      copy.service.verifyCodeFailed,
    );

    return Boolean(result?.verified ?? result?.valid);
  }

  async function ensureVerificationCodeAccepted(
    client: SdkworkAuthClient,
    input: SdkworkAuthVerifyCodeInput,
  ): Promise<void> {
    if (!await verifyCodeWithClient(client, input)) {
      throw new Error(copy.service.verifyCodeFailed);
    }
  }

  function resolveRegistrationVerificationRequest(
    input: SdkworkAuthRegisterInput,
    code: string,
  ): SdkworkAuthVerifyCodeInput {
    const verifyType = input.channel === "PHONE" || (!input.channel && normalizeOptionalString(input.phone))
      ? "PHONE"
      : "EMAIL";
    const target = verifyType === "PHONE"
      ? normalizeOptionalString(input.phone)
      : normalizeOptionalString(input.email);
    if (!target) {
      throw new Error(copy.service.verifyCodeFailed);
    }

    return {
      code,
      scene: "REGISTER",
      target,
      verifyType,
    };
  }

  async function requestPasswordReset(
    input: SdkworkAuthPasswordResetRequestInput,
  ): Promise<void> {
    const client = getClient();
    const createPasswordResetRequest = callRequiredMethod(
      client.auth.passwordResetRequests?.create,
      "auth.passwordResetRequests.create",
      formatMethodUnavailable("auth.passwordResetRequests.create"),
      client.auth.passwordResetRequests,
    );
    await createPasswordResetRequest({
      account: input.account.trim(),
      channel: input.channel,
    });
  }

  async function resetPassword(input: SdkworkAuthPasswordResetInput): Promise<void> {
    assertMatchingPasswordConfirmation(
      input.newPassword,
      input.confirmPassword,
      copy.validation.passwordsDoNotMatch,
    );

    const client = getClient();
    const createPasswordReset = callRequiredMethod(
      client.auth.passwordResets?.create,
      "auth.passwordResets.create",
      formatMethodUnavailable("auth.passwordResets.create"),
      client.auth.passwordResets,
    );
    await createPasswordReset({
      account: input.account.trim(),
      code: input.code.trim(),
      confirmPassword: input.confirmPassword,
      newPassword: input.newPassword,
    });
  }

  async function getOAuthAuthorizationUrl(
    input: SdkworkAuthOAuthAuthorizationInput,
  ): Promise<string> {
    const client = getClient();
    const createOAuthAuthorizationUrl = callRequiredMethod(
      client.oauth?.authorizationUrls?.create,
      "oauth.authorizationUrls.create",
      formatMethodUnavailable("oauth.authorizationUrls.create"),
      client.oauth?.authorizationUrls,
    );
    const oauthUrl = unwrapAppSdkResponse<{ authUrl?: string; url?: string }>(
      await createOAuthAuthorizationUrl(
        buildOAuthAuthorizationUrlCreatePayload(input, copy.service.oauthProviderRequired),
      ),
      copy.service.startOAuthFailed,
    );
    const authUrl = normalizeOptionalString(oauthUrl?.authUrl) || normalizeOptionalString(oauthUrl?.url);

    if (!authUrl) {
      throw new Error(copy.service.oauthAuthorizationUrlMissing);
    }

    return authUrl;
  }

  async function signInWithOAuth(
    input: SdkworkAuthOAuthLoginInput,
  ): Promise<SdkworkAuthSession> {
    const client = getClient();
    const createOAuthSession = callRequiredMethod(
      client.oauth?.sessions?.create,
      "oauth.sessions.create",
      formatMethodUnavailable("oauth.sessions.create"),
      client.oauth?.sessions,
    );
    const loginData = unwrapAppSdkResponse<SdkworkRemoteLoginData>(
      await createOAuthSession({
        code: input.code.trim(),
        deviceId: normalizeOptionalString(input.deviceId),
        deviceType: normalizeOptionalString(input.deviceType),
        provider: mapSocialProvider(input.provider, copy.service.oauthProviderRequired),
        redirectUri: normalizeOptionalString(input.redirectUri),
        state: normalizeOptionalString(input.state),
      }),
      copy.service.completeOAuthLoginFailed,
    );

    return enrichSessionWithProfile(client, loginData);
  }

  async function signInWithSessionBridge(
    _input: SdkworkAuthSessionBridgeLoginInput,
  ): Promise<SdkworkAuthSession> {
    throw new Error(formatMethodUnavailable("auth.sessionBridgeLogin"));
  }

  async function generateLoginQrCode(
    input: SdkworkAuthLoginQrCodeCreateInput = {},
  ): Promise<SdkworkAuthLoginQrCode> {
    const client = getClient();
    const createDeviceAuthorization = callRequiredMethod(
      client.oauth?.deviceAuthorizations?.create,
      "oauth.deviceAuthorizations.create",
      formatMethodUnavailable("oauth.deviceAuthorizations.create"),
      client.oauth?.deviceAuthorizations,
    );
    const purpose = resolveQrAuthPurpose(input);
    const session = unwrapAppSdkResponse<SdkworkRemotePlatformQrAuthSession>(
      await createDeviceAuthorization({
        purpose,
      }),
      copy.service.generateQrCodeFailed,
    );
    return toPlatformLoginQrCode(session);
  }

  async function checkLoginQrCodeStatus(
    sessionKey: string,
    options: SdkworkAuthLoginQrCodeCheckOptions = {},
  ): Promise<SdkworkAuthLoginQrCodeStatusResult> {
    const client = getClient();
    const retrieveDeviceAuthorization = callRequiredMethod(
      client.oauth?.deviceAuthorizations?.retrieve,
      "oauth.deviceAuthorizations.retrieve",
      formatMethodUnavailable("oauth.deviceAuthorizations.retrieve"),
      client.oauth?.deviceAuthorizations,
    );
    let qrCodeStatus: SdkworkRemotePlatformQrAuthSession;
    try {
      qrCodeStatus = unwrapAppSdkResponse<SdkworkRemotePlatformQrAuthSession>(
        await retrieveDeviceAuthorization(sessionKey.trim()),
        copy.service.checkQrStatusFailed,
      );
    } catch (error) {
      if (isExpiredQrLoginCodeError(error)) {
        return {
          status: "expired",
          user: undefined,
        };
      }
      throw error;
    }
    const baseResult = toPlatformLoginQrCodeStatus(qrCodeStatus);
    if (baseResult.organizationSelection) {
      return baseResult;
    }

    let sessionData = resolveQrAuthSessionData(qrCodeStatus);
    if (
      !sessionData
      && baseResult.status === "confirmed"
      && qrCodeStatus.sessionReady === true
      && normalizeOptionalString(options.pollSecret)
    ) {
      const createSessionExchange = callRequiredMethod(
        client.oauth?.deviceAuthorizations?.sessionExchanges?.create,
        "oauth.deviceAuthorizations.sessionExchanges.create",
        formatMethodUnavailable("oauth.deviceAuthorizations.sessionExchanges.create"),
        client.oauth?.deviceAuthorizations?.sessionExchanges,
      );
      sessionData = unwrapAppSdkResponse<SdkworkRemoteLoginData>(
        await createSessionExchange(sessionKey.trim(), {
          pollSecret: options.pollSecret?.trim(),
        }),
        copy.service.checkQrStatusFailed,
      );
    }

    if (baseResult.status !== "confirmed" || !sessionData) {
      return baseResult;
    }

    const session = await enrichSessionWithProfile(client, sessionData);
    return {
      ...baseResult,
      session,
      user: session.user,
    };
  }

  async function callbackLoginQrCode(
    input: SdkworkAuthLoginQrCodeCallbackInput,
  ): Promise<SdkworkAuthLoginQrCodeStatusResult> {
    const sessionKey = input.sessionKey.trim();
    const client = getClient();
    const createDeviceAuthorizationScan = callRequiredMethod(
      client.oauth?.deviceAuthorizations?.scans?.create,
      "oauth.deviceAuthorizations.scans.create",
      formatMethodUnavailable("oauth.deviceAuthorizations.scans.create"),
      client.oauth?.deviceAuthorizations?.scans,
    );
    const qrCodeStatus = unwrapAppSdkResponse<SdkworkRemotePlatformQrAuthSession>(
      await createDeviceAuthorizationScan(sessionKey, {
        ...(input.accountId ? { accountId: input.accountId.trim() } : {}),
        ...(input.entryId ? { entryId: input.entryId.trim() } : {}),
        ...(input.externalUserId ? { externalUserId: input.externalUserId.trim() } : {}),
        ...(input.ipHash ? { ipHash: input.ipHash.trim() } : {}),
        ...(input.pollSecret ? { pollSecret: input.pollSecret.trim() } : {}),
        scanSource: resolveQrScanSource(input.scanSource),
        ...(input.userAgent ? { userAgent: input.userAgent.trim() } : {}),
      }),
      copy.service.checkQrStatusFailed,
    );

    return toPlatformLoginQrCodeStatus(qrCodeStatus, "scanned");
  }

  async function confirmLoginQrCode(
    input: SdkworkAuthLoginQrCodeConfirmInput,
  ): Promise<SdkworkAuthLoginQrCodeStatusResult> {
    const sessionKey = input.sessionKey.trim();
    const username = normalizeQrCredential(input.username, "username");
    const password = normalizeQrCredential(input.password, "password");
    const client = getClient();
    const completeDeviceAuthorizationPassword = callRequiredMethod(
      client.oauth?.deviceAuthorizations?.passwordCompletions?.create,
      "oauth.deviceAuthorizations.passwordCompletions.create",
      formatMethodUnavailable("oauth.deviceAuthorizations.passwordCompletions.create"),
      client.oauth?.deviceAuthorizations?.passwordCompletions,
    );
    const completion = unwrapAppSdkResponse<SdkworkRemotePlatformQrAuthSession | SdkworkRemoteLoginData>(
      await completeDeviceAuthorizationPassword(sessionKey, {
        ...(input.channel ? { channel: input.channel } : {}),
        ...(input.confirmPassword ? { confirmPassword: input.confirmPassword } : {}),
        ...(input.email ? { email: input.email.trim() } : {}),
        password,
        ...(input.phone ? { phone: input.phone.trim() } : {}),
        username,
        ...(input.verificationCode ? { verificationCode: input.verificationCode.trim() } : {}),
      }),
      copy.service.checkQrStatusFailed,
    );
    const sessionData = resolveQrAuthSessionData(completion);

    if (sessionData) {
      const session = await enrichSessionWithProfile(client, sessionData);
      return {
        session,
        status: "confirmed",
        user: session.user,
      };
    }

    return toPlatformLoginQrCodeStatus(completion as SdkworkRemotePlatformQrAuthSession, "confirmed");
  }

  async function completeOAuthAuthorization(
    authorizationStateId: string,
  ): Promise<SdkworkAuthOAuthAuthorizationCompletion> {
    const normalizedStateId = authorizationStateId.trim();
    if (!normalizedStateId) {
      throw new Error(copy.service.completeOAuthLoginFailed);
    }

    const client = getClient();
    const createAuthorizationCompletion = callRequiredMethod(
      client.oauth?.authorizations?.completions?.create,
      "oauth.authorizations.completions.create",
      formatMethodUnavailable("oauth.authorizations.completions.create"),
      client.oauth?.authorizations?.completions,
    );
    const completion = unwrapAppSdkResponse<{
      authorizationCode?: string;
      redirectUrl?: string;
    }>(
      await createAuthorizationCompletion(normalizedStateId, {}),
      copy.service.completeOAuthLoginFailed,
    );
    const redirectUrl = completion.redirectUrl?.trim();
    if (!redirectUrl) {
      throw new Error(copy.service.completeOAuthLoginFailed);
    }

    return {
      authorizationCode: completion.authorizationCode,
      redirectUrl,
    };
  }

  async function getCurrentUser(): Promise<SdkworkAuthUser | null> {
    const client = getClient();
    if (!client.iam?.users?.current?.retrieve) {
      return null;
    }

    const profile = unwrapAppSdkResponse<SdkworkRemoteIdentity>(
      await client.iam.users.current.retrieve(),
      copy.service.currentUserProfileLoadFailed,
    );

    return toAuthUser(profile) ?? null;
  }

  async function getCurrentSession(): Promise<SdkworkAuthSession | null> {
    const storedSession = await readSession();
    const accessToken = normalizeOptionalString(storedSession.accessToken);
    const authToken = normalizeOptionalString(storedSession.authToken);

    if (!accessToken || !authToken) {
      return null;
    }

    const client = getClient();
    if (!client.auth.sessions?.current?.retrieve) {
      await clearSession();
      return null;
    }

    try {
      const loginData = unwrapAppSdkResponse<SdkworkRemoteLoginData>(
        await client.auth.sessions.current.retrieve(),
        copy.common.requestFailed,
      );
      return enrichSessionWithProfile(client, loginData, { preserveRefreshToken: true });
    } catch {
      await clearSession();
      return null;
    }
  }

  return {
    callbackLoginQrCode,
    checkLoginQrCodeStatus,
    confirmLoginQrCode,
    completeOAuthAuthorization,
    generateLoginQrCode,
    getCurrentSession,
    getCurrentUser,
    getVerificationPolicy,
    listOAuthProviders,
    getOAuthAuthorizationUrl,
    register,
    requestPasswordReset,
    resetPassword,
    refreshSession,
    selectLoginContext,
    selectOrganization,
    selectPersonalLogin,
    sendVerifyCode,
    signIn,
    signInWithEmailCode,
    signInWithOAuth,
    signInWithPhoneCode,
    signInWithSessionBridge,
    signOut,
    updateCurrentSession,
    verifyCode,
  };
}

async function commitPcReactRuntimeSession(
  session: SdkworkAuthStoredSession,
  readSession: () => Promise<SdkworkAuthStoredSession> | SdkworkAuthStoredSession,
  options?: SdkworkAuthSessionCommitOptions,
): Promise<SdkworkAuthStoredSession> {
  const committedSession = await resolveCommittedSession(session, readSession, options);
  await persistPcReactRuntimeSession(committedSession);
  return committedSession;
}

function callCommitSession(
  commitSession: NonNullable<CreateSdkworkAuthServiceOptions["commitSession"]>,
  session: SdkworkAuthStoredSession,
  options?: SdkworkAuthSessionCommitOptions,
): Promise<SdkworkAuthStoredSession | void> | SdkworkAuthStoredSession | void {
  return options ? commitSession(session, options) : commitSession(session);
}

async function commitCustomSessionWithFallback(
  commitSession: NonNullable<CreateSdkworkAuthServiceOptions["commitSession"]>,
  session: SdkworkAuthStoredSession,
  readSession: () => Promise<SdkworkAuthStoredSession> | SdkworkAuthStoredSession,
  options?: SdkworkAuthSessionCommitOptions,
): Promise<SdkworkAuthStoredSession> {
  const fallbackSession = await resolveCommittedSession(session, readSession, options);
  const committedSession = await callCommitSession(commitSession, fallbackSession, options);
  return normalizeStoredSession({
    ...fallbackSession,
    ...(committedSession ? normalizeStoredSession(committedSession) : {}),
  });
}

async function resolveCommittedSession(
  session: SdkworkAuthStoredSession,
  readSession: () => Promise<SdkworkAuthStoredSession> | SdkworkAuthStoredSession,
  options?: SdkworkAuthSessionCommitOptions,
): Promise<SdkworkAuthStoredSession> {
  const normalizedSession = normalizeStoredSession(session);
  if (normalizedSession.refreshToken || !options?.preserveRefreshToken) {
    return normalizedSession;
  }

  const storedSession = await readSession();
  return normalizeStoredSession({
    ...normalizedSession,
    refreshToken: normalizeOptionalString(storedSession.refreshToken),
  });
}

function normalizeStoredSession(session: SdkworkAuthStoredSession): SdkworkAuthStoredSession {
  const context = normalizeAuthAppContext(session.context);
  return {
    ...(normalizeOptionalString(session.accessToken) ? { accessToken: normalizeOptionalString(session.accessToken) } : {}),
    ...(normalizeOptionalString(session.authToken) ? { authToken: normalizeOptionalString(session.authToken) } : {}),
    ...(context ? { context } : {}),
    ...(normalizeOptionalString(session.refreshToken) ? { refreshToken: normalizeOptionalString(session.refreshToken) } : {}),
    ...(normalizeOptionalString(session.sessionId) ? { sessionId: normalizeOptionalString(session.sessionId) } : {}),
  };
}
