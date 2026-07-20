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
  StatusBadge,
  StatusNotice,
} from "@sdkwork/ui-pc-react";

import type {
  SdkworkIamDepartment,
  SdkworkIamDepartmentDraft,
  SdkworkIamOrganization,
  SdkworkIamOrganizationAdminWorkspaceProps,
  SdkworkIamOrganizationDraft,
  SdkworkIamOrganizationMembership,
  SdkworkIamOrganizationMembershipDraft,
  SdkworkIamOrganizationState,
  SdkworkIamPosition,
  SdkworkIamRoleBinding,
} from "../types/organization-admin-types";

type PageInfoState = Pick<SdkworkIamOrganizationState, "departmentListPageInfo" | "membershipListPageInfo" | "organizationListPageInfo" | "positionListPageInfo" | "roleBindingListPageInfo">;
type DrawerMode = "create" | "edit";

const emptyOrganizationDraft = (): SdkworkIamOrganizationDraft => ({ name: "" });
const emptyDepartmentDraft = (organizationId: string): SdkworkIamDepartmentDraft => ({ name: "", organizationId });
const emptyMembershipDraft = (): SdkworkIamOrganizationMembershipDraft => ({ userId: "" });

export function SdkworkIamOrganizationAdminWorkspace({ controller, description = "Create, update, and manage organization hierarchy, departments, and memberships for backend-admin operators.", title = "Organization administration" }: SdkworkIamOrganizationAdminWorkspaceProps) {
  const state = controller.getState();
  const [organizations, setOrganizations] = useState(state.organizations);
  const [departments, setDepartments] = useState(state.departments);
  const [memberships, setMemberships] = useState(state.memberships);
  const [positions, setPositions] = useState(state.positions);
  const [roleBindings, setRoleBindings] = useState(state.roleBindings);
  const [pageInfo, setPageInfo] = useState<PageInfoState>({});
  const [selectedOrganization, setSelectedOrganization] = useState<SdkworkIamOrganization>();
  const [selectedDepartment, setSelectedDepartment] = useState<SdkworkIamDepartment>();
  const [selectedMembership, setSelectedMembership] = useState<SdkworkIamOrganizationMembership>();
  const [organizationDraft, setOrganizationDraft] = useState<SdkworkIamOrganizationDraft>(emptyOrganizationDraft);
  const [departmentDraft, setDepartmentDraft] = useState<SdkworkIamDepartmentDraft>(() => emptyDepartmentDraft(""));
  const [membershipDraft, setMembershipDraft] = useState<SdkworkIamOrganizationMembershipDraft>(emptyMembershipDraft);
  const [organizationDrawerMode, setOrganizationDrawerMode] = useState<DrawerMode>();
  const [departmentDrawerMode, setDepartmentDrawerMode] = useState<DrawerMode>();
  const [membershipDrawerMode, setMembershipDrawerMode] = useState<DrawerMode>();
  const [deleteOrganizationTarget, setDeleteOrganizationTarget] = useState<SdkworkIamOrganization>();
  const [deleteDepartmentTarget, setDeleteDepartmentTarget] = useState<SdkworkIamDepartment>();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [notice, setNotice] = useState<string>();

  const syncPageInfo = () => {
    const next = controller.getState();
    setPageInfo({ departmentListPageInfo: next.departmentListPageInfo, membershipListPageInfo: next.membershipListPageInfo, organizationListPageInfo: next.organizationListPageInfo, positionListPageInfo: next.positionListPageInfo, roleBindingListPageInfo: next.roleBindingListPageInfo });
  };
  const refreshOrganizations = async () => { const items = await controller.listOrganizations(); setOrganizations(items); syncPageInfo(); return items; };
  const refreshDepartments = async (id: string) => { const items = await controller.listDepartments(id); setDepartments(items); syncPageInfo(); return items; };
  const refreshMemberships = async (id: string) => { const items = await controller.listMemberships(id); setMemberships(items); syncPageInfo(); return items; };
  const refreshDetails = async (id: string) => {
    const [nextDepartments, nextMemberships, nextPositions, nextBindings] = await Promise.all([controller.listDepartments(id), controller.listMemberships(id), controller.listPositions({ organizationId: id }), controller.listRoleBindings({ organizationId: id })]);
    setDepartments(nextDepartments); setMemberships(nextMemberships); setPositions(nextPositions); setRoleBindings(nextBindings); syncPageInfo();
  };

  useEffect(() => {
    setLoading(true);
    void refreshOrganizations().catch((loadError) => setError(toErrorMessage(loadError, "Failed to load organizations"))).finally(() => setLoading(false));
  }, [controller]);

  const runAction = async (action: () => Promise<void>, successMessage: string) => {
    setBusy(true); setError(undefined); setNotice(undefined);
    try { await action(); setNotice(successMessage); } catch (actionError) { setError(toErrorMessage(actionError, "Operation failed")); } finally { setBusy(false); }
  };

  const manageOrganization = async (organization: SdkworkIamOrganization) => {
    setError(undefined);
    try {
      const resolved = await controller.selectOrganization(organization.organizationId) ?? organization;
      setSelectedOrganization(resolved);
      setOrganizationDraft({ code: resolved.code ?? "", name: resolved.name, parentId: resolved.parentId ?? "", status: resolved.status ?? "", tenantId: resolved.tenantId ?? "" });
      await refreshDetails(resolved.organizationId);
      setOrganizationDrawerMode("edit");
    } catch (loadError) { setError(toErrorMessage(loadError, "Failed to load organization")); }
  };

  const organizationColumns = useMemo<DataTableColumn<SdkworkIamOrganization>[]>(() => [
    { id: "name", header: "Organization", cell: (item) => item.name },
    { id: "code", header: "Code", cell: (item) => item.code || "—" },
    { id: "parent", header: "Parent", cell: (item) => item.parentId || "—" },
    { id: "status", header: "Status", cell: (item) => item.status ? <StatusBadge label={item.status} showIcon status={item.status} /> : "—" },
  ], []);
  const departmentColumns = useMemo<DataTableColumn<SdkworkIamDepartment>[]>(() => [
    { id: "name", header: "Department", cell: (item) => item.name },
    { id: "code", header: "Code", cell: (item) => item.code || "—" },
    { id: "parent", header: "Parent department", cell: (item) => item.parentDepartmentId || "—" },
    { id: "status", header: "Status", cell: (item) => item.status ? <StatusBadge label={item.status} showIcon status={item.status} /> : "—" },
  ], []);
  const membershipColumns = useMemo<DataTableColumn<SdkworkIamOrganizationMembership>[]>(() => [
    { id: "member", header: "Member", cell: (item) => item.displayName || item.username || item.email || item.userId },
    { id: "role", header: "Role", cell: (item) => item.roleCode || "—" },
    { id: "kind", header: "Membership type", cell: (item) => item.membershipKind || "—" },
    { id: "status", header: "Status", cell: (item) => item.status ? <StatusBadge label={item.status} showIcon status={item.status} /> : "—" },
  ], []);
  const positionColumns = useMemo<DataTableColumn<SdkworkIamPosition>[]>(() => [
    { id: "name", header: "Position", cell: (item) => item.name },
    { id: "department", header: "Department ID", cell: (item) => item.departmentId || "—" },
    { id: "status", header: "Status", cell: (item) => item.status ? <StatusBadge label={item.status} showIcon status={item.status} /> : "—" },
  ], []);
  const bindingColumns = useMemo<DataTableColumn<SdkworkIamRoleBinding>[]>(() => [
    { id: "principal", header: "Principal", cell: (item) => `${item.principalKind || "principal"}:${item.principalId || item.id}` },
    { id: "role", header: "Role ID", cell: (item) => item.roleId || "—" },
    { id: "scope", header: "Scope", cell: (item) => `${item.scopeKind || "—"}:${item.scopeId || "—"}` },
    { id: "status", header: "Status", cell: (item) => item.status ? <StatusBadge label={item.status} showIcon status={item.status} /> : "—" },
  ], []);

  return (
    <div className="space-y-6">
      <SettingsSection description={description} title={title}>
        {error ? <StatusNotice tone="danger">{error}</StatusNotice> : null}
        {notice ? <StatusNotice tone="success">{notice}</StatusNotice> : null}
        <DataTable columns={organizationColumns} emptyTitle="No organizations found" footer={<SdkworkIamListPaginationControls busy={busy} onLoadMore={() => void runAction(async () => { setOrganizations(await controller.loadMoreOrganizations()); syncPageInfo(); }, "Loaded more organizations")} pageInfo={pageInfo.organizationListPageInfo} />} getRowId={(item) => item.organizationId} loading={loading} onRowClick={(item) => void manageOrganization(item)} rowActions={(item) => <div className="flex gap-2"><Button onClick={() => void manageOrganization(item)} size="sm" type="button" variant="outline">Manage</Button><Button onClick={() => setDeleteOrganizationTarget(item)} size="sm" type="button" variant="danger">Delete</Button></div>} rows={[...organizations]} title="Organizations" toolbar={<Button onClick={() => { setSelectedOrganization(undefined); setOrganizationDraft(emptyOrganizationDraft()); setOrganizationDrawerMode("create"); }} type="button">Create organization</Button>} />

        {selectedOrganization ? <div className="mt-6 space-y-6">
          <DataTable columns={departmentColumns} emptyTitle="No departments" footer={<SdkworkIamListPaginationControls busy={busy} onLoadMore={() => void runAction(async () => { setDepartments(await controller.loadMoreDepartments(selectedOrganization.organizationId)); syncPageInfo(); }, "Loaded more departments")} pageInfo={pageInfo.departmentListPageInfo} />} getRowId={(item) => item.departmentId} onRowClick={(item) => { setSelectedDepartment(item); setDepartmentDraft({ code: item.code ?? "", name: item.name, organizationId: item.organizationId, parentDepartmentId: item.parentDepartmentId ?? "", status: item.status ?? "" }); setDepartmentDrawerMode("edit"); }} rowActions={(item) => <div className="flex gap-2"><Button onClick={() => { setSelectedDepartment(item); setDepartmentDraft({ code: item.code ?? "", name: item.name, organizationId: item.organizationId, parentDepartmentId: item.parentDepartmentId ?? "", status: item.status ?? "" }); setDepartmentDrawerMode("edit"); }} size="sm" type="button" variant="outline">Edit</Button><Button onClick={() => setDeleteDepartmentTarget(item)} size="sm" type="button" variant="danger">Delete</Button></div>} rows={[...departments]} title={`${selectedOrganization.name} departments`} toolbar={<Button onClick={() => { setSelectedDepartment(undefined); setDepartmentDraft(emptyDepartmentDraft(selectedOrganization.organizationId)); setDepartmentDrawerMode("create"); }} type="button">Create department</Button>} />
          <DataTable columns={membershipColumns} emptyTitle="No organization members" footer={<SdkworkIamListPaginationControls busy={busy} onLoadMore={() => void runAction(async () => { setMemberships(await controller.loadMoreMemberships(selectedOrganization.organizationId)); syncPageInfo(); }, "Loaded more memberships")} pageInfo={pageInfo.membershipListPageInfo} />} getRowId={(item) => item.id} onRowClick={(item) => { setSelectedMembership(item); setMembershipDraft({ membershipKind: item.membershipKind ?? "", roleCode: item.roleCode ?? "", status: item.status ?? "", userId: item.userId }); setMembershipDrawerMode("edit"); }} rowActions={(item) => <Button onClick={() => { setSelectedMembership(item); setMembershipDraft({ membershipKind: item.membershipKind ?? "", roleCode: item.roleCode ?? "", status: item.status ?? "", userId: item.userId }); setMembershipDrawerMode("edit"); }} size="sm" type="button" variant="outline">Edit</Button>} rows={[...memberships]} title="Memberships" toolbar={<Button onClick={() => { setSelectedMembership(undefined); setMembershipDraft(emptyMembershipDraft()); setMembershipDrawerMode("create"); }} type="button">Add member</Button>} />
          <DataTable columns={positionColumns} emptyTitle="No positions" footer={<SdkworkIamListPaginationControls busy={busy} onLoadMore={() => void runAction(async () => { setPositions(await controller.loadMorePositions()); syncPageInfo(); }, "Loaded more positions")} pageInfo={pageInfo.positionListPageInfo} />} getRowId={(item) => item.positionId} rows={[...positions]} title="Positions" />
          <DataTable columns={bindingColumns} emptyTitle="No role bindings" footer={<SdkworkIamListPaginationControls busy={busy} onLoadMore={() => void runAction(async () => { setRoleBindings(await controller.loadMoreRoleBindings()); syncPageInfo(); }, "Loaded more role bindings")} pageInfo={pageInfo.roleBindingListPageInfo} />} getRowId={(item) => item.id} rows={[...roleBindings]} title="Role bindings" />
        </div> : null}
      </SettingsSection>

      <ResourceDrawer busy={busy} description={organizationDrawerMode === "edit" ? "Update the selected organization." : "Create an organization hierarchy node."} mode={organizationDrawerMode} onOpenChange={(open) => { if (!open) setOrganizationDrawerMode(undefined); }} onSubmit={() => void runAction(async () => { if (organizationDrawerMode === "edit" && selectedOrganization) { setSelectedOrganization(await controller.updateOrganization(selectedOrganization.organizationId, organizationDraft)); } else { const created = await controller.createOrganization(organizationDraft); setSelectedOrganization(created); await refreshDetails(created.organizationId); } await refreshOrganizations(); setOrganizationDrawerMode(undefined); }, organizationDrawerMode === "edit" ? "Organization updated" : "Organization created")} submitDisabled={!organizationDraft.name.trim()} title={organizationDrawerMode === "edit" ? "Edit organization" : "Create organization"}><Field label="Name" onChange={(name) => setOrganizationDraft({ ...organizationDraft, name })} value={organizationDraft.name} /><Field label="Code" onChange={(code) => setOrganizationDraft({ ...organizationDraft, code })} value={organizationDraft.code ?? ""} /><Field label="Parent ID" onChange={(parentId) => setOrganizationDraft({ ...organizationDraft, parentId })} value={organizationDraft.parentId ?? ""} />{organizationDrawerMode === "edit" ? <Field label="Status" onChange={(status) => setOrganizationDraft({ ...organizationDraft, status })} value={organizationDraft.status ?? ""} /> : null}</ResourceDrawer>

      <ResourceDrawer busy={busy} description="Manage a department within the selected organization." mode={departmentDrawerMode} onOpenChange={(open) => { if (!open) setDepartmentDrawerMode(undefined); }} onSubmit={() => { if (!selectedOrganization) return; void runAction(async () => { if (departmentDrawerMode === "edit" && selectedDepartment) await controller.updateDepartment(selectedDepartment.departmentId, departmentDraft); else await controller.createDepartment({ ...departmentDraft, organizationId: selectedOrganization.organizationId }); await refreshDepartments(selectedOrganization.organizationId); setDepartmentDrawerMode(undefined); }, departmentDrawerMode === "edit" ? "Department updated" : "Department created"); }} submitDisabled={!departmentDraft.name.trim()} title={departmentDrawerMode === "edit" ? "Edit department" : "Create department"}><Field label="Name" onChange={(name) => setDepartmentDraft({ ...departmentDraft, name })} value={departmentDraft.name} /><Field label="Code" onChange={(code) => setDepartmentDraft({ ...departmentDraft, code })} value={departmentDraft.code ?? ""} /><Field label="Parent department ID" onChange={(parentDepartmentId) => setDepartmentDraft({ ...departmentDraft, parentDepartmentId })} value={departmentDraft.parentDepartmentId ?? ""} />{departmentDrawerMode === "edit" ? <Field label="Status" onChange={(status) => setDepartmentDraft({ ...departmentDraft, status })} value={departmentDraft.status ?? ""} /> : null}</ResourceDrawer>

      <ResourceDrawer busy={busy} description="Assign a user to this organization and configure membership attributes." mode={membershipDrawerMode} onOpenChange={(open) => { if (!open) setMembershipDrawerMode(undefined); }} onSubmit={() => { if (!selectedOrganization) return; void runAction(async () => { if (membershipDrawerMode === "edit" && selectedMembership?.membershipId) await controller.updateMembership(selectedMembership.membershipId, membershipDraft); else await controller.addMembership(selectedOrganization.organizationId, membershipDraft); await refreshMemberships(selectedOrganization.organizationId); setMembershipDrawerMode(undefined); }, membershipDrawerMode === "edit" ? "Membership updated" : "Member added"); }} submitDisabled={!membershipDraft.userId.trim()} title={membershipDrawerMode === "edit" ? "Edit membership" : "Add organization member"}><Field disabled={membershipDrawerMode === "edit"} label="User ID" onChange={(userId) => setMembershipDraft({ ...membershipDraft, userId })} value={membershipDraft.userId} /><Field label="Role code" onChange={(roleCode) => setMembershipDraft({ ...membershipDraft, roleCode })} value={membershipDraft.roleCode ?? ""} /><Field label="Membership type" onChange={(membershipKind) => setMembershipDraft({ ...membershipDraft, membershipKind })} value={membershipDraft.membershipKind ?? ""} />{membershipDrawerMode === "edit" ? <Field label="Status" onChange={(status) => setMembershipDraft({ ...membershipDraft, status })} value={membershipDraft.status ?? ""} /> : null}</ResourceDrawer>

      <ConfirmDialog closeOnConfirm={false} confirmLabel="Delete organization" confirmLoading={busy} description={deleteOrganizationTarget ? `Delete ${deleteOrganizationTarget.name}? This action cannot be undone.` : undefined} onConfirm={() => { if (!deleteOrganizationTarget) return; void runAction(async () => { await controller.deleteOrganization(deleteOrganizationTarget.organizationId); if (selectedOrganization?.organizationId === deleteOrganizationTarget.organizationId) { setSelectedOrganization(undefined); setDepartments([]); setMemberships([]); setPositions([]); setRoleBindings([]); } await refreshOrganizations(); setDeleteOrganizationTarget(undefined); }, "Organization deleted"); }} onOpenChange={(open) => { if (!open && !busy) setDeleteOrganizationTarget(undefined); }} open={Boolean(deleteOrganizationTarget)} title="Delete organization" tone="danger" />
      <ConfirmDialog closeOnConfirm={false} confirmLabel="Delete department" confirmLoading={busy} description={deleteDepartmentTarget ? `Delete ${deleteDepartmentTarget.name}? This action cannot be undone.` : undefined} onConfirm={() => { if (!selectedOrganization || !deleteDepartmentTarget) return; void runAction(async () => { await controller.deleteDepartment(deleteDepartmentTarget.departmentId); await refreshDepartments(selectedOrganization.organizationId); setDeleteDepartmentTarget(undefined); }, "Department deleted"); }} onOpenChange={(open) => { if (!open && !busy) setDeleteDepartmentTarget(undefined); }} open={Boolean(deleteDepartmentTarget)} title="Delete department" tone="danger" />
    </div>
  );
}

function ResourceDrawer({ busy, children, description, mode, onOpenChange, onSubmit, submitDisabled, title }: { busy: boolean; children: React.ReactNode; description: string; mode?: DrawerMode; onOpenChange: (open: boolean) => void; onSubmit: () => void; submitDisabled: boolean; title: string }) {
  return <Drawer open={Boolean(mode)} onOpenChange={onOpenChange}><DrawerContent size="md"><DrawerHeader><DrawerTitle>{title}</DrawerTitle><DrawerDescription>{description}</DrawerDescription></DrawerHeader><DrawerBody className="space-y-4">{children}</DrawerBody><DrawerFooter><Button disabled={busy} onClick={() => onOpenChange(false)} type="button" variant="secondary">Cancel</Button><Button disabled={busy || submitDisabled} loading={busy} onClick={onSubmit} type="button">{mode === "edit" ? "Save changes" : "Create"}</Button></DrawerFooter></DrawerContent></Drawer>;
}

function toErrorMessage(error: unknown, fallback: string) { return error instanceof Error ? error.message : fallback; }
function Field({ disabled, label, onChange, value }: { disabled?: boolean; label: string; onChange: (value: string) => void; value: string }) { return <label className="block space-y-2 text-sm"><span>{label}</span><input className="w-full rounded-[0.75rem] border border-[var(--sdk-color-border-default)] bg-transparent px-3 py-2" disabled={disabled} onChange={(event) => onChange(event.target.value)} value={value} /></label>; }
