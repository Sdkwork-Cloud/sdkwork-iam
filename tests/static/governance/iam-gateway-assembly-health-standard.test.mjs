import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const root = process.cwd();
const BOOTSTRAP_PATH = path.join(
  root,
  'crates/sdkwork-iam-gateway-assembly/src/bootstrap.rs',
);

test('IAM gateway assembly mounts infrastructure once via sdkwork-web-bootstrap', () => {
  const bootstrap = fs.readFileSync(BOOTSTRAP_PATH, 'utf8');
  assert.match(
    bootstrap,
    /assemble_multi_surface_router\s*\(/u,
    'bootstrap must use assemble_multi_surface_router per HEALTH_CHECK_SPEC.md',
  );
  assert.match(
    bootstrap,
    /PgPoolReadinessCheck|SqliteReadinessCheck/u,
    'bootstrap must wire SQLx readiness when IAM database is configured',
  );
  assert.match(
    bootstrap,
    /with_always_ready\(\)/u,
    'bootstrap must retain always-ready fallback when database env is absent',
  );
  assert.doesNotMatch(
    bootstrap,
    /router\s*=\s*router\s*\.merge\s*\(\s*sdkwork_routes_iam_app_api::gateway_mount/u,
    'bootstrap must not hand-merge surfaces without infra assembly',
  );
});

test('IAM gateway assembly depends on sdkwork-web-bootstrap and database host', () => {
  const cargoToml = fs.readFileSync(
    path.join(root, 'crates/sdkwork-iam-gateway-assembly/Cargo.toml'),
    'utf8',
  );
  assert.match(
    cargoToml,
    /sdkwork_web_bootstrap\s*=\s*\{\s*workspace\s*=\s*true,\s*features\s*=\s*\["sqlx"\]\s*\}/u,
  );
  assert.match(cargoToml, /sdkwork_iam_database_host\s*=\s*\{\s*workspace\s*=\s*true\s*\}/u);
});
