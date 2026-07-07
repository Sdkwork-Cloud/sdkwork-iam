export const IAM_PC_ADMIN_AUDIT_ROUTES = {
  additionalPermissionPrefixes: ["iam.security_events"],
  moduleId: "iam-audit",
  basePath: "/admin/iam/audit",
  defaultPath: "/admin/iam/audit",
  permissionPrefix: "iam.audit_events",
} as const;
