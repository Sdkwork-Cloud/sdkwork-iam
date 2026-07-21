import { useEffect, useMemo, useState, type FormEvent } from "react";
import { ArrowLeft, GitBranch, Pencil, Plus, Search, Star, Trash2, UserPlus } from "lucide-react";
import { SdkworkIamListPaginationControls } from "@sdkwork/iam-pc-admin-core";
import {
  Button,
  Checkbox,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SettingsSection,
  StatusBadge,
  StatusNotice,
  Tree,
  type TreeNodeData,
} from "@sdkwork/ui-pc-react";

import { useSdkworkIamOrganizationAdminMessages } from "../i18n";
import type {
  SdkworkIamDepartment,
  SdkworkIamDepartmentAssignment,
  SdkworkIamDepartmentDraft,
  SdkworkIamDepartmentNode,
  SdkworkIamOrganization,
  SdkworkIamOrganizationMembership,
  SdkworkIamOrganizationStructureWorkspaceProps,
} from "../types/organization-admin-types";

type DepartmentDrawerMode = "create" | "edit";

export function SdkworkIamOrganizationStructureWorkspace({
  controller,
  onBack,
  organizationId,
  permissions = {
    assignments: { create: true, read: true, update: true },
    departments: { create: true, delete: true, update: true },
    memberships: { read: true },
  },
}: SdkworkIamOrganizationStructureWorkspaceProps) {
  const messages = useSdkworkIamOrganizationAdminMessages();
  const [organization, setOrganization] = useState<SdkworkIamOrganization>();
  const [departments, setDepartments] = useState<readonly SdkworkIamDepartment[]>([]);
  const [departmentTree, setDepartmentTree] = useState<readonly SdkworkIamDepartmentNode[]>([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>();
  const [assignments, setAssignments] = useState<readonly SdkworkIamDepartmentAssignment[]>([]);
  const [organizationMembers, setOrganizationMembers] = useState<readonly SdkworkIamOrganizationMembership[]>([]);
  const [departmentDraft, setDepartmentDraft] = useState<SdkworkIamDepartmentDraft>(() => emptyDepartmentDraft(organizationId));
  const [departmentDrawerMode, setDepartmentDrawerMode] = useState<DepartmentDrawerMode>();
  const [editingDepartment, setEditingDepartment] = useState<SdkworkIamDepartment>();
  const [deleteDepartmentTarget, setDeleteDepartmentTarget] = useState<SdkworkIamDepartment>();
  const [assignmentDrawerOpen, setAssignmentDrawerOpen] = useState(false);
  const [selectedMembershipId, setSelectedMembershipId] = useState("");
  const [assignmentIsPrimary, setAssignmentIsPrimary] = useState(false);
  const [memberSearchQuery, setMemberSearchQuery] = useState("");
  const [organizationMemberSearchQuery, setOrganizationMemberSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [memberLoading, setMemberLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [notice, setNotice] = useState<string>();

  const selectedDepartment = useMemo(
    () => departments.find((department) => department.departmentId === selectedDepartmentId),
    [departments, selectedDepartmentId],
  );
  const departmentById = useMemo(
    () => new Map(departments.map((department) => [department.departmentId, department])),
    [departments],
  );
  const treeData = useMemo(() => toTreeData(departmentTree), [departmentTree]);
  const assignedMembershipIds = useMemo(
    () => new Set(assignments.map((assignment) => assignment.organizationMembershipId).filter(Boolean)),
    [assignments],
  );
  const availableOrganizationMembers = useMemo(
    () => organizationMembers.filter((membership) => !assignedMembershipIds.has(membership.membershipId ?? membership.id)),
    [assignedMembershipIds, organizationMembers],
  );

  const syncTree = (items: readonly SdkworkIamDepartment[]) => {
    const stateTree = controller.getState().departmentTree;
    setDepartmentTree(stateTree.length > 0 ? stateTree : controller.buildDepartmentTree(items));
  };

  const refreshDepartments = async () => {
    const items = await controller.listDepartments(organizationId);
    setDepartments(items);
    syncTree(items);
    setSelectedDepartmentId((current) => current && items.some((item) => item.departmentId === current)
      ? current
      : controller.getState().departmentTree[0]?.departmentId ?? items[0]?.departmentId);
    return items;
  };

  const refreshAssignments = async (departmentId: string, query = memberSearchQuery.trim()) => {
    const items = await controller.listDepartmentAssignments(departmentId, query ? { q: query } : undefined);
    setAssignments(items);
    return items;
  };

  const refreshOrganizationMembers = async (query = organizationMemberSearchQuery.trim()) => {
    const items = await controller.listMemberships(organizationId, query ? { q: query } : undefined);
    setOrganizationMembers(items);
    return items;
  };

  useEffect(() => {
    setLoading(true);
    setError(undefined);
    void Promise.all([
      controller.selectOrganization(organizationId),
      controller.listDepartments(organizationId),
      permissions.assignments.create && permissions.memberships.read
        ? controller.listMemberships(organizationId)
        : Promise.resolve([]),
    ]).then(([resolvedOrganization, resolvedDepartments, resolvedMembers]) => {
      setOrganization(resolvedOrganization);
      setDepartments(resolvedDepartments);
      setOrganizationMembers(resolvedMembers);
      syncTree(resolvedDepartments);
      const firstDepartmentId = controller.getState().departmentTree[0]?.departmentId ?? resolvedDepartments[0]?.departmentId;
      setSelectedDepartmentId(firstDepartmentId);
      if (firstDepartmentId && permissions.assignments.read) {
        setMemberLoading(true);
        return refreshAssignments(firstDepartmentId, "").finally(() => setMemberLoading(false));
      }
      return undefined;
    }).catch((loadError) => setError(toErrorMessage(loadError, messages.structure.notices.loadError)))
      .finally(() => setLoading(false));
  }, [controller, organizationId]);

  const runAction = async (action: () => Promise<void>, successMessage: string) => {
    setBusy(true);
    setError(undefined);
    setNotice(undefined);
    try {
      await action();
      setNotice(successMessage);
    } catch (actionError) {
      setError(toErrorMessage(actionError, messages.structure.notices.operationError));
    } finally {
      setBusy(false);
    }
  };

  const selectDepartment = (departmentId: string) => {
    setSelectedDepartmentId(departmentId);
    setMemberSearchQuery("");
    setAssignments([]);
    if (!permissions.assignments.read) return;
    setMemberLoading(true);
    setError(undefined);
    void refreshAssignments(departmentId, "")
      .catch((loadError) => setError(toErrorMessage(loadError, messages.structure.notices.loadError)))
      .finally(() => setMemberLoading(false));
  };

  const openCreateDepartment = (parentDepartmentId = "") => {
    setEditingDepartment(undefined);
    setDepartmentDraft({ name: "", organizationId, parentDepartmentId });
    setDepartmentDrawerMode("create");
  };

  const openEditDepartment = (department: SdkworkIamDepartment) => {
    setEditingDepartment(department);
    setDepartmentDraft({
      code: department.code ?? "",
      name: department.name,
      organizationId,
      parentDepartmentId: department.parentDepartmentId ?? "",
      status: department.status ?? "",
    });
    setDepartmentDrawerMode("edit");
  };

  const submitMemberSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedDepartmentId) return;
    setMemberLoading(true);
    setError(undefined);
    void refreshAssignments(selectedDepartmentId)
      .catch((loadError) => setError(toErrorMessage(loadError, messages.structure.notices.loadError)))
      .finally(() => setMemberLoading(false));
  };

  const submitOrganizationMemberSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError(undefined);
    void refreshOrganizationMembers()
      .catch((loadError) => setError(toErrorMessage(loadError, messages.structure.notices.loadError)))
      .finally(() => setBusy(false));
  };

  const memberColumns = useMemo<DataTableColumn<SdkworkIamDepartmentAssignment>[]>(() => [
    {
      id: "member",
      header: messages.structure.members.member,
      cell: (assignment) => (
        <span className="block min-w-[7rem]">
          <span className="block whitespace-nowrap">{assignment.displayName || organizationMembers.find(
            (membership) => (membership.membershipId ?? membership.id) === assignment.organizationMembershipId,
          )?.displayName || assignment.userId}</span>
          <code className="mt-1 block whitespace-nowrap text-xs text-[var(--sdk-color-text-muted)] sm:hidden">{assignment.userId}</code>
        </span>
      ),
      cellProps: { className: "whitespace-nowrap" },
    },
    { id: "userId", header: messages.structure.members.userId, headerProps: { className: "hidden sm:table-cell" }, cell: (assignment) => <code className="whitespace-nowrap text-xs">{assignment.userId}</code>, cellProps: { className: "hidden whitespace-nowrap sm:table-cell" } },
    { id: "position", header: messages.structure.members.position, headerProps: { className: "hidden md:table-cell" }, cell: (assignment) => assignment.positionName || "-", cellProps: { className: "hidden whitespace-nowrap md:table-cell" } },
    { id: "primary", header: messages.structure.members.primary, cell: (assignment) => assignment.isPrimary ? <Star className="h-4 w-4 fill-current text-[var(--sdk-color-state-warning)]" /> : "-", cellProps: { className: "whitespace-nowrap" } },
    { id: "status", header: messages.structure.members.status, headerProps: { className: "hidden sm:table-cell" }, cell: (assignment) => assignment.status ? <StatusBadge label={assignment.status} status={assignment.status} /> : "-", cellProps: { className: "hidden whitespace-nowrap sm:table-cell" } },
  ], [messages, organizationMembers]);

  return (
    <div className="space-y-4">
      {onBack ? (
        <Button onClick={onBack} type="button" variant="ghost">
          <ArrowLeft className="h-4 w-4" />
          {messages.structure.back}
        </Button>
      ) : null}

      <SettingsSection
        description={template(messages.structure.descriptionTemplate, { name: organization?.name ?? organizationId })}
        title={template(messages.structure.titleTemplate, { name: organization?.name ?? organizationId })}
      >
        {error ? <StatusNotice tone="danger">{error}</StatusNotice> : null}
        {notice ? <StatusNotice tone="success">{notice}</StatusNotice> : null}

        <div className="grid min-h-[32rem] overflow-hidden border-y border-[var(--sdk-color-border-subtle)] lg:grid-cols-[20rem_minmax(0,1fr)]">
          <aside className="border-b border-[var(--sdk-color-border-subtle)] py-4 lg:border-b-0 lg:border-r lg:pr-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2">
                <GitBranch className="h-4 w-4 shrink-0 text-[var(--sdk-color-text-secondary)]" />
                <h2 className="truncate text-sm font-semibold text-[var(--sdk-color-text-primary)]">{messages.structure.tree.title}</h2>
              </div>
              {permissions.departments.create ? (
                <IconButton aria-label={messages.structure.tree.createRoot} onClick={() => openCreateDepartment()} title={messages.structure.tree.createRoot} variant="ghost">
                  <Plus className="h-4 w-4" />
                </IconButton>
              ) : null}
            </div>
            <Tree
              key={departments.map((department) => department.departmentId).join(":")}
              data={treeData}
              defaultExpandedIds={departments.map((department) => department.departmentId)}
              emptyDescription={messages.structure.tree.emptyDescription}
              emptyTitle={messages.structure.tree.emptyTitle}
              onSelectedIdChange={selectDepartment}
              renderActions={(item) => {
                const department = departmentById.get(item.id);
                if (!department) return null;
                return (
                  <span className="flex items-center gap-1" onClick={(event) => event.stopPropagation()}>
                    {permissions.departments.create ? <IconButton aria-label={messages.structure.tree.addChild} onClick={() => openCreateDepartment(department.departmentId)} title={messages.structure.tree.addChild} variant="ghost"><Plus className="h-3.5 w-3.5" /></IconButton> : null}
                    {permissions.departments.update ? <IconButton aria-label={messages.structure.tree.edit} onClick={() => openEditDepartment(department)} title={messages.structure.tree.edit} variant="ghost"><Pencil className="h-3.5 w-3.5" /></IconButton> : null}
                    {permissions.departments.delete ? <IconButton aria-label={messages.structure.tree.delete} onClick={() => setDeleteDepartmentTarget(department)} title={messages.structure.tree.delete} variant="ghost"><Trash2 className="h-3.5 w-3.5 text-[var(--sdk-color-state-danger)]" /></IconButton> : null}
                  </span>
                );
              }}
              selectedId={selectedDepartmentId ?? null}
            />
          </aside>

          <main className="min-w-0 py-4 lg:pl-5">
            {selectedDepartment ? (
              <DataTable
                columns={memberColumns}
                emptyDescription={messages.structure.members.emptyDescription}
                emptyTitle={messages.structure.members.emptyTitle}
                footer={<SdkworkIamListPaginationControls busy={busy} onLoadMore={() => void runAction(async () => {
                  setAssignments(await controller.loadMoreDepartmentAssignments(selectedDepartment.departmentId));
                }, messages.structure.members.loadedMore)} pageInfo={controller.getState().departmentAssignmentListPageInfo} />}
                getRowId={(assignment) => assignment.assignmentId}
                loading={loading || memberLoading}
                rowActionsLabel={messages.structure.members.actions}
                rowActions={permissions.assignments.update ? (assignment) => (
                  <Button disabled={assignment.isPrimary} onClick={() => void runAction(async () => {
                    await controller.updateDepartmentAssignment(assignment.assignmentId, { isPrimary: true });
                    await refreshAssignments(selectedDepartment.departmentId);
                  }, messages.structure.notices.assignmentUpdated)} size="sm" type="button" variant="outline">
                    <Star className="h-3.5 w-3.5" />
                    {messages.structure.members.setPrimary}
                  </Button>
                ) : undefined}
                rows={[...assignments]}
                title={selectedDepartment.name}
                toolbar={(
                  <div className="flex w-full flex-wrap items-center gap-2">
                    <form className="flex min-w-[15rem] flex-1 items-center gap-2" onSubmit={submitMemberSearch} role="search">
                      <Input aria-label={messages.structure.members.searchLabel} onChange={(event) => setMemberSearchQuery(event.target.value)} placeholder={messages.structure.members.searchPlaceholder} value={memberSearchQuery} />
                      <IconButton aria-label={messages.structure.members.searchAction} disabled={memberLoading} title={messages.structure.members.searchAction} type="submit" variant="outline"><Search className="h-4 w-4" /></IconButton>
                    </form>
                    {permissions.assignments.create && permissions.memberships.read ? (
                      <Button onClick={() => { setSelectedMembershipId(""); setAssignmentIsPrimary(false); setAssignmentDrawerOpen(true); }} type="button">
                        <UserPlus className="h-4 w-4" />
                        {messages.structure.members.add}
                      </Button>
                    ) : null}
                  </div>
                )}
              />
            ) : (
              <div className="flex min-h-64 items-center justify-center text-sm text-[var(--sdk-color-text-muted)]">
                {messages.structure.tree.emptyDescription}
              </div>
            )}
          </main>
        </div>
      </SettingsSection>

      <DepartmentDrawer
        busy={busy}
        draft={departmentDraft}
        mode={departmentDrawerMode}
        onDraftChange={setDepartmentDraft}
        onOpenChange={(open) => { if (!open) setDepartmentDrawerMode(undefined); }}
        onSubmit={() => void runAction(async () => {
          if (departmentDrawerMode === "edit" && editingDepartment) {
            await controller.updateDepartment(editingDepartment.departmentId, departmentDraft);
          } else {
            const created = await controller.createDepartment(departmentDraft);
            setSelectedDepartmentId(created.departmentId);
          }
          await refreshDepartments();
          setDepartmentDrawerMode(undefined);
        }, departmentDrawerMode === "edit" ? messages.structure.notices.departmentUpdated : messages.structure.notices.departmentCreated)}
      />

      <Drawer onOpenChange={setAssignmentDrawerOpen} open={assignmentDrawerOpen}>
        <DrawerContent size="md">
          <DrawerHeader>
            <DrawerTitle>{messages.structure.members.addTitle}</DrawerTitle>
            <DrawerDescription>{template(messages.structure.members.addDescriptionTemplate, { name: organization?.name ?? organizationId })}</DrawerDescription>
          </DrawerHeader>
          <DrawerBody className="space-y-4">
            <form className="flex items-center gap-2" onSubmit={submitOrganizationMemberSearch} role="search">
              <Input aria-label={messages.structure.members.organizationMember} onChange={(event) => setOrganizationMemberSearchQuery(event.target.value)} placeholder={messages.structure.members.searchPlaceholder} value={organizationMemberSearchQuery} />
              <IconButton aria-label={messages.structure.members.searchAction} disabled={busy} title={messages.structure.members.searchAction} type="submit" variant="outline"><Search className="h-4 w-4" /></IconButton>
            </form>
            {availableOrganizationMembers.length > 0 ? (
              <label className="block space-y-1.5 text-sm">
                <span className="font-medium text-[var(--sdk-color-text-primary)]">{messages.structure.members.organizationMember}</span>
                <Select onValueChange={setSelectedMembershipId} value={selectedMembershipId}>
                  <SelectTrigger aria-label={messages.structure.members.organizationMember}><SelectValue placeholder={messages.structure.members.organizationMember} /></SelectTrigger>
                  <SelectContent>
                    {availableOrganizationMembers.map((membership) => (
                      <SelectItem key={membership.membershipId ?? membership.id} value={membership.membershipId ?? membership.id}>
                        {membership.displayName || membership.username || membership.email || membership.userId}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>
            ) : <StatusNotice tone="default">{messages.structure.members.noAvailableMembers}</StatusNotice>}
            <label className="flex items-center gap-2 text-sm text-[var(--sdk-color-text-primary)]">
              <Checkbox checked={assignmentIsPrimary} onCheckedChange={(checked) => setAssignmentIsPrimary(checked === true)} />
              {messages.structure.members.isPrimary}
            </label>
          </DrawerBody>
          <DrawerFooter>
            <Button disabled={busy} onClick={() => setAssignmentDrawerOpen(false)} type="button" variant="secondary">{messages.common.cancel}</Button>
            <Button disabled={busy || !selectedDepartment || !selectedMembershipId} loading={busy} onClick={() => {
              if (!selectedDepartment) return;
              void runAction(async () => {
                await controller.createDepartmentAssignment({ departmentId: selectedDepartment.departmentId, isPrimary: assignmentIsPrimary, organizationMembershipId: selectedMembershipId });
                await refreshAssignments(selectedDepartment.departmentId);
                setAssignmentDrawerOpen(false);
              }, messages.structure.notices.assignmentCreated);
            }} type="button">{messages.structure.members.add}</Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      <ConfirmDialog closeOnConfirm={false} confirmLabel={messages.structure.tree.delete} confirmLoading={busy} description={deleteDepartmentTarget ? template(messages.structure.tree.deleteDescriptionTemplate, { name: deleteDepartmentTarget.name }) : undefined} onConfirm={() => {
        if (!deleteDepartmentTarget) return;
        void runAction(async () => {
          await controller.deleteDepartment(deleteDepartmentTarget.departmentId);
          const remainingDepartments = await refreshDepartments();
          const nextDepartmentId = controller.getState().departmentTree[0]?.departmentId ?? remainingDepartments[0]?.departmentId;
          setAssignments([]);
          if (nextDepartmentId && permissions.assignments.read) {
            setSelectedDepartmentId(nextDepartmentId);
            await refreshAssignments(nextDepartmentId, "");
          }
          setDeleteDepartmentTarget(undefined);
        }, messages.structure.notices.departmentDeleted);
      }} onOpenChange={(open) => { if (!open && !busy) setDeleteDepartmentTarget(undefined); }} open={Boolean(deleteDepartmentTarget)} title={messages.structure.tree.deleteTitle} tone="danger" />
    </div>
  );
}

function DepartmentDrawer({ busy, draft, mode, onDraftChange, onOpenChange, onSubmit }: {
  busy: boolean;
  draft: SdkworkIamDepartmentDraft;
  mode?: DepartmentDrawerMode;
  onDraftChange: (draft: SdkworkIamDepartmentDraft) => void;
  onOpenChange: (open: boolean) => void;
  onSubmit: () => void;
}) {
  const messages = useSdkworkIamOrganizationAdminMessages();
  const editing = mode === "edit";
  return (
    <Drawer onOpenChange={onOpenChange} open={Boolean(mode)}>
      <DrawerContent size="md">
        <DrawerHeader><DrawerTitle>{editing ? messages.structure.departmentDrawer.editTitle : messages.structure.departmentDrawer.createTitle}</DrawerTitle><DrawerDescription>{editing ? messages.structure.departmentDrawer.editDescription : messages.structure.departmentDrawer.createDescription}</DrawerDescription></DrawerHeader>
        <DrawerBody className="space-y-4">
          <Field label={messages.structure.departmentDrawer.name} onChange={(name) => onDraftChange({ ...draft, name })} value={draft.name} />
          <Field label={messages.structure.departmentDrawer.code} onChange={(code) => onDraftChange({ ...draft, code })} value={draft.code ?? ""} />
          <Field label={messages.structure.departmentDrawer.parent} onChange={(parentDepartmentId) => onDraftChange({ ...draft, parentDepartmentId })} value={draft.parentDepartmentId ?? ""} />
          {editing ? <Field label={messages.structure.departmentDrawer.status} onChange={(status) => onDraftChange({ ...draft, status })} value={draft.status ?? ""} /> : null}
        </DrawerBody>
        <DrawerFooter>
          <Button disabled={busy} onClick={() => onOpenChange(false)} type="button" variant="secondary">{messages.common.cancel}</Button>
          <Button disabled={busy || !draft.name.trim()} loading={busy} onClick={onSubmit} type="button">{editing ? messages.common.save : messages.common.create}</Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

function Field({ label, onChange, value }: { label: string; onChange: (value: string) => void; value: string }) {
  return <label className="block space-y-1.5 text-sm"><span className="font-medium text-[var(--sdk-color-text-primary)]">{label}</span><Input onChange={(event) => onChange(event.target.value)} value={value} /></label>;
}

function emptyDepartmentDraft(organizationId: string): SdkworkIamDepartmentDraft {
  return { name: "", organizationId, parentDepartmentId: "" };
}

function toTreeData(nodes: readonly SdkworkIamDepartmentNode[]): TreeNodeData[] {
  return nodes.map((node) => ({ id: node.departmentId, label: node.name, description: node.code, children: toTreeData(node.children) }));
}

function template(value: string, replacements: Record<string, string>) {
  return Object.entries(replacements).reduce((result, [key, replacement]) => result.replace(`{${key}}`, replacement), value);
}

function toErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}
