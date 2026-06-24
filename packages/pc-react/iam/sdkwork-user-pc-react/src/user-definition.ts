import type { CreateUserWorkspaceManifestOptions, SdkworkUserCenterGroup } from "./user.ts";
import { defaultIfBlank } from "@sdkwork/utils";
import {
  createSdkworkCanonicalUserCapability,
  createSdkworkCanonicalUserRouteIntent,
  createSdkworkCanonicalUserSectionRouteIntent,
  createSdkworkCanonicalUserWorkspaceManifest,
  type CreateSdkworkCanonicalUserRouteIntentOptions,
  type CreateSdkworkCanonicalUserSectionRouteIntentOptions,
  type SdkworkCanonicalUserCapability,
  type SdkworkCanonicalUserRouteIntent,
  type SdkworkCanonicalUserSectionRouteIntent,
  type SdkworkCanonicalUserWorkspaceManifest,
} from "./user.ts";

function toUniquePackages(packageNames: readonly string[]): string[] {
  return Array.from(new Set(packageNames.map((packageName) => packageName.trim()).filter(Boolean)));
}

export interface CreateSdkworkCanonicalUserDefinitionOptions<
  TArchitecture extends string = string,
  TBridgePackageName extends string = string,
  TSourcePackageName extends string = string,
> {
  architecture: TArchitecture;
  bridgePackageName: TBridgePackageName;
  description?: string;
  host?: NonNullable<CreateUserWorkspaceManifestOptions["host"]>;
  id?: string;
  packageNames?: readonly string[];
  routePath?: string;
  sourcePackageName: TSourcePackageName;
  title?: string;
}

export interface CreateSdkworkCanonicalUserDefinitionWorkspaceManifestOptions {
  description?: string;
  host?: NonNullable<CreateUserWorkspaceManifestOptions["host"]>;
  id?: string;
  packageNames?: readonly string[];
  routePath?: string;
  title?: string;
}

export interface CreateSdkworkCanonicalUserDefinitionRouteIntentOptions<
  TSourcePackageName extends string = string,
> extends Omit<CreateSdkworkCanonicalUserRouteIntentOptions<TSourcePackageName>, "sourcePackageName"> {}

export interface CreateSdkworkCanonicalUserDefinitionSectionRouteIntentOptions<
  TSourcePackageName extends string = string,
> extends Omit<CreateSdkworkCanonicalUserSectionRouteIntentOptions<TSourcePackageName>, "sourcePackageName"> {}

export interface SdkworkCanonicalUserDefinition<
  TArchitecture extends string = string,
  TBridgePackageName extends string = string,
  TSourcePackageName extends string = string,
> {
  architecture: TArchitecture;
  bridgePackageName: TBridgePackageName;
  description?: string;
  host?: NonNullable<CreateUserWorkspaceManifestOptions["host"]>;
  id: string;
  packageNames: readonly string[];
  routePath: string;
  sourcePackageName: TSourcePackageName;
  title: string;
  createCapability(routePath?: string): SdkworkCanonicalUserCapability<TSourcePackageName>;
  createRouteIntent(
    options?: CreateSdkworkCanonicalUserDefinitionRouteIntentOptions<TSourcePackageName>,
  ): SdkworkCanonicalUserRouteIntent<TSourcePackageName>;
  createSectionRouteIntent(
    sectionId: string,
    options?: CreateSdkworkCanonicalUserDefinitionSectionRouteIntentOptions<TSourcePackageName>,
  ): SdkworkCanonicalUserSectionRouteIntent<TSourcePackageName>;
  createWorkspaceManifest(
    options?: CreateSdkworkCanonicalUserDefinitionWorkspaceManifestOptions,
  ): SdkworkCanonicalUserWorkspaceManifest<
    TArchitecture,
    TBridgePackageName,
    TSourcePackageName
  >;
}

export function createSdkworkCanonicalUserDefinition<
  TArchitecture extends string,
  TBridgePackageName extends string,
  TSourcePackageName extends string,
>(
  options: CreateSdkworkCanonicalUserDefinitionOptions<
    TArchitecture,
    TBridgePackageName,
    TSourcePackageName
  >,
): SdkworkCanonicalUserDefinition<TArchitecture, TBridgePackageName, TSourcePackageName> {
  const routePath = defaultIfBlank(options.routePath, "/user");
  const id = defaultIfBlank(options.id, `${options.bridgePackageName}-workspace`);
  const packageNames = Object.freeze(toUniquePackages(options.packageNames ?? [options.bridgePackageName]));
  const title = defaultIfBlank(options.title, "User");

  function createCapability(
    capabilityRoutePath: string = routePath,
  ): SdkworkCanonicalUserCapability<TSourcePackageName> {
    return createSdkworkCanonicalUserCapability({
      routePath: capabilityRoutePath,
      sourcePackageName: options.sourcePackageName,
    });
  }

  function createWorkspaceManifest(
    manifestOptions: CreateSdkworkCanonicalUserDefinitionWorkspaceManifestOptions = {},
  ): SdkworkCanonicalUserWorkspaceManifest<
    TArchitecture,
    TBridgePackageName,
    TSourcePackageName
  > {
    return createSdkworkCanonicalUserWorkspaceManifest({
      architecture: options.architecture,
      bridgePackageName: options.bridgePackageName,
      description: manifestOptions.description ?? options.description,
      host: manifestOptions.host ?? options.host,
      id: manifestOptions.id ?? id,
      packageNames: manifestOptions.packageNames
        ? [...manifestOptions.packageNames]
        : [...packageNames],
      routePath: manifestOptions.routePath ?? routePath,
      sourcePackageName: options.sourcePackageName,
      title: manifestOptions.title ?? title,
    });
  }

  function createRouteIntent(
    routeIntentOptions: CreateSdkworkCanonicalUserDefinitionRouteIntentOptions<TSourcePackageName> = {},
  ): SdkworkCanonicalUserRouteIntent<TSourcePackageName> {
    return createSdkworkCanonicalUserRouteIntent({
      basePath: routeIntentOptions.basePath ?? routePath,
      focusWindow: routeIntentOptions.focusWindow,
      group: routeIntentOptions.group,
      sourcePackageName: options.sourcePackageName,
    });
  }

  function createSectionRouteIntent(
    sectionId: string,
    routeIntentOptions: CreateSdkworkCanonicalUserDefinitionSectionRouteIntentOptions<TSourcePackageName> = {},
  ): SdkworkCanonicalUserSectionRouteIntent<TSourcePackageName> {
    return createSdkworkCanonicalUserSectionRouteIntent(sectionId, {
      basePath: routeIntentOptions.basePath ?? routePath,
      focusWindow: routeIntentOptions.focusWindow,
      group: routeIntentOptions.group,
      sourcePackageName: options.sourcePackageName,
    });
  }

  return Object.freeze({
    architecture: options.architecture,
    bridgePackageName: options.bridgePackageName,
    createCapability,
    createRouteIntent,
    createSectionRouteIntent,
    createWorkspaceManifest,
    description: options.description,
    host: options.host,
    id,
    packageNames,
    routePath,
    sourcePackageName: options.sourcePackageName,
    title,
  });
}
