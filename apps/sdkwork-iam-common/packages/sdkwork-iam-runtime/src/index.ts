import { createIamShardingContext, type IamAppContext, type IamDeploymentMode, type IamEnvironment, type IamShardingContext } from "@sdkwork/iam-contracts";
import { createSdkworkIamService, type IamStoredSession, type SdkworkIamService } from "@sdkwork/iam-service";
import { assertIamAppSdkClient, assertIamBackendSdkClient, type IamAppSdkClient, type IamBackendSdkClient } from "@sdkwork/iam-sdk-ports";
import { assertSdkworkJwtCredential, createSdkworkRuntimeBootstrap } from "@sdkwork/runtime-bootstrap";
import { createTokenManager, type AuthTokenManager, type AuthTokens } from "@sdkwork/sdk-common";
import type { SdkworkAppClient as AppbaseAppSdkClient } from "@sdkwork/iam-app-sdk";
import type { SdkworkBackendClient as AppbaseBackendSdkClient } from "@sdkwork/iam-backend-sdk";

export interface IamRuntimeConfig {
  appApiBaseUrl?: string;
  appId: string;
  backendApiBaseUrl?: string;
  deploymentMode: IamDeploymentMode;
  environment: IamEnvironment;
}

export interface IamTokenStore {
  clear(): Promise<void> | void;
  get(): Promise<IamStoredSession> | IamStoredSession;
  set(session: IamStoredSession): Promise<void> | void;
}

export interface IamSessionStringStorage {
  getItem(key: string): Promise<string | null> | string | null;
  removeItem(key: string): Promise<void> | void;
  setItem(key: string, value: string): Promise<void> | void;
}

export interface CreatePersistentIamTokenStoreInput {
  appId: string;
  storage: IamSessionStringStorage;
}

export const DEFAULT_IAM_SESSION_RETENTION_DAYS = 30;

export function createPersistentIamTokenStore(
  input: CreatePersistentIamTokenStoreInput,
): IamTokenStore {
  const appId = input.appId.trim();
  if (!appId) {
    throw new Error("appId is required for persistent IAM session storage");
  }
  const storageKey = `sdkwork.${appId}.iamSession.v1`;

  return {
    clear: () => input.storage.removeItem(storageKey),
    get: async () => {
      const raw = await input.storage.getItem(storageKey);
      if (!raw) {
        return {};
      }
      try {
        return normalizePersistedIamSession(JSON.parse(raw));
      } catch {
        await input.storage.removeItem(storageKey);
        return {};
      }
    },
    set: async (session) => {
      await input.storage.setItem(
        storageKey,
        JSON.stringify(normalizePersistedIamSession(session)),
      );
    },
  };
}

/**
 * Minimal session shape accepted by shared IAM authentication guards.
 *
 * A SDKWork browser session is authenticated only when it has both tokens:
 * the auth token establishes the IAM identity and the access token carries
 * the selected application context. Feature packages must not reinterpret
 * either token independently.
 */
export interface SdkworkIamAuthenticationSession {
  accessToken?: string | null;
  authToken?: string | null;
}

export function isSdkworkIamSessionAuthenticated(
  session: SdkworkIamAuthenticationSession | null | undefined,
): boolean {
  return Boolean(
    normalizeSdkworkIamAuthenticationToken(session?.authToken)
      && normalizeSdkworkIamAuthenticationToken(session?.accessToken),
  );
}

export function requireSdkworkIamAuthenticatedSession(
  session: SdkworkIamAuthenticationSession | null | undefined,
  message = "Authentication required",
): void {
  if (!isSdkworkIamSessionAuthenticated(session)) {
    throw new Error(message);
  }
}

export interface IamContextStore {
  clear(): Promise<void> | void;
  getAppContext(): Promise<IamAppContext | undefined> | IamAppContext | undefined;
  getShardingContext(): Promise<IamShardingContext | undefined> | IamShardingContext | undefined;
  setAppContext(context: IamAppContext): Promise<void> | void;
}

export interface IamRuntime {
  config: IamRuntimeConfig;
  contextStore: IamContextStore;
  getAuthHeaders(): Promise<Record<string, string>>;
  hydrateTokenManager(): Promise<AuthTokens>;
  service: SdkworkIamService;
  tokenManager: AuthTokenManager;
  tokenStore: IamTokenStore;
}

export interface IamRuntimeTokenManagerAwareClient {
  setTokenManager(manager: AuthTokenManager): unknown;
}

export type IamRuntimeAppbaseAppClient =
  (AppbaseAppSdkClient | IamAppSdkClient) & Partial<IamRuntimeTokenManagerAwareClient>;

export type IamRuntimeAppbaseBackendClient =
  (AppbaseBackendSdkClient | IamBackendSdkClient) & Partial<IamRuntimeTokenManagerAwareClient>;

export interface IamRuntimeClients {
  appbaseApp: IamRuntimeAppbaseAppClient;
  appbaseBackend?: IamRuntimeAppbaseBackendClient;
  sdkClients?: readonly Partial<IamRuntimeTokenManagerAwareClient>[];
}

export interface CreateIamRuntimeInput {
  clients: IamRuntimeClients;
  config: IamRuntimeConfig;
  contextStore?: IamContextStore;
  localeProvider?: () => string | undefined;
  tokenManager?: AuthTokenManager;
  tokenStore: IamTokenStore;
}

export function createIamRuntime(input: CreateIamRuntimeInput): IamRuntime {
  const tokenManager = input.tokenManager ?? createTokenManager();
  const bootstrap = createSdkworkRuntimeBootstrap({
    clients: {
      app: input.clients.appbaseApp,
      ...(input.clients.appbaseBackend ? { backend: input.clients.appbaseBackend } : {}),
    },
    config: input.config,
    localeProvider: input.localeProvider,
    validateAppClient: assertIamAppSdkClient,
    validateBackendClient: assertIamBackendSdkClient,
  });

  bindTokenManager(tokenManager, input.clients.appbaseApp);
  bindTokenManager(tokenManager, input.clients.appbaseBackend);
  for (const client of input.clients.sdkClients ?? []) {
    bindTokenManager(tokenManager, client);
  }
  seedTokenManagerFromStore(input.tokenStore, tokenManager);

  const contextStore = input.contextStore ?? createMemoryIamContextStore();
  const service = createSdkworkIamService({
    appbaseAppClient: bootstrap.clients.app as IamAppSdkClient,
    appbaseBackendClient: bootstrap.clients.backend as IamBackendSdkClient | undefined,
    clearSession: async () => {
      tokenManager.clearTokens();
      await Promise.all([
        input.tokenStore.clear(),
        contextStore.clear(),
      ]);
    },
    commitSession: async (session, options) => {
      const currentSession = options?.preserveRefreshToken
        ? await readCurrentRefreshSession(input.tokenStore, tokenManager)
        : {};
      const storedSession = mergeStoredSession(
        currentSession,
        {
          accessToken: session.accessToken,
          authToken: session.authToken,
          expiresAt: normalizeExpiresAt(session.expiresAt),
          refreshToken: session.refreshToken,
        },
        { preserveRefreshToken: !!options?.preserveRefreshToken },
      );
      await input.tokenStore.set(storedSession);
      try {
        if (session.context) {
          await contextStore.setAppContext(session.context);
        } else {
          await contextStore.clear();
        }
      } catch (error) {
        tokenManager.clearTokens();
        await Promise.all([
          input.tokenStore.clear(),
          contextStore.clear(),
        ]);
        throw error;
      }
      syncTokenManager(tokenManager, storedSession);
    },
  });

  const hydrateTokenManager = async () => {
    const storedSession = await input.tokenStore.get();
    syncTokenManager(tokenManager, storedSession);
    return tokenManager.getTokens();
  };

  return {
    config: { ...bootstrap.config },
    contextStore,
    getAuthHeaders: async () => {
      const headers: Record<string, string> = {};
      const locale = input.localeProvider?.();

      if (locale) {
        headers["Accept-Language"] = locale;
      }

      let tokens = tokenManager.getTokens();
      if (!tokens.authToken || !tokens.accessToken) {
        tokens = await hydrateTokenManager();
      }

      if (tokens.authToken && tokens.accessToken) {
        headers.Authorization = `Bearer ${tokens.authToken}`;
        headers["Access-Token"] = tokens.accessToken;
      }

      return headers;
    },
    hydrateTokenManager,
    service,
    tokenManager,
    tokenStore: input.tokenStore,
  };
}

export function createMemoryIamTokenStore(initial: IamStoredSession = {}): IamTokenStore {
  let current = { ...initial };

  return {
    clear: () => {
      current = {};
    },
    get: () => ({ ...current }),
    set: (session) => {
      current = { ...session };
    },
  };
}

export function createMemoryIamContextStore(): IamContextStore {
  let appContext: IamAppContext | undefined;

  return {
    clear: () => {
      appContext = undefined;
    },
    getAppContext: () => appContext ? { ...appContext, dataScope: [...appContext.dataScope], permissionScope: [...appContext.permissionScope] } : undefined,
    getShardingContext: () => appContext ? createIamShardingContext(appContext) : undefined,
    setAppContext: (context) => {
      appContext = {
        ...context,
        dataScope: [...context.dataScope],
        permissionScope: [...context.permissionScope],
      };
    },
  };
}

function normalizeSdkworkIamAuthenticationToken(value: unknown): string | undefined {
  const token = typeof value === "string" ? value.trim() : "";
  return token || undefined;
}

function normalizePersistedIamSession(value: unknown): IamStoredSession {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  const session = value as Record<string, unknown>;
  const accessToken = normalizeSdkworkIamAuthenticationToken(session.accessToken);
  const authToken = normalizeSdkworkIamAuthenticationToken(session.authToken);
  const refreshToken = normalizeSdkworkIamAuthenticationToken(session.refreshToken);
  const expiresAt = normalizeExpiresAt(session.expiresAt as IamStoredSession["expiresAt"]);
  return {
    ...(accessToken ? { accessToken } : {}),
    ...(authToken ? { authToken } : {}),
    ...(expiresAt ? { expiresAt } : {}),
    ...(refreshToken ? { refreshToken } : {}),
  };
}

function bindTokenManager(
  tokenManager: AuthTokenManager,
  client?: Partial<IamRuntimeTokenManagerAwareClient>,
): void {
  if (typeof client?.setTokenManager === "function") {
    client.setTokenManager(tokenManager);
  }
}

function seedTokenManagerFromStore(tokenStore: IamTokenStore, tokenManager: AuthTokenManager): void {
  if (tokenManager.hasToken()) {
    return;
  }

  try {
    const storedSession = tokenStore.get();
    if (isPromiseLike(storedSession)) {
      void Promise.resolve(storedSession)
        .then((session) => {
          if (!tokenManager.hasToken()) {
            syncTokenManager(tokenManager, session);
          }
        })
        .catch(() => undefined);
      return;
    }

    syncTokenManager(tokenManager, storedSession);
  } catch {
    // Synchronous construction should never fail because storage is unavailable.
  }
}

function syncTokenManager(tokenManager: AuthTokenManager, session: IamStoredSession): void {
  if (isStoredSessionExpired(session)) {
    tokenManager.clearTokens();
    return;
  }

  if (session.accessToken) {
    assertSdkworkJwtCredential(session.accessToken, "Access-Token");
  }
  if (session.authToken) {
    assertSdkworkJwtCredential(session.authToken, "Authorization");
  }

  const tokens = toAuthTokens(session);
  if (tokens.authToken || tokens.accessToken || tokens.refreshToken) {
    tokenManager.setTokens(tokens);
    return;
  }

  tokenManager.clearTokens();
}

function mergeStoredSession(
  current: IamStoredSession | AuthTokens,
  session: IamStoredSession,
  options: { preserveRefreshToken?: boolean } = {},
): IamStoredSession {
  return {
    ...(session.accessToken ? { accessToken: session.accessToken } : {}),
    ...(session.authToken ? { authToken: session.authToken } : {}),
    ...(session.expiresAt ? { expiresAt: session.expiresAt } : {}),
    ...(session.refreshToken ?? (options.preserveRefreshToken ? current.refreshToken : undefined)
      ? { refreshToken: session.refreshToken ?? current.refreshToken }
      : {}),
  };
}

async function readCurrentRefreshSession(
  tokenStore: IamTokenStore,
  tokenManager: AuthTokenManager,
): Promise<IamStoredSession> {
  const storedSession = await tokenStore.get();
  const tokenManagerTokens = tokenManager.getTokens();
  return {
    ...(storedSession.refreshToken ? { refreshToken: storedSession.refreshToken } : {}),
    ...(tokenManagerTokens.refreshToken ? { refreshToken: tokenManagerTokens.refreshToken } : {}),
  };
}

function toAuthTokens(session: IamStoredSession): AuthTokens {
  if (isStoredSessionExpired(session)) {
    return {};
  }
  const expiresAt = normalizeExpiresAt(session.expiresAt);

  return {
    ...(session.accessToken ? { accessToken: session.accessToken } : {}),
    ...(session.authToken ? { authToken: session.authToken } : {}),
    ...(expiresAt ? { expiresAt } : {}),
    ...(session.refreshToken ? { refreshToken: session.refreshToken } : {}),
  };
}

function isStoredSessionExpired(session: IamStoredSession): boolean {
  const timestamp = normalizeExpiresAt(session.expiresAt);
  if (!timestamp) {
    return false;
  }

  return Date.now() >= timestamp;
}

function normalizeExpiresAt(value: IamStoredSession["expiresAt"] | number | undefined): number | undefined {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : undefined;
  }
  if (!value) {
    return undefined;
  }
  const numeric = Number(value);
  if (Number.isFinite(numeric)) {
    return numeric;
  }
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function isPromiseLike<T>(value: T | PromiseLike<T>): value is PromiseLike<T> {
  return !!value && typeof value === "object" && "then" in value && typeof (value as { then?: unknown }).then === "function";
}

export type { IamSession, IamStoredSession, SdkworkIamService } from "@sdkwork/iam-service";
export type { AuthTokenManager, AuthTokens } from "@sdkwork/sdk-common";
