# IAM Database Module

Canonical lifecycle assets for `sdkwork-iam` per `DATABASE_FRAMEWORK_SPEC.md`.

- moduleId: `iam`
- serviceCode: `IAM`
- tablePrefix: `iam_`
- contract tables: **57** (see `contract/schema.yaml`)

## Layout

1. **Baseline** — `database/ddl/baseline/{engine}/0001_iam_baseline.sql` is the greenfield DDL snapshot (no legacy Studio cleanup).
2. **Migrations** — `database/migrations/{engine}/` holds versioned incremental changes. Upgraded databases apply `0007_drop_legacy_studio_tables` to remove deprecated Studio catalog tables; fresh installs skip no-op drops safely.
3. **Drift** — run `pnpm run db:drift:check` before release.

Lifecycle orchestration is implemented in `crates/sdkwork-iam-database-host` (`sdkwork-iam-db` CLI).

## Engines

| Engine | Lifecycle | Notes |
| --- | --- | --- |
| PostgreSQL | **Authoritative** — `db:init`, `db:migrate`, `db:bootstrap`, drift checks | Required for production IAM HTTP services |
| SQLite | **Embedded mirror only** — not in `database.manifest.json` | OAuth-device / Claw Router narrow paths; baseline uses SQLite `TEXT` JSON columns (not PostgreSQL `JSONB`) |

## Commands

```bash
pnpm run check:database
pnpm run db:validate
pnpm run db:materialize:contract
pnpm run db:plan
pnpm run db:init
pnpm run db:bootstrap
pnpm run db:migrate
pnpm run db:seed
pnpm run db:status
pnpm run db:drift:check
```

- `db:init` — apply baseline DDL on an empty database.
- `db:bootstrap` — init + migrate + operational seed (via `sdkwork-iam-database-host`).
- `db:migrate` — apply pending versioned migrations (including legacy Studio cleanup on upgrades).
