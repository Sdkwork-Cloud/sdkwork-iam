//! WeChat Official Account (公众号) capabilities for IAM scan login.
//!
//! Two scan-login modes are supported on top of the shared QR session flow
//! (`LocalQrSession` in `sdkwork-routes-iam-app-api`):
//!
//! 1. **official_account** — the QR image is a WeChat parameterized temp QR
//!    (`cgi-bin/qrcode/create`, `QR_SCENE`) whose scene is the login session
//!    key. Scanning behaviour arrives back through the account message
//!    webhook as a `subscribe` (new follower, `EventKey=qrscene_<scene>`)
//!    or `SCAN` (existing follower, `EventKey=<scene>`) event, which
//!    `record_oauth_follow_login_confirmation` writes into the QR session.
//! 2. **url** — the QR content is the H5 login page URL; the mobile H5 page
//!    completes the session with an authenticated completion call.
//!
//! The QR session artifact key format and payload field names are shared with
//! `sdkwork-routes-iam-app-api` (`LOCAL_EPHEMERAL_SCOPE` / `qr_session` /
//! `qrSessionToPayload`); keep the constants in sync when either side changes.

use base64::{engine::general_purpose::URL_SAFE_NO_PAD, Engine as _};
use chrono::{DateTime, Utc};
use rand_core::{OsRng, RngCore};
use reqwest::header::ACCEPT;
use serde_json::{json, Value};
use sqlx::{types::Json, PgPool, Row};
use std::time::{SystemTime, UNIX_EPOCH};

/// Ephemeral artifact scope used for pre-auth QR login sessions.
///
/// Must match `LOCAL_EPHEMERAL_SCOPE` in `sdkwork-routes-iam-app-api`.
pub const OAUTH_QR_SESSION_SCOPE: &str = "__local__";
/// Ephemeral artifact kind for QR login sessions.
///
/// Must match `KIND_QR_SESSION` in `sdkwork-routes-iam-app-api`.
pub const OAUTH_QR_SESSION_KIND: &str = "qr_session";
/// WeChat subscribe-event `EventKey` prefix for parameterized temp QRs.
pub const OAUTH_QR_SCENE_EVENT_KEY_PREFIX: &str = "qrscene_";
/// Session status written by the webhook once the account follow/SCAN event
/// confirms the scan. Must match the status name used by app-api completion.
pub const OAUTH_QR_FOLLOW_CONFIRMED_STATUS: &str = "follow_confirmed";
/// Payload key under which the follow confirmation is stored in the session.
pub const OAUTH_QR_FOLLOW_LOGIN_FIELD: &str = "followLogin";

const KIND_WECHAT_TOKEN: &str = "wechat_mp_token";
const WECHAT_API_BASE_DEFAULT: &str = "https://api.weixin.qq.com";
const WECHAT_QR_IMAGE_BASE: &str = "https://mp.weixin.qq.com/cgi-bin/showqrcode";

/// A WeChat parameterized temp QR created for a login session.
#[derive(Clone, Debug)]
pub struct WechatMpTempQrCode {
    pub ticket: String,
    pub image_url: String,
    pub expire_seconds: u64,
    pub scene: String,
}

/// The identity and integration context captured from a follow/SCAN event.
#[derive(Clone, Debug)]
pub struct OAuthFollowLoginConfirmation {
    pub scene: String,
    pub openid: String,
    pub provider_code: String,
    pub tenant_id: String,
    pub integration_id: String,
    pub app_id: Option<String>,
    pub event_key: String,
}

/// Resolves the WeChat API base URL (overridable for local/testing gateways).
pub fn wechat_mp_api_base() -> String {
    std::env::var("SDKWORK_IAM_WECHAT_API_BASE")
        .ok()
        .map(|value| value.trim().to_string())
        .filter(|value| !value.is_empty())
        .unwrap_or_else(|| WECHAT_API_BASE_DEFAULT.to_string())
}

fn current_millis() -> u128 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|duration| duration.as_millis())
        .unwrap_or(0)
}

fn current_timestamp_utc() -> DateTime<Utc> {
    DateTime::from_timestamp(
        (current_millis() / 1000) as i64,
        ((current_millis() % 1000) * 1_000_000) as u32,
    )
    .unwrap_or_else(Utc::now)
}

fn millis_to_timestamp(millis: u128) -> DateTime<Utc> {
    let seconds = (millis / 1000) as i64;
    let nanos = ((millis % 1000) * 1_000_000) as u32;
    DateTime::from_timestamp(seconds, nanos).unwrap_or_else(Utc::now)
}

fn ephemeral_artifact_key(kind: &str, key: &str) -> String {
    format!("{OAUTH_QR_SESSION_SCOPE}:{kind}:{key}")
}

/// Generates a random scene string bound to a QR login session.
pub fn generate_wechat_mp_scene(kind: &str) -> String {
    let mut bytes = [0u8; 24];
    OsRng.fill_bytes(&mut bytes);
    format!("{kind}-{}", URL_SAFE_NO_PAD.encode(bytes))
}

fn http_client() -> Result<reqwest::Client, String> {
    reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(10))
        .build()
        .map_err(|error| format!("create WeChat client failed: {error}"))
}

/// Fetches (and caches in `iam_ephemeral_artifact`) the official account
/// `cgi-bin/token` access token for the given appId/appSecret pair.
pub async fn fetch_wechat_mp_access_token(
    pg: &PgPool,
    app_id: &str,
    app_secret: &str,
) -> Result<String, String> {
    let cache_key = ephemeral_artifact_key(KIND_WECHAT_TOKEN, app_id);
    let cached = sqlx::query(
        "SELECT payload_json FROM iam_ephemeral_artifact \
         WHERE artifact_key = $1 AND expires_at > $2",
    )
    .bind(&cache_key)
    .bind(current_timestamp_utc())
    .fetch_optional(pg)
    .await
    .map_err(|error| format!("load WeChat token cache failed: {error}"))?;
    if let Some(row) = cached {
        let payload: Json<Value> = row.get(0);
        if let Some(token) = payload
            .0
            .get("accessToken")
            .and_then(Value::as_str)
            .map(str::trim)
            .filter(|value| !value.is_empty())
        {
            return Ok(token.to_string());
        }
    }

    let client = http_client()?;
    let response = client
        .get(format!("{}/cgi-bin/token", wechat_mp_api_base()))
        .query(&[
            ("grant_type", "client_credential"),
            ("appid", app_id),
            ("secret", app_secret),
        ])
        .header(ACCEPT, "application/json")
        .send()
        .await
        .map_err(|error| format!("WeChat access token request failed: {error}"))?;
    let status = response.status();
    let body = response
        .text()
        .await
        .map_err(|error| format!("read WeChat access token response failed: {error}"))?;
    if !status.is_success() {
        return Err(format!(
            "WeChat access token request failed with status {}",
            status.as_u16()
        ));
    }
    let payload: Value = serde_json::from_str(&body)
        .map_err(|error| format!("WeChat access token response is invalid: {error}"))?;
    if let Some(error_code) = payload.get("errcode").and_then(Value::as_i64) {
        if error_code != 0 {
            return Err(format!(
                "WeChat access token request failed: {} {}",
                error_code,
                payload
                    .get("errmsg")
                    .and_then(Value::as_str)
                    .unwrap_or("unknown error")
            ));
        }
    }
    let token = payload
        .get("access_token")
        .and_then(Value::as_str)
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .ok_or_else(|| "WeChat access token response is missing access_token".to_string())?;
    let expires_in = payload
        .get("expires_in")
        .and_then(Value::as_u64)
        .unwrap_or(7200);
    // Refresh slightly early; WeChat tokens live 7200s and must not be shared.
    let ttl_ms = ((expires_in.saturating_sub(300)).min(7000) as u128) * 1000;
    sqlx::query(
        "INSERT INTO iam_ephemeral_artifact \
         (artifact_key, tenant_id, artifact_kind, payload_json, expires_at, created_at, updated_at) \
         VALUES ($1, $2, $3, $4, $5, $6, $7) \
         ON CONFLICT (artifact_key) DO UPDATE SET \
           payload_json = EXCLUDED.payload_json, \
           expires_at = EXCLUDED.expires_at, \
           updated_at = EXCLUDED.updated_at",
    )
    .bind(&cache_key)
    .bind(OAUTH_QR_SESSION_SCOPE)
    .bind(KIND_WECHAT_TOKEN)
    .bind(Json(json!({ "accessToken": token })))
    .bind(millis_to_timestamp(current_millis() + ttl_ms))
    .bind(current_timestamp_utc())
    .bind(current_timestamp_utc())
    .execute(pg)
    .await
    .map_err(|error| format!("cache WeChat access token failed: {error}"))?;

    Ok(token.to_string())
}

/// Creates a WeChat parameterized temp QR (`QR_SCENE`) for a login session.
///
/// `scene` becomes the `scene_str` of the QR; WeChat limits it to 64 chars.
/// The returned `image_url` points at `mp.weixin.qq.com/cgi-bin/showqrcode`
/// and is rendered directly by the login page.
pub async fn create_wechat_mp_temp_qr_code(
    pg: &PgPool,
    app_id: &str,
    app_secret: &str,
    scene: &str,
    expire_seconds: u64,
) -> Result<WechatMpTempQrCode, String> {
    if scene.len() > 64 {
        return Err("WeChat QR scene exceeds the 64 character limit".to_string());
    }
    let access_token = fetch_wechat_mp_access_token(pg, app_id, app_secret).await?;
    let client = http_client()?;
    let response = client
        .post(format!(
            "{}/cgi-bin/qrcode/create?access_token={}",
            wechat_mp_api_base(),
            access_token
        ))
        .header(ACCEPT, "application/json")
        .json(&json!({
            "expire_seconds": expire_seconds,
            "action_name": "QR_SCENE",
            "action_info": {
                "scene": { "scene_str": scene }
            }
        }))
        .send()
        .await
        .map_err(|error| format!("WeChat QR create request failed: {error}"))?;
    let status = response.status();
    let body = response
        .text()
        .await
        .map_err(|error| format!("read WeChat QR create response failed: {error}"))?;
    if !status.is_success() {
        return Err(format!(
            "WeChat QR create request failed with status {}",
            status.as_u16()
        ));
    }
    let payload: Value = serde_json::from_str(&body)
        .map_err(|error| format!("WeChat QR create response is invalid: {error}"))?;
    if let Some(error_code) = payload.get("errcode").and_then(Value::as_i64) {
        if error_code != 0 {
            return Err(format!(
                "WeChat QR create failed: {} {}",
                error_code,
                payload
                    .get("errmsg")
                    .and_then(Value::as_str)
                    .unwrap_or("unknown error")
            ));
        }
    }
    let ticket = payload
        .get("ticket")
        .and_then(Value::as_str)
        .map(str::to_string)
        .ok_or_else(|| "WeChat QR create response is missing ticket".to_string())?;
    let qr_expire_seconds = payload
        .get("expire_seconds")
        .and_then(Value::as_u64)
        .unwrap_or(expire_seconds);
    Ok(WechatMpTempQrCode {
        image_url: format!(
            "{WECHAT_QR_IMAGE_BASE}?ticket={}",
            urlencoding::encode(&ticket)
        ),
        scene: scene.to_string(),
        ticket,
        expire_seconds: qr_expire_seconds,
    })
}

/// Extracts a QR-login scene from a WeChat follow/SCAN event payload.
///
/// WeChat delivers:
/// - `subscribe` events with `EventKey = "qrscene_" + scene` for new
///   followers of a parameterized temp QR;
/// - `SCAN` events with `EventKey = scene` for followers who already follow.
///
/// Returns `None` when the event is not a QR-login follow/SCAN event.
pub fn parse_oauth_follow_login_scene(payload: &Value) -> Option<String> {
    let message_type = payload
        .get("MsgType")
        .and_then(Value::as_str)
        .map(str::trim)
        .unwrap_or("");
    if message_type != "event" {
        return None;
    }
    let event = payload
        .get("Event")
        .and_then(Value::as_str)
        .map(str::trim)
        .unwrap_or("");
    if event != "subscribe" && event != "SCAN" {
        return None;
    }
    let event_key = payload
        .get("EventKey")
        .and_then(Value::as_str)
        .map(str::trim)
        .unwrap_or("");
    if event_key.is_empty() {
        return None;
    }
    let scene = event_key
        .strip_prefix(OAUTH_QR_SCENE_EVENT_KEY_PREFIX)
        .unwrap_or(event_key)
        .trim();
    if scene.is_empty() {
        return None;
    }
    Some(scene.to_string())
}

/// Writes a follow/SCAN confirmation into the matching QR login session.
///
/// The session artifact is keyed `{scope}:qr_session:{scene}`; only the
/// `status` and `followLogin` payload fields are updated so the app-api
/// polling side can lazily resolve the user and complete the session.
/// Returns `Ok(Some(scene))` when a live session was updated, `Ok(None)`
/// when the event is not a QR-login event or the session is gone/expired.
pub async fn record_oauth_follow_login_confirmation(
    pg: &PgPool,
    tenant_id: &str,
    integration_id: &str,
    app_id: Option<&str>,
    payload: &Value,
) -> Result<Option<OAuthFollowLoginConfirmation>, String> {
    let Some(scene) = parse_oauth_follow_login_scene(payload) else {
        return Ok(None);
    };
    let openid = payload
        .get("FromUserName")
        .and_then(Value::as_str)
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .ok_or_else(|| "WeChat follow login event is missing FromUserName openid".to_string())?;
    let event_key = payload
        .get("EventKey")
        .and_then(Value::as_str)
        .map(str::trim)
        .unwrap_or("");

    let artifact_key = ephemeral_artifact_key(OAUTH_QR_SESSION_KIND, &scene);
    let mut tx = pg
        .begin()
        .await
        .map_err(|error| format!("begin follow login transaction failed: {error}"))?;
    let row = sqlx::query(
        "SELECT payload_json FROM iam_ephemeral_artifact \
         WHERE artifact_key = $1 AND expires_at > $2 \
         FOR UPDATE",
    )
    .bind(&artifact_key)
    .bind(current_timestamp_utc())
    .fetch_optional(&mut *tx)
    .await
    .map_err(|error| format!("load qr session for follow login failed: {error}"))?;
    let Some(row) = row else {
        tx.rollback()
            .await
            .map_err(|error| format!("rollback follow login lookup failed: {error}"))?;
        return Ok(None);
    };
    let mut session_payload: Value = row.get::<Json<Value>, _>(0).0;
    session_payload["status"] = json!(OAUTH_QR_FOLLOW_CONFIRMED_STATUS);
    session_payload[OAUTH_QR_FOLLOW_LOGIN_FIELD] = json!({
        "openid": openid,
        "provider": "wechat",
        "tenantId": tenant_id,
        "integrationId": integration_id,
        "appId": app_id.unwrap_or(""),
        "eventKey": event_key,
        "followedAt": current_timestamp_utc().to_rfc3339(),
    });
    let timestamp = current_timestamp_utc();
    sqlx::query(
        "UPDATE iam_ephemeral_artifact \
         SET payload_json = $2, updated_at = $3 \
         WHERE artifact_key = $1",
    )
    .bind(&artifact_key)
    .bind(Json(session_payload))
    .bind(&timestamp)
    .execute(&mut *tx)
    .await
    .map_err(|error| format!("update qr session for follow login failed: {error}"))?;
    tx.commit()
        .await
        .map_err(|error| format!("commit follow login confirmation failed: {error}"))?;

    Ok(Some(OAuthFollowLoginConfirmation {
        app_id: app_id.map(str::to_string),
        event_key: event_key.to_string(),
        integration_id: integration_id.to_string(),
        openid: openid.to_string(),
        provider_code: "wechat".to_string(),
        scene,
        tenant_id: tenant_id.to_string(),
    }))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_subscribe_event_scene_with_qrscene_prefix() {
        let payload = json!({
            "MsgType": "event",
            "Event": "subscribe",
            "EventKey": "qrscene_sdkwork-qr-abc123",
            "FromUserName": "openid-1",
            "ToUserName": "gh_example",
        });
        assert_eq!(
            parse_oauth_follow_login_scene(&payload).as_deref(),
            Some("sdkwork-qr-abc123")
        );
    }

    #[test]
    fn parses_scan_event_scene_without_prefix() {
        let payload = json!({
            "MsgType": "event",
            "Event": "SCAN",
            "EventKey": "sdkwork-qr-abc123",
            "FromUserName": "openid-2",
        });
        assert_eq!(
            parse_oauth_follow_login_scene(&payload).as_deref(),
            Some("sdkwork-qr-abc123")
        );
    }

    #[test]
    fn ignores_non_follow_events() {
        assert_eq!(parse_oauth_follow_login_scene(&json!({
            "MsgType": "event",
            "Event": "unsubscribe",
            "EventKey": "qrscene_sdkwork-qr-abc123",
        })), None);
        assert_eq!(parse_oauth_follow_login_scene(&json!({
            "MsgType": "event",
            "Event": "CLICK",
            "EventKey": "MENU_KEY",
        })), None);
        assert_eq!(parse_oauth_follow_login_scene(&json!({
            "MsgType": "text",
            "Content": "hello",
        })), None);
    }

    #[test]
    fn ignores_missing_or_empty_scene() {
        assert_eq!(parse_oauth_follow_login_scene(&json!({
            "MsgType": "event",
            "Event": "subscribe",
            "EventKey": "",
        })), None);
        assert_eq!(parse_oauth_follow_login_scene(&json!({
            "MsgType": "event",
            "Event": "subscribe",
        })), None);
    }

    #[test]
    fn generated_scene_fits_wechat_64_char_limit() {
        for _ in 0..8 {
            let scene = generate_wechat_mp_scene("sdkwork-qr");
            assert!(scene.len() <= 64, "scene too long: {scene}");
        }
    }
}
