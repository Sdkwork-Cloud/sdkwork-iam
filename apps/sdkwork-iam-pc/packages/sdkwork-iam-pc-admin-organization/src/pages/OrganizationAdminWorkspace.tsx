import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { Briefcase, Building2, GitBranch, Pencil, Plus, Search, ShieldCheck, Trash2, Users } from "lucide-react";
import { CatalogPagination } from "@sdkwork/iam-pc-admin-core";
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
  IconButton,
  Input,
  SegmentedControl,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  StatusBadge,
  StatusNotice,
} from "@sdkwork/ui-pc-react";

import { useSdkworkIamOrganizationAdminMessages } from "../i18n";
import type {
  SdkworkIamDepartment,
  SdkworkIamDepartmentDraft,
  SdkworkIamOrganization,
  SdkworkIamOrganizationAdminWorkspaceProps,
  SdkworkIamOrganizationDraft,
  SdkworkIamOrganizationMembership,
  SdkworkIamOrganizationMembershipDraft,
  SdkworkIamOrganizationState,
  SdkworkIamPosition,
  SdkworkIamRoleBinding,
} from "../types/organization-admin-types";

type PageInfoState = Pick<SdkworkIamOrganizationState,
  "departmentListPageInfo" | "membershipListPageInfo" | "organizationListPageInfo" | "positionListPageInfo" | "roleBindingListPageInfo">;
type DrawerMode = "create" | "edit";
type OrganizationDetailTab = "departments" | "memberships" | "positions" | "roleBindings";
type ListKind = "organizations" | "departments" | "memberships" | "positions" | "roleBindings";

const emptyOrganizationDraft = (): SdkworkIamOrganizationDraft => ({ name: "" });
const emptyDepartmentDraft = (organizationId: string): SdkworkIamDepartmentDraft => ({ name: "", organizationId });
const emptyMembershipDraft = (): SdkworkIamOrganizationMembershipDraft => ({ userId: "" });

export function SdkworkIamOrganizationAdminWorkspace({
  controller,
  onOpenStructure,
  permissions = {
    departments: { create: true, delete: true, read: true, update: true },
    memberships: { create: true, read: true, update: true },
    organizations: { create: true, delete: true, update: true },
    positions: { read: true },
    roleBindings: { read: true },
  },
}: SdkworkIamOrganizationAdminWorkspaceProps) {
  const messages = useSdkworkIamOrganizationAdminMessages();
  const state = controller.getState();
  const [organizations, setOrganizations] = useState(state.organizations);
  const [departments, setDepartments] = useState(state.departments);
  const [memberships, setMemberships] = useState(state.memberships);
  const [positions, setPositions] = useState(state.positions);
  const [roleBindings, setRoleBindings] = useState(state.roleBindings);
  const [pageInfo, setPageInfo] = useState<PageInfoState>({
    departmentListPageInfo: state.departmentListPageInfo,
    membershipListPageInfo: state.membershipListPageInfo,
    organizationListPageInfo: state.organizationListPageInfo,
    positionListPageInfo: state.positionListPageInfo,
    roleBindingListPageInfo: state.roleBindingListPageInfo,
  });
  const [selectedOrganization, setSelectedOrganization] = useState<SdkworkIamOrganization>();
  const [organizationEditTarget, setOrganizationEditTarget] = useState<SdkworkIamOrganization>();
  const [selectedDepartment, setSelectedDepartment] = useState<SdkworkIamDepartment>();
  const [selectedMembership, setSelectedMembership] = useState<SdkworkIamOrganizationMembership>();
  const [organizationDraft, setOrganizationDraft] = useState<SdkworkIamOrganizationDraft>(emptyOrganizationDraft);
  const [departmentDraft, setDepartmentDraft] = useState<SdkworkIamDepartmentDraft>(() => emptyDepartmentDraft(""));
  const [membershipDraft, setMembershipDraft] = useState<SdkworkIamOrganizationMembershipDraft>(emptyMembershipDraft);
  const [organizationDrawerMode, setOrganizationDrawerMode] = useState<DrawerMode>();
  const [departmentDrawerMode, setDepartmentDrawerMode] = useState<DrawerMode>();
  const [membershipDrawerMode, setMembershipDrawerMode] = useState<DrawerMode>();
  const [deleteOrganizationTarget, setDeleteOrganizationTarget] = useState<SdkworkIamOrganization>();
  const [deleteDepartmentTarget, setDeleteDepartmentTarget] = useState<SdkworkIamDepartment>();
  const [activeTab, setActiveTab] = useState<OrganizationDetailTab>();
  const [searchQuery, setSearchQuery] = useState("");
  const [appliedSearchQuery, setAppliedSearchQuery] = useState("");
  const [pages, setPages] = useState<Record<ListKind, number>>({
    departments: 1, memberships: 1, organizations: 1, positions: 1, roleBindings: 1,
  });
  const [pageSizes, setPageSizes] = useState<Record<ListKind, number>>({
    departments: 20, memberships: 20, organizations: 20, positions: 20, roleBindings: 20,
  });
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [notice, setNotice] = useState<string>();

  const detailTabs = useMemo(() => [
    ...(permissions.departments.read
      ? [{ icon: <GitBranch className="h-4 w-4" />, label: messages.tabs.departments, value: "departments" as const }]
      : []),
    ...(permissions.memberships.read
      ? [{ icon: <Users className="h-4 w-4" />, label: messages.tabs.memberships, value: "memberships" as const }]
      : []),
    ...(permissions.positions.read
      ? [{ icon: <Briefcase className="h-4 w-4" />, label: messages.tabs.positions, value: "positions" as const }]
      : []),
    ...(permissions.roleBindings.read
      ? [{ icon: <ShieldCheck className="h-4 w-4" />, label: messages.tabs.roleBindings, value: "roleBindings" as const }]
      : []),
  ], [messages, permissions]);

  const syncPageInfo = () => {
    const next = controller.getState();
    setPageInfo({
      departmentListPageInfo: next.departmentListPageInfo,
      membershipListPageInfo: next.membershipListPageInfo,
      organizationListPageInfo: next.organizationListPageInfo,
      positionListPageInfo: next.positionListPageInfo,
      roleBindingListPageInfo: next.roleBindingListPageInfo,
    });
  };

  const refreshOrganizations = async (query = appliedSearchQuery, nextPage = pages.organizations, nextPageSize = pageSizes.organizations) => {
    const params: Record<string, unknown> = { page: nextPage, page_size: nextPageSize };
    if (query) params.q = query;
    const items = await controller.listOrganizations(params);
    setOrganizations(items);
    syncPageInfo();
    return items;
  };

  const refreshDepartments = async (organizationId: string, nextPage = pages.departments, nextPageSize = pageSizes.departments) => {
    const items = await controller.listDepartments(organizationId, { page: nextPage, page_size: nextPageSize });
    setDepartments(items);
    syncPageInfo();
    return items;
  };

  const refreshMemberships = async (organizationId: string, nextPage = pages.memberships, nextPageSize = pageSizes.memberships) => {
    const items = await controller.listMemberships(organizationId, { page: nextPage, page_size: nextPageSize });
    setMemberships(items);
    syncPageInfo();
    return items;
  };

  const loadDetailTab = async (tab: OrganizationDetailTab, organizationId: string, nextPage = pages[tab], nextPageSize = pageSizes[tab]) => {
    if (tab === "departments") {
      await refreshDepartments(organizationId, nextPage, nextPageSize);
    } else if (tab === "memberships") {
      await refreshMemberships(organizationId, nextPage, nextPageSize);
    } else if (tab === "positions") {
      setPositions(await controller.listPositions({ organizationId, page: nextPage, page_size: nextPageSize }));
      syncPageInfo();
    } else {
      setRoleBindings(await controller.listRoleBindings({ organizationId, page: nextPage, page_size: nextPageSize }));
      syncPageInfo();
    }
  };

  useEffect(() => {
    setLoading(true);
    void refreshOrganizations("")
      .catch((loadError) => setError(toErrorMessage(loadError, messages.notices.loadOrganizationsError)))
      .finally(() => setLoading(false));
  }, [controller]);

  const runAction = async (action: () => Promise<void>, successMessage: string, fallbackError = messages.common.operationError) => {
    setBusy(true);
    setError(undefined);
    setNotice(undefined);
    try {
      await action();
      setNotice(successMessage);
    } catch (actionError) {
      setError(toErrorMessage(actionError, fallbackError));
    } finally {
      setBusy(false);
    }
  };

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = searchQuery.trim();
    setAppliedSearchQuery(query);
    setPages((current) => ({ ...current, organizations: 1 }));
    setLoading(true);
    setError(undefined);
    void refreshOrganizations(query, 1, pageSizes.organizations)
      .catch((loadError) => setError(toErrorMessage(loadError, messages.notices.loadOrganizationsError)))
      .finally(() => setLoading(false));
  };

  const changePage = (kind: ListKind, nextPage: number) => {
    setPages((current) => ({ ...current, [kind]: nextPage }));
    if (kind === "organizations") {
      setLoading(true);
      setError(undefined);
      void refreshOrganizations(appliedSearchQuery, nextPage)
        .catch((loadError) => setError(toErrorMessage(loadError, messages.notices.loadOrganizationsError)))
        .finally(() => setLoading(false));
      return;
    }
    if (!selectedOrganization) return;
    setDetailLoading(true);
    setError(undefined);
    void loadDetailTab(kind as OrganizationDetailTab, selectedOrganization.organizationId, nextPage)
      .catch((loadError) => setError(toErrorMessage(loadError, detailLoadError(kind as OrganizationDetailTab, messages.notices))))
      .finally(() => setDetailLoading(false));
  };

  const changePageSize = (kind: ListKind, nextPageSize: number) => {
    setPageSizes((current) => ({ ...current, [kind]: nextPageSize }));
    setPages((current) => ({ ...current, [kind]: 1 }));
    if (kind === "organizations") {
      setLoading(true);
      setError(undefined);
      void refreshOrganizations(appliedSearchQuery, 1, nextPageSize)
        .catch((loadError) => setError(toErrorMessage(loadError, messages.notices.loadOrganizationsError)))
        .finally(() => setLoading(false));
      return;
    }
    if (!selectedOrganization) return;
    setDetailLoading(true);
    setError(undefined);
    void loadDetailTab(kind as OrganizationDetailTab, selectedOrganization.organizationId, 1, nextPageSize)
      .catch((loadError) => setError(toErrorMessage(loadError, detailLoadError(kind as OrganizationDetailTab, messages.notices))))
      .finally(() => setDetailLoading(false));
  };

  const paginationCopy = {
    next: messages.pagination.next,
    pageSize: messages.pagination.pageSize,
    previous: messages.pagination.previous,
    total: messages.pagination.total,
  };

  const selectOrganization = async (organization: SdkworkIamOrganization) => {
    setError(undefined);
    setDetailLoading(true);
    try {
      const resolved = await controller.selectOrganization(organization.organizationId) ?? organization;
      setSelectedOrganization(resolved);
      const nextTab = detailTabs[0]?.value;
      setActiveTab(nextTab);
      if (nextTab) await loadDetailTab(nextTab, resolved.organizationId);
    } catch (loadError) {
      setError(toErrorMessage(loadError, messages.notices.loadOrganizationError));
    } finally {
      setDetailLoading(false);
    }
  };

  const switchDetailTab = (value: string) => {
    if (!selectedOrganization || !detailTabs.some((tab) => tab.value === value)) return;
    const nextTab = value as OrganizationDetailTab;
    setActiveTab(nextTab);
    setPages((current) => ({ ...current, [nextTab]: 1 }));
    setDetailLoading(true);
    setError(undefined);
    void loadDetailTab(nextTab, selectedOrganization.organizationId, 1, pageSizes[nextTab])
      .catch((loadError) => setError(toErrorMessage(loadError, detailLoadError(nextTab, messages.notices))))
      .finally(() => setDetailLoading(false));
  };

  const openOrganizationEditor = (organization: SdkworkIamOrganization) => {
    setOrganizationEditTarget(organization);
    setOrganizationDraft({
      code: organization.code ?? "",
      name: organization.name,
      parentId: organization.parentId ?? "",
      status: organization.status ?? "",
      tenantId: organization.tenantId ?? "",
    });
    setOrganizationDrawerMode("edit");
  };

  const openDepartmentEditor = (department: SdkworkIamDepartment) => {
    setSelectedDepartment(department);
    setDepartmentDraft({
      code: department.code ?? "",
      name: department.name,
      organizationId: department.organizationId,
      parentDepartmentId: department.parentDepartmentId ?? "",
      status: department.status ?? "",
    });
    setDepartmentDrawerMode("edit");
  };

  const openMembershipEditor = (membership: SdkworkIamOrganizationMembership) => {
    setSelectedMembership(membership);
    setMembershipDraft({
      membershipKind: membership.membershipKind ?? "",
      roleCode: membership.roleCode ?? "",
      status: membership.status ?? "",
      userId: membership.userId,
    });
    setMembershipDrawerMode("edit");
  };

  const organizationColumns = useMemo<DataTableColumn<SdkworkIamOrganization>[]>(() => [
    { id: "name", header: messages.organizations.table.organization, cell: (item) => item.name },
    { id: "code", header: messages.organizations.table.code, cell: (item) => item.code || "-" },
    { id: "parent", header: messages.organizations.table.parent, cell: (item) => item.parentId || "-" },
    { id: "status", header: messages.organizations.table.status, cell: (item) => item.status ? <StatusBadge label={statusLabel(messages.organizations.statuses, item.status)} showIcon status={item.status} /> : "-" },
  ], [messages]);

  const departmentColumns = useMemo<DataTableColumn<SdkworkIamDepartment>[]>(() => [
    { id: "name", header: messages.departments.table.department, cell: (item) => item.name },
    { id: "code", header: messages.departments.table.code, cell: (item) => item.code || "-" },
    { id: "parent", header: messages.departments.table.parent, cell: (item) => item.parentDepartmentId || "-" },
    { id: "status", header: messages.departments.table.status, cell: (item) => item.status ? <StatusBadge label={statusLabel(messages.departments.statuses, item.status)} showIcon status={item.status} /> : "-" },
  ], [messages]);

  const membershipColumns = useMemo<DataTableColumn<SdkworkIamOrganizationMembership>[]>(() => [
    { id: "member", header: messages.memberships.table.member, cell: (item) => item.displayName || item.username || item.email || item.userId },
    { id: "role", header: messages.memberships.table.role, cell: (item) => item.roleCode || "-" },
    { id: "kind", header: messages.memberships.table.kind, cell: (item) => item.membershipKind ? kindLabel(messages.memberships.membershipKinds, item.membershipKind) : "-" },
    { id: "status", header: messages.memberships.table.status, cell: (item) => item.status ? <StatusBadge label={statusLabel(messages.memberships.statuses, item.status)} showIcon status={item.status} /> : "-" },
  ], [messages]);

  const positionColumns = useMemo<DataTableColumn<SdkworkIamPosition>[]>(() => [
    { id: "name", header: messages.positions.table.position, cell: (item) => item.name },
    { id: "department", header: messages.positions.table.department, cell: (item) => item.departmentId || "-" },
    { id: "status", header: messages.positions.table.status, cell: (item) => item.status ? <StatusBadge label={statusLabel(messages.positions.statuses, item.status)} showIcon status={item.status} /> : "-" },
  ], [messages]);

  const bindingColumns = useMemo<DataTableColumn<SdkworkIamRoleBinding>[]>(() => [
    { id: "principal", header: messages.roleBindings.table.principal, cell: (item) => `${kindLabel(messages.roleBindings.principalKinds, item.principalKind) ?? messages.roleBindings.principalFallback}:${item.principalId || item.id}` },
    { id: "role", header: messages.roleBindings.table.role, cell: (item) => item.roleId || "-" },
    { id: "scope", header: messages.roleBindings.table.scope, cell: (item) => `${kindLabel(messages.roleBindings.scopeKinds, item.scopeKind) ?? messages.roleBindings.scopeFallback}:${item.scopeId || "-"}` },
    { id: "status", header: messages.roleBindings.table.status, cell: (item) => item.status ? <StatusBadge label={statusLabel(messages.roleBindings.statuses, item.status)} showIcon status={item.status} /> : "-" },
  ], [messages]);

  return (
    <div className="flex h-full min-h-0 flex-col gap-6">
      <div className="flex min-h-0 flex-1 flex-col gap-3">
        {error ? <StatusNotice tone="danger">{error}</StatusNotice> : null}
        {notice ? <StatusNotice tone="success">{notice}</StatusNotice> : null}

        <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
          <form className="flex min-w-0 items-center gap-2" onSubmit={submitSearch} role="search">
            <label className="relative w-64 shrink-0">
              <span className="sr-only">{messages.organizations.searchLabel}</span>
              <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--sdk-color-text-muted)]" />
              <Input aria-label={messages.organizations.searchLabel} className="pl-9" onChange={(event) => setSearchQuery(event.target.value)} placeholder={messages.organizations.searchPlaceholder} value={searchQuery} />
            </label>
            <Button disabled={loading} type="submit" variant="outline"><Search className="h-4 w-4" />{messages.organizations.searchAction}</Button>
          </form>
          {permissions.organizations.create ? (
            <Button onClick={() => { setOrganizationDraft(emptyOrganizationDraft()); setOrganizationDrawerMode("create"); }} type="button">
              <Plus className="h-4 w-4" />{messages.organizations.create}
            </Button>
          ) : null}
        </div>

        <DataTable
          className={selectedOrganization ? "max-h-[40vh]" : "min-h-0 flex-1"}
          columns={organizationColumns}
          emptyDescription={messages.organizations.emptyDescription}
          emptyTitle={messages.organizations.emptyTitle}
          footer={<CatalogPagination busy={busy} copy={paginationCopy} onPageChange={(page) => changePage("organizations", page)} onPageSizeChange={(pageSize) => changePageSize("organizations", pageSize)} pageInfo={pageInfo.organizationListPageInfo} />}
          getRowId={(item) => item.organizationId}
          loading={loading}
          onRowClick={(item) => (onOpenStructure ? onOpenStructure(item) : void selectOrganization(item))}
          rowActions={(item) => (
            <div className="flex items-center gap-2" onClick={(event) => event.stopPropagation()}>
              {onOpenStructure ? (
                <Button onClick={() => onOpenStructure(item)} size="sm" type="button" variant="outline">
                  <GitBranch className="h-3.5 w-3.5" />
                  {messages.organizations.structure}
                </Button>
              ) : (
                <Button onClick={() => void selectOrganization(item)} size="sm" type="button" variant="outline">{messages.organizations.manage}</Button>
              )}
              {permissions.organizations.update ? (
                <IconButton aria-label={messages.organizations.edit} onClick={() => openOrganizationEditor(item)} title={messages.organizations.edit} variant="ghost">
                  <Pencil className="h-3.5 w-3.5" />
                </IconButton>
              ) : null}
              {permissions.organizations.delete ? (
                <IconButton aria-label={messages.organizations.delete} onClick={() => setDeleteOrganizationTarget(item)} title={messages.organizations.delete} variant="ghost">
                  <Trash2 className="h-3.5 w-3.5 text-[var(--sdk-color-state-danger)]" />
                </IconButton>
              ) : null}
            </div>
          )}
          rows={[...organizations]}
          slotProps={{
            surface: { className: "flex min-h-0 flex-1 flex-col" },
            viewport: { className: "min-h-0 flex-1" },
            footer: { className: "shrink-0" },
          }}
          stickyHeader
        />

        {!onOpenStructure && selectedOrganization ? (
          <section className="flex min-h-0 flex-1 flex-col border-t border-[var(--sdk-color-border-subtle)] pt-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--sdk-radius-control)] bg-[var(--sdk-color-surface-panel-muted)] text-[var(--sdk-color-text-secondary)]">
                  <Building2 className="h-5 w-5" />
                </span>
                <span className="min-w-0">
                  <h2 className="truncate text-base font-semibold text-[var(--sdk-color-text-primary)]">{template(messages.organizations.selectedTitleTemplate, { name: selectedOrganization.name })}</h2>
                  <p className="truncate text-sm text-[var(--sdk-color-text-muted)]">{template(messages.organizations.selectedDescriptionTemplate, { id: selectedOrganization.organizationId })}</p>
                </span>
              </div>
              {detailTabs.length > 0 && activeTab ? (
                <div className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto">
                  <SegmentedControl aria-label={messages.organizations.manage} className="w-full lg:w-auto" fullWidth={false} onValueChange={switchDetailTab} options={detailTabs} value={activeTab} />
                </div>
              ) : null}
            </div>

            <div className="mt-5 flex min-h-0 flex-1 flex-col">
              {activeTab === "departments" ? (
                <DataTable
                  className="min-h-0 flex-1"
                  columns={departmentColumns}
                  emptyDescription={messages.departments.emptyDescription}
                  emptyTitle={messages.departments.emptyTitle}
                  footer={<CatalogPagination busy={busy} copy={paginationCopy} onPageChange={(page) => changePage("departments", page)} onPageSizeChange={(pageSize) => changePageSize("departments", pageSize)} pageInfo={pageInfo.departmentListPageInfo} />}
                  getRowId={(item) => item.departmentId}
                  loading={detailLoading}
                  onRowClick={permissions.departments.update ? openDepartmentEditor : undefined}
                  rowActions={permissions.departments.update || permissions.departments.delete ? (item) => (
                    <div className="flex items-center gap-2" onClick={(event) => event.stopPropagation()}>
                      {permissions.departments.update ? <IconButton aria-label={messages.common.edit} onClick={() => openDepartmentEditor(item)} title={messages.common.edit} variant="ghost"><Pencil className="h-3.5 w-3.5" /></IconButton> : null}
                      {permissions.departments.delete ? <IconButton aria-label={messages.departments.delete} onClick={() => setDeleteDepartmentTarget(item)} title={messages.departments.delete} variant="ghost"><Trash2 className="h-3.5 w-3.5 text-[var(--sdk-color-state-danger)]" /></IconButton> : null}
                    </div>
                  ) : undefined}
                  rows={[...departments]}
                  slotProps={{
                    surface: { className: "flex min-h-0 flex-1 flex-col" },
                    viewport: { className: "min-h-0 flex-1" },
                    footer: { className: "shrink-0" },
                  }}
                  stickyHeader
                  title={template(messages.departments.titleTemplate, { name: selectedOrganization.name })}
                  toolbar={permissions.departments.create ? <Button onClick={() => { setSelectedDepartment(undefined); setDepartmentDraft(emptyDepartmentDraft(selectedOrganization.organizationId)); setDepartmentDrawerMode("create"); }} type="button"><Plus className="h-4 w-4" />{messages.departments.create}</Button> : undefined}
                />
              ) : null}

              {activeTab === "memberships" ? (
                <DataTable
                  className="min-h-0 flex-1"
                  columns={membershipColumns}
                  emptyDescription={messages.memberships.emptyDescription}
                  emptyTitle={messages.memberships.emptyTitle}
                  footer={<CatalogPagination busy={busy} copy={paginationCopy} onPageChange={(page) => changePage("memberships", page)} onPageSizeChange={(pageSize) => changePageSize("memberships", pageSize)} pageInfo={pageInfo.membershipListPageInfo} />}
                  getRowId={(item) => item.id}
                  loading={detailLoading}
                  onRowClick={permissions.memberships.update ? openMembershipEditor : undefined}
                  rowActions={permissions.memberships.update ? (item) => <IconButton aria-label={messages.common.edit} onClick={() => openMembershipEditor(item)} title={messages.common.edit} variant="ghost"><Pencil className="h-3.5 w-3.5" /></IconButton> : undefined}
                  rows={[...memberships]}
                  slotProps={{
                    surface: { className: "flex min-h-0 flex-1 flex-col" },
                    viewport: { className: "min-h-0 flex-1" },
                    footer: { className: "shrink-0" },
                  }}
                  stickyHeader
                  title={template(messages.memberships.titleTemplate, { name: selectedOrganization.name })}
                  toolbar={permissions.memberships.create ? <Button onClick={() => { setSelectedMembership(undefined); setMembershipDraft(emptyMembershipDraft()); setMembershipDrawerMode("create"); }} type="button"><Plus className="h-4 w-4" />{messages.memberships.add}</Button> : undefined}
                />
              ) : null}

              {activeTab === "positions" ? (
                <DataTable className="min-h-0 flex-1" columns={positionColumns} emptyDescription={messages.positions.emptyDescription} emptyTitle={messages.positions.emptyTitle} footer={<CatalogPagination busy={busy} copy={paginationCopy} onPageChange={(page) => changePage("positions", page)} onPageSizeChange={(pageSize) => changePageSize("positions", pageSize)} pageInfo={pageInfo.positionListPageInfo} />} getRowId={(item) => item.positionId} loading={detailLoading} rows={[...positions]} slotProps={{ surface: { className: "flex min-h-0 flex-1 flex-col" }, viewport: { className: "min-h-0 flex-1" }, footer: { className: "shrink-0" } }} stickyHeader title={template(messages.positions.titleTemplate, { name: selectedOrganization.name })} />
              ) : null}

              {activeTab === "roleBindings" ? (
                <DataTable className="min-h-0 flex-1" columns={bindingColumns} emptyDescription={messages.roleBindings.emptyDescription} emptyTitle={messages.roleBindings.emptyTitle} footer={<CatalogPagination busy={busy} copy={paginationCopy} onPageChange={(page) => changePage("roleBindings", page)} onPageSizeChange={(pageSize) => changePageSize("roleBindings", pageSize)} pageInfo={pageInfo.roleBindingListPageInfo} />} getRowId={(item) => item.id} loading={detailLoading} rows={[...roleBindings]} slotProps={{ surface: { className: "flex min-h-0 flex-1 flex-col" }, viewport: { className: "min-h-0 flex-1" }, footer: { className: "shrink-0" } }} stickyHeader title={template(messages.roleBindings.titleTemplate, { name: selectedOrganization.name })} />
              ) : null}
            </div>
          </section>
        ) : null}
      </div>

      <ResourceDrawer busy={busy} description={organizationDrawerMode === "edit" ? messages.drawers.organization.editDescription : messages.drawers.organization.createDescription} mode={organizationDrawerMode} onOpenChange={(open) => { if (!open) { setOrganizationDrawerMode(undefined); setOrganizationEditTarget(undefined); } }} onSubmit={() => void runAction(async () => {
        if (organizationDrawerMode === "edit" && organizationEditTarget) {
          const updated = await controller.updateOrganization(organizationEditTarget.organizationId, organizationDraft);
          if (selectedOrganization?.organizationId === updated.organizationId) setSelectedOrganization(updated);
        } else {
          const created = await controller.createOrganization(organizationDraft);
          if (onOpenStructure) {
            onOpenStructure(created);
          } else {
            setSelectedOrganization(created);
            const nextTab = detailTabs[0]?.value;
            setActiveTab(nextTab);
            if (nextTab) await loadDetailTab(nextTab, created.organizationId);
          }
        }
        await refreshOrganizations();
        setOrganizationDrawerMode(undefined);
        setOrganizationEditTarget(undefined);
      }, organizationDrawerMode === "edit" ? messages.notices.organizationUpdated : messages.notices.organizationCreated)} submitDisabled={!organizationDraft.name.trim()} submitLabel={organizationDrawerMode === "edit" ? messages.common.save : messages.common.create} title={organizationDrawerMode === "edit" ? messages.drawers.organization.editTitle : messages.drawers.organization.createTitle}>
        <Field label={messages.drawers.organization.name} onChange={(name) => setOrganizationDraft({ ...organizationDraft, name })} value={organizationDraft.name} />
        <Field label={messages.drawers.organization.code} onChange={(code) => setOrganizationDraft({ ...organizationDraft, code })} value={organizationDraft.code ?? ""} />
        <Field label={messages.drawers.organization.parentId} onChange={(parentId) => setOrganizationDraft({ ...organizationDraft, parentId })} value={organizationDraft.parentId ?? ""} />
        {organizationDrawerMode === "edit" ? <StatusSelectField label={messages.drawers.organization.status} onChange={(status) => setOrganizationDraft({ ...organizationDraft, status })} statuses={messages.organizations.statuses} value={organizationDraft.status ?? ""} /> : null}
      </ResourceDrawer>

      <ResourceDrawer busy={busy} description={departmentDrawerMode === "edit" ? messages.drawers.department.editDescription : messages.drawers.department.createDescription} mode={departmentDrawerMode} onOpenChange={(open) => { if (!open) setDepartmentDrawerMode(undefined); }} onSubmit={() => {
        if (!selectedOrganization) return;
        void runAction(async () => {
          if (departmentDrawerMode === "edit" && selectedDepartment) await controller.updateDepartment(selectedDepartment.departmentId, departmentDraft);
          else await controller.createDepartment({ ...departmentDraft, organizationId: selectedOrganization.organizationId });
          await refreshDepartments(selectedOrganization.organizationId);
          setDepartmentDrawerMode(undefined);
        }, departmentDrawerMode === "edit" ? messages.notices.departmentUpdated : messages.notices.departmentCreated);
      }} submitDisabled={!departmentDraft.name.trim()} submitLabel={departmentDrawerMode === "edit" ? messages.common.save : messages.common.create} title={departmentDrawerMode === "edit" ? messages.drawers.department.editTitle : messages.drawers.department.createTitle}>
        <Field label={messages.drawers.department.name} onChange={(name) => setDepartmentDraft({ ...departmentDraft, name })} value={departmentDraft.name} />
        <Field label={messages.drawers.department.code} onChange={(code) => setDepartmentDraft({ ...departmentDraft, code })} value={departmentDraft.code ?? ""} />
        <Field label={messages.drawers.department.parentId} onChange={(parentDepartmentId) => setDepartmentDraft({ ...departmentDraft, parentDepartmentId })} value={departmentDraft.parentDepartmentId ?? ""} />
        {departmentDrawerMode === "edit" ? <StatusSelectField label={messages.drawers.department.status} onChange={(status) => setDepartmentDraft({ ...departmentDraft, status })} statuses={messages.departments.statuses} value={departmentDraft.status ?? ""} /> : null}
      </ResourceDrawer>

      <ResourceDrawer busy={busy} description={membershipDrawerMode === "edit" ? messages.drawers.membership.editDescription : messages.drawers.membership.createDescription} mode={membershipDrawerMode} onOpenChange={(open) => { if (!open) setMembershipDrawerMode(undefined); }} onSubmit={() => {
        if (!selectedOrganization) return;
        void runAction(async () => {
          if (membershipDrawerMode === "edit" && selectedMembership?.membershipId) await controller.updateMembership(selectedMembership.membershipId, membershipDraft);
          else await controller.addMembership(selectedOrganization.organizationId, membershipDraft);
          await refreshMemberships(selectedOrganization.organizationId);
          setMembershipDrawerMode(undefined);
        }, membershipDrawerMode === "edit" ? messages.notices.membershipUpdated : messages.notices.membershipCreated);
      }} submitDisabled={!membershipDraft.userId.trim()} submitLabel={membershipDrawerMode === "edit" ? messages.common.save : messages.common.create} title={membershipDrawerMode === "edit" ? messages.drawers.membership.editTitle : messages.drawers.membership.createTitle}>
        <Field disabled={membershipDrawerMode === "edit"} label={messages.drawers.membership.userId} onChange={(userId) => setMembershipDraft({ ...membershipDraft, userId })} value={membershipDraft.userId} />
        <Field label={messages.drawers.membership.roleCode} onChange={(roleCode) => setMembershipDraft({ ...membershipDraft, roleCode })} value={membershipDraft.roleCode ?? ""} />
        <KindSelectField label={messages.drawers.membership.kind} kinds={messages.memberships.membershipKinds} onChange={(membershipKind) => setMembershipDraft({ ...membershipDraft, membershipKind })} value={membershipDraft.membershipKind ?? ""} />
        {membershipDrawerMode === "edit" ? <StatusSelectField label={messages.drawers.membership.status} onChange={(status) => setMembershipDraft({ ...membershipDraft, status })} statuses={messages.memberships.statuses} value={membershipDraft.status ?? ""} /> : null}
      </ResourceDrawer>

      <ConfirmDialog closeOnConfirm={false} confirmLabel={messages.organizations.delete} confirmLoading={busy} description={deleteOrganizationTarget ? template(messages.organizations.deleteDescriptionTemplate, { name: deleteOrganizationTarget.name }) : undefined} onConfirm={() => {
        if (!deleteOrganizationTarget) return;
        void runAction(async () => {
          await controller.deleteOrganization(deleteOrganizationTarget.organizationId);
          if (selectedOrganization?.organizationId === deleteOrganizationTarget.organizationId) {
            setSelectedOrganization(undefined); setActiveTab(undefined); setDepartments([]); setMemberships([]); setPositions([]); setRoleBindings([]);
          }
          await refreshOrganizations();
          setDeleteOrganizationTarget(undefined);
        }, messages.notices.organizationDeleted);
      }} onOpenChange={(open) => { if (!open && !busy) setDeleteOrganizationTarget(undefined); }} open={Boolean(deleteOrganizationTarget)} title={messages.organizations.deleteTitle} tone="danger" />

      <ConfirmDialog closeOnConfirm={false} confirmLabel={messages.departments.delete} confirmLoading={busy} description={deleteDepartmentTarget ? template(messages.departments.deleteDescriptionTemplate, { name: deleteDepartmentTarget.name }) : undefined} onConfirm={() => {
        if (!selectedOrganization || !deleteDepartmentTarget) return;
        void runAction(async () => {
          await controller.deleteDepartment(deleteDepartmentTarget.departmentId);
          await refreshDepartments(selectedOrganization.organizationId);
          setDeleteDepartmentTarget(undefined);
        }, messages.notices.departmentDeleted);
      }} onOpenChange={(open) => { if (!open && !busy) setDeleteDepartmentTarget(undefined); }} open={Boolean(deleteDepartmentTarget)} title={messages.departments.deleteTitle} tone="danger" />
    </div>
  );
}

function ResourceDrawer({ busy, children, description, mode, onOpenChange, onSubmit, submitDisabled, submitLabel, title }: {
  busy: boolean;
  children: ReactNode;
  description: string;
  mode?: DrawerMode;
  onOpenChange: (open: boolean) => void;
  onSubmit: () => void;
  submitDisabled: boolean;
  submitLabel: string;
  title: string;
}) {
  const messages = useSdkworkIamOrganizationAdminMessages();
  return (
    <Drawer onOpenChange={onOpenChange} open={Boolean(mode)}>
      <DrawerContent size="md">
        <DrawerHeader><DrawerTitle>{title}</DrawerTitle><DrawerDescription>{description}</DrawerDescription></DrawerHeader>
        <DrawerBody className="space-y-4">{children}</DrawerBody>
        <DrawerFooter>
          <Button disabled={busy} onClick={() => onOpenChange(false)} type="button" variant="secondary">{messages.common.cancel}</Button>
          <Button disabled={busy || submitDisabled} loading={busy} onClick={onSubmit} type="button">{submitLabel}</Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

function Field({ disabled, label, onChange, value }: { disabled?: boolean; label: string; onChange: (value: string) => void; value: string }) {
  return (
    <label className="block space-y-1.5 text-sm">
      <span className="font-medium text-[var(--sdk-color-text-primary)]">{label}</span>
      <Input disabled={disabled} onChange={(event) => onChange(event.target.value)} value={value} />
    </label>
  );
}

function StatusSelectField({ label, onChange, statuses, value }: { label: string; onChange: (value: string) => void; statuses: { active: string; disabled: string; unknown: string }; value: string }) {
  const normalized = value.trim().toLowerCase();
  const options = [
    ["active", statuses.active],
    ["disabled", statuses.disabled],
  ] as const;
  const currentUnknown = options.some(([optionValue]) => optionValue === normalized) ? undefined : value;
  return (
    <label className="block space-y-1.5 text-sm">
      <span className="font-medium text-[var(--sdk-color-text-primary)]">{label}</span>
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

function KindSelectField({ label, kinds, onChange, value }: { label: string; kinds: { employee: string; member: string; owner: string; unknown: string }; onChange: (value: string) => void; value: string }) {
  const normalized = value.trim().toLowerCase();
  const options = [
    ["employee", kinds.employee],
    ["member", kinds.member],
    ["owner", kinds.owner],
  ] as const;
  const currentUnknown = options.some(([optionValue]) => optionValue === normalized) ? undefined : value;
  return (
    <label className="block space-y-1.5 text-sm">
      <span className="font-medium text-[var(--sdk-color-text-primary)]">{label}</span>
      <Select onValueChange={onChange} value={value}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          {options.map(([optionValue, optionLabel]) => <SelectItem key={optionValue} value={optionValue}>{optionLabel}</SelectItem>)}
          {currentUnknown ? <SelectItem key={currentUnknown} value={currentUnknown}>{kindLabel(kinds, currentUnknown)}</SelectItem> : null}
        </SelectContent>
      </Select>
    </label>
  );
}

function statusLabel(statuses: { active: string; disabled: string; unknown: string }, value: string) {
  const normalized = value.trim().toLowerCase();
  return statuses[normalized as keyof typeof statuses] ?? statuses.unknown;
}

function kindLabel(labels: Record<string, string>, value: string | undefined): string | undefined {
  if (!value) return undefined;
  const normalized = value.trim().toLowerCase();
  return labels[normalized] ?? value;
}

function detailLoadError(tab: OrganizationDetailTab, notices: ReturnType<typeof useSdkworkIamOrganizationAdminMessages>["notices"]) {
  if (tab === "departments") return notices.loadDepartmentsError;
  if (tab === "memberships") return notices.loadMembershipsError;
  if (tab === "positions") return notices.loadPositionsError;
  return notices.loadRoleBindingsError;
}

function template(value: string, replacements: Record<string, string>) {
  return Object.entries(replacements).reduce((result, [key, replacement]) => result.replace(`{${key}}`, replacement), value);
}

function toErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}
