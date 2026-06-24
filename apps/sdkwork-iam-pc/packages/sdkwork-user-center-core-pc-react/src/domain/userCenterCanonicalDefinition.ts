import type {
  UserCenterBridgeConfig,
  UserCenterBridgeConfigInput,
  UserCenterHandshakeSignature,
  UserCenterHandshakeVerificationContext,
  UserCenterHandshakeVerificationContextInput,
  UserCenterLocalApiRoutes,
  UserCenterPluginCapabilityName,
  UserCenterPluginDefinition,
  UserCenterPluginDefinitionOptions,
  UserCenterRoutes,
  UserCenterRuntimeRequestMethod,
  UserCenterServerOperationContract,
  UserCenterServerPluginDefinition,
  UserCenterServerPluginDefinitionOptions,
} from "../types/userCenterTypes.ts";
import { createUserCenterBridgeConfig, USER_CENTER_SOURCE_PACKAGE_NAME } from "./userCenterBridge.ts";
import { createUserCenterCanonicalServerOperations } from "./userCenterCanonicalRoutes.ts";
import {
  createUserCenterLocalApiRoutes,
  USER_CENTER_DEFAULT_LOCAL_API_BASE_PATH,
} from "./userCenterLocalApi.ts";
import { createUserCenterPluginDefinition } from "./userCenterPlugin.ts";
import { createUserCenterServerPluginDefinition } from "./userCenterServer.ts";
import { defaultIfBlank } from "@sdkwork/utils";
import {
  createUserCenterHandshakeSigningMessage,
  createUserCenterHandshakeVerificationContext,
  createUserCenterSignedHandshakeHeaders,
} from "./userCenterStandard.ts";

const USER_CENTER_DEFAULT_PLUGIN_CAPABILITIES = [
  "auth",
  "user",
] as const satisfies readonly UserCenterPluginCapabilityName[];

function toUniquePackages(packageNames: readonly string[]): string[] {
  return Array.from(new Set(packageNames.map((packageName) => packageName.trim()).filter(Boolean)));
}

function resolveCanonicalUserCenterRoutes(
  standardRoutes: UserCenterRoutes,
  routes?: Partial<UserCenterRoutes>,
): UserCenterRoutes {
  return {
    authBasePath: routes?.authBasePath ?? standardRoutes.authBasePath,
    userRoutePath: routes?.userRoutePath ?? standardRoutes.userRoutePath,
  };
}

export interface CreateSdkworkCanonicalUserCenterDefinitionOptions {
  capabilities?: readonly UserCenterPluginCapabilityName[];
  localApiBasePath?: string;
  namespace: string;
  packageNames?: readonly string[];
  routes: UserCenterRoutes;
  title?: string;
}

export type CreateSdkworkCanonicalUserCenterConfigOptions = Omit<
  UserCenterBridgeConfigInput,
  "localApiBasePath" | "namespace" | "routes"
> & {
  localApiBasePath?: string;
  routes?: Partial<UserCenterRoutes>;
};

export type CreateSdkworkCanonicalUserCenterPluginDefinitionOptions = Omit<
  UserCenterPluginDefinitionOptions,
  "capabilities" | "localApiBasePath" | "namespace" | "packageNames" | "routes" | "title"
> & {
  capabilities?: readonly UserCenterPluginCapabilityName[];
  localApiBasePath?: string;
  packageNames?: readonly string[];
  routes?: Partial<UserCenterRoutes>;
  title?: string;
};

export type CreateSdkworkCanonicalUserCenterServerPluginDefinitionOptions = Omit<
  UserCenterServerPluginDefinitionOptions,
  "localApiBasePath" | "namespace" | "packageNames" | "routes" | "title"
> & {
  localApiBasePath?: string;
  packageNames?: readonly string[];
  routes?: Partial<UserCenterRoutes>;
  title?: string;
};

export interface CreateSdkworkCanonicalUserCenterHandshakeSigningMessageOptions
  extends CreateSdkworkCanonicalUserCenterConfigOptions {
  method: UserCenterRuntimeRequestMethod;
  path: string;
  signedAt: string;
}

export interface CreateSdkworkCanonicalUserCenterSignedHandshakeHeadersOptions
  extends CreateSdkworkCanonicalUserCenterConfigOptions {
  signature: UserCenterHandshakeSignature;
}

export interface CreateSdkworkCanonicalUserCenterHandshakeVerificationContextOptions
  extends CreateSdkworkCanonicalUserCenterConfigOptions,
    Omit<UserCenterHandshakeVerificationContextInput, "config"> {}

export interface SdkworkCanonicalUserCenterDefinition {
  capabilities: readonly UserCenterPluginCapabilityName[];
  localApiBasePath: string;
  localApiRoutes: UserCenterLocalApiRoutes;
  namespace: string;
  packageNames: readonly string[];
  routes: UserCenterRoutes;
  sourcePackageName: typeof USER_CENTER_SOURCE_PACKAGE_NAME;
  title: string;
  createConfig(options?: CreateSdkworkCanonicalUserCenterConfigOptions): UserCenterBridgeConfig;
  createHandshakeSigningMessage(
    options: CreateSdkworkCanonicalUserCenterHandshakeSigningMessageOptions,
  ): string;
  createHandshakeVerificationContext(
    options: CreateSdkworkCanonicalUserCenterHandshakeVerificationContextOptions,
  ): UserCenterHandshakeVerificationContext;
  createPluginDefinition(
    options?: CreateSdkworkCanonicalUserCenterPluginDefinitionOptions,
  ): UserCenterPluginDefinition;
  createServerOperations(
    options?: CreateSdkworkCanonicalUserCenterServerPluginDefinitionOptions,
  ): readonly UserCenterServerOperationContract[];
  createServerPluginDefinition(
    options?: CreateSdkworkCanonicalUserCenterServerPluginDefinitionOptions,
  ): UserCenterServerPluginDefinition;
  createSignedHandshakeHeaders(
    options: CreateSdkworkCanonicalUserCenterSignedHandshakeHeadersOptions,
  ): Record<string, string>;
}

export function createSdkworkCanonicalUserCenterDefinition(
  options: CreateSdkworkCanonicalUserCenterDefinitionOptions,
): SdkworkCanonicalUserCenterDefinition {
  const namespace = options.namespace;
  const routes = Object.freeze(resolveCanonicalUserCenterRoutes(options.routes));
  const packageNames = Object.freeze(
    toUniquePackages(options.packageNames ?? [USER_CENTER_SOURCE_PACKAGE_NAME]),
  );
  const title = defaultIfBlank(options.title, "User Center");
  const localApiBasePath = defaultIfBlank(
    options.localApiBasePath,
    USER_CENTER_DEFAULT_LOCAL_API_BASE_PATH,
  );
  const capabilities = Object.freeze([
    ...(options.capabilities ?? USER_CENTER_DEFAULT_PLUGIN_CAPABILITIES),
  ]);
  const localApiRoutes = Object.freeze(createUserCenterLocalApiRoutes(localApiBasePath));

  function createConfig(
    configOptions: CreateSdkworkCanonicalUserCenterConfigOptions = {},
  ): UserCenterBridgeConfig {
    return createUserCenterBridgeConfig({
      auth: configOptions.auth,
      localApiBasePath: configOptions.localApiBasePath ?? localApiBasePath,
      mode: configOptions.mode,
      namespace,
      provider: configOptions.provider,
      routes: resolveCanonicalUserCenterRoutes(routes, configOptions.routes),
      storageTopology: configOptions.storageTopology,
    });
  }

  function createPluginDefinition(
    pluginOptions: CreateSdkworkCanonicalUserCenterPluginDefinitionOptions = {},
  ): UserCenterPluginDefinition {
    return createUserCenterPluginDefinition({
      auth: pluginOptions.auth,
      capabilities: pluginOptions.capabilities ?? capabilities,
      host: pluginOptions.host,
      localApiBasePath: pluginOptions.localApiBasePath ?? localApiBasePath,
      mode: pluginOptions.mode,
      namespace,
      packageNames: pluginOptions.packageNames
        ? [...pluginOptions.packageNames]
        : [...packageNames],
      provider: pluginOptions.provider,
      routes: resolveCanonicalUserCenterRoutes(routes, pluginOptions.routes),
      storageTopology: pluginOptions.storageTopology,
      theme: pluginOptions.theme,
      title: pluginOptions.title ?? title,
    });
  }

  function createServerPluginDefinition(
    pluginOptions: CreateSdkworkCanonicalUserCenterServerPluginDefinitionOptions = {},
  ): UserCenterServerPluginDefinition {
    return createUserCenterServerPluginDefinition({
      auth: pluginOptions.auth,
      description: pluginOptions.description,
      localApiBasePath: pluginOptions.localApiBasePath ?? localApiBasePath,
      mode: pluginOptions.mode,
      namespace,
      packageNames: pluginOptions.packageNames
        ? [...pluginOptions.packageNames]
        : [...packageNames],
      provider: pluginOptions.provider,
      routes: resolveCanonicalUserCenterRoutes(routes, pluginOptions.routes),
      storageTopology: pluginOptions.storageTopology,
      theme: pluginOptions.theme,
      title: pluginOptions.title ?? `${title} Server`,
    });
  }

  function createServerOperations(
    operationOptions: CreateSdkworkCanonicalUserCenterServerPluginDefinitionOptions = {},
  ): readonly UserCenterServerOperationContract[] {
    return Object.freeze(
      createUserCenterCanonicalServerOperations(
        createConfig({
          auth: operationOptions.auth,
          localApiBasePath: operationOptions.localApiBasePath,
          mode: operationOptions.mode,
          provider: operationOptions.provider,
          routes: operationOptions.routes,
          storageTopology: operationOptions.storageTopology,
        }),
      ),
    );
  }

  function createHandshakeSigningMessage(
    messageOptions: CreateSdkworkCanonicalUserCenterHandshakeSigningMessageOptions,
  ): string {
    const { method, path, signedAt, ...configOptions } = messageOptions;
    return createUserCenterHandshakeSigningMessage({
      config: createConfig(configOptions),
      method,
      path,
      signedAt,
    });
  }

  function createSignedHandshakeHeaders(
    headerOptions: CreateSdkworkCanonicalUserCenterSignedHandshakeHeadersOptions,
  ): Record<string, string> {
    const { signature, ...configOptions } = headerOptions;
    return createUserCenterSignedHandshakeHeaders(createConfig(configOptions), signature);
  }

  function createHandshakeVerificationContext(
    verificationOptions: CreateSdkworkCanonicalUserCenterHandshakeVerificationContextOptions,
  ): UserCenterHandshakeVerificationContext {
    const { headers, maxSignedAtAgeMs, method, now, path, ...configOptions } =
      verificationOptions;
    return createUserCenterHandshakeVerificationContext({
      config: createConfig(configOptions),
      headers,
      maxSignedAtAgeMs,
      method,
      now,
      path,
    });
  }

  return Object.freeze({
    capabilities,
    createConfig,
    createHandshakeSigningMessage,
    createHandshakeVerificationContext,
    createPluginDefinition,
    createServerOperations,
    createServerPluginDefinition,
    createSignedHandshakeHeaders,
    localApiBasePath,
    localApiRoutes,
    namespace,
    packageNames,
    routes,
    sourcePackageName: USER_CENTER_SOURCE_PACKAGE_NAME,
    title,
  });
}
