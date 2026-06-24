import {
  createUserCenterValidationInteropContract,
  createUserCenterValidationSnapshot,
} from "./validation.ts";
import type {
  UserCenterServerValidationPluginDefinition,
  UserCenterServerValidationPluginDefinitionOptions,
  UserCenterWorkspaceManifestBase,
} from "@sdkwork/user-center-core-pc-react";
import { USER_CENTER_PROTECTED_TOKEN_PREFERENCE } from "@sdkwork/user-center-core-pc-react";

const SERVER_VALIDATION_PACKAGE_NAMES = ["@sdkwork/user-center-validation-pc-react"];

function toUniquePackageNames(packageNames: readonly string[]): string[] {
  return Array.from(new Set(packageNames.map((packageName) => packageName.trim()).filter(Boolean)));
}

function createServerValidationManifestBase(options: {
  description?: string;
  id: string;
  packageNames: string[];
  title: string;
}): UserCenterWorkspaceManifestBase {
  return {
    ...(options.description ? { description: options.description } : {}),
    host: "server",
    id: options.id,
    packageNames: toUniquePackageNames(options.packageNames),
    title: options.title,
  };
}

export function createUserCenterServerValidationPluginDefinition(
  options: UserCenterServerValidationPluginDefinitionOptions,
): UserCenterServerValidationPluginDefinition {
  const userCenterServerPlugin = options.userCenterServerPlugin;
  const bridgeConfig = userCenterServerPlugin.bridgeConfig;
  const validationSnapshot = createUserCenterValidationSnapshot(bridgeConfig);
  const interop = createUserCenterValidationInteropContract(validationSnapshot);

  return {
    capability: "user-center-server-validation",
    dependency: {
      activeIntegrationKind: bridgeConfig.integration.activeKind,
      capability: "user-center-server",
      namespace: bridgeConfig.namespace,
      providerKey: bridgeConfig.provider.providerKey,
    },
    manifests: {
      serverValidation: {
        ...createServerValidationManifestBase({
          description:
            options.description
            ?? "Independent server validation plugin for governed headers, protected token resolution, and upstream handshake policy.",
          id: `${bridgeConfig.namespace}-user-center-server-validation`,
          packageNames: options.packageNames ?? SERVER_VALIDATION_PACKAGE_NAMES,
          title: options.title ?? "User Center Server Validation",
        }),
        capability: "server-validation",
        dependencyCapability: "user-center-server",
        governedHeaderNames: [...validationSnapshot.governedHeaderNames],
      },
    },
    middleware: {
      governedHeaderNames: [...validationSnapshot.governedHeaderNames],
      handshake: {
        freshnessWindowMs: validationSnapshot.handshake.freshnessWindowMs,
        mode: validationSnapshot.handshake.mode,
        required: validationSnapshot.handshake.enabled,
      },
      interop,
      protectedTokenPreference: [...USER_CENTER_PROTECTED_TOKEN_PREFERENCE],
    },
    userCenterServerPlugin,
  };
}
