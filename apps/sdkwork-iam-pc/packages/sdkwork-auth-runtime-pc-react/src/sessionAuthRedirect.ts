/**
 * Canonical session-auth `redirect` parameter utilities.
 *
 * Every login `redirect` value in the workspace is built and consumed through
 * these helpers so no consumer can accidentally re-wrap an auth-route URL
 * (which nests the `redirect` param one level deeper on every unauthorized
 * response, growing the URL without bound) or navigate to an encoded auth
 * route target.
 */

const DEFAULT_AUTH_BASE_PATH = "/auth";
const MAX_REDIRECT_DECODE_ROUNDS = 8;

/** Normalizes an auth base path (for example "/auth/") to its canonical form ("/auth"). */
export function normalizeSdkworkAuthBasePath(authBasePath: string): string {
  const normalized = authBasePath.trim().replace(/\/+$/u, "");
  return normalized || DEFAULT_AUTH_BASE_PATH;
}

/** Derives the auth base path from a login path (for example "/auth/login" -> "/auth"). */
export function normalizeSdkworkAuthLoginBasePath(authLoginPath: string): string {
  return normalizeSdkworkAuthBasePath(
    authLoginPath.replace(/\/login\/?$/u, "") || DEFAULT_AUTH_BASE_PATH,
  );
}

/** Strips the query and hash from a path string. */
export function normalizeSdkworkRedirectPath(path: string): string {
  return path.split(/[?#]/, 1)[0] ?? path;
}

/** Whether the pathname sits on the auth surface (the base path itself or anything under it). */
export function isSdkworkAuthRoutePath(
  pathname: string,
  authBasePath: string,
): boolean {
  const normalizedBasePath = normalizeSdkworkAuthBasePath(authBasePath);
  return (
    pathname === normalizedBasePath
    || pathname.startsWith(`${normalizedBasePath}/`)
  );
}

/**
 * Decodes a redirect target until no percent-escapes remain (bounded so a
 * pathological value cannot loop forever). Used for safety checks only:
 * deeply nested `redirect=/auth/login?redirect=...` values must be rejected
 * as auth routes no matter how many times they were encoded.
 */
export function decodeSdkworkAuthRedirectTargetBounded(value: string): string {
  let decoded = value;
  for (let i = 0; i < MAX_REDIRECT_DECODE_ROUNDS; i += 1) {
    let next = decoded;
    try {
      next = decodeURIComponent(decoded);
    } catch {
      break;
    }
    if (next === decoded) {
      break;
    }
    decoded = next;
  }
  return decoded;
}

function isSafeInAppRedirectTarget(target: string): boolean {
  if (!target.startsWith("/")) {
    return false;
  }
  if (target.startsWith("//") || target.startsWith("/\\")) {
    return false;
  }
  if (target.includes("://") || target.includes("\\")) {
    return false;
  }
  return true;
}

/**
 * Canonical consume-side sanitizer. The browser already decodes the query
 * value once, so a nested value like `redirect=/auth/login?redirect=...` may
 * still be percent-encoded after that — the fully decoded pathname is checked
 * too and auth routes are rejected no matter the encoding depth. Returns the
 * pathname-only form (query/hash stripped), matching the historic
 * `resolveAuthRedirectTarget` contract.
 */
export function sanitizeSdkworkAuthRedirectTarget(
  rawTarget: string | null | undefined,
  fallbackRoute = "/",
  authBasePath = DEFAULT_AUTH_BASE_PATH,
): string {
  const normalizedTarget = rawTarget?.trim();
  if (!normalizedTarget || !isSafeInAppRedirectTarget(normalizedTarget)) {
    return fallbackRoute;
  }

  const redirectPath = normalizeSdkworkRedirectPath(normalizedTarget);
  const decodedRedirectPath = normalizeSdkworkRedirectPath(
    decodeSdkworkAuthRedirectTargetBounded(normalizedTarget),
  );
  const normalizedAuthBasePath = normalizeSdkworkAuthBasePath(authBasePath);
  const blockedExactRoutes = new Set([
    normalizedAuthBasePath,
    `${normalizedAuthBasePath}/login`,
    `${normalizedAuthBasePath}/register`,
    `${normalizedAuthBasePath}/forgot-password`,
    `${normalizedAuthBasePath}/qr-login`,
    "/login",
    "/register",
    "/forgot-password",
    "/qr-login",
  ]);

  if (
    blockedExactRoutes.has(redirectPath)
    || blockedExactRoutes.has(decodedRedirectPath)
    || decodedRedirectPath === normalizedAuthBasePath
    || decodedRedirectPath.startsWith(`${normalizedAuthBasePath}/`)
    || redirectPath.startsWith(`${normalizedAuthBasePath}/oauth/callback`)
    || redirectPath.startsWith(`${normalizedAuthBasePath}/qr/`)
    || redirectPath.startsWith("/auth/oauth/callback")
    || redirectPath.startsWith("/auth/qr/")
    || redirectPath.startsWith("/login/oauth/callback")
    || redirectPath.startsWith("/login/qr/")
  ) {
    return fallbackRoute;
  }

  return redirectPath;
}

/**
 * Canonical build-side helper for a return path string. When the return path
 * is already an auth route (for example the login page itself carries a
 * `redirect` param), re-wrapping it would nest the `redirect` param one level
 * deeper on every unauthorized response — return the plain login path instead
 * so no nesting is ever created.
 */
export function buildSdkworkLoginRedirectPath(
  authLoginPath: string,
  returnPath: string,
): string {
  if (isSdkworkAuthRoutePath(returnPath, normalizeSdkworkAuthLoginBasePath(authLoginPath))) {
    return authLoginPath;
  }
  return `${authLoginPath}?redirect=${encodeURIComponent(returnPath)}`;
}

export interface SdkworkAuthLocationLike {
  hash?: string;
  pathname: string;
  search?: string;
}

/**
 * Canonical build-side helper for a browser location. On the auth surface the
 * existing `redirect` param (if any) is reused verbatim so the original
 * return target survives and no nesting is ever created; otherwise the full
 * return path (pathname + search + hash) is wrapped once.
 */
export function buildSdkworkLoginRedirectFromLocation(
  authLoginPath: string,
  location: SdkworkAuthLocationLike,
): string {
  if (isSdkworkAuthRoutePath(location.pathname, normalizeSdkworkAuthLoginBasePath(authLoginPath))) {
    const existing = /[?&]redirect=([^&]*)/u.exec(location.search ?? "")?.[1];
    return existing ? `${authLoginPath}?redirect=${existing}` : authLoginPath;
  }
  const returnPath = `${location.pathname}${location.search ?? ""}${location.hash ?? ""}`;
  return `${authLoginPath}?redirect=${encodeURIComponent(returnPath)}`;
}
