import {
  useEffect,
  useState,
  type FormEvent,
} from "react";
import {
  ArrowRight,
  Mail,
  Smartphone,
} from "lucide-react";
import {
  Button,
  Input,
  Label,
  sdkToast,
} from "@sdkwork/ui-pc-react";
import {
  DEFAULT_SDKWORK_AUTH_RECOVERY_METHODS,
  looksLikeEmailAddress,
  looksLikePhoneNumber,
  readSdkworkIdentityErrorMessage,
  resolveSdkworkAuthRecoveryMethods,
  resolveSdkworkRecoveryChannel,
  type SdkworkAuthRecoveryMethod,
} from "../../auth-config.ts";
import type {
  SdkworkAuthPasswordResetInput,
  SdkworkAuthPasswordResetRequestInput,
} from "../../auth-service.ts";
import { useSdkworkAuthIntl } from "../../auth-intl.tsx";
import { SdkworkAuthMethodTabs } from "./AuthMethodTabs.tsx";
import { SdkworkAuthFieldError } from "./FieldError.tsx";
import { SdkworkPasswordField } from "./PasswordField.tsx";
import {
  SDKWORK_AUTH_ICON_INPUT_CLASS_NAME,
  SDKWORK_AUTH_PRIMARY_BUTTON_CLASS_NAME,
  SDKWORK_AUTH_INPUT_STYLE,
  SDKWORK_AUTH_PRIMARY_BUTTON_STYLE,
} from "./form-control-styles.ts";
import { SdkworkVerificationCodeField } from "./VerificationCodeField.tsx";
import { useSdkworkActionCooldown } from "./useActionCooldown.ts";

interface SdkworkForgotPasswordFlowErrors {
  account?: string;
  code?: string;
  confirmPassword?: string;
  newPassword?: string;
}

export interface SdkworkForgotPasswordFlowProps {
  developmentVerificationCode?: string;
  initialAccount?: string;
  methods?: SdkworkAuthRecoveryMethod[];
  onRequestReset(payload: SdkworkAuthPasswordResetRequestInput): Promise<void>;
  onSubmit(payload: SdkworkAuthPasswordResetInput): Promise<void>;
}

export function SdkworkForgotPasswordFlow({
  developmentVerificationCode,
  initialAccount,
  methods,
  onRequestReset,
  onSubmit,
}: SdkworkForgotPasswordFlowProps) {
  const { copy } = useSdkworkAuthIntl();
  const enabledMethods = resolveSdkworkAuthRecoveryMethods(methods);
  const [method, setMethod] = useState<SdkworkAuthRecoveryMethod>("email");
  const [account, setAccount] = useState(initialAccount || "");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<SdkworkForgotPasswordFlowErrors>({});
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { isCoolingDown, remainingSeconds, resetCooldown, startCooldown } = useSdkworkActionCooldown();

  const handleMethodChange = (nextMethod: SdkworkAuthRecoveryMethod) => {
    if (nextMethod === method) {
      return;
    }

    setMethod(nextMethod);
    setAccount((current) => {
      const matchesNextMethod = nextMethod === "email"
        ? looksLikeEmailAddress(current)
        : looksLikePhoneNumber(current);
      return matchesNextMethod ? current : "";
    });
    setCode(developmentVerificationCode || "");
    setErrors({});
    setIsSendingCode(false);
    resetCooldown();
  };

  useEffect(() => {
    setAccount(initialAccount || "");
  }, [initialAccount]);

  useEffect(() => {
    if (!developmentVerificationCode) {
      return;
    }

    setCode((current) => current || developmentVerificationCode);
  }, [developmentVerificationCode]);

  useEffect(() => {
    if (enabledMethods.includes(method)) {
      return;
    }

    handleMethodChange(enabledMethods[0] || DEFAULT_SDKWORK_AUTH_RECOVERY_METHODS[0]);
  }, [enabledMethods, method]);

  const isAccountValid = method === "email"
    ? looksLikeEmailAddress(account)
    : looksLikePhoneNumber(account);

  const handleSendCode = async () => {
    if (!isAccountValid || isSendingCode) {
      return;
    }

    setIsSendingCode(true);

    try {
      await onRequestReset({
        account: account.trim(),
        channel: resolveSdkworkRecoveryChannel(method),
      });
      startCooldown();
      sdkToast.success(copy.toasts.resetCodeSent);
    } catch (error) {
      sdkToast.error(
        readSdkworkIdentityErrorMessage(error, copy.service.resetPasswordFailed),
      );
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const trimmedAccount = account.trim();
    const trimmedCode = code.trim();
    const nextErrors: SdkworkForgotPasswordFlowErrors = {};
    if (!trimmedAccount) {
      nextErrors.account = method === "email"
        ? copy.validation.emailRequired
        : copy.validation.phoneRequired;
    } else if (!isAccountValid) {
      nextErrors.account = method === "email"
        ? copy.validation.invalidEmail
        : copy.validation.invalidPhone;
    }
    if (!trimmedCode) {
      nextErrors.code = copy.validation.verificationCodeRequired;
    }
    if (!newPassword) {
      nextErrors.newPassword = copy.validation.newPasswordRequired;
    }
    if (!confirmPassword) {
      nextErrors.confirmPassword = copy.validation.confirmPasswordRequired;
    } else if (newPassword !== confirmPassword) {
      nextErrors.confirmPassword = copy.validation.passwordsDoNotMatch;
    }
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit({
        account: trimmedAccount,
        code: trimmedCode,
        confirmPassword,
        newPassword,
      });
      sdkToast.success(copy.toasts.passwordResetSuccess);
    } catch (error) {
      sdkToast.error(
        readSdkworkIdentityErrorMessage(error, copy.service.resetPasswordFailed),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {enabledMethods.length > 1 ? (
        <SdkworkAuthMethodTabs
          items={enabledMethods.map((item) => ({
            icon: item === "email"
              ? <Mail className="h-4 w-4" />
              : <Smartphone className="h-4 w-4" />,
            label: item === "email" ? copy.forgot.emailMethod : copy.forgot.phoneMethod,
            value: item,
          }))}
          onChange={(value) => handleMethodChange(value as SdkworkAuthRecoveryMethod)}
          value={method}
        />
      ) : null}

      <form className="space-y-5" noValidate onSubmit={handleSubmit}>
        <div className="space-y-2">
          <Label className="text-[var(--sdkwork-auth-label-color)]" htmlFor="sdkwork-auth-forgot-account">
            {method === "email" ? copy.common.emailLabel : copy.common.phoneLabel}
          </Label>
          <div className="relative">
            {method === "phone" ? (
              <Smartphone className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--sdkwork-auth-icon-muted-color)]" />
            ) : (
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--sdkwork-auth-icon-muted-color)]" />
            )}
            <Input
              aria-describedby={errors.account ? "sdkwork-auth-forgot-account-error" : undefined}
              aria-invalid={errors.account ? true : undefined}
              autoComplete={method === "phone" ? "tel" : "email"}
              className={SDKWORK_AUTH_ICON_INPUT_CLASS_NAME}
              id="sdkwork-auth-forgot-account"
              style={SDKWORK_AUTH_INPUT_STYLE}
              onChange={(event) => {
                setAccount(event.target.value);
                setErrors((current) => ({
                  ...current,
                  account: undefined,
                }));
              }}
              placeholder={method === "phone" ? copy.common.phonePlaceholder : copy.common.emailPlaceholder}
              type={method === "phone" ? "tel" : "email"}
              value={account}
            />
          </div>
          <SdkworkAuthFieldError
            id="sdkwork-auth-forgot-account-error"
            message={errors.account}
          />
        </div>

        <SdkworkVerificationCodeField
          actionLabel={copy.forgot.startResetAction}
          disabled={!isAccountValid}
          isCoolingDown={isCoolingDown}
          isSending={isSendingCode}
          label={copy.common.recoveryCodeLabel}
          error={errors.code}
          errorId="sdkwork-auth-forgot-code-error"
          onAction={() => {
            void handleSendCode();
          }}
          onChange={(value) => {
            setCode(value);
            setErrors((current) => ({
              ...current,
              code: undefined,
            }));
          }}
          placeholder={copy.common.recoveryCodePlaceholder}
          remainingSeconds={remainingSeconds}
          resendLabel={copy.common.resendCode}
          value={code}
        />

        <SdkworkPasswordField
          autoComplete="new-password"
          error={errors.newPassword}
          errorId="sdkwork-auth-forgot-new-password-error"
          id="sdkwork-auth-forgot-new-password"
          label={copy.common.newPasswordLabel}
          onChange={(value) => {
            setNewPassword(value);
            setErrors((current) => ({
              ...current,
              newPassword: undefined,
              confirmPassword: current.confirmPassword === copy.validation.passwordsDoNotMatch
                ? undefined
                : current.confirmPassword,
            }));
          }}
          placeholder={copy.common.newPasswordPlaceholder}
          value={newPassword}
        />

        <SdkworkPasswordField
          autoComplete="new-password"
          error={errors.confirmPassword}
          errorId="sdkwork-auth-forgot-confirm-password-error"
          id="sdkwork-auth-forgot-confirm-password"
          label={copy.common.confirmPasswordLabel}
          onChange={(value) => {
            setConfirmPassword(value);
            setErrors((current) => ({
              ...current,
              confirmPassword: undefined,
            }));
          }}
          placeholder={copy.common.confirmPasswordPlaceholder}
          value={confirmPassword}
        />

        <Button
          className={SDKWORK_AUTH_PRIMARY_BUTTON_CLASS_NAME}
          loading={isSubmitting}
          style={SDKWORK_AUTH_PRIMARY_BUTTON_STYLE}
          type="submit"
        >
          {copy.forgot.submit}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
