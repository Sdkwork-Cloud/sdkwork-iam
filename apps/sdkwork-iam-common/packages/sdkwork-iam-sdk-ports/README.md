# @sdkwork/iam-sdk-ports

Generated SDK port contracts for IAM.

This package defines the generated client surface that reusable IAM modules consume. It deliberately does not import any app-specific SDK package. Applications inject generated SDK clients that match:

```ts
client.auth.sessions.create(body)
client.auth.sessions.current.retrieve()
client.iam.users.current.retrieve()
client.iam.roles.permissions.delete(roleId, permissionId)
```

Backend SDK clients must not expose auth session creation.

## SDKWork Documentation Contract

Domain: iam
Capability: iam-sdk-ports
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

- `pnpm --filter @sdkwork/iam-sdk-ports typecheck`

### Owner And Status

Owner and lifecycle status are tracked in `specs/component.spec.json`.
