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
  SdkworkIamAdminUser,
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
  const [selectedUser, setSelectedUser] = useState<SdkworkIamAdminUser>();
  const [draft, setDraft] = useState<SdkworkIamAdminUserDraft>(emptyUserDraft);
  const [drawerMode, setDrawerMode] = useState<"create" | "edit">();
  const [deleteTarget, setDeleteTarget] = useState<SdkworkIamAdminUser>();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [notice, setNotice] = useState<string>();

  const refreshUsers = async () => {
    const items = await controller.listUsers();
    setUsers(items);
    setListPageInfo(controller.getState().listPageInfo);
    return items;
  };

  useEffect(() => {
    setLoading(true);
    void refreshUsers()
      .catch((loadError) => setError(toErrorMessage(loadError, "Failed to load users")))
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

  const openCreateDrawer = () => {
    setSelectedUser(undefined);
    setDraft(emptyUserDraft());
    setDrawerMode("create");
  };

  const openEditDrawer = async (user: SdkworkIamAdminUser) => {
    setError(undefined);
    try {
      const resolved = await controller.selectUser(user.userId) ?? user;
      setSelectedUser(resolved);
      setDraft(toUserDraft(resolved));
      setDrawerMode("edit");
    } catch (loadError) {
      setError(toErrorMessage(loadError, "Failed to load user"));
    }
  };

  const columns = useMemo<DataTableColumn<SdkworkIamAdminUser>[]>(() => [
    { id: "identity", header: "User", cell: (user) => user.displayName || user.username || user.email || user.userId },
    { id: "username", header: "Username", cell: (user) => user.username || "—" },
    { id: "email", header: "Email", cell: (user) => user.email || "—" },
    { id: "phone", header: "Phone", cell: (user) => user.phone || "—" },
    { id: "status", header: "Status", cell: (user) => user.status || "—" },
  ], []);

  return (
    <div className="space-y-6">
      <SettingsSection description={description} title={title}>
        {error ? <StatusNotice tone="danger">{error}</StatusNotice> : null}
        {notice ? <StatusNotice tone="success">{notice}</StatusNotice> : null}
        <DataTable
          columns={columns}
          emptyDescription="Create a user to populate the IAM directory."
          emptyTitle="No users found"
          getRowId={(user) => user.userId}
          loading={loading}
          onRowClick={(user) => void openEditDrawer(user)}
          rowActions={(user) => (
            <div className="flex items-center gap-2">
              <Button onClick={() => void openEditDrawer(user)} size="sm" type="button" variant="outline">Edit</Button>
              <Button onClick={() => setDeleteTarget(user)} size="sm" type="button" variant="danger">Delete</Button>
            </div>
          )}
          rows={[...users]}
          title="Users"
          toolbar={<Button onClick={openCreateDrawer} type="button">Create user</Button>}
          footer={(
            <SdkworkIamListPaginationControls
              busy={busy}
              onLoadMore={() => void runAction(async () => {
                setUsers(await controller.loadMoreUsers());
                setListPageInfo(controller.getState().listPageInfo);
              }, "Loaded more users")}
              pageInfo={listPageInfo}
            />
          )}
        />
      </SettingsSection>

      <UserDrawer
        busy={busy}
        draft={draft}
        mode={drawerMode}
        onDraftChange={setDraft}
        onOpenChange={(open) => {
          if (!open) setDrawerMode(undefined);
        }}
        onSubmit={() => void runAction(async () => {
          if (drawerMode === "edit" && selectedUser) {
            await controller.updateUser(selectedUser.userId, draft);
          } else {
            await controller.createUser(draft);
          }
          await refreshUsers();
          setDrawerMode(undefined);
        }, drawerMode === "edit" ? "User updated" : "User created")}
      />

      <ConfirmDialog
        closeOnConfirm={false}
        confirmLabel="Delete user"
        confirmLoading={busy}
        description={deleteTarget ? `Delete ${deleteTarget.displayName || deleteTarget.username || deleteTarget.userId}? This action cannot be undone.` : undefined}
        onConfirm={() => {
          if (!deleteTarget) return;
          void runAction(async () => {
            await controller.deleteUser(deleteTarget.userId);
            await refreshUsers();
            setDeleteTarget(undefined);
          }, "User deleted");
        }}
        onOpenChange={(open) => {
          if (!open && !busy) setDeleteTarget(undefined);
        }}
        open={Boolean(deleteTarget)}
        title="Delete user"
        tone="danger"
      />
    </div>
  );
}

function UserDrawer({
  busy,
  draft,
  mode,
  onDraftChange,
  onOpenChange,
  onSubmit,
}: {
  busy: boolean;
  draft: SdkworkIamAdminUserDraft;
  mode?: "create" | "edit";
  onDraftChange: (draft: SdkworkIamAdminUserDraft) => void;
  onOpenChange: (open: boolean) => void;
  onSubmit: () => void;
}) {
  const editing = mode === "edit";
  return (
    <Drawer open={Boolean(mode)} onOpenChange={onOpenChange}>
      <DrawerContent size="md">
        <DrawerHeader>
          <DrawerTitle>{editing ? "Edit user" : "Create user"}</DrawerTitle>
          <DrawerDescription>{editing ? "Update the selected directory record." : "Add a user to the IAM directory."}</DrawerDescription>
        </DrawerHeader>
        <DrawerBody className="space-y-4">
          <Field label="Username" onChange={(username) => onDraftChange({ ...draft, username })} value={draft.username ?? ""} />
          <Field label="Email" onChange={(email) => onDraftChange({ ...draft, email })} value={draft.email ?? ""} />
          <Field label="Display name" onChange={(displayName) => onDraftChange({ ...draft, displayName })} value={draft.displayName ?? ""} />
          <Field label="Phone" onChange={(phone) => onDraftChange({ ...draft, phone })} value={draft.phone ?? ""} />
          {editing ? <Field label="Status" onChange={(status) => onDraftChange({ ...draft, status })} value={draft.status ?? ""} /> : null}
        </DrawerBody>
        <DrawerFooter>
          <Button disabled={busy} onClick={() => onOpenChange(false)} type="button" variant="secondary">Cancel</Button>
          <Button disabled={busy || (!draft.username?.trim() && !draft.email?.trim())} loading={busy} onClick={onSubmit} type="button">
            {editing ? "Save changes" : "Create user"}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

function toUserDraft(user: SdkworkIamAdminUser): SdkworkIamAdminUserDraft {
  return {
    displayName: user.displayName ?? "",
    email: user.email ?? "",
    phone: user.phone ?? "",
    status: user.status ?? "",
    username: user.username ?? "",
  };
}

function toErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function Field({ label, onChange, value }: { label: string; onChange: (value: string) => void; value: string }) {
  return (
    <label className="block space-y-2 text-sm">
      <span>{label}</span>
      <input className="w-full rounded-[0.75rem] border border-[var(--sdk-color-border-default)] bg-transparent px-3 py-2" onChange={(event) => onChange(event.target.value)} value={value} />
    </label>
  );
}
