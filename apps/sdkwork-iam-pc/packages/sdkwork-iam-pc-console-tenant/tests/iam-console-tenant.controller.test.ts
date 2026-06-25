import { describe, expect, it, vi } from "vitest";

import { createSdkworkIamConsoleTenantController } from "../src/index";

describe("@sdkwork/iam-pc-console-tenant", () => {
  it("loads runtime context, organizations, and memberships through the app IAM service", async () => {
    const service = {
      system: {
        iam: {
          runtime: {
            retrieve: vi.fn().mockResolvedValue({
              tenantId: "100001",
              userId: "user-1",
              environment: "dev",
              deploymentMode: "saas",
            }),
          },
        },
      },
      iam: {
        organizations: {
          list: vi.fn().mockResolvedValue({
            items: [{ organizationId: "org-1", name: "Primary Org" }],
          }),
        },
        organizationMemberships: {
          list: vi.fn().mockResolvedValue({
            items: [{ id: "m-1", userId: "user-1", organizationId: "org-1", roleCode: "owner" }],
          }),
        },
      },
    };

    const controller = createSdkworkIamConsoleTenantController({ service: service as never });

    await expect(controller.refreshWorkspace()).resolves.toMatchObject({
      runtime: { tenantId: "100001", userId: "user-1" },
      organizations: [{ organizationId: "org-1", name: "Primary Org" }],
      memberships: [{ userId: "user-1", organizationId: "org-1", roleCode: "owner" }],
    });

    expect(service.system.iam.runtime.retrieve).toHaveBeenCalled();
    expect(service.iam.organizations.list).toHaveBeenCalled();
    expect(service.iam.organizationMemberships.list).toHaveBeenCalled();
  });
});
