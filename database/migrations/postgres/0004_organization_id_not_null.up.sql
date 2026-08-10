-- sdkwork:migration
-- id: 0004_organization_id_not_null
-- engine: postgres
-- module: sdkwork-iam
-- purpose: Enforce organization_id NOT NULL DEFAULT on all tables in the
--   consolidated baseline. NULL rows (pre-standard data anomalies) are
--   backfilled with the platform sentinel before NOT NULL is set, and
--   NOT NULL columns without an explicit default receive the sentinel
--   default, keeping existing deployments consistent with fresh baseline
--   installs.
-- reversible: false
-- rollback: forward-fix (sentinel backfill is the canonical fix; NULL
--   organization rows are data anomalies)
-- transactional: true
-- lock: lightweight
-- lock_timeout: 2s
-- statement_timeout: 30s

BEGIN;

ALTER TABLE iam_organization_membership ADD COLUMN IF NOT EXISTS organization_id TEXT NOT NULL DEFAULT '0';
UPDATE iam_organization_membership SET organization_id = '0' WHERE organization_id IS NULL;
ALTER TABLE iam_organization_membership ALTER COLUMN organization_id SET DEFAULT '0';
ALTER TABLE iam_organization_membership ALTER COLUMN organization_id SET NOT NULL;

ALTER TABLE iam_department ADD COLUMN IF NOT EXISTS organization_id TEXT NOT NULL DEFAULT '0';
UPDATE iam_department SET organization_id = '0' WHERE organization_id IS NULL;
ALTER TABLE iam_department ALTER COLUMN organization_id SET DEFAULT '0';
ALTER TABLE iam_department ALTER COLUMN organization_id SET NOT NULL;

ALTER TABLE iam_department_closure ADD COLUMN IF NOT EXISTS organization_id TEXT NOT NULL DEFAULT '0';
UPDATE iam_department_closure SET organization_id = '0' WHERE organization_id IS NULL;
ALTER TABLE iam_department_closure ALTER COLUMN organization_id SET DEFAULT '0';
ALTER TABLE iam_department_closure ALTER COLUMN organization_id SET NOT NULL;

ALTER TABLE iam_department_assignment ADD COLUMN IF NOT EXISTS organization_id TEXT NOT NULL DEFAULT '0';
UPDATE iam_department_assignment SET organization_id = '0' WHERE organization_id IS NULL;
ALTER TABLE iam_department_assignment ALTER COLUMN organization_id SET DEFAULT '0';
ALTER TABLE iam_department_assignment ALTER COLUMN organization_id SET NOT NULL;

ALTER TABLE iam_position ADD COLUMN IF NOT EXISTS organization_id TEXT NOT NULL DEFAULT '0';
UPDATE iam_position SET organization_id = '0' WHERE organization_id IS NULL;
ALTER TABLE iam_position ALTER COLUMN organization_id SET DEFAULT '0';
ALTER TABLE iam_position ALTER COLUMN organization_id SET NOT NULL;

ALTER TABLE iam_position_assignment ADD COLUMN IF NOT EXISTS organization_id TEXT NOT NULL DEFAULT '0';
UPDATE iam_position_assignment SET organization_id = '0' WHERE organization_id IS NULL;
ALTER TABLE iam_position_assignment ALTER COLUMN organization_id SET DEFAULT '0';
ALTER TABLE iam_position_assignment ALTER COLUMN organization_id SET NOT NULL;

ALTER TABLE iam_session ADD COLUMN IF NOT EXISTS organization_id TEXT NOT NULL DEFAULT '0';
UPDATE iam_session SET organization_id = '0' WHERE organization_id IS NULL;
ALTER TABLE iam_session ALTER COLUMN organization_id SET DEFAULT '0';
ALTER TABLE iam_session ALTER COLUMN organization_id SET NOT NULL;

ALTER TABLE iam_role_binding ADD COLUMN IF NOT EXISTS organization_id TEXT NOT NULL DEFAULT '0';
UPDATE iam_role_binding SET organization_id = '0' WHERE organization_id IS NULL;
ALTER TABLE iam_role_binding ALTER COLUMN organization_id SET DEFAULT '0';
ALTER TABLE iam_role_binding ALTER COLUMN organization_id SET NOT NULL;

ALTER TABLE iam_api_key ADD COLUMN IF NOT EXISTS organization_id TEXT NOT NULL DEFAULT '0';
UPDATE iam_api_key SET organization_id = '0' WHERE organization_id IS NULL;
ALTER TABLE iam_api_key ALTER COLUMN organization_id SET DEFAULT '0';
ALTER TABLE iam_api_key ALTER COLUMN organization_id SET NOT NULL;

ALTER TABLE iam_security_event ADD COLUMN IF NOT EXISTS organization_id TEXT NOT NULL DEFAULT '0';
UPDATE iam_security_event SET organization_id = '0' WHERE organization_id IS NULL;
ALTER TABLE iam_security_event ALTER COLUMN organization_id SET DEFAULT '0';
ALTER TABLE iam_security_event ALTER COLUMN organization_id SET NOT NULL;

ALTER TABLE iam_audit_event ADD COLUMN IF NOT EXISTS organization_id TEXT NOT NULL DEFAULT '0';
UPDATE iam_audit_event SET organization_id = '0' WHERE organization_id IS NULL;
ALTER TABLE iam_audit_event ALTER COLUMN organization_id SET DEFAULT '0';
ALTER TABLE iam_audit_event ALTER COLUMN organization_id SET NOT NULL;

ALTER TABLE iam_oauth_integration ADD COLUMN IF NOT EXISTS organization_id TEXT NOT NULL DEFAULT '0';
UPDATE iam_oauth_integration SET organization_id = '0' WHERE organization_id IS NULL;
ALTER TABLE iam_oauth_integration ALTER COLUMN organization_id SET DEFAULT '0';
ALTER TABLE iam_oauth_integration ALTER COLUMN organization_id SET NOT NULL;

ALTER TABLE iam_oauth_client ADD COLUMN IF NOT EXISTS organization_id TEXT NOT NULL DEFAULT '0';
UPDATE iam_oauth_client SET organization_id = '0' WHERE organization_id IS NULL;
ALTER TABLE iam_oauth_client ALTER COLUMN organization_id SET DEFAULT '0';
ALTER TABLE iam_oauth_client ALTER COLUMN organization_id SET NOT NULL;

ALTER TABLE iam_oauth_secret ADD COLUMN IF NOT EXISTS organization_id TEXT NOT NULL DEFAULT '0';
UPDATE iam_oauth_secret SET organization_id = '0' WHERE organization_id IS NULL;
ALTER TABLE iam_oauth_secret ALTER COLUMN organization_id SET DEFAULT '0';
ALTER TABLE iam_oauth_secret ALTER COLUMN organization_id SET NOT NULL;

ALTER TABLE iam_oauth_surface ADD COLUMN IF NOT EXISTS organization_id TEXT NOT NULL DEFAULT '0';
UPDATE iam_oauth_surface SET organization_id = '0' WHERE organization_id IS NULL;
ALTER TABLE iam_oauth_surface ALTER COLUMN organization_id SET DEFAULT '0';
ALTER TABLE iam_oauth_surface ALTER COLUMN organization_id SET NOT NULL;

ALTER TABLE iam_oauth_flow_config ADD COLUMN IF NOT EXISTS organization_id TEXT NOT NULL DEFAULT '0';
UPDATE iam_oauth_flow_config SET organization_id = '0' WHERE organization_id IS NULL;
ALTER TABLE iam_oauth_flow_config ALTER COLUMN organization_id SET DEFAULT '0';
ALTER TABLE iam_oauth_flow_config ALTER COLUMN organization_id SET NOT NULL;

ALTER TABLE iam_oauth_scope_profile ADD COLUMN IF NOT EXISTS organization_id TEXT NOT NULL DEFAULT '0';
UPDATE iam_oauth_scope_profile SET organization_id = '0' WHERE organization_id IS NULL;
ALTER TABLE iam_oauth_scope_profile ALTER COLUMN organization_id SET DEFAULT '0';
ALTER TABLE iam_oauth_scope_profile ALTER COLUMN organization_id SET NOT NULL;

ALTER TABLE iam_oauth_claim_mapping ADD COLUMN IF NOT EXISTS organization_id TEXT NOT NULL DEFAULT '0';
UPDATE iam_oauth_claim_mapping SET organization_id = '0' WHERE organization_id IS NULL;
ALTER TABLE iam_oauth_claim_mapping ALTER COLUMN organization_id SET DEFAULT '0';
ALTER TABLE iam_oauth_claim_mapping ALTER COLUMN organization_id SET NOT NULL;

ALTER TABLE iam_oauth_policy ADD COLUMN IF NOT EXISTS organization_id TEXT NOT NULL DEFAULT '0';
UPDATE iam_oauth_policy SET organization_id = '0' WHERE organization_id IS NULL;
ALTER TABLE iam_oauth_policy ALTER COLUMN organization_id SET DEFAULT '0';
ALTER TABLE iam_oauth_policy ALTER COLUMN organization_id SET NOT NULL;

ALTER TABLE iam_oauth_tenant_binding ADD COLUMN IF NOT EXISTS organization_id TEXT NOT NULL DEFAULT '0';
UPDATE iam_oauth_tenant_binding SET organization_id = '0' WHERE organization_id IS NULL;
ALTER TABLE iam_oauth_tenant_binding ALTER COLUMN organization_id SET DEFAULT '0';
ALTER TABLE iam_oauth_tenant_binding ALTER COLUMN organization_id SET NOT NULL;

ALTER TABLE iam_oauth_operator_platform ADD COLUMN IF NOT EXISTS organization_id TEXT NOT NULL DEFAULT '0';
UPDATE iam_oauth_operator_platform SET organization_id = '0' WHERE organization_id IS NULL;
ALTER TABLE iam_oauth_operator_platform ALTER COLUMN organization_id SET DEFAULT '0';
ALTER TABLE iam_oauth_operator_platform ALTER COLUMN organization_id SET NOT NULL;

ALTER TABLE iam_oauth_resource_account ADD COLUMN IF NOT EXISTS organization_id TEXT NOT NULL DEFAULT '0';
UPDATE iam_oauth_resource_account SET organization_id = '0' WHERE organization_id IS NULL;
ALTER TABLE iam_oauth_resource_account ALTER COLUMN organization_id SET DEFAULT '0';
ALTER TABLE iam_oauth_resource_account ALTER COLUMN organization_id SET NOT NULL;

ALTER TABLE iam_oauth_resource_authorization ADD COLUMN IF NOT EXISTS organization_id TEXT NOT NULL DEFAULT '0';
UPDATE iam_oauth_resource_authorization SET organization_id = '0' WHERE organization_id IS NULL;
ALTER TABLE iam_oauth_resource_authorization ALTER COLUMN organization_id SET DEFAULT '0';
ALTER TABLE iam_oauth_resource_authorization ALTER COLUMN organization_id SET NOT NULL;

ALTER TABLE iam_oauth_webhook_config ADD COLUMN IF NOT EXISTS organization_id TEXT NOT NULL DEFAULT '0';
UPDATE iam_oauth_webhook_config SET organization_id = '0' WHERE organization_id IS NULL;
ALTER TABLE iam_oauth_webhook_config ALTER COLUMN organization_id SET DEFAULT '0';
ALTER TABLE iam_oauth_webhook_config ALTER COLUMN organization_id SET NOT NULL;

ALTER TABLE iam_oauth_operational_resource ADD COLUMN IF NOT EXISTS organization_id TEXT NOT NULL DEFAULT '0';
UPDATE iam_oauth_operational_resource SET organization_id = '0' WHERE organization_id IS NULL;
ALTER TABLE iam_oauth_operational_resource ALTER COLUMN organization_id SET DEFAULT '0';
ALTER TABLE iam_oauth_operational_resource ALTER COLUMN organization_id SET NOT NULL;

ALTER TABLE iam_oauth_authorization_state ADD COLUMN IF NOT EXISTS organization_id TEXT NOT NULL DEFAULT '0';
UPDATE iam_oauth_authorization_state SET organization_id = '0' WHERE organization_id IS NULL;
ALTER TABLE iam_oauth_authorization_state ALTER COLUMN organization_id SET DEFAULT '0';
ALTER TABLE iam_oauth_authorization_state ALTER COLUMN organization_id SET NOT NULL;

ALTER TABLE iam_oauth_account_link ADD COLUMN IF NOT EXISTS organization_id TEXT NOT NULL DEFAULT '0';
UPDATE iam_oauth_account_link SET organization_id = '0' WHERE organization_id IS NULL;
ALTER TABLE iam_oauth_account_link ALTER COLUMN organization_id SET DEFAULT '0';
ALTER TABLE iam_oauth_account_link ALTER COLUMN organization_id SET NOT NULL;

ALTER TABLE iam_oauth_grant ADD COLUMN IF NOT EXISTS organization_id TEXT NOT NULL DEFAULT '0';
UPDATE iam_oauth_grant SET organization_id = '0' WHERE organization_id IS NULL;
ALTER TABLE iam_oauth_grant ALTER COLUMN organization_id SET DEFAULT '0';
ALTER TABLE iam_oauth_grant ALTER COLUMN organization_id SET NOT NULL;

ALTER TABLE iam_oauth_callback_event ADD COLUMN IF NOT EXISTS organization_id TEXT NOT NULL DEFAULT '0';
UPDATE iam_oauth_callback_event SET organization_id = '0' WHERE organization_id IS NULL;
ALTER TABLE iam_oauth_callback_event ALTER COLUMN organization_id SET DEFAULT '0';
ALTER TABLE iam_oauth_callback_event ALTER COLUMN organization_id SET NOT NULL;

ALTER TABLE iam_oauth_diagnostic_run ADD COLUMN IF NOT EXISTS organization_id TEXT NOT NULL DEFAULT '0';
UPDATE iam_oauth_diagnostic_run SET organization_id = '0' WHERE organization_id IS NULL;
ALTER TABLE iam_oauth_diagnostic_run ALTER COLUMN organization_id SET DEFAULT '0';
ALTER TABLE iam_oauth_diagnostic_run ALTER COLUMN organization_id SET NOT NULL;

ALTER TABLE iam_tenant_application ADD COLUMN IF NOT EXISTS organization_id TEXT NOT NULL DEFAULT '0';
UPDATE iam_tenant_application SET organization_id = '0' WHERE organization_id IS NULL;
ALTER TABLE iam_tenant_application ALTER COLUMN organization_id SET DEFAULT '0';
ALTER TABLE iam_tenant_application ALTER COLUMN organization_id SET NOT NULL;

ALTER TABLE iam_group ADD COLUMN IF NOT EXISTS organization_id TEXT NOT NULL DEFAULT '0';
UPDATE iam_group SET organization_id = '0' WHERE organization_id IS NULL;
ALTER TABLE iam_group ALTER COLUMN organization_id SET DEFAULT '0';
ALTER TABLE iam_group ALTER COLUMN organization_id SET NOT NULL;

ALTER TABLE iam_service_account ADD COLUMN IF NOT EXISTS organization_id TEXT NOT NULL DEFAULT '0';
UPDATE iam_service_account SET organization_id = '0' WHERE organization_id IS NULL;
ALTER TABLE iam_service_account ALTER COLUMN organization_id SET DEFAULT '0';
ALTER TABLE iam_service_account ALTER COLUMN organization_id SET NOT NULL;

ALTER TABLE iam_service_account_credential ADD COLUMN IF NOT EXISTS organization_id TEXT NOT NULL DEFAULT '0';
UPDATE iam_service_account_credential SET organization_id = '0' WHERE organization_id IS NULL;
ALTER TABLE iam_service_account_credential ALTER COLUMN organization_id SET DEFAULT '0';
ALTER TABLE iam_service_account_credential ALTER COLUMN organization_id SET NOT NULL;

COMMIT;
