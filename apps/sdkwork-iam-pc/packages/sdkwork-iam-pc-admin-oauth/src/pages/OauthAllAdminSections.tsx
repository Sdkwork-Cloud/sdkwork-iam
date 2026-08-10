import { StatusNotice } from "@sdkwork/ui-pc-react";

import type { SdkworkIamOauthAdminPageProps } from "../types/oauth-admin-types";
import { useOauthAdminPageState } from "../hooks/use-oauth-admin-page-state";
import { OauthResourceDetailBlock } from "../components/oauth-admin-ui";
import {
  OauthClientSection,
  OauthIntegrationSection,
  OauthProviderCatalogSection,
  OauthSecretSection,
} from "../components/oauth-inbound-sections";
import {
  OauthClaimMappingSection,
  OauthFlowConfigSection,
  OauthScopeProfileSection,
  OauthSurfaceSection,
  OauthWebhookConfigSection,
} from "../components/oauth-login-sections";
import {
  OauthOperationalResourceSection,
  OauthOperatorPlatformSection,
  OauthPolicySection,
  OauthResourceAccountSection,
  OauthResourceAuthorizationSection,
  OauthTenantBindingSection,
} from "../components/oauth-extended-sections";
import {
  OauthAccountLinkSection,
  OauthGrantSection,
  OauthRelyingPartySection,
} from "../components/oauth-provider-sections";
import {
  OauthCallbackEventSection,
  OauthDiagnosticRunSection,
} from "../components/oauth-activity-sections";

/**
 * Complete OAuth administration surface (all section groups), used when the
 * settings entry is rendered without a `view` or `tab` selector.
 */
export function OauthAllAdminSections(
{
  controller,
}: SdkworkIamOauthAdminPageProps) {
  const { data, diagnosticDetail, disabled, error, listPageInfo, resourceDetail, status, sync } =
    useOauthAdminPageState(controller, [
      "integrations",
      "providerCatalog",
      "clients",
      "secrets",
      "scopeProfiles",
      "claimMappings",
      "webhookConfigs",
      "flowConfigs",
      "surfaces",
      "policies",
      "tenantBindings",
      "operatorPlatforms",
      "resourceAccounts",
      "resourceAuthorizations",
      "operationalResources",
      "accountLinks",
      "grants",
      "diagnosticRuns",
      "callbackEvents",
    ]);
  return (
    <div className="flex h-full min-h-0 flex-col gap-6 overflow-y-auto">
      {error ? <StatusNotice tone="danger">{error}</StatusNotice> : null}
      {resourceDetail ? (
        <OauthResourceDetailBlock detail={resourceDetail.detail} label={resourceDetail.label} />
      ) : null}
      <OauthIntegrationSection
        controller={controller}
        disabled={disabled}
        integrations={data.integrations}
        listPageInfo={listPageInfo}
        onChanged={sync}
        status={status}
      />
      <OauthProviderCatalogSection
        controller={controller}
        disabled={disabled}
        listPageInfo={listPageInfo}
        onChanged={sync}
        providerCatalog={data.providerCatalog}
        status={status}
      />
      <OauthRelyingPartySection controller={controller} disabled={disabled} status={status} />
      <OauthClientSection
        clients={data.clients}
        controller={controller}
        disabled={disabled}
        listPageInfo={listPageInfo}
        onChanged={sync}
        status={status}
      />
      <OauthSecretSection
        controller={controller}
        disabled={disabled}
        listPageInfo={listPageInfo}
        onChanged={sync}
        secrets={data.secrets}
        status={status}
      />
      <OauthScopeProfileSection
        controller={controller}
        disabled={disabled}
        listPageInfo={listPageInfo}
        onChanged={sync}
        scopeProfiles={data.scopeProfiles}
        status={status}
      />
      <OauthClaimMappingSection
        claimMappings={data.claimMappings}
        controller={controller}
        disabled={disabled}
        listPageInfo={listPageInfo}
        onChanged={sync}
        status={status}
      />
      <OauthWebhookConfigSection
        controller={controller}
        disabled={disabled}
        listPageInfo={listPageInfo}
        onChanged={sync}
        resourceAccounts={data.resourceAccounts}
        status={status}
        webhookConfigs={data.webhookConfigs}
      />
      <OauthFlowConfigSection
        controller={controller}
        disabled={disabled}
        flowConfigs={data.flowConfigs}
        listPageInfo={listPageInfo}
        onChanged={sync}
        status={status}
      />
      <OauthSurfaceSection
        controller={controller}
        disabled={disabled}
        listPageInfo={listPageInfo}
        onChanged={sync}
        status={status}
        surfaces={data.surfaces}
      />
      <OauthPolicySection
        controller={controller}
        disabled={disabled}
        listPageInfo={listPageInfo}
        onChanged={sync}
        policies={data.policies}
        status={status}
      />
      <OauthTenantBindingSection
        controller={controller}
        disabled={disabled}
        listPageInfo={listPageInfo}
        onChanged={sync}
        status={status}
        tenantBindings={data.tenantBindings}
      />
      <OauthOperatorPlatformSection
        controller={controller}
        disabled={disabled}
        listPageInfo={listPageInfo}
        onChanged={sync}
        operatorPlatforms={data.operatorPlatforms}
        status={status}
      />
      <OauthResourceAccountSection
        controller={controller}
        disabled={disabled}
        listPageInfo={listPageInfo}
        onChanged={sync}
        resourceAccounts={data.resourceAccounts}
        status={status}
      />
      <OauthResourceAuthorizationSection
        controller={controller}
        disabled={disabled}
        listPageInfo={listPageInfo}
        onChanged={sync}
        resourceAuthorizations={data.resourceAuthorizations}
        status={status}
      />
      <OauthOperationalResourceSection
        controller={controller}
        disabled={disabled}
        listPageInfo={listPageInfo}
        onChanged={sync}
        operationalResources={data.operationalResources}
        status={status}
      />
      <OauthAccountLinkSection
        accountLinks={data.accountLinks}
        controller={controller}
        disabled={disabled}
        listPageInfo={listPageInfo}
        onChanged={sync}
      />
      <OauthGrantSection
        controller={controller}
        disabled={disabled}
        grants={data.grants}
        listPageInfo={listPageInfo}
        onRevoked={sync}
      />
      <OauthDiagnosticRunSection
        controller={controller}
        diagnosticDetail={diagnosticDetail}
        disabled={disabled}
        diagnosticRuns={data.diagnosticRuns}
        listPageInfo={listPageInfo}
        onChanged={sync}
        status={status}
      />
      <OauthCallbackEventSection
        callbackEvents={data.callbackEvents}
        controller={controller}
        disabled={disabled}
        listPageInfo={listPageInfo}
        onChanged={sync}
      />
    </div>
  );
}