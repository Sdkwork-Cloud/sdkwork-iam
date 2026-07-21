use base64::{engine::general_purpose::URL_SAFE_NO_PAD, Engine as _};
use hmac::{Hmac, Mac};
use serde::{Deserialize, Serialize};
use sha2::Sha256;
use std::collections::BTreeMap;
use std::time::{SystemTime, UNIX_EPOCH};

use crate::oauth_provider_catalog::normalize_oauth_provider_code;

type HmacSha256 = Hmac<Sha256>;

const DEFAULT_LOCAL_OAUTH_CODE_TTL_SECONDS: u64 = 300;

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct LocalOAuthProviderProfile {
    pub provider: String,
    pub subject: String,
    pub open_id: Option<String>,
    pub union_id: Option<String>,
    pub union_scope_id: Option<String>,
    pub email: Option<String>,
    pub phone: Option<String>,
    pub name: Option<String>,
    pub avatar: Option<String>,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
struct LocalOAuthAuthorizationCodeClaims {
    provider: String,
    subject: String,
    email: Option<String>,
    phone: Option<String>,
    name: Option<String>,
    avatar: Option<String>,
    issued_at: i64,
    expires_at: i64,
}

#[derive(Clone, Debug)]
pub struct LocalOAuthAuthority {
    code_secret: String,
    code_ttl_seconds: u64,
    provider_order: Vec<String>,
    providers: BTreeMap<String, LocalOAuthProviderProfile>,
}

impl LocalOAuthAuthority {
    pub fn from_env(provider_key: &str) -> Self {
        let mut provider_order = Vec::new();
        let providers = resolve_local_oauth_providers_from_env()
            .into_iter()
            .filter_map(|provider| {
                read_local_oauth_provider_profile(&provider)
                    .ok()
                    .map(|profile| {
                        provider_order.push(provider.clone());
                        (provider, profile)
                    })
            })
            .collect();

        Self {
            code_secret: resolve_local_oauth_code_secret(provider_key),
            code_ttl_seconds: resolve_local_oauth_code_ttl_seconds(),
            provider_order,
            providers,
        }
    }

    pub fn enabled_provider_codes(&self) -> Vec<String> {
        self.provider_order.clone()
    }

    pub fn has_enabled_providers(&self) -> bool {
        !self.providers.is_empty()
    }

    pub fn provider_profile(&self, provider: &str) -> Option<&LocalOAuthProviderProfile> {
        let normalized = normalize_oauth_provider_code(provider)?;
        self.providers.get(&normalized)
    }

    pub fn build_authorization_url(
        &self,
        provider: &str,
        redirect_uri: &str,
        state: Option<&str>,
    ) -> Result<String, String> {
        let redirect_uri = redirect_uri.trim();
        if redirect_uri.is_empty() {
            return Err("redirectUri is required".to_string());
        }

        let profile = self
            .provider_profile(provider)
            .ok_or_else(|| format!("OAuth provider {provider} is not enabled"))?;
        let code = self.issue_authorization_code(profile)?;
        let mut query = vec![("code".to_string(), code)];
        if let Some(state) = state.map(str::trim).filter(|value| !value.is_empty()) {
            query.push(("state".to_string(), state.to_string()));
        }

        Ok(append_query_parameters(redirect_uri, &query))
    }

    pub fn resolve_authorization_code(
        &self,
        provider: &str,
        code: &str,
    ) -> Result<LocalOAuthProviderProfile, String> {
        let claims = verify_local_oauth_authorization_code(&self.code_secret, code)?;
        let normalized = normalize_oauth_provider_code(provider)
            .ok_or_else(|| "OAuth provider is invalid".to_string())?;
        if claims.provider != normalized {
            return Err("OAuth authorization code provider does not match".to_string());
        }
        self.provider_profile(&normalized)
            .cloned()
            .ok_or_else(|| format!("OAuth provider {normalized} is not enabled"))
    }

    fn issue_authorization_code(
        &self,
        profile: &LocalOAuthProviderProfile,
    ) -> Result<String, String> {
        let issued_at = current_unix_timestamp_seconds();
        let expires_at = issued_at + self.code_ttl_seconds as i64;
        sign_local_oauth_authorization_code(
            &self.code_secret,
            &LocalOAuthAuthorizationCodeClaims {
                provider: profile.provider.clone(),
                subject: profile.subject.clone(),
                email: profile.email.clone(),
                phone: profile.phone.clone(),
                name: profile.name.clone(),
                avatar: profile.avatar.clone(),
                issued_at,
                expires_at,
            },
        )
    }
}

pub fn resolve_local_oauth_providers_from_env() -> Vec<String> {
    std::env::var("SDKWORK_IAM_OAUTH_PROVIDERS")
        .ok()
        .map(|value| collect_normalized_oauth_provider_identifiers(&value))
        .unwrap_or_default()
}

pub fn read_local_oauth_provider_profile(
    provider: &str,
) -> Result<LocalOAuthProviderProfile, String> {
    let normalized = normalize_oauth_provider_code(provider)
        .ok_or_else(|| "OAuth provider is invalid".to_string())?;
    let subject_env = local_oauth_provider_env_key(&normalized, "SUBJECT")?;
    let subject =
        read_env_trimmed(&subject_env).unwrap_or_else(|| format!("{normalized}:local-subject"));

    Ok(LocalOAuthProviderProfile {
        provider: normalized.clone(),
        subject,
        open_id: None,
        union_id: None,
        union_scope_id: None,
        email: local_oauth_provider_env_key(&normalized, "EMAIL")
            .ok()
            .and_then(|key| read_env_trimmed(&key)),
        phone: local_oauth_provider_env_key(&normalized, "PHONE")
            .ok()
            .and_then(|key| read_env_trimmed(&key)),
        name: local_oauth_provider_env_key(&normalized, "NAME")
            .ok()
            .and_then(|key| read_env_trimmed(&key)),
        avatar: local_oauth_provider_env_key(&normalized, "AVATAR_URL")
            .ok()
            .and_then(|key| read_env_trimmed(&key)),
    })
}

fn resolve_local_oauth_code_secret(provider_key: &str) -> String {
    read_env_trimmed("SDKWORK_IAM_OAUTH_CODE_SECRET")
        .unwrap_or_else(|| format!("{provider_key}:local-oauth"))
}

fn resolve_local_oauth_code_ttl_seconds() -> u64 {
    std::env::var("SDKWORK_IAM_OAUTH_CODE_TTL_SECONDS")
        .ok()
        .and_then(|value| value.trim().parse().ok())
        .filter(|value| *value > 0)
        .unwrap_or(DEFAULT_LOCAL_OAUTH_CODE_TTL_SECONDS)
}

fn local_oauth_provider_env_key(provider: &str, suffix: &str) -> Result<String, String> {
    let normalized = normalize_oauth_provider_code(provider)
        .ok_or_else(|| "OAuth provider is invalid".to_string())?;
    let provider_segment = normalized.to_ascii_uppercase();
    Ok(format!("SDKWORK_IAM_OAUTH_{provider_segment}_{suffix}"))
}

fn collect_normalized_oauth_provider_identifiers(raw_value: &str) -> Vec<String> {
    raw_value
        .split([',', ';', ' '])
        .filter_map(normalize_oauth_provider_code)
        .collect()
}

fn sign_local_oauth_authorization_code(
    secret: &str,
    claims: &LocalOAuthAuthorizationCodeClaims,
) -> Result<String, String> {
    let payload = serde_json::to_vec(claims)
        .map_err(|error| format!("serialize local OAuth payload failed: {error}"))?;
    let encoded_payload = URL_SAFE_NO_PAD.encode(payload);
    let mut signer = HmacSha256::new_from_slice(secret.as_bytes())
        .map_err(|error| format!("initialize local OAuth signer failed: {error}"))?;
    signer.update(encoded_payload.as_bytes());
    let signature = signer.finalize().into_bytes();
    Ok(format!(
        "{}.{}",
        encoded_payload,
        URL_SAFE_NO_PAD.encode(signature)
    ))
}

fn verify_local_oauth_authorization_code(
    secret: &str,
    code: &str,
) -> Result<LocalOAuthAuthorizationCodeClaims, String> {
    let normalized_code = code.trim();
    let (encoded_payload, encoded_signature) = normalized_code
        .split_once('.')
        .ok_or_else(|| "OAuth authorization code is invalid".to_string())?;
    let signature = URL_SAFE_NO_PAD
        .decode(encoded_signature.as_bytes())
        .map_err(|_| "OAuth authorization code signature is invalid".to_string())?;
    let mut signer = HmacSha256::new_from_slice(secret.as_bytes())
        .map_err(|error| format!("initialize local OAuth signer failed: {error}"))?;
    signer.update(encoded_payload.as_bytes());
    signer
        .verify_slice(signature.as_slice())
        .map_err(|_| "OAuth authorization code signature is invalid".to_string())?;
    let payload = URL_SAFE_NO_PAD
        .decode(encoded_payload.as_bytes())
        .map_err(|_| "OAuth authorization code payload is invalid".to_string())?;
    let claims: LocalOAuthAuthorizationCodeClaims = serde_json::from_slice(&payload)
        .map_err(|error| format!("parse local OAuth authorization payload failed: {error}"))?;
    if claims.expires_at < current_unix_timestamp_seconds() {
        return Err("OAuth authorization code has expired".to_string());
    }
    Ok(claims)
}

fn append_query_parameters(url: &str, params: &[(String, String)]) -> String {
    if params.is_empty() {
        return url.to_string();
    }

    let separator = if url.contains('?') { '&' } else { '?' };
    let query = params
        .iter()
        .map(|(key, value)| format!("{}={}", urlencoding_encode(key), urlencoding_encode(value)))
        .collect::<Vec<_>>()
        .join("&");
    format!("{url}{separator}{query}")
}

fn urlencoding_encode(value: &str) -> String {
    value
        .chars()
        .map(|ch| match ch {
            'A'..='Z' | 'a'..='z' | '0'..='9' | '-' | '_' | '.' | '~' => ch.to_string(),
            _ => format!("%{:02X}", ch as u8),
        })
        .collect()
}

fn read_env_trimmed(name: &str) -> Option<String> {
    std::env::var(name)
        .ok()
        .map(|value| value.trim().to_string())
        .filter(|value| !value.is_empty())
}

fn current_unix_timestamp_seconds() -> i64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|duration| duration.as_secs() as i64)
        .unwrap_or(0)
}
