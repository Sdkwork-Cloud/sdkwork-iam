-- IAM SQLite embedded baseline mirror (non-authoritative).
-- Production lifecycle uses PostgreSQL only; see database/database.manifest.json.
-- This file supports embedded/OAuth-device runtime paths and is not executed by sdkwork-iam-db.

-- source: database/ddl/baseline/postgres/0001_iam_baseline.sql#foundation
CREATE TABLE IF NOT EXISTS iam_tenant (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS iam_tenant_member (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  member_kind TEXT NOT NULL,
  status TEXT NOT NULL,
  joined_at TEXT NOT NULL,
  left_at TEXT,
  remark TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (tenant_id, user_id, member_kind)
);

CREATE TABLE IF NOT EXISTS iam_tenant_signing_key (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  kid TEXT NOT NULL,
  alg TEXT NOT NULL,
  secret_ref TEXT NOT NULL,
  secret_hash TEXT NOT NULL,
  status TEXT NOT NULL,
  active_from TEXT NOT NULL,
  active_until TEXT,
  rotated_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (tenant_id, kid)
);

CREATE TABLE IF NOT EXISTS iam_organization (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  parent_organization_id TEXT,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  organization_kind TEXT NOT NULL,
  tenant_boundary_kind TEXT NOT NULL,
  data_boundary_kind TEXT NOT NULL,
  app_boundary_enabled INTEGER NOT NULL DEFAULT 0,
  verification_status TEXT NOT NULL,
  path TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (tenant_id, code)
);

CREATE TABLE IF NOT EXISTS iam_organization_closure (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  ancestor_organization_id TEXT NOT NULL,
  descendant_organization_id TEXT NOT NULL,
  depth INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE (tenant_id, ancestor_organization_id, descendant_organization_id)
);

CREATE TABLE IF NOT EXISTS iam_organization_membership (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  organization_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  membership_kind TEXT NOT NULL,
  employee_no TEXT,
  display_name TEXT,
  is_primary INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL,
  joined_at TEXT NOT NULL,
  left_at TEXT,
  remark TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (tenant_id, organization_id, user_id, membership_kind)
);

CREATE TABLE IF NOT EXISTS iam_department (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  organization_id TEXT NOT NULL,
  parent_department_id TEXT,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  department_kind TEXT NOT NULL,
  path TEXT NOT NULL,
  cost_center_code TEXT,
  manager_membership_id TEXT,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (tenant_id, organization_id, code)
);

CREATE TABLE IF NOT EXISTS iam_department_closure (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  organization_id TEXT NOT NULL,
  ancestor_department_id TEXT NOT NULL,
  descendant_department_id TEXT NOT NULL,
  depth INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE (tenant_id, organization_id, ancestor_department_id, descendant_department_id)
);

CREATE TABLE IF NOT EXISTS iam_department_assignment (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  organization_id TEXT NOT NULL,
  organization_membership_id TEXT NOT NULL,
  department_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  assignment_kind TEXT NOT NULL,
  is_primary INTEGER NOT NULL DEFAULT 0,
  effective_from TEXT NOT NULL,
  effective_to TEXT,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (tenant_id, organization_id, organization_membership_id, department_id, assignment_kind)
);

CREATE TABLE IF NOT EXISTS iam_position (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  organization_id TEXT NOT NULL,
  department_id TEXT,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  position_kind TEXT NOT NULL,
  rank_level INTEGER,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (tenant_id, organization_id, code)
);

CREATE TABLE IF NOT EXISTS iam_position_assignment (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  organization_id TEXT NOT NULL,
  department_assignment_id TEXT NOT NULL,
  position_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  is_primary INTEGER NOT NULL DEFAULT 0,
  effective_from TEXT NOT NULL,
  effective_to TEXT,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (tenant_id, organization_id, department_assignment_id, position_id)
);

CREATE TABLE IF NOT EXISTS iam_user (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  username TEXT NOT NULL,
  display_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  avatar_media_resource_id TEXT,
  avatar_object_blob_id TEXT,
  avatar_resource_snapshot TEXT,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (tenant_id, username)
);

CREATE TABLE IF NOT EXISTS iam_user_identity (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  subject TEXT NOT NULL,
  email TEXT,
  created_at TEXT NOT NULL,
  UNIQUE (tenant_id, provider, subject)
);

CREATE TABLE IF NOT EXISTS iam_credential (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  credential_type TEXT NOT NULL,
  credential_hash TEXT NOT NULL,
  status TEXT NOT NULL,
  expires_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS iam_session (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  organization_id TEXT,
  login_scope TEXT NOT NULL,
  user_id TEXT NOT NULL,
  app_id TEXT NOT NULL,
  environment TEXT NOT NULL,
  deployment_mode TEXT NOT NULL,
  auth_level TEXT NOT NULL,
  auth_token_hash TEXT NOT NULL,
  auth_token_kid TEXT NOT NULL,
  access_token_hash TEXT NOT NULL,
  access_token_kid TEXT NOT NULL,
  refresh_token_hash TEXT,
  refresh_token_kid TEXT,
  sharding_key TEXT NOT NULL,
  sharding_strategy TEXT NOT NULL,
  data_scope_json TEXT NOT NULL,
  permission_scope_json TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  revoked_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS iam_mfa_factor (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  factor_type TEXT NOT NULL,
  secret_ref TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS iam_device (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  device_fingerprint TEXT NOT NULL,
  name TEXT,
  trusted INTEGER NOT NULL DEFAULT 0,
  last_seen_at TEXT,
  created_at TEXT NOT NULL,
  UNIQUE (tenant_id, user_id, device_fingerprint)
);

CREATE TABLE IF NOT EXISTS iam_role (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (tenant_id, code)
);

CREATE TABLE IF NOT EXISTS iam_permission (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  resource TEXT NOT NULL,
  action TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS iam_policy (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  policy_json TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (tenant_id, code)
);

CREATE TABLE IF NOT EXISTS iam_role_permission (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  role_id TEXT NOT NULL,
  permission_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE (tenant_id, role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS iam_role_binding (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  organization_id TEXT NOT NULL DEFAULT '0',
  role_id TEXT NOT NULL,
  principal_kind TEXT NOT NULL,
  principal_id TEXT NOT NULL,
  scope_kind TEXT NOT NULL,
  scope_id TEXT NOT NULL,
  effect TEXT NOT NULL,
  condition_json TEXT,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (tenant_id, role_id, principal_kind, principal_id, scope_kind, scope_id)
);

CREATE TABLE IF NOT EXISTS iam_api_key (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  organization_id TEXT NOT NULL DEFAULT '0',
  user_id TEXT NOT NULL,
  app_id TEXT NOT NULL,
  environment TEXT NOT NULL DEFAULT 'prod',
  deployment_mode TEXT NOT NULL DEFAULT 'saas',
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  permission_scope_json TEXT NOT NULL,
  status TEXT NOT NULL,
  expires_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS iam_security_event (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  organization_id TEXT NOT NULL DEFAULT '0',
  user_id TEXT,
  session_id TEXT,
  event_type TEXT NOT NULL,
  severity TEXT NOT NULL,
  detail_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS iam_audit_event (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  organization_id TEXT,
  actor_user_id TEXT,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  request_id TEXT,
  app_id TEXT,
  environment TEXT,
  sharding_key TEXT,
  detail_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS iam_oauth_provider_catalog (
  id TEXT PRIMARY KEY,
  uuid TEXT NOT NULL,
  owner_tenant_id TEXT NOT NULL DEFAULT '0',
  provider_code TEXT NOT NULL,
  provider_family TEXT NOT NULL,
  provider_name TEXT NOT NULL,
  provider_display_name TEXT NOT NULL,
  region_group TEXT NOT NULL,
  protocol_family TEXT NOT NULL,
  issuer TEXT,
  authorization_endpoint TEXT,
  token_endpoint TEXT,
  userinfo_endpoint TEXT,
  jwks_uri TEXT,
  discovery_url TEXT,
  revocation_endpoint TEXT,
  introspection_endpoint TEXT,
  device_authorization_endpoint TEXT,
  default_scopes_json TEXT NOT NULL DEFAULT '[]',
  required_scopes_json TEXT NOT NULL DEFAULT '[]',
  supported_surface_kinds_json TEXT NOT NULL DEFAULT '[]',
  supported_flow_kinds_json TEXT NOT NULL DEFAULT '[]',
  supported_capabilities_json TEXT NOT NULL DEFAULT '[]',
  supported_resource_account_kinds_json TEXT NOT NULL DEFAULT '[]',
  supported_access_modes_json TEXT NOT NULL DEFAULT '[]',
  supports_pkce INTEGER NOT NULL DEFAULT 0,
  supports_nonce INTEGER NOT NULL DEFAULT 0,
  supports_state INTEGER NOT NULL DEFAULT 1,
  supports_refresh_token INTEGER NOT NULL DEFAULT 0,
  supports_id_token INTEGER NOT NULL DEFAULT 0,
  supports_userinfo INTEGER NOT NULL DEFAULT 0,
  supports_revocation INTEGER NOT NULL DEFAULT 0,
  supports_introspection INTEGER NOT NULL DEFAULT 0,
  supports_device_code INTEGER NOT NULL DEFAULT 0,
  supports_union_id INTEGER NOT NULL DEFAULT 0,
  client_auth_methods_json TEXT NOT NULL DEFAULT '[]',
  provider_client_field_schema_json TEXT NOT NULL DEFAULT '{}',
  provider_surface_field_schema_json TEXT NOT NULL DEFAULT '{}',
  provider_secret_field_schema_json TEXT NOT NULL DEFAULT '{}',
  provider_flow_field_schema_json TEXT NOT NULL DEFAULT '{}',
  provider_resource_account_field_schema_json TEXT NOT NULL DEFAULT '{}',
  provider_operator_platform_field_schema_json TEXT NOT NULL DEFAULT '{}',
  provider_webhook_field_schema_json TEXT NOT NULL DEFAULT '{}',
  provider_operational_resource_schema_json TEXT NOT NULL DEFAULT '{}',
  claim_schema_json TEXT NOT NULL DEFAULT '{}',
  diagnostic_schema_json TEXT NOT NULL DEFAULT '{}',
  documentation_url TEXT,
  status TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  catalog_version INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS iam_oauth_integration (
  id TEXT PRIMARY KEY,
  uuid TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  organization_id TEXT NOT NULL DEFAULT '0',
  app_id TEXT NOT NULL DEFAULT '0',
  environment TEXT NOT NULL,
  deployment_mode TEXT NOT NULL,
  provider_code TEXT NOT NULL,
  provider_catalog_id TEXT NOT NULL,
  integration_code TEXT NOT NULL,
  display_name TEXT NOT NULL,
  purpose_json TEXT NOT NULL DEFAULT '[]',
  capability_json TEXT NOT NULL DEFAULT '[]',
  region_group TEXT NOT NULL,
  protocol_family TEXT NOT NULL,
  account_operation_enabled INTEGER NOT NULL DEFAULT 0,
  operator_authorization_enabled INTEGER NOT NULL DEFAULT 0,
  default_surface_id TEXT,
  default_policy_id TEXT,
  enabled INTEGER NOT NULL DEFAULT 0,
  health_status TEXT NOT NULL,
  last_diagnostic_run_id TEXT,
  last_validated_at TEXT,
  status TEXT NOT NULL,
  created_by TEXT,
  updated_by TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS iam_oauth_client (
  id TEXT PRIMARY KEY,
  uuid TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  organization_id TEXT NOT NULL DEFAULT '0',
  integration_id TEXT NOT NULL,
  provider_code TEXT NOT NULL,
  client_code TEXT NOT NULL,
  display_name TEXT NOT NULL,
  provider_client_id TEXT NOT NULL,
  provider_app_id TEXT,
  provider_tenant_id TEXT,
  provider_account_id TEXT,
  issuer_override TEXT,
  authorization_endpoint_override TEXT,
  token_endpoint_override TEXT,
  userinfo_endpoint_override TEXT,
  jwks_uri_override TEXT,
  discovery_url_override TEXT,
  revocation_endpoint_override TEXT,
  introspection_endpoint_override TEXT,
  device_authorization_endpoint_override TEXT,
  default_scope_profile_id TEXT,
  client_auth_method TEXT NOT NULL,
  pkce_default_mode TEXT NOT NULL,
  provider_config_json TEXT NOT NULL DEFAULT '{}',
  secret_config_status TEXT NOT NULL,
  enabled INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL,
  created_by TEXT,
  updated_by TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS iam_oauth_secret (
  id TEXT PRIMARY KEY,
  uuid TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  organization_id TEXT NOT NULL DEFAULT '0',
  secret_owner_kind TEXT NOT NULL,
  secret_owner_id TEXT NOT NULL,
  integration_id TEXT,
  oauth_client_id TEXT,
  resource_account_id TEXT,
  operator_platform_id TEXT,
  resource_authorization_id TEXT,
  webhook_config_id TEXT,
  grant_id TEXT,
  secret_kind TEXT NOT NULL,
  provider_key_id TEXT,
  algorithm TEXT,
  secret_ref TEXT NOT NULL,
  secret_hash TEXT NOT NULL,
  public_fingerprint TEXT,
  active_from TEXT NOT NULL,
  active_until TEXT,
  rotated_at TEXT,
  rotation_batch_id TEXT,
  status TEXT NOT NULL,
  created_by TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS iam_oauth_surface (
  id TEXT PRIMARY KEY,
  uuid TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  organization_id TEXT NOT NULL DEFAULT '0',
  integration_id TEXT NOT NULL,
  oauth_client_id TEXT NOT NULL,
  surface_kind TEXT NOT NULL,
  surface_code TEXT NOT NULL,
  display_name TEXT NOT NULL,
  redirect_uri TEXT,
  redirect_uri_hash TEXT,
  callback_path TEXT,
  allowed_origin TEXT,
  allowed_redirect_hosts_json TEXT NOT NULL DEFAULT '[]',
  default_post_login_redirect TEXT,
  redirect_validation_mode TEXT NOT NULL,
  pkce_mode TEXT NOT NULL,
  client_auth_method TEXT NOT NULL,
  web_domain TEXT,
  h5_domain TEXT,
  desktop_app_id TEXT,
  custom_url_scheme TEXT,
  universal_link_domain TEXT,
  app_link_domain TEXT,
  ios_bundle_id TEXT,
  ios_team_id TEXT,
  ios_app_store_id TEXT,
  android_package_name TEXT,
  android_sha1_fingerprint TEXT,
  android_sha256_fingerprint TEXT,
  android_play_store_package TEXT,
  mini_program_app_id TEXT,
  mini_program_original_id TEXT,
  mini_program_environment TEXT,
  mini_program_provider TEXT,
  mini_program_release_channel TEXT,
  mini_program_path TEXT,
  mini_program_query_template TEXT,
  mini_program_scene TEXT,
  provider_surface_config_json TEXT NOT NULL DEFAULT '{}',
  enabled INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS iam_oauth_flow_config (
  id TEXT PRIMARY KEY,
  uuid TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  organization_id TEXT NOT NULL DEFAULT '0',
  integration_id TEXT NOT NULL,
  oauth_client_id TEXT NOT NULL,
  surface_id TEXT,
  flow_kind TEXT NOT NULL,
  flow_purpose TEXT NOT NULL,
  scope_profile_id TEXT,
  requires_pkce INTEGER NOT NULL DEFAULT 0,
  requires_nonce INTEGER NOT NULL DEFAULT 0,
  requires_state INTEGER NOT NULL DEFAULT 1,
  requires_user_consent INTEGER NOT NULL DEFAULT 0,
  allowed_response_types_json TEXT NOT NULL DEFAULT '[]',
  allowed_grant_types_json TEXT NOT NULL DEFAULT '[]',
  token_endpoint_auth_method TEXT,
  provider_code_exchange_endpoint_override TEXT,
  mini_program_code_ttl_seconds INTEGER,
  mini_program_phone_authorization_enabled INTEGER NOT NULL DEFAULT 0,
  mini_program_profile_authorization_enabled INTEGER NOT NULL DEFAULT 0,
  provider_session_key_retention_policy TEXT NOT NULL DEFAULT 'none',
  flow_config_json TEXT NOT NULL DEFAULT '{}',
  enabled INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS iam_oauth_scope_profile (
  id TEXT PRIMARY KEY,
  uuid TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  organization_id TEXT NOT NULL DEFAULT '0',
  integration_id TEXT NOT NULL,
  provider_code TEXT NOT NULL,
  scope_profile_code TEXT NOT NULL,
  display_name TEXT NOT NULL,
  purpose TEXT NOT NULL,
  requested_scopes_json TEXT NOT NULL DEFAULT '[]',
  required_scopes_json TEXT NOT NULL DEFAULT '[]',
  blocked_scopes_json TEXT NOT NULL DEFAULT '[]',
  consent_label TEXT,
  consent_description TEXT,
  provider_api_purpose_json TEXT NOT NULL DEFAULT '{}',
  minimum_for_login INTEGER NOT NULL DEFAULT 0,
  offline_access_requested INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS iam_oauth_claim_mapping (
  id TEXT PRIMARY KEY,
  uuid TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  organization_id TEXT NOT NULL DEFAULT '0',
  integration_id TEXT NOT NULL,
  oauth_client_id TEXT,
  surface_id TEXT,
  provider_code TEXT NOT NULL,
  external_claim TEXT NOT NULL,
  target_kind TEXT NOT NULL,
  target_field TEXT NOT NULL,
  transform_kind TEXT NOT NULL,
  required INTEGER NOT NULL DEFAULT 0,
  verified_required INTEGER NOT NULL DEFAULT 0,
  mapping_config_json TEXT NOT NULL DEFAULT '{}',
  status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS iam_oauth_policy (
  id TEXT PRIMARY KEY,
  uuid TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  organization_id TEXT NOT NULL DEFAULT '0',
  integration_id TEXT,
  policy_code TEXT NOT NULL,
  display_name TEXT NOT NULL,
  login_enabled INTEGER NOT NULL DEFAULT 0,
  account_linking_enabled INTEGER NOT NULL DEFAULT 0,
  api_delegation_enabled INTEGER NOT NULL DEFAULT 0,
  client_credentials_enabled INTEGER NOT NULL DEFAULT 0,
  auto_registration_enabled INTEGER NOT NULL DEFAULT 0,
  account_linking_policy_json TEXT NOT NULL DEFAULT '{}',
  token_retention_policy_json TEXT NOT NULL DEFAULT '{}',
  risk_policy_json TEXT NOT NULL DEFAULT '{}',
  status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS iam_oauth_tenant_binding (
  id TEXT PRIMARY KEY,
  uuid TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  organization_id TEXT NOT NULL DEFAULT '0',
  provider_code TEXT NOT NULL,
  integration_id TEXT NOT NULL,
  oauth_client_id TEXT,
  binding_kind TEXT NOT NULL,
  external_tenant_id TEXT,
  external_tenant_name_snapshot TEXT,
  external_domain TEXT,
  issuer TEXT,
  mapped_tenant_id TEXT NOT NULL,
  mapped_organization_id TEXT NOT NULL DEFAULT '0',
  default_department_id TEXT,
  auto_join_enabled INTEGER NOT NULL DEFAULT 0,
  allowed_user_patterns_json TEXT NOT NULL DEFAULT '[]',
  denied_user_patterns_json TEXT NOT NULL DEFAULT '[]',
  binding_config_json TEXT NOT NULL DEFAULT '{}',
  status TEXT NOT NULL,
  created_by TEXT,
  updated_by TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS iam_oauth_operator_platform (
  id TEXT PRIMARY KEY,
  uuid TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  organization_id TEXT NOT NULL DEFAULT '0',
  integration_id TEXT NOT NULL,
  provider_code TEXT NOT NULL,
  platform_code TEXT NOT NULL,
  display_name TEXT NOT NULL,
  operator_mode TEXT NOT NULL,
  provider_platform_id TEXT NOT NULL,
  provider_tenant_id TEXT,
  provider_account_id TEXT,
  authorization_status TEXT NOT NULL,
  authorization_entry_url TEXT,
  authorization_callback_url TEXT,
  event_callback_url TEXT,
  message_callback_url TEXT,
  webhook_verify_status TEXT NOT NULL,
  ticket_secret_status TEXT NOT NULL,
  token_secret_status TEXT NOT NULL,
  capability_json TEXT NOT NULL DEFAULT '[]',
  provider_config_json TEXT NOT NULL DEFAULT '{}',
  enabled INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL,
  created_by TEXT,
  updated_by TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS iam_oauth_resource_account (
  id TEXT PRIMARY KEY,
  uuid TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  organization_id TEXT NOT NULL DEFAULT '0',
  integration_id TEXT NOT NULL,
  oauth_client_id TEXT,
  operator_platform_id TEXT,
  provider_code TEXT NOT NULL,
  resource_account_code TEXT NOT NULL,
  resource_account_kind TEXT NOT NULL,
  access_mode TEXT NOT NULL,
  display_name TEXT NOT NULL,
  provider_account_id TEXT NOT NULL,
  provider_account_original_id TEXT,
  provider_union_scope_id TEXT,
  provider_account_type TEXT,
  provider_account_region TEXT,
  subject_name_snapshot TEXT,
  principal_name_snapshot TEXT,
  service_category TEXT,
  verification_status TEXT NOT NULL,
  authorization_status TEXT NOT NULL,
  capability_json TEXT NOT NULL DEFAULT '[]',
  self_managed_config_status TEXT NOT NULL,
  operator_authorization_status TEXT NOT NULL,
  webhook_verify_status TEXT NOT NULL,
  domain_verify_status TEXT NOT NULL,
  default_web_oauth_surface_id TEXT,
  default_mini_program_surface_id TEXT,
  default_login_entry_resource_id TEXT,
  qr_default_enabled INTEGER NOT NULL DEFAULT 0,
  last_authorized_at TEXT,
  last_authorization_refreshed_at TEXT,
  last_verified_at TEXT,
  provider_config_json TEXT NOT NULL DEFAULT '{}',
  enabled INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL,
  created_by TEXT,
  updated_by TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS iam_oauth_resource_authorization (
  id TEXT PRIMARY KEY,
  uuid TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  organization_id TEXT NOT NULL DEFAULT '0',
  integration_id TEXT NOT NULL,
  resource_account_id TEXT NOT NULL,
  operator_platform_id TEXT,
  oauth_client_id TEXT,
  provider_code TEXT NOT NULL,
  authorization_mode TEXT NOT NULL,
  authorization_code_hash TEXT,
  pre_auth_code_hash TEXT,
  authorizer_access_token_hash TEXT,
  authorizer_refresh_token_secret_ref TEXT,
  authorized_scopes_json TEXT NOT NULL DEFAULT '[]',
  authorized_capabilities_json TEXT NOT NULL DEFAULT '[]',
  authorization_info_json TEXT NOT NULL DEFAULT '{}',
  pre_auth_expires_at TEXT,
  authorized_at TEXT,
  expires_at TEXT,
  revoked_at TEXT,
  last_refreshed_at TEXT,
  next_refresh_at TEXT,
  last_refresh_error_code TEXT,
  last_refresh_error_at TEXT,
  status TEXT NOT NULL,
  created_by TEXT,
  updated_by TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS iam_oauth_webhook_config (
  id TEXT PRIMARY KEY,
  uuid TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  organization_id TEXT NOT NULL DEFAULT '0',
  integration_id TEXT NOT NULL,
  resource_account_id TEXT,
  operator_platform_id TEXT,
  provider_code TEXT NOT NULL,
  webhook_code TEXT NOT NULL,
  webhook_kind TEXT NOT NULL,
  callback_url TEXT NOT NULL,
  callback_url_hash TEXT NOT NULL,
  callback_public_id TEXT NOT NULL,
  callback_path_token_hash TEXT,
  verification_token_status TEXT NOT NULL,
  encoding_aes_key_status TEXT NOT NULL,
  encryption_mode TEXT NOT NULL,
  signature_algorithm TEXT,
  allowed_event_types_json TEXT NOT NULL DEFAULT '[]',
  message_handling_mode TEXT NOT NULL,
  forward_target_ref TEXT,
  last_verified_at TEXT,
  last_verify_error_code TEXT,
  last_event_at TEXT,
  last_event_id TEXT,
  provider_config_json TEXT NOT NULL DEFAULT '{}',
  enabled INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL,
  created_by TEXT,
  updated_by TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS iam_oauth_operational_resource (
  id TEXT PRIMARY KEY,
  uuid TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  organization_id TEXT NOT NULL DEFAULT '0',
  integration_id TEXT NOT NULL,
  resource_account_id TEXT NOT NULL,
  provider_code TEXT NOT NULL,
  resource_kind TEXT NOT NULL,
  resource_code TEXT NOT NULL,
  display_name TEXT NOT NULL,
  parent_resource_id TEXT,
  resource_type TEXT,
  target_url TEXT,
  target_url_hash TEXT,
  target_app_id TEXT,
  target_path TEXT,
  match_rule_json TEXT NOT NULL DEFAULT '{}',
  content_snapshot_json TEXT NOT NULL DEFAULT '{}',
  provider_resource_id TEXT,
  provider_revision TEXT,
  sync_mode TEXT NOT NULL,
  publish_status TEXT NOT NULL,
  published_at TEXT,
  last_publish_error_code TEXT,
  last_publish_error_at TEXT,
  last_synced_at TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  provider_config_json TEXT NOT NULL DEFAULT '{}',
  status TEXT NOT NULL,
  created_by TEXT,
  updated_by TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS iam_oauth_authorization_state (
  id TEXT PRIMARY KEY,
  uuid TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  organization_id TEXT NOT NULL DEFAULT '0',
  app_id TEXT NOT NULL DEFAULT '0',
  environment TEXT NOT NULL,
  provider_code TEXT NOT NULL,
  integration_id TEXT NOT NULL,
  oauth_client_id TEXT,
  surface_id TEXT,
  surface_kind TEXT NOT NULL,
  flow_kind TEXT NOT NULL,
  state_hash TEXT,
  nonce_hash TEXT,
  pkce_challenge TEXT,
  pkce_challenge_method TEXT,
  code_verifier_secret_ref TEXT,
  device_code_hash TEXT,
  user_code_hash TEXT,
  redirect_uri TEXT,
  redirect_uri_hash TEXT,
  requested_scopes_json TEXT NOT NULL DEFAULT '[]',
  return_path TEXT,
  return_url_hash TEXT,
  device_id_hash TEXT,
  request_ip_hash TEXT,
  user_agent_hash TEXT,
  status TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  consumed_at TEXT,
  failed_at TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS iam_oauth_account_link (
  id TEXT PRIMARY KEY,
  uuid TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  organization_id TEXT NOT NULL DEFAULT '0',
  user_id TEXT NOT NULL,
  provider_code TEXT NOT NULL,
  integration_id TEXT NOT NULL,
  oauth_client_id TEXT,
  external_subject TEXT,
  external_subject_hash TEXT NOT NULL,
  external_union_id TEXT,
  external_union_id_hash TEXT,
  provider_union_scope_id TEXT,
  external_open_id TEXT,
  external_open_id_hash TEXT,
  external_tenant_id TEXT,
  external_account_display_snapshot TEXT,
  email_hash TEXT,
  phone_hash TEXT,
  email_verified INTEGER NOT NULL DEFAULT 0,
  phone_verified INTEGER NOT NULL DEFAULT 0,
  link_source TEXT NOT NULL,
  last_login_at TEXT,
  linked_at TEXT NOT NULL,
  unlinked_at TEXT,
  status TEXT NOT NULL,
  claim_snapshot_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS iam_oauth_grant (
  id TEXT PRIMARY KEY,
  uuid TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  organization_id TEXT NOT NULL DEFAULT '0',
  grant_owner_kind TEXT NOT NULL,
  user_id TEXT,
  service_principal_id TEXT,
  account_link_id TEXT,
  provider_code TEXT NOT NULL,
  integration_id TEXT NOT NULL,
  oauth_client_id TEXT,
  surface_id TEXT,
  flow_kind TEXT NOT NULL,
  authorized_scopes_json TEXT NOT NULL DEFAULT '[]',
  access_token_ref TEXT,
  access_token_hash TEXT,
  refresh_token_ref TEXT,
  refresh_token_hash TEXT,
  id_token_hash TEXT,
  token_expires_at TEXT,
  refresh_token_expires_at TEXT,
  issued_at TEXT,
  last_refreshed_at TEXT,
  revoked_at TEXT,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS iam_oauth_callback_event (
  id TEXT PRIMARY KEY,
  uuid TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  organization_id TEXT NOT NULL DEFAULT '0',
  app_id TEXT,
  environment TEXT,
  provider_code TEXT NOT NULL,
  integration_id TEXT,
  oauth_client_id TEXT,
  surface_id TEXT,
  authorization_state_id TEXT,
  request_id TEXT,
  flow_kind TEXT,
  outcome TEXT NOT NULL,
  error_code TEXT,
  provider_error_code TEXT,
  provider_http_status INTEGER,
  provider_event_id TEXT,
  provider_event_type TEXT,
  webhook_config_id TEXT,
  resource_account_id TEXT,
  operator_platform_id TEXT,
  external_subject_hash TEXT,
  redirect_uri_hash TEXT,
  state_valid INTEGER,
  nonce_valid INTEGER,
  pkce_valid INTEGER,
  token_exchange_ms INTEGER,
  userinfo_fetch_ms INTEGER,
  request_ip_hash TEXT,
  user_agent_hash TEXT,
  detail_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS iam_oauth_diagnostic_run (
  id TEXT PRIMARY KEY,
  uuid TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  organization_id TEXT NOT NULL DEFAULT '0',
  integration_id TEXT,
  oauth_client_id TEXT,
  surface_id TEXT,
  provider_code TEXT NOT NULL,
  run_kind TEXT NOT NULL,
  status TEXT NOT NULL,
  started_at TEXT,
  finished_at TEXT,
  duration_ms INTEGER,
  operator_user_id TEXT,
  request_id TEXT,
  result_code TEXT,
  result_summary TEXT,
  redacted_result_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_iam_organization_tenant_parent
  ON iam_organization (tenant_id, parent_organization_id, status);

CREATE INDEX IF NOT EXISTS idx_iam_tenant_member_tenant_user
  ON iam_tenant_member (tenant_id, user_id, status);

CREATE INDEX IF NOT EXISTS idx_iam_tenant_signing_key_active
  ON iam_tenant_signing_key (tenant_id, status, active_from, active_until);

CREATE INDEX IF NOT EXISTS idx_iam_organization_closure_descendant
  ON iam_organization_closure (tenant_id, descendant_organization_id, ancestor_organization_id, depth);

CREATE INDEX IF NOT EXISTS idx_iam_organization_membership_tenant_user
  ON iam_organization_membership (tenant_id, user_id, organization_id, status);

CREATE INDEX IF NOT EXISTS idx_iam_department_tenant_organization_parent
  ON iam_department (tenant_id, organization_id, parent_department_id, status);

CREATE INDEX IF NOT EXISTS idx_iam_department_closure_descendant
  ON iam_department_closure (tenant_id, organization_id, descendant_department_id, ancestor_department_id, depth);

CREATE INDEX IF NOT EXISTS idx_iam_department_assignment_tenant_user
  ON iam_department_assignment (tenant_id, user_id, organization_id, department_id, status);

CREATE INDEX IF NOT EXISTS idx_iam_position_tenant_organization_department
  ON iam_position (tenant_id, organization_id, department_id, status);

CREATE INDEX IF NOT EXISTS idx_iam_position_assignment_tenant_user
  ON iam_position_assignment (tenant_id, user_id, organization_id, position_id, status);

CREATE INDEX IF NOT EXISTS idx_iam_role_binding_organization_scope
  ON iam_role_binding (tenant_id, organization_id, scope_kind, scope_id, status);

CREATE INDEX IF NOT EXISTS idx_iam_role_binding_organization_principal
  ON iam_role_binding (tenant_id, organization_id, principal_kind, principal_id, status);

CREATE INDEX IF NOT EXISTS idx_iam_user_tenant_status
  ON iam_user (tenant_id, status, created_at);

CREATE INDEX IF NOT EXISTS idx_iam_user_identity_tenant_user
  ON iam_user_identity (tenant_id, user_id, provider);

CREATE INDEX IF NOT EXISTS idx_iam_credential_tenant_user_type
  ON iam_credential (tenant_id, user_id, credential_type, status);

CREATE INDEX IF NOT EXISTS idx_iam_session_tenant_user
  ON iam_session (tenant_id, user_id, app_id, revoked_at, expires_at);

CREATE INDEX IF NOT EXISTS idx_iam_session_auth_token_hash
  ON iam_session (auth_token_hash);

CREATE INDEX IF NOT EXISTS idx_iam_session_access_token_hash
  ON iam_session (access_token_hash);

CREATE INDEX IF NOT EXISTS idx_iam_session_refresh_token_hash
  ON iam_session (refresh_token_hash);

CREATE INDEX IF NOT EXISTS idx_iam_role_tenant_status
  ON iam_role (tenant_id, status, code);

CREATE INDEX IF NOT EXISTS idx_iam_role_permission_tenant_permission
  ON iam_role_permission (tenant_id, permission_id, role_id);

CREATE INDEX IF NOT EXISTS idx_iam_api_key_tenant_organization_user_status
  ON iam_api_key (tenant_id, organization_id, user_id, status);

CREATE INDEX IF NOT EXISTS idx_iam_api_key_tenant_app_status
  ON iam_api_key (tenant_id, app_id, status);

CREATE INDEX IF NOT EXISTS idx_iam_security_event_tenant_organization_created_at
  ON iam_security_event (tenant_id, organization_id, created_at, severity);

CREATE INDEX IF NOT EXISTS idx_iam_audit_event_tenant_created_at
  ON iam_audit_event (tenant_id, created_at, action);

CREATE INDEX IF NOT EXISTS idx_iam_audit_event_request_id
  ON iam_audit_event (request_id);

CREATE UNIQUE INDEX IF NOT EXISTS uk_iam_oauth_provider_catalog_owner_code
  ON iam_oauth_provider_catalog (owner_tenant_id, provider_code);

CREATE INDEX IF NOT EXISTS idx_iam_oauth_provider_catalog_region_status
  ON iam_oauth_provider_catalog (region_group, status, sort_order);

CREATE INDEX IF NOT EXISTS idx_iam_oauth_provider_catalog_protocol
  ON iam_oauth_provider_catalog (protocol_family, provider_family, status);

CREATE INDEX IF NOT EXISTS idx_iam_oauth_provider_catalog_capability
  ON iam_oauth_provider_catalog (provider_family, supports_userinfo, supports_refresh_token, status);

CREATE INDEX IF NOT EXISTS idx_iam_oauth_secret_owner_active
  ON iam_oauth_secret (tenant_id, organization_id, secret_owner_kind, secret_owner_id, status, active_from, active_until);

CREATE INDEX IF NOT EXISTS idx_iam_oauth_secret_client_active
  ON iam_oauth_secret (tenant_id, oauth_client_id, secret_kind, status, active_from, active_until);

CREATE INDEX IF NOT EXISTS idx_iam_oauth_secret_resource_authorization_active
  ON iam_oauth_secret (tenant_id, resource_authorization_id, secret_kind, status, active_from, active_until);

CREATE INDEX IF NOT EXISTS idx_iam_oauth_secret_webhook_active
  ON iam_oauth_secret (tenant_id, webhook_config_id, secret_kind, status, active_from, active_until);

CREATE UNIQUE INDEX IF NOT EXISTS uk_iam_oauth_secret_hash
  ON iam_oauth_secret (secret_hash);

CREATE INDEX IF NOT EXISTS idx_iam_oauth_resource_account_operator
  ON iam_oauth_resource_account (tenant_id, organization_id, operator_platform_id, resource_account_kind, status);

CREATE INDEX IF NOT EXISTS idx_iam_oauth_resource_account_readiness
  ON iam_oauth_resource_account (tenant_id, integration_id, verification_status, authorization_status, enabled, status);

CREATE INDEX IF NOT EXISTS idx_iam_oauth_surface_mini_program_channel
  ON iam_oauth_surface (tenant_id, integration_id, mini_program_provider, mini_program_environment, mini_program_release_channel, status);

CREATE INDEX IF NOT EXISTS idx_iam_oauth_flow_config_surface
  ON iam_oauth_flow_config (tenant_id, integration_id, surface_id, flow_kind, enabled, status);

CREATE UNIQUE INDEX IF NOT EXISTS uk_iam_oauth_webhook_config_public
  ON iam_oauth_webhook_config (callback_public_id);

CREATE INDEX IF NOT EXISTS idx_iam_oauth_callback_event_provider_event
  ON iam_oauth_callback_event (tenant_id, provider_code, provider_event_id, provider_event_type, created_at);

CREATE INDEX IF NOT EXISTS idx_iam_oauth_callback_event_webhook
  ON iam_oauth_callback_event (tenant_id, webhook_config_id, outcome, created_at);

CREATE INDEX IF NOT EXISTS idx_iam_oauth_operational_resource_account
  ON iam_oauth_operational_resource (tenant_id, resource_account_id, resource_kind, publish_status, status);

CREATE INDEX IF NOT EXISTS idx_iam_oauth_operational_resource_target
  ON iam_oauth_operational_resource (tenant_id, target_app_id, target_url_hash, target_path, status);

-- source: database/ddl/baseline/postgres/0001_iam_legacy_baseline.sql#drop-legacy-organization-member
DROP TABLE IF EXISTS iam_organization_member;

-- source: database/ddl/baseline/postgres/0001_iam_legacy_baseline.sql#user-enhancements
-- Enhance iam_user with industry-standard security and profile fields
ALTER TABLE iam_user ADD COLUMN IF NOT EXISTS nickname TEXT;
ALTER TABLE iam_user ADD COLUMN IF NOT EXISTS given_name TEXT;
ALTER TABLE iam_user ADD COLUMN IF NOT EXISTS family_name TEXT;
ALTER TABLE iam_user ADD COLUMN IF NOT EXISTS email_verified INTEGER NOT NULL DEFAULT 0;
ALTER TABLE iam_user ADD COLUMN IF NOT EXISTS phone_verified INTEGER NOT NULL DEFAULT 0;
ALTER TABLE iam_user ADD COLUMN IF NOT EXISTS email_verified_at TEXT;
ALTER TABLE iam_user ADD COLUMN IF NOT EXISTS phone_verified_at TEXT;
ALTER TABLE iam_user ADD COLUMN IF NOT EXISTS last_login_at TEXT;
ALTER TABLE iam_user ADD COLUMN IF NOT EXISTS last_login_ip TEXT;
ALTER TABLE iam_user ADD COLUMN IF NOT EXISTS password_changed_at TEXT;
ALTER TABLE iam_user ADD COLUMN IF NOT EXISTS locale TEXT NOT NULL DEFAULT 'en-US';
ALTER TABLE iam_user ADD COLUMN IF NOT EXISTS timezone TEXT NOT NULL DEFAULT 'UTC';
ALTER TABLE iam_user ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'direct';
ALTER TABLE iam_user ADD COLUMN IF NOT EXISTS registration_channel TEXT;
ALTER TABLE iam_user ADD COLUMN IF NOT EXISTS is_deleted INTEGER NOT NULL DEFAULT 0;
ALTER TABLE iam_user ADD COLUMN IF NOT EXISTS deleted_at TEXT;
UPDATE iam_user SET email = NULL WHERE email = '';
UPDATE iam_user SET phone = NULL WHERE phone = '';
CREATE UNIQUE INDEX IF NOT EXISTS iam_user_tenant_email_unique
    ON iam_user (tenant_id, email)
    WHERE email IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS iam_user_tenant_phone_unique
    ON iam_user (tenant_id, phone)
    WHERE phone IS NOT NULL;

-- Enhance iam_credential with security fields
ALTER TABLE iam_credential ADD COLUMN IF NOT EXISTS failed_attempts INTEGER NOT NULL DEFAULT 0;
ALTER TABLE iam_credential ADD COLUMN IF NOT EXISTS locked_until TEXT;
ALTER TABLE iam_credential ADD COLUMN IF NOT EXISTS last_used_at TEXT;

-- Keep the newest credential row before enforcing uniqueness.
DELETE FROM iam_credential
WHERE id IN (
  SELECT id
  FROM (
    SELECT id,
           ROW_NUMBER() OVER (
             PARTITION BY tenant_id, user_id, credential_type
             ORDER BY updated_at DESC, created_at DESC, id DESC
           ) AS row_number
    FROM iam_credential
  ) ranked_credentials
  WHERE row_number > 1
);

-- Add unique index on credential to prevent duplicates
CREATE UNIQUE INDEX IF NOT EXISTS iam_credential_tenant_user_type_unique
    ON iam_credential (tenant_id, user_id, credential_type);

-- source: database/ddl/baseline/postgres/0001_iam_legacy_baseline.sql#password-history
-- Password history table to prevent password reuse
CREATE TABLE IF NOT EXISTS iam_password_history (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS iam_password_history_user_idx ON iam_password_history (tenant_id, user_id, created_at DESC);

-- source: database/ddl/baseline/postgres/0001_iam_legacy_baseline.sql#shared-database-compat
-- Bridge sdkwork-claw-router shared PostgreSQL tables to appbase IAM foundation columns.
-- This migration must run before appbase foundation indexes are created on existing tables.

ALTER TABLE iam_organization ADD COLUMN IF NOT EXISTS parent_organization_id TEXT;
ALTER TABLE iam_organization ADD COLUMN IF NOT EXISTS organization_kind TEXT;
ALTER TABLE iam_organization ADD COLUMN IF NOT EXISTS tenant_boundary_kind TEXT;
ALTER TABLE iam_organization ADD COLUMN IF NOT EXISTS data_boundary_kind TEXT;
ALTER TABLE iam_organization ADD COLUMN IF NOT EXISTS app_boundary_enabled INTEGER NOT NULL DEFAULT 0;
ALTER TABLE iam_organization ADD COLUMN IF NOT EXISTS verification_status TEXT;

UPDATE iam_organization
SET organization_kind = 'team'
WHERE organization_kind IS NULL OR organization_kind = '';

UPDATE iam_organization
SET tenant_boundary_kind = 'exclusive'
WHERE tenant_boundary_kind IS NULL OR tenant_boundary_kind = '';

UPDATE iam_organization
SET data_boundary_kind = 'tenant'
WHERE data_boundary_kind IS NULL OR data_boundary_kind = '';

UPDATE iam_organization
SET verification_status = 'verified'
WHERE verification_status IS NULL OR verification_status = '';

ALTER TABLE iam_role_binding ADD COLUMN IF NOT EXISTS organization_id TEXT NOT NULL DEFAULT '0';
ALTER TABLE iam_api_key ADD COLUMN IF NOT EXISTS organization_id TEXT NOT NULL DEFAULT '0';
ALTER TABLE iam_security_event ADD COLUMN IF NOT EXISTS organization_id TEXT NOT NULL DEFAULT '0';

ALTER TABLE iam_session ADD COLUMN IF NOT EXISTS login_scope TEXT NOT NULL DEFAULT 'TENANT';
ALTER TABLE iam_session ADD COLUMN IF NOT EXISTS auth_token_kid TEXT NOT NULL DEFAULT '';
ALTER TABLE iam_session ADD COLUMN IF NOT EXISTS access_token_kid TEXT NOT NULL DEFAULT '';
ALTER TABLE iam_session ADD COLUMN IF NOT EXISTS refresh_token_kid TEXT NOT NULL DEFAULT '';

-- source: database/ddl/baseline/postgres/0001_iam_legacy_baseline.sql#ephemeral-artifacts
CREATE TABLE IF NOT EXISTS iam_ephemeral_artifact (
  artifact_key TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  artifact_kind TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_iam_ephemeral_artifact_expires_at
  ON iam_ephemeral_artifact (expires_at);

CREATE INDEX IF NOT EXISTS idx_iam_ephemeral_artifact_tenant_kind
  ON iam_ephemeral_artifact (tenant_id, artifact_kind, expires_at);

-- source: database/ddl/baseline/postgres/0001_iam_baseline.sql#application-bootstrap
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
  runtime_config_json TEXT NOT NULL DEFAULT '{}',
  artifacts_config_json TEXT NOT NULL DEFAULT '{}',
  default_access_permissions_json TEXT NOT NULL DEFAULT '[]',
  manifest_hash TEXT,
  last_synced_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
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
  config_json TEXT NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
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
  domain_config_json TEXT NOT NULL DEFAULT '{}',
  access_permissions_json TEXT NOT NULL DEFAULT '[]',
  runtime_config_json TEXT NOT NULL DEFAULT '{}',
  provisioned_at TEXT,
  activated_at TEXT,
  last_synced_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
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

CREATE UNIQUE INDEX IF NOT EXISTS uk_iam_tenant_application_org_template
  ON iam_tenant_application (tenant_id, organization_id, template_id);

-- source: database/migrations/postgres/0008_iam_rbac_federation.up.sql
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

-- source: database/migrations/postgres/0009_iam_rbac_subject_extensions.up.sql
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
