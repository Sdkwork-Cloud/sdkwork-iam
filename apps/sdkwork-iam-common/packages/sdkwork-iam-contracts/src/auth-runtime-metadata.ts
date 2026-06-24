export type SdkworkAuthLoginMethod = "emailCode" | "password" | "phoneCode" | "sessionBridge";
export type SdkworkAuthRegisterMethod = "email" | "phone";
export type SdkworkAuthRecoveryMethod = "email" | "phone";
export type SdkworkAuthOAuthProviderRegion = "mainland" | "overseas";

export interface SdkworkAuthVerificationPolicyConfig {
  emailCodeLoginEnabled?: boolean;
  emailRegistrationVerificationRequired?: boolean;
  phoneCodeLoginEnabled?: boolean;
  phoneRegistrationVerificationRequired?: boolean;
  oauthLoginEnabled?: boolean;
}

export interface SdkworkAuthRuntimeConfig {
  loginMethods?: SdkworkAuthLoginMethod[];
  oauthLoginEnabled?: boolean;
  oauthProviderRegion?: SdkworkAuthOAuthProviderRegion;
  oauthProviders?: string[];
  sdkworkOAuthProviderEnabled?: boolean;
  qrLoginEnabled?: boolean;
  recoveryMethods?: SdkworkAuthRecoveryMethod[];
  registerMethods?: SdkworkAuthRegisterMethod[];
  verificationPolicy?: SdkworkAuthVerificationPolicyConfig;
}

export interface SdkworkCanonicalAuthMetadataLike {
  emailCodeLoginEnabled?: boolean;
  emailRegistrationVerificationRequired?: boolean;
  loginMethods?: readonly (string | undefined)[];
  oauthLoginEnabled?: boolean;
  oauthProviderRegion?: SdkworkAuthOAuthProviderRegion;
  oauthProviders?: readonly string[];
  phoneCodeLoginEnabled?: boolean;
  phoneRegistrationVerificationRequired?: boolean;
  providerKey?: string;
  qrLoginEnabled?: boolean;
  recoveryMethods?: readonly (string | undefined)[];
  registerMethods?: readonly (string | undefined)[];
  supportsLocalCredentials?: boolean;
  supportsSessionExchange?: boolean;
  sdkworkOAuthProviderEnabled?: boolean;
  verificationPolicy?: SdkworkAuthVerificationPolicyConfig;
}

export function isSdkworkAuthLoginMethod(value: string | undefined): value is SdkworkAuthLoginMethod {
  return value === "password"
    || value === "phoneCode"
    || value === "emailCode"
    || value === "sessionBridge";
}

export function isSdkworkAuthRegisterMethod(value: string | undefined): value is SdkworkAuthRegisterMethod {
  return value === "email" || value === "phone";
}

export function isSdkworkAuthRecoveryMethod(value: string | undefined): value is SdkworkAuthRecoveryMethod {
  return value === "email" || value === "phone";
}

export function isSdkworkAuthOAuthProviderRegion(
  value: string | undefined,
): value is SdkworkAuthOAuthProviderRegion {
  return value === "mainland" || value === "overseas";
}

export function resolveSdkworkAuthRuntimeConfigFromMetadata<
  TMetadata extends SdkworkCanonicalAuthMetadataLike,
>(
  authConfig?: TMetadata | null,
): SdkworkAuthRuntimeConfig {
  const verificationPolicy = resolveMetadataVerificationPolicy(authConfig);
  const loginMethods: NonNullable<SdkworkAuthRuntimeConfig["loginMethods"]> =
    authConfig?.loginMethods?.length
      ? authConfig.loginMethods
          .filter(isSdkworkAuthLoginMethod)
          .filter((method) => {
            if (method === "emailCode" && verificationPolicy.emailCodeLoginEnabled === false) {
              return false;
            }

            if (method === "phoneCode" && verificationPolicy.phoneCodeLoginEnabled === false) {
              return false;
            }

            return true;
          })
      : (() => {
          const resolvedLoginMethods: NonNullable<SdkworkAuthRuntimeConfig["loginMethods"]> = [];

          if (authConfig?.supportsLocalCredentials ?? true) {
            resolvedLoginMethods.push("password");
          }

          if (authConfig?.supportsSessionExchange) {
            resolvedLoginMethods.push("sessionBridge");
          }

          if (verificationPolicy.emailCodeLoginEnabled) {
            resolvedLoginMethods.push("emailCode");
          }

          if (verificationPolicy.phoneCodeLoginEnabled) {
            resolvedLoginMethods.push("phoneCode");
          }

          return resolvedLoginMethods.length > 0 ? resolvedLoginMethods : ["password"];
        })();
  const configuredRegisterMethods = authConfig?.registerMethods
    ?.filter(isSdkworkAuthRegisterMethod)
    ?? [];
  const registerMethods: NonNullable<SdkworkAuthRuntimeConfig["registerMethods"]> =
    configuredRegisterMethods.length > 0
      ? configuredRegisterMethods
      : ((authConfig?.supportsLocalCredentials ?? true) ? ["email"] : []);
  const recoveryMethods: NonNullable<SdkworkAuthRuntimeConfig["recoveryMethods"]> =
    authConfig?.recoveryMethods?.filter(isSdkworkAuthRecoveryMethod) ?? [];

  return {
    loginMethods,
    oauthLoginEnabled: authConfig?.oauthLoginEnabled ?? false,
    ...(authConfig?.oauthProviderRegion
      ? { oauthProviderRegion: authConfig.oauthProviderRegion }
      : {}),
    oauthProviders: authConfig?.oauthProviders ? [...authConfig.oauthProviders] : [],
    ...(typeof authConfig?.sdkworkOAuthProviderEnabled === "boolean"
      ? { sdkworkOAuthProviderEnabled: authConfig.sdkworkOAuthProviderEnabled }
      : {}),
    ...(typeof authConfig?.qrLoginEnabled === "boolean"
      ? { qrLoginEnabled: authConfig.qrLoginEnabled }
      : {}),
    recoveryMethods,
    registerMethods,
    ...(Object.keys(verificationPolicy).length > 0 ? { verificationPolicy } : {}),
  };
}

function resolveMetadataVerificationPolicy<TMetadata extends SdkworkCanonicalAuthMetadataLike>(
  authConfig?: TMetadata | null,
): SdkworkAuthVerificationPolicyConfig {
  return {
    ...(typeof authConfig?.verificationPolicy?.emailCodeLoginEnabled === "boolean"
      ? { emailCodeLoginEnabled: authConfig.verificationPolicy.emailCodeLoginEnabled }
      : typeof authConfig?.emailCodeLoginEnabled === "boolean"
        ? { emailCodeLoginEnabled: authConfig.emailCodeLoginEnabled }
        : {}),
    ...(typeof authConfig?.verificationPolicy?.emailRegistrationVerificationRequired === "boolean"
      ? { emailRegistrationVerificationRequired: authConfig.verificationPolicy.emailRegistrationVerificationRequired }
      : typeof authConfig?.emailRegistrationVerificationRequired === "boolean"
        ? { emailRegistrationVerificationRequired: authConfig.emailRegistrationVerificationRequired }
        : {}),
    ...(typeof authConfig?.verificationPolicy?.phoneCodeLoginEnabled === "boolean"
      ? { phoneCodeLoginEnabled: authConfig.verificationPolicy.phoneCodeLoginEnabled }
      : typeof authConfig?.phoneCodeLoginEnabled === "boolean"
        ? { phoneCodeLoginEnabled: authConfig.phoneCodeLoginEnabled }
        : {}),
    ...(typeof authConfig?.verificationPolicy?.phoneRegistrationVerificationRequired === "boolean"
      ? { phoneRegistrationVerificationRequired: authConfig.verificationPolicy.phoneRegistrationVerificationRequired }
      : typeof authConfig?.phoneRegistrationVerificationRequired === "boolean"
        ? { phoneRegistrationVerificationRequired: authConfig.phoneRegistrationVerificationRequired }
        : {}),
  };
}
