import type {
  UserCenterBridgeConfig,
  UserCenterProtectedTokenName,
  UserCenterServerOperationAuthContract,
  UserCenterServerOperationContract,
  UserCenterServerRouteKey,
} from "../types/userCenterTypes.ts";

export const USER_CENTER_PROTECTED_TOKEN_PREFERENCE = [
  "auth-token",
  "Access-Token",
  "session-token",
] as const satisfies readonly UserCenterProtectedTokenName[];

function createSecureOperationAuth(
  bridgeConfig: UserCenterBridgeConfig,
): UserCenterServerOperationAuthContract {
  return {
    handshakeRequired: bridgeConfig.auth.handshake.enabled,
    protectedTokenPreference: [...USER_CENTER_PROTECTED_TOKEN_PREFERENCE],
    requiresPrincipal: true,
  };
}

function createPublicOperationAuth(
  protectedTokenPreference: readonly UserCenterProtectedTokenName[] = ["session-token"],
): UserCenterServerOperationAuthContract {
  return {
    handshakeRequired: false,
    protectedTokenPreference: [...protectedTokenPreference],
    requiresPrincipal: false,
  };
}

function createOperation(
  _bridgeConfig: UserCenterBridgeConfig,
  routeKey: UserCenterServerRouteKey,
  method: UserCenterServerOperationContract["method"],
  path: string,
  operationId: string,
  summary: string,
  auth: UserCenterServerOperationAuthContract,
): UserCenterServerOperationContract {
  return {
    auth,
    method,
    operationId,
    path,
    routeKey,
    summary,
  };
}

export function createUserCenterCanonicalServerOperations(
  bridgeConfig: UserCenterBridgeConfig,
): UserCenterServerOperationContract[] {
  const secureOperationAuth = createSecureOperationAuth(bridgeConfig);
  const publicOperationAuth = createPublicOperationAuth();

  return [
    createOperation(
      bridgeConfig,
      "authConfig",
      "GET",
      bridgeConfig.localApi.authConfig,
      "auth.getConfig",
      "Get active user-center provider metadata and login capability switches.",
      publicOperationAuth,
    ),
    createOperation(
      bridgeConfig,
      "authSession",
      "GET",
      bridgeConfig.localApi.authSession,
      "auth.getSession",
      "Get the current login session snapshot for the active principal.",
      createPublicOperationAuth(["auth-token", "Access-Token", "session-token"]),
    ),
    createOperation(
      bridgeConfig,
      "authLogin",
      "POST",
      bridgeConfig.localApi.authLogin,
      "auth.login",
      "Create a login session with account and password credentials.",
      publicOperationAuth,
    ),
    createOperation(
      bridgeConfig,
      "authLoginContextSelection",
      "POST",
      bridgeConfig.localApi.authLoginContextSelection,
      "auth.loginContext.selection",
      "Resolve a login-context selection challenge and continue the login flow.",
      publicOperationAuth,
    ),
    createOperation(
      bridgeConfig,
      "authOrganizationSelection",
      "POST",
      bridgeConfig.localApi.authOrganizationSelection,
      "auth.organization.selection",
      "Resolve an organization-selection challenge and continue the login flow.",
      publicOperationAuth,
    ),
    createOperation(
      bridgeConfig,
      "authEmailLogin",
      "POST",
      bridgeConfig.localApi.authEmailLogin,
      "auth.login.email",
      "Create a login session with email verification credentials.",
      publicOperationAuth,
    ),
    createOperation(
      bridgeConfig,
      "authPhoneLogin",
      "POST",
      bridgeConfig.localApi.authPhoneLogin,
      "auth.login.phone",
      "Create a login session with phone verification credentials.",
      publicOperationAuth,
    ),
    createOperation(
      bridgeConfig,
      "authRegister",
      "POST",
      bridgeConfig.localApi.authRegister,
      "auth.register",
      "Register a local user and return the initial account projection when enabled.",
      publicOperationAuth,
    ),
    createOperation(
      bridgeConfig,
      "authPasswordResetRequest",
      "POST",
      bridgeConfig.localApi.authPasswordResetRequest,
      "auth.password.reset.request",
      "Request a password-reset challenge through the configured verification channel.",
      publicOperationAuth,
    ),
    createOperation(
      bridgeConfig,
      "authPasswordReset",
      "POST",
      bridgeConfig.localApi.authPasswordReset,
      "auth.password.reset",
      "Reset the current account password using a verified recovery challenge.",
      publicOperationAuth,
    ),
    createOperation(
      bridgeConfig,
      "authRefresh",
      "POST",
      bridgeConfig.localApi.authRefresh,
      "auth.refresh",
      "Refresh AuthToken and AccessToken state for the current principal.",
      secureOperationAuth,
    ),
    createOperation(
      bridgeConfig,
      "authLogout",
      "POST",
      bridgeConfig.localApi.authLogout,
      "auth.logout",
      "Revoke the current user-center login session and its token shadows.",
      secureOperationAuth,
    ),
    createOperation(
      bridgeConfig,
      "authSessionExchange",
      "POST",
      bridgeConfig.localApi.authSessionExchange,
      "auth.session.exchange",
      "Exchange an upstream or third-party session into the local AuthToken and AccessToken bundle.",
      publicOperationAuth,
    ),
    createOperation(
      bridgeConfig,
      "userProfileGet",
      "GET",
      bridgeConfig.localApi.userProfile,
      "user.profile.get",
      "Get the current user's canonical profile projection.",
      secureOperationAuth,
    ),
    createOperation(
      bridgeConfig,
      "userProfileUpdate",
      "PATCH",
      bridgeConfig.localApi.userProfile,
      "user.profile.update",
      "Update the current user's canonical profile projection.",
      secureOperationAuth,
    ),
    createOperation(
      bridgeConfig,
      "userSettingsGet",
      "GET",
      bridgeConfig.localApi.userSettings,
      "user.settings.get",
      "Get the current user's settings projection.",
      secureOperationAuth,
    ),
    createOperation(
      bridgeConfig,
      "userSettingsUpdate",
      "PATCH",
      bridgeConfig.localApi.userSettings,
      "user.settings.update",
      "Update the current user's settings projection.",
      secureOperationAuth,
    ),
    createOperation(
      bridgeConfig,
      "tenantRootGet",
      "GET",
      bridgeConfig.localApi.tenantRoot,
      "tenant.root.get",
      "Get the active tenant root projection for the current principal.",
      secureOperationAuth,
    ),
    createOperation(
      bridgeConfig,
      "healthGet",
      "GET",
      bridgeConfig.localApi.health,
      "health.get",
      "Get local user-center health and readiness state.",
      createPublicOperationAuth(["session-token"]),
    ),
  ];
}
