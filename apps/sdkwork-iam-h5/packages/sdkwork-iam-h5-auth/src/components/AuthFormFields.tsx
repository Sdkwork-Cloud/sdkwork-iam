import { Eye, EyeOff } from "lucide-react";

import { useSdkworkIamH5AuthMessages } from "../i18n";
import type { SdkworkIamH5AuthMode } from "../types/auth-h5-types";

export interface SdkworkIamH5AuthFormFieldsProps {
  mode: SdkworkIamH5AuthMode;
  account: string;
  code: string;
  countdown: number;
  password: string;
  setAccount: (value: string) => void;
  setCode: (value: string) => void;
  setPassword: (value: string) => void;
  setShowPwd: (value: boolean) => void;
  showPwd: boolean;
  handleSendCode: () => void;
}

export function SdkworkIamH5AuthFormFields({
  mode,
  account,
  code,
  countdown,
  password,
  setAccount,
  setCode,
  setPassword,
  setShowPwd,
  showPwd,
  handleSendCode,
}: SdkworkIamH5AuthFormFieldsProps) {
  const messages = useSdkworkIamH5AuthMessages();
  const showPasswordRow = mode === "login-pwd" || mode === "register" || mode === "forgot";
  const showCodeRow = mode === "login-code" || mode === "register" || mode === "forgot";

  return (
    <div className="flex w-full flex-col gap-4">
      {/* Account input */}
      <div className="group flex items-center border-b border-[var(--iam-h5-auth-border)] py-3 transition-colors focus-within:border-[var(--iam-h5-auth-green)]">
        <span className="mr-4 text-[16px] font-medium opacity-50">
          {messages.common.accountLabel}
        </span>
        <input
          type="text"
          placeholder={messages.common.accountPlaceholder}
          value={account}
          onChange={(event) => setAccount(event.target.value.trim())}
          className="flex-1 bg-transparent text-[16px] outline-none"
        />
      </div>

      {/* Password input */}
      {showPasswordRow ? (
        <div className="flex items-center border-b border-[var(--iam-h5-auth-border)] py-3 transition-colors focus-within:border-[var(--iam-h5-auth-green)]">
          <input
            type={showPwd ? "text" : "password"}
            placeholder={
              mode === "forgot"
                ? messages.common.setNewPasswordPlaceholder
                : messages.common.passwordPlaceholder
            }
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="flex-1 bg-transparent text-[16px] outline-none"
          />
          <div
            onClick={() => setShowPwd(!showPwd)}
            className="cursor-pointer pl-4 pr-1 opacity-50 transition-transform active:scale-90"
          >
            {showPwd ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
          </div>
        </div>
      ) : null}

      {/* Verification code input */}
      {showCodeRow ? (
        <div className="flex items-center border-b border-[var(--iam-h5-auth-border)] py-3 transition-colors focus-within:border-[var(--iam-h5-auth-green)]">
          <input
            type="text"
            placeholder={messages.common.codePlaceholder}
            maxLength={6}
            value={code}
            onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
            className="flex-1 bg-transparent text-[16px] outline-none"
          />
          <button
            type="button"
            onClick={handleSendCode}
            disabled={countdown > 0}
            className="pl-4 text-[15px] font-medium text-[var(--iam-h5-auth-link)] transition-opacity disabled:opacity-50 active:opacity-70"
          >
            {countdown > 0 ? `${countdown}s` : messages.common.getCode}
          </button>
        </div>
      ) : null}
    </div>
  );
}
