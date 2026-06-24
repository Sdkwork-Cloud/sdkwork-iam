#!/usr/bin/env node
/** Repair broken IAM vite alias paths after partial appbaseRoot -> iamRoot migration. */
import fs from "node:fs";
import path from "node:path";

const workspaceRoot = path.resolve(import.meta.dirname, "../..");
const skipDirs = new Set(["node_modules", ".git", "target", "dist", "build"]);

const replacements = [
  ["'-app-sdk/", "'sdks/sdkwork-iam-app-sdk/"],
  ['"-app-sdk/', '"sdks/sdkwork-iam-app-sdk/'],
  ["'-backend-sdk/", "'sdks/sdkwork-iam-backend-sdk/"],
  ['"-backend-sdk/', '"sdks/sdkwork-iam-backend-sdk/'],
  ["'-pc/packages/", "'apps/sdkwork-iam-pc/packages/"],
  ['"-pc/packages/', '"apps/sdkwork-iam-pc/packages/'],
  ["'-common/packages/", "'apps/sdkwork-iam-common/packages/"],
  ['"-common/packages/', '"apps/sdkwork-iam-common/packages/'],
];

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (skipDirs.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else if (/^(vite|vitest)\.config\.(ts|mjs)$/.test(entry.name)) files.push(full);
  }
  return files;
}

let updated = 0;
for (const file of walk(workspaceRoot)) {
  let text = fs.readFileSync(file, "utf8");
  const original = text;
  for (const [from, to] of replacements) {
    text = text.split(from).join(to);
  }
  if (text !== original) {
    fs.writeFileSync(file, text, "utf8");
    updated += 1;
    console.log(path.relative(workspaceRoot, file));
  }
}
console.log(`\nRepaired ${updated} file(s).`);
