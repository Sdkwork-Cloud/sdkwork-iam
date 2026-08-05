import { useEffect, useMemo, useState } from "react";
import { CatalogPagination } from "@sdkwork/iam-pc-admin-core";
import {
  Button,
  DataTable,
  type DataTableColumn,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  StatusNotice,
} from "@sdkwork/ui-pc-react";

import { useSdkworkIamAuditAdminMessages } from "../i18n";
import type { SdkworkIamAuditAdminWorkspaceProps } from "../types/audit-admin-types";

type AuditTab = "audit" | "security";

export function SdkworkIamAuditAdminWorkspace({
  controller,
}: SdkworkIamAuditAdminWorkspaceProps) {
  const messages = useSdkworkIamAuditAdminMessages();
  const [tab, setTab] = useState<AuditTab>("audit");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState<Record<AuditTab, number>>({ audit: 1, security: 1 });
  const [pageSize, setPageSize] = useState<Record<AuditTab, number>>({ audit: 20, security: 20 });
  const [auditEvents, setAuditEvents] = useState(controller.getState().auditEvents);
  const [securityEvents, setSecurityEvents] = useState(controller.getState().securityEvents);
  const [listPageInfo, setListPageInfo] = useState(controller.getState().listPageInfo);
  const [error, setError] = useState<string | undefined>();
  const [status, setStatus] = useState(controller.getState().status);
  const [eventDetail, setEventDetail] = useState<string | undefined>();

  const eventColumns = useMemo<DataTableColumn<EventListItem>[]>(() => [
    {
      cell: (item) => item.primary,
      header: messages.common.event,
      id: "event",
    },
    {
      cell: (item) => item.secondary || "—",
      header: messages.common.context,
      id: "context",
    },
  ], [messages]);

  const syncFromController = () => {
    const next = controller.getState();
    setAuditEvents(next.auditEvents);
    setSecurityEvents(next.securityEvents);
    setListPageInfo(next.listPageInfo);
    setStatus(next.status);
    setError(next.lastError);
  };

  const refreshAuditEvents = async (query = searchQuery, nextPage = page.audit, nextPageSize = pageSize.audit) => {
    const items = await controller.listAuditEvents({
      page: nextPage,
      page_size: nextPageSize,
      ...(query?.trim() ? { q: query.trim() } : {}),
    });
    setAuditEvents(items);
    syncFromController();
    return items;
  };

  const refreshSecurityEvents = async (query = searchQuery, nextPage = page.security, nextPageSize = pageSize.security) => {
    const items = await controller.listSecurityEvents({
      page: nextPage,
      page_size: nextPageSize,
      ...(query?.trim() ? { q: query.trim() } : {}),
    });
    setSecurityEvents(items);
    syncFromController();
    return items;
  };

  useEffect(() => {
    setError(undefined);
    setEventDetail(undefined);
    const timeout = window.setTimeout(() => {
      const loader = tab === "audit"
        ? () => refreshAuditEvents(searchQuery, page.audit, pageSize.audit)
        : () => refreshSecurityEvents(searchQuery, page.security, pageSize.security);
      void loader().catch((loadError) => {
        setError(toErrorMessage(loadError, messages.errors.loadEventsError));
        setStatus(controller.getState().status);
      });
    }, 300);
    return () => window.clearTimeout(timeout);
  }, [controller, tab, searchQuery, page.audit, page.security, pageSize.audit, pageSize.security]);

  const changePage = (nextPage: number) => {
    setPage((current) => ({ ...current, [tab]: nextPage }));
  };

  const changePageSize = (nextPageSize: number) => {
    setPageSize((current) => ({ ...current, [tab]: nextPageSize }));
    setPage((current) => ({ ...current, [tab]: 1 }));
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setPage((current) => ({ ...current, [tab]: 1 }));
  };

  const busy = status === "loading";

  return (
    <div className="flex h-full min-h-0 flex-col gap-6">
      <div className="flex min-h-0 flex-1 flex-col gap-3">
        {error ? <StatusNotice tone="danger">{error}</StatusNotice> : null}

        <div className="flex gap-2">
          <TabButton active={tab === "audit"} disabled={busy} label={messages.events.auditTab} onSelect={() => setTab("audit")} />
          <TabButton active={tab === "security"} disabled={busy} label={messages.events.securityTab} onSelect={() => setTab("security")} />
        </div>

        <label className="block max-w-md space-y-2 text-sm">
          <span>{messages.search.label}</span>
          <input
            className="w-full rounded-[0.75rem] border border-[var(--sdk-color-border-default)] bg-transparent px-3 py-2"
            disabled={busy}
            onChange={(event) => handleSearchChange(event.target.value)}
            placeholder={tab === "audit" ? messages.events.searchPlaceholderAudit : messages.events.searchPlaceholderSecurity}
            type="search"
            value={searchQuery}
          />
        </label>

        {tab === "audit" ? (
          <EventList
            busy={busy}
            columns={eventColumns}
            emptyLabel={messages.events.noAuditEvents}
            emptyTitle={messages.events.noEvents}
            items={auditEvents.map((event) => ({
              id: event.id,
              primary: `${event.action} · ${event.resourceType ?? messages.events.fallbackResource}`,
              secondary: [event.tenantId, event.actorUserId, event.environment, event.createdAt].filter(Boolean).join(" · "),
            }))}
            onPageChange={changePage}
            onPageSizeChange={changePageSize}
            onSelectItem={(id) => void controller.retrieveAuditEvent(id)
              .then((event) => setEventDetail(event.detailJson ?? JSON.stringify(event, null, 2)))
              .catch((loadError) => {
                setError(toErrorMessage(loadError, messages.errors.loadAuditDetailError));
                setStatus(controller.getState().status);
              })}
            pageInfo={listPageInfo?.auditEvents}
            viewDetailLabel={messages.viewDetail}
          />
        ) : (
          <EventList
            busy={busy}
            columns={eventColumns}
            emptyLabel={messages.events.noSecurityEvents}
            emptyTitle={messages.events.noEvents}
            items={securityEvents.map((event) => ({
              id: event.id,
              primary: `${event.category} · ${severityLabel(messages.events.severities, event.severity, messages.events.fallbackInfo)}`,
              secondary: [event.tenantId, event.userId, event.createdAt].filter(Boolean).join(" · "),
            }))}
            onPageChange={changePage}
            onPageSizeChange={changePageSize}
            onSelectItem={(id) => void controller.retrieveSecurityEvent(id)
              .then((event) => setEventDetail(event.detailJson ?? JSON.stringify(event, null, 2)))
              .catch((loadError) => {
                setError(toErrorMessage(loadError, messages.errors.loadSecurityDetailError));
                setStatus(controller.getState().status);
              })}
            pageInfo={listPageInfo?.securityEvents}
            viewDetailLabel={messages.viewDetail}
          />
        )}
      </div>
      <Drawer open={Boolean(eventDetail)} onOpenChange={(open) => { if (!open) setEventDetail(undefined); }}>
        <DrawerContent size="lg">
          <DrawerHeader>
            <DrawerTitle>{messages.drawer.detailTitle}</DrawerTitle>
            <DrawerDescription>{messages.drawer.detailDescription}</DrawerDescription>
          </DrawerHeader>
          <DrawerBody>
            <pre className="overflow-auto rounded-[0.75rem] border border-[var(--sdk-color-border-default)] bg-[var(--sdk-color-surface-muted)] p-3 text-xs">
              {eventDetail}
            </pre>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </div>
  );
}

function TabButton({
  active,
  disabled,
  label,
  onSelect,
}: {
  active: boolean;
  disabled?: boolean;
  label: string;
  onSelect: () => void;
}) {
  return (
    <Button
      disabled={disabled}
      onClick={onSelect}
      type="button"
      variant={active ? "primary" : "outline"}
    >
      {label}
    </Button>
  );
}

function EventList({
  busy,
  columns,
  emptyLabel,
  emptyTitle,
  items,
  onPageChange,
  onPageSizeChange,
  onSelectItem,
  pageInfo,
  viewDetailLabel,
}: {
  busy?: boolean;
  columns: DataTableColumn<EventListItem>[];
  emptyLabel: string;
  emptyTitle: string;
  items: EventListItem[];
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onSelectItem?: (id: string) => void;
  pageInfo?: import("@sdkwork/iam-contracts").SdkWorkPageInfo;
  viewDetailLabel: string;
}) {
  const messages = useSdkworkIamAuditAdminMessages();
  return (
    <DataTable
      className="min-h-0 flex-1"
      columns={columns}
      emptyDescription={emptyLabel}
      emptyTitle={emptyTitle}
      footer={(
        <CatalogPagination
          busy={Boolean(busy)}
          copy={{
            next: messages.pagination.next,
            pageSize: messages.pagination.pageSize,
            previous: messages.pagination.previous,
            total: messages.pagination.total,
          }}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
          pageInfo={pageInfo}
        />
      )}
      getRowId={(item) => item.id}
      loading={busy}
      onRowClick={(item) => onSelectItem?.(item.id)}
      rowActions={(item) => <Button disabled={busy} onClick={() => onSelectItem?.(item.id)} size="sm" type="button" variant="outline">{viewDetailLabel}</Button>}
      rows={items}
      slotProps={{
        surface: { className: "flex min-h-0 flex-col" },
        viewport: { className: "min-h-0 flex-1" },
        footer: { className: "shrink-0" },
      }}
      stickyHeader
    />
  );
}

function severityLabel(severities: { critical: string; error: string; info: string; unknown: string; warning: string }, value: string | undefined, fallback: string) {
  if (!value) return fallback;
  const normalized = value.trim().toLowerCase();
  return severities[normalized as keyof typeof severities] ?? value;
}

function toErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

type EventListItem = {
  id: string;
  primary: string;
  secondary: string;
};
