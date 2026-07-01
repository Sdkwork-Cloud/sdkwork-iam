use sdkwork_iam_directory_repository_sqlx::{
    iam_database_baseline_sql, iam_database_tables, IamTables,
};
use std::path::Path;

#[test]
fn exposes_complete_iam_table_catalog() {
    let tables = iam_database_tables();

    assert!(tables.contains(&"iam_tenant"));
    assert!(tables.contains(&"iam_tenant_member"));
    assert!(tables.contains(&"iam_tenant_signing_key"));
    assert!(tables.contains(&"iam_organization"));
    assert!(tables.contains(&"iam_organization_closure"));
    assert!(tables.contains(&"iam_organization_membership"));
    assert!(tables.contains(&"iam_department"));
    assert!(tables.contains(&"iam_department_closure"));
    assert!(tables.contains(&"iam_department_assignment"));
    assert!(tables.contains(&"iam_position"));
    assert!(tables.contains(&"iam_position_assignment"));
    assert!(tables.contains(&"iam_role_binding"));
    assert!(tables.contains(&"iam_user"));
    assert!(tables.contains(&"iam_user_identity"));
    assert!(tables.contains(&"iam_credential"));
    assert!(tables.contains(&"iam_session"));
    assert!(tables.contains(&"iam_mfa_factor"));
    assert!(tables.contains(&"iam_device"));
    assert!(tables.contains(&"iam_role"));
    assert!(tables.contains(&"iam_permission"));
    assert!(tables.contains(&"iam_policy"));
    assert!(tables.contains(&"iam_role_permission"));
    assert!(tables.contains(&"iam_api_key"));
    assert!(tables.contains(&"iam_security_event"));
    assert!(tables.contains(&"iam_audit_event"));
    assert!(tables.contains(&"iam_ephemeral_artifact"));
    assert!(tables.contains(&"iam_application_template"));
    assert!(tables.contains(&"iam_application_template_package"));
    assert!(tables.contains(&"iam_tenant_application"));
    assert!(tables.contains(&"iam_module_registry_entry"));
    assert!(tables.contains(&"iam_module_registry_snapshot"));
    assert!(tables.contains(&"iam_catalog_materialization"));
    assert!(tables.contains(&"iam_group"));
    assert!(tables.contains(&"iam_group_member"));
    assert!(tables.contains(&"iam_service_account"));
    assert!(tables.contains(&"iam_role_exclusion"));
    assert_eq!(57, tables.len(), "IAM catalog must own 57 canonical tables");
    assert!(!tables.contains(&"iam_user_role"));

    for table in tables {
        assert!(table.starts_with("iam_"));
        assert!(!table.contains("__"));
        assert!(!table.starts_with("uc_"));
        assert_ne!(table, "iam_accounts");
        assert_ne!(table, "iam_department_member");
        assert_ne!(table, "iam_department_members");
        assert_ne!(table, "iam_organization_member");
        assert_ne!(table, "iam_user_role");
    }
}

#[test]
fn exposes_canonical_iam_table_constants() {
    assert_eq!("iam_tenant", IamTables::TENANT);
    assert_eq!("iam_tenant_member", IamTables::TENANT_MEMBER);
    assert_eq!("iam_tenant_signing_key", IamTables::TENANT_SIGNING_KEY);
    assert_eq!("iam_organization", IamTables::ORGANIZATION);
    assert_eq!("iam_organization_closure", IamTables::ORGANIZATION_CLOSURE);
    assert_eq!(
        "iam_organization_membership",
        IamTables::ORGANIZATION_MEMBERSHIP
    );
    assert_eq!("iam_department", IamTables::DEPARTMENT);
    assert_eq!("iam_department_closure", IamTables::DEPARTMENT_CLOSURE);
    assert_eq!(
        "iam_department_assignment",
        IamTables::DEPARTMENT_ASSIGNMENT
    );
    assert_eq!("iam_position", IamTables::POSITION);
    assert_eq!("iam_position_assignment", IamTables::POSITION_ASSIGNMENT);
    assert_eq!("iam_role_binding", IamTables::ROLE_BINDING);
    assert_eq!("iam_user", IamTables::USER);
    assert_eq!("iam_user_identity", IamTables::USER_IDENTITY);
    assert_eq!("iam_credential", IamTables::CREDENTIAL);
    assert_eq!("iam_ephemeral_artifact", IamTables::EPHEMERAL_ARTIFACT);
    assert_eq!("iam_application_template", IamTables::APPLICATION_TEMPLATE);
    assert_eq!(
        "iam_application_template_package",
        IamTables::APPLICATION_TEMPLATE_PACKAGE
    );
    assert_eq!("iam_tenant_application", IamTables::TENANT_APPLICATION);
    assert_eq!(
        "iam_module_registry_entry",
        IamTables::MODULE_REGISTRY_ENTRY
    );
    assert_eq!(
        "iam_module_registry_snapshot",
        IamTables::MODULE_REGISTRY_SNAPSHOT
    );
    assert_eq!(
        "iam_catalog_materialization",
        IamTables::CATALOG_MATERIALIZATION
    );
    assert_eq!("iam_group", IamTables::GROUP);
    assert_eq!("iam_group_member", IamTables::GROUP_MEMBER);
    assert_eq!("iam_service_account", IamTables::SERVICE_ACCOUNT);
    assert_eq!("iam_role_exclusion", IamTables::ROLE_EXCLUSION);
}

#[test]
fn storage_contract_does_not_publish_default_bootstrap_data() {
    let source = include_str!("../src/lib.rs");

    for forbidden_fragment in [
        "DEFAULT_IAM_TENANT",
        "DEFAULT_IAM_ORGANIZATION",
        "DEFAULT_BOOTSTRAP_ADMIN",
        "IamBootstrapSubject",
        "Default Tenant",
        "Root Organization",
        "admin@sdkwork.com",
    ] {
        assert!(
            !source.contains(forbidden_fragment),
            "{forbidden_fragment} must not be published by the IAM storage contract.",
        );
    }
}

#[test]
fn storage_contract_does_not_embed_deprecated_crate_migrations() {
    let source = include_str!("../src/lib.rs");

    assert!(
        !source.contains("../migrations/"),
        "IAM storage contract must not embed crate-local migration SQL",
    );
    assert!(
        source.contains("database/ddl/baseline/postgres/0001_iam_baseline.sql"),
        "IAM storage contract must embed application-root database baseline DDL",
    );
}

#[test]
fn database_baseline_declares_context_and_audit_columns() {
    let sql = iam_database_baseline_sql();
    let session_table = table_definition(sql, "iam_session").expect("iam_session table");

    assert!(sql.contains("CREATE TABLE IF NOT EXISTS iam_session"));
    for column in [
        "tenant_id",
        "organization_id",
        "login_scope",
        "auth_token_hash",
        "auth_token_kid",
        "access_token_hash",
        "access_token_kid",
        "refresh_token_hash",
        "refresh_token_kid",
        "sharding_key",
        "permission_scope_json",
        "data_scope_json",
    ] {
        assert!(
            session_table.contains(column),
            "iam_session must declare session context/signing column {column}",
        );
    }
    assert!(sql.contains("CREATE TABLE IF NOT EXISTS iam_audit_event"));
}

#[test]
fn database_baseline_declares_tenant_membership_and_signing_key_tables() {
    let sql = iam_database_baseline_sql();
    let tenant_member_table =
        table_definition(sql, "iam_tenant_member").expect("iam_tenant_member table");
    let tenant_signing_key_table =
        table_definition(sql, "iam_tenant_signing_key").expect("iam_tenant_signing_key table");

    for column in [
        "tenant_id",
        "user_id",
        "member_kind",
        "status",
        "joined_at",
        "left_at",
        "created_at",
        "updated_at",
    ] {
        assert!(
            tenant_member_table.contains(column),
            "iam_tenant_member must declare tenant membership column {column}",
        );
    }

    for column in [
        "tenant_id",
        "kid",
        "alg",
        "secret_ref",
        "secret_hash",
        "status",
        "active_from",
        "active_until",
        "rotated_at",
        "created_at",
        "updated_at",
    ] {
        assert!(
            tenant_signing_key_table.contains(column),
            "iam_tenant_signing_key must declare tenant signing key column {column}",
        );
    }
}

#[test]
fn database_baseline_declares_mature_organization_hierarchy_and_membership_tables() {
    let sql = iam_database_baseline_sql();
    let organization_table =
        table_definition(sql, "iam_organization").expect("iam_organization table");
    let organization_closure_table =
        table_definition(sql, "iam_organization_closure").expect("iam_organization_closure table");
    let organization_membership_table = table_definition(sql, "iam_organization_membership")
        .expect("iam_organization_membership table");

    for column in [
        "parent_organization_id",
        "organization_kind",
        "tenant_boundary_kind",
        "data_boundary_kind",
        "app_boundary_enabled",
        "verification_status",
        "path",
        "status",
    ] {
        assert!(
            organization_table.contains(column),
            "iam_organization must declare mature organization column {column}",
        );
    }

    for column in [
        "ancestor_organization_id",
        "descendant_organization_id",
        "depth",
    ] {
        assert!(
            organization_closure_table.contains(column),
            "iam_organization_closure must declare hierarchy column {column}",
        );
    }

    for column in [
        "organization_id",
        "user_id",
        "membership_kind",
        "employee_no",
        "display_name",
        "status",
        "is_primary",
        "joined_at",
        "left_at",
        "remark",
    ] {
        assert!(
            organization_membership_table.contains(column),
            "iam_organization_membership must declare membership column {column}",
        );
    }

    assert!(
        table_definition(sql, "iam_organization_member").is_none(),
        "iam_organization_member must not remain as the canonical organization personnel table",
    );
}

#[test]
fn database_baseline_removes_legacy_organization_member_table() {
    let sql = iam_database_baseline_sql();

    assert!(
        sql.contains("DROP TABLE IF EXISTS iam_organization_member"),
        "IAM database baseline must explicitly remove the legacy iam_organization_member table",
    );
    assert!(
        table_definition(sql, "iam_organization_member").is_none(),
        "IAM database baseline must never recreate the legacy iam_organization_member table",
    );
}

#[test]
fn database_baseline_declares_department_position_and_role_binding_tables() {
    let sql = iam_database_baseline_sql();
    let department_table = table_definition(sql, "iam_department").expect("iam_department table");
    let department_closure_table =
        table_definition(sql, "iam_department_closure").expect("iam_department_closure table");
    let department_assignment_table = table_definition(sql, "iam_department_assignment")
        .expect("iam_department_assignment table");
    let position_table = table_definition(sql, "iam_position").expect("iam_position table");
    let position_assignment_table =
        table_definition(sql, "iam_position_assignment").expect("iam_position_assignment table");
    let role_binding_table =
        table_definition(sql, "iam_role_binding").expect("iam_role_binding table");

    for column in [
        "organization_id",
        "parent_department_id",
        "department_kind",
        "manager_membership_id",
        "path",
        "status",
    ] {
        assert!(
            department_table.contains(column),
            "iam_department must declare department column {column}",
        );
    }

    for column in [
        "organization_id",
        "ancestor_department_id",
        "descendant_department_id",
        "depth",
    ] {
        assert!(
            department_closure_table.contains(column),
            "iam_department_closure must declare hierarchy column {column}",
        );
    }

    for column in [
        "organization_id",
        "organization_membership_id",
        "department_id",
        "user_id",
        "assignment_kind",
        "is_primary",
        "effective_from",
        "effective_to",
        "status",
    ] {
        assert!(
            department_assignment_table.contains(column),
            "iam_department_assignment must declare assignment column {column}",
        );
    }

    for column in [
        "organization_id",
        "department_id",
        "position_kind",
        "rank_level",
        "status",
    ] {
        assert!(
            position_table.contains(column),
            "iam_position must declare position column {column}",
        );
    }

    for column in [
        "organization_id",
        "department_assignment_id",
        "position_id",
        "user_id",
        "is_primary",
        "effective_from",
        "effective_to",
        "status",
    ] {
        assert!(
            position_assignment_table.contains(column),
            "iam_position_assignment must declare assignment column {column}",
        );
    }

    for column in [
        "organization_id",
        "role_id",
        "principal_kind",
        "principal_id",
        "scope_kind",
        "scope_id",
        "effect",
        "condition_json",
        "status",
    ] {
        assert!(
            role_binding_table.contains(column),
            "iam_role_binding must declare scoped RBAC column {column}",
        );
    }
}

#[test]
fn database_baseline_declares_organization_context_for_sensitive_iam_tables() {
    let sql = iam_database_baseline_sql();
    let role_binding_table =
        table_definition(sql, "iam_role_binding").expect("iam_role_binding table");
    let api_key_table = table_definition(sql, "iam_api_key").expect("iam_api_key table");
    let security_event_table =
        table_definition(sql, "iam_security_event").expect("iam_security_event table");

    for (table_name, table_sql) in [
        ("iam_role_binding", role_binding_table),
        ("iam_api_key", api_key_table),
        ("iam_security_event", security_event_table),
    ] {
        assert!(
            table_sql.contains("organization_id"),
            "{table_name} must declare organization_id for SDKWork AppContext isolation",
        );
    }
}

#[test]
fn database_baseline_declares_standard_query_indexes() {
    let sql = iam_database_baseline_sql();

    let required_indexes = [
        "idx_iam_organization_tenant_parent",
        "idx_iam_tenant_member_tenant_user",
        "idx_iam_tenant_signing_key_active",
        "idx_iam_organization_closure_descendant",
        "idx_iam_organization_membership_tenant_user",
        "idx_iam_department_tenant_organization_parent",
        "idx_iam_department_closure_descendant",
        "idx_iam_department_assignment_tenant_user",
        "idx_iam_position_tenant_organization_department",
        "idx_iam_position_assignment_tenant_user",
        "idx_iam_role_binding_organization_scope",
        "idx_iam_role_binding_organization_principal",
        "idx_iam_user_tenant_status",
        "idx_iam_user_identity_tenant_user",
        "idx_iam_credential_tenant_user_type",
        "idx_iam_session_tenant_user",
        "idx_iam_session_auth_token_hash",
        "idx_iam_session_access_token_hash",
        "idx_iam_session_refresh_token_hash",
        "idx_iam_role_tenant_status",
        "idx_iam_role_permission_tenant_permission",
        "idx_iam_api_key_tenant_organization_user_status",
        "idx_iam_security_event_tenant_organization_created_at",
        "idx_iam_audit_event_tenant_created_at",
        "idx_iam_audit_event_request_id",
    ];

    for index_name in required_indexes {
        assert!(
            sql.contains(&format!("CREATE INDEX IF NOT EXISTS {index_name}")),
            "missing standard IAM migration index: {index_name}",
        );
    }
    for index_sql in [
        "ON iam_role_binding (tenant_id, organization_id, scope_kind, scope_id, status)",
        "ON iam_role_binding (tenant_id, organization_id, principal_kind, principal_id, status)",
        "ON iam_api_key (tenant_id, organization_id, user_id, status)",
        "ON iam_security_event (tenant_id, organization_id, created_at, severity)",
    ] {
        assert!(
            sql.contains(index_sql),
            "missing organization-scoped IAM index columns: {index_sql}",
        );
    }

    assert!(
        table_definition(sql, "iam_user_role").is_none(),
        "iam_user_role must not remain because scoped iam_role_binding owns role assignment",
    );
    assert!(
        !sql.contains("idx_iam_user_role_tenant_user"),
        "iam_user_role indexes must not remain in the canonical IAM migration",
    );
}

#[test]
fn exposes_complete_oauth_table_catalog() {
    let tables = iam_database_tables();

    for table in [
        "iam_oauth_provider_catalog",
        "iam_oauth_integration",
        "iam_oauth_client",
        "iam_oauth_secret",
        "iam_oauth_surface",
        "iam_oauth_flow_config",
        "iam_oauth_scope_profile",
        "iam_oauth_claim_mapping",
        "iam_oauth_policy",
        "iam_oauth_tenant_binding",
        "iam_oauth_operator_platform",
        "iam_oauth_resource_account",
        "iam_oauth_resource_authorization",
        "iam_oauth_webhook_config",
        "iam_oauth_operational_resource",
        "iam_oauth_authorization_state",
        "iam_oauth_account_link",
        "iam_oauth_grant",
        "iam_oauth_callback_event",
        "iam_oauth_diagnostic_run",
    ] {
        assert!(
            tables.contains(&table),
            "IAM table catalog must expose OAuth table {table}",
        );
    }

    assert!(
        !tables.contains(&"iam_oauth_client_secret"),
        "OAuth secrets must use iam_oauth_secret, not iam_oauth_client_secret",
    );
}

#[test]
fn exposes_canonical_oauth_table_constants() {
    assert_eq!(
        "iam_oauth_provider_catalog",
        IamTables::OAUTH_PROVIDER_CATALOG
    );
    assert_eq!("iam_oauth_integration", IamTables::OAUTH_INTEGRATION);
    assert_eq!("iam_oauth_client", IamTables::OAUTH_CLIENT);
    assert_eq!("iam_oauth_secret", IamTables::OAUTH_SECRET);
    assert_eq!("iam_oauth_surface", IamTables::OAUTH_SURFACE);
    assert_eq!("iam_oauth_flow_config", IamTables::OAUTH_FLOW_CONFIG);
    assert_eq!(
        "iam_oauth_operator_platform",
        IamTables::OAUTH_OPERATOR_PLATFORM
    );
    assert_eq!(
        "iam_oauth_resource_account",
        IamTables::OAUTH_RESOURCE_ACCOUNT
    );
    assert_eq!(
        "iam_oauth_resource_authorization",
        IamTables::OAUTH_RESOURCE_AUTHORIZATION
    );
    assert_eq!("iam_oauth_webhook_config", IamTables::OAUTH_WEBHOOK_CONFIG);
    assert_eq!(
        "iam_oauth_operational_resource",
        IamTables::OAUTH_OPERATIONAL_RESOURCE
    );
}

#[test]
fn database_baseline_declares_standard_oauth_tables_without_plaintext_secrets() {
    let sql = iam_database_baseline_sql();

    assert!(
        table_definition(sql, "iam_oauth_client_secret").is_none(),
        "OAuth must not create legacy/narrow iam_oauth_client_secret table",
    );
    assert!(
        !sql.contains("client_secret TEXT"),
        "OAuth migration must not declare plaintext client_secret columns",
    );
    assert!(
        !sql.contains("app_secret TEXT"),
        "OAuth migration must not declare plaintext app_secret columns",
    );
    assert!(
        !sql.contains("access_token TEXT"),
        "OAuth migration must not declare plaintext access_token columns",
    );
    assert!(
        !sql.contains("refresh_token TEXT"),
        "OAuth migration must not declare plaintext refresh_token columns",
    );

    for table in [
        "iam_oauth_provider_catalog",
        "iam_oauth_integration",
        "iam_oauth_client",
        "iam_oauth_secret",
        "iam_oauth_surface",
        "iam_oauth_flow_config",
        "iam_oauth_operator_platform",
        "iam_oauth_resource_account",
        "iam_oauth_resource_authorization",
        "iam_oauth_webhook_config",
        "iam_oauth_operational_resource",
        "iam_oauth_authorization_state",
        "iam_oauth_account_link",
        "iam_oauth_grant",
        "iam_oauth_callback_event",
        "iam_oauth_diagnostic_run",
    ] {
        assert!(
            table_definition(sql, table).is_some(),
            "database baseline must declare {table}",
        );
    }
}

#[test]
fn database_baseline_declares_oauth_provider_catalog_capability_schema() {
    let sql = iam_database_baseline_sql();
    let table =
        table_definition(sql, "iam_oauth_provider_catalog").expect("provider catalog table");

    for column in [
        "provider_code",
        "provider_family",
        "protocol_family",
        "supported_surface_kinds_json",
        "supported_flow_kinds_json",
        "supported_capabilities_json",
        "supported_resource_account_kinds_json",
        "supported_access_modes_json",
        "provider_client_field_schema_json",
        "provider_surface_field_schema_json",
        "provider_secret_field_schema_json",
        "provider_flow_field_schema_json",
        "provider_resource_account_field_schema_json",
        "provider_operator_platform_field_schema_json",
        "provider_webhook_field_schema_json",
        "provider_operational_resource_schema_json",
    ] {
        assert!(
            table.contains(column),
            "iam_oauth_provider_catalog must declare {column}",
        );
    }

    for index_name in [
        "uk_iam_oauth_provider_catalog_owner_code",
        "idx_iam_oauth_provider_catalog_region_status",
        "idx_iam_oauth_provider_catalog_protocol",
        "idx_iam_oauth_provider_catalog_capability",
    ] {
        assert!(
            sql.contains(&format!("CREATE INDEX IF NOT EXISTS {index_name}"))
                || sql.contains(&format!("CREATE UNIQUE INDEX IF NOT EXISTS {index_name}")),
            "missing OAuth provider catalog index {index_name}",
        );
    }
}

#[test]
fn database_baseline_declares_oauth_secret_owner_scopes() {
    let sql = iam_database_baseline_sql();
    let table = table_definition(sql, "iam_oauth_secret").expect("oauth secret table");

    for column in [
        "secret_owner_kind",
        "secret_owner_id",
        "integration_id",
        "oauth_client_id",
        "resource_account_id",
        "operator_platform_id",
        "resource_authorization_id",
        "webhook_config_id",
        "grant_id",
        "secret_kind",
        "secret_ref",
        "secret_hash",
        "public_fingerprint",
        "active_from",
        "active_until",
        "rotation_batch_id",
    ] {
        assert!(
            table.contains(column),
            "iam_oauth_secret must declare {column}"
        );
    }

    for index_name in [
        "idx_iam_oauth_secret_owner_active",
        "idx_iam_oauth_secret_client_active",
        "idx_iam_oauth_secret_resource_authorization_active",
        "idx_iam_oauth_secret_webhook_active",
        "uk_iam_oauth_secret_hash",
    ] {
        assert!(
            sql.contains(&format!("CREATE INDEX IF NOT EXISTS {index_name}"))
                || sql.contains(&format!("CREATE UNIQUE INDEX IF NOT EXISTS {index_name}")),
            "missing OAuth secret index {index_name}",
        );
    }
}

#[test]
fn database_baseline_declares_oauth_resource_account_and_mini_program_fields() {
    let sql = iam_database_baseline_sql();
    let resource_account =
        table_definition(sql, "iam_oauth_resource_account").expect("resource account table");
    let surface = table_definition(sql, "iam_oauth_surface").expect("surface table");
    let flow_config = table_definition(sql, "iam_oauth_flow_config").expect("flow config table");

    for column in [
        "resource_account_kind",
        "access_mode",
        "provider_account_id",
        "provider_account_original_id",
        "provider_union_scope_id",
        "self_managed_config_status",
        "operator_authorization_status",
        "webhook_verify_status",
        "domain_verify_status",
        "default_mini_program_surface_id",
        "last_authorization_refreshed_at",
    ] {
        assert!(
            resource_account.contains(column),
            "iam_oauth_resource_account must declare {column}",
        );
    }

    for column in [
        "surface_kind",
        "mini_program_app_id",
        "mini_program_original_id",
        "mini_program_environment",
        "mini_program_provider",
        "mini_program_release_channel",
        "mini_program_path",
        "mini_program_query_template",
        "mini_program_scene",
    ] {
        assert!(
            surface.contains(column),
            "iam_oauth_surface must declare {column}"
        );
    }

    for column in [
        "flow_kind",
        "flow_purpose",
        "mini_program_code_ttl_seconds",
        "mini_program_phone_authorization_enabled",
        "mini_program_profile_authorization_enabled",
        "provider_session_key_retention_policy",
    ] {
        assert!(
            flow_config.contains(column),
            "iam_oauth_flow_config must declare {column}",
        );
    }

    for index_name in [
        "idx_iam_oauth_resource_account_operator",
        "idx_iam_oauth_resource_account_readiness",
        "idx_iam_oauth_surface_mini_program_channel",
        "idx_iam_oauth_flow_config_surface",
    ] {
        assert!(
            sql.contains(&format!("CREATE INDEX IF NOT EXISTS {index_name}")),
            "missing OAuth resource account or mini-program index {index_name}",
        );
    }
}

#[test]
fn database_baseline_declares_oauth_provider_callback_and_operational_resources() {
    let sql = iam_database_baseline_sql();
    let webhook = table_definition(sql, "iam_oauth_webhook_config").expect("webhook config table");
    let callback_event =
        table_definition(sql, "iam_oauth_callback_event").expect("callback event table");
    let operational_resource = table_definition(sql, "iam_oauth_operational_resource")
        .expect("operational resource table");

    for column in [
        "webhook_kind",
        "callback_public_id",
        "callback_path_token_hash",
        "verification_token_status",
        "encoding_aes_key_status",
        "message_handling_mode",
        "last_verify_error_code",
        "last_event_id",
    ] {
        assert!(
            webhook.contains(column),
            "iam_oauth_webhook_config must declare {column}",
        );
    }

    for column in [
        "provider_event_id",
        "provider_event_type",
        "webhook_config_id",
        "resource_account_id",
        "operator_platform_id",
        "detail_json",
    ] {
        assert!(
            callback_event.contains(column),
            "iam_oauth_callback_event must declare {column}",
        );
    }

    for column in [
        "resource_kind",
        "resource_type",
        "target_url_hash",
        "target_app_id",
        "target_path",
        "publish_status",
        "sync_mode",
        "last_publish_error_code",
    ] {
        assert!(
            operational_resource.contains(column),
            "iam_oauth_operational_resource must declare {column}",
        );
    }

    for index_name in [
        "uk_iam_oauth_webhook_config_public",
        "idx_iam_oauth_callback_event_provider_event",
        "idx_iam_oauth_callback_event_webhook",
        "idx_iam_oauth_operational_resource_account",
        "idx_iam_oauth_operational_resource_target",
    ] {
        assert!(
            sql.contains(&format!("CREATE INDEX IF NOT EXISTS {index_name}"))
                || sql.contains(&format!("CREATE UNIQUE INDEX IF NOT EXISTS {index_name}")),
            "missing OAuth provider callback or operational resource index {index_name}",
        );
    }
}

#[test]
fn application_standard_baseline_declares_tenant_application_tables_without_studio_debt() {
    let sql = iam_database_baseline_sql();

    for table in [
        "iam_application_template",
        "iam_application_template_package",
        "iam_tenant_application",
    ] {
        assert!(
            sql.contains(&format!("CREATE TABLE IF NOT EXISTS {table}")),
            "baseline must declare {table}",
        );
    }

    for legacy in [
        "CREATE TABLE IF NOT EXISTS studio_app_template",
        "CREATE TABLE IF NOT EXISTS iam_application ",
        "CREATE TABLE IF NOT EXISTS iam_application_package",
    ] {
        assert!(
            !sql.contains(legacy),
            "baseline must not retain legacy schema marker: {legacy}",
        );
    }

    for legacy_drop in [
        "DROP TABLE IF EXISTS studio_app_template",
        "DROP TABLE IF EXISTS studio_mcp_binding",
        "DROP TABLE IF EXISTS studio_catalog_action",
    ] {
        assert!(
            !sql.contains(legacy_drop),
            "baseline must not execute legacy studio cleanup; use migration 0007 for upgrades",
        );
    }
}

#[test]
fn application_standard_migrations_are_versioned_under_database_module() {
    let sql = iam_database_baseline_sql();

    assert!(sql.contains("CREATE TABLE IF NOT EXISTS iam_application_template"));
    assert!(sql.contains("CREATE TABLE IF NOT EXISTS iam_tenant_application"));
    assert!(sql.contains("DROP TABLE IF EXISTS studio_app_template"));
}

#[test]
fn rbac_federation_baseline_declares_registry_and_subject_extension_tables() {
    let sql = iam_database_baseline_sql();

    for table in [
        "iam_module_registry_entry",
        "iam_module_registry_snapshot",
        "iam_catalog_materialization",
        "iam_group",
        "iam_group_member",
        "iam_service_account",
        "iam_role_exclusion",
    ] {
        assert!(
            sql.contains(&format!("CREATE TABLE IF NOT EXISTS {table}")),
            "baseline must declare {table}",
        );
    }

    for marker in [
        "ADD COLUMN IF NOT EXISTS module_id TEXT NOT NULL DEFAULT 'legacy'",
        "ADD COLUMN IF NOT EXISTS role_class TEXT NOT NULL DEFAULT 'tenant_custom'",
        "ADD COLUMN IF NOT EXISTS template_ref TEXT",
    ] {
        assert!(
            sql.contains(marker),
            "baseline must include RBAC federation column marker: {marker}",
        );
    }
}

#[test]
fn storage_contract_does_not_keep_crate_local_migrations_directory() {
    let migrations_dir = Path::new(env!("CARGO_MANIFEST_DIR")).join("migrations");
    assert!(
        !migrations_dir.exists(),
        "crate-local migrations directory must not exist; database/ owns IAM lifecycle SQL",
    );
}

#[test]
fn database_baseline_does_not_reference_removed_crate_migration_paths() {
    let sql = iam_database_baseline_sql();

    assert!(
        !sql.contains("crates/sdkwork-iam-directory-repository-sqlx/migrations/"),
        "baseline must not reference removed crate-local migration paths",
    );
    assert!(
        sql.contains("-- folded migration: migrations/postgres/0008_iam_rbac_federation.up.sql")
            || sql.contains("iam_rbac_federation"),
        "baseline must cite application-root migration sources",
    );
}

fn table_definition<'a>(sql: &'a str, table_name: &str) -> Option<&'a str> {
    let marker = format!("CREATE TABLE IF NOT EXISTS {table_name} (");
    let start = sql.find(&marker)?;
    let after_start = &sql[start..];
    let end = after_start.find("\n);")?;
    Some(&after_start[..end])
}
