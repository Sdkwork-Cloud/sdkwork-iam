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
use sdkwork_web_core::WebRequestContext;
use serde_json::{json, Value};
use sqlx::{PgPool, Row};
use uuid::Uuid;

use crate::backend_sql::{
    list_tenant_rows, page_json, page_limit, patch_tenant_row, read_i32_field, read_string_field,
    retrieve_tenant_row,
};
use crate::handlers::{
    appbase_error, appbase_ok, assigner_permission_scope, organization_id_from_context,
    postgres_pool_or_error, tenant_id_from_context, BackendIamState,
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
        .route("/backend/v3/api/iam/audit_events", get(list_audit_events))
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

    let limit = page_limit(&query);
    let rows = sqlx::query(
        "SELECT id, tenant_id, username, display_name, email, phone, status \
         FROM iam_user \
         WHERE tenant_id = $1 AND COALESCE(is_deleted, 0) = 0 \
         ORDER BY username, id \
         LIMIT $2",
    )
    .bind(&tenant_id)
    .bind(limit)
    .fetch_all(pg)
    .await;

    match rows {
        Ok(rows) => appbase_ok(page_json(
            rows.iter().map(user_row_to_json).collect::<Vec<_>>(),
        )),
        Err(error) => appbase_error(
            StatusCode::INTERNAL_SERVER_ERROR,
            "iam_users_list_failed",
            &error.to_string(),
        ),
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
        Err(error) => appbase_error(
            StatusCode::INTERNAL_SERVER_ERROR,
            "iam_user_retrieve_failed",
            &error.to_string(),
        ),
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

    let limit = page_limit(&query);
    let rows = sqlx::query(
        "SELECT id, tenant_id, code, name, status \
         FROM iam_role \
         WHERE tenant_id = $1 \
         ORDER BY code, id \
         LIMIT $2",
    )
    .bind(&tenant_id)
    .bind(limit)
    .fetch_all(pg)
    .await;

    match rows {
        Ok(rows) => appbase_ok(page_json(
            rows.iter().map(role_row_to_json).collect::<Vec<_>>(),
        )),
        Err(error) => appbase_error(
            StatusCode::INTERNAL_SERVER_ERROR,
            "iam_roles_list_failed",
            &error.to_string(),
        ),
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
        Err(error) => appbase_error(
            StatusCode::INTERNAL_SERVER_ERROR,
            "iam_role_retrieve_failed",
            &error.to_string(),
        ),
    }
}

async fn list_role_permissions(
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

    let rows = sqlx::query(
        "SELECT p.id, p.code, p.name, p.resource, p.action \
         FROM iam_role_permission rp \
         JOIN iam_permission p ON p.id = rp.permission_id \
         JOIN iam_role r ON r.id = rp.role_id AND r.tenant_id = rp.tenant_id \
         WHERE rp.tenant_id = $1 AND rp.role_id = $2 AND r.status = 'active' \
         ORDER BY p.code",
    )
    .bind(&tenant_id)
    .bind(&role_id)
    .fetch_all(pg)
    .await;

    match rows {
        Ok(rows) => appbase_ok(page_json(
            rows.iter().map(permission_row_to_json).collect::<Vec<_>>(),
        )),
        Err(error) => appbase_error(
            StatusCode::INTERNAL_SERVER_ERROR,
            "iam_role_permissions_list_failed",
            &error.to_string(),
        ),
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

    let limit = page_limit(&query);
    let rows = sqlx::query(
        "SELECT id, code, name, resource, action \
         FROM iam_permission \
         ORDER BY code \
         LIMIT $1",
    )
    .bind(limit)
    .fetch_all(pg)
    .await;

    match rows {
        Ok(rows) => appbase_ok(page_json(
            rows.iter().map(permission_row_to_json).collect::<Vec<_>>(),
        )),
        Err(error) => appbase_error(
            StatusCode::INTERNAL_SERVER_ERROR,
            "iam_permissions_list_failed",
            &error.to_string(),
        ),
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
        Err(error) => appbase_error(
            StatusCode::INTERNAL_SERVER_ERROR,
            "iam_permission_retrieve_failed",
            &error.to_string(),
        ),
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

    let limit = page_limit(&query);
    let rows = if let Some(organization_id) = organization_id.as_deref() {
        sqlx::query(
            "SELECT b.id, b.tenant_id, b.organization_id, b.role_id, r.code AS role_code, \
                    b.principal_kind, b.principal_id, b.scope_kind, b.scope_id, b.effect, b.status \
             FROM iam_role_binding b \
             JOIN iam_role r ON r.id = b.role_id AND r.tenant_id = b.tenant_id \
             WHERE b.tenant_id = $1 AND b.status = 'active' \
               AND (b.scope_kind = 'tenant' OR (b.scope_kind = 'organization' AND b.scope_id = $2)) \
             ORDER BY r.code, b.id \
             LIMIT $3",
        )
        .bind(&tenant_id)
        .bind(organization_id)
        .bind(limit)
        .fetch_all(pg)
        .await
    } else {
        sqlx::query(
            "SELECT b.id, b.tenant_id, b.organization_id, b.role_id, r.code AS role_code, \
                    b.principal_kind, b.principal_id, b.scope_kind, b.scope_id, b.effect, b.status \
             FROM iam_role_binding b \
             JOIN iam_role r ON r.id = b.role_id AND r.tenant_id = b.tenant_id \
             WHERE b.tenant_id = $1 AND b.status = 'active' \
             ORDER BY r.code, b.id \
             LIMIT $2",
        )
        .bind(&tenant_id)
        .bind(limit)
        .fetch_all(pg)
        .await
    };

    match rows {
        Ok(rows) => appbase_ok(page_json(
            rows.iter()
                .map(role_binding_row_to_json)
                .collect::<Vec<_>>(),
        )),
        Err(error) => appbase_error(
            StatusCode::INTERNAL_SERVER_ERROR,
            "iam_role_bindings_list_failed",
            &error.to_string(),
        ),
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
            return appbase_error(
                StatusCode::INTERNAL_SERVER_ERROR,
                "iam_role_lookup_failed",
                &error.to_string(),
            );
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
                Err(error) => appbase_error(
                    StatusCode::INTERNAL_SERVER_ERROR,
                    "iam_role_binding_create_failed",
                    &error.to_string(),
                ),
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
        Err(error) => appbase_error(
            StatusCode::INTERNAL_SERVER_ERROR,
            "iam_role_binding_delete_failed",
            &error.to_string(),
        ),
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

    let limit = page_limit(&query);
    let rows = sqlx::query(
        "SELECT id, tenant_id, code, name, status, organization_kind, parent_organization_id \
         FROM iam_organization \
         WHERE tenant_id = $1 AND status = 'active' \
         ORDER BY name, id \
         LIMIT $2",
    )
    .bind(&tenant_id)
    .bind(limit)
    .fetch_all(pg)
    .await;

    match rows {
        Ok(rows) => appbase_ok(page_json(
            rows.iter()
                .map(organization_row_to_json)
                .collect::<Vec<_>>(),
        )),
        Err(error) => appbase_error(
            StatusCode::INTERNAL_SERVER_ERROR,
            "iam_organizations_list_failed",
            &error.to_string(),
        ),
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

    let limit = page_limit(&query);
    let rows = if let Some(organization_id) = organization_id.as_deref() {
        sqlx::query(
            "SELECT m.id, m.tenant_id, m.organization_id, m.user_id, m.membership_kind, m.status, \
                    u.username, u.display_name, u.email \
             FROM iam_organization_membership m \
             JOIN iam_user u ON u.id = m.user_id AND u.tenant_id = m.tenant_id \
             WHERE m.tenant_id = $1 AND m.organization_id = $2 AND m.status = 'active' \
             ORDER BY m.joined_at DESC NULLS LAST, m.id \
             LIMIT $3",
        )
        .bind(&tenant_id)
        .bind(organization_id)
        .bind(limit)
        .fetch_all(pg)
        .await
    } else {
        sqlx::query(
            "SELECT m.id, m.tenant_id, m.organization_id, m.user_id, m.membership_kind, m.status, \
                    u.username, u.display_name, u.email \
             FROM iam_organization_membership m \
             JOIN iam_user u ON u.id = m.user_id AND u.tenant_id = m.tenant_id \
             WHERE m.tenant_id = $1 AND m.status = 'active' \
             ORDER BY m.joined_at DESC NULLS LAST, m.id \
             LIMIT $2",
        )
        .bind(&tenant_id)
        .bind(limit)
        .fetch_all(pg)
        .await
    };

    match rows {
        Ok(rows) => appbase_ok(page_json(
            rows.iter().map(membership_row_to_json).collect::<Vec<_>>(),
        )),
        Err(error) => appbase_error(
            StatusCode::INTERNAL_SERVER_ERROR,
            "iam_memberships_list_failed",
            &error.to_string(),
        ),
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

    let limit = page_limit(&query);
    let rows = if let Some(organization_id) = organization_id.as_deref() {
        sqlx::query(
            "SELECT id, tenant_id, organization_id, code, name, status, parent_department_id \
             FROM iam_department \
             WHERE tenant_id = $1 AND organization_id = $2 AND status = 'active' \
             ORDER BY name, id \
             LIMIT $3",
        )
        .bind(&tenant_id)
        .bind(organization_id)
        .bind(limit)
        .fetch_all(pg)
        .await
    } else {
        sqlx::query(
            "SELECT id, tenant_id, organization_id, code, name, status, parent_department_id \
             FROM iam_department \
             WHERE tenant_id = $1 AND status = 'active' \
             ORDER BY name, id \
             LIMIT $2",
        )
        .bind(&tenant_id)
        .bind(limit)
        .fetch_all(pg)
        .await
    };

    match rows {
        Ok(rows) => appbase_ok(page_json(
            rows.iter().map(department_row_to_json).collect::<Vec<_>>(),
        )),
        Err(error) => appbase_error(
            StatusCode::INTERNAL_SERVER_ERROR,
            "iam_departments_list_failed",
            &error.to_string(),
        ),
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

    let limit = page_limit(&query);
    let rows = sqlx::query(
        "SELECT id, tenant_id, organization_id, user_id, name, status, expires_at \
         FROM iam_api_key \
         WHERE tenant_id = $1 \
         ORDER BY created_at DESC NULLS LAST, id \
         LIMIT $2",
    )
    .bind(&tenant_id)
    .bind(limit)
    .fetch_all(pg)
    .await;

    match rows {
        Ok(rows) => appbase_ok(page_json(
            rows.iter().map(api_key_row_to_json).collect::<Vec<_>>(),
        )),
        Err(error) => appbase_error(
            StatusCode::INTERNAL_SERVER_ERROR,
            "iam_api_keys_list_failed",
            &error.to_string(),
        ),
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

    let limit = page_limit(&query);
    let rows = sqlx::query(
        "SELECT id, tenant_id, organization_id, user_id, event_type, created_at \
         FROM iam_security_event \
         WHERE tenant_id = $1 \
         ORDER BY created_at DESC NULLS LAST, id \
         LIMIT $2",
    )
    .bind(&tenant_id)
    .bind(limit)
    .fetch_all(pg)
    .await;

    match rows {
        Ok(rows) => appbase_ok(page_json(
            rows.iter()
                .map(security_event_row_to_json)
                .collect::<Vec<_>>(),
        )),
        Err(error) => appbase_error(
            StatusCode::INTERNAL_SERVER_ERROR,
            "iam_security_events_list_failed",
            &error.to_string(),
        ),
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

    let limit = page_limit(&query);
    let rows = sqlx::query(
        "SELECT id, tenant_id, organization_id, actor_user_id, action, created_at \
         FROM iam_audit_event \
         WHERE tenant_id = $1 \
         ORDER BY created_at DESC NULLS LAST, id \
         LIMIT $2",
    )
    .bind(&tenant_id)
    .bind(limit)
    .fetch_all(pg)
    .await;

    match rows {
        Ok(rows) => appbase_ok(page_json(
            rows.iter().map(audit_event_row_to_json).collect::<Vec<_>>(),
        )),
        Err(error) => appbase_error(
            StatusCode::INTERNAL_SERVER_ERROR,
            "iam_audit_events_list_failed",
            &error.to_string(),
        ),
    }
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
    json!({
        "createdAt": row.get::<String, _>(5),
        "eventType": row.get::<String, _>(4),
        "id": row.get::<String, _>(0),
        "organizationId": row.get::<String, _>(2),
        "tenantId": row.get::<String, _>(1),
        "userId": row.get::<Option<String>, _>(3),
    })
}

fn audit_event_row_to_json(row: &sqlx::postgres::PgRow) -> Value {
    json!({
        "action": row.get::<String, _>(4),
        "actorUserId": row.get::<Option<String>, _>(3),
        "createdAt": row.get::<String, _>(5),
        "id": row.get::<String, _>(0),
        "organizationId": row.get::<Option<String>, _>(2),
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

include!("directory_crud.impl.rs");
