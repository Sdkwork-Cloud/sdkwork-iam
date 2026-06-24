import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';
import { pathToFileURL } from 'node:url';

const appbaseRoot = path.resolve(import.meta.dirname, '../../..');

async function loadModule() {
  return import(
    pathToFileURL(
      path.join(appbaseRoot, 'scripts', 'user-center-upstream-dispatch-target-catalog.mjs'),
    ).href,
  );
}

test('user-center upstream dispatch target catalog is configuration driven', async () => {
  const module = await loadModule();

  assert.equal(typeof module.listUserCenterUpstreamDispatchTargets, 'function');
  assert.equal(typeof module.findUserCenterUpstreamDispatchTarget, 'function');
  assert.equal(typeof module.parseUserCenterUpstreamDispatchTargets, 'function');

  assert.deepEqual(module.listUserCenterUpstreamDispatchTargets(''), []);

  assert.deepEqual(
    module.listUserCenterUpstreamDispatchTargets(
      [
        'example-console|Example-Org/example-console|user-center-upstream-sync',
        'example-app|Example-Org/example-app|',
      ].join(','),
    ),
    [
      {
        id: 'example-console',
        repository: 'Example-Org/example-console',
        workflow: 'user-center-upstream-sync',
      },
      {
        id: 'example-app',
        repository: 'Example-Org/example-app',
        workflow: 'user-center-upstream-sync',
      },
    ],
  );

  assert.deepEqual(
    module.findUserCenterUpstreamDispatchTarget(
      'example-app',
      'example-app|Example-Org/example-app|example-workflow',
    ),
    {
      id: 'example-app',
      repository: 'Example-Org/example-app',
      workflow: 'example-workflow',
    },
  );
});
