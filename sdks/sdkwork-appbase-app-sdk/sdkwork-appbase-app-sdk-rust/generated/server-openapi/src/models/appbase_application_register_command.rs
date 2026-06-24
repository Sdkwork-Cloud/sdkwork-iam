use serde::{Deserialize, Serialize};

/// Super-admin registered application command for startup bootstrap.
#[derive(Serialize, Deserialize, Debug, Clone, Default)]
pub struct AppbaseApplicationRegisterCommand {
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

    #[serde(rename = "ownerTenantId")]
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub owner_tenant_id: Option<String>,

    #[serde(rename = "appKey")]
    pub app_key: String,

    pub name: String,

    #[serde(rename = "displayName")]
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub display_name: Option<String>,

    #[serde(rename = "appType")]
    pub app_type: String,

    #[serde(rename = "packageName")]
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub package_name: Option<String>,

    #[serde(rename = "bundleId")]
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub bundle_id: Option<String>,

    #[serde(rename = "desktopAppId")]
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub desktop_app_id: Option<String>,

    pub version: String,

    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub channel: Option<String>,

    #[serde(rename = "manifestHash")]
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub manifest_hash: Option<String>,

    #[serde(rename = "defaultAccessPermissions")]
    pub default_access_permissions: Vec<String>,

    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub config: Option<std::collections::HashMap<String, serde_json::Value>>,

    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub packages: Option<Vec<std::collections::HashMap<String, serde_json::Value>>>,
}
