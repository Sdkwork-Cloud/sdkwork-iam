-- sdkwork:migration
-- id: 0013_iam_session_principal_compatibility
-- engine: postgres
-- module: iam
-- purpose: Permit compatibility sessions without a local IAM principal id
-- reversible: true
-- rollback: down-migration
-- transactional: true
-- lock: access-exclusive
-- lock_timeout: 5s
-- statement_timeout: 30s
-- rewrite_expectation: none; only the nullability constraint changes
-- wal_impact: catalog records only
-- backfill_plan: none on upgrade; rollback restores principal_id from user_id
-- observability: monitor lock waits and null principal session counts
-- cancellation_point: before ALTER TABLE
-- recovery_command: apply 0013_iam_session_principal_compatibility.down.sql after resolving null principals

ALTER TABLE iam_session
  ALTER COLUMN principal_id DROP NOT NULL;
