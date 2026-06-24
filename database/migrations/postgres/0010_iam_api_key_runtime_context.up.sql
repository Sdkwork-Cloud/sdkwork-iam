ALTER TABLE iam_api_key
  ADD COLUMN IF NOT EXISTS app_id TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS environment TEXT NOT NULL DEFAULT 'prod',
  ADD COLUMN IF NOT EXISTS deployment_mode TEXT NOT NULL DEFAULT 'saas';

CREATE INDEX IF NOT EXISTS idx_iam_api_key_tenant_app_status
  ON iam_api_key (tenant_id, app_id, status);
