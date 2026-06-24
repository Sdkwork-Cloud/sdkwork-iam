# @sdkwork/iam-contracts

Canonical IAM contracts for SDKWork foundation modules.

This package owns stable IAM constants and types shared by SaaS Java, Rust local/private, generated SDKs, and frontend modules:

- API prefixes, paths, tags, and dotted `operationId` values (including `iam.oauth.*` backend management routes).
- Dual-token header names.
- `AppContext` and `ShardingContext` models.
- Canonical `iam_` database table names.
- Auth runtime metadata resolution (`auth-runtime-metadata.ts`, `resolveSdkworkAuthRuntimeConfigFromMetadata`) per `IAM_OAUTH_SPEC.md` §5.

It has no UI, network, storage, or generated SDK dependency.

## SDKWork Documentation Contract

Domain: iam
Capability: iam-contracts
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

- `pnpm --filter @sdkwork/iam-contracts typecheck`

### Owner And Status

Owner and lifecycle status are tracked in `specs/component.spec.json`.
