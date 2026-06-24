//! OAuth redirect URI validation for login and token exchange flows.

use sqlx::{PgPool, Row};
use std::collections::BTreeSet;

const REDIRECT_URI_ALLOWLIST_ENV: &str = "SDKWORK_IAM_OAUTH_REDIRECT_URI_ALLOWLIST";

pub fn validate_oauth_redirect_uri(
    redirect_uri: &str,
    registered_redirect_uris: &[String],
    allowed_hosts: &[String],
) -> Result<(), String> {
    let redirect_uri = redirect_uri.trim();
    if redirect_uri.is_empty() {
        return Err("OAuth redirectUri is required".to_string());
    }

    let host = parse_redirect_uri_host(redirect_uri)?;

    if registered_redirect_uris
        .iter()
        .any(|candidate| redirect_uris_match(candidate, redirect_uri))
    {
        return Ok(());
    }

    if allowed_hosts
        .iter()
        .any(|allowed| hosts_match(allowed, &host))
    {
        return Ok(());
    }

    if let Some(allowlist) = read_env_allowlist() {
        if allowlist
            .iter()
            .any(|candidate| redirect_uris_match(candidate, redirect_uri))
        {
            return Ok(());
        }
    }

    if registered_redirect_uris.is_empty()
        && allowed_hosts.is_empty()
        && crate::dev_runtime::allows_dev_authentication_fallback()
    {
        return Ok(());
    }

    Err("OAuth redirectUri is not registered for this provider".to_string())
}

pub async fn load_oauth_redirect_policy(
    pg: &PgPool,
    tenant_id: &str,
    provider_code: &str,
) -> Result<(Vec<String>, Vec<String>), String> {
    let rows = sqlx::query(
        "SELECT s.redirect_uri, s.allowed_redirect_hosts_json \
         FROM iam_oauth_surface s \
         JOIN iam_oauth_integration i ON i.id = s.integration_id \
         WHERE i.tenant_id = $1 AND i.provider_code = $2 \
           AND i.enabled = 1 AND i.status = 'active' \
           AND s.status = 'active'",
    )
    .bind(tenant_id)
    .bind(provider_code)
    .fetch_all(pg)
    .await
    .map_err(|error| format!("load oauth redirect policy failed: {error}"))?;

    let mut redirect_uris = BTreeSet::new();
    let mut allowed_hosts = BTreeSet::new();
    for row in rows {
        let redirect_uri: Option<String> = row
            .try_get::<Option<String>, _>("redirect_uri")
            .ok()
            .flatten();
        let hosts_json: String = row
            .try_get::<String, _>("allowed_redirect_hosts_json")
            .or_else(|_| row.try_get::<String, _>(1))
            .unwrap_or_default();
        if let Some(redirect_uri) = redirect_uri
            .map(|value| value.trim().to_string())
            .filter(|value| !value.is_empty())
        {
            redirect_uris.insert(redirect_uri);
        }
        if let Ok(hosts) = serde_json::from_str::<Vec<String>>(&hosts_json) {
            for host in hosts {
                let normalized = host.trim().to_ascii_lowercase();
                if !normalized.is_empty() {
                    allowed_hosts.insert(normalized);
                }
            }
        }
    }

    Ok((
        redirect_uris.into_iter().collect(),
        allowed_hosts.into_iter().collect(),
    ))
}

pub async fn validate_oauth_redirect_uri_for_provider(
    pg: Option<&PgPool>,
    tenant_id: Option<&str>,
    provider_code: &str,
    redirect_uri: &str,
) -> Result<(), String> {
    let mut registered_redirect_uris = Vec::new();
    let mut allowed_hosts = Vec::new();
    if let (Some(pg), Some(tenant_id)) = (pg, tenant_id.filter(|value| !value.is_empty())) {
        let (uris, hosts) = load_oauth_redirect_policy(pg, tenant_id, provider_code).await?;
        registered_redirect_uris = uris;
        allowed_hosts = hosts;
    }

    validate_oauth_redirect_uri(redirect_uri, &registered_redirect_uris, &allowed_hosts)
}

fn read_env_allowlist() -> Option<Vec<String>> {
    let raw = std::env::var(REDIRECT_URI_ALLOWLIST_ENV).ok()?;
    let entries = raw
        .split([',', ';', '\n'])
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .map(str::to_string)
        .collect::<Vec<_>>();
    if entries.is_empty() {
        None
    } else {
        Some(entries)
    }
}

fn redirect_uris_match(expected: &str, actual: &str) -> bool {
    expected.trim() == actual.trim()
}

fn hosts_match(allowed: &str, host: &str) -> bool {
    let allowed = allowed.trim().to_ascii_lowercase();
    let host = host.trim().to_ascii_lowercase();
    host == allowed || host.ends_with(&format!(".{allowed}"))
}

fn parse_redirect_uri_host(redirect_uri: &str) -> Result<String, String> {
    let redirect_uri = redirect_uri.trim();
    let (scheme, rest) = redirect_uri
        .split_once("://")
        .ok_or_else(|| "OAuth redirectUri must be an absolute http or https URL".to_string())?;
    if scheme != "http" && scheme != "https" {
        return Err("OAuth redirectUri must use http or https".to_string());
    }
    if rest.starts_with("//") {
        return Err("OAuth redirectUri must not use protocol-relative URLs".to_string());
    }
    let authority = rest.split(&['/', '?', '#'][..]).next().unwrap_or_default();
    if authority.is_empty() {
        return Err("OAuth redirectUri must include a host".to_string());
    }
    let host = authority
        .rsplit('@')
        .next()
        .unwrap_or(authority)
        .split(':')
        .next()
        .unwrap_or(authority)
        .trim()
        .to_ascii_lowercase();
    if host.is_empty() || host.contains('\\') {
        return Err("OAuth redirectUri host is invalid".to_string());
    }
    Ok(host)
}
