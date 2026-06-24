import { useState } from "react";
import {
  Eye,
  EyeOff,
  Lock,
} from "lucide-react";
import {
  Button,
  Input,
  Label,
} from "@sdkwork/ui-pc-react";
import { useSdkworkAuthIntl } from "../../auth-intl.tsx";
import { SdkworkAuthFieldError } from "./FieldError.tsx";
import {
  SDKWORK_AUTH_PASSWORD_INPUT_CLASS_NAME,
  SDKWORK_AUTH_PASSWORD_INPUT_STYLE,
  SDKWORK_AUTH_PASSWORD_CONTROL_SLOT_STYLE,
  SDKWORK_AUTH_PASSWORD_FRAME_CLASS_NAME,
  SDKWORK_AUTH_PASSWORD_FRAME_STYLE,
  SDKWORK_AUTH_PASSWORD_ICON_SLOT_CLASS_NAME,
  SDKWORK_AUTH_PASSWORD_ICON_SLOT_STYLE,
  SDKWORK_AUTH_PASSWORD_LEADING_ICON_CLASS_NAME,
  SDKWORK_AUTH_PASSWORD_LEADING_ICON_STYLE,
  SDKWORK_AUTH_PASSWORD_VISIBILITY_ICON_STYLE,
  SDKWORK_AUTH_PASSWORD_VISIBILITY_TOGGLE_CLASS_NAME,
  SDKWORK_AUTH_PASSWORD_VISIBILITY_TOGGLE_STYLE,
} from "./form-control-styles.ts";

export const SDKWORK_AUTH_PASSWORD_MAX_LENGTH = 64;

export interface SdkworkPasswordFieldProps {
  autoComplete?: string;
  error?: string;
  errorId?: string;
  id: string;
  label: string;
  maxLength?: number;
  onChange(value: string): void;
  placeholder?: string;
  value: string;
}

export function SdkworkPasswordField({
  autoComplete,
  error,
  errorId,
  id,
  label,
  maxLength = SDKWORK_AUTH_PASSWORD_MAX_LENGTH,
  onChange,
  placeholder,
  value,
}: SdkworkPasswordFieldProps) {
  const { copy } = useSdkworkAuthIntl();
  const [isVisible, setIsVisible] = useState(false);
  const toggleLabel = isVisible ? copy.common.hidePassword : copy.common.showPassword;

  return (
    <div className="space-y-2">
      <Label className="text-[var(--sdkwork-auth-label-color)]" htmlFor={id}>
        {label}
      </Label>
      <div
        className={SDKWORK_AUTH_PASSWORD_FRAME_CLASS_NAME}
        data-slot="password-input-frame"
        style={SDKWORK_AUTH_PASSWORD_FRAME_STYLE}
      >
        <span
          aria-hidden="true"
          className={SDKWORK_AUTH_PASSWORD_ICON_SLOT_CLASS_NAME}
          data-slot="password-input-leading-slot"
          style={SDKWORK_AUTH_PASSWORD_ICON_SLOT_STYLE}
        >
          <Lock
            aria-hidden="true"
            className={SDKWORK_AUTH_PASSWORD_LEADING_ICON_CLASS_NAME}
            data-slot="password-input-leading-icon"
            style={SDKWORK_AUTH_PASSWORD_LEADING_ICON_STYLE}
          />
        </span>
        <span
          data-slot="password-input-control-slot"
          style={SDKWORK_AUTH_PASSWORD_CONTROL_SLOT_STYLE}
        >
          <Input
            aria-describedby={error ? errorId : undefined}
            aria-invalid={error ? true : undefined}
            autoComplete={autoComplete}
            className={SDKWORK_AUTH_PASSWORD_INPUT_CLASS_NAME}
            data-sdkwork-auth-secret-field="true"
            id={id}
            maxLength={maxLength}
            style={SDKWORK_AUTH_PASSWORD_INPUT_STYLE}
            onChange={(event) => {
              onChange(event.target.value);
            }}
            placeholder={placeholder}
            type={isVisible ? "text" : "password"}
            value={value}
          />
        </span>
        <span
          className={SDKWORK_AUTH_PASSWORD_ICON_SLOT_CLASS_NAME}
          data-slot="password-input-visibility-slot"
          style={SDKWORK_AUTH_PASSWORD_ICON_SLOT_STYLE}
        >
          <Button
            aria-label={toggleLabel}
            className={SDKWORK_AUTH_PASSWORD_VISIBILITY_TOGGLE_CLASS_NAME}
            data-slot="password-input-visibility-toggle"
            onClick={() => {
              setIsVisible((current) => !current);
            }}
            style={SDKWORK_AUTH_PASSWORD_VISIBILITY_TOGGLE_STYLE}
            type="button"
            variant="ghost"
          >
            {isVisible ? (
              <EyeOff
                aria-hidden="true"
                className="h-4 w-4"
                data-slot="password-input-visibility-icon"
                style={SDKWORK_AUTH_PASSWORD_VISIBILITY_ICON_STYLE}
              />
            ) : (
              <Eye
                aria-hidden="true"
                className="h-4 w-4"
                data-slot="password-input-visibility-icon"
                style={SDKWORK_AUTH_PASSWORD_VISIBILITY_ICON_STYLE}
              />
            )}
          </Button>
        </span>
      </div>
      <SdkworkAuthFieldError
        id={errorId}
        message={error}
      />
    </div>
  );
}
