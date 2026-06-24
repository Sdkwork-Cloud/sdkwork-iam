import { useEffect, useState, type ReactNode } from "react";
import { Button, SettingsSection, StatusNotice } from "@sdkwork/ui-pc-react";

import type {
  SdkworkIamPermissionAdminWorkspaceProps,
  SdkworkIamPermissionDraft,
  SdkworkIamPolicyDraft,
  SdkworkIamRoleBindingDraft,
  SdkworkIamRoleDraft,
} from "../types/permission-admin-types";

const emptyRoleDraft = (): SdkworkIamRoleDraft => ({ name: "" });
const emptyPermissionDraft = (): SdkworkIamPermissionDraft => ({ code: "", name: "" });
const emptyPolicyDraft = (): SdkworkIamPolicyDraft => ({ name: "" });
const emptyBindingDraft = (): SdkworkIamRoleBindingDraft => ({
  principalId: "",
  principalKind: "user",
  roleId: "",
  scopeId: "",
  scopeKind: "organization",
});

export function SdkworkIamPermissionAdminWorkspace({
  controller,
  description = "Create roles, permissions, policies, and role bindings for backend-admin operators.",
  title = "Permission administration",
}: SdkworkIamPermissionAdminWorkspaceProps) {
  const [roles, setRoles] = useState(controller.getState().roles);
  const [permissions, setPermissions] = useState(controller.getState().permissions);
  const [policies, setPolicies] = useState(controller.getState().policies);
  const [roleBindings, setRoleBindings] = useState(controller.getState().roleBindings);
  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [rolePermissions, setRolePermissions] = useState(controller.getState().rolePermissions[selectedRoleId] ?? []);
  const [roleDraft, setRoleDraft] = useState(emptyRoleDraft);
  const [permissionDraft, setPermissionDraft] = useState(emptyPermissionDraft);
  const [policyDraft, setPolicyDraft] = useState(emptyPolicyDraft);
  const [bindingDraft, setBindingDraft] = useState(emptyBindingDraft);
  const [assignPermissionId, setAssignPermissionId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [notice, setNotice] = useState<string | undefined>();

  const refreshCatalog = async () => {
    const [nextRoles, nextPermissions, nextPolicies] = await Promise.all([
      controller.listRoles(),
      controller.listPermissions(),
      controller.listPolicies(),
    ]);
    setRoles(nextRoles);
    setPermissions(nextPermissions);
    setPolicies(nextPolicies);
    return { nextPermissions, nextRoles, nextPolicies };
  };

  useEffect(() => {
    void refreshCatalog().catch((loadError) => {
      setError(loadError instanceof Error ? loadError.message : "Failed to load permission catalog");
    });
  }, [controller]);

  useEffect(() => {
    if (!selectedRoleId) {
      setRolePermissions([]);
      return;
    }
    void Promise.all([
      controller.listRolePermissions(selectedRoleId),
      controller.listRoleBindings({ roleId: selectedRoleId }),
    ]).then(([nextRolePermissions, nextBindings]) => {
      setRolePermissions(nextRolePermissions);
      setRoleBindings(nextBindings);
    }).catch((loadError) => {
      setError(loadError instanceof Error ? loadError.message : "Failed to load role details");
    });
  }, [controller, selectedRoleId]);

  const runAction = async (action: () => Promise<void>, successMessage: string) => {
    setBusy(true);
    setError(undefined);
    setNotice(undefined);
    try {
      await action();
      setNotice(successMessage);
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Operation failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <SettingsSection description={description} title={title}>
        {error ? <StatusNotice tone="danger">{error}</StatusNotice> : null}
        {notice ? <StatusNotice tone="success">{notice}</StatusNotice> : null}

        <div className="grid gap-6 lg:grid-cols-3">
          <CatalogPanel
            busy={busy}
            createLabel="Create role"
            disabled={!roleDraft.name.trim()}
            draftFields={(
              <>
                <Field label="Name" onChange={(name) => setRoleDraft((current) => ({ ...current, name }))} value={roleDraft.name} />
                <Field label="Code" onChange={(code) => setRoleDraft((current) => ({ ...current, code }))} value={roleDraft.code ?? ""} />
              </>
            )}
            items={roles.map((role) => ({ id: role.roleId, label: `${role.name} (${role.code || role.roleId})` }))}
            onCreate={() => void runAction(async () => {
              const role = await controller.createRole(roleDraft);
              setRoleDraft(emptyRoleDraft());
              await refreshCatalog();
              setSelectedRoleId(role.roleId);
            }, "Role created")}
            onRemove={(roleId) => void runAction(async () => {
              await controller.deleteRole(roleId);
              if (selectedRoleId === roleId) {
                setSelectedRoleId("");
              }
              await refreshCatalog();
            }, "Role deleted")}
            title={`Roles (${roles.length})`}
          />

          <CatalogPanel
            busy={busy}
            createLabel="Create permission"
            disabled={!permissionDraft.code.trim() || !permissionDraft.name.trim()}
            draftFields={(
              <>
                <Field label="Code" onChange={(code) => setPermissionDraft((current) => ({ ...current, code }))} value={permissionDraft.code} />
                <Field label="Name" onChange={(name) => setPermissionDraft((current) => ({ ...current, name }))} value={permissionDraft.name} />
                <Field label="Resource" onChange={(resource) => setPermissionDraft((current) => ({ ...current, resource }))} value={permissionDraft.resource ?? ""} />
                <Field label="Action" onChange={(action) => setPermissionDraft((current) => ({ ...current, action }))} value={permissionDraft.action ?? ""} />
              </>
            )}
            items={permissions.map((permission) => ({
              id: permission.permissionId,
              label: `${permission.name} — ${permission.code}`,
            }))}
            onCreate={() => void runAction(async () => {
              await controller.createPermission(permissionDraft);
              setPermissionDraft(emptyPermissionDraft());
              await refreshCatalog();
            }, "Permission created")}
            onRemove={(permissionId) => void runAction(async () => {
              await controller.deletePermission(permissionId);
              await refreshCatalog();
            }, "Permission deleted")}
            title={`Permissions (${permissions.length})`}
          />

          <CatalogPanel
            busy={busy}
            createLabel="Create policy"
            disabled={!policyDraft.name.trim()}
            draftFields={(
              <>
                <Field label="Name" onChange={(name) => setPolicyDraft((current) => ({ ...current, name }))} value={policyDraft.name} />
                <Field label="Code" onChange={(code) => setPolicyDraft((current) => ({ ...current, code }))} value={policyDraft.code ?? ""} />
              </>
            )}
            items={policies.map((policy) => ({ id: policy.policyId, label: `${policy.name} (${policy.code || policy.policyId})` }))}
            onCreate={() => void runAction(async () => {
              await controller.createPolicy(policyDraft);
              setPolicyDraft(emptyPolicyDraft());
              await refreshCatalog();
            }, "Policy created")}
            onRemove={(policyId) => void runAction(async () => {
              await controller.deletePolicy(policyId);
              await refreshCatalog();
            }, "Policy deleted")}
            title={`Policies (${policies.length})`}
          />
        </div>

        <section className="space-y-3 rounded-[0.75rem] border border-[var(--sdk-color-border-default)] p-4">
          <h3 className="text-sm font-semibold">Role assignments</h3>
          <label className="block space-y-2 text-sm">
            <span>Role</span>
            <select
              className="w-full rounded-[0.75rem] border border-[var(--sdk-color-border-default)] bg-transparent px-3 py-2"
              onChange={(event) => setSelectedRoleId(event.target.value)}
              value={selectedRoleId}
            >
              <option value="">Select role</option>
              {roles.map((role) => (
                <option key={role.roleId} value={role.roleId}>
                  {role.name} ({role.code || role.roleId})
                </option>
              ))}
            </select>
          </label>

          {selectedRoleId ? (
            <>
              <div className="grid gap-3 md:grid-cols-2">
                <label className="block space-y-2 text-sm">
                  <span>Permission to assign</span>
                  <select
                    className="w-full rounded-[0.75rem] border border-[var(--sdk-color-border-default)] bg-transparent px-3 py-2"
                    onChange={(event) => setAssignPermissionId(event.target.value)}
                    value={assignPermissionId}
                  >
                    <option value="">Select permission</option>
                    {permissions.map((permission) => (
                      <option key={permission.permissionId} value={permission.permissionId}>
                        {permission.code}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="flex items-end">
                  <Button
                    disabled={busy || !assignPermissionId}
                    onClick={() => void runAction(async () => {
                      await controller.assignRolePermission(selectedRoleId, assignPermissionId);
                      setAssignPermissionId("");
                      const nextRolePermissions = await controller.listRolePermissions(selectedRoleId);
                      setRolePermissions(nextRolePermissions);
                    }, "Permission assigned to role")}
                    type="button"
                  >
                    Assign permission
                  </Button>
                </div>
              </div>
              <ul className="space-y-2">
                {rolePermissions.map((permission) => (
                  <li
                    className="flex flex-wrap items-center justify-between gap-2 rounded-[0.75rem] border border-[var(--sdk-color-border-default)] px-3 py-2 text-sm"
                    key={permission.permissionId}
                  >
                    <span>{permission.name} — {permission.code}</span>
                    <Button
                      disabled={busy}
                      onClick={() => void runAction(async () => {
                        await controller.revokeRolePermission(selectedRoleId, permission.permissionId);
                        const nextRolePermissions = await controller.listRolePermissions(selectedRoleId);
                        setRolePermissions(nextRolePermissions);
                      }, "Permission revoked from role")}
                      type="button"
                      variant="outline"
                    >
                      Revoke
                    </Button>
                  </li>
                ))}
              </ul>

              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                <Field label="Principal ID" onChange={(principalId) => setBindingDraft((current) => ({ ...current, principalId }))} value={bindingDraft.principalId} />
                <Field label="Principal kind" onChange={(principalKind) => setBindingDraft((current) => ({ ...current, principalKind }))} value={bindingDraft.principalKind} />
                <Field label="Scope ID" onChange={(scopeId) => setBindingDraft((current) => ({ ...current, scopeId }))} value={bindingDraft.scopeId} />
                <Field label="Scope kind" onChange={(scopeKind) => setBindingDraft((current) => ({ ...current, scopeKind }))} value={bindingDraft.scopeKind} />
              </div>
              <Button
                disabled={busy || !bindingDraft.principalId.trim() || !bindingDraft.scopeId.trim()}
                onClick={() => void runAction(async () => {
                  await controller.assignRoleBinding({
                    ...bindingDraft,
                    roleId: selectedRoleId,
                  });
                  setBindingDraft(emptyBindingDraft());
                  const nextBindings = await controller.listRoleBindings({ roleId: selectedRoleId });
                  setRoleBindings(nextBindings);
                }, "Role binding created")}
                type="button"
              >
                Assign role binding
              </Button>
              <ul className="space-y-2">
                {roleBindings.map((binding) => (
                  <li
                    className="flex flex-wrap items-center justify-between gap-2 rounded-[0.75rem] border border-[var(--sdk-color-border-default)] px-3 py-2 text-sm"
                    key={binding.id}
                  >
                    <span>
                      {binding.principalKind}:{binding.principalId} → {binding.scopeKind}:{binding.scopeId}
                    </span>
                    <Button
                      disabled={busy}
                      onClick={() => void runAction(async () => {
                        await controller.revokeRoleBinding(binding.id);
                        const nextBindings = await controller.listRoleBindings({ roleId: selectedRoleId });
                        setRoleBindings(nextBindings);
                      }, "Role binding revoked")}
                      type="button"
                      variant="outline"
                    >
                      Revoke
                    </Button>
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </section>
      </SettingsSection>
    </div>
  );
}

function CatalogPanel({
  busy,
  createLabel,
  disabled,
  draftFields,
  items,
  onCreate,
  onRemove,
  title,
}: {
  busy: boolean;
  createLabel: string;
  disabled: boolean;
  draftFields: ReactNode;
  items: readonly { id: string; label: string }[];
  onCreate: () => void;
  onRemove: (id: string) => void;
  title: string;
}) {
  return (
    <section className="space-y-3 rounded-[0.75rem] border border-[var(--sdk-color-border-default)] p-4">
      <h3 className="text-sm font-semibold">{title}</h3>
      {draftFields}
      <Button disabled={busy || disabled} onClick={onCreate} type="button">
        {createLabel}
      </Button>
      <ul className="space-y-2">
        {items.map((item) => (
          <li
            className="flex flex-wrap items-center justify-between gap-2 rounded-[0.75rem] border border-[var(--sdk-color-border-default)] px-3 py-2 text-sm"
            key={item.id}
          >
            <span>{item.label}</span>
            <Button disabled={busy} onClick={() => onRemove(item.id)} type="button" variant="outline">
              Remove
            </Button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Field({
  label,
  onChange,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label className="block space-y-2 text-sm">
      <span>{label}</span>
      <input
        className="w-full rounded-[0.75rem] border border-[var(--sdk-color-border-default)] bg-transparent px-3 py-2"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      />
    </label>
  );
}
