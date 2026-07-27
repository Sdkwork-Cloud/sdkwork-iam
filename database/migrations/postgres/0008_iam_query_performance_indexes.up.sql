-- sdkwork:migration
-- id: 0008_iam_query_performance_indexes
-- engine: postgres
-- module: iam
-- purpose: Add tenant-scoped OAuth and identity lookup indexes
-- reversible: true
-- rollback: down-migration
-- transactional: true
-- lock: share
-- lock_timeout: 5s
-- statement_timeout: 120s
-- rewrite_expectation: none
-- wal_impact: bounded index build WAL proportional to indexed IAM rows
-- backfill_plan: PostgreSQL builds each index from existing rows
-- observability: monitor lock waits, index build duration, and migration history
-- cancellation_point: between CREATE INDEX statements
-- recovery_command: apply 0008_iam_query_performance_indexes.down.sql

-- OAuth integration lookup paths (tenant-scoped provider resolution).
CREATE INDEX IF NOT EXISTS idx_iam_oauth_integration_tenant_status_provider
    ON iam_oauth_integration (tenant_id, status, enabled, provider_code);

-- Identity login lookup paths within tenant scope.
CREATE INDEX IF NOT EXISTS idx_iam_user_tenant_username_lower
    ON iam_user (tenant_id, lower(username))
    WHERE is_deleted = 0 AND status = 'active';

CREATE INDEX IF NOT EXISTS idx_iam_user_tenant_email_lower
    ON iam_user (tenant_id, lower(email))
    WHERE is_deleted = 0 AND status = 'active' AND email IS NOT NULL;
