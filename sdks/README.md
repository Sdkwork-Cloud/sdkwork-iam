# SDKWork IAM SDKs

This directory hosts IAM SDK families for `sdkwork-iam`.

| SDK family | API authority | Primary consumers |
| --- | --- | --- |
| `sdkwork-iam-app-sdk` | `sdkwork-iam-app-api` | End-user apps: login, sessions, OAuth login, current user |
| `sdkwork-iam-backend-sdk` | `sdkwork-iam-backend-api` | Admin consoles: tenants, IAM directory, **OAuth integration management** (`iam.oauth.*`) |
| `sdkwork-iam-open-sdk` | `sdkwork-iam-open-api` | Third-party integrations: **SDKWork OAuth AS** (OIDC discovery, token, userinfo, revoke), provider webhooks |

## OAuth roles (IAM_OAUTH_SPEC.md)

| Role | SDK | Notes |
| --- | --- | --- |
| Inbound IdP login (WeChat, GitHub, …) | `@sdkwork/iam-app-sdk` | App-api OAuth sessions; must not hand-craft provider HTTP |
| Outbound SDKWork AS (relying parties) | `@sdkwork/iam-open-sdk` | Separate OAuth bearer credential; must not reuse app login TokenManager |
| Tenant OAuth configuration | `@sdkwork/iam-backend-sdk` + `@sdkwork/iam-pc-admin-oauth` (`SdkworkIamOauthAdminWorkspace`) | Operational `iam.oauth.*` admin (19 resource families, lifecycle + retrieve/detail); provider catalog create/update via PC admin |

Relying-party registration for SDKWork OAuth uses `iam_tenant_application.runtimeConfig.oauth.relyingParty` (see spec §4.2).

## Generation

Run from the `sdkwork-iam` root:

```bash
pnpm run api:materialize
pnpm run sdk:generate
```

Do not hand-edit generated SDK output.
