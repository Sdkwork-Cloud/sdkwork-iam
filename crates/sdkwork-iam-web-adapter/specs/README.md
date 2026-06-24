# sdkwork-iam-web-adapter Component Specs

This directory is the local standards index for `sdkwork-iam-web-adapter`. Root SDKWork standards remain authoritative; local component specs can narrow this crate but must not duplicate or contradict root standards.

## Component

| Field | Value |
| --- | --- |
| Name | `sdkwork-iam-web-adapter` |
| Type | `rust-crate` |
| Root | `sdkwork-iam/crates/sdkwork-iam-web-adapter` |
| Domain | `iam` |
| Capability | `web-adapter` |
| Languages | `rust` |
| Status | `standardizing` |

## Contract Manifest

- [component.spec.json](./component.spec.json) is the machine-readable component contract.
- Consumers integrate through public exports, runtime entrypoints, SDK clients, or adapters declared in the manifest.

## Canonical Specs

- [COMPONENT_SPEC.md](../../../../sdkwork-specs/COMPONENT_SPEC.md): Component-local contract and discovery rules.
- [WEB_FRAMEWORK_SPEC.md](../../../../sdkwork-specs/WEB_FRAMEWORK_SPEC.md): Mandatory web framework integration.
- [WEB_BACKEND_SPEC.md](../../../../sdkwork-specs/WEB_BACKEND_SPEC.md): Web backend implementation boundaries.
- [RUST_CODE_SPEC.md](../../../../sdkwork-specs/RUST_CODE_SPEC.md): Rust crate and module rules.

## Verification

- `cargo test -p sdkwork-iam-web-adapter`
- `cargo test -p sdkwork-router-iam-open-api`
