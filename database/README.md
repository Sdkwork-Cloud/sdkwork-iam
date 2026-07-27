# IAM Database Module

Canonical authoritative-server lifecycle assets for `sdkwork-iam` under `DATABASE_FRAMEWORK_SPEC.md`.

- `databaseRole`: `authoritative-server`
- `moduleId`: `iam`
- `serviceCode`: `IAM`
- `tablePrefix`: `iam_`
- `contract tables`: 57, listed in `contract/schema.yaml`
- `engine`: PostgreSQL only
- `autoMigrate`: disabled by default

## Layout

1. `database/ddl/baseline/postgres/0001_iam_baseline.sql` is the greenfield PostgreSQL DDL snapshot.
2. `database/migrations/postgres/` contains versioned incremental migrations with explicit lock, timeout, rollback, and transaction metadata.
3. `database/seeds/` contains common and locale-aware initialization data.
4. `database/drift/` declares non-mutating drift policy.

SQLite is not part of this authoritative database root. Any embedded SQLite adapter is non-authoritative and must own a separate `client-local` lifecycle contract before production use.

Lifecycle orchestration is implemented by `crates/sdkwork-iam-database-host` through the `sdkwork-iam-db` CLI. Production startup does not auto-migrate; migrations are an explicit governed operation.

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

- `db:init` applies the PostgreSQL baseline to an empty database.
- `db:bootstrap` initializes, migrates, and applies the selected operational seed profile.
- `db:migrate` applies pending versioned PostgreSQL migrations.
- `db:drift:check` compares the deployed schema with the contract and never mutates it.
