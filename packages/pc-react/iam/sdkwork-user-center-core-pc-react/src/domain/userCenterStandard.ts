import type {
  UserCenterAuthCachePolicy,
  UserCenterAuthHandshake,
  UserCenterAuthProfile,
  UserCenterAuthProfileInput,
  UserCenterBridgeConfig,
  UserCenterBridgeConfigInput,
  UserCenterClockInput,
  UserCenterHeaderSource,
  UserCenterHeaderValue,
  UserCenterHandshakeSignature,
  UserCenterHandshakeVerificationContext,
  UserCenterHandshakeVerificationContextInput,
  UserCenterHandshakeHeaderNames,
  UserCenterHandshakeMode,
  UserCenterHandshakeRequestHeaders,
  UserCenterProviderConfig,
  UserCenterRoutes,
  UserCenterRuntimeRequestMethod,
  UserCenterRuntimeConfig,
  UserCenterRuntimeConfigInput,
  UserCenterSecretResolverKind,
  UserCenterStandardEntityName,
  UserCenterStorageConfig,
  UserCenterStorageEntityBinding,
  UserCenterStorageEntityBindingInput,
  UserCenterStoragePlan,
  UserCenterStorageTopology,
  UserCenterTokenHeaders,
} from "../types/userCenterTypes.ts";
import {
  normalizeUserCenterNamespace,
  USER_CENTER_SESSION_HEADER_NAME,
} from "./userCenterStorage.ts";

export const USER_CENTER_DEFAULT_SQLITE_FILENAME = "user-center.db";
export const USER_CENTER_DEFAULT_TABLE_PREFIX = "iam_";
export const USER_CENTER_STANDARD_ENTITY_NAMES = [
  "IamUser",
  "IamTenant",
  "IamOrganizationMembership",
  "IamDepartmentAssignment",
  "IamPositionAssignment",
  "IamRoleBinding",
] as const satisfies readonly UserCenterStandardEntityName[];
export const USER_CENTER_DEFAULT_ROUTES: UserCenterRoutes = {
  authBasePath: "/auth",
  userRoutePath: "/user",
};
export const USER_CENTER_STANDARD_AUTHORIZATION_HEADER_NAME = "Authorization";
export const USER_CENTER_STANDARD_ACCESS_TOKEN_HEADER_NAME = "Access-Token";
export const USER_CENTER_STANDARD_REFRESH_TOKEN_HEADER_NAME = "Refresh-Token";
export const USER_CENTER_STANDARD_AUTHORIZATION_SCHEME = "Bearer";
export const USER_CENTER_STANDARD_HANDSHAKE_MODE: UserCenterHandshakeMode =
  "provider-shared-secret";
export const USER_CENTER_STANDARD_APP_ID_HEADER_NAME = "x-sdkwork-app-id";
export const USER_CENTER_STANDARD_PROVIDER_KEY_HEADER_NAME =
  "x-sdkwork-user-center-provider-key";
export const USER_CENTER_STANDARD_HANDSHAKE_MODE_HEADER_NAME =
  "x-sdkwork-user-center-handshake-mode";
export const USER_CENTER_STANDARD_SECRET_ID_HEADER_NAME =
  "x-sdkwork-user-center-secret-id";
export const USER_CENTER_STANDARD_SIGNATURE_HEADER_NAME =
  "x-sdkwork-user-center-signature";
export const USER_CENTER_STANDARD_SIGNED_AT_HEADER_NAME =
  "x-sdkwork-user-center-signed-at";
export const USER_CENTER_DEFAULT_SECRET_RESOLUTION_SCOPE = "organization-preferred";
export const USER_CENTER_DEFAULT_TENANT_CLAIM_KEY = "tenantId";
export const USER_CENTER_DEFAULT_ORGANIZATION_CLAIM_KEY = "organizationId";
export const USER_CENTER_DEFAULT_UNVERIFIED_CLAIMS_TTL_MS = 30_000;
export const USER_CENTER_DEFAULT_VERIFIED_TOKEN_TTL_MS = 30_000;
export const USER_CENTER_DEFAULT_SECRET_RESOLUTION_TTL_MS = 300_000;
export const USER_CENTER_DEFAULT_HANDSHAKE_FRESHNESS_WINDOW_MS = 30_000;

const DEFAULT_ENTITY_TABLE_SUFFIX: Record<UserCenterStandardEntityName, string> = {
  IamDepartmentAssignment: "department_assignment",
  IamOrganizationMembership: "organization_membership",
  IamPositionAssignment: "position_assignment",
  IamRoleBinding: "role_binding",
  IamTenant: "tenant",
  IamUser: "user",
};
const USER_CENTER_ALLOWED_INTERNAL_MODES = [
  "local-native",
  "app-api-hub",
  "external-hub",
] as const satisfies readonly (UserCenterRuntimeConfig["mode"] | UserCenterBridgeConfig["mode"])[];
const USER_CENTER_ALLOWED_PROVIDER_KINDS = [
  "header",
  "builtin-local",
  "sdkwork-cloud-app-api",
  "external-user-center",
] as const satisfies readonly UserCenterProviderConfig["kind"][];

function normalizeUserCenterModeValue(
  value: UserCenterRuntimeConfig["mode"] | UserCenterBridgeConfig["mode"] | string | undefined,
): UserCenterRuntimeConfig["mode"] | UserCenterBridgeConfig["mode"] | undefined {
  const normalized = normalizeUserCenterOptionalText(value)?.toLowerCase();
  if (!normalized) {
    return undefined;
  }

  if (normalized === "local-native") {
    return "local-native";
  }

  if (normalized === "app-api-hub") {
    return "app-api-hub";
  }

  if (normalized === "external-hub") {
    return "external-hub";
  }

  return undefined;
}

function normalizeUserCenterProviderKindValue(
  value: UserCenterProviderConfig["kind"] | string | undefined,
): UserCenterProviderConfig["kind"] | undefined {
  const normalized = normalizeUserCenterOptionalText(value)?.toLowerCase();
  if (!normalized) {
    return undefined;
  }

  if (normalized === "header") {
    return "header";
  }

  if (normalized === "builtin-local") {
    return "builtin-local";
  }

  if (normalized === "sdkwork-cloud-app-api") {
    return "sdkwork-cloud-app-api";
  }

  if (normalized === "external-user-center") {
    return "external-user-center";
  }

  return undefined;
}

function resolveUserCenterModeValue(
  value: UserCenterRuntimeConfig["mode"] | UserCenterBridgeConfig["mode"] | string | undefined,
): UserCenterRuntimeConfig["mode"] | UserCenterBridgeConfig["mode"] {
  const normalizedMode = normalizeUserCenterModeValue(value);
  if (normalizedMode) {
    return normalizedMode;
  }

  if (value === undefined) {
    return "local-native";
  }

  throw new TypeError(
    `User center mode must be one of: ${USER_CENTER_ALLOWED_INTERNAL_MODES.join(", ")}.`,
  );
}

function resolveUserCenterProviderKindValue(
  value: UserCenterProviderConfig["kind"] | string | undefined,
  mode:
    | UserCenterRuntimeConfig["mode"]
    | UserCenterBridgeConfig["mode"],
): UserCenterProviderConfig["kind"] {
  const normalizedKind = normalizeUserCenterProviderKindValue(value);
  if (normalizedKind) {
    return normalizedKind;
  }

  if (value === undefined) {
    return mode === "local-native"
      ? "builtin-local"
      : mode === "app-api-hub"
      ? "sdkwork-cloud-app-api"
      : "external-user-center";
  }

  throw new TypeError(
    `User center provider kind must be one of: ${USER_CENTER_ALLOWED_PROVIDER_KINDS.join(", ")}.`,
  );
}

function resolveExpectedUserCenterProviderKindForMode(
  mode:
    | UserCenterRuntimeConfig["mode"]
    | UserCenterBridgeConfig["mode"],
): Exclude<UserCenterProviderConfig["kind"], "header"> {
  return mode === "local-native"
    ? "builtin-local"
    : mode === "app-api-hub"
    ? "sdkwork-cloud-app-api"
    : "external-user-center";
}

function assertUserCenterProviderKindMatchesMode(
  value: UserCenterProviderConfig["kind"] | string | undefined,
  mode:
    | UserCenterRuntimeConfig["mode"]
    | UserCenterBridgeConfig["mode"],
): void {
  if (value === undefined) {
    return;
  }

  const normalizedKind = normalizeUserCenterProviderKindValue(value);
  if (!normalizedKind || normalizedKind === "header") {
    return;
  }

  const expectedKind = resolveExpectedUserCenterProviderKindForMode(mode);
  if (normalizedKind !== expectedKind) {
    throw new TypeError(
      `User center provider kind ${normalizedKind} is incompatible with mode ${mode}. Expected ${expectedKind}.`,
    );
  }
}

function normalizePositiveInteger(value: number | undefined, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? Math.trunc(value)
    : fallback;
}

function normalizeRequiredText(value: string | undefined, fieldName: string): string {
  const normalized = normalizeUserCenterOptionalText(value);
  if (!normalized) {
    throw new TypeError(`User center ${fieldName} must be a non-empty string.`);
  }

  return normalized;
}

export function normalizeUserCenterPath(path: string | undefined, fallback: string): string {
  const normalized = path?.trim();
  if (!normalized || normalized === "/") {
    return fallback;
  }

  const prefixed = normalized.startsWith("/") ? normalized : `/${normalized}`;
  return prefixed.replace(/\/+$/g, "");
}

export function normalizeUserCenterOptionalText(value: string | undefined): string | undefined {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

function normalizeHeaderMap(
  headers: Record<string, string> | undefined,
): Record<string, string> | undefined {
  if (!headers) {
    return undefined;
  }

  const normalizedEntries = Object.entries(headers)
    .map(([key, value]) => [key.trim(), String(value).trim()] as const)
    .filter(([key, value]) => key.length > 0 && value.length > 0);

  if (normalizedEntries.length === 0) {
    return undefined;
  }

  return Object.fromEntries(normalizedEntries);
}

function normalizeUserCenterHeaderValue(value: UserCenterHeaderValue): string | undefined {
  if (Array.isArray(value)) {
    for (const entry of value) {
      const normalizedEntry = normalizeUserCenterOptionalText(String(entry));
      if (normalizedEntry) {
        return normalizedEntry;
      }
    }

    return undefined;
  }

  if (value === null || value === undefined) {
    return undefined;
  }

  return normalizeUserCenterOptionalText(String(value));
}

function readUserCenterHeaderValue(
  headers: UserCenterHeaderSource,
  headerName: string,
): string | undefined {
  if (typeof headers.get === "function") {
    return normalizeUserCenterOptionalText(headers.get(headerName) ?? undefined);
  }

  const expectedHeaderName = headerName.toLowerCase();
  for (const [candidateHeaderName, candidateValue] of Object.entries(headers)) {
    if (candidateHeaderName.toLowerCase() !== expectedHeaderName) {
      continue;
    }

    return normalizeUserCenterHeaderValue(candidateValue);
  }

  return undefined;
}

function resolveUserCenterClockMs(
  value: UserCenterClockInput | undefined,
  fieldName: string,
): number {
  if (value === undefined) {
    return Date.now();
  }

  if (value instanceof Date) {
    const timeValue = value.getTime();
    if (!Number.isFinite(timeValue)) {
      throw new TypeError(`User center ${fieldName} must resolve to a valid timestamp.`);
    }

    return timeValue;
  }

  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new TypeError(`User center ${fieldName} must resolve to a valid timestamp.`);
    }

    return Math.trunc(value);
  }

  const resolvedMs = Date.parse(value);
  if (!Number.isFinite(resolvedMs)) {
    throw new TypeError(`User center ${fieldName} must resolve to a valid timestamp.`);
  }

  return resolvedMs;
}

export function normalizeUserCenterIdentifier(value: string | undefined): string | undefined {
  const normalized = value
    ?.trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/^_+/g, "")
    .replace(/_+$/g, "");

  return normalized ? normalized : undefined;
}

export function normalizeUserCenterDatabaseKey(value: string | undefined): string | undefined {
  const normalized = value
    ?.trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+/g, "")
    .replace(/-+$/g, "");

  return normalized ? normalized : undefined;
}

export function normalizeUserCenterTablePrefix(value: string | undefined): string {
  const normalized = normalizeUserCenterIdentifier(value);
  if (!normalized) {
    return USER_CENTER_DEFAULT_TABLE_PREFIX;
  }

  return normalized.endsWith("_") ? normalized : `${normalized}_`;
}

export function normalizeUserCenterProviderConfig(
  namespace: string,
  provider: UserCenterRuntimeConfigInput["provider"] | UserCenterBridgeConfigInput["provider"],
  mode: UserCenterRuntimeConfig["mode"] | UserCenterBridgeConfig["mode"],
): UserCenterProviderConfig {
  const normalizedMode = resolveUserCenterModeValue(mode);
  assertUserCenterProviderKindMatchesMode(provider?.kind, normalizedMode);
  const kind = resolveUserCenterProviderKindValue(provider?.kind, normalizedMode);
  const normalizedBaseUrl = normalizeUserCenterOptionalText(provider?.baseUrl)?.replace(
    /\/+$/g,
    "",
  );
  const normalizedHeaders = normalizeHeaderMap(provider?.headers);
  const normalizedProviderKey = provider?.providerKey
    ? normalizeUserCenterNamespace(provider.providerKey)
    : kind === "sdkwork-cloud-app-api"
    ? `${namespace}-remote`
    : kind === "external-user-center"
    ? `${namespace}-external`
    : kind === "header"
    ? `${namespace}-header`
    : `${namespace}-local`;

  return {
    ...(normalizedBaseUrl ? { baseUrl: normalizedBaseUrl } : {}),
    ...(normalizedHeaders ? { headers: normalizedHeaders } : {}),
    kind,
    providerKey: normalizedProviderKey,
  };
}

export function normalizeUserCenterRoutes(
  routes: Partial<UserCenterRoutes> | undefined,
): UserCenterRoutes {
  return {
    authBasePath: normalizeUserCenterPath(
      routes?.authBasePath,
      USER_CENTER_DEFAULT_ROUTES.authBasePath,
    ),
    userRoutePath: normalizeUserCenterPath(
      routes?.userRoutePath,
      USER_CENTER_DEFAULT_ROUTES.userRoutePath,
    ),
  };
}

function createDefaultTableName(
  standardEntityName: UserCenterStandardEntityName,
  tablePrefix: string,
): string {
  return `${tablePrefix}${DEFAULT_ENTITY_TABLE_SUFFIX[standardEntityName]}`;
}

function normalizeUserCenterEntityBindings(
  tablePrefix: string,
  bindings: UserCenterStorageEntityBindingInput[] | undefined,
): UserCenterStorageEntityBinding[] {
  const explicitBindings = new Map(
    (bindings ?? []).map((binding) => [binding.standardEntityName, binding]),
  );

  return USER_CENTER_STANDARD_ENTITY_NAMES.map((standardEntityName) => {
    const explicitBinding = explicitBindings.get(standardEntityName);

    return {
      primaryKeyColumnName:
        normalizeUserCenterIdentifier(explicitBinding?.primaryKeyColumnName) ?? "id",
      standardEntityName,
      tableName:
        normalizeUserCenterIdentifier(explicitBinding?.tableName)
        ?? createDefaultTableName(standardEntityName, tablePrefix),
    };
  });
}

export function normalizeUserCenterStorageTopology(
  namespace: string,
  storageTopology:
    | UserCenterRuntimeConfigInput["storageTopology"]
    | UserCenterBridgeConfigInput["storageTopology"],
  storage?: UserCenterStorageConfig,
): UserCenterStorageTopology {
  const tablePrefix = normalizeUserCenterTablePrefix(storageTopology?.tablePrefix);
  const schemaName =
    normalizeUserCenterIdentifier(storageTopology?.schemaName)
    ?? (storage?.dialect === "postgresql"
      ? normalizeUserCenterIdentifier(storage.schema)
      : undefined);

  return {
    databaseKey:
      normalizeUserCenterDatabaseKey(storageTopology?.databaseKey)
      ?? `${namespace}-user-center`,
    entityBindings: normalizeUserCenterEntityBindings(
      tablePrefix,
      storageTopology?.entityBindings,
    ),
    migrationNamespace:
      normalizeUserCenterOptionalText(storageTopology?.migrationNamespace)
      ?? `${namespace}.user-center`,
    ...(schemaName ? { schemaName } : {}),
    tablePrefix,
  };
}

export function createUserCenterStandardTokenHeaders(
  storagePlan: Pick<UserCenterStoragePlan, "sessionHeaderName">,
): UserCenterTokenHeaders {
  return {
    accessTokenHeaderName: USER_CENTER_STANDARD_ACCESS_TOKEN_HEADER_NAME,
    authorizationHeaderName: USER_CENTER_STANDARD_AUTHORIZATION_HEADER_NAME,
    authorizationScheme: USER_CENTER_STANDARD_AUTHORIZATION_SCHEME,
    refreshTokenHeaderName: USER_CENTER_STANDARD_REFRESH_TOKEN_HEADER_NAME,
    sessionHeaderName: storagePlan.sessionHeaderName || USER_CENTER_SESSION_HEADER_NAME,
  };
}

export function createUserCenterDefaultAuthCachePolicy(): UserCenterAuthCachePolicy {
  return {
    bundleMemoryCache: true,
    secretResolutionTtlMs: USER_CENTER_DEFAULT_SECRET_RESOLUTION_TTL_MS,
    unverifiedClaimsTtlMs: USER_CENTER_DEFAULT_UNVERIFIED_CLAIMS_TTL_MS,
    verifiedTokenTtlMs: USER_CENTER_DEFAULT_VERIFIED_TOKEN_TTL_MS,
  };
}

export function createUserCenterStandardHandshakeHeaderNames(): UserCenterHandshakeHeaderNames {
  return {
    appIdHeaderName: USER_CENTER_STANDARD_APP_ID_HEADER_NAME,
    providerKeyHeaderName: USER_CENTER_STANDARD_PROVIDER_KEY_HEADER_NAME,
    secretIdHeaderName: USER_CENTER_STANDARD_SECRET_ID_HEADER_NAME,
    signatureHeaderName: USER_CENTER_STANDARD_SIGNATURE_HEADER_NAME,
    signedAtHeaderName: USER_CENTER_STANDARD_SIGNED_AT_HEADER_NAME,
  };
}

function resolveDefaultSecretResolverKind(
  mode: UserCenterAuthProfile["mode"],
): UserCenterSecretResolverKind {
  return mode === "upstream-app-api-token-bridge"
    ? "upstream-secret-bridge"
    : mode === "upstream-external-token-bridge"
    ? "external-secret-bridge"
    : "local-static";
}

function normalizeUserCenterTokenHeaders(
  storagePlan: Pick<UserCenterStoragePlan, "sessionHeaderName">,
  tokenHeaders: UserCenterAuthProfileInput["tokenHeaders"],
): UserCenterTokenHeaders {
  const defaults = createUserCenterStandardTokenHeaders(storagePlan);

  return {
    accessTokenHeaderName:
      normalizeUserCenterOptionalText(tokenHeaders?.accessTokenHeaderName)
      ?? defaults.accessTokenHeaderName,
    authorizationHeaderName:
      normalizeUserCenterOptionalText(tokenHeaders?.authorizationHeaderName)
      ?? defaults.authorizationHeaderName,
    authorizationScheme:
      normalizeUserCenterOptionalText(tokenHeaders?.authorizationScheme)
      ?? defaults.authorizationScheme,
    refreshTokenHeaderName:
      normalizeUserCenterOptionalText(tokenHeaders?.refreshTokenHeaderName)
      ?? defaults.refreshTokenHeaderName,
    sessionHeaderName:
      normalizeUserCenterOptionalText(tokenHeaders?.sessionHeaderName)
      ?? defaults.sessionHeaderName,
  };
}

function normalizeUserCenterHandshakeHeaderNames(
  headerNames: Partial<UserCenterHandshakeHeaderNames> | undefined,
): UserCenterHandshakeHeaderNames {
  const defaults = createUserCenterStandardHandshakeHeaderNames();

  return {
    appIdHeaderName:
      normalizeUserCenterOptionalText(headerNames?.appIdHeaderName)
      ?? defaults.appIdHeaderName,
    providerKeyHeaderName:
      normalizeUserCenterOptionalText(headerNames?.providerKeyHeaderName)
      ?? defaults.providerKeyHeaderName,
    secretIdHeaderName:
      normalizeUserCenterOptionalText(headerNames?.secretIdHeaderName)
      ?? defaults.secretIdHeaderName,
    signatureHeaderName:
      normalizeUserCenterOptionalText(headerNames?.signatureHeaderName)
      ?? defaults.signatureHeaderName,
    signedAtHeaderName:
      normalizeUserCenterOptionalText(headerNames?.signedAtHeaderName)
      ?? defaults.signedAtHeaderName,
  };
}

function createDefaultHandshakeStaticHeaders(
  namespace: string,
  provider: Pick<UserCenterProviderConfig, "providerKey">,
  headerNames: UserCenterHandshakeHeaderNames,
  handshakeMode: UserCenterHandshakeMode,
): Record<string, string> {
  if (handshakeMode === "disabled") {
    return {};
  }

  return {
    [headerNames.appIdHeaderName]: namespace,
    [USER_CENTER_STANDARD_HANDSHAKE_MODE_HEADER_NAME]: handshakeMode,
    [headerNames.providerKeyHeaderName]: provider.providerKey,
  };
}

function normalizeUserCenterHandshake(
  namespace: string,
  provider: Pick<UserCenterProviderConfig, "providerKey">,
  authMode: UserCenterAuthProfile["mode"],
  handshake: UserCenterAuthProfileInput["handshake"],
): UserCenterAuthHandshake {
  const headerNames = normalizeUserCenterHandshakeHeaderNames(handshake?.headerNames);
  const upstreamBridgeEnabled =
    authMode === "upstream-app-api-token-bridge"
    || authMode === "upstream-external-token-bridge";
  const defaultMode = upstreamBridgeEnabled
    ? USER_CENTER_STANDARD_HANDSHAKE_MODE
    : "disabled";
  const mode = handshake?.mode ?? defaultMode;
  const enabled = handshake?.enabled ?? upstreamBridgeEnabled;
  const staticHeaders = normalizeHeaderMap(handshake?.staticHeaders);

  return {
    enabled,
    freshnessWindowMs: normalizePositiveInteger(
      handshake?.freshnessWindowMs,
      USER_CENTER_DEFAULT_HANDSHAKE_FRESHNESS_WINDOW_MS,
    ),
    headerNames,
    mode,
    staticHeaders:
      staticHeaders
      ?? (enabled
        ? createDefaultHandshakeStaticHeaders(namespace, provider, headerNames, mode)
        : {}),
  };
}

export function normalizeUserCenterAuthProfile(options: {
  auth?: UserCenterAuthProfileInput;
  mode: UserCenterRuntimeConfig["mode"] | UserCenterBridgeConfig["mode"];
  namespace: string;
  provider: UserCenterProviderConfig;
  storagePlan: UserCenterStoragePlan;
}): UserCenterAuthProfile {
  const defaultMode = options.mode === "app-api-hub"
    ? "upstream-app-api-token-bridge"
    : options.mode === "external-hub"
    ? "upstream-external-token-bridge"
    : "dual-token";
  const authMode = options.auth?.mode ?? defaultMode;
  const validationStrategy = options.auth?.validationStrategy ?? "dual-token";
  const secretResolverKind =
    options.auth?.secretResolution?.resolverKind ?? resolveDefaultSecretResolverKind(authMode);
  const tokenHeaders = normalizeUserCenterTokenHeaders(
    options.storagePlan,
    options.auth?.tokenHeaders,
  );
  const cachePolicyDefaults = createUserCenterDefaultAuthCachePolicy();

  return {
    cachePolicy: {
      bundleMemoryCache: options.auth?.cachePolicy?.bundleMemoryCache ?? true,
      secretResolutionTtlMs: normalizePositiveInteger(
        options.auth?.cachePolicy?.secretResolutionTtlMs,
        cachePolicyDefaults.secretResolutionTtlMs,
      ),
      unverifiedClaimsTtlMs: normalizePositiveInteger(
        options.auth?.cachePolicy?.unverifiedClaimsTtlMs,
        cachePolicyDefaults.unverifiedClaimsTtlMs,
      ),
      verifiedTokenTtlMs: normalizePositiveInteger(
        options.auth?.cachePolicy?.verifiedTokenTtlMs,
        cachePolicyDefaults.verifiedTokenTtlMs,
      ),
    },
    handshake: normalizeUserCenterHandshake(
      options.namespace,
      options.provider,
      authMode,
      options.auth?.handshake,
    ),
    mode: authMode,
    secretResolution: {
      organizationClaimKey:
        normalizeUserCenterOptionalText(options.auth?.secretResolution?.organizationClaimKey)
        ?? USER_CENTER_DEFAULT_ORGANIZATION_CLAIM_KEY,
      resolverKind: secretResolverKind,
      scope:
        options.auth?.secretResolution?.scope
        ?? USER_CENTER_DEFAULT_SECRET_RESOLUTION_SCOPE,
      tenantClaimKey:
        normalizeUserCenterOptionalText(options.auth?.secretResolution?.tenantClaimKey)
        ?? USER_CENTER_DEFAULT_TENANT_CLAIM_KEY,
    },
    tokenHeaders,
    validationStrategy,
  };
}

export function normalizeUserCenterIntegrationProfiles(
  namespace: string,
  mode: UserCenterRuntimeConfig["mode"] | UserCenterBridgeConfig["mode"],
  localApiBasePath: string,
  providers: {
    active: UserCenterProviderConfig;
    externalAppApi: UserCenterProviderConfig;
    externalUserCenter?: UserCenterProviderConfig;
  },
  authProfiles: {
    builtinLocal: UserCenterAuthProfile;
    externalAppApi: UserCenterAuthProfile;
    externalUserCenter?: UserCenterAuthProfile;
  },
): UserCenterRuntimeConfig["integration"] {
  const externalProviderKey = providers.externalAppApi.providerKey;
  const externalEnabled =
    mode === "app-api-hub" || providers.active.kind === "sdkwork-cloud-app-api";
  const externalUserCenterEnabled =
    mode === "external-hub" || providers.active.kind === "external-user-center";

  return {
    activeKind:
      mode === "local-native"
        ? "builtin-local"
        : mode === "app-api-hub"
        ? "sdkwork-cloud-app-api"
        : "external-user-center",
    builtinLocal: {
      authMode: authProfiles.builtinLocal.mode,
      enabled: true,
      handshakeEnabled: authProfiles.builtinLocal.handshake.enabled,
      kind: "builtin-local",
      localApiBasePath,
      secretResolverKind: authProfiles.builtinLocal.secretResolution.resolverKind,
      sessionTransport: "header",
      userSystemScope: "application",
      validationStrategy: authProfiles.builtinLocal.validationStrategy,
    },
    externalAppApi: {
      authMode: authProfiles.externalAppApi.mode,
      enabled: externalEnabled,
      handshakeEnabled: externalEnabled && authProfiles.externalAppApi.handshake.enabled,
      kind: "sdkwork-cloud-app-api",
      providerKey: externalProviderKey,
      secretResolverKind: authProfiles.externalAppApi.secretResolution.resolverKind,
      sessionTransport: "header",
      ...(providers.externalAppApi.baseUrl
        ? { upstreamBaseUrl: providers.externalAppApi.baseUrl }
        : {}),
      validationStrategy: authProfiles.externalAppApi.validationStrategy,
    },
    ...(externalUserCenterEnabled && authProfiles.externalUserCenter
      ? {
          externalUserCenter: {
            authMode: authProfiles.externalUserCenter.mode,
            enabled: externalUserCenterEnabled,
            handshakeEnabled:
              externalUserCenterEnabled && authProfiles.externalUserCenter.handshake.enabled,
            kind: "external-user-center",
            providerKey:
              providers.externalUserCenter?.providerKey ?? `${namespace}-external`,
            secretResolverKind:
              authProfiles.externalUserCenter.secretResolution.resolverKind,
            sessionTransport: "header",
            ...(providers.externalUserCenter?.baseUrl
              ? { upstreamBaseUrl: providers.externalUserCenter.baseUrl }
              : {}),
            validationStrategy: authProfiles.externalUserCenter.validationStrategy,
          },
        }
      : {}),
  };
}

export function isUserCenterUpstreamIntegrationActive(
  config: Pick<UserCenterRuntimeConfig | UserCenterBridgeConfig, "integration">,
): boolean {
  return config.integration.activeKind !== "builtin-local";
}

export function createUserCenterStandardHandshakeHeaders(
  config: Pick<UserCenterRuntimeConfig | UserCenterBridgeConfig, "auth">,
): Record<string, string> {
  if (!config.auth.handshake.enabled) {
    return {};
  }

  return {
    ...config.auth.handshake.staticHeaders,
  };
}

export function createUserCenterHandshakeSigningMessage(options: {
  config: Pick<UserCenterRuntimeConfig | UserCenterBridgeConfig, "auth">;
  method: UserCenterRuntimeRequestMethod;
  path: string;
  signedAt: string;
}): string {
  if (!options.config.auth.handshake.enabled) {
    throw new TypeError("User center handshake signing is unavailable when handshake is disabled.");
  }

  const handshakeHeaders = createUserCenterStandardHandshakeHeaders(options.config);
  const headerNames = options.config.auth.handshake.headerNames;
  const appId = normalizeRequiredText(
    handshakeHeaders[headerNames.appIdHeaderName],
    "handshake app id",
  );
  const providerKey = normalizeRequiredText(
    handshakeHeaders[headerNames.providerKeyHeaderName],
    "handshake provider key",
  );
  const handshakeMode = normalizeRequiredText(
    handshakeHeaders[USER_CENTER_STANDARD_HANDSHAKE_MODE_HEADER_NAME]
      ?? options.config.auth.handshake.mode,
    "handshake mode",
  );
  const method = normalizeRequiredText(options.method, "handshake method").toUpperCase();
  const path = normalizeUserCenterPath(options.path, "/");
  const signedAt = normalizeRequiredText(options.signedAt, "handshake signedAt");

  return [appId, providerKey, handshakeMode, method, path, signedAt].join("\n");
}

export function createUserCenterSignedHandshakeHeaders(
  config: Pick<UserCenterRuntimeConfig | UserCenterBridgeConfig, "auth">,
  signature: UserCenterHandshakeSignature,
): Record<string, string> {
  if (!config.auth.handshake.enabled) {
    return {};
  }

  const headerNames = config.auth.handshake.headerNames;

  return {
    ...createUserCenterStandardHandshakeHeaders(config),
    [headerNames.secretIdHeaderName]:
      normalizeRequiredText(signature.secretId, "handshake secretId"),
    [headerNames.signatureHeaderName]:
      normalizeRequiredText(signature.signature, "handshake signature"),
    [headerNames.signedAtHeaderName]:
      normalizeRequiredText(signature.signedAt, "handshake signedAt"),
  };
}

export function filterUserCenterGovernedHeaders(
  config: Pick<UserCenterRuntimeConfig | UserCenterBridgeConfig, "auth">,
  headers: Record<string, string> | undefined,
): Record<string, string> | undefined {
  if (!headers) {
    return undefined;
  }

  const governedHeaderNameSet = createUserCenterGovernedHeaderNameSet(config);
  const filteredEntries = Object.entries(headers).filter(([headerName]) =>
    !governedHeaderNameSet.has(headerName.toLowerCase())
  );

  if (filteredEntries.length === 0) {
    return undefined;
  }

  return Object.fromEntries(filteredEntries);
}

function resolveUserCenterRequiredHeaderValue(
  headers: UserCenterHeaderSource,
  headerName: string,
  fieldName: string,
): string {
  return normalizeRequiredText(readUserCenterHeaderValue(headers, headerName), fieldName);
}

function resolveUserCenterHandshakeRequestHeaders(
  config: Pick<UserCenterRuntimeConfig | UserCenterBridgeConfig, "auth">,
  headers: UserCenterHeaderSource,
): UserCenterHandshakeRequestHeaders {
  const headerNames = config.auth.handshake.headerNames;

  return {
    appId: resolveUserCenterRequiredHeaderValue(
      headers,
      headerNames.appIdHeaderName,
      "handshake app id",
    ),
    handshakeMode: resolveUserCenterRequiredHeaderValue(
      headers,
      USER_CENTER_STANDARD_HANDSHAKE_MODE_HEADER_NAME,
      "handshake mode",
    ) as UserCenterHandshakeMode,
    providerKey: resolveUserCenterRequiredHeaderValue(
      headers,
      headerNames.providerKeyHeaderName,
      "handshake provider key",
    ),
    secretId: resolveUserCenterRequiredHeaderValue(
      headers,
      headerNames.secretIdHeaderName,
      "handshake secretId",
    ),
    signature: resolveUserCenterRequiredHeaderValue(
      headers,
      headerNames.signatureHeaderName,
      "handshake signature",
    ),
    signedAt: resolveUserCenterRequiredHeaderValue(
      headers,
      headerNames.signedAtHeaderName,
      "handshake signedAt",
    ),
  };
}

export function createUserCenterHandshakeVerificationContext(
  options: UserCenterHandshakeVerificationContextInput,
): UserCenterHandshakeVerificationContext {
  if (!options.config.auth.handshake.enabled) {
    throw new TypeError(
      "User center handshake verification is unavailable when handshake is disabled.",
    );
  }

  const handshake = resolveUserCenterHandshakeRequestHeaders(options.config, options.headers);
  const standardHandshakeHeaders = createUserCenterStandardHandshakeHeaders(options.config);
  const expectedAppId = normalizeRequiredText(
    standardHandshakeHeaders[options.config.auth.handshake.headerNames.appIdHeaderName],
    "handshake app id",
  );
  const expectedProviderKey = normalizeRequiredText(
    standardHandshakeHeaders[options.config.auth.handshake.headerNames.providerKeyHeaderName],
    "handshake provider key",
  );
  const expectedHandshakeMode = normalizeRequiredText(
    standardHandshakeHeaders[USER_CENTER_STANDARD_HANDSHAKE_MODE_HEADER_NAME]
      ?? options.config.auth.handshake.mode,
    "handshake mode",
  );

  if (handshake.appId !== expectedAppId) {
    throw new Error(
      `User center handshake app id mismatch: expected ${expectedAppId}, received ${handshake.appId}.`,
    );
  }
  if (handshake.providerKey !== expectedProviderKey) {
    throw new Error(
      `User center handshake provider key mismatch: expected ${expectedProviderKey}, received ${handshake.providerKey}.`,
    );
  }
  if (handshake.handshakeMode !== expectedHandshakeMode) {
    throw new Error(
      `User center handshake mode mismatch: expected ${expectedHandshakeMode}, received ${handshake.handshakeMode}.`,
    );
  }

  const signedAtEpochMs = resolveUserCenterClockMs(handshake.signedAt, "handshake signedAt");
  const nowMs = resolveUserCenterClockMs(options.now, "handshake now");
  const maxSignedAtAgeMs = normalizePositiveInteger(
    options.maxSignedAtAgeMs,
    options.config.auth.handshake.freshnessWindowMs,
  );
  const ageMs = Math.abs(nowMs - signedAtEpochMs);
  if (ageMs > maxSignedAtAgeMs) {
    throw new Error(
      `User center handshake signed-at freshness window exceeded: age ${ageMs}ms > ${maxSignedAtAgeMs}ms.`,
    );
  }

  return {
    ageMs,
    handshake,
    signedAtEpochMs,
    signingMessage: createUserCenterHandshakeSigningMessage({
      config: options.config,
      method: options.method,
      path: options.path,
      signedAt: handshake.signedAt,
    }),
  };
}

export function createUserCenterGovernedHeaderNameSet(
  config: Pick<UserCenterRuntimeConfig | UserCenterBridgeConfig, "auth">,
): Set<string> {
  const governedHeaderNames = new Set<string>([
    config.auth.tokenHeaders.authorizationHeaderName.toLowerCase(),
    config.auth.tokenHeaders.accessTokenHeaderName.toLowerCase(),
    config.auth.tokenHeaders.refreshTokenHeaderName.toLowerCase(),
    config.auth.tokenHeaders.sessionHeaderName.toLowerCase(),
  ]);

  if (!config.auth.handshake.enabled) {
    return governedHeaderNames;
  }

  governedHeaderNames.add(config.auth.handshake.headerNames.appIdHeaderName.toLowerCase());
  governedHeaderNames.add(USER_CENTER_STANDARD_HANDSHAKE_MODE_HEADER_NAME.toLowerCase());
  governedHeaderNames.add(
    config.auth.handshake.headerNames.providerKeyHeaderName.toLowerCase(),
  );
  governedHeaderNames.add(config.auth.handshake.headerNames.secretIdHeaderName.toLowerCase());
  governedHeaderNames.add(config.auth.handshake.headerNames.signatureHeaderName.toLowerCase());
  governedHeaderNames.add(config.auth.handshake.headerNames.signedAtHeaderName.toLowerCase());

  return governedHeaderNames;
}
