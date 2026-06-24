import type {
  UserCenterSessionStore,
  UserCenterSessionStoreOptions,
  UserCenterStorageLike,
  UserCenterStoragePlan,
  UserCenterTokenBundle,
  UserCenterTokenStore,
  UserCenterTokenStoreOptions,
} from "../types/userCenterTypes.ts";

function normalizeTokenValue(value: unknown): string | null {
  const normalized = typeof value === "string" ? value.trim() : "";
  return normalized || null;
}

function resolveStorage(
  storageName: "localStorage" | "sessionStorage",
  explicitStorage: UserCenterStorageLike | null | undefined,
): UserCenterStorageLike | null {
  if (explicitStorage !== undefined) {
    return explicitStorage;
  }

  if (typeof globalThis === "undefined") {
    return null;
  }

  try {
    const storage = (globalThis as Record<string, unknown>)[storageName];
    if (!storage || typeof storage !== "object") {
      throw new Error("missing global storage");
    }

    if (
      "getItem" in storage
      && "removeItem" in storage
      && "setItem" in storage
    ) {
      return storage as UserCenterStorageLike;
    }
  } catch {
    // Fall through to the browser-style window lookup below.
  }

  try {
    const windowObject = (globalThis as Record<string, unknown>).window;
    if (!windowObject || typeof windowObject !== "object") {
      return null;
    }

    const storage = (windowObject as Record<string, unknown>)[storageName];
    if (!storage || typeof storage !== "object") {
      return null;
    }

    if (
      "getItem" in storage
      && "removeItem" in storage
      && "setItem" in storage
    ) {
      return storage as UserCenterStorageLike;
    }
  } catch {
    return null;
  }

  return null;
}

function readStorageToken(
  storage: UserCenterStorageLike | null,
  key: string,
): string | null | undefined {
  if (!storage) {
    return undefined;
  }

  try {
    const value = storage.getItem(key);
    if (value === null) {
      return null;
    }

    const normalized = normalizeTokenValue(value);
    if (!normalized) {
      storage.removeItem(key);
      return null;
    }

    return normalized;
  } catch {
    return undefined;
  }
}

function removeStorageTokenWithStatus(
  storage: UserCenterStorageLike | null,
  key: string,
): boolean {
  if (!storage) {
    return false;
  }

  try {
    storage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

function removeStorageToken(storage: UserCenterStorageLike | null, key: string): void {
  removeStorageTokenWithStatus(storage, key);
}

function writeStorageToken(
  storage: UserCenterStorageLike | null,
  key: string,
  token: string,
): boolean {
  if (!storage) {
    return false;
  }

  try {
    storage.setItem(key, token);
    return true;
  } catch {
    return false;
  }
}

function normalizeTokenBundle(bundle: UserCenterTokenBundle | undefined): UserCenterTokenBundle {
  if (!bundle) {
    return {};
  }

  return {
    ...(normalizeTokenValue(bundle.accessToken) ? { accessToken: normalizeTokenValue(bundle.accessToken)! } : {}),
    ...(normalizeTokenValue(bundle.authToken) ? { authToken: normalizeTokenValue(bundle.authToken)! } : {}),
    ...(normalizeTokenValue(bundle.refreshToken) ? { refreshToken: normalizeTokenValue(bundle.refreshToken)! } : {}),
    ...(normalizeTokenValue(bundle.sessionToken) ? { sessionToken: normalizeTokenValue(bundle.sessionToken)! } : {}),
    ...(normalizeTokenValue(bundle.tokenType) ? { tokenType: normalizeTokenValue(bundle.tokenType)! } : {}),
  };
}

function mergeTokenBundles(
  previousBundle: UserCenterTokenBundle,
  nextBundle: UserCenterTokenBundle,
): UserCenterTokenBundle {
  return normalizeTokenBundle({
    ...previousBundle,
    ...nextBundle,
  });
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

function createCanonicalLocalStorageKeys(
  storagePlan: UserCenterStoragePlan,
  legacySessionTokenKeys: string[],
): string[] {
  return [
    storagePlan.sessionTokenKey,
    storagePlan.authTokenKey,
    storagePlan.accessTokenKey,
    storagePlan.refreshTokenKey,
    storagePlan.tokenTypeKey,
    ...legacySessionTokenKeys,
  ].filter((value, index, values) => values.indexOf(value) === index);
}

function readTokenBundleFromStorage(
  storage: UserCenterStorageLike | null,
  storagePlan: UserCenterStoragePlan,
  legacySessionTokenKeys: string[],
): UserCenterTokenBundle {
  const sessionToken =
    readStorageToken(storage, storagePlan.sessionTokenKey)
    ?? legacySessionTokenKeys
      .map((key) => readStorageToken(storage, key))
      .find((value) => typeof value === "string")
    ?? undefined;
  const bundle = normalizeTokenBundle({
    accessToken: readStorageToken(storage, storagePlan.accessTokenKey) ?? undefined,
    authToken: readStorageToken(storage, storagePlan.authTokenKey) ?? undefined,
    refreshToken: readStorageToken(storage, storagePlan.refreshTokenKey) ?? undefined,
    sessionToken,
    tokenType: readStorageToken(storage, storagePlan.tokenTypeKey) ?? undefined,
  });

  return bundle;
}

function persistTokenBundleToStorage(
  storage: UserCenterStorageLike | null,
  storagePlan: UserCenterStoragePlan,
  bundle: UserCenterTokenBundle,
): boolean {
  if (!storage) {
    return false;
  }

  const operations = [
    bundle.sessionToken
      ? writeStorageToken(storage, storagePlan.sessionTokenKey, bundle.sessionToken)
      : removeStorageTokenWithStatus(storage, storagePlan.sessionTokenKey),
    bundle.authToken
      ? writeStorageToken(storage, storagePlan.authTokenKey, bundle.authToken)
      : removeStorageTokenWithStatus(storage, storagePlan.authTokenKey),
    bundle.accessToken
      ? writeStorageToken(storage, storagePlan.accessTokenKey, bundle.accessToken)
      : removeStorageTokenWithStatus(storage, storagePlan.accessTokenKey),
    bundle.refreshToken
      ? writeStorageToken(storage, storagePlan.refreshTokenKey, bundle.refreshToken)
      : removeStorageTokenWithStatus(storage, storagePlan.refreshTokenKey),
    bundle.tokenType
      ? writeStorageToken(storage, storagePlan.tokenTypeKey, bundle.tokenType)
      : removeStorageTokenWithStatus(storage, storagePlan.tokenTypeKey),
  ];

  return operations.every(Boolean);
}

export function createUserCenterTokenStore(
  storagePlan: UserCenterStoragePlan,
  options: UserCenterTokenStoreOptions = {},
): UserCenterTokenStore {
  const bundleMemoryCache = options.bundleMemoryCache ?? true;
  const sessionStorage = resolveStorage("sessionStorage", options.sessionStorage);
  const localStorage = resolveStorage("localStorage", options.localStorage);
  const legacySessionTokenKeys = options.legacySessionTokenKeys ?? [];
  const localStorageKeys = createCanonicalLocalStorageKeys(storagePlan, legacySessionTokenKeys);
  let cachedBundle: UserCenterTokenBundle = {};
  let hasHydratedBundle = false;

  function clearLocalTokens() {
    for (const key of localStorageKeys) {
      removeStorageToken(localStorage, key);
    }
  }

  function clearSessionTokens() {
    for (const key of [
      storagePlan.sessionTokenKey,
      storagePlan.authTokenKey,
      storagePlan.accessTokenKey,
      storagePlan.refreshTokenKey,
      storagePlan.tokenTypeKey,
    ]) {
      removeStorageToken(sessionStorage, key);
    }
  }

  function hydrateFromStorage(): UserCenterTokenBundle {
    if (bundleMemoryCache && hasHydratedBundle) {
      return cachedBundle;
    }

    const sessionBundle = readTokenBundleFromStorage(
      sessionStorage,
      storagePlan,
      legacySessionTokenKeys,
    );
    if (hasTokenBundleValues(sessionBundle)) {
      cachedBundle = sessionBundle;
      hasHydratedBundle = true;
      return cachedBundle;
    }

    const localBundle = readTokenBundleFromStorage(
      localStorage,
      storagePlan,
      legacySessionTokenKeys,
    );
    if (hasTokenBundleValues(localBundle)) {
      if (persistTokenBundleToStorage(sessionStorage, storagePlan, localBundle)) {
        clearLocalTokens();
      }
      cachedBundle = localBundle;
      hasHydratedBundle = true;
      return cachedBundle;
    }

    cachedBundle = {};
    hasHydratedBundle = true;
    return cachedBundle;
  }

  return {
    clearTokenBundle() {
      clearSessionTokens();
      clearLocalTokens();
      cachedBundle = {};
      hasHydratedBundle = true;
    },

    persistTokenBundle(bundle) {
      const normalizedBundle = normalizeTokenBundle(bundle);
      const mergedBundle = mergeTokenBundles(hydrateFromStorage(), normalizedBundle);
      cachedBundle = mergedBundle;
      hasHydratedBundle = true;

      const persisted = persistTokenBundleToStorage(sessionStorage, storagePlan, mergedBundle);
      if (persisted) {
        clearLocalTokens();
      }

      return persisted;
    },

    readTokenBundle() {
      return {
        ...hydrateFromStorage(),
      };
    },
  };
}

export function createUserCenterSessionStore(
  storagePlan: UserCenterStoragePlan,
  options: UserCenterSessionStoreOptions = {},
): UserCenterSessionStore {
  const tokenStore = createUserCenterTokenStore(storagePlan, options);

  return {
    clearSessionToken() {
      tokenStore.clearTokenBundle();
    },

    persistSessionToken(token) {
      const normalizedToken = normalizeTokenValue(token);
      if (!normalizedToken) {
        throw new TypeError("User center session token must be a non-empty string.");
      }

      return tokenStore.persistTokenBundle({
        sessionToken: normalizedToken,
      });
    },

    readSessionToken() {
      return tokenStore.readTokenBundle().sessionToken ?? null;
    },
  };
}
