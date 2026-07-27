import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const root = process.cwd();
const GATEWAY_PATH = path.join(
  root,
  'crates/sdkwork-api-iam-standalone-gateway/src/lib.rs',
);

test('IAM standalone gateway mounts infrastructure once via sdkwork-web-bootstrap', () => {
  const gateway = fs.readFileSync(GATEWAY_PATH, 'utf8');
  assert.match(
    gateway,
    /service_router\s*\(/u,
    'standalone gateway must use sdkwork-web-bootstrap service_router per HEALTH_CHECK_SPEC.md',
  );
  assert.match(
    gateway,
    /with_readiness_check\(assembly\.readiness_check\)/u,
    'standalone gateway must wire the IAM database readiness capability',
  );
  assert.doesNotMatch(
    gateway,
    /router\s*=\s*router\s*\.merge\s*\(\s*sdkwork_routes_iam_app_api::gateway_mount/u,
    'standalone gateway must consume the host-neutral assembly instead of hand-merging route crates',
  );
});

test('IAM standalone gateway depends on sdkwork-web-bootstrap and the host-neutral assembly', () => {
  const gatewayCargoToml = fs.readFileSync(
    path.join(root, 'crates/sdkwork-api-iam-standalone-gateway/Cargo.toml'),
    'utf8',
  );
  assert.match(gatewayCargoToml, /sdkwork-web-bootstrap\.workspace\s*=\s*true/u);
  assert.match(gatewayCargoToml, /sdkwork-api-iam-assembly\.workspace\s*=\s*true/u);

  const assemblyCargoToml = fs.readFileSync(
    path.join(root, 'crates/sdkwork-api-iam-assembly/Cargo.toml'),
    'utf8',
  );
  assert.match(
    assemblyCargoToml,
    /sdkwork_web_bootstrap\s*=\s*\{\s*workspace\s*=\s*true,\s*features\s*=\s*\["sqlx"\]\s*\}/u,
  );
  assert.match(assemblyCargoToml, /sdkwork_iam_database_host\s*=\s*\{\s*workspace\s*=\s*true\s*\}/u);
});
