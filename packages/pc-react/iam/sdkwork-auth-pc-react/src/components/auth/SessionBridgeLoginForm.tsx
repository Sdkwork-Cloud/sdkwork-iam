import {
  useEffect,
  useState,
  type FormEvent,
} from "react";
import {
  ArrowRight,
  Mail,
  UserCircle2,
} from "lucide-react";
import {
  Button,
  Input,
  Label,
  sdkToast,
} from "@sdkwork/ui-pc-react";
import { coalesce, defaultIfBlank } from "@sdkwork/utils";
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

interface SdkworkSessionBridgeLoginFormErrors {
  bridgeToken?: string;
  email?: string;
}

export interface SdkworkSessionBridgeLoginFormProps {
  bridgeToken?: string;
  initialEmail?: string;
  initialName?: string;
  onSubmit(payload: {
    bridgeToken?: string;
    email: string;
    name?: string;
  }): Promise<void>;
}

export function SdkworkSessionBridgeLoginForm({
  bridgeToken,
  initialEmail,
  initialName,
  onSubmit,
}: SdkworkSessionBridgeLoginFormProps) {
  const { copy } = useSdkworkAuthIntl();
  const [email, setEmail] = useState(initialEmail || "");
  const [errors, setErrors] = useState<SdkworkSessionBridgeLoginFormErrors>({});
  const [name, setName] = useState(initialName || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setEmail(initialEmail || "");
  }, [initialEmail]);

  useEffect(() => {
    setName(initialName || "");
  }, [initialName]);

  const isEmailValid = looksLikeEmailAddress(email);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const trimmedEmail = email.trim();
    const trimmedBridgeToken = defaultIfBlank(bridgeToken, "");
    const nextErrors: SdkworkSessionBridgeLoginFormErrors = {};
    if (!trimmedBridgeToken) {
      nextErrors.bridgeToken = copy.service.signInFailed;
    }
    if (!trimmedEmail) {
      nextErrors.email = copy.validation.emailRequired;
    } else if (!isEmailValid) {
      nextErrors.email = copy.validation.invalidEmail;
    }
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit({
        bridgeToken: trimmedBridgeToken,
        email: trimmedEmail,
        name: coalesce(name),
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
        <Label className="text-[var(--sdkwork-auth-label-color)]" htmlFor="sdkwork-auth-session-bridge-email">
          {copy.common.emailLabel}
        </Label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--sdkwork-auth-icon-muted-color)]" />
          <Input
            aria-describedby={errors.email ? "sdkwork-auth-session-bridge-email-error" : undefined}
            aria-invalid={errors.email ? true : undefined}
            autoComplete="email"
            className={SDKWORK_AUTH_ICON_INPUT_CLASS_NAME}
            id="sdkwork-auth-session-bridge-email"
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
          id="sdkwork-auth-session-bridge-email-error"
          message={errors.email}
        />
      </div>

      <div className="space-y-2">
        <Label className="text-[var(--sdkwork-auth-label-color)]">{copy.common.usernameLabel}</Label>
        <div className="relative">
          <UserCircle2 className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--sdkwork-auth-icon-muted-color)]" />
          <Input
            autoComplete="nickname"
            className={SDKWORK_AUTH_ICON_INPUT_CLASS_NAME}
            onChange={(event) => setName(event.target.value)}
            placeholder={copy.common.usernamePlaceholder}
            style={SDKWORK_AUTH_INPUT_STYLE}
            type="text"
            value={name}
          />
        </div>
      </div>

      <Button
        className={SDKWORK_AUTH_PRIMARY_BUTTON_CLASS_NAME}
        loading={isSubmitting}
        style={SDKWORK_AUTH_PRIMARY_BUTTON_STYLE}
        type="submit"
      >
        {copy.login.sessionBridgeSubmit}
        <ArrowRight className="h-4 w-4" />
      </Button>
    </form>
  );
}
