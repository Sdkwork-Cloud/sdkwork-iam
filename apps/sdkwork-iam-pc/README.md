# sdkwork-iam-pc

PC browser/desktop/tablet application root for reusable IAM React modules.

This root follows `APP_PC_ARCHITECTURE_SPEC.md` and `APP_PC_REACT_UI_SPEC.md`. Packages under `packages/` are shared IAM capability modules consumed by product PC applications such as `sdkwork-im-pc`, not a standalone product shell.

## Standard ownership

- Cross-architecture contracts/runtime: `../../apps/sdkwork-iam-common/packages/*`
- `sdkwork-iam-pc-core`: app-surface dependency composition entry and reusable-module registry
- `sdkwork-iam-react`: React provider and hooks over the common IAM runtime
- `sdkwork-auth-pc-react`, `sdkwork-auth-runtime-pc-react`: login/session UI and auth runtime composition
- `sdkwork-user-pc-react`, `sdkwork-user-center-pc-react`, `sdkwork-user-center-core-pc-react`, `sdkwork-user-center-validation-pc-react`: user-center surfaces and contracts
- `sdkwork-iam-core-pc-react`: compatibility aggregation export boundary
- **Backend-admin** (`sdkwork-iam-pc-admin-*`): `@sdkwork/iam-pc-admin-core`, `@sdkwork/iam-pc-admin-shell`, and capability packages for OAuth, tenant, organization, permission, and account-binding administration

## Related specs

- Package surface naming (app / console / admin): `docs/PACKAGE_SURFACES.md`
- Repository specs: `../../specs/README.md`
- Dependency composition: `specs/dependency.composition.json`
- IAM domain: `../../sdkwork-specs/IAM_SPEC.md`
- IAM login integration: `../../sdkwork-specs/IAM_LOGIN_INTEGRATION_SPEC.md`
