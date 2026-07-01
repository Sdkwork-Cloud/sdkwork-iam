import type {
  SdkworkSessionAuthEnvReader,
  SdkworkSessionAuthUnauthorizedMode,
} from "./sessionAuthUnauthorized.ts";

export const SDKWORK_SESSION_AUTH_UNAUTHORIZED_MODE_ENV_KEY =
  "VITE_SDKWORK_SESSION_AUTH_UNAUTHORIZED_MODE";

export const SDKWORK_RUNTIME_ENV_GLOBAL_KEY = "__SDKWORK_RUNTIME_ENV__";

type RuntimeEnvWindow = Window & {
  __SDKWORK_RUNTIME_ENV__?: Record<string, unknown>;
};

function readRuntimeEnvBag(
  bag: Record<string, unknown> | undefined,
  name: string,
): string | undefined {
  const value = bag?.[name];
  if (typeof value !== "string") {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed || undefined;
}

function readViteImportMetaEnv(name: string): string | undefined {
  try {
    const meta = import.meta as ImportMeta & { env?: Record<string, unknown> };
    const value = meta.env?.[name];
    if (typeof value !== "string") {
      return undefined;
    }
    const trimmed = value.trim();
    return trimmed || undefined;
  } catch {
    return undefined;
  }
}

export function readSdkworkRuntimeEnvFromWindow(name: string): string | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }

  const runtimeWindow = window as RuntimeEnvWindow;
  return readRuntimeEnvBag(runtimeWindow.__SDKWORK_RUNTIME_ENV__, name);
}

export function createSdkworkSessionAuthEnvReader(
  readEnv?: SdkworkSessionAuthEnvReader,
): SdkworkSessionAuthEnvReader {
  if (readEnv) {
    return readEnv;
  }

  return (name: string) =>
    readSdkworkRuntimeEnvFromWindow(name)
    ?? readViteImportMetaEnv(name);
}

function isLocalDevelopmentHost(hostname: string | undefined): boolean {
  const normalized = hostname?.trim().toLowerCase() ?? "";
  return normalized === "localhost" || normalized === "127.0.0.1";
}

export function resolveSdkworkSessionAuthUnauthorizedMode({
  hostname,
  readEnv = createSdkworkSessionAuthEnvReader(),
}: {
  hostname?: string;
  readEnv?: SdkworkSessionAuthEnvReader;
} = {}): SdkworkSessionAuthUnauthorizedMode {
  const configured = readEnv(SDKWORK_SESSION_AUTH_UNAUTHORIZED_MODE_ENV_KEY)
    ?.trim()
    .toLowerCase();
  if (
    configured === "redirect"
    || configured === "modal"
    || configured === "debug"
  ) {
    return configured;
  }

  if (isLocalDevelopmentHost(hostname)) {
    return "modal";
  }

  return "redirect";
}
