import type { SdkworkIamService } from "@sdkwork/iam-service";

export interface SdkworkIamOauthIntegrationDraft {
  displayName: string;
  integrationCode: string;
  providerCode: string;
}

export interface SdkworkIamOauthProviderCatalogDraft {
  providerCode: string;
  providerDisplayName: string;
  providerName: string;
}

export interface SdkworkIamOauthSurfaceDraft {
  displayName: string;
  providerCode: string;
  surfaceCode: string;
  surfaceKind: string;
}

export interface SdkworkIamOauthClientDraft {
  clientCode: string;
  displayName: string;
  integrationId: string;
  providerClientId: string;
  providerCode: string;
}

export interface SdkworkIamOauthClaimMappingDraft {
  externalClaim: string;
  integrationId: string;
  providerCode: string;
  targetField: string;
  targetKind: string;
}

export interface SdkworkIamOauthWebhookConfigDraft {
  callbackUrl: string;
  displayName: string;
  integrationId: string;
  providerCode: string;
  webhookCode: string;
  webhookKind: string;
}

export interface SdkworkIamOauthFlowConfigDraft {
  flowKind: string;
  flowPurpose: string;
  integrationId: string;
  oauthClientId: string;
}

export interface SdkworkIamOauthSecretDraft {
  secretKind: string;
  secretOwnerId: string;
  secretOwnerKind: string;
  secretRef: string;
}

export interface SdkworkIamOauthScopeProfileDraft {
  displayName: string;
  integrationId: string;
  providerCode: string;
  purpose: string;
  scopeProfileCode: string;
}

export interface SdkworkIamOauthPolicyDraft {
  displayName: string;
  integrationId: string;
  policyCode: string;
}

export interface SdkworkIamOauthDiagnosticRunDraft {
  integrationId: string;
  providerCode: string;
  runKind: string;
}

export interface SdkworkIamOauthOperatorPlatformDraft {
  displayName: string;
  integrationId: string;
  operatorMode: string;
  platformCode: string;
  providerCode: string;
  providerPlatformId: string;
}

export interface SdkworkIamOauthTenantBindingDraft {
  bindingKind: string;
  integrationId: string;
  providerCode: string;
}

export interface SdkworkIamOauthAccountLinkUpdateDraft {
  accountLinkId: string;
  status: string;
}

export interface SdkworkIamOauthOperationalResourceDraft {
  displayName: string;
  integrationId: string;
  providerCode: string;
  resourceAccountId: string;
  resourceCode: string;
  resourceKind: string;
}

export interface SdkworkIamOauthResourceAccountDraft {
  accessMode: string;
  displayName: string;
  integrationId: string;
  providerAccountId: string;
  providerCode: string;
  resourceAccountCode: string;
  resourceAccountKind: string;
}

export interface SdkworkIamOauthResourceAuthorizationDraft {
  authorizationMode: string;
  integrationId: string;
  providerCode: string;
  resourceAccountId: string;
}

export interface SdkworkIamOauthRelyingPartyDraft {
  allowedScopesText: string;
  clientIdHint: string;
  clientSecretHash: string;
  confidential: boolean;
  enabled: boolean;
  hasExistingSecret: boolean;
  redirectUrisText: string;
  tenantApplicationId: string;
  tenantId: string;
}

export interface SdkworkIamOauthAdminResourceSnapshot {
  accountLinks: unknown[];
  callbackEvents: unknown[];
  claimMappings: unknown[];
  clients: unknown[];
  diagnosticRuns: unknown[];
  flowConfigs: unknown[];
  grants: unknown[];
  integrations: unknown[];
  operationalResources: unknown[];
  operatorPlatforms: unknown[];
  policies: unknown[];
  providerCatalog: unknown[];
  resourceAccounts: unknown[];
  resourceAuthorizations: unknown[];
  scopeProfiles: unknown[];
  secrets: unknown[];
  surfaces: unknown[];
  tenantBindings: unknown[];
  webhookConfigs: unknown[];
}

export interface SdkworkIamOauthAdminState extends SdkworkIamOauthAdminResourceSnapshot {
  status: "idle" | "loading" | "ready" | "saving" | "error";
  lastError?: string;
  lastDiagnosticRunDetail?: unknown;
  lastResourceDetail?: {
    detail: unknown;
    label: string;
  };
}

export interface CreateSdkworkIamOauthAdminControllerInput {
  service: SdkworkIamService;
}

export type SdkworkIamOauthAdminTab = "inbound" | "provider" | "extended" | "audit";

export interface SdkworkIamOauthAdminController {
  getState(): SdkworkIamOauthAdminState;
  load(): Promise<SdkworkIamOauthAdminResourceSnapshot>;
  createIntegration(body: SdkworkIamOauthIntegrationDraft): Promise<unknown>;
  createClient(body: SdkworkIamOauthClientDraft): Promise<unknown>;
  createSecret(body: SdkworkIamOauthSecretDraft): Promise<unknown>;
  createScopeProfile(body: SdkworkIamOauthScopeProfileDraft): Promise<unknown>;
  createPolicy(body: SdkworkIamOauthPolicyDraft): Promise<unknown>;
  createTenantBinding(body: SdkworkIamOauthTenantBindingDraft): Promise<unknown>;
  createOperatorPlatform(body: SdkworkIamOauthOperatorPlatformDraft): Promise<unknown>;
  createDiagnosticRun(body: SdkworkIamOauthDiagnosticRunDraft): Promise<unknown>;
  createClaimMapping(body: SdkworkIamOauthClaimMappingDraft): Promise<unknown>;
  createWebhookConfig(body: SdkworkIamOauthWebhookConfigDraft): Promise<unknown>;
  createFlowConfig(body: SdkworkIamOauthFlowConfigDraft): Promise<unknown>;
  createSurface(body: SdkworkIamOauthSurfaceDraft): Promise<unknown>;
  createResourceAccount(body: SdkworkIamOauthResourceAccountDraft): Promise<unknown>;
  createResourceAuthorization(body: SdkworkIamOauthResourceAuthorizationDraft): Promise<unknown>;
  createOperationalResource(body: SdkworkIamOauthOperationalResourceDraft): Promise<unknown>;
  createProviderCatalog(body: SdkworkIamOauthProviderCatalogDraft): Promise<unknown>;
  updateAccountLink(body: SdkworkIamOauthAccountLinkUpdateDraft): Promise<unknown>;
  revokeGrant(grantId: string): Promise<unknown>;
  updateIntegration(integrationId: string, enabled: boolean): Promise<unknown>;
  deleteIntegration(integrationId: string): Promise<unknown>;
  updateClient(oauthClientId: string, enabled: boolean): Promise<unknown>;
  deleteClient(oauthClientId: string): Promise<unknown>;
  deleteSecret(secretId: string): Promise<unknown>;
  updateSurface(surfaceId: string, enabled: boolean): Promise<unknown>;
  deleteSurface(surfaceId: string): Promise<unknown>;
  updateFlowConfig(flowConfigId: string, enabled: boolean): Promise<unknown>;
  updateWebhookConfig(webhookConfigId: string, enabled: boolean): Promise<unknown>;
  updateOperatorPlatform(operatorPlatformId: string, enabled: boolean): Promise<unknown>;
  updateResourceAccount(resourceAccountId: string, enabled: boolean): Promise<unknown>;
  updateOperationalResource(resourceId: string, enabled: boolean): Promise<unknown>;
  updateScopeProfileStatus(scopeProfileId: string, active: boolean): Promise<unknown>;
  updateClaimMappingStatus(mappingId: string, active: boolean): Promise<unknown>;
  updatePolicyStatus(policyId: string, active: boolean): Promise<unknown>;
  updateTenantBindingStatus(bindingId: string, active: boolean): Promise<unknown>;
  updateResourceAuthorizationStatus(authorizationId: string, active: boolean): Promise<unknown>;
  runWebhookVerification(webhookConfigId: string): Promise<unknown>;
  runResourceAccountVerification(resourceAccountId: string): Promise<unknown>;
  runResourceAccountAuthorizationRefresh(resourceAccountId: string): Promise<unknown>;
  runResourceAccountMiniProgramLoginCheck(resourceAccountId: string): Promise<unknown>;
  runOperatorPlatformPreAuthorization(operatorPlatformId: string): Promise<unknown>;
  publishOperationalResource(resourceId: string): Promise<unknown>;
  retrieveDiagnosticRun(diagnosticRunId: string): Promise<unknown>;
  retrieveIntegration(integrationId: string): Promise<unknown>;
  retrieveClient(oauthClientId: string): Promise<unknown>;
  retrieveProviderCatalogEntry(providerCatalogId: string): Promise<unknown>;
  updateProviderCatalogStatus(providerCatalogId: string, active: boolean): Promise<unknown>;
  deleteOperationalResource(resourceId: string): Promise<unknown>;
  loadRelyingPartyConfig(tenantId: string, tenantApplicationId: string): Promise<SdkworkIamOauthRelyingPartyDraft>;
  updateRelyingParty(body: SdkworkIamOauthRelyingPartyDraft): Promise<unknown>;
}

export interface SdkworkIamOauthAdminSettingsProps {
  controller: SdkworkIamOauthAdminController;
  description?: string;
  tab?: SdkworkIamOauthAdminTab;
  title?: string;
}

export interface SdkworkIamOauthAdminWorkspaceProps {
  controller: SdkworkIamOauthAdminController;
  description?: string;
  title?: string;
}
