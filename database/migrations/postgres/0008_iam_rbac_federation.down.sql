DROP INDEX IF EXISTS idx_iam_module_registry_entry_domain;
DROP INDEX IF EXISTS idx_iam_role_tenant_class;
DROP INDEX IF EXISTS idx_iam_permission_domain_status;

DROP TABLE IF EXISTS iam_catalog_materialization;
DROP TABLE IF EXISTS iam_module_registry_snapshot;
DROP TABLE IF EXISTS iam_module_registry_entry;

ALTER TABLE iam_position
  DROP COLUMN IF EXISTS seed_profile,
  DROP COLUMN IF EXISTS module_id,
  DROP COLUMN IF EXISTS template_ref;

ALTER TABLE iam_department
  DROP COLUMN IF EXISTS seed_profile,
  DROP COLUMN IF EXISTS module_id,
  DROP COLUMN IF EXISTS template_ref;

ALTER TABLE iam_organization
  DROP COLUMN IF EXISTS sort_order,
  DROP COLUMN IF EXISTS seed_profile,
  DROP COLUMN IF EXISTS module_id,
  DROP COLUMN IF EXISTS template_ref;

ALTER TABLE iam_role
  DROP COLUMN IF EXISTS binding_principal_kind,
  DROP COLUMN IF EXISTS standard,
  DROP COLUMN IF EXISTS assignable,
  DROP COLUMN IF EXISTS surface,
  DROP COLUMN IF EXISTS module_id,
  DROP COLUMN IF EXISTS role_class;

ALTER TABLE iam_permission
  DROP COLUMN IF EXISTS updated_at,
  DROP COLUMN IF EXISTS replacement_code,
  DROP COLUMN IF EXISTS deprecated_at,
  DROP COLUMN IF EXISTS status,
  DROP COLUMN IF EXISTS catalog_version,
  DROP COLUMN IF EXISTS domain,
  DROP COLUMN IF EXISTS module_id;
