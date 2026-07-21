use aes::Aes256;
use base64::{engine::general_purpose::STANDARD as BASE64_STANDARD, Engine as _};
use cbc::cipher::{block_padding::Pkcs7, BlockDecryptMut, KeyIvInit};
use quick_xml::events::Event;
use quick_xml::Reader;
use serde_json::{json, Map, Value};
use sha1::{Digest as Sha1Digest, Sha1};
use sha2::Sha256;
use sqlx::{PgPool, Row};
use std::collections::HashMap;

const SECRET_KIND_VERIFICATION_TOKEN: &str = "verification_token";
const SECRET_KIND_ENCODING_AES_KEY: &str = "encoding_aes_key";
type Aes256CbcDec = cbc::Decryptor<Aes256>;

#[derive(Clone, Debug)]
pub struct OAuthWebhookConfig {
    pub id: String,
    pub tenant_id: String,
    pub organization_id: String,
    pub integration_id: String,
    pub provider_code: String,
    pub message_handling_mode: String,
    pub provider_app_id: Option<String>,
    #[allow(dead_code)]
    pub webhook_kind: String,
}

#[derive(Clone, Debug)]
pub struct ProviderCallbackHttpResponse {
    pub status_code: u16,
    pub content_type: Option<&'static str>,
    pub body: String,
}

#[derive(Clone, Debug, Default)]
pub struct ProviderCallbackRequestMeta {
    pub request_ip: Option<String>,
    pub user_agent: Option<String>,
}

pub async fn handle_provider_callback_get(
    pg: &PgPool,
    callback_public_id: &str,
    query: &HashMap<String, String>,
) -> Result<ProviderCallbackHttpResponse, String> {
    let config = load_active_webhook_config(pg, callback_public_id).await?;
    let verification_token = load_webhook_verification_token(pg, &config).await?;

    if let Some(response) = try_wechat_verification(query, &verification_token)? {
        record_callback_event(
            pg,
            &config,
            "webhook_verification",
            "success",
            None,
            json!({ "mode": "wechat_echostr" }),
            &ProviderCallbackRequestMeta::default(),
        )
        .await?;
        update_webhook_verified(pg, &config.id).await?;
        return Ok(response);
    }

    if let Some(response) = try_hub_challenge_verification(
        query,
        &verification_token,
        "hub.verify_token",
        "hub.challenge",
    )? {
        record_callback_event(
            pg,
            &config,
            "webhook_verification",
            "success",
            None,
            json!({ "mode": "hub_challenge" }),
            &ProviderCallbackRequestMeta::default(),
        )
        .await?;
        update_webhook_verified(pg, &config.id).await?;
        return Ok(response);
    }

    if let Some(response) = try_generic_challenge_verification(query, &verification_token)? {
        record_callback_event(
            pg,
            &config,
            "webhook_verification",
            "success",
            None,
            json!({ "mode": "generic_challenge" }),
            &ProviderCallbackRequestMeta::default(),
        )
        .await?;
        update_webhook_verified(pg, &config.id).await?;
        return Ok(response);
    }

    record_callback_event(
        pg,
        &config,
        "webhook_verification",
        "rejected",
        Some("iam_oauth_provider_callback_verification_failed"),
        json!({}),
        &ProviderCallbackRequestMeta::default(),
    )
    .await?;
    Err("OAuth provider callback verification failed".to_string())
}

pub async fn handle_provider_callback_post(
    pg: &PgPool,
    callback_public_id: &str,
    query: &HashMap<String, String>,
    body: &[u8],
    content_type: Option<&str>,
    meta: &ProviderCallbackRequestMeta,
) -> Result<ProviderCallbackHttpResponse, String> {
    let config = load_active_webhook_config(pg, callback_public_id).await?;
    let verification_token = load_webhook_verification_token(pg, &config).await?;

    let mut payload = parse_provider_callback_body(body, content_type)?;
    let encrypted = payload
        .get("Encrypt")
        .and_then(Value::as_str)
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .map(str::to_string);
    if let Err(error) = verify_provider_callback_post(
        query,
        &verification_token,
        config.message_handling_mode.as_str(),
        encrypted.as_deref(),
    ) {
        record_callback_event(
            pg,
            &config,
            "webhook_event",
            "rejected",
            Some("iam_oauth_provider_callback_signature_invalid"),
            json!({ "reason": error }),
            meta,
        )
        .await?;
        return Err(error);
    }

    if let Some(encrypted) = encrypted.as_deref() {
        let aes_key = load_webhook_encoding_aes_key(pg, &config).await?;
        payload = decrypt_wechat_payload(encrypted, &aes_key, config.provider_app_id.as_deref())?;
    }

    let provider_event_id =
        read_query_or_json(&payload, query, &["MsgId", "msg_id", "id", "event_id"]);
    let provider_event_type = read_query_or_json(
        &payload,
        query,
        &["MsgType", "msg_type", "event", "event_type"],
    );

    if let Some(event_id) = provider_event_id.as_deref() {
        if callback_event_exists(pg, &config.id, event_id).await? {
            return Ok(ProviderCallbackHttpResponse {
                status_code: 200,
                content_type: Some("text/plain"),
                body: "success".to_string(),
            });
        }
    }

    record_callback_event(
        pg,
        &config,
        "webhook_event",
        "accepted",
        None,
        json!({
            "messageHandlingMode": config.message_handling_mode,
            "providerEventId": provider_event_id,
            "providerEventType": provider_event_type,
        }),
        meta,
    )
    .await?;

    update_webhook_event(pg, &config.id, provider_event_id.as_deref()).await?;

    let body = match config.message_handling_mode.as_str() {
        "wechat_ack" | "provider_ack" => "success".to_string(),
        _ => json!({ "accepted": true }).to_string(),
    };
    let content_type = if config.message_handling_mode == "wechat_ack" {
        Some("text/plain")
    } else {
        Some("application/json")
    };

    Ok(ProviderCallbackHttpResponse {
        status_code: 200,
        content_type,
        body,
    })
}

async fn load_active_webhook_config(
    pg: &PgPool,
    callback_public_id: &str,
) -> Result<OAuthWebhookConfig, String> {
    let callback_public_id = callback_public_id.trim();
    if callback_public_id.is_empty() {
        return Err("OAuth provider callback id is required".to_string());
    }

    let row = sqlx::query(
        "SELECT w.id, w.tenant_id, w.organization_id, w.integration_id, w.provider_code, w.webhook_kind, \
                w.message_handling_mode, r.provider_account_id \
         FROM iam_oauth_webhook_config w \
         LEFT JOIN iam_oauth_resource_account r ON r.id = w.resource_account_id \
         WHERE w.callback_public_id = $1 AND w.enabled = 1 AND w.status = 'active' \
         LIMIT 1",
    )
    .bind(callback_public_id)
    .fetch_optional(pg)
    .await
    .map_err(|error| format!("load oauth webhook config failed: {error}"))?
    .ok_or_else(|| "OAuth provider callback configuration was not found".to_string())?;

    Ok(OAuthWebhookConfig {
        id: row.get(0),
        tenant_id: row.get(1),
        organization_id: row.get(2),
        integration_id: row.get(3),
        provider_code: row.get(4),
        webhook_kind: row.get(5),
        message_handling_mode: row.get(6),
        provider_app_id: row.get(7),
    })
}

async fn load_webhook_verification_token(
    pg: &PgPool,
    config: &OAuthWebhookConfig,
) -> Result<String, String> {
    if let Some(token) = read_env_webhook_verification_token(&config.id) {
        return Ok(token);
    }

    let row = sqlx::query_scalar::<_, String>(
        "SELECT secret_ref FROM iam_oauth_secret \
         WHERE tenant_id = $1 AND webhook_config_id = $2 AND secret_kind = $3 AND status = 'active' \
         ORDER BY active_from DESC \
         LIMIT 1",
    )
    .bind(&config.tenant_id)
    .bind(&config.id)
    .bind(SECRET_KIND_VERIFICATION_TOKEN)
    .fetch_optional(pg)
    .await
    .map_err(|error| format!("load webhook verification token failed: {error}"))?;

    let Some(secret_ref) = row else {
        return Err("OAuth webhook verification token is not configured".to_string());
    };

    decode_oauth_secret_ref(&secret_ref)
}

async fn load_webhook_encoding_aes_key(
    pg: &PgPool,
    config: &OAuthWebhookConfig,
) -> Result<String, String> {
    let secret_ref = sqlx::query_scalar::<_, String>(
        "SELECT secret_ref FROM iam_oauth_secret \
         WHERE tenant_id = $1 AND webhook_config_id = $2 AND secret_kind = $3 AND status = 'active' \
         ORDER BY active_from DESC LIMIT 1",
    )
    .bind(&config.tenant_id)
    .bind(&config.id)
    .bind(SECRET_KIND_ENCODING_AES_KEY)
    .fetch_optional(pg)
    .await
    .map_err(|error| format!("load webhook encoding AES key failed: {error}"))?
    .ok_or_else(|| "OAuth webhook EncodingAESKey is not configured".to_string())?;
    decode_oauth_secret_ref(&secret_ref)
}

fn parse_provider_callback_body(body: &[u8], content_type: Option<&str>) -> Result<Value, String> {
    let text = std::str::from_utf8(body)
        .map_err(|error| format!("OAuth provider callback body is not UTF-8: {error}"))?;
    if content_type
        .map(|value| value.to_ascii_lowercase().contains("json"))
        .unwrap_or_else(|| text.trim_start().starts_with('{'))
    {
        return serde_json::from_str(text)
            .map_err(|error| format!("parse OAuth provider JSON callback failed: {error}"));
    }

    let mut reader = Reader::from_str(text);
    reader.config_mut().trim_text(false);
    let mut fields = Map::new();
    let mut depth = 0_u8;
    let mut current_name = None;
    let mut current_value = String::new();
    loop {
        match reader.read_event() {
            Ok(Event::Start(event)) => {
                depth = depth
                    .checked_add(1)
                    .ok_or_else(|| "OAuth provider XML nesting is too deep".to_string())?;
                match depth {
                    1 => {}
                    2 => {
                        current_name =
                            Some(String::from_utf8_lossy(event.name().as_ref()).into_owned());
                        current_value.clear();
                    }
                    _ => {
                        return Err(
                            "OAuth provider XML callback fields must not be nested".to_string()
                        );
                    }
                }
            }
            Ok(Event::Text(event)) => {
                if current_name.is_some() {
                    let decoded = event.xml10_content().map_err(|error| {
                        format!("decode OAuth provider XML field failed: {error}")
                    })?;
                    let value = quick_xml::escape::unescape(&decoded).map_err(|error| {
                        format!("unescape OAuth provider XML field failed: {error}")
                    })?;
                    current_value.push_str(&value);
                }
            }
            Ok(Event::CData(event)) => {
                if current_name.is_some() {
                    let value = event.decode().map_err(|error| {
                        format!("decode OAuth provider XML CDATA field failed: {error}")
                    })?;
                    current_value.push_str(&value);
                }
            }
            Ok(Event::GeneralRef(event)) => {
                if current_name.is_some() {
                    let reference = event.decode().map_err(|error| {
                        format!("decode OAuth provider XML entity reference failed: {error}")
                    })?;
                    let encoded = format!("&{reference};");
                    let value = quick_xml::escape::unescape(&encoded).map_err(|error| {
                        format!("unescape OAuth provider XML entity reference failed: {error}")
                    })?;
                    current_value.push_str(&value);
                }
            }
            Ok(Event::Empty(event)) => {
                if depth != 1 {
                    return Err(
                        "OAuth provider XML callback empty fields must be direct children of the root"
                            .to_string(),
                    );
                }
                let name = String::from_utf8_lossy(event.name().as_ref()).into_owned();
                fields.insert(name, Value::String(String::new()));
            }
            Ok(Event::End(_)) => {
                if depth == 2 {
                    let name = current_name.take().ok_or_else(|| {
                        "OAuth provider XML callback field ended without a start tag".to_string()
                    })?;
                    let value = std::mem::take(&mut current_value);
                    fields.insert(name, Value::String(value.trim().to_owned()));
                }
                depth = depth.checked_sub(1).ok_or_else(|| {
                    "OAuth provider XML callback has an unmatched end tag".to_string()
                })?;
            }
            Ok(Event::DocType(_)) => {
                return Err("OAuth provider XML document types are not allowed".to_string());
            }
            Ok(Event::Eof) => {
                if depth != 0 || current_name.is_some() {
                    return Err("OAuth provider XML callback is not fully closed".to_string());
                }
                break;
            }
            Err(error) => {
                return Err(format!("parse OAuth provider XML callback failed: {error}"));
            }
            _ => {}
        }
    }
    if fields.is_empty() {
        return Err("OAuth provider callback body is empty or unsupported".to_string());
    }
    Ok(Value::Object(fields))
}

fn decrypt_wechat_payload(
    encrypted: &str,
    encoding_aes_key: &str,
    expected_app_id: Option<&str>,
) -> Result<Value, String> {
    let mut key_material = encoding_aes_key.trim().to_string();
    if !key_material.ends_with('=') {
        key_material.push('=');
    }
    let key = BASE64_STANDARD
        .decode(key_material)
        .map_err(|error| format!("decode WeChat EncodingAESKey failed: {error}"))?;
    if key.len() != 32 {
        return Err("WeChat EncodingAESKey must decode to 32 bytes".to_string());
    }
    let cipher_text = BASE64_STANDARD
        .decode(encrypted)
        .map_err(|error| format!("decode WeChat encrypted payload failed: {error}"))?;
    let iv = &key[..16];
    let mut buffer = cipher_text;
    let plain = Aes256CbcDec::new_from_slices(&key, iv)
        .map_err(|error| format!("create WeChat AES decryptor failed: {error}"))?
        .decrypt_padded_mut::<Pkcs7>(&mut buffer)
        .map_err(|_| "decrypt WeChat callback payload failed".to_string())?;
    if plain.len() < 20 {
        return Err("WeChat decrypted callback payload is too short".to_string());
    }
    let message_length = u32::from_be_bytes([plain[16], plain[17], plain[18], plain[19]]) as usize;
    let message_end = 20usize
        .checked_add(message_length)
        .ok_or_else(|| "WeChat callback message length overflow".to_string())?;
    if message_end > plain.len() {
        return Err("WeChat callback message length is invalid".to_string());
    }
    let message = std::str::from_utf8(&plain[20..message_end])
        .map_err(|error| format!("WeChat decrypted callback XML is not UTF-8: {error}"))?;
    let app_id = std::str::from_utf8(&plain[message_end..])
        .unwrap_or_default()
        .trim_matches(char::from(0))
        .trim();
    if let Some(expected) = expected_app_id.filter(|value| !value.trim().is_empty()) {
        if app_id != expected.trim() {
            return Err(
                "WeChat callback appid does not match the configured resource account".to_string(),
            );
        }
    }
    parse_provider_callback_body(message.as_bytes(), Some("application/xml"))
}

async fn callback_event_exists(
    pg: &PgPool,
    webhook_config_id: &str,
    provider_event_id: &str,
) -> Result<bool, String> {
    let count: i64 = sqlx::query_scalar(
        "SELECT COUNT(1)::bigint FROM iam_oauth_callback_event \
         WHERE webhook_config_id = $1 AND provider_event_id = $2 AND outcome = 'accepted'",
    )
    .bind(webhook_config_id)
    .bind(provider_event_id)
    .fetch_one(pg)
    .await
    .map_err(|error| format!("check OAuth callback event duplicate failed: {error}"))?;
    Ok(count > 0)
}

fn decode_oauth_secret_ref(secret_ref: &str) -> Result<String, String> {
    if secret_ref.starts_with("enc:v1:") {
        let bytes = crate::decode_signing_secret_ref(secret_ref)?;
        String::from_utf8(bytes).map_err(|error| format!("webhook secret is not utf-8: {error}"))
    } else {
        Ok(secret_ref.to_string())
    }
}

fn read_env_webhook_verification_token(webhook_config_id: &str) -> Option<String> {
    let key = format!("SDKWORK_IAM_OAUTH_WEBHOOK_VERIFICATION_TOKEN_{webhook_config_id}");
    std::env::var(&key)
        .ok()
        .or_else(|| std::env::var("SDKWORK_IAM_OAUTH_WEBHOOK_VERIFICATION_TOKEN").ok())
        .map(|value| value.trim().to_string())
        .filter(|value| !value.is_empty())
}

fn try_wechat_verification(
    query: &HashMap<String, String>,
    verification_token: &str,
) -> Result<Option<ProviderCallbackHttpResponse>, String> {
    let signature = match query.get("signature").map(String::as_str) {
        Some(value) if !value.is_empty() => value,
        _ => return Ok(None),
    };
    let timestamp = query
        .get("timestamp")
        .map(String::as_str)
        .ok_or_else(|| "OAuth WeChat callback timestamp is required".to_string())?;
    let nonce = query
        .get("nonce")
        .map(String::as_str)
        .ok_or_else(|| "OAuth WeChat callback nonce is required".to_string())?;
    let echostr = query
        .get("echostr")
        .map(String::as_str)
        .ok_or_else(|| "OAuth WeChat callback echostr is required".to_string())?;

    if !verify_wechat_signature(verification_token, timestamp, nonce, signature) {
        return Err("OAuth WeChat callback signature is invalid".to_string());
    }

    Ok(Some(ProviderCallbackHttpResponse {
        status_code: 200,
        content_type: Some("text/plain"),
        body: echostr.to_string(),
    }))
}

fn try_hub_challenge_verification(
    query: &HashMap<String, String>,
    verification_token: &str,
    verify_token_key: &str,
    challenge_key: &str,
) -> Result<Option<ProviderCallbackHttpResponse>, String> {
    let mode = match query
        .get("hub.mode")
        .or_else(|| query.get("hub_mode"))
        .map(String::as_str)
    {
        Some(value) if value == "subscribe" => value,
        _ => return Ok(None),
    };
    let verify_token = query
        .get(verify_token_key)
        .or_else(|| query.get("hub.verify_token"))
        .map(String::as_str)
        .ok_or_else(|| "OAuth hub.verify_token is required".to_string())?;
    let challenge = query
        .get(challenge_key)
        .or_else(|| query.get("hub.challenge"))
        .map(String::as_str)
        .ok_or_else(|| "OAuth hub.challenge is required".to_string())?;

    if verify_token != verification_token {
        return Err("OAuth hub.verify_token is invalid".to_string());
    }
    if mode != "subscribe" {
        return Err("OAuth hub.mode must be subscribe".to_string());
    }

    Ok(Some(ProviderCallbackHttpResponse {
        status_code: 200,
        content_type: Some("text/plain"),
        body: challenge.to_string(),
    }))
}

fn try_generic_challenge_verification(
    query: &HashMap<String, String>,
    verification_token: &str,
) -> Result<Option<ProviderCallbackHttpResponse>, String> {
    let challenge = query
        .get("challenge")
        .or_else(|| query.get("echostr"))
        .map(String::as_str);
    let Some(challenge) = challenge.filter(|value| !value.is_empty()) else {
        return Ok(None);
    };

    let provided_token = query
        .get("verify_token")
        .or_else(|| query.get("token"))
        .map(String::as_str)
        .filter(|value| !value.is_empty())
        .ok_or_else(|| "OAuth callback verify_token is required".to_string())?;
    if provided_token != verification_token {
        return Err("OAuth callback verify_token is invalid".to_string());
    }

    Ok(Some(ProviderCallbackHttpResponse {
        status_code: 200,
        content_type: Some("text/plain"),
        body: challenge.to_string(),
    }))
}

fn verify_wechat_signature(token: &str, timestamp: &str, nonce: &str, signature: &str) -> bool {
    let mut parts = [token.to_string(), timestamp.to_string(), nonce.to_string()];
    parts.sort();
    let joined = parts.join("");
    let digest = Sha1::digest(joined.as_bytes());
    let expected = format!("{:x}", digest);
    expected.eq_ignore_ascii_case(signature)
}

fn verify_wechat_message_signature(
    token: &str,
    timestamp: &str,
    nonce: &str,
    encrypted_payload: Option<&str>,
    signature: &str,
) -> bool {
    if let Some(encrypted_payload) = encrypted_payload {
        let mut parts = [
            token.to_string(),
            timestamp.to_string(),
            nonce.to_string(),
            encrypted_payload.to_string(),
        ];
        parts.sort();
        let digest = Sha1::digest(parts.join("").as_bytes());
        return format!("{:x}", digest).eq_ignore_ascii_case(signature);
    }
    verify_wechat_signature(token, timestamp, nonce, signature)
}

fn verify_provider_callback_post(
    query: &HashMap<String, String>,
    verification_token: &str,
    message_handling_mode: &str,
    encrypted_payload: Option<&str>,
) -> Result<(), String> {
    if matches!(
        message_handling_mode,
        "wechat_ack" | "wechat" | "provider_ack"
    ) {
        let signature = query
            .get("msg_signature")
            .or_else(|| query.get("signature"))
            .map(String::as_str)
            .filter(|value| !value.is_empty())
            .ok_or_else(|| {
                "OAuth provider callback signature is required for signed webhook modes".to_string()
            })?;
        let timestamp = query
            .get("timestamp")
            .map(String::as_str)
            .filter(|value| !value.is_empty())
            .ok_or_else(|| "OAuth provider callback timestamp is required".to_string())?;
        let nonce = query
            .get("nonce")
            .map(String::as_str)
            .filter(|value| !value.is_empty())
            .ok_or_else(|| "OAuth provider callback nonce is required".to_string())?;
        if !verify_wechat_message_signature(
            verification_token,
            timestamp,
            nonce,
            encrypted_payload,
            signature,
        ) {
            return Err("OAuth provider callback signature is invalid".to_string());
        }
        return Ok(());
    }

    let provided_token = query
        .get("verify_token")
        .or_else(|| query.get("token"))
        .map(String::as_str)
        .filter(|value| !value.is_empty());
    if provided_token == Some(verification_token) {
        return Ok(());
    }

    Err("OAuth provider callback verification token is required".to_string())
}

async fn record_callback_event(
    pg: &PgPool,
    config: &OAuthWebhookConfig,
    flow_kind: &str,
    outcome: &str,
    error_code: Option<&str>,
    detail: Value,
    meta: &ProviderCallbackRequestMeta,
) -> Result<(), String> {
    let id = format!("iamoce-{}", uuid::Uuid::now_v7());
    let now = chrono::Utc::now().to_rfc3339();
    sqlx::query(
        "INSERT INTO iam_oauth_callback_event (\
            id, uuid, tenant_id, organization_id, provider_code, integration_id, flow_kind, outcome, \
            error_code, webhook_config_id, request_ip_hash, user_agent_hash, detail_json, created_at\
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)",
    )
    .bind(&id)
    .bind(uuid::Uuid::now_v7().to_string())
    .bind(&config.tenant_id)
    .bind(&config.organization_id)
    .bind(&config.provider_code)
    .bind(&config.integration_id)
    .bind(flow_kind)
    .bind(outcome)
    .bind(error_code)
    .bind(&config.id)
    .bind(meta.request_ip.as_deref().map(hash_value))
    .bind(meta.user_agent.as_deref().map(hash_value))
    .bind(detail.to_string())
    .bind(&now)
    .execute(pg)
    .await
    .map_err(|error| format!("record oauth callback event failed: {error}"))?;
    Ok(())
}

async fn update_webhook_verified(pg: &PgPool, webhook_config_id: &str) -> Result<(), String> {
    let now = chrono::Utc::now().to_rfc3339();
    sqlx::query(
        "UPDATE iam_oauth_webhook_config \
         SET verification_token_status = 'verified', last_verified_at = $2, last_verify_error_code = NULL, updated_at = $2 \
         WHERE id = $1",
    )
    .bind(webhook_config_id)
    .bind(&now)
    .execute(pg)
    .await
    .map_err(|error| format!("update webhook verification status failed: {error}"))?;
    Ok(())
}

async fn update_webhook_event(
    pg: &PgPool,
    webhook_config_id: &str,
    provider_event_id: Option<&str>,
) -> Result<(), String> {
    let now = chrono::Utc::now().to_rfc3339();
    sqlx::query(
        "UPDATE iam_oauth_webhook_config \
         SET last_event_at = $2, last_event_id = $3, updated_at = $2 \
         WHERE id = $1",
    )
    .bind(webhook_config_id)
    .bind(&now)
    .bind(provider_event_id)
    .execute(pg)
    .await
    .map_err(|error| format!("update webhook event metadata failed: {error}"))?;
    Ok(())
}

fn read_query_or_json(
    body: &Value,
    query: &HashMap<String, String>,
    keys: &[&str],
) -> Option<String> {
    for key in keys {
        if let Some(value) = query.get(*key).filter(|value| !value.is_empty()) {
            return Some(value.clone());
        }
        if let Some(value) = body
            .get(*key)
            .and_then(Value::as_str)
            .filter(|value| !value.is_empty())
        {
            return Some(value.to_string());
        }
        let snake = to_snake_case(key);
        if let Some(value) = body
            .get(&snake)
            .and_then(Value::as_str)
            .filter(|value| !value.is_empty())
        {
            return Some(value.to_string());
        }
    }
    None
}

fn to_snake_case(value: &str) -> String {
    value
        .chars()
        .flat_map(|ch| {
            if ch.is_ascii_uppercase() {
                vec!['_', ch.to_ascii_lowercase()]
            } else {
                vec![ch]
            }
        })
        .collect::<String>()
        .trim_start_matches('_')
        .to_string()
}

fn hash_value(value: &str) -> String {
    let digest = Sha256::digest(value.as_bytes());
    format!("{digest:x}")
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn wechat_signature_verification_matches_sorted_sha1() {
        let token = "test-token";
        let timestamp = "1400000000";
        let nonce = "nonce";
        let mut parts = [token.to_string(), timestamp.to_string(), nonce.to_string()];
        parts.sort();
        let digest = Sha1::digest(parts.join("").as_bytes());
        let signature = format!("{:x}", digest);

        assert!(verify_wechat_signature(token, timestamp, nonce, &signature));
        assert!(!verify_wechat_signature(token, timestamp, nonce, "invalid"));
    }

    #[test]
    fn hub_challenge_verification_returns_plaintext_challenge() {
        let mut query = HashMap::new();
        query.insert("hub.mode".to_string(), "subscribe".to_string());
        query.insert("hub.verify_token".to_string(), "secret".to_string());
        query.insert("hub.challenge".to_string(), "123456".to_string());

        let response =
            try_hub_challenge_verification(&query, "secret", "hub.verify_token", "hub.challenge")
                .expect("verification should succeed")
                .expect("challenge response should exist");
        assert_eq!(response.body, "123456");
        assert_eq!(response.content_type, Some("text/plain"));
    }

    #[test]
    fn parses_plaintext_wechat_xml_callback() {
        let payload = parse_provider_callback_body(
            br#"<xml><MsgId>42</MsgId><MsgType>event &amp; webhook &#x2B; sync</MsgType><Event><![CDATA[subscribe & notify]]></Event><Optional/></xml>"#,
            Some("text/xml"),
        )
        .expect("xml payload");
        assert_eq!(payload["MsgId"], "42");
        assert_eq!(payload["MsgType"], "event & webhook + sync");
        assert_eq!(payload["Event"], "subscribe & notify");
        assert_eq!(payload["Optional"], "");
    }

    #[test]
    fn rejects_ambiguous_or_unsafe_wechat_xml_callback() {
        assert!(parse_provider_callback_body(
            br#"<!DOCTYPE xml><xml><MsgId>42</MsgId></xml>"#,
            Some("text/xml"),
        )
        .is_err());
        assert!(parse_provider_callback_body(
            br#"<xml><Outer><Inner>42</Inner></Outer></xml>"#,
            Some("text/xml"),
        )
        .is_err());
        assert!(parse_provider_callback_body(br#"<xml><MsgId>42"#, Some("text/xml"),).is_err());
    }

    #[test]
    fn encrypted_wechat_signature_includes_ciphertext() {
        let token = "token";
        let timestamp = "1";
        let nonce = "2";
        let encrypted = "ciphertext";
        let mut parts = [
            token.to_string(),
            timestamp.to_string(),
            nonce.to_string(),
            encrypted.to_string(),
        ];
        parts.sort();
        let digest = Sha1::digest(parts.join("").as_bytes());
        let signature = format!("{:x}", digest);
        assert!(verify_wechat_message_signature(
            token,
            timestamp,
            nonce,
            Some(encrypted),
            &signature,
        ));
    }
}
