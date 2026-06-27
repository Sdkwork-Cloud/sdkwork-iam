use serde_json::{json, Value};
use sha1::{Digest as Sha1Digest, Sha1};
use sha2::Sha256;
use sqlx::{PgPool, Row};
use std::collections::HashMap;

const SECRET_KIND_VERIFICATION_TOKEN: &str = "verification_token";

#[derive(Clone, Debug)]
pub struct OAuthWebhookConfig {
    pub id: String,
    pub tenant_id: String,
    pub organization_id: String,
    pub integration_id: String,
    pub provider_code: String,
    pub message_handling_mode: String,
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
    body: &Value,
    meta: &ProviderCallbackRequestMeta,
) -> Result<ProviderCallbackHttpResponse, String> {
    let config = load_active_webhook_config(pg, callback_public_id).await?;

    let provider_event_id = read_query_or_json(body, query, &["MsgId", "msg_id", "id", "event_id"]);
    let provider_event_type =
        read_query_or_json(body, query, &["MsgType", "msg_type", "event", "event_type"]);

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
        "SELECT id, tenant_id, organization_id, integration_id, provider_code, webhook_kind, message_handling_mode \
         FROM iam_oauth_webhook_config \
         WHERE callback_public_id = $1 AND enabled = 1 AND status = 'active' \
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
        .unwrap_or("");
    if !provided_token.is_empty() && provided_token != verification_token {
        return Err("OAuth callback verify_token is invalid".to_string());
    }

    Ok(Some(ProviderCallbackHttpResponse {
        status_code: 200,
        content_type: Some("text/plain"),
        body: challenge.to_string(),
    }))
}

fn verify_wechat_signature(token: &str, timestamp: &str, nonce: &str, signature: &str) -> bool {
    let mut parts = vec![token.to_string(), timestamp.to_string(), nonce.to_string()];
    parts.sort();
    let joined = parts.join("");
    let digest = Sha1::digest(joined.as_bytes());
    let expected = format!("{:x}", digest);
    expected.eq_ignore_ascii_case(signature)
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
        let mut parts = vec![token.to_string(), timestamp.to_string(), nonce.to_string()];
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
}
