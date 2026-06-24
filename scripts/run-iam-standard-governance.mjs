import { spawnSync } from "node:child_process";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const appbaseRoot = path.resolve(__dirname, "..");

export function createIamStandardGovernancePlan({
  cwd = appbaseRoot,
  env = process.env,
  nodeExecutable = process.execPath,
  platform = process.platform,
} = {}) {
  return {
    command: nodeExecutable,
    args: ["scripts/run-user-center-standard-contracts.mjs"],
    cwd,
    env,
    shell: false,
    windowsHide: platform === "win32",
  };
}

export function runIamStandardGovernance({
  cwd = appbaseRoot,
  env = process.env,
  nodeExecutable = process.execPath,
  platform = process.platform,
  spawnSyncImpl = spawnSync,
} = {}) {
  const plan = createIamStandardGovernancePlan({
    cwd,
    env,
    nodeExecutable,
    platform,
  });
  const result = spawnSyncImpl(plan.command, plan.args, {
    cwd: plan.cwd,
    env: plan.env,
    shell: plan.shell,
    stdio: "inherit",
    windowsHide: plan.windowsHide,
  });

  if (result.error) {
    throw result.error;
  }

  return result.status ?? 0;
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  process.exit(runIamStandardGovernance());
}
