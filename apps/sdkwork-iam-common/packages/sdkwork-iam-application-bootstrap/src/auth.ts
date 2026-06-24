import type { IamApplicationBootstrapAuth, IamApplicationBootstrapProfile } from "./types.ts";
import {
  DEFAULT_IAM_ORGANIZATION_ID,
  DEFAULT_IAM_TENANT_ID,
} from "./constants.ts";

export async function loadBootstrapProfileFromHome(
  options: {
    profileName?: string;
    readFile?: (path: string, encoding: "utf8") => Promise<string>;
    usersDir?: string;
  } = {},
): Promise<IamApplicationBootstrapProfile | null> {
  const { homedir } = await import("node:os");
  const { join } = await import("node:path");
  const readFile = options.readFile ?? (await import("node:fs/promises")).readFile;
  const usersDir = options.usersDir ?? process.env.SDKWORK_USERS_DIR ?? join(homedir(), ".sdkwork", "users");
  const profileName = options.profileName ?? process.env.SDKWORK_SUPER_ADMIN_PROFILE ?? "super-admin";
  const profilePath = join(usersDir, `${profileName}.json`);

  try {
    const raw = await readFile(profilePath, "utf8");
    return JSON.parse(raw) as IamApplicationBootstrapProfile;
  } catch {
    return null;
  }
}

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
  return {
    username: env.SDKWORK_IAM_BOOTSTRAP_USERNAME ?? env.SDKWORK_IAM_SUPER_ADMIN_USERNAME,
    password: env.SDKWORK_IAM_SUPER_ADMIN_PASSWORD ?? env.SDKWORK_IAM_BOOTSTRAP_PASSWORD,
  };
}

export function resolveBootstrapEnvironmentFromEnv(
  env: Record<string, string | undefined> = process.env,
  overrides: Partial<import("./types.ts").IamApplicationBootstrapEnvironment> = {},
): import("./types.ts").IamApplicationBootstrapEnvironment {
  return {
    backendApiBaseUrl: overrides.backendApiBaseUrl ?? env.SDKWORK_BACKEND_BASE_URL ?? "http://127.0.0.1:8080",
    deploymentMode: overrides.deploymentMode,
    environment: overrides.environment ?? env.SDKWORK_ENV ?? "dev",
    instanceKey: overrides.instanceKey ?? env.SDKWORK_APP_INSTANCE_KEY ?? "dev",
    organizationId: overrides.organizationId ?? env.SDKWORK_ORGANIZATION_ID ?? DEFAULT_IAM_ORGANIZATION_ID,
    primaryDomain: overrides.primaryDomain ?? env.SDKWORK_APP_DOMAIN,
    tenantId: overrides.tenantId ?? env.SDKWORK_TENANT_ID ?? DEFAULT_IAM_TENANT_ID,
  };
}
