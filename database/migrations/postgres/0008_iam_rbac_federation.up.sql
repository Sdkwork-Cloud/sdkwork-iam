-- IAM RBAC federation metadata: permission/role governance columns, directory trace columns, registry tables.

ALTER TABLE iam_permission
  ADD COLUMN IF NOT EXISTS module_id TEXT NOT NULL DEFAULT 'legacy',
  ADD COLUMN IF NOT EXISTS domain TEXT NOT NULL DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS catalog_version TEXT NOT NULL DEFAULT '1.0.0',
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS deprecated_at TEXT,
  ADD COLUMN IF NOT EXISTS replacement_code TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE iam_role
  ADD COLUMN IF NOT EXISTS role_class TEXT NOT NULL DEFAULT 'tenant_custom',
  ADD COLUMN IF NOT EXISTS module_id TEXT,
  ADD COLUMN IF NOT EXISTS surface TEXT,
  ADD COLUMN IF NOT EXISTS assignable INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS standard INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS binding_principal_kind TEXT;

ALTER TABLE iam_organization
  ADD COLUMN IF NOT EXISTS template_ref TEXT,
  ADD COLUMN IF NOT EXISTS module_id TEXT,
  ADD COLUMN IF NOT EXISTS seed_profile TEXT,
  ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;

ALTER TABLE iam_department
  ADD COLUMN IF NOT EXISTS template_ref TEXT,
  ADD COLUMN IF NOT EXISTS module_id TEXT,
  ADD COLUMN IF NOT EXISTS seed_profile TEXT;

ALTER TABLE iam_position
  ADD COLUMN IF NOT EXISTS template_ref TEXT,
  ADD COLUMN IF NOT EXISTS module_id TEXT,
  ADD COLUMN IF NOT EXISTS seed_profile TEXT;

CREATE TABLE IF NOT EXISTS iam_module_registry_entry (
  id TEXT PRIMARY KEY,
  module_id TEXT NOT NULL,
  domain TEXT NOT NULL,
  owner TEXT NOT NULL,
  catalog_version TEXT NOT NULL,
  manifest_sha256 TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (module_id)
);

CREATE TABLE IF NOT EXISTS iam_module_registry_snapshot (
  id TEXT PRIMARY KEY,
  profile TEXT NOT NULL,
  lock_sha256 TEXT NOT NULL,
  snapshot_json TEXT NOT NULL,
  materialized_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS iam_catalog_materialization (
  id TEXT PRIMARY KEY,
  profile TEXT NOT NULL,
  permission_count INTEGER NOT NULL,
  role_count INTEGER NOT NULL,
  directory_node_count INTEGER NOT NULL,
  diff_json TEXT NOT NULL,
  materialized_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_iam_permission_domain_status
  ON iam_permission (domain, status);

CREATE INDEX IF NOT EXISTS idx_iam_role_tenant_class
  ON iam_role (tenant_id, role_class, status);

CREATE INDEX IF NOT EXISTS idx_iam_module_registry_entry_domain
  ON iam_module_registry_entry (domain, status);
