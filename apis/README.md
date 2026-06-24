# APIs

Purpose: authored IAM API contract sources, route manifest inputs, examples, and validation fixtures.

Owner: `sdkwork-iam` maintainers.

## Active Surfaces

| Path | Surface | Authority |
| --- | --- | --- |
| `app-api/iam/` | app-api | `sdkwork-iam-app-api.openapi.yaml` |
| `backend-api/iam/` | backend-api | `sdkwork-iam-backend-api.openapi.yaml` |
| `open-api/iam/` | open-api | `sdkwork-iam-open-api.openapi.yaml` |
| `rpc/` | gRPC | protobuf contracts for IAM RPC |

Materialize OpenAPI authorities with `pnpm run api:materialize`.
