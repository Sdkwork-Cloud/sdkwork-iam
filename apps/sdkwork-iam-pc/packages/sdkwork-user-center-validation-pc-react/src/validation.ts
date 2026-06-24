import {
  assertUserCenterAuthInteropContract,
  assertUserCenterAuthPreflightCompatibility,
  createUserCenterAuthInteropContract,
  createUserCenterAuthPreflightReport,
  diffUserCenterAuthInteropContract,
  createUserCenterPluginDefinition,
  USER_CENTER_STANDARD_HANDSHAKE_MODE_HEADER_NAME,
  requireUserCenterProtectedToken,
  resolveUserCenterProtectedToken,
  type UserCenterAuthCachePolicy,
  type UserCenterAuthHandshake,
  type UserCenterAuthInteropContract,
  type UserCenterAuthInteropDiff,
  type UserCenterAuthInteropMismatch,
  type UserCenterAuthMode,
  type UserCenterAuthPreflightReport,
  type UserCenterAuthProfile,
  type UserCenterAuthValidationStrategy,
  type UserCenterBridgeConfig,
  type UserCenterPluginDefinition,
  type UserCenterPluginDefinitionOptions,
  type UserCenterSecretResolution,
  type UserCenterProtectedTokenRequirementOptions,
  type UserCenterProtectedTokenResolutionOptions,
  type UserCenterTokenHeaders,
  type UserCenterWorkspaceManifestBase,
} from "@sdkwork/user-center-core-pc-react";

export const USER_CENTER_VALIDATION_SOURCE_PACKAGE_NAME =
  "@sdkwork/user-center-validation-pc-react";
const USER_CENTER_VALIDATION_PROVIDER_SHARED_SECRET_HANDSHAKE_MODE =
  "provider-shared-secret";

export interface UserCenterValidationSnapshot {
  authMode: UserCenterAuthMode;
  cachePolicy: UserCenterAuthCachePolicy;
  governedHeaderNames: string[];
  handshake: UserCenterAuthHandshake;
  integrationKind: UserCenterBridgeConfig["integration"]["activeKind"];
  providerKey: string;
  secretResolution: UserCenterSecretResolution;
  tokenHeaders: UserCenterTokenHeaders;
  validationStrategy: UserCenterAuthValidationStrategy;
}

export type UserCenterValidationInteropContract = UserCenterAuthInteropContract;
export type UserCenterValidationInteropMismatch = UserCenterAuthInteropMismatch;
export type UserCenterValidationInteropDiff = UserCenterAuthInteropDiff;
export type {
  UserCenterProtectedTokenRequirementOptions,
  UserCenterProtectedTokenResolutionOptions,
};
export {
  requireUserCenterProtectedToken,
  resolveUserCenterProtectedToken,
};

export interface UserCenterValidationPreflightOptions {
  peerContract: UserCenterValidationInteropContract;
  snapshot: UserCenterValidationSnapshot;
}

export type UserCenterValidationPreflightReport = UserCenterAuthPreflightReport;

export interface UserCenterValidationDependency {
  activeIntegrationKind: UserCenterBridgeConfig["integration"]["activeKind"];
  capability: "user-center";
  namespace: string;
  providerKey: string;
}

export interface UserCenterValidationWorkspaceManifest
  extends UserCenterWorkspaceManifestBase {
  capability: "validation";
  dependencyCapability: "user-center";
  governedHeaderNames: string[];
  handshakeEnabled: boolean;
}

export interface UserCenterValidationPluginDefinition {
  bridgeConfig: UserCenterBridgeConfig;
  capability: "user-center-validation";
  dependency: UserCenterValidationDependency;
  manifests: {
    validation: UserCenterValidationWorkspaceManifest;
  };
  userCenterPlugin: UserCenterPluginDefinition;
  validation: UserCenterValidationSnapshot;
}

export interface UserCenterValidationPluginDefinitionFromConfigOptions
  extends UserCenterPluginDefinitionOptions {
  userCenterPlugin?: undefined;
}

export interface UserCenterValidationPluginDefinitionFromPluginOptions
  extends Omit<UserCenterPluginDefinitionOptions, "namespace"> {
  namespace?: string;
  userCenterPlugin: UserCenterPluginDefinition;
}

export type UserCenterValidationPluginDefinitionOptions =
  | UserCenterValidationPluginDefinitionFromConfigOptions
  | UserCenterValidationPluginDefinitionFromPluginOptions;

function hasValidationUserCenterPlugin(
  options: UserCenterValidationPluginDefinitionOptions,
): options is UserCenterValidationPluginDefinitionFromPluginOptions {
  return Boolean(options.userCenterPlugin);
}

function resolveUserCenterPluginFromValidationOptions(
  options: UserCenterValidationPluginDefinitionOptions,
): UserCenterPluginDefinition {
  if (hasValidationUserCenterPlugin(options)) {
    return options.userCenterPlugin;
  }

  return createUserCenterPluginDefinition(options);
}

export function createUserCenterValidationPluginDefinition(
  options: UserCenterValidationPluginDefinitionOptions,
): UserCenterValidationPluginDefinition {
  const userCenterPlugin = resolveUserCenterPluginFromValidationOptions(options);
  const bridgeConfig = userCenterPlugin.bridgeConfig;
  const validation = createUserCenterValidationSnapshot(bridgeConfig);
  const packageNames = options.packageNames ?? [USER_CENTER_VALIDATION_SOURCE_PACKAGE_NAME];
  const title = options.title ?? "User Center";

  return {
    bridgeConfig,
    capability: "user-center-validation",
    dependency: {
      activeIntegrationKind: bridgeConfig.integration.activeKind,
      capability: "user-center",
      namespace: bridgeConfig.namespace,
      providerKey: bridgeConfig.provider.providerKey,
    },
    manifests: {
      validation: {
        ...createValidationManifestBase({
          description:
            "Independent validation plugin for governed auth headers, protected token resolution, and upstream handshake verification.",
          host: options.host,
          id: `${bridgeConfig.namespace}-validation`,
          packageNames,
          title: `${title} Validation`,
        }),
        capability: "validation",
        dependencyCapability: "user-center",
        governedHeaderNames: [...validation.governedHeaderNames],
        handshakeEnabled:
          validation.handshake.enabled
          && validation.handshake.mode
            === USER_CENTER_VALIDATION_PROVIDER_SHARED_SECRET_HANDSHAKE_MODE,
      },
    },
    userCenterPlugin,
    validation,
  };
}

function toUniquePackages(packageNames: readonly string[]): string[] {
  return Array.from(new Set(packageNames.map((packageName) => packageName.trim()).filter(Boolean)));
}

function createValidationManifestBase(options: {
  description: string;
  host?: "browser" | "server" | "tauri";
  id: string;
  packageNames: readonly string[];
  title: string;
}): UserCenterWorkspaceManifestBase {
  return {
    description: options.description,
    ...(options.host ? { host: options.host } : {}),
    id: options.id,
    packageNames: toUniquePackages(options.packageNames),
    title: options.title,
  };
}

function createGovernedHeaderNames(
  bridgeConfig: Pick<UserCenterBridgeConfig, "auth">,
): string[] {
  const names = [
    bridgeConfig.auth.tokenHeaders.authorizationHeaderName,
    bridgeConfig.auth.tokenHeaders.accessTokenHeaderName,
    bridgeConfig.auth.tokenHeaders.refreshTokenHeaderName,
    bridgeConfig.auth.tokenHeaders.sessionHeaderName,
  ];

  if (
    bridgeConfig.auth.handshake.enabled
    && bridgeConfig.auth.handshake.mode
      === USER_CENTER_VALIDATION_PROVIDER_SHARED_SECRET_HANDSHAKE_MODE
  ) {
    names.push(
      bridgeConfig.auth.handshake.headerNames.appIdHeaderName,
      USER_CENTER_STANDARD_HANDSHAKE_MODE_HEADER_NAME,
      bridgeConfig.auth.handshake.headerNames.providerKeyHeaderName,
      bridgeConfig.auth.handshake.headerNames.secretIdHeaderName,
      bridgeConfig.auth.handshake.headerNames.signatureHeaderName,
      bridgeConfig.auth.handshake.headerNames.signedAtHeaderName,
    );
  }

  return Array.from(new Set(names));
}

function cloneValidationHandshake(auth: UserCenterAuthProfile): UserCenterAuthHandshake {
  return {
    ...auth.handshake,
    freshnessWindowMs: auth.handshake.freshnessWindowMs,
    headerNames: {
      ...auth.handshake.headerNames,
    },
    staticHeaders: {
      ...auth.handshake.staticHeaders,
    },
  };
}

export function createUserCenterValidationSnapshot(
  bridgeConfig: UserCenterBridgeConfig,
): UserCenterValidationSnapshot {
  return {
    authMode: bridgeConfig.auth.mode,
    cachePolicy: {
      ...bridgeConfig.auth.cachePolicy,
    },
    governedHeaderNames: createGovernedHeaderNames(bridgeConfig),
    handshake: cloneValidationHandshake(bridgeConfig.auth),
    integrationKind: bridgeConfig.integration.activeKind,
    providerKey: bridgeConfig.provider.providerKey,
    secretResolution: {
      ...bridgeConfig.auth.secretResolution,
    },
    tokenHeaders: {
      ...bridgeConfig.auth.tokenHeaders,
    },
    validationStrategy: bridgeConfig.auth.validationStrategy,
  };
}

export function createUserCenterValidationInteropContract(
  snapshot: UserCenterValidationSnapshot,
): UserCenterValidationInteropContract {
  return createUserCenterAuthInteropContract(snapshot);
}

export function diffUserCenterValidationInteropContract(
  expected: UserCenterValidationInteropContract,
  actual: UserCenterValidationInteropContract,
): UserCenterValidationInteropDiff {
  return diffUserCenterAuthInteropContract(expected, actual);
}

export function assertUserCenterValidationInteropContract(
  expected: UserCenterValidationInteropContract,
  actual: UserCenterValidationInteropContract,
): void {
  assertUserCenterAuthInteropContract(expected, actual);
}

export function createUserCenterValidationPreflightReport(
  options: UserCenterValidationPreflightOptions,
): UserCenterValidationPreflightReport {
  return createUserCenterAuthPreflightReport({
    peerContract: options.peerContract,
    source: options.snapshot,
  });
}

export function assertUserCenterValidationPreflightCompatibility(
  options: UserCenterValidationPreflightOptions,
): UserCenterValidationPreflightReport {
  return assertUserCenterAuthPreflightCompatibility({
    peerContract: options.peerContract,
    source: options.snapshot,
  });
}
