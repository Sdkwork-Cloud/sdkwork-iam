import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const workspaceRoot = path.resolve(import.meta.dirname, '../../..');
const sdkworkSpaceRoot = path.resolve(workspaceRoot, '..');

const BOOTSTRAP_ORCHESTRATION_PATTERNS = [
  /mergeRepoDevBootstrapAccessTokenEnv/u,
  /mergeBootstrapAccessTokenEnvFromManifest/u,
  /mergeSdkworkImBootstrapAccessTokenEnv/u,
  /ensureClawRouterBrowserDevelopmentEnv/u,
];

const STANDALONE_PC_RENDERER_DEV_SCRIPT_PATTERN =
  /run-pc-renderer-dev-with-bootstrap\.mjs/u;

const IAM_PC_RENDERER_DEV_ORCHESTRATORS = Object.freeze([
  { repo: 'sdkwork-im', relativePath: 'scripts/lib/im-pc-dev.mjs' },
  { repo: 'sdkwork-clawrouter', relativePath: 'scripts/lib/claw-router-dev-main.mjs' },
  { repo: 'sdkwork-drive', relativePath: 'scripts/drive-dev.mjs' },
  { repo: 'sdkwork-rtc', relativePath: 'scripts/rtc-dev.mjs' },
  { repo: 'sdkwork-mail', relativePath: 'scripts/mail-dev.mjs' },
  { repo: 'sdkwork-knowledgebase', relativePath: 'scripts/knowledgebase-dev.mjs' },
  { repo: 'sdkwork-terminal', relativePath: 'scripts/terminal-dev.mjs' },
  { repo: 'sdkwork-documents', relativePath: 'scripts/documents-dev.mjs' },
  { repo: 'sdkwork-github', relativePath: 'scripts/github-dev.mjs' },
  { repo: 'sdkwork-birdcoder', relativePath: 'scripts/birdcoder-iam-env.mjs' },
  { repo: 'sdkwork-notes', relativePath: 'scripts/notes-dev.mjs' },
]);

const STANDALONE_IAM_PC_RENDERER_PACKAGES = Object.freeze([
  { repo: 'sdkwork-mall', relativePath: 'apps/sdkwork-mall-pc/package.json' },
  { repo: 'sdkwork-games', relativePath: 'apps/sdkwork-games-pc/package.json' },
  { repo: 'sdkwork-gameengine', relativePath: 'apps/sdkwork-gameengine-pc/package.json' },
  { repo: 'sdkwork-dezhou', relativePath: 'apps/sdkwork-dezhou-pc/package.json' },
  { repo: 'sdkwork-skills', relativePath: 'apps/sdkwork-skills-pc/package.json' },
  { repo: 'sdkwork-notary', relativePath: 'apps/sdkwork-notary-pc/package.json' },
]);

function readOrchestratorSource({ repo, relativePath }) {
  const filePath = path.join(sdkworkSpaceRoot, repo, relativePath);
  assert.ok(
    fs.existsSync(filePath),
    `Expected IAM PC dev orchestrator at ${path.relative(sdkworkSpaceRoot, filePath)}`,
  );
  return fs.readFileSync(filePath, 'utf8');
}

function hasBootstrapOrchestrationPattern(source) {
  return BOOTSTRAP_ORCHESTRATION_PATTERNS.some((pattern) => pattern.test(source));
}

test('shared repo bootstrap helper is available for application dev orchestrators', () => {
  const helperPath = path.join(workspaceRoot, 'scripts/dev/create-dev-bootstrap-access-token-env.mjs');
  const runnerPath = path.join(workspaceRoot, 'scripts/dev/run-pc-renderer-dev-with-bootstrap.mjs');
  const source = fs.readFileSync(helperPath, 'utf8');
  assert.ok(fs.existsSync(runnerPath));
  assert.match(source, /mergeRepoDevBootstrapAccessTokenEnv/u);
  assert.match(source, /resolveRepoApplicationManifestPath/u);
});

for (const orchestrator of IAM_PC_RENDERER_DEV_ORCHESTRATORS) {
  test(`${orchestrator.repo}/${orchestrator.relativePath} injects IAM bootstrap access token for renderer dev`, () => {
    const source = readOrchestratorSource(orchestrator);
    assert.ok(
      hasBootstrapOrchestrationPattern(source),
      `${orchestrator.repo}/${orchestrator.relativePath} must merge dev bootstrap SDKWORK_ACCESS_TOKEN before spawning IAM PC renderers`,
    );
  });
}

for (const packageEntry of STANDALONE_IAM_PC_RENDERER_PACKAGES) {
  test(`${packageEntry.repo}/${packageEntry.relativePath} dev script uses shared PC renderer bootstrap runner`, () => {
    const packageJsonPath = path.join(sdkworkSpaceRoot, packageEntry.repo, packageEntry.relativePath);
    assert.ok(fs.existsSync(packageJsonPath));
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const devScript = String(packageJson.scripts?.dev ?? '');
    assert.match(
      devScript,
      STANDALONE_PC_RENDERER_DEV_SCRIPT_PATTERN,
      `${packageEntry.repo}/${packageEntry.relativePath} dev script must call run-pc-renderer-dev-with-bootstrap.mjs`,
    );
  });
}

console.log('iam renderer dev bootstrap orchestration standard passed.');
