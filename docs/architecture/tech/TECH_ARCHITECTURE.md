# IAM Technical Architecture

Status: active
Owner: SDKWork maintainers
Updated: 2026-07-05
Specs: IAM_SPEC.md, WEB_FRAMEWORK_SPEC.md, DATABASE_FRAMEWORK_SPEC.md, API_SPEC.md

## 1. Architecture Overview

`sdkwork-iam` is the authoritative IAM domain repository. It owns authentication, authorization, tenants, organizations, users, sessions, IMF module federation, IAM HTTP/RPC contracts, IAM database modules, and generated IAM SDK families.

`sdkwork-appbase` retains platform foundation only. IAM consumers depend on this repository rather than duplicated IAM sources in appbase.

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

## 3. Platform Integration

| Framework | Integration |
| --- | --- |
| sdkwork-web-framework | `sdkwork-iam-web-adapter` + route crates (app/backend/open-api) |
| sdkwork-database | `sdkwork-iam-database-host` lifecycle SPI + `database/` module |
| sdkwork-utils | `sdkwork-utils-rust` (Rust) + `@sdkwork/utils` (TypeScript) |
| sdkwork-discovery | Deferred until runnable IAM RPC servers ship |
| sdkwork-drive | Required when avatar/media upload surfaces are added |

## 4. API And SDK Ownership

- IAM app-api, backend-api, open-api, and RPC authorities are owned here.
- Generated SDK families: `sdkwork-iam-app-sdk`, `sdkwork-iam-backend-sdk`, `sdkwork-iam-open-sdk`.
- Login/session creation remains app-api owned per `IAM_LOGIN_INTEGRATION_SPEC.md`.
- Business HTTP responses use `SdkWorkApiResponse`; OAuth authorization-server wire uses `x-sdkwork-wire-protocol: external`.

## 5. Deployment

- Gateway assembly: `crates/sdkwork-iam-gateway-assembly/` (mounts `/healthz`, `/livez`, `/readyz`, `/metrics` once via `sdkwork-web-bootstrap`)
- Deploy manifest: `deployments/deploy.yaml` with package health/readiness paths and proxy upstream overrides
- Topology: `specs/topology.spec.json`
- Local runbook: `deployments/runbooks/local-iam-rust.md`
- Production hardening: `sdkwork-iam-web-adapter::assert_production_hardening()` rejects dev auth fallback, fixed verify codes, bootstrap passwords, OAuth webhook env overrides, and email verification without `SDKWORK_IAM_MESSAGING_VERIFICATION_ENABLED`

## 6. Operational Limits

Shared constants in `crates/sdkwork-iam-bootstrap/src/limits.rs`:

| Constant | Value | Usage |
| --- | --- | --- |
| `IAM_TREE_MAX_NODES` | 2000 | Organization/department tree APIs (app-api and backend-api) |
| `IAM_RBAC_BINDING_ROW_LIMIT` | 5000 | Session authorization RBAC resolution |

## 7. Verification

```powershell
cd E:\sdkwork-space\sdkwork-iam
pnpm run verify
```

`pnpm verify` runs structure, database, composition, API envelope, gateway assembly, typecheck, API materialize, governance, and Rust workspace tests.

CI (`.github/workflows/iam-quality-gate.yml`) runs `pnpm check`, `pnpm test:governance-node`, `pnpm test:iam-standard-contracts`, and `pnpm test:rust-workspace` on every push and pull request. PostgreSQL integration suites run when a profile is present locally; CI runs the governed non-Postgres Rust surface plus HTTP route standards.

## 8. Related Docs

- [docs/README.md](../../README.md)
- [docs/IAM_INTEGRATION.md](../../IAM_INTEGRATION.md)
- [../sdkwork-specs/IAM_SPEC.md](../../../sdkwork-specs/IAM_SPEC.md)
