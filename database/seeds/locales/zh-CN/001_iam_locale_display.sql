-- zh-CN display labels for IMF-materialized IAM directory and platform roles.
-- Idempotent updates. Re-applied after catalog materialization in AppbaseIamDatabaseModule::after_seed.

UPDATE iam_tenant
SET name = 'SDKWork 默认租户', updated_at = CURRENT_TIMESTAMP
WHERE id = '100001';

UPDATE iam_organization
SET name = '根组织', updated_at = CURRENT_TIMESTAMP
WHERE tenant_id = '100001' AND code = 'root';

UPDATE iam_department
SET name = '综合部', updated_at = CURRENT_TIMESTAMP
WHERE tenant_id = '100001' AND code = 'general';

UPDATE iam_department
SET name = '商务部', updated_at = CURRENT_TIMESTAMP
WHERE tenant_id = '100001' AND code = 'commerce';

UPDATE iam_department
SET name = '财务部', updated_at = CURRENT_TIMESTAMP
WHERE tenant_id = '100001' AND code = 'finance';

UPDATE iam_role SET name = '应用用户', updated_at = CURRENT_TIMESTAMP
WHERE tenant_id = '100001' AND code = 'app_user';

UPDATE iam_role SET name = '组织管理员', updated_at = CURRENT_TIMESTAMP
WHERE tenant_id = '100001' AND code = 'org_admin';

UPDATE iam_role SET name = '组织助理', updated_at = CURRENT_TIMESTAMP
WHERE tenant_id = '100001' AND code = 'org_assistant';

UPDATE iam_role SET name = '组织审计员', updated_at = CURRENT_TIMESTAMP
WHERE tenant_id = '100001' AND code = 'org_auditor';

UPDATE iam_role SET name = '组织财务', updated_at = CURRENT_TIMESTAMP
WHERE tenant_id = '100001' AND code = 'org_finance';

UPDATE iam_role SET name = '组织运营', updated_at = CURRENT_TIMESTAMP
WHERE tenant_id = '100001' AND code = 'org_operations';

UPDATE iam_role SET name = '平台系统管理员', updated_at = CURRENT_TIMESTAMP
WHERE tenant_id = '100001' AND code = 'platform_system_admin';

UPDATE iam_role SET name = '平台超级管理员', updated_at = CURRENT_TIMESTAMP
WHERE tenant_id = '100001' AND code = 'platform_super_admin';
