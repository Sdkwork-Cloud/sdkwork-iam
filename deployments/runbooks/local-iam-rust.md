# Local IAM Rust Runtime

Purpose: run and verify the local/private IAM Rust route crates and SQLx storage
used by IAM Tauri hosts.

Owner: `sdkwork-iam` maintainers.

## Prerequisites

- PostgreSQL profile from `.env.postgres.example` at the sdkwork-iam root
- Rust toolchain with workspace dependencies resolved

## Bootstrap

```bash
cp .env.postgres.example .env.postgres
cargo test -p sdkwork-router-iam-app-api
```

## Notes

- Unified PostgreSQL env resolution prefers `sdkwork-iam/.env.postgres`, then claw-router profiles.
- Local JWT issuer is `sdkwork-iam-local`.
