# @sdkwork/iam-pc-admin-audit

Read-only backend-admin surfaces for `auditEvents.list` and `securityEvents.list`.

## Contracts

- Consumes `@sdkwork/iam-service` through `createSdkWorkPagedListSession` (`@sdkwork/iam-contracts`).
- Backend OpenAPI: typed list (`SdkWorkAuditEventListResponse`, `SdkWorkSecurityEventListResponse`) and retrieve (`SdkWorkAuditEventResourceResponse`, `SdkWorkSecurityEventResourceResponse`) with `detailJson` on retrieve only.
- Menu permission: `iam.audit_events` plus `iam.security_events` (`additionalPermissionPrefixes`).

## UX

- Debounced server-side `q` search.
- Click a row to retrieve and display `detailJson` (immutable controller snapshots, `lastError`, load-more error handling).
