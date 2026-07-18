import { useEffect, useMemo, useState } from "react";
import { SdkworkIamListPaginationControls } from "@sdkwork/iam-pc-admin-core";
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
  SettingsSection,
  StatusNotice,
} from "@sdkwork/ui-pc-react";

import type { SdkworkIamAuditAdminWorkspaceProps } from "../types/audit-admin-types";

type AuditTab = "audit" | "security";

export function SdkworkIamAuditAdminWorkspace({
  controller,
  description = "Review backend mutation audit trails and security events with server-backed pagination.",
  title = "Audit and security",
}: SdkworkIamAuditAdminWorkspaceProps) {
  const [tab, setTab] = useState<AuditTab>("audit");
  const [searchQuery, setSearchQuery] = useState("");
  const [auditEvents, setAuditEvents] = useState(controller.getState().auditEvents);
  const [securityEvents, setSecurityEvents] = useState(controller.getState().securityEvents);
  const [listPageInfo, setListPageInfo] = useState(controller.getState().listPageInfo);
  const [error, setError] = useState<string | undefined>();
  const [status, setStatus] = useState(controller.getState().status);
  const [eventDetail, setEventDetail] = useState<string | undefined>();

  const eventColumns = useMemo<DataTableColumn<EventListItem>[]>(() => [
    {
      cell: (item) => item.primary,
      header: "Event",
      id: "event",
    },
    {
      cell: (item) => item.secondary || "—",
      header: "Context",
      id: "context",
    },
  ], []);

  const syncFromController = () => {
    const next = controller.getState();
    setAuditEvents(next.auditEvents);
    setSecurityEvents(next.securityEvents);
    setListPageInfo(next.listPageInfo);
    setStatus(next.status);
    setError(next.lastError);
  };

  const refreshAuditEvents = async (query?: string) => {
    const items = await controller.listAuditEvents({
      page_size: 20,
      ...(query?.trim() ? { q: query.trim() } : {}),
    });
    setAuditEvents(items);
    syncFromController();
    return items;
  };

  const refreshSecurityEvents = async (query?: string) => {
    const items = await controller.listSecurityEvents({
      page_size: 20,
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
        ? () => refreshAuditEvents(searchQuery)
        : () => refreshSecurityEvents(searchQuery);
      void loader().catch((loadError) => {
        setError(loadError instanceof Error ? loadError.message : "Failed to load events");
        setStatus(controller.getState().status);
      });
    }, 300);
    return () => window.clearTimeout(timeout);
  }, [controller, tab, searchQuery]);

  const busy = status === "loading";

  return (
    <div className="space-y-6">
      <SettingsSection description={description} title={title}>
        {error ? <StatusNotice tone="danger">{error}</StatusNotice> : null}

        <div className="flex gap-2">
          <TabButton active={tab === "audit"} disabled={busy} label="Audit events" onSelect={() => setTab("audit")} />
          <TabButton active={tab === "security"} disabled={busy} label="Security events" onSelect={() => setTab("security")} />
        </div>

        <label className="block max-w-md space-y-2 text-sm">
          <span>Search</span>
          <input
            className="w-full rounded-[0.75rem] border border-[var(--sdk-color-border-default)] bg-transparent px-3 py-2"
            disabled={busy}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder={tab === "audit" ? "Filter by action or resource type" : "Filter by event type or severity"}
            type="search"
            value={searchQuery}
          />
        </label>

        {tab === "audit" ? (
          <EventList
            busy={busy}
            columns={eventColumns}
            emptyLabel="No audit events found."
            items={auditEvents.map((event) => ({
              id: event.id,
              primary: `${event.action} · ${event.resourceType ?? "resource"}`,
              secondary: [event.tenantId, event.actorUserId, event.environment, event.createdAt].filter(Boolean).join(" · "),
            }))}
            onLoadMore={() => controller.loadMoreAuditEvents()
              .then((items) => {
                setAuditEvents(items);
                syncFromController();
              })
              .catch((loadError) => {
                setError(loadError instanceof Error ? loadError.message : "Failed to load more audit events");
                setStatus(controller.getState().status);
              })}
            onSelectItem={(id) => void controller.retrieveAuditEvent(id)
              .then((event) => setEventDetail(event.detailJson ?? JSON.stringify(event, null, 2)))
              .catch((loadError) => {
                setError(loadError instanceof Error ? loadError.message : "Failed to load audit event detail");
                setStatus(controller.getState().status);
              })}
            pageInfo={listPageInfo?.auditEvents}
          />
        ) : (
          <EventList
            busy={busy}
            columns={eventColumns}
            emptyLabel="No security events found."
            items={securityEvents.map((event) => ({
              id: event.id,
              primary: `${event.category} · ${event.severity ?? "info"}`,
              secondary: [event.tenantId, event.userId, event.createdAt].filter(Boolean).join(" · "),
            }))}
            onLoadMore={() => controller.loadMoreSecurityEvents()
              .then((items) => {
                setSecurityEvents(items);
                syncFromController();
              })
              .catch((loadError) => {
                setError(loadError instanceof Error ? loadError.message : "Failed to load more security events");
                setStatus(controller.getState().status);
              })}
            onSelectItem={(id) => void controller.retrieveSecurityEvent(id)
              .then((event) => setEventDetail(event.detailJson ?? JSON.stringify(event, null, 2)))
              .catch((loadError) => {
                setError(loadError instanceof Error ? loadError.message : "Failed to load security event detail");
                setStatus(controller.getState().status);
              })}
            pageInfo={listPageInfo?.securityEvents}
          />
        )}

      </SettingsSection>
      <Drawer open={Boolean(eventDetail)} onOpenChange={(open) => { if (!open) setEventDetail(undefined); }}>
        <DrawerContent size="lg">
          <DrawerHeader>
            <DrawerTitle>Event detail</DrawerTitle>
            <DrawerDescription>Read-only IAM audit and security event payload.</DrawerDescription>
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
  items,
  onLoadMore,
  onSelectItem,
  pageInfo,
}: {
  busy?: boolean;
  columns: DataTableColumn<EventListItem>[];
  emptyLabel: string;
  items: EventListItem[];
  onLoadMore: () => void | Promise<void>;
  onSelectItem?: (id: string) => void;
  pageInfo?: import("@sdkwork/iam-contracts").SdkWorkPageInfo;
}) {
  return (
    <DataTable
      columns={columns}
      emptyDescription={emptyLabel}
      emptyTitle="No events found"
      footer={<SdkworkIamListPaginationControls busy={busy} onLoadMore={onLoadMore} pageInfo={pageInfo} />}
      getRowId={(item) => item.id}
      loading={busy}
      onRowClick={(item) => onSelectItem?.(item.id)}
      rowActions={(item) => <Button disabled={busy} onClick={() => onSelectItem?.(item.id)} size="sm" type="button" variant="outline">View detail</Button>}
      rows={items}
    />
  );
}

type EventListItem = {
  id: string;
  primary: string;
  secondary: string;
};
