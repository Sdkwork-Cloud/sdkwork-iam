import { isBlank, trim } from '@sdkwork/utils';

const DEFAULT_IAM_TENANT_ID = '100001';
const DEFAULT_IAM_ORGANIZATION_ID = '0';

export interface CredentialEntryManifestIdentity {
  app?: { key?: string };
  backend?: { tenantId?: string; organizationId?: string };
}

export function resolveAppIdFromManifest(manifest: Pick<CredentialEntryManifestIdentity, 'app'>): string {
  const appKey = manifest.app?.key ? trim(manifest.app.key) : undefined;
  if (isBlank(appKey)) {
    throw new Error('sdkwork.app.config.json app.key is required for IAM runtime identity');
  }
  return appKey!;
}

export function resolveTenantIdFromManifest(manifest: Pick<CredentialEntryManifestIdentity, 'backend'>): string {
  const tenantId = manifest.backend?.tenantId ? trim(manifest.backend.tenantId) : undefined;
  return isBlank(tenantId) ? DEFAULT_IAM_TENANT_ID : tenantId!;
}

export function resolveOrganizationIdFromManifest(
  manifest: Pick<CredentialEntryManifestIdentity, 'backend'>,
): string {
  const organizationId = manifest.backend?.organizationId
    ? trim(manifest.backend.organizationId)
    : undefined;
  return organizationId ?? DEFAULT_IAM_ORGANIZATION_ID;
}
