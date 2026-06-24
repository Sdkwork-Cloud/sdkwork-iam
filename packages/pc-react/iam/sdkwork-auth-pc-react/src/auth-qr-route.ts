export const SDKWORK_AUTH_QR_ENTRY_SEGMENT = "/qr/";

export type SdkworkAuthQrRouteId = "forgot-password" | "login" | "register";
export type SdkworkAuthQrEntryCallbackEvent = "bindRequired" | "passwordRequired";

export function resolveSdkworkAuthRoutePath(
  basePath: string,
  routeId: SdkworkAuthQrRouteId,
): string {
  const normalizedBasePath = basePath.trim().replace(/\/+$/u, "") || "/auth";
  return routeId === "login"
    ? `${normalizedBasePath}/login`
    : `${normalizedBasePath}/${routeId}`;
}

export function resolveSdkworkAuthQrEntryKey(
  pathname: string,
  basePath: string,
): string | null {
  const normalizedBasePath = basePath.trim().replace(/\/+$/u, "") || "/auth";
  const qrEntryPrefix = `${normalizedBasePath}${SDKWORK_AUTH_QR_ENTRY_SEGMENT}`;

  if (!pathname.startsWith(qrEntryPrefix)) {
    return null;
  }

  const [rawSessionKey] = pathname.slice(qrEntryPrefix.length).split(/[/?#]/u, 1);
  const normalizedSessionKey = rawSessionKey?.trim();

  return normalizedSessionKey ? safeDecodeQrRouteSegment(normalizedSessionKey) : null;
}

function safeDecodeQrRouteSegment(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export function buildSdkworkAuthRouteWithContext(
  pathname: string,
  options: {
    homePath: string;
    qrEntryKey?: string | null;
    redirectTarget: string;
  },
  extraQuery: Record<string, string | null | undefined> = {},
): string {
  const query = new URLSearchParams();
  const normalizedQrEntryKey = options.qrEntryKey?.trim();

  if (options.redirectTarget !== options.homePath) {
    query.set("redirect", options.redirectTarget);
  }

  if (normalizedQrEntryKey) {
    query.set("session_key", normalizedQrEntryKey);
  }

  for (const [key, value] of Object.entries(extraQuery)) {
    if (key === "source" || key === "src") {
      continue;
    }
    const normalizedValue = value?.trim();
    if (normalizedValue) {
      query.set(key, normalizedValue);
    }
  }

  const querySuffix = query.toString();
  return querySuffix ? `${pathname}?${querySuffix}` : pathname;
}

export function resolveSdkworkAuthQrEntryKeyFromRoute(
  paramsSessionKey: string | null | undefined,
  searchSessionKey: string | null | undefined,
  pathname: string,
  basePath: string,
): string {
  return (
    paramsSessionKey
    || searchSessionKey
    || resolveSdkworkAuthQrEntryKey(pathname, basePath)
    || ""
  ).trim();
}

export function resolveSdkworkAuthQrEntryCallbackEvent(
  mode: string,
): SdkworkAuthQrEntryCallbackEvent {
  return mode === "register" ? "bindRequired" : "passwordRequired";
}
