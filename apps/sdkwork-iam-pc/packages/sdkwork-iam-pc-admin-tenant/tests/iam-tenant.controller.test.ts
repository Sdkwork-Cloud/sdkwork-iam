import { describe, expect, it, vi } from "vitest";

import { createSdkworkIamTenantController } from "../src/index";

describe("@sdkwork/iam-pc-admin-tenant", () => {
  it("lists tenants, selects tenant context, and loads tenant members through the standard IAM service", async () => {
    const service = {
      iam: {
        tenants: {
          list: vi.fn().mockResolvedValue({
            items: [
              {
                code: "SDKWORK",
                name: "SDKWork",
                tenantId: "100001",
              },
            ],
          }),
          members: {
            list: vi.fn().mockResolvedValue({
              items: [
                {
                  displayName: "Alice",
                  tenantId: "100001",
                  userId: "1",
                },
              ],
            }),
          },
        },
      },
    };

    const controller = createSdkworkIamTenantController({
      selectedTenantId: "100001",
      service: service as never,
    });

    await expect(controller.listTenants({ page_size: 20 })).resolves.toEqual([
      {
        code: "SDKWORK",
        id: "100001",
        name: "SDKWork",
        status: undefined,
        tenantId: "100001",
      },
    ]);
    await expect(controller.selectTenant("100001")).resolves.toMatchObject({
      tenantId: "100001",
    });
    await expect(controller.listTenantMembers("100001")).resolves.toEqual([
      {
        displayName: "Alice",
        email: undefined,
        id: "1",
        roleCode: undefined,
        status: undefined,
        tenantId: "100001",
        userId: "1",
        username: undefined,
      },
    ]);

    expect(service.iam.tenants.list).toHaveBeenCalledWith({ page_size: 20 });
    expect(service.iam.tenants.members.list).toHaveBeenCalledWith("100001", { page_size: 20 });
    expect(controller.getSelectedTenant()).toMatchObject({
      tenantId: "100001",
    });
    expect(controller.getState()).toMatchObject({
      status: "ready",
      tenants: [
        {
          tenantId: "100001",
        },
      ],
    });
  });

  it("creates, updates, and deletes tenants and members through backend IAM resources", async () => {
    const service = {
      iam: {
        tenants: {
          create: vi.fn().mockResolvedValue({ tenantId: "200001", name: "Acme", code: "ACME" }),
          update: vi.fn().mockResolvedValue({ tenantId: "200001", name: "Acme Updated", code: "ACME" }),
          delete: vi.fn().mockResolvedValue(undefined),
          list: vi.fn().mockResolvedValue({ items: [] }),
          members: {
            create: vi.fn().mockResolvedValue({ userId: "user-2", roleCode: "admin" }),
            delete: vi.fn().mockResolvedValue(undefined),
            list: vi.fn().mockResolvedValue({ items: [] }),
            update: vi.fn().mockResolvedValue({ userId: "user-2", roleCode: "member" }),
          },
        },
      },
    };

    const controller = createSdkworkIamTenantController({ service: service as never });

    await expect(controller.createTenant({ name: "Acme", code: "ACME" })).resolves.toMatchObject({
      tenantId: "200001",
      name: "Acme",
    });
    await expect(controller.updateTenant("200001", { name: "Acme Updated" })).resolves.toMatchObject({
      name: "Acme Updated",
    });
    await expect(controller.createTenantMember("200001", { userId: "user-2", roleCode: "admin" })).resolves.toMatchObject({
      userId: "user-2",
      roleCode: "admin",
    });
    await expect(controller.updateTenantMember("200001", "user-2", { roleCode: "member" })).resolves.toMatchObject({
      roleCode: "member",
    });
    await controller.removeTenantMember("200001", "user-2");
    await controller.deleteTenant("200001");

    expect(service.iam.tenants.create).toHaveBeenCalledWith({ name: "Acme", code: "ACME" });
    expect(service.iam.tenants.update).toHaveBeenCalledWith("200001", { name: "Acme Updated" });
    expect(service.iam.tenants.members.create).toHaveBeenCalledWith("200001", { userId: "user-2", roleCode: "admin" });
    expect(service.iam.tenants.members.delete).toHaveBeenCalledWith("200001", "user-2");
    expect(service.iam.tenants.delete).toHaveBeenCalledWith("200001");
  });

  it("manages multiple applications within one tenant through the backend IAM service", async () => {
    const application = {
      accessPermissions: ["iam.users.read"],
      appId: "app_crm_prod",
      displayName: "CRM",
      environment: "production",
      instanceKey: "crm-production",
      organizationId: "0",
      primaryDomain: "crm.example.com",
      status: "pending_config",
      templateId: "tmpl_crm",
      tenantApplicationId: "tapp_crm",
      tenantId: "tenant-1",
    };
    const service = {
      iam: {
        tenantApplications: {
          list: vi.fn().mockResolvedValue({ items: [application] }),
          management: {
            disable: vi.fn().mockResolvedValue({ ...application, status: "disabled" }),
            enable: vi.fn().mockResolvedValue({ ...application, status: "enabled" }),
            create: vi.fn().mockResolvedValue(application),
            update: vi.fn().mockResolvedValue({ ...application, primaryDomain: "crm.acme.com" }),
          },
          summary: {
            retrieve: vi.fn().mockResolvedValue({ disabled: 0, enabled: 0, pending: 1, total: 1 }),
          },
        },
      },
    };
    const controller = createSdkworkIamTenantController({
      permissionScope: [
        "iam.tenant_applications.provision",
        "iam.tenant_applications.update",
        "iam.tenant_applications.enable",
      ],
      service: service as never,
    });

    await expect(controller.listTenantApplications("tenant-1", { page_size: 20 })).resolves.toMatchObject([
      { appId: "app_crm_prod", tenantApplicationId: "tapp_crm" },
    ]);
    await expect(controller.retrieveTenantApplicationSummary("tenant-1")).resolves.toEqual({
      disabled: 0,
      enabled: 0,
      pending: 1,
      total: 1,
    });
    await expect(controller.provisionTenantApplication("tenant-1", {
      accessPermissions: ["iam.users.read"],
      appKey: "crm",
      displayName: "CRM",
      environment: "production",
      instanceKey: "crm-production",
      organizationId: "0",
      primaryDomain: "crm.example.com",
    })).resolves.toMatchObject({ tenantApplicationId: "tapp_crm" });
    await expect(controller.updateTenantApplication("tenant-1", "tapp_crm", {
      accessPermissions: ["iam.users.read"],
      primaryDomain: "crm.acme.com",
    })).resolves.toMatchObject({ primaryDomain: "crm.acme.com" });
    await expect(controller.setTenantApplicationEnabled("tenant-1", "tapp_crm", true)).resolves.toMatchObject({ status: "enabled" });
    await expect(controller.setTenantApplicationEnabled("tenant-1", "tapp_crm", false)).resolves.toMatchObject({ status: "disabled" });

    expect(service.iam.tenantApplications.list).toHaveBeenCalledWith("tenant-1", { page_size: 20 });
    expect(service.iam.tenantApplications.management.create).toHaveBeenCalledWith("tenant-1", expect.objectContaining({ appKey: "crm" }));
    expect(service.iam.tenantApplications.management.update).toHaveBeenCalledWith("tenant-1", "tapp_crm", expect.objectContaining({ primaryDomain: "crm.acme.com" }));
    expect(service.iam.tenantApplications.management.enable).toHaveBeenCalledWith("tenant-1", "tapp_crm");
    expect(service.iam.tenantApplications.management.disable).toHaveBeenCalledWith("tenant-1", "tapp_crm");
    expect(controller.getApplicationCapabilities()).toEqual({ canEnable: true, canProvision: true, canUpdate: true });
  });
});
