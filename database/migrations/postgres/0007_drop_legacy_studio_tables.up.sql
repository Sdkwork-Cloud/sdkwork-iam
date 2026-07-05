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
