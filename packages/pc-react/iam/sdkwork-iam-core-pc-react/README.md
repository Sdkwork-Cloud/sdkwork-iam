# @sdkwork/iam-core-pc-react

Domain: iam
Capability: iam-core
Package type: service
Status: standard

`@sdkwork/iam-core-pc-react` is the canonical IAM service facade for SDKWork Tauri + React applications. It defines the stable service surface that reusable UI modules consume while generated app/backend SDK clients remain injectable.

## Public API

- `createSdkworkIamService(input)`
- `assertIamAppSdkClient(client)` / `assertIamBackendSdkClient(client)`
- `SDKWORK_IAM_CORE_DOMAIN_RECORD`
- `SDKWORK_IAM_CORE_MODULE`
- IAM client surface, domain model, capability, session, user, tenant, organization, and permission types

For application login/runtime wiring, use `@sdkwork/auth-runtime-pc-react` (`createSdkworkAppbasePcAuthRuntime`) instead of calling `createIamRuntime` or SDK adapters directly.

## Required SDK Surface

```ts
client.auth.sessions.create(body)
client.auth.sessions.current.retrieve()
client.auth.sessions.refresh(body)
client.auth.sessions.current.delete()
client.iam.users.current.retrieve()
backendClient.iam.tenants.list(params)
backendClient.iam.organizationMemberships.create({ organizationId, userId })
backendClient.iam.roles.permissions.delete(roleId, permissionId)
```

## Configuration

```ts
const iam = createSdkworkIamService({
  appbaseAppClient,
  appbaseBackendClient,
  commitSession,
  clearSession,
});
```

If a generated client already exposes the standard appbase SDK resource surface but returns SDK response envelopes, normalize those envelopes at the adapter boundary through `@sdkwork/iam-sdk-adapter` before passing clients into `createSdkworkIamService`:

```ts
import { createIamSdkAdapters } from "@sdkwork/iam-sdk-adapter";

const clients = createIamSdkAdapters({
  appbaseApp,
  appbaseBackend,
});

const iam = createSdkworkIamService({
  appbaseAppClient: clients.appbaseApp,
  appbaseBackendClient: clients.appbaseBackend,
});
```

The adapter must not map legacy methods such as `auth.login`, `auth.refreshToken`, `auth.register`, or `user.getUserProfile` into appbase login ports. Fix `sdkwork-appbase-app-api`, OpenAPI, and SDK generation instead.

`appbaseAppClient` owns login, session creation, OAuth, password reset, verification code, and current-user self-service APIs. It must be the generated `@sdkwork/appbase-app-sdk` client or a strict adapter over that generated appbase app SDK resource surface. `appbaseBackendClient` owns administration and IAM management resources through `@sdkwork/appbase-backend-sdk`. Backend management calls do not fall back to `appbaseAppClient.iam`; this keeps app API and backend API boundaries explicit.

## SaaS/Private/Local Behavior

SaaS Java, private Java/Rust, and local Rust deployments must provide clients with the same resource-style method shape. Client construction belongs in runtime/bootstrap, not this package.

## Security

Protected flows use the SDKWork dual token model:

- `Authorization: Bearer <auth_token>`
- `Access-Token: <access_token>`

This package stores token values only through injected callbacks. It does not assemble raw HTTP headers.

## Verification

```bash
pnpm run test:workspace-vitest run packages/pc-react/iam/sdkwork-iam-core-pc-react/tests/iam-core.service.test.ts
```

## SDKWork Documentation Contract

Domain: iam
Capability: iam-core
Package type: react-package
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

- `pnpm --filter @sdkwork/iam-core-pc-react typecheck`

### Owner And Status

Owner and lifecycle status are tracked in `specs/component.spec.json`.
