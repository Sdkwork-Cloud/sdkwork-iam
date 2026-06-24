# sdkwork-router-iam-open-api

Domain: iam
Capability: iam
Package type: rust-route-crate
Rust crate import: `sdkwork_router_iam_open_api`
Status: standardizing

SDKWork IAM open-api route metadata and fail-closed router for Rust local/private deployments.

Routes declare `open-api-flexible` auth mode and resolve credentials through `sdkwork-iam-web-adapter` (`IamOpenApiWebRequestContextResolver`) with API key and OAuth bearer lookup services.

## Public API

- `sdkwork_router_iam_open_api::open_routes`
- `sdkwork_router_iam_open_api::sdkwork_iam_open_api_routes`
- `sdkwork_router_iam_open_api::build_sdkwork_iam_open_api_router`
- `sdkwork_router_iam_open_api::build_sdkwork_iam_open_api_router_from_env`

## Runtime Entrypoints

- `sdkwork_router_iam_open_api::build_sdkwork_iam_open_api_router`
- `sdkwork_router_iam_open_api::build_sdkwork_iam_open_api_router_from_env`

## Required SDK Surface

- None declared in `specs/component.spec.json`.

## Configuration

Configuration keys, runtime entrypoints, and integration contracts are declared in `specs/component.spec.json`. Shared modules receive configuration through typed bootstrap or service boundaries rather than host-local globals.

## SaaS/Private/Local Behavior

This crate is a base dependency of `sdkwork-iam`. It is not an independent application root and does not own `sdkwork.app.config.json`.

## Framework Integration

This crate wires `sdkwork-web-framework` through `wrap_router_with_iam_open_api_web_framework` and `open_route_manifest()`. Production deployments should use `build_sdkwork_iam_open_api_router_from_env()` so API key and OAuth bearer credentials resolve through database-backed IAM lookup services.

## Security

Do not add secrets, live tokens, manual auth headers, or app-local credential handling to this crate. Protected API and SDK access must use the declared request-context or SDK boundary.

## Extension Points

Extension points are limited to public exports, runtime entrypoints, SDK clients, events, and config keys declared in `specs/component.spec.json`.

## Verification

```bash
cargo test -p sdkwork-router-iam-open-api
```

## Owner And Status

Owner, root path, and lifecycle status are tracked in `specs/component.spec.json`.
