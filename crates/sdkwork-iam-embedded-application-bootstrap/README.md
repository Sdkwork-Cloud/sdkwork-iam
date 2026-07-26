# sdkwork-iam-embedded-application-bootstrap

Embedded IAM tenant application bootstrap for unified-process, installer, and standalone gateway runtimes.

## Responsibility

- Read `sdkwork.app.config.json`
- Map manifest fields to `EnsureTenantApplicationCommand` using the same semantics as `@sdkwork/iam-application-bootstrap`
- Connect to the unified IAM Postgres profile with schema `search_path`
- Call `ensure_tenant_application_runtime` idempotently (upsert + reconcile + enable)

Application repositories must not duplicate manifest mapping, Postgres `search_path` handling, or tenant-application conflict reconciliation.

## Public entrypoints

- `resolve_application_app_root`
- `resolve_application_app_root_with_fallback`
- `ensure_tenant_application_from_app_root`
- `ensure_tenant_application_from_app_root_if_configured`
- `ensure_tenant_application_from_app_root_with_env`
- `ensure_tenant_application_from_app_root_with_env_and_fallback`
- `ensure_tenant_applications_on_pool`

## Environment

- `SDKWORK_APP_ROOT` selects the application manifest root
- `SDKWORK_APP_ROOT` is the only application-root input consumed by IAM. Product-specific aliases remain owned by each consuming application and must be mapped to this generic contract at its composition boundary.
- `@sdkwork/app-topology` `resolveIamDevEnv()` injects `SDKWORK_APP_ROOT` from the selected application topology.
- Application adapters `MUST` call `ensure_tenant_application_from_app_root_with_env_and_fallback` so startup succeeds when env aliases are unset
- Unified Postgres profile keys are resolved through `sdkwork-database-config`

## Related specs

- `sdkwork-specs/IAM_APPLICATION_BOOTSTRAP_SPEC.md`
- `sdkwork-specs/IAM_SPEC.md`
