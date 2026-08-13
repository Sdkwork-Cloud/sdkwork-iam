import { useEffect, useMemo, useState } from "react";
import { AppWindow } from "lucide-react";
import { StatusNotice } from "@sdkwork/ui-pc-react";

import { TenantApplicationsPanel } from "../components/TenantApplicationsPanel";
import { useSdkworkIamTenantAdminMessages } from "../i18n";
import type {
  SdkworkIamTenant,
  SdkworkIamTenantApplicationsAdminWorkspaceProps,
} from "../types/tenant-admin-types";

/**
 * Standalone tenant application administration surface.
 *
 * Targets the operator's current tenant: the controller's configured
 * `selectedTenantId` is resolved against the loaded tenant list and the
 * application instances owned by that tenant are managed through
 * {@link TenantApplicationsPanel}. All remote calls and mutation
 * permissions flow through the injected tenant controller, matching the
 * tenant detail workspace pattern.
 */
export function SdkworkIamTenantApplicationsAdminWorkspace({
  controller,
}: SdkworkIamTenantApplicationsAdminWorkspaceProps) {
  const messages = useSdkworkIamTenantAdminMessages();
  const [tenants, setTenants] = useState<readonly SdkworkIamTenant[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<SdkworkIamTenant>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();

  useEffect(() => {
    setLoading(true);
    setError(undefined);
    void controller
      .listTenants()
      .then((items) => {
        setTenants(items);
        setSelectedTenant(controller.getSelectedTenant());
      })
      .catch((loadError) => setError(toErrorMessage(loadError, messages.tenants.notices.loadError)))
      .finally(() => setLoading(false));
  }, [controller, messages.tenants.notices.loadError]);

  const content = useMemo(() => {
    if (loading) {
      return (
        <p className="text-sm text-[var(--sdk-color-text-muted)]" role="status">
          {messages.applications.notices.loading}
        </p>
      );
    }

    if (selectedTenant) {
      return <TenantApplicationsPanel controller={controller} tenant={selectedTenant} />;
    }

    return (
      <div className="flex flex-col items-center gap-3 rounded-[var(--sdk-radius-panel)] border border-dashed border-[var(--sdk-color-border-subtle)] px-6 py-16 text-center">
        <span className="flex h-10 w-10 items-center justify-center rounded-[var(--sdk-radius-control)] bg-[var(--sdk-color-surface-panel-muted)] text-[var(--sdk-color-text-secondary)]">
          <AppWindow className="h-5 w-5" />
        </span>
        <p className="text-sm text-[var(--sdk-color-text-muted)]">
          {tenants.length > 0
            ? messages.applications.notices.currentTenantUnavailable
            : messages.applications.tenantSelectorEmpty}
        </p>
      </div>
    );
  }, [controller, loading, messages, selectedTenant, tenants.length]);

  return (
    <div className="flex h-full min-h-0 flex-col gap-5">
      {error ? <StatusNotice tone="danger">{error}</StatusNotice> : null}
      {content}
    </div>
  );
}

function toErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}
