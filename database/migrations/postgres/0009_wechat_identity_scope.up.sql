ALTER TABLE iam_oauth_account_link
    ADD COLUMN IF NOT EXISTS provider_union_scope_id TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS uk_iam_oauth_account_link_integration_subject
    ON iam_oauth_account_link (tenant_id, integration_id, provider_code, external_subject_hash)
    WHERE status = 'active' AND unlinked_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uk_iam_oauth_account_link_union_scope
    ON iam_oauth_account_link (tenant_id, provider_union_scope_id, external_union_id_hash)
    WHERE status = 'active' AND unlinked_at IS NULL
      AND provider_union_scope_id IS NOT NULL AND external_union_id_hash IS NOT NULL;
