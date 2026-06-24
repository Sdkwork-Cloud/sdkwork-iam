#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(__dirname, "../..");
const registryRoot = path.join(appRoot, "iam/registry/iam-registry.config.json");

const config = JSON.parse(await readFile(registryRoot, "utf8"));
const enabledModules = [
  ...(config.enabledModules ?? []),
  ...(config.optionalModules ?? []),
];
let failures = 0;

for (const moduleId of enabledModules) {
  const manifestPath = path.join(
    appRoot,
    "iam/modules",
    moduleId,
    "iam.module.manifest.json",
  );
  try {
    const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
    if (manifest.moduleId !== moduleId) {
      throw new Error(`moduleId mismatch: expected ${moduleId}, got ${manifest.moduleId}`);
    }
    if (!Array.isArray(manifest.permissions?.catalog)) {
      throw new Error("permissions.catalog must be an array");
    }
    for (const permission of manifest.permissions.catalog) {
      if (permission.status === "deprecated" && !permission.replacementCode) {
        throw new Error(
          `deprecated permission ${permission.code} missing replacementCode`,
        );
      }
    }
    process.stdout.write(`ok ${moduleId} (${manifest.permissions.catalog.length} permissions)\n`);
  } catch (error) {
    failures += 1;
    process.stderr.write(`fail ${moduleId}: ${error instanceof Error ? error.message : String(error)}\n`);
  }
}

if (failures > 0) {
  process.exit(1);
}
