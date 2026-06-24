import type {
  CreateSdkworkCanonicalUserCenterConfigOptions,
  CreateSdkworkCanonicalUserCenterPluginDefinitionOptions,
  CreateSdkworkCanonicalUserCenterServerPluginDefinitionOptions,
  SdkworkCanonicalUserCenterDefinition,
  UserCenterServerValidationPluginDefinition,
} from "@sdkwork/user-center-core-pc-react";
import { defaultIfBlank } from "@sdkwork/utils";
import { createUserCenterServerValidationPluginDefinition } from "./serverValidation.ts";
import {
  assertUserCenterValidationPreflightCompatibility,
  createUserCenterValidationInteropContract,
  createUserCenterValidationPluginDefinition,
  createUserCenterValidationPreflightReport,
  createUserCenterValidationSnapshot,
  type UserCenterValidationInteropContract,
  type UserCenterValidationPluginDefinition,
  type UserCenterValidationPreflightReport,
  type UserCenterValidationSnapshot,
} from "./validation.ts";

function toUniquePackages(packageNames: readonly string[]): string[] {
  return Array.from(new Set(packageNames.map((packageName) => packageName.trim()).filter(Boolean)));
}

export interface CreateSdkworkCanonicalUserCenterValidationDefinitionOptions {
  packageNames?: readonly string[];
  title?: string;
  userCenter: SdkworkCanonicalUserCenterDefinition;
}

export interface CreateSdkworkCanonicalUserCenterValidationPluginDefinitionOptions
  extends CreateSdkworkCanonicalUserCenterPluginDefinitionOptions {
  packageNames?: readonly string[];
  title?: string;
}

export interface CreateSdkworkCanonicalUserCenterServerValidationPluginDefinitionOptions
  extends CreateSdkworkCanonicalUserCenterServerPluginDefinitionOptions {
  description?: string;
  packageNames?: readonly string[];
  title?: string;
}

export interface CreateSdkworkCanonicalUserCenterValidationPreflightOptions
  extends CreateSdkworkCanonicalUserCenterConfigOptions {
  peerContract: UserCenterValidationInteropContract;
}

export interface SdkworkCanonicalUserCenterValidationDefinition {
  packageNames: readonly string[];
  title: string;
  userCenter: SdkworkCanonicalUserCenterDefinition;
  createInteropContract(
    options?: CreateSdkworkCanonicalUserCenterConfigOptions,
  ): UserCenterValidationInteropContract;
  createPluginDefinition(
    options?: CreateSdkworkCanonicalUserCenterValidationPluginDefinitionOptions,
  ): UserCenterValidationPluginDefinition;
  createPreflightReport(
    options: CreateSdkworkCanonicalUserCenterValidationPreflightOptions,
  ): UserCenterValidationPreflightReport;
  createServerPluginDefinition(
    options?: CreateSdkworkCanonicalUserCenterServerValidationPluginDefinitionOptions,
  ): UserCenterServerValidationPluginDefinition;
  createSnapshot(
    options?: CreateSdkworkCanonicalUserCenterConfigOptions,
  ): UserCenterValidationSnapshot;
  assertPreflight(
    options: CreateSdkworkCanonicalUserCenterValidationPreflightOptions,
  ): UserCenterValidationPreflightReport;
}

export function createSdkworkCanonicalUserCenterValidationDefinition(
  options: CreateSdkworkCanonicalUserCenterValidationDefinitionOptions,
): SdkworkCanonicalUserCenterValidationDefinition {
  const packageNames = Object.freeze(
    toUniquePackages(options.packageNames ?? ["@sdkwork/user-center-validation-pc-react"]),
  );
  const title = defaultIfBlank(options.title, options.userCenter.title);
  const userCenter = options.userCenter;

  function createSnapshot(
    snapshotOptions: CreateSdkworkCanonicalUserCenterConfigOptions = {},
  ): UserCenterValidationSnapshot {
    return createUserCenterValidationSnapshot(userCenter.createConfig(snapshotOptions));
  }

  function createInteropContract(
    interopOptions: CreateSdkworkCanonicalUserCenterConfigOptions = {},
  ): UserCenterValidationInteropContract {
    return createUserCenterValidationInteropContract(createSnapshot(interopOptions));
  }

  function createPluginDefinition(
    pluginOptions: CreateSdkworkCanonicalUserCenterValidationPluginDefinitionOptions = {},
  ): UserCenterValidationPluginDefinition {
    return createUserCenterValidationPluginDefinition({
      host: pluginOptions.host,
      packageNames: pluginOptions.packageNames
        ? [...pluginOptions.packageNames]
        : [...packageNames],
      title: pluginOptions.title ?? title,
      userCenterPlugin: userCenter.createPluginDefinition(pluginOptions),
    });
  }

  function createServerPluginDefinition(
    pluginOptions: CreateSdkworkCanonicalUserCenterServerValidationPluginDefinitionOptions = {},
  ): UserCenterServerValidationPluginDefinition {
    return createUserCenterServerValidationPluginDefinition({
      description: pluginOptions.description,
      packageNames: pluginOptions.packageNames
        ? [...pluginOptions.packageNames]
        : [...packageNames],
      title: pluginOptions.title ?? `${title} Server`,
      userCenterServerPlugin: userCenter.createServerPluginDefinition(pluginOptions),
    });
  }

  function createPreflightReport(
    preflightOptions: CreateSdkworkCanonicalUserCenterValidationPreflightOptions,
  ): UserCenterValidationPreflightReport {
    const { peerContract, ...configOptions } = preflightOptions;
    return createUserCenterValidationPreflightReport({
      peerContract,
      snapshot: createSnapshot(configOptions),
    });
  }

  function assertPreflight(
    preflightOptions: CreateSdkworkCanonicalUserCenterValidationPreflightOptions,
  ): UserCenterValidationPreflightReport {
    const { peerContract, ...configOptions } = preflightOptions;
    return assertUserCenterValidationPreflightCompatibility({
      peerContract,
      snapshot: createSnapshot(configOptions),
    });
  }

  return Object.freeze({
    assertPreflight,
    createInteropContract,
    createPluginDefinition,
    createPreflightReport,
    createServerPluginDefinition,
    createSnapshot,
    packageNames,
    title,
    userCenter,
  });
}
