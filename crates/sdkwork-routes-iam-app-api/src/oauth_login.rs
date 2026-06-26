use serde_json::{json, Value};
use sha2::{Digest, Sha256};
use sqlx::{PgPool, Row};

use crate::{
    contacts::load_user_by_id,
    directory::resolve_open_registration_tenant_id,
    state::{LocalIamConfig, LocalIamUser},
    utils::{canonical_identity, current_timestamp_utc, new_iam_user_id, LOCAL_EPHEMERAL_SCOPE},
};
use sdkwork_iam_web_adapter::{
    builtin_oauth_provider_catalog, catalog_entry_for_provider, exchange_oauth_authorization_code,
    load_oauth_integration_exchange_context, normalize_oauth_provider_code, oauth_login_allowed,
    oauth_provider_allowed, provider_catalog_entry_to_json, AccountBindingPolicyDocument,
    LocalOAuthAuthority, LocalOAuthProviderProfile,
};

#[derive(Clone)]
pub(crate) struct OAuthLoginContext {
    pub local_authority: LocalOAuthAuthority,
}

impl OAuthLoginContext {
    pub fn new() -> Self {
        Self {
            local_authority: LocalOAuthAuthority::from_env(""),
        }
    }
}

pub(crate) async fn list_login_enabled_providers(
    pg: Option<&PgPool>,
    tenant_id: &str,
    policy: &AccountBindingPolicyDocument,
    login_ctx: &OAuthLoginContext,
) -> Result<Vec<Value>, String> {
    if !policy.oauth_login.enabled {
        return Ok(Vec::new());
    }

    let mut enabled_codes = std::collections::BTreeSet::new();
    for provider in login_ctx.local_authority.enabled_provider_codes() {
        enabled_codes.insert(provider);
    }

    if let Some(pg) = pg {
        let rows = if tenant_id.is_empty() || tenant_id == LOCAL_EPHEMERAL_SCOPE {
            sqlx::query(
                "SELECT DISTINCT provider_code \
                 FROM iam_oauth_integration \
                 WHERE enabled = 1 AND status = 'active'",
            )
            .fetch_all(pg)
            .await
        } else {
            sqlx::query(
                "SELECT DISTINCT provider_code \
                 FROM iam_oauth_integration \
                 WHERE tenant_id = $1 AND enabled = 1 AND status = 'active'",
            )
            .bind(tenant_id)
            .fetch_all(pg)
            .await
        }
        .map_err(|error| format!("load oauth integrations failed: {error}"))?;
        for row in rows {
            if let Ok(provider_code) = row.try_get::<String, _>(0) {
                if let Some(normalized) = normalize_oauth_provider_code(&provider_code) {
                    enabled_codes.insert(normalized);
                }
            }
        }
    }

    let mut items = builtin_oauth_provider_catalog()
        .into_iter()
        .filter(|entry| entry.supports_login)
        .filter(|entry| enabled_codes.contains(&entry.provider_code))
        .filter(|entry| {
            oauth_provider_allowed(&policy.oauth_login.allowed_providers, &entry.provider_code)
        })
        .map(|entry| provider_catalog_entry_to_json(&entry, true))
        .collect::<Vec<_>>();

    for provider_code in enabled_codes {
        if items
            .iter()
            .any(|item| item.get("providerCode") == Some(&json!(provider_code)))
        {
            continue;
        }
        if let Some(entry) = catalog_entry_for_provider(&provider_code) {
            if oauth_provider_allowed(&policy.oauth_login.allowed_providers, &entry.provider_code) {
                items.push(provider_catalog_entry_to_json(&entry, true));
            }
        }
    }

    items.sort_by_key(|item| {
        item.get("sortOrder")
            .and_then(|v| v.as_i64())
            .unwrap_or(999)
    });
    Ok(items)
}

pub(crate) async fn create_oauth_authorization_url(
    pg: Option<&PgPool>,
    _config: &LocalIamConfig,
    policy: &AccountBindingPolicyDocument,
    login_ctx: &OAuthLoginContext,
    provider: &str,
    redirect_uri: &str,
    state: Option<&str>,
) -> Result<String, String> {
    let normalized = normalize_oauth_provider_code(provider)
        .ok_or_else(|| "OAuth provider is invalid".to_string())?;
    if !oauth_login_allowed(policy, Some(normalized.as_str())) {
        return Err("OAuth login is disabled for this provider".to_string());
    }

    if login_ctx
        .local_authority
        .provider_profile(&normalized)
        .is_some()
    {
        return login_ctx
            .local_authority
            .build_authorization_url(&normalized, redirect_uri, state);
    }

    if let Some(pg) = pg {
        if let Some(tenant_id) = find_active_integration_tenant(pg, &normalized).await? {
            if let Some(url) = build_integration_authorization_url(
                pg,
                &tenant_id,
                &normalized,
                redirect_uri,
                state,
            )
            .await?
            {
                return Ok(url);
            }
        }
    }

    Err(format!("OAuth provider {normalized} is not configured"))
}

pub(crate) async fn resolve_oauth_login_user(
    pg: &PgPool,
    _config: &LocalIamConfig,
    policy: &AccountBindingPolicyDocument,
    login_ctx: &OAuthLoginContext,
    provider: &str,
    code: &str,
    redirect_uri: Option<&str>,
) -> Result<LocalIamUser, String> {
    let normalized = normalize_oauth_provider_code(provider)
        .ok_or_else(|| "OAuth provider is invalid".to_string())?;
    if !oauth_login_allowed(policy, Some(normalized.as_str())) {
        return Err("OAuth login is disabled for this provider".to_string());
    }

    let (profile, integration_id) = if let Ok(profile) = login_ctx
        .local_authority
        .resolve_authorization_code(&normalized, code)
    {
        (profile, format!("local:{}", normalized))
    } else if let Some(tenant_id) = find_active_integration_tenant(pg, &normalized).await? {
        let Some(ctx) =
            load_oauth_integration_exchange_context(pg, &tenant_id, &normalized).await?
        else {
            return Err(
                "OAuth code exchange requires a configured local OAuth profile or provider integration"
                    .to_string(),
            );
        };
        let redirect_uri = redirect_uri
            .map(str::trim)
            .filter(|value| !value.is_empty())
            .ok_or_else(|| {
                "OAuth redirectUri is required for configured provider integrations".to_string()
            })?;
        let profile = exchange_oauth_authorization_code(&ctx, code, redirect_uri).await?;
        (profile, ctx.integration_id.clone())
    } else {
        return Err(
            "OAuth code exchange requires a configured local OAuth profile or provider integration"
                .to_string(),
        );
    };

    resolve_or_create_oauth_user(pg, policy, &profile, &integration_id).await
}

async fn resolve_or_create_oauth_user(
    pg: &PgPool,
    policy: &AccountBindingPolicyDocument,
    profile: &LocalOAuthProviderProfile,
    integration_id: &str,
) -> Result<LocalIamUser, String> {
    if let Some((user_id, tenant_id)) =
        find_user_id_by_oauth_subject_global(pg, &profile.provider, &profile.subject).await?
    {
        if let Some(user) = load_user_by_id(pg, &tenant_id, &user_id).await? {
            upsert_oauth_account_link(pg, &user, profile, integration_id).await?;
            return Ok(user);
        }
    }

    if let Some(email) = profile.email.as_deref().filter(|value| !value.is_empty()) {
        if let Some(user) = find_user_by_email_global(pg, email).await? {
            link_oauth_identity(pg, &user, profile).await?;
            upsert_oauth_account_link(pg, &user, profile, integration_id).await?;
            return Ok(user);
        }
    }

    if !policy.oauth_login.auto_registration_enabled {
        return Err("OAuth auto registration is disabled for this tenant".to_string());
    }

    let tenant_id = resolve_open_registration_tenant_id(pg).await?;
    let user = create_oauth_user(pg, &tenant_id, profile).await?;
    link_oauth_identity(pg, &user, profile).await?;
    upsert_oauth_account_link(pg, &user, profile, integration_id).await?;
    Ok(user)
}

pub(crate) async fn find_active_integration_tenant(
    pg: &PgPool,
    provider_code: &str,
) -> Result<Option<String>, String> {
    sqlx::query_scalar::<_, String>(
        "SELECT tenant_id FROM iam_oauth_integration \
         WHERE provider_code = $1 AND enabled = 1 AND status = 'active' \
         ORDER BY tenant_id LIMIT 1",
    )
    .bind(provider_code)
    .fetch_optional(pg)
    .await
    .map_err(|error| format!("lookup oauth integration tenant failed: {error}"))
}

async fn build_integration_authorization_url(
    pg: &PgPool,
    tenant_id: &str,
    provider_code: &str,
    redirect_uri: &str,
    state: Option<&str>,
) -> Result<Option<String>, String> {
    let row = sqlx::query(
        "SELECT c.provider_client_id, \
                COALESCE(c.authorization_endpoint_override, cat.authorization_endpoint) AS authorization_endpoint, \
                cat.default_scopes_json \
         FROM iam_oauth_integration i \
         JOIN iam_oauth_client c ON c.integration_id = i.id AND c.enabled = 1 AND c.status = 'active' \
         LEFT JOIN iam_oauth_provider_catalog cat ON cat.provider_code = i.provider_code AND cat.status = 'active' \
         WHERE i.tenant_id = $1 AND i.provider_code = $2 AND i.enabled = 1 AND i.status = 'active' \
         LIMIT 1",
    )
    .bind(tenant_id)
    .bind(provider_code)
    .fetch_optional(pg)
    .await
    .map_err(|error| format!("load oauth integration failed: {error}"))?;

    let Some(row) = row else {
        return Ok(None);
    };

    let client_id: String = row.get(0);
    let authorization_endpoint: Option<String> = row.get(1);
    let default_scopes_json: String = row.get(2);
    let authorization_endpoint = authorization_endpoint
        .map(|value| value.trim().to_string())
        .filter(|value| !value.is_empty())
        .or_else(|| {
            sdkwork_iam_web_adapter::builtin_authorization_endpoint(provider_code)
                .map(str::to_string)
        })
        .ok_or_else(|| {
            format!("OAuth provider {provider_code} is missing authorization endpoint")
        })?;

    let scope = serde_json::from_str::<Vec<String>>(&default_scopes_json)
        .unwrap_or_else(|_| sdkwork_iam_web_adapter::builtin_default_scopes(provider_code))
        .join(" ");
    let mut params = vec![
        ("response_type".to_string(), "code".to_string()),
        ("client_id".to_string(), client_id),
        ("redirect_uri".to_string(), redirect_uri.to_string()),
    ];
    if let Some(state) = state.map(str::trim).filter(|value| !value.is_empty()) {
        params.push(("state".to_string(), state.to_string()));
    }
    if !scope.is_empty() {
        params.push(("scope".to_string(), scope));
    }

    Ok(Some(append_query_parameters(
        &authorization_endpoint,
        &params,
    )))
}

async fn find_user_id_by_oauth_subject_global(
    pg: &PgPool,
    provider: &str,
    subject: &str,
) -> Result<Option<(String, String)>, String> {
    let subject_hash = hash_subject(subject);
    let row = sqlx::query(
        "SELECT user_id, tenant_id FROM iam_oauth_account_link \
         WHERE provider_code = $1 AND external_subject_hash = $2 \
           AND status = 'active' AND unlinked_at IS NULL \
         LIMIT 1",
    )
    .bind(provider)
    .bind(subject_hash)
    .fetch_optional(pg)
    .await
    .map_err(|error| format!("lookup oauth account link failed: {error}"))?;
    if let Some(row) = row {
        return Ok(Some((row.get(0), row.get(1))));
    }

    let row = sqlx::query(
        "SELECT user_id, tenant_id FROM iam_user_identity \
         WHERE provider = $1 AND subject = $2 \
         LIMIT 1",
    )
    .bind(provider)
    .bind(subject)
    .fetch_optional(pg)
    .await
    .map_err(|error| format!("lookup oauth user identity failed: {error}"))?;
    Ok(row.map(|row| (row.get(0), row.get(1))))
}

async fn find_user_by_email_global(
    pg: &PgPool,
    email: &str,
) -> Result<Option<LocalIamUser>, String> {
    let row = sqlx::query(
        "SELECT id, tenant_id, username, display_name, email, phone, email_verified, phone_verified, \
                last_login_at, password_changed_at \
         FROM iam_user \
         WHERE lower(email) = lower($1) AND status = 'active' AND is_deleted = 0 \
         LIMIT 1",
    )
    .bind(email)
    .fetch_optional(pg)
    .await
    .map_err(|error| format!("lookup user by email failed: {error}"))?;

    Ok(row.map(map_user_row))
}

async fn create_oauth_user(
    pg: &PgPool,
    tenant_id: &str,
    profile: &LocalOAuthProviderProfile,
) -> Result<LocalIamUser, String> {
    let user_id = new_iam_user_id();
    let username = format!("{}:{}", profile.provider, profile.subject);
    let display_name = profile
        .name
        .clone()
        .or_else(|| profile.email.clone())
        .unwrap_or_else(|| username.clone());
    let now = current_timestamp_utc();
    let email_verified = profile.email.is_some() as i32;
    let phone_verified = profile.phone.is_some() as i32;

    sqlx::query(
        "INSERT INTO iam_user (id, tenant_id, username, display_name, email, phone, \
                email_verified, phone_verified, status, created_at, updated_at) \
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'active', $9, $10)",
    )
    .bind(&user_id)
    .bind(tenant_id)
    .bind(&username)
    .bind(&display_name)
    .bind(&profile.email)
    .bind(&profile.phone)
    .bind(email_verified)
    .bind(phone_verified)
    .bind(&now)
    .bind(&now)
    .execute(pg)
    .await
    .map_err(|error| format!("create oauth user failed: {error}"))?;

    Ok(LocalIamUser {
        id: user_id,
        tenant_id: tenant_id.to_string(),
        username,
        display_name,
        email: profile.email.clone(),
        phone: profile.phone.clone(),
        email_verified: email_verified != 0,
        phone_verified: phone_verified != 0,
        last_login_at: None,
        password_changed_at: None,
    })
}

async fn link_oauth_identity(
    pg: &PgPool,
    user: &LocalIamUser,
    profile: &LocalOAuthProviderProfile,
) -> Result<(), String> {
    let now = current_timestamp_utc();
    sqlx::query(
        "INSERT INTO iam_user_identity (id, tenant_id, user_id, provider, subject, email, created_at) \
         VALUES ($1, $2, $3, $4, $5, $6, $7) \
         ON CONFLICT (tenant_id, provider, subject) DO UPDATE SET \
           user_id = EXCLUDED.user_id, \
           email = COALESCE(EXCLUDED.email, iam_user_identity.email)",
    )
    .bind(uuid::Uuid::now_v7().to_string())
    .bind(&user.tenant_id)
    .bind(&user.id)
    .bind(&profile.provider)
    .bind(&profile.subject)
    .bind(&profile.email)
    .bind(&now)
    .execute(pg)
    .await
    .map_err(|error| format!("upsert oauth user identity failed: {error}"))?;
    Ok(())
}

async fn upsert_oauth_account_link(
    pg: &PgPool,
    user: &LocalIamUser,
    profile: &LocalOAuthProviderProfile,
    integration_id: &str,
) -> Result<(), String> {
    let now = current_timestamp_utc();
    let organization_id = primary_organization_id(pg, &user.tenant_id)
        .await
        .unwrap_or_else(|| format!("org_{}", user.tenant_id));
    let link_id = format!(
        "{}:{}:{}",
        user.tenant_id, profile.provider, profile.subject
    );
    let subject_hash = hash_subject(&profile.subject);
    sqlx::query(
        "INSERT INTO iam_oauth_account_link (\
            id, uuid, tenant_id, organization_id, user_id, provider_code, integration_id, \
            external_subject, external_subject_hash, external_account_display_snapshot, \
            link_source, linked_at, status, claim_snapshot_json, created_at, updated_at\
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'oauth_login', $11, 'active', $12, $11, $11) \
         ON CONFLICT (id) DO UPDATE SET \
           user_id = EXCLUDED.user_id, \
           integration_id = EXCLUDED.integration_id, \
           external_account_display_snapshot = EXCLUDED.external_account_display_snapshot, \
           status = 'active', \
           unlinked_at = NULL, \
           updated_at = EXCLUDED.updated_at",
    )
    .bind(&link_id)
    .bind(uuid::Uuid::now_v7().to_string())
    .bind(&user.tenant_id)
    .bind(&organization_id)
    .bind(&user.id)
    .bind(&profile.provider)
    .bind(integration_id)
    .bind(&profile.subject)
    .bind(subject_hash)
    .bind(profile.name.clone().or_else(|| profile.email.clone()))
    .bind(&now)
    .bind(
        serde_json::to_string(profile)
            .unwrap_or_else(|_| "{}".to_string()),
    )
    .execute(pg)
    .await
    .map_err(|error| format!("upsert oauth account link failed: {error}"))?;
    Ok(())
}

async fn primary_organization_id(pg: &PgPool, tenant_id: &str) -> Option<String> {
    sqlx::query_scalar::<_, String>(
        "SELECT id FROM iam_organization \
         WHERE tenant_id = $1 AND status = 'active' \
         ORDER BY organization_kind, id LIMIT 1",
    )
    .bind(tenant_id)
    .fetch_optional(pg)
    .await
    .ok()
    .flatten()
}

fn map_user_row(row: sqlx::postgres::PgRow) -> LocalIamUser {
    LocalIamUser {
        id: row.get(0),
        tenant_id: row.get(1),
        username: row.get(2),
        display_name: row.get(3),
        email: row.get(4),
        phone: row.get(5),
        email_verified: row.get::<i32, _>(6) != 0,
        phone_verified: row.get::<i32, _>(7) != 0,
        last_login_at: row.get(8),
        password_changed_at: row.get(9),
    }
}

fn hash_subject(subject: &str) -> String {
    let digest = Sha256::digest(subject.as_bytes());
    format!("{:x}", digest)
}

fn append_query_parameters(url: &str, params: &[(String, String)]) -> String {
    if params.is_empty() {
        return url.to_string();
    }
    let separator = if url.contains('?') { '&' } else { '?' };
    let query = params
        .iter()
        .map(|(key, value)| format!("{}={}", percent_encode(key), percent_encode(value)))
        .collect::<Vec<_>>()
        .join("&");
    format!("{url}{separator}{query}")
}

fn percent_encode(value: &str) -> String {
    value
        .chars()
        .map(|ch| match ch {
            'A'..='Z' | 'a'..='z' | '0'..='9' | '-' | '_' | '.' | '~' => ch.to_string(),
            _ => format!("%{:02X}", ch as u8),
        })
        .collect()
}

#[allow(dead_code)]
fn canonical_oauth_account(provider: &str, subject: &str) -> String {
    canonical_identity(&format!("{provider}:{subject}"))
}
