# sdkwork-api-iam-assembly

Generated HTTP gateway assembly for the `sdkwork-iam` application plane. Composes IAM `app-api`, `backend-api`, and `open-api` route crates into a single Axum router for standalone and cloud gateway hosts.

Infrastructure routes (`/healthz`, `/livez`, `/readyz`, `/metrics`) are mounted once at the assembly layer through `sdkwork-web-bootstrap::assemble_multi_surface_router`. Readiness probes the IAM SQLx pool when database env is configured.

## Verification

```bash
cargo test -p sdkwork-api-iam-assembly
pnpm run check:gateway-assembly
```
## Canonical Specs

See [specs/README.md](./specs/README.md) and [specs/component.spec.json](./specs/component.spec.json).
