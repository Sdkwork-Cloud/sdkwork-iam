import {
  createSdkworkAuthController,
  type CreateSdkworkAuthControllerOptions,
  type SdkworkAuthController,
} from "./auth-controller.ts";
import { isBlank } from "@sdkwork/utils";
import {
  createSdkworkAuthUserFromIdentity,
  SdkworkAuthOrganizationSelectionRequiredError,
  type SdkworkAuthEmailLoginInput,
  type SdkworkAuthLoginInput,
  type SdkworkAuthLoginQrCode,
  type SdkworkAuthLoginQrCodeCallbackInput,
  type SdkworkAuthLoginQrCodeCheckOptions,
  type SdkworkAuthLoginQrCodeConfirmInput,
  type SdkworkAuthLoginQrCodeCreateInput,
  type SdkworkAuthLoginQrCodeStatusResult,
  type SdkworkAuthOAuthAuthorizationInput,
  type SdkworkAuthOAuthLoginInput,
  type SdkworkAuthLoginContextSelectionInput,
  type SdkworkAuthOrganizationChoice,
  type SdkworkAuthOrganizationSelectionChallenge,
  type SdkworkAuthOrganizationSelectionInput,
  type SdkworkAuthPasswordResetInput,
  type SdkworkAuthPasswordResetRequestInput,
  type SdkworkAuthPhoneLoginInput,
  type SdkworkAuthRefreshSessionInput,
  type SdkworkAuthRegisterInput,
  type SdkworkAuthSendVerifyCodeInput,
  type SdkworkAuthService,
  type SdkworkAuthSession,
  type SdkworkAuthSessionCommitOptions,
  type SdkworkAuthSessionBridgeLoginInput,
  type SdkworkAuthUpdateCurrentSessionInput,
  type SdkworkAuthUser,
  type SdkworkAuthVerifyCodeInput,
} from "./auth-service.ts";
import {
  DEFAULT_SDKWORK_AUTH_VERIFICATION_POLICY,
  normalizeSdkworkAuthOAuthProvider,
  type SdkworkAuthResolvedVerificationPolicy,
} from "./auth-runtime-config.ts";
import { readSdkworkMediaResource } from "@sdkwork/runtime-bootstrap";

export interface SdkworkIamRuntimeAuthStoredSessionLike {
  accessToken?: string;
  authToken?: string;
  expiresAt?: number | string;
  refreshToken?: string;
}

export interface SdkworkIamRuntimeAuthUserLike {
  avatar?: unknown;
  displayName?: unknown;
  email?: unknown;
  firstName?: unknown;
  id?: unknown;
  lastName?: unknown;
  name?: unknown;
  nickname?: unknown;
  userId?: unknown;
  username?: unknown;
}

export interface SdkworkIamRuntimeAuthSessionLike
  extends SdkworkIamRuntimeAuthStoredSessionLike {
  context?: unknown;
  sessionId?: string;
  user?: SdkworkIamRuntimeAuthUserLike;
}

export interface SdkworkIamRuntimeQrContentLike {
  content?: unknown;
  mode?: unknown;
}

export interface SdkworkIamRuntimeQrAuthSessionLike extends SdkworkAuthLoginQrCodeStatusResult {
  description?: unknown;
  deviceAuthorizationId?: unknown;
  expireTime?: unknown;
  expiresAt?: unknown;
  fallbackUrl?: unknown;
  id?: unknown;
  qrCode?: unknown;
  qrContent?: SdkworkIamRuntimeQrContentLike | unknown;
  sessionKey?: unknown;
  title?: unknown;
  type?: unknown;
}

export interface SdkworkIamRuntimeAuthRuntimeLike {
  contextStore?: {
    clear?: () => Promise<void> | void;
  };
  service: {
    auth: {
      passwordResetRequests: {
        create: (body: Record<string, unknown>) => Promise<unknown>;
      };
      passwordResets: {
        create: (body: Record<string, unknown>) => Promise<unknown>;
      };
      registrations: {
        create: (body: Record<string, unknown>) => Promise<SdkworkIamRuntimeAuthSessionLike>;
      };
      sessions: {
        create: (body: Record<string, unknown>) => Promise<SdkworkIamRuntimeAuthSessionLike>;
        current: {
          delete: () => Promise<void>;
          retrieve: () => Promise<SdkworkIamRuntimeAuthSessionLike>;
          update?: (body?: Record<string, unknown>) => Promise<SdkworkIamRuntimeAuthSessionLike>;
        };
        loginContextSelection?: {
          create?: (body: Record<string, unknown>) => Promise<SdkworkIamRuntimeAuthSessionLike>;
        };
        organizationSelection?: {
          create?: (body: Record<string, unknown>) => Promise<SdkworkIamRuntimeAuthSessionLike>;
        };
        refresh?: (body: Record<string, unknown>) => Promise<SdkworkIamRuntimeAuthSessionLike>;
      };
    };
    oauth?: {
      providers?: {
        list?: () => Promise<unknown>;
      };
      authorizationUrls?: {
        create?: (params?: Record<string, unknown>) => Promise<unknown>;
      };
      sessions?: {
        create?: (body: Record<string, unknown>) => Promise<SdkworkIamRuntimeAuthSessionLike>;
      };
      deviceAuthorizations?: {
        create?: (payload?: Record<string, unknown>) => Promise<SdkworkIamRuntimeQrAuthSessionLike | unknown>;
        retrieve?: (deviceAuthorizationId: string) => Promise<SdkworkIamRuntimeQrAuthSessionLike | unknown>;
        passwordCompletions?: {
          create?: (
            deviceAuthorizationId: string,
            payload: Record<string, unknown>,
          ) => Promise<SdkworkIamRuntimeQrAuthSessionLike | unknown>;
        };
        scans?: {
          create?: (
            deviceAuthorizationId: string,
            payload?: Record<string, unknown>,
          ) => Promise<SdkworkIamRuntimeQrAuthSessionLike | unknown>;
        };
        sessionExchanges?: {
          create?: (
            deviceAuthorizationId: string,
            payload: Record<string, unknown>,
          ) => Promise<unknown>;
        };
      };
    };
    messaging?: {
      verificationCodes?: {
        create?: (body: Record<string, unknown>) => Promise<unknown>;
        verify?: (body: Record<string, unknown>) => Promise<unknown>;
      };
    };
    system?: {
      iam?: {
        verificationPolicy?: {
          retrieve?: () => Promise<unknown>;
        };
      };
    };
    iam: {
      users: {
        current: {
          retrieve: () => Promise<SdkworkIamRuntimeAuthUserLike>;
        };
      };
    };
  };
  tokenStore?: {
    clear?: () => Promise<void> | void;
    get?: () =>
      | Promise<SdkworkIamRuntimeAuthStoredSessionLike>
      | SdkworkIamRuntimeAuthStoredSessionLike;
    set?: (session: SdkworkIamRuntimeAuthStoredSessionLike) => Promise<void> | void;
  };
}

export interface CreateSdkworkIamRuntimeAuthControllerOptions
  extends Omit<CreateSdkworkAuthControllerOptions, "service"> {
  getRuntime: () =>
    | Promise<SdkworkIamRuntimeAuthRuntimeLike>
    | SdkworkIamRuntimeAuthRuntimeLike;
  methodUnavailableMessage?: string;
}

const DEFAULT_METHOD_UNAVAILABLE_MESSAGE =
  "This SDKWork IAM runtime auth method is not available in the current app contract.";
const SESSION_BRIDGE_TOKEN_REQUIRED_MESSAGE = "Session bridge token is required.";
const VERIFICATION_CODE_REJECTED_MESSAGE = "Failed to verify code.";
const PASSWORDS_DO_NOT_MATCH_MESSAGE = "Passwords do not match.";

export function createSdkworkIamRuntimeAuthController(
  options: CreateSdkworkIamRuntimeAuthControllerOptions,
): SdkworkAuthController {
  return createSdkworkAuthController({
    initialState: options.initialState,
    service: createSdkworkIamRuntimeAuthService(options),
  });
}

export function createSdkworkIamRuntimeAuthService(
  options: CreateSdkworkIamRuntimeAuthControllerOptions,
): SdkworkAuthService {
  const methodUnavailableMessage =
    options.methodUnavailableMessage ?? DEFAULT_METHOD_UNAVAILABLE_MESSAGE;
  const readRuntime = () => Promise.resolve(options.getRuntime());

  async function getCurrentSession(): Promise<SdkworkAuthSession | null> {
    const runtime = await readRuntime();
    const storedSession = await readStoredSession(runtime);
    if (runtime.tokenStore?.get && !hasStoredSession(storedSession)) {
      if (hasAnyStoredSessionToken(storedSession)) {
        await clearStoredSession(runtime);
      }
      return null;
    }

    try {
      const session = toAuthSession(await runtime.service.auth.sessions.current.retrieve());
      return commitStoredSession(runtime, session, { preserveRefreshToken: true });
    } catch {
      await clearStoredSession(runtime);
      return null;
    }
  }

  async function getCurrentUser(): Promise<SdkworkAuthUser | null> {
    const runtime = await readRuntime();
    const storedSession = await readStoredSession(runtime);
    if (runtime.tokenStore?.get && !hasStoredSession(storedSession)) {
      if (hasAnyStoredSessionToken(storedSession)) {
        await clearStoredSession(runtime);
      }
      return null;
    }

    return toAuthUser(await runtime.service.iam.users.current.retrieve());
  }

  async function signIn(input: SdkworkAuthLoginInput): Promise<SdkworkAuthSession> {
    const runtime = await readRuntime();
    const session = toAuthSession(await runtime.service.auth.sessions.create({
      grantType: "password",
      password: input.password,
      username: input.username.trim(),
    }));
    return commitStoredSession(runtime, session);
  }

  async function signInWithSessionBridge(
    input: SdkworkAuthSessionBridgeLoginInput,
  ): Promise<SdkworkAuthSession> {
    const runtime = await readRuntime();
    const bridgeToken = normalizeOptionalScalar(input.bridgeToken);
    if (!bridgeToken) {
      throw new Error(SESSION_BRIDGE_TOKEN_REQUIRED_MESSAGE);
    }
    const session = toAuthSession(await runtime.service.auth.sessions.create({
      bridgeToken,
      email: input.email.trim(),
      grantType: "session_bridge",
      name: normalizeOptionalScalar(input.name),
      subject: normalizeOptionalScalar(input.subject),
    }));
    return commitStoredSession(runtime, session);
  }

  async function signInWithEmailCode(
    input: SdkworkAuthEmailLoginInput,
  ): Promise<SdkworkAuthSession> {
    const runtime = await readRuntime();
    await ensureVerificationCodeAccepted(runtime, {
      code: input.code,
      scene: "LOGIN",
      target: input.email,
      verifyType: "EMAIL",
    });
    const session = toAuthSession(await runtime.service.auth.sessions.create({
      appVersion: normalizeOptionalScalar(input.appVersion),
      code: input.code.trim(),
      deviceId: normalizeOptionalScalar(input.deviceId),
      deviceName: normalizeOptionalScalar(input.deviceName),
      deviceType: normalizeOptionalScalar(input.deviceType),
      email: input.email.trim(),
      grantType: "email_code",
    }));
    return commitStoredSession(runtime, session);
  }

  async function signInWithPhoneCode(
    input: SdkworkAuthPhoneLoginInput,
  ): Promise<SdkworkAuthSession> {
    const runtime = await readRuntime();
    await ensureVerificationCodeAccepted(runtime, {
      code: input.code,
      scene: "LOGIN",
      target: input.phone,
      verifyType: "PHONE",
    });
    const session = toAuthSession(await runtime.service.auth.sessions.create({
      appVersion: normalizeOptionalScalar(input.appVersion),
      code: input.code.trim(),
      deviceId: normalizeOptionalScalar(input.deviceId),
      deviceName: normalizeOptionalScalar(input.deviceName),
      deviceType: normalizeOptionalScalar(input.deviceType),
      grantType: "phone_code",
      phone: input.phone.trim(),
    }));
    return commitStoredSession(runtime, session);
  }

  async function register(input: SdkworkAuthRegisterInput): Promise<SdkworkAuthSession> {
    assertMatchingPasswordConfirmation(
      input.password,
      input.confirmPassword,
      PASSWORDS_DO_NOT_MATCH_MESSAGE,
    );

    const runtime = await readRuntime();
    const verificationCode = normalizeOptionalScalar(input.verificationCode);
    if (verificationCode) {
      await ensureVerificationCodeAccepted(
        runtime,
        resolveRegistrationVerificationRequest(input, verificationCode),
      );
    }
    const session = toAuthSession(await runtime.service.auth.registrations.create({
      channel: input.channel,
      confirmPassword: input.confirmPassword,
      email: normalizeOptionalScalar(input.email),
      password: input.password,
      phone: normalizeOptionalScalar(input.phone),
      username: input.username.trim(),
      ...(normalizeOptionalScalar(input.tenantId)
        ? { tenantId: normalizeOptionalScalar(input.tenantId) }
        : {}),
      ...(verificationCode ? { verificationCode } : {}),
    }));
    return commitStoredSession(runtime, session);
  }

  async function getVerificationPolicy(): Promise<SdkworkAuthResolvedVerificationPolicy> {
    const runtime = await readRuntime();
    const retrieveVerificationPolicy = runtime.service.system?.iam?.verificationPolicy?.retrieve;
    if (!retrieveVerificationPolicy) {
      return { ...DEFAULT_SDKWORK_AUTH_VERIFICATION_POLICY };
    }

    return toVerificationPolicy(await retrieveVerificationPolicy());
  }

  async function listOAuthProviders(): Promise<string[]> {
    const runtime = await readRuntime();
    const listOAuthProvidersMethod = runtime.service.oauth?.providers?.list;
    if (!listOAuthProvidersMethod) {
      return [];
    }

    const payload = unwrapRuntimeResponse(await listOAuthProvidersMethod());
    const record = toRecord(payload);
    const items = Array.isArray(payload)
      ? payload
      : Array.isArray(record.items)
        ? record.items
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

  async function sendVerifyCode(input: SdkworkAuthSendVerifyCodeInput): Promise<void> {
    const runtime = await readRuntime();
    const createVerificationCode = runtime.service.messaging?.verificationCodes?.create;
    if (!createVerificationCode) {
      throw new Error(methodUnavailableMessage);
    }
    await createVerificationCode({
      scene: input.scene,
      target: input.target.trim(),
      verifyType: input.verifyType,
    });
  }

  async function verifyCode(input: SdkworkAuthVerifyCodeInput): Promise<boolean> {
    const runtime = await readRuntime();
    return verifyCodeWithRuntime(runtime, input);
  }

  async function verifyCodeWithRuntime(
    runtime: SdkworkIamRuntimeAuthRuntimeLike,
    input: SdkworkAuthVerifyCodeInput,
  ): Promise<boolean> {
    const verifyVerificationCode = runtime.service.messaging?.verificationCodes?.verify;
    if (!verifyVerificationCode) {
      throw new Error(methodUnavailableMessage);
    }
    const result = await verifyVerificationCode({
      code: input.code.trim(),
      scene: input.scene,
      target: input.target.trim(),
      verifyType: input.verifyType,
    });
    const record = toRecord(unwrapRuntimeResponse(result));
    return Boolean(record.verified ?? record.valid);
  }

  async function ensureVerificationCodeAccepted(
    runtime: SdkworkIamRuntimeAuthRuntimeLike,
    input: SdkworkAuthVerifyCodeInput,
  ): Promise<void> {
    if (!await verifyCodeWithRuntime(runtime, input)) {
      throw new Error(VERIFICATION_CODE_REJECTED_MESSAGE);
    }
  }

  function resolveRegistrationVerificationRequest(
    input: SdkworkAuthRegisterInput,
    code: string,
  ): SdkworkAuthVerifyCodeInput {
    const verifyType = input.channel === "PHONE" || (!input.channel && normalizeOptionalScalar(input.phone))
      ? "PHONE"
      : "EMAIL";
    const target = verifyType === "PHONE"
      ? normalizeOptionalScalar(input.phone)
      : normalizeOptionalScalar(input.email);
    if (!target) {
      throw new Error(VERIFICATION_CODE_REJECTED_MESSAGE);
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
    const runtime = await readRuntime();
    await runtime.service.auth.passwordResetRequests.create({
      account: input.account.trim(),
      channel: input.channel,
    });
  }

  async function resetPassword(input: SdkworkAuthPasswordResetInput): Promise<void> {
    assertMatchingPasswordConfirmation(
      input.newPassword,
      input.confirmPassword,
      PASSWORDS_DO_NOT_MATCH_MESSAGE,
    );

    const runtime = await readRuntime();
    await runtime.service.auth.passwordResets.create({
      account: input.account.trim(),
      code: input.code.trim(),
      confirmPassword: input.confirmPassword,
      newPassword: input.newPassword,
    });
  }

  async function refreshSession(
    input: SdkworkAuthRefreshSessionInput = {},
  ): Promise<SdkworkAuthSession> {
    const runtime = await readRuntime();
    if (!runtime.service.auth.sessions.refresh) {
      throw new Error(methodUnavailableMessage);
    }
    const storedSession = await readStoredSession(runtime);
    const refreshToken = normalizeOptionalScalar(input.refreshToken)
      || normalizeOptionalScalar(storedSession.refreshToken);
    const session = toAuthSession(await runtime.service.auth.sessions.refresh(
      refreshToken ? { refreshToken } : {},
    ));
    return commitStoredSession(runtime, session, { preserveRefreshToken: true });
  }

  async function selectLoginContext(
    input: SdkworkAuthLoginContextSelectionInput,
  ): Promise<SdkworkAuthSession> {
    const runtime = await readRuntime();
    if (!runtime.service.auth.sessions.loginContextSelection?.create) {
      throw new Error(methodUnavailableMessage);
    }
    const body: Record<string, unknown> = {
      continuationToken: input.continuationToken.trim(),
      loginScope: input.loginScope,
    };
    if (input.loginScope === "ORGANIZATION") {
      body.organizationId = input.organizationId?.trim();
    }
    const session = toAuthSession(await runtime.service.auth.sessions.loginContextSelection.create(body));
    return commitStoredSession(runtime, session);
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

  async function updateCurrentSession(
    input: SdkworkAuthUpdateCurrentSessionInput = {},
  ): Promise<SdkworkAuthSession> {
    const runtime = await readRuntime();
    if (!runtime.service.auth.sessions.current.update) {
      throw new Error(methodUnavailableMessage);
    }
    const session = toAuthSession(await runtime.service.auth.sessions.current.update(input));
    return commitStoredSession(runtime, session, { preserveRefreshToken: true });
  }

  async function getOAuthAuthorizationUrl(
    input: SdkworkAuthOAuthAuthorizationInput,
  ): Promise<string> {
    const runtime = await readRuntime();
    const createAuthorizationUrl = runtime.service.oauth?.authorizationUrls?.create;
    if (!createAuthorizationUrl) {
      throw new Error(methodUnavailableMessage);
    }
    const result = await createAuthorizationUrl({
      provider: mapSocialProvider(input.provider),
      redirectUri: input.redirectUri.trim(),
      scope: normalizeOptionalScalar(input.scope),
      state: normalizeOptionalScalar(input.state),
    });
    const record = toRecord(result);
    const authUrl =
      normalizeOptionalScalar(record.authUrl)
      || normalizeOptionalScalar(record.url)
      || (typeof result === "string" ? result.trim() : "");
    if (!authUrl) {
      throw new Error("Third-party login link is missing from the SDKWork IAM runtime response.");
    }

    return authUrl;
  }

  async function signInWithOAuth(
    input: SdkworkAuthOAuthLoginInput,
  ): Promise<SdkworkAuthSession> {
    const runtime = await readRuntime();
    const createSession = runtime.service.oauth?.sessions?.create;
    if (!createSession) {
      throw new Error(methodUnavailableMessage);
    }
    const session = toAuthSession(await createSession({
      code: input.code.trim(),
      deviceId: normalizeOptionalScalar(input.deviceId),
      deviceType: normalizeOptionalScalar(input.deviceType),
      provider: mapSocialProvider(input.provider),
      redirectUri: normalizeOptionalScalar(input.redirectUri),
      state: normalizeOptionalScalar(input.state),
    }));
    return commitStoredSession(runtime, session);
  }

  async function signOut(): Promise<void> {
    const runtime = await readRuntime();
    try {
      await runtime.service.auth.sessions.current.delete();
    } finally {
      await clearStoredSession(runtime);
    }
  }

  async function generateLoginQrCode(
    input: SdkworkAuthLoginQrCodeCreateInput = {},
  ): Promise<SdkworkAuthLoginQrCode> {
    const runtime = await readRuntime();
    const createSession = runtime.service.oauth?.deviceAuthorizations?.create;
    if (!createSession) {
      throw new Error(methodUnavailableMessage);
    }

    return toPlatformLoginQrCode(await createSession({
      purpose: resolveQrAuthPurpose(input),
    }));
  }

  async function checkLoginQrCodeStatus(
    sessionKey: string,
    options: SdkworkAuthLoginQrCodeCheckOptions = {},
  ): Promise<SdkworkAuthLoginQrCodeStatusResult> {
    const runtime = await readRuntime();
    const retrieveSession = runtime.service.oauth?.deviceAuthorizations?.retrieve;
    if (!retrieveSession) {
      throw new Error(methodUnavailableMessage);
    }

    let result: SdkworkAuthLoginQrCodeStatusResult;
    let retrievedRecord: Record<string, unknown>;
    try {
      const retrieved = await retrieveSession(sessionKey.trim());
      retrievedRecord = toRecord(unwrapRuntimeResponse(retrieved));
      result = toPlatformLoginQrCodeStatus(retrieved);
    } catch (error) {
      if (isExpiredQrLoginCodeError(error)) {
        return {
          status: "expired",
        };
      }
      throw error;
    }

    if (result.organizationSelection) {
      return result;
    }

    let sessionSource = resolveRuntimeQrAuthSessionSource(retrievedRecord);
    if (
      !sessionSource
      && result.status === "confirmed"
      && retrievedRecord.sessionReady === true
      && normalizeOptionalScalar(options.pollSecret)
    ) {
      const createSessionExchange =
        runtime.service.oauth?.deviceAuthorizations?.sessionExchanges?.create;
      if (!createSessionExchange) {
        throw new Error(methodUnavailableMessage);
      }

      sessionSource = resolveRuntimeQrAuthSessionSource(
        toRecord(unwrapRuntimeResponse(await createSessionExchange(sessionKey.trim(), {
          pollSecret: options.pollSecret?.trim(),
        }))),
      );
    }

    if (result.status === "confirmed" && sessionSource && hasRuntimeQrAuthSessionTokens(sessionSource)) {
      const session = await commitStoredSession(runtime, toAuthSession(sessionSource));
      return {
        ...result,
        session,
        user: session.user ?? result.user,
      };
    }

    return result;
  }

  async function callbackLoginQrCode(
    input: SdkworkAuthLoginQrCodeCallbackInput,
  ): Promise<SdkworkAuthLoginQrCodeStatusResult> {
    const runtime = await readRuntime();
    const createScan = runtime.service.oauth?.deviceAuthorizations?.scans?.create;
    if (!createScan) {
      throw new Error(methodUnavailableMessage);
    }

    return toPlatformLoginQrCodeStatus(await createScan(input.sessionKey.trim(), {
      ...(input.accountId ? { accountId: input.accountId.trim() } : {}),
      ...(input.entryId ? { entryId: input.entryId.trim() } : {}),
      ...(input.externalUserId ? { externalUserId: input.externalUserId.trim() } : {}),
      ...(input.ipHash ? { ipHash: input.ipHash.trim() } : {}),
      ...(input.pollSecret ? { pollSecret: input.pollSecret.trim() } : {}),
      scanSource: resolveQrScanSource(input.scanSource),
      ...(input.userAgent ? { userAgent: input.userAgent.trim() } : {}),
    }), "scanned");
  }

  async function confirmLoginQrCode(
    input: SdkworkAuthLoginQrCodeConfirmInput,
  ): Promise<SdkworkAuthLoginQrCodeStatusResult> {
    const runtime = await readRuntime();
    const username = normalizeQrCredential(input.username, "username");
    const password = normalizeQrCredential(input.password, "password");
    const completeWithPassword = runtime.service.oauth?.deviceAuthorizations?.passwordCompletions?.create;
    if (!completeWithPassword) {
      throw new Error(methodUnavailableMessage);
    }

    const result = toPlatformLoginQrCodeStatus(await completeWithPassword(input.sessionKey.trim(), {
      ...(input.channel ? { channel: input.channel } : {}),
      ...(input.confirmPassword ? { confirmPassword: input.confirmPassword } : {}),
      ...(input.email ? { email: input.email.trim() } : {}),
      password,
      ...(input.phone ? { phone: input.phone.trim() } : {}),
      username,
      ...(input.verificationCode ? { verificationCode: input.verificationCode.trim() } : {}),
    }), "confirmed");

    if (result.session) {
      const session = await commitStoredSession(runtime, result.session);
      return {
        ...result,
        session,
        user: session.user ?? result.user,
      };
    }

    return result;
  }

  return {
    callbackLoginQrCode,
    checkLoginQrCodeStatus,
    confirmLoginQrCode,
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

async function readStoredSession(
  runtime: SdkworkIamRuntimeAuthRuntimeLike,
): Promise<SdkworkIamRuntimeAuthStoredSessionLike> {
  return runtime.tokenStore?.get ? (await runtime.tokenStore.get()) ?? {} : {};
}

async function commitStoredSession(
  runtime: SdkworkIamRuntimeAuthRuntimeLike,
  session: SdkworkAuthSession,
  options: SdkworkAuthSessionCommitOptions = {},
): Promise<SdkworkAuthSession> {
  const storedSession = options.preserveRefreshToken ? await readStoredSession(runtime) : {};
  const refreshToken = normalizeOptionalScalar(session.refreshToken)
    || (options.preserveRefreshToken
      ? normalizeOptionalScalar(storedSession.refreshToken)
      : undefined);
  const committedSession = {
    accessToken: session.accessToken,
    authToken: session.authToken,
    ...(session.expiresAt ? { expiresAt: session.expiresAt } : {}),
    ...(session.context ? { context: session.context } : {}),
    ...(refreshToken ? { refreshToken } : {}),
    ...(session.sessionId ? { sessionId: session.sessionId } : {}),
    ...(session.user ? { user: session.user } : {}),
  };
  await runtime.tokenStore?.set?.(committedSession);
  return committedSession;
}

async function clearStoredSession(
  runtime: SdkworkIamRuntimeAuthRuntimeLike,
): Promise<void> {
  await Promise.all([
    runtime.tokenStore?.clear?.(),
    runtime.contextStore?.clear?.(),
  ]);
}

function hasStoredSession(session: SdkworkIamRuntimeAuthStoredSessionLike): boolean {
  return Boolean(
    normalizeOptionalScalar(session.authToken)
    && normalizeOptionalScalar(session.accessToken),
  ) && !isStoredSessionExpired(session);
}

function hasAnyStoredSessionToken(session: SdkworkIamRuntimeAuthStoredSessionLike): boolean {
  return Boolean(
    normalizeOptionalScalar(session.authToken)
    || normalizeOptionalScalar(session.accessToken)
    || normalizeOptionalScalar(session.refreshToken),
  );
}

function isStoredSessionExpired(session: SdkworkIamRuntimeAuthStoredSessionLike): boolean {
  const expiresAt = normalizeOptionalScalar(session.expiresAt);
  if (!expiresAt) {
    return false;
  }

  const timestamp = Number(expiresAt);
  const resolvedTimestamp = Number.isFinite(timestamp) ? timestamp : Date.parse(expiresAt);
  return Number.isFinite(resolvedTimestamp) && Date.now() >= resolvedTimestamp;
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

function toAuthSession(session: SdkworkIamRuntimeAuthSessionLike): SdkworkAuthSession {
  throwIfTenantSelectionChallenge(session);
  throwIfOrganizationSelectionChallenge(session);
  const accessToken = normalizeOptionalScalar(session.accessToken);
  const authToken = normalizeOptionalScalar(session.authToken);

  if (!accessToken) {
    throw new Error("SDKWork IAM runtime session is missing accessToken");
  }

  if (!authToken) {
    throw new Error("SDKWork IAM runtime session is missing authToken");
  }

  const userSource = session.user;
  const context = toAuthAppContext(session.context);
  return {
    accessToken,
    authToken,
    ...(context ? { context } : {}),
    ...(normalizeOptionalScalar(session.refreshToken)
      ? { refreshToken: normalizeOptionalScalar(session.refreshToken) }
      : {}),
    ...(normalizeOptionalScalar(session.sessionId)
      ? { sessionId: normalizeOptionalScalar(session.sessionId) }
      : context?.sessionId ? { sessionId: context.sessionId } : {}),
    ...(userSource ? { user: toAuthUser(userSource) } : {}),
  };
}

function toAuthAppContext(value: unknown): SdkworkAuthSession["context"] | undefined {
  const record = toRecord(value);
  const context: SdkworkAuthSession["context"] = {
    ...(normalizeOptionalScalar(record.appId) || normalizeOptionalScalar(record.app_id)
      ? { appId: normalizeOptionalScalar(record.appId) || normalizeOptionalScalar(record.app_id) }
      : {}),
    ...(normalizeOptionalScalar(record.authLevel) || normalizeOptionalScalar(record.auth_level)
      ? { authLevel: normalizeOptionalScalar(record.authLevel) || normalizeOptionalScalar(record.auth_level) }
      : {}),
    ...(normalizeStringArray(record.dataScope).length > 0 || normalizeStringArray(record.data_scope).length > 0
      ? {
          dataScope:
            normalizeStringArray(record.dataScope).length > 0
              ? normalizeStringArray(record.dataScope)
              : normalizeStringArray(record.data_scope),
        }
      : {}),
    ...(normalizeOptionalScalar(record.deploymentMode) || normalizeOptionalScalar(record.deployment_mode)
      ? {
          deploymentMode:
            normalizeOptionalScalar(record.deploymentMode)
            || normalizeOptionalScalar(record.deployment_mode),
        }
      : {}),
    ...(normalizeOptionalScalar(record.environment)
      ? { environment: normalizeOptionalScalar(record.environment) }
      : {}),
    ...(normalizeOptionalScalar(record.loginScope) || normalizeOptionalScalar(record.login_scope)
      ? {
          loginScope:
            normalizeOptionalScalar(record.loginScope)
            || normalizeOptionalScalar(record.login_scope),
        }
      : {}),
    ...(normalizeNullableScalar(record.organizationId) !== undefined
      || normalizeNullableScalar(record.organization_id) !== undefined
      ? {
          organizationId:
            normalizeNullableScalar(record.organizationId)
            ?? normalizeNullableScalar(record.organization_id)
            ?? null,
        }
      : {}),
    ...(normalizeStringArray(record.permissionScope).length > 0
      || normalizeStringArray(record.permission_scope).length > 0
      ? {
          permissionScope:
            normalizeStringArray(record.permissionScope).length > 0
              ? normalizeStringArray(record.permissionScope)
              : normalizeStringArray(record.permission_scope),
        }
      : {}),
    ...(normalizeOptionalScalar(record.sessionId) || normalizeOptionalScalar(record.session_id)
      ? { sessionId: normalizeOptionalScalar(record.sessionId) || normalizeOptionalScalar(record.session_id) }
      : {}),
    ...(normalizeOptionalScalar(record.tenantId) || normalizeOptionalScalar(record.tenant_id)
      ? { tenantId: normalizeOptionalScalar(record.tenantId) || normalizeOptionalScalar(record.tenant_id) }
      : {}),
    ...(normalizeOptionalScalar(record.userId) || normalizeOptionalScalar(record.user_id)
      ? { userId: normalizeOptionalScalar(record.userId) || normalizeOptionalScalar(record.user_id) }
      : {}),
  };

  return Object.keys(context).length > 0 ? context : undefined;
}

function normalizeNullableScalar(value: unknown): string | null | undefined {
  if (value === null) {
    return null;
  }

  return normalizeOptionalScalar(value);
}

function normalizeStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.map(normalizeOptionalScalar).filter((item): item is string => Boolean(item))
    : [];
}

function throwIfOrganizationSelectionChallenge(value: unknown): void {
  const challenge = normalizeOrganizationSelectionChallenge(value);
  if (challenge) {
    throw new SdkworkAuthOrganizationSelectionRequiredError(challenge);
  }
}

function throwIfTenantSelectionChallenge(value: unknown): void {
  const record = toRecord(value);
  if (normalizeOptionalScalar(record.challengeType) === "TENANT_SELECTION") {
    throw new Error(
      "tenant selection is no longer supported; tenant is bound by the bootstrap Access-Token",
    );
  }
}

function normalizeOrganizationSelectionChallenge(
  value: unknown,
): SdkworkAuthOrganizationSelectionChallenge | undefined {
  const record = toRecord(value);
  if (normalizeOptionalScalar(record.challengeType) !== "ORGANIZATION_SELECTION"
    && normalizeOptionalScalar(record.challengeType) !== "LOGIN_CONTEXT_SELECTION") {
    return undefined;
  }

  const continuationToken = normalizeOptionalScalar(record.continuationToken);
  if (!continuationToken) {
    return undefined;
  }

  const organizations = Array.isArray(record.organizations)
    ? record.organizations
        .map(normalizeOrganizationChoice)
        .filter((organization): organization is SdkworkAuthOrganizationChoice => Boolean(organization))
    : [];

  type OrganizationSelectionOption = NonNullable<
    SdkworkAuthOrganizationSelectionChallenge["options"]
  >[number];

  const options = Array.isArray(record.options)
    ? record.options
        .map((option): OrganizationSelectionOption | undefined => {
          const optionRecord = toRecord(option);
          const loginScope = normalizeOptionalScalar(optionRecord.loginScope)
            || normalizeOptionalScalar(optionRecord.login_scope);
          if (loginScope !== "TENANT" && loginScope !== "ORGANIZATION") {
            return undefined;
          }
          return {
            loginScope,
            ...(normalizeOptionalScalar(optionRecord.organizationId)
              || normalizeOptionalScalar(optionRecord.organization_id)
              ? {
                  organizationId:
                    normalizeOptionalScalar(optionRecord.organizationId)
                    || normalizeOptionalScalar(optionRecord.organization_id),
                }
              : {}),
            ...(normalizeOptionalScalar(optionRecord.displayName)
              || normalizeOptionalScalar(optionRecord.display_name)
              ? {
                  displayName:
                    normalizeOptionalScalar(optionRecord.displayName)
                    || normalizeOptionalScalar(optionRecord.display_name),
                }
              : {}),
          };
        })
        .filter((option): option is OrganizationSelectionOption => Boolean(option))
    : undefined;

  return {
    challengeType: normalizeOptionalScalar(record.challengeType) as SdkworkAuthOrganizationSelectionChallenge["challengeType"],
    continuationToken,
    ...(typeof record.expiresAt === "number" || typeof record.expiresAt === "string"
      ? { expiresAt: record.expiresAt }
      : {}),
    organizations,
    ...(options && options.length > 0 ? { options } : {}),
  };
}

function normalizeOrganizationChoice(value: unknown): SdkworkAuthOrganizationChoice | undefined {
  const record = toRecord(value);
  const organizationId =
    normalizeOptionalScalar(record.organizationId)
    || normalizeOptionalScalar(record.organization_id)
    || normalizeOptionalScalar(record.id);
  if (!organizationId) {
    return undefined;
  }

  return {
    organizationId,
    ...(normalizeOptionalScalar(record.displayName) || normalizeOptionalScalar(record.display_name)
      ? {
          displayName:
            normalizeOptionalScalar(record.displayName)
            || normalizeOptionalScalar(record.display_name),
        }
      : {}),
    ...(normalizeOptionalScalar(record.membershipKind) || normalizeOptionalScalar(record.membership_kind)
      ? {
          membershipKind:
            normalizeOptionalScalar(record.membershipKind)
            || normalizeOptionalScalar(record.membership_kind),
        }
      : {}),
    ...(normalizeOptionalScalar(record.name) ? { name: normalizeOptionalScalar(record.name) } : {}),
    ...(normalizeOptionalScalar(record.tenantId) || normalizeOptionalScalar(record.tenant_id)
      ? {
          tenantId:
            normalizeOptionalScalar(record.tenantId)
            || normalizeOptionalScalar(record.tenant_id),
        }
      : {}),
  };
}

function toAuthUser(user: SdkworkIamRuntimeAuthUserLike): SdkworkAuthUser {
  return createSdkworkAuthUserFromIdentity({
    avatar: readSdkworkMediaResource(user.avatar),
    displayName:
      normalizeOptionalScalar(user.displayName)
      || normalizeOptionalScalar(user.name)
      || normalizeOptionalScalar(user.nickname),
    email: normalizeOptionalScalar(user.email),
    firstName: normalizeOptionalScalar(user.firstName),
    id: normalizeOptionalScalar(user.userId) || normalizeOptionalScalar(user.id),
    lastName: normalizeOptionalScalar(user.lastName),
    username: normalizeOptionalScalar(user.username) || normalizeOptionalScalar(user.email),
  });
}

function toRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function isExpiredQrLoginCodeError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error || "");
  return /invalid or expired qr login code/i.test(message);
}

function unwrapRuntimeResponse(value: unknown): unknown {
  const record = toRecord(value);
  if (!("data" in record) && !("code" in record)) {
    return value;
  }

  if (!isSuccessCode(record.code)) {
    throw new Error(String(record.message || record.msg || "SDKWork IAM runtime request failed"));
  }

  return record.data;
}

function isSuccessCode(code: unknown): boolean {
  if (code === undefined || code === null) {
    return true;
  }

  const normalized = String(code).trim();
  return normalized === "0" || normalized === "200" || normalized === "2000";
}

function resolveQrAuthPurpose(
  input: SdkworkAuthLoginQrCodeCreateInput,
): "login" | "register" {
  const purpose = normalizeOptionalScalar(input.purpose);
  if (!purpose) {
    return "login";
  }
  if (purpose === "login" || purpose === "register") {
    return purpose;
  }
  throw new Error("QR auth purpose must be login or register");
}

function resolveQrScanSource(value: unknown): string {
  const normalized = normalizeOptionalScalar(value);
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

function toPlatformLoginQrCode(value: unknown): SdkworkAuthLoginQrCode {
  const record = toRecord(unwrapRuntimeResponse(value));
  const sessionKey =
    normalizeOptionalScalar(record.sessionKey)
    || normalizeOptionalScalar(record.deviceAuthorizationId)
    || normalizeOptionalScalar(record.id);
  if (!sessionKey) {
    throw new Error("SDKWork IAM runtime QR auth session response is missing sessionKey");
  }

  return {
    description: normalizeOptionalScalar(record.description),
    expireTime: resolveQrExpireTime(record),
    pollSecret: normalizeOptionalScalar(record.pollSecret),
    qrCode: readSdkworkMediaResource(record.qrCode),
    qrContent: resolvePlatformQrContent(record),
    sessionKey,
    title: normalizeOptionalScalar(record.title),
    type: resolvePlatformQrContentMode(record),
  };
}

function resolvePlatformQrContent(record: Record<string, unknown>): string | undefined {
  const qrContent = record.qrContent;
  let content: string | undefined;
  if (typeof qrContent === "string") {
    content = normalizeOptionalScalar(qrContent);
  } else {
    const qrContentRecord = toRecord(qrContent);
    content = normalizeOptionalScalar(qrContentRecord.content)
      || normalizeOptionalScalar(record.fallbackUrl);
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

function resolvePlatformQrContentMode(record: Record<string, unknown>): string | undefined {
  const qrContent = record.qrContent;
  if (typeof qrContent === "string") {
    return normalizeOptionalScalar(record.type);
  }

  return normalizeOptionalScalar(toRecord(qrContent).mode)
    || normalizeOptionalScalar(record.type);
}

function resolveQrExpireTime(record: Record<string, unknown>): number | undefined {
  if (typeof record.expireTime === "number" && Number.isFinite(record.expireTime)) {
    return record.expireTime;
  }

  const expiresAt = normalizeOptionalScalar(record.expiresAt);
  if (!expiresAt) {
    return undefined;
  }

  const timestamp = Date.parse(expiresAt);
  return Number.isFinite(timestamp) ? timestamp : undefined;
}

function toPlatformLoginQrCodeStatus(
  value: unknown,
  fallbackStatus: SdkworkAuthLoginQrCodeStatusResult["status"] = "pending",
): SdkworkAuthLoginQrCodeStatusResult {
  const record = toRecord(unwrapRuntimeResponse(value));
  const status = normalizePlatformQrCodeStatus(
    normalizeOptionalScalar(record.status),
    fallbackStatus,
  );
  const organizationSelection = normalizeOrganizationSelectionChallenge(record);
  const sessionSource = resolveRuntimeQrAuthSessionSource(record);
  const session = sessionSource ? toAuthSession(sessionSource) : undefined;
  const userSource = record.user;

  return {
    ...(organizationSelection ? { organizationSelection } : {}),
    status: organizationSelection && !normalizeOptionalScalar(record.status)
      ? "organizationSelectionRequired"
      : status,
    ...(session ? { session } : {}),
    ...(session?.user ? { user: session.user } : userSource ? { user: toAuthUser(userSource as SdkworkIamRuntimeAuthUserLike) } : {}),
  };
}

function resolveRuntimeQrAuthSessionSource(record: Record<string, unknown>): SdkworkIamRuntimeAuthSessionLike | undefined {
  if (hasRuntimeQrAuthSessionTokens(record)) {
    return record as SdkworkIamRuntimeAuthSessionLike;
  }

  const sessionSource = record.session;
  return hasRuntimeQrAuthSessionTokens(sessionSource)
    ? sessionSource as SdkworkIamRuntimeAuthSessionLike
    : undefined;
}

function hasRuntimeQrAuthSessionTokens(value: unknown): boolean {
  const record = toRecord(value);
  return Boolean(
    normalizeOptionalScalar(record.accessToken)
    && normalizeOptionalScalar(record.authToken),
  );
}

function toVerificationPolicy(value: unknown): SdkworkAuthResolvedVerificationPolicy {
  const record = toRecord(value);
  const accountBinding = toRecord(record.accountBinding ?? record.account_binding);
  const oauthLogin = toRecord(accountBinding.oauthLogin ?? accountBinding.oauth_login);
  const remoteOauthLoginEnabled = typeof record.oauthLoginEnabled === "boolean"
    ? record.oauthLoginEnabled
    : typeof oauthLogin.enabled === "boolean"
      ? oauthLogin.enabled
      : undefined;

  return {
    emailCodeLoginEnabled:
      typeof record.emailCodeLoginEnabled === "boolean"
        ? record.emailCodeLoginEnabled
        : DEFAULT_SDKWORK_AUTH_VERIFICATION_POLICY.emailCodeLoginEnabled,
    emailRegistrationVerificationRequired:
      typeof record.emailRegistrationVerificationRequired === "boolean"
        ? record.emailRegistrationVerificationRequired
        : typeof record.emailRegisterVerificationRequired === "boolean"
          ? record.emailRegisterVerificationRequired
          : DEFAULT_SDKWORK_AUTH_VERIFICATION_POLICY.emailRegistrationVerificationRequired,
    phoneCodeLoginEnabled:
      typeof record.phoneCodeLoginEnabled === "boolean"
        ? record.phoneCodeLoginEnabled
        : DEFAULT_SDKWORK_AUTH_VERIFICATION_POLICY.phoneCodeLoginEnabled,
    phoneRegistrationVerificationRequired:
      typeof record.phoneRegistrationVerificationRequired === "boolean"
        ? record.phoneRegistrationVerificationRequired
        : typeof record.phoneRegisterVerificationRequired === "boolean"
          ? record.phoneRegisterVerificationRequired
          : DEFAULT_SDKWORK_AUTH_VERIFICATION_POLICY.phoneRegistrationVerificationRequired,
    ...(typeof remoteOauthLoginEnabled === "boolean"
      ? { oauthLoginEnabled: remoteOauthLoginEnabled }
      : {}),
  };
}

function normalizeOAuthProviderListItem(value: unknown): string | null {
  if (typeof value === "string") {
    return normalizeSdkworkAuthOAuthProvider(value);
  }

  const record = toRecord(value);
  const providerCode = normalizeOptionalScalar(record.providerCode)
    ?? normalizeOptionalScalar(record.provider_code)
    ?? normalizeOptionalScalar(record.provider);
  return providerCode ? normalizeSdkworkAuthOAuthProvider(providerCode) : null;
}

function normalizePlatformQrCodeStatus(
  status: string | undefined,
  fallbackStatus: SdkworkAuthLoginQrCodeStatusResult["status"],
): SdkworkAuthLoginQrCodeStatusResult["status"] {
  if (status === "completed") {
    return "confirmed";
  }

  if (status === "cancelled") {
    return "failed";
  }

  if (status === "organization_selection_required"
    || status === "login_context_selection_required") {
    return "organizationSelectionRequired";
  }

  return status === "bindRequired"
    || status === "confirmed"
    || status === "expired"
    || status === "failed"
    || status === "organizationSelectionRequired"
    || status === "passwordRequired"
    || status === "pending"
    || status === "scanned"
    ? status
    : fallbackStatus;
}

function normalizeOptionalScalar(value: unknown): string | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  const normalized = typeof value === "string" ? value.trim() : "";
  return normalized || undefined;
}

function mapSocialProvider(provider: string): string {
  const normalized = provider.trim().replace(/[\s-]+/g, "_").toUpperCase();
  if (!normalized) {
    throw new Error("Third-party login method is required.");
  }

  return normalized;
}
