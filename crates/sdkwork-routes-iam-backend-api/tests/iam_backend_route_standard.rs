use axum::body::Body;
use axum::http::{Method, Request, StatusCode};
use http_body_util::BodyExt;
use sdkwork_routes_iam_backend_api::{
    backend_routes, build_sdkwork_iam_backend_api_router, HttpMethod, HttpRoute, BACKEND_API_PREFIX,
};
use serde_json::Value;
use tower::ServiceExt;

#[test]
fn exposes_standard_backend_prefix() {
    assert_eq!(BACKEND_API_PREFIX, "/backend/v3/api");
}

#[test]
fn exposes_surface_named_rust_integration_entrypoints() {
    let _backend_api_router = build_sdkwork_iam_backend_api_router();

    assert!(!backend_routes().is_empty());
}

#[test]
fn backend_routes_do_not_expose_login_or_session_creation() {
    let routes = backend_routes();

    assert!(routes
        .iter()
        .all(|route| !route.path.contains("/auth/sessions")));
    assert!(routes
        .iter()
        .all(|route| !route.path.contains("/auth/login")));
    assert!(routes.contains(&HttpRoute::dual_token(
        HttpMethod::Get,
        "/backend/v3/api/iam/users",
        "iam",
        "users.list",
    )));
    assert!(routes.contains(&HttpRoute::dual_token(
        HttpMethod::Get,
        "/backend/v3/api/iam/api_keys",
        "iam",
        "apiKeys.list",
    )));
    assert!(
        routes.iter().all(|route| {
            !route.operation_id.contains("sessions.create")
                && !route.operation_id.contains("miniProgramSessions.create")
                && !route.path.contains("/app/v3/api/oauth/sessions")
        }),
        "backend OAuth management routes must not create login sessions",
    );
}

#[test]
fn backend_routes_expose_standard_iam_oauth_management_surface() {
    let routes = backend_routes();

    assert!(
        routes.iter().all(|route| {
            !route.path.contains("client_secret") && !route.operation_id.contains("clientSecrets")
        }),
        "OAuth backend management must use iam.oauth.secrets, not clientSecrets",
    );

    for route in [
        HttpRoute::dual_token(
            HttpMethod::Get,
            "/backend/v3/api/iam/oauth/provider_catalog",
            "iam.oauth",
            "iam.oauth.providerCatalog.list",
        ),
        HttpRoute::dual_token(
            HttpMethod::Post,
            "/backend/v3/api/iam/oauth/integrations",
            "iam.oauth",
            "iam.oauth.integrations.create",
        ),
        HttpRoute::dual_token(
            HttpMethod::Get,
            "/backend/v3/api/iam/oauth/clients",
            "iam.oauth",
            "iam.oauth.clients.list",
        ),
        HttpRoute::dual_token(
            HttpMethod::Post,
            "/backend/v3/api/iam/oauth/secrets",
            "iam.oauth",
            "iam.oauth.secrets.create",
        ),
        HttpRoute::dual_token(
            HttpMethod::Get,
            "/backend/v3/api/iam/oauth/surfaces",
            "iam.oauth",
            "iam.oauth.surfaces.list",
        ),
        HttpRoute::dual_token(
            HttpMethod::Get,
            "/backend/v3/api/iam/oauth/flow_configs",
            "iam.oauth",
            "iam.oauth.flowConfigs.list",
        ),
        HttpRoute::dual_token(
            HttpMethod::Get,
            "/backend/v3/api/iam/oauth/scope_profiles",
            "iam.oauth",
            "iam.oauth.scopeProfiles.list",
        ),
        HttpRoute::dual_token(
            HttpMethod::Get,
            "/backend/v3/api/iam/oauth/claim_mappings",
            "iam.oauth",
            "iam.oauth.claimMappings.list",
        ),
        HttpRoute::dual_token(
            HttpMethod::Get,
            "/backend/v3/api/iam/oauth/policies",
            "iam.oauth",
            "iam.oauth.policies.list",
        ),
        HttpRoute::dual_token(
            HttpMethod::Get,
            "/backend/v3/api/iam/oauth/tenant_bindings",
            "iam.oauth",
            "iam.oauth.tenantBindings.list",
        ),
        HttpRoute::dual_token(
            HttpMethod::Get,
            "/backend/v3/api/iam/oauth/operator_platforms",
            "iam.oauth",
            "iam.oauth.operatorPlatforms.list",
        ),
        HttpRoute::dual_token(
            HttpMethod::Post,
            "/backend/v3/api/iam/oauth/operator_platforms/{operatorPlatformId}/pre_authorizations",
            "iam.oauth",
            "iam.oauth.operatorPlatforms.preAuthorizations.create",
        ),
        HttpRoute::dual_token(
            HttpMethod::Get,
            "/backend/v3/api/iam/oauth/resource_accounts",
            "iam.oauth",
            "iam.oauth.resourceAccounts.list",
        ),
        HttpRoute::dual_token(
            HttpMethod::Post,
            "/backend/v3/api/iam/oauth/resource_accounts/{resourceAccountId}/mini_program_login_checks",
            "iam.oauth",
            "iam.oauth.resourceAccounts.miniProgramLoginChecks.create",
        ),
        HttpRoute::dual_token(
            HttpMethod::Get,
            "/backend/v3/api/iam/oauth/resource_authorizations",
            "iam.oauth",
            "iam.oauth.resourceAuthorizations.list",
        ),
        HttpRoute::dual_token(
            HttpMethod::Get,
            "/backend/v3/api/iam/oauth/webhook_configs",
            "iam.oauth",
            "iam.oauth.webhookConfigs.list",
        ),
        HttpRoute::dual_token(
            HttpMethod::Get,
            "/backend/v3/api/iam/oauth/operational_resources",
            "iam.oauth",
            "iam.oauth.operationalResources.list",
        ),
        HttpRoute::dual_token(
            HttpMethod::Get,
            "/backend/v3/api/iam/oauth/account_links",
            "iam.oauth",
            "iam.oauth.accountLinks.list",
        ),
        HttpRoute::dual_token(
            HttpMethod::Get,
            "/backend/v3/api/iam/oauth/grants",
            "iam.oauth",
            "iam.oauth.grants.list",
        ),
        HttpRoute::dual_token(
            HttpMethod::Get,
            "/backend/v3/api/iam/oauth/callback_events",
            "iam.oauth",
            "iam.oauth.callbackEvents.list",
        ),
        HttpRoute::dual_token(
            HttpMethod::Post,
            "/backend/v3/api/iam/oauth/diagnostic_runs",
            "iam.oauth",
            "iam.oauth.diagnosticRuns.create",
        ),
    ] {
        assert!(
            routes.contains(&route),
            "missing backend OAuth management route: {route:?}",
        );
    }
}

#[test]
fn backend_routes_expose_admin_organization_directory_reads() {
    let routes = backend_routes();

    for route in [
        HttpRoute::dual_token(
            HttpMethod::Get,
            "/backend/v3/api/iam/organizations",
            "iam",
            "organizations.list",
        ),
        HttpRoute::dual_token(
            HttpMethod::Get,
            "/backend/v3/api/iam/organizations/tree",
            "iam",
            "organizations.tree.retrieve",
        ),
        HttpRoute::dual_token(
            HttpMethod::Get,
            "/backend/v3/api/iam/organization_memberships",
            "iam",
            "organizationMemberships.list",
        ),
        HttpRoute::dual_token(
            HttpMethod::Get,
            "/backend/v3/api/iam/departments",
            "iam",
            "departments.list",
        ),
        HttpRoute::dual_token(
            HttpMethod::Get,
            "/backend/v3/api/iam/departments/tree",
            "iam",
            "departments.tree.retrieve",
        ),
        HttpRoute::dual_token(
            HttpMethod::Get,
            "/backend/v3/api/iam/department_assignments",
            "iam",
            "departmentAssignments.list",
        ),
        HttpRoute::dual_token(
            HttpMethod::Get,
            "/backend/v3/api/iam/positions",
            "iam",
            "positions.list",
        ),
        HttpRoute::dual_token(
            HttpMethod::Get,
            "/backend/v3/api/iam/position_assignments",
            "iam",
            "positionAssignments.list",
        ),
        HttpRoute::dual_token(
            HttpMethod::Get,
            "/backend/v3/api/iam/role_bindings",
            "iam",
            "roleBindings.list",
        ),
    ] {
        assert!(
            routes.contains(&route),
            "missing backend IAM directory read route: {route:?}"
        );
    }
}

#[test]
fn backend_route_manifest_matches_the_standard_management_operation_surface() {
    let mut operation_ids: Vec<&str> = backend_routes()
        .iter()
        .filter(|route| !route.operation_id.starts_with("iam.oauth."))
        .map(|route| route.operation_id)
        .collect();
    operation_ids.sort();

    assert_eq!(
        operation_ids,
        vec![
            "accessCredentials.create",
            "accountBindingPolicy.retrieve",
            "accountBindingPolicy.update",
            "apiKeys.list",
            "apiKeys.revoke",
            "applications.register",
            "auditEvents.list",
            "auditEvents.retrieve",
            "departmentAssignments.create",
            "departmentAssignments.list",
            "departmentAssignments.update",
            "departments.create",
            "departments.delete",
            "departments.list",
            "departments.retrieve",
            "departments.tree.retrieve",
            "departments.update",
            "groups.create",
            "groups.delete",
            "groups.list",
            "groups.members.create",
            "groups.members.delete",
            "groups.members.list",
            "groups.retrieve",
            "groups.update",
            "organizationMemberships.create",
            "organizationMemberships.list",
            "organizationMemberships.update",
            "organizations.create",
            "organizations.delete",
            "organizations.list",
            "organizations.retrieve",
            "organizations.tree.retrieve",
            "organizations.update",
            "permissions.create",
            "permissions.delete",
            "permissions.list",
            "permissions.retrieve",
            "permissions.update",
            "policies.create",
            "policies.delete",
            "policies.list",
            "policies.retrieve",
            "policies.update",
            "positionAssignments.create",
            "positionAssignments.list",
            "positionAssignments.update",
            "positions.create",
            "positions.delete",
            "positions.list",
            "positions.update",
            "roleBindings.create",
            "roleBindings.delete",
            "roleBindings.list",
            "roles.create",
            "roles.delete",
            "roles.list",
            "roles.permissions.create",
            "roles.permissions.delete",
            "roles.permissions.list",
            "roles.retrieve",
            "roles.update",
            "securityEvents.list",
            "securityEvents.retrieve",
            "serviceAccountCredentials.revoke",
            "serviceAccountTokens.create",
            "serviceAccounts.create",
            "serviceAccounts.credentials.create",
            "serviceAccounts.delete",
            "serviceAccounts.list",
            "serviceAccounts.retrieve",
            "serviceAccounts.update",
            "tenantApplications.enable",
            "tenantApplications.list",
            "tenantApplications.management.disable",
            "tenantApplications.management.enable",
            "tenantApplications.management.provision",
            "tenantApplications.management.update",
            "tenantApplications.provision",
            "tenantApplications.retrieve",
            "tenantApplications.summary.retrieve",
            "tenantApplications.update",
            "tenants.create",
            "tenants.delete",
            "tenants.list",
            "tenants.members.create",
            "tenants.members.delete",
            "tenants.members.list",
            "tenants.members.update",
            "tenants.retrieve",
            "tenants.update",
            "users.create",
            "users.delete",
            "users.list",
            "users.retrieve",
            "users.update",
        ]
    );
    assert!(!operation_ids.contains(&"users.current.retrieve"));
    assert!(!operation_ids.contains(&"users.roles.create"));
    assert!(!operation_ids.contains(&"users.roles.delete"));
    assert!(!operation_ids.contains(&"users.roles.list"));
    assert!(
        backend_routes()
            .iter()
            .all(|route| !route.path.contains("/users/{userId}/roles")),
        "direct user-role backend routes must be retired; use /iam/role_bindings"
    );
}

#[test]
fn service_account_token_exchange_is_a_credential_entry_route() {
    let routes = backend_routes();
    let route = routes
        .iter()
        .find(|route| route.operation_id == "serviceAccountTokens.create")
        .expect("service account token exchange route");
    assert!(route.auth.skips_credential_resolution());
    assert!(route.forbid_credential_headers);
}

#[test]
fn enriched_backend_routes_declare_required_permissions_for_protected_operations() {
    use sdkwork_routes_iam_backend_api::{
        iam_backend_enriched_routes, iam_backend_permission_for_operation,
    };

    for route in iam_backend_enriched_routes() {
        if route.auth.skips_credential_resolution() {
            continue;
        }
        let expected = iam_backend_permission_for_operation(route.operation_id)
            .unwrap_or_else(|| panic!("missing permission mapping for {}", route.operation_id));
        assert_eq!(
            route.required_permission,
            Some(expected),
            "route {} must declare required_permission",
            route.operation_id
        );
    }
}

#[test]
fn backend_router_source_does_not_embed_demo_iam_data() {
    let source = include_str!("../src/routes.rs");

    for forbidden in [
        "t_demo",
        "org_demo",
        "dept_demo",
        "membership_demo",
        "Local Admin",
        "sk-local-admin",
    ] {
        assert!(
            !source.contains(forbidden),
            "backend IAM router source must not embed demo data token {forbidden}"
        );
    }
}

#[tokio::test]
async fn backend_router_does_not_serve_demo_management_data_without_real_backend() {
    let router = build_sdkwork_iam_backend_api_router();

    for (method, path, body) in [
        (Method::GET, "/backend/v3/api/iam/organizations/tree", None),
        (Method::GET, "/backend/v3/api/iam/departments/tree", None),
        (Method::GET, "/backend/v3/api/iam/roles", None),
        (Method::GET, "/backend/v3/api/iam/permissions", None),
        (Method::GET, "/backend/v3/api/iam/users", None),
        (
            Method::POST,
            "/backend/v3/api/iam/users",
            Some(r#"{"email":"new-user@example.com"}"#),
        ),
        (
            Method::PATCH,
            "/backend/v3/api/iam/users/user_new_user_example_com",
            Some(r#"{"displayName":"Updated User"}"#),
        ),
        (
            Method::POST,
            "/backend/v3/api/iam/organizations",
            Some(r#"{"name":"New Organization"}"#),
        ),
        (
            Method::PATCH,
            "/backend/v3/api/iam/organizations/org-real",
            Some(r#"{"name":"Updated Organization"}"#),
        ),
        (
            Method::DELETE,
            "/backend/v3/api/iam/organizations/org-real",
            None,
        ),
    ] {
        let (status, body_text, payload) =
            request_backend_route(router.clone(), method.clone(), path, body).await;

        assert_ne!(
            StatusCode::OK,
            status,
            "{method} {path} must not be served by appbase demo backend: {body_text}"
        );
        assert_ne!(
            Some(0),
            payload["code"].as_i64(),
            "{method} {path} must not return a success envelope without a real backend"
        );
        for forbidden in [
            "t_demo",
            "org_demo",
            "dept_demo",
            "membership_demo",
            "Local Admin",
            "sk-local-admin",
        ] {
            assert!(
                !body_text.contains(forbidden),
                "{method} {path} must not expose demo IAM token {forbidden}: {body_text}"
            );
        }
    }
}

async fn request_backend_route(
    router: axum::Router,
    method: Method,
    path: &str,
    body: Option<&str>,
) -> (StatusCode, String, Value) {
    let response = router
        .oneshot(
            Request::builder()
                .method(method)
                .uri(path)
                .header("content-type", "application/json")
                .body(Body::from(body.unwrap_or_default().to_owned()))
                .unwrap(),
        )
        .await
        .unwrap();
    let status = response.status();
    let bytes = response.into_body().collect().await.unwrap().to_bytes();
    let body_text = String::from_utf8(bytes.to_vec()).unwrap();
    let payload = serde_json::from_str(&body_text).unwrap_or(Value::Null);
    (status, body_text, payload)
}
