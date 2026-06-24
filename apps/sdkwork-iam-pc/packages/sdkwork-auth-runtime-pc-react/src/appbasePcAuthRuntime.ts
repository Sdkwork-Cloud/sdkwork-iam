import {
  createClient as createAppbaseAppClient,
  type SdkworkAppClient as AppbaseAppSdkClient,
} from "@sdkwork/iam-app-sdk";
import { wrapCredentialEntryClient } from "@sdkwork/iam-credential-entry";
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

export interface SdkworkAppbasePcAuthRuntimeAppConfig {
  appId: string;
  deploymentMode: IamRuntimeConfig["deploymentMode"];
  environment: IamRuntimeConfig["environment"];
  platform?: string;
}

export interface SdkworkAppbasePcAuthRuntimeBaseUrls {
  appbaseAppApiBaseUrl: string;
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
  skipWrap?: boolean;
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
  const sessionBridge = options.sessionBridge
    ? createSdkworkAppbasePcAuthSessionBridge(options.sessionBridge)
    : undefined;
  const tokenStore = options.tokenStore ?? sessionBridge?.tokenStore ?? createMemoryIamTokenStore();
  const platform = options.app.platform ?? "pc";
  const rawAppbaseApp = (options.createAppbaseAppClient ?? createAppbaseAppClient)({
    authMode: "dual-token",
    baseUrl: options.baseUrls.appbaseAppApiBaseUrl,
    platform,
    tokenManager,
  });
  const appbaseApp = options.credentialEntry?.skipWrap
    ? rawAppbaseApp
    : wrapCredentialEntryClient(rawAppbaseApp, {
        tokenManager,
        ...(options.credentialEntry?.prepareTokens
          ? { prepareTokens: options.credentialEntry.prepareTokens }
          : {}),
      });

  const runtime = createRuntimeWithHooks(
    createIamRuntime({
      clients: {
        appbaseApp,
        sdkClients: options.sdkClients,
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
    }),
    options.hooks,
  );

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
