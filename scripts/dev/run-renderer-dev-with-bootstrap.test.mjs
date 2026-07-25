import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';

import {
  mergeRepoDevBootstrapAccessTokenEnv,
} from './create-dev-bootstrap-access-token-env.mjs';
import {
  resolveRendererDevBootstrapContext,
} from './run-renderer-dev-with-bootstrap.mjs';

const birdCoderRoot = path.resolve(import.meta.dirname, '../../../sdkwork-birdcoder');
const birdCoderSurfaces = [
  'sdkwork-birdcoder-pc',
  'sdkwork-birdcoder-h5',
  'sdkwork-birdcoder-flutter-mobile',
];

test('resolveDevBootstrapContext prefers nearest app manifest and repo root', () => {
  const context = resolveRendererDevBootstrapContext(
    path.join(birdCoderRoot, 'apps', 'sdkwork-birdcoder-pc'),
  );
  assert.equal(context.manifestPath, 'sdkwork.app.config.json');
  assert.match(context.repoRoot, /sdkwork-birdcoder-pc$/u);
});

for (const appId of birdCoderSurfaces) {
  test(`generic renderer bootstrap context preserves ${appId} identity`, () => {
    const context = resolveRendererDevBootstrapContext(
      path.join(birdCoderRoot, 'apps', appId),
    );
    const merged = mergeRepoDevBootstrapAccessTokenEnv({
      env: {},
      manifestPath: context.manifestPath,
      repoRoot: context.repoRoot,
    });
    const payload = JSON.parse(
      Buffer.from(merged.SDKWORK_ACCESS_TOKEN.split('.')[1], 'base64url').toString('utf8'),
    );
    assert.equal(payload.app_id, appId);
    assert.equal(payload.tenant_id, '100001');
    assert.equal(payload.organization_id, '0');
  });
}

console.log('run-renderer-dev-with-bootstrap contract passed.');
