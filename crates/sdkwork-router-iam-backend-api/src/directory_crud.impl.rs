fn patch_fields(body: &Value) -> Vec<(String, String)> {
    let mut assignments = Vec::new();
    for (column, keys) in [
        ("username", ["username"].as_slice()),
        ("display_name", ["displayName", "display_name"].as_slice()),
        ("email", ["email"].as_slice()),
        ("phone", ["phone"].as_slice()),
        ("name", ["name"].as_slice()),
        ("code", ["code"].as_slice()),
        ("status", ["status"].as_slice()),
        ("policy_json", ["policyJson", "policy_json"].as_slice()),
        ("membership_kind", ["membershipKind", "membership_kind"].as_slice()),
        ("department_kind", ["departmentKind", "department_kind"].as_slice()),
        ("position_kind", ["positionKind", "position_kind"].as_slice()),
        ("assignment_kind", ["assignmentKind", "assignment_kind"].as_slice()),
        ("member_kind", ["memberKind", "member_kind"].as_slice()),
        ("group_kind", ["groupKind", "group_kind"].as_slice()),
        ("credential_kind", ["credentialKind", "credential_kind"].as_slice()),
        ("organization_id", ["organizationId", "organization_id"].as_slice()),
    ] {
        if let Some(value) = read_string_field(body, keys) {
            assignments.push((column.to_owned(), value));
        }
    }
    for (column, keys) in [
        ("is_primary", ["isPrimary", "is_primary"].as_slice()),
        ("rank_level", ["rankLevel", "rank_level"].as_slice()),
    ] {
        if let Some(value) = read_i32_field(body, keys) {
            assignments.push((column.to_owned(), value.to_string()));
        }
    }
    assignments
}

fn nest_tree(records: Vec<Value>, id_key: &str, parent_key: &str) -> Vec<Value> {
    let mut nodes = records;
    for node in &mut nodes {
        if let Value::Object(map) = node {
            map.insert("children".to_owned(), json!([]));
        }
    }

    let mut index = HashMap::<String, usize>::new();
    for (idx, node) in nodes.iter().enumerate() {
        if let Some(id) = node.get(id_key).and_then(Value::as_str) {
            index.insert(id.to_owned(), idx);
        }
    }

    let mut roots = Vec::new();
    for idx in 0..nodes.len() {
        let parent_id = nodes[idx]
            .get(parent_key)
            .and_then(Value::as_str)
            .filter(|value| !value.is_empty())
            .map(str::to_owned);
        let Some(parent_id) = parent_id else {
            roots.push(nodes[idx].clone());
            continue;
        };
        let Some(parent_idx) = index.get(&parent_id).copied() else {
            roots.push(nodes[idx].clone());
            continue;
        };
        let child = nodes[idx].clone();
        if let Value::Object(ref mut parent) = nodes[parent_idx] {
            if let Some(Value::Array(children)) = parent.get_mut("children") {
                children.push(child);
            }
        }
    }
    roots
}

async fn fetch_permission_row<'e>(
    pg: &'e PgPool,
    permission_ref: &str,
) -> Result<Option<sqlx::postgres::PgRow>, sqlx::Error> {
    sqlx::query(
        "SELECT id, code, name, resource, action, COALESCE(status, 'active') AS status \
         FROM iam_permission WHERE id = $1 OR code = $1 LIMIT 1",
    )
    .bind(permission_ref)
    .fetch_optional(pg)
    .await
}

async fn soft_delete(
    state: &BackendIamState,
    ctx: &WebRequestContext,
    table: &str,
    id: &str,
    not_found_code: &str,
    error_code: &str,
) -> Response {
    let Ok(pg) = postgres_pool_or_error(state) else {
        return postgres_pool_or_error(state)
            .err()
            .expect("error response");
    };
    let Ok(tenant_id) = tenant_id_from_context(ctx) else {
        return tenant_id_from_context(ctx).err().expect("error response");
    };
    let now = Utc::now().to_rfc3339();
    let sql = format!(
        "UPDATE {table} SET status = 'disabled', updated_at = $3 \
         WHERE tenant_id = $1 AND id = $2 AND status <> 'disabled'"
    );
    match sqlx::query(&sql)
        .bind(&tenant_id)
        .bind(id)
        .bind(&now)
        .execute(pg)
        .await
    {
        Ok(result) if result.rows_affected() > 0 => appbase_ok(json!({ "deleted": true, "id": id })),
        Ok(_) => appbase_error(StatusCode::NOT_FOUND, not_found_code, "resource not found"),
        Err(error) => appbase_error(
            StatusCode::INTERNAL_SERVER_ERROR,
            error_code,
            &error.to_string(),
        ),
    }
}

fn policy_row_to_json(row: &sqlx::postgres::PgRow) -> Value {
    json!({
        "code": row.get::<String, _>(2),
        "id": row.get::<String, _>(0),
        "name": row.get::<String, _>(3),
        "policyId": row.get::<String, _>(0),
        "policyJson": row.get::<String, _>(4),
        "status": row.get::<String, _>(5),
        "tenantId": row.get::<String, _>(1),
    })
}

async fn fetch_organization_row<'e>(
    pg: &'e PgPool,
    tenant_id: &str,
    organization_id: &str,
) -> Result<Option<sqlx::postgres::PgRow>, sqlx::Error> {
    sqlx::query(
        "SELECT id, tenant_id, code, name, status, organization_kind, parent_organization_id \
         FROM iam_organization WHERE tenant_id = $1 AND id = $2 LIMIT 1",
    )
    .bind(tenant_id)
    .bind(organization_id)
    .fetch_optional(pg)
    .await
}

async fn fetch_department_row<'e>(
    pg: &'e PgPool,
    tenant_id: &str,
    department_id: &str,
) -> Result<Option<sqlx::postgres::PgRow>, sqlx::Error> {
    sqlx::query(
        "SELECT id, tenant_id, organization_id, code, name, status, parent_department_id \
         FROM iam_department WHERE tenant_id = $1 AND id = $2 LIMIT 1",
    )
    .bind(tenant_id)
    .bind(department_id)
    .fetch_optional(pg)
    .await
}

async fn create_user(
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
    let username = read_string_field(&body, &["username"]);
    let display_name = read_string_field(&body, &["displayName", "display_name"]);
    if username.as_deref().unwrap_or("").is_empty()
        || display_name.as_deref().unwrap_or("").is_empty()
    {
        return appbase_error(
            StatusCode::BAD_REQUEST,
            "iam_user_invalid",
            "username and displayName are required",
        );
    }
    let id = format!("iamu-{}", Uuid::new_v4());
    let now = Utc::now().to_rfc3339();
    match sqlx::query(
        "INSERT INTO iam_user (id, tenant_id, username, display_name, email, phone, status, created_at, updated_at) \
         VALUES ($1, $2, $3, $4, $5, $6, 'active', $7, $7)",
    )
    .bind(&id)
    .bind(&tenant_id)
    .bind(username.as_ref().expect("validated"))
    .bind(display_name.as_ref().expect("validated"))
    .bind(read_string_field(&body, &["email"]))
    .bind(read_string_field(&body, &["phone"]))
    .bind(&now)
    .execute(pg)
    .await
    {
        Ok(_) => match fetch_user_row(pg, &tenant_id, &id).await {
            Ok(Some(row)) => appbase_ok(user_row_to_json(&row)),
            _ => appbase_error(
                StatusCode::INTERNAL_SERVER_ERROR,
                "iam_user_create_failed",
                "user created but could not be loaded",
            ),
        },
        Err(error) => appbase_error(
            StatusCode::INTERNAL_SERVER_ERROR,
            "iam_user_create_failed",
            &error.to_string(),
        ),
    }
}

async fn update_user(
    State(state): State<BackendIamState>,
    ctx: WebRequestContext,
    Path(user_id): Path<String>,
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
    let mut assignments = patch_fields(&body);
    assignments.push(("updated_at".to_owned(), Utc::now().to_rfc3339()));
    if assignments.len() == 1 {
        return appbase_error(
            StatusCode::BAD_REQUEST,
            "iam_user_invalid",
            "no updatable fields provided",
        );
    }
    match patch_tenant_row(pg, &tenant_id, "iam_user", &user_id, &assignments).await {
        Ok(true) => match fetch_user_row(pg, &tenant_id, &user_id).await {
            Ok(Some(row)) => appbase_ok(user_row_to_json(&row)),
            _ => appbase_error(StatusCode::NOT_FOUND, "iam_user_not_found", "user not found"),
        },
        Ok(false) => appbase_error(StatusCode::NOT_FOUND, "iam_user_not_found", "user not found"),
        Err(error) => appbase_error(
            StatusCode::INTERNAL_SERVER_ERROR,
            "iam_user_update_failed",
            &error.to_string(),
        ),
    }
}

async fn delete_user(
    State(state): State<BackendIamState>,
    ctx: WebRequestContext,
    Path(user_id): Path<String>,
) -> Response {
    soft_delete(
        &state,
        &ctx,
        "iam_user",
        &user_id,
        "iam_user_not_found",
        "iam_user_delete_failed",
    )
    .await
}

async fn create_role(
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
    let code = read_string_field(&body, &["code"]);
    let name = read_string_field(&body, &["name"]);
    if code.as_deref().unwrap_or("").is_empty() || name.as_deref().unwrap_or("").is_empty() {
        return appbase_error(
            StatusCode::BAD_REQUEST,
            "iam_role_invalid",
            "code and name are required",
        );
    }
    let id = format!("iamr-{}", Uuid::new_v4());
    let now = Utc::now().to_rfc3339();
    match sqlx::query(
        "INSERT INTO iam_role (id, tenant_id, code, name, status, created_at, updated_at) \
         VALUES ($1, $2, $3, $4, 'active', $5, $5)",
    )
    .bind(&id)
    .bind(&tenant_id)
    .bind(code.as_ref().expect("validated"))
    .bind(name.as_ref().expect("validated"))
    .bind(&now)
    .execute(pg)
    .await
    {
        Ok(_) => match fetch_role_row(pg, &tenant_id, &id).await {
            Ok(Some(row)) => appbase_ok(role_row_to_json(&row)),
            _ => appbase_error(
                StatusCode::INTERNAL_SERVER_ERROR,
                "iam_role_create_failed",
                "role created but could not be loaded",
            ),
        },
        Err(error) => appbase_error(
            StatusCode::INTERNAL_SERVER_ERROR,
            "iam_role_create_failed",
            &error.to_string(),
        ),
    }
}

async fn update_role(
    State(state): State<BackendIamState>,
    ctx: WebRequestContext,
    Path(role_id): Path<String>,
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
    let mut assignments = patch_fields(&body);
    assignments.push(("updated_at".to_owned(), Utc::now().to_rfc3339()));
    match patch_tenant_row(pg, &tenant_id, "iam_role", &role_id, &assignments).await {
        Ok(true) => match fetch_role_row(pg, &tenant_id, &role_id).await {
            Ok(Some(row)) => appbase_ok(role_row_to_json(&row)),
            _ => appbase_error(StatusCode::NOT_FOUND, "iam_role_not_found", "role not found"),
        },
        Ok(false) => appbase_error(StatusCode::NOT_FOUND, "iam_role_not_found", "role not found"),
        Err(error) => appbase_error(
            StatusCode::INTERNAL_SERVER_ERROR,
            "iam_role_update_failed",
            &error.to_string(),
        ),
    }
}

async fn delete_role(
    State(state): State<BackendIamState>,
    ctx: WebRequestContext,
    Path(role_id): Path<String>,
) -> Response {
    soft_delete(
        &state,
        &ctx,
        "iam_role",
        &role_id,
        "iam_role_not_found",
        "iam_role_delete_failed",
    )
    .await
}

async fn create_permission(
    State(state): State<BackendIamState>,
    _ctx: WebRequestContext,
    Json(body): Json<Value>,
) -> Response {
    let Ok(pg) = postgres_pool_or_error(&state) else {
        return postgres_pool_or_error(&state)
            .err()
            .expect("error response");
    };
    let code = read_string_field(&body, &["code"]);
    let name = read_string_field(&body, &["name"]);
    let resource = read_string_field(&body, &["resource"]);
    let action = read_string_field(&body, &["action"]);
    if [code.as_deref(), name.as_deref(), resource.as_deref(), action.as_deref()]
        .iter()
        .any(|value| value.is_none_or(|text| text.is_empty()))
    {
        return appbase_error(
            StatusCode::BAD_REQUEST,
            "iam_permission_invalid",
            "code, name, resource, and action are required",
        );
    }
    let id = format!("iamp-{}", Uuid::new_v4());
    let now = Utc::now().to_rfc3339();
    match sqlx::query(
        "INSERT INTO iam_permission (id, code, name, resource, action, created_at) \
         VALUES ($1, $2, $3, $4, $5, $6)",
    )
    .bind(&id)
    .bind(code.as_ref().expect("validated"))
    .bind(name.as_ref().expect("validated"))
    .bind(resource.as_ref().expect("validated"))
    .bind(action.as_ref().expect("validated"))
    .bind(&now)
    .execute(pg)
    .await
    {
        Ok(_) => match fetch_permission_row(pg, &id).await {
            Ok(Some(row)) => appbase_ok(permission_row_to_json(&row)),
            _ => appbase_error(
                StatusCode::INTERNAL_SERVER_ERROR,
                "iam_permission_create_failed",
                "permission created but could not be loaded",
            ),
        },
        Err(error) => appbase_error(
            StatusCode::INTERNAL_SERVER_ERROR,
            "iam_permission_create_failed",
            &error.to_string(),
        ),
    }
}

async fn update_permission(
    State(state): State<BackendIamState>,
    _ctx: WebRequestContext,
    Path(permission_id): Path<String>,
    Json(body): Json<Value>,
) -> Response {
    let Ok(pg) = postgres_pool_or_error(&state) else {
        return postgres_pool_or_error(&state)
            .err()
            .expect("error response");
    };
    let assignments = patch_fields(&body);
    if assignments.is_empty() {
        return appbase_error(
            StatusCode::BAD_REQUEST,
            "iam_permission_invalid",
            "no updatable fields provided",
        );
    }
    let mut set_clause = String::new();
    for (index, (column, _)) in assignments.iter().enumerate() {
        if index > 0 {
            set_clause.push_str(", ");
        }
        set_clause.push_str(column);
        set_clause.push_str(" = $");
        set_clause.push_str(&(index + 2).to_string());
    }
    let sql = format!("UPDATE iam_permission SET {set_clause} WHERE id = $1 OR code = $1");
    let mut query = sqlx::query(&sql).bind(&permission_id);
    for (_, value) in &assignments {
        query = query.bind(value);
    }
    match query.execute(pg).await {
        Ok(result) if result.rows_affected() > 0 => match fetch_permission_row(pg, &permission_id).await {
            Ok(Some(row)) => appbase_ok(permission_row_to_json(&row)),
            _ => appbase_error(
                StatusCode::NOT_FOUND,
                "iam_permission_not_found",
                "permission not found",
            ),
        },
        Ok(_) => appbase_error(
            StatusCode::NOT_FOUND,
            "iam_permission_not_found",
            "permission not found",
        ),
        Err(error) => appbase_error(
            StatusCode::INTERNAL_SERVER_ERROR,
            "iam_permission_update_failed",
            &error.to_string(),
        ),
    }
}

async fn delete_permission(
    State(state): State<BackendIamState>,
    _ctx: WebRequestContext,
    Path(permission_id): Path<String>,
) -> Response {
    let Ok(pg) = postgres_pool_or_error(&state) else {
        return postgres_pool_or_error(&state)
            .err()
            .expect("error response");
    };
    match sqlx::query("DELETE FROM iam_permission WHERE id = $1 OR code = $1")
        .bind(&permission_id)
        .execute(pg)
        .await
    {
        Ok(result) if result.rows_affected() > 0 => {
            appbase_ok(json!({ "deleted": true, "permissionId": permission_id }))
        }
        Ok(_) => appbase_error(
            StatusCode::NOT_FOUND,
            "iam_permission_not_found",
            "permission not found",
        ),
        Err(error) => appbase_error(
            StatusCode::INTERNAL_SERVER_ERROR,
            "iam_permission_delete_failed",
            &error.to_string(),
        ),
    }
}

async fn create_role_permission(
    State(state): State<BackendIamState>,
    ctx: WebRequestContext,
    Path(role_id): Path<String>,
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
    let permission_ref = read_string_field(
        &body,
        &["permissionId", "permission_id", "permissionCode", "permission_code"],
    );
    let Some(permission_ref) = permission_ref else {
        return appbase_error(
            StatusCode::BAD_REQUEST,
            "iam_role_permission_invalid",
            "permissionId or permissionCode is required",
        );
    };
    let role_id = resolve_role_id(pg, &tenant_id, &role_id)
        .await
        .unwrap_or(role_id);
    let Some(permission_row) = fetch_permission_row(pg, &permission_ref).await.ok().flatten() else {
        return appbase_error(
            StatusCode::NOT_FOUND,
            "iam_permission_not_found",
            "permission not found",
        );
    };
    let permission_id: String = permission_row.get(0);
    let permission_code: String = permission_row.get(1);
    let permission_status: String = permission_row.get(5);
    if permission_status == "retired" {
        return appbase_error(
            StatusCode::CONFLICT,
            "iam_permission_retired",
            "cannot grant retired permission to role",
        );
    }

    let assigner_scope = match crate::handlers::assigner_permission_scope(&ctx) {
        Ok(scope) => scope,
        Err(response) => return response,
    };
    if let Err(error) = sdkwork_iam_bootstrap::ensure_permission_grant_within_assigner_scope(
        &assigner_scope,
        &permission_code,
    ) {
        return appbase_error(
            StatusCode::FORBIDDEN,
            "iam_role_permission_assigner_scope_exceeded",
            &error,
        );
    }

    let id = format!("iamrp-{}", Uuid::new_v4());
    let now = Utc::now().to_rfc3339();
    match sqlx::query(
        "INSERT INTO iam_role_permission (id, tenant_id, role_id, permission_id, created_at) \
         VALUES ($1, $2, $3, $4, $5) ON CONFLICT (tenant_id, role_id, permission_id) DO NOTHING",
    )
    .bind(&id)
    .bind(&tenant_id)
    .bind(&role_id)
    .bind(&permission_id)
    .bind(&now)
    .execute(pg)
    .await
    {
        Ok(_) => appbase_ok(json!({ "permissionId": permission_id, "roleId": role_id })),
        Err(error) => appbase_error(
            StatusCode::INTERNAL_SERVER_ERROR,
            "iam_role_permission_create_failed",
            &error.to_string(),
        ),
    }
}

async fn delete_role_permission(
    State(state): State<BackendIamState>,
    ctx: WebRequestContext,
    Path((role_id, permission_id)): Path<(String, String)>,
) -> Response {
    let Ok(pg) = postgres_pool_or_error(&state) else {
        return postgres_pool_or_error(&state)
            .err()
            .expect("error response");
    };
    let Ok(tenant_id) = tenant_id_from_context(&ctx) else {
        return tenant_id_from_context(&ctx).err().expect("error response");
    };
    let role_id = resolve_role_id(pg, &tenant_id, &role_id)
        .await
        .unwrap_or(role_id);
    let permission_id = fetch_permission_row(pg, &permission_id)
        .await
        .ok()
        .flatten()
        .map(|row| row.get::<String, _>(0))
        .unwrap_or(permission_id);
    match sqlx::query(
        "DELETE FROM iam_role_permission WHERE tenant_id = $1 AND role_id = $2 AND permission_id = $3",
    )
    .bind(&tenant_id)
    .bind(&role_id)
    .bind(&permission_id)
    .execute(pg)
    .await
    {
        Ok(result) if result.rows_affected() > 0 => {
            appbase_ok(json!({ "permissionId": permission_id, "roleId": role_id }))
        }
        Ok(_) => appbase_error(
            StatusCode::NOT_FOUND,
            "iam_role_permission_not_found",
            "role permission not found",
        ),
        Err(error) => appbase_error(
            StatusCode::INTERNAL_SERVER_ERROR,
            "iam_role_permission_delete_failed",
            &error.to_string(),
        ),
    }
}

async fn list_policies(
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
    match list_tenant_rows(
        pg,
        &tenant_id,
        "iam_policy",
        "id, tenant_id, code, name, policy_json, status, created_at, updated_at",
        "name, id",
        page_limit(&query),
    )
    .await
    {
        Ok(rows) => appbase_ok(page_json(rows.iter().map(policy_row_to_json).collect())),
        Err(error) => appbase_error(
            StatusCode::INTERNAL_SERVER_ERROR,
            "iam_policies_list_failed",
            &error.to_string(),
        ),
    }
}

async fn retrieve_policy(
    State(state): State<BackendIamState>,
    ctx: WebRequestContext,
    Path(policy_id): Path<String>,
) -> Response {
    let Ok(pg) = postgres_pool_or_error(&state) else {
        return postgres_pool_or_error(&state)
            .err()
            .expect("error response");
    };
    let Ok(tenant_id) = tenant_id_from_context(&ctx) else {
        return tenant_id_from_context(&ctx).err().expect("error response");
    };
    match retrieve_tenant_row(
        pg,
        &tenant_id,
        "iam_policy",
        "id, tenant_id, code, name, policy_json, status, created_at, updated_at",
        &policy_id,
    )
    .await
    {
        Ok(Some(row)) => appbase_ok(policy_row_to_json(&row)),
        Ok(None) => appbase_error(StatusCode::NOT_FOUND, "iam_policy_not_found", "policy not found"),
        Err(error) => appbase_error(
            StatusCode::INTERNAL_SERVER_ERROR,
            "iam_policy_retrieve_failed",
            &error.to_string(),
        ),
    }
}

async fn create_policy(
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
    let code = read_string_field(&body, &["code"]);
    let name = read_string_field(&body, &["name"]);
    if code.as_deref().unwrap_or("").is_empty() || name.as_deref().unwrap_or("").is_empty() {
        return appbase_error(
            StatusCode::BAD_REQUEST,
            "iam_policy_invalid",
            "code and name are required",
        );
    }
    let id = format!("iampol-{}", Uuid::new_v4());
    let now = Utc::now().to_rfc3339();
    let policy_json = read_string_field(&body, &["policyJson", "policy_json"])
        .unwrap_or_else(|| "{}".to_owned());
    match sqlx::query(
        "INSERT INTO iam_policy (id, tenant_id, code, name, policy_json, status, created_at, updated_at) \
         VALUES ($1, $2, $3, $4, $5, 'active', $6, $6)",
    )
    .bind(&id)
    .bind(&tenant_id)
    .bind(code.as_ref().expect("validated"))
    .bind(name.as_ref().expect("validated"))
    .bind(&policy_json)
    .bind(&now)
    .execute(pg)
    .await
    {
        Ok(_) => retrieve_policy(State(state), ctx, Path(id)).await,
        Err(error) => appbase_error(
            StatusCode::INTERNAL_SERVER_ERROR,
            "iam_policy_create_failed",
            &error.to_string(),
        ),
    }
}

async fn update_policy(
    State(state): State<BackendIamState>,
    ctx: WebRequestContext,
    Path(policy_id): Path<String>,
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
    let mut assignments = patch_fields(&body);
    assignments.push(("updated_at".to_owned(), Utc::now().to_rfc3339()));
    match patch_tenant_row(pg, &tenant_id, "iam_policy", &policy_id, &assignments).await {
        Ok(true) => retrieve_policy(State(state), ctx, Path(policy_id)).await,
        Ok(false) => appbase_error(StatusCode::NOT_FOUND, "iam_policy_not_found", "policy not found"),
        Err(error) => appbase_error(
            StatusCode::INTERNAL_SERVER_ERROR,
            "iam_policy_update_failed",
            &error.to_string(),
        ),
    }
}

async fn delete_policy(
    State(state): State<BackendIamState>,
    ctx: WebRequestContext,
    Path(policy_id): Path<String>,
) -> Response {
    soft_delete(
        &state,
        &ctx,
        "iam_policy",
        &policy_id,
        "iam_policy_not_found",
        "iam_policy_delete_failed",
    )
    .await
}

async fn create_organization(
    State(state): State<BackendIamState>,
    ctx: WebRequestContext,
    Json(body): Json<Value>,
) -> Response {
    let Ok(pg) = postgres_pool_or_error(&state) else { return postgres_pool_or_error(&state).err().expect("error response"); };
    let Ok(tenant_id) = tenant_id_from_context(&ctx) else { return tenant_id_from_context(&ctx).err().expect("error response"); };
    let code = read_string_field(&body, &["code"]);
    let name = read_string_field(&body, &["name"]);
    if code.as_deref().unwrap_or("").is_empty() || name.as_deref().unwrap_or("").is_empty() {
        return appbase_error(StatusCode::BAD_REQUEST, "iam_organization_invalid", "code and name are required");
    }
    let id = format!("iamorg-{}", Uuid::new_v4());
    let now = Utc::now().to_rfc3339();
    let path = format!("/{}", code.as_ref().expect("validated"));
    match sqlx::query(
        "INSERT INTO iam_organization \
         (id, tenant_id, parent_organization_id, code, name, organization_kind, tenant_boundary_kind, \
          data_boundary_kind, verification_status, path, status, created_at, updated_at) \
         VALUES ($1, $2, $3, $4, $5, 'enterprise', 'shared', 'organization', 'verified', $6, 'active', $7, $7)",
    )
    .bind(&id).bind(&tenant_id)
    .bind(read_string_field(&body, &["parentOrganizationId", "parent_organization_id"]))
    .bind(code.as_ref().expect("validated")).bind(name.as_ref().expect("validated"))
    .bind(&path).bind(&now).execute(pg).await
    {
        Ok(_) => {
            let _ = sqlx::query("INSERT INTO iam_organization_closure (id, tenant_id, ancestor_organization_id, descendant_organization_id, depth, created_at) VALUES ($1, $2, $3, $3, 0, $4)")
                .bind(format!("iamoc-{}", Uuid::new_v4())).bind(&tenant_id).bind(&id).bind(&now).execute(pg).await;
            match fetch_organization_row(pg, &tenant_id, &id).await {
                Ok(Some(row)) => appbase_ok(organization_row_to_json(&row)),
                _ => appbase_error(StatusCode::INTERNAL_SERVER_ERROR, "iam_organization_create_failed", "organization created but could not be loaded"),
            }
        }
        Err(error) => appbase_error(StatusCode::INTERNAL_SERVER_ERROR, "iam_organization_create_failed", &error.to_string()),
    }
}

async fn retrieve_organization(State(state): State<BackendIamState>, ctx: WebRequestContext, Path(organization_id): Path<String>) -> Response {
    let Ok(pg) = postgres_pool_or_error(&state) else { return postgres_pool_or_error(&state).err().expect("error response"); };
    let Ok(tenant_id) = tenant_id_from_context(&ctx) else { return tenant_id_from_context(&ctx).err().expect("error response"); };
    match fetch_organization_row(pg, &tenant_id, &organization_id).await {
        Ok(Some(row)) => appbase_ok(organization_row_to_json(&row)),
        Ok(None) => appbase_error(StatusCode::NOT_FOUND, "iam_organization_not_found", "organization not found"),
        Err(error) => appbase_error(StatusCode::INTERNAL_SERVER_ERROR, "iam_organization_retrieve_failed", &error.to_string()),
    }
}

async fn update_organization(State(state): State<BackendIamState>, ctx: WebRequestContext, Path(organization_id): Path<String>, Json(body): Json<Value>) -> Response {
    let Ok(pg) = postgres_pool_or_error(&state) else { return postgres_pool_or_error(&state).err().expect("error response"); };
    let Ok(tenant_id) = tenant_id_from_context(&ctx) else { return tenant_id_from_context(&ctx).err().expect("error response"); };
    let mut assignments = patch_fields(&body);
    assignments.push(("updated_at".to_owned(), Utc::now().to_rfc3339()));
    match patch_tenant_row(pg, &tenant_id, "iam_organization", &organization_id, &assignments).await {
        Ok(true) => retrieve_organization(State(state), ctx, Path(organization_id)).await,
        Ok(false) => appbase_error(StatusCode::NOT_FOUND, "iam_organization_not_found", "organization not found"),
        Err(error) => appbase_error(StatusCode::INTERNAL_SERVER_ERROR, "iam_organization_update_failed", &error.to_string()),
    }
}

async fn delete_organization(State(state): State<BackendIamState>, ctx: WebRequestContext, Path(organization_id): Path<String>) -> Response {
    soft_delete(&state, &ctx, "iam_organization", &organization_id, "iam_organization_not_found", "iam_organization_delete_failed").await
}

async fn organizations_tree(State(state): State<BackendIamState>, ctx: WebRequestContext) -> Response {
    let Ok(pg) = postgres_pool_or_error(&state) else { return postgres_pool_or_error(&state).err().expect("error response"); };
    let Ok(tenant_id) = tenant_id_from_context(&ctx) else { return tenant_id_from_context(&ctx).err().expect("error response"); };
    match sqlx::query("SELECT id, tenant_id, code, name, status, organization_kind, parent_organization_id FROM iam_organization WHERE tenant_id = $1 AND status = 'active' ORDER BY name, id").bind(&tenant_id).fetch_all(pg).await {
        Ok(rows) => appbase_ok(json!({ "nodes": nest_tree(rows.iter().map(organization_row_to_json).collect(), "id", "parentOrganizationId") })),
        Err(error) => appbase_error(StatusCode::INTERNAL_SERVER_ERROR, "iam_organizations_tree_failed", &error.to_string()),
    }
}

async fn create_organization_membership(State(state): State<BackendIamState>, ctx: WebRequestContext, Json(body): Json<Value>) -> Response {
    let Ok(pg) = postgres_pool_or_error(&state) else { return postgres_pool_or_error(&state).err().expect("error response"); };
    let Ok(tenant_id) = tenant_id_from_context(&ctx) else { return tenant_id_from_context(&ctx).err().expect("error response"); };
    let organization_id = read_string_field(&body, &["organizationId", "organization_id"]).or_else(|| organization_id_from_context(&ctx));
    let user_id = read_string_field(&body, &["userId", "user_id"]);
    if organization_id.as_deref().unwrap_or("").is_empty() || user_id.as_deref().unwrap_or("").is_empty() {
        return appbase_error(StatusCode::BAD_REQUEST, "iam_membership_invalid", "organizationId and userId are required");
    }
    let id = format!("iamom-{}", Uuid::new_v4()); let now = Utc::now().to_rfc3339();
    match sqlx::query("INSERT INTO iam_organization_membership (id, tenant_id, organization_id, user_id, membership_kind, status, joined_at, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, 'active', $6, $6, $6)")
        .bind(&id).bind(&tenant_id).bind(organization_id.as_ref().expect("validated")).bind(user_id.as_ref().expect("validated"))
        .bind(read_string_field(&body, &["membershipKind", "membership_kind"]).unwrap_or_else(|| "employee".to_owned())).bind(&now).execute(pg).await {
        Ok(_) => appbase_ok(json!({ "membershipId": id })),
        Err(error) => appbase_error(StatusCode::INTERNAL_SERVER_ERROR, "iam_membership_create_failed", &error.to_string()),
    }
}

async fn update_organization_membership(State(state): State<BackendIamState>, ctx: WebRequestContext, Path(membership_id): Path<String>, Json(body): Json<Value>) -> Response {
    let Ok(pg) = postgres_pool_or_error(&state) else { return postgres_pool_or_error(&state).err().expect("error response"); };
    let Ok(tenant_id) = tenant_id_from_context(&ctx) else { return tenant_id_from_context(&ctx).err().expect("error response"); };
    let mut assignments = patch_fields(&body); assignments.push(("updated_at".to_owned(), Utc::now().to_rfc3339()));
    match patch_tenant_row(pg, &tenant_id, "iam_organization_membership", &membership_id, &assignments).await {
        Ok(true) => appbase_ok(json!({ "membershipId": membership_id })),
        Ok(false) => appbase_error(StatusCode::NOT_FOUND, "iam_membership_not_found", "membership not found"),
        Err(error) => appbase_error(StatusCode::INTERNAL_SERVER_ERROR, "iam_membership_update_failed", &error.to_string()),
    }
}

async fn create_department(State(state): State<BackendIamState>, ctx: WebRequestContext, Json(body): Json<Value>) -> Response {
    let Ok(pg) = postgres_pool_or_error(&state) else { return postgres_pool_or_error(&state).err().expect("error response"); };
    let Ok(tenant_id) = tenant_id_from_context(&ctx) else { return tenant_id_from_context(&ctx).err().expect("error response"); };
    let organization_id = read_string_field(&body, &["organizationId", "organization_id"]).or_else(|| organization_id_from_context(&ctx));
    let code = read_string_field(&body, &["code"]); let name = read_string_field(&body, &["name"]);
    if organization_id.as_deref().unwrap_or("").is_empty() || code.as_deref().unwrap_or("").is_empty() || name.as_deref().unwrap_or("").is_empty() {
        return appbase_error(StatusCode::BAD_REQUEST, "iam_department_invalid", "organizationId, code, and name are required");
    }
    let organization_id = organization_id.expect("validated");
    let parent_department_id = read_string_field(&body, &["parentDepartmentId", "parent_department_id"]);
    let path = if let Some(parent_id) = parent_department_id.as_deref() {
        match sqlx::query("SELECT path FROM iam_department WHERE tenant_id = $1 AND organization_id = $2 AND id = $3 AND status <> 'disabled'")
            .bind(&tenant_id).bind(&organization_id).bind(parent_id).fetch_optional(pg).await
        {
            Ok(Some(row)) => format!("{}/{}", row.get::<String, _>(0), code.as_ref().expect("validated")),
            Ok(None) => return appbase_error(StatusCode::BAD_REQUEST, "iam_department_invalid", "parentDepartmentId not found"),
            Err(error) => return appbase_error(StatusCode::INTERNAL_SERVER_ERROR, "iam_department_create_failed", &error.to_string()),
        }
    } else {
        format!("/{organization_id}/{}", code.as_ref().expect("validated"))
    };
    let id = format!("iamdept-{}", Uuid::new_v4()); let now = Utc::now();
    match sqlx::query("INSERT INTO iam_department (id, tenant_id, organization_id, parent_department_id, code, name, department_kind, path, status, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, 'standard', $7, 'active', $8, $8)")
        .bind(&id).bind(&tenant_id).bind(&organization_id).bind(&parent_department_id)
        .bind(code.as_ref().expect("validated")).bind(name.as_ref().expect("validated")).bind(&path).bind(now).execute(pg).await {
        Ok(_) => {
            if let Err(error) = sdkwork_iam_module_registry::ensure_department_closure_postgres(
                pg,
                &tenant_id,
                &organization_id,
                &id,
                parent_department_id.as_deref(),
                now,
            ).await {
                return appbase_error(StatusCode::INTERNAL_SERVER_ERROR, "iam_department_create_failed", &error);
            }
            match fetch_department_row(pg, &tenant_id, &id).await {
                Ok(Some(row)) => appbase_ok(department_row_to_json(&row)),
                _ => appbase_error(StatusCode::INTERNAL_SERVER_ERROR, "iam_department_create_failed", "department created but could not be loaded"),
            }
        }
        Err(error) => appbase_error(StatusCode::INTERNAL_SERVER_ERROR, "iam_department_create_failed", &error.to_string()),
    }
}

async fn retrieve_department(State(state): State<BackendIamState>, ctx: WebRequestContext, Path(department_id): Path<String>) -> Response {
    let Ok(pg) = postgres_pool_or_error(&state) else { return postgres_pool_or_error(&state).err().expect("error response"); };
    let Ok(tenant_id) = tenant_id_from_context(&ctx) else { return tenant_id_from_context(&ctx).err().expect("error response"); };
    match fetch_department_row(pg, &tenant_id, &department_id).await {
        Ok(Some(row)) => appbase_ok(department_row_to_json(&row)),
        Ok(None) => appbase_error(StatusCode::NOT_FOUND, "iam_department_not_found", "department not found"),
        Err(error) => appbase_error(StatusCode::INTERNAL_SERVER_ERROR, "iam_department_retrieve_failed", &error.to_string()),
    }
}

async fn update_department(State(state): State<BackendIamState>, ctx: WebRequestContext, Path(department_id): Path<String>, Json(body): Json<Value>) -> Response {
    let Ok(pg) = postgres_pool_or_error(&state) else { return postgres_pool_or_error(&state).err().expect("error response"); };
    let Ok(tenant_id) = tenant_id_from_context(&ctx) else { return tenant_id_from_context(&ctx).err().expect("error response"); };
    let mut assignments = patch_fields(&body); assignments.push(("updated_at".to_owned(), Utc::now().to_rfc3339()));
    match patch_tenant_row(pg, &tenant_id, "iam_department", &department_id, &assignments).await {
        Ok(true) => retrieve_department(State(state), ctx, Path(department_id)).await,
        Ok(false) => appbase_error(StatusCode::NOT_FOUND, "iam_department_not_found", "department not found"),
        Err(error) => appbase_error(StatusCode::INTERNAL_SERVER_ERROR, "iam_department_update_failed", &error.to_string()),
    }
}

async fn delete_department(State(state): State<BackendIamState>, ctx: WebRequestContext, Path(department_id): Path<String>) -> Response {
    soft_delete(&state, &ctx, "iam_department", &department_id, "iam_department_not_found", "iam_department_delete_failed").await
}

async fn departments_tree(State(state): State<BackendIamState>, ctx: WebRequestContext) -> Response {
    let Ok(pg) = postgres_pool_or_error(&state) else { return postgres_pool_or_error(&state).err().expect("error response"); };
    let Ok(tenant_id) = tenant_id_from_context(&ctx) else { return tenant_id_from_context(&ctx).err().expect("error response"); };
    let organization_id = organization_id_from_context(&ctx);
    let rows = if let Some(organization_id) = organization_id.as_deref() {
        sqlx::query("SELECT id, tenant_id, organization_id, code, name, status, parent_department_id FROM iam_department WHERE tenant_id = $1 AND organization_id = $2 AND status = 'active' ORDER BY name, id").bind(&tenant_id).bind(organization_id).fetch_all(pg).await
    } else {
        sqlx::query("SELECT id, tenant_id, organization_id, code, name, status, parent_department_id FROM iam_department WHERE tenant_id = $1 AND status = 'active' ORDER BY name, id").bind(&tenant_id).fetch_all(pg).await
    };
    match rows {
        Ok(rows) => appbase_ok(json!({ "nodes": nest_tree(rows.iter().map(department_row_to_json).collect(), "id", "parentDepartmentId") })),
        Err(error) => appbase_error(StatusCode::INTERNAL_SERVER_ERROR, "iam_departments_tree_failed", &error.to_string()),
    }
}

async fn list_department_assignments(State(state): State<BackendIamState>, ctx: WebRequestContext, Query(query): Query<HashMap<String, String>>) -> Response {
    let Ok(pg) = postgres_pool_or_error(&state) else { return postgres_pool_or_error(&state).err().expect("error response"); };
    let Ok(tenant_id) = tenant_id_from_context(&ctx) else { return tenant_id_from_context(&ctx).err().expect("error response"); };
    match sqlx::query("SELECT id, tenant_id, organization_id, organization_membership_id, user_id, department_id, assignment_kind, is_primary, effective_from, status FROM iam_department_assignment WHERE tenant_id = $1 AND status = 'active' ORDER BY id LIMIT $2").bind(&tenant_id).bind(page_limit(&query)).fetch_all(pg).await {
        Ok(rows) => appbase_ok(page_json(rows.iter().map(|row| json!({"assignmentId": row.get::<String,_>(0), "departmentId": row.get::<String,_>(5), "id": row.get::<String,_>(0), "organizationId": row.get::<String,_>(2), "status": row.get::<String,_>(9), "tenantId": row.get::<String,_>(1), "userId": row.get::<String,_>(4)})).collect())),
        Err(error) => appbase_error(StatusCode::INTERNAL_SERVER_ERROR, "iam_department_assignments_list_failed", &error.to_string()),
    }
}

async fn create_department_assignment(State(state): State<BackendIamState>, ctx: WebRequestContext, Json(body): Json<Value>) -> Response {
    let Ok(pg) = postgres_pool_or_error(&state) else { return postgres_pool_or_error(&state).err().expect("error response"); };
    let Ok(tenant_id) = tenant_id_from_context(&ctx) else { return tenant_id_from_context(&ctx).err().expect("error response"); };
    let organization_id = read_string_field(&body, &["organizationId", "organization_id"]).or_else(|| organization_id_from_context(&ctx));
    let user_id = read_string_field(&body, &["userId", "user_id"]);
    let department_id = read_string_field(&body, &["departmentId", "department_id"]);
    let membership_id = read_string_field(&body, &["organizationMembershipId", "organization_membership_id"]);
    if [organization_id.as_deref(), user_id.as_deref(), department_id.as_deref(), membership_id.as_deref()].iter().any(|v| v.is_none_or(|t| t.is_empty())) {
        return appbase_error(StatusCode::BAD_REQUEST, "iam_department_assignment_invalid", "organizationId, userId, departmentId, and organizationMembershipId are required");
    }
    let id = format!("iamda-{}", Uuid::new_v4()); let now = Utc::now().to_rfc3339();
    match sqlx::query("INSERT INTO iam_department_assignment (id, tenant_id, organization_id, organization_membership_id, department_id, user_id, assignment_kind, is_primary, effective_from, status, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,0,$8,'active',$8,$8)")
        .bind(&id).bind(&tenant_id).bind(organization_id.as_ref().expect("validated")).bind(membership_id.as_ref().expect("validated")).bind(department_id.as_ref().expect("validated")).bind(user_id.as_ref().expect("validated"))
        .bind(read_string_field(&body, &["assignmentKind", "assignment_kind"]).unwrap_or_else(|| "primary".to_owned())).bind(&now).execute(pg).await {
        Ok(_) => appbase_ok(json!({ "assignmentId": id })),
        Err(error) => appbase_error(StatusCode::INTERNAL_SERVER_ERROR, "iam_department_assignment_create_failed", &error.to_string()),
    }
}

async fn update_department_assignment(State(state): State<BackendIamState>, ctx: WebRequestContext, Path(assignment_id): Path<String>, Json(body): Json<Value>) -> Response {
    let Ok(pg) = postgres_pool_or_error(&state) else { return postgres_pool_or_error(&state).err().expect("error response"); };
    let Ok(tenant_id) = tenant_id_from_context(&ctx) else { return tenant_id_from_context(&ctx).err().expect("error response"); };
    let mut assignments = patch_fields(&body); assignments.push(("updated_at".to_owned(), Utc::now().to_rfc3339()));
    match patch_tenant_row(pg, &tenant_id, "iam_department_assignment", &assignment_id, &assignments).await {
        Ok(true) => appbase_ok(json!({ "assignmentId": assignment_id })),
        Ok(false) => appbase_error(StatusCode::NOT_FOUND, "iam_department_assignment_not_found", "assignment not found"),
        Err(error) => appbase_error(StatusCode::INTERNAL_SERVER_ERROR, "iam_department_assignment_update_failed", &error.to_string()),
    }
}

async fn list_positions(State(state): State<BackendIamState>, ctx: WebRequestContext, Query(query): Query<HashMap<String, String>>) -> Response {
    let Ok(pg) = postgres_pool_or_error(&state) else { return postgres_pool_or_error(&state).err().expect("error response"); };
    let Ok(tenant_id) = tenant_id_from_context(&ctx) else { return tenant_id_from_context(&ctx).err().expect("error response"); };
    match list_tenant_rows(pg, &tenant_id, "iam_position", "id, tenant_id, organization_id, code, name, position_kind, status, created_at, updated_at", "name, id", page_limit(&query)).await {
        Ok(rows) => appbase_ok(page_json(rows.iter().map(|row| json!({"code": row.get::<String,_>(3), "id": row.get::<String,_>(0), "name": row.get::<String,_>(4), "organizationId": row.get::<String,_>(2), "positionId": row.get::<String,_>(0), "positionKind": row.get::<String,_>(5), "status": row.get::<String,_>(6), "tenantId": row.get::<String,_>(1)})).collect())),
        Err(error) => appbase_error(StatusCode::INTERNAL_SERVER_ERROR, "iam_positions_list_failed", &error.to_string()),
    }
}

async fn create_position(State(state): State<BackendIamState>, ctx: WebRequestContext, Json(body): Json<Value>) -> Response {
    let Ok(pg) = postgres_pool_or_error(&state) else { return postgres_pool_or_error(&state).err().expect("error response"); };
    let Ok(tenant_id) = tenant_id_from_context(&ctx) else { return tenant_id_from_context(&ctx).err().expect("error response"); };
    let organization_id = read_string_field(&body, &["organizationId", "organization_id"]).or_else(|| organization_id_from_context(&ctx));
    let code = read_string_field(&body, &["code"]); let name = read_string_field(&body, &["name"]);
    if organization_id.as_deref().unwrap_or("").is_empty() || code.as_deref().unwrap_or("").is_empty() || name.as_deref().unwrap_or("").is_empty() {
        return appbase_error(StatusCode::BAD_REQUEST, "iam_position_invalid", "organizationId, code, and name are required");
    }
    let id = format!("iampo-{}", Uuid::new_v4()); let now = Utc::now().to_rfc3339();
    match sqlx::query("INSERT INTO iam_position (id, tenant_id, organization_id, department_id, code, name, position_kind, status, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,'active',$8,$8)")
        .bind(&id).bind(&tenant_id).bind(organization_id.as_ref().expect("validated")).bind(read_string_field(&body, &["departmentId", "department_id"]))
        .bind(code.as_ref().expect("validated")).bind(name.as_ref().expect("validated")).bind(read_string_field(&body, &["positionKind", "position_kind"]).unwrap_or_else(|| "standard".to_owned())).bind(&now).execute(pg).await {
        Ok(_) => appbase_ok(json!({ "positionId": id })),
        Err(error) => appbase_error(StatusCode::INTERNAL_SERVER_ERROR, "iam_position_create_failed", &error.to_string()),
    }
}

async fn update_position(State(state): State<BackendIamState>, ctx: WebRequestContext, Path(position_id): Path<String>, Json(body): Json<Value>) -> Response {
    let Ok(pg) = postgres_pool_or_error(&state) else { return postgres_pool_or_error(&state).err().expect("error response"); };
    let Ok(tenant_id) = tenant_id_from_context(&ctx) else { return tenant_id_from_context(&ctx).err().expect("error response"); };
    let mut assignments = patch_fields(&body); assignments.push(("updated_at".to_owned(), Utc::now().to_rfc3339()));
    match patch_tenant_row(pg, &tenant_id, "iam_position", &position_id, &assignments).await {
        Ok(true) => appbase_ok(json!({ "positionId": position_id })),
        Ok(false) => appbase_error(StatusCode::NOT_FOUND, "iam_position_not_found", "position not found"),
        Err(error) => appbase_error(StatusCode::INTERNAL_SERVER_ERROR, "iam_position_update_failed", &error.to_string()),
    }
}

async fn delete_position(State(state): State<BackendIamState>, ctx: WebRequestContext, Path(position_id): Path<String>) -> Response {
    soft_delete(&state, &ctx, "iam_position", &position_id, "iam_position_not_found", "iam_position_delete_failed").await
}

async fn list_position_assignments(State(state): State<BackendIamState>, ctx: WebRequestContext, Query(query): Query<HashMap<String, String>>) -> Response {
    let Ok(pg) = postgres_pool_or_error(&state) else { return postgres_pool_or_error(&state).err().expect("error response"); };
    let Ok(tenant_id) = tenant_id_from_context(&ctx) else { return tenant_id_from_context(&ctx).err().expect("error response"); };
    match sqlx::query("SELECT id, tenant_id, organization_id, department_assignment_id, position_id, user_id, is_primary, effective_from, status FROM iam_position_assignment WHERE tenant_id = $1 AND status = 'active' ORDER BY id LIMIT $2").bind(&tenant_id).bind(page_limit(&query)).fetch_all(pg).await {
        Ok(rows) => appbase_ok(page_json(rows.iter().map(|row| json!({"assignmentId": row.get::<String,_>(0), "departmentAssignmentId": row.get::<String,_>(3), "id": row.get::<String,_>(0), "organizationId": row.get::<String,_>(2), "positionId": row.get::<String,_>(4), "status": row.get::<String,_>(8), "tenantId": row.get::<String,_>(1), "userId": row.get::<String,_>(5)})).collect())),
        Err(error) => appbase_error(StatusCode::INTERNAL_SERVER_ERROR, "iam_position_assignments_list_failed", &error.to_string()),
    }
}

async fn create_position_assignment(State(state): State<BackendIamState>, ctx: WebRequestContext, Json(body): Json<Value>) -> Response {
    let Ok(pg) = postgres_pool_or_error(&state) else { return postgres_pool_or_error(&state).err().expect("error response"); };
    let Ok(tenant_id) = tenant_id_from_context(&ctx) else { return tenant_id_from_context(&ctx).err().expect("error response"); };
    let organization_id = read_string_field(&body, &["organizationId", "organization_id"]).or_else(|| organization_id_from_context(&ctx));
    let department_assignment_id = read_string_field(&body, &["departmentAssignmentId", "department_assignment_id"]);
    let position_id = read_string_field(&body, &["positionId", "position_id"]);
    let user_id = read_string_field(&body, &["userId", "user_id"]);
    if [organization_id.as_deref(), department_assignment_id.as_deref(), position_id.as_deref(), user_id.as_deref()].iter().any(|v| v.is_none_or(|t| t.is_empty())) {
        return appbase_error(StatusCode::BAD_REQUEST, "iam_position_assignment_invalid", "organizationId, departmentAssignmentId, positionId, and userId are required");
    }
    let id = format!("iampa-{}", Uuid::new_v4()); let now = Utc::now().to_rfc3339();
    match sqlx::query("INSERT INTO iam_position_assignment (id, tenant_id, organization_id, department_assignment_id, position_id, user_id, is_primary, effective_from, status, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,$6,0,$7,'active',$7,$7)")
        .bind(&id).bind(&tenant_id).bind(organization_id.as_ref().expect("validated")).bind(department_assignment_id.as_ref().expect("validated")).bind(position_id.as_ref().expect("validated")).bind(user_id.as_ref().expect("validated")).bind(&now).execute(pg).await {
        Ok(_) => appbase_ok(json!({ "assignmentId": id })),
        Err(error) => appbase_error(StatusCode::INTERNAL_SERVER_ERROR, "iam_position_assignment_create_failed", &error.to_string()),
    }
}

async fn update_position_assignment(State(state): State<BackendIamState>, ctx: WebRequestContext, Path(assignment_id): Path<String>, Json(body): Json<Value>) -> Response {
    let Ok(pg) = postgres_pool_or_error(&state) else { return postgres_pool_or_error(&state).err().expect("error response"); };
    let Ok(tenant_id) = tenant_id_from_context(&ctx) else { return tenant_id_from_context(&ctx).err().expect("error response"); };
    let mut assignments = patch_fields(&body); assignments.push(("updated_at".to_owned(), Utc::now().to_rfc3339()));
    match patch_tenant_row(pg, &tenant_id, "iam_position_assignment", &assignment_id, &assignments).await {
        Ok(true) => appbase_ok(json!({ "assignmentId": assignment_id })),
        Ok(false) => appbase_error(StatusCode::NOT_FOUND, "iam_position_assignment_not_found", "assignment not found"),
        Err(error) => appbase_error(StatusCode::INTERNAL_SERVER_ERROR, "iam_position_assignment_update_failed", &error.to_string()),
    }
}

fn tenant_row_to_json(row: &sqlx::postgres::PgRow) -> Value {
    json!({ "code": row.get::<String, _>(1), "id": row.get::<String, _>(0), "name": row.get::<String, _>(2), "status": row.get::<String, _>(3), "tenantId": row.get::<String, _>(0) })
}

async fn list_tenants(State(state): State<BackendIamState>, ctx: WebRequestContext, Query(query): Query<HashMap<String, String>>) -> Response {
    let Ok(pg) = postgres_pool_or_error(&state) else { return postgres_pool_or_error(&state).err().expect("error response"); };
    let Ok(tenant_id) = tenant_id_from_context(&ctx) else { return tenant_id_from_context(&ctx).err().expect("error response"); };
    match sqlx::query("SELECT id, code, name, status, created_at, updated_at FROM iam_tenant WHERE id = $1 LIMIT $2").bind(&tenant_id).bind(page_limit(&query)).fetch_all(pg).await {
        Ok(rows) => appbase_ok(page_json(rows.iter().map(tenant_row_to_json).collect())),
        Err(error) => appbase_error(StatusCode::INTERNAL_SERVER_ERROR, "iam_tenants_list_failed", &error.to_string()),
    }
}

async fn create_tenant(State(state): State<BackendIamState>, ctx: WebRequestContext, Json(body): Json<Value>) -> Response {
    let Ok(pg) = postgres_pool_or_error(&state) else { return postgres_pool_or_error(&state).err().expect("error response"); };
    let code = read_string_field(&body, &["code"]); let name = read_string_field(&body, &["name"]);
    if code.as_deref().unwrap_or("").is_empty() || name.as_deref().unwrap_or("").is_empty() { return appbase_error(StatusCode::BAD_REQUEST, "iam_tenant_invalid", "code and name are required"); }
    let id = format!("iamt-{}", Uuid::new_v4()); let now = Utc::now().to_rfc3339();
    match sqlx::query("INSERT INTO iam_tenant (id, code, name, status, created_at, updated_at) VALUES ($1, $2, $3, 'active', $4, $4)").bind(&id).bind(code.as_ref().expect("validated")).bind(name.as_ref().expect("validated")).bind(&now).execute(pg).await {
        Ok(_) => retrieve_tenant(State(state), ctx, Path(id)).await,
        Err(error) => appbase_error(StatusCode::INTERNAL_SERVER_ERROR, "iam_tenant_create_failed", &error.to_string()),
    }
}

async fn retrieve_tenant(State(state): State<BackendIamState>, _ctx: WebRequestContext, Path(tenant_id): Path<String>) -> Response {
    let Ok(pg) = postgres_pool_or_error(&state) else { return postgres_pool_or_error(&state).err().expect("error response"); };
    match sqlx::query("SELECT id, code, name, status, created_at, updated_at FROM iam_tenant WHERE id = $1 LIMIT 1").bind(&tenant_id).fetch_optional(pg).await {
        Ok(Some(row)) => appbase_ok(tenant_row_to_json(&row)),
        Ok(None) => appbase_error(StatusCode::NOT_FOUND, "iam_tenant_not_found", "tenant not found"),
        Err(error) => appbase_error(StatusCode::INTERNAL_SERVER_ERROR, "iam_tenant_retrieve_failed", &error.to_string()),
    }
}

async fn update_tenant(State(state): State<BackendIamState>, ctx: WebRequestContext, Path(tenant_id): Path<String>, Json(body): Json<Value>) -> Response {
    let Ok(pg) = postgres_pool_or_error(&state) else { return postgres_pool_or_error(&state).err().expect("error response"); };
    let mut assignments = patch_fields(&body); assignments.push(("updated_at".to_owned(), Utc::now().to_rfc3339()));
    if assignments.len() == 1 { return appbase_error(StatusCode::BAD_REQUEST, "iam_tenant_invalid", "no updatable fields provided"); }
    let mut set_clause = String::new();
    for (index, (column, _)) in assignments.iter().enumerate() { if index > 0 { set_clause.push_str(", "); } set_clause.push_str(column); set_clause.push_str(" = $"); set_clause.push_str(&(index + 2).to_string()); }
    let sql = format!("UPDATE iam_tenant SET {set_clause} WHERE id = $1");
    let mut query = sqlx::query(&sql).bind(&tenant_id); for (_, value) in &assignments { query = query.bind(value); }
    match query.execute(pg).await {
        Ok(result) if result.rows_affected() > 0 => retrieve_tenant(State(state), ctx, Path(tenant_id)).await,
        Ok(_) => appbase_error(StatusCode::NOT_FOUND, "iam_tenant_not_found", "tenant not found"),
        Err(error) => appbase_error(StatusCode::INTERNAL_SERVER_ERROR, "iam_tenant_update_failed", &error.to_string()),
    }
}

async fn delete_tenant(State(state): State<BackendIamState>, _ctx: WebRequestContext, Path(tenant_id): Path<String>) -> Response {
    let Ok(pg) = postgres_pool_or_error(&state) else { return postgres_pool_or_error(&state).err().expect("error response"); };
    let now = Utc::now().to_rfc3339();
    match sqlx::query("UPDATE iam_tenant SET status = 'disabled', updated_at = $2 WHERE id = $1 AND status <> 'disabled'").bind(&tenant_id).bind(&now).execute(pg).await {
        Ok(result) if result.rows_affected() > 0 => appbase_ok(json!({ "deleted": true, "tenantId": tenant_id })),
        Ok(_) => appbase_error(StatusCode::NOT_FOUND, "iam_tenant_not_found", "tenant not found"),
        Err(error) => appbase_error(StatusCode::INTERNAL_SERVER_ERROR, "iam_tenant_delete_failed", &error.to_string()),
    }
}

async fn list_tenant_members(State(state): State<BackendIamState>, _ctx: WebRequestContext, Path(tenant_id): Path<String>, Query(query): Query<HashMap<String, String>>) -> Response {
    let Ok(pg) = postgres_pool_or_error(&state) else { return postgres_pool_or_error(&state).err().expect("error response"); };
    match sqlx::query("SELECT id, tenant_id, user_id, member_kind, status, joined_at, created_at, updated_at FROM iam_tenant_member WHERE tenant_id = $1 AND status = 'active' ORDER BY joined_at DESC LIMIT $2").bind(&tenant_id).bind(page_limit(&query)).fetch_all(pg).await {
        Ok(rows) => appbase_ok(page_json(rows.iter().map(|row| json!({"id": row.get::<String,_>(0), "memberKind": row.get::<String,_>(3), "status": row.get::<String,_>(4), "tenantId": row.get::<String,_>(1), "userId": row.get::<String,_>(2)})).collect())),
        Err(error) => appbase_error(StatusCode::INTERNAL_SERVER_ERROR, "iam_tenant_members_list_failed", &error.to_string()),
    }
}

async fn create_tenant_member(State(state): State<BackendIamState>, _ctx: WebRequestContext, Path(tenant_id): Path<String>, Json(body): Json<Value>) -> Response {
    let Ok(pg) = postgres_pool_or_error(&state) else { return postgres_pool_or_error(&state).err().expect("error response"); };
    let user_id = read_string_field(&body, &["userId", "user_id"]);
    if user_id.as_deref().unwrap_or("").is_empty() { return appbase_error(StatusCode::BAD_REQUEST, "iam_tenant_member_invalid", "userId is required"); }
    let id = format!("iamtm-{}", Uuid::new_v4()); let now = Utc::now().to_rfc3339();
    match sqlx::query("INSERT INTO iam_tenant_member (id, tenant_id, user_id, member_kind, status, joined_at, created_at, updated_at) VALUES ($1,$2,$3,$4,'active',$5,$5,$5)")
        .bind(&id).bind(&tenant_id).bind(user_id.as_ref().expect("validated")).bind(read_string_field(&body, &["memberKind", "member_kind"]).unwrap_or_else(|| "member".to_owned())).bind(&now).execute(pg).await {
        Ok(_) => appbase_ok(json!({ "id": id, "tenantId": tenant_id, "userId": user_id })),
        Err(error) => appbase_error(StatusCode::INTERNAL_SERVER_ERROR, "iam_tenant_member_create_failed", &error.to_string()),
    }
}

async fn update_tenant_member(State(state): State<BackendIamState>, _ctx: WebRequestContext, Path((tenant_id, user_id)): Path<(String, String)>, Json(body): Json<Value>) -> Response {
    let Ok(pg) = postgres_pool_or_error(&state) else { return postgres_pool_or_error(&state).err().expect("error response"); };
    let mut assignments = patch_fields(&body); assignments.push(("updated_at".to_owned(), Utc::now().to_rfc3339()));
    let mut set_clause = String::new();
    for (index, (column, _)) in assignments.iter().enumerate() { if index > 0 { set_clause.push_str(", "); } set_clause.push_str(column); set_clause.push_str(" = $"); set_clause.push_str(&(index + 3).to_string()); }
    let sql = format!("UPDATE iam_tenant_member SET {set_clause} WHERE tenant_id = $1 AND user_id = $2");
    let mut query = sqlx::query(&sql).bind(&tenant_id).bind(&user_id); for (_, value) in &assignments { query = query.bind(value); }
    match query.execute(pg).await {
        Ok(result) if result.rows_affected() > 0 => appbase_ok(json!({ "tenantId": tenant_id, "userId": user_id })),
        Ok(_) => appbase_error(StatusCode::NOT_FOUND, "iam_tenant_member_not_found", "tenant member not found"),
        Err(error) => appbase_error(StatusCode::INTERNAL_SERVER_ERROR, "iam_tenant_member_update_failed", &error.to_string()),
    }
}

async fn delete_tenant_member(State(state): State<BackendIamState>, _ctx: WebRequestContext, Path((tenant_id, user_id)): Path<(String, String)>) -> Response {
    let Ok(pg) = postgres_pool_or_error(&state) else { return postgres_pool_or_error(&state).err().expect("error response"); };
    let now = Utc::now().to_rfc3339();
    match sqlx::query("UPDATE iam_tenant_member SET status = 'disabled', updated_at = $3 WHERE tenant_id = $1 AND user_id = $2 AND status <> 'disabled'").bind(&tenant_id).bind(&user_id).bind(&now).execute(pg).await {
        Ok(result) if result.rows_affected() > 0 => appbase_ok(json!({ "deleted": true, "tenantId": tenant_id, "userId": user_id })),
        Ok(_) => appbase_error(StatusCode::NOT_FOUND, "iam_tenant_member_not_found", "tenant member not found"),
        Err(error) => appbase_error(StatusCode::INTERNAL_SERVER_ERROR, "iam_tenant_member_delete_failed", &error.to_string()),
    }
}

async fn revoke_api_key(State(state): State<BackendIamState>, ctx: WebRequestContext, Path(api_key_id): Path<String>) -> Response {
    let Ok(pg) = postgres_pool_or_error(&state) else { return postgres_pool_or_error(&state).err().expect("error response"); };
    let Ok(tenant_id) = tenant_id_from_context(&ctx) else { return tenant_id_from_context(&ctx).err().expect("error response"); };
    let now = Utc::now().to_rfc3339();
    match sqlx::query("UPDATE iam_api_key SET status = 'revoked', updated_at = $3 WHERE tenant_id = $1 AND id = $2 AND status <> 'revoked'").bind(&tenant_id).bind(&api_key_id).bind(&now).execute(pg).await {
        Ok(result) if result.rows_affected() > 0 => appbase_ok(json!({ "apiKeyId": api_key_id, "status": "revoked" })),
        Ok(_) => appbase_error(StatusCode::NOT_FOUND, "iam_api_key_not_found", "api key not found"),
        Err(error) => appbase_error(StatusCode::INTERNAL_SERVER_ERROR, "iam_api_key_revoke_failed", &error.to_string()),
    }
}

const GROUP_MEMBER_PRINCIPAL_KINDS: &[&str] =
    &["user", "service_account", "organization_membership"];

async fn fetch_group_row<'e>(
    pg: &'e PgPool,
    tenant_id: &str,
    group_ref: &str,
) -> Result<Option<sqlx::postgres::PgRow>, sqlx::Error> {
    sqlx::query(
        "SELECT id, tenant_id, organization_id, code, name, group_kind, status \
         FROM iam_group \
         WHERE tenant_id = $1 AND (id = $2 OR code = $2) AND status <> 'disabled' \
         LIMIT 1",
    )
    .bind(tenant_id)
    .bind(group_ref)
    .fetch_optional(pg)
    .await
}

async fn resolve_group_id(pg: &PgPool, tenant_id: &str, group_ref: &str) -> Option<String> {
    fetch_group_row(pg, tenant_id, group_ref)
        .await
        .ok()
        .flatten()
        .map(|row| row.get::<String, _>(0))
}

async fn fetch_service_account_row<'e>(
    pg: &'e PgPool,
    tenant_id: &str,
    service_account_ref: &str,
) -> Result<Option<sqlx::postgres::PgRow>, sqlx::Error> {
    sqlx::query(
        "SELECT id, tenant_id, organization_id, code, name, status, credential_kind \
         FROM iam_service_account \
         WHERE tenant_id = $1 AND (id = $2 OR code = $2) AND status <> 'disabled' \
         LIMIT 1",
    )
    .bind(tenant_id)
    .bind(service_account_ref)
    .fetch_optional(pg)
    .await
}

fn group_member_principal_kind_allowed(kind: &str) -> bool {
    GROUP_MEMBER_PRINCIPAL_KINDS.contains(&kind)
}

async fn list_groups(
    State(state): State<BackendIamState>,
    ctx: WebRequestContext,
    Query(query): Query<HashMap<String, String>>,
) -> Response {
    let Ok(pg) = postgres_pool_or_error(&state) else {
        return postgres_pool_or_error(&state).err().expect("error response");
    };
    let Ok(tenant_id) = tenant_id_from_context(&ctx) else {
        return tenant_id_from_context(&ctx).err().expect("error response");
    };
    let limit = page_limit(&query);
    match sqlx::query(
        "SELECT id, tenant_id, organization_id, code, name, group_kind, status \
         FROM iam_group \
         WHERE tenant_id = $1 AND status <> 'disabled' \
         ORDER BY code, id \
         LIMIT $2",
    )
    .bind(&tenant_id)
    .bind(limit)
    .fetch_all(pg)
    .await
    {
        Ok(rows) => appbase_ok(page_json(
            rows.iter().map(group_row_to_json).collect::<Vec<_>>(),
        )),
        Err(error) => appbase_error(
            StatusCode::INTERNAL_SERVER_ERROR,
            "iam_groups_list_failed",
            &error.to_string(),
        ),
    }
}

async fn create_group(
    State(state): State<BackendIamState>,
    ctx: WebRequestContext,
    Json(body): Json<Value>,
) -> Response {
    let Ok(pg) = postgres_pool_or_error(&state) else {
        return postgres_pool_or_error(&state).err().expect("error response");
    };
    let Ok(tenant_id) = tenant_id_from_context(&ctx) else {
        return tenant_id_from_context(&ctx).err().expect("error response");
    };
    let code = read_string_field(&body, &["code"]);
    let name = read_string_field(&body, &["name"]);
    if code.as_deref().unwrap_or("").is_empty() || name.as_deref().unwrap_or("").is_empty() {
        return appbase_error(
            StatusCode::BAD_REQUEST,
            "iam_group_invalid",
            "code and name are required",
        );
    }
    let organization_id = read_string_field(&body, &["organizationId", "organization_id"])
        .or_else(|| crate::handlers::organization_id_from_context(&ctx));
    let group_kind = read_string_field(&body, &["groupKind", "group_kind"])
        .unwrap_or_else(|| "general".to_owned());
    let id = format!("iamgrp-{}", Uuid::new_v4());
    let now = Utc::now().to_rfc3339();
    match sqlx::query(
        "INSERT INTO iam_group \
         (id, tenant_id, organization_id, code, name, group_kind, status, created_at, updated_at) \
         VALUES ($1, $2, $3, $4, $5, $6, 'active', $7, $7)",
    )
    .bind(&id)
    .bind(&tenant_id)
    .bind(&organization_id)
    .bind(code.as_ref().expect("validated"))
    .bind(name.as_ref().expect("validated"))
    .bind(&group_kind)
    .bind(&now)
    .execute(pg)
    .await
    {
        Ok(_) => match fetch_group_row(pg, &tenant_id, &id).await {
            Ok(Some(row)) => appbase_ok(group_row_to_json(&row)),
            _ => appbase_error(
                StatusCode::INTERNAL_SERVER_ERROR,
                "iam_group_create_failed",
                "group created but could not be loaded",
            ),
        },
        Err(error) => appbase_error(
            StatusCode::INTERNAL_SERVER_ERROR,
            "iam_group_create_failed",
            &error.to_string(),
        ),
    }
}

async fn retrieve_group(
    State(state): State<BackendIamState>,
    ctx: WebRequestContext,
    Path(group_id): Path<String>,
) -> Response {
    let Ok(pg) = postgres_pool_or_error(&state) else {
        return postgres_pool_or_error(&state).err().expect("error response");
    };
    let Ok(tenant_id) = tenant_id_from_context(&ctx) else {
        return tenant_id_from_context(&ctx).err().expect("error response");
    };
    match fetch_group_row(pg, &tenant_id, &group_id).await {
        Ok(Some(row)) => appbase_ok(group_row_to_json(&row)),
        Ok(None) => appbase_error(StatusCode::NOT_FOUND, "iam_group_not_found", "group not found"),
        Err(error) => appbase_error(
            StatusCode::INTERNAL_SERVER_ERROR,
            "iam_group_retrieve_failed",
            &error.to_string(),
        ),
    }
}

async fn update_group(
    State(state): State<BackendIamState>,
    ctx: WebRequestContext,
    Path(group_id): Path<String>,
    Json(body): Json<Value>,
) -> Response {
    let Ok(pg) = postgres_pool_or_error(&state) else {
        return postgres_pool_or_error(&state).err().expect("error response");
    };
    let Ok(tenant_id) = tenant_id_from_context(&ctx) else {
        return tenant_id_from_context(&ctx).err().expect("error response");
    };
    let group_id = resolve_group_id(pg, &tenant_id, &group_id)
        .await
        .unwrap_or(group_id);
    let mut assignments = patch_fields(&body);
    assignments.push(("updated_at".to_owned(), Utc::now().to_rfc3339()));
    match patch_tenant_row(pg, &tenant_id, "iam_group", &group_id, &assignments).await {
        Ok(true) => retrieve_group(State(state), ctx, Path(group_id)).await,
        Ok(false) => appbase_error(StatusCode::NOT_FOUND, "iam_group_not_found", "group not found"),
        Err(error) => appbase_error(
            StatusCode::INTERNAL_SERVER_ERROR,
            "iam_group_update_failed",
            &error.to_string(),
        ),
    }
}

async fn delete_group(
    State(state): State<BackendIamState>,
    ctx: WebRequestContext,
    Path(group_id): Path<String>,
) -> Response {
    let Ok(pg) = postgres_pool_or_error(&state) else {
        return postgres_pool_or_error(&state).err().expect("error response");
    };
    let Ok(tenant_id) = tenant_id_from_context(&ctx) else {
        return tenant_id_from_context(&ctx).err().expect("error response");
    };
    let group_id = resolve_group_id(pg, &tenant_id, &group_id)
        .await
        .unwrap_or(group_id);
    soft_delete(
        &state,
        &ctx,
        "iam_group",
        &group_id,
        "iam_group_not_found",
        "iam_group_delete_failed",
    )
    .await
}

async fn list_group_members(
    State(state): State<BackendIamState>,
    ctx: WebRequestContext,
    Path(group_id): Path<String>,
    Query(query): Query<HashMap<String, String>>,
) -> Response {
    let Ok(pg) = postgres_pool_or_error(&state) else {
        return postgres_pool_or_error(&state).err().expect("error response");
    };
    let Ok(tenant_id) = tenant_id_from_context(&ctx) else {
        return tenant_id_from_context(&ctx).err().expect("error response");
    };
    let Some(group_id) = resolve_group_id(pg, &tenant_id, &group_id).await else {
        return appbase_error(StatusCode::NOT_FOUND, "iam_group_not_found", "group not found");
    };
    let limit = page_limit(&query);
    match sqlx::query(
        "SELECT id, tenant_id, group_id, principal_kind, principal_id, joined_at, status \
         FROM iam_group_member \
         WHERE tenant_id = $1 AND group_id = $2 AND status <> 'disabled' \
         ORDER BY joined_at, id \
         LIMIT $3",
    )
    .bind(&tenant_id)
    .bind(&group_id)
    .bind(limit)
    .fetch_all(pg)
    .await
    {
        Ok(rows) => appbase_ok(page_json(
            rows.iter().map(group_member_row_to_json).collect::<Vec<_>>(),
        )),
        Err(error) => appbase_error(
            StatusCode::INTERNAL_SERVER_ERROR,
            "iam_group_members_list_failed",
            &error.to_string(),
        ),
    }
}

async fn create_group_member(
    State(state): State<BackendIamState>,
    ctx: WebRequestContext,
    Path(group_id): Path<String>,
    Json(body): Json<Value>,
) -> Response {
    let Ok(pg) = postgres_pool_or_error(&state) else {
        return postgres_pool_or_error(&state).err().expect("error response");
    };
    let Ok(tenant_id) = tenant_id_from_context(&ctx) else {
        return tenant_id_from_context(&ctx).err().expect("error response");
    };
    let Some(group_id) = resolve_group_id(pg, &tenant_id, &group_id).await else {
        return appbase_error(StatusCode::NOT_FOUND, "iam_group_not_found", "group not found");
    };
    let principal_kind =
        read_string_field(&body, &["principalKind", "principal_kind"]).unwrap_or_default();
    let principal_id =
        read_string_field(&body, &["principalId", "principal_id"]).unwrap_or_default();
    if principal_kind.is_empty() || principal_id.is_empty() {
        return appbase_error(
            StatusCode::BAD_REQUEST,
            "iam_group_member_invalid",
            "principalKind and principalId are required",
        );
    }
    if !group_member_principal_kind_allowed(&principal_kind) {
        return appbase_error(
            StatusCode::BAD_REQUEST,
            "iam_group_member_invalid",
            "principalKind must be user, service_account, or organization_membership",
        );
    }
    let id = format!("iamgrpm-{}", Uuid::new_v4());
    let now = Utc::now().to_rfc3339();
    match sqlx::query(
        "INSERT INTO iam_group_member \
         (id, tenant_id, group_id, principal_kind, principal_id, status, joined_at, created_at, updated_at) \
         VALUES ($1, $2, $3, $4, $5, 'active', $6, $6, $6) \
         ON CONFLICT (tenant_id, group_id, principal_kind, principal_id) DO UPDATE SET \
           status = 'active', updated_at = excluded.updated_at",
    )
    .bind(&id)
    .bind(&tenant_id)
    .bind(&group_id)
    .bind(&principal_kind)
    .bind(&principal_id)
    .bind(&now)
    .execute(pg)
    .await
    {
        Ok(_) => match sqlx::query(
            "SELECT id, tenant_id, group_id, principal_kind, principal_id, joined_at, status \
             FROM iam_group_member \
             WHERE tenant_id = $1 AND group_id = $2 AND principal_kind = $3 AND principal_id = $4 \
             LIMIT 1",
        )
        .bind(&tenant_id)
        .bind(&group_id)
        .bind(&principal_kind)
        .bind(&principal_id)
        .fetch_optional(pg)
        .await
        {
            Ok(Some(row)) => appbase_ok(group_member_row_to_json(&row)),
            _ => appbase_error(
                StatusCode::INTERNAL_SERVER_ERROR,
                "iam_group_member_create_failed",
                "member created but could not be loaded",
            ),
        },
        Err(error) => appbase_error(
            StatusCode::INTERNAL_SERVER_ERROR,
            "iam_group_member_create_failed",
            &error.to_string(),
        ),
    }
}

async fn delete_group_member(
    State(state): State<BackendIamState>,
    ctx: WebRequestContext,
    Path((group_id, member_id)): Path<(String, String)>,
) -> Response {
    let Ok(pg) = postgres_pool_or_error(&state) else {
        return postgres_pool_or_error(&state).err().expect("error response");
    };
    let Ok(tenant_id) = tenant_id_from_context(&ctx) else {
        return tenant_id_from_context(&ctx).err().expect("error response");
    };
    let Some(group_id) = resolve_group_id(pg, &tenant_id, &group_id).await else {
        return appbase_error(StatusCode::NOT_FOUND, "iam_group_not_found", "group not found");
    };
    let now = Utc::now().to_rfc3339();
    match sqlx::query(
        "UPDATE iam_group_member SET status = 'disabled', updated_at = $4 \
         WHERE tenant_id = $1 AND group_id = $2 AND id = $3 AND status <> 'disabled'",
    )
    .bind(&tenant_id)
    .bind(&group_id)
    .bind(&member_id)
    .bind(&now)
    .execute(pg)
    .await
    {
        Ok(result) if result.rows_affected() > 0 => {
            appbase_ok(json!({ "deleted": true, "memberId": member_id }))
        }
        Ok(_) => appbase_error(
            StatusCode::NOT_FOUND,
            "iam_group_member_not_found",
            "group member not found",
        ),
        Err(error) => appbase_error(
            StatusCode::INTERNAL_SERVER_ERROR,
            "iam_group_member_delete_failed",
            &error.to_string(),
        ),
    }
}

async fn list_service_accounts(
    State(state): State<BackendIamState>,
    ctx: WebRequestContext,
    Query(query): Query<HashMap<String, String>>,
) -> Response {
    let Ok(pg) = postgres_pool_or_error(&state) else {
        return postgres_pool_or_error(&state).err().expect("error response");
    };
    let Ok(tenant_id) = tenant_id_from_context(&ctx) else {
        return tenant_id_from_context(&ctx).err().expect("error response");
    };
    let limit = page_limit(&query);
    match sqlx::query(
        "SELECT id, tenant_id, organization_id, code, name, status, credential_kind \
         FROM iam_service_account \
         WHERE tenant_id = $1 AND status <> 'disabled' \
         ORDER BY code, id \
         LIMIT $2",
    )
    .bind(&tenant_id)
    .bind(limit)
    .fetch_all(pg)
    .await
    {
        Ok(rows) => appbase_ok(page_json(
            rows.iter()
                .map(service_account_row_to_json)
                .collect::<Vec<_>>(),
        )),
        Err(error) => appbase_error(
            StatusCode::INTERNAL_SERVER_ERROR,
            "iam_service_accounts_list_failed",
            &error.to_string(),
        ),
    }
}

async fn create_service_account(
    State(state): State<BackendIamState>,
    ctx: WebRequestContext,
    Json(body): Json<Value>,
) -> Response {
    let Ok(pg) = postgres_pool_or_error(&state) else {
        return postgres_pool_or_error(&state).err().expect("error response");
    };
    let Ok(tenant_id) = tenant_id_from_context(&ctx) else {
        return tenant_id_from_context(&ctx).err().expect("error response");
    };
    let code = read_string_field(&body, &["code"]);
    let name = read_string_field(&body, &["name"]);
    if code.as_deref().unwrap_or("").is_empty() || name.as_deref().unwrap_or("").is_empty() {
        return appbase_error(
            StatusCode::BAD_REQUEST,
            "iam_service_account_invalid",
            "code and name are required",
        );
    }
    let organization_id = read_string_field(&body, &["organizationId", "organization_id"])
        .or_else(|| crate::handlers::organization_id_from_context(&ctx));
    let credential_kind = read_string_field(&body, &["credentialKind", "credential_kind"])
        .unwrap_or_else(|| "api_key".to_owned());
    let id = format!("iamsa-{}", Uuid::new_v4());
    let now = Utc::now().to_rfc3339();
    match sqlx::query(
        "INSERT INTO iam_service_account \
         (id, tenant_id, organization_id, code, name, status, credential_kind, created_at, updated_at) \
         VALUES ($1, $2, $3, $4, $5, 'active', $6, $7, $7)",
    )
    .bind(&id)
    .bind(&tenant_id)
    .bind(&organization_id)
    .bind(code.as_ref().expect("validated"))
    .bind(name.as_ref().expect("validated"))
    .bind(&credential_kind)
    .bind(&now)
    .execute(pg)
    .await
    {
        Ok(_) => match fetch_service_account_row(pg, &tenant_id, &id).await {
            Ok(Some(row)) => appbase_ok(service_account_row_to_json(&row)),
            _ => appbase_error(
                StatusCode::INTERNAL_SERVER_ERROR,
                "iam_service_account_create_failed",
                "service account created but could not be loaded",
            ),
        },
        Err(error) => appbase_error(
            StatusCode::INTERNAL_SERVER_ERROR,
            "iam_service_account_create_failed",
            &error.to_string(),
        ),
    }
}

async fn retrieve_service_account(
    State(state): State<BackendIamState>,
    ctx: WebRequestContext,
    Path(service_account_id): Path<String>,
) -> Response {
    let Ok(pg) = postgres_pool_or_error(&state) else {
        return postgres_pool_or_error(&state).err().expect("error response");
    };
    let Ok(tenant_id) = tenant_id_from_context(&ctx) else {
        return tenant_id_from_context(&ctx).err().expect("error response");
    };
    match fetch_service_account_row(pg, &tenant_id, &service_account_id).await {
        Ok(Some(row)) => appbase_ok(service_account_row_to_json(&row)),
        Ok(None) => appbase_error(
            StatusCode::NOT_FOUND,
            "iam_service_account_not_found",
            "service account not found",
        ),
        Err(error) => appbase_error(
            StatusCode::INTERNAL_SERVER_ERROR,
            "iam_service_account_retrieve_failed",
            &error.to_string(),
        ),
    }
}

async fn update_service_account(
    State(state): State<BackendIamState>,
    ctx: WebRequestContext,
    Path(service_account_id): Path<String>,
    Json(body): Json<Value>,
) -> Response {
    let Ok(pg) = postgres_pool_or_error(&state) else {
        return postgres_pool_or_error(&state).err().expect("error response");
    };
    let Ok(tenant_id) = tenant_id_from_context(&ctx) else {
        return tenant_id_from_context(&ctx).err().expect("error response");
    };
    let service_account_id = fetch_service_account_row(pg, &tenant_id, &service_account_id)
        .await
        .ok()
        .flatten()
        .map(|row| row.get::<String, _>(0))
        .unwrap_or(service_account_id);
    let mut assignments = patch_fields(&body);
    assignments.push(("updated_at".to_owned(), Utc::now().to_rfc3339()));
    match patch_tenant_row(
        pg,
        &tenant_id,
        "iam_service_account",
        &service_account_id,
        &assignments,
    )
    .await
    {
        Ok(true) => retrieve_service_account(State(state), ctx, Path(service_account_id)).await,
        Ok(false) => appbase_error(
            StatusCode::NOT_FOUND,
            "iam_service_account_not_found",
            "service account not found",
        ),
        Err(error) => appbase_error(
            StatusCode::INTERNAL_SERVER_ERROR,
            "iam_service_account_update_failed",
            &error.to_string(),
        ),
    }
}

async fn delete_service_account(
    State(state): State<BackendIamState>,
    ctx: WebRequestContext,
    Path(service_account_id): Path<String>,
) -> Response {
    let Ok(pg) = postgres_pool_or_error(&state) else {
        return postgres_pool_or_error(&state).err().expect("error response");
    };
    let Ok(tenant_id) = tenant_id_from_context(&ctx) else {
        return tenant_id_from_context(&ctx).err().expect("error response");
    };
    let service_account_id = fetch_service_account_row(pg, &tenant_id, &service_account_id)
        .await
        .ok()
        .flatten()
        .map(|row| row.get::<String, _>(0))
        .unwrap_or(service_account_id);
    soft_delete(
        &state,
        &ctx,
        "iam_service_account",
        &service_account_id,
        "iam_service_account_not_found",
        "iam_service_account_delete_failed",
    )
    .await
}
