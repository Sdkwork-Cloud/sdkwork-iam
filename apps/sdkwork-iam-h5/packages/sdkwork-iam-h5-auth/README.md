# @sdkwork/iam-h5-auth

H5/mobile React authentication capability for `sdkwork-iam-h5`.

- Package pattern: `sdkwork-iam-h5-auth` (`APP_H5_ARCHITECTURE_SPEC.md`)
- API surface: app-api via `@sdkwork/iam-app-sdk` through `@sdkwork/iam-service`
- Login context selection: personal login uses `loginScope=TENANT` with `organizationId=0`; organization login uses `loginScope=ORGANIZATION` with a non-zero organization id returned by appbase
- Exports: `createSdkworkIamH5AuthController`, `SdkworkIamH5AuthLoginScreen`, `SdkworkIamH5AuthLoginContextSelectionScreen`, `IAM_H5_AUTH_ROUTES`

## Verification

```bash
pnpm --filter @sdkwork/iam-h5-auth typecheck
pnpm exec vitest run apps/sdkwork-iam-h5/packages/sdkwork-iam-h5-auth/tests --config vitest.config.ts --configLoader native --pool vmThreads
```
