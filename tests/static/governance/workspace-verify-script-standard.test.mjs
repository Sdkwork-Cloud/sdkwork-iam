import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const root = process.cwd();

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
}

test('package.json verify facade delegates to the shared lifecycle and its hook matches the root component spec', () => {
  const packageJson = readJson('package.json');
  const rootSpec = readJson('specs/component.spec.json');
  const verifyScript = packageJson.scripts.verify;
  const verifyHook = packageJson.scripts['_sdkwork:verify'];

  assert.equal(verifyScript, 'pnpm exec sdkwork-app verify');
  assert.equal(
    typeof verifyHook,
    'string',
    'package.json must declare scripts._sdkwork:verify for the shared lifecycle facade',
  );

  for (const command of rootSpec.verification.commands) {
    const step = command.replace(/^pnpm run /u, '');
    assert.ok(
      verifyHook.includes(step),
      `scripts._sdkwork:verify must include ${step} from specs/component.spec.json`,
    );
  }
});

test('root component spec documents the extended IAM and workspace test entrypoints', () => {
  const packageJson = readJson('package.json');
  const specsReadme = fs.readFileSync(path.join(root, 'specs/README.md'), 'utf8');

  for (const scriptName of [
    'test',
    'test:iam-standard-contracts',
    'test:iam-standard-governance',
    'test:user-center-standard-contracts',
    'test:workspace-vitest',
    'typecheck',
  ]) {
    assert.equal(
      typeof packageJson.scripts[scriptName],
      'string',
      `package.json must declare scripts.${scriptName}`,
    );
  }

  for (const command of readJson('specs/component.spec.json').verification.commands) {
    assert.ok(
      specsReadme.includes(command),
      `specs/README.md must document ${command}`,
    );
  }
});
