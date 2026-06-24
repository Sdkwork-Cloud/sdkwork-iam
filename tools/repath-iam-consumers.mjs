#!/usr/bin/env node
/**
 * Repoint stale IAM paths to sdkwork-iam across the workspace.
 * Run from sdkwork-iam: node tools/repath-iam-consumers.mjs [--dry-run]
 */
import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { buildLegacyIamRepathReplacements } from "../../sdkwork-specs/tools/iam-legacy-path-fragments.mjs";

const workspaceRoot = path.resolve(import.meta.dirname, "../..");
const dryRun = process.argv.includes("--dry-run");
const replacements = buildLegacyIamRepathReplacements();

const textExtensions = new Set([
  ".toml", ".json", ".yaml", ".yml", ".ts", ".tsx", ".js", ".mjs", ".md", ".rs", ".css",
]);

const skipDirs = new Set([
  "node_modules", "target", ".git", "generated", "dist", "build", ".pnpm", ".sdkwork",
]);

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
    } else if (textExtensions.has(path.extname(entry.name))) {
      files.push(full);
    }
  }
  return files;
}

function applyReplacements(content) {
  let next = content;
  let changed = false;
  for (const [from, to] of replacements) {
    if (next.includes(from)) {
      next = next.split(from).join(to);
      changed = true;
    }
  }
  return { next, changed };
}

const files = await walk(workspaceRoot);
let updated = 0;

for (const file of files) {
  const rel = path.relative(workspaceRoot, file).replaceAll("\\", "/");
  if (rel === "sdkwork-specs/tools/iam-legacy-path-fragments.mjs") {
    continue;
  }
  const original = await readFile(file, "utf8");
  const { next, changed } = applyReplacements(original);
  if (!changed) continue;
  if (!dryRun) {
    await writeFile(file, next, "utf8");
  }
  updated += 1;
  console.log(`${dryRun ? "[dry-run] " : ""}updated: ${rel}`);
}

console.log(`\n${dryRun ? "Would update" : "Updated"} ${updated} file(s).`);
