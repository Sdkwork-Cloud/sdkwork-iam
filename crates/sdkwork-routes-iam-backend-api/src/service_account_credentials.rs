use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::Response,
    routing::post,
    Json, Router,
};
use sdkwork_iam_web_adapter::{
    create_service_account_credential, created_service_account_credential_to_json,
    exchange_service_account_credential, issued_service_account_tokens_to_json,
    parse_service_account_credential_create_request, parse_service_account_token_exchange_request,
    record_audit_event, revoke_service_account_credential,
};
use sdkwork_web_core::WebRequestContext;
use serde_json::{json, Value};

use crate::handlers::{
    actor_user_id_from_context, appbase_error, appbase_ok, ensure_target_tenant_access,
    postgres_pool_or_error, tenant_id_from_context, BackendIamState,
};

pub(crate) fn apply_service_account_credential_routes(
    router: Router<BackendIamState>,
) -> Router<BackendIamState> {
    router
        .route(
            "/backend/v3/api/iam/service_accounts/{serviceAccountId}/credentials",
            post(create_credential),
        )
        .route(
            "/backend/v3/api/iam/service_account_credentials/{credentialId}/revoke",
            post(revoke_credential),
        )
        .route(
            "/backend/v3/api/iam/service_account_tokens",
            post(exchange_credential),
        )
}

async fn create_credential(
    State(state): State<BackendIamState>,
    context: WebRequestContext,
    Path(service_account_id): Path<String>,
    Json(body): Json<Value>,
) -> Response {
    let pg = match postgres_pool_or_error(&state) {
        Ok(pg) => pg,
        Err(response) => return response,
    };
    let tenant_id = match tenant_id_from_context(&context) {
        Ok(value) => value,
        Err(response) => return response,
    };
    if let Err(response) = ensure_target_tenant_access(&context, &tenant_id) {
        return response;
    }
    let actor_id = match actor_user_id_from_context(&context) {
        Some(value) => value,
        None => {
            return appbase_error(
                StatusCode::UNAUTHORIZED,
                "iam_principal_required",
                "authenticated admin principal is required",
            )
        }
    };
    let request = match parse_service_account_credential_create_request(&body) {
        Ok(value) => value,
        Err(message) => {
            return appbase_error(
                StatusCode::BAD_REQUEST,
                "iam_service_account_credential_invalid",
                &message,
            )
        }
    };

    match create_service_account_credential(
        pg,
        &tenant_id,
        &service_account_id,
        &actor_id,
        &request,
    )
    .await
    {
        Ok(created) => {
            if let Err(error) = record_audit_event(
                pg,
                &tenant_id,
                context.organization_id(),
                Some(&actor_id),
                "service_account_credential.create",
                "iam_service_account_credential",
                Some(&created.credential_id),
                Some(context.request_id.0.as_str()),
                "prod",
                json!({
                    "serviceAccountId": service_account_id,
                    "tenantApplicationId": created.tenant_application_id,
                    "clientId": created.client_id,
                }),
            )
            .await
            {
                tracing::warn!(error = %error, "service account credential audit failed");
            }
            appbase_ok(created_service_account_credential_to_json(&created))
        }
        Err(message) if message.contains("not found") => appbase_error(
            StatusCode::NOT_FOUND,
            "iam_service_account_credential_target_not_found",
            &message,
        ),
        Err(message)
            if message.contains("must be enabled") || message.contains("does not match") =>
        {
            appbase_error(
                StatusCode::CONFLICT,
                "iam_service_account_credential_conflict",
                &message,
            )
        }
        Err(message) => appbase_error(
            StatusCode::SERVICE_UNAVAILABLE,
            "iam_service_account_credential_create_failed",
            &message,
        ),
    }
}

async fn revoke_credential(
    State(state): State<BackendIamState>,
    context: WebRequestContext,
    Path(credential_id): Path<String>,
    Json(_body): Json<Value>,
) -> Response {
    let pg = match postgres_pool_or_error(&state) {
        Ok(pg) => pg,
        Err(response) => return response,
    };
    let tenant_id = match tenant_id_from_context(&context) {
        Ok(value) => value,
        Err(response) => return response,
    };
    match revoke_service_account_credential(pg, &tenant_id, &credential_id).await {
        Ok(true) => {
            if let Err(error) = record_audit_event(
                pg,
                &tenant_id,
                context.organization_id(),
                actor_user_id_from_context(&context).as_deref(),
                "service_account_credential.revoke",
                "iam_service_account_credential",
                Some(&credential_id),
                Some(context.request_id.0.as_str()),
                "prod",
                json!({ "credentialId": credential_id }),
            )
            .await
            {
                tracing::warn!(error = %error, "service account credential revoke audit failed");
            }
            appbase_ok(json!({
                "accepted": true,
                "resourceId": credential_id,
                "status": "revoked",
            }))
        }
        Ok(false) => appbase_error(
            StatusCode::NOT_FOUND,
            "iam_service_account_credential_not_found",
            "active service account credential was not found",
        ),
        Err(message) => appbase_error(
            StatusCode::SERVICE_UNAVAILABLE,
            "iam_service_account_credential_revoke_failed",
            &message,
        ),
    }
}

async fn exchange_credential(
    State(state): State<BackendIamState>,
    Json(body): Json<Value>,
) -> Response {
    let pg = match postgres_pool_or_error(&state) {
        Ok(pg) => pg,
        Err(response) => return response,
    };
    let request = match parse_service_account_token_exchange_request(&body) {
        Ok(value) => value,
        Err(message) => {
            return appbase_error(
                StatusCode::BAD_REQUEST,
                "iam_service_account_token_exchange_invalid",
                &message,
            )
        }
    };
    match exchange_service_account_credential(pg, &request).await {
        Ok(tokens) => appbase_ok(issued_service_account_tokens_to_json(&tokens)),
        Err(message) if message.contains("invalid, expired, or revoked") => appbase_error(
            StatusCode::UNAUTHORIZED,
            "iam_service_account_credential_invalid",
            &message,
        ),
        Err(message) if message.contains("permission") || message.contains("accessPermissions") => {
            appbase_error(
                StatusCode::FORBIDDEN,
                "iam_service_account_scope_denied",
                &message,
            )
        }
        Err(message) => appbase_error(
            StatusCode::SERVICE_UNAVAILABLE,
            "iam_service_account_token_exchange_failed",
            &message,
        ),
    }
}
