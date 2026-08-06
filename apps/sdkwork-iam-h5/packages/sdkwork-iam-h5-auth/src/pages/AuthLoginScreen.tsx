import { isBlank } from "@sdkwork/utils";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type {
  SdkworkIamH5AuthLoginScreenProps,
  SdkworkIamH5ScanLoginContext,
} from "../types/auth-h5-types";
import { IAM_H5_AUTH_ROUTES } from "../types/auth-h5-types";
import {
  buildScanLoginOAuthState,
  clearScanLoginUrlContext,
} from "../services/auth-h5-controller";
import { SdkworkIamH5AuthLoginContextSelectionScreen } from "./AuthLoginContextSelectionScreen";

const WECHAT_PROVIDER = "wechat";

/**
 * Mobile H5 login screen.
 *
 * When opened from a URL scan-login QR code (`session_key` query +
 * `poll_secret` fragment), a successful login completes the QR session so the
 * desktop login page can finish:
 * - WeChat in-app browser with the `wechat` provider available → redirects to
 *   the WeChat web-authorization page automatically;
 * - otherwise the password form (and a manual WeChat login button) is shown.
 */
export function SdkworkIamH5AuthLoginScreen({
  controller,
  onAuthenticated,
  onScanLoginCompleted,
  title = "Sign in",
}: SdkworkIamH5AuthLoginScreenProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);
  const [wechatRedirecting, setWechatRedirecting] = useState(false);
  const [challenge, setChallenge] = useState(controller.getState().challenge);
  const scanContext = useMemo(() => controller.resolveScanLoginContext(), [controller]);
  const [completed, setCompleted] = useState(false);

  const redirectToWechatAuthorization = useCallback(async () => {
    if (typeof window === "undefined") {
      return;
    }
    setWechatRedirecting(true);
    setError(undefined);
    const redirectUri = `${window.location.origin}${IAM_H5_AUTH_ROUTES.callbackPath}`;
    const state = scanContext ? buildScanLoginOAuthState(scanContext.sessionKey) : undefined;
    try {
      const authUrl = await controller.createOAuthAuthorizationUrl({
        provider: WECHAT_PROVIDER,
        redirectUri,
        state,
      });
      window.location.assign(authUrl);
    } catch (redirectError) {
      setWechatRedirecting(false);
      setError(
        redirectError instanceof Error
          ? redirectError.message
          : "WeChat authorization is unavailable",
      );
    }
  }, [controller, scanContext]);

  // Auto-redirect when the page is opened inside the WeChat in-app browser
  // and the WeChat provider is enabled for this tenant. The attempt is
  // tracked in a ref so a failed redirect (provider disabled / network error)
  // does not re-trigger the effect and cause an infinite redirect loop.
  const autoRedirectAttemptedRef = useRef(false);
  useEffect(() => {
    let cancelled = false;
    if (
      !isWechatBrowser() ||
      wechatRedirecting ||
      autoRedirectAttemptedRef.current
    ) {
      return undefined;
    }
    autoRedirectAttemptedRef.current = true;
    void controller.listOAuthProviders()
      .then((providers) => {
        if (cancelled) {
          return;
        }
        if (providers.some((provider) => provider.providerCode === WECHAT_PROVIDER)) {
          void redirectToWechatAuthorization();
        }
      })
      .catch(() => {
        // Provider discovery is best-effort; fall back to the manual form.
      });
    return () => {
      cancelled = true;
    };
  }, [controller, redirectToWechatAuthorization, wechatRedirecting]);

  const finishScanLogin = useCallback(async (sessionKey: string, pollSecret?: string) => {
    if (!pollSecret) {
      setError("Scan login poll secret is missing; please re-scan from the desktop login page");
      return;
    }
    setBusy(true);
    setError(undefined);
    try {
      await controller.completeScanLogin({ pollSecret, sessionKey });
      clearScanLoginUrlContext();
      setCompleted(true);
      onScanLoginCompleted?.();
    } catch (completionError) {
      setError(
        completionError instanceof Error ? completionError.message : "Scan login completion failed",
      );
    } finally {
      setBusy(false);
    }
  }, [controller, onScanLoginCompleted]);

  const handleAuthenticated = useCallback(async (sessionKey: string, pollSecret?: string) => {
    if (sessionKey) {
      await finishScanLogin(sessionKey, pollSecret);
      return;
    }
    const session = controller.getState().session;
    if (session) {
      onAuthenticated?.(session);
    }
  }, [controller, finishScanLogin, onAuthenticated]);

  if (challenge) {
    return (
      <SdkworkIamH5AuthLoginContextSelectionScreen
        challenge={challenge}
        controller={controller}
        errorMessage={error}
        onAuthenticated={(session) => {
          setChallenge(undefined);
          if (scanContext) {
            void finishScanLogin(scanContext.sessionKey, scanContext.pollSecret);
          } else {
            onAuthenticated?.(session);
          }
        }}
        onCancel={() => {
          setChallenge(undefined);
          setError(undefined);
        }}
        title="Choose login context"
      />
    );
  }

  if (completed) {
    return (
      <ScanLoginCompletedNotice onBackToForm={() => setCompleted(false)} />
    );
  }

  return (
    <section className="mx-auto flex w-full max-w-md flex-col gap-4 p-4">
      <h1 className="text-lg font-semibold">{title}</h1>
      {scanContext ? (
        <p className="text-sm text-zinc-600">
          Scan login confirmed. Sign in to continue on your computer.
        </p>
      ) : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <label className="flex flex-col gap-1 text-sm">
        <span>Username</span>
        <input
          autoComplete="username"
          className="rounded border px-3 py-2"
          onChange={(event) => setUsername(event.target.value)}
          value={username}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span>Password</span>
        <input
          autoComplete="current-password"
          className="rounded border px-3 py-2"
          onChange={(event) => setPassword(event.target.value)}
          type="password"
          value={password}
        />
      </label>
      <button
        className="rounded bg-black px-4 py-2 text-sm text-white disabled:opacity-50"
        disabled={busy || wechatRedirecting || isBlank(username) || isBlank(password)}
        onClick={() => {
          setBusy(true);
          setError(undefined);
          void controller.login({ password, username })
            .then((result) => {
              if (result.kind === "loginContextSelectionRequired") {
                setChallenge(result.challenge);
                return;
              }
              if (scanContext) {
                return handleAuthenticated(scanContext.sessionKey, scanContext.pollSecret);
              }
              onAuthenticated?.(result.session);
            })
            .catch((loginError) => {
              setError(loginError instanceof Error ? loginError.message : "Login failed");
            })
            .finally(() => setBusy(false));
        }}
        type="button"
      >
        Sign in
      </button>
      <button
        className="rounded border border-black/20 px-4 py-2 text-sm disabled:opacity-50"
        disabled={busy || wechatRedirecting}
        onClick={() => void redirectToWechatAuthorization()}
        type="button"
      >
        {wechatRedirecting ? "Redirecting to WeChat..." : "Sign in with WeChat"}
      </button>
    </section>
  );
}

function ScanLoginCompletedNotice({ onBackToForm }: { onBackToForm: () => void }) {
  return (
    <section className="mx-auto flex w-full max-w-md flex-col items-center gap-4 p-4 text-center">
      <h1 className="text-lg font-semibold">Login successful</h1>
      <p className="text-sm text-zinc-600">
        You are signed in on this device. Return to your computer to finish.
      </p>
      <button
        className="rounded bg-black px-4 py-2 text-sm text-white"
        onClick={onBackToForm}
        type="button"
      >
        Back to sign in
      </button>
    </section>
  );
}

function isWechatBrowser(): boolean {
  if (typeof navigator === "undefined") {
    return false;
  }
  return /MicroMessenger/i.test(navigator.userAgent);
}
