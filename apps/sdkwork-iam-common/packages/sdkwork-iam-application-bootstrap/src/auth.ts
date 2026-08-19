import type { IamApplicationBootstrapAuth, IamApplicationBootstrapProfile } from "./types.ts";
import {
  DEFAULT_IAM_ORGANIZATION_ID,
  DEFAULT_IAM_TENANT_ID,
} from "./constants.ts";

export {
  loadBootstrapAuthProfileFromHome,
  loadBootstrapOperatorProfileFromHome,
  loadBootstrapProfileFromHome,
  loadSuperAdminProfileFromHome,
  resolveBootstrapAuthProfileCandidates,
  resolveBootstrapAuthProfileDir,
  resolveBootstrapAuthProfilePaths,
  resolveBootstrapOperatorProfileCandidates,
  resolveLegacyBootstrapUsersDir,
  resolveLegacySuperAdminUsersDir,
  resolveSuperAdminProfileCandidates,
  resolveSuperAdminProfileDir,
  resolveSuperAdminProfilePaths,
  SDKWORK_IAM_BOOTSTRAP_DEFAULT_PROFILE,
  SDKWORK_IAM_BOOTSTRAP_LEGACY_USERS_DIR_NAME,
  SDKWORK_IAM_BOOTSTRAP_OPERATOR_PROFILE_ENV,
  SDKWORK_IAM_BOOTSTRAP_PROFILE_DIR_ENV,
  SDKWORK_IAM_BOOTSTRAP_PROFILE_DIR_NAME,
} from "./bootstrap-auth-profile.ts";
export { resolveSdkworkHomeDir, joinWindowsUserHome } from "./home-dir.ts";
export type {
  LoadBootstrapAuthProfileOptions,
  LoadBootstrapOperatorProfileOptions,
  LoadedBootstrapAuthProfile,
  LoadedBootstrapOperatorProfile,
  LoadedSuperAdminProfile,
  ResolveBootstrapAuthProfileOptions,
  ResolveBootstrapOperatorProfileOptions,
  ResolveSuperAdminProfileOptions,
} from "./bootstrap-auth-profile.ts";

export function mergeBootstrapAuth(
  base: Record<string, unknown>,
  auth: IamApplicationBootstrapAuth,
  profile?: IamApplicationBootstrapProfile | null,
): Record<string, unknown> {
  const payload: Record<string, unknown> = { ...base };

  if (auth.authToken) {
    payload.authToken = auth.authToken;
    return payload;
  }

  const username = auth.username ?? profile?.username ?? profile?.account ?? profile?.email;
  const password = auth.password ?? profile?.password;

  if (username && password) {
    payload.username = username;
    payload.password = password;
    return payload;
  }

  if (password && username) {
    payload.username = username;
    payload.password = password;
    return payload;
  }

  if (password && !payload.username) {
    payload.password = password;
    if (profile?.username) {
      payload.username = profile.username;
    } else if (profile?.email) {
      payload.username = profile.email;
    } else if (profile?.account) {
      payload.username = profile.account;
    }
    return payload;
  }

  if (auth.email) {
    payload.email = auth.email;
  }
  if (auth.phone) {
    payload.phone = auth.phone;
  }
  if (auth.username) {
    payload.username = auth.username;
  }
  if (auth.password) {
    payload.password = auth.password;
  }

  return payload;
}

export function resolveBootstrapAuthFromEnv(
  env: Record<string, string | undefined> = process.env,
): IamApplicationBootstrapAuth {
  const authToken =
    env.SDKWORK_IAM_BOOTSTRAP_OPERATOR_AUTH_TOKEN
    ?? env.SDKWORK_IAM_BOOTSTRAP_AUTH_TOKEN
    ?? env.SDKWORK_IAM_SUPER_ADMIN_AUTH_TOKEN;
  const username =
    env.SDKWORK_IAM_BOOTSTRAP_OPERATOR_USERNAME
    ?? env.SDKWORK_IAM_BOOTSTRAP_USERNAME
    ?? env.SDKWORK_IAM_SUPER_ADMIN_USERNAME;
  const password =
    env.SDKWORK_IAM_BOOTSTRAP_OPERATOR_PASSWORD
    ?? env.SDKWORK_IAM_BOOTSTRAP_PASSWORD
    ?? env.SDKWORK_IAM_SUPER_ADMIN_PASSWORD;
  return {
    ...(authToken !== undefined ? { authToken } : {}),
    ...(username !== undefined ? { username } : {}),
    ...(password !== undefined ? { password } : {}),
  };
}

/**
 * Merge launch-environment bootstrap auth with an optional on-disk profile.
 * Explicit environment values win over the profile file.
 */
export function resolveBootstrapAuth(
  options: {
    env?: Record<string, string | undefined>;
    profile?: IamApplicationBootstrapProfile | null;
  } = {},
): IamApplicationBootstrapAuth {
  const env = options.env ?? process.env;
  const fromEnv = resolveBootstrapAuthFromEnv(env);
  const profile = options.profile;
  if (fromEnv.authToken) return fromEnv;
  const username = fromEnv.username ?? profile?.username ?? profile?.account ?? profile?.email;
  const password = fromEnv.password ?? profile?.password;
  const email = fromEnv.email ?? profile?.email;
  return {
    ...(fromEnv.authToken !== undefined ? { authToken: fromEnv.authToken } : {}),
    ...(username !== undefined ? { username } : {}),
    ...(password !== undefined ? { password } : {}),
    ...(email !== undefined ? { email } : {}),
    ...(fromEnv.phone !== undefined ? { phone: fromEnv.phone } : {}),
  };
}

export function resolveBootstrapEnvironmentFromEnv(
  env: Record<string, string | undefined> = process.env,
  overrides: Partial<import("./types.ts").IamApplicationBootstrapEnvironment> = {},
): import("./types.ts").IamApplicationBootstrapEnvironment {
  const primaryDomain = overrides.primaryDomain ?? env.SDKWORK_APP_DOMAIN;
  return {
    backendApiBaseUrl: overrides.backendApiBaseUrl ?? env.SDKWORK_BACKEND_BASE_URL ?? "http://127.0.0.1:8080",
    ...(overrides.deploymentMode !== undefined ? { deploymentMode: overrides.deploymentMode } : {}),
    environment: overrides.environment ?? env.SDKWORK_ENV ?? "dev",
    instanceKey: overrides.instanceKey ?? env.SDKWORK_APP_INSTANCE_KEY ?? "dev",
    organizationId: overrides.organizationId ?? env.SDKWORK_ORGANIZATION_ID ?? DEFAULT_IAM_ORGANIZATION_ID,
    ...(primaryDomain !== undefined ? { primaryDomain } : {}),
    tenantId: overrides.tenantId ?? env.SDKWORK_TENANT_ID ?? DEFAULT_IAM_TENANT_ID,
  };
}
