# @sdkwork/iam-runtime

Runtime bootstrap for IAM modules.

The runtime owns:

- SaaS/local/private deployment mode.
- Dev/test/prod environment selection.
- One global `AuthTokenManager` for the authenticated session context.
- Token store and context store adapters.
- Dual-token request header generation from the global token manager.
- Session-to-`AppContext` and `ShardingContext` propagation.
- Ordered session commit and logout clearing for appbase login/session APIs.

Applications provide the generated `@sdkwork/iam-app-sdk` client as `clients.appbaseApp`.
Login, registration, refresh, current session validation, logout, OAuth, QR auth,
password reset, and verification-code operations always go through that appbase
app SDK client.

Applications may provide `@sdkwork/iam-backend-sdk` as `clients.appbaseBackend`
for IAM management operations. Other app SDKs and backend SDKs must be passed in
`clients.sdkClients` only so the runtime can inject the same `tokenManager`.
They must not own login, parse tokens, or persist their own session state.

## Session Commit Standard

Login, registration, OAuth session creation, refresh, current-session retrieval,
and current-session update commit through one runtime-owned lifecycle:

1. Validate the appbase session payload.
2. Persist normalized `accessToken`, `authToken`, and `refreshToken` in the token store.
3. Write the returned `AppContext` to the context store, or clear stale context when the session has no context.
4. Sync the global token manager only after token and context persistence finishes.

New session flows such as login, registration, and OAuth session creation replace
the token store. They must not inherit an old `refreshToken` when appbase does
not return one. Current-session retrieval/update and refresh continuation may
preserve the stored `refreshToken` when appbase returns rotated access/auth
tokens without a new refresh token.

If token persistence fails, the global token manager is not updated. If context
propagation fails after token persistence, the runtime clears the token manager,
token store, and context store before rethrowing the failure. Logout always clears
local token/context state in a `finally` path, even when remote session deletion
fails.

```ts
import { createClient as createAppbaseAppClient } from "@sdkwork/iam-app-sdk";
import { createClient as createAppbaseBackendClient } from "@sdkwork/iam-backend-sdk";
import { createIamRuntime, createMemoryIamTokenStore } from "@sdkwork/iam-runtime";

const appbaseApp = createAppbaseAppClient({ baseUrl: appApiBaseUrl });
const appbaseBackend = createAppbaseBackendClient({ baseUrl: backendApiBaseUrl });
const productAppSdk = createProductAppSdk({ baseUrl: productAppApiBaseUrl });
const productBackendSdk = createProductBackendSdk({ baseUrl: productBackendApiBaseUrl });

const runtime = createIamRuntime({
  clients: {
    appbaseApp,
    appbaseBackend,
    sdkClients: [productAppSdk, productBackendSdk],
  },
  config,
  tokenStore: createMemoryIamTokenStore(),
});

await runtime.service.auth.sessions.create({ username, password });
```

## SDKWork Documentation Contract

Domain: iam
Capability: iam-runtime
Package type: node-package
Status: standard

### Public API

Public exports are declared in `specs/component.spec.json` under `contracts.publicExports`.

### Required SDK Surface

- None declared in `specs/component.spec.json`.

### Configuration

Configuration keys and runtime entrypoints are declared in `specs/component.spec.json`.

### SaaS/Private/Local Behavior

This module follows the canonical standards linked from `specs/component.spec.json`, including deployment and runtime configuration rules where applicable.

### Security

Do not add secrets, live tokens, manual auth headers, or app-local credential handling to this module.

### Extension Points

Extension points are limited to declared public exports, runtime entrypoints, SDK clients, events, and config keys.

### Verification

- `pnpm --filter @sdkwork/iam-runtime typecheck`

### Owner And Status

Owner and lifecycle status are tracked in `specs/component.spec.json`.
