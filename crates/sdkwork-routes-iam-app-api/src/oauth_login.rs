use serde_json::{json, Value};
use sha2::{Digest, Sha256};
use sqlx::{PgPool, Row};

use crate::{
    contacts::load_user_by_id,
    state::{LocalIamConfig, LocalIamUser},
    utils::{canonical_identity, current_timestamp_utc, new_iam_user_id, LOCAL_EPHEMERAL_SCOPE},
};
use sdkwork_iam_web_adapter::{
    builtin_oauth_provider_catalog, catalog_entry_for_provider, exchange_oauth_authorization_code,
    exchange_wechat_mini_program_code, load_oauth_integration_exchange_context_for_app,
    normalize_oauth_provider_code, oauth_login_allowed, oauth_provider_allowed,
    provider_catalog_entry_to_json, AccountBindingPolicyDocument, LocalOAuthAuthority,
    LocalOAuthProviderProfile,
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
    runtime_app_id: Option<&str>,
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
                 WHERE enabled = 1 AND status = 'active' \
                   AND ($1::text IS NULL OR app_id = $1 OR app_id = '0') \
                 LIMIT 200",
            )
            .bind(runtime_app_id)
            .fetch_all(pg)
            .await
        } else {
            sqlx::query(
                "SELECT DISTINCT provider_code \
                 FROM iam_oauth_integration \
                 WHERE tenant_id = $1 AND enabled = 1 AND status = 'active' \
                   AND ($2::text IS NULL OR app_id = $2 OR app_id = '0') \
                 LIMIT 200",
            )
            .bind(tenant_id)
            .bind(runtime_app_id)
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
    tenant_id: &str,
    runtime_app_id: &str,
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
        if let Some(tenant_id) = find_active_integration_tenant_for_tenant(
            pg,
            tenant_id,
            &normalized,
            Some(runtime_app_id),
        )
        .await?
        {
            if let Some(url) = build_integration_authorization_url(
                pg,
                &tenant_id,
                &normalized,
                Some(runtime_app_id),
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
    tenant_id: &str,
    runtime_app_id: &str,
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
    } else if let Some(integration_tenant_id) =
        find_active_integration_tenant_for_tenant(pg, tenant_id, &normalized, Some(runtime_app_id))
            .await?
    {
        let Some(ctx) = load_oauth_integration_exchange_context_for_app(
            pg,
            &integration_tenant_id,
            &normalized,
            Some(runtime_app_id),
            None,
        )
        .await?
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

    resolve_or_create_oauth_user(pg, policy, tenant_id, &profile, &integration_id).await
}

pub(crate) async fn resolve_wechat_mini_program_login_user(
    pg: &PgPool,
    policy: &AccountBindingPolicyDocument,
    tenant_id: &str,
    runtime_app_id: &str,
    surface_code: Option<&str>,
    code: &str,
) -> Result<LocalIamUser, String> {
    const PROVIDER: &str = "wechat_mini_program";
    if !oauth_login_allowed(policy, Some(PROVIDER)) {
        return Err("WeChat mini program login is disabled for this tenant".to_string());
    }
    let (profile, integration_id) =
        exchange_wechat_mini_program_code(pg, tenant_id, runtime_app_id, surface_code, code)
            .await?;
    resolve_or_create_oauth_user(pg, policy, tenant_id, &profile, &integration_id).await
}

async fn resolve_or_create_oauth_user(
    pg: &PgPool,
    policy: &AccountBindingPolicyDocument,
    tenant_id: &str,
    profile: &LocalOAuthProviderProfile,
    integration_id: &str,
) -> Result<LocalIamUser, String> {
    if let Some(user_id) =
        find_user_id_by_oauth_subject(pg, tenant_id, integration_id, profile).await?
    {
        if let Some(user) = load_user_by_id(pg, tenant_id, &user_id).await? {
            upsert_oauth_account_link(pg, &user, profile, integration_id).await?;
            return Ok(user);
        }
    }

    if !policy.oauth_login.auto_registration_enabled {
        return Err("OAuth auto registration is disabled for this tenant".to_string());
    }

    let user = create_oauth_user(pg, tenant_id, integration_id, profile).await?;
    link_oauth_identity(pg, &user, profile).await?;
    upsert_oauth_account_link(pg, &user, profile, integration_id).await?;
    Ok(user)
}

async fn build_integration_authorization_url(
    pg: &PgPool,
    tenant_id: &str,
    provider_code: &str,
    runtime_app_id: Option<&str>,
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
           AND ($3::text IS NULL OR i.app_id = $3 OR i.app_id = '0') \
         ORDER BY CASE WHEN i.app_id = $3 THEN 0 ELSE 1 END, c.id LIMIT 1",
    )
    .bind(tenant_id)
    .bind(provider_code)
    .bind(runtime_app_id)
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
    let client_id_parameter = if matches!(provider_code, "wechat" | "wechat_open") {
        "appid"
    } else {
        "client_id"
    };
    let mut params = vec![
        ("response_type".to_string(), "code".to_string()),
        (client_id_parameter.to_string(), client_id),
        ("redirect_uri".to_string(), redirect_uri.to_string()),
    ];
    if let Some(state) = state.map(str::trim).filter(|value| !value.is_empty()) {
        params.push(("state".to_string(), state.to_string()));
    }
    if !scope.is_empty() {
        params.push(("scope".to_string(), scope));
    }

    let mut authorization_url = append_query_parameters(&authorization_endpoint, &params);
    if provider_code == "wechat" {
        authorization_url.push_str("#wechat_redirect");
    }
    Ok(Some(authorization_url))
}

pub(crate) async fn find_active_integration_tenant_for_tenant(
    pg: &PgPool,
    tenant_id: &str,
    provider_code: &str,
    runtime_app_id: Option<&str>,
) -> Result<Option<String>, String> {
    sqlx::query_scalar::<_, String>(
        "SELECT tenant_id FROM iam_oauth_integration \
         WHERE tenant_id = $1 AND provider_code = $2 AND enabled = 1 AND status = 'active' \
           AND ($3::text IS NULL OR app_id = $3 OR app_id = '0') \
         ORDER BY CASE WHEN app_id = $3 THEN 0 ELSE 1 END, tenant_id LIMIT 1",
    )
    .bind(tenant_id)
    .bind(provider_code)
    .bind(runtime_app_id)
    .fetch_optional(pg)
    .await
    .map_err(|error| format!("lookup tenant oauth integration failed: {error}"))
}

async fn find_user_id_by_oauth_subject(
    pg: &PgPool,
    tenant_id: &str,
    integration_id: &str,
    profile: &LocalOAuthProviderProfile,
) -> Result<Option<String>, String> {
    let subject_hash = hash_subject(&profile.subject);
    let row = sqlx::query(
        "SELECT user_id FROM iam_oauth_account_link \
         WHERE tenant_id = $1 AND integration_id = $2 AND provider_code = $3 \
           AND external_subject_hash = $4 \
           AND status = 'active' AND unlinked_at IS NULL \
         LIMIT 1",
    )
    .bind(tenant_id)
    .bind(integration_id)
    .bind(&profile.provider)
    .bind(subject_hash)
    .fetch_optional(pg)
    .await
    .map_err(|error| format!("lookup oauth account link failed: {error}"))?;
    if let Some(row) = row {
        return Ok(Some(row.get(0)));
    }

    if let (Some(union_id), Some(union_scope_id)) = (
        profile.union_id.as_deref(),
        profile.union_scope_id.as_deref(),
    ) {
        let row = sqlx::query(
            "SELECT user_id FROM iam_oauth_account_link \
             WHERE tenant_id = $1 AND provider_union_scope_id = $2 \
               AND external_union_id_hash = $3 \
               AND status = 'active' AND unlinked_at IS NULL \
             LIMIT 1",
        )
        .bind(tenant_id)
        .bind(union_scope_id)
        .bind(hash_subject(union_id))
        .fetch_optional(pg)
        .await
        .map_err(|error| format!("lookup oauth union identity failed: {error}"))?;
        if let Some(row) = row {
            return Ok(Some(row.get(0)));
        }
    }

    Ok(None)
}

async fn create_oauth_user(
    pg: &PgPool,
    tenant_id: &str,
    integration_id: &str,
    profile: &LocalOAuthProviderProfile,
) -> Result<LocalIamUser, String> {
    let user_id = new_iam_user_id();
    let username = format!(
        "{}:{}:{}",
        profile.provider, integration_id, profile.subject
    );
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
        "{}:{}:{}:{}",
        user.tenant_id, integration_id, profile.provider, profile.subject
    );
    let subject_hash = hash_subject(&profile.subject);
    let open_id_hash = profile.open_id.as_deref().map(hash_subject);
    let union_id_hash = profile.union_id.as_deref().map(hash_subject);
    sqlx::query(
        "INSERT INTO iam_oauth_account_link (\
            id, uuid, tenant_id, organization_id, user_id, provider_code, integration_id, \
            external_subject, external_subject_hash, external_open_id, external_open_id_hash, \
            external_union_id, external_union_id_hash, provider_union_scope_id, \
            external_account_display_snapshot, link_source, linked_at, status, claim_snapshot_json, \
            created_at, updated_at\
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, \
                   'oauth_login', $16, 'active', $17, $16, $16) \
         ON CONFLICT (id) DO UPDATE SET \
           user_id = EXCLUDED.user_id, \
           integration_id = EXCLUDED.integration_id, \
           external_open_id = EXCLUDED.external_open_id, \
           external_open_id_hash = EXCLUDED.external_open_id_hash, \
           external_union_id = COALESCE(EXCLUDED.external_union_id, iam_oauth_account_link.external_union_id), \
           external_union_id_hash = COALESCE(EXCLUDED.external_union_id_hash, iam_oauth_account_link.external_union_id_hash), \
           provider_union_scope_id = COALESCE(EXCLUDED.provider_union_scope_id, iam_oauth_account_link.provider_union_scope_id), \
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
    .bind(&profile.open_id)
    .bind(open_id_hash)
    .bind(&profile.union_id)
    .bind(union_id_hash)
    .bind(&profile.union_scope_id)
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
