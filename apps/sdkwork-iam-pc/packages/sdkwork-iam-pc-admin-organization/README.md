# @sdkwork/iam-pc-admin-organization

Reusable backend-admin organization and department-structure capability for SDKWork PC applications.

The package exposes organization directory and organization-structure workspaces over the common `SdkworkIamService`. It centralizes organization and department trees, organization memberships, department assignments, positions, role bindings, pagination state, and selected organization context while keeping the generated IAM backend SDK injected by the host application.

## Standard Surface

- `createSdkworkIamOrganizationController(serviceOrInput)`
- `SdkworkIamOrganizationAdminWorkspace`
- `SdkworkIamOrganizationStructureWorkspace`
- `listOrganizations(params)`
- `buildOrganizationTree(organizations?)`
- `selectOrganization(organizationId)`
- `listDepartments(organizationId, params)`
- `buildDepartmentTree(departments?)`
- `createDepartment(body)` / `updateDepartment(departmentId, body)` / `deleteDepartment(departmentId)`
- `listMemberships(organizationId, params)`
- `addMembership(organizationId, body)`
- `listDepartmentAssignments(departmentId, params)`
- `createDepartmentAssignment(body)` / `updateDepartmentAssignment(assignmentId, body)`
- `getState()`

This package must not create raw HTTP clients, manually assemble auth headers, or import a concrete generated SDK.

## Organization Structure Route

The host-owned route is declared by `IAM_PC_ADMIN_ORGANIZATION_ROUTES.structurePath`:

```text
/admin/iam/organizations/:organizationId/structure
```

The route requires `iam.organizations.read`, `iam.departments.read`, and `iam.assignments.read` in `all` mode. Department controls use the exact create, update, and delete permissions; assignment controls use the available create and update permissions.

Department assignment removal is intentionally unavailable. The IAM permission catalog contains the reserved `iam.assignments.deactivate` permission, but the current backend OpenAPI and composed SDK expose no matching deactivate or delete operation.

## SDKWork Documentation Contract

Domain: iam
Capability: iam-organization
Package type: react-package
Status: standard

### Public API

Public exports are declared in `specs/component.spec.json` under `contracts.publicExports`.

### Required SDK Surface

- `@sdkwork/iam-backend-sdk`, consumed through the injected `SdkworkIamService` backend-admin boundary declared in `specs/component.spec.json`.

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
