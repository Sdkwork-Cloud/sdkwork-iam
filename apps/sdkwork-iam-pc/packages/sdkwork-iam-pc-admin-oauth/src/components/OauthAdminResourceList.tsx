import { Button } from "@sdkwork/ui-pc-react";

import type { SdkworkIamOauthAdminController } from "../types/oauth-admin-types";
import { ManagedOAuthResourceList } from "./OauthAdminManagedList";
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
  onChanged: () => void;
};

export function ResourceList({ emptyLabel, items }: { emptyLabel: string; items: unknown[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-[var(--sdk-color-text-muted)]">{emptyLabel}</p>;
  }

  return (
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
  );
}

export function IntegrationResourceList({
  controller,
  disabled,
  emptyLabel,
  integrations,
  onChanged,
}: ListProps & { integrations: unknown[] }) {
  return (
    <ManagedOAuthResourceList
      actions={[{ label: "Retrieve", onAction: (id) => controller.retrieveIntegration(id) }]}
      confirmDeleteMessage="Delete this OAuth integration? Inbound login for the provider will stop for this tenant."
      disabled={disabled}
      emptyLabel={emptyLabel}
      items={integrations}
      onChanged={onChanged}
      onDelete={(id) => controller.deleteIntegration(id)}
      readId={readIntegrationId}
      toggleEnabled={(id, enabled) => controller.updateIntegration(id, enabled)}
    />
  );
}

export function ClientResourceList({
  clients,
  controller,
  disabled,
  emptyLabel,
  onChanged,
}: ListProps & { clients: unknown[] }) {
  return (
    <ManagedOAuthResourceList
      actions={[{ label: "Retrieve", onAction: (id) => controller.retrieveClient(id) }]}
      confirmDeleteMessage="Delete this OAuth client registration?"
      disabled={disabled}
      emptyLabel={emptyLabel}
      items={clients}
      onChanged={onChanged}
      onDelete={(id) => controller.deleteClient(id)}
      readId={readOAuthClientId}
      toggleEnabled={(id, enabled) => controller.updateClient(id, enabled)}
    />
  );
}

export function SecretResourceList({
  controller,
  disabled,
  emptyLabel,
  onChanged,
  secrets,
}: ListProps & { secrets: unknown[] }) {
  return (
    <ManagedOAuthResourceList
      confirmDeleteMessage="Delete this secret reference? Provider authentication may fail until a new secret is registered."
      disabled={disabled}
      emptyLabel={emptyLabel}
      items={secrets}
      onChanged={onChanged}
      onDelete={(id) => controller.deleteSecret(id)}
      readId={readSecretId}
    />
  );
}

export function SurfaceResourceList({
  controller,
  disabled,
  emptyLabel,
  onChanged,
  surfaces,
}: ListProps & { surfaces: unknown[] }) {
  return (
    <ManagedOAuthResourceList
      disabled={disabled}
      emptyLabel={emptyLabel}
      items={surfaces}
      onChanged={onChanged}
      onDelete={(id) => controller.deleteSurface(id)}
      readId={readSurfaceId}
      toggleEnabled={(id, enabled) => controller.updateSurface(id, enabled)}
    />
  );
}

export function FlowConfigResourceList({
  controller,
  disabled,
  emptyLabel,
  flowConfigs,
  onChanged,
}: ListProps & { flowConfigs: unknown[] }) {
  return (
    <ManagedOAuthResourceList
      disabled={disabled}
      emptyLabel={emptyLabel}
      items={flowConfigs}
      onChanged={onChanged}
      readId={readFlowConfigId}
      toggleEnabled={(id, enabled) => controller.updateFlowConfig(id, enabled)}
    />
  );
}

export function ScopeProfileResourceList({
  controller,
  disabled,
  emptyLabel,
  onChanged,
  scopeProfiles,
}: ListProps & { scopeProfiles: unknown[] }) {
  return (
    <ManagedOAuthResourceList
      disabled={disabled}
      emptyLabel={emptyLabel}
      items={scopeProfiles}
      onChanged={onChanged}
      readId={readScopeProfileId}
      toggleStatus={(id, active) => controller.updateScopeProfileStatus(id, active)}
    />
  );
}

export function ClaimMappingResourceList({
  claimMappings,
  controller,
  disabled,
  emptyLabel,
  onChanged,
}: ListProps & { claimMappings: unknown[] }) {
  return (
    <ManagedOAuthResourceList
      disabled={disabled}
      emptyLabel={emptyLabel}
      items={claimMappings}
      onChanged={onChanged}
      readId={readClaimMappingId}
      toggleStatus={(id, active) => controller.updateClaimMappingStatus(id, active)}
    />
  );
}

export function WebhookConfigResourceList({
  controller,
  disabled,
  emptyLabel,
  onChanged,
  webhookConfigs,
}: ListProps & { webhookConfigs: unknown[] }) {
  return (
    <ManagedOAuthResourceList
      actions={[{ label: "Verify", onAction: (id) => controller.runWebhookVerification(id) }]}
      disabled={disabled}
      emptyLabel={emptyLabel}
      items={webhookConfigs}
      onChanged={onChanged}
      readId={readWebhookConfigId}
      toggleEnabled={(id, enabled) => controller.updateWebhookConfig(id, enabled)}
    />
  );
}

export function PolicyResourceList({
  controller,
  disabled,
  emptyLabel,
  onChanged,
  policies,
}: ListProps & { policies: unknown[] }) {
  return (
    <ManagedOAuthResourceList
      disabled={disabled}
      emptyLabel={emptyLabel}
      items={policies}
      onChanged={onChanged}
      readId={readPolicyId}
      toggleStatus={(id, active) => controller.updatePolicyStatus(id, active)}
    />
  );
}

export function TenantBindingResourceList({
  controller,
  disabled,
  emptyLabel,
  onChanged,
  tenantBindings,
}: ListProps & { tenantBindings: unknown[] }) {
  return (
    <ManagedOAuthResourceList
      disabled={disabled}
      emptyLabel={emptyLabel}
      items={tenantBindings}
      onChanged={onChanged}
      readId={readTenantBindingId}
      toggleStatus={(id, active) => controller.updateTenantBindingStatus(id, active)}
    />
  );
}

export function OperatorPlatformResourceList({
  controller,
  disabled,
  emptyLabel,
  onChanged,
  operatorPlatforms,
}: ListProps & { operatorPlatforms: unknown[] }) {
  return (
    <ManagedOAuthResourceList
      actions={[{ label: "Pre-auth", onAction: (id) => controller.runOperatorPlatformPreAuthorization(id) }]}
      disabled={disabled}
      emptyLabel={emptyLabel}
      items={operatorPlatforms}
      onChanged={onChanged}
      readId={readOperatorPlatformId}
      toggleEnabled={(id, enabled) => controller.updateOperatorPlatform(id, enabled)}
    />
  );
}

export function ResourceAccountResourceList({
  controller,
  disabled,
  emptyLabel,
  onChanged,
  resourceAccounts,
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
      readId={readResourceAccountId}
      toggleEnabled={(id, enabled) => controller.updateResourceAccount(id, enabled)}
    />
  );
}

export function ResourceAuthorizationResourceList({
  controller,
  disabled,
  emptyLabel,
  onChanged,
  resourceAuthorizations,
}: ListProps & { resourceAuthorizations: unknown[] }) {
  return (
    <ManagedOAuthResourceList
      disabled={disabled}
      emptyLabel={emptyLabel}
      items={resourceAuthorizations}
      onChanged={onChanged}
      readId={readResourceAuthorizationId}
      toggleStatus={(id, active) => controller.updateResourceAuthorizationStatus(id, active)}
    />
  );
}

export function OperationalResourceList({
  controller,
  disabled,
  emptyLabel,
  onChanged,
  operationalResources,
}: ListProps & { operationalResources: unknown[] }) {
  return (
    <ManagedOAuthResourceList
      actions={[{ label: "Publish", onAction: (id) => controller.publishOperationalResource(id) }]}
      disabled={disabled}
      emptyLabel={emptyLabel}
      items={operationalResources}
      onChanged={onChanged}
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
  onChanged,
}: ListProps & { diagnosticRuns: unknown[] }) {
  if (diagnosticRuns.length === 0) {
    return <p className="text-sm text-[var(--sdk-color-text-muted)]">{emptyLabel}</p>;
  }

  return (
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
  );
}

export function GrantResourceList({
  controller,
  disabled,
  emptyLabel,
  grants,
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
      readId={readGrantId}
    />
  );
}

export function AccountLinkResourceList({
  accountLinks,
  controller,
  disabled,
  emptyLabel,
  onChanged,
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
      readId={readAccountLinkId}
    />
  );
}

export function ProviderCatalogResourceList({
  controller,
  disabled,
  emptyLabel,
  onChanged,
  providerCatalog,
}: ListProps & { providerCatalog: unknown[] }) {
  return (
    <ManagedOAuthResourceList
      actions={[{ label: "Retrieve", onAction: (id) => controller.retrieveProviderCatalogEntry(id) }]}
      disabled={disabled}
      emptyLabel={emptyLabel}
      items={providerCatalog}
      onChanged={onChanged}
      readId={readProviderCatalogId}
      toggleStatus={(id, active) => controller.updateProviderCatalogStatus(id, active)}
    />
  );
}
