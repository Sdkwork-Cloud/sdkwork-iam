import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';
import { pathToFileURL } from 'node:url';

const appbaseRoot = path.resolve(import.meta.dirname, '../../..');

async function loadModule() {
  return import(
    pathToFileURL(
      path.join(appbaseRoot, 'scripts', 'appbase-governance-node-test-catalog.mjs'),
    ).href,
  );
}

test('appbase governance node test catalog publishes the exact governed test surface', async () => {
  const module = await loadModule();

  assert.equal(typeof module.listAppbaseGovernanceNodeTestFiles, 'function');
  assert.deepEqual(
    module.listAppbaseGovernanceNodeTestFiles(),
    [
      'tests/static/governance/appbase-governance-node-test-catalog.test.mjs',
      'tests/static/governance/appbase-sdk-boundary-contract.test.mjs',
      'tests/static/governance/environment-credential-standard.test.mjs',
      'tests/static/governance/workspace-credential-env-standard.test.mjs',
      'tests/static/governance/api-prefix-standard-governance.test.mjs',
  'tests/static/governance/appbase-commerce-extraction-boundary.test.mjs',
      'tests/static/governance/appbase-content-extraction-boundary.test.mjs',
      'tests/static/governance/appbase-device-extraction-boundary.test.mjs',
      'tests/static/governance/appbase-ecosystem-extraction-boundary.test.mjs',
      'tests/static/governance/appbase-intelligence-extraction-boundary.test.mjs',
      'tests/static/governance/appbase-portal-extraction-boundary.test.mjs',
      'tests/static/governance/appbase-news-extraction-boundary.test.mjs',
      'tests/static/governance/appbase-community-extraction-boundary.test.mjs',
      'tests/static/governance/appbase-course-extraction-boundary.test.mjs',
      'tests/static/governance/appbase-comments-extraction-boundary.test.mjs',
      'tests/static/governance/appbase-image-extraction-boundary.test.mjs',
      'tests/static/governance/appbase-local-api-proxy-extraction-boundary.test.mjs',
      'tests/static/governance/appbase-messaging-extraction-boundary.test.mjs',
      'tests/static/governance/appbase-rtc-extraction-boundary.test.mjs',
      'tests/static/governance/appbase-search-extraction-boundary.test.mjs',
      'tests/static/governance/appbase-aiot-device-contract.test.mjs',
      'tests/static/governance/common-package-test-script-standard.test.mjs',
      'tests/static/governance/iam-application-bootstrap-standard.test.mjs',
      'tests/static/governance/iam-login-integration-standard.test.mjs',
      'tests/static/governance/iam-module-federation-standard.test.mjs',
      'tests/static/governance/iam-bootstrap-subject-workspace-alignment.test.mjs',
      'tests/static/governance/iam-crate-migrations-forbidden.test.mjs',
      'tests/static/governance/request-identity-standard-governance.test.mjs',
      'tests/static/governance/run-iam-standard-governance.test.mjs',
      'tests/static/governance/run-iam-standard-contracts.test.mjs',
      'tests/static/governance/run-appbase-governance-node-tests.test.mjs',
      'tests/static/governance/run-workspace-vitest.test.mjs',
      'tests/static/governance/run-workspace-typecheck.test.mjs',
      'tests/static/governance/review-workspace-structure.test.mjs',
      'tests/static/governance/rust-workspace-standard.test.mjs',
      'tests/static/governance/sdkwork-brand-standard.test.mjs',
      'tests/static/governance/run-user-center-standard-contracts.test.mjs',
      'tests/static/governance/user-center-command-matrix.test.mjs',
      'tests/static/governance/user-center-upstream-dispatch-target-catalog.test.mjs',
      'tests/static/governance/user-center-upstream-dispatch.test.mjs',
      'tests/static/governance/user-center-upstream-dispatch-workflow.test.mjs',
      'tests/static/governance/workspace-verify-script-standard.test.mjs',
      'tests/static/governance/extraction-boundary-surfaces-import.test.mjs',
      'tests/static/governance/appbase-sdk-family-surfaces.test.mjs',
      'tests/static/governance/sdk-family-component-spec-standard.test.mjs',
      'tests/static/governance/workspace-path-standard.test.mjs',
      'tests/contract/iam-database-contract-alignment.test.mjs',
      'tests/static/contract-parity.test.mjs',
      'tests/static/component-spec-metadata.test.mjs',
    ],
  );
});
