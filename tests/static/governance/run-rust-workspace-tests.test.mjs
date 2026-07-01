import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';

import {
  createRustWorkspaceTestPlan,
} from '../../../scripts/run-rust-workspace-tests.mjs';
import { iamPostgresProfileAvailable } from '../../../scripts/run-iam-standard-contracts.mjs';

const iamRoot = path.resolve(import.meta.dirname, '../../..');

test('rust workspace test plan excludes postgres-gated route crates from blanket workspace run', () => {
  const plan = createRustWorkspaceTestPlan(iamRoot);
  const workspaceArgs = plan[0]?.args ?? [];

  assert.equal(plan[0]?.command, 'cargo');
  assert.ok(workspaceArgs.includes('--exclude'));
  assert.ok(workspaceArgs.includes('sdkwork-routes-iam-app-api'));
  assert.ok(workspaceArgs.includes('sdkwork-routes-iam-backend-api'));
  assert.ok(workspaceArgs.includes('--test-threads'));
  assert.equal(workspaceArgs.at(-1), '1');
});

test('rust workspace test plan reuses governed app-api and backend-api commands', () => {
  const plan = createRustWorkspaceTestPlan(iamRoot);
  const appApiPlans = plan.filter((command) =>
    command.args?.includes('sdkwork-routes-iam-app-api'),
  );
  const backendPlans = plan.filter((command) =>
    command.args?.includes('sdkwork-routes-iam-backend-api'),
  );

  assert.ok(appApiPlans.some((command) => command.args.includes('iam_http_standard')));
  assert.ok(
    backendPlans.some((command) => command.args.includes('iam_backend_route_standard')),
  );

  if (iamPostgresProfileAvailable(iamRoot)) {
    assert.ok(
      appApiPlans.some((command) => command.args.includes('iam_local_app_router_test')),
    );
    assert.ok(
      backendPlans.some((command) =>
        command.args.includes('iam_backend_postgres_integration'),
      ),
    );
  } else {
    assert.equal(
      appApiPlans.filter((command) => command.args.includes('sdkwork-routes-iam-app-api')).length,
      1,
    );
    assert.equal(
      backendPlans.filter((command) => command.args.includes('sdkwork-routes-iam-backend-api'))
        .length,
      1,
    );
  }
});
