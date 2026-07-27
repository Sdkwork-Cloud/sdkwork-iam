-- sdkwork:migration
-- id: 0007_drop_legacy_studio_tables
-- engine: postgres
-- module: iam
-- purpose: Remove retired Studio catalog tables after IAM registry migration
-- reversible: false
-- rollback: forward-fix
-- transactional: true
-- lock: access-exclusive
-- lock_timeout: 5s
-- statement_timeout: 60s
-- rewrite_expectation: none; tables are dropped rather than rewritten
-- wal_impact: catalog and drop records only
-- backfill_plan: none
-- observability: monitor lock waits and migration history
-- cancellation_point: before the first DROP TABLE statement
-- recovery_command: restore from the pre-migration backup when retired data is still required

-- Remove legacy Studio catalog tables superseded by IAM application registry.
-- Fresh installs never create these tables; this migration cleans upgraded databases only.

DROP TABLE IF EXISTS studio_mcp_binding CASCADE;
DROP TABLE IF EXISTS studio_mcp_tool CASCADE;
DROP TABLE IF EXISTS studio_mcp_server_revision CASCADE;
DROP TABLE IF EXISTS studio_mcp_server CASCADE;
DROP TABLE IF EXISTS studio_prompt_binding CASCADE;
DROP TABLE IF EXISTS studio_prompt_version CASCADE;
DROP TABLE IF EXISTS studio_prompt CASCADE;
DROP TABLE IF EXISTS studio_app_template_usage CASCADE;
DROP TABLE IF EXISTS studio_app_template_version CASCADE;
DROP TABLE IF EXISTS studio_app_template CASCADE;
DROP TABLE IF EXISTS studio_catalog_artifact CASCADE;
DROP TABLE IF EXISTS studio_catalog_asset CASCADE;
DROP TABLE IF EXISTS studio_catalog_action CASCADE;
