import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Filter, Plus, Trash2 } from "lucide-react";
import {
  Button,
  ConfirmDialog,
  DataTable,
  type DataTableColumn,
  StatusBadge,
  StatusNotice,
} from "@sdkwork/ui-pc-react";

import type {
  SdkworkIamAuthorizationAdminWorkspaceProps,
  SdkworkIamRoleBinding,
  SdkworkIamRoleBindingDraft,
  SdkworkIamRoleBindingDrawerCopy,
} from "../types/permission-admin-types";
import { RoleBindingDrawer } from "../components/RoleBindingDrawer";
import { toErrorMessage } from "../components/catalog-form";
import { CatalogPagination } from "@sdkwork/iam-pc-admin-core";

const emptyBindingDraft = (): SdkworkIamRoleBindingDraft => ({
  principalId: "",
  principalKind: "user",
  roleId: "",
  scopeId: "",
  scopeKind: "organization",
});
const readOnlyPermissions = { roleBindings: { create: false, delete: false } } as const;

const authorizationAdminMessages = {
  "en-US": {
    cancel: "Cancel",
    createBinding: "Create binding",
    createBindingDescription: "Bind a role to a principal within a scope.",
    createBindingSuccess: "Role binding created",
    createBindingTitle: "Create role binding",
    effect: "Effect",
    effects: { allow: "Allow", deny: "Deny" },
    emptyDescription: "Create a role binding to grant a role to a principal.",
    emptyTitle: "No role bindings",
    filter: "Filter",
    filterByPrincipalId: "Principal ID",
    filterByRole: "Role",
    filterByScopeId: "Scope ID",
    filterReset: "Reset",
    loadError: "Failed to load role bindings",
    noMatchDescription: "Try different filters or clear them to see all bindings.",
    noMatchTitle: "No matching role bindings",
    operationError: "Operation failed",
    paginationNext: "Next",
    paginationPageSize: "Per page",
    paginationPrevious: "Previous",
    paginationTotal: "{total} items in total",
    principal: "Principal",
    principalId: "Principal ID",
    principalKind: "Principal kind",
    principalKinds: { group: "Group", organizationMembership: "Organization member", serviceAccount: "Service account", user: "User" },
    revoke: "Revoke",
    revokeDescription: "Revoke this role binding? Access granted through it will stop immediately.",
    revokeSuccess: "Role binding revoked",
    role: "Role",
    scope: "Scope",
    scopeId: "Scope ID",
    scopeKind: "Scope kind",
    scopeKinds: { organization: "Organization", tenant: "Tenant" },
    save: "Save changes",
    search: "Apply",
    status: "Status",
    statuses: { active: "Active", disabled: "Disabled", unknown: "Unknown" },
  },
  "zh-CN": {
    cancel: "取消",
    createBinding: "创建绑定",
    createBindingDescription: "将角色绑定到某个范围内的主体。",
    createBindingSuccess: "角色绑定已创建",
    createBindingTitle: "创建角色绑定",
    effect: "效果",
    effects: { allow: "允许", deny: "拒绝" },
    emptyDescription: "创建角色绑定以将角色授予主体。",
    emptyTitle: "暂无角色绑定",
    filter: "筛选",
    filterByPrincipalId: "主体 ID",
    filterByRole: "角色",
    filterByScopeId: "范围 ID",
    filterReset: "重置",
    loadError: "角色绑定加载失败",
    noMatchDescription: "请尝试其他筛选条件，或清除筛选查看全部绑定。",
    noMatchTitle: "未找到匹配的角色绑定",
    operationError: "操作失败",
    paginationNext: "下一页",
    paginationPageSize: "每页条数",
    paginationPrevious: "上一页",
    paginationTotal: "共 {total} 条",
    principal: "主体",
    principalId: "主体 ID",
    principalKind: "主体类型",
    principalKinds: { group: "用户组", organizationMembership: "组织成员", serviceAccount: "服务账号", user: "用户" },
    revoke: "撤销",
    revokeDescription: "确定撤销该角色绑定吗？通过其授予的访问权限将立即失效。",
    revokeSuccess: "角色绑定已撤销",
    role: "角色",
    scope: "范围",
    scopeId: "范围 ID",
    scopeKind: "范围类型",
    scopeKinds: { organization: "组织", tenant: "租户" },
    save: "保存更改",
    search: "应用",
    status: "状态",
    statuses: { active: "正常", disabled: "已禁用", unknown: "未知" },
  },
} as const;

type AuthorizationAdminCopy = (typeof authorizationAdminMessages)["en-US"] | (typeof authorizationAdminMessages)["zh-CN"];

interface AuthorizationFilters {
  principalId?: string;
  roleId?: string;
  scopeId?: string;
}

export function SdkworkIamAuthorizationAdminWorkspace({
  controller,
  locale,
  permissions = readOnlyPermissions,
}: SdkworkIamAuthorizationAdminWorkspaceProps) {
  const copy = resolveCopy(locale);
  const [bindings, setBindings] = useState(controller.getState().roleBindings);
  const [roles, setRoles] = useState(controller.getState().roles);
  const [listPageInfo, setListPageInfo] = useState(controller.getState().listPageInfo);
  const [roleQuery, setRoleQuery] = useState("");
  const [principalQuery, setPrincipalQuery] = useState("");
  const [scopeQuery, setScopeQuery] = useState("");
  const [filters, setFilters] = useState<AuthorizationFilters>({});
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [bindingOpen, setBindingOpen] = useState(false);
  const [bindingDraft, setBindingDraft] = useState<SdkworkIamRoleBindingDraft>(emptyBindingDraft);
  const [revokeTarget, setRevokeTarget] = useState<SdkworkIamRoleBinding>();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [notice, setNotice] = useState<string>();

  const refreshBindings = async (
    nextFilters = filters,
    nextPage = page,
    nextPageSize = pageSize,
  ) => {
    const params: Record<string, unknown> = { page: nextPage, page_size: nextPageSize };
    if (nextFilters.roleId) params.roleId = nextFilters.roleId;
    if (nextFilters.principalId) params.principalId = nextFilters.principalId;
    if (nextFilters.scopeId) params.scopeId = nextFilters.scopeId;
    const next = await controller.listRoleBindings(params);
    setBindings(next);
    setListPageInfo(controller.getState().listPageInfo);
    return next;
  };

  const refreshRoles = async () => {
    const next = await controller.listRoles();
    setRoles(next);
    return next;
  };

  useEffect(() => {
    setLoading(true);
    void Promise.all([refreshBindings(), refreshRoles()])
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

  const submitFilters = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextFilters: AuthorizationFilters = {
      roleId: roleQuery.trim() || undefined,
      principalId: principalQuery.trim() || undefined,
      scopeId: scopeQuery.trim() || undefined,
    };
    setFilters(nextFilters);
    setPage(1);
    setLoading(true);
    setError(undefined);
    void refreshBindings(nextFilters, 1)
      .catch((loadError) => setError(toErrorMessage(loadError, copy.loadError)))
      .finally(() => setLoading(false));
  };

  const resetFilters = () => {
    setRoleQuery("");
    setPrincipalQuery("");
    setScopeQuery("");
    setFilters({});
    setPage(1);
    setLoading(true);
    setError(undefined);
    void refreshBindings({}, 1)
      .catch((loadError) => setError(toErrorMessage(loadError, copy.loadError)))
      .finally(() => setLoading(false));
  };

  const changePage = (nextPage: number) => {
    setPage(nextPage);
    setLoading(true);
    setError(undefined);
    void refreshBindings(filters, nextPage)
      .catch((loadError) => setError(toErrorMessage(loadError, copy.loadError)))
      .finally(() => setLoading(false));
  };

  const changePageSize = (nextPageSize: number) => {
    setPageSize(nextPageSize);
    setPage(1);
    setLoading(true);
    setError(undefined);
    void refreshBindings(filters, 1, nextPageSize)
      .catch((loadError) => setError(toErrorMessage(loadError, copy.loadError)))
      .finally(() => setLoading(false));
  };

  const openCreateBinding = () => {
    setBindingDraft(emptyBindingDraft());
    setBindingOpen(true);
  };

  const roleName = (roleId: string) => roles.find((role) => role.roleId === roleId)?.name || roleId;

  const columns = useMemo<DataTableColumn<SdkworkIamRoleBinding>[]>(() => [
    { id: "principal", header: copy.principal, cell: (item) => `${kindLabel(copy.principalKinds, item.principalKind)}:${item.principalId}` },
    { id: "role", header: copy.role, cell: (item) => roleName(item.roleId) },
    { id: "scope", header: copy.scope, cell: (item) => `${kindLabel(copy.scopeKinds, item.scopeKind)}:${item.scopeId}` },
    { id: "effect", header: copy.effect, cell: (item) => item.effect ? effectLabel(copy.effects, item.effect) : "—" },
    { id: "status", header: copy.status, cell: (item) => item.status ? <StatusBadge label={statusLabel(copy.statuses, item.status)} showIcon status={item.status} /> : "—" },
  ], [copy, roles]);

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

  const hasFilters = Boolean(filters.roleId || filters.principalId || filters.scopeId);

  return (
    <div className="flex h-full min-h-0 flex-col gap-6">
      <div className="flex min-h-0 flex-1 flex-col gap-3">
        {error ? <StatusNotice tone="danger">{error}</StatusNotice> : null}
        {notice ? <StatusNotice tone="success">{notice}</StatusNotice> : null}
        <DataTable
          columns={columns}
          emptyDescription={hasFilters ? copy.noMatchDescription : copy.emptyDescription}
          emptyTitle={hasFilters ? copy.noMatchTitle : copy.emptyTitle}
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
              pageInfo={listPageInfo?.roleBindings}
            />
          )}
          getRowId={(item) => item.id}
          loading={loading}
          rowActions={permissions.roleBindings.delete ? (item) => (
            <Button aria-label={`${copy.revoke}: ${item.id}`} onClick={() => setRevokeTarget(item)} size="icon" title={copy.revoke} type="button" variant="ghost">
              <Trash2 aria-hidden="true" className="h-4 w-4" />
            </Button>
          ) : undefined}
          className="min-h-0 flex-1"
          rows={[...bindings]}
          slotProps={{
            surface: { className: "flex min-h-0 flex-1 flex-col" },
            viewport: { className: "min-h-0 flex-1" },
            footer: { className: "shrink-0" },
          }}
          stickyHeader
          toolbar={(
            <div className="flex min-w-0 flex-1 flex-wrap items-center justify-end gap-2">
              <form className="flex flex-1 flex-wrap items-end justify-end gap-2" onSubmit={submitFilters} role="search">
                <label className="block space-y-2 text-sm">
                  <span>{copy.filterByRole}</span>
                  <select
                    aria-label={copy.filterByRole}
                    className="h-9 min-w-[10rem] rounded-[0.75rem] border border-[var(--sdk-color-border-default)] bg-transparent px-3 py-1.5 text-sm"
                    onChange={(event) => setRoleQuery(event.target.value)}
                    value={roleQuery}
                  >
                    <option value="">{copy.filterByRole}</option>
                    {roles.map((role) => (
                      <option key={role.roleId} value={role.roleId}>
                        {role.name} ({role.code || role.roleId})
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block space-y-2 text-sm">
                  <span>{copy.filterByPrincipalId}</span>
                  <input
                    aria-label={copy.filterByPrincipalId}
                    className="h-9 w-full min-w-[10rem] border border-[var(--sdk-color-border-default)] bg-transparent px-3 py-1.5 text-sm"
                    onChange={(event) => setPrincipalQuery(event.target.value)}
                    type="search"
                    value={principalQuery}
                  />
                </label>
                <label className="block space-y-2 text-sm">
                  <span>{copy.filterByScopeId}</span>
                  <input
                    aria-label={copy.filterByScopeId}
                    className="h-9 w-full min-w-[10rem] border border-[var(--sdk-color-border-default)] bg-transparent px-3 py-1.5 text-sm"
                    onChange={(event) => setScopeQuery(event.target.value)}
                    type="search"
                    value={scopeQuery}
                  />
                </label>
                <Button disabled={loading} size="sm" type="submit" variant="outline">
                  <Filter aria-hidden="true" className="h-4 w-4" />
                  {copy.search}
                </Button>
                {hasFilters ? (
                  <Button disabled={loading} onClick={resetFilters} size="sm" type="button" variant="ghost">
                    {copy.filterReset}
                  </Button>
                ) : null}
              </form>
              {permissions.roleBindings.create ? (
                <Button onClick={openCreateBinding} type="button">
                  <Plus aria-hidden="true" className="h-4 w-4" />
                  {copy.createBinding}
                </Button>
              ) : null}
            </div>
          )}
        />
      </div>

      <RoleBindingDrawer
        busy={busy}
        copy={bindingDrawerCopy}
        draft={bindingDraft}
        onDraftChange={setBindingDraft}
        onOpenChange={(open) => { if (!open) setBindingOpen(false); }}
        onSubmit={() => void runAction(async () => {
          await controller.assignRoleBinding(bindingDraft);
          await refreshBindings();
          setBindingDraft(emptyBindingDraft());
          setBindingOpen(false);
        }, copy.createBindingSuccess)}
        open={bindingOpen}
        roles={[...roles]}
      />

      <ConfirmDialog
        closeOnConfirm={false}
        confirmLabel={copy.revoke}
        confirmLoading={busy}
        description={copy.revokeDescription}
        onConfirm={() => {
          if (!revokeTarget) return;
          void runAction(async () => {
            await controller.revokeRoleBinding(revokeTarget.id);
            await refreshBindings();
            setRevokeTarget(undefined);
          }, copy.revokeSuccess);
        }}
        onOpenChange={(open) => {
          if (!open && !busy) setRevokeTarget(undefined);
        }}
        open={Boolean(revokeTarget)}
        title={copy.revoke}
        tone="danger"
      />
    </div>
  );
}

function resolveCopy(locale?: string): AuthorizationAdminCopy {
  return locale?.toLowerCase().startsWith("zh") ? authorizationAdminMessages["zh-CN"] : authorizationAdminMessages["en-US"];
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

function statusLabel(statuses: { active: string; disabled: string; unknown: string }, value: string) {
  const normalized = value.trim().toLowerCase();
  return statuses[normalized as keyof typeof statuses] ?? statuses.unknown;
}
