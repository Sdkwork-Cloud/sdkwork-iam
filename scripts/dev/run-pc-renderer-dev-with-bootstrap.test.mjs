import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';

import {
  mergeRepoDevBootstrapAccessTokenEnv,
} from './create-dev-bootstrap-access-token-env.mjs';
import {
  resolveDevBootstrapContext,
} from './run-pc-renderer-dev-with-bootstrap.mjs';

const shopPcRoot = path.resolve(
  import.meta.dirname,
  '../../../sdkwork-shop/apps/sdkwork-shop-pc',
);

test('resolveDevBootstrapContext prefers nearest app manifest and repo root', () => {
  const context = resolveDevBootstrapContext(shopPcRoot);
  assert.equal(context.manifestPath, 'sdkwork.app.config.json');
  assert.match(context.repoRoot, /sdkwork-shop-pc$/u);
});

test('run-pc-renderer bootstrap context merges access token for shop pc', () => {
  const context = resolveDevBootstrapContext(shopPcRoot);
  const merged = mergeRepoDevBootstrapAccessTokenEnv({
    env: {},
    manifestPath: context.manifestPath,
    repoRoot: context.repoRoot,
  });
  assert.match(merged.SDKWORK_ACCESS_TOKEN, /^eyJ/u);
});

console.log('run-pc-renderer-dev-with-bootstrap contract passed.');
