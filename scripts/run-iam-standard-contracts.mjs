import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";
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

export function iamPostgresProfileAvailable(cwd = sdkworkAppbaseRoot) {
  const candidates = [
    path.join(cwd, ".env.postgres"),
    path.join(cwd, "../sdkwork-clawrouter/.env.postgres"),
    path.join(cwd, "../sdkwork-claw-router/.env.postgres"),
  ];
  return candidates.some((candidate) => fs.existsSync(candidate));
}

export function createBackendApiRustTestCommands(cwd = sdkworkAppbaseRoot) {
  const threadArgs = ["--", "--test-threads", "1"];
  const routeStandard = {
    command: "cargo",
    args: ["test", "-j", "1", "-p", "sdkwork-routes-iam-backend-api", "--test", "iam_backend_route_standard", ...threadArgs],
  };

  if (!iamPostgresProfileAvailable(cwd)) {
    return [routeStandard];
  }

  return [
    routeStandard,
    {
      command: "cargo",
      args: [
        "test",
        "-j",
        "1",
        "-p",
        "sdkwork-routes-iam-backend-api",
        "--test",
        "iam_backend_postgres_integration",
        ...threadArgs,
      ],
    },
  ];
}

export function createAppApiRustTestCommands(cwd = sdkworkAppbaseRoot) {
  const threadArgs = ["--", "--test-threads", "1"];
  const httpStandard = {
    command: "cargo",
    args: ["test", "-j", "1", "-p", "sdkwork-routes-iam-app-api", "--test", "iam_http_standard", ...threadArgs],
  };

  if (!iamPostgresProfileAvailable(cwd)) {
    return [httpStandard];
  }

  return [
    httpStandard,
    {
      command: "cargo",
      args: [
        "test",
        "-j",
        "1",
        "-p",
        "sdkwork-routes-iam-app-api",
        "--test",
        "oauth_authorization_server_integration",
        ...threadArgs,
      ],
    },
    {
      command: "cargo",
      args: [
        "test",
        "-j",
        "1",
        "-p",
        "sdkwork-routes-iam-app-api",
        "--test",
        "iam_local_app_router_test",
        ...threadArgs,
      ],
    },
  ];
}

export function createIamStandardContractsPlan({
  cwd = sdkworkAppbaseRoot,
  resolvePackageJsonPath,
} = {}) {
  const vitestPlan = createWorkspaceVitestPlan({ cwd, resolvePackageJsonPath });
  const commands = [
    ...createDatabaseContractCheckPlan({ cwd }),
    {
      args: [
        vitestPlan.args[0],
        "run",
        path.join(cwd, "apps/sdkwork-iam-common/packages/sdkwork-iam-contracts/tests/iam-contracts.standard.test.ts"),
        path.join(cwd, "apps/sdkwork-iam-common/packages/sdkwork-iam-contracts/tests/auth-runtime-metadata.standard.test.ts"),
        path.join(cwd, "apps/sdkwork-iam-common/packages/sdkwork-iam-sdk-ports/tests/iam-sdk-ports.standard.test.ts"),
        path.join(cwd, "apps/sdkwork-iam-common/packages/sdkwork-iam-service/tests/iam-service.standard.test.ts"),
        path.join(cwd, "apps/sdkwork-iam-common/packages/sdkwork-iam-runtime/tests/iam-runtime.standard.test.ts"),
        path.join(cwd, "apps/sdkwork-iam-common/packages/sdkwork-iam-application-bootstrap/tests/iam-application-bootstrap.standard.test.ts"),
        path.join(cwd, "apps/sdkwork-iam-common/packages/sdkwork-iam-sdk-adapter/tests/iam-sdk-adapter.standard.test.ts"),
        path.join(cwd, "apps/sdkwork-iam-pc/packages/sdkwork-iam-pc-admin-oauth/tests/iam-oauth.controller.test.ts"),
        path.join(cwd, "apps/sdkwork-iam-pc/packages/sdkwork-iam-pc-admin-tenant/tests/iam-tenant.controller.test.ts"),
        path.join(cwd, "apps/sdkwork-iam-pc/packages/sdkwork-iam-pc-admin-organization/tests/iam-organization.controller.test.ts"),
        path.join(cwd, "apps/sdkwork-iam-pc/packages/sdkwork-iam-pc-admin-permission/tests/iam-permission.controller.test.ts"),
        path.join(cwd, "apps/sdkwork-iam-pc/packages/sdkwork-iam-pc-admin-permission/tests/iam-permission.guards.test.tsx"),
        path.join(cwd, "apps/sdkwork-iam-pc/packages/sdkwork-iam-pc-admin-account-binding/tests/iam-account-binding.controller.test.ts"),
        path.join(cwd, "apps/sdkwork-iam-pc/packages/sdkwork-iam-pc-admin-user/tests/iam-user.controller.test.ts"),
        path.join(cwd, "apps/sdkwork-iam-pc/packages/sdkwork-iam-pc-console-tenant/tests/iam-console-tenant.controller.test.ts"),
        path.join(cwd, "apps/sdkwork-iam-pc/packages/sdkwork-iam-pc-console-organization/tests/iam-console-organization.controller.test.ts"),
        path.join(cwd, "apps/sdkwork-iam-pc/packages/sdkwork-iam-pc-console-account-binding/tests/iam-console-account-binding.controller.test.ts"),
        path.join(cwd, "apps/sdkwork-iam-pc/packages/sdkwork-iam-pc-console-user/tests/iam-console-user.controller.test.ts"),
        path.join(cwd, "apps/sdkwork-iam-h5/packages/sdkwork-iam-h5-auth/tests/auth-h5.controller.test.ts"),
        path.join(cwd, "apps/sdkwork-iam-h5/packages/sdkwork-iam-h5-user/tests/user-h5.controller.test.ts"),
        path.join(cwd, "apps/sdkwork-iam-h5/packages/sdkwork-iam-h5-account-binding/tests/account-binding-h5.controller.test.ts"),
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
    ...createAppApiRustTestCommands(cwd),
    ...createBackendApiRustTestCommands(cwd),
    {
      command: "cargo",
      args: [
        "test",
        "-p",
        "sdkwork-routes-iam-open-api",
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

  if (commandExists("dart")) {
    commands.push({
      command: "dart",
      args: ["test"],
      cwd: path.join(cwd, "apps/sdkwork-iam-flutter-mobile/packages/sdkwork_iam_flutter_mobile_core"),
    });
    commands.push({
      command: "dart",
      args: ["test"],
      cwd: path.join(cwd, "apps/sdkwork-iam-flutter-mobile/packages/sdkwork_iam_flutter_mobile_auth"),
    });
    commands.push({
      command: "dart",
      args: ["test"],
      cwd: path.join(cwd, "apps/sdkwork-iam-flutter-mobile/packages/sdkwork_iam_flutter_mobile_user"),
    });
    commands.push({
      command: "dart",
      args: ["test"],
      cwd: path.join(cwd, "apps/sdkwork-iam-flutter-mobile/packages/sdkwork_iam_flutter_mobile_account_binding"),
    });
  }

  return commands;
}

function commandExists(command) {
  try {
    const result = spawnSync(command, ["--version"], {
      encoding: "utf8",
      shell: process.platform === "win32",
      windowsHide: true,
    });
    return result.status === 0;
  } catch {
    return false;
  }
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
