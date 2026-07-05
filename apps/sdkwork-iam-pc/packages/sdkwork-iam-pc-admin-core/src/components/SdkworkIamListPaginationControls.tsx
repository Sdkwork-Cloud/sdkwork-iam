import type { SdkWorkPageInfo } from "@sdkwork/iam-contracts";
import { Button } from "@sdkwork/ui-pc-react";

export interface SdkworkIamListPaginationControlsProps {
  busy?: boolean;
  label?: string;
  onLoadMore?: () => void | Promise<void>;
  pageInfo?: SdkWorkPageInfo;
}

export function SdkworkIamListPaginationControls({
  busy = false,
  label = "Load more",
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
      ? `Showing ${Math.min(loadedCount ?? totalItems, totalItems)} of ${totalItems}`
      : undefined;

  return (
    <div className="flex flex-wrap items-center gap-3 pt-2">
      {summary ? <span className="text-sm text-[var(--sdk-color-text-muted)]">{summary}</span> : null}
      <Button disabled={busy} onClick={() => void onLoadMore()} type="button" variant="outline">
        {label}
      </Button>
    </div>
  );
}
