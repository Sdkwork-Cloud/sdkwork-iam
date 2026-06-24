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
const iamRoot = path.resolve(__dirname, "../../..");

function iamPcPackageTestsDir(packageName) {
  return path.join(iamRoot, "apps", "sdkwork-iam-pc", "packages", packageName, "tests");
}

test("user-center standard contracts plan resolves the sdkwork-iam package root by default", () => {
  const plan = createUserCenterStandardContractsPlan({
    resolvePackageJsonPath() {
      return path.join(iamRoot, "node_modules", "vitest", "package.json");
    },
  });

  assert.equal(plan[0]?.command, process.execPath);
  assert.equal(
    plan[0]?.args[0],
    path.join(iamRoot, "node_modules", "vitest", "dist", "cli.js"),
  );
  assert.equal(plan[0]?.args[1], "run");
  assert.equal(
    plan[0]?.args[2],
    path.join(
      iamPcPackageTestsDir("sdkwork-user-center-pc-react"),
      "userCenterSurfaceNodeContract.test.ts",
    ),
  );
  assert.equal(
    plan[0]?.args[3],
    path.join(
      iamPcPackageTestsDir("sdkwork-user-center-core-pc-react"),
      "userCenterDeploymentContract.test.ts",
    ),
  );
  assert.equal(
    plan[0]?.args[4],
    path.join(
      iamPcPackageTestsDir("sdkwork-user-center-core-pc-react"),
      "userCenterCommandMatrixContract.test.ts",
    ),
  );
  assert.equal(
    plan[0]?.args[5],
    path.join(
      iamPcPackageTestsDir("sdkwork-user-center-core-pc-react"),
      "userCenterRuntimeBridgeContract.test.ts",
    ),
  );
  assert.equal(
    plan[0]?.args[6],
    path.join(
      iamPcPackageTestsDir("sdkwork-user-center-core-pc-react"),
      "userCenterSeedContract.test.ts",
    ),
  );
  assert.equal(
    plan[0]?.args[7],
    path.join(
      iamPcPackageTestsDir("sdkwork-auth-runtime-pc-react"),
      "authRuntimeComposition.test.ts",
    ),
  );
  assert.equal(plan[0]?.args[8], "--config");
  assert.equal(plan[0]?.args[9], path.join(iamRoot, "vitest.config.ts"));
  assert.equal(plan[0]?.args[10], "--configLoader");
  assert.equal(plan[0]?.args[11], "native");
  assert.equal(plan[0]?.args[12], "--pool");
  assert.equal(plan[0]?.args[13], "vmThreads");
  assert.equal(
    plan[1]?.args[1],
    path.join(
      iamPcPackageTestsDir("sdkwork-user-center-validation-pc-react"),
      "userCenterValidationNodeContract.test.ts",
    ),
  );
  assert.equal(
    plan[2]?.args[1],
    path.join(
      iamPcPackageTestsDir("sdkwork-user-center-validation-pc-react"),
      "userCenterServerValidationNodeContract.test.ts",
    ),
  );
  assert.equal(plan.length, 3);
});

test("user-center standard contracts runner refuses an unreadable Vitest runtime before executing commands", () => {
  const errors = [];
  let commandSequenceRan = false;
  const status = runUserCenterStandardContracts({
    cwd: iamRoot,
    env: {},
    logger: {
      error(message) {
        errors.push(String(message));
      },
    },
    probeVitestRuntime() {
      return {
        cwd: iamRoot,
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
