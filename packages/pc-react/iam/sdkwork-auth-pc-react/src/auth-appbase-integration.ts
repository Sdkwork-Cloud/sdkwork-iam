import {
  appbasePackageMeta,
  createSdkworkAppCapabilityPresetManifest,
  type AppbasePackageMeta,
  type SdkworkAppCapabilityManifest,
  type SdkworkPcReactAppPresetId,
} from "@sdkwork/appbase-pc-react";
import {
  authPackageMeta,
  createAuthRouteCatalog,
  type AuthPackageMeta,
  type SdkworkAuthRouteDefinition,
} from "./auth.ts";

export interface SdkworkAuthAppbaseIntegrationApp {
  description?: string;
  id: string;
  title: string;
}

export interface CreateSdkworkAuthAppbaseIntegrationOptions {
  app: SdkworkAuthAppbaseIntegrationApp;
  basePath?: string;
  excludePackageNames?: readonly string[];
  extraPackageNames?: readonly string[];
  presetId?: SdkworkPcReactAppPresetId;
}

export interface SdkworkAuthAppbaseMeta {
  appbasePackageMeta: AppbasePackageMeta;
  authPackageMeta: AuthPackageMeta;
  manifest: SdkworkAppCapabilityManifest;
}

export interface SdkworkAuthAppbaseIntegration {
  appbaseMeta: SdkworkAuthAppbaseMeta;
  manifest: SdkworkAppCapabilityManifest;
  routes: SdkworkAuthRouteDefinition[];
}

function toUniquePackageNames(packageNames: readonly string[]): string[] {
  return Array.from(
    new Set(packageNames.map((packageName) => packageName.trim()).filter(Boolean)),
  );
}

export function createSdkworkAuthAppbaseIntegration({
  app,
  basePath = "/auth",
  excludePackageNames = [],
  extraPackageNames = [],
  presetId = "core-desktop",
}: CreateSdkworkAuthAppbaseIntegrationOptions): SdkworkAuthAppbaseIntegration {
  const manifest = createSdkworkAppCapabilityPresetManifest(presetId, {
    description: app.description,
    excludePackageNames,
    extraPackageNames: toUniquePackageNames([
      "@sdkwork/auth-pc-react",
      ...extraPackageNames,
    ]),
    id: app.id,
    title: app.title,
  });
  const routes = createAuthRouteCatalog(basePath);

  return {
    appbaseMeta: {
      appbasePackageMeta,
      authPackageMeta,
      manifest,
    },
    manifest,
    routes,
  };
}
