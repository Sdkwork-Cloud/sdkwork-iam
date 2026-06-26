# sdkwork-routes-iam-backend-api Component Specs

This directory is the local standards index for `sdkwork-routes-iam-backend-api`. Root SDKWork standards remain authoritative; local component specs can narrow this crate but must not duplicate or contradict root standards.

## Component

| Field | Value |
| --- | --- |
| Name | `sdkwork-routes-iam-backend-api` |
| Type | `rust-route-crate` |
| Root | `sdkwork-iam/crates/sdkwork-routes-iam-backend-api` |
| Domain | `iam` |
| Capability | `iam` |
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
- [API_SPEC.md](../../../../sdkwork-specs/API_SPEC.md): HTTP API authority, surface, route manifest, and SDK generation rules.
- [WEB_BACKEND_SPEC.md](../../../../sdkwork-specs/WEB_BACKEND_SPEC.md): HTTP backend router, handler, service, repository, and request context rules.
- [SDK_WORKSPACE_GENERATION_SPEC.md](../../../../sdkwork-specs/SDK_WORKSPACE_GENERATION_SPEC.md): SDK family workspace and generated artifact ownership rules.
- [SECURITY_SPEC.md](../../../../sdkwork-specs/SECURITY_SPEC.md): Protected request, tenant, token, and security boundary rules.

## Public Exports

- `sdkwork_routes_iam_backend_api::backend_routes`
- `sdkwork_routes_iam_backend_api::sdkwork_iam_backend_api_routes`
- `sdkwork_routes_iam_backend_api::build_sdkwork_iam_backend_api_router`

## SDK Clients

- No generated SDK client class is declared at this component boundary.

## Local Extension Specs

- No local extension specs are declared.

## Verification

- `cargo test -p sdkwork-routes-iam-backend-api`
