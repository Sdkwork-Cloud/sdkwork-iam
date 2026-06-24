import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";
import { validateDatabaseFramework } from "../../../../sdkwork-specs/tools/check-database-framework-standard.mjs";

const iamRoot = path.resolve(import.meta.dirname, "../../..");

function readText(relativePath) {
  return fs.readFileSync(path.join(iamRoot, relativePath), "utf8");
}

const REQUIRED_DB_SCRIPTS = [
  "db:validate",
  "db:plan",
  "db:init",
  "db:migrate",
  "db:seed",
  "db:status",
  "db:drift",
  "db:drift:check",
  "db:materialize:contract",
  "db:bootstrap",
];

test("IAM database module satisfies DATABASE_FRAMEWORK_SPEC layout and lifecycle scripts", () => {
  const result = validateDatabaseFramework(iamRoot);
  assert.equal(result.skipped, false, "sdkwork-iam must own database/");
  assert.equal(result.ok, true, result.failures.join("; "));
});

test("IAM workspace exposes governed database lifecycle entrypoints", () => {
  const packageJson = JSON.parse(readText("package.json"));
  for (const scriptName of REQUIRED_DB_SCRIPTS) {
    assert.ok(packageJson.scripts?.[scriptName], `package.json must define ${scriptName}`);
  }
  assert.equal(
    packageJson.scripts?.["check:database"],
    "node scripts/run-database-contract-check.mjs",
  );
  assert.equal(
    packageJson.scripts?.["test:contract:database"],
    "node --test tests/contract/database-framework.contract.test.mjs tests/contract/iam-database-contract-alignment.test.mjs",
  );
});

test("IAM database contract check runs framework validation and table alignment", async () => {
  const module = await import(
    pathToFileURL(path.join(iamRoot, "scripts/run-database-contract-check.mjs")).href
  );
  const plan = module.createDatabaseContractCheckPlan({ cwd: iamRoot });
  assert.equal(plan.length, 2);
  assert.match(plan[0].args.join(" "), /check-database-framework-standard\.mjs/u);
  assert.match(plan[1].args[0], /iam-database-contract-alignment\.test\.mjs/u);
});

test("IAM database host integrates sdkwork-database lifecycle orchestrator", () => {
  const rootCargo = readText("Cargo.toml");
  assert.match(rootCargo, /sdkwork_database_config/u);
  assert.match(rootCargo, /sdkwork_database_sqlx/u);
  assert.match(rootCargo, /sdkwork_database_lifecycle/u);
  assert.match(rootCargo, /sdkwork_database_spi/u);

  const databaseHostCargo = readText("crates/sdkwork-iam-database-host/Cargo.toml");
  assert.match(databaseHostCargo, /sdkwork_database_lifecycle/u);
  assert.match(databaseHostCargo, /sdkwork_database_spi/u);

  const databaseHostLib = readText("crates/sdkwork-iam-database-host/src/lib.rs");
  assert.match(databaseHostLib, /bootstrap_iam_database_from_env/u);
  assert.match(databaseHostLib, /LifecycleOrchestrator/u);
  assert.match(databaseHostLib, /\.init\(\)/u);
  assert.match(databaseHostLib, /\.migrate\(\)/u);
  assert.match(databaseHostLib, /SDKWORK_IAM_APP_ROOT/u);

  const databaseHostBin = readText("crates/sdkwork-iam-database-host/src/bin/sdkwork-iam-db.rs");
  assert.match(databaseHostBin, /Commands::Init/u);
  assert.match(databaseHostBin, /Commands::Bootstrap/u);
  assert.match(databaseHostBin, /apply_unified_claw_postgres_env/u);
  assert.doesNotMatch(databaseHostBin, /SDKWork Appbase IAM database/u);
});

test("IAM database host loads unified postgres profile before pool creation", () => {
  const databaseHostLib = readText("crates/sdkwork-iam-database-host/src/lib.rs");
  assert.match(databaseHostLib, /apply_unified_claw_postgres_env\(&app_root\)/u);
  assert.ok(
    fs.existsSync(
      path.join(iamRoot, "crates/sdkwork-iam-database-host/src/unified_postgres_env.rs"),
    ),
  );
});

test("IAM database README documents init and bootstrap lifecycle commands", () => {
  const readme = readText("database/README.md");
  for (const command of ["pnpm run db:init", "pnpm run db:bootstrap", "pnpm run check:database"]) {
    assert.match(readme, new RegExp(command.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "u"));
  }
  assert.match(readme, /sdkwork-iam-database-host/u);
});

test("IAM database contract declares sdkwork-iam ownership", () => {
  const manifest = JSON.parse(readText("database/database.manifest.json"));
  const prefixRegistry = JSON.parse(readText("database/contract/prefix-registry.json"));
  const schemaYaml = readText("database/contract/schema.yaml");

  assert.equal(manifest.owner, "sdkwork-iam");
  assert.equal(manifest.spi?.provider, "sdkwork-iam");
  assert.doesNotMatch(JSON.stringify(manifest), /appbase-platform|appbase-iam/u);
  assert.ok(prefixRegistry.prefixes.every((entry) => entry.owner === "sdkwork-iam"));
  assert.match(schemaYaml, /owner_team: sdkwork-iam/u);
  assert.doesNotMatch(schemaYaml, /appbase-platform|appbase-iam/u);
});

test("operational seed profile loads IAM subject and application bootstrap data", () => {
  const seedManifest = JSON.parse(readText("database/seeds/seed.manifest.json"));
  assert.deepEqual(seedManifest.profiles.operational.common, [
    "002_default_iam_subject.sql",
    "003_iam_application_bootstrap_seed.sql",
  ]);
  assert.deepEqual(seedManifest.profiles.operational.locales["zh-CN"], [
    "001_iam_locale_display.sql",
  ]);
});

test("IAM component spec declares DATABASE_FRAMEWORK_SPEC and database verification", () => {
  const componentSpec = JSON.parse(readText("specs/component.spec.json"));
  const canonicalFiles = (componentSpec.canonicalSpecs ?? []).map((entry) => entry.file);
  assert.ok(canonicalFiles.includes("DATABASE_FRAMEWORK_SPEC.md"));
  assert.match(componentSpec.integration?.database ?? "", /sdkwork-iam-database-host/u);
  assert.ok((componentSpec.verification?.commands ?? []).includes("pnpm run check:database"));
});
