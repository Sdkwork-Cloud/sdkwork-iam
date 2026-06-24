DROP INDEX IF EXISTS idx_iam_role_exclusion_tenant_role;
DROP INDEX IF EXISTS idx_iam_service_account_tenant_status;
DROP INDEX IF EXISTS idx_iam_group_member_group;
DROP INDEX IF EXISTS idx_iam_group_tenant_status;

DROP TABLE IF EXISTS iam_role_exclusion;
DROP TABLE IF EXISTS iam_service_account;
DROP TABLE IF EXISTS iam_group_member;
DROP TABLE IF EXISTS iam_group;
