use serde::{Deserialize, Serialize};

/// Exchange a workload client credential for short-lived tenant-bound dual tokens.
#[derive(Serialize, Deserialize, Debug, Clone, Default)]
pub struct ServiceAccountTokenExchangeCommand {
    #[serde(rename = "clientId")]
    pub client_id: String,

    #[serde(rename = "clientSecret")]
    pub client_secret: String,
}
