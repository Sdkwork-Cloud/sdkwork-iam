export const SDKWORK_ACCESS_TOKEN_ENV_KEY = 'SDKWORK_ACCESS_TOKEN';

const DEFAULT_IAM_TENANT_ID = '100001';
const DEFAULT_IAM_ORGANIZATION_ID = '0';
const SDKWORK_TOKEN_VERSION_CURRENT = 1;
const SUPPORTED_ENVIRONMENTS = new Set([
  'development',
  'test',
  'staging',
  'production',
]);

function normalizeText(value) {
  const normalized = String(value ?? '').trim();
  return normalized || undefined;
}

function encodeJwtPart(value) {
  const serialized = JSON.stringify(value);
  return globalThis.btoa(serialized).replace(/=+$/u, '');
}

function createLocalFixtureJwt(claims) {
  return [
    encodeJwtPart({ alg: 'none', typ: 'JWT' }),
    encodeJwtPart({ token_version: SDKWORK_TOKEN_VERSION_CURRENT, ...claims }),
    'signature',
  ].join('.');
}

function resolveAppIdFromManifest(manifest) {
  const appKey = normalizeText(manifest?.app?.key);
  if (appKey) {
    return appKey;
  }
  const legacyAppId = normalizeText(manifest?.app?.id);
  if (legacyAppId) {
    return legacyAppId;
  }
  throw new Error('sdkwork.app.config.json app.key is required for IAM bootstrap access token generation');
}

function resolveTenantIdFromManifest(manifest) {
  return normalizeText(manifest?.backend?.tenantId) ?? DEFAULT_IAM_TENANT_ID;
}

function resolveOrganizationIdFromManifest(manifest) {
  return normalizeText(manifest?.backend?.organizationId) ?? DEFAULT_IAM_ORGANIZATION_ID;
}

function resolvePermissionScopeFromManifest(manifest) {
  const scopes = manifest?.backend?.accessTokenPermissionScope;
  if (!Array.isArray(scopes)) {
    return [];
  }
  return scopes.map((scope) => normalizeText(scope)).filter(Boolean);
}

export function normalizeBootstrapEnvironment(value) {
  const normalized = normalizeText(value)?.toLowerCase();
  const environment = normalized === 'dev'
    ? 'development'
    : normalized === 'prod'
      ? 'production'
      : normalized;
  if (!environment || !SUPPORTED_ENVIRONMENTS.has(environment)) {
    throw new Error(
      `unsupported SDKWork environment "${value ?? ''}"; expected development, test, staging, or production`,
    );
  }
  return environment;
}

export function createDevBootstrapAccessTokenJwt(options = {}) {
  const manifest = options.manifest ?? {};
  const tenantId = normalizeText(options.tenantId) ?? resolveTenantIdFromManifest(manifest);
  const organizationId = normalizeText(options.organizationId)
    ?? resolveOrganizationIdFromManifest(manifest);
  const appId = normalizeText(options.appId) ?? resolveAppIdFromManifest(manifest);
  const environment = normalizeBootstrapEnvironment(options.environment ?? 'development');
  if (environment === 'staging' || environment === 'production') {
    throw new Error(`${environment} bootstrap access tokens must be provisioned by a private secret source`);
  }
  const nowUnixSeconds = Math.floor(Date.now() / 1000);

  return createLocalFixtureJwt({
    app_id: appId,
    deployment_mode: options.deploymentMode ?? 'saas',
    environment,
    exp: nowUnixSeconds + 86_400,
    login_scope: organizationId === '0' ? 'TENANT' : 'ORGANIZATION',
    organization_id: organizationId,
    permission_scope: options.permissionScope ?? resolvePermissionScopeFromManifest(manifest),
    runtime_target: options.runtimeTarget ?? 'browser',
    session_id: options.sessionId ?? `bootstrap-local-${environment}`,
    tenant_id: tenantId,
    token_kind: 'access',
    user_id: options.userId ?? '0',
  });
}

export function buildBootstrapAccessTokenEnvRecord(existingAccessToken, options = {}) {
  const configuredAccessToken = normalizeText(existingAccessToken);
  if (configuredAccessToken) {
    return { [SDKWORK_ACCESS_TOKEN_ENV_KEY]: configuredAccessToken };
  }

  const environment = normalizeBootstrapEnvironment(options.environment ?? 'development');
  const canGenerate = environment === 'development'
    || (environment === 'test' && options.allowTestTokenGeneration === true);
  if (!canGenerate) {
    const testHint = environment === 'test'
      ? ' or explicitly set allowTestTokenGeneration for an isolated test runtime'
      : '';
    throw new Error(
      `${SDKWORK_ACCESS_TOKEN_ENV_KEY} is required for ${environment}; provision it from a private secret source${testHint}`,
    );
  }

  return {
    [SDKWORK_ACCESS_TOKEN_ENV_KEY]: createDevBootstrapAccessTokenJwt({
      ...options,
      environment,
    }),
  };
}

export function mergeBootstrapAccessTokenEnv(env = {}, options = {}) {
  return {
    ...env,
    ...buildBootstrapAccessTokenEnvRecord(env[SDKWORK_ACCESS_TOKEN_ENV_KEY], options),
  };
}
