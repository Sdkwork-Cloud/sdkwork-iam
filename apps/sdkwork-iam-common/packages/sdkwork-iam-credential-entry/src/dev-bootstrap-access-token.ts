import { coalesce, trim } from '@sdkwork/utils';
import { createTestJwt } from '@sdkwork/runtime-bootstrap';

import { SDKWORK_ACCESS_TOKEN_ENV_KEY } from './constants.ts';
import {
  resolveAppIdFromManifest,
  resolveOrganizationIdFromManifest,
  resolveTenantIdFromManifest,
  type CredentialEntryManifestIdentity,
} from './manifest-identity.ts';

export interface CreateDevBootstrapAccessTokenOptions {
  appId?: string;
  deploymentMode?: string;
  environment?: string;
  manifest?: CredentialEntryManifestIdentity;
  organizationId?: string;
  runtimeTarget?: string;
  sessionId?: string;
  tenantId?: string;
  userId?: string;
}

function resolveIdentity(options: CreateDevBootstrapAccessTokenOptions = {}) {
  const manifest: CredentialEntryManifestIdentity = options.manifest ?? {
    app: options.appId ? { key: options.appId } : undefined,
    backend: {
      tenantId: options.tenantId,
      organizationId: options.organizationId,
    },
  };

  return {
    appId: options.appId ?? resolveAppIdFromManifest(manifest),
    organizationId: options.organizationId ?? resolveOrganizationIdFromManifest(manifest),
    tenantId: options.tenantId ?? resolveTenantIdFromManifest(manifest),
  };
}

export function createDevBootstrapAccessTokenJwt(
  options: CreateDevBootstrapAccessTokenOptions = {},
): string {
  const { appId, organizationId, tenantId } = resolveIdentity(options);
  const nowUnixSeconds = Math.floor(Date.now() / 1000);

  return createTestJwt({
    app_id: appId,
    deployment_mode: options.deploymentMode ?? 'saas',
    environment: options.environment ?? 'dev',
    exp: nowUnixSeconds + 86_400,
    login_scope: organizationId === '0' ? 'TENANT' : 'ORGANIZATION',
    organization_id: organizationId,
    runtime_target: options.runtimeTarget ?? 'browser',
    session_id: options.sessionId ?? 'bootstrap-local-dev',
    tenant_id: tenantId,
    token_kind: 'access',
    user_id: options.userId ?? '0',
  });
}

export function buildBootstrapAccessTokenEnvRecord(
  existingAccessToken?: string,
  options?: CreateDevBootstrapAccessTokenOptions,
): Record<string, string> {
  const normalized = coalesce(existingAccessToken);
  return {
    [SDKWORK_ACCESS_TOKEN_ENV_KEY]:
      normalized ?? createDevBootstrapAccessTokenJwt(options),
  };
}

export function mergeBootstrapAccessTokenEnv(
  env: Record<string, string | undefined>,
  options?: CreateDevBootstrapAccessTokenOptions,
): Record<string, string | undefined> {
  return {
    ...env,
    ...buildBootstrapAccessTokenEnvRecord(env[SDKWORK_ACCESS_TOKEN_ENV_KEY], options),
  };
}
