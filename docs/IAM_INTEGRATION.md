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
| `sdkwork-api-iam-assembly` | Federated gateway mount for all three HTTP surfaces; mounts `/healthz`, `/livez`, `/readyz`, `/metrics` once via `sdkwork-web-bootstrap` |
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

WeChat integrations use the provider-specific IAM adapter surfaces. `wechat` is Official Account H5 OAuth, `wechat_open` is Open Platform QR OAuth, and `wechat_mini_program` is the dedicated `jscode2session` flow exposed through the typed app SDK command. Do not call WeChat endpoints from applications. Provider callbacks are external-wire routes accepting raw XML/JSON; they perform signature, optional AES safe-mode, AppID, and replay validation before recording events.

Set the optional OAuth client `providerTenantId` to the shared WeChat Open Platform account identifier when Official Account and Mini Program clients are allowed to merge an identical `unionid`. IAM performs this merge only when the verified tenant and `providerTenantId` both match. An omitted value deliberately keeps identities isolated by tenant, integration, provider, and subject.

TypeScript surfaces use `@sdkwork/utils`; Flutter mobile surfaces use `sdkwork_iam_flutter_mobile_core` string helpers with the same semantics until `sdkwork-utils-dart` ships.

## Federated Gateway Wiring

Consumer application gateways mount IAM through `sdkwork-api-iam-assembly`:

- `bootstrap_iam_for_application()` — one-shot integration entry point following `IAM_APPLICATION_BOOTSTRAP_SPEC.md` §5.1: bootstraps IAM database (DDL, migrations, module catalog, super admin), provisions the tenant application from `sdkwork.app.config.json`, and assembles the app-api, backend-api, and open-api business routers
- `assemble_api_router()` — assembles only the API router; assumes the database and tenant application are already bootstrapped
- Infrastructure probes — `/healthz` (liveness) and `/readyz` (readiness via IAM database pool when configured)
- Route crate async `gateway_mount()` — per-surface business routers with database pool from env (no duplicate infra routes)

IAM database lifecycle is owned by `sdkwork-iam-database-host` during federated router startup, not by consumer product installers.

### One-Shot Integration (Recommended)

Integration applications call `bootstrap_iam_for_application()` to perform database initialization, tenant application provisioning, permission seeding, super-admin provisioning, and route assembly in a single call — following the `IAM_APPLICATION_BOOTSTRAP_SPEC.md` §5.1 embedded IAM integration checklist:

```rust
use sdkwork_api_iam_assembly::bootstrap_iam_for_application;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    let (assembly, _host) = bootstrap_iam_for_application()
        .await
        .map_err(|e| format!("IAM bootstrap failed: {e}"))?;
    // assembly.router is ready to serve /app/v3/api/*, /backend/v3/api/*, /iam/v3/api/*
    Ok(())
}
```

The function executes three steps in order:

1. `bootstrap_iam_database_from_env()` — IAM schema, migrations, module catalog materialization, super-admin/manager credentials
2. `ensure_tenant_application_from_app_root_with_env_and_fallback()` — provisions the tenant application from `sdkwork.app.config.json` at `SDKWORK_APP_ROOT` so the app-api auth runtime can resolve signing keys, access scopes, and runtime `app_id`
3. `assemble_api_router()` — merges the three API surface routers

### Required Environment For First-Run Success

| Variable | Purpose | Required |
| --- | --- | --- |
| `SDKWORK_IAM_DATABASE_URL` | PostgreSQL connection string for the IAM schema | Yes |
| `SDKWORK_APP_ROOT` (or `SDKWORK_IAM_APP_ROOT`) | Consumer application root containing `sdkwork.app.config.json` for tenant application provisioning | Yes for embedded integration |
| `SDKWORK_IAM_SUPER_ADMIN_PASSWORD` | Bootstrap super-admin password credential | Yes (dev) / N/A (prod) |
| `SDKWORK_IAM_BOOTSTRAP_PASSWORD` | Fallback for super-admin password when `SUPER_ADMIN_PASSWORD` is unset | Optional |
| `SDKWORK_IAM_MANAGER_PASSWORD` | Bootstrap manager (org admin) password credential | Optional |
| `SDKWORK_IM_ENVIRONMENT` | `dev` / `test` / `prod` — controls production hardening gates | Optional (defaults to production posture) |
| `SDKWORK_IAM_SIGNING_MASTER_SECRET` | Tenant signing key master secret — required outside explicit development profiles | Required (prod) |

When `SDKWORK_IM_ENVIRONMENT` is `dev` or `test`, the bootstrap provisions the super-admin password credential from the environment. In production posture (`prod`/`staging`/`saas`), `SDKWORK_IAM_SUPER_ADMIN_PASSWORD` is forbidden by `assert_production_hardening()` and the super admin must be provisioned through the backend management API instead.

### Why 404/401 Occurs Without One-Shot Bootstrap

| Symptom | Root Cause | Fix |
| --- | --- | --- |
| 404 on `/app/v3/api/auth/sessions` | App SDK base URL includes `/app/v3/api` prefix, producing a double-prefixed request URL | Pass the gateway origin only (`https://api.example.com`); `resolveAppSdkBaseUrl` strips a trailing prefix if present |
| 401 on first authenticated request | Database not bootstrapped — no `iam_user` / `iam_credential` / `iam_role_binding` rows | Call `bootstrap_iam_for_application()` before serving traffic |
| 401 on app-api auth (token issuance) | Tenant application not provisioned — `iam_tenant_application` row missing for the runtime `app_id`, so auth runtime cannot resolve signing keys or access scopes | Set `SDKWORK_APP_ROOT` to the consumer app root containing `sdkwork.app.config.json`; `bootstrap_iam_for_application()` provisions it automatically |
| 401 on backend-api mutations | `build_sdkwork_iam_backend_api_router()` (fail-closed) mounts without a database pool | Use `gateway_mount()` / `_from_env()` constructors or the assembly-level `bootstrap_iam_for_application()` |
| 503 `iam_database_unavailable` | Backend route state has `pool: None` | Same as above — the `_from_env` constructor resolves the pool from `SDKWORK_IAM_DATABASE_URL` |

## Verification

```bash
pnpm run verify
pnpm run test:iam-standard-contracts
```
