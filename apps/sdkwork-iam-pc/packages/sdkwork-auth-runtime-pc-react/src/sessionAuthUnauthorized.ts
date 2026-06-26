export type SdkworkSessionAuthUnauthorizedMode = "redirect" | "modal" | "debug";

export const SDKWORK_SESSION_AUTH_UNAUTHORIZED_MODE_ENV_KEY =
  "VITE_SDKWORK_SESSION_AUTH_UNAUTHORIZED_MODE";

/** @deprecated Use `VITE_SDKWORK_SESSION_AUTH_UNAUTHORIZED_MODE=debug` instead. */
export const SDKWORK_SESSION_AUTH_REDIRECT_BYPASS_ENV_KEY =
  "VITE_SDKWORK_CLAWROUTER_DEV_SESSION_AUTH_REDIRECT_BYPASS";

export const SDKWORK_SESSION_AUTH_UNAUTHORIZED_EVENT =
  "sdkwork:session-auth-unauthorized";

export interface SdkworkSessionAuthUnauthorizedDetail {
  businessCode?: string;
  code?: string;
  httpStatus?: number;
  message: string;
  occurredAt: string;
  path?: string;
  raw?: unknown;
}

export type SdkworkSessionAuthUnauthorizedListener = (
  detail: SdkworkSessionAuthUnauthorizedDetail,
) => void;

export type SdkworkSessionAuthEnvReader = (name: string) => string | undefined;

export {
  formatSdkworkSessionAuthUnauthorizedDetail,
  isSdkworkSdkSessionAuthError,
} from "./sdkSessionAuthError.ts";

export {
  createSdkworkSessionAuthEnvReader,
  readSdkworkRuntimeEnvFromWindow,
  resolveSdkworkSessionAuthUnauthorizedMode,
  SDKWORK_RUNTIME_ENV_GLOBAL_KEY,
} from "./sessionAuthUnauthorizedEnv.ts";

export function defaultSdkworkSessionAuthEnvReader(name: string): string | undefined {
  return createSdkworkSessionAuthEnvReader()(name);
}

import { createSdkworkSessionAuthEnvReader } from "./sessionAuthUnauthorizedEnv.ts";

export function dispatchSdkworkSessionAuthUnauthorized(
  detail: SdkworkSessionAuthUnauthorizedDetail,
): void {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent<SdkworkSessionAuthUnauthorizedDetail>(
      SDKWORK_SESSION_AUTH_UNAUTHORIZED_EVENT,
      { detail },
    ),
  );
}

export function subscribeSdkworkSessionAuthUnauthorized(
  listener: SdkworkSessionAuthUnauthorizedListener,
): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }

  const handler = (event: Event) => {
    const customEvent = event as CustomEvent<SdkworkSessionAuthUnauthorizedDetail>;
    if (customEvent.detail) {
      listener(customEvent.detail);
    }
  };

  window.addEventListener(SDKWORK_SESSION_AUTH_UNAUTHORIZED_EVENT, handler);
  return () => {
    window.removeEventListener(SDKWORK_SESSION_AUTH_UNAUTHORIZED_EVENT, handler);
  };
}
