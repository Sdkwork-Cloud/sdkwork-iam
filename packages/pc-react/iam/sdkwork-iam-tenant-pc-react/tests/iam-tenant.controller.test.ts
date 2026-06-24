import { describe, expect, it, vi } from "vitest";

import { createSdkworkIamTenantController } from "../src/index";

describe("@sdkwork/iam-tenant-pc-react", () => {
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
                  userId: "user-1",
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
        id: "user-1",
        roleCode: undefined,
        status: undefined,
        tenantId: "100001",
        userId: "user-1",
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
});
