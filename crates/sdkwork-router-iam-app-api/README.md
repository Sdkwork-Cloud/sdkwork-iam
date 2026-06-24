# sdkwork-router-iam-app-api

Domain: iam
Capability: iam
Package type: rust-route-crate
Rust crate import: `sdkwork_router_iam_app_api`
Status: standardizing

SDKWork canonical IAM HTTP route contracts for Rust local/private deployments.

## Public API

- `sdkwork_router_iam_app_api::app_routes`
- `sdkwork_router_iam_app_api::sdkwork_appbase_app_api_routes`
- `sdkwork_router_iam_app_api::build_sdkwork_appbase_app_api_router`
- `sdkwork_router_iam_app_api::build_sdkwork_appbase_app_api_router_with_local_directory`
- `sdkwork_router_iam_app_api::build_local_app_api_router`

## Runtime Entrypoints

- `sdkwork_router_iam_app_api::build_sdkwork_appbase_app_api_router`

## Required SDK Surface

- None declared in `specs/component.spec.json`.

## Configuration

Configuration keys, runtime entrypoints, and integration contracts are declared in `specs/component.spec.json`. Shared modules receive configuration through typed bootstrap or service boundaries rather than host-local globals.

## SaaS/Private/Local Behavior

This crate is a base dependency of `sdkwork-appbase`. It is not an independent application root and does not own `sdkwork.app.config.json`.

## Security

Do not add secrets, live tokens, manual auth headers, or app-local credential handling to this crate. Protected API and SDK access must use the declared request-context or SDK boundary.

## Extension Points

Extension points are limited to public exports, runtime entrypoints, SDK clients, events, and config keys declared in `specs/component.spec.json`.

## Verification

```bash
cargo test -p sdkwork-router-iam-app-api
```

## Owner And Status

Owner, root path, and lifecycle status are tracked in `specs/component.spec.json`.
