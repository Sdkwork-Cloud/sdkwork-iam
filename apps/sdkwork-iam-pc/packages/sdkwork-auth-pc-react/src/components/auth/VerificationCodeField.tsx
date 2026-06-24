import { LoaderCircle } from "lucide-react";
import {
  Button,
  Input,
  Label,
} from "@sdkwork/ui-pc-react";
import { SdkworkAuthFieldError } from "./FieldError.tsx";
import {
  SDKWORK_AUTH_INPUT_CLASS_NAME,
  SDKWORK_AUTH_OUTLINE_BUTTON_CLASS_NAME,
  SDKWORK_AUTH_INPUT_STYLE,
  SDKWORK_AUTH_OUTLINE_BUTTON_STYLE,
} from "./form-control-styles.ts";

export interface SdkworkVerificationCodeFieldProps {
  actionLabel: string;
  error?: string;
  errorId?: string;
  autoComplete?: string;
  disabled?: boolean;
  isCoolingDown?: boolean;
  isSending?: boolean;
  label: string;
  onAction(): void;
  onChange(value: string): void;
  placeholder: string;
  remainingSeconds?: number;
  resendLabel: string;
  required?: boolean;
  value: string;
}

export function SdkworkVerificationCodeField({
  actionLabel,
  autoComplete = "one-time-code",
  disabled = false,
  error,
  errorId,
  isCoolingDown = false,
  isSending = false,
  label,
  onAction,
  onChange,
  placeholder,
  remainingSeconds = 0,
  resendLabel,
  required = false,
  value,
}: SdkworkVerificationCodeFieldProps) {
  const actionText = isCoolingDown
    ? `${resendLabel} (${remainingSeconds}s)`
    : actionLabel;

  return (
    <div className="space-y-2">
      <Label className="text-[var(--sdkwork-auth-label-color)]">{label}</Label>
      <div className="flex gap-3">
        <Input
          aria-describedby={error ? errorId : undefined}
          aria-invalid={error ? true : undefined}
          autoComplete={autoComplete}
          className={SDKWORK_AUTH_INPUT_CLASS_NAME}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          required={required}
          style={SDKWORK_AUTH_INPUT_STYLE}
          value={value}
        />
        <Button
          className={SDKWORK_AUTH_OUTLINE_BUTTON_CLASS_NAME}
          disabled={disabled || isSending || isCoolingDown}
          onClick={onAction}
          style={SDKWORK_AUTH_OUTLINE_BUTTON_STYLE}
          type="button"
          variant="ghost"
        >
          {isSending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
          {actionText}
        </Button>
      </div>
      <SdkworkAuthFieldError id={errorId} message={error} />
    </div>
  );
}
