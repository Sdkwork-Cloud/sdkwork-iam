# sdkwork-api-iam-assembly

Host-neutral HTTP API assembly for the `sdkwork-iam` application plane. It composes IAM `app-api`, `backend-api`, and `open-api` business routes, manifests, OpenAPI, permission catalogs, context injectors, and database readiness capability.

The assembly does not mount process-wide middleware or infrastructure routes. `sdkwork-api-iam-standalone-gateway` owns the Web Framework layer and mounts `/healthz`, `/livez`, `/readyz`, `/metrics`, and `/openapi.json` once through `sdkwork-web-bootstrap`.

## Verification

```bash
cargo test -p sdkwork-api-iam-assembly
pnpm run check:gateway-assembly
```
## Canonical Specs

See [specs/README.md](./specs/README.md) and [specs/component.spec.json](./specs/component.spec.json).
