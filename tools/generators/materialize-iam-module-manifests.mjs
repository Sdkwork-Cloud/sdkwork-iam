#!/usr/bin/env node
// Materialize iam module manifests from legacy Rust catalogs.
// Source of truth transitions to JSON manifests; Rust bootstrap consumes the registry crate.
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(__dirname, "../..");
const permissionCatalogPath = path.join(
  appRoot,
  "crates/sdkwork-iam-bootstrap/src/permission_catalog.rs",
);
const roleCatalogPath = path.join(
  appRoot,
  "crates/sdkwork-iam-bootstrap/src/role_catalog.rs",
);
const modulesRoot = path.join(appRoot, "iam/modules");

const DOMAIN_MODULE_MAP = {
  iam: "iam-kernel",
  commerce: "commerce",
  finance: "commerce",
  ai: "ai",
  apps: "apps",
  courses: "courses",
  drive: "drive",
  storage: "drive",
  messaging: "messaging",
  integrations: "integrations",
  ops: "ops",
  iot: "iot",
};

function parsePermissionSeeds(source) {
  const entries = [];
  const blockRe =
    /PermissionSeed\s*\{\s*code:\s*"([^"]+)",\s*name:\s*"([^"]+)",\s*resource:\s*"([^"]+)",\s*action:\s*"([^"]+)",\s*\}/gs;
  for (const match of source.matchAll(blockRe)) {
    entries.push({
      code: match[1],
      name: match[2],
      resource: match[3],
      action: match[4],
      status: "active",
      since: "1.0.0",
      replacementCode: null,
    });
  }
  return entries;
}

function parseRoleGrantExtensions(source) {
  const extensions = [];
  const grantRe =
    /StandardRoleGrant\s*\{\s*role_code:\s*([A-Z_]+),\s*patterns:\s*&\[([\s\S]*?)\],\s*\}/g;
  for (const match of source.matchAll(grantRe)) {
    const roleConst = match[1];
    const roleCode = roleConst
      .replace(/_ROLE_CODE$/, "")
      .toLowerCase()
      .replace(/^(app|org|platform)_(.+)$/, (_, prefix, rest) => {
        if (prefix === "app") return `app_${rest}`;
        if (prefix === "org") return `org_${rest}`;
        return `platform_${rest}`;
      });
    const normalizedRoleCode = roleConst
      .replace(/_ROLE_CODE$/, "")
      .split("_")
      .join("_")
      .replace(/^APP_USER$/, "app_user")
      .replace(/^ORG_ADMIN$/, "org_admin")
      .replace(/^ORG_ASSISTANT$/, "org_assistant")
      .replace(/^ORG_AUDITOR$/, "org_auditor")
      .replace(/^ORG_FINANCE$/, "org_finance")
      .replace(/^ORG_OPERATIONS$/, "org_operations")
      .replace(/^PLATFORM_SYSTEM_ADMIN$/, "platform_system_admin")
      .replace(/^PLATFORM_SUPER_ADMIN$/, "platform_super_admin");
    const patterns = [...match[2].matchAll(/"([^"]+)"/g)].map((m) => m[1]);
    extensions.push({ roleCode: normalizedRoleCode, patterns });
  }
  return extensions;
}

function permissionDomain(code) {
  if (code === "*") return "iam";
  if (code.includes(":")) return code.split(":")[0];
  return code.split(".")[0];
}

function moduleForPermission(code) {
  const domain = permissionDomain(code);
  return DOMAIN_MODULE_MAP[domain] ?? domain;
}

function patternsOwnedByModule(patterns, moduleId, domain) {
  return patterns.filter((pattern) => {
    if (pattern === "*") return moduleId === "iam-kernel";
    if (pattern.endsWith(".*")) {
      const prefix = pattern.slice(0, -2);
      if (prefix === "iam") return moduleId === "iam-kernel";
      return DOMAIN_MODULE_MAP[prefix] === moduleId || prefix === domain;
    }
    if (pattern.startsWith("*.")) return false;
    return moduleForPermission(pattern) === moduleId;
  });
}

function kernelDirectoryTemplates() {
  return {
    organizationTemplates: [
      {
        ref: "root",
        code: "root",
        name: "Root Organization",
        seedId: "0",
        organizationKind: "team",
        tenantBoundaryKind: "exclusive",
        dataBoundaryKind: "tenant",
        verificationStatus: "verified",
        sortOrder: 0,
      },
    ],
    departmentTemplates: [
      {
        ref: "dept.general",
        code: "general",
        name: "General",
        parentRef: "$orgref:root",
        departmentKind: "general",
        sortOrder: 10,
        defaultPositions: ["pos.member"],
      },
    ],
    positionTemplates: [
      {
        ref: "pos.member",
        code: "member",
        name: "Member",
        organizationRef: "$orgref:root",
        departmentRef: "dept.general",
        positionKind: "member",
        defaultRoleBindings: ["app_user"],
      },
    ],
    membershipTemplates: [
      {
        ref: "bootstrap-owner",
        membershipKind: "owner",
        organizationRef: "$orgref:root",
        isPrimary: true,
        defaultRoleBindings: ["org_admin", "platform_super_admin", "app_user"],
      },
    ],
  };
}

async function main() {
  const permissionSource = await readFile(permissionCatalogPath, "utf8");
  const roleSource = await readFile(roleCatalogPath, "utf8");
  const permissions = parsePermissionSeeds(permissionSource);
  const allGrants = parseRoleGrantExtensions(roleSource);

  const byModule = new Map();
  for (const permission of permissions) {
    const moduleId = moduleForPermission(permission.code);
    if (!byModule.has(moduleId)) byModule.set(moduleId, []);
    byModule.get(moduleId).push(permission);
  }

  const moduleIds = [...new Set([...byModule.keys(), "iam-kernel"])];
  await mkdir(modulesRoot, { recursive: true });

  for (const moduleId of moduleIds) {
    const domain =
      moduleId === "iam-kernel"
        ? "iam"
        : moduleId === "commerce"
          ? "commerce"
          : moduleId;
    const catalog = (byModule.get(moduleId) ?? []).sort((a, b) =>
      a.code.localeCompare(b.code),
    );
    const roleGrantExtensions =
      moduleId === "iam-kernel"
        ? allGrants
        : allGrants
            .map((grant) => ({
              roleCode: grant.roleCode,
              patterns: patternsOwnedByModule(grant.patterns, moduleId, domain),
            }))
            .filter((grant) => grant.patterns.length > 0);

    const manifest = {
      schemaVersion: 1,
      kind: "sdkwork.iam.module",
      moduleId,
      catalogVersion: "1.0.0",
      domain,
      owner: moduleId === "iam-kernel" ? "sdkwork-appbase" : `sdkwork-${domain}`,
      displayName:
        moduleId === "iam-kernel" ? "IAM Kernel Module" : `${domain} module`,
      permissions: {
        catalog,
        openapiAuthorities: [],
      },
      roles: {
        domainStandardRoles: [],
        roleGrantExtensions,
        roleExclusions: [],
      },
      directory: moduleId === "iam-kernel" ? kernelDirectoryTemplates() : {
        organizationTemplates: [],
        departmentTemplates: [],
        positionTemplates: [],
        membershipTemplates: [],
      },
      policyConditions: { supportedAttributes: [] },
      oauthScopeMappings: [],
      dependencies: {
        requiresModules: moduleId === "iam-kernel" ? [] : ["iam-kernel"],
      },
    };

    const moduleDir = path.join(modulesRoot, moduleId);
    await mkdir(moduleDir, { recursive: true });
    const manifestPath = path.join(moduleDir, "iam.module.manifest.json");
    const json = `${JSON.stringify(manifest, null, 2)}\n`;
    await writeFile(manifestPath, json, "utf8");
    const sha = createHash("sha256").update(json).digest("hex");
    process.stdout.write(`${moduleId}: ${catalog.length} permissions sha256=${sha}\n`);
  }

  const registryConfig = {
    schemaVersion: 1,
    kind: "sdkwork.iam.registry.config",
    defaultProfile: "operational",
    enabledModules: moduleIds.filter((id) => id !== "iot"),
    optionalModules: ["iot"],
  };
  const existingRegistryPath = path.join(appRoot, "iam/registry/iam-registry.config.json");
  try {
    const existing = JSON.parse(await readFile(existingRegistryPath, "utf8"));
    if (Array.isArray(existing.enabledModules) && existing.enabledModules.length > 0) {
      registryConfig.enabledModules = existing.enabledModules;
    }
    if (Array.isArray(existing.optionalModules)) {
      registryConfig.optionalModules = existing.optionalModules;
    }
  } catch {
    // keep generated defaults
  }
  const registryDir = path.join(appRoot, "iam/registry");
  await mkdir(registryDir, { recursive: true });
  await writeFile(
    path.join(registryDir, "iam-registry.config.json"),
    `${JSON.stringify(registryConfig, null, 2)}\n`,
    "utf8",
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
