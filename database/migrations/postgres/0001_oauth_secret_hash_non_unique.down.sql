-- sdkwork:migration
-- id: 0001_oauth_secret_hash_non_unique
-- engine: postgres
-- module: sdkwork-iam
-- purpose: Roll back the non-unique secret_hash index to the original global
--   unique constraint. Fails when duplicate hashes are present in the data.
-- reversible: false
-- rollback: forward-fix
-- transactional: true
-- lock: lightweight
-- lock_timeout: 2s
-- statement_timeout: 30s
-- contract_version: 0.5.0
-- rewrite: index uniqueness restoration

DROP INDEX IF EXISTS idx_iam_oauth_secret_hash;

CREATE UNIQUE INDEX IF NOT EXISTS uk_iam_oauth_secret_hash
  ON iam_oauth_secret (secret_hash);
