import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  createSdkworkIamPermissionController,
  RequireBackendAccess,
  RequireOrganizationMember,
  RequirePermission,
  SdkworkIamPermissionProvider,
} from "../src/index";

function createTestController() {
  return createSdkworkIamPermissionController({
    permissionScope: ["iam.users.read"],
    service: { iam: {} } as never,
    standardRoleCodes: ["org_admin"],
    userSurface: { app: true, organizationMember: true },
  });
}

describe("IAM permission guards", () => {
  it("renders children when permission and organization checks pass", () => {
    const controller = createTestController();

    render(
      <SdkworkIamPermissionProvider controller={controller}>
        <RequireOrganizationMember>
          <RequirePermission hint="iam.users.read">
            <div>admin-panel</div>
          </RequirePermission>
        </RequireOrganizationMember>
      </SdkworkIamPermissionProvider>,
    );

    expect(screen.getByText("admin-panel")).toBeTruthy();
  });

  it("renders fallback when permission is denied", () => {
    const controller = createTestController();

    render(
      <RequirePermission controller={controller} fallback={<div>denied</div>} hint="iam.users.delete">
        <div>admin-panel</div>
      </RequirePermission>,
    );

    expect(screen.getByText("denied")).toBeTruthy();
    expect(screen.queryByText("admin-panel")).toBeNull();
  });

  it("blocks backend surface for app-only users", () => {
    const controller = createSdkworkIamPermissionController({
      permissionScope: ["iam.users.read"],
      service: { iam: {} } as never,
      userSurface: { app: true, organizationMember: false },
    });

    render(
      <RequireBackendAccess controller={controller} fallback={<div>app-only</div>}>
        <div>backend</div>
      </RequireBackendAccess>,
    );

    expect(screen.getByText("app-only")).toBeTruthy();
    expect(screen.queryByText("backend")).toBeNull();
  });
});
