import {
  isSdkworkAuthLoginMethod,
  isSdkworkAuthRecoveryMethod,
  isSdkworkAuthRegisterMethod,
  type SdkworkAuthOAuthProviderRegion,
  type SdkworkAuthRuntimeConfig,
  type SdkworkAuthVerificationPolicyConfig,
} from "./auth-runtime-config.ts";

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
  verificationPolicy?: SdkworkAuthVerificationPolicyConfig;
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
