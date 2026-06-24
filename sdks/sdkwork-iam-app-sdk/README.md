# SDKWork IAM App SDK

This SDK family is generated from the `sdkwork-iam-app-api` authority contract for `/app/v3/api`.

## Contract

- SDK family: `sdkwork-iam-app-sdk`
- API authority: `sdkwork-iam-app-api`
- API prefix: `/app/v3/api`
- Audience: app, desktop, mobile, H5, and user-facing clients
- Auth mode: `Authorization: Bearer <auth_token>` plus `Access-Token: <access_token>` for protected operations
- Request context: server middleware resolves `AppRequestContext`; clients must not send `X-Request-Id`

Client responsibilities:

- Construct the generated SDK through application bootstrap.
- Set `auth_token` and `access_token` through generated SDK auth/bootstrap APIs.
- Call typed resource methods generated from `tag + dotted operationId`.
- Never parse tokens for tenant, organization, or user decisions.
- Never generate or send `X-Request-Id`.
- Never replace a missing appbase method with raw HTTP.

Server framework responsibilities:

- Classify `/app/v3/api` as `app-api`.
- Resolve `AppRequestContext` through `AuthTokenParser` and `AccessTokenParser`.
- Reject inconsistent tenant, organization, user, session, or app claims.
- Execute the standard interceptor chain for CORS, method guard, cross-site request protection, SQL injection request guard, request size, rate limit, idempotency, authentication, authorization, tenant isolation, logging, audit, secure response headers, and server request identity.

## Generation

Run from `sdkwork-iam`:

```bash
pnpm run api:materialize
pnpm run sdk:generate:app
```

Cross-platform entrypoint:

```bash
node sdks/sdkwork-iam-app-sdk/bin/generate-sdk.mjs
```

All generated language workspaces inherit the family name:

- `sdkwork-iam-app-sdk-typescript`
- `sdkwork-iam-app-sdk-dart`
- `sdkwork-iam-app-sdk-python`
- `sdkwork-iam-app-sdk-go`
- `sdkwork-iam-app-sdk-java`
- `sdkwork-iam-app-sdk-kotlin`
- `sdkwork-iam-app-sdk-swift`
- `sdkwork-iam-app-sdk-csharp`
- `sdkwork-iam-app-sdk-flutter`
- `sdkwork-iam-app-sdk-rust`
- `sdkwork-iam-app-sdk-php`
- `sdkwork-iam-app-sdk-ruby`

The wrapper calls `..\sdkwork-sdk-generator\bin\sdkgen.js` with `--standard-profile sdkwork-v3`.

## SDKWork Documentation Contract

Domain: platform
Capability: iam-app-sdk
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
- `node sdks/sdkwork-iam-app-sdk/bin/generate-sdk.mjs`

### Owner And Status

Owner and lifecycle status are tracked in `specs/component.spec.json`.
