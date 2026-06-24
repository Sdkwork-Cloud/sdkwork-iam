import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';

import {
  mergeRepoDevBootstrapAccessTokenEnv,
  resolveRepoApplicationManifestPath,
} from './create-dev-bootstrap-access-token-env.mjs';

const sdkworkImRepoRoot = path.resolve(import.meta.dirname, '../../../sdkwork-im');

test('resolveRepoApplicationManifestPath resolves repo-root manifest by default', () => {
  const manifestPath = resolveRepoApplicationManifestPath(sdkworkImRepoRoot);
  assert.match(manifestPath, /sdkwork\.app\.config\.json$/u);
});

test('mergeRepoDevBootstrapAccessTokenEnv generates bootstrap token from repo manifest', () => {
  const merged = mergeRepoDevBootstrapAccessTokenEnv({
    repoRoot: sdkworkImRepoRoot,
    appId: 'sdkwork-im-pc',
    env: {
      VITE_SDKWORK_IM_PLATFORM_API_GATEWAY_HTTP_URL: 'http://127.0.0.1:18079',
    },
  });
  assert.match(merged.SDKWORK_ACCESS_TOKEN, /^eyJ/u);
  assert.equal(
    merged.VITE_SDKWORK_IM_PLATFORM_API_GATEWAY_HTTP_URL,
    'http://127.0.0.1:18079',
  );
});

test('mergeRepoDevBootstrapAccessTokenEnv preserves configured bootstrap token', () => {
  const merged = mergeRepoDevBootstrapAccessTokenEnv({
    repoRoot: sdkworkImRepoRoot,
    env: {
      SDKWORK_ACCESS_TOKEN: 'configured-bootstrap-token',
    },
  });
  assert.equal(merged.SDKWORK_ACCESS_TOKEN, 'configured-bootstrap-token');
});

console.log('create-dev-bootstrap-access-token-env contract passed.');
