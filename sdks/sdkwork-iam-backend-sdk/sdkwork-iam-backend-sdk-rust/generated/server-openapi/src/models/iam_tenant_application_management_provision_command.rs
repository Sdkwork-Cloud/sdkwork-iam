use serde::{Deserialize, Serialize};

/// Provision a registered application template for a tenant through an authenticated operator workflow.
#[derive(Serialize, Deserialize, Debug, Clone, Default)]
pub struct IamTenantApplicationManagementProvisionCommand {
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

    /// Product-semantic application type (api | h5 | pc | flutter | other); defaults to a mapping of the template app_type.
    #[serde(rename = "applicationType")]
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub application_type: Option<String>,

    #[serde(rename = "primaryDomain")]
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub primary_domain: Option<String>,

    #[serde(rename = "accessPermissions")]
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub access_permissions: Option<Vec<String>>,
}
