import { describe, expect, it } from "vitest";

import {
  canAccessBackendApi,
  createIamAppContext,
  createIamUserSurface,
  resolveIamBackendOperationPermission,
  SDKWORK_STANDARD_ROLE_CODE_LIST,
  SDKWORK_STANDARD_ROLE_CODES,
} from "../src/index";

describe("SDKWork permission standard contracts", () => {
  it("defines eight immutable standard role codes", () => {
    expect(SDKWORK_STANDARD_ROLE_CODE_LIST).toHaveLength(8);
    expect(SDKWORK_STANDARD_ROLE_CODES.APP_USER).toBe("app_user");
    expect(SDKWORK_STANDARD_ROLE_CODES.ORG_ADMIN).toBe("org_admin");
    expect(SDKWORK_STANDARD_ROLE_CODES.PLATFORM_SUPER_ADMIN).toBe("platform_super_admin");
  });

  it("models user surface and backend access gate", () => {
    const appOnly = createIamAppContext({
      appId: "app",
      authLevel: "password",
      dataScope: [],
      deploymentMode: "saas",
      environment: "dev",
      permissionScope: ["iam:self"],
      sessionId: "session",
      tenantId: "tenant",
      userId: "user",
      userSurface: createIamUserSurface({ app: true, organizationMember: false }),
    });
    expect(canAccessBackendApi(appOnly)).toBe(false);

    const admin = createIamAppContext({
      ...appOnly,
      organizationId: "org",
      userSurface: createIamUserSurface({ app: true, organizationMember: true }),
      standardRoleCodes: [SDKWORK_STANDARD_ROLE_CODES.ORG_ADMIN],
    });
    expect(canAccessBackendApi(admin)).toBe(true);
  });

  it("maps backend operations to permission codes", () => {
    expect(resolveIamBackendOperationPermission("users.list")).toBe("iam.users.read");
    expect(resolveIamBackendOperationPermission("iam.oauth.integrations.create")).toBe(
      "iam.oauth.manage",
    );
  });
});
