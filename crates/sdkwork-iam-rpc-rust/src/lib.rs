use sdkwork_rpc_core::{SdkworkRpcMethod, SdkworkRpcServiceManifest};

pub fn iam_app_rpc_service_manifests() -> Vec<SdkworkRpcServiceManifest> {
    vec![
        SdkworkRpcServiceManifest::new(
            "sdkwork.iam.app.v3",
            "SessionService",
            "app",
            "iam",
            vec![
                SdkworkRpcMethod::new("CreateSession", "sessions.create", "public", true),
                SdkworkRpcMethod::new(
                    "RetrieveCurrentSession",
                    "sessions.current.retrieve",
                    "dual_token",
                    false,
                ),
                SdkworkRpcMethod::new(
                    "UpdateCurrentSession",
                    "sessions.current.update",
                    "dual_token",
                    true,
                ),
                SdkworkRpcMethod::new(
                    "DeleteCurrentSession",
                    "sessions.current.delete",
                    "dual_token",
                    true,
                ),
                SdkworkRpcMethod::new("RefreshSession", "sessions.refresh", "public", true),
            ],
        ),
        SdkworkRpcServiceManifest::new(
            "sdkwork.iam.app.v3",
            "CurrentUserService",
            "app",
            "iam",
            vec![SdkworkRpcMethod::new(
                "RetrieveCurrentUser",
                "users.current.retrieve",
                "dual_token",
                false,
            )],
        ),
    ]
}

pub fn iam_backend_rpc_service_manifests() -> Vec<SdkworkRpcServiceManifest> {
    vec![
        SdkworkRpcServiceManifest::new(
            "sdkwork.iam.backend.v3",
            "TenantAdminService",
            "backend",
            "iam",
            vec![
                SdkworkRpcMethod::new("CreateTenant", "tenants.create", "backend_admin", true),
                SdkworkRpcMethod::new("ListTenants", "tenants.list", "backend_admin", false),
                SdkworkRpcMethod::new("RetrieveTenant", "tenants.retrieve", "backend_admin", false),
            ],
        ),
        SdkworkRpcServiceManifest::new(
            "sdkwork.iam.backend.v3",
            "UserAdminService",
            "backend",
            "iam",
            vec![
                SdkworkRpcMethod::new("CreateUser", "users.create", "backend_admin", true),
                SdkworkRpcMethod::new("ListUsers", "users.list", "backend_admin", false),
                SdkworkRpcMethod::new("RetrieveUser", "users.retrieve", "backend_admin", false),
            ],
        ),
        SdkworkRpcServiceManifest::new(
            "sdkwork.iam.backend.v3",
            "RoleAdminService",
            "backend",
            "iam",
            vec![
                SdkworkRpcMethod::new("CreateRole", "roles.create", "backend_admin", true),
                SdkworkRpcMethod::new("ListRoles", "roles.list", "backend_admin", false),
            ],
        ),
        SdkworkRpcServiceManifest::new(
            "sdkwork.iam.backend.v3",
            "PermissionAdminService",
            "backend",
            "iam",
            vec![
                SdkworkRpcMethod::new(
                    "CreatePermission",
                    "permissions.create",
                    "backend_admin",
                    true,
                ),
                SdkworkRpcMethod::new(
                    "ListPermissions",
                    "permissions.list",
                    "backend_admin",
                    false,
                ),
            ],
        ),
        SdkworkRpcServiceManifest::new(
            "sdkwork.iam.backend.v3",
            "IamAuditService",
            "backend",
            "iam",
            vec![
                SdkworkRpcMethod::new(
                    "ListSecurityEvents",
                    "securityEvents.list",
                    "backend_admin",
                    false,
                ),
                SdkworkRpcMethod::new(
                    "ListAuditEvents",
                    "auditEvents.list",
                    "backend_admin",
                    false,
                ),
            ],
        ),
    ]
}

pub fn all_iam_rpc_service_manifests() -> Vec<SdkworkRpcServiceManifest> {
    let mut manifests = iam_app_rpc_service_manifests();
    manifests.extend(iam_backend_rpc_service_manifests());
    manifests
}
