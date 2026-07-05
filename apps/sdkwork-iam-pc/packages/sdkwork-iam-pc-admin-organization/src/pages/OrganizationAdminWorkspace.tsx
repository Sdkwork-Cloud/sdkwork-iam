import { useEffect, useState } from "react";
import { SdkworkIamListPaginationControls } from "@sdkwork/iam-pc-admin-core";
import { Button, SettingsSection, StatusNotice } from "@sdkwork/ui-pc-react";

import type {
  SdkworkIamDepartmentDraft,
  SdkworkIamOrganizationAdminWorkspaceProps,
  SdkworkIamOrganizationDraft,
  SdkworkIamOrganizationMembershipDraft,
} from "../types/organization-admin-types";

const emptyOrganizationDraft = (): SdkworkIamOrganizationDraft => ({ name: "" });
const emptyDepartmentDraft = (organizationId: string): SdkworkIamDepartmentDraft => ({
  name: "",
  organizationId,
});
const emptyMembershipDraft = (): SdkworkIamOrganizationMembershipDraft => ({ userId: "" });

export function SdkworkIamOrganizationAdminWorkspace({
  controller,
  description = "Create, update, and manage organization hierarchy, departments, and memberships for backend-admin operators.",
  title = "Organization administration",
}: SdkworkIamOrganizationAdminWorkspaceProps) {
  const [organizations, setOrganizations] = useState(controller.getState().organizations);
  const [departments, setDepartments] = useState(controller.getState().departments);
  const [memberships, setMemberships] = useState(controller.getState().memberships);
  const [selectedOrganizationId, setSelectedOrganizationId] = useState(
    controller.getState().selectedOrganization?.organizationId ?? "",
  );
  const [createDraft, setCreateDraft] = useState(emptyOrganizationDraft);
  const [editDraft, setEditDraft] = useState<SdkworkIamOrganizationDraft>(emptyOrganizationDraft());
  const [departmentDraft, setDepartmentDraft] = useState<SdkworkIamDepartmentDraft>(emptyDepartmentDraft(""));
  const [memberDraft, setMemberDraft] = useState(emptyMembershipDraft);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [notice, setNotice] = useState<string | undefined>();

  const selectedOrganization = organizations.find(
    (organization) => organization.organizationId === selectedOrganizationId,
  );

  const refreshOrganizations = async () => {
    const items = await controller.listOrganizations();
    setOrganizations(items);
    return items;
  };

  const refreshDepartments = async (organizationId: string) => {
    if (!organizationId) {
      setDepartments([]);
      return [];
    }
    const items = await controller.listDepartments(organizationId);
    setDepartments(items);
    return items;
  };

  const refreshMemberships = async (organizationId: string) => {
    if (!organizationId) {
      setMemberships([]);
      return [];
    }
    const items = await controller.listMemberships(organizationId);
    setMemberships(items);
    return items;
  };

  useEffect(() => {
    void refreshOrganizations().catch((loadError) => {
      setError(loadError instanceof Error ? loadError.message : "Failed to load organizations");
    });
  }, [controller]);

  useEffect(() => {
    if (!selectedOrganizationId) {
      setDepartments([]);
      setMemberships([]);
      setEditDraft(emptyOrganizationDraft());
      setDepartmentDraft(emptyDepartmentDraft(""));
      return;
    }
    void controller.selectOrganization(selectedOrganizationId)
      .then((organization) => {
        if (organization) {
          setEditDraft({
            code: organization.code ?? "",
            name: organization.name,
            parentId: organization.parentId ?? "",
            status: organization.status ?? "",
          });
          setDepartmentDraft(emptyDepartmentDraft(organization.organizationId));
        }
        return Promise.all([
          refreshDepartments(selectedOrganizationId),
          refreshMemberships(selectedOrganizationId),
        ]);
      })
      .catch((loadError) => {
        setError(loadError instanceof Error ? loadError.message : "Failed to load organization details");
      });
  }, [controller, selectedOrganizationId]);

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
            <h3 className="text-sm font-semibold">Create organization</h3>
            <Field label="Name" onChange={(name) => setCreateDraft((current) => ({ ...current, name }))} value={createDraft.name} />
            <Field label="Code" onChange={(code) => setCreateDraft((current) => ({ ...current, code }))} value={createDraft.code ?? ""} />
            <Field label="Parent ID" onChange={(parentId) => setCreateDraft((current) => ({ ...current, parentId }))} value={createDraft.parentId ?? ""} />
            <Button
              disabled={busy || !createDraft.name.trim()}
              onClick={() => void runAction(async () => {
                const organization = await controller.createOrganization(createDraft);
                setCreateDraft(emptyOrganizationDraft());
                await refreshOrganizations();
                setSelectedOrganizationId(organization.organizationId);
              }, "Organization created")}
              type="button"
            >
              Create organization
            </Button>
          </section>

          <section className="space-y-3 rounded-[0.75rem] border border-[var(--sdk-color-border-default)] p-4">
            <h3 className="text-sm font-semibold">Select organization</h3>
            <label className="block space-y-2 text-sm">
              <span>Organization</span>
              <select
                className="w-full rounded-[0.75rem] border border-[var(--sdk-color-border-default)] bg-transparent px-3 py-2"
                onChange={(event) => setSelectedOrganizationId(event.target.value)}
                value={selectedOrganizationId}
              >
                <option value="">Select organization</option>
                {organizations.map((organization) => (
                  <option key={organization.organizationId} value={organization.organizationId}>
                    {organization.name} ({organization.organizationId})
                  </option>
                ))}
              </select>
            </label>
            <SdkworkIamListPaginationControls
              busy={busy}
              onLoadMore={() => void runAction(async () => {
                const items = await controller.loadMoreOrganizations();
                setOrganizations(items);
              }, "Loaded more organizations")}
              pageInfo={controller.getState().organizationListPageInfo}
            />
          </section>
        </div>

        {selectedOrganization ? (
          <section className="space-y-3 rounded-[0.75rem] border border-[var(--sdk-color-border-default)] p-4">
            <h3 className="text-sm font-semibold">Update organization</h3>
            <Field label="Name" onChange={(name) => setEditDraft((current) => ({ ...current, name }))} value={editDraft.name} />
            <Field label="Code" onChange={(code) => setEditDraft((current) => ({ ...current, code }))} value={editDraft.code ?? ""} />
            <Field label="Status" onChange={(status) => setEditDraft((current) => ({ ...current, status }))} value={editDraft.status ?? ""} />
            <div className="flex flex-wrap gap-2">
              <Button
                disabled={busy || !editDraft.name.trim()}
                onClick={() => void runAction(async () => {
                  await controller.updateOrganization(selectedOrganization.organizationId, editDraft);
                  await refreshOrganizations();
                }, "Organization updated")}
                type="button"
              >
                Save changes
              </Button>
              <Button
                disabled={busy}
                onClick={() => void runAction(async () => {
                  await controller.deleteOrganization(selectedOrganization.organizationId);
                  setSelectedOrganizationId("");
                  await refreshOrganizations();
                }, "Organization deleted")}
                type="button"
                variant="danger"
              >
                Delete organization
              </Button>
            </div>
          </section>
        ) : null}

        {selectedOrganization ? (
          <section className="space-y-3 rounded-[0.75rem] border border-[var(--sdk-color-border-default)] p-4">
            <h3 className="text-sm font-semibold">Departments</h3>
            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Name" onChange={(name) => setDepartmentDraft((current) => ({ ...current, name }))} value={departmentDraft.name} />
              <Field label="Parent department ID" onChange={(parentDepartmentId) => setDepartmentDraft((current) => ({ ...current, parentDepartmentId }))} value={departmentDraft.parentDepartmentId ?? ""} />
            </div>
            <Button
              disabled={busy || !departmentDraft.name.trim()}
              onClick={() => void runAction(async () => {
                await controller.createDepartment({
                  ...departmentDraft,
                  organizationId: selectedOrganization.organizationId,
                });
                setDepartmentDraft(emptyDepartmentDraft(selectedOrganization.organizationId));
                await refreshDepartments(selectedOrganization.organizationId);
              }, "Department created")}
              type="button"
            >
              Add department
            </Button>
            <ul className="space-y-2">
              {departments.map((department) => (
                <li
                  className="flex flex-wrap items-center justify-between gap-2 rounded-[0.75rem] border border-[var(--sdk-color-border-default)] px-3 py-2 text-sm"
                  key={department.departmentId}
                >
                  <span>
                    {department.name} ({department.departmentId})
                    {department.parentDepartmentId ? ` — parent ${department.parentDepartmentId}` : ""}
                  </span>
                  <Button
                    disabled={busy}
                    onClick={() => void runAction(async () => {
                      await controller.deleteDepartment(department.departmentId);
                      await refreshDepartments(selectedOrganization.organizationId);
                    }, "Department deleted")}
                    type="button"
                    variant="outline"
                  >
                    Remove
                  </Button>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {selectedOrganization ? (
          <section className="space-y-3 rounded-[0.75rem] border border-[var(--sdk-color-border-default)] p-4">
            <h3 className="text-sm font-semibold">Memberships</h3>
            <div className="grid gap-3 md:grid-cols-2">
              <Field label="User ID" onChange={(userId) => setMemberDraft((current) => ({ ...current, userId }))} value={memberDraft.userId} />
              <Field label="Role code" onChange={(roleCode) => setMemberDraft((current) => ({ ...current, roleCode }))} value={memberDraft.roleCode ?? ""} />
            </div>
            <Button
              disabled={busy || !memberDraft.userId.trim()}
              onClick={() => void runAction(async () => {
                await controller.addMembership(selectedOrganization.organizationId, memberDraft);
                setMemberDraft(emptyMembershipDraft());
                await refreshMemberships(selectedOrganization.organizationId);
              }, "Member added")}
              type="button"
            >
              Add member
            </Button>
            <ul className="space-y-2">
              {memberships.map((membership) => (
                <li
                  className="flex flex-wrap items-center justify-between gap-2 rounded-[0.75rem] border border-[var(--sdk-color-border-default)] px-3 py-2 text-sm"
                  key={membership.id}
                >
                  <span>
                    {membership.displayName || membership.username || membership.userId}
                    {membership.roleCode ? ` — ${membership.roleCode}` : ""}
                  </span>
                  {membership.membershipId ? (
                    <Button
                      disabled={busy}
                      onClick={() => void runAction(async () => {
                        await controller.updateMembership(membership.membershipId!, { status: "inactive" });
                        await refreshMemberships(selectedOrganization.organizationId);
                      }, "Member updated")}
                      type="button"
                      variant="outline"
                    >
                      Deactivate
                    </Button>
                  ) : null}
                </li>
              ))}
            </ul>
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
