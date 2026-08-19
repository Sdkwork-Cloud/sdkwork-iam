import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { resolveBootstrapAuth, resolveBootstrapEnvironmentFromEnv } from "./auth.ts";
import { bootstrapApplicationFromManifest, formatBootstrapEnvFile } from "./bootstrap.ts";
import { loadBootstrapAuthProfileFromHome } from "./bootstrap-auth-profile.ts";
import { createFetchIamApplicationBootstrapClient } from "./fetch-client.ts";
import { hashManifestContent } from "./manifest.ts";
import type { IamApplicationBootstrapClient, SdkworkAppManifest } from "./types.ts";
import {
  isUsableBootstrapAccessToken,
  readRegisteredBootstrapAccessToken,
  writeRegisteredBootstrapEnvFiles,
} from "./registered-env.ts";

export type EnsureRepoBootstrapAccessTokenStatus = "configured" | "registered" | "unavailable";

export interface EnsureRepoBootstrapAccessTokenOptions {
  repoRoot: string;
  env?: Readonly<Record<string, string | undefined>>;
  environment?: string;
  tryApplicationBootstrap?: boolean;
  warn?: (line: string) => void;
  /** Override the CLI fetch transport (tests inject a stub client). */
  createClient?: (config: { baseUrl: string }) => IamApplicationBootstrapClient;
}

export interface EnsureRepoBootstrapAccessTokenResult {
  status: EnsureRepoBootstrapAccessTokenStatus;
  token?: string;
  overlayPaths?: string[];
  reason?: string;
}

function hasBootstrapAuthCredentials(auth: {
  authToken?: string;
  username?: string;
  password?: string;
  email?: string;
}): boolean {
  if (auth.authToken?.trim()) return true;
  const username = auth.username ?? auth.email;
  return Boolean(username?.trim() && auth.password?.trim());
}

/**
 * Resolve a private `SDKWORK_ACCESS_TOKEN` for start/build.
 * Prefers registered overlays, then IAM application bootstrap when operator
 * credentials exist. Fixture JWTs are kept only for loopback backends.
 */
export async function ensureRepoBootstrapAccessToken(
  options: EnsureRepoBootstrapAccessTokenOptions,
): Promise<EnsureRepoBootstrapAccessTokenResult> {
  const env = { ...(options.env ?? process.env) };
  const backendBaseUrl = env.SDKWORK_BACKEND_BASE_URL?.trim();
  const existing = env.SDKWORK_ACCESS_TOKEN?.trim()
    || await readRegisteredBootstrapAccessToken(options.repoRoot, options.environment);

  if (existing && isUsableBootstrapAccessToken(existing, backendBaseUrl)) {
    return { status: "configured", token: existing };
  }

  if (options.tryApplicationBootstrap === false) {
    return {
      status: "unavailable",
      reason: existing
        ? "overlay bootstrap token is a local fixture and the backend is not loopback"
        : "no registered SDKWORK_ACCESS_TOKEN overlay",
    };
  }

  const lifecycle = options.environment ?? env.SDKWORK_ENVIRONMENT ?? env.SDKWORK_ENV;
  const loadedProfile = await loadBootstrapAuthProfileFromHome({
    env,
    ...(lifecycle !== undefined ? { lifecycleEnvironment: lifecycle } : {}),
  });
  const auth = resolveBootstrapAuth({
    env,
    profile: loadedProfile?.profile ?? null,
  });
  if (!hasBootstrapAuthCredentials(auth)) {
    return {
      status: "unavailable",
      reason: "no IAM bootstrap auth credentials in env or ~/.sdkwork/iam-bootstrap",
    };
  }
  if (!backendBaseUrl) {
    return {
      status: "unavailable",
      reason: "SDKWORK_BACKEND_BASE_URL is required to provision a registered access token",
    };
  }

  const manifestPath = join(options.repoRoot, "sdkwork.app.config.json");
  let raw: string;
  try {
    raw = await readFile(manifestPath, "utf8");
  } catch {
    return { status: "unavailable", reason: `missing ${manifestPath}` };
  }

  let manifest: unknown;
  try {
    manifest = JSON.parse(raw);
  } catch (error) {
    return { status: "unavailable", reason: `${manifestPath} is not valid JSON: ${String(error)}` };
  }

  const manifestRecord = manifest as SdkworkAppManifest;
  const primaryDomain = resolveEnsurePrimaryDomain(env, manifestRecord, backendBaseUrl);
  const environment = resolveBootstrapEnvironmentFromEnv(env, {
    backendApiBaseUrl: backendBaseUrl,
    ...(lifecycle !== undefined ? { environment: lifecycle } : {}),
    ...(manifestRecord.backend?.tenantId !== undefined
      ? { tenantId: manifestRecord.backend.tenantId }
      : {}),
    ...(manifestRecord.backend?.organizationId !== undefined
      ? { organizationId: manifestRecord.backend.organizationId }
      : {}),
    ...(primaryDomain !== undefined ? { primaryDomain } : {}),
  });

  try {
    const createClient = options.createClient ?? createFetchIamApplicationBootstrapClient;
    const client = createClient({
      baseUrl: backendBaseUrl,
    });
    const result = await bootstrapApplicationFromManifest({
      client,
      manifest: manifest as never,
      manifestHash: hashManifestContent(raw),
      auth,
      profile: loadedProfile?.profile ?? null,
      environment,
    });
    const contents = `# SDKWork IAM application-bootstrap registration output (gitignored).\n${formatBootstrapEnvFile({
      result,
      ...(environment.primaryDomain !== undefined
        ? { primaryDomain: environment.primaryDomain }
        : {}),
    })}`;
    const overlayPaths = await writeRegisteredBootstrapEnvFiles(
      options.repoRoot,
      contents,
      lifecycle,
    );
    const token = result.env.SDKWORK_ACCESS_TOKEN?.trim();
    if (!token) {
      return { status: "unavailable", reason: "IAM application bootstrap did not return SDKWORK_ACCESS_TOKEN" };
    }
    options.warn?.(`provisioned SDKWORK_ACCESS_TOKEN via IAM application bootstrap (${overlayPaths[0]})`);
    return { status: "registered", token, overlayPaths };
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    options.warn?.(`IAM application bootstrap failed: ${reason}`);
    return { status: "unavailable", reason };
  }
}

function resolveEnsurePrimaryDomain(
  env: Readonly<Record<string, string | undefined>>,
  manifest: SdkworkAppManifest,
  backendBaseUrl: string,
): string | undefined {
  const configured = env.SDKWORK_APP_DOMAIN?.trim();
  if (configured) return configured;
  const fromManifest = manifest.backend?.primaryDomain?.trim() || manifest.backend?.domain?.trim();
  if (fromManifest) return fromManifest;
  try {
    return new URL(backendBaseUrl).hostname;
  } catch {
    return undefined;
  }
}
