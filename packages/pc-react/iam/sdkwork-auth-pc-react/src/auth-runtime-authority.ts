import type {
  SdkworkCanonicalAuthAuthorityService,
  SdkworkCanonicalAuthEmailCodeLoginRequest,
  SdkworkCanonicalAuthLoginRequest,
  SdkworkCanonicalAuthMetadataLike,
  SdkworkCanonicalAuthPasswordResetChallengeRequest,
  SdkworkCanonicalAuthPasswordResetRequest,
  SdkworkCanonicalAuthPhoneCodeLoginRequest,
  SdkworkCanonicalAuthRegisterRequest,
  SdkworkCanonicalAuthSendVerifyCodeRequest,
  SdkworkCanonicalAuthSessionExchangeRequest,
} from "./auth-authority.ts";
import type { SdkworkMediaResource } from "@sdkwork/runtime-bootstrap";
import { coalesce } from "@sdkwork/utils";
import {
  assertSdkworkAuthSession,
  createSdkworkAuthUserFromIdentity,
  type SdkworkAuthSession,
  type SdkworkAuthUser,
} from "./auth-service.ts";

export interface SdkworkCanonicalRuntimeSessionLike<TAuthenticatedUser> {
  accessToken?: string;
  authToken?: string;
  refreshToken?: string;
  sessionId?: string;
  user: TAuthenticatedUser;
}

export interface SdkworkCanonicalRuntimeProfileLike {
  avatar?: SdkworkMediaResource;
  displayName?: string;
  email?: string;
  userId?: string;
}

export interface SdkworkCanonicalRuntimeAuthRetryOptions {
  shouldRetry?: (error: unknown) => boolean;
}

export interface SdkworkCanonicalRuntimeAuthServiceOptions<
  TAuthenticatedUser,
  TMetadata extends SdkworkCanonicalAuthMetadataLike,
  TSession,
  TProfile,
> {
  authConfigCacheTtlMs?: number;
  clearSessionToken: () => void;
  createUnavailableError?: () => Error;
  currentUserCacheTtlMs?: number;
  exchangeSession?: (
    request: SdkworkCanonicalAuthSessionExchangeRequest,
  ) => Promise<TSession>;
  execute?: <T>(
    task: () => Promise<T>,
    options?: SdkworkCanonicalRuntimeAuthRetryOptions,
  ) => Promise<T>;
  getConfig?: () => Promise<TMetadata | null>;
  getProfile?: () => Promise<TProfile | null>;
  isRouteUnavailable?: (error: unknown) => boolean;
  isSessionRejected?: (error: unknown) => boolean;
  isTransientError?: (error: unknown) => boolean;
  mapAuthSession?: (
    session: TSession,
    user: TAuthenticatedUser,
  ) => SdkworkAuthSession;
  mapAuthUser?: (user: TAuthenticatedUser) => SdkworkAuthUser;
  login: (request: SdkworkCanonicalAuthLoginRequest) => Promise<TSession>;
  logout?: () => Promise<void>;
  logoutSession?: () => Promise<void>;
  mapProfileUser: (profile: TProfile) => TAuthenticatedUser;
  mapSessionUser: (session: TSession) => TAuthenticatedUser;
  readSessionToken: () => string | null;
  register: (request: SdkworkCanonicalAuthRegisterRequest) => Promise<TSession>;
  requestPasswordReset?: (
    request: SdkworkCanonicalAuthPasswordResetChallengeRequest,
  ) => Promise<void>;
  resetPassword?: (
    request: SdkworkCanonicalAuthPasswordResetRequest,
  ) => Promise<void>;
  resolveSessionToken?: (session: TSession) => string | null | undefined;
  sendVerifyCode?: (
    request: SdkworkCanonicalAuthSendVerifyCodeRequest,
  ) => Promise<void>;
  signInWithEmailCode?: (
    request: SdkworkCanonicalAuthEmailCodeLoginRequest,
  ) => Promise<TSession>;
  signInWithPhoneCode?: (
    request: SdkworkCanonicalAuthPhoneCodeLoginRequest,
  ) => Promise<TSession>;
  supportsLocalCredentials?: (metadata: TMetadata | null) => boolean;
  writeSessionToken: (token: string) => string;
}

const DEFAULT_AUTH_CONFIG_CACHE_TTL_MS = 60_000;
const DEFAULT_CURRENT_USER_CACHE_TTL_MS = 10_000;

function normalizeOptionalText(value: unknown): string | undefined {
  return typeof value === "string" ? coalesce(value) : undefined;
}

function createDefaultUnavailableError(): Error {
  return new Error(
    "Auth service requires a bound runtime with canonical user-center APIs.",
  );
}

function createDefaultExecute() {
  return async <T>(task: () => Promise<T>): Promise<T> => task();
}

function createDefaultSessionTokenResolver<TSession>(
  session: TSession,
): string | null {
  if (!session || typeof session !== "object") {
    return null;
  }

  const token = normalizeOptionalText(
    (session as { sessionId?: string | null }).sessionId,
  );
  return token ?? null;
}

function mapDefaultAuthUser(user: unknown): SdkworkAuthUser {
  const identity = user && typeof user === "object"
    ? user as {
        avatar?: SdkworkMediaResource;
        displayName?: string;
        email?: string;
        firstName?: string;
        id?: string;
        initials?: string;
        lastName?: string;
        name?: string;
        userId?: string;
        username?: string;
      }
    : {};

  return createSdkworkAuthUserFromIdentity({
    avatar: identity.avatar,
    displayName: normalizeOptionalText(identity.displayName)
      || normalizeOptionalText(identity.name),
    email: normalizeOptionalText(identity.email),
    firstName: normalizeOptionalText(identity.firstName),
    id: normalizeOptionalText(identity.id)
      || normalizeOptionalText(identity.userId),
    initials: normalizeOptionalText(identity.initials),
    lastName: normalizeOptionalText(identity.lastName),
    username: normalizeOptionalText(identity.username)
      || normalizeOptionalText(identity.email),
  });
}

function mapDefaultAuthSession<TSession, TAuthenticatedUser>(
  session: TSession,
  user: TAuthenticatedUser,
  mapAuthUser?: (user: TAuthenticatedUser) => SdkworkAuthUser,
): SdkworkAuthSession {
  const remote = session && typeof session === "object"
    ? session as {
        accessToken?: unknown;
        authToken?: unknown;
        refreshToken?: unknown;
      }
    : {};
  return assertSdkworkAuthSession({
    accessToken: normalizeOptionalText(remote.accessToken),
    authToken: normalizeOptionalText(remote.authToken),
    ...(normalizeOptionalText(remote.refreshToken)
      ? { refreshToken: normalizeOptionalText(remote.refreshToken) }
      : {}),
    user: mapAuthUser ? mapAuthUser(user) : mapDefaultAuthUser(user),
  });
}

function normalizeLoginRequest(
  request: SdkworkCanonicalAuthLoginRequest | string,
  password?: string,
): SdkworkCanonicalAuthLoginRequest {
  if (typeof request === "string") {
    const account = request.trim();
    return {
      account,
      email: account,
      password,
    };
  }

  const account = coalesce(request.account, request.email) ?? "";

  return {
    account,
    email: coalesce(request.email) ?? account,
    password: request.password ?? password,
  };
}

function normalizeRegisterRequest(
  request: SdkworkCanonicalAuthRegisterRequest,
): SdkworkCanonicalAuthRegisterRequest {
  const normalizedName = coalesce(request.name, request.username);
  const verificationCode = normalizeOptionalText(request.verificationCode);

  return {
    channel: request.channel,
    confirmPassword: request.confirmPassword || undefined,
    email: normalizeOptionalText(request.email),
    ...(normalizedName ? { name: normalizedName, username: normalizedName } : {}),
    password: request.password,
    phone: normalizeOptionalText(request.phone),
    ...(verificationCode ? { verificationCode } : {}),
  };
}

function normalizeEmailCodeLoginRequest(
  request: SdkworkCanonicalAuthEmailCodeLoginRequest,
): SdkworkCanonicalAuthEmailCodeLoginRequest {
  return {
    appVersion: normalizeOptionalText(request.appVersion),
    code: request.code.trim(),
    deviceId: normalizeOptionalText(request.deviceId),
    deviceName: normalizeOptionalText(request.deviceName),
    deviceType: request.deviceType,
    email: request.email.trim(),
  };
}

function normalizePhoneCodeLoginRequest(
  request: SdkworkCanonicalAuthPhoneCodeLoginRequest,
): SdkworkCanonicalAuthPhoneCodeLoginRequest {
  return {
    appVersion: normalizeOptionalText(request.appVersion),
    code: request.code.trim(),
    deviceId: normalizeOptionalText(request.deviceId),
    deviceName: normalizeOptionalText(request.deviceName),
    deviceType: request.deviceType,
    phone: request.phone.trim(),
  };
}

function normalizeSendVerifyCodeRequest(
  request: SdkworkCanonicalAuthSendVerifyCodeRequest,
): SdkworkCanonicalAuthSendVerifyCodeRequest {
  return {
    scene: request.scene,
    target: request.target.trim(),
    verifyType: request.verifyType,
  };
}

function normalizePasswordResetChallengeRequest(
  request: SdkworkCanonicalAuthPasswordResetChallengeRequest,
): SdkworkCanonicalAuthPasswordResetChallengeRequest {
  return {
    account: request.account.trim(),
    channel: request.channel,
  };
}

function normalizePasswordResetRequest(
  request: SdkworkCanonicalAuthPasswordResetRequest,
): SdkworkCanonicalAuthPasswordResetRequest {
  return {
    account: request.account.trim(),
    code: request.code.trim(),
    confirmPassword: request.confirmPassword || undefined,
    newPassword: request.newPassword,
  };
}

function normalizeSessionExchangeRequest(
  request: SdkworkCanonicalAuthSessionExchangeRequest,
): SdkworkCanonicalAuthSessionExchangeRequest {
  return {
    avatar: request.avatar,
    bridgeToken: normalizeOptionalText(request.bridgeToken),
    email: request.email.trim(),
    name: normalizeOptionalText(request.name),
    providerKey: normalizeOptionalText(request.providerKey),
    subject: normalizeOptionalText(request.subject),
    userId: normalizeOptionalText(request.userId),
  };
}

export function createSdkworkCanonicalRuntimeAuthAuthorityService<
  TAuthenticatedUser,
  TMetadata extends SdkworkCanonicalAuthMetadataLike = SdkworkCanonicalAuthMetadataLike,
  TSession extends SdkworkCanonicalRuntimeSessionLike<TAuthenticatedUser> =
    SdkworkCanonicalRuntimeSessionLike<TAuthenticatedUser>,
  TProfile extends SdkworkCanonicalRuntimeProfileLike =
    SdkworkCanonicalRuntimeProfileLike,
>(
  options: SdkworkCanonicalRuntimeAuthServiceOptions<
    TAuthenticatedUser,
    TMetadata,
    TSession,
    TProfile
  >,
): SdkworkCanonicalAuthAuthorityService<TAuthenticatedUser, TMetadata> {
  const execute = options.execute ?? createDefaultExecute();
  const createUnavailableError =
    options.createUnavailableError ?? createDefaultUnavailableError;
  const isRouteUnavailable =
    options.isRouteUnavailable
    ?? ((error: unknown) =>
      error instanceof Error && error.message.includes(" -> 404"));
  const isSessionRejected =
    options.isSessionRejected
    ?? ((error: unknown) =>
      error instanceof Error
      && (error.message.includes(" -> 401") || error.message.includes(" -> 403")));
  const isTransientError = options.isTransientError ?? (() => false);
  const resolveSessionToken =
    options.resolveSessionToken ?? createDefaultSessionTokenResolver<TSession>;
  const supportsLocalCredentials =
    options.supportsLocalCredentials
    ?? ((metadata: TMetadata | null) => metadata?.supportsLocalCredentials ?? true);

  let authConfig: TMetadata | null = null;
  let authConfigExpiresAt = 0;
  let authConfigInflight: Promise<TMetadata | null> | null = null;
  let currentUser: TAuthenticatedUser | null = null;
  let currentUserExpiresAt = 0;
  let currentUserInflight: Promise<TAuthenticatedUser | null> | null = null;

  function applySession(session: TSession): SdkworkAuthSession {
    const nextUser = options.mapSessionUser(session);
    const authSession = assertSdkworkAuthSession(
      options.mapAuthSession
        ? options.mapAuthSession(session, nextUser)
        : mapDefaultAuthSession(session, nextUser, options.mapAuthUser),
    );
    const sessionToken = resolveSessionToken(session);
    if (sessionToken) {
      options.writeSessionToken(sessionToken);
    }

    currentUser = nextUser;
    currentUserExpiresAt =
      Date.now() + (options.currentUserCacheTtlMs ?? DEFAULT_CURRENT_USER_CACHE_TTL_MS);
    return authSession;
  }

  function applyProfile(profile: TProfile): TAuthenticatedUser {
    currentUser = options.mapProfileUser(profile);
    currentUserExpiresAt =
      Date.now() + (options.currentUserCacheTtlMs ?? DEFAULT_CURRENT_USER_CACHE_TTL_MS);
    return currentUser;
  }

  async function getUserCenterConfig(): Promise<TMetadata | null> {
    if (!options.getConfig) {
      return null;
    }

    const now = Date.now();
    if (authConfigInflight) {
      return authConfigInflight;
    }

    if (authConfigExpiresAt > now) {
      return authConfig;
    }

    const request = (async () => {
      try {
        const config = await execute(() => options.getConfig!());
        authConfig = config ?? null;
        authConfigExpiresAt =
          Date.now() + (options.authConfigCacheTtlMs ?? DEFAULT_AUTH_CONFIG_CACHE_TTL_MS);
        return authConfig;
      } catch (error) {
        if (isRouteUnavailable(error)) {
          authConfig = null;
          authConfigExpiresAt =
            Date.now()
            + (options.authConfigCacheTtlMs ?? DEFAULT_AUTH_CONFIG_CACHE_TTL_MS);
          return null;
        }

        throw error;
      }
    })().finally(() => {
      if (authConfigInflight === request) {
        authConfigInflight = null;
      }
    });

    authConfigInflight = request;
    return request;
  }

  async function assertLocalCredentialsAvailable(): Promise<void> {
    const config = await getUserCenterConfig();
    if (!supportsLocalCredentials(config)) {
      throw new Error(
        `User center provider "${config?.providerKey ?? "unknown"}" does not accept local credentials.`,
      );
    }
  }

  return {
    async exchangeUserCenterSession(
      request: SdkworkCanonicalAuthSessionExchangeRequest,
    ): Promise<SdkworkAuthSession> {
      if (!options.exchangeSession) {
        throw createUnavailableError();
      }

      const session = await execute(() =>
        options.exchangeSession!(normalizeSessionExchangeRequest(request)));
      return applySession(session);
    },

    getUserCenterConfig,

    async getCurrentUser(): Promise<TAuthenticatedUser | null> {
      if (!options.getProfile) {
        currentUser = null;
        currentUserExpiresAt = 0;
        return null;
      }

      if (!options.readSessionToken()) {
        currentUser = null;
        currentUserExpiresAt = 0;
        return null;
      }

      const now = Date.now();
      if (currentUser && currentUserExpiresAt > now) {
        return currentUser;
      }

      if (currentUserInflight) {
        return currentUserInflight;
      }

      const request = (async () => {
        let profile: TProfile | null = null;
        try {
          profile = await execute(() => options.getProfile!(), {
            shouldRetry: (error) =>
              isTransientError(error) && !isSessionRejected(error),
          });
        } catch (error) {
          if (isRouteUnavailable(error) || isSessionRejected(error)) {
            options.clearSessionToken();
            currentUser = null;
            currentUserExpiresAt = 0;
            return null;
          }

          if (isTransientError(error)) {
            return currentUser;
          }

          throw error;
        }

        if (!profile) {
          options.clearSessionToken();
          currentUser = null;
          currentUserExpiresAt = 0;
          return null;
        }

        return applyProfile(profile);
      })().finally(() => {
        if (currentUserInflight === request) {
          currentUserInflight = null;
        }
      });

      currentUserInflight = request;
      return request;
    },

    async login(
      request: SdkworkCanonicalAuthLoginRequest | string,
      password?: string,
    ): Promise<SdkworkAuthSession> {
      await assertLocalCredentialsAvailable();
      const session = await execute(() =>
        options.login(normalizeLoginRequest(request, password)));
      return applySession(session);
    },

    async logout(): Promise<void> {
      try {
        if (options.logoutSession) {
          try {
            await options.logoutSession();
          } catch (error) {
            if (!isRouteUnavailable(error)) {
              throw error;
            }
          }
        } else if (options.logout) {
          try {
            await options.logout();
          } catch (error) {
            if (!isRouteUnavailable(error)) {
              throw error;
            }
          }
        }
      } finally {
        options.clearSessionToken();
        currentUser = null;
        currentUserExpiresAt = 0;
      }
    },

    async register(
      request: SdkworkCanonicalAuthRegisterRequest,
    ): Promise<SdkworkAuthSession> {
      await assertLocalCredentialsAvailable();
      const session = await execute(() =>
        options.register(normalizeRegisterRequest(request)));
      return applySession(session);
    },

    requestPasswordReset: options.requestPasswordReset
      ? async (request: SdkworkCanonicalAuthPasswordResetChallengeRequest) => {
          await assertLocalCredentialsAvailable();
          await execute(() =>
            options.requestPasswordReset!(
              normalizePasswordResetChallengeRequest(request),
            ));
        }
      : undefined,

    resetPassword: options.resetPassword
      ? async (request: SdkworkCanonicalAuthPasswordResetRequest) => {
          await assertLocalCredentialsAvailable();
          await execute(() =>
            options.resetPassword!(normalizePasswordResetRequest(request)));
        }
      : undefined,

    sendVerifyCode: options.sendVerifyCode
      ? async (request: SdkworkCanonicalAuthSendVerifyCodeRequest) => {
          await assertLocalCredentialsAvailable();
          await execute(() =>
            options.sendVerifyCode!(normalizeSendVerifyCodeRequest(request)));
        }
      : undefined,

    signInWithEmailCode: options.signInWithEmailCode
      ? async (request: SdkworkCanonicalAuthEmailCodeLoginRequest) => {
          await assertLocalCredentialsAvailable();
          const session = await execute(() =>
            options.signInWithEmailCode!(
              normalizeEmailCodeLoginRequest(request),
            ));
          return applySession(session);
        }
      : undefined,

    signInWithPhoneCode: options.signInWithPhoneCode
      ? async (request: SdkworkCanonicalAuthPhoneCodeLoginRequest) => {
          await assertLocalCredentialsAvailable();
          const session = await execute(() =>
            options.signInWithPhoneCode!(
              normalizePhoneCodeLoginRequest(request),
            ));
          return applySession(session);
        }
      : undefined,
  };
}
