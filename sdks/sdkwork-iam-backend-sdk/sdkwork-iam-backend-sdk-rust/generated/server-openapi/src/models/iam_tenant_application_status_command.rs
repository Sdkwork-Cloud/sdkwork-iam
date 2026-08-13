use serde::{Deserialize, Serialize};

/// Authenticated operator command for a tenant application status transition.
#[derive(Serialize, Deserialize, Debug, Clone, Default)]
pub struct IamTenantApplicationStatusCommand {
    #[serde(flatten)]
    pub additional_properties: std::collections::HashMap<String, serde_json::Value>,
}
