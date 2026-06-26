# sdkwork-routes-iam-app-api

Domain: iam
Capability: iam
Package type: rust-route-crate
Rust crate import: `sdkwork_routes_iam_app_api`
Status: standardizing

SDKWork canonical IAM HTTP route contracts for Rust local/private deployments.

## Public API

- `sdkwork_routes_iam_app_api::app_routes`
- `sdkwork_routes_iam_app_api::sdkwork_iam_app_api_routes`
- `sdkwork_routes_iam_app_api::build_sdkwork_iam_app_api_router`
- `sdkwork_routes_iam_app_api::build_sdkwork_iam_app_api_router_with_local_directory`
- `sdkwork_routes_iam_app_api::build_local_app_api_router`

## Runtime Entrypoints

- `sdkwork_routes_iam_app_api::build_sdkwork_iam_app_api_router`

## Required SDK Surface

- None declared in `specs/component.spec.json`.

## Configuration

Configuration keys, runtime entrypoints, and integration contracts are declared in `specs/component.spec.json`. Shared modules receive configuration through typed bootstrap or service boundaries rather than host-local globals.

## SaaS/Private/Local Behavior

This crate is a base dependency of `sdkwork-iam`. It is not an independent application root and does not own `sdkwork.app.config.json`.

## Security

Do not add secrets, live tokens, manual auth headers, or app-local credential handling to this crate. Protected API and SDK access must use the declared request-context or SDK boundary.

## Extension Points

Extension points are limited to public exports, runtime entrypoints, SDK clients, events, and config keys declared in `specs/component.spec.json`.

## Verification

Component verification (structure checks, CI without PostgreSQL):

```bash
cargo test -j 1 -p sdkwork-routes-iam-app-api --test iam_http_standard -- --test-threads 1
```

PostgreSQL integration (requires `.env.postgres` or `../sdkwork-clawrouter/.env.postgres`, always use `--test-threads 1`):

```bash
cargo test -j 1 -p sdkwork-routes-iam-app-api --test oauth_authorization_server_integration -- --test-threads 1
cargo test -j 1 -p sdkwork-routes-iam-app-api --test iam_local_app_router_test -- --test-threads 1
```

Included in `pnpm run test:iam-standard-contracts` (HTTP standard always; OAuth PKCE E2E when PostgreSQL profile is available).

## Owner And Status

Owner, root path, and lifecycle status are tracked in `specs/component.spec.json`.
