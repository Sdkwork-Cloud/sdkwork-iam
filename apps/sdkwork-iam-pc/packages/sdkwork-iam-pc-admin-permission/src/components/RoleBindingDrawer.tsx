import {
  Button,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@sdkwork/ui-pc-react";

import type {
  SdkworkIamRole,
  SdkworkIamRoleBindingDraft,
  SdkworkIamRoleBindingDrawerCopy,
} from "../types/permission-admin-types";
import { CatalogField } from "./catalog-form";

/** Sentinel value representing "no role selected" (Radix Select items cannot
 *  carry an empty string value). */
const ROLE_SELECT_EMPTY = "__role_select_empty__";

/**
 * Shared role binding creation drawer used by the roles and authorization
 * workspaces. The active role can be pre-selected through `defaultRoleId`;
 * the caller owns the draft state so both surfaces keep one binding form.
 */
export function RoleBindingDrawer({
  busy,
  copy,
  defaultRoleId,
  draft,
  onDraftChange,
  onOpenChange,
  onSubmit,
  open,
  roles,
}: {
  busy: boolean;
  copy: SdkworkIamRoleBindingDrawerCopy;
  defaultRoleId?: string;
  draft: SdkworkIamRoleBindingDraft;
  onDraftChange: (draft: SdkworkIamRoleBindingDraft) => void;
  onOpenChange: (open: boolean) => void;
  onSubmit: () => void;
  open: boolean;
  roles: readonly SdkworkIamRole[];
}) {
  const set = (patch: Partial<SdkworkIamRoleBindingDraft>) => onDraftChange({ ...draft, ...patch });
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent size="md">
        <DrawerHeader>
          <DrawerTitle>{copy.createTitle}</DrawerTitle>
          <DrawerDescription>{copy.createDescription}</DrawerDescription>
        </DrawerHeader>
        <DrawerBody className="space-y-4">
          <label className="block space-y-2 text-sm">
            <span>{copy.role}</span>
            <Select
              onValueChange={(next) => set({ roleId: next === ROLE_SELECT_EMPTY ? "" : next })}
              value={draft.roleId || defaultRoleId || ROLE_SELECT_EMPTY}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ROLE_SELECT_EMPTY}>{copy.role}</SelectItem>
                {roles.map((role) => (
                  <SelectItem key={role.roleId} value={role.roleId}>
                    {role.name} ({role.code || role.roleId})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
          <EnumSelectField
            label={copy.principalKind}
            onChange={(principalKind) => set({ principalKind })}
            options={Object.entries(copy.principalKinds)}
            value={draft.principalKind}
          />
          <CatalogField
            label={copy.principalId}
            onChange={(principalId) => set({ principalId })}
            value={draft.principalId}
          />
          <EnumSelectField
            label={copy.scopeKind}
            onChange={(scopeKind) => set({ scopeKind })}
            options={Object.entries(copy.scopeKinds)}
            value={draft.scopeKind}
          />
          <CatalogField
            label={copy.scopeId}
            onChange={(scopeId) => set({ scopeId })}
            value={draft.scopeId}
          />
          <EnumSelectField
            label={copy.effect}
            onChange={(effect) => set({ effect })}
            options={Object.entries(copy.effects)}
            value={draft.effect ?? ""}
          />
        </DrawerBody>
        <DrawerFooter>
          <Button disabled={busy} onClick={() => onOpenChange(false)} type="button" variant="secondary">
            {copy.cancel}
          </Button>
          <Button
            disabled={busy || !draft.roleId || !draft.principalId.trim() || !draft.scopeId.trim()}
            loading={busy}
            onClick={onSubmit}
            type="button"
          >
            {copy.save}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

function EnumSelectField({ label, onChange, options, value }: { label: string; onChange: (value: string) => void; options: Array<[string, string]>; value: string }) {
  return (
    <label className="block space-y-2 text-sm">
      <span>{label}</span>
      <Select onValueChange={onChange} value={value}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          {options.map(([optionValue, optionLabel]) => <SelectItem key={optionValue} value={optionValue}>{optionLabel}</SelectItem>)}
        </SelectContent>
      </Select>
    </label>
  );
}
