# @sdkwork/iam-permission-pc-react

Reusable IAM authorization foundation for appbase PC React applications.

The package exposes role, permission, policy, role-permission, and scoped role-binding controllers over `SdkworkIamService`. It is a shared application-layer boundary for fast app integration and SDK switching.

## Standard Surface

- `createSdkworkIamPermissionController(serviceOrInput)`
- `listRoles(params)`
- `listPermissions(params)`
- `listPolicies(params)`
- `listRoleBindings(params)`
- `listRolePermissions(roleId, params)`
- `assignRoleBinding(body)`
- `assignRolePermission(roleId, permissionId)`
- `revokeRoleBinding(roleBindingId)`
- `revokeRolePermission(roleId, permissionId)`
- `can(hint)`

This package must not create raw HTTP clients, manually assemble auth headers, or import a concrete generated SDK.

## SDKWork Documentation Contract

Domain: iam
Capability: iam-permission
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

- `pnpm --filter @sdkwork/iam-permission-pc-react typecheck`

### Owner And Status

Owner and lifecycle status are tracked in `specs/component.spec.json`.
