use serde::Deserialize;
use serde::Serialize;

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct IamModuleManifest {
    #[serde(rename = "schemaVersion")]
    pub schema_version: u32,
    pub kind: String,
    #[serde(rename = "moduleId")]
    pub module_id: String,
    #[serde(rename = "catalogVersion")]
    pub catalog_version: String,
    pub domain: String,
    pub owner: String,
    #[serde(rename = "displayName")]
    pub display_name: String,
    pub permissions: PermissionsSection,
    pub roles: RolesSection,
    pub directory: DirectorySection,
    #[serde(rename = "policyConditions", default)]
    pub policy_conditions: PolicyConditionsSection,
    #[serde(rename = "oauthScopeMappings", default)]
    pub oauth_scope_mappings: Vec<OauthScopeMapping>,
    pub dependencies: DependenciesSection,
}

#[derive(Debug, Clone, Default, Deserialize, Serialize)]
pub struct PermissionsSection {
    pub catalog: Vec<PermissionEntry>,
    #[serde(rename = "openapiAuthorities", default)]
    pub openapi_authorities: Vec<String>,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct PermissionEntry {
    pub code: String,
    pub name: String,
    pub resource: String,
    pub action: String,
    pub status: String,
    #[serde(default = "default_since")]
    pub since: String,
    #[serde(rename = "replacementCode", default)]
    pub replacement_code: Option<String>,
}

#[derive(Debug, Clone, Default, Deserialize, Serialize)]
pub struct RolesSection {
    #[serde(rename = "domainStandardRoles", default)]
    pub domain_standard_roles: Vec<DomainStandardRole>,
    #[serde(rename = "roleGrantExtensions", default)]
    pub role_grant_extensions: Vec<RoleGrantExtension>,
    #[serde(rename = "roleExclusions", default)]
    pub role_exclusions: Vec<RoleExclusion>,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct DomainStandardRole {
    pub code: String,
    pub name: String,
    pub surface: String,
    pub scope: String,
    pub standard: bool,
    pub assignable: bool,
    #[serde(rename = "bindingPrincipalKind")]
    pub binding_principal_kind: String,
    #[serde(rename = "permissionPatterns")]
    pub permission_patterns: Vec<String>,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct RoleGrantExtension {
    #[serde(rename = "roleCode")]
    pub role_code: String,
    pub patterns: Vec<String>,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct RoleExclusion {
    #[serde(rename = "roleCode")]
    pub role_code: String,
    #[serde(rename = "excludesRoleCode")]
    pub excludes_role_code: String,
}

#[derive(Debug, Clone, Default, Deserialize, Serialize)]
pub struct DirectorySection {
    #[serde(rename = "organizationTemplates", default)]
    pub organization_templates: Vec<OrganizationTemplate>,
    #[serde(rename = "departmentTemplates", default)]
    pub department_templates: Vec<DepartmentTemplate>,
    #[serde(rename = "positionTemplates", default)]
    pub position_templates: Vec<PositionTemplate>,
    #[serde(rename = "membershipTemplates", default)]
    pub membership_templates: Vec<MembershipTemplate>,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct OrganizationTemplate {
    pub r#ref: String,
    pub code: String,
    pub name: String,
    #[serde(rename = "seedId", default)]
    pub seed_id: Option<String>,
    #[serde(rename = "organizationKind")]
    pub organization_kind: String,
    #[serde(rename = "tenantBoundaryKind")]
    pub tenant_boundary_kind: String,
    #[serde(rename = "dataBoundaryKind")]
    pub data_boundary_kind: String,
    #[serde(rename = "verificationStatus")]
    pub verification_status: String,
    #[serde(rename = "sortOrder", default)]
    pub sort_order: i32,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct DepartmentTemplate {
    pub r#ref: String,
    pub code: String,
    pub name: String,
    #[serde(rename = "parentRef")]
    pub parent_ref: String,
    #[serde(rename = "departmentKind")]
    pub department_kind: String,
    #[serde(rename = "sortOrder", default)]
    pub sort_order: i32,
    #[serde(rename = "defaultPositions", default)]
    pub default_positions: Vec<String>,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct PositionTemplate {
    pub r#ref: String,
    pub code: String,
    pub name: String,
    #[serde(rename = "organizationRef")]
    pub organization_ref: String,
    #[serde(rename = "departmentRef", default)]
    pub department_ref: Option<String>,
    #[serde(rename = "positionKind")]
    pub position_kind: String,
    #[serde(rename = "defaultRoleBindings", default)]
    pub default_role_bindings: Vec<String>,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct MembershipTemplate {
    pub r#ref: String,
    #[serde(rename = "membershipKind")]
    pub membership_kind: String,
    #[serde(rename = "organizationRef")]
    pub organization_ref: String,
    #[serde(rename = "isPrimary", default)]
    pub is_primary: bool,
    #[serde(rename = "defaultRoleBindings", default)]
    pub default_role_bindings: Vec<String>,
}

#[derive(Debug, Clone, Default, Deserialize, Serialize)]
pub struct PolicyConditionsSection {
    #[serde(rename = "supportedAttributes", default)]
    pub supported_attributes: Vec<String>,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct OauthScopeMapping {
    pub scope: String,
    pub permissions: Vec<String>,
}

#[derive(Debug, Clone, Default, Deserialize, Serialize)]
pub struct DependenciesSection {
    #[serde(rename = "requiresModules", default)]
    pub requires_modules: Vec<String>,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct IamRegistryConfig {
    #[serde(rename = "schemaVersion")]
    pub schema_version: u32,
    pub kind: String,
    #[serde(rename = "defaultProfile", default = "default_profile")]
    pub default_profile: String,
    #[serde(rename = "enabledModules")]
    pub enabled_modules: Vec<String>,
}

fn default_since() -> String {
    "1.0.0".to_string()
}

fn default_profile() -> String {
    "operational".to_string()
}

impl IamModuleManifest {
    pub fn from_json(raw: &str) -> Result<Self, serde_json::Error> {
        serde_json::from_str(raw)
    }
}
