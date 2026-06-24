import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const root = process.cwd();

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
}

test('package.json verify script matches root component spec verification commands', () => {
  const packageJson = readJson('package.json');
  const rootSpec = readJson('specs/component.spec.json');
  const verifyScript = packageJson.scripts.verify;

  assert.equal(
    typeof verifyScript,
    'string',
    'package.json must declare scripts.verify',
  );

  for (const command of rootSpec.verification.commands) {
    const step = command.replace(/^pnpm run /u, '');
    assert.ok(
      verifyScript.includes(step),
      `scripts.verify must include ${step} from specs/component.spec.json`,
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
