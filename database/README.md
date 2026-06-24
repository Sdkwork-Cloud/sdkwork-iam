# IAM Database Module

Canonical lifecycle assets for `sdkwork-appbase` per `DATABASE_FRAMEWORK_SPEC.md`.

- moduleId: `iam`
- serviceCode: `IAM`
- tablePrefix: `iam_`
- contract tables: **57** (see `contract/schema.yaml`)

## Commands

```bash
pnpm run check:database
pnpm run db:validate
pnpm run db:materialize:contract
pnpm run db:plan
pnpm run db:init
pnpm run db:migrate
pnpm run db:seed
pnpm run db:status
pnpm run db:drift:check
```

`check:database` and `db:validate` both run the L2 framework check plus the 57-table IAM contract alignment gate.

## Contract alignment

Authoritative table inventory lives in:

- `contract/schema.yaml`
- `contract/table-registry.json`
- `crates/sdkwork-iam-directory-repository-sqlx/src/lib.rs` (`IamTables`)

Regenerate contract registries from baseline + migrations after DDL changes:

```bash
pnpm run db:materialize:contract
```

The materialize step verifies `IamTables`, baseline DDL, versioned migrations, and contract registries all declare the same 57 tables.

## Migration status

Authoritative baseline: `ddl/baseline/postgres/0001_iam_baseline.sql`.

Versioned upgrades live in `migrations/postgres/0006` through `0010`.

- `0006`–`0007`: upgrade-only cleanup for pre-standard databases (`iam_application*`, `studio_*`). Fresh installs rely on baseline only.
- `0010`: adds runtime `app_id` / environment / deployment_mode columns to `iam_api_key`.

Author contract-first tables in `contract/schema.yaml`, then keep baseline, migrations, and `IamTables` aligned via `pnpm run db:materialize:contract`.

Crate-local SQL migrations were removed. IAM lifecycle SQL is owned exclusively by application-root `database/`.

## Application bootstrap tables

| Layer | Tables |
| --- | --- |
| Registered application template | `iam_application_template`, `iam_application_template_package` |
| Tenant runtime application | `iam_tenant_application` |

Seed profile `common/003_iam_application_bootstrap_seed.sql` provisions the platform template and default tenant application for tenant `100001`.

## Removed legacy tables

The following tables are explicitly dropped and must not return:

| Category | Tables |
| --- | --- |
| Legacy organization member | `iam_organization_member` |
| Legacy application model | `iam_application`, `iam_application_package` |
| Studio catalog debt | `studio_mcp_*`, `studio_prompt_*`, `studio_app_template_*`, `studio_catalog_*` |

## Runtime integration

- Bootstrap crate: `crates/sdkwork-iam-database-host`
- Entrypoints: `bootstrap_iam_database_from_env()` / `bootstrap_iam_database(pool)`
- Wired from: `sdkwork-router-iam-app-api`, `sdkwork-router-iam-backend-api`
- Contract materialization: `pnpm run db:materialize:contract`
- `database.manifest.json` sets `lifecycle.autoMigrate=true` so IAM keeps boot-time schema alignment through `LifecycleOrchestrator`
