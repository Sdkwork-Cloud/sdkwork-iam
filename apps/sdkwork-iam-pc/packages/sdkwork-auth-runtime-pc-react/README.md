# @sdkwork/auth-runtime-pc-react

Headless auth runtime composition package for SDKWORK IAM integrations.

This package belongs to `apps/sdkwork-iam-pc/packages/` and exposes non-UI runtime wiring for auth configuration, user-center deployment profiles, and development prefill resolution. UI packages consume it through package exports instead of deep-copying runtime composition logic.

## Scope

- Domain: `iam`
- Architecture: `pc-react`
- Capability: `auth-runtime`
- Root entry: `@sdkwork/auth-runtime-pc-react`

## Ownership

- Keep UI rendering in `@sdkwork/auth-pc-react` and `@sdkwork/user-center-pc-react`.
- Keep cross-framework contracts in `apps/sdkwork-iam-common/packages/`.
- Keep local/private backend parity in the Rust crates under `crates/`.
- Keep app-specific route, namespace, and branding decisions in the consuming application.

## Runtime IAM Controller

For applications that already create a standard `@sdkwork/iam-runtime`, prefer the runtime-backed controller factory instead of writing app-local auth adapters:

```ts
import { createSdkworkIamRuntimeAuthController } from "@sdkwork/auth-runtime-pc-react";

export const authController = createSdkworkIamRuntimeAuthController({
  getRuntime: getAppIamRuntime,
});
```

The runtime-backed controller keeps login, registration, verification code, password reset, OAuth, session bridge, current-session bootstrap, and logout mapped through the shared IAM runtime service. AppContext, ShardingContext, dual-token persistence, and SaaS/local backend switching remain runtime concerns, not UI concerns.

## Standard Appbase PC Auth Runtime

Applications that want the minimum PC auth integration should use `createSdkworkAppbasePcAuthRuntime`. The factory creates the appbase app SDK client, optional appbase backend SDK client, one global token manager, the IAM runtime, and binds every downstream token-manager-aware SDK client to the same manager.

```ts
import { createSdkworkAppbasePcAuthRuntime } from "@sdkwork/auth-runtime-pc-react";

export const authRuntime = createSdkworkAppbasePcAuthRuntime({
  app: {
    appId: "sdkwork-chat-pc",
    deploymentMode: "saas",
    environment: "dev",
    platform: "pc",
  },
  baseUrls: {
    appbaseAppApiBaseUrl,
    appbaseBackendApiBaseUrl,
  },
  hooks: {
    onSessionChanged: clearRealtimeAndSensitiveCaches,
  },
  sdkClients: [
    productAppSdk,
    productBackendSdk,
  ],
  sessionBridge: {
    clearSession,
    commitSession,
    readSession,
  },
});
```

Product applications provide only app identity, base URLs, optional read/commit/clear session hooks, lifecycle hooks, and downstream SDK clients. Login, registration, OAuth, refresh, current-session, logout, token persistence, AppContext persistence, ShardingContext derivation, and generated appbase SDK validation stay inside appbase packages.

### Credential-Entry Bootstrap Access Token

`createSdkworkAppbasePcAuthRuntime` wraps the IAM app SDK with `@sdkwork/iam-credential-entry` by default. Before login, registration, QR auth session creation, password reset request/completion, and equivalent anonymous credential-entry operations, the runtime:

1. Clears any stale session tokens from the global TokenManager.
2. Seeds bootstrap `accessToken` from private `process.env.SDKWORK_ACCESS_TOKEN` when present.
3. Sends `Access-Token: <JWT access_token>` through the generated SDK credential hook.

Rules:

- Tracked env templates document `SDKWORK_ACCESS_TOKEN=` with blank value per `ENVIRONMENT_SPEC.md`.
- Dev orchestrators or local bootstrap overlays generate the JWT; browser public config must not expose it through `VITE_*`.
- Applications that already wrap the IAM app SDK manually must pass `credentialEntry: { skipWrap: true }`.
- After interactive login succeeds, runtime session tokens supersede bootstrap credentials.

Shared helpers live in `@sdkwork/iam-credential-entry` (`createDevBootstrapAccessTokenJwt`, `mergeBootstrapAccessTokenEnv`) and `sdkwork-iam/scripts/dev/create-dev-bootstrap-access-token-env.mjs` (`mergeRepoDevBootstrapAccessTokenEnv` for topology dev orchestrators, `run-pc-renderer-dev-with-bootstrap.mjs` for standalone PC package `dev` scripts).

## AuthGate Route Protection

After creating the runtime-backed controller, wrap product routes with `SdkworkAuthGate` from `@sdkwork/auth-pc-react`:

```tsx
import { SdkworkAuthGate, SdkworkAuthPage } from "@sdkwork/auth-pc-react";
import { createSdkworkIamRuntimeAuthController } from "@sdkwork/auth-runtime-pc-react";

const controller = createSdkworkIamRuntimeAuthController({ getRuntime: () => authRuntime.iamRuntime });

export function AppShell() {
  return (
    <SdkworkAuthGate
      authBasePath="/auth"
      controller={controller}
      homePath="/"
      protectedPrefixes={["/workspace"]}
      renderAuthRoutes={<SdkworkAuthPage controller={controller} basePath="/auth" />}
    >
      <ProductRoutes />
    </SdkworkAuthGate>
  );
}
```

AuthGate re-bootstraps persisted session state on route changes and must not render protected children until authentication is confirmed.

## Governance

Run from `sdkwork-iam`:

```sh
pnpm run test:user-center-standard-contracts
pnpm run test:iam-standard-governance
```

## SDKWork Documentation Contract

Domain: iam
Capability: auth-runtime
Package type: react-package
Status: ready

### Public API

Public exports are declared in `specs/component.spec.json` under `contracts.publicExports`.

### Required SDK Surface

- `@sdkwork/iam-app-sdk`
- Optional `@sdkwork/iam-backend-sdk`
- Token-manager-aware downstream app/backend SDK clients supplied by the consuming application.
- Optional product session bridge hooks: `readSession`, `commitSession`, and `clearSession`.

### Configuration

Configuration keys and runtime entrypoints are declared in `specs/component.spec.json`.

### SaaS/Private/Local Behavior

This module follows the canonical standards linked from `specs/component.spec.json`, including deployment and runtime configuration rules where applicable.

### Security

Do not add secrets, live tokens, manual auth headers, or app-local credential handling to this module.

### Extension Points

Extension points are limited to declared public exports, runtime entrypoints, SDK clients, events, and config keys.

### Verification

- `pnpm exec vitest run apps/sdkwork-iam-pc/packages/sdkwork-auth-runtime-pc-react/tests/authRuntimeComposition.test.ts --config vitest.config.ts --configLoader native --pool vmThreads`
- `pnpm --filter @sdkwork/auth-runtime-pc-react typecheck`

### Owner And Status

Owner and lifecycle status are tracked in `specs/component.spec.json`.
