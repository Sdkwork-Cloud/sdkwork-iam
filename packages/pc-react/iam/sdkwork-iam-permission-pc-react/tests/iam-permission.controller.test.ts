import { describe, expect, it, vi } from "vitest";

import { createSdkworkIamPermissionController } from "../src/index";

describe("@sdkwork/iam-permission-pc-react", () => {
  it("manages IAM roles, permissions, policies, and authorization hints through the standard IAM service", async () => {
    const service = {
      iam: {
        permissions: {
          list: vi.fn().mockResolvedValue([
            {
              action: "read",
              code: "iam.users.read",
              id: "permission-1",
              name: "Read users",
              resource: "iam.users",
            },
          ]),
        },
        policies: {
          list: vi.fn().mockResolvedValue({
            records: [
              {
                code: "default-policy",
                id: "policy-1",
                name: "Default Policy",
              },
            ],
          }),
        },
        roles: {
          list: vi.fn().mockResolvedValue([
            {
              code: "admin",
              name: "Admin",
              roleId: "role-1",
            },
          ]),
          permissions: {
            create: vi.fn().mockResolvedValue({ id: "rp-1" }),
            delete: vi.fn().mockResolvedValue(undefined),
            list: vi.fn().mockResolvedValue([
              {
                action: "read",
                code: "iam.users.read",
                id: "permission-1",
                name: "Read users",
                resource: "iam.users",
              },
            ]),
          },
        },
        roleBindings: {
          create: vi.fn().mockResolvedValue({
            id: "role-binding-1",
            principalId: "user-1",
            principalKind: "user",
            roleId: "role-1",
            scopeId: "org-1",
            scopeKind: "organization",
          }),
          delete: vi.fn().mockResolvedValue(undefined),
          list: vi.fn().mockResolvedValue([
            {
              id: "role-binding-1",
              principalId: "user-1",
              principalKind: "user",
              roleId: "role-1",
              scopeId: "org-1",
              scopeKind: "organization",
            },
          ]),
        },
      },
    };

    const controller = createSdkworkIamPermissionController({
      permissionScope: ["iam.audit.*"],
      service: service as never,
      standardRoleCodes: ["org_admin"],
      userSurface: { app: true, organizationMember: true },
    });

    await expect(controller.listRoles()).resolves.toEqual([
      {
        code: "admin",
        id: "role-1",
        name: "Admin",
        roleId: "role-1",
        status: undefined,
        tenantId: undefined,
      },
    ]);
    await controller.listPermissions();
    await controller.listPolicies();
    await controller.listRolePermissions("role-1");
    await controller.listRoleBindings({ principalKind: "user", principalId: "user-1", scopeKind: "organization", scopeId: "org-1" });
    await controller.assignRolePermission("role-1", "permission-1");
    await controller.revokeRolePermission("role-1", "permission-1");
    await controller.assignRoleBinding({
      principalId: "user-1",
      principalKind: "user",
      roleId: "role-1",
      scopeId: "org-1",
      scopeKind: "organization",
    });

    expect(controller.can("iam.users.read")).toBe(true);
    expect(controller.can({ action: "read", resource: "iam.audit" })).toBe(true);
    expect(controller.can({ action: "delete", resource: "iam.users" })).toBe(false);
    expect(controller.hasRole("org_admin")).toBe(true);
    expect(controller.hasRole("app_user")).toBe(false);
    expect(controller.isOrganizationMember()).toBe(true);
    expect(controller.canAccessBackend()).toBe(true);
    await controller.revokeRoleBinding("role-binding-1");

    expect(service.iam.roles.permissions.create).toHaveBeenCalledWith("role-1", "permission-1");
    expect(service.iam.roleBindings.create).toHaveBeenCalledWith({
      principalId: "user-1",
      principalKind: "user",
      roleId: "role-1",
      scopeId: "org-1",
      scopeKind: "organization",
    });
    expect(service.iam.roleBindings.delete).toHaveBeenCalledWith("role-binding-1");
    expect(Object.prototype.hasOwnProperty.call(controller, "assignUserRole")).toBe(false);
    expect(Object.prototype.hasOwnProperty.call(controller, "listUserRoles")).toBe(false);
    expect(Object.prototype.hasOwnProperty.call(controller.getState(), "userRoles")).toBe(false);
  });
});
