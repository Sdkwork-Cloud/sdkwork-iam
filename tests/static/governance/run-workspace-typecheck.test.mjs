import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";

import {
  WORKSPACE_TYPECHECK_RUNTIME_BLOCKED_EXIT_CODE,
  WORKSPACE_TYPECHECK_RUNTIME_DIAGNOSTIC_CODE,
  createWorkspaceTypecheckPlan,
  runWorkspaceTypecheck,
} from "../../../scripts/run-workspace-typecheck.mjs";

test("createWorkspaceTypecheckPlan uses the TypeScript package bin path", () => {
  const cwd = path.join(process.cwd(), "virtual", "sdkwork-appbase");
  const plan = createWorkspaceTypecheckPlan({
    cwd,
    resolvePackageJsonPath() {
      return path.join(cwd, "node_modules", "typescript", "package.json");
    },
  });

  assert.deepEqual(plan, {
    args: [
      path.join(cwd, "node_modules", "typescript", "bin", "tsc"),
      "--noEmit",
    ],
    command: process.execPath,
  });
});

test("runWorkspaceTypecheck refuses an unreadable TypeScript runtime before executing commands", () => {
  const errors = [];
  let commandSequenceRan = false;
  const cwd = path.join(process.cwd(), "virtual", "sdkwork-appbase");
  const status = runWorkspaceTypecheck({
    cwd,
    env: {},
    logger: {
      error(message) {
        errors.push(String(message));
      },
    },
    probeTypecheckRuntime({ rootPackages }) {
      assert.deepEqual(rootPackages, ["typescript"]);
      return {
        cwd,
        inspectedPackages: [],
        isReady: false,
        rootPackages,
        unreadableEntries: [],
        unresolvedPackages: [
          {
            depth: 0,
            errorCode: "MODULE_NOT_FOUND",
            errorMessage: "Cannot find module 'typescript/package.json'",
            packageName: "typescript",
          },
        ],
      };
    },
    runCommands() {
      commandSequenceRan = true;
      return 0;
    },
  });

  assert.equal(status, WORKSPACE_TYPECHECK_RUNTIME_BLOCKED_EXIT_CODE);
  assert.equal(commandSequenceRan, false);
  assert.match(errors.join("\n"), new RegExp(WORKSPACE_TYPECHECK_RUNTIME_DIAGNOSTIC_CODE));
  assert.match(errors.join("\n"), /\[sdkwork-appbase:typecheck\]/);
});
