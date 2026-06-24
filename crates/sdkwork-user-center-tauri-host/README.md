# sdkwork-user-center-tauri-host

Domain: iam
Capability: user-center
Package type: tauri-host
Rust crate import: `sdkwork_user_center_tauri_host`
Status: standardizing

SDKWork User Center Tauri Host is an SDKWork Rust workspace crate.

## Public API

- `.`

## Runtime Entrypoints

- None declared at this boundary.

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
cargo test -p sdkwork-user-center-tauri-host
```

## Owner And Status

Owner, root path, and lifecycle status are tracked in `specs/component.spec.json`.
