import {
  createSdkworkCanonicalAuthRouteCatalog,
  createSdkworkCanonicalAuthRouteIntent,
  createSdkworkCanonicalAuthWorkspaceManifest,
  resolveAuthWorkspaceRoutes,
  type CreateAuthWorkspaceManifestOptions,
  type CreateSdkworkCanonicalAuthRouteIntentOptions,
  type SdkworkAuthRouteId,
  type SdkworkCanonicalAuthRouteDefinition,
  type SdkworkCanonicalAuthRouteIntent,
  type SdkworkCanonicalAuthWorkspaceManifest,
} from "./auth.ts";
import { defaultIfBlank } from "@sdkwork/utils";

function toUniquePackages(packageNames: readonly string[]): string[] {
  return Array.from(new Set(packageNames.map((packageName) => packageName.trim()).filter(Boolean)));
}

function normalizeRoutePath(routePath: string | undefined, fallback: string): string {
  const normalizedRoutePath = routePath?.trim();
  if (!normalizedRoutePath) {
    return fallback;
  }

  return normalizedRoutePath.startsWith("/") ? normalizedRoutePath : `/${normalizedRoutePath}`;
}

export interface CreateSdkworkCanonicalAuthDefinitionOptions<
  TArchitecture extends string = string,
  TBridgePackageName extends string = string,
  TSourcePackageName extends string = string,
> {
  architecture: TArchitecture;
  basePath?: string;
  bridgePackageName: TBridgePackageName;
  description?: string;
  host?: NonNullable<CreateAuthWorkspaceManifestOptions["host"]>;
  id?: string;
  packageNames?: readonly string[];
  sourcePackageName: TSourcePackageName;
  title?: string;
}

export interface CreateSdkworkCanonicalAuthDefinitionWorkspaceManifestOptions {
  basePath?: string;
  description?: string;
  forgotPasswordRoutePath?: string;
  host?: NonNullable<CreateAuthWorkspaceManifestOptions["host"]>;
  id?: string;
  loginRoutePath?: string;
  oauthCallbackRoutePattern?: string;
  packageNames?: readonly string[];
  qrRoutePath?: string;
  registerRoutePath?: string;
  title?: string;
}

export interface CreateSdkworkCanonicalAuthDefinitionRouteIntentOptions<
  TSourcePackageName extends string = string,
> extends Omit<CreateSdkworkCanonicalAuthRouteIntentOptions<TSourcePackageName>, "basePath" | "sourcePackageName"> {
  basePath?: string;
}

export interface SdkworkCanonicalAuthDefinition<
  TArchitecture extends string = string,
  TBridgePackageName extends string = string,
  TSourcePackageName extends string = string,
> {
  architecture: TArchitecture;
  basePath: string;
  bridgePackageName: TBridgePackageName;
  description?: string;
  host?: NonNullable<CreateAuthWorkspaceManifestOptions["host"]>;
  id: string;
  packageNames: readonly string[];
  sourcePackageName: TSourcePackageName;
  title: string;
  createRouteCatalog(
    basePath?: string,
  ): Array<SdkworkCanonicalAuthRouteDefinition<TSourcePackageName>>;
  createRouteIntent(
    routeId: SdkworkAuthRouteId,
    options?: CreateSdkworkCanonicalAuthDefinitionRouteIntentOptions<TSourcePackageName>,
  ): SdkworkCanonicalAuthRouteIntent<TSourcePackageName>;
  createWorkspaceManifest(
    options?: CreateSdkworkCanonicalAuthDefinitionWorkspaceManifestOptions,
  ): SdkworkCanonicalAuthWorkspaceManifest<
    TArchitecture,
    TBridgePackageName,
    TSourcePackageName
  >;
}

export function createSdkworkCanonicalAuthDefinition<
  TArchitecture extends string,
  TBridgePackageName extends string,
  TSourcePackageName extends string,
>(
  options: CreateSdkworkCanonicalAuthDefinitionOptions<
    TArchitecture,
    TBridgePackageName,
    TSourcePackageName
  >,
): SdkworkCanonicalAuthDefinition<TArchitecture, TBridgePackageName, TSourcePackageName> {
  const basePath = defaultIfBlank(options.basePath, "/auth");
  const id = defaultIfBlank(options.id, `${options.bridgePackageName}-workspace`);
  const packageNames = Object.freeze(toUniquePackages(options.packageNames ?? [options.bridgePackageName]));
  const title = defaultIfBlank(options.title, "Auth");

  function createRouteCatalog(
    routeBasePath: string = basePath,
  ): Array<SdkworkCanonicalAuthRouteDefinition<TSourcePackageName>> {
    return createSdkworkCanonicalAuthRouteCatalog({
      basePath: routeBasePath,
      sourcePackageName: options.sourcePackageName,
    });
  }

  function createWorkspaceManifest(
    manifestOptions: CreateSdkworkCanonicalAuthDefinitionWorkspaceManifestOptions = {},
  ): SdkworkCanonicalAuthWorkspaceManifest<
    TArchitecture,
    TBridgePackageName,
    TSourcePackageName
  > {
    const resolvedBasePath = manifestOptions.basePath ?? basePath;
    const defaultRoutes = resolveAuthWorkspaceRoutes(resolvedBasePath);

    return createSdkworkCanonicalAuthWorkspaceManifest({
      architecture: options.architecture,
      bridgePackageName: options.bridgePackageName,
      description: manifestOptions.description ?? options.description,
      forgotPasswordRoutePath: normalizeRoutePath(
        manifestOptions.forgotPasswordRoutePath,
        defaultRoutes.forgotPasswordRoutePath,
      ),
      host: manifestOptions.host ?? options.host,
      id: manifestOptions.id ?? id,
      loginRoutePath: normalizeRoutePath(
        manifestOptions.loginRoutePath,
        defaultRoutes.loginRoutePath,
      ),
      oauthCallbackRoutePattern: normalizeRoutePath(
        manifestOptions.oauthCallbackRoutePattern,
        defaultRoutes.oauthCallbackRoutePattern,
      ),
      packageNames: manifestOptions.packageNames
        ? [...manifestOptions.packageNames]
        : [...packageNames],
      qrRoutePath: normalizeRoutePath(
        manifestOptions.qrRoutePath,
        defaultRoutes.qrRoutePath,
      ),
      registerRoutePath: normalizeRoutePath(
        manifestOptions.registerRoutePath,
        defaultRoutes.registerRoutePath,
      ),
      sourcePackageName: options.sourcePackageName,
      title: manifestOptions.title ?? title,
    });
  }

  function createRouteIntent(
    routeId: SdkworkAuthRouteId,
    routeIntentOptions: CreateSdkworkCanonicalAuthDefinitionRouteIntentOptions<TSourcePackageName> = {},
  ): SdkworkCanonicalAuthRouteIntent<TSourcePackageName> {
    return createSdkworkCanonicalAuthRouteIntent(routeId, {
      basePath: routeIntentOptions.basePath ?? basePath,
      focusWindow: routeIntentOptions.focusWindow,
      provider: routeIntentOptions.provider,
      redirectTo: routeIntentOptions.redirectTo,
      routes: routeIntentOptions.routes,
      sourcePackageName: options.sourcePackageName,
    });
  }

  return Object.freeze({
    architecture: options.architecture,
    basePath,
    bridgePackageName: options.bridgePackageName,
    createRouteCatalog,
    createRouteIntent,
    createWorkspaceManifest,
    description: options.description,
    host: options.host,
    id,
    packageNames,
    sourcePackageName: options.sourcePackageName,
    title,
  });
}
