use sdkwork_iam_web_adapter::IamAuthorizationPolicy;
use sdkwork_web_core::{
    AuthorizationPolicy, HttpRouteManifest, ServerRequestId, WebApiSurface, WebAuthMode,
    WebLoginScope, WebRequestContext, WebRequestPrincipal, WebTransportFacts,
};

fn backend_context(login_scope: WebLoginScope, organization_id: Option<&str>) -> WebRequestContext {
    WebRequestContext {
        request_id: ServerRequestId("req-login-scope".to_owned()),
        api_surface: WebApiSurface::BackendApi,
        auth_mode: WebAuthMode::DualToken,
        principal: Some(
            WebRequestPrincipal::builder()
                .tenant_id("100001")
                .user_id("1")
                .login_scope(login_scope)
                .organization_id(organization_id.map(str::to_string))
                .app_id("app-1")
                .build(),
        ),
        transport: WebTransportFacts {
            path: "/backend/v3/api/iam/users".to_owned(),
            method: "GET".to_owned(),
            auth_token_present: true,
            access_token_present: true,
            api_key_present: false,
            ingress_token_present: false,
            oauth_bearer_present: false,
            agent_token_present: false,
        },
        locale: None,
        client_kind: None,
        operation: None,
        trace_id: None,
        idempotency_key: None,
    }
}

fn app_context(login_scope: WebLoginScope, organization_id: Option<&str>) -> WebRequestContext {
    WebRequestContext {
        request_id: ServerRequestId("req-app-login-scope".to_owned()),
        api_surface: WebApiSurface::AppApi,
        auth_mode: WebAuthMode::DualToken,
        principal: Some(
            WebRequestPrincipal::builder()
                .tenant_id("100001")
                .user_id("1")
                .login_scope(login_scope)
                .organization_id(organization_id.map(str::to_string))
                .app_id("app-1")
                .build(),
        ),
        transport: WebTransportFacts {
            path: "/app/v3/api/iam/users/current".to_owned(),
            method: "GET".to_owned(),
            auth_token_present: true,
            access_token_present: true,
            api_key_present: false,
            ingress_token_present: false,
            oauth_bearer_present: false,
            agent_token_present: false,
        },
        locale: None,
        client_kind: None,
        operation: None,
        trace_id: None,
        idempotency_key: None,
    }
}

#[test]
fn backend_api_allows_personal_tenant_login_scope() {
    let policy = IamAuthorizationPolicy::new(HttpRouteManifest::new(&[]));
    policy
        .authorize(
            &backend_context(WebLoginScope::Tenant, None),
            Some("iam.users.list"),
        )
        .expect("tenant login scope must pass backend gate");
}

#[test]
fn backend_api_allows_organization_scope_without_active_organization_id() {
    let policy = IamAuthorizationPolicy::new(HttpRouteManifest::new(&[]));

    for organization_id in [None, Some(""), Some("0")] {
        policy
            .authorize(
                &backend_context(WebLoginScope::Organization, organization_id),
                Some("iam.users.list"),
            )
            .expect("organization scope without org id must pass backend gate");
    }
}

#[test]
fn backend_api_allows_organization_login_context() {
    let policy = IamAuthorizationPolicy::new(HttpRouteManifest::new(&[]));

    policy
        .authorize(
            &backend_context(WebLoginScope::Organization, Some("org-1")),
            Some("iam.users.list"),
        )
        .expect("organization login context should pass backend gate");
}

#[test]
fn app_api_allows_personal_tenant_login_scope() {
    let policy = IamAuthorizationPolicy::new(HttpRouteManifest::new(&[]));

    policy
        .authorize(
            &app_context(WebLoginScope::Tenant, None),
            Some("users.current.retrieve"),
        )
        .expect("personal login scope should remain valid on app api");
}
