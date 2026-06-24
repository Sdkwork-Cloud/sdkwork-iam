# SDKWork IAM Open SDK

This SDK family is generated from the `sdkwork-iam-open-api` authority contract for `/iam/v3/api`.

## Contract

- SDK family: `sdkwork-iam-open-sdk`
- API authority: `sdkwork-iam-open-api`
- API prefix: `/iam/v3/api`
- Audience: public OAuth provider callbacks and open ingress integrations
- Auth mode: anonymous for provider callback ingress; server middleware still resolves request context
- Request context: server middleware resolves `WebRequestContext`; clients must not send `X-Request-Id`

## Generation

Run from `sdkwork-iam`:

```bash
pnpm run sdk:generate:open
```

Cross-platform entrypoint:

```bash
node sdks/sdkwork-iam-open-sdk/bin/generate-sdk.mjs
```

Materialize contract authorities first when route manifests change:

```bash
pnpm run api:materialize
```

OpenAPI authority inputs are written to both `apis/open-api/iam/` and this family's `openapi/` directory.

## Verification

- `pnpm run verify`
- `pnpm run api:materialize`
- `node sdks/sdkwork-iam-open-sdk/bin/generate-sdk.mjs`
