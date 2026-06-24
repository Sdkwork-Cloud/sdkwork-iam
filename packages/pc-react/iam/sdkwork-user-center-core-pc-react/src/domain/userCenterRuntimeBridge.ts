import type {
  UserCenterAppSdkLikeClient,
  UserCenterBridgeConfig,
  UserCenterBridgeConfigInput,
  UserCenterProviderConfig,
  UserCenterRuntimeClient,
  UserCenterRuntimeClientOptions,
  UserCenterRuntimeConfig,
  UserCenterStorageConfig,
} from "../types/userCenterTypes.ts";
import { createUserCenterBridgeConfig } from "./userCenterBridge.ts";
import { createDefaultUserCenterConfig } from "./userCenterConfig.ts";
import {
  createUserCenterAppSdkRuntimeClient,
  hasUserCenterAppSdkClient,
} from "./userCenterAppSdkRuntimeClient.ts";
import { createUserCenterRuntimeClient } from "./userCenterRuntimeClient.ts";

export type UserCenterRuntimeBridgeProviderKind =
  | "external-user-center"
  | "sdkwork-cloud-app-api";

export interface UserCenterRuntimeProviderBinding {
  baseUrl?: string | null;
  providerKey?: string | null;
  providerKind?: UserCenterRuntimeBridgeProviderKind | null;
}

export interface CreateCanonicalUserCenterRuntimeBridgeOptions
  extends Omit<UserCenterBridgeConfigInput, "mode" | "provider"> {
  mode?: UserCenterBridgeConfigInput["mode"];
  provider?: UserCenterBridgeConfigInput["provider"];
  resolveRuntimeBinding?:
    | UserCenterRuntimeProviderBinding
    | (() => UserCenterRuntimeProviderBinding | null | undefined)
    | null;
  runtimeClientOptions?: UserCenterRuntimeClientOptions;
  storage: UserCenterStorageConfig;
}

export interface CanonicalUserCenterRuntimeBridge {
  apiBaseUrl: string | null;
  bridgeConfig: UserCenterBridgeConfig;
  runtimeClient: UserCenterRuntimeClient | null;
  runtimeConfig: UserCenterRuntimeConfig;
}

function normalizeRuntimeText(value: unknown): string | undefined {
  const normalizedValue = typeof value === "string" ? value.trim() : "";
  return normalizedValue || undefined;
}

function normalizeRuntimeUrl(value: unknown): string | undefined {
  return normalizeRuntimeText(value)?.replace(/\/+$/u, "");
}

function normalizeRuntimeProviderKind(
  value: unknown,
): UserCenterRuntimeBridgeProviderKind | undefined {
  const normalizedValue = normalizeRuntimeText(value)?.toLowerCase();
  if (normalizedValue === "external-user-center") {
    return "external-user-center";
  }

  if (normalizedValue === "sdkwork-cloud-app-api") {
    return "sdkwork-cloud-app-api";
  }

  return undefined;
}

function resolveRuntimeBinding(
  binding?:
    | UserCenterRuntimeProviderBinding
    | (() => UserCenterRuntimeProviderBinding | null | undefined)
    | null,
): UserCenterRuntimeProviderBinding | null {
  const resolvedBinding = typeof binding === "function" ? binding() : binding;
  if (!resolvedBinding) {
    return null;
  }

  const baseUrl = normalizeRuntimeUrl(resolvedBinding.baseUrl);
  const providerKey = normalizeRuntimeText(resolvedBinding.providerKey);
  const providerKind = normalizeRuntimeProviderKind(resolvedBinding.providerKind);

  if (!baseUrl && !providerKey && !providerKind) {
    return null;
  }

  return {
    ...(baseUrl ? { baseUrl } : {}),
    ...(providerKey ? { providerKey } : {}),
    ...(providerKind ? { providerKind } : {}),
  };
}

function resolveProviderKind(
  options: Pick<CreateCanonicalUserCenterRuntimeBridgeOptions, "provider">,
  binding: UserCenterRuntimeProviderBinding | null,
): UserCenterProviderConfig["kind"] {
  if (binding?.baseUrl) {
    return binding.providerKind ?? "sdkwork-cloud-app-api";
  }

  if (options.provider?.kind) {
    return options.provider.kind;
  }

  return "builtin-local";
}

function resolveProviderInput(
  options: Pick<CreateCanonicalUserCenterRuntimeBridgeOptions, "provider">,
  binding: UserCenterRuntimeProviderBinding | null,
): NonNullable<UserCenterBridgeConfigInput["provider"]> {
  const providerKind = resolveProviderKind(options, binding);
  const providerBaseUrl =
    binding?.baseUrl ?? normalizeRuntimeUrl(options.provider?.baseUrl);
  const providerKey =
    binding?.providerKey ?? normalizeRuntimeText(options.provider?.providerKey);

  return {
    ...(providerBaseUrl ? { baseUrl: providerBaseUrl } : {}),
    ...(options.provider?.headers ? { headers: options.provider.headers } : {}),
    kind: providerKind,
    ...(providerKey ? { providerKey } : {}),
  };
}

function resolveRuntimeMode(
  mode: CreateCanonicalUserCenterRuntimeBridgeOptions["mode"] | undefined,
  providerKind: UserCenterProviderConfig["kind"],
): CreateCanonicalUserCenterRuntimeBridgeOptions["mode"] | undefined {
  if (mode) {
    return mode;
  }

  if (providerKind === "external-user-center") {
    return "external-hub";
  }

  if (providerKind === "sdkwork-cloud-app-api") {
    return "app-api-hub";
  }

  return undefined;
}

export function createCanonicalUserCenterRuntimeBridge(
  options: CreateCanonicalUserCenterRuntimeBridgeOptions,
): CanonicalUserCenterRuntimeBridge {
  const binding = resolveRuntimeBinding(options.resolveRuntimeBinding);
  const provider = resolveProviderInput(options, binding);
  const mode = resolveRuntimeMode(options.mode, provider.kind);
  const bridgeInput: UserCenterBridgeConfigInput = {
    auth: options.auth,
    localApiBasePath: options.localApiBasePath,
    ...(mode ? { mode } : {}),
    namespace: options.namespace,
    provider,
    routes: options.routes,
    storageTopology: options.storageTopology,
  };
  const bridgeConfig = createUserCenterBridgeConfig(bridgeInput);
  const runtimeConfig = createDefaultUserCenterConfig({
    ...bridgeInput,
    storage: options.storage,
  });
  const apiBaseUrl = normalizeRuntimeUrl(runtimeConfig.provider.baseUrl) ?? null;
  const appSdkClient = resolveRuntimeAppSdkClient(options.runtimeClientOptions?.appSdkClient);
  const runtimeClient = provider.kind === "sdkwork-cloud-app-api" && hasUserCenterAppSdkClient(appSdkClient)
    ? createUserCenterAppSdkRuntimeClient(runtimeConfig, {
        ...(options.runtimeClientOptions ?? {}),
        appSdkClient: () => appSdkClient!,
      })
    : createUserCenterRuntimeClient(
      runtimeConfig,
      options.runtimeClientOptions,
    );

  return {
    apiBaseUrl,
    bridgeConfig,
    runtimeClient,
    runtimeConfig,
  };
}

function resolveRuntimeAppSdkClient(
  appSdkClient: UserCenterRuntimeClientOptions["appSdkClient"],
): UserCenterAppSdkLikeClient | null {
  if (!appSdkClient) {
    return null;
  }

  return typeof appSdkClient === "function" ? appSdkClient() : appSdkClient;
}
