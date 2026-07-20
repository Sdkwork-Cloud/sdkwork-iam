import { useMemo, useState } from "react";
import { SdkworkIamListPaginationControls } from "@sdkwork/iam-pc-admin-core";
import type { SdkWorkPageInfo } from "@sdkwork/iam-contracts";
import {
  Button,
  ConfirmDialog,
  DataTable,
  type DataTableColumn,
  StatusBadge,
} from "@sdkwork/ui-pc-react";

import {
  formatResourceLabel,
  readEnabled,
  readResourceKey,
  readStatus,
} from "../utils/oauth-admin-utils";

export interface ManagedOAuthResourceAction {
  confirmMessage?: string;
  label: string;
  onAction: (resourceId: string) => Promise<unknown>;
}

export interface ManagedOAuthResourceListProps {
  confirmDeleteMessage?: string;
  disabled: boolean;
  emptyLabel: string;
  items: unknown[];
  onChanged: () => void;
  onLoadMore?: () => void | Promise<void>;
  pageInfo?: SdkWorkPageInfo;
  readId: (item: unknown) => string;
  actions?: ManagedOAuthResourceAction[];
  onDelete?: (resourceId: string) => Promise<unknown>;
  toggleEnabled?: (resourceId: string, enabled: boolean) => Promise<unknown>;
  toggleStatus?: (resourceId: string, active: boolean) => Promise<unknown>;
}

type ManagedRow = {
  enabled?: boolean;
  id: string;
  item: unknown;
  label: string;
  status: string;
};

type PendingAction = {
  label: string;
  message: string;
  run: () => Promise<unknown>;
};

export function ManagedOAuthResourceList({
  actions = [],
  confirmDeleteMessage,
  disabled,
  emptyLabel,
  items,
  onChanged,
  onDelete,
  onLoadMore,
  pageInfo,
  readId,
  toggleEnabled,
  toggleStatus,
}: ManagedOAuthResourceListProps) {
  const [pendingAction, setPendingAction] = useState<PendingAction>();
  const [actionBusy, setActionBusy] = useState(false);
  const rows = useMemo<ManagedRow[]>(() => items.map((item, index) => ({
    enabled: readEnabled(item),
    id: readId(item) || readResourceKey(item, index),
    item,
    label: formatResourceLabel(item),
    status: readStatus(item),
  })), [items, readId]);
  const columns = useMemo<DataTableColumn<ManagedRow>[]>(() => [
    { id: "resource", header: "Resource", cell: (row) => row.label },
    { id: "status", header: "Status", cell: (row) => { const status = row.status || (row.enabled === undefined ? "" : row.enabled ? "enabled" : "disabled"); return status ? <StatusBadge label={status} showIcon status={status} /> : "—"; } },
  ], []);

  const execute = (operation: () => Promise<unknown>) => {
    setActionBusy(true);
    void operation().catch(() => undefined).finally(() => {
      setActionBusy(false);
      setPendingAction(undefined);
      onChanged();
    });
  };

  return (
    <>
      <DataTable
        columns={columns}
        emptyDescription={emptyLabel}
        emptyTitle="No resources found"
        footer={<SdkworkIamListPaginationControls busy={disabled || actionBusy} onLoadMore={onLoadMore} pageInfo={pageInfo} />}
        getRowId={(row) => row.id}
        loading={disabled}
        rowActions={(row) => {
          const resourceId = readId(row.item);
          const statusIsActive = row.status === "active";
          return <div className="flex flex-wrap gap-2">
            {toggleEnabled ? <Button disabled={disabled || actionBusy || !resourceId || row.enabled === undefined} onClick={() => { if (resourceId && row.enabled !== undefined) execute(() => toggleEnabled(resourceId, !row.enabled)); }} size="sm" type="button" variant="outline">{row.enabled ? "Disable" : "Enable"}</Button> : null}
            {toggleStatus && row.status ? <Button disabled={disabled || actionBusy || !resourceId} onClick={() => { if (resourceId) execute(() => toggleStatus(resourceId, !statusIsActive)); }} size="sm" type="button" variant="outline">{statusIsActive ? "Deactivate" : "Activate"}</Button> : null}
            {actions.map((action) => <Button disabled={disabled || actionBusy || !resourceId} key={action.label} onClick={() => { if (!resourceId) return; if (action.confirmMessage) setPendingAction({ label: action.label, message: action.confirmMessage, run: () => action.onAction(resourceId) }); else execute(() => action.onAction(resourceId)); }} size="sm" type="button" variant={action.confirmMessage ? "danger" : "outline"}>{action.label}</Button>)}
            {onDelete ? <Button disabled={disabled || actionBusy || !resourceId} onClick={() => { if (!resourceId) return; if (confirmDeleteMessage) setPendingAction({ label: "Delete", message: confirmDeleteMessage, run: () => onDelete(resourceId) }); else execute(() => onDelete(resourceId)); }} size="sm" type="button" variant="danger">Delete</Button> : null}
          </div>;
        }}
        rows={rows}
      />
      <ConfirmDialog
        closeOnConfirm={false}
        confirmLabel={pendingAction?.label ?? "Confirm"}
        confirmLoading={actionBusy}
        description={pendingAction?.message}
        onConfirm={() => { if (pendingAction) execute(pendingAction.run); }}
        onOpenChange={(open) => { if (!open && !actionBusy) setPendingAction(undefined); }}
        open={Boolean(pendingAction)}
        title={`${pendingAction?.label ?? "Confirm"} OAuth resource`}
        tone="danger"
      />
    </>
  );
}
