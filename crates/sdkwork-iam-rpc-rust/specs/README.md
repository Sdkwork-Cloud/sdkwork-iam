# sdkwork-iam-rpc-rust Component Specs

This directory is the local standards index for `sdkwork-iam-rpc-rust`. Root SDKWork standards remain authoritative; local component specs can narrow this crate but must not duplicate or contradict root standards.

## Component

| Field | Value |
| --- | --- |
| Name | `sdkwork-iam-rpc-rust` |
| Type | `rust-crate` |
| Root | `sdkwork-iam/crates/sdkwork-iam-rpc-rust` |
| Domain | `iam` |
| Capability | `rpc` |
| Languages | `rust` |
| Status | `standardizing` |

## Contract Manifest

- [component.spec.json](./component.spec.json) is the machine-readable component contract.
- Consumers integrate through public exports, runtime entrypoints, SDK clients, or adapters declared in the manifest.
- Generated SDK language outputs are represented at their SDK family root instead of duplicating local specs in generated folders.

## Canonical Specs

- [COMPONENT_SPEC.md](../../../../sdkwork-specs/COMPONENT_SPEC.md): Component-local contract and discovery rules.
- [CODE_STYLE_SPEC.md](../../../../sdkwork-specs/CODE_STYLE_SPEC.md): Authored source structure and generated code boundaries.
- [NAMING_SPEC.md](../../../../sdkwork-specs/NAMING_SPEC.md): Canonical SDKWork naming rules.
- [MODULE_SPEC.md](../../../../sdkwork-specs/MODULE_SPEC.md): Reusable module and package boundary rules.
- [TEST_SPEC.md](../../../../sdkwork-specs/TEST_SPEC.md): Verification and contract testing expectations.
- [RUST_CODE_SPEC.md](../../../../sdkwork-specs/RUST_CODE_SPEC.md): Rust crate and module rules.
- [RUST_RPC_SPEC.md](../../../../sdkwork-specs/RUST_RPC_SPEC.md): Rust RPC adapter, metadata, manifest, and verification rules.
- [RPC_SPEC.md](../../../../sdkwork-specs/RPC_SPEC.md): Language-neutral RPC contract and service manifest rules.

## Public Exports

- `.`
- `sdkwork_iam_rpc::iam_rpc_service_manifest`

## SDK Clients

- No generated SDK client class is declared at this component boundary.

## Local Extension Specs

- No local extension specs are declared.

## Verification

- `cargo test -p sdkwork-iam-rpc-rust`
