# SDKWork IAM Backend SDK

This SDK family is generated from the `sdkwork-iam-backend-api` authority contract for `/backend/v3/api`.

## Contract

- SDK family: `sdkwork-iam-backend-sdk`
- API authority: `sdkwork-iam-backend-api`
- API prefix: `/backend/v3/api`
- Audience: backend consoles, operators, control-plane integrations, and admin automation
- Auth mode: `Authorization: Bearer <auth_token>` plus `Access-Token: <access_token>`
- Request context: server middleware resolves `AppRequestContext`; clients must not send `X-Request-Id`

Client responsibilities:

- Construct the generated backend SDK through backend/admin bootstrap.
- Set `auth_token` and `access_token` through generated SDK auth/bootstrap APIs.
- Call typed resource methods generated from `tag + dotted operationId`.
- Never parse tokens for tenant, organization, user, operator, or permission decisions.
- Never generate or send `X-Request-Id`.
- Never replace a missing appbase backend method with raw HTTP.

Server framework responsibilities:

- Classify `/backend/v3/api` as `backend-api`.
- Resolve `AppRequestContext` through `AuthTokenParser` and `AccessTokenParser`.
- Reject inconsistent tenant, organization, user, session, or app claims.
- Execute the standard interceptor chain for CORS, method guard, cross-site request protection, SQL injection request guard, request size, rate limit, idempotency, authentication, authorization, tenant isolation, logging, audit, secure response headers, and server request identity.

## Generation

Run from `sdkwork-iam`:

```bash
pnpm run api:materialize
pnpm run sdk:generate:backend
```

Cross-platform entrypoint:

```bash
node sdks/sdkwork-iam-backend-sdk/bin/generate-sdk.mjs
```

All generated language workspaces inherit the family name:

- `sdkwork-iam-backend-sdk-typescript`
- `sdkwork-iam-backend-sdk-dart`
- `sdkwork-iam-backend-sdk-python`
- `sdkwork-iam-backend-sdk-go`
- `sdkwork-iam-backend-sdk-java`
- `sdkwork-iam-backend-sdk-kotlin`
- `sdkwork-iam-backend-sdk-swift`
- `sdkwork-iam-backend-sdk-csharp`
- `sdkwork-iam-backend-sdk-flutter`
- `sdkwork-iam-backend-sdk-rust`
- `sdkwork-iam-backend-sdk-php`
- `sdkwork-iam-backend-sdk-ruby`

The wrapper calls `..\sdkwork-sdk-generator\bin\sdkgen.js` with `--standard-profile sdkwork-v3`.

## SDKWork Documentation Contract

Domain: platform
Capability: iam-backend-sdk
Package type: sdk-family
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

- `pnpm run verify`
- `node tools/generators/materialize-iam-v3-openapi-boundaries.mjs`
- `node sdks/sdkwork-iam-backend-sdk/bin/generate-sdk.mjs`

### Owner And Status

Owner and lifecycle status are tracked in `specs/component.spec.json`.
