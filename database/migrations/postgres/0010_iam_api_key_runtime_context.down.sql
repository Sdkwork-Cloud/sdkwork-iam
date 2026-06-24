DROP INDEX IF EXISTS idx_iam_api_key_tenant_app_status;

ALTER TABLE iam_api_key
  DROP COLUMN IF EXISTS deployment_mode,
  DROP COLUMN IF EXISTS environment,
  DROP COLUMN IF EXISTS app_id;
