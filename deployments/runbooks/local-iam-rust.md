# Local IAM Rust Runtime

Purpose: run and verify the local/private IAM Rust route crates, gateway assembly, and SQLx storage used by IAM Tauri hosts and standalone gateways.

Owner: `sdkwork-iam` maintainers.

## Prerequisites

- PostgreSQL profile from `.env.postgres.example` at the sdkwork-iam root
- Rust toolchain with workspace dependencies resolved

## Bootstrap

```bash
cp .env.postgres.example .env.postgres
```

## Verification

Structure, API envelope, and gateway assembly (including `/healthz` and `/readyz`):

```bash
pnpm run check
pnpm run check:gateway-assembly
```

Gateway assembly infrastructure smoke test (no database required):

```bash
cargo test -p sdkwork-iam-gateway-assembly --test infra_routes
```

PostgreSQL integration tests (serial execution avoids Windows linker contention):

```bash
cargo test -j 1 -p sdkwork-routes-iam-app-api --test iam_local_app_router_test -- --test-threads 1
cargo test -j 1 -p sdkwork-routes-iam-backend-api --test iam_backend_postgres_integration -- --test-threads 1
```

Full repository verification:

```bash
pnpm run verify
```

## Notes

- Unified PostgreSQL env resolution prefers `sdkwork-iam/.env.postgres`, then claw-router profiles.
- Integration tests cap IAM SQLx pools (`max_connections=2`, `min_connections=0`) and share one seeding pool per test binary via `tests/unified_database_env.rs`.
- Local app/backend Postgres suites repair legacy opaque IAM user ids before serving directory reads, so assignment joins must stay aligned with the repaired snowflake `user_id`.
- If PostgreSQL integration tests fail with `PoolTimedOut`, terminate stale IAM test binaries and release idle connections on the dev database before re-running `pnpm run verify`.
- Local JWT issuer is `sdkwork-iam-local`.
- `sdkwork-iam-gateway-assembly` mounts `/healthz`, `/livez`, `/readyz`, and `/metrics` once via `sdkwork-web-bootstrap::assemble_multi_surface_router`.
- `/readyz` uses SQLx readiness against the IAM database pool when env is configured; otherwise falls back to always-ready for embedded composition hosts.
