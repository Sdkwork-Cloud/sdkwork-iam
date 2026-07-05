import { useEffect, useState } from "react";
import { SdkworkIamListPaginationControls } from "@sdkwork/iam-pc-admin-core";
import { SettingsSection, StatusNotice } from "@sdkwork/ui-pc-react";

import type { SdkworkIamConsoleTenantWorkspaceProps } from "../types/tenant-console-types";

export function SdkworkIamConsoleTenantWorkspace({
  controller,
  description = "Review tenant runtime context, organizations, and memberships available to the signed-in tenant owner.",
  title = "Tenant console",
}: SdkworkIamConsoleTenantWorkspaceProps) {
  const [runtime, setRuntime] = useState(controller.getState().runtime);
  const [organizations, setOrganizations] = useState(controller.getState().organizations);
  const [memberships, setMemberships] = useState(controller.getState().memberships);
  const [listPageInfo, setListPageInfo] = useState(controller.getState().listPageInfo);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    void controller.refreshWorkspace()
      .then(({ runtime: nextRuntime, organizations: nextOrganizations, memberships: nextMemberships }) => {
        setRuntime(nextRuntime);
        setOrganizations(nextOrganizations);
        setMemberships(nextMemberships);
        setListPageInfo(controller.getState().listPageInfo);
      })
      .catch((loadError) => {
        setError(loadError instanceof Error ? loadError.message : "Failed to load tenant console workspace");
      });
  }, [controller]);

  return (
    <div className="space-y-6">
      <SettingsSection description={description} title={title}>
        {error ? <StatusNotice tone="danger">{error}</StatusNotice> : null}
        {runtime ? (
          <dl className="grid gap-2 text-sm md:grid-cols-2">
            <div><dt className="font-medium">Tenant</dt><dd>{runtime.tenantId || "—"}</dd></div>
            <div><dt className="font-medium">User</dt><dd>{runtime.userId || "—"}</dd></div>
            <div><dt className="font-medium">Environment</dt><dd>{runtime.environment || "—"}</dd></div>
            <div><dt className="font-medium">Deployment</dt><dd>{runtime.deploymentMode || "—"}</dd></div>
          </dl>
        ) : null}
        <section className="space-y-2">
          <h3 className="text-sm font-semibold">Organizations ({organizations.length})</h3>
          <ul className="space-y-2">
            {organizations.map((organization) => (
              <li className="rounded-[0.75rem] border border-[var(--sdk-color-border-default)] px-3 py-2 text-sm" key={organization.organizationId}>
                {organization.name} ({organization.organizationId})
              </li>
            ))}
          </ul>
          <SdkworkIamListPaginationControls
            onLoadMore={() => controller.loadMoreOrganizations().then((items) => {
              setOrganizations(items);
              setListPageInfo(controller.getState().listPageInfo);
            }).catch((loadError) => {
              setError(loadError instanceof Error ? loadError.message : "Failed to load more organizations");
            })}
            pageInfo={listPageInfo?.organizations}
          />
        </section>
        <section className="space-y-2">
          <h3 className="text-sm font-semibold">Memberships ({memberships.length})</h3>
          <ul className="space-y-2">
            {memberships.map((membership) => (
              <li className="rounded-[0.75rem] border border-[var(--sdk-color-border-default)] px-3 py-2 text-sm" key={membership.id}>
                {membership.displayName || membership.userId}
                {membership.organizationId ? ` — ${membership.organizationId}` : ""}
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
