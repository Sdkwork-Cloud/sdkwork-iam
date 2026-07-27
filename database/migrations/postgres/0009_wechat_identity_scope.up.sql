-- sdkwork:migration
-- id: 0009_wechat_identity_scope
-- engine: postgres
-- module: iam
-- purpose: Add tenant-scoped WeChat union identity constraints
-- reversible: true
-- rollback: down-migration
-- transactional: true
-- lock: access-exclusive
-- lock_timeout: 5s
-- statement_timeout: 120s
-- rewrite_expectation: no table rewrite expected for the nullable column
-- wal_impact: bounded index build WAL proportional to active account links
-- backfill_plan: existing rows remain null until a verified provider scope is resolved
-- observability: monitor lock waits, uniqueness violations, and migration history
-- cancellation_point: before each unique index build
-- recovery_command: apply 0009_wechat_identity_scope.down.sql

ALTER TABLE iam_oauth_account_link
    ADD COLUMN IF NOT EXISTS provider_union_scope_id TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS uk_iam_oauth_account_link_integration_subject
    ON iam_oauth_account_link (tenant_id, integration_id, provider_code, external_subject_hash)
    WHERE status = 'active' AND unlinked_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uk_iam_oauth_account_link_union_scope
    ON iam_oauth_account_link (tenant_id, provider_union_scope_id, external_union_id_hash)
    WHERE status = 'active' AND unlinked_at IS NULL
      AND provider_union_scope_id IS NOT NULL AND external_union_id_hash IS NOT NULL;
