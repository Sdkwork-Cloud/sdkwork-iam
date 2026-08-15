import { render, screen, waitFor } from "@testing-library/react";
import { SdkworkI18nProvider } from "@sdkwork/i18n-pc-react";
import { describe, expect, it, vi } from "vitest";

import {
  createSdkworkIamTenantController,
  SdkworkIamTenantApplicationsAdminWorkspace,
} from "../src";

describe("tenant applications admin workspace", () => {
  it("targets the current tenant without a tenant picker or page header", async () => {
    const service = {
      iam: {
        tenants: {
          list: vi.fn().mockResolvedValue({
            items: [{ code: "ACME", name: "Acme", status: "active", tenantId: "tenant-1" }],
          }),
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
      selectedTenantId: "tenant-1",
      service: service as never,
    });

    render(
      <SdkworkI18nProvider locale="zh-CN">
        <SdkworkIamTenantApplicationsAdminWorkspace controller={controller} />
      </SdkworkI18nProvider>,
    );

    // The current tenant's applications load directly; no tenant picker
    // and no standalone page header are rendered. The only search surface is
    // the application filter form above the table.
    await screen.findByText("CRM");
    expect(screen.queryByRole("combobox", { name: "选择租户" })).toBeNull();
    expect(screen.getByRole("search")).toBeTruthy();
    expect(screen.queryByText("应用列表")).toBeNull();
    // The application type column renders from the response payload.
    expect(screen.getAllByText("PC").length).toBeGreaterThan(0);
    expect(screen.getAllByText("应用类型").length).toBeGreaterThan(0);
    expect(service.iam.tenantApplications.list).toHaveBeenCalledWith("tenant-1", { page: 1, page_size: 20 });
    await waitFor(() => expect(service.iam.tenantApplications.summary.retrieve).toHaveBeenCalledWith("tenant-1"));
  });
});
