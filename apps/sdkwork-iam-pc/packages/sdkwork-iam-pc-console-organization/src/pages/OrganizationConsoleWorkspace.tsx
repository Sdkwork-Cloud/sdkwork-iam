import { useEffect, useState } from "react";
import { SdkworkIamListPaginationControls } from "@sdkwork/iam-pc-admin-core";
import { SettingsSection, StatusNotice } from "@sdkwork/ui-pc-react";

import type { SdkworkIamConsoleOrganizationWorkspaceProps } from "../types/organization-console-types";

export function SdkworkIamConsoleOrganizationWorkspace({
  controller,
  description = "Browse organizations, departments, and memberships available to the signed-in tenant owner.",
  title = "Organization console",
}: SdkworkIamConsoleOrganizationWorkspaceProps) {
  const [organizations, setOrganizations] = useState(controller.getState().organizations);
  const [departments, setDepartments] = useState(controller.getState().departments);
  const [memberships, setMemberships] = useState(controller.getState().memberships);
  const [listPageInfo, setListPageInfo] = useState(controller.getState().listPageInfo);
  const [selectedOrganizationId, setSelectedOrganizationId] = useState(
    controller.getState().selectedOrganization?.organizationId ?? "",
  );
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    void controller.refreshWorkspace()
      .then(({ organizations: nextOrganizations, departments: nextDepartments, memberships: nextMemberships }) => {
        setOrganizations(nextOrganizations);
        setDepartments(nextDepartments);
        setMemberships(nextMemberships);
        setListPageInfo(controller.getState().listPageInfo);
        if (nextOrganizations[0]?.organizationId) {
          setSelectedOrganizationId(nextOrganizations[0].organizationId);
        }
      })
      .catch((loadError) => {
        setError(loadError instanceof Error ? loadError.message : "Failed to load organization console");
      });
  }, [controller]);

  useEffect(() => {
    if (!selectedOrganizationId) {
      return;
    }
    void controller.selectOrganization(selectedOrganizationId)
      .then(() => {
        const state = controller.getState();
        setDepartments(state.departments);
        setMemberships(state.memberships);
        setListPageInfo(state.listPageInfo);
      })
      .catch((loadError) => {
        setError(loadError instanceof Error ? loadError.message : "Failed to load organization details");
      });
  }, [controller, selectedOrganizationId]);

  return (
    <div className="space-y-6">
      <SettingsSection description={description} title={title}>
        {error ? <StatusNotice tone="danger">{error}</StatusNotice> : null}
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
          onLoadMore={() => controller.loadMoreOrganizations().then((items) => {
            setOrganizations(items);
            setListPageInfo(controller.getState().listPageInfo);
          }).catch((loadError) => {
            setError(loadError instanceof Error ? loadError.message : "Failed to load more organizations");
          })}
          pageInfo={listPageInfo?.organizations}
        />
        <section className="space-y-2">
          <h3 className="text-sm font-semibold">Departments ({departments.length})</h3>
          <ul className="space-y-2">
            {departments.map((department) => (
              <li className="rounded-[0.75rem] border border-[var(--sdk-color-border-default)] px-3 py-2 text-sm" key={department.departmentId}>
                {department.name} ({department.departmentId})
              </li>
            ))}
          </ul>
          {selectedOrganizationId ? (
            <SdkworkIamListPaginationControls
              onLoadMore={() => controller.loadMoreDepartments(selectedOrganizationId).then((items) => {
                setDepartments(items);
                setListPageInfo(controller.getState().listPageInfo);
              }).catch((loadError) => {
                setError(loadError instanceof Error ? loadError.message : "Failed to load more departments");
              })}
              pageInfo={listPageInfo?.departments}
            />
          ) : null}
        </section>
        <section className="space-y-2">
          <h3 className="text-sm font-semibold">Memberships ({memberships.length})</h3>
          <ul className="space-y-2">
            {memberships.map((membership) => (
              <li className="rounded-[0.75rem] border border-[var(--sdk-color-border-default)] px-3 py-2 text-sm" key={membership.id}>
                {membership.displayName || membership.userId}
                {membership.roleCode ? ` (${membership.roleCode})` : ""}
              </li>
            ))}
          </ul>
          <SdkworkIamListPaginationControls
            onLoadMore={() => controller.loadMoreMemberships().then((items) => {
              setMemberships(items);
              setListPageInfo(controller.getState().listPageInfo);
            }).catch((loadError) => {
              setError(loadError instanceof Error ? loadError.message : "Failed to load more memberships");
            })}
            pageInfo={listPageInfo?.memberships}
          />
        </section>
      </SettingsSection>
    </div>
  );
}
