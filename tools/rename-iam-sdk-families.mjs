#!/usr/bin/env node
/**
 * Rename IAM SDK families from sdkwork-appbase-* to sdkwork-iam-* per NAMING_SPEC.
 * Run: node tools/rename-iam-sdk-families.mjs [--dry-run]
 */
import { readdir, readFile, writeFile, rename, stat } from "node:fs/promises";
import path from "node:path";

const workspaceRoot = path.resolve(import.meta.dirname, "../..");
const dryRun = process.argv.includes("--dry-run");

const textReplacements = [
  ["sdkwork-appbase-app-sdk-typescript", "sdkwork-iam-app-sdk-typescript"],
  ["sdkwork-appbase-backend-sdk-typescript", "sdkwork-iam-backend-sdk-typescript"],
  ["sdkwork-appbase-open-sdk-typescript", "sdkwork-iam-open-sdk-typescript"],
  ["sdkwork-appbase-app-sdk-dart", "sdkwork-iam-app-sdk-dart"],
  ["sdkwork-appbase-backend-sdk-dart", "sdkwork-iam-backend-sdk-dart"],
  ["sdkwork-appbase-open-sdk-dart", "sdkwork-iam-open-sdk-dart"],
  ["sdkwork-appbase-app-sdk-rust", "sdkwork-iam-app-sdk-rust"],
  ["sdkwork-appbase-backend-sdk-rust", "sdkwork-iam-backend-sdk-rust"],
  ["sdkwork-appbase-open-sdk-rust", "sdkwork-iam-open-sdk-rust"],
  ["sdkwork-appbase-app-sdk-java", "sdkwork-iam-app-sdk-java"],
  ["sdkwork-appbase-backend-sdk-java", "sdkwork-iam-backend-sdk-java"],
  ["sdkwork-appbase-open-sdk-java", "sdkwork-iam-open-sdk-java"],
  ["sdkwork-appbase-app-sdk-kotlin", "sdkwork-iam-app-sdk-kotlin"],
  ["sdkwork-appbase-backend-sdk-kotlin", "sdkwork-iam-backend-sdk-kotlin"],
  ["sdkwork-appbase-open-sdk-kotlin", "sdkwork-iam-open-sdk-kotlin"],
  ["sdkwork-appbase-app-sdk-python", "sdkwork-iam-app-sdk-python"],
  ["sdkwork-appbase-backend-sdk-python", "sdkwork-iam-backend-sdk-python"],
  ["sdkwork-appbase-open-sdk-python", "sdkwork-iam-open-sdk-python"],
  ["sdkwork-appbase-app-sdk-go", "sdkwork-iam-app-sdk-go"],
  ["sdkwork-appbase-backend-sdk-go", "sdkwork-iam-backend-sdk-go"],
  ["sdkwork-appbase-open-sdk-go", "sdkwork-iam-open-sdk-go"],
  ["sdkwork-appbase-app-sdk-swift", "sdkwork-iam-app-sdk-swift"],
  ["sdkwork-appbase-backend-sdk-swift", "sdkwork-iam-backend-sdk-swift"],
  ["sdkwork-appbase-open-sdk-swift", "sdkwork-iam-open-sdk-swift"],
  ["sdkwork-appbase-app-sdk-csharp", "sdkwork-iam-app-sdk-csharp"],
  ["sdkwork-appbase-backend-sdk-csharp", "sdkwork-iam-backend-sdk-csharp"],
  ["sdkwork-appbase-open-sdk-csharp", "sdkwork-iam-open-sdk-csharp"],
  ["sdkwork-appbase-app-sdk-flutter", "sdkwork-iam-app-sdk-flutter"],
  ["sdkwork-appbase-backend-sdk-flutter", "sdkwork-iam-backend-sdk-flutter"],
  ["sdkwork-appbase-open-sdk-flutter", "sdkwork-iam-open-sdk-flutter"],
  ["sdkwork-appbase-app-sdk-php", "sdkwork-iam-app-sdk-php"],
  ["sdkwork-appbase-backend-sdk-php", "sdkwork-iam-backend-sdk-php"],
  ["sdkwork-appbase-open-sdk-php", "sdkwork-iam-open-sdk-php"],
  ["sdkwork-appbase-app-sdk-ruby", "sdkwork-iam-app-sdk-ruby"],
  ["sdkwork-appbase-backend-sdk-ruby", "sdkwork-iam-backend-sdk-ruby"],
  ["sdkwork-appbase-open-sdk-ruby", "sdkwork-iam-open-sdk-ruby"],
  ["@sdkwork/appbase-app-sdk", "@sdkwork/iam-app-sdk"],
  ["@sdkwork/appbase-backend-sdk", "@sdkwork/iam-backend-sdk"],
  ["@sdkwork/appbase-open-sdk", "@sdkwork/iam-open-sdk"],
  ["sdkwork-appbase-app-sdk", "sdkwork-iam-app-sdk"],
  ["sdkwork-appbase-backend-sdk", "sdkwork-iam-backend-sdk"],
  ["sdkwork-appbase-open-sdk", "sdkwork-iam-open-sdk"],
  ["sdkwork-appbase-app-api", "sdkwork-iam-app-api"],
  ["sdkwork-appbase-backend-api", "sdkwork-iam-backend-api"],
  ["sdkwork-appbase-open-api", "sdkwork-iam-open-api"],
  ["sdkwork-appbase-iam-bootstrap", "sdkwork-iam-bootstrap"],
  ["sdkwork-appbase-database-host", "sdkwork-iam-database-host"],
  ["sdkwork-appbase-tauri-host", "sdkwork-iam-tauri-host"],
  ["sdkwork-appbase-db", "sdkwork-iam-db"],
  ["materialize-appbase-v3-openapi-boundaries", "materialize-iam-v3-openapi-boundaries"],
  ["materialize-appbase-rpc-proto-boundaries", "materialize-iam-rpc-proto-boundaries"],
  ["SDKWork Appbase App API", "SDKWork IAM App API"],
  ["SDKWork Appbase Backend API", "SDKWork IAM Backend API"],
  ["SDKWork Appbase Open API", "SDKWork IAM Open API"],
  ["Sdkwork Appbase App Sdk", "SDKWork IAM App SDK"],
  ["Sdkwork Appbase Backend Sdk", "SDKWork IAM Backend SDK"],
  ["Sdkwork Appbase Open Sdk", "SDKWork IAM Open SDK"],
  ["sdkwork-appbase IAM", "sdkwork-iam"],
  ["sdkwork-appbase IAM and foundation", "sdkwork-iam"],
  ["sdkOwner: 'sdkwork-appbase'", "sdkOwner: 'sdkwork-iam'"],
  ["sdkOwner: \"sdkwork-appbase\"", "sdkOwner: \"sdkwork-iam\""],
  ["owner: 'sdkwork-appbase'", "owner: 'sdkwork-iam'"],
  ["owner: \"sdkwork-appbase\"", "owner: \"sdkwork-iam\""],
];

const skipDirs = new Set(["node_modules", "target", ".git", ".pnpm", "dist", "build"]);
const textExtensions = new Set([
  ".toml", ".json", ".yaml", ".yml", ".ts", ".tsx", ".js", ".mjs", ".cjs",
  ".md", ".rs", ".ps1", ".sh", ".sql", ".proto", ".dart", ".java", ".kt",
  ".swift", ".cs", ".py", ".go", ".rb", ".php", ".lock", ".xml", ".gradle",
  ".properties", ".env", ".example", ".txt", ".css", ".html", ".vue", ".pubspec.yaml",
]);

const pathRenames = [
  ["sdks/sdkwork-appbase-app-sdk", "sdks/sdkwork-iam-app-sdk"],
  ["sdks/sdkwork-appbase-backend-sdk", "sdks/sdkwork-iam-backend-sdk"],
  ["sdks/sdkwork-appbase-open-sdk", "sdks/sdkwork-iam-open-sdk"],
  ["apis/app-api/iam/sdkwork-appbase-app-api.openapi.yaml", "apis/app-api/iam/sdkwork-iam-app-api.openapi.yaml"],
  ["apis/backend-api/iam/sdkwork-appbase-backend-api.openapi.yaml", "apis/backend-api/iam/sdkwork-iam-backend-api.openapi.yaml"],
  ["apis/open-api/iam/sdkwork-appbase-open-api.openapi.yaml", "apis/open-api/iam/sdkwork-iam-open-api.openapi.yaml"],
  ["tools/generators/materialize-appbase-v3-openapi-boundaries.mjs", "tools/generators/materialize-iam-v3-openapi-boundaries.mjs"],
  ["tools/generators/materialize-appbase-rpc-proto-boundaries.mjs", "tools/generators/materialize-iam-rpc-proto-boundaries.mjs"],
];

async function walk(dir, files = []) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return files;
  }
  for (const entry of entries) {
    if (skipDirs.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(full, files);
    } else {
      const ext = path.extname(entry.name);
      if (textExtensions.has(ext) || entry.name === "pubspec.yaml" || entry.name === "Cargo.lock") {
        files.push(full);
      }
    }
  }
  return files;
}

function applyReplacements(content) {
  let next = content;
  let changed = false;
  for (const [from, to] of textReplacements) {
    if (next.includes(from)) {
      next = next.split(from).join(to);
      changed = true;
    }
  }
  return { next, changed };
}

async function renamePath(fromRel, toRel, baseDir) {
  const from = path.join(baseDir, fromRel);
  const to = path.join(baseDir, toRel);
  try {
    await stat(from);
  } catch {
    return false;
  }
  if (!dryRun) {
    await rename(from, to);
  }
  console.log(`${dryRun ? "[dry-run] " : ""}renamed: ${path.relative(workspaceRoot, from)} -> ${path.relative(workspaceRoot, to)}`);
  return true;
}

// Phase 1: text replacements across workspace
const files = await walk(workspaceRoot);
let updated = 0;
for (const file of files) {
  const rel = path.relative(workspaceRoot, file);
  if (rel.includes("rename-iam-sdk-families.mjs")) continue;
  const original = await readFile(file, "utf8");
  const { next, changed } = applyReplacements(original);
  if (!changed) continue;
  if (!dryRun) await writeFile(file, next, "utf8");
  updated += 1;
}
console.log(`Phase 1: ${dryRun ? "would update" : "updated"} ${updated} file(s).`);

// Phase 2: rename paths in sdkwork-iam
const iamRoot = path.join(workspaceRoot, "sdkwork-iam");
for (const [from, to] of pathRenames) {
  await renamePath(from, to, iamRoot);
}

// Phase 2b: rename paths in sdkwork-appbase (duplicate tools if any)
const appbaseRoot = path.join(workspaceRoot, "sdkwork-appbase");
for (const [from, to] of pathRenames) {
  await renamePath(from, to, appbaseRoot);
}

console.log("Done.");
