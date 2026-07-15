use axum::body::Body;
use axum::http::{Method, Request, StatusCode};
use http_body_util::BodyExt;
use sdkwork_iam_web_adapter::{ensure_platform_tenant_application, iam_wire_result_code};
use sdkwork_routes_iam_app_api::{
    app_routes, build_sdkwork_iam_app_api_router_with_pool, required_dual_token_headers,
    HttpMethod, HttpRoute, APP_API_PREFIX, IAM_ANONYMOUS_BOOTSTRAP_OPERATION_IDS,
    IAM_CREDENTIAL_ENTRY_OPERATION_IDS, IAM_HANDLER_SESSION_OPERATION_IDS,
};
use sdkwork_web_core::bootstrap_access_token_jwt;
use serde_json::{json, Value};
use std::sync::{Mutex, MutexGuard, OnceLock};
use tower::ServiceExt;

#[path = "unified_database_env.rs"]
mod unified_database_env;

fn app_api_authored_source() -> String {
    [
        include_str!("../src/handlers.rs"),
        include_str!("../src/state.rs"),
        include_str!("../src/tokens.rs"),
        include_str!("../src/passwords.rs"),
        include_str!("../src/directory.rs"),
        include_str!("../src/responses.rs"),
        include_str!("../src/utils.rs"),
        include_str!("../src/manifest.rs"),
    ]
    .join("\n")
}

#[test]
fn auth_bootstrap_manifest_routes_are_public_including_path_templates() {
    use sdkwork_web_contract::RouteAuth;
    use sdkwork_web_core::route_path_matches;

    let routes = app_routes();
    let required_public_requests = [
        ("POST", "/app/v3/api/auth/sessions"),
        ("POST", "/app/v3/api/auth/registrations"),
        ("POST", "/app/v3/api/oauth/device_authorizations"),
        (
            "GET",
            "/app/v3/api/oauth/device_authorizations/qr_session_key",
        ),
        (
            "POST",
            "/app/v3/api/oauth/device_authorizations/qr_session_key/scans",
        ),
        (
            "POST",
            "/app/v3/api/oauth/device_authorizations/qr_session_key/session_exchanges",
        ),
        ("GET", "/app/v3/api/oauth/callbacks/github"),
        ("POST", "/app/v3/api/oauth/sessions"),
        ("GET", "/app/v3/api/system/iam/runtime"),
    ];

    for (method, path) in required_public_requests {
        let matched = routes.iter().find(|route| {
            http_method_matches_route(route.method, method) && route_path_matches(route.path, path)
        });
        assert!(
            matched.is_some_and(|route| route.auth == RouteAuth::Public),
            "{method} {path} must match a manifest RouteAuth::Public entry"
        );
    }
}

#[test]
fn iam_anonymous_bootstrap_operation_ids_are_public() {
    use sdkwork_web_contract::RouteAuth;

    let routes = app_routes();
    for operation_id in IAM_ANONYMOUS_BOOTSTRAP_OPERATION_IDS {
        let matched = routes
            .iter()
            .filter(|route| route.operation_id == *operation_id)
            .collect::<Vec<_>>();
        assert!(
            !matched.is_empty(),
            "missing manifest row for anonymous bootstrap operation {operation_id}"
        );
        assert!(
            matched.iter().all(|route| route.auth == RouteAuth::Public),
            "anonymous bootstrap operation {operation_id} must use RouteAuth::Public"
        );
    }
}

#[test]
fn iam_credential_entry_operation_ids_declare_forbid_credential_headers() {
    let routes = app_routes();
    for operation_id in IAM_CREDENTIAL_ENTRY_OPERATION_IDS {
        let matched = routes
            .iter()
            .filter(|route| route.operation_id == *operation_id)
            .collect::<Vec<_>>();
        assert!(
            !matched.is_empty(),
            "missing credential-entry route {operation_id}"
        );
        assert!(
            matched.iter().all(|route| route.forbid_credential_headers),
            "credential-entry route {operation_id} must declare forbidCredentialHeaders"
        );
    }
}

#[test]
fn iam_handler_session_operation_ids_stay_public_for_handler_auth() {
    use sdkwork_web_contract::RouteAuth;

    let routes = app_routes();
    for operation_id in IAM_HANDLER_SESSION_OPERATION_IDS {
        let matched = routes
            .iter()
            .filter(|route| route.operation_id == *operation_id)
            .collect::<Vec<_>>();
        assert!(
            !matched.is_empty(),
            "missing handler-session route {operation_id}"
        );
        assert!(
            matched.iter().all(|route| route.auth == RouteAuth::Public),
            "handler-session route {operation_id} must stay RouteAuth::Public"
        );
    }
}

#[test]
fn iam_session_bound_routes_require_dual_token_in_manifest() {
    use sdkwork_web_contract::RouteAuth;
    use sdkwork_web_core::route_path_matches;

    let routes = app_routes();
    let session_bound = [
        ("GET", "/app/v3/api/oauth/account_links"),
        ("DELETE", "/app/v3/api/oauth/account_links/link_123"),
        ("GET", "/app/v3/api/oauth/grants"),
        ("DELETE", "/app/v3/api/oauth/grants/grant_123"),
        ("GET", "/app/v3/api/iam/users/current"),
        ("GET", "/app/v3/api/iam/organizations"),
    ];

    for (method, path) in session_bound {
        let matched = routes.iter().find(|route| {
            http_method_matches_route(route.method, method) && route_path_matches(route.path, path)
        });
        assert!(
            matched.is_some_and(|route| route.auth == RouteAuth::DualToken),
            "{method} {path} must be RouteAuth::DualToken"
        );
    }
}

#[test]
fn mounted_app_api_routes_have_manifest_rows_with_expected_auth() {
    use sdkwork_web_contract::RouteAuth;
    use sdkwork_web_core::route_path_matches;

    let routes = app_routes();
    let expectations: &[(&str, &str, RouteAuth)] = &[
        // Anonymous auth bootstrap (IAM_LOGIN_INTEGRATION_SPEC §5)
        ("POST", "/app/v3/api/auth/sessions", RouteAuth::Public),
        ("POST", "/app/v3/api/auth/registrations", RouteAuth::Public),
        (
            "POST",
            "/app/v3/api/auth/sessions/login_context_selection",
            RouteAuth::Public,
        ),
        (
            "POST",
            "/app/v3/api/auth/sessions/organization_selection",
            RouteAuth::Public,
        ),
        (
            "POST",
            "/app/v3/api/auth/sessions/refresh",
            RouteAuth::Public,
        ),
        (
            "POST",
            "/app/v3/api/auth/password_reset_requests",
            RouteAuth::Public,
        ),
        (
            "POST",
            "/app/v3/api/auth/password_resets",
            RouteAuth::Public,
        ),
        // QR / OAuth device authorization flow
        (
            "POST",
            "/app/v3/api/oauth/device_authorizations",
            RouteAuth::Public,
        ),
        (
            "GET",
            "/app/v3/api/oauth/device_authorizations/qr_key",
            RouteAuth::Public,
        ),
        (
            "POST",
            "/app/v3/api/oauth/device_authorizations/qr_key/scans",
            RouteAuth::Public,
        ),
        (
            "POST",
            "/app/v3/api/oauth/device_authorizations/qr_key/password_completions",
            RouteAuth::Public,
        ),
        (
            "POST",
            "/app/v3/api/oauth/device_authorizations/qr_key/session_exchanges",
            RouteAuth::Public,
        ),
        // OAuth login bootstrap
        ("GET", "/app/v3/api/oauth/providers", RouteAuth::Public),
        (
            "POST",
            "/app/v3/api/oauth/authorization_urls",
            RouteAuth::Public,
        ),
        ("POST", "/app/v3/api/oauth/sessions", RouteAuth::Public),
        (
            "POST",
            "/app/v3/api/oauth/mini_program_sessions",
            RouteAuth::Public,
        ),
        (
            "GET",
            "/app/v3/api/oauth/callbacks/github",
            RouteAuth::Public,
        ),
        (
            "POST",
            "/app/v3/api/oauth/callbacks/github",
            RouteAuth::Public,
        ),
        // Public runtime metadata
        ("GET", "/app/v3/api/system/iam/runtime", RouteAuth::Public),
        (
            "GET",
            "/app/v3/api/system/iam/verification_policy",
            RouteAuth::Public,
        ),
        (
            "GET",
            "/app/v3/api/system/iam/account_binding_policy",
            RouteAuth::Public,
        ),
        // Handler-validated session routes (framework public)
        (
            "GET",
            "/app/v3/api/auth/sessions/current",
            RouteAuth::Public,
        ),
        (
            "PATCH",
            "/app/v3/api/auth/sessions/current",
            RouteAuth::Public,
        ),
        (
            "DELETE",
            "/app/v3/api/auth/sessions/current",
            RouteAuth::Public,
        ),
        (
            "GET",
            "/app/v3/api/oauth/account_links",
            RouteAuth::DualToken,
        ),
        (
            "DELETE",
            "/app/v3/api/oauth/account_links/link_1",
            RouteAuth::DualToken,
        ),
        ("GET", "/app/v3/api/oauth/grants", RouteAuth::DualToken),
        (
            "DELETE",
            "/app/v3/api/oauth/grants/grant_1",
            RouteAuth::DualToken,
        ),
        ("GET", "/app/v3/api/iam/users/current", RouteAuth::DualToken),
        ("GET", "/app/v3/api/iam/organizations", RouteAuth::DualToken),
        (
            "GET",
            "/app/v3/api/iam/departments/tree",
            RouteAuth::DualToken,
        ),
    ];

    for (method, path, expected_auth) in expectations {
        let matched = routes.iter().find(|route| {
            http_method_matches_route(route.method, method) && route_path_matches(route.path, path)
        });
        assert!(
            matched.is_some_and(|route| route.auth == *expected_auth),
            "{method} {path} must be manifest {expected_auth:?}"
        );
    }
}

fn http_method_matches_route(route_method: HttpMethod, method: &str) -> bool {
    matches!(
        (route_method, method),
        (HttpMethod::Get, "GET")
            | (HttpMethod::Post, "POST")
            | (HttpMethod::Put, "PUT")
            | (HttpMethod::Patch, "PATCH")
            | (HttpMethod::Delete, "DELETE")
    )
}

#[test]
fn exposes_standard_app_prefix() {
    assert_eq!(APP_API_PREFIX, "/app/v3/api");
}

#[test]
fn exposes_surface_named_rust_integration_entrypoints() {
    assert!(!app_routes().is_empty());
}

#[test]
fn app_routes_own_auth_sessions_and_current_user() {
    let routes = app_routes();

    assert!(routes.contains(&HttpRoute::credential_entry_public(
        HttpMethod::Post,
        "/app/v3/api/auth/sessions",
        "auth",
        "sessions.create",
    )));
    assert!(routes.contains(&HttpRoute::credential_entry_public(
        HttpMethod::Post,
        "/app/v3/api/auth/registrations",
        "auth",
        "registrations.create",
    )));
    assert!(routes.contains(&HttpRoute::public(
        HttpMethod::Get,
        "/app/v3/api/auth/sessions/current",
        "auth",
        "sessions.current.retrieve",
    )));
    assert!(routes.contains(
        &HttpRoute::dual_token(
            HttpMethod::Get,
            "/app/v3/api/iam/users/current",
            "iam",
            "users.current.retrieve",
        )
        .with_required_permission("iam:self")
    ));
    assert!(routes.contains(&HttpRoute::public(
        HttpMethod::Get,
        "/app/v3/api/system/iam/runtime",
        "system",
        "iam.runtime.retrieve",
    )));
    assert!(routes.contains(&HttpRoute::public(
        HttpMethod::Get,
        "/app/v3/api/system/iam/verification_policy",
        "system",
        "iam.verificationPolicy.retrieve",
    )));
    assert!(routes.contains(&HttpRoute::public(
        HttpMethod::Get,
        "/app/v3/api/system/iam/account_binding_policy",
        "system",
        "iam.accountBindingPolicy.retrieve",
    )));
}

#[test]
fn app_routes_expose_independent_organization_directory_reads() {
    let routes = app_routes();

    for route in [
        HttpRoute::dual_token(
            HttpMethod::Get,
            "/app/v3/api/iam/organizations",
            "iam",
            "organizations.list",
        ),
        HttpRoute::dual_token(
            HttpMethod::Get,
            "/app/v3/api/iam/organizations/tree",
            "iam",
            "organizations.tree.retrieve",
        ),
        HttpRoute::dual_token(
            HttpMethod::Get,
            "/app/v3/api/iam/organization_memberships",
            "iam",
            "organizationMemberships.list",
        ),
        HttpRoute::dual_token(
            HttpMethod::Get,
            "/app/v3/api/iam/departments",
            "iam",
            "departments.list",
        ),
        HttpRoute::dual_token(
            HttpMethod::Get,
            "/app/v3/api/iam/departments/tree",
            "iam",
            "departments.tree.retrieve",
        ),
        HttpRoute::dual_token(
            HttpMethod::Get,
            "/app/v3/api/iam/department_assignments",
            "iam",
            "departmentAssignments.list",
        ),
        HttpRoute::dual_token(
            HttpMethod::Get,
            "/app/v3/api/iam/positions",
            "iam",
            "positions.list",
        ),
        HttpRoute::dual_token(
            HttpMethod::Get,
            "/app/v3/api/iam/position_assignments",
            "iam",
            "positionAssignments.list",
        ),
        HttpRoute::dual_token(
            HttpMethod::Get,
            "/app/v3/api/iam/role_bindings",
            "iam",
            "roleBindings.list",
        ),
    ] {
        assert!(
            routes.contains(&route),
            "missing app IAM directory route: {route:?}"
        );
    }
}

#[test]
fn app_route_manifest_matches_the_standard_operation_surface() {
    let routes = app_routes();
    assert!(
        routes
            .iter()
            .all(|route| !route.path.contains("/auth/qr_login_codes")),
        "retired QR login code routes must not remain in the canonical app IAM manifest",
    );
    assert!(
        routes
            .iter()
            .all(|route| !route.path.contains("/auth/verification_codes")),
        "verification-code delivery routes must be owned by sdkwork-messaging",
    );
    assert!(
        routes
            .iter()
            .all(|route| !route.path.contains("/auth/oauth_")),
        "OAuth runtime routes must live under /app/v3/api/oauth, not /app/v3/api/auth",
    );
    assert!(
        routes
            .iter()
            .all(|route| !route.path.contains("/open_platform/")),
        "appbase OAuth must not expose legacy open_platform route paths",
    );
    assert!(
        routes.iter().all(|route| route.tag != "open_platform"),
        "appbase OAuth must not expose legacy open_platform SDK tags",
    );
    for route in [
        HttpRoute::public(
            HttpMethod::Get,
            "/app/v3/api/oauth/providers",
            "oauth",
            "oauth.providers.list",
        ),
        HttpRoute::credential_entry_public(
            HttpMethod::Post,
            "/app/v3/api/oauth/authorization_urls",
            "oauth",
            "oauth.authorizationUrls.create",
        ),
        HttpRoute::dual_token(
            HttpMethod::Post,
            "/app/v3/api/oauth/authorizations/{authorizationStateId}/completions",
            "oauth",
            "oauth.authorizations.completions.create",
        ),
        HttpRoute::credential_entry_public(
            HttpMethod::Post,
            "/app/v3/api/oauth/device_authorizations",
            "oauth",
            "oauth.deviceAuthorizations.create",
        ),
        HttpRoute::public(
            HttpMethod::Get,
            "/app/v3/api/oauth/device_authorizations/{deviceAuthorizationId}",
            "oauth",
            "oauth.deviceAuthorizations.retrieve",
        ),
        HttpRoute::public(
            HttpMethod::Post,
            "/app/v3/api/oauth/device_authorizations/{deviceAuthorizationId}/scans",
            "oauth",
            "oauth.deviceAuthorizations.scans.create",
        ),
        HttpRoute::credential_entry_public(
            HttpMethod::Post,
            "/app/v3/api/oauth/device_authorizations/{deviceAuthorizationId}/password_completions",
            "oauth",
            "oauth.deviceAuthorizations.passwordCompletions.create",
        ),
        HttpRoute::public(
            HttpMethod::Post,
            "/app/v3/api/oauth/device_authorizations/{deviceAuthorizationId}/session_exchanges",
            "oauth",
            "oauth.deviceAuthorizations.sessionExchanges.create",
        ),
        HttpRoute::credential_entry_public(
            HttpMethod::Get,
            "/app/v3/api/oauth/callbacks/{providerCode}",
            "oauth",
            "oauth.callbacks.retrieve",
        ),
        HttpRoute::credential_entry_public(
            HttpMethod::Post,
            "/app/v3/api/oauth/callbacks/{providerCode}",
            "oauth",
            "oauth.callbacks.create",
        ),
        HttpRoute::credential_entry_public(
            HttpMethod::Post,
            "/app/v3/api/oauth/mini_program_sessions",
            "oauth",
            "oauth.miniProgramSessions.create",
        ),
        HttpRoute::credential_entry_public(
            HttpMethod::Post,
            "/app/v3/api/oauth/sessions",
            "oauth",
            "oauth.sessions.create",
        ),
        HttpRoute::dual_token(
            HttpMethod::Get,
            "/app/v3/api/oauth/account_links",
            "oauth",
            "oauth.accountLinks.list",
        ),
        HttpRoute::dual_token(
            HttpMethod::Delete,
            "/app/v3/api/oauth/account_links/{accountLinkId}",
            "oauth",
            "oauth.accountLinks.delete",
        ),
        HttpRoute::dual_token(
            HttpMethod::Get,
            "/app/v3/api/oauth/grants",
            "oauth",
            "oauth.grants.list",
        ),
        HttpRoute::dual_token(
            HttpMethod::Delete,
            "/app/v3/api/oauth/grants/{grantId}",
            "oauth",
            "oauth.grants.delete",
        ),
    ] {
        assert!(
            routes.contains(&route),
            "missing canonical app OAuth route: {route:?}",
        );
    }
    assert!(routes.contains(&HttpRoute::credential_entry_public(
        HttpMethod::Post,
        "/app/v3/api/auth/sessions/login_context_selection",
        "auth",
        "sessions.loginContextSelection.create",
    )));
    assert!(routes.contains(&HttpRoute::credential_entry_public(
        HttpMethod::Post,
        "/app/v3/api/auth/sessions/organization_selection",
        "auth",
        "sessions.organizationSelection.create",
    )));

    let mut operation_ids: Vec<&str> = routes.iter().map(|route| route.operation_id).collect();
    operation_ids.sort();

    assert_eq!(
        operation_ids,
        vec![
            "departmentAssignments.list",
            "departments.list",
            "departments.tree.retrieve",
            "iam.accountBindingPolicy.retrieve",
            "iam.runtime.retrieve",
            "iam.verificationPolicy.retrieve",
            "oauth.accountLinks.delete",
            "oauth.accountLinks.list",
            "oauth.authorizationUrls.create",
            "oauth.authorizations.completions.create",
            "oauth.callbacks.create",
            "oauth.callbacks.retrieve",
            "oauth.deviceAuthorizations.create",
            "oauth.deviceAuthorizations.passwordCompletions.create",
            "oauth.deviceAuthorizations.retrieve",
            "oauth.deviceAuthorizations.scans.create",
            "oauth.deviceAuthorizations.sessionExchanges.create",
            "oauth.grants.delete",
            "oauth.grants.list",
            "oauth.miniProgramSessions.create",
            "oauth.providers.list",
            "oauth.sessions.create",
            "organizationMemberships.list",
            "organizations.list",
            "organizations.tree.retrieve",
            "passwordResetRequests.create",
            "passwordResets.create",
            "positionAssignments.list",
            "positions.list",
            "registrations.create",
            "roleBindings.list",
            "sessions.create",
            "sessions.current.delete",
            "sessions.current.retrieve",
            "sessions.current.update",
            "sessions.loginContextSelection.create",
            "sessions.organizationSelection.create",
            "sessions.refresh",
            "users.current.emailBindings.create",
            "users.current.emailBindings.delete",
            "users.current.password.update",
            "users.current.phoneBindings.create",
            "users.current.phoneBindings.delete",
            "users.current.retrieve",
            "users.current.update",
        ]
    );
}

#[test]
fn app_router_source_does_not_embed_demo_iam_data() {
    let source = app_api_authored_source();

    for forbidden in [
        "t_demo",
        "org_demo",
        "dept_demo",
        "membership_demo",
        "department_assignment_demo",
        "position_demo",
        "position_assignment_demo",
        "role_binding_demo",
    ] {
        assert!(
            !source.contains(forbidden),
            "app IAM router source must not embed demo data token {forbidden}"
        );
    }
}

#[test]
fn app_router_source_does_not_embed_default_local_credentials() {
    let source = app_api_authored_source();

    for forbidden in ["local-default@sdkwork-iam.local", "dev123456", "123456"] {
        assert!(
            !source.contains(forbidden),
            "app IAM router source must not embed default credential token {forbidden}"
        );
    }
}

#[test]
fn app_router_source_does_not_embed_default_local_context_or_predictable_session_tokens() {
    let source = app_api_authored_source();

    for forbidden in [
        "sdkwork-chat-pc",
        "tenant_local",
        "org_local",
        "DEFAULT_APP_ID",
        "DEFAULT_TENANT_ID",
        "DEFAULT_ORGANIZATION_ID",
        "SDKWORK_IAM_LOCAL_",
        "SDKWORK_IAM_BOOTSTRAP_",
        "SDKWORK_APP_ID",
        "sdkwork-local-refresh-",
        "sdkwork-local-session-",
    ] {
        assert!(
            !source.contains(forbidden),
            "app IAM router source must not embed default context or predictable session token marker {forbidden}"
        );
    }
}

#[test]
fn app_router_source_does_not_emit_duplicate_login_session_fields() {
    let source = app_api_authored_source();

    for forbidden in [
        "\"userInfo\"",
        "\"shardingContext\"",
        "\"token\"",
        "session.user ?? session.userInfo",
        "IamShardingContext::from_app_context",
    ] {
        assert!(
            !source.contains(forbidden),
            "app IAM router source must not emit duplicate login/session field {forbidden}"
        );
    }
}

#[test]
fn pc_auth_source_does_not_expose_synthetic_session_construction() {
    let auth_service_source = include_str!(
        "../../../apps/sdkwork-iam-pc/packages/sdkwork-auth-pc-react/src/auth-service.ts"
    );
    let auth_authority_source = include_str!(
        "../../../apps/sdkwork-iam-pc/packages/sdkwork-auth-pc-react/src/auth-authority.ts"
    );
    let auth_local_service_source = include_str!(
        "../../../apps/sdkwork-iam-pc/packages/sdkwork-auth-pc-react/src/auth-local-service.ts"
    );

    for (source_name, source) in [
        ("auth-service", auth_service_source),
        ("auth-authority", auth_authority_source),
        ("auth-local-service", auth_local_service_source),
    ] {
        for forbidden in [
            "createSdkworkSyntheticAuthSession",
            "CreateSdkworkSyntheticAuthSessionOptions",
            "resolveSyntheticSessionKey",
            "toSession?:",
        ] {
            assert!(
                !source.contains(forbidden),
                "{source_name} must not expose synthetic IAM session construction capability: {forbidden}"
            );
        }
    }
}

#[test]
fn app_router_source_does_not_embed_local_directory_fixture_data() {
    let source = app_api_authored_source();

    for forbidden in [
        "user_local_default",
        "Local SDKWork Organization",
        "Local Workspace",
        "Local Developer",
        "department_assignment_local",
        "position_local",
        "position_assignment_local",
        "role_binding_local",
    ] {
        assert!(
            !source.contains(forbidden),
            "app IAM router source must not embed local directory fixture token {forbidden}"
        );
    }
}

#[test]
fn app_router_source_does_not_keep_default_directory_seed_capability() {
    let source = app_api_authored_source();

    for forbidden in [
        "fn seed_default_directory",
        "seed_default_directory(&mut store)",
    ] {
        assert!(
            !source.contains(forbidden),
            "app IAM router source must not keep default local directory seed capability: {forbidden}"
        );
    }
}

#[test]
fn app_router_source_does_not_keep_legacy_open_platform_oauth_paths() {
    let source = app_api_authored_source();

    for forbidden in [
        "/app/v3/api/open_platform",
        "/app/v3/api/auth/oauth_authorization_urls",
        "/app/v3/api/auth/oauth_sessions",
        "\"open_platform\"",
        "qrAuth.sessions",
    ] {
        assert!(
            !source.contains(forbidden),
            "appbase OAuth app-api source must not keep legacy OAuth/open_platform marker {forbidden}"
        );
    }
}

const OPEN_REGISTRATION_TENANT_ID: &str = "100001";

fn test_bootstrap_access_token() -> String {
    bootstrap_access_token_jwt(
        OPEN_REGISTRATION_TENANT_ID,
        sdkwork_iam_web_adapter::platform_runtime_app_id_for_tenant(OPEN_REGISTRATION_TENANT_ID)
            .as_str(),
    )
}

async fn build_postgres_integration_router() -> axum::Router {
    let pool = unified_database_env::integration_database_pool_for_router().await;
    build_sdkwork_iam_app_api_router_with_pool(pool)
        .await
        .expect("router should build")
}

#[tokio::test]
async fn anonymous_login_route_does_not_require_framework_credentials() {
    if !postgres_integration_ready("anonymous_login_route_does_not_require_framework_credentials")
        .await
    {
        return;
    }
    let _guard = lock_local_iam_env();
    unified_database_env::apply_unified_claw_postgres_env();
    ensure_credential_entry_bootstrap_runtime_app().await;
    let router = build_postgres_integration_router().await;
    let bootstrap_access_token = test_bootstrap_access_token();
    let (status, body_text, payload) = request_app_route_with_headers(
        router,
        Method::POST,
        "/app/v3/api/auth/sessions",
        Some(r#"{"grantType":"password","username":"no-such-user@sdkwork-iam.local","password":"wrong"}"#),
        &[("access-token", bootstrap_access_token.as_str())],
    )
    .await;

    assert_eq!(
        StatusCode::UNAUTHORIZED,
        status,
        "invalid login credentials should reach IAM business validation: {body_text}"
    );
    assert_eq!(
        payload["code"].as_i64(),
        Some(i64::from(
            iam_wire_result_code(StatusCode::UNAUTHORIZED, "iam_invalid_credentials").as_i32(),
        )),
        "login must not fail with framework missing-credentials before IAM business validation: {body_text}"
    );
}

#[tokio::test]
async fn parameterized_public_oauth_device_routes_skip_framework_auth() {
    if !postgres_integration_ready("parameterized_public_oauth_device_routes_skip_framework_auth")
        .await
    {
        return;
    }
    let _guard = lock_local_iam_env();
    unified_database_env::apply_unified_claw_postgres_env();
    ensure_credential_entry_bootstrap_runtime_app().await;
    let router = build_postgres_integration_router().await;
    let bootstrap_access_token = test_bootstrap_access_token();

    let (create_status, create_body, create_payload) = request_app_route_with_headers(
        router.clone(),
        Method::POST,
        "/app/v3/api/oauth/device_authorizations",
        Some(r#"{"purpose":"login"}"#),
        &[("access-token", bootstrap_access_token.as_str())],
    )
    .await;
    assert_eq!(
        StatusCode::OK,
        create_status,
        "device authorization create must succeed: {create_body}"
    );
    let session_key = create_payload["data"]["sessionKey"]
        .as_str()
        .expect("session key");

    let (poll_status, poll_body, _) = request_app_route_with_headers(
        router,
        Method::GET,
        &format!("/app/v3/api/oauth/device_authorizations/{session_key}"),
        None,
        &[
            ("origin", "https://chat.example.test"),
            ("access-token", bootstrap_access_token.as_str()),
        ],
    )
    .await;
    assert_ne!(
        StatusCode::UNAUTHORIZED,
        poll_status,
        "QR poll route must not require framework credentials: {poll_body}"
    );
    assert_ne!(
        StatusCode::FORBIDDEN,
        poll_status,
        "QR poll route must not fail CORS before handler: {poll_body}"
    );
}

#[tokio::test]
async fn app_router_does_not_seed_default_local_credentials() {
    if !postgres_integration_ready("app_router_does_not_seed_default_local_credentials").await {
        return;
    }
    let _guard = lock_local_iam_env();
    unified_database_env::apply_unified_claw_postgres_env();
    let router = build_postgres_integration_router().await;
    let (status, body_text, payload) = request_app_route(
        router,
        Method::POST,
        "/app/v3/api/auth/sessions",
        Some(
            r#"{"grantType":"password","username":"local-default@sdkwork-iam.local","password":"dev123456"}"#,
        ),
    )
    .await;

    assert_ne!(
        StatusCode::OK,
        status,
        "default local credentials must not create an app IAM session: {body_text}"
    );
    assert_ne!(
        Some(0),
        payload["code"].as_i64(),
        "default local credentials must not create a success envelope"
    );
}

#[tokio::test]
async fn anonymous_auth_entry_routes_reject_inbound_credential_headers() {
    if !postgres_integration_ready("anonymous_auth_entry_routes_reject_inbound_credential_headers")
        .await
    {
        return;
    }
    let (_guard, _snapshot) = set_real_local_iam_runtime_env();
    ensure_credential_entry_bootstrap_runtime_app().await;
    let cases = [
        (
            Method::POST,
            "/app/v3/api/auth/sessions",
            r#"{"grantType":"password","username":"entry-user@sdkwork-iam.local","password":"dev123456"}"#,
        ),
        (
            Method::POST,
            "/app/v3/api/auth/registrations",
            r#"{"confirmPassword":"dev123456","email":"entry-user@sdkwork-iam.local","password":"dev123456","username":"entry-user"}"#,
        ),
        (
            Method::POST,
            "/app/v3/api/oauth/authorization_urls",
            r#"{"provider":"github","redirectUri":"https://app.sdkwork.ai/auth/callback"}"#,
        ),
        (
            Method::POST,
            "/app/v3/api/oauth/device_authorizations",
            r#"{"purpose":"login"}"#,
        ),
        (
            Method::POST,
            "/app/v3/api/oauth/mini_program_sessions",
            r#"{"providerCode":"wechat_mini_program","code":"mini-program-code"}"#,
        ),
        (
            Method::POST,
            "/app/v3/api/auth/sessions/login_context_selection",
            r#"{"continuationToken":"continuation-token","loginScope":"TENANT"}"#,
        ),
        (
            Method::POST,
            "/app/v3/api/auth/sessions/organization_selection",
            r#"{"continuationToken":"continuation-token","organizationId":"org_configured"}"#,
        ),
        (
            Method::POST,
            "/app/v3/api/oauth/sessions",
            r#"{"provider":"github","code":"oauth-code","state":"oauth-state"}"#,
        ),
    ];

    let router = build_postgres_integration_router().await;
    let bootstrap_access_token = test_bootstrap_access_token();

    for (method, path, body) in cases {
        let (status, body_text, payload) = request_app_route_with_headers(
            router.clone(),
            method,
            path,
            Some(body),
            &[
                ("authorization", "Bearer stale-auth-token"),
                ("access-token", bootstrap_access_token.as_str()),
                ("x-sdkwork-tenant-id", "t_stale"),
            ],
        )
        .await;

        assert_eq!(
            StatusCode::BAD_REQUEST,
            status,
            "{path} must reject credential headers before anonymous auth entry handling: {body_text}"
        );
        assert_credential_entry_header_rejection(path, &payload, &body_text);
    }
}

fn assert_credential_entry_header_rejection(path: &str, payload: &Value, body_text: &str) {
    if payload.get("code").and_then(Value::as_str) == Some("iam_login_credential_headers_forbidden")
    {
        return;
    }
    assert_eq!(
        payload.get("status").and_then(Value::as_u64),
        Some(400),
        "{path} must reject inbound credential/context headers: {body_text}"
    );
    let detail = payload
        .get("detail")
        .and_then(Value::as_str)
        .unwrap_or_default();
    assert!(
        detail.contains("authorization")
            || detail.contains("x-sdkwork-tenant-id")
            || detail.contains("credential-entry"),
        "{path} must reject inbound credential/context headers: {body_text}"
    );
}

#[tokio::test]
async fn app_directory_routes_require_real_session_context() {
    if !postgres_integration_ready("app_directory_routes_require_real_session_context").await {
        return;
    }
    let _guard = lock_local_iam_env();
    unified_database_env::apply_unified_claw_postgres_env();
    let router = build_postgres_integration_router().await;

    for path in [
        "/app/v3/api/iam/organizations",
        "/app/v3/api/iam/organizations/tree",
        "/app/v3/api/iam/organization_memberships",
        "/app/v3/api/iam/departments",
        "/app/v3/api/iam/departments/tree",
        "/app/v3/api/iam/department_assignments",
        "/app/v3/api/iam/positions",
        "/app/v3/api/iam/position_assignments",
        "/app/v3/api/iam/role_bindings",
    ] {
        let (status, body_text, payload) =
            request_app_route(router.clone(), Method::GET, path, None).await;

        assert_ne!(
            StatusCode::OK,
            status,
            "{path} must not return local directory fixture data without a session: {body_text}"
        );
        assert_ne!(Some(0), payload["code"].as_i64(), "{path}");
        assert!(
            !body_text.contains("user_local_default"),
            "{path} must not expose local directory fixture users: {body_text}"
        );
    }
}

#[tokio::test]
async fn authenticated_app_directory_routes_read_registered_local_store() {
    if !postgres_integration_ready("authenticated_app_directory_routes_read_registered_local_store")
        .await
    {
        return;
    }
    let (_guard, _snapshot) = set_real_local_iam_runtime_env();
    reset_iam_tenants_for_open_registration().await;
    let router = build_postgres_integration_router().await;
    let unique = format!(
        "{:x}",
        std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .expect("clock should be after unix epoch")
            .as_nanos()
    );
    let username = format!("directory-user-{unique}");
    let registration_body = format!(
        r#"{{"confirmPassword":"dev123456","email":"{username}@sdkwork-iam.local","password":"dev123456","username":"{username}"}}"#
    );
    let (registration_status, registration_body, registration) = request_app_route(
        router.clone(),
        Method::POST,
        "/app/v3/api/auth/registrations",
        Some(registration_body.as_str()),
    )
    .await;
    assert_eq!(
        StatusCode::OK,
        registration_status,
        "registration should create a local session for auth-only IAM runtime coverage: {registration_body}"
    );
    assert_eq!(0, registration["code"].as_i64().unwrap());
    let session_data = resolve_session_data_after_auth_response(
        router.clone(),
        registration["data"].clone(),
        "TENANT",
        None,
    )
    .await;
    let auth_token = session_data["authToken"]
        .as_str()
        .expect("registration should return auth token after login context selection");
    let access_token = session_data["accessToken"]
        .as_str()
        .expect("registration should return access token after login context selection");
    let user_id = session_data["user"]["id"]
        .as_str()
        .expect("registration should return user id");

    let pg = unified_database_env::postgres_pool_for_integration_tests().await;

    let (current_status, current_body, _) = request_app_route_with_auth(
        router.clone(),
        Method::GET,
        "/app/v3/api/auth/sessions/current",
        None,
        auth_token,
        access_token,
    )
    .await;
    assert_eq!(
        StatusCode::OK,
        current_status,
        "registered session should resolve through app-api session handlers: {current_body}"
    );

    let resolved = sdkwork_iam_web_adapter::resolve_iam_app_context_from_dual_tokens(
        &pg,
        auth_token,
        access_token,
    )
    .await;
    assert!(
        resolved.is_some(),
        "registered session must resolve through IAM database dual-token adapter before directory reads"
    );

    let membership_paths = ["/app/v3/api/iam/organization_memberships"];
    for path in membership_paths {
        let (status, body_text, payload) = request_app_route_with_auth(
            router.clone(),
            Method::GET,
            path,
            None,
            auth_token,
            access_token,
        )
        .await;

        assert_eq!(
            StatusCode::OK,
            status,
            "{path} must read the registered user's local IAM directory store: {body_text}"
        );
        assert_eq!(
            payload["code"].as_i64(),
            Some(0),
            "{path} must return the standard success envelope for authenticated local directory reads"
        );
        assert!(
            payload["data"]["items"].is_array(),
            "{path} must return a paged app SDK list/tree payload: {body_text}"
        );
        assert!(
            body_text.contains(user_id),
            "{path} must include the registered user's stored directory relation: {body_text}"
        );
        for forbidden in [
            "t_demo",
            "org_demo",
            "dept_demo",
            "membership_demo",
            "user_local_default",
            "role_binding_demo",
        ] {
            assert!(
                !body_text.contains(forbidden),
                "{path} must not expose demo IAM token {forbidden}: {body_text}"
            );
        }
    }

    for path in [
        "/app/v3/api/iam/organizations",
        "/app/v3/api/iam/organizations/tree",
        "/app/v3/api/iam/departments",
        "/app/v3/api/iam/departments/tree",
        "/app/v3/api/iam/department_assignments",
        "/app/v3/api/iam/position_assignments",
    ] {
        let (status, body_text, payload) = request_app_route_with_auth(
            router.clone(),
            Method::GET,
            path,
            None,
            auth_token,
            access_token,
        )
        .await;

        assert_eq!(
            StatusCode::OK,
            status,
            "{path} must allow app_user directory browse with tenant-scoped empty results: {body_text}"
        );
        assert_eq!(
            payload["code"].as_i64(),
            Some(0),
            "{path} must return the standard success envelope for app_user directory browse"
        );
        for forbidden in [
            "t_demo",
            "org_demo",
            "dept_demo",
            "membership_demo",
            "user_local_default",
            "role_binding_demo",
        ] {
            assert!(
                !body_text.contains(forbidden),
                "{path} must not expose demo IAM token {forbidden}: {body_text}"
            );
        }
    }

    for path in ["/app/v3/api/iam/positions", "/app/v3/api/iam/role_bindings"] {
        let (status, body_text, payload) = request_app_route_with_auth(
            router.clone(),
            Method::GET,
            path,
            None,
            auth_token,
            access_token,
        )
        .await;

        assert_eq!(
            StatusCode::FORBIDDEN,
            status,
            "{path} must reject app_user members without elevated directory permissions: {body_text}"
        );
        assert_eq!(
            Some(40301),
            payload["code"].as_i64(),
            "{path} must return the standard permission error for app_user members"
        );
    }
}

async fn resolve_session_data_after_auth_response(
    router: axum::Router,
    mut data: Value,
    login_scope: &str,
    organization_id: Option<&str>,
) -> Value {
    loop {
        if data["authToken"].is_string() && data["accessToken"].is_string() {
            return data;
        }

        let challenge_type = data["challengeType"].as_str().unwrap_or_default();
        if challenge_type == "LOGIN_CONTEXT_SELECTION" || challenge_type == "ORGANIZATION_SELECTION"
        {
            let continuation_token = data["continuationToken"]
                .as_str()
                .expect("login context selection should include continuation token");
            let selection_body = if login_scope.eq_ignore_ascii_case("TENANT") {
                json!({
                    "continuationToken": continuation_token,
                    "loginScope": "TENANT",
                    "organizationId": "0"
                })
            } else {
                let organization_id = organization_id
                    .or_else(|| {
                        data["organizations"]
                            .as_array()
                            .and_then(|organizations| organizations.first())
                            .and_then(|organization| organization["id"].as_str())
                    })
                    .expect(
                        "login context selection should include organization id for organization login",
                    );
                json!({
                    "continuationToken": continuation_token,
                    "loginScope": "ORGANIZATION",
                    "organizationId": organization_id
                })
            };
            let (status, body_text, payload) = request_app_route_with_headers(
                router.clone(),
                Method::POST,
                "/app/v3/api/auth/sessions/login_context_selection",
                Some(&selection_body.to_string()),
                &[],
            )
            .await;
            assert_eq!(
                StatusCode::OK,
                status,
                "login context selection should complete registered member session: {body_text}"
            );
            assert_eq!(
                payload["code"].as_i64(),
                Some(0),
                "login context selection should succeed for registered member session"
            );
            data = payload["data"].clone();
            continue;
        }

        panic!("unexpected auth response without session tokens: {data}");
    }
}

async fn request_app_route(
    router: axum::Router,
    method: Method,
    path: &str,
    body: Option<&str>,
) -> (StatusCode, String, Value) {
    ensure_credential_entry_bootstrap_runtime_app().await;
    let bootstrap_access_token = test_bootstrap_access_token();
    request_app_route_with_headers(
        router,
        method,
        path,
        body,
        &[("access-token", bootstrap_access_token.as_str())],
    )
    .await
}

async fn request_app_route_with_auth(
    router: axum::Router,
    method: Method,
    path: &str,
    body: Option<&str>,
    auth_token: &str,
    access_token: &str,
) -> (StatusCode, String, Value) {
    let authorization = format!("Bearer {auth_token}");
    request_app_route_with_headers(
        router,
        method,
        path,
        body,
        &[
            ("authorization", authorization.as_str()),
            ("access-token", access_token),
        ],
    )
    .await
}

async fn request_app_route_with_headers(
    router: axum::Router,
    method: Method,
    path: &str,
    body: Option<&str>,
    headers: &[(&str, &str)],
) -> (StatusCode, String, Value) {
    let mut builder = Request::builder()
        .method(method)
        .uri(path)
        .header("content-type", "application/json");
    for (name, value) in headers {
        builder = builder.header(*name, *value);
    }
    let response = router
        .oneshot(
            builder
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

#[test]
fn route_paths_use_lower_snake_case_and_operation_ids_use_dotted_lower_camel_case() {
    let allowed_iam_operation_ids = [
        "iam.accountBindingPolicy.retrieve",
        "iam.runtime.retrieve",
        "iam.verificationPolicy.retrieve",
    ];

    for route in app_routes() {
        assert!(!route.path.contains("__"));
        assert!(!route.path.contains("userCenter"));
        assert!(!route.path.contains("{organization_id}"));
        assert!(!route.operation_id.contains('_'));
        assert!(!route.operation_id.starts_with("auth."));
        assert!(
            !route.operation_id.starts_with("iam.")
                || allowed_iam_operation_ids.contains(&route.operation_id)
                || route.operation_id.starts_with("iam.oauth.")
        );
        assert!(route.operation_id.contains('.'));
    }
}

#[test]
fn dual_token_headers_match_java_saas_security_contract() {
    assert_eq!(
        required_dual_token_headers(),
        ["Authorization", "Access-Token"]
    );
}

fn local_iam_env_lock() -> &'static Mutex<()> {
    static ENV_LOCK: OnceLock<Mutex<()>> = OnceLock::new();
    ENV_LOCK.get_or_init(|| Mutex::new(()))
}

fn lock_local_iam_env() -> MutexGuard<'static, ()> {
    local_iam_env_lock()
        .lock()
        .unwrap_or_else(|poisoned| poisoned.into_inner())
}

struct EnvSnapshot {
    values: Vec<(&'static str, Option<String>)>,
}

impl EnvSnapshot {
    fn capture(names: &[&'static str]) -> Self {
        Self {
            values: names
                .iter()
                .map(|name| (*name, std::env::var(name).ok()))
                .collect(),
        }
    }
}

impl Drop for EnvSnapshot {
    fn drop(&mut self) {
        for (name, value) in &self.values {
            match value {
                Some(value) => std::env::set_var(name, value),
                None => std::env::remove_var(name),
            }
        }
    }
}

async fn ensure_credential_entry_bootstrap_runtime_app() {
    if iam_postgres_url().is_none() {
        return;
    }
    unified_database_env::apply_unified_claw_postgres_env();
    let pg = unified_database_env::postgres_pool_for_integration_tests().await;
    ensure_platform_tenant_application(&pg, OPEN_REGISTRATION_TENANT_ID)
        .await
        .expect("platform tenant application should be available for credential-entry routes");
}

async fn reset_iam_tenants_for_open_registration() {
    unified_database_env::apply_unified_claw_postgres_env();
    let pg = unified_database_env::postgres_pool_for_integration_tests().await;
    unified_database_env::deactivate_non_fixture_tenants_for_open_registration(&pg)
        .await
        .expect("deactivate non-fixture tenants for open registration tests");
    sdkwork_iam_bootstrap::upsert_postgres_default_subject(&pg)
        .await
        .expect("default IAM subject should be available for open registration tests");
    ensure_platform_tenant_application(&pg, unified_database_env::OPEN_REGISTRATION_TENANT_ID)
        .await
        .expect("platform tenant application should be available for open registration tests");
}

fn set_real_local_iam_runtime_env() -> (MutexGuard<'static, ()>, EnvSnapshot) {
    let guard = lock_local_iam_env();
    unified_database_env::apply_unified_claw_postgres_env();
    let snapshot = EnvSnapshot::capture(&[
        "SDKWORK_IAM_RATE_LIMIT_MAX_REQUESTS",
        "SDKWORK_IAM_RATE_LIMIT_WINDOW_SECONDS",
    ]);
    std::env::set_var("SDKWORK_IAM_RATE_LIMIT_MAX_REQUESTS", "10000");
    std::env::set_var("SDKWORK_IAM_RATE_LIMIT_WINDOW_SECONDS", "60");

    (guard, snapshot)
}

fn iam_postgres_url() -> Option<String> {
    std::env::var("SDKWORK_IAM_DATABASE_URL")
        .ok()
        .or_else(|| std::env::var("DATABASE_URL").ok())
}

fn skip_unless_postgres_profile_configured(test_name: &str) -> bool {
    if unified_database_env::iam_postgres_profile_configured() {
        return true;
    }
    eprintln!("SKIP {test_name}: IAM postgres profile not configured");
    false
}

async fn postgres_integration_ready(test_name: &str) -> bool {
    if !skip_unless_postgres_profile_configured(test_name) {
        return false;
    }
    unified_database_env::apply_unified_claw_postgres_env();
    let probe = async {
        let pg = unified_database_env::postgres_pool_for_integration_tests().await;
        sqlx::query("SELECT 1").execute(&pg).await
    };
    match tokio::time::timeout(std::time::Duration::from_secs(15), probe).await {
        Ok(Ok(_)) => true,
        Ok(Err(error)) => {
            eprintln!(
                "SKIP {test_name}: IAM postgres unavailable ({error}); release dev database connections and retry"
            );
            false
        }
        Err(_) => {
            eprintln!(
                "SKIP {test_name}: IAM postgres probe timed out; release dev database connections and retry"
            );
            false
        }
    }
}
