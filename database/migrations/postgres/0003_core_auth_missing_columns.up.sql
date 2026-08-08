-- sdkwork:migration
-- id: 0003_core_auth_missing_columns
-- engine: postgres
-- module: sdkwork-iam
-- purpose: Restore ten columns the backend code has always written/read but
--   the baseline DDL never declared. Without them the core auth flows fail
--   with "column does not exist":
--     - iam_session.principal_kind / principal_id: written by every access
--       token issuance INSERT (login) and read by session introspection
--     - iam_user.email_verified / phone_verified / last_login_at /
--       password_changed_at: written by contact update, login and password
--       change handlers, and selected by user list/detail queries
--     - iam_credential.failed_attempts / locked_until / last_used_at:
--       written by password verification and lockout handlers
--     - iam_security_event.environment: written by the security audit writer
-- reversible: true
-- rollback: drops all ten columns (loses stored verification/lockout/timestamps)
-- transactional: true
-- lock: lightweight
-- lock_timeout: 2s
-- statement_timeout: 30s
-- contract_version: 0.5.0
-- rewrite: column additions matching baseline

ALTER TABLE iam_session
  ADD COLUMN IF NOT EXISTS principal_kind TEXT NOT NULL DEFAULT 'user',
  ADD COLUMN IF NOT EXISTS principal_id TEXT;

ALTER TABLE iam_user
  ADD COLUMN IF NOT EXISTS email_verified INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS phone_verified INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_login_at TEXT,
  ADD COLUMN IF NOT EXISTS password_changed_at TEXT;

ALTER TABLE iam_credential
  ADD COLUMN IF NOT EXISTS failed_attempts INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS locked_until TEXT,
  ADD COLUMN IF NOT EXISTS last_used_at TEXT;

ALTER TABLE iam_security_event
  ADD COLUMN IF NOT EXISTS environment TEXT NOT NULL DEFAULT '';
