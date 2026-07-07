//! Backend-api mutation audit writers (SECURITY_SPEC §4).

use std::future::Future;
use std::pin::Pin;

use sdkwork_web_core::{WebEnvironment, WebRequestContext};
use serde_json::Value;
use sqlx::{PgPool, Postgres, Transaction};

use crate::handlers::{
    actor_user_id_from_context, organization_id_from_context, tenant_id_from_context,
};

type TxMutationFuture<'a, T> = Pin<Box<dyn Future<Output = Result<T, sqlx::Error>> + Send + 'a>>;

pub(crate) async fn execute_mutation_with_audit<T, F>(
    pg: &PgPool,
    ctx: &WebRequestContext,
    action: &str,
    resource_type: &str,
    resource_id: String,
    detail: Value,
    mutate: F,
) -> Result<T, String>
where
    F: for<'a> FnOnce(&'a mut Transaction<'_, Postgres>) -> TxMutationFuture<'a, T>,
{
    let mut tx = pg.begin().await.map_err(|error| error.to_string())?;
    let outcome = mutate(&mut tx).await.map_err(|error| error.to_string())?;
    record_backend_mutation_audit_with_executor(
        &mut *tx,
        ctx,
        action,
        resource_type,
        &resource_id,
        detail,
    )
    .await?;
    tx.commit().await.map_err(|error| error.to_string())?;
    Ok(outcome)
}

pub(crate) async fn execute_conditional_mutation_with_audit<T, F>(
    pg: &PgPool,
    ctx: &WebRequestContext,
    action: &str,
    resource_type: &str,
    resource_id: String,
    detail: Value,
    mutate: F,
    should_audit: impl FnOnce(&T) -> bool,
) -> Result<T, String>
where
    F: for<'a> FnOnce(&'a mut Transaction<'_, Postgres>) -> TxMutationFuture<'a, T>,
{
    let mut tx = pg.begin().await.map_err(|error| error.to_string())?;
    let outcome = mutate(&mut tx).await.map_err(|error| error.to_string())?;
    if should_audit(&outcome) {
        record_backend_mutation_audit_with_executor(
            &mut *tx,
            ctx,
            action,
            resource_type,
            &resource_id,
            detail,
        )
        .await?;
    }
    tx.commit().await.map_err(|error| error.to_string())?;
    Ok(outcome)
}

pub(crate) async fn directory_create_with_audit<F>(
    pg: &PgPool,
    ctx: &WebRequestContext,
    table: &str,
    resource_id: String,
    detail: Value,
    insert: F,
) -> Result<(), String>
where
    F: for<'a> FnOnce(&'a mut Transaction<'_, Postgres>) -> TxMutationFuture<'a, ()>,
{
    execute_mutation_with_audit(
        pg,
        ctx,
        &format!("{table}.create"),
        table,
        resource_id,
        detail,
        insert,
    )
    .await
}

pub(crate) async fn record_backend_mutation_audit_tx<'e, E>(
    executor: E,
    ctx: &WebRequestContext,
    action: &str,
    resource_type: &str,
    resource_id: &str,
    detail: Value,
) -> Result<(), String>
where
    E: sqlx::Executor<'e, Database = sqlx::Postgres>,
{
    record_backend_mutation_audit_with_executor(
        executor,
        ctx,
        action,
        resource_type,
        resource_id,
        detail,
    )
    .await
}

async fn record_backend_mutation_audit_with_executor<'e, E>(
    executor: E,
    ctx: &WebRequestContext,
    action: &str,
    resource_type: &str,
    resource_id: &str,
    detail: Value,
) -> Result<(), String>
where
    E: sqlx::Executor<'e, Database = sqlx::Postgres>,
{
    let Ok(tenant_id) = tenant_id_from_context(ctx) else {
        tracing::warn!(
            action = %action,
            resource_type = %resource_type,
            resource_id = %resource_id,
            request_id = %ctx.request_id.0,
            "backend mutation audit skipped: tenant context missing"
        );
        return Ok(());
    };
    let environment = backend_environment_label(ctx);
    sdkwork_iam_web_adapter::record_audit_event_tx(
        executor,
        &tenant_id,
        organization_id_from_context(ctx).as_deref(),
        actor_user_id_from_context(ctx).as_deref(),
        action,
        resource_type,
        Some(resource_id),
        Some(ctx.request_id.0.as_str()),
        &environment,
        detail,
    )
    .await
    .map_err(|error| {
        tracing::error!(
            %error,
            tenant_id = %tenant_id,
            action = %action,
            resource_type = %resource_type,
            resource_id = %resource_id,
            "backend mutation audit write failed"
        );
        error
    })
}

fn backend_environment_label(ctx: &WebRequestContext) -> String {
    let label = ctx
        .principal()
        .map(|principal| match principal.app.environment {
            WebEnvironment::Dev => "dev",
            WebEnvironment::Test => "test",
            WebEnvironment::Prod => "prod",
        })
        .unwrap_or("prod");
    sdkwork_iam_web_adapter::backend_environment_from_context(Some(label))
}
