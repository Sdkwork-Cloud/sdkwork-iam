import { useSdkworkIamH5AuthMessages } from "../i18n";
import type { SdkworkIamH5AuthMode } from "../types/auth-h5-types";

export interface SdkworkIamH5AuthModeLinksProps {
  mode: SdkworkIamH5AuthMode;
  onChangeMode: (mode: SdkworkIamH5AuthMode) => void;
}

const LINK_CLASS =
  "cursor-pointer active:opacity-70";

export function SdkworkIamH5AuthModeLinks({
  mode,
  onChangeMode,
}: SdkworkIamH5AuthModeLinksProps) {
  const messages = useSdkworkIamH5AuthMessages();
  const isLogin = mode === "login-pwd" || mode === "login-code";

  return (
    <div className="flex items-center justify-between px-1 text-[14px] font-medium text-[var(--iam-h5-auth-link)]">
      {mode === "login-pwd" ? (
        <span className={LINK_CLASS} onClick={() => onChangeMode("login-code")}>
          {messages.links.loginWithCode}
        </span>
      ) : null}
      {mode === "login-code" ? (
        <span className={LINK_CLASS} onClick={() => onChangeMode("login-pwd")}>
          {messages.links.loginWithPwd}
        </span>
      ) : null}
      {isLogin ? (
        <div className="flex gap-4">
          <span className={LINK_CLASS} onClick={() => onChangeMode("forgot")}>
            {messages.links.forgotPassword}
          </span>
          <span className={LINK_CLASS} onClick={() => onChangeMode("register")}>
            {messages.links.registerAccount}
          </span>
        </div>
      ) : null}
      {!isLogin ? (
        <span className={LINK_CLASS} onClick={() => onChangeMode("login-pwd")}>
          {messages.links.backToLogin}
        </span>
      ) : null}
    </div>
  );
}
