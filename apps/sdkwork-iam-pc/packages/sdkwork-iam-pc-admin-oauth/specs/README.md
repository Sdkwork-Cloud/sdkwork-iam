# SDKWork Iam OAuth PC React Component Specs

This directory is the local standards index for `@sdkwork/iam-pc-admin-oauth`.

Root SDKWork standards remain authoritative. Local component specs can narrow or document this component, but they must not contradict [the root standards](../../../../../../../specs/README.md).

## Component

| Field | Value |
| --- | --- |
| Name | `@sdkwork/iam-pc-admin-oauth` |
| Type | `react-package` |
| Root | `sdkwork-iam/apps/sdkwork-iam-pc/packages/sdkwork-iam-pc-admin-oauth` |
| Domain | `iam` |
| Capability | `oauth` |
| Surface | `backend-admin` |
| Languages | `typescript`, `react` |
| Status | `standard` |

## Contract Manifest

- [component.spec.json](./component.spec.json) is the machine-readable component contract (`layerRole: frontend-feature`).
- Consumers should integrate through public exports, runtime entrypoints, SDK clients, or adapters declared in the manifest.
- Generated SDK language outputs are represented at their SDK family root instead of duplicating local specs in generated folders.

## Layer Model

The package follows the SDKWork composable-architecture layer roles:

| Layer | Directory | Responsibility |
| --- | --- | --- |
| Contract | `src/types/` | Shared types, messages tree, section/page props contracts |
| Domain utilities | `src/utils/` | Pure helpers (platform grid, resource labels, message templates) |
| UI primitives | `src/components/oauth-admin-ui.tsx` | Field/drawer/detail/page-status primitives |
| Business components | `src/components/` | Per-resource settings sections and managed resource lists |
| Orchestration | `src/services/` | Stateful admin controller over the injected `SdkworkIamService` port |
| Composition | `src/pages/` | Composed admin pages and the settings dispatcher |
| i18n | `src/i18n/` | en-US/zh-CN message catalog (`iam.oauth.admin`) |

Dependency direction is strictly downward: pages → components/hooks/i18n → types, services → types/utils, components → types/utils/i18n. No layer imports upward.

## Canonical Specs

| Spec | Applies Because |
| --- | --- |
| [APP_PC_REACT_UI_SPEC.md](../../../../../../../specs/APP_PC_REACT_UI_SPEC.md) | App PC React package split, app SDK boundary, and desktop interaction rules. |
| [BACKEND_UI_SPEC.md](../../../../../../../specs/BACKEND_UI_SPEC.md) | Backend-admin surface rules, backend SDK boundary, and admin module composition. |
| [COMPONENT_SPEC.md](../../../../../../../specs/COMPONENT_SPEC.md) | Local component specs directory and manifest rules. |
| [COMPOSABLE_ARCHITECTURE_SPEC.md](../../../../../../../specs/COMPOSABLE_ARCHITECTURE_SPEC.md) | Layer roles, ports, and building-block composition closure. |
| [IAM_OAUTH_SPEC.md](../../../../../../../specs/IAM_OAUTH_SPEC.md) | OAuth provider, integration, authorization-server, and runtime discovery rules. |
| [I18N_SPEC.md](../../../../../../../specs/I18N_SPEC.md) | Message catalog fragment layout and locale parity. |
