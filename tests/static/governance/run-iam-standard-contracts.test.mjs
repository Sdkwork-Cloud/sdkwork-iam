import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";

import { WORKSPACE_VITEST_RUNTIME_BLOCKED_EXIT_CODE } from "../../../scripts/run-workspace-vitest.mjs";
import {
  createIamStandardContractsPlan,
  runIamStandardContracts,
} from "../../../scripts/run-iam-standard-contracts.mjs";

const appbaseRoot = path.resolve(import.meta.dirname, "../../..");

test("IAM standard contracts plan uses the governed Vitest CLI path and Rust package checks", () => {
  const plan = createIamStandardContractsPlan({
    cwd: appbaseRoot,
    resolvePackageJsonPath() {
      return path.join(appbaseRoot, "node_modules", "vitest", "package.json");
    },
  });

  assert.equal(plan[0]?.command, process.execPath);
  assert.equal(
    plan[0]?.args[0],
    path.join(appbaseRoot, "../sdkwork-specs/tools/check-database-framework-standard.mjs"),
  );
  assert.equal(plan[1]?.command, process.execPath);
  assert.equal(
    plan[1]?.args[0],
    path.join(appbaseRoot, "tests/contract/iam-database-contract-alignment.test.mjs"),
  );
  assert.equal(plan[2]?.command, process.execPath);
  assert.equal(
    plan[2]?.args[0],
    path.join(appbaseRoot, "node_modules", "vitest", "dist", "cli.js"),
  );
  assert.equal(plan[2]?.args[1], "run");
  assert.equal(
    plan[2]?.args[2],
    path.join(appbaseRoot, "packages/common/iam/sdkwork-iam-contracts/tests/iam-contracts.standard.test.ts"),
  );
  assert.equal(
    plan[2]?.args[3],
    path.join(appbaseRoot, "packages/common/iam/sdkwork-iam-sdk-ports/tests/iam-sdk-ports.standard.test.ts"),
  );
  assert.equal(
    plan[2]?.args[4],
    path.join(appbaseRoot, "packages/common/iam/sdkwork-iam-service/tests/iam-service.standard.test.ts"),
  );
  assert.equal(
    plan[2]?.args[5],
    path.join(appbaseRoot, "packages/common/iam/sdkwork-iam-runtime/tests/iam-runtime.standard.test.ts"),
  );
  assert.equal(plan[2]?.args.at(-6), "--config");
  assert.equal(plan[2]?.args.at(-5), path.join(appbaseRoot, "vitest.config.ts"));
  assert.deepEqual(
    plan.slice(3).map((command) => command.args),
    [
      ["test", "-p", "sdkwork-iam-context-service"],
      ["test", "-j", "1", "-p", "sdkwork-router-iam-app-api", "--", "--test-threads", "1"],
      ["test", "-p", "sdkwork-router-iam-backend-api"],
      ["test", "-p", "sdkwork-router-iam-open-api"],
      ["test", "-p", "sdkwork-iam-directory-repository-sqlx"],
      ["test", "-p", "sdkwork-iam-web-adapter"],
      ["test", "-p", "sdkwork-iam-bootstrap"],
      ["test", "-p", "sdkwork-iam-tauri-host"],
    ],
  );
});

test("IAM standard contracts plan serializes shared-database app router integration tests", () => {
  const plan = createIamStandardContractsPlan({
    cwd: appbaseRoot,
    resolvePackageJsonPath() {
      return path.join(appbaseRoot, "node_modules", "vitest", "package.json");
    },
  });

  const appRouterPlan = plan.find((command) => command.args?.includes("sdkwork-router-iam-app-api"));
  assert.deepEqual(appRouterPlan?.args, ["test", "-j", "1", "-p", "sdkwork-router-iam-app-api", "--", "--test-threads", "1"]);
});

test("IAM standard contracts runner refuses an unreadable Vitest runtime before executing commands", () => {
  const errors = [];
  let commandSequenceRan = false;
  const status = runIamStandardContracts({
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
