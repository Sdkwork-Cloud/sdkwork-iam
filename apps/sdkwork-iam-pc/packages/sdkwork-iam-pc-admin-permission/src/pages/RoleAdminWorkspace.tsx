import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Pencil, Plus, Search, Trash2, UserCog } from "lucide-react";
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
  StatusBadge,
  StatusNotice,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@sdkwork/ui-pc-react";

import type {
  SdkworkIamPermission,
  SdkworkIamRole,
  SdkworkIamRoleAdminWorkspaceProps,
  SdkworkIamRoleBinding,
  SdkworkIamRoleBindingDraft,
  SdkworkIamRoleBindingDrawerCopy,
  SdkworkIamRoleDraft,
} from "../types/permission-admin-types";
import { RoleBindingDrawer } from "../components/RoleBindingDrawer";
import { CatalogField, CatalogSelect, formatMessage, toErrorMessage } from "../components/catalog-form";
import { CatalogPagination } from "@sdkwork/iam-pc-admin-core";

const emptyRoleDraft = (): SdkworkIamRoleDraft => ({ name: "" });
const emptyBindingDraft = (): SdkworkIamRoleBindingDraft => ({
  principalId: "",
  principalKind: "user",
  roleId: "",
  scopeId: "",
  scopeKind: "organization",
});
const readOnlyPermissions = {
  roleBindings: { create: false, delete: false },
  rolePermissions: { create: false, delete: false },
  roles: { create: false, delete: false, update: false },
} as const;

const roleAdminMessages = {
  "en-US": {
    action: "Action",
    assignPermission: "Assign permission",
    assignPermissionDescription: "Select a permission from the catalog to grant to this role.",
    assignPermissionSuccess: "Permission assigned",
    assignedPermissions: "Assigned permissions",
    cancel: "Cancel",
    code: "Code",
    create: "Create role",
    createBinding: "Create binding",
    createBindingDescription: "Bind this role to a principal within a scope.",
    createBindingSuccess: "Role binding created",
    createBindingTitle: "Create role binding",
    createDescription: "Add a role to the IAM authorization catalog.",
    createSuccess: "Role created",
    createTitle: "Create role",
    delete: "Delete role",
    deleteDescription: "Delete {name}? This permanently removes the role and cannot be undone.",
    deleteSuccess: "Role deleted",
    detailsDescription: "Review role attributes, granted permissions, and role bindings.",
    detailsTitle: "Role details",
    edit: "Edit role",
    editDescription: "Update the selected role.",
    editSuccess: "Role updated",
    editTitle: "Edit role",
    effect: "Effect",
    effects: { allow: "Allow", deny: "Deny" },
    emptyAssignedDescription: "Grant a permission from the catalog to this role.",
    emptyAssignedTitle: "No permissions assigned",
    emptyBindingsDescription: "Bind a principal to this role within a scope.",
    emptyBindingsTitle: "No role bindings",
    emptyDescription: "Create a role to populate the authorization catalog.",
    emptyTitle: "No roles found",
    loadDetailsError: "Failed to load role details",
    loadError: "Failed to load roles",
    name: "Name",
    noMatchDescription: "Try a different name or code.",
    noMatchTitle: "No matching roles",
    operationError: "Operation failed",
    paginationNext: "Next",
    paginationPageSize: "Per page",
    paginationPrevious: "Previous",
    paginationTotal: "{total} items in total",
    principal: "Principal",
    principalId: "Principal ID",
    principalKind: "Principal kind",
    principalKinds: { group: "Group", organizationMembership: "Organization member", serviceAccount: "Service account", user: "User" },
    resource: "Resource",
    revokeBinding: "Revoke binding",
    revokeBindingDescription: "Revoke this role binding?",
    revokeBindingSuccess: "Role binding revoked",
    revokePermission: "Revoke permission",
    revokePermissionDescription: "Revoke {code} from this role?",
    revokePermissionSuccess: "Permission revoked",
    role: "Role",
    roleBindings: "Role bindings",
    save: "Save changes",
    scope: "Scope",
    scopeId: "Scope ID",
    scopeKind: "Scope kind",
    scopeKinds: { organization: "Organization", tenant: "Tenant" },
    search: "Search",
    searchError: "Failed to search roles",
    searchLabel: "Search roles",
    searchPlaceholder: "Search name or code",
    selectPermission: "Permission",
    status: "Status",
    statuses: { active: "Active", disabled: "Disabled", unknown: "Unknown" },
    tenant: "Tenant",
  },
  "zh-CN": {
    action: "操作",
    assignPermission: "分配权限",
    assignPermissionDescription: "从权限目录中选择一项权限授予该角色。",
    assignPermissionSuccess: "权限已分配",
    assignedPermissions: "已授权权限",
    cancel: "取消",
    code: "编码",
    create: "创建角色",
    createBinding: "创建绑定",
    createBindingDescription: "将角色绑定到某个范围内的主体。",
    createBindingSuccess: "角色绑定已创建",
    createBindingTitle: "创建角色绑定",
    createDescription: "向 IAM 授权目录添加新角色。",
    createSuccess: "角色已创建",
    createTitle: "创建角色",
    delete: "删除角色",
    deleteDescription: "确定删除 {name} 吗？该角色将被永久移除，且无法撤销。",
    deleteSuccess: "角色已删除",
    detailsDescription: "查看角色属性、已授权权限与角色绑定。",
    detailsTitle: "角色详情",
    edit: "编辑角色",
    editDescription: "更新所选角色。",
    editSuccess: "角色已更新",
    editTitle: "编辑角色",
    effect: "效果",
    effects: { allow: "允许", deny: "拒绝" },
    emptyAssignedDescription: "从权限目录中为该角色授予权限。",
    emptyAssignedTitle: "暂无已授权权限",
    emptyBindingsDescription: "将主体绑定到该角色在某个范围内的授权。",
    emptyBindingsTitle: "暂无角色绑定",
    emptyDescription: "创建角色后，角色将显示在授权目录中。",
    emptyTitle: "暂无角色",
    loadDetailsError: "角色详情加载失败",
    loadError: "角色加载失败",
    name: "名称",
    noMatchDescription: "请尝试其他名称或编码。",
    noMatchTitle: "未找到匹配角色",
    operationError: "操作失败",
    paginationNext: "下一页",
    paginationPageSize: "每页条数",
    paginationPrevious: "上一页",
    paginationTotal: "共 {total} 条",
    principal: "主体",
    principalId: "主体 ID",
    principalKind: "主体类型",
    principalKinds: { group: "用户组", organizationMembership: "组织成员", serviceAccount: "服务账号", user: "用户" },
    resource: "资源",
    revokeBinding: "撤销绑定",
    revokeBindingDescription: "确定撤销该角色绑定吗？",
    revokeBindingSuccess: "角色绑定已撤销",
    revokePermission: "撤销权限",
    revokePermissionDescription: "确定从该角色撤销 {code} 吗？",
    revokePermissionSuccess: "权限已撤销",
    role: "角色",
    roleBindings: "角色绑定",
    save: "保存更改",
    scope: "范围",
    scopeId: "范围 ID",
    scopeKind: "范围类型",
    scopeKinds: { organization: "组织", tenant: "租户" },
    search: "搜索",
    searchError: "角色搜索失败",
    searchLabel: "搜索角色",
    searchPlaceholder: "搜索名称或编码",
    selectPermission: "权限",
    status: "状态",
    statuses: { active: "正常", disabled: "已禁用", unknown: "未知" },
    tenant: "租户",
  },
} as const;

type RoleAdminCopy = (typeof roleAdminMessages)["en-US"] | (typeof roleAdminMessages)["zh-CN"];

export function SdkworkIamRoleAdminWorkspace({
  controller,
  locale,
  permissions = readOnlyPermissions,
}: SdkworkIamRoleAdminWorkspaceProps) {
  const copy = resolveCopy(locale);
  const [roles, setRoles] = useState(controller.getState().roles);
  const [listPageInfo, setListPageInfo] = useState(controller.getState().listPageInfo);
  const [selectedRole, setSelectedRole] = useState<SdkworkIamRole>();
  const [draft, setDraft] = useState<SdkworkIamRoleDraft>(emptyRoleDraft);
  const [drawerMode, setDrawerMode] = useState<"create" | "edit">();
  const [deleteTarget, setDeleteTarget] = useState<SdkworkIamRole>();
  const [query, setQuery] = useState("");
  const [appliedQuery, setAppliedQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [notice, setNotice] = useState<string>();

  // Role detail drawer state.
  const [detailRole, setDetailRole] = useState<SdkworkIamRole>();
  const [detailTab, setDetailTab] = useState("permissions");
  const [rolePermissions, setRolePermissions] = useState<readonly SdkworkIamPermission[]>([]);
  const [roleBindings, setRoleBindings] = useState<readonly SdkworkIamRoleBinding[]>([]);
  const [permPage, setPermPage] = useState(1);
  const [bindingPage, setBindingPage] = useState(1);
  const [detailLoading, setDetailLoading] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignPermissionId, setAssignPermissionId] = useState("");
  const [assignCatalog, setAssignCatalog] = useState<readonly SdkworkIamPermission[]>([]);
  const [bindingOpen, setBindingOpen] = useState(false);
  const [bindingDraft, setBindingDraft] = useState<SdkworkIamRoleBindingDraft>(emptyBindingDraft);
  const [revokePermissionTarget, setRevokePermissionTarget] = useState<SdkworkIamPermission>();
  const [revokeBindingTarget, setRevokeBindingTarget] = useState<SdkworkIamRoleBinding>();

  const refreshRoles = async (nextQuery = appliedQuery, nextPage = page, nextPageSize = pageSize) => {
    const params: Record<string, unknown> = { page: nextPage, page_size: nextPageSize };
    if (nextQuery) params.q = nextQuery;
    const next = await controller.listRoles(params);
    setRoles(next);
    setListPageInfo(controller.getState().listPageInfo);
    return next;
  };

  useEffect(() => {
    setLoading(true);
    void refreshRoles()
      .catch((loadError) => setError(toErrorMessage(loadError, copy.loadError)))
      .finally(() => setLoading(false));
  }, [controller]);

  const refreshRoleDetails = async (
    roleId: string,
    nextPermPage = permPage,
    nextBindingPage = bindingPage,
  ) => {
    const [nextPermissions, nextBindings] = await Promise.all([
      controller.listRolePermissions(roleId, { page: nextPermPage, page_size: pageSize }),
      controller.listRoleBindings({ roleId, page: nextBindingPage, page_size: pageSize }),
    ]);
    setRolePermissions(nextPermissions);
    setRoleBindings(nextBindings);
    setListPageInfo(controller.getState().listPageInfo);
  };

  const openRoleDetails = (role: SdkworkIamRole) => {
    setDetailRole(role);
    setDetailTab("permissions");
    setPermPage(1);
    setBindingPage(1);
    setDetailLoading(true);
    void refreshRoleDetails(role.roleId, 1, 1)
      .catch((loadError) => setError(toErrorMessage(loadError, copy.loadDetailsError)))
      .finally(() => setDetailLoading(false));
  };

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
    setSelectedRole(undefined);
    setDraft(emptyRoleDraft());
    setDrawerMode("create");
  };

  const openEditDrawer = (role: SdkworkIamRole) => {
    setSelectedRole(role);
    setDraft({ code: role.code ?? "", name: role.name, status: role.status ?? "", tenantId: role.tenantId ?? "" });
    setDrawerMode("edit");
  };

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextQuery = query.trim();
    setAppliedQuery(nextQuery);
    setPage(1);
    setLoading(true);
    setError(undefined);
    void refreshRoles(nextQuery, 1)
      .catch((loadError) => setError(toErrorMessage(loadError, copy.searchError)))
      .finally(() => setLoading(false));
  };

  const changePage = (nextPage: number) => {
    setPage(nextPage);
    setLoading(true);
    setError(undefined);
    void refreshRoles(appliedQuery, nextPage)
      .catch((loadError) => setError(toErrorMessage(loadError, copy.loadError)))
      .finally(() => setLoading(false));
  };

  const changePageSize = (nextPageSize: number) => {
    setPageSize(nextPageSize);
    setPage(1);
    setPermPage(1);
    setBindingPage(1);
    setLoading(true);
    setError(undefined);
    void (async () => {
      await refreshRoles(appliedQuery, 1, nextPageSize);
      if (detailRole) await refreshRoleDetails(detailRole.roleId, 1, 1);
    })().catch((loadError) => setError(toErrorMessage(loadError, copy.loadError))).finally(() => setLoading(false));
  };

  const changePermPage = (nextPage: number) => {
    if (!detailRole) return;
    setPermPage(nextPage);
    setDetailLoading(true);
    setError(undefined);
    void refreshRoleDetails(detailRole.roleId, nextPage, bindingPage)
      .catch((loadError) => setError(toErrorMessage(loadError, copy.loadDetailsError)))
      .finally(() => setDetailLoading(false));
  };

  const changeBindingPage = (nextPage: number) => {
    if (!detailRole) return;
    setBindingPage(nextPage);
    setDetailLoading(true);
    setError(undefined);
    void refreshRoleDetails(detailRole.roleId, permPage, nextPage)
      .catch((loadError) => setError(toErrorMessage(loadError, copy.loadDetailsError)))
      .finally(() => setDetailLoading(false));
  };

  const openAssignDrawer = () => {
    setAssignPermissionId("");
    setAssignOpen(true);
    setError(undefined);
    void controller.listPermissions()
      .then((catalog) => setAssignCatalog(catalog))
      .catch((loadError) => setError(toErrorMessage(loadError, copy.loadError)));
  };

  const openBindingDrawer = () => {
    setBindingDraft({ ...emptyBindingDraft(), roleId: detailRole?.roleId ?? "" });
    setBindingOpen(true);
  };

  const columns = useMemo<DataTableColumn<SdkworkIamRole>[]>(() => [
    { id: "name", header: copy.role, cell: (item) => item.name },
    { id: "code", header: copy.code, cell: (item) => item.code || "—" },
    { id: "status", header: copy.status, cell: (item) => item.status ? <StatusBadge label={statusLabel(copy.statuses, item.status)} showIcon status={item.status} /> : "—" },
  ], [copy]);

  const permissionColumns = useMemo<DataTableColumn<SdkworkIamPermission>[]>(() => [
    { id: "code", header: copy.code, cell: (item) => item.code },
    { id: "name", header: copy.name, cell: (item) => item.name },
    { id: "resource", header: copy.resource, cell: (item) => item.resource || "—" },
    { id: "action", header: copy.action, cell: (item) => item.action || "—" },
  ], [copy]);

  const bindingColumns = useMemo<DataTableColumn<SdkworkIamRoleBinding>[]>(() => [
    { id: "principal", header: copy.principal, cell: (item) => `${kindLabel(copy.principalKinds, item.principalKind)}:${item.principalId}` },
    { id: "scope", header: copy.scope, cell: (item) => `${kindLabel(copy.scopeKinds, item.scopeKind)}:${item.scopeId}` },
    { id: "effect", header: copy.effect, cell: (item) => item.effect ? effectLabel(copy.effects, item.effect) : "—" },
    { id: "status", header: copy.status, cell: (item) => item.status ? <StatusBadge label={statusLabel(copy.statuses, item.status)} showIcon status={item.status} /> : "—" },
  ], [copy]);

  const bindingDrawerCopy: SdkworkIamRoleBindingDrawerCopy = {
    cancel: copy.cancel,
    createDescription: copy.createBindingDescription,
    createTitle: copy.createBindingTitle,
    effect: copy.effect,
    effects: copy.effects,
    principalId: copy.principalId,
    principalKind: copy.principalKind,
    principalKinds: copy.principalKinds,
    role: copy.role,
    save: copy.save,
    scopeId: copy.scopeId,
    scopeKind: copy.scopeKind,
    scopeKinds: copy.scopeKinds,
  };

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
          {permissions.roles.create ? (
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
              pageInfo={listPageInfo?.roles}
            />
          )}
          getRowId={(item) => item.roleId}
          loading={loading}
          onRowClick={openRoleDetails}
          rowActions={(item) => (
            <div className="flex items-center gap-1">
              {permissions.roles.update ? (
                <Button aria-label={`${copy.edit}: ${item.name}`} onClick={() => openEditDrawer(item)} size="icon" title={copy.edit} type="button" variant="ghost">
                  <Pencil aria-hidden="true" className="h-4 w-4" />
                </Button>
              ) : null}
              {permissions.roles.delete ? (
                <Button aria-label={`${copy.delete}: ${item.name}`} onClick={() => setDeleteTarget(item)} size="icon" title={copy.delete} type="button" variant="ghost">
                  <Trash2 aria-hidden="true" className="h-4 w-4" />
                </Button>
              ) : null}
            </div>
          )}
          className="min-h-0 flex-1"
          rows={[...roles]}
          slotProps={{
            surface: { className: "flex min-h-0 flex-1 flex-col" },
            viewport: { className: "min-h-0 flex-1" },
            footer: { className: "shrink-0" },
          }}
          stickyHeader
        />
      </div>

      <RoleDrawer
        busy={busy}
        copy={copy}
        draft={draft}
        mode={drawerMode}
        onDraftChange={setDraft}
        onOpenChange={(open) => {
          if (!open) setDrawerMode(undefined);
        }}
        onSubmit={() => void runAction(async () => {
          if (drawerMode === "edit" && selectedRole) {
            await controller.updateRole(selectedRole.roleId, draft);
          } else {
            await controller.createRole(draft);
          }
          await refreshRoles();
          setDrawerMode(undefined);
        }, drawerMode === "edit" ? copy.editSuccess : copy.createSuccess)}
      />

      <ConfirmDialog
        closeOnConfirm={false}
        confirmLabel={copy.delete}
        confirmLoading={busy}
        description={deleteTarget ? formatMessage(copy.deleteDescription, { name: deleteTarget.name }) : undefined}
        onConfirm={() => {
          if (!deleteTarget) return;
          void runAction(async () => {
            await controller.deleteRole(deleteTarget.roleId);
            if (detailRole?.roleId === deleteTarget.roleId) setDetailRole(undefined);
            await refreshRoles();
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

      <Drawer open={Boolean(detailRole)} onOpenChange={(open) => { if (!open) setDetailRole(undefined); }}>
        <DrawerContent size="lg">
          <DrawerHeader>
            <DrawerTitle>{copy.detailsTitle}</DrawerTitle>
            <DrawerDescription>{copy.detailsDescription}</DrawerDescription>
          </DrawerHeader>
          <DrawerBody className="space-y-6">
            {detailRole ? (
              <>
                <section className="flex flex-wrap items-center gap-3 rounded-[0.75rem] border border-[var(--sdk-color-border-default)] p-4">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--sdk-color-surface-subtle)]">
                    <UserCog aria-hidden="true" className="h-5 w-5 text-[var(--sdk-color-text-muted)]" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{detailRole.name}</p>
                    <p className="text-xs text-[var(--sdk-color-text-muted)]">
                      {copy.code}: {detailRole.code || "—"}
                      {detailRole.tenantId ? ` · ${copy.tenant}: ${detailRole.tenantId}` : ""}
                    </p>
                  </div>
                  {detailRole.status ? <StatusBadge label={statusLabel(copy.statuses, detailRole.status)} showIcon status={detailRole.status} /> : null}
                </section>
                <Tabs defaultValue="permissions" value={detailTab} onValueChange={setDetailTab}>
                  <TabsList>
                    <TabsTrigger value="permissions">{copy.assignedPermissions}</TabsTrigger>
                    <TabsTrigger value="bindings">{copy.roleBindings}</TabsTrigger>
                  </TabsList>
                  <TabsContent className="space-y-4" value="permissions">
                    <DataTable
                      columns={permissionColumns}
                      emptyDescription={copy.emptyAssignedDescription}
                      emptyTitle={copy.emptyAssignedTitle}
                      footer={(
                        <CatalogPagination
                          busy={busy}
                          copy={{
                            next: copy.paginationNext,
                            pageSize: copy.paginationPageSize,
                            previous: copy.paginationPrevious,
                            total: copy.paginationTotal,
                          }}
                          onPageChange={changePermPage}
                          pageInfo={listPageInfo?.rolePermissions?.[detailRole.roleId]}
                        />
                      )}
                      getRowId={(item) => item.permissionId}
                      loading={detailLoading}
                      rowActions={permissions.rolePermissions.delete ? (item) => (
                        <Button aria-label={`${copy.revokePermission}: ${item.code}`} onClick={() => setRevokePermissionTarget(item)} size="icon" title={copy.revokePermission} type="button" variant="ghost">
                          <Trash2 aria-hidden="true" className="h-4 w-4" />
                        </Button>
                      ) : undefined}
                      rows={[...rolePermissions]}
                      slotProps={{
                        surface: { className: "flex min-h-0 flex-1 flex-col" },
                        viewport: { className: "min-h-0 flex-1" },
                        footer: { className: "shrink-0" },
                      }}
                      stickyHeader
                      title={copy.assignedPermissions}
                      toolbar={permissions.rolePermissions.create ? (
                        <Button onClick={openAssignDrawer} type="button">
                          <Plus aria-hidden="true" className="h-4 w-4" />
                          {copy.assignPermission}
                        </Button>
                      ) : undefined}
                    />
                  </TabsContent>
                  <TabsContent className="space-y-4" value="bindings">
                    <DataTable
                      columns={bindingColumns}
                      emptyDescription={copy.emptyBindingsDescription}
                      emptyTitle={copy.emptyBindingsTitle}
                      footer={(
                        <CatalogPagination
                          busy={busy}
                          copy={{
                            next: copy.paginationNext,
                            pageSize: copy.paginationPageSize,
                            previous: copy.paginationPrevious,
                            total: copy.paginationTotal,
                          }}
                          onPageChange={changeBindingPage}
                          pageInfo={listPageInfo?.roleBindings}
                        />
                      )}
                      getRowId={(item) => item.id}
                      loading={detailLoading}
                      rowActions={permissions.roleBindings.delete ? (item) => (
                        <Button aria-label={copy.revokeBinding} onClick={() => setRevokeBindingTarget(item)} size="icon" title={copy.revokeBinding} type="button" variant="ghost">
                          <Trash2 aria-hidden="true" className="h-4 w-4" />
                        </Button>
                      ) : undefined}
                      rows={[...roleBindings]}
                      slotProps={{
                        surface: { className: "flex min-h-0 flex-1 flex-col" },
                        viewport: { className: "min-h-0 flex-1" },
                        footer: { className: "shrink-0" },
                      }}
                      stickyHeader
                      title={copy.roleBindings}
                      toolbar={permissions.roleBindings.create ? (
                        <Button onClick={openBindingDrawer} type="button">
                          <Plus aria-hidden="true" className="h-4 w-4" />
                          {copy.createBinding}
                        </Button>
                      ) : undefined}
                    />
                  </TabsContent>
                </Tabs>
              </>
            ) : null}
          </DrawerBody>
        </DrawerContent>
      </Drawer>

      <Drawer open={assignOpen} onOpenChange={(open) => { if (!open) setAssignOpen(false); }}>
        <DrawerContent size="md">
          <DrawerHeader>
            <DrawerTitle>{copy.assignPermission}</DrawerTitle>
            <DrawerDescription>{copy.assignPermissionDescription}</DrawerDescription>
          </DrawerHeader>
          <DrawerBody className="space-y-4">
            <CatalogSelect
              label={copy.selectPermission}
              onChange={setAssignPermissionId}
              options={assignCatalog.map((item) => ({ label: `${item.code} — ${item.name}`, value: item.permissionId }))}
              placeholder={copy.selectPermission}
              value={assignPermissionId}
            />
          </DrawerBody>
          <DrawerFooter>
            <Button disabled={busy} onClick={() => setAssignOpen(false)} type="button" variant="secondary">
              {copy.cancel}
            </Button>
            <Button
              disabled={busy || !assignPermissionId || !detailRole}
              loading={busy}
              onClick={() => {
                if (!detailRole || !assignPermissionId) return;
                void runAction(async () => {
                  await controller.assignRolePermission(detailRole.roleId, assignPermissionId);
                  await refreshRoleDetails(detailRole.roleId);
                  setAssignPermissionId("");
                  setAssignOpen(false);
                }, copy.assignPermissionSuccess);
              }}
              type="button"
            >
              {copy.assignPermission}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      <RoleBindingDrawer
        busy={busy}
        copy={bindingDrawerCopy}
        defaultRoleId={detailRole?.roleId}
        draft={bindingDraft}
        onDraftChange={setBindingDraft}
        onOpenChange={(open) => { if (!open) setBindingOpen(false); }}
        onSubmit={() => {
          if (!detailRole) return;
          void runAction(async () => {
            await controller.assignRoleBinding({ ...bindingDraft, roleId: detailRole.roleId });
            await refreshRoleDetails(detailRole.roleId);
            setBindingDraft(emptyBindingDraft());
            setBindingOpen(false);
          }, copy.createBindingSuccess);
        }}
        open={bindingOpen}
        roles={[...roles]}
      />

      <ConfirmDialog
        closeOnConfirm={false}
        confirmLabel={copy.revokePermission}
        confirmLoading={busy}
        description={revokePermissionTarget ? formatMessage(copy.revokePermissionDescription, { code: revokePermissionTarget.code }) : undefined}
        onConfirm={() => {
          if (!detailRole || !revokePermissionTarget) return;
          void runAction(async () => {
            await controller.revokeRolePermission(detailRole.roleId, revokePermissionTarget.permissionId);
            await refreshRoleDetails(detailRole.roleId);
            setRevokePermissionTarget(undefined);
          }, copy.revokePermissionSuccess);
        }}
        onOpenChange={(open) => {
          if (!open && !busy) setRevokePermissionTarget(undefined);
        }}
        open={Boolean(revokePermissionTarget)}
        title={copy.revokePermission}
        tone="danger"
      />

      <ConfirmDialog
        closeOnConfirm={false}
        confirmLabel={copy.revokeBinding}
        confirmLoading={busy}
        description={copy.revokeBindingDescription}
        onConfirm={() => {
          if (!detailRole || !revokeBindingTarget) return;
          void runAction(async () => {
            await controller.revokeRoleBinding(revokeBindingTarget.id);
            await refreshRoleDetails(detailRole.roleId);
            setRevokeBindingTarget(undefined);
          }, copy.revokeBindingSuccess);
        }}
        onOpenChange={(open) => {
          if (!open && !busy) setRevokeBindingTarget(undefined);
        }}
        open={Boolean(revokeBindingTarget)}
        title={copy.revokeBinding}
        tone="danger"
      />
    </div>
  );
}

function RoleDrawer({
  busy,
  copy,
  draft,
  mode,
  onDraftChange,
  onOpenChange,
  onSubmit,
}: {
  busy: boolean;
  copy: RoleAdminCopy;
  draft: SdkworkIamRoleDraft;
  mode?: "create" | "edit";
  onDraftChange: (draft: SdkworkIamRoleDraft) => void;
  onOpenChange: (open: boolean) => void;
  onSubmit: () => void;
}) {
  const set = (patch: Partial<SdkworkIamRoleDraft>) => onDraftChange({ ...draft, ...patch });
  return (
    <Drawer open={Boolean(mode)} onOpenChange={onOpenChange}>
      <DrawerContent size="md">
        <DrawerHeader>
          <DrawerTitle>{mode === "edit" ? copy.editTitle : copy.createTitle}</DrawerTitle>
          <DrawerDescription>{mode === "edit" ? copy.editDescription : copy.createDescription}</DrawerDescription>
        </DrawerHeader>
        <DrawerBody className="space-y-4">
          <CatalogField
            label={copy.name}
            onChange={(name) => set({ name })}
            value={draft.name}
          />
          <CatalogField
            label={copy.code}
            onChange={(code) => set({ code })}
            value={draft.code ?? ""}
          />
          {mode === "edit" ? (
            <StatusSelectField
              label={copy.status}
              onChange={(status) => set({ status })}
              statuses={copy.statuses}
              value={draft.status ?? ""}
            />
          ) : null}
        </DrawerBody>
        <DrawerFooter>
          <Button disabled={busy} onClick={() => onOpenChange(false)} type="button" variant="secondary">
            {copy.cancel}
          </Button>
          <Button
            disabled={busy || !draft.name.trim()}
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

function resolveCopy(locale?: string): RoleAdminCopy {
  return locale?.toLowerCase().startsWith("zh") ? roleAdminMessages["zh-CN"] : roleAdminMessages["en-US"];
}

function StatusSelectField({ label, onChange, statuses, value }: { label: string; onChange: (value: string) => void; statuses: { active: string; disabled: string; unknown: string }; value: string }) {
  const normalized = value.trim().toLowerCase();
  const options = [
    ["active", statuses.active],
    ["disabled", statuses.disabled],
  ] as const;
  const currentUnknown = options.some(([optionValue]) => optionValue === normalized) ? undefined : value;
  return (
    <label className="block space-y-2 text-sm">
      <span>{label}</span>
      <Select onValueChange={onChange} value={value}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          {options.map(([optionValue, optionLabel]) => <SelectItem key={optionValue} value={optionValue}>{optionLabel}</SelectItem>)}
          {currentUnknown ? <SelectItem key={currentUnknown} value={currentUnknown}>{statusLabel(statuses, currentUnknown)}</SelectItem> : null}
        </SelectContent>
      </Select>
    </label>
  );
}

function statusLabel(statuses: { active: string; disabled: string; unknown: string }, value: string) {
  const normalized = value.trim().toLowerCase();
  return statuses[normalized as keyof typeof statuses] ?? statuses.unknown;
}

function kindLabel(labels: Record<string, string>, value: string | undefined): string {
  if (!value) return "";
  const normalized = value.trim().toLowerCase();
  return labels[normalized] ?? value;
}

function effectLabel(effects: { allow: string; deny: string }, value: string) {
  const normalized = value.trim().toLowerCase();
  return effects[normalized as keyof typeof effects] ?? value;
}
