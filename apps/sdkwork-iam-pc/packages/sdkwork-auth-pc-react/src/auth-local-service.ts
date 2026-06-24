import {
  createSdkworkAuthMessages,
  formatSdkworkAuthTemplate,
} from "./auth-copy.ts";
import {
  DEFAULT_SDKWORK_AUTH_VERIFICATION_POLICY,
  type SdkworkAuthResolvedVerificationPolicy,
} from "./auth-runtime-config.ts";
import {
  assertSdkworkAuthSession,
  isSdkworkAuthSession,
  readSdkworkAuthOrganizationSelectionChallenge,
  SdkworkAuthOrganizationSelectionRequiredError,
} from "./auth-service.ts";
import type {
  SdkworkAuthEmailLoginInput,
  SdkworkAuthLoginInput,
  SdkworkAuthLoginQrCode,
  SdkworkAuthLoginQrCodeCallbackInput,
  SdkworkAuthLoginQrCodeCheckOptions,
  SdkworkAuthLoginQrCodeConfirmInput,
  SdkworkAuthLoginQrCodeCreateInput,
  SdkworkAuthLoginQrCodeStatusResult,
  SdkworkAuthOAuthAuthorizationInput,
  SdkworkAuthOAuthAuthorizationCompletion,
  SdkworkAuthOAuthLoginInput,
  SdkworkAuthLoginContextSelectionInput,
  SdkworkAuthOrganizationSelectionInput,
  SdkworkAuthPasswordResetInput,
  SdkworkAuthPasswordResetRequestInput,
  SdkworkAuthPhoneLoginInput,
  SdkworkAuthRefreshSessionInput,
  SdkworkAuthRegisterInput,
  SdkworkAuthSendVerifyCodeInput,
  SdkworkAuthService,
  SdkworkAuthSession,
  SdkworkAuthSessionBridgeLoginInput,
  SdkworkAuthUpdateCurrentSessionInput,
  SdkworkAuthUser,
  SdkworkAuthVerifyCodeInput,
} from "./auth-service.ts";

type SdkworkAuthAction<TResult, TInput> = (
  input: TInput,
) => Promise<TResult> | TResult;

function resolveMethodUnavailableError(
  methodName: string,
): Error {
  const copy = createSdkworkAuthMessages();
  return new Error(
    formatSdkworkAuthTemplate(copy.service.methodUnavailableTemplate, {
      name: methodName,
    }),
  );
}

async function invokeRequiredAction<TResult, TInput>(
  action: SdkworkAuthAction<TResult, TInput> | undefined,
  methodName: string,
  input: TInput,
): Promise<TResult> {
  if (!action) {
    throw resolveMethodUnavailableError(methodName);
  }

  return action(input);
}

function throwIfLegacyTenantSelectionChallenge(result: unknown): void {
  const record = result && typeof result === "object" && !Array.isArray(result)
    ? result as Record<string, unknown>
    : {};
  const challengeType = typeof record.challengeType === "string" ? record.challengeType.trim() : "";
  if (challengeType === "TENANT_SELECTION") {
    throw new Error(
      "tenant selection is no longer supported; tenant is bound by the bootstrap Access-Token",
    );
  }
}

function resolveAuthSession(
  result: unknown,
): SdkworkAuthSession {
  throwIfLegacyTenantSelectionChallenge(result);

  const organizationSelectionChallenge = readSdkworkAuthOrganizationSelectionChallenge(result);
  if (organizationSelectionChallenge) {
    throw new SdkworkAuthOrganizationSelectionRequiredError(organizationSelectionChallenge);
  }

  return assertSdkworkAuthSession(result);
}

function resolveCurrentAuthSession(
  result: SdkworkAuthSession | null | undefined,
): SdkworkAuthSession | null {
  return isSdkworkAuthSession(result) ? result : null;
}

function resolveAuthUser<TAuthenticatedUser>(
  value: SdkworkAuthSession | TAuthenticatedUser | null | undefined,
  toUser: (user: TAuthenticatedUser) => SdkworkAuthUser,
): SdkworkAuthUser | null {
  if (!value) {
    return null;
  }

  return isSdkworkAuthSession(value)
    ? value.user ?? null
    : toUser(value);
}

export interface CreateSdkworkLocalAuthServiceOptions<TAuthenticatedUser> {
  callbackLoginQrCode?: (
    input: SdkworkAuthLoginQrCodeCallbackInput,
  ) => Promise<SdkworkAuthLoginQrCodeStatusResult>;
  checkLoginQrCodeStatus?: (
    sessionKey: string,
    options?: SdkworkAuthLoginQrCodeCheckOptions,
  ) => Promise<SdkworkAuthLoginQrCodeStatusResult>;
  confirmLoginQrCode?: (
    input: SdkworkAuthLoginQrCodeConfirmInput,
  ) => Promise<SdkworkAuthLoginQrCodeStatusResult>;
  completeOAuthAuthorization?: (
    authorizationStateId: string,
  ) => Promise<SdkworkAuthOAuthAuthorizationCompletion>;
  currentSession?: () => Promise<SdkworkAuthSession | null> | SdkworkAuthSession | null;
  getCurrentUser?: () =>
    | Promise<SdkworkAuthSession | TAuthenticatedUser | null | undefined>
    | SdkworkAuthSession
    | TAuthenticatedUser
    | null
    | undefined;
  generateLoginQrCode?: (
    input?: SdkworkAuthLoginQrCodeCreateInput,
  ) => Promise<SdkworkAuthLoginQrCode>;
  getVerificationPolicy?: () =>
    | Promise<SdkworkAuthResolvedVerificationPolicy>
    | SdkworkAuthResolvedVerificationPolicy;
  listOAuthProviders?: () => Promise<string[]> | string[];
  getOAuthAuthorizationUrl?: (
    input: SdkworkAuthOAuthAuthorizationInput,
  ) => Promise<string>;
  register?: SdkworkAuthAction<
    SdkworkAuthSession,
    SdkworkAuthRegisterInput
  >;
  requestPasswordReset?: SdkworkAuthAction<void, SdkworkAuthPasswordResetRequestInput>;
  resetPassword?: SdkworkAuthAction<void, SdkworkAuthPasswordResetInput>;
  refreshSession?: SdkworkAuthAction<
    SdkworkAuthSession,
    SdkworkAuthRefreshSessionInput
  >;
  selectLoginContext?: SdkworkAuthAction<
    SdkworkAuthSession,
    SdkworkAuthLoginContextSelectionInput
  >;
  selectOrganization?: SdkworkAuthAction<
    SdkworkAuthSession,
    SdkworkAuthOrganizationSelectionInput
  >;
  sendVerifyCode?: SdkworkAuthAction<void, SdkworkAuthSendVerifyCodeInput>;
  signIn?: SdkworkAuthAction<
    SdkworkAuthSession,
    SdkworkAuthLoginInput
  >;
  signInWithEmailCode?: SdkworkAuthAction<
    SdkworkAuthSession,
    SdkworkAuthEmailLoginInput
  >;
  signInWithOAuth?: SdkworkAuthAction<
    SdkworkAuthSession,
    SdkworkAuthOAuthLoginInput
  >;
  signInWithPhoneCode?: SdkworkAuthAction<
    SdkworkAuthSession,
    SdkworkAuthPhoneLoginInput
  >;
  signInWithSessionBridge?: SdkworkAuthAction<
    SdkworkAuthSession,
    SdkworkAuthSessionBridgeLoginInput
  >;
  signOut?: () => Promise<void> | void;
  toUser: (user: TAuthenticatedUser) => SdkworkAuthUser;
  updateCurrentSession?: SdkworkAuthAction<
    SdkworkAuthSession,
    SdkworkAuthUpdateCurrentSessionInput
  >;
  user?: TAuthenticatedUser | null;
  verifyCode?: SdkworkAuthAction<boolean, SdkworkAuthVerifyCodeInput>;
}

export function createSdkworkLocalAuthService<TAuthenticatedUser>(
  options: CreateSdkworkLocalAuthServiceOptions<TAuthenticatedUser>,
): SdkworkAuthService {
  async function readCurrentUser(): Promise<SdkworkAuthUser | null> {
    if (options.getCurrentUser) {
      const currentUser = await options.getCurrentUser();
      return resolveAuthUser(currentUser, options.toUser);
    }

    if (options.currentSession) {
      const currentSession = await options.currentSession();
      return currentSession?.user ?? null;
    }

    return options.user ? options.toUser(options.user) : null;
  }

  async function readCurrentSession(): Promise<SdkworkAuthSession | null> {
    if (options.currentSession) {
      return resolveCurrentAuthSession(await options.currentSession());
    }

    if (options.getCurrentUser) {
      const currentUser = await options.getCurrentUser();
      return isSdkworkAuthSession(currentUser) ? currentUser : null;
    }

    return null;
  }

  return {
    async callbackLoginQrCode(input) {
      if (!options.callbackLoginQrCode) {
        throw resolveMethodUnavailableError(
          "callbackLoginQrCode",
        );
      }

      return options.callbackLoginQrCode(input);
    },
    async checkLoginQrCodeStatus(sessionKey, checkOptions) {
      if (!options.checkLoginQrCodeStatus) {
        throw resolveMethodUnavailableError(
          "checkLoginQrCodeStatus",
        );
      }

      return options.checkLoginQrCodeStatus(sessionKey, checkOptions);
    },
    async confirmLoginQrCode(input) {
      if (!options.confirmLoginQrCode) {
        throw resolveMethodUnavailableError(
          "confirmLoginQrCode",
        );
      }

      return options.confirmLoginQrCode(input);
    },
    async completeOAuthAuthorization(authorizationStateId) {
      if (!options.completeOAuthAuthorization) {
        throw resolveMethodUnavailableError("completeOAuthAuthorization");
      }

      return options.completeOAuthAuthorization(authorizationStateId);
    },
    async generateLoginQrCode(input) {
      if (!options.generateLoginQrCode) {
        throw resolveMethodUnavailableError(
          "generateLoginQrCode",
        );
      }

      return options.generateLoginQrCode(input);
    },
    getCurrentSession() {
      return readCurrentSession();
    },
    getCurrentUser() {
      return readCurrentUser();
    },
    async getVerificationPolicy() {
      return options.getVerificationPolicy
        ? options.getVerificationPolicy()
        : { ...DEFAULT_SDKWORK_AUTH_VERIFICATION_POLICY };
    },
    async listOAuthProviders() {
      if (!options.listOAuthProviders) {
        return [];
      }

      return options.listOAuthProviders();
    },
    async getOAuthAuthorizationUrl(input) {
      if (!options.getOAuthAuthorizationUrl) {
        throw resolveMethodUnavailableError(
          "getOAuthAuthorizationUrl",
        );
      }

      return options.getOAuthAuthorizationUrl(input);
    },
    async register(input) {
      const result = await invokeRequiredAction(
        options.register,
        "register",
        input,
      );
      return resolveAuthSession(result);
    },
    async requestPasswordReset(input) {
      return invokeRequiredAction(
        options.requestPasswordReset,
        "requestPasswordReset",
        input,
      );
    },
    async resetPassword(input) {
      return invokeRequiredAction(
        options.resetPassword,
        "resetPassword",
        input,
      );
    },
    async refreshSession(input = {}) {
      const result = await invokeRequiredAction(
        options.refreshSession,
        "refreshSession",
        input,
      );
      return resolveAuthSession(result);
    },
    async selectLoginContext(input) {
      const result = await invokeRequiredAction(
        options.selectLoginContext,
        "selectLoginContext",
        input,
      );
      return resolveAuthSession(result);
    },
    async selectOrganization(input) {
      const result = await invokeRequiredAction(
        options.selectOrganization,
        "selectOrganization",
        input,
      );
      return resolveAuthSession(result);
    },
    async selectPersonalLogin(input) {
      if (options.selectLoginContext) {
        const result = await options.selectLoginContext({
          continuationToken: input.continuationToken,
          loginScope: "TENANT",
        });
        return resolveAuthSession(result);
      }

      throw resolveMethodUnavailableError("selectPersonalLogin");
    },
    async sendVerifyCode(input) {
      return invokeRequiredAction(
        options.sendVerifyCode,
        "sendVerifyCode",
        input,
      );
    },
    async signIn(input) {
      const result = await invokeRequiredAction(
        options.signIn,
        "signIn",
        input,
      );
      return resolveAuthSession(result);
    },
    async signInWithEmailCode(input) {
      const result = await invokeRequiredAction(
        options.signInWithEmailCode,
        "signInWithEmailCode",
        input,
      );
      return resolveAuthSession(result);
    },
    async signInWithOAuth(input) {
      const result = await invokeRequiredAction(
        options.signInWithOAuth,
        "signInWithOAuth",
        input,
      );
      return resolveAuthSession(result);
    },
    async signInWithPhoneCode(input) {
      const result = await invokeRequiredAction(
        options.signInWithPhoneCode,
        "signInWithPhoneCode",
        input,
      );
      return resolveAuthSession(result);
    },
    async signInWithSessionBridge(input) {
      const result = await invokeRequiredAction(
        options.signInWithSessionBridge,
        "signInWithSessionBridge",
        input,
      );
      return resolveAuthSession(result);
    },
    async signOut() {
      if (!options.signOut) {
        throw resolveMethodUnavailableError("signOut");
      }

      await options.signOut();
    },
    async updateCurrentSession(input = {}) {
      const result = await invokeRequiredAction(
        options.updateCurrentSession,
        "updateCurrentSession",
        input,
      );
      return resolveAuthSession(result);
    },
    async verifyCode(input) {
      return invokeRequiredAction(
        options.verifyCode,
        "verifyCode",
        input,
      );
    },
  };
}
