import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

/** Registration output next to `sdkwork.app.config.json`. */
export const REGISTERED_BOOTSTRAP_ENV_FILE = ".sdkwork.local.env";

export function normalizeBootstrapLifecycle(value: string | undefined): string {
  const normalized = value?.trim().toLowerCase() ?? "development";
  if (normalized === "dev" || normalized === "local") return "development";
  if (normalized === "prod") return "production";
  if (normalized === "development" || normalized === "test" || normalized === "staging" || normalized === "production") {
    return normalized;
  }
  return "development";
}

/**
 * Overlay files start/build loaders probe for `SDKWORK_ACCESS_TOKEN`.
 * Keep aligned with `@sdkwork/iam-credential-entry` `resolveRepoBootstrapAccessTokenEnvPaths`.
 */
export function resolveRegisteredBootstrapEnvPaths(repoRoot: string, environment?: string): string[] {
  const lifecycle = normalizeBootstrapLifecycle(environment);
  return [
    join(repoRoot, REGISTERED_BOOTSTRAP_ENV_FILE),
    join(repoRoot, `.env.standalone.${lifecycle}.bootstrap.local`),
    join(repoRoot, `.env.${lifecycle}.bootstrap.local`),
  ];
}

export function parseAccessTokenFromEnvFile(contents: string): string | undefined {
  for (const line of contents.split(/\r?\n/u)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separator = trimmed.indexOf("=");
    if (separator <= 0) continue;
    if (trimmed.slice(0, separator).trim() !== "SDKWORK_ACCESS_TOKEN") continue;
    const raw = trimmed.slice(separator + 1).trim();
    const unquoted = (
      (raw.startsWith("\"") && raw.endsWith("\""))
      || (raw.startsWith("'") && raw.endsWith("'"))
    )
      ? raw.slice(1, -1)
      : raw;
    const token = unquoted.trim();
    if (token) return token;
  }
  return undefined;
}

export async function readRegisteredBootstrapAccessToken(
  repoRoot: string,
  environment?: string,
): Promise<string | undefined> {
  for (const envPath of resolveRegisteredBootstrapEnvPaths(repoRoot, environment)) {
    try {
      const token = parseAccessTokenFromEnvFile(await readFile(envPath, "utf8"));
      if (token) return token;
    } catch {
      continue;
    }
  }
  return undefined;
}

export async function writeRegisteredBootstrapEnvFiles(
  repoRoot: string,
  contents: string,
  environment?: string,
): Promise<string[]> {
  const written: string[] = [];
  for (const envPath of resolveRegisteredBootstrapEnvPaths(repoRoot, environment)) {
    await mkdir(dirname(envPath), { recursive: true });
    await writeFile(envPath, contents.endsWith("\n") ? contents : `${contents}\n`, "utf8");
    written.push(envPath);
  }
  return written;
}

export function looksLikeLocalFixtureJwt(token: string): boolean {
  const [headerPart, , signaturePart, ...rest] = token.split(".");
  if (headerPart === undefined || signaturePart === undefined || rest.length > 0) return false;
  if (signaturePart !== "signature") return false;
  try {
    const header = JSON.parse(Buffer.from(headerPart, "base64url").toString("utf8")) as { alg?: unknown };
    return header.alg === "none";
  } catch {
    return false;
  }
}

export function isLoopbackBackendUrl(url: string | undefined): boolean {
  const trimmed = url?.trim();
  if (!trimmed) return false;
  try {
    const hostname = new URL(trimmed).hostname.toLowerCase();
    return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
  } catch {
    return false;
  }
}

export function isUsableBootstrapAccessToken(token: string, backendBaseUrl: string | undefined): boolean {
  if (!token.trim()) return false;
  if (!looksLikeLocalFixtureJwt(token)) return true;
  return isLoopbackBackendUrl(backendBaseUrl);
}
