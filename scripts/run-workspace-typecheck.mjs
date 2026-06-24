import process from "node:process";
import path from "node:path";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";

import { runCommandSequence } from "./run-command-sequence.mjs";
import {
  WORKSPACE_VITEST_RUNTIME_BLOCKED_EXIT_CODE,
  createWorkspaceVitestRuntimeDiagnostic,
  probeWorkspaceVitestRuntime,
} from "./run-workspace-vitest.mjs";

export const WORKSPACE_TYPECHECK_RUNTIME_DIAGNOSTIC_CODE = "WORKSPACE_TYPECHECK_RUNTIME_UNREADABLE";
export const WORKSPACE_TYPECHECK_RUNTIME_BLOCKED_EXIT_CODE = WORKSPACE_VITEST_RUNTIME_BLOCKED_EXIT_CODE;

function resolveWorkspacePackageJsonPath({
  cwd = process.cwd(),
  packageName,
} = {}) {
  return createRequire(path.join(cwd, "package.json")).resolve(`${packageName}/package.json`);
}

export function createWorkspaceTypecheckPlan({
  cwd = process.cwd(),
  resolvePackageJsonPath,
} = {}) {
  const resolver = resolvePackageJsonPath ?? resolveWorkspacePackageJsonPath;
  const packageJsonPath = resolver({ cwd, packageName: "typescript" });
  const tscCliPath = path.join(path.dirname(packageJsonPath), "bin", "tsc");

  return {
    args: [tscCliPath, "--noEmit"],
    command: process.execPath,
  };
}

export function emitWorkspaceTypecheckRuntimeDiagnostic({
  diagnostic,
  logger = console,
} = {}) {
  logger.error(
    `[sdkwork-appbase:typecheck] ${diagnostic.message}`,
  );
  logger.error(JSON.stringify(diagnostic, null, 2));
}

export function createWorkspaceTypecheckRuntimeDiagnostic({
  cwd = process.cwd(),
  probe,
} = {}) {
  return {
    ...createWorkspaceVitestRuntimeDiagnostic({ cwd, probe }),
    code: WORKSPACE_TYPECHECK_RUNTIME_DIAGNOSTIC_CODE,
    message:
      "sdkwork-appbase workspace TypeScript runtime contains unreadable or unresolved dependency files. The governed runner refused to execute typecheck with a broken node_modules runtime.",
    recommendedActions: [
      "Rebuild the sdkwork-appbase workspace node_modules tree in place.",
      "Repair filesystem ACLs or permissions for the blocked runtime files under node_modules.",
      "Re-run `node scripts/run-workspace-typecheck.mjs` after the workspace runtime is readable again.",
    ],
  };
}

export function runWorkspaceTypecheck({
  cwd = process.cwd(),
  env = process.env,
  logger = console,
  probeTypecheckRuntime = probeWorkspaceVitestRuntime,
  runCommands = runCommandSequence,
} = {}) {
  const probe = probeTypecheckRuntime({
    cwd,
    rootPackages: ["typescript"],
  });

  if (!probe.isReady) {
    emitWorkspaceTypecheckRuntimeDiagnostic({
      diagnostic: createWorkspaceTypecheckRuntimeDiagnostic({ cwd, probe }),
      logger,
    });
    return WORKSPACE_TYPECHECK_RUNTIME_BLOCKED_EXIT_CODE;
  }

  return runCommands({
    commands: [createWorkspaceTypecheckPlan({ cwd })],
    cwd,
    env,
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exit(runWorkspaceTypecheck());
}
