# IAM Integration Guide

All IAM domain logic lives in the `sdkwork-iam` repository. Consumer applications integrate through published crates and generated SDKs only.

## Canonical Rust Crates

| Crate | Responsibility |
| --- | --- |
| `sdkwork-iam-bootstrap` | DDL seeds, default subject, permission catalog, tenant signing key SQL, IAM scope resolution |
| `sdkwork-iam-web-adapter` | Web-framework resolvers, tenant signing key store, session/token helpers, OAuth |
| `sdkwork-iam-directory-repository-sqlx` | Directory persistence (organizations, users, memberships) |
| `sdkwork-routes-iam-app-api` | App-surface IAM HTTP routes (login, sessions, tokens) |
| `sdkwork-routes-iam-backend-api` | Backend IAM management routes |
| `sdkwork-routes-iam-open-api` | Open API IAM ingress (OAuth authorization server + provider callbacks) |
| `sdkwork-iam-gateway-assembly` | Federated gateway mount for all three HTTP surfaces; mounts `/healthz`, `/livez`, `/readyz`, `/metrics` once via `sdkwork-web-bootstrap` |
| `sdkwork-iam-database-host` | Database lifecycle SPI (`migrate`, `seed`, `drift-check`) |

## Rules For Consumer Repositories

1. **Do not** add SQL against `iam_*` tables outside `sdkwork-iam`.
2. **Do not** duplicate tenant signing key load/ensure/resolve logic — use `sdkwork_iam_bootstrap` or `sdkwork_iam_web_adapter::TenantSigningKeyStore`.
3. **Do not** implement parallel session/token signing stacks — use `sdkwork-routes-iam-app-api` or `sdkwork-iam-web-adapter::iam_session`.
4. **Do** wire web frameworks through `IamWebRequestContextResolver`, not app-local pass-through resolver wrappers.
5. **Do** resolve production IAM database pools through `iam_web_request_context_resolver_from_env()`.
6. **Do** resolve tenant/org codes through `sdkwork_iam_bootstrap::resolve_*_iam_scope`.
7. **Do** consume IAM through generated SDK clients; do not hand-roll HTTP against IAM APIs.

## Tenant Signing Keys

Canonical API surface:

- `sdkwork_iam_bootstrap::ensure_*_tenant_signing_key`
- `sdkwork_iam_bootstrap::load_*_active_tenant_signing_key`
- `sdkwork_iam_bootstrap::resolve_*_tenant_signing_key_by_kid`
- `sdkwork_iam_web_adapter::TenantSigningKeyStore`
- `sdkwork_iam_web_adapter::TenantSigningKeyResolver`
- `sdkwork_iam_web_adapter::tenant_signing_key_store_for_database_config`

Kid format: `{tenant_id}:local-hs256:primary` for bootstrap keys; rotation may add UUID-based kids.

## IAM Scope Resolution

- `sdkwork_iam_bootstrap::resolve_postgres_iam_scope` / `resolve_sqlite_iam_scope`
- `sdkwork_iam_bootstrap::effective_iam_tenant_code` / `effective_iam_organization_code`
- `sdkwork_iam_bootstrap::IamScopeResolveOptions`

## Legacy Opaque User IDs

Router bootstrap (`sdkwork-routes-iam-app-api`) calls `repair_postgres_legacy_opaque_iam_user_ids` / `repair_sqlite_legacy_opaque_iam_user_ids` to migrate legacy `iamu_*` and UUID user ids to numeric snowflake ids. The repair rewrites every foreign key that stores `user_id`, including:

- sessions, credentials, tenant membership, organization membership
- department and position assignments (`iam_department_assignment`, `iam_position_assignment`)
- group and role bindings for user principals

Do not add parallel migration logic in consumer repositories; extend `legacy_subject_repair.rs` when new `user_id` columns are introduced.

## Account Binding Policy

Tenant account-binding policy is stored in `iam_policy.policy_json` (`jsonb`). Use `sdkwork_iam_web_adapter::load_account_binding_policy` and `save_account_binding_policy`; do not insert raw text into `policy_json` or RFC3339 strings into timestamp columns.

## PostgreSQL Integration Tests

- Profile resolution: `crates/sdkwork-routes-iam-app-api/tests/unified_database_env.rs` (same order as `run-iam-standard-contracts.mjs`).
- Serial execution: `--test-threads 1` for `iam_http_standard`, `iam_local_app_router_test`, and backend postgres suites.
- Pool caps: integration helpers set `SDKWORK_IAM_DATABASE_MAX_CONNECTIONS=2`, `MIN_CONNECTIONS=0`, and share one seeding pool per test binary (headroom for seed helpers plus router bootstrap).
- HTTP standard postgres cases skip automatically when no profile file is present (CI without a sibling claw-router checkout).
- On `PoolTimedOut`, restart PostgreSQL or terminate stale IAM test binaries before re-running `pnpm run verify`.

## Web Framework IAM Resolver

- Type: `sdkwork_iam_web_adapter::IamWebRequestContextResolver`
- Factory: `sdkwork_iam_web_adapter::iam_web_request_context_resolver_from_env()`
- Layer helpers: `build_iam_app_web_framework_layer`, `build_iam_backend_web_framework_layer`, `wrap_router_with_iam_*_web_framework`

Handlers serialize success through `SdkWorkApiResponse` and errors through `ProblemDetail` (`sdkwork-utils-rust`). OAuth authorization-server endpoints declare `x-sdkwork-wire-protocol: external` on the open-api authority.

TypeScript surfaces use `@sdkwork/utils`; Flutter mobile surfaces use `sdkwork_iam_flutter_mobile_core` string helpers with the same semantics until `sdkwork-utils-dart` ships.

## Federated Gateway Wiring

Consumer application gateways mount IAM through `sdkwork-iam-gateway-assembly`:

- `assemble_application_router()` — merges app-api, backend-api, and open-api business routers
- Infrastructure probes — `/healthz` (liveness) and `/readyz` (readiness via IAM database pool when configured)
- `bootstrap_iam_database_from_env()` — IAM DDL and migrations via `sdkwork-iam-database-host`
- Route crate async `gateway_mount()` — per-surface business routers with database pool from env (no duplicate infra routes)

IAM database lifecycle is owned by `sdkwork-iam-database-host` during federated router startup, not by consumer product installers.

## Verification

```bash
pnpm run verify
pnpm run test:iam-standard-contracts
```
