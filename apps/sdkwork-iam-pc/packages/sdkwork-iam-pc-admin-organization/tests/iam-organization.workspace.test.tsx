import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SdkworkIamOrganizationAdminWorkspace } from "../src";

function createController() {
  const organization = { id: "org-1", name: "Platform", organizationId: "org-1" };
  return {
    getState: () => ({ departments: [], departmentAssignments: [], departmentTree: [], memberships: [], organizations: [], positions: [], roleBindings: [], status: "idle", tree: [] }),
    listDepartments: vi.fn().mockResolvedValue([]),
    listMemberships: vi.fn().mockResolvedValue([]),
    listOrganizations: vi.fn().mockResolvedValue([organization]),
    listPositions: vi.fn().mockResolvedValue([]),
    listRoleBindings: vi.fn().mockResolvedValue([]),
    loadMoreOrganizations: vi.fn().mockResolvedValue([]),
    selectOrganization: vi.fn().mockResolvedValue(organization),
  };
}

describe("organization administration workspace", () => {
  it("searches the server and does not expose or load unauthorized administration domains", async () => {
    const controller = createController();
    render(
      <SdkworkIamOrganizationAdminWorkspace
        controller={controller as never}
        permissions={{
          departments: { create: false, delete: false, read: false, update: false },
          memberships: { create: false, read: false, update: false },
          organizations: { create: false, delete: false, update: false },
          positions: { read: false },
          roleBindings: { read: false },
        }}
      />,
    );

    await screen.findByText("Platform");
    expect(screen.queryByRole("button", { name: "创建组织" })).toBeNull();
    expect(screen.queryByRole("button", { name: "编辑组织" })).toBeNull();
    expect(screen.queryByRole("button", { name: "删除" })).toBeNull();

    fireEvent.change(screen.getByRole("textbox", { name: "搜索组织" }), { target: { value: "Platform" } });
    fireEvent.click(screen.getByRole("button", { name: "搜索" }));
    await waitFor(() => expect(controller.listOrganizations).toHaveBeenLastCalledWith({ q: "Platform" }));

    fireEvent.click(screen.getByRole("button", { name: "查看详情" }));
    await screen.findByText("正在管理 Platform");
    expect(controller.listDepartments).not.toHaveBeenCalled();
    expect(controller.listMemberships).not.toHaveBeenCalled();
    expect(controller.listPositions).not.toHaveBeenCalled();
    expect(controller.listRoleBindings).not.toHaveBeenCalled();
  });
});
