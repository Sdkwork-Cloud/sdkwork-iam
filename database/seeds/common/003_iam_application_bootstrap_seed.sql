-- Platform application template and default tenant applications for IAM bootstrap and dev seeds.
-- Runtime app_id values follow app_{tenant_id} for standard SDKWork tenant ids.

INSERT INTO iam_application_template (
  id,
  owner_tenant_id,
  app_key,
  name,
  display_name,
  app_type,
  version,
  channel,
  status,
  runtime_config_json,
  artifacts_config_json,
  default_access_permissions_json,
  created_at,
  updated_at
)
VALUES (
  'tmpl_sdkwork_platform',
  '0',
  'sdkwork-platform',
  'sdkwork-platform',
  'SDKWork Platform',
  'WEB',
  '1.0.0',
  'stable',
  'active',
  '{}'::jsonb,
  '{}'::jsonb,
  '["iam.self"]'::jsonb,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (id) DO UPDATE SET
  app_key = EXCLUDED.app_key,
  name = EXCLUDED.name,
  display_name = EXCLUDED.display_name,
  app_type = EXCLUDED.app_type,
  version = EXCLUDED.version,
  channel = EXCLUDED.channel,
  status = EXCLUDED.status,
  default_access_permissions_json = EXCLUDED.default_access_permissions_json,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO iam_tenant_application (
  id,
  app_id,
  tenant_id,
  organization_id,
  template_id,
  template_version,
  instance_key,
  display_name,
  environment,
  status,
  primary_domain,
  domain_config_json,
  access_permissions_json,
  runtime_config_json,
  provisioned_at,
  activated_at,
  created_at,
  updated_at
)
VALUES
  (
    'tapp_100001_default',
    'app_100001',
    '100001',
    '0',
    'tmpl_sdkwork_platform',
    '1.0.0',
    'default',
    'SDKWork Default',
    'prod',
    'enabled',
    'localhost',
    '{}'::jsonb,
    '["iam.self"]'::jsonb,
    '{}'::jsonb,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  )
ON CONFLICT (id) DO UPDATE SET
  app_id = EXCLUDED.app_id,
  template_id = EXCLUDED.template_id,
  template_version = EXCLUDED.template_version,
  display_name = EXCLUDED.display_name,
  environment = EXCLUDED.environment,
  status = EXCLUDED.status,
  primary_domain = EXCLUDED.primary_domain,
  access_permissions_json = EXCLUDED.access_permissions_json,
  activated_at = EXCLUDED.activated_at,
  updated_at = CURRENT_TIMESTAMP;
