# @sdkwork/iam-pc-admin-organization

Reusable organization foundation for appbase PC React applications.

The package exposes an organization controller over the common `SdkworkIamService`. It keeps tree building, selected organization state, and organization membership administration centralized while allowing every independent app to inject a different generated app/backend SDK pair at runtime.

## Standard Surface

- `createSdkworkIamOrganizationController(serviceOrInput)`
- `listOrganizations(params)`
- `buildOrganizationTree(organizations?)`
- `selectOrganization(organizationId)`
- `listMemberships(organizationId, params)`
- `addMembership(organizationId, body)`
- `getState()`

This package must not create raw HTTP clients, manually assemble auth headers, or import a concrete generated SDK.

## SDKWork Documentation Contract

Domain: iam
Capability: iam-organization
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

- `pnpm --filter @sdkwork/iam-pc-admin-organization typecheck`

### Owner And Status

Owner and lifecycle status are tracked in `specs/component.spec.json`.
