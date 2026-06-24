# sdkwork-iam-module-registry

IAM Module Federation (IMF) registry orchestrator for SDKWork applications.
Discovers `iam.module.manifest.json` files, validates catalog rules, merges
module permissions and roles, and materializes PostgreSQL/SQLite IAM catalogs.

## Verification

- `cargo test -p sdkwork-iam-module-registry`
- `pnpm run admin:iam-modules:validate`
