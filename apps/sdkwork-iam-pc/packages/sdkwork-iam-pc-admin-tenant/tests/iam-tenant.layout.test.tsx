import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SdkworkIamTenantAdminWorkspace } from "../src";
import { SdkworkI18nProvider } from "@sdkwork/i18n-pc-react";

/**
 * Layout regression: the workspace root and every data table must fill the
 * available viewport height (flex chain) and render the shared page-number
 * pagination bar. These assertions protect the "auto-fit available height"
 * contract shared by all IAM admin list surfaces.
 */
function createController() {
  return {
    getState: () => ({
      applications: [],
      applicationSummary: { disabled: 0, enabled: 0, pending: 0, total: 0 },
      listPageInfo: {
        applications: { page: 1, pageSize: 20, totalItems: "0" },
        members: { page: 1, pageSize: 20, totalItems: "0" },
        tenants: { page: 1, pageSize: 20, totalItems: "1" },
      },
      members: [],
      status: "idle",
      tenants: [{ id: "tenant-1", name: "Acme", tenantId: "tenant-1" }],
    }),
    getApplicationCapabilities: () => ({ canEnable: false, canProvision: false, canUpdate: false }),
    listTenants: vi.fn().mockResolvedValue([{ id: "tenant-1", name: "Acme", tenantId: "tenant-1" }]),
    listTenantMembers: vi.fn().mockResolvedValue([]),
    listTenantApplications: vi.fn().mockResolvedValue([]),
    loadMoreTenants: vi.fn().mockResolvedValue([]),
    retrieveTenantApplicationSummary: vi.fn().mockResolvedValue({ disabled: 0, enabled: 0, pending: 0, total: 0 }),
    selectTenant: vi.fn().mockResolvedValue({ id: "tenant-1", name: "Acme", tenantId: "tenant-1" }),
  };
}

describe("tenant administration workspace layout", () => {
  it("fills the available height and renders page-number pagination", async () => {
    const controller = createController();
    const { container } = render(
      <SdkworkI18nProvider locale="zh-CN">
        <SdkworkIamTenantAdminWorkspace
          controller={controller as never}
          permissions={{
            members: { create: true, delete: true, read: true, update: true },
            tenants: { create: true, delete: true, update: true },
          }}
        />
      </SdkworkI18nProvider>,
    );

    await waitFor(() => expect(screen.getByText("Acme")).toBeTruthy());

    // Root fills the host viewport.
    expect(container.querySelector(".flex.h-full.min-h-0.flex-col")).toBeTruthy();

    // The tenants table stretches to fill leftover space.
    const table = container.querySelector('[data-sdk-ui="data-table"]');
    expect(table?.className).toContain("min-h-0 flex-1");

    // Surface stretches inside the table root; the viewport scrolls; footer stays put.
    const surface = container.querySelector('[data-slot="data-table-surface"]');
    expect(surface?.className).toContain("flex-1");
    expect(surface?.className).toContain("min-h-0");
    const viewport = container.querySelector('[data-slot="table-viewport"]');
    expect(viewport?.className).toContain("min-h-0 flex-1");
    expect(viewport?.className).toContain("overflow-auto");

    // Sticky table header is enabled.
    expect(container.querySelector('[data-slot="table-header"] th.sticky') ?? container.querySelector("thead th.sticky")).toBeTruthy();

    // Page-number pagination bar (total + page buttons + page-size select).
    await waitFor(() => expect(screen.getByText("共 1 条")).toBeTruthy());
    expect(screen.getByRole("button", { name: "1" })).toBeTruthy();
    expect(screen.getByRole("combobox", { name: "每页" })).toBeTruthy();
    expect(controller.listTenants).toHaveBeenCalledWith({ page: 1, page_size: 20 });
  });
});
