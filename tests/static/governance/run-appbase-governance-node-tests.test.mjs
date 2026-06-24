import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';
import { pathToFileURL } from 'node:url';
import { listAppbaseGovernanceNodeTestFiles } from '../../../scripts/appbase-governance-node-test-catalog.mjs';

const appbaseRoot = path.resolve(import.meta.dirname, '../../..');

async function loadModule() {
  return import(
    pathToFileURL(
      path.join(appbaseRoot, 'scripts', 'run-appbase-governance-node-tests.mjs'),
    ).href,
  );
}

test('appbase governance node runner executes the governed test plan with node test isolation disabled', async () => {
  const module = await loadModule();

  assert.equal(typeof module.createAppbaseGovernanceNodeTestPlan, 'function');

  assert.deepEqual(
    module.createAppbaseGovernanceNodeTestPlan({
      cwd: 'D:/workspace/sdkwork-appbase',
      env: {},
      nodeExecutable: 'node-custom',
    }),
    {
      command: 'node-custom',
      args: [
        '--test',
        '--experimental-test-isolation=none',
        ...listAppbaseGovernanceNodeTestFiles(),
      ],
      cwd: 'D:/workspace/sdkwork-appbase',
      env: {},
      shell: false,
      windowsHide: process.platform === 'win32',
    },
  );
});
