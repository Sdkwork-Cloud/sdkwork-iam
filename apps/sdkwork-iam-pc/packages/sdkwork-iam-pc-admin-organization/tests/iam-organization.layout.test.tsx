import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SdkworkIamOrganizationAdminWorkspace } from "../src";
import { SdkworkI18nProvider } from "@sdkwork/i18n-pc-react";

/**
 * Layout regression: the workspace root and every data table (main list and
 * detail tab tables) must fill the available viewport height via the flex
 * chain, and every list must render the shared page-number pagination bar.
 */
function createController() {
  const organization = { id: "org-1", name: "Platform", organizationId: "org-1" };
  return {
    getState: () => ({
      departments: [],
      departmentAssignments: [],
      departmentTree: [],
      departmentListPageInfo: { page: 1, pageSize: 20, totalItems: "0" },
      memberships: [],
      membershipListPageInfo: { page: 1, pageSize: 20, totalItems: "0" },
      organizationListPageInfo: { page: 1, pageSize: 20, totalItems: "1" },
      organizations: [],
      positionListPageInfo: { page: 1, pageSize: 20, totalItems: "0" },
      positions: [],
      roleBindingListPageInfo: { page: 1, pageSize: 20, totalItems: "0" },
      roleBindings: [],
      status: "idle",
      tree: [],
    }),
    buildDepartmentTree: (items: unknown[]) => items,
    listDepartments: vi.fn().mockResolvedValue([]),
    listMemberships: vi.fn().mockResolvedValue([]),
    listOrganizations: vi.fn().mockResolvedValue([organization]),
    listPositions: vi.fn().mockResolvedValue([]),
    listRoleBindings: vi.fn().mockResolvedValue([]),
    loadMoreOrganizations: vi.fn().mockResolvedValue([]),
    selectOrganization: vi.fn().mockResolvedValue(organization),
  };
}

describe("organization administration workspace layout", () => {
  it("fills the available height for the main table and the detail section tables", async () => {
    const controller = createController();
    const { container } = render(
      <SdkworkI18nProvider locale="zh-CN">
        <SdkworkIamOrganizationAdminWorkspace
          controller={controller as never}
          permissions={{
            departments: { create: true, delete: true, read: true, update: true },
            memberships: { create: true, read: true, update: true },
            organizations: { create: true, delete: true, update: true },
            positions: { read: true },
            roleBindings: { read: true },
          }}
        />
      </SdkworkI18nProvider>,
    );

    await waitFor(() => expect(screen.getByText("Platform")).toBeTruthy());

    // Root fills the host viewport.
    expect(container.querySelector(".flex.h-full.min-h-0.flex-col")).toBeTruthy();

    // Main table stretches; the surface fills the table root; the viewport scrolls.
    const mainTable = container.querySelector('[data-sdk-ui="data-table"]');
    expect(mainTable?.className).toContain("min-h-0 flex-1");
    const surface = container.querySelector('[data-slot="data-table-surface"]');
    expect(surface?.className).toContain("flex-1");
    const viewport = container.querySelector('[data-slot="table-viewport"]');
    expect(viewport?.className).toContain("min-h-0 flex-1");
    expect(viewport?.className).toContain("overflow-auto");

    // Page-number pagination bar renders for the main list.
    await waitFor(() => expect(screen.getByText("共 1 条")).toBeTruthy());
    expect(controller.listOrganizations).toHaveBeenCalledWith({ page: 1, page_size: 20 });

    // Selecting an organization switches the main table to natural height and
    // the detail section fills the remaining viewport height.
    fireEvent.click(screen.getByRole("button", { name: "查看详情" }));
    await waitFor(() => expect(screen.getByText("正在管理 Platform")).toBeTruthy());

    const detailSection = container.querySelector("section.flex.min-h-0.flex-1.flex-col");
    expect(detailSection).toBeTruthy();

    const tables = container.querySelectorAll('[data-sdk-ui="data-table"]');
    const detailTable = [...tables].find((table) => table.className.includes("min-h-0 flex-1"));
    expect(detailTable).toBeTruthy();
  });
});
