# sdkwork-iam-tauri-host

Domain: iam
Capability: tauri-host
Package type: tauri-host
Rust crate import: `sdkwork_iam_tauri_host`
Status: standard

SDKWork IAM Tauri host adapter contract for local/private deployments.

## Public API

- `.`

## Runtime Entrypoints

- `sdkwork_iam_tauri_host::iam_tauri_adapter_manifest`
- `sdkwork_iam_tauri_host::IamTauriAdapterManifest`

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
cargo test -p sdkwork-iam-tauri-host
```

## Owner And Status

Owner, root path, and lifecycle status are tracked in `specs/component.spec.json`.
