import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const root = process.cwd();
const REPAIR_PATH = path.join(
  root,
  'crates/sdkwork-iam-bootstrap/src/legacy_subject_repair.rs',
);

test('legacy opaque IAM user id repair updates directory assignment foreign keys', () => {
  const source = fs.readFileSync(REPAIR_PATH, 'utf8');

  for (const table of ['iam_department_assignment', 'iam_position_assignment']) {
    assert.match(
      source,
      new RegExp(`UPDATE ${table} SET user_id`, 'u'),
      `legacy subject repair must rewrite ${table}.user_id when migrating iamu_* ids`,
    );
  }

  assert.match(
    source,
    /repair_postgres_legacy_opaque_iam_user_ids/u,
    'postgres repair entrypoint must remain exported for router bootstrap',
  );
  assert.match(
    source,
    /repair_sqlite_legacy_opaque_iam_user_ids/u,
    'sqlite repair entrypoint must remain exported for embedded runtimes',
  );
});

test('app-api state invokes legacy subject repair during database bootstrap', () => {
  const state = fs.readFileSync(
    path.join(root, 'crates/sdkwork-routes-iam-app-api/src/state.rs'),
    'utf8',
  );
  assert.match(
    state,
    /repair_postgres_legacy_opaque_iam_user_ids/u,
    'local IAM router bootstrap must repair legacy opaque user ids on startup',
  );
});
