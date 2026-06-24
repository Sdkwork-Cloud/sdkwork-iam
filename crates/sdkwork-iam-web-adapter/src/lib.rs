mod access_token_issue;
mod account_binding_policy;
mod api_key_lookup;
mod application_registry;
mod authorization_policy;
mod dev_runtime;
mod ephemeral_rate_limit;
mod iam_session;
mod oauth_integration_exchange;
mod oauth_login_local;
mod oauth_provider_catalog;
mod oauth_redirect;
mod oauth_token_lookup;
mod resolver;
mod signing_secrets;
mod super_admin_auth;

pub(crate) use sdkwork_utils_rust::is_blank;

use sdkwork_iam_context_service::IamAppContext;
use sdkwork_web_core::{
    HttpRouteManifest, WebAuthLevel, WebDeploymentMode, WebEnvironment, WebRequestContext,
    WebRequestContextProfile, WebRequestPrincipal,
};

pub use access_token_issue::{
    issue_delegated_access_credential, issued_access_credential_to_json,
    parse_access_credential_create_request, principal_has_permission, resolve_runtime_app_id,
    AccessCredentialCreateRequest, IssuedAccessCredential,
    IAM_ACCESS_CREDENTIALS_CREATE_PERMISSION,
};
pub use account_binding_policy::{
    account_binding_policy_to_json, contact_binding_allowed, default_account_binding_policy,
    load_account_binding_policy, merge_account_binding_policy, oauth_binding_allowed,
    oauth_login_allowed, parse_account_binding_policy, save_account_binding_policy,
    AccountBindingPolicyDocument, AccountBindingPolicyOverrides, ContactBindingActionKind,
    ContactBindingPolicy, OauthBindingActionKind, OauthBindingPolicy, OauthLoginPolicy,
    IAM_ACCOUNT_BINDING_POLICY_CODE,
};
pub use api_key_lookup::IamApiKeyLookupService;
pub use application_registry::{
    enable_tenant_application, ensure_platform_tenant_application, intersect_permission_scopes,
    parse_application_register_command, parse_tenant_application_provision_command,
    parse_tenant_application_update_command, platform_runtime_app_id_for_tenant,
    provision_tenant_application, register_application_template,
    registered_application_template_to_json, resolve_tenant_application,
    tenant_application_to_json, update_tenant_application, validate_enabled_tenant_runtime_app,
    ApplicationPackageSyncCommand, ApplicationRegisterCommand, RegisteredApplicationTemplate,
    TenantApplication, TenantApplicationProvisionCommand, TenantApplicationUpdateCommand,
    IAM_APPLICATIONS_REGISTER_PERMISSION, IAM_TENANT_APPLICATIONS_ENABLE_PERMISSION,
    IAM_TENANT_APPLICATIONS_PROVISION_PERMISSION, IAM_TENANT_APPLICATIONS_UPDATE_PERMISSION,
    PLATFORM_APPLICATION_KEY, PLATFORM_APPLICATION_TEMPLATE_ID,
};
pub use authorization_policy::IamAuthorizationPolicy;
pub use dev_runtime::allows_dev_authentication_fallback;
pub use ephemeral_rate_limit::{check_rate_limit, check_rate_limit_sqlite};
pub use iam_session::{
    resolve_iam_app_context_from_access_token, resolve_iam_app_context_from_auth_token,
    resolve_iam_app_context_from_dual_tokens, resolve_iam_app_context_from_oauth_bearer,
};
pub use oauth_integration_exchange::{
    builtin_authorization_endpoint, builtin_default_scopes, builtin_token_endpoint,
    builtin_userinfo_endpoint, exchange_oauth_authorization_code,
    load_oauth_integration_exchange_context, seed_builtin_oauth_provider_catalog,
    OAuthIntegrationExchangeContext,
};
pub use oauth_login_local::{LocalOAuthAuthority, LocalOAuthProviderProfile};
pub use oauth_provider_catalog::{
    builtin_oauth_provider_catalog, catalog_entry_for_provider, normalize_oauth_provider_code,
    oauth_provider_allowed, provider_catalog_entry_to_json, OauthProviderCatalogEntry,
    OauthProviderRegionGroup,
};
pub use oauth_redirect::{
    load_oauth_redirect_policy, validate_oauth_redirect_uri,
    validate_oauth_redirect_uri_for_provider,
};
pub use oauth_token_lookup::IamOAuthTokenLookupService;
pub use resolver::{
    web_request_principal_from_iam, IamDatabaseWebRequestContextResolver,
    IamOpenApiWebRequestContextResolver,
};
pub use signing_secrets::{
    decode_signing_secret_ref, encode_signing_secret_ref, prime_signing_master_secret,
};
pub use super_admin_auth::{
    allows_automatic_super_admin_auth, ensure_actor_tenant_scope, ensure_bootstrap_permission,
    ensure_super_admin_sync_actor, resolve_access_token_actor, resolve_bootstrap_actor,
    AccessTokenActor, SDKWORK_IAM_BOOTSTRAP_PASSWORD_ENV, SDKWORK_IAM_SUPER_ADMIN_PASSWORD_ENV,
    SDKWORK_SUPER_ADMIN_PROFILE_ENV, SDKWORK_USERS_DIR_ENV,
};

pub fn iam_app_context_from_web_request(context: &WebRequestContext) -> Option<IamAppContext> {
    context
        .principal
        .as_ref()
        .map(iam_app_context_from_web_principal)
}

pub fn iam_app_context_from_web_principal(principal: &WebRequestPrincipal) -> IamAppContext {
    use sdkwork_iam_context_service::{AuthLevel, DeploymentMode, Environment};
    IamAppContext::new(
        principal.tenant_id().to_owned(),
        principal.organization_id(),
        principal.user_id().to_owned(),
        principal
            .session_id()
            .map(str::to_owned)
            .unwrap_or_else(|| format!("{}:{}", principal.app_id(), principal.user_id())),
        principal.app_id().to_owned(),
        match principal.app.environment {
            WebEnvironment::Dev => Environment::Dev,
            WebEnvironment::Test => Environment::Test,
            WebEnvironment::Prod => Environment::Prod,
        },
        match principal.app.deployment_mode {
            WebDeploymentMode::Saas => DeploymentMode::Saas,
            WebDeploymentMode::Local => DeploymentMode::Local,
            WebDeploymentMode::Private => DeploymentMode::Private,
        },
        match principal.auth.auth_level {
            WebAuthLevel::Anonymous => AuthLevel::Anonymous,
            WebAuthLevel::Password => AuthLevel::Password,
            WebAuthLevel::Mfa => AuthLevel::Mfa,
            WebAuthLevel::System | WebAuthLevel::ApiKey => AuthLevel::System,
        },
        principal.scopes.data_scope.clone(),
        principal.scopes.permission_scope.clone(),
    )
}

#[derive(Clone, Default)]
pub struct IamAppContextInjector;

impl sdkwork_web_core::DomainContextInjector for IamAppContextInjector {
    fn inject(&self, request: &mut axum::extract::Request, context: &WebRequestContext) {
        if let Some(iam_context) = iam_app_context_from_web_request(context) {
            request.extensions_mut().insert(iam_context);
        }
    }
}

/// Builds the IAM app-api web framework layer.
///
/// Public routes are resolved from `route_manifest` (`RouteAuth::Public`).
/// `extra_public_path_prefixes` is for product infra paths only (`/health`, system metadata, etc.).
pub fn build_web_framework_layer<R>(
    resolver: R,
    route_manifest: HttpRouteManifest,
    extra_public_path_prefixes: Vec<String>,
) -> sdkwork_web_axum::WebFrameworkLayer<R>
where
    R: sdkwork_web_core::WebRequestContextResolver + Clone,
{
    let authorization_policy = std::sync::Arc::new(IamAuthorizationPolicy::new(route_manifest));
    sdkwork_web_axum::WebFrameworkLayer::new(resolver)
        .with_profile(WebRequestContextProfile {
            public_path_prefixes: extra_public_path_prefixes,
            ..WebRequestContextProfile::default()
        })
        .with_route_manifest(route_manifest)
        .with_authorization_policy(authorization_policy)
        .with_domain_injector(std::sync::Arc::new(IamAppContextInjector))
}

pub fn build_iam_app_web_framework_layer(
    resolver: IamDatabaseWebRequestContextResolver,
    route_manifest: HttpRouteManifest,
) -> sdkwork_web_axum::WebFrameworkLayer<IamDatabaseWebRequestContextResolver> {
    build_web_framework_layer(resolver, route_manifest, Vec::new())
}

pub fn wrap_router_with_iam_app_web_framework(
    router: axum::Router,
    resolver: IamDatabaseWebRequestContextResolver,
    route_manifest: HttpRouteManifest,
) -> axum::Router {
    wrap_router_with_iam_app_web_framework_resolver(router, resolver, route_manifest)
}

pub fn wrap_router_with_iam_app_web_framework_resolver<R>(
    router: axum::Router,
    resolver: R,
    route_manifest: HttpRouteManifest,
) -> axum::Router
where
    R: sdkwork_web_core::WebRequestContextResolver + Clone + Send + Sync + 'static,
{
    sdkwork_web_axum::with_web_request_context(
        router,
        build_web_framework_layer(resolver, route_manifest, Vec::new()),
    )
}

pub async fn wrap_router_with_iam_backend_web_framework_from_env(
    router: axum::Router,
    route_manifest: HttpRouteManifest,
) -> axum::Router {
    let resolver = iam_database_resolver_from_env().await;
    wrap_router_with_iam_backend_web_framework(router, resolver, route_manifest)
}

/// Backend-api routes are dual-token protected; no public IAM prefixes on this surface.
pub fn build_iam_backend_web_framework_layer(
    resolver: IamDatabaseWebRequestContextResolver,
    route_manifest: HttpRouteManifest,
) -> sdkwork_web_axum::WebFrameworkLayer<IamDatabaseWebRequestContextResolver> {
    build_web_framework_layer(resolver, route_manifest, Vec::new())
}

/// Open-api IAM ingress lives under `/iam/v3/api` with header-driven API key or OAuth bearer auth.
pub fn build_iam_open_api_web_framework_layer(
    resolver: IamDatabaseWebRequestContextResolver,
    route_manifest: HttpRouteManifest,
) -> sdkwork_web_axum::WebFrameworkLayer<IamDatabaseWebRequestContextResolver> {
    let authorization_policy = std::sync::Arc::new(IamAuthorizationPolicy::new(route_manifest));
    sdkwork_web_axum::WebFrameworkLayer::new(resolver)
        .with_profile(WebRequestContextProfile {
            open_api_prefixes: vec!["/iam/v3/api".to_owned()],
            public_path_prefixes: Vec::new(),
            ..WebRequestContextProfile::default()
        })
        .with_route_manifest(route_manifest)
        .with_authorization_policy(authorization_policy)
        .with_domain_injector(std::sync::Arc::new(IamAppContextInjector))
}

pub fn wrap_router_with_iam_backend_web_framework(
    router: axum::Router,
    resolver: IamDatabaseWebRequestContextResolver,
    route_manifest: HttpRouteManifest,
) -> axum::Router {
    sdkwork_web_axum::with_web_request_context(
        router,
        build_iam_backend_web_framework_layer(resolver, route_manifest),
    )
}

pub fn wrap_router_with_iam_open_api_web_framework(
    router: axum::Router,
    resolver: IamDatabaseWebRequestContextResolver,
    route_manifest: HttpRouteManifest,
) -> axum::Router {
    sdkwork_web_axum::with_web_request_context(
        router,
        build_iam_open_api_web_framework_layer(resolver, route_manifest),
    )
}

pub async fn iam_database_resolver_from_env() -> IamDatabaseWebRequestContextResolver {
    let iam_pool = sdkwork_database_sqlx::create_pool_from_env("IAM")
        .await
        .ok()
        .flatten()
        .and_then(|pool| pool.as_postgres().cloned().map(std::sync::Arc::new));
    IamDatabaseWebRequestContextResolver::new(iam_pool)
}
