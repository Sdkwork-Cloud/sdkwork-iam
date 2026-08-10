import type { SdkWorkPageInfo } from "@sdkwork/iam-contracts";
import type { SdkworkIamService } from "@sdkwork/iam-service";

export interface SdkworkIamOauthIntegrationDraft {
  appId?: string;
  displayName: string;
  enabled?: boolean;
  integrationCode: string;
  providerCatalogId?: string;
  providerClientId?: string;
  providerClientSecret?: string;
  providerCode: string;
  providerTenantId?: string;
  redirectUri?: string;
  surfaceKind?: string;
}

export interface SdkworkIamOauthProviderCatalogDraft {
  providerCode: string;
  providerDisplayName: string;
  providerName: string;
}

export interface SdkworkIamOauthSurfaceDraft {
  displayName: string;
  integrationId: string;
  oauthClientId: string;
  redirectUri: string;
  surfaceCode: string;
  surfaceKind: string;
}

export interface SdkworkIamOauthClientDraft {
  clientCode: string;
  displayName: string;
  integrationId: string;
  providerClientId: string;
  providerCode: string;
  providerTenantId: string;
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
  secretValue: string;
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

/**
 * Full developer configuration of a mini program or official account,
 * mirroring the WeChat development console: custom (legal) domains, the
 * domain verification file issued by WeChat, and message notification
 * push settings. Stored as one JSON document in the backend
 * `provider_config_json` column.
 */
export interface SdkworkIamOauthAccountDomainsConfig {
  business?: string[];
  downloadFile?: string[];
  request?: string[];
  socket?: string[];
  uploadFile?: string[];
}

export interface SdkworkIamOauthAccountNotifyConfig {
  dataFormat?: "json" | "xml";
  encodingAesKey?: string;
  encryptMode?: "compatible" | "plain" | "safe";
  token?: string;
  url?: string;
}

export interface SdkworkIamOauthAccountVerifyFileConfig {
  content?: string;
  fileName?: string;
}

/**
 * One WeChat domain verification file bound to a single root domain. Each
 * configured domain (web authorization domain or legal domain) carries its
 * own `MP_verify_*.txt` file issued by WeChat.
 */
export interface SdkworkIamOauthAccountDomainVerifyFile {
  content: string;
  domain: string;
  fileName: string;
}

export interface SdkworkIamOauthAccountConfig {
  businessDomains?: string[];
  domains?: SdkworkIamOauthAccountDomainsConfig;
  jsSecureDomains?: string[];
  logoUrl?: string;
  notify?: SdkworkIamOauthAccountNotifyConfig;
  redirectUri?: string;
  verifyFile?: SdkworkIamOauthAccountVerifyFileConfig;
  verifyFiles?: SdkworkIamOauthAccountDomainVerifyFile[];
  webDomain?: string;
}

/**
 * Quick-setup draft for a mini program or official account. Saving creates
 * (or reuses) the matching WeChat integration and a resource account, so the
 * account is usable immediately. `redirectUri` is optional: when `config`
 * carries a `webDomain`, the standardized callback URL is derived as
 * `https://{webDomain}/auth/oauth/callback`.
 */
export interface SdkworkIamOauthAccountSetupDraft {
  accountType?: string;
  appId: string;
  appSecret: string;
  config?: SdkworkIamOauthAccountConfig;
  displayName: string;
  enabled: boolean;
  originalId?: string;
  redirectUri: string;
}

export type SdkworkIamOauthAccountKind = "mini_program" | "official_account";

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
  listPageInfo?: Partial<Record<keyof SdkworkIamOauthAdminResourceSnapshot, SdkWorkPageInfo>>;
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

export type SdkworkIamOauthAdminView =
  | "providers"
  | "applications"
  | "login-configuration"
  | "governance"
  | "authorizations"
  | "resources"
  | "activity";

export type SdkworkIamOauthScanLoginQrMode = "official_account" | "url";

export interface SdkworkIamOauthScanLoginModeEntry {
  displayName?: string;
  enabled: boolean;
  mode: "official_account" | "provider" | "url" | string;
  providerCode?: string;
  qrMode: string;
  sortOrder: number;
}

export interface SdkworkIamOauthScanLoginWebhookInfo {
  callbackPublicId?: string;
  callbackUrl?: string;
  enabled?: boolean;
  encodingAesKeyStatus?: string;
  verificationTokenStatus?: string;
}

export interface SdkworkIamOauthScanLoginOfficialAccount {
  accountId: string;
  appId?: string;
  displayName: string;
  enabled: boolean;
  integrationId: string;
  qrLoginEnabled: boolean;
  verificationStatus?: string;
  webhook?: SdkworkIamOauthScanLoginWebhookInfo;
}

export interface SdkworkIamOauthScanLoginSettings {
  defaultQrMode: "auto" | SdkworkIamOauthScanLoginQrMode;
  modes: SdkworkIamOauthScanLoginModeEntry[];
  officialAccounts: SdkworkIamOauthScanLoginOfficialAccount[];
  urlLogin: {
    enabled: boolean;
    h5LoginOrigin: string;
  };
}

export interface SdkworkIamOauthScanLoginSettingsDraft {
  defaultQrMode?: "auto" | SdkworkIamOauthScanLoginQrMode;
  modes?: SdkworkIamOauthScanLoginModeEntry[];
  urlLogin?: {
    enabled?: boolean;
    h5LoginOrigin?: string;
  };
}

export interface SdkworkIamOauthScanLoginPreview {
  expireSeconds?: number;
  qrCode?: string;
  qrContent: string;
  qrMode: string;
}

/**
 * WeChat permanent parameterized follow QR for one official account.
 *
 * `qrCode` is the `mp.weixin.qq.com/cgi-bin/showqrcode?ticket=...` image URL;
 * `scene` (`follow:{accountId}`) travels back through the subscribe event so
 * the platform can attribute followers to the account.
 */
export interface SdkworkIamOauthAccountFollowQrCode {
  expireSeconds: number;
  permanent: boolean;
  qrCode: string;
  qrContent: string;
  qrMode: string;
  scene: string;
  ticket: string;
}

export interface SdkworkIamOauthAdminController {
  getState(): SdkworkIamOauthAdminState;
  load(
    resourceKeys?: readonly (keyof SdkworkIamOauthAdminResourceSnapshot)[],
  ): Promise<SdkworkIamOauthAdminResourceSnapshot>;
  loadMoreResource(resourceKey: keyof SdkworkIamOauthAdminResourceSnapshot): Promise<unknown[]>;
  listPageResource(
    resourceKey: keyof SdkworkIamOauthAdminResourceSnapshot,
    params: Record<string, unknown>,
  ): Promise<unknown[]>;
  createAccountSetup(
    kind: SdkworkIamOauthAccountKind,
    body: SdkworkIamOauthAccountSetupDraft,
  ): Promise<unknown>;
  setResourceAccountEnabled(
    resourceAccountId: string,
    integrationId: string,
    enabled: boolean,
  ): Promise<unknown>;
  deleteResourceAccount(resourceAccountId: string): Promise<unknown>;
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
  updateAccountConfig(
    resourceAccountId: string,
    config: SdkworkIamOauthAccountConfig,
  ): Promise<unknown>;
  updateAccountCredentials(
    resourceAccountId: string,
    body: { appId?: string; appSecret?: string },
  ): Promise<unknown>;
  updateAccountProfile(
    resourceAccountId: string,
    integrationId: string,
    body: { accountType?: string; displayName: string; originalId?: string },
  ): Promise<unknown>;
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
  loadScanLoginSettings(): Promise<SdkworkIamOauthScanLoginSettings>;
  updateScanLoginSettings(body: SdkworkIamOauthScanLoginSettingsDraft): Promise<SdkworkIamOauthScanLoginSettings>;
  generateScanLoginPreview(
    qrMode: string,
    accountId?: string,
  ): Promise<SdkworkIamOauthScanLoginPreview>;
  createAccountFollowQrCode(
    resourceAccountId: string,
  ): Promise<SdkworkIamOauthAccountFollowQrCode>;
  setResourceAccountQrLogin(resourceAccountId: string, enabled: boolean): Promise<unknown>;
}

export interface SdkworkIamOauthAdminSettingsProps {
  controller: SdkworkIamOauthAdminController;
  tab?: SdkworkIamOauthAdminTab;
  view?: SdkworkIamOauthAdminView;
}

export interface SdkworkIamOauthAdminWorkspaceProps {
  controller: SdkworkIamOauthAdminController;
}

/**
 * Shared props contract for composed admin pages (view/tab/all surfaces).
 */
export type SdkworkIamOauthAdminPageProps = Pick<
  SdkworkIamOauthAdminSettingsProps,
  "controller"
>;

/**
 * Shared props contract for the per-resource settings sections. Sections
 * receive list data, controller, busy state, and the page-level refresh hook
 * from their composing page; they never create HTTP clients.
 */
export interface SdkworkIamOauthAdminSectionProps {
  controller: SdkworkIamOauthAdminController;
  disabled: boolean;
  listPageInfo?: Partial<Record<keyof SdkworkIamOauthAdminResourceSnapshot, SdkWorkPageInfo>>;
  onChanged: () => void;
  status?: SdkworkIamOauthAdminState["status"];
}
