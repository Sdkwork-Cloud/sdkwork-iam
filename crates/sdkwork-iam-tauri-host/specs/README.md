# sdkwork-iam-tauri-host Component Specs

This directory is the local standards index for `sdkwork-iam-tauri-host`. Root SDKWork standards remain authoritative; local component specs can narrow this crate but must not duplicate or contradict root standards.

## Component

| Field | Value |
| --- | --- |
| Name | `sdkwork-iam-tauri-host` |
| Type | `tauri-host` |
| Root | `sdkwork-iam/crates/sdkwork-iam-tauri-host` |
| Domain | `iam` |
| Capability | `tauri-host` |
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
- [APP_PC_ARCHITECTURE_SPEC.md](../../../../sdkwork-specs/APP_PC_ARCHITECTURE_SPEC.md): PC desktop and Tauri host architecture rules.

## Public Exports

- `.`

## SDK Clients

- No generated SDK client class is declared at this component boundary.

## Local Extension Specs

- No local extension specs are declared.

## Verification

- `cargo test -p sdkwork-iam-tauri-host`
