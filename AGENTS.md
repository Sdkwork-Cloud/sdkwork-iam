# SDKWork IAM Repository Guidelines

<!-- SDKWORK-AGENTS-GENERATED: v1 -->

## SDKWORK Soul

Read `../sdkwork-specs/SOUL.md` before executing tasks in this root.

## Application Identity

`sdkwork-iam` owns the IAM domain: authentication, authorization, tenants, organizations, users, sessions, IMF module federation, IAM HTTP/RPC contracts, IAM database module, and generated IAM SDK families.

`sdkwork-appbase` retains platform foundation only (shell, workspace UI, runtime bootstrap, notification, shared RPC core). IAM consumers must depend on this repository, not duplicated IAM sources in appbase.

## Local Dictionary Structure

- `AGENTS.md`: local agent entrypoint.
- `specs/`: IAM component contracts (`component.spec.json`, `iam-capabilities.yaml`).
- `crates/`: IAM Rust crates and route surfaces.
- `apps/sdkwork-iam-common/packages/`: cross-architecture IAM TypeScript contracts, service, and runtime packages.
- `apps/sdkwork-iam-pc/`: IAM PC React application root — app packages (`sdkwork-iam-pc-core`, auth/user-center) and backend-admin packages (`@sdkwork/iam-pc-admin-*`).
- `apps/sdkwork-iam-h5/`: IAM H5/mobile React application root (`sdkwork-iam-h5-core` re-exports auth runtime from common contracts).
- `apps/sdkwork-iam-flutter-mobile/`: IAM Flutter mobile application root (`sdkwork_iam_flutter_mobile_core` auth runtime parity).
- `database/`: IAM postgres module (`iam_*` tables).
- `apis/`: IAM OpenAPI and RPC authorities.
- `sdks/`: IAM SDK families (`sdkwork-iam-app-sdk`, `sdkwork-iam-backend-sdk`, `sdkwork-iam-open-sdk`).
- `iam/`: IMF registry and federated module manifests.

## Required Specs By Task Type

- IAM domain: `../sdkwork-specs/IAM_SPEC.md`, `IAM_OAUTH_SPEC.md`, `IAM_LOGIN_INTEGRATION_SPEC.md`, `IAM_MODULE_MANIFEST_SPEC.md`
- HTTP APIs: `../sdkwork-specs/WEB_FRAMEWORK_SPEC.md`, `WEB_BACKEND_SPEC.md`, `API_SPEC.md`
- Database: `../sdkwork-specs/DATABASE_SPEC.md`, `DATABASE_FRAMEWORK_SPEC.md`
- Rust: `../sdkwork-specs/RUST_CODE_SPEC.md`
- TypeScript/UI: `../sdkwork-specs/TYPESCRIPT_CODE_SPEC.md`, `FRONTEND_CODE_SPEC.md`, `APP_PC_REACT_UI_SPEC.md`

## Documentation Canon

- [docs/README.md](docs/README.md)
- [docs/product/prd/PRD.md](docs/product/prd/PRD.md)
- [docs/architecture/tech/TECH_ARCHITECTURE.md](docs/architecture/tech/TECH_ARCHITECTURE.md)

## Build, Test, and Verification

Run commands from this directory:

- `pnpm run verify`: structure, database, IAM bootstrap, typecheck, API materialize, governance
- `pnpm run test:iam-standard-contracts`: IAM contract suite
- `cargo test --workspace`: Rust IAM crate tests
- `pnpm run db:migrate`: IAM database migrations via `sdkwork-iam-db`

## Agent Execution Rules

Do not hand-edit generated SDK output. Do not replace generated SDK calls with raw HTTP. Keep IAM domain code in this repository; platform shell code stays in `sdkwork-appbase`.

## HTTP API Response Envelope

All L2+ `app-api`, `backend-api`, and SDKWork-owned business `open-api` HTTP contracts `MUST` follow `API_SPEC.md` section 4.5, section 14, and section 15:

- **Input:** typed request bodies, section 14.1 list/search/command input, `SdkWorkListQuery`, and `q` for free-text search.
- **Success output:** `SdkWorkApiResponse` with `{ "code": 0, "data": <payload>, "traceId": "<server-uuid>" }`.
- **Error output:** HTTP 4xx/5xx `application/problem+json` (`ProblemDetail`) with numeric `code` and `traceId`.
- Success `code` is numeric `int32`; HTTP 2xx JSON bodies `MUST` use `0` only. REST semantics remain on HTTP status (`201`, `202`, etc.).
- Platform error codes are numeric non-zero values per section 15.3 (`40001`, `40101`, `40401`, …).
- Single resource: `data.item`
- Lists: `data.items` + `data.pageInfo` (`PageInfo.mode` is `offset` or `cursor`)
- Commands: `data.accepted` plus optional `resourceId` / `status`
- Async accept (`202`): `data.operationId`, `data.status`, optional `pollUrl`

Vendor compatibility `open-api` routes that mirror upstream tool or provider wire (for example OpenAI `/v1/*`, Claude Code, Codex) `MAY` opt out only when every exempt operation declares `x-sdkwork-wire-protocol: external` and `x-sdkwork-external-protocol-id` per `API_SPEC.md` section 4.5.2. SDKWork-owned business `open-api` operations `MUST NOT` opt out.

Errors `MUST` use HTTP 4xx/5xx with `application/problem+json` (`ProblemDetail`) including required numeric `code` and `traceId`. Business failures `MUST NOT` use HTTP 2xx with non-zero `code`, string wire codes, `success`, or human `message`.

Forbidden legacy envelopes and fields: `PlusApiResult`, `AppbaseApiResult`, `StoreApiResult`, `SdkWorkResponse`, per-domain `*ApiResult`, wire field `requestId`, bare domain DTOs at the HTTP root, and top-level `{ items, pageInfo, traceId }` without `data`.

Handlers `MUST` serialize success and map errors through `sdkwork-web-framework` response mapping. Generated HTTP SDKs (`--standard-profile sdkwork-v3`) unwrap `data` by default and expose typed numeric `ProblemDetail.code` / `traceId` on errors; use `.raw` when the full envelope is required.

Before completing API contract, SDK generation, or frontend service work, run:

```bash
node <sdkwork-specs>/tools/check-api-response-envelope.mjs --workspace <workspace-root>
```

Authority: `sdkwork-specs/API_SPEC.md` section 4.5 and sections 14–16, `SDK_SPEC.md` section 4.2, `FRONTEND_SPEC.md`, `MIGRATION_SPEC.md` section 4.2.

## HTTP API Response Envelope

All L2+ `app-api`, `backend-api`, and SDKWork-owned `open-api` success JSON bodies `MUST` use `SdkWorkResponse` from `API_SPEC.md` §15:

- Envelope: `{ "data": <payload>, "requestId": "<server-uuid>" }`
- Single resource: `data.item`
- Lists: `data.items` + `data.pageInfo` (`PageInfo.mode` is `offset` or `cursor`)
- Commands: `data.accepted` plus optional `resourceId` / `status`
- Async accept (`202`): `data.operationId`, `data.status`, optional `pollUrl`

Errors `MUST` use HTTP 4xx/5xx with `application/problem+json` (`ProblemDetail`). Business failures `MUST NOT` use HTTP 2xx with `success`, `code`, or `message`.

Forbidden legacy envelopes: `PlusApiResult`, `AppbaseApiResult`, `StoreApiResult`, per-domain `*ApiResult`, bare domain DTOs at the HTTP root, and top-level `{ items, pageInfo, requestId }` without `data`.

Handlers `MUST` serialize success and map errors through `sdkwork-web-framework` response mapping. Do not hand-build envelopes in controllers or route handlers.

Generated HTTP SDKs (`--standard-profile sdkwork-v3`) unwrap `data` by default; use `.raw` only when correlation headers or the full envelope are required.

Before completing API contract or handler work, run:

```bash
node <sdkwork-specs>/tools/check-api-response-envelope.mjs --workspace <workspace-root>
```

Authority: `sdkwork-specs/API_SPEC.md` §15–§16, `WEB_FRAMEWORK_SPEC.md`, `SDK_SPEC.md` §4.1, `MIGRATION_SPEC.md` §API Response Envelope Migration.
