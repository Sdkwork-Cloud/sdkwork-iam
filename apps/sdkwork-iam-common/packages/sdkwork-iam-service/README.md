# @sdkwork/iam-service

Framework-independent IAM service facade.

The service composes generated app/backend SDK clients through ports:

- Session creation, current session, logout, refresh, OAuth, QR auth, password reset, verification code, and runtime metadata always use `appbaseAppClient`, which must be the generated `@sdkwork/iam-app-sdk` client or an approved adapter over it.
- Administrative IAM resources use `appbaseBackendClient` from `@sdkwork/iam-backend-sdk` when provided.
- Backend OAuth administration (`service.iam.oauth.*`: integrations, provider catalog, surfaces, clients, secrets, scope profiles, claim mappings, webhooks, flow configs, policies, tenant bindings, operator platforms, diagnostic runs, resource accounts, resource authorizations, operational resources, account links, grants, callback events) uses the backend SDK through `@sdkwork/iam-sdk-adapter`.
- Relying-party authorization-server registration uses `service.iam.tenantApplications.update` with `runtimeConfig.oauth.relyingParty` (see `IAM_OAUTH_SPEC.md` §4.2).
- Current user self-service stays on the app SDK.
- Session normalization requires both `authToken` and `accessToken`.
- `commitSession(session)` is used for new session creation flows such as login, registration, and OAuth session creation.
- `commitSession(session, { preserveRefreshToken: true })` is used only for current-session retrieval/update and refresh continuation, so the runtime may retain the existing refresh token when appbase returns rotated access/auth tokens without a new refresh token.

No React, Tauri, browser storage, or app-specific SDK package is imported here.

## SDKWork Documentation Contract

Domain: iam
Capability: iam-service
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

- `pnpm --filter @sdkwork/iam-service typecheck`

### Owner And Status

Owner and lifecycle status are tracked in `specs/component.spec.json`.
