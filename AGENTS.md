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

## Build, Test, and Verification

Run commands from this directory:

- `pnpm run verify`: structure, database, IAM bootstrap, typecheck, API materialize, governance
- `pnpm run test:iam-standard-contracts`: IAM contract suite
- `cargo test --workspace`: Rust IAM crate tests
- `pnpm run db:migrate`: IAM database migrations via `sdkwork-iam-db`

## Agent Execution Rules

Do not hand-edit generated SDK output. Do not replace generated SDK calls with raw HTTP. Keep IAM domain code in this repository; platform shell code stays in `sdkwork-appbase`.
