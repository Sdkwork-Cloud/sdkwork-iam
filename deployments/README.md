# Deployments

IAM deployment manifests, topology, and runbooks for gateway assembly and database bootstrap.

## Files

| Path | Purpose |
| --- | --- |
| `deployments/deploy.yaml` | SDKWork Deploy manifest (`SDKWORK_DEPLOY_SPEC.md`) |
| `specs/topology.spec.json` | Runtime topology for IAM HTTP gateway assembly |
| `deployments/runbooks/local-iam-rust.md` | Local Rust route crate verification |

## Deployment model

`sdkwork-iam` is a **base dependency domain repository**. Consumer applications federate IAM route crates through their own gateways. When IAM ships as a standalone HTTP service, deploy uses `sdkwork-iam-gateway-assembly` to mount app-api, backend-api, and open-api surfaces. Kubernetes and platform probes target `/healthz` (liveness) and `/readyz` (readiness) declared in `deployments/deploy.yaml` per `HEALTH_CHECK_SPEC.md`.

Production deployments MUST set `SDKWORK_IM_ENVIRONMENT=production`, `SDKWORK_IAM_APPLICATION_PUBLIC_INGRESS_BIND`, and `SDKWORK_IAM_SIGNING_MASTER_SECRET`, wire PostgreSQL, obtain a unique Snowflake node lease, and enable `SDKWORK_IAM_MESSAGING_VERIFICATION_ENABLED=true` when `SDKWORK_IAM_EMAIL_VERIFICATION_REQUIRED=true`.

`deployments/deploy.yaml` declares the production gateway binary package and public API ingress at `iam.sdkwork.com`. Topology bindings live in `specs/topology.spec.json`.

IAM owns the root `sdkwork.app.config.json` for its standalone gateway identity and least-privilege backend bootstrap scope. Consumer applications retain their own application manifests and consume IAM through composed SDKs or federated route entrypoints.

Owner: `sdkwork-iam` maintainers.
