import type {
  CreateIdentityDeploymentProfileOptions,
  IdentityAuthorityKind,
  IdentityDeploymentMode,
  IdentityDeploymentProfile,
  IdentityStorageKind,
  IdentityTransportKind,
  UserCenterBridgeConfig,
  UserCenterDeploymentArtifact,
  UserCenterDeploymentEnvArtifactForProfileOptions,
  UserCenterDeploymentEnvArtifactOptions,
  UserCenterDeploymentEnvironmentVariable,
  UserCenterDeploymentEnvTemplateOptions,
  UserCenterDeploymentHandshakeContract,
  UserCenterDeploymentProfile,
  UserCenterDeploymentProfileSet,
  UserCenterDeploymentVariable,
  UserCenterDeploymentVariableTarget,
} from "../types/userCenterTypes.ts";
import { USER_CENTER_STANDARD_HANDSHAKE_MODE_HEADER_NAME } from "./userCenterStandard.ts";

export const USER_CENTER_DEPLOYMENT_VARIABLE_NAMES = Object.freeze({
  accessTokenHeaderName: "USER_CENTER_ACCESS_TOKEN_HEADER_NAME",
  appApiBaseUrl: "SDKWORK_USER_CENTER_APP_API_BASE_URL",
  appId: "SDKWORK_USER_CENTER_APP_ID",
  authorizationHeaderName: "SDKWORK_USER_CENTER_AUTHORIZATION_HEADER_NAME",
  authorizationScheme: "SDKWORK_USER_CENTER_AUTHORIZATION_SCHEME",
  databaseUrl: "SDKWORK_USER_CENTER_DATABASE_URL",
  externalBaseUrl: "SDKWORK_USER_CENTER_EXTERNAL_BASE_URL",
  externalOrganizationHeaderName: "SDKWORK_USER_CENTER_EXTERNAL_ORGANIZATION_HEADER",
  externalTenantHeaderName: "SDKWORK_USER_CENTER_EXTERNAL_TENANT_HEADER",
  handshakeFreshnessWindowMs: "SDKWORK_USER_CENTER_HANDSHAKE_FRESHNESS_WINDOW_MS",
  localApiBasePath: "SDKWORK_USER_CENTER_LOCAL_API_BASE_PATH",
  mode: "SDKWORK_USER_CENTER_MODE",
  providerKey: "SDKWORK_USER_CENTER_PROVIDER_KEY",
  refreshTokenHeaderName: "SDKWORK_USER_CENTER_REFRESH_TOKEN_HEADER_NAME",
  schemaName: "SDKWORK_USER_CENTER_SCHEMA_NAME",
  secretId: "SDKWORK_USER_CENTER_SECRET_ID",
  sessionHeaderName: "SDKWORK_USER_CENTER_SESSION_HEADER_NAME",
  sharedSecret: "SDKWORK_USER_CENTER_SHARED_SECRET",
  sqlitePath: "SDKWORK_USER_CENTER_SQLITE_PATH",
  tablePrefix: "SDKWORK_USER_CENTER_TABLE_PREFIX",
} as const);

const APPLICATION_RUNTIME_TARGET = "application-runtime" as const satisfies UserCenterDeploymentVariableTarget;
const LOCAL_AUTHORITY_TARGET = "local-authority" as const satisfies UserCenterDeploymentVariableTarget;
const UPSTREAM_BRIDGE_TARGET = "upstream-bridge" as const satisfies UserCenterDeploymentVariableTarget;
const EXTERNAL_AUTHORITY_BRIDGE_TARGET =
  "external-authority-bridge" as const satisfies UserCenterDeploymentVariableTarget;

function toUniqueDeploymentTargets(
  targets: readonly UserCenterDeploymentVariableTarget[],
): UserCenterDeploymentVariableTarget[] {
  return Array.from(new Set(targets));
}

function createBaseDeploymentVariables(options: {
  auth: UserCenterBridgeConfig["auth"];
  localApiBasePath: string;
  mode: string;
  providerKey: string;
  targets: readonly UserCenterDeploymentVariableTarget[];
}): UserCenterDeploymentVariable[] {
  const targets = toUniqueDeploymentTargets(options.targets);

  return [
    {
      canonicalName: USER_CENTER_DEPLOYMENT_VARIABLE_NAMES.mode,
      defaultValue: options.mode,
      description: "Selects the active user-center deployment mode for the host application.",
      required: false,
      targets,
    },
    {
      canonicalName: USER_CENTER_DEPLOYMENT_VARIABLE_NAMES.providerKey,
      defaultValue: options.providerKey,
      description: "Pins the provider identity used for local sessions, upstream token shadows, and handshake claims.",
      required: false,
      targets,
    },
    {
      canonicalName: USER_CENTER_DEPLOYMENT_VARIABLE_NAMES.localApiBasePath,
      defaultValue: options.localApiBasePath,
      description: "Overrides the local user-center API base path exposed by the host application.",
      required: false,
      targets,
    },
    {
      canonicalName: USER_CENTER_DEPLOYMENT_VARIABLE_NAMES.authorizationHeaderName,
      defaultValue: options.auth.tokenHeaders.authorizationHeaderName,
      description: "Overrides the governed authorization header name used to transport the AuthToken.",
      required: false,
      targets,
    },
    {
      canonicalName: USER_CENTER_DEPLOYMENT_VARIABLE_NAMES.accessTokenHeaderName,
      defaultValue: options.auth.tokenHeaders.accessTokenHeaderName,
      description: "Overrides the governed Access-Token header name used to transport the AccessToken.",
      required: false,
      targets,
    },
    {
      canonicalName: USER_CENTER_DEPLOYMENT_VARIABLE_NAMES.refreshTokenHeaderName,
      defaultValue: options.auth.tokenHeaders.refreshTokenHeaderName,
      description: "Overrides the governed refresh-token header name used during session rotation flows.",
      required: false,
      targets,
    },
    {
      canonicalName: USER_CENTER_DEPLOYMENT_VARIABLE_NAMES.sessionHeaderName,
      defaultValue: options.auth.tokenHeaders.sessionHeaderName,
      description: "Overrides the governed session header name shared by the client runtime and the local authority.",
      required: false,
      targets,
    },
    {
      canonicalName: USER_CENTER_DEPLOYMENT_VARIABLE_NAMES.authorizationScheme,
      defaultValue: options.auth.tokenHeaders.authorizationScheme,
      description: "Overrides the governed authorization scheme used to format the AuthToken header.",
      required: false,
      targets,
    },
  ];
}

export function createUserCenterPrefixedEnvironmentVariableName(
  prefix: string,
  canonicalName: string,
): string {
  const normalizedPrefix = prefix.trim();
  const normalizedCanonicalName = canonicalName.trim();
  const suffix = normalizedCanonicalName.replace(/^SDKWORK_USER_CENTER_/u, "");
  return `${normalizedPrefix}${suffix}`;
}

export function mapUserCenterDeploymentVariablesToEnvironmentVariables(
  variables: readonly UserCenterDeploymentVariable[],
  prefix: string,
): UserCenterDeploymentEnvironmentVariable[] {
  return variables.map((variable) => ({
    ...(variable.canonicalName ? { canonicalName: variable.canonicalName } : {}),
    ...(variable.defaultValue ? { defaultValue: variable.defaultValue } : {}),
    description: variable.description,
    envName: createUserCenterPrefixedEnvironmentVariableName(prefix, variable.canonicalName),
    ...(variable.exampleValue ? { exampleValue: variable.exampleValue } : {}),
    required: variable.required,
    ...(variable.secret ? { secret: true } : {}),
  }));
}

export function mergeUserCenterDeploymentVariables(
  ...groups: readonly UserCenterDeploymentVariable[][]
): UserCenterDeploymentVariable[] {
  const seen = new Set<string>();
  const merged: UserCenterDeploymentVariable[] = [];

  for (const group of groups) {
    for (const variable of group) {
      if (seen.has(variable.canonicalName)) {
        continue;
      }

      seen.add(variable.canonicalName);
      merged.push({
        ...variable,
        targets: [...variable.targets],
      });
    }
  }

  return merged;
}

function createStorageDeploymentVariables(
  storageTopology: UserCenterBridgeConfig["storageTopology"],
): UserCenterDeploymentVariable[] {
  return [
    {
      canonicalName: USER_CENTER_DEPLOYMENT_VARIABLE_NAMES.sqlitePath,
      description: "Points the local deployment to an embedded SQLite authority for user-center data and token shadows.",
      exampleValue: "./data/user-center.db",
      required: false,
      targets: [LOCAL_AUTHORITY_TARGET],
    },
    {
      canonicalName: USER_CENTER_DEPLOYMENT_VARIABLE_NAMES.databaseUrl,
      description: "Points the local deployment to an external database authority when SQLite is not used.",
      exampleValue: "postgresql://user:password@db.sdkwork.local:5432/user_center",
      required: false,
      secret: true,
      targets: [LOCAL_AUTHORITY_TARGET],
    },
    {
      canonicalName: USER_CENTER_DEPLOYMENT_VARIABLE_NAMES.schemaName,
      defaultValue: storageTopology.schemaName,
      description: "Overrides the database schema used by the user-center authority when the backend supports schemas.",
      required: false,
      targets: [LOCAL_AUTHORITY_TARGET],
    },
    {
      canonicalName: USER_CENTER_DEPLOYMENT_VARIABLE_NAMES.tablePrefix,
      defaultValue: storageTopology.tablePrefix,
      description: "Pins the physical table prefix for the application-scoped user-center authority.",
      required: false,
      targets: [LOCAL_AUTHORITY_TARGET],
    },
  ];
}


function createExternalAuthorityContextDeploymentVariables(): UserCenterDeploymentVariable[] {
  return [
    {
      canonicalName: USER_CENTER_DEPLOYMENT_VARIABLE_NAMES.externalTenantHeaderName,
      defaultValue: "x-sdkwork-tenant-id",
      description: "Declares the external authority header that carries the verified tenant id returned by the upstream user-center.",
      required: false,
      targets: [EXTERNAL_AUTHORITY_BRIDGE_TARGET],
    },
    {
      canonicalName: USER_CENTER_DEPLOYMENT_VARIABLE_NAMES.externalOrganizationHeaderName,
      defaultValue: "x-sdkwork-organization-id",
      description: "Declares the external authority header that carries the verified organization id returned by the upstream user-center when present.",
      required: false,
      targets: [EXTERNAL_AUTHORITY_BRIDGE_TARGET],
    },
  ];
}

function createDeploymentHandshake(options: {
  appId?: string;
  enabled: boolean;
  mode: UserCenterDeploymentHandshakeContract["mode"];
  providerKey: string;
  runtimeConfig: Pick<UserCenterBridgeConfig, "auth">;
}): UserCenterDeploymentHandshakeContract {
  return {
    ...(options.appId ? { appId: options.appId } : {}),
    enabled: options.enabled,
    freshnessWindowMs: options.runtimeConfig.auth.handshake.freshnessWindowMs,
    headerNames: {
      ...options.runtimeConfig.auth.handshake.headerNames,
      handshakeModeHeaderName: USER_CENTER_STANDARD_HANDSHAKE_MODE_HEADER_NAME,
    },
    mode: options.mode,
    providerKey: options.providerKey,
  };
}

function createBuiltinLocalDeploymentProfile(
  bridgeConfig: UserCenterBridgeConfig,
): UserCenterDeploymentProfile {
  const providerKey = `${bridgeConfig.namespace}-local`;

  return {
    authMode: bridgeConfig.integration.builtinLocal.authMode,
    enabled: bridgeConfig.integration.builtinLocal.enabled,
    handshake: createDeploymentHandshake({
      enabled: bridgeConfig.integration.builtinLocal.handshakeEnabled,
      mode: "disabled",
      providerKey,
      runtimeConfig: bridgeConfig,
    }),
    kind: "builtin-local",
    localApiBasePath: bridgeConfig.integration.builtinLocal.localApiBasePath,
    providerKey,
    providerKind: "builtin-local",
    secretResolverKind: bridgeConfig.integration.builtinLocal.secretResolverKind,
    sessionTransport: bridgeConfig.integration.builtinLocal.sessionTransport,
    storageTopology: bridgeConfig.storageTopology,
    validationStrategy: bridgeConfig.integration.builtinLocal.validationStrategy,
    variables: [
      ...createBaseDeploymentVariables({
        auth: bridgeConfig.auth,
        localApiBasePath: bridgeConfig.integration.builtinLocal.localApiBasePath,
        mode: "builtin-local",
        providerKey,
        targets: [APPLICATION_RUNTIME_TARGET, LOCAL_AUTHORITY_TARGET],
      }),
      ...createStorageDeploymentVariables(bridgeConfig.storageTopology),
    ],
  };
}

function createExternalAppApiDeploymentProfile(
  bridgeConfig: UserCenterBridgeConfig,
): UserCenterDeploymentProfile {
  const providerKey = bridgeConfig.integration.externalAppApi.providerKey;
  const variables: UserCenterDeploymentVariable[] = [
    ...createBaseDeploymentVariables({
      auth: bridgeConfig.auth,
      localApiBasePath: bridgeConfig.integration.builtinLocal.localApiBasePath,
      mode: "sdkwork-cloud-app-api",
      providerKey,
      targets: [
        APPLICATION_RUNTIME_TARGET,
        LOCAL_AUTHORITY_TARGET,
        UPSTREAM_BRIDGE_TARGET,
      ],
    }),
    {
      canonicalName: USER_CENTER_DEPLOYMENT_VARIABLE_NAMES.appApiBaseUrl,
      defaultValue: bridgeConfig.integration.externalAppApi.upstreamBaseUrl,
      description: "Points the application to the upstream sdkwork-cloud-app-api user-center gateway.",
      exampleValue: "https://app-api.sdkwork.local/app",
      required: true,
      targets: [UPSTREAM_BRIDGE_TARGET],
    },
    {
      canonicalName: USER_CENTER_DEPLOYMENT_VARIABLE_NAMES.appId,
      defaultValue: bridgeConfig.namespace,
      description: "Declares the caller application identity used in canonical upstream handshake claims.",
      required: false,
      targets: [UPSTREAM_BRIDGE_TARGET],
    },
    {
      canonicalName: USER_CENTER_DEPLOYMENT_VARIABLE_NAMES.secretId,
      description: "Publishes the server-side secret identifier used to resolve the upstream shared secret for handshake verification.",
      exampleValue: "secret-501",
      required: true,
      targets: [UPSTREAM_BRIDGE_TARGET],
    },
    {
      canonicalName: USER_CENTER_DEPLOYMENT_VARIABLE_NAMES.sharedSecret,
      description: "Provides the upstream shared secret used to sign and verify canonical provider handshakes.",
      required: true,
      secret: true,
      targets: [UPSTREAM_BRIDGE_TARGET],
    },
    {
      canonicalName: USER_CENTER_DEPLOYMENT_VARIABLE_NAMES.handshakeFreshnessWindowMs,
      defaultValue: String(bridgeConfig.auth.handshake.freshnessWindowMs),
      description: "Pins the maximum upstream handshake age in milliseconds before signed requests are rejected as stale.",
      required: false,
      targets: [UPSTREAM_BRIDGE_TARGET],
    },
    ...createStorageDeploymentVariables(bridgeConfig.storageTopology),
  ];

  return {
    authMode: bridgeConfig.integration.externalAppApi.authMode,
    enabled: bridgeConfig.integration.externalAppApi.enabled,
    handshake: createDeploymentHandshake({
      appId: bridgeConfig.namespace,
      enabled: bridgeConfig.integration.externalAppApi.handshakeEnabled,
      mode: bridgeConfig.integration.externalAppApi.handshakeEnabled
        ? "provider-shared-secret"
        : "disabled",
      providerKey,
      runtimeConfig: bridgeConfig,
    }),
    kind: "sdkwork-cloud-app-api",
    localApiBasePath: bridgeConfig.integration.builtinLocal.localApiBasePath,
    providerKey,
    providerKind: "sdkwork-cloud-app-api",
    secretResolverKind: bridgeConfig.integration.externalAppApi.secretResolverKind,
    sessionTransport: bridgeConfig.integration.externalAppApi.sessionTransport,
    storageTopology: bridgeConfig.storageTopology,
    validationStrategy: bridgeConfig.integration.externalAppApi.validationStrategy,
    variables,
  };
}

function createExternalUserCenterDeploymentProfile(
  bridgeConfig: UserCenterBridgeConfig,
): UserCenterDeploymentProfile | undefined {
  if (!bridgeConfig.integration.externalUserCenter) {
    return undefined;
  }

  const providerKey = bridgeConfig.integration.externalUserCenter.providerKey;
  const variables: UserCenterDeploymentVariable[] = [
    ...createBaseDeploymentVariables({
      auth: bridgeConfig.auth,
      localApiBasePath: bridgeConfig.integration.builtinLocal.localApiBasePath,
      mode: "external-user-center",
      providerKey,
      targets: [
        APPLICATION_RUNTIME_TARGET,
        LOCAL_AUTHORITY_TARGET,
        EXTERNAL_AUTHORITY_BRIDGE_TARGET,
      ],
    }),
    {
      canonicalName: USER_CENTER_DEPLOYMENT_VARIABLE_NAMES.externalBaseUrl,
      defaultValue: bridgeConfig.integration.externalUserCenter.upstreamBaseUrl,
      description: "Points the application to the upstream third-party user-center authority.",
      exampleValue: "https://identity.vendor.local/openapi",
      required: true,
      targets: [EXTERNAL_AUTHORITY_BRIDGE_TARGET],
    },
    {
      canonicalName: USER_CENTER_DEPLOYMENT_VARIABLE_NAMES.appId,
      defaultValue: bridgeConfig.namespace,
      description: "Declares the caller application identity used in external authority handshake claims.",
      required: false,
      targets: [EXTERNAL_AUTHORITY_BRIDGE_TARGET],
    },
    {
      canonicalName: USER_CENTER_DEPLOYMENT_VARIABLE_NAMES.secretId,
      description: "Publishes the server-side secret identifier used by the external user-center bridge.",
      exampleValue: "vendor-secret-1",
      required: true,
      targets: [EXTERNAL_AUTHORITY_BRIDGE_TARGET],
    },
    {
      canonicalName: USER_CENTER_DEPLOYMENT_VARIABLE_NAMES.sharedSecret,
      description: "Provides the shared secret used to sign and verify third-party user-center handshakes.",
      required: true,
      secret: true,
      targets: [EXTERNAL_AUTHORITY_BRIDGE_TARGET],
    },
    {
      canonicalName: USER_CENTER_DEPLOYMENT_VARIABLE_NAMES.handshakeFreshnessWindowMs,
      defaultValue: String(bridgeConfig.auth.handshake.freshnessWindowMs),
      description: "Pins the maximum external authority handshake age in milliseconds before signed requests are rejected as stale.",
      required: false,
      targets: [EXTERNAL_AUTHORITY_BRIDGE_TARGET],
    },
    ...createExternalAuthorityContextDeploymentVariables(),
    ...createStorageDeploymentVariables(bridgeConfig.storageTopology),
  ];

  return {
    authMode: bridgeConfig.integration.externalUserCenter.authMode,
    enabled: bridgeConfig.integration.externalUserCenter.enabled,
    handshake: createDeploymentHandshake({
      appId: bridgeConfig.namespace,
      enabled: bridgeConfig.integration.externalUserCenter.handshakeEnabled,
      mode: bridgeConfig.integration.externalUserCenter.handshakeEnabled
        ? "provider-shared-secret"
        : "disabled",
      providerKey,
      runtimeConfig: bridgeConfig,
    }),
    kind: "external-user-center",
    localApiBasePath: bridgeConfig.integration.builtinLocal.localApiBasePath,
    providerKey,
    providerKind: "external-user-center",
    secretResolverKind: bridgeConfig.integration.externalUserCenter.secretResolverKind,
    sessionTransport: bridgeConfig.integration.externalUserCenter.sessionTransport,
    storageTopology: bridgeConfig.storageTopology,
    validationStrategy: bridgeConfig.integration.externalUserCenter.validationStrategy,
    variables,
  };
}

export function createUserCenterDeploymentProfiles(
  bridgeConfig: UserCenterBridgeConfig,
): UserCenterDeploymentProfileSet {
  const externalUserCenter = createExternalUserCenterDeploymentProfile(bridgeConfig);

  return {
    activeKind: bridgeConfig.integration.activeKind,
    builtinLocal: createBuiltinLocalDeploymentProfile(bridgeConfig),
    externalAppApi: createExternalAppApiDeploymentProfile(bridgeConfig),
    ...(externalUserCenter ? { externalUserCenter } : {}),
  };
}

export function selectUserCenterDeploymentVariables(
  profile: UserCenterDeploymentProfile,
  targets:
    | UserCenterDeploymentVariableTarget
    | readonly UserCenterDeploymentVariableTarget[],
): UserCenterDeploymentVariable[] {
  const normalizedTargets = toUniqueDeploymentTargets(
    Array.isArray(targets) ? targets : [targets],
  );

  return profile.variables
    .filter((variable) => variable.targets.some((target) => normalizedTargets.includes(target)))
    .map((variable) => ({
      ...variable,
      targets: [...variable.targets],
    }));
}

function normalizeTemplateText(value?: string): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : undefined;
}

function resolveDeploymentTemplateValue(
  variable: UserCenterDeploymentEnvironmentVariable,
  options: UserCenterDeploymentEnvTemplateOptions,
): string {
  const explicitValue =
    normalizeTemplateText(variable.defaultValue) ?? normalizeTemplateText(variable.exampleValue);

  if (explicitValue) {
    return explicitValue;
  }

  if (variable.secret) {
    return variable.required
      ? (options.requiredSecretPlaceholder ?? "<required-secret>")
      : (options.optionalSecretPlaceholder ?? "<optional-secret>");
  }

  return variable.required
    ? (options.requiredPlaceholder ?? "<required>")
    : (options.optionalPlaceholder ?? "");
}

function createDeploymentVariableComment(
  variable: UserCenterDeploymentEnvironmentVariable,
): string {
  const tags = [variable.required ? "required" : "optional"];

  if (variable.secret) {
    tags.push("secret");
  }

  if (variable.canonicalName) {
    tags.push(`canonical: ${variable.canonicalName}`);
  }

  return `# [${tags.join(", ")}] ${variable.description}`;
}

export function renderUserCenterDeploymentEnvTemplate(
  variables: readonly UserCenterDeploymentEnvironmentVariable[],
  options: UserCenterDeploymentEnvTemplateOptions = {},
): string {
  const lines: string[] = [];
  const headerComment = normalizeTemplateText(options.headerComment);

  if (headerComment) {
    lines.push(`# ${headerComment}`, "");
  }

  for (const variable of variables) {
    lines.push(
      createDeploymentVariableComment(variable),
      `${variable.envName}=${resolveDeploymentTemplateValue(variable, options)}`,
      "",
    );
  }

  while (lines.length > 0 && lines[lines.length - 1] === "") {
    lines.pop();
  }

  return lines.join("\n");
}

export function createUserCenterDeploymentEnvArtifact(
  options: UserCenterDeploymentEnvArtifactOptions,
): UserCenterDeploymentArtifact {
  const variables = options.variables.map((variable) => ({
    ...variable,
  }));

  return {
    audience: options.audience,
    content: renderUserCenterDeploymentEnvTemplate(variables, options),
    fileName: options.fileName,
    format: "dotenv",
    purpose: options.purpose,
    variables,
  };
}

function resolveIdentityMode(
  profile: UserCenterDeploymentProfile,
  surface: CreateIdentityDeploymentProfileOptions["surface"],
): IdentityDeploymentMode {
  if (profile.kind === "sdkwork-cloud-app-api") {
    return "cloud-saas";
  }

  if (profile.kind === "builtin-local" && surface === "desktop") {
    return "desktop-local";
  }

  return "server-private";
}

function resolveIdentityAuthorityKind(
  profile: UserCenterDeploymentProfile,
  surface: CreateIdentityDeploymentProfileOptions["surface"],
): IdentityAuthorityKind {
  if (profile.kind === "sdkwork-cloud-app-api") {
    return "upstream";
  }

  if (profile.kind === "builtin-local" && surface === "desktop") {
    return "embedded";
  }

  return "dedicated-server";
}

function resolveIdentityTransportKind(
  profile: UserCenterDeploymentProfile,
  surface: CreateIdentityDeploymentProfileOptions["surface"],
): IdentityTransportKind {
  if (profile.kind === "sdkwork-cloud-app-api") {
    return "remote-http";
  }

  if (profile.kind === "external-user-center") {
    if (surface === "server") {
      return "remote-http";
    }

    return surface === "desktop" ? "local-api" : "same-origin-http";
  }

  return surface === "desktop" ? "local-api" : "same-origin-http";
}

function resolveIdentityStorageKind(profile: UserCenterDeploymentProfile): IdentityStorageKind {
  if (profile.kind === "sdkwork-cloud-app-api" || profile.kind === "external-user-center") {
    return "upstream-managed";
  }

  return "sqlite";
}

function resolveDevelopmentPrefillEnabled(
  profile: UserCenterDeploymentProfile,
  surface: CreateIdentityDeploymentProfileOptions["surface"],
): boolean {
  return profile.kind === "builtin-local" && surface === "desktop";
}

function resolveBootstrapEnabled(profile: UserCenterDeploymentProfile): boolean {
  return profile.kind === "builtin-local";
}

export function createIdentityDeploymentProfile(
  options: CreateIdentityDeploymentProfileOptions,
): IdentityDeploymentProfile {
  return {
    authorityKind: resolveIdentityAuthorityKind(options.profile, options.surface),
    bootstrapEnabled: resolveBootstrapEnabled(options.profile),
    developmentPrefillEnabled: resolveDevelopmentPrefillEnabled(
      options.profile,
      options.surface,
    ),
    identityMode: resolveIdentityMode(options.profile, options.surface),
    providerKind: options.profile.kind,
    storageKind: resolveIdentityStorageKind(options.profile),
    surface: options.surface,
    transportKind: resolveIdentityTransportKind(options.profile, options.surface),
  };
}

export function createUserCenterDeploymentEnvArtifactForProfile(
  options: UserCenterDeploymentEnvArtifactForProfileOptions,
): UserCenterDeploymentArtifact {
  return createUserCenterDeploymentEnvArtifact({
    audience: options.audience,
    fileName: options.fileName,
    headerComment: options.headerComment,
    optionalPlaceholder: options.optionalPlaceholder,
    optionalSecretPlaceholder: options.optionalSecretPlaceholder,
    purpose: options.purpose,
    requiredPlaceholder: options.requiredPlaceholder,
    requiredSecretPlaceholder: options.requiredSecretPlaceholder,
    variables: mapUserCenterDeploymentVariablesToEnvironmentVariables(
      selectUserCenterDeploymentVariables(options.profile, options.targets),
      options.envPrefix,
    ),
  });
}
