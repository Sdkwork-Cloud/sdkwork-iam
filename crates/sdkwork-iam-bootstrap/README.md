# sdkwork-iam-bootstrap

Shared IAM default subject and permission catalog bootstrap for SDKWork
applications. Seeds standard IAM permissions and default tenant/org/user records
for SQLite and PostgreSQL runtimes.

## Verification

- `pnpm run test:iam-standard-contracts`
- `cargo test -p sdkwork-iam-bootstrap` when crate tests exist
