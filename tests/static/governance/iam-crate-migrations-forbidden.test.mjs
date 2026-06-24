import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const root = process.cwd();
const crateMigrationsDir = path.join(
  root,
  'crates/sdkwork-iam-directory-repository-sqlx/migrations',
);

test('crate-local IAM migrations directory must not exist on disk', () => {
  assert.equal(
    fs.existsSync(crateMigrationsDir),
    false,
    'database/ owns IAM lifecycle SQL; crate-local migrations must not return',
  );
});

test('git index must not track crate-local IAM migration SQL', () => {
  let tracked = '';
  try {
    tracked = execSync(
      'git ls-files crates/sdkwork-iam-directory-repository-sqlx/migrations',
      { cwd: root, encoding: 'utf8' },
    ).trim();
  } catch {
    assert.fail('git ls-files must succeed in the appbase repository');
  }

  assert.equal(
    tracked,
    '',
    'remove crate-local IAM migrations from git history with git rm and commit the deletion',
  );
});
