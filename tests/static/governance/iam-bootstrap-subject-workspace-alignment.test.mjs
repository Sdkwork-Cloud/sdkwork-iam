import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(__dirname, "../../..");
const workspaceRoot = path.resolve(appRoot, "..");

const CANONICAL = {
  tenantId: "100001",
  tenantCode: "SDKWORK",
  organizationId: "0",
  organizationCode: "root",
};

const DOMAIN_SEED_FIXTURES = [
  {
    repo: "sdkwork-appstore",
    file: "database/seeds/common/002_default_publisher.sql",
    patterns: [/'100001'/],
  },
  {
    repo: "sdkwork-course",
    file: "database/seeds/common/002_default_category.sql",
    patterns: [/'100001'/],
  },
  {
    repo: "sdkwork-forum",
    file: "database/seeds/common/001_forum_bootstrap.sql",
    patterns: [/100001, 0,/],
  },
  {
    repo: "sdkwork-iam",
    file: "database/seeds/common/002_default_iam_subject.sql",
    patterns: [/'100001', 'SDKWORK'/, /'0',\s*\n\s*'100001'/],
  },
];

const APP_MANIFEST_FIXTURES = [
  "sdkwork-llm/sdkwork.app.config.json",
  "sdkwork-memory/sdkwork.app.config.json",
  "sdkwork-knowledgebase/sdkwork.app.config.json",
];

const FORBIDDEN_DOMAIN_SEED_PATTERNS = [
  /tenant_id\s*=\s*'10'/,
  /organization_id\s*=\s*'20'/,
  /'10',\s*'20'/,
  /tenantId"\s*:\s*20001/,
  /"tenantId":\s*"20001"/,
];

for (const fixture of DOMAIN_SEED_FIXTURES) {
  test(`domain seed ${fixture.repo}/${path.basename(fixture.file)} uses canonical tenant scope`, async () => {
    const seedPath = path.join(workspaceRoot, fixture.repo, fixture.file);
    const seed = await readFile(seedPath, "utf8");
    for (const pattern of fixture.patterns) {
      assert.match(seed, pattern, `missing ${pattern} in ${fixture.file}`);
    }
    for (const forbidden of FORBIDDEN_DOMAIN_SEED_PATTERNS) {
      assert.doesNotMatch(
        seed,
        forbidden,
        `forbidden legacy bootstrap id in ${fixture.file}`,
      );
    }
  });
}

for (const manifestRelative of APP_MANIFEST_FIXTURES) {
  test(`app manifest ${manifestRelative} declares canonical backend tenant scope`, async () => {
    const manifestPath = path.join(workspaceRoot, manifestRelative);
    const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
    assert.equal(manifest.backend.tenantId, CANONICAL.tenantId);
    assert.equal(manifest.backend.organizationId, CANONICAL.organizationId);
  });
}

test("commerce membership seed uses canonical tenant scope", async () => {
  const seedPath = path.join(
    workspaceRoot,
    "sdkwork-membership/crates/sdkwork-membership-repository-sqlx/src/seed.rs",
  );
  const seed = await readFile(seedPath, "utf8");
  assert.match(seed, /'100001',\s*'0'/);
  assert.match(seed, /tenant_id = '100001'/);
  assert.doesNotMatch(seed, /tenant_id = '0'/);
});

test("claw router composed app registry uses canonical tenant id", async () => {
  const appsPath = path.join(
    workspaceRoot,
    "sdkwork-clawrouter/data/app/sdkwork-apps.json",
  );
  const apps = JSON.parse(await readFile(appsPath, "utf8"));
  for (const entry of apps.apps ?? []) {
    assert.equal(
      entry.tenantId,
      Number(CANONICAL.tenantId),
      `unexpected tenantId for app ${entry.key ?? entry.appKey ?? "unknown"}`,
    );
  }
});

test("bootstrap profile docs declare canonical tenant id", async () => {
  const planPath = path.join(
    workspaceRoot,
    "configs/bootstrap/IAM_SUBJECT_INITIALIZATION_PLAN.md",
  );
  const devEnvPath = path.join(
    workspaceRoot,
    "configs/bootstrap/profiles/dev.env",
  );
  const plan = await readFile(planPath, "utf8");
  const devEnv = await readFile(devEnvPath, "utf8");
  assert.match(plan, /Tenant \| `100001` \| `SDKWORK`/);
  assert.match(devEnv, /SDKWORK_TENANT_ID=100001/);
});

test("iam database baseline declares code columns with unique constraints", async () => {
  const baselinePath = path.join(
    appRoot,
    "database/ddl/baseline/postgres/0001_iam_baseline.sql",
  );
  const baseline = await readFile(baselinePath, "utf8");
  assert.match(baseline, /CREATE TABLE IF NOT EXISTS iam_tenant[\s\S]*code TEXT NOT NULL UNIQUE/);
  assert.match(
    baseline,
    /CREATE TABLE IF NOT EXISTS iam_organization[\s\S]*code TEXT NOT NULL[\s\S]*UNIQUE \(tenant_id, code\)/,
  );
});

test("iam bootstrap constants stay aligned across rust registry, sql seed, and ts resolver", async () => {
  const constantsRs = await readFile(
    path.join(appRoot, "crates/sdkwork-iam-module-registry/src/bootstrap_subject.rs"),
    "utf8",
  );
  const constantsTs = await readFile(
    path.join(
      appRoot,
      "apps/sdkwork-iam-common/packages/sdkwork-iam-application-bootstrap/src/constants.ts",
    ),
    "utf8",
  );
  const seedSql = await readFile(
    path.join(appRoot, "database/seeds/common/002_default_iam_subject.sql"),
    "utf8",
  );
  assert.match(constantsRs, /DEFAULT_IAM_TENANT_CODE: &str = "SDKWORK"/);
  assert.match(constantsTs, /DEFAULT_IAM_TENANT_CODE = "SDKWORK"/);
  assert.match(seedSql, /'100001', 'SDKWORK'/);
  assert.match(constantsRs, /DEFAULT_IAM_ORGANIZATION_CODE: &str = "root"/);
  assert.match(seedSql, /'root'/);
});

test("iam kernel manifest seeds root organization with canonical seedId", async () => {
  const manifest = JSON.parse(
    await readFile(
      path.join(appRoot, "iam/modules/iam-kernel/iam.module.manifest.json"),
      "utf8",
    ),
  );
  assert.equal(manifest.directory.organizationTemplates[0].seedId, "0");
  assert.equal(manifest.directory.organizationTemplates[0].code, "root");
});

test("zh-CN locale overlay targets canonical tenant and root organization codes", async () => {
  const localeSeed = await readFile(
    path.join(appRoot, "database/seeds/locales/zh-CN/001_iam_locale_display.sql"),
    "utf8",
  );
  assert.match(localeSeed, /WHERE id = '100001'/);
  assert.match(localeSeed, /WHERE tenant_id = '100001' AND code = 'root'/);
});

test("sdkwork-aiot app manifest declares canonical backend tenant scope", async () => {
  const manifest = JSON.parse(
    await readFile(
      path.join(workspaceRoot, "sdkwork-aiot/sdkwork.app.config.json"),
      "utf8",
    ),
  );
  assert.equal(manifest.backend.tenantId, CANONICAL.tenantId);
  assert.equal(manifest.backend.organizationId, CANONICAL.organizationId);
});

test("iam authorization policy accepts root organization id zero for backend api", async () => {
  const policyPath = path.join(
    appRoot,
    "crates/sdkwork-iam-web-adapter/src/authorization_policy.rs",
  );
  const source = await readFile(policyPath, "utf8");
  assert.doesNotMatch(
    source,
    /organization_id\(\)\s*[\s\S]*value == "0"/,
    "backend api must not treat organization id 0 as absent",
  );
});

test("API_SPEC token claims example uses canonical tenant and root organization", async () => {
  const apiSpecPath = path.join(workspaceRoot, "sdkwork-specs/API_SPEC.md");
  const apiSpec = await readFile(apiSpecPath, "utf8");
  assert.match(apiSpec, /"tenant_id": "100001"/);
  assert.match(apiSpec, /"organization_id": "0"/);
  assert.match(apiSpec, /"login_scope": "TENANT"/);
  assert.doesNotMatch(apiSpec, /"tenant_id": "10001"/);
  assert.doesNotMatch(apiSpec, /"organization_id": "20001"/);
});

test("EVENT_SPEC envelope example uses canonical tenant and root organization", async () => {
  const eventSpecPath = path.join(workspaceRoot, "sdkwork-specs/EVENT_SPEC.md");
  const eventSpec = await readFile(eventSpecPath, "utf8");
  assert.match(eventSpec, /"tenantId": "100001"/);
  assert.match(eventSpec, /"organizationId": "0"/);
  assert.doesNotMatch(eventSpec, /"tenantId": "10001"/);
});

test("DATABASE_SPEC request context example uses canonical tenant and root organization", async () => {
  const databaseSpecPath = path.join(workspaceRoot, "sdkwork-specs/DATABASE_SPEC.md");
  const databaseSpec = await readFile(databaseSpecPath, "utf8");
  assert.match(databaseSpec, /"tenant_id": "100001"/);
  assert.match(databaseSpec, /"organization_id": "0"/);
  assert.doesNotMatch(databaseSpec, /"tenant_id": "1",\s*\n\s*"organization_id": "10"/);
});

test("claw web bridge maps canonical tenant id from web request context", async () => {
  const source = await readFile(
    path.join(
      workspaceRoot,
      "sdkwork-clawrouter/crates/sdkwork-claw-http/src/web_bridge.rs",
    ),
    "utf8",
  );
  assert.match(source, /\.tenant_id\("100001"\)/);
  assert.doesNotMatch(source, /assert_eq!\(20_001, subject\.tenant_id\)/);
});

test("all workspace app manifests with backend section declare canonical tenant scope", async () => {
  const { readdir, readFile: readFileFs } = await import("node:fs/promises");
  const skipDirs = new Set(["node_modules", "dist", ".git", "target"]);
  const violations = [];

  async function walk(dir) {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (skipDirs.has(entry.name)) continue;
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await walk(fullPath);
        continue;
      }
      if (entry.name !== "sdkwork.app.config.json") continue;
      const raw = await readFileFs(fullPath, "utf8");
      const manifest = JSON.parse(raw);
      if (!manifest.backend) continue;
      const backend = manifest.backend;
      const isIamBootstrapBackend =
        backend.profileKey != null ||
        backend.tenantId != null ||
        backend.organizationId != null ||
        backend.accessTokenPermissionScope != null;
      if (!isIamBootstrapBackend) continue;
      const tenantId = backend.tenantId;
      const organizationId = backend.organizationId;
      if (
        tenantId !== CANONICAL.tenantId ||
        organizationId !== CANONICAL.organizationId
      ) {
        violations.push({
          path: fullPath.replace(/\\/g, "/"),
          tenantId,
          organizationId,
        });
      }
    }
  }

  await walk(workspaceRoot);
  assert.deepEqual(violations, []);
});
