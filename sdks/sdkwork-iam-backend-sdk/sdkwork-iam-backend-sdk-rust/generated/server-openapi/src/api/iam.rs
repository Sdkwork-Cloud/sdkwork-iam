use std::sync::Arc;

use crate::api::paths::backend_path;
use crate::api::paths::append_query_string;
use crate::http::{SdkworkError, SdkworkHttpClient};
use crate::models::{AppbaseAccessCredentialCreateCommand, AppbaseApplicationRegisterCommand, AppbaseTenantApplicationEnableCommand, AppbaseTenantApplicationProvisionCommand, AppbaseTenantApplicationUpdateCommand, SdkWorkCommandResponse, SdkWorkListResponse, SdkWorkResourceResponse, ServiceAccountCredentialCreateCommand, ServiceAccountCredentialRevokeCommand, ServiceAccountTokenExchangeCommand};

#[derive(Clone)]
pub struct IamApi {
    client: Arc<SdkworkHttpClient>,
}

impl IamApi {
    pub fn new(client: Arc<SdkworkHttpClient>) -> Self {
        Self { client }
    }

    /// Access Credentials create.
    pub async fn access_credentials_create(&self, body: &AppbaseAccessCredentialCreateCommand) -> Result<SdkWorkResourceResponse, SdkworkError> {
        let path = backend_path(&"/iam/access_credentials".to_string());
        self.client.post(&path, Some(body), None, None, Some("application/json")).await
    }

    /// Account Binding Policy retrieve.
    pub async fn account_binding_policy_retrieve(&self) -> Result<SdkWorkResourceResponse, SdkworkError> {
        let path = backend_path(&"/iam/account_binding_policy".to_string());
        self.client.get(&path, None, None).await
    }

    /// Account Binding Policy update.
    pub async fn account_binding_policy_update(&self, body: &std::collections::HashMap<String, serde_json::Value>) -> Result<SdkWorkResourceResponse, SdkworkError> {
        let path = backend_path(&"/iam/account_binding_policy".to_string());
        self.client.patch(&path, Some(body), None, None, Some("application/json")).await
    }

    /// Api Keys list.
    pub async fn api_keys_list(&self, page: Option<i64>, page_size: Option<i64>, cursor: Option<&str>, sort: Option<&str>, q: Option<&str>) -> Result<SdkWorkListResponse, SdkworkError> {
        let query = build_query_string(&[
            QueryParameterSpec::new("page", page, "form", true, false, None),
            QueryParameterSpec::new("page_size", page_size, "form", true, false, None),
            QueryParameterSpec::new("cursor", cursor, "form", true, false, None),
            QueryParameterSpec::new("sort", sort, "form", true, false, None),
            QueryParameterSpec::new("q", q, "form", true, false, None),
        ]);
        let path = append_query_string(backend_path(&"/iam/api_keys".to_string()), &query);
        self.client.get(&path, None, None).await
    }

    /// Api Keys revoke.
    pub async fn api_keys_revoke(&self, api_key_id: &str, body: &std::collections::HashMap<String, serde_json::Value>) -> Result<SdkWorkCommandResponse, SdkworkError> {
        let path = backend_path(&format!("/iam/api_keys/{}/revoke", serialize_path_parameter(api_key_id, PathParameterSpec::new("apiKeyId", "simple", false))));
        self.client.post(&path, Some(body), None, None, Some("application/json")).await
    }

    /// Applications register.
    pub async fn applications_register(&self, body: &AppbaseApplicationRegisterCommand) -> Result<SdkWorkCommandResponse, SdkworkError> {
        let path = backend_path(&"/iam/applications/register".to_string());
        self.client.post(&path, Some(body), None, None, Some("application/json")).await
    }

    /// Audit Events list.
    pub async fn audit_events_list(&self, page: Option<i64>, page_size: Option<i64>, cursor: Option<&str>, sort: Option<&str>, q: Option<&str>) -> Result<SdkWorkListResponse, SdkworkError> {
        let query = build_query_string(&[
            QueryParameterSpec::new("page", page, "form", true, false, None),
            QueryParameterSpec::new("page_size", page_size, "form", true, false, None),
            QueryParameterSpec::new("cursor", cursor, "form", true, false, None),
            QueryParameterSpec::new("sort", sort, "form", true, false, None),
            QueryParameterSpec::new("q", q, "form", true, false, None),
        ]);
        let path = append_query_string(backend_path(&"/iam/audit_events".to_string()), &query);
        self.client.get(&path, None, None).await
    }

    /// Audit Events retrieve.
    pub async fn audit_events_retrieve(&self, audit_event_id: &str) -> Result<SdkWorkResourceResponse, SdkworkError> {
        let path = backend_path(&format!("/iam/audit_events/{}", serialize_path_parameter(audit_event_id, PathParameterSpec::new("auditEventId", "simple", false))));
        self.client.get(&path, None, None).await
    }

    /// Department Assignments list.
    pub async fn department_assignments_list(&self, page: Option<i64>, page_size: Option<i64>, cursor: Option<&str>, sort: Option<&str>, q: Option<&str>) -> Result<SdkWorkListResponse, SdkworkError> {
        let query = build_query_string(&[
            QueryParameterSpec::new("page", page, "form", true, false, None),
            QueryParameterSpec::new("page_size", page_size, "form", true, false, None),
            QueryParameterSpec::new("cursor", cursor, "form", true, false, None),
            QueryParameterSpec::new("sort", sort, "form", true, false, None),
            QueryParameterSpec::new("q", q, "form", true, false, None),
        ]);
        let path = append_query_string(backend_path(&"/iam/department_assignments".to_string()), &query);
        self.client.get(&path, None, None).await
    }

    /// Department Assignments create.
    pub async fn department_assignments_create(&self, body: &std::collections::HashMap<String, serde_json::Value>) -> Result<SdkWorkResourceResponse, SdkworkError> {
        let path = backend_path(&"/iam/department_assignments".to_string());
        self.client.post(&path, Some(body), None, None, Some("application/json")).await
    }

    /// Department Assignments update.
    pub async fn department_assignments_update(&self, assignment_id: &str, body: &std::collections::HashMap<String, serde_json::Value>) -> Result<SdkWorkResourceResponse, SdkworkError> {
        let path = backend_path(&format!("/iam/department_assignments/{}", serialize_path_parameter(assignment_id, PathParameterSpec::new("assignmentId", "simple", false))));
        self.client.patch(&path, Some(body), None, None, Some("application/json")).await
    }

    /// Departments list.
    pub async fn departments_list(&self, page: Option<i64>, page_size: Option<i64>, cursor: Option<&str>, sort: Option<&str>, q: Option<&str>) -> Result<SdkWorkListResponse, SdkworkError> {
        let query = build_query_string(&[
            QueryParameterSpec::new("page", page, "form", true, false, None),
            QueryParameterSpec::new("page_size", page_size, "form", true, false, None),
            QueryParameterSpec::new("cursor", cursor, "form", true, false, None),
            QueryParameterSpec::new("sort", sort, "form", true, false, None),
            QueryParameterSpec::new("q", q, "form", true, false, None),
        ]);
        let path = append_query_string(backend_path(&"/iam/departments".to_string()), &query);
        self.client.get(&path, None, None).await
    }

    /// Departments create.
    pub async fn departments_create(&self, body: &std::collections::HashMap<String, serde_json::Value>) -> Result<SdkWorkResourceResponse, SdkworkError> {
        let path = backend_path(&"/iam/departments".to_string());
        self.client.post(&path, Some(body), None, None, Some("application/json")).await
    }

    /// Departments delete.
    pub async fn departments_delete(&self, department_id: &str) -> Result<(), SdkworkError> {
        let path = backend_path(&format!("/iam/departments/{}", serialize_path_parameter(department_id, PathParameterSpec::new("departmentId", "simple", false))));
        self.client.delete(&path, None, None).await
    }

    /// Departments retrieve.
    pub async fn departments_retrieve(&self, department_id: &str) -> Result<SdkWorkResourceResponse, SdkworkError> {
        let path = backend_path(&format!("/iam/departments/{}", serialize_path_parameter(department_id, PathParameterSpec::new("departmentId", "simple", false))));
        self.client.get(&path, None, None).await
    }

    /// Departments update.
    pub async fn departments_update(&self, department_id: &str, body: &std::collections::HashMap<String, serde_json::Value>) -> Result<SdkWorkResourceResponse, SdkworkError> {
        let path = backend_path(&format!("/iam/departments/{}", serialize_path_parameter(department_id, PathParameterSpec::new("departmentId", "simple", false))));
        self.client.patch(&path, Some(body), None, None, Some("application/json")).await
    }

    /// Departments tree retrieve.
    pub async fn departments_tree_retrieve(&self) -> Result<SdkWorkResourceResponse, SdkworkError> {
        let path = backend_path(&"/iam/departments/tree".to_string());
        self.client.get(&path, None, None).await
    }

    /// Groups list.
    pub async fn groups_list(&self, page: Option<i64>, page_size: Option<i64>, cursor: Option<&str>, sort: Option<&str>, q: Option<&str>) -> Result<SdkWorkListResponse, SdkworkError> {
        let query = build_query_string(&[
            QueryParameterSpec::new("page", page, "form", true, false, None),
            QueryParameterSpec::new("page_size", page_size, "form", true, false, None),
            QueryParameterSpec::new("cursor", cursor, "form", true, false, None),
            QueryParameterSpec::new("sort", sort, "form", true, false, None),
            QueryParameterSpec::new("q", q, "form", true, false, None),
        ]);
        let path = append_query_string(backend_path(&"/iam/groups".to_string()), &query);
        self.client.get(&path, None, None).await
    }

    /// Groups create.
    pub async fn groups_create(&self, body: &std::collections::HashMap<String, serde_json::Value>) -> Result<SdkWorkResourceResponse, SdkworkError> {
        let path = backend_path(&"/iam/groups".to_string());
        self.client.post(&path, Some(body), None, None, Some("application/json")).await
    }

    /// Groups delete.
    pub async fn groups_delete(&self, group_id: &str) -> Result<(), SdkworkError> {
        let path = backend_path(&format!("/iam/groups/{}", serialize_path_parameter(group_id, PathParameterSpec::new("groupId", "simple", false))));
        self.client.delete(&path, None, None).await
    }

    /// Groups retrieve.
    pub async fn groups_retrieve(&self, group_id: &str) -> Result<SdkWorkResourceResponse, SdkworkError> {
        let path = backend_path(&format!("/iam/groups/{}", serialize_path_parameter(group_id, PathParameterSpec::new("groupId", "simple", false))));
        self.client.get(&path, None, None).await
    }

    /// Groups update.
    pub async fn groups_update(&self, group_id: &str, body: &std::collections::HashMap<String, serde_json::Value>) -> Result<SdkWorkResourceResponse, SdkworkError> {
        let path = backend_path(&format!("/iam/groups/{}", serialize_path_parameter(group_id, PathParameterSpec::new("groupId", "simple", false))));
        self.client.patch(&path, Some(body), None, None, Some("application/json")).await
    }

    /// Groups members list.
    pub async fn groups_members_list(&self, group_id: &str, page: Option<i64>, page_size: Option<i64>, cursor: Option<&str>, sort: Option<&str>, q: Option<&str>) -> Result<SdkWorkListResponse, SdkworkError> {
        let query = build_query_string(&[
            QueryParameterSpec::new("page", page, "form", true, false, None),
            QueryParameterSpec::new("page_size", page_size, "form", true, false, None),
            QueryParameterSpec::new("cursor", cursor, "form", true, false, None),
            QueryParameterSpec::new("sort", sort, "form", true, false, None),
            QueryParameterSpec::new("q", q, "form", true, false, None),
        ]);
        let path = append_query_string(backend_path(&format!("/iam/groups/{}/members", serialize_path_parameter(group_id, PathParameterSpec::new("groupId", "simple", false)))), &query);
        self.client.get(&path, None, None).await
    }

    /// Groups members create.
    pub async fn groups_members_create(&self, group_id: &str, body: &std::collections::HashMap<String, serde_json::Value>) -> Result<SdkWorkResourceResponse, SdkworkError> {
        let path = backend_path(&format!("/iam/groups/{}/members", serialize_path_parameter(group_id, PathParameterSpec::new("groupId", "simple", false))));
        self.client.post(&path, Some(body), None, None, Some("application/json")).await
    }

    /// Groups members delete.
    pub async fn groups_members_delete(&self, group_id: &str, member_id: &str) -> Result<(), SdkworkError> {
        let path = backend_path(&format!("/iam/groups/{}/members/{}", serialize_path_parameter(group_id, PathParameterSpec::new("groupId", "simple", false)), serialize_path_parameter(member_id, PathParameterSpec::new("memberId", "simple", false))));
        self.client.delete(&path, None, None).await
    }

    /// Organization Memberships list.
    pub async fn organization_memberships_list(&self, page: Option<i64>, page_size: Option<i64>, cursor: Option<&str>, sort: Option<&str>, q: Option<&str>) -> Result<SdkWorkListResponse, SdkworkError> {
        let query = build_query_string(&[
            QueryParameterSpec::new("page", page, "form", true, false, None),
            QueryParameterSpec::new("page_size", page_size, "form", true, false, None),
            QueryParameterSpec::new("cursor", cursor, "form", true, false, None),
            QueryParameterSpec::new("sort", sort, "form", true, false, None),
            QueryParameterSpec::new("q", q, "form", true, false, None),
        ]);
        let path = append_query_string(backend_path(&"/iam/organization_memberships".to_string()), &query);
        self.client.get(&path, None, None).await
    }

    /// Organization Memberships create.
    pub async fn organization_memberships_create(&self, body: &std::collections::HashMap<String, serde_json::Value>) -> Result<SdkWorkResourceResponse, SdkworkError> {
        let path = backend_path(&"/iam/organization_memberships".to_string());
        self.client.post(&path, Some(body), None, None, Some("application/json")).await
    }

    /// Organization Memberships update.
    pub async fn organization_memberships_update(&self, membership_id: &str, body: &std::collections::HashMap<String, serde_json::Value>) -> Result<SdkWorkResourceResponse, SdkworkError> {
        let path = backend_path(&format!("/iam/organization_memberships/{}", serialize_path_parameter(membership_id, PathParameterSpec::new("membershipId", "simple", false))));
        self.client.patch(&path, Some(body), None, None, Some("application/json")).await
    }

    /// Organizations list.
    pub async fn organizations_list(&self, page: Option<i64>, page_size: Option<i64>, cursor: Option<&str>, sort: Option<&str>, q: Option<&str>) -> Result<SdkWorkListResponse, SdkworkError> {
        let query = build_query_string(&[
            QueryParameterSpec::new("page", page, "form", true, false, None),
            QueryParameterSpec::new("page_size", page_size, "form", true, false, None),
            QueryParameterSpec::new("cursor", cursor, "form", true, false, None),
            QueryParameterSpec::new("sort", sort, "form", true, false, None),
            QueryParameterSpec::new("q", q, "form", true, false, None),
        ]);
        let path = append_query_string(backend_path(&"/iam/organizations".to_string()), &query);
        self.client.get(&path, None, None).await
    }

    /// Organizations create.
    pub async fn organizations_create(&self, body: &std::collections::HashMap<String, serde_json::Value>) -> Result<SdkWorkResourceResponse, SdkworkError> {
        let path = backend_path(&"/iam/organizations".to_string());
        self.client.post(&path, Some(body), None, None, Some("application/json")).await
    }

    /// Organizations delete.
    pub async fn organizations_delete(&self, organization_id: &str) -> Result<(), SdkworkError> {
        let path = backend_path(&format!("/iam/organizations/{}", serialize_path_parameter(organization_id, PathParameterSpec::new("organizationId", "simple", false))));
        self.client.delete(&path, None, None).await
    }

    /// Organizations retrieve.
    pub async fn organizations_retrieve(&self, organization_id: &str) -> Result<SdkWorkResourceResponse, SdkworkError> {
        let path = backend_path(&format!("/iam/organizations/{}", serialize_path_parameter(organization_id, PathParameterSpec::new("organizationId", "simple", false))));
        self.client.get(&path, None, None).await
    }

    /// Organizations update.
    pub async fn organizations_update(&self, organization_id: &str, body: &std::collections::HashMap<String, serde_json::Value>) -> Result<SdkWorkResourceResponse, SdkworkError> {
        let path = backend_path(&format!("/iam/organizations/{}", serialize_path_parameter(organization_id, PathParameterSpec::new("organizationId", "simple", false))));
        self.client.patch(&path, Some(body), None, None, Some("application/json")).await
    }

    /// Organizations tree retrieve.
    pub async fn organizations_tree_retrieve(&self) -> Result<SdkWorkResourceResponse, SdkworkError> {
        let path = backend_path(&"/iam/organizations/tree".to_string());
        self.client.get(&path, None, None).await
    }

    /// Permissions list.
    pub async fn permissions_list(&self, page: Option<i64>, page_size: Option<i64>, cursor: Option<&str>, sort: Option<&str>, q: Option<&str>) -> Result<SdkWorkListResponse, SdkworkError> {
        let query = build_query_string(&[
            QueryParameterSpec::new("page", page, "form", true, false, None),
            QueryParameterSpec::new("page_size", page_size, "form", true, false, None),
            QueryParameterSpec::new("cursor", cursor, "form", true, false, None),
            QueryParameterSpec::new("sort", sort, "form", true, false, None),
            QueryParameterSpec::new("q", q, "form", true, false, None),
        ]);
        let path = append_query_string(backend_path(&"/iam/permissions".to_string()), &query);
        self.client.get(&path, None, None).await
    }

    /// Permissions create.
    pub async fn permissions_create(&self, body: &std::collections::HashMap<String, serde_json::Value>) -> Result<SdkWorkResourceResponse, SdkworkError> {
        let path = backend_path(&"/iam/permissions".to_string());
        self.client.post(&path, Some(body), None, None, Some("application/json")).await
    }

    /// Permissions delete.
    pub async fn permissions_delete(&self, permission_id: &str) -> Result<(), SdkworkError> {
        let path = backend_path(&format!("/iam/permissions/{}", serialize_path_parameter(permission_id, PathParameterSpec::new("permissionId", "simple", false))));
        self.client.delete(&path, None, None).await
    }

    /// Permissions retrieve.
    pub async fn permissions_retrieve(&self, permission_id: &str) -> Result<SdkWorkResourceResponse, SdkworkError> {
        let path = backend_path(&format!("/iam/permissions/{}", serialize_path_parameter(permission_id, PathParameterSpec::new("permissionId", "simple", false))));
        self.client.get(&path, None, None).await
    }

    /// Permissions update.
    pub async fn permissions_update(&self, permission_id: &str, body: &std::collections::HashMap<String, serde_json::Value>) -> Result<SdkWorkResourceResponse, SdkworkError> {
        let path = backend_path(&format!("/iam/permissions/{}", serialize_path_parameter(permission_id, PathParameterSpec::new("permissionId", "simple", false))));
        self.client.patch(&path, Some(body), None, None, Some("application/json")).await
    }

    /// Policies list.
    pub async fn policies_list(&self, page: Option<i64>, page_size: Option<i64>, cursor: Option<&str>, sort: Option<&str>, q: Option<&str>) -> Result<SdkWorkListResponse, SdkworkError> {
        let query = build_query_string(&[
            QueryParameterSpec::new("page", page, "form", true, false, None),
            QueryParameterSpec::new("page_size", page_size, "form", true, false, None),
            QueryParameterSpec::new("cursor", cursor, "form", true, false, None),
            QueryParameterSpec::new("sort", sort, "form", true, false, None),
            QueryParameterSpec::new("q", q, "form", true, false, None),
        ]);
        let path = append_query_string(backend_path(&"/iam/policies".to_string()), &query);
        self.client.get(&path, None, None).await
    }

    /// Policies create.
    pub async fn policies_create(&self, body: &std::collections::HashMap<String, serde_json::Value>) -> Result<SdkWorkResourceResponse, SdkworkError> {
        let path = backend_path(&"/iam/policies".to_string());
        self.client.post(&path, Some(body), None, None, Some("application/json")).await
    }

    /// Policies delete.
    pub async fn policies_delete(&self, policy_id: &str) -> Result<(), SdkworkError> {
        let path = backend_path(&format!("/iam/policies/{}", serialize_path_parameter(policy_id, PathParameterSpec::new("policyId", "simple", false))));
        self.client.delete(&path, None, None).await
    }

    /// Policies retrieve.
    pub async fn policies_retrieve(&self, policy_id: &str) -> Result<SdkWorkResourceResponse, SdkworkError> {
        let path = backend_path(&format!("/iam/policies/{}", serialize_path_parameter(policy_id, PathParameterSpec::new("policyId", "simple", false))));
        self.client.get(&path, None, None).await
    }

    /// Policies update.
    pub async fn policies_update(&self, policy_id: &str, body: &std::collections::HashMap<String, serde_json::Value>) -> Result<SdkWorkResourceResponse, SdkworkError> {
        let path = backend_path(&format!("/iam/policies/{}", serialize_path_parameter(policy_id, PathParameterSpec::new("policyId", "simple", false))));
        self.client.patch(&path, Some(body), None, None, Some("application/json")).await
    }

    /// Position Assignments list.
    pub async fn position_assignments_list(&self, page: Option<i64>, page_size: Option<i64>, cursor: Option<&str>, sort: Option<&str>, q: Option<&str>) -> Result<SdkWorkListResponse, SdkworkError> {
        let query = build_query_string(&[
            QueryParameterSpec::new("page", page, "form", true, false, None),
            QueryParameterSpec::new("page_size", page_size, "form", true, false, None),
            QueryParameterSpec::new("cursor", cursor, "form", true, false, None),
            QueryParameterSpec::new("sort", sort, "form", true, false, None),
            QueryParameterSpec::new("q", q, "form", true, false, None),
        ]);
        let path = append_query_string(backend_path(&"/iam/position_assignments".to_string()), &query);
        self.client.get(&path, None, None).await
    }

    /// Position Assignments create.
    pub async fn position_assignments_create(&self, body: &std::collections::HashMap<String, serde_json::Value>) -> Result<SdkWorkResourceResponse, SdkworkError> {
        let path = backend_path(&"/iam/position_assignments".to_string());
        self.client.post(&path, Some(body), None, None, Some("application/json")).await
    }

    /// Position Assignments update.
    pub async fn position_assignments_update(&self, assignment_id: &str, body: &std::collections::HashMap<String, serde_json::Value>) -> Result<SdkWorkResourceResponse, SdkworkError> {
        let path = backend_path(&format!("/iam/position_assignments/{}", serialize_path_parameter(assignment_id, PathParameterSpec::new("assignmentId", "simple", false))));
        self.client.patch(&path, Some(body), None, None, Some("application/json")).await
    }

    /// Positions list.
    pub async fn positions_list(&self, page: Option<i64>, page_size: Option<i64>, cursor: Option<&str>, sort: Option<&str>, q: Option<&str>) -> Result<SdkWorkListResponse, SdkworkError> {
        let query = build_query_string(&[
            QueryParameterSpec::new("page", page, "form", true, false, None),
            QueryParameterSpec::new("page_size", page_size, "form", true, false, None),
            QueryParameterSpec::new("cursor", cursor, "form", true, false, None),
            QueryParameterSpec::new("sort", sort, "form", true, false, None),
            QueryParameterSpec::new("q", q, "form", true, false, None),
        ]);
        let path = append_query_string(backend_path(&"/iam/positions".to_string()), &query);
        self.client.get(&path, None, None).await
    }

    /// Positions create.
    pub async fn positions_create(&self, body: &std::collections::HashMap<String, serde_json::Value>) -> Result<SdkWorkResourceResponse, SdkworkError> {
        let path = backend_path(&"/iam/positions".to_string());
        self.client.post(&path, Some(body), None, None, Some("application/json")).await
    }

    /// Positions delete.
    pub async fn positions_delete(&self, position_id: &str) -> Result<(), SdkworkError> {
        let path = backend_path(&format!("/iam/positions/{}", serialize_path_parameter(position_id, PathParameterSpec::new("positionId", "simple", false))));
        self.client.delete(&path, None, None).await
    }

    /// Positions update.
    pub async fn positions_update(&self, position_id: &str, body: &std::collections::HashMap<String, serde_json::Value>) -> Result<SdkWorkResourceResponse, SdkworkError> {
        let path = backend_path(&format!("/iam/positions/{}", serialize_path_parameter(position_id, PathParameterSpec::new("positionId", "simple", false))));
        self.client.patch(&path, Some(body), None, None, Some("application/json")).await
    }

    /// Role Bindings list.
    pub async fn role_bindings_list(&self, page: Option<i64>, page_size: Option<i64>, cursor: Option<&str>, sort: Option<&str>, q: Option<&str>) -> Result<SdkWorkListResponse, SdkworkError> {
        let query = build_query_string(&[
            QueryParameterSpec::new("page", page, "form", true, false, None),
            QueryParameterSpec::new("page_size", page_size, "form", true, false, None),
            QueryParameterSpec::new("cursor", cursor, "form", true, false, None),
            QueryParameterSpec::new("sort", sort, "form", true, false, None),
            QueryParameterSpec::new("q", q, "form", true, false, None),
        ]);
        let path = append_query_string(backend_path(&"/iam/role_bindings".to_string()), &query);
        self.client.get(&path, None, None).await
    }

    /// Role Bindings create.
    pub async fn role_bindings_create(&self, body: &std::collections::HashMap<String, serde_json::Value>) -> Result<SdkWorkResourceResponse, SdkworkError> {
        let path = backend_path(&"/iam/role_bindings".to_string());
        self.client.post(&path, Some(body), None, None, Some("application/json")).await
    }

    /// Role Bindings delete.
    pub async fn role_bindings_delete(&self, role_binding_id: &str) -> Result<(), SdkworkError> {
        let path = backend_path(&format!("/iam/role_bindings/{}", serialize_path_parameter(role_binding_id, PathParameterSpec::new("roleBindingId", "simple", false))));
        self.client.delete(&path, None, None).await
    }

    /// Roles list.
    pub async fn roles_list(&self, page: Option<i64>, page_size: Option<i64>, cursor: Option<&str>, sort: Option<&str>, q: Option<&str>) -> Result<SdkWorkListResponse, SdkworkError> {
        let query = build_query_string(&[
            QueryParameterSpec::new("page", page, "form", true, false, None),
            QueryParameterSpec::new("page_size", page_size, "form", true, false, None),
            QueryParameterSpec::new("cursor", cursor, "form", true, false, None),
            QueryParameterSpec::new("sort", sort, "form", true, false, None),
            QueryParameterSpec::new("q", q, "form", true, false, None),
        ]);
        let path = append_query_string(backend_path(&"/iam/roles".to_string()), &query);
        self.client.get(&path, None, None).await
    }

    /// Roles create.
    pub async fn roles_create(&self, body: &std::collections::HashMap<String, serde_json::Value>) -> Result<SdkWorkResourceResponse, SdkworkError> {
        let path = backend_path(&"/iam/roles".to_string());
        self.client.post(&path, Some(body), None, None, Some("application/json")).await
    }

    /// Roles delete.
    pub async fn roles_delete(&self, role_id: &str) -> Result<(), SdkworkError> {
        let path = backend_path(&format!("/iam/roles/{}", serialize_path_parameter(role_id, PathParameterSpec::new("roleId", "simple", false))));
        self.client.delete(&path, None, None).await
    }

    /// Roles retrieve.
    pub async fn roles_retrieve(&self, role_id: &str) -> Result<SdkWorkResourceResponse, SdkworkError> {
        let path = backend_path(&format!("/iam/roles/{}", serialize_path_parameter(role_id, PathParameterSpec::new("roleId", "simple", false))));
        self.client.get(&path, None, None).await
    }

    /// Roles update.
    pub async fn roles_update(&self, role_id: &str, body: &std::collections::HashMap<String, serde_json::Value>) -> Result<SdkWorkResourceResponse, SdkworkError> {
        let path = backend_path(&format!("/iam/roles/{}", serialize_path_parameter(role_id, PathParameterSpec::new("roleId", "simple", false))));
        self.client.patch(&path, Some(body), None, None, Some("application/json")).await
    }

    /// Roles permissions list.
    pub async fn roles_permissions_list(&self, role_id: &str, page: Option<i64>, page_size: Option<i64>, cursor: Option<&str>, sort: Option<&str>, q: Option<&str>) -> Result<SdkWorkListResponse, SdkworkError> {
        let query = build_query_string(&[
            QueryParameterSpec::new("page", page, "form", true, false, None),
            QueryParameterSpec::new("page_size", page_size, "form", true, false, None),
            QueryParameterSpec::new("cursor", cursor, "form", true, false, None),
            QueryParameterSpec::new("sort", sort, "form", true, false, None),
            QueryParameterSpec::new("q", q, "form", true, false, None),
        ]);
        let path = append_query_string(backend_path(&format!("/iam/roles/{}/permissions", serialize_path_parameter(role_id, PathParameterSpec::new("roleId", "simple", false)))), &query);
        self.client.get(&path, None, None).await
    }

    /// Roles permissions create.
    pub async fn roles_permissions_create(&self, role_id: &str, body: &std::collections::HashMap<String, serde_json::Value>) -> Result<SdkWorkResourceResponse, SdkworkError> {
        let path = backend_path(&format!("/iam/roles/{}/permissions", serialize_path_parameter(role_id, PathParameterSpec::new("roleId", "simple", false))));
        self.client.post(&path, Some(body), None, None, Some("application/json")).await
    }

    /// Roles permissions delete.
    pub async fn roles_permissions_delete(&self, role_id: &str, permission_id: &str) -> Result<(), SdkworkError> {
        let path = backend_path(&format!("/iam/roles/{}/permissions/{}", serialize_path_parameter(role_id, PathParameterSpec::new("roleId", "simple", false)), serialize_path_parameter(permission_id, PathParameterSpec::new("permissionId", "simple", false))));
        self.client.delete(&path, None, None).await
    }

    /// Security Events list.
    pub async fn security_events_list(&self, page: Option<i64>, page_size: Option<i64>, cursor: Option<&str>, sort: Option<&str>, q: Option<&str>) -> Result<SdkWorkListResponse, SdkworkError> {
        let query = build_query_string(&[
            QueryParameterSpec::new("page", page, "form", true, false, None),
            QueryParameterSpec::new("page_size", page_size, "form", true, false, None),
            QueryParameterSpec::new("cursor", cursor, "form", true, false, None),
            QueryParameterSpec::new("sort", sort, "form", true, false, None),
            QueryParameterSpec::new("q", q, "form", true, false, None),
        ]);
        let path = append_query_string(backend_path(&"/iam/security_events".to_string()), &query);
        self.client.get(&path, None, None).await
    }

    /// Security Events retrieve.
    pub async fn security_events_retrieve(&self, security_event_id: &str) -> Result<SdkWorkResourceResponse, SdkworkError> {
        let path = backend_path(&format!("/iam/security_events/{}", serialize_path_parameter(security_event_id, PathParameterSpec::new("securityEventId", "simple", false))));
        self.client.get(&path, None, None).await
    }

    /// Service Account Credentials revoke.
    pub async fn service_account_credentials_revoke(&self, credential_id: &str, body: &ServiceAccountCredentialRevokeCommand) -> Result<SdkWorkCommandResponse, SdkworkError> {
        let path = backend_path(&format!("/iam/service_account_credentials/{}/revoke", serialize_path_parameter(credential_id, PathParameterSpec::new("credentialId", "simple", false))));
        self.client.post(&path, Some(body), None, None, Some("application/json")).await
    }

    /// Service Account Tokens create.
    pub async fn service_account_tokens_create(&self, body: &ServiceAccountTokenExchangeCommand) -> Result<SdkWorkResourceResponse, SdkworkError> {
        let path = backend_path(&"/iam/service_account_tokens".to_string());
        self.client.post(&path, Some(body), None, None, Some("application/json")).await
    }

    /// Service Accounts list.
    pub async fn service_accounts_list(&self, page: Option<i64>, page_size: Option<i64>, cursor: Option<&str>, sort: Option<&str>, q: Option<&str>) -> Result<SdkWorkListResponse, SdkworkError> {
        let query = build_query_string(&[
            QueryParameterSpec::new("page", page, "form", true, false, None),
            QueryParameterSpec::new("page_size", page_size, "form", true, false, None),
            QueryParameterSpec::new("cursor", cursor, "form", true, false, None),
            QueryParameterSpec::new("sort", sort, "form", true, false, None),
            QueryParameterSpec::new("q", q, "form", true, false, None),
        ]);
        let path = append_query_string(backend_path(&"/iam/service_accounts".to_string()), &query);
        self.client.get(&path, None, None).await
    }

    /// Service Accounts create.
    pub async fn service_accounts_create(&self, body: &std::collections::HashMap<String, serde_json::Value>) -> Result<SdkWorkResourceResponse, SdkworkError> {
        let path = backend_path(&"/iam/service_accounts".to_string());
        self.client.post(&path, Some(body), None, None, Some("application/json")).await
    }

    /// Service Accounts delete.
    pub async fn service_accounts_delete(&self, service_account_id: &str) -> Result<(), SdkworkError> {
        let path = backend_path(&format!("/iam/service_accounts/{}", serialize_path_parameter(service_account_id, PathParameterSpec::new("serviceAccountId", "simple", false))));
        self.client.delete(&path, None, None).await
    }

    /// Service Accounts retrieve.
    pub async fn service_accounts_retrieve(&self, service_account_id: &str) -> Result<SdkWorkResourceResponse, SdkworkError> {
        let path = backend_path(&format!("/iam/service_accounts/{}", serialize_path_parameter(service_account_id, PathParameterSpec::new("serviceAccountId", "simple", false))));
        self.client.get(&path, None, None).await
    }

    /// Service Accounts update.
    pub async fn service_accounts_update(&self, service_account_id: &str, body: &std::collections::HashMap<String, serde_json::Value>) -> Result<SdkWorkResourceResponse, SdkworkError> {
        let path = backend_path(&format!("/iam/service_accounts/{}", serialize_path_parameter(service_account_id, PathParameterSpec::new("serviceAccountId", "simple", false))));
        self.client.patch(&path, Some(body), None, None, Some("application/json")).await
    }

    /// Service Accounts credentials create.
    pub async fn service_accounts_credentials_create(&self, service_account_id: &str, body: &ServiceAccountCredentialCreateCommand) -> Result<SdkWorkResourceResponse, SdkworkError> {
        let path = backend_path(&format!("/iam/service_accounts/{}/credentials", serialize_path_parameter(service_account_id, PathParameterSpec::new("serviceAccountId", "simple", false))));
        self.client.post(&path, Some(body), None, None, Some("application/json")).await
    }

    /// Tenant Applications create.
    pub async fn tenant_applications_create(&self, body: &AppbaseTenantApplicationProvisionCommand) -> Result<SdkWorkResourceResponse, SdkworkError> {
        let path = backend_path(&"/iam/tenant_applications".to_string());
        self.client.post(&path, Some(body), None, None, Some("application/json")).await
    }

    /// Tenant Applications retrieve.
    pub async fn tenant_applications_retrieve(&self, tenant_application_id: &str) -> Result<SdkWorkResourceResponse, SdkworkError> {
        let path = backend_path(&format!("/iam/tenant_applications/{}", serialize_path_parameter(tenant_application_id, PathParameterSpec::new("tenantApplicationId", "simple", false))));
        self.client.get(&path, None, None).await
    }

    /// Tenant Applications update.
    pub async fn tenant_applications_update(&self, tenant_application_id: &str, body: &AppbaseTenantApplicationUpdateCommand) -> Result<SdkWorkResourceResponse, SdkworkError> {
        let path = backend_path(&format!("/iam/tenant_applications/{}", serialize_path_parameter(tenant_application_id, PathParameterSpec::new("tenantApplicationId", "simple", false))));
        self.client.patch(&path, Some(body), None, None, Some("application/json")).await
    }

    /// Tenant Applications enable.
    pub async fn tenant_applications_enable(&self, tenant_application_id: &str, body: &AppbaseTenantApplicationEnableCommand) -> Result<SdkWorkCommandResponse, SdkworkError> {
        let path = backend_path(&format!("/iam/tenant_applications/{}/enable", serialize_path_parameter(tenant_application_id, PathParameterSpec::new("tenantApplicationId", "simple", false))));
        self.client.post(&path, Some(body), None, None, Some("application/json")).await
    }

    /// Tenants list.
    pub async fn tenants_list(&self, page: Option<i64>, page_size: Option<i64>, cursor: Option<&str>, sort: Option<&str>, q: Option<&str>) -> Result<SdkWorkListResponse, SdkworkError> {
        let query = build_query_string(&[
            QueryParameterSpec::new("page", page, "form", true, false, None),
            QueryParameterSpec::new("page_size", page_size, "form", true, false, None),
            QueryParameterSpec::new("cursor", cursor, "form", true, false, None),
            QueryParameterSpec::new("sort", sort, "form", true, false, None),
            QueryParameterSpec::new("q", q, "form", true, false, None),
        ]);
        let path = append_query_string(backend_path(&"/iam/tenants".to_string()), &query);
        self.client.get(&path, None, None).await
    }

    /// Tenants create.
    pub async fn tenants_create(&self, body: &std::collections::HashMap<String, serde_json::Value>) -> Result<SdkWorkResourceResponse, SdkworkError> {
        let path = backend_path(&"/iam/tenants".to_string());
        self.client.post(&path, Some(body), None, None, Some("application/json")).await
    }

    /// Tenants delete.
    pub async fn tenants_delete(&self, tenant_id: &str) -> Result<(), SdkworkError> {
        let path = backend_path(&format!("/iam/tenants/{}", serialize_path_parameter(tenant_id, PathParameterSpec::new("tenantId", "simple", false))));
        self.client.delete(&path, None, None).await
    }

    /// Tenants retrieve.
    pub async fn tenants_retrieve(&self, tenant_id: &str) -> Result<SdkWorkResourceResponse, SdkworkError> {
        let path = backend_path(&format!("/iam/tenants/{}", serialize_path_parameter(tenant_id, PathParameterSpec::new("tenantId", "simple", false))));
        self.client.get(&path, None, None).await
    }

    /// Tenants update.
    pub async fn tenants_update(&self, tenant_id: &str, body: &std::collections::HashMap<String, serde_json::Value>) -> Result<SdkWorkResourceResponse, SdkworkError> {
        let path = backend_path(&format!("/iam/tenants/{}", serialize_path_parameter(tenant_id, PathParameterSpec::new("tenantId", "simple", false))));
        self.client.patch(&path, Some(body), None, None, Some("application/json")).await
    }

    /// Tenants members list.
    pub async fn tenants_members_list(&self, tenant_id: &str, page: Option<i64>, page_size: Option<i64>, cursor: Option<&str>, sort: Option<&str>, q: Option<&str>) -> Result<SdkWorkListResponse, SdkworkError> {
        let query = build_query_string(&[
            QueryParameterSpec::new("page", page, "form", true, false, None),
            QueryParameterSpec::new("page_size", page_size, "form", true, false, None),
            QueryParameterSpec::new("cursor", cursor, "form", true, false, None),
            QueryParameterSpec::new("sort", sort, "form", true, false, None),
            QueryParameterSpec::new("q", q, "form", true, false, None),
        ]);
        let path = append_query_string(backend_path(&format!("/iam/tenants/{}/members", serialize_path_parameter(tenant_id, PathParameterSpec::new("tenantId", "simple", false)))), &query);
        self.client.get(&path, None, None).await
    }

    /// Tenants members create.
    pub async fn tenants_members_create(&self, tenant_id: &str, body: &std::collections::HashMap<String, serde_json::Value>) -> Result<SdkWorkResourceResponse, SdkworkError> {
        let path = backend_path(&format!("/iam/tenants/{}/members", serialize_path_parameter(tenant_id, PathParameterSpec::new("tenantId", "simple", false))));
        self.client.post(&path, Some(body), None, None, Some("application/json")).await
    }

    /// Tenants members delete.
    pub async fn tenants_members_delete(&self, tenant_id: &str, user_id: &str) -> Result<(), SdkworkError> {
        let path = backend_path(&format!("/iam/tenants/{}/members/{}", serialize_path_parameter(tenant_id, PathParameterSpec::new("tenantId", "simple", false)), serialize_path_parameter(user_id, PathParameterSpec::new("userId", "simple", false))));
        self.client.delete(&path, None, None).await
    }

    /// Tenants members update.
    pub async fn tenants_members_update(&self, tenant_id: &str, user_id: &str, body: &std::collections::HashMap<String, serde_json::Value>) -> Result<SdkWorkResourceResponse, SdkworkError> {
        let path = backend_path(&format!("/iam/tenants/{}/members/{}", serialize_path_parameter(tenant_id, PathParameterSpec::new("tenantId", "simple", false)), serialize_path_parameter(user_id, PathParameterSpec::new("userId", "simple", false))));
        self.client.patch(&path, Some(body), None, None, Some("application/json")).await
    }

    /// Users list.
    pub async fn users_list(&self, page: Option<i64>, page_size: Option<i64>, cursor: Option<&str>, sort: Option<&str>, q: Option<&str>) -> Result<SdkWorkListResponse, SdkworkError> {
        let query = build_query_string(&[
            QueryParameterSpec::new("page", page, "form", true, false, None),
            QueryParameterSpec::new("page_size", page_size, "form", true, false, None),
            QueryParameterSpec::new("cursor", cursor, "form", true, false, None),
            QueryParameterSpec::new("sort", sort, "form", true, false, None),
            QueryParameterSpec::new("q", q, "form", true, false, None),
        ]);
        let path = append_query_string(backend_path(&"/iam/users".to_string()), &query);
        self.client.get(&path, None, None).await
    }

    /// Users create.
    pub async fn users_create(&self, body: &std::collections::HashMap<String, serde_json::Value>) -> Result<SdkWorkResourceResponse, SdkworkError> {
        let path = backend_path(&"/iam/users".to_string());
        self.client.post(&path, Some(body), None, None, Some("application/json")).await
    }

    /// Users delete.
    pub async fn users_delete(&self, user_id: &str) -> Result<(), SdkworkError> {
        let path = backend_path(&format!("/iam/users/{}", serialize_path_parameter(user_id, PathParameterSpec::new("userId", "simple", false))));
        self.client.delete(&path, None, None).await
    }

    /// Users retrieve.
    pub async fn users_retrieve(&self, user_id: &str) -> Result<SdkWorkResourceResponse, SdkworkError> {
        let path = backend_path(&format!("/iam/users/{}", serialize_path_parameter(user_id, PathParameterSpec::new("userId", "simple", false))));
        self.client.get(&path, None, None).await
    }

    /// Users update.
    pub async fn users_update(&self, user_id: &str, body: &std::collections::HashMap<String, serde_json::Value>) -> Result<SdkWorkResourceResponse, SdkworkError> {
        let path = backend_path(&format!("/iam/users/{}", serialize_path_parameter(user_id, PathParameterSpec::new("userId", "simple", false))));
        self.client.patch(&path, Some(body), None, None, Some("application/json")).await
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
