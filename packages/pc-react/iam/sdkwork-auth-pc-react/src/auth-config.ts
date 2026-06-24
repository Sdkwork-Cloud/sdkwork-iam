import { createAuthRouteCatalog, resolveAuthRedirectTarget } from "./auth.ts";
import {
  DEFAULT_BASE_PATH,
  normalizeBasePath,
  type SdkworkAuthMode,
} from "./auth-runtime-config.ts";

export {
  clearSdkworkAuthRuntimeConfig,
  DEFAULT_BASE_PATH,
  DEFAULT_SDKWORK_AUTH_DEVELOPMENT_VERIFICATION_CODE,
  DEFAULT_SDKWORK_AUTH_LEFT_RAIL_MODE,
  DEFAULT_SDKWORK_AUTH_LOGIN_METHODS,
  DEFAULT_SDKWORK_AUTH_OAUTH_PROVIDERS,
  DEFAULT_SDKWORK_AUTH_RECOVERY_METHODS,
  DEFAULT_SDKWORK_AUTH_REGISTER_METHODS,
  DEFAULT_SDKWORK_AUTH_VERIFICATION_POLICY,
  OVERSEAS_SDKWORK_AUTH_OAUTH_PROVIDERS,
  getSdkworkAuthRuntimeConfig,
  humanizeSdkworkAuthProvider,
  isConfiguredSdkworkAuthOAuthProvider,
  isSdkworkAuthLoginMethod,
  isSdkworkAuthLeftRailMode,
  isSdkworkAuthDevelopmentVerificationCodeEnabled,
  isSdkworkAuthOAuthLoginEnabled,
  isSdkworkAuthOAuthProviderRegion,
  isSdkworkAuthQrLoginEnabled,
  looksLikeEmailAddress,
  looksLikePhoneNumber,
  normalizeBasePath,
  normalizeSdkworkAuthOAuthProvider,
  normalizeSdkworkAuthThirdPartyLoginErrorMessage,
  readSdkworkIdentityErrorMessage,
  resolveSdkworkAuthDevelopmentPrefill,
  resolveSdkworkAuthDevelopmentVerificationCode,
  resolveSdkworkAuthLeftRailMode,
  resolveSdkworkAuthLoginMethods,
  resolveSdkworkAuthOAuthProviderRegion,
  resolveSdkworkAuthOAuthProviders,
  resolveSdkworkAuthRecoveryMethods,
  resolveSdkworkAuthRegisterMethods,
  resolveSdkworkAuthVerificationPolicy,
  resolveSdkworkRecoveryChannel,
  setSdkworkAuthRuntimeConfig,
  type SdkworkAuthDevelopmentPrefillConfig,
  type SdkworkAuthLoginMethod,
  type SdkworkAuthLeftRailMode,
  type SdkworkAuthMode,
  type SdkworkAuthOAuthProviderRegion,
  type SdkworkAuthQrPanelState,
  type SdkworkAuthRecoveryMethod,
  type SdkworkAuthRegisterMethod,
  type SdkworkAuthResolvedVerificationPolicy,
  type SdkworkAuthRuntimeConfig,
  type SdkworkAuthVerificationPolicyConfig,
} from "./auth-runtime-config.ts";

export const SDKWORK_AUTH_FLOW_QUERY_KEY = "flow";

export function resolveSdkworkAuthMode(
  pathname: string,
  basePath = DEFAULT_BASE_PATH,
): SdkworkAuthMode {
  const normalizedBasePath = normalizeBasePath(basePath);
  const registerPath = `${normalizedBasePath}/register`;
  const forgotPath = `${normalizedBasePath}/forgot-password`;

  if (pathname.startsWith(registerPath)) {
    return "register";
  }

  if (pathname.startsWith(forgotPath)) {
    return "forgot";
  }

  return "login";
}

export function resolveSdkworkAuthFlowMode(
  searchParams: URLSearchParams,
): SdkworkAuthMode | undefined {
  const flow = searchParams.get(SDKWORK_AUTH_FLOW_QUERY_KEY)?.trim().toLowerCase();

  if (flow === "register") {
    return "register";
  }

  if (flow === "forgot" || flow === "forgot-password") {
    return "forgot";
  }

  if (flow === "login") {
    return "login";
  }

  return undefined;
}

export function resolveSdkworkAuthPageMode(
  pathname: string,
  searchParams: URLSearchParams,
  basePath = DEFAULT_BASE_PATH,
): SdkworkAuthMode {
  const pathMode = resolveSdkworkAuthMode(pathname, basePath);

  if (pathMode !== "login") {
    return pathMode;
  }

  return resolveSdkworkAuthFlowMode(searchParams) ?? "login";
}

export function buildSdkworkAuthOAuthCallbackUri(
  provider: string,
  redirectTarget: string,
  options: {
    basePath?: string;
    fallbackRoute?: string;
  } = {},
): string {
  if (typeof window === "undefined" || !window.location?.origin) {
    throw new Error("Third-party login callback URL is unavailable in the current runtime.");
  }

  const routes = createAuthRouteCatalog(options.basePath ?? DEFAULT_BASE_PATH);
  const callbackPath = routes
    .find((route) => route.id === "oauth-callback")
    ?.path.replace(":provider", provider.trim());

  if (!callbackPath) {
    throw new Error("Third-party login callback route is unavailable.");
  }

  const resolvedRedirectTarget = resolveAuthRedirectTarget(
    redirectTarget,
    options.fallbackRoute ?? "/dashboard",
    options.basePath ?? DEFAULT_BASE_PATH,
  );
  const callbackUrl = new URL(callbackPath, window.location.origin);

  if (resolvedRedirectTarget !== (options.fallbackRoute ?? "/dashboard")) {
    callbackUrl.searchParams.set("redirect", resolvedRedirectTarget);
  }

  return callbackUrl.toString();
}
