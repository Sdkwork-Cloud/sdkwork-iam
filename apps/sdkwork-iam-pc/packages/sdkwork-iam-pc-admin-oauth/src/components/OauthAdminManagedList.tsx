import { useMemo, useState } from "react";
import { CatalogPagination } from "@sdkwork/iam-pc-admin-core";
import type { SdkWorkPageInfo } from "@sdkwork/iam-contracts";
import {
  Button,
  ConfirmDialog,
  DataTable,
  type DataTableColumn,
  StatusBadge,
} from "@sdkwork/ui-pc-react";

import { useSdkworkIamOauthAdminMessages } from "../i18n";
import {
  formatResourceLabel,
  readEnabled,
  readResourceKey,
  readStatus,
  templateMessage,
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
  onPageChange?: (page: number, pageSize: number) => void | Promise<void>;
  onPageSizeChange?: (pageSize: number) => void | Promise<void>;
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
  onPageChange,
  onPageSizeChange,
  pageInfo,
  readId,
  toggleEnabled,
  toggleStatus,
}: ManagedOAuthResourceListProps) {
  const messages = useSdkworkIamOauthAdminMessages();
  const [pendingAction, setPendingAction] = useState<PendingAction>();
  const [actionBusy, setActionBusy] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const labelCopy = useMemo(() => ({
    disabled: messages.common.disabled,
    enabled: messages.common.enabled,
    resource: messages.common.resource,
    statuses: messages.common.statuses,
  }), [messages]);
  const rows = useMemo<ManagedRow[]>(() => items.map((item, index) => ({
    enabled: readEnabled(item),
    id: readId(item) || readResourceKey(item, index),
    item,
    label: formatResourceLabel(item, labelCopy),
    status: readStatus(item),
  })), [items, readId, labelCopy]);
  const columns = useMemo<DataTableColumn<ManagedRow>[]>(() => [
    { id: "resource", header: messages.common.resource, cell: (row) => row.label },
    {
      id: "status",
      header: messages.common.status,
      cell: (row) => {
        const status = row.status || (row.enabled === undefined ? "" : row.enabled ? messages.common.enabled : messages.common.disabled);
        return status ? <StatusBadge label={statusLabel(messages.common.statuses, status)} showIcon status={status} /> : messages.common.unconfiguredStatus;
      },
    },
  ], [messages]);

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
        emptyTitle={messages.common.noResourcesFound}
        footer={(
          <CatalogPagination
            busy={disabled || actionBusy}
            copy={{
              next: messages.pagination.next,
              pageSize: messages.pagination.pageSize,
              previous: messages.pagination.previous,
              total: messages.pagination.total,
            }}
            onPageChange={(nextPage) => {
              setPage(nextPage);
              void onPageChange?.(nextPage, pageSize);
            }}
            onPageSizeChange={(nextPageSize) => {
              setPageSize(nextPageSize);
              setPage(1);
              void onPageSizeChange?.(nextPageSize);
            }}
            pageInfo={pageInfo}
          />
        )}
        getRowId={(row) => row.id}
        loading={disabled}
        rowActions={(row) => {
          const resourceId = readId(row.item);
          const statusIsActive = row.status === "active";
          return <div className="flex flex-wrap gap-2">
            {toggleEnabled ? <Button disabled={disabled || actionBusy || !resourceId || row.enabled === undefined} onClick={() => { if (resourceId && row.enabled !== undefined) execute(() => toggleEnabled(resourceId, !row.enabled)); }} size="sm" type="button" variant="outline">{row.enabled ? messages.common.disable : messages.common.enable}</Button> : null}
            {toggleStatus && row.status ? <Button disabled={disabled || actionBusy || !resourceId} onClick={() => { if (resourceId) execute(() => toggleStatus(resourceId, !statusIsActive)); }} size="sm" type="button" variant="outline">{statusIsActive ? messages.common.deactivate : messages.common.activate}</Button> : null}
            {actions.map((action) => <Button disabled={disabled || actionBusy || !resourceId} key={action.label} onClick={() => { if (!resourceId) return; if (action.confirmMessage) setPendingAction({ label: action.label, message: action.confirmMessage, run: () => action.onAction(resourceId) }); else execute(() => action.onAction(resourceId)); }} size="sm" type="button" variant={action.confirmMessage ? "danger" : "outline"}>{action.label}</Button>)}
            {onDelete ? <Button disabled={disabled || actionBusy || !resourceId} onClick={() => { if (!resourceId) return; if (confirmDeleteMessage) setPendingAction({ label: messages.common.delete, message: confirmDeleteMessage, run: () => onDelete(resourceId) }); else execute(() => onDelete(resourceId)); }} size="sm" type="button" variant="danger">{messages.common.delete}</Button> : null}
          </div>;
        }}
        rows={rows}
        slotProps={{
          surface: { className: "flex min-h-0 flex-col" },
          viewport: { className: "min-h-0 flex-1 max-h-[24rem]" },
          footer: { className: "shrink-0" },
        }}
        stickyHeader
      />
      <ConfirmDialog
        closeOnConfirm={false}
        confirmLabel={pendingAction?.label ?? messages.common.confirm}
        confirmLoading={actionBusy}
        description={pendingAction?.message}
        onConfirm={() => { if (pendingAction) execute(pendingAction.run); }}
        onOpenChange={(open) => { if (!open && !actionBusy) setPendingAction(undefined); }}
        open={Boolean(pendingAction)}
        title={templateMessage(messages.managedList.dialogTitleTemplate, { label: pendingAction?.label ?? messages.common.confirm })}
        tone="danger"
      />
    </>
  );
}

function statusLabel(statuses: Record<string, string>, value: string) {
  const normalized = value.trim().toLowerCase();
  return statuses[normalized] ?? value;
}
