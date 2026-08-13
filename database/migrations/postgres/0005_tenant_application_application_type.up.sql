-- sdkwork:migration
-- id: 0005_tenant_application_application_type
-- engine: postgres
-- module: sdkwork-iam
-- purpose: Add the product-semantic application_type column to
--   iam_tenant_application. Existing rows are backfilled from their
--   application template's platform app_type before NOT NULL is enforced,
--   keeping existing deployments consistent with fresh baseline installs.
-- reversible: true
-- rollback: down-migration
-- transactional: true
-- lock: lightweight
-- lock_timeout: 2s
-- statement_timeout: 30s

BEGIN;

ALTER TABLE iam_tenant_application ADD COLUMN IF NOT EXISTS application_type TEXT;

UPDATE iam_tenant_application ta
SET application_type = CASE
  WHEN t.app_type IN ('APP_HTML', 'APP_H5', 'H5') THEN 'h5'
  WHEN t.app_type IN ('APP_FLUTTER', 'FLUTTER') THEN 'flutter'
  WHEN t.app_type IN ('APP_REACT', 'APP_VUE', 'APP_PC', 'PC', 'WEB', 'DESKTOP') THEN 'pc'
  WHEN t.app_type IN ('APP_API', 'API', 'SDK') THEN 'api'
  ELSE 'other'
END
FROM iam_application_template t
WHERE ta.template_id = t.id;

UPDATE iam_tenant_application SET application_type = 'other' WHERE application_type IS NULL;

ALTER TABLE iam_tenant_application ALTER COLUMN application_type SET DEFAULT 'other';
ALTER TABLE iam_tenant_application ALTER COLUMN application_type SET NOT NULL;

COMMIT;
