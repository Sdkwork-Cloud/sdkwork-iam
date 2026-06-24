import path from "node:path";
import process from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";

import { runCommandSequence } from "./run-command-sequence.mjs";
import {
  WORKSPACE_VITEST_RUNTIME_BLOCKED_EXIT_CODE,
  createWorkspaceVitestPlan,
  createWorkspaceVitestRuntimeDiagnostic,
  emitWorkspaceVitestRuntimeDiagnostic,
  probeWorkspaceVitestRuntime,
} from "./run-workspace-vitest.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sdkworkIamRoot = path.resolve(__dirname, "..");

function iamPcPackageTestsDir(cwd, packageName) {
  return path.join(cwd, "apps", "sdkwork-iam-pc", "packages", packageName, "tests");
}

export function createUserCenterStandardContractsPlan({
  cwd = sdkworkIamRoot,
  resolvePackageJsonPath,
} = {}) {
  const userCenterCoreTestsDir = iamPcPackageTestsDir(
    cwd,
    "sdkwork-user-center-core-pc-react",
  );
  const authRuntimeTestsDir = iamPcPackageTestsDir(
    cwd,
    "sdkwork-auth-runtime-pc-react",
  );
  const userCenterTestsDir = iamPcPackageTestsDir(
    cwd,
    "sdkwork-user-center-pc-react",
  );
  const validationTestsDir = iamPcPackageTestsDir(
    cwd,
    "sdkwork-user-center-validation-pc-react",
  );
  const vitestPlan = createWorkspaceVitestPlan({ cwd, resolvePackageJsonPath });

  return [
    {
      args: [
        vitestPlan.args[0],
        "run",
        path.join(userCenterTestsDir, "userCenterSurfaceNodeContract.test.ts"),
        path.join(userCenterCoreTestsDir, "userCenterDeploymentContract.test.ts"),
        path.join(userCenterCoreTestsDir, "userCenterCommandMatrixContract.test.ts"),
        path.join(userCenterCoreTestsDir, "userCenterRuntimeBridgeContract.test.ts"),
        path.join(userCenterCoreTestsDir, "userCenterSeedContract.test.ts"),
        path.join(authRuntimeTestsDir, "authRuntimeComposition.test.ts"),
        "--config",
        path.join(cwd, "vitest.config.ts"),
        "--configLoader",
        "native",
        "--pool",
        "vmThreads",
      ],
      command: vitestPlan.command,
    },
    {
      args: [
        "--experimental-strip-types",
        path.join(validationTestsDir, "userCenterValidationNodeContract.test.ts"),
      ],
      command: process.execPath,
    },
    {
      args: [
        "--experimental-strip-types",
        path.join(validationTestsDir, "userCenterServerValidationNodeContract.test.ts"),
      ],
      command: process.execPath,
    },
  ];
}

export function runUserCenterStandardContracts({
  cwd = sdkworkIamRoot,
  env = process.env,
  logger = console,
  probeVitestRuntime = probeWorkspaceVitestRuntime,
  runCommands = runCommandSequence,
} = {}) {
  const probe = probeVitestRuntime({ cwd });
  if (!probe.isReady) {
    emitWorkspaceVitestRuntimeDiagnostic({
      diagnostic: createWorkspaceVitestRuntimeDiagnostic({ cwd, probe }),
      logger,
    });
    return WORKSPACE_VITEST_RUNTIME_BLOCKED_EXIT_CODE;
  }

  return runCommands({
    commands: createUserCenterStandardContractsPlan({ cwd }),
    cwd,
    env,
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exit(runUserCenterStandardContracts());
}
