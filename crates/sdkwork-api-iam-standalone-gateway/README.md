# sdkwork-api-iam-standalone-gateway

Runnable standalone IAM HTTP gateway. It consumes the host-neutral IAM API assembly, installs the Web Framework layer once, and mounts `/healthz`, `/livez`, `/readyz`, `/metrics`, and `/openapi.json` through `sdkwork-web-bootstrap`.

Database readiness comes from the IAM assembly's initialized database host. Route crates and the host-neutral assembly do not mount process-wide infrastructure routes.

## Verification

```bash
cargo check -p sdkwork-api-iam-standalone-gateway
cargo test -p sdkwork-api-iam-standalone-gateway
```
