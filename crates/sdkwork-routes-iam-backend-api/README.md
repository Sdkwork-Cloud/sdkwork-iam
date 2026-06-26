# sdkwork-routes-iam-backend-api

Domain: iam
Capability: iam
Package type: rust-route-crate
Rust crate import: `sdkwork_routes_iam_backend_api`
Status: standardizing

SDKWork IAM backend-api route metadata and fail-closed router for Rust local/private deployments.

## Public API

- `sdkwork_routes_iam_backend_api::backend_routes`
- `sdkwork_routes_iam_backend_api::sdkwork_iam_backend_api_routes`
- `sdkwork_routes_iam_backend_api::build_sdkwork_iam_backend_api_router`

## Runtime Entrypoints

- `sdkwork_routes_iam_backend_api::build_sdkwork_iam_backend_api_router`

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

```bash
cargo test -p sdkwork-routes-iam-backend-api
```

## Owner And Status

Owner, root path, and lifecycle status are tracked in `specs/component.spec.json`.
