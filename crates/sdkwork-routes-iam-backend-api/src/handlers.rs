use std::collections::HashMap;
use std::sync::Arc;

use crate::is_blank;
use axum::{
    extract::{Path, Query, Request, State},
    http::{Method, StatusCode},
    middleware::{self, Next},
    response::Response,
    routing::{get, post},
    Json, Router,
};
use sdkwork_iam_bootstrap::DEFAULT_IAM_TENANT_ID;
use sdkwork_iam_database_host;
use sdkwork_iam_web_adapter::{
    account_binding_policy_to_json, disable_tenant_application, enable_tenant_application,
    ensure_actor_tenant_scope, ensure_bootstrap_permission, iam_api_error, iam_api_success,
    issue_delegated_access_credential, issued_access_credential_to_json,
    load_account_binding_policy, parse_access_credential_create_request,
    parse_account_binding_policy, parse_application_register_command,
    parse_tenant_application_provision_command, parse_tenant_application_update_command,
    provision_tenant_application, register_application_template,
    registered_application_template_to_json, resolve_bootstrap_actor, resolve_tenant_application,
    save_account_binding_policy, tenant_application_to_json, update_tenant_application,
    AccountBindingPolicyDocument, IAM_ACCESS_CREDENTIALS_CREATE_PERMISSION,
    IAM_APPLICATIONS_REGISTER_PERMISSION, IAM_TENANT_APPLICATIONS_ENABLE_PERMISSION,
    IAM_TENANT_APPLICATIONS_PROVISION_PERMISSION, IAM_TENANT_APPLICATIONS_UPDATE_PERMISSION,
};
use sdkwork_utils_rust::sdkwork_resource_json;
use sdkwork_web_core::WebRequestContext;
use serde_json::{json, Value};
use sqlx::{types::Json as SqlJson, PgPool, Row};

use crate::backend_sql::{
    internal_handler_error, list_page_params_or_error, list_search_pattern, page_json_from_rows,
    LIST_TOTAL_COLUMN,
};
use crate::manifest::iam_backend_api_route_manifest;
use crate::web_bootstrap::wrap_router_with_web_framework;

#[derive(Clone)]
pub(crate) struct BackendIamState {
    pool: Option<Arc<PgPool>>,
}

use crate::management;
use crate::oauth_management;

const BACKEND_EPHEMERAL_SCOPE: &str = "iam-backend";
const BACKEND_RATE_LIMIT_MAX_REQUESTS: u32 = 60;
const BACKEND_RATE_LIMIT_WINDOW_SECONDS: u32 = 60;

async fn backend_write_rate_limit_middleware(
    State(state): State<BackendIamState>,
    request: Request,
    next: Next,
) -> Response {
    if matches!(
        request.method(),
        &Method::POST | &Method::PUT | &Method::PATCH | &Method::DELETE
    ) {
        if let Some(pg) = state.pool.as_deref() {
            let bucket = backend_rate_limit_bucket(&request);
            if let Some(response) = enforce_backend_rate_limit(pg, &bucket).await {
                return response;
            }
        } else {
            return appbase_error(
                StatusCode::SERVICE_UNAVAILABLE,
                "iam_database_unavailable",
                "backend IAM API requires a PostgreSQL database pool",
            );
        }
    }
    next.run(request).await
}

fn backend_rate_limit_bucket(request: &Request) -> String {
    let path = request.uri().path();
    if let Some(ctx) = request.extensions().get::<WebRequestContext>() {
        let tenant_id = ctx
            .principal()
            .map(|principal| principal.tenant_id())
            .unwrap_or("anonymous");
        let actor_id = ctx.user_id().unwrap_or("anonymous");
        return format!("backend:write:{tenant_id}:{actor_id}:{path}");
    }
    format!("backend:write:anonymous:{path}")
}

async fn enforce_backend_rate_limit(pg: &PgPool, bucket: &str) -> Option<Response> {
    match sdkwork_iam_web_adapter::check_rate_limit(
        pg,
        BACKEND_EPHEMERAL_SCOPE,
        bucket,
        BACKEND_RATE_LIMIT_MAX_REQUESTS,
        BACKEND_RATE_LIMIT_WINDOW_SECONDS,
    )
    .await
    {
        Ok(true) => None,
        Ok(false) => Some(appbase_error(
            StatusCode::TOO_MANY_REQUESTS,
            "iam_rate_limited",
            "too many requests — try again later",
        )),
        Err(error) => Some(appbase_error(
            StatusCode::SERVICE_UNAVAILABLE,
            "iam_ephemeral_unavailable",
            &error,
        )),
    }
}

/// Builds a fail-closed local/private `sdkwork-iam-backend-api` router.
///
/// Backend API routes require an admin/operator IAM service implementation.
pub fn build_sdkwork_iam_backend_api_router() -> Router {
    wrap_router_with_web_framework(Router::new().with_state(BackendIamState { pool: None }))
}

/// Builds the backend IAM router with an IAM database pool from environment when configured.
pub async fn build_sdkwork_iam_backend_api_router_from_env() -> Router {
    let pool = match sdkwork_iam_database_host::bootstrap_iam_database_from_env().await {
        Ok(host) => host.postgres_pool().ok().map(|pool| Arc::new(pool.clone())),
        Err(error) => {
            tracing::warn!(error = %error, "IAM database bootstrap unavailable for backend API");
            None
        }
    };

    let state = BackendIamState { pool };
    let router = oauth_management::apply_oauth_routes(management::apply_management_routes(
        crate::service_account_credentials::apply_service_account_credential_routes(
            Router::new()
                .route(
                    "/backend/v3/api/iam/account_binding_policy",
                    get(retrieve_account_binding_policy).patch(update_account_binding_policy),
                )
                .route(
                    "/backend/v3/api/iam/access_credentials",
                    post(create_access_credential),
                )
                .route(
                    "/backend/v3/api/iam/applications/register",
                    post(register_application),
                )
                .route(
                    "/backend/v3/api/iam/tenant_applications",
                    post(provision_tenant_application_handler),
                )
                .route(
                    "/backend/v3/api/iam/tenant_applications/{tenantApplicationId}",
                    get(retrieve_tenant_application_handler)
                        .patch(update_tenant_application_handler),
                )
                .route(
                    "/backend/v3/api/iam/tenant_applications/{tenantApplicationId}/enable",
                    post(enable_tenant_application_handler),
                )
                .route(
                    "/backend/v3/api/iam/tenants/{tenantId}/applications",
                    get(list_tenant_applications_handler)
                        .post(provision_tenant_application_management_handler),
                )
                .route(
                    "/backend/v3/api/iam/tenants/{tenantId}/applications/summary",
                    get(retrieve_tenant_application_summary_handler),
                )
                .route(
                    "/backend/v3/api/iam/tenants/{tenantId}/applications/{tenantApplicationId}",
                    axum::routing::patch(update_tenant_application_management_handler),
                )
                .route(
                    "/backend/v3/api/iam/tenants/{tenantId}/applications/{tenantApplicationId}/enable",
                    post(enable_tenant_application_management_handler),
                )
                .route(
                    "/backend/v3/api/iam/tenants/{tenantId}/applications/{tenantApplicationId}/disable",
                    post(disable_tenant_application_management_handler),
                ),
        ),
    ))
    .with_state(state.clone())
    .layer(middleware::from_fn_with_state(
        state,
        backend_write_rate_limit_middleware,
    ));

    sdkwork_iam_web_adapter::wrap_router_with_iam_backend_web_framework_from_env(
        router,
        iam_backend_api_route_manifest(),
    )
    .await
}

pub(crate) fn postgres_pool_or_error(state: &BackendIamState) -> Result<&PgPool, Response> {
    state.pool.as_deref().ok_or_else(|| {
        appbase_error(
            StatusCode::SERVICE_UNAVAILABLE,
            "iam_database_unavailable",
            "backend IAM API requires a PostgreSQL database pool",
        )
    })
}

fn principal_from_context(
    ctx: &WebRequestContext,
) -> Result<&sdkwork_web_core::WebRequestPrincipal, Response> {
    ctx.principal.as_ref().ok_or_else(|| {
        appbase_error(
            StatusCode::UNAUTHORIZED,
            "iam_principal_required",
            "authenticated admin principal is required",
        )
    })
}

pub(crate) fn tenant_id_from_context(ctx: &WebRequestContext) -> Result<String, Response> {
    Ok(principal_from_context(ctx)?.tenant_id().to_owned())
}

/// Enforces tenant data isolation for path-scoped tenant operations.
///
/// Platform operators authenticated in the default IAM tenant may access other tenants.
pub(crate) fn ensure_target_tenant_access(
    ctx: &WebRequestContext,
    target_tenant_id: &str,
) -> Result<(), Response> {
    let session_tenant_id = tenant_id_from_context(ctx)?;
    if session_tenant_id.trim() == target_tenant_id.trim() {
        return Ok(());
    }
    if session_tenant_id.trim() == DEFAULT_IAM_TENANT_ID {
        return Ok(());
    }
    Err(appbase_error(
        StatusCode::FORBIDDEN,
        "iam_tenant_access_denied",
        "tenant access denied",
    ))
}

/// Global permission catalog mutations are restricted to the platform tenant.
pub(crate) fn ensure_platform_catalog_access(ctx: &WebRequestContext) -> Result<(), Response> {
    let session_tenant_id = tenant_id_from_context(ctx)?;
    if session_tenant_id.trim() == DEFAULT_IAM_TENANT_ID {
        return Ok(());
    }
    Err(appbase_error(
        StatusCode::FORBIDDEN,
        "iam_permission_catalog_forbidden",
        "permission catalog mutations require platform tenant access",
    ))
}

pub(crate) fn organization_id_from_context(ctx: &WebRequestContext) -> Option<String> {
    ctx.organization_id()
        .map(str::trim)
        .filter(|value| !is_blank(Some(value)))
        .map(str::to_owned)
}

pub(crate) fn actor_user_id_from_context(ctx: &WebRequestContext) -> Option<String> {
    ctx.user_id().map(str::to_owned)
}

pub(crate) fn assigner_permission_scope(ctx: &WebRequestContext) -> Result<Vec<String>, Response> {
    Ok(principal_from_context(ctx)?.scopes.permission_scope.clone())
}

async fn create_access_credential(
    State(state): State<BackendIamState>,
    Json(body): Json<Value>,
) -> Response {
    let Ok(pg) = postgres_pool_or_error(&state) else {
        return postgres_pool_or_error(&state)
            .err()
            .expect("error response");
    };
    if let Some(response) =
        enforce_backend_rate_limit(pg, "backend:access_credentials:create").await
    {
        return response;
    }

    let request = match parse_access_credential_create_request(&body) {
        Ok(request) => request,
        Err(message) => {
            return appbase_error(
                StatusCode::BAD_REQUEST,
                "iam_access_credential_create_invalid",
                &message,
            );
        }
    };

    let actor = match resolve_bootstrap_actor(pg, &body).await {
        Ok(actor) => actor,
        Err(message) if message.contains("invalid") || message.contains("required") => {
            return appbase_error(
                StatusCode::UNAUTHORIZED,
                "iam_super_admin_auth_failed",
                &message,
            );
        }
        Err(message)
            if message.contains("not a bootstrap operator")
                || message.contains("not a super admin") =>
        {
            return appbase_error(
                StatusCode::FORBIDDEN,
                "iam_access_credentials_create_forbidden",
                &message,
            );
        }
        Err(message) => {
            return appbase_error(
                StatusCode::SERVICE_UNAVAILABLE,
                "iam_super_admin_auth_unavailable",
                &message,
            );
        }
    };

    if let Err(message) =
        ensure_bootstrap_permission(pg, &actor, IAM_ACCESS_CREDENTIALS_CREATE_PERMISSION).await
    {
        return appbase_error(
            StatusCode::FORBIDDEN,
            "iam_access_credentials_create_forbidden",
            &message,
        );
    }
    if let Err(message) = ensure_actor_tenant_scope(&actor, &request.tenant_id) {
        return appbase_error(
            StatusCode::FORBIDDEN,
            "iam_access_credentials_create_forbidden",
            &message,
        );
    }

    match issue_delegated_access_credential(pg, &actor, &request).await {
        Ok(issued) => appbase_ok(issued_access_credential_to_json(&issued)),
        Err(message) if message.contains("was not found") => appbase_error(
            StatusCode::NOT_FOUND,
            "iam_access_credential_create_target_not_found",
            &message,
        ),
        Err(message) if message.contains("must be enabled") => appbase_error(
            StatusCode::CONFLICT,
            "iam_access_credential_create_not_enabled",
            &message,
        ),
        Err(message) => {
            tracing::warn!(error = %message, "delegated access credential issuance failed");
            appbase_error(
                StatusCode::SERVICE_UNAVAILABLE,
                "iam_access_credential_create_failed",
                &message,
            )
        }
    }
}

async fn register_application(
    State(state): State<BackendIamState>,
    Json(body): Json<Value>,
) -> Response {
    let Ok(pg) = postgres_pool_or_error(&state) else {
        return postgres_pool_or_error(&state)
            .err()
            .expect("error response");
    };
    if let Some(response) = enforce_backend_rate_limit(pg, "backend:applications:register").await {
        return response;
    }

    let command = match parse_application_register_command(&body) {
        Ok(command) => command,
        Err(message) => {
            return appbase_error(
                StatusCode::BAD_REQUEST,
                "iam_applications_register_invalid",
                &message,
            );
        }
    };

    let actor = match resolve_bootstrap_actor(pg, &body).await {
        Ok(actor) => actor,
        Err(message) if message.contains("invalid") || message.contains("required") => {
            return appbase_error(
                StatusCode::UNAUTHORIZED,
                "iam_super_admin_auth_failed",
                &message,
            );
        }
        Err(message)
            if message.contains("not a bootstrap operator")
                || message.contains("not a super admin") =>
        {
            return appbase_error(
                StatusCode::FORBIDDEN,
                "iam_applications_register_forbidden",
                &message,
            );
        }
        Err(message) => {
            return appbase_error(
                StatusCode::SERVICE_UNAVAILABLE,
                "iam_super_admin_auth_unavailable",
                &message,
            );
        }
    };

    if let Err(message) =
        ensure_bootstrap_permission(pg, &actor, IAM_APPLICATIONS_REGISTER_PERMISSION).await
    {
        return appbase_error(
            StatusCode::FORBIDDEN,
            "iam_applications_register_forbidden",
            &message,
        );
    }

    match register_application_template(pg, &command).await {
        Ok(template) => appbase_ok(registered_application_template_to_json(&template)),
        Err(message) if message.contains("already registered") => appbase_error(
            StatusCode::CONFLICT,
            "iam_application_template_package_name_conflict",
            &message,
        ),
        Err(message) => appbase_error(
            StatusCode::SERVICE_UNAVAILABLE,
            "iam_applications_register_failed",
            &message,
        ),
    }
}

async fn provision_tenant_application_handler(
    State(state): State<BackendIamState>,
    Json(body): Json<Value>,
) -> Response {
    let Ok(pg) = postgres_pool_or_error(&state) else {
        return postgres_pool_or_error(&state)
            .err()
            .expect("error response");
    };
    if let Some(response) =
        enforce_backend_rate_limit(pg, "backend:tenant_applications:provision").await
    {
        return response;
    }

    let command = match parse_tenant_application_provision_command(&body) {
        Ok(command) => command,
        Err(message) => {
            return appbase_error(
                StatusCode::BAD_REQUEST,
                "iam_tenant_application_provision_invalid",
                &message,
            );
        }
    };

    let actor = match resolve_bootstrap_actor(pg, &body).await {
        Ok(actor) => actor,
        Err(message) if message.contains("invalid") || message.contains("required") => {
            return appbase_error(
                StatusCode::UNAUTHORIZED,
                "iam_super_admin_auth_failed",
                &message,
            );
        }
        Err(message)
            if message.contains("not a bootstrap operator")
                || message.contains("not a super admin") =>
        {
            return appbase_error(
                StatusCode::FORBIDDEN,
                "iam_tenant_application_provision_forbidden",
                &message,
            );
        }
        Err(message) => {
            return appbase_error(
                StatusCode::SERVICE_UNAVAILABLE,
                "iam_super_admin_auth_unavailable",
                &message,
            );
        }
    };

    if let Err(message) =
        ensure_bootstrap_permission(pg, &actor, IAM_TENANT_APPLICATIONS_PROVISION_PERMISSION).await
    {
        return appbase_error(
            StatusCode::FORBIDDEN,
            "iam_tenant_application_provision_forbidden",
            &message,
        );
    }
    if let Err(message) = ensure_actor_tenant_scope(&actor, &command.tenant_id) {
        return appbase_error(
            StatusCode::FORBIDDEN,
            "iam_tenant_application_provision_forbidden",
            &message,
        );
    }

    match provision_tenant_application(pg, &command).await {
        Ok(application) => appbase_created(sdkwork_resource_json(tenant_application_to_json(
            &application,
        ))),
        Err(message) if message.contains("not found") => appbase_error(
            StatusCode::NOT_FOUND,
            "iam_tenant_application_template_not_found",
            &message,
        ),
        Err(message) => appbase_error(
            StatusCode::SERVICE_UNAVAILABLE,
            "iam_tenant_application_provision_failed",
            &message,
        ),
    }
}

async fn update_tenant_application_handler(
    State(state): State<BackendIamState>,
    Path(tenant_application_id): Path<String>,
    Json(body): Json<Value>,
) -> Response {
    let Ok(pg) = postgres_pool_or_error(&state) else {
        return postgres_pool_or_error(&state)
            .err()
            .expect("error response");
    };
    if let Some(response) =
        enforce_backend_rate_limit(pg, "backend:tenant_applications:update").await
    {
        return response;
    }

    let tenant_id = match read_required_string(&body, &["tenantId", "tenant_id"]) {
        Ok(tenant_id) => tenant_id,
        Err(message) => {
            return appbase_error(
                StatusCode::BAD_REQUEST,
                "iam_tenant_application_update_invalid",
                &message,
            );
        }
    };

    let command = match parse_tenant_application_update_command(&body) {
        Ok(command) => command,
        Err(message) => {
            return appbase_error(
                StatusCode::BAD_REQUEST,
                "iam_tenant_application_update_invalid",
                &message,
            );
        }
    };

    let actor = match resolve_bootstrap_actor(pg, &body).await {
        Ok(actor) => actor,
        Err(message) if message.contains("invalid") || message.contains("required") => {
            return appbase_error(
                StatusCode::UNAUTHORIZED,
                "iam_super_admin_auth_failed",
                &message,
            );
        }
        Err(message)
            if message.contains("not a bootstrap operator")
                || message.contains("not a super admin") =>
        {
            return appbase_error(
                StatusCode::FORBIDDEN,
                "iam_tenant_application_update_forbidden",
                &message,
            );
        }
        Err(message) => {
            return appbase_error(
                StatusCode::SERVICE_UNAVAILABLE,
                "iam_super_admin_auth_unavailable",
                &message,
            );
        }
    };

    if let Err(message) =
        ensure_bootstrap_permission(pg, &actor, IAM_TENANT_APPLICATIONS_UPDATE_PERMISSION).await
    {
        return appbase_error(
            StatusCode::FORBIDDEN,
            "iam_tenant_application_update_forbidden",
            &message,
        );
    }
    if let Err(message) = ensure_actor_tenant_scope(&actor, &tenant_id) {
        return appbase_error(
            StatusCode::FORBIDDEN,
            "iam_tenant_application_update_forbidden",
            &message,
        );
    }

    match update_tenant_application(pg, &tenant_id, &tenant_application_id, &command).await {
        Ok(application) => appbase_ok(sdkwork_resource_json(tenant_application_to_json(
            &application,
        ))),
        Err(message) if message.contains("not found") => appbase_error(
            StatusCode::NOT_FOUND,
            "iam_tenant_application_not_found",
            &message,
        ),
        Err(message) => appbase_error(
            StatusCode::SERVICE_UNAVAILABLE,
            "iam_tenant_application_update_failed",
            &message,
        ),
    }
}

async fn retrieve_tenant_application_handler(
    State(state): State<BackendIamState>,
    ctx: WebRequestContext,
    Path(tenant_application_id): Path<String>,
    Query(query): Query<HashMap<String, String>>,
) -> Response {
    let Ok(pg) = postgres_pool_or_error(&state) else {
        return postgres_pool_or_error(&state)
            .err()
            .expect("error response");
    };
    if let Some(response) =
        enforce_backend_rate_limit(pg, "backend:tenant_applications:retrieve").await
    {
        return response;
    }

    let Ok(context_tenant_id) = tenant_id_from_context(&ctx) else {
        return tenant_id_from_context(&ctx).err().expect("error response");
    };
    let tenant_id = query
        .get("tenantId")
        .or_else(|| query.get("tenant_id"))
        .cloned()
        .filter(|value| !is_blank(Some(value.as_str())))
        .unwrap_or(context_tenant_id.clone());
    if tenant_id != context_tenant_id {
        return appbase_error(
            StatusCode::FORBIDDEN,
            "iam_tenant_application_retrieve_forbidden",
            "tenant application retrieve is limited to the authenticated tenant scope",
        );
    }

    match resolve_tenant_application(pg, &tenant_id, Some(&tenant_application_id), None, None).await
    {
        Ok(Some(application)) => appbase_ok(sdkwork_resource_json(tenant_application_to_json(
            &application,
        ))),
        Ok(None) => appbase_error(
            StatusCode::NOT_FOUND,
            "iam_tenant_application_not_found",
            "tenant application was not found",
        ),
        Err(message) => appbase_error(
            StatusCode::SERVICE_UNAVAILABLE,
            "iam_tenant_application_retrieve_failed",
            &message,
        ),
    }
}

async fn list_tenant_applications_handler(
    State(state): State<BackendIamState>,
    ctx: WebRequestContext,
    Path(tenant_id): Path<String>,
    Query(query): Query<HashMap<String, String>>,
) -> Response {
    let Ok(pg) = postgres_pool_or_error(&state) else {
        return postgres_pool_or_error(&state)
            .err()
            .expect("error response");
    };
    if let Err(response) = ensure_target_tenant_access(&ctx, &tenant_id) {
        return response;
    }
    let Ok(params) = list_page_params_or_error(&query) else {
        return list_page_params_or_error(&query)
            .err()
            .expect("error response");
    };
    let search_pattern = list_search_pattern(&query);
    let status = normalized_query_filter(&query, "status");
    let environment = normalized_query_filter(&query, "environment");
    let rows = sqlx::query(&format!(
        "SELECT id, app_id, tenant_id, organization_id, template_id, template_version, \
                instance_key, display_name, environment, status, primary_domain, \
                access_permissions_json, created_at::text, updated_at::text, \
                COUNT(*) OVER() AS {LIST_TOTAL_COLUMN} \
         FROM iam_tenant_application \
         WHERE tenant_id = $1 \
           AND ($4::text IS NULL OR LOWER(display_name) LIKE $4 OR LOWER(app_id) LIKE $4 \
                OR LOWER(instance_key) LIKE $4 OR LOWER(COALESCE(primary_domain, '')) LIKE $4) \
           AND ($5::text IS NULL OR status = $5) \
           AND ($6::text IS NULL OR environment = $6) \
         ORDER BY updated_at DESC, id \
         LIMIT $2 OFFSET $3"
    ))
    .bind(&tenant_id)
    .bind(params.page_size)
    .bind(params.offset)
    .bind(&search_pattern)
    .bind(&status)
    .bind(&environment)
    .fetch_all(pg)
    .await;

    match rows {
        Ok(rows) => appbase_ok(page_json_from_rows(
            rows,
            &params,
            tenant_application_list_row_to_json,
        )),
        Err(error) => internal_handler_error("iam_tenant_applications_list_failed", error),
    }
}

async fn retrieve_tenant_application_summary_handler(
    State(state): State<BackendIamState>,
    ctx: WebRequestContext,
    Path(tenant_id): Path<String>,
) -> Response {
    let Ok(pg) = postgres_pool_or_error(&state) else {
        return postgres_pool_or_error(&state)
            .err()
            .expect("error response");
    };
    if let Err(response) = ensure_target_tenant_access(&ctx, &tenant_id) {
        return response;
    }

    let row = sqlx::query(
        "SELECT COUNT(*)::BIGINT, \
                COUNT(*) FILTER (WHERE status = 'enabled')::BIGINT, \
                COUNT(*) FILTER (WHERE status = 'disabled')::BIGINT, \
                COUNT(*) FILTER (WHERE status NOT IN ('enabled', 'disabled'))::BIGINT \
         FROM iam_tenant_application WHERE tenant_id = $1",
    )
    .bind(&tenant_id)
    .fetch_one(pg)
    .await;

    match row {
        Ok(row) => appbase_ok(sdkwork_resource_json(json!({
            "disabled": row.get::<i64, _>(2),
            "enabled": row.get::<i64, _>(1),
            "pending": row.get::<i64, _>(3),
            "tenantId": tenant_id,
            "total": row.get::<i64, _>(0),
        }))),
        Err(error) => internal_handler_error("iam_tenant_applications_summary_failed", error),
    }
}

async fn provision_tenant_application_management_handler(
    State(state): State<BackendIamState>,
    ctx: WebRequestContext,
    Path(tenant_id): Path<String>,
    Json(mut body): Json<Value>,
) -> Response {
    let Ok(pg) = postgres_pool_or_error(&state) else {
        return postgres_pool_or_error(&state)
            .err()
            .expect("error response");
    };
    if let Err(response) = ensure_target_tenant_access(&ctx, &tenant_id) {
        return response;
    }
    let Some(object) = body.as_object_mut() else {
        return appbase_error(
            StatusCode::BAD_REQUEST,
            "iam_tenant_application_management_provision_invalid",
            "request body must be an object",
        );
    };
    object.insert("tenantId".to_string(), Value::String(tenant_id.clone()));

    let command = match parse_tenant_application_provision_command(&body) {
        Ok(command) => command,
        Err(message) => {
            return appbase_error(
                StatusCode::BAD_REQUEST,
                "iam_tenant_application_management_provision_invalid",
                &message,
            );
        }
    };

    match provision_tenant_application(pg, &command).await {
        Ok(application) => appbase_created(sdkwork_resource_json(tenant_application_to_json(
            &application,
        ))),
        Err(message) if message.contains("not found") => appbase_error(
            StatusCode::NOT_FOUND,
            "iam_tenant_application_template_not_found",
            &message,
        ),
        Err(message) if message.contains("duplicate") || message.contains("unique") => {
            appbase_error(
                StatusCode::CONFLICT,
                "iam_tenant_application_conflict",
                &message,
            )
        }
        Err(message) => appbase_error(
            StatusCode::SERVICE_UNAVAILABLE,
            "iam_tenant_application_management_provision_failed",
            &message,
        ),
    }
}

async fn update_tenant_application_management_handler(
    State(state): State<BackendIamState>,
    ctx: WebRequestContext,
    Path((tenant_id, tenant_application_id)): Path<(String, String)>,
    Json(body): Json<Value>,
) -> Response {
    let Ok(pg) = postgres_pool_or_error(&state) else {
        return postgres_pool_or_error(&state)
            .err()
            .expect("error response");
    };
    if let Err(response) = ensure_target_tenant_access(&ctx, &tenant_id) {
        return response;
    }
    let command = match parse_tenant_application_update_command(&body) {
        Ok(command) => command,
        Err(message) => {
            return appbase_error(
                StatusCode::BAD_REQUEST,
                "iam_tenant_application_management_update_invalid",
                &message,
            );
        }
    };

    match update_tenant_application(pg, &tenant_id, &tenant_application_id, &command).await {
        Ok(application) => appbase_ok(sdkwork_resource_json(tenant_application_to_json(
            &application,
        ))),
        Err(message) if message.contains("not found") => appbase_error(
            StatusCode::NOT_FOUND,
            "iam_tenant_application_not_found",
            &message,
        ),
        Err(message) => appbase_error(
            StatusCode::SERVICE_UNAVAILABLE,
            "iam_tenant_application_management_update_failed",
            &message,
        ),
    }
}

async fn enable_tenant_application_management_handler(
    State(state): State<BackendIamState>,
    ctx: WebRequestContext,
    Path((tenant_id, tenant_application_id)): Path<(String, String)>,
    Json(_body): Json<Value>,
) -> Response {
    transition_tenant_application_status(&state, &ctx, &tenant_id, &tenant_application_id, true)
        .await
}

async fn disable_tenant_application_management_handler(
    State(state): State<BackendIamState>,
    ctx: WebRequestContext,
    Path((tenant_id, tenant_application_id)): Path<(String, String)>,
    Json(_body): Json<Value>,
) -> Response {
    transition_tenant_application_status(&state, &ctx, &tenant_id, &tenant_application_id, false)
        .await
}

async fn transition_tenant_application_status(
    state: &BackendIamState,
    ctx: &WebRequestContext,
    tenant_id: &str,
    tenant_application_id: &str,
    enabled: bool,
) -> Response {
    let Ok(pg) = postgres_pool_or_error(state) else {
        return postgres_pool_or_error(state).err().expect("error response");
    };
    if let Err(response) = ensure_target_tenant_access(ctx, tenant_id) {
        return response;
    }
    let result = if enabled {
        enable_tenant_application(pg, tenant_id, tenant_application_id).await
    } else {
        disable_tenant_application(pg, tenant_id, tenant_application_id).await
    };

    match result {
        Ok(application) => appbase_ok(tenant_application_to_json(&application)),
        Err(message) if message.contains("not found") => appbase_error(
            StatusCode::NOT_FOUND,
            "iam_tenant_application_not_found",
            &message,
        ),
        Err(message) if message.contains("must be configured") => appbase_error(
            StatusCode::CONFLICT,
            "iam_tenant_application_not_configured",
            &message,
        ),
        Err(message) => appbase_error(
            StatusCode::SERVICE_UNAVAILABLE,
            if enabled {
                "iam_tenant_application_management_enable_failed"
            } else {
                "iam_tenant_application_management_disable_failed"
            },
            &message,
        ),
    }
}

fn normalized_query_filter(query: &HashMap<String, String>, key: &str) -> Option<String> {
    query
        .get(key)
        .map(|value| value.trim().to_lowercase())
        .filter(|value| !value.is_empty() && value != "all")
}

fn tenant_application_list_row_to_json(row: &sqlx::postgres::PgRow) -> Value {
    let access_permissions = row
        .try_get::<SqlJson<Vec<String>>, _>(11)
        .map(|value| value.0)
        .unwrap_or_default();
    json!({
        "accessPermissions": access_permissions,
        "appId": row.get::<String, _>(1),
        "createdAt": row.get::<String, _>(12),
        "displayName": row.get::<String, _>(7),
        "environment": row.get::<String, _>(8),
        "instanceKey": row.get::<String, _>(6),
        "organizationId": row.get::<String, _>(3),
        "primaryDomain": row.get::<Option<String>, _>(10),
        "status": row.get::<String, _>(9),
        "templateId": row.get::<String, _>(4),
        "templateVersion": row.get::<String, _>(5),
        "tenantApplicationId": row.get::<String, _>(0),
        "tenantId": row.get::<String, _>(2),
        "updatedAt": row.get::<String, _>(13),
    })
}

async fn enable_tenant_application_handler(
    State(state): State<BackendIamState>,
    Path(tenant_application_id): Path<String>,
    Json(body): Json<Value>,
) -> Response {
    let Ok(pg) = postgres_pool_or_error(&state) else {
        return postgres_pool_or_error(&state)
            .err()
            .expect("error response");
    };
    if let Some(response) =
        enforce_backend_rate_limit(pg, "backend:tenant_applications:enable").await
    {
        return response;
    }

    let tenant_id = match read_required_string(&body, &["tenantId", "tenant_id"]) {
        Ok(tenant_id) => tenant_id,
        Err(message) => {
            return appbase_error(
                StatusCode::BAD_REQUEST,
                "iam_tenant_application_enable_invalid",
                &message,
            );
        }
    };

    let actor = match resolve_bootstrap_actor(pg, &body).await {
        Ok(actor) => actor,
        Err(message) if message.contains("invalid") || message.contains("required") => {
            return appbase_error(
                StatusCode::UNAUTHORIZED,
                "iam_super_admin_auth_failed",
                &message,
            );
        }
        Err(message)
            if message.contains("not a bootstrap operator")
                || message.contains("not a super admin") =>
        {
            return appbase_error(
                StatusCode::FORBIDDEN,
                "iam_tenant_application_enable_forbidden",
                &message,
            );
        }
        Err(message) => {
            return appbase_error(
                StatusCode::SERVICE_UNAVAILABLE,
                "iam_super_admin_auth_unavailable",
                &message,
            );
        }
    };

    if let Err(message) =
        ensure_bootstrap_permission(pg, &actor, IAM_TENANT_APPLICATIONS_ENABLE_PERMISSION).await
    {
        return appbase_error(
            StatusCode::FORBIDDEN,
            "iam_tenant_application_enable_forbidden",
            &message,
        );
    }
    if let Err(message) = ensure_actor_tenant_scope(&actor, &tenant_id) {
        return appbase_error(
            StatusCode::FORBIDDEN,
            "iam_tenant_application_enable_forbidden",
            &message,
        );
    }

    match enable_tenant_application(pg, &tenant_id, &tenant_application_id).await {
        Ok(application) => appbase_ok(tenant_application_to_json(&application)),
        Err(message) if message.contains("not found") => appbase_error(
            StatusCode::NOT_FOUND,
            "iam_tenant_application_not_found",
            &message,
        ),
        Err(message) if message.contains("must be configured") => appbase_error(
            StatusCode::CONFLICT,
            "iam_tenant_application_enable_incomplete",
            &message,
        ),
        Err(message) => appbase_error(
            StatusCode::SERVICE_UNAVAILABLE,
            "iam_tenant_application_enable_failed",
            &message,
        ),
    }
}

async fn retrieve_account_binding_policy(
    State(state): State<BackendIamState>,
    ctx: WebRequestContext,
) -> Response {
    let Ok(pg) = postgres_pool_or_error(&state) else {
        return postgres_pool_or_error(&state)
            .err()
            .expect("error response");
    };
    let Ok(tenant_id) = tenant_id_from_context(&ctx) else {
        return tenant_id_from_context(&ctx).err().expect("error response");
    };

    match load_account_binding_policy(pg, &tenant_id).await {
        Ok(policy) => appbase_ok(account_binding_policy_to_json(&policy)),
        Err(error) => appbase_error(
            StatusCode::SERVICE_UNAVAILABLE,
            "iam_account_binding_policy_load_failed",
            &error,
        ),
    }
}

async fn update_account_binding_policy(
    State(state): State<BackendIamState>,
    ctx: WebRequestContext,
    Json(body): Json<Value>,
) -> Response {
    let Ok(pg) = postgres_pool_or_error(&state) else {
        return postgres_pool_or_error(&state)
            .err()
            .expect("error response");
    };
    let Ok(tenant_id) = tenant_id_from_context(&ctx) else {
        return tenant_id_from_context(&ctx).err().expect("error response");
    };

    let current = match load_account_binding_policy(pg, &tenant_id).await {
        Ok(policy) => policy,
        Err(error) => {
            return appbase_error(
                StatusCode::SERVICE_UNAVAILABLE,
                "iam_account_binding_policy_load_failed",
                &error,
            );
        }
    };
    let merged = merge_account_binding_policy_patch(current, &body);

    match save_account_binding_policy(pg, &tenant_id, &merged).await {
        Ok(()) => appbase_ok(account_binding_policy_to_json(&merged)),
        Err(error) => appbase_error(
            StatusCode::SERVICE_UNAVAILABLE,
            "iam_account_binding_policy_save_failed",
            &error,
        ),
    }
}

fn merge_account_binding_policy_patch(
    mut current: AccountBindingPolicyDocument,
    body: &Value,
) -> AccountBindingPolicyDocument {
    if let Some(contact_binding) = body
        .get("contactBinding")
        .or_else(|| body.get("contact_binding"))
    {
        current.contact_binding = parse_account_binding_policy(&json!({
            "contactBinding": contact_binding,
        }))
        .contact_binding;
    }

    if let Some(oauth_login) = body.get("oauthLogin").or_else(|| body.get("oauth_login")) {
        current.oauth_login = parse_account_binding_policy(&json!({
            "oauthLogin": oauth_login,
        }))
        .oauth_login;
    }

    if let Some(oauth_binding) = body
        .get("oauthBinding")
        .or_else(|| body.get("oauth_binding"))
    {
        current.oauth_binding = parse_account_binding_policy(&json!({
            "oauthBinding": oauth_binding,
        }))
        .oauth_binding;
    }

    current
}

fn read_required_string(body: &Value, keys: &[&str]) -> Result<String, String> {
    keys.iter()
        .find_map(|key| {
            body.get(*key)
                .and_then(Value::as_str)
                .map(str::trim)
                .filter(|value| !is_blank(Some(value)))
                .map(str::to_owned)
        })
        .ok_or_else(|| format!("{} is required", keys[0]))
}

pub(crate) fn appbase_ok(data: Value) -> Response {
    iam_api_success(data)
}

fn appbase_created(data: Value) -> Response {
    let mut response = iam_api_success(data);
    *response.status_mut() = StatusCode::CREATED;
    response
}

pub(crate) fn appbase_error(status: StatusCode, code: &str, message: &str) -> Response {
    iam_api_error(status, code, message)
}
