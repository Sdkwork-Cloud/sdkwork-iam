use axum::{
    extract::{Path, Query, State},
    http::{HeaderMap, StatusCode},
    response::{IntoResponse, Response},
    routing::{delete, get, patch, post},
    Json, Router,
};
use sdkwork_iam_context_service::{
    is_platform_organization_id, LoginScope, PLATFORM_ORGANIZATION_ID,
};
use sdkwork_iam_web_adapter::{
    account_binding_policy_to_json, contact_binding_allowed, default_account_binding_policy,
    load_account_binding_policy, merge_account_binding_policy, oauth_binding_allowed,
    oauth_login_allowed, validate_enabled_tenant_runtime_app, AccountBindingPolicyDocument,
    ContactBindingActionKind, OauthBindingActionKind,
};
use sdkwork_web_core::WebRequestContext;
use serde_json::{json, Value};
use sqlx::{PgPool, Row};
use std::collections::HashMap;

use crate::{
    contacts::*, directory::*, password_session_bridge::PasswordSessionBridgeResult, passwords::*,
    responses::*, state::*, tokens::*, utils::*, web_bootstrap::*,
};

/// Builds the executable local/private `sdkwork-iam-app-api` router.
///
/// This router is owned by `sdkwork-iam` so product runtimes can compose
/// IAM app-api in embedded mode without duplicating route crates.
pub(crate) async fn build_sdkwork_iam_app_api_router() -> Result<Router, String> {
    LocalIamState::from_env()
        .await
        .map(build_sdkwork_iam_app_api_router_with_state)
}

pub(crate) async fn build_sdkwork_iam_app_api_router_with_web_resolver<R>(
    resolver: R,
) -> Result<Router, String>
where
    R: sdkwork_web_core::WebRequestContextResolver + Clone + Send + Sync + 'static,
{
    LocalIamState::from_env()
        .await
        .map(|state| build_sdkwork_iam_app_api_router_with_state_and_resolver(state, resolver))
}

pub(crate) async fn build_sdkwork_iam_app_api_router_with_local_directory(
) -> Result<(Router, SdkworkIamLocalIamDirectory), String> {
    let state = LocalIamState::from_env().await?;
    let directory = SdkworkIamLocalIamDirectory {
        state: state.clone(),
    };
    Ok((
        build_sdkwork_iam_app_api_router_with_state(state),
        directory,
    ))
}

pub(crate) async fn build_sdkwork_iam_app_api_router_with_pool(
    pool: sdkwork_database_sqlx::DatabasePool,
) -> Result<Router, String> {
    LocalIamState::from_pool(pool)
        .await
        .map(build_sdkwork_iam_app_api_router_with_state)
}

/// OAuth device-authorization (QR login) routes owned by IAM app-api.
pub fn oauth_device_authorization_routes() -> Router<LocalIamState> {
    Router::new()
        .route(
            "/app/v3/api/oauth/device_authorizations",
            post(create_oauth_device_authorization),
        )
        .route(
            "/app/v3/api/oauth/device_authorizations/{device_authorization_id}",
            get(retrieve_oauth_device_authorization),
        )
        .route(
            "/app/v3/api/oauth/device_authorizations/{device_authorization_id}/scans",
            post(create_oauth_device_authorization_scan),
        )
        .route(
            "/app/v3/api/oauth/device_authorizations/{device_authorization_id}/password_completions",
            post(create_oauth_device_authorization_password_completion),
        )
        .route(
            "/app/v3/api/oauth/device_authorizations/{device_authorization_id}/session_exchanges",
            post(create_oauth_device_authorization_session_exchange),
        )
}

fn build_sdkwork_iam_app_api_router_with_state(state: LocalIamState) -> Router {
    wrap_router_with_web_framework(&state, build_sdkwork_iam_app_api_core_router(state.clone()))
}

fn build_sdkwork_iam_app_api_router_with_state_and_resolver<R>(
    state: LocalIamState,
    resolver: R,
) -> Router
where
    R: sdkwork_web_core::WebRequestContextResolver + Clone + Send + Sync + 'static,
{
    wrap_router_with_web_framework_resolver(build_sdkwork_iam_app_api_core_router(state), resolver)
}

fn build_sdkwork_iam_app_api_core_router(state: LocalIamState) -> Router {
    Router::new()
        .route("/app/v3/api/auth/sessions", post(create_session))
        .route(
            "/app/v3/api/auth/sessions/login_context_selection",
            post(create_session_login_context_selection),
        )
        .route(
            "/app/v3/api/auth/sessions/organization_selection",
            post(create_session_organization_selection),
        )
        .route(
            "/app/v3/api/auth/sessions/current",
            delete(delete_current_session)
                .get(retrieve_current_session)
                .patch(update_current_session),
        )
        .route("/app/v3/api/auth/sessions/refresh", post(refresh_session))
        .route("/app/v3/api/auth/registrations", post(create_registration))
        .route(
            "/app/v3/api/auth/password_reset_requests",
            post(create_password_reset_request),
        )
        .route(
            "/app/v3/api/auth/password_resets",
            post(create_password_reset),
        )
        .route("/app/v3/api/oauth/providers", get(list_oauth_providers))
        .route(
            "/app/v3/api/oauth/authorization_urls",
            post(create_oauth_authorization_url),
        )
        .merge(oauth_device_authorization_routes())
        .route(
            "/app/v3/api/oauth/callbacks/{provider_code}",
            get(handle_oauth_callback_get).post(handle_oauth_callback_post),
        )
        .route(
            "/app/v3/api/oauth/mini_program_sessions",
            post(create_oauth_mini_program_session),
        )
        .route("/app/v3/api/oauth/sessions", post(create_oauth_session))
        .route(
            "/app/v3/api/oauth/account_links",
            get(list_oauth_account_links),
        )
        .route(
            "/app/v3/api/oauth/account_links/{account_link_id}",
            delete(delete_oauth_account_link),
        )
        .route("/app/v3/api/oauth/grants", get(list_oauth_grants))
        .route(
            "/app/v3/api/oauth/grants/{grant_id}",
            delete(delete_oauth_grant),
        )
        .route(
            "/app/v3/api/oauth/authorizations/{authorization_state_id}/completions",
            post(complete_oauth_authorization),
        )
        .route(
            "/app/v3/api/iam/users/current",
            get(retrieve_current_user).patch(update_current_user),
        )
        .route(
            "/app/v3/api/iam/users/current/password",
            patch(update_current_user_password),
        )
        .route(
            "/app/v3/api/iam/users/current/email_bindings",
            post(create_current_user_email_binding).delete(delete_current_user_email_binding),
        )
        .route(
            "/app/v3/api/iam/users/current/phone_bindings",
            post(create_current_user_phone_binding).delete(delete_current_user_phone_binding),
        )
        .route("/app/v3/api/iam/organizations", get(list_organizations))
        .route(
            "/app/v3/api/iam/organizations/tree",
            get(retrieve_organization_tree),
        )
        .route(
            "/app/v3/api/iam/organization_memberships",
            get(list_organization_memberships),
        )
        .route("/app/v3/api/iam/departments", get(list_departments))
        .route(
            "/app/v3/api/iam/departments/tree",
            get(retrieve_department_tree),
        )
        .route(
            "/app/v3/api/iam/department_assignments",
            get(list_department_assignments),
        )
        .route("/app/v3/api/iam/positions", get(list_positions))
        .route(
            "/app/v3/api/iam/position_assignments",
            get(list_position_assignments),
        )
        .route("/app/v3/api/iam/role_bindings", get(list_role_bindings))
        .route("/app/v3/api/system/iam/runtime", get(retrieve_runtime))
        .route(
            "/app/v3/api/system/iam/verification_policy",
            get(retrieve_verification_policy),
        )
        .route(
            "/app/v3/api/system/iam/account_binding_policy",
            get(retrieve_account_binding_policy),
        )
        .with_state(state)
}

fn postgres_pool_or_error(state: &LocalIamState) -> Result<&PgPool, Response> {
    state.pool.as_postgres().ok_or_else(|| {
        appbase_error(
            StatusCode::SERVICE_UNAVAILABLE,
            "iam_database_unavailable",
            "local IAM app-api requires a PostgreSQL database pool",
        )
    })
}

async fn effective_account_binding_policy(
    state: &LocalIamState,
    pg: &PgPool,
    tenant_id: Option<&str>,
) -> AccountBindingPolicyDocument {
    let stored = if let Some(tenant_id) = tenant_id.filter(|value| !value.is_empty()) {
        load_account_binding_policy(pg, tenant_id)
            .await
            .unwrap_or_else(|_| default_account_binding_policy())
    } else {
        default_account_binding_policy()
    };
    merge_account_binding_policy(stored, &state.config.account_binding_policy_overrides())
}

async fn effective_public_account_binding_policy(
    state: &LocalIamState,
    pg: &PgPool,
) -> AccountBindingPolicyDocument {
    let tenant_id = crate::directory::resolve_open_registration_tenant_id(pg)
        .await
        .ok();
    effective_account_binding_policy(state, pg, tenant_id.as_deref()).await
}

fn contact_binding_action_for_user(
    user: &LocalIamUser,
    kind: ContactBindingKind,
    unbind: bool,
) -> ContactBindingActionKind {
    if unbind {
        return match kind {
            ContactBindingKind::Email => ContactBindingActionKind::UnbindEmail,
            ContactBindingKind::Phone => ContactBindingActionKind::UnbindPhone,
        };
    }

    match kind {
        ContactBindingKind::Email => {
            if user
                .email
                .as_ref()
                .is_some_and(|value| !crate::is_blank(Some(value)))
            {
                ContactBindingActionKind::ChangeEmail
            } else {
                ContactBindingActionKind::BindEmail
            }
        }
        ContactBindingKind::Phone => {
            if user
                .phone
                .as_ref()
                .is_some_and(|value| !crate::is_blank(Some(value)))
            {
                ContactBindingActionKind::ChangePhone
            } else {
                ContactBindingActionKind::BindPhone
            }
        }
    }
}

async fn enforce_rate_limit(
    state: &LocalIamState,
    tenant_id: &str,
    bucket: &str,
) -> Option<Response> {
    let scope_tenant_id = if tenant_id.trim().is_empty() {
        LOCAL_EPHEMERAL_SCOPE
    } else {
        tenant_id
    };
    let Ok(pg) = postgres_pool_or_error(&state) else {
        return Some(
            postgres_pool_or_error(&state)
                .err()
                .expect("error response"),
        );
    };
    match crate::ephemeral::check_rate_limit(
        pg,
        scope_tenant_id,
        bucket,
        state.config.rate_limit_max_requests,
        state.config.rate_limit_window_seconds,
    )
    .await
    {
        Ok(true) => None,
        Ok(false) => Some(appbase_error(
            StatusCode::TOO_MANY_REQUESTS,
            "iam_rate_limited",
            "too many requests — try again later",
        )),
        Err(_) => Some(appbase_error(
            StatusCode::SERVICE_UNAVAILABLE,
            "iam_ephemeral_unavailable",
            "ephemeral IAM state is temporarily unavailable",
        )),
    }
}

async fn enforce_ephemeral_rate_limit(state: &LocalIamState, bucket: &str) -> Option<Response> {
    match crate::ephemeral_pool::check_rate_limit(
        &state.pool,
        LOCAL_EPHEMERAL_SCOPE,
        bucket,
        state.config.rate_limit_max_requests,
        state.config.rate_limit_window_seconds,
    )
    .await
    {
        Ok(true) => None,
        Ok(false) => Some(appbase_error(
            StatusCode::TOO_MANY_REQUESTS,
            "iam_rate_limited",
            "too many requests — try again later",
        )),
        Err(_) => Some(appbase_error(
            StatusCode::SERVICE_UNAVAILABLE,
            "iam_ephemeral_unavailable",
            "ephemeral IAM state is temporarily unavailable",
        )),
    }
}

async fn create_session(
    State(state): State<LocalIamState>,
    ctx: WebRequestContext,
    headers: HeaderMap,
    Json(body): Json<Value>,
) -> Response {
    if let Some(response) = reject_login_credential_headers(&headers) {
        return response;
    }
    let tenant_id = match require_credential_entry_tenant_id(&ctx) {
        Ok(tenant_id) => tenant_id,
        Err(response) => return response,
    };
    if let Some(sqlite) = state.pool.as_sqlite() {
        let runtime_app_id = match ctx
            .principal
            .as_ref()
            .map(|principal| principal.app_id().trim())
            .filter(|value| !value.is_empty())
        {
            Some(app_id) => app_id,
            None => {
                return appbase_error(
                    StatusCode::UNAUTHORIZED,
                    "iam_credential_entry_app_required",
                    "credential entry app context is required",
                )
            }
        };
        let username = resolve_login_username(&body);
        if username.is_empty() {
            return appbase_error(
                StatusCode::BAD_REQUEST,
                "iam_invalid_login",
                "username, email, or phone is required",
            );
        }
        if !is_password_grant(&body) {
            return appbase_error(
                StatusCode::BAD_REQUEST,
                "iam_unsupported_grant_type",
                "unsupported authentication grant type",
            );
        }
        let Some(password) = read_password(body.get("password")) else {
            return appbase_error(
                StatusCode::BAD_REQUEST,
                "iam_password_required",
                "password is required",
            );
        };
        if let Some(response) = enforce_ephemeral_rate_limit(
            &state,
            &format!("auth:login:{}", canonical_identity(&username)),
        )
        .await
        {
            return response;
        }
        return match crate::sqlite_sessions::authenticate_password_and_create_session(
            sqlite,
            &state.config,
            &tenant_id,
            runtime_app_id,
            &username,
            &password,
        )
        .await
        {
            crate::sqlite_sessions::SqlitePasswordSessionOutcome::Authenticated(session) => {
                appbase_ok(session_to_json(&session))
            }
            crate::sqlite_sessions::SqlitePasswordSessionOutcome::AccountLocked => {
                account_locked_error()
            }
            crate::sqlite_sessions::SqlitePasswordSessionOutcome::InvalidCredentials => {
                invalid_credentials_error()
            }
            crate::sqlite_sessions::SqlitePasswordSessionOutcome::Failed(error) => appbase_error(
                StatusCode::INTERNAL_SERVER_ERROR,
                "iam_session_create_failed",
                &error,
            ),
        };
    }
    let Ok(pg) = postgres_pool_or_error(&state) else {
        return postgres_pool_or_error(&state)
            .err()
            .expect("error response");
    };
    let runtime_app_id = match resolve_credential_entry_runtime_app(pg, &ctx, tenant_id).await {
        Ok(app_id) => app_id,
        Err(response) => return response,
    };

    let username = resolve_login_username(&body);
    if username.is_empty() {
        return appbase_error(
            StatusCode::BAD_REQUEST,
            "iam_invalid_login",
            "username, email, or phone is required",
        );
    }
    if !is_password_grant(&body) {
        return appbase_error(
            StatusCode::BAD_REQUEST,
            "iam_unsupported_grant_type",
            "unsupported authentication grant type",
        );
    }
    let Some(password) = read_password(body.get("password")) else {
        return appbase_error(
            StatusCode::BAD_REQUEST,
            "iam_password_required",
            "password is required",
        );
    };
    if let Some(response) = enforce_rate_limit(
        &state,
        &tenant_id,
        &format!("auth:login:{}", canonical_identity(&username)),
    )
    .await
    {
        return response;
    }

    match authenticate_password(pg, tenant_id, &username, &password, &state.config).await {
        PasswordAuthenticationOutcome::Authenticated(user) => {
            record_successful_password_login(pg, &state.config, &user, &username).await;
            create_authenticated_session_response(&state, &user, &runtime_app_id).await
        }
        PasswordAuthenticationOutcome::AccountLocked => account_locked_error(),
        PasswordAuthenticationOutcome::InvalidCredentials => {
            crate::security_events::record_login_failed(
                pg,
                tenant_id,
                &canonical_identity(&username),
                "invalid_credentials",
            )
            .await;
            invalid_credentials_error()
        }
    }
}

async fn create_session_organization_selection(
    State(state): State<LocalIamState>,
    headers: HeaderMap,
    Json(body): Json<Value>,
) -> Response {
    if let Some(response) = reject_login_credential_headers(&headers) {
        return response;
    }
    let Some(continuation_token) = optional_string(body.get("continuationToken"))
        .or_else(|| optional_string(body.get("continuation_token")))
    else {
        return appbase_error(
            StatusCode::BAD_REQUEST,
            "iam_login_continuation_required",
            "login continuation token is required",
        );
    };
    let Some(organization_id) = optional_string(body.get("organizationId"))
        .or_else(|| optional_string(body.get("organization_id")))
    else {
        return appbase_error(
            StatusCode::BAD_REQUEST,
            "iam_organization_required",
            "organization id is required",
        );
    };
    if is_platform_organization_id(&organization_id) {
        return appbase_error(
            StatusCode::BAD_REQUEST,
            "iam_organization_invalid",
            "organization id 0 is reserved for platform login; use login context selection with TENANT scope",
        );
    };
    let Ok(pg) = postgres_pool_or_error(&state) else {
        return postgres_pool_or_error(&state)
            .err()
            .expect("error response");
    };
    if let Some(response) = enforce_rate_limit(
        &state,
        LOCAL_EPHEMERAL_SCOPE,
        &format!(
            "auth:org_selection:{}",
            &continuation_token[..continuation_token.len().min(16)]
        ),
    )
    .await
    {
        return response;
    }

    let continuation = match crate::ephemeral::take_login_continuation(
        pg,
        LOCAL_EPHEMERAL_SCOPE,
        &continuation_token,
    )
    .await
    {
        Ok(continuation) => continuation,
        Err(error) => {
            return appbase_error(
                StatusCode::SERVICE_UNAVAILABLE,
                "iam_ephemeral_unavailable",
                &error,
            );
        }
    };
    let Some(continuation) = continuation else {
        return appbase_error(
            StatusCode::UNAUTHORIZED,
            "iam_login_continuation_invalid",
            "invalid or expired login continuation",
        );
    };
    if continuation.expire_time < current_millis() {
        return appbase_error(
            StatusCode::UNAUTHORIZED,
            "iam_login_continuation_expired",
            "invalid or expired login continuation",
        );
    }
    if continuation.continuation_kind != "organization"
        && continuation.continuation_kind != "login_context"
    {
        return appbase_error(
            StatusCode::BAD_REQUEST,
            "iam_login_continuation_invalid",
            "invalid login continuation for organization selection",
        );
    }
    if continuation.tenant_id != continuation.user.tenant_id
        || !continuation
            .organization_ids
            .iter()
            .any(|allowed_id| allowed_id == &organization_id)
    {
        return appbase_error(
            StatusCode::FORBIDDEN,
            "iam_organization_selection_forbidden",
            "selected organization is not allowed for this login",
        );
    }
    if !has_active_organization_membership(
        pg,
        &continuation.user.tenant_id,
        &organization_id,
        &continuation.user.id,
    )
    .await
    {
        return appbase_error(
            StatusCode::FORBIDDEN,
            "iam_organization_selection_forbidden",
            "selected organization membership is not active",
        );
    }

    issue_login_continuation_session(&state, pg, continuation, Some(organization_id)).await
}

async fn create_session_login_context_selection(
    State(state): State<LocalIamState>,
    headers: HeaderMap,
    Json(body): Json<Value>,
) -> Response {
    if let Some(response) = reject_login_credential_headers(&headers) {
        return response;
    }
    let Some(continuation_token) = optional_string(body.get("continuationToken"))
        .or_else(|| optional_string(body.get("continuation_token")))
    else {
        return appbase_error(
            StatusCode::BAD_REQUEST,
            "iam_login_continuation_required",
            "login continuation token is required",
        );
    };
    let login_scope = optional_string(body.get("loginScope"))
        .or_else(|| optional_string(body.get("login_scope")))
        .map(|value| value.to_ascii_uppercase());
    let Ok(pg) = postgres_pool_or_error(&state) else {
        return postgres_pool_or_error(&state)
            .err()
            .expect("error response");
    };
    if let Some(response) = enforce_rate_limit(
        &state,
        LOCAL_EPHEMERAL_SCOPE,
        &format!(
            "auth:login_context:{}",
            &continuation_token[..continuation_token.len().min(16)]
        ),
    )
    .await
    {
        return response;
    }

    let continuation = match take_login_continuation_for_context_selection(
        pg,
        &continuation_token,
        login_scope.as_deref(),
        &body,
    )
    .await
    {
        Ok(continuation) => continuation,
        Err(response) => return response,
    };

    let organization_id = match login_scope.as_deref() {
        Some("TENANT") => None,
        Some("ORGANIZATION") => {
            let organization_id = optional_string(body.get("organizationId"))
                .or_else(|| optional_string(body.get("organization_id")));
            let Some(organization_id) = organization_id else {
                return appbase_error(
                    StatusCode::BAD_REQUEST,
                    "iam_organization_required",
                    "organization id is required for organization login",
                );
            };
            if is_platform_organization_id(&organization_id) {
                return appbase_error(
                    StatusCode::BAD_REQUEST,
                    "iam_organization_invalid",
                    "organization id 0 is reserved for platform login; use login context selection with TENANT scope",
                );
            };
            if !continuation
                .organization_ids
                .iter()
                .any(|allowed_id| allowed_id == &organization_id)
            {
                return appbase_error(
                    StatusCode::FORBIDDEN,
                    "iam_login_context_forbidden",
                    "selected organization is not allowed for this login",
                );
            }
            if !has_active_organization_membership(
                pg,
                &continuation.user.tenant_id,
                &organization_id,
                &continuation.user.id,
            )
            .await
            {
                return appbase_error(
                    StatusCode::FORBIDDEN,
                    "iam_login_context_forbidden",
                    "selected organization membership is not active",
                );
            }
            Some(organization_id)
        }
        _ => {
            return appbase_error(
                StatusCode::BAD_REQUEST,
                "iam_login_scope_required",
                "login scope must be TENANT or ORGANIZATION",
            );
        }
    };

    issue_login_continuation_session(&state, pg, continuation, organization_id).await
}

async fn take_login_continuation_for_context_selection(
    pg: &PgPool,
    continuation_token: &str,
    login_scope: Option<&str>,
    body: &Value,
) -> Result<LocalLoginContinuation, Response> {
    let continuation = match crate::ephemeral::take_login_continuation(
        pg,
        LOCAL_EPHEMERAL_SCOPE,
        continuation_token,
    )
    .await
    {
        Ok(continuation) => continuation,
        Err(error) => {
            return Err(appbase_error(
                StatusCode::SERVICE_UNAVAILABLE,
                "iam_ephemeral_unavailable",
                &error,
            ));
        }
    };
    let Some(continuation) = continuation else {
        return Err(appbase_error(
            StatusCode::UNAUTHORIZED,
            "iam_login_continuation_invalid",
            "invalid or expired login continuation",
        ));
    };
    if continuation.expire_time < current_millis() {
        return Err(appbase_error(
            StatusCode::UNAUTHORIZED,
            "iam_login_continuation_expired",
            "invalid or expired login continuation",
        ));
    }
    if continuation.continuation_kind != "login_context"
        && continuation.continuation_kind != "organization"
    {
        return Err(appbase_error(
            StatusCode::BAD_REQUEST,
            "iam_login_continuation_invalid",
            "invalid login continuation for login context selection",
        ));
    }
    if continuation.tenant_id != continuation.user.tenant_id {
        return Err(appbase_error(
            StatusCode::FORBIDDEN,
            "iam_login_context_forbidden",
            "login continuation tenant does not match verified user",
        ));
    }
    if login_scope == Some("ORGANIZATION") {
        let organization_id = optional_string(body.get("organizationId"))
            .or_else(|| optional_string(body.get("organization_id")));
        if organization_id.is_none() {
            return Err(appbase_error(
                StatusCode::BAD_REQUEST,
                "iam_organization_required",
                "organization id is required for organization login",
            ));
        }
        if organization_id
            .as_deref()
            .is_some_and(is_platform_organization_id)
        {
            return Err(appbase_error(
                StatusCode::BAD_REQUEST,
                "iam_organization_invalid",
                "organization id 0 is reserved for platform login; use login context selection with TENANT scope",
            ));
        }
    }
    Ok(continuation)
}

async fn issue_login_continuation_session(
    state: &LocalIamState,
    pg: &PgPool,
    continuation: LocalLoginContinuation,
    organization_id: Option<String>,
) -> Response {
    let session = match create_session_record(
        pg,
        &state.config,
        &continuation.user,
        organization_id,
        continuation.runtime_app_id.as_str(),
    )
    .await
    {
        Ok(session) => session,
        Err(error) => {
            return appbase_error(
                StatusCode::INTERNAL_SERVER_ERROR,
                "iam_session_create_failed",
                &error,
            )
        }
    };

    if let Some(qr_session_key) = continuation.qr_session_key.clone() {
        let session_for_qr = session.clone();
        if let Err(error) = crate::ephemeral::mutate_qr_session(
            pg,
            LOCAL_EPHEMERAL_SCOPE,
            &qr_session_key,
            |qr_session| {
                qr_session.completed_session = Some(session_for_qr);
                qr_session.organization_selection = None;
                qr_session.status = "completed".to_string();
            },
        )
        .await
        {
            return appbase_error(
                StatusCode::SERVICE_UNAVAILABLE,
                "iam_ephemeral_unavailable",
                &error,
            );
        }
    }

    record_successful_password_login(
        pg,
        &state.config,
        &continuation.user,
        &continuation.user.username,
    )
    .await;

    appbase_ok(session_to_json(&session))
}

async fn retrieve_current_session(
    State(state): State<LocalIamState>,
    headers: HeaderMap,
) -> Response {
    if let Some(sqlite) = state.pool.as_sqlite() {
        return match crate::sqlite_sessions::resolve_session_from_headers(
            &state.pool,
            sqlite,
            &headers,
        )
        .await
        {
            Some(session) => appbase_ok(session_to_json(&session)),
            None => iam_session_required_error(),
        };
    }
    let Ok(pg) = postgres_pool_or_error(&state) else {
        return postgres_pool_or_error(&state)
            .err()
            .expect("error response");
    };
    match resolve_session_from_headers(pg, &headers).await {
        Some(mut session) => {
            if let Err(error) =
                crate::tokens::refresh_session_scopes_from_rbac(pg, &state.config, &mut session)
                    .await
            {
                return appbase_error(
                    StatusCode::INTERNAL_SERVER_ERROR,
                    "iam_session_scope_refresh_failed",
                    &error,
                );
            }
            appbase_ok(session_to_json(&session))
        }
        None => iam_session_required_error(),
    }
}

async fn update_current_session(
    State(state): State<LocalIamState>,
    headers: HeaderMap,
    Json(body): Json<Value>,
) -> Response {
    let Ok(pg) = postgres_pool_or_error(&state) else {
        return postgres_pool_or_error(&state)
            .err()
            .expect("error response");
    };
    let Some(session) = resolve_session_from_headers(pg, &headers).await else {
        return iam_session_required_error();
    };

    let login_scope = optional_string(body.get("loginScope"))
        .or_else(|| optional_string(body.get("login_scope")))
        .map(|value| value.to_ascii_uppercase());
    let organization_id = optional_string(body.get("organizationId"))
        .or_else(|| optional_string(body.get("organization_id")));
    let organization_code = optional_string(body.get("organizationCode"))
        .or_else(|| optional_string(body.get("organization_code")));

    if login_scope.is_none() && organization_id.is_none() && organization_code.is_none() {
        return appbase_ok(session_to_json(&session));
    }

    let wants_personal_login = login_scope.as_deref() == Some("TENANT")
        || organization_id
            .as_deref()
            .is_some_and(is_platform_organization_id);

    if wants_personal_login {
        if session.context.login_scope == LoginScope::Tenant {
            return appbase_ok(session_to_json(&session));
        }
        return match rotate_current_session_context(
            pg,
            &state.config,
            &session,
            SessionContextSwitch::Personal,
        )
        .await
        {
            Ok(updated_session) => appbase_ok(session_to_json(&updated_session)),
            Err(error) => appbase_error(
                StatusCode::UNAUTHORIZED,
                "iam_session_update_failed",
                &error,
            ),
        };
    }

    if organization_id.is_some() && organization_code.is_some() {
        return appbase_error(
            StatusCode::BAD_REQUEST,
            "iam_session_update_conflict",
            "organizationId and organizationCode cannot both be provided",
        );
    }

    let resolved_organization = match crate::authorization::resolve_session_organization_for_user(
        pg,
        &session.user.tenant_id,
        &session.user.id,
        organization_id.as_deref(),
        organization_code.as_deref(),
    )
    .await
    {
        Ok(resolved) => resolved,
        Err(error) => {
            return appbase_error(
                StatusCode::INTERNAL_SERVER_ERROR,
                "iam_session_update_failed",
                &error,
            );
        }
    };

    let Some(target_organization_id) = resolved_organization else {
        return appbase_error(
            StatusCode::BAD_REQUEST,
            "iam_session_organization_unavailable",
            "organization is not available for current user",
        );
    };

    if session.context.organization_id.as_deref() == Some(target_organization_id.as_str()) {
        return appbase_ok(session_to_json(&session));
    }

    match rotate_current_session_context(
        pg,
        &state.config,
        &session,
        SessionContextSwitch::Organization(target_organization_id),
    )
    .await
    {
        Ok(updated_session) => appbase_ok(session_to_json(&updated_session)),
        Err(error) => appbase_error(
            StatusCode::UNAUTHORIZED,
            "iam_session_update_failed",
            &error,
        ),
    }
}

async fn delete_current_session(
    State(state): State<LocalIamState>,
    headers: HeaderMap,
) -> Response {
    if let Some(sqlite) = state.pool.as_sqlite() {
        let Some(session) =
            crate::sqlite_sessions::resolve_session_from_headers(&state.pool, sqlite, &headers)
                .await
        else {
            return StatusCode::NO_CONTENT.into_response();
        };
        return match crate::sqlite_sessions::revoke_session(
            sqlite,
            &session.session_id,
            &session.context.tenant_id,
            &session.user.id,
        )
        .await
        {
            Ok(()) => StatusCode::NO_CONTENT.into_response(),
            Err(error) => appbase_error(
                StatusCode::INTERNAL_SERVER_ERROR,
                "iam_session_revoke_failed",
                &error,
            ),
        };
    }
    let Ok(pg) = postgres_pool_or_error(&state) else {
        return postgres_pool_or_error(&state)
            .err()
            .expect("error response");
    };
    let Some(session) = resolve_session_from_headers(pg, &headers).await else {
        return StatusCode::NO_CONTENT.into_response();
    };
    if let Err(error) = remove_session(pg, &state.config, &session).await {
        return appbase_error(
            StatusCode::INTERNAL_SERVER_ERROR,
            "iam_session_revoke_failed",
            &error,
        );
    }
    StatusCode::NO_CONTENT.into_response()
}

async fn refresh_session(State(state): State<LocalIamState>, Json(body): Json<Value>) -> Response {
    let Some(refresh_token) = optional_string(body.get("refreshToken"))
        .or_else(|| optional_string(body.get("refresh_token")))
    else {
        return appbase_error(
            StatusCode::UNAUTHORIZED,
            "iam_refresh_token_required",
            "refresh token is required",
        );
    };
    let Ok(pg) = postgres_pool_or_error(&state) else {
        return postgres_pool_or_error(&state)
            .err()
            .expect("error response");
    };
    if let Some(response) = enforce_rate_limit(&state, LOCAL_EPHEMERAL_SCOPE, "auth:refresh").await
    {
        return response;
    }
    match claim_session_for_refresh(pg, &refresh_token).await {
        Ok(Some(existing_session)) => {
            let previous_session_id = existing_session.session_id.clone();
            match create_session_record(
                pg,
                &state.config,
                &existing_session.user,
                existing_session.context.organization_id.clone(),
                existing_session.context.app_id.as_str(),
            )
            .await
            {
                Ok(session) => {
                    crate::security_events::record_session_refreshed(
                        pg,
                        &session.user.tenant_id,
                        session.context.organization_id.as_deref(),
                        &session.user.id,
                        &previous_session_id,
                        &session.session_id,
                    )
                    .await;
                    appbase_ok(session_to_json(&session))
                }
                Err(error) => appbase_error(
                    StatusCode::INTERNAL_SERVER_ERROR,
                    "iam_session_create_failed",
                    &error,
                ),
            }
        }
        Ok(None) => {
            let _ = handle_refresh_token_reuse(pg, &refresh_token).await;
            appbase_error(
                StatusCode::UNAUTHORIZED,
                "iam_refresh_token_invalid",
                "invalid or expired refresh token",
            )
        }
        Err(error) => appbase_error(
            StatusCode::INTERNAL_SERVER_ERROR,
            "iam_session_refresh_failed",
            &error,
        ),
    }
}

async fn create_registration(
    State(state): State<LocalIamState>,
    ctx: WebRequestContext,
    headers: HeaderMap,
    Json(body): Json<Value>,
) -> Response {
    if let Some(response) = reject_login_credential_headers(&headers) {
        return response;
    }
    let bootstrap_tenant_id = match require_credential_entry_tenant_id(&ctx) {
        Ok(tenant_id) => tenant_id,
        Err(response) => return response,
    };
    let Ok(pg) = postgres_pool_or_error(&state) else {
        return postgres_pool_or_error(&state)
            .err()
            .expect("error response");
    };
    let runtime_app_id =
        match resolve_credential_entry_runtime_app(pg, &ctx, bootstrap_tenant_id).await {
            Ok(app_id) => app_id,
            Err(response) => return response,
        };

    let Some(username) = resolve_registration_username(&body) else {
        return appbase_error(
            StatusCode::BAD_REQUEST,
            "iam_registration_account_required",
            "username, email, or phone is required",
        );
    };
    let Some(password) = read_password(body.get("password")) else {
        return appbase_error(
            StatusCode::BAD_REQUEST,
            "iam_password_required",
            "password is required",
        );
    };
    if !password_is_within_policy(&password, &state.config) {
        return password_policy_violation_error(&state.config);
    }
    if state.config.email_verification_required {
        let registration_email = optional_string(body.get("email"))
            .or_else(|| username.contains('@').then(|| username.clone()));
        if registration_email.is_some() {
            if !fixed_verification_code_allowed(&state.config) {
                return appbase_error(
                    StatusCode::SERVICE_UNAVAILABLE,
                    "iam_verification_unavailable",
                    "email verification is not configured for this environment",
                );
            }
            let Some(code) = optional_string(body.get("verificationCode"))
                .or_else(|| optional_string(body.get("verification_code")))
            else {
                return appbase_error(
                    StatusCode::BAD_REQUEST,
                    "iam_verification_code_required",
                    "verification code is required",
                );
            };
            if let Some(expected) = &state.config.dev_fixed_verify_code {
                if code != *expected {
                    return appbase_error(
                        StatusCode::BAD_REQUEST,
                        "iam_verification_code_invalid",
                        "verification code is invalid",
                    );
                }
            }
        }
    }
    let Some(confirm_password) = read_password(body.get("confirmPassword"))
        .or_else(|| read_password(body.get("confirm_password")))
    else {
        return appbase_error(
            StatusCode::BAD_REQUEST,
            "iam_password_confirmation_required",
            "password confirmation is required",
        );
    };
    if password != confirm_password {
        return appbase_error(
            StatusCode::BAD_REQUEST,
            "iam_password_confirmation_mismatch",
            "password confirmation does not match",
        );
    }
    if let Some(response) = enforce_rate_limit(
        &state,
        bootstrap_tenant_id,
        &format!("auth:register:{username}"),
    )
    .await
    {
        return response;
    }

    let requested_tenant_id =
        optional_string(body.get("tenantId")).or_else(|| optional_string(body.get("tenant_id")));
    let tenant_id = match resolve_bootstrap_registration_tenant(
        pg,
        bootstrap_tenant_id,
        requested_tenant_id.as_deref(),
    )
    .await
    {
        Ok(tenant_id) => tenant_id,
        Err(error) => {
            return appbase_error(
                StatusCode::BAD_REQUEST,
                "iam_registration_tenant_unavailable",
                &error,
            )
        }
    };

    match identity_exists(pg, &tenant_id, &username).await {
        Ok(true) => {
            return appbase_error(
                StatusCode::CONFLICT,
                "iam_account_already_exists",
                "account already exists",
            )
        }
        Err(error) => {
            return appbase_error(
                StatusCode::INTERNAL_SERVER_ERROR,
                "iam_identity_lookup_failed",
                &error,
            )
        }
        Ok(false) => {}
    }
    for identity in [
        optional_string(body.get("email")),
        optional_string(body.get("phone")),
    ]
    .into_iter()
    .flatten()
    {
        match identity_exists(pg, &tenant_id, &identity).await {
            Ok(true) => {
                return appbase_error(
                    StatusCode::CONFLICT,
                    "iam_account_already_exists",
                    "account already exists",
                )
            }
            Err(error) => {
                return appbase_error(
                    StatusCode::INTERNAL_SERVER_ERROR,
                    "iam_identity_lookup_failed",
                    &error,
                )
            }
            Ok(false) => {}
        }
    }

    let directory_seed = match DirectorySeedContext::resolve_for_registration(pg, &tenant_id).await
    {
        Ok(seed) => seed,
        Err(error) => {
            return appbase_error(
                StatusCode::INTERNAL_SERVER_ERROR,
                "iam_directory_seed_failed",
                &error,
            )
        }
    };

    let Some(mut user) = local_user_with_contacts(
        &username,
        optional_string(body.get("email")),
        optional_string(body.get("phone")),
    ) else {
        return appbase_error(
            StatusCode::BAD_REQUEST,
            "iam_registration_account_required",
            "username, email, or phone is required",
        );
    };
    user.tenant_id = tenant_id.clone();
    if let Err(error) = set_user_password(pg, &user, &password, &state.config).await {
        return appbase_error(
            StatusCode::INTERNAL_SERVER_ERROR,
            "iam_registration_failed",
            &error,
        );
    }
    let directory_grant =
        match crate::directory::resolve_registration_directory_grant(pg, &tenant_id).await {
            Ok(grant) => grant,
            Err(error) => {
                return appbase_error(
                    StatusCode::INTERNAL_SERVER_ERROR,
                    "iam_directory_grant_failed",
                    &error,
                )
            }
        };
    if let Err(error) =
        ensure_user_directory_db(pg, &directory_seed, &state.config, &user, directory_grant).await
    {
        return appbase_error(
            StatusCode::INTERNAL_SERVER_ERROR,
            "iam_directory_seed_failed",
            &error,
        );
    }
    crate::audit_events::record_registration(
        pg,
        &state.config,
        &user.tenant_id,
        &user.id,
        &user.username,
        user.email.as_deref(),
        user.phone.as_deref(),
    )
    .await;
    record_successful_password_login(pg, &state.config, &user, &username).await;
    create_authenticated_session_response(&state, &user, &runtime_app_id).await
}

async fn create_password_reset_request(
    State(state): State<LocalIamState>,
    headers: HeaderMap,
    Json(body): Json<Value>,
) -> Response {
    if let Some(response) = reject_login_credential_headers(&headers) {
        return response;
    }
    let Some(account) = resolve_password_reset_account(&body) else {
        return appbase_error(
            StatusCode::BAD_REQUEST,
            "iam_account_required",
            "account is required",
        );
    };
    let Ok(pg) = postgres_pool_or_error(&state) else {
        return postgres_pool_or_error(&state)
            .err()
            .expect("error response");
    };
    if let Some(response) = enforce_rate_limit(
        &state,
        LOCAL_EPHEMERAL_SCOPE,
        &format!("auth:password_reset:{account}"),
    )
    .await
    {
        return response;
    }

    if let Some(user) = load_user_by_account_global(pg, &account).await {
        if fixed_verification_code_allowed(&state.config) {
            let code = state
                .config
                .dev_fixed_verify_code
                .clone()
                .unwrap_or_else(generate_verification_code);
            let reset_request = LocalPasswordResetRequest {
                code,
                expire_time: current_millis() + PASSWORD_RESET_TTL_MILLIS,
                username: user.username.clone(),
            };
            if let Err(error) = crate::ephemeral::upsert_password_reset_request(
                pg,
                &user.tenant_id,
                &canonical_identity(&user.username),
                &reset_request,
            )
            .await
            {
                return appbase_error(
                    StatusCode::SERVICE_UNAVAILABLE,
                    "iam_ephemeral_unavailable",
                    &error,
                );
            }
        }
    }

    appbase_ok(json!({ "accepted": true }))
}

async fn create_password_reset(
    State(state): State<LocalIamState>,
    headers: HeaderMap,
    Json(body): Json<Value>,
) -> Response {
    if let Some(response) = reject_login_credential_headers(&headers) {
        return response;
    }
    let Some(account) = resolve_password_reset_account(&body) else {
        return appbase_error(
            StatusCode::BAD_REQUEST,
            "iam_account_required",
            "account is required",
        );
    };
    let Some(code) = optional_string(body.get("code"))
        .or_else(|| optional_string(body.get("verificationCode")))
        .or_else(|| optional_string(body.get("verification_code")))
    else {
        return appbase_error(
            StatusCode::BAD_REQUEST,
            "iam_verification_code_required",
            "verification code is required",
        );
    };
    let Some(new_password) = read_password(body.get("newPassword"))
        .or_else(|| read_password(body.get("password")))
        .or_else(|| read_password(body.get("new_password")))
    else {
        return appbase_error(
            StatusCode::BAD_REQUEST,
            "iam_new_password_required",
            "new password is required",
        );
    };
    if !password_is_within_policy(&new_password, &state.config) {
        return password_policy_violation_error(&state.config);
    }
    let Some(confirm_password) = read_password(body.get("confirmPassword"))
        .or_else(|| read_password(body.get("confirm_password")))
    else {
        return appbase_error(
            StatusCode::BAD_REQUEST,
            "iam_password_confirmation_required",
            "password confirmation is required",
        );
    };
    if new_password != confirm_password {
        return appbase_error(
            StatusCode::BAD_REQUEST,
            "iam_password_confirmation_mismatch",
            "password confirmation does not match",
        );
    }
    let Ok(pg) = postgres_pool_or_error(&state) else {
        return postgres_pool_or_error(&state)
            .err()
            .expect("error response");
    };
    if let Some(response) = enforce_rate_limit(
        &state,
        LOCAL_EPHEMERAL_SCOPE,
        &format!(
            "auth:password_reset_complete:{}",
            canonical_identity(&account)
        ),
    )
    .await
    {
        return response;
    }
    let Some(user) = load_user_by_account_global(pg, &account).await else {
        return invalid_password_reset_error();
    };

    if let Err(message) = crate::passwords::validate_password_reset_verification(
        pg,
        &state.config,
        &user,
        &account,
        &code,
    )
    .await
    {
        return appbase_error(
            StatusCode::BAD_REQUEST,
            "iam_verification_code_invalid",
            &message,
        );
    }
    if let Err(error) = replace_user_password(pg, &state.config, &user.id, &new_password).await {
        return appbase_error(
            StatusCode::INTERNAL_SERVER_ERROR,
            "iam_password_reset_failed",
            &error,
        );
    }
    if let Err(error) = revoke_sessions_for_username(pg, &user.tenant_id, &user.username).await {
        return appbase_error(
            StatusCode::INTERNAL_SERVER_ERROR,
            "iam_session_revoke_failed",
            &error,
        );
    }
    crate::security_events::record_password_reset_completed(
        pg,
        &user.tenant_id,
        &user.id,
        &account,
    )
    .await;
    appbase_ok(json!({ "completed": true }))
}

async fn list_oauth_providers(
    State(state): State<LocalIamState>,
    ctx: WebRequestContext,
    Query(query): Query<HashMap<String, String>>,
) -> Response {
    let policy = match postgres_pool_or_error(&state) {
        Ok(pg) => effective_public_account_binding_policy(&state, pg).await,
        Err(_) => default_account_binding_policy(),
    };

    if !policy.oauth_login.enabled {
        return match paginate_bounded_json_values(Vec::new(), &query) {
            Ok(payload) => appbase_ok(payload),
            Err(response) => response,
        };
    }

    let pg = state.pool.as_postgres();
    let tenant_id = ctx
        .tenant_id()
        .filter(|value| !value.is_empty())
        .unwrap_or(LOCAL_EPHEMERAL_SCOPE);
    match crate::oauth_login::list_login_enabled_providers(
        pg,
        tenant_id,
        ctx.app_id().filter(|value| !value.is_empty()),
        &policy,
        &state.oauth_login,
    )
    .await
    {
        Ok(items) => match paginate_bounded_json_values(items, &query) {
            Ok(payload) => appbase_ok(payload),
            Err(response) => response,
        },
        Err(error) => appbase_error(
            StatusCode::SERVICE_UNAVAILABLE,
            "iam_oauth_providers_list_failed",
            &error,
        ),
    }
}

async fn create_oauth_authorization_url(
    State(state): State<LocalIamState>,
    ctx: WebRequestContext,
    headers: HeaderMap,
    Json(body): Json<Value>,
) -> Response {
    if let Some(response) = reject_login_credential_headers(&headers) {
        return response;
    }
    let tenant_id = match require_credential_entry_tenant_id(&ctx) {
        Ok(tenant_id) => tenant_id,
        Err(response) => return response,
    };

    let provider = optional_string(body.get("provider"))
        .or_else(|| optional_string(body.get("providerCode")))
        .or_else(|| optional_string(body.get("provider_code")));
    let Some(provider) = provider else {
        return appbase_error(
            StatusCode::BAD_REQUEST,
            "iam_oauth_provider_required",
            "OAuth provider is required",
        );
    };
    let redirect_uri = optional_string(body.get("redirectUri"))
        .or_else(|| optional_string(body.get("redirect_uri")))
        .or_else(|| optional_string(body.get("redirectURL")));
    let Some(redirect_uri) = redirect_uri else {
        return appbase_error(
            StatusCode::BAD_REQUEST,
            "iam_oauth_redirect_uri_required",
            "OAuth redirectUri is required",
        );
    };

    let pg = match postgres_pool_or_error(&state) {
        Ok(pg) => pg,
        Err(response) => return response,
    };
    let runtime_app_id = match resolve_credential_entry_runtime_app(pg, &ctx, tenant_id).await {
        Ok(app_id) => app_id,
        Err(response) => return response,
    };
    if let Some(response) = enforce_rate_limit(
        &state,
        &tenant_id,
        &format!("oauth:authorize:{}", canonical_identity(&provider)),
    )
    .await
    {
        return response;
    }
    let policy = effective_public_account_binding_policy(&state, pg).await;
    if !oauth_login_allowed(&policy, Some(provider.as_str())) {
        return appbase_error(
            StatusCode::FORBIDDEN,
            "iam_oauth_login_disabled",
            "OAuth login is disabled for this provider",
        );
    }

    let integration_tenant = match crate::oauth_login::find_active_integration_tenant_for_tenant(
        pg,
        tenant_id,
        &provider,
        Some(&runtime_app_id),
    )
    .await
    {
        Ok(tenant) => tenant,
        Err(error) => {
            return appbase_error(
                StatusCode::SERVICE_UNAVAILABLE,
                "iam_oauth_provider_lookup_failed",
                &error,
            );
        }
    };
    if let Err(error) = sdkwork_iam_web_adapter::validate_oauth_redirect_uri_for_provider(
        Some(pg),
        integration_tenant.as_deref(),
        &provider,
        &redirect_uri,
    )
    .await
    {
        return appbase_error(
            StatusCode::BAD_REQUEST,
            "iam_oauth_redirect_uri_invalid",
            &error,
        );
    }

    let oauth_state = crate::tokens::generate_opaque_token("oauthstate");
    if let Err(error) = crate::ephemeral::upsert_oauth_state(
        pg,
        LOCAL_EPHEMERAL_SCOPE,
        &crate::ephemeral::OAuthStateRecord {
            provider: provider.clone(),
            redirect_uri: redirect_uri.clone(),
            state: oauth_state.clone(),
            tenant_id: tenant_id.to_owned(),
            runtime_app_id: runtime_app_id.clone(),
        },
    )
    .await
    {
        return appbase_error(
            StatusCode::SERVICE_UNAVAILABLE,
            "iam_ephemeral_unavailable",
            &error,
        );
    }

    match crate::oauth_login::create_oauth_authorization_url(
        Some(pg),
        &state.config,
        &policy,
        &state.oauth_login,
        tenant_id,
        &runtime_app_id,
        &provider,
        &redirect_uri,
        Some(oauth_state.as_str()),
    )
    .await
    {
        Ok(auth_url) => appbase_ok(json!({
            "authUrl": auth_url,
            "url": auth_url,
            "state": oauth_state,
        })),
        Err(error) if error.contains("not configured") => appbase_error(
            StatusCode::SERVICE_UNAVAILABLE,
            "iam_oauth_provider_not_configured",
            &error,
        ),
        Err(error) => appbase_error(
            StatusCode::BAD_REQUEST,
            "iam_oauth_authorization_url_failed",
            &error,
        ),
    }
}

async fn create_oauth_session(
    State(state): State<LocalIamState>,
    ctx: WebRequestContext,
    headers: HeaderMap,
    Json(body): Json<Value>,
) -> Response {
    if let Some(response) = reject_login_credential_headers(&headers) {
        return response;
    }
    let provider = optional_string(body.get("provider"))
        .or_else(|| optional_string(body.get("providerCode")))
        .or_else(|| optional_string(body.get("provider_code")));
    let Some(provider) = provider else {
        return appbase_error(
            StatusCode::BAD_REQUEST,
            "iam_oauth_provider_required",
            "OAuth provider is required",
        );
    };
    let Some(code) = optional_string(body.get("code")) else {
        return appbase_error(
            StatusCode::BAD_REQUEST,
            "iam_oauth_code_required",
            "OAuth authorization code is required",
        );
    };
    let redirect_uri = optional_string(body.get("redirectUri"))
        .or_else(|| optional_string(body.get("redirect_uri")))
        .or_else(|| optional_string(body.get("redirectURL")));

    if let Some(response) = enforce_rate_limit(
        &state,
        LOCAL_EPHEMERAL_SCOPE,
        &format!("oauth:session:{}", canonical_identity(&provider)),
    )
    .await
    {
        return response;
    }

    let Ok(pg) = postgres_pool_or_error(&state) else {
        return postgres_pool_or_error(&state)
            .err()
            .expect("error response");
    };

    let policy = effective_public_account_binding_policy(&state, pg).await;
    if !oauth_login_allowed(&policy, Some(provider.as_str())) {
        return appbase_error(
            StatusCode::FORBIDDEN,
            "iam_oauth_login_disabled",
            "OAuth login is disabled for this provider",
        );
    }

    let Some(oauth_state) = optional_string(body.get("state")) else {
        return appbase_error(
            StatusCode::BAD_REQUEST,
            "iam_oauth_state_required",
            "OAuth state is required",
        );
    };
    let stored_state =
        match crate::ephemeral::take_oauth_state(pg, LOCAL_EPHEMERAL_SCOPE, &oauth_state).await {
            Ok(Some(record)) => record,
            Ok(None) => {
                return appbase_error(
                    StatusCode::BAD_REQUEST,
                    "iam_oauth_state_invalid",
                    "OAuth state is invalid or expired",
                );
            }
            Err(error) => {
                return appbase_error(
                    StatusCode::SERVICE_UNAVAILABLE,
                    "iam_ephemeral_unavailable",
                    &error,
                );
            }
        };
    if stored_state.provider != provider {
        return appbase_error(
            StatusCode::BAD_REQUEST,
            "iam_oauth_state_provider_mismatch",
            "OAuth state does not match provider",
        );
    }
    let (tenant_id, runtime_app_id) =
        if !stored_state.tenant_id.is_empty() && !stored_state.runtime_app_id.is_empty() {
            (
                stored_state.tenant_id.clone(),
                stored_state.runtime_app_id.clone(),
            )
        } else {
            let tenant_id = match require_credential_entry_tenant_id(&ctx) {
                Ok(tenant_id) => tenant_id.to_owned(),
                Err(response) => return response,
            };
            let runtime_app_id =
                match resolve_credential_entry_runtime_app(pg, &ctx, &tenant_id).await {
                    Ok(app_id) => app_id,
                    Err(response) => return response,
                };
            (tenant_id, runtime_app_id)
        };
    if let Err(error) = validate_enabled_tenant_runtime_app(pg, &tenant_id, &runtime_app_id).await {
        return appbase_error(
            StatusCode::UNAUTHORIZED,
            "iam_runtime_app_id_invalid",
            &error,
        );
    }

    let expected_redirect_uri = stored_state.redirect_uri.trim().to_string();
    let redirect_uri = redirect_uri
        .or(Some(expected_redirect_uri.clone()))
        .filter(|value| !value.trim().is_empty());
    let Some(redirect_uri) = redirect_uri else {
        return appbase_error(
            StatusCode::BAD_REQUEST,
            "iam_oauth_redirect_uri_required",
            "OAuth redirectUri is required",
        );
    };
    if redirect_uri.trim() != expected_redirect_uri {
        return appbase_error(
            StatusCode::BAD_REQUEST,
            "iam_oauth_redirect_uri_mismatch",
            "OAuth redirectUri does not match authorization request",
        );
    }

    match crate::oauth_login::resolve_oauth_login_user(
        pg,
        &state.config,
        &policy,
        &state.oauth_login,
        &tenant_id,
        &runtime_app_id,
        &provider,
        &code,
        Some(redirect_uri.as_str()),
    )
    .await
    {
        Ok(user) => {
            crate::security_events::record_login_success(
                pg,
                &user.tenant_id,
                &user.id,
                &format!("oauth:{provider}"),
                "oauth",
            )
            .await;
            crate::audit_events::record_login_success(
                pg,
                &state.config,
                &user.id,
                &format!("oauth:{provider}"),
                "oauth",
                &user.tenant_id,
            )
            .await;
            create_authenticated_session_response(&state, &user, &runtime_app_id).await
        }
        Err(error) if error.contains("not configured") || error.contains("exchange") => {
            oauth_unavailable_error()
        }
        Err(error) if error.contains("auto registration") => appbase_error(
            StatusCode::FORBIDDEN,
            "iam_oauth_auto_registration_disabled",
            &error,
        ),
        Err(error) => appbase_error(
            StatusCode::BAD_REQUEST,
            "iam_oauth_session_create_failed",
            &error,
        ),
    }
}

async fn handle_oauth_callback_get(
    State(state): State<LocalIamState>,
    ctx: WebRequestContext,
    Path(provider_code): Path<String>,
    headers: HeaderMap,
    Query(query): Query<HashMap<String, String>>,
) -> Response {
    if let Some(response) = reject_login_credential_headers(&headers) {
        return response;
    }

    let code = query.get("code").cloned();
    let Some(code) = code else {
        return appbase_error(
            StatusCode::BAD_REQUEST,
            "iam_oauth_code_required",
            "OAuth authorization code is required",
        );
    };
    create_oauth_session(
        State(state),
        ctx,
        headers,
        Json(json!({
            "provider": provider_code,
            "code": code,
            "state": query.get("state").cloned(),
        })),
    )
    .await
}

async fn handle_oauth_callback_post(
    State(state): State<LocalIamState>,
    ctx: WebRequestContext,
    Path(provider_code): Path<String>,
    headers: HeaderMap,
    Json(body): Json<Value>,
) -> Response {
    if let Some(response) = reject_login_credential_headers(&headers) {
        return response;
    }

    let mut payload = body;
    if payload.get("provider").is_none() {
        payload["provider"] = json!(provider_code);
    }

    create_oauth_session(State(state), ctx, headers, Json(payload)).await
}

async fn create_oauth_mini_program_session(
    State(state): State<LocalIamState>,
    ctx: WebRequestContext,
    headers: HeaderMap,
    Json(body): Json<Value>,
) -> Response {
    if let Some(response) = reject_login_credential_headers(&headers) {
        return response;
    }
    let code = optional_string(body.get("jsCode"))
        .or_else(|| optional_string(body.get("js_code")))
        .or_else(|| optional_string(body.get("code")));
    let Some(code) = code else {
        return appbase_error(
            StatusCode::BAD_REQUEST,
            "iam_wechat_mini_program_code_required",
            "WeChat mini program jsCode is required",
        );
    };
    let surface_code = optional_string(body.get("surfaceCode"))
        .or_else(|| optional_string(body.get("surface_code")));
    let tenant_id = match require_credential_entry_tenant_id(&ctx) {
        Ok(tenant_id) => tenant_id.to_owned(),
        Err(response) => return response,
    };
    let pg = match postgres_pool_or_error(&state) {
        Ok(pg) => pg,
        Err(response) => return response,
    };
    let runtime_app_id = match resolve_credential_entry_runtime_app(pg, &ctx, &tenant_id).await {
        Ok(app_id) => app_id,
        Err(response) => return response,
    };
    if let Some(response) =
        enforce_rate_limit(&state, &tenant_id, "oauth:wechat_mini_program:session").await
    {
        return response;
    }
    let policy = effective_account_binding_policy(&state, pg, Some(&tenant_id)).await;
    match crate::oauth_login::resolve_wechat_mini_program_login_user(
        pg,
        &policy,
        &tenant_id,
        &runtime_app_id,
        surface_code.as_deref(),
        &code,
    )
    .await
    {
        Ok(user) => {
            crate::security_events::record_login_success(
                pg,
                &user.tenant_id,
                &user.id,
                "wechat_mini_program",
                "oauth",
            )
            .await;
            crate::audit_events::record_login_success(
                pg,
                &state.config,
                &user.id,
                "wechat_mini_program",
                "oauth",
                &user.tenant_id,
            )
            .await;
            create_authenticated_session_response(&state, &user, &runtime_app_id).await
        }
        Err(error) if error.contains("not configured") => appbase_error(
            StatusCode::SERVICE_UNAVAILABLE,
            "iam_wechat_mini_program_not_configured",
            &error,
        ),
        Err(error) if error.contains("disabled") => appbase_error(
            StatusCode::FORBIDDEN,
            "iam_wechat_mini_program_login_disabled",
            &error,
        ),
        Err(error) if error.contains("auto registration") => appbase_error(
            StatusCode::FORBIDDEN,
            "iam_oauth_auto_registration_disabled",
            &error,
        ),
        Err(error) => appbase_error(
            StatusCode::BAD_REQUEST,
            "iam_wechat_mini_program_session_create_failed",
            &error,
        ),
    }
}

async fn list_oauth_account_links(
    State(state): State<LocalIamState>,
    headers: HeaderMap,
    Query(query): Query<HashMap<String, String>>,
) -> Response {
    let Ok(pg) = postgres_pool_or_error(&state) else {
        return postgres_pool_or_error(&state)
            .err()
            .expect("error response");
    };
    let Some(session) = resolve_session_from_headers(pg, &headers).await else {
        return iam_session_required_error();
    };

    let policy = effective_account_binding_policy(&state, pg, Some(&session.user.tenant_id)).await;
    if !oauth_binding_allowed(&policy, OauthBindingActionKind::List, None) {
        return appbase_error(
            StatusCode::FORBIDDEN,
            "iam_oauth_binding_disabled",
            "OAuth account binding is disabled for this tenant",
        );
    }

    let Ok(params) = list_page_params_or_error(&query) else {
        return list_page_params_or_error(&query)
            .err()
            .expect("error response");
    };
    let rows = sqlx::query(&format!(
        "SELECT id, provider_code, integration_id, external_account_display_snapshot, linked_at, status, \
                COUNT(*) OVER() AS {LIST_TOTAL_COLUMN} \
         FROM iam_oauth_account_link \
         WHERE tenant_id = $1 AND user_id = $2 AND status = 'active' AND unlinked_at IS NULL \
         ORDER BY linked_at DESC \
         LIMIT $3 OFFSET $4"
    ))
    .bind(&session.user.tenant_id)
    .bind(&session.user.id)
    .bind(params.page_size)
    .bind(params.offset)
    .fetch_all(pg)
    .await;

    match rows {
        Ok(rows) => {
            let total = total_from_rows(&rows);
            let items: Vec<Value> = rows
                .into_iter()
                .map(|row| {
                    json!({
                        "accountLinkId": row.get::<String, _>(0),
                        "id": row.get::<String, _>(0),
                        "providerCode": row.get::<String, _>(1),
                        "integrationId": row.get::<String, _>(2),
                        "externalAccountDisplay": row.get::<Option<String>, _>(3),
                        "linkedAt": row.get::<String, _>(4),
                        "status": row.get::<String, _>(5),
                    })
                })
                .collect();
            appbase_ok(list_page_json(items, total, &params))
        }
        Err(error) => appbase_error(
            StatusCode::SERVICE_UNAVAILABLE,
            "iam_oauth_account_links_list_failed",
            &format!("list oauth account links failed: {error}"),
        ),
    }
}

async fn delete_oauth_account_link(
    State(state): State<LocalIamState>,
    headers: HeaderMap,
    Path(account_link_id): Path<String>,
) -> Response {
    let Ok(pg) = postgres_pool_or_error(&state) else {
        return postgres_pool_or_error(&state)
            .err()
            .expect("error response");
    };
    let Some(session) = resolve_session_from_headers(pg, &headers).await else {
        return iam_session_required_error();
    };

    let policy = effective_account_binding_policy(&state, pg, Some(&session.user.tenant_id)).await;
    if !oauth_binding_allowed(&policy, OauthBindingActionKind::Unlink, None) {
        return appbase_error(
            StatusCode::FORBIDDEN,
            "iam_oauth_binding_unlink_disabled",
            "OAuth account unlink is disabled for this tenant",
        );
    }

    let provider_code = sqlx::query_scalar::<_, String>(
        "SELECT provider_code FROM iam_oauth_account_link \
         WHERE id = $1 AND tenant_id = $2 AND user_id = $3 AND status = 'active' AND unlinked_at IS NULL \
         LIMIT 1",
    )
    .bind(&account_link_id)
    .bind(&session.user.tenant_id)
    .bind(&session.user.id)
    .fetch_optional(pg)
    .await;

    let provider_code = match provider_code {
        Ok(Some(provider_code)) => provider_code,
        Ok(None) => {
            return appbase_error(
                StatusCode::NOT_FOUND,
                "iam_oauth_account_link_not_found",
                "OAuth account link was not found",
            );
        }
        Err(error) => {
            return appbase_error(
                StatusCode::SERVICE_UNAVAILABLE,
                "iam_oauth_account_link_lookup_failed",
                &format!("lookup oauth account link failed: {error}"),
            );
        }
    };

    if !oauth_binding_allowed(
        &policy,
        OauthBindingActionKind::Unlink,
        Some(provider_code.as_str()),
    ) {
        return appbase_error(
            StatusCode::FORBIDDEN,
            "iam_oauth_provider_unlink_disabled",
            "OAuth unlink is disabled for this provider",
        );
    }

    let now = chrono::Utc::now().to_rfc3339();
    let updated = sqlx::query(
        "UPDATE iam_oauth_account_link \
         SET status = 'unlinked', unlinked_at = $4, updated_at = $4 \
         WHERE id = $1 AND tenant_id = $2 AND user_id = $3 AND status = 'active' AND unlinked_at IS NULL",
    )
    .bind(&account_link_id)
    .bind(&session.user.tenant_id)
    .bind(&session.user.id)
    .bind(&now)
    .execute(pg)
    .await;

    match updated {
        Ok(result) if result.rows_affected() > 0 => StatusCode::NO_CONTENT.into_response(),
        Ok(_) => appbase_error(
            StatusCode::NOT_FOUND,
            "iam_oauth_account_link_not_found",
            "OAuth account link was not found",
        ),
        Err(error) => appbase_error(
            StatusCode::SERVICE_UNAVAILABLE,
            "iam_oauth_account_link_unlink_failed",
            &format!("unlink oauth account link failed: {error}"),
        ),
    }
}

async fn list_oauth_grants(
    State(state): State<LocalIamState>,
    headers: HeaderMap,
    Query(query): Query<HashMap<String, String>>,
) -> Response {
    let Ok(pg) = postgres_pool_or_error(&state) else {
        return postgres_pool_or_error(&state)
            .err()
            .expect("error response");
    };
    let Some(session) = resolve_session_from_headers(pg, &headers).await else {
        return iam_session_required_error();
    };

    let Ok(params) = list_page_params_or_error(&query) else {
        return list_page_params_or_error(&query)
            .err()
            .expect("error response");
    };
    let search = list_search_pattern(&query);
    let rows = sqlx::query(&format!(
        "SELECT id, provider_code, integration_id, grant_owner_kind, flow_kind, status, issued_at, created_at, \
                COUNT(*) OVER() AS {LIST_TOTAL_COLUMN} \
         FROM iam_oauth_grant \
         WHERE tenant_id = $1 AND user_id = $2 AND status = 'active' \
           AND ($5::text IS NULL OR LOWER(provider_code) LIKE $5 OR LOWER(integration_id) LIKE $5) \
         ORDER BY created_at DESC, id \
         LIMIT $3 OFFSET $4"
    ))
    .bind(&session.user.tenant_id)
    .bind(&session.user.id)
    .bind(params.page_size)
    .bind(params.offset)
    .bind(search)
    .fetch_all(pg)
    .await;

    match rows {
        Ok(rows) => {
            let total = total_from_rows(&rows);
            let items: Vec<Value> = rows
                .into_iter()
                .map(|row| {
                    json!({
                        "createdAt": row.get::<String, _>(7),
                        "flowKind": row.get::<String, _>(4),
                        "grantId": row.get::<String, _>(0),
                        "grantOwnerKind": row.get::<String, _>(3),
                        "id": row.get::<String, _>(0),
                        "integrationId": row.get::<String, _>(2),
                        "issuedAt": row.get::<Option<String>, _>(6),
                        "providerCode": row.get::<String, _>(1),
                        "status": row.get::<String, _>(5),
                    })
                })
                .collect();
            appbase_ok(list_page_json(items, total, &params))
        }
        Err(error) => appbase_error(
            StatusCode::SERVICE_UNAVAILABLE,
            "iam_oauth_grants_list_failed",
            &format!("list oauth grants failed: {error}"),
        ),
    }
}

async fn delete_oauth_grant(
    State(state): State<LocalIamState>,
    headers: HeaderMap,
    Path(grant_id): Path<String>,
) -> Response {
    let Ok(pg) = postgres_pool_or_error(&state) else {
        return postgres_pool_or_error(&state)
            .err()
            .expect("error response");
    };
    let Some(session) = resolve_session_from_headers(pg, &headers).await else {
        return iam_session_required_error();
    };

    let now = chrono::Utc::now().to_rfc3339();
    let updated = sqlx::query(
        "UPDATE iam_oauth_grant \
         SET status = 'revoked', revoked_at = $4, updated_at = $4 \
         WHERE id = $1 AND tenant_id = $2 AND user_id = $3 AND status = 'active'",
    )
    .bind(&grant_id)
    .bind(&session.user.tenant_id)
    .bind(&session.user.id)
    .bind(&now)
    .execute(pg)
    .await;

    match updated {
        Ok(result) if result.rows_affected() > 0 => StatusCode::NO_CONTENT.into_response(),
        Ok(_) => appbase_error(
            StatusCode::NOT_FOUND,
            "iam_oauth_grant_not_found",
            "OAuth grant was not found",
        ),
        Err(error) => appbase_error(
            StatusCode::SERVICE_UNAVAILABLE,
            "iam_oauth_grant_delete_failed",
            &format!("revoke oauth grant failed: {error}"),
        ),
    }
}

async fn retrieve_current_user(
    State(state): State<LocalIamState>,
    ctx: WebRequestContext,
) -> Response {
    let Ok(pg) = postgres_pool_or_error(&state) else {
        return postgres_pool_or_error(&state)
            .err()
            .expect("error response");
    };
    match resolve_session_from_context(pg, &ctx).await {
        Some(session) => appbase_ok(user_to_json(&session.user)),
        None => iam_session_required_error(),
    }
}

async fn update_current_user(
    State(state): State<LocalIamState>,
    ctx: WebRequestContext,
    Json(body): Json<Value>,
) -> Response {
    let Ok(pg) = postgres_pool_or_error(&state) else {
        return postgres_pool_or_error(&state)
            .err()
            .expect("error response");
    };
    let Some(session) = resolve_session_from_context(pg, &ctx).await else {
        return iam_session_required_error();
    };

    if body.get("email").is_some() || body.get("phone").is_some() {
        return appbase_error(
            StatusCode::BAD_REQUEST,
            "iam_contact_update_forbidden",
            "email and phone must be updated through contact binding endpoints",
        );
    }

    let display_name = optional_string(body.get("displayName"))
        .or_else(|| optional_string(body.get("display_name")))
        .or_else(|| optional_string(body.get("nickname")))
        .or_else(|| optional_string(body.get("name")));

    match update_current_user_profile(pg, &session.user, display_name).await {
        Ok(_) => StatusCode::NO_CONTENT.into_response(),
        Err(error) => appbase_error(
            StatusCode::INTERNAL_SERVER_ERROR,
            "iam_user_update_failed",
            &error,
        ),
    }
}

async fn update_current_user_password(
    State(state): State<LocalIamState>,
    ctx: WebRequestContext,
    Json(body): Json<Value>,
) -> Response {
    let Ok(pg) = postgres_pool_or_error(&state) else {
        return postgres_pool_or_error(&state)
            .err()
            .expect("error response");
    };
    let Some(session) = resolve_session_from_context(pg, &ctx).await else {
        return iam_session_required_error();
    };

    if let Some(response) = enforce_rate_limit(
        &state,
        &session.user.tenant_id,
        &format!("iam:password_update:{}", session.user.id),
    )
    .await
    {
        return response;
    }

    let Some(current_password) = read_password(body.get("oldPassword"))
        .or_else(|| read_password(body.get("currentPassword")))
        .or_else(|| read_password(body.get("old_password")))
    else {
        return appbase_error(
            StatusCode::BAD_REQUEST,
            "iam_current_password_required",
            "current password is required",
        );
    };
    let Some(new_password) = read_password(body.get("newPassword"))
        .or_else(|| read_password(body.get("password")))
        .or_else(|| read_password(body.get("new_password")))
    else {
        return appbase_error(
            StatusCode::BAD_REQUEST,
            "iam_new_password_required",
            "new password is required",
        );
    };
    let Some(confirm_password) = read_password(body.get("confirmPassword"))
        .or_else(|| read_password(body.get("confirm_password")))
    else {
        return appbase_error(
            StatusCode::BAD_REQUEST,
            "iam_password_confirmation_required",
            "password confirmation is required",
        );
    };
    if new_password != confirm_password {
        return appbase_error(
            StatusCode::BAD_REQUEST,
            "iam_password_confirmation_mismatch",
            "password confirmation does not match",
        );
    }
    if !password_is_within_policy(&new_password, &state.config) {
        return password_policy_violation_error(&state.config);
    }

    match change_current_user_password(
        pg,
        &state.config,
        &session.user,
        &current_password,
        &new_password,
    )
    .await
    {
        Ok(()) => appbase_ok(json!({ "updated": true })),
        Err(error) if error.contains("invalid") => appbase_error(
            StatusCode::UNAUTHORIZED,
            "iam_current_password_invalid",
            "current password is invalid",
        ),
        Err(error) if error.contains("policy") => password_policy_violation_error(&state.config),
        Err(error) if error.contains("recently") => {
            appbase_error(StatusCode::BAD_REQUEST, "iam_password_reused", &error)
        }
        Err(error) if error.contains("differ") => {
            appbase_error(StatusCode::BAD_REQUEST, "iam_password_unchanged", &error)
        }
        Err(error) => appbase_error(
            StatusCode::INTERNAL_SERVER_ERROR,
            "iam_password_update_failed",
            &error,
        ),
    }
}

async fn create_current_user_email_binding(
    State(state): State<LocalIamState>,
    ctx: WebRequestContext,
    Json(body): Json<Value>,
) -> Response {
    create_current_user_contact_binding(&state, &ctx, ContactBindingKind::Email, &body).await
}

async fn create_current_user_phone_binding(
    State(state): State<LocalIamState>,
    ctx: WebRequestContext,
    Json(body): Json<Value>,
) -> Response {
    create_current_user_contact_binding(&state, &ctx, ContactBindingKind::Phone, &body).await
}

async fn create_current_user_contact_binding(
    state: &LocalIamState,
    ctx: &WebRequestContext,
    kind: ContactBindingKind,
    body: &Value,
) -> Response {
    let Ok(pg) = postgres_pool_or_error(state) else {
        return postgres_pool_or_error(state).err().expect("error response");
    };
    let Some(session) = resolve_session_from_context(pg, ctx).await else {
        return iam_session_required_error();
    };

    let policy = effective_account_binding_policy(state, pg, Some(&session.user.tenant_id)).await;
    let action = contact_binding_action_for_user(&session.user, kind, false);
    if !contact_binding_allowed(&policy, action) {
        return appbase_error(
            StatusCode::FORBIDDEN,
            "iam_contact_binding_disabled",
            "contact binding is disabled for this tenant",
        );
    }

    if let Some(response) = enforce_rate_limit(
        state,
        &session.user.tenant_id,
        &contact_rate_limit_bucket(kind, &session.user.id),
    )
    .await
    {
        return response;
    }

    let target_key = match kind {
        ContactBindingKind::Email => "email",
        ContactBindingKind::Phone => "phone",
    };
    let Some(target) = optional_string(body.get(target_key)) else {
        return appbase_error(
            StatusCode::BAD_REQUEST,
            "iam_contact_target_required",
            "contact target is required",
        );
    };
    let Some(verification_code) = optional_string(body.get("verificationCode"))
        .or_else(|| optional_string(body.get("verification_code")))
        .or_else(|| optional_string(body.get("code")))
    else {
        return appbase_error(
            StatusCode::BAD_REQUEST,
            "iam_verification_code_required",
            "verification code is required",
        );
    };

    match bind_contact_for_user(
        pg,
        &state.config,
        &session.user,
        kind,
        &target,
        &verification_code,
    )
    .await
    {
        Ok(user) => appbase_ok(user_to_json(&user)),
        Err(error) if error.contains("verification code is invalid") => appbase_error(
            StatusCode::BAD_REQUEST,
            "iam_verification_code_invalid",
            &error,
        ),
        Err(error) if error.contains("not configured") => appbase_error(
            StatusCode::SERVICE_UNAVAILABLE,
            "iam_verification_unavailable",
            &error,
        ),
        Err(error) if error.contains("already bound") => {
            appbase_error(StatusCode::CONFLICT, "iam_contact_already_bound", &error)
        }
        Err(error) if error.contains("email address is invalid") => {
            appbase_error(StatusCode::BAD_REQUEST, "iam_email_invalid", &error)
        }
        Err(error) if error.contains("phone number is invalid") => {
            appbase_error(StatusCode::BAD_REQUEST, "iam_phone_invalid", &error)
        }
        Err(error) if error.contains("required") => appbase_error(
            StatusCode::BAD_REQUEST,
            "iam_contact_target_required",
            &error,
        ),
        Err(error) => appbase_error(
            StatusCode::INTERNAL_SERVER_ERROR,
            "iam_contact_bind_failed",
            &error,
        ),
    }
}

async fn delete_current_user_email_binding(
    State(state): State<LocalIamState>,
    ctx: WebRequestContext,
    Json(body): Json<Value>,
) -> Response {
    delete_current_user_contact_binding(&state, &ctx, ContactBindingKind::Email, &body).await
}

async fn delete_current_user_phone_binding(
    State(state): State<LocalIamState>,
    ctx: WebRequestContext,
    Json(body): Json<Value>,
) -> Response {
    delete_current_user_contact_binding(&state, &ctx, ContactBindingKind::Phone, &body).await
}

async fn delete_current_user_contact_binding(
    state: &LocalIamState,
    ctx: &WebRequestContext,
    kind: ContactBindingKind,
    body: &Value,
) -> Response {
    let Ok(pg) = postgres_pool_or_error(state) else {
        return postgres_pool_or_error(state).err().expect("error response");
    };
    let Some(session) = resolve_session_from_context(pg, ctx).await else {
        return iam_session_required_error();
    };

    let policy = effective_account_binding_policy(state, pg, Some(&session.user.tenant_id)).await;
    let action = contact_binding_action_for_user(&session.user, kind, true);
    if !contact_binding_allowed(&policy, action) {
        return appbase_error(
            StatusCode::FORBIDDEN,
            "iam_contact_binding_unbind_disabled",
            "contact unbind is disabled for this tenant",
        );
    }

    if let Some(response) = enforce_rate_limit(
        state,
        &session.user.tenant_id,
        &contact_rate_limit_bucket(kind, &session.user.id),
    )
    .await
    {
        return response;
    }

    let Some(password) = read_password(body.get("password"))
        .or_else(|| read_password(body.get("currentPassword")))
        .or_else(|| read_password(body.get("oldPassword")))
    else {
        return appbase_error(
            StatusCode::BAD_REQUEST,
            "iam_current_password_required",
            "current password is required to unbind contact",
        );
    };

    match unbind_contact_for_user(pg, &session.user, kind, &password).await {
        Ok(user) => appbase_ok(user_to_json(&user)),
        Err(error) if error.contains("invalid") => appbase_error(
            StatusCode::UNAUTHORIZED,
            "iam_current_password_invalid",
            "current password is invalid",
        ),
        Err(error) if error.contains("last login contact") => appbase_error(
            StatusCode::BAD_REQUEST,
            "iam_contact_unbind_forbidden",
            &error,
        ),
        Err(error) => appbase_error(
            StatusCode::INTERNAL_SERVER_ERROR,
            "iam_contact_unbind_failed",
            &error,
        ),
    }
}

async fn complete_oauth_authorization(
    State(state): State<LocalIamState>,
    headers: HeaderMap,
    Path(authorization_state_id): Path<String>,
) -> Response {
    let Ok(pg) = postgres_pool_or_error(&state) else {
        return postgres_pool_or_error(&state)
            .err()
            .expect("error response");
    };
    let Some(session) = resolve_session_from_headers(pg, &headers).await else {
        return iam_session_required_error();
    };

    match sdkwork_iam_web_adapter::complete_authorization_state(
        pg,
        &authorization_state_id,
        &session.context,
    )
    .await
    {
        Ok(completion) => appbase_ok(json!({
            "authorizationCode": completion.authorization_code,
            "redirectUrl": completion.redirect_url,
        })),
        Err(error) => appbase_error(
            StatusCode::BAD_REQUEST,
            "iam_oauth_authorization_completion_failed",
            &error,
        ),
    }
}

async fn retrieve_runtime(State(state): State<LocalIamState>, ctx: WebRequestContext) -> Response {
    let defaults = sdkwork_iam_web_adapter::RuntimeAuthMetadataInput {
        environment: state.config.environment.clone(),
        deployment_mode: "saas".to_string(),
        supports_local_credentials: true,
        supports_session_exchange: true,
        sdkwork_oauth_provider_enabled: true,
    };

    let payload = match postgres_pool_or_error(&state) {
        Ok(pg) => {
            let open_registration_tenant_id =
                crate::directory::resolve_open_registration_tenant_id(pg)
                    .await
                    .ok();
            let resolved_tenant_id = ctx
                .tenant_id()
                .filter(|value| !value.is_empty())
                .map(str::to_string)
                .or(open_registration_tenant_id);

            let input = if let (Some(tenant_id), Some(app_id)) = (
                resolved_tenant_id.as_deref(),
                ctx.app_id().filter(|value| !value.is_empty()),
            ) {
                sdkwork_iam_web_adapter::load_runtime_auth_metadata_input(
                    pg, tenant_id, app_id, &defaults,
                )
                .await
                .unwrap_or(defaults)
            } else {
                defaults
            };

            let policy = effective_public_account_binding_policy(&state, pg).await;
            let oauth_tenant_id = resolved_tenant_id
                .as_deref()
                .filter(|value| !value.is_empty())
                .unwrap_or(LOCAL_EPHEMERAL_SCOPE);
            let oauth_providers = match crate::oauth_login::list_login_enabled_providers(
                Some(pg),
                oauth_tenant_id,
                ctx.app_id().filter(|value| !value.is_empty()),
                &policy,
                &crate::oauth_login::OAuthLoginContext::new(),
            )
            .await
            {
                Ok(items) => items
                    .into_iter()
                    .map(|provider| {
                        json!({
                            "providerCode": provider.get("providerCode").cloned().unwrap_or(Value::Null),
                            "regionGroup": provider.get("regionGroup").cloned().unwrap_or(Value::Null),
                        })
                    })
                    .collect::<Vec<_>>(),
                Err(error) => {
                    return appbase_error(
                        StatusCode::INTERNAL_SERVER_ERROR,
                        "iam_runtime_oauth_providers_failed",
                        &error,
                    );
                }
            };
            sdkwork_iam_web_adapter::build_runtime_auth_metadata_json(
                &policy,
                &oauth_providers,
                &input,
            )
        }
        Err(_) => sdkwork_iam_web_adapter::default_runtime_auth_metadata_json(&defaults),
    };

    appbase_ok(payload)
}

async fn retrieve_verification_policy(State(state): State<LocalIamState>) -> Response {
    let account_binding = match postgres_pool_or_error(&state) {
        Ok(pg) => {
            let policy = effective_public_account_binding_policy(&state, pg).await;
            account_binding_policy_to_json(&policy)
        }
        Err(_) => account_binding_policy_to_json(&default_account_binding_policy()),
    };

    appbase_ok(json!({
        "accountBinding": account_binding,
        "emailCodeLoginEnabled": false,
        "emailRegisterVerificationRequired": state.config.email_verification_required,
        "emailRegistrationVerificationRequired": state.config.email_verification_required,
        "passwordLoginEnabled": true,
        "phoneCodeLoginEnabled": false,
        "phoneRegisterVerificationRequired": false,
        "phoneRegistrationVerificationRequired": false,
        "qrLoginEnabled": true,
        "registrationEnabled": true
    }))
}

async fn retrieve_account_binding_policy(State(state): State<LocalIamState>) -> Response {
    let policy = match postgres_pool_or_error(&state) {
        Ok(pg) => effective_public_account_binding_policy(&state, pg).await,
        Err(_) => default_account_binding_policy(),
    };

    appbase_ok(account_binding_policy_to_json(&policy))
}

async fn create_oauth_device_authorization(
    State(state): State<LocalIamState>,
    headers: HeaderMap,
    Json(body): Json<Value>,
) -> Response {
    if let Some(response) = reject_login_credential_headers(&headers) {
        return response;
    }
    if let Some(response) =
        enforce_ephemeral_rate_limit(&state, "oauth:device_authorization:create").await
    {
        return response;
    }
    let purpose = optional_string(body.get("purpose")).unwrap_or_else(|| "login".to_string());
    if purpose != "login" && purpose != "register" {
        return appbase_error(
            StatusCode::BAD_REQUEST,
            "iam_oauth_device_authorization_purpose_invalid",
            "OAuth device authorization purpose must be login or register",
        );
    }

    let session_key = generate_opaque_token("qr");
    let poll_secret = generate_opaque_token("qrpoll");
    let qr_content =
        build_oauth_device_authorization_entry_url(&headers, &session_key, &purpose, &poll_secret);
    let qr_session = LocalQrSession {
        completed_session: None,
        expire_time: current_millis() + 300_000,
        fallback_url: qr_content.clone(),
        organization_selection: None,
        poll_secret,
        purpose,
        qr_content,
        qr_content_mode: "fallback_url".to_string(),
        session_exchanged: false,
        session_key,
        status: "pending".to_string(),
    };
    if let Err(error) =
        crate::ephemeral_pool::upsert_qr_session(&state.pool, LOCAL_EPHEMERAL_SCOPE, &qr_session)
            .await
    {
        return appbase_error(
            StatusCode::SERVICE_UNAVAILABLE,
            "iam_ephemeral_unavailable",
            &error,
        );
    }
    appbase_ok(qr_session_create_json(&qr_session))
}

async fn retrieve_oauth_device_authorization(
    State(state): State<LocalIamState>,
    Path(device_authorization_id): Path<String>,
) -> Response {
    let _ = crate::ephemeral_pool::cleanup_expired_artifacts(&state.pool).await;
    match crate::ephemeral_pool::get_qr_session(
        &state.pool,
        LOCAL_EPHEMERAL_SCOPE,
        &device_authorization_id,
    )
    .await
    {
        Ok(Some(session)) => appbase_ok(qr_session_poll_json(&session)),
        Ok(None) => appbase_error(
            StatusCode::NOT_FOUND,
            "iam_oauth_device_authorization_not_found",
            "invalid or expired OAuth device authorization",
        ),
        Err(error) => appbase_error(
            StatusCode::SERVICE_UNAVAILABLE,
            "iam_ephemeral_unavailable",
            &error,
        ),
    }
}

async fn create_oauth_device_authorization_scan(
    State(state): State<LocalIamState>,
    Path(device_authorization_id): Path<String>,
    Json(body): Json<Value>,
) -> Response {
    let Some(poll_secret) = optional_string(body.get("pollSecret"))
        .or_else(|| optional_string(body.get("poll_secret")))
    else {
        return appbase_error(
            StatusCode::BAD_REQUEST,
            "iam_poll_secret_required",
            "poll secret is required",
        );
    };

    let _ = crate::ephemeral_pool::cleanup_expired_artifacts(&state.pool).await;
    let qr_session = match crate::ephemeral_pool::get_qr_session(
        &state.pool,
        LOCAL_EPHEMERAL_SCOPE,
        &device_authorization_id,
    )
    .await
    {
        Ok(Some(session)) => session,
        Ok(None) => {
            return appbase_error(
                StatusCode::NOT_FOUND,
                "iam_oauth_device_authorization_not_found",
                "invalid or expired OAuth device authorization",
            );
        }
        Err(error) => {
            return appbase_error(
                StatusCode::SERVICE_UNAVAILABLE,
                "iam_ephemeral_unavailable",
                &error,
            );
        }
    };
    if !secure_compare_secrets(&qr_session.poll_secret, &poll_secret) {
        return appbase_error(
            StatusCode::UNAUTHORIZED,
            "iam_poll_secret_invalid",
            "invalid poll secret",
        );
    }
    match crate::ephemeral_pool::mutate_qr_session(
        &state.pool,
        LOCAL_EPHEMERAL_SCOPE,
        &device_authorization_id,
        |session| {
            if session.status == "pending" {
                session.status = "scanned".to_string();
            }
        },
    )
    .await
    {
        Ok(Some(session)) => appbase_ok(qr_session_poll_json(&session)),
        Ok(None) => appbase_error(
            StatusCode::NOT_FOUND,
            "iam_oauth_device_authorization_not_found",
            "invalid or expired OAuth device authorization",
        ),
        Err(error) => appbase_error(
            StatusCode::SERVICE_UNAVAILABLE,
            "iam_ephemeral_unavailable",
            &error,
        ),
    }
}

async fn create_oauth_device_authorization_session_exchange(
    State(state): State<LocalIamState>,
    Path(device_authorization_id): Path<String>,
    Json(body): Json<Value>,
) -> Response {
    let Some(poll_secret) = optional_string(body.get("pollSecret"))
        .or_else(|| optional_string(body.get("poll_secret")))
    else {
        return appbase_error(
            StatusCode::BAD_REQUEST,
            "iam_poll_secret_required",
            "poll secret is required",
        );
    };

    let _ = crate::ephemeral_pool::cleanup_expired_artifacts(&state.pool).await;
    let qr_session = match crate::ephemeral_pool::get_qr_session(
        &state.pool,
        LOCAL_EPHEMERAL_SCOPE,
        &device_authorization_id,
    )
    .await
    {
        Ok(Some(session)) => session,
        Ok(None) => {
            return appbase_error(
                StatusCode::NOT_FOUND,
                "iam_oauth_device_authorization_not_found",
                "invalid or expired OAuth device authorization",
            );
        }
        Err(error) => {
            return appbase_error(
                StatusCode::SERVICE_UNAVAILABLE,
                "iam_ephemeral_unavailable",
                &error,
            );
        }
    };
    if !secure_compare_secrets(&qr_session.poll_secret, &poll_secret) {
        return appbase_error(
            StatusCode::UNAUTHORIZED,
            "iam_poll_secret_invalid",
            "invalid poll secret",
        );
    }
    if qr_session.session_exchanged {
        return appbase_error(
            StatusCode::UNAUTHORIZED,
            "iam_poll_secret_consumed",
            "session exchange already completed",
        );
    }
    let Some(session) = qr_session.completed_session.clone() else {
        return appbase_error(
            StatusCode::CONFLICT,
            "iam_oauth_device_authorization_not_ready",
            "OAuth device authorization session is not ready for exchange",
        );
    };
    match crate::ephemeral_pool::mutate_qr_session(
        &state.pool,
        LOCAL_EPHEMERAL_SCOPE,
        &device_authorization_id,
        |qr_session| {
            qr_session.session_exchanged = true;
        },
    )
    .await
    {
        Ok(Some(_)) => appbase_ok(session_to_json(&session)),
        Ok(None) => appbase_error(
            StatusCode::NOT_FOUND,
            "iam_oauth_device_authorization_not_found",
            "invalid or expired OAuth device authorization",
        ),
        Err(error) => appbase_error(
            StatusCode::SERVICE_UNAVAILABLE,
            "iam_ephemeral_unavailable",
            &error,
        ),
    }
}

async fn create_oauth_device_authorization_password_completion(
    State(state): State<LocalIamState>,
    Path(device_authorization_id): Path<String>,
    ctx: WebRequestContext,
    headers: HeaderMap,
    Json(body): Json<Value>,
) -> Response {
    if let Some(response) = reject_login_credential_headers(&headers) {
        return response;
    }
    let tenant_id = match require_credential_entry_tenant_id(&ctx) {
        Ok(tenant_id) => tenant_id,
        Err(response) => return response,
    };
    let Ok(pg) = postgres_pool_or_error(&state) else {
        return postgres_pool_or_error(&state)
            .err()
            .expect("error response");
    };
    let runtime_app_id = match resolve_credential_entry_runtime_app(pg, &ctx, tenant_id).await {
        Ok(app_id) => app_id,
        Err(response) => return response,
    };
    let username = resolve_login_username(&body);
    if username.is_empty() {
        return appbase_error(
            StatusCode::BAD_REQUEST,
            "iam_login_account_required",
            "username, email, or phone is required",
        );
    }
    if let Some(response) = enforce_ephemeral_rate_limit(
        &state,
        &format!("auth:qr_login:{}", canonical_identity(&username)),
    )
    .await
    {
        return response;
    }
    let Some(password) = read_password(body.get("password")) else {
        return appbase_error(
            StatusCode::BAD_REQUEST,
            "iam_password_required",
            "password is required",
        );
    };
    let _ = crate::ephemeral_pool::cleanup_expired_artifacts(&state.pool).await;
    if !crate::ephemeral_pool::qr_session_exists(
        &state.pool,
        LOCAL_EPHEMERAL_SCOPE,
        &device_authorization_id,
    )
    .await
    .unwrap_or(false)
    {
        return appbase_error(
            StatusCode::NOT_FOUND,
            "iam_oauth_device_authorization_not_found",
            "invalid or expired OAuth device authorization",
        );
    }

    match resolve_password_login_session_outcome(
        &state,
        tenant_id,
        &username,
        &password,
        Some(device_authorization_id.clone()),
        &runtime_app_id,
    )
    .await
    {
        PasswordLoginSessionOutcome::Session(session) => {
            let session_for_qr = session.clone();
            let qr_session = match crate::ephemeral_pool::mutate_qr_session(
                &state.pool,
                LOCAL_EPHEMERAL_SCOPE,
                &device_authorization_id,
                |qr_session| {
                    qr_session.completed_session = Some(session_for_qr);
                    qr_session.organization_selection = None;
                    qr_session.status = "completed".to_string();
                },
            )
            .await
            {
                Ok(session) => session,
                Err(error) => {
                    return appbase_error(
                        StatusCode::SERVICE_UNAVAILABLE,
                        "iam_ephemeral_unavailable",
                        &error,
                    );
                }
            };
            let Some(qr_session) = qr_session else {
                return appbase_error(
                    StatusCode::NOT_FOUND,
                    "iam_oauth_device_authorization_not_found",
                    "invalid or expired OAuth device authorization",
                );
            };
            appbase_ok(qr_session_completion_json(&qr_session))
        }
        PasswordLoginSessionOutcome::Challenge(challenge) => {
            let challenge_for_qr = challenge.clone();
            let qr_session = match crate::ephemeral_pool::mutate_qr_session(
                &state.pool,
                LOCAL_EPHEMERAL_SCOPE,
                &device_authorization_id,
                |qr_session| {
                    qr_session.completed_session = None;
                    qr_session.organization_selection = Some(challenge_for_qr);
                    qr_session.status = "login_context_selection_required".to_string();
                },
            )
            .await
            {
                Ok(session) => session,
                Err(error) => {
                    return appbase_error(
                        StatusCode::SERVICE_UNAVAILABLE,
                        "iam_ephemeral_unavailable",
                        &error,
                    );
                }
            };
            let Some(qr_session) = qr_session else {
                return appbase_error(
                    StatusCode::NOT_FOUND,
                    "iam_oauth_device_authorization_not_found",
                    "invalid or expired OAuth device authorization",
                );
            };
            appbase_ok(qr_session_poll_json(&qr_session))
        }
        PasswordLoginSessionOutcome::AccountLocked => account_locked_error(),
        PasswordLoginSessionOutcome::InvalidCredentials => invalid_credentials_error(),
        PasswordLoginSessionOutcome::Error(response) => response,
    }
}

enum PasswordLoginSessionOutcome {
    Session(LocalSession),
    Challenge(Value),
    AccountLocked,
    InvalidCredentials,
    Error(Response),
}

async fn resolve_password_login_session_outcome(
    state: &LocalIamState,
    tenant_id: &str,
    username: &str,
    password: &str,
    qr_session_key: Option<String>,
    runtime_app_id: &str,
) -> PasswordLoginSessionOutcome {
    if let Some(pg) = state.pool.as_postgres() {
        return match authenticate_password(pg, tenant_id, username, password, &state.config).await {
            PasswordAuthenticationOutcome::Authenticated(user) => {
                record_successful_password_login(pg, &state.config, &user, username).await;
                match create_authenticated_session_or_challenge(
                    state,
                    &user,
                    qr_session_key,
                    runtime_app_id,
                )
                .await
                {
                    AuthenticatedSessionOutcome::Session(session) => {
                        PasswordLoginSessionOutcome::Session(session)
                    }
                    AuthenticatedSessionOutcome::Challenge(challenge) => {
                        PasswordLoginSessionOutcome::Challenge(challenge)
                    }
                    AuthenticatedSessionOutcome::Error(response) => {
                        PasswordLoginSessionOutcome::Error(response)
                    }
                }
            }
            PasswordAuthenticationOutcome::AccountLocked => {
                PasswordLoginSessionOutcome::AccountLocked
            }
            PasswordAuthenticationOutcome::InvalidCredentials => {
                PasswordLoginSessionOutcome::InvalidCredentials
            }
        };
    }

    if let Some(bridge) = state.password_session_bridge.as_ref() {
        return match bridge
            .authenticate_password_and_issue_session(username, password)
            .await
        {
            PasswordSessionBridgeResult::Authenticated(session_json) => {
                if let Some(session) = crate::ephemeral_pool::local_session_from_json(&session_json)
                {
                    PasswordLoginSessionOutcome::Session(session)
                } else {
                    PasswordLoginSessionOutcome::Error(appbase_error(
                        StatusCode::INTERNAL_SERVER_ERROR,
                        "iam_session_create_failed",
                        "product password session bridge returned invalid session payload",
                    ))
                }
            }
            PasswordSessionBridgeResult::OrganizationSelectionRequired(challenge) => {
                PasswordLoginSessionOutcome::Challenge(challenge)
            }
            PasswordSessionBridgeResult::InvalidCredentials => {
                PasswordLoginSessionOutcome::InvalidCredentials
            }
            PasswordSessionBridgeResult::AccountLocked => {
                PasswordLoginSessionOutcome::AccountLocked
            }
            PasswordSessionBridgeResult::Failed(error) => {
                PasswordLoginSessionOutcome::Error(appbase_error(
                    StatusCode::INTERNAL_SERVER_ERROR,
                    "iam_session_create_failed",
                    &error,
                ))
            }
        };
    }

    PasswordLoginSessionOutcome::Error(postgres_pool_or_error(state).err().expect("error response"))
}

type DirectoryPagedResult<T> = Result<(Vec<T>, i64, ListPageParams), sqlx::Error>;

fn directory_query_error(error: sqlx::Error) -> Response {
    if matches!(error, sqlx::Error::Protocol(_)) {
        return list_page_invalid_parameter_error();
    }
    tracing::error!(%error, "directory query failed");
    appbase_error(
        StatusCode::INTERNAL_SERVER_ERROR,
        "iam_directory_query_failed",
        "directory query failed",
    )
}

async fn list_organizations(
    State(state): State<LocalIamState>,
    ctx: WebRequestContext,
    Query(query): Query<HashMap<String, String>>,
) -> Response {
    let Ok(pg) = postgres_pool_or_error(&state) else {
        return postgres_pool_or_error(&state)
            .err()
            .expect("error response");
    };
    let Some(session) = require_session_from_context(pg, &ctx).await else {
        return iam_session_required_error();
    };
    if let Some(response) = ensure_directory_permission(&session, &["iam.organizations.read"]) {
        return response;
    }
    let (organizations, total, params) =
        match paged_organizations_for_session(pg, &session, &query).await {
            Ok(value) => value,
            Err(error) => return directory_query_error(error),
        };
    appbase_ok(list_page_json(
        organizations.iter().map(organization_to_json).collect(),
        total,
        &params,
    ))
}

async fn retrieve_organization_tree(
    State(state): State<LocalIamState>,
    ctx: WebRequestContext,
    Query(query): Query<HashMap<String, String>>,
) -> Response {
    let Ok(pg) = postgres_pool_or_error(&state) else {
        return postgres_pool_or_error(&state)
            .err()
            .expect("error response");
    };
    let Some(session) = require_session_from_context(pg, &ctx).await else {
        return iam_session_required_error();
    };
    if let Some(response) = ensure_directory_permission(&session, &["iam.organizations.read"]) {
        return response;
    }
    let organizations = match scoped_organizations_for_session(pg, &session, &query).await {
        Ok(items) => items,
        Err(message) => {
            return appbase_error(
                StatusCode::BAD_REQUEST,
                "iam_organizations_tree_too_large",
                &message,
            );
        }
    };
    let nodes = organization_roots(&organizations, &query)
        .iter()
        .map(|organization| organization_node_to_json(organization, &organizations))
        .collect::<Vec<_>>();
    appbase_ok(tree_resource_json(nodes))
}

async fn list_organization_memberships(
    State(state): State<LocalIamState>,
    ctx: WebRequestContext,
    Query(query): Query<HashMap<String, String>>,
) -> Response {
    let Ok(pg) = postgres_pool_or_error(&state) else {
        return postgres_pool_or_error(&state)
            .err()
            .expect("error response");
    };
    let Some(session) = require_session_from_context(pg, &ctx).await else {
        return iam_session_required_error();
    };
    if let Some(response) = ensure_directory_permission(
        &session,
        &["iam.memberships.read", "iam.organizations.read", "iam:self"],
    ) {
        return response;
    }
    let (memberships, total, params) =
        match paged_organization_memberships(pg, &session, &query).await {
            Ok(value) => value,
            Err(error) => return directory_query_error(error),
        };
    appbase_ok(list_page_json(
        memberships
            .iter()
            .map(organization_membership_to_json)
            .collect(),
        total,
        &params,
    ))
}

async fn list_departments(
    State(state): State<LocalIamState>,
    ctx: WebRequestContext,
    Query(query): Query<HashMap<String, String>>,
) -> Response {
    let Ok(pg) = postgres_pool_or_error(&state) else {
        return postgres_pool_or_error(&state)
            .err()
            .expect("error response");
    };
    let Some(session) = require_session_from_context(pg, &ctx).await else {
        return iam_session_required_error();
    };
    if let Some(response) = ensure_directory_permission(&session, &["iam.departments.read"]) {
        return response;
    }
    let (departments, total, params) =
        match paged_departments_for_session(pg, &session, &query).await {
            Ok(value) => value,
            Err(error) => return directory_query_error(error),
        };
    appbase_ok(list_page_json(
        departments.iter().map(department_to_json).collect(),
        total,
        &params,
    ))
}

async fn retrieve_department_tree(
    State(state): State<LocalIamState>,
    ctx: WebRequestContext,
    Query(query): Query<HashMap<String, String>>,
) -> Response {
    let Ok(pg) = postgres_pool_or_error(&state) else {
        return postgres_pool_or_error(&state)
            .err()
            .expect("error response");
    };
    let Some(session) = require_session_from_context(pg, &ctx).await else {
        return iam_session_required_error();
    };
    if let Some(response) = ensure_directory_permission(&session, &["iam.departments.read"]) {
        return response;
    }
    let departments = match scoped_departments_for_session(pg, &session, &query).await {
        Ok(items) => items,
        Err(message) => {
            return appbase_error(
                StatusCode::BAD_REQUEST,
                "iam_departments_tree_too_large",
                &message,
            );
        }
    };
    let nodes = department_roots(&departments, &query)
        .iter()
        .map(|department| department_node_to_json(department, &departments))
        .collect::<Vec<_>>();
    appbase_ok(tree_resource_json(nodes))
}

async fn list_department_assignments(
    State(state): State<LocalIamState>,
    ctx: WebRequestContext,
    Query(query): Query<HashMap<String, String>>,
) -> Response {
    let Ok(pg) = postgres_pool_or_error(&state) else {
        return postgres_pool_or_error(&state)
            .err()
            .expect("error response");
    };
    let Some(session) = require_session_from_context(pg, &ctx).await else {
        return iam_session_required_error();
    };
    if let Some(response) = ensure_directory_permission(&session, &["iam.assignments.read"]) {
        return response;
    }
    let (assignments, total, params) =
        match paged_department_assignments(pg, &session, &query).await {
            Ok(value) => value,
            Err(error) => return directory_query_error(error),
        };
    appbase_ok(list_page_json(
        assignments
            .iter()
            .map(department_assignment_to_json)
            .collect(),
        total,
        &params,
    ))
}

async fn list_positions(
    State(state): State<LocalIamState>,
    ctx: WebRequestContext,
    Query(query): Query<HashMap<String, String>>,
) -> Response {
    let Ok(pg) = postgres_pool_or_error(&state) else {
        return postgres_pool_or_error(&state)
            .err()
            .expect("error response");
    };
    let Some(session) = require_session_from_context(pg, &ctx).await else {
        return iam_session_required_error();
    };
    if let Some(response) = ensure_directory_permission(&session, &["iam.positions.read"]) {
        return response;
    }
    let (positions, total, params) = match paged_positions(pg, &session, &query).await {
        Ok(value) => value,
        Err(error) => return directory_query_error(error),
    };
    appbase_ok(list_page_json(
        positions.iter().map(position_to_json).collect(),
        total,
        &params,
    ))
}

async fn list_position_assignments(
    State(state): State<LocalIamState>,
    ctx: WebRequestContext,
    Query(query): Query<HashMap<String, String>>,
) -> Response {
    let Ok(pg) = postgres_pool_or_error(&state) else {
        return postgres_pool_or_error(&state)
            .err()
            .expect("error response");
    };
    let Some(session) = require_session_from_context(pg, &ctx).await else {
        return iam_session_required_error();
    };
    if let Some(response) = ensure_directory_permission(&session, &["iam.assignments.read"]) {
        return response;
    }
    let (assignments, total, params) = match paged_position_assignments(pg, &session, &query).await
    {
        Ok(value) => value,
        Err(error) => return directory_query_error(error),
    };
    appbase_ok(list_page_json(
        assignments
            .iter()
            .map(position_assignment_to_json)
            .collect(),
        total,
        &params,
    ))
}

async fn list_role_bindings(
    State(state): State<LocalIamState>,
    ctx: WebRequestContext,
    Query(query): Query<HashMap<String, String>>,
) -> Response {
    let Ok(pg) = postgres_pool_or_error(&state) else {
        return postgres_pool_or_error(&state)
            .err()
            .expect("error response");
    };
    let Some(session) = require_session_from_context(pg, &ctx).await else {
        return iam_session_required_error();
    };
    if let Some(response) = ensure_directory_permission(&session, &["iam.role_bindings.read"]) {
        return response;
    }
    let (bindings, total, params) = match paged_role_bindings(pg, &session, &query).await {
        Ok(value) => value,
        Err(error) => return directory_query_error(error),
    };
    appbase_ok(list_page_json(
        bindings.iter().map(role_binding_to_json).collect(),
        total,
        &params,
    ))
}

async fn create_authenticated_session_response(
    state: &LocalIamState,
    user: &LocalIamUser,
    runtime_app_id: &str,
) -> Response {
    match create_authenticated_session_or_challenge(state, user, None, runtime_app_id).await {
        AuthenticatedSessionOutcome::Session(session) => appbase_ok(session_to_json(&session)),
        AuthenticatedSessionOutcome::Challenge(challenge) => appbase_ok(challenge),
        AuthenticatedSessionOutcome::Error(response) => response,
    }
}

async fn record_successful_password_login(
    pg: &PgPool,
    config: &LocalIamConfig,
    user: &LocalIamUser,
    account: &str,
) {
    let account = canonical_identity(account);
    crate::security_events::record_login_success(
        pg,
        &user.tenant_id,
        &user.id,
        &account,
        "password",
    )
    .await;
    crate::audit_events::record_login_success(
        pg,
        config,
        &user.tenant_id,
        &user.id,
        &account,
        "password",
    )
    .await;
}

enum AuthenticatedSessionOutcome {
    Session(LocalSession),
    Challenge(Value),
    Error(Response),
}

async fn create_authenticated_session_or_challenge(
    state: &LocalIamState,
    user: &LocalIamUser,
    qr_session_key: Option<String>,
    runtime_app_id: &str,
) -> AuthenticatedSessionOutcome {
    let Ok(pg) = postgres_pool_or_error(&state) else {
        return AuthenticatedSessionOutcome::Error(
            postgres_pool_or_error(state).err().expect("error response"),
        );
    };
    let memberships =
        match active_organization_memberships_for_user(pg, &user.tenant_id, user).await {
            Ok(items) => items,
            Err(error) => {
                return AuthenticatedSessionOutcome::Error(directory_query_error(error));
            }
        };
    let eligible_memberships = login_eligible_organization_memberships(memberships);
    match eligible_memberships.len() {
        0 => match create_session_record(pg, &state.config, user, None, runtime_app_id).await {
            Ok(session) => AuthenticatedSessionOutcome::Session(session),
            Err(error) => AuthenticatedSessionOutcome::Error(appbase_error(
                StatusCode::INTERNAL_SERVER_ERROR,
                "iam_session_create_failed",
                &error,
            )),
        },
        _ => match login_context_selection_challenge_json(
            state,
            user,
            eligible_memberships,
            qr_session_key,
            runtime_app_id,
        )
        .await
        {
            Ok(challenge) => AuthenticatedSessionOutcome::Challenge(challenge),
            Err(error) => AuthenticatedSessionOutcome::Error(appbase_error(
                StatusCode::SERVICE_UNAVAILABLE,
                "iam_ephemeral_unavailable",
                &error,
            )),
        },
    }
}

fn login_eligible_organization_memberships(
    memberships: Vec<LocalOrganizationMembership>,
) -> Vec<LocalOrganizationMembership> {
    memberships
        .into_iter()
        .filter(|membership| !is_platform_organization_id(&membership.organization_id))
        .collect()
}

async fn active_organization_memberships_for_user(
    pg: &PgPool,
    tenant_id: &str,
    user: &LocalIamUser,
) -> Result<Vec<LocalOrganizationMembership>, sqlx::Error> {
    let row_limit = sdkwork_iam_bootstrap::IAM_ACTIVE_ORGANIZATION_MEMBERSHIP_ROW_LIMIT + 1;
    let rows = sqlx::query(
        "SELECT id, tenant_id, organization_id, user_id, membership_kind, is_primary, status \
         FROM iam_organization_membership \
         WHERE tenant_id = $1 AND user_id = $2 AND status = 'active' \
         ORDER BY is_primary DESC, organization_id, id \
         LIMIT $3",
    )
    .bind(tenant_id)
    .bind(&user.id)
    .bind(row_limit)
    .fetch_all(pg)
    .await?;

    if rows.len() > sdkwork_iam_bootstrap::IAM_ACTIVE_ORGANIZATION_MEMBERSHIP_ROW_LIMIT as usize {
        return Err(sqlx::Error::Protocol(
            "active organization membership row limit exceeded".into(),
        ));
    }

    Ok(rows
        .into_iter()
        .enumerate()
        .map(|(index, row)| LocalOrganizationMembership {
            id: row.get(0),
            tenant_id: row.get(1),
            organization_id: row.get(2),
            user_id: row.get(3),
            membership_type: row.get(4),
            primary: row.get::<i32, _>(5) != 0,
            status: row.get(6),
            order: index as i64,
            user: user.clone(),
        })
        .collect())
}

async fn has_active_organization_membership(
    pg: &PgPool,
    tenant_id: &str,
    organization_id: &str,
    user_id: &str,
) -> bool {
    sqlx::query(
        "SELECT 1 FROM iam_organization_membership \
         WHERE tenant_id = $1 AND organization_id = $2 AND user_id = $3 \
           AND status = 'active' \
         LIMIT 1",
    )
    .bind(tenant_id)
    .bind(organization_id)
    .bind(user_id)
    .fetch_optional(pg)
    .await
    .ok()
    .flatten()
    .is_some()
}

fn ensure_directory_permission(session: &LocalSession, permissions: &[&str]) -> Option<Response> {
    if crate::authorization::session_has_any_permission(session, permissions)
        || session
            .context
            .standard_role_codes
            .iter()
            .any(|code| code == sdkwork_iam_context_service::ORG_ADMIN_ROLE_CODE)
    {
        None
    } else {
        Some(iam_permission_forbidden_error())
    }
}

async fn persist_login_continuation(
    state: &LocalIamState,
    continuation_token: &str,
    continuation: &LocalLoginContinuation,
) -> Result<(), String> {
    let pg = state
        .pool
        .as_postgres()
        .ok_or_else(|| "login continuation requires PostgreSQL ephemeral storage".to_string())?;
    crate::ephemeral::insert_login_continuation(
        pg,
        LOCAL_EPHEMERAL_SCOPE,
        continuation_token,
        continuation,
    )
    .await
}

async fn login_context_selection_challenge_json(
    state: &LocalIamState,
    user: &LocalIamUser,
    memberships: Vec<LocalOrganizationMembership>,
    qr_session_key: Option<String>,
    runtime_app_id: &str,
) -> Result<Value, String> {
    let organization_ids = memberships
        .iter()
        .map(|membership| membership.organization_id.clone())
        .collect::<Vec<_>>();
    let organizations = if let Some(pg) = state.pool.as_postgres() {
        match organizations_by_ids(pg, &user.tenant_id, &organization_ids).await {
            Ok(items) => items
                .into_iter()
                .filter_map(|organization| {
                    memberships
                        .iter()
                        .find(|membership| membership.organization_id == organization.id)
                        .map(|membership| {
                            let mut value = organization_to_json(&organization);
                            value["membershipId"] = json!(membership.id);
                            value["membershipKind"] = json!(membership.membership_type);
                            value["primary"] = json!(membership.primary);
                            value
                        })
                })
                .collect::<Vec<_>>(),
            Err(error) => {
                return Err(format!("load login organizations failed: {error}"));
            }
        }
    } else {
        Vec::new()
    };
    let continuation_token = generate_opaque_token("login-continuation");
    let expire_time = current_millis() + LOGIN_CONTINUATION_TTL_MILLIS;
    let continuation = LocalLoginContinuation {
        continuation_kind: "login_context".to_string(),
        expire_time,
        organization_ids,
        qr_session_key,
        runtime_app_id: runtime_app_id.to_owned(),
        tenant_id: user.tenant_id.clone(),
        user: user.clone(),
    };
    persist_login_continuation(state, &continuation_token, &continuation).await?;

    Ok(json!({
        "accessToken": Value::Null,
        "authToken": Value::Null,
        "challengeType": "LOGIN_CONTEXT_SELECTION",
        "continuationToken": continuation_token,
        "expiresAt": expire_time,
        "user": user_to_json(user),
        "options": [
            {
                "loginScope": "TENANT",
                "organizationId": PLATFORM_ORGANIZATION_ID,
                "displayName": "Personal account"
            },
            {
                "loginScope": "ORGANIZATION",
                "requiresOrganizationSelection": true
            }
        ],
        "organizations": organizations,
        "refreshToken": Value::Null
    }))
}

async fn organizations_by_ids(
    pg: &PgPool,
    tenant_id: &str,
    organization_ids: &[String],
) -> Result<Vec<LocalOrganization>, sqlx::Error> {
    if organization_ids.is_empty() {
        return Ok(Vec::new());
    }

    let rows = sqlx::query(
        "SELECT id, tenant_id, parent_organization_id, name, organization_kind, \
                tenant_boundary_kind, data_boundary_kind, app_boundary_enabled, \
                verification_status, status \
         FROM iam_organization \
         WHERE tenant_id = $1 AND id = ANY($2) AND status = 'active' \
         ORDER BY name, id",
    )
    .bind(tenant_id)
    .bind(organization_ids)
    .fetch_all(pg)
    .await?;

    Ok(rows
        .into_iter()
        .map(|row| LocalOrganization {
            id: row.get(0),
            tenant_id: row.get(1),
            parent_organization_id: row.get(2),
            name: row.get(3),
            organization_kind: row.get(4),
            tenant_boundary_kind: row.get(5),
            data_boundary_kind: row.get(6),
            app_boundary_enabled: row.get::<i32, _>(7) != 0,
            verification_status: row.get(8),
            status: row.get(9),
            order: 0,
        })
        .collect())
}

async fn load_organization(
    pg: &PgPool,
    tenant_id: &str,
    organization_id: &str,
) -> Option<LocalOrganization> {
    let row = sqlx::query(
        "SELECT id, tenant_id, parent_organization_id, name, organization_kind, \
                tenant_boundary_kind, data_boundary_kind, app_boundary_enabled, \
                verification_status, status \
         FROM iam_organization \
         WHERE tenant_id = $1 AND id = $2 AND status = 'active' \
         LIMIT 1",
    )
    .bind(tenant_id)
    .bind(organization_id)
    .fetch_optional(pg)
    .await
    .ok()??;
    Some(LocalOrganization {
        id: row.get(0),
        tenant_id: row.get(1),
        parent_organization_id: row.get(2),
        name: row.get(3),
        organization_kind: row.get(4),
        tenant_boundary_kind: row.get(5),
        data_boundary_kind: row.get(6),
        app_boundary_enabled: row.get::<i32, _>(7) != 0,
        verification_status: row.get(8),
        status: row.get(9),
        order: 0,
    })
}

async fn accessible_organization_ids_for_session(
    pg: &PgPool,
    session: &LocalSession,
) -> Result<Vec<String>, sqlx::Error> {
    if let Some(organization_id) = session
        .context
        .organization_id
        .as_ref()
        .filter(|value| !crate::is_blank(Some(value)) && *value != "0")
    {
        return Ok(vec![organization_id.clone()]);
    }
    let memberships =
        active_organization_memberships_for_user(pg, &session.context.tenant_id, &session.user)
            .await?;
    Ok(login_eligible_organization_memberships(memberships)
        .into_iter()
        .map(|membership| membership.organization_id)
        .collect())
}

async fn scoped_organizations_for_session(
    pg: &PgPool,
    session: &LocalSession,
    query: &HashMap<String, String>,
) -> Result<Vec<LocalOrganization>, String> {
    let organization_ids = accessible_organization_ids_for_session(pg, session)
        .await
        .map_err(|error| format!("load accessible organizations failed: {error}"))?;
    if organization_ids.is_empty() {
        return Ok(Vec::new());
    }
    let org_id = optional_query_string(query, &["organizationId", "organization_id", "id"]);
    let parent_id = optional_query_string(
        query,
        &[
            "parentOrganizationId",
            "parent_organization_id",
            "parentId",
            "parent_id",
        ],
    );
    let tree_limit = sdkwork_iam_bootstrap::IAM_TREE_MAX_NODES + 1;
    let rows = sqlx::query(&format!(
        "SELECT id, tenant_id, parent_organization_id, name, organization_kind, \
                tenant_boundary_kind, data_boundary_kind, app_boundary_enabled, \
                verification_status, status \
         FROM iam_organization \
         WHERE tenant_id = $1 AND status = 'active' AND id = ANY($2) \
           AND ($3::text IS NULL OR id = $3) \
           AND ($4::text IS NULL OR parent_organization_id = $4) \
         ORDER BY name, id \
         LIMIT $5"
    ))
    .bind(&session.context.tenant_id)
    .bind(&organization_ids)
    .bind(&org_id)
    .bind(&parent_id)
    .bind(tree_limit)
    .fetch_all(pg)
    .await
    .map_err(|error| format!("load organization tree failed: {error}"))?;
    if rows.len() > sdkwork_iam_bootstrap::IAM_TREE_MAX_NODES as usize {
        return Err("organization tree exceeds configured node limit".to_string());
    }
    Ok(rows
        .into_iter()
        .enumerate()
        .map(|(index, row)| LocalOrganization {
            id: row.get(0),
            tenant_id: row.get(1),
            parent_organization_id: row.get(2),
            name: row.get(3),
            organization_kind: row.get(4),
            tenant_boundary_kind: row.get(5),
            data_boundary_kind: row.get(6),
            app_boundary_enabled: row.get::<i32, _>(7) != 0,
            verification_status: row.get(8),
            status: row.get(9),
            order: index as i64,
        })
        .collect())
}

async fn paged_organizations_for_session(
    pg: &PgPool,
    session: &LocalSession,
    query: &HashMap<String, String>,
) -> DirectoryPagedResult<LocalOrganization> {
    let params = list_page_params_for_directory(query)?;
    let search_pattern = list_search_pattern(query);
    let organization_ids = accessible_organization_ids_for_session(pg, session).await?;
    if organization_ids.is_empty() {
        return Ok((Vec::new(), 0, params));
    }
    let org_id = optional_query_string(query, &["organizationId", "organization_id", "id"]);
    let parent_id = optional_query_string(
        query,
        &[
            "parentOrganizationId",
            "parent_organization_id",
            "parentId",
            "parent_id",
        ],
    );
    let rows = sqlx::query(&format!(
        "SELECT id, tenant_id, parent_organization_id, name, organization_kind, \
                tenant_boundary_kind, data_boundary_kind, app_boundary_enabled, \
                verification_status, status, COUNT(*) OVER() AS {LIST_TOTAL_COLUMN} \
         FROM iam_organization \
         WHERE tenant_id = $1 AND status = 'active' AND id = ANY($2) \
           AND ($3::text IS NULL OR id = $3) \
           AND ($4::text IS NULL OR parent_organization_id = $4) \
           AND ($5::text IS NULL OR LOWER(name) LIKE $5 OR LOWER(id) LIKE $5) \
         ORDER BY name, id \
         LIMIT $6 OFFSET $7"
    ))
    .bind(&session.context.tenant_id)
    .bind(&organization_ids)
    .bind(&org_id)
    .bind(&parent_id)
    .bind(&search_pattern)
    .bind(params.page_size)
    .bind(params.offset)
    .fetch_all(pg)
    .await?;
    let total = total_from_rows(&rows);
    let organizations = rows
        .into_iter()
        .enumerate()
        .map(|(index, row)| LocalOrganization {
            id: row.get(0),
            tenant_id: row.get(1),
            parent_organization_id: row.get(2),
            name: row.get(3),
            organization_kind: row.get(4),
            tenant_boundary_kind: row.get(5),
            data_boundary_kind: row.get(6),
            app_boundary_enabled: row.get::<i32, _>(7) != 0,
            verification_status: row.get(8),
            status: row.get(9),
            order: index as i64,
        })
        .collect();
    Ok((organizations, total, params))
}

async fn paged_organization_memberships(
    pg: &PgPool,
    session: &LocalSession,
    query: &HashMap<String, String>,
) -> DirectoryPagedResult<LocalOrganizationMembership> {
    let params = list_page_params_for_directory(query)?;
    let search_pattern = list_search_pattern(query);
    let membership_id = optional_query_string(
        query,
        &[
            "membershipId",
            "membership_id",
            "organizationMembershipId",
            "organization_membership_id",
            "id",
        ],
    );
    let organization_id = optional_query_string(query, &["organizationId", "organization_id"]);
    let user_id = optional_query_string(query, &["userId", "user_id"]);
    let status = optional_query_string(query, &["status"]);
    let rows = sqlx::query(&format!(
        "SELECT m.id, m.tenant_id, m.organization_id, m.user_id, m.membership_kind, \
                m.is_primary, m.status, u.username, u.display_name, u.email, u.phone, \
                u.email_verified, u.phone_verified, u.last_login_at, u.password_changed_at, \
                COUNT(*) OVER() AS {LIST_TOTAL_COLUMN} \
         FROM iam_organization_membership m \
         JOIN iam_user u ON u.id = m.user_id \
         WHERE m.tenant_id = $1 AND m.user_id = $2 AND m.status = 'active' \
           AND ($3::text IS NULL OR m.id = $3) \
           AND ($4::text IS NULL OR m.organization_id = $4) \
           AND ($5::text IS NULL OR m.user_id = $5) \
           AND ($6::text IS NULL OR m.status = $6) \
           AND ($9::text IS NULL OR LOWER(u.username) LIKE $9 OR LOWER(u.display_name) LIKE $9 \
                OR LOWER(COALESCE(u.email, '')) LIKE $9) \
         ORDER BY m.is_primary DESC, u.display_name, m.id \
         LIMIT $7 OFFSET $8"
    ))
    .bind(&session.context.tenant_id)
    .bind(&session.context.user_id)
    .bind(&membership_id)
    .bind(&organization_id)
    .bind(&user_id)
    .bind(&status)
    .bind(params.page_size)
    .bind(params.offset)
    .bind(&search_pattern)
    .fetch_all(pg)
    .await?;
    let total = total_from_rows(&rows);
    let memberships = rows
        .into_iter()
        .enumerate()
        .map(|(index, row)| {
            let user_id: String = row.get(3);
            let user = row_user_from_join(&row, &user_id, 7);
            LocalOrganizationMembership {
                id: row.get(0),
                tenant_id: row.get(1),
                organization_id: row.get(2),
                user_id: row.get(3),
                membership_type: row.get(4),
                primary: row.get::<i32, _>(5) != 0,
                status: row.get(6),
                order: index as i64,
                user,
            }
        })
        .collect();
    Ok((memberships, total, params))
}

async fn scoped_departments_for_session(
    pg: &PgPool,
    session: &LocalSession,
    query: &HashMap<String, String>,
) -> Result<Vec<LocalDepartment>, String> {
    let organization_ids = accessible_organization_ids_for_session(pg, session)
        .await
        .map_err(|error| format!("load accessible organizations failed: {error}"))?;
    if organization_ids.is_empty() {
        return Ok(Vec::new());
    }
    let organization_id = optional_query_string(query, &["organizationId", "organization_id"]);
    let department_id = optional_query_string(query, &["departmentId", "department_id", "id"]);
    let parent_id = optional_query_string(
        query,
        &[
            "parentDepartmentId",
            "parent_department_id",
            "parentId",
            "parent_id",
        ],
    );
    let tree_limit = sdkwork_iam_bootstrap::IAM_TREE_MAX_NODES + 1;
    let rows = sqlx::query(
        "SELECT id, tenant_id, organization_id, parent_department_id, name, status \
         FROM iam_department \
         WHERE tenant_id = $1 AND status = 'active' AND organization_id = ANY($2) \
           AND ($3::text IS NULL OR organization_id = $3) \
           AND ($4::text IS NULL OR id = $4) \
           AND ($5::text IS NULL OR parent_department_id = $5) \
         ORDER BY name, id \
         LIMIT $6",
    )
    .bind(&session.context.tenant_id)
    .bind(&organization_ids)
    .bind(&organization_id)
    .bind(&department_id)
    .bind(&parent_id)
    .bind(tree_limit)
    .fetch_all(pg)
    .await
    .map_err(|error| format!("load department tree failed: {error}"))?;
    if rows.len() > sdkwork_iam_bootstrap::IAM_TREE_MAX_NODES as usize {
        return Err("department tree exceeds configured node limit".to_string());
    }
    Ok(rows
        .into_iter()
        .enumerate()
        .map(|(index, row)| LocalDepartment {
            id: row.get(0),
            tenant_id: row.get(1),
            organization_id: row.get(2),
            parent_department_id: row.get(3),
            name: row.get(4),
            status: row.get(5),
            order: index as i64,
        })
        .collect())
}

async fn paged_departments_for_session(
    pg: &PgPool,
    session: &LocalSession,
    query: &HashMap<String, String>,
) -> DirectoryPagedResult<LocalDepartment> {
    let params = list_page_params_for_directory(query)?;
    let search_pattern = list_search_pattern(query);
    let organization_ids = accessible_organization_ids_for_session(pg, session).await?;
    if organization_ids.is_empty() {
        return Ok((Vec::new(), 0, params));
    }
    let organization_id = optional_query_string(query, &["organizationId", "organization_id"]);
    let department_id = optional_query_string(query, &["departmentId", "department_id", "id"]);
    let parent_id = optional_query_string(
        query,
        &[
            "parentDepartmentId",
            "parent_department_id",
            "parentId",
            "parent_id",
        ],
    );
    let rows = sqlx::query(&format!(
        "SELECT id, tenant_id, organization_id, parent_department_id, name, status, \
                COUNT(*) OVER() AS {LIST_TOTAL_COLUMN} \
         FROM iam_department \
         WHERE tenant_id = $1 AND status = 'active' AND organization_id = ANY($2) \
           AND ($3::text IS NULL OR organization_id = $3) \
           AND ($4::text IS NULL OR id = $4) \
           AND ($5::text IS NULL OR parent_department_id = $5) \
           AND ($6::text IS NULL OR LOWER(name) LIKE $6 OR LOWER(id) LIKE $6) \
         ORDER BY name, id \
         LIMIT $7 OFFSET $8"
    ))
    .bind(&session.context.tenant_id)
    .bind(&organization_ids)
    .bind(&organization_id)
    .bind(&department_id)
    .bind(&parent_id)
    .bind(&search_pattern)
    .bind(params.page_size)
    .bind(params.offset)
    .fetch_all(pg)
    .await?;
    let total = total_from_rows(&rows);
    let departments = rows
        .into_iter()
        .enumerate()
        .map(|(index, row)| LocalDepartment {
            id: row.get(0),
            tenant_id: row.get(1),
            organization_id: row.get(2),
            parent_department_id: row.get(3),
            name: row.get(4),
            status: row.get(5),
            order: index as i64,
        })
        .collect();
    Ok((departments, total, params))
}

async fn paged_department_assignments(
    pg: &PgPool,
    session: &LocalSession,
    query: &HashMap<String, String>,
) -> DirectoryPagedResult<LocalDepartmentAssignment> {
    let params = list_page_params_for_directory(query)?;
    let search_pattern = list_search_pattern(query);
    let assignment_id = optional_query_string(
        query,
        &[
            "assignmentId",
            "assignment_id",
            "departmentAssignmentId",
            "department_assignment_id",
            "id",
        ],
    );
    let organization_id = optional_query_string(query, &["organizationId", "organization_id"]);
    let department_id = optional_query_string(query, &["departmentId", "department_id"]);
    let membership_id = optional_query_string(
        query,
        &[
            "membershipId",
            "membership_id",
            "organizationMembershipId",
            "organization_membership_id",
        ],
    );
    let user_id = optional_query_string(query, &["userId", "user_id"]);
    let status = optional_query_string(query, &["status"]);
    let rows = sqlx::query(&format!(
        "SELECT a.id, a.tenant_id, a.organization_id, a.organization_membership_id, \
                a.department_id, a.user_id, a.assignment_kind, a.status, \
                u.username, u.display_name, u.email, u.phone, u.email_verified, \
                u.phone_verified, u.last_login_at, u.password_changed_at, \
                COUNT(*) OVER() AS {LIST_TOTAL_COLUMN} \
         FROM iam_department_assignment a \
         JOIN iam_user u ON u.id = a.user_id \
         WHERE a.tenant_id = $1 AND a.user_id = $2 AND a.status = 'active' \
           AND ($3::text IS NULL OR a.id = $3) \
           AND ($4::text IS NULL OR a.organization_id = $4) \
           AND ($5::text IS NULL OR a.department_id = $5) \
           AND ($6::text IS NULL OR a.organization_membership_id = $6) \
           AND ($7::text IS NULL OR a.user_id = $7) \
           AND ($8::text IS NULL OR a.status = $8) \
           AND ($11::text IS NULL OR LOWER(u.username) LIKE $11 OR LOWER(u.display_name) LIKE $11 \
                OR LOWER(COALESCE(u.email, '')) LIKE $11) \
         ORDER BY u.display_name, a.id \
         LIMIT $9 OFFSET $10"
    ))
    .bind(&session.context.tenant_id)
    .bind(&session.context.user_id)
    .bind(&assignment_id)
    .bind(&organization_id)
    .bind(&department_id)
    .bind(&membership_id)
    .bind(&user_id)
    .bind(&status)
    .bind(params.page_size)
    .bind(params.offset)
    .bind(&search_pattern)
    .fetch_all(pg)
    .await?;
    let total = total_from_rows(&rows);
    let assignments = rows
        .into_iter()
        .enumerate()
        .map(|(index, row)| {
            let user_id: String = row.get(5);
            let user = row_user_from_join(&row, &user_id, 8);
            LocalDepartmentAssignment {
                id: row.get(0),
                tenant_id: row.get(1),
                organization_id: row.get(2),
                organization_membership_id: row.get(3),
                department_id: row.get(4),
                user_id: row.get(5),
                assignment_type: row.get(6),
                status: row.get(7),
                order: index as i64,
                user,
            }
        })
        .collect();
    Ok((assignments, total, params))
}

async fn paged_positions(
    pg: &PgPool,
    session: &LocalSession,
    query: &HashMap<String, String>,
) -> DirectoryPagedResult<LocalPosition> {
    let params = list_page_params_for_directory(query)?;
    let search_pattern = list_search_pattern(query);
    let organization_ids = accessible_organization_ids_for_session(pg, session).await?;
    if organization_ids.is_empty() {
        return Ok((Vec::new(), 0, params));
    }
    let organization_id = optional_query_string(query, &["organizationId", "organization_id"]);
    let position_id = optional_query_string(query, &["positionId", "position_id", "id"]);
    let status = optional_query_string(query, &["status"]);
    let rows = sqlx::query(&format!(
        "SELECT id, tenant_id, organization_id, name, status, COUNT(*) OVER() AS {LIST_TOTAL_COLUMN} \
         FROM iam_position \
         WHERE tenant_id = $1 AND status = 'active' AND organization_id = ANY($2) \
           AND ($3::text IS NULL OR organization_id = $3) \
           AND ($4::text IS NULL OR id = $4) \
           AND ($5::text IS NULL OR status = $5) \
           AND ($6::text IS NULL OR LOWER(name) LIKE $6 OR LOWER(id) LIKE $6) \
         ORDER BY name, id \
         LIMIT $7 OFFSET $8"
    ))
    .bind(&session.context.tenant_id)
    .bind(&organization_ids)
    .bind(&organization_id)
    .bind(&position_id)
    .bind(&status)
    .bind(&search_pattern)
    .bind(params.page_size)
    .bind(params.offset)
    .fetch_all(pg)
    .await?;
    let total = total_from_rows(&rows);
    let positions = rows
        .into_iter()
        .enumerate()
        .map(|(index, row)| LocalPosition {
            id: row.get(0),
            tenant_id: row.get(1),
            organization_id: row.get(2),
            name: row.get(3),
            status: row.get(4),
            order: index as i64,
        })
        .collect();
    Ok((positions, total, params))
}

async fn paged_position_assignments(
    pg: &PgPool,
    session: &LocalSession,
    query: &HashMap<String, String>,
) -> DirectoryPagedResult<LocalPositionAssignment> {
    let params = list_page_params_for_directory(query)?;
    let search_pattern = list_search_pattern(query);
    let assignment_id = optional_query_string(
        query,
        &[
            "positionAssignmentId",
            "position_assignment_id",
            "assignmentId",
            "assignment_id",
            "id",
        ],
    );
    let department_assignment_id = optional_query_string(
        query,
        &["departmentAssignmentId", "department_assignment_id"],
    );
    let organization_id = optional_query_string(query, &["organizationId", "organization_id"]);
    let department_id = optional_query_string(query, &["departmentId", "department_id"]);
    let position_id = optional_query_string(query, &["positionId", "position_id"]);
    let user_id = optional_query_string(query, &["userId", "user_id"]);
    let status = optional_query_string(query, &["status"]);
    let rows = sqlx::query(&format!(
        "SELECT a.id, a.tenant_id, a.organization_id, a.department_assignment_id, \
                a.position_id, a.user_id, a.status, d.department_id, p.name, \
                COUNT(*) OVER() AS {LIST_TOTAL_COLUMN} \
         FROM iam_position_assignment a \
         LEFT JOIN iam_department_assignment d ON d.id = a.department_assignment_id \
         LEFT JOIN iam_position p ON p.id = a.position_id \
         WHERE a.tenant_id = $1 AND a.user_id = $2 AND a.status = 'active' \
           AND ($3::text IS NULL OR a.id = $3) \
           AND ($4::text IS NULL OR a.department_assignment_id = $4) \
           AND ($5::text IS NULL OR a.organization_id = $5) \
           AND ($6::text IS NULL OR d.department_id = $6) \
           AND ($7::text IS NULL OR a.position_id = $7) \
           AND ($8::text IS NULL OR a.user_id = $8) \
           AND ($9::text IS NULL OR a.status = $9) \
           AND ($12::text IS NULL OR LOWER(COALESCE(p.name, '')) LIKE $12) \
         ORDER BY p.name, a.id \
         LIMIT $10 OFFSET $11"
    ))
    .bind(&session.context.tenant_id)
    .bind(&session.context.user_id)
    .bind(&assignment_id)
    .bind(&department_assignment_id)
    .bind(&organization_id)
    .bind(&department_id)
    .bind(&position_id)
    .bind(&user_id)
    .bind(&status)
    .bind(params.page_size)
    .bind(params.offset)
    .bind(&search_pattern)
    .fetch_all(pg)
    .await?;
    let total = total_from_rows(&rows);
    let assignments = rows
        .into_iter()
        .enumerate()
        .map(|(index, row)| LocalPositionAssignment {
            id: row.get(0),
            tenant_id: row.get(1),
            organization_id: row.get(2),
            department_assignment_id: row.get(3),
            position_id: row.get(4),
            user_id: row.get(5),
            status: row.get(6),
            department_id: row.get::<Option<String>, _>(7).unwrap_or_default(),
            position_name: row.get::<Option<String>, _>(8).unwrap_or_default(),
            order: index as i64,
        })
        .collect();
    Ok((assignments, total, params))
}

async fn paged_role_bindings(
    pg: &PgPool,
    session: &LocalSession,
    query: &HashMap<String, String>,
) -> DirectoryPagedResult<LocalRoleBinding> {
    let params = list_page_params_for_directory(query)?;
    let search_pattern = list_search_pattern(query);
    let binding_id = optional_query_string(query, &["roleBindingId", "role_binding_id", "id"]);
    let principal_id = optional_query_string(query, &["principalId", "principal_id"]);
    let role_code = optional_query_string(query, &["roleCode", "role_code"]);
    let scope_kind = optional_query_string(query, &["scopeKind", "scope_kind"]);
    let scope_id = optional_query_string(query, &["scopeId", "scope_id"]);
    let status = optional_query_string(query, &["status"]);
    let rows = sqlx::query(&format!(
        "SELECT b.id, b.tenant_id, b.principal_id, r.code, b.scope_kind, b.scope_id, b.status, \
                COUNT(*) OVER() AS {LIST_TOTAL_COLUMN} \
         FROM iam_role_binding b \
         JOIN iam_role r ON r.id = b.role_id AND r.tenant_id = b.tenant_id \
         WHERE b.tenant_id = $1 AND b.status = 'active' \
           AND ( \
             (b.principal_kind = 'organization_membership' AND b.principal_id IN ( \
               SELECT id FROM iam_organization_membership \
               WHERE tenant_id = $1 AND user_id = $2 AND status = 'active' \
             )) \
             OR (b.principal_kind = 'user' AND b.principal_id = $2) \
           ) \
           AND ($3::text IS NULL OR b.id = $3) \
           AND ($4::text IS NULL OR b.principal_id = $4) \
           AND ($5::text IS NULL OR r.code = $5) \
           AND ($6::text IS NULL OR b.scope_kind = $6) \
           AND ($7::text IS NULL OR b.scope_id = $7) \
           AND ($8::text IS NULL OR b.status = $8) \
           AND ($11::text IS NULL OR LOWER(r.code) LIKE $11 OR LOWER(b.principal_id) LIKE $11) \
         ORDER BY r.code, b.id \
         LIMIT $9 OFFSET $10"
    ))
    .bind(&session.context.tenant_id)
    .bind(&session.context.user_id)
    .bind(&binding_id)
    .bind(&principal_id)
    .bind(&role_code)
    .bind(&scope_kind)
    .bind(&scope_id)
    .bind(&status)
    .bind(params.page_size)
    .bind(params.offset)
    .bind(&search_pattern)
    .fetch_all(pg)
    .await?;
    let total = total_from_rows(&rows);
    let bindings = rows
        .into_iter()
        .enumerate()
        .map(|(index, row)| LocalRoleBinding {
            id: row.get(0),
            tenant_id: row.get(1),
            principal_id: row.get(2),
            role_code: row.get(3),
            scope_kind: row.get(4),
            scope_id: row.get(5),
            status: row.get(6),
            order: index as i64,
        })
        .collect();
    Ok((bindings, total, params))
}

async fn load_user_by_account_global(pg: &PgPool, account: &str) -> Option<LocalIamUser> {
    let account_key = canonical_identity(account);
    let row = sqlx::query(
        "SELECT id, tenant_id, username, display_name, email, phone, email_verified, phone_verified, \
                last_login_at, password_changed_at \
         FROM iam_user \
         WHERE (LOWER(username) = $1 OR LOWER(email) = $1 OR phone = $1) \
           AND status = 'active' AND is_deleted = 0 \
           AND NULLIF(TRIM(tenant_id), '') IS NOT NULL \
         LIMIT 1",
    )
    .bind(account_key)
    .fetch_optional(pg)
    .await
    .ok()??;
    Some(LocalIamUser {
        id: row.get(0),
        tenant_id: row.get(1),
        username: row.get(2),
        display_name: row.get(3),
        email: row.get(4),
        phone: row.get(5),
        email_verified: row.get::<i32, _>(6) != 0,
        phone_verified: row.get::<i32, _>(7) != 0,
        last_login_at: row.get(8),
        password_changed_at: row.get(9),
    })
}

async fn load_user_by_account(pg: &PgPool, tenant_id: &str, account: &str) -> Option<LocalIamUser> {
    let account_key = canonical_identity(account);
    let row = sqlx::query(
        "SELECT id, tenant_id, username, display_name, email, phone, email_verified, phone_verified, \
                last_login_at, password_changed_at \
         FROM iam_user \
         WHERE tenant_id = $1 AND (LOWER(username) = $2 OR LOWER(email) = $2 OR phone = $2) \
           AND status = 'active' AND is_deleted = 0 \
         LIMIT 1",
    )
    .bind(tenant_id)
    .bind(account_key)
    .fetch_optional(pg)
    .await
    .ok()??;
    Some(LocalIamUser {
        id: row.get(0),
        tenant_id: row.get(1),
        username: row.get(2),
        display_name: row.get(3),
        email: row.get(4),
        phone: row.get(5),
        email_verified: row.get::<i32, _>(6) != 0,
        phone_verified: row.get::<i32, _>(7) != 0,
        last_login_at: row.get(8),
        password_changed_at: row.get(9),
    })
}

fn row_user_from_join(row: &sqlx::postgres::PgRow, user_id: &str, offset: usize) -> LocalIamUser {
    LocalIamUser {
        id: user_id.to_string(),
        tenant_id: row.get(1),
        username: row.get(offset),
        display_name: row.get(offset + 1),
        email: row.get(offset + 2),
        phone: row.get(offset + 3),
        email_verified: row.get::<i32, _>(offset + 4) != 0,
        phone_verified: row.get::<i32, _>(offset + 5) != 0,
        last_login_at: row.get(offset + 6),
        password_changed_at: row.get(offset + 7),
    }
}
