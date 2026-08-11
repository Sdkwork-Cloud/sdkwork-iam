import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useSdkworkIamH5AuthMessages } from "../i18n";
import type {
  SdkworkIamH5AuthOAuthCallbackScreenProps,
  SdkworkIamH5OAuthFlowMode,
} from "../types/auth-h5-types";
import { IAM_H5_AUTH_ROUTES } from "../types/auth-h5-types";
import {
  blockWechatAutoAuthorization,
  clearOAuthFlowContext,
  clearScanLoginUrlContext,
  clearWechatAutoAuthorizationBlock,
  readOAuthFlowContext,
  readScanLoginPollSecretFromOAuthState,
  readScanLoginProviderFromOAuthState,
  readScanLoginSessionKeyFromOAuthState,
} from "../services/auth-h5-controller";

/**
 * WeChat web-authorization callback screen.
 *
 * Receives `code`/`state` from the authorization page, exchanges it for a
 * session, and — when the login originated from a URL scan-login QR —
 * completes the QR session (`session_completions`) so the desktop login page
 * can finish. The provider is carried in the `state` (`p:<provider>:<key>`
 * for third-party providers, legacy `scan:<key>` defaults to `wechat`).
 *
 * The flow mode (`silent` for `snsapi_base`, `explicit` for
 * `snsapi_userinfo`) is recovered from `sessionStorage` (see
 * `storeOAuthFlowContext`). When a silent attempt fails — WeChat returned an
 * error, no code, or the code exchange failed — the screen offers the
 * explicit consent flow (点击授权) so the user can still complete the login.
 */
export function SdkworkIamH5AuthOAuthCallbackScreen({
  controller,
  onAuthenticated,
  onScanLoginCompleted,
  title = "Signing in",
}: SdkworkIamH5AuthOAuthCallbackScreenProps) {
  const messages = useSdkworkIamH5AuthMessages();
  const [error, setError] = useState<string | undefined>();
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [completedScan, setCompletedScan] = useState(false);

  const flowContext = useMemo(() => readOAuthFlowContext(), []);
  const flowMode: SdkworkIamH5OAuthFlowMode | undefined = flowContext?.mode;
  const silentAttempt = flowMode === "silent";

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

  // Guards against double execution: React StrictMode mounts effects twice in
  // development and an unstable parent callback would re-run the effect. The
  // authorization code/state is single-use server-side, so a second exchange
  // would fail and overwrite the first result.
  const exchangeAttemptedRef = useRef(false);
  // Once the exchange succeeded (session committed, callback finished), a
  // late failure from a duplicate exchange must not flip the screen to an
  // error state.
  const completedRef = useRef(false);

  const failExchange = useCallback((message: string) => {
    if (completedRef.current) {
      return;
    }
    // Any failed attempt blocks the automatic silent redirect on the next
    // page load (deny → back to sign in → auto redirect loop guard).
    blockWechatAutoAuthorization();
    setError(message);
    setStatus("error");
  }, []);

  const exchangeAndFinish = useCallback(async () => {
    if (typeof window === "undefined" || !oauthParams || exchangeAttemptedRef.current) {
      return;
    }
    exchangeAttemptedRef.current = true;
    if (oauthParams.error) {
      failExchange(oauthParams.errorDescription || oauthParams.error);
      return;
    }
    if (!oauthParams.code) {
      failExchange("WeChat authorization did not return a code");
      return;
    }
    const redirectUri = `${window.location.origin}${IAM_H5_AUTH_ROUTES.callbackPath}`;
    try {
      const provider = readScanLoginProviderFromOAuthState(oauthParams.state) || "wechat";
      const session = await controller.loginWithOAuth({
        code: oauthParams.code,
        provider,
        redirectUri,
        state: oauthParams.state || "",
      });
      // The scan-login session key and poll secret come from the provider
      // mode `p:<provider>:<key>:<secret>` state, or from the H5 login page
      // context (sessionStorage) for the URL-mode WeChat flow.
      const scanContext = controller.resolveScanLoginContext();
      const sessionKey =
        readScanLoginSessionKeyFromOAuthState(oauthParams.state) || scanContext?.sessionKey;
      if (sessionKey) {
        const pollSecret =
          readScanLoginPollSecretFromOAuthState(oauthParams.state) || scanContext?.pollSecret;
        if (pollSecret) {
          await controller.completeScanLogin({
            pollSecret,
            sessionKey,
          });
          clearScanLoginUrlContext();
          clearOAuthFlowContext();
          clearWechatAutoAuthorizationBlock();
          completedRef.current = true;
          setCompletedScan(true);
          onScanLoginCompleted?.();
          return;
        }
        failExchange(
          "Scan login poll secret is missing; please re-scan from the desktop login page",
        );
        return;
      }
      clearOAuthFlowContext();
      clearWechatAutoAuthorizationBlock();
      completedRef.current = true;
      onAuthenticated?.(session);
      setStatus("ready");
    } catch (loginError) {
      failExchange(loginError instanceof Error ? loginError.message : "OAuth login failed");
    }
  }, [controller, failExchange, oauthParams, onAuthenticated, onScanLoginCompleted]);

  useEffect(() => {
    void exchangeAndFinish();
  }, [exchangeAndFinish]);

  /**
   * Escalates a failed silent attempt to the explicit consent flow
   * (`snsapi_userinfo`): WeChat shows the consent page granting nickname and
   * avatar, so followers and non-followers can both complete the login.
   */
  const authorizeWithWechat = useCallback(async () => {
    if (typeof window === "undefined" || !flowContext) {
      return;
    }
    if (!isWechatBrowser()) {
      setError(messages.oauth.wechatBrowserRequired);
      setStatus("error");
      return;
    }
    setStatus("loading");
    setError(undefined);
    try {
      await controller.beginOAuthAuthorization({
        mode: "explicit",
        provider: flowContext.provider,
        redirectUri: flowContext.redirectUri,
      });
    } catch (redirectError) {
      setError(
        redirectError instanceof Error
          ? redirectError.message
          : "WeChat authorization is unavailable",
      );
      setStatus("error");
    }
  }, [controller, flowContext, messages]);

  const backToLogin = useCallback(() => {
    if (typeof window !== "undefined") {
      window.location.assign(`${window.location.origin}${IAM_H5_AUTH_ROUTES.loginPath}`);
    }
  }, []);  if (completedScan) {
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
        <p className="text-sm text-zinc-600">
          {silentAttempt ? messages.oauth.silentSigningIn : messages.oauth.signingIn}
        </p>
      ) : null}
      {status === "error" && error ? (
        <>
          <p className="text-sm text-red-600">{error}</p>
          {silentAttempt ? (
            <>
              <p className="text-sm text-zinc-600">{messages.oauth.silentFailedHint}</p>
              <button
                type="button"
                className="h-12 w-full max-w-[240px] rounded-lg bg-[var(--iam-h5-auth-green)] text-[17px] font-medium text-white transition-all active:scale-[0.98]"
                onClick={() => void authorizeWithWechat()}
              >
                {messages.oauth.authorizeWithWechat}
              </button>
            </>
          ) : (
            <p className="text-sm text-zinc-600">{messages.oauth.explicitFailedHint}</p>
          )}
          <button
            className="rounded bg-black px-4 py-2 text-sm text-white"
            onClick={backToLogin}
            type="button"
          >
            {messages.links.backToLogin}
          </button>
        </>
      ) : null}
    </section>
  );
}

function isWechatBrowser(): boolean {
  if (typeof navigator === "undefined") {
    return false;
  }
  return /MicroMessenger/i.test(navigator.userAgent);
}
