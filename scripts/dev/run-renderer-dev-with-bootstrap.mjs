#!/usr/bin/env node

import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

export {
  resolveDevBootstrapContext,
  resolveRendererDevBootstrapContext,
  runRendererDevWithBootstrapCli,
} from '@sdkwork/iam-credential-entry/renderer-dev-bootstrap';

import { runRendererDevWithBootstrapCli } from '@sdkwork/iam-credential-entry/renderer-dev-bootstrap';

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  Promise.resolve(runRendererDevWithBootstrapCli()).catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
