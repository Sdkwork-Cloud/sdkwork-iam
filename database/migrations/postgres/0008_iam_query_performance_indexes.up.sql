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
