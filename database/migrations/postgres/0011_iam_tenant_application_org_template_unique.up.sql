-- Enforce one tenant application row per tenant/org/template after deduping legacy duplicates.

WITH ranked AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY tenant_id, organization_id, template_id
           ORDER BY
             CASE
               WHEN id = 'tapp_' || tenant_id || '_' || organization_id || '_' ||
                    replace(replace(template_id, 'tmpl_', ''), '-', '_') THEN 0
               WHEN id = 'tapp_' || tenant_id || '_default'
                    AND template_id = 'tmpl_sdkwork_platform' THEN 1
               ELSE 2
             END,
             CASE status WHEN 'enabled' THEN 0 WHEN 'pending_config' THEN 1 ELSE 2 END,
             updated_at DESC NULLS LAST,
             id ASC
         ) AS row_rank
  FROM iam_tenant_application
)
DELETE FROM iam_tenant_application
WHERE id IN (SELECT id FROM ranked WHERE row_rank > 1);

CREATE UNIQUE INDEX IF NOT EXISTS uk_iam_tenant_application_org_template
  ON iam_tenant_application (tenant_id, organization_id, template_id);
