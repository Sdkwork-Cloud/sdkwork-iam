use serde::{Deserialize, Serialize};
use serde_json::{json, Value};

#[derive(Clone, Copy, Debug, Eq, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum OauthProviderRegionGroup {
    Mainland,
    Overseas,
    Global,
}

#[derive(Clone, Debug, Eq, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OauthProviderCatalogEntry {
    pub provider_code: String,
    pub provider_name: String,
    pub display_name: String,
    pub region_group: OauthProviderRegionGroup,
    pub protocol_family: String,
    pub supports_login: bool,
    pub supports_account_linking: bool,
    pub supports_mini_program: bool,
    pub sort_order: i32,
}

pub fn normalize_oauth_provider_code(provider: &str) -> Option<String> {
    let normalized = provider
        .trim()
        .to_ascii_lowercase()
        .replace('.', "_")
        .replace('-', "_");
    if normalized.is_empty() {
        return None;
    }

    let compact = normalized.replace('_', "");
    let canonical = match compact.as_str() {
        "wechat" | "weixin" | "wx" => "wechat",
        "wechatminiprogram" | "wechatmini" | "wxmini" => "wechat_mini_program",
        "wechatopen" | "wechatopenplatform" | "wxopen" => "wechat_open",
        "alipay" | "zhifubao" => "alipay",
        "douyin" | "dy" => "douyin",
        "tiktok" | "tiktokglobal" => "tiktok",
        "qq" | "tencentqq" => "qq",
        "weibo" | "sina" => "weibo",
        "baidu" => "baidu",
        "huawei" => "huawei",
        "xiaomi" => "xiaomi",
        "google" => "google",
        "github" => "github",
        "twitter" | "x" => "twitter",
        "facebook" | "fb" | "meta" => "facebook",
        "microsoft" | "ms" | "azuread" | "azure" => "microsoft",
        "apple" => "apple",
        "linkedin" => "linkedin",
        "line" => "line",
        "amazon" => "amazon",
        "discord" => "discord",
        "slack" => "slack",
        "yahoo" => "yahoo",
        "reddit" => "reddit",
        "instagram" => "instagram",
        "snapchat" => "snapchat",
        "paypal" => "paypal",
        "stripe" => "stripe",
        "sdkwork" | "sdkworkiam" | "sdkworkoauth" => "sdkwork",
        _ => normalized.as_str(),
    };

    if canonical
        .chars()
        .all(|ch| ch.is_ascii_alphanumeric() || ch == '_')
    {
        Some(canonical.to_string())
    } else {
        None
    }
}

pub fn builtin_oauth_provider_catalog() -> Vec<OauthProviderCatalogEntry> {
    vec![
        entry(
            "sdkwork",
            "SDKWork",
            "SDKWork",
            OauthProviderRegionGroup::Global,
            "oidc",
            true,
            true,
            false,
            5,
        ),
        entry(
            "wechat",
            "WeChat",
            "微信",
            OauthProviderRegionGroup::Mainland,
            "oauth2",
            true,
            true,
            false,
            10,
        ),
        entry(
            "wechat_mini_program",
            "WeChat Mini Program",
            "微信小程序",
            OauthProviderRegionGroup::Mainland,
            "mini_program",
            true,
            true,
            true,
            11,
        ),
        entry(
            "wechat_open",
            "WeChat Open Platform",
            "微信开放平台",
            OauthProviderRegionGroup::Mainland,
            "oauth2",
            true,
            true,
            false,
            12,
        ),
        entry(
            "alipay",
            "Alipay",
            "支付宝",
            OauthProviderRegionGroup::Mainland,
            "oauth2",
            true,
            true,
            true,
            20,
        ),
        entry(
            "douyin",
            "Douyin",
            "抖音",
            OauthProviderRegionGroup::Mainland,
            "oauth2",
            true,
            true,
            true,
            30,
        ),
        entry(
            "qq",
            "QQ",
            "QQ",
            OauthProviderRegionGroup::Mainland,
            "oauth2",
            true,
            true,
            false,
            40,
        ),
        entry(
            "weibo",
            "Weibo",
            "微博",
            OauthProviderRegionGroup::Mainland,
            "oauth2",
            true,
            true,
            false,
            50,
        ),
        entry(
            "baidu",
            "Baidu",
            "百度",
            OauthProviderRegionGroup::Mainland,
            "oauth2",
            true,
            true,
            false,
            60,
        ),
        entry(
            "huawei",
            "Huawei",
            "华为",
            OauthProviderRegionGroup::Mainland,
            "oauth2",
            true,
            true,
            false,
            70,
        ),
        entry(
            "xiaomi",
            "Xiaomi",
            "小米",
            OauthProviderRegionGroup::Mainland,
            "oauth2",
            true,
            true,
            false,
            80,
        ),
        entry(
            "google",
            "Google",
            "Google",
            OauthProviderRegionGroup::Overseas,
            "oidc",
            true,
            true,
            false,
            110,
        ),
        entry(
            "github",
            "GitHub",
            "GitHub",
            OauthProviderRegionGroup::Overseas,
            "oauth2",
            true,
            true,
            false,
            120,
        ),
        entry(
            "twitter",
            "X (Twitter)",
            "X (Twitter)",
            OauthProviderRegionGroup::Overseas,
            "oauth2",
            true,
            true,
            false,
            130,
        ),
        entry(
            "facebook",
            "Facebook",
            "Facebook",
            OauthProviderRegionGroup::Overseas,
            "oauth2",
            true,
            true,
            false,
            140,
        ),
        entry(
            "microsoft",
            "Microsoft",
            "Microsoft",
            OauthProviderRegionGroup::Overseas,
            "oidc",
            true,
            true,
            false,
            150,
        ),
        entry(
            "apple",
            "Apple",
            "Apple",
            OauthProviderRegionGroup::Global,
            "oidc",
            true,
            true,
            false,
            160,
        ),
        entry(
            "linkedin",
            "LinkedIn",
            "LinkedIn",
            OauthProviderRegionGroup::Overseas,
            "oauth2",
            true,
            true,
            false,
            170,
        ),
        entry(
            "line",
            "LINE",
            "LINE",
            OauthProviderRegionGroup::Overseas,
            "oauth2",
            true,
            true,
            true,
            180,
        ),
        entry(
            "tiktok",
            "TikTok",
            "TikTok",
            OauthProviderRegionGroup::Overseas,
            "oauth2",
            true,
            true,
            true,
            190,
        ),
        entry(
            "amazon",
            "Amazon",
            "Amazon",
            OauthProviderRegionGroup::Overseas,
            "oauth2",
            true,
            true,
            false,
            200,
        ),
        entry(
            "discord",
            "Discord",
            "Discord",
            OauthProviderRegionGroup::Overseas,
            "oauth2",
            true,
            true,
            false,
            210,
        ),
        entry(
            "slack",
            "Slack",
            "Slack",
            OauthProviderRegionGroup::Overseas,
            "oauth2",
            true,
            true,
            false,
            220,
        ),
        entry(
            "yahoo",
            "Yahoo",
            "Yahoo",
            OauthProviderRegionGroup::Overseas,
            "oauth2",
            true,
            true,
            false,
            230,
        ),
        entry(
            "reddit",
            "Reddit",
            "Reddit",
            OauthProviderRegionGroup::Overseas,
            "oauth2",
            true,
            true,
            false,
            240,
        ),
        entry(
            "instagram",
            "Instagram",
            "Instagram",
            OauthProviderRegionGroup::Overseas,
            "oauth2",
            true,
            true,
            false,
            250,
        ),
        entry(
            "snapchat",
            "Snapchat",
            "Snapchat",
            OauthProviderRegionGroup::Overseas,
            "oauth2",
            true,
            true,
            false,
            260,
        ),
        entry(
            "paypal",
            "PayPal",
            "PayPal",
            OauthProviderRegionGroup::Global,
            "oauth2",
            true,
            true,
            false,
            270,
        ),
        entry(
            "sdkwork",
            "SDKWork",
            "SDKWork",
            OauthProviderRegionGroup::Global,
            "sdkwork_oidc",
            true,
            true,
            false,
            5,
        ),
    ]
}

pub fn catalog_entry_for_provider(provider_code: &str) -> Option<OauthProviderCatalogEntry> {
    let normalized = normalize_oauth_provider_code(provider_code)?;
    builtin_oauth_provider_catalog()
        .into_iter()
        .find(|entry| entry.provider_code == normalized)
}

pub fn provider_catalog_entry_to_json(
    entry: &OauthProviderCatalogEntry,
    login_enabled: bool,
) -> Value {
    json!({
        "providerCode": entry.provider_code,
        "providerName": entry.provider_name,
        "displayName": entry.display_name,
        "regionGroup": region_group_to_str(entry.region_group),
        "protocolFamily": entry.protocol_family,
        "supportsLogin": entry.supports_login,
        "supportsAccountLinking": entry.supports_account_linking,
        "supportsMiniProgram": entry.supports_mini_program,
        "loginEnabled": login_enabled,
        "sortOrder": entry.sort_order,
    })
}

pub fn oauth_provider_allowed(allowed_providers: &[String], provider_code: &str) -> bool {
    let Some(normalized) = normalize_oauth_provider_code(provider_code) else {
        return false;
    };

    if allowed_providers.is_empty() {
        return true;
    }

    allowed_providers.iter().any(|allowed| {
        normalize_oauth_provider_code(allowed).as_deref() == Some(normalized.as_str())
    })
}

fn entry(
    provider_code: &str,
    provider_name: &str,
    display_name: &str,
    region_group: OauthProviderRegionGroup,
    protocol_family: &str,
    supports_login: bool,
    supports_account_linking: bool,
    supports_mini_program: bool,
    sort_order: i32,
) -> OauthProviderCatalogEntry {
    OauthProviderCatalogEntry {
        provider_code: provider_code.to_string(),
        provider_name: provider_name.to_string(),
        display_name: display_name.to_string(),
        region_group,
        protocol_family: protocol_family.to_string(),
        supports_login,
        supports_account_linking,
        supports_mini_program,
        sort_order,
    }
}

fn region_group_to_str(region_group: OauthProviderRegionGroup) -> &'static str {
    match region_group {
        OauthProviderRegionGroup::Mainland => "mainland",
        OauthProviderRegionGroup::Overseas => "overseas",
        OauthProviderRegionGroup::Global => "global",
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn normalizes_common_provider_aliases() {
        assert_eq!(
            normalize_oauth_provider_code("Weixin"),
            Some("wechat".to_string())
        );
        assert_eq!(
            normalize_oauth_provider_code("X"),
            Some("twitter".to_string())
        );
        assert_eq!(
            normalize_oauth_provider_code("azure-ad"),
            Some("microsoft".to_string())
        );
        assert_eq!(
            normalize_oauth_provider_code("sdkwork-oauth"),
            Some("sdkwork".to_string())
        );
        assert!(
            builtin_oauth_provider_catalog()
                .iter()
                .any(|entry| entry.provider_code == "sdkwork"),
            "sdkwork provider must be present in built-in catalog",
        );
    }
}
