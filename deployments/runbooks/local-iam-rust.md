# Local IAM Rust Runtime

Purpose: run and verify the local/private IAM Rust route crates and SQLx storage
used by appbase Tauri hosts.

Owner: `sdkwork-appbase` maintainers.

## Prerequisites

- PostgreSQL profile from `.env.postgres.example` at the appbase root
- Rust toolchain with workspace dependencies resolved

## Bootstrap

```bash
cp .env.postgres.example .env.postgres
pnpm run db:init
pnpm run db:migrate
pnpm run db:seed
pnpm run api:materialize
cargo test -j 1 -p sdkwork-router-iam-app-api --test iam_local_app_router_test -- --test-threads 1
cargo test -j 1 -p sdkwork-router-iam-app-api --test iam_http_standard -- --test-threads 1
cargo test -p sdkwork-router-iam-backend-api
cargo test -p sdkwork-router-iam-open-api
pnpm run test:iam-standard-contracts
```

The database CLI and IAM bootstrap entrypoints load `.env.postgres` from the appbase root first, then fall back to `../sdkwork-clawrouter/.env.postgres`.

## Related Components

- `crates/sdkwork-router-iam-app-api`
- `crates/sdkwork-router-iam-backend-api`
- `crates/sdkwork-router-iam-open-api`
- `crates/sdkwork-iam-tauri-host`
- `crates/sdkwork-user-center-tauri-host`

## Related Specs

- `../../sdkwork-specs/DEPLOYMENT_SPEC.md`
- `../../sdkwork-specs/RUNTIME_DIRECTORY_SPEC.md`
- `../../sdkwork-specs/WEB_FRAMEWORK_SPEC.md`
