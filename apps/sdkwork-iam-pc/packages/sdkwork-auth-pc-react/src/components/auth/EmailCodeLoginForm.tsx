import {
  useEffect,
  useState,
  type FormEvent,
} from "react";
import {
  ArrowRight,
  Mail,
} from "lucide-react";
import {
  Button,
  Input,
  Label,
  sdkToast,
} from "@sdkwork/ui-pc-react";
import {
  looksLikeEmailAddress,
  readSdkworkIdentityErrorMessage,
} from "../../auth-config.ts";
import { useSdkworkAuthIntl } from "../../auth-intl.tsx";
import { SdkworkAuthFieldError } from "./FieldError.tsx";
import {
  SDKWORK_AUTH_ICON_INPUT_CLASS_NAME,
  SDKWORK_AUTH_PRIMARY_BUTTON_CLASS_NAME,
  SDKWORK_AUTH_INPUT_STYLE,
  SDKWORK_AUTH_PRIMARY_BUTTON_STYLE,
} from "./form-control-styles.ts";
import { SdkworkVerificationCodeField } from "./VerificationCodeField.tsx";
import { useSdkworkActionCooldown } from "./useActionCooldown.ts";

interface SdkworkEmailCodeLoginFormErrors {
  code?: string;
  email?: string;
}

export interface SdkworkEmailCodeLoginFormProps {
  developmentVerificationCode?: string;
  initialEmail?: string;
  onSendCode(email: string): Promise<void>;
  onSubmit(payload: {
    code: string;
    email: string;
  }): Promise<void>;
}

export function SdkworkEmailCodeLoginForm({
  developmentVerificationCode,
  initialEmail,
  onSendCode,
  onSubmit,
}: SdkworkEmailCodeLoginFormProps) {
  const { copy } = useSdkworkAuthIntl();
  const [email, setEmail] = useState(initialEmail || "");
  const [code, setCode] = useState("");
  const [errors, setErrors] = useState<SdkworkEmailCodeLoginFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const { isCoolingDown, remainingSeconds, startCooldown } = useSdkworkActionCooldown();
  const isEmailValid = looksLikeEmailAddress(email);

  useEffect(() => {
    setEmail(initialEmail || "");
  }, [initialEmail]);

  useEffect(() => {
    if (!developmentVerificationCode) {
      return;
    }

    setCode((current) => current || developmentVerificationCode);
  }, [developmentVerificationCode]);

  const handleSendCode = async () => {
    if (!isEmailValid || isSendingCode) {
      return;
    }

    setIsSendingCode(true);

    try {
      await onSendCode(email.trim());
      startCooldown();
      sdkToast.success(copy.toasts.codeSent);
    } catch (error) {
      sdkToast.error(
        readSdkworkIdentityErrorMessage(error, copy.service.sendCodeFailed),
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

    const trimmedEmail = email.trim();
    const trimmedCode = code.trim();
    const nextErrors: SdkworkEmailCodeLoginFormErrors = {};
    if (!trimmedEmail) {
      nextErrors.email = copy.validation.emailRequired;
    } else if (!isEmailValid) {
      nextErrors.email = copy.validation.invalidEmail;
    }
    if (!trimmedCode) {
      nextErrors.code = copy.validation.verificationCodeRequired;
    }
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit({
        code: trimmedCode,
        email: trimmedEmail,
      });
    } catch (error) {
      sdkToast.error(
        readSdkworkIdentityErrorMessage(error, copy.service.signInFailed),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="space-y-5" noValidate onSubmit={handleSubmit}>
      <div className="space-y-2">
        <Label className="text-[var(--sdkwork-auth-label-color)]" htmlFor="sdkwork-auth-email-code-email">
          {copy.common.emailLabel}
        </Label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--sdkwork-auth-icon-muted-color)]" />
          <Input
            aria-describedby={errors.email ? "sdkwork-auth-email-code-email-error" : undefined}
            aria-invalid={errors.email ? true : undefined}
            autoComplete="email"
            className={SDKWORK_AUTH_ICON_INPUT_CLASS_NAME}
            id="sdkwork-auth-email-code-email"
            style={SDKWORK_AUTH_INPUT_STYLE}
            onChange={(event) => {
              setEmail(event.target.value);
              setErrors((current) => ({
                ...current,
                email: undefined,
              }));
            }}
            placeholder={copy.common.emailPlaceholder}
            type="email"
            value={email}
          />
        </div>
        <SdkworkAuthFieldError
          id="sdkwork-auth-email-code-email-error"
          message={errors.email}
        />
      </div>

      <SdkworkVerificationCodeField
        actionLabel={copy.common.sendCode}
        disabled={!isEmailValid}
        isCoolingDown={isCoolingDown}
        isSending={isSendingCode}
        label={copy.common.verificationCodeLabel}
        error={errors.code}
        errorId="sdkwork-auth-email-code-error"
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
        placeholder={copy.common.verificationCodePlaceholder}
        remainingSeconds={remainingSeconds}
        resendLabel={copy.common.resendCode}
        value={code}
      />

      <Button
        className={SDKWORK_AUTH_PRIMARY_BUTTON_CLASS_NAME}
        loading={isSubmitting}
        style={SDKWORK_AUTH_PRIMARY_BUTTON_STYLE}
        type="submit"
      >
        {copy.login.signIn}
        <ArrowRight className="h-4 w-4" />
      </Button>
    </form>
  );
}
