#!/usr/bin/env node

import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { runRendererDevWithBootstrapCli } from './run-renderer-dev-with-bootstrap.mjs';

export {
  resolveDevBootstrapContext,
  resolveRendererDevBootstrapContext,
  runRendererDevWithBootstrapCli,
} from './run-renderer-dev-with-bootstrap.mjs';

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  runRendererDevWithBootstrapCli();
}
