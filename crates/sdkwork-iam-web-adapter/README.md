# sdkwork-iam-web-adapter

Domain: iam
Capability: web-adapter
Package type: rust-crate
Rust crate import: `sdkwork_iam_web_adapter`
Status: standardizing

IAM adapters for `sdkwork-web-framework` request context pipeline. Bridges IAM
`AppContext`, dual-token session resolution, and open-api credential resolution
(API key, OAuth bearer, flexible) into `WebRequestContext`, `WebRequestPrincipal`,
and route manifest integration.

## Public API

- `wrap_router_with_iam_app_web_framework`
- `wrap_router_with_iam_backend_web_framework`
- `wrap_router_with_iam_open_api_web_framework`
- `build_iam_open_api_web_framework_layer`
- `IamDatabaseWebRequestContextResolver` / `IamOpenApiWebRequestContextResolver`
- `IamApiKeyLookupService` / `IamOAuthTokenLookupService` (database-backed open-api)
- `resolve_iam_app_context_from_oauth_bearer`

## Framework Integration

This crate depends on `sdkwork-web-framework` (`sdkwork-web-core`,
`sdkwork-web-axum`) and `sdkwork-database-sqlx`. It replaces the deprecated
`sdkwork-platform-http-context-service` crate per `WEB_FRAMEWORK_SPEC.md`.

## Verification

```bash
cargo test -p sdkwork-iam-web-adapter
cargo test -p sdkwork-router-iam-open-api
```

## Owner And Status

Owner, root path, and lifecycle status are tracked in `specs/component.spec.json`.
