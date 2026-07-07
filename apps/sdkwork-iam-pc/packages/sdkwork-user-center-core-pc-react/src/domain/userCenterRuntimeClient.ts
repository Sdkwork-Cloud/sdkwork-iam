import { isSdkWorkSuccessCode } from "@sdkwork/utils";
import type {
  UserCenterAuthInteropContract,
  UserCenterRuntimeClient,
  UserCenterRuntimeClientOptions,
  UserCenterRuntimeConfig,
  UserCenterRuntimeFetch,
  UserCenterRuntimeHeaders,
  UserCenterRuntimeRequestMethod,
  UserCenterRuntimeResponse,
  UserCenterSessionStore,
  UserCenterTokenBundle,
  UserCenterTokenStore,
} from "../types/userCenterTypes.ts";
import {
  assertUserCenterAuthPreflightCompatibility,
} from "./userCenterAuthInterop.ts";
import {
  createUserCenterTokenStore,
} from "./userCenterSession.ts";
import {
  createUserCenterHandshakeSigningMessage,
  createUserCenterSignedHandshakeHeaders,
  createUserCenterStandardHandshakeHeaders,
  filterUserCenterGovernedHeaders,
  isUserCenterUpstreamIntegrationActive,
} from "./userCenterStandard.ts";

interface UserCenterRuntimeEnvelope<T> {
  code?: number | string;
  data?: T;
  message?: string;
  msg?: string;
}

const AUTH_TOKEN_KEYS = ["authToken", "auth_token"] as const;
const ACCESS_TOKEN_KEYS = ["accessToken", "access_token"] as const;
const REFRESH_TOKEN_KEYS = ["refreshToken", "refresh_token"] as const;
const SESSION_TOKEN_KEYS = ["sessionId", "session_id", "sessionToken", "session_token", "token"] as const;
const TOKEN_TYPE_KEYS = ["tokenType", "token_type"] as const;

function isSuccessCode(code: number | string | undefined): boolean {
  if (code === undefined || code === null) {
    return true;
  }

  const parsed = Number(String(code).trim());
  return Number.isFinite(parsed) && isSdkWorkSuccessCode(parsed);
}

function normalizeOptionalText(value: unknown): string | undefined {
  const normalized = typeof value === "string" ? value.trim() : "";
  return normalized || undefined;
}

function hasTokenBundleValues(bundle: UserCenterTokenBundle): boolean {
  return Boolean(
    bundle.accessToken
      || bundle.authToken
      || bundle.refreshToken
      || bundle.sessionToken
      || bundle.tokenType,
  );
}

function mergeTokenBundles(
  previousBundle: UserCenterTokenBundle,
  nextBundle: UserCenterTokenBundle,
): UserCenterTokenBundle {
  return {
    ...(previousBundle.accessToken ? { accessToken: previousBundle.accessToken } : {}),
    ...(previousBundle.authToken ? { authToken: previousBundle.authToken } : {}),
    ...(previousBundle.refreshToken ? { refreshToken: previousBundle.refreshToken } : {}),
    ...(previousBundle.sessionToken ? { sessionToken: previousBundle.sessionToken } : {}),
    ...(previousBundle.tokenType ? { tokenType: previousBundle.tokenType } : {}),
    ...(nextBundle.accessToken ? { accessToken: nextBundle.accessToken } : {}),
    ...(nextBundle.authToken ? { authToken: nextBundle.authToken } : {}),
    ...(nextBundle.refreshToken ? { refreshToken: nextBundle.refreshToken } : {}),
    ...(nextBundle.sessionToken ? { sessionToken: nextBundle.sessionToken } : {}),
    ...(nextBundle.tokenType ? { tokenType: nextBundle.tokenType } : {}),
  };
}

function unwrapRuntimePayload<T>(payload: unknown, fallbackMessage: string): T {
  if (!payload || typeof payload !== "object") {
    return payload as T;
  }

  if (!("code" in payload) && !("data" in payload)) {
    return payload as T;
  }

  const envelope = payload as UserCenterRuntimeEnvelope<T>;
  if (!isSuccessCode(envelope.code)) {
    throw new Error(String(envelope.message || envelope.msg || fallbackMessage).trim());
  }

  return (envelope.data ?? null) as T;
}

function readRuntimePayload(response: UserCenterRuntimeResponse): Promise<unknown> {
  if (response.status === 204) {
    return Promise.resolve(null);
  }

  return response.json().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`User center runtime response JSON parse failed: ${message}`);
  });
}

function resolveDefaultFetch(): UserCenterRuntimeFetch {
  if (typeof globalThis === "undefined" || typeof globalThis.fetch !== "function") {
    return async () => {
      throw new Error("User center runtime fetch is unavailable.");
    };
  }

  return (input, init) => globalThis.fetch(input, init) as Promise<UserCenterRuntimeResponse>;
}

function resolveRuntimeUrl(runtimeConfig: UserCenterRuntimeConfig, path: string): string | URL {
  if (!isUserCenterUpstreamIntegrationActive(runtimeConfig)) {
    return path;
  }

  const baseUrl = normalizeOptionalText(runtimeConfig.provider.baseUrl);
  if (!baseUrl) {
    return path;
  }

  const url = new URL(baseUrl);
  const normalizedBasePath = url.pathname === "/" ? "" : url.pathname.replace(/\/+$/u, "");
  url.pathname = `${normalizedBasePath}${path}`;
  return url;
}

function resolveFallbackMessage(
  method: UserCenterRuntimeRequestMethod,
  path: string,
  responseStatus?: number,
): string {
  const suffix = typeof responseStatus === "number" ? ` -> ${responseStatus}` : "";
  return `User center runtime request failed: ${method} ${path}${suffix}`;
}

function resolveRuntimeTokenHeaders(runtimeConfig: UserCenterRuntimeConfig) {
  return runtimeConfig.auth.tokenHeaders;
}

function resolveAuthorizationScheme(
  tokenBundle: UserCenterTokenBundle,
  tokenHeaders: ReturnType<typeof resolveRuntimeTokenHeaders>,
): string {
  return normalizeOptionalText(tokenBundle.tokenType)
    ?? tokenHeaders.authorizationScheme;
}

function resolveAuthorizationToken(
  tokenBundle: UserCenterTokenBundle,
): string | undefined {
  return tokenBundle.authToken;
}

function shouldAttachRefreshToken(
  runtimeConfig: UserCenterRuntimeConfig,
  path: string,
): boolean {
  return path === runtimeConfig.localApi.sessionRefresh
    || path === runtimeConfig.localApi.sessionLogout;
}

function parseAuthorizationHeader(
  value: string | null | undefined,
  authorizationScheme: string,
): { scheme?: string; token?: string } {
  const normalized = normalizeOptionalText(value);
  if (!normalized) {
    return {};
  }

  const [scheme, ...tokenParts] = normalized.split(/\s+/u);
  if (tokenParts.length === 0) {
    return {
      token: normalized,
    };
  }

  const token = normalizeOptionalText(tokenParts.join(" "));
  if (!token) {
    return {};
  }

  if (scheme.toLowerCase() !== authorizationScheme.toLowerCase()) {
    return {
      token,
    };
  }

  return {
    scheme,
    token,
  };
}

function findFirstStringByKeys(
  value: unknown,
  keys: readonly string[],
  seen = new Set<object>(),
): string | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  if (seen.has(value)) {
    return undefined;
  }

  seen.add(value);
  const record = value as Record<string, unknown>;
  for (const key of keys) {
    const normalized = normalizeOptionalText(record[key]);
    if (normalized) {
      return normalized;
    }
  }

  for (const nestedValue of Object.values(record)) {
    const nestedToken = findFirstStringByKeys(nestedValue, keys, seen);
    if (nestedToken) {
      return nestedToken;
    }
  }

  return undefined;
}

function resolveDefaultTokenBundle(
  runtimeConfig: UserCenterRuntimeConfig,
  response: UserCenterRuntimeResponse,
  data: unknown,
  payload: unknown,
): UserCenterTokenBundle {
  const tokenHeaders = resolveRuntimeTokenHeaders(runtimeConfig);
  const authorization = parseAuthorizationHeader(
    response.headers?.get(tokenHeaders.authorizationHeaderName),
    tokenHeaders.authorizationScheme,
  );

  return {
    ...(normalizeOptionalText(response.headers?.get(tokenHeaders.accessTokenHeaderName))
      || findFirstStringByKeys(data, ACCESS_TOKEN_KEYS)
      || findFirstStringByKeys(payload, ACCESS_TOKEN_KEYS)
      ? {
          accessToken:
            normalizeOptionalText(response.headers?.get(tokenHeaders.accessTokenHeaderName))
            ?? findFirstStringByKeys(data, ACCESS_TOKEN_KEYS)
            ?? findFirstStringByKeys(payload, ACCESS_TOKEN_KEYS),
        }
      : {}),
    ...(authorization.token
      || findFirstStringByKeys(data, AUTH_TOKEN_KEYS)
      || findFirstStringByKeys(payload, AUTH_TOKEN_KEYS)
      ? {
          authToken:
            authorization.token
            ?? findFirstStringByKeys(data, AUTH_TOKEN_KEYS)
            ?? findFirstStringByKeys(payload, AUTH_TOKEN_KEYS),
        }
      : {}),
    ...(normalizeOptionalText(response.headers?.get(tokenHeaders.refreshTokenHeaderName))
      || findFirstStringByKeys(data, REFRESH_TOKEN_KEYS)
      || findFirstStringByKeys(payload, REFRESH_TOKEN_KEYS)
      ? {
          refreshToken:
            normalizeOptionalText(response.headers?.get(tokenHeaders.refreshTokenHeaderName))
            ?? findFirstStringByKeys(data, REFRESH_TOKEN_KEYS)
            ?? findFirstStringByKeys(payload, REFRESH_TOKEN_KEYS),
        }
      : {}),
    ...(normalizeOptionalText(response.headers?.get(tokenHeaders.sessionHeaderName))
      || findFirstStringByKeys(data, SESSION_TOKEN_KEYS)
      || findFirstStringByKeys(payload, SESSION_TOKEN_KEYS)
      ? {
          sessionToken:
            normalizeOptionalText(response.headers?.get(tokenHeaders.sessionHeaderName))
            ?? findFirstStringByKeys(data, SESSION_TOKEN_KEYS)
            ?? findFirstStringByKeys(payload, SESSION_TOKEN_KEYS),
        }
      : {}),
    ...(authorization.scheme
      || findFirstStringByKeys(data, TOKEN_TYPE_KEYS)
      || findFirstStringByKeys(payload, TOKEN_TYPE_KEYS)
      ? {
          tokenType:
            authorization.scheme
            ?? findFirstStringByKeys(data, TOKEN_TYPE_KEYS)
            ?? findFirstStringByKeys(payload, TOKEN_TYPE_KEYS),
        }
      : {}),
  };
}

function createLegacyTokenStore(sessionStore: UserCenterSessionStore): UserCenterTokenStore {
  let cachedBundle: UserCenterTokenBundle = {};

  return {
    clearTokenBundle() {
      cachedBundle = {};
      sessionStore.clearSessionToken();
    },

    persistTokenBundle(bundle) {
      cachedBundle = mergeTokenBundles(cachedBundle, bundle);
      if (!bundle.sessionToken) {
        return false;
      }

      return sessionStore.persistSessionToken(bundle.sessionToken);
    },

    readTokenBundle() {
      const sessionToken = sessionStore.readSessionToken() ?? undefined;

      return {
        ...cachedBundle,
        ...(sessionToken ? { sessionToken } : {}),
      };
    },
  };
}

async function resolveAdditionalAuthHeaders(
  runtimeConfig: UserCenterRuntimeConfig,
  options: UserCenterRuntimeClientOptions,
  method: UserCenterRuntimeRequestMethod,
  path: string,
  tokenBundle: UserCenterTokenBundle,
): Promise<UserCenterRuntimeHeaders> {
  const signedHandshakeHeaders = await resolveSignedHandshakeHeaders(
    runtimeConfig,
    options,
    method,
    path,
    tokenBundle,
  );
  if (!options.resolveAuthHeaders) {
    return signedHandshakeHeaders;
  }

  const additionalHeaders = await options.resolveAuthHeaders({
    method,
    path,
    runtimeConfig,
    tokenBundle,
  });

  return {
    ...(filterUserCenterGovernedHeaders(runtimeConfig, additionalHeaders) ?? {}),
    ...signedHandshakeHeaders,
  };
}

async function resolveSignedHandshakeHeaders(
  runtimeConfig: UserCenterRuntimeConfig,
  options: UserCenterRuntimeClientOptions,
  method: UserCenterRuntimeRequestMethod,
  path: string,
  tokenBundle: UserCenterTokenBundle,
): Promise<UserCenterRuntimeHeaders> {
  if (!options.resolveHandshakeSignature || !runtimeConfig.auth.handshake.enabled) {
    return {};
  }

  const signature = await options.resolveHandshakeSignature({
    createSigningMessage(signedAt: string) {
      return createUserCenterHandshakeSigningMessage({
        config: runtimeConfig,
        method,
        path,
        signedAt,
      });
    },
    method,
    path,
    runtimeConfig,
    tokenBundle,
  });

  if (!signature) {
    return {};
  }

  return createUserCenterSignedHandshakeHeaders(runtimeConfig, signature);
}

async function resolveRuntimeValidationInteropContract(
  runtimeConfig: UserCenterRuntimeConfig,
  options: UserCenterRuntimeClientOptions,
): Promise<UserCenterAuthInteropContract | null> {
  if (options.validationInteropContract) {
    return options.validationInteropContract;
  }

  if (!options.resolveValidationInteropContract) {
    return null;
  }

  return (await options.resolveValidationInteropContract({
    runtimeConfig,
  })) ?? null;
}

export function createUserCenterRuntimeClient(
  runtimeConfig: UserCenterRuntimeConfig,
  options: UserCenterRuntimeClientOptions = {},
): UserCenterRuntimeClient {
  const runtimeFetch = options.fetch ?? resolveDefaultFetch();
  const bundleMemoryCache = runtimeConfig.auth.cachePolicy.bundleMemoryCache;
  const tokenStore = options.tokenStore
    ?? (options.sessionStore
      ? createLegacyTokenStore(options.sessionStore)
      : createUserCenterTokenStore(runtimeConfig.storagePlan, {
          bundleMemoryCache,
        }));
  const resolveSessionToken = options.resolveSessionToken ?? ((context) => {
    const tokenHeaders = resolveRuntimeTokenHeaders(context.runtimeConfig);
    const headerToken = normalizeOptionalText(
      context.response.headers?.get(tokenHeaders.sessionHeaderName),
    );
    if (headerToken) {
      return headerToken;
    }

    return findFirstStringByKeys(context.data, SESSION_TOKEN_KEYS)
      ?? findFirstStringByKeys(context.payload, SESSION_TOKEN_KEYS)
      ?? null;
  });
  const resolveTokenBundle = options.resolveTokenBundle ?? ((context) => {
    const bundle = resolveDefaultTokenBundle(
      context.runtimeConfig,
      context.response,
      context.data,
      context.payload,
    );
    const legacySessionToken = resolveSessionToken(context);

    return mergeTokenBundles(
      bundle,
      legacySessionToken ? { sessionToken: legacySessionToken } : {},
    );
  });
  const shouldPerformValidationPreflight =
    isUserCenterUpstreamIntegrationActive(runtimeConfig)
    && Boolean(
      options.validationInteropContract
      || options.resolveValidationInteropContract,
    );
  let validationPreflightPromise: Promise<void> | null = null;

  async function ensureValidationPreflight(): Promise<void> {
    if (!shouldPerformValidationPreflight) {
      return;
    }

    if (validationPreflightPromise) {
      return validationPreflightPromise;
    }

    validationPreflightPromise = (async () => {
      const peerContract = await resolveRuntimeValidationInteropContract(
        runtimeConfig,
        options,
      );

      if (!peerContract) {
        throw new Error(
          "User center validation interop contract is required for upstream runtime preflight.",
        );
      }

      assertUserCenterAuthPreflightCompatibility({
        peerContract,
        source: runtimeConfig.auth,
      });
    })();

    return validationPreflightPromise;
  }

  async function request<TResponse>(
    method: UserCenterRuntimeRequestMethod,
    path: string,
    body?: unknown,
  ): Promise<TResponse> {
    await ensureValidationPreflight();

    const tokenBundle = tokenStore.readTokenBundle();
    const headers: UserCenterRuntimeHeaders = {
      Accept: "application/json",
      ...(filterUserCenterGovernedHeaders(runtimeConfig, runtimeConfig.provider.headers) ?? {}),
      ...createUserCenterStandardHandshakeHeaders(runtimeConfig),
    };
    const tokenHeaders = resolveRuntimeTokenHeaders(runtimeConfig);
    const authorizationToken = resolveAuthorizationToken(tokenBundle);

    if (authorizationToken) {
      headers[tokenHeaders.authorizationHeaderName] =
        `${resolveAuthorizationScheme(tokenBundle, tokenHeaders)} ${authorizationToken}`;
    }
    if (tokenBundle.accessToken) {
      headers[tokenHeaders.accessTokenHeaderName] = tokenBundle.accessToken;
    }
    if (tokenBundle.refreshToken && shouldAttachRefreshToken(runtimeConfig, path)) {
      headers[tokenHeaders.refreshTokenHeaderName] = tokenBundle.refreshToken;
    }
    if (tokenBundle.sessionToken) {
      headers[tokenHeaders.sessionHeaderName] = tokenBundle.sessionToken;
    }

    Object.assign(
      headers,
      await resolveAdditionalAuthHeaders(runtimeConfig, options, method, path, tokenBundle),
    );

    if (body !== undefined) {
      headers["Content-Type"] = "application/json";
    }

    const response = await runtimeFetch(resolveRuntimeUrl(runtimeConfig, path), {
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      headers,
      method,
    });
    const payload = await readRuntimePayload(response);
    const fallbackMessage = resolveFallbackMessage(method, path, response.status);
    const data = unwrapRuntimePayload<TResponse>(payload, fallbackMessage);

    if (!response.ok) {
      throw new Error(fallbackMessage);
    }

    const nextTokenBundle = resolveTokenBundle({
      data,
      payload,
      response,
      runtimeConfig,
    });
    if (nextTokenBundle && hasTokenBundleValues(nextTokenBundle)) {
      tokenStore.persistTokenBundle(nextTokenBundle);
    }

    return data;
  }

  return {
    bootstrapSession(payload) {
      return request("POST", runtimeConfig.localApi.sessionBootstrap, payload);
    },

    getHealth() {
      return request("GET", runtimeConfig.localApi.health);
    },

    getPreferences() {
      return request("GET", runtimeConfig.localApi.preferences);
    },

    getProfile() {
      return request("GET", runtimeConfig.localApi.profile);
    },

    getTenant() {
      return request("GET", runtimeConfig.localApi.tenant);
    },

    loginSession(payload) {
      return request("POST", runtimeConfig.localApi.sessionLogin, payload);
    },

    async logoutSession(payload) {
      try {
        return await request("POST", runtimeConfig.localApi.sessionLogout, payload);
      } finally {
        tokenStore.clearTokenBundle();
      }
    },

    refreshSession(payload) {
      return request("POST", runtimeConfig.localApi.sessionRefresh, payload);
    },

    updatePreferences(payload) {
      return request("PATCH", runtimeConfig.localApi.preferences, payload);
    },

    updateProfile(payload) {
      return request("PATCH", runtimeConfig.localApi.profile, payload);
    },
  };
}
