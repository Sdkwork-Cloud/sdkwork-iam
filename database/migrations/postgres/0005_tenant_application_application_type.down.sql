-- sdkwork:migration
-- id: 0005_tenant_application_application_type
-- engine: postgres
-- module: sdkwork-iam
-- purpose: Revert the product-semantic application_type column added to
--   iam_tenant_application.
-- reversible: true
-- rollback: down-migration
-- transactional: true
-- lock: lightweight
-- lock_timeout: 2s
-- statement_timeout: 30s

BEGIN;

ALTER TABLE iam_tenant_application DROP COLUMN IF EXISTS application_type;

COMMIT;
