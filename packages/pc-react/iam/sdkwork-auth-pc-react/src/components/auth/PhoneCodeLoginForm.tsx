import {
  useEffect,
  useState,
  type FormEvent,
} from "react";
import {
  ArrowRight,
  Smartphone,
} from "lucide-react";
import {
  Button,
  Input,
  Label,
  sdkToast,
} from "@sdkwork/ui-pc-react";
import {
  looksLikePhoneNumber,
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

interface SdkworkPhoneCodeLoginFormErrors {
  code?: string;
  phone?: string;
}

export interface SdkworkPhoneCodeLoginFormProps {
  developmentVerificationCode?: string;
  initialPhone?: string;
  onSendCode(phone: string): Promise<void>;
  onSubmit(payload: {
    code: string;
    phone: string;
  }): Promise<void>;
}

export function SdkworkPhoneCodeLoginForm({
  developmentVerificationCode,
  initialPhone,
  onSendCode,
  onSubmit,
}: SdkworkPhoneCodeLoginFormProps) {
  const { copy } = useSdkworkAuthIntl();
  const [phone, setPhone] = useState(initialPhone || "");
  const [code, setCode] = useState("");
  const [errors, setErrors] = useState<SdkworkPhoneCodeLoginFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const { isCoolingDown, remainingSeconds, startCooldown } = useSdkworkActionCooldown();
  const isPhoneValid = looksLikePhoneNumber(phone);

  useEffect(() => {
    setPhone(initialPhone || "");
  }, [initialPhone]);

  useEffect(() => {
    if (!developmentVerificationCode) {
      return;
    }

    setCode((current) => current || developmentVerificationCode);
  }, [developmentVerificationCode]);

  const handleSendCode = async () => {
    if (!isPhoneValid || isSendingCode) {
      return;
    }

    setIsSendingCode(true);

    try {
      await onSendCode(phone.trim());
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

    const trimmedPhone = phone.trim();
    const trimmedCode = code.trim();
    const nextErrors: SdkworkPhoneCodeLoginFormErrors = {};
    if (!trimmedPhone) {
      nextErrors.phone = copy.validation.phoneRequired;
    } else if (!isPhoneValid) {
      nextErrors.phone = copy.validation.invalidPhone;
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
        phone: trimmedPhone,
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
        <Label className="text-[var(--sdkwork-auth-label-color)]" htmlFor="sdkwork-auth-phone-code-phone">
          {copy.common.phoneLabel}
        </Label>
        <div className="relative">
          <Smartphone className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--sdkwork-auth-icon-muted-color)]" />
          <Input
            aria-describedby={errors.phone ? "sdkwork-auth-phone-code-phone-error" : undefined}
            aria-invalid={errors.phone ? true : undefined}
            autoComplete="tel"
            className={SDKWORK_AUTH_ICON_INPUT_CLASS_NAME}
            id="sdkwork-auth-phone-code-phone"
            style={SDKWORK_AUTH_INPUT_STYLE}
            onChange={(event) => {
              setPhone(event.target.value);
              setErrors((current) => ({
                ...current,
                phone: undefined,
              }));
            }}
            placeholder={copy.common.phonePlaceholder}
            type="tel"
            value={phone}
          />
        </div>
        <SdkworkAuthFieldError
          id="sdkwork-auth-phone-code-phone-error"
          message={errors.phone}
        />
      </div>

      <SdkworkVerificationCodeField
        actionLabel={copy.common.sendCode}
        disabled={!isPhoneValid}
        isCoolingDown={isCoolingDown}
        isSending={isSendingCode}
        label={copy.common.verificationCodeLabel}
        error={errors.code}
        errorId="sdkwork-auth-phone-code-error"
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
