import type { UserCenterLocalApiRoutes } from "../types/userCenterTypes.ts";

export const USER_CENTER_DEFAULT_LOCAL_API_BASE_PATH = "/app/v3/api";

function normalizeBasePath(basePath: string | undefined): string {
  const normalized = (basePath ?? USER_CENTER_DEFAULT_LOCAL_API_BASE_PATH).trim();
  if (!normalized || normalized === "/") {
    return USER_CENTER_DEFAULT_LOCAL_API_BASE_PATH;
  }

  const prefixed = normalized.startsWith("/") ? normalized : `/${normalized}`;
  return prefixed.replace(/\/+$/g, "");
}

export function createUserCenterLocalApiRoutes(
  basePath = USER_CENTER_DEFAULT_LOCAL_API_BASE_PATH,
): UserCenterLocalApiRoutes {
  const normalizedBasePath = normalizeBasePath(basePath);
  const authBasePath = `${normalizedBasePath}/auth`;
  const oauthBasePath = `${normalizedBasePath}/oauth`;
  const oauthDeviceAuthorizationsPath = `${oauthBasePath}/device_authorizations`;
  const userProfilePath = `${normalizedBasePath}/iam/users/current`;
  const userSettingsPath = userProfilePath;
  const tenantRootPath = `${normalizedBasePath}/iam/tenants/current`;
  const authConfigPath = `${authBasePath}/config`;
  const authSessionPath = `${authBasePath}/sessions/current`;
  const authSessionExchangePath = `${authBasePath}/sessions`;
  const authLoginPath = `${authBasePath}/sessions`;
  const authEmailLoginPath = authLoginPath;
  const authPhoneLoginPath = authLoginPath;
  const authRegisterPath = `${authBasePath}/registrations`;
  const authOrganizationSelectionPath = `${authBasePath}/sessions/organization_selection`;
  const authLoginContextSelectionPath = `${authBasePath}/sessions/login_context_selection`;
  const authRefreshPath = `${authBasePath}/sessions/refresh`;
  const authLogoutPath = authSessionPath;
  const authPasswordResetRequestPath = `${authBasePath}/password_reset_requests`;
  const authPasswordResetPath = `${authBasePath}/password_resets`;
  const authQrGeneratePath = oauthDeviceAuthorizationsPath;
  const authQrStatusPattern = `${oauthDeviceAuthorizationsPath}/:deviceAuthorizationId`;
  const authQrEntryPattern = `${oauthDeviceAuthorizationsPath}/:deviceAuthorizationId/scans`;
  const authQrCallbackPattern = authQrEntryPattern;
  const authQrConfirmPath = `${oauthDeviceAuthorizationsPath}/:deviceAuthorizationId/password_completions`;
  const authOAuthUrlPath = `${oauthBasePath}/authorization_urls`;
  const authOAuthLoginPath = `${oauthBasePath}/sessions`;

  return {
    authConfig: authConfigPath,
    authEmailLogin: authEmailLoginPath,
    authLogin: authLoginPath,
    authLogout: authLogoutPath,
    authLoginContextSelection: authLoginContextSelectionPath,
    authOrganizationSelection: authOrganizationSelectionPath,
    authOAuthLogin: authOAuthLoginPath,
    authOAuthUrl: authOAuthUrlPath,
    authPasswordReset: authPasswordResetPath,
    authPasswordResetRequest: authPasswordResetRequestPath,
    authPhoneLogin: authPhoneLoginPath,
    authQrCallbackPattern,
    authQrConfirm: authQrConfirmPath,
    authQrEntryPattern,
    authQrGenerate: authQrGeneratePath,
    authQrStatusPattern,
    authRefresh: authRefreshPath,
    authRegister: authRegisterPath,
    authSession: authSessionPath,
    authSessionExchange: authSessionExchangePath,
    health: `${normalizedBasePath}/health`,
    preferences: userSettingsPath,
    profile: userProfilePath,
    sessionBootstrap: authSessionExchangePath,
    sessionLogin: authLoginPath,
    sessionLogout: authLogoutPath,
    sessionLoginContextSelection: authLoginContextSelectionPath,
    sessionOrganizationSelection: authOrganizationSelectionPath,
    sessionRefresh: authRefreshPath,
    tenant: tenantRootPath,
    tenantRoot: tenantRootPath,
    userProfile: userProfilePath,
    userSettings: userSettingsPath,
  };
}
