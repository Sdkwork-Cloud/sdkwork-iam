# IAM Product Requirements

Status: active
Owner: SDKWork maintainers
Application: iam
Updated: 2026-07-06
Specs: REQUIREMENTS_SPEC.md, IAM_SPEC.md, IAM_OAUTH_SPEC.md, IAM_LOGIN_INTEGRATION_SPEC.md

## 1. Background And Problem

SDKWork applications require a centralized identity and access management domain for authentication, authorization, tenant isolation, organization structure, OAuth/SSO, and admin lifecycle. IAM must ship as an embeddable domain crate set and as a standalone HTTP gateway without forking session, token, or permission logic into consumer applications.

## 2. Target Users

| Persona | Need |
| --- | --- |
| Platform operators | Tenant/user/org/permission/OAuth admin, diagnostics, audit visibility |
| Application developers | `@sdkwork/iam-app-sdk`, bootstrap Access-Token, route guards |
| End users | Password/OAuth login, session refresh, contact binding, user center |
| Commercial relying parties | OAuth AS registration, redirect URI policy, scoped tokens |

## 3. Goals And Non-Goals

### Goals

- Multi-tenant authentication and session management with server-side token hashes and refresh rotation
- RBAC with tenant-scoped bindings, standard roles, and backend-admin CRUD
- OAuth authorization server and inbound IdP integrations per `IAM_OAUTH_SPEC.md`
- Verification-code delivery through `sdkwork-messaging`; IAM validates challenges from the shared `messaging_verification_challenge` store when `SDKWORK_IAM_MESSAGING_VERIFICATION_ENABLED=true`
- Generated SDK families (`iam-app-sdk`, `iam-backend-sdk`, `iam-open-sdk`) with SdkWorkApiResponse envelopes
- PC/H5/Flutter client surfaces sharing `@sdkwork/iam-contracts` and `@sdkwork/iam-runtime`
- Production hardening: fail-closed readiness, no dev auth shortcuts, webhook signature verification

### Non-Goals

- Verification-code delivery routes (owned by `sdkwork-messaging`)
- Platform shell/workspace UI (owned by `sdkwork-appbase`)
- Duplicate IAM SQL or signing-key logic in consumer repositories

## 4. Scope

- Rust route crates: app-api, backend-api, open-api, gateway assembly
- Database module: `iam_*` PostgreSQL schemas, migrations, and lifecycle (`database.manifest.json`)
- Embedded SQLite mirror for OAuth-device narrow paths only (not production-equivalent)
- TypeScript packages under `apps/sdkwork-iam-common` and surface roots (PC/H5/Flutter)
- IMF registry and generated SDK families under `sdks/`

## 5. User Scenarios

1. **Tenant admin** creates tenants, organizations, users, roles, and OAuth integrations via backend-admin SDK/UI.
2. **End user** logs in with password or OAuth, selects organization when required, refreshes session, binds email/phone through messaging-backed verification.
3. **Third-party RP** completes OAuth authorization code + PKCE flow against IAM AS using tenant application `app_id` as `client_id`.
4. **Operator** runs OAuth diagnostics that execute synchronously and return succeeded/failed outcomes (not queue-only placeholders).

## 6. Success Metrics

| Metric | Target |
| --- | --- |
| `pnpm run verify` | Green on every PR |
| Production hardening | No dev fallback/env bypass active when `SDKWORK_IM_ENVIRONMENT=production`; `SDKWORK_IAM_SIGNING_MASTER_SECRET` required |
| List/tree APIs | SQL-level pagination or documented node limits (`IAM_TREE_MAX_NODES`); invalid `page_size` returns `40003` |
| Audit/security list APIs | Offset and keyset cursor modes (`k:{created_at}\|{id}`) per `PAGINATION_SPEC.md` |
| OAuth inbound IdP | Userinfo-backed OIDC identity resolution; no unverified `id_token` trust |
| OAuth AS outbound | RS256 JWT signing with tenant-scoped keys; JWKS publishes RS256 public keys; HS256 fallback when RS256 key is absent |
| Backend 500 errors | Sanitized client messages; SQL/driver details logged server-side only |
| Tenant admin isolation | Path `tenantId` must match session tenant unless platform tenant (`100001`) |
| Permission catalog | Global `iam_permission` mutations restricted to platform tenant |
| OAuth webhook POST | Signature or verify-token validation before accept |
| Contact bind / password reset | Messaging `verificationCodes.*` delivery + IAM `messaging_verification_challenge` validation when `SDKWORK_IAM_MESSAGING_VERIFICATION_ENABLED` |
| Backend admin mutations | `iam_audit_event` writes transactional with directory CRUD and OAuth admin creates/updates/deletes |
| Operator audit visibility | PC admin `@sdkwork/iam-pc-admin-audit`: typed list/retrieve OpenAPI, debounced `q` search, `detailJson` via retrieve |
| Organization admin lists | `@sdkwork/iam-pc-admin-organization` and `@sdkwork/iam-pc-admin-user` use `createSdkWorkPagedListSession` for all interactive lists |

## 7. Phases

| Phase | Status |
| --- | --- |
| L3 core auth/session/RBAC | Active |
| OAuth AS + admin CRUD + diagnostics | Active |
| Production gateway + deploy manifest | Active (app/backend/open async `gateway_mount`) |
| RPC runnable servers | Planned (manifests only today) |
| Enterprise MFA/SCIM/SAML | Future |

## 8. Linked Requirements

- `../sdkwork-specs/IAM_SPEC.md`
- `../sdkwork-specs/IAM_OAUTH_SPEC.md`
- `../sdkwork-specs/IAM_LOGIN_INTEGRATION_SPEC.md`
- `../sdkwork-specs/API_SPEC.md` sections 4.5, 14–16
- `../sdkwork-specs/PAGINATION_SPEC.md`
- `../sdkwork-specs/SECURITY_SPEC.md`

## 9. Open Questions

- RPC server delivery timeline for service discovery integration
- Optional Redis-backed session store for multi-region SaaS
