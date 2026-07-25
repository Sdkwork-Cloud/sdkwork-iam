import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {
  mergeRepoBootstrapAccessTokenEnv,
  mergeRepoDevBootstrapAccessTokenEnv,
  normalizeBootstrapEnvironment,
  readBootstrapAccessTokenEnvFile,
  resolveRepoApplicationManifestPath,
} from './create-dev-bootstrap-access-token-env.mjs';

const sdkworkImRepoRoot = path.resolve(import.meta.dirname, '../../../sdkwork-im');

const clientArchitectureIds = [
  'pc',
  'h5',
  'flutter-mobile',
  'ios',
  'android',
  'harmony',
  'mini-program',
];

function decodeJwtPayload(token) {
  return JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString('utf8'));
}

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

test('surface manifest paths generate architecture-specific bootstrap identities', () => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), 'sdkwork-credential-entry-matrix-'));
  try {
    for (const architecture of clientArchitectureIds) {
      const appId = `sdkwork-example-${architecture}`;
      const surfaceRoot = path.join(tempRoot, 'apps', appId);
      mkdirSync(surfaceRoot, { recursive: true });
      writeFileSync(
        path.join(surfaceRoot, 'sdkwork.app.config.json'),
        JSON.stringify({
          app: { key: appId },
          backend: {
            appId,
            tenantId: '100001',
            organizationId: '0',
            accessTokenPermissionScope: ['iam.credential_entry'],
          },
        }),
        'utf8',
      );

      const manifestPath = `apps/${appId}/sdkwork.app.config.json`;
      const merged = mergeRepoDevBootstrapAccessTokenEnv({
        env: {},
        manifestPath,
        repoRoot: tempRoot,
      });
      const payload = decodeJwtPayload(merged.SDKWORK_ACCESS_TOKEN);
      assert.equal(payload.app_id, appId);
      assert.equal(payload.tenant_id, '100001');
      assert.equal(payload.organization_id, '0');
    }
  } finally {
    rmSync(tempRoot, { recursive: true, force: true });
  }
});

test('bootstrap token generation fails closed instead of falling back to app.key', () => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), 'sdkwork-credential-entry-strict-'));
  try {
    writeFileSync(
      path.join(tempRoot, 'sdkwork.app.config.json'),
      JSON.stringify({
        app: { key: 'sdkwork-example-pc' },
        backend: {
          tenantId: '100001',
          organizationId: '0',
          accessTokenPermissionScope: ['iam.credential_entry'],
        },
      }),
      'utf8',
    );
    assert.throws(
      () => mergeRepoDevBootstrapAccessTokenEnv({ env: {}, repoRoot: tempRoot }),
      /backend\.appId is required/u,
    );
  } finally {
    rmSync(tempRoot, { recursive: true, force: true });
  }
});

test('bootstrap environment aliases normalize to canonical lifecycle names', () => {
  assert.equal(normalizeBootstrapEnvironment('dev'), 'development');
  assert.equal(normalizeBootstrapEnvironment('prod'), 'production');
  assert.throws(() => normalizeBootstrapEnvironment('release'), /unsupported SDKWork environment/u);
});

test('private bootstrap env-file reader returns only the canonical token value', () => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), 'sdkwork-credential-entry-'));
  const envFile = path.join(tempRoot, '.env.development.bootstrap.local');
  try {
    writeFileSync(envFile, [
      '# private bootstrap fixture',
      'IGNORED_KEY=ignored',
      'SDKWORK_ACCESS_TOKEN="configured-bootstrap-token"',
      '',
    ].join('\n'), 'utf8');
    assert.equal(readBootstrapAccessTokenEnvFile(envFile), 'configured-bootstrap-token');
  } finally {
    rmSync(tempRoot, { recursive: true, force: true });
  }
});

test('test bootstrap generation requires explicit isolated-test opt-in', () => {
  assert.throws(
    () => mergeRepoBootstrapAccessTokenEnv({
      repoRoot: sdkworkImRepoRoot,
      environment: 'test',
    }),
    /allowTestTokenGeneration/u,
  );

  const merged = mergeRepoBootstrapAccessTokenEnv({
    repoRoot: sdkworkImRepoRoot,
    environment: 'test',
    allowTestTokenGeneration: true,
  });
  const payload = JSON.parse(
    Buffer.from(merged.SDKWORK_ACCESS_TOKEN.split('.')[1], 'base64').toString('utf8'),
  );
  assert.equal(payload.environment, 'test');
});

for (const environment of ['staging', 'production']) {
  test(`${environment} bootstrap fails closed without a private token`, () => {
    assert.throws(
      () => mergeRepoBootstrapAccessTokenEnv({
        repoRoot: sdkworkImRepoRoot,
        environment,
      }),
      new RegExp(`SDKWORK_ACCESS_TOKEN is required for ${environment}`, 'u'),
    );
  });

  test(`${environment} bootstrap preserves a privately provisioned token`, () => {
    const merged = mergeRepoBootstrapAccessTokenEnv({
      repoRoot: sdkworkImRepoRoot,
      environment,
      env: { SDKWORK_ACCESS_TOKEN: `${environment}-secret-token` },
    });
    assert.equal(merged.SDKWORK_ACCESS_TOKEN, `${environment}-secret-token`);
  });
}

console.log('create-dev-bootstrap-access-token-env contract passed.');
