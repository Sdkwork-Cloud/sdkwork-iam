# IAM Database Module

Canonical lifecycle assets for `sdkwork-iam` per `DATABASE_FRAMEWORK_SPEC.md`.

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
pnpm run db:bootstrap
```

`check:database` and `db:validate` both run the L2 framework check plus the 57-table IAM contract alignment gate.

## Initialization operations

All IAM table DDL and seed data are owned by `sdkwork-iam/database/` and executed through `sdkwork-iam-database-host`. `sdkwork-appbase` must not ship `database/` assets or IAM seed SQL.

### Governance and contract checks

| Command | Purpose |
| --- | --- |
| `pnpm run check:database` | L2 framework validation + 57-table IAM contract alignment |
| `pnpm run db:validate` | Same as `check:database` |
| `pnpm run db:materialize:contract` | Regenerate `contract/*` from baseline + migrations |

### Lifecycle CLI (`sdkwork-iam-db`)

| Command | Purpose |
| --- | --- |
| `pnpm run db:plan` | Show pending migrations, seed plan, and drift summary |
| `pnpm run db:init` | Create empty schema state, then apply pending migrations |
| `pnpm run db:migrate` | Apply versioned postgres migrations (`0006`–`0010`) |
| `pnpm run db:seed --` | Apply seed profile scripts for locale/profile |
| `pnpm run db:bootstrap --` | `init` + `migrate` + seed profile in one pass |
| `pnpm run db:status` | Report module/engine status and pending migrations |
| `pnpm run db:drift` | Emit drift analysis JSON |
| `pnpm run db:drift:check` | Fail on error-level drift |

Default seed profile: `operational` / locale `zh-CN` (`database.manifest.json`).

### Seed layers (`database/seeds/`)

| Asset | Profile | Purpose |
| --- | --- | --- |
| `common/001_bootstrap.sql` | none | Placeholder only |
| `common/002_default_iam_subject.sql` | `standard`, `operational` | Seed canonical tenant `100001` and root organization `0` |
| `common/003_iam_application_bootstrap_seed.sql` | `operational` | Seed platform application template and default tenant application |
| `locales/zh-CN/001_iam_locale_display.sql` | `operational` | Locale display overlays after catalog materialization |

### Runtime bootstrap hooks (`bootstrap_iam_database_from_env`)

After lifecycle `init` + optional `migrate`, the database host also runs:

1. OAuth provider catalog seed (`sdkwork-iam-web-adapter`)
2. IMF module catalog materialization (`sdkwork-iam-module-registry`, profile `operational`)
3. Locale seed overlays declared in `seeds/seed.manifest.json`

Integrated callers (for example composed product installers) should prefer delegating IAM schema/seed work to `../sdkwork-iam` lifecycle commands or `sdkwork-iam-bootstrap` helpers instead of embedding IAM DDL locally.

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
- Wired from: `sdkwork-routes-iam-app-api`, `sdkwork-routes-iam-backend-api`
- Contract materialization: `pnpm run db:materialize:contract`
- `database.manifest.json` sets `lifecycle.autoMigrate=true` so IAM keeps boot-time schema alignment through `LifecycleOrchestrator`
