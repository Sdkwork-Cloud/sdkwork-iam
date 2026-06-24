-- Default IAM tenant and root organization for standard seed profile.
-- Canonical runtime import: sdkwork-appbase-iam-bootstrap::{import_postgres_default_iam_seed, import_sqlite_default_iam_seed}

INSERT INTO iam_tenant
    (id, code, name, status, created_at, updated_at)
VALUES
    ('100001', 'SDKWORK', 'SDKWork', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET
    code = EXCLUDED.code,
    name = EXCLUDED.name,
    status = EXCLUDED.status,
    updated_at = CURRENT_TIMESTAMP;

INSERT INTO iam_organization
    (
        id,
        tenant_id,
        parent_organization_id,
        code,
        name,
        path,
        status,
        organization_kind,
        tenant_boundary_kind,
        data_boundary_kind,
        app_boundary_enabled,
        verification_status,
        created_at,
        updated_at
    )
VALUES
    (
        '0',
        '100001',
        NULL,
        'root',
        'Root Organization',
        '/0',
        'active',
        'team',
        'exclusive',
        'tenant',
        0,
        'verified',
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    )
ON CONFLICT (id) DO UPDATE SET
    tenant_id = EXCLUDED.tenant_id,
    parent_organization_id = EXCLUDED.parent_organization_id,
    code = EXCLUDED.code,
    name = EXCLUDED.name,
    path = EXCLUDED.path,
    status = EXCLUDED.status,
    organization_kind = EXCLUDED.organization_kind,
    tenant_boundary_kind = EXCLUDED.tenant_boundary_kind,
    data_boundary_kind = EXCLUDED.data_boundary_kind,
    app_boundary_enabled = EXCLUDED.app_boundary_enabled,
    verification_status = EXCLUDED.verification_status,
    updated_at = CURRENT_TIMESTAMP;
