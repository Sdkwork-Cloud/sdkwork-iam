use sdkwork_iam_context_service::{
    is_platform_organization_id, serialize_session_organization_id, validate_dual_token_context,
    AuthLevel, DeploymentMode, Environment, IamAppContext, IamSessionTokens, IamShardingContext,
    IamShardingStrategy, LoginScope, PLATFORM_ORGANIZATION_ID,
};

#[test]
fn creates_app_context_and_organization_first_sharding_context() {
    let context = IamAppContext::new(
        "100001",
        Some("org-1"),
        "1",
        "session-1",
        "sdkwork-router",
        Environment::Dev,
        DeploymentMode::Saas,
        AuthLevel::Mfa,
        vec!["tenant:100001".to_string()],
        vec!["iam.users.read".to_string()],
    );

    assert_eq!(context.tenant_id, "100001");
    assert_eq!(context.organization_id.as_deref(), Some("org-1"));
    assert_eq!(context.user_id, "1");
    assert_eq!(context.environment, Environment::Dev);
    assert_eq!(context.deployment_mode, DeploymentMode::Saas);
    assert_eq!(context.auth_level, AuthLevel::Mfa);
    assert_eq!(context.login_scope, LoginScope::Organization);

    assert_eq!(
        IamShardingContext::from_app_context(&context),
        IamShardingContext {
            sharding_key: "org-1".to_string(),
            sharding_strategy: IamShardingStrategy::Organization,
            database_key: None,
            schema: None,
            table_partition: None,
        }
    );
}

#[test]
fn falls_back_to_tenant_sharding_when_no_organization_context_exists() {
    let context = IamAppContext::new(
        "100001",
        None,
        "1",
        "session-1",
        "sdkwork-router",
        Environment::Dev,
        DeploymentMode::Saas,
        AuthLevel::Password,
        vec![],
        vec![],
    );

    assert_eq!(
        IamShardingContext::from_app_context(&context),
        IamShardingContext {
            sharding_key: "100001".to_string(),
            sharding_strategy: IamShardingStrategy::Tenant,
            database_key: None,
            schema: None,
            table_partition: None,
        }
    );
    assert_eq!(context.login_scope, LoginScope::Tenant);
}

#[test]
fn treats_empty_organization_as_tenant_login_scope() {
    for organization_id in [Some(""), Some("  "), None] {
        let context = IamAppContext::new(
            "100001",
            organization_id,
            "1",
            "session-1",
            "sdkwork-router",
            Environment::Dev,
            DeploymentMode::Saas,
            AuthLevel::Password,
            vec![],
            vec![],
        );

        assert_eq!(context.organization_id, None);
        assert_eq!(context.login_scope, LoginScope::Tenant);
        assert_eq!(
            IamShardingContext::from_app_context(&context),
            IamShardingContext {
                sharding_key: "100001".to_string(),
                sharding_strategy: IamShardingStrategy::Tenant,
                database_key: None,
                schema: None,
                table_partition: None,
            }
        );
    }
}

#[test]
fn treats_root_organization_id_zero_as_personal_login_scope() {
    let context = IamAppContext::new(
        "100001",
        Some("0"),
        "1",
        "session-1",
        "sdkwork-router",
        Environment::Dev,
        DeploymentMode::Saas,
        AuthLevel::Password,
        vec![],
        vec![],
    );

    assert_eq!(context.organization_id, None);
    assert_eq!(context.login_scope, LoginScope::Tenant);
    assert_eq!(
        IamShardingContext::from_app_context(&context),
        IamShardingContext {
            sharding_key: "100001".to_string(),
            sharding_strategy: IamShardingStrategy::Tenant,
            database_key: None,
            schema: None,
            table_partition: None,
        }
    );
}

#[test]
fn validates_dual_token_subject_and_access_context_match() {
    let context = IamAppContext::new(
        "100001",
        None,
        "1",
        "session-1",
        "sdkwork-router",
        Environment::Test,
        DeploymentMode::Local,
        AuthLevel::Password,
        vec![],
        vec![],
    );
    let tokens = IamSessionTokens {
        access_token: "access-token".to_string(),
        auth_token: "auth-token".to_string(),
        refresh_token: Some("refresh-token".to_string()),
        context: context.clone(),
    };

    assert!(validate_dual_token_context(&tokens, &context).is_ok());

    let other_context = IamAppContext {
        tenant_id: "tenant-2".to_string(),
        ..context
    };
    assert_eq!(
        validate_dual_token_context(&tokens, &other_context).unwrap_err(),
        "access token context does not match request context"
    );
}

#[test]
fn platform_organization_id_is_login_sentinel_only() {
    assert!(is_platform_organization_id(PLATFORM_ORGANIZATION_ID));
    assert!(is_platform_organization_id(" 0 "));
    assert!(!is_platform_organization_id("org-1"));
}

#[test]
fn serializes_tenant_login_organization_id_as_platform_sentinel() {
    let tenant_context = IamAppContext::new(
        "100001",
        None,
        "1",
        "session-1",
        "sdkwork-router",
        Environment::Dev,
        DeploymentMode::Saas,
        AuthLevel::Password,
        vec![],
        vec![],
    );
    assert_eq!(
        serialize_session_organization_id(
            tenant_context.organization_id.as_deref(),
            &tenant_context.login_scope,
        ),
        PLATFORM_ORGANIZATION_ID
    );

    let organization_context = IamAppContext::new(
        "100001",
        Some("org-1"),
        "1",
        "session-1",
        "sdkwork-router",
        Environment::Dev,
        DeploymentMode::Saas,
        AuthLevel::Password,
        vec![],
        vec![],
    );
    assert_eq!(
        serialize_session_organization_id(
            organization_context.organization_id.as_deref(),
            &organization_context.login_scope,
        ),
        "org-1"
    );
}
