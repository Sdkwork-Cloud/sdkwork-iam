use std::collections::{BTreeMap, BTreeSet};

use crate::discover::DiscoveredModule;
use crate::manifest::{DomainStandardRole, PermissionEntry};

#[derive(Debug, Clone)]
pub struct MergedIamCatalog {
    pub permissions: BTreeMap<String, (PermissionEntry, String)>,
    pub role_patterns: BTreeMap<String, BTreeSet<String>>,
    pub domain_roles: Vec<(DomainStandardRole, String)>,
    pub registry_entries: Vec<(String, String, String, String, String)>,
    pub modules: Vec<DiscoveredModule>,
}

impl MergedIamCatalog {
    pub fn permission_codes(&self) -> Vec<String> {
        self.permissions.keys().cloned().collect()
    }

    pub fn permission_code_refs(&self) -> Vec<&str> {
        self.permissions.keys().map(String::as_str).collect()
    }
}
