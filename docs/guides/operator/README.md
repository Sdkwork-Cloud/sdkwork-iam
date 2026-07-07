# IAM Operator Guide

Status: active  
Owner: SDKWork maintainers  
Specs: IAM_SPEC.md, TECH_ARCHITECTURE.md, SECURITY_SPEC.md

## Production prerequisites

- PostgreSQL is the only supported production database engine (`database/README.md`).
- Set `SDKWORK_IAM_SIGNING_MASTER_SECRET` before production startup.
- Set `SDKWORK_IM_ENVIRONMENT=production` (or `SDKWORK_IM_ENVIRONMENT=development` only for local dev) so `assert_production_hardening()` and dev shortcuts follow the intended posture.
- Configure `SDKWORK_IAM_DATABASE_URL` or the unified claw-router PostgreSQL profile.

## Gateway surfaces

The IAM gateway assembly merges three async surfaces:

| Surface | Mount | Notes |
| --- | --- | --- |
| app-api | `sdkwork_routes_iam_app_api::gateway_mount()` | End-user auth, directory, contacts |
| backend-api | `sdkwork_routes_iam_backend_api::gateway_mount()` | Tenant/org/user/RBAC/OAuth admin |
| open-api | `sdkwork_routes_iam_open_api::gateway_mount()` | OAuth AS + inbound IdP |

Shared infrastructure (`/healthz`, `/livez`, `/readyz`, `/metrics`) is mounted once via `sdkwork-web-bootstrap`.

## Snowflake node IDs

Database bootstrap allocates a Snowflake `node_id` from `sdkwork_node_registry` and initializes `init_iam_id_generator()`. For single-node dev, allocation failure falls back to `SDKWORK_IAM_SNOWFLAKE_NODE_ID`.

## Verification

```powershell
cd E:\sdkwork-space\sdkwork-iam
pnpm run verify
node E:\sdkwork-space\sdkwork-specs\tools\check-pagination.mjs --workspace E:\sdkwork-space\sdkwork-iam
```

## Security and tenancy

- **PostgreSQL only** for production HTTP surfaces. SQLite supports OAuth-device embedded paths only.
- **Tenant isolation**: backend tenant path operations require the session tenant or platform tenant (`100001`).
- **Permission catalog**: `iam_permission` create/update/delete is restricted to the platform tenant.
- **OAuth inbound IdP**: OIDC identity resolution requires verified userinfo; unverified `id_token` payloads are never trusted.
- **Rate limits**: backend write routes are scoped per `tenant_id`, actor, and URI path.
- **Pagination**: list APIs reject invalid `page`/`page_size` with `40003`; audit/security feeds support keyset cursors (`k:{created_at}|{id}`).
- **OAuth AS signing**: tenant bootstrap provisions RS256 keys (`{tenant_id}:oauth-rs256:primary`); access tokens require RS256 outside explicit development deployments; `/iam/v3/oauth/jwks` publishes active RS256 public keys from PostgreSQL. OpenID discovery does not advertise `id_token` until issuance is implemented.
- **Error responses**: backend 500 responses return sanitized `internal server error` envelopes; SQL details are logged server-side only.
- **Backend mutation audit**: directory CRUD and OAuth admin creates/updates/deletes write `iam_audit_event` in the same PostgreSQL transaction as the row mutation; audit failure rolls back the mutation.
- **Backend write rate limit**: when the PostgreSQL pool is unavailable, write routes return `503` instead of skipping rate limiting.

See also `deployments/runbooks/local-iam-rust.md`.
