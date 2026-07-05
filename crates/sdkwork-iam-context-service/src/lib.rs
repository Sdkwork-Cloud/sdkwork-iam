pub mod permission_standard;

use sdkwork_utils_rust::is_blank;

pub use permission_standard::{
    expand_permission_patterns, has_permission_in_scope, is_standard_role_code, permission_matches,
    IamRoleSurface, IamStandardRoleDefinition, IamUserSurface, APP_USER_ROLE_CODE,
    IAM_STANDARD_ROLE_CODES, IAM_STANDARD_ROLE_DEFINITIONS, LEGACY_OWNER_ROLE_CODE,
    ORG_ADMIN_ROLE_CODE, ORG_ASSISTANT_ROLE_CODE, ORG_AUDITOR_ROLE_CODE, ORG_FINANCE_ROLE_CODE,
    ORG_OPERATIONS_ROLE_CODE, PLATFORM_SUPER_ADMIN_ROLE_CODE, PLATFORM_SYSTEM_ADMIN_ROLE_CODE,
};

/// Sentinel organization id for platform (personal) login — not a selectable organization.
pub const PLATFORM_ORGANIZATION_ID: &str = "0";

/// Returns true when `value` is the platform personal-login sentinel (`"0"`).
pub fn is_platform_organization_id(value: &str) -> bool {
    value.trim() == PLATFORM_ORGANIZATION_ID
}

/// Normalizes login/session organization input: blank and `"0"` mean platform personal context.
pub fn normalize_login_organization_id(organization_id: Option<&str>) -> Option<String> {
    normalize_organization_id(organization_id)
}

/// Serializes organization id for API responses and JWT claims.
pub fn serialize_session_organization_id(
    organization_id: Option<&str>,
    login_scope: &LoginScope,
) -> String {
    if login_scope == &LoginScope::Tenant {
        return PLATFORM_ORGANIZATION_ID.to_owned();
    }

    organization_id
        .filter(|value| !is_blank(Some(value)) && !is_platform_organization_id(value))
        .map(str::to_string)
        .unwrap_or_else(|| PLATFORM_ORGANIZATION_ID.to_owned())
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub enum Environment {
    Dev,
    Test,
    Prod,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub enum DeploymentMode {
    Saas,
    Local,
    Private,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub enum AuthLevel {
    Anonymous,
    Password,
    Mfa,
    System,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub enum IamShardingStrategy {
    Tenant,
    Organization,
    User,
    Single,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub enum LoginScope {
    Tenant,
    Organization,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct IamAppContext {
    pub tenant_id: String,
    pub organization_id: Option<String>,
    pub login_scope: LoginScope,
    pub user_id: String,
    pub session_id: String,
    pub app_id: String,
    pub environment: Environment,
    pub deployment_mode: DeploymentMode,
    pub auth_level: AuthLevel,
    pub data_scope: Vec<String>,
    pub permission_scope: Vec<String>,
    pub user_surface: IamUserSurface,
    pub standard_role_codes: Vec<String>,
    pub display_name: String,
    pub email: String,
    pub email_verified: bool,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct IamShardingContext {
    pub sharding_key: String,
    pub sharding_strategy: IamShardingStrategy,
    pub database_key: Option<String>,
    pub schema: Option<String>,
    pub table_partition: Option<String>,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct IamSessionTokens {
    pub access_token: String,
    pub auth_token: String,
    pub refresh_token: Option<String>,
    pub context: IamAppContext,
}

impl IamAppContext {
    #[allow(clippy::too_many_arguments)]
    pub fn new(
        tenant_id: impl Into<String>,
        organization_id: Option<&str>,
        user_id: impl Into<String>,
        session_id: impl Into<String>,
        app_id: impl Into<String>,
        environment: Environment,
        deployment_mode: DeploymentMode,
        auth_level: AuthLevel,
        data_scope: Vec<String>,
        permission_scope: Vec<String>,
    ) -> Self {
        let organization_id = normalize_organization_id(organization_id);
        let login_scope = if organization_id.is_some() {
            LoginScope::Organization
        } else {
            LoginScope::Tenant
        };

        let user_surface = IamUserSurface {
            app: true,
            organization_member: organization_id.is_some(),
        };

        Self {
            tenant_id: tenant_id.into(),
            organization_id,
            login_scope,
            user_id: user_id.into(),
            session_id: session_id.into(),
            app_id: app_id.into(),
            environment,
            deployment_mode,
            auth_level,
            data_scope,
            permission_scope,
            user_surface,
            standard_role_codes: Vec::new(),
            display_name: String::new(),
            email: String::new(),
            email_verified: false,
        }
    }

    pub fn apply_user_profile(
        &mut self,
        display_name: impl Into<String>,
        email: impl Into<String>,
        email_verified: bool,
    ) {
        self.display_name = display_name.into();
        self.email = email.into();
        self.email_verified = email_verified;
    }

    pub fn has_permission(&self, required: &str) -> bool {
        has_permission_in_scope(&self.permission_scope, required)
    }

    pub fn can_access_backend_api(&self) -> bool {
        self.user_surface.can_access_backend_api()
    }
}

impl IamShardingContext {
    pub fn from_app_context(context: &IamAppContext) -> Self {
        if context.login_scope == LoginScope::Organization {
            if let Some(organization_id) = context.organization_id.as_ref() {
                if !is_blank(Some(organization_id)) {
                    return Self {
                        sharding_key: organization_id.clone(),
                        sharding_strategy: IamShardingStrategy::Organization,
                        database_key: None,
                        schema: None,
                        table_partition: None,
                    };
                }
            }
        }

        if !is_blank(Some(context.tenant_id.as_str())) {
            return Self {
                sharding_key: context.tenant_id.clone(),
                sharding_strategy: IamShardingStrategy::Tenant,
                database_key: None,
                schema: None,
                table_partition: None,
            };
        }

        if !is_blank(Some(context.user_id.as_str())) {
            return Self {
                sharding_key: context.user_id.clone(),
                sharding_strategy: IamShardingStrategy::User,
                database_key: None,
                schema: None,
                table_partition: None,
            };
        }

        Self {
            sharding_key: context.app_id.clone(),
            sharding_strategy: IamShardingStrategy::Single,
            database_key: None,
            schema: None,
            table_partition: None,
        }
    }
}

pub fn validate_dual_token_context(
    tokens: &IamSessionTokens,
    request_context: &IamAppContext,
) -> Result<(), &'static str> {
    if is_blank(Some(tokens.auth_token.as_str())) {
        return Err("auth token is required");
    }

    if is_blank(Some(tokens.access_token.as_str())) {
        return Err("access token is required");
    }

    if &tokens.context != request_context {
        return Err("access token context does not match request context");
    }

    Ok(())
}

fn normalize_organization_id(organization_id: Option<&str>) -> Option<String> {
    organization_id.and_then(|value| {
        let trimmed = value.trim();
        if is_blank(Some(trimmed)) || trimmed == "0" {
            None
        } else {
            Some(trimmed.to_owned())
        }
    })
}
