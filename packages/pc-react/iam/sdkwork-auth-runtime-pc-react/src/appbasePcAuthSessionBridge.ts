import { createIamShardingContext, type IamAppContext } from "@sdkwork/iam-contracts";
import type {
  IamContextStore,
  IamStoredSession,
  IamTokenStore,
} from "@sdkwork/iam-runtime";

type MaybePromise<T> = T | Promise<T>;

export interface SdkworkAppbasePcAuthSessionBridgeSession extends IamStoredSession {
  context?: IamAppContext;
  sessionId?: string;
  user?: unknown;
}

export interface CreateSdkworkAppbasePcAuthSessionBridgeOptions<
  TSession extends SdkworkAppbasePcAuthSessionBridgeSession = SdkworkAppbasePcAuthSessionBridgeSession,
> {
  clearSession(): MaybePromise<void>;
  commitSession(session: SdkworkAppbasePcAuthSessionBridgeSession): MaybePromise<TSession | void>;
  readSession(): MaybePromise<TSession | null | undefined>;
}

export interface SdkworkAppbasePcAuthSessionBridge {
  contextStore: IamContextStore;
  tokenStore: IamTokenStore;
}

export function createSdkworkAppbasePcAuthSessionBridge<
  TSession extends SdkworkAppbasePcAuthSessionBridgeSession = SdkworkAppbasePcAuthSessionBridgeSession,
>(
  options: CreateSdkworkAppbasePcAuthSessionBridgeOptions<TSession>,
): SdkworkAppbasePcAuthSessionBridge {
  const readSession = () => options.readSession();

  const tokenStore: IamTokenStore = {
    clear: () => options.clearSession(),
    get: async () => toStoredSession(await readSession()),
    set: async (session) => {
      const storedSession = toStoredSession(session);
      if (!storedSession.accessToken || !storedSession.authToken) {
        await options.clearSession();
        return;
      }

      await options.commitSession(createProductSessionWithTokens(
        await readSession(),
        storedSession,
        session,
      ));
    },
  };

  const contextStore: IamContextStore = {
    clear: async () => {
      const currentSession = await readSession();
      if (!currentSession) {
        return;
      }

      const storedSession = toStoredSession(currentSession);
      if (!storedSession.accessToken && !storedSession.authToken) {
        await options.clearSession();
        return;
      }

      await options.commitSession(createProductSessionWithoutContext(
        currentSession,
        storedSession,
      ));
    },
    getAppContext: async () => (await readSession())?.context,
    getShardingContext: async () => {
      const context = (await readSession())?.context;
      return context ? createIamShardingContext(context) : undefined;
    },
    setAppContext: async (context) => {
      const currentSession = await readSession();
      const storedSession = toStoredSession(currentSession);
      if (!storedSession.accessToken || !storedSession.authToken) {
        return;
      }

      await options.commitSession({
        ...withoutAuthAndContextFields(currentSession),
        ...storedSession,
        context,
        sessionId: context.sessionId || currentSession?.sessionId,
      });
    },
  };

  return {
    contextStore,
    tokenStore,
  };
}

function createProductSessionWithTokens(
  currentSession: SdkworkAppbasePcAuthSessionBridgeSession | null | undefined,
  storedSession: IamStoredSession,
  incomingSession?: Partial<SdkworkAppbasePcAuthSessionBridgeSession> | null,
): SdkworkAppbasePcAuthSessionBridgeSession {
  return {
    ...withoutAuthAndIdentityFields(currentSession),
    ...(storedSession.accessToken ? { accessToken: storedSession.accessToken } : {}),
    ...(storedSession.authToken ? { authToken: storedSession.authToken } : {}),
    ...(storedSession.expiresAt ? { expiresAt: storedSession.expiresAt } : {}),
    ...(hasSessionIdentityFields(incomingSession)
      ? pickSessionIdentityFields(incomingSession as SdkworkAppbasePcAuthSessionBridgeSession)
      : {}),
    ...(storedSession.refreshToken ? { refreshToken: storedSession.refreshToken } : {}),
  };
}

function createProductSessionWithoutContext(
  currentSession: SdkworkAppbasePcAuthSessionBridgeSession,
  storedSession: IamStoredSession,
): SdkworkAppbasePcAuthSessionBridgeSession {
  return {
    ...withoutAuthAndContextFields(currentSession),
    ...storedSession,
    ...(currentSession.sessionId ? { sessionId: currentSession.sessionId } : {}),
  };
}

function withoutAuthAndIdentityFields(
  session: SdkworkAppbasePcAuthSessionBridgeSession | null | undefined,
): Record<string, unknown> {
  const {
    user: _user,
    ...rest
  } = withoutAuthAndContextFields(session);
  return rest;
}

function withoutAuthAndContextFields(
  session: SdkworkAppbasePcAuthSessionBridgeSession | null | undefined,
): Record<string, unknown> {
  if (!session) {
    return {};
  }

  const {
    accessToken: _accessToken,
    authToken: _authToken,
    context: _context,
    expiresAt: _expiresAt,
    refreshToken: _refreshToken,
    sessionId: _sessionId,
    ...rest
  } = session;
  return rest;
}

function hasSessionIdentityFields(
  session: Partial<SdkworkAppbasePcAuthSessionBridgeSession> | null | undefined,
): boolean {
  return Boolean(session?.context || session?.sessionId || session?.user);
}

function pickSessionIdentityFields(
  session: SdkworkAppbasePcAuthSessionBridgeSession,
): Pick<SdkworkAppbasePcAuthSessionBridgeSession, "context" | "sessionId" | "user"> {
  return {
    ...(session.context ? { context: session.context } : {}),
    ...(session.sessionId ? { sessionId: session.sessionId } : {}),
    ...(session.user ? { user: session.user } : {}),
  };
}

function toStoredSession(
  session: Partial<IamStoredSession> | null | undefined,
): IamStoredSession {
  if (!session) {
    return {};
  }

  return {
    ...(optionalString(session.accessToken) ? { accessToken: optionalString(session.accessToken) } : {}),
    ...(optionalString(session.authToken) ? { authToken: optionalString(session.authToken) } : {}),
    ...(optionalString(session.expiresAt) ? { expiresAt: optionalString(session.expiresAt) } : {}),
    ...(optionalString(session.refreshToken) ? { refreshToken: optionalString(session.refreshToken) } : {}),
  };
}

function optionalString(value: unknown): string | undefined {
  const normalized = typeof value === "string" ? value.trim() : "";
  return normalized || undefined;
}
