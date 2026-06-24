import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import {
  APPBASE_APIS_OPENAPI_AUTHORITY_FILES,
  APPBASE_OPENAPI_MATERIALIZED_FILES,
  APPBASE_SDK_FAMILY_ROOTS,
} from './appbase-sdk-family-surfaces.mjs';

const root = process.cwd();

test('appbase sdk family surface catalog includes all three SDK families', () => {
  assert.equal(APPBASE_SDK_FAMILY_ROOTS.length, 3);
  assert.ok(APPBASE_SDK_FAMILY_ROOTS.every((relativePath) => fs.existsSync(path.join(root, relativePath))));
});

test('appbase sdk family surface catalog points at apis and sdks OpenAPI authorities', () => {
  const missing = [
    ...APPBASE_APIS_OPENAPI_AUTHORITY_FILES,
    ...APPBASE_OPENAPI_MATERIALIZED_FILES,
  ].filter((relativePath) => !fs.existsSync(path.join(root, relativePath)));

  assert.deepEqual(missing, []);
});
