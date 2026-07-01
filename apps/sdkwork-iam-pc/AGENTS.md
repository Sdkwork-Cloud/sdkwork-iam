# SDKWork IAM PC Application Root

## Identity

`sdkwork-iam-pc` hosts reusable IAM PC React packages for the `sdkwork-iam` domain workspace. It is a module host root, not a standalone product application.

## Required Specs

- `../../sdkwork-specs/APP_PC_ARCHITECTURE_SPEC.md`
- `../../sdkwork-specs/APP_PC_REACT_UI_SPEC.md`
- `../../sdkwork-specs/APP_COMPOSITION_SPEC.md`
- `../../sdkwork-specs/IAM_SPEC.md`
- `../../sdkwork-specs/IAM_OAUTH_SPEC.md`
- `../../sdkwork-specs/IAM_LOGIN_INTEGRATION_SPEC.md`
- `../../sdkwork-specs/BACKEND_UI_SPEC.md`

## Layout

- `packages/`: IAM PC React packages split by surface:
  - **App** (`sdkwork.architecture = pc-react`): `sdkwork-iam-pc-core`, auth, user-center, and related app modules
  - **Backend-admin** (`sdkwork.architecture = pc-admin`): `sdkwork-iam-pc-admin-core`, `sdkwork-iam-pc-admin-shell`, and capability packages `sdkwork-iam-pc-admin-{oauth,tenant,organization,permission,account-binding}`
- `docs/PACKAGE_SURFACES.md`: app vs console vs admin naming for this PC root
- `specs/component.spec.json`: component contract and SDK client families
- Core package composition entrypoints: `packages/sdkwork-iam-pc-core/src/composition/`
- Cross-architecture IAM contracts/runtime: `../../apps/sdkwork-iam-common/packages/`

## Verification

Run from repository root:

- `pnpm run check:structure`
- `pnpm run test:iam-standard-contracts`
- `pnpm run typecheck`
