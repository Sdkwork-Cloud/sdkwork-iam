# @sdkwork/iam-application-bootstrap

Reusable IAM application bootstrap framework for SDKWork applications.

This package owns the standard **register → provision → enable → access credential** flow. It can be injected into:

- Generated backend SDK clients through `createIamApplicationBootstrapClientFromAppbaseBackendSdk`
- Port-normalized backend SDK clients through `createIamApplicationBootstrapClientFromBackend`
- `@sdkwork/iam-service` facades through `createIamApplicationBootstrapClientFromIamService`

## Usage

```ts
import {
  bootstrapApplicationFromManifest,
  createIamApplicationBootstrapClientFromAppbaseBackendSdk,
  createIamApplicationBootstrap,
  resolveBootstrapAuthFromEnv,
  resolveBootstrapEnvironmentFromEnv,
} from "@sdkwork/iam-application-bootstrap";

const client = createIamApplicationBootstrapClientFromAppbaseBackendSdk({
  baseUrl: "http://127.0.0.1:8080",
});

const bootstrap = createIamApplicationBootstrap({ client });
const result = await bootstrap.bootstrapFromManifest({
  client,
  manifest,
  manifestHash,
  auth: resolveBootstrapAuthFromEnv(),
  environment: resolveBootstrapEnvironmentFromEnv(undefined, {
    primaryDomain: "demo.local",
  }),
});
```

## Runtime Environments

- **CLI / Node tooling**: `createIamApplicationBootstrapClientFromAppbaseBackendSdk`
- **SaaS / private backend SDK runtime**: `createIamApplicationBootstrapClientFromBackend`
- **Existing IAM service runtime**: `createIamApplicationBootstrapClientFromIamService`

Environment resolution is centralized through `resolveBootstrapEnvironmentFromEnv()` and `resolveBootstrapAuthFromEnv()` so the same module works across dev, test, and production hosts.

## Verification

- `pnpm --filter @sdkwork/iam-application-bootstrap test`
- `pnpm --filter @sdkwork/iam-application-bootstrap typecheck`
