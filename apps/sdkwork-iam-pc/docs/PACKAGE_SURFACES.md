# IAM PC package surfaces

This document is the local index for `apps/sdkwork-iam-pc/packages/` surface naming. Canonical rules live in `sdkwork-specs/APP_PC_ARCHITECTURE_SPEC.md`, `NAMING_SPEC.md`, and `BACKEND_UI_SPEC.md`.

## Three surfaces

| Surface | Users | API / SDK | Directory pattern | npm example |
| --- | --- | --- | --- | --- |
| **App** | End users, app login/session | app-api / `@sdkwork/iam-app-sdk` | `sdkwork-iam-pc-<capability>` or legacy `sdkwork-*-pc-react` app modules | `@sdkwork/auth-pc-react` (app auth; migration target: `@sdkwork/iam-pc-auth`) |
| **Console** | Customers, tenant owners, self-service management | app-api / app SDK | `sdkwork-iam-pc-console-<capability>` | `@sdkwork/iam-pc-console-<capability>` (reserved; not yet scaffolded) |
| **Admin** | Internal staff, operators, auditors | backend-api / `@sdkwork/iam-backend-sdk` | `sdkwork-iam-pc-admin-<capability>` | `@sdkwork/iam-pc-admin-oauth` |

## Admin package tree (implemented)

```text
sdkwork-iam-pc-admin-core/       # backend SDK inventory, module registry
sdkwork-iam-pc-admin-shell/      # admin menu and route metadata
sdkwork-iam-pc-admin-oauth/
sdkwork-iam-pc-admin-tenant/
sdkwork-iam-pc-admin-organization/
sdkwork-iam-pc-admin-permission/
sdkwork-iam-pc-admin-account-binding/
```

Each capability package exposes:

- `src/index.ts(x)` — public exports only
- `pages/` — route-level workspace/settings UI
- `services/` — backend SDK orchestration (`create*Controller`)
- `types/` — view models and props
- `routes/` — `IAM_PC_ADMIN_*_ROUTES` metadata
- `components/` — when needed (guards, shared widgets)

## Forbidden legacy admin names

Do not create or reference these for operator UI:

- `sdkwork-iam-oauth-pc-react` / `@sdkwork/iam-oauth-pc-react`
- `sdkwork-iam-tenant-pc-react` / `@sdkwork/iam-tenant-pc-react`
- `sdkwork-iam-organization-pc-react` / `@sdkwork/iam-organization-pc-react`
- `sdkwork-iam-permission-pc-react` / `@sdkwork/iam-permission-pc-react`

## Metadata

Admin packages declare:

```json
"sdkwork": {
  "architecture": "pc-admin",
  "surface": "backend-admin"
}
```

## Verification

```bash
pnpm run check:structure
pnpm --filter "@sdkwork/iam-pc-admin-*" typecheck
pnpm run test:iam-standard-contracts
```
