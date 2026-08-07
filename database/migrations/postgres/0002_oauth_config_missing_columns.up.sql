-- sdkwork:migration
-- id: 0002_oauth_config_missing_columns
-- engine: postgres
-- module: sdkwork-iam
-- purpose: Restore two columns the backend code has always written/read but
--   the baseline DDL never declared: iam_oauth_webhook_config.display_name
--   (created and listed by the admin webhook config API) and
--   iam_oauth_scan_login_config.modes_json (scan-login mode registry read by
--   both the app and backend scan-login handlers). Without them every
--   webhook config create/list and scan-login settings read fails with
--   "column does not exist".
-- reversible: true
-- rollback: drops both columns (loses stored display names and mode registry)
-- transactional: true
-- lock: lightweight
-- lock_timeout: 2s
-- statement_timeout: 30s
-- contract_version: 0.5.0
-- rewrite: column additions matching baseline

ALTER TABLE iam_oauth_webhook_config
  ADD COLUMN IF NOT EXISTS display_name TEXT NOT NULL DEFAULT '';

ALTER TABLE iam_oauth_scan_login_config
  ADD COLUMN IF NOT EXISTS modes_json TEXT NOT NULL DEFAULT '[]';
