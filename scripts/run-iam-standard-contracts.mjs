import path from "node:path";
import process from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";

import { createDatabaseContractCheckPlan } from "./run-database-contract-check.mjs";
import { runCommandSequence } from "./run-command-sequence.mjs";
import {
  WORKSPACE_VITEST_RUNTIME_BLOCKED_EXIT_CODE,
  createWorkspaceVitestPlan,
  createWorkspaceVitestRuntimeDiagnostic,
  emitWorkspaceVitestRuntimeDiagnostic,
  probeWorkspaceVitestRuntime,
} from "./run-workspace-vitest.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sdkworkAppbaseRoot = path.resolve(__dirname, "..");

export function createIamStandardContractsPlan({
  cwd = sdkworkAppbaseRoot,
  resolvePackageJsonPath,
} = {}) {
  const vitestPlan = createWorkspaceVitestPlan({ cwd, resolvePackageJsonPath });

  return [
    ...createDatabaseContractCheckPlan({ cwd }),
    {
      args: [
        vitestPlan.args[0],
        "run",
        path.join(cwd, "packages/common/iam/sdkwork-iam-contracts/tests/iam-contracts.standard.test.ts"),
        path.join(cwd, "packages/common/iam/sdkwork-iam-sdk-ports/tests/iam-sdk-ports.standard.test.ts"),
        path.join(cwd, "packages/common/iam/sdkwork-iam-service/tests/iam-service.standard.test.ts"),
        path.join(cwd, "packages/common/iam/sdkwork-iam-runtime/tests/iam-runtime.standard.test.ts"),
        path.join(cwd, "packages/common/iam/sdkwork-iam-application-bootstrap/tests/iam-application-bootstrap.standard.test.ts"),
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
      command: "cargo",
      args: [
        "test",
        "-p",
        "sdkwork-iam-context-service",
      ],
    },
    {
      command: "cargo",
      args: ["test", "-j", "1", "-p", "sdkwork-router-iam-app-api", "--", "--test-threads", "1"],
    },
    {
      command: "cargo",
      args: [
        "test",
        "-p",
        "sdkwork-router-iam-backend-api",
      ],
    },
    {
      command: "cargo",
      args: [
        "test",
        "-p",
        "sdkwork-router-iam-open-api",
      ],
    },
    {
      command: "cargo",
      args: [
        "test",
        "-p",
        "sdkwork-iam-directory-repository-sqlx",
      ],
    },
    {
      command: "cargo",
      args: [
        "test",
        "-p",
        "sdkwork-iam-web-adapter",
      ],
    },
    {
      command: "cargo",
      args: [
        "test",
        "-p",
        "sdkwork-iam-bootstrap",
      ],
    },
    {
      command: "cargo",
      args: [
        "test",
        "-p",
        "sdkwork-iam-tauri-host",
      ],
    },
  ];
}

export function runIamStandardContracts({
  cwd = sdkworkAppbaseRoot,
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
    commands: createIamStandardContractsPlan({ cwd }),
    cwd,
    env,
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exit(runIamStandardContracts());
}
