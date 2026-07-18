#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct IamTables;

impl IamTables {
    pub const TENANT: &'static str = "iam_tenant";
    pub const TENANT_MEMBER: &'static str = "iam_tenant_member";
    pub const TENANT_SIGNING_KEY: &'static str = "iam_tenant_signing_key";
    pub const ORGANIZATION: &'static str = "iam_organization";
    pub const ORGANIZATION_CLOSURE: &'static str = "iam_organization_closure";
    pub const ORGANIZATION_MEMBERSHIP: &'static str = "iam_organization_membership";
    pub const DEPARTMENT: &'static str = "iam_department";
    pub const DEPARTMENT_CLOSURE: &'static str = "iam_department_closure";
    pub const DEPARTMENT_ASSIGNMENT: &'static str = "iam_department_assignment";
    pub const POSITION: &'static str = "iam_position";
    pub const POSITION_ASSIGNMENT: &'static str = "iam_position_assignment";
    pub const USER: &'static str = "iam_user";
    pub const USER_IDENTITY: &'static str = "iam_user_identity";
    pub const CREDENTIAL: &'static str = "iam_credential";
    pub const PASSWORD_HISTORY: &'static str = "iam_password_history";
    pub const SESSION: &'static str = "iam_session";
    pub const MFA_FACTOR: &'static str = "iam_mfa_factor";
    pub const DEVICE: &'static str = "iam_device";
    pub const ROLE: &'static str = "iam_role";
    pub const ROLE_BINDING: &'static str = "iam_role_binding";
    pub const PERMISSION: &'static str = "iam_permission";
    pub const POLICY: &'static str = "iam_policy";
    pub const ROLE_PERMISSION: &'static str = "iam_role_permission";
    pub const API_KEY: &'static str = "iam_api_key";
    pub const SECURITY_EVENT: &'static str = "iam_security_event";
    pub const AUDIT_EVENT: &'static str = "iam_audit_event";
    pub const OAUTH_PROVIDER_CATALOG: &'static str = "iam_oauth_provider_catalog";
    pub const OAUTH_INTEGRATION: &'static str = "iam_oauth_integration";
    pub const OAUTH_CLIENT: &'static str = "iam_oauth_client";
    pub const OAUTH_SECRET: &'static str = "iam_oauth_secret";
    pub const OAUTH_SURFACE: &'static str = "iam_oauth_surface";
    pub const OAUTH_FLOW_CONFIG: &'static str = "iam_oauth_flow_config";
    pub const OAUTH_SCOPE_PROFILE: &'static str = "iam_oauth_scope_profile";
    pub const OAUTH_CLAIM_MAPPING: &'static str = "iam_oauth_claim_mapping";
    pub const OAUTH_POLICY: &'static str = "iam_oauth_policy";
    pub const OAUTH_TENANT_BINDING: &'static str = "iam_oauth_tenant_binding";
    pub const OAUTH_OPERATOR_PLATFORM: &'static str = "iam_oauth_operator_platform";
    pub const OAUTH_RESOURCE_ACCOUNT: &'static str = "iam_oauth_resource_account";
    pub const OAUTH_RESOURCE_AUTHORIZATION: &'static str = "iam_oauth_resource_authorization";
    pub const OAUTH_WEBHOOK_CONFIG: &'static str = "iam_oauth_webhook_config";
    pub const OAUTH_OPERATIONAL_RESOURCE: &'static str = "iam_oauth_operational_resource";
    pub const OAUTH_AUTHORIZATION_STATE: &'static str = "iam_oauth_authorization_state";
    pub const OAUTH_ACCOUNT_LINK: &'static str = "iam_oauth_account_link";
    pub const OAUTH_GRANT: &'static str = "iam_oauth_grant";
    pub const OAUTH_CALLBACK_EVENT: &'static str = "iam_oauth_callback_event";
    pub const OAUTH_DIAGNOSTIC_RUN: &'static str = "iam_oauth_diagnostic_run";
    pub const EPHEMERAL_ARTIFACT: &'static str = "iam_ephemeral_artifact";
    pub const APPLICATION_TEMPLATE: &'static str = "iam_application_template";
    pub const APPLICATION_TEMPLATE_PACKAGE: &'static str = "iam_application_template_package";
    pub const TENANT_APPLICATION: &'static str = "iam_tenant_application";
    pub const MODULE_REGISTRY_ENTRY: &'static str = "iam_module_registry_entry";
    pub const MODULE_REGISTRY_SNAPSHOT: &'static str = "iam_module_registry_snapshot";
    pub const CATALOG_MATERIALIZATION: &'static str = "iam_catalog_materialization";
    pub const GROUP: &'static str = "iam_group";
    pub const GROUP_MEMBER: &'static str = "iam_group_member";
    pub const SERVICE_ACCOUNT: &'static str = "iam_service_account";
    pub const SERVICE_ACCOUNT_CREDENTIAL: &'static str = "iam_service_account_credential";
    pub const ROLE_EXCLUSION: &'static str = "iam_role_exclusion";
}

pub fn iam_database_tables() -> Vec<&'static str> {
    vec![
        IamTables::TENANT,
        IamTables::TENANT_MEMBER,
        IamTables::TENANT_SIGNING_KEY,
        IamTables::ORGANIZATION,
        IamTables::ORGANIZATION_CLOSURE,
        IamTables::ORGANIZATION_MEMBERSHIP,
        IamTables::DEPARTMENT,
        IamTables::DEPARTMENT_CLOSURE,
        IamTables::DEPARTMENT_ASSIGNMENT,
        IamTables::POSITION,
        IamTables::POSITION_ASSIGNMENT,
        IamTables::USER,
        IamTables::USER_IDENTITY,
        IamTables::CREDENTIAL,
        IamTables::PASSWORD_HISTORY,
        IamTables::SESSION,
        IamTables::MFA_FACTOR,
        IamTables::DEVICE,
        IamTables::ROLE,
        IamTables::ROLE_BINDING,
        IamTables::PERMISSION,
        IamTables::POLICY,
        IamTables::ROLE_PERMISSION,
        IamTables::API_KEY,
        IamTables::SECURITY_EVENT,
        IamTables::AUDIT_EVENT,
        IamTables::OAUTH_PROVIDER_CATALOG,
        IamTables::OAUTH_INTEGRATION,
        IamTables::OAUTH_CLIENT,
        IamTables::OAUTH_SECRET,
        IamTables::OAUTH_SURFACE,
        IamTables::OAUTH_FLOW_CONFIG,
        IamTables::OAUTH_SCOPE_PROFILE,
        IamTables::OAUTH_CLAIM_MAPPING,
        IamTables::OAUTH_POLICY,
        IamTables::OAUTH_TENANT_BINDING,
        IamTables::OAUTH_OPERATOR_PLATFORM,
        IamTables::OAUTH_RESOURCE_ACCOUNT,
        IamTables::OAUTH_RESOURCE_AUTHORIZATION,
        IamTables::OAUTH_WEBHOOK_CONFIG,
        IamTables::OAUTH_OPERATIONAL_RESOURCE,
        IamTables::OAUTH_AUTHORIZATION_STATE,
        IamTables::OAUTH_ACCOUNT_LINK,
        IamTables::OAUTH_GRANT,
        IamTables::OAUTH_CALLBACK_EVENT,
        IamTables::OAUTH_DIAGNOSTIC_RUN,
        IamTables::EPHEMERAL_ARTIFACT,
        IamTables::APPLICATION_TEMPLATE,
        IamTables::APPLICATION_TEMPLATE_PACKAGE,
        IamTables::TENANT_APPLICATION,
        IamTables::MODULE_REGISTRY_ENTRY,
        IamTables::MODULE_REGISTRY_SNAPSHOT,
        IamTables::CATALOG_MATERIALIZATION,
        IamTables::GROUP,
        IamTables::GROUP_MEMBER,
        IamTables::SERVICE_ACCOUNT,
        IamTables::SERVICE_ACCOUNT_CREDENTIAL,
        IamTables::ROLE_EXCLUSION,
    ]
}

/// Authoritative IAM PostgreSQL baseline DDL from application-root `database/ddl/baseline/postgres/`.
pub fn iam_database_baseline_sql() -> &'static str {
    include_str!("../../../database/ddl/baseline/postgres/0001_iam_baseline.sql")
}
