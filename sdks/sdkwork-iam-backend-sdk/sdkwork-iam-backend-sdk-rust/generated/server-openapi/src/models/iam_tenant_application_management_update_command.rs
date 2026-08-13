use serde::{Deserialize, Serialize};

/// Update operator-managed tenant application domain and access permissions.
#[derive(Serialize, Deserialize, Debug, Clone, Default)]
pub struct IamTenantApplicationManagementUpdateCommand {
    #[serde(rename = "primaryDomain")]
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub primary_domain: Option<String>,

    #[serde(rename = "accessPermissions")]
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub access_permissions: Option<Vec<String>>,
}
