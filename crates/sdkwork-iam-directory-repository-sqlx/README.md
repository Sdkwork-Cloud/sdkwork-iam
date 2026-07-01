# sdkwork-iam-directory-repository-sqlx

Domain: iam
Capability: directory
Package type: rust-crate
Rust crate import: `sdkwork_iam_directory_repository_sqlx`
Status: standard

SDKWork IAM SQL table catalog and baseline DDL binding for Rust local/private deployments.

## Public API

- `IamTables` â€?canonical IAM table name constants
- `iam_database_tables()` â€?ordered table catalog
- `iam_database_baseline_sql()` â€?application-root baseline DDL from `database/ddl/baseline/postgres/`

Schema lifecycle assets live in application-root `database/`. This crate does not own competing migration SQL.

## Runtime Entrypoints

- None declared at this boundary.

## Configuration

Configuration keys, runtime entrypoints, and integration contracts are declared in `specs/component.spec.json`. Shared modules receive configuration through typed bootstrap or service boundaries rather than host-local globals.

## SaaS/Private/Local Behavior

This crate is a base dependency of `sdkwork-iam`. It is not an independent application root and does not own `sdkwork.app.config.json`.

## Security

Do not add secrets, live tokens, manual auth headers, or app-local credential handling to this crate. Protected API and SDK access must use the declared request-context or SDK boundary.

## Verification

```bash
cargo test -p sdkwork-iam-directory-repository-sqlx
pnpm run check:database
```

## Owner And Status

Owner, root path, and lifecycle status are tracked in `specs/component.spec.json`.
