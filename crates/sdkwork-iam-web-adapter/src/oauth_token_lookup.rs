//! IAM OAuth bearer lookup for open-api (`Authorization: Bearer`).

use async_trait::async_trait;
use sdkwork_web_core::{
    OAuthBearerCredential, OAuthPrincipalRecord, OAuthTokenLookupService, WebFrameworkError,
};
use std::sync::Arc;

use crate::iam_session::resolve_iam_app_context_from_oauth_bearer;
use crate::resolver::iam_principal_record_from_context;
use sqlx::PgPool;

#[derive(Clone)]
pub struct IamOAuthTokenLookupService {
    pool: Arc<PgPool>,
}

impl IamOAuthTokenLookupService {
    pub fn new(pool: Arc<PgPool>) -> Self {
        Self { pool }
    }
}

#[async_trait]
impl OAuthTokenLookupService for IamOAuthTokenLookupService {
    async fn lookup_oauth_token(
        &self,
        credential: &OAuthBearerCredential,
    ) -> Result<OAuthPrincipalRecord, WebFrameworkError> {
        let context =
            resolve_iam_app_context_from_oauth_bearer(self.pool.as_ref(), &credential.raw_token)
                .await
                .ok_or_else(|| {
                    WebFrameworkError::invalid_credentials(
                        "invalid or expired IAM OAuth bearer token",
                    )
                })?;
        Ok(iam_principal_record_from_context(&context, credential))
    }
}
