import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { WORKSPACE_VITEST_RUNTIME_BLOCKED_EXIT_CODE } from "../../../scripts/run-workspace-vitest.mjs";
import {
  createUserCenterStandardContractsPlan,
  runUserCenterStandardContracts,
} from "../../../scripts/run-user-center-standard-contracts.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appbaseRoot = path.resolve(__dirname, "../../..");

test("user-center standard contracts plan resolves the sdkwork-appbase package root by default", () => {
  const plan = createUserCenterStandardContractsPlan({
    resolvePackageJsonPath() {
      return path.join(appbaseRoot, "node_modules", "vitest", "package.json");
    },
  });

  assert.equal(plan[0]?.command, process.execPath);
  assert.equal(
    plan[0]?.args[0],
    path.join(appbaseRoot, "node_modules", "vitest", "dist", "cli.js"),
  );
  assert.equal(plan[0]?.args[1], "run");
  assert.equal(
    plan[0]?.args[2],
    path.join(
      appbaseRoot,
      "packages",
      "pc-react",
      "iam",
      "sdkwork-user-center-pc-react",
      "tests",
      "userCenterSurfaceNodeContract.test.ts",
    ),
  );
  assert.equal(
    plan[0]?.args[3],
    path.join(
      appbaseRoot,
      "packages",
      "pc-react",
      "iam",
      "sdkwork-user-center-core-pc-react",
      "tests",
      "userCenterDeploymentContract.test.ts",
    ),
  );
  assert.equal(
    plan[0]?.args[4],
    path.join(
      appbaseRoot,
      "packages",
      "pc-react",
      "iam",
      "sdkwork-user-center-core-pc-react",
      "tests",
      "userCenterCommandMatrixContract.test.ts",
    ),
  );
  assert.equal(
    plan[0]?.args[5],
    path.join(
      appbaseRoot,
      "packages",
      "pc-react",
      "iam",
      "sdkwork-user-center-core-pc-react",
      "tests",
      "userCenterRuntimeBridgeContract.test.ts",
    ),
  );
  assert.equal(
    plan[0]?.args[6],
    path.join(
      appbaseRoot,
      "packages",
      "pc-react",
      "iam",
      "sdkwork-user-center-core-pc-react",
      "tests",
      "userCenterSeedContract.test.ts",
    ),
  );
  assert.equal(
    plan[0]?.args[7],
    path.join(
      appbaseRoot,
      "packages",
      "pc-react",
      "iam",
      "sdkwork-auth-runtime-pc-react",
      "tests",
      "authRuntimeComposition.test.ts",
    ),
  );
  assert.equal(plan[0]?.args[8], "--config");
  assert.equal(plan[0]?.args[9], path.join(appbaseRoot, "vitest.config.ts"));
  assert.equal(plan[0]?.args[10], "--configLoader");
  assert.equal(plan[0]?.args[11], "native");
  assert.equal(plan[0]?.args[12], "--pool");
  assert.equal(plan[0]?.args[13], "vmThreads");
  assert.equal(
    plan[1]?.args[1],
    path.join(
      appbaseRoot,
      "packages",
      "pc-react",
      "iam",
      "sdkwork-user-center-validation-pc-react",
      "tests",
      "userCenterValidationNodeContract.test.ts",
    ),
  );
  assert.equal(
    plan[2]?.args[1],
    path.join(
      appbaseRoot,
      "packages",
      "pc-react",
      "iam",
      "sdkwork-user-center-validation-pc-react",
      "tests",
      "userCenterServerValidationNodeContract.test.ts",
    ),
  );
  assert.equal(plan.length, 3);
});

test("user-center standard contracts runner refuses an unreadable Vitest runtime before executing commands", () => {
  const errors = [];
  let commandSequenceRan = false;
  const status = runUserCenterStandardContracts({
    cwd: appbaseRoot,
    env: {},
    logger: {
      error(message) {
        errors.push(String(message));
      },
    },
    probeVitestRuntime() {
      return {
        cwd: appbaseRoot,
        inspectedPackages: [],
        isReady: false,
        rootPackages: ["vitest"],
        unreadableEntries: [],
        unresolvedPackages: [
          {
            depth: 0,
            errorCode: "MODULE_NOT_FOUND",
            errorMessage: "Cannot find module 'vitest/package.json'",
            packageName: "vitest",
          },
        ],
      };
    },
    runCommands() {
      commandSequenceRan = true;
      return 0;
    },
  });

  assert.equal(status, WORKSPACE_VITEST_RUNTIME_BLOCKED_EXIT_CODE);
  assert.equal(commandSequenceRan, false);
  assert.match(errors.join("\n"), /WORKSPACE_VITEST_RUNTIME_UNREADABLE/);
});
