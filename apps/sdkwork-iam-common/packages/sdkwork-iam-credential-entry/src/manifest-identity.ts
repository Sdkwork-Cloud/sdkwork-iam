const DEFAULT_IAM_TENANT_ID = '100001';
const DEFAULT_IAM_ORGANIZATION_ID = '0';

export interface CredentialEntryManifestIdentity {
  app?: { key?: string };
  backend?: { tenantId?: string; organizationId?: string };
}

export function resolveAppIdFromManifest(manifest: Pick<CredentialEntryManifestIdentity, 'app'>): string {
  const appKey = manifest.app?.key?.trim();
  if (!appKey) {
    throw new Error('sdkwork.app.config.json app.key is required for IAM runtime identity');
  }
  return appKey;
}

export function resolveTenantIdFromManifest(manifest: Pick<CredentialEntryManifestIdentity, 'backend'>): string {
  const tenantId = manifest.backend?.tenantId?.trim();
  return tenantId || DEFAULT_IAM_TENANT_ID;
}

export function resolveOrganizationIdFromManifest(
  manifest: Pick<CredentialEntryManifestIdentity, 'backend'>,
): string {
  const organizationId = manifest.backend?.organizationId?.trim();
  return organizationId ?? DEFAULT_IAM_ORGANIZATION_ID;
}
