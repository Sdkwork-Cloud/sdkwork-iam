# IAM App API Contracts

Authoritative OpenAPI 3.1.2 contracts for the `sdkwork-appbase` app-api surface.

## Authority

| File | Purpose |
| --- | --- |
| `sdkwork-appbase-app-api.openapi.yaml` | Materialized OpenAPI authority from `sdkwork-router-iam-app-api` route manifests |

## Materialization

Regenerate from route crates:

```bash
node tools/generators/materialize-appbase-v3-openapi-boundaries.mjs
```

Thin compatibility wrapper:

```bash
node sdks/materialize-appbase-v3-openapi-boundaries.mjs
```

Generated SDK transport output remains under `sdks/sdkwork-appbase-app-sdk/`.

## Related Specs

- `../../../sdkwork-specs/API_SPEC.md`
- `../../../sdkwork-specs/WEB_FRAMEWORK_SPEC.md`
- `../../../sdkwork-specs/SDK_WORKSPACE_GENERATION_SPEC.md`
