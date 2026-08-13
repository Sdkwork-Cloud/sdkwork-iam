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
const WECHAT_UNSUPPORTED_MENU_ACTION_BYTE_LIMIT: usize = 4096;
const WECHAT_UNSUPPORTED_MENU_ACTION_DEPTH_LIMIT: usize = 4;

/// A WeChat parameterized temp QR created for a login session.
#[derive(Clone, Debug)]
pub struct WechatMpTempQrCode {
    pub ticket: String,
    pub image_url: String,
    pub expire_seconds: u64,
    pub scene: String,
}

/// Retrieves the current default custom menu from a WeChat Official Account
/// and converts the provider payload into IAM's editable menu document.
/// WeChat error 46003 means that the account has no menu and is treated as an
/// empty, successfully synchronized menu.
pub async fn retrieve_wechat_mp_custom_menu(
    pg: &PgPool,
    app_id: &str,
    app_secret: &str,
) -> Result<Value, String> {
    for attempt in 0..2 {
        let access_token = fetch_wechat_mp_access_token(pg, app_id, app_secret).await?;
        let response = http_client()?
            .get(format!(
                "{}/cgi-bin/menu/get?access_token={}",
                wechat_mp_api_base(),
                access_token
            ))
            .header(ACCEPT, "application/json")
            .send()
            .await
            .map_err(|error| format!("WeChat custom menu request failed: {error}"))?;
        let status = response.status();
        let body = response
            .text()
            .await
            .map_err(|error| format!("read WeChat custom menu response failed: {error}"))?;
        if !status.is_success() {
            return Err(format!(
                "WeChat custom menu request failed with status {}",
                status.as_u16()
            ));
        }
        if attempt == 0 && is_wechat_access_token_error(&body) {
            invalidate_wechat_mp_access_token(pg, app_id, app_secret, &access_token).await?;
            continue;
        }
        return parse_wechat_custom_menu_response(&body);
    }
    Err("WeChat custom menu request failed after refreshing access token".to_string())
}

/// Replaces the WeChat Official Account's default custom menu with the IAM
/// menu document. The caller persists the draft first, so a successful
/// provider response always corresponds to a server-side saved version.
pub async fn publish_wechat_mp_custom_menu(
    pg: &PgPool,
    app_id: &str,
    app_secret: &str,
    menu: &Value,
) -> Result<(), String> {
    let request_body = wechat_custom_menu_create_body(menu)?;
    for attempt in 0..2 {
        let access_token = fetch_wechat_mp_access_token(pg, app_id, app_secret).await?;
        let response = http_client()?
            .post(format!(
                "{}/cgi-bin/menu/create?access_token={}",
                wechat_mp_api_base(),
                access_token
            ))
            .header(ACCEPT, "application/json")
            .json(&request_body)
            .send()
            .await
            .map_err(|error| format!("WeChat custom menu publish failed: {error}"))?;
        let status = response.status();
        let body = response
            .text()
            .await
            .map_err(|error| format!("read WeChat custom menu publish response failed: {error}"))?;
        if !status.is_success() {
            return Err(format!(
                "WeChat custom menu publish failed with status {}",
                status.as_u16()
            ));
        }
        if attempt == 0 && is_wechat_access_token_error(&body) {
            invalidate_wechat_mp_access_token(pg, app_id, app_secret, &access_token).await?;
            continue;
        }
        return ensure_wechat_success_response(&body, "custom menu publish");
    }
    Err("WeChat custom menu publish failed after refreshing access token".to_string())
}

fn parse_wechat_custom_menu_response(body: &str) -> Result<Value, String> {
    let payload: Value = serde_json::from_str(body)
        .map_err(|error| format!("WeChat custom menu response is invalid: {error}"))?;
    let object = payload
        .as_object()
        .ok_or_else(|| "WeChat custom menu response must be an object".to_string())?;
    if let Some(error_code) = object.get("errcode") {
        let error_code = error_code
            .as_i64()
            .ok_or_else(|| "WeChat custom menu response errcode must be an integer".to_string())?;
        if error_code == 46003 {
            return Ok(json!({ "buttons": [] }));
        }
    }
    ensure_wechat_success_payload(&payload, "custom menu request")?;
    let menu = payload
        .get("menu")
        .and_then(Value::as_object)
        .ok_or_else(|| "WeChat custom menu response is missing menu".to_string())?;
    let buttons = menu
        .get("button")
        .and_then(Value::as_array)
        .ok_or_else(|| "WeChat custom menu response menu.button must be an array".to_string())?
        .iter()
        .enumerate()
        .map(|(index, button)| normalize_wechat_menu_button(button, &index.to_string()))
        .collect::<Result<Vec<_>, _>>()?;
    let menu = json!({ "buttons": buttons });
    validate_wechat_mp_custom_menu(&menu, false)
        .map_err(|error| format!("WeChat custom menu response violates menu limits: {error}"))?;
    Ok(menu)
}

fn normalize_wechat_menu_button(button: &Value, path: &str) -> Result<Value, String> {
    let object = button
        .as_object()
        .ok_or_else(|| format!("WeChat custom menu button {path} must be an object"))?;
    let name = object
        .get("name")
        .and_then(Value::as_str)
        .map(str::trim)
        .ok_or_else(|| format!("WeChat custom menu button {path} is missing name"))?;
    if name.is_empty() {
        return Err(format!("WeChat custom menu button {path} is missing name"));
    }
    let sub_buttons = match object.get("sub_button") {
        Some(Value::Array(buttons)) => buttons
            .iter()
            .enumerate()
            .map(|(index, child)| normalize_wechat_menu_button(child, &format!("{path}.{index}")))
            .collect::<Result<Vec<_>, _>>()?,
        Some(Value::Null) | None => Vec::new(),
        Some(_) => {
            return Err(format!(
                "WeChat custom menu button {path} sub_button must be an array"
            ))
        }
    };
    let mut normalized = json!({
        "key": format!("wechat-menu-{}", path.replace('.', "-")),
        "name": name,
    });
    if !sub_buttons.is_empty() {
        normalized["subButtons"] = json!(sub_buttons);
        return Ok(normalized);
    }
    let action_type = object
        .get("type")
        .and_then(Value::as_str)
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .ok_or_else(|| format!("WeChat custom menu button {path} is missing type"))?;
    match action_type {
        "click" => {
            normalized["type"] = json!("click");
            normalized["message"] = json!(required_wechat_menu_string(object, "key", path)?);
        }
        "view" => {
            normalized["type"] = json!("view");
            normalized["url"] = json!(required_wechat_menu_string(object, "url", path)?);
        }
        "miniprogram" => {
            normalized["type"] = json!("miniprogram");
            normalized["appId"] = json!(required_wechat_menu_string(object, "appid", path)?);
            normalized["pagePath"] = json!(required_wechat_menu_string(object, "pagepath", path)?);
            normalized["url"] = json!(required_wechat_menu_string(object, "url", path)?);
        }
        unsupported_type => {
            // Keep provider actions that the editor cannot represent yet
            // explicit and lossless. Treating media/article actions as click
            // would silently change their behavior on the next publish.
            validate_unsupported_wechat_menu_action(button, path)?;
            normalized["unsupportedType"] = json!(unsupported_type);
            normalized["providerAction"] = button.clone();
        }
    }
    Ok(normalized)
}

fn required_wechat_menu_string(
    object: &serde_json::Map<String, Value>,
    field: &str,
    path: &str,
) -> Result<String, String> {
    object
        .get(field)
        .and_then(Value::as_str)
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .map(str::to_string)
        .ok_or_else(|| format!("WeChat custom menu button {path} is missing {field}"))
}

fn wechat_custom_menu_create_body(menu: &Value) -> Result<Value, String> {
    validate_wechat_mp_custom_menu(menu, true)?;
    let buttons = menu
        .get("buttons")
        .and_then(Value::as_array)
        .ok_or_else(|| "custom menu buttons are required".to_string())?;
    let provider_buttons = buttons
        .iter()
        .enumerate()
        .map(|(index, button)| to_wechat_menu_button(button, &index.to_string()))
        .collect::<Result<Vec<_>, _>>()?;
    Ok(json!({ "button": provider_buttons }))
}

/// Validates the editable IAM menu document against WeChat's default custom
/// menu limits. Empty menus are valid drafts, but are never publishable.
pub fn validate_wechat_mp_custom_menu(
    menu: &Value,
    require_publishable: bool,
) -> Result<(), String> {
    let buttons = menu
        .get("buttons")
        .and_then(Value::as_array)
        .ok_or_else(|| "custom menu buttons are required".to_string())?;
    if require_publishable && buttons.is_empty() {
        return Err("custom menu requires at least one top-level button".to_string());
    }
    if buttons.len() > 3 {
        return Err("custom menu supports at most 3 top-level buttons".to_string());
    }
    for (index, button) in buttons.iter().enumerate() {
        validate_wechat_menu_button(button, &index.to_string(), false, require_publishable)?;
    }
    Ok(())
}

/// Returns a storage-safe draft containing only IAM's editable menu fields.
/// Validation remains draft-friendly: incomplete leaves are retained, while
/// structural violations and malformed field types are rejected.
pub fn normalize_wechat_mp_custom_menu_draft(menu: &Value) -> Result<Value, String> {
    validate_wechat_mp_custom_menu(menu, false)?;
    let buttons = menu
        .get("buttons")
        .and_then(Value::as_array)
        .expect("validated custom menu buttons");
    let buttons = buttons
        .iter()
        .map(normalize_wechat_menu_draft_button)
        .collect::<Result<Vec<_>, _>>()?;
    Ok(json!({ "buttons": buttons }))
}

fn normalize_wechat_menu_draft_button(button: &Value) -> Result<Value, String> {
    let object = button
        .as_object()
        .ok_or_else(|| "custom menu button must be an object".to_string())?;
    let mut normalized = serde_json::Map::new();
    if let Some(key) = object
        .get("key")
        .and_then(Value::as_str)
        .map(str::trim)
        .filter(|value| !value.is_empty())
    {
        normalized.insert("key".to_string(), json!(key));
    }
    normalized.insert(
        "name".to_string(),
        json!(object
            .get("name")
            .and_then(Value::as_str)
            .map(str::trim)
            .unwrap_or("")),
    );
    if let Some(children) = object
        .get("subButtons")
        .and_then(Value::as_array)
        .filter(|children| !children.is_empty())
    {
        let children = children
            .iter()
            .map(normalize_wechat_menu_draft_button)
            .collect::<Result<Vec<_>, _>>()?;
        normalized.insert("subButtons".to_string(), json!(children));
        return Ok(Value::Object(normalized));
    }
    if let Some(unsupported_type) = object
        .get("unsupportedType")
        .and_then(Value::as_str)
        .map(str::trim)
        .filter(|value| !value.is_empty())
    {
        normalized.insert("unsupportedType".to_string(), json!(unsupported_type));
        if let Some(provider_action) = object.get("providerAction") {
            normalized.insert("providerAction".to_string(), provider_action.clone());
        }
        return Ok(Value::Object(normalized));
    }
    let Some(action_type) = object
        .get("type")
        .and_then(Value::as_str)
        .map(str::trim)
        .filter(|value| !value.is_empty())
    else {
        return Ok(Value::Object(normalized));
    };
    normalized.insert("type".to_string(), json!(action_type));
    let action_fields: &[&str] = match action_type {
        "click" => &["message"],
        "view" => &["url"],
        "miniprogram" => &["appId", "pagePath", "url"],
        _ => &[],
    };
    for field in action_fields {
        if let Some(value) = object.get(*field).and_then(Value::as_str) {
            normalized.insert((*field).to_string(), json!(value.trim()));
        }
    }
    Ok(Value::Object(normalized))
}

fn validate_wechat_menu_button(
    button: &Value,
    path: &str,
    is_sub_menu: bool,
    require_publishable: bool,
) -> Result<(), String> {
    let object = button
        .as_object()
        .ok_or_else(|| format!("custom menu button {path} must be an object"))?;
    let name = match object.get("name") {
        Some(Value::String(name)) => name.trim(),
        Some(Value::Null) | None if !require_publishable => "",
        Some(Value::Null) | None => {
            return Err(format!("custom menu button {path} is missing name"))
        }
        Some(_) => {
            return Err(format!(
                "custom menu button {path} field name must be a string"
            ))
        }
    };
    if require_publishable && name.is_empty() {
        return Err(format!("custom menu button {path} is missing name"));
    }
    let name_limit = if is_sub_menu { 14 } else { 8 };
    if menu_name_unit_length(name) > name_limit {
        return Err(format!(
            "custom menu button {path} name exceeds {name_limit} display units"
        ));
    }

    let children: &[Value] = match object.get("subButtons") {
        Some(Value::Array(children)) => children.as_slice(),
        Some(Value::Null) | None => &[],
        Some(_) => {
            return Err(format!(
                "custom menu button {path} subButtons must be an array"
            ))
        }
    };
    if !children.is_empty() {
        if is_sub_menu {
            return Err(format!(
                "custom menu button {path} cannot contain third-level buttons"
            ));
        }
        if children.len() > 5 {
            return Err(format!(
                "custom menu button {path} supports at most 5 sub-buttons"
            ));
        }
        if action_fields_present(object) {
            return Err(format!(
                "custom menu parent button {path} cannot contain an action"
            ));
        }
        for (index, child) in children.iter().enumerate() {
            validate_wechat_menu_button(
                child,
                &format!("{path}.{index}"),
                true,
                require_publishable,
            )?;
        }
        return Ok(());
    }

    if object
        .get("providerAction")
        .is_some_and(|value| !value.is_null() && !value.is_object())
    {
        return Err(format!(
            "custom menu button {path} field providerAction must be an object"
        ));
    }
    let unsupported_type = match object.get("unsupportedType") {
        Some(Value::String(value)) if !value.trim().is_empty() => Some(value.trim()),
        Some(Value::String(_)) | Some(Value::Null) | None => None,
        Some(_) => {
            return Err(format!(
                "custom menu button {path} field unsupportedType must be a string"
            ))
        }
    };
    if let Some(unsupported_type) = unsupported_type {
        let Some(provider_action) = object
            .get("providerAction")
            .filter(|value| value.is_object())
        else {
            return Err(format!(
                "custom menu button {path} unsupported action is missing providerAction"
            ));
        };
        validate_unsupported_wechat_menu_action(provider_action, path)?;
        if require_publishable {
            return Err(format!(
                "custom menu button {path} uses unsupported WeChat action {unsupported_type}"
            ));
        }
        return Ok(());
    }
    let action_type = match object.get("type") {
        Some(Value::String(value)) => value.trim(),
        Some(Value::Null) | None => "",
        Some(_) => {
            return Err(format!(
                "custom menu button {path} field type must be a string"
            ))
        }
    };
    match action_type {
        "click" => {
            reject_menu_fields(object, path, &["url", "appId", "pagePath"])?;
            let Some(key) = optional_menu_string(button, "message", path, require_publishable)?
            else {
                return Ok(());
            };
            if key.len() > 128 {
                return Err(format!(
                    "custom menu button {path} click key exceeds 128 bytes"
                ));
            }
        }
        "view" => {
            reject_menu_fields(object, path, &["message", "appId", "pagePath"])?;
            if let Some(url) = optional_menu_string(button, "url", path, require_publishable)? {
                if require_publishable {
                    validate_menu_http_url(&url, path)?;
                }
            }
        }
        "miniprogram" => {
            reject_menu_fields(object, path, &["message"])?;
            optional_menu_string(button, "appId", path, require_publishable)?;
            optional_menu_string(button, "pagePath", path, require_publishable)?;
            if let Some(url) = optional_menu_string(button, "url", path, require_publishable)? {
                if require_publishable {
                    validate_menu_http_url(&url, path)?;
                }
            }
        }
        "" if !require_publishable => return Ok(()),
        "" => return Err(format!("custom menu button {path} is missing action type")),
        action_type => {
            return Err(format!(
                "custom menu button {path} uses unsupported action type {action_type}"
            ))
        }
    }
    Ok(())
}

fn validate_unsupported_wechat_menu_action(action: &Value, path: &str) -> Result<(), String> {
    if !action.is_object() {
        return Err(format!(
            "custom menu button {path} field providerAction must be an object"
        ));
    }
    let serialized = serde_json::to_vec(action)
        .map_err(|error| format!("custom menu button {path} providerAction is invalid: {error}"))?;
    if serialized.len() > WECHAT_UNSUPPORTED_MENU_ACTION_BYTE_LIMIT {
        return Err(format!(
            "custom menu button {path} providerAction exceeds {WECHAT_UNSUPPORTED_MENU_ACTION_BYTE_LIMIT} bytes"
        ));
    }
    if json_depth(action) > WECHAT_UNSUPPORTED_MENU_ACTION_DEPTH_LIMIT {
        return Err(format!(
            "custom menu button {path} providerAction exceeds {WECHAT_UNSUPPORTED_MENU_ACTION_DEPTH_LIMIT} nesting levels"
        ));
    }
    Ok(())
}

fn json_depth(value: &Value) -> usize {
    match value {
        Value::Array(values) => 1 + values.iter().map(json_depth).max().unwrap_or(0),
        Value::Object(values) => 1 + values.values().map(json_depth).max().unwrap_or(0),
        _ => 0,
    }
}

fn optional_menu_string(
    button: &Value,
    field: &str,
    path: &str,
    required: bool,
) -> Result<Option<String>, String> {
    match button.get(field) {
        Some(Value::String(value)) if !value.trim().is_empty() => {
            Ok(Some(value.trim().to_string()))
        }
        Some(Value::String(_)) | Some(Value::Null) | None if !required => Ok(None),
        Some(Value::String(_)) | Some(Value::Null) | None => {
            Err(format!("custom menu button {path} is missing {field}"))
        }
        Some(_) => Err(format!(
            "custom menu button {path} field {field} must be a string"
        )),
    }
}

fn menu_name_unit_length(name: &str) -> usize {
    name.chars()
        .map(|value| if value.is_ascii() { 1 } else { 2 })
        .sum()
}

fn action_fields_present(object: &serde_json::Map<String, Value>) -> bool {
    [
        "type",
        "message",
        "url",
        "appId",
        "pagePath",
        "unsupportedType",
        "providerAction",
    ]
    .iter()
    .any(|field| object.get(*field).is_some_and(|value| !value.is_null()))
}

fn reject_menu_fields(
    object: &serde_json::Map<String, Value>,
    path: &str,
    fields: &[&str],
) -> Result<(), String> {
    if let Some(field) = fields.iter().find(|field| {
        object.get(**field).is_some_and(|value| {
            !value.is_null()
                && value
                    .as_str()
                    .map(|text| !text.trim().is_empty())
                    .unwrap_or(true)
        })
    }) {
        return Err(format!(
            "custom menu button {path} field {field} does not belong to its action"
        ));
    }
    Ok(())
}

fn validate_menu_http_url(value: &str, path: &str) -> Result<(), String> {
    if value.len() > 1024 {
        return Err(format!("custom menu button {path} URL exceeds 1024 bytes"));
    }
    let parsed = reqwest::Url::parse(value)
        .map_err(|_| format!("custom menu button {path} URL must be an absolute HTTP URL"))?;
    if !matches!(parsed.scheme(), "http" | "https") || parsed.host_str().is_none() {
        return Err(format!(
            "custom menu button {path} URL must be an absolute HTTP URL"
        ));
    }
    Ok(())
}

fn to_wechat_menu_button(button: &Value, path: &str) -> Result<Value, String> {
    let name = button
        .get("name")
        .and_then(Value::as_str)
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .ok_or_else(|| format!("custom menu button {path} is missing name"))?;
    if let Some(children) = button.get("subButtons").and_then(Value::as_array) {
        if !children.is_empty() {
            let sub_button = children
                .iter()
                .enumerate()
                .map(|(index, child)| to_wechat_menu_button(child, &format!("{path}.{index}")))
                .collect::<Result<Vec<_>, _>>()?;
            return Ok(json!({ "name": name, "sub_button": sub_button }));
        }
    }
    match button.get("type").and_then(Value::as_str).unwrap_or("") {
        "click" => Ok(json!({
            "type": "click",
            "name": name,
            "key": required_menu_string(button, "message", path)?,
        })),
        "view" => Ok(json!({
            "type": "view",
            "name": name,
            "url": required_menu_string(button, "url", path)?,
        })),
        "miniprogram" => Ok(json!({
            "type": "miniprogram",
            "name": name,
            "appid": required_menu_string(button, "appId", path)?,
            "pagepath": required_menu_string(button, "pagePath", path)?,
            "url": required_menu_string(button, "url", path)?,
        })),
        _ => Err(format!("custom menu button {path} is missing action type")),
    }
}

fn required_menu_string(button: &Value, field: &str, path: &str) -> Result<String, String> {
    button
        .get(field)
        .and_then(Value::as_str)
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .map(str::to_string)
        .ok_or_else(|| format!("custom menu button {path} is missing {field}"))
}

fn ensure_wechat_success_response(body: &str, operation: &str) -> Result<(), String> {
    let payload: Value = serde_json::from_str(body)
        .map_err(|error| format!("WeChat {operation} response is invalid: {error}"))?;
    let object = payload
        .as_object()
        .ok_or_else(|| format!("WeChat {operation} response must be an object"))?;
    if !object.contains_key("errcode") {
        return Err(format!("WeChat {operation} response is missing errcode"));
    }
    ensure_wechat_success_payload(&payload, operation)
}

fn ensure_wechat_success_payload(payload: &Value, operation: &str) -> Result<(), String> {
    if let Some(error_code) = payload.get("errcode") {
        let error_code = error_code
            .as_i64()
            .ok_or_else(|| format!("WeChat {operation} response errcode must be an integer"))?;
        if error_code != 0 {
            return Err(format!(
                "WeChat {operation} failed: {} {}",
                error_code,
                payload
                    .get("errmsg")
                    .and_then(Value::as_str)
                    .unwrap_or("unknown error")
            ));
        }
    }
    Ok(())
}

fn is_wechat_access_token_error(body: &str) -> bool {
    serde_json::from_str::<Value>(body)
        .ok()
        .and_then(|payload| payload.get("errcode").and_then(Value::as_i64))
        .is_some_and(|code| matches!(code, 40001 | 40014 | 42001))
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

fn wechat_mp_access_token_cache_key(app_id: &str, app_secret: &str) -> String {
    let secret_fingerprint = sdkwork_iam_bootstrap::hash_secret_ref(app_secret);
    ephemeral_artifact_key(
        KIND_WECHAT_TOKEN,
        &format!("{}:{secret_fingerprint}", app_id.trim()),
    )
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
    let cache_key = wechat_mp_access_token_cache_key(app_id, app_secret);
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

async fn invalidate_wechat_mp_access_token(
    pg: &PgPool,
    app_id: &str,
    app_secret: &str,
    failed_access_token: &str,
) -> Result<(), String> {
    sqlx::query(
        "DELETE FROM iam_ephemeral_artifact \
         WHERE artifact_key = $1 AND payload_json->>'accessToken' = $2",
    )
    .bind(wechat_mp_access_token_cache_key(app_id, app_secret))
    .bind(failed_access_token)
    .execute(pg)
    .await
    .map_err(|error| format!("invalidate WeChat token cache failed: {error}"))?;
    Ok(())
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
    create_wechat_mp_qr_code(
        pg,
        app_id,
        app_secret,
        scene,
        "QR_SCENE",
        Some(expire_seconds),
    )
    .await
}

/// Creates a WeChat permanent parameterized QR (`QR_LIMIT_STR_SCENE`).
///
/// Permanent QRs never expire and are the right fit for follow-target QR codes
/// distributed through marketing material: the same `scene_str` always yields
/// the same QR for the account, so repeated calls stay stable. WeChat limits
/// each account to 100,000 distinct permanent scenes; callers should pin one
/// stable scene per account. `expire_seconds` is 0 on the result.
pub async fn create_wechat_mp_permanent_qr_code(
    pg: &PgPool,
    app_id: &str,
    app_secret: &str,
    scene: &str,
) -> Result<WechatMpTempQrCode, String> {
    create_wechat_mp_qr_code(pg, app_id, app_secret, scene, "QR_LIMIT_STR_SCENE", None).await
}

/// Shared `cgi-bin/qrcode/create` request for parameterized temp and permanent
/// QRs. `action_name` selects the QR kind; `expire_seconds` is only sent (and
/// defaults back from the response) for temp QRs.
async fn create_wechat_mp_qr_code(
    pg: &PgPool,
    app_id: &str,
    app_secret: &str,
    scene: &str,
    action_name: &str,
    expire_seconds: Option<u64>,
) -> Result<WechatMpTempQrCode, String> {
    if scene.len() > 64 {
        return Err("WeChat QR scene exceeds the 64 character limit".to_string());
    }
    let access_token = fetch_wechat_mp_access_token(pg, app_id, app_secret).await?;
    let mut request_body = json!({
        "action_name": action_name,
        "action_info": {
            "scene": { "scene_str": scene }
        }
    });
    if let Some(seconds) = expire_seconds {
        request_body["expire_seconds"] = json!(seconds);
    }
    let client = http_client()?;
    let response = client
        .post(format!(
            "{}/cgi-bin/qrcode/create?access_token={}",
            wechat_mp_api_base(),
            access_token
        ))
        .header(ACCEPT, "application/json")
        .json(&request_body)
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
    let qr = parse_wechat_qr_create_response(&body, expire_seconds)?;
    Ok(WechatMpTempQrCode {
        scene: scene.to_string(),
        ..qr
    })
}

/// Parses a `cgi-bin/qrcode/create` response into a QR result. Permanent QRs
/// carry no `expire_seconds`; 0 means the QR never expires.
fn parse_wechat_qr_create_response(
    body: &str,
    default_expire_seconds: Option<u64>,
) -> Result<WechatMpTempQrCode, String> {
    let payload: Value = serde_json::from_str(body)
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
        .or(default_expire_seconds)
        .unwrap_or(0);
    Ok(WechatMpTempQrCode {
        image_url: format!(
            "{WECHAT_QR_IMAGE_BASE}?ticket={}",
            urlencoding::encode(&ticket)
        ),
        scene: String::new(),
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
/// `provider_code` comes from the webhook configuration so non-WeChat
/// message callbacks (e.g. enterprise WeChat) bind with their own provider.
/// Returns `Ok(Some(scene))` when a live session was updated, `Ok(None)`
/// when the event is not a QR-login event or the session is gone/expired.
pub async fn record_oauth_follow_login_confirmation(
    pg: &PgPool,
    tenant_id: &str,
    integration_id: &str,
    provider_code: &str,
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
    let provider = provider_code.trim();
    let provider = if provider.is_empty() {
        "wechat"
    } else {
        provider
    };

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
    // The session may already be terminal (completed + exchanged, or the
    // polling side finished it): do not resurrect it with a new scan event —
    // re-completing would revoke the session the desktop already exchanged.
    // A `resolving` session is mid-flight on the polling side; ignoring a
    // repeat scan keeps the in-progress resolution from being overwritten.
    let terminal = session_payload
        .get("sessionExchanged")
        .and_then(Value::as_bool)
        .unwrap_or(false)
        || session_payload
            .get("status")
            .and_then(Value::as_str)
            .is_some_and(|status| matches!(status, "completed" | "resolving"));
    if terminal {
        tx.rollback()
            .await
            .map_err(|error| format!("rollback terminal follow login failed: {error}"))?;
        return Ok(None);
    }
    session_payload["status"] = json!(OAUTH_QR_FOLLOW_CONFIRMED_STATUS);
    session_payload[OAUTH_QR_FOLLOW_LOGIN_FIELD] = json!({
        "openid": openid,
        "provider": provider,
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
        provider_code: provider.to_string(),
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
        assert_eq!(
            parse_oauth_follow_login_scene(&json!({
                "MsgType": "event",
                "Event": "unsubscribe",
                "EventKey": "qrscene_sdkwork-qr-abc123",
            })),
            None
        );
        assert_eq!(
            parse_oauth_follow_login_scene(&json!({
                "MsgType": "event",
                "Event": "CLICK",
                "EventKey": "MENU_KEY",
            })),
            None
        );
        assert_eq!(
            parse_oauth_follow_login_scene(&json!({
                "MsgType": "text",
                "Content": "hello",
            })),
            None
        );
    }

    #[test]
    fn normalizes_wechat_custom_menu_actions_and_children() {
        let menu = parse_wechat_custom_menu_response(
            &json!({
                "menu": {
                    "button": [
                        { "name": "首页", "type": "view", "url": "https://example.com" },
                        {
                            "name": "服务",
                            "sub_button": [
                                { "name": "消息", "type": "click", "key": "SERVICE_MESSAGE" },
                                { "name": "小程序", "type": "miniprogram", "appid": "wx123", "pagepath": "pages/index/index", "url": "https://example.com/fallback" }
                            ]
                        }
                    ]
                },
                "errcode": 0
            })
            .to_string(),
        )
        .expect("valid menu response");
        assert_eq!(menu["buttons"][0]["type"], "view");
        assert_eq!(
            menu["buttons"][1]["subButtons"][0]["message"],
            "SERVICE_MESSAGE"
        );
        assert_eq!(menu["buttons"][1]["subButtons"][1]["appId"], "wx123");
    }

    #[test]
    fn preserves_unsupported_wechat_actions_instead_of_changing_them_to_click() {
        let menu = parse_wechat_custom_menu_response(
            &json!({
                "menu": {
                    "button": [{
                        "name": "图文",
                        "type": "media_id",
                        "media_id": "MEDIA_123"
                    }]
                },
                "errcode": 0
            })
            .to_string(),
        )
        .expect("valid menu response");

        assert_eq!(menu["buttons"][0]["unsupportedType"], "media_id");
        assert_eq!(
            menu["buttons"][0]["providerAction"]["media_id"],
            "MEDIA_123"
        );
        assert!(menu["buttons"][0].get("type").is_none());
        assert!(validate_wechat_mp_custom_menu(&menu, true)
            .expect_err("unsupported actions cannot be republished silently")
            .contains("unsupported WeChat action media_id"));
    }

    #[test]
    fn rejects_oversized_or_deep_unsupported_provider_actions() {
        let oversized = json!({
            "menu": {
                "button": [{
                    "name": "图文",
                    "type": "media_id",
                    "media_id": "x".repeat(WECHAT_UNSUPPORTED_MENU_ACTION_BYTE_LIMIT)
                }]
            }
        });
        assert!(parse_wechat_custom_menu_response(&oversized.to_string())
            .expect_err("oversized provider actions must not be persisted")
            .contains("providerAction exceeds"));

        let too_deep = json!({
            "buttons": [{
                "name": "图文",
                "unsupportedType": "future_action",
                "providerAction": { "type": "future_action", "a": { "b": { "c": { "d": { "e": 1 } } } } }
            }]
        });
        assert!(normalize_wechat_mp_custom_menu_draft(&too_deep)
            .expect_err("deep provider actions must not be persisted")
            .contains("nesting levels"));
    }

    #[test]
    fn converts_iam_custom_menu_to_wechat_create_payload() {
        let body = wechat_custom_menu_create_body(&json!({
            "buttons": [
                { "name": "首页", "type": "view", "url": "https://example.com" },
                { "name": "消息", "type": "click", "message": "MESSAGE" }
            ]
        }))
        .expect("valid menu document");
        assert_eq!(body["button"][0]["type"], "view");
        assert_eq!(body["button"][1]["key"], "MESSAGE");
    }

    #[test]
    fn validates_wechat_menu_limits_hierarchy_actions_and_urls() {
        assert!(validate_wechat_mp_custom_menu(&json!({ "buttons": [] }), false).is_ok());
        assert!(
            validate_wechat_mp_custom_menu(&json!({ "buttons": [] }), true)
                .expect_err("empty menus cannot be published")
                .contains("at least one")
        );

        let four_buttons = json!({
            "buttons": (0..4)
                .map(|index| json!({
                    "name": format!("M{index}"),
                    "type": "click",
                    "message": format!("KEY_{index}")
                }))
                .collect::<Vec<_>>()
        });
        assert!(validate_wechat_mp_custom_menu(&four_buttons, false)
            .expect_err("top-level count is bounded")
            .contains("at most 3"));

        let invalid_parent = json!({
            "buttons": [{
                "name": "菜单",
                "type": "view",
                "url": "https://stale.example.com",
                "subButtons": [{ "name": "网页", "type": "view", "url": "https://example.com" }]
            }]
        });
        assert!(validate_wechat_mp_custom_menu(&invalid_parent, false)
            .expect_err("parents are display-only")
            .contains("cannot contain an action"));

        let third_level = json!({
            "buttons": [{
                "name": "菜单",
                "subButtons": [{
                    "name": "二级",
                    "subButtons": [{ "name": "三级", "type": "click", "message": "KEY" }]
                }]
            }]
        });
        assert!(validate_wechat_mp_custom_menu(&third_level, false)
            .expect_err("third-level menus are forbidden")
            .contains("third-level"));

        let invalid_url = json!({
            "buttons": [{ "name": "网页", "type": "view", "url": "javascript:alert(1)" }]
        });
        assert!(validate_wechat_mp_custom_menu(&invalid_url, false).is_ok());
        assert!(validate_wechat_mp_custom_menu(&invalid_url, true)
            .expect_err("only HTTP URLs are accepted")
            .contains("absolute HTTP URL"));

        let incomplete_draft = json!({
            "buttons": [{ "name": "", "type": "miniprogram", "url": "" }]
        });
        assert!(validate_wechat_mp_custom_menu(&incomplete_draft, false).is_ok());
        assert!(validate_wechat_mp_custom_menu(&incomplete_draft, true)
            .expect_err("incomplete drafts cannot be published")
            .contains("missing name"));

        let invalid_field_type = json!({
            "buttons": [{ "name": 42, "type": "click", "message": "KEY" }]
        });
        assert!(validate_wechat_mp_custom_menu(&invalid_field_type, false)
            .expect_err("typed fields are enforced for drafts")
            .contains("name must be a string"));

        let invalid_preserved_action = json!({
            "buttons": [{ "name": "图文", "unsupportedType": "media_id" }]
        });
        assert!(
            validate_wechat_mp_custom_menu(&invalid_preserved_action, false)
                .expect_err("preserved actions require their provider payload")
                .contains("missing providerAction")
        );
    }

    #[test]
    fn normalizes_menu_drafts_to_the_supported_storage_shape() {
        let normalized = normalize_wechat_mp_custom_menu_draft(&json!({
            "buttons": [{
                "key": " button-key ",
                "name": " 菜单 ",
                "type": "view",
                "url": " https://example.com/page ",
                "source": "client-injected",
                "updatedAt": "client-time"
            }],
            "source": "client-root"
        }))
        .expect("valid draft");

        assert_eq!(
            normalized,
            json!({
                "buttons": [{
                    "key": "button-key",
                    "name": "菜单",
                    "type": "view",
                    "url": "https://example.com/page"
                }]
            })
        );

        let preserved = normalize_wechat_mp_custom_menu_draft(&json!({
            "buttons": [{
                "key": "media",
                "name": " 图文 ",
                "unsupportedType": "media_id",
                "providerAction": { "name": "图文", "type": "media_id", "media_id": "MEDIA_123" }
            }]
        }))
        .expect("unsupported provider action remains a safe draft");
        assert_eq!(
            preserved["buttons"][0]["providerAction"]["media_id"],
            "MEDIA_123"
        );

        let conflicting = json!({
            "buttons": [{
                "name": "网页",
                "type": "view",
                "url": "https://example.com",
                "message": "must-not-coexist"
            }]
        });
        assert!(normalize_wechat_mp_custom_menu_draft(&conflicting)
            .expect_err("action fields are mutually exclusive")
            .contains("does not belong to its action"));
    }

    #[test]
    fn treats_wechat_empty_menu_error_as_empty_document() {
        let menu =
            parse_wechat_custom_menu_response(r#"{"errcode":46003,"errmsg":"menu no exist"}"#)
                .expect("empty menu is a valid state");
        assert_eq!(menu, json!({ "buttons": [] }));
    }

    #[test]
    fn token_cache_isolated_by_app_id_and_secret_without_exposing_secret() {
        let first = wechat_mp_access_token_cache_key(" wx-app ", "first-secret");
        let rotated = wechat_mp_access_token_cache_key("wx-app", "rotated-secret");
        let other_app = wechat_mp_access_token_cache_key("wx-other", "first-secret");

        assert_ne!(first, rotated);
        assert_ne!(first, other_app);
        assert!(!first.contains("first-secret"));
        assert!(first.starts_with("__local__:wechat_mp_token:wx-app:"));
    }

    #[test]
    fn retries_only_for_official_access_token_errors() {
        for code in [40001, 40014, 42001] {
            assert!(is_wechat_access_token_error(
                &json!({ "errcode": code }).to_string()
            ));
        }
        assert!(!is_wechat_access_token_error(r#"{"errcode":46003}"#));
        assert!(!is_wechat_access_token_error(r#"{"errcode":0}"#));
        assert!(!is_wechat_access_token_error("not-json"));
    }

    #[test]
    fn rejects_non_integer_success_response_error_codes() {
        assert!(ensure_wechat_success_response(
            r#"{"errcode":"0","errmsg":"ok"}"#,
            "custom menu publish"
        )
        .expect_err("malformed provider response must fail")
        .contains("errcode must be an integer"));
        assert!(ensure_wechat_success_response("{}", "custom menu publish")
            .expect_err("ambiguous provider response must fail")
            .contains("missing errcode"));
    }

    #[test]
    fn rejects_malformed_successful_wechat_menu_responses_instead_of_importing_empty_data() {
        assert!(parse_wechat_custom_menu_response(r#"{}"#)
            .expect_err("missing menu must not become an empty draft")
            .contains("missing menu"));
        assert!(
            parse_wechat_custom_menu_response(r#"{"menu":{"button":{}}}"#)
                .expect_err("button must be an array")
                .contains("must be an array")
        );
        assert!(parse_wechat_custom_menu_response(
            r#"{"menu":{"button":[{"type":"view","url":"https://example.com"}]}}"#,
        )
        .expect_err("buttons without names must not be dropped silently")
        .contains("missing name"));
        assert!(parse_wechat_custom_menu_response(
            r#"{"menu":{"button":[{"name":"网页","type":"view"}]}}"#,
        )
        .expect_err("incomplete provider actions must not be persisted")
        .contains("missing url"));
        assert!(parse_wechat_custom_menu_response(r#"{"errcode":"0"}"#)
            .expect_err("malformed error codes must be rejected")
            .contains("errcode must be an integer"));
    }

    #[test]
    fn ignores_missing_or_empty_scene() {
        assert_eq!(
            parse_oauth_follow_login_scene(&json!({
                "MsgType": "event",
                "Event": "subscribe",
                "EventKey": "",
            })),
            None
        );
        assert_eq!(
            parse_oauth_follow_login_scene(&json!({
                "MsgType": "event",
                "Event": "subscribe",
            })),
            None
        );
    }

    #[test]
    fn generated_scene_fits_wechat_64_char_limit() {
        for _ in 0..8 {
            let scene = generate_wechat_mp_scene("sdkwork-qr");
            assert!(scene.len() <= 64, "scene too long: {scene}");
        }
    }

    #[test]
    fn follow_scene_for_account_id_fits_wechat_64_char_limit() {
        // Longest realistic resource account id shape: `iamora-` + 36-char uuid.
        let scene = format!("follow:iamora-{}", "a".repeat(36));
        assert!(scene.len() <= 64, "scene too long: {scene}");
        assert_eq!(scene.len(), 7 + 7 + 36);
    }

    #[test]
    fn parses_permanent_qr_response_without_expiry() {
        let qr = parse_wechat_qr_create_response(
            r#"{"ticket":"permanent-ticket-1","url":"http://weixin.qq.com/q/abc"}"#,
            None,
        )
        .expect("permanent QR response");
        assert_eq!(qr.ticket, "permanent-ticket-1");
        assert_eq!(qr.expire_seconds, 0);
        assert!(
            qr.image_url
                .contains("showqrcode?ticket=permanent-ticket-1"),
            "unexpected image url: {}",
            qr.image_url
        );
    }

    #[test]
    fn parses_temp_qr_response_with_expiry() {
        let qr = parse_wechat_qr_create_response(
            r#"{"ticket":"temp-ticket-1","expire_seconds":300}"#,
            Some(300),
        )
        .expect("temp QR response");
        assert_eq!(qr.ticket, "temp-ticket-1");
        assert_eq!(qr.expire_seconds, 300);
    }

    #[test]
    fn rejects_qr_create_provider_errors() {
        let error = parse_wechat_qr_create_response(
            r#"{"errcode":40001,"errmsg":"invalid credential"}"#,
            None,
        )
        .expect_err("provider error must fail");
        assert!(error.contains("40001"));
        assert!(error.contains("invalid credential"));
    }

    #[test]
    fn rejects_qr_create_response_without_ticket() {
        let error = parse_wechat_qr_create_response(r#"{"errcode":0}"#, None)
            .expect_err("missing ticket must fail");
        assert!(error.contains("missing ticket"));
    }
}
