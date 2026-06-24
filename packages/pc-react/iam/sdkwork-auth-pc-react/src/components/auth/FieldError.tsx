export interface SdkworkAuthFieldErrorProps {
  id?: string;
  message?: string;
}

export function SdkworkAuthFieldError({
  id,
  message,
}: SdkworkAuthFieldErrorProps) {
  if (!message) {
    return null;
  }

  return (
    <p
      className="text-xs font-medium text-[var(--sdkwork-auth-validation-message-color,#b45309)]"
      id={id}
      role="alert"
    >
      {message}
    </p>
  );
}
