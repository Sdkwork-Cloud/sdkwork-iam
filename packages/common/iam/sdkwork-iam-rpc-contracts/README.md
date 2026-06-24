# SDKWork IAM RPC Contracts

Canonical IAM proto contracts for SDKWork app and backend RPC surfaces.

The app package owns login/session/current-user flows. The backend package owns
operator/admin IAM management services. Backend RPC must not expose session
creation or user-facing auth flows.

Authoritative proto sources live under `apis/rpc/iam/` and are materialized into
this package by `tools/generators/materialize-appbase-rpc-proto-boundaries.mjs`.

## SDKWork Documentation Contract

Domain: iam
Capability: app
Package type: node-package
Status: standardizing

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

- `pnpm run check:workspace`
- `node tools/generators/materialize-appbase-rpc-proto-boundaries.mjs`

### Owner And Status

Owner and lifecycle status are tracked in `specs/component.spec.json`.
