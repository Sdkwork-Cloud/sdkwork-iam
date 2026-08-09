import { useSdkworkIamH5AuthMessages } from "../i18n";
import type { SdkworkIamH5AuthMode } from "../types/auth-h5-types";

export interface SdkworkIamH5AuthPrimaryButtonProps {
  disabled: boolean;
  loading: boolean;
  mode: SdkworkIamH5AuthMode;
  onClick: () => void;
}

export function SdkworkIamH5AuthPrimaryButton({
  disabled,
  loading,
  mode,
  onClick,
}: SdkworkIamH5AuthPrimaryButtonProps) {
  const messages = useSdkworkIamH5AuthMessages();
  const label = loading
    ? messages.actions.pleaseWait
    : mode.startsWith("login")
      ? messages.actions.agreeAndLogin
      : mode === "register"
        ? messages.actions.agreeAndRegister
        : messages.actions.confirm;

  return (
    <button
      type="button"
      className={
        "h-12 w-full rounded-lg text-[17px] font-medium text-white transition-all active:scale-[0.98] " +
        (disabled
          ? "bg-[var(--iam-h5-auth-btn-disabled-bg)] text-[var(--iam-h5-auth-btn-disabled-text)]"
          : "bg-[var(--iam-h5-auth-green)] shadow-md shadow-[var(--iam-h5-auth-green-shadow)]")
      }
      disabled={disabled || loading}
      onClick={onClick}
    >
      {label}
    </button>
  );
}
