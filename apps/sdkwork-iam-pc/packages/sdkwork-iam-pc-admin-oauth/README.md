# @sdkwork/iam-pc-admin-oauth

IAM backend OAuth administration UI for PC React workspaces.

## Scope

Backend OAuth management per `IAM_OAUTH_SPEC.md`. Use `SdkworkIamOauthAdminWorkspace` as the primary entry (tabbed admin console). `SdkworkIamOauthAdminSettings` accepts an optional `tab` prop for embedding a single section group.

| Tab | Resources | Lifecycle / ops |
|-----|-----------|-----------------|
| Inbound IdP | integrations, provider catalog, clients, secrets, scope profiles, claim mappings, webhooks, flow configs, surfaces | enable/disable, delete; catalog register/activate; webhook verify |
| Authorization server | relying party (runtimeConfig), account links (inline status), grants | tenantApplications.retrieve/update; link status; grant revoke |
| Extended platform | policies, tenant bindings, operator platforms, resource accounts, resource authorizations, operational resources | status toggles; pre-auth; verify/refresh; publish |
| Diagnostics & audit | diagnostic runs, callback events | queue run; retrieve detail (read-only events) |

| Section | Backend operations |
|---------|-------------------|
| Provider catalog | list, create, retrieve, activate/deactivate |
| Integrations | list, create, retrieve, enable/disable, delete |
| OAuth clients | list, create, retrieve, enable/disable, delete |
| OAuth secrets | list, create, delete (secret reference only) |
| Scope profiles | list, create, activate/deactivate |
| Claim mappings | list, create, activate/deactivate |
| Webhook configs | list, create, enable/disable, verify |
| Flow configs | list, create, enable/disable |
| Surfaces | list, create, enable/disable, delete |
| OAuth policies | list, create, activate/deactivate |
| Tenant bindings | list, create, activate/deactivate |
| Operator platforms | list, create, enable/disable, pre-authorize |
| Diagnostic runs | list, create, retrieve |
| Resource accounts | list, create, enable/disable, verify, refresh authorization, mini program login check |
| Resource authorizations | list, create, activate/deactivate |
| Operational resources | list, create, enable/disable, delete, publish |
| Account links | list, update status (activate / suspend / revoke inline) |
| OAuth grants | list, revoke (`iam.oauth.grants.delete`) |
| Callback events | list (read-only) |
| SDKWork relying party (§4.2) | retrieve + update via `iam.tenantApplications.*` (redacted `clientSecretHash` on read) |

Consumes `@sdkwork/iam-service` (`service.iam.oauth.*`, `service.iam.tenantApplications.retrieve`, `service.iam.tenantApplications.update`) only.

## Module layout

- `oauth-admin-workspace.tsx` — tabbed workspace shell
- `oauth-admin-controller.ts` — stateful admin controller
- `oauth-admin-settings.tsx` — settings UI sections (tab-filtered)
- `oauth-admin-resource-list.tsx` — managed resource lists and operational actions
- `oauth-admin-managed-list.tsx` — generic lifecycle list component
- `oauth-admin-types.ts` / `oauth-admin-utils.ts` — contracts and helpers

## Security

- Secret registration accepts vault/KMS `secretRef` only; plaintext is not echoed after create.
- Relying-party `clientSecretHash` must be a precomputed argon2id hash; plaintext secrets are never stored.
- Grant revocation calls backend delete to invalidate server-side token lookup (§7).
- Disabling an integration or surface fails closed for inbound OAuth login when tenant policy requires enabled registrations.
- Diagnostic run responses are redacted server-side.

## Verification

Included in `pnpm run test:iam-standard-contracts`.

```bash
pnpm --filter @sdkwork/iam-pc-admin-oauth typecheck
pnpm exec vitest run apps/sdkwork-iam-pc/packages/sdkwork-iam-pc-admin-oauth/tests --config vitest.config.ts --configLoader native --pool vmThreads
```
