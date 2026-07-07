# IAM Technical Architecture

Status: active
Owner: SDKWork maintainers
Updated: 2026-07-06
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
| sdkwork-database | `sdkwork-iam-database-host` lifecycle SPI + `database/` module (PostgreSQL authoritative; SQLite embedded mirror only) |
| sdkwork-utils | `sdkwork-utils-rust` (Rust) + `@sdkwork/utils` (TypeScript) |
| sdkwork-discovery | Deferred until runnable IAM RPC servers ship |
| sdkwork-drive | Required when avatar/media upload surfaces are added |

## 4. API And SDK Ownership

- IAM app-api, backend-api, open-api, and RPC authorities are owned here.
- Generated SDK families: `sdkwork-iam-app-sdk`, `sdkwork-iam-backend-sdk`, `sdkwork-iam-open-sdk`.
- Login/session creation remains app-api owned per `IAM_LOGIN_INTEGRATION_SPEC.md`.
- Business HTTP responses use `SdkWorkApiResponse`; OAuth authorization-server wire uses `x-sdkwork-wire-protocol: external`.

## 5. Deployment

- Gateway assembly: `crates/sdkwork-iam-gateway-assembly/` merges app-api, backend-api, and open-api via each crate's async `gateway_mount()` (database pool from env for app/backend/open surfaces)
- `sdkwork-iam-database-host` allocates Snowflake node IDs from `sdkwork_node_registry` during bootstrap (`init_iam_id_generator`)
- Deploy manifest: `deployments/deploy.yaml` with package health/readiness paths and proxy upstream overrides
- Topology: `specs/topology.spec.json`
- Local runbook: `deployments/runbooks/local-iam-rust.md`
- Production hardening: `sdkwork-iam-web-adapter::assert_production_hardening()` rejects dev auth fallback, fixed verify codes, bootstrap passwords, OAuth client-secret env overrides, super-admin DB auth bypass, OAuth webhook env overrides, email verification without `SDKWORK_IAM_MESSAGING_VERIFICATION_ENABLED`, and missing `SDKWORK_IAM_SIGNING_MASTER_SECRET` whenever the deployment is **not** an explicit development profile (`SDKWORK_IM_ENVIRONMENT=development`, `SDKWORK_ENV=dev`, or equivalent)

## 6. Operational Limits

Shared constants in `crates/sdkwork-iam-bootstrap/src/limits.rs`:

| Constant | Value | Usage |
| --- | --- | --- |
| `IAM_TREE_MAX_NODES` | 2000 | Organization/department tree APIs (app-api and backend-api) |
| `IAM_RBAC_BINDING_ROW_LIMIT` | 5000 | Session authorization RBAC resolution |
| `IAM_RBAC_ROLE_CODE_ROW_LIMIT` | 1000 | Active role codes per principal |
| `IAM_RBAC_EXCLUSION_ROW_LIMIT` | 2000 | Role-exclusion (SoD) rules per tenant |
| `IAM_RBAC_DATA_SCOPE_ROW_LIMIT` | 2000 | Data-scope rows per principal |
| `IAM_ACTIVE_TENANT_LIST_LIMIT` | 500 | Active tenant enumeration for bootstrap registration |
| `IAM_ACTIVE_SESSION_REVOKE_BATCH_SIZE` | 200 | Session revoke batch size per user |
| `IAM_PASSWORD_AUTH_USER_ROW_LIMIT` | 20 | Password auth lookup rows per tenant/account |
| `IAM_SUPER_ADMIN_AUTH_USER_ROW_LIMIT` | 50 | Super-admin credential lookup rows |
| `IAM_TENANT_MEMBER_BACKFILL_BATCH_SIZE` | 200 | Tenant-member backfill batch size |
| `IAM_ACTIVE_ORGANIZATION_MEMBERSHIP_ROW_LIMIT` | 500 | Active organization memberships loaded per user for directory scoping |
| `IAM_OAUTH_RELYING_PARTY_PROBE_LIMIT` | 2 | OAuth client_id uniqueness probe without tenant hint |

Backend-api write mutations are rate-limited via middleware (`backend_write_rate_limit_middleware`) using PostgreSQL ephemeral artifacts.

PC admin audit visibility: `@sdkwork/iam-pc-admin-audit` (`auditEvents.list`/`retrieve`, `securityEvents.list`/`retrieve`) with typed OpenAPI page/resource schemas; list responses omit `detailJson`, retrieve returns `data.item.detailJson` via `sdkwork_resource_json`.

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
