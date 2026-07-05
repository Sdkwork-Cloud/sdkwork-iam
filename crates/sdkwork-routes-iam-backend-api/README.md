# sdkwork-routes-iam-backend-api

Domain: iam
Capability: iam
Package type: rust-route-crate
Rust crate import: `sdkwork_routes_iam_backend_api`
Status: standard

SDKWork IAM backend-api route metadata and fail-closed router for Rust local/private deployments.

## Public API

- `sdkwork_routes_iam_backend_api::backend_routes`
- `sdkwork_routes_iam_backend_api::sdkwork_iam_backend_api_routes`
- `sdkwork_routes_iam_backend_api::build_sdkwork_iam_backend_api_router`

## Runtime Entrypoints

- `sdkwork_routes_iam_backend_api::build_sdkwork_iam_backend_api_router`

## Required SDK Surface

- None declared in `specs/component.spec.json`.

## Configuration

Configuration keys, runtime entrypoints, and integration contracts are declared in `specs/component.spec.json`. Shared modules receive configuration through typed bootstrap or service boundaries rather than host-local globals.

## SaaS/Private/Local Behavior

This crate is a base dependency of `sdkwork-iam`. It is not an independent application root and does not own `sdkwork.app.config.json`.

## Security

Do not add secrets, live tokens, manual auth headers, or app-local credential handling to this crate. Protected API and SDK access must use the declared request-context or SDK boundary.

## Extension Points

Extension points are limited to public exports, runtime entrypoints, SDK clients, events, and config keys declared in `specs/component.spec.json`.

## List Pagination

All list handlers in this crate use database-level offset pagination via `sdkwork-utils-rust`:

- Query: `page`, `page_size` (default **20**, max **200**), optional `q`, `sort`, `cursor`
- SQL: `COUNT(*) OVER() AS __list_total` with `LIMIT` / `OFFSET`
- Response payload (inside `SdkWorkApiResponse.data`): `{ "items": [...], "pageInfo": { "mode": "offset", ... } }`

Legacy `{ records, total }` envelopes and in-memory slicing are forbidden. Authority: `sdkwork-specs/API_SPEC.md` sections 14–15, `sdkwork-specs/templates/openapi/components/schemas/sdkwork-list-query.yaml`.

## Tree Resources

Tree endpoints (`organizations/tree`, `departments/tree`) return `SdkWorkResourceResponse` inside `SdkWorkApiResponse.data`:

- Shape: `{ "item": { "nodes": [...] } }` (hierarchical, scoped fetch + in-memory nesting; not flat-paginated)
- SDK unwrap exposes `{ nodes: [...] }`; use `extractSdkWorkTreeNodes` from `@sdkwork/iam-contracts` in TypeScript consumers

Flat list handlers MUST NOT use in-memory `skip`/`take` after unbounded `fetch_all`. Tree handlers are scoped hierarchical reads (tenant/org boundary), not offset-paginated lists.

## Verification

Component verification (manifest and fail-closed route surface):

```bash
cargo test -p sdkwork-routes-iam-backend-api
```

PostgreSQL integration (requires `.env.postgres` or `../sdkwork-clawrouter/.env.postgres`, always use `--test-threads 1`):

```bash
cargo test -j 1 -p sdkwork-routes-iam-backend-api --test iam_backend_postgres_integration -- --test-threads 1
```

## Owner And Status

Owner, root path, and lifecycle status are tracked in `specs/component.spec.json`.
