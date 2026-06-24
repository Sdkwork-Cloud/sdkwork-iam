import {
  useEffect,
  useState,
  type FormEvent,
} from "react";
import {
  ArrowRight,
  UserCircle2,
} from "lucide-react";
import {
  Button,
  Input,
  Label,
  sdkToast,
} from "@sdkwork/ui-pc-react";
import { isBlank } from "@sdkwork/utils";
import { readSdkworkIdentityErrorMessage } from "../../auth-config.ts";
import { useSdkworkAuthIntl } from "../../auth-intl.tsx";
import { SdkworkAuthFieldError } from "./FieldError.tsx";
import { SdkworkPasswordField } from "./PasswordField.tsx";
import {
  SDKWORK_AUTH_ICON_INPUT_CLASS_NAME,
  SDKWORK_AUTH_PRIMARY_BUTTON_CLASS_NAME,
  SDKWORK_AUTH_INPUT_STYLE,
  SDKWORK_AUTH_PRIMARY_BUTTON_STYLE,
} from "./form-control-styles.ts";

interface SdkworkAccountPasswordLoginFormErrors {
  account?: string;
  password?: string;
}

export interface SdkworkAccountPasswordLoginFormProps {
  initialAccount?: string;
  initialPassword?: string;
  onSubmit(payload: {
    account: string;
    password: string;
  }): Promise<void>;
}

export function SdkworkAccountPasswordLoginForm({
  initialAccount,
  initialPassword,
  onSubmit,
}: SdkworkAccountPasswordLoginFormProps) {
  const { copy } = useSdkworkAuthIntl();
  const [account, setAccount] = useState(initialAccount || "");
  const [password, setPassword] = useState(initialPassword || "");
  const [errors, setErrors] = useState<SdkworkAccountPasswordLoginFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setAccount(initialAccount || "");
  }, [initialAccount]);

  useEffect(() => {
    setPassword(initialPassword || "");
  }, [initialPassword]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const nextErrors: SdkworkAccountPasswordLoginFormErrors = {};
    if (isBlank(account)) {
      nextErrors.account = copy.validation.accountRequired;
    }
    if (!password) {
      nextErrors.password = copy.validation.passwordRequired;
    }
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit({
        account: account.trim(),
        password,
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
        <Label className="text-[var(--sdkwork-auth-label-color)]" htmlFor="sdkwork-auth-account">
          {copy.common.accountLabel}
        </Label>
        <div className="relative">
          <UserCircle2 className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--sdkwork-auth-icon-muted-color)]" />
          <Input
            aria-describedby={errors.account ? "sdkwork-auth-account-error" : undefined}
            aria-invalid={errors.account ? true : undefined}
            autoComplete="username"
            className={SDKWORK_AUTH_ICON_INPUT_CLASS_NAME}
            id="sdkwork-auth-account"
            style={SDKWORK_AUTH_INPUT_STYLE}
            onChange={(event) => {
              setAccount(event.target.value);
              setErrors((current) => ({
                ...current,
                account: undefined,
              }));
            }}
            placeholder={copy.common.accountPlaceholder}
            type="text"
            value={account}
          />
        </div>
        <SdkworkAuthFieldError
          id="sdkwork-auth-account-error"
          message={errors.account}
        />
      </div>

      <SdkworkPasswordField
        autoComplete="current-password"
        error={errors.password}
        errorId="sdkwork-auth-password-error"
        id="sdkwork-auth-password"
        label={copy.common.passwordLabel}
        onChange={(value) => {
          setPassword(value);
          setErrors((current) => ({
            ...current,
            password: undefined,
          }));
        }}
        placeholder={copy.common.passwordPlaceholder}
        value={password}
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
