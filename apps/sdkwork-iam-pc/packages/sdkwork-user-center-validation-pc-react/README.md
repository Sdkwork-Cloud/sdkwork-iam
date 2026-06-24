# @sdkwork/user-center-validation-pc-react

Independent validation plugin for the canonical SDKWork user-center standard.

This package depends on `@sdkwork/user-center-core-pc-react` and converts the user-center bridge into a dedicated validation capability. The validation plugin is responsible for:

- governed header names for `Authorization`, `Access-Token`, `Refresh-Token`, session, and handshake transport
- protected token resolution with canonical precedence
- dependency-aware validation plugin manifests
- exposing the active auth mode, validation strategy, cache policy, secret-resolution policy, and handshake policy as a standalone validation contract
- exposing a provider-agnostic interop contract that services can compare before they trust each other's login validation semantics

The independent validation plugin does not redefine the user system. It depends on the user-center bridge and reads the governed auth contract from that dependency so host applications keep one source of truth for login validation and upstream handshake behavior.
Its exported validation snapshot includes the canonical secret-resolution policy and the governed handshake freshness policy, allowing service middleware and local-private deployments to verify `AuthToken` and `AccessToken` requests without re-deriving provider secret rules from application code.

Use `createUserCenterValidationInteropContract` when a gateway, local authority, or upstream bridge needs a provider-agnostic view of the governed auth semantics. The interop contract intentionally excludes deployment-specific fields such as provider identity and cache TTLs, and focuses on the fields that must match for login validation to remain interoperable:

- auth mode and validation strategy
- dual-token authorization and `Access-Token` header semantics
- token header names and authorization scheme
- secret resolver kind, resolution scope, and governed tenant or organization claim keys
- handshake enablement, mode, freshness policy, and governed header names

Use `diffUserCenterValidationInteropContract` to collect structured mismatches and `assertUserCenterValidationInteropContract` to fail fast when two deployments disagree on those semantics.
Use `createUserCenterValidationPreflightReport` when a local deployment needs a standard preflight result before it trusts a peer or upstream validation contract. Pair the local validation snapshot with the peer interop contract and the report returns the normalized local contract, the peer contract, and the structured diff. Use `assertUserCenterValidationPreflightCompatibility` for fail-closed startup, gateway, or sidecar bootstraps where mismatched `AuthToken` and `AccessToken` semantics must stop the connection immediately.

For thin application wrappers that already use `createSdkworkCanonicalUserCenterDefinition(...)` from `@sdkwork/user-center-core-pc-react`:

- use `createSdkworkCanonicalUserCenterValidationDefinition(...)` to bind validation defaults such as package names and title to that same user-center definition
- call `definition.createSnapshot(...)`, `definition.createInteropContract(...)`, `definition.createPluginDefinition(...)`, and `definition.createServerPluginDefinition(...)` from the app package instead of rebuilding validation defaults locally
- keep protected-token semantics and preflight checks in this package so app wrappers only carry namespace and package metadata

## SDKWork Documentation Contract

Domain: iam
Capability: user-center-validation
Package type: react-package
Status: ready

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

- `pnpm --filter @sdkwork/user-center-validation-pc-react typecheck`

### Owner And Status

Owner and lifecycle status are tracked in `specs/component.spec.json`.
