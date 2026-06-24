#!/usr/bin/env node
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(__dirname, "../..");
const registryPath = path.join(appRoot, "iam/registry/iam-registry.config.json");
const apiRoots = [
  path.join(appRoot, "apis/app-api"),
  path.join(appRoot, "apis/backend-api"),
  path.join(appRoot, "apis/open-api"),
];

const PERMISSION_RE = /"x-sdkwork-permission"\s*:\s*"([^"]+)"/g;

async function collectOpenApiPermissions() {
  const permissions = new Set();
  for (const root of apiRoots) {
    let entries = [];
    try {
      entries = await readdir(root, { recursive: true, withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.endsWith(".yaml")) continue;
      const filePath = path.join(entry.path ?? root, entry.name);
      const source = await readFile(filePath, "utf8");
      for (const match of source.matchAll(PERMISSION_RE)) {
        permissions.add(match[1]);
      }
    }
  }
  return permissions;
}

async function collectManifestPermissions(moduleIds) {
  const permissions = new Map();
  for (const moduleId of moduleIds) {
    const manifestPath = path.join(
      appRoot,
      "iam/modules",
      moduleId,
      "iam.module.manifest.json",
    );
    const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
    for (const permission of manifest.permissions?.catalog ?? []) {
      permissions.set(permission.code, moduleId);
    }
  }
  return permissions;
}

function patternMatches(permissionCode, pattern) {
  if (pattern === "*") return true;
  if (pattern.endsWith(".*")) {
    const prefix = pattern.slice(0, -2);
    return permissionCode === prefix || permissionCode.startsWith(`${prefix}.`);
  }
  return permissionCode === pattern;
}

function manifestCoversPermission(manifestPermissions, rolePatterns, code) {
  if (manifestPermissions.has(code)) return true;
  for (const patterns of rolePatterns.values()) {
    for (const pattern of patterns) {
      if (patternMatches(code, pattern)) return true;
    }
  }
  return false;
}

async function main() {
  const registry = JSON.parse(await readFile(registryPath, "utf8"));
  const moduleIds = [
    ...(registry.enabledModules ?? []),
    ...(registry.optionalModules ?? []),
  ];
  const manifestPermissions = await collectManifestPermissions(moduleIds);
  const rolePatterns = new Map();
  for (const moduleId of moduleIds) {
    const manifestPath = path.join(
      appRoot,
      "iam/modules",
      moduleId,
      "iam.module.manifest.json",
    );
    const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
    for (const grant of manifest.roles?.roleGrantExtensions ?? []) {
      rolePatterns.set(grant.roleCode, grant.patterns ?? []);
    }
    for (const role of manifest.roles?.domainStandardRoles ?? []) {
      rolePatterns.set(role.code, role.permissionPatterns ?? []);
    }
  }

  const openapiPermissions = await collectOpenApiPermissions();
  const missing = [];
  for (const code of [...openapiPermissions].sort()) {
    if (!manifestCoversPermission(manifestPermissions, rolePatterns, code)) {
      missing.push(code);
    }
  }

  if (missing.length > 0) {
    console.error("OpenAPI permissions missing from IMF manifests:");
    for (const code of missing) {
      console.error(`  - ${code}`);
    }
    process.exit(1);
  }

  process.stdout.write(
    `ok reconcile ${openapiPermissions.size} openapi permissions across ${moduleIds.length} modules\n`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
