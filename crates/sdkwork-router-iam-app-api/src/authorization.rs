use sqlx::{PgPool, Row};

use sdkwork_iam_bootstrap::{
    resolve_session_scopes as bootstrap_resolve_session_scopes,
    resolve_standard_role_codes as bootstrap_resolve_standard_role_codes,
};
use sdkwork_iam_context_service::{IamAppContext, IamUserSurface};

/// Resolve `data_scope`, `permission_scope`, user surface, and standard role codes for a session.
pub(crate) async fn resolve_session_authorization(
    pg: &PgPool,
    tenant_id: &str,
    user_id: &str,
    organization_id: Option<&str>,
) -> Result<(Vec<String>, Vec<String>, IamUserSurface, Vec<String>), String> {
    let user_surface = resolve_user_surface(pg, tenant_id, user_id).await?;
    let (data_scope, permission_scope) =
        bootstrap_resolve_session_scopes(pg, tenant_id, user_id, organization_id).await?;
    let standard_role_codes =
        bootstrap_resolve_standard_role_codes(pg, tenant_id, user_id, organization_id).await?;
    Ok((
        data_scope,
        permission_scope,
        user_surface,
        standard_role_codes,
    ))
}

pub(crate) fn enrich_app_context(
    context: IamAppContext,
    user_surface: IamUserSurface,
    standard_role_codes: Vec<String>,
) -> IamAppContext {
    IamAppContext {
        user_surface,
        standard_role_codes,
        ..context
    }
}

pub(crate) async fn resolve_user_surface(
    pg: &PgPool,
    tenant_id: &str,
    user_id: &str,
) -> Result<IamUserSurface, String> {
    let app = sqlx::query_scalar::<_, bool>(
        "SELECT EXISTS( \
            SELECT 1 FROM iam_tenant_member \
            WHERE tenant_id = $1 AND user_id = $2 AND status = 'active' \
         )",
    )
    .bind(tenant_id)
    .bind(user_id)
    .fetch_one(pg)
    .await
    .map_err(|error| format!("resolve app user surface failed: {error}"))?;

    let organization_member = sqlx::query_scalar::<_, bool>(
        "SELECT EXISTS( \
            SELECT 1 FROM iam_organization_membership \
            WHERE tenant_id = $1 AND user_id = $2 AND status = 'active' \
         )",
    )
    .bind(tenant_id)
    .bind(user_id)
    .fetch_one(pg)
    .await
    .map_err(|error| format!("resolve organization member surface failed: {error}"))?;

    Ok(IamUserSurface {
        app,
        organization_member,
    })
}

pub(crate) fn session_has_permission(
    session: &crate::state::LocalSession,
    permission: &str,
) -> bool {
    sdkwork_iam_context_service::has_permission_in_scope(
        &session.context.permission_scope,
        permission,
    )
}

pub(crate) fn session_has_any_permission(
    session: &crate::state::LocalSession,
    permissions: &[&str],
) -> bool {
    permissions
        .iter()
        .any(|permission| session_has_permission(session, permission))
}

pub(crate) async fn resolve_session_organization_for_user(
    pg: &PgPool,
    tenant_id: &str,
    user_id: &str,
    organization_id: Option<&str>,
    organization_code: Option<&str>,
) -> Result<Option<String>, String> {
    let row = match (organization_id, organization_code) {
        (Some(organization_id), _) => {
            sqlx::query(
                "SELECT o.id \
                 FROM iam_organization o \
                 JOIN iam_organization_membership m \
                   ON m.tenant_id = o.tenant_id \
                  AND m.organization_id = o.id \
                  AND m.user_id = $3 \
                  AND m.status = 'active' \
                 WHERE o.tenant_id = $1 AND o.id = $2 AND o.status = 'active' \
                 LIMIT 1",
            )
            .bind(tenant_id)
            .bind(organization_id)
            .bind(user_id)
            .fetch_optional(pg)
            .await
        }
        (None, Some(organization_code)) => {
            sqlx::query(
                "SELECT o.id \
                 FROM iam_organization o \
                 JOIN iam_organization_membership m \
                   ON m.tenant_id = o.tenant_id \
                  AND m.organization_id = o.id \
                  AND m.user_id = $3 \
                  AND m.status = 'active' \
                 WHERE o.tenant_id = $1 AND o.code = $2 AND o.status = 'active' \
                 ORDER BY o.updated_at DESC NULLS LAST, o.id DESC \
                 LIMIT 1",
            )
            .bind(tenant_id)
            .bind(organization_code)
            .bind(user_id)
            .fetch_optional(pg)
            .await
        }
        (None, None) => return Ok(None),
    }
    .map_err(|error| format!("resolve session organization failed: {error}"))?;

    Ok(row.map(|row| row.get::<String, _>(0)))
}
