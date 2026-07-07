#!/usr/bin/env node

import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import { mergeRepoDevBootstrapAccessTokenEnv } from './create-dev-bootstrap-access-token-env.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function printHelp() {
  console.log(`Usage: node run-pc-renderer-dev-with-bootstrap.mjs [options] [--] [command ...]

Starts a PC renderer dev process with private SDKWORK_ACCESS_TOKEN bootstrap env merged
from sdkwork.app.config.json identity before spawn.

Options:
  --cwd <dir>            Working directory for the child process (default: process.cwd())
  --repo-root <dir>      Repository root override for manifest resolution
  --manifest-path <path> Manifest path relative to repo root
  --dry-run              Print resolved bootstrap context and command without spawning
  --help, -h

Examples:
  node run-pc-renderer-dev-with-bootstrap.mjs -- vite --host 127.0.0.1 --port 5174
  node run-pc-renderer-dev-with-bootstrap.mjs --cwd apps/sdkwork-mall-pc -- vite
`);
}

function parseArgs(argv) {
  const settings = {
    cwd: process.cwd(),
    repoRoot: undefined,
    manifestPath: undefined,
    dryRun: false,
    help: false,
    command: undefined,
    commandArgs: [],
  };

  let index = 0;
  while (index < argv.length) {
    const arg = argv[index];
    if (arg === '--help' || arg === '-h') {
      settings.help = true;
      index += 1;
      continue;
    }
    if (arg === '--cwd') {
      settings.cwd = path.resolve(argv[index + 1] ?? settings.cwd);
      index += 2;
      continue;
    }
    if (arg === '--repo-root') {
      settings.repoRoot = path.resolve(argv[index + 1] ?? settings.repoRoot);
      index += 2;
      continue;
    }
    if (arg === '--manifest-path') {
      settings.manifestPath = argv[index + 1];
      index += 2;
      continue;
    }
    if (arg === '--dry-run') {
      settings.dryRun = true;
      index += 1;
      continue;
    }
    if (arg === '--') {
      settings.command = argv[index + 1];
      settings.commandArgs = argv.slice(index + 2);
      break;
    }
    settings.command = arg;
    settings.commandArgs = argv.slice(index + 1);
    break;
  }

  if (!settings.command) {
    settings.command = 'vite';
    settings.commandArgs = [];
  }

  return settings;
}

export function resolveDevBootstrapContext(startDir = process.cwd()) {
  let current = path.resolve(startDir);
  let deepestManifestPath;

  while (true) {
    const candidate = path.join(current, 'sdkwork.app.config.json');
    if (existsSync(candidate) && !deepestManifestPath) {
      deepestManifestPath = candidate;
    }
    const parent = path.dirname(current);
    if (parent === current) {
      break;
    }
    current = parent;
  }

  if (!deepestManifestPath) {
    throw new Error(`Could not locate sdkwork.app.config.json from ${startDir}`);
  }

  let repoRoot = path.dirname(deepestManifestPath);
  current = repoRoot;
  while (true) {
    const parent = path.dirname(current);
    if (parent === current) {
      break;
    }
    if (existsSync(path.join(parent, 'package.json'))) {
      repoRoot = parent;
      current = parent;
      continue;
    }
    break;
  }

  return {
    manifestPath: path.relative(repoRoot, deepestManifestPath).replace(/\\/g, '/'),
    repoRoot,
  };
}

function resolveLocalExecutable(cwd, command) {
  const require = createRequire(path.join(cwd, 'package.json'));
  if (command === 'vite') {
    // Vite 6+ no longer exports bin/vite.js via package exports; resolve via package root.
    const vitePackageJson = require.resolve('vite/package.json');
    return path.join(path.dirname(vitePackageJson), 'bin', 'vite.js');
  }
  return command;
}

function spawnRendererDevProcess({
  command,
  commandArgs,
  cwd,
  env,
}) {
  const child = spawn(process.execPath, [command, ...commandArgs], {
    cwd,
    env,
    stdio: 'inherit',
    windowsHide: true,
  });

  child.on('exit', (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }
    process.exit(code ?? 0);
  });

  child.on('error', (error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}

function main() {
  const settings = parseArgs(process.argv.slice(2));
  if (settings.help) {
    printHelp();
    return;
  }

  const bootstrapContext = settings.repoRoot && settings.manifestPath
    ? {
      repoRoot: settings.repoRoot,
      manifestPath: settings.manifestPath,
    }
    : resolveDevBootstrapContext(settings.cwd);

  const mergedEnv = mergeRepoDevBootstrapAccessTokenEnv({
    env: { ...process.env },
    manifestPath: bootstrapContext.manifestPath,
    repoRoot: bootstrapContext.repoRoot,
  });

  if (settings.dryRun) {
    console.log(JSON.stringify({
      bootstrapContext,
      command: settings.command,
      commandArgs: settings.commandArgs,
      cwd: settings.cwd,
      hasBootstrapAccessToken: Boolean(mergedEnv.SDKWORK_ACCESS_TOKEN),
    }, null, 2));
    return;
  }

  const executable = resolveLocalExecutable(settings.cwd, settings.command);

  spawnRendererDevProcess({
    command: executable,
    commandArgs: settings.commandArgs,
    cwd: settings.cwd,
    env: mergedEnv,
  });
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main();
}
