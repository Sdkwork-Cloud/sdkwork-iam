import {
  createSdkworkAuthController,
  type CreateSdkworkAuthControllerOptions,
  type SdkworkAuthController,
} from "./auth-controller.ts";
import {
  createSdkworkLocalAuthService,
  type CreateSdkworkLocalAuthServiceOptions,
} from "./auth-local-service.ts";
export {
  resolveSdkworkAuthRuntimeConfigFromMetadata,
  type SdkworkCanonicalAuthMetadataLike,
} from "./auth-runtime-metadata.ts";
import type {
  SdkworkCanonicalAuthMetadataLike,
} from "./auth-runtime-metadata.ts";
import type { SdkworkMediaResource } from "@sdkwork/runtime-bootstrap";
import { coalesce } from "@sdkwork/utils";
import {
  createSdkworkAuthUserFromIdentity,
  type SdkworkAuthEmailLoginInput,
  type SdkworkAuthLoginInput,
  type SdkworkAuthPasswordResetChannel,
  type SdkworkAuthPhoneLoginInput,
  type SdkworkAuthScene,
  type SdkworkAuthSession,
  type SdkworkAuthSessionBridgeLoginInput,
  type SdkworkAuthUser,
  type SdkworkAuthVerifyType,
} from "./auth-service.ts";

export interface SdkworkCanonicalAuthLoginRequest {
  account?: string;
  email?: string;
  password?: string;
}

export interface SdkworkCanonicalAuthRegisterRequest {
  channel?: SdkworkAuthVerifyType;
  confirmPassword?: string;
  email?: string;
  name?: string;
  password?: string;
  phone?: string;
  tenantId?: string;
  username?: string;
  verificationCode?: string;
}

export interface SdkworkCanonicalAuthSendVerifyCodeRequest {
  scene: SdkworkAuthScene;
  target: string;
  verifyType: SdkworkAuthVerifyType;
}

export interface SdkworkCanonicalAuthEmailCodeLoginRequest {
  appVersion?: string;
  code: string;
  deviceId?: string;
  deviceName?: string;
  deviceType?: SdkworkAuthPhoneLoginInput["deviceType"];
  email: string;
}

export interface SdkworkCanonicalAuthPhoneCodeLoginRequest {
  appVersion?: string;
  code: string;
  deviceId?: string;
  deviceName?: string;
  deviceType?: SdkworkAuthPhoneLoginInput["deviceType"];
  phone: string;
}

export interface SdkworkCanonicalAuthPasswordResetChallengeRequest {
  account: string;
  channel: SdkworkAuthPasswordResetChannel;
}

export interface SdkworkCanonicalAuthPasswordResetRequest {
  account: string;
  code: string;
  confirmPassword?: string;
  newPassword: string;
}

export interface SdkworkCanonicalAuthSessionExchangeRequest {
  avatar?: SdkworkMediaResource;
  bridgeToken?: string;
  email: string;
  name?: string;
  providerKey?: string;
  subject?: string;
  userId?: string;
}

export interface SdkworkCanonicalAuthAuthorityService<
  TAuthenticatedUser,
  TMetadata extends SdkworkCanonicalAuthMetadataLike = SdkworkCanonicalAuthMetadataLike,
> {
  exchangeUserCenterSession?(
    request: SdkworkCanonicalAuthSessionExchangeRequest,
  ): Promise<SdkworkAuthSession>;
  getCurrentSession?(): Promise<SdkworkAuthSession | null>;
  getCurrentUser?(): Promise<TAuthenticatedUser | null>;
  getUserCenterConfig?(): Promise<TMetadata | null>;
  login(
    request: SdkworkCanonicalAuthLoginRequest | string,
    password?: string,
  ): Promise<SdkworkAuthSession>;
  logout(): Promise<void>;
  register(
    request: SdkworkCanonicalAuthRegisterRequest,
  ): Promise<SdkworkAuthSession>;
  requestPasswordReset?(
    request: SdkworkCanonicalAuthPasswordResetChallengeRequest,
  ): Promise<void>;
  resetPassword?(request: SdkworkCanonicalAuthPasswordResetRequest): Promise<void>;
  sendVerifyCode?(request: SdkworkCanonicalAuthSendVerifyCodeRequest): Promise<void>;
  signInWithEmailCode?(
    request: SdkworkCanonicalAuthEmailCodeLoginRequest,
  ): Promise<SdkworkAuthSession>;
  signInWithPhoneCode?(
    request: SdkworkCanonicalAuthPhoneCodeLoginRequest,
  ): Promise<SdkworkAuthSession>;
}

export interface CreateSdkworkCanonicalAuthControllerOptions<
  TAuthenticatedUser,
  TMetadata extends SdkworkCanonicalAuthMetadataLike = SdkworkCanonicalAuthMetadataLike,
> extends Omit<CreateSdkworkAuthControllerOptions, "service"> {
  authConfig?: TMetadata | null;
  defaultSessionBridgeProviderKey?: string;
  resolveSessionBridgeProviderKey?: (
    authConfig?: TMetadata | null,
  ) => string | undefined;
  service: SdkworkCanonicalAuthAuthorityService<TAuthenticatedUser, TMetadata>;
  serviceExtensions?: Pick<
    CreateSdkworkLocalAuthServiceOptions<TAuthenticatedUser>,
    | "checkLoginQrCodeStatus"
    | "currentSession"
    | "generateLoginQrCode"
    | "getOAuthAuthorizationUrl"
    | "signInWithOAuth"
    | "verifyCode"
  >;
  toUser: (user: TAuthenticatedUser) => SdkworkAuthUser;
  user?: TAuthenticatedUser | null;
}

export function createSdkworkAuthSessionBridgeSubject(
  providerKey: string,
  email: string,
): string {
  return `${providerKey.trim()}:${email.trim().toLowerCase()}`;
}

function resolveCanonicalSessionBridgeProviderKey<
  TMetadata extends SdkworkCanonicalAuthMetadataLike,
>(
  authConfig: TMetadata | null | undefined,
  options: Pick<
    CreateSdkworkCanonicalAuthControllerOptions<unknown, TMetadata>,
    "defaultSessionBridgeProviderKey" | "resolveSessionBridgeProviderKey"
  >,
): string {
  const resolvedProviderKey =
    options.resolveSessionBridgeProviderKey?.(authConfig)
    || authConfig?.providerKey?.trim()
    || options.defaultSessionBridgeProviderKey?.trim();

  return resolvedProviderKey || "external-user-center";
}

export function createSdkworkCanonicalAuthController<
  TAuthenticatedUser,
  TMetadata extends SdkworkCanonicalAuthMetadataLike = SdkworkCanonicalAuthMetadataLike,
>(
  options: CreateSdkworkCanonicalAuthControllerOptions<TAuthenticatedUser, TMetadata>,
): SdkworkAuthController {
  return createSdkworkAuthController({
    initialState: options.initialState,
    service: createSdkworkLocalAuthService<TAuthenticatedUser>({
      ...options.serviceExtensions,
      currentSession:
        options.serviceExtensions?.currentSession
        ?? options.service.getCurrentSession?.bind(options.service),
      getCurrentUser: options.service.getCurrentUser?.bind(options.service),
      register: async (input) => {
        const normalizedEmail = coalesce(input.email);
        const normalizedPhone = coalesce(input.phone);
        const normalizedName = coalesce(input.username);
        const verificationCode = coalesce(input.verificationCode);
        return options.service.register({
          channel: input.channel,
          confirmPassword: input.confirmPassword || undefined,
          email: normalizedEmail,
          name: normalizedName,
          password: input.password,
          phone: normalizedPhone,
          tenantId: coalesce(input.tenantId),
          username: normalizedName,
          ...(verificationCode ? { verificationCode } : {}),
        });
      },
      requestPasswordReset: options.service.requestPasswordReset
        ? async (input) =>
            options.service.requestPasswordReset!({
              account: input.account.trim(),
              channel: input.channel,
            })
        : undefined,
      resetPassword: options.service.resetPassword
        ? async (input) =>
            options.service.resetPassword!({
              account: input.account.trim(),
              code: input.code.trim(),
              confirmPassword: input.confirmPassword || undefined,
              newPassword: input.newPassword,
            })
        : undefined,
      sendVerifyCode: options.service.sendVerifyCode
        ? async (input) =>
            options.service.sendVerifyCode!({
              scene: input.scene,
              target: input.target.trim(),
              verifyType: input.verifyType,
            })
        : undefined,
      signIn: async (input: SdkworkAuthLoginInput) =>
        options.service.login({
          account: input.username.trim(),
          email: input.username.trim(),
          password: input.password,
        }),
      signInWithEmailCode: options.service.signInWithEmailCode
        ? async (input: SdkworkAuthEmailLoginInput) =>
            options.service.signInWithEmailCode!({
              appVersion: coalesce(input.appVersion),
              code: input.code.trim(),
              deviceId: coalesce(input.deviceId),
              deviceName: coalesce(input.deviceName),
              deviceType: input.deviceType,
              email: input.email.trim(),
            })
        : undefined,
      signInWithPhoneCode: options.service.signInWithPhoneCode
        ? async (input: SdkworkAuthPhoneLoginInput) =>
            options.service.signInWithPhoneCode!({
              appVersion: coalesce(input.appVersion),
              code: input.code.trim(),
              deviceId: coalesce(input.deviceId),
              deviceName: coalesce(input.deviceName),
              deviceType: input.deviceType,
              phone: input.phone.trim(),
            })
        : undefined,
      signInWithSessionBridge: options.service.exchangeUserCenterSession
        ? async (input: SdkworkAuthSessionBridgeLoginInput) => {
            const providerKey = resolveCanonicalSessionBridgeProviderKey(
              options.authConfig,
              options,
            );
            const normalizedEmail = input.email.trim().toLowerCase();
            return options.service.exchangeUserCenterSession!({
              bridgeToken: coalesce(input.bridgeToken),
              email: normalizedEmail,
              name: coalesce(input.name),
              providerKey,
              subject:
                coalesce(input.subject)
                || createSdkworkAuthSessionBridgeSubject(
                  providerKey,
                  normalizedEmail,
                ),
            });
          }
        : undefined,
      signOut: options.service.logout.bind(options.service),
      toUser: options.toUser,
      user: options.user,
    }),
  });
}

export function createSdkworkAuthUserFromCanonicalIdentity(input: {
  avatar?: SdkworkMediaResource;
  displayName?: string;
  email?: string;
  id?: string;
  name?: string;
  username?: string;
}): SdkworkAuthUser {
  return createSdkworkAuthUserFromIdentity({
    avatar: input.avatar,
    displayName: input.displayName || input.name,
    email: input.email,
    id: input.id,
    username: input.username || input.email,
  });
}
