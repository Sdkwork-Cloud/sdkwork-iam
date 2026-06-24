#!/usr/bin/env node
/**
 * Workspace-wide rename of legacy sdkwork_appbase_* IAM symbols to sdkwork_iam_*.
 */
import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { join, extname } from "node:path";

const WORKSPACE_ROOT = join(import.meta.dirname, "../..");

const SKIP_DIRS = new Set([
  "node_modules",
  "target",
  "target-alt",
  ".git",
  "dist",
  ".pnpm-store",
  "agent-transcripts",
]);

const SKIP_PATH_PARTS = [
  `${join("docs", "superpowers")}`,
  `${join("docs", "archive")}`,
];

const REPLACEMENTS = [
  ["build_embedded_sdkwork_iam_backend_api_router", "build_embedded_sdkwork_iam_backend_api_router"],
  ["build_embedded_sdkwork_iam_app_api_router", "build_embedded_sdkwork_iam_app_api_router"],
  ["build_sdkwork_iam_oauth_device_authorization", "build_sdkwork_iam_oauth_device_authorization"],
  ["build_sdkwork_iam_open_api", "build_sdkwork_iam_open_api"],
  ["build_sdkwork_iam_backend_api", "build_sdkwork_iam_backend_api"],
  ["build_sdkwork_iam_app_api", "build_sdkwork_iam_app_api"],
  ["sdkwork_iam_open_api", "sdkwork_iam_open_api"],
  ["sdkwork_iam_backend_api", "sdkwork_iam_backend_api"],
  ["sdkwork_iam_app_api", "sdkwork_iam_app_api"],
  ["sdkwork_iam_open_sdk", "sdkwork_iam_open_sdk"],
  ["sdkwork_iam_backend_sdk", "sdkwork_iam_backend_sdk"],
  ["sdkwork_iam_app_sdk", "sdkwork_iam_app_sdk"],
  ["sdkwork_iam_database_host", "sdkwork_iam_database_host"],
  ["sdkwork_iam_bootstrap", "sdkwork_iam_bootstrap"],
  ["sdkwork_iam_tauri_host", "sdkwork_iam_tauri_host"],
  ["SdkworkIamLocalIam", "SdkworkIamLocalIam"],
];

const EXTENSIONS = new Set([
  ".rs",
  ".toml",
  ".json",
  ".mjs",
  ".ts",
  ".tsx",
  ".py",
  ".md",
  ".yaml",
  ".yml",
]);

function shouldSkipPath(fullPath) {
  return SKIP_PATH_PARTS.some((part) => fullPath.includes(part));
}

function walk(dir, files = []) {
  if (!existsSync(dir)) return files;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = join(dir, entry.name);
    if (shouldSkipPath(full)) continue;
    if (entry.isDirectory()) {
      walk(full, files);
    } else if (entry.isFile() && EXTENSIONS.has(extname(entry.name))) {
      files.push(full);
    }
  }
  return files;
}

let changed = 0;
for (const file of walk(WORKSPACE_ROOT)) {
  const original = readFileSync(file, "utf8");
  let next = original;
  for (const [from, to] of REPLACEMENTS) {
    next = next.split(from).join(to);
  }
  if (next !== original) {
    writeFileSync(file, next, "utf8");
    changed += 1;
  }
}

console.log(`Updated ${changed} files under ${WORKSPACE_ROOT}.`);
