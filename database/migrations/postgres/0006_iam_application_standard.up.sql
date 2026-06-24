DROP TABLE IF EXISTS iam_application_package CASCADE;
DROP TABLE IF EXISTS iam_application CASCADE;

CREATE TABLE IF NOT EXISTS iam_application_template (
  id TEXT PRIMARY KEY,
  owner_tenant_id TEXT NOT NULL DEFAULT '0',
  app_key TEXT NOT NULL,
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  app_type TEXT NOT NULL,
  package_name TEXT,
  bundle_id TEXT,
  desktop_app_id TEXT,
  version TEXT NOT NULL,
  channel TEXT NOT NULL DEFAULT 'stable',
  status TEXT NOT NULL DEFAULT 'active',
  runtime_config_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  artifacts_config_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  default_access_permissions_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  manifest_hash TEXT,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  UNIQUE (app_key),
  UNIQUE (name)
);

CREATE UNIQUE INDEX IF NOT EXISTS uk_iam_application_template_package_name
  ON iam_application_template (package_name)
  WHERE package_name IS NOT NULL AND TRIM(package_name) <> '';

CREATE INDEX IF NOT EXISTS idx_iam_application_template_status
  ON iam_application_template (status, updated_at, id);

CREATE TABLE IF NOT EXISTS iam_application_template_package (
  id TEXT PRIMARY KEY,
  template_id TEXT NOT NULL REFERENCES iam_application_template(id) ON DELETE CASCADE,
  package_id TEXT NOT NULL,
  platform TEXT NOT NULL,
  architecture TEXT,
  language TEXT,
  runtime_target TEXT NOT NULL,
  deployment_profile TEXT NOT NULL,
  package_format TEXT NOT NULL,
  version TEXT,
  config_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  UNIQUE (template_id, package_id)
);

CREATE INDEX IF NOT EXISTS idx_iam_application_template_package_lookup
  ON iam_application_template_package (template_id, platform, architecture, language, status);

CREATE TABLE IF NOT EXISTS iam_tenant_application (
  id TEXT PRIMARY KEY,
  app_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  organization_id TEXT NOT NULL DEFAULT '0',
  template_id TEXT NOT NULL REFERENCES iam_application_template(id),
  template_version TEXT NOT NULL,
  instance_key TEXT NOT NULL,
  display_name TEXT NOT NULL,
  environment TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending_config',
  primary_domain TEXT,
  domain_config_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  access_permissions_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  runtime_config_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  provisioned_at TIMESTAMPTZ,
  activated_at TIMESTAMPTZ,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  UNIQUE (app_id),
  UNIQUE (tenant_id, instance_key)
);

CREATE UNIQUE INDEX IF NOT EXISTS uk_iam_tenant_application_primary_domain
  ON iam_tenant_application (tenant_id, primary_domain)
  WHERE primary_domain IS NOT NULL AND TRIM(primary_domain) <> '';

CREATE INDEX IF NOT EXISTS idx_iam_tenant_application_tenant_status
  ON iam_tenant_application (tenant_id, organization_id, status, updated_at, id);

CREATE INDEX IF NOT EXISTS idx_iam_tenant_application_template
  ON iam_tenant_application (template_id, tenant_id, status, id);
