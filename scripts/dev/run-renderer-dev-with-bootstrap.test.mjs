import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {
  resolveRendererDevBootstrapContext,
} from '@sdkwork/iam-credential-entry/renderer-dev-bootstrap';
import {
  mergeRepoDevBootstrapAccessTokenEnv,
} from '@sdkwork/iam-credential-entry/node-bootstrap';

function writeManifest(root, appId) {
  fs.mkdirSync(root, { recursive: true });
  fs.writeFileSync(path.join(root, 'sdkwork.app.config.json'), JSON.stringify({
    app: { key: appId },
    backend: { appId, tenantId: '100001', organizationId: '0' },
  }));
}

test('renderer bootstrap resolves the nearest generic application manifest', () => {
  const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'sdkwork-iam-renderer-'));
  const surfaceRoot = path.join(repoRoot, 'apps', 'sdkwork-example-pc');
  fs.writeFileSync(path.join(repoRoot, 'package.json'), '{}');
  writeManifest(repoRoot, 'sdkwork-example');
  writeManifest(surfaceRoot, 'sdkwork-example-pc');

  try {
    const context = resolveRendererDevBootstrapContext(surfaceRoot);
    const merged = mergeRepoDevBootstrapAccessTokenEnv({
      env: {},
      manifestPath: context.manifestPath,
      repoRoot: context.repoRoot,
    });
    const payload = JSON.parse(
      Buffer.from(merged.SDKWORK_ACCESS_TOKEN.split('.')[1], 'base64url').toString('utf8'),
    );

    assert.equal(context.repoRoot, surfaceRoot);
    assert.equal(context.manifestPath, 'sdkwork.app.config.json');
    assert.equal(payload.app_id, 'sdkwork-example-pc');
  } finally {
    fs.rmSync(repoRoot, { force: true, recursive: true });
  }
});
