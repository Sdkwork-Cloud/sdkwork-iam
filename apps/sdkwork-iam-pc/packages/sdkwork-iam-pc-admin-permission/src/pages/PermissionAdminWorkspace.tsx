import { useEffect, useMemo, useState, type ReactNode } from "react";
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
  SdkworkIamPermission,
  SdkworkIamPermissionAdminWorkspaceProps,
  SdkworkIamPermissionDraft,
  SdkworkIamPolicy,
  SdkworkIamPolicyDraft,
  SdkworkIamRole,
  SdkworkIamRoleBinding,
  SdkworkIamRoleBindingDraft,
  SdkworkIamRoleDraft,
} from "../types/permission-admin-types";

type CatalogKind = "role" | "permission" | "policy";
type CatalogTarget = { id: string; kind: CatalogKind; label: string };
const emptyRoleDraft = (): SdkworkIamRoleDraft => ({ name: "" });
const emptyPermissionDraft = (): SdkworkIamPermissionDraft => ({ code: "", name: "" });
const emptyPolicyDraft = (): SdkworkIamPolicyDraft => ({ name: "" });
const emptyBindingDraft = (): SdkworkIamRoleBindingDraft => ({ principalId: "", principalKind: "user", roleId: "", scopeId: "", scopeKind: "organization" });

export function SdkworkIamPermissionAdminWorkspace({ controller, description = "Create roles, permissions, policies, and role bindings for backend-admin operators.", title = "Permission administration" }: SdkworkIamPermissionAdminWorkspaceProps) {
  const initial = controller.getState();
  const [roles, setRoles] = useState(initial.roles);
  const [permissions, setPermissions] = useState(initial.permissions);
  const [policies, setPolicies] = useState(initial.policies);
  const [roleBindings, setRoleBindings] = useState(initial.roleBindings);
  const [listPageInfo, setListPageInfo] = useState(initial.listPageInfo);
  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [rolePermissions, setRolePermissions] = useState<readonly SdkworkIamPermission[]>([]);
  const [roleDraft, setRoleDraft] = useState<SdkworkIamRoleDraft>(emptyRoleDraft);
  const [permissionDraft, setPermissionDraft] = useState<SdkworkIamPermissionDraft>(emptyPermissionDraft);
  const [policyDraft, setPolicyDraft] = useState<SdkworkIamPolicyDraft>(emptyPolicyDraft);
  const [bindingDraft, setBindingDraft] = useState<SdkworkIamRoleBindingDraft>(emptyBindingDraft);
  const [assignPermissionId, setAssignPermissionId] = useState("");
  const [drawer, setDrawer] = useState<{ kind: CatalogKind; mode: "create" | "edit" }>();
  const [assignmentDrawer, setAssignmentDrawer] = useState<"permission" | "binding">();
  const [selectedRole, setSelectedRole] = useState<SdkworkIamRole>();
  const [selectedPermission, setSelectedPermission] = useState<SdkworkIamPermission>();
  const [selectedPolicy, setSelectedPolicy] = useState<SdkworkIamPolicy>();
  const [deleteTarget, setDeleteTarget] = useState<CatalogTarget>();
  const [revokePermissionTarget, setRevokePermissionTarget] = useState<SdkworkIamPermission>();
  const [revokeBindingTarget, setRevokeBindingTarget] = useState<SdkworkIamRoleBinding>();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [notice, setNotice] = useState<string>();

  const syncPageInfo = () => setListPageInfo(controller.getState().listPageInfo);
  const refreshCatalog = async () => {
    const [nextRoles, nextPermissions, nextPolicies] = await Promise.all([controller.listRoles(), controller.listPermissions(), controller.listPolicies()]);
    setRoles(nextRoles); setPermissions(nextPermissions); setPolicies(nextPolicies); syncPageInfo();
  };
  const refreshRoleDetails = async (roleId: string) => {
    const [nextPermissions, nextBindings] = await Promise.all([controller.listRolePermissions(roleId), controller.listRoleBindings({ roleId })]);
    setRolePermissions(nextPermissions); setRoleBindings(nextBindings); syncPageInfo();
  };

  useEffect(() => {
    setLoading(true);
    void refreshCatalog().catch((loadError) => setError(toErrorMessage(loadError, "Failed to load permission catalog"))).finally(() => setLoading(false));
  }, [controller]);
  useEffect(() => {
    if (!selectedRoleId) { setRolePermissions([]); setRoleBindings([]); return; }
    void refreshRoleDetails(selectedRoleId).catch((loadError) => setError(toErrorMessage(loadError, "Failed to load role details")));
  }, [controller, selectedRoleId]);

  const runAction = async (action: () => Promise<void>, successMessage: string) => {
    setBusy(true); setError(undefined); setNotice(undefined);
    try { await action(); setNotice(successMessage); } catch (actionError) { setError(toErrorMessage(actionError, "Operation failed")); } finally { setBusy(false); }
  };

  const openCreate = (kind: CatalogKind) => {
    if (kind === "role") { setSelectedRole(undefined); setRoleDraft(emptyRoleDraft()); }
    if (kind === "permission") { setSelectedPermission(undefined); setPermissionDraft(emptyPermissionDraft()); }
    if (kind === "policy") { setSelectedPolicy(undefined); setPolicyDraft(emptyPolicyDraft()); }
    setDrawer({ kind, mode: "create" });
  };
  const openRoleEdit = (role: SdkworkIamRole) => { setSelectedRole(role); setRoleDraft({ code: role.code ?? "", name: role.name, status: role.status ?? "", tenantId: role.tenantId ?? "" }); setDrawer({ kind: "role", mode: "edit" }); };
  const openPermissionEdit = (permission: SdkworkIamPermission) => { setSelectedPermission(permission); setPermissionDraft({ action: permission.action ?? "", code: permission.code, name: permission.name, resource: permission.resource ?? "" }); setDrawer({ kind: "permission", mode: "edit" }); };
  const openPolicyEdit = (policy: SdkworkIamPolicy) => { setSelectedPolicy(policy); setPolicyDraft({ code: policy.code ?? "", name: policy.name, status: policy.status ?? "", tenantId: policy.tenantId ?? "" }); setDrawer({ kind: "policy", mode: "edit" }); };

  const roleColumns = useMemo<DataTableColumn<SdkworkIamRole>[]>(() => [
    { id: "name", header: "Role", cell: (item) => item.name }, { id: "code", header: "Code", cell: (item) => item.code || "—" }, { id: "status", header: "Status", cell: (item) => item.status || "—" },
  ], []);
  const permissionColumns = useMemo<DataTableColumn<SdkworkIamPermission>[]>(() => [
    { id: "name", header: "Permission", cell: (item) => item.name }, { id: "code", header: "Code", cell: (item) => item.code }, { id: "resource", header: "Resource", cell: (item) => item.resource || "—" }, { id: "action", header: "Action", cell: (item) => item.action || "—" },
  ], []);
  const policyColumns = useMemo<DataTableColumn<SdkworkIamPolicy>[]>(() => [
    { id: "name", header: "Policy", cell: (item) => item.name }, { id: "code", header: "Code", cell: (item) => item.code || "—" }, { id: "status", header: "Status", cell: (item) => item.status || "—" },
  ], []);
  const bindingColumns = useMemo<DataTableColumn<SdkworkIamRoleBinding>[]>(() => [
    { id: "principal", header: "Principal", cell: (item) => `${item.principalKind}:${item.principalId}` }, { id: "scope", header: "Scope", cell: (item) => `${item.scopeKind}:${item.scopeId}` }, { id: "effect", header: "Effect", cell: (item) => item.effect || "—" }, { id: "status", header: "Status", cell: (item) => item.status || "—" },
  ], []);

  return <div className="space-y-6">
    <SettingsSection description={description} title={title}>
      {error ? <StatusNotice tone="danger">{error}</StatusNotice> : null}{notice ? <StatusNotice tone="success">{notice}</StatusNotice> : null}
      <div className="space-y-6">
        <DataTable columns={roleColumns} footer={<SdkworkIamListPaginationControls busy={busy} onLoadMore={() => void runAction(async () => { setRoles(await controller.loadMoreRoles()); syncPageInfo(); }, "Loaded more roles")} pageInfo={listPageInfo?.roles} />} getRowId={(item) => item.roleId} loading={loading} onRowClick={(item) => { setSelectedRoleId(item.roleId); openRoleEdit(item); }} rowActions={(item) => <div className="flex gap-2"><Button onClick={() => { setSelectedRoleId(item.roleId); openRoleEdit(item); }} size="sm" type="button" variant="outline">Edit</Button><Button onClick={() => setDeleteTarget({ id: item.roleId, kind: "role", label: item.name })} size="sm" type="button" variant="danger">Delete</Button></div>} rows={[...roles]} title="Roles" toolbar={<Button onClick={() => openCreate("role")} type="button">Create role</Button>} />
        <DataTable columns={permissionColumns} footer={<SdkworkIamListPaginationControls busy={busy} onLoadMore={() => void runAction(async () => { setPermissions(await controller.loadMorePermissions()); syncPageInfo(); }, "Loaded more permissions")} pageInfo={listPageInfo?.permissions} />} getRowId={(item) => item.permissionId} loading={loading} onRowClick={openPermissionEdit} rowActions={(item) => <div className="flex gap-2"><Button onClick={() => openPermissionEdit(item)} size="sm" type="button" variant="outline">Edit</Button><Button onClick={() => setDeleteTarget({ id: item.permissionId, kind: "permission", label: item.name })} size="sm" type="button" variant="danger">Delete</Button></div>} rows={[...permissions]} title="Permissions" toolbar={<Button onClick={() => openCreate("permission")} type="button">Create permission</Button>} />
        <DataTable columns={policyColumns} footer={<SdkworkIamListPaginationControls busy={busy} onLoadMore={() => void runAction(async () => { setPolicies(await controller.loadMorePolicies()); syncPageInfo(); }, "Loaded more policies")} pageInfo={listPageInfo?.policies} />} getRowId={(item) => item.policyId} loading={loading} onRowClick={openPolicyEdit} rowActions={(item) => <div className="flex gap-2"><Button onClick={() => openPolicyEdit(item)} size="sm" type="button" variant="outline">Edit</Button><Button onClick={() => setDeleteTarget({ id: item.policyId, kind: "policy", label: item.name })} size="sm" type="button" variant="danger">Delete</Button></div>} rows={[...policies]} title="Policies" toolbar={<Button onClick={() => openCreate("policy")} type="button">Create policy</Button>} />

        <section className="space-y-4 rounded-[0.75rem] border border-[var(--sdk-color-border-default)] p-4">
          <label className="block space-y-2 text-sm"><span>Manage assignments for role</span><select className="w-full rounded-[0.75rem] border border-[var(--sdk-color-border-default)] bg-transparent px-3 py-2" onChange={(event) => setSelectedRoleId(event.target.value)} value={selectedRoleId}><option value="">Select role</option>{roles.map((role) => <option key={role.roleId} value={role.roleId}>{role.name} ({role.code || role.roleId})</option>)}</select></label>
          {selectedRoleId ? <div className="space-y-6">
            <DataTable columns={permissionColumns} footer={<SdkworkIamListPaginationControls busy={busy} onLoadMore={() => void runAction(async () => { setRolePermissions(await controller.loadMoreRolePermissions(selectedRoleId)); syncPageInfo(); }, "Loaded more role permissions")} pageInfo={listPageInfo?.rolePermissions?.[selectedRoleId]} />} getRowId={(item) => item.permissionId} rowActions={(item) => <Button onClick={() => setRevokePermissionTarget(item)} size="sm" type="button" variant="danger">Revoke</Button>} rows={[...rolePermissions]} title="Assigned permissions" toolbar={<Button onClick={() => setAssignmentDrawer("permission")} type="button">Assign permission</Button>} />
            <DataTable columns={bindingColumns} footer={<SdkworkIamListPaginationControls busy={busy} onLoadMore={() => void runAction(async () => { setRoleBindings(await controller.loadMoreRoleBindings()); syncPageInfo(); }, "Loaded more role bindings")} pageInfo={listPageInfo?.roleBindings} />} getRowId={(item) => item.id} rowActions={(item) => <Button onClick={() => setRevokeBindingTarget(item)} size="sm" type="button" variant="danger">Revoke</Button>} rows={[...roleBindings]} title="Role bindings" toolbar={<Button onClick={() => { setBindingDraft({ ...emptyBindingDraft(), roleId: selectedRoleId }); setAssignmentDrawer("binding"); }} type="button">Create binding</Button>} />
          </div> : null}
        </section>
      </div>
    </SettingsSection>

    <CatalogDrawer busy={busy} description="Manage the role catalog used by IAM authorization." mode={drawer?.kind === "role" ? drawer.mode : undefined} onOpenChange={(open) => { if (!open) setDrawer(undefined); }} onSubmit={() => void runAction(async () => { if (drawer?.mode === "edit" && selectedRole) await controller.updateRole(selectedRole.roleId, roleDraft); else { const created = await controller.createRole(roleDraft); setSelectedRoleId(created.roleId); } await refreshCatalog(); setDrawer(undefined); }, drawer?.mode === "edit" ? "Role updated" : "Role created")} submitDisabled={!roleDraft.name.trim()} title={drawer?.mode === "edit" ? "Edit role" : "Create role"}><Field label="Name" onChange={(name) => setRoleDraft({ ...roleDraft, name })} value={roleDraft.name} /><Field label="Code" onChange={(code) => setRoleDraft({ ...roleDraft, code })} value={roleDraft.code ?? ""} />{drawer?.mode === "edit" ? <Field label="Status" onChange={(status) => setRoleDraft({ ...roleDraft, status })} value={roleDraft.status ?? ""} /> : null}</CatalogDrawer>
    <CatalogDrawer busy={busy} description="Define the resource and action represented by this permission." mode={drawer?.kind === "permission" ? drawer.mode : undefined} onOpenChange={(open) => { if (!open) setDrawer(undefined); }} onSubmit={() => void runAction(async () => { if (drawer?.mode === "edit" && selectedPermission) await controller.updatePermission(selectedPermission.permissionId, permissionDraft); else await controller.createPermission(permissionDraft); await refreshCatalog(); setDrawer(undefined); }, drawer?.mode === "edit" ? "Permission updated" : "Permission created")} submitDisabled={!permissionDraft.code.trim() || !permissionDraft.name.trim()} title={drawer?.mode === "edit" ? "Edit permission" : "Create permission"}><Field label="Code" onChange={(code) => setPermissionDraft({ ...permissionDraft, code })} value={permissionDraft.code} /><Field label="Name" onChange={(name) => setPermissionDraft({ ...permissionDraft, name })} value={permissionDraft.name} /><Field label="Resource" onChange={(resource) => setPermissionDraft({ ...permissionDraft, resource })} value={permissionDraft.resource ?? ""} /><Field label="Action" onChange={(action) => setPermissionDraft({ ...permissionDraft, action })} value={permissionDraft.action ?? ""} /></CatalogDrawer>
    <CatalogDrawer busy={busy} description="Manage an IAM policy catalog entry." mode={drawer?.kind === "policy" ? drawer.mode : undefined} onOpenChange={(open) => { if (!open) setDrawer(undefined); }} onSubmit={() => void runAction(async () => { if (drawer?.mode === "edit" && selectedPolicy) await controller.updatePolicy(selectedPolicy.policyId, policyDraft); else await controller.createPolicy(policyDraft); await refreshCatalog(); setDrawer(undefined); }, drawer?.mode === "edit" ? "Policy updated" : "Policy created")} submitDisabled={!policyDraft.name.trim()} title={drawer?.mode === "edit" ? "Edit policy" : "Create policy"}><Field label="Name" onChange={(name) => setPolicyDraft({ ...policyDraft, name })} value={policyDraft.name} /><Field label="Code" onChange={(code) => setPolicyDraft({ ...policyDraft, code })} value={policyDraft.code ?? ""} />{drawer?.mode === "edit" ? <Field label="Status" onChange={(status) => setPolicyDraft({ ...policyDraft, status })} value={policyDraft.status ?? ""} /> : null}</CatalogDrawer>

    <CatalogDrawer busy={busy} description="Select a permission to assign to the active role." mode={assignmentDrawer === "permission" ? "create" : undefined} onOpenChange={(open) => { if (!open) setAssignmentDrawer(undefined); }} onSubmit={() => { if (!selectedRoleId || !assignPermissionId) return; void runAction(async () => { await controller.assignRolePermission(selectedRoleId, assignPermissionId); await refreshRoleDetails(selectedRoleId); setAssignPermissionId(""); setAssignmentDrawer(undefined); }, "Permission assigned"); }} submitDisabled={!assignPermissionId} title="Assign permission"><label className="block space-y-2 text-sm"><span>Permission</span><select className="w-full rounded-[0.75rem] border border-[var(--sdk-color-border-default)] bg-transparent px-3 py-2" onChange={(event) => setAssignPermissionId(event.target.value)} value={assignPermissionId}><option value="">Select permission</option>{permissions.map((item) => <option key={item.permissionId} value={item.permissionId}>{item.code}</option>)}</select></label></CatalogDrawer>
    <CatalogDrawer busy={busy} description="Bind the active role to a principal within a scope." mode={assignmentDrawer === "binding" ? "create" : undefined} onOpenChange={(open) => { if (!open) setAssignmentDrawer(undefined); }} onSubmit={() => { if (!selectedRoleId) return; void runAction(async () => { await controller.assignRoleBinding({ ...bindingDraft, roleId: selectedRoleId }); await refreshRoleDetails(selectedRoleId); setBindingDraft(emptyBindingDraft()); setAssignmentDrawer(undefined); }, "Role binding created"); }} submitDisabled={!bindingDraft.principalId.trim() || !bindingDraft.scopeId.trim()} title="Create role binding"><Field label="Principal ID" onChange={(principalId) => setBindingDraft({ ...bindingDraft, principalId })} value={bindingDraft.principalId} /><Field label="Principal kind" onChange={(principalKind) => setBindingDraft({ ...bindingDraft, principalKind })} value={bindingDraft.principalKind} /><Field label="Scope ID" onChange={(scopeId) => setBindingDraft({ ...bindingDraft, scopeId })} value={bindingDraft.scopeId} /><Field label="Scope kind" onChange={(scopeKind) => setBindingDraft({ ...bindingDraft, scopeKind })} value={bindingDraft.scopeKind} /></CatalogDrawer>

    <ConfirmDialog closeOnConfirm={false} confirmLabel="Delete" confirmLoading={busy} description={deleteTarget ? `Delete ${deleteTarget.label}? This action cannot be undone.` : undefined} onConfirm={() => { if (!deleteTarget) return; void runAction(async () => { if (deleteTarget.kind === "role") await controller.deleteRole(deleteTarget.id); if (deleteTarget.kind === "permission") await controller.deletePermission(deleteTarget.id); if (deleteTarget.kind === "policy") await controller.deletePolicy(deleteTarget.id); if (deleteTarget.kind === "role" && selectedRoleId === deleteTarget.id) setSelectedRoleId(""); await refreshCatalog(); setDeleteTarget(undefined); }, `${deleteTarget.kind} deleted`); }} onOpenChange={(open) => { if (!open && !busy) setDeleteTarget(undefined); }} open={Boolean(deleteTarget)} title={`Delete ${deleteTarget?.kind ?? "resource"}`} tone="danger" />
    <ConfirmDialog closeOnConfirm={false} confirmLabel="Revoke permission" confirmLoading={busy} description={revokePermissionTarget ? `Revoke ${revokePermissionTarget.code} from this role?` : undefined} onConfirm={() => { if (!selectedRoleId || !revokePermissionTarget) return; void runAction(async () => { await controller.revokeRolePermission(selectedRoleId, revokePermissionTarget.permissionId); await refreshRoleDetails(selectedRoleId); setRevokePermissionTarget(undefined); }, "Permission revoked"); }} onOpenChange={(open) => { if (!open && !busy) setRevokePermissionTarget(undefined); }} open={Boolean(revokePermissionTarget)} title="Revoke role permission" tone="danger" />
    <ConfirmDialog closeOnConfirm={false} confirmLabel="Revoke binding" confirmLoading={busy} description="Revoke this role binding?" onConfirm={() => { if (!selectedRoleId || !revokeBindingTarget) return; void runAction(async () => { await controller.revokeRoleBinding(revokeBindingTarget.id); await refreshRoleDetails(selectedRoleId); setRevokeBindingTarget(undefined); }, "Role binding revoked"); }} onOpenChange={(open) => { if (!open && !busy) setRevokeBindingTarget(undefined); }} open={Boolean(revokeBindingTarget)} title="Revoke role binding" tone="danger" />
  </div>;
}

function CatalogDrawer({ busy, children, description, mode, onOpenChange, onSubmit, submitDisabled, title }: { busy: boolean; children: ReactNode; description: string; mode?: "create" | "edit"; onOpenChange: (open: boolean) => void; onSubmit: () => void; submitDisabled: boolean; title: string }) {
  return <Drawer open={Boolean(mode)} onOpenChange={onOpenChange}><DrawerContent size="md"><DrawerHeader><DrawerTitle>{title}</DrawerTitle><DrawerDescription>{description}</DrawerDescription></DrawerHeader><DrawerBody className="space-y-4">{children}</DrawerBody><DrawerFooter><Button disabled={busy} onClick={() => onOpenChange(false)} type="button" variant="secondary">Cancel</Button><Button disabled={busy || submitDisabled} loading={busy} onClick={onSubmit} type="button">{mode === "edit" ? "Save changes" : "Confirm"}</Button></DrawerFooter></DrawerContent></Drawer>;
}
function Field({ label, onChange, value }: { label: string; onChange: (value: string) => void; value: string }) { return <label className="block space-y-2 text-sm"><span>{label}</span><input className="w-full rounded-[0.75rem] border border-[var(--sdk-color-border-default)] bg-transparent px-3 py-2" onChange={(event) => onChange(event.target.value)} value={value} /></label>; }
function toErrorMessage(error: unknown, fallback: string) { return error instanceof Error ? error.message : fallback; }
