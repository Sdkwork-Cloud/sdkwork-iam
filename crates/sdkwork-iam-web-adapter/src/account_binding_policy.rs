use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use sqlx::PgPool;

pub const IAM_ACCOUNT_BINDING_POLICY_CODE: &str = "iam.account_binding";

#[derive(Clone, Debug, Default, Deserialize, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct ContactBindingPolicy {
    #[serde(default)]
    pub enabled: bool,
    #[serde(default = "default_true")]
    pub email_enabled: bool,
    #[serde(default = "default_true")]
    pub phone_enabled: bool,
    #[serde(default = "default_true")]
    pub email_change_enabled: bool,
    #[serde(default = "default_true")]
    pub phone_change_enabled: bool,
    #[serde(default)]
    pub email_unbind_enabled: bool,
    #[serde(default)]
    pub phone_unbind_enabled: bool,
    #[serde(default = "default_true")]
    pub require_verification: bool,
}

#[derive(Clone, Debug, Default, Deserialize, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct OauthLoginPolicy {
    #[serde(default)]
    pub enabled: bool,
    #[serde(default)]
    pub allowed_providers: Vec<String>,
    #[serde(default = "default_true")]
    pub auto_registration_enabled: bool,
}

#[derive(Clone, Debug, Default, Deserialize, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct OauthBindingPolicy {
    #[serde(default)]
    pub enabled: bool,
    #[serde(default)]
    pub self_service_link_enabled: bool,
    #[serde(default)]
    pub self_service_unlink_enabled: bool,
    #[serde(default)]
    pub allowed_providers: Vec<String>,
}

#[derive(Clone, Debug, Default, Deserialize, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct AccountBindingPolicyDocument {
    #[serde(default)]
    pub contact_binding: ContactBindingPolicy,
    #[serde(default)]
    pub oauth_login: OauthLoginPolicy,
    #[serde(default)]
    pub oauth_binding: OauthBindingPolicy,
}

#[derive(Clone, Debug, Default)]
pub struct AccountBindingPolicyOverrides {
    pub contact_binding_enabled: Option<bool>,
    pub oauth_binding_enabled: Option<bool>,
    pub oauth_login_enabled: Option<bool>,
}

fn default_true() -> bool {
    true
}

pub fn default_account_binding_policy() -> AccountBindingPolicyDocument {
    AccountBindingPolicyDocument {
        contact_binding: ContactBindingPolicy {
            enabled: true,
            email_enabled: true,
            phone_enabled: true,
            email_change_enabled: true,
            phone_change_enabled: true,
            email_unbind_enabled: false,
            phone_unbind_enabled: false,
            require_verification: true,
        },
        oauth_login: OauthLoginPolicy {
            enabled: false,
            allowed_providers: Vec::new(),
            auto_registration_enabled: true,
        },
        oauth_binding: OauthBindingPolicy {
            enabled: false,
            self_service_link_enabled: false,
            self_service_unlink_enabled: false,
            allowed_providers: Vec::new(),
        },
    }
}

pub fn account_binding_policy_to_json(policy: &AccountBindingPolicyDocument) -> Value {
    serde_json::to_value(policy).unwrap_or_else(|_| json!({}))
}

pub fn parse_account_binding_policy(value: &Value) -> AccountBindingPolicyDocument {
    serde_json::from_value(value.clone()).unwrap_or_else(|_| default_account_binding_policy())
}

pub fn merge_account_binding_policy(
    stored: AccountBindingPolicyDocument,
    overrides: &AccountBindingPolicyOverrides,
) -> AccountBindingPolicyDocument {
    let mut policy = stored;
    if let Some(enabled) = overrides.contact_binding_enabled {
        policy.contact_binding.enabled = enabled;
    }
    if let Some(enabled) = overrides.oauth_binding_enabled {
        policy.oauth_binding.enabled = enabled;
    }
    if let Some(enabled) = overrides.oauth_login_enabled {
        policy.oauth_login.enabled = enabled;
    }
    policy
}

pub async fn load_account_binding_policy(
    pg: &PgPool,
    tenant_id: &str,
) -> Result<AccountBindingPolicyDocument, String> {
    let row = sqlx::query_scalar::<_, String>(
        "SELECT policy_json FROM iam_policy \
         WHERE tenant_id = $1 AND code = $2 AND status = 'active' \
         LIMIT 1",
    )
    .bind(tenant_id)
    .bind(IAM_ACCOUNT_BINDING_POLICY_CODE)
    .fetch_optional(pg)
    .await
    .map_err(|error| format!("load account binding policy failed: {error}"))?;

    Ok(row
        .map(|raw| parse_account_binding_policy(&serde_json::from_str(&raw).unwrap_or(json!({}))))
        .unwrap_or_else(default_account_binding_policy))
}

pub async fn save_account_binding_policy(
    pg: &PgPool,
    tenant_id: &str,
    policy: &AccountBindingPolicyDocument,
) -> Result<(), String> {
    let now = chrono::Utc::now().to_rfc3339();
    let policy_json = serde_json::to_string(policy)
        .map_err(|error| format!("serialize account binding policy failed: {error}"))?;
    let policy_id = format!("{tenant_id}:account_binding");

    sqlx::query(
        "INSERT INTO iam_policy (id, tenant_id, code, name, policy_json, status, created_at, updated_at) \
         VALUES ($1, $2, $3, $4, $5, 'active', $6, $7) \
         ON CONFLICT (tenant_id, code) DO UPDATE SET \
           policy_json = EXCLUDED.policy_json, \
           name = EXCLUDED.name, \
           status = 'active', \
           updated_at = EXCLUDED.updated_at",
    )
    .bind(&policy_id)
    .bind(tenant_id)
    .bind(IAM_ACCOUNT_BINDING_POLICY_CODE)
    .bind("Account binding policy")
    .bind(&policy_json)
    .bind(&now)
    .bind(&now)
    .execute(pg)
    .await
    .map_err(|error| format!("save account binding policy failed: {error}"))?;

    Ok(())
}

pub fn contact_binding_allowed(
    policy: &AccountBindingPolicyDocument,
    kind: ContactBindingActionKind,
) -> bool {
    if !policy.contact_binding.enabled {
        return false;
    }

    match kind {
        ContactBindingActionKind::BindEmail | ContactBindingActionKind::ChangeEmail => {
            policy.contact_binding.email_enabled
                && (kind != ContactBindingActionKind::ChangeEmail
                    || policy.contact_binding.email_change_enabled)
        }
        ContactBindingActionKind::UnbindEmail => {
            policy.contact_binding.email_enabled && policy.contact_binding.email_unbind_enabled
        }
        ContactBindingActionKind::BindPhone | ContactBindingActionKind::ChangePhone => {
            policy.contact_binding.phone_enabled
                && (kind != ContactBindingActionKind::ChangePhone
                    || policy.contact_binding.phone_change_enabled)
        }
        ContactBindingActionKind::UnbindPhone => {
            policy.contact_binding.phone_enabled && policy.contact_binding.phone_unbind_enabled
        }
    }
}

pub fn oauth_binding_allowed(
    policy: &AccountBindingPolicyDocument,
    action: OauthBindingActionKind,
    provider_code: Option<&str>,
) -> bool {
    if !policy.oauth_binding.enabled {
        return false;
    }

    let provider_allowed = provider_code
        .map(|provider| {
            policy.oauth_binding.allowed_providers.is_empty()
                || policy
                    .oauth_binding
                    .allowed_providers
                    .iter()
                    .any(|allowed| allowed.eq_ignore_ascii_case(provider))
        })
        .unwrap_or(true);

    if !provider_allowed {
        return false;
    }

    match action {
        OauthBindingActionKind::List => true,
        OauthBindingActionKind::Link => policy.oauth_binding.self_service_link_enabled,
        OauthBindingActionKind::Unlink => policy.oauth_binding.self_service_unlink_enabled,
    }
}

pub fn oauth_login_allowed(
    policy: &AccountBindingPolicyDocument,
    provider_code: Option<&str>,
) -> bool {
    if !policy.oauth_login.enabled {
        return false;
    }

    provider_code
        .map(|provider| {
            crate::oauth_provider_catalog::oauth_provider_allowed(
                &policy.oauth_login.allowed_providers,
                provider,
            )
        })
        .unwrap_or(true)
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum ContactBindingActionKind {
    BindEmail,
    ChangeEmail,
    UnbindEmail,
    BindPhone,
    ChangePhone,
    UnbindPhone,
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum OauthBindingActionKind {
    List,
    Link,
    Unlink,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn contact_binding_respects_master_and_channel_switches() {
        let policy = AccountBindingPolicyDocument {
            contact_binding: ContactBindingPolicy {
                enabled: true,
                email_enabled: true,
                phone_enabled: false,
                email_change_enabled: true,
                phone_change_enabled: true,
                email_unbind_enabled: true,
                phone_unbind_enabled: false,
                require_verification: true,
            },
            ..Default::default()
        };

        assert!(contact_binding_allowed(
            &policy,
            ContactBindingActionKind::BindEmail
        ));
        assert!(!contact_binding_allowed(
            &policy,
            ContactBindingActionKind::BindPhone
        ));
        assert!(contact_binding_allowed(
            &policy,
            ContactBindingActionKind::UnbindEmail
        ));
        assert!(!contact_binding_allowed(
            &policy,
            ContactBindingActionKind::UnbindPhone
        ));
    }

    #[test]
    fn oauth_list_is_available_when_feature_enabled() {
        let policy = AccountBindingPolicyDocument {
            oauth_binding: OauthBindingPolicy {
                enabled: true,
                self_service_link_enabled: false,
                self_service_unlink_enabled: false,
                allowed_providers: vec!["github".to_owned()],
            },
            ..Default::default()
        };

        assert!(oauth_binding_allowed(
            &policy,
            OauthBindingActionKind::List,
            None
        ));
        assert!(!oauth_binding_allowed(
            &policy,
            OauthBindingActionKind::Link,
            Some("github")
        ));
        assert!(
            oauth_binding_allowed(&policy, OauthBindingActionKind::Link, Some("google")) == false
        );
    }
}
