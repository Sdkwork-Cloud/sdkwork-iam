import { Button } from "@sdkwork/ui-pc-react";
import type { SdkWorkPageInfo } from "@sdkwork/iam-contracts";
import { SdkworkIamListPaginationControls } from "@sdkwork/iam-pc-admin-core";

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

function syncAfterMutation(onChanged: () => void) {
  onChanged();
}

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
  if (items.length === 0) {
    return (
      <>
        <p className="text-sm text-[var(--sdk-color-text-muted)]">{emptyLabel}</p>
        <SdkworkIamListPaginationControls
          busy={disabled}
          onLoadMore={onLoadMore}
          pageInfo={pageInfo}
        />
      </>
    );
  }

  return (
    <>
    <ul className="space-y-2">
      {items.map((item, index) => {
        const resourceId = readId(item);
        const enabled = readEnabled(item);
        const status = readStatus(item);
        const hasStatus = status.length > 0;
        const statusIsActive = status === "active";
        return (
          <li
            className="flex flex-wrap items-center justify-between gap-3 rounded-[0.75rem] border border-[var(--sdk-color-border-default)] px-3 py-2 text-sm"
            key={resourceId || readResourceKey(item, index)}
          >
            <span>{formatResourceLabel(item)}</span>
            <div className="flex flex-wrap gap-2">
              {toggleEnabled ? (
                <Button
                  disabled={disabled || !resourceId || enabled === undefined}
                  onClick={() => {
                    if (!resourceId || enabled === undefined) {
                      return;
                    }
                    void toggleEnabled(resourceId, !enabled)
                      .then(() => syncAfterMutation(onChanged))
                      .catch(() => syncAfterMutation(onChanged));
                  }}
                  type="button"
                >
                  {enabled ? "Disable" : "Enable"}
                </Button>
              ) : null}
              {toggleStatus && hasStatus ? (
                <Button
                  disabled={disabled || !resourceId}
                  onClick={() => {
                    if (!resourceId) {
                      return;
                    }
                    void toggleStatus(resourceId, !statusIsActive)
                      .then(() => syncAfterMutation(onChanged))
                      .catch(() => syncAfterMutation(onChanged));
                  }}
                  type="button"
                >
                  {statusIsActive ? "Deactivate" : "Activate"}
                </Button>
              ) : null}
              {actions.map((action) => (
                <Button
                  disabled={disabled || !resourceId}
                  key={action.label}
                  onClick={() => {
                    if (!resourceId) {
                      return;
                    }
                    if (action.confirmMessage && !window.confirm(action.confirmMessage)) {
                      return;
                    }
                    void action.onAction(resourceId)
                      .then(() => syncAfterMutation(onChanged))
                      .catch(() => syncAfterMutation(onChanged));
                  }}
                  type="button"
                >
                  {action.label}
                </Button>
              ))}
              {onDelete ? (
                <Button
                  disabled={disabled || !resourceId}
                  onClick={() => {
                    if (!resourceId) {
                      return;
                    }
                    if (confirmDeleteMessage && !window.confirm(confirmDeleteMessage)) {
                      return;
                    }
                    void onDelete(resourceId)
                      .then(() => syncAfterMutation(onChanged))
                      .catch(() => syncAfterMutation(onChanged));
                  }}
                  type="button"
                >
                  Delete
                </Button>
              ) : null}
            </div>
          </li>
        );
      })}
    </ul>
    <SdkworkIamListPaginationControls
      busy={disabled}
      onLoadMore={onLoadMore}
      pageInfo={pageInfo}
    />
  </>
  );
}
