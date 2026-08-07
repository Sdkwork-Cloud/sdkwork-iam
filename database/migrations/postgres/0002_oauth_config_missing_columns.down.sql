-- sdkwork:migration
-- id: 0002_oauth_config_missing_columns
-- engine: postgres
-- module: sdkwork-iam
-- purpose: Roll back the added webhook display_name and scan-login modes_json
--   columns. Data in these columns is lost.
-- reversible: false
-- rollback: forward-fix
-- transactional: true
-- lock: lightweight
-- lock_timeout: 2s
-- statement_timeout: 30s
-- contract_version: 0.5.0
-- rewrite: column removal

ALTER TABLE iam_oauth_webhook_config
  DROP COLUMN IF EXISTS display_name;

ALTER TABLE iam_oauth_scan_login_config
  DROP COLUMN IF EXISTS modes_json;
