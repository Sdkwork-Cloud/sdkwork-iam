import { useEffect, useMemo, useState, type FormEvent } from "react";
import { AppWindow, Building2, Search } from "lucide-react";
import {
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  StatusNotice,
} from "@sdkwork/ui-pc-react";

import { TenantApplicationsPanel } from "../components/TenantApplicationsPanel";
import { useSdkworkIamTenantAdminMessages } from "../i18n";
import type {
  SdkworkIamTenant,
  SdkworkIamTenantApplicationsAdminWorkspaceProps,
} from "../types/tenant-admin-types";

/**
 * Standalone tenant application administration surface.
 *
 * Lets an operator pick a tenant (searchable) and then manage the
 * application instances owned by that tenant through
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
  const [searchQuery, setSearchQuery] = useState("");
  const [appliedSearchQuery, setAppliedSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();

  useEffect(() => {
    setLoading(true);
    setError(undefined);
    void controller
      .listTenants()
      .then((items) => setTenants(items))
      .catch((loadError) => setError(toErrorMessage(loadError, messages.tenants.notices.loadError)))
      .finally(() => setLoading(false));
  }, [controller, messages.tenants.notices.loadError]);

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAppliedSearchQuery(searchQuery.trim());
  };

  const filteredTenants = useMemo(() => {
    const query = appliedSearchQuery.toLowerCase();
    if (!query) {
      return tenants;
    }
    return tenants.filter((tenant) =>
      [tenant.name, tenant.code ?? "", tenant.tenantId]
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [appliedSearchQuery, tenants]);

  const selectTenant = async (tenantId: string) => {
    setError(undefined);
    const local = tenants.find((tenant) => tenant.tenantId === tenantId);
    try {
      const resolved = await controller.selectTenant(tenantId);
      setSelectedTenant(resolved ?? local);
    } catch (selectError) {
      setSelectedTenant(local);
      setError(toErrorMessage(selectError, messages.tenants.notices.loadError));
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-5">
      <header className="space-y-1.5">
        <h1 className="text-lg font-semibold text-[var(--sdk-color-text-primary)]">
          {messages.applications.standaloneTitle}
        </h1>
        <p className="text-sm text-[var(--sdk-color-text-muted)]">{messages.applications.description}</p>
      </header>

      {error ? <StatusNotice tone="danger">{error}</StatusNotice> : null}

      {loading ? (
        <p className="text-sm text-[var(--sdk-color-text-muted)]" role="status">
          {messages.applications.notices.loading}
        </p>
      ) : tenants.length > 0 ? (
        <form
          className="grid grid-cols-[minmax(0,1fr)_16rem_auto] items-end gap-3"
          onSubmit={submitSearch}
          role="search"
        >
          <label className="min-w-0 flex-1 space-y-1.5 text-sm">
            <span className="sr-only">{messages.tenants.searchLabel}</span>
            <span className="relative block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--sdk-color-text-muted)]" />
              <Input
                className="pl-9"
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder={messages.tenants.searchPlaceholder}
                value={searchQuery}
              />
            </span>
          </label>
          <label className="space-y-1.5 text-sm">
            <span className="sr-only">{messages.applications.tenantSelectorLabel}</span>
            <Select onValueChange={(tenantId) => void selectTenant(tenantId)} value={selectedTenant?.tenantId ?? ""}>
              <SelectTrigger aria-label={messages.applications.tenantSelectorLabel} className="w-full">
                <SelectValue placeholder={messages.applications.tenantSelectorLabel} />
              </SelectTrigger>
              <SelectContent>
                {filteredTenants.length > 0 ? (
                  filteredTenants.map((tenant) => (
                    <SelectItem key={tenant.tenantId} value={tenant.tenantId}>
                      <span className="flex min-w-0 items-center gap-2">
                        <Building2 className="h-3.5 w-3.5 shrink-0 text-[var(--sdk-color-text-muted)]" />
                        <span className="truncate">{tenant.name}</span>
                        <span className="truncate text-xs text-[var(--sdk-color-text-muted)]">{tenant.tenantId}</span>
                      </span>
                    </SelectItem>
                  ))
                ) : (
                  <div className="px-3 py-6 text-center text-sm text-[var(--sdk-color-text-muted)]">
                    {messages.applications.tenantSelectorEmpty}
                  </div>
                )}
              </SelectContent>
            </Select>
          </label>
          <Button disabled={loading} type="submit" variant="outline">
            <Search className="h-4 w-4" />
            {messages.tenants.applySearch}
          </Button>
        </form>
      ) : error ? null : (
        <div className="flex flex-col items-center gap-3 rounded-[var(--sdk-radius-panel)] border border-dashed border-[var(--sdk-color-border-subtle)] px-6 py-16 text-center">
          <span className="flex h-10 w-10 items-center justify-center rounded-[var(--sdk-radius-control)] bg-[var(--sdk-color-surface-panel-muted)] text-[var(--sdk-color-text-secondary)]">
            <AppWindow className="h-5 w-5" />
          </span>
          <p className="text-sm text-[var(--sdk-color-text-muted)]">
            {messages.applications.tenantSelectorEmpty}
          </p>
        </div>
      )}

      {selectedTenant ? (
        <div className="flex min-h-0 flex-1 flex-col border-t border-[var(--sdk-color-border-subtle)] pt-5">
          <TenantApplicationsPanel controller={controller} tenant={selectedTenant} />
        </div>
      ) : null}
    </div>
  );
}

function toErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}
