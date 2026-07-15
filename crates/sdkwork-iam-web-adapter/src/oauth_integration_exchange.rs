use base64::{engine::general_purpose::STANDARD as BASE64_STANDARD, Engine as _};
use reqwest::header::{ACCEPT, AUTHORIZATION, CONTENT_TYPE};
use serde_json::Value;
use sqlx::{PgPool, Row};

use crate::oauth_login_local::LocalOAuthProviderProfile;
use crate::oauth_provider_catalog::normalize_oauth_provider_code;
use crate::signing_secrets::decode_signing_secret_ref;

const SECRET_KIND_CLIENT_SECRET: &str = "client_secret";

#[derive(Clone, Debug)]
pub struct OAuthIntegrationExchangeContext {
    pub integration_id: String,
    pub oauth_client_row_id: String,
    pub provider_code: String,
    pub provider_client_id: String,
    pub provider_union_scope_id: Option<String>,
    pub client_auth_method: String,
    pub client_secret: String,
    pub token_endpoint: String,
    pub userinfo_endpoint: Option<String>,
    pub protocol_family: String,
    pub supports_userinfo: bool,
}

#[derive(Clone, Debug)]
struct OAuthTokenResponse {
    access_token: String,
    open_id: Option<String>,
    union_id: Option<String>,
    #[allow(dead_code)]
    id_token: Option<String>,
    #[allow(dead_code)]
    token_type: Option<String>,
}

pub async fn load_oauth_integration_exchange_context(
    pg: &PgPool,
    tenant_id: &str,
    provider_code: &str,
) -> Result<Option<OAuthIntegrationExchangeContext>, String> {
    load_oauth_integration_exchange_context_for_app(pg, tenant_id, provider_code, None, None).await
}

pub async fn load_oauth_integration_exchange_context_for_app(
    pg: &PgPool,
    tenant_id: &str,
    provider_code: &str,
    runtime_app_id: Option<&str>,
    surface_code: Option<&str>,
) -> Result<Option<OAuthIntegrationExchangeContext>, String> {
    let normalized = normalize_oauth_provider_code(provider_code)
        .ok_or_else(|| "OAuth provider is invalid".to_string())?;

    let row = sqlx::query(
        "SELECT i.id, c.id, c.provider_client_id, c.provider_tenant_id, c.client_auth_method, \
                COALESCE(c.token_endpoint_override, cat.token_endpoint) AS token_endpoint, \
                COALESCE(c.userinfo_endpoint_override, cat.userinfo_endpoint) AS userinfo_endpoint, \
                COALESCE(i.protocol_family, cat.protocol_family) AS protocol_family, \
                COALESCE(cat.supports_userinfo, 0) AS supports_userinfo \
         FROM iam_oauth_integration i \
         JOIN iam_oauth_client c ON c.integration_id = i.id AND c.enabled = 1 AND c.status = 'active' \
         LEFT JOIN iam_oauth_provider_catalog cat \
           ON cat.provider_code = i.provider_code AND cat.status = 'active' \
         WHERE i.tenant_id = $1 AND i.provider_code = $2 AND i.enabled = 1 AND i.status = 'active' \
           AND ($3::text IS NULL OR i.app_id = $3 OR i.app_id = '0') \
           AND ($4::text IS NULL OR EXISTS (\
             SELECT 1 FROM iam_oauth_surface s \
             WHERE s.tenant_id = i.tenant_id AND s.integration_id = i.id \
               AND s.oauth_client_id = c.id AND s.surface_code = $4 \
               AND s.surface_kind = 'mini_program' AND s.enabled = 1 AND s.status = 'active'\
           )) \
         ORDER BY CASE WHEN i.app_id = $3 THEN 0 ELSE 1 END, c.id \
         LIMIT 1",
    )
    .bind(tenant_id)
    .bind(&normalized)
    .bind(runtime_app_id)
    .bind(surface_code)
    .fetch_optional(pg)
    .await
    .map_err(|error| format!("load oauth integration exchange context failed: {error}"))?;

    let Some(row) = row else {
        return Ok(None);
    };

    let integration_id: String = row.get(0);
    let oauth_client_row_id: String = row.get(1);
    let provider_client_id: String = row.get(2);
    let provider_union_scope_id: Option<String> = row.get(3);
    let client_auth_method: String = row.get(4);
    let token_endpoint: Option<String> = row.get(5);
    let userinfo_endpoint: Option<String> = row.get(6);
    let protocol_family: String = row.get(7);
    let supports_userinfo: i32 = row.get(8);

    let token_endpoint = token_endpoint
        .map(|value| value.trim().to_string())
        .filter(|value| !value.is_empty())
        .or_else(|| builtin_token_endpoint(&normalized).map(str::to_string))
        .ok_or_else(|| format!("OAuth provider {normalized} is missing token endpoint"))?;

    let userinfo_endpoint = userinfo_endpoint
        .map(|value| value.trim().to_string())
        .filter(|value| !value.is_empty())
        .or_else(|| builtin_userinfo_endpoint(&normalized).map(str::to_string));

    let client_secret = resolve_oauth_client_secret(
        pg,
        tenant_id,
        &oauth_client_row_id,
        &normalized,
        &provider_client_id,
    )
    .await?;

    Ok(Some(OAuthIntegrationExchangeContext {
        integration_id,
        oauth_client_row_id,
        provider_code: normalized,
        provider_client_id,
        provider_union_scope_id,
        client_auth_method,
        client_secret,
        token_endpoint,
        userinfo_endpoint,
        protocol_family,
        supports_userinfo: supports_userinfo != 0,
    }))
}

pub async fn exchange_oauth_authorization_code(
    ctx: &OAuthIntegrationExchangeContext,
    code: &str,
    redirect_uri: &str,
) -> Result<LocalOAuthProviderProfile, String> {
    let code = code.trim();
    if code.is_empty() {
        return Err("OAuth authorization code is required".to_string());
    }
    let redirect_uri = redirect_uri.trim();
    if redirect_uri.is_empty() {
        return Err("OAuth redirectUri is required".to_string());
    }

    let token = request_oauth_token(ctx, code, redirect_uri).await?;
    let claims = resolve_identity_claims(ctx, &token).await?;
    map_claims_to_profile(
        &ctx.provider_code,
        ctx.provider_union_scope_id.as_deref(),
        claims,
    )
}

pub async fn exchange_wechat_mini_program_code(
    pg: &PgPool,
    tenant_id: &str,
    runtime_app_id: &str,
    surface_code: Option<&str>,
    code: &str,
) -> Result<(LocalOAuthProviderProfile, String), String> {
    let code = code.trim();
    if code.is_empty() {
        return Err("WeChat mini program jsCode is required".to_string());
    }
    let Some(ctx) = load_oauth_integration_exchange_context_for_app(
        pg,
        tenant_id,
        "wechat_mini_program",
        Some(runtime_app_id),
        surface_code,
    )
    .await?
    else {
        return Err("WeChat mini program integration is not configured".to_string());
    };
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(10))
        .build()
        .map_err(|error| format!("create WeChat mini program client failed: {error}"))?;
    let response = client
        .get(&ctx.token_endpoint)
        .query(&[
            ("appid", ctx.provider_client_id.as_str()),
            ("secret", ctx.client_secret.as_str()),
            ("js_code", code),
            ("grant_type", "authorization_code"),
        ])
        .header(ACCEPT, "application/json")
        .send()
        .await
        .map_err(|error| format!("WeChat mini program code exchange failed: {error}"))?;
    let status = response.status();
    let body = response
        .text()
        .await
        .map_err(|error| format!("read WeChat mini program response failed: {error}"))?;
    if !status.is_success() {
        return Err(format!(
            "WeChat mini program code exchange failed with status {}",
            status.as_u16()
        ));
    }
    let profile =
        parse_wechat_mini_program_response(&body, ctx.provider_union_scope_id.as_deref())?;
    Ok((profile, ctx.integration_id))
}

pub async fn probe_wechat_mini_program_configuration(
    pg: &PgPool,
    tenant_id: &str,
    runtime_app_id: &str,
    surface_code: Option<&str>,
) -> Result<(), String> {
    match exchange_wechat_mini_program_code(
        pg,
        tenant_id,
        runtime_app_id,
        surface_code,
        "sdkwork-iam-diagnostic-invalid-code",
    )
    .await
    {
        Err(error) if error.contains("(40029)") => Ok(()),
        Err(error) => Err(error),
        Ok(_) => Err("WeChat mini program diagnostic received an unexpected identity".to_string()),
    }
}

fn parse_wechat_mini_program_response(
    body: &str,
    union_scope_id: Option<&str>,
) -> Result<LocalOAuthProviderProfile, String> {
    let value: Value = serde_json::from_str(body)
        .map_err(|error| format!("parse WeChat mini program response failed: {error}"))?;
    if let Some(error_code) = value.get("errcode").and_then(Value::as_i64) {
        if error_code != 0 {
            let message = value
                .get("errmsg")
                .and_then(Value::as_str)
                .unwrap_or("unknown WeChat error");
            return Err(format!(
                "WeChat mini program exchange failed ({error_code}): {message}"
            ));
        }
    }
    let open_id = value
        .get("openid")
        .and_then(Value::as_str)
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .ok_or_else(|| "WeChat mini program response is missing openid".to_string())?
        .to_string();
    let union_id = value
        .get("unionid")
        .and_then(Value::as_str)
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .map(str::to_string);
    Ok(LocalOAuthProviderProfile {
        provider: "wechat_mini_program".to_string(),
        subject: open_id.clone(),
        open_id: Some(open_id),
        union_id,
        union_scope_id: union_scope_id.map(str::to_string),
        email: None,
        phone: None,
        name: None,
        avatar: None,
    })
}

async fn resolve_oauth_client_secret(
    pg: &PgPool,
    tenant_id: &str,
    oauth_client_row_id: &str,
    provider_code: &str,
    provider_client_id: &str,
) -> Result<String, String> {
    if let Some(secret) = read_env_oauth_client_secret(provider_code) {
        return Ok(secret);
    }

    let row = sqlx::query_scalar::<_, String>(
        "SELECT secret_ref FROM iam_oauth_secret \
         WHERE tenant_id = $1 AND oauth_client_id = $2 AND secret_kind = $3 AND status = 'active' \
         ORDER BY active_from DESC \
         LIMIT 1",
    )
    .bind(tenant_id)
    .bind(oauth_client_row_id)
    .bind(SECRET_KIND_CLIENT_SECRET)
    .fetch_optional(pg)
    .await
    .map_err(|error| format!("load oauth client secret failed: {error}"))?;

    if let Some(secret_ref) = row {
        let decoded = decode_signing_secret_ref(&secret_ref)?;
        let secret = String::from_utf8(decoded)
            .map_err(|error| format!("oauth client secret is not valid utf-8: {error}"))?;
        if !crate::is_blank(Some(secret.as_str())) {
            return Ok(secret);
        }
    }

    if crate::allows_oauth_client_secret_env_override() {
        if let Some(secret) = std::env::var("SDKWORK_IAM_OAUTH_CLIENT_SECRET")
            .ok()
            .map(|value| value.trim().to_string())
            .filter(|value| !value.is_empty())
        {
            return Ok(secret);
        }
    }

    let _ = provider_client_id;
    Err(format!(
        "OAuth provider {provider_code} is missing client secret configuration"
    ))
}

async fn request_oauth_token(
    ctx: &OAuthIntegrationExchangeContext,
    code: &str,
    redirect_uri: &str,
) -> Result<OAuthTokenResponse, String> {
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(20))
        .build()
        .map_err(|error| format!("create oauth http client failed: {error}"))?;

    let mut request = client.post(&ctx.token_endpoint);
    let auth_method = ctx.client_auth_method.trim().to_ascii_lowercase();

    if matches!(ctx.provider_code.as_str(), "wechat" | "wechat_open") {
        let response = client
            .get(&ctx.token_endpoint)
            .query(&[
                ("appid", ctx.provider_client_id.as_str()),
                ("secret", ctx.client_secret.as_str()),
                ("code", code),
                ("grant_type", "authorization_code"),
            ])
            .header(ACCEPT, "application/json")
            .send()
            .await
            .map_err(|error| format!("WeChat OAuth token exchange request failed: {error}"))?;
        let status = response.status();
        let body = response
            .text()
            .await
            .map_err(|error| format!("read WeChat OAuth token response failed: {error}"))?;
        if !status.is_success() {
            return Err(format!(
                "WeChat OAuth token exchange failed with status {}",
                status.as_u16()
            ));
        }
        return parse_token_response(&body, &ctx.provider_code);
    }

    if auth_method == "client_secret_basic" {
        let credentials =
            BASE64_STANDARD.encode(format!("{}:{}", ctx.provider_client_id, ctx.client_secret));
        request = request.header(AUTHORIZATION, format!("Basic {credentials}"));
    }

    let mut form = vec![
        ("grant_type".to_string(), "authorization_code".to_string()),
        ("code".to_string(), code.to_string()),
        ("redirect_uri".to_string(), redirect_uri.to_string()),
        ("client_id".to_string(), ctx.provider_client_id.clone()),
    ];
    if auth_method != "client_secret_basic" && auth_method != "none" {
        form.push(("client_secret".to_string(), ctx.client_secret.clone()));
    }

    let response = request
        .header(CONTENT_TYPE, "application/x-www-form-urlencoded")
        .header(ACCEPT, "application/json")
        .form(&form)
        .send()
        .await
        .map_err(|error| format!("oauth token exchange request failed: {error}"))?;

    let status = response.status();
    let body = response
        .text()
        .await
        .map_err(|error| format!("read oauth token response failed: {error}"))?;

    if !status.is_success() {
        return Err(format!(
            "oauth token exchange failed with status {}: {}",
            status.as_u16(),
            summarize_oauth_error_body(&body)
        ));
    }

    parse_token_response(&body, &ctx.provider_code)
}

async fn resolve_identity_claims(
    ctx: &OAuthIntegrationExchangeContext,
    token: &OAuthTokenResponse,
) -> Result<Value, String> {
    if ctx.supports_userinfo {
        if let Some(endpoint) = ctx.userinfo_endpoint.as_deref() {
            let mut claims = fetch_userinfo_claims(
                endpoint,
                &token.access_token,
                &ctx.provider_code,
                token.open_id.as_deref(),
            )
            .await?;
            if let Some(object) = claims.as_object_mut() {
                if let Some(open_id) = token.open_id.as_deref() {
                    object
                        .entry("openid".to_string())
                        .or_insert_with(|| Value::String(open_id.to_string()));
                }
                if let Some(union_id) = token.union_id.as_deref() {
                    object
                        .entry("unionid".to_string())
                        .or_insert_with(|| Value::String(union_id.to_string()));
                }
            }
            return Ok(claims);
        }
    }

    if ctx.protocol_family.eq_ignore_ascii_case("oidc") {
        return Err("OAuth provider userinfo is required for OIDC identity resolution".to_string());
    }

    Err("OAuth provider identity claims are unavailable".to_string())
}

async fn fetch_userinfo_claims(
    endpoint: &str,
    access_token: &str,
    provider_code: &str,
    open_id: Option<&str>,
) -> Result<Value, String> {
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(20))
        .build()
        .map_err(|error| format!("create oauth http client failed: {error}"))?;

    let mut request = client.get(endpoint).header(ACCEPT, "application/json");

    if matches!(provider_code, "wechat" | "wechat_open") {
        request = request.query(&[
            ("access_token", access_token),
            ("openid", open_id.unwrap_or_default()),
            ("lang", "zh_CN"),
        ]);
    } else {
        request = request.header(AUTHORIZATION, format!("Bearer {access_token}"));
    }

    if provider_code == "github" {
        request = request.header("User-Agent", "sdkwork-iam-oauth");
    }

    let response = request
        .send()
        .await
        .map_err(|error| format!("oauth userinfo request failed: {error}"))?;

    let status = response.status();
    let body = response
        .text()
        .await
        .map_err(|error| format!("read oauth userinfo response failed: {error}"))?;

    if !status.is_success() {
        return Err(format!(
            "oauth userinfo failed with status {}: {}",
            status.as_u16(),
            summarize_oauth_error_body(&body)
        ));
    }

    serde_json::from_str(&body)
        .map_err(|error| format!("parse oauth userinfo response failed: {error}"))
}

fn parse_token_response(body: &str, provider_code: &str) -> Result<OAuthTokenResponse, String> {
    if let Ok(value) = serde_json::from_str::<Value>(body) {
        return extract_token_response(value);
    }

    if provider_code == "github" || body.contains("access_token=") {
        let mut access_token = None;
        for segment in body.split('&') {
            let Some((key, value)) = segment.split_once('=') else {
                continue;
            };
            if key == "access_token" {
                access_token = Some(value.to_string());
            }
        }
        if let Some(access_token) = access_token {
            return Ok(OAuthTokenResponse {
                access_token,
                open_id: None,
                union_id: None,
                id_token: None,
                token_type: Some("bearer".to_string()),
            });
        }
    }

    Err(format!(
        "parse oauth token response failed: {}",
        summarize_oauth_error_body(body)
    ))
}

fn extract_token_response(value: Value) -> Result<OAuthTokenResponse, String> {
    let access_token = value
        .get("access_token")
        .and_then(Value::as_str)
        .map(str::trim)
        .filter(|token| !token.is_empty())
        .ok_or_else(|| "oauth token response is missing access_token".to_string())?;

    Ok(OAuthTokenResponse {
        access_token: access_token.to_string(),
        open_id: value
            .get("openid")
            .or_else(|| value.get("open_id"))
            .and_then(Value::as_str)
            .map(str::to_string),
        union_id: value
            .get("unionid")
            .or_else(|| value.get("union_id"))
            .and_then(Value::as_str)
            .map(str::to_string),
        id_token: value
            .get("id_token")
            .and_then(Value::as_str)
            .map(str::to_string),
        token_type: value
            .get("token_type")
            .and_then(Value::as_str)
            .map(str::to_string),
    })
}

fn map_claims_to_profile(
    provider_code: &str,
    union_scope_id: Option<&str>,
    claims: Value,
) -> Result<LocalOAuthProviderProfile, String> {
    let subject = extract_subject(&claims)
        .ok_or_else(|| "OAuth provider identity is missing subject".to_string())?;

    let email = pick_string_claim(
        &claims,
        &["email", "mail", "preferred_username", "username"],
    )
    .filter(|value| value.contains('@'));

    let phone = pick_string_claim(
        &claims,
        &["phone", "phone_number", "mobile", "mobile_phone"],
    );

    let name = pick_string_claim(
        &claims,
        &[
            "name",
            "display_name",
            "displayName",
            "nickname",
            "login",
            "username",
        ],
    );

    let avatar = pick_string_claim(
        &claims,
        &[
            "picture",
            "avatar",
            "avatar_url",
            "avatarUrl",
            "headimgurl",
            "profile_image_url",
            "profile_image_url_https",
        ],
    );

    if provider_code == "twitter" {
        if let Some(data) = claims.get("data") {
            return map_claims_to_profile(provider_code, union_scope_id, data.clone());
        }
    }

    Ok(LocalOAuthProviderProfile {
        provider: provider_code.to_string(),
        subject,
        open_id: pick_string_claim(&claims, &["open_id", "openid"]),
        union_id: pick_string_claim(&claims, &["unionid", "union_id"]),
        union_scope_id: union_scope_id.map(str::to_string),
        email,
        phone,
        name,
        avatar,
    })
}

fn extract_subject(claims: &Value) -> Option<String> {
    for key in [
        "sub", "id", "open_id", "openid", "unionid", "union_id", "user_id",
    ] {
        if let Some(value) = claims.get(key) {
            if let Some(subject) = value.as_str().map(str::trim).filter(|v| !v.is_empty()) {
                return Some(subject.to_string());
            }
            if value.is_i64() || value.is_u64() {
                return Some(value.to_string());
            }
        }
    }
    None
}

fn pick_string_claim(claims: &Value, keys: &[&str]) -> Option<String> {
    for key in keys {
        if let Some(value) = claims.get(*key).and_then(Value::as_str) {
            let trimmed = value.trim();
            if !trimmed.is_empty() {
                return Some(trimmed.to_string());
            }
        }
    }
    None
}

fn summarize_oauth_error_body(body: &str) -> String {
    let trimmed = body.trim();
    if trimmed.is_empty() {
        return "empty response".to_string();
    }
    if trimmed.len() > 240 {
        format!("{}...", &trimmed[..240])
    } else {
        trimmed.to_string()
    }
}

fn read_env_oauth_client_secret(provider_code: &str) -> Option<String> {
    if !crate::allows_oauth_client_secret_env_override() {
        return None;
    }
    let normalized = normalize_oauth_provider_code(provider_code)?;
    let provider_segment = normalized.to_ascii_uppercase();
    for key in [
        format!("SDKWORK_IAM_OAUTH_{provider_segment}_CLIENT_SECRET"),
        format!(
            "SDKWORK_IAM_OAUTH_{}_CLIENT_SECRET",
            provider_segment.replace('_', "")
        ),
    ] {
        if let Ok(value) = std::env::var(&key) {
            let trimmed = value.trim().to_string();
            if !trimmed.is_empty() {
                return Some(trimmed);
            }
        }
    }
    None
}

pub fn builtin_token_endpoint(provider_code: &str) -> Option<&'static str> {
    match provider_code {
        "google" => Some("https://oauth2.googleapis.com/token"),
        "github" => Some("https://github.com/login/oauth/access_token"),
        "twitter" => Some("https://api.twitter.com/2/oauth2/token"),
        "facebook" => Some("https://graph.facebook.com/v18.0/oauth/access_token"),
        "microsoft" => Some("https://login.microsoftonline.com/common/oauth2/v2.0/token"),
        "apple" => Some("https://appleid.apple.com/auth/token"),
        "linkedin" => Some("https://www.linkedin.com/oauth/v2/accessToken"),
        "line" => Some("https://api.line.me/oauth2/v2.1/token"),
        "discord" => Some("https://discord.com/api/oauth2/token"),
        "slack" => Some("https://slack.com/api/oauth.v2.access"),
        "tiktok" => Some("https://open.tiktokapis.com/v2/oauth/token/"),
        "amazon" => Some("https://api.amazon.com/auth/o2/token"),
        "yahoo" => Some("https://api.login.yahoo.com/oauth2/get_token"),
        "reddit" => Some("https://www.reddit.com/api/v1/access_token"),
        "paypal" => Some("https://api-m.paypal.com/v1/oauth2/token"),
        "wechat" | "wechat_open" => Some("https://api.weixin.qq.com/sns/oauth2/access_token"),
        "wechat_mini_program" => Some("https://api.weixin.qq.com/sns/jscode2session"),
        "qq" => Some("https://graph.qq.com/oauth2.0/token"),
        "weibo" => Some("https://api.weibo.com/oauth2/access_token"),
        "baidu" => Some("https://openapi.baidu.com/oauth/2.0/token"),
        "huawei" => Some("https://oauth-login.cloud.huawei.com/oauth2/v3/token"),
        "douyin" => Some("https://open.douyin.com/oauth/access_token/"),
        "alipay" => Some("https://openapi.alipay.com/gateway.do"),
        _ => None,
    }
}

pub fn builtin_userinfo_endpoint(provider_code: &str) -> Option<&'static str> {
    match provider_code {
        "google" => Some("https://openidconnect.googleapis.com/v1/userinfo"),
        "github" => Some("https://api.github.com/user"),
        "twitter" => Some("https://api.twitter.com/2/users/me?user.fields=profile_image_url"),
        "facebook" => Some("https://graph.facebook.com/me?fields=id,name,email,picture"),
        "microsoft" => Some("https://graph.microsoft.com/oidc/userinfo"),
        "linkedin" => Some("https://api.linkedin.com/v2/userinfo"),
        "line" => Some("https://api.line.me/v2/profile"),
        "discord" => Some("https://discord.com/api/users/@me"),
        "slack" => Some("https://slack.com/api/openid.connect.userInfo"),
        "tiktok" => Some("https://open.tiktokapis.com/v2/user/info/"),
        "amazon" => Some("https://api.amazon.com/user/profile"),
        "yahoo" => Some("https://api.login.yahoo.com/openid/v1/userinfo"),
        "reddit" => Some("https://oauth.reddit.com/api/v1/me"),
        "paypal" => Some("https://api-m.paypal.com/v1/identity/oauth2/userinfo"),
        "wechat" | "wechat_open" => Some("https://api.weixin.qq.com/sns/userinfo"),
        "qq" => Some("https://graph.qq.com/user/get_user_info"),
        "weibo" => Some("https://api.weibo.com/2/users/show.json"),
        "baidu" => Some("https://openapi.baidu.com/rest/2.0/passport/users/getInfo"),
        "huawei" => Some("https://account.cloud.huawei.com/rest.php?nsp_svc=GOpen.User.getInfo"),
        "douyin" => Some("https://open.douyin.com/oauth/userinfo/"),
        _ => None,
    }
}

pub fn builtin_authorization_endpoint(provider_code: &str) -> Option<&'static str> {
    match provider_code {
        "google" => Some("https://accounts.google.com/o/oauth2/v2/auth"),
        "github" => Some("https://github.com/login/oauth/authorize"),
        "twitter" => Some("https://twitter.com/i/oauth2/authorize"),
        "facebook" => Some("https://www.facebook.com/v18.0/dialog/oauth"),
        "microsoft" => Some("https://login.microsoftonline.com/common/oauth2/v2.0/authorize"),
        "apple" => Some("https://appleid.apple.com/auth/authorize"),
        "linkedin" => Some("https://www.linkedin.com/oauth/v2/authorization"),
        "line" => Some("https://access.line.me/oauth2/v2.1/authorize"),
        "discord" => Some("https://discord.com/api/oauth2/authorize"),
        "slack" => Some("https://slack.com/openid/connect/authorize"),
        "tiktok" => Some("https://www.tiktok.com/v2/auth/authorize/"),
        "amazon" => Some("https://www.amazon.com/ap/oa"),
        "yahoo" => Some("https://api.login.yahoo.com/oauth2/request_auth"),
        "reddit" => Some("https://www.reddit.com/api/v1/authorize"),
        "paypal" => Some("https://www.paypal.com/signin/authorize"),
        "wechat" => Some("https://open.weixin.qq.com/connect/oauth2/authorize"),
        "wechat_open" => Some("https://open.weixin.qq.com/connect/qrconnect"),
        "qq" => Some("https://graph.qq.com/oauth2.0/authorize"),
        "weibo" => Some("https://api.weibo.com/oauth2/authorize"),
        "baidu" => Some("https://openapi.baidu.com/oauth/2.0/authorize"),
        "huawei" => Some("https://oauth-login.cloud.huawei.com/oauth2/v3/authorize"),
        "douyin" => Some("https://open.douyin.com/platform/oauth/connect/"),
        "alipay" => Some("https://openauth.alipay.com/oauth2/publicAppAuthorize.htm"),
        _ => None,
    }
}

pub fn builtin_default_scopes(provider_code: &str) -> Vec<String> {
    match provider_code {
        "google" | "microsoft" | "yahoo" | "paypal" => {
            vec![
                "openid".to_string(),
                "email".to_string(),
                "profile".to_string(),
            ]
        }
        "github" => vec!["read:user".to_string(), "user:email".to_string()],
        "twitter" => vec![
            "tweet.read".to_string(),
            "users.read".to_string(),
            "offline.access".to_string(),
        ],
        "facebook" => vec!["email".to_string(), "public_profile".to_string()],
        "linkedin" => vec![
            "openid".to_string(),
            "profile".to_string(),
            "email".to_string(),
        ],
        "line" => vec![
            "profile".to_string(),
            "openid".to_string(),
            "email".to_string(),
        ],
        "discord" => vec!["identify".to_string(), "email".to_string()],
        "slack" => vec![
            "openid".to_string(),
            "profile".to_string(),
            "email".to_string(),
        ],
        "tiktok" => vec!["user.info.basic".to_string()],
        "reddit" => vec!["identity".to_string()],
        "wechat" => vec!["snsapi_userinfo".to_string()],
        "wechat_open" => vec!["snsapi_login".to_string()],
        "qq" => vec!["get_user_info".to_string()],
        "weibo" => vec!["email".to_string()],
        "douyin" => vec!["user_info".to_string()],
        "sdkwork" => vec![
            "openid".to_string(),
            "profile".to_string(),
            "email".to_string(),
        ],
        _ => Vec::new(),
    }
}

pub async fn seed_builtin_oauth_provider_catalog(pg: &PgPool) -> Result<(), String> {
    use crate::oauth_provider_catalog::builtin_oauth_provider_catalog;

    let now = chrono::Utc::now().to_rfc3339();
    for entry in builtin_oauth_provider_catalog() {
        let provider_code = entry.provider_code.as_str();
        let catalog_id = format!("catalog:0:{provider_code}");
        let (authorization_endpoint, token_endpoint, userinfo_endpoint) =
            if provider_code == "sdkwork" {
                let issuer = crate::oauth_authorization_server::oauth_issuer_base_url();
                (
                    format!("{issuer}/iam/v3/oauth/authorize"),
                    format!("{issuer}/iam/v3/oauth/token"),
                    format!("{issuer}/iam/v3/oauth/userinfo"),
                )
            } else {
                (
                    builtin_authorization_endpoint(provider_code)
                        .unwrap_or("")
                        .to_string(),
                    builtin_token_endpoint(provider_code)
                        .unwrap_or("")
                        .to_string(),
                    builtin_userinfo_endpoint(provider_code)
                        .unwrap_or("")
                        .to_string(),
                )
            };
        let default_scopes = serde_json::to_string(&builtin_default_scopes(provider_code))
            .unwrap_or_else(|_| "[]".to_string());
        let supports_userinfo = if userinfo_endpoint.is_empty() { 0 } else { 1 };
        let supports_id_token = if entry.protocol_family == "oidc" {
            1
        } else {
            0
        };

        sqlx::query(
            "INSERT INTO iam_oauth_provider_catalog (\
                id, uuid, owner_tenant_id, provider_code, provider_family, provider_name, \
                provider_display_name, region_group, protocol_family, authorization_endpoint, \
                token_endpoint, userinfo_endpoint, default_scopes_json, supports_userinfo, \
                supports_id_token, status, sort_order, created_at, updated_at\
             ) VALUES ($1, $2, '0', $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 'active', $15, $16, $16) \
             ON CONFLICT (owner_tenant_id, provider_code) DO UPDATE SET \
               provider_name = EXCLUDED.provider_name, \
               provider_display_name = EXCLUDED.provider_display_name, \
               region_group = EXCLUDED.region_group, \
               protocol_family = EXCLUDED.protocol_family, \
               authorization_endpoint = CASE WHEN EXCLUDED.authorization_endpoint <> '' \
                 THEN EXCLUDED.authorization_endpoint ELSE iam_oauth_provider_catalog.authorization_endpoint END, \
               token_endpoint = CASE WHEN EXCLUDED.token_endpoint <> '' \
                 THEN EXCLUDED.token_endpoint ELSE iam_oauth_provider_catalog.token_endpoint END, \
               userinfo_endpoint = CASE WHEN EXCLUDED.userinfo_endpoint <> '' \
                 THEN EXCLUDED.userinfo_endpoint ELSE iam_oauth_provider_catalog.userinfo_endpoint END, \
               default_scopes_json = EXCLUDED.default_scopes_json, \
               supports_userinfo = EXCLUDED.supports_userinfo, \
               supports_id_token = EXCLUDED.supports_id_token, \
               status = 'active', \
               sort_order = EXCLUDED.sort_order, \
               updated_at = EXCLUDED.updated_at",
        )
        .bind(&catalog_id)
        .bind(uuid::Uuid::now_v7().to_string())
        .bind(provider_code)
        .bind(provider_code)
        .bind(&entry.provider_name)
        .bind(&entry.display_name)
        .bind(region_group_to_db(entry.region_group))
        .bind(&entry.protocol_family)
        .bind(authorization_endpoint)
        .bind(token_endpoint)
        .bind(userinfo_endpoint)
        .bind(&default_scopes)
        .bind(supports_userinfo)
        .bind(supports_id_token)
        .bind(entry.sort_order)
        .bind(&now)
        .execute(pg)
        .await
        .map_err(|error| format!("seed oauth provider catalog failed for {provider_code}: {error}"))?;
    }

    Ok(())
}

fn region_group_to_db(
    region: crate::oauth_provider_catalog::OauthProviderRegionGroup,
) -> &'static str {
    use crate::oauth_provider_catalog::OauthProviderRegionGroup;
    match region {
        OauthProviderRegionGroup::Mainland => "mainland",
        OauthProviderRegionGroup::Overseas => "overseas",
        OauthProviderRegionGroup::Global => "global",
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    use serde_json::json;

    #[test]
    fn maps_standard_oidc_claims_to_profile() {
        let profile = map_claims_to_profile(
            "google",
            None,
            json!({
                "sub": "google-user-1",
                "email": "user@example.com",
                "name": "Example User",
                "picture": "https://cdn.example.com/a.png"
            }),
        )
        .expect("profile");

        assert_eq!(profile.provider, "google");
        assert_eq!(profile.subject, "google-user-1");
        assert_eq!(profile.email.as_deref(), Some("user@example.com"));
    }

    #[test]
    fn parses_github_form_encoded_token_response() {
        let token = parse_token_response(
            "access_token=ghs_123&scope=read:user&token_type=bearer",
            "github",
        )
        .expect("token");
        assert_eq!(token.access_token, "ghs_123");
    }

    #[test]
    fn parses_wechat_mini_program_identity_without_retaining_session_key() {
        let profile = parse_wechat_mini_program_response(
            r#"{"openid":"openid-1","unionid":"unionid-1","session_key":"secret"}"#,
            Some("wx-open-platform-1"),
        )
        .expect("mini program profile");

        assert_eq!(profile.subject, "openid-1");
        assert_eq!(profile.open_id.as_deref(), Some("openid-1"));
        assert_eq!(profile.union_id.as_deref(), Some("unionid-1"));
        assert_eq!(
            profile.union_scope_id.as_deref(),
            Some("wx-open-platform-1")
        );
        assert!(!serde_json::to_string(&profile)
            .expect("profile json")
            .contains("session_key"));
    }

    #[test]
    fn rejects_wechat_mini_program_provider_errors() {
        let error = parse_wechat_mini_program_response(
            r#"{"errcode":40029,"errmsg":"invalid code"}"#,
            Some("wx-open-platform-1"),
        )
        .expect_err("provider error must fail");

        assert!(error.contains("40029"));
        assert!(error.contains("invalid code"));
    }
}
