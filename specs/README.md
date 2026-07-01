# SDKWork IAM Workspace Component Specs

This directory is the local standards index for `@sdkwork/iam-workspace`.

Root SDKWork standards remain authoritative. Local component specs can narrow or document this component, but they must not contradict [the root standards](../sdkwork-specs/README.md).

## Component

| Field | Value |
| --- | --- |
| Name | `@sdkwork/iam-workspace` |
| Type | `domain-workspace` |
| Root | `sdkwork-iam` |
| Domain | `iam` |
| Capability | `iam` |
| Languages | `typescript`, `react`, `rust` |
| Status | `standard` |

## Contract Manifest

- [component.spec.json](./component.spec.json) is the machine-readable component contract.
- [topology.spec.json](./topology.spec.json) defines IAM gateway deployment topology.
- Consumers integrate through public exports, runtime entrypoints, SDK clients, or adapters declared in the manifest.

## Surface completeness

- [IAM_SURFACE_COMPLETENESS.yaml](./IAM_SURFACE_COMPLETENESS.yaml) tracks database, API, SDK, and client-surface maturity across PC, H5, and Flutter.

## Verification

- `pnpm run check:pnpm-scripts`
- `pnpm run check:structure`
- `pnpm run check:database`
- `pnpm run check:iam-application-bootstrap`
- `pnpm run check:app-composition`
- `pnpm run check:api-envelope`
- `pnpm run check:gateway-assembly`
- `pnpm run typecheck`
- `pnpm run api:materialize`
- `pnpm run test:governance-node`
- `pnpm run test:rust-workspace` for governed Rust workspace tests (PostgreSQL integration suites run only when `.env.postgres` or claw-router profile is present)
- `pnpm run verify` runs the merge-ready aggregate above
- `.github/workflows/iam-quality-gate.yml` runs `pnpm check`, `pnpm test:governance-node`, `pnpm test:iam-standard-contracts`, and `pnpm test:rust-workspace` on push and pull request
- `pnpm run test:iam-standard-contracts` for IAM TypeScript and Rust integration parity (PostgreSQL integration tests require `.env.postgres`; includes `iam_local_app_router_test`)
- `pnpm run test:iam-standard-governance` for IAM governance contract coverage
- `pnpm run test:user-center-standard-contracts` for user-center upstream dispatch parity
- `pnpm run test:workspace-vitest` for package-level Vitest coverage
