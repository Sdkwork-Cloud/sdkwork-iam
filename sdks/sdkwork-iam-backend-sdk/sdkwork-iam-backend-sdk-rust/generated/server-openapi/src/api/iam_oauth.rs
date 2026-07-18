use std::sync::Arc;

use crate::api::paths::backend_path;
use crate::api::paths::append_query_string;
use crate::http::{SdkworkError, SdkworkHttpClient};
use crate::models::{IamOauthClientCreateCommand, SdkWorkListResponse, SdkWorkResourceResponse};

#[derive(Clone)]
pub struct IamOauthApi {
    client: Arc<SdkworkHttpClient>,
}

impl IamOauthApi {
    pub fn new(client: Arc<SdkworkHttpClient>) -> Self {
        Self { client }
    }

    /// Iam oauth account Links list.
    pub async fn account_links_list(&self, page: Option<i64>, page_size: Option<i64>, cursor: Option<&str>, sort: Option<&str>, q: Option<&str>) -> Result<SdkWorkListResponse, SdkworkError> {
        let query = build_query_string(&[
            QueryParameterSpec::new("page", page, "form", true, false, None),
            QueryParameterSpec::new("page_size", page_size, "form", true, false, None),
            QueryParameterSpec::new("cursor", cursor, "form", true, false, None),
            QueryParameterSpec::new("sort", sort, "form", true, false, None),
            QueryParameterSpec::new("q", q, "form", true, false, None),
        ]);
        let path = append_query_string(backend_path(&"/iam/oauth/account_links".to_string()), &query);
        self.client.get(&path, None, None).await
    }

    /// Iam oauth account Links update.
    pub async fn account_links_update(&self, account_link_id: &str, body: &std::collections::HashMap<String, serde_json::Value>) -> Result<SdkWorkResourceResponse, SdkworkError> {
        let path = backend_path(&format!("/iam/oauth/account_links/{}", serialize_path_parameter(account_link_id, PathParameterSpec::new("accountLinkId", "simple", false))));
        self.client.patch(&path, Some(body), None, None, Some("application/json")).await
    }

    /// Iam oauth callback Events list.
    pub async fn callback_events_list(&self, page: Option<i64>, page_size: Option<i64>, cursor: Option<&str>, sort: Option<&str>, q: Option<&str>) -> Result<SdkWorkListResponse, SdkworkError> {
        let query = build_query_string(&[
            QueryParameterSpec::new("page", page, "form", true, false, None),
            QueryParameterSpec::new("page_size", page_size, "form", true, false, None),
            QueryParameterSpec::new("cursor", cursor, "form", true, false, None),
            QueryParameterSpec::new("sort", sort, "form", true, false, None),
            QueryParameterSpec::new("q", q, "form", true, false, None),
        ]);
        let path = append_query_string(backend_path(&"/iam/oauth/callback_events".to_string()), &query);
        self.client.get(&path, None, None).await
    }

    /// Iam oauth claim Mappings list.
    pub async fn claim_mappings_list(&self, page: Option<i64>, page_size: Option<i64>, cursor: Option<&str>, sort: Option<&str>, q: Option<&str>) -> Result<SdkWorkListResponse, SdkworkError> {
        let query = build_query_string(&[
            QueryParameterSpec::new("page", page, "form", true, false, None),
            QueryParameterSpec::new("page_size", page_size, "form", true, false, None),
            QueryParameterSpec::new("cursor", cursor, "form", true, false, None),
            QueryParameterSpec::new("sort", sort, "form", true, false, None),
            QueryParameterSpec::new("q", q, "form", true, false, None),
        ]);
        let path = append_query_string(backend_path(&"/iam/oauth/claim_mappings".to_string()), &query);
        self.client.get(&path, None, None).await
    }

    /// Iam oauth claim Mappings create.
    pub async fn claim_mappings_create(&self, body: &std::collections::HashMap<String, serde_json::Value>) -> Result<SdkWorkResourceResponse, SdkworkError> {
        let path = backend_path(&"/iam/oauth/claim_mappings".to_string());
        self.client.post(&path, Some(body), None, None, Some("application/json")).await
    }

    /// Iam oauth claim Mappings update.
    pub async fn claim_mappings_update(&self, mapping_id: &str, body: &std::collections::HashMap<String, serde_json::Value>) -> Result<SdkWorkResourceResponse, SdkworkError> {
        let path = backend_path(&format!("/iam/oauth/claim_mappings/{}", serialize_path_parameter(mapping_id, PathParameterSpec::new("mappingId", "simple", false))));
        self.client.patch(&path, Some(body), None, None, Some("application/json")).await
    }

    /// Iam oauth clients list.
    pub async fn clients_list(&self, page: Option<i64>, page_size: Option<i64>, cursor: Option<&str>, sort: Option<&str>, q: Option<&str>) -> Result<SdkWorkListResponse, SdkworkError> {
        let query = build_query_string(&[
            QueryParameterSpec::new("page", page, "form", true, false, None),
            QueryParameterSpec::new("page_size", page_size, "form", true, false, None),
            QueryParameterSpec::new("cursor", cursor, "form", true, false, None),
            QueryParameterSpec::new("sort", sort, "form", true, false, None),
            QueryParameterSpec::new("q", q, "form", true, false, None),
        ]);
        let path = append_query_string(backend_path(&"/iam/oauth/clients".to_string()), &query);
        self.client.get(&path, None, None).await
    }

    /// Iam oauth clients create.
    pub async fn clients_create(&self, body: &IamOauthClientCreateCommand) -> Result<SdkWorkResourceResponse, SdkworkError> {
        let path = backend_path(&"/iam/oauth/clients".to_string());
        self.client.post(&path, Some(body), None, None, Some("application/json")).await
    }

    /// Iam oauth clients delete.
    pub async fn clients_delete(&self, oauth_client_id: &str) -> Result<(), SdkworkError> {
        let path = backend_path(&format!("/iam/oauth/clients/{}", serialize_path_parameter(oauth_client_id, PathParameterSpec::new("oauthClientId", "simple", false))));
        self.client.delete(&path, None, None).await
    }

    /// Iam oauth clients retrieve.
    pub async fn clients_retrieve(&self, oauth_client_id: &str) -> Result<SdkWorkResourceResponse, SdkworkError> {
        let path = backend_path(&format!("/iam/oauth/clients/{}", serialize_path_parameter(oauth_client_id, PathParameterSpec::new("oauthClientId", "simple", false))));
        self.client.get(&path, None, None).await
    }

    /// Iam oauth clients update.
    pub async fn clients_update(&self, oauth_client_id: &str, body: &std::collections::HashMap<String, serde_json::Value>) -> Result<SdkWorkResourceResponse, SdkworkError> {
        let path = backend_path(&format!("/iam/oauth/clients/{}", serialize_path_parameter(oauth_client_id, PathParameterSpec::new("oauthClientId", "simple", false))));
        self.client.patch(&path, Some(body), None, None, Some("application/json")).await
    }

    /// Iam oauth diagnostic Runs list.
    pub async fn diagnostic_runs_list(&self, page: Option<i64>, page_size: Option<i64>, cursor: Option<&str>, sort: Option<&str>, q: Option<&str>) -> Result<SdkWorkListResponse, SdkworkError> {
        let query = build_query_string(&[
            QueryParameterSpec::new("page", page, "form", true, false, None),
            QueryParameterSpec::new("page_size", page_size, "form", true, false, None),
            QueryParameterSpec::new("cursor", cursor, "form", true, false, None),
            QueryParameterSpec::new("sort", sort, "form", true, false, None),
            QueryParameterSpec::new("q", q, "form", true, false, None),
        ]);
        let path = append_query_string(backend_path(&"/iam/oauth/diagnostic_runs".to_string()), &query);
        self.client.get(&path, None, None).await
    }

    /// Iam oauth diagnostic Runs create.
    pub async fn diagnostic_runs_create(&self, body: &std::collections::HashMap<String, serde_json::Value>) -> Result<SdkWorkResourceResponse, SdkworkError> {
        let path = backend_path(&"/iam/oauth/diagnostic_runs".to_string());
        self.client.post(&path, Some(body), None, None, Some("application/json")).await
    }

    /// Iam oauth diagnostic Runs retrieve.
    pub async fn diagnostic_runs_retrieve(&self, diagnostic_run_id: &str) -> Result<SdkWorkResourceResponse, SdkworkError> {
        let path = backend_path(&format!("/iam/oauth/diagnostic_runs/{}", serialize_path_parameter(diagnostic_run_id, PathParameterSpec::new("diagnosticRunId", "simple", false))));
        self.client.get(&path, None, None).await
    }

    /// Iam oauth flow Configs list.
    pub async fn flow_configs_list(&self, page: Option<i64>, page_size: Option<i64>, cursor: Option<&str>, sort: Option<&str>, q: Option<&str>) -> Result<SdkWorkListResponse, SdkworkError> {
        let query = build_query_string(&[
            QueryParameterSpec::new("page", page, "form", true, false, None),
            QueryParameterSpec::new("page_size", page_size, "form", true, false, None),
            QueryParameterSpec::new("cursor", cursor, "form", true, false, None),
            QueryParameterSpec::new("sort", sort, "form", true, false, None),
            QueryParameterSpec::new("q", q, "form", true, false, None),
        ]);
        let path = append_query_string(backend_path(&"/iam/oauth/flow_configs".to_string()), &query);
        self.client.get(&path, None, None).await
    }

    /// Iam oauth flow Configs create.
    pub async fn flow_configs_create(&self, body: &std::collections::HashMap<String, serde_json::Value>) -> Result<SdkWorkResourceResponse, SdkworkError> {
        let path = backend_path(&"/iam/oauth/flow_configs".to_string());
        self.client.post(&path, Some(body), None, None, Some("application/json")).await
    }

    /// Iam oauth flow Configs update.
    pub async fn flow_configs_update(&self, flow_config_id: &str, body: &std::collections::HashMap<String, serde_json::Value>) -> Result<SdkWorkResourceResponse, SdkworkError> {
        let path = backend_path(&format!("/iam/oauth/flow_configs/{}", serialize_path_parameter(flow_config_id, PathParameterSpec::new("flowConfigId", "simple", false))));
        self.client.patch(&path, Some(body), None, None, Some("application/json")).await
    }

    /// Iam oauth grants list.
    pub async fn grants_list(&self, page: Option<i64>, page_size: Option<i64>, cursor: Option<&str>, sort: Option<&str>, q: Option<&str>) -> Result<SdkWorkListResponse, SdkworkError> {
        let query = build_query_string(&[
            QueryParameterSpec::new("page", page, "form", true, false, None),
            QueryParameterSpec::new("page_size", page_size, "form", true, false, None),
            QueryParameterSpec::new("cursor", cursor, "form", true, false, None),
            QueryParameterSpec::new("sort", sort, "form", true, false, None),
            QueryParameterSpec::new("q", q, "form", true, false, None),
        ]);
        let path = append_query_string(backend_path(&"/iam/oauth/grants".to_string()), &query);
        self.client.get(&path, None, None).await
    }

    /// Iam oauth grants delete.
    pub async fn grants_delete(&self, grant_id: &str) -> Result<(), SdkworkError> {
        let path = backend_path(&format!("/iam/oauth/grants/{}", serialize_path_parameter(grant_id, PathParameterSpec::new("grantId", "simple", false))));
        self.client.delete(&path, None, None).await
    }

    /// Iam oauth integrations list.
    pub async fn integrations_list(&self, page: Option<i64>, page_size: Option<i64>, cursor: Option<&str>, sort: Option<&str>, q: Option<&str>) -> Result<SdkWorkListResponse, SdkworkError> {
        let query = build_query_string(&[
            QueryParameterSpec::new("page", page, "form", true, false, None),
            QueryParameterSpec::new("page_size", page_size, "form", true, false, None),
            QueryParameterSpec::new("cursor", cursor, "form", true, false, None),
            QueryParameterSpec::new("sort", sort, "form", true, false, None),
            QueryParameterSpec::new("q", q, "form", true, false, None),
        ]);
        let path = append_query_string(backend_path(&"/iam/oauth/integrations".to_string()), &query);
        self.client.get(&path, None, None).await
    }

    /// Iam oauth integrations create.
    pub async fn integrations_create(&self, body: &std::collections::HashMap<String, serde_json::Value>) -> Result<SdkWorkResourceResponse, SdkworkError> {
        let path = backend_path(&"/iam/oauth/integrations".to_string());
        self.client.post(&path, Some(body), None, None, Some("application/json")).await
    }

    /// Iam oauth integrations delete.
    pub async fn integrations_delete(&self, integration_id: &str) -> Result<(), SdkworkError> {
        let path = backend_path(&format!("/iam/oauth/integrations/{}", serialize_path_parameter(integration_id, PathParameterSpec::new("integrationId", "simple", false))));
        self.client.delete(&path, None, None).await
    }

    /// Iam oauth integrations retrieve.
    pub async fn integrations_retrieve(&self, integration_id: &str) -> Result<SdkWorkResourceResponse, SdkworkError> {
        let path = backend_path(&format!("/iam/oauth/integrations/{}", serialize_path_parameter(integration_id, PathParameterSpec::new("integrationId", "simple", false))));
        self.client.get(&path, None, None).await
    }

    /// Iam oauth integrations update.
    pub async fn integrations_update(&self, integration_id: &str, body: &std::collections::HashMap<String, serde_json::Value>) -> Result<SdkWorkResourceResponse, SdkworkError> {
        let path = backend_path(&format!("/iam/oauth/integrations/{}", serialize_path_parameter(integration_id, PathParameterSpec::new("integrationId", "simple", false))));
        self.client.patch(&path, Some(body), None, None, Some("application/json")).await
    }

    /// Iam oauth operational Resources list.
    pub async fn operational_resources_list(&self, page: Option<i64>, page_size: Option<i64>, cursor: Option<&str>, sort: Option<&str>, q: Option<&str>) -> Result<SdkWorkListResponse, SdkworkError> {
        let query = build_query_string(&[
            QueryParameterSpec::new("page", page, "form", true, false, None),
            QueryParameterSpec::new("page_size", page_size, "form", true, false, None),
            QueryParameterSpec::new("cursor", cursor, "form", true, false, None),
            QueryParameterSpec::new("sort", sort, "form", true, false, None),
            QueryParameterSpec::new("q", q, "form", true, false, None),
        ]);
        let path = append_query_string(backend_path(&"/iam/oauth/operational_resources".to_string()), &query);
        self.client.get(&path, None, None).await
    }

    /// Iam oauth operational Resources create.
    pub async fn operational_resources_create(&self, body: &std::collections::HashMap<String, serde_json::Value>) -> Result<SdkWorkResourceResponse, SdkworkError> {
        let path = backend_path(&"/iam/oauth/operational_resources".to_string());
        self.client.post(&path, Some(body), None, None, Some("application/json")).await
    }

    /// Iam oauth operational Resources delete.
    pub async fn operational_resources_delete(&self, resource_id: &str) -> Result<(), SdkworkError> {
        let path = backend_path(&format!("/iam/oauth/operational_resources/{}", serialize_path_parameter(resource_id, PathParameterSpec::new("resourceId", "simple", false))));
        self.client.delete(&path, None, None).await
    }

    /// Iam oauth operational Resources update.
    pub async fn operational_resources_update(&self, resource_id: &str, body: &std::collections::HashMap<String, serde_json::Value>) -> Result<SdkWorkResourceResponse, SdkworkError> {
        let path = backend_path(&format!("/iam/oauth/operational_resources/{}", serialize_path_parameter(resource_id, PathParameterSpec::new("resourceId", "simple", false))));
        self.client.patch(&path, Some(body), None, None, Some("application/json")).await
    }

    /// Iam oauth operational Resources publishes create.
    pub async fn operational_resources_publishes_create(&self, resource_id: &str, body: &std::collections::HashMap<String, serde_json::Value>) -> Result<SdkWorkResourceResponse, SdkworkError> {
        let path = backend_path(&format!("/iam/oauth/operational_resources/{}/publishes", serialize_path_parameter(resource_id, PathParameterSpec::new("resourceId", "simple", false))));
        self.client.post(&path, Some(body), None, None, Some("application/json")).await
    }

    /// Iam oauth operator Platforms list.
    pub async fn operator_platforms_list(&self, page: Option<i64>, page_size: Option<i64>, cursor: Option<&str>, sort: Option<&str>, q: Option<&str>) -> Result<SdkWorkListResponse, SdkworkError> {
        let query = build_query_string(&[
            QueryParameterSpec::new("page", page, "form", true, false, None),
            QueryParameterSpec::new("page_size", page_size, "form", true, false, None),
            QueryParameterSpec::new("cursor", cursor, "form", true, false, None),
            QueryParameterSpec::new("sort", sort, "form", true, false, None),
            QueryParameterSpec::new("q", q, "form", true, false, None),
        ]);
        let path = append_query_string(backend_path(&"/iam/oauth/operator_platforms".to_string()), &query);
        self.client.get(&path, None, None).await
    }

    /// Iam oauth operator Platforms create.
    pub async fn operator_platforms_create(&self, body: &std::collections::HashMap<String, serde_json::Value>) -> Result<SdkWorkResourceResponse, SdkworkError> {
        let path = backend_path(&"/iam/oauth/operator_platforms".to_string());
        self.client.post(&path, Some(body), None, None, Some("application/json")).await
    }

    /// Iam oauth operator Platforms update.
    pub async fn operator_platforms_update(&self, operator_platform_id: &str, body: &std::collections::HashMap<String, serde_json::Value>) -> Result<SdkWorkResourceResponse, SdkworkError> {
        let path = backend_path(&format!("/iam/oauth/operator_platforms/{}", serialize_path_parameter(operator_platform_id, PathParameterSpec::new("operatorPlatformId", "simple", false))));
        self.client.patch(&path, Some(body), None, None, Some("application/json")).await
    }

    /// Iam oauth operator Platforms pre Authorizations create.
    pub async fn operator_platforms_pre_authorizations_create(&self, operator_platform_id: &str, body: &std::collections::HashMap<String, serde_json::Value>) -> Result<SdkWorkResourceResponse, SdkworkError> {
        let path = backend_path(&format!("/iam/oauth/operator_platforms/{}/pre_authorizations", serialize_path_parameter(operator_platform_id, PathParameterSpec::new("operatorPlatformId", "simple", false))));
        self.client.post(&path, Some(body), None, None, Some("application/json")).await
    }

    /// Iam oauth policies list.
    pub async fn policies_list(&self, page: Option<i64>, page_size: Option<i64>, cursor: Option<&str>, sort: Option<&str>, q: Option<&str>) -> Result<SdkWorkListResponse, SdkworkError> {
        let query = build_query_string(&[
            QueryParameterSpec::new("page", page, "form", true, false, None),
            QueryParameterSpec::new("page_size", page_size, "form", true, false, None),
            QueryParameterSpec::new("cursor", cursor, "form", true, false, None),
            QueryParameterSpec::new("sort", sort, "form", true, false, None),
            QueryParameterSpec::new("q", q, "form", true, false, None),
        ]);
        let path = append_query_string(backend_path(&"/iam/oauth/policies".to_string()), &query);
        self.client.get(&path, None, None).await
    }

    /// Iam oauth policies create.
    pub async fn policies_create(&self, body: &std::collections::HashMap<String, serde_json::Value>) -> Result<SdkWorkResourceResponse, SdkworkError> {
        let path = backend_path(&"/iam/oauth/policies".to_string());
        self.client.post(&path, Some(body), None, None, Some("application/json")).await
    }

    /// Iam oauth policies update.
    pub async fn policies_update(&self, policy_id: &str, body: &std::collections::HashMap<String, serde_json::Value>) -> Result<SdkWorkResourceResponse, SdkworkError> {
        let path = backend_path(&format!("/iam/oauth/policies/{}", serialize_path_parameter(policy_id, PathParameterSpec::new("policyId", "simple", false))));
        self.client.patch(&path, Some(body), None, None, Some("application/json")).await
    }

    /// Iam oauth provider Catalog list.
    pub async fn provider_catalog_list(&self, page: Option<i64>, page_size: Option<i64>, cursor: Option<&str>, sort: Option<&str>, q: Option<&str>) -> Result<SdkWorkListResponse, SdkworkError> {
        let query = build_query_string(&[
            QueryParameterSpec::new("page", page, "form", true, false, None),
            QueryParameterSpec::new("page_size", page_size, "form", true, false, None),
            QueryParameterSpec::new("cursor", cursor, "form", true, false, None),
            QueryParameterSpec::new("sort", sort, "form", true, false, None),
            QueryParameterSpec::new("q", q, "form", true, false, None),
        ]);
        let path = append_query_string(backend_path(&"/iam/oauth/provider_catalog".to_string()), &query);
        self.client.get(&path, None, None).await
    }

    /// Iam oauth provider Catalog create.
    pub async fn provider_catalog_create(&self, body: &std::collections::HashMap<String, serde_json::Value>) -> Result<SdkWorkResourceResponse, SdkworkError> {
        let path = backend_path(&"/iam/oauth/provider_catalog".to_string());
        self.client.post(&path, Some(body), None, None, Some("application/json")).await
    }

    /// Iam oauth provider Catalog retrieve.
    pub async fn provider_catalog_retrieve(&self, provider_catalog_id: &str) -> Result<SdkWorkResourceResponse, SdkworkError> {
        let path = backend_path(&format!("/iam/oauth/provider_catalog/{}", serialize_path_parameter(provider_catalog_id, PathParameterSpec::new("providerCatalogId", "simple", false))));
        self.client.get(&path, None, None).await
    }

    /// Iam oauth provider Catalog update.
    pub async fn provider_catalog_update(&self, provider_catalog_id: &str, body: &std::collections::HashMap<String, serde_json::Value>) -> Result<SdkWorkResourceResponse, SdkworkError> {
        let path = backend_path(&format!("/iam/oauth/provider_catalog/{}", serialize_path_parameter(provider_catalog_id, PathParameterSpec::new("providerCatalogId", "simple", false))));
        self.client.patch(&path, Some(body), None, None, Some("application/json")).await
    }

    /// Iam oauth resource Accounts list.
    pub async fn resource_accounts_list(&self, page: Option<i64>, page_size: Option<i64>, cursor: Option<&str>, sort: Option<&str>, q: Option<&str>) -> Result<SdkWorkListResponse, SdkworkError> {
        let query = build_query_string(&[
            QueryParameterSpec::new("page", page, "form", true, false, None),
            QueryParameterSpec::new("page_size", page_size, "form", true, false, None),
            QueryParameterSpec::new("cursor", cursor, "form", true, false, None),
            QueryParameterSpec::new("sort", sort, "form", true, false, None),
            QueryParameterSpec::new("q", q, "form", true, false, None),
        ]);
        let path = append_query_string(backend_path(&"/iam/oauth/resource_accounts".to_string()), &query);
        self.client.get(&path, None, None).await
    }

    /// Iam oauth resource Accounts create.
    pub async fn resource_accounts_create(&self, body: &std::collections::HashMap<String, serde_json::Value>) -> Result<SdkWorkResourceResponse, SdkworkError> {
        let path = backend_path(&"/iam/oauth/resource_accounts".to_string());
        self.client.post(&path, Some(body), None, None, Some("application/json")).await
    }

    /// Iam oauth resource Accounts update.
    pub async fn resource_accounts_update(&self, resource_account_id: &str, body: &std::collections::HashMap<String, serde_json::Value>) -> Result<SdkWorkResourceResponse, SdkworkError> {
        let path = backend_path(&format!("/iam/oauth/resource_accounts/{}", serialize_path_parameter(resource_account_id, PathParameterSpec::new("resourceAccountId", "simple", false))));
        self.client.patch(&path, Some(body), None, None, Some("application/json")).await
    }

    /// Iam oauth resource Accounts authorization Refreshes create.
    pub async fn resource_accounts_authorization_refreshes_create(&self, resource_account_id: &str, body: &std::collections::HashMap<String, serde_json::Value>) -> Result<SdkWorkResourceResponse, SdkworkError> {
        let path = backend_path(&format!("/iam/oauth/resource_accounts/{}/authorization_refreshes", serialize_path_parameter(resource_account_id, PathParameterSpec::new("resourceAccountId", "simple", false))));
        self.client.post(&path, Some(body), None, None, Some("application/json")).await
    }

    /// Iam oauth resource Accounts mini Program Login Checks create.
    pub async fn resource_accounts_mini_program_login_checks_create(&self, resource_account_id: &str, body: &std::collections::HashMap<String, serde_json::Value>) -> Result<SdkWorkResourceResponse, SdkworkError> {
        let path = backend_path(&format!("/iam/oauth/resource_accounts/{}/mini_program_login_checks", serialize_path_parameter(resource_account_id, PathParameterSpec::new("resourceAccountId", "simple", false))));
        self.client.post(&path, Some(body), None, None, Some("application/json")).await
    }

    /// Iam oauth resource Accounts verifications create.
    pub async fn resource_accounts_verifications_create(&self, resource_account_id: &str, body: &std::collections::HashMap<String, serde_json::Value>) -> Result<SdkWorkResourceResponse, SdkworkError> {
        let path = backend_path(&format!("/iam/oauth/resource_accounts/{}/verifications", serialize_path_parameter(resource_account_id, PathParameterSpec::new("resourceAccountId", "simple", false))));
        self.client.post(&path, Some(body), None, None, Some("application/json")).await
    }

    /// Iam oauth resource Authorizations list.
    pub async fn resource_authorizations_list(&self, page: Option<i64>, page_size: Option<i64>, cursor: Option<&str>, sort: Option<&str>, q: Option<&str>) -> Result<SdkWorkListResponse, SdkworkError> {
        let query = build_query_string(&[
            QueryParameterSpec::new("page", page, "form", true, false, None),
            QueryParameterSpec::new("page_size", page_size, "form", true, false, None),
            QueryParameterSpec::new("cursor", cursor, "form", true, false, None),
            QueryParameterSpec::new("sort", sort, "form", true, false, None),
            QueryParameterSpec::new("q", q, "form", true, false, None),
        ]);
        let path = append_query_string(backend_path(&"/iam/oauth/resource_authorizations".to_string()), &query);
        self.client.get(&path, None, None).await
    }

    /// Iam oauth resource Authorizations create.
    pub async fn resource_authorizations_create(&self, body: &std::collections::HashMap<String, serde_json::Value>) -> Result<SdkWorkResourceResponse, SdkworkError> {
        let path = backend_path(&"/iam/oauth/resource_authorizations".to_string());
        self.client.post(&path, Some(body), None, None, Some("application/json")).await
    }

    /// Iam oauth resource Authorizations update.
    pub async fn resource_authorizations_update(&self, authorization_id: &str, body: &std::collections::HashMap<String, serde_json::Value>) -> Result<SdkWorkResourceResponse, SdkworkError> {
        let path = backend_path(&format!("/iam/oauth/resource_authorizations/{}", serialize_path_parameter(authorization_id, PathParameterSpec::new("authorizationId", "simple", false))));
        self.client.patch(&path, Some(body), None, None, Some("application/json")).await
    }

    /// Iam oauth scope Profiles list.
    pub async fn scope_profiles_list(&self, page: Option<i64>, page_size: Option<i64>, cursor: Option<&str>, sort: Option<&str>, q: Option<&str>) -> Result<SdkWorkListResponse, SdkworkError> {
        let query = build_query_string(&[
            QueryParameterSpec::new("page", page, "form", true, false, None),
            QueryParameterSpec::new("page_size", page_size, "form", true, false, None),
            QueryParameterSpec::new("cursor", cursor, "form", true, false, None),
            QueryParameterSpec::new("sort", sort, "form", true, false, None),
            QueryParameterSpec::new("q", q, "form", true, false, None),
        ]);
        let path = append_query_string(backend_path(&"/iam/oauth/scope_profiles".to_string()), &query);
        self.client.get(&path, None, None).await
    }

    /// Iam oauth scope Profiles create.
    pub async fn scope_profiles_create(&self, body: &std::collections::HashMap<String, serde_json::Value>) -> Result<SdkWorkResourceResponse, SdkworkError> {
        let path = backend_path(&"/iam/oauth/scope_profiles".to_string());
        self.client.post(&path, Some(body), None, None, Some("application/json")).await
    }

    /// Iam oauth scope Profiles update.
    pub async fn scope_profiles_update(&self, scope_profile_id: &str, body: &std::collections::HashMap<String, serde_json::Value>) -> Result<SdkWorkResourceResponse, SdkworkError> {
        let path = backend_path(&format!("/iam/oauth/scope_profiles/{}", serialize_path_parameter(scope_profile_id, PathParameterSpec::new("scopeProfileId", "simple", false))));
        self.client.patch(&path, Some(body), None, None, Some("application/json")).await
    }

    /// Iam oauth secrets list.
    pub async fn secrets_list(&self, page: Option<i64>, page_size: Option<i64>, cursor: Option<&str>, sort: Option<&str>, q: Option<&str>) -> Result<SdkWorkListResponse, SdkworkError> {
        let query = build_query_string(&[
            QueryParameterSpec::new("page", page, "form", true, false, None),
            QueryParameterSpec::new("page_size", page_size, "form", true, false, None),
            QueryParameterSpec::new("cursor", cursor, "form", true, false, None),
            QueryParameterSpec::new("sort", sort, "form", true, false, None),
            QueryParameterSpec::new("q", q, "form", true, false, None),
        ]);
        let path = append_query_string(backend_path(&"/iam/oauth/secrets".to_string()), &query);
        self.client.get(&path, None, None).await
    }

    /// Iam oauth secrets create.
    pub async fn secrets_create(&self, body: &std::collections::HashMap<String, serde_json::Value>) -> Result<SdkWorkResourceResponse, SdkworkError> {
        let path = backend_path(&"/iam/oauth/secrets".to_string());
        self.client.post(&path, Some(body), None, None, Some("application/json")).await
    }

    /// Iam oauth secrets delete.
    pub async fn secrets_delete(&self, secret_id: &str) -> Result<(), SdkworkError> {
        let path = backend_path(&format!("/iam/oauth/secrets/{}", serialize_path_parameter(secret_id, PathParameterSpec::new("secretId", "simple", false))));
        self.client.delete(&path, None, None).await
    }

    /// Iam oauth surfaces list.
    pub async fn surfaces_list(&self, page: Option<i64>, page_size: Option<i64>, cursor: Option<&str>, sort: Option<&str>, q: Option<&str>) -> Result<SdkWorkListResponse, SdkworkError> {
        let query = build_query_string(&[
            QueryParameterSpec::new("page", page, "form", true, false, None),
            QueryParameterSpec::new("page_size", page_size, "form", true, false, None),
            QueryParameterSpec::new("cursor", cursor, "form", true, false, None),
            QueryParameterSpec::new("sort", sort, "form", true, false, None),
            QueryParameterSpec::new("q", q, "form", true, false, None),
        ]);
        let path = append_query_string(backend_path(&"/iam/oauth/surfaces".to_string()), &query);
        self.client.get(&path, None, None).await
    }

    /// Iam oauth surfaces create.
    pub async fn surfaces_create(&self, body: &std::collections::HashMap<String, serde_json::Value>) -> Result<SdkWorkResourceResponse, SdkworkError> {
        let path = backend_path(&"/iam/oauth/surfaces".to_string());
        self.client.post(&path, Some(body), None, None, Some("application/json")).await
    }

    /// Iam oauth surfaces delete.
    pub async fn surfaces_delete(&self, surface_id: &str) -> Result<(), SdkworkError> {
        let path = backend_path(&format!("/iam/oauth/surfaces/{}", serialize_path_parameter(surface_id, PathParameterSpec::new("surfaceId", "simple", false))));
        self.client.delete(&path, None, None).await
    }

    /// Iam oauth surfaces update.
    pub async fn surfaces_update(&self, surface_id: &str, body: &std::collections::HashMap<String, serde_json::Value>) -> Result<SdkWorkResourceResponse, SdkworkError> {
        let path = backend_path(&format!("/iam/oauth/surfaces/{}", serialize_path_parameter(surface_id, PathParameterSpec::new("surfaceId", "simple", false))));
        self.client.patch(&path, Some(body), None, None, Some("application/json")).await
    }

    /// Iam oauth tenant Bindings list.
    pub async fn tenant_bindings_list(&self, page: Option<i64>, page_size: Option<i64>, cursor: Option<&str>, sort: Option<&str>, q: Option<&str>) -> Result<SdkWorkListResponse, SdkworkError> {
        let query = build_query_string(&[
            QueryParameterSpec::new("page", page, "form", true, false, None),
            QueryParameterSpec::new("page_size", page_size, "form", true, false, None),
            QueryParameterSpec::new("cursor", cursor, "form", true, false, None),
            QueryParameterSpec::new("sort", sort, "form", true, false, None),
            QueryParameterSpec::new("q", q, "form", true, false, None),
        ]);
        let path = append_query_string(backend_path(&"/iam/oauth/tenant_bindings".to_string()), &query);
        self.client.get(&path, None, None).await
    }

    /// Iam oauth tenant Bindings create.
    pub async fn tenant_bindings_create(&self, body: &std::collections::HashMap<String, serde_json::Value>) -> Result<SdkWorkResourceResponse, SdkworkError> {
        let path = backend_path(&"/iam/oauth/tenant_bindings".to_string());
        self.client.post(&path, Some(body), None, None, Some("application/json")).await
    }

    /// Iam oauth tenant Bindings update.
    pub async fn tenant_bindings_update(&self, binding_id: &str, body: &std::collections::HashMap<String, serde_json::Value>) -> Result<SdkWorkResourceResponse, SdkworkError> {
        let path = backend_path(&format!("/iam/oauth/tenant_bindings/{}", serialize_path_parameter(binding_id, PathParameterSpec::new("bindingId", "simple", false))));
        self.client.patch(&path, Some(body), None, None, Some("application/json")).await
    }

    /// Iam oauth webhook Configs list.
    pub async fn webhook_configs_list(&self, page: Option<i64>, page_size: Option<i64>, cursor: Option<&str>, sort: Option<&str>, q: Option<&str>) -> Result<SdkWorkListResponse, SdkworkError> {
        let query = build_query_string(&[
            QueryParameterSpec::new("page", page, "form", true, false, None),
            QueryParameterSpec::new("page_size", page_size, "form", true, false, None),
            QueryParameterSpec::new("cursor", cursor, "form", true, false, None),
            QueryParameterSpec::new("sort", sort, "form", true, false, None),
            QueryParameterSpec::new("q", q, "form", true, false, None),
        ]);
        let path = append_query_string(backend_path(&"/iam/oauth/webhook_configs".to_string()), &query);
        self.client.get(&path, None, None).await
    }

    /// Iam oauth webhook Configs create.
    pub async fn webhook_configs_create(&self, body: &std::collections::HashMap<String, serde_json::Value>) -> Result<SdkWorkResourceResponse, SdkworkError> {
        let path = backend_path(&"/iam/oauth/webhook_configs".to_string());
        self.client.post(&path, Some(body), None, None, Some("application/json")).await
    }

    /// Iam oauth webhook Configs update.
    pub async fn webhook_configs_update(&self, webhook_config_id: &str, body: &std::collections::HashMap<String, serde_json::Value>) -> Result<SdkWorkResourceResponse, SdkworkError> {
        let path = backend_path(&format!("/iam/oauth/webhook_configs/{}", serialize_path_parameter(webhook_config_id, PathParameterSpec::new("webhookConfigId", "simple", false))));
        self.client.patch(&path, Some(body), None, None, Some("application/json")).await
    }

    /// Iam oauth webhook Configs verifications create.
    pub async fn webhook_configs_verifications_create(&self, webhook_config_id: &str, body: &std::collections::HashMap<String, serde_json::Value>) -> Result<SdkWorkResourceResponse, SdkworkError> {
        let path = backend_path(&format!("/iam/oauth/webhook_configs/{}/verifications", serialize_path_parameter(webhook_config_id, PathParameterSpec::new("webhookConfigId", "simple", false))));
        self.client.post(&path, Some(body), None, None, Some("application/json")).await
    }

}

struct PathParameterSpec<'a> {
    name: &'a str,
    style: &'a str,
    explode: bool,
}

impl<'a> PathParameterSpec<'a> {
    fn new(name: &'a str, style: &'a str, explode: bool) -> Self {
        Self { name, style, explode }
    }
}

fn serialize_path_parameter<T: serde::Serialize>(value: T, spec: PathParameterSpec<'_>) -> String {
    let value = serde_json::to_value(value).unwrap_or(serde_json::Value::Null);
    if value.is_null() {
        return String::new();
    }
    let style = if spec.style.is_empty() { "simple" } else { spec.style };
    match value {
        serde_json::Value::Array(values) => serialize_path_array(spec.name, &values, style, spec.explode),
        serde_json::Value::Object(values) => serialize_path_object(spec.name, &values, style, spec.explode),
        value => format!("{}{}", path_primitive_prefix(spec.name, style), percent_encode(&primitive_to_string(&value))),
    }
}

fn serialize_path_array(name: &str, values: &[serde_json::Value], style: &str, explode: bool) -> String {
    let serialized = values
        .iter()
        .filter(|value| !value.is_null())
        .map(|value| percent_encode(&primitive_to_string(value)))
        .collect::<Vec<_>>();
    if serialized.is_empty() {
        return path_prefix(name, style);
    }
    if style == "matrix" {
        if explode {
            return serialized.iter().map(|item| format!(";{}={}", name, item)).collect::<Vec<_>>().join("");
        }
        return format!(";{}={}", name, serialized.join(","));
    }
    let separator = if explode { "." } else { "," };
    format!("{}{}", path_prefix(name, style), serialized.join(separator))
}

fn serialize_path_object(
    name: &str,
    values: &serde_json::Map<String, serde_json::Value>,
    style: &str,
    explode: bool,
) -> String {
    let mut entries = Vec::new();
    let mut exploded = Vec::new();
    for (key, value) in values {
        if value.is_null() {
            continue;
        }
        let escaped_key = percent_encode(key);
        let escaped_value = percent_encode(&primitive_to_string(value));
        if explode {
            if style == "matrix" {
                exploded.push(format!(";{}={}", escaped_key, escaped_value));
            } else {
                exploded.push(format!("{}={}", escaped_key, escaped_value));
            }
        } else {
            entries.push(escaped_key);
            entries.push(escaped_value);
        }
    }
    if style == "matrix" {
        if explode {
            return exploded.join("");
        }
        return format!(";{}={}", name, entries.join(","));
    }
    if explode {
        let separator = if style == "label" { "." } else { "," };
        return format!("{}{}", path_prefix(name, style), exploded.join(separator));
    }
    format!("{}{}", path_prefix(name, style), entries.join(","))
}

fn path_prefix(name: &str, style: &str) -> String {
    match style {
        "label" => ".".to_string(),
        "matrix" => format!(";{}", name),
        _ => String::new(),
    }
}

fn path_primitive_prefix(name: &str, style: &str) -> String {
    if style == "matrix" {
        format!(";{}=", name)
    } else {
        path_prefix(name, style)
    }
}


struct QueryParameterSpec<'a> {
    name: &'a str,
    value: serde_json::Value,
    style: &'a str,
    explode: bool,
    allow_reserved: bool,
    content_type: Option<&'a str>,
}

impl<'a> QueryParameterSpec<'a> {
    fn new<T: serde::Serialize>(
        name: &'a str,
        value: T,
        style: &'a str,
        explode: bool,
        allow_reserved: bool,
        content_type: Option<&'a str>,
    ) -> Self {
        Self {
            name,
            value: serde_json::to_value(value).unwrap_or(serde_json::Value::Null),
            style,
            explode,
            allow_reserved,
            content_type,
        }
    }
}

fn build_query_string(parameters: &[QueryParameterSpec<'_>]) -> String {
    let mut pairs = Vec::new();
    for parameter in parameters {
        append_serialized_parameter(&mut pairs, parameter);
    }
    pairs.join("&")
}

fn append_serialized_parameter(pairs: &mut Vec<String>, parameter: &QueryParameterSpec<'_>) {
    if parameter.value.is_null() {
        return;
    }
    if parameter.content_type.is_some() {
        pairs.push(format!(
            "{}={}",
            percent_encode(parameter.name),
            encode_query_value(&parameter.value.to_string(), parameter.allow_reserved)
        ));
        return;
    }

    let style = if parameter.style.is_empty() { "form" } else { parameter.style };
    match &parameter.value {
        serde_json::Value::Array(values) => append_array_parameter(pairs, parameter.name, values, style, parameter.explode, parameter.allow_reserved),
        serde_json::Value::Object(values) if style == "deepObject" => append_deep_object_parameter(pairs, parameter.name, values, parameter.allow_reserved),
        serde_json::Value::Object(values) => append_object_parameter(pairs, parameter.name, values, style, parameter.explode, parameter.allow_reserved),
        value => pairs.push(format!("{}={}", percent_encode(parameter.name), encode_query_value(&primitive_to_string(value), parameter.allow_reserved))),
    }
}

fn append_array_parameter(
    pairs: &mut Vec<String>,
    name: &str,
    values: &[serde_json::Value],
    style: &str,
    explode: bool,
    allow_reserved: bool,
) {
    let serialized = values.iter().filter(|value| !value.is_null()).map(primitive_to_string).collect::<Vec<_>>();
    if serialized.is_empty() {
        return;
    }
    if style == "form" && explode {
        for item in serialized {
            pairs.push(format!("{}={}", percent_encode(name), encode_query_value(&item, allow_reserved)));
        }
        return;
    }
    pairs.push(format!("{}={}", percent_encode(name), encode_query_value(&serialized.join(","), allow_reserved)));
}

fn append_object_parameter(
    pairs: &mut Vec<String>,
    name: &str,
    values: &serde_json::Map<String, serde_json::Value>,
    style: &str,
    explode: bool,
    allow_reserved: bool,
) {
    let mut serialized = Vec::new();
    for (key, value) in values {
        if value.is_null() {
            continue;
        }
        if style == "form" && explode {
            pairs.push(format!("{}={}", percent_encode(key), encode_query_value(&primitive_to_string(value), allow_reserved)));
        } else {
            serialized.push(key.clone());
            serialized.push(primitive_to_string(value));
        }
    }
    if !serialized.is_empty() {
        pairs.push(format!("{}={}", percent_encode(name), encode_query_value(&serialized.join(","), allow_reserved)));
    }
}

fn append_deep_object_parameter(
    pairs: &mut Vec<String>,
    name: &str,
    values: &serde_json::Map<String, serde_json::Value>,
    allow_reserved: bool,
) {
    for (key, value) in values {
        if !value.is_null() {
            pairs.push(format!("{}={}", percent_encode(&format!("{}[{}]", name, key)), encode_query_value(&primitive_to_string(value), allow_reserved)));
        }
    }
}

fn encode_query_value(value: &str, allow_reserved: bool) -> String {
    let mut encoded = percent_encode(value);
    if !allow_reserved {
        return encoded;
    }
    for (escaped, reserved) in [
        ("%3A", ":"), ("%2F", "/"), ("%3F", "?"), ("%23", "#"),
        ("%5B", "["), ("%5D", "]"), ("%40", "@"), ("%21", "!"),
        ("%24", "$"), ("%26", "&"), ("%27", "'"), ("%28", "("),
        ("%29", ")"), ("%2A", "*"), ("%2B", "+"), ("%2C", ","),
        ("%3B", ";"), ("%3D", "="),
    ] {
        encoded = encoded.replace(escaped, reserved);
    }
    encoded
}

fn primitive_to_string(value: &serde_json::Value) -> String {
    match value {
        serde_json::Value::String(value) => value.clone(),
        serde_json::Value::Number(value) => value.to_string(),
        serde_json::Value::Bool(value) => value.to_string(),
        other => other.to_string(),
    }
}

fn percent_encode(value: &str) -> String {
    value
        .bytes()
        .flat_map(|byte| match byte {
            b'A'..=b'Z' | b'a'..=b'z' | b'0'..=b'9' | b'-' | b'_' | b'.' | b'~' => {
                vec![byte as char]
            }
            _ => format!("%{:02X}", byte).chars().collect(),
        })
        .collect()
}
