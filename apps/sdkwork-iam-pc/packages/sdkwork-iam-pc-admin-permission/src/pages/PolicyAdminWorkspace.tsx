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
  StatusBadge,
  StatusNotice,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@sdkwork/ui-pc-react";

import type {
  SdkworkIamPolicy,
  SdkworkIamPolicyAdminWorkspaceProps,
  SdkworkIamPolicyDraft,
} from "../types/permission-admin-types";
import { CatalogField, formatMessage, toErrorMessage } from "../components/catalog-form";
import { CatalogPagination } from "@sdkwork/iam-pc-admin-core";

const emptyPolicyDraft = (): SdkworkIamPolicyDraft => ({ name: "" });
const readOnlyPermissions = { policies: { create: false, delete: false, update: false } } as const;

const policyAdminMessages = {
  "en-US": {
    cancel: "Cancel",
    code: "Code",
    create: "Create policy",
    createDescription: "Manage an IAM policy catalog entry.",
    createSuccess: "Policy created",
    createTitle: "Create policy",
    delete: "Delete policy",
    deleteDescription: "Delete {name}? This permanently removes the catalog entry and cannot be undone.",
    deleteSuccess: "Policy deleted",
    edit: "Edit policy",
    editDescription: "Update the selected catalog entry.",
    editSuccess: "Policy updated",
    editTitle: "Edit policy",
    emptyDescription: "Create a policy to populate the catalog.",
    emptyTitle: "No policies found",
    loadError: "Failed to load policies",
    name: "Name",
    noMatchDescription: "Try a different name or code.",
    noMatchTitle: "No matching policies",
    operationError: "Operation failed",
    paginationNext: "Next",
    paginationPageSize: "Per page",
    paginationPrevious: "Previous",
    paginationTotal: "{total} items in total",
    policy: "Policy",
    save: "Save changes",
    search: "Search",
    searchError: "Failed to search policies",
    searchLabel: "Search policies",
    searchPlaceholder: "Search name or code",
    status: "Status",
    statuses: { active: "Active", disabled: "Disabled", unknown: "Unknown" },
  },
  "zh-CN": {
    cancel: "取消",
    code: "编码",
    create: "创建策略",
    createDescription: "管理 IAM 策略目录条目。",
    createSuccess: "策略已创建",
    createTitle: "创建策略",
    delete: "删除策略",
    deleteDescription: "确定删除 {name} 吗？该目录条目将被永久移除，且无法撤销。",
    deleteSuccess: "策略已删除",
    edit: "编辑策略",
    editDescription: "更新所选策略目录条目。",
    editSuccess: "策略已更新",
    editTitle: "编辑策略",
    emptyDescription: "创建策略后，条目将显示在目录中。",
    emptyTitle: "暂无策略",
    loadError: "策略加载失败",
    name: "名称",
    noMatchDescription: "请尝试其他名称或编码。",
    noMatchTitle: "未找到匹配策略",
    operationError: "操作失败",
    paginationNext: "下一页",
    paginationPageSize: "每页条数",
    paginationPrevious: "上一页",
    paginationTotal: "共 {total} 条",
    policy: "策略",
    save: "保存更改",
    search: "搜索",
    searchError: "策略搜索失败",
    searchLabel: "搜索策略",
    searchPlaceholder: "搜索名称或编码",
    status: "状态",
    statuses: { active: "正常", disabled: "已禁用", unknown: "未知" },
  },
} as const;

type PolicyAdminCopy = (typeof policyAdminMessages)["en-US"] | (typeof policyAdminMessages)["zh-CN"];

export function SdkworkIamPolicyAdminWorkspace({
  controller,
  locale,
  permissions = readOnlyPermissions,
}: SdkworkIamPolicyAdminWorkspaceProps) {
  const copy = resolveCopy(locale);
  const [items, setItems] = useState(controller.getState().policies);
  const [listPageInfo, setListPageInfo] = useState(controller.getState().listPageInfo);
  const [selectedPolicy, setSelectedPolicy] = useState<SdkworkIamPolicy>();
  const [draft, setDraft] = useState<SdkworkIamPolicyDraft>(emptyPolicyDraft);
  const [drawerMode, setDrawerMode] = useState<"create" | "edit">();
  const [deleteTarget, setDeleteTarget] = useState<SdkworkIamPolicy>();
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
    const next = await controller.listPolicies(params);
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
    setSelectedPolicy(undefined);
    setDraft(emptyPolicyDraft());
    setDrawerMode("create");
  };

  const openEditDrawer = (policy: SdkworkIamPolicy) => {
    setSelectedPolicy(policy);
    setDraft({ code: policy.code ?? "", name: policy.name, status: policy.status ?? "", tenantId: policy.tenantId ?? "" });
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

  const columns = useMemo<DataTableColumn<SdkworkIamPolicy>[]>(() => [
    { id: "name", header: copy.policy, cell: (item) => item.name },
    { id: "code", header: copy.code, cell: (item) => item.code || "—" },
    { id: "status", header: copy.status, cell: (item) => item.status ? <StatusBadge label={statusLabel(copy.statuses, item.status)} showIcon status={item.status} /> : "—" },
  ], [copy]);

  return (
    <div className="flex h-full min-h-0 flex-col gap-6">
      <div className="flex min-h-0 flex-1 flex-col gap-3">
        {error ? <StatusNotice tone="danger">{error}</StatusNotice> : null}
        {notice ? <StatusNotice tone="success">{notice}</StatusNotice> : null}
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
              pageInfo={listPageInfo?.policies}
            />
          )}
          getRowId={(item) => item.policyId}
          loading={loading}
          onRowClick={(item) => { if (permissions.policies.update) openEditDrawer(item); }}
          rowActions={(item) => (
            <div className="flex items-center gap-1">
              {permissions.policies.update ? (
                <Button aria-label={`${copy.edit}: ${item.name}`} onClick={() => openEditDrawer(item)} size="icon" title={copy.edit} type="button" variant="ghost">
                  <Pencil aria-hidden="true" className="h-4 w-4" />
                </Button>
              ) : null}
              {permissions.policies.delete ? (
                <Button aria-label={`${copy.delete}: ${item.name}`} onClick={() => setDeleteTarget(item)} size="icon" title={copy.delete} type="button" variant="ghost">
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
              {permissions.policies.create ? (
                <Button onClick={openCreateDrawer} type="button">
                  <Plus aria-hidden="true" className="h-4 w-4" />
                  {copy.create}
                </Button>
              ) : null}
            </div>
          )}
        />
      </div>

      <PolicyDrawer
        busy={busy}
        copy={copy}
        draft={draft}
        mode={drawerMode}
        onDraftChange={setDraft}
        onOpenChange={(open) => {
          if (!open) setDrawerMode(undefined);
        }}
        onSubmit={() => void runAction(async () => {
          if (drawerMode === "edit" && selectedPolicy) {
            await controller.updatePolicy(selectedPolicy.policyId, draft);
          } else {
            await controller.createPolicy(draft);
          }
          await refreshItems();
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
            await controller.deletePolicy(deleteTarget.policyId);
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

function PolicyDrawer({
  busy,
  copy,
  draft,
  mode,
  onDraftChange,
  onOpenChange,
  onSubmit,
}: {
  busy: boolean;
  copy: PolicyAdminCopy;
  draft: SdkworkIamPolicyDraft;
  mode?: "create" | "edit";
  onDraftChange: (draft: SdkworkIamPolicyDraft) => void;
  onOpenChange: (open: boolean) => void;
  onSubmit: () => void;
}) {
  const set = (patch: Partial<SdkworkIamPolicyDraft>) => onDraftChange({ ...draft, ...patch });
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

function resolveCopy(locale?: string): PolicyAdminCopy {
  return locale?.toLowerCase().startsWith("zh") ? policyAdminMessages["zh-CN"] : policyAdminMessages["en-US"];
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
