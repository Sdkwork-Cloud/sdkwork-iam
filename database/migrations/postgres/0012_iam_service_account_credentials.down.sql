DELETE FROM iam_session WHERE principal_kind = 'service_account';

ALTER TABLE iam_session
  DROP CONSTRAINT IF EXISTS iam_session_service_account_credential_fk;

DROP INDEX IF EXISTS idx_iam_session_credential_active;
DROP INDEX IF EXISTS idx_iam_session_principal_active;
DROP TABLE IF EXISTS iam_service_account_credential;

ALTER TABLE iam_session
  DROP COLUMN IF EXISTS credential_id,
  DROP COLUMN IF EXISTS principal_id,
  DROP COLUMN IF EXISTS principal_kind,
  ALTER COLUMN user_id SET NOT NULL;
