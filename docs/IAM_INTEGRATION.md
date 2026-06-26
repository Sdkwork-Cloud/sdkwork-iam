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
| `sdkwork-routes-iam-open-api` | Open API IAM ingress |

## Rules For Consumer Repositories

1. **Do not** add SQL against `iam_*` tables outside `sdkwork-iam`.
2. **Do not** duplicate tenant signing key load/ensure/resolve logic — use `sdkwork_iam_bootstrap` or `sdkwork_iam_web_adapter::TenantSigningKeyStore`.
3. **Do not** implement parallel session/token signing stacks — use `sdkwork-routes-iam-app-api` or `sdkwork-iam-web-adapter::iam_session`.
4. **Do** wire web frameworks through `IamWebRequestContextResolver` (canonical alias in `sdkwork-iam-web-adapter`), not app-local pass-through resolver wrappers.
5. **Do** resolve production IAM database pools through `iam_web_request_context_resolver_from_env()`; do not call the deprecated `iam_database_resolver_from_env()` alias in application code.
6. **Do** resolve tenant/org codes through `sdkwork_iam_bootstrap::resolve_*_iam_scope`.

## Tenant Signing Keys

Canonical API surface:

- `sdkwork_iam_bootstrap::ensure_*_tenant_signing_key`
- `sdkwork_iam_bootstrap::load_*_active_tenant_signing_key`
- `sdkwork_iam_bootstrap::resolve_*_tenant_signing_key_by_kid`
- `sdkwork_iam_web_adapter::TenantSigningKeyStore` (async store trait)
- `sdkwork_iam_web_adapter::TenantSigningKeyResolver` (kid → secret for JWT verify)
- `sdkwork_iam_web_adapter::tenant_signing_key_store_for_database_config`

Kid format: `{tenant_id}:local-hs256:primary` for bootstrap keys; rotation may add UUID-based kids.

## IAM Scope Resolution

Canonical API surface:

- `sdkwork_iam_bootstrap::resolve_postgres_iam_scope` / `resolve_sqlite_iam_scope`
- `sdkwork_iam_bootstrap::effective_iam_tenant_code` / `effective_iam_organization_code`
- `sdkwork_iam_bootstrap::IamScopeResolveOptions`

Applications that need domain-specific error mapping may wrap bootstrap functions in a thin adapter (map `sqlx::Error` to local `DomainError`).

## Web Framework IAM Resolver

Canonical application integration surface:

- Type: `sdkwork_iam_web_adapter::IamWebRequestContextResolver`
- Factory: `sdkwork_iam_web_adapter::iam_web_request_context_resolver_from_env()`
- Layer helpers: `build_iam_app_web_framework_layer`, `build_iam_backend_web_framework_layer`, `wrap_router_with_iam_*_web_framework`

Rules:

- Application repositories `MUST NOT` add pass-through resolver wrappers that only delegate to `IamWebRequestContextResolver`.
- `IamDatabaseWebRequestContextResolver` is the concrete implementation struct inside `sdkwork-iam-web-adapter` only.
- Workspace validation: `sdkwork-specs/tools/check-iam-web-adapter-standard.mjs`

## Claw Router Federated IAM Wiring

Standalone Claw Router app runtime (`sdkwork-routes-clawrouter-app-api`) mounts federated IAM through `iam_runtime.rs`:

- `bootstrap_iam_database_from_env()` — IAM DDL and migrations via `sdkwork-iam-database-host`
- `ensure_clawrouter_tenant_application_bootstrap()` — embedded application registration
- `wire_iam_routers()` — merges `sdkwork-routes-iam-app-api` and `sdkwork-routes-iam-backend-api`

Product route assembly calls `merge_federated_iam_routers()` after product stores are wired. The sync stub `router()` without database config does **not** mount IAM (shared-gateway / contract-fallback mode).

Product installer (`DatabaseInstaller`) no longer applies IAM foundation, OAuth DDL, IAM subject seeds, or bootstrap-admin upserts to the product database. IAM lifecycle is owned by `sdkwork-iam-database-host` during federated router startup.

Removed from `sdkwork-clawrouter-router-service`:

- Local auth stack (`app_auth.rs`, session event stores, verification delivery) — replaced by `sdkwork-routes-iam-app-api`
- IAM directory stack (`app_iam_directory.rs`, duplicate `sdkwork-clawrouter-app-iam-directory-repository-sqlx`) — replaced by `sdkwork-iam-directory-repository-sqlx`
- App user profile stack (`app_user_profile.rs`, `sdkwork-clawrouter-app-user-profile-repository-sqlx`) — `/app/v3/api/iam/users/current` is served by federated `sdkwork-routes-iam-app-api`

## Verification

```bash
# From sdkwork-iam root
pnpm run verify
cargo test -p sdkwork-iam-bootstrap -p sdkwork-iam-web-adapter -p sdkwork-routes-iam-app-api
```
