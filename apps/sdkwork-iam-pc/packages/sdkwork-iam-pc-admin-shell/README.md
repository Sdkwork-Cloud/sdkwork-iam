# @sdkwork/iam-pc-admin-shell

IAM PC `backend-admin` shell per `APP_PC_ARCHITECTURE_SPEC.md` §3.

Exposes admin module menu metadata and route base paths for `@sdkwork/iam-pc-admin-*` capability packages. Host applications compose pages from capability packages into this shell.

## Verification

```bash
pnpm --filter @sdkwork/iam-pc-admin-shell typecheck
```
