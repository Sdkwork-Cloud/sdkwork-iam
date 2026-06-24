# sdkwork-iam-module-registry Component Specs

Local standards index for `sdkwork-iam-module-registry`.

## Component

| Field | Value |
| --- | --- |
| Name | `sdkwork-iam-module-registry` |
| Type | `rust-crate` |
| Root | `sdkwork-iam/crates/sdkwork-iam-module-registry` |
| Domain | `iam` |
| Capability | `rbac-federation` |
| Languages | `rust` |
| Status | `standardizing` |

## Canonical Specs

- [IAM_RBAC_FEDERATION_SPEC.md](../../../../sdkwork-specs/IAM_RBAC_FEDERATION_SPEC.md)
- [IAM_MODULE_MANIFEST_SPEC.md](../../../../sdkwork-specs/IAM_MODULE_MANIFEST_SPEC.md)

## Verification

- `cargo test -p sdkwork-iam-module-registry`
- `pnpm run admin:iam-modules:validate`
