import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";

import {
  createWorkspaceVitestPlan,
  probeWorkspaceVitestRuntime,
} from "../../../scripts/run-workspace-vitest.mjs";

function createMissingFileError(filePath) {
  const error = new Error(`ENOENT: no such file or directory, open '${filePath}'`);
  error.code = "ENOENT";
  return error;
}

function probeRuntime({
  packageJson,
  readablePaths,
}) {
  const cwd = path.join(process.cwd(), "virtual", "sdkwork-appbase");
  const packageJsonPath = path.join(
    cwd,
    "node_modules",
    ".pnpm",
    "fixture-pkg@1.0.0",
    "node_modules",
    "fixture-pkg",
    "package.json",
  );
  const packageDir = path.dirname(packageJsonPath);
  const readablePathSet = new Set([packageJsonPath, ...readablePaths.map((relativePath) => path.join(packageDir, relativePath))]);

  return probeWorkspaceVitestRuntime({
    cwd,
    rootPackages: ["fixture-pkg"],
    checkReadable(filePath) {
      if (!readablePathSet.has(filePath)) {
        throw createMissingFileError(filePath);
      }
    },
    listDirectoryEntries() {
      return [];
    },
    readTextFile(filePath) {
      assert.equal(filePath, packageJsonPath);
      return JSON.stringify(packageJson);
    },
    resolvePackageJsonPath() {
      return packageJsonPath;
    },
  });
}

test("probeWorkspaceVitestRuntime ignores custom non-runtime export conditions", () => {
  const probe = probeRuntime({
    packageJson: {
      exports: {
        ".": {
          "standard-schema-spec": "./src/index.ts",
          import: {
            default: "./dist/index.js",
            types: "./dist/index.d.ts",
          },
        },
      },
      name: "fixture-pkg",
      version: "1.0.0",
    },
    readablePaths: ["dist/index.js"],
  });

  assert.equal(probe.isReady, true);
  assert.deepEqual(probe.unreadableEntries, []);
});

test("probeWorkspaceVitestRuntime still validates runtime export entries", () => {
  const probe = probeRuntime({
    packageJson: {
      exports: {
        ".": {
          default: "./dist/index.js",
          types: "./dist/index.d.ts",
        },
      },
      name: "fixture-pkg",
      version: "1.0.0",
    },
    readablePaths: [],
  });

  assert.equal(probe.isReady, false);
  assert.equal(probe.unreadableEntries.length, 1);
  assert.equal(
    probe.unreadableEntries[0]?.filePath,
    path.join(
      process.cwd(),
      "virtual",
      "sdkwork-appbase",
      "node_modules",
      ".pnpm",
      "fixture-pkg@1.0.0",
      "node_modules",
      "fixture-pkg",
      "dist",
      "index.js",
    ),
  );
});

test("createWorkspaceVitestPlan uses the native config loader and vm thread pool", () => {
  const cwd = path.join(process.cwd(), "virtual", "sdkwork-appbase");

  const plan = createWorkspaceVitestPlan({
    cwd,
    resolvePackageJsonPath() {
      return path.join(cwd, "node_modules", "vitest", "package.json");
    },
  });

  assert.equal(plan.command, process.execPath);
  assert.deepEqual(plan.args, [
    path.join(cwd, "node_modules", "vitest", "dist", "cli.js"),
    "run",
    "--config",
    path.join(cwd, "vitest.config.ts"),
    "--configLoader",
    "native",
    "--pool",
    "vmThreads",
  ]);
});
