import { useState } from "react";
import {
  Button,
  DataTable,
  type DataTableColumn,
} from "@sdkwork/ui-pc-react";
import type { SdkWorkPageInfo } from "@sdkwork/iam-contracts";

import type {
  SdkworkIamOauthAdminController,
  SdkworkIamOauthAdminResourceSnapshot,
} from "../types/oauth-admin-types";
import type { SdkworkIamOauthAdminMessages } from "../types/oauth-admin-messages";
import { ManagedOAuthResourceList } from "./OauthAdminManagedList";
import { CatalogPagination } from "@sdkwork/iam-pc-admin-core";
import { useSdkworkIamOauthAdminMessages } from "../i18n";
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
    onPageChange: (page: number, pageSize: number) =>
      props.controller.listPageResource(resourceKey, { page, page_size: pageSize }).then(() => props.onChanged()),
    onPageSizeChange: (pageSize: number) =>
      props.controller.listPageResource(resourceKey, { page: 1, page_size: pageSize }).then(() => props.onChanged()),
    pageInfo: props.listPageInfo?.[resourceKey],
  };
}

export function ResourceList({
  emptyLabel,
  items,
  listPageInfo,
  onPageChange,
  onPageSizeChange,
}: {
  emptyLabel: string;
  items: unknown[];
  listPageInfo?: SdkWorkPageInfo;
  onPageChange?: (page: number, pageSize: number) => void | Promise<void>;
  onPageSizeChange?: (pageSize: number) => void | Promise<void>;
}) {
  const messages = useSdkworkIamOauthAdminMessages();
  const columns = buildColumns(messages);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  return (
    <DataTable
      columns={columns}
      emptyDescription={emptyLabel}
      emptyTitle={messages.common.noResourcesFound}
      footer={(
        <CatalogPagination
          busy={false}
          copy={{
            next: messages.pagination.next,
            pageSize: messages.pagination.pageSize,
            previous: messages.pagination.previous,
            total: messages.pagination.total,
          }}
          onPageChange={(nextPage) => {
            setPage(nextPage);
            void onPageChange?.(nextPage, pageSize);
          }}
          onPageSizeChange={(nextPageSize) => {
            setPageSize(nextPageSize);
            setPage(1);
            void onPageSizeChange?.(nextPageSize);
          }}
          pageInfo={listPageInfo}
        />
      )}
      getRowId={(item, index) => readResourceKey(item, index)}
      rows={items}
      slotProps={{
        surface: { className: "flex min-h-0 flex-1 flex-col" },
        viewport: { className: "min-h-0 flex-1 max-h-[24rem]" },
        footer: { className: "shrink-0" },
      }}
      stickyHeader
    />
  );
}

function buildColumns(
  messages: SdkworkIamOauthAdminMessages,
): DataTableColumn<unknown>[] {
  const labelCopy = {
    disabled: messages.common.disabled,
    enabled: messages.common.enabled,
    resource: messages.common.resource,
    statuses: messages.common.statuses,
  };
  return [
    {
      cell: (item) => formatResourceLabel(item, labelCopy),
      header: messages.common.resource,
      id: "resource",
    },
  ];
}

export function IntegrationResourceList({ controller,
  disabled,
  emptyLabel,
  integrations,
  onChanged,
  listPageInfo,
}: ListProps & { integrations: unknown[] }) {
  const messages = useSdkworkIamOauthAdminMessages();
  return (
    <ManagedOAuthResourceList
      actions={[{ label: messages.integrations.retrieve, onAction: (id) => controller.retrieveIntegration(id) }]}
      confirmDeleteMessage={messages.integrations.deleteConfirm}
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
  const messages = useSdkworkIamOauthAdminMessages();
  return (
    <ManagedOAuthResourceList
      actions={[{ label: messages.clients.retrieve, onAction: (id) => controller.retrieveClient(id) }]}
      confirmDeleteMessage={messages.clients.deleteConfirm}
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
  const messages = useSdkworkIamOauthAdminMessages();
  return (
    <ManagedOAuthResourceList
      confirmDeleteMessage={messages.secrets.deleteConfirm}
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
  const messages = useSdkworkIamOauthAdminMessages();
  return (
    <ManagedOAuthResourceList
      actions={[{ label: messages.webhookConfigs.verify, onAction: (id) => controller.runWebhookVerification(id) }]}
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
  const messages = useSdkworkIamOauthAdminMessages();
  return (
    <ManagedOAuthResourceList
      actions={[{ label: messages.operatorPlatforms.preAuthorize, onAction: (id) => controller.runOperatorPlatformPreAuthorization(id) }]}
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
  const messages = useSdkworkIamOauthAdminMessages();
  return (
    <ManagedOAuthResourceList
      actions={[
        { label: messages.resourceAccounts.verify, onAction: (id) => controller.runResourceAccountVerification(id) },
        { label: messages.resourceAccounts.refreshAuth, onAction: (id) => controller.runResourceAccountAuthorizationRefresh(id) },
        { label: messages.resourceAccounts.miniLoginCheck, onAction: (id) => controller.runResourceAccountMiniProgramLoginCheck(id) },
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
  const messages = useSdkworkIamOauthAdminMessages();
  return (
    <ManagedOAuthResourceList
      actions={[{ label: messages.operationalResources.publish, onAction: (id) => controller.publishOperationalResource(id) }]}
      confirmDeleteMessage={messages.operationalResources.deleteConfirm}
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
  const messages = useSdkworkIamOauthAdminMessages();
  const columns = buildColumns(messages);
  const [pageSize, setPageSize] = useState(20);
  const pagination = managedListPagination({ controller, disabled, emptyLabel, listPageInfo, onChanged }, "diagnosticRuns");
  return (
    <DataTable
      columns={columns}
      emptyDescription={emptyLabel}
      emptyTitle={messages.diagnosticRuns.emptyTitle}
      footer={(
        <CatalogPagination
          busy={disabled}
          copy={{
            next: messages.pagination.next,
            pageSize: messages.pagination.pageSize,
            previous: messages.pagination.previous,
            total: messages.pagination.total,
          }}
          onPageChange={(page) => pagination.onPageChange(page, pageSize)}
          onPageSizeChange={(nextPageSize) => {
            setPageSize(nextPageSize);
            pagination.onPageSizeChange(nextPageSize);
          }}
          pageInfo={pagination.pageInfo}
        />
      )}
      getRowId={(item, index) => readDiagnosticRunId(item) || readResourceKey(item, index)}
      loading={disabled}
      rowActions={(item) => {
        const diagnosticRunId = readDiagnosticRunId(item);
        return (
          <Button
            disabled={disabled || !diagnosticRunId}
            onClick={() => {
              if (diagnosticRunId) {
                void controller.retrieveDiagnosticRun(diagnosticRunId).then(onChanged).catch(onChanged);
              }
            }}
            size="sm"
            type="button"
            variant="outline"
          >
            {messages.diagnosticRuns.retrieve}
          </Button>
        );
      }}
      rows={diagnosticRuns}
      slotProps={{
        surface: { className: "flex min-h-0 flex-1 flex-col" },
        viewport: { className: "min-h-0 flex-1" },
        footer: { className: "shrink-0" },
      }}
      stickyHeader
    />
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
  const messages = useSdkworkIamOauthAdminMessages();
  return (
    <ManagedOAuthResourceList
      actions={[{
        confirmMessage: messages.grants.revokeConfirm,
        label: messages.grants.revoke,
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
  const messages = useSdkworkIamOauthAdminMessages();
  return (
    <ManagedOAuthResourceList
      actions={[
        { label: messages.accountLinks.activate, onAction: (id) => controller.updateAccountLink({ accountLinkId: id, status: "active" }) },
        { label: messages.accountLinks.suspend, onAction: (id) => controller.updateAccountLink({ accountLinkId: id, status: "suspended" }) },
        {
          confirmMessage: messages.accountLinks.revokeConfirm,
          label: messages.accountLinks.revoke,
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
  const messages = useSdkworkIamOauthAdminMessages();
  return (
    <ManagedOAuthResourceList
      actions={[{ label: messages.providerCatalog.retrieve, onAction: (id) => controller.retrieveProviderCatalogEntry(id) }]}
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
