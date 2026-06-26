# apps/

Application: iam
Status: active
Owner: SDKWork maintainers
Specs: APPLICATION_SPEC.md, SDKWORK_WORKSPACE_SPEC.md

## Primary App Surface

The repository root is not the primary runnable app surface.
Runnable application roots live under `apps/<application-root>/`.

## Directory Index

| Directory | Surface role | Runnable | Purpose | Entry |
| --- | --- | --- | --- | --- |
| sdkwork-iam-common | common | no | sdkwork-iam-common | [README](sdkwork-iam-common/README.md) |
| sdkwork-iam-flutter-mobile | flutter-mobile | yes | sdkwork-iam-flutter-mobile | [README](sdkwork-iam-flutter-mobile/README.md) |
| sdkwork-iam-h5 | h5 | yes | sdkwork-iam-h5 | [README](sdkwork-iam-h5/README.md) |
| sdkwork-iam-pc | pc | yes | sdkwork-iam-pc | [README](sdkwork-iam-pc/README.md) |

## Allowed Content

- Selected language/architecture application roots with `README.md`, `AGENTS.md`, `.sdkwork/`, and `specs/` when authored packages exist.
- Architecture-local `packages/`, `config/`, `src/`, `lib/`, `App/`, or `entry/` directories required by the owning architecture standard.

## Forbidden Content

- Repository-root API contracts, generated SDK workspaces, Rust crates, or deployment descriptors moved under `apps/`.
- Runtime secrets, user-private state, generated SDK transport output, or cross-application copied business logic.

## Related Specs

- `../sdkwork-specs/APPLICATION_SPEC.md`
- `../sdkwork-specs/SDKWORK_WORKSPACE_SPEC.md`
- `../sdkwork-specs/APP_CLIENT_ARCHITECTURE_ALIGNMENT_SPEC.md`

## Verification

```bash
node ../sdkwork-specs/tools/check-apps-directory-index.mjs --root .
```
