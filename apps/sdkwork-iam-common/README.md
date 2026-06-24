# sdkwork-iam-common

Cross-architecture TypeScript application root for IAM contracts, SDK ports, service, runtime, bootstrap, and RPC contracts.

Follows `APPLICATION_SPEC.md` shared package-family rules. UI packages for a specific client architecture belong under `sdkwork-iam-pc`, `sdkwork-iam-h5`, or `sdkwork-iam-flutter-mobile`.

## OAuth / SSO packages

| Package | Responsibility |
| --- | --- |
| `@sdkwork/iam-contracts` | Route/operationId authority, `auth-runtime-metadata.ts`, OAuth backend route registry |
| `@sdkwork/iam-sdk-ports` | Backend OAuth port types (`backend-oauth-ports.ts`) |
| `@sdkwork/iam-sdk-adapter` | Maps `iamOauth.iam.oauth.*` → `service.iam.oauth.*` |
| `@sdkwork/iam-service` | `service.iam.oauth.*` facade for admin and app consumers |

Canonical spec: `../../sdkwork-specs/IAM_OAUTH_SPEC.md`.

Owner: `sdkwork-iam` maintainers.
