use async_trait::async_trait;
use sdkwork_database_sqlx::DatabasePool;
use sdkwork_web_core::{
    DefaultAccessTokenParser, DefaultApiKeyParser, DefaultAuthTokenParser,
    DefaultOAuthBearerParser, DefaultOpenApiWebRequestContextResolver,
    DefaultWebRequestContextResolver, JwtProductionClaimPolicy, OpenApiWebRequestParserResolver,
    ResolverProductionProfile, WebFrameworkError, WebRequestContextResolver, WebRequestPrincipal,
};
use sqlx::PgPool;
use std::sync::Arc;

use crate::api_key_lookup::IamApiKeyLookupService;
use crate::dev_runtime::allows_dev_authentication_fallback;
use crate::iam_session::{
    resolve_iam_app_context_from_access_token, resolve_iam_app_context_from_access_token_pool,
    resolve_iam_app_context_from_dual_tokens, resolve_iam_app_context_from_dual_tokens_pool,
    resolve_iam_app_context_from_oauth_bearer, resolve_iam_app_context_from_oauth_bearer_pool,
};
use crate::oauth_token_lookup::IamOAuthTokenLookupService;

type IamDatabaseOpenApiResolver = OpenApiWebRequestParserResolver<
    DefaultAuthTokenParser,
    DefaultAccessTokenParser,
    DefaultApiKeyParser,
    IamApiKeyLookupService,
    DefaultOAuthBearerParser,
    IamOAuthTokenLookupService,
>;

#[derive(Clone)]
pub struct IamDatabaseWebRequestContextResolver {
    iam_database_pool: Option<DatabasePool>,
    iam_pool: Option<Arc<PgPool>>,
    open_api_database: Option<IamDatabaseOpenApiResolver>,
    open_api_dev_fallback: DefaultOpenApiWebRequestContextResolver,
    jwt_fallback: DefaultWebRequestContextResolver,
    production_claim_policy: Option<JwtProductionClaimPolicy>,
}

/// Alias documenting IAM open-api multi-scheme resolver wiring.
pub type IamOpenApiWebRequestContextResolver = IamDatabaseWebRequestContextResolver;
/// Canonical default resolver for application integration.
pub type IamWebRequestContextResolver = IamDatabaseWebRequestContextResolver;

impl IamDatabaseWebRequestContextResolver {
    pub fn new(iam_pool: Option<Arc<PgPool>>) -> Self {
        let open_api_database = iam_pool.as_ref().map(|pool| {
            OpenApiWebRequestParserResolver::new(
                DefaultAuthTokenParser,
                DefaultAccessTokenParser,
                DefaultApiKeyParser,
                IamApiKeyLookupService::new(pool.clone()),
                DefaultOAuthBearerParser,
                IamOAuthTokenLookupService::new(pool.clone()),
            )
        });
        Self {
            iam_database_pool: None,
            iam_pool,
            open_api_database,
            open_api_dev_fallback: DefaultOpenApiWebRequestContextResolver::default(),
            jwt_fallback: DefaultWebRequestContextResolver::default(),
            production_claim_policy: None,
        }
    }

    pub fn from_database_pool(iam_database_pool: Option<DatabasePool>) -> Self {
        let iam_pool = iam_database_pool
            .as_ref()
            .and_then(DatabasePool::as_postgres)
            .cloned()
            .map(Arc::new);
        let mut resolver = Self::new(iam_pool);
        resolver.iam_database_pool = iam_database_pool;
        resolver
    }

    pub fn try_with_saas_production_claim_policy(
        mut self,
        policy: JwtProductionClaimPolicy,
    ) -> Result<Self, String> {
        if self.iam_pool.is_none() {
            return Err(
                "production IAM resolver requires an authoritative PostgreSQL pool".to_owned(),
            );
        }
        if !policy.has_saas_issuer_audience_allowlist() {
            return Err(
                "production IAM resolver requires non-empty issuer and audience allowlists"
                    .to_owned(),
            );
        }
        if !policy
            .expected_issuers
            .iter()
            .any(|issuer| issuer == crate::iam_session::LOCAL_SESSION_TOKEN_ISSUER)
        {
            return Err(format!(
                "production IAM issuer allowlist must include {}",
                crate::iam_session::LOCAL_SESSION_TOKEN_ISSUER,
            ));
        }
        self.production_claim_policy = Some(policy);
        Ok(self)
    }

    fn validate_production_principal(
        &self,
        principal: WebRequestPrincipal,
    ) -> Result<WebRequestPrincipal, WebFrameworkError> {
        let Some(policy) = &self.production_claim_policy else {
            return Ok(principal);
        };
        if policy
            .expected_audiences
            .iter()
            .any(|audience| audience == principal.app_id())
        {
            Ok(principal)
        } else {
            Err(WebFrameworkError::invalid_credentials(
                "IAM credential audience is not allowed for this application host",
            ))
        }
    }
}

fn iam_database_unavailable_error() -> WebFrameworkError {
    WebFrameworkError::invalid_credentials(
        "IAM database session resolution is unavailable in this deployment",
    )
}

#[async_trait]
impl WebRequestContextResolver for IamDatabaseWebRequestContextResolver {
    fn resolver_production_profile(&self) -> ResolverProductionProfile {
        if self.production_claim_policy.is_some() {
            ResolverProductionProfile::TenantBoundSaaS
        } else {
            ResolverProductionProfile::Unspecified
        }
    }

    fn jwt_production_claim_policy(&self) -> Option<JwtProductionClaimPolicy> {
        self.production_claim_policy.clone()
    }

    async fn resolve_api_key(
        &self,
        raw_api_key: &str,
    ) -> Result<WebRequestPrincipal, WebFrameworkError> {
        if let Some(resolver) = &self.open_api_database {
            return self
                .validate_production_principal(resolver.resolve_api_key(raw_api_key).await?);
        }
        if allows_dev_authentication_fallback() {
            return self
                .open_api_dev_fallback
                .resolve_api_key(raw_api_key)
                .await;
        }
        Err(iam_database_unavailable_error())
    }

    async fn resolve_oauth_bearer(
        &self,
        raw_bearer_token: &str,
    ) -> Result<WebRequestPrincipal, WebFrameworkError> {
        if let Some(resolver) = &self.open_api_database {
            return self.validate_production_principal(
                resolver.resolve_oauth_bearer(raw_bearer_token).await?,
            );
        }
        if let Some(pool) = &self.iam_database_pool {
            if let Some(context) =
                resolve_iam_app_context_from_oauth_bearer_pool(pool, raw_bearer_token).await
            {
                return self.validate_production_principal(web_request_principal_from_iam(context));
            }
            if allows_dev_authentication_fallback() {
                return self
                    .open_api_dev_fallback
                    .resolve_oauth_bearer(raw_bearer_token)
                    .await;
            }
            return Err(WebFrameworkError::invalid_credentials(
                "invalid or expired IAM OAuth bearer token",
            ));
        }
        if let Some(pool) = &self.iam_pool {
            if let Some(context) =
                resolve_iam_app_context_from_oauth_bearer(pool, raw_bearer_token).await
            {
                return self.validate_production_principal(web_request_principal_from_iam(context));
            }
            return Err(WebFrameworkError::invalid_credentials(
                "invalid or expired IAM OAuth bearer token",
            ));
        }
        if allows_dev_authentication_fallback() {
            return self
                .open_api_dev_fallback
                .resolve_oauth_bearer(raw_bearer_token)
                .await;
        }
        Err(iam_database_unavailable_error())
    }

    /// Auth-token channel for [`RouteAuth::OpenApiBearerFlexible`]: a single
    /// bearer credential that is not an API key is resolved to the IAM user
    /// identity through the same IAM bearer lookup used for OAuth tokens.
    async fn resolve_bearer_auth_token(
        &self,
        raw_bearer_token: &str,
    ) -> Result<WebRequestPrincipal, WebFrameworkError> {
        self.resolve_oauth_bearer(raw_bearer_token).await
    }

    async fn resolve_dual_token(
        &self,
        raw_auth_token: &str,
        raw_access_token: &str,
    ) -> Result<WebRequestPrincipal, WebFrameworkError> {
        if let Some(pool) = &self.iam_database_pool {
            return match resolve_iam_app_context_from_dual_tokens_pool(
                pool,
                raw_auth_token,
                raw_access_token,
            )
            .await
            {
                Some(context) => {
                    self.validate_production_principal(web_request_principal_from_iam(context))
                }
                None => Err(WebFrameworkError::invalid_credentials(
                    "invalid or expired IAM session",
                )),
            };
        }
        let Some(pool) = &self.iam_pool else {
            if allows_dev_authentication_fallback() {
                return self
                    .jwt_fallback
                    .resolve_dual_token(raw_auth_token, raw_access_token)
                    .await;
            }
            return Err(iam_database_unavailable_error());
        };

        match resolve_iam_app_context_from_dual_tokens(pool, raw_auth_token, raw_access_token).await
        {
            Some(context) => {
                self.validate_production_principal(web_request_principal_from_iam(context))
            }
            None => Err(WebFrameworkError::invalid_credentials(
                "invalid or expired IAM session",
            )),
        }
    }

    async fn resolve_access_token(
        &self,
        raw_access_token: &str,
    ) -> Result<WebRequestPrincipal, WebFrameworkError> {
        if let Some(pool) = &self.iam_database_pool {
            if let Some(context) =
                resolve_iam_app_context_from_access_token_pool(pool, raw_access_token).await
            {
                return self.validate_production_principal(web_request_principal_from_iam(context));
            }
            if allows_dev_authentication_fallback() {
                return self
                    .jwt_fallback
                    .resolve_access_token(raw_access_token)
                    .await;
            }
            return Err(WebFrameworkError::invalid_credentials(
                "invalid or expired IAM access token",
            ));
        }
        if let Some(pool) = &self.iam_pool {
            if let Some(context) =
                resolve_iam_app_context_from_access_token(pool, raw_access_token).await
            {
                return self.validate_production_principal(web_request_principal_from_iam(context));
            }
            if allows_dev_authentication_fallback() {
                return self
                    .jwt_fallback
                    .resolve_access_token(raw_access_token)
                    .await;
            }
            return Err(WebFrameworkError::invalid_credentials(
                "invalid or expired IAM access token",
            ));
        }
        if allows_dev_authentication_fallback() {
            return self
                .jwt_fallback
                .resolve_access_token(raw_access_token)
                .await;
        }
        Err(iam_database_unavailable_error())
    }
}

pub fn web_request_principal_from_iam(
    context: sdkwork_iam_context_service::IamAppContext,
) -> WebRequestPrincipal {
    use sdkwork_iam_context_service::{
        AuthLevel, DeploymentMode, Environment, IamPrincipalKind, LoginScope,
    };
    let subject_type = match context.principal_kind {
        IamPrincipalKind::User => sdkwork_web_core::WebSubjectType::User,
        IamPrincipalKind::ServiceAccount => sdkwork_web_core::WebSubjectType::Service,
    };
    WebRequestPrincipal::builder()
        .tenant_id(context.tenant_id)
        .organization_id(context.organization_id)
        .login_scope(match context.login_scope {
            LoginScope::Tenant => sdkwork_web_core::WebLoginScope::Tenant,
            LoginScope::Organization => sdkwork_web_core::WebLoginScope::Organization,
        })
        .user_id(context.user_id)
        .session_id(Some(context.session_id))
        .app_id(context.app_id)
        .environment(match context.environment {
            Environment::Dev => sdkwork_web_core::WebEnvironment::Dev,
            Environment::Test => sdkwork_web_core::WebEnvironment::Test,
            Environment::Prod => sdkwork_web_core::WebEnvironment::Prod,
        })
        .deployment_mode(match context.deployment_mode {
            DeploymentMode::Saas => sdkwork_web_core::WebDeploymentMode::Saas,
            DeploymentMode::Local => sdkwork_web_core::WebDeploymentMode::Local,
            DeploymentMode::Private => sdkwork_web_core::WebDeploymentMode::Private,
        })
        .auth_level(match context.auth_level {
            AuthLevel::Anonymous => sdkwork_web_core::WebAuthLevel::Anonymous,
            AuthLevel::Password => sdkwork_web_core::WebAuthLevel::Password,
            AuthLevel::Mfa => sdkwork_web_core::WebAuthLevel::Mfa,
            AuthLevel::System => sdkwork_web_core::WebAuthLevel::System,
        })
        .data_scope(context.data_scope)
        .permission_scope(context.permission_scope)
        .subject_type(subject_type)
        .build()
}

pub(crate) fn iam_principal_record_from_context(
    context: &sdkwork_iam_context_service::IamAppContext,
    credential: &sdkwork_web_core::OAuthBearerCredential,
) -> sdkwork_web_core::OAuthPrincipalRecord {
    let principal = web_request_principal_from_iam(context.clone());
    sdkwork_web_core::OAuthPrincipalRecord {
        token_id: credential
            .metadata
            .get("jti")
            .cloned()
            .or_else(|| credential.metadata.get("token_id").cloned())
            .unwrap_or_else(|| context.session_id.clone()),
        client_id: credential.client_id.clone(),
        tenant_id: principal.tenant_id().to_owned(),
        organization_id: principal.organization_id().map(str::to_owned),
        user_id: principal.user_id().to_owned(),
        app_id: principal.app_id().to_owned(),
        environment: principal.app.environment,
        deployment_mode: principal.app.deployment_mode,
        data_scope: principal.scopes.data_scope.clone(),
        permission_scope: principal.scopes.permission_scope.clone(),
        subject_type: Some(
            match context.principal_kind {
                sdkwork_iam_context_service::IamPrincipalKind::User => "user",
                sdkwork_iam_context_service::IamPrincipalKind::ServiceAccount => "service",
            }
            .to_owned(),
        ),
        metadata: credential.metadata.clone(),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn production_policy() -> JwtProductionClaimPolicy {
        JwtProductionClaimPolicy::saas_production(
            vec![crate::iam_session::LOCAL_SESSION_TOKEN_ISSUER.to_owned()],
            vec!["sdkwork-community".to_owned()],
        )
    }

    #[test]
    fn production_profile_requires_an_authoritative_pool() {
        let error = IamDatabaseWebRequestContextResolver::new(None)
            .try_with_saas_production_claim_policy(production_policy())
            .err()
            .expect("missing pool must fail closed");
        assert!(error.contains("PostgreSQL pool"));
    }

    #[tokio::test]
    async fn production_profile_reports_session_revocation_and_claim_policy() {
        let pool = sqlx::postgres::PgPoolOptions::new()
            .connect_lazy("postgresql://sdkwork@127.0.0.1/sdkwork")
            .expect("lazy PostgreSQL pool");
        let resolver = IamDatabaseWebRequestContextResolver::new(Some(Arc::new(pool)))
            .try_with_saas_production_claim_policy(production_policy())
            .expect("production resolver");

        assert_eq!(
            ResolverProductionProfile::TenantBoundSaaS,
            resolver.resolver_production_profile(),
        );
        assert!(resolver
            .jwt_production_claim_policy()
            .is_some_and(|policy| policy.has_saas_issuer_audience_allowlist()));
        assert!(!resolver.uses_default_api_key_lookup());
        assert!(!resolver.uses_default_oauth_token_lookup());
    }
}
