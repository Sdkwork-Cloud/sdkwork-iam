use serde::{Deserialize, Serialize};

/// One-time WeChat Mini Program login-code exchange command.
#[derive(Serialize, Deserialize, Debug, Clone, Default)]
pub struct WechatMiniProgramSessionCreateCommand {
    /// One-time code returned by wx.login().
    #[serde(rename = "jsCode")]
    pub js_code: String,

    #[serde(rename = "providerCode")]
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub provider_code: Option<String>,

    /// Registered IAM OAuth mini-program surface code.
    #[serde(rename = "surfaceCode")]
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub surface_code: Option<String>,
}
