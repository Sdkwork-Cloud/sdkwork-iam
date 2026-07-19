use std::collections::{BTreeMap, BTreeSet, HashMap, VecDeque};
use std::path::{Path, PathBuf};

use sha2::{Digest, Sha256};

use crate::manifest::{IamModuleManifest, IamRegistryConfig, PermissionEntry};
use crate::merge::MergedIamCatalog;

#[derive(Debug, Clone)]
pub struct DiscoveredModule {
    pub module_id: String,
    pub manifest_path: PathBuf,
    pub manifest: IamModuleManifest,
    pub manifest_sha256: String,
}

pub fn load_registry_config(app_root: &Path) -> Result<IamRegistryConfig, String> {
    let path = app_root.join("iam/registry/iam-registry.config.json");
    let raw = std::fs::read_to_string(&path)
        .map_err(|error| format!("read registry config {path:?} failed: {error}"))?;
    serde_json::from_str(&raw).map_err(|error| format!("parse registry config failed: {error}"))
}

pub fn discover_modules(
    app_root: &Path,
    enabled_modules: &[String],
) -> Result<Vec<DiscoveredModule>, String> {
    let mut discovered = Vec::new();
    for module_id in enabled_modules {
        let manifest_path = app_root
            .join("iam/modules")
            .join(module_id)
            .join("iam.module.manifest.json");
        let raw = std::fs::read_to_string(&manifest_path)
            .map_err(|error| format!("read module manifest {manifest_path:?} failed: {error}"))?;
        let manifest = IamModuleManifest::from_json(&raw)
            .map_err(|error| format!("parse module manifest {module_id} failed: {error}"))?;
        if manifest.module_id != *module_id {
            return Err(format!(
                "module manifest moduleId mismatch: expected {module_id}, got {}",
                manifest.module_id
            ));
        }
        let manifest_sha256 = format!("{:x}", Sha256::digest(raw.as_bytes()));
        discovered.push(DiscoveredModule {
            module_id: module_id.clone(),
            manifest_path,
            manifest,
            manifest_sha256,
        });
    }
    topological_sort(&discovered)?;
    Ok(discovered)
}

pub fn discover_modules_with_manifests(
    app_root: &Path,
    enabled_modules: &[String],
    additional_manifest_paths: &[PathBuf],
) -> Result<Vec<DiscoveredModule>, String> {
    let mut discovered = discover_modules(app_root, enabled_modules)?;
    for manifest_path in additional_manifest_paths {
        let raw = std::fs::read_to_string(manifest_path).map_err(|error| {
            format!("read additional module manifest {manifest_path:?} failed: {error}")
        })?;
        let manifest = IamModuleManifest::from_json(&raw).map_err(|error| {
            format!("parse additional module manifest {manifest_path:?} failed: {error}")
        })?;
        if discovered
            .iter()
            .any(|module| module.module_id == manifest.module_id)
        {
            return Err(format!(
                "additional module manifest duplicates moduleId {}",
                manifest.module_id
            ));
        }
        discovered.push(DiscoveredModule {
            module_id: manifest.module_id.clone(),
            manifest_path: manifest_path.clone(),
            manifest,
            manifest_sha256: format!("{:x}", Sha256::digest(raw.as_bytes())),
        });
    }
    topological_sort(&discovered)?;
    Ok(discovered)
}

pub fn topological_sort(modules: &[DiscoveredModule]) -> Result<(), String> {
    let ids: BTreeSet<String> = modules.iter().map(|m| m.module_id.clone()).collect();
    let mut indegree: HashMap<String, usize> = ids.iter().map(|id| (id.clone(), 0)).collect();
    let mut edges: HashMap<String, Vec<String>> = HashMap::new();

    for module in modules {
        for dep in &module.manifest.dependencies.requires_modules {
            if !ids.contains(dep) {
                return Err(format!(
                    "module {} requires missing dependency {}",
                    module.module_id, dep
                ));
            }
            edges
                .entry(dep.clone())
                .or_default()
                .push(module.module_id.clone());
            *indegree.entry(module.module_id.clone()).or_default() += 1;
        }
    }

    let mut queue: VecDeque<String> = indegree
        .iter()
        .filter_map(|(id, count)| if *count == 0 { Some(id.clone()) } else { None })
        .collect();
    let mut visited = 0usize;
    while let Some(node) = queue.pop_front() {
        visited += 1;
        if let Some(children) = edges.get(&node) {
            for child in children {
                let entry = indegree.get_mut(child).expect("child indegree");
                *entry -= 1;
                if *entry == 0 {
                    queue.push_back(child.clone());
                }
            }
        }
    }
    if visited != ids.len() {
        return Err("module dependency graph contains a cycle".to_string());
    }
    Ok(())
}

pub fn merge_discovered(modules: &[DiscoveredModule]) -> MergedIamCatalog {
    let mut permissions: BTreeMap<String, (PermissionEntry, String)> = BTreeMap::new();
    let mut role_patterns: BTreeMap<String, BTreeSet<String>> = BTreeMap::new();
    let mut domain_roles = Vec::new();
    let mut registry_entries = Vec::new();

    for module in modules {
        registry_entries.push((
            module.module_id.clone(),
            module.manifest.domain.clone(),
            module.manifest.owner.clone(),
            module.manifest.catalog_version.clone(),
            module.manifest_sha256.clone(),
        ));
        for permission in &module.manifest.permissions.catalog {
            permissions.insert(
                permission.code.clone(),
                (permission.clone(), module.module_id.clone()),
            );
        }
        for grant in &module.manifest.roles.role_grant_extensions {
            role_patterns
                .entry(grant.role_code.clone())
                .or_default()
                .extend(grant.patterns.iter().cloned());
        }
        for role in &module.manifest.roles.domain_standard_roles {
            domain_roles.push((role.clone(), module.module_id.clone()));
            role_patterns
                .entry(role.code.clone())
                .or_default()
                .extend(role.permission_patterns.iter().cloned());
        }
    }

    MergedIamCatalog {
        permissions,
        role_patterns,
        domain_roles,
        registry_entries,
        modules: modules.to_vec(),
    }
}
