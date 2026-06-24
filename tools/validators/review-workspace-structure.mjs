#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const appbaseRoot = path.resolve(__dirname, '../..');

function readText(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function exists(filePath) {
  return fs.existsSync(filePath);
}

function containsAny(text, tokens) {
  return tokens.some((token) => text.includes(token));
}

export function reviewWorkspaceStructure({ cwd = appbaseRoot } = {}) {
  const errors = [];
  const requiredPaths = [
    "AGENTS.md",
    "CLAUDE.md",
    "GEMINI.md",
    "CODEX.md",
    ".sdkwork/README.md",
    ".sdkwork/skills/README.md",
    ".sdkwork/plugins/README.md",
  ];
  const standardDirectories = [
    "apis",
    "apps",
    "crates",
    "jobs",
    "tools",
    "plugins",
    "examples",
    "configs",
    "deployments",
    "tests",
    "docs",
  ];
  const standardSubdirectoryReadmes = [
    "tools/catalog/README.md",
    "tools/generators/README.md",
    "tools/validators/README.md",
    "tools/migrations/README.md",
    "tools/operators/README.md",
    "tests/static/README.md",
    "tests/static/governance/README.md",
    "tests/contract/README.md",
    "tests/integration/README.md",
    "tests/e2e/README.md",
    "tests/fixtures/README.md",
    "configs/examples/README.md",
  ];

  for (const relativePath of requiredPaths) {
    if (!exists(path.join(cwd, relativePath))) {
      errors.push(`Missing required workspace path: ${relativePath}`);
    }
  }

  for (const relativeDirectory of standardDirectories) {
    const readmePath = path.join(cwd, relativeDirectory, "README.md");
    if (!exists(readmePath)) {
      errors.push(`Missing standard directory README: ${relativeDirectory}/README.md`);
    }
  }

  for (const relativePath of standardSubdirectoryReadmes) {
    if (!exists(path.join(cwd, relativePath))) {
      errors.push(`Missing standard subdirectory README: ${relativePath}`);
    }
  }

  for (const relativePath of [
    ".sdkwork/README.md",
    ".sdkwork/skills/README.md",
    ".sdkwork/plugins/README.md",
  ]) {
    const absolutePath = path.join(cwd, relativePath);
    if (!exists(absolutePath)) {
      continue;
    }

    const text = readText(absolutePath);
    if (containsAny(text, ["$name", "$specPath"])) {
      errors.push(`Template placeholder remains in ${relativePath}`);
    }
  }

  const readmePath = path.join(cwd, "README.md");
  if (exists(readmePath)) {
    const readme = readText(readmePath);
    for (const token of [
      "base dependency",
      "packages/",
      "crates/",
      "apis/",
      "sdks/",
      "configs/",
      "plugins/",
      ".sdkwork/plugins/",
    ]) {
      if (!readme.includes(token)) {
        errors.push(`README.md does not document ${token}`);
      }
    }
  }

  return { errors };
}

export function runWorkspaceStructureReviewCli({ cwd = appbaseRoot } = {}) {
  const result = reviewWorkspaceStructure({ cwd });
  if (result.errors.length > 0) {
    process.stderr.write(`Workspace review failed with ${result.errors.length} issue(s):\n`);
    for (const error of result.errors) {
      process.stderr.write(`- ${error}\n`);
    }
    process.exitCode = 1;
    return result;
  }

  process.stdout.write("Workspace review passed.\n");
  return result;
}

function isDirectExecution() {
  return path.resolve(process.argv[1] ?? "") === fileURLToPath(import.meta.url);
}

if (isDirectExecution()) {
  runWorkspaceStructureReviewCli();
}
