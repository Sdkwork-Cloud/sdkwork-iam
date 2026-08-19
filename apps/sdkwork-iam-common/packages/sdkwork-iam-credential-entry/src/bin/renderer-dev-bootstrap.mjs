#!/usr/bin/env node

import { runRendererDevWithBootstrapCli } from '../renderer-dev-bootstrap.mjs';

Promise.resolve(runRendererDevWithBootstrapCli()).catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
