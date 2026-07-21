import { useEffect, useMemo, useState, type FormEvent } from "react";
import { AppWindow, Building2, Pencil, Plus, Search, Trash2, Users } from "lucide-react";
import { SdkworkIamListPaginationControls } from "@sdkwork/iam-pc-admin-core";
import {
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
  SegmentedControl,
  SettingsSection,
  StatusBadge,
  StatusNotice,
} from "@sdkwork/ui-pc-react";

import { TenantApplicationsPanel } from "../components/TenantApplicationsPanel";
import { useSdkworkIamTenantAdminMessages } from "../i18n";
import type {
  SdkworkIamTenant,
  SdkworkIamTenantAdminWorkspaceProps,
  SdkworkIamTenantDraft,
  SdkworkIamTenantMember,
  SdkworkIamTenantMemberDraft,
} from "../types/tenant-admin-types";

type TenantDetailTab = "applications" | "members";

const emptyTenantDraft = (): SdkworkIamTenantDraft => ({ code: "", name: "" });
const emptyMemberDraft = (): SdkworkIamTenantMemberDraft => ({ roleCode: "", userId: "" });

export function SdkworkIamTenantAdminWorkspace({
  controller,
  description,
  permissions = {
    members: { create: true, delete: true, read: true, update: true },
    tenants: { create: true, delete: true, update: true },
  },
  title,
}: SdkworkIamTenantAdminWorkspaceProps) {
  const messages = useSdkworkIamTenantAdminMessages();
  const initialState = controller.getState();
  const [tenants, setTenants] = useState(initialState.tenants);
  const [members, setMembers] = useState(initialState.members);
  const [listPageInfo, setListPageInfo] = useState(initialState.listPageInfo);
  const [selectedTenant, setSelectedTenant] = useState<SdkworkIamTenant>();
  const [activeTab, setActiveTab] = useState<TenantDetailTab>("applications");
  const [selectedMember, setSelectedMember] = useState<SdkworkIamTenantMember>();
  const [tenantDraft, setTenantDraft] = useState<SdkworkIamTenantDraft>(emptyTenantDraft);
  const [memberDraft, setMemberDraft] = useState<SdkworkIamTenantMemberDraft>(emptyMemberDraft);
  const [tenantDrawerMode, setTenantDrawerMode] = useState<"create" | "edit">();
  const [memberDrawerMode, setMemberDrawerMode] = useState<"create" | "edit">();
  const [deleteTenantTarget, setDeleteTenantTarget] = useState<SdkworkIamTenant>();
  const [removeMemberTarget, setRemoveMemberTarget] = useState<SdkworkIamTenantMember>();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [notice, setNotice] = useState<string>();
  const [searchQuery, setSearchQuery] = useState("");
  const [appliedSearchQuery, setAppliedSearchQuery] = useState("");

  const syncState = () => setListPageInfo(controller.getState().listPageInfo);

  const refreshTenants = async (query = appliedSearchQuery) => {
    const items = await controller.listTenants(query ? { q: query } : undefined);
    setTenants(items);
    syncState();
    return items;
  };

  const refreshMembers = async (tenantId: string) => {
    const items = await controller.listTenantMembers(tenantId);
    setMembers(items);
    syncState();
    return items;
  };

  useEffect(() => {
    setLoading(true);
    void refreshTenants()
      .catch((loadError) => setError(toErrorMessage(loadError, messages.tenants.notices.loadError)))
      .finally(() => setLoading(false));
  }, [controller]);

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = searchQuery.trim();
    setAppliedSearchQuery(query);
    setLoading(true);
    setError(undefined);
    void refreshTenants(query)
      .catch((loadError) => setError(toErrorMessage(loadError, messages.tenants.notices.loadError)))
      .finally(() => setLoading(false));
  };

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

  const selectTenant = async (tenant: SdkworkIamTenant) => {
    setError(undefined);
    try {
      const resolved = await controller.selectTenant(tenant.tenantId) ?? tenant;
      setSelectedTenant(resolved);
      setTenantDraft({ code: resolved.code ?? "", name: resolved.name, status: resolved.status ?? "" });
      setActiveTab("applications");
      setMembers([]);
    } catch (loadError) {
      setError(toErrorMessage(loadError, messages.tenants.notices.loadError));
    }
  };

  const openTenantEditor = (tenant: SdkworkIamTenant) => {
    setSelectedTenant(tenant);
    setTenantDraft({ code: tenant.code ?? "", name: tenant.name, status: tenant.status ?? "" });
    setTenantDrawerMode("edit");
  };

  const switchDetailTab = (value: string) => {
    if (!selectedTenant || (value !== "applications" && value !== "members")) return;
    setActiveTab(value);
    if (value === "members") {
      setLoading(true);
      void refreshMembers(selectedTenant.tenantId)
        .catch((loadError) => setError(toErrorMessage(loadError, messages.members.notices.loadError)))
        .finally(() => setLoading(false));
    }
  };

  const tenantColumns = useMemo<DataTableColumn<SdkworkIamTenant>[]>(() => [
    { id: "name", header: messages.tenants.table.name, cell: (tenant) => tenant.name },
    { id: "code", header: messages.tenants.table.code, cell: (tenant) => tenant.code || "-" },
    { id: "tenantId", header: messages.tenants.table.tenantId, cell: (tenant) => <code className="text-xs">{tenant.tenantId}</code> },
    {
      id: "status",
      header: messages.tenants.table.status,
      cell: (tenant) => tenant.status
        ? <StatusBadge label={tenant.status} status={tenant.status} />
        : "-",
    },
  ], [messages]);

  const memberColumns = useMemo<DataTableColumn<SdkworkIamTenantMember>[]>(() => [
    { id: "member", header: messages.members.table.member, cell: (member) => member.displayName || member.username || member.email || member.userId },
    { id: "userId", header: messages.members.table.userId, cell: (member) => <code className="text-xs">{member.userId}</code> },
    { id: "roleCode", header: messages.members.table.role, cell: (member) => member.roleCode || "-" },
    {
      id: "status",
      header: messages.members.table.status,
      cell: (member) => member.status
        ? <StatusBadge label={member.status} status={member.status} />
        : "-",
    },
  ], [messages]);

  return (
    <div className="space-y-6">
      <SettingsSection description={description ?? messages.tenants.description} title={title ?? messages.tenants.title}>
        {error ? <StatusNotice tone="danger">{error}</StatusNotice> : null}
        {notice ? <StatusNotice tone="success">{notice}</StatusNotice> : null}

        <DataTable
          columns={tenantColumns}
          emptyDescription={messages.tenants.emptyDescription}
          emptyTitle={messages.tenants.emptyTitle}
          footer={(
            <SdkworkIamListPaginationControls
              busy={busy}
              onLoadMore={() => void runAction(async () => {
                setTenants(await controller.loadMoreTenants());
                syncState();
              }, messages.tenants.loadedMore, messages.tenants.notices.loadError)}
              pageInfo={listPageInfo?.tenants}
            />
          )}
          getRowId={(tenant) => tenant.tenantId}
          loading={loading && !selectedTenant}
          onRowClick={(tenant) => void selectTenant(tenant)}
          rowActions={(tenant) => (
            <div className="flex items-center gap-2" onClick={(event) => event.stopPropagation()}>
              <Button onClick={() => void selectTenant(tenant)} size="sm" type="button" variant="outline">
                {messages.tenants.manage}
              </Button>
              {permissions.tenants.update ? (
                <IconButton aria-label={messages.tenants.edit} onClick={() => openTenantEditor(tenant)} title={messages.tenants.edit} variant="ghost">
                  <Pencil className="h-3.5 w-3.5" />
                </IconButton>
              ) : null}
              {permissions.tenants.delete ? (
                <IconButton aria-label={messages.tenants.delete} onClick={() => setDeleteTenantTarget(tenant)} title={messages.tenants.delete} variant="ghost">
                  <Trash2 className="h-3.5 w-3.5 text-[var(--sdk-color-state-danger)]" />
                </IconButton>
              ) : null}
            </div>
          )}
          rows={[...tenants]}
          title={messages.tenants.title}
          toolbar={(
            <div className="flex w-full flex-wrap items-center gap-2">
              <form className="flex min-w-[16rem] flex-1 items-center gap-2" onSubmit={submitSearch} role="search">
                <label className="relative min-w-0 flex-1">
                  <span className="sr-only">{messages.tenants.searchLabel}</span>
                  <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--sdk-color-text-muted)]" />
                  <Input
                    aria-label={messages.tenants.searchLabel}
                    className="pl-9"
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder={messages.tenants.searchPlaceholder}
                    value={searchQuery}
                  />
                </label>
                <Button disabled={loading} type="submit" variant="secondary">
                  <Search className="h-4 w-4" />
                  {messages.tenants.applySearch}
                </Button>
              </form>
              {permissions.tenants.create ? (
                <Button onClick={() => {
                  setTenantDraft(emptyTenantDraft());
                  setTenantDrawerMode("create");
                }} type="button">
                  <Plus className="h-4 w-4" />
                  {messages.tenants.create}
                </Button>
              ) : null}
            </div>
          )}
        />

        {selectedTenant ? (
          <section className="mt-6 border-t border-[var(--sdk-color-border-subtle)] pt-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--sdk-radius-control)] bg-[var(--sdk-color-surface-panel-muted)] text-[var(--sdk-color-text-secondary)]">
                  <Building2 className="h-5 w-5" />
                </span>
                <span className="min-w-0">
                  <h2 className="truncate text-base font-semibold text-[var(--sdk-color-text-primary)]">
                    {template(messages.tenants.selectedTitleTemplate, { name: selectedTenant.name })}
                  </h2>
                  <p className="truncate text-sm text-[var(--sdk-color-text-muted)]">
                    {template(messages.tenants.selectedDescriptionTemplate, { id: selectedTenant.tenantId })}
                  </p>
                </span>
              </div>
              <SegmentedControl
                aria-label={messages.tenants.manage}
                className="w-full lg:w-auto"
                fullWidth={false}
                onValueChange={switchDetailTab}
                options={[
                  { icon: <AppWindow className="h-4 w-4" />, label: messages.tabs.applications, value: "applications" },
                  ...(permissions.members.read
                    ? [{ icon: <Users className="h-4 w-4" />, label: messages.tabs.members, value: "members" }]
                    : []),
                ]}
                value={activeTab}
              />
            </div>

            <div className="mt-5">
              {activeTab === "applications"
                ? <TenantApplicationsPanel controller={controller} tenant={selectedTenant} />
                : (
                  <DataTable
                    columns={memberColumns}
                    emptyDescription={messages.members.emptyDescription}
                    emptyTitle={messages.members.emptyTitle}
                    footer={(
                      <SdkworkIamListPaginationControls
                        busy={busy}
                        onLoadMore={() => void runAction(async () => {
                          setMembers(await controller.loadMoreTenantMembers(selectedTenant.tenantId));
                          syncState();
                        }, messages.members.loadedMore, messages.members.notices.loadError)}
                        pageInfo={listPageInfo?.members}
                      />
                    )}
                    getRowId={(member) => member.id}
                    loading={loading}
                    onRowClick={permissions.members.update ? (member) => {
                      setSelectedMember(member);
                      setMemberDraft({ roleCode: member.roleCode ?? "", userId: member.userId });
                      setMemberDrawerMode("edit");
                    } : undefined}
                    rowActions={permissions.members.update || permissions.members.delete ? (member) => (
                      <div className="flex items-center gap-2" onClick={(event) => event.stopPropagation()}>
                        {permissions.members.update ? (
                          <IconButton
                            aria-label={messages.common.edit}
                            onClick={() => {
                              setSelectedMember(member);
                              setMemberDraft({ roleCode: member.roleCode ?? "", userId: member.userId });
                              setMemberDrawerMode("edit");
                            }}
                            title={messages.common.edit}
                            variant="outline"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </IconButton>
                        ) : null}
                        {permissions.members.delete ? (
                          <Button onClick={() => setRemoveMemberTarget(member)} size="sm" type="button" variant="danger">
                            {messages.members.remove}
                          </Button>
                        ) : null}
                      </div>
                    ) : undefined}
                    rows={[...members]}
                    title={template(messages.members.titleTemplate, { name: selectedTenant.name })}
                    toolbar={permissions.members.create ? (
                      <Button onClick={() => {
                        setSelectedMember(undefined);
                        setMemberDraft(emptyMemberDraft());
                        setMemberDrawerMode("create");
                      }} type="button">
                        <Plus className="h-4 w-4" />
                        {messages.members.add}
                      </Button>
                    ) : undefined}
                  />
                )}
            </div>
          </section>
        ) : null}
      </SettingsSection>

      <TenantDrawer
        busy={busy}
        draft={tenantDraft}
        mode={tenantDrawerMode}
        onDraftChange={setTenantDraft}
        onOpenChange={(open) => { if (!open) setTenantDrawerMode(undefined); }}
        onSubmit={() => void runAction(async () => {
          if (tenantDrawerMode === "edit" && selectedTenant) {
            const updated = await controller.updateTenant(selectedTenant.tenantId, tenantDraft);
            setSelectedTenant(updated);
          } else {
            const created = await controller.createTenant(tenantDraft);
            setSelectedTenant(created);
            setActiveTab("applications");
          }
          await refreshTenants();
          setTenantDrawerMode(undefined);
        }, tenantDrawerMode === "edit" ? messages.tenants.notices.updateSuccess : messages.tenants.notices.createSuccess, messages.tenants.notices.loadError)}
      />

      <MemberDrawer
        busy={busy}
        draft={memberDraft}
        mode={memberDrawerMode}
        onDraftChange={setMemberDraft}
        onOpenChange={(open) => { if (!open) setMemberDrawerMode(undefined); }}
        onSubmit={() => {
          if (!selectedTenant) return;
          void runAction(async () => {
            if (memberDrawerMode === "edit" && selectedMember) {
              await controller.updateTenantMember(selectedTenant.tenantId, selectedMember.userId, memberDraft);
            } else {
              await controller.createTenantMember(selectedTenant.tenantId, memberDraft);
            }
            await refreshMembers(selectedTenant.tenantId);
            setMemberDrawerMode(undefined);
          }, memberDrawerMode === "edit" ? messages.members.notices.updateSuccess : messages.members.notices.addSuccess, messages.members.notices.loadError);
        }}
      />

      <ConfirmDialog
        closeOnConfirm={false}
        confirmLabel={messages.tenants.delete}
        confirmLoading={busy}
        description={deleteTenantTarget ? template(messages.tenants.deleteDescriptionTemplate, { name: deleteTenantTarget.name }) : undefined}
        onConfirm={() => {
          if (!deleteTenantTarget) return;
          void runAction(async () => {
            await controller.deleteTenant(deleteTenantTarget.tenantId);
            if (selectedTenant?.tenantId === deleteTenantTarget.tenantId) {
              setSelectedTenant(undefined);
              setMembers([]);
            }
            await refreshTenants();
            setDeleteTenantTarget(undefined);
          }, messages.tenants.notices.deleteSuccess, messages.tenants.notices.loadError);
        }}
        onOpenChange={(open) => { if (!open && !busy) setDeleteTenantTarget(undefined); }}
        open={Boolean(deleteTenantTarget)}
        title={messages.tenants.deleteTitle}
        tone="danger"
      />

      <ConfirmDialog
        closeOnConfirm={false}
        confirmLabel={messages.members.remove}
        confirmLoading={busy}
        description={removeMemberTarget ? template(messages.members.removeDescriptionTemplate, {
          name: removeMemberTarget.displayName || removeMemberTarget.username || removeMemberTarget.userId,
        }) : undefined}
        onConfirm={() => {
          if (!selectedTenant || !removeMemberTarget) return;
          void runAction(async () => {
            await controller.removeTenantMember(selectedTenant.tenantId, removeMemberTarget.userId);
            await refreshMembers(selectedTenant.tenantId);
            setRemoveMemberTarget(undefined);
          }, messages.members.notices.removeSuccess, messages.members.notices.loadError);
        }}
        onOpenChange={(open) => { if (!open && !busy) setRemoveMemberTarget(undefined); }}
        open={Boolean(removeMemberTarget)}
        title={messages.members.removeTitle}
        tone="danger"
      />
    </div>
  );
}

function TenantDrawer({ busy, draft, mode, onDraftChange, onOpenChange, onSubmit }: { busy: boolean; draft: SdkworkIamTenantDraft; mode?: "create" | "edit"; onDraftChange: (draft: SdkworkIamTenantDraft) => void; onOpenChange: (open: boolean) => void; onSubmit: () => void }) {
  const messages = useSdkworkIamTenantAdminMessages();
  const editing = mode === "edit";
  return (
    <Drawer onOpenChange={onOpenChange} open={Boolean(mode)}>
      <DrawerContent size="md">
        <DrawerHeader>
          <DrawerTitle>{editing ? messages.tenants.drawer.editTitle : messages.tenants.drawer.createTitle}</DrawerTitle>
          <DrawerDescription>{editing ? messages.tenants.drawer.editDescription : messages.tenants.drawer.createDescription}</DrawerDescription>
        </DrawerHeader>
        <DrawerBody className="space-y-4">
          <Field label={messages.tenants.drawer.name} onChange={(name) => onDraftChange({ ...draft, name })} value={draft.name} />
          <Field label={messages.tenants.drawer.code} onChange={(code) => onDraftChange({ ...draft, code })} value={draft.code ?? ""} />
          {editing ? <Field label={messages.tenants.drawer.status} onChange={(status) => onDraftChange({ ...draft, status })} value={draft.status ?? ""} /> : null}
        </DrawerBody>
        <DrawerFooter>
          <Button disabled={busy} onClick={() => onOpenChange(false)} type="button" variant="secondary">{messages.common.cancel}</Button>
          <Button disabled={busy || !draft.name.trim()} loading={busy} onClick={onSubmit} type="button">{editing ? messages.common.save : messages.tenants.create}</Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

function MemberDrawer({ busy, draft, mode, onDraftChange, onOpenChange, onSubmit }: { busy: boolean; draft: SdkworkIamTenantMemberDraft; mode?: "create" | "edit"; onDraftChange: (draft: SdkworkIamTenantMemberDraft) => void; onOpenChange: (open: boolean) => void; onSubmit: () => void }) {
  const messages = useSdkworkIamTenantAdminMessages();
  const editing = mode === "edit";
  return (
    <Drawer onOpenChange={onOpenChange} open={Boolean(mode)}>
      <DrawerContent size="md">
        <DrawerHeader>
          <DrawerTitle>{editing ? messages.members.drawer.editTitle : messages.members.drawer.addTitle}</DrawerTitle>
          <DrawerDescription>{editing ? messages.members.drawer.editDescription : messages.members.drawer.addDescription}</DrawerDescription>
        </DrawerHeader>
        <DrawerBody className="space-y-4">
          <Field disabled={editing} label={messages.members.drawer.userId} onChange={(userId) => onDraftChange({ ...draft, userId })} value={draft.userId} />
          <Field label={messages.members.drawer.roleCode} onChange={(roleCode) => onDraftChange({ ...draft, roleCode })} value={draft.roleCode ?? ""} />
        </DrawerBody>
        <DrawerFooter>
          <Button disabled={busy} onClick={() => onOpenChange(false)} type="button" variant="secondary">{messages.common.cancel}</Button>
          <Button disabled={busy || !draft.userId.trim()} loading={busy} onClick={onSubmit} type="button">{editing ? messages.common.save : messages.members.add}</Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

function Field({ disabled, label, onChange, value }: { disabled?: boolean; label: string; onChange: (value: string) => void; value: string }) {
  return (
    <label className="block space-y-1.5 text-sm">
      <span className="font-medium text-[var(--sdk-color-text-primary)]">{label}</span>
      <Input disabled={disabled} onChange={(event) => onChange(event.target.value)} value={value} />
    </label>
  );
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
