-- sdkwork:migration
-- id: 0001_oauth_secret_hash_non_unique
-- engine: postgres
-- module: sdkwork-iam
-- purpose: Drop the globally unique constraint on iam_oauth_secret(secret_hash)
--   so identical secret values can be stored for multiple integrations/clients
--   (reused client secrets, rotation back to a previous value, same secret
--   across tenants). The hash is a one-way integrity fingerprint and is never
--   used for lookup, so the unique index added no integrity guarantee; the
--   plain index keeps the column indexed for any future hash-based lookup.
-- reversible: true
-- rollback: re-creates the unique index (fails if duplicate hashes exist)
-- transactional: true
-- lock: lightweight
-- lock_timeout: 2s
-- statement_timeout: 30s
-- contract_version: 0.5.0
-- rewrite: index uniqueness removal

DROP INDEX IF EXISTS uk_iam_oauth_secret_hash;

CREATE INDEX IF NOT EXISTS idx_iam_oauth_secret_hash
  ON iam_oauth_secret (secret_hash);
