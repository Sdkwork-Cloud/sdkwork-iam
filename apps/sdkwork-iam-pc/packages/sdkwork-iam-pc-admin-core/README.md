# @sdkwork/iam-pc-admin-core

IAM PC `backend-admin` runtime package per `APP_PC_ARCHITECTURE_SPEC.md` §3.

Owns backend SDK inventory, admin capability module registry, and composition metadata for `@sdkwork/iam-pc-admin-*` packages. Does not own business pages or UI shells.

## Verification

```bash
pnpm --filter @sdkwork/iam-pc-admin-core typecheck
```
