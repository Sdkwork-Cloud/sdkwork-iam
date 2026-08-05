/**
 * Shared form primitives for the IAM permission administration workspaces.
 *
 * Roles, permissions, policies, and authorization pages keep their localized
 * copy in their own workspace dictionaries; these primitives only carry the
 * value binding so every catalog drawer renders with the same field styling.
 */
export function CatalogField({
  disabled,
  hint,
  label,
  onChange,
  placeholder,
  value,
}: {
  disabled?: boolean;
  hint?: string;
  label: string;
  onChange: (value: string) => void;
  placeholder?: string;
  value: string;
}) {
  return (
    <label className="block space-y-2 text-sm">
      <span>{label}</span>
      <input
        className="w-full rounded-[0.75rem] border border-[var(--sdk-color-border-default)] bg-transparent px-3 py-2"
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        value={value}
      />
      {hint ? <span className="block text-xs text-[var(--sdk-color-text-muted)]">{hint}</span> : null}
    </label>
  );
}

export function CatalogSelect({
  label,
  onChange,
  options,
  placeholder,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  options: ReadonlyArray<{ label: string; value: string }>;
  placeholder?: string;
  value: string;
}) {
  return (
    <label className="block space-y-2 text-sm">
      <span>{label}</span>
      <select
        className="w-full rounded-[0.75rem] border border-[var(--sdk-color-border-default)] bg-transparent px-3 py-2"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {placeholder ? <option value="">{placeholder}</option> : null}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function toErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export function formatMessage(template: string, values: Record<string, string | number>) {
  return Object.entries(values).reduce(
    (result, [key, value]) => result.replaceAll(`{${key}}`, String(value)),
    template,
  );
}
