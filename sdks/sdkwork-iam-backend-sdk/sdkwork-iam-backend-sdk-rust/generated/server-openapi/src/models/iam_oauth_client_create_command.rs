use serde::{Deserialize, Serialize};

/// Tenant-scoped OAuth provider client registration command.
#[derive(Serialize, Deserialize, Debug, Clone, Default)]
pub struct IamOauthClientCreateCommand {
    #[serde(rename = "integrationId")]
    pub integration_id: String,

    #[serde(rename = "providerCode")]
    pub provider_code: String,

    #[serde(rename = "clientCode")]
    pub client_code: String,

    #[serde(rename = "displayName")]
    pub display_name: String,

    #[serde(rename = "providerClientId")]
    pub provider_client_id: String,

    /// Provider-owned identity federation scope, such as a WeChat Open Platform account ID.
    #[serde(rename = "providerTenantId")]
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub provider_tenant_id: Option<String>,
}
