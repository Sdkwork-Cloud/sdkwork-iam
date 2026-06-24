//! Standard role catalog and permission matrix seeds for `iam_role` / `iam_role_permission`.
//! Canonical grant patterns live in `iam/modules/iam-kernel/iam.module.manifest.json`.
//! Runtime role expansion uses `sdkwork-iam-module-registry::upsert_tenant_roles_postgres`.

use sdkwork_iam_context_service::{
    expand_permission_patterns, APP_USER_ROLE_CODE, IAM_STANDARD_ROLE_DEFINITIONS,
    ORG_ADMIN_ROLE_CODE, ORG_ASSISTANT_ROLE_CODE, ORG_AUDITOR_ROLE_CODE, ORG_FINANCE_ROLE_CODE,
    ORG_OPERATIONS_ROLE_CODE, PLATFORM_SUPER_ADMIN_ROLE_CODE, PLATFORM_SYSTEM_ADMIN_ROLE_CODE,
};

use crate::permission_catalog::IAM_STANDARD_PERMISSION_SEEDS;

#[derive(Debug, Clone, Copy)]
pub struct StandardRoleGrant {
    pub role_code: &'static str,
    pub patterns: &'static [&'static str],
}

pub const IAM_STANDARD_ROLE_GRANTS: &[StandardRoleGrant] = &[
    StandardRoleGrant {
        role_code: APP_USER_ROLE_CODE,
        patterns: &[
            "iam:self",
            "iam.profile.read",
            "iam.profile.update",
            "iam.sessions.read",
            "apps.app_center.read",
            "courses.catalog.read",
            "courses.content.read",
            "commerce.catalog.read",
            "commerce.orders.read",
            "commerce.memberships.read",
            "drive.spaces.read",
            "drive.nodes.read",
            "messaging.requests.read",
            "ai.agents.read",
            "ai.skills.read",
        ],
    },
    StandardRoleGrant {
        role_code: ORG_ADMIN_ROLE_CODE,
        patterns: &[
            "iam:self",
            "iam.*",
            "iam.oauth.*",
            "commerce.*",
            "courses.*",
            "ai.*",
            "messaging.*",
            "integrations.*",
            "drive.*",
            "storage.*",
            "ops.monitor.read",
            "system.site.read",
            "system.settings.read",
            "system.announcements.read",
        ],
    },
    StandardRoleGrant {
        role_code: ORG_ASSISTANT_ROLE_CODE,
        patterns: &[
            "iam.users.read",
            "iam.memberships.read",
            "iam.departments.read",
            "commerce.catalog.read",
            "commerce.catalog.manage",
            "commerce.orders.read",
            "commerce.orders.manage",
            "courses.catalog.read",
            "courses.content.read",
            "courses.content.update",
            "messaging.templates.read",
            "messaging.requests.manage",
        ],
    },
    StandardRoleGrant {
        role_code: ORG_AUDITOR_ROLE_CODE,
        patterns: &[
            "*.read",
            "*.approve",
            "*.reject",
            "iam.audit_events.read",
            "iam.security_events.read",
            "system.audit.read",
        ],
    },
    StandardRoleGrant {
        role_code: ORG_FINANCE_ROLE_CODE,
        patterns: &[
            "finance.*",
            "commerce.orders.read",
            "commerce.payments.*",
            "commerce.revenue.read",
            "iam.users.read",
        ],
    },
    StandardRoleGrant {
        role_code: ORG_OPERATIONS_ROLE_CODE,
        patterns: &[
            "commerce.*",
            "courses.*",
            "apps.app_center.*",
            "messaging.*",
            "integrations.*",
            "ai.*",
            "ops.monitor.read",
        ],
    },
    StandardRoleGrant {
        role_code: PLATFORM_SYSTEM_ADMIN_ROLE_CODE,
        patterns: &[
            "iam.*",
            "ops.*",
            "system.*",
            "iam.tenant_applications.provision",
            "iam.tenant_applications.update",
            "iam.tenant_applications.enable",
            "iam.access_credentials.create",
        ],
    },
    StandardRoleGrant {
        role_code: PLATFORM_SUPER_ADMIN_ROLE_CODE,
        patterns: &["*"],
    },
];

pub use sdkwork_iam_module_registry::materialize::{standard_role_id, standard_role_permission_id};

pub fn catalog_permission_codes() -> Vec<&'static str> {
    IAM_STANDARD_PERMISSION_SEEDS
        .iter()
        .map(|seed| seed.code)
        .collect()
}

pub fn expanded_role_permission_codes(role_code: &str) -> Vec<String> {
    let catalog = catalog_permission_codes();
    let patterns = IAM_STANDARD_ROLE_GRANTS
        .iter()
        .find(|grant| grant.role_code == role_code)
        .map(|grant| grant.patterns)
        .unwrap_or(&[]);
    expand_permission_patterns(patterns, &catalog)
}

pub fn role_display_name(role_code: &str) -> &str {
    IAM_STANDARD_ROLE_DEFINITIONS
        .iter()
        .find(|definition| definition.code == role_code)
        .map(|definition| definition.name)
        .unwrap_or(role_code)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn super_admin_expands_full_catalog() {
        let expanded = expanded_role_permission_codes(PLATFORM_SUPER_ADMIN_ROLE_CODE);
        assert!(expanded.contains(&"*".to_string()));
        assert!(expanded.len() >= IAM_STANDARD_PERMISSION_SEEDS.len());
    }

    #[test]
    fn app_user_does_not_receive_iam_admin_permissions() {
        let expanded = expanded_role_permission_codes(APP_USER_ROLE_CODE);
        assert!(!expanded.iter().any(|code| code.starts_with("iam.users")));
    }
}
