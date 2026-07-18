import { useEffect, useMemo, useState } from "react";
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
  SettingsSection,
  StatusNotice,
} from "@sdkwork/ui-pc-react";

import type {
  SdkworkIamTenant,
  SdkworkIamTenantAdminWorkspaceProps,
  SdkworkIamTenantDraft,
  SdkworkIamTenantMember,
  SdkworkIamTenantMemberDraft,
} from "../types/tenant-admin-types";

const emptyTenantDraft = (): SdkworkIamTenantDraft => ({ code: "", name: "" });
const emptyMemberDraft = (): SdkworkIamTenantMemberDraft => ({ roleCode: "", userId: "" });

export function SdkworkIamTenantAdminWorkspace({
  controller,
  description = "Create, update, and manage tenant scope and member assignments for backend-admin operators.",
  title = "Tenant administration",
}: SdkworkIamTenantAdminWorkspaceProps) {
  const initialState = controller.getState();
  const [tenants, setTenants] = useState(initialState.tenants);
  const [members, setMembers] = useState(initialState.members);
  const [listPageInfo, setListPageInfo] = useState(initialState.listPageInfo);
  const [selectedTenant, setSelectedTenant] = useState<SdkworkIamTenant>();
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

  const syncState = () => {
    const state = controller.getState();
    setListPageInfo(state.listPageInfo);
  };

  const refreshTenants = async () => {
    const items = await controller.listTenants();
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
      .catch((loadError) => setError(toErrorMessage(loadError, "Failed to load tenants")))
      .finally(() => setLoading(false));
  }, [controller]);

  const runAction = async (action: () => Promise<void>, successMessage: string) => {
    setBusy(true);
    setError(undefined);
    setNotice(undefined);
    try {
      await action();
      setNotice(successMessage);
    } catch (actionError) {
      setError(toErrorMessage(actionError, "Operation failed"));
    } finally {
      setBusy(false);
    }
  };

  const openTenant = async (tenant: SdkworkIamTenant) => {
    setError(undefined);
    try {
      const resolved = await controller.selectTenant(tenant.tenantId) ?? tenant;
      setSelectedTenant(resolved);
      setTenantDraft({ code: resolved.code ?? "", name: resolved.name, status: resolved.status ?? "" });
      await refreshMembers(resolved.tenantId);
      setTenantDrawerMode("edit");
    } catch (loadError) {
      setError(toErrorMessage(loadError, "Failed to load tenant"));
    }
  };

  const tenantColumns = useMemo<DataTableColumn<SdkworkIamTenant>[]>(() => [
    { id: "name", header: "Tenant", cell: (tenant) => tenant.name },
    { id: "code", header: "Code", cell: (tenant) => tenant.code || "—" },
    { id: "tenantId", header: "Tenant ID", cell: (tenant) => tenant.tenantId },
    { id: "status", header: "Status", cell: (tenant) => tenant.status || "—" },
  ], []);

  const memberColumns = useMemo<DataTableColumn<SdkworkIamTenantMember>[]>(() => [
    { id: "member", header: "Member", cell: (member) => member.displayName || member.username || member.email || member.userId },
    { id: "userId", header: "User ID", cell: (member) => member.userId },
    { id: "roleCode", header: "Role", cell: (member) => member.roleCode || "—" },
    { id: "status", header: "Status", cell: (member) => member.status || "—" },
  ], []);

  return (
    <div className="space-y-6">
      <SettingsSection description={description} title={title}>
        {error ? <StatusNotice tone="danger">{error}</StatusNotice> : null}
        {notice ? <StatusNotice tone="success">{notice}</StatusNotice> : null}
        <DataTable
          columns={tenantColumns}
          emptyDescription="Create a tenant to define an IAM isolation boundary."
          emptyTitle="No tenants found"
          footer={(
            <SdkworkIamListPaginationControls
              busy={busy}
              onLoadMore={() => void runAction(async () => {
                setTenants(await controller.loadMoreTenants());
                syncState();
              }, "Loaded more tenants")}
              pageInfo={listPageInfo?.tenants}
            />
          )}
          getRowId={(tenant) => tenant.tenantId}
          loading={loading}
          onRowClick={(tenant) => void openTenant(tenant)}
          rowActions={(tenant) => (
            <div className="flex items-center gap-2">
              <Button onClick={() => void openTenant(tenant)} size="sm" type="button" variant="outline">Manage</Button>
              <Button onClick={() => setDeleteTenantTarget(tenant)} size="sm" type="button" variant="danger">Delete</Button>
            </div>
          )}
          rows={[...tenants]}
          title="Tenants"
          toolbar={<Button onClick={() => { setTenantDraft(emptyTenantDraft()); setSelectedTenant(undefined); setTenantDrawerMode("create"); }} type="button">Create tenant</Button>}
        />

        {selectedTenant ? (
          <DataTable
            className="mt-6"
            columns={memberColumns}
            emptyDescription="Add users to this tenant and assign their tenant role."
            emptyTitle="No tenant members"
            footer={(
              <SdkworkIamListPaginationControls
                busy={busy}
                onLoadMore={() => void runAction(async () => {
                  setMembers(await controller.loadMoreTenantMembers(selectedTenant.tenantId));
                  syncState();
                }, "Loaded more members")}
                pageInfo={listPageInfo?.members}
              />
            )}
            getRowId={(member) => member.id}
            onRowClick={(member) => {
              setSelectedMember(member);
              setMemberDraft({ roleCode: member.roleCode ?? "", userId: member.userId });
              setMemberDrawerMode("edit");
            }}
            rowActions={(member) => (
              <div className="flex items-center gap-2">
                <Button onClick={() => { setSelectedMember(member); setMemberDraft({ roleCode: member.roleCode ?? "", userId: member.userId }); setMemberDrawerMode("edit"); }} size="sm" type="button" variant="outline">Edit</Button>
                <Button onClick={() => setRemoveMemberTarget(member)} size="sm" type="button" variant="danger">Remove</Button>
              </div>
            )}
            rows={[...members]}
            title={`${selectedTenant.name} members`}
            toolbar={<Button onClick={() => { setSelectedMember(undefined); setMemberDraft(emptyMemberDraft()); setMemberDrawerMode("create"); }} type="button">Add member</Button>}
          />
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
            await refreshMembers(created.tenantId);
          }
          await refreshTenants();
          setTenantDrawerMode(undefined);
        }, tenantDrawerMode === "edit" ? "Tenant updated" : "Tenant created")}
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
          }, memberDrawerMode === "edit" ? "Member updated" : "Member added");
        }}
      />

      <ConfirmDialog
        closeOnConfirm={false}
        confirmLabel="Delete tenant"
        confirmLoading={busy}
        description={deleteTenantTarget ? `Delete ${deleteTenantTarget.name}? This action cannot be undone.` : undefined}
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
          }, "Tenant deleted");
        }}
        onOpenChange={(open) => { if (!open && !busy) setDeleteTenantTarget(undefined); }}
        open={Boolean(deleteTenantTarget)}
        title="Delete tenant"
        tone="danger"
      />

      <ConfirmDialog
        closeOnConfirm={false}
        confirmLabel="Remove member"
        confirmLoading={busy}
        description={removeMemberTarget ? `Remove ${removeMemberTarget.displayName || removeMemberTarget.username || removeMemberTarget.userId} from this tenant?` : undefined}
        onConfirm={() => {
          if (!selectedTenant || !removeMemberTarget) return;
          void runAction(async () => {
            await controller.removeTenantMember(selectedTenant.tenantId, removeMemberTarget.userId);
            await refreshMembers(selectedTenant.tenantId);
            setRemoveMemberTarget(undefined);
          }, "Member removed");
        }}
        onOpenChange={(open) => { if (!open && !busy) setRemoveMemberTarget(undefined); }}
        open={Boolean(removeMemberTarget)}
        title="Remove tenant member"
        tone="danger"
      />
    </div>
  );
}

function TenantDrawer({ busy, draft, mode, onDraftChange, onOpenChange, onSubmit }: { busy: boolean; draft: SdkworkIamTenantDraft; mode?: "create" | "edit"; onDraftChange: (draft: SdkworkIamTenantDraft) => void; onOpenChange: (open: boolean) => void; onSubmit: () => void }) {
  const editing = mode === "edit";
  return (
    <Drawer open={Boolean(mode)} onOpenChange={onOpenChange}>
      <DrawerContent size="md">
        <DrawerHeader><DrawerTitle>{editing ? "Edit tenant" : "Create tenant"}</DrawerTitle><DrawerDescription>{editing ? "Update the selected tenant boundary." : "Create a new tenant isolation boundary."}</DrawerDescription></DrawerHeader>
        <DrawerBody className="space-y-4">
          <Field label="Name" onChange={(name) => onDraftChange({ ...draft, name })} value={draft.name} />
          <Field label="Code" onChange={(code) => onDraftChange({ ...draft, code })} value={draft.code ?? ""} />
          {editing ? <Field label="Status" onChange={(status) => onDraftChange({ ...draft, status })} value={draft.status ?? ""} /> : null}
        </DrawerBody>
        <DrawerFooter><Button disabled={busy} onClick={() => onOpenChange(false)} type="button" variant="secondary">Cancel</Button><Button disabled={busy || !draft.name.trim()} loading={busy} onClick={onSubmit} type="button">{editing ? "Save changes" : "Create tenant"}</Button></DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

function MemberDrawer({ busy, draft, mode, onDraftChange, onOpenChange, onSubmit }: { busy: boolean; draft: SdkworkIamTenantMemberDraft; mode?: "create" | "edit"; onDraftChange: (draft: SdkworkIamTenantMemberDraft) => void; onOpenChange: (open: boolean) => void; onSubmit: () => void }) {
  const editing = mode === "edit";
  return (
    <Drawer open={Boolean(mode)} onOpenChange={onOpenChange}>
      <DrawerContent size="sm">
        <DrawerHeader><DrawerTitle>{editing ? "Edit tenant member" : "Add tenant member"}</DrawerTitle><DrawerDescription>Assign a user and tenant role.</DrawerDescription></DrawerHeader>
        <DrawerBody className="space-y-4"><Field disabled={editing} label="User ID" onChange={(userId) => onDraftChange({ ...draft, userId })} value={draft.userId} /><Field label="Role code" onChange={(roleCode) => onDraftChange({ ...draft, roleCode })} value={draft.roleCode ?? ""} /></DrawerBody>
        <DrawerFooter><Button disabled={busy} onClick={() => onOpenChange(false)} type="button" variant="secondary">Cancel</Button><Button disabled={busy || !draft.userId.trim()} loading={busy} onClick={onSubmit} type="button">{editing ? "Save changes" : "Add member"}</Button></DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

function toErrorMessage(error: unknown, fallback: string) { return error instanceof Error ? error.message : fallback; }

function Field({ disabled, label, onChange, value }: { disabled?: boolean; label: string; onChange: (value: string) => void; value: string }) {
  return <label className="block space-y-2 text-sm"><span>{label}</span><input className="w-full rounded-[0.75rem] border border-[var(--sdk-color-border-default)] bg-transparent px-3 py-2" disabled={disabled} onChange={(event) => onChange(event.target.value)} value={value} /></label>;
}
