#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const databaseRoot = path.join(root, 'database');
const manifestPath = path.join(databaseRoot, 'database.manifest.json');
const IAM_DATABASE_OWNER = 'sdkwork-iam';
const IAM_DATABASE_SPI_PROVIDER = 'sdkwork-iam';
const L2_CONTRACT_VERSION = '1.0.0';

function listSqlFiles(directory) {
  if (!fs.existsSync(directory)) {
    return [];
  }
  return fs
    .readdirSync(directory)
    .filter((entry) => entry.endsWith('.sql'))
    .sort()
    .map((entry) => path.join(directory, entry));
}

function listMigrationUpFiles(engine) {
  const migrationDir = path.join(databaseRoot, 'migrations', engine);
  if (!fs.existsSync(migrationDir)) {
    return [];
  }
  return fs
    .readdirSync(migrationDir)
    .filter((entry) => entry.endsWith('.up.sql'))
    .sort()
    .map((entry) => path.join(migrationDir, entry));
}

function extractCreateTableNames(sql) {
  return [...sql.matchAll(/CREATE TABLE IF NOT EXISTS ([a-z0-9_]+)/gi)].map((match) => match[1]);
}

function collectAuthoritativeTableNames(engine = 'postgres') {
  const orderedSources = [
    ...listSqlFiles(path.join(databaseRoot, 'ddl/baseline', engine)),
    ...listMigrationUpFiles(engine),
  ];

  const tableNames = [];
  const seen = new Set();
  for (const sourcePath of orderedSources) {
    const sql = fs.readFileSync(sourcePath, 'utf8');
    for (const tableName of extractCreateTableNames(sql)) {
      if (seen.has(tableName)) {
        continue;
      }
      seen.add(tableName);
      tableNames.push(tableName);
    }
  }

  return tableNames.sort((left, right) => left.localeCompare(right));
}

function readIamTablesFromRustCatalog() {
  const libPath = path.join(
    root,
    'crates/sdkwork-iam-directory-repository-sqlx/src/lib.rs',
  );
  const source = fs.readFileSync(libPath, 'utf8');
  return [...source.matchAll(/pub const [A-Z0-9_]+: &'static str = "(iam_[a-z0-9_]+)";/g)]
    .map((match) => match[1])
    .sort((left, right) => left.localeCompare(right));
}

const tableNames = collectAuthoritativeTableNames('postgres');
const rustTables = readIamTablesFromRustCatalog();

const missingFromContract = rustTables.filter((table) => !tableNames.includes(table));
const extraInContract = tableNames.filter((table) => !rustTables.includes(table));
if (missingFromContract.length > 0 || extraInContract.length > 0) {
  const details = [];
  if (missingFromContract.length > 0) {
    details.push(`DDL missing Rust catalog tables: ${missingFromContract.join(', ')}`);
  }
  if (extraInContract.length > 0) {
    details.push(`DDL defines tables absent from IamTables: ${extraInContract.join(', ')}`);
  }
  throw new Error(`IAM database contract alignment failed:\n- ${details.join('\n- ')}`);
}

const tableRegistry = {
  schemaVersion: 1,
  kind: 'sdkwork.database.table-registry',
  tables: tableNames.map((table_name) => ({
    table_name,
    owner: IAM_DATABASE_OWNER,
    compliance_level: 'L2',
    lifecycle_status: 'active',
  })),
};

const prefixRegistry = {
  schemaVersion: 1,
  kind: 'sdkwork.database.prefix-registry',
  prefixes: [{ prefix: 'iam_', owner: IAM_DATABASE_OWNER, domain: 'iam' }],
};

const schemaYaml = [
  'schema_version: 1',
  'kind: sdkwork.database.schema',
  'module_id: iam',
  `contract_version: ${L2_CONTRACT_VERSION}`,
  `owner_team: ${IAM_DATABASE_OWNER}`,
  'compliance_level: L2',
  'engines:',
  '  - postgres',
  'table_prefix: iam_',
  'tables:',
  ...tableNames.map(
    (name) => `  - name: ${name}\n    lifecycle_status: active\n    owner: ${IAM_DATABASE_OWNER}`,
  ),
  '',
].join('\n');

fs.writeFileSync(
  path.join(databaseRoot, 'contract/table-registry.json'),
  `${JSON.stringify(tableRegistry, null, 2)}\n`,
);
fs.writeFileSync(
  path.join(databaseRoot, 'contract/prefix-registry.json'),
  `${JSON.stringify(prefixRegistry, null, 2)}\n`,
);
fs.writeFileSync(path.join(databaseRoot, 'contract/schema.yaml'), schemaYaml);

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
manifest.contractVersion = L2_CONTRACT_VERSION;
manifest.owner = IAM_DATABASE_OWNER;
manifest.lifecycle.autoMigrate = true;
manifest.spi = {
  ...(manifest.spi ?? {}),
  provider: IAM_DATABASE_SPI_PROVIDER,
};
fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

process.stdout.write(
  `materialized ${tableNames.length} IAM tables into database/contract (baseline + migrations, verified against IamTables)\n`,
);
