use std::sync::Arc;

use reqwest::Method;

use crate::api::paths::app_path;
use crate::http::{SdkworkError, SdkworkHttpClient};
use crate::models::{AppbaseApiResult};

#[derive(Clone)]
pub struct SystemApi {
    client: Arc<SdkworkHttpClient>,
}

impl SystemApi {
    pub fn new(client: Arc<SdkworkHttpClient>) -> Self {
        Self { client }
    }

    /// Iam account Binding Policy retrieve.
    pub async fn iam_account_binding_policy_retrieve(&self) -> Result<AppbaseApiResult, SdkworkError> {
        let path = app_path(&"/system/iam/account_binding_policy".to_string());
        self.client.request_method(Method::GET, &path, Option::<&serde_json::Value>::None, None, None, None, true).await
    }

    /// Iam runtime retrieve.
    pub async fn iam_runtime_retrieve(&self) -> Result<AppbaseApiResult, SdkworkError> {
        let path = app_path(&"/system/iam/runtime".to_string());
        self.client.request_method(Method::GET, &path, Option::<&serde_json::Value>::None, None, None, None, true).await
    }

    /// Iam verification Policy retrieve.
    pub async fn iam_verification_policy_retrieve(&self) -> Result<AppbaseApiResult, SdkworkError> {
        let path = app_path(&"/system/iam/verification_policy".to_string());
        self.client.request_method(Method::GET, &path, Option::<&serde_json::Value>::None, None, None, None, true).await
    }

}
