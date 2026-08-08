#!/usr/bin/env node
// Compare every INSERT/UPDATE column referenced by the IAM backend oauth
// handlers against the baseline DDL, and report columns that the code writes
// but the DDL never declares (schema drift => masked 500s).

import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

const baselineFile = path.join(
  repoRoot,
  'database',
  'ddl',
  'baseline',
  'postgres',
  '0001_iam_baseline.sql',
);
const baseline = readFileSync(baselineFile, 'utf8');

// ---- 1. Parse baseline DDL: table -> columns ----
const tableColumns = new Map();
const tableRe = /CREATE TABLE IF NOT EXISTS (\w+) \(([\s\S]*?)\n\);/g;
for (const match of baseline.matchAll(tableRe)) {
  const [, tableName, body] = match;
  const columns = new Set();
  for (const line of body.split('\n')) {
    const colMatch = line.trim().match(/^([a-z_][a-z0-9_]*)\s/);
    if (colMatch && !line.trim().startsWith('CONSTRAINT')) {
      columns.add(colMatch[1]);
    }
  }
  tableColumns.set(tableName, columns);
}

// ---- 2. Collect migration-added columns ----
const migrationsDir = path.join(repoRoot, 'database', 'migrations', 'postgres');
for (const file of readdirSync(migrationsDir)) {
  if (!file.endsWith('.up.sql')) continue;
  const sql = readFileSync(path.join(migrationsDir, file), 'utf8');
  const alterRe = /ALTER TABLE (\w+)\s+ADD COLUMN IF NOT EXISTS (\w+)/g;
  for (const m of sql.matchAll(alterRe)) {
    const [, tableName, column] = m;
    if (!tableColumns.has(tableName)) tableColumns.set(tableName, new Set());
    tableColumns.get(tableName).add(column);
  }
}

// ---- 3. Extract columns written by backend code ----
const sourceDirs = [
  'crates/sdkwork-routes-iam-backend-api/src',
  'crates/sdkwork-routes-iam-app-api/src',
  'crates/sdkwork-iam-web-adapter/src',
];
const sourceFiles = [];
for (const dir of sourceDirs) {
  const abs = path.join(repoRoot, dir);
  for (const file of readdirSync(abs)) {
    if (file.endsWith('.rs')) sourceFiles.push(`${dir}/${file}`);
  }
}
const writtenByTable = new Map(); // table -> Set(column)

function addWritten(table, column) {
  if (!writtenByTable.has(table)) writtenByTable.set(table, new Set());
  writtenByTable.get(table).add(column);
}

for (const rel of sourceFiles) {
  const content = readFileSync(path.join(repoRoot, rel), 'utf8');
  // INSERT INTO table (col, col2, ...) VALUES
  const insertRe = /INSERT INTO (\w+)[\s\\]*\(([\s\S]*?)\)[\s\\]*(?:VALUES|SELECT)/g;
  for (const m of content.matchAll(insertRe)) {
    const [, table, colsBody] = m;
    for (const col of colsBody.split(',')) {
      const name = col.trim().replace(/\s+/g, ' ');
      if (/^[a-z_][a-z0-9_]*$/.test(name)) addWritten(table, name);
    }
  }
  // UPDATE table SET col = ..., col2 = ...
  const updateRe = /UPDATE (\w+)\s+SET ([\s\S]*?)(?:WHERE|RETURNING|;)/g;
  for (const m of content.matchAll(updateRe)) {
    const [, table, setBody] = m;
    for (const part of setBody.split(',')) {
      const colMatch = part.trim().match(/^([a-z_][a-z0-9_]*)\s*=/);
      if (colMatch) addWritten(table, colMatch[1]);
    }
  }
  // ALTER TABLE / dynamic format!("UPDATE {table} SET ...") — handled by
  // backend_sql.rs patch_tenant_row_tx assignments below via column lists.
}

// ---- 4. Patch assignment columns ----
// tenant_patch applies collect_patch_assignments (base fields) to every table
// with an oauth_patch_handler! macro endpoint, plus the resource-specific
// allowlist from collect_resource_patch_assignments.
const handlers = readFileSync(
  path.join(
    repoRoot,
    'crates/sdkwork-routes-iam-backend-api/src/oauth_handlers.impl.rs',
  ),
  'utf8',
);
const PATCH_TABLES = [
  'iam_oauth_integration',
  'iam_oauth_client',
  'iam_oauth_surface',
  'iam_oauth_flow_config',
  'iam_oauth_scope_profile',
  'iam_oauth_claim_mapping',
  'iam_oauth_policy',
  'iam_oauth_tenant_binding',
  'iam_oauth_operator_platform',
  'iam_oauth_resource_account',
  'iam_oauth_resource_authorization',
  'iam_oauth_webhook_config',
  'iam_oauth_operational_resource',
  'iam_oauth_account_link',
];
const baseFields = [
  'display_name',
  'status',
  'enabled',
  'health_status',
  'authorization_status',
  'verification_status',
];
const tableFieldMap = new Map();
// collect_resource_patch_assignments body (resource-specific fields only;
// base fields are authoritative from base_patch_columns below)
const funcBody = handlers.match(
  /fn collect_resource_patch_assignments[\s\S]*?async fn list_provider_catalog/,
)?.[0];
if (funcBody) {
  const armRe = /"iam_oauth_(\w+)" => &\[([\s\S]*?)\],\r?\n\s*(?="iam_oauth_\w+" =>|_ =>)/g;
  for (const m of funcBody.matchAll(armRe)) {
    const table = `iam_oauth_${m[1]}`;
    const fields = new Set();
    const colRe = /\(\s*"([a-z_]+)"/g;
    for (const c of m[2].matchAll(colRe)) fields.add(c[1]);
    tableFieldMap.set(table, fields);
  }
}
// base_patch_columns() per-table allowlist (authoritative)
const baseColumnsBody = handlers.match(
  /fn base_patch_columns[\s\S]*?async fn collect_patch_assignments|fn base_patch_columns[\s\S]*?\n\}/,
)?.[0];
if (baseColumnsBody) {
  const armRe = /"iam_oauth_(\w+)" => &\[([\s\S]*?)\],/g;
  for (const m of baseColumnsBody.matchAll(armRe)) {
    const table = `iam_oauth_${m[1]}`;
    const fields = new Set();
    const colRe = /\(\s*"([a-z_]+)"/g;
    for (const c of m[2].matchAll(colRe)) fields.add(c[1]);
    tableFieldMap.set(table, fields);
  }
}
for (const table of PATCH_TABLES) {
  const fields = tableFieldMap.get(table) ?? new Set(baseFields);
  tableFieldMap.set(table, fields);
}
for (const [table, fields] of tableFieldMap) {
  for (const f of fields) addWritten(table, f);
}

// ---- 5. Report drift ----
const drift = [];
for (const [table, written] of [...writtenByTable.entries()].sort()) {
  if (!tableColumns.has(table)) {
    drift.push({ table, columns: [...written], missing: 'TABLE NOT IN DDL' });
    continue;
  }
  const declared = tableColumns.get(table);
  const missing = [...written].filter((c) => !declared.has(c)).sort();
  if (missing.length > 0) {
    drift.push({ table, columns: missing, missing: 'MISSING COLUMNS' });
  }
}

if (process.env.DRIFT_VERBOSE) {
  console.log('\n== all written tables ==');
  for (const [table, written] of [...writtenByTable.entries()].sort()) {
    console.log(`${table}: ${[...written].sort().join(', ')}`);
  }
}

if (drift.length === 0) {
  console.log('OK: no column drift detected');
} else {
  for (const d of drift) {
    console.log(`\n[${d.missing}] ${d.table}`);
    for (const c of d.columns) console.log(`   - ${c}`);
  }
}
console.log(
  `\nchecked ${tableColumns.size} tables, ${writtenByTable.size} tables written by backend code`,
);
