# SDKWork IAM Workspace Component Specs

This directory is the local standards index for `@sdkwork/iam-workspace`.

Root SDKWork standards remain authoritative. Local component specs can narrow or document this component, but they must not contradict [the root standards](../sdkwork-specs/README.md).

## Component

| Field | Value |
| --- | --- |
| Name | `@sdkwork/iam-workspace` |
| Type | `multi-surface-workspace` |
| Root | `sdkwork-iam` |
| Domain | `iam` |
| Capability | `workspace` |
| Languages | `typescript`, `react`, `rust` |
| Status | `standardizing` |

## Contract Manifest

- [component.spec.json](./component.spec.json) is the machine-readable component contract.
- Consumers integrate through public exports, runtime entrypoints, SDK clients, or adapters declared in the manifest.

## Surface completeness

- [IAM_SURFACE_COMPLETENESS.yaml](./IAM_SURFACE_COMPLETENESS.yaml) tracks database, API, SDK, and client-surface maturity across PC, H5, and Flutter.

## Verification

- `pnpm run check:pnpm-scripts`
- `pnpm run check:structure`
- `pnpm run check:database`
- `pnpm run check:iam-application-bootstrap`
- `pnpm run typecheck`
- `pnpm run api:materialize`
- `pnpm run test:governance-node`
- `pnpm run test:iam-standard-contracts` for IAM TypeScript and Rust integration parity (PostgreSQL integration tests require `.env.postgres`; without it, app-api HTTP standard tests still run)
- `pnpm run test:iam-standard-governance` for IAM governance contract coverage
- `pnpm run test:user-center-standard-contracts` for user-center upstream dispatch parity
- `pnpm run test:workspace-vitest` for package-level Vitest coverage
