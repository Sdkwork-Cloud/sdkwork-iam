/**
 * Mobile-viewport detection for the auth surface.
 *
 * The mobile login/register screens are used when the login page is opened
 * from a phone browser (including WeChat's in-app browser). Desktop browsers
 * keep the desktop auth surface even when the window is narrow — detection
 * therefore treats the user agent as the primary signal and touch/narrow
 * viewport only as an assist for hybrid shells.
 */

export interface SdkworkMobileAuthViewportEnvironment {
  maxTouchPoints?: number;
  matchMedia?: (query: string) => { matches: boolean } | null;
  userAgent?: string;
}

const MOBILE_USER_AGENT_PATTERN =
  /Android|iPhone|iPad|iPod|Mobile|Opera Mini|IEMobile|Windows Phone|MicroMessenger/i;

export function isSdkworkMobileAuthViewport(
  env: SdkworkMobileAuthViewportEnvironment = {},
): boolean {
  const userAgent = env.userAgent ?? readNavigatorUserAgent();
  if (userAgent && MOBILE_USER_AGENT_PATTERN.test(userAgent)) {
    return true;
  }

  const maxTouchPoints = env.maxTouchPoints ?? readNavigatorMaxTouchPoints();
  const narrow = resolveNarrowViewport(env.matchMedia ?? readMatchMedia());
  return (maxTouchPoints ?? 0) > 0 && narrow;
}

function resolveNarrowViewport(
  matchMedia: SdkworkMobileAuthViewportEnvironment["matchMedia"],
): boolean {
  if (typeof matchMedia !== "function") {
    return false;
  }
  const query = "(max-width: 768px)";
  try {
    return matchMedia(query)?.matches ?? false;
  } catch {
    return false;
  }
}

function readNavigatorUserAgent(): string | undefined {
  if (typeof navigator === "undefined") {
    return undefined;
  }
  return navigator.userAgent;
}

function readNavigatorMaxTouchPoints(): number | undefined {
  if (typeof navigator === "undefined") {
    return undefined;
  }
  return navigator.maxTouchPoints;
}

function readMatchMedia(): SdkworkMobileAuthViewportEnvironment["matchMedia"] {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return undefined;
  }
  return (query) => window.matchMedia(query);
}
