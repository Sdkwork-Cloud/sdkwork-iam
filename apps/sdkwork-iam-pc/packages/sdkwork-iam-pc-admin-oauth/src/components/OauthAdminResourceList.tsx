import { Button } from "@sdkwork/ui-pc-react";
import type { SdkWorkPageInfo } from "@sdkwork/iam-contracts";

import type {
  SdkworkIamOauthAdminController,
  SdkworkIamOauthAdminResourceSnapshot,
} from "../types/oauth-admin-types";
import { ManagedOAuthResourceList } from "./OauthAdminManagedList";
import { SdkworkIamListPaginationControls } from "@sdkwork/iam-pc-admin-core";
import {
  formatResourceLabel,
  readAccountLinkId,
  readClaimMappingId,
  readDiagnosticRunId,
  readFlowConfigId,
  readGrantId,
  readIntegrationId,
  readOAuthClientId,
  readOperatorPlatformId,
  readOperationalResourceId,
  readPolicyId,
  readProviderCatalogId,
  readResourceAccountId,
  readResourceAuthorizationId,
  readResourceKey,
  readScopeProfileId,
  readSecretId,
  readSurfaceId,
  readTenantBindingId,
  readWebhookConfigId,
} from "../utils/oauth-admin-utils";

type ListProps = {
  controller: SdkworkIamOauthAdminController;
  disabled: boolean;
  emptyLabel: string;
  listPageInfo?: Partial<Record<keyof SdkworkIamOauthAdminResourceSnapshot, SdkWorkPageInfo>>;
  onChanged: () => void;
};

function managedListPagination(
  props: ListProps,
  resourceKey: keyof SdkworkIamOauthAdminResourceSnapshot,
) {
  return {
    onLoadMore: () => props.controller.loadMoreResource(resourceKey).then(() => props.onChanged()),
    pageInfo: props.listPageInfo?.[resourceKey],
  };
}

export function ResourceList({
  emptyLabel,
  items,
  listPageInfo,
  onLoadMore,
}: {
  emptyLabel: string;
  items: unknown[];
  listPageInfo?: SdkWorkPageInfo;
  onLoadMore?: () => void | Promise<void>;
}) {
  if (items.length === 0) {
    return (
      <>
        <p className="text-sm text-[var(--sdk-color-text-muted)]">{emptyLabel}</p>
        <SdkworkIamListPaginationControls onLoadMore={onLoadMore} pageInfo={listPageInfo} />
      </>
    );
  }

  return (
    <>
    <ul className="space-y-2">
      {items.map((item, index) => (
        <li
          className="rounded-[0.75rem] border border-[var(--sdk-color-border-default)] px-3 py-2 text-sm"
          key={readResourceKey(item, index)}
        >
          {formatResourceLabel(item)}
        </li>
      ))}
    </ul>
    <SdkworkIamListPaginationControls onLoadMore={onLoadMore} pageInfo={listPageInfo} />
    </>
  );
}

export function IntegrationResourceList({ controller,
  disabled,
  emptyLabel,
  integrations,
  onChanged,
  listPageInfo,
}: ListProps & { integrations: unknown[] }) {
  return (
    <ManagedOAuthResourceList
      actions={[{ label: "Retrieve", onAction: (id) => controller.retrieveIntegration(id) }]}
      confirmDeleteMessage="Delete this OAuth integration? Inbound login for the provider will stop for this tenant."
      disabled={disabled}
      emptyLabel={emptyLabel}
      items={integrations}
      onChanged={onChanged}
      {...managedListPagination({ controller, disabled, emptyLabel, listPageInfo, onChanged }, "integrations")}
      onDelete={(id) => controller.deleteIntegration(id)}
      readId={readIntegrationId}
      toggleEnabled={(id, enabled) => controller.updateIntegration(id, enabled)}
    />
  );
}

export function ClientResourceList({ clients,
  controller,
  disabled,
  emptyLabel,
  onChanged,
  listPageInfo,
}: ListProps & { clients: unknown[] }) {
  return (
    <ManagedOAuthResourceList
      actions={[{ label: "Retrieve", onAction: (id) => controller.retrieveClient(id) }]}
      confirmDeleteMessage="Delete this OAuth client registration?"
      disabled={disabled}
      emptyLabel={emptyLabel}
      items={clients}
      onChanged={onChanged}
      {...managedListPagination({ controller, disabled, emptyLabel, listPageInfo, onChanged }, "clients")}
      onDelete={(id) => controller.deleteClient(id)}
      readId={readOAuthClientId}
      toggleEnabled={(id, enabled) => controller.updateClient(id, enabled)}
    />
  );
}

export function SecretResourceList({ controller,
  disabled,
  emptyLabel,
  onChanged,
  secrets,
  listPageInfo,
}: ListProps & { secrets: unknown[] }) {
  return (
    <ManagedOAuthResourceList
      confirmDeleteMessage="Delete this secret reference? Provider authentication may fail until a new secret is registered."
      disabled={disabled}
      emptyLabel={emptyLabel}
      items={secrets}
      onChanged={onChanged}
      {...managedListPagination({ controller, disabled, emptyLabel, listPageInfo, onChanged }, "secrets")}
      onDelete={(id) => controller.deleteSecret(id)}
      readId={readSecretId}
    />
  );
}

export function SurfaceResourceList({ controller,
  disabled,
  emptyLabel,
  onChanged,
  surfaces,
  listPageInfo,
}: ListProps & { surfaces: unknown[] }) {
  return (
    <ManagedOAuthResourceList
      disabled={disabled}
      emptyLabel={emptyLabel}
      items={surfaces}
      onChanged={onChanged}
      {...managedListPagination({ controller, disabled, emptyLabel, listPageInfo, onChanged }, "surfaces")}
      onDelete={(id) => controller.deleteSurface(id)}
      readId={readSurfaceId}
      toggleEnabled={(id, enabled) => controller.updateSurface(id, enabled)}
    />
  );
}

export function FlowConfigResourceList({ controller,
  disabled,
  emptyLabel,
  flowConfigs,
  onChanged,
  listPageInfo,
}: ListProps & { flowConfigs: unknown[] }) {
  return (
    <ManagedOAuthResourceList
      disabled={disabled}
      emptyLabel={emptyLabel}
      items={flowConfigs}
      onChanged={onChanged}
      {...managedListPagination({ controller, disabled, emptyLabel, listPageInfo, onChanged }, "flowConfigs")}
      readId={readFlowConfigId}
      toggleEnabled={(id, enabled) => controller.updateFlowConfig(id, enabled)}
    />
  );
}

export function ScopeProfileResourceList({ controller,
  disabled,
  emptyLabel,
  onChanged,
  scopeProfiles,
  listPageInfo,
}: ListProps & { scopeProfiles: unknown[] }) {
  return (
    <ManagedOAuthResourceList
      disabled={disabled}
      emptyLabel={emptyLabel}
      items={scopeProfiles}
      onChanged={onChanged}
      {...managedListPagination({ controller, disabled, emptyLabel, listPageInfo, onChanged }, "scopeProfiles")}
      readId={readScopeProfileId}
      toggleStatus={(id, active) => controller.updateScopeProfileStatus(id, active)}
    />
  );
}

export function ClaimMappingResourceList({ claimMappings,
  controller,
  disabled,
  emptyLabel,
  onChanged,
  listPageInfo,
}: ListProps & { claimMappings: unknown[] }) {
  return (
    <ManagedOAuthResourceList
      disabled={disabled}
      emptyLabel={emptyLabel}
      items={claimMappings}
      onChanged={onChanged}
      {...managedListPagination({ controller, disabled, emptyLabel, listPageInfo, onChanged }, "claimMappings")}
      readId={readClaimMappingId}
      toggleStatus={(id, active) => controller.updateClaimMappingStatus(id, active)}
    />
  );
}

export function WebhookConfigResourceList({ controller,
  disabled,
  emptyLabel,
  onChanged,
  webhookConfigs,
  listPageInfo,
}: ListProps & { webhookConfigs: unknown[] }) {
  return (
    <ManagedOAuthResourceList
      actions={[{ label: "Verify", onAction: (id) => controller.runWebhookVerification(id) }]}
      disabled={disabled}
      emptyLabel={emptyLabel}
      items={webhookConfigs}
      onChanged={onChanged}
      {...managedListPagination({ controller, disabled, emptyLabel, listPageInfo, onChanged }, "webhookConfigs")}
      readId={readWebhookConfigId}
      toggleEnabled={(id, enabled) => controller.updateWebhookConfig(id, enabled)}
    />
  );
}

export function PolicyResourceList({ controller,
  disabled,
  emptyLabel,
  onChanged,
  policies,
  listPageInfo,
}: ListProps & { policies: unknown[] }) {
  return (
    <ManagedOAuthResourceList
      disabled={disabled}
      emptyLabel={emptyLabel}
      items={policies}
      onChanged={onChanged}
      {...managedListPagination({ controller, disabled, emptyLabel, listPageInfo, onChanged }, "policies")}
      readId={readPolicyId}
      toggleStatus={(id, active) => controller.updatePolicyStatus(id, active)}
    />
  );
}

export function TenantBindingResourceList({ controller,
  disabled,
  emptyLabel,
  onChanged,
  tenantBindings,
  listPageInfo,
}: ListProps & { tenantBindings: unknown[] }) {
  return (
    <ManagedOAuthResourceList
      disabled={disabled}
      emptyLabel={emptyLabel}
      items={tenantBindings}
      onChanged={onChanged}
      {...managedListPagination({ controller, disabled, emptyLabel, listPageInfo, onChanged }, "tenantBindings")}
      readId={readTenantBindingId}
      toggleStatus={(id, active) => controller.updateTenantBindingStatus(id, active)}
    />
  );
}

export function OperatorPlatformResourceList({ controller,
  disabled,
  emptyLabel,
  onChanged,
  operatorPlatforms,
  listPageInfo,
}: ListProps & { operatorPlatforms: unknown[] }) {
  return (
    <ManagedOAuthResourceList
      actions={[{ label: "Pre-auth", onAction: (id) => controller.runOperatorPlatformPreAuthorization(id) }]}
      disabled={disabled}
      emptyLabel={emptyLabel}
      items={operatorPlatforms}
      onChanged={onChanged}
      {...managedListPagination({ controller, disabled, emptyLabel, listPageInfo, onChanged }, "operatorPlatforms")}
      readId={readOperatorPlatformId}
      toggleEnabled={(id, enabled) => controller.updateOperatorPlatform(id, enabled)}
    />
  );
}

export function ResourceAccountResourceList({ controller,
  disabled,
  emptyLabel,
  onChanged,
  resourceAccounts,
  listPageInfo,
}: ListProps & { resourceAccounts: unknown[] }) {
  return (
    <ManagedOAuthResourceList
      actions={[
        { label: "Verify", onAction: (id) => controller.runResourceAccountVerification(id) },
        { label: "Refresh auth", onAction: (id) => controller.runResourceAccountAuthorizationRefresh(id) },
        { label: "Mini login check", onAction: (id) => controller.runResourceAccountMiniProgramLoginCheck(id) },
      ]}
      disabled={disabled}
      emptyLabel={emptyLabel}
      items={resourceAccounts}
      onChanged={onChanged}
      {...managedListPagination({ controller, disabled, emptyLabel, listPageInfo, onChanged }, "resourceAccounts")}
      readId={readResourceAccountId}
      toggleEnabled={(id, enabled) => controller.updateResourceAccount(id, enabled)}
    />
  );
}

export function ResourceAuthorizationResourceList({ controller,
  disabled,
  emptyLabel,
  onChanged,
  resourceAuthorizations,
  listPageInfo,
}: ListProps & { resourceAuthorizations: unknown[] }) {
  return (
    <ManagedOAuthResourceList
      disabled={disabled}
      emptyLabel={emptyLabel}
      items={resourceAuthorizations}
      onChanged={onChanged}
      {...managedListPagination({ controller, disabled, emptyLabel, listPageInfo, onChanged }, "resourceAuthorizations")}
      readId={readResourceAuthorizationId}
      toggleStatus={(id, active) => controller.updateResourceAuthorizationStatus(id, active)}
    />
  );
}

export function OperationalResourceList({ controller,
  disabled,
  emptyLabel,
  onChanged,
  operationalResources,
  listPageInfo,
}: ListProps & { operationalResources: unknown[] }) {
  return (
    <ManagedOAuthResourceList
      actions={[{ label: "Publish", onAction: (id) => controller.publishOperationalResource(id) }]}
      disabled={disabled}
      emptyLabel={emptyLabel}
      items={operationalResources}
      onChanged={onChanged}
      {...managedListPagination({ controller, disabled, emptyLabel, listPageInfo, onChanged }, "operationalResources")}
      onDelete={(id) => controller.deleteOperationalResource(id)}
      readId={readOperationalResourceId}
      toggleEnabled={(id, enabled) => controller.updateOperationalResource(id, enabled)}
    />
  );
}

export function DiagnosticRunResourceList({
  controller,
  disabled,
  diagnosticRuns,
  emptyLabel,
  listPageInfo,
  onChanged,
}: ListProps & { diagnosticRuns: unknown[] }) {
  if (diagnosticRuns.length === 0) {
    return (
      <>
        <p className="text-sm text-[var(--sdk-color-text-muted)]">{emptyLabel}</p>
        <SdkworkIamListPaginationControls
          {...managedListPagination({ controller, disabled, emptyLabel, listPageInfo, onChanged }, "diagnosticRuns")}
        />
      </>
    );
  }

  return (
    <>
    <ul className="space-y-2">
      {diagnosticRuns.map((item, index) => {
        const diagnosticRunId = readDiagnosticRunId(item);
        return (
          <li
            className="flex flex-wrap items-center justify-between gap-3 rounded-[0.75rem] border border-[var(--sdk-color-border-default)] px-3 py-2 text-sm"
            key={diagnosticRunId || readResourceKey(item, index)}
          >
            <span>{formatResourceLabel(item)}</span>
            <Button
              disabled={disabled || !diagnosticRunId}
              onClick={() => {
                if (!diagnosticRunId) {
                  return;
                }
                void controller.retrieveDiagnosticRun(diagnosticRunId).then(onChanged).catch(onChanged);
              }}
              type="button"
            >
              Retrieve
            </Button>
          </li>
        );
      })}
    </ul>
    <SdkworkIamListPaginationControls
      {...managedListPagination({ controller, disabled, emptyLabel, listPageInfo, onChanged }, "diagnosticRuns")}
    />
    </>
  );
}

export function GrantResourceList({
  controller,
  disabled,
  emptyLabel,
  grants,
  listPageInfo,
  onRevoked,
}: Omit<ListProps, "onChanged"> & { grants: unknown[]; onRevoked: () => void }) {
  return (
    <ManagedOAuthResourceList
      actions={[{
        confirmMessage: "Revoke this OAuth grant? Token lookup will fail immediately per IAM_OAUTH_SPEC §7.",
        label: "Revoke",
        onAction: (id) => controller.revokeGrant(id),
      }]}
      disabled={disabled}
      emptyLabel={emptyLabel}
      items={grants}
      onChanged={onRevoked}
      {...managedListPagination({ controller, disabled, emptyLabel, listPageInfo, onChanged: onRevoked }, "grants")}
      readId={readGrantId}
    />
  );
}

export function AccountLinkResourceList({ accountLinks,
  controller,
  disabled,
  emptyLabel,
  onChanged,
  listPageInfo,
}: ListProps & { accountLinks: unknown[] }) {
  return (
    <ManagedOAuthResourceList
      actions={[
        { label: "Activate", onAction: (id) => controller.updateAccountLink({ accountLinkId: id, status: "active" }) },
        { label: "Suspend", onAction: (id) => controller.updateAccountLink({ accountLinkId: id, status: "suspended" }) },
        {
          confirmMessage: "Revoke this account link? The external subject will no longer bind to the IAM user.",
          label: "Revoke",
          onAction: (id) => controller.updateAccountLink({ accountLinkId: id, status: "revoked" }),
        },
      ]}
      disabled={disabled}
      emptyLabel={emptyLabel}
      items={accountLinks}
      onChanged={onChanged}
      {...managedListPagination({ controller, disabled, emptyLabel, listPageInfo, onChanged }, "accountLinks")}
      readId={readAccountLinkId}
    />
  );
}

export function ProviderCatalogResourceList({ controller,
  disabled,
  emptyLabel,
  onChanged,
  providerCatalog,
  listPageInfo,
}: ListProps & { providerCatalog: unknown[] }) {
  return (
    <ManagedOAuthResourceList
      actions={[{ label: "Retrieve", onAction: (id) => controller.retrieveProviderCatalogEntry(id) }]}
      disabled={disabled}
      emptyLabel={emptyLabel}
      items={providerCatalog}
      onChanged={onChanged}
      {...managedListPagination({ controller, disabled, emptyLabel, listPageInfo, onChanged }, "providerCatalog")}
      readId={readProviderCatalogId}
      toggleStatus={(id, active) => controller.updateProviderCatalogStatus(id, active)}
    />
  );
}
