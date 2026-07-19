import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  AppWindow,
  CheckCircle2,
  Clipboard,
  Clock3,
  Globe2,
  Pencil,
  Plus,
  Power,
  Search,
} from "lucide-react";
import { SdkworkIamListPaginationControls } from "@sdkwork/iam-pc-admin-core";
import {
  Badge,
  Button,
  ConfirmDialog,
  DataTable,
  type DataTableColumn,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  IconButton,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  StatusBadge,
  StatusNotice,
  Switch,
  TagInput,
} from "@sdkwork/ui-pc-react";

import { useSdkworkIamTenantAdminMessages } from "../i18n";
import type {
  SdkworkIamTenant,
  SdkworkIamTenantApplication,
  SdkworkIamTenantApplicationDraft,
  SdkworkIamTenantApplicationSummary,
  SdkworkIamTenantApplicationUpdateDraft,
  SdkworkIamTenantController,
} from "../types/tenant-admin-types";

interface TenantApplicationsPanelProps {
  controller: SdkworkIamTenantController;
  tenant: SdkworkIamTenant;
}

interface ApplicationFilters {
  environment: string;
  q: string;
  status: string;
}

interface StatusTransition {
  application: SdkworkIamTenantApplication;
  enabled: boolean;
}

const EMPTY_FILTERS: ApplicationFilters = { environment: "all", q: "", status: "all" };

function emptyApplicationDraft(): SdkworkIamTenantApplicationDraft {
  return {
    accessPermissions: [],
    appKey: "",
    displayName: "",
    environment: "production",
    instanceKey: "",
    organizationId: "0",
    primaryDomain: "",
  };
}

export function TenantApplicationsPanel({ controller, tenant }: TenantApplicationsPanelProps) {
  const messages = useSdkworkIamTenantAdminMessages();
  const capabilities = controller.getApplicationCapabilities();
  const initialState = controller.getState();
  const [applications, setApplications] = useState(initialState.applications);
  const [summary, setSummary] = useState(initialState.applicationSummary);
  const [pageInfo, setPageInfo] = useState(initialState.listPageInfo?.applications);
  const [filters, setFilters] = useState<ApplicationFilters>(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<ApplicationFilters>(EMPTY_FILTERS);
  const [applicationDraft, setApplicationDraft] = useState(emptyApplicationDraft);
  const [updateDraft, setUpdateDraft] = useState<SdkworkIamTenantApplicationUpdateDraft>({ accessPermissions: [], primaryDomain: "" });
  const [editingApplication, setEditingApplication] = useState<SdkworkIamTenantApplication>();
  const [registerOpen, setRegisterOpen] = useState(false);
  const [statusTransition, setStatusTransition] = useState<StatusTransition>();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [notice, setNotice] = useState<string>();

  const syncControllerState = () => {
    const state = controller.getState();
    setPageInfo(state.listPageInfo?.applications);
  };

  const refresh = async (nextFilters = appliedFilters) => {
    const query = applicationFiltersToQuery(nextFilters);
    const [items, nextSummary] = await Promise.all([
      controller.listTenantApplications(tenant.tenantId, query),
      controller.retrieveTenantApplicationSummary(tenant.tenantId),
    ]);
    setApplications(items);
    setSummary(nextSummary);
    syncControllerState();
  };

  useEffect(() => {
    setFilters(EMPTY_FILTERS);
    setAppliedFilters(EMPTY_FILTERS);
    setLoading(true);
    setError(undefined);
    void refresh(EMPTY_FILTERS)
      .catch((loadError) => setError(toErrorMessage(loadError, messages.applications.notices.loadError)))
      .finally(() => setLoading(false));
  }, [controller, tenant.tenantId]);

  const runAction = async (action: () => Promise<void>, successMessage: string, fallbackError: string) => {
    setBusy(true);
    setError(undefined);
    setNotice(undefined);
    try {
      await action();
      setNotice(successMessage);
    } catch (actionError) {
      setError(toErrorMessage(actionError, fallbackError));
    } finally {
      setBusy(false);
    }
  };

  const openEditor = (application: SdkworkIamTenantApplication) => {
    if (!capabilities.canUpdate) {
      setNotice(messages.applications.permissionDenied);
      return;
    }
    setEditingApplication(application);
    setUpdateDraft({
      accessPermissions: [...application.accessPermissions],
      primaryDomain: application.primaryDomain ?? "",
    });
  };

  const columns = useMemo<DataTableColumn<SdkworkIamTenantApplication>[]>(() => [
    {
      id: "application",
      header: messages.applications.table.application,
      cell: (application) => (
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--sdk-radius-control)] bg-[var(--sdk-color-brand-primary-soft)] text-[var(--sdk-color-brand-primary)]">
            <AppWindow className="h-4 w-4" />
          </span>
          <span className="min-w-0">
            <span className="block truncate font-medium text-[var(--sdk-color-text-primary)]">{application.displayName}</span>
            <span className="block truncate text-xs text-[var(--sdk-color-text-muted)]">{application.instanceKey}</span>
          </span>
        </div>
      ),
    },
    {
      id: "appId",
      header: messages.applications.table.appId,
      cell: (application) => (
        <div className="flex max-w-[17rem] items-center gap-1">
          <code className="min-w-0 truncate text-xs text-[var(--sdk-color-text-secondary)]">{application.appId}</code>
          <IconButton
            aria-label={messages.applications.actions.copyAppId}
            onClick={(event) => {
              event.stopPropagation();
              void copyText(application.appId)
                .then(() => setNotice(messages.applications.notices.copied))
                .catch(() => setError(messages.applications.notices.copyFailed));
            }}
            title={messages.applications.actions.copyAppId}
            variant="ghost"
          >
            <Clipboard className="h-3.5 w-3.5" />
          </IconButton>
        </div>
      ),
    },
    {
      id: "environment",
      header: messages.applications.table.environment,
      cell: (application) => <Badge variant="secondary">{application.environment}</Badge>,
    },
    {
      id: "domain",
      header: messages.applications.table.domain,
      cell: (application) => (
        <span className="inline-flex max-w-[15rem] items-center gap-1.5 truncate text-sm">
          <Globe2 className="h-3.5 w-3.5 shrink-0 text-[var(--sdk-color-text-muted)]" />
          {application.primaryDomain || "-"}
        </span>
      ),
    },
    {
      id: "status",
      header: messages.applications.table.status,
      cell: (application) => (
        <StatusBadge
          label={applicationStatusLabel(application.status, messages.applications.statuses)}
          showIcon
          status={application.status}
        />
      ),
    },
  ], [messages]);

  const applyFilters = (event: FormEvent) => {
    event.preventDefault();
    const nextFilters = { ...filters, q: filters.q.trim() };
    setAppliedFilters(nextFilters);
    setLoading(true);
    setError(undefined);
    void refresh(nextFilters)
      .catch((loadError) => setError(toErrorMessage(loadError, messages.applications.notices.loadError)))
      .finally(() => setLoading(false));
  };

  return (
    <div className="space-y-5">
      {error ? <StatusNotice tone="danger">{error}</StatusNotice> : null}
      {notice ? <StatusNotice tone="success">{notice}</StatusNotice> : null}

      <ApplicationSummary messages={messages.applications.summary} summary={summary} />

      <form className="flex flex-col gap-3 xl:flex-row xl:items-end" onSubmit={applyFilters}>
        <label className="min-w-0 flex-1 space-y-1.5 text-sm">
          <span className="sr-only">{messages.applications.filters.searchLabel}</span>
          <span className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--sdk-color-text-muted)]" />
            <Input
              className="pl-9"
              onChange={(event) => setFilters((current) => ({ ...current, q: event.target.value }))}
              placeholder={messages.applications.filters.searchPlaceholder}
              value={filters.q}
            />
          </span>
        </label>
        <FilterSelect
          ariaLabel={messages.applications.filters.status}
          onValueChange={(status) => setFilters((current) => ({ ...current, status }))}
          options={[
            ["all", messages.applications.filters.allStatuses],
            ["enabled", messages.applications.statuses.enabled],
            ["pending_config", messages.applications.statuses.pendingConfig],
            ["disabled", messages.applications.statuses.disabled],
          ]}
          value={filters.status}
        />
        <FilterSelect
          ariaLabel={messages.applications.filters.environment}
          onValueChange={(environment) => setFilters((current) => ({ ...current, environment }))}
          options={[
            ["all", messages.applications.filters.allEnvironments],
            ["development", "Development"],
            ["staging", "Staging"],
            ["production", "Production"],
          ]}
          value={filters.environment}
        />
        <Button disabled={busy || loading} type="submit" variant="outline">
          <Search className="h-4 w-4" />
          {messages.applications.filters.apply}
        </Button>
      </form>

      <DataTable
        columns={columns}
        emptyDescription={messages.applications.emptyDescription}
        emptyTitle={messages.applications.emptyTitle}
        footer={(
          <SdkworkIamListPaginationControls
            busy={busy}
            onLoadMore={() => void runAction(async () => {
              setApplications(await controller.loadMoreTenantApplications(tenant.tenantId));
              syncControllerState();
            }, messages.applications.notices.loadMoreSuccess, messages.applications.notices.loadError)}
            pageInfo={pageInfo}
          />
        )}
        getRowId={(application) => application.tenantApplicationId}
        loading={loading}
        onRowClick={openEditor}
        rowActions={(application) => (
          <div className="flex items-center gap-2" onClick={(event) => event.stopPropagation()}>
            <IconButton
              aria-label={messages.applications.actions.edit}
              disabled={!capabilities.canUpdate}
              onClick={() => openEditor(application)}
              title={messages.applications.actions.edit}
              variant="outline"
            >
              <Pencil className="h-3.5 w-3.5" />
            </IconButton>
            <Switch
              aria-label={application.status === "enabled" ? messages.applications.statusDialog.disableAction : messages.applications.statusDialog.enableAction}
              checked={application.status === "enabled"}
              disabled={busy || !capabilities.canEnable}
              onCheckedChange={(enabled) => setStatusTransition({ application, enabled })}
            />
          </div>
        )}
        rows={[...applications]}
        title={messages.applications.title}
        toolbar={(
          <Button
            disabled={!capabilities.canProvision}
            onClick={() => {
              setApplicationDraft(emptyApplicationDraft());
              setRegisterOpen(true);
            }}
            type="button"
          >
            <Plus className="h-4 w-4" />
            {messages.applications.actions.register}
          </Button>
        )}
      />

      <ApplicationRegisterDrawer
        busy={busy}
        draft={applicationDraft}
        onDraftChange={setApplicationDraft}
        onOpenChange={setRegisterOpen}
        onSubmit={() => void runAction(async () => {
          await controller.provisionTenantApplication(tenant.tenantId, applicationDraft);
          await refresh(appliedFilters);
          setRegisterOpen(false);
        }, messages.applications.notices.provisionSuccess, messages.applications.notices.provisionError)}
        open={registerOpen}
      />

      <ApplicationEditDrawer
        application={editingApplication}
        busy={busy}
        draft={updateDraft}
        onDraftChange={setUpdateDraft}
        onOpenChange={(open) => { if (!open) setEditingApplication(undefined); }}
        onSubmit={() => {
          if (!editingApplication) return;
          void runAction(async () => {
            await controller.updateTenantApplication(
              tenant.tenantId,
              editingApplication.tenantApplicationId,
              updateDraft,
            );
            await refresh(appliedFilters);
            setEditingApplication(undefined);
          }, messages.applications.notices.updateSuccess, messages.applications.notices.updateError);
        }}
      />

      <ConfirmDialog
        closeOnConfirm={false}
        confirmLabel={statusTransition?.enabled ? messages.applications.statusDialog.enableAction : messages.applications.statusDialog.disableAction}
        confirmLoading={busy}
        description={statusTransition ? template(
          statusTransition.enabled
            ? messages.applications.statusDialog.enableDescriptionTemplate
            : messages.applications.statusDialog.disableDescriptionTemplate,
          { name: statusTransition.application.displayName },
        ) : undefined}
        onConfirm={() => {
          if (!statusTransition) return;
          void runAction(async () => {
            await controller.setTenantApplicationEnabled(
              tenant.tenantId,
              statusTransition.application.tenantApplicationId,
              statusTransition.enabled,
            );
            await refresh(appliedFilters);
            setStatusTransition(undefined);
          }, messages.applications.notices.statusSuccess, messages.applications.notices.statusError);
        }}
        onOpenChange={(open) => { if (!open && !busy) setStatusTransition(undefined); }}
        open={Boolean(statusTransition)}
        title={statusTransition?.enabled ? messages.applications.statusDialog.enableTitle : messages.applications.statusDialog.disableTitle}
        tone={statusTransition?.enabled ? "default" : "danger"}
      />
    </div>
  );
}

function ApplicationSummary({ messages, summary }: { messages: { disabled: string; enabled: string; pending: string; total: string }; summary: SdkworkIamTenantApplicationSummary }) {
  const items = [
    { icon: AppWindow, label: messages.total, value: summary.total },
    { icon: CheckCircle2, label: messages.enabled, value: summary.enabled },
    { icon: Clock3, label: messages.pending, value: summary.pending },
    { icon: Power, label: messages.disabled, value: summary.disabled },
  ];
  return (
    <div className="grid grid-cols-2 divide-x divide-y divide-[var(--sdk-color-border-subtle)] border-y border-[var(--sdk-color-border-subtle)] lg:grid-cols-4 lg:divide-y-0">
      {items.map(({ icon: Icon, label, value }) => (
        <div className="flex min-w-0 items-center gap-3 px-4 py-3" key={label}>
          <Icon className="h-4 w-4 shrink-0 text-[var(--sdk-color-text-muted)]" />
          <span className="min-w-0">
            <span className="block text-xl font-semibold text-[var(--sdk-color-text-primary)]">{value}</span>
            <span className="block truncate text-xs text-[var(--sdk-color-text-muted)]">{label}</span>
          </span>
        </div>
      ))}
    </div>
  );
}

function FilterSelect({ ariaLabel, onValueChange, options, value }: { ariaLabel: string; onValueChange: (value: string) => void; options: Array<[string, string]>; value: string }) {
  return (
    <Select onValueChange={onValueChange} value={value}>
      <SelectTrigger aria-label={ariaLabel} className="w-full xl:w-44">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map(([optionValue, label]) => <SelectItem key={optionValue} value={optionValue}>{label}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}

function ApplicationRegisterDrawer({ busy, draft, onDraftChange, onOpenChange, onSubmit, open }: { busy: boolean; draft: SdkworkIamTenantApplicationDraft; onDraftChange: (draft: SdkworkIamTenantApplicationDraft) => void; onOpenChange: (open: boolean) => void; onSubmit: () => void; open: boolean }) {
  const messages = useSdkworkIamTenantAdminMessages();
  const updateAppKey = (appKey: string) => {
    const previousSuggestion = suggestInstanceKey(draft.appKey, draft.environment);
    onDraftChange({
      ...draft,
      appKey,
      instanceKey: !draft.instanceKey || draft.instanceKey === previousSuggestion
        ? suggestInstanceKey(appKey, draft.environment)
        : draft.instanceKey,
    });
  };
  const updateEnvironment = (environment: string) => {
    const previousSuggestion = suggestInstanceKey(draft.appKey, draft.environment);
    onDraftChange({
      ...draft,
      environment,
      instanceKey: !draft.instanceKey || draft.instanceKey === previousSuggestion
        ? suggestInstanceKey(draft.appKey, environment)
        : draft.instanceKey,
    });
  };
  const canSubmit = Boolean(
    draft.appKey.trim()
    && draft.displayName.trim()
    && draft.environment.trim()
    && draft.instanceKey.trim()
    && draft.organizationId.trim(),
  );
  return (
    <Drawer onOpenChange={onOpenChange} open={open}>
      <DrawerContent size="lg">
        <DrawerHeader>
          <DrawerTitle>{messages.applications.drawer.registerTitle}</DrawerTitle>
          <DrawerDescription>{messages.applications.drawer.registerDescription}</DrawerDescription>
        </DrawerHeader>
        <DrawerBody className="space-y-5">
          <ApplicationField label={messages.applications.drawer.displayName} onChange={(displayName) => onDraftChange({ ...draft, displayName })} value={draft.displayName} />
          <ApplicationField helper={messages.applications.drawer.appKeyHint} label={messages.applications.drawer.appKey} onChange={updateAppKey} value={draft.appKey} />
          <ApplicationField helper={messages.applications.drawer.instanceKeyHint} label={messages.applications.drawer.instanceKey} onChange={(instanceKey) => onDraftChange({ ...draft, instanceKey })} value={draft.instanceKey} />
          <div className="grid gap-4 sm:grid-cols-2">
            <ApplicationField label={messages.applications.drawer.organizationId} onChange={(organizationId) => onDraftChange({ ...draft, organizationId })} value={draft.organizationId} />
            <label className="space-y-1.5 text-sm">
              <span className="font-medium text-[var(--sdk-color-text-primary)]">{messages.applications.drawer.environment}</span>
              <Select onValueChange={updateEnvironment} value={draft.environment}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="development">Development</SelectItem>
                  <SelectItem value="staging">Staging</SelectItem>
                  <SelectItem value="production">Production</SelectItem>
                </SelectContent>
              </Select>
            </label>
          </div>
          <ApplicationField label={messages.applications.drawer.primaryDomain} onChange={(primaryDomain) => onDraftChange({ ...draft, primaryDomain })} placeholder="app.example.com" value={draft.primaryDomain} />
          <ApplicationPermissionsField
            helper={messages.applications.drawer.accessPermissionsHint}
            label={messages.applications.drawer.accessPermissions}
            onChange={(accessPermissions) => onDraftChange({ ...draft, accessPermissions })}
            value={draft.accessPermissions}
          />
        </DrawerBody>
        <DrawerFooter>
          <Button disabled={busy} onClick={() => onOpenChange(false)} type="button" variant="secondary">{messages.common.cancel}</Button>
          <Button disabled={busy || !canSubmit} loading={busy} onClick={onSubmit} type="button">
            <Plus className="h-4 w-4" />
            {messages.applications.actions.register}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

function ApplicationEditDrawer({ application, busy, draft, onDraftChange, onOpenChange, onSubmit }: { application?: SdkworkIamTenantApplication; busy: boolean; draft: SdkworkIamTenantApplicationUpdateDraft; onDraftChange: (draft: SdkworkIamTenantApplicationUpdateDraft) => void; onOpenChange: (open: boolean) => void; onSubmit: () => void }) {
  const messages = useSdkworkIamTenantAdminMessages();
  return (
    <Drawer onOpenChange={onOpenChange} open={Boolean(application)}>
      <DrawerContent size="lg">
        <DrawerHeader>
          <DrawerTitle>{messages.applications.drawer.editTitle}</DrawerTitle>
          <DrawerDescription>{messages.applications.drawer.editDescription}</DrawerDescription>
        </DrawerHeader>
        <DrawerBody className="space-y-5">
          {application ? (
            <div className="grid gap-3 border-y border-[var(--sdk-color-border-subtle)] py-4 sm:grid-cols-2">
              <ReadOnlyDatum label={messages.applications.table.appId} value={application.appId} />
              <ReadOnlyDatum label={messages.applications.drawer.environment} value={application.environment} />
              <ReadOnlyDatum label={messages.applications.drawer.instanceKey} value={application.instanceKey} />
              <ReadOnlyDatum label={messages.applications.drawer.appKey} value={application.templateId} />
            </div>
          ) : null}
          <ApplicationField label={messages.applications.drawer.primaryDomain} onChange={(primaryDomain) => onDraftChange({ ...draft, primaryDomain })} placeholder="app.example.com" value={draft.primaryDomain} />
          <ApplicationPermissionsField
            helper={messages.applications.drawer.accessPermissionsHint}
            label={messages.applications.drawer.accessPermissions}
            onChange={(accessPermissions) => onDraftChange({ ...draft, accessPermissions })}
            value={draft.accessPermissions}
          />
        </DrawerBody>
        <DrawerFooter>
          <Button disabled={busy} onClick={() => onOpenChange(false)} type="button" variant="secondary">{messages.common.cancel}</Button>
          <Button disabled={busy} loading={busy} onClick={onSubmit} type="button">{messages.common.save}</Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

function ApplicationField({ helper, label, onChange, placeholder, value }: { helper?: string; label: string; onChange: (value: string) => void; placeholder?: string; value: string }) {
  return (
    <label className="block space-y-1.5 text-sm">
      <span className="font-medium text-[var(--sdk-color-text-primary)]">{label}</span>
      <Input onChange={(event) => onChange(event.target.value)} placeholder={placeholder} value={value} />
      {helper ? <span className="block text-xs leading-5 text-[var(--sdk-color-text-muted)]">{helper}</span> : null}
    </label>
  );
}

function ApplicationPermissionsField({ helper, label, onChange, value }: { helper: string; label: string; onChange: (value: string[]) => void; value: string[] }) {
  return (
    <label className="block space-y-1.5 text-sm">
      <span className="font-medium text-[var(--sdk-color-text-primary)]">{label}</span>
      <TagInput aria-label={label} onValueChange={onChange} placeholder="iam.users.read" value={value} />
      <span className="block text-xs leading-5 text-[var(--sdk-color-text-muted)]">{helper}</span>
    </label>
  );
}

function ReadOnlyDatum({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <span className="block text-xs text-[var(--sdk-color-text-muted)]">{label}</span>
      <span className="mt-1 block truncate text-sm font-medium text-[var(--sdk-color-text-primary)]">{value}</span>
    </div>
  );
}

function applicationFiltersToQuery(filters: ApplicationFilters): Record<string, unknown> {
  return {
    ...(filters.environment !== "all" ? { environment: filters.environment } : {}),
    ...(filters.q ? { q: filters.q } : {}),
    ...(filters.status !== "all" ? { status: filters.status } : {}),
  };
}

function applicationStatusLabel(status: string, messages: { disabled: string; enabled: string; pendingConfig: string; unknown: string }) {
  switch (status.trim().toLowerCase()) {
    case "enabled": return messages.enabled;
    case "disabled": return messages.disabled;
    case "pending_config": return messages.pendingConfig;
    default: return messages.unknown;
  }
}

function suggestInstanceKey(appKey: string, environment: string) {
  return [appKey, environment]
    .filter(Boolean)
    .join("-")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, "-")
    .replace(/^-+|-+$/gu, "");
}

async function copyText(value: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }
  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.append(textarea);
  textarea.select();
  const copied = document.execCommand("copy");
  textarea.remove();
  if (!copied) {
    throw new Error("copy failed");
  }
}

function template(value: string, replacements: Record<string, string>) {
  return Object.entries(replacements).reduce(
    (result, [key, replacement]) => result.replace(`{${key}}`, replacement),
    value,
  );
}

function toErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}
