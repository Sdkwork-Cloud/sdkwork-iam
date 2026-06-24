import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import {
  ArrowRight,
  Mail,
  Smartphone,
  UserCircle2,
} from "lucide-react";
import {
  Button,
  Input,
  Label,
  sdkToast,
} from "@sdkwork/ui-pc-react";
import { isBlank } from "@sdkwork/utils";
import {
  DEFAULT_SDKWORK_AUTH_REGISTER_METHODS,
  looksLikeEmailAddress,
  looksLikePhoneNumber,
  readSdkworkIdentityErrorMessage,
  resolveSdkworkAuthRegisterMethods,
  type SdkworkAuthRegisterMethod,
  type SdkworkAuthResolvedVerificationPolicy,
} from "../../auth-config.ts";
import type { SdkworkAuthRegisterInput } from "../../auth-service.ts";
import {
  SdkworkAuthOrganizationSelectionRequiredError,
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

interface SdkworkRegisterFlowErrors {
  confirmPassword?: string;
  email?: string;
  password?: string;
  phone?: string;
  username?: string;
  verificationCode?: string;
}

export interface SdkworkRegisterFlowProps {
  developmentVerificationCode?: string;
  methods?: SdkworkAuthRegisterMethod[];
  onSendCode(payload: {
    method: SdkworkAuthRegisterMethod;
    target: string;
  }): Promise<void>;
  onSubmit(payload: SdkworkAuthRegisterInput): Promise<void | false>;
  verificationPolicy?: Pick<
    SdkworkAuthResolvedVerificationPolicy,
    "emailRegistrationVerificationRequired" | "phoneRegistrationVerificationRequired"
  >;
}

export function SdkworkRegisterFlow({
  developmentVerificationCode,
  methods,
  onSendCode,
  onSubmit,
  verificationPolicy,
}: SdkworkRegisterFlowProps) {
  const { copy } = useSdkworkAuthIntl();
  const enabledMethods = resolveSdkworkAuthRegisterMethods(methods);
  const [method, setMethod] = useState<SdkworkAuthRegisterMethod>("email");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [errors, setErrors] = useState<SdkworkRegisterFlowErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSubmittingRef = useRef(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const { isCoolingDown, remainingSeconds, resetCooldown, startCooldown } = useSdkworkActionCooldown();
  const isRegisterVerificationRequired = (candidate: SdkworkAuthRegisterMethod) =>
    candidate === "email"
      ? Boolean(verificationPolicy?.emailRegistrationVerificationRequired)
      : Boolean(verificationPolicy?.phoneRegistrationVerificationRequired);

  const handleMethodChange = (nextMethod: SdkworkAuthRegisterMethod) => {
    if (nextMethod === method) {
      return;
    }

    setMethod(nextMethod);
    setVerificationCode(
      isRegisterVerificationRequired(nextMethod) ? developmentVerificationCode || "" : "",
    );
    setErrors({});
    setIsSendingCode(false);
    resetCooldown();
  };

  const isVerificationRequired = isRegisterVerificationRequired(method);

  useEffect(() => {
    if (!isVerificationRequired) {
      setVerificationCode("");
      return;
    }

    if (!developmentVerificationCode) {
      return;
    }

    setVerificationCode((current) => current || developmentVerificationCode);
  }, [developmentVerificationCode, isVerificationRequired]);

  useEffect(() => {
    if (enabledMethods.includes(method)) {
      return;
    }

    handleMethodChange(enabledMethods[0] || DEFAULT_SDKWORK_AUTH_REGISTER_METHODS[0]);
  }, [enabledMethods, method]);

  const target = method === "email" ? email.trim() : phone.trim();
  const isTargetValid = method === "email"
    ? looksLikeEmailAddress(email)
    : looksLikePhoneNumber(phone);

  const handleSendCode = async () => {
    if (!isVerificationRequired || !isTargetValid || isSendingCode) {
      return;
    }

    setIsSendingCode(true);

    try {
      await onSendCode({
        method,
        target,
      });
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

    if (isSubmittingRef.current || isSubmitting) {
      return;
    }

    const trimmedUsername = username.trim();
    const trimmedVerificationCode = verificationCode.trim();
    const nextErrors: SdkworkRegisterFlowErrors = {};
    if (!trimmedUsername) {
      nextErrors.username = copy.validation.usernameRequired;
    }
    if (method === "email") {
      if (isBlank(email)) {
        nextErrors.email = copy.validation.emailRequired;
      } else if (!isTargetValid) {
        nextErrors.email = copy.validation.invalidEmail;
      }
    } else if (isBlank(phone)) {
      nextErrors.phone = copy.validation.phoneRequired;
    } else if (!isTargetValid) {
      nextErrors.phone = copy.validation.invalidPhone;
    }
    if (isVerificationRequired && !trimmedVerificationCode) {
      nextErrors.verificationCode = copy.validation.verificationCodeRequired;
    }
    if (!password) {
      nextErrors.password = copy.validation.passwordRequired;
    }
    if (!confirmPassword) {
      nextErrors.confirmPassword = copy.validation.confirmPasswordRequired;
    } else if (password !== confirmPassword) {
      nextErrors.confirmPassword = copy.validation.passwordsDoNotMatch;
    }
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    isSubmittingRef.current = true;
    setIsSubmitting(true);

    try {
      const completed = await onSubmit({
        channel: method === "email" ? "EMAIL" : "PHONE",
        confirmPassword,
        email: method === "email" ? email.trim() : undefined,
        password,
        phone: method === "phone" ? phone.trim() : undefined,
        username: trimmedUsername,
        ...(trimmedVerificationCode ? { verificationCode: trimmedVerificationCode } : {}),
      });
      if (completed === false) {
        return;
      }
      sdkToast.success(copy.toasts.registerSuccess);
    } catch (error) {
      if (error instanceof SdkworkAuthOrganizationSelectionRequiredError) {
        throw error;
      }
      sdkToast.error(
        readSdkworkIdentityErrorMessage(error, copy.service.registerFailed, {
          accountAlreadyExists: copy.service.accountAlreadyExists,
        }),
      );
    } finally {
      isSubmittingRef.current = false;
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
            label: item === "email" ? copy.register.emailMethod : copy.register.phoneMethod,
            value: item,
          }))}
          onChange={(value) => handleMethodChange(value as SdkworkAuthRegisterMethod)}
          value={method}
        />
      ) : null}

      <form className="space-y-5" noValidate onSubmit={handleSubmit}>
        <div className="space-y-2">
          <Label className="text-[var(--sdkwork-auth-label-color)]" htmlFor="sdkwork-auth-register-username">
            {copy.common.usernameLabel}
          </Label>
          <div className="relative">
            <UserCircle2 className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--sdkwork-auth-icon-muted-color)]" />
            <Input
              aria-describedby={errors.username ? "sdkwork-auth-register-username-error" : undefined}
              aria-invalid={errors.username ? true : undefined}
              autoComplete="username"
              className={SDKWORK_AUTH_ICON_INPUT_CLASS_NAME}
              id="sdkwork-auth-register-username"
              style={SDKWORK_AUTH_INPUT_STYLE}
              onChange={(event) => {
                setUsername(event.target.value);
                setErrors((current) => ({
                  ...current,
                  username: undefined,
                }));
              }}
              placeholder={copy.common.usernamePlaceholder}
              type="text"
              value={username}
            />
          </div>
          <SdkworkAuthFieldError
            id="sdkwork-auth-register-username-error"
            message={errors.username}
          />
        </div>

        {method === "email" ? (
          <div className="space-y-2">
            <Label className="text-[var(--sdkwork-auth-label-color)]" htmlFor="sdkwork-auth-register-email">
              {copy.common.emailLabel}
            </Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--sdkwork-auth-icon-muted-color)]" />
              <Input
                aria-describedby={errors.email ? "sdkwork-auth-register-email-error" : undefined}
                aria-invalid={errors.email ? true : undefined}
                autoComplete="email"
                className={SDKWORK_AUTH_ICON_INPUT_CLASS_NAME}
                id="sdkwork-auth-register-email"
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
              id="sdkwork-auth-register-email-error"
              message={errors.email}
            />
          </div>
        ) : (
          <div className="space-y-2">
            <Label className="text-[var(--sdkwork-auth-label-color)]" htmlFor="sdkwork-auth-register-phone">
              {copy.common.phoneLabel}
            </Label>
            <div className="relative">
              <Smartphone className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--sdkwork-auth-icon-muted-color)]" />
              <Input
                aria-describedby={errors.phone ? "sdkwork-auth-register-phone-error" : undefined}
                aria-invalid={errors.phone ? true : undefined}
                autoComplete="tel"
                className={SDKWORK_AUTH_ICON_INPUT_CLASS_NAME}
                id="sdkwork-auth-register-phone"
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
              id="sdkwork-auth-register-phone-error"
              message={errors.phone}
            />
          </div>
        )}

        {isVerificationRequired ? (
          <SdkworkVerificationCodeField
            actionLabel={copy.common.sendCode}
            disabled={!isTargetValid}
            isCoolingDown={isCoolingDown}
            isSending={isSendingCode}
            label={copy.common.verificationCodeLabel}
            error={errors.verificationCode}
            errorId="sdkwork-auth-register-verification-code-error"
            onAction={() => {
              void handleSendCode();
            }}
            onChange={(value) => {
              setVerificationCode(value);
              setErrors((current) => ({
                ...current,
                verificationCode: undefined,
              }));
            }}
            placeholder={copy.common.verificationCodePlaceholder}
            remainingSeconds={remainingSeconds}
            resendLabel={copy.common.resendCode}
            value={verificationCode}
          />
        ) : null}

        <SdkworkPasswordField
          autoComplete="new-password"
          error={errors.password}
          errorId="sdkwork-auth-register-password-error"
          id="sdkwork-auth-register-password"
          label={copy.common.passwordLabel}
          onChange={(value) => {
            setPassword(value);
            setErrors((current) => ({
              ...current,
              password: undefined,
              confirmPassword: current.confirmPassword === copy.validation.passwordsDoNotMatch
                ? undefined
                : current.confirmPassword,
            }));
          }}
          placeholder={copy.common.passwordPlaceholder}
          value={password}
        />

        <SdkworkPasswordField
          autoComplete="new-password"
          error={errors.confirmPassword}
          errorId="sdkwork-auth-register-confirm-password-error"
          id="sdkwork-auth-register-confirm-password"
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
          {copy.register.submit}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
