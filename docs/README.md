# Docs

IAM architecture notes, ADRs, runbooks, and operational documentation.

Owner: `sdkwork-iam` maintainers.

## Relationship To `sdkwork-appbase`

IAM domain code, tests, APIs, database module, and SDK families live in this repository. `sdkwork-appbase` only declares the external boundary and delegates verification.

| Topic | Canonical location |
| --- | --- |
| IAM boundary from appbase perspective | [`sdkwork-appbase/docs/architecture/tech/IAM_OWNERSHIP.md`](../../sdkwork-appbase/docs/architecture/tech/IAM_OWNERSHIP.md) |
| IAM contracts & route tests | `tests/static/` in this repo |
| IAM verification entrypoint | `pnpm run verify` (this repo) |
| Appbase delegate | `pnpm run verify:iam` from `sdkwork-appbase` root |

## Verification

```bash
pnpm run verify
pnpm run test:iam-standard-contracts
pnpm run test:user-center-standard-contracts
```

## OAuth / SSO

OAuth and SSO are IAM session extensions owned by this repository. Canonical contract: [`../sdkwork-specs/IAM_OAUTH_SPEC.md`](../sdkwork-specs/IAM_OAUTH_SPEC.md).

| Layer | Location |
| --- | --- |
| Rust routers (app/backend/open-api) | `crates/sdkwork-router-iam-*`, `crates/sdkwork-iam-web-adapter` |
| Backend OAuth CRUD | `crates/sdkwork-router-iam-backend-api/src/oauth_*` |
| TypeScript service + adapter | `apps/sdkwork-iam-common/packages/sdkwork-iam-service`, `sdkwork-iam-sdk-adapter` |
| PC admin UI | `@sdkwork/iam-pc-admin-oauth` — `SdkworkIamOauthAdminWorkspace` (Inbound IdP / Authorization server / Extended platform / Diagnostics & audit) |
| Auth runtime discovery | `apps/sdkwork-iam-common/packages/sdkwork-iam-contracts/src/auth-runtime-metadata.ts` |

## Commercial relying party onboarding (SDKWork AS)

Per `IAM_OAUTH_SPEC.md` §4.2:

1. Enable the tenant application and set `runtimeConfig.oauth.relyingParty` (`enabled`, `redirectUris`, `allowedScopes`, `confidential`, `clientSecretHash`). Use `iam.tenantApplications.retrieve` to read back redacted config, then `iam.tenantApplications.update` to save. Backend updates deep-merge `oauth.relyingParty` and preserve an existing `clientSecretHash` when the hash field is omitted.
2. Use `@sdkwork/iam-pc-admin-oauth` (`SdkworkIamOauthAdminWorkspace` — Authorization server tab, or `SdkworkIamOauthAdminSettings` with `tab="provider"`) for load/save relying-party config, or call `service.iam.tenantApplications.retrieve` / `update` directly.
3. `client_id` must equal the tenant application runtime `app_id`.
4. Third-party apps integrate via `@sdkwork/iam-open-sdk` (OIDC discovery, authorize, token, userinfo, revoke) with a **separate** OAuth bearer credential — not app login TokenManager state (§6).
5. Register custom inbound providers in the provider catalog (`iam.oauth.providerCatalog.create`) before tenant integrations when built-in codes are insufficient (§2).
6. Inbound IdP login (WeChat, GitHub, …) uses `@sdkwork/iam-app-sdk` OAuth sessions; catalog-backed provider selection in PC admin enforces `IAM_OAUTH_SPEC.md` §2.
7. Disable misconfigured integrations, catalog entries, or surfaces via PC admin lifecycle actions to fail closed on inbound OAuth login.

## Layout

Add ADRs, runbooks, and architecture shards under this directory as IAM-owned documentation grows.
