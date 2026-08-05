import { Button } from "@sdkwork/ui-pc-react";
import type { SdkWorkPageInfo } from "@sdkwork/iam-contracts";

/** Localized copy for the catalog pagination bar. */
export interface CatalogPaginationCopy {
  next: string;
  pageSize: string;
  previous: string;
  total: string;
}

export const CATALOG_PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;

function buildPageItems(currentPage: number, totalPages: number): Array<number | "ellipsis"> {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }
  const pages = new Set<number>([1, totalPages, currentPage - 1, currentPage, currentPage + 1]);
  const ordered = [...pages].filter((page) => page >= 1 && page <= totalPages).sort((a, b) => a - b);
  const items: Array<number | "ellipsis"> = [];
  let previous = 0;
  for (const page of ordered) {
    if (previous > 0 && page - previous > 1) {
      items.push("ellipsis");
    }
    items.push(page);
    previous = page;
  }
  return items;
}

function formatMessage(template: string, values: Record<string, string | number>) {
  return Object.entries(values).reduce(
    (result, [key, value]) => result.replaceAll(`{${key}}`, String(value)),
    template,
  );
}

/**
 * Offset page-number pagination bar shared by all IAM admin list surfaces.
 *
 * Renders whenever the server reports total items, so operators always see
 * where they are in the list and can jump between pages. Page size can be
 * switched through `onPageSizeChange`.
 */
export function CatalogPagination({
  busy,
  copy,
  onPageChange,
  onPageSizeChange,
  pageInfo,
}: {
  busy: boolean;
  copy: CatalogPaginationCopy;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageInfo?: SdkWorkPageInfo;
}) {
  const totalItems = pageInfo?.totalItems !== undefined ? Number(pageInfo.totalItems) : undefined;
  if (totalItems === undefined || !Number.isFinite(totalItems) || totalItems <= 0) {
    return null;
  }

  const pageSize = pageInfo?.pageSize ?? 20;
  const currentPage = pageInfo?.page ?? 1;
  const totalPages = pageInfo?.totalPages
    ?? Math.max(1, Math.ceil(totalItems / Math.max(1, pageSize)));
  const pageItems = buildPageItems(currentPage, totalPages);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
      <span className="text-sm text-[var(--sdk-color-text-muted)]">
        {formatMessage(copy.total, { total: String(totalItems) })}
      </span>
      <div className="flex flex-wrap items-center gap-1">
        <Button
          disabled={busy || currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          size="sm"
          type="button"
          variant="outline"
        >
          {copy.previous}
        </Button>
        {pageItems.map((item, index) =>
          item === "ellipsis"
            ? (
              <span
                aria-hidden="true"
                className="px-1 text-sm text-[var(--sdk-color-text-muted)]"
                key={`ellipsis-${index}`}
              >
                …
              </span>
            )
            : (
              <Button
                aria-label={`${item}`}
                aria-current={item === currentPage ? "page" : undefined}
                disabled={busy}
                key={item}
                onClick={() => onPageChange(item)}
                size="sm"
                type="button"
                variant={item === currentPage ? "primary" : "outline"}
              >
                {item}
              </Button>
            ),
        )}
        <Button
          disabled={busy || currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          size="sm"
          type="button"
          variant="outline"
        >
          {copy.next}
        </Button>
      </div>
      {onPageSizeChange ? (
        <label className="flex items-center gap-2 text-sm">
          <span className="text-[var(--sdk-color-text-muted)]">{copy.pageSize}</span>
          <select
            aria-label={copy.pageSize}
            className="h-8 rounded-[0.75rem] border border-[var(--sdk-color-border-default)] bg-transparent px-2 text-sm"
            onChange={(event) => onPageSizeChange(Number(event.target.value))}
            value={pageSize}
          >
            {CATALOG_PAGE_SIZE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      ) : null}
    </div>
  );
}
