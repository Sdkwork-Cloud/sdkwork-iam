import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const appbaseRoot = path.resolve(import.meta.dirname, "../../..");

const AUTH_PC_REACT_ROOT = path.join(
  appbaseRoot,
  "apps/sdkwork-iam-pc/packages/sdkwork-auth-pc-react",
);
const AUTH_RUNTIME_ROOT = path.join(
  appbaseRoot,
  "apps/sdkwork-iam-pc/packages/sdkwork-auth-runtime-pc-react",
);
const IAM_CORE_ROOT = path.join(
  appbaseRoot,
  "apps/sdkwork-iam-pc/packages/sdkwork-iam-core-pc-react",
);

const FORBIDDEN_IAM_CORE_VALUE_EXPORTS = [
  "createIamRuntime",
  "createIamSdkAdapters",
  "createIamAppSdkAdapter",
  "createIamBackendSdkAdapter",
  "createMemoryIamContextStore",
  "createMemoryIamTokenStore",
];

function readText(relativePath) {
  return fs.readFileSync(path.join(appbaseRoot, relativePath), "utf8");
}

function readComponentSpec(packageRoot) {
  return JSON.parse(
    fs.readFileSync(path.join(packageRoot, "specs/component.spec.json"), "utf8"),
  );
}

function listValueExportNames(sourceText) {
  const names = new Set();
  for (const match of sourceText.matchAll(/^export\s*\{([^}]+)\}/gm)) {
    for (const entry of match[1].split(",")) {
      const normalized = entry.trim();
      if (!normalized) {
        continue;
      }
      const aliasMatch = normalized.match(/^(\w+)\s+as\s+(\w+)$/);
      names.add(aliasMatch ? aliasMatch[2] : normalized.split(/\s+/)[0]);
    }
  }
  for (const match of sourceText.matchAll(/^export\s+(?:async\s+)?function\s+(\w+)/gm)) {
    names.add(match[1]);
  }
  for (const match of sourceText.matchAll(/^export\s+const\s+(\w+)/gm)) {
    names.add(match[1]);
  }
  return names;
}

test("auth-pc-react exposes AuthGate reference implementation required by IAM_LOGIN_INTEGRATION_SPEC", () => {
  const authGatePath = path.join(AUTH_PC_REACT_ROOT, "src/AuthGate.tsx");
  assert.ok(fs.existsSync(authGatePath), "AuthGate.tsx must exist in @sdkwork/auth-pc-react");

  const authGateSource = fs.readFileSync(authGatePath, "utf8");
  assert.match(authGateSource, /export function SdkworkAuthGate/);
  assert.match(authGateSource, /controller\.bootstrap\(/);
  assert.match(authGateSource, /resolveAuthAccess\(/);
  assert.match(authGateSource, /location\.pathname/);

  const indexSource = fs.readFileSync(path.join(AUTH_PC_REACT_ROOT, "src/index.ts"), "utf8");
  assert.match(indexSource, /AuthGate\.tsx/);

  const authGateTestPath = path.join(AUTH_PC_REACT_ROOT, "tests/auth-gate.test.tsx");
  assert.ok(fs.existsSync(authGateTestPath), "auth-gate.test.tsx must cover AuthGate behavior");
});

test("auth-runtime-pc-react documents and exposes approved PC auth runtime factory", () => {
  const runtimeIndex = fs.readFileSync(path.join(AUTH_RUNTIME_ROOT, "src/index.ts"), "utf8");
  assert.match(runtimeIndex, /appbasePcAuthRuntime\.ts/);

  const runtimeSource = fs.readFileSync(
    path.join(AUTH_RUNTIME_ROOT, "src/appbasePcAuthRuntime.ts"),
    "utf8",
  );
  assert.match(runtimeSource, /export function createSdkworkAppbasePcAuthRuntime/);
  assert.match(runtimeSource, /wrapCredentialEntryClient/);
  assert.match(runtimeSource, /credentialEntry\?\.skipWrap/);

  const readme = fs.readFileSync(path.join(AUTH_RUNTIME_ROOT, "README.md"), "utf8");
  assert.match(readme, /createSdkworkAppbasePcAuthRuntime/);
  assert.match(readme, /SdkworkAuthGate/);
});

test("iam-core-pc-react keeps low-level IAM runtime wiring out of public value exports", () => {
  const indexSource = fs.readFileSync(path.join(IAM_CORE_ROOT, "src/index.ts"), "utf8");
  const exportedNames = listValueExportNames(indexSource);
  const offenders = FORBIDDEN_IAM_CORE_VALUE_EXPORTS.filter((name) => exportedNames.has(name));
  assert.deepEqual(
    offenders,
    [],
    `@sdkwork/iam-core-pc-react must not value-export low-level runtime wiring: ${offenders.join(", ")}`,
  );
});

test("IAM auth packages declare IAM_LOGIN_INTEGRATION_SPEC in component specs", () => {
  for (const packageRoot of [AUTH_PC_REACT_ROOT, AUTH_RUNTIME_ROOT]) {
    const spec = readComponentSpec(packageRoot);
    const canonicalFiles = (spec.canonicalSpecs ?? []).map((entry) => entry.file);
    assert.ok(
      canonicalFiles.includes("IAM_LOGIN_INTEGRATION_SPEC.md"),
      `${path.basename(packageRoot)} must declare IAM_LOGIN_INTEGRATION_SPEC.md`,
    );
  }
});

test("root workspace keeps postgres integration profile template for IAM Rust tests", () => {
  assert.ok(
    fs.existsSync(path.join(appbaseRoot, ".env.postgres.example")),
    ".env.postgres.example must exist for unified PostgreSQL integration tests",
  );
  const example = readText(".env.postgres.example");
  assert.match(example, /SDKWORK_CLAW_DATABASE_ENGINE=postgresql/);
  assert.match(example, /SDKWORK_CLAW_DATABASE_HOST=/);
});
