# @sdkwork/iam-sdk-adapter

Central adapter boundary that converts standard generated appbase app and backend SDK resource clients into the IAM port surface consumed by `@sdkwork/iam-service` and `@sdkwork/iam-runtime`.

The adapter is intentionally strict. It may normalize generated SDK response envelopes and small generated-call-shape differences, but it must not map old methods such as `auth.login`, `auth.refreshToken`, `auth.register`, or `user.getUserProfile` into appbase login ports.

Applications should pass the generated `@sdkwork/appbase-app-sdk` client as `appbaseApp` and the generated `@sdkwork/appbase-backend-sdk` client as `appbaseBackend`. Business modules should depend on the standard IAM ports, not on app-specific generated SDK constructors or method aliases.

## SDKWork Documentation Contract

Domain: iam
Capability: iam-sdk-adapter
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

- `pnpm --filter @sdkwork/iam-sdk-adapter typecheck`

### Owner And Status

Owner and lifecycle status are tracked in `specs/component.spec.json`.
