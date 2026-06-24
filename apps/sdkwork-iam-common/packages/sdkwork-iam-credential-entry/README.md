# @sdkwork/iam-credential-entry

SDKWork IAM credential-entry bootstrap transport for login, registration, QR auth, password reset, and equivalent anonymous appbase operations.

## Scope

- Read private bootstrap `SDKWORK_ACCESS_TOKEN` from process env.
- Prepare credential-entry TokenManager state before anonymous IAM SDK calls.
- Wrap IAM app SDK credential-entry methods so bootstrap `Access-Token` is sent automatically.
- Generate development bootstrap access-token JWT values from manifest identity.

## Public API

- `SDKWORK_ACCESS_TOKEN_ENV_KEY`
- `readBootstrapAccessTokenFromProcessEnv`
- `prepareCredentialEntryTokens`
- `wrapCredentialEntryClient`
- `createDevBootstrapAccessTokenJwt`
- `mergeBootstrapAccessTokenEnv`
- `mergeRepoDevBootstrapAccessTokenEnv` (Node dev orchestrator helper in `sdkwork-iam/scripts/dev/create-dev-bootstrap-access-token-env.mjs`)
- `resolveAppIdFromManifest`, `resolveTenantIdFromManifest`, `resolveOrganizationIdFromManifest`

## Usage

Product applications normally consume this package through `createSdkworkAppbasePcAuthRuntime` in `@sdkwork/auth-runtime-pc-react`.

Application dev orchestrators may import `sdkwork-iam/scripts/dev/create-dev-bootstrap-access-token-env.mjs` to inject bootstrap env before starting Vite or desktop renderers.

Standalone PC packages should route `dev` through `sdkwork-iam/scripts/dev/run-pc-renderer-dev-with-bootstrap.mjs` when no topology orchestrator owns renderer startup.

## Governance

- `IAM_LOGIN_INTEGRATION_SPEC.md`
- `ENVIRONMENT_SPEC.md`
- `sdkwork-iam/tests/static/governance/credential-entry-runtime-standard.test.mjs`
- `sdkwork-iam/tests/static/governance/iam-renderer-dev-bootstrap-orchestration-standard.test.mjs`

## Verification

```sh
pnpm --dir apps/sdkwork-iam-common/packages/sdkwork-iam-credential-entry test
node tests/static/governance/credential-entry-runtime-standard.test.mjs
```
