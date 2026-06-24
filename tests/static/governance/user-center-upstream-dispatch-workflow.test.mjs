import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const appbaseRoot = path.resolve(import.meta.dirname, '../../..');
const workflowPath = path.join(appbaseRoot, '.github', 'workflows', 'user-center-upstream-dispatch.yml');

function readWorkflow() {
  return readFileSync(workflowPath, 'utf8');
}

test('sdkwork-appbase exposes a governed user-center upstream dispatch workflow', () => {
  assert.equal(existsSync(workflowPath), true, 'missing .github/workflows/user-center-upstream-dispatch.yml');

  const workflow = readWorkflow();

  assert.match(workflow, /push:/);
  assert.match(workflow, /branches:\s*[\s\S]*?-\s*main/);
  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /permissions:\s*contents:\s*read/);
  assert.match(workflow, /actions\/checkout@v5/);
  assert.match(workflow, /actions\/setup-node@v5/);
  assert.match(workflow, /node scripts\/run-user-center-standard-contracts\.mjs/);
  assert.match(workflow, /node scripts\/run-appbase-governance-node-tests\.mjs/);
  assert.match(workflow, /node scripts\/user-center-upstream-dispatch\.mjs/);
  assert.match(workflow, /SDKWORK_USER_CENTER_UPSTREAM_DISPATCH_TOKEN/);
});
