# sdkwork-iam-rpc-rust

Domain: iam
Capability: rpc
Package type: rust-crate
Rust crate import: `sdkwork_iam_rpc`
Status: standardizing

SDKWork IAM RPC service manifest and adapter foundation.

## Public API

- `.`
- `sdkwork_iam_rpc::iam_rpc_service_manifest`

## Runtime Entrypoints

- `sdkwork_iam_rpc::iam_rpc_service_manifest`

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
cargo test -p sdkwork-iam-rpc-rust
```

## Owner And Status

Owner, root path, and lifecycle status are tracked in `specs/component.spec.json`.
