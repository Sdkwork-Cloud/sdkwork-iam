import { useEffect, useState } from "react";
import {
  Button,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  Label,
  SettingsSection,
  StatusNotice,
} from "@sdkwork/ui-pc-react";
import type { ReactNode } from "react";

import type {
  SdkworkIamOauthAdminController,
  SdkworkIamOauthAdminResourceSnapshot,
  SdkworkIamOauthAdminSettingsProps,
  SdkworkIamOauthAdminView,
  SdkworkIamOauthClaimMappingDraft,
  SdkworkIamOauthClientDraft,
  SdkworkIamOauthDiagnosticRunDraft,
  SdkworkIamOauthFlowConfigDraft,
  SdkworkIamOauthIntegrationDraft,
  SdkworkIamOauthOperationalResourceDraft,
  SdkworkIamOauthOperatorPlatformDraft,
  SdkworkIamOauthPolicyDraft,
  SdkworkIamOauthProviderCatalogDraft,
  SdkworkIamOauthRelyingPartyDraft,
  SdkworkIamOauthResourceAccountDraft,
  SdkworkIamOauthResourceAuthorizationDraft,
  SdkworkIamOauthScopeProfileDraft,
  SdkworkIamOauthSecretDraft,
  SdkworkIamOauthSurfaceDraft,
  SdkworkIamOauthTenantBindingDraft,
  SdkworkIamOauthWebhookConfigDraft,
} from "../types/oauth-admin-types";
import {
  AccountLinkResourceList,
  ClaimMappingResourceList,
  ClientResourceList,
  DiagnosticRunResourceList,
  FlowConfigResourceList,
  GrantResourceList,
  IntegrationResourceList,
  OperatorPlatformResourceList,
  OperationalResourceList,
  PolicyResourceList,
  ProviderCatalogResourceList,
  ResourceAccountResourceList,
  ResourceAuthorizationResourceList,
  ResourceList,
  ScopeProfileResourceList,
  SecretResourceList,
  SurfaceResourceList,
  TenantBindingResourceList,
  WebhookConfigResourceList,
} from "../components/OauthAdminResourceList";
import {
  canSubmitClaimMapping,
  canSubmitClient,
  canSubmitDiagnosticRun,
  canSubmitFlowConfig,
  canSubmitIntegration,
  canSubmitOperationalResource,
  canSubmitOperatorPlatform,
  canSubmitPolicy,
  canSubmitProviderCatalog,
  canSubmitRelyingParty,
  canSubmitResourceAccount,
  canSubmitResourceAuthorization,
  canSubmitScopeProfile,
  canSubmitSecret,
  canSubmitSurface,
  canSubmitTenantBinding,
  canSubmitWebhookConfig,
  extractProviderCodes,
  formatResourceDetail,
} from "../utils/oauth-admin-utils";

const OAUTH_VIEW_RESOURCE_KEYS: Readonly<Record<
  SdkworkIamOauthAdminView,
  readonly (keyof SdkworkIamOauthAdminResourceSnapshot)[]
>> = {
  activity: ["webhookConfigs", "diagnosticRuns", "callbackEvents"],
  applications: ["clients", "secrets"],
  authorizations: ["accountLinks", "grants"],
  governance: ["policies", "tenantBindings"],
  "login-configuration": ["scopeProfiles", "claimMappings", "flowConfigs", "surfaces"],
  providers: ["integrations", "providerCatalog"],
  resources: ["operatorPlatforms", "resourceAccounts", "resourceAuthorizations", "operationalResources"],
};

export function SdkworkIamOauthAdminSettings({
  controller,
  description = "Configure OAuth provider integrations and login surfaces for this tenant application.",
  tab,
  title = "OAuth integrations",
  view,
}: SdkworkIamOauthAdminSettingsProps) {
  const [integrations, setIntegrations] = useState<unknown[]>(controller.getState().integrations);
  const [providerCatalog, setProviderCatalog] = useState<unknown[]>(controller.getState().providerCatalog);
  const [clients, setClients] = useState<unknown[]>(controller.getState().clients);
  const [secrets, setSecrets] = useState<unknown[]>(controller.getState().secrets);
  const [scopeProfiles, setScopeProfiles] = useState<unknown[]>(controller.getState().scopeProfiles);
  const [policies, setPolicies] = useState<unknown[]>(controller.getState().policies);
  const [tenantBindings, setTenantBindings] = useState<unknown[]>(controller.getState().tenantBindings);
  const [operatorPlatforms, setOperatorPlatforms] = useState<unknown[]>(controller.getState().operatorPlatforms);
  const [diagnosticRuns, setDiagnosticRuns] = useState<unknown[]>(controller.getState().diagnosticRuns);
  const [claimMappings, setClaimMappings] = useState<unknown[]>(controller.getState().claimMappings);
  const [webhookConfigs, setWebhookConfigs] = useState<unknown[]>(controller.getState().webhookConfigs);
  const [flowConfigs, setFlowConfigs] = useState<unknown[]>(controller.getState().flowConfigs);
  const [surfaces, setSurfaces] = useState<unknown[]>(controller.getState().surfaces);
  const [resourceAccounts, setResourceAccounts] = useState<unknown[]>(controller.getState().resourceAccounts);
  const [resourceAuthorizations, setResourceAuthorizations] = useState<unknown[]>(controller.getState().resourceAuthorizations);
  const [accountLinks, setAccountLinks] = useState<unknown[]>(controller.getState().accountLinks);
  const [grants, setGrants] = useState<unknown[]>(controller.getState().grants);
  const [callbackEvents, setCallbackEvents] = useState<unknown[]>(controller.getState().callbackEvents);
  const [operationalResources, setOperationalResources] = useState<unknown[]>(controller.getState().operationalResources);
  const [listPageInfo, setListPageInfo] = useState(controller.getState().listPageInfo);
  const [status, setStatus] = useState(controller.getState().status);
  const [error, setError] = useState<string | undefined>(controller.getState().lastError);
  const [diagnosticDetail, setDiagnosticDetail] = useState<unknown | undefined>(
    controller.getState().lastDiagnosticRunDetail,
  );
  const [resourceDetail, setResourceDetail] = useState(controller.getState().lastResourceDetail);
  const catalogProviderCodes = extractProviderCodes(providerCatalog);
  const [integrationDraft, setIntegrationDraft] = useState<SdkworkIamOauthIntegrationDraft>({
    displayName: "",
    integrationCode: "",
    providerCode: "",
  });
  const [providerCatalogDraft, setProviderCatalogDraft] = useState<SdkworkIamOauthProviderCatalogDraft>({
    providerCode: "",
    providerDisplayName: "",
    providerName: "",
  });
  const [clientDraft, setClientDraft] = useState<SdkworkIamOauthClientDraft>({
    clientCode: "",
    displayName: "",
    integrationId: "",
    providerClientId: "",
    providerCode: "",
    providerTenantId: "",
  });
  const [secretDraft, setSecretDraft] = useState<SdkworkIamOauthSecretDraft>({
    secretKind: "client_secret",
    secretOwnerId: "",
    secretOwnerKind: "oauth_client",
    secretRef: "",
  });
  const [scopeProfileDraft, setScopeProfileDraft] = useState<SdkworkIamOauthScopeProfileDraft>({
    displayName: "",
    integrationId: "",
    providerCode: "",
    purpose: "login",
    scopeProfileCode: "",
  });
  const [policyDraft, setPolicyDraft] = useState<SdkworkIamOauthPolicyDraft>({
    displayName: "",
    integrationId: "",
    policyCode: "",
  });
  const [tenantBindingDraft, setTenantBindingDraft] = useState<SdkworkIamOauthTenantBindingDraft>({
    bindingKind: "tenant_map",
    integrationId: "",
    providerCode: "",
  });
  const [operatorPlatformDraft, setOperatorPlatformDraft] = useState<SdkworkIamOauthOperatorPlatformDraft>({
    displayName: "",
    integrationId: "",
    operatorMode: "third_party",
    platformCode: "",
    providerCode: "",
    providerPlatformId: "",
  });
  const [diagnosticRunDraft, setDiagnosticRunDraft] = useState<SdkworkIamOauthDiagnosticRunDraft>({
    integrationId: "",
    providerCode: "",
    runKind: "manual",
  });
  const [claimMappingDraft, setClaimMappingDraft] = useState<SdkworkIamOauthClaimMappingDraft>({
    externalClaim: "",
    integrationId: "",
    providerCode: "",
    targetField: "",
    targetKind: "profile",
  });
  const [webhookConfigDraft, setWebhookConfigDraft] = useState<SdkworkIamOauthWebhookConfigDraft>({
    callbackUrl: "",
    displayName: "",
    integrationId: "",
    providerCode: "",
    webhookCode: "",
    webhookKind: "provider_callback",
  });
  const [flowConfigDraft, setFlowConfigDraft] = useState<SdkworkIamOauthFlowConfigDraft>({
    flowKind: "authorization_code",
    flowPurpose: "login",
    integrationId: "",
    oauthClientId: "",
  });
  const [surfaceDraft, setSurfaceDraft] = useState<SdkworkIamOauthSurfaceDraft>({
    displayName: "",
    providerCode: "",
    surfaceCode: "",
    surfaceKind: "web",
  });
  const [resourceAccountDraft, setResourceAccountDraft] = useState<SdkworkIamOauthResourceAccountDraft>({
    accessMode: "operator_managed",
    displayName: "",
    integrationId: "",
    providerAccountId: "",
    providerCode: "",
    resourceAccountCode: "",
    resourceAccountKind: "official_account",
  });
  const [resourceAuthorizationDraft, setResourceAuthorizationDraft] = useState<SdkworkIamOauthResourceAuthorizationDraft>({
    authorizationMode: "third_party_platform",
    integrationId: "",
    providerCode: "",
    resourceAccountId: "",
  });
  const [relyingPartyDraft, setRelyingPartyDraft] = useState<SdkworkIamOauthRelyingPartyDraft>({
    allowedScopesText: "openid\nprofile\nemail",
    clientIdHint: "",
    clientSecretHash: "",
    confidential: true,
    enabled: true,
    hasExistingSecret: false,
    redirectUrisText: "",
    tenantApplicationId: "",
    tenantId: "",
  });
  const [operationalResourceDraft, setOperationalResourceDraft] = useState<SdkworkIamOauthOperationalResourceDraft>({
    displayName: "",
    integrationId: "",
    providerCode: "",
    resourceAccountId: "",
    resourceCode: "",
    resourceKind: "mini_program_page",
  });

  useEffect(() => {
    void controller.load(view ? OAUTH_VIEW_RESOURCE_KEYS[view] : undefined).then((result) => {
      setIntegrations(result.integrations);
      setProviderCatalog(result.providerCatalog);
      setClients(result.clients);
      setSecrets(result.secrets);
      setScopeProfiles(result.scopeProfiles);
      setPolicies(result.policies);
      setTenantBindings(result.tenantBindings);
      setOperatorPlatforms(result.operatorPlatforms);
      setDiagnosticRuns(result.diagnosticRuns);
      setClaimMappings(result.claimMappings);
      setWebhookConfigs(result.webhookConfigs);
      setFlowConfigs(result.flowConfigs);
      setSurfaces(result.surfaces);
      setResourceAccounts(result.resourceAccounts);
      setResourceAuthorizations(result.resourceAuthorizations);
      setAccountLinks(result.accountLinks);
      setGrants(result.grants);
      setCallbackEvents(result.callbackEvents);
      setOperationalResources(result.operationalResources);
      setListPageInfo(controller.getState().listPageInfo);
      setStatus(controller.getState().status);
      setError(controller.getState().lastError);
      setDiagnosticDetail(controller.getState().lastDiagnosticRunDetail);
      setResourceDetail(controller.getState().lastResourceDetail);
    }).catch(() => {
      setStatus(controller.getState().status);
      setError(controller.getState().lastError);
    });
  }, [controller, view]);

  const showInbound = !tab || tab === "inbound";
  const showProvider = !tab || tab === "provider";
  const showExtended = !tab || tab === "extended";
  const showAudit = !tab || tab === "audit";
  const showProviderConnections = view ? view === "providers" : showInbound;
  const showApplications = view ? view === "applications" : showInbound;
  const showRelyingParty = view ? view === "applications" : showProvider;
  const showLoginConfiguration = view ? view === "login-configuration" : showInbound;
  const showGovernance = view ? view === "governance" : showExtended;
  const showAuthorizations = view ? view === "authorizations" : showProvider;
  const showResources = view ? view === "resources" : showExtended;
  const showActivityWebhooks = view ? view === "activity" : showInbound;
  const showActivityAudit = view ? view === "activity" : showAudit;
  const listDisabled = status === "loading" || status === "saving";
  const syncLists = () => {
    setIntegrations(controller.getState().integrations);
    setProviderCatalog(controller.getState().providerCatalog);
    setClients(controller.getState().clients);
    setSecrets(controller.getState().secrets);
    setScopeProfiles(controller.getState().scopeProfiles);
    setPolicies(controller.getState().policies);
    setTenantBindings(controller.getState().tenantBindings);
    setOperatorPlatforms(controller.getState().operatorPlatforms);
    setDiagnosticRuns(controller.getState().diagnosticRuns);
    setClaimMappings(controller.getState().claimMappings);
    setWebhookConfigs(controller.getState().webhookConfigs);
    setFlowConfigs(controller.getState().flowConfigs);
    setSurfaces(controller.getState().surfaces);
    setResourceAccounts(controller.getState().resourceAccounts);
    setResourceAuthorizations(controller.getState().resourceAuthorizations);
    setAccountLinks(controller.getState().accountLinks);
    setGrants(controller.getState().grants);
    setCallbackEvents(controller.getState().callbackEvents);
    setOperationalResources(controller.getState().operationalResources);
    setListPageInfo(controller.getState().listPageInfo);
    setStatus(controller.getState().status);
    setError(controller.getState().lastError);
    setDiagnosticDetail(controller.getState().lastDiagnosticRunDetail);
    setResourceDetail(controller.getState().lastResourceDetail);
  };

  return (
    <div className="space-y-6">
      {error ? <StatusNotice tone="danger">{error}</StatusNotice> : null}
      {resourceDetail ? (
        <div className="space-y-2">
          <Label>{resourceDetail.label} detail</Label>
          <pre className="max-h-80 overflow-auto rounded-[0.75rem] border border-[var(--sdk-color-border-default)] bg-[var(--sdk-color-surface-muted)] p-3 text-xs">
            {formatResourceDetail(resourceDetail.detail)}
          </pre>
        </div>
      ) : null}
      {showProviderConnections ? (
      <SettingsSection description={description} title={title}>
        <div className="space-y-3">
          <Label>Configured integrations ({integrations.length})</Label>
          <IntegrationResourceList
            controller={controller}
            listPageInfo={listPageInfo}
            disabled={status === "loading" || status === "saving"}
            emptyLabel="No OAuth integrations configured yet."
            integrations={integrations}
            onChanged={() => {
              setIntegrations(controller.getState().integrations);
              setStatus(controller.getState().status);
              setError(controller.getState().lastError);
            }}
          />
        </div>
        <CreateResourceDrawer description="Register an inbound OAuth provider integration." triggerLabel="Add integration">
          <Label htmlFor="oauth-provider-code">Provider code</Label>
          {catalogProviderCodes.length > 0 ? (
            <select
              className="w-full rounded-[0.75rem] border border-[var(--sdk-color-border-default)] bg-transparent px-3 py-2 text-sm"
              id="oauth-provider-code"
              onChange={(event) => setIntegrationDraft((current) => ({
                ...current,
                providerCode: event.target.value,
              }))}
              value={integrationDraft.providerCode}
            >
              <option value="">Select catalog provider</option>
              {catalogProviderCodes.map((providerCode) => (
                <option key={providerCode} value={providerCode}>{providerCode}</option>
              ))}
            </select>
          ) : (
            <input
              className="w-full rounded-[0.75rem] border border-[var(--sdk-color-border-default)] bg-transparent px-3 py-2 text-sm"
              id="oauth-provider-code"
              onChange={(event) => setIntegrationDraft((current) => ({
                ...current,
                providerCode: event.target.value,
              }))}
              placeholder="wechat, google, github"
              value={integrationDraft.providerCode}
            />
          )}
          <Label htmlFor="oauth-integration-code">Integration code</Label>
          <input
            className="w-full rounded-[0.75rem] border border-[var(--sdk-color-border-default)] bg-transparent px-3 py-2 text-sm"
            id="oauth-integration-code"
            onChange={(event) => setIntegrationDraft((current) => ({
              ...current,
              integrationCode: event.target.value,
            }))}
            placeholder="default-wechat"
            value={integrationDraft.integrationCode}
          />
          <Label htmlFor="oauth-integration-name">Display name</Label>
          <input
            className="w-full rounded-[0.75rem] border border-[var(--sdk-color-border-default)] bg-transparent px-3 py-2 text-sm"
            id="oauth-integration-name"
            onChange={(event) => setIntegrationDraft((current) => ({
              ...current,
              displayName: event.target.value,
            }))}
            placeholder="WeChat login"
            value={integrationDraft.displayName}
          />
          <Button
            disabled={status === "loading" || status === "saving" || !canSubmitIntegration(integrationDraft)}
            loading={status === "saving"}
            onClick={() => {
              void controller.createIntegration(integrationDraft).then(() => {
                setIntegrations(controller.getState().integrations);
                setStatus(controller.getState().status);
                setError(controller.getState().lastError);
                setIntegrationDraft({ displayName: "", integrationCode: "", providerCode: "" });
              }).catch(() => {
                setStatus(controller.getState().status);
                setError(controller.getState().lastError);
              });
            }}
            type="button"
          >
            Add integration
          </Button>
        </CreateResourceDrawer>
      </SettingsSection>
      ) : null}

      {showProviderConnections ? (
      <SettingsSection
        description="Platform provider catalog entries (including sdkwork) available for tenant integrations. Register custom providers before enabling tenant integrations (IAM_OAUTH_SPEC §2)."
        title="Provider catalog"
      >
        <div className="space-y-3">
          <Label htmlFor="oauth-pc-provider-code">Provider code</Label>
          <input className="w-full rounded-[0.75rem] border border-[var(--sdk-color-border-default)] bg-transparent px-3 py-2 text-sm" id="oauth-pc-provider-code" onChange={(e) => setProviderCatalogDraft((c) => ({ ...c, providerCode: e.target.value }))} placeholder="custom_oidc" value={providerCatalogDraft.providerCode} />
          <Label htmlFor="oauth-pc-provider-name">Provider name</Label>
          <input className="w-full rounded-[0.75rem] border border-[var(--sdk-color-border-default)] bg-transparent px-3 py-2 text-sm" id="oauth-pc-provider-name" onChange={(e) => setProviderCatalogDraft((c) => ({ ...c, providerName: e.target.value }))} placeholder="Custom OIDC" value={providerCatalogDraft.providerName} />
          <Label htmlFor="oauth-pc-provider-display-name">Display name (optional)</Label>
          <input className="w-full rounded-[0.75rem] border border-[var(--sdk-color-border-default)] bg-transparent px-3 py-2 text-sm" id="oauth-pc-provider-display-name" onChange={(e) => setProviderCatalogDraft((c) => ({ ...c, providerDisplayName: e.target.value }))} placeholder="Custom OIDC Provider" value={providerCatalogDraft.providerDisplayName} />
          <Button
            disabled={status === "loading" || status === "saving" || !canSubmitProviderCatalog(providerCatalogDraft)}
            loading={status === "saving"}
            onClick={() => {
              void controller.createProviderCatalog(providerCatalogDraft).then(() => {
                syncLists();
                setStatus(controller.getState().status);
                setError(controller.getState().lastError);
                setProviderCatalogDraft({ providerCode: "", providerDisplayName: "", providerName: "" });
              }).catch(() => {
                setStatus(controller.getState().status);
                setError(controller.getState().lastError);
              });
            }}
            type="button"
          >
            Register catalog provider
          </Button>
          <Label>Catalog providers ({providerCatalog.length})</Label>
          <ProviderCatalogResourceList
            controller={controller}
            listPageInfo={listPageInfo}
            disabled={listDisabled}
            emptyLabel="No provider catalog entries returned."
            onChanged={syncLists}
            providerCatalog={providerCatalog}
          />
        </div>
      </SettingsSection>
      ) : null}

      {showRelyingParty ? (
      <SettingsSection
        description="Register this tenant application as a SDKWork OAuth authorization-server relying party. client_id equals the runtime app_id. Secrets must be stored as argon2id hashes only."
        title="SDKWork OAuth relying party"
      >
        <StatusNotice tone="default">
          Load existing runtimeConfig.oauth.relyingParty via iam.tenantApplications.retrieve, then save updates through iam.tenantApplications.update. Plaintext client secrets are never stored; supply a precomputed argon2id hash for confidential clients. Leave the hash blank on update to preserve the stored hash. Runtime client_id equals the tenant application app_id (IAM_OAUTH_SPEC §4.2).
        </StatusNotice>
        <div className="mt-4 space-y-3">
          <Label htmlFor="oauth-rp-tenant-id">Tenant ID</Label>
          <input className="w-full rounded-[0.75rem] border border-[var(--sdk-color-border-default)] bg-transparent px-3 py-2 text-sm" id="oauth-rp-tenant-id" onChange={(e) => setRelyingPartyDraft((c) => ({ ...c, tenantId: e.target.value }))} placeholder="iamt-..." value={relyingPartyDraft.tenantId} />
          <Label htmlFor="oauth-rp-tenant-app-id">Tenant application ID</Label>
          <input className="w-full rounded-[0.75rem] border border-[var(--sdk-color-border-default)] bg-transparent px-3 py-2 text-sm" id="oauth-rp-tenant-app-id" onChange={(e) => setRelyingPartyDraft((c) => ({ ...c, tenantApplicationId: e.target.value }))} placeholder="iamta-..." value={relyingPartyDraft.tenantApplicationId} />
          {relyingPartyDraft.clientIdHint ? (
            <StatusNotice tone="default">
              OAuth client_id (app_id): {relyingPartyDraft.clientIdHint}
            </StatusNotice>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <Button
              disabled={status === "loading" || status === "saving" || !relyingPartyDraft.tenantId.trim() || !relyingPartyDraft.tenantApplicationId.trim()}
              loading={status === "saving"}
              onClick={() => {
                void controller.loadRelyingPartyConfig(relyingPartyDraft.tenantId, relyingPartyDraft.tenantApplicationId)
                  .then((draft) => {
                    setRelyingPartyDraft(draft);
                    setStatus(controller.getState().status);
                    setError(controller.getState().lastError);
                  })
                  .catch(() => {
                    setStatus(controller.getState().status);
                    setError(controller.getState().lastError);
                  });
              }}
              type="button"
              variant="secondary"
            >
              Load relying party config
            </Button>
          </div>
          <Label htmlFor="oauth-rp-enabled">Enabled</Label>
          <select className="w-full rounded-[0.75rem] border border-[var(--sdk-color-border-default)] bg-transparent px-3 py-2 text-sm" id="oauth-rp-enabled" onChange={(e) => setRelyingPartyDraft((c) => ({ ...c, enabled: e.target.value === "true" }))} value={relyingPartyDraft.enabled ? "true" : "false"}>
            <option value="true">true</option>
            <option value="false">false</option>
          </select>
          <Label htmlFor="oauth-rp-redirect-uris">Redirect URIs (one per line or comma-separated)</Label>
          <textarea className="min-h-[5rem] w-full rounded-[0.75rem] border border-[var(--sdk-color-border-default)] bg-transparent px-3 py-2 text-sm" id="oauth-rp-redirect-uris" onChange={(e) => setRelyingPartyDraft((c) => ({ ...c, redirectUrisText: e.target.value }))} placeholder="https://forum.example.com/auth/oauth/callback" value={relyingPartyDraft.redirectUrisText} />
          <Label htmlFor="oauth-rp-scopes">Allowed scopes</Label>
          <textarea className="min-h-[5rem] w-full rounded-[0.75rem] border border-[var(--sdk-color-border-default)] bg-transparent px-3 py-2 text-sm" id="oauth-rp-scopes" onChange={(e) => setRelyingPartyDraft((c) => ({ ...c, allowedScopesText: e.target.value }))} placeholder={"openid\nprofile\nemail"} value={relyingPartyDraft.allowedScopesText} />
          <Label htmlFor="oauth-rp-confidential">Confidential client</Label>
          <select className="w-full rounded-[0.75rem] border border-[var(--sdk-color-border-default)] bg-transparent px-3 py-2 text-sm" id="oauth-rp-confidential" onChange={(e) => setRelyingPartyDraft((c) => ({ ...c, confidential: e.target.value === "true" }))} value={relyingPartyDraft.confidential ? "true" : "false"}>
            <option value="true">true</option>
            <option value="false">false</option>
          </select>
          {relyingPartyDraft.confidential ? (
            <>
              <Label htmlFor="oauth-rp-secret-hash">Client secret hash (argon2id)</Label>
              <input autoComplete="off" className="w-full rounded-[0.75rem] border border-[var(--sdk-color-border-default)] bg-transparent px-3 py-2 text-sm" id="oauth-rp-secret-hash" onChange={(e) => setRelyingPartyDraft((c) => ({ ...c, clientSecretHash: e.target.value }))} placeholder={relyingPartyDraft.hasExistingSecret ? "Leave blank to preserve stored hash" : undefined} type="password" value={relyingPartyDraft.clientSecretHash} />
              {relyingPartyDraft.hasExistingSecret ? (
                <StatusNotice tone="default">A client secret hash is already configured. Leave this field blank to preserve it.</StatusNotice>
              ) : null}
            </>
          ) : null}
          <Button disabled={status === "loading" || status === "saving" || !canSubmitRelyingParty(relyingPartyDraft)} loading={status === "saving"} onClick={() => { void controller.updateRelyingParty(relyingPartyDraft).then(() => { setStatus(controller.getState().status); setError(controller.getState().lastError); setRelyingPartyDraft((c) => ({ ...c, clientSecretHash: "", hasExistingSecret: c.hasExistingSecret || Boolean(c.clientSecretHash.trim()) })); }).catch(() => { setStatus(controller.getState().status); setError(controller.getState().lastError); }); }} type="button">Save relying party config</Button>
        </div>
      </SettingsSection>
      ) : null}

      {showApplications || showLoginConfiguration || showActivityWebhooks ? (
      <>
      {showApplications ? (
      <>
      <SettingsSection
        description="OAuth clients bind tenant integrations to provider application IDs. Secrets are managed separately and never displayed in plaintext."
        title="OAuth clients"
      >
        <div className="space-y-3">
          <Label>Configured clients ({clients.length})</Label>
          <ClientResourceList
            clients={clients}
            controller={controller}
            disabled={status === "loading" || status === "saving"}
            emptyLabel="No OAuth clients configured yet."
            onChanged={() => {
              setClients(controller.getState().clients);
              setStatus(controller.getState().status);
              setError(controller.getState().lastError);
            }}
          />
        </div>
        <CreateResourceDrawer description="Register an OAuth client for a tenant integration." triggerLabel="Add client">
          <Label htmlFor="oauth-client-integration-id">Integration ID</Label>
          <input
            className="w-full rounded-[0.75rem] border border-[var(--sdk-color-border-default)] bg-transparent px-3 py-2 text-sm"
            id="oauth-client-integration-id"
            onChange={(event) => setClientDraft((current) => ({
              ...current,
              integrationId: event.target.value,
            }))}
            placeholder="iamoi-..."
            value={clientDraft.integrationId}
          />
          <Label htmlFor="oauth-client-provider">Provider code</Label>
          <input
            className="w-full rounded-[0.75rem] border border-[var(--sdk-color-border-default)] bg-transparent px-3 py-2 text-sm"
            id="oauth-client-provider"
            onChange={(event) => setClientDraft((current) => ({
              ...current,
              providerCode: event.target.value,
            }))}
            placeholder="wechat"
            value={clientDraft.providerCode}
          />
          <Label htmlFor="oauth-client-code">Client code</Label>
          <input
            className="w-full rounded-[0.75rem] border border-[var(--sdk-color-border-default)] bg-transparent px-3 py-2 text-sm"
            id="oauth-client-code"
            onChange={(event) => setClientDraft((current) => ({
              ...current,
              clientCode: event.target.value,
            }))}
            placeholder="default-web"
            value={clientDraft.clientCode}
          />
          <Label htmlFor="oauth-client-provider-id">Provider client ID</Label>
          <input
            className="w-full rounded-[0.75rem] border border-[var(--sdk-color-border-default)] bg-transparent px-3 py-2 text-sm"
            id="oauth-client-provider-id"
            onChange={(event) => setClientDraft((current) => ({
              ...current,
              providerClientId: event.target.value,
            }))}
            placeholder="wx1234567890"
            value={clientDraft.providerClientId}
          />
          <Label htmlFor="oauth-client-name">Display name</Label>
          <input
            className="w-full rounded-[0.75rem] border border-[var(--sdk-color-border-default)] bg-transparent px-3 py-2 text-sm"
            id="oauth-client-name"
            onChange={(event) => setClientDraft((current) => ({
              ...current,
              displayName: event.target.value,
            }))}
            placeholder="WeChat web client"
            value={clientDraft.displayName}
          />
          <Label htmlFor="oauth-client-provider-tenant-id">Provider union scope ID (optional)</Label>
          <input
            className="w-full rounded-[0.75rem] border border-[var(--sdk-color-border-default)] bg-transparent px-3 py-2 text-sm"
            id="oauth-client-provider-tenant-id"
            onChange={(event) => setClientDraft((current) => ({
              ...current,
              providerTenantId: event.target.value,
            }))}
            placeholder="WeChat Open Platform account ID"
            value={clientDraft.providerTenantId}
          />
          <Button
            disabled={status === "loading" || status === "saving" || !canSubmitClient(clientDraft)}
            loading={status === "saving"}
            onClick={() => {
              void controller.createClient(clientDraft).then(() => {
                setClients(controller.getState().clients);
                setStatus(controller.getState().status);
                setError(controller.getState().lastError);
                setClientDraft({
                  clientCode: "",
                  displayName: "",
                  integrationId: "",
                  providerClientId: "",
                  providerCode: "",
                  providerTenantId: "",
                });
              }).catch(() => {
                setStatus(controller.getState().status);
                setError(controller.getState().lastError);
              });
            }}
            type="button"
          >
            Add client
          </Button>
        </CreateResourceDrawer>
      </SettingsSection>

      <SettingsSection
        description="Secret references are stored hashed on the server. Plaintext values are never returned after registration."
        title="OAuth secrets"
      >
        <StatusNotice tone="default">
          Provide a vault or KMS secret reference only. Do not paste production secrets into browser devtools or logs.
        </StatusNotice>
        <div className="space-y-3">
          <Label>Registered secrets ({secrets.length})</Label>
          <SecretResourceList
            controller={controller}
            disabled={status === "loading" || status === "saving"}
            emptyLabel="No OAuth secrets registered yet."
            onChanged={() => {
              setSecrets(controller.getState().secrets);
              setStatus(controller.getState().status);
              setError(controller.getState().lastError);
            }}
            secrets={secrets}
          />
        </div>
        <CreateResourceDrawer description="Register a secret reference without exposing plaintext credentials." triggerLabel="Add secret">
          <Label htmlFor="oauth-secret-owner-kind">Secret owner kind</Label>
          <input
            className="w-full rounded-[0.75rem] border border-[var(--sdk-color-border-default)] bg-transparent px-3 py-2 text-sm"
            id="oauth-secret-owner-kind"
            onChange={(event) => setSecretDraft((current) => ({
              ...current,
              secretOwnerKind: event.target.value,
            }))}
            placeholder="oauth_client"
            value={secretDraft.secretOwnerKind}
          />
          <Label htmlFor="oauth-secret-owner-id">Secret owner ID</Label>
          <input
            className="w-full rounded-[0.75rem] border border-[var(--sdk-color-border-default)] bg-transparent px-3 py-2 text-sm"
            id="oauth-secret-owner-id"
            onChange={(event) => setSecretDraft((current) => ({
              ...current,
              secretOwnerId: event.target.value,
            }))}
            placeholder="iamoc-..."
            value={secretDraft.secretOwnerId}
          />
          <Label htmlFor="oauth-secret-kind">Secret kind</Label>
          <input
            className="w-full rounded-[0.75rem] border border-[var(--sdk-color-border-default)] bg-transparent px-3 py-2 text-sm"
            id="oauth-secret-kind"
            onChange={(event) => setSecretDraft((current) => ({
              ...current,
              secretKind: event.target.value,
            }))}
            placeholder="client_secret"
            value={secretDraft.secretKind}
          />
          <Label htmlFor="oauth-secret-ref">Secret reference</Label>
          <input
            autoComplete="off"
            className="w-full rounded-[0.75rem] border border-[var(--sdk-color-border-default)] bg-transparent px-3 py-2 text-sm"
            id="oauth-secret-ref"
            onChange={(event) => setSecretDraft((current) => ({
              ...current,
              secretRef: event.target.value,
            }))}
            placeholder="vault://tenant/oauth/client-secret"
            type="password"
            value={secretDraft.secretRef}
          />
          <Button
            disabled={status === "loading" || status === "saving" || !canSubmitSecret(secretDraft)}
            loading={status === "saving"}
            onClick={() => {
              void controller.createSecret(secretDraft).then(() => {
                setSecrets(controller.getState().secrets);
                setStatus(controller.getState().status);
                setError(controller.getState().lastError);
                setSecretDraft({
                  secretKind: "client_secret",
                  secretOwnerId: "",
                  secretOwnerKind: "oauth_client",
                  secretRef: "",
                });
              }).catch(() => {
                setStatus(controller.getState().status);
                setError(controller.getState().lastError);
              });
            }}
            type="button"
          >
            Register secret reference
          </Button>
        </CreateResourceDrawer>
      </SettingsSection>
      </>
      ) : null}

      {showLoginConfiguration ? (
      <>
      <SettingsSection
        description="Scope profiles define allowed OAuth scopes for provider integrations and SDKWork AS clients."
        title="Scope profiles"
      >
        <div className="space-y-3">
          <Label>Configured scope profiles ({scopeProfiles.length})</Label>
          <ScopeProfileResourceList
            controller={controller}
            listPageInfo={listPageInfo}
            disabled={listDisabled}
            emptyLabel="No OAuth scope profiles configured yet."
            onChanged={syncLists}
            scopeProfiles={scopeProfiles}
          />
        </div>
        <CreateResourceDrawer description="Create a reusable OAuth scope profile." triggerLabel="Add scope profile">
          <Label htmlFor="oauth-scope-integration-id">Integration ID</Label>
          <input
            className="w-full rounded-[0.75rem] border border-[var(--sdk-color-border-default)] bg-transparent px-3 py-2 text-sm"
            id="oauth-scope-integration-id"
            onChange={(event) => setScopeProfileDraft((current) => ({
              ...current,
              integrationId: event.target.value,
            }))}
            placeholder="iamoi-..."
            value={scopeProfileDraft.integrationId}
          />
          <Label htmlFor="oauth-scope-provider">Provider code</Label>
          <input
            className="w-full rounded-[0.75rem] border border-[var(--sdk-color-border-default)] bg-transparent px-3 py-2 text-sm"
            id="oauth-scope-provider"
            onChange={(event) => setScopeProfileDraft((current) => ({
              ...current,
              providerCode: event.target.value,
            }))}
            placeholder="sdkwork"
            value={scopeProfileDraft.providerCode}
          />
          <Label htmlFor="oauth-scope-profile-code">Scope profile code</Label>
          <input
            className="w-full rounded-[0.75rem] border border-[var(--sdk-color-border-default)] bg-transparent px-3 py-2 text-sm"
            id="oauth-scope-profile-code"
            onChange={(event) => setScopeProfileDraft((current) => ({
              ...current,
              scopeProfileCode: event.target.value,
            }))}
            placeholder="default-login"
            value={scopeProfileDraft.scopeProfileCode}
          />
          <Label htmlFor="oauth-scope-purpose">Purpose</Label>
          <input
            className="w-full rounded-[0.75rem] border border-[var(--sdk-color-border-default)] bg-transparent px-3 py-2 text-sm"
            id="oauth-scope-purpose"
            onChange={(event) => setScopeProfileDraft((current) => ({
              ...current,
              purpose: event.target.value,
            }))}
            placeholder="login"
            value={scopeProfileDraft.purpose}
          />
          <Label htmlFor="oauth-scope-name">Display name</Label>
          <input
            className="w-full rounded-[0.75rem] border border-[var(--sdk-color-border-default)] bg-transparent px-3 py-2 text-sm"
            id="oauth-scope-name"
            onChange={(event) => setScopeProfileDraft((current) => ({
              ...current,
              displayName: event.target.value,
            }))}
            placeholder="Default login scopes"
            value={scopeProfileDraft.displayName}
          />
          <Button
            disabled={status === "loading" || status === "saving" || !canSubmitScopeProfile(scopeProfileDraft)}
            loading={status === "saving"}
            onClick={() => {
              void controller.createScopeProfile(scopeProfileDraft).then(() => {
                setScopeProfiles(controller.getState().scopeProfiles);
                setStatus(controller.getState().status);
                setError(controller.getState().lastError);
                setScopeProfileDraft({
                  displayName: "",
                  integrationId: "",
                  providerCode: "",
                  purpose: "login",
                  scopeProfileCode: "",
                });
              }).catch(() => {
                setStatus(controller.getState().status);
                setError(controller.getState().lastError);
              });
            }}
            type="button"
          >
            Add scope profile
          </Button>
        </CreateResourceDrawer>
      </SettingsSection>

      <SettingsSection
        description="Map provider identity claims to IAM profile fields for account binding and login."
        title="Claim mappings"
      >
        <div className="space-y-3">
          <Label>Configured mappings ({claimMappings.length})</Label>
          <ClaimMappingResourceList
            claimMappings={claimMappings}
            controller={controller}
            listPageInfo={listPageInfo}
            disabled={listDisabled}
            emptyLabel="No OAuth claim mappings configured yet."
            onChanged={syncLists}
          />
        </div>
        <CreateResourceDrawer description="Map an external provider claim into the IAM identity model." triggerLabel="Add claim mapping">
          <Label htmlFor="oauth-claim-integration-id">Integration ID</Label>
          <input
            className="w-full rounded-[0.75rem] border border-[var(--sdk-color-border-default)] bg-transparent px-3 py-2 text-sm"
            id="oauth-claim-integration-id"
            onChange={(event) => setClaimMappingDraft((current) => ({
              ...current,
              integrationId: event.target.value,
            }))}
            placeholder="iamoi-..."
            value={claimMappingDraft.integrationId}
          />
          <Label htmlFor="oauth-claim-provider">Provider code</Label>
          <input
            className="w-full rounded-[0.75rem] border border-[var(--sdk-color-border-default)] bg-transparent px-3 py-2 text-sm"
            id="oauth-claim-provider"
            onChange={(event) => setClaimMappingDraft((current) => ({
              ...current,
              providerCode: event.target.value,
            }))}
            placeholder="github"
            value={claimMappingDraft.providerCode}
          />
          <Label htmlFor="oauth-claim-external">External claim</Label>
          <input
            className="w-full rounded-[0.75rem] border border-[var(--sdk-color-border-default)] bg-transparent px-3 py-2 text-sm"
            id="oauth-claim-external"
            onChange={(event) => setClaimMappingDraft((current) => ({
              ...current,
              externalClaim: event.target.value,
            }))}
            placeholder="sub"
            value={claimMappingDraft.externalClaim}
          />
          <Label htmlFor="oauth-claim-target-kind">Target kind</Label>
          <input
            className="w-full rounded-[0.75rem] border border-[var(--sdk-color-border-default)] bg-transparent px-3 py-2 text-sm"
            id="oauth-claim-target-kind"
            onChange={(event) => setClaimMappingDraft((current) => ({
              ...current,
              targetKind: event.target.value,
            }))}
            placeholder="profile"
            value={claimMappingDraft.targetKind}
          />
          <Label htmlFor="oauth-claim-target-field">Target field</Label>
          <input
            className="w-full rounded-[0.75rem] border border-[var(--sdk-color-border-default)] bg-transparent px-3 py-2 text-sm"
            id="oauth-claim-target-field"
            onChange={(event) => setClaimMappingDraft((current) => ({
              ...current,
              targetField: event.target.value,
            }))}
            placeholder="externalSubjectId"
            value={claimMappingDraft.targetField}
          />
          <Button
            disabled={status === "loading" || status === "saving" || !canSubmitClaimMapping(claimMappingDraft)}
            loading={status === "saving"}
            onClick={() => {
              void controller.createClaimMapping(claimMappingDraft).then(() => {
                setClaimMappings(controller.getState().claimMappings);
                setStatus(controller.getState().status);
                setError(controller.getState().lastError);
                setClaimMappingDraft({
                  externalClaim: "",
                  integrationId: "",
                  providerCode: "",
                  targetField: "",
                  targetKind: "profile",
                });
              }).catch(() => {
                setStatus(controller.getState().status);
                setError(controller.getState().lastError);
              });
            }}
            type="button"
          >
            Add claim mapping
          </Button>
        </CreateResourceDrawer>
      </SettingsSection>
      </>
      ) : null}

      {showActivityWebhooks ? (
      <SettingsSection
        description="Provider webhook callback endpoints for OAuth integrations (WeChat, enterprise IdP, etc.)."
        title="Webhook configs"
      >
        <div className="space-y-3">
          <Label>Configured webhooks ({webhookConfigs.length})</Label>
          <WebhookConfigResourceList
            controller={controller}
            listPageInfo={listPageInfo}
            disabled={listDisabled}
            emptyLabel="No OAuth webhook configs configured yet."
            onChanged={syncLists}
            webhookConfigs={webhookConfigs}
          />
        </div>
        <CreateResourceDrawer description="Register an OAuth provider webhook configuration." triggerLabel="Add webhook config">
          <Label htmlFor="oauth-webhook-integration-id">Integration ID</Label>
          <input
            className="w-full rounded-[0.75rem] border border-[var(--sdk-color-border-default)] bg-transparent px-3 py-2 text-sm"
            id="oauth-webhook-integration-id"
            onChange={(event) => setWebhookConfigDraft((current) => ({
              ...current,
              integrationId: event.target.value,
            }))}
            placeholder="iamoi-..."
            value={webhookConfigDraft.integrationId}
          />
          <Label htmlFor="oauth-webhook-provider">Provider code</Label>
          <input
            className="w-full rounded-[0.75rem] border border-[var(--sdk-color-border-default)] bg-transparent px-3 py-2 text-sm"
            id="oauth-webhook-provider"
            onChange={(event) => setWebhookConfigDraft((current) => ({
              ...current,
              providerCode: event.target.value,
            }))}
            placeholder="wechat"
            value={webhookConfigDraft.providerCode}
          />
          <Label htmlFor="oauth-webhook-code">Webhook code</Label>
          <input
            className="w-full rounded-[0.75rem] border border-[var(--sdk-color-border-default)] bg-transparent px-3 py-2 text-sm"
            id="oauth-webhook-code"
            onChange={(event) => setWebhookConfigDraft((current) => ({
              ...current,
              webhookCode: event.target.value,
            }))}
            placeholder="default-callback"
            value={webhookConfigDraft.webhookCode}
          />
          <Label htmlFor="oauth-webhook-kind">Webhook kind</Label>
          <input
            className="w-full rounded-[0.75rem] border border-[var(--sdk-color-border-default)] bg-transparent px-3 py-2 text-sm"
            id="oauth-webhook-kind"
            onChange={(event) => setWebhookConfigDraft((current) => ({
              ...current,
              webhookKind: event.target.value,
            }))}
            placeholder="provider_callback"
            value={webhookConfigDraft.webhookKind}
          />
          <Label htmlFor="oauth-webhook-callback">Callback URL</Label>
          <input
            className="w-full rounded-[0.75rem] border border-[var(--sdk-color-border-default)] bg-transparent px-3 py-2 text-sm"
            id="oauth-webhook-callback"
            onChange={(event) => setWebhookConfigDraft((current) => ({
              ...current,
              callbackUrl: event.target.value,
            }))}
            placeholder="https://open-api.example.com/open/v3/api/iam/oauth/providers/wechat/callback"
            value={webhookConfigDraft.callbackUrl}
          />
          <Label htmlFor="oauth-webhook-name">Display name</Label>
          <input
            className="w-full rounded-[0.75rem] border border-[var(--sdk-color-border-default)] bg-transparent px-3 py-2 text-sm"
            id="oauth-webhook-name"
            onChange={(event) => setWebhookConfigDraft((current) => ({
              ...current,
              displayName: event.target.value,
            }))}
            placeholder="WeChat callback"
            value={webhookConfigDraft.displayName}
          />
          <Button
            disabled={status === "loading" || status === "saving" || !canSubmitWebhookConfig(webhookConfigDraft)}
            loading={status === "saving"}
            onClick={() => {
              void controller.createWebhookConfig(webhookConfigDraft).then(() => {
                setWebhookConfigs(controller.getState().webhookConfigs);
                setStatus(controller.getState().status);
                setError(controller.getState().lastError);
                setWebhookConfigDraft({
                  callbackUrl: "",
                  displayName: "",
                  integrationId: "",
                  providerCode: "",
                  webhookCode: "",
                  webhookKind: "provider_callback",
                });
              }).catch(() => {
                setStatus(controller.getState().status);
                setError(controller.getState().lastError);
              });
            }}
            type="button"
          >
            Add webhook config
          </Button>
        </CreateResourceDrawer>
      </SettingsSection>
      ) : null}

      {showLoginConfiguration ? (
      <>
      <SettingsSection
        description="OAuth flow configuration per integration and client (authorization code, device, mini program)."
        title="Flow configs"
      >
        <div className="space-y-3">
          <Label>Configured flows ({flowConfigs.length})</Label>
          <FlowConfigResourceList
            controller={controller}
            listPageInfo={listPageInfo}
            disabled={listDisabled}
            emptyLabel="No OAuth flow configs configured yet."
            flowConfigs={flowConfigs}
            onChanged={syncLists}
          />
        </div>
        <CreateResourceDrawer description="Create an OAuth authorization flow configuration." triggerLabel="Add flow config">
          <Label htmlFor="oauth-flow-integration-id">Integration ID</Label>
          <input
            className="w-full rounded-[0.75rem] border border-[var(--sdk-color-border-default)] bg-transparent px-3 py-2 text-sm"
            id="oauth-flow-integration-id"
            onChange={(event) => setFlowConfigDraft((current) => ({
              ...current,
              integrationId: event.target.value,
            }))}
            placeholder="iamoi-..."
            value={flowConfigDraft.integrationId}
          />
          <Label htmlFor="oauth-flow-client-id">OAuth client ID</Label>
          <input
            className="w-full rounded-[0.75rem] border border-[var(--sdk-color-border-default)] bg-transparent px-3 py-2 text-sm"
            id="oauth-flow-client-id"
            onChange={(event) => setFlowConfigDraft((current) => ({
              ...current,
              oauthClientId: event.target.value,
            }))}
            placeholder="iamoc-..."
            value={flowConfigDraft.oauthClientId}
          />
          <Label htmlFor="oauth-flow-kind">Flow kind</Label>
          <input
            className="w-full rounded-[0.75rem] border border-[var(--sdk-color-border-default)] bg-transparent px-3 py-2 text-sm"
            id="oauth-flow-kind"
            onChange={(event) => setFlowConfigDraft((current) => ({
              ...current,
              flowKind: event.target.value,
            }))}
            placeholder="authorization_code"
            value={flowConfigDraft.flowKind}
          />
          <Label htmlFor="oauth-flow-purpose">Flow purpose</Label>
          <input
            className="w-full rounded-[0.75rem] border border-[var(--sdk-color-border-default)] bg-transparent px-3 py-2 text-sm"
            id="oauth-flow-purpose"
            onChange={(event) => setFlowConfigDraft((current) => ({
              ...current,
              flowPurpose: event.target.value,
            }))}
            placeholder="login"
            value={flowConfigDraft.flowPurpose}
          />
          <Button
            disabled={status === "loading" || status === "saving" || !canSubmitFlowConfig(flowConfigDraft)}
            loading={status === "saving"}
            onClick={() => {
              void controller.createFlowConfig(flowConfigDraft).then(() => {
                setFlowConfigs(controller.getState().flowConfigs);
                setStatus(controller.getState().status);
                setError(controller.getState().lastError);
                setFlowConfigDraft({
                  flowKind: "authorization_code",
                  flowPurpose: "login",
                  integrationId: "",
                  oauthClientId: "",
                });
              }).catch(() => {
                setStatus(controller.getState().status);
                setError(controller.getState().lastError);
              });
            }}
            type="button"
          >
            Add flow config
          </Button>
        </CreateResourceDrawer>
      </SettingsSection>

      <SettingsSection
        description="Surfaces expose OAuth login entry points such as web, mini program, or native app callbacks."
        title="OAuth surfaces"
      >
        <div className="space-y-3">
          <Label>Configured surfaces ({surfaces.length})</Label>
          <SurfaceResourceList
            controller={controller}
            listPageInfo={listPageInfo}
            disabled={listDisabled}
            emptyLabel="No OAuth surfaces configured yet."
            onChanged={syncLists}
            surfaces={surfaces}
          />
        </div>
        <CreateResourceDrawer description="Register a browser, mobile, or provider OAuth surface." triggerLabel="Add OAuth surface">
          <Label htmlFor="oauth-surface-provider">Provider code</Label>
          <input
            className="w-full rounded-[0.75rem] border border-[var(--sdk-color-border-default)] bg-transparent px-3 py-2 text-sm"
            id="oauth-surface-provider"
            onChange={(event) => setSurfaceDraft((current) => ({
              ...current,
              providerCode: event.target.value,
            }))}
            placeholder="wechat"
            value={surfaceDraft.providerCode}
          />
          <Label htmlFor="oauth-surface-code">Surface code</Label>
          <input
            className="w-full rounded-[0.75rem] border border-[var(--sdk-color-border-default)] bg-transparent px-3 py-2 text-sm"
            id="oauth-surface-code"
            onChange={(event) => setSurfaceDraft((current) => ({
              ...current,
              surfaceCode: event.target.value,
            }))}
            placeholder="web-login"
            value={surfaceDraft.surfaceCode}
          />
          <Label htmlFor="oauth-surface-kind">Surface kind</Label>
          <input
            className="w-full rounded-[0.75rem] border border-[var(--sdk-color-border-default)] bg-transparent px-3 py-2 text-sm"
            id="oauth-surface-kind"
            onChange={(event) => setSurfaceDraft((current) => ({
              ...current,
              surfaceKind: event.target.value,
            }))}
            placeholder="web"
            value={surfaceDraft.surfaceKind}
          />
          <Label htmlFor="oauth-surface-name">Display name</Label>
          <input
            className="w-full rounded-[0.75rem] border border-[var(--sdk-color-border-default)] bg-transparent px-3 py-2 text-sm"
            id="oauth-surface-name"
            onChange={(event) => setSurfaceDraft((current) => ({
              ...current,
              displayName: event.target.value,
            }))}
            placeholder="Web login"
            value={surfaceDraft.displayName}
          />
          <Button
            disabled={listDisabled || !canSubmitSurface(surfaceDraft)}
            loading={status === "saving"}
            onClick={() => {
              void controller.createSurface(surfaceDraft).then(() => {
                syncLists();
                setSurfaceDraft({
                  displayName: "",
                  providerCode: "",
                  surfaceCode: "",
                  surfaceKind: "web",
                });
              }).catch(syncLists);
            }}
            type="button"
          >
            Add surface
          </Button>
        </CreateResourceDrawer>
      </SettingsSection>
      </>
      ) : null}
      </>
      ) : null}

      {showGovernance || showResources ? (
      <>
      {showGovernance ? (
      <>
      <SettingsSection
        description="OAuth policies govern integration behavior such as login, binding, and token retention."
        title="OAuth policies"
      >
        <div className="space-y-3">
          <Label>Configured policies ({policies.length})</Label>
          <PolicyResourceList
            controller={controller}
            listPageInfo={listPageInfo}
            disabled={listDisabled}
            emptyLabel="No OAuth policies configured yet."
            onChanged={syncLists}
            policies={policies}
          />
        </div>
        <CreateResourceDrawer description="Create a tenant OAuth policy." triggerLabel="Add OAuth policy">
          <Label htmlFor="oauth-policy-code">Policy code</Label>
          <input className="w-full rounded-[0.75rem] border border-[var(--sdk-color-border-default)] bg-transparent px-3 py-2 text-sm" id="oauth-policy-code" onChange={(e) => setPolicyDraft((c) => ({ ...c, policyCode: e.target.value }))} placeholder="default-login-policy" value={policyDraft.policyCode} />
          <Label htmlFor="oauth-policy-name">Display name</Label>
          <input className="w-full rounded-[0.75rem] border border-[var(--sdk-color-border-default)] bg-transparent px-3 py-2 text-sm" id="oauth-policy-name" onChange={(e) => setPolicyDraft((c) => ({ ...c, displayName: e.target.value }))} placeholder="Default login policy" value={policyDraft.displayName} />
          <Label htmlFor="oauth-policy-integration">Integration ID (optional)</Label>
          <input className="w-full rounded-[0.75rem] border border-[var(--sdk-color-border-default)] bg-transparent px-3 py-2 text-sm" id="oauth-policy-integration" onChange={(e) => setPolicyDraft((c) => ({ ...c, integrationId: e.target.value }))} placeholder="iamoi-..." value={policyDraft.integrationId} />
          <Button disabled={status === "loading" || status === "saving" || !canSubmitPolicy(policyDraft)} loading={status === "saving"} onClick={() => { void controller.createPolicy(policyDraft).then(() => { setPolicies(controller.getState().policies); setPolicyDraft({ displayName: "", integrationId: "", policyCode: "" }); }); }} type="button">Add policy</Button>
        </CreateResourceDrawer>
      </SettingsSection>

      <SettingsSection
        description="Tenant bindings map provider tenants to SDKWork tenants for federated login."
        title="Tenant bindings"
      >
        <div className="space-y-3">
          <Label>Configured bindings ({tenantBindings.length})</Label>
          <TenantBindingResourceList
            controller={controller}
            listPageInfo={listPageInfo}
            disabled={listDisabled}
            emptyLabel="No OAuth tenant bindings configured yet."
            onChanged={syncLists}
            tenantBindings={tenantBindings}
          />
        </div>
        <CreateResourceDrawer description="Map a provider tenant to an SDKWork tenant." triggerLabel="Add tenant binding">
          <Label htmlFor="oauth-binding-provider">Provider code</Label>
          <input className="w-full rounded-[0.75rem] border border-[var(--sdk-color-border-default)] bg-transparent px-3 py-2 text-sm" id="oauth-binding-provider" onChange={(e) => setTenantBindingDraft((c) => ({ ...c, providerCode: e.target.value }))} value={tenantBindingDraft.providerCode} />
          <Label htmlFor="oauth-binding-integration">Integration ID</Label>
          <input className="w-full rounded-[0.75rem] border border-[var(--sdk-color-border-default)] bg-transparent px-3 py-2 text-sm" id="oauth-binding-integration" onChange={(e) => setTenantBindingDraft((c) => ({ ...c, integrationId: e.target.value }))} value={tenantBindingDraft.integrationId} />
          <Label htmlFor="oauth-binding-kind">Binding kind</Label>
          <input className="w-full rounded-[0.75rem] border border-[var(--sdk-color-border-default)] bg-transparent px-3 py-2 text-sm" id="oauth-binding-kind" onChange={(e) => setTenantBindingDraft((c) => ({ ...c, bindingKind: e.target.value }))} value={tenantBindingDraft.bindingKind} />
          <Button disabled={status === "loading" || status === "saving" || !canSubmitTenantBinding(tenantBindingDraft)} loading={status === "saving"} onClick={() => { void controller.createTenantBinding(tenantBindingDraft).then(() => { setTenantBindings(controller.getState().tenantBindings); setTenantBindingDraft({ bindingKind: "tenant_map", integrationId: "", providerCode: "" }); }); }} type="button">Add tenant binding</Button>
        </CreateResourceDrawer>
      </SettingsSection>

      </>
      ) : null}

      {showResources ? (
      <>
      <SettingsSection
        description="Operator platforms register third-party operator consoles (WeChat open platform, enterprise IdP)."
        title="Operator platforms"
      >
        <div className="space-y-3">
          <Label>Registered platforms ({operatorPlatforms.length})</Label>
          <OperatorPlatformResourceList
            controller={controller}
            listPageInfo={listPageInfo}
            disabled={listDisabled}
            emptyLabel="No operator platforms registered yet."
            onChanged={syncLists}
            operatorPlatforms={operatorPlatforms}
          />
        </div>
        <CreateResourceDrawer description="Register a third-party operator platform." triggerLabel="Add operator platform">
          <Label htmlFor="oauth-op-integration">Integration ID</Label>
          <input className="w-full rounded-[0.75rem] border border-[var(--sdk-color-border-default)] bg-transparent px-3 py-2 text-sm" id="oauth-op-integration" onChange={(e) => setOperatorPlatformDraft((c) => ({ ...c, integrationId: e.target.value }))} value={operatorPlatformDraft.integrationId} />
          <Label htmlFor="oauth-op-provider">Provider code</Label>
          <input className="w-full rounded-[0.75rem] border border-[var(--sdk-color-border-default)] bg-transparent px-3 py-2 text-sm" id="oauth-op-provider" onChange={(e) => setOperatorPlatformDraft((c) => ({ ...c, providerCode: e.target.value }))} value={operatorPlatformDraft.providerCode} />
          <Label htmlFor="oauth-op-platform-code">Platform code</Label>
          <input className="w-full rounded-[0.75rem] border border-[var(--sdk-color-border-default)] bg-transparent px-3 py-2 text-sm" id="oauth-op-platform-code" onChange={(e) => setOperatorPlatformDraft((c) => ({ ...c, platformCode: e.target.value }))} value={operatorPlatformDraft.platformCode} />
          <Label htmlFor="oauth-op-provider-platform-id">Provider platform ID</Label>
          <input className="w-full rounded-[0.75rem] border border-[var(--sdk-color-border-default)] bg-transparent px-3 py-2 text-sm" id="oauth-op-provider-platform-id" onChange={(e) => setOperatorPlatformDraft((c) => ({ ...c, providerPlatformId: e.target.value }))} value={operatorPlatformDraft.providerPlatformId} />
          <Label htmlFor="oauth-op-mode">Operator mode</Label>
          <input className="w-full rounded-[0.75rem] border border-[var(--sdk-color-border-default)] bg-transparent px-3 py-2 text-sm" id="oauth-op-mode" onChange={(e) => setOperatorPlatformDraft((c) => ({ ...c, operatorMode: e.target.value }))} value={operatorPlatformDraft.operatorMode} />
          <Label htmlFor="oauth-op-name">Display name</Label>
          <input className="w-full rounded-[0.75rem] border border-[var(--sdk-color-border-default)] bg-transparent px-3 py-2 text-sm" id="oauth-op-name" onChange={(e) => setOperatorPlatformDraft((c) => ({ ...c, displayName: e.target.value }))} value={operatorPlatformDraft.displayName} />
          <Button disabled={status === "loading" || status === "saving" || !canSubmitOperatorPlatform(operatorPlatformDraft)} loading={status === "saving"} onClick={() => { void controller.createOperatorPlatform(operatorPlatformDraft).then(() => { setOperatorPlatforms(controller.getState().operatorPlatforms); setOperatorPlatformDraft({ displayName: "", integrationId: "", operatorMode: "third_party", platformCode: "", providerCode: "", providerPlatformId: "" }); }); }} type="button">Add operator platform</Button>
        </CreateResourceDrawer>
      </SettingsSection>

      <SettingsSection
        description="Resource accounts represent provider-side assets such as official accounts or mini programs."
        title="OAuth resource accounts"
      >
        <div className="space-y-3">
          <Label>Registered resource accounts ({resourceAccounts.length})</Label>
          <ResourceAccountResourceList
            controller={controller}
            listPageInfo={listPageInfo}
            disabled={listDisabled}
            emptyLabel="No OAuth resource accounts registered yet."
            onChanged={syncLists}
            resourceAccounts={resourceAccounts}
          />
        </div>
        <CreateResourceDrawer description="Register an OAuth provider-side resource account." triggerLabel="Add resource account">
          <Label htmlFor="oauth-ra-integration">Integration ID</Label>
          <input className="w-full rounded-[0.75rem] border border-[var(--sdk-color-border-default)] bg-transparent px-3 py-2 text-sm" id="oauth-ra-integration" onChange={(e) => setResourceAccountDraft((c) => ({ ...c, integrationId: e.target.value }))} value={resourceAccountDraft.integrationId} />
          <Label htmlFor="oauth-ra-provider">Provider code</Label>
          <input className="w-full rounded-[0.75rem] border border-[var(--sdk-color-border-default)] bg-transparent px-3 py-2 text-sm" id="oauth-ra-provider" onChange={(e) => setResourceAccountDraft((c) => ({ ...c, providerCode: e.target.value }))} value={resourceAccountDraft.providerCode} />
          <Label htmlFor="oauth-ra-code">Resource account code</Label>
          <input className="w-full rounded-[0.75rem] border border-[var(--sdk-color-border-default)] bg-transparent px-3 py-2 text-sm" id="oauth-ra-code" onChange={(e) => setResourceAccountDraft((c) => ({ ...c, resourceAccountCode: e.target.value }))} value={resourceAccountDraft.resourceAccountCode} />
          <Label htmlFor="oauth-ra-kind">Resource account kind</Label>
          <input className="w-full rounded-[0.75rem] border border-[var(--sdk-color-border-default)] bg-transparent px-3 py-2 text-sm" id="oauth-ra-kind" onChange={(e) => setResourceAccountDraft((c) => ({ ...c, resourceAccountKind: e.target.value }))} value={resourceAccountDraft.resourceAccountKind} />
          <Label htmlFor="oauth-ra-name">Display name</Label>
          <input className="w-full rounded-[0.75rem] border border-[var(--sdk-color-border-default)] bg-transparent px-3 py-2 text-sm" id="oauth-ra-name" onChange={(e) => setResourceAccountDraft((c) => ({ ...c, displayName: e.target.value }))} value={resourceAccountDraft.displayName} />
          <Label htmlFor="oauth-ra-provider-account">Provider account ID</Label>
          <input className="w-full rounded-[0.75rem] border border-[var(--sdk-color-border-default)] bg-transparent px-3 py-2 text-sm" id="oauth-ra-provider-account" onChange={(e) => setResourceAccountDraft((c) => ({ ...c, providerAccountId: e.target.value }))} value={resourceAccountDraft.providerAccountId} />
          <Label htmlFor="oauth-ra-access-mode">Access mode</Label>
          <input className="w-full rounded-[0.75rem] border border-[var(--sdk-color-border-default)] bg-transparent px-3 py-2 text-sm" id="oauth-ra-access-mode" onChange={(e) => setResourceAccountDraft((c) => ({ ...c, accessMode: e.target.value }))} value={resourceAccountDraft.accessMode} />
          <Button disabled={status === "loading" || status === "saving" || !canSubmitResourceAccount(resourceAccountDraft)} loading={status === "saving"} onClick={() => { void controller.createResourceAccount(resourceAccountDraft).then(() => { setResourceAccounts(controller.getState().resourceAccounts); setResourceAccountDraft({ accessMode: "operator_managed", displayName: "", integrationId: "", providerAccountId: "", providerCode: "", resourceAccountCode: "", resourceAccountKind: "official_account" }); }); }} type="button">Add resource account</Button>
        </CreateResourceDrawer>
      </SettingsSection>

      <SettingsSection
        description="Resource authorizations bind resource accounts to operator authorization flows."
        title="OAuth resource authorizations"
      >
        <div className="space-y-3">
          <Label>Configured authorizations ({resourceAuthorizations.length})</Label>
          <ResourceAuthorizationResourceList
            controller={controller}
            listPageInfo={listPageInfo}
            disabled={listDisabled}
            emptyLabel="No OAuth resource authorizations configured yet."
            onChanged={syncLists}
            resourceAuthorizations={resourceAuthorizations}
          />
        </div>
        <CreateResourceDrawer description="Bind a resource account to an operator authorization flow." triggerLabel="Add resource authorization">
          <Label htmlFor="oauth-authz-integration">Integration ID</Label>
          <input className="w-full rounded-[0.75rem] border border-[var(--sdk-color-border-default)] bg-transparent px-3 py-2 text-sm" id="oauth-authz-integration" onChange={(e) => setResourceAuthorizationDraft((c) => ({ ...c, integrationId: e.target.value }))} value={resourceAuthorizationDraft.integrationId} />
          <Label htmlFor="oauth-authz-resource-account">Resource account ID</Label>
          <input className="w-full rounded-[0.75rem] border border-[var(--sdk-color-border-default)] bg-transparent px-3 py-2 text-sm" id="oauth-authz-resource-account" onChange={(e) => setResourceAuthorizationDraft((c) => ({ ...c, resourceAccountId: e.target.value }))} value={resourceAuthorizationDraft.resourceAccountId} />
          <Label htmlFor="oauth-authz-provider">Provider code</Label>
          <input className="w-full rounded-[0.75rem] border border-[var(--sdk-color-border-default)] bg-transparent px-3 py-2 text-sm" id="oauth-authz-provider" onChange={(e) => setResourceAuthorizationDraft((c) => ({ ...c, providerCode: e.target.value }))} value={resourceAuthorizationDraft.providerCode} />
          <Label htmlFor="oauth-authz-mode">Authorization mode</Label>
          <input className="w-full rounded-[0.75rem] border border-[var(--sdk-color-border-default)] bg-transparent px-3 py-2 text-sm" id="oauth-authz-mode" onChange={(e) => setResourceAuthorizationDraft((c) => ({ ...c, authorizationMode: e.target.value }))} value={resourceAuthorizationDraft.authorizationMode} />
          <Button disabled={status === "loading" || status === "saving" || !canSubmitResourceAuthorization(resourceAuthorizationDraft)} loading={status === "saving"} onClick={() => { void controller.createResourceAuthorization(resourceAuthorizationDraft).then(() => { setResourceAuthorizations(controller.getState().resourceAuthorizations); setResourceAuthorizationDraft({ authorizationMode: "third_party_platform", integrationId: "", providerCode: "", resourceAccountId: "" }); }); }} type="button">Add resource authorization</Button>
        </CreateResourceDrawer>
      </SettingsSection>

      <SettingsSection
        description="Operational resources represent publishable OAuth assets such as mini program pages."
        title="OAuth operational resources"
      >
        <div className="space-y-3">
          <Label>Operational resources ({operationalResources.length})</Label>
          <OperationalResourceList
            controller={controller}
            listPageInfo={listPageInfo}
            disabled={listDisabled}
            emptyLabel="No OAuth operational resources registered yet."
            onChanged={syncLists}
            operationalResources={operationalResources}
          />
        </div>
        <CreateResourceDrawer description="Register a publishable OAuth operational resource." triggerLabel="Add operational resource">
          <Label htmlFor="oauth-opres-integration">Integration ID</Label>
          <input className="w-full rounded-[0.75rem] border border-[var(--sdk-color-border-default)] bg-transparent px-3 py-2 text-sm" id="oauth-opres-integration" onChange={(e) => setOperationalResourceDraft((c) => ({ ...c, integrationId: e.target.value }))} value={operationalResourceDraft.integrationId} />
          <Label htmlFor="oauth-opres-resource-account">Resource account ID</Label>
          <input className="w-full rounded-[0.75rem] border border-[var(--sdk-color-border-default)] bg-transparent px-3 py-2 text-sm" id="oauth-opres-resource-account" onChange={(e) => setOperationalResourceDraft((c) => ({ ...c, resourceAccountId: e.target.value }))} value={operationalResourceDraft.resourceAccountId} />
          <Label htmlFor="oauth-opres-provider">Provider code</Label>
          <input className="w-full rounded-[0.75rem] border border-[var(--sdk-color-border-default)] bg-transparent px-3 py-2 text-sm" id="oauth-opres-provider" onChange={(e) => setOperationalResourceDraft((c) => ({ ...c, providerCode: e.target.value }))} value={operationalResourceDraft.providerCode} />
          <Label htmlFor="oauth-opres-kind">Resource kind</Label>
          <input className="w-full rounded-[0.75rem] border border-[var(--sdk-color-border-default)] bg-transparent px-3 py-2 text-sm" id="oauth-opres-kind" onChange={(e) => setOperationalResourceDraft((c) => ({ ...c, resourceKind: e.target.value }))} value={operationalResourceDraft.resourceKind} />
          <Label htmlFor="oauth-opres-code">Resource code</Label>
          <input className="w-full rounded-[0.75rem] border border-[var(--sdk-color-border-default)] bg-transparent px-3 py-2 text-sm" id="oauth-opres-code" onChange={(e) => setOperationalResourceDraft((c) => ({ ...c, resourceCode: e.target.value }))} value={operationalResourceDraft.resourceCode} />
          <Label htmlFor="oauth-opres-name">Display name</Label>
          <input className="w-full rounded-[0.75rem] border border-[var(--sdk-color-border-default)] bg-transparent px-3 py-2 text-sm" id="oauth-opres-name" onChange={(e) => setOperationalResourceDraft((c) => ({ ...c, displayName: e.target.value }))} value={operationalResourceDraft.displayName} />
          <Button disabled={listDisabled || !canSubmitOperationalResource(operationalResourceDraft)} loading={status === "saving"} onClick={() => { void controller.createOperationalResource(operationalResourceDraft).then(() => { syncLists(); setOperationalResourceDraft({ displayName: "", integrationId: "", providerCode: "", resourceAccountId: "", resourceCode: "", resourceKind: "mini_program_page" }); }); }} type="button">Add operational resource</Button>
        </CreateResourceDrawer>
      </SettingsSection>
      </>
      ) : null}
      </>
      ) : null}

      {showAuthorizations ? (
      <>
      <SettingsSection
        description="Account links bind external provider subjects to IAM users. Operators may suspend or revoke links per tenant policy."
        title="OAuth account links"
      >
        <div className="space-y-3">
          <Label>Linked accounts ({accountLinks.length})</Label>
          <AccountLinkResourceList
            accountLinks={accountLinks}
            controller={controller}
            listPageInfo={listPageInfo}
            disabled={listDisabled}
            emptyLabel="No OAuth account links found."
            onChanged={syncLists}
          />
        </div>
        <StatusNotice tone="default">
          Use Activate, Suspend, or Revoke on each linked account. Status changes call `iam.oauth.accountLinks.update` and respect tenant account-binding policy.
        </StatusNotice>
      </SettingsSection>

      <SettingsSection
        description="Active OAuth grants issued by the SDKWork authorization server. Revocation invalidates server-side token lookup per IAM_OAUTH_SPEC §7."
        title="OAuth grants"
      >
        <div className="space-y-3">
          <Label>Active grants ({grants.length})</Label>
          <GrantResourceList
            controller={controller}
            listPageInfo={listPageInfo}
            disabled={listDisabled}
            emptyLabel="No OAuth grants found."
            grants={grants}
            onRevoked={syncLists}
          />
        </div>
      </SettingsSection>
      </>
      ) : null}

      {showActivityAudit ? (
      <>
      <SettingsSection
        description="Diagnostic runs validate integration health. Results are redacted in list responses."
        title="Diagnostic runs"
      >
        <div className="space-y-3">
          <Label>Recent runs ({diagnosticRuns.length})</Label>
          <DiagnosticRunResourceList
            controller={controller}
            diagnosticRuns={diagnosticRuns}
            disabled={listDisabled}
            emptyLabel="No diagnostic runs queued yet."
            onChanged={syncLists}
          />
        </div>
        <CreateResourceDrawer description="Queue a new OAuth diagnostic run." triggerLabel="Queue diagnostic run">
          <Label htmlFor="oauth-diag-provider">Provider code</Label>
          <input className="w-full rounded-[0.75rem] border border-[var(--sdk-color-border-default)] bg-transparent px-3 py-2 text-sm" id="oauth-diag-provider" onChange={(e) => setDiagnosticRunDraft((c) => ({ ...c, providerCode: e.target.value }))} value={diagnosticRunDraft.providerCode} />
          <Label htmlFor="oauth-diag-integration">Integration ID (optional)</Label>
          <input className="w-full rounded-[0.75rem] border border-[var(--sdk-color-border-default)] bg-transparent px-3 py-2 text-sm" id="oauth-diag-integration" onChange={(e) => setDiagnosticRunDraft((c) => ({ ...c, integrationId: e.target.value }))} value={diagnosticRunDraft.integrationId} />
          <Label htmlFor="oauth-diag-kind">Run kind</Label>
          <input className="w-full rounded-[0.75rem] border border-[var(--sdk-color-border-default)] bg-transparent px-3 py-2 text-sm" id="oauth-diag-kind" onChange={(e) => setDiagnosticRunDraft((c) => ({ ...c, runKind: e.target.value }))} value={diagnosticRunDraft.runKind} />
          <Button disabled={listDisabled || !canSubmitDiagnosticRun(diagnosticRunDraft)} loading={status === "saving"} onClick={() => { void controller.createDiagnosticRun(diagnosticRunDraft).then(() => { syncLists(); setDiagnosticRunDraft({ integrationId: "", providerCode: "", runKind: "manual" }); }); }} type="button">Queue diagnostic run</Button>
        </CreateResourceDrawer>
        {diagnosticDetail ? (
          <div className="mt-6 space-y-2">
            <Label>Latest retrieved diagnostic detail</Label>
            <pre className="max-h-80 overflow-auto rounded-[0.75rem] border border-[var(--sdk-color-border-default)] bg-[var(--sdk-color-surface-muted)] p-3 text-xs">
              {formatResourceDetail(diagnosticDetail)}
            </pre>
          </div>
        ) : null}
      </SettingsSection>

      <SettingsSection
        description="Provider callback events for OAuth diagnostics and audit."
        title="OAuth callback events"
      >
        <div className="space-y-3">
          <Label>Recent callback events ({callbackEvents.length})</Label>
          <ResourceList
            emptyLabel="No OAuth callback events recorded yet."
            items={callbackEvents}
            listPageInfo={listPageInfo?.callbackEvents}
            onLoadMore={() => controller.loadMoreResource("callbackEvents").then(syncLists)}
          />
        </div>
      </SettingsSection>
      </>
      ) : null}
    </div>
  );
}

function CreateResourceDrawer({
  children,
  description,
  triggerLabel,
}: {
  children: ReactNode;
  description: string;
  triggerLabel: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-4">
      <Button onClick={() => setOpen(true)} type="button">{triggerLabel}</Button>
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent size="md">
          <DrawerHeader>
            <DrawerTitle>{triggerLabel}</DrawerTitle>
            <DrawerDescription>{description}</DrawerDescription>
          </DrawerHeader>
          <DrawerBody className="space-y-3">{children}</DrawerBody>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
