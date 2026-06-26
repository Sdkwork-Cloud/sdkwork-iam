# IAM Technical Architecture

Status: active
Owner: SDKWork maintainers
Updated: 2026-06-25
Specs: IAM_SPEC.md, ENGINEERING_WORKFLOW_SPEC.md, DOCUMENTATION_SPEC.md, ARCHITECTURE_DECISION_SPEC.md

## 1. Architecture Overview

`sdkwork-iam` is the authoritative IAM domain repository. It owns authentication, authorization, tenants, organizations, users, sessions, IMF module federation, IAM HTTP/RPC contracts, IAM database modules, and generated IAM SDK families.

`sdkwork-appbase` retains platform foundation only. IAM consumers must depend on this repository rather than duplicated IAM sources in appbase.

## 2. System Boundaries

| Layer | Path |
| --- | --- |
| Rust domain crates | `crates/` |
| IMF registry | `iam/` |
| API authorities | `apis/` |
| Generated SDK families | `sdks/` |
| Database module | `database/` |
| Common TS contracts/runtime | `apps/sdkwork-iam-common/packages/` |
| PC surface | `apps/sdkwork-iam-pc/` |
| H5 surface | `apps/sdkwork-iam-h5/` |
| Flutter surface | `apps/sdkwork-iam-flutter-mobile/` |

## 3. API And SDK Ownership

- IAM app-api, backend-api, open-api, and RPC authorities are owned here.
- Generated SDK families include `sdkwork-iam-app-sdk`, `sdkwork-iam-backend-sdk`, and `sdkwork-iam-open-sdk`.
- Login/session creation remains app-api owned per `IAM_LOGIN_INTEGRATION_SPEC.md`.

## 4. Security And Data

- IAM tables use the `iam_` prefix.
- Tenant signing secrets and credential-entry flows follow `IAM_SPEC.md` and `SECURITY_SPEC.md`.
- IMF registry manifests live under `iam/registry/`.

## 5. Verification

```powershell
cd E:\sdkwork-space\sdkwork-iam
cargo test --workspace
pnpm install
pnpm verify
```

## 6. Related Docs

- [docs/README.md](../../README.md)
- [../sdkwork-specs/IAM_SPEC.md](../../../sdkwork-specs/IAM_SPEC.md)
- [../sdkwork-specs/IAM_LOGIN_INTEGRATION_SPEC.md](../../../sdkwork-specs/IAM_LOGIN_INTEGRATION_SPEC.md)
