//! SDKWork standard role codes, user surface, and permission matching.

use std::collections::BTreeSet;

/// Canonical standard role codes (immutable platform roles).
pub const APP_USER_ROLE_CODE: &str = "app_user";
pub const ORG_ADMIN_ROLE_CODE: &str = "org_admin";
pub const ORG_ASSISTANT_ROLE_CODE: &str = "org_assistant";
pub const ORG_AUDITOR_ROLE_CODE: &str = "org_auditor";
pub const ORG_FINANCE_ROLE_CODE: &str = "org_finance";
pub const ORG_OPERATIONS_ROLE_CODE: &str = "org_operations";
pub const PLATFORM_SYSTEM_ADMIN_ROLE_CODE: &str = "platform_system_admin";
pub const PLATFORM_SUPER_ADMIN_ROLE_CODE: &str = "platform_super_admin";

/// Deprecated alias kept for one migration generation.
pub const LEGACY_OWNER_ROLE_CODE: &str = "owner";

pub const IAM_STANDARD_ROLE_CODES: &[&str] = &[
    APP_USER_ROLE_CODE,
    ORG_ADMIN_ROLE_CODE,
    ORG_ASSISTANT_ROLE_CODE,
    ORG_AUDITOR_ROLE_CODE,
    ORG_FINANCE_ROLE_CODE,
    ORG_OPERATIONS_ROLE_CODE,
    PLATFORM_SYSTEM_ADMIN_ROLE_CODE,
    PLATFORM_SUPER_ADMIN_ROLE_CODE,
];

#[derive(Clone, Debug, Eq, PartialEq)]
pub enum IamRoleSurface {
    App,
    Organization,
    Platform,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct IamStandardRoleDefinition {
    pub code: &'static str,
    pub name: &'static str,
    pub surface: IamRoleSurface,
}

pub const IAM_STANDARD_ROLE_DEFINITIONS: &[IamStandardRoleDefinition] = &[
    IamStandardRoleDefinition {
        code: APP_USER_ROLE_CODE,
        name: "App User",
        surface: IamRoleSurface::App,
    },
    IamStandardRoleDefinition {
        code: ORG_ADMIN_ROLE_CODE,
        name: "Organization Admin",
        surface: IamRoleSurface::Organization,
    },
    IamStandardRoleDefinition {
        code: ORG_ASSISTANT_ROLE_CODE,
        name: "Organization Assistant",
        surface: IamRoleSurface::Organization,
    },
    IamStandardRoleDefinition {
        code: ORG_AUDITOR_ROLE_CODE,
        name: "Organization Auditor",
        surface: IamRoleSurface::Organization,
    },
    IamStandardRoleDefinition {
        code: ORG_FINANCE_ROLE_CODE,
        name: "Organization Finance",
        surface: IamRoleSurface::Organization,
    },
    IamStandardRoleDefinition {
        code: ORG_OPERATIONS_ROLE_CODE,
        name: "Organization Operations",
        surface: IamRoleSurface::Organization,
    },
    IamStandardRoleDefinition {
        code: PLATFORM_SYSTEM_ADMIN_ROLE_CODE,
        name: "Platform System Admin",
        surface: IamRoleSurface::Platform,
    },
    IamStandardRoleDefinition {
        code: PLATFORM_SUPER_ADMIN_ROLE_CODE,
        name: "Platform Super Admin",
        surface: IamRoleSurface::Platform,
    },
];

/// User surface flags — not roles; derived from tenant/org membership.
#[derive(Clone, Debug, Eq, PartialEq, Default)]
pub struct IamUserSurface {
    pub app: bool,
    pub organization_member: bool,
}

impl IamUserSurface {
    pub fn authenticated_app_user() -> Self {
        Self {
            app: true,
            organization_member: false,
        }
    }

    pub fn can_access_backend_api(&self) -> bool {
        self.organization_member
    }
}

pub fn is_standard_role_code(code: &str) -> bool {
    let normalized = normalize_code(code);
    IAM_STANDARD_ROLE_CODES
        .iter()
        .any(|candidate| normalize_code(candidate) == normalized)
}

/// Returns true when `granted` authorizes `required` (exact, `*`, `domain.*`, `*.action`).
pub fn permission_matches(granted: &str, required: &str) -> bool {
    let granted = normalize_code(granted);
    let required = normalize_code(required);
    if granted.is_empty() || required.is_empty() {
        return false;
    }
    if granted == "*" || granted == required {
        return true;
    }
    if let Some(prefix) = granted.strip_suffix(".*") {
        let prefix = prefix.trim_end_matches('.');
        return required == prefix || required.starts_with(&format!("{prefix}."));
    }
    if let Some(action) = granted.strip_prefix("*.") {
        let action = action.trim_start_matches('.');
        return required.split('.').next_back() == Some(action);
    }
    false
}

pub fn has_permission_in_scope(granted_codes: &[String], required: &str) -> bool {
    granted_codes
        .iter()
        .any(|granted| permission_matches(granted, required))
}

/// Expand grant patterns against a permission catalog code list.
pub fn expand_permission_patterns(patterns: &[&str], catalog_codes: &[&str]) -> Vec<String> {
    let mut expanded = BTreeSet::new();
    for pattern in patterns {
        let normalized = normalize_code(pattern);
        if normalized.is_empty() {
            continue;
        }
        if normalized == "*" {
            expanded.extend(catalog_codes.iter().map(|code| normalize_code(code)));
            expanded.insert("*".to_string());
            continue;
        }
        if let Some(prefix) = normalized.strip_suffix(".*") {
            let prefix = prefix.trim_end_matches('.');
            for code in catalog_codes {
                let code = normalize_code(code);
                if code == prefix || code.starts_with(&format!("{prefix}.")) {
                    expanded.insert(code);
                }
            }
            continue;
        }
        if let Some(action) = normalized.strip_prefix("*.") {
            let action = action.trim_start_matches('.');
            for code in catalog_codes {
                let code = normalize_code(code);
                if code.split('.').next_back() == Some(action) {
                    expanded.insert(code);
                }
            }
            continue;
        }
        expanded.insert(normalized);
    }
    expanded.into_iter().collect()
}

fn normalize_code(value: &str) -> String {
    value.trim().to_ascii_lowercase()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn wildcard_domain_grant_matches_nested_permission() {
        assert!(permission_matches("iam.*", "iam.users.read"));
        assert!(!permission_matches("iam.*", "commerce.orders.read"));
    }

    #[test]
    fn action_wildcard_matches_read_permissions() {
        assert!(permission_matches("*.read", "commerce.orders.read"));
        assert!(!permission_matches("*.read", "commerce.orders.manage"));
    }

    #[test]
    fn global_wildcard_matches_everything() {
        assert!(permission_matches("*", "system.settings.manage"));
    }

    #[test]
    fn expand_patterns_resolves_domain_wildcard() {
        let catalog = ["iam.users.read", "commerce.orders.read"];
        let expanded = expand_permission_patterns(&["iam.*"], &catalog);
        assert!(expanded.contains(&"iam.users.read".to_string()));
        assert!(!expanded.contains(&"commerce.orders.read".to_string()));
    }
}
