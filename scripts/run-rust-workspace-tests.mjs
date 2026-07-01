import path from 'node:path';
import process from 'node:process';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { runCommandSequence } from './run-command-sequence.mjs';
import {
  createAppApiRustTestCommands,
  createBackendApiRustTestCommands,
  iamPostgresProfileAvailable,
} from './run-iam-standard-contracts.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sdkworkIamRoot = path.resolve(__dirname, '..');

/** Route crates with PostgreSQL integration suites governed by iamPostgresProfileAvailable. */
const POSTGRES_GATED_PACKAGES = [
  'sdkwork-routes-iam-app-api',
  'sdkwork-routes-iam-backend-api',
];

/**
 * Rust workspace verification plan.
 * Excludes postgres-gated route crates from the blanket workspace run, then applies
 * the same governed per-crate commands as test:iam-standard-contracts.
 */
export function createRustWorkspaceTestPlan(cwd = sdkworkIamRoot) {
  const threadArgs = ['--', '--test-threads', '1'];
  const excludeArgs = POSTGRES_GATED_PACKAGES.flatMap((packageName) => [
    '--exclude',
    packageName,
  ]);

  return [
    {
      command: 'cargo',
      args: ['test', '--workspace', '-j', '1', ...excludeArgs, ...threadArgs],
    },
    ...createAppApiRustTestCommands(cwd),
    ...createBackendApiRustTestCommands(cwd),
  ];
}

export function runRustWorkspaceTests({
  cwd = sdkworkIamRoot,
  env = process.env,
  logger = console,
  runCommands = runCommandSequence,
} = {}) {
  if (!iamPostgresProfileAvailable(cwd)) {
    logger.log(
      'run-rust-workspace-tests: PostgreSQL profile absent; skipping iam_local_app_router_test and backend postgres integration',
    );
  }

  return runCommands({
    commands: createRustWorkspaceTestPlan(cwd),
    cwd,
    env,
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exit(runRustWorkspaceTests());
}
