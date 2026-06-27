use axum::body::Body;
use axum::extract::Request;
use sdkwork_iam_web_adapter::IamWebRequestContextResolver;
use sdkwork_web_core::{
    AllowAllAuthorizationPolicy, WebAuthMode, WebCallInterceptorChain, WebCallRuntime,
    WebCallState, WebFrameworkErrorKind, WebRequestContextProfile,
};
use std::sync::Arc;

#[tokio::test]
async fn iam_open_api_resolver_accepts_dev_inline_api_key() {
    std::env::set_var("SDKWORK_ENV", "dev");
    let mut runtime = WebCallRuntime::new(IamWebRequestContextResolver::new(None)).with_profile(
        WebRequestContextProfile {
            open_api_prefixes: vec!["/iam/v3/api".to_owned()],
            ..Default::default()
        },
    );
    runtime.authorization = Arc::new(AllowAllAuthorizationPolicy);
    let chain = WebCallInterceptorChain::standard();
    let mut request = Request::builder()
        .uri("/iam/v3/api/oauth/provider_callbacks/callback_test")
        .header(
            "x-api-key",
            "api_key_id=key-1;tenant_id=100001;user_id=1;app_id=appbase",
        )
        .body(Body::empty())
        .expect("request");
    let mut state = WebCallState::from_request(&request);
    chain
        .before(&mut state, &mut request, &runtime)
        .await
        .expect("api key auth");
    assert_eq!(WebAuthMode::ApiKey, state.auth_mode);
    assert_eq!(
        "100001",
        state.principal.as_ref().expect("principal").tenant_id()
    );
}

#[tokio::test]
async fn iam_open_api_resolver_accepts_dev_inline_oauth_bearer() {
    std::env::set_var("SDKWORK_ENV", "dev");
    let mut runtime = WebCallRuntime::new(IamWebRequestContextResolver::new(None)).with_profile(
        WebRequestContextProfile {
            open_api_prefixes: vec!["/iam/v3/api".to_owned()],
            ..Default::default()
        },
    );
    runtime.authorization = Arc::new(AllowAllAuthorizationPolicy);
    let chain = WebCallInterceptorChain::standard();
    let mut request = Request::builder()
        .uri("/iam/v3/api/oauth/provider_callbacks/callback_test")
        .header(
            "Authorization",
            "Bearer token_id=tok-1;tenant_id=tenant-oauth;user_id=user-oauth;app_id=appbase",
        )
        .body(Body::empty())
        .expect("request");
    let mut state = WebCallState::from_request(&request);
    chain
        .before(&mut state, &mut request, &runtime)
        .await
        .expect("oauth auth");
    assert_eq!(WebAuthMode::OAuth, state.auth_mode);
    assert_eq!(
        "tenant-oauth",
        state.principal.as_ref().expect("principal").tenant_id()
    );
}

#[tokio::test]
async fn iam_open_api_resolver_rejects_missing_credentials() {
    let runtime = WebCallRuntime::new(IamWebRequestContextResolver::new(None)).with_profile(
        WebRequestContextProfile {
            open_api_prefixes: vec!["/iam/v3/api".to_owned()],
            ..Default::default()
        },
    );
    let chain = WebCallInterceptorChain::standard();
    let mut request = Request::builder()
        .uri("/iam/v3/api/oauth/provider_callbacks/callback_test")
        .body(Body::empty())
        .expect("request");
    let mut state = WebCallState::from_request(&request);
    let error = chain
        .before(&mut state, &mut request, &runtime)
        .await
        .expect_err("missing credentials");
    assert_eq!(WebFrameworkErrorKind::MissingCredentials, error.kind);
}
