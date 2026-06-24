//! IAM `iam_api_key` lookup for open-api API key authentication.

use async_trait::async_trait;
use sdkwork_web_core::{
    ApiKeyCredential, ApiKeyLookupService, ApiKeyPrincipalRecord, WebDeploymentMode,
    WebEnvironment, WebFrameworkError,
};
use serde_json::Value;
use sqlx::{PgPool, Row};
use std::sync::Arc;

use crate::application_registry::validate_enabled_tenant_runtime_app;
use crate::iam_session::hash_token;

#[derive(Clone)]
pub struct IamApiKeyLookupService {
    pool: Arc<PgPool>,
}

impl IamApiKeyLookupService {
    pub fn new(pool: Arc<PgPool>) -> Self {
        Self { pool }
    }
}

#[async_trait]
impl ApiKeyLookupService for IamApiKeyLookupService {
    async fn lookup_api_key(
        &self,
        credential: &ApiKeyCredential,
    ) -> Result<ApiKeyPrincipalRecord, WebFrameworkError> {
        let key_hash = hash_token(&credential.raw_value);
        let now = chrono::Utc::now();

        let row = sqlx::query(
            "SELECT id, tenant_id, organization_id, user_id, app_id, environment, deployment_mode, \
             permission_scope_json, status, expires_at \
             FROM iam_api_key \
             WHERE key_hash = $1 AND status = 'active' \
           AND (expires_at IS NULL OR expires_at::timestamptz > $2::timestamptz) \
             LIMIT 1",
        )
        .bind(&key_hash)
        .bind(&now)
        .fetch_optional(self.pool.as_ref())
        .await
        .map_err(|error| {
            WebFrameworkError::dependency_unavailable(format!("iam api key lookup failed: {error}"))
        })?
        .ok_or_else(|| WebFrameworkError::invalid_credentials("invalid or expired IAM API key"))?;

        let api_key_id: String = row.get(0);
        let tenant_id: String = row.get(1);
        let organization_id: String = row.get(2);
        let user_id: String = row.get(3);
        let app_id: String = row.get(4);
        let environment: String = row.get(5);
        let deployment_mode: String = row.get(6);
        let permission_scope_json: String = row.get(7);

        if crate::is_blank(Some(app_id.as_str())) {
            return Err(WebFrameworkError::invalid_credentials(
                "IAM API key record is missing runtime appId",
            ));
        }

        validate_enabled_tenant_runtime_app(self.pool.as_ref(), &tenant_id, &app_id)
            .await
            .map_err(|error| WebFrameworkError::invalid_credentials(error))?;

        let organization_id = normalize_organization_id(&organization_id);
        let permission_scope = parse_string_vec_json(&permission_scope_json);

        Ok(ApiKeyPrincipalRecord {
            api_key_id,
            tenant_id,
            organization_id,
            user_id,
            app_id,
            environment: parse_environment(&environment),
            deployment_mode: parse_deployment_mode(&deployment_mode),
            data_scope: Vec::new(),
            permission_scope,
            subject_type: Some("api_key".to_owned()),
            metadata: credential.metadata.clone(),
        })
    }
}

fn parse_environment(value: &str) -> WebEnvironment {
    match value.trim().to_ascii_lowercase().as_str() {
        "dev" | "development" => WebEnvironment::Dev,
        "test" => WebEnvironment::Test,
        "staging" | "production" | "prod" => WebEnvironment::Prod,
        _ => WebEnvironment::Prod,
    }
}

fn parse_deployment_mode(value: &str) -> WebDeploymentMode {
    match value.trim().to_ascii_lowercase().as_str() {
        "standalone" | "local" => WebDeploymentMode::Local,
        "private" => WebDeploymentMode::Private,
        "cloud" | "saas" => WebDeploymentMode::Saas,
        _ => WebDeploymentMode::Saas,
    }
}

fn normalize_organization_id(organization_id: &str) -> Option<String> {
    if crate::is_blank(Some(organization_id)) {
        None
    } else {
        Some(organization_id.trim().to_owned())
    }
}

fn parse_string_vec_json(raw: &str) -> Vec<String> {
    serde_json::from_str::<Value>(raw)
        .ok()
        .and_then(|value| match value {
            Value::Array(items) => Some(
                items
                    .iter()
                    .filter_map(|item| item.as_str().map(str::to_owned))
                    .collect(),
            ),
            Value::String(text) => Some(
                text.split(',')
                    .map(str::trim)
                    .filter(|part| !part.is_empty())
                    .map(str::to_owned)
                    .collect(),
            ),
            _ => None,
        })
        .unwrap_or_default()
}
