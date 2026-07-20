import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { SdkworkIamUserAdminWorkspace } from "../src/index";

const user = {
  displayName: "Alice Example",
  email: "alice@example.com",
  id: "user-1",
  status: "active",
  userId: "user-1",
  username: "alice",
};

function createController() {
  return {
    createUser: async () => user,
    deleteUser: async () => undefined,
    getSelectedUser: () => undefined,
    getState: () => ({ status: "ready" as const, users: [user] }),
    listUsers: async () => [user],
    loadMoreUsers: async () => [user],
    retrieveUser: async () => user,
    selectUser: async () => user,
    updateUser: async () => user,
  };
}

describe("IAM user administration workspace", () => {
  afterEach(cleanup);

  it("is read-only unless write permissions are explicitly supplied", async () => {
    render(<SdkworkIamUserAdminWorkspace controller={createController()} />);

    await waitFor(() => expect(screen.getByRole("button", { name: "View user: Alice Example" })).toBeTruthy());

    expect(screen.queryByRole("button", { name: "Create user" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Edit user: Alice Example" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Delete user: Alice Example" })).toBeNull();
  });

  it("shows only the user actions granted to the operator", async () => {
    render(
      <SdkworkIamUserAdminWorkspace
        controller={createController()}
        permissions={{ create: true, delete: false, update: true }}
      />,
    );

    await waitFor(() => expect(screen.getByRole("button", { name: "Edit user: Alice Example" })).toBeTruthy());
    expect(screen.getByRole("button", { name: "Create user" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Delete user: Alice Example" })).toBeNull();
  });
});
