# @sdkwork/iam-credential-entry

SDKWork IAM credential-entry bootstrap transport for login, registration, QR auth, password reset, and equivalent anonymous appbase operations.

## Scope

- Read private bootstrap `SDKWORK_ACCESS_TOKEN` from process env.
- Prepare credential-entry TokenManager state before anonymous IAM SDK calls.
- Wrap IAM app SDK credential-entry methods so bootstrap `Access-Token` is sent automatically.
- Generate disposable development and explicitly isolated-test bootstrap JWT values from manifest identity.
- Inject private development bootstrap credentials through one Vite serve-only HTML handoff.
- Fail closed when staging or production orchestration has no privately provisioned token.

## Public API

- `SDKWORK_ACCESS_TOKEN_ENV_KEY`
- `readBootstrapAccessTokenFromProcessEnv`
- `prepareCredentialEntryTokens`
- `wrapCredentialEntryClient`
- `createDevBootstrapAccessTokenJwt`
- `mergeBootstrapAccessTokenEnv`
- `mergeRepoDevBootstrapAccessTokenEnv` (Node dev orchestrator helper in `sdkwork-iam/scripts/dev/create-dev-bootstrap-access-token-env.mjs`)
- `mergeRepoBootstrapAccessTokenEnv` (environment-aware Node orchestrator helper)
- `createSdkworkCredentialEntryBootstrapVitePlugin` from `@sdkwork/iam-credential-entry/vite`
- `readBootstrapAccessTokenEnvFile` from `@sdkwork/iam-credential-entry/node-bootstrap`
- `resolveAppIdFromManifest`, `resolveTenantIdFromManifest`, `resolveOrganizationIdFromManifest`

## Usage

Product applications normally consume this package through `createSdkworkAppbasePcAuthRuntime` in `@sdkwork/auth-runtime-pc-react`.

Application dev orchestrators may import `sdkwork-iam/scripts/dev/create-dev-bootstrap-access-token-env.mjs` to inject bootstrap env before starting Vite or desktop renderers.

The environment-aware helper preserves configured credentials in all four lifecycle environments. It generates only for `development`, or for `test` when `allowTestTokenGeneration` is explicitly enabled. Missing staging and production credentials fail closed and must be supplied by a private runtime secret source. The Vite plugin injects only during development serve; it never embeds staging or production credentials in static artifacts.

The browser-facing package entry depends only on the pure bootstrap-token core. Manifest and private env-file I/O stay behind the Node-only subpath, so browser bundles do not pull `node:fs` or `node:path` compatibility shims.

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
