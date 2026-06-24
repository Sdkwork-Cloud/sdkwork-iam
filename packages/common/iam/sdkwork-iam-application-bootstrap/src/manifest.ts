import { createHash } from "node:crypto";

import type {
  IamApplicationBootstrapEnvironment,
  RegisteredApplicationTemplateResult,
  SdkworkAppManifest,
} from "./types.ts";
import {
  DEFAULT_IAM_ORGANIZATION_ID,
  DEFAULT_IAM_TENANT_ID,
} from "./constants.ts";

export function hashManifestContent(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

export function manifestToRegisterCommand(manifest: SdkworkAppManifest, manifestHash: string) {
  const app = manifest.app ?? {};
  const backend = manifest.backend ?? {};
  const release =
    (manifest.release?.notes ?? []).find((note) => note.current) ?? manifest.release?.notes?.[0] ?? {};
  const packages = (manifest.artifacts?.installConfig?.packages ?? []).map((pkg) => ({
    packageId: pkg.id ?? pkg.packageId,
    platform: pkg.platform,
    architecture: pkg.architecture,
    language: pkg.language,
    runtimeTarget: pkg.runtimeTarget,
    deploymentProfile: pkg.deploymentProfile,
    packageFormat: pkg.packageFormat,
    version: pkg.version ?? release.version,
    config: pkg,
  }));

  return {
    appKey: app.key,
    name: app.name,
    displayName: app.displayName ?? app.name,
    appType: app.appType,
    packageName: app.identifiers?.packageName,
    bundleId: app.identifiers?.bundleId,
    version: release.version ?? "0.0.0",
    channel: release.channel ?? "stable",
    manifestHash,
    defaultAccessPermissions: backend.accessTokenPermissionScope ?? backend.permissionScope ?? [],
    config: {
      runtime: manifest.runtime ?? {},
      publish: manifest.publish ?? {},
      security: manifest.security ?? {},
    },
    packages,
  };
}

export function manifestToProvisionCommand(
  manifest: SdkworkAppManifest,
  environment: IamApplicationBootstrapEnvironment,
  registered: RegisteredApplicationTemplateResult,
) {
  const app = manifest.app ?? {};
  const backend = manifest.backend ?? {};

  return {
    tenantId: environment.tenantId || backend.tenantId || DEFAULT_IAM_TENANT_ID,
    organizationId: environment.organizationId || backend.organizationId || DEFAULT_IAM_ORGANIZATION_ID,
    templateId: registered.templateId,
    appKey: app.key,
    instanceKey: environment.instanceKey ?? "dev",
    displayName: app.displayName ?? app.name,
    environment: environment.environment,
    primaryDomain: environment.primaryDomain || backend.primaryDomain || backend.domain || "",
    accessPermissions: backend.accessTokenPermissionScope ?? backend.permissionScope ?? [],
  };
}

export function validateManifestForBootstrap(manifest: SdkworkAppManifest): void {
  const register = manifestToRegisterCommand(manifest, "validation");
  if (!register.appKey) {
    throw new Error("app.key must be configured in sdkwork.app.config.json");
  }
  if (!register.name) {
    throw new Error("app.name must be configured in sdkwork.app.config.json");
  }
  if (!register.appType) {
    throw new Error("app.appType must be configured in sdkwork.app.config.json");
  }
  if (!Array.isArray(register.defaultAccessPermissions) || register.defaultAccessPermissions.length === 0) {
    throw new Error("backend.accessTokenPermissionScope must be configured in sdkwork.app.config.json");
  }
}

export function validateBootstrapEnvironment(environment: IamApplicationBootstrapEnvironment): void {
  if (!environment.backendApiBaseUrl) {
    throw new Error("backendApiBaseUrl is required for IAM application bootstrap");
  }
  if (!environment.primaryDomain) {
    throw new Error("primaryDomain is required for tenant application bootstrap");
  }
  if (!environment.environment) {
    throw new Error("environment is required for tenant application bootstrap");
  }
}
