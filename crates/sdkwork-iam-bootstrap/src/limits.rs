//! IAM operational limits shared across route crates.

/// Maximum nodes returned by organization/department tree APIs (`PAGINATION_SPEC.md`).
pub const IAM_TREE_MAX_NODES: i64 = 2_000;

/// Maximum RBAC binding permission rows loaded per session authorization resolution.
pub const IAM_RBAC_BINDING_ROW_LIMIT: i64 = 5_000;
