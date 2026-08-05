import type { SdkWorkPageInfo } from "@sdkwork/iam-contracts";
import { Button } from "@sdkwork/ui-pc-react";

export interface SdkworkIamListPaginationControlsCopy {
  loadMore: string;
  summary: string;
}

export interface SdkworkIamListPaginationControlsProps {
  busy?: boolean;
  copy?: SdkworkIamListPaginationControlsCopy;
  label?: string;
  onLoadMore?: () => void | Promise<void>;
  pageInfo?: SdkWorkPageInfo;
}

const DEFAULT_COPY: SdkworkIamListPaginationControlsCopy = {
  loadMore: "Load more",
  summary: "Showing {loaded} of {total}",
};

export function SdkworkIamListPaginationControls({
  busy = false,
  copy = DEFAULT_COPY,
  label,
  onLoadMore,
  pageInfo,
}: SdkworkIamListPaginationControlsProps) {
  if (!pageInfo?.hasMore || !onLoadMore) {
    return null;
  }

  const totalItems = pageInfo.totalItems ? Number(pageInfo.totalItems) : undefined;
  const loadedCount = pageInfo.page && pageInfo.pageSize ? pageInfo.page * pageInfo.pageSize : undefined;
  const summary =
    totalItems !== undefined && Number.isFinite(totalItems)
      ? formatMessage(copy.summary, {
        loaded: String(Math.min(loadedCount ?? totalItems, totalItems)),
        total: String(totalItems),
      })
      : undefined;

  return (
    <div className="flex flex-wrap items-center gap-3 pt-2">
      {summary ? <span className="text-sm text-[var(--sdk-color-text-muted)]">{summary}</span> : null}
      <Button disabled={busy} onClick={() => void onLoadMore()} type="button" variant="outline">
        {label ?? copy.loadMore}
      </Button>
    </div>
  );
}

function formatMessage(template: string, values: Record<string, string>) {
  return Object.entries(values).reduce(
    (result, [key, value]) => result.replaceAll(`{${key}}`, value),
    template,
  );
}
