import { describe, expect, it, vi } from "vitest";

import { createSdkworkIamTenantController } from "../src/index";

describe("@sdkwork/iam-pc-admin-tenant", () => {
  it("lists tenants, selects tenant context, and loads tenant members through the standard IAM service", async () => {
    const service = {
      iam: {
        tenants: {
          list: vi.fn().mockResolvedValue({
            records: [
              {
                code: "SDKWORK",
                name: "SDKWork",
                tenantId: "100001",
              },
            ],
          }),
          members: {
            list: vi.fn().mockResolvedValue({
              data: [
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
    expect(service.iam.tenants.members.list).toHaveBeenCalledWith("100001", undefined);
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
          list: vi.fn().mockResolvedValue({ records: [] }),
          members: {
            create: vi.fn().mockResolvedValue({ userId: "user-2", roleCode: "admin" }),
            delete: vi.fn().mockResolvedValue(undefined),
            list: vi.fn().mockResolvedValue({ records: [] }),
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
});
