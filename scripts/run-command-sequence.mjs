import process from "node:process";
import { spawnSync } from "node:child_process";

export function runCommandSequence({
  commands,
  cwd = process.cwd(),
  env = process.env,
} = {}) {
  for (const command of commands) {
    const result = spawnSync(command.command, command.args ?? [], {
      cwd: command.cwd ?? cwd,
      env,
      shell: process.platform === "win32",
      stdio: "inherit",
    });

    if (typeof result.status === "number" && result.status !== 0) {
      return result.status;
    }

    if (result.error) {
      throw result.error;
    }

    if (result.signal) {
      return 1;
    }
  }

  return 0;
}
