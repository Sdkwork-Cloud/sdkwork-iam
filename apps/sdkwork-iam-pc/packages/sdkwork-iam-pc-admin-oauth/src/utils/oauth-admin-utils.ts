import type {
  SdkworkIamOauthAccountLinkUpdateDraft,
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

export function normalizeList(value: unknown): unknown[] {
  if (Array.isArray(value)) {
    return value;
  }
  const record = toRecord(value);
  if (Array.isArray(record.items)) {
    return record.items;
  }
  if (Array.isArray(record.data)) {
    return record.data;
  }
  return [];
}

export function splitMultilineList(value: string): string[] {
  return value
    .split(/[\n,]/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export function canSubmitIntegration(draft: SdkworkIamOauthIntegrationDraft): boolean {
  return Boolean(draft.displayName.trim() && draft.integrationCode.trim() && draft.providerCode.trim());
}

export function canSubmitProviderCatalog(draft: SdkworkIamOauthProviderCatalogDraft): boolean {
  return Boolean(draft.providerCode.trim() && draft.providerName.trim());
}

export function canSubmitClient(draft: SdkworkIamOauthClientDraft): boolean {
  return Boolean(
    draft.displayName.trim()
    && draft.integrationId.trim()
    && draft.clientCode.trim()
    && draft.providerClientId.trim()
    && draft.providerCode.trim(),
  );
}

export function canSubmitSecret(draft: SdkworkIamOauthSecretDraft): boolean {
  return Boolean(
    draft.secretKind.trim()
    && draft.secretOwnerId.trim()
    && draft.secretOwnerKind.trim()
    && draft.secretRef.trim(),
  );
}

export function canSubmitScopeProfile(draft: SdkworkIamOauthScopeProfileDraft): boolean {
  return Boolean(
    draft.displayName.trim()
    && draft.integrationId.trim()
    && draft.providerCode.trim()
    && draft.purpose.trim()
    && draft.scopeProfileCode.trim(),
  );
}

export function canSubmitPolicy(draft: SdkworkIamOauthPolicyDraft): boolean {
  return Boolean(draft.displayName.trim() && draft.policyCode.trim());
}

export function canSubmitTenantBinding(draft: SdkworkIamOauthTenantBindingDraft): boolean {
  return Boolean(
    draft.bindingKind.trim() && draft.integrationId.trim() && draft.providerCode.trim(),
  );
}

export function canSubmitOperatorPlatform(draft: SdkworkIamOauthOperatorPlatformDraft): boolean {
  return Boolean(
    draft.displayName.trim()
    && draft.integrationId.trim()
    && draft.operatorMode.trim()
    && draft.platformCode.trim()
    && draft.providerCode.trim()
    && draft.providerPlatformId.trim(),
  );
}

export function canSubmitDiagnosticRun(draft: SdkworkIamOauthDiagnosticRunDraft): boolean {
  return Boolean(draft.providerCode.trim() && draft.runKind.trim());
}

export function canSubmitClaimMapping(draft: SdkworkIamOauthClaimMappingDraft): boolean {
  return Boolean(
    draft.integrationId.trim()
    && draft.providerCode.trim()
    && draft.externalClaim.trim()
    && draft.targetKind.trim()
    && draft.targetField.trim(),
  );
}

export function canSubmitWebhookConfig(draft: SdkworkIamOauthWebhookConfigDraft): boolean {
  return Boolean(
    draft.integrationId.trim()
    && draft.providerCode.trim()
    && draft.webhookCode.trim()
    && draft.webhookKind.trim()
    && draft.callbackUrl.trim()
    && draft.displayName.trim(),
  );
}

export function canSubmitFlowConfig(draft: SdkworkIamOauthFlowConfigDraft): boolean {
  return Boolean(
    draft.integrationId.trim()
    && draft.oauthClientId.trim()
    && draft.flowKind.trim()
    && draft.flowPurpose.trim(),
  );
}

export function canSubmitSurface(draft: SdkworkIamOauthSurfaceDraft): boolean {
  return Boolean(
    draft.displayName.trim()
    && draft.providerCode.trim()
    && draft.surfaceCode.trim()
    && draft.surfaceKind.trim(),
  );
}

export function canSubmitResourceAccount(draft: SdkworkIamOauthResourceAccountDraft): boolean {
  return Boolean(
    draft.integrationId.trim()
    && draft.providerCode.trim()
    && draft.resourceAccountCode.trim()
    && draft.resourceAccountKind.trim()
    && draft.displayName.trim()
    && draft.providerAccountId.trim()
    && draft.accessMode.trim(),
  );
}

export function canSubmitResourceAuthorization(draft: SdkworkIamOauthResourceAuthorizationDraft): boolean {
  return Boolean(
    draft.integrationId.trim()
    && draft.resourceAccountId.trim()
    && draft.providerCode.trim()
    && draft.authorizationMode.trim(),
  );
}

export function canSubmitRelyingParty(draft: SdkworkIamOauthRelyingPartyDraft): boolean {
  const hasRedirectUris = splitMultilineList(draft.redirectUrisText).length > 0;
  const hasScopes = splitMultilineList(draft.allowedScopesText).length > 0;
  const secretOk = !draft.confidential
    || Boolean(draft.clientSecretHash.trim())
    || draft.hasExistingSecret;
  return Boolean(
    draft.tenantApplicationId.trim()
    && draft.tenantId.trim()
    && hasRedirectUris
    && hasScopes
    && secretOk,
  );
}

export function parseRelyingPartyDraftFromTenantApplication(
  detail: unknown,
  tenantId: string,
  tenantApplicationId: string,
): SdkworkIamOauthRelyingPartyDraft {
  const record = toRecord(unwrapApiData(detail));
  const runtimeConfig = toRecord(record.runtimeConfig ?? record.runtime_config);
  const oauth = toRecord(runtimeConfig.oauth);
  const relyingParty = toRecord(oauth.relyingParty ?? oauth.relying_party);
  const redirectUris = readStringList(relyingParty.redirectUris ?? relyingParty.redirect_uris);
  const allowedScopes = readStringList(relyingParty.allowedScopes ?? relyingParty.allowed_scopes);
  const storedSecret = readString(relyingParty.clientSecretHash ?? relyingParty.client_secret_hash);
  const hasExistingSecret = storedSecret === "[redacted]" || Boolean(storedSecret);
  return {
    allowedScopesText: allowedScopes.join("\n"),
    clientIdHint: readString(record.appId ?? record.app_id),
    clientSecretHash: "",
    confidential: readBoolean(relyingParty.confidential, false),
    enabled: readBoolean(relyingParty.enabled, true),
    hasExistingSecret,
    redirectUrisText: redirectUris.join("\n"),
    tenantApplicationId: readString(record.tenantApplicationId ?? record.tenant_application_id) || tenantApplicationId.trim(),
    tenantId: readString(record.tenantId ?? record.tenant_id) || tenantId.trim(),
  };
}

export function canSubmitAccountLinkUpdate(draft: SdkworkIamOauthAccountLinkUpdateDraft): boolean {
  return Boolean(draft.accountLinkId.trim() && draft.status.trim());
}

export function canSubmitOperationalResource(draft: SdkworkIamOauthOperationalResourceDraft): boolean {
  return Boolean(
    draft.integrationId.trim()
    && draft.resourceAccountId.trim()
    && draft.providerCode.trim()
    && draft.resourceKind.trim()
    && draft.resourceCode.trim()
    && draft.displayName.trim(),
  );
}

export function readAccountLinkId(item: unknown): string {
  const record = toRecord(item);
  return readString(record.id ?? record.accountLinkId ?? record.account_link_id);
}

export function extractProviderCodes(catalog: unknown[]): string[] {
  const codes = catalog.map((item) => {
    const record = toRecord(item);
    return readString(record.providerCode ?? record.provider_code);
  }).filter(Boolean);
  return [...new Set(codes)].sort();
}

export function formatDiagnosticRunDetail(detail: unknown): string {
  return formatResourceDetail(detail);
}

export function formatResourceDetail(detail: unknown): string {
  if (detail === undefined || detail === null) {
    return "";
  }
  try {
    return JSON.stringify(detail, null, 2);
  } catch {
    return String(detail);
  }
}

export function readProviderCatalogId(item: unknown): string {
  const record = toRecord(item);
  return readString(record.id ?? record.providerCatalogId ?? record.provider_catalog_id);
}

export function readGrantId(item: unknown): string {
  const record = toRecord(item);
  return readString(record.id ?? record.grantId ?? record.grant_id);
}

export function readIntegrationId(item: unknown): string {
  const record = toRecord(item);
  return readString(record.id ?? record.integrationId ?? record.integration_id);
}

export function readOAuthClientId(item: unknown): string {
  const record = toRecord(item);
  return readString(record.id ?? record.oauthClientId ?? record.oauth_client_id);
}

export function readSecretId(item: unknown): string {
  const record = toRecord(item);
  return readString(record.id ?? record.secretId ?? record.secret_id);
}

export function readSurfaceId(item: unknown): string {
  const record = toRecord(item);
  return readString(record.id ?? record.surfaceId ?? record.surface_id);
}

export function readOperationalResourceId(item: unknown): string {
  const record = toRecord(item);
  return readString(record.id ?? record.resourceId ?? record.resource_id);
}

export function readFlowConfigId(item: unknown): string {
  const record = toRecord(item);
  return readString(record.id ?? record.flowConfigId ?? record.flow_config_id);
}

export function readScopeProfileId(item: unknown): string {
  const record = toRecord(item);
  return readString(record.id ?? record.scopeProfileId ?? record.scope_profile_id);
}

export function readClaimMappingId(item: unknown): string {
  const record = toRecord(item);
  return readString(record.id ?? record.mappingId ?? record.mapping_id);
}

export function readPolicyId(item: unknown): string {
  const record = toRecord(item);
  return readString(record.id ?? record.policyId ?? record.policy_id);
}

export function readTenantBindingId(item: unknown): string {
  const record = toRecord(item);
  return readString(record.id ?? record.bindingId ?? record.binding_id);
}

export function readOperatorPlatformId(item: unknown): string {
  const record = toRecord(item);
  return readString(record.id ?? record.operatorPlatformId ?? record.operator_platform_id);
}

export function readWebhookConfigId(item: unknown): string {
  const record = toRecord(item);
  return readString(record.id ?? record.webhookConfigId ?? record.webhook_config_id);
}

export function readResourceAccountId(item: unknown): string {
  const record = toRecord(item);
  return readString(record.id ?? record.resourceAccountId ?? record.resource_account_id);
}

export function readResourceAuthorizationId(item: unknown): string {
  const record = toRecord(item);
  return readString(record.id ?? record.authorizationId ?? record.authorization_id);
}

export function readDiagnosticRunId(item: unknown): string {
  const record = toRecord(item);
  return readString(record.id ?? record.diagnosticRunId ?? record.diagnostic_run_id);
}

export function readStatus(item: unknown): string {
  const record = toRecord(item);
  return readString(record.status);
}

export function readEnabled(item: unknown): boolean | undefined {
  const record = toRecord(item);
  if (typeof record.enabled === "boolean") {
    return record.enabled;
  }
  if (typeof record.is_enabled === "boolean") {
    return record.is_enabled;
  }
  return undefined;
}

export function formatResourceLabel(item: unknown): string {
  const record = toRecord(item);
  const displayName = readString(record.displayName ?? record.display_name);
  const code = readString(
    record.integrationCode
      ?? record.integration_code
      ?? record.clientCode
      ?? record.client_code
      ?? record.surfaceCode
      ?? record.surface_code
      ?? record.webhookCode
      ?? record.webhook_code
      ?? record.externalClaim
      ?? record.external_claim
      ?? record.flowKind
      ?? record.flow_kind
      ?? record.scopeProfileCode
      ?? record.scope_profile_code
      ?? record.policyCode
      ?? record.policy_code
      ?? record.platformCode
      ?? record.platform_code
      ?? record.runKind
      ?? record.run_kind
      ?? record.bindingKind
      ?? record.binding_kind
      ?? record.resourceAccountCode
      ?? record.resource_account_code
      ?? record.authorizationMode
      ?? record.authorization_mode
      ?? record.resourceCode
      ?? record.resource_code
      ?? record.resourceKind
      ?? record.resource_kind
      ?? record.externalSubjectId
      ?? record.external_subject_id
      ?? record.userId
      ?? record.user_id
      ?? record.providerCode
      ?? record.provider_code
      ?? record.secretKind
      ?? record.secret_kind,
  );
  const provider = readString(record.providerCode ?? record.provider_code);
  const enabledLabel = typeof record.enabled === "boolean"
    ? (record.enabled ? "enabled" : "disabled")
    : "";
  const statusLabel = readString(
    record.status
      ?? record.secretConfigStatus
      ?? record.secret_config_status
      ?? record.resultCode
      ?? record.result_code
      ?? record.verificationStatus
      ?? record.verification_status
      ?? record.authorizationStatus
      ?? record.authorization_status,
  ) || enabledLabel;
  return [displayName || code || "Resource", provider ? `(${provider})` : "", statusLabel ? `[${statusLabel}]` : ""]
    .filter(Boolean)
    .join(" ");
}

export function readResourceKey(item: unknown, index: number): string {
  const record = toRecord(item);
  return readString(
    record.id
      ?? record.integrationId
      ?? record.surfaceId
      ?? record.oauthClientId
      ?? record.oauth_client_id
      ?? record.mappingId
      ?? record.webhookConfigId
      ?? record.flowConfigId
      ?? record.scopeProfileId
      ?? record.diagnosticRunId
      ?? record.resourceAccountId
      ?? record.resource_account_id
      ?? record.authorizationId
      ?? record.authorization_id
      ?? record.accountLinkId
      ?? record.account_link_id
      ?? record.grantId
      ?? record.grant_id
      ?? record.callbackEventId
      ?? record.callback_event_id,
  ) || `resource-${index}`;
}

function toRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? value as Record<string, unknown> : {};
}

function unwrapApiData(value: unknown): unknown {
  const record = toRecord(value);
  if ("data" in record) {
    return record.data;
  }
  return value;
}

function readStringList(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.map((entry) => readString(entry)).filter(Boolean);
}

function readBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function readString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}
