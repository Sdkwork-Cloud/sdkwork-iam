# common/iam

Framework-independent IAM foundation packages.

## Package Layers

- `sdkwork-iam-contracts`: canonical API, database, SDK, security, context, table, and operationId contracts.
- `sdkwork-iam-rpc-contracts`: canonical gRPC/protobuf contracts for IAM app and backend service surfaces.
- `sdkwork-iam-sdk-ports`: generated app/backend SDK client shape without importing app-specific SDK packages.
- `sdkwork-iam-sdk-adapter`: strict adapter from standard generated appbase app/backend SDK resource clients into IAM ports; it unwraps SDK envelopes and rejects legacy login method names.
- `sdkwork-iam-service`: IAM business service over injected SDK clients.
- `sdkwork-iam-runtime`: deployment mode, environment, token store, and AppContext/ShardingContext propagation.

Dependency direction is one-way:

```text
runtime -> service -> sdk-ports -> contracts
adapter -> sdk-ports
```

No package in this domain may import React UI, Tauri host APIs, Java implementation details, Rust implementation details, or a concrete generated application SDK.
