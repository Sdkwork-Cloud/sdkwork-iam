import { useCallback, useEffect, useMemo, useState } from "react";

import type { SdkworkIamH5AuthOAuthCallbackScreenProps } from "../types/auth-h5-types";
import { IAM_H5_AUTH_ROUTES } from "../types/auth-h5-types";
import {
  readScanLoginSessionKeyFromOAuthState,
} from "../services/auth-h5-controller";

const WECHAT_PROVIDER = "wechat";

/**
 * WeChat web-authorization callback screen.
 *
 * Receives `code`/`state` from the WeChat authorization page, exchanges it
 * for a session, and — when the login originated from a URL scan-login QR —
 * completes the QR session (`session_completions`) so the desktop login page
 * can finish.
 */
export function SdkworkIamH5AuthOAuthCallbackScreen({
  controller,
  onAuthenticated,
  onScanLoginCompleted,
  title = "Signing in",
}: SdkworkIamH5AuthOAuthCallbackScreenProps) {
  const [error, setError] = useState<string | undefined>();
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [completedScan, setCompletedScan] = useState(false);

  const oauthParams = useMemo(() => {
    if (typeof window === "undefined") {
      return undefined;
    }
    const search = new URLSearchParams(window.location.search);
    return {
      code: search.get("code") || undefined,
      error: search.get("error") || undefined,
      errorDescription: search.get("error_description") || undefined,
      state: search.get("state") || undefined,
    };
  }, []);

  const exchangeAndFinish = useCallback(async () => {
    if (typeof window === "undefined" || !oauthParams) {
      return;
    }
    if (oauthParams.error) {
      setError(oauthParams.errorDescription || oauthParams.error);
      setStatus("error");
      return;
    }
    if (!oauthParams.code) {
      setError("WeChat authorization did not return a code");
      setStatus("error");
      return;
    }
    const redirectUri = `${window.location.origin}${IAM_H5_AUTH_ROUTES.callbackPath}`;
    try {
      const session = await controller.loginWithOAuth({
        code: oauthParams.code,
        provider: WECHAT_PROVIDER,
        redirectUri,
        state: oauthParams.state || "",
      });
      const sessionKey = readScanLoginSessionKeyFromOAuthState(oauthParams.state);
      if (sessionKey) {
        const scanContext = controller.resolveScanLoginContext();
        if (scanContext?.pollSecret) {
          await controller.completeScanLogin({
            pollSecret: scanContext.pollSecret,
            sessionKey,
          });
          setCompletedScan(true);
          onScanLoginCompleted?.();
          return;
        }
        setError("Scan login poll secret is missing; please re-scan from the desktop login page");
        setStatus("error");
        return;
      }
      onAuthenticated?.(session);
      setStatus("ready");
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "OAuth login failed");
      setStatus("error");
    }
  }, [controller, oauthParams, onAuthenticated, onScanLoginCompleted]);

  useEffect(() => {
    void exchangeAndFinish();
  }, [exchangeAndFinish]);

  if (completedScan) {
    return (
      <section className="mx-auto flex w-full max-w-md flex-col items-center gap-4 p-4 text-center">
        <h1 className="text-lg font-semibold">Login successful</h1>
        <p className="text-sm text-zinc-600">
          You are signed in on this device. Return to your computer to finish.
        </p>
      </section>
    );
  }

  return (
    <section className="mx-auto flex w-full max-w-md flex-col items-center gap-4 p-4 text-center">
      <h1 className="text-lg font-semibold">{title}</h1>
      {status === "loading" ? (
        <p className="text-sm text-zinc-600">Exchanging authorization code...</p>
      ) : null}
      {status === "error" && error ? (
        <>
          <p className="text-sm text-red-600">{error}</p>
          <button
            className="rounded bg-black px-4 py-2 text-sm text-white"
            onClick={() => {
              if (typeof window !== "undefined") {
                window.location.assign(`${window.location.origin}${IAM_H5_AUTH_ROUTES.loginPath}`);
              }
            }}
            type="button"
          >
            Back to sign in
          </button>
        </>
      ) : null}
    </section>
  );
}
