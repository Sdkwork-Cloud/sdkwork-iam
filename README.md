# SDKWORK IAM

`sdkwork-iam` is the canonical IAM domain repository for SDKWork. It owns
identity, access management, OAuth/SSO, user-center, IMF registry, database module,
HTTP/RPC authorities, TypeScript/React/Flutter IAM packages, and generated IAM SDK families.

This workspace is a **base dependency repository**, not an independent application
root. It intentionally does not own a root `sdkwork.app.config.json`.

Applications consume IAM through `sdkwork-iam` crates, packages, and generated
SDK clients. Platform shell, runtime bootstrap, and non-IAM foundation
capabilities remain in `sdkwork-appbase`.

Plugin manifests and operator wiring live under `.sdkwork/plugins/`.

This workspace does not replace:

- `sdkwork-ui`: shared UI primitives, patterns, and theme tokens
- `sdkwork-appbase`: platform foundation packages and shared runtime bootstrap

## Workspace layout

```text
sdkwork-iam/
  apis/                          # IAM OpenAPI and RPC authorities
  apps/
    sdkwork-iam-common/packages/ # cross-architecture contracts, service, runtime, SDK ports/adapter
    sdkwork-iam-pc/packages/     # PC React IAM modules (auth, oauth admin, user center, ...)
    sdkwork-iam-h5/packages/     # H5/mobile React IAM modules
    sdkwork-iam-flutter-mobile/packages/  # Flutter mobile IAM core
  crates/                        # Rust IAM domain, routers, web adapter
  database/                      # IAM postgres module (iam_* tables)
  iam/                           # IMF registry and federated module manifests
  sdks/                          # sdkwork-iam-app-sdk, backend-sdk, open-sdk
  specs/                         # IAM component contracts
  tools/
  plugins/
  examples/
  configs/
  deployments/
  tests/
  docs/
```

## OAuth / SSO

OAuth and SSO are IAM session extensions. Inbound flows consume third-party IdPs;
outbound flows expose SDKWork as an OAuth authorization server. All paths converge
on IAM `auth_token` + `access_token`. Per-application policy lives in
`iam_tenant_application.runtime_config_json` (`auth.*`, `oauth.relyingParty.*`).

See `../sdkwork-specs/IAM_OAUTH_SPEC.md` for the full contract.

## Verification

- `pnpm run verify`: structure, database, IAM bootstrap, typecheck, API materialize, governance, IAM standard contracts
- `pnpm run test:iam-standard-contracts`: TypeScript contracts, adapter, OAuth PC, Flutter auth-runtime parity; Rust OAuth PKCE E2E when `.env.postgres` is present (see `../sdkwork-clawrouter/.env.postgres`)
- `cargo test --workspace`: Rust IAM crate tests (app-api PostgreSQL integration suites require `.env.postgres` and `--test-threads 1`)

## Related specs

- `../sdkwork-specs/IAM_SPEC.md`
- `../sdkwork-specs/IAM_OAUTH_SPEC.md`
- `../sdkwork-specs/README.md`
