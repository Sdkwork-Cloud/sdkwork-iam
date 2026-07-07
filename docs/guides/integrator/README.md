# Integrator Guide

Status: active  
Owner: SDKWork maintainers  
Specs: IAM_SPEC.md, IAM_LOGIN_INTEGRATION_SPEC.md, APP_SDK_INTEGRATION_SPEC.md

## SDK families

| Surface | Package | Usage |
| --- | --- | --- |
| Application | `@sdkwork/iam-app-sdk` | End-user auth, sessions, directory |
| Backend admin | `@sdkwork/iam-backend-sdk` | Tenant/org/user/RBAC/OAuth admin |
| OAuth / open | `@sdkwork/iam-open-sdk` | Authorization server, inbound IdP |

Forbidden: generator transport package names (`sdkwork-*-generated-typescript`) and raw HTTP to IAM routes when a composed facade exists.

## Bootstrap

1. Configure `sdkwork.app.config.json` for the consuming application.
2. Use `@sdkwork/iam-application-bootstrap` to wire app and backend SDK clients.
3. For PC React hosts, compose `@sdkwork/iam-pc-core` and admin capability packages from `@sdkwork/iam-pc-admin-core`.

## HTTP contract

- Success: `SdkWorkApiResponse` with `code: 0` and `data` payload.
- Errors: HTTP 4xx/5xx `application/problem+json` with numeric `code` and `traceId`.
- Lists: `data.items` + `data.pageInfo` per `PAGINATION_SPEC.md`.

## Related docs

- [docs/IAM_INTEGRATION.md](../../IAM_INTEGRATION.md)
- [docs/architecture/tech/TECH_ARCHITECTURE.md](../../architecture/tech/TECH_ARCHITECTURE.md)
- [deployments/runbooks/local-iam-rust.md](../../deployments/runbooks/local-iam-rust.md)
