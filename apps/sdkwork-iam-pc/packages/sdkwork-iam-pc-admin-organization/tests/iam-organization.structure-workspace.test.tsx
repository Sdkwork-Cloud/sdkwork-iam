import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SdkworkIamOrganizationStructureWorkspace } from "../src";

describe("organization structure workspace", () => {
  it("renders a department tree beside the selected department member directory", async () => {
    const departmentTree = [{
      children: [],
      departmentId: "dept-product",
      depth: 0,
      id: "dept-product",
      name: "产品研发",
      organizationId: "org-1",
    }];
    const controller = {
      buildDepartmentTree: vi.fn().mockReturnValue(departmentTree),
      getState: vi.fn().mockReturnValue({
        departmentAssignments: [],
        departmentTree,
        departments: [],
        memberships: [],
        organizations: [],
        positions: [],
        roleBindings: [],
        status: "idle",
        tree: [],
      }),
      listDepartmentAssignments: vi.fn().mockResolvedValue([{
        assignmentId: "da-1",
        departmentId: "dept-product",
        displayName: "Alice",
        id: "da-1",
        isPrimary: true,
        userId: "user-1",
      }]),
      listDepartments: vi.fn().mockResolvedValue(departmentTree),
      listMemberships: vi.fn().mockResolvedValue([]),
      selectOrganization: vi.fn().mockResolvedValue({ id: "org-1", name: "SDKWork", organizationId: "org-1" }),
    };

    render(<SdkworkIamOrganizationStructureWorkspace controller={controller as never} organizationId="org-1" />);

    await screen.findByText("部门结构");
    expect(screen.getAllByText("产品研发").length).toBeGreaterThan(0);
    await screen.findByText("Alice");
    expect(screen.getAllByText("user-1").length).toBeGreaterThan(0);
    expect(screen.queryByRole("button", { name: /移出/ })).toBeNull();
    await waitFor(() => expect(controller.listDepartmentAssignments).toHaveBeenCalledWith("dept-product", undefined));
  });
});
