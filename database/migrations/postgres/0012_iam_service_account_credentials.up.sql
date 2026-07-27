ALTER TABLE iam_session
  ALTER COLUMN user_id DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS principal_kind TEXT NOT NULL DEFAULT 'user',
  ADD COLUMN IF NOT EXISTS principal_id TEXT,
  ADD COLUMN IF NOT EXISTS credential_id TEXT;

UPDATE iam_session
SET principal_kind = 'user', principal_id = user_id
WHERE principal_id IS NULL;

ALTER TABLE iam_session
  ALTER COLUMN principal_id SET NOT NULL;

CREATE TABLE IF NOT EXISTS iam_service_account_credential (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  organization_id TEXT,
  service_account_id TEXT NOT NULL,
  tenant_application_id TEXT NOT NULL,
  app_id TEXT NOT NULL,
  client_id TEXT NOT NULL,
  secret_hash TEXT NOT NULL,
  secret_version INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'active',
  expires_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  UNIQUE (client_id),
  CONSTRAINT iam_service_account_credential_service_account_fk
    FOREIGN KEY (service_account_id) REFERENCES iam_service_account(id),
  CONSTRAINT iam_service_account_credential_tenant_application_fk
    FOREIGN KEY (tenant_application_id) REFERENCES iam_tenant_application(id)
);

CREATE INDEX IF NOT EXISTS idx_iam_service_account_credential_client_active
  ON iam_service_account_credential (client_id, status, expires_at);

CREATE INDEX IF NOT EXISTS idx_iam_service_account_credential_tenant_account
  ON iam_service_account_credential (tenant_id, service_account_id, status, created_at);

CREATE INDEX IF NOT EXISTS idx_iam_session_principal_active
  ON iam_session (tenant_id, principal_kind, principal_id, revoked_at, expires_at);

CREATE INDEX IF NOT EXISTS idx_iam_session_credential_active
  ON iam_session (credential_id, revoked_at, expires_at)
  WHERE credential_id IS NOT NULL;

ALTER TABLE iam_session
  ADD CONSTRAINT iam_session_service_account_credential_fk
    FOREIGN KEY (credential_id) REFERENCES iam_service_account_credential(id);
