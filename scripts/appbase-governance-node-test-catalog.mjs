export const IAM_GOVERNANCE_NODE_TEST_FILES = [
  'tests/static/governance/appbase-governance-node-test-catalog.test.mjs',
  'tests/static/governance/appbase-sdk-boundary-contract.test.mjs',
  'tests/static/governance/environment-credential-standard.test.mjs',
  'tests/static/governance/api-prefix-standard-governance.test.mjs',
  'tests/static/governance/common-package-test-script-standard.test.mjs',
  'tests/static/governance/iam-application-bootstrap-standard.test.mjs',
  'tests/static/governance/iam-database-init-standard.test.mjs',
  'tests/static/governance/iam-login-integration-standard.test.mjs',
  'tests/static/governance/credential-entry-runtime-standard.test.mjs',
  'tests/static/governance/iam-renderer-dev-bootstrap-orchestration-standard.test.mjs',
  'tests/static/governance/iam-utils-adoption-standard.test.mjs',
  'tests/static/governance/iam-quality-gate-workflow.test.mjs',
  'tests/static/governance/iam-gateway-assembly-health-standard.test.mjs',
  'tests/static/governance/iam-legacy-subject-repair-standard.test.mjs',
  'tests/static/governance/run-rust-workspace-tests.test.mjs',
  'tests/static/governance/iam-apps-layout-standard.test.mjs',
  'tests/static/governance/iam-module-federation-standard.test.mjs',
  'tests/static/governance/iam-app-permission-surface-alignment.test.mjs',
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
  'tests/static/governance/appbase-sdk-family-surfaces.test.mjs',
  'tests/static/governance/sdk-family-component-spec-standard.test.mjs',
  'tests/static/governance/workspace-path-standard.test.mjs',
  'tests/contract/iam-database-contract-alignment.test.mjs',
  'tests/static/contract-parity.test.mjs',
  'tests/static/component-spec-metadata.test.mjs',
];

/** @deprecated Use IAM_GOVERNANCE_NODE_TEST_FILES */
export const APPBASE_GOVERNANCE_NODE_TEST_FILES = IAM_GOVERNANCE_NODE_TEST_FILES;

export function listIamGovernanceNodeTestFiles() {
  return [...IAM_GOVERNANCE_NODE_TEST_FILES];
}

export function listAppbaseGovernanceNodeTestFiles() {
  return listIamGovernanceNodeTestFiles();
}

export function findIamGovernanceNodeTestFile(filePath) {
  const match = IAM_GOVERNANCE_NODE_TEST_FILES.find((candidate) => candidate === filePath);
  if (!match) {
    throw new Error(`missing iam governance node test file: ${filePath}`);
  }

  return match;
}

export function findAppbaseGovernanceNodeTestFile(filePath) {
  return findIamGovernanceNodeTestFile(filePath);
}

export function listIamGovernanceNodeTestFilesByPaths(filePaths = []) {
  return filePaths.map((filePath) => findIamGovernanceNodeTestFile(filePath));
}

export function listAppbaseGovernanceNodeTestFilesByPaths(filePaths = []) {
  return listIamGovernanceNodeTestFilesByPaths(filePaths);
}
