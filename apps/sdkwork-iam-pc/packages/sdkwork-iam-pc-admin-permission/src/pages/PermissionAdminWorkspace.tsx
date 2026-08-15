import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
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
  Input,
  StatusNotice,
} from "@sdkwork/ui-pc-react";

import type {
  SdkworkIamPermission,
  SdkworkIamPermissionAdminWorkspaceProps,
  SdkworkIamPermissionDraft,
} from "../types/permission-admin-types";
import { CatalogField, formatMessage, toErrorMessage } from "../components/catalog-form";
import { CatalogPagination } from "@sdkwork/iam-pc-admin-core";

const emptyPermissionDraft = (): SdkworkIamPermissionDraft => ({ code: "", name: "" });
const readOnlyPermissions = { permissions: { create: false, delete: false, update: false } } as const;

const permissionAdminMessages = {
  "en-US": {
    action: "Action",
    cancel: "Cancel",
    code: "Code",
    codeHint: "Dot-separated code such as iam.users.read. Keep it stable once granted.",
    create: "Create permission",
    createDescription: "Define the resource and action represented by this permission.",
    createSuccess: "Permission created",
    createTitle: "Create permission",
    delete: "Delete permission",
    deleteDescription: "Delete {name}? This permanently removes the catalog entry and cannot be undone.",
    deleteSuccess: "Permission deleted",
    edit: "Edit permission",
    editDescription: "Update the selected catalog entry.",
    editSuccess: "Permission updated",
    editTitle: "Edit permission",
    emptyDescription: "Create a permission to populate the catalog.",
    emptyTitle: "No permissions found",
    loadError: "Failed to load permissions",
    name: "Name",
    noMatchDescription: "Try a different code, name, resource, or action.",
    noMatchTitle: "No matching permissions",
    operationError: "Operation failed",
    paginationNext: "Next",
    paginationPageSize: "Per page",
    paginationPrevious: "Previous",
    paginationTotal: "{total} items in total",
    permission: "Permission",
    permissionCode: "Permission code",
    resource: "Resource",
    save: "Save changes",
    search: "Search",
    searchError: "Failed to search permissions",
    searchLabel: "Search permissions",
    searchPlaceholder: "Search code, name, resource, or action",
  },
  "zh-CN": {
    action: "操作",
    cancel: "取消",
    code: "权限码",
    codeHint: "使用点分格式，如 iam.users.read。授权后请保持稳定。",
    create: "创建权限",
    createDescription: "定义该权限所代表的资源与操作。",
    createSuccess: "权限已创建",
    createTitle: "创建权限",
    delete: "删除权限",
    deleteDescription: "确定删除 {name} 吗？该权限目录条目将被永久移除，且无法撤销。",
    deleteSuccess: "权限已删除",
    edit: "编辑权限",
    editDescription: "更新所选权限目录条目。",
    editSuccess: "权限已更新",
    editTitle: "编辑权限",
    emptyDescription: "创建权限后，条目将显示在权限目录中。",
    emptyTitle: "暂无权限",
    loadError: "权限加载失败",
    name: "名称",
    noMatchDescription: "请尝试其他权限码、名称、资源或操作。",
    noMatchTitle: "未找到匹配权限",
    operationError: "操作失败",
    paginationNext: "下一页",
    paginationPageSize: "每页条数",
    paginationPrevious: "上一页",
    paginationTotal: "共 {total} 条",
    permission: "权限",
    permissionCode: "权限码",
    resource: "资源",
    save: "保存更改",
    search: "搜索",
    searchError: "权限搜索失败",
    searchLabel: "搜索权限",
    searchPlaceholder: "搜索权限码、名称、资源或操作",
  },
} as const;

type PermissionAdminCopy = (typeof permissionAdminMessages)["en-US"] | (typeof permissionAdminMessages)["zh-CN"];

export function SdkworkIamPermissionAdminWorkspace({
  controller,
  locale,
  permissions = readOnlyPermissions,
}: SdkworkIamPermissionAdminWorkspaceProps) {
  const copy = resolveCopy(locale);
  const [items, setItems] = useState(controller.getState().permissions);
  const [listPageInfo, setListPageInfo] = useState(controller.getState().listPageInfo);
  const [selectedPermission, setSelectedPermission] = useState<SdkworkIamPermission>();
  const [draft, setDraft] = useState<SdkworkIamPermissionDraft>(emptyPermissionDraft);
  const [drawerMode, setDrawerMode] = useState<"create" | "edit">();
  const [deleteTarget, setDeleteTarget] = useState<SdkworkIamPermission>();
  const [query, setQuery] = useState("");
  const [appliedQuery, setAppliedQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [notice, setNotice] = useState<string>();

  const refreshItems = async (nextQuery = appliedQuery, nextPage = page, nextPageSize = pageSize) => {
    const params: Record<string, unknown> = { page: nextPage, page_size: nextPageSize };
    if (nextQuery) params.q = nextQuery;
    const next = await controller.listPermissions(params);
    setItems(next);
    setListPageInfo(controller.getState().listPageInfo);
    return next;
  };

  useEffect(() => {
    setLoading(true);
    void refreshItems()
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
    setSelectedPermission(undefined);
    setDraft(emptyPermissionDraft());
    setDrawerMode("create");
  };

  const openEditDrawer = (permission: SdkworkIamPermission) => {
    setSelectedPermission(permission);
    setDraft({ action: permission.action ?? "", code: permission.code, name: permission.name, resource: permission.resource ?? "" });
    setDrawerMode("edit");
  };

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextQuery = query.trim();
    setAppliedQuery(nextQuery);
    setPage(1);
    setLoading(true);
    setError(undefined);
    void refreshItems(nextQuery, 1)
      .catch((loadError) => setError(toErrorMessage(loadError, copy.searchError)))
      .finally(() => setLoading(false));
  };

  const changePage = (nextPage: number) => {
    setPage(nextPage);
    setLoading(true);
    setError(undefined);
    void refreshItems(appliedQuery, nextPage)
      .catch((loadError) => setError(toErrorMessage(loadError, copy.loadError)))
      .finally(() => setLoading(false));
  };

  const changePageSize = (nextPageSize: number) => {
    setPageSize(nextPageSize);
    setPage(1);
    setLoading(true);
    setError(undefined);
    void refreshItems(appliedQuery, 1, nextPageSize)
      .catch((loadError) => setError(toErrorMessage(loadError, copy.loadError)))
      .finally(() => setLoading(false));
  };

  const columns = useMemo<DataTableColumn<SdkworkIamPermission>[]>(() => [
    { id: "name", header: copy.permission, cell: (item) => item.name },
    { id: "code", header: copy.permissionCode, cell: (item) => item.code },
    { id: "resource", header: copy.resource, cell: (item) => item.resource || "—" },
    { id: "action", header: copy.action, cell: (item) => item.action || "—" },
  ], [copy]);

  return (
    <div className="flex h-full min-h-0 flex-col gap-6">
      <div className="flex min-h-0 flex-1 flex-col gap-3">
        {error ? <StatusNotice tone="danger">{error}</StatusNotice> : null}
        {notice ? <StatusNotice tone="success">{notice}</StatusNotice> : null}
        <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
          <form className="flex min-w-0 items-center gap-2" onSubmit={submitSearch} role="search">
            <label className="relative w-64 shrink-0">
              <span className="sr-only">{copy.searchLabel}</span>
              <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--sdk-color-text-muted)]" />
              <Input
                aria-label={copy.searchLabel}
                className="pl-9"
                onChange={(event) => setQuery(event.target.value)}
                placeholder={copy.searchPlaceholder}
                type="search"
                value={query}
              />
            </label>
            <Button disabled={loading} type="submit" variant="outline">
              <Search aria-hidden="true" className="h-4 w-4" />
              {copy.search}
            </Button>
          </form>
          {permissions.permissions.create ? (
            <Button onClick={openCreateDrawer} type="button">
              <Plus aria-hidden="true" className="h-4 w-4" />
              {copy.create}
            </Button>
          ) : null}
        </div>
        <DataTable
          columns={columns}
          emptyDescription={appliedQuery ? copy.noMatchDescription : copy.emptyDescription}
          emptyTitle={appliedQuery ? copy.noMatchTitle : copy.emptyTitle}
          footer={(
            <CatalogPagination
              busy={busy}
              copy={{
                next: copy.paginationNext,
                pageSize: copy.paginationPageSize,
                previous: copy.paginationPrevious,
                total: copy.paginationTotal,
              }}
              onPageChange={changePage}
              onPageSizeChange={changePageSize}
              pageInfo={listPageInfo?.permissions}
            />
          )}
          getRowId={(item) => item.permissionId}
          loading={loading}
          onRowClick={(item) => { if (permissions.permissions.update) openEditDrawer(item); }}
          rowActions={(item) => (
            <div className="flex items-center gap-1">
              {permissions.permissions.update ? (
                <Button aria-label={`${copy.edit}: ${item.code}`} onClick={() => openEditDrawer(item)} size="icon" title={copy.edit} type="button" variant="ghost">
                  <Pencil aria-hidden="true" className="h-4 w-4" />
                </Button>
              ) : null}
              {permissions.permissions.delete ? (
                <Button aria-label={`${copy.delete}: ${item.code}`} onClick={() => setDeleteTarget(item)} size="icon" title={copy.delete} type="button" variant="ghost">
                  <Trash2 aria-hidden="true" className="h-4 w-4" />
                </Button>
              ) : null}
            </div>
          )}
          className="min-h-0 flex-1"
          rows={[...items]}
          slotProps={{
            surface: { className: "flex min-h-0 flex-1 flex-col" },
            viewport: { className: "min-h-0 flex-1" },
            footer: { className: "shrink-0" },
          }}
          stickyHeader
        />
      </div>

      <PermissionDrawer
        busy={busy}
        copy={copy}
        draft={draft}
        mode={drawerMode}
        onDraftChange={setDraft}
        onOpenChange={(open) => {
          if (!open) setDrawerMode(undefined);
        }}
        onSubmit={() => void runAction(async () => {
          if (drawerMode === "edit" && selectedPermission) {
            await controller.updatePermission(selectedPermission.permissionId, draft);
          } else {
            await controller.createPermission(draft);
          }
          await refreshItems();
          setDrawerMode(undefined);
        }, drawerMode === "edit" ? copy.editSuccess : copy.createSuccess)}
      />

      <ConfirmDialog
        closeOnConfirm={false}
        confirmLabel={copy.delete}
        confirmLoading={busy}
        description={deleteTarget ? formatMessage(copy.deleteDescription, { name: deleteTarget.name || deleteTarget.code }) : undefined}
        onConfirm={() => {
          if (!deleteTarget) return;
          void runAction(async () => {
            await controller.deletePermission(deleteTarget.permissionId);
            await refreshItems();
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

function PermissionDrawer({
  busy,
  copy,
  draft,
  mode,
  onDraftChange,
  onOpenChange,
  onSubmit,
}: {
  busy: boolean;
  copy: PermissionAdminCopy;
  draft: SdkworkIamPermissionDraft;
  mode?: "create" | "edit";
  onDraftChange: (draft: SdkworkIamPermissionDraft) => void;
  onOpenChange: (open: boolean) => void;
  onSubmit: () => void;
}) {
  const set = (patch: Partial<SdkworkIamPermissionDraft>) => onDraftChange({ ...draft, ...patch });
  return (
    <Drawer open={Boolean(mode)} onOpenChange={onOpenChange}>
      <DrawerContent size="md">
        <DrawerHeader>
          <DrawerTitle>{mode === "edit" ? copy.editTitle : copy.createTitle}</DrawerTitle>
          <DrawerDescription>{mode === "edit" ? copy.editDescription : copy.createDescription}</DrawerDescription>
        </DrawerHeader>
        <DrawerBody className="space-y-4">
          <CatalogField
            hint={copy.codeHint}
            label={copy.permissionCode}
            onChange={(code) => set({ code })}
            value={draft.code}
          />
          <CatalogField
            label={copy.name}
            onChange={(name) => set({ name })}
            value={draft.name}
          />
          <CatalogField
            label={copy.resource}
            onChange={(resource) => set({ resource })}
            value={draft.resource ?? ""}
          />
          <CatalogField
            label={copy.action}
            onChange={(action) => set({ action })}
            value={draft.action ?? ""}
          />
        </DrawerBody>
        <DrawerFooter>
          <Button disabled={busy} onClick={() => onOpenChange(false)} type="button" variant="secondary">
            {copy.cancel}
          </Button>
          <Button
            disabled={busy || !draft.code.trim() || !draft.name.trim()}
            loading={busy}
            onClick={onSubmit}
            type="button"
          >
            {mode === "edit" ? copy.save : copy.createTitle}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

function resolveCopy(locale?: string): PermissionAdminCopy {
  return locale?.toLowerCase().startsWith("zh") ? permissionAdminMessages["zh-CN"] : permissionAdminMessages["en-US"];
}
