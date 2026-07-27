import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const workspaceRoot = path.resolve(import.meta.dirname, '../../..');
const sdkworkSpaceRoot = path.resolve(workspaceRoot, '..');

function readText(relativePath) {
  return fs.readFileSync(path.join(workspaceRoot, relativePath), 'utf8');
}

function listWorkspaceIamRuntimeSources() {
  const offenders = [];
  const repoRoots = fs.readdirSync(sdkworkSpaceRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(sdkworkSpaceRoot, entry.name));

  const runtimeFilePattern = /(?:app[-_]?auth[-_]?runtime|iam[-_]?runtime|auth[-_]?runtime)\.(ts|tsx|mjs)$/iu;

  for (const repoRoot of repoRoots) {
    const appsDir = path.join(repoRoot, 'apps');
    if (!fs.existsSync(appsDir)) {
      continue;
    }

    walkDirectory(appsDir, (filePath) => {
      if (!runtimeFilePattern.test(path.basename(filePath))) {
        return;
      }
      const source = fs.readFileSync(filePath, 'utf8');
      if (!source.includes('createSdkworkAppbasePcAuthRuntime')) {
        return;
      }
      if (!source.includes('wrapCredentialEntryClient')) {
        return;
      }
      offenders.push(path.relative(sdkworkSpaceRoot, filePath));
    });
  }

  return offenders;
}

function walkDirectory(directory, visitFile) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === '.git') {
        continue;
      }
      walkDirectory(fullPath, visitFile);
      continue;
    }
    visitFile(fullPath);
  }
}

test('auth-runtime factory initializes credential-entry bootstrap Access-Token by default', () => {
  const runtimeSource = readText(
    'apps/sdkwork-iam-pc/packages/sdkwork-auth-runtime-pc-react/src/appbasePcAuthRuntime.ts',
  );
  assert.match(runtimeSource, /initializeCredentialEntryTokenManager/u);
  assert.match(runtimeSource, /readBootstrapAccessTokenFromProcessEnv/u);
  assert.match(runtimeSource, /bootstrapAccessToken/u);
  assert.doesNotMatch(runtimeSource, /wrapCredentialEntryClient/u);
});

test('iam-credential-entry exposes bootstrap access token helpers for dev orchestration', () => {
  const packageSource = readText(
    'apps/sdkwork-iam-common/packages/sdkwork-iam-credential-entry/src/index.ts',
  );
  assert.match(packageSource, /createDevBootstrapAccessTokenJwt/u);
  assert.match(packageSource, /mergeBootstrapAccessTokenEnv/u);
});

test('shared dev bootstrap env helper is available for application orchestrators', () => {
  const helperPath = path.join(workspaceRoot, 'scripts/dev/create-dev-bootstrap-access-token-env.mjs');
  assert.ok(fs.existsSync(helperPath));
  const source = fs.readFileSync(helperPath, 'utf8');
  assert.match(source, /mergeBootstrapAccessTokenEnvFromManifest/u);
  assert.match(source, /mergeRepoDevBootstrapAccessTokenEnv/u);
  assert.match(source, /SDKWORK_ACCESS_TOKEN_ENV_KEY/u);
});

test('product IAM runtimes do not duplicate request-time credential-entry wrappers', () => {
  const offenders = listWorkspaceIamRuntimeSources();
  assert.deepEqual(
    offenders,
    [],
    `Duplicate credential-entry wraps must rely on createSdkworkAppbasePcAuthRuntime bootstrap token initialization:\n${offenders.join('\n')}`,
  );
});

test('auth-runtime README documents credential-entry bootstrap behavior', () => {
  const readme = readText('apps/sdkwork-iam-pc/packages/sdkwork-auth-runtime-pc-react/README.md');
  assert.match(readme, /credential-entry|SDKWORK_ACCESS_TOKEN/u);
  assert.match(readme, /access-token-only/u);
  assert.doesNotMatch(readme, /skipWrap|wrapCredentialEntryClient/u);
});

console.log('credential-entry runtime standard passed.');
