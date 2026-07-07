//! Tenant-scoped IAM directory and RBAC management handlers for backend-api.

use std::collections::HashMap;

use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    response::Response,
    routing::{delete, get, patch, post},
    Json, Router,
};
use chrono::Utc;
use sdkwork_utils_rust::sdkwork_resource_json;
use sdkwork_web_core::WebRequestContext;
use serde_json::{json, Value};
use sqlx::{PgPool, Row};
use uuid::Uuid;

use crate::backend_audit::{
    directory_create_with_audit, execute_conditional_mutation_with_audit,
    record_backend_mutation_audit_tx,
};
use crate::backend_sql::{
    cursor_page_json, encode_timeline_keyset_cursor, internal_handler_error,
    list_page_params_or_error, list_search_pattern, list_tenant_rows, page_json_from_rows,
    patch_tenant_row_tx, read_i32_field, read_string_field, retrieve_tenant_row,
    timeline_cursor_page_from_rows, timeline_list_params_or_error, tree_resource_json,
    TimelineListParams, LIST_TOTAL_COLUMN,
};
use crate::handlers::{
    appbase_error, appbase_ok, assigner_permission_scope, ensure_platform_catalog_access,
    ensure_target_tenant_access, organization_id_from_context, postgres_pool_or_error,
    tenant_id_from_context, BackendIamState,
};

pub fn apply_management_routes(router: Router<BackendIamState>) -> Router<BackendIamState> {
    router
        .route(
            "/backend/v3/api/iam/users",
            get(list_users).post(create_user),
        )
        .route(
            "/backend/v3/api/iam/users/{userId}",
            get(retrieve_user).patch(update_user).delete(delete_user),
        )
        .route(
            "/backend/v3/api/iam/roles",
            get(list_roles).post(create_role),
        )
        .route(
            "/backend/v3/api/iam/roles/{roleId}",
            get(retrieve_role).patch(update_role).delete(delete_role),
        )
        .route(
            "/backend/v3/api/iam/roles/{roleId}/permissions",
            get(list_role_permissions).post(create_role_permission),
        )
        .route(
            "/backend/v3/api/iam/roles/{roleId}/permissions/{permissionId}",
            delete(delete_role_permission),
        )
        .route(
            "/backend/v3/api/iam/permissions",
            get(list_permissions).post(create_permission),
        )
        .route(
            "/backend/v3/api/iam/permissions/{permissionId}",
            get(retrieve_permission)
                .patch(update_permission)
                .delete(delete_permission),
        )
        .route(
            "/backend/v3/api/iam/policies",
            get(list_policies).post(create_policy),
        )
        .route(
            "/backend/v3/api/iam/policies/{policyId}",
            get(retrieve_policy)
                .patch(update_policy)
                .delete(delete_policy),
        )
        .route(
            "/backend/v3/api/iam/organizations",
            get(list_organizations).post(create_organization),
        )
        .route(
            "/backend/v3/api/iam/organizations/tree",
            get(organizations_tree),
        )
        .route(
            "/backend/v3/api/iam/organizations/{organizationId}",
            get(retrieve_organization)
                .patch(update_organization)
                .delete(delete_organization),
        )
        .route(
            "/backend/v3/api/iam/organization_memberships",
            get(list_organization_memberships).post(create_organization_membership),
        )
        .route(
            "/backend/v3/api/iam/organization_memberships/{membershipId}",
            patch(update_organization_membership),
        )
        .route(
            "/backend/v3/api/iam/departments",
            get(list_departments).post(create_department),
        )
        .route(
            "/backend/v3/api/iam/departments/tree",
            get(departments_tree),
        )
        .route(
            "/backend/v3/api/iam/departments/{departmentId}",
            get(retrieve_department)
                .patch(update_department)
                .delete(delete_department),
        )
        .route(
            "/backend/v3/api/iam/department_assignments",
            get(list_department_assignments).post(create_department_assignment),
        )
        .route(
            "/backend/v3/api/iam/department_assignments/{assignmentId}",
            patch(update_department_assignment),
        )
        .route(
            "/backend/v3/api/iam/positions",
            get(list_positions).post(create_position),
        )
        .route(
            "/backend/v3/api/iam/positions/{positionId}",
            patch(update_position).delete(delete_position),
        )
        .route(
            "/backend/v3/api/iam/position_assignments",
            get(list_position_assignments).post(create_position_assignment),
        )
        .route(
            "/backend/v3/api/iam/position_assignments/{assignmentId}",
            patch(update_position_assignment),
        )
        .route(
            "/backend/v3/api/iam/tenants",
            get(list_tenants).post(create_tenant),
        )
        .route(
            "/backend/v3/api/iam/tenants/{tenantId}",
            get(retrieve_tenant)
                .patch(update_tenant)
                .delete(delete_tenant),
        )
        .route(
            "/backend/v3/api/iam/tenants/{tenantId}/members",
            get(list_tenant_members).post(create_tenant_member),
        )
        .route(
            "/backend/v3/api/iam/tenants/{tenantId}/members/{userId}",
            patch(update_tenant_member).delete(delete_tenant_member),
        )
        .route(
            "/backend/v3/api/iam/groups",
            get(list_groups).post(create_group),
        )
        .route(
            "/backend/v3/api/iam/groups/{groupId}",
            get(retrieve_group).patch(update_group).delete(delete_group),
        )
        .route(
            "/backend/v3/api/iam/groups/{groupId}/members",
            get(list_group_members).post(create_group_member),
        )
        .route(
            "/backend/v3/api/iam/groups/{groupId}/members/{memberId}",
            delete(delete_group_member),
        )
        .route(
            "/backend/v3/api/iam/service_accounts",
            get(list_service_accounts).post(create_service_account),
        )
        .route(
            "/backend/v3/api/iam/service_accounts/{serviceAccountId}",
            get(retrieve_service_account)
                .patch(update_service_account)
                .delete(delete_service_account),
        )
        .route(
            "/backend/v3/api/iam/role_bindings",
            get(list_role_bindings).post(create_role_binding),
        )
        .route(
            "/backend/v3/api/iam/role_bindings/{roleBindingId}",
            delete(delete_role_binding),
        )
        .route("/backend/v3/api/iam/api_keys", get(list_api_keys))
        .route(
            "/backend/v3/api/iam/api_keys/{apiKeyId}/revoke",
            post(revoke_api_key),
        )
        .route(
            "/backend/v3/api/iam/security_events",
            get(list_security_events),
        )
        .route(
            "/backend/v3/api/iam/security_events/{securityEventId}",
            get(retrieve_security_event),
        )
        .route("/backend/v3/api/iam/audit_events", get(list_audit_events))
        .route(
            "/backend/v3/api/iam/audit_events/{auditEventId}",
            get(retrieve_audit_event),
        )
}

async fn list_users(
    State(state): State<BackendIamState>,
    ctx: WebRequestContext,
    Query(query): Query<HashMap<String, String>>,
) -> Response {
    let Ok(pg) = postgres_pool_or_error(&state) else {
        return postgres_pool_or_error(&state)
            .err()
            .expect("error response");
    };
    let Ok(tenant_id) = tenant_id_from_context(&ctx) else {
        return tenant_id_from_context(&ctx).err().expect("error response");
    };

    let Ok(params) = list_page_params_or_error(&query) else {
        return list_page_params_or_error(&query)
            .err()
            .expect("error response");
    };
    let search_pattern = list_search_pattern(&query);
    let rows = sqlx::query(&format!(
        "SELECT id, tenant_id, username, display_name, email, phone, status, \
                COUNT(*) OVER() AS {LIST_TOTAL_COLUMN} \
         FROM iam_user \
         WHERE tenant_id = $1 AND COALESCE(is_deleted, 0) = 0 \
           AND ($4::text IS NULL OR LOWER(username) LIKE $4 OR LOWER(display_name) LIKE $4 OR LOWER(COALESCE(email, '')) LIKE $4) \
         ORDER BY username, id \
         LIMIT $2 OFFSET $3"
    ))
    .bind(&tenant_id)
    .bind(params.page_size)
    .bind(params.offset)
    .bind(&search_pattern)
    .fetch_all(pg)
    .await;

    match rows {
        Ok(rows) => appbase_ok(page_json_from_rows(rows, &params, user_row_to_json)),
        Err(error) => internal_handler_error("iam_users_list_failed", error),
    }
}

async fn retrieve_user(
    State(state): State<BackendIamState>,
    ctx: WebRequestContext,
    Path(user_id): Path<String>,
) -> Response {
    let Ok(pg) = postgres_pool_or_error(&state) else {
        return postgres_pool_or_error(&state)
            .err()
            .expect("error response");
    };
    let Ok(tenant_id) = tenant_id_from_context(&ctx) else {
        return tenant_id_from_context(&ctx).err().expect("error response");
    };

    match fetch_user_row(pg, &tenant_id, &user_id).await {
        Ok(Some(row)) => appbase_ok(user_row_to_json(&row)),
        Ok(None) => appbase_error(
            StatusCode::NOT_FOUND,
            "iam_user_not_found",
            "user not found",
        ),
        Err(error) => internal_handler_error("iam_user_retrieve_failed", error),
    }
}

async fn list_roles(
    State(state): State<BackendIamState>,
    ctx: WebRequestContext,
    Query(query): Query<HashMap<String, String>>,
) -> Response {
    let Ok(pg) = postgres_pool_or_error(&state) else {
        return postgres_pool_or_error(&state)
            .err()
            .expect("error response");
    };
    let Ok(tenant_id) = tenant_id_from_context(&ctx) else {
        return tenant_id_from_context(&ctx).err().expect("error response");
    };

    let Ok(params) = list_page_params_or_error(&query) else {
        return list_page_params_or_error(&query)
            .err()
            .expect("error response");
    };
    let search_pattern = list_search_pattern(&query);
    let rows = sqlx::query(&format!(
        "SELECT id, tenant_id, code, name, status, \
                COUNT(*) OVER() AS {LIST_TOTAL_COLUMN} \
         FROM iam_role \
         WHERE tenant_id = $1 \
           AND ($4::text IS NULL OR LOWER(code) LIKE $4 OR LOWER(name) LIKE $4) \
         ORDER BY code, id \
         LIMIT $2 OFFSET $3"
    ))
    .bind(&tenant_id)
    .bind(params.page_size)
    .bind(params.offset)
    .bind(&search_pattern)
    .fetch_all(pg)
    .await;

    match rows {
        Ok(rows) => appbase_ok(page_json_from_rows(rows, &params, role_row_to_json)),
        Err(error) => internal_handler_error("iam_roles_list_failed", error),
    }
}

async fn retrieve_role(
    State(state): State<BackendIamState>,
    ctx: WebRequestContext,
    Path(role_id): Path<String>,
) -> Response {
    let Ok(pg) = postgres_pool_or_error(&state) else {
        return postgres_pool_or_error(&state)
            .err()
            .expect("error response");
    };
    let Ok(tenant_id) = tenant_id_from_context(&ctx) else {
        return tenant_id_from_context(&ctx).err().expect("error response");
    };

    match fetch_role_row(pg, &tenant_id, &role_id).await {
        Ok(Some(row)) => appbase_ok(role_row_to_json(&row)),
        Ok(None) => appbase_error(
            StatusCode::NOT_FOUND,
            "iam_role_not_found",
            "role not found",
        ),
        Err(error) => internal_handler_error("iam_role_retrieve_failed", error),
    }
}

async fn list_role_permissions(
    State(state): State<BackendIamState>,
    ctx: WebRequestContext,
    Path(role_id): Path<String>,
    Query(query): Query<HashMap<String, String>>,
) -> Response {
    let Ok(pg) = postgres_pool_or_error(&state) else {
        return postgres_pool_or_error(&state)
            .err()
            .expect("error response");
    };
    let Ok(tenant_id) = tenant_id_from_context(&ctx) else {
        return tenant_id_from_context(&ctx).err().expect("error response");
    };

    let Ok(params) = list_page_params_or_error(&query) else {
        return list_page_params_or_error(&query)
            .err()
            .expect("error response");
    };
    let search_pattern = list_search_pattern(&query);
    let rows = sqlx::query(&format!(
        "SELECT p.id, p.code, p.name, p.resource, p.action, \
                COUNT(*) OVER() AS {LIST_TOTAL_COLUMN} \
         FROM iam_role_permission rp \
         JOIN iam_permission p ON p.id = rp.permission_id \
         JOIN iam_role r ON r.id = rp.role_id AND r.tenant_id = rp.tenant_id \
         WHERE rp.tenant_id = $1 AND rp.role_id = $2 AND r.status = 'active' \
           AND ($5::text IS NULL OR LOWER(p.code) LIKE $5 OR LOWER(p.name) LIKE $5 \
                OR LOWER(p.resource) LIKE $5 OR LOWER(p.action) LIKE $5) \
         ORDER BY p.code \
         LIMIT $3 OFFSET $4"
    ))
    .bind(&tenant_id)
    .bind(&role_id)
    .bind(params.page_size)
    .bind(params.offset)
    .bind(&search_pattern)
    .fetch_all(pg)
    .await;

    match rows {
        Ok(rows) => appbase_ok(page_json_from_rows(rows, &params, permission_row_to_json)),
        Err(error) => internal_handler_error("iam_role_permissions_list_failed", error),
    }
}

async fn list_permissions(
    State(state): State<BackendIamState>,
    Query(query): Query<HashMap<String, String>>,
) -> Response {
    let Ok(pg) = postgres_pool_or_error(&state) else {
        return postgres_pool_or_error(&state)
            .err()
            .expect("error response");
    };

    let Ok(params) = list_page_params_or_error(&query) else {
        return list_page_params_or_error(&query)
            .err()
            .expect("error response");
    };
    let search_pattern = list_search_pattern(&query);
    let rows = sqlx::query(&format!(
        "SELECT id, code, name, resource, action, \
                COUNT(*) OVER() AS {LIST_TOTAL_COLUMN} \
         FROM iam_permission \
         WHERE ($3::text IS NULL OR LOWER(code) LIKE $3 OR LOWER(name) LIKE $3 \
                OR LOWER(resource) LIKE $3 OR LOWER(action) LIKE $3) \
         ORDER BY code \
         LIMIT $1 OFFSET $2"
    ))
    .bind(params.page_size)
    .bind(params.offset)
    .bind(&search_pattern)
    .fetch_all(pg)
    .await;

    match rows {
        Ok(rows) => appbase_ok(page_json_from_rows(rows, &params, permission_row_to_json)),
        Err(error) => internal_handler_error("iam_permissions_list_failed", error),
    }
}

async fn retrieve_permission(
    State(state): State<BackendIamState>,
    Path(permission_id): Path<String>,
) -> Response {
    let Ok(pg) = postgres_pool_or_error(&state) else {
        return postgres_pool_or_error(&state)
            .err()
            .expect("error response");
    };

    let row = sqlx::query(
        "SELECT id, code, name, resource, action \
         FROM iam_permission \
         WHERE id = $1 OR code = $1 \
         LIMIT 1",
    )
    .bind(&permission_id)
    .fetch_optional(pg)
    .await;

    match row {
        Ok(Some(row)) => appbase_ok(permission_row_to_json(&row)),
        Ok(None) => appbase_error(
            StatusCode::NOT_FOUND,
            "iam_permission_not_found",
            "permission not found",
        ),
        Err(error) => internal_handler_error("iam_permission_retrieve_failed", error),
    }
}

async fn list_role_bindings(
    State(state): State<BackendIamState>,
    ctx: WebRequestContext,
    Query(query): Query<HashMap<String, String>>,
) -> Response {
    let Ok(pg) = postgres_pool_or_error(&state) else {
        return postgres_pool_or_error(&state)
            .err()
            .expect("error response");
    };
    let Ok(tenant_id) = tenant_id_from_context(&ctx) else {
        return tenant_id_from_context(&ctx).err().expect("error response");
    };
    let organization_id = organization_id_from_context(&ctx);

    let Ok(params) = list_page_params_or_error(&query) else {
        return list_page_params_or_error(&query)
            .err()
            .expect("error response");
    };
    let search_pattern = list_search_pattern(&query);
    let rows = if let Some(organization_id) = organization_id.as_deref() {
        sqlx::query(&format!(
            "SELECT b.id, b.tenant_id, b.organization_id, b.role_id, r.code AS role_code, \
                    b.principal_kind, b.principal_id, b.scope_kind, b.scope_id, b.effect, b.status, \
                    COUNT(*) OVER() AS {LIST_TOTAL_COLUMN} \
             FROM iam_role_binding b \
             JOIN iam_role r ON r.id = b.role_id AND r.tenant_id = b.tenant_id \
             WHERE b.tenant_id = $1 AND b.status = 'active' \
               AND (b.scope_kind = 'tenant' OR (b.scope_kind = 'organization' AND b.scope_id = $2)) \
               AND ($5::text IS NULL OR LOWER(r.code) LIKE $5 OR LOWER(b.principal_id) LIKE $5) \
             ORDER BY r.code, b.id \
             LIMIT $3 OFFSET $4"
        ))
        .bind(&tenant_id)
        .bind(organization_id)
        .bind(params.page_size)
        .bind(params.offset)
        .bind(&search_pattern)
        .fetch_all(pg)
        .await
    } else {
        sqlx::query(&format!(
            "SELECT b.id, b.tenant_id, b.organization_id, b.role_id, r.code AS role_code, \
                    b.principal_kind, b.principal_id, b.scope_kind, b.scope_id, b.effect, b.status, \
                    COUNT(*) OVER() AS {LIST_TOTAL_COLUMN} \
             FROM iam_role_binding b \
             JOIN iam_role r ON r.id = b.role_id AND r.tenant_id = b.tenant_id \
             WHERE b.tenant_id = $1 AND b.status = 'active' \
               AND ($4::text IS NULL OR LOWER(r.code) LIKE $4 OR LOWER(b.principal_id) LIKE $4) \
             ORDER BY r.code, b.id \
             LIMIT $2 OFFSET $3"
        ))
        .bind(&tenant_id)
        .bind(params.page_size)
        .bind(params.offset)
        .bind(&search_pattern)
        .fetch_all(pg)
        .await
    };

    match rows {
        Ok(rows) => appbase_ok(page_json_from_rows(rows, &params, role_binding_row_to_json)),
        Err(error) => internal_handler_error("iam_role_bindings_list_failed", error),
    }
}

async fn create_role_binding(
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

    let role_ref = read_string_field(&body, &["roleId", "role_id"]).unwrap_or_else(|| {
        read_string_field(&body, &["roleCode", "role_code"]).unwrap_or_default()
    });
    let principal_kind =
        read_string_field(&body, &["principalKind", "principal_kind"]).unwrap_or_default();
    let principal_id =
        read_string_field(&body, &["principalId", "principal_id"]).unwrap_or_default();
    let scope_kind = read_string_field(&body, &["scopeKind", "scope_kind"]).unwrap_or_default();
    let scope_id = read_string_field(&body, &["scopeId", "scope_id"]).unwrap_or_default();
    let effect = read_string_field(&body, &["effect"]).unwrap_or_else(|| "allow".to_string());

    if role_ref.is_empty()
        || principal_kind.is_empty()
        || principal_id.is_empty()
        || scope_kind.is_empty()
        || scope_id.is_empty()
    {
        return appbase_error(
            StatusCode::BAD_REQUEST,
            "iam_role_binding_invalid",
            "roleId, principalKind, principalId, scopeKind, and scopeId are required",
        );
    }

    if effect != "allow" && effect != "deny" {
        return appbase_error(
            StatusCode::BAD_REQUEST,
            "iam_role_binding_invalid",
            "effect must be allow or deny",
        );
    }

    let role_row = match fetch_role_row(pg, &tenant_id, &role_ref).await {
        Ok(Some(row)) => row,
        Ok(None) => {
            return appbase_error(
                StatusCode::NOT_FOUND,
                "iam_role_not_found",
                "role not found",
            );
        }
        Err(error) => {
            return internal_handler_error("iam_role_lookup_failed", error);
        }
    };
    let role_id: String = role_row.get(0);
    let role_code: String = role_row.get(2);

    if effect == "allow" {
        if let Err(error) = sdkwork_iam_bootstrap::ensure_role_assignment_allowed(
            pg,
            &tenant_id,
            &principal_kind,
            &principal_id,
            &scope_kind,
            &scope_id,
            &role_code,
        )
        .await
        {
            return appbase_error(
                StatusCode::CONFLICT,
                "iam_role_binding_sod_violation",
                &error,
            );
        }

        let assigner_scope = match assigner_permission_scope(&ctx) {
            Ok(scope) => scope,
            Err(response) => return response,
        };
        if let Err(error) = sdkwork_iam_bootstrap::ensure_role_grant_within_assigner_scope(
            pg,
            &tenant_id,
            &role_id,
            &assigner_scope,
        )
        .await
        {
            return appbase_error(
                StatusCode::FORBIDDEN,
                "iam_role_binding_assigner_scope_exceeded",
                &error,
            );
        }
    }

    let organization_id = organization_id_from_context(&ctx).unwrap_or_else(|| "0".to_owned());
    let binding_id = format!("iamrb-{}", Uuid::new_v4());
    let now = Utc::now().to_rfc3339();

    let result = sqlx::query(
        "INSERT INTO iam_role_binding \
            (id, tenant_id, organization_id, role_id, principal_kind, principal_id, scope_kind, scope_id, \
             effect, status, created_at, updated_at) \
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'active', $10, $10)",
    )
    .bind(&binding_id)
    .bind(&tenant_id)
    .bind(&organization_id)
    .bind(&role_id)
    .bind(&principal_kind)
    .bind(&principal_id)
    .bind(&scope_kind)
    .bind(&scope_id)
    .bind(&effect)
    .bind(&now)
    .execute(pg)
    .await;

    match result {
        Ok(_) => {
            let row = sqlx::query(
                "SELECT b.id, b.tenant_id, b.organization_id, b.role_id, r.code AS role_code, \
                        b.principal_kind, b.principal_id, b.scope_kind, b.scope_id, b.effect, b.status \
                 FROM iam_role_binding b \
                 JOIN iam_role r ON r.id = b.role_id AND r.tenant_id = b.tenant_id \
                 WHERE b.id = $1",
            )
            .bind(&binding_id)
            .fetch_one(pg)
            .await;

            match row {
                Ok(row) => appbase_ok(role_binding_row_to_json(&row)),
                Err(error) => internal_handler_error("iam_role_binding_create_failed", error),
            }
        }
        Err(error) => appbase_error(
            StatusCode::CONFLICT,
            "iam_role_binding_create_failed",
            &error.to_string(),
        ),
    }
}

async fn delete_role_binding(
    State(state): State<BackendIamState>,
    ctx: WebRequestContext,
    Path(role_binding_id): Path<String>,
) -> Response {
    let Ok(pg) = postgres_pool_or_error(&state) else {
        return postgres_pool_or_error(&state)
            .err()
            .expect("error response");
    };
    let Ok(tenant_id) = tenant_id_from_context(&ctx) else {
        return tenant_id_from_context(&ctx).err().expect("error response");
    };

    let now = Utc::now().to_rfc3339();
    let result = sqlx::query(
        "UPDATE iam_role_binding \
         SET status = 'revoked', updated_at = $3 \
         WHERE tenant_id = $1 AND id = $2 AND status = 'active'",
    )
    .bind(&tenant_id)
    .bind(&role_binding_id)
    .bind(&now)
    .execute(pg)
    .await;

    match result {
        Ok(done) if done.rows_affected() > 0 => {
            appbase_ok(json!({ "roleBindingId": role_binding_id }))
        }
        Ok(_) => appbase_error(
            StatusCode::NOT_FOUND,
            "iam_role_binding_not_found",
            "role binding not found",
        ),
        Err(error) => internal_handler_error("iam_role_binding_delete_failed", error),
    }
}

async fn list_organizations(
    State(state): State<BackendIamState>,
    ctx: WebRequestContext,
    Query(query): Query<HashMap<String, String>>,
) -> Response {
    let Ok(pg) = postgres_pool_or_error(&state) else {
        return postgres_pool_or_error(&state)
            .err()
            .expect("error response");
    };
    let Ok(tenant_id) = tenant_id_from_context(&ctx) else {
        return tenant_id_from_context(&ctx).err().expect("error response");
    };

    let Ok(params) = list_page_params_or_error(&query) else {
        return list_page_params_or_error(&query)
            .err()
            .expect("error response");
    };
    let search_pattern = list_search_pattern(&query);
    let rows = sqlx::query(&format!(
        "SELECT id, tenant_id, code, name, status, organization_kind, parent_organization_id, \
                COUNT(*) OVER() AS {LIST_TOTAL_COLUMN} \
         FROM iam_organization \
         WHERE tenant_id = $1 AND status = 'active' \
           AND ($4::text IS NULL OR LOWER(name) LIKE $4 OR LOWER(code) LIKE $4) \
         ORDER BY name, id \
         LIMIT $2 OFFSET $3"
    ))
    .bind(&tenant_id)
    .bind(params.page_size)
    .bind(params.offset)
    .bind(&search_pattern)
    .fetch_all(pg)
    .await;

    match rows {
        Ok(rows) => appbase_ok(page_json_from_rows(rows, &params, organization_row_to_json)),
        Err(error) => internal_handler_error("iam_organizations_list_failed", error),
    }
}

async fn list_organization_memberships(
    State(state): State<BackendIamState>,
    ctx: WebRequestContext,
    Query(query): Query<HashMap<String, String>>,
) -> Response {
    let Ok(pg) = postgres_pool_or_error(&state) else {
        return postgres_pool_or_error(&state)
            .err()
            .expect("error response");
    };
    let Ok(tenant_id) = tenant_id_from_context(&ctx) else {
        return tenant_id_from_context(&ctx).err().expect("error response");
    };
    let organization_id = organization_id_from_context(&ctx);

    let Ok(params) = list_page_params_or_error(&query) else {
        return list_page_params_or_error(&query)
            .err()
            .expect("error response");
    };
    let search_pattern = list_search_pattern(&query);
    let rows = if let Some(organization_id) = organization_id.as_deref() {
        sqlx::query(&format!(
            "SELECT m.id, m.tenant_id, m.organization_id, m.user_id, m.membership_kind, m.status, \
                    u.username, u.display_name, u.email, \
                    COUNT(*) OVER() AS {LIST_TOTAL_COLUMN} \
             FROM iam_organization_membership m \
             JOIN iam_user u ON u.id = m.user_id AND u.tenant_id = m.tenant_id \
             WHERE m.tenant_id = $1 AND m.organization_id = $2 AND m.status = 'active' \
               AND ($5::text IS NULL OR LOWER(u.username) LIKE $5 OR LOWER(u.display_name) LIKE $5 \
                    OR LOWER(COALESCE(u.email, '')) LIKE $5) \
             ORDER BY m.joined_at DESC NULLS LAST, m.id \
             LIMIT $3 OFFSET $4"
        ))
        .bind(&tenant_id)
        .bind(organization_id)
        .bind(params.page_size)
        .bind(params.offset)
        .bind(&search_pattern)
        .fetch_all(pg)
        .await
    } else {
        sqlx::query(&format!(
            "SELECT m.id, m.tenant_id, m.organization_id, m.user_id, m.membership_kind, m.status, \
                    u.username, u.display_name, u.email, \
                    COUNT(*) OVER() AS {LIST_TOTAL_COLUMN} \
             FROM iam_organization_membership m \
             JOIN iam_user u ON u.id = m.user_id AND u.tenant_id = m.tenant_id \
             WHERE m.tenant_id = $1 AND m.status = 'active' \
               AND ($4::text IS NULL OR LOWER(u.username) LIKE $4 OR LOWER(u.display_name) LIKE $4 \
                    OR LOWER(COALESCE(u.email, '')) LIKE $4) \
             ORDER BY m.joined_at DESC NULLS LAST, m.id \
             LIMIT $2 OFFSET $3"
        ))
        .bind(&tenant_id)
        .bind(params.page_size)
        .bind(params.offset)
        .bind(&search_pattern)
        .fetch_all(pg)
        .await
    };

    match rows {
        Ok(rows) => appbase_ok(page_json_from_rows(rows, &params, membership_row_to_json)),
        Err(error) => internal_handler_error("iam_memberships_list_failed", error),
    }
}

async fn list_departments(
    State(state): State<BackendIamState>,
    ctx: WebRequestContext,
    Query(query): Query<HashMap<String, String>>,
) -> Response {
    let Ok(pg) = postgres_pool_or_error(&state) else {
        return postgres_pool_or_error(&state)
            .err()
            .expect("error response");
    };
    let Ok(tenant_id) = tenant_id_from_context(&ctx) else {
        return tenant_id_from_context(&ctx).err().expect("error response");
    };
    let organization_id = organization_id_from_context(&ctx);

    let Ok(params) = list_page_params_or_error(&query) else {
        return list_page_params_or_error(&query)
            .err()
            .expect("error response");
    };
    let search_pattern = list_search_pattern(&query);
    let rows = if let Some(organization_id) = organization_id.as_deref() {
        sqlx::query(&format!(
            "SELECT id, tenant_id, organization_id, code, name, status, parent_department_id, \
                    COUNT(*) OVER() AS {LIST_TOTAL_COLUMN} \
             FROM iam_department \
             WHERE tenant_id = $1 AND organization_id = $2 AND status = 'active' \
               AND ($5::text IS NULL OR LOWER(name) LIKE $5 OR LOWER(code) LIKE $5) \
             ORDER BY name, id \
             LIMIT $3 OFFSET $4"
        ))
        .bind(&tenant_id)
        .bind(organization_id)
        .bind(params.page_size)
        .bind(params.offset)
        .bind(&search_pattern)
        .fetch_all(pg)
        .await
    } else {
        sqlx::query(&format!(
            "SELECT id, tenant_id, organization_id, code, name, status, parent_department_id, \
                    COUNT(*) OVER() AS {LIST_TOTAL_COLUMN} \
             FROM iam_department \
             WHERE tenant_id = $1 AND status = 'active' \
               AND ($4::text IS NULL OR LOWER(name) LIKE $4 OR LOWER(code) LIKE $4) \
             ORDER BY name, id \
             LIMIT $2 OFFSET $3"
        ))
        .bind(&tenant_id)
        .bind(params.page_size)
        .bind(params.offset)
        .bind(&search_pattern)
        .fetch_all(pg)
        .await
    };

    match rows {
        Ok(rows) => appbase_ok(page_json_from_rows(rows, &params, department_row_to_json)),
        Err(error) => internal_handler_error("iam_departments_list_failed", error),
    }
}

async fn list_api_keys(
    State(state): State<BackendIamState>,
    ctx: WebRequestContext,
    Query(query): Query<HashMap<String, String>>,
) -> Response {
    let Ok(pg) = postgres_pool_or_error(&state) else {
        return postgres_pool_or_error(&state)
            .err()
            .expect("error response");
    };
    let Ok(tenant_id) = tenant_id_from_context(&ctx) else {
        return tenant_id_from_context(&ctx).err().expect("error response");
    };

    let Ok(params) = list_page_params_or_error(&query) else {
        return list_page_params_or_error(&query)
            .err()
            .expect("error response");
    };
    let search_pattern = list_search_pattern(&query);
    let rows = sqlx::query(&format!(
        "SELECT id, tenant_id, organization_id, user_id, name, status, expires_at, \
                COUNT(*) OVER() AS {LIST_TOTAL_COLUMN} \
         FROM iam_api_key \
         WHERE tenant_id = $1 \
           AND ($4::text IS NULL OR LOWER(name) LIKE $4) \
         ORDER BY created_at DESC NULLS LAST, id \
         LIMIT $2 OFFSET $3"
    ))
    .bind(&tenant_id)
    .bind(params.page_size)
    .bind(params.offset)
    .bind(&search_pattern)
    .fetch_all(pg)
    .await;

    match rows {
        Ok(rows) => appbase_ok(page_json_from_rows(rows, &params, api_key_row_to_json)),
        Err(error) => internal_handler_error("iam_api_keys_list_failed", error),
    }
}

async fn list_security_events(
    State(state): State<BackendIamState>,
    ctx: WebRequestContext,
    Query(query): Query<HashMap<String, String>>,
) -> Response {
    let Ok(pg) = postgres_pool_or_error(&state) else {
        return postgres_pool_or_error(&state)
            .err()
            .expect("error response");
    };
    let Ok(tenant_id) = tenant_id_from_context(&ctx) else {
        return tenant_id_from_context(&ctx).err().expect("error response");
    };

    let Ok(params) = timeline_list_params_or_error(&query) else {
        return timeline_list_params_or_error(&query)
            .err()
            .expect("error response");
    };
    let search_pattern = list_search_pattern(&query);
    match list_timeline_feed(
        pg,
        &tenant_id,
        "iam_security_event",
        "id, tenant_id, organization_id, user_id, event_type, severity, created_at",
        "LOWER(event_type) LIKE $4 OR LOWER(severity) LIKE $4",
        params,
        search_pattern,
        security_event_row_to_json,
        |row| encode_timeline_keyset_cursor(&row.get::<String, _>(6), &row.get::<String, _>(0)),
    )
    .await
    {
        Ok(payload) => appbase_ok(payload),
        Err(error) => internal_handler_error("iam_security_events_list_failed", &error),
    }
}

async fn list_audit_events(
    State(state): State<BackendIamState>,
    ctx: WebRequestContext,
    Query(query): Query<HashMap<String, String>>,
) -> Response {
    let Ok(pg) = postgres_pool_or_error(&state) else {
        return postgres_pool_or_error(&state)
            .err()
            .expect("error response");
    };
    let Ok(tenant_id) = tenant_id_from_context(&ctx) else {
        return tenant_id_from_context(&ctx).err().expect("error response");
    };

    let Ok(params) = timeline_list_params_or_error(&query) else {
        return timeline_list_params_or_error(&query)
            .err()
            .expect("error response");
    };
    let search_pattern = list_search_pattern(&query);
    match list_timeline_feed(
        pg,
        &tenant_id,
        "iam_audit_event",
        "id, tenant_id, organization_id, actor_user_id, action, resource_type, resource_id, environment, created_at",
        "LOWER(action) LIKE $4 OR LOWER(resource_type) LIKE $4",
        params,
        search_pattern,
        audit_event_row_to_json,
        |row| encode_timeline_keyset_cursor(&row.get::<String, _>(8), &row.get::<String, _>(0)),
    )
    .await
    {
        Ok(payload) => appbase_ok(payload),
        Err(error) => internal_handler_error("iam_audit_events_list_failed", &error),
    }
}

async fn list_timeline_feed<F, C>(
    pg: &PgPool,
    tenant_id: &str,
    table: &str,
    select: &str,
    search_predicate: &str,
    params: TimelineListParams,
    search_pattern: Option<String>,
    map_row: F,
    encode_cursor: C,
) -> Result<Value, sqlx::Error>
where
    F: FnMut(&sqlx::postgres::PgRow) -> Value,
    C: Fn(&sqlx::postgres::PgRow) -> String,
{
    match params {
        TimelineListParams::Offset(offset) => {
            let rows = sqlx::query(&format!(
                "SELECT {select}, COUNT(*) OVER() AS {LIST_TOTAL_COLUMN} \
                 FROM {table} \
                 WHERE tenant_id = $1 \
                   AND ($4::text IS NULL OR {search_predicate}) \
                 ORDER BY created_at DESC NULLS LAST, id \
                 LIMIT $2 OFFSET $3"
            ))
            .bind(tenant_id)
            .bind(offset.page_size)
            .bind(offset.offset)
            .bind(&search_pattern)
            .fetch_all(pg)
            .await?;
            Ok(page_json_from_rows(rows, &offset, map_row))
        }
        TimelineListParams::CursorOffset(cursor) => {
            let limit = (cursor.page_size + 1) as i64;
            let rows = sqlx::query(&format!(
                "SELECT {select} \
                 FROM {table} \
                 WHERE tenant_id = $1 \
                   AND ($4::text IS NULL OR {search_predicate}) \
                 ORDER BY created_at DESC NULLS LAST, id \
                 LIMIT $2 OFFSET $3"
            ))
            .bind(tenant_id)
            .bind(limit)
            .bind(cursor.offset as i64)
            .bind(&search_pattern)
            .fetch_all(pg)
            .await?;
            let has_more = rows.len() > cursor.page_size;
            let next_cursor = has_more.then(|| (cursor.offset + cursor.page_size).to_string());
            let items = rows
                .iter()
                .take(cursor.page_size)
                .map(map_row)
                .collect::<Vec<_>>();
            Ok(cursor_page_json(
                items,
                cursor.page_size,
                next_cursor,
                has_more,
            ))
        }
        TimelineListParams::CursorKeyset { page_size, cursor } => {
            let limit = (page_size + 1) as i64;
            let rows = sqlx::query(&format!(
                "SELECT {select} \
                 FROM {table} \
                 WHERE tenant_id = $1 \
                   AND ($3::text IS NULL OR {search_predicate}) \
                   AND (created_at < $4 OR (created_at = $4 AND id < $5)) \
                 ORDER BY created_at DESC NULLS LAST, id \
                 LIMIT $2"
            ))
            .bind(tenant_id)
            .bind(limit)
            .bind(&search_pattern)
            .bind(&cursor.created_at)
            .bind(&cursor.id)
            .fetch_all(pg)
            .await?;
            Ok(timeline_cursor_page_from_rows(
                rows,
                page_size,
                map_row,
                encode_cursor,
            ))
        }
    }
}

async fn retrieve_audit_event(
    State(state): State<BackendIamState>,
    ctx: WebRequestContext,
    Path(audit_event_id): Path<String>,
) -> Response {
    let Ok(pg) = postgres_pool_or_error(&state) else {
        return postgres_pool_or_error(&state)
            .err()
            .expect("error response");
    };
    let Ok(tenant_id) = tenant_id_from_context(&ctx) else {
        return tenant_id_from_context(&ctx).err().expect("error response");
    };

    match fetch_audit_event_row(pg, &tenant_id, &audit_event_id).await {
        Ok(Some(row)) => appbase_ok(sdkwork_resource_json(audit_event_detail_row_to_json(&row))),
        Ok(None) => appbase_error(
            StatusCode::NOT_FOUND,
            "iam_audit_event_not_found",
            "audit event not found",
        ),
        Err(error) => internal_handler_error("iam_audit_event_retrieve_failed", error),
    }
}

async fn retrieve_security_event(
    State(state): State<BackendIamState>,
    ctx: WebRequestContext,
    Path(security_event_id): Path<String>,
) -> Response {
    let Ok(pg) = postgres_pool_or_error(&state) else {
        return postgres_pool_or_error(&state)
            .err()
            .expect("error response");
    };
    let Ok(tenant_id) = tenant_id_from_context(&ctx) else {
        return tenant_id_from_context(&ctx).err().expect("error response");
    };

    match fetch_security_event_row(pg, &tenant_id, &security_event_id).await {
        Ok(Some(row)) => appbase_ok(sdkwork_resource_json(security_event_detail_row_to_json(
            &row,
        ))),
        Ok(None) => appbase_error(
            StatusCode::NOT_FOUND,
            "iam_security_event_not_found",
            "security event not found",
        ),
        Err(error) => internal_handler_error("iam_security_event_retrieve_failed", error),
    }
}

async fn fetch_audit_event_row<'e>(
    pg: &'e PgPool,
    tenant_id: &str,
    audit_event_id: &str,
) -> Result<Option<sqlx::postgres::PgRow>, sqlx::Error> {
    sqlx::query(
        "SELECT id, tenant_id, organization_id, actor_user_id, action, resource_type, resource_id, request_id, environment, detail_json, created_at \
         FROM iam_audit_event \
         WHERE tenant_id = $1 AND id = $2 \
         LIMIT 1",
    )
    .bind(tenant_id)
    .bind(audit_event_id)
    .fetch_optional(pg)
    .await
}

async fn fetch_security_event_row<'e>(
    pg: &'e PgPool,
    tenant_id: &str,
    security_event_id: &str,
) -> Result<Option<sqlx::postgres::PgRow>, sqlx::Error> {
    sqlx::query(
        "SELECT id, tenant_id, organization_id, user_id, session_id, event_type, severity, detail_json, created_at \
         FROM iam_security_event \
         WHERE tenant_id = $1 AND id = $2 \
         LIMIT 1",
    )
    .bind(tenant_id)
    .bind(security_event_id)
    .fetch_optional(pg)
    .await
}

async fn fetch_user_row<'e>(
    pg: &'e PgPool,
    tenant_id: &str,
    user_id: &str,
) -> Result<Option<sqlx::postgres::PgRow>, sqlx::Error> {
    sqlx::query(
        "SELECT id, tenant_id, username, display_name, email, phone, status \
         FROM iam_user \
         WHERE tenant_id = $1 AND id = $2 AND COALESCE(is_deleted, 0) = 0 \
         LIMIT 1",
    )
    .bind(tenant_id)
    .bind(user_id)
    .fetch_optional(pg)
    .await
}

async fn fetch_role_row<'e>(
    pg: &'e PgPool,
    tenant_id: &str,
    role_id: &str,
) -> Result<Option<sqlx::postgres::PgRow>, sqlx::Error> {
    sqlx::query(
        "SELECT id, tenant_id, code, name, status \
         FROM iam_role \
         WHERE tenant_id = $1 AND (id = $2 OR code = $2) \
         LIMIT 1",
    )
    .bind(tenant_id)
    .bind(role_id)
    .fetch_optional(pg)
    .await
}

async fn resolve_role_id(pg: &PgPool, tenant_id: &str, role_ref: &str) -> Option<String> {
    fetch_role_row(pg, tenant_id, role_ref)
        .await
        .ok()
        .flatten()
        .map(|row| row.get::<String, _>(0))
}

fn user_row_to_json(row: &sqlx::postgres::PgRow) -> Value {
    json!({
        "displayName": row.get::<String, _>(3),
        "email": row.get::<Option<String>, _>(4),
        "id": row.get::<String, _>(0),
        "phone": row.get::<Option<String>, _>(5),
        "status": row.get::<String, _>(6),
        "tenantId": row.get::<String, _>(1),
        "userId": row.get::<String, _>(0),
        "username": row.get::<String, _>(2),
    })
}

fn role_row_to_json(row: &sqlx::postgres::PgRow) -> Value {
    json!({
        "code": row.get::<String, _>(2),
        "id": row.get::<String, _>(0),
        "name": row.get::<String, _>(3),
        "roleId": row.get::<String, _>(0),
        "status": row.get::<String, _>(4),
        "tenantId": row.get::<String, _>(1),
    })
}

fn permission_row_to_json(row: &sqlx::postgres::PgRow) -> Value {
    json!({
        "action": row.get::<String, _>(4),
        "code": row.get::<String, _>(1),
        "id": row.get::<String, _>(0),
        "name": row.get::<String, _>(2),
        "permissionId": row.get::<String, _>(0),
        "resource": row.get::<String, _>(3),
    })
}

fn role_binding_row_to_json(row: &sqlx::postgres::PgRow) -> Value {
    json!({
        "effect": row.get::<String, _>(9),
        "id": row.get::<String, _>(0),
        "organizationId": row.get::<String, _>(2),
        "principalId": row.get::<String, _>(6),
        "principalKind": row.get::<String, _>(5),
        "roleCode": row.get::<String, _>(4),
        "roleId": row.get::<String, _>(3),
        "scopeId": row.get::<String, _>(8),
        "scopeKind": row.get::<String, _>(7),
        "status": row.get::<String, _>(10),
        "tenantId": row.get::<String, _>(1),
    })
}

fn organization_row_to_json(row: &sqlx::postgres::PgRow) -> Value {
    json!({
        "code": row.get::<String, _>(2),
        "id": row.get::<String, _>(0),
        "name": row.get::<String, _>(3),
        "organizationId": row.get::<String, _>(0),
        "organizationKind": row.get::<Option<String>, _>(5),
        "parentOrganizationId": row.get::<Option<String>, _>(6),
        "status": row.get::<String, _>(4),
        "tenantId": row.get::<String, _>(1),
    })
}

fn membership_row_to_json(row: &sqlx::postgres::PgRow) -> Value {
    json!({
        "displayName": row.get::<String, _>(7),
        "email": row.get::<Option<String>, _>(8),
        "id": row.get::<String, _>(0),
        "membershipId": row.get::<String, _>(0),
        "membershipKind": row.get::<String, _>(4),
        "organizationId": row.get::<String, _>(2),
        "status": row.get::<String, _>(5),
        "tenantId": row.get::<String, _>(1),
        "userId": row.get::<String, _>(3),
        "username": row.get::<String, _>(6),
    })
}

fn department_row_to_json(row: &sqlx::postgres::PgRow) -> Value {
    json!({
        "code": row.get::<String, _>(3),
        "departmentId": row.get::<String, _>(0),
        "id": row.get::<String, _>(0),
        "name": row.get::<String, _>(4),
        "organizationId": row.get::<String, _>(2),
        "parentDepartmentId": row.get::<Option<String>, _>(6),
        "status": row.get::<String, _>(5),
        "tenantId": row.get::<String, _>(1),
    })
}

fn api_key_row_to_json(row: &sqlx::postgres::PgRow) -> Value {
    json!({
        "apiKeyId": row.get::<String, _>(0),
        "expiresAt": row.get::<Option<String>, _>(6),
        "id": row.get::<String, _>(0),
        "name": row.get::<String, _>(4),
        "organizationId": row.get::<String, _>(2),
        "status": row.get::<String, _>(5),
        "tenantId": row.get::<String, _>(1),
        "userId": row.get::<String, _>(3),
    })
}

fn security_event_row_to_json(row: &sqlx::postgres::PgRow) -> Value {
    let id = row.get::<String, _>(0);
    json!({
        "category": row.get::<String, _>(4),
        "createdAt": row.get::<String, _>(6),
        "eventType": row.get::<String, _>(4),
        "id": id,
        "organizationId": row.get::<String, _>(2),
        "securityEventId": id,
        "severity": row.get::<String, _>(5),
        "tenantId": row.get::<String, _>(1),
        "userId": row.get::<Option<String>, _>(3),
    })
}

fn security_event_detail_row_to_json(row: &sqlx::postgres::PgRow) -> Value {
    let id = row.get::<String, _>(0);
    json!({
        "category": row.get::<String, _>(5),
        "createdAt": row.get::<String, _>(8),
        "detailJson": row.get::<String, _>(7),
        "eventType": row.get::<String, _>(5),
        "id": id,
        "organizationId": row.get::<String, _>(2),
        "securityEventId": id,
        "sessionId": row.get::<Option<String>, _>(4),
        "severity": row.get::<String, _>(6),
        "tenantId": row.get::<String, _>(1),
        "userId": row.get::<Option<String>, _>(3),
    })
}

fn audit_event_row_to_json(row: &sqlx::postgres::PgRow) -> Value {
    let id = row.get::<String, _>(0);
    json!({
        "action": row.get::<String, _>(4),
        "actorUserId": row.get::<Option<String>, _>(3),
        "auditEventId": id,
        "createdAt": row.get::<String, _>(8),
        "environment": row.get::<Option<String>, _>(7),
        "id": id,
        "organizationId": row.get::<Option<String>, _>(2),
        "resourceId": row.get::<Option<String>, _>(6),
        "resourceType": row.get::<String, _>(5),
        "tenantId": row.get::<String, _>(1),
    })
}

fn audit_event_detail_row_to_json(row: &sqlx::postgres::PgRow) -> Value {
    let id = row.get::<String, _>(0);
    json!({
        "action": row.get::<String, _>(4),
        "actorUserId": row.get::<Option<String>, _>(3),
        "auditEventId": id,
        "createdAt": row.get::<String, _>(10),
        "detailJson": row.get::<String, _>(9),
        "environment": row.get::<Option<String>, _>(8),
        "id": id,
        "organizationId": row.get::<Option<String>, _>(2),
        "requestId": row.get::<Option<String>, _>(7),
        "resourceId": row.get::<Option<String>, _>(6),
        "resourceType": row.get::<String, _>(5),
        "tenantId": row.get::<String, _>(1),
    })
}

fn group_row_to_json(row: &sqlx::postgres::PgRow) -> Value {
    json!({
        "code": row.get::<String, _>(3),
        "groupId": row.get::<String, _>(0),
        "groupKind": row.get::<String, _>(5),
        "id": row.get::<String, _>(0),
        "name": row.get::<String, _>(4),
        "organizationId": row.get::<Option<String>, _>(2),
        "status": row.get::<String, _>(6),
        "tenantId": row.get::<String, _>(1),
    })
}

fn group_member_row_to_json(row: &sqlx::postgres::PgRow) -> Value {
    json!({
        "groupId": row.get::<String, _>(2),
        "id": row.get::<String, _>(0),
        "joinedAt": row.get::<String, _>(5),
        "memberId": row.get::<String, _>(0),
        "principalId": row.get::<String, _>(4),
        "principalKind": row.get::<String, _>(3),
        "status": row.get::<String, _>(6),
        "tenantId": row.get::<String, _>(1),
    })
}

fn service_account_row_to_json(row: &sqlx::postgres::PgRow) -> Value {
    json!({
        "code": row.get::<String, _>(3),
        "credentialKind": row.get::<String, _>(6),
        "id": row.get::<String, _>(0),
        "name": row.get::<String, _>(4),
        "organizationId": row.get::<Option<String>, _>(2),
        "serviceAccountId": row.get::<String, _>(0),
        "status": row.get::<String, _>(5),
        "tenantId": row.get::<String, _>(1),
    })
}

async fn patch_directory_row(
    pg: &PgPool,
    ctx: &WebRequestContext,
    tenant_id: &str,
    table: &str,
    id: &str,
    assignments: &[(String, String)],
) -> Result<bool, sqlx::Error> {
    let mut tx = pg.begin().await?;
    let updated = patch_tenant_row_tx(&mut *tx, tenant_id, table, id, assignments).await?;
    if updated {
        let audit_detail = json!({
            "updatedFields": assignments
                .iter()
                .map(|(column, _)| column.as_str())
                .filter(|column| *column != "updated_at")
                .collect::<Vec<_>>()
        });
        if let Err(error) = record_backend_mutation_audit_tx(
            &mut *tx,
            ctx,
            &format!("{table}.update"),
            table,
            id,
            audit_detail,
        )
        .await
        {
            tracing::error!(%error, table, resource_id = %id, "directory patch audit failed; rolling back");
            return Err(sqlx::Error::Protocol(error));
        }
    }
    tx.commit().await?;
    Ok(updated)
}

include!("directory_crud.impl.rs");
