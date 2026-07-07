# IAM Runbooks

Status: active  
Owner: SDKWork maintainers

Operational runbooks for IAM production and staging deployments.

| Runbook | Purpose |
| --- | --- |
| [deployments/runbooks/local-iam-rust.md](../../deployments/runbooks/local-iam-rust.md) | Local gateway, PostgreSQL bootstrap, verification |
| [guides/operator/README.md](../guides/operator/README.md) | Production prerequisites, gateway surfaces, Snowflake node IDs |

## Verification

```powershell
cd E:\sdkwork-space\sdkwork-iam
pnpm run verify
```

## Incident response

1. Check `/readyz` and `/livez` on the IAM gateway assembly.
2. Confirm PostgreSQL connectivity (`SDKWORK_IAM_DATABASE_URL`).
3. Review `iam_security_event` and `iam_audit_event` via backend-api (`SdkWorkAuditEventListResponse` / `SdkWorkSecurityEventListResponse`) or the PC admin audit module (`@sdkwork/iam-pc-admin-audit`, debounced `q` search).
4. Ensure production hardening is active (`assert_production_hardening()`).
