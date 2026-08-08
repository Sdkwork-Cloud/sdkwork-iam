import { isSdkworkSdkSessionAuthError } from "./sdkSessionAuthError.ts";
import {
  buildSdkworkLoginRedirectPath,
  isSdkworkAuthRoutePath,
  normalizeSdkworkAuthLoginBasePath,
} from "./sessionAuthRedirect.ts";
import {
  dispatchSdkworkSessionAuthUnauthorized,
  formatSdkworkSessionAuthUnauthorizedDetail,
  type SdkworkSessionAuthEnvReader,
} from "./sessionAuthUnauthorized.ts";
import {
  createSdkworkSessionAuthEnvReader,
  resolveSdkworkSessionAuthUnauthorizedMode,
} from "./sessionAuthUnauthorizedEnv.ts";

export interface SdkworkSessionAuthUnauthorizedHandlerOptions {
  authLoginPath?: string;
  clearSession?: () => void;
  readCurrentPath?: () => string | undefined;
  readEnv?: SdkworkSessionAuthEnvReader;
  redirectToLogin?: (loginUrl: string) => void;
  resetClients?: () => void;
  shouldRedirectOnUnauthorized?: (pathname: string) => boolean;
}

const DEFAULT_AUTH_LOGIN_PATH = "/auth/login";

let sessionAuthRedirectTarget: string | null = null;

export function resetSdkworkSessionAuthRedirectState(): void {
  sessionAuthRedirectTarget = null;
}

function readBrowserHostname(): string | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }
  return window.location.hostname;
}

function readBrowserPathname(): string {
  if (typeof window === "undefined") {
    return "/";
  }
  const pathname = window.location.pathname?.trim();
  if (!pathname) {
    return "/";
  }
  return pathname.startsWith("/") ? pathname : `/${pathname}`;
}

function readBrowserRequestPath(): string | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }
  const { pathname, search } = window.location;
  if (!pathname) {
    return undefined;
  }
  return `${readBrowserPathname()}${search ?? ""}`;
}

/**
 * @deprecated Use `isSdkworkAuthRoutePath` from `./sessionAuthRedirect.ts`
 * with `normalizeSdkworkAuthLoginBasePath(authLoginPath)`. Kept as a
 * compatibility alias: it takes the login path (for example "/auth/login")
 * and checks the whole auth surface it belongs to.
 */
export function isSdkworkSessionAuthRoutePath(
  pathname: string,
  authLoginPath: string,
): boolean {
  return isSdkworkAuthRoutePath(pathname, normalizeSdkworkAuthLoginBasePath(authLoginPath));
}

function defaultShouldRedirectOnUnauthorized(pathname: string, authLoginPath: string): boolean {
  return !isSdkworkSessionAuthRoutePath(pathname, authLoginPath);
}

function defaultRedirectToLogin(loginUrl: string): void {
  if (typeof window === "undefined") {
    return;
  }
  if (sessionAuthRedirectTarget === loginUrl) {
    return;
  }
  sessionAuthRedirectTarget = loginUrl;
  window.location.replace(loginUrl);
}

export function handleSdkworkSessionAuthUnauthorizedError(
  error: unknown,
  options: SdkworkSessionAuthUnauthorizedHandlerOptions = {},
): boolean {
  if (!isSdkworkSdkSessionAuthError(error)) {
    return false;
  }

  const authLoginPath = options.authLoginPath ?? DEFAULT_AUTH_LOGIN_PATH;
  const readEnv = createSdkworkSessionAuthEnvReader(options.readEnv);
  const mode = resolveSdkworkSessionAuthUnauthorizedMode({
    hostname: readBrowserHostname(),
    readEnv,
  });

  options.clearSession?.();
  options.resetClients?.();

  if (mode === "debug") {
    return true;
  }

  const currentPath = options.readCurrentPath?.() ?? readBrowserRequestPath();

  if (mode === "modal") {
    dispatchSdkworkSessionAuthUnauthorized(
      formatSdkworkSessionAuthUnauthorizedDetail(error, { path: currentPath }),
    );
    return true;
  }

  const pathname = readBrowserPathname();
  const shouldRedirect = options.shouldRedirectOnUnauthorized
    ?? ((path) => defaultShouldRedirectOnUnauthorized(path, authLoginPath));
  if (!shouldRedirect(pathname)) {
    return true;
  }

  const returnPath = currentPath ?? pathname;
  const loginUrl = buildSdkworkLoginRedirectPath(authLoginPath, returnPath);
  (options.redirectToLogin ?? defaultRedirectToLogin)(loginUrl);
  return true;
}
