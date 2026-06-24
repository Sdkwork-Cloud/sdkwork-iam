import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { pathToFileURL } from 'node:url';

const appbaseRoot = path.resolve(import.meta.dirname, '../../..');

async function loadModule() {
  return import(
    pathToFileURL(
      path.join(appbaseRoot, 'scripts', 'user-center-command-matrix.mjs'),
    ).href,
  );
}

test('user-center command matrix node bridge exposes canonical doctor and env coverage', async () => {
  const module = await loadModule();

  assert.equal(typeof module.createUserCenterCommandMatrix, 'function');
  const source = fs.readFileSync(
    path.join(appbaseRoot, 'scripts', 'user-center-command-matrix.mjs'),
    'utf8',
  );
  assert.match(
    source,
    /from ['"]@sdkwork\/user-center-core-pc-react['"]/u,
    'user-center command matrix node bridge must delegate to the canonical package root.',
  );
  assert.doesNotMatch(
    source,
    /function resolveIamMode|function resolveProviderKind|for \(const surface of USER_CENTER_COMMAND_SURFACES\)/u,
    'user-center command matrix node bridge must not duplicate package command matrix logic.',
  );

  const matrix = module.createUserCenterCommandMatrix();
  const commands = matrix.map((entry) => entry.command);

  assert.equal(matrix.length, 72);
  assert.equal(new Set(commands).size, matrix.length);
  assert.deepEqual(
    matrix.find((entry) => entry.command === 'desktop:dev:local'),
    {
      command: 'desktop:dev:local',
      iamMode: 'desktop-local',
      lifecycle: 'dev',
      mode: 'local',
      providerKind: 'builtin-local',
      surface: 'desktop',
    },
  );
  assert.deepEqual(
    matrix.find((entry) => entry.command === 'web:env:private'),
    {
      command: 'web:env:private',
      iamMode: 'server-private',
      lifecycle: 'env',
      mode: 'private',
      providerKind: 'builtin-local',
      surface: 'web',
    },
  );
  assert.deepEqual(
    matrix.find((entry) => entry.command === 'server:doctor:cloud'),
    {
      command: 'server:doctor:cloud',
      iamMode: 'cloud-saas',
      lifecycle: 'doctor',
      mode: 'cloud',
      providerKind: 'sdkwork-cloud-app-api',
      surface: 'server',
    },
  );
  assert.ok(
    matrix.every((entry) => !Object.hasOwn(entry, 'identityMode')),
    'user-center command matrix must not expose the legacy identityMode field.',
  );
});
