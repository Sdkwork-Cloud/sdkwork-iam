import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Eye, Pencil, Plus, Search, Trash2 } from "lucide-react";
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
  SdkworkIamAdminUser,
  SdkworkIamAdminUserDraft,
  SdkworkIamUserAdminWorkspaceProps,
} from "../types/user-admin-types";

const emptyUserDraft = (): SdkworkIamAdminUserDraft => ({ username: "" });
const readOnlyPermissions = { create: false, delete: false, update: false } as const;
const userAdminMessages = {
  "en-US": {
    cancel: "Cancel",
    close: "Close",
    create: "Create user",
    createDescription: "Add a user to the IAM directory.",
    createSuccess: "User created",
    createTitle: "Create user",
    defaultDescription: "Create, update, and manage IAM user directory records for backend-admin operators.",
    defaultTitle: "User administration",
    delete: "Delete user",
    deleteDescription: "Delete {name}? This permanently removes the directory record and cannot be undone.",
    deleteSuccess: "User deleted",
    detailsDescription: "Review identity attributes and account status.",
    detailsTitle: "User details",
    displayName: "Display name",
    edit: "Edit user",
    editDescription: "Update the selected directory record.",
    editSuccess: "User updated",
    editTitle: "Edit user",
    email: "Email",
    emptyDescription: "Create a user to populate the IAM directory.",
    emptyTitle: "No users found",
    loadError: "Failed to load users",
    loadedMore: "Loaded more users",
    noMatchDescription: "Try a different name, username, email, or phone number.",
    noMatchTitle: "No matching users",
    operationError: "Operation failed",
    phone: "Phone",
    save: "Save changes",
    search: "Search",
    searchError: "Failed to search users",
    searchLabel: "Search users",
    searchPlaceholder: "Search name, username, email, or phone",
    status: "Status",
    user: "User",
    username: "Username",
    users: "Users",
    usersMatching: "Users matching \"{query}\"",
    view: "View user",
  },
  "zh-CN": {
    cancel: "取消",
    close: "关闭",
    create: "创建用户",
    createDescription: "向 IAM 用户目录添加新用户。",
    createSuccess: "用户已创建",
    createTitle: "创建用户",
    defaultDescription: "管理 IAM 用户目录、身份资料与账号生命周期。",
    defaultTitle: "用户管理",
    delete: "删除用户",
    deleteDescription: "确定删除 {name} 吗？该目录记录将被永久移除，且无法撤销。",
    deleteSuccess: "用户已删除",
    detailsDescription: "查看身份属性和账号状态。",
    detailsTitle: "用户详情",
    displayName: "显示名称",
    edit: "编辑用户",
    editDescription: "更新所选用户的目录记录。",
    editSuccess: "用户已更新",
    editTitle: "编辑用户",
    email: "邮箱",
    emptyDescription: "创建用户后，账号将显示在 IAM 目录中。",
    emptyTitle: "暂无用户",
    loadError: "用户加载失败",
    loadedMore: "已加载更多用户",
    noMatchDescription: "请尝试其他姓名、用户名、邮箱或手机号。",
    noMatchTitle: "未找到匹配用户",
    operationError: "操作失败",
    phone: "手机号",
    save: "保存更改",
    search: "搜索",
    searchError: "用户搜索失败",
    searchLabel: "搜索用户",
    searchPlaceholder: "搜索姓名、用户名、邮箱或手机号",
    status: "状态",
    user: "用户",
    username: "用户名",
    users: "用户",
    usersMatching: "与“{query}”匹配的用户",
    view: "查看用户",
  },
} as const;

export function SdkworkIamUserAdminWorkspace({
  controller,
  description,
  locale,
  permissions = readOnlyPermissions,
  title,
}: SdkworkIamUserAdminWorkspaceProps) {
  const copy = locale?.toLowerCase().startsWith("zh") ? userAdminMessages["zh-CN"] : userAdminMessages["en-US"];
  const [users, setUsers] = useState(controller.getState().users);
  const [listPageInfo, setListPageInfo] = useState(controller.getState().listPageInfo);
  const [selectedUser, setSelectedUser] = useState<SdkworkIamAdminUser>();
  const [draft, setDraft] = useState<SdkworkIamAdminUserDraft>(emptyUserDraft);
  const [drawerMode, setDrawerMode] = useState<"create" | "edit" | "view">();
  const [deleteTarget, setDeleteTarget] = useState<SdkworkIamAdminUser>();
  const [query, setQuery] = useState("");
  const [appliedQuery, setAppliedQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [notice, setNotice] = useState<string>();

  const refreshUsers = async (nextQuery = appliedQuery) => {
    const items = await controller.listUsers(nextQuery ? { q: nextQuery } : undefined);
    setUsers(items);
    setListPageInfo(controller.getState().listPageInfo);
    return items;
  };

  useEffect(() => {
    setLoading(true);
    void refreshUsers()
      .catch((loadError) => setError(toErrorMessage(loadError, copy.loadError)))
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
      setError(toErrorMessage(actionError, copy.operationError));
    } finally {
      setBusy(false);
    }
  };

  const openCreateDrawer = () => {
    setSelectedUser(undefined);
    setDraft(emptyUserDraft());
    setDrawerMode("create");
  };

  const openUserDrawer = async (user: SdkworkIamAdminUser, mode: "edit" | "view") => {
    setError(undefined);
    try {
      const resolved = await controller.selectUser(user.userId) ?? user;
      setSelectedUser(resolved);
      setDraft(toUserDraft(resolved));
      setDrawerMode(mode);
    } catch (loadError) {
      setError(toErrorMessage(loadError, copy.loadError));
    }
  };

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextQuery = query.trim();
    setAppliedQuery(nextQuery);
    setLoading(true);
    setError(undefined);
    void refreshUsers(nextQuery)
      .catch((loadError) => setError(toErrorMessage(loadError, copy.searchError)))
      .finally(() => setLoading(false));
  };

  const columns = useMemo<DataTableColumn<SdkworkIamAdminUser>[]>(() => [
    { id: "identity", header: copy.user, cell: (user) => user.displayName || user.username || user.email || user.userId },
    { id: "username", header: copy.username, cell: (user) => user.username || "-" },
    { id: "email", header: copy.email, cell: (user) => user.email || "-" },
    { id: "phone", header: copy.phone, cell: (user) => user.phone || "-" },
    { id: "status", header: copy.status, cell: (user) => user.status ? <StatusBadge label={user.status} showIcon status={user.status} /> : "-" },
  ], [copy]);

  return (
    <div className="space-y-6">
      <SettingsSection description={description ?? copy.defaultDescription} title={title ?? copy.defaultTitle}>
        {error ? <StatusNotice tone="danger">{error}</StatusNotice> : null}
        {notice ? <StatusNotice tone="success">{notice}</StatusNotice> : null}
        <DataTable
          columns={columns}
          emptyDescription={appliedQuery ? copy.noMatchDescription : copy.emptyDescription}
          emptyTitle={appliedQuery ? copy.noMatchTitle : copy.emptyTitle}
          getRowId={(user) => user.userId}
          loading={loading}
          onRowClick={(user) => void openUserDrawer(user, "view")}
          rowActions={(user) => (
            <div className="flex items-center gap-1">
              <Button aria-label={`${copy.view}: ${user.displayName || user.username || user.userId}`} onClick={() => void openUserDrawer(user, "view")} size="icon" title={copy.view} type="button" variant="ghost">
                <Eye aria-hidden="true" className="h-4 w-4" />
              </Button>
              {permissions.update ? (
                <Button aria-label={`${copy.edit}: ${user.displayName || user.username || user.userId}`} onClick={() => void openUserDrawer(user, "edit")} size="icon" title={copy.edit} type="button" variant="ghost">
                  <Pencil aria-hidden="true" className="h-4 w-4" />
                </Button>
              ) : null}
              {permissions.delete ? (
                <Button aria-label={`${copy.delete}: ${user.displayName || user.username || user.userId}`} onClick={() => setDeleteTarget(user)} size="icon" title={copy.delete} type="button" variant="ghost">
                  <Trash2 aria-hidden="true" className="h-4 w-4" />
                </Button>
              ) : null}
            </div>
          )}
          rows={[...users]}
          title={appliedQuery ? formatMessage(copy.usersMatching, { query: appliedQuery }) : copy.users}
          toolbar={(
            <div className="flex min-w-0 flex-1 flex-wrap items-center justify-end gap-2">
              <form className="flex min-w-[16rem] flex-1 items-center gap-2" onSubmit={submitSearch} role="search">
                <label className="relative min-w-0 flex-1">
                  <span className="sr-only">{copy.searchLabel}</span>
                  <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--sdk-color-text-muted)]" />
                  <input
                    aria-label={copy.searchLabel}
                    className="h-9 w-full border border-[var(--sdk-color-border-default)] bg-transparent pl-9 pr-3 text-sm"
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder={copy.searchPlaceholder}
                    type="search"
                    value={query}
                  />
                </label>
                <Button disabled={loading} size="sm" type="submit" variant="outline">{copy.search}</Button>
              </form>
              {permissions.create ? (
                <Button onClick={openCreateDrawer} type="button">
                  <Plus aria-hidden="true" className="h-4 w-4" />
                  {copy.create}
                </Button>
              ) : null}
            </div>
          )}
          footer={(
            <SdkworkIamListPaginationControls
              busy={busy}
              onLoadMore={() => void runAction(async () => {
                setUsers(await controller.loadMoreUsers());
                setListPageInfo(controller.getState().listPageInfo);
              }, copy.loadedMore)}
              pageInfo={listPageInfo}
            />
          )}
        />
      </SettingsSection>

      <UserDrawer
        busy={busy}
        copy={copy}
        draft={draft}
        mode={drawerMode}
        onDraftChange={setDraft}
        onEdit={() => setDrawerMode("edit")}
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
        }, drawerMode === "edit" ? copy.editSuccess : copy.createSuccess)}
        updateAllowed={permissions.update}
      />

      <ConfirmDialog
        closeOnConfirm={false}
        confirmLabel={copy.delete}
        confirmLoading={busy}
        description={deleteTarget ? formatMessage(copy.deleteDescription, { name: deleteTarget.displayName || deleteTarget.username || deleteTarget.userId }) : undefined}
        onConfirm={() => {
          if (!deleteTarget) return;
          void runAction(async () => {
            await controller.deleteUser(deleteTarget.userId);
            await refreshUsers();
            setDeleteTarget(undefined);
          }, copy.deleteSuccess);
        }}
        onOpenChange={(open) => {
          if (!open && !busy) setDeleteTarget(undefined);
        }}
        open={Boolean(deleteTarget)}
        title={copy.delete}
        tone="danger"
      />
    </div>
  );
}

function UserDrawer({
  busy,
  copy,
  draft,
  mode,
  onDraftChange,
  onEdit,
  onOpenChange,
  onSubmit,
  updateAllowed,
}: {
  busy: boolean;
  copy: typeof userAdminMessages["en-US"] | typeof userAdminMessages["zh-CN"];
  draft: SdkworkIamAdminUserDraft;
  mode?: "create" | "edit" | "view";
  onDraftChange: (draft: SdkworkIamAdminUserDraft) => void;
  onEdit: () => void;
  onOpenChange: (open: boolean) => void;
  onSubmit: () => void;
  updateAllowed: boolean;
}) {
  const editing = mode === "edit";
  const viewing = mode === "view";
  return (
    <Drawer open={Boolean(mode)} onOpenChange={onOpenChange}>
      <DrawerContent size="md">
        <DrawerHeader>
          <DrawerTitle>{viewing ? copy.detailsTitle : editing ? copy.editTitle : copy.createTitle}</DrawerTitle>
          <DrawerDescription>{viewing ? copy.detailsDescription : editing ? copy.editDescription : copy.createDescription}</DrawerDescription>
        </DrawerHeader>
        <DrawerBody className="space-y-4">
          <Field disabled={viewing} label={copy.username} onChange={(username) => onDraftChange({ ...draft, username })} value={draft.username ?? ""} />
          <Field disabled={viewing} label={copy.email} onChange={(email) => onDraftChange({ ...draft, email })} type="email" value={draft.email ?? ""} />
          <Field disabled={viewing} label={copy.displayName} onChange={(displayName) => onDraftChange({ ...draft, displayName })} value={draft.displayName ?? ""} />
          <Field disabled={viewing} label={copy.phone} onChange={(phone) => onDraftChange({ ...draft, phone })} type="tel" value={draft.phone ?? ""} />
          {mode !== "create" ? <Field disabled={viewing} label={copy.status} onChange={(status) => onDraftChange({ ...draft, status })} value={draft.status ?? ""} /> : null}
        </DrawerBody>
        <DrawerFooter>
          <Button disabled={busy} onClick={() => onOpenChange(false)} type="button" variant="secondary">{viewing ? copy.close : copy.cancel}</Button>
          {viewing && updateAllowed ? (
            <Button onClick={onEdit} type="button">
              <Pencil aria-hidden="true" className="h-4 w-4" />
              {copy.edit}
            </Button>
          ) : null}
          {!viewing ? (
            <Button disabled={busy || (!draft.username?.trim() && !draft.email?.trim() && !draft.phone?.trim())} loading={busy} onClick={onSubmit} type="button">
              {editing ? copy.save : copy.create}
            </Button>
          ) : null}
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

function formatMessage(template: string, values: Record<string, string>) {
  return Object.entries(values).reduce(
    (result, [key, value]) => result.replaceAll(`{${key}}`, value),
    template,
  );
}

function Field({ disabled, label, onChange, type = "text", value }: { disabled?: boolean; label: string; onChange: (value: string) => void; type?: "email" | "tel" | "text"; value: string }) {
  return (
    <label className="block space-y-2 text-sm">
      <span>{label}</span>
      <input className="w-full border border-[var(--sdk-color-border-default)] bg-transparent px-3 py-2 disabled:cursor-not-allowed disabled:bg-[var(--sdk-color-surface-subtle)]" disabled={disabled} onChange={(event) => onChange(event.target.value)} type={type} value={value} />
    </label>
  );
}
