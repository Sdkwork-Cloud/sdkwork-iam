import { describe, expect, it, vi } from "vitest";

import { createSdkworkIamConsoleOrganizationController } from "../src/index";

describe("@sdkwork/iam-pc-console-organization", () => {
  it("loads organizations, departments, and memberships through the app IAM service", async () => {
    const service = {
      iam: {
        organizations: {
          list: vi.fn().mockResolvedValue({
            items: [{ organizationId: "org-1", name: "HQ" }],
          }),
        },
        departments: {
          list: vi.fn().mockResolvedValue({
            items: [{ departmentId: "dept-1", name: "Engineering", organizationId: "org-1" }],
          }),
        },
        organizationMemberships: {
          list: vi.fn().mockResolvedValue({
            items: [{ userId: "1", displayName: "Alice", organizationId: "org-1" }],
          }),
        },
      },
    };

    const controller = createSdkworkIamConsoleOrganizationController({ service: service as never });

    await expect(controller.refreshWorkspace("org-1")).resolves.toMatchObject({
      organizations: [{ organizationId: "org-1", name: "HQ" }],
      departments: [{ departmentId: "dept-1" }],
      memberships: [{ userId: "1" }],
    });

    expect(service.iam.organizations.list).toHaveBeenCalled();
    expect(service.iam.departments.list).toHaveBeenCalledWith({ organizationId: "org-1" });
    expect(service.iam.organizationMemberships.list).toHaveBeenCalledWith({ organizationId: "org-1" });
  });
});
