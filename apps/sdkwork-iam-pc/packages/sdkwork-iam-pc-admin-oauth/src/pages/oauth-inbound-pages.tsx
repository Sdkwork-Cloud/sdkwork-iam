
import type {
  SdkworkIamOauthAdminPageProps,
} from "../types/oauth-admin-types";
import { useOauthAdminPageState } from "../hooks/use-oauth-admin-page-state";
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
import { OauthRelyingPartySection } from "../components/oauth-provider-sections";
import { OauthPageStatus } from "../components/oauth-admin-ui";



export function OauthInboundAdminPage({ controller }: SdkworkIamOauthAdminPageProps) {
  const { data, disabled, error, listPageInfo, resourceDetail, status, sync } = useOauthAdminPageState(controller, [
    "integrations",
    "providerCatalog",
    "clients",
    "secrets",
    "scopeProfiles",
    "claimMappings",
    "webhookConfigs",
    "flowConfigs",
    "surfaces",
  ]);
  return (
    <div className="flex h-full min-h-0 flex-col gap-6 overflow-y-auto">
      <OauthPageStatus error={error} resourceDetail={resourceDetail} />
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
    </div>
  );
}

export function OauthProvidersAdminPage({ controller }: SdkworkIamOauthAdminPageProps) {
  const { data, disabled, error, listPageInfo, resourceDetail, status, sync } = useOauthAdminPageState(controller, [
    "integrations",
    "providerCatalog",
  ]);
  return (
    <div className="flex h-full min-h-0 flex-col gap-6 overflow-y-auto">
      <OauthPageStatus error={error} resourceDetail={resourceDetail} />
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
    </div>
  );
}

export function OauthApplicationsAdminPage({ controller }: SdkworkIamOauthAdminPageProps) {
  const { data, disabled, error, listPageInfo, resourceDetail, status, sync } = useOauthAdminPageState(controller, [
    "clients",
    "secrets",
  ]);
  return (
    <div className="flex h-full min-h-0 flex-col gap-6 overflow-y-auto">
      <OauthPageStatus error={error} resourceDetail={resourceDetail} />
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
    </div>
  );
}

export function OauthLoginConfigurationAdminPage({ controller }: SdkworkIamOauthAdminPageProps) {
  const { data, disabled, error, listPageInfo, resourceDetail, status, sync } = useOauthAdminPageState(controller, [
    "scopeProfiles",
    "claimMappings",
    "flowConfigs",
    "surfaces",
  ]);
  return (
    <div className="flex h-full min-h-0 flex-col gap-6 overflow-y-auto">
      <OauthPageStatus error={error} resourceDetail={resourceDetail} />
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
    </div>
  );
}
