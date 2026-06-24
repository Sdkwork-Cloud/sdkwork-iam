import { describe, expect, it, vi } from "vitest";

import { buildSdkworkIamOrganizationTree, createSdkworkIamOrganizationController } from "../src/index";

describe("@sdkwork/iam-organization-pc-react", () => {
  it("lists organization hierarchy, memberships, departments, and department assignments through the mature Organization system", async () => {
    const service = {
      iam: {
        organizations: {
          list: vi.fn().mockResolvedValue([
            {
              name: "Headquarters",
              organizationId: "org-root",
              tenantBoundaryKind: "root_tenant",
            },
            {
              name: "Research",
              organizationId: "org-child",
              parentOrganizationId: "org-root",
              tenantBoundaryKind: "sub_tenant",
            },
          ]),
        },
        organizationMemberships: {
          create: vi.fn().mockResolvedValue({
            id: "membership-2",
            membershipId: "membership-2",
            organizationId: "org-child",
            userId: "user-2",
          }),
          list: vi.fn().mockResolvedValue({
            items: [
              {
                displayName: "Alice",
                email: "alice@example.com",
                id: "membership-1",
                membershipId: "membership-1",
                organizationId: "org-child",
                userId: "user-1",
              },
            ],
          }),
        },
        departments: {
          list: vi.fn().mockResolvedValue({
            items: [
              {
                departmentId: "dept-root",
                name: "Research Center",
                organizationId: "org-child",
              },
              {
                departmentId: "dept-platform",
                name: "Platform",
                organizationId: "org-child",
                parentDepartmentId: "dept-root",
              },
            ],
          }),
          tree: {
            retrieve: vi.fn().mockResolvedValue({
              items: [
                {
                  children: [
                    {
                      departmentId: "dept-platform",
                      name: "Platform",
                      organizationId: "org-child",
                    },
                  ],
                  departmentId: "dept-root",
                  name: "Research Center",
                  organizationId: "org-child",
                },
              ],
            }),
          },
        },
        departmentAssignments: {
          list: vi.fn().mockResolvedValue({
            records: [
              {
                departmentAssignmentId: "assignment-1",
                departmentId: "dept-platform",
                displayName: "Alice",
                organizationId: "org-child",
                organizationMembershipId: "membership-1",
                positionName: "Platform Lead",
                userId: "user-1",
              },
            ],
          }),
        },
        positions: {
          list: vi.fn().mockResolvedValue({
            items: [
              {
                departmentId: "dept-platform",
                name: "Platform Lead",
                positionId: "position-1",
              },
            ],
          }),
        },
        roleBindings: {
          list: vi.fn().mockResolvedValue({
            items: [
              {
                principalId: "membership-1",
                principalKind: "organization_membership",
                roleId: "role-admin",
                scopeId: "org-child",
                scopeKind: "organization",
              },
            ],
          }),
        },
      },
    };

    const controller = createSdkworkIamOrganizationController(service as never);

    await controller.listOrganizations({ tenantId: "tenant-1" });
    expect(controller.getState().tree).toMatchObject([
      {
        children: [
          {
            depth: 1,
            organizationId: "org-child",
          },
        ],
        depth: 0,
        organizationId: "org-root",
      },
    ]);

    await expect(controller.selectOrganization("org-child")).resolves.toMatchObject({
      organizationId: "org-child",
    });
    await expect(controller.listMemberships("org-child")).resolves.toEqual([
      {
        displayName: "Alice",
        email: "alice@example.com",
        id: "membership-1",
        membershipId: "membership-1",
        organizationId: "org-child",
        status: undefined,
        userId: "user-1",
        username: undefined,
      },
    ]);
    await expect(controller.addMembership("org-child", { userId: "user-2" })).resolves.toMatchObject({
      id: "membership-2",
      membershipId: "membership-2",
      organizationId: "org-child",
      userId: "user-2",
    });
    await expect(controller.listDepartments("org-child")).resolves.toMatchObject([
      {
        departmentId: "dept-root",
      },
      {
        departmentId: "dept-platform",
        parentDepartmentId: "dept-root",
      },
    ]);
    await expect(controller.buildDepartmentTree()).toMatchObject([
      {
        children: [
          {
            departmentId: "dept-platform",
            depth: 1,
          },
        ],
        departmentId: "dept-root",
        depth: 0,
      },
    ]);
    await expect(controller.listDepartmentAssignments("dept-platform")).resolves.toEqual([
      {
        assignmentId: "assignment-1",
        departmentId: "dept-platform",
        displayName: "Alice",
        id: "assignment-1",
        organizationId: "org-child",
        organizationMembershipId: "membership-1",
        positionName: "Platform Lead",
        status: undefined,
        userId: "user-1",
      },
    ]);
    await expect(controller.listPositions({ departmentId: "dept-platform" })).resolves.toMatchObject([
      {
        positionId: "position-1",
      },
    ]);
    await expect(controller.listRoleBindings({ scopeId: "org-child" })).resolves.toMatchObject([
      {
        principalId: "membership-1",
        scopeKind: "organization",
      },
    ]);

    expect(service.iam.organizations.list).toHaveBeenCalledWith({ tenantId: "tenant-1" });
    expect(service.iam.organizationMemberships.list).toHaveBeenCalledWith({ organizationId: "org-child" });
    expect(service.iam.organizationMemberships.create).toHaveBeenCalledWith({
      organizationId: "org-child",
      userId: "user-2",
    });
    expect(service.iam.departments.list).toHaveBeenCalledWith({ organizationId: "org-child" });
    expect(service.iam.departmentAssignments.list).toHaveBeenCalledWith({ departmentId: "dept-platform" });
    expect(service.iam.positions.list).toHaveBeenCalledWith({ departmentId: "dept-platform" });
    expect(service.iam.roleBindings.list).toHaveBeenCalledWith({ scopeId: "org-child" });
    expect(Object.prototype.hasOwnProperty.call(service.iam.organizations, "members")).toBe(false);
    expect(Object.prototype.hasOwnProperty.call(controller, "listMembers")).toBe(false);
    expect(Object.prototype.hasOwnProperty.call(controller, "addMember")).toBe(false);
    expect(Object.prototype.hasOwnProperty.call(controller.getState(), "members")).toBe(false);
  });

  it("builds organization trees without a controller", () => {
    expect(
      buildSdkworkIamOrganizationTree([
        {
          id: "root",
          name: "Root",
          organizationId: "root",
        },
        {
          id: "child",
          name: "Child",
          organizationId: "child",
          parentId: "root",
        },
      ]),
    ).toMatchObject([
      {
        children: [
          {
            depth: 1,
            organizationId: "child",
          },
        ],
        depth: 0,
        organizationId: "root",
      },
    ]);
  });
});
