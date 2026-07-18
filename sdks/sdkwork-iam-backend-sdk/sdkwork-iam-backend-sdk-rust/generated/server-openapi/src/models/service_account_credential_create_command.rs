use serde::{Deserialize, Serialize};

/// Create a one-time-returned workload credential bound to a service account and tenant application.
#[derive(Serialize, Deserialize, Debug, Clone, Default)]
pub struct ServiceAccountCredentialCreateCommand {
    #[serde(rename = "tenantApplicationId")]
    pub tenant_application_id: String,

    #[serde(rename = "expiresAt")]
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub expires_at: Option<String>,
}
