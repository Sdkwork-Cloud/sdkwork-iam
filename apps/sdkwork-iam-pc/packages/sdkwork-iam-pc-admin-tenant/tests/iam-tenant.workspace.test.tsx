import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SdkworkIamTenantAdminWorkspace } from "../src";
import { SdkworkI18nProvider } from "@sdkwork/i18n-pc-react";

function createController() {
  return {
    getState: () => ({ applications: [], applicationSummary: { disabled: 0, enabled: 0, pending: 0, total: 0 }, members: [], status: "idle", tenants: [] }),
    listTenants: vi.fn().mockResolvedValue([{ id: "tenant-1", name: "Acme", tenantId: "tenant-1" }]),
    getApplicationCapabilities: () => ({ canEnable: false, canProvision: false, canUpdate: false }),
    listTenantApplications: vi.fn().mockResolvedValue([]),
    loadMoreTenants: vi.fn().mockResolvedValue([]),
    retrieveTenantApplicationSummary: vi.fn().mockResolvedValue({ disabled: 0, enabled: 0, pending: 0, total: 0 }),
    selectTenant: vi.fn().mockResolvedValue({ id: "tenant-1", name: "Acme", tenantId: "tenant-1" }),
  };
}

describe("tenant administration workspace", () => {
  it("uses server-side tenant search and keeps read-only operators out of mutation flows", async () => {
    const controller = createController();
    render(
      <SdkworkI18nProvider locale="zh-CN">
        <SdkworkIamTenantAdminWorkspace
          controller={controller as never}
          permissions={{
            members: { create: false, delete: false, read: false, update: false },
            tenants: { create: false, delete: false, update: false },
          }}
        />
      </SdkworkI18nProvider>,
    );

    await screen.findByText("Acme");
    expect(screen.queryByRole("button", { name: "创建租户" })).toBeNull();
    expect(screen.queryByRole("button", { name: "编辑租户" })).toBeNull();
    expect(screen.queryByRole("button", { name: "删除" })).toBeNull();

    fireEvent.change(screen.getByRole("textbox", { name: "搜索租户" }), { target: { value: "Acme" } });
    fireEvent.click(screen.getByRole("button", { name: "搜索" }));
    await waitFor(() => expect(controller.listTenants).toHaveBeenLastCalledWith({ q: "Acme", page: 1, page_size: 20 }));

    fireEvent.click(screen.getByRole("button", { name: "管理" }));
    // The applications panel opens; its filter form sits above the table.
    await screen.findByRole("search");
    expect(screen.queryByRole("button", { name: "成员" })).toBeNull();
  });
});
