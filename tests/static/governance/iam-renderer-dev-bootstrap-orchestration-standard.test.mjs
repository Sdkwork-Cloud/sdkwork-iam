import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const workspaceRoot = path.resolve(import.meta.dirname, '../../..');
const sdkworkSpaceRoot = path.resolve(workspaceRoot, '..');

const BOOTSTRAP_ORCHESTRATION_PATTERNS = [
  /mergeRepoBootstrapAccessTokenEnv/u,
  /mergeRepoDevBootstrapAccessTokenEnv/u,
  /mergeBootstrapAccessTokenEnvFromManifest/u,
  /mergeSdkworkImBootstrapAccessTokenEnv/u,
  /ensureClawRouterBrowserDevelopmentEnv/u,
];

const STANDALONE_RENDERER_DEV_SCRIPT_PATTERN =
  /run-(?:pc-)?renderer-dev-with-bootstrap\.mjs/u;

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
  const runnerPath = path.join(workspaceRoot, 'scripts/dev/run-renderer-dev-with-bootstrap.mjs');
  const compatibilityRunnerPath = path.join(
    workspaceRoot,
    'scripts/dev/run-pc-renderer-dev-with-bootstrap.mjs',
  );
  const source = fs.readFileSync(helperPath, 'utf8');
  assert.ok(fs.existsSync(runnerPath));
  assert.ok(fs.existsSync(compatibilityRunnerPath));
  assert.match(source, /mergeRepoDevBootstrapAccessTokenEnv/u);
  assert.match(source, /resolveRepoApplicationManifestPath/u);
});

test('BirdCoder delegates renderer bootstrap to sdkwork-app topology application roots', () => {
  const repoRoot = path.join(sdkworkSpaceRoot, 'sdkwork-birdcoder');
  const packageJson = JSON.parse(fs.readFileSync(path.join(repoRoot, 'package.json'), 'utf8'));
  const topology = JSON.parse(
    fs.readFileSync(path.join(repoRoot, 'specs/topology.spec.json'), 'utf8'),
  );
  assert.match(packageJson.scripts['dev:standalone'], /sdkwork-app dev/u);

  const clients = topology.orchestration.profiles['standalone.development'].processes
    .filter((processEntry) => processEntry.role === 'client');
  for (const applicationRoot of [
    'apps/sdkwork-birdcoder-pc',
    'apps/sdkwork-birdcoder-h5',
    'apps/sdkwork-birdcoder-flutter-mobile',
  ]) {
    assert.ok(
      clients.some((processEntry) => processEntry.applicationRoot === applicationRoot),
      `BirdCoder topology must bind renderer bootstrap to ${applicationRoot}`,
    );
  }
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
      STANDALONE_RENDERER_DEV_SCRIPT_PATTERN,
      `${packageEntry.repo}/${packageEntry.relativePath} dev script must call the shared renderer bootstrap runner`,
    );
  });
}

console.log('iam renderer dev bootstrap orchestration standard passed.');
