import assert from 'node:assert/strict';
import path from 'node:path';
import process from 'node:process';
import test from 'node:test';
import { pathToFileURL } from 'node:url';

const iamRoot = path.resolve(import.meta.dirname, '../../..');

async function loadModule() {
  return import(
    pathToFileURL(
      path.join(iamRoot, 'scripts', 'user-center-upstream-dispatch.mjs'),
    ).href,
  );
}

test('user-center upstream dispatch builds repository-dispatch plans for every governed downstream repository', async () => {
  const module = await loadModule();

  assert.equal(typeof module.createUserCenterUpstreamDispatchPlan, 'function');

  const plan = module.createUserCenterUpstreamDispatchPlan({
    githubRef: 'refs/heads/main',
    githubSha: 'abc123',
    targets: [
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
    token: 'token-001',
  });

  assert.deepEqual(plan, [
    {
      body: JSON.stringify({
        client_payload: {
          source_ref: 'refs/heads/main',
          source_repository: 'Sdkwork-Cloud/sdkwork-iam',
          source_sha: 'abc123',
          workflow: 'user-center-upstream-sync',
        },
        event_type: 'sdkwork-iam-user-center-standard-updated',
      }),
      command: 'gh',
      args: ['api', 'repos/Example-Org/example-console/dispatches', '--method', 'POST', '--input', '-'],
      env: {
        ...process.env,
        GH_TOKEN: 'token-001',
      },
      id: 'example-console',
    },
    {
      body: JSON.stringify({
        client_payload: {
          source_ref: 'refs/heads/main',
          source_repository: 'Sdkwork-Cloud/sdkwork-iam',
          source_sha: 'abc123',
          workflow: 'user-center-upstream-sync',
        },
        event_type: 'sdkwork-iam-user-center-standard-updated',
      }),
      command: 'gh',
      args: ['api', 'repos/Example-Org/example-app/dispatches', '--method', 'POST', '--input', '-'],
      env: {
        ...process.env,
        GH_TOKEN: 'token-001',
      },
      id: 'example-app',
    },
  ]);
});

test('user-center upstream dispatch rejects missing dispatch tokens', async () => {
  const module = await loadModule();

  assert.throws(
    () => module.createUserCenterUpstreamDispatchPlan({
      githubRef: 'refs/heads/main',
      githubSha: 'abc123',
      token: '   ',
    }),
    /dispatch token/i,
  );
});
