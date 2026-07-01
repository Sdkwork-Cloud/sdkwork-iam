# Docs

IAM architecture notes, ADRs, runbooks, and operational documentation.

Owner: `sdkwork-iam` maintainers.

## Integration

Consumer applications must follow [`IAM_INTEGRATION.md`](IAM_INTEGRATION.md). IAM SQL, signing keys, scope resolution, and session/token logic belong in this repository only.

## Relationship To `sdkwork-appbase`

IAM domain code, tests, APIs, database module, and SDK families live in this repository. `sdkwork-appbase` only declares the external boundary and delegates verification.

| Topic | Canonical location |
| --- | --- |
| IAM boundary from appbase perspective | [`sdkwork-appbase/docs/architecture/tech/IAM_OWNERSHIP.md`](../../sdkwork-appbase/docs/architecture/tech/IAM_OWNERSHIP.md) |
| IAM contracts and route tests | `tests/static/` in this repo |
| IAM verification entrypoint | `pnpm run verify` (this repo) |
| Appbase delegate | `pnpm run verify:iam` from `sdkwork-appbase` root |

## Verification

```bash
pnpm run verify
pnpm run test:iam-standard-contracts
pnpm run test:user-center-standard-contracts
```

`pnpm verify` runs structure, database, composition, API envelope, gateway assembly, typecheck, API materialize, governance, and Rust workspace tests.

`pnpm run test:iam-standard-contracts` adds TypeScript surface contracts plus governed Rust HTTP and PostgreSQL integration suites. PostgreSQL app-api tests run with `--test-threads 1` and share a capped IAM SQLx pool via `tests/unified_database_env.rs`.

## OAuth / SSO

OAuth and SSO are IAM session extensions owned by this repository. Canonical contract: [`../sdkwork-specs/IAM_OAUTH_SPEC.md`](../sdkwork-specs/IAM_OAUTH_SPEC.md).

| Layer | Location |
| --- | --- |
| Rust routers (app/backend/open-api) | `crates/sdkwork-routes-iam-*`, `crates/sdkwork-iam-web-adapter` |
| Backend OAuth CRUD | `crates/sdkwork-routes-iam-backend-api/src/oauth_*` |
| TypeScript service and adapter | `apps/sdkwork-iam-common/packages/sdkwork-iam-service`, `sdkwork-iam-sdk-adapter` |
| PC admin UI | `@sdkwork/iam-pc-admin-oauth` — `SdkworkIamOauthAdminWorkspace` |
| Auth runtime discovery | `apps/sdkwork-iam-common/packages/sdkwork-iam-contracts/src/auth-runtime-metadata.ts` |

## Commercial relying party onboarding (SDKWork AS)

Per `IAM_OAUTH_SPEC.md` section 4.2:

1. Enable the tenant application and set `runtimeConfig.oauth.relyingParty` (`enabled`, `redirectUris`, `allowedScopes`, `confidential`, `clientSecretHash`).
2. Use `@sdkwork/iam-pc-admin-oauth` for load/save relying-party config, or call `service.iam.tenantApplications.retrieve` / `update` directly.
3. `client_id` must equal the tenant application runtime `app_id`.
4. Third-party apps integrate via `@sdkwork/iam-open-sdk` with a separate OAuth bearer credential — not app login TokenManager state.
5. Register custom inbound providers in the provider catalog before tenant integrations when built-in codes are insufficient.
6. Inbound IdP login uses `@sdkwork/iam-app-sdk` OAuth sessions.
7. Disable misconfigured integrations via PC admin lifecycle actions to fail closed on inbound OAuth login.

## Canon Documents

| Document | Path |
| --- | --- |
| Product PRD | [product/prd/PRD.md](product/prd/PRD.md) |
| Technical architecture | [architecture/tech/TECH_ARCHITECTURE.md](architecture/tech/TECH_ARCHITECTURE.md) |
| Integration guide | [IAM_INTEGRATION.md](IAM_INTEGRATION.md) |
| Deployment | [../deployments/README.md](../deployments/README.md) |

## Layout

Add ADRs, runbooks, and architecture shards under this directory as IAM-owned documentation grows.
