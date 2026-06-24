use sdkwork_web_core::{
    AuthorizationPolicy, ManifestAuthorizationPolicy, WebApiSurface, WebFrameworkError,
    WebLoginScope, WebRequestContext,
};

/// IAM authorization policy: organization membership gate + manifest permission checks.
#[derive(Clone, Copy, Debug)]
pub struct IamAuthorizationPolicy {
    manifest_policy: ManifestAuthorizationPolicy,
}

impl IamAuthorizationPolicy {
    pub fn new(manifest: sdkwork_web_core::HttpRouteManifest) -> Self {
        Self {
            manifest_policy: ManifestAuthorizationPolicy::new(manifest),
        }
    }
}

impl AuthorizationPolicy for IamAuthorizationPolicy {
    fn authorize(
        &self,
        ctx: &WebRequestContext,
        operation_id: Option<&str>,
    ) -> Result<(), WebFrameworkError> {
        if ctx.api_surface == WebApiSurface::BackendApi {
            if ctx.login_scope() != Some(WebLoginScope::Organization) {
                return Err(WebFrameworkError::forbidden(
                    "backend api requires organization login scope",
                ));
            }
            if ctx.organization_id().is_none_or(|value| {
                let trimmed = value.trim();
                trimmed.is_empty() || trimmed == "0"
            }) {
                return Err(WebFrameworkError::forbidden(
                    "backend api requires an active organization login context",
                ));
            }
        }

        self.manifest_policy.authorize(ctx, operation_id)
    }
}
