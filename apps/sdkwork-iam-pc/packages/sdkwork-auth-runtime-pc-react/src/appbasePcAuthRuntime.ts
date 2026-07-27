import {
  createClient as createAppbaseAppClient,
  type SdkworkAppClient as AppbaseAppSdkClient,
} from "@sdkwork/iam-app-sdk";
import {
  initializeCredentialEntryTokenManager,
  readBootstrapAccessTokenFromProcessEnv,
} from "@sdkwork/iam-credential-entry";
import {
  createIamRuntime,
  createMemoryIamTokenStore,
  type AuthTokenManager,
  type AuthTokens,
  type IamContextStore,
  type IamRuntime,
  type IamRuntimeConfig,
  type IamRuntimeTokenManagerAwareClient,
  type IamStoredSession,
  type IamTokenStore,
  type SdkworkIamService,
} from "@sdkwork/iam-runtime";
import { createTokenManager } from "@sdkwork/sdk-common";
import {
  createSdkworkAppbasePcAuthSessionBridge,
  type CreateSdkworkAppbasePcAuthSessionBridgeOptions,
  type SdkworkAppbasePcAuthSessionBridge,
} from "./appbasePcAuthSessionBridge.ts";
import {
  attachSdkworkSdkSessionAuthBoundary,
  type SdkworkSdkClientWithHttp,
} from "./attachSdkworkSdkSessionAuthBoundary.ts";
import {
  createSdkworkSessionAuthUnauthorizedIntegration,
  type CreateSdkworkSessionAuthUnauthorizedIntegrationOptions,
} from "./createSdkworkSessionAuthUnauthorizedIntegration.ts";

export interface SdkworkAppbasePcAuthRuntimeAppConfig {
  appId: string;
  deploymentMode: IamRuntimeConfig["deploymentMode"];
  environment: IamRuntimeConfig["environment"];
  platform?: string;
}

export interface SdkworkAppbasePcAuthRuntimeBaseUrls {
  appbaseAppApiBaseUrl: string;
}

/**
 * Strip a trailing `/app/v3/api` segment from `appbaseAppApiBaseUrl` before
 * passing it to the generated app SDK client.
 *
 * The generated App SDK already hard-codes `APP_API_PREFIX = "/app/v3/api"`
 * inside `appApiPath()` and prepends it to every request URL. If the caller
 * supplies a base URL that already includes the prefix (for example
 * `https://api.example.com/app/v3/api`), the SDK would otherwise produce
 * double-prefixed URLs like `https://api.example.com/app/v3/api/app/v3/api/...`
 * which the gateway returns as 404.
 *
 * This mirrors `resolveBackendOrigin` for the backend SDK in
 * `@sdkwork/iam-application-bootstrap` so both surfaces accept either an
 * origin (`https://api.example.com`) or a prefixed URL
 * (`https://api.example.com/app/v3/api`) interchangeably.
 */
function resolveAppOrigin(baseUrl: string): string {
  const trimmed = (baseUrl ?? "").trim().replace(/\/+$/u, "");
  if (trimmed.endsWith("/app/v3/api")) {
    return trimmed.slice(0, -"/app/v3/api".length);
  }
  return trimmed;
}

function resolveAppSdkBaseUrl(baseUrl: string): string {
  return resolveAppOrigin(baseUrl);
}

export interface SdkworkAppbasePcAuthRuntimeClientConfig extends Record<string, unknown> {
  authMode: "dual-token";
  baseUrl: string;
  platform: string;
  tokenManager: AuthTokenManager;
}

export interface SdkworkAppbasePcAuthRuntimeHooks {
  onSessionChanged?: (session: IamStoredSession | null) => Promise<unknown> | unknown;
}

export interface SdkworkAppbasePcAuthRuntimeCredentialEntryOptions {
  prepareTokens?: () => void;
}

export type SdkworkAppbasePcAuthRuntimeSdkClient = Partial<IamRuntimeTokenManagerAwareClient>;

export interface CreateSdkworkAppbasePcAuthRuntimeOptions {
  app: SdkworkAppbasePcAuthRuntimeAppConfig;
  baseUrls: SdkworkAppbasePcAuthRuntimeBaseUrls;
  contextStore?: IamContextStore;
  createAppbaseAppClient?: (config: SdkworkAppbasePcAuthRuntimeClientConfig) => AppbaseAppSdkClient;
  credentialEntry?: SdkworkAppbasePcAuthRuntimeCredentialEntryOptions;
  hooks?: SdkworkAppbasePcAuthRuntimeHooks;
  localeProvider?: () => string | undefined;
  sdkClients?: readonly SdkworkAppbasePcAuthRuntimeSdkClient[];
  sessionAuth?: boolean | CreateSdkworkSessionAuthUnauthorizedIntegrationOptions;
  sessionBridge?: CreateSdkworkAppbasePcAuthSessionBridgeOptions;
  tokenManager?: AuthTokenManager;
  tokenStore?: IamTokenStore;
}

export interface SdkworkAppbasePcAuthRuntimeComposition {
  appbaseApp: AppbaseAppSdkClient;
  contextStore: IamContextStore;
  getRuntime(): IamRuntime;
  runtime: IamRuntime;
  sessionBridge?: SdkworkAppbasePcAuthSessionBridge;
  tokenManager: AuthTokenManager;
  tokenStore: IamTokenStore;
}

export function createSdkworkAppbasePcAuthRuntime(
  options: CreateSdkworkAppbasePcAuthRuntimeOptions,
): SdkworkAppbasePcAuthRuntimeComposition {
  const tokenManager = options.tokenManager ?? createTokenManager();
  const bootstrapAccessToken = readBootstrapAccessTokenFromProcessEnv();
  if (options.credentialEntry?.prepareTokens) {
    options.credentialEntry.prepareTokens();
  } else {
    initializeCredentialEntryTokenManager(tokenManager, () => bootstrapAccessToken);
  }
  const sessionBridge = options.sessionBridge
    ? createSdkworkAppbasePcAuthSessionBridge(options.sessionBridge)
    : undefined;
  const tokenStore = options.tokenStore ?? sessionBridge?.tokenStore ?? createMemoryIamTokenStore();
  const platform = options.app.platform ?? "pc";
  const appSdkBaseUrl = resolveAppSdkBaseUrl(options.baseUrls.appbaseAppApiBaseUrl);
  let runtimeForSessionAuth: IamRuntime | undefined;
  const clearRuntimeSession = () => {
    void runtimeForSessionAuth?.clearSession();
  };
  const rawAppbaseApp = (options.createAppbaseAppClient ?? createAppbaseAppClient)({
    authMode: "dual-token",
    baseUrl: appSdkBaseUrl,
    platform,
    tokenManager,
  });
  const appbaseApp = wrapAppbaseAppClientWithSessionAuth(
    rawAppbaseApp,
    options,
    clearRuntimeSession,
  );
  const sdkClients = wrapSdkClientsWithSessionAuth(
    options.sdkClients,
    options,
    clearRuntimeSession,
  );

  const baseRuntime = createIamRuntime({
    bootstrapAccessToken,
    clients: {
      appbaseApp,
      sdkClients,
    },
    config: {
      appApiBaseUrl: options.baseUrls.appbaseAppApiBaseUrl,
      appId: options.app.appId,
      deploymentMode: options.app.deploymentMode,
      environment: options.app.environment,
    },
    contextStore: options.contextStore ?? sessionBridge?.contextStore,
    localeProvider: options.localeProvider,
    tokenManager,
    tokenStore,
  });
  runtimeForSessionAuth = baseRuntime;
  const runtime = createRuntimeWithHooks(
    baseRuntime,
    options.hooks,
  );
  runtimeForSessionAuth = runtime;

  return {
    appbaseApp,
    contextStore: runtime.contextStore,
    getRuntime: () => runtime,
    runtime,
    ...(sessionBridge ? { sessionBridge } : {}),
    tokenManager,
    tokenStore: runtime.tokenStore,
  };
}

function createRuntimeWithHooks(
  runtime: IamRuntime,
  hooks: SdkworkAppbasePcAuthRuntimeHooks | undefined,
): IamRuntime {
  if (!hooks?.onSessionChanged) {
    return runtime;
  }

  const emitSessionChanged = createSessionChangedEmitter(runtime.tokenManager, hooks.onSessionChanged);

  return {
    ...runtime,
    hydrateTokenManager: async () => {
      const tokens = await runtime.hydrateTokenManager();
      await emitSessionChanged(tokens);
      return tokens;
    },
    service: createServiceWithHooks(runtime.service, emitSessionChanged),
  };
}

function createServiceWithHooks(
  service: SdkworkIamService,
  emitSessionChanged: (session: IamStoredSession | AuthTokens | null) => Promise<void>,
): SdkworkIamService {
  return {
    ...service,
    auth: {
      ...service.auth,
      registrations: {
        create: async (body) => {
          const session = await service.auth.registrations.create(body);
          await emitSessionChanged(session);
          return session;
        },
      },
      sessions: {
        ...service.auth.sessions,
        create: async (body) => {
          const session = await service.auth.sessions.create(body);
          await emitSessionChanged(session);
          return session;
        },
        current: {
          ...service.auth.sessions.current,
          delete: async () => {
            await service.auth.sessions.current.delete();
            await emitSessionChanged(null);
          },
          retrieve: async () => {
            const session = await service.auth.sessions.current.retrieve();
            await emitSessionChanged(session);
            return session;
          },
          update: async (body) => {
            const session = await service.auth.sessions.current.update(body);
            await emitSessionChanged(session);
            return session;
          },
        },
        refresh: async (body) => {
          const session = await service.auth.sessions.refresh(body);
          await emitSessionChanged(session);
          return session;
        },
      },
    },
    oauth: {
      ...service.oauth,
      sessions: {
        create: async (body) => {
          const session = await service.oauth.sessions.create(body);
          await emitSessionChanged(session);
          return session;
        },
      },
    },
  };
}

function createSessionChangedEmitter(
  tokenManager: AuthTokenManager,
  onSessionChanged: NonNullable<SdkworkAppbasePcAuthRuntimeHooks["onSessionChanged"]>,
): (session: IamStoredSession | AuthTokens | null) => Promise<void> {
  let lastSessionKey = serializeStoredSession(tokenManager.getTokens());

  return async (session) => {
    const storedSession = session ? toStoredSession(session) : {};
    const nextSessionKey = serializeStoredSession(storedSession);
    if (nextSessionKey === lastSessionKey) {
      return;
    }

    lastSessionKey = nextSessionKey;
    await onSessionChanged(nextSessionKey ? storedSession : null);
  };
}

function toStoredSession(session: IamStoredSession | AuthTokens): IamStoredSession {
  return {
    ...(optionalString(session.accessToken) ? { accessToken: optionalString(session.accessToken) } : {}),
    ...(optionalString(session.authToken) ? { authToken: optionalString(session.authToken) } : {}),
    ...(optionalString(session.refreshToken) ? { refreshToken: optionalString(session.refreshToken) } : {}),
  };
}

function serializeStoredSession(session: IamStoredSession | AuthTokens): string | null {
  const storedSession = toStoredSession(session);
  if (!storedSession.accessToken && !storedSession.authToken && !storedSession.refreshToken) {
    return null;
  }

  return JSON.stringify({
    accessToken: storedSession.accessToken ?? "",
    authToken: storedSession.authToken ?? "",
    refreshToken: storedSession.refreshToken ?? "",
  });
}

function optionalString(value: unknown): string | undefined {
  const normalized = typeof value === "string" ? value.trim() : "";
  return normalized || undefined;
}

function shouldEnableSessionAuth(
  sessionAuth: CreateSdkworkAppbasePcAuthRuntimeOptions["sessionAuth"],
): boolean {
  if (sessionAuth === false) {
    return false;
  }
  return typeof window !== "undefined";
}

function resolveSessionAuthIntegrationOptions(
  options: CreateSdkworkAppbasePcAuthRuntimeOptions,
  clearRuntimeSession?: () => void,
): CreateSdkworkSessionAuthUnauthorizedIntegrationOptions {
  const sessionAuth = options.sessionAuth;
  const integrationOptions =
    sessionAuth === true || sessionAuth === undefined || sessionAuth === false
      ? {}
      : sessionAuth;

  return {
    ...integrationOptions,
    clearSession:
      integrationOptions.clearSession
      ?? clearRuntimeSession
      ?? options.sessionBridge?.clearSession,
  };
}

function wrapAppbaseAppClientWithSessionAuth(
  client: AppbaseAppSdkClient,
  options: CreateSdkworkAppbasePcAuthRuntimeOptions,
  clearRuntimeSession?: () => void,
): AppbaseAppSdkClient {
  if (!shouldEnableSessionAuth(options.sessionAuth)) {
    return client;
  }
  return attachSdkworkSdkSessionAuthBoundary(
    client as AppbaseAppSdkClient & SdkworkSdkClientWithHttp,
    resolveSessionAuthIntegrationOptions(options, clearRuntimeSession),
  ) as AppbaseAppSdkClient;
}

function wrapSdkClientsWithSessionAuth(
  sdkClients: readonly SdkworkAppbasePcAuthRuntimeSdkClient[] | undefined,
  options: CreateSdkworkAppbasePcAuthRuntimeOptions,
  clearRuntimeSession?: () => void,
): readonly SdkworkAppbasePcAuthRuntimeSdkClient[] | undefined {
  if (!sdkClients?.length || !shouldEnableSessionAuth(options.sessionAuth)) {
    return sdkClients;
  }

  const integrationOptions = resolveSessionAuthIntegrationOptions(options, clearRuntimeSession);
  return sdkClients.map((client) =>
    attachSdkworkSdkSessionAuthBoundary(
      client as SdkworkAppbasePcAuthRuntimeSdkClient & SdkworkSdkClientWithHttp,
      integrationOptions,
    ),
  );
}
