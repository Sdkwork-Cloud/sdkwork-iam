fn oauth_list_search_columns(table: &str) -> &'static [&'static str] {
    match table {
        "iam_oauth_integration" => &["provider_code", "integration_code", "display_name"],
        "iam_oauth_client" => &["provider_code", "client_code", "display_name"],
        "iam_oauth_secret" => &["secret_code", "display_name"],
        "iam_oauth_surface" => &["surface_code", "display_name"],
        "iam_oauth_account_link" => &["provider_code", "integration_id"],
        "iam_oauth_grant" => &["provider_code", "integration_id"],
        "iam_oauth_callback_event" => &["provider_code", "integration_id", "event_kind"],
        "iam_oauth_diagnostic_run" => &["provider_code", "integration_id", "run_kind"],
        _ if table.starts_with("iam_oauth_") => &["provider_code"],
        _ => &[],
    }
}

async fn tenant_list(
    state: &BackendIamState,
    ctx: &WebRequestContext,
    query: &HashMap<String, String>,
    spec: &TenantResourceSpec,
) -> Response {
    let Ok(pg) = postgres_pool_or_error(state) else {
        return postgres_pool_or_error(state).err().expect("error response");
    };
    let Ok(tenant_id) = tenant_id_from_context(ctx) else {
        return tenant_id_from_context(ctx).err().expect("error response");
    };

    let Ok(params) = list_page_params_or_error(query) else {
        return list_page_params_or_error(query)
            .err()
            .expect("error response");
    };
    let search_pattern = list_search_pattern(query);
    let search_columns = oauth_list_search_columns(spec.table);
    match list_tenant_rows(
        pg,
        &tenant_id,
        spec.table,
        spec.list_select,
        spec.list_order,
        &params,
        search_pattern,
        search_columns,
    )
    .await
    {
        Ok(rows) => appbase_ok(page_json_from_rows(rows, &params, |row| {
            row_to_json_with_aliases(row, spec.columns, spec.id_aliases)
        })),
        Err(error) => appbase_error(
            StatusCode::INTERNAL_SERVER_ERROR,
            spec.list_error,
            &error.to_string(),
        ),
    }
}

async fn oauth_create_response(
    state: &BackendIamState,
    ctx: &WebRequestContext,
    id: &str,
    spec: &TenantResourceSpec,
) -> Response {
    tenant_retrieve(state, ctx, id, spec).await
}

async fn oauth_commit_create<F>(
    state: &BackendIamState,
    ctx: &WebRequestContext,
    pg: &PgPool,
    id: &str,
    spec: &TenantResourceSpec,
    detail: Value,
    insert: F,
) -> Response
where
    F: for<'a> FnOnce(
        &'a mut sqlx::Transaction<'_, sqlx::Postgres>,
    ) -> std::pin::Pin<
        Box<dyn std::future::Future<Output = Result<(), sqlx::Error>> + Send + 'a>,
    >,
{
    match directory_create_with_audit(pg, ctx, spec.table, id.to_string(), detail, insert).await {
        Ok(_) => oauth_create_response(state, ctx, id, spec).await,
        Err(error) => internal_handler_error(spec.list_error, error),
    }
}

async fn tenant_retrieve(
    state: &BackendIamState,
    ctx: &WebRequestContext,
    id: &str,
    spec: &TenantResourceSpec,
) -> Response {
    let Ok(pg) = postgres_pool_or_error(state) else {
        return postgres_pool_or_error(state).err().expect("error response");
    };
    let Ok(tenant_id) = tenant_id_from_context(ctx) else {
        return tenant_id_from_context(ctx).err().expect("error response");
    };

    match retrieve_tenant_row(pg, &tenant_id, spec.table, spec.list_select, id).await {
        Ok(Some(row)) => appbase_ok(row_to_json_with_aliases(
            &row,
            spec.columns,
            spec.id_aliases,
        )),
        Ok(None) => appbase_error(
            StatusCode::NOT_FOUND,
            spec.retrieve_error,
            "resource not found",
        ),
        Err(error) => appbase_error(
            StatusCode::INTERNAL_SERVER_ERROR,
            spec.retrieve_error,
            &error.to_string(),
        ),
    }
}

async fn tenant_delete(
    state: &BackendIamState,
    ctx: &WebRequestContext,
    id: &str,
    table: &str,
    error_code: &str,
) -> Response {
    let Ok(pg) = postgres_pool_or_error(state) else {
        return postgres_pool_or_error(state).err().expect("error response");
    };
    let Ok(tenant_id) = tenant_id_from_context(ctx) else {
        return tenant_id_from_context(ctx).err().expect("error response");
    };

    let table_owned = table.to_owned();
    let id_owned = id.to_owned();
    match execute_conditional_mutation_with_audit(
        pg,
        &ctx,
        &format!("{table}.delete"),
        table,
        id_owned.clone(),
        json!({ "deleted": true }),
        |tx| {
            Box::pin(async move {
                let sql = format!("DELETE FROM {table_owned} WHERE tenant_id = $1 AND id = $2");
                sqlx::query(&sql)
                    .bind(&tenant_id)
                    .bind(&id_owned)
                    .execute(&mut **tx)
                    .await
                    .map(|result| result.rows_affected())
            })
        },
        |rows_affected| *rows_affected > 0,
    )
    .await
    {
        Ok(rows_affected) if rows_affected > 0 => StatusCode::NO_CONTENT.into_response(),
        Ok(_) => appbase_error(StatusCode::NOT_FOUND, error_code, "resource not found"),
        Err(error) => appbase_error(StatusCode::INTERNAL_SERVER_ERROR, error_code, &error),
    }
}

async fn tenant_patch(
    state: &BackendIamState,
    ctx: &WebRequestContext,
    id: &str,
    body: &Value,
    spec: &TenantResourceSpec,
) -> Response {
    let Ok(pg) = postgres_pool_or_error(state) else {
        return postgres_pool_or_error(state).err().expect("error response");
    };
    let Ok(tenant_id) = tenant_id_from_context(ctx) else {
        return tenant_id_from_context(ctx).err().expect("error response");
    };

    let now = Utc::now().to_rfc3339();
    let mut assignments = collect_patch_assignments(body);
    assignments.push(("updated_at".to_owned(), now));

    let audit_detail = json!({
        "updatedFields": assignments
            .iter()
            .map(|(column, _)| column.as_str())
            .filter(|column| *column != "updated_at")
            .collect::<Vec<_>>()
    });
    let table = spec.table.to_owned();
    let action = format!("{table}.update");
    let id_owned = id.to_owned();
    let tenant_id_owned = tenant_id.clone();

    let table_name = table.clone();
    match execute_conditional_mutation_with_audit(
        pg,
        ctx,
        &action,
        spec.table,
        id_owned.clone(),
        audit_detail,
        |tx| {
            Box::pin(async move {
                let tenant_id = tenant_id_owned.clone();
                let table = table_name.clone();
                let id = id_owned.clone();
                let assignments = assignments.clone();

                patch_tenant_row_tx(&mut **tx, &tenant_id, &table, &id, &assignments)
                    .await
                    .map(|updated| if updated { 1_u64 } else { 0_u64 })
            })
        },
        |rows_affected| *rows_affected > 0,
    )
    .await
    {
        Ok(rows_affected) if rows_affected > 0 => tenant_retrieve(state, ctx, id, spec).await,
        Ok(_) => appbase_error(
            StatusCode::NOT_FOUND,
            spec.retrieve_error,
            "resource not found",
        ),
        Err(error) => appbase_error(
            StatusCode::INTERNAL_SERVER_ERROR,
            spec.retrieve_error,
            &error,
        ),
    }
}

fn collect_patch_assignments(body: &Value) -> Vec<(String, String)> {
    let mut assignments = Vec::new();
    for (column, keys) in [
        ("display_name", ["displayName", "display_name"].as_slice()),
        ("status", ["status"].as_slice()),
        ("enabled", ["enabled"].as_slice()),
        (
            "health_status",
            ["healthStatus", "health_status"].as_slice(),
        ),
        (
            "authorization_status",
            ["authorizationStatus", "authorization_status"].as_slice(),
        ),
        (
            "verification_status",
            ["verificationStatus", "verification_status"].as_slice(),
        ),
    ] {
        if let Some(value) = read_string_field(body, keys) {
            assignments.push((column.to_owned(), value));
        } else if let Some(value) = read_i32_field(body, keys) {
            assignments.push((column.to_owned(), value.to_string()));
        }
    }
    assignments
}

async fn list_provider_catalog(
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
        "SELECT id, owner_tenant_id, provider_code, provider_name, provider_display_name, status, created_at, updated_at, \
                COUNT(*) OVER() AS {LIST_TOTAL_COLUMN} \
         FROM iam_oauth_provider_catalog \
         WHERE (owner_tenant_id = $1 OR owner_tenant_id = '0') \
           AND ($4::text IS NULL OR LOWER(provider_code) LIKE $4 OR LOWER(provider_name) LIKE $4 \
                OR LOWER(provider_display_name) LIKE $4) \
         ORDER BY sort_order, provider_code \
         LIMIT $2 OFFSET $3"
    ))
    .bind(&tenant_id)
    .bind(params.page_size)
    .bind(params.offset)
    .bind(&search_pattern)
    .fetch_all(pg)
    .await;

    match rows {
        Ok(rows) => appbase_ok(page_json_from_rows(rows, &params, |row| {
            row_to_json_with_aliases(
                row,
                &[
                    "id",
                    "owner_tenant_id",
                    "provider_code",
                    "provider_name",
                    "provider_display_name",
                    "status",
                    "created_at",
                    "updated_at",
                ],
                &[("providerCatalogId", "id")],
            )
        })),
        Err(error) => internal_handler_error("iam_oauth_provider_catalog_list_failed", error),
    }
}

async fn retrieve_provider_catalog(
    State(state): State<BackendIamState>,
    ctx: WebRequestContext,
    Path(provider_code): Path<String>,
) -> Response {
    let Ok(pg) = postgres_pool_or_error(&state) else {
        return postgres_pool_or_error(&state)
            .err()
            .expect("error response");
    };
    let Ok(tenant_id) = tenant_id_from_context(&ctx) else {
        return tenant_id_from_context(&ctx).err().expect("error response");
    };

    let row = sqlx::query(
        "SELECT id, owner_tenant_id, provider_code, provider_name, provider_display_name, status, created_at, updated_at \
         FROM iam_oauth_provider_catalog \
         WHERE (owner_tenant_id = $1 OR owner_tenant_id = '0') \
           AND (id = $2 OR provider_code = $2) \
         LIMIT 1",
    )
    .bind(&tenant_id)
    .bind(&provider_code)
    .fetch_optional(pg)
    .await;

    match row {
        Ok(Some(row)) => appbase_ok(row_to_json_with_aliases(
            &row,
            &[
                "id",
                "owner_tenant_id",
                "provider_code",
                "provider_name",
                "provider_display_name",
                "status",
                "created_at",
                "updated_at",
            ],
            &[
                ("providerCatalogId", "id"),
                ("providerCode", "provider_code"),
            ],
        )),
        Ok(None) => appbase_error(
            StatusCode::NOT_FOUND,
            "iam_oauth_provider_catalog_not_found",
            "provider catalog entry not found",
        ),
        Err(error) => internal_handler_error("iam_oauth_provider_catalog_retrieve_failed", error),
    }
}

async fn create_provider_catalog(
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

    let provider_code = read_string_field(&body, &["providerCode", "provider_code"]);
    let provider_name = read_string_field(&body, &["providerName", "provider_name"]);
    let display_name = read_string_field(&body, &["providerDisplayName", "provider_display_name"])
        .or(provider_name.clone());
    if provider_code.as_deref().unwrap_or("").is_empty()
        || provider_name.as_deref().unwrap_or("").is_empty()
    {
        return appbase_error(
            StatusCode::BAD_REQUEST,
            "iam_oauth_provider_catalog_invalid",
            "providerCode and providerName are required",
        );
    }

    let id = format!("iamopc-{}", Uuid::new_v4());
    let now = Utc::now().to_rfc3339();
    let provider_code = provider_code.expect("validated");
    let provider_name = provider_name.expect("validated");
    let display_name = display_name.unwrap_or_else(|| provider_name.clone());

    let id_insert = id.clone();
    let uuid_insert = Uuid::new_v4().to_string();
    let tenant_id_insert = tenant_id.clone();
    let provider_code_insert = provider_code.clone();
    let provider_name_insert = provider_name.clone();
    let display_name_insert = display_name.clone();
    let result = directory_create_with_audit(
        pg,
        &ctx,
        "iam_oauth_provider_catalog",
        id.clone(),
        json!({ "providerCode": provider_code, "providerName": provider_name }),
        |tx| Box::pin(async move {
            sqlx::query(
                "INSERT INTO iam_oauth_provider_catalog \
                    (id, uuid, owner_tenant_id, provider_code, provider_family, provider_name, provider_display_name, \
                     region_group, protocol_family, status, created_at, updated_at) \
                 VALUES ($1, $2, $3, $4, 'oidc', $5, $6, 'global', 'oauth2', 'active', $7, $7)",
            )
            .bind(id_insert)
            .bind(uuid_insert)
            .bind(tenant_id_insert)
            .bind(provider_code_insert)
            .bind(provider_name_insert)
            .bind(display_name_insert)
            .bind(now)
            .execute(&mut **tx)
            .await
            .map(|_| ())
        }),
    )
    .await;

    match result {
        Ok(_) => retrieve_provider_catalog(State(state), ctx, Path(provider_code)).await,
        Err(error) => appbase_error(
            StatusCode::INTERNAL_SERVER_ERROR,
            "iam_oauth_provider_catalog_create_failed",
            &error,
        ),
    }
}

async fn update_provider_catalog(
    State(state): State<BackendIamState>,
    ctx: WebRequestContext,
    Path(provider_catalog_id): Path<String>,
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

    let mut assignments = collect_patch_assignments(&body);
    if let Some(name) = read_string_field(&body, &["providerName", "provider_name"]) {
        assignments.push(("provider_name".to_owned(), name));
    }
    if let Some(display_name) =
        read_string_field(&body, &["providerDisplayName", "provider_display_name"])
    {
        assignments.push(("provider_display_name".to_owned(), display_name));
    }
    assignments.push(("updated_at".to_owned(), Utc::now().to_rfc3339()));

    if assignments.len() == 1 {
        return appbase_error(
            StatusCode::BAD_REQUEST,
            "iam_oauth_provider_catalog_invalid",
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
        set_clause.push_str(&(index + 3).to_string());
    }

    let sql = format!(
        "UPDATE iam_oauth_provider_catalog SET {set_clause} \
         WHERE (owner_tenant_id = $1 OR owner_tenant_id = '0') AND id = $2"
    );
    let tenant_id_update = tenant_id.clone();
    let provider_catalog_id_update = provider_catalog_id.clone();
    match execute_conditional_mutation_with_audit(
        pg,
        &ctx,
        "iam_oauth_provider_catalog.update",
        "iam_oauth_provider_catalog",
        provider_catalog_id.clone(),
        json!({}),
        |tx| {
            Box::pin(async move {
                let mut query = sqlx::query(&sql)
                    .bind(tenant_id_update)
                    .bind(provider_catalog_id_update);
                for (_, value) in assignments {
                    query = query.bind(value);
                }
                query
                    .execute(&mut **tx)
                    .await
                    .map(|result| result.rows_affected())
            })
        },
        |rows_affected| *rows_affected > 0,
    )
    .await
    {
        Ok(result) if result > 0 => {
            retrieve_provider_catalog(State(state), ctx, Path(provider_catalog_id)).await
        }
        Ok(_) => appbase_error(
            StatusCode::NOT_FOUND,
            "iam_oauth_provider_catalog_not_found",
            "provider catalog entry not found",
        ),
        Err(error) => appbase_error(
            StatusCode::INTERNAL_SERVER_ERROR,
            "iam_oauth_provider_catalog_update_failed",
            &error,
        ),
    }
}

macro_rules! oauth_list_handler {
    ($name:ident, $spec:ident) => {
        async fn $name(
            State(state): State<BackendIamState>,
            ctx: WebRequestContext,
            Query(query): Query<HashMap<String, String>>,
        ) -> Response {
            tenant_list(&state, &ctx, &query, &$spec).await
        }
    };
}

macro_rules! oauth_retrieve_handler {
    ($name:ident, $spec:ident, $param:ident) => {
        async fn $name(
            State(state): State<BackendIamState>,
            ctx: WebRequestContext,
            Path($param): Path<String>,
        ) -> Response {
            tenant_retrieve(&state, &ctx, &$param, &$spec).await
        }
    };
}

macro_rules! oauth_patch_handler {
    ($name:ident, $spec:ident, $param:ident) => {
        async fn $name(
            State(state): State<BackendIamState>,
            ctx: WebRequestContext,
            Path($param): Path<String>,
            Json(body): Json<Value>,
        ) -> Response {
            tenant_patch(&state, &ctx, &$param, &body, &$spec).await
        }
    };
}

macro_rules! oauth_delete_handler {
    ($name:ident, $spec:ident, $param:ident, $error:literal) => {
        async fn $name(
            State(state): State<BackendIamState>,
            ctx: WebRequestContext,
            Path($param): Path<String>,
        ) -> Response {
            tenant_delete(&state, &ctx, &$param, $spec.table, $error).await
        }
    };
}

oauth_list_handler!(list_integrations, INTEGRATIONS);
oauth_retrieve_handler!(retrieve_integration, INTEGRATIONS, integration_id);
oauth_patch_handler!(update_integration, INTEGRATIONS, integration_id);
oauth_delete_handler!(
    delete_integration,
    INTEGRATIONS,
    integration_id,
    "iam_oauth_integration_delete_failed"
);

oauth_list_handler!(list_clients, CLIENTS);
oauth_retrieve_handler!(retrieve_client, CLIENTS, oauth_client_id);
oauth_patch_handler!(update_client, CLIENTS, oauth_client_id);
oauth_delete_handler!(
    delete_client,
    CLIENTS,
    oauth_client_id,
    "iam_oauth_client_delete_failed"
);

oauth_list_handler!(list_secrets, SECRETS);
oauth_delete_handler!(
    delete_secret,
    SECRETS,
    secret_id,
    "iam_oauth_secret_delete_failed"
);

oauth_list_handler!(list_surfaces, SURFACES);
oauth_patch_handler!(update_surface, SURFACES, surface_id);
oauth_delete_handler!(
    delete_surface,
    SURFACES,
    surface_id,
    "iam_oauth_surface_delete_failed"
);

oauth_list_handler!(list_flow_configs, FLOW_CONFIGS);
oauth_patch_handler!(update_flow_config, FLOW_CONFIGS, flow_config_id);

oauth_list_handler!(list_scope_profiles, SCOPE_PROFILES);
oauth_patch_handler!(update_scope_profile, SCOPE_PROFILES, scope_profile_id);

oauth_list_handler!(list_claim_mappings, CLAIM_MAPPINGS);
oauth_patch_handler!(update_claim_mapping, CLAIM_MAPPINGS, mapping_id);

oauth_list_handler!(list_oauth_policies, OAUTH_POLICIES);
oauth_patch_handler!(update_oauth_policy, OAUTH_POLICIES, policy_id);

oauth_list_handler!(list_tenant_bindings, TENANT_BINDINGS);
oauth_patch_handler!(update_tenant_binding, TENANT_BINDINGS, binding_id);

oauth_list_handler!(list_operator_platforms, OPERATOR_PLATFORMS);
oauth_patch_handler!(
    update_operator_platform,
    OPERATOR_PLATFORMS,
    operator_platform_id
);

oauth_list_handler!(list_resource_accounts, RESOURCE_ACCOUNTS);
oauth_patch_handler!(
    update_resource_account,
    RESOURCE_ACCOUNTS,
    resource_account_id
);

oauth_list_handler!(list_resource_authorizations, RESOURCE_AUTHORIZATIONS);
oauth_patch_handler!(
    update_resource_authorization,
    RESOURCE_AUTHORIZATIONS,
    authorization_id
);

oauth_list_handler!(list_webhook_configs, WEBHOOK_CONFIGS);
oauth_patch_handler!(update_webhook_config, WEBHOOK_CONFIGS, webhook_config_id);

oauth_list_handler!(list_operational_resources, OPERATIONAL_RESOURCES);
oauth_patch_handler!(
    update_operational_resource,
    OPERATIONAL_RESOURCES,
    resource_id
);
oauth_delete_handler!(
    delete_operational_resource,
    OPERATIONAL_RESOURCES,
    resource_id,
    "iam_oauth_operational_resource_delete_failed"
);

oauth_list_handler!(list_account_links, ACCOUNT_LINKS);
oauth_patch_handler!(update_account_link, ACCOUNT_LINKS, account_link_id);

oauth_list_handler!(list_grants, GRANTS);
oauth_delete_handler!(
    delete_grant,
    GRANTS,
    grant_id,
    "iam_oauth_grant_delete_failed"
);

oauth_list_handler!(list_callback_events, CALLBACK_EVENTS);

oauth_list_handler!(list_diagnostic_runs, DIAGNOSTIC_RUNS);
oauth_retrieve_handler!(retrieve_diagnostic_run, DIAGNOSTIC_RUNS, diagnostic_run_id);

async fn create_integration(
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

    let provider_code = read_string_field(&body, &["providerCode", "provider_code"]);
    let provider_catalog_id =
        read_string_field(&body, &["providerCatalogId", "provider_catalog_id"]);
    let integration_code = read_string_field(&body, &["integrationCode", "integration_code"]);
    let display_name = read_string_field(&body, &["displayName", "display_name"]);
    if provider_code.as_deref().unwrap_or("").is_empty()
        || provider_catalog_id.as_deref().unwrap_or("").is_empty()
        || integration_code.as_deref().unwrap_or("").is_empty()
        || display_name.as_deref().unwrap_or("").is_empty()
    {
        return appbase_error(
            StatusCode::BAD_REQUEST,
            "iam_oauth_integration_invalid",
            "providerCode, providerCatalogId, integrationCode, and displayName are required",
        );
    }

    let organization_id = organization_id_from_context(&ctx).unwrap_or_else(|| "0".to_owned());
    let environment =
        read_string_field(&body, &["environment"]).unwrap_or_else(|| "dev".to_owned());
    let deployment_mode = read_string_field(&body, &["deploymentMode", "deployment_mode"])
        .unwrap_or_else(|| "saas".to_owned());
    let id = format!("iamoi-{}", Uuid::new_v4());
    let insert_id = id.clone();
    let now = Utc::now().to_rfc3339();
    let provider_code_value = provider_code.as_ref().expect("validated").clone();
    let provider_catalog_id_value = provider_catalog_id.as_ref().expect("validated").clone();
    let integration_code_value = integration_code.as_ref().expect("validated").clone();
    let display_name_value = display_name.as_ref().expect("validated").clone();
    let tenant_id_insert = tenant_id.clone();
    oauth_commit_create(
        &state,
        &ctx,
        pg,
        &id,
        &INTEGRATIONS,
        json!({ "providerCode": provider_code, "integrationCode": integration_code }),
        |tx| Box::pin(async move {
            let tenant_id = tenant_id_insert.clone();
            let organization_id = organization_id.clone();
            let environment = environment.clone();
            let deployment_mode = deployment_mode.clone();
            let provider_code_value = provider_code_value.clone();
            let provider_catalog_id_value = provider_catalog_id_value.clone();
            let integration_code_value = integration_code_value.clone();
            let display_name_value = display_name_value.clone();
            let now = now.clone();
            
                sqlx::query(
                    "INSERT INTO iam_oauth_integration \
                        (id, uuid, tenant_id, organization_id, app_id, environment, deployment_mode, provider_code, \
                         provider_catalog_id, integration_code, display_name, region_group, protocol_family, health_status, status, created_at, updated_at) \
                     VALUES ($1, $2, $3, $4, '0', $5, $6, $7, $8, $9, $10, 'global', 'oauth2', 'unknown', 'active', $11, $11)",
                )
                .bind(&insert_id)
                .bind(Uuid::new_v4().to_string())
                .bind(&tenant_id)
                .bind(&organization_id)
                .bind(&environment)
                .bind(&deployment_mode)
                .bind(&provider_code_value)
                .bind(&provider_catalog_id_value)
                .bind(&integration_code_value)
                .bind(&display_name_value)
                .bind(&now)
                .execute(&mut **tx)
                .await
                .map(|_| ())
            }),
    )
    .await
}

async fn create_client(
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

    let integration_id = read_string_field(&body, &["integrationId", "integration_id"]);
    let provider_code = read_string_field(&body, &["providerCode", "provider_code"]);
    let client_code = read_string_field(&body, &["clientCode", "client_code"]);
    let display_name = read_string_field(&body, &["displayName", "display_name"]);
    let provider_client_id = read_string_field(&body, &["providerClientId", "provider_client_id"]);
    let provider_tenant_id = read_string_field(&body, &["providerTenantId", "provider_tenant_id"]);
    if integration_id.as_deref().unwrap_or("").is_empty()
        || provider_code.as_deref().unwrap_or("").is_empty()
        || client_code.as_deref().unwrap_or("").is_empty()
        || display_name.as_deref().unwrap_or("").is_empty()
        || provider_client_id.as_deref().unwrap_or("").is_empty()
    {
        return appbase_error(
            StatusCode::BAD_REQUEST,
            "iam_oauth_client_invalid",
            "integrationId, providerCode, clientCode, displayName, and providerClientId are required",
        );
    }

    let organization_id = organization_id_from_context(&ctx).unwrap_or_else(|| "0".to_owned());
    let id = format!("iamoc-{}", Uuid::new_v4());
    let insert_id = id.clone();
    let now = Utc::now().to_rfc3339();
    let integration_id_value = integration_id.as_ref().expect("validated").clone();
    let provider_code_value = provider_code.as_ref().expect("validated").clone();
    let client_code_value = client_code.as_ref().expect("validated").clone();
    let display_name_value = display_name.as_ref().expect("validated").clone();
    let provider_client_id_value = provider_client_id.as_ref().expect("validated").clone();
    let provider_tenant_id_value = provider_tenant_id.clone();
    let tenant_id_insert = tenant_id.clone();

    oauth_commit_create(
        &state,
        &ctx,
        pg,
        &id,
        &CLIENTS,
        json!({}),
        |tx| Box::pin(async move {
            let tenant_id = tenant_id_insert.clone();
            let organization_id = organization_id.clone();
            let integration_id_value = integration_id_value.clone();
            let provider_code_value = provider_code_value.clone();
            let client_code_value = client_code_value.clone();
            let display_name_value = display_name_value.clone();
            let provider_client_id_value = provider_client_id_value.clone();
            let provider_tenant_id_value = provider_tenant_id_value.clone();
            let now = now.clone();

            sqlx::query(
                "INSERT INTO iam_oauth_client \
                    (id, uuid, tenant_id, organization_id, integration_id, provider_code, client_code, display_name, \
                     provider_client_id, provider_tenant_id, client_auth_method, pkce_default_mode, secret_config_status, status, created_at, updated_at) \
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'client_secret_post', 'required', 'missing', 'active', $11, $11)",
            )
            .bind(&insert_id)
            .bind(Uuid::new_v4().to_string())
            .bind(&tenant_id)
            .bind(&organization_id)
            .bind(&integration_id_value)
            .bind(&provider_code_value)
            .bind(&client_code_value)
            .bind(&display_name_value)
            .bind(&provider_client_id_value)
            .bind(&provider_tenant_id_value)
            .bind(&now)
            .execute(&mut **tx)
            .await
            .map(|_| ())
            }),
    )
    .await
}

async fn create_secret(
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

    let secret_owner_kind = read_string_field(&body, &["secretOwnerKind", "secret_owner_kind"]);
    let secret_owner_id = read_string_field(&body, &["secretOwnerId", "secret_owner_id"]);
    let secret_kind = read_string_field(&body, &["secretKind", "secret_kind"]);
    let secret_ref = read_string_field(&body, &["secretRef", "secret_ref"]);
    if secret_owner_kind.as_deref().unwrap_or("").is_empty()
        || secret_owner_id.as_deref().unwrap_or("").is_empty()
        || secret_kind.as_deref().unwrap_or("").is_empty()
        || secret_ref.as_deref().unwrap_or("").is_empty()
    {
        return appbase_error(
            StatusCode::BAD_REQUEST,
            "iam_oauth_secret_invalid",
            "secretOwnerKind, secretOwnerId, secretKind, and secretRef are required",
        );
    }

    let organization_id = organization_id_from_context(&ctx).unwrap_or_else(|| "0".to_owned());
    let id = format!("iamos-{}", Uuid::new_v4());
    let insert_id = id.clone();
    let now = Utc::now().to_rfc3339();
    let secret_ref = secret_ref.expect("validated");
    let secret_hash = sdkwork_iam_bootstrap::hash_secret_ref(&secret_ref);
    let secret_owner_kind_value = secret_owner_kind.as_ref().expect("validated").clone();
    let secret_owner_id_value = secret_owner_id.as_ref().expect("validated").clone();
    let secret_kind_value = secret_kind.as_ref().expect("validated").clone();
    let secret_ref_value = secret_ref.clone();
    let tenant_id_insert = tenant_id.clone();

    match directory_create_with_audit(
        pg,
        &ctx,
        SECRETS.table,
        id.clone(),
        json!({}),
        |tx| Box::pin(async move {
            let tenant_id = tenant_id_insert.clone();
            let organization_id = organization_id.clone();
            let secret_owner_kind_value = secret_owner_kind_value.clone();
            let secret_owner_id_value = secret_owner_id_value.clone();
            let secret_kind_value = secret_kind_value.clone();
            let secret_ref_value = secret_ref_value.clone();
            let secret_hash = secret_hash.clone();
            let now = now.clone();
            
                sqlx::query(
                    "INSERT INTO iam_oauth_secret \
                        (id, uuid, tenant_id, organization_id, secret_owner_kind, secret_owner_id, secret_kind, \
                         secret_ref, secret_hash, active_from, status, created_at, updated_at) \
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'active', $10, $10)",
                )
                .bind(&insert_id)
                .bind(Uuid::new_v4().to_string())
                .bind(&tenant_id)
                .bind(&organization_id)
                .bind(&secret_owner_kind_value)
                .bind(&secret_owner_id_value)
                .bind(&secret_kind_value)
                .bind(&secret_ref_value)
                .bind(&secret_hash)
                .bind(&now)
                .execute(&mut **tx)
                .await
                .map(|_| ())
            }),
    )
    .await
    {
        Ok(_) => match sqlx::query(
            "SELECT id, tenant_id, secret_owner_kind, secret_owner_id, secret_kind, status, active_from, active_until, created_at, updated_at \
             FROM iam_oauth_secret WHERE tenant_id = $1 AND id = $2",
        )
        .bind(&tenant_id)
        .bind(&id)
        .fetch_one(pg)
        .await
        {
            Ok(row) => appbase_ok(row_to_json_with_aliases(
                &row,
                SECRETS.columns,
                SECRETS.id_aliases,
            )),
            Err(error) => internal_handler_error("iam_oauth_secret_create_failed", error),
        },
        Err(error) => appbase_error(
            StatusCode::INTERNAL_SERVER_ERROR,
            "iam_oauth_secret_create_failed",
            &error,
        ),
    }
}

async fn create_diagnostic_run(
    State(state): State<BackendIamState>,
    ctx: WebRequestContext,
    Json(body): Json<Value>,
) -> Response {
    insert_diagnostic_run(&state, &ctx, &body, "manual").await
}

async fn create_pre_authorization(
    State(state): State<BackendIamState>,
    ctx: WebRequestContext,
    Path(operator_platform_id): Path<String>,
    Json(body): Json<Value>,
) -> Response {
    let mut payload = body;
    if let Value::Object(ref mut map) = payload {
        map.insert("operatorPlatformId".to_owned(), json!(operator_platform_id));
    }
    insert_diagnostic_run(&state, &ctx, &payload, "pre_authorization").await
}

async fn create_resource_account_verification(
    State(state): State<BackendIamState>,
    ctx: WebRequestContext,
    Path(resource_account_id): Path<String>,
    Json(body): Json<Value>,
) -> Response {
    let mut payload = body;
    if let Value::Object(ref mut map) = payload {
        map.insert("resourceAccountId".to_owned(), json!(resource_account_id));
    }
    insert_diagnostic_run(&state, &ctx, &payload, "resource_account_verification").await
}

async fn create_mini_program_login_check(
    State(state): State<BackendIamState>,
    ctx: WebRequestContext,
    Path(resource_account_id): Path<String>,
    Json(body): Json<Value>,
) -> Response {
    let mut payload = body;
    if let Value::Object(ref mut map) = payload {
        map.insert("resourceAccountId".to_owned(), json!(resource_account_id));
    }
    insert_diagnostic_run(&state, &ctx, &payload, "mini_program_login_check").await
}

async fn create_authorization_refresh(
    State(state): State<BackendIamState>,
    ctx: WebRequestContext,
    Path(resource_account_id): Path<String>,
    Json(body): Json<Value>,
) -> Response {
    let mut payload = body;
    if let Value::Object(ref mut map) = payload {
        map.insert("resourceAccountId".to_owned(), json!(resource_account_id));
    }
    insert_diagnostic_run(&state, &ctx, &payload, "authorization_refresh").await
}

async fn create_webhook_verification(
    State(state): State<BackendIamState>,
    ctx: WebRequestContext,
    Path(webhook_config_id): Path<String>,
    Json(body): Json<Value>,
) -> Response {
    let mut payload = body;
    if let Value::Object(ref mut map) = payload {
        map.insert("webhookConfigId".to_owned(), json!(webhook_config_id));
    }
    insert_diagnostic_run(&state, &ctx, &payload, "webhook_verification").await
}

async fn create_operational_resource_publish(
    State(state): State<BackendIamState>,
    ctx: WebRequestContext,
    Path(resource_id): Path<String>,
    Json(body): Json<Value>,
) -> Response {
    let mut payload = body;
    if let Value::Object(ref mut map) = payload {
        map.insert("resourceId".to_owned(), json!(resource_id));
    }
    insert_diagnostic_run(&state, &ctx, &payload, "operational_resource_publish").await
}

async fn execute_oauth_diagnostic(
    pg: &PgPool,
    tenant_id: &str,
    run_kind: &str,
    body: &Value,
) -> Result<String, String> {
    match run_kind {
        "webhook_verification" => verify_oauth_webhook_diagnostic(pg, tenant_id, body).await,
        "pre_authorization" | "authorization_refresh" => {
            verify_oauth_integration_diagnostic(pg, tenant_id, body).await
        }
        "resource_account_verification" => {
            verify_oauth_resource_account_diagnostic(pg, tenant_id, body).await
        }
        "mini_program_login_check" => verify_oauth_surface_diagnostic(pg, tenant_id, body).await,
        "operational_resource_publish" => {
            verify_oauth_operational_resource_diagnostic(pg, tenant_id, body).await
        }
        "manual" => {
            let notes = read_string_field(body, &["notes", "summary"])
                .filter(|value| !value.is_empty())
                .ok_or_else(|| {
                    "manual diagnostic requires notes describing what was verified".to_string()
                })?;
            Ok(format!("manual diagnostic recorded: {notes}"))
        }
        other => Err(format!("unsupported oauth diagnostic run kind: {other}")),
    }
}

async fn verify_oauth_integration_diagnostic(
    pg: &PgPool,
    tenant_id: &str,
    body: &Value,
) -> Result<String, String> {
    let integration_id = read_string_field(body, &["integrationId", "integration_id"])
        .filter(|value| !value.is_empty())
        .ok_or_else(|| "integrationId is required".to_string())?;
    let row = sqlx::query(
        "SELECT i.id, i.provider_code, c.status AS catalog_status, c.provider_code AS catalog_provider_code \
         FROM iam_oauth_integration i \
         JOIN iam_oauth_provider_catalog c ON c.id = i.provider_catalog_id \
         WHERE i.tenant_id = $1 AND i.id = $2 AND i.enabled = 1 AND i.status = 'active' \
         LIMIT 1",
    )
    .bind(tenant_id)
    .bind(&integration_id)
    .fetch_optional(pg)
    .await
    .map_err(|error| format!("oauth integration diagnostic failed: {error}"))?
    .ok_or_else(|| "oauth integration is not active for this tenant".to_string())?;
    let provider_code: String = row.get(1);
    let catalog_status: String = row.get(2);
    let catalog_provider_code: String = row.get(3);
    if catalog_status != "active" {
        return Err("oauth provider catalog entry is not active".to_string());
    }
    if provider_code != catalog_provider_code {
        return Err("oauth integration providerCode does not match provider catalog".to_string());
    }
    Ok(format!(
        "integration {integration_id} is active with provider catalog {catalog_provider_code}"
    ))
}

async fn verify_oauth_webhook_diagnostic(
    pg: &PgPool,
    tenant_id: &str,
    body: &Value,
) -> Result<String, String> {
    let webhook_config_id = read_string_field(body, &["webhookConfigId", "webhook_config_id"])
        .filter(|value| !value.is_empty())
        .ok_or_else(|| "webhookConfigId is required".to_string())?;
    let row = sqlx::query(
        "SELECT callback_public_id, verification_token_status \
         FROM iam_oauth_webhook_config \
         WHERE tenant_id = $1 AND id = $2 AND enabled = 1 AND status = 'active' \
         LIMIT 1",
    )
    .bind(tenant_id)
    .bind(&webhook_config_id)
    .fetch_optional(pg)
    .await
    .map_err(|error| format!("oauth webhook diagnostic failed: {error}"))?
    .ok_or_else(|| "oauth webhook configuration was not found".to_string())?;
    let callback_public_id: String = row.get(0);
    let verification_status: String = row.get(1);
    if callback_public_id.trim().is_empty() {
        return Err("oauth webhook callback public id is not configured".to_string());
    }
    if verification_status != "verified" {
        return Err("oauth webhook verification token is not verified".to_string());
    }
    Ok(format!(
        "webhook {webhook_config_id} is active and verified"
    ))
}

async fn verify_oauth_resource_account_diagnostic(
    pg: &PgPool,
    tenant_id: &str,
    body: &Value,
) -> Result<String, String> {
    let resource_account_id =
        read_string_field(body, &["resourceAccountId", "resource_account_id"])
            .filter(|value| !value.is_empty())
            .ok_or_else(|| "resourceAccountId is required".to_string())?;
    let count: i64 = sqlx::query_scalar(
        "SELECT COUNT(1)::bigint FROM iam_oauth_resource_account \
         WHERE tenant_id = $1 AND id = $2 AND status = 'active'",
    )
    .bind(tenant_id)
    .bind(&resource_account_id)
    .fetch_one(pg)
    .await
    .map_err(|error| format!("oauth resource account diagnostic failed: {error}"))?;
    if count != 1 {
        return Err("oauth resource account is not active for this tenant".to_string());
    }
    Ok(format!("resource account {resource_account_id} is active"))
}

async fn verify_oauth_surface_diagnostic(
    pg: &PgPool,
    tenant_id: &str,
    body: &Value,
) -> Result<String, String> {
    let resource_account_id =
        read_string_field(body, &["resourceAccountId", "resource_account_id"])
            .filter(|value| !value.is_empty())
            .ok_or_else(|| "resourceAccountId is required".to_string())?;
    let row = sqlx::query(
        "SELECT r.integration_id, i.app_id \
         FROM iam_oauth_resource_account r \
         JOIN iam_oauth_integration i ON i.id = r.integration_id AND i.tenant_id = r.tenant_id \
         WHERE r.tenant_id = $1 AND r.id = $2 AND r.provider_code = 'wechat_mini_program' \
           AND r.enabled = 1 AND r.status = 'active' AND i.enabled = 1 AND i.status = 'active' \
         LIMIT 1",
    )
    .bind(tenant_id)
    .bind(&resource_account_id)
    .fetch_optional(pg)
    .await
    .map_err(|error| format!("oauth mini program diagnostic failed: {error}"))?
    .ok_or_else(|| "active WeChat mini program resource account was not found".to_string())?;
    let integration_id: String = row.get(0);
    let runtime_app_id: String = row.get(1);
    let surface_code = sqlx::query_scalar::<_, String>(
        "SELECT surface_code FROM iam_oauth_surface \
         WHERE tenant_id = $1 AND integration_id = $2 AND surface_kind = 'mini_program' \
           AND enabled = 1 AND status = 'active' \
         ORDER BY surface_code LIMIT 1",
    )
    .bind(tenant_id)
    .bind(&integration_id)
    .fetch_optional(pg)
    .await
    .map_err(|error| format!("load mini program diagnostic surface failed: {error}"))?
    .ok_or_else(|| "active WeChat mini program surface was not found".to_string())?;
    sdkwork_iam_web_adapter::probe_wechat_mini_program_configuration(
        pg,
        tenant_id,
        &runtime_app_id,
        Some(&surface_code),
    )
    .await?;
    Ok(format!(
        "WeChat mini program resource account {resource_account_id} passed external configuration probe"
    ))
}

async fn verify_oauth_operational_resource_diagnostic(
    pg: &PgPool,
    tenant_id: &str,
    body: &Value,
) -> Result<String, String> {
    let resource_id = read_string_field(body, &["resourceId", "resource_id"])
        .filter(|value| !value.is_empty())
        .ok_or_else(|| "resourceId is required".to_string())?;
    let count: i64 = sqlx::query_scalar(
        "SELECT COUNT(1)::bigint FROM iam_oauth_operational_resource \
         WHERE tenant_id = $1 AND id = $2 AND status = 'active'",
    )
    .bind(tenant_id)
    .bind(&resource_id)
    .fetch_one(pg)
    .await
    .map_err(|error| format!("oauth operational resource diagnostic failed: {error}"))?;
    if count != 1 {
        return Err("oauth operational resource is not active for this tenant".to_string());
    }
    Ok(format!("operational resource {resource_id} is active"))
}

async fn insert_diagnostic_run(
    state: &BackendIamState,
    ctx: &WebRequestContext,
    body: &Value,
    default_run_kind: &str,
) -> Response {
    let Ok(pg) = postgres_pool_or_error(state) else {
        return postgres_pool_or_error(state).err().expect("error response");
    };
    let Ok(tenant_id) = tenant_id_from_context(ctx) else {
        return tenant_id_from_context(ctx).err().expect("error response");
    };

    let provider_code = read_string_field(body, &["providerCode", "provider_code"])
        .unwrap_or_else(|| "unknown".to_owned());
    let run_kind = read_string_field(body, &["runKind", "run_kind"])
        .unwrap_or_else(|| default_run_kind.to_owned());
    let integration_id = read_string_field(body, &["integrationId", "integration_id"]);
    let oauth_client_id = read_string_field(body, &["oauthClientId", "oauth_client_id"]);
    let surface_id = read_string_field(body, &["surfaceId", "surface_id"]);
    let organization_id = organization_id_from_context(ctx).unwrap_or_else(|| "0".to_owned());
    let id = format!("iamodr-{}", Uuid::new_v4());
    let insert_id = id.clone();
    let now = Utc::now().to_rfc3339();

    let diagnostic_result = execute_oauth_diagnostic(pg, &tenant_id, &run_kind, body).await;
    let (status, result_code, result_summary, redacted_result_json) = match diagnostic_result {
        Ok(summary) => (
            "succeeded",
            "succeeded",
            summary,
            json!({ "runKind": run_kind, "outcome": "succeeded" }),
        ),
        Err(error) => (
            "failed",
            "failed",
            error.clone(),
            json!({ "runKind": run_kind, "outcome": "failed", "error": error }),
        ),
    };

    let tenant_id_insert = tenant_id.clone();
    let integration_id_insert = integration_id.clone();
    let oauth_client_id_insert = oauth_client_id.clone();
    let surface_id_insert = surface_id.clone();
    let provider_code_insert = provider_code.clone();
    let run_kind_insert = run_kind.clone();
    let status_insert = status.to_owned();
    let result_code_insert = result_code.to_owned();
    let result_summary_insert = result_summary.clone();
    let redacted_result_json_insert = redacted_result_json.to_string();

    oauth_commit_create(
        state,
        ctx,
        pg,
        &id,
        &DIAGNOSTIC_RUNS,
        json!({ "runKind": run_kind }),
        |tx| Box::pin(async move {
            let tenant_id = tenant_id_insert.clone();
            let organization_id = organization_id.clone();
            let integration_id = integration_id_insert.clone();
            let oauth_client_id = oauth_client_id_insert.clone();
            let surface_id = surface_id_insert.clone();
            let provider_code = provider_code_insert.clone();
            let run_kind = run_kind_insert.clone();
            let status = status_insert.clone();
            let result_code = result_code_insert.clone();
            let result_summary = result_summary_insert.clone();
            let redacted_result_json = redacted_result_json_insert.clone();
            let now = now.clone();
            
                sqlx::query(
                    "INSERT INTO iam_oauth_diagnostic_run \
                        (id, uuid, tenant_id, organization_id, integration_id, oauth_client_id, surface_id, provider_code, \
                         run_kind, status, started_at, finished_at, result_code, result_summary, redacted_result_json, created_at) \
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $11, $12, $13, $14, $11)",
                )
                .bind(&insert_id)
                .bind(Uuid::new_v4().to_string())
                .bind(&tenant_id)
                .bind(&organization_id)
                .bind(integration_id)
                .bind(oauth_client_id)
                .bind(surface_id)
                .bind(&provider_code)
                .bind(&run_kind)
                .bind(&status)
                .bind(&now)
                .bind(&result_code)
                .bind(&result_summary)
                .bind(&redacted_result_json)
                .execute(&mut **tx)
                .await
                .map(|_| ())
            }),
    )
    .await
}

async fn create_surface(
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

    let integration_id = read_string_field(&body, &["integrationId", "integration_id"]);
    let oauth_client_id = read_string_field(&body, &["oauthClientId", "oauth_client_id"]);
    let surface_kind = read_string_field(&body, &["surfaceKind", "surface_kind"]);
    let surface_code = read_string_field(&body, &["surfaceCode", "surface_code"]);
    let display_name = read_string_field(&body, &["displayName", "display_name"]);
    if integration_id.as_deref().unwrap_or("").is_empty()
        || oauth_client_id.as_deref().unwrap_or("").is_empty()
        || surface_kind.as_deref().unwrap_or("").is_empty()
        || surface_code.as_deref().unwrap_or("").is_empty()
        || display_name.as_deref().unwrap_or("").is_empty()
    {
        return appbase_error(
            StatusCode::BAD_REQUEST,
            "iam_oauth_surface_invalid",
            "integrationId, oauthClientId, surfaceKind, surfaceCode, and displayName are required",
        );
    }

    let organization_id = organization_id_from_context(&ctx).unwrap_or_else(|| "0".to_owned());
    let id = format!("iamosurf-{}", Uuid::new_v4());
    let insert_id = id.clone();
    let now = Utc::now().to_rfc3339();
    let integration_id_value = integration_id.as_ref().expect("validated").clone();
    let oauth_client_id_value = oauth_client_id.as_ref().expect("validated").clone();
    let surface_kind_value = surface_kind.as_ref().expect("validated").clone();
    let surface_code_value = surface_code.as_ref().expect("validated").clone();
    let display_name_value = display_name.as_ref().expect("validated").clone();
    let tenant_id_insert = tenant_id.clone();

    oauth_commit_create(
        &state,
        &ctx,
        pg,
        &id,
        &SURFACES,
        json!({}),
        |tx| Box::pin(async move {
            let tenant_id = tenant_id_insert.clone();
            let organization_id = organization_id.clone();
            let integration_id_value = integration_id_value.clone();
            let oauth_client_id_value = oauth_client_id_value.clone();
            let surface_kind_value = surface_kind_value.clone();
            let surface_code_value = surface_code_value.clone();
            let display_name_value = display_name_value.clone();
            let now = now.clone();
            
                sqlx::query(
                    "INSERT INTO iam_oauth_surface \
                        (id, uuid, tenant_id, organization_id, integration_id, oauth_client_id, surface_kind, surface_code, \
                         display_name, redirect_validation_mode, pkce_mode, client_auth_method, status, created_at, updated_at) \
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'strict', 'required', 'client_secret_post', 'active', $10, $10)",
                )
                .bind(&insert_id)
                .bind(Uuid::new_v4().to_string())
                .bind(&tenant_id)
                .bind(&organization_id)
                .bind(&integration_id_value)
                .bind(&oauth_client_id_value)
                .bind(&surface_kind_value)
                .bind(&surface_code_value)
                .bind(&display_name_value)
                .bind(&now)
                .execute(&mut **tx)
                .await
                .map(|_| ())
            }),
    )
    .await
}

async fn create_flow_config(
    State(state): State<BackendIamState>,
    ctx: WebRequestContext,
    Json(body): Json<Value>,
) -> Response {
    generic_integration_child_create(
        &state, &ctx, &body, "iamofc", &FLOW_CONFIGS, 4,
        "integrationId, oauthClientId, flowKind, and flowPurpose are required",
        "INSERT INTO iam_oauth_flow_config \
            (id, uuid, tenant_id, organization_id, integration_id, oauth_client_id, flow_kind, flow_purpose, \
             provider_session_key_retention_policy, status, created_at, updated_at) \
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'none', 'active', $9, $9)",
        |body| {
            (
                read_string_field(body, &["integrationId", "integration_id"]),
                read_string_field(body, &["oauthClientId", "oauth_client_id"]),
                read_string_field(body, &["flowKind", "flow_kind"]),
                read_string_field(body, &["flowPurpose", "flow_purpose"]),
                None,
            )
        },
    )
    .await
}

async fn create_scope_profile(
    State(state): State<BackendIamState>,
    ctx: WebRequestContext,
    Json(body): Json<Value>,
) -> Response {
    generic_integration_child_create(
        &state, &ctx, &body, "iamosp", &SCOPE_PROFILES, 5,
        "integrationId, providerCode, scopeProfileCode, displayName, and purpose are required",
        "INSERT INTO iam_oauth_scope_profile \
            (id, uuid, tenant_id, organization_id, integration_id, provider_code, scope_profile_code, display_name, purpose, status, created_at, updated_at) \
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'active', $10, $10)",
        |body| {
            (
                read_string_field(body, &["integrationId", "integration_id"]),
                read_string_field(body, &["providerCode", "provider_code"]),
                read_string_field(body, &["scopeProfileCode", "scope_profile_code"]),
                read_string_field(body, &["displayName", "display_name"]),
                read_string_field(body, &["purpose"]),
            )
        },
    )
    .await
}

async fn create_claim_mapping(
    State(state): State<BackendIamState>,
    ctx: WebRequestContext,
    Json(body): Json<Value>,
) -> Response {
    generic_integration_child_create(
        &state, &ctx, &body, "iamocm", &CLAIM_MAPPINGS, 5,
        "integrationId, providerCode, externalClaim, targetKind, and targetField are required",
        "INSERT INTO iam_oauth_claim_mapping \
            (id, uuid, tenant_id, organization_id, integration_id, provider_code, external_claim, target_kind, target_field, transform_kind, status, created_at, updated_at) \
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'direct', 'active', $10, $10)",
        |body| {
            (
                read_string_field(body, &["integrationId", "integration_id"]),
                read_string_field(body, &["providerCode", "provider_code"]),
                read_string_field(body, &["externalClaim", "external_claim"]),
                read_string_field(body, &["targetKind", "target_kind"]),
                read_string_field(body, &["targetField", "target_field"]),
            )
        },
    )
    .await
}

async fn create_oauth_policy(
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

    let policy_code = read_string_field(&body, &["policyCode", "policy_code"]);
    let display_name = read_string_field(&body, &["displayName", "display_name"]);
    if policy_code.as_deref().unwrap_or("").is_empty()
        || display_name.as_deref().unwrap_or("").is_empty()
    {
        return appbase_error(
            StatusCode::BAD_REQUEST,
            "iam_oauth_policies_list_failed",
            "policyCode and displayName are required",
        );
    }

    let organization_id = organization_id_from_context(&ctx).unwrap_or_else(|| "0".to_owned());
    let integration_id = read_string_field(&body, &["integrationId", "integration_id"]);
    let id = format!("iamoop-{}", Uuid::new_v4());
    let insert_id = id.clone();
    let now = Utc::now().to_rfc3339();
    let policy_code_value = policy_code.as_ref().expect("validated").clone();
    let display_name_value = display_name.as_ref().expect("validated").clone();
    let tenant_id_insert = tenant_id.clone();

    oauth_commit_create(
        &state,
        &ctx,
        pg,
        &id,
        &OAUTH_POLICIES,
        json!({}),
        |tx| Box::pin(async move {
            let tenant_id = tenant_id_insert.clone();
            let organization_id = organization_id.clone();
            let integration_id = integration_id.clone();
            let policy_code_value = policy_code_value.clone();
            let display_name_value = display_name_value.clone();
            let now = now.clone();
            
                sqlx::query(
                    "INSERT INTO iam_oauth_policy \
                        (id, uuid, tenant_id, organization_id, integration_id, policy_code, display_name, status, created_at, updated_at) \
                     VALUES ($1, $2, $3, $4, $5, $6, $7, 'active', $8, $8)",
                )
                .bind(&insert_id)
                .bind(Uuid::new_v4().to_string())
                .bind(&tenant_id)
                .bind(&organization_id)
                .bind(integration_id)
                .bind(&policy_code_value)
                .bind(&display_name_value)
                .bind(&now)
                .execute(&mut **tx)
                .await
                .map(|_| ())
            }),
    )
    .await
}

async fn create_tenant_binding(
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

    let provider_code = read_string_field(&body, &["providerCode", "provider_code"]);
    let integration_id = read_string_field(&body, &["integrationId", "integration_id"]);
    let binding_kind = read_string_field(&body, &["bindingKind", "binding_kind"]);
    if provider_code.as_deref().unwrap_or("").is_empty()
        || integration_id.as_deref().unwrap_or("").is_empty()
        || binding_kind.as_deref().unwrap_or("").is_empty()
    {
        return appbase_error(
            StatusCode::BAD_REQUEST,
            "iam_oauth_tenant_bindings_list_failed",
            "providerCode, integrationId, and bindingKind are required",
        );
    }

    let organization_id = organization_id_from_context(&ctx).unwrap_or_else(|| "0".to_owned());
    let id = format!("iamotb-{}", Uuid::new_v4());
    let insert_id = id.clone();
    let now = Utc::now().to_rfc3339();
    let provider_code_value = provider_code.as_ref().expect("validated").clone();
    let integration_id_value = integration_id.as_ref().expect("validated").clone();
    let binding_kind_value = binding_kind.as_ref().expect("validated").clone();
    let tenant_id_insert = tenant_id.clone();

    oauth_commit_create(
        &state,
        &ctx,
        pg,
        &id,
        &TENANT_BINDINGS,
        json!({}),
        |tx| Box::pin(async move {
            let tenant_id = tenant_id_insert.clone();
            let organization_id = organization_id.clone();
            let provider_code_value = provider_code_value.clone();
            let integration_id_value = integration_id_value.clone();
            let binding_kind_value = binding_kind_value.clone();
            let now = now.clone();
            
                sqlx::query(
                    "INSERT INTO iam_oauth_tenant_binding \
                        (id, uuid, tenant_id, organization_id, provider_code, integration_id, binding_kind, mapped_tenant_id, status, created_at, updated_at) \
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $3, 'active', $8, $8)",
                )
                .bind(&insert_id)
                .bind(Uuid::new_v4().to_string())
                .bind(&tenant_id)
                .bind(&organization_id)
                .bind(&provider_code_value)
                .bind(&integration_id_value)
                .bind(&binding_kind_value)
                .bind(&now)
                .execute(&mut **tx)
                .await
                .map(|_| ())
            }),
    )
    .await
}

async fn create_operator_platform(
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

    let integration_id = read_string_field(&body, &["integrationId", "integration_id"]);
    let provider_code = read_string_field(&body, &["providerCode", "provider_code"]);
    let platform_code = read_string_field(&body, &["platformCode", "platform_code"]);
    let display_name = read_string_field(&body, &["displayName", "display_name"]);
    let operator_mode = read_string_field(&body, &["operatorMode", "operator_mode"]);
    let provider_platform_id =
        read_string_field(&body, &["providerPlatformId", "provider_platform_id"]);
    if integration_id.as_deref().unwrap_or("").is_empty()
        || provider_code.as_deref().unwrap_or("").is_empty()
        || platform_code.as_deref().unwrap_or("").is_empty()
        || display_name.as_deref().unwrap_or("").is_empty()
        || operator_mode.as_deref().unwrap_or("").is_empty()
        || provider_platform_id.as_deref().unwrap_or("").is_empty()
    {
        return appbase_error(
            StatusCode::BAD_REQUEST,
            "iam_oauth_operator_platforms_list_failed",
            "integrationId, providerCode, platformCode, displayName, operatorMode, and providerPlatformId are required",
        );
    }

    let organization_id = organization_id_from_context(&ctx).unwrap_or_else(|| "0".to_owned());
    let id = format!("iamoopl-{}", Uuid::new_v4());
    let insert_id = id.clone();
    let now = Utc::now().to_rfc3339();
    let integration_id_value = integration_id.as_ref().expect("validated").clone();
    let provider_code_value = provider_code.as_ref().expect("validated").clone();
    let platform_code_value = platform_code.as_ref().expect("validated").clone();
    let display_name_value = display_name.as_ref().expect("validated").clone();
    let operator_mode_value = operator_mode.as_ref().expect("validated").clone();
    let provider_platform_id_value = provider_platform_id.as_ref().expect("validated").clone();
    let tenant_id_insert = tenant_id.clone();

    oauth_commit_create(
        &state,
        &ctx,
        pg,
        &id,
        &OPERATOR_PLATFORMS,
        json!({}),
        |tx| Box::pin(async move {
            let tenant_id = tenant_id_insert.clone();
            let organization_id = organization_id.clone();
            let integration_id_value = integration_id_value.clone();
            let provider_code_value = provider_code_value.clone();
            let platform_code_value = platform_code_value.clone();
            let display_name_value = display_name_value.clone();
            let operator_mode_value = operator_mode_value.clone();
            let provider_platform_id_value = provider_platform_id_value.clone();
            let now = now.clone();
            
                sqlx::query(
                    "INSERT INTO iam_oauth_operator_platform \
                        (id, uuid, tenant_id, organization_id, integration_id, provider_code, platform_code, display_name, operator_mode, \
                         provider_platform_id, authorization_status, webhook_verify_status, ticket_secret_status, token_secret_status, status, created_at, updated_at) \
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'pending', 'pending', 'missing', 'missing', 'active', $11, $11)",
                )
                .bind(&insert_id)
                .bind(Uuid::new_v4().to_string())
                .bind(&tenant_id)
                .bind(&organization_id)
                .bind(&integration_id_value)
                .bind(&provider_code_value)
                .bind(&platform_code_value)
                .bind(&display_name_value)
                .bind(&operator_mode_value)
                .bind(&provider_platform_id_value)
                .bind(&now)
                .execute(&mut **tx)
                .await
                .map(|_| ())
            }),
    )
    .await
}

async fn create_resource_account(
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

    let integration_id = read_string_field(&body, &["integrationId", "integration_id"]);
    let provider_code = read_string_field(&body, &["providerCode", "provider_code"]);
    let resource_account_code =
        read_string_field(&body, &["resourceAccountCode", "resource_account_code"]);
    let resource_account_kind =
        read_string_field(&body, &["resourceAccountKind", "resource_account_kind"]);
    let display_name = read_string_field(&body, &["displayName", "display_name"]);
    let provider_account_id =
        read_string_field(&body, &["providerAccountId", "provider_account_id"]);
    let access_mode = read_string_field(&body, &["accessMode", "access_mode"]);
    if integration_id.as_deref().unwrap_or("").is_empty()
        || provider_code.as_deref().unwrap_or("").is_empty()
        || resource_account_code.as_deref().unwrap_or("").is_empty()
        || resource_account_kind.as_deref().unwrap_or("").is_empty()
        || display_name.as_deref().unwrap_or("").is_empty()
        || provider_account_id.as_deref().unwrap_or("").is_empty()
        || access_mode.as_deref().unwrap_or("").is_empty()
    {
        return appbase_error(
            StatusCode::BAD_REQUEST,
            "iam_oauth_resource_account_invalid",
            "integrationId, providerCode, resourceAccountCode, resourceAccountKind, displayName, providerAccountId, and accessMode are required",
        );
    }

    let organization_id = organization_id_from_context(&ctx).unwrap_or_else(|| "0".to_owned());
    let id = format!("iamora-{}", Uuid::new_v4());
    let insert_id = id.clone();
    let now = Utc::now().to_rfc3339();
    let integration_id_value = integration_id.as_ref().expect("validated").clone();
    let provider_code_value = provider_code.as_ref().expect("validated").clone();
    let resource_account_code_value = resource_account_code.as_ref().expect("validated").clone();
    let resource_account_kind_value = resource_account_kind.as_ref().expect("validated").clone();
    let access_mode_value = access_mode.as_ref().expect("validated").clone();
    let display_name_value = display_name.as_ref().expect("validated").clone();
    let provider_account_id_value = provider_account_id.as_ref().expect("validated").clone();
    let tenant_id_insert = tenant_id.clone();

    oauth_commit_create(
        &state,
        &ctx,
        pg,
        &id,
        &RESOURCE_ACCOUNTS,
        json!({}),
        |tx| Box::pin(async move {
            let tenant_id = tenant_id_insert.clone();
            let organization_id = organization_id.clone();
            let integration_id_value = integration_id_value.clone();
            let provider_code_value = provider_code_value.clone();
            let resource_account_code_value = resource_account_code_value.clone();
            let resource_account_kind_value = resource_account_kind_value.clone();
            let access_mode_value = access_mode_value.clone();
            let display_name_value = display_name_value.clone();
            let provider_account_id_value = provider_account_id_value.clone();
            let now = now.clone();
            
                sqlx::query(
                    "INSERT INTO iam_oauth_resource_account \
                        (id, uuid, tenant_id, organization_id, integration_id, provider_code, resource_account_code, resource_account_kind, \
                         access_mode, display_name, provider_account_id, verification_status, authorization_status, self_managed_config_status, \
                         operator_authorization_status, webhook_verify_status, domain_verify_status, status, created_at, updated_at) \
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'pending', 'pending', 'missing', 'pending', 'pending', 'pending', 'active', $12, $12)",
                )
                .bind(&insert_id)
                .bind(Uuid::new_v4().to_string())
                .bind(&tenant_id)
                .bind(&organization_id)
                .bind(&integration_id_value)
                .bind(&provider_code_value)
                .bind(&resource_account_code_value)
                .bind(&resource_account_kind_value)
                .bind(&access_mode_value)
                .bind(&display_name_value)
                .bind(&provider_account_id_value)
                .bind(&now)
                .execute(&mut **tx)
                .await
                .map(|_| ())
            }),
    )
    .await
}

async fn create_resource_authorization(
    State(state): State<BackendIamState>,
    ctx: WebRequestContext,
    Json(body): Json<Value>,
) -> Response {
    generic_integration_child_create(
        &state, &ctx, &body, "iamorau", &RESOURCE_AUTHORIZATIONS, 4,
        "integrationId, resourceAccountId, providerCode, and authorizationMode are required",
        "INSERT INTO iam_oauth_resource_authorization \
            (id, uuid, tenant_id, organization_id, integration_id, resource_account_id, provider_code, authorization_mode, status, created_at, updated_at) \
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending', $9, $9)",
        |body| {
            (
                read_string_field(body, &["integrationId", "integration_id"]),
                read_string_field(body, &["resourceAccountId", "resource_account_id"]),
                read_string_field(body, &["providerCode", "provider_code"]),
                read_string_field(body, &["authorizationMode", "authorization_mode"]),
                None,
            )
        },
    )
    .await
}

async fn create_webhook_config(
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

    let integration_id = read_string_field(&body, &["integrationId", "integration_id"]);
    let provider_code = read_string_field(&body, &["providerCode", "provider_code"]);
    let webhook_code = read_string_field(&body, &["webhookCode", "webhook_code"]);
    let webhook_kind = read_string_field(&body, &["webhookKind", "webhook_kind"]);
    let callback_url = read_string_field(&body, &["callbackUrl", "callback_url"]);
    let display_name = read_string_field(&body, &["displayName", "display_name"]);
    if integration_id.as_deref().unwrap_or("").is_empty()
        || provider_code.as_deref().unwrap_or("").is_empty()
        || webhook_code.as_deref().unwrap_or("").is_empty()
        || webhook_kind.as_deref().unwrap_or("").is_empty()
        || callback_url.as_deref().unwrap_or("").is_empty()
        || display_name.as_deref().unwrap_or("").is_empty()
    {
        return appbase_error(
            StatusCode::BAD_REQUEST,
            "iam_oauth_webhook_config_invalid",
            "integrationId, providerCode, webhookCode, webhookKind, callbackUrl, and displayName are required",
        );
    }

    let organization_id = organization_id_from_context(&ctx).unwrap_or_else(|| "0".to_owned());
    let id = format!("iamowh-{}", Uuid::new_v4());
    let insert_id = id.clone();
    let now = Utc::now().to_rfc3339();
    let callback_url = callback_url.expect("validated");
    let callback_url_hash = sdkwork_iam_bootstrap::hash_secret_ref(&callback_url);
    let callback_public_id = format!("cb-{}", Uuid::new_v4());
    let integration_id_value = integration_id.as_ref().expect("validated").clone();
    let provider_code_value = provider_code.as_ref().expect("validated").clone();
    let webhook_code_value = webhook_code.as_ref().expect("validated").clone();
    let webhook_kind_value = webhook_kind.as_ref().expect("validated").clone();
    let display_name_value = display_name.as_ref().expect("validated").clone();
    let callback_url_value = callback_url.clone();
    let tenant_id_insert = tenant_id.clone();

    oauth_commit_create(
        &state,
        &ctx,
        pg,
        &id,
        &WEBHOOK_CONFIGS,
        json!({}),
        |tx| Box::pin(async move {
            let tenant_id = tenant_id_insert.clone();
            let organization_id = organization_id.clone();
            let integration_id_value = integration_id_value.clone();
            let provider_code_value = provider_code_value.clone();
            let webhook_code_value = webhook_code_value.clone();
            let webhook_kind_value = webhook_kind_value.clone();
            let display_name_value = display_name_value.clone();
            let callback_url_value = callback_url_value.clone();
            let callback_url_hash = callback_url_hash.clone();
            let callback_public_id = callback_public_id.clone();
            let now = now.clone();
            
                sqlx::query(
                    "INSERT INTO iam_oauth_webhook_config \
                        (id, uuid, tenant_id, organization_id, integration_id, provider_code, webhook_code, webhook_kind, display_name, \
                         callback_url, callback_url_hash, callback_public_id, verification_token_status, encoding_aes_key_status, \
                         encryption_mode, message_handling_mode, status, created_at, updated_at) \
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'missing', 'missing', 'plain', 'ack_only', 'active', $13, $13)",
                )
                .bind(&insert_id)
                .bind(Uuid::new_v4().to_string())
                .bind(&tenant_id)
                .bind(&organization_id)
                .bind(&integration_id_value)
                .bind(&provider_code_value)
                .bind(&webhook_code_value)
                .bind(&webhook_kind_value)
                .bind(&display_name_value)
                .bind(&callback_url_value)
                .bind(&callback_url_hash)
                .bind(&callback_public_id)
                .bind(&now)
                .execute(&mut **tx)
                .await
                .map(|_| ())
            }),
    )
    .await
}

async fn create_operational_resource(
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

    let integration_id = read_string_field(&body, &["integrationId", "integration_id"]);
    let resource_account_id =
        read_string_field(&body, &["resourceAccountId", "resource_account_id"]);
    let provider_code = read_string_field(&body, &["providerCode", "provider_code"]);
    let resource_kind = read_string_field(&body, &["resourceKind", "resource_kind"]);
    let resource_code = read_string_field(&body, &["resourceCode", "resource_code"]);
    let display_name = read_string_field(&body, &["displayName", "display_name"]);
    if integration_id.as_deref().unwrap_or("").is_empty()
        || resource_account_id.as_deref().unwrap_or("").is_empty()
        || provider_code.as_deref().unwrap_or("").is_empty()
        || resource_kind.as_deref().unwrap_or("").is_empty()
        || resource_code.as_deref().unwrap_or("").is_empty()
        || display_name.as_deref().unwrap_or("").is_empty()
    {
        return appbase_error(
            StatusCode::BAD_REQUEST,
            "iam_oauth_operational_resource_invalid",
            "integrationId, resourceAccountId, providerCode, resourceKind, resourceCode, and displayName are required",
        );
    }

    let organization_id = organization_id_from_context(&ctx).unwrap_or_else(|| "0".to_owned());
    let id = format!("iamoor-{}", Uuid::new_v4());
    let insert_id = id.clone();
    let now = Utc::now().to_rfc3339();
    let integration_id_value = integration_id.as_ref().expect("validated").clone();
    let resource_account_id_value = resource_account_id.as_ref().expect("validated").clone();
    let provider_code_value = provider_code.as_ref().expect("validated").clone();
    let resource_kind_value = resource_kind.as_ref().expect("validated").clone();
    let resource_code_value = resource_code.as_ref().expect("validated").clone();
    let display_name_value = display_name.as_ref().expect("validated").clone();
    let tenant_id_insert = tenant_id.clone();

    oauth_commit_create(
        &state,
        &ctx,
        pg,
        &id,
        &OPERATIONAL_RESOURCES,
        json!({}),
        |tx| Box::pin(async move {
            let tenant_id = tenant_id_insert.clone();
            let organization_id = organization_id.clone();
            let integration_id_value = integration_id_value.clone();
            let resource_account_id_value = resource_account_id_value.clone();
            let provider_code_value = provider_code_value.clone();
            let resource_kind_value = resource_kind_value.clone();
            let resource_code_value = resource_code_value.clone();
            let display_name_value = display_name_value.clone();
            let now = now.clone();
            
                sqlx::query(
                    "INSERT INTO iam_oauth_operational_resource \
                        (id, uuid, tenant_id, organization_id, integration_id, resource_account_id, provider_code, resource_kind, \
                         resource_code, display_name, sync_mode, publish_status, status, created_at, updated_at) \
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'manual', 'draft', 'active', $11, $11)",
                )
                .bind(&insert_id)
                .bind(Uuid::new_v4().to_string())
                .bind(&tenant_id)
                .bind(&organization_id)
                .bind(&integration_id_value)
                .bind(&resource_account_id_value)
                .bind(&provider_code_value)
                .bind(&resource_kind_value)
                .bind(&resource_code_value)
                .bind(&display_name_value)
                .bind(&now)
                .execute(&mut **tx)
                .await
                .map(|_| ())
            }),
    )
    .await
}

async fn generic_integration_child_create<F>(
    state: &BackendIamState,
    ctx: &WebRequestContext,
    body: &Value,
    id_prefix: &str,
    spec: &TenantResourceSpec,
    required_count: usize,
    validation_message: &str,
    sql: &str,
    read_fields: F,
) -> Response
where
    F: Fn(
        &Value,
    ) -> (
        Option<String>,
        Option<String>,
        Option<String>,
        Option<String>,
        Option<String>,
    ),
{
    let Ok(pg) = postgres_pool_or_error(state) else {
        return postgres_pool_or_error(state).err().expect("error response");
    };
    let Ok(tenant_id) = tenant_id_from_context(ctx) else {
        return tenant_id_from_context(ctx).err().expect("error response");
    };

    let values = {
        let (f1, f2, f3, f4, f5) = read_fields(body);
        [f1, f2, f3, f4, f5]
    };
    if values
        .iter()
        .take(required_count)
        .any(|value| value.as_deref().is_none_or(str::is_empty))
    {
        return appbase_error(StatusCode::BAD_REQUEST, spec.list_error, validation_message);
    }

    let (f1, f2, f3, f4, f5) = (
        values[0].clone(),
        values[1].clone(),
        values[2].clone(),
        values[3].clone(),
        values[4].clone(),
    );
    let organization_id = organization_id_from_context(ctx).unwrap_or_else(|| "0".to_owned());
    let integration_id = read_string_field(body, &["integrationId", "integration_id"]);
    let id = format!("{id_prefix}-{}", Uuid::new_v4());
    let insert_id = id.clone();
    let now = Utc::now().to_rfc3339();
    let sql_owned = sql.to_owned();
    let tenant_id_insert = tenant_id.clone();

    oauth_commit_create(state, ctx, pg, &id, spec, json!({}), |tx| {
        Box::pin(async move {
            let sql = sql_owned.clone();
            let tenant_id = tenant_id_insert.clone();
            let organization_id = organization_id.clone();
            let integration_id = integration_id.clone();
            let f1 = f1.clone();
            let f2 = f2.clone();
            let f3 = f3.clone();
            let f4 = f4.clone();
            let f5 = f5.clone();
            let now = now.clone();

            match sql.as_str() {
                s if s.contains("iam_oauth_scope_profile") => {
                    sqlx::query(s)
                        .bind(&insert_id)
                        .bind(Uuid::new_v4().to_string())
                        .bind(&tenant_id)
                        .bind(&organization_id)
                        .bind(integration_id.as_ref().or(f1.as_ref()).expect("validated"))
                        .bind(f2.as_ref().expect("validated"))
                        .bind(f3.as_ref().expect("validated"))
                        .bind(f4.as_ref().expect("validated"))
                        .bind(f5.as_ref().expect("validated"))
                        .bind(&now)
                        .execute(&mut **tx)
                        .await
                }
                s if s.contains("iam_oauth_claim_mapping") => {
                    sqlx::query(s)
                        .bind(&insert_id)
                        .bind(Uuid::new_v4().to_string())
                        .bind(&tenant_id)
                        .bind(&organization_id)
                        .bind(f1.as_ref().expect("validated"))
                        .bind(f2.as_ref().expect("validated"))
                        .bind(f3.as_ref().expect("validated"))
                        .bind(f4.as_ref().expect("validated"))
                        .bind(f5.as_ref().expect("validated"))
                        .bind(&now)
                        .execute(&mut **tx)
                        .await
                }
                _ => {
                    sqlx::query(&sql)
                        .bind(&insert_id)
                        .bind(Uuid::new_v4().to_string())
                        .bind(&tenant_id)
                        .bind(&organization_id)
                        .bind(f1.as_ref().expect("validated"))
                        .bind(f2.as_ref().expect("validated"))
                        .bind(f3.as_ref().expect("validated"))
                        .bind(f4.as_ref().or(f5.as_ref()).expect("validated"))
                        .bind(&now)
                        .execute(&mut **tx)
                        .await
                }
            }
            .map(|_| ())
        })
    })
    .await
}
