import { useEffect, useState } from "react";
import { SdkworkIamListPaginationControls } from "@sdkwork/iam-pc-admin-core";
import { Button, SettingsSection, StatusNotice } from "@sdkwork/ui-pc-react";

import type {
  SdkworkIamAdminUserDraft,
  SdkworkIamUserAdminWorkspaceProps,
} from "../types/user-admin-types";

const emptyUserDraft = (): SdkworkIamAdminUserDraft => ({ username: "" });

export function SdkworkIamUserAdminWorkspace({
  controller,
  description = "Create, update, and manage IAM user directory records for backend-admin operators.",
  title = "User administration",
}: SdkworkIamUserAdminWorkspaceProps) {
  const [users, setUsers] = useState(controller.getState().users);
  const [listPageInfo, setListPageInfo] = useState(controller.getState().listPageInfo);
  const [selectedUserId, setSelectedUserId] = useState(controller.getSelectedUser()?.userId ?? "");
  const [createDraft, setCreateDraft] = useState(emptyUserDraft);
  const [editDraft, setEditDraft] = useState<SdkworkIamAdminUserDraft>(emptyUserDraft());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [notice, setNotice] = useState<string | undefined>();

  const selectedUser = users.find((user) => user.userId === selectedUserId);

  const refreshUsers = async () => {
    const items = await controller.listUsers();
    setUsers(items);
    setListPageInfo(controller.getState().listPageInfo);
    return items;
  };

  const loadMoreUsers = async () => {
    const items = await controller.loadMoreUsers();
    setUsers(items);
    setListPageInfo(controller.getState().listPageInfo);
    return items;
  };

  useEffect(() => {
    void refreshUsers().catch((loadError) => {
      setError(loadError instanceof Error ? loadError.message : "Failed to load users");
    });
  }, [controller]);

  useEffect(() => {
    if (!selectedUserId) {
      setEditDraft(emptyUserDraft());
      return;
    }
    void controller.selectUser(selectedUserId)
      .then((user) => {
        if (user) {
          setEditDraft({
            displayName: user.displayName ?? "",
            email: user.email ?? "",
            phone: user.phone ?? "",
            status: user.status ?? "",
            username: user.username ?? "",
          });
        }
      })
      .catch((loadError) => {
        setError(loadError instanceof Error ? loadError.message : "Failed to load user");
      });
  }, [controller, selectedUserId]);

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
            <h3 className="text-sm font-semibold">Create user</h3>
            <Field label="Username" onChange={(username) => setCreateDraft((current) => ({ ...current, username }))} value={createDraft.username ?? ""} />
            <Field label="Email" onChange={(email) => setCreateDraft((current) => ({ ...current, email }))} value={createDraft.email ?? ""} />
            <Field label="Display name" onChange={(displayName) => setCreateDraft((current) => ({ ...current, displayName }))} value={createDraft.displayName ?? ""} />
            <Button
              disabled={busy || (!createDraft.username?.trim() && !createDraft.email?.trim())}
              onClick={() => void runAction(async () => {
                const user = await controller.createUser(createDraft);
                setCreateDraft(emptyUserDraft());
                await refreshUsers();
                setSelectedUserId(user.userId);
              }, "User created")}
              type="button"
            >
              Create user
            </Button>
          </section>

          <section className="space-y-3 rounded-[0.75rem] border border-[var(--sdk-color-border-default)] p-4">
            <h3 className="text-sm font-semibold">Select user</h3>
            <label className="block space-y-2 text-sm">
              <span>User</span>
              <select
                className="w-full rounded-[0.75rem] border border-[var(--sdk-color-border-default)] bg-transparent px-3 py-2"
                onChange={(event) => setSelectedUserId(event.target.value)}
                value={selectedUserId}
              >
                <option value="">Select user</option>
                {users.map((user) => (
                  <option key={user.userId} value={user.userId}>
                    {user.displayName || user.username || user.email || user.userId}
                  </option>
                ))}
              </select>
            </label>
            <SdkworkIamListPaginationControls
              busy={busy}
              onLoadMore={() => {
                void loadMoreUsers().catch((loadError) => {
                  setError(loadError instanceof Error ? loadError.message : "Failed to load more users");
                });
              }}
              pageInfo={listPageInfo}
            />
          </section>
        </div>

        {selectedUser ? (
          <section className="space-y-3 rounded-[0.75rem] border border-[var(--sdk-color-border-default)] p-4">
            <h3 className="text-sm font-semibold">Update user</h3>
            <Field label="Username" onChange={(username) => setEditDraft((current) => ({ ...current, username }))} value={editDraft.username ?? ""} />
            <Field label="Email" onChange={(email) => setEditDraft((current) => ({ ...current, email }))} value={editDraft.email ?? ""} />
            <Field label="Display name" onChange={(displayName) => setEditDraft((current) => ({ ...current, displayName }))} value={editDraft.displayName ?? ""} />
            <Field label="Phone" onChange={(phone) => setEditDraft((current) => ({ ...current, phone }))} value={editDraft.phone ?? ""} />
            <Field label="Status" onChange={(status) => setEditDraft((current) => ({ ...current, status }))} value={editDraft.status ?? ""} />
            <div className="flex flex-wrap gap-2">
              <Button
                disabled={busy}
                onClick={() => void runAction(async () => {
                  await controller.updateUser(selectedUser.userId, editDraft);
                  await refreshUsers();
                }, "User updated")}
                type="button"
              >
                Save changes
              </Button>
              <Button
                disabled={busy}
                onClick={() => void runAction(async () => {
                  await controller.deleteUser(selectedUser.userId);
                  setSelectedUserId("");
                  await refreshUsers();
                }, "User deleted")}
                type="button"
                variant="danger"
              >
                Delete user
              </Button>
            </div>
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
