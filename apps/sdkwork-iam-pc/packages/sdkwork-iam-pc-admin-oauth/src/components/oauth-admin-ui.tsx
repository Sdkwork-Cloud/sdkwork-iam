import { useState, type ReactNode } from "react";
import {
  Button,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  Input,
  Label,
  StatusNotice,
  Textarea,
} from "@sdkwork/ui-pc-react";

import { useSdkworkIamOauthAdminMessages } from "../i18n";
import { formatResourceDetail } from "../utils/oauth-admin-utils";

const OAUTH_CONTROL_CLASS_NAME =
  "w-full rounded-[0.75rem] border border-[var(--sdk-color-border-default)] bg-transparent px-3 py-2 text-sm";

export function OauthAdminField({
  disabled,
  label,
  onChange,
  placeholder,
  type = "text",
  value,
}: {
  disabled?: boolean;
  label: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: "password" | "text" | "url";
  value: string;
}) {
  return (
    <label className="block space-y-1.5 text-sm">
      <span className="font-medium text-[var(--sdk-color-text-primary)]">{label}</span>
      <Input
        autoComplete={type === "password" ? "new-password" : undefined}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        type={type}
        value={value}
      />
    </label>
  );
}

export function OauthAdminMultilineField({
  label,
  onChange,
  placeholder,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  placeholder?: string;
  value: string;
}) {
  return (
    <label className="block space-y-1.5 text-sm">
      <span className="font-medium text-[var(--sdk-color-text-primary)]">{label}</span>
      <Textarea
        className="min-h-[5rem]"
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        value={value}
      />
    </label>
  );
}

export function OauthAdminSelectField({
  label,
  onChange,
  options,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  options: Array<{ label: string; value: string }>;
  value: string;
}) {
  return (
    <label className="block space-y-1.5 text-sm">
      <span className="font-medium text-[var(--sdk-color-text-primary)]">{label}</span>
      <select
        className={OAUTH_CONTROL_CLASS_NAME}
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function OauthResourceDrawer({
  cancelLabel,
  children,
  className,
  confirmDisabled = false,
  confirmLabel,
  confirmLoading = false,
  description,
  onCancel,
  onConfirm,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  side = "right",
  size = "md",
  triggerLabel,
  width,
}: {
  cancelLabel?: string;
  children: ReactNode;
  className?: string;
  confirmDisabled?: boolean;
  confirmLabel: string;
  confirmLoading?: boolean;
  description: string;
  onCancel?: () => void;
  onConfirm: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  side?: "left" | "right";
  size?: "sm" | "md" | "lg" | "xl" | "full";
  triggerLabel: string;
  width?: string;
}) {
  const messages = useSdkworkIamOauthAdminMessages();
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = controlledOpen ?? internalOpen;
  const setOpen = (nextOpen: boolean) => {
    if (controlledOnOpenChange) {
      controlledOnOpenChange(nextOpen);
    }
    if (!isControlled) {
      setInternalOpen(nextOpen);
    }
  };
  const handleCancel = () => {
    onCancel?.();
    setOpen(false);
  };
  return (
    <div className="mt-4">
      {isControlled ? null : (
        <Button onClick={() => setOpen(true)} type="button">{triggerLabel}</Button>
      )}
      <Drawer open={open} onOpenChange={setOpen}>
        {/* An explicit width keeps the drawer size constant across tab
            switches instead of relying on class merging with the size preset. */}
        <DrawerContent className={className} side={side} size={size} style={width ? { width } : undefined}>
          <DrawerHeader>
            <DrawerTitle>{triggerLabel}</DrawerTitle>
            <DrawerDescription>{description}</DrawerDescription>
          </DrawerHeader>
          <DrawerBody className="space-y-4">{children}</DrawerBody>
          <DrawerFooter>
            <Button disabled={confirmLoading} onClick={handleCancel} type="button" variant="secondary">
              {cancelLabel ?? messages.common.cancel}
            </Button>
            <Button
              disabled={confirmDisabled || confirmLoading}
              loading={confirmLoading}
              onClick={onConfirm}
              type="button"
            >
              {confirmLabel}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
}

/**
 * Page-level error banner and last retrieved resource detail. Shared by every
 * composed admin page so the surface keeps one status presentation.
 */
export function OauthPageStatus({
  error,
  resourceDetail,
}: {
  error?: string;
  resourceDetail?: { detail: unknown; label: string };
}) {
  return (
    <>
      {error ? <StatusNotice tone="danger">{error}</StatusNotice> : null}
      {resourceDetail ? (
        <OauthResourceDetailBlock detail={resourceDetail.detail} label={resourceDetail.label} />
      ) : null}
    </>
  );
}

export function OauthResourceDetailBlock({
  detail,
  label,
}: {
  detail: unknown;
  label: string;
}) {
  const messages = useSdkworkIamOauthAdminMessages();
  return (
    <div className="space-y-2">
      <Label>{messages.settings.detailLabelTemplate.replace("{label}", label)}</Label>
      <pre className="max-h-80 overflow-auto rounded-[0.75rem] border border-[var(--sdk-color-border-default)] bg-[var(--sdk-color-surface-muted)] p-3 text-xs">
        {formatResourceDetail(detail)}
      </pre>
    </div>
  );
}
