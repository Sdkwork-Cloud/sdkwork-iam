-- IAM RBAC federation extensions: groups, service accounts, separation-of-duties exclusions.

CREATE TABLE IF NOT EXISTS iam_group (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  organization_id TEXT,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  group_kind TEXT NOT NULL DEFAULT 'general',
  status TEXT NOT NULL DEFAULT 'active',
  module_id TEXT,
  template_ref TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (tenant_id, code)
);

CREATE TABLE IF NOT EXISTS iam_group_member (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  group_id TEXT NOT NULL,
  principal_kind TEXT NOT NULL,
  principal_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  joined_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (tenant_id, group_id, principal_kind, principal_id)
);

CREATE TABLE IF NOT EXISTS iam_service_account (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  organization_id TEXT,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  credential_kind TEXT NOT NULL DEFAULT 'api_key',
  module_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (tenant_id, code)
);

CREATE TABLE IF NOT EXISTS iam_role_exclusion (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  role_id TEXT NOT NULL,
  excludes_role_id TEXT NOT NULL,
  reason TEXT,
  module_id TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (tenant_id, role_id, excludes_role_id)
);

CREATE INDEX IF NOT EXISTS idx_iam_group_tenant_status
  ON iam_group (tenant_id, status);

CREATE INDEX IF NOT EXISTS idx_iam_group_member_group
  ON iam_group_member (tenant_id, group_id, status);

CREATE INDEX IF NOT EXISTS idx_iam_service_account_tenant_status
  ON iam_service_account (tenant_id, status);

CREATE INDEX IF NOT EXISTS idx_iam_role_exclusion_tenant_role
  ON iam_role_exclusion (tenant_id, role_id, status);
