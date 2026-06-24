#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(__dirname, "..");

const RUNNERS = {
  dev: ["pnpm", ["run", "test:watch"]],
  build: ["pnpm", ["run", "typecheck"], ["cargo", ["build", "--workspace"]]],
  test: ["pnpm", ["run", "test"]],
  check: [
    ["pnpm", ["run", "check:pnpm-scripts"]],
    ["pnpm", ["run", "check:structure"]],
    ["pnpm", ["run", "check:database"]],
    ["pnpm", ["run", "check:iam-application-bootstrap"]],
    ["pnpm", ["run", "typecheck"]],
  ],
  verify: [["pnpm", ["run", "verify"]]],
  clean: ["node", [path.join(__dirname, "clean-workspace.mjs")]],
};

function printUsage() {
  console.error(`Usage: node scripts/sdkwork-command.mjs <command>

Commands: dev, build, test, check, verify, clean
`);
}

function runStep(command, args) {
  const result = spawnSync(command, args, {
    cwd: appRoot,
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  if ((result.status ?? 1) !== 0) {
    process.exit(result.status ?? 1);
  }
}

function runSequence(steps) {
  for (const step of steps) {
    const [command, args] = step;
    runStep(command, args);
  }
}

const [command] = process.argv.slice(2);
if (!command || command === "--help" || command === "-h") {
  printUsage();
  process.exit(command ? 0 : 1);
}

const runner = RUNNERS[command];
if (!runner) {
  console.error(`Unknown command: ${command}`);
  printUsage();
  process.exit(1);
}

if (Array.isArray(runner[0])) {
  runSequence(runner);
} else {
  runStep(runner[0], runner[1]);
}
