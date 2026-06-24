use std::collections::BTreeSet;

use sdkwork_iam_context_service::{
    expand_permission_patterns, IAM_STANDARD_ROLE_CODES, IAM_STANDARD_ROLE_DEFINITIONS,
};

use crate::discover::{merge_discovered, DiscoveredModule};

pub fn validate_catalog(modules: &[DiscoveredModule]) -> Result<(), String> {
    let merged = merge_discovered(modules);
    let catalog_codes = merged.permission_code_refs();

    let mut seen = BTreeSet::new();
    for code in merged.permissions.keys() {
        if !seen.insert(code.clone()) {
            return Err(format!("duplicate permission code {code}"));
        }
    }

    for (code, (_, module_id)) in &merged.permissions {
        let domain = permission_domain(code);
        let owner = modules
            .iter()
            .find(|m| m.module_id == *module_id)
            .map(|m| m.manifest.domain.as_str())
            .unwrap_or("");
        if domain != owner && !(*code == "*" && *module_id == "iam-kernel") {
            let allowed_cross_domain = (owner == "commerce" && domain == "finance")
                || (owner == "drive" && domain == "storage");
            if !allowed_cross_domain {
                return Err(format!(
                    "permission {code} owned by {module_id} but domain prefix is {domain}"
                ));
            }
        }
    }

    for (role_code, patterns) in &merged.role_patterns {
        let pattern_refs: Vec<&str> = patterns.iter().map(String::as_str).collect();
        let expanded = expand_permission_patterns(&pattern_refs, &catalog_codes);
        if expanded.is_empty() && !patterns.contains("*") {
            return Err(format!(
                "role {role_code} grant patterns expand to empty catalog: {:?}",
                patterns
            ));
        }
        if IAM_STANDARD_ROLE_CODES.contains(&role_code.as_str())
            || merged
                .domain_roles
                .iter()
                .any(|(role, _)| role.code == *role_code)
        {
            continue;
        }
        return Err(format!(
            "role grant references unknown role code {role_code}"
        ));
    }

    for role in IAM_STANDARD_ROLE_DEFINITIONS {
        if !merged.role_patterns.contains_key(role.code) {
            return Err(format!(
                "merged catalog missing grant patterns for platform role {}",
                role.code
            ));
        }
    }

    for module in modules {
        for exclusion in &module.manifest.roles.role_exclusions {
            if !IAM_STANDARD_ROLE_CODES.contains(&exclusion.role_code.as_str())
                && !IAM_STANDARD_ROLE_CODES.contains(&exclusion.excludes_role_code.as_str())
                && !merged.domain_roles.iter().any(|(role, _)| {
                    role.code == exclusion.role_code || role.code == exclusion.excludes_role_code
                })
            {
                return Err(format!(
                    "role exclusion in module {} references unknown role codes {} / {}",
                    module.module_id, exclusion.role_code, exclusion.excludes_role_code
                ));
            }
        }
        for permission in &module.manifest.permissions.catalog {
            if permission.status == "deprecated" && permission.replacement_code.is_none() {
                return Err(format!(
                    "deprecated permission {} in module {} missing replacementCode",
                    permission.code, module.module_id
                ));
            }
        }
    }

    let all_dept_refs: BTreeSet<String> = modules
        .iter()
        .flat_map(|module| {
            module
                .manifest
                .directory
                .department_templates
                .iter()
                .map(|dept| dept.r#ref.clone())
        })
        .collect();
    for module in modules {
        for dept in &module.manifest.directory.department_templates {
            if let Some(parent_ref) = crate::materialize::department_parent_ref(&dept.parent_ref) {
                if !all_dept_refs.contains(&parent_ref) {
                    return Err(format!(
                        "department {} in module {} references unknown parentRef {parent_ref}",
                        dept.r#ref, module.module_id
                    ));
                }
            }
        }
    }

    Ok(())
}

fn permission_domain(code: &str) -> &str {
    if code == "*" {
        return "iam";
    }
    if let Some((prefix, _)) = code.split_once(':') {
        return prefix;
    }
    code.split('.').next().unwrap_or(code)
}
