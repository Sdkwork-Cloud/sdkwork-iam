-- sdkwork:migration
-- id: 0003_core_auth_missing_columns
-- engine: postgres
-- module: sdkwork-iam
-- purpose: Roll back the ten core-auth columns. Data in these columns is lost.
-- reversible: false
-- rollback: forward-fix
-- transactional: true
-- lock: lightweight
-- lock_timeout: 2s
-- statement_timeout: 30s
-- contract_version: 0.5.0
-- rewrite: column removal

ALTER TABLE iam_session
  DROP COLUMN IF EXISTS principal_kind,
  DROP COLUMN IF EXISTS principal_id;

ALTER TABLE iam_user
  DROP COLUMN IF EXISTS email_verified,
  DROP COLUMN IF EXISTS phone_verified,
  DROP COLUMN IF EXISTS last_login_at,
  DROP COLUMN IF EXISTS password_changed_at;

ALTER TABLE iam_credential
  DROP COLUMN IF EXISTS failed_attempts,
  DROP COLUMN IF EXISTS locked_until,
  DROP COLUMN IF EXISTS last_used_at;

ALTER TABLE iam_security_event
  DROP COLUMN IF EXISTS environment;
