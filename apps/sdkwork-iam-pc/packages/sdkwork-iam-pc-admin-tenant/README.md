# @sdkwork/iam-pc-admin-tenant

Reusable tenant foundation for appbase PC React applications.

This package is intentionally transport-free. It consumes `SdkworkIamService` from `@sdkwork/iam-service`, so host applications can switch between SaaS Java, private Java/Rust, local Rust, or app-specific generated SDKs without changing tenant UI/controller code.

## Standard Surface

- `createSdkworkIamTenantController(serviceOrInput)`
- `listTenants(params)`
- `listTenantMembers(tenantId, params)`
- `selectTenant(tenantId)`
- `getSelectedTenant()`
- `getState()`

Protected calls are delegated to the common IAM service and use the canonical dual-token model:

- `Authorization: Bearer <auth_token>`
- `Access-Token: <access_token>`

This package must not create raw HTTP clients, manually assemble headers, or import a concrete generated SDK.

## SDKWork Documentation Contract

Domain: iam
Capability: iam-tenant
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

- `pnpm --filter @sdkwork/iam-pc-admin-tenant typecheck`

### Owner And Status

Owner and lifecycle status are tracked in `specs/component.spec.json`.
