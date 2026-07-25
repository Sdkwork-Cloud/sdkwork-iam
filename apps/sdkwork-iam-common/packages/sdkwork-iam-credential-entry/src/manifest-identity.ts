import { isBlank, trim } from '@sdkwork/utils';

const DEFAULT_IAM_TENANT_ID = '100001';
const DEFAULT_IAM_ORGANIZATION_ID = '0';

export interface CredentialEntryManifestIdentity {
  app?: { key?: string };
  backend?: { appId?: string; tenantId?: string; organizationId?: string };
}

export function resolveAppIdFromManifest(
  manifest: Pick<CredentialEntryManifestIdentity, 'app' | 'backend'>,
): string {
  const backendAppId = manifest.backend?.appId ? trim(manifest.backend.appId) : undefined;
  if (isBlank(backendAppId)) {
    throw new Error('sdkwork.app.config.json backend.appId is required for IAM runtime identity');
  }
  return backendAppId!;
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
