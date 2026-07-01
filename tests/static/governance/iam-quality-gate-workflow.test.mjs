import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const root = process.cwd();
const workflowPath = path.join(root, '.github', 'workflows', 'iam-quality-gate.yml');

function readWorkflow() {
  return readFileSync(workflowPath, 'utf8');
}

test('sdkwork-iam exposes a governed IAM quality gate workflow', () => {
  assert.equal(existsSync(workflowPath), true, 'missing .github/workflows/iam-quality-gate.yml');

  const workflow = readWorkflow();

  assert.match(workflow, /name:\s*IAM Quality Gate/u);
  assert.match(workflow, /pull_request:/u);
  assert.match(workflow, /push:/u);
  assert.match(workflow, /workflow_dispatch:/u);
  assert.match(workflow, /permissions:\s*contents:\s*read/u);
  assert.match(workflow, /actions\/checkout@v4/u);
  assert.match(workflow, /pnpm run check/u);
  assert.match(workflow, /pnpm run test:governance-node/u);
  assert.match(workflow, /pnpm run test:iam-standard-contracts/u);
  assert.match(workflow, /pnpm run test:rust-workspace/u);
});
