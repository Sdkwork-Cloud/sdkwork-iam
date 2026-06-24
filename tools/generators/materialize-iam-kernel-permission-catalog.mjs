#!/usr/bin/env node
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(__dirname, "../..");
const manifestPath = path.join(
  appRoot,
  "iam/modules/iam-kernel/iam.module.manifest.json",
);
const outputPath = path.join(
  appRoot,
  "crates/sdkwork-iam-bootstrap/src/permission_catalog.rs",
);

const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const lines = [
  "//! Standard permission catalog seeds written to `iam_permission`.",
  "//! Canonical source: `iam/modules/*/iam.module.manifest.json` materialized by `sdkwork-iam-module-registry`.",
  "//! This module retains iam-kernel permissions for backward-compatible tests only.",
  "use crate::PermissionSeed;",
  "",
  "pub const IAM_STANDARD_PERMISSION_SEEDS: &[PermissionSeed] = &[",
];

for (const permission of manifest.permissions.catalog) {
  const name = permission.name.replaceAll('"', '\\"');
  lines.push("    PermissionSeed {");
  lines.push(`        code: "${permission.code}",`);
  lines.push(`        name: "${name}",`);
  lines.push(`        resource: "${permission.resource}",`);
  lines.push(`        action: "${permission.action}",`);
  lines.push("    },");
}
lines.push("];");
lines.push("");

await writeFile(outputPath, `${lines.join("\n")}\n`, "utf8");
process.stdout.write(
  `materialized iam-kernel permission catalog (${manifest.permissions.catalog.length} permissions)\n`,
);
