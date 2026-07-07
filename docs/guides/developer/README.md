# Developer Guide

Status: active  
Owner: SDKWork maintainers

## Repository layout

| Path | Purpose |
| --- | --- |
| `crates/` | Rust route crates (app-api, backend-api, open-api, gateway assembly) |
| `database/` | PostgreSQL authoritative schema and migrations |
| `apis/` | OpenAPI and RPC authorities |
| `sdks/` | Generated IAM SDK families |
| `apps/sdkwork-iam-common/` | Cross-surface contracts, service, runtime |
| `apps/sdkwork-iam-pc/` | PC React app and admin packages |

## Local development

```powershell
cd E:\sdkwork-space\sdkwork-iam
pnpm install
pnpm run verify
```

PostgreSQL is required for full IAM HTTP surfaces. See `deployments/runbooks/local-iam-rust.md`.

## Change rules

- Do not hand-edit generated SDK output.
- API changes start in `apis/` then run `pnpm run api:materialize` and `pnpm run sdk:generate`.
- Database changes start in `database/migrations/postgres/` then run `pnpm run db:migrate`.
- Follow `sdkwork-specs` for envelope, pagination, and SDK consumer import rules.
- Interactive admin/console lists must use `createSdkWorkPagedListSession`; string normalization should use `@sdkwork/utils` (`trim`, `isBlank`).
- Audit and security list authorities expose typed page schemas; retrieve returns `SdkWorkAuditEventResourceResponse` / `SdkWorkSecurityEventResourceResponse` with `detailJson`.

## Related docs

- [docs/architecture/tech/TECH_ARCHITECTURE.md](../../architecture/tech/TECH_ARCHITECTURE.md)
- [docs/product/prd/PRD.md](../../product/prd/PRD.md)
