import type {
  UserCenterAppSdkLikeClient,
  UserCenterRuntimeClient,
  UserCenterRuntimeClientOptions,
  UserCenterRuntimeConfig,
  UserCenterTokenBundle,
} from "../types/userCenterTypes.ts";
import { createUserCenterTokenStore } from "./userCenterSession.ts";

const AUTH_TOKEN_KEYS = ["authToken", "auth_token"] as const;
const ACCESS_TOKEN_KEYS = ["accessToken", "access_token"] as const;
const REFRESH_TOKEN_KEYS = ["refreshToken", "refresh_token"] as const;
const SESSION_TOKEN_KEYS = ["sessionId", "session_id", "sessionToken", "session_token", "token"] as const;
const TOKEN_TYPE_KEYS = ["tokenType", "token_type"] as const;

export interface CreateUserCenterAppSdkRuntimeClientOptions
  extends Omit<UserCenterRuntimeClientOptions, "fetch" | "appSdkClient"> {
  appSdkClient: UserCenterAppSdkLikeClient | (() => UserCenterAppSdkLikeClient);
}

export function hasUserCenterAppSdkClient(
  client: UserCenterAppSdkLikeClient | undefined | null,
): client is UserCenterAppSdkLikeClient {
  return Boolean(
    client?.auth?.sessions?.create
      && client.auth.sessions.refresh
      && client.iam?.users?.current?.retrieve
      && client.iam.users.current.update,
  );
}

export function createUserCenterAppSdkRuntimeClient(
  runtimeConfig: UserCenterRuntimeConfig,
  options: CreateUserCenterAppSdkRuntimeClientOptions,
): UserCenterRuntimeClient {
  function getAppSdkClient(): UserCenterAppSdkLikeClient {
    if (typeof options.appSdkClient === "function") {
      return options.appSdkClient();
    }

    return options.appSdkClient;
  }

  const tokenStore = options.tokenStore
    ?? createUserCenterTokenStore(runtimeConfig.storagePlan);

  function persistTokensFromPayload(payload: unknown): void {
    const bundle = extractTokenBundleFromPayload(payload);
    if (hasTokenBundleValues(bundle)) {
      tokenStore.persistTokenBundle(bundle);
    }
  }

  async function callSdk<TResult>(
    action: (client: UserCenterAppSdkLikeClient) => Promise<unknown> | undefined,
    fallbackMessage: string,
  ): Promise<TResult> {
    const client = getAppSdkClient();
    if (!hasUserCenterAppSdkClient(client)) {
      throw new Error("User center app SDK client is missing required IAM session and profile resources.");
    }

    const payload = await action(client);
    persistTokensFromPayload(payload);
    return unwrapUserCenterAppSdkResult<TResult>(payload, fallbackMessage);
  }

  return {
    bootstrapSession(payload) {
      return callSdk(
        (client) => client.auth!.sessions!.create!(payload),
        "User center session bootstrap failed.",
      );
    },

    getHealth() {
      return Promise.resolve({
        status: "ok",
      } as never);
    },

    getPreferences() {
      return callSdk(
        (client) => client.iam!.users!.current!.retrieve!(),
        "User center preferences request failed.",
      );
    },

    getProfile() {
      return callSdk(
        (client) => client.iam!.users!.current!.retrieve!(),
        "User center profile request failed.",
      );
    },

    getTenant() {
      return callSdk(
        (client) => client.auth!.sessions!.current!.retrieve!(),
        "User center tenant request failed.",
      );
    },

    loginSession(payload) {
      return callSdk(
        (client) => client.auth!.sessions!.create!(payload),
        "User center session login failed.",
      );
    },

    async logoutSession(payload) {
      try {
        return await callSdk(
          (client) => client.auth!.sessions!.current!.delete!(payload),
          "User center session logout failed.",
        );
      } finally {
        tokenStore.clearTokenBundle();
      }
    },

    refreshSession(payload) {
      return callSdk(
        (client) => client.auth!.sessions!.refresh!(payload),
        "User center session refresh failed.",
      );
    },

    updatePreferences(payload) {
      return callSdk(
        (client) => client.iam!.users!.current!.update!(payload),
        "User center preferences update failed.",
      );
    },

    updateProfile(payload) {
      return callSdk(
        (client) => client.iam!.users!.current!.update!(payload),
        "User center profile update failed.",
      );
    },
  };
}

function unwrapUserCenterAppSdkResult<T>(payload: unknown, fallbackMessage: string): T {
  if (!payload || typeof payload !== "object") {
    return payload as T;
  }

  if (!("code" in payload) && !("data" in payload)) {
    return payload as T;
  }

  const envelope = payload as {
    code?: number | string;
    data?: T;
    message?: string;
    msg?: string;
  };
  const normalizedCode = String(envelope.code ?? "0").trim();
  if (normalizedCode !== "0" && normalizedCode !== "200" && normalizedCode !== "2000") {
    throw new Error(String(envelope.message || envelope.msg || fallbackMessage).trim());
  }

  return (envelope.data ?? null) as T;
}

function extractTokenBundleFromPayload(payload: unknown): UserCenterTokenBundle {
  const sources = [payload, unwrapNestedPayload(payload)];
  const bundle: UserCenterTokenBundle = {};

  for (const source of sources) {
    Object.assign(bundle, {
      ...(findFirstStringByKeys(source, ACCESS_TOKEN_KEYS)
        ? { accessToken: findFirstStringByKeys(source, ACCESS_TOKEN_KEYS) }
        : {}),
      ...(findFirstStringByKeys(source, AUTH_TOKEN_KEYS)
        ? { authToken: findFirstStringByKeys(source, AUTH_TOKEN_KEYS) }
        : {}),
      ...(findFirstStringByKeys(source, REFRESH_TOKEN_KEYS)
        ? { refreshToken: findFirstStringByKeys(source, REFRESH_TOKEN_KEYS) }
        : {}),
      ...(findFirstStringByKeys(source, SESSION_TOKEN_KEYS)
        ? { sessionToken: findFirstStringByKeys(source, SESSION_TOKEN_KEYS) }
        : {}),
      ...(findFirstStringByKeys(source, TOKEN_TYPE_KEYS)
        ? { tokenType: findFirstStringByKeys(source, TOKEN_TYPE_KEYS) }
        : {}),
    });
  }

  return bundle;
}

function unwrapNestedPayload(payload: unknown): unknown {
  if (!payload || typeof payload !== "object" || !("data" in payload)) {
    return null;
  }

  return (payload as { data?: unknown }).data ?? null;
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
