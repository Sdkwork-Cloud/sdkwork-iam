import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useSdkworkIamH5AuthMessages } from "../i18n";
import type {
  SdkworkIamH5AuthController,
  SdkworkIamH5AuthMode,
  SdkworkIamH5AuthSession,
  SdkworkIamH5ScanLoginContext,
} from "../types/auth-h5-types";
import { IAM_H5_AUTH_ROUTES } from "../types/auth-h5-types";
import {
  buildScanLoginOAuthState,
  clearScanLoginUrlContext,
  resolveSdkworkIamH5VerifyType,
  SDKWORK_IAM_H5_AUTH_VERIFICATION_UNAVAILABLE_MESSAGE,
} from "../services/auth-h5-controller";
import { SdkworkIamH5AuthFooter } from "../components/AuthFooter";
import { SdkworkIamH5AuthFormFields } from "../components/AuthFormFields";
import { SdkworkIamH5AuthHeader } from "../components/AuthHeader";
import { SdkworkIamH5AuthModeLinks } from "../components/AuthModeLinks";
import { SdkworkIamH5AuthPrimaryButton } from "../components/AuthPrimaryButton";
import { SdkworkIamH5AuthTermsModal } from "../components/TermsModal";
import { SdkworkIamH5AuthThirdPartyLogin } from "../components/ThirdPartyLogin";
import { SdkworkIamH5AuthLoginContextSelectionScreen } from "./AuthLoginContextSelectionScreen";

const WECHAT_PROVIDER = "wechat";
const CODE_COUNTDOWN_SECONDS = 60;

/**
 * Mobile H5 login/register screen following the ClawChat mobile auth design:
 * password login, code login, phone registration and password recovery are
 * available through the mode switcher; the footer requires reading and
 * agreeing to the terms before submitting.
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
  onThirdPartyLogin,
}: SdkworkIamH5AuthLoginScreenProps) {
  const messages = useSdkworkIamH5AuthMessages();
  const [mode, setMode] = useState<SdkworkIamH5AuthMode>("login-pwd");

  const [account, setAccount] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [agreed, setAgreed] = useState(true);
  const [showPwd, setShowPwd] = useState(false);
  const [showTerms, setShowTerms] = useState<string | null>(null);

  const [countdown, setCountdown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [challenge, setChallenge] = useState<NonNullable<ReturnType<SdkworkIamH5AuthController["getState"]>["challenge"]> | undefined>();
  const [completed, setCompleted] = useState(false);

  const scanContext = useMemo(() => controller.resolveScanLoginContext(), [controller]);
  const [wechatRedirecting, setWechatRedirecting] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (countdown > 0) {
      timer = setInterval(() => setCountdown((value) => value - 1), 1000);
    }
    return () => {
      if (timer) {
        clearInterval(timer);
      }
    };
  }, [countdown]);

  const showError = useCallback((message: string) => {
    setError(message);
  }, []);

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
      showError(
        redirectError instanceof Error
          ? redirectError.message
          : "WeChat authorization is unavailable",
      );
    }
  }, [controller, scanContext, showError]);

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

  const handleSendCode = useCallback(async () => {
    if (!account) {
      showError(messages.toasts.enterAccount);
      return;
    }
    setError(undefined);
    const scene = mode === "login-code" ? "LOGIN" : mode === "register" ? "REGISTER" : "RESET_PASSWORD";
    try {
      await controller.sendVerificationCode({
        scene,
        target: account,
        verifyType: resolveSdkworkIamH5VerifyType(account),
      });
      setCountdown(CODE_COUNTDOWN_SECONDS);
      showError(messages.toasts.codeSent);
    } catch (sendError) {
      const message = sendError instanceof Error ? sendError.message : messages.toasts.operationFailed;
      showError(
        message === SDKWORK_IAM_H5_AUTH_VERIFICATION_UNAVAILABLE_MESSAGE
          ? messages.toasts.verificationUnavailable
          : message,
      );
    }
  }, [account, controller, messages, mode, showError]);

  const finishScanLogin = useCallback(async (sessionKey: string, pollSecret?: string) => {
    if (!pollSecret) {
      showError("Scan login poll secret is missing; please re-scan from the desktop login page");
      return;
    }
    setLoading(true);
    setError(undefined);
    try {
      await controller.completeScanLogin({ pollSecret, sessionKey });
      clearScanLoginUrlContext();
      setCompleted(true);
      onScanLoginCompleted?.();
    } catch (completionError) {
      showError(
        completionError instanceof Error ? completionError.message : "Scan login completion failed",
      );
    } finally {
      setLoading(false);
    }
  }, [controller, onScanLoginCompleted, showError]);

  const handleAuthenticated = useCallback(async (session: SdkworkIamH5AuthSession) => {
    if (scanContext) {
      await finishScanLogin(scanContext.sessionKey, scanContext.pollSecret);
      return;
    }
    onAuthenticated?.(session);
  }, [finishScanLogin, onAuthenticated, scanContext]);

  const handleSubmit = useCallback(async () => {
    if (!agreed) {
      showError(messages.toasts.agreeTermsFirst);
      return;
    }
    if (!account) {
      showError(messages.toasts.enterValidAccount);
      return;
    }

    setLoading(true);
    setError(undefined);
    try {
      if (mode === "login-pwd") {
        if (!password) {
          showError(messages.toasts.enterPassword);
          return;
        }
        const result = await controller.login({ password, username: account });
        if (result.kind === "loginContextSelectionRequired") {
          setChallenge(result.challenge);
          return;
        }
        await handleAuthenticated(result.session);
      } else if (mode === "login-code") {
        if (!code) {
          showError(messages.toasts.enterCode);
          return;
        }
        const result = await controller.loginWithCode({ code, target: account });
        if (result.kind === "loginContextSelectionRequired") {
          setChallenge(result.challenge);
          return;
        }
        await handleAuthenticated(result.session);
      } else if (mode === "register") {
        if (!code) {
          showError(messages.toasts.enterCode);
          return;
        }
        const result = await controller.register({ account, code, password });
        if (result.kind === "loginContextSelectionRequired") {
          setChallenge(result.challenge);
          return;
        }
        await handleAuthenticated(result.session);
      } else if (mode === "forgot") {
        if (!code) {
          showError(messages.toasts.enterCode);
          return;
        }
        if (!password) {
          showError(messages.toasts.enterNewPassword);
          return;
        }
        await controller.resetPassword({ account, code, newPassword: password });
        showError(messages.toasts.passwordResetSuccess);
        setMode("login-pwd");
      }
    } catch (submitError) {
      showError(
        submitError instanceof Error ? submitError.message : messages.toasts.operationFailed,
      );
    } finally {
      setLoading(false);
    }
  }, [
    account,
    agreed,
    code,
    controller,
    handleAuthenticated,
    messages,
    mode,
    password,
    showError,
  ]);

  const handleThirdPartyLogin = useCallback((platform: string) => {
    if (!agreed) {
      showError(messages.toasts.agreeTermsFirst);
      return;
    }
    if (onThirdPartyLogin) {
      onThirdPartyLogin(platform);
      return;
    }
    showError(`${platform}${messages.thirdParty.unavailableHint}`);
  }, [agreed, messages, onThirdPartyLogin, showError]);

  const changeMode = useCallback((nextMode: SdkworkIamH5AuthMode) => {
    setMode(nextMode);
    setAccount("");
    setPassword("");
    setCode("");
    setError(undefined);
  }, []);

  const isFormValid =
    account.length > 0 &&
    (mode === "login-pwd"
      ? password.length > 0
      : mode === "login-code"
        ? code.length > 0
        : mode === "register"
          ? code.length > 0
          : code.length > 0 && password.length > 0) &&
    agreed;

  if (challenge) {
    return (
      <SdkworkIamH5AuthLoginContextSelectionScreen
        challenge={challenge}
        controller={controller}
        errorMessage={error}
        onAuthenticated={(session) => {
          setChallenge(undefined);
          void handleAuthenticated(session);
        }}
        onCancel={() => {
          setChallenge(undefined);
          setError(undefined);
        }}
      />
    );
  }

  if (completed) {
    return (
      <ScanLoginCompletedNotice
        description={messages.scanLogin.completedDescription}
        onBackToForm={() => setCompleted(false)}
        title={messages.scanLogin.completedTitle}
      />
    );
  }

  return (
    <div className="sdkwork-iam-h5-auth-surface relative flex h-full flex-col overflow-y-auto">
      <div className="flex min-h-[500px] flex-1 flex-col justify-center px-8 py-8">
        <SdkworkIamH5AuthHeader mode={mode} />

        <div className="flex w-full flex-col">
          <SdkworkIamH5AuthFormFields
            mode={mode}
            account={account}
            setAccount={setAccount}
            password={password}
            setPassword={setPassword}
            code={code}
            setCode={setCode}
            showPwd={showPwd}
            setShowPwd={setShowPwd}
            countdown={countdown}
            handleSendCode={() => void handleSendCode()}
          />

          {error ? (
            <p className="mt-5 text-center text-[14px] text-[#EF4444]">{error}</p>
          ) : null}

          <div className="mt-8 flex flex-col gap-5">
            <SdkworkIamH5AuthPrimaryButton
              disabled={!isFormValid}
              loading={loading}
              mode={mode}
              onClick={() => void handleSubmit()}
            />

            <SdkworkIamH5AuthModeLinks mode={mode} onChangeMode={changeMode} />

            <SdkworkIamH5AuthThirdPartyLogin
              controller={controller}
              mode={mode}
              onLogin={handleThirdPartyLogin}
            />
          </div>
        </div>
      </div>

      <SdkworkIamH5AuthFooter
        agreed={agreed}
        setAgreed={setAgreed}
        setShowTerms={setShowTerms}
      />

      <SdkworkIamH5AuthTermsModal showTerms={showTerms} onClose={() => setShowTerms(null)} />
    </div>
  );
}

function ScanLoginCompletedNotice({
  description,
  onBackToForm,
  title,
}: {
  description: string;
  onBackToForm: () => void;
  title: string;
}) {
  const messages = useSdkworkIamH5AuthMessages();
  return (
    <div className="sdkwork-iam-h5-auth-surface flex h-full flex-col items-center justify-center gap-4 px-8 text-center">
      <h1 className="text-lg font-semibold">{title}</h1>
      <p className="text-sm text-[var(--iam-h5-auth-text-sub)]">{description}</p>
      <button
        type="button"
        className="mt-4 h-12 w-full max-w-[240px] rounded-lg bg-[var(--iam-h5-auth-green)] text-[17px] font-medium text-white transition-all active:scale-[0.98]"
        onClick={onBackToForm}
      >
        {messages.scanLogin.backToForm}
      </button>
    </div>
  );
}

function isWechatBrowser(): boolean {
  if (typeof navigator === "undefined") {
    return false;
  }
  return /MicroMessenger/i.test(navigator.userAgent);
}

export interface SdkworkIamH5AuthLoginScreenProps {
  controller: SdkworkIamH5AuthController;
  onAuthenticated?: (session: SdkworkIamH5AuthSession) => void;
  /** Invoked when a scan-login QR session was completed on this device. */
  onScanLoginCompleted?: () => void;
  /**
   * Invoked when a third-party provider entry is activated; the host decides
   * the provider flow (the IM product currently fails closed).
   */
  onThirdPartyLogin?: (platform: string) => void;
}
