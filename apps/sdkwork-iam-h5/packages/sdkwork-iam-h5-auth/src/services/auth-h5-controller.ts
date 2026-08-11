import {
  buildOrganizationLoginContextSelectionBody,
  buildPersonalLoginContextSelectionBody,
  normalizeIamLoginContextSelectionChallenge,
} from "@sdkwork/iam-contracts";
import type { SdkworkIamService } from "@sdkwork/iam-service";
import { isBlank, trim } from "@sdkwork/utils";

import type {
  CreateSdkworkIamH5AuthControllerInput,
  SdkworkIamH5AuthController,
  SdkworkIamH5AuthSession,
  SdkworkIamH5AuthState,
  SdkworkIamH5BeginOAuthAuthorizationInput,
  SdkworkIamH5CodeLoginInput,
  SdkworkIamH5LoginCredentials,
  SdkworkIamH5LoginResult,
  SdkworkIamH5OAuthFlowContext,
  SdkworkIamH5OAuthLoginInput,
  SdkworkIamH5OAuthScope,
  SdkworkIamH5MiniProgramLoginInput,
  SdkworkIamH5OAuthProvider,
  SdkworkIamH5RegisterInput,
  SdkworkIamH5ResetPasswordInput,
  SdkworkIamH5ScanLoginContext,
  SdkworkIamH5SendVerificationCodeInput,
  SdkworkIamH5VerificationCodeClient,
  SdkworkIamH5VerifyType,
} from "../types/auth-h5-types";

/** Storage key for the scan-login context kept across the WeChat authorization redirect. */
const SCAN_LOGIN_STORAGE_KEY = "sdkwork.iam.h5.scanLogin";

/** Storage key for the OAuth flow mode kept across the provider authorization redirect. */
const OAUTH_FLOW_STORAGE_KEY = "sdkwork.iam.h5.oauthFlow";

/**
 * Storage key for the WeChat auto-authorization block.
 *
 * Set when an OAuth attempt ends in error (user denied the page, the code
 * exchange failed, the scan session could not be completed). It stops the
 * login screen from re-triggering the automatic silent redirect on the next
 * full page load — otherwise "deny → back to sign in → auto redirect" would
 * loop forever. A manual WeChat entry click clears the block (explicit user
 * intent), as does a successful authentication.
 */
const WECHAT_AUTO_BLOCKED_STORAGE_KEY = "sdkwork.iam.h5.wechatAutoBlocked";

/** OAuth `state` prefix used to carry the QR session key through authorization. */
const SCAN_LOGIN_STATE_PREFIX = "scan:";

/**
 * OAuth `state` prefix for provider scan login:
 * `p:<providerCode>:<sessionKey>[:<pollSecret>]` (the code is exchanged with
 * the provider; the poll secret is embedded so the callback screen — which
 * never visits the H5 login URL — can complete the QR session).
 */
const SCAN_LOGIN_PROVIDER_STATE_PREFIX = "p:";

const WECHAT_PROVIDER = "wechat";

/** Message shown when the host did not inject a verification-code client. */
export const SDKWORK_IAM_H5_AUTH_VERIFICATION_UNAVAILABLE_MESSAGE =
  "Verification code service is unavailable in this app; try password login.";

/**
 * Resolves the IAM verification channel from the account value
 * (手机号或邮箱): values containing `@` are emails, everything else is a phone.
 */
export function resolveSdkworkIamH5VerifyType(account: string): SdkworkIamH5VerifyType {
  return /@/.test(trim(account)) ? "EMAIL" : "PHONE";
}

export function createSdkworkIamH5AuthController(
  input: SdkworkIamService | CreateSdkworkIamH5AuthControllerInput,
): SdkworkIamH5AuthController {
  const service = "service" in input ? input.service : input;
  const verificationCodeClient: SdkworkIamH5VerificationCodeClient | undefined =
    "service" in input ? input.verificationCodeClient : undefined;
  let state: SdkworkIamH5AuthState = { status: "idle" };

  const setState = (patch: Partial<SdkworkIamH5AuthState>) => {
    state = { ...state, ...patch };
  };

  const completeSession = (response: unknown): SdkworkIamH5AuthSession => {
    const session = toSession(response);
    setState({ challenge: undefined, session, status: "ready" });
    return session;
  };

  /** Normalizes a session/context-selection response like {@link login}. */
  const resolveLoginResult = (response: unknown): SdkworkIamH5LoginResult => {
    const challenge = normalizeIamLoginContextSelectionChallenge(response);
    if (challenge) {
      setState({
        challenge,
        session: undefined,
        status: "loginContextSelectionRequired",
      });
      return {
        challenge,
        kind: "loginContextSelectionRequired",
      };
    }
    const session = completeSession(response);
    return { kind: "session", session };
  };

  return {
    getState: () => ({
      ...state,
      challenge: state.challenge ? { ...state.challenge } : undefined,
      session: state.session ? { ...state.session } : undefined,
    }),
    login: async (credentials) => {
      setState({ challenge: undefined, lastError: undefined, status: "loading" });
      try {
        // The IAM app-api backend only accepts the password grant
        // (`is_password_grant`); omitting `grantType` fails with 40001
        // "unsupported authentication grant type".
        const response = await service.auth.sessions.create({
          grantType: "password",
          password: credentials.password,
          username: credentials.username.trim(),
        });
        return resolveLoginResult(response);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Login failed";
        setState({ lastError: message, status: "error" });
        throw error;
      }
    },
    loginWithCode: async (input: SdkworkIamH5CodeLoginInput) => {
      setState({ challenge: undefined, lastError: undefined, status: "loading" });
      try {
        const verifyType = resolveSdkworkIamH5VerifyType(input.target);
        const response = await service.auth.sessions.create({
          code: input.code.trim(),
          grantType: verifyType === "PHONE" ? "phone_code" : "email_code",
          ...(verifyType === "PHONE"
            ? { phone: input.target.trim() }
            : { email: input.target.trim() }),
        });
        return resolveLoginResult(response);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Code login failed";
        setState({ lastError: message, status: "error" });
        throw error;
      }
    },
    register: async (input: SdkworkIamH5RegisterInput) => {
      setState({ challenge: undefined, lastError: undefined, status: "loading" });
      try {
        const verifyType = resolveSdkworkIamH5VerifyType(input.account);
        const response = await service.auth.registrations.create({
          channel: verifyType,
          password: input.password,
          username: input.account.trim(),
          verificationCode: input.code.trim(),
        });
        return resolveLoginResult(response);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Registration failed";
        setState({ lastError: message, status: "error" });
        throw error;
      }
    },
    sendVerificationCode: async (input: SdkworkIamH5SendVerificationCodeInput) => {
      if (!verificationCodeClient?.send) {
        throw new Error(SDKWORK_IAM_H5_AUTH_VERIFICATION_UNAVAILABLE_MESSAGE);
      }
      await verificationCodeClient.send({
        scene: input.scene,
        target: input.target.trim(),
        verifyType: input.verifyType,
      });
    },
    resetPassword: async (input: SdkworkIamH5ResetPasswordInput) => {
      setState({ lastError: undefined, status: "loading" });
      try {
        const verifyType = resolveSdkworkIamH5VerifyType(input.account);
        await service.auth.passwordResetRequests.create({
          account: input.account.trim(),
          channel: verifyType === "PHONE" ? "SMS" : "EMAIL",
        });
        await service.auth.passwordResets.create({
          account: input.account.trim(),
          code: input.code.trim(),
          confirmPassword: input.newPassword,
          newPassword: input.newPassword,
        });
        setState({ challenge: undefined, session: undefined, status: "ready" });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Password reset failed";
        setState({ lastError: message, status: "error" });
        throw error;
      }
    },
    loginWithOAuth: async (input: SdkworkIamH5OAuthLoginInput) => {
      setState({ challenge: undefined, lastError: undefined, status: "loading" });
      try {
        const response = await service.oauth.sessions.create({
          code: input.code,
          provider: input.provider,
          redirectUri: input.redirectUri,
          state: input.state,
        });
        return completeSession(response);
      } catch (error) {
        const message = error instanceof Error ? error.message : "OAuth login failed";
        setState({ lastError: message, status: "error" });
        throw error;
      }
    },
    loginWithMiniProgram: async (input: SdkworkIamH5MiniProgramLoginInput) => {
      setState({ challenge: undefined, lastError: undefined, status: "loading" });
      try {
        const response = await service.oauth.miniProgramSessions.create(input);
        return completeSession(response);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Mini program login failed";
        setState({ lastError: message, status: "error" });
        throw error;
      }
    },
    listOAuthProviders: async () => {
      const response = await service.oauth.providers.list();
      const records = readProviderRecords(response);
      return records
        .map((record) => ({
          displayName: optionalString(record.displayName) || optionalString(record.display_name),
          providerCode: optionalString(record.providerCode)
            || optionalString(record.provider_code)
            || "",
          supportsLogin: readBoolean(record.supportsLogin, record.supports_login),
        }))
        .filter((provider) => !isBlank(provider.providerCode));
    },
    createOAuthAuthorizationUrl: async ({ provider, redirectUri, scope, state: oauthState }) => {
      const authUrl = await requestOAuthAuthorizationUrl(service, {
        provider,
        redirectUri,
        scope,
        state: oauthState,
      });
      return authUrl;
    },
    beginOAuthAuthorization: async (input: SdkworkIamH5BeginOAuthAuthorizationInput) => {
      if (typeof window === "undefined") {
        return;
      }
      setState({ challenge: undefined, lastError: undefined, status: "loading" });
      const provider = input.provider?.trim() || WECHAT_PROVIDER;
      // Silent authorization (`snsapi_base`) never shows a consent page to
      // followers; the explicit flow (`snsapi_userinfo`) asks for nickname
      // and avatar on the WeChat consent page.
      const scope: SdkworkIamH5OAuthScope =
        input.mode === "silent" ? "snsapi_base" : "snsapi_userinfo";
      // Beginning an authorization is explicit user intent (automatic
      // redirect or a manual entry click), so the previous failure block no
      // longer applies.
      clearWechatAutoAuthorizationBlock();
      storeOAuthFlowContext({
        mode: input.mode,
        provider,
        redirectUri: input.redirectUri,
      });
      try {
        const authUrl = await requestOAuthAuthorizationUrl(service, {
          provider,
          redirectUri: input.redirectUri,
          scope,
          state: input.state,
        });
        window.location.assign(authUrl);
      } catch (error) {
        clearOAuthFlowContext();
        const message = error instanceof Error ? error.message : "OAuth authorization failed";
        setState({ lastError: message, status: "error" });
        throw error;
      }
    },
    completeScanLogin: async ({ pollSecret, sessionKey }) => {
      setState({ lastError: undefined, status: "loading" });
      try {
        await service.oauth.deviceAuthorizations.sessionCompletions.create(sessionKey, {
          pollSecret,
        });
        clearStoredScanLoginContext();
        setState({ status: "ready" });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Scan login completion failed";
        setState({ lastError: message, status: "error" });
        throw error;
      }
    },
    resolveScanLoginContext: () => resolveScanLoginContext(),
    logout: async () => {
      setState({ status: "loading" });
      try {
        await service.auth.sessions.current.delete();
        setState({ challenge: undefined, session: undefined, status: "ready" });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Logout failed";
        setState({ lastError: message, status: "error" });
        throw error;
      }
    },
    selectOrganization: async (input) => {
      setState({ lastError: undefined, status: "loading" });
      try {
        const response = await service.auth.sessions.loginContextSelection.create(
          buildOrganizationLoginContextSelectionBody(
            input.continuationToken,
            input.organizationId,
          ),
        );
        return completeSession(response);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Organization selection failed";
        setState({ lastError: message, status: "loginContextSelectionRequired" });
        throw error;
      }
    },
    selectPersonalLogin: async (input) => {
      setState({ lastError: undefined, status: "loading" });
      try {
        const response = await service.auth.sessions.loginContextSelection.create(
          buildPersonalLoginContextSelectionBody(input.continuationToken),
        );
        return completeSession(response);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Personal login failed";
        setState({ lastError: message, status: "loginContextSelectionRequired" });
        throw error;
      }
    },
  };
}

/**
 * Resolves the scan-login context from the current H5 URL
 * (`session_key` in the query, `poll_secret` in the fragment) and stores it
 * in `sessionStorage` so the WeChat authorization redirect (which drops the
 * fragment) can still complete the QR session on the callback screen.
 */
export function resolveScanLoginContext(): SdkworkIamH5ScanLoginContext | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }
  const search = new URLSearchParams(window.location.search);
  const sessionKey = trim(search.get("session_key") || search.get("sessionKey") || "");
  if (isBlank(sessionKey)) {
    return readStoredScanLoginContext();
  }
  const fragment = new URLSearchParams((window.location.hash || "").replace(/^#/, ""));
  const pollSecret = trim(fragment.get("poll_secret") || fragment.get("pollSecret") || "");
  const context: SdkworkIamH5ScanLoginContext = {
    pollSecret: isBlank(pollSecret) ? undefined : pollSecret,
    purpose: trim(search.get("purpose") || "") || undefined,
    sessionKey,
  };
  storeScanLoginContext(context);
  return context;
}

/** Builds the OAuth `state` value that carries the QR session key. */
export function buildScanLoginOAuthState(
  sessionKey: string,
  providerCode?: string,
): string {
  const provider = providerCode?.trim();
  if (provider && provider !== WECHAT_PROVIDER) {
    return `${SCAN_LOGIN_PROVIDER_STATE_PREFIX}${provider}:${sessionKey}`;
  }
  return `${SCAN_LOGIN_STATE_PREFIX}${sessionKey}`;
}

/**
 * Extracts the provider code from an OAuth `state` value, if present.
 * Legacy `scan:` states default to `wechat`.
 */
export function readScanLoginProviderFromOAuthState(
  state: string | undefined,
): string | undefined {
  if (!state) {
    return undefined;
  }
  if (state.startsWith(SCAN_LOGIN_PROVIDER_STATE_PREFIX)) {
    const rest = state.slice(SCAN_LOGIN_PROVIDER_STATE_PREFIX.length);
    const provider = rest.split(":").shift()?.trim();
    return isBlank(provider) ? undefined : provider;
  }
  return state.startsWith(SCAN_LOGIN_STATE_PREFIX) ? WECHAT_PROVIDER : undefined;
}

/** Extracts the QR session key from an OAuth `state` value, if present. */
export function readScanLoginSessionKeyFromOAuthState(state: string | undefined): string | undefined {
  if (!state) {
    return undefined;
  }
  let sessionKey: string | undefined;
  if (state.startsWith(SCAN_LOGIN_PROVIDER_STATE_PREFIX)) {
    sessionKey = state
      .slice(SCAN_LOGIN_PROVIDER_STATE_PREFIX.length)
      .split(":")
      [1]?.trim();
  } else if (state.startsWith(SCAN_LOGIN_STATE_PREFIX)) {
    sessionKey = state.slice(SCAN_LOGIN_STATE_PREFIX.length).trim();
  }
  return isBlank(sessionKey) ? undefined : sessionKey;
}

/**
 * Extracts the QR poll secret from an OAuth `state` value, if present
 * (provider scan login embeds it after the session key).
 */
export function readScanLoginPollSecretFromOAuthState(state: string | undefined): string | undefined {
  if (!state || !state.startsWith(SCAN_LOGIN_PROVIDER_STATE_PREFIX)) {
    return undefined;
  }
  const pollSecret = state
    .slice(SCAN_LOGIN_PROVIDER_STATE_PREFIX.length)
    .split(":")
    .slice(2)
    .join(":")
    .trim();
  return isBlank(pollSecret) ? undefined : pollSecret;
}

function storeScanLoginContext(context: SdkworkIamH5ScanLoginContext): void {
  try {
    window.sessionStorage.setItem(SCAN_LOGIN_STORAGE_KEY, JSON.stringify(context));
  } catch {
    // Storage may be unavailable (private mode); the URL context still works.
  }
}

function readStoredScanLoginContext(): SdkworkIamH5ScanLoginContext | undefined {
  try {
    const raw = window.sessionStorage.getItem(SCAN_LOGIN_STORAGE_KEY);
    if (!raw) {
      return undefined;
    }
    const record = JSON.parse(raw) as Record<string, unknown>;
    const sessionKey = optionalString(record.sessionKey);
    if (!sessionKey) {
      return undefined;
    }
    return {
      pollSecret: optionalString(record.pollSecret),
      purpose: optionalString(record.purpose),
      sessionKey,
    };
  } catch {
    return undefined;
  }
}

function clearStoredScanLoginContext(): void {
  try {
    window.sessionStorage.removeItem(SCAN_LOGIN_STORAGE_KEY);
  } catch {
    // Ignore storage failures on logout/completion.
  }
}

/**
 * Stores the OAuth flow context before the provider authorization redirect
 * (sessionStorage survives the full redirect round trip). The callback screen
 * reads it to recover the flow mode and escalate silent failures.
 */
export function storeOAuthFlowContext(context: SdkworkIamH5OAuthFlowContext): void {
  try {
    window.sessionStorage.setItem(OAUTH_FLOW_STORAGE_KEY, JSON.stringify(context));
  } catch {
    // Storage may be unavailable (private mode); the callback screen falls
    // back to the explicit consent flow.
  }
}

/** Reads the OAuth flow context stored before the provider redirect. */
export function readOAuthFlowContext(): SdkworkIamH5OAuthFlowContext | undefined {
  try {
    const raw = window.sessionStorage.getItem(OAUTH_FLOW_STORAGE_KEY);
    if (!raw) {
      return undefined;
    }
    const record = JSON.parse(raw) as Record<string, unknown>;
    const mode = record.mode;
    if (mode !== "silent" && mode !== "explicit") {
      return undefined;
    }
    const provider = optionalString(record.provider);
    const redirectUri = optionalString(record.redirectUri);
    if (!provider || !redirectUri) {
      return undefined;
    }
    return { mode, provider, redirectUri };
  } catch {
    return undefined;
  }
}

/** Removes the stored OAuth flow context (single-use; the exchange is one-shot). */
export function clearOAuthFlowContext(): void {
  try {
    window.sessionStorage.removeItem(OAUTH_FLOW_STORAGE_KEY);
  } catch {
    // Ignore storage failures on completion.
  }
}

/**
 * Marks the automatic WeChat authorization as blocked. Called when an OAuth
 * attempt ended in error so the login screen does not re-trigger the silent
 * redirect on the next page load (deny → back to sign in → auto redirect
 * would otherwise loop forever).
 */
export function blockWechatAutoAuthorization(): void {
  try {
    window.sessionStorage.setItem(WECHAT_AUTO_BLOCKED_STORAGE_KEY, "1");
  } catch {
    // Storage may be unavailable; the automatic redirect stays enabled.
  }
}

/** Clears the WeChat auto-authorization block (manual entry or success). */
export function clearWechatAutoAuthorizationBlock(): void {
  try {
    window.sessionStorage.removeItem(WECHAT_AUTO_BLOCKED_STORAGE_KEY);
  } catch {
    // Ignore storage failures.
  }
}

/** Returns whether the automatic WeChat authorization is currently blocked. */
export function isWechatAutoAuthorizationBlocked(): boolean {
  try {
    return window.sessionStorage.getItem(WECHAT_AUTO_BLOCKED_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

/**
 * Requests an OAuth authorization URL through the IAM app-api
 * `oauth.authorizationUrls.create` surface (no raw HTTP).
 */
async function requestOAuthAuthorizationUrl(
  service: SdkworkIamService,
  input: {
    provider: string;
    redirectUri: string;
    scope?: SdkworkIamH5OAuthScope;
    state?: string;
  },
): Promise<string> {
  const response = await service.oauth.authorizationUrls.create({
    provider: input.provider,
    redirectUri: input.redirectUri,
    ...(isBlank(input.scope) ? {} : { scope: input.scope }),
    ...(isBlank(input.state) ? {} : { state: input.state }),
  });
  const record = response && typeof response === "object" ? response as Record<string, unknown> : {};
  const authUrl = optionalString(record.authUrl) || optionalString(record.url);
  if (!authUrl) {
    throw new Error("IAM OAuth authorization URL is missing");
  }
  return authUrl;
}

/**
 * Removes the scan-login parameters from the current H5 URL after the QR
 * session was completed, so a reload or back-navigation cannot re-submit
 * the completion (which would otherwise rotate the issued session).
 */
export function clearScanLoginUrlContext(): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    const search = new URLSearchParams(window.location.search);
    search.delete("session_key");
    search.delete("sessionKey");
    search.delete("scan_source");
    search.delete("purpose");
    const nextSearch = search.toString();
    const nextUrl = `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ""}${window.location.hash}`;
    window.history.replaceState(null, "", nextUrl);
  } catch {
    // Best-effort; the backend completion is idempotent as a fallback.
  }
}

function readProviderRecords(value: unknown): Array<Record<string, unknown>> {
  if (Array.isArray(value)) {
    return value.filter((item) => item && typeof item === "object") as Array<Record<string, unknown>>;
  }
  const record = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const candidates = [record.data, record.items, record.records, record.providers];
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate.filter((item) => item && typeof item === "object") as Array<Record<string, unknown>>;
    }
  }
  return [];
}

function readBoolean(...values: unknown[]): boolean | undefined {
  for (const value of values) {
    if (typeof value === "boolean") {
      return value;
    }
  }
  return undefined;
}

function toSession(value: unknown): SdkworkIamH5AuthSession {
  const record = value && typeof value === "object" ? value as Record<string, unknown> : {};
  return {
    accessToken: optionalString(record.accessToken) || optionalString(record.access_token),
    authToken: optionalString(record.authToken) || optionalString(record.auth_token),
    refreshToken: optionalString(record.refreshToken) || optionalString(record.refresh_token),
    sessionId: optionalString(record.sessionId) || optionalString(record.session_id),
    userId: optionalString(record.userId) || optionalString(record.user_id),
  };
}

function optionalString(value: unknown): string | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }
  const normalized = trim(String(value));
  return isBlank(normalized) ? undefined : normalized;
}
