/**
 * Shared form primitives for the IAM permission administration workspaces.
 *
 * Roles, permissions, policies, and authorization pages keep their localized
 * copy in their own workspace dictionaries; these primitives only carry the
 * value binding so every catalog drawer renders with the same field styling.
 */
import {
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@sdkwork/ui-pc-react";

/** Sentinel value representing "no selection" for CatalogSelect (Radix Select
 *  items cannot carry an empty string value). */
const CATALOG_SELECT_EMPTY = "__catalog_select_empty__";

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
      <Input
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
      <Select
        onValueChange={(next) => onChange(next === CATALOG_SELECT_EMPTY ? "" : next)}
        value={value || CATALOG_SELECT_EMPTY}
      >
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {placeholder ? <SelectItem value={CATALOG_SELECT_EMPTY}>{placeholder}</SelectItem> : null}
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
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
