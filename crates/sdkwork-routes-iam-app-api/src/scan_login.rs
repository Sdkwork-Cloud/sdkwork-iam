//! Scan-login mode registry for the login page QR panel.
//!
//! The registry lives in `iam_oauth_scan_login_config.modes_json` (tenant
//! scoped) and drives which QR modes the login page offers and which one is
//! the default. Supported modes:
//!
//! - `official_account` — WeChat parameterized temp QR, follow-to-login
//! - `url` — H5 mobile login page URL
//! - `provider:<code>` — third-party OAuth authorization URL (WeChat Open
//!   Platform, DingTalk, Feishu, ...); the code is exchanged by the H5
//!   callback screen, which completes the QR session afterwards
//!
//! An empty registry falls back to `[official_account (when an enabled
//! account exists), url]`, preserving the pre-registry auto behavior.

use serde_json::{json, Value};
use sqlx::{PgPool, Row};

use crate::utils::LOCAL_EPHEMERAL_SCOPE;

pub(crate) const SCAN_LOGIN_MODE_OFFICIAL_ACCOUNT: &str = "official_account";
pub(crate) const SCAN_LOGIN_MODE_URL: &str = "url";
pub(crate) const SCAN_LOGIN_MODE_PROVIDER: &str = "provider";

/// QR-mode value prefix for provider scan login: `provider:<code>`.
pub(crate) const SCAN_LOGIN_PROVIDER_PREFIX: &str = "provider:";

#[derive(Clone, Debug)]
pub(crate) struct ScanLoginMode {
    pub(crate) display_name: Option<String>,
    pub(crate) enabled: bool,
    pub(crate) mode: String,
    pub(crate) provider_code: Option<String>,
    pub(crate) sort_order: i64,
}

impl ScanLoginMode {
    /// The `qrMode` value sent to `deviceAuthorizations.create`.
    pub(crate) fn qr_mode_value(&self) -> String {
        match (self.mode.as_str(), self.provider_code.as_deref()) {
            (SCAN_LOGIN_MODE_PROVIDER, Some(code)) => format!("{SCAN_LOGIN_PROVIDER_PREFIX}{code}"),
            _ => self.mode.clone(),
        }
    }
}

pub(crate) fn scan_login_mode_to_json(mode: &ScanLoginMode) -> Value {
    json!({
        "displayName": mode.display_name,
        "enabled": mode.enabled,
        "mode": mode.mode,
        "providerCode": mode.provider_code,
        "qrMode": mode.qr_mode_value(),
        "sortOrder": mode.sort_order,
    })
}

/// Parses a `qrMode` request value into (kind, provider code).
pub(crate) fn parse_scan_login_qr_mode(value: &str) -> (String, Option<String>) {
    let value = value.trim();
    if let Some(code) = value.strip_prefix(SCAN_LOGIN_PROVIDER_PREFIX) {
        let code = code.trim();
        if !code.is_empty() {
            return (SCAN_LOGIN_MODE_PROVIDER.to_string(), Some(code.to_string()));
        }
    }
    match value {
        SCAN_LOGIN_MODE_OFFICIAL_ACCOUNT => (SCAN_LOGIN_MODE_OFFICIAL_ACCOUNT.to_string(), None),
        _ => (SCAN_LOGIN_MODE_URL.to_string(), None),
    }
}

/// Loads the configured scan-login modes for a tenant.
///
/// `tenant_id` may be empty or `__local__` for global deployments, in which
/// case the first registry row (ordered by tenant) is used — matching the
/// single-tenant behavior of `list_login_enabled_providers`. Falls back to
/// the default mode list when the registry is empty or missing.
pub(crate) async fn load_scan_login_modes(
    pg: &PgPool,
    tenant_id: &str,
) -> Result<Vec<ScanLoginMode>, String> {
    let tenant_id = tenant_id.trim();
    let global = tenant_id.is_empty() || tenant_id == LOCAL_EPHEMERAL_SCOPE;
    let row = if global {
        sqlx::query(
            "SELECT modes_json FROM iam_oauth_scan_login_config \
             ORDER BY tenant_id LIMIT 1",
        )
        .fetch_optional(pg)
        .await
    } else {
        sqlx::query(
            "SELECT modes_json FROM iam_oauth_scan_login_config \
             WHERE tenant_id = $1",
        )
        .bind(tenant_id)
        .fetch_optional(pg)
        .await
    }
    .map_err(|error| format!("load scan login modes failed: {error}"))?;
    let modes_json = row
        .map(|row| row.get::<String, _>(0))
        .unwrap_or_else(|| "[]".to_string());
    let mut modes = match serde_json::from_str::<Value>(&modes_json) {
        Ok(value) => normalize_scan_login_modes_json(&value),
        Err(_) => Vec::new(),
    };
    if modes.is_empty() {
        modes = default_scan_login_modes(pg, tenant_id).await?;
    }
    // The legacy `url_login_enabled` switch also gates the URL mode: when
    // turned off, URL-mode entries are dropped so the login page can neither
    // offer nor auto-select them.
    if !load_scan_login_url_login_enabled(pg, tenant_id).await? {
        modes.retain(|mode| mode.mode != SCAN_LOGIN_MODE_URL);
    }
    Ok(modes)
}

/// Whether URL scan login is enabled (`url_login_enabled`) for the tenant.
/// Defaults to `true` when no config row exists (pre-registry behavior).
pub(crate) async fn load_scan_login_url_login_enabled(
    pg: &PgPool,
    tenant_id: &str,
) -> Result<bool, String> {
    let tenant_id = tenant_id.trim();
    let global = tenant_id.is_empty() || tenant_id == LOCAL_EPHEMERAL_SCOPE;
    let row = if global {
        sqlx::query(
            "SELECT url_login_enabled FROM iam_oauth_scan_login_config \
             ORDER BY tenant_id LIMIT 1",
        )
        .fetch_optional(pg)
        .await
    } else {
        sqlx::query(
            "SELECT url_login_enabled FROM iam_oauth_scan_login_config \
             WHERE tenant_id = $1",
        )
        .bind(tenant_id)
        .fetch_optional(pg)
        .await
    }
    .map_err(|error| format!("load scan login url enabled failed: {error}"))?;
    Ok(row.map(|row| row.get::<i32, _>(0) != 0).unwrap_or(true))
}

/// Loads the configured H5 login origin (`h5_login_origin`) for the tenant,
/// if any. Falls back to the first registry row for global deployments.
pub(crate) async fn load_scan_login_h5_origin(
    pg: &PgPool,
    tenant_id: &str,
) -> Result<Option<String>, String> {
    let tenant_id = tenant_id.trim();
    let global = tenant_id.is_empty() || tenant_id == LOCAL_EPHEMERAL_SCOPE;
    let row = if global {
        sqlx::query(
            "SELECT h5_login_origin FROM iam_oauth_scan_login_config \
             ORDER BY tenant_id LIMIT 1",
        )
        .fetch_optional(pg)
        .await
    } else {
        sqlx::query(
            "SELECT h5_login_origin FROM iam_oauth_scan_login_config \
             WHERE tenant_id = $1",
        )
        .bind(tenant_id)
        .fetch_optional(pg)
        .await
    }
    .map_err(|error| format!("load scan login h5 origin failed: {error}"))?;
    Ok(row
        .map(|row| row.get::<String, _>(0))
        .map(|origin| origin.trim().to_string())
        .filter(|origin| !origin.is_empty()))
}

/// Loads the configured default scan-login mode (`default_qr_mode`) for the
/// tenant: `official_account` or `url` when pinned, `None` for `auto`.
pub(crate) async fn load_scan_login_default_mode(
    pg: &PgPool,
    tenant_id: &str,
) -> Result<Option<String>, String> {
    let tenant_id = tenant_id.trim();
    let global = tenant_id.is_empty() || tenant_id == LOCAL_EPHEMERAL_SCOPE;
    let row = if global {
        sqlx::query(
            "SELECT default_qr_mode FROM iam_oauth_scan_login_config \
             ORDER BY tenant_id LIMIT 1",
        )
        .fetch_optional(pg)
        .await
    } else {
        sqlx::query(
            "SELECT default_qr_mode FROM iam_oauth_scan_login_config \
             WHERE tenant_id = $1",
        )
        .bind(tenant_id)
        .fetch_optional(pg)
        .await
    }
    .map_err(|error| format!("load scan login default mode failed: {error}"))?;
    let value = row
        .map(|row| row.get::<String, _>(0))
        .unwrap_or_else(|| "auto".to_string());
    match value.trim() {
        "official_account" | "url" => Ok(Some(value.trim().to_string())),
        _ => Ok(None),
    }
}

/// Normalizes a raw `modes_json` document into valid mode entries.
///
/// Invalid entries (unknown mode kinds, provider modes without a provider
/// code) are dropped; enabled entries are kept in their configured order.
pub(crate) fn normalize_scan_login_modes_json(value: &Value) -> Vec<ScanLoginMode> {
    let Some(entries) = value.as_array() else {
        return Vec::new();
    };
    entries
        .iter()
        .filter_map(|entry| {
            let entry = entry.as_object()?;
            let mode = entry
                .get("mode")
                .and_then(Value::as_str)?
                .trim()
                .to_string();
            let enabled = entry
                .get("enabled")
                .and_then(Value::as_bool)
                .unwrap_or(false);
            let sort_order = entry
                .get("sortOrder")
                .and_then(Value::as_i64)
                .unwrap_or(999);
            let display_name = entry
                .get("displayName")
                .and_then(Value::as_str)
                .map(str::trim)
                .filter(|value| !value.is_empty())
                .map(str::to_string);
            let provider_code = entry
                .get("providerCode")
                .and_then(Value::as_str)
                .map(str::trim)
                .filter(|value| !value.is_empty())
                .map(str::to_string);
            match mode.as_str() {
                SCAN_LOGIN_MODE_OFFICIAL_ACCOUNT | SCAN_LOGIN_MODE_URL => Some(ScanLoginMode {
                    display_name,
                    enabled,
                    mode,
                    provider_code: None,
                    sort_order,
                }),
                SCAN_LOGIN_MODE_PROVIDER if provider_code.is_some() => Some(ScanLoginMode {
                    display_name,
                    enabled,
                    mode,
                    provider_code,
                    sort_order,
                }),
                _ => None,
            }
        })
        .collect()
}

/// Default mode list: `official_account` (when an enabled account with QR
/// login exists), then `url`. Matches the pre-registry behavior.
pub(crate) async fn default_scan_login_modes(
    pg: &PgPool,
    tenant_id: &str,
) -> Result<Vec<ScanLoginMode>, String> {
    let official_account_available = scan_login_official_account_available(pg, tenant_id).await?;
    let mut modes = Vec::new();
    if official_account_available {
        modes.push(ScanLoginMode {
            display_name: None,
            enabled: true,
            mode: SCAN_LOGIN_MODE_OFFICIAL_ACCOUNT.to_string(),
            provider_code: None,
            sort_order: 10,
        });
    }
    modes.push(ScanLoginMode {
        display_name: None,
        enabled: true,
        mode: SCAN_LOGIN_MODE_URL.to_string(),
        provider_code: None,
        sort_order: 20,
    });
    Ok(modes)
}

/// Whether an enabled official account with QR scan login exists.
pub(crate) async fn scan_login_official_account_available(
    pg: &PgPool,
    tenant_id: &str,
) -> Result<bool, String> {
    let tenant_id = tenant_id.trim();
    let exists = if tenant_id.is_empty() || tenant_id == LOCAL_EPHEMERAL_SCOPE {
        sqlx::query_scalar::<_, bool>(
            "SELECT EXISTS( \
               SELECT 1 FROM iam_oauth_resource_account ra \
               WHERE ra.provider_code = 'wechat' \
                 AND ra.resource_account_kind = 'official_account' \
                 AND ra.enabled = 1 AND ra.status = 'active' \
                 AND ra.qr_default_enabled = 1 \
             )",
        )
        .fetch_one(pg)
        .await
    } else {
        sqlx::query_scalar::<_, bool>(
            "SELECT EXISTS( \
               SELECT 1 FROM iam_oauth_resource_account ra \
               WHERE ra.tenant_id = $1 AND ra.provider_code = 'wechat' \
                 AND ra.resource_account_kind = 'official_account' \
                 AND ra.enabled = 1 AND ra.status = 'active' \
                 AND ra.qr_default_enabled = 1 \
             )",
        )
        .bind(tenant_id)
        .fetch_one(pg)
        .await
    }
    .map_err(|error| format!("check official account scan login availability failed: {error}"))?;
    Ok(exists)
}

/// First enabled mode of the registry, if any.
pub(crate) fn first_enabled_scan_login_mode(modes: &[ScanLoginMode]) -> Option<&ScanLoginMode> {
    modes.iter().find(|mode| mode.enabled)
}

/// Resolves the tenant for scan-login public endpoints: explicit request
/// value, `SDKWORK_IAM_DEFAULT_TENANT` env override, or global scope.
pub(crate) fn resolve_scan_login_tenant_id(explicit: Option<String>) -> String {
    explicit
        .map(|value| value.trim().to_string())
        .filter(|value| !value.is_empty())
        .or_else(|| {
            std::env::var("SDKWORK_IAM_DEFAULT_TENANT")
                .ok()
                .map(|value| value.trim().to_string())
                .filter(|value| !value.is_empty())
        })
        .unwrap_or_default()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_qr_mode_values() {
        assert_eq!(
            parse_scan_login_qr_mode("official_account"),
            (SCAN_LOGIN_MODE_OFFICIAL_ACCOUNT.to_string(), None)
        );
        assert_eq!(
            parse_scan_login_qr_mode("url"),
            (SCAN_LOGIN_MODE_URL.to_string(), None)
        );
        assert_eq!(
            parse_scan_login_qr_mode("provider:wechat_open"),
            (
                SCAN_LOGIN_MODE_PROVIDER.to_string(),
                Some("wechat_open".to_string())
            )
        );
        assert_eq!(
            parse_scan_login_qr_mode("unknown"),
            (SCAN_LOGIN_MODE_URL.to_string(), None)
        );
        assert_eq!(
            parse_scan_login_qr_mode("provider:"),
            (SCAN_LOGIN_MODE_URL.to_string(), None)
        );
    }

    #[test]
    fn normalizes_modes_json() {
        let raw = json!([
            {"mode": "official_account", "enabled": true, "sortOrder": 10},
            {"mode": "url", "enabled": false, "sortOrder": 20},
            {"mode": "provider", "providerCode": "wechat_open", "enabled": true, "sortOrder": 30, "displayName": "WeChat"},
            {"mode": "provider", "enabled": true},
            {"mode": "bogus", "enabled": true},
            "not-an-object",
        ]);
        let modes = normalize_scan_login_modes_json(&raw);
        assert_eq!(modes.len(), 3);
        assert_eq!(modes[0].mode, "official_account");
        assert!(modes[0].enabled);
        assert!(!modes[1].enabled);
        assert_eq!(modes[2].provider_code.as_deref(), Some("wechat_open"));
        assert_eq!(modes[2].qr_mode_value(), "provider:wechat_open");
        assert_eq!(modes[2].display_name.as_deref(), Some("WeChat"));
    }

    #[test]
    fn qr_mode_values_roundtrip() {
        let mode = ScanLoginMode {
            display_name: None,
            enabled: true,
            mode: SCAN_LOGIN_MODE_PROVIDER.to_string(),
            provider_code: Some("dingtalk".to_string()),
            sort_order: 30,
        };
        let parsed = parse_scan_login_qr_mode(&mode.qr_mode_value());
        assert_eq!(parsed.0, SCAN_LOGIN_MODE_PROVIDER);
        assert_eq!(parsed.1.as_deref(), Some("dingtalk"));
    }
}
