import {
  useMemo,
  useSyncExternalStore,
} from "react";
import {
  createSdkworkAuthMessages,
} from "./auth-copy.ts";
import {
  createSdkworkAuthService,
  assertSdkworkAuthSession,
  isSdkworkAuthSession,
  type SdkworkAuthEmailLoginInput,
  type SdkworkAuthLoginInput,
  type SdkworkAuthLoginQrCode,
  type SdkworkAuthLoginQrCodeCallbackInput,
  type SdkworkAuthLoginQrCodeConfirmInput,
  type SdkworkAuthLoginQrCodeCheckOptions,
  type SdkworkAuthLoginQrCodeCreateInput,
  type SdkworkAuthLoginQrCodeStatusResult,
  type SdkworkAuthOAuthAuthorizationInput,
  type SdkworkAuthOAuthAuthorizationCompletion,
  type SdkworkAuthOAuthLoginInput,
  type SdkworkAuthLoginContextSelectionInput,
  type SdkworkAuthOrganizationSelectionInput,
  type SdkworkAuthPasswordResetInput,
  type SdkworkAuthPasswordResetRequestInput,
  type SdkworkAuthPhoneLoginInput,
  type SdkworkAuthRefreshSessionInput,
  type SdkworkAuthRegisterInput,
  type SdkworkAuthSendVerifyCodeInput,
  type SdkworkAuthSessionBridgeLoginInput,
  type SdkworkAuthService,
  type SdkworkAuthSession,
  type SdkworkAuthUpdateCurrentSessionInput,
  type SdkworkAuthUser,
  type SdkworkAuthVerifyCodeInput,
} from "./auth-service.ts";
import type {
  SdkworkAuthResolvedVerificationPolicy,
} from "./auth-runtime-config.ts";

export interface SdkworkAuthControllerState {
  isAuthenticated: boolean;
  isBootstrapped: boolean;
  isBusy: boolean;
  lastError?: string;
  session: SdkworkAuthSession | null;
  status: "anonymous" | "authenticated" | "authenticating";
  user: SdkworkAuthUser | null;
}

export interface SdkworkAuthController {
  applySession(session: SdkworkAuthSession): void;
  bootstrap(): Promise<SdkworkAuthControllerState>;
  callbackLoginQrCode(input: SdkworkAuthLoginQrCodeCallbackInput): Promise<SdkworkAuthLoginQrCodeStatusResult>;
  checkLoginQrCodeStatus(
    sessionKey: string,
    options?: SdkworkAuthLoginQrCodeCheckOptions,
  ): Promise<SdkworkAuthLoginQrCodeStatusResult>;
  confirmLoginQrCode(input: SdkworkAuthLoginQrCodeConfirmInput): Promise<SdkworkAuthLoginQrCodeStatusResult>;
  completeOAuthAuthorization(authorizationStateId: string): Promise<SdkworkAuthOAuthAuthorizationCompletion>;
  generateLoginQrCode(input?: SdkworkAuthLoginQrCodeCreateInput): Promise<SdkworkAuthLoginQrCode>;
  getOAuthAuthorizationUrl(input: SdkworkAuthOAuthAuthorizationInput): Promise<string>;
  getVerificationPolicy(): Promise<SdkworkAuthResolvedVerificationPolicy>;
  listOAuthProviders(): Promise<string[]>;
  getState(): SdkworkAuthControllerState;
  register(input: SdkworkAuthRegisterInput): Promise<SdkworkAuthSession>;
  requestPasswordReset(input: SdkworkAuthPasswordResetRequestInput): Promise<void>;
  resetPassword(input: SdkworkAuthPasswordResetInput): Promise<void>;
  refreshSession(input?: SdkworkAuthRefreshSessionInput): Promise<SdkworkAuthSession>;
  selectOrganization(input: SdkworkAuthOrganizationSelectionInput): Promise<SdkworkAuthSession>;
  selectLoginContext(input: SdkworkAuthLoginContextSelectionInput): Promise<SdkworkAuthSession>;
  selectPersonalLogin(input: Pick<SdkworkAuthLoginContextSelectionInput, "continuationToken">): Promise<SdkworkAuthSession>;
  sendVerifyCode(input: SdkworkAuthSendVerifyCodeInput): Promise<void>;
  service: SdkworkAuthService;
  signIn(input: SdkworkAuthLoginInput): Promise<SdkworkAuthSession>;
  signInWithEmailCode(input: SdkworkAuthEmailLoginInput): Promise<SdkworkAuthSession>;
  signInWithOAuth(input: SdkworkAuthOAuthLoginInput): Promise<SdkworkAuthSession>;
  signInWithPhoneCode(input: SdkworkAuthPhoneLoginInput): Promise<SdkworkAuthSession>;
  signInWithSessionBridge(input: SdkworkAuthSessionBridgeLoginInput): Promise<SdkworkAuthSession>;
  signOut(): Promise<void>;
  subscribe(listener: () => void): () => void;
  syncUserProfile(user: SdkworkAuthUser | null): void;
  updateCurrentSession(input?: SdkworkAuthUpdateCurrentSessionInput): Promise<SdkworkAuthSession>;
  verifyCode(input: SdkworkAuthVerifyCodeInput): Promise<boolean>;
}

export interface CreateSdkworkAuthControllerOptions {
  initialState?: Partial<SdkworkAuthControllerState>;
  service?: Partial<SdkworkAuthService>;
}

const DEFAULT_STATE: SdkworkAuthControllerState = {
  isAuthenticated: false,
  isBootstrapped: false,
  isBusy: false,
  session: null,
  status: "anonymous",
  user: null,
};

function resolveSessionState(session: SdkworkAuthSession | null): Pick<SdkworkAuthControllerState, "isAuthenticated" | "session" | "status" | "user"> {
  if (!session) {
    return {
      isAuthenticated: false,
      session: null,
      status: "anonymous",
      user: null,
    };
  }

  const authenticatedSession = assertSdkworkAuthSession(session);
  return {
    isAuthenticated: true,
    session: authenticatedSession,
    status: "authenticated",
    user: authenticatedSession.user ?? null,
  };
}

function resolveInitialControllerState(
  initialState?: Partial<SdkworkAuthControllerState>,
): SdkworkAuthControllerState {
  if (!initialState) {
    return { ...DEFAULT_STATE };
  }

  const session = initialState.session ?? null;
  return {
    ...DEFAULT_STATE,
    ...initialState,
    ...resolveSessionState(isSdkworkAuthSession(session) ? session : null),
  };
}

export function createSdkworkAuthController(
  options: CreateSdkworkAuthControllerOptions = {},
): SdkworkAuthController {
  const copy = createSdkworkAuthMessages();
  const baseService = createSdkworkAuthService();
  const service: SdkworkAuthService = options.service
    ? {
        ...baseService,
        ...options.service,
      }
    : baseService;
  const listeners = new Set<() => void>();
  let state: SdkworkAuthControllerState = resolveInitialControllerState(options.initialState);

  function emit(): void {
    for (const listener of listeners) {
      listener();
    }
  }

  function setState(
    nextState:
      | Partial<SdkworkAuthControllerState>
      | ((currentState: SdkworkAuthControllerState) => Partial<SdkworkAuthControllerState>),
  ): void {
    state = {
      ...state,
      ...(typeof nextState === "function" ? nextState(state) : nextState),
    };
    emit();
  }

  async function runAction<TResult>(
    action: () => Promise<TResult>,
  ): Promise<TResult> {
    setState({
      isBusy: true,
      lastError: undefined,
      status: state.isAuthenticated ? "authenticated" : "authenticating",
    });

    try {
      const result = await action();
      setState({
        isBusy: false,
        status: state.isAuthenticated ? "authenticated" : "anonymous",
      });
      return result;
    } catch (error) {
      setState({
        isBusy: false,
        lastError: error instanceof Error ? error.message : copy.common.requestFailed,
        status: state.isAuthenticated ? "authenticated" : "anonymous",
      });
      throw error;
    }
  }

  function applySession(session: SdkworkAuthSession): void {
    setState({
      ...resolveSessionState(session),
      isBootstrapped: true,
      isBusy: false,
      lastError: undefined,
    });
  }

  return {
    applySession,
    async bootstrap() {
      return runAction(async () => {
        const session = await service.getCurrentSession();
        if (session && !isSdkworkAuthSession(session)) {
          throw new Error("Valid IAM auth session is required.");
        }
        setState({
          ...resolveSessionState(session),
          isBootstrapped: true,
          isBusy: false,
        });
        return state;
      });
    },
    async checkLoginQrCodeStatus(sessionKey, options) {
      return runAction(async () => {
        const result = await service.checkLoginQrCodeStatus(sessionKey, options);
        if (result.session) {
          applySession(result.session);
        }
        return result;
      });
    },
    async callbackLoginQrCode(input) {
      return runAction(() => service.callbackLoginQrCode(input));
    },
    async confirmLoginQrCode(input) {
      return runAction(async () => {
        const result = await service.confirmLoginQrCode(input);
        if (result.session) {
          applySession(result.session);
        }
        return result;
      });
    },
    async completeOAuthAuthorization(authorizationStateId) {
      return runAction(() => service.completeOAuthAuthorization(authorizationStateId));
    },
    async generateLoginQrCode(input) {
      return runAction(() => service.generateLoginQrCode(input));
    },
    async getOAuthAuthorizationUrl(input) {
      return runAction(() => service.getOAuthAuthorizationUrl(input));
    },
    async getVerificationPolicy() {
      return runAction(() => service.getVerificationPolicy());
    },
    async listOAuthProviders() {
      return runAction(() => service.listOAuthProviders());
    },
    getState() {
      return state;
    },
    async register(input) {
      return runAction(async () => {
        const session = await service.register(input);
        applySession(session);
        return session;
      });
    },
    async requestPasswordReset(input) {
      return runAction(() => service.requestPasswordReset(input));
    },
    async resetPassword(input) {
      return runAction(() => service.resetPassword(input));
    },
    async refreshSession(input) {
      return runAction(async () => {
        const session = await service.refreshSession(input);
        applySession(session);
        return session;
      });
    },
    async selectLoginContext(input) {
      return runAction(async () => {
        const session = await service.selectLoginContext(input);
        applySession(session);
        return session;
      });
    },
    async selectOrganization(input) {
      return runAction(async () => {
        const session = await service.selectOrganization(input);
        applySession(session);
        return session;
      });
    },
    async selectPersonalLogin(input) {
      return runAction(async () => {
        const session = await service.selectPersonalLogin(input);
        applySession(session);
        return session;
      });
    },
    async sendVerifyCode(input) {
      return runAction(() => service.sendVerifyCode(input));
    },
    service,
    async signIn(input) {
      return runAction(async () => {
        const session = await service.signIn(input);
        applySession(session);
        return session;
      });
    },
    async signInWithEmailCode(input) {
      return runAction(async () => {
        const session = await service.signInWithEmailCode(input);
        applySession(session);
        return session;
      });
    },
    async signInWithOAuth(input) {
      return runAction(async () => {
        const session = await service.signInWithOAuth(input);
        applySession(session);
        return session;
      });
    },
    async signInWithPhoneCode(input) {
      return runAction(async () => {
        const session = await service.signInWithPhoneCode(input);
        applySession(session);
        return session;
      });
    },
    async signInWithSessionBridge(input) {
      return runAction(async () => {
        const session = await service.signInWithSessionBridge(input);
        applySession(session);
        return session;
      });
    },
    async signOut() {
      return runAction(async () => {
        try {
          await service.signOut();
        } finally {
          setState({
            ...DEFAULT_STATE,
            isBootstrapped: true,
          });
        }
      });
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    syncUserProfile(user) {
      setState((currentState) => ({
        user: isSdkworkAuthSession(currentState.session) ? user : null,
        session: isSdkworkAuthSession(currentState.session)
          ? {
              ...currentState.session,
              user: user ?? undefined,
            }
          : currentState.session,
      }));
    },
    async updateCurrentSession(input) {
      return runAction(async () => {
        const session = await service.updateCurrentSession(input);
        applySession(session);
        return session;
      });
    },
    async verifyCode(input) {
      return runAction(() => service.verifyCode(input));
    },
  };
}

export function useSdkworkAuthController(
  controller?: SdkworkAuthController,
  options?: CreateSdkworkAuthControllerOptions,
): SdkworkAuthController {
  return useMemo(
    () => controller ?? createSdkworkAuthController(options),
    [controller, options],
  );
}

export function useSdkworkAuthControllerState(
  controller: SdkworkAuthController,
): SdkworkAuthControllerState {
  return useSyncExternalStore(
    controller.subscribe,
    controller.getState,
    controller.getState,
  );
}
