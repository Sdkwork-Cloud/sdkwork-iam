import path from 'node:path';
import process from 'node:process';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { runCommandSequence } from './run-command-sequence.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(__dirname, '..');

export function createDatabaseContractCheckPlan({ cwd = appRoot } = {}) {
  return [
    {
      command: process.execPath,
      args: [
        path.join(cwd, '../sdkwork-specs/tools/check-database-framework-standard.mjs'),
        '--root',
        cwd,
      ],
    },
    {
      command: process.execPath,
      args: [path.join(cwd, 'tests/contract/iam-database-contract-alignment.test.mjs')],
    },
  ];
}

export function runDatabaseContractCheck({
  cwd = appRoot,
  env = process.env,
  runCommands = runCommandSequence,
} = {}) {
  return runCommands({
    commands: createDatabaseContractCheckPlan({ cwd }),
    cwd,
    env,
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exit(runDatabaseContractCheck());
}
