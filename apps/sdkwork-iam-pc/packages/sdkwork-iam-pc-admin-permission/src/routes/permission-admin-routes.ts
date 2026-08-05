export const IAM_PC_ADMIN_PERMISSION_ROUTES = {
  moduleId: "iam-permission",
  basePath: "/admin/iam/permissions",
  defaultPath: "/admin/iam/permissions",
  permissionPrefix: "iam.permissions",
  pages: {
    authorizations: {
      path: "/admin/iam/authorizations",
      permissionPrefix: "iam.role_bindings",
    },
    permissions: {
      path: "/admin/iam/permissions",
      permissionPrefix: "iam.permissions",
    },
    policies: {
      path: "/admin/iam/policies",
      permissionPrefix: "iam.policies",
    },
    roles: {
      path: "/admin/iam/roles",
      permissionPrefix: "iam.roles",
    },
  },
} as const;
