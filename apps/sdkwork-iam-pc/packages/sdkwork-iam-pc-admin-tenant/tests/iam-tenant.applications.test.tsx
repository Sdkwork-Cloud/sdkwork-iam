import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { SdkworkI18nProvider } from "@sdkwork/i18n-pc-react";
import { describe, expect, it, vi } from "vitest";

import {
  createSdkworkIamTenantController,
  SdkworkIamTenantAdminWorkspace,
} from "../src";

describe("tenant application workspace", () => {
  it("opens a tenant application workspace with summary, list, and registration flow", async () => {
    const service = {
      iam: {
        tenants: {
          list: vi.fn().mockResolvedValue({
            items: [{ code: "ACME", name: "Acme", status: "active", tenantId: "tenant-1" }],
          }),
          members: { list: vi.fn().mockResolvedValue({ items: [] }) },
        },
        tenantApplications: {
          list: vi.fn().mockResolvedValue({
            items: [{
              accessPermissions: ["iam.users.read"],
              appId: "app_crm_prod",
              applicationType: "pc",
              displayName: "CRM",
              environment: "production",
              instanceKey: "crm-production",
              organizationId: "0",
              primaryDomain: "crm.example.com",
              status: "enabled",
              templateId: "tmpl_crm",
              tenantApplicationId: "tapp_crm",
              tenantId: "tenant-1",
            }],
          }),
          management: {
            disable: vi.fn(),
            enable: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
          },
          summary: {
            retrieve: vi.fn().mockResolvedValue({ disabled: 0, enabled: 1, pending: 0, total: 1 }),
          },
        },
      },
    };
    const controller = createSdkworkIamTenantController({
      permissionScope: ["iam.tenant_applications.*"],
      service: service as never,
    });

    render(<SdkworkI18nProvider locale="zh-CN"><SdkworkIamTenantAdminWorkspace controller={controller} /></SdkworkI18nProvider>);

    await screen.findByText("Acme");
    fireEvent.click(screen.getByRole("button", { name: "管理" }));

    await screen.findByText("CRM");
    // The table header row was removed: the filter form sits directly above
    // the table and the register action moved into the same row.
    expect(screen.getAllByRole("search").length).toBeGreaterThan(0);
    expect(screen.getByText("crm.example.com")).toBeTruthy();
    expect(screen.getByText("应用总数")).toBeTruthy();
    expect(service.iam.tenantApplications.list).toHaveBeenCalledWith("tenant-1", { page: 1, page_size: 20 });

    fireEvent.click(screen.getByRole("button", { name: "注册应用" }));
    expect(screen.getByText("注册租户应用")).toBeTruthy();
    expect(screen.getByText("已注册应用标识")).toBeTruthy();

    await waitFor(() => expect(service.iam.tenantApplications.summary.retrieve).toHaveBeenCalledWith("tenant-1"));
  });
});
