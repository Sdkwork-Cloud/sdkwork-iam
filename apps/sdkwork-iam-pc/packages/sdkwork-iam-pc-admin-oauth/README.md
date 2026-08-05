# @sdkwork/iam-pc-admin-oauth

IAM backend OAuth administration UI for PC React workspaces.

## Scope

Backend OAuth management per `IAM_OAUTH_SPEC.md`. The primary entries are the
three quick-setup pages:

| Entry | Route | Resources |
|-------|-------|-----------|
| `SdkworkIamOauthProviderConnectionsPage` | `/admin/iam/oauth/providers` | platform catalog cards; configure + enable/disable `iam_oauth_integration` |
| `SdkworkIamOauthMiniProgramAccountsPage` | `/admin/iam/oauth/mini-programs` | `resource_account` rows with kind `mini_program`; one-click `wechat_mini_program` integration |
| `SdkworkIamOauthOfficialAccountsPage` | `/admin/iam/oauth/official-accounts` | `resource_account` rows with kind `official_account`; one-click `wechat` web-authorization integration |

Enabling an integration (or a mini program / official account, which syncs its
integration) makes `oauth.providers.list` return the provider code, so the
login page renders the matching OAuth entry immediately.

`SdkworkIamOauthAdminWorkspace` (tabbed console) and `SdkworkIamOauthAdminSettings`
(`view`/`tab` sections) remain exported for advanced/embedded usage but are no
longer mounted in the admin menu.

| Section | Backend operations |
|---------|-------------------|
| Provider catalog | list, create, retrieve, activate/deactivate |
| Integrations | list, create, retrieve, enable/disable, delete |
| OAuth clients | list, create, retrieve, enable/disable, delete |
| OAuth secrets | list, create, delete (write-only secret value) |
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

- `pages/OauthAdminWorkspace.tsx` — tabbed workspace shell (SegmentedControl navigation)
- `pages/OauthAdminSettings.tsx` — settings dispatcher (`view`/`tab` → page)
- `pages/oauth-inbound-pages.tsx` — inbound tab and provider/application/login-configuration views
- `pages/oauth-provider-pages.tsx` — authorization-server tab and authorizations view
- `pages/oauth-extended-pages.tsx` — extended tab and governance/resources views
- `pages/oauth-audit-pages.tsx` — audit tab and activity view
- `components/oauth-*-sections.tsx` — per-resource settings sections
- `components/OauthAdminResourceList.tsx` — managed resource lists and operational actions
- `components/OauthAdminManagedList.tsx` — generic lifecycle list component
- `components/oauth-admin-ui.tsx` — shared field/drawer/detail UI primitives
- `hooks/use-oauth-admin-page-state.ts` — page-level list/status state
- `services/oauth-admin-controller.ts` — stateful admin controller
- `types/oauth-admin-types.ts` / `types/oauth-admin-messages.ts` / `utils/oauth-admin-utils.ts` — contracts and helpers
- `i18n/` — en-US/zh-CN message catalog (`iam.oauth.admin` namespace)

## Security

- Provider onboarding creates the integration, client, protected secret, and redirect surface in one backend transaction.
- Secret registration accepts `secretValue` as write-only input; the backend encodes it into the protected secret reference and never returns plaintext.
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
