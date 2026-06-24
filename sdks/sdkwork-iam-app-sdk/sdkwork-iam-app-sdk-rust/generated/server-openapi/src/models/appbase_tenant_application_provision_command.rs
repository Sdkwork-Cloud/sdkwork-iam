use serde::{Deserialize, Serialize};

/// Provision a tenant application from a registered application template.
#[derive(Serialize, Deserialize, Debug, Clone, Default)]
pub struct AppbaseTenantApplicationProvisionCommand {
    /// Super-admin auth token used for bootstrap body authentication.
    #[serde(rename = "authToken")]
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub auth_token: Option<String>,

    /// Super-admin username credential for bootstrap body authentication.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub username: Option<String>,

    /// Super-admin email credential for bootstrap body authentication.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub email: Option<String>,

    /// Super-admin phone credential for bootstrap body authentication.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub phone: Option<String>,

    /// Super-admin password credential for bootstrap body authentication.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub password: Option<String>,

    #[serde(rename = "tenantId")]
    pub tenant_id: String,

    #[serde(rename = "organizationId")]
    pub organization_id: String,

    #[serde(rename = "templateId")]
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub template_id: Option<String>,

    #[serde(rename = "appKey")]
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub app_key: Option<String>,

    #[serde(rename = "instanceKey")]
    pub instance_key: String,

    #[serde(rename = "displayName")]
    pub display_name: String,

    pub environment: String,

    #[serde(rename = "primaryDomain")]
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub primary_domain: Option<String>,

    #[serde(rename = "accessPermissions")]
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub access_permissions: Option<Vec<String>>,

    #[serde(rename = "runtimeConfig")]
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub runtime_config: Option<std::collections::HashMap<String, serde_json::Value>>,
}
