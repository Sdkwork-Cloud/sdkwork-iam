use serde::{Deserialize, Serialize};

/// Revoke a workload credential and all sessions issued from it.
#[derive(Serialize, Deserialize, Debug, Clone, Default)]
pub struct ServiceAccountCredentialRevokeCommand {
    #[serde(flatten)]
    pub additional_properties: std::collections::HashMap<String, serde_json::Value>,
}
