export const IAM_PC_ADMIN_ORGANIZATION_ROUTES = {
  moduleId: "iam-organization",
  basePath: "/admin/iam/organizations",
  defaultPath: "/admin/iam/organizations",
  permissionPrefix: "iam.organizations",
  structurePath: "/admin/iam/organizations/:organizationId/structure",
  structurePermissionMode: "all",
  structureRequiredPermissions: [
    "iam.organizations.read",
    "iam.departments.read",
    "iam.assignments.read",
  ],
} as const;
