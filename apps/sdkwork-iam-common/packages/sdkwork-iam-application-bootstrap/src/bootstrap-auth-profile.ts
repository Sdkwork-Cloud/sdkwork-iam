import { firstNonEmpty, joinSdkworkPath, resolveSdkworkHomeDir } from "./home-dir.ts";
import type { IamApplicationBootstrapProfile } from "./types.ts";

/** Canonical IAM application-bootstrap auth profile directory under `~/.sdkwork/`. */
export const SDKWORK_IAM_BOOTSTRAP_PROFILE_DIR_NAME = "iam-bootstrap";

/** Default profile file stem when no environment-specific file exists. */
export const SDKWORK_IAM_BOOTSTRAP_DEFAULT_PROFILE = "default";

/** Legacy profile directory (`~/.sdkwork/users/`). */
export const SDKWORK_IAM_BOOTSTRAP_LEGACY_USERS_DIR_NAME = "users";

/** Environment variable selecting the bootstrap auth profile directory. */
export const SDKWORK_IAM_BOOTSTRAP_PROFILE_DIR_ENV = "SDKWORK_IAM_BOOTSTRAP_PROFILE_DIR";

/** Environment variable selecting a profile file stem (without `.json`). */
export const SDKWORK_IAM_BOOTSTRAP_OPERATOR_PROFILE_ENV = "SDKWORK_IAM_BOOTSTRAP_OPERATOR_PROFILE";

/** Options for {@link resolveBootstrapAuthProfileCandidates}. */
export interface ResolveBootstrapAuthProfileOptions {
  /** Explicit profile file stem override (without `.json`). */
  profileName?: string;
  /** Launch environment used to derive profile candidates. */
  env?: Readonly<Record<string, string | undefined>>;
  /** Canonical lifecycle environment (`development`, `test`, …). */
  lifecycleEnvironment?: string;
  /** Deployment profile (`standalone` or `cloud`). */
  deploymentProfile?: string;
  /** Exact profile id (`standalone.development`). */
  profileId?: string;
}

/** Options for {@link loadBootstrapAuthProfileFromHome}. */
export interface LoadBootstrapAuthProfileOptions extends ResolveBootstrapAuthProfileOptions {
  readFile?: (path: string, encoding: "utf8") => Promise<string>;
  /** Override for `~/.sdkwork/iam-bootstrap`. */
  bootstrapProfileDir?: string;
  /** Override for legacy `~/.sdkwork/users`. */
  legacyUsersDir?: string;
  /** Platform used to resolve the home directory; defaults to `process.platform`. */
  platform?: NodeJS.Platform | string;
}

/** A bootstrap auth profile loaded from disk. */
export interface LoadedBootstrapAuthProfile {
  profile: IamApplicationBootstrapProfile;
  profileName: string;
  profilePath: string;
}

/** @deprecated Use {@link LoadedBootstrapAuthProfile}. */
export type LoadedBootstrapOperatorProfile = LoadedBootstrapAuthProfile;

/** @deprecated Use {@link LoadedBootstrapAuthProfile}. */
export type LoadedSuperAdminProfile = LoadedBootstrapAuthProfile;

/** @deprecated Use {@link ResolveBootstrapAuthProfileOptions}. */
export type ResolveBootstrapOperatorProfileOptions = ResolveBootstrapAuthProfileOptions;

/** @deprecated Use {@link ResolveBootstrapAuthProfileOptions}. */
export type ResolveSuperAdminProfileOptions = ResolveBootstrapAuthProfileOptions;

/** @deprecated Use {@link LoadBootstrapAuthProfileOptions}. */
export type LoadBootstrapOperatorProfileOptions = LoadBootstrapAuthProfileOptions;

/** @deprecated Use {@link LoadBootstrapAuthProfileOptions}. */
export type LoadSuperAdminProfileOptions = LoadBootstrapAuthProfileOptions;

/**
 * Ordered bootstrap auth profile file stems for the active SDKWork environment.
 * Any IAM principal with register/provision/enable/access-credential permissions
 * may be stored here — development often uses the platform super-admin account,
 * but the profile name does not assume that role.
 */
export function resolveBootstrapAuthProfileCandidates(
  options: ResolveBootstrapAuthProfileOptions = {},
): string[] {
  const env = options.env ?? process.env;
  const candidates: string[] = [];

  const explicit = firstNonEmpty(
    options.profileName,
    env[SDKWORK_IAM_BOOTSTRAP_OPERATOR_PROFILE_ENV],
    env.SDKWORK_SUPER_ADMIN_PROFILE,
  );
  if (explicit !== undefined) candidates.push(explicit);

  const profileId = firstNonEmpty(
    options.profileId,
    env.SDKWORK_PROFILE_ID,
    env.SDKWORK_BIRDCODER_PROFILE_ID,
  );

  const deploymentProfile = normalizeDeploymentProfile(
    firstNonEmpty(options.deploymentProfile, env.SDKWORK_DEPLOYMENT_PROFILE, env.SDKWORK_BIRDCODER_DEPLOYMENT_PROFILE),
  ) ?? "standalone";
  const lifecycle = normalizeLifecycleEnvironment(
    firstNonEmpty(
      options.lifecycleEnvironment,
      env.SDKWORK_ENVIRONMENT,
      env.SDKWORK_BIRDCODER_ENVIRONMENT,
      env.SDKWORK_ENV,
      env.SDKWORK_IM_ENVIRONMENT,
      profileId?.includes(".") ? profileId.split(".")[1] : undefined,
    ),
  );

  if (lifecycle !== undefined) {
    candidates.push(lifecycle);
  }
  if (profileId !== undefined) {
    candidates.push(profileId);
  }
  if (lifecycle !== undefined) {
    candidates.push(`${deploymentProfile}.${lifecycle}`);
  }

  candidates.push(SDKWORK_IAM_BOOTSTRAP_DEFAULT_PROFILE, "super-admin");

  return dedupeNonEmpty(candidates);
}

/**
 * Absolute profile file paths to probe, preferring `~/.sdkwork/iam-bootstrap/`
 * and falling back to legacy `~/.sdkwork/users/`.
 */
export function resolveBootstrapAuthProfilePaths(
  options: LoadBootstrapAuthProfileOptions = {},
): string[] {
  const env = options.env ?? process.env;
  const stems = resolveBootstrapAuthProfileCandidates(options);
  const bootstrapDir = options.bootstrapProfileDir ?? resolveBootstrapAuthProfileDir(env, options.platform);
  const legacyUsersDir = options.legacyUsersDir ?? resolveLegacyBootstrapUsersDir(env, options.platform);
  const platform = options.platform ?? process.platform;
  const paths: string[] = [];
  for (const stem of stems) {
    paths.push(joinSdkworkPath(platform, bootstrapDir, `${stem}.json`));
  }
  for (const stem of stems) {
    paths.push(joinSdkworkPath(platform, legacyUsersDir, `${stem}.json`));
  }
  return dedupeNonEmpty(paths);
}

/**
 * Load the first bootstrap auth profile for the active SDKWork environment.
 */
export async function loadBootstrapAuthProfileFromHome(
  options: LoadBootstrapAuthProfileOptions = {},
): Promise<LoadedBootstrapAuthProfile | null> {
  const readFile = options.readFile ?? (await import("node:fs/promises")).readFile;
  for (const profilePath of resolveBootstrapAuthProfilePaths(options)) {
    try {
      const raw = await readFile(profilePath, "utf8");
      const profile = JSON.parse(raw) as IamApplicationBootstrapProfile;
      const username = profile.username?.trim() || profile.email?.trim() || profile.account?.trim();
      const password = profile.password?.trim();
      if (!username || !password) continue;
      const profileName = profilePath.replace(/\\/gu, "/").split("/").pop()?.replace(/\.json$/u, "") ?? "default";
      return { profile, profileName, profilePath };
    } catch {
      continue;
    }
  }
  return null;
}

/** @deprecated Use {@link loadBootstrapAuthProfileFromHome}. */
export const loadBootstrapOperatorProfileFromHome = loadBootstrapAuthProfileFromHome;

/** @deprecated Use {@link loadBootstrapAuthProfileFromHome}. */
export const loadSuperAdminProfileFromHome = loadBootstrapAuthProfileFromHome;

/** @deprecated Use {@link loadBootstrapAuthProfileFromHome}. */
export async function loadBootstrapProfileFromHome(
  options: LoadBootstrapAuthProfileOptions = {},
): Promise<IamApplicationBootstrapProfile | null> {
  const loaded = await loadBootstrapAuthProfileFromHome(options);
  return loaded?.profile ?? null;
}

/** @deprecated Use {@link resolveBootstrapAuthProfileCandidates}. */
export const resolveBootstrapOperatorProfileCandidates = resolveBootstrapAuthProfileCandidates;

/** @deprecated Use {@link resolveBootstrapAuthProfileCandidates}. */
export const resolveSuperAdminProfileCandidates = resolveBootstrapAuthProfileCandidates;

/** @deprecated Use {@link resolveBootstrapAuthProfilePaths}. */
export const resolveSuperAdminProfilePaths = resolveBootstrapAuthProfilePaths;

/** Resolve `~/.sdkwork/iam-bootstrap` (or `SDKWORK_IAM_BOOTSTRAP_PROFILE_DIR`). */
export function resolveBootstrapAuthProfileDir(
  env: Readonly<Record<string, string | undefined>> = process.env,
  platform: NodeJS.Platform | string = process.platform,
): string {
  const configured = firstNonEmpty(
    env[SDKWORK_IAM_BOOTSTRAP_PROFILE_DIR_ENV],
    env.SDKWORK_SUPER_ADMIN_DIR,
  );
  if (configured) return configured;
  return joinSdkworkPath(platform, resolveSdkworkHomeDir(env, platform), ".sdkwork", SDKWORK_IAM_BOOTSTRAP_PROFILE_DIR_NAME);
}

/** @deprecated Use {@link resolveBootstrapAuthProfileDir}. */
export const resolveSuperAdminProfileDir = resolveBootstrapAuthProfileDir;

/** Resolve legacy `~/.sdkwork/users` (or `SDKWORK_USERS_DIR`). */
export function resolveLegacyBootstrapUsersDir(
  env: Readonly<Record<string, string | undefined>> = process.env,
  platform: NodeJS.Platform | string = process.platform,
): string {
  const configured = env.SDKWORK_USERS_DIR?.trim();
  if (configured) return configured;
  return joinSdkworkPath(platform, resolveSdkworkHomeDir(env, platform), ".sdkwork", SDKWORK_IAM_BOOTSTRAP_LEGACY_USERS_DIR_NAME);
}

/** @deprecated Use {@link resolveLegacyBootstrapUsersDir}. */
export const resolveLegacySuperAdminUsersDir = resolveLegacyBootstrapUsersDir;

function dedupeNonEmpty(values: string[]): string[] {
  const seen = new Set<string>();
  const ordered: string[] = [];
  for (const value of values) {
    const trimmed = value.trim();
    if (trimmed === "" || seen.has(trimmed)) continue;
    seen.add(trimmed);
    ordered.push(trimmed);
  }
  return ordered;
}

function normalizeDeploymentProfile(value: string | undefined): "standalone" | "cloud" | undefined {
  if (value === "standalone" || value === "cloud") return value;
  return undefined;
}

function normalizeLifecycleEnvironment(value: string | undefined): string | undefined {
  if (value === undefined) return undefined;
  const normalized = value.trim().toLowerCase();
  if (normalized === "dev" || normalized === "local") return "development";
  if (normalized === "prod") return "production";
  if (normalized === "development" || normalized === "test" || normalized === "staging" || normalized === "production") {
    return normalized;
  }
  return undefined;
}
