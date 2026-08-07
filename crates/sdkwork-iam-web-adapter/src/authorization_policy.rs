use sdkwork_web_core::{
    AuthorizationPolicy, ManifestAuthorizationPolicy, WebFrameworkError, WebRequestContext,
};

/// IAM authorization policy: manifest principal + per-route permission checks.
///
/// Backend APIs accept both organization logins and tenant-level logins
/// (`login_scope = TENANT` with `organization_id = 0` or absent). Authorization
/// stays principal- and permission-driven; per-route `required_permission`
/// (and host-level admin boundaries such as `cloudrouter.admin.access`) gate
/// the actual operations.
#[derive(Clone, Debug)]
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
        self.manifest_policy.authorize(ctx, operation_id)
    }
}
