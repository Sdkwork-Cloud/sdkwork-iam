import { isSdkworkSdkSessionAuthError } from "./sdkSessionAuthError.ts";
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

function isAuthRoutePath(pathname: string, authLoginPath: string): boolean {
  const authBasePath = authLoginPath.replace(/\/login\/?$/u, "") || "/auth";
  return pathname === authBasePath || pathname.startsWith(`${authBasePath}/`);
}

function buildLoginRedirectPath(
  authLoginPath: string,
  returnPath: string,
): string {
  return `${authLoginPath}?redirect=${encodeURIComponent(returnPath)}`;
}

function defaultShouldRedirectOnUnauthorized(pathname: string, authLoginPath: string): boolean {
  return !isAuthRoutePath(pathname, authLoginPath);
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
    options.clearSession?.();
    options.resetClients?.();
    return true;
  }

  options.clearSession?.();
  options.resetClients?.();

  const returnPath = currentPath ?? pathname;
  const loginUrl = buildLoginRedirectPath(authLoginPath, returnPath);
  (options.redirectToLogin ?? defaultRedirectToLogin)(loginUrl);
  return true;
}
