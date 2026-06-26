import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(__dirname, "../../..");

test("iam module federation registry config lists bundled modules", async () => {
  const configPath = path.join(appRoot, "iam/registry/iam-registry.config.json");
  const config = JSON.parse(await readFile(configPath, "utf8"));
  assert.equal(config.kind, "sdkwork.iam.registry.config");
  assert.ok(config.enabledModules.includes("iam-kernel"));
  assert.ok(config.enabledModules.includes("commerce"));
});

test("iam kernel manifest owns only iam-domain permissions", async () => {
  const manifestPath = path.join(
    appRoot,
    "iam/modules/iam-kernel/iam.module.manifest.json",
  );
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  for (const permission of manifest.permissions.catalog) {
    if (permission.code === "*") {
      continue;
    }
    const domain = permission.code.includes(":")
      ? permission.code.split(":")[0]
      : permission.code.split(".")[0];
    assert.equal(domain, "iam", `unexpected non-iam permission in kernel: ${permission.code}`);
  }
});

test("package scripts expose iam module federation validators", async () => {
  const packageJson = JSON.parse(
    await readFile(path.join(appRoot, "package.json"), "utf8"),
  );
  assert.ok(packageJson.scripts["admin:iam-modules:validate"]);
  assert.ok(packageJson.scripts["admin:iam-modules:reconcile"]);
  assert.ok(packageJson.scripts["admin:iam-modules:materialize:manifests"]);
});

test("iam kernel manifest declares finance/auditor role exclusion", async () => {
  const manifestPath = path.join(
    appRoot,
    "iam/modules/iam-kernel/iam.module.manifest.json",
  );
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  const exclusions = manifest.roles?.roleExclusions ?? [];
  assert.ok(
    exclusions.some(
      (rule) =>
        rule.roleCode === "org_finance" &&
        rule.excludesRoleCode === "org_auditor",
    ),
    "expected org_finance excludes org_auditor SoD rule",
  );
});

test("optional iot module manifest is present for cross-app federation", async () => {
  const manifestPath = path.join(appRoot, "iam/modules/iot/iam.module.manifest.json");
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  assert.equal(manifest.moduleId, "iot");
  assert.equal(manifest.domain, "iot");
  assert.ok(manifest.permissions.catalog.length >= 20);
});

test("rbac scope resolver matches group and service-account principals", async () => {
  const rbacPath = path.join(
    appRoot,
    "crates/sdkwork-iam-bootstrap/src/rbac_scope.rs",
  );
  const source = await readFile(rbacPath, "utf8");
  assert.match(source, /principal_kind = 'group'/);
  assert.match(source, /principal_kind = 'service_account'/);
});

test("backend role binding enforces assigner permission_scope coverage", async () => {
  const managementPath = path.join(
    appRoot,
    "crates/sdkwork-routes-iam-backend-api/src/management.rs",
  );
  const source = await readFile(managementPath, "utf8");
  assert.match(source, /ensure_role_grant_within_assigner_scope/);
  assert.match(source, /iam_role_binding_assigner_scope_exceeded/);
});

test("backend exposes group and service account directory routes", async () => {
  const manifestPath = path.join(
    appRoot,
    "crates/sdkwork-routes-iam-backend-api/src/manifest.rs",
  );
  const source = await readFile(manifestPath, "utf8");
  assert.match(source, /\/backend\/v3\/api\/iam\/groups/);
  assert.match(source, /\/backend\/v3\/api\/iam\/service_accounts/);
  assert.match(source, /groups\.members\.list/);
});

test("iam kernel manifest declares group and service account permissions", async () => {
  const manifestPath = path.join(
    appRoot,
    "iam/modules/iam-kernel/iam.module.manifest.json",
  );
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  const codes = new Set(
    (manifest.permissions?.catalog ?? []).map((entry) => entry.code),
  );
  for (const code of [
    "iam.groups.read",
    "iam.groups.create",
    "iam.group_members.read",
    "iam.service_accounts.read",
    "iam.service_accounts.create",
  ]) {
    assert.ok(codes.has(code), `missing kernel permission ${code}`);
  }
});

test("commerce module declares nested department templates", async () => {
  const manifestPath = path.join(
    appRoot,
    "iam/modules/commerce/iam.module.manifest.json",
  );
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  const finance = manifest.directory.departmentTemplates.find(
    (dept) => dept.ref === "dept.finance",
  );
  assert.ok(finance);
  assert.equal(finance.parentRef, "$deptref:dept.commerce");
});

test("app api directory provisioning uses canonical bootstrap subject", async () => {
  const directoryPath = path.join(
    appRoot,
    "crates/sdkwork-routes-iam-app-api/src/directory.rs",
  );
  const source = await readFile(directoryPath, "utf8");
  assert.match(source, /upsert_postgres_default_subject/);
  assert.match(source, /DEFAULT_IAM_TENANT_ID/);
  assert.match(source, /DEFAULT_IAM_TENANT_CODE/);
  assert.match(source, /DEFAULT_IAM_ORGANIZATION_CODE/);
  assert.doesNotMatch(source, /bind\("Default Tenant"\)/);
});

test("iam application bootstrap env resolver defaults to canonical tenant scope", async () => {
  const authPath = path.join(
    appRoot,
    "apps/sdkwork-iam-common/packages/sdkwork-iam-application-bootstrap/src/auth.ts",
  );
  const constantsPath = path.join(
    appRoot,
    "apps/sdkwork-iam-common/packages/sdkwork-iam-application-bootstrap/src/constants.ts",
  );
  const auth = await readFile(authPath, "utf8");
  const constants = await readFile(constantsPath, "utf8");
  assert.match(constants, /DEFAULT_IAM_TENANT_ID = "100001"/);
  assert.match(constants, /DEFAULT_IAM_ORGANIZATION_ID = "0"/);
  assert.match(auth, /DEFAULT_IAM_TENANT_ID/);
  assert.match(auth, /DEFAULT_IAM_ORGANIZATION_ID/);
});

test("user center local registration provisions canonical bootstrap tenant", async () => {
  const authorityPath = path.join(
    appRoot,
    "crates/sdkwork-user-center-tauri-host/src/user_center_authority.rs",
  );
  const source = await readFile(authorityPath, "utf8");
  assert.match(source, /CANONICAL_IAM_TENANT_ID: &str = "100001"/);
  assert.match(source, /CANONICAL_IAM_TENANT_CODE: &str = "SDKWORK"/);
  assert.match(source, /provision_canonical_bootstrap_tenant/);
  assert.doesNotMatch(source, /'Default Tenant'/);
});

test("default iam bootstrap subject constants are aligned across seed and registry", async () => {
  const constantsPath = path.join(
    appRoot,
    "crates/sdkwork-iam-module-registry/src/bootstrap_subject.rs",
  );
  const seedPath = path.join(
    appRoot,
    "database/seeds/common/002_default_iam_subject.sql",
  );
  const manifestPath = path.join(
    appRoot,
    "iam/modules/iam-kernel/iam.module.manifest.json",
  );
  const constants = await readFile(constantsPath, "utf8");
  const seed = await readFile(seedPath, "utf8");
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));

  assert.match(constants, /DEFAULT_IAM_TENANT_ID: &str = "100001"/);
  assert.match(constants, /DEFAULT_IAM_TENANT_CODE: &str = "SDKWORK"/);
  assert.match(constants, /DEFAULT_IAM_ORGANIZATION_ID: &str = "0"/);
  assert.match(seed, /'100001', 'SDKWORK'/);
  assert.match(seed, /'0',\s*\n\s*'100001'/);
  assert.equal(manifest.directory.organizationTemplates[0].seedId, "0");
});

test("operational zh-CN locale seed is declared and present", async () => {
  const seedManifest = JSON.parse(
    await readFile(path.join(appRoot, "database/seeds/seed.manifest.json"), "utf8"),
  );
  const scripts =
    seedManifest.profiles.operational.locales["zh-CN"] ?? [];
  assert.ok(
    scripts.includes("001_iam_locale_display.sql"),
    "expected zh-CN locale overlay script basename per DATABASE_FRAMEWORK_SPEC",
  );
  await readFile(
    path.join(
      appRoot,
      "database/seeds/locales/zh-CN/001_iam_locale_display.sql",
    ),
    "utf8",
  );
});

test("backend role permission grant blocks retired permissions and assigner overflow", async () => {
  const crudPath = path.join(
    appRoot,
    "crates/sdkwork-routes-iam-backend-api/src/directory_crud.impl.rs",
  );
  const source = await readFile(crudPath, "utf8");
  assert.match(source, /iam_permission_retired/);
  assert.match(source, /ensure_permission_grant_within_assigner_scope/);
});
