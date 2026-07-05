import { describe, expect, it, vi } from "vitest";

import { createSdkworkIamUserAdminController } from "../src/index";

describe("@sdkwork/iam-pc-admin-user", () => {
  it("lists and selects users through the standard IAM backend service", async () => {
    const service = {
      iam: {
        users: {
          list: vi.fn().mockResolvedValue({
            items: [
              {
                displayName: "Alice",
                email: "alice@example.com",
                id: "1",
                userId: "1",
                username: "alice",
              },
            ],
          }),
          retrieve: vi.fn().mockResolvedValue({
            displayName: "Alice",
            id: "1",
            userId: "1",
          }),
        },
      },
    };

    const controller = createSdkworkIamUserAdminController({
      selectedUserId: "1",
      service: service as never,
    });

    await expect(controller.listUsers()).resolves.toEqual([
      {
        displayName: "Alice",
        email: "alice@example.com",
        id: "1",
        phone: undefined,
        status: undefined,
        userId: "1",
        username: "alice",
      },
    ]);
    await expect(controller.selectUser("1")).resolves.toMatchObject({ userId: "1" });
    expect(service.iam.users.list).toHaveBeenCalledWith({ page_size: 20 });
    expect(controller.getSelectedUser()).toMatchObject({ userId: "1" });
  });

  it("creates, updates, and deletes users through backend IAM resources", async () => {
    const service = {
      iam: {
        users: {
          create: vi.fn().mockResolvedValue({ userId: "user-2", username: "bob", email: "bob@example.com" }),
          update: vi.fn().mockResolvedValue({ userId: "user-2", displayName: "Bob Updated" }),
          delete: vi.fn().mockResolvedValue(undefined),
          list: vi.fn().mockResolvedValue({ items: [] }),
          retrieve: vi.fn().mockResolvedValue({ userId: "user-2" }),
        },
      },
    };

    const controller = createSdkworkIamUserAdminController({ service: service as never });

    await expect(controller.createUser({ username: "bob", email: "bob@example.com" })).resolves.toMatchObject({
      userId: "user-2",
    });
    await expect(controller.updateUser("user-2", { displayName: "Bob Updated" })).resolves.toMatchObject({
      displayName: "Bob Updated",
    });
    await controller.deleteUser("user-2");

    expect(service.iam.users.create).toHaveBeenCalledWith({ username: "bob", email: "bob@example.com" });
    expect(service.iam.users.update).toHaveBeenCalledWith("user-2", { displayName: "Bob Updated" });
    expect(service.iam.users.delete).toHaveBeenCalledWith("user-2");
  });
});
