use std::sync::Arc;

use reqwest::Method;

use crate::api::paths::app_path;
use crate::http::{SdkworkError, SdkworkHttpClient};
use crate::models::{AppbaseSessionCreateCommand, SdkWorkCommandData};

#[derive(Clone)]
pub struct AuthApi {
    client: Arc<SdkworkHttpClient>,
}

impl AuthApi {
    pub fn new(client: Arc<SdkworkHttpClient>) -> Self {
        Self { client }
    }

    /// Password Reset Requests create.
    pub async fn password_reset_requests_create(&self, body: &std::collections::HashMap<String, serde_json::Value>) -> Result<std::collections::HashMap<String, serde_json::Value>, SdkworkError> {
        let path = app_path(&"/auth/password_reset_requests".to_string());
        self.client.request_method(Method::POST, &path, Some(body), None, None, Some("application/json"), false, true).await
    }

    /// Password Resets create.
    pub async fn password_resets_create(&self, body: &std::collections::HashMap<String, serde_json::Value>) -> Result<std::collections::HashMap<String, serde_json::Value>, SdkworkError> {
        let path = app_path(&"/auth/password_resets".to_string());
        self.client.request_method(Method::POST, &path, Some(body), None, None, Some("application/json"), false, true).await
    }

    /// Registrations create.
    pub async fn registrations_create(&self, body: &std::collections::HashMap<String, serde_json::Value>) -> Result<std::collections::HashMap<String, serde_json::Value>, SdkworkError> {
        let path = app_path(&"/auth/registrations".to_string());
        self.client.request_method(Method::POST, &path, Some(body), None, None, Some("application/json"), false, true).await
    }

    /// Sessions create.
    pub async fn sessions_create(&self, body: &AppbaseSessionCreateCommand) -> Result<std::collections::HashMap<String, serde_json::Value>, SdkworkError> {
        let path = app_path(&"/auth/sessions".to_string());
        self.client.request_method(Method::POST, &path, Some(body), None, None, Some("application/json"), false, true).await
    }

    /// Sessions current delete.
    pub async fn sessions_current_delete(&self) -> Result<(), SdkworkError> {
        let path = app_path(&"/auth/sessions/current".to_string());
        self.client.delete(&path, None, None).await
    }

    /// Sessions current retrieve.
    pub async fn sessions_current_retrieve(&self) -> Result<std::collections::HashMap<String, serde_json::Value>, SdkworkError> {
        let path = app_path(&"/auth/sessions/current".to_string());
        self.client.get(&path, None, None).await
    }

    /// Sessions current update.
    pub async fn sessions_current_update(&self, body: &std::collections::HashMap<String, serde_json::Value>) -> Result<std::collections::HashMap<String, serde_json::Value>, SdkworkError> {
        let path = app_path(&"/auth/sessions/current".to_string());
        self.client.patch(&path, Some(body), None, None, Some("application/json")).await
    }

    /// Sessions login Context Selection create.
    pub async fn sessions_login_context_selection_create(&self, body: &std::collections::HashMap<String, serde_json::Value>) -> Result<std::collections::HashMap<String, serde_json::Value>, SdkworkError> {
        let path = app_path(&"/auth/sessions/login_context_selection".to_string());
        self.client.request_method(Method::POST, &path, Some(body), None, None, Some("application/json"), false, true).await
    }

    /// Sessions organization Selection create.
    pub async fn sessions_organization_selection_create(&self, body: &std::collections::HashMap<String, serde_json::Value>) -> Result<std::collections::HashMap<String, serde_json::Value>, SdkworkError> {
        let path = app_path(&"/auth/sessions/organization_selection".to_string());
        self.client.request_method(Method::POST, &path, Some(body), None, None, Some("application/json"), false, true).await
    }

    /// Sessions refresh.
    pub async fn sessions_refresh(&self, body: &std::collections::HashMap<String, serde_json::Value>) -> Result<SdkWorkCommandData, SdkworkError> {
        let path = app_path(&"/auth/sessions/refresh".to_string());
        self.client.request_method(Method::POST, &path, Some(body), None, None, Some("application/json"), true, false).await
    }

}
