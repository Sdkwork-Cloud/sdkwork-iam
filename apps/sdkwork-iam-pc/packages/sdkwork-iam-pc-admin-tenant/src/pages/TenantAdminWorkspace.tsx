import { useEffect, useState } from "react";
import { SdkworkIamListPaginationControls } from "@sdkwork/iam-pc-admin-core";
import { Button, SettingsSection, StatusNotice } from "@sdkwork/ui-pc-react";

import type {
  SdkworkIamTenantAdminWorkspaceProps,
  SdkworkIamTenantDraft,
  SdkworkIamTenantMemberDraft,
} from "../types/tenant-admin-types";

const emptyTenantDraft = (): SdkworkIamTenantDraft => ({ code: "", name: "" });
const emptyMemberDraft = (): SdkworkIamTenantMemberDraft => ({ roleCode: "", userId: "" });

export function SdkworkIamTenantAdminWorkspace({
  controller,
  description = "Create, update, and manage tenant scope and member assignments for backend-admin operators.",
  title = "Tenant administration",
}: SdkworkIamTenantAdminWorkspaceProps) {
  const [tenants, setTenants] = useState(controller.getState().tenants);
  const [members, setMembers] = useState(controller.getState().members);
  const [listPageInfo, setListPageInfo] = useState(controller.getState().listPageInfo);
  const [selectedTenantId, setSelectedTenantId] = useState(controller.getSelectedTenant()?.tenantId ?? "");
  const [createDraft, setCreateDraft] = useState(emptyTenantDraft);
  const [editDraft, setEditDraft] = useState<SdkworkIamTenantDraft>(emptyTenantDraft());
  const [memberDraft, setMemberDraft] = useState(emptyMemberDraft);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [notice, setNotice] = useState<string | undefined>();

  const selectedTenant = tenants.find((tenant) => tenant.tenantId === selectedTenantId);

  const refreshTenants = async () => {
    const items = await controller.listTenants();
    setTenants(items);
    setListPageInfo(controller.getState().listPageInfo);
    return items;
  };

  const loadMoreTenants = async () => {
    const items = await controller.loadMoreTenants();
    setTenants(items);
    setListPageInfo(controller.getState().listPageInfo);
    return items;
  };

  const refreshMembers = async (tenantId: string) => {
    if (!tenantId) {
      setMembers([]);
      return [];
    }
    const items = await controller.listTenantMembers(tenantId);
    setMembers(items);
    setListPageInfo(controller.getState().listPageInfo);
    return items;
  };

  const loadMoreMembers = async (tenantId: string) => {
    const items = await controller.loadMoreTenantMembers(tenantId);
    setMembers(items);
    setListPageInfo(controller.getState().listPageInfo);
    return items;
  };

  useEffect(() => {
    void refreshTenants().catch((loadError) => {
      setError(loadError instanceof Error ? loadError.message : "Failed to load tenants");
    });
  }, [controller]);

  useEffect(() => {
    if (!selectedTenantId) {
      setMembers([]);
      setEditDraft(emptyTenantDraft());
      return;
    }
    void controller.selectTenant(selectedTenantId)
      .then((tenant) => {
        if (tenant) {
          setEditDraft({ code: tenant.code ?? "", name: tenant.name, status: tenant.status });
        }
        return refreshMembers(selectedTenantId);
      })
      .catch((loadError) => {
        setError(loadError instanceof Error ? loadError.message : "Failed to load tenant members");
      });
  }, [controller, selectedTenantId]);

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

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="space-y-3 rounded-[0.75rem] border border-[var(--sdk-color-border-default)] p-4">
            <h3 className="text-sm font-semibold">Create tenant</h3>
            <Field label="Name" onChange={(name) => setCreateDraft((current) => ({ ...current, name }))} value={createDraft.name} />
            <Field label="Code" onChange={(code) => setCreateDraft((current) => ({ ...current, code }))} value={createDraft.code ?? ""} />
            <Button
              disabled={busy || !createDraft.name.trim()}
              onClick={() => void runAction(async () => {
                const tenant = await controller.createTenant(createDraft);
                setCreateDraft(emptyTenantDraft());
                await refreshTenants();
                setSelectedTenantId(tenant.tenantId);
              }, "Tenant created")}
              type="button"
            >
              Create tenant
            </Button>
          </section>

          <section className="space-y-3 rounded-[0.75rem] border border-[var(--sdk-color-border-default)] p-4">
            <h3 className="text-sm font-semibold">Select tenant</h3>
            <label className="block space-y-2 text-sm">
              <span>Tenant</span>
              <select
                className="w-full rounded-[0.75rem] border border-[var(--sdk-color-border-default)] bg-transparent px-3 py-2"
                onChange={(event) => setSelectedTenantId(event.target.value)}
                value={selectedTenantId}
              >
                <option value="">Select tenant</option>
                {tenants.map((tenant) => (
                  <option key={tenant.tenantId} value={tenant.tenantId}>
                    {tenant.name} ({tenant.tenantId})
                  </option>
                ))}
              </select>
            </label>
            <SdkworkIamListPaginationControls
              busy={busy}
              onLoadMore={() => {
                void loadMoreTenants().catch((loadError) => {
                  setError(loadError instanceof Error ? loadError.message : "Failed to load more tenants");
                });
              }}
              pageInfo={listPageInfo?.tenants}
            />
          </section>
        </div>

        {selectedTenant ? (
          <section className="space-y-3 rounded-[0.75rem] border border-[var(--sdk-color-border-default)] p-4">
            <h3 className="text-sm font-semibold">Update tenant</h3>
            <Field label="Name" onChange={(name) => setEditDraft((current) => ({ ...current, name }))} value={editDraft.name} />
            <Field label="Code" onChange={(code) => setEditDraft((current) => ({ ...current, code }))} value={editDraft.code ?? ""} />
            <Field label="Status" onChange={(status) => setEditDraft((current) => ({ ...current, status }))} value={editDraft.status ?? ""} />
            <div className="flex flex-wrap gap-2">
              <Button
                disabled={busy || !editDraft.name.trim()}
                onClick={() => void runAction(async () => {
                  await controller.updateTenant(selectedTenant.tenantId, editDraft);
                  await refreshTenants();
                }, "Tenant updated")}
                type="button"
              >
                Save changes
              </Button>
              <Button
                disabled={busy}
                onClick={() => void runAction(async () => {
                  await controller.deleteTenant(selectedTenant.tenantId);
                  setSelectedTenantId("");
                  await refreshTenants();
                }, "Tenant deleted")}
                type="button"
                variant="danger"
              >
                Delete tenant
              </Button>
            </div>
          </section>
        ) : null}

        {selectedTenant ? (
          <section className="space-y-3 rounded-[0.75rem] border border-[var(--sdk-color-border-default)] p-4">
            <h3 className="text-sm font-semibold">Tenant members</h3>
            <div className="grid gap-3 md:grid-cols-2">
              <Field label="User ID" onChange={(userId) => setMemberDraft((current) => ({ ...current, userId }))} value={memberDraft.userId} />
              <Field label="Role code" onChange={(roleCode) => setMemberDraft((current) => ({ ...current, roleCode }))} value={memberDraft.roleCode ?? ""} />
            </div>
            <Button
              disabled={busy || !memberDraft.userId.trim()}
              onClick={() => void runAction(async () => {
                await controller.createTenantMember(selectedTenant.tenantId, memberDraft);
                setMemberDraft(emptyMemberDraft());
                await refreshMembers(selectedTenant.tenantId);
              }, "Member added")}
              type="button"
            >
              Add member
            </Button>
            <ul className="space-y-2">
              {members.map((member) => (
                <li
                  className="flex flex-wrap items-center justify-between gap-2 rounded-[0.75rem] border border-[var(--sdk-color-border-default)] px-3 py-2 text-sm"
                  key={member.id}
                >
                  <span>
                    {member.displayName || member.username || member.userId}
                    {member.roleCode ? ` — ${member.roleCode}` : ""}
                  </span>
                  <Button
                    disabled={busy}
                    onClick={() => void runAction(async () => {
                      await controller.removeTenantMember(selectedTenant.tenantId, member.userId);
                      await refreshMembers(selectedTenant.tenantId);
                    }, "Member removed")}
                    type="button"
                    variant="outline"
                  >
                    Remove
                  </Button>
                </li>
              ))}
            </ul>
            <SdkworkIamListPaginationControls
              busy={busy}
              onLoadMore={() => {
                void loadMoreMembers(selectedTenant.tenantId).catch((loadError) => {
                  setError(loadError instanceof Error ? loadError.message : "Failed to load more members");
                });
              }}
              pageInfo={listPageInfo?.members}
            />
          </section>
        ) : null}
      </SettingsSection>
    </div>
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
