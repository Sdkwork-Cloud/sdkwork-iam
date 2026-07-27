# IAM Standalone Gateway Contract

The component contract is declared in `component.spec.json`. Global authority remains in `API_ASSEMBLY_SPEC.md`, `APPLICATION_GATEWAY_SPEC.md`, `WEB_FRAMEWORK_SPEC.md`, `WEB_BACKEND_SPEC.md`, `RUST_CODE_SPEC.md`, `APP_RUNTIME_TOPOLOGY_SPEC.md`, and `TEST_SPEC.md` under `sdkwork-specs`.

The gateway owns process-wide middleware, infrastructure routes, served OpenAPI, and readiness wiring. It consumes business routers, route manifests, OpenAPI, and readiness capability from `sdkwork-api-iam-assembly`.

## Verification

```bash
cargo check -p sdkwork-api-iam-standalone-gateway
cargo test -p sdkwork-api-iam-standalone-gateway
```
