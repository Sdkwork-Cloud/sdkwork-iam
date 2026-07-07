//! IAM operational limits shared across route crates.

/// Maximum nodes returned by organization/department tree APIs (`PAGINATION_SPEC.md`).
pub const IAM_TREE_MAX_NODES: i64 = 2_000;

/// Maximum RBAC binding permission rows loaded per session authorization resolution.
pub const IAM_RBAC_BINDING_ROW_LIMIT: i64 = 5_000;

/// Maximum active role codes loaded per principal during RBAC validation.
pub const IAM_RBAC_ROLE_CODE_ROW_LIMIT: i64 = 1_000;

/// Maximum role-exclusion rules loaded per tenant during RBAC resolution.
pub const IAM_RBAC_EXCLUSION_ROW_LIMIT: i64 = 2_000;

/// Maximum role permission codes loaded when validating role grants.
pub const IAM_RBAC_ROLE_PERMISSION_ROW_LIMIT: i64 = 2_000;

/// Maximum data-scope rows loaded per principal during authorization.
pub const IAM_RBAC_DATA_SCOPE_ROW_LIMIT: i64 = 2_000;

/// Maximum active tenants loaded for bootstrap registration resolution.
pub const IAM_ACTIVE_TENANT_LIST_LIMIT: i64 = 500;

/// Batch size when revoking active sessions for a user.
pub const IAM_ACTIVE_SESSION_REVOKE_BATCH_SIZE: i64 = 200;

/// Maximum user rows considered during password authentication lookup within a tenant.
pub const IAM_PASSWORD_AUTH_USER_ROW_LIMIT: i64 = 20;

/// Maximum user rows loaded during super-admin password authentication.
pub const IAM_SUPER_ADMIN_AUTH_USER_ROW_LIMIT: i64 = 50;

/// Batch size for tenant-member backfill operations.
pub const IAM_TENANT_MEMBER_BACKFILL_BATCH_SIZE: i64 = 200;

/// Maximum active organization memberships loaded per user for directory scoping.
pub const IAM_ACTIVE_ORGANIZATION_MEMBERSHIP_ROW_LIMIT: i64 = 500;

/// Maximum OAuth relying-party rows probed without tenant hint (uniqueness check).
pub const IAM_OAUTH_RELYING_PARTY_PROBE_LIMIT: i64 = 2;
