//! OAuth admin handlers for backend-api (`iam.oauth.*` operations).

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

use crate::backend_audit::{directory_create_with_audit, execute_conditional_mutation_with_audit};
use crate::backend_sql::{
    internal_handler_error, list_page_params_or_error, list_search_pattern, list_tenant_rows,
    page_json_from_rows, patch_tenant_row_tx, read_i32_field, read_string_field,
    retrieve_tenant_row, row_to_json_with_aliases, LIST_TOTAL_COLUMN,
};
use crate::handlers::{
    appbase_error, appbase_ok, organization_id_from_context, postgres_pool_or_error,
    tenant_id_from_context, BackendIamState,
};

struct TenantResourceSpec {
    columns: &'static [&'static str],
    id_aliases: &'static [(&'static str, &'static str)],
    list_error: &'static str,
    list_order: &'static str,
    list_select: &'static str,
    retrieve_error: &'static str,
    table: &'static str,
}

const INTEGRATIONS: TenantResourceSpec = TenantResourceSpec {
    table: "iam_oauth_integration",
    list_select: "id, tenant_id, organization_id, provider_code, integration_code, display_name, status, enabled, health_status, created_at, updated_at",
    list_order: "display_name, id",
    list_error: "iam_oauth_integrations_list_failed",
    retrieve_error: "iam_oauth_integration_retrieve_failed",
    columns: &[
        "id",
        "tenant_id",
        "organization_id",
        "provider_code",
        "integration_code",
        "display_name",
        "status",
        "enabled",
        "health_status",
        "created_at",
        "updated_at",
    ],
    id_aliases: &[("integrationId", "id")],
};

const CLIENTS: TenantResourceSpec = TenantResourceSpec {
    table: "iam_oauth_client",
    list_select: "id, tenant_id, integration_id, provider_code, client_code, display_name, provider_client_id, status, enabled, created_at, updated_at",
    list_order: "display_name, id",
    list_error: "iam_oauth_clients_list_failed",
    retrieve_error: "iam_oauth_clients_retrieve_failed",
    columns: &[
        "id",
        "tenant_id",
        "integration_id",
        "provider_code",
        "client_code",
        "display_name",
        "provider_client_id",
        "status",
        "enabled",
        "created_at",
        "updated_at",
    ],
    id_aliases: &[("oauthClientId", "id")],
};

const SECRETS: TenantResourceSpec = TenantResourceSpec {
    table: "iam_oauth_secret",
    list_select: "id, tenant_id, secret_owner_kind, secret_owner_id, secret_kind, status, active_from, active_until, created_at, updated_at",
    list_order: "created_at DESC, id",
    list_error: "iam_oauth_secrets_list_failed",
    retrieve_error: "iam_oauth_secrets_retrieve_failed",
    columns: &[
        "id",
        "tenant_id",
        "secret_owner_kind",
        "secret_owner_id",
        "secret_kind",
        "status",
        "active_from",
        "active_until",
        "created_at",
        "updated_at",
    ],
    id_aliases: &[("secretId", "id")],
};

const SURFACES: TenantResourceSpec = TenantResourceSpec {
    table: "iam_oauth_surface",
    list_select: "id, tenant_id, integration_id, oauth_client_id, surface_kind, surface_code, display_name, status, enabled, created_at, updated_at",
    list_order: "display_name, id",
    list_error: "iam_oauth_surfaces_list_failed",
    retrieve_error: "iam_oauth_surfaces_retrieve_failed",
    columns: &[
        "id",
        "tenant_id",
        "integration_id",
        "oauth_client_id",
        "surface_kind",
        "surface_code",
        "display_name",
        "status",
        "enabled",
        "created_at",
        "updated_at",
    ],
    id_aliases: &[("surfaceId", "id")],
};

const FLOW_CONFIGS: TenantResourceSpec = TenantResourceSpec {
    table: "iam_oauth_flow_config",
    list_select: "id, tenant_id, integration_id, oauth_client_id, flow_kind, flow_purpose, status, enabled, created_at, updated_at",
    list_order: "flow_kind, id",
    list_error: "iam_oauth_flow_configs_list_failed",
    retrieve_error: "iam_oauth_flow_configs_retrieve_failed",
    columns: &[
        "id",
        "tenant_id",
        "integration_id",
        "oauth_client_id",
        "flow_kind",
        "flow_purpose",
        "status",
        "enabled",
        "created_at",
        "updated_at",
    ],
    id_aliases: &[("flowConfigId", "id")],
};

const SCOPE_PROFILES: TenantResourceSpec = TenantResourceSpec {
    table: "iam_oauth_scope_profile",
    list_select: "id, tenant_id, integration_id, provider_code, scope_profile_code, display_name, status, created_at, updated_at",
    list_order: "display_name, id",
    list_error: "iam_oauth_scope_profiles_list_failed",
    retrieve_error: "iam_oauth_scope_profiles_retrieve_failed",
    columns: &[
        "id",
        "tenant_id",
        "integration_id",
        "provider_code",
        "scope_profile_code",
        "display_name",
        "status",
        "created_at",
        "updated_at",
    ],
    id_aliases: &[("scopeProfileId", "id")],
};

const CLAIM_MAPPINGS: TenantResourceSpec = TenantResourceSpec {
    table: "iam_oauth_claim_mapping",
    list_select: "id, tenant_id, integration_id, provider_code, external_claim, target_kind, target_field, status, created_at, updated_at",
    list_order: "external_claim, id",
    list_error: "iam_oauth_claim_mappings_list_failed",
    retrieve_error: "iam_oauth_claim_mappings_retrieve_failed",
    columns: &[
        "id",
        "tenant_id",
        "integration_id",
        "provider_code",
        "external_claim",
        "target_kind",
        "target_field",
        "status",
        "created_at",
        "updated_at",
    ],
    id_aliases: &[("mappingId", "id")],
};

const OAUTH_POLICIES: TenantResourceSpec = TenantResourceSpec {
    table: "iam_oauth_policy",
    list_select:
        "id, tenant_id, integration_id, policy_code, display_name, status, created_at, updated_at",
    list_order: "display_name, id",
    list_error: "iam_oauth_policies_list_failed",
    retrieve_error: "iam_oauth_policies_retrieve_failed",
    columns: &[
        "id",
        "tenant_id",
        "integration_id",
        "policy_code",
        "display_name",
        "status",
        "created_at",
        "updated_at",
    ],
    id_aliases: &[("policyId", "id")],
};

const TENANT_BINDINGS: TenantResourceSpec = TenantResourceSpec {
    table: "iam_oauth_tenant_binding",
    list_select: "id, tenant_id, provider_code, integration_id, binding_kind, external_tenant_id, status, created_at, updated_at",
    list_order: "created_at DESC, id",
    list_error: "iam_oauth_tenant_bindings_list_failed",
    retrieve_error: "iam_oauth_tenant_bindings_retrieve_failed",
    columns: &[
        "id",
        "tenant_id",
        "provider_code",
        "integration_id",
        "binding_kind",
        "external_tenant_id",
        "status",
        "created_at",
        "updated_at",
    ],
    id_aliases: &[("bindingId", "id")],
};

const OPERATOR_PLATFORMS: TenantResourceSpec = TenantResourceSpec {
    table: "iam_oauth_operator_platform",
    list_select: "id, tenant_id, integration_id, provider_code, platform_code, display_name, authorization_status, status, enabled, created_at, updated_at",
    list_order: "display_name, id",
    list_error: "iam_oauth_operator_platforms_list_failed",
    retrieve_error: "iam_oauth_operator_platforms_retrieve_failed",
    columns: &[
        "id",
        "tenant_id",
        "integration_id",
        "provider_code",
        "platform_code",
        "display_name",
        "authorization_status",
        "status",
        "enabled",
        "created_at",
        "updated_at",
    ],
    id_aliases: &[("operatorPlatformId", "id")],
};

const RESOURCE_ACCOUNTS: TenantResourceSpec = TenantResourceSpec {
    table: "iam_oauth_resource_account",
    list_select: "id, tenant_id, integration_id, provider_code, resource_account_code, resource_account_kind, display_name, verification_status, authorization_status, status, enabled, created_at, updated_at",
    list_order: "display_name, id",
    list_error: "iam_oauth_resource_accounts_list_failed",
    retrieve_error: "iam_oauth_resource_accounts_retrieve_failed",
    columns: &[
        "id",
        "tenant_id",
        "integration_id",
        "provider_code",
        "resource_account_code",
        "resource_account_kind",
        "display_name",
        "verification_status",
        "authorization_status",
        "status",
        "enabled",
        "created_at",
        "updated_at",
    ],
    id_aliases: &[("resourceAccountId", "id")],
};

const RESOURCE_AUTHORIZATIONS: TenantResourceSpec = TenantResourceSpec {
    table: "iam_oauth_resource_authorization",
    list_select: "id, tenant_id, integration_id, resource_account_id, provider_code, authorization_mode, status, created_at, updated_at",
    list_order: "created_at DESC, id",
    list_error: "iam_oauth_resource_authorizations_list_failed",
    retrieve_error: "iam_oauth_resource_authorizations_retrieve_failed",
    columns: &[
        "id",
        "tenant_id",
        "integration_id",
        "resource_account_id",
        "provider_code",
        "authorization_mode",
        "status",
        "created_at",
        "updated_at",
    ],
    id_aliases: &[("authorizationId", "id")],
};

const WEBHOOK_CONFIGS: TenantResourceSpec = TenantResourceSpec {
    table: "iam_oauth_webhook_config",
    list_select: "id, tenant_id, integration_id, provider_code, webhook_code, display_name, status, enabled, created_at, updated_at",
    list_order: "display_name, id",
    list_error: "iam_oauth_webhook_configs_list_failed",
    retrieve_error: "iam_oauth_webhook_configs_retrieve_failed",
    columns: &[
        "id",
        "tenant_id",
        "integration_id",
        "provider_code",
        "webhook_code",
        "display_name",
        "status",
        "enabled",
        "created_at",
        "updated_at",
    ],
    id_aliases: &[("webhookConfigId", "id")],
};

const CALLBACK_EVENTS: TenantResourceSpec = TenantResourceSpec {
    table: "iam_oauth_callback_event",
    list_select: "id, tenant_id, provider_code, integration_id, flow_kind, outcome, created_at",
    list_order: "created_at DESC, id",
    list_error: "iam_oauth_callback_events_list_failed",
    retrieve_error: "iam_oauth_callback_events_retrieve_failed",
    columns: &[
        "id",
        "tenant_id",
        "provider_code",
        "integration_id",
        "flow_kind",
        "outcome",
        "created_at",
    ],
    id_aliases: &[],
};

const OPERATIONAL_RESOURCES: TenantResourceSpec = TenantResourceSpec {
    table: "iam_oauth_operational_resource",
    list_select: "id, tenant_id, integration_id, provider_code, resource_code, resource_kind, display_name, publish_status, status, created_at, updated_at",
    list_order: "display_name, id",
    list_error: "iam_oauth_operational_resources_list_failed",
    retrieve_error: "iam_oauth_operational_resources_retrieve_failed",
    columns: &[
        "id",
        "tenant_id",
        "integration_id",
        "provider_code",
        "resource_code",
        "resource_kind",
        "display_name",
        "publish_status",
        "status",
        "created_at",
        "updated_at",
    ],
    id_aliases: &[("resourceId", "id")],
};

const ACCOUNT_LINKS: TenantResourceSpec = TenantResourceSpec {
    table: "iam_oauth_account_link",
    list_select: "id, tenant_id, user_id, provider_code, integration_id, link_source, status, linked_at, created_at, updated_at",
    list_order: "linked_at DESC, id",
    list_error: "iam_oauth_account_links_list_failed",
    retrieve_error: "iam_oauth_account_links_retrieve_failed",
    columns: &[
        "id",
        "tenant_id",
        "user_id",
        "provider_code",
        "integration_id",
        "link_source",
        "status",
        "linked_at",
        "created_at",
        "updated_at",
    ],
    id_aliases: &[("accountLinkId", "id")],
};

const GRANTS: TenantResourceSpec = TenantResourceSpec {
    table: "iam_oauth_grant",
    list_select: "id, tenant_id, provider_code, integration_id, grant_owner_kind, flow_kind, status, issued_at, created_at, updated_at",
    list_order: "created_at DESC, id",
    list_error: "iam_oauth_grants_list_failed",
    retrieve_error: "iam_oauth_grants_retrieve_failed",
    columns: &[
        "id",
        "tenant_id",
        "provider_code",
        "integration_id",
        "grant_owner_kind",
        "flow_kind",
        "status",
        "issued_at",
        "created_at",
        "updated_at",
    ],
    id_aliases: &[("grantId", "id")],
};

const DIAGNOSTIC_RUNS: TenantResourceSpec = TenantResourceSpec {
    table: "iam_oauth_diagnostic_run",
    list_select: "id, tenant_id, provider_code, integration_id, run_kind, status, result_code, result_summary, created_at",
    list_order: "created_at DESC, id",
    list_error: "iam_oauth_diagnostic_runs_list_failed",
    retrieve_error: "iam_oauth_diagnostic_runs_retrieve_failed",
    columns: &[
        "id",
        "tenant_id",
        "provider_code",
        "integration_id",
        "run_kind",
        "status",
        "result_code",
        "result_summary",
        "created_at",
    ],
    id_aliases: &[("diagnosticRunId", "id")],
};

pub fn apply_oauth_routes(router: Router<BackendIamState>) -> Router<BackendIamState> {
    router
        .route(
            "/backend/v3/api/iam/oauth/provider_catalog",
            get(list_provider_catalog).post(create_provider_catalog),
        )
        .route(
            "/backend/v3/api/iam/oauth/provider_catalog/{providerCatalogId}",
            get(retrieve_provider_catalog).patch(update_provider_catalog),
        )
        .route(
            "/backend/v3/api/iam/oauth/integrations",
            get(list_integrations).post(create_integration),
        )
        .route(
            "/backend/v3/api/iam/oauth/integrations/{integrationId}",
            get(retrieve_integration)
                .patch(update_integration)
                .delete(delete_integration),
        )
        .route(
            "/backend/v3/api/iam/oauth/clients",
            get(list_clients).post(create_client),
        )
        .route(
            "/backend/v3/api/iam/oauth/clients/{oauthClientId}",
            get(retrieve_client)
                .patch(update_client)
                .delete(delete_client),
        )
        .route(
            "/backend/v3/api/iam/oauth/secrets",
            get(list_secrets).post(create_secret),
        )
        .route(
            "/backend/v3/api/iam/oauth/secrets/{secretId}",
            delete(delete_secret),
        )
        .route(
            "/backend/v3/api/iam/oauth/surfaces",
            get(list_surfaces).post(create_surface),
        )
        .route(
            "/backend/v3/api/iam/oauth/surfaces/{surfaceId}",
            patch(update_surface).delete(delete_surface),
        )
        .route(
            "/backend/v3/api/iam/oauth/flow_configs",
            get(list_flow_configs).post(create_flow_config),
        )
        .route(
            "/backend/v3/api/iam/oauth/flow_configs/{flowConfigId}",
            patch(update_flow_config),
        )
        .route(
            "/backend/v3/api/iam/oauth/scope_profiles",
            get(list_scope_profiles).post(create_scope_profile),
        )
        .route(
            "/backend/v3/api/iam/oauth/scope_profiles/{scopeProfileId}",
            patch(update_scope_profile),
        )
        .route(
            "/backend/v3/api/iam/oauth/claim_mappings",
            get(list_claim_mappings).post(create_claim_mapping),
        )
        .route(
            "/backend/v3/api/iam/oauth/claim_mappings/{mappingId}",
            patch(update_claim_mapping),
        )
        .route(
            "/backend/v3/api/iam/oauth/policies",
            get(list_oauth_policies).post(create_oauth_policy),
        )
        .route(
            "/backend/v3/api/iam/oauth/policies/{policyId}",
            patch(update_oauth_policy),
        )
        .route(
            "/backend/v3/api/iam/oauth/tenant_bindings",
            get(list_tenant_bindings).post(create_tenant_binding),
        )
        .route(
            "/backend/v3/api/iam/oauth/tenant_bindings/{bindingId}",
            patch(update_tenant_binding),
        )
        .route(
            "/backend/v3/api/iam/oauth/operator_platforms",
            get(list_operator_platforms).post(create_operator_platform),
        )
        .route(
            "/backend/v3/api/iam/oauth/operator_platforms/{operatorPlatformId}",
            patch(update_operator_platform),
        )
        .route(
            "/backend/v3/api/iam/oauth/operator_platforms/{operatorPlatformId}/pre_authorizations",
            post(create_pre_authorization),
        )
        .route(
            "/backend/v3/api/iam/oauth/resource_accounts",
            get(list_resource_accounts).post(create_resource_account),
        )
        .route(
            "/backend/v3/api/iam/oauth/resource_accounts/{resourceAccountId}",
            patch(update_resource_account),
        )
        .route(
            "/backend/v3/api/iam/oauth/resource_accounts/{resourceAccountId}/verifications",
            post(create_resource_account_verification),
        )
        .route(
            "/backend/v3/api/iam/oauth/resource_accounts/{resourceAccountId}/mini_program_login_checks",
            post(create_mini_program_login_check),
        )
        .route(
            "/backend/v3/api/iam/oauth/resource_accounts/{resourceAccountId}/authorization_refreshes",
            post(create_authorization_refresh),
        )
        .route(
            "/backend/v3/api/iam/oauth/resource_authorizations",
            get(list_resource_authorizations).post(create_resource_authorization),
        )
        .route(
            "/backend/v3/api/iam/oauth/resource_authorizations/{authorizationId}",
            patch(update_resource_authorization),
        )
        .route(
            "/backend/v3/api/iam/oauth/webhook_configs",
            get(list_webhook_configs).post(create_webhook_config),
        )
        .route(
            "/backend/v3/api/iam/oauth/webhook_configs/{webhookConfigId}",
            patch(update_webhook_config),
        )
        .route(
            "/backend/v3/api/iam/oauth/webhook_configs/{webhookConfigId}/verifications",
            post(create_webhook_verification),
        )
        .route(
            "/backend/v3/api/iam/oauth/operational_resources",
            get(list_operational_resources).post(create_operational_resource),
        )
        .route(
            "/backend/v3/api/iam/oauth/operational_resources/{resourceId}",
            patch(update_operational_resource).delete(delete_operational_resource),
        )
        .route(
            "/backend/v3/api/iam/oauth/operational_resources/{resourceId}/publishes",
            post(create_operational_resource_publish),
        )
        .route(
            "/backend/v3/api/iam/oauth/account_links",
            get(list_account_links),
        )
        .route(
            "/backend/v3/api/iam/oauth/account_links/{accountLinkId}",
            patch(update_account_link),
        )
        .route(
            "/backend/v3/api/iam/oauth/grants",
            get(list_grants),
        )
        .route(
            "/backend/v3/api/iam/oauth/grants/{grantId}",
            delete(delete_grant),
        )
        .route(
            "/backend/v3/api/iam/oauth/callback_events",
            get(list_callback_events),
        )
        .route(
            "/backend/v3/api/iam/oauth/diagnostic_runs",
            get(list_diagnostic_runs).post(create_diagnostic_run),
        )
        .route(
            "/backend/v3/api/iam/oauth/diagnostic_runs/{diagnosticRunId}",
            get(retrieve_diagnostic_run),
        )
}

include!("oauth_handlers.impl.rs");
