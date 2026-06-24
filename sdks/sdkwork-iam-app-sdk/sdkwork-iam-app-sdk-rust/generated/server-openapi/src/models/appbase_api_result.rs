use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug, Clone, Default)]
pub struct AppbaseApiResult {
    pub code: String,

    pub message: String,

    /// Server-owned request correlation id.
    #[serde(rename = "requestId")]
    pub request_id: String,

    pub data: std::collections::HashMap<String, serde_json::Value>,
}
