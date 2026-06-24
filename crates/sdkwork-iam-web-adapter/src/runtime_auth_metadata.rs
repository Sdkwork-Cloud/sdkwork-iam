use serde_json::{json, Value};
use sqlx::PgPool;

use crate::account_binding_policy::{
    account_binding_policy_to_json, default_account_binding_policy, AccountBindingPolicyDocument,
};
use crate::oauth_authorization_server::parse_relying_party_config;
use crate::oauth_provider_catalog::normalize_oauth_provider_code;

#[derive(Clone, Debug, Default, PartialEq, Eq)]
pub struct RuntimeAuthMetadataInput {
    pub environment: String,
    pub deployment_mode: String,
    pub supports_local_credentials: bool,
    pub supports_session_exchange: bool,
    pub sdkwork_oauth_provider_enabled: bool,
}

#[derive(Clone, Debug, Default, PartialEq, Eq)]
pub struct ParsedRuntimeAuthPolicy {
    pub supports_local_credentials: Option<bool>,
    pub supports_session_exchange: Option<bool>,
    pub sdkwork_oauth_provider_enabled: Option<bool>,
}

pub fn parse_runtime_auth_policy(runtime_config: &Value) -> ParsedRuntimeAuthPolicy {
    let auth = runtime_config
        .get("auth")
        .or_else(|| runtime_config.pointer("/runtimeConfig/auth"));

    let relying_party = parse_relying_party_config(runtime_config);
    let has_relying_party_config = runtime_config.pointer("/oauth/relyingParty").is_some();

    ParsedRuntimeAuthPolicy {
        supports_local_credentials: read_bool_field(auth, &["supportsLocalCredentials"]),
        supports_session_exchange: read_bool_field(auth, &["supportsSessionExchange"]),
        sdkwork_oauth_provider_enabled: read_bool_field(auth, &["sdkworkOAuthProviderEnabled"])
            .or_else(|| has_relying_party_config.then_some(relying_party.enabled)),
    }
}

pub fn merge_runtime_auth_metadata_input(
    defaults: &RuntimeAuthMetadataInput,
    policy: &ParsedRuntimeAuthPolicy,
) -> RuntimeAuthMetadataInput {
    RuntimeAuthMetadataInput {
        environment: defaults.environment.clone(),
        deployment_mode: defaults.deployment_mode.clone(),
        supports_local_credentials: policy
            .supports_local_credentials
            .unwrap_or(defaults.supports_local_credentials),
        supports_session_exchange: policy
            .supports_session_exchange
            .unwrap_or(defaults.supports_session_exchange),
        sdkwork_oauth_provider_enabled: policy
            .sdkwork_oauth_provider_enabled
            .unwrap_or(defaults.sdkwork_oauth_provider_enabled),
    }
}

pub async fn load_runtime_auth_metadata_input(
    pg: &PgPool,
    tenant_id: &str,
    app_id: &str,
    defaults: &RuntimeAuthMetadataInput,
) -> Result<RuntimeAuthMetadataInput, String> {
    let runtime_config = load_tenant_application_runtime_config(pg, tenant_id, app_id).await?;
    Ok(merge_runtime_auth_metadata_input(
        defaults,
        &parse_runtime_auth_policy(&runtime_config),
    ))
}

pub async fn load_tenant_application_runtime_config(
    pg: &PgPool,
    tenant_id: &str,
    app_id: &str,
) -> Result<Value, String> {
    let row = sqlx::query_scalar::<_, sqlx::types::Json<Value>>(
        "SELECT runtime_config_json FROM iam_tenant_application \
         WHERE tenant_id = $1 AND app_id = $2 AND status = 'enabled' \
         LIMIT 1",
    )
    .bind(tenant_id)
    .bind(app_id)
    .fetch_optional(pg)
    .await
    .map_err(|error| format!("load tenant application runtime config failed: {error}"))?;

    Ok(row.map(|sqlx::types::Json(value)| value).unwrap_or_else(|| json!({})))
}

fn read_bool_field(value: Option<&Value>, keys: &[&str]) -> Option<bool> {
    value.and_then(|node| {
        keys.iter()
            .find_map(|key| node.get(*key))
            .and_then(Value::as_bool)
    })
}

pub fn build_runtime_auth_metadata_json(
    policy: &AccountBindingPolicyDocument,
    oauth_providers: &[Value],
    input: &RuntimeAuthMetadataInput,
) -> Value {
    let mut login_methods = Vec::new();
    if input.supports_local_credentials {
        login_methods.push("password");
    }
    if input.supports_session_exchange {
        login_methods.push("sessionBridge");
    }

    let oauth_login_enabled = policy.oauth_login.enabled;
    let oauth_provider_region = infer_oauth_provider_region(oauth_providers);
    let oauth_provider_codes = oauth_providers
        .iter()
        .filter_map(|item| {
            item.get("providerCode")
                .and_then(Value::as_str)
                .and_then(normalize_oauth_provider_code)
        })
        .collect::<Vec<_>>();

    json!({
        "auth": {
            "supportsLocalCredentials": input.supports_local_credentials,
            "supportsSessionExchange": input.supports_session_exchange,
            "oauthLoginEnabled": oauth_login_enabled,
            "oauthProviderRegion": oauth_provider_region,
            "oauthProviders": oauth_provider_codes,
            "loginMethods": login_methods,
            "sdkworkOAuthProviderEnabled": input.sdkwork_oauth_provider_enabled,
        },
        "accountBinding": account_binding_policy_to_json(policy),
        "deploymentMode": input.deployment_mode,
        "environment": input.environment,
        "mode": "private",
        "runtime": "embedded",
    })
}

pub fn default_runtime_auth_metadata_json(input: &RuntimeAuthMetadataInput) -> Value {
    build_runtime_auth_metadata_json(
        &default_account_binding_policy(),
        &[],
        input,
    )
}

fn infer_oauth_provider_region(oauth_providers: &[Value]) -> &'static str {
    let mut has_mainland = false;
    let mut has_overseas = false;

    for provider in oauth_providers {
        match provider
            .get("regionGroup")
            .and_then(Value::as_str)
            .unwrap_or_default()
        {
            "mainland" => has_mainland = true,
            "overseas" => has_overseas = true,
            "global" => return "global",
            _ => {}
        }
    }

    if has_mainland && has_overseas {
        "global"
    } else if has_mainland {
        "mainland"
    } else if has_overseas {
        "overseas"
    } else {
        "global"
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::account_binding_policy::{AccountBindingPolicyDocument, OauthLoginPolicy};

    #[test]
    fn runtime_metadata_exposes_oauth_and_login_methods() {
        let policy = AccountBindingPolicyDocument {
            oauth_login: OauthLoginPolicy {
                enabled: true,
                allowed_providers: vec!["github".to_owned()],
                auto_registration_enabled: true,
            },
            ..Default::default()
        };
        let metadata = build_runtime_auth_metadata_json(
            &policy,
            &[json!({"providerCode":"github","regionGroup":"overseas"})],
            &RuntimeAuthMetadataInput {
                environment: "development".to_owned(),
                deployment_mode: "saas".to_owned(),
                supports_local_credentials: true,
                supports_session_exchange: true,
                sdkwork_oauth_provider_enabled: true,
            },
        );

        assert_eq!(
            metadata
                .pointer("/auth/loginMethods")
                .and_then(Value::as_array)
                .map(|items| items.len()),
            Some(2)
        );
        assert_eq!(
            metadata.pointer("/auth/oauthLoginEnabled"),
            Some(&json!(true))
        );
        assert_eq!(
            metadata.pointer("/auth/oauthProviderRegion"),
            Some(&json!("overseas"))
        );
    }

    #[test]
    fn parse_runtime_auth_policy_reads_auth_and_relying_party() {
        let runtime_config = json!({
            "auth": {
                "supportsLocalCredentials": false,
                "supportsSessionExchange": true
            },
            "oauth": {
                "relyingParty": {
                    "enabled": true,
                    "redirectUris": ["https://forum.example.com/auth/oauth/callback"]
                }
            }
        });
        let policy = parse_runtime_auth_policy(&runtime_config);
        assert_eq!(policy.supports_local_credentials, Some(false));
        assert_eq!(policy.supports_session_exchange, Some(true));
        assert_eq!(policy.sdkwork_oauth_provider_enabled, Some(true));

        let merged = merge_runtime_auth_metadata_input(
            &RuntimeAuthMetadataInput {
                environment: "production".to_owned(),
                deployment_mode: "saas".to_owned(),
                supports_local_credentials: true,
                supports_session_exchange: false,
                sdkwork_oauth_provider_enabled: false,
            },
            &policy,
        );
        assert!(!merged.supports_local_credentials);
        assert!(merged.supports_session_exchange);
        assert!(merged.sdkwork_oauth_provider_enabled);
    }
}
