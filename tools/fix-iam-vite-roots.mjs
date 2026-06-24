#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { APPBASE_REPO, IAM_REPO } from "../../sdkwork-specs/tools/iam-legacy-path-fragments.mjs";

const workspaceRoot = path.resolve(import.meta.dirname, "../..");
const skipDirs = new Set(["node_modules", ".git", "target", "dist", "build", ".sdkwork"]);

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (skipDirs.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else if (/^(vite|vitest)\.config\.(ts|mjs)$/.test(entry.name)) files.push(full);
  }
  return files;
}

const iamOwnedPathPattern = /(?:apps\/sdkwork-iam|sdks\/sdkwork-iam)/;
let updated = 0;

for (const file of walk(workspaceRoot)) {
  let text = fs.readFileSync(file, "utf8");
  const original = text;
  if (!text.includes("appbaseRoot") || !iamOwnedPathPattern.test(text)) continue;

  if (!text.includes("iamRoot")) {
    text = text.replace(
      /(const appbaseRoot[^\n]+\n)/,
      (match) =>
        `${match}${match.replaceAll("appbaseRoot", "iamRoot").replaceAll(APPBASE_REPO, IAM_REPO)}`,
    );
    text = text.replace(
      new RegExp(
        `(const appbaseRoot = resolvePortalWorkspaceDependencyRoot\\(configDir, '${APPBASE_REPO}'\\);)`,
      ),
      `$1\n  const iamRoot = resolvePortalWorkspaceDependencyRoot(configDir, '${IAM_REPO}');`,
    );
    text = text.replace(
      new RegExp(
        `(const appbaseRoot = resolvePortalWorkspaceDependencyRoot\\(configDir, "${APPBASE_REPO}"\\);)`,
      ),
      `$1\n  const iamRoot = resolvePortalWorkspaceDependencyRoot(configDir, "${IAM_REPO}");`,
    );
  }

  text = text.replace(
    /path\.resolve\(\s*appbaseRoot,\s*(['"])(?:apps\/sdkwork-iam|sdks\/sdkwork-iam)/g,
    "path.resolve(iamRoot, $1",
  );
  text = text.replace(
    /path\.resolve\(appbaseRoot, '(apps\/sdkwork-iam[^']+|sdks\/sdkwork-iam[^']+)'\)/g,
    "path.resolve(iamRoot, '$1')",
  );
  text = text.replace(
    /path\.resolve\(appbaseRoot, "(apps\/sdkwork-iam[^"]+|sdks\/sdkwork-iam[^"]+)"\)/g,
    'path.resolve(iamRoot, "$1")',
  );
  text = text.replaceAll(
    "${normalizedAppbaseRoot}/apps/sdkwork-iam",
    "${normalizedIamRoot}/apps/sdkwork-iam",
  );
  text = text.replaceAll(
    "${normalizedAppbaseRoot}/apps/sdkwork-iam-common",
    "${normalizedIamRoot}/apps/sdkwork-iam-common",
  );
  if (text.includes("normalizedAppbaseRoot}/apps/sdkwork-iam") && !text.includes("normalizedIamRoot")) {
    text = text.replace(
      /(const normalizedAppbaseRoot = normalizePath\(appbaseRoot\);)/,
      "$1\n            const normalizedIamRoot = normalizePath(iamRoot);",
    );
  }

  if (text !== original) {
    fs.writeFileSync(file, text, "utf8");
    updated += 1;
    console.log(path.relative(workspaceRoot, file));
  }
}

console.log(`\nUpdated ${updated} vite/vitest config(s).`);
